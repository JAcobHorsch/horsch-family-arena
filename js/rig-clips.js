// ===== rig-clips.js — the cutscene performance library =====
//
// Every clip here is authored against the Rig skeleton (see rig.js):
//   angles in radians, 0 = limb hanging straight down / spine straight up,
//   positive rotates toward +x (the facing direction). Knees only bend
//   backward (shin <= ~0), elbows only bend forward (foreArm >= ~0).
//   root offsets: dx positive = forward (scene code multiplies by facing),
//   dy positive = DOWN (canvas y). Standing pelvis sits ~43 units above the
//   ground, so a crouch is dy +5..8 and a floor crumple is dy +22..24.
//
// Loops keep first key == last key on every track so the wrap is invisible.
// Locomotion clips run dur 1 and rely on the engine driving phase from
// distance travelled, so stride timing is authored in cycle fractions.
//
// All helpers below run ONCE at registration — after load the clips are
// plain sorted data and the engine samples them allocation-free.
//
(() => {
  'use strict';

  // ---- build-time helpers ----
  const EASE = {
    lin: u => u,
    io: u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
    out: u => 1 - (1 - u) * (1 - u),
    in: u => u * u,
  };

  function sampleAt(keys, t) { // mirror of the engine's track sampler
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

  // Opposite-limb track for symmetric gaits: identical motion half a cycle
  // out of phase, resampled densely so the eased shape survives the shift.
  function half(keys, dur) {
    const N = 16, h = dur / 2, out = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * dur;
      out.push([t, sampleAt(keys, (t + h) % dur), 'lin']);
    }
    out[N][1] = out[0][1];
    return out;
  }

  // Shiver: fast alternating micro-keys around a base value (n must be even
  // so the loop seam matches).
  function trem(v, amp, dur, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push([(i / n) * dur, v + (i % 2 ? amp : -amp), 'io']);
    return out;
  }

  const reg = window.Rig.registerClip;

  // =====================================================================
  // LOCOMOTION (loop, dur 1 — engine drives phase from distance)
  // =====================================================================

  // ---- walk: relaxed, arms counter-swinging, slight lean into direction ----
  const WALK_THIGH = [[0, .5], [.35, -.15], [.55, -.5], [.8, .4], [.93, .56, 'out'], [1, .5]];
  const WALK_SHIN = [[0, -.12], [.15, -.3], [.4, -.18], [.6, -.55], [.75, -1.05], [.92, -.25, 'out'], [1, -.12]];
  const WALK_FOOT = [[0, 1.37], [.15, 1.61], [.4, 1.94], [.6, 2.08], [.75, 1.87], [.92, 1.45], [1, 1.37]];
  const WALK_UARM = [[0, -.45], [.5, .65], [1, -.45]];
  const WALK_FARM = [[0, .2], [.5, .55], [1, .2]];
  reg('walk', {
    dur: 1, loop: true,
    tracks: {
      spine: [[0, .13], [.25, .09], [.5, .13], [.75, .09], [1, .13]],
      neck: [[0, .03]],
      head: [[0, -.14]],
      thighF: WALK_THIGH, shinF: WALK_SHIN, footF: WALK_FOOT,
      thighB: half(WALK_THIGH, 1), shinB: half(WALK_SHIN, 1), footB: half(WALK_FOOT, 1),
      upperArmF: WALK_UARM, foreArmF: WALK_FARM,
      upperArmB: half(WALK_UARM, 1), foreArmB: half(WALK_FARM, 1),
    },
    root: [[0, 0, 4], [.25, 0, .6], [.5, 0, 4], [.75, 0, .6], [1, 0, 4]],
  });

  // ---- sneak: crouched glide, high careful steps, arms tucked, head scanning ----
  const SNEAK_THIGH = [[0, .7], [.28, .35], [.5, .15], [.72, .95], [.9, .82], [1, .7]];
  const SNEAK_SHIN = [[0, -1.05], [.28, -1.1], [.5, -.95], [.72, -1.7], [.9, -1.28], [1, -1.05]];
  const SNEAK_FOOT = [[0, 1.92], [.28, 2.32], [.5, 1.7], [.72, 1.75], [.9, 1.8], [1, 1.92]];
  const SNEAK_UARM = [[0, .55], [.5, .42], [1, .55]];
  const SNEAK_FARM = [[0, 1.3], [.5, 1.42], [1, 1.3]];
  reg('sneak', {
    dur: 1, loop: true,
    tracks: {
      spine: [[0, .52], [.5, .46], [1, .52]],
      neck: [[0, -.12]],
      head: [[0, -.45], [.3, -.28], [.6, -.52], [1, -.45]],
      thighF: SNEAK_THIGH, shinF: SNEAK_SHIN, footF: SNEAK_FOOT,
      thighB: half(SNEAK_THIGH, 1), shinB: half(SNEAK_SHIN, 1), footB: half(SNEAK_FOOT, 1),
      upperArmF: SNEAK_UARM, foreArmF: SNEAK_FARM,
      upperArmB: half(SNEAK_UARM, 1), foreArmB: half(SNEAK_FARM, 1),
    },
    root: [[0, 0, 6.5], [.28, 0, 6.9], [.5, 0, 6.5], [.78, 0, 6.9], [1, 0, 6.5]],
  });

  // ---- stomp: heavy menace — big lift, hard slam, fists low, hunched glower ----
  const STOMP_THIGH = [[0, .55], [.3, -.1], [.5, -.35], [.68, .55], [.9, .88], [1, .55, 'in']];
  const STOMP_SHIN = [[0, -.25], [.3, -.15], [.5, -.45], [.68, -1.2], [.9, -.85], [1, -.25, 'in']];
  const STOMP_FOOT = [[0, 1.27], [.3, 1.8], [.5, 2.1], [.9, 1.0], [1, 1.27, 'in']];
  const STOMP_UARM = [[0, .2], [.25, 0], [.5, .32], [.75, .1], [1, .2]];
  const STOMP_FARM = [[0, .75], [.25, .85], [.5, .7], [.75, .85], [1, .75]];
  reg('stomp', {
    dur: 1, loop: true,
    tracks: {
      spine: [[0, .32], [.08, .38, 'out'], [.3, .28], [.5, .32], [.58, .38, 'out'], [.8, .28], [1, .32]],
      neck: [[0, .08]],
      head: [[0, -.22]],
      thighF: STOMP_THIGH, shinF: STOMP_SHIN, footF: STOMP_FOOT,
      thighB: half(STOMP_THIGH, 1), shinB: half(STOMP_SHIN, 1), footB: half(STOMP_FOOT, 1),
      upperArmF: STOMP_UARM, foreArmF: STOMP_FARM,
      upperArmB: half(STOMP_UARM, 1), foreArmB: half(STOMP_FARM, 1),
    },
    root: [[0, 0, 4.2], [.25, 0, .5], [.45, 0, -1.2], [.5, 0, 4.2], [.75, 0, .5], [.95, 0, -1.2], [1, 0, 4.2]],
  });

  // ---- run: urgent lean, long stride, arms pumping ----
  const RUN_THIGH = [[0, .62], [.3, -.3], [.5, -.72], [.75, .5], [.9, .85, 'out'], [1, .62]];
  const RUN_SHIN = [[0, -.25], [.2, -.45], [.5, -.9], [.68, -1.7], [.85, -.7], [1, -.25, 'out']];
  const RUN_FOOT = [[0, 1.25], [.25, 1.95], [.5, 2.3], [.7, 2.0], [.9, 1.35], [1, 1.25]];
  const RUN_UARM = [[0, -.6], [.5, .9], [1, -.6]];
  const RUN_FARM = [[0, 1.15], [.5, 1.35], [1, 1.15]];
  reg('run', {
    dur: 1, loop: true,
    tracks: {
      spine: [[0, .32], [.25, .27], [.5, .32], [.75, .27], [1, .32]],
      neck: [[0, -.02]],
      head: [[0, -.2]],
      thighF: RUN_THIGH, shinF: RUN_SHIN, footF: RUN_FOOT,
      thighB: half(RUN_THIGH, 1), shinB: half(RUN_SHIN, 1), footB: half(RUN_FOOT, 1),
      upperArmF: RUN_UARM, foreArmF: RUN_FARM,
      upperArmB: half(RUN_UARM, 1), foreArmB: half(RUN_FARM, 1),
    },
    root: [[0, 0, 5.2], [.2, 0, .5], [.35, 0, -3], [.5, 0, 5.2], [.7, 0, .5], [.85, 0, -3], [1, 0, 5.2]],
  });

  // =====================================================================
  // IDLES (loop, dur 2.5–4)
  // =====================================================================

  // ---- idle: subtle weight shifts over the engine's breathing ----
  reg('idle', {
    dur: 3.5, loop: true,
    tracks: {
      spine: [[0, .06], [.9, .09], [1.8, .05], [2.6, .08], [3.5, .06]],
      neck: [[0, .04], [1.2, .01], [2.4, .06], [3.5, .04]],
      head: [[0, -.06], [.8, -.02], [1.6, -.1], [2.8, -.04], [3.5, -.06]],
      thighF: [[0, .12], [1.7, .06], [3.5, .12]],
      thighB: [[0, -.1], [1.7, -.04], [3.5, -.1]],
      shinF: [[0, -.06], [1.7, -.02], [3.5, -.06]],
      upperArmF: [[0, .34], [1.1, .28], [2.3, .4], [3.5, .34]],
      foreArmF: [[0, .42], [1.5, .5], [3.5, .42]],
      upperArmB: [[0, -.3], [1.4, -.24], [3.5, -.3]],
      foreArmB: [[0, .34], [1.8, .42], [3.5, .34]],
    },
    root: [[0, 0, 0], [.9, .7, .2], [1.8, -.5, 0], [2.7, .4, .2], [3.5, 0, 0]],
  });

  // ---- idle-tense: fists tightening, head lowered, micro-rocks ----
  reg('idle-tense', {
    dur: 2.8, loop: true,
    tracks: {
      spine: [[0, .14], [.7, .18], [1.4, .12], [2.1, .17], [2.8, .14]],
      neck: [[0, .1]],
      head: [[0, .14], [1.4, .2], [2.8, .14]],
      thighF: [[0, .16]], shinF: [[0, -.12]],
      thighB: [[0, -.14]], shinB: [[0, -.08]],
      upperArmF: [[0, .2], [1.4, .28], [2.8, .2]],
      foreArmF: [[0, .55], [.35, .95, 'out'], [.55, .62], [1.15, .92, 'out'], [1.4, .65], [2.0, .95, 'out'], [2.3, .6], [2.8, .55]],
      upperArmB: [[0, -.45], [1.4, -.36], [2.8, -.45]],
      foreArmB: [[0, .5], [.6, .85, 'out'], [.85, .55], [1.5, .88, 'out'], [1.75, .55], [2.4, .82, 'out'], [2.8, .5]],
    },
    root: [[0, 0, .3], [.5, -.8, .5], [1.0, .5, .2], [1.6, -.6, .5], [2.2, .6, .3], [2.8, 0, .3]],
  });

  // ---- cower: hunched, arms shielding the face, trembling ----
  reg('cower', {
    dur: 2.5, loop: true,
    tracks: {
      spine: trem(.6, .025, 2.5, 12),
      neck: [[0, .15]],
      head: trem(.35, .03, 2.5, 12),
      thighF: [[0, .5]], shinF: [[0, -1.1]], footF: [[0, 2.17]],
      thighB: [[0, .45]], shinB: [[0, -1.1]], footB: [[0, 2.22]],
      upperArmF: trem(1.0, .05, 2.5, 12),
      foreArmF: trem(2.2, .06, 2.5, 12),
      upperArmB: trem(.85, .05, 2.5, 12),
      foreArmB: trem(2.05, .06, 2.5, 12),
    },
    root: [[0, -.5, 6.4], [.4, .3, 6.7], [.8, -.4, 6.3], [1.3, .4, 6.7], [1.7, -.5, 6.4], [2.1, .3, 6.7], [2.5, -.5, 6.4]],
  });

  // =====================================================================
  // ONE-SHOTS
  // =====================================================================

  // ---- reach: one-arm reach forward with anticipation dip ----
  reg('reach', {
    dur: .95, loop: false,
    tracks: {
      spine: [[0, .06], [.22, .18], [.55, .28, 'out'], [.95, .24]],
      neck: [[0, .04], [.55, -.05], [.95, -.03]],
      head: [[0, -.06], [.2, .02], [.55, -.18, 'out'], [.95, -.15]],
      upperArmF: [[0, .3], [.2, .05], [.55, 1.38, 'out'], [.95, 1.3]],
      foreArmF: [[0, .45], [.2, .55], [.55, .12, 'out'], [.95, .15]],
      upperArmB: [[0, -.3], [.55, -.55], [.95, -.5]],
      thighF: [[0, .12], [.55, .3], [.95, .28]],
      thighB: [[0, -.1], [.55, -.35], [.95, -.32]],
      shinB: [[0, -.04], [.55, -.25], [.95, -.22]],
      footB: [[0, 1.5], [.55, 1.9], [.95, 1.85]],
    },
    root: [[0, 0, 0], [.2, -.8, 1.2], [.55, 2.6, 1.6], [.95, 2.4, 1.4]],
  });

  // ---- grab-lift: two-hand seize then hoist (root rises at the lift) ----
  reg('grab-lift', {
    dur: 1.7, loop: false,
    tracks: {
      spine: [[0, .06], [.18, .22], [.45, .34, 'out'], [.7, .3], [1.15, -.1], [1.7, -.08]],
      neck: [[0, .04], [.45, .1], [1.2, -.08], [1.7, -.06]],
      head: [[0, -.06], [.45, .15], [1.2, -.3], [1.7, -.28]],
      upperArmF: [[0, .34], [.15, .1], [.45, 1.25, 'out'], [.7, 1.2], [1.2, 1.95], [1.7, 1.9]],
      foreArmF: [[0, .42], [.45, .25, 'out'], [.7, .3], [1.2, .15], [1.7, .18]],
      upperArmB: [[0, -.3], [.15, -.45], [.45, 1.05, 'out'], [.7, 1.0], [1.2, 1.75], [1.7, 1.7]],
      foreArmB: [[0, .34], [.45, .3], [.7, .35], [1.2, .2], [1.7, .22]],
      thighF: [[0, .12], [.45, .5], [1.2, .1], [1.7, .12]],
      shinF: [[0, -.06], [.45, -.8], [1.2, -.08], [1.7, -.06]],
      thighB: [[0, -.1], [.45, .15], [1.2, -.08], [1.7, -.08]],
      shinB: [[0, -.04], [.45, -.6], [1.2, -.03], [1.7, -.03]],
      footF: [[0, 1.48], [.45, 1.9], [1.2, 1.5], [1.7, 1.48]],
    },
    root: [[0, 0, 0], [.45, 1.5, 4.5], [.7, 1.8, 4.2], [1.2, .5, -1.2], [1.7, .6, -1]],
  });

  // ---- struggle: suspended victim — legs kick, hands claw at the neck ----
  const STR_THIGH = [[0, .65], [.3, .15], [.55, .3], [.85, .65]];
  const STR_SHIN = [[0, -.35, 'out'], [.3, -1.35], [.6, -.6], [.85, -.35]];
  const STR_FOOT = [[0, .4], [.3, 1.6], [.6, .7], [.85, .4]];
  reg('struggle', {
    dur: .85, loop: true,
    tracks: {
      spine: [[0, -.12], [.3, -.2], [.6, -.08], [.85, -.12]],
      neck: [[0, -.1]],
      head: [[0, -.25], [.3, -.1], [.6, -.3], [.85, -.25]],
      thighF: STR_THIGH, shinF: STR_SHIN, footF: STR_FOOT,
      thighB: half(STR_THIGH, .85), shinB: half(STR_SHIN, .85), footB: half(STR_FOOT, .85),
      upperArmF: [[0, 2.3], [.25, 2.45], [.55, 2.2], [.85, 2.3]],
      foreArmF: [[0, 2.35], [.2, 2.15], [.5, 2.45], [.85, 2.35]],
      upperArmB: [[0, 2.1], [.3, 2.25], [.65, 2.05], [.85, 2.1]],
      foreArmB: [[0, 2.45], [.25, 2.25], [.55, 2.5], [.85, 2.45]],
    },
    root: [[0, 0, .5], [.28, .6, -.4], [.55, -.5, .4], [.85, 0, .5]],
  });

  // ---- throw: big wind back, violent release, follow-through past the body ----
  reg('throw', {
    dur: 1.15, loop: false,
    tracks: {
      spine: [[0, .06], [.4, -.28], [.58, .38, 'in'], [.8, .5, 'out'], [1.15, .4]],
      neck: [[0, .04], [.4, .12], [.8, -.05], [1.15, -.02]],
      head: [[0, -.06], [.4, .1], [.58, -.2, 'in'], [1.15, -.12]],
      upperArmF: [[0, .34], [.4, -1.05], [.58, 1.7, 'in'], [.8, 2.0, 'out'], [1.15, 1.6]],
      foreArmF: [[0, .42], [.4, .5], [.58, .1, 'in'], [.8, .2, 'out'], [1.15, .35]],
      upperArmB: [[0, -.3], [.4, -1.25], [.58, 1.5, 'in'], [.8, 1.75, 'out'], [1.15, 1.35]],
      foreArmB: [[0, .34], [.4, .6], [.58, .15, 'in'], [.8, .25, 'out'], [1.15, .35]],
      thighF: [[0, .12], [.4, .35], [.58, .3, 'in'], [1.15, .3]],
      shinF: [[0, -.06], [.4, -.45], [.58, -.3, 'in'], [1.15, -.35]],
      thighB: [[0, -.1], [.4, -.5], [.58, -.65, 'in'], [1.15, -.55]],
      footB: [[0, 1.5], [.4, 1.3], [.58, 2.2, 'in'], [1.15, 2.1]],
    },
    root: [[0, 0, 0], [.4, -3.2, 1.5], [.58, 3.5, 1.8], [.8, 4.2, 2.2], [1.15, 3.8, 2]],
  });

  // ---- thrown: airborne flail, spine arched, limbs cycling (fast loop) ----
  reg('thrown', {
    dur: .5, loop: true,
    tracks: {
      spine: [[0, -.45], [.25, -.28], [.5, -.45]],
      neck: [[0, -.15]],
      head: [[0, -.4], [.25, -.55], [.5, -.4]],
      upperArmF: [[0, 2.4], [.25, 1.2], [.5, 2.4]],
      foreArmF: [[0, .5], [.25, 1.1], [.5, .5]],
      upperArmB: [[0, 1.0], [.25, 2.2], [.5, 1.0]],
      foreArmB: [[0, 1.2], [.25, .4], [.5, 1.2]],
      thighF: [[0, .9], [.25, -.1], [.5, .9]],
      thighB: [[0, -.5], [.25, .5], [.5, -.5]],
      shinF: [[0, -.4], [.25, -1.0], [.5, -.4]],
      shinB: [[0, -.9], [.25, -.3], [.5, -.9]],
      footF: [[0, 1.0]], footB: [[0, .9]],
    },
  });

  // ---- land-crumple: impact fold — knees buckle, knees hit, torso folds
  //      over them, arms go slack, settle to a still heap ----
  reg('land-crumple', {
    dur: 1.4, loop: false,
    tracks: {
      spine: [[0, -.15], [.14, .3, 'in'], [.32, .5], [.7, .68, 'out'], [.95, .55], [1.4, .55]],
      neck: [[0, -.1], [.32, .15], [.7, .25], [1.4, .25]],
      head: [[0, -.35], [.14, -.1], [.32, .25], [.7, .6, 'out'], [1.4, .6]],
      upperArmF: [[0, 1.7], [.14, .9, 'in'], [.32, .55], [.7, .35], [1.4, .35]],
      foreArmF: [[0, .6], [.14, .25], [.32, .12], [.7, .1], [1.4, .1]],
      upperArmB: [[0, .9], [.14, .5], [.32, .3], [.7, .2], [1.4, .2]],
      foreArmB: [[0, .9], [.14, .3], [.32, .12], [.7, .1], [1.4, .1]],
      thighF: [[0, .35], [.14, .8, 'in'], [.32, .61], [.5, .61], [1.4, .61]],
      shinF: [[0, -.6], [.14, -1.5, 'in'], [.32, -1.9], [.5, -2.18], [1.4, -2.18]],
      footF: [[0, 1.2], [.32, .6], [.5, 0], [1.4, 0]],
      thighB: [[0, -.15], [.14, .35], [.32, .5], [.5, .55], [1.4, .55]],
      shinB: [[0, -.5], [.14, -1.5], [.32, -1.9], [.5, -2.25], [1.4, -2.25]],
      footB: [[0, 1.1], [.5, -.2], [1.4, -.2]],
    },
    root: [[0, 0, -2], [.14, 1.5, 10], [.32, 2.5, 20], [.5, 3, 25], [.7, 3, 24.6], [1.0, 3, 25], [1.4, 3, 25]],
  });

  // ---- get-up: rock forward, push off the floor, knee up, rise, stagger ----
  reg('get-up', {
    dur: 1.9, loop: false,
    tracks: {
      spine: [[0, .55], [.3, .82], [.65, .6], [1.0, .45], [1.3, -.08], [1.55, .15], [1.9, .07]],
      neck: [[0, .25], [.65, .15], [1.3, .02], [1.9, .04]],
      head: [[0, .6], [.3, .35], [1.0, .05], [1.3, -.1], [1.9, -.06]],
      upperArmF: [[0, .35], [.3, .85], [.65, .6], [1.0, .45], [1.3, .55], [1.9, .34]],
      foreArmF: [[0, .1], [.3, .08], [.65, .15], [1.0, .25], [1.3, .3], [1.9, .42]],
      upperArmB: [[0, .2], [.3, .65], [.65, .35], [1.0, 0], [1.3, -.5], [1.9, -.3]],
      foreArmB: [[0, .1], [.3, .08], [.65, .2], [1.0, .3], [1.3, .3], [1.9, .34]],
      thighF: [[0, .61], [.3, .8], [.65, 1.0], [1.0, .55], [1.3, .18], [1.9, .12]],
      shinF: [[0, -2.18], [.3, -1.9], [.65, -1.25], [1.0, -.6], [1.3, -.12], [1.9, -.06]],
      footF: [[0, 0], [.3, 1.2], [.65, 1.82], [1.0, 1.62], [1.9, 1.48]],
      thighB: [[0, .55], [.3, .35], [.65, .1], [1.0, -.15], [1.3, -.05], [1.9, -.1]],
      shinB: [[0, -2.25], [.3, -1.9], [.65, -1.5], [1.0, -.35], [1.3, -.1], [1.9, -.04]],
      footB: [[0, -.2], [.65, 1.0], [1.0, 1.6], [1.9, 1.5]],
    },
    root: [[0, 0, 25], [.3, -.5, 22], [.65, 1, 10.5], [1.0, 1.5, 3.5], [1.3, .3, -.8], [1.55, -.8, .6], [1.9, 0, 0]],
  });

  // ---- punch-tell: shoulder-loaded windup, hip-driven strike, recover ----
  reg('punch-tell', {
    dur: 1.05, loop: false,
    tracks: {
      spine: [[0, .06], [.38, -.2], [.5, .35, 'in'], [.62, .3, 'out'], [1.05, .12]],
      neck: [[0, .04], [.38, .1], [.5, .05], [1.05, .04]],
      head: [[0, -.06], [.38, .05], [.5, -.1, 'in'], [1.05, -.06]],
      upperArmF: [[0, .34], [.38, -.85], [.5, 1.55, 'in'], [.62, 1.45, 'out'], [1.05, .5]],
      foreArmF: [[0, .42], [.38, 1.6], [.5, .05, 'in'], [.62, .1, 'out'], [1.05, .4]],
      upperArmB: [[0, -.3], [.38, .35], [.5, -.6, 'in'], [1.05, -.35]],
      foreArmB: [[0, .34], [.38, 1.3], [.5, .8, 'in'], [1.05, .5]],
      thighF: [[0, .12], [.38, .2], [.5, .3, 'in'], [1.05, .15]],
      shinF: [[0, -.06], [.38, -.25], [.5, -.2], [1.05, -.08]],
      thighB: [[0, -.1], [.38, -.25], [.5, -.55, 'in'], [1.05, -.15]],
      footB: [[0, 1.5], [.38, 1.45], [.5, 2.1, 'in'], [1.05, 1.55]],
    },
    root: [[0, 0, 0], [.38, -3, .8], [.5, 3.4, 1.4], [.62, 3.0, 1.2], [1.05, .5, .4]],
  });

  // ---- point: accusatory arm extend with a lean-in ----
  reg('point', {
    dur: .85, loop: false,
    tracks: {
      spine: [[0, .06], [.15, .02], [.45, .28, 'out'], [.7, .31], [.85, .3]],
      neck: [[0, .04], [.45, .1], [.85, .1]],
      head: [[0, -.06], [.15, -.02], [.45, .05, 'out'], [.85, .04]],
      upperArmF: [[0, .34], [.15, .15], [.45, 1.5, 'out'], [.7, 1.55], [.85, 1.52]],
      foreArmF: [[0, .42], [.15, .7], [.45, .05, 'out'], [.85, .05]],
      upperArmB: [[0, -.3], [.45, -.5], [.85, -.48]],
      thighF: [[0, .12], [.45, .25], [.85, .25]],
      thighB: [[0, -.1], [.45, -.3], [.85, -.3]],
      shinB: [[0, -.04], [.45, -.2], [.85, -.2]],
    },
    root: [[0, 0, 0], [.15, -.4, .3], [.45, 1.8, .6], [.85, 1.7, .6]],
  });

  // ---- flinch: sharp recoil, arms up, half-step back ----
  reg('flinch', {
    dur: .65, loop: false,
    tracks: {
      spine: [[0, .06], [.1, -.32, 'out'], [.25, -.28], [.65, -.15]],
      neck: [[0, .04], [.1, -.15, 'out'], [.65, -.1]],
      head: [[0, -.06], [.1, -.28, 'out'], [.65, -.2]],
      upperArmF: [[0, .34], [.1, 1.25, 'out'], [.65, 1.0]],
      foreArmF: [[0, .42], [.1, 1.75, 'out'], [.65, 1.5]],
      upperArmB: [[0, -.3], [.1, 1.05, 'out'], [.65, .85]],
      foreArmB: [[0, .34], [.1, 1.55, 'out'], [.65, 1.3]],
      thighF: [[0, .12], [.1, .35, 'out'], [.65, .3]],
      shinF: [[0, -.06], [.1, -.5, 'out'], [.65, -.4]],
      thighB: [[0, -.1], [.1, -.3, 'out'], [.65, -.25]],
    },
    root: [[0, 0, 0], [.1, -3.8, 1.2], [.25, -4.2, 1.8], [.65, -3.2, 1.2]],
  });

  // ---- shrug: both arms out, palms-up beat, head tilt ----
  reg('shrug', {
    dur: 1.15, loop: false,
    tracks: {
      spine: [[0, .06], [.4, -.02], [.85, -.02], [1.15, .06]],
      neck: [[0, .04], [.4, -.1], [.85, -.1], [1.15, .04]],
      head: [[0, -.06], [.14, .02], [.4, -.35, 'out'], [.85, -.33], [1.15, -.1]],
      upperArmF: [[0, .34], [.14, .2], [.4, .7, 'out'], [.85, .72], [1.15, .4]],
      foreArmF: [[0, .42], [.14, .55], [.4, 1.6, 'out'], [.85, 1.62], [1.15, .5]],
      upperArmB: [[0, -.3], [.14, -.2], [.4, -.65, 'out'], [.85, -.66], [1.15, -.35]],
      foreArmB: [[0, .34], [.14, .5], [.4, 1.7, 'out'], [.85, 1.72], [1.15, .4]],
    },
    root: [[0, 0, 0], [.4, 0, -.9], [.85, 0, -.7], [1.15, 0, 0]],
  });

  // =====================================================================
  // TALK OVERLAYS (channel 'talk' — arms + head only, layer over any body)
  // =====================================================================

  // ---- talk-calm: small hand beats, head nods ----
  reg('talk-calm', {
    dur: 2.4, loop: true,
    tracks: {
      upperArmF: [[0, .5], [.55, .6], [1.3, .48], [1.9, .58], [2.4, .5]],
      foreArmF: [[0, .85], [.3, 1.1, 'out'], [.55, .9], [1.0, 1.15, 'out'], [1.3, .92], [1.9, 1.1, 'out'], [2.4, .85]],
      upperArmB: [[0, -.25], [1.2, -.15], [2.4, -.25]],
      foreArmB: [[0, .5], [.7, .65], [1.5, .5], [2.1, .6], [2.4, .5]],
      neck: [[0, .04], [1.2, .08], [2.4, .04]],
      head: [[0, -.06], [.3, .04, 'out'], [.6, -.08], [1.05, .05, 'out'], [1.35, -.06], [1.95, .03], [2.4, -.06]],
    },
  });

  // ---- talk-big: wide gestures, emphatic ----
  reg('talk-big', {
    dur: 2.8, loop: true,
    tracks: {
      upperArmF: [[0, .5], [.5, 1.3], [1.0, .8], [1.5, 1.45], [2.1, .6], [2.8, .5]],
      foreArmF: [[0, .9], [.5, .25], [1.0, .8], [1.5, .2], [2.1, .9], [2.8, .9]],
      upperArmB: [[0, -.4], [.7, .7], [1.3, -.2], [1.9, .55], [2.8, -.4]],
      foreArmB: [[0, .6], [.7, .3], [1.3, .7], [1.9, .25], [2.8, .6]],
      neck: [[0, .02], [1.4, .08], [2.8, .02]],
      head: [[0, -.1], [.5, .08, 'out'], [1.0, -.15], [1.5, .1, 'out'], [2.1, -.12], [2.8, -.1]],
    },
  });

  // ---- talk-angry: chopping hand, jabbing head ----
  reg('talk-angry', {
    dur: 2.2, loop: true,
    tracks: {
      upperArmF: [[0, .95], [.28, 1.15, 'in'], [.5, .9], [.85, 1.2, 'in'], [1.6, 1.15], [2.2, .95]],
      foreArmF: [[0, 1.35], [.28, .45, 'in'], [.5, 1.3, 'out'], [.85, .4, 'in'], [1.1, 1.25, 'out'], [1.6, .5, 'in'], [1.85, 1.3, 'out'], [2.2, 1.35]],
      upperArmB: [[0, -.2], [1.1, -.05], [2.2, -.2]],
      foreArmB: [[0, .85], [1.1, 1.0], [2.2, .85]],
      neck: [[0, .1], [.85, .16], [1.6, .12], [2.2, .1]],
      head: [[0, -.05], [.28, .14, 'in'], [.5, -.08, 'out'], [.85, .15, 'in'], [1.1, -.06], [1.6, .16, 'in'], [1.85, -.05], [2.2, -.05]],
    },
  });
})();
