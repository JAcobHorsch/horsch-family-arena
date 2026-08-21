// ===== Skeletal rig + keyframe clip engine — the cutscene animation core =====
//
// Gameplay sprites pose-snap; film actors FLOW. This module gives cutscenes a
// real 2D skeleton with keyframed, eased, blendable animation clips, so scene
// actors move continuously through motions instead of teleporting between
// statues. Gameplay never touches this.
//
// THE SKELETON (side view, +x forward, feet at y=0, all angles radians,
// 0 = pointing straight down for limbs / straight up for the spine chain,
// positive = rotating toward +x):
//
//   root (pelvis position, world)
//     spine        pelvis -> chest       len 26
//     neck         chest -> head base    len 8
//     head         head base -> crown    len 14
//     shoulderF/B  chest anchor          (offsets, not bones)
//     upperArmF/B  shoulder -> elbow     len 15
//     foreArmF/B   elbow -> wrist        len 14
//     hip anchor at pelvis
//     thighF/B     hip -> knee           len 22
//     shinF/B      knee -> ankle         len 21
//     footF/B      ankle -> toe          len 9
//
// A CLIP is { dur, loop, tracks: { joint: [[t, angle, ease], ...] }, root?:
// [[t, dx, dy], ...] } — times in seconds, tracks sampled with the named ease
// ('lin'|'io'|'out'|'in'), missing joints hold the underlying pose. Root moves
// are RELATIVE offsets layered on the actor's scripted world position, so
// scene scripts keep owning where actors ARE; clips own how they carry
// themselves getting there.
//
// THE PLAYER (one per actor, allocation-free after creation):
//   rp = Rig.newPlayer()
//   Rig.play(rp, 'walk', { blend: 0.2, speed: 1, loop: true })
//   Rig.tick(rp, dt, phase)   // phase (0..1) overrides the clock for gait sync
//   Rig.sample(rp)            // -> rp.pose, a flat { joint: angle } snapshot
//
// Layered acting: play() on channel 'body' moves limbs; channel 'talk' blends
// gesture overlays on the arms/head only, so a character can walk AND talk.
//
window.Rig = (() => {
  const BONES = {
    spine: 26, neck: 8, head: 14,
    upperArmF: 15, foreArmF: 14, upperArmB: 15, foreArmB: 14,
    thighF: 22, shinF: 21, footF: 9, thighB: 22, shinB: 21, footB: 9,
  };
  const JOINTS = Object.keys(BONES);
  // where limbs hang off the spine chain
  const SHOULDER_DROP = 2;   // below the chest tip
  const HIP_SPREAD = 2.5;    // fore/back hip x offset

  const EASE = {
    lin: u => u,
    io: u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
    out: u => 1 - (1 - u) * (1 - u),
    in: u => u * u,
  };

  // the neutral standing pose every clip layers over
  const BASE_POSE = {
    spine: 0.06, neck: 0.04, head: -0.06,
    upperArmF: 0.34, foreArmF: 0.42, upperArmB: -0.3, foreArmB: 0.34,
    thighF: 0.12, shinF: -0.06, footF: 1.48, thighB: -0.1, shinB: -0.04, footB: 1.5,
  };

  const CLIPS = {}; // filled by rig-clips.js

  function registerClip(name, clip) {
    // pre-sort tracks once so sampling is a forward scan
    for (const j in clip.tracks) clip.tracks[j].sort((a, b) => a[0] - b[0]);
    if (clip.root) clip.root.sort((a, b) => a[0] - b[0]);
    CLIPS[name] = clip;
  }

  function sampleTrack(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        const u = (t - a[0]) / (b[0] - a[0] || 1e-6);
        return a[1] + (b[1] - a[1]) * (EASE[b[2] || 'io'] || EASE.io)(u);
      }
    }
    return last[1];
  }

  function newPlayer() {
    const pose = {};
    for (const j of JOINTS) pose[j] = BASE_POSE[j];
    return {
      pose, rootDx: 0, rootDy: 0,
      cur: null, curT: 0, curSpeed: 1, curLoop: false,
      prev: null, prevT: 0, blend: 0, blendT: 0,
      talk: null, talkT: 0, talkAmt: 0,
      breathe: Math.random() * 6.28, // phase-offset so a crowd never syncs
    };
  }

  function play(rp, name, opt) {
    const clip = CLIPS[name];
    if (!clip) return false;
    opt = opt || {};
    if (opt.channel === 'talk') { rp.talk = clip; rp.talkT = 0; return true; }
    if (rp.cur === clip && (opt.loop == null ? clip.loop : opt.loop)) return true;
    rp.prev = rp.cur; rp.prevT = rp.curT;
    rp.cur = clip; rp.curT = 0;
    rp.curSpeed = opt.speed || 1;
    rp.curLoop = opt.loop == null ? !!clip.loop : opt.loop;
    rp.blend = opt.blend == null ? 0.18 : opt.blend;
    rp.blendT = 0;
    return true;
  }

  function stopTalk(rp) { rp.talk = null; }

  function tick(rp, dt, phase) {
    rp.breathe += dt;
    if (rp.cur) {
      if (phase != null && rp.cur.loop) rp.curT = phase * rp.cur.dur;
      else {
        rp.curT += dt * rp.curSpeed;
        if (rp.curLoop) rp.curT %= rp.cur.dur;
        else if (rp.curT > rp.cur.dur) rp.curT = rp.cur.dur;
      }
    }
    if (rp.blendT < rp.blend) rp.blendT = Math.min(rp.blend, rp.blendT + dt);
    if (rp.talk) {
      rp.talkT += dt;
      rp.talkAmt = Math.min(1, rp.talkAmt + dt * 6);
      if (rp.talkT > rp.talk.dur) { if (rp.talk.loop) rp.talkT %= rp.talk.dur; else rp.talk = null; }
    } else {
      rp.talkAmt = Math.max(0, rp.talkAmt - dt * 5);
    }
  }

  function samplePose(clip, t, out, mix) {
    for (const j in clip.tracks) {
      const v = sampleTrack(clip.tracks[j], t);
      out[j] = out[j] + (v - out[j]) * mix;
    }
  }

  function sample(rp) {
    const p = rp.pose;
    // start from base + breath (chest rise, shoulder sway — nobody is a statue)
    const br = Math.sin(rp.breathe * 1.9) * 0.02;
    for (const j of JOINTS) p[j] = BASE_POSE[j];
    p.spine += br; p.neck -= br * 0.6;
    p.upperArmF += br * 0.5; p.upperArmB -= br * 0.4;
    rp.rootDx = 0; rp.rootDy = Math.sin(rp.breathe * 1.9) * 0.35;

    const bl = rp.blend > 0 ? Math.min(1, rp.blendT / rp.blend) : 1;
    if (rp.prev && bl < 1) samplePose(rp.prev, rp.prevT, p, 1);
    if (rp.cur) {
      samplePose(rp.cur, rp.curT, p, bl);
      if (rp.cur.root) {
        rp.rootDx += sampleTrack(rp.cur.root.map(k => [k[0], k[1]]), rp.curT) * bl;
        rp.rootDy += sampleTrack(rp.cur.root.map(k => [k[0], k[2]]), rp.curT) * bl;
      }
    }
    if (rp.talk && rp.talkAmt > 0) samplePose(rp.talk, rp.talkT, p, rp.talkAmt * 0.85);
    return p;
  }

  // Forward kinematics: joint world positions for a sampled pose.
  // out receives {pelvis, chest, headBase, crown, shoulder, elbowF/B, wristF/B,
  // hipF/B, kneeF/B, ankleF/B, toeF/B} as flat x/y pairs. Reused object.
  function fk(p, rootX, rootY, facing, scale, out) {
    const s = scale, f = facing;
    const px = rootX, py = rootY;
    out.pelvisX = px; out.pelvisY = py;
    const sx = px + Math.sin(p.spine) * BONES.spine * s * f;
    const sy = py - Math.cos(p.spine) * BONES.spine * s;
    out.chestX = sx; out.chestY = sy;
    const nx = sx + Math.sin(p.spine + p.neck) * BONES.neck * s * f;
    const ny = sy - Math.cos(p.spine + p.neck) * BONES.neck * s;
    out.headBaseX = nx; out.headBaseY = ny;
    const ha = p.spine + p.neck + p.head;
    out.crownX = nx + Math.sin(ha) * BONES.head * s * f;
    out.crownY = ny - Math.cos(ha) * BONES.head * s;
    out.headAng = ha * f;
    // arms hang from just below the chest tip
    const shx = sx - Math.sin(p.spine) * SHOULDER_DROP * s * f;
    const shy = sy + Math.cos(p.spine) * SHOULDER_DROP * s;
    out.shoulderX = shx; out.shoulderY = shy;
    for (const side of ['F', 'B']) {
      const ua = p['upperArm' + side], fa = p['foreArm' + side];
      const ex = shx + Math.sin(ua) * BONES.upperArmF * s * f;
      const ey = shy + Math.cos(ua) * BONES.upperArmF * s;
      const wx = ex + Math.sin(ua + fa) * BONES.foreArmF * s * f;
      const wy = ey + Math.cos(ua + fa) * BONES.foreArmF * s;
      out['elbow' + side + 'X'] = ex; out['elbow' + side + 'Y'] = ey;
      out['wrist' + side + 'X'] = wx; out['wrist' + side + 'Y'] = wy;
      const hx = px + (side === 'F' ? HIP_SPREAD : -HIP_SPREAD) * s * f;
      const ta = p['thigh' + side], ka = p['shin' + side], oa = p['foot' + side];
      const kx = hx + Math.sin(ta) * BONES.thighF * s * f;
      const ky = py + Math.cos(ta) * BONES.thighF * s;
      const ax = kx + Math.sin(ta + ka) * BONES.shinF * s * f;
      const ay = ky + Math.cos(ta + ka) * BONES.shinF * s;
      out['hip' + side + 'X'] = hx; out['hip' + side + 'Y'] = py;
      out['knee' + side + 'X'] = kx; out['knee' + side + 'Y'] = ky;
      out['ankle' + side + 'X'] = ax; out['ankle' + side + 'Y'] = ay;
      out['toe' + side + 'X'] = ax + Math.sin(ta + ka + oa) * BONES.footF * s * f;
      out['toe' + side + 'Y'] = ay + Math.cos(ta + ka + oa) * BONES.footF * s;
    }
    return out;
  }

  return { registerClip, newPlayer, play, stopTalk, tick, sample, fk, BONES, BASE_POSE, CLIPS };
})();
