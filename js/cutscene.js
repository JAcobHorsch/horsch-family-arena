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

  const EASE = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

  // characters speak at their own pitch, Undertale-style
  const VOICE = {
    todd: 150, josh: 210, damon: 96, sonya: 260, jordan: 230, jerod: 170,
    jacob: 240, samantha: 250, cassandra: 245, erika: 265, levi: 130,
    ronathon: 190, tim: 165, myah: 270, isla: 320, hayes: 235, addi: 300,
    brooks: 290, dayne: 200, narrator: 0,
  };

  function reset() {
    idx = 0; stepT = 0; actors = {}; fx.length = 0;
    bubble = null; card = null; shake = 0; flash = 0; letterbox = 0; ended = false;
  }

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
      };
    }
    cam.x = cam.fromX = cam.toX = sc.camX || 0;
    cam.zoom = cam.fromZ = cam.toZ = sc.zoom || 1;
    cam.t = 0; cam.dur = 0;
    return true;
  }

  function finish() {
    if (ended) return;
    ended = true;
    sc = null;
    const cb = done; done = null;
    if (cb) cb();
  }

  // start the step at idx; returns true when the scene is over
  function begin() {
    if (!sc || idx >= sc.steps.length) { finish(); return true; }
    const s = sc.steps[idx];
    stepT = 0;
    if (s.set) {
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
        if (s.move.facing != null) a.facing = s.move.facing;
        if (s.move.pose !== undefined) a.pose = s.move.pose;
      }
    } else if (s.cam) {
      cam.fromX = cam.x; cam.toX = s.cam.x == null ? cam.x : s.cam.x;
      cam.fromZ = cam.zoom; cam.toZ = s.cam.zoom == null ? cam.zoom : s.cam.zoom;
      cam.dur = s.cam.dur || 0.6; cam.t = 0;
    } else if (s.say) {
      const txt = s.text || '';
      bubble = { who: s.say, text: txt, shown: 0, t: 0, dur: s.dur || (1.1 + txt.length * 0.045), hold: 0 };
      Sfx.unlock();
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
    return false;
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
    }
  }

  // true once the current step has run its course
  function stepDone(s, dt) {
    if (s.wait != null) return stepT >= s.wait;
    if (s.say) {
      // typewriter first, then hold; a tap skips ahead (see tap())
      return bubble ? (bubble.shown >= bubble.text.length && bubble.hold >= bubble.dur) : true;
    }
    if (s.move) {
      const a = actors[s.move.who];
      return !a || a.mvt >= a.mvd;
    }
    if (s.cam) return cam.t >= cam.dur;
    if (s.title) return card ? card.t >= card.dur : true;
    if (s.fx) return stepT >= (s.hold == null ? 0 : s.hold);
    return true; // set/pose/shake/flash/sfx are instantaneous
  }

  function update(dt) {
    if (!sc) return;
    if (idx === 0 && stepT === 0 && !ended) { if (begin()) return; }
    letterbox = Math.min(1, letterbox + dt * 4);
    stepT += dt;

    for (const k in actors) {
      const a = actors[k];
      a.t += dt;
      if (a.mvt < a.mvd) {
        a.mvt = Math.min(a.mvd, a.mvt + dt);
        const u = EASE(clamp01(a.mvt / a.mvd));
        a.x = a.fromX + (a.mvx - a.fromX) * u;
        a.y = a.fromY + (a.mvy - a.fromY) * u - Math.sin(u * Math.PI) * a.arc;
      }
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
      }
      if (f.t >= f.dur + (f.kind === 'knife' ? 0.25 : 0)) fx.splice(i, 1);
    }

    const s = sc.steps[idx];
    if (stepDone(s, dt)) {
      if (s.say) bubble = null;
      if (s.title) card = null;
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

  // speech bubble, drawn in world space above the speaker
  function drawBubble(g, viewL, viewW) {
    if (!sc || !bubble) return;
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

  // ---- rendering: screen space ----
  function drawUI(g, SW, SH) {
    if (!sc) return;
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
      const u = clamp01(card.t / 0.35), o = clamp01((card.dur - card.t) / 0.35);
      g.globalAlpha = Math.min(u, o);
      g.fillStyle = 'rgba(11,10,18,0.78)';
      g.fillRect(0, SH * 0.34, SW, 96);
      g.textAlign = 'center';
      g.fillStyle = '#f2ede0';
      g.font = '800 30px Verdana, sans-serif';
      g.fillText(card.text, SW / 2, SH * 0.34 + 44);
      if (card.sub) {
        g.font = '600 14px Verdana, sans-serif';
        g.fillStyle = '#c9c2b0';
        g.fillText(card.sub, SW / 2, SH * 0.34 + 70);
      }
      g.globalAlpha = 1;
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
    play, update, tap, skip, drawWorld, drawBubble, drawUI, hitSkip,
    get dbg() { return { idx: idx, step: sc ? JSON.stringify(sc.steps[idx]) : null, bubble: bubble && { who: bubble.who, shown: bubble.shown, len: bubble.text.length, hold: +bubble.hold.toFixed(2), dur: bubble.dur } }; },
    get active() { return !!sc; },
    get stage() { return sc ? sc.stage : null; },
    get camX() { return cam.x; },
    get zoom() { return cam.zoom; },
    get shake() { return shake; },
    actors() { return actors; },
  };
})();
