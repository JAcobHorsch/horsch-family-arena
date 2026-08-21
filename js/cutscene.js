// ===== Cutscene engine: a scripted timeline over the game's own renderer =====
//
// A cutscene is data. Steps run in order; each either finishes on its own clock
// or waits for a tap. Actors are real fighters posed by the engine, so cutscene
// Todd is the same Todd you play, upgrades and all.
//
//   CUTSCENES['ch1-josh'] = {
//     stage: 'home-day',        // key into window.STAGE_ART
//     camX: 240,                 // where the camera sits
//     actors: { todd: {char:'todd', x:300, facing:1}, josh: {char:'josh', boss:true, x:620, facing:-1} },
//     steps: [ {say:'josh', text:'...'}, {move:{who:'josh', x:400, dur:0.6}}, ... ],
//   }
//
// STEP KINDS
//   {wait: 0.6}                                  hold
//   {say: 'todd', text: '...', dur: 2.2}         bubble; taps through, auto-advances at dur
//   {set: {who, x, y, facing, pose, ext, hide}}  instant change
//   {move: {who, x, y, dur, arc}}                glide, optional arc height
//   {pose: {who, pose, ext}}                     pose only ('idle'|'punch'|'kick'|'windup'|'strike'|'hurt')
//   {cam: {x, zoom, dur}}                        camera move
//   {shake: 0.6}  {flash: '#fff'}  {sfx: 'heavy'}
//   {fx: 'knife'|'creak'|'dust'|'stars', ...}    one-off effects drawn in world space
//   {title: 'CHAPTER ONE', sub: '...', dur: 2}   card over the scene
//
const Cut = (() => {
  let sc = null;          // active script
  let idx = 0;            // current step
  let stepT = 0;          // seconds inside the step
  let done = null;        // completion callback
  let actors = {};        // live actor state
  const fx = [];          // transient world-space effects
  let cam = { x: 0, zoom: 1, fromX: 0, toX: 0, fromZ: 1, toZ: 1, t: 0, dur: 0 };
  let bubble = null;      // {who, text, shown, t, dur, hold}
  let card = null;        // {text, sub, t, dur}
  let shake = 0, flash = 0, flashCol = '#ffffff';
  let letterbox = 0;      // 0..1 bar slide-in
  let ended = false;
  // the editorial layer: transitions between shots, impact frames, handheld
  let trans = null;       // {kind:'fade'|'whip'|'iris', t, dur, dir}
  let impactT = 0, impactDur = 0;
  let swayPhase = 0;      // handheld camera clock
  // The shot is the cinematic layer: a hard cut resets it, and it holds
  // its own framing, push, and per-shot grade for the duration of the take.
  let shot = {
    kind: 'world',        // 'world' = staged scene, 'face' = close-up bust
    on: null,             // actor the shot is framed on
    expr: 'neutral',
    size: 'full',         // framing name, which also sets how much a bust fills
    base: 1,              // the size's zoom before any push
    zoom: 1, zoomTo: 1,   // slow push-in over the take
    dim: 0,               // how far the scene behind a close-up is pushed down
    warm: null,           // per-shot colour grade
    cutT: 0,              // seconds since the cut (drives the snap)
  };

  const EASE = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

  // scratch canvas + reused spec for the dialogue-bar portrait chip
  const chipCvs = document.createElement('canvas');
  const chipSpec = { id: null, expr: 'neutral', facing: 1, t: 0, ramp: null, ascended: false };

  // characters speak at their own pitch, Undertale-style
  const VOICE = {
    todd: 150, josh: 210, damon: 96, sonya: 260, jordan: 230, jerod: 170,
    jacob: 240, samantha: 250, cassandra: 245, erika: 265, levi: 130,
    ronathon: 190, tim: 165, myah: 270, isla: 320, hayes: 235, addi: 300,
    brooks: 290, dayne: 200, narrator: 0,
    heath: 170, jr: 140, yvonne: 240, collette: 215, colletteghast: 88,
  };

  function reset() {
    idx = 0; stepT = 0; actors = {}; fx.length = 0;
    bubble = null; card = null; shake = 0; flash = 0; letterbox = 0; ended = false;
    shot.kind = 'world'; shot.on = null; shot.expr = 'neutral';
    shot.size = 'full'; shot.base = 1; shot.faceId = null;
    shot.zoom = 1; shot.zoomTo = 1; shot.dim = 0; shot.warm = null; shot.cutT = 0;
    shot.sway = 0; shot.dutch = 0; shot.focus = 0;
    trans = null; impactT = 0; impactDur = 0; swayPhase = 0;
    parRun = null; camFollow = null;
  }

  // Shot sizes, as a multiplier on the scene's base framing. Restrained and
  // heavy: takes hold, pushes are slow, and cuts are hard rather than blended.
  // never below 1: interiors only paint the room, and pulling back past the
  // default framing shows the world outside it
  const SHOT_ZOOM = { wide: 1, full: 1.16, med: 1.45, mcu: 1.8, cu: 2.3 };
  // For a bust the shot size sets how much of the frame the head fills. This
  // is NOT the world zoom — multiplying by that blew the head off the frame.
  const FACE_FILL = { wide: 0.32, full: 0.40, med: 0.48, mcu: 0.58, cu: 0.70 };
  const HEAD_UNITS = 150; // head plus hair, in the face renderer's units

  function play(name, onDone) {
    const script = window.CUTSCENES && window.CUTSCENES[name];
    if (!script) { if (onDone) onDone(); return false; }
    reset();
    sc = script;
    done = onDone || null;
    for (const k in sc.actors) {
      const a = sc.actors[k];
      actors[k] = {
        char: a.char, boss: !!a.boss, x: a.x || 0, y: a.y == null ? 468 : a.y,
        facing: a.facing == null ? 1 : a.facing, pose: a.pose || null, ext: a.ext || 0,
        scale: a.scale || 1, hide: !!a.hide, hurt: false, t: Math.random() * 6,
        mvx: 0, mvy: 0, mvt: 0, mvd: 0, fromX: 0, fromY: 0, arc: 0,
        // the animation layer: stepping feet, tumbles, tweened acting, grabs
        gait: null, gaitCyc: 0, gaitOn: false, sfxStep: false,
        rot: 0, fromRot: 0, spin: 0,
        animQ: null, animI: 0, animT2: 0, extFrom: 0,
        attach: null,
      };
    }
    cam.x = cam.fromX = cam.toX = sc.camX || 0;
    cam.zoom = cam.fromZ = cam.toZ = sc.zoom || 1;
    cam.t = 0; cam.dur = 0;
    if (window.MUSIC) {
      if (sc.music) MUSIC.play(sc.music);
      if (sc.amb) MUSIC.ambience(sc.amb);
    }
    return true;
  }

  function finish() {
    if (ended) return;
    ended = true;
    sc = null;
    if (window.MUSIC) MUSIC.duck(false);
    const cb = done; done = null;
    if (cb) cb();
  }

  // start the step at idx; returns true when the scene is over
  function begin() {
    if (!sc || idx >= sc.steps.length) { finish(); return true; }
    stepT = 0;
    startStep(sc.steps[idx]);
    return false;
  }

  // fire one step's side effects; shared by the main cursor and par tracks
  function startStep(s) {
    if (s.par) {
      // only the main cursor may open a par; a nested one would clobber the
      // sibling tracks' shared state, so it degrades to a no-op
      if (!parRun) parRun = s.par.map(track => ({ steps: track, idx: -1, t: 0, done: false }));
    } else if (s.set) {
      const a = actors[s.set.who];
      if (a) {
        if (s.set.x != null) a.x = s.set.x;
        if (s.set.y != null) a.y = s.set.y;
        if (s.set.facing != null) a.facing = s.set.facing;
        if (s.set.pose !== undefined) a.pose = s.set.pose;
        if (s.set.ext != null) a.ext = s.set.ext;
        if (s.set.scale != null) a.scale = s.set.scale;
        if (s.set.hurt != null) a.hurt = !!s.set.hurt;
        if (s.set.hide != null) a.hide = !!s.set.hide;
        if (s.set.rot != null) { a.rot = s.set.rot; a.spin = 0; }
        if (s.set.attach === false) a.attach = null;
      }
    } else if (s.pose) {
      const a = actors[s.pose.who];
      if (a) { a.pose = s.pose.pose; a.ext = s.pose.ext == null ? 1 : s.pose.ext; }
    } else if (s.move) {
      const a = actors[s.move.who];
      if (a) {
        a.fromX = a.x; a.fromY = a.y;
        a.mvx = s.move.x == null ? a.x : s.move.x;
        a.mvy = s.move.y == null ? a.y : s.move.y;
        a.arc = s.move.arc || 0;
        a.mvd = s.move.dur || 0.6; a.mvt = 0;
        a.gait = s.move.gait !== undefined ? s.move.gait : (s.move.spin ? null : 'walk');
        a.sfxStep = !!s.move.sfxStep;
        a.fromRot = a.rot;
        a.spin = s.move.spin || 0;
        a.attach = null; // being thrown or walking away breaks any hold
        if (s.move.facing != null) a.facing = s.move.facing;
        if (s.move.pose !== undefined) a.pose = s.move.pose;
      }
    } else if (s.anim) {
      // tweened acting: frames of {pose, ext, dur}, ext easing between frames
      const a = actors[s.anim.who];
      if (a) { a.animQ = s.anim.frames; a.animI = -1; a.animT2 = 0; a.extFrom = a.ext; }
    } else if (s.grab) {
      // two-actor contact: the victim hangs off the grabber at a fixed offset,
      // lifted over the hold, legs kicking. A later move on the victim breaks it.
      const g2 = actors[s.grab.who], v = actors[s.grab.victim];
      if (g2 && v) {
        v.attach = {
          to: s.grab.who, dx: s.grab.dx == null ? 40 : s.grab.dx,
          dy: s.grab.dy == null ? -20 : s.grab.dy,
          lift: s.grab.lift || 0, t: 0, dur: s.grab.dur || 0.8,
        };
        v.pose = 'hurt';
        v.facing = -g2.facing;
      }
    } else if (s.shot) {
      // a hard cut: framing, subject and grade all change on the same frame
      const sh = s.shot;
      shot.kind = sh.face ? 'face' : 'world';
      shot.on = sh.on || shot.on;
      shot.faceId = sh.faceId || null; // when the bust isn't the actor's body key
      shot.expr = sh.expr || 'neutral';
      const base = SHOT_ZOOM[sh.size] || 1;
      shot.size = sh.size || 'full';
      shot.base = base;
      shot.zoom = base;
      shot.zoomTo = sh.push ? base * (1 + sh.push) : base;
      shot.dim = sh.dim == null ? (shot.kind === 'face' ? 0.55 : 0) : sh.dim;
      shot.warm = sh.warm || null;
      shot.cutT = 0;
      camFollow = null;
      // the cinematography of the take: handheld nerves, a tilted horizon,
      // a defocused background — all held for the shot's duration
      shot.sway = sh.sway || 0;
      shot.dutch = sh.dutch || 0;
      shot.focus = sh.focus || 0;
      if (sh.cut) trans = { kind: sh.cut, t: 0, dur: sh.cut === 'fade' ? 0.55 : sh.cut === 'iris' ? 0.7 : 0.24, dir: sh.cutDir || 1 };
      // Always frame the world camera on the subject — a close-up draws over
      // the scene, so if its face is missing the shot beneath must still be
      // pointed at the right person rather than wherever the last cut left it.
      const a = actors[shot.on];
      const wz = shot.kind === 'face' ? SHOT_ZOOM.med : base;
      cam.fromX = cam.x;
      cam.toX = sh.x != null ? sh.x : (a ? a.x - viewW / (2 * wz) : cam.x);
      cam.fromZ = cam.zoom; cam.toZ = wz;
      cam.dur = sh.ease || 0; // 0 = instant cut
      cam.t = 0;
      if (!cam.dur) { cam.x = cam.toX; cam.zoom = wz; }
      if (sh.sfx && Sfx[sh.sfx]) Sfx[sh.sfx]();
    } else if (s.cam) {
      if (s.cam.follow) {
        // a tracking shot: the camera glues to an actor with lead and lag
        // until the next shot or explicit cam move takes over
        camFollow = { who: s.cam.follow, lead: s.cam.lead == null ? 40 : s.cam.lead, lag: s.cam.lag || 3.5, zoom: s.cam.zoom || cam.zoom };
        shot.zoomTo = shot.zoom; // cancel any in-flight push; the follow owns zoom
        cam.dur = 0; cam.t = 0;
      } else {
        camFollow = null;
        cam.fromX = cam.x; cam.toX = s.cam.x == null ? cam.x : s.cam.x;
        cam.fromZ = cam.zoom; cam.toZ = s.cam.zoom == null ? cam.zoom : s.cam.zoom;
        cam.dur = s.cam.dur || 0.6; cam.t = 0;
      }
    } else if (s.say) {
      const txt = s.text || '';
      bubble = { who: s.say, text: txt, shown: 0, t: 0, dur: s.dur || (1.1 + txt.length * 0.045), hold: 0, expr: s.expr || null, owner: s };
      Sfx.unlock();
      if (window.MUSIC) MUSIC.duck(true);
    } else if (s.impact != null) {
      // the frame itself flinches: brief inverted frames on a hit
      impactT = impactDur = s.impact || 0.12;
    } else if (s.music) {
      if (window.MUSIC) { MUSIC.unlock(); MUSIC.play(s.music); }
    } else if (s.sting) {
      if (window.MUSIC) MUSIC.sting(s.sting);
    } else if (s.amb) {
      if (window.MUSIC) MUSIC.ambience(s.amb);
    } else if (s.shake != null) {
      shake = s.shake;
    } else if (s.flash) {
      flash = 1; flashCol = typeof s.flash === 'string' ? s.flash : '#ffffff';
    } else if (s.sfx) {
      if (Sfx[s.sfx]) Sfx[s.sfx]();
    } else if (s.fx) {
      spawnFx(s);
    } else if (s.title) {
      card = { text: s.title, sub: s.sub || '', t: 0, dur: s.dur || 2 };
    }
  }

  function spawnFx(s) {
    const from = actors[s.from], to = actors[s.to];
    if (s.fx === 'knife' && from && to) {
      fx.push({
        kind: 'knife', x: from.x + from.facing * 14, y: from.y - 58,
        tx: s.tx == null ? to.x : s.tx, ty: s.ty == null ? to.y - 58 : s.ty,
        t: 0, dur: s.dur || 0.55, spin: 0, sx: from.x + from.facing * 14, sy: from.y - 58,
      });
    } else if (s.fx === 'creak') {
      fx.push({ kind: 'creak', x: s.x || 0, y: s.y || 468, t: 0, dur: s.dur || 1.1 });
    } else if (s.fx === 'dust') {
      fx.push({ kind: 'dust', x: s.x || 0, y: s.y || 468, t: 0, dur: s.dur || 0.7, n: s.n || 8 });
    } else if (s.fx === 'stars') {
      fx.push({ kind: 'stars', x: s.x || 0, y: s.y || 430, t: 0, dur: s.dur || 0.9 });
    } else if (s.fx === 'bats') {
      // she is GONE: a burst of bats spirals up and away from the point
      fx.push({ kind: 'bats', x: s.x || 0, y: s.y || 400, t: 0, dur: s.dur || 2.6, n: s.n || 14 });
    } else if (s.fx === 'doorburst') {
      // the slab tears off its hinges and tumbles into the room, and the
      // doorway floods with light for the rest of the scene
      const dx0 = s.x || 762, dx1 = s.x1 || 898, dy = s.y || 182, gy2 = s.gy || 468;
      fx.push({ kind: 'doorglow', x: dx0, x1: dx1, y: dy, gy: gy2, t: 0, dur: 999 });
      fx.push({
        kind: 'doorpanel', x: (dx0 + dx1) / 2, y: (dy + gy2) / 2,
        w: dx1 - dx0, h: gy2 - dy,
        vx: s.vx == null ? -320 : s.vx, vy: -140, spin: -3.4,
        rot: 0, t: 0, dur: 1.15,
      });
    }
  }

  // true once the current step has run its course
  function stepDone(s, tLocal) {
    if (s.wait != null) return tLocal >= s.wait;
    if (s.par) return !parRun || parRun.every(tr => tr.done);
    if (s.say) {
      // typewriter first, then hold; a tap skips ahead (see tap()).
      // Only THIS step's bubble counts — another track may own the current one.
      if (bubble && bubble.owner !== s) return true;
      return bubble ? (bubble.shown >= bubble.text.length && bubble.hold >= bubble.dur) : true;
    }
    if (s.move) {
      const a = actors[s.move.who];
      return !a || a.mvt >= a.mvd;
    }
    if (s.anim) {
      const a = actors[s.anim.who];
      return !a || !a.animQ;
    }
    if (s.grab) {
      const v = actors[s.grab.victim];
      return !v || !v.attach || v.attach.t >= v.attach.dur;
    }
    if (s.cam) return s.cam.follow ? true : cam.t >= cam.dur;
    if (s.title) return card ? card.t >= card.dur : true;
    if (s.fx) return tLocal >= (s.hold == null ? 0 : s.hold);
    return true; // set/pose/shake/flash/sfx are instantaneous
  }

  let camFollow = null; // {who, lead, lag, zoom} — live tracking shot
  const RIG_GAIT = { walk: 'walk', sneak: 'sneak', stomp: 'stomp', run: 'run' };
  const TALK_STYLE = { rage: 'talk-angry', angry: 'talk-angry', determined: 'talk-big', smug: 'talk-calm', scared: 'talk-calm' };

  // parallel tracks: {par: [[...steps], [...steps]]} runs each track's cursor
  // concurrently — action on one track, camera on another, dialogue on a third.
  // This is what makes a scene play like choreography instead of turns.
  let parRun = null;
  function drivePar(dt) {
    if (!parRun) return;
    for (const tr of parRun) {
      if (tr.done) continue;
      tr.t += dt;
      let hops = 0;
      while (hops++ < 20) {
        if (tr.idx >= 0 && !stepDone(tr.steps[tr.idx], tr.t)) break;
        if (tr.idx >= 0) {
          const fin = tr.steps[tr.idx];
          if (fin.say && bubble && bubble.owner === fin) { bubble = null; if (window.MUSIC) MUSIC.duck(false); }
          if (fin.title) card = null;
        }
        tr.idx++;
        tr.t = 0;
        if (tr.idx >= tr.steps.length) { tr.done = true; break; }
        startStep(tr.steps[tr.idx]);
      }
    }
  }

  let viewW = 960; // set by the renderer so shots can centre their subject
  function update(dt, vw) {
    if (vw) viewW = vw;
    if (!sc) return;
    if (idx === 0 && stepT === 0 && !ended) { if (begin()) return; }
    letterbox = Math.min(1, letterbox + dt * 4);
    stepT += dt;

    for (const k in actors) {
      const a = actors[k];
      a.t += dt;
      a.gaitOn = false;
      // film actors: lazily attach a rig player when a cinematic body exists
      if (!a.rp && window.Rig && window.CINE_CAST && CINE_CAST[a.char]) a.rp = Rig.newPlayer();
      if (a.mvt < a.mvd) {
        const px = a.x;
        a.mvt = Math.min(a.mvd, a.mvt + dt);
        const u = EASE(clamp01(a.mvt / a.mvd));
        a.x = a.fromX + (a.mvx - a.fromX) * u;
        a.y = a.fromY + (a.mvy - a.fromY) * u - Math.sin(u * Math.PI) * a.arc;
        if (a.spin) a.rot = a.fromRot + a.spin * u;
        if (a.gait) {
          // feet step with the ground actually covered, so no gliding;
          // a sneak takes shorter, more careful steps
          a.gaitOn = true;
          const stride = a.gait === 'sneak' ? 8 : a.gait === 'stomp' ? 15 : 11;
          const prevPhase = Math.floor(a.gaitCyc / Math.PI);
          a.gaitCyc += Math.abs(a.x - px) / stride;
          if (Math.floor(a.gaitCyc / Math.PI) !== prevPhase) {
            if (a.gait === 'stomp') { shake = Math.max(shake, 0.32); Sfx.stomp(); }
            else if (a.sfxStep) Sfx.step();
          }
        }
      }
      // tweened acting frames
      if (a.animQ) {
        if (a.animI < 0 || a.animT2 >= (a.animQ[a.animI].dur || 0.2)) {
          a.animI++;
          a.animT2 = 0;
          a.extFrom = a.ext;
          if (a.animI >= a.animQ.length) { a.animQ = null; }
          else if (a.animQ[a.animI].pose !== undefined) a.pose = a.animQ[a.animI].pose;
        }
        if (a.animQ) {
          const fr = a.animQ[a.animI];
          a.animT2 += dt;
          const fu = EASE(clamp01(a.animT2 / (fr.dur || 0.2)));
          a.ext = a.extFrom + ((fr.ext == null ? 1 : fr.ext) - a.extFrom) * fu;
        }
      }
    }
    // drive the rig performances from what each actor is DOING this frame:
    // locomotion clips phase-locked to distance, acting clips from poses,
    // talk overlays while their line types, struggle while held
    if (window.Rig) {
      for (const k in actors) {
        const a = actors[k];
        if (!a.rp) continue;
        let phase = null;
        if (a.attach) Rig.play(a.rp, 'struggle', { blend: 0.12 });
        else if (a.spin && a.mvt < a.mvd) Rig.play(a.rp, 'thrown', { blend: 0.1 });
        else if (a.gaitOn) {
          Rig.play(a.rp, RIG_GAIT[a.gait] || 'walk', { blend: 0.2 });
          phase = (a.gaitCyc / (Math.PI * 2)) % 1;
        } else if (a.pose === 'windup') Rig.play(a.rp, 'punch-tell', { blend: 0.12, speed: 0.55 });
        else if (a.pose === 'strike') Rig.play(a.rp, 'throw', { blend: 0.1 });
        else if (a.pose === 'hurt') Rig.play(a.rp, a.rot ? 'land-crumple' : 'cower', { blend: 0.15 });
        else if (a.pose === 'crouch') Rig.play(a.rp, 'cower', { blend: 0.2 });
        else Rig.play(a.rp, 'idle', { blend: 0.3 });
        // the speaker gestures with their line
        if (bubble && bubble.who === k.replace(/ghast$/, '') || (bubble && bubble.who === a.char)) {
          if (bubble.shown < bubble.text.length) {
            Rig.play(a.rp, TALK_STYLE[bubble.expr] || 'talk-calm', { channel: 'talk' });
            a.talking = Math.min(1, (a.talking || 0) + dt * 8);
          } else a.talking = Math.max(0, (a.talking || 0) - dt * 5);
        } else if (a.talking) {
          a.talking = Math.max(0, a.talking - dt * 5);
          if (!a.talking) Rig.stopTalk(a.rp);
        }
        Rig.tick(a.rp, dt, phase);
      }
    }

    // grabs resolve after everyone has moved, so the victim rides this frame's
    // hand position, rising over the lift
    for (const k in actors) {
      const a = actors[k];
      if (!a.attach) continue;
      const g2 = actors[a.attach.to];
      if (!g2) { a.attach = null; continue; }
      a.attach.t = Math.min(a.attach.dur, a.attach.t + dt);
      const lu = EASE(clamp01(a.attach.t / a.attach.dur));
      a.x = g2.x + g2.facing * a.attach.dx;
      a.y = g2.y + a.attach.dy - a.attach.lift * lu;
      a.facing = -g2.facing;
    }
    if (cam.t < cam.dur) {
      cam.t = Math.min(cam.dur, cam.t + dt);
      const u = EASE(clamp01(cam.t / cam.dur));
      cam.x = cam.fromX + (cam.toX - cam.fromX) * u;
      cam.zoom = cam.fromZ + (cam.toZ - cam.fromZ) * u;
    }
    if (bubble) {
      if (bubble.shown < bubble.text.length) {
        bubble.t += dt;
        const per = 0.028;
        while (bubble.t >= per && bubble.shown < bubble.text.length) {
          bubble.t -= per;
          bubble.shown++;
          const ch = bubble.text.charAt(bubble.shown - 1);
          if (ch !== ' ' && bubble.shown % 2 === 0) Sfx.voice(VOICE[bubble.who] || 180);
        }
      } else {
        bubble.hold += dt;
      }
    }
    // the take breathes: a slow push that never snaps back. The window is
    // left-anchored, so the push splits its shrink between both edges to keep
    // the composition centred instead of drifting right.
    shot.cutT += dt;
    // a live tracking shot owns the camera outright — a still-converging push
    // from the PREVIOUS shot must not keep pinning zoom underneath it
    if (shot.zoom !== shot.zoomTo && !camFollow) {
      const z0 = shot.zoom;
      const d = shot.zoomTo - shot.zoom;
      shot.zoom += d * Math.min(1, dt * 0.22);
      if (Math.abs(shot.zoomTo - shot.zoom) < 0.002) shot.zoom = shot.zoomTo;
      if (shot.kind === 'world') {
        cam.zoom = shot.zoom; // face pushes zoom the bust, not the room
        if (cam.t >= cam.dur) cam.x += (viewW / z0 - viewW / shot.zoom) / 2;
      }
    }
    if (card) card.t += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 1.8);
    if (flash > 0) flash = Math.max(0, flash - dt * 2.6);

    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt;
      if (f.kind === 'knife') {
        const u = clamp01(f.t / f.dur);
        f.x = f.sx + (f.tx - f.sx) * u;
        f.y = f.sy + (f.ty - f.sy) * u - Math.sin(u * Math.PI) * 18;
        f.spin += dt * 26;
      } else if (f.kind === 'doorpanel') {
        f.vy += 1500 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.spin * dt;
        const floor = 468 - f.h * 0.18; // it settles on edge, mostly flat
        if (f.y > floor) { f.y = floor; f.vy = 0; f.vx *= 0.6; f.spin *= 0.4; }
      }
      if (f.t >= f.dur + (f.kind === 'knife' ? 0.25 : 0)) fx.splice(i, 1);
    }

    // editorial clocks
    if (trans) { trans.t += dt; if (trans.t >= trans.dur) trans = null; }
    if (impactT > 0) impactT -= dt;
    swayPhase += dt;

    // tracking shot: chase the followed actor every frame
    if (camFollow) {
      const fa = actors[camFollow.who];
      if (fa) {
        cam.zoom += (camFollow.zoom - cam.zoom) * Math.min(1, 4 * dt);
        const vw2 = viewW / cam.zoom;
        const target = Math.max(0, Math.min(1750 - vw2, fa.x + fa.facing * camFollow.lead - vw2 / 2));
        cam.x += (target - cam.x) * Math.min(1, camFollow.lag * dt);
      }
    }

    drivePar(dt);

    const s = sc.steps[idx];
    if (stepDone(s, stepT)) {
      if (s.say && (!bubble || bubble.owner === s)) { bubble = null; if (window.MUSIC) MUSIC.duck(false); }
      if (s.title) card = null;
      if (s.par) parRun = null;
      idx++;
      if (begin()) return;
    }
  }

  // a tap finishes the typewriter, then advances the line
  function tap() {
    if (!sc || !bubble) return false;
    if (bubble.shown < bubble.text.length) { bubble.shown = bubble.text.length; return true; }
    bubble.hold = bubble.dur;
    return true;
  }

  function skip() { if (sc) { for (const k in actors) actors[k].hide = true; finish(); } }

  // ---- rendering: world space ----
  function drawWorld(g) {
    if (!sc) return;
    for (const f of fx) {
      if (f.kind === 'knife') {
        g.save();
        g.translate(f.x, f.y);
        g.rotate(f.spin);
        g.fillStyle = '#3a2a20';
        g.fillRect(-9, -1.6, 8, 3.2);
        g.fillStyle = '#c9ccd8';
        g.beginPath();
        g.moveTo(-1, -2.2); g.lineTo(11, -1.4); g.lineTo(13, 0); g.lineTo(11, 1.4); g.lineTo(-1, 2.2);
        g.closePath(); g.fill();
        g.fillStyle = '#f2f5fb';
        g.fillRect(0, -1.4, 10, 1);
        g.restore();
      } else if (f.kind === 'doorglow') {
        // hot light pouring from the EMPTY doorway — bright enough to burn out
        // the baked door art behind it, so the frame reads as open
        g.fillStyle = 'rgba(255,236,200,0.94)';
        g.fillRect(f.x, f.y, f.x1 - f.x, f.gy - f.y);
        g.fillStyle = 'rgba(255,214,150,0.55)';
        g.fillRect(f.x - 8, f.y - 6, f.x1 - f.x + 16, 8);
        g.fillRect(f.x - 8, f.y, 8, f.gy - f.y);
        g.fillRect(f.x1, f.y, 8, f.gy - f.y);
        g.globalAlpha = 0.22;
        g.fillStyle = '#ffca6a';
        g.beginPath();
        g.moveTo(f.x - 6, f.gy); g.lineTo(f.x1 + 6, f.gy);
        g.lineTo(f.x1 + 150, f.gy + 60); g.lineTo(f.x - 150, f.gy + 60);
        g.closePath(); g.fill();
        g.globalAlpha = 1;
      } else if (f.kind === 'doorpanel') {
        g.save();
        g.translate(f.x, f.y);
        g.rotate(f.rot);
        g.fillStyle = '#171219';
        g.fillRect(-f.w / 2 - 3, -f.h / 2 - 3, f.w + 6, f.h + 6);
        g.fillStyle = '#3d3340';
        g.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
        g.fillStyle = '#50434f';
        g.fillRect(-f.w / 2, -f.h / 2, 8, f.h);
        g.fillStyle = '#2c242f';
        g.fillRect(-f.w / 2 + 16, -f.h / 2 + 22, f.w - 32, f.h * 0.32);
        g.fillRect(-f.w / 2 + 16, f.h * 0.08, f.w - 32, f.h * 0.34);
        g.fillStyle = '#c9a227';
        g.beginPath(); g.arc(f.w / 2 - 16, 6, 6, 0, 7); g.fill();
        g.restore();
      } else if (f.kind === 'bats') {
        // deterministic swarm: each bat gets its own arc from index math alone
        const u = clamp01(f.t / f.dur);
        g.strokeStyle = '#1d1030';
        g.lineWidth = 2.4;
        g.lineCap = 'round';
        for (let i = 0; i < f.n; i++) {
          const a = (i / f.n) * Math.PI * 2 + i * 0.7;
          const spd = 90 + (i % 5) * 44;
          const bx = f.x + Math.cos(a) * spd * f.t + Math.sin(f.t * 3 + i) * 8;
          const by = f.y - 60 * f.t * f.t - Math.abs(Math.sin(a)) * spd * f.t * 0.5 + Math.cos(f.t * 4 + i) * 6;
          const fl = Math.sin(f.t * 21 + i * 1.3) * 4;
          g.globalAlpha = (1 - u) * 0.95;
          g.beginPath();
          g.moveTo(bx - 7, by - fl);
          g.quadraticCurveTo(bx - 2.5, by + 2.5, bx, by);
          g.quadraticCurveTo(bx + 2.5, by + 2.5, bx + 7, by - fl);
          g.stroke();
        }
        g.globalAlpha = 1;
      } else if (f.kind === 'creak') {
        const u = clamp01(f.t / f.dur);
        g.globalAlpha = (1 - u) * 0.9;
        g.fillStyle = '#f2ede0';
        g.font = '700 15px Verdana, sans-serif';
        g.textAlign = 'center';
        g.save();
        g.translate(f.x, f.y - 26 - u * 22);
        g.rotate(-0.12);
        g.fillText('*creak*', 0, 0);
        g.restore();
        g.globalAlpha = 1;
      } else if (f.kind === 'dust') {
        const u = clamp01(f.t / f.dur);
        g.globalAlpha = (1 - u) * 0.5;
        g.fillStyle = '#d8cdb8';
        for (let i = 0; i < f.n; i++) {
          const a = (i / f.n) * Math.PI * 2;
          g.beginPath();
          g.arc(f.x + Math.cos(a) * (10 + u * 34), f.y - 4 - Math.sin(a) * (4 + u * 12), 3.5 * (1 - u) + 1, 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
      } else if (f.kind === 'stars') {
        const u = clamp01(f.t / f.dur);
        g.globalAlpha = 1 - u;
        g.fillStyle = '#ffd24a';
        for (let i = 0; i < 5; i++) {
          const a = f.t * 5 + i * 1.256;
          const rx = f.x + Math.cos(a) * 20, ry = f.y - u * 16 + Math.sin(a) * 8;
          g.beginPath();
          g.moveTo(rx, ry - 5); g.lineTo(rx + 1.6, ry - 1.6); g.lineTo(rx + 5, ry);
          g.lineTo(rx + 1.6, ry + 1.6); g.lineTo(rx, ry + 5); g.lineTo(rx - 1.6, ry + 1.6);
          g.lineTo(rx - 5, ry); g.lineTo(rx - 1.6, ry - 1.6);
          g.closePath(); g.fill();
        }
        g.globalAlpha = 1;
      }
    }
  }

  // speech bubble, drawn in world space above the speaker — opt-in per scene
  // now that the lower-third bar is the default presentation
  function drawBubble(g, viewL, viewW) {
    if (!sc || !bubble || sc.style !== 'bubble') return;
    const a = actors[bubble.who];
    const txt = bubble.text.slice(0, bubble.shown);
    const cx = a ? a.x : cam.x + 240;
    const cy = a ? a.y - 118 : 240;
    g.font = '700 13px Verdana, sans-serif';
    g.textAlign = 'left';
    // wrap to a sane width
    const maxW = 210;
    const words = bubble.text.split(' ');
    let line = '', lines = 0, widest = 0;
    const laid = [];
    for (let i = 0; i < words.length; i++) {
      const probe = line ? line + ' ' + words[i] : words[i];
      if (g.measureText(probe).width > maxW && line) { laid.push(line); widest = Math.max(widest, g.measureText(line).width); line = words[i]; }
      else line = probe;
    }
    if (line) { laid.push(line); widest = Math.max(widest, g.measureText(line).width); }
    lines = laid.length;
    const bw = widest + 22, bh = lines * 17 + 16;
    // keep the bubble on screen even when the camera frames the speaker at an edge
    let bx = cx - bw / 2;
    if (viewW) bx = Math.max(viewL + 10, Math.min(bx, viewL + viewW - bw - 10));
    const by = cy - bh;
    g.fillStyle = 'rgba(20,16,26,0.92)';
    g.beginPath(); g.roundRect(bx, by, bw, bh, 8); g.fill();
    g.strokeStyle = '#f2ede0'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(bx, by, bw, bh, 8); g.stroke();
    // tail
    g.fillStyle = 'rgba(20,16,26,0.92)';
    g.beginPath();
    g.moveTo(cx - 7, by + bh - 1); g.lineTo(cx, by + bh + 12); g.lineTo(cx + 7, by + bh - 1);
    g.closePath(); g.fill();
    // the visible slice of text, wrapped the same way
    let shown = bubble.shown;
    g.fillStyle = '#f2ede0';
    for (let i = 0; i < laid.length; i++) {
      const full = laid[i];
      const take = Math.max(0, Math.min(full.length, shown));
      if (take > 0) g.fillText(full.slice(0, take), bx + 11, by + 17 + i * 17);
      shown -= full.length + 1;
      if (shown <= 0) break;
    }
    // name tag
    const nm = (bubble.who === 'narrator') ? '' : bubble.who.toUpperCase();
    if (nm) {
      g.font = '700 10px Verdana, sans-serif';
      g.fillStyle = '#ffd24a';
      g.fillText(nm, bx + 11, by - 5);
    }
    if (bubble.shown >= bubble.text.length) {
      g.fillStyle = '#ffd24a';
      const bob = Math.sin(bubble.hold * 7) * 1.6;
      g.beginPath();
      g.moveTo(bx + bw - 14, by + bh - 10 + bob); g.lineTo(bx + bw - 8, by + bh - 10 + bob); g.lineTo(bx + bw - 11, by + bh - 5 + bob);
      g.closePath(); g.fill();
    }
  }

  // The close-up layer, drawn in SCREEN space over a dimmed scene. Faces come
  // from js/faces.js because the gameplay bodies carry no detail at this size.
  const faceSpec = { id: '', expr: 'neutral', t: 0, facing: 1, ascended: false, ramp: null };
  function drawCloseup(g, SW, SH, rampFn) {
    if (!sc || shot.kind !== 'face') return false;
    const a = actors[shot.on];
    const id = shot.faceId || (a ? a.char : shot.on);
    if (!window.FACES || !window.FACES.has || !window.FACES.has(id)) return false;
    // push the staged scene back so the face reads as the subject
    if (shot.dim > 0) {
      g.fillStyle = 'rgba(8,7,14,' + shot.dim.toFixed(2) + ')';
      g.fillRect(0, 0, SW, SH);
    }
    const bar = 46 * letterbox;
    const frameH = SH - bar * 2;
    // head fills a set share of the frame regardless of screen shape; the
    // shot's push adds only a gentle drift on top
    const fill = FACE_FILL[shot.size] || FACE_FILL.full;
    const push = 1 + (shot.zoom - shot.base) * 0.3;
    const s = (frameH * fill / HEAD_UNITS) * push;
    g.save();
    g.translate(SW * 0.5, bar + frameH * 0.46);
    g.scale(s, s);
    faceSpec.id = id;
    faceSpec.expr = shot.expr;
    faceSpec.t = a ? a.t : 0;
    faceSpec.facing = a ? a.facing : 1;
    faceSpec.ascended = !!(a && a.ascended);
    faceSpec.ramp = rampFn || null;
    window.FACES.draw(g, faceSpec);
    g.restore();
    return true;
  }

  // ---- rendering: screen space ----
  function drawUI(g, SW, SH) {
    if (!sc) return;
    // per-shot grade: a wash that colours the whole take
    if (shot.warm) {
      g.globalAlpha = 0.22;
      g.fillStyle = shot.warm;
      g.fillRect(0, 0, SW, SH);
      g.globalAlpha = 1;
    }
    const bar = 46 * letterbox;
    g.fillStyle = '#0b0a12';
    g.fillRect(0, 0, SW, bar);
    g.fillRect(0, SH - bar, SW, bar);
    if (flash > 0) {
      g.globalAlpha = Math.min(0.85, flash);
      g.fillStyle = flashCol;
      g.fillRect(0, 0, SW, SH);
      g.globalAlpha = 1;
    }
    if (card) {
      // title typography that MOVES: rule lines sweep out from center, the
      // headline tracks open letter by letter, the subtitle settles in late
      const u = clamp01(card.t / 0.5), o = clamp01((card.dur - card.t) / 0.4);
      const a = Math.min(EASE(u), o);
      const cy = SH * 0.34;
      g.globalAlpha = a * 0.82;
      g.fillStyle = 'rgba(11,10,18,0.9)';
      g.fillRect(0, cy, SW, 100);
      // sweeping rules
      const sw2 = EASE(u) * SW * 0.42;
      g.fillStyle = '#ffd24a';
      g.globalAlpha = a;
      g.fillRect(SW / 2 - sw2, cy, sw2 * 2, 2);
      g.fillRect(SW / 2 - sw2 * 0.7, cy + 98, sw2 * 1.4, 2);
      // tracked headline
      const trk = 2 + (1 - EASE(u)) * 26; // letters slide together as it lands
      g.textAlign = 'center';
      g.font = '800 30px Verdana, sans-serif';
      const chars = card.text.split('');
      let total = 0;
      for (const ch of chars) total += g.measureText(ch).width + trk;
      let cx2 = SW / 2 - total / 2;
      g.fillStyle = '#f2ede0';
      for (let i = 0; i < chars.length; i++) {
        const chW = g.measureText(chars[i]).width;
        const la = clamp01(u * chars.length * 1.6 - i * 0.55);
        g.globalAlpha = a * la;
        g.fillText(chars[i], cx2 + chW / 2, cy + 48);
        cx2 += chW + trk;
      }
      if (card.sub) {
        g.globalAlpha = a * clamp01((card.t - 0.4) / 0.3);
        g.font = '600 14px Verdana, sans-serif';
        g.fillStyle = '#c9c2b0';
        g.fillText(card.sub, SW / 2, cy + 76);
      }
      g.globalAlpha = 1;
    }
    // every line reads on a cinematic lower-third — the floating comic bubble
    // is opt-in per scene now (style: 'bubble'), because it read cheap
    if (bubble && (!sc || sc.style !== 'bubble')) {
      const isFace = shot.kind === 'face';
      const txt = bubble.text.slice(0, bubble.shown);
      const plateH = 84, plateY = SH - bar - plateH - 10;
      // portrait chip on world shots (a face shot already IS the portrait)
      let tx0 = 26;
      const chipId = !isFace && bubble.who !== 'narrator' && window.FACES &&
        (FACES.has(bubble.who) ? bubble.who : null);
      g.fillStyle = 'rgba(12,10,20,0.86)';
      g.fillRect(0, plateY, SW, plateH);
      g.fillStyle = 'rgba(255,210,74,0.85)';
      g.fillRect(0, plateY, SW, 2);
      if (chipId) {
        const cs = plateH - 16;
        if (chipCvs.width !== 150) { chipCvs.width = 150; chipCvs.height = 150; }
        const q = chipCvs.getContext('2d');
        q.setTransform(1, 0, 0, 1, 0, 0);
        q.clearRect(0, 0, 150, 150);
        chipSpec.id = chipId;
        chipSpec.expr = bubble.expr || 'neutral';
        chipSpec.t = bubble.hold + bubble.shown * 0.03;
        // FACES draws about the HEAD CENTER at (0,0): park that point in the
        // upper-middle of the chip so the face fills the circle, not a corner
        q.save();
        q.translate(75, 62); q.scale(0.52, 0.52);
        FACES.draw(q, chipSpec);
        q.restore();
        g.save();
        g.beginPath(); g.arc(26 + cs / 2, plateY + 8 + cs / 2, cs / 2, 0, 7); g.clip();
        g.fillStyle = '#241f33';
        g.fillRect(26, plateY + 8, cs, cs);
        g.drawImage(chipCvs, 26, plateY + 8, cs, cs);
        g.restore();
        g.strokeStyle = 'rgba(255,210,74,0.6)'; g.lineWidth = 2;
        g.beginPath(); g.arc(26 + cs / 2, plateY + 8 + cs / 2, cs / 2, 0, 7); g.stroke();
        tx0 = 26 + cs + 16;
      }
      g.textAlign = 'left';
      const nm = bubble.who === 'narrator' ? '' : bubble.who.toUpperCase();
      if (nm) {
        g.font = '800 12px Verdana, sans-serif';
        g.fillStyle = '#ffd24a';
        g.fillText(nm, tx0, plateY + 24);
      }
      g.font = '700 17px Verdana, sans-serif';
      g.fillStyle = '#f2ede0';
      const maxW = SW - tx0 - 26;
      let line = '', y = plateY + 50;
      const words = txt.split(' ');
      for (let i = 0; i < words.length; i++) {
        const probe = line ? line + ' ' + words[i] : words[i];
        if (g.measureText(probe).width > maxW && line) { g.fillText(line, tx0, y); y += 21; line = words[i]; }
        else line = probe;
      }
      if (line) g.fillText(line, tx0, y);
      if (bubble.shown >= bubble.text.length) {
        g.fillStyle = '#ffd24a';
        const bob = Math.sin(bubble.hold * 7) * 1.6;
        g.beginPath();
        g.moveTo(SW - 34, plateY + plateH - 20 + bob); g.lineTo(SW - 22, plateY + plateH - 20 + bob); g.lineTo(SW - 28, plateY + plateH - 12 + bob);
        g.closePath(); g.fill();
      }
    }
    // transitions between shots
    if (trans) {
      const u = trans.t / trans.dur;
      if (trans.kind === 'fade') {
        g.globalAlpha = Math.sin(u * Math.PI);
        g.fillStyle = '#08060e';
        g.fillRect(0, 0, SW, SH);
        g.globalAlpha = 1;
      } else if (trans.kind === 'iris') {
        // circle closing then opening around frame center
        const r = Math.max(SW, SH) * 0.75 * Math.abs(1 - 2 * u);
        g.fillStyle = '#08060e';
        g.beginPath();
        g.rect(0, 0, SW, SH);
        g.arc(SW / 2, SH / 2, Math.max(1, r), 0, 7, true);
        g.fill();
      } else if (trans.kind === 'whip') {
        // horizontal streaks + a lurch, like the camera snapped sideways
        const a = Math.sin(u * Math.PI);
        g.globalAlpha = a * 0.7;
        g.fillStyle = '#0b0a12';
        g.fillRect(0, 0, SW, SH);
        g.globalAlpha = a * 0.5;
        g.strokeStyle = '#d8d4c8'; g.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const sy = (SH / 9) * (i + 0.5) + (i % 3 - 1) * 8;
          g.beginPath();
          g.moveTo(0, sy); g.lineTo(SW, sy + trans.dir * 14);
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    // impact frames: the whole frame inverts for a beat
    if (impactT > 0) {
      const even = Math.floor(impactT * 30) % 2 === 0;
      g.globalCompositeOperation = 'difference';
      g.fillStyle = even ? '#ffffff' : '#c9c9c9';
      g.fillRect(0, 0, SW, SH);
      g.globalCompositeOperation = 'source-over';
    }
    // skip affordance
    g.globalAlpha = 0.75 * letterbox;
    g.font = '700 11px Verdana, sans-serif';
    g.textAlign = 'right';
    g.fillStyle = '#9aa0b8';
    g.fillText('TAP TO ADVANCE   ·   SKIP ▸', SW - 14, SH - bar + 30);
    g.globalAlpha = 1;
  }

  // did a screen-space tap land on the skip affordance?
  function hitSkip(px, py, SW, SH) {
    const bar = 46 * letterbox;
    return px > SW - 120 && py > SH - bar + 12 && py < SH - bar + 40;
  }

  return {
    play, update, tap, skip, drawWorld, drawBubble, drawUI, hitSkip, drawCloseup,
    get shotKind() { return shot.kind; },
    get dbg() { return { idx: idx, step: sc ? JSON.stringify(sc.steps[idx]) : null, bubble: bubble && { who: bubble.who, shown: bubble.shown, len: bubble.text.length, hold: +bubble.hold.toFixed(2), dur: bubble.dur } }; },
    get active() { return !!sc; },
    get stage() { return sc ? sc.stage : null; },
    get camX() { return cam.x; },
    get zoom() { return cam.zoom; },
    get shake() { return shake; },
    // the handheld layer: slow drift + fine tremor, scaled by the shot's sway
    get camDx() { return shot.sway ? (Math.sin(swayPhase * 0.7) * 3 + Math.sin(swayPhase * 3.1) * 1.1) * shot.sway : 0; },
    get camDy() { return shot.sway ? (Math.cos(swayPhase * 0.53) * 2.2 + Math.sin(swayPhase * 2.7) * 0.8) * shot.sway : 0; },
    get camRot() { return shot.dutch + (shot.sway ? Math.sin(swayPhase * 0.41) * 0.004 * shot.sway : 0); },
    get focus() { return shot.focus; },
    lights() { return sc ? sc.lights || null : null; },
    actors() { return actors; },
  };
})();
