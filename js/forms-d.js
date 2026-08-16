// forms-d.js — final-form bodies, batch D: PRINCESS ADDI, BOOMERANG BROOKS and
// KANSAS CITY DAYNE. Contract: FB.<charId>(g, a) draws ONLY the body in local
// feet-space — the caller owns the transform, ground shadow, ascended aura and
// the flash/frozen overlays. Every palette and mote table is hoisted; nothing
// in a draw body allocates, concatenates a string, or builds an array.
(function () {
  const FB = (window.FORM_BODIES = window.FORM_BODIES || {});
  const PI = Math.PI;

  // ---- shared face/limb constants (same numbers drawFighter uses) ----
  const HEAD_SHADE = 'rgba(20,16,26,0.16)';
  const HEAD_RIM = 'rgba(255,246,221,0.4)';
  const WHITE = '#ffffff';
  const BLUSH = 'rgba(255,122,122,0.35)';
  const ARM_W = 7, LEG_W = 8.5, TORSO_W = 15;
  const SIN60 = 0.866; // snowflake asterisk arm, precomputed

  // princess addi
  const AD_ICE = '#9fdcff', AD_MID = '#6cc4f0', AD_CORE = '#e8fbff';
  const AD_CAPE = '#bfe6f5', AD_GOLD = '#ffd24a', AD_JEWEL = '#4adbe8';
  const AD_SILVER = '#c9ccd8', AD_STEEL = '#2c4a6a', AD_WRAP = '#2c3a4a';
  const SNOW_MOTES = [-22, -74, 0, 2.2, 18, -84, 0.3, 1.8, -8, -92, 0.55, 2.6, 24, -60, 0.8, 2];

  // boomerang brooks
  const BR_GRN = '#37b34a', BR_DK = '#1f6b2e', BR_STRIPE = '#f2ede0';
  const BR_GLEAM = '#ffffff', BR_STRAP = '#8a5c30', BR_GOLD = '#ffd24a';
  const BR_CHIN = '#5c3a1e', BR_LENS = '#9fdcff';
  const BR_SPEED = 'rgba(255,255,255,0.5)', BR_SPEED2 = 'rgba(255,255,255,0.7)';
  const GLEAM_MOTES = [0, 0.33, 0.66];
  const BR_TIPS = [-25.4, 9.3, -14.8, -22.6]; // arm tips in rig space, post arm-rotate

  // kansas city dayne
  const KC_RED = '#d43b2f', KC_DEEP = '#8a1f1a', KC_GOLD = '#ffd24a';
  const KC_BOX = '#c98d48', KC_TAPE = '#e8d9b0', KC_GREY = '#b0b6c4';
  const KC_FLAP = '#b87a3a', KC_MARK = '#2a2a35';
  const CONF_MOTES = [-18, -72, 0, 14, -80, 0.35, 0, -88, 0.7]; // dx, dy, phase

  // ---- module-scope helpers (plain fns: zero per-frame closure allocs) ----
  // chibi skull with drawFighter's shade crescent, sun rim and optional ear
  function headSkull(g, a, hx, hy, ear) {
    const R = a.ramp(a.skin);
    g.fillStyle = a.skin;
    g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
    g.strokeStyle = R.out; g.lineWidth = 2; g.stroke();
    g.save();
    g.beginPath(); g.arc(hx, hy, 8.6, 0, 7); g.clip();
    g.fillStyle = HEAD_SHADE; g.fillRect(hx - 10, hy - 10, 5.5, 20);
    g.strokeStyle = HEAD_RIM; g.lineWidth = 2.2;
    g.beginPath(); g.arc(hx - 0.5, hy - 1, 6.9, PI * 1.02, PI * 1.62); g.stroke();
    g.restore();
    if (ear) {
      g.fillStyle = a.skin;
      g.beginPath(); g.arc(hx - 8.1, hy + 1, 2.3, 0, 7); g.fill();
      g.strokeStyle = R.out; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = R.dk;
      g.beginPath(); g.arc(hx - 8.1, hy + 1.2, 1, 0, 7); g.fill();
    }
  }

  // drawFighter's eyes verbatim so every form blinks with the roster
  function faceEyes(g, a, hx, hy, blush) {
    const ex1 = hx + 2, ex2 = hx + 6.2, ey = hy - 1.5;
    const INK = a.INK;
    if (blush) {
      g.fillStyle = BLUSH;
      g.beginPath(); g.ellipse(hx + 0.6, hy + 2.2, 1.7, 1.05, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(hx + 6.8, hy + 2, 1.7, 1.05, 0, 0, 7); g.fill();
    }
    if (a.hurt) {
      g.strokeStyle = INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.6, ey - 1.6); g.lineTo(ex1 + 1.6, ey + 1.6);
      g.moveTo(ex1 + 1.6, ey - 1.6); g.lineTo(ex1 - 1.6, ey + 1.6);
      g.moveTo(ex2 - 1.6, ey - 1.6); g.lineTo(ex2 + 1.6, ey + 1.6);
      g.moveTo(ex2 + 1.6, ey - 1.6); g.lineTo(ex2 - 1.6, ey + 1.6);
      g.stroke();
      return;
    }
    if (Math.sin(a.animT * 1.3 + ex1) > 0.985) { // blink
      g.strokeStyle = INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.5, ey); g.lineTo(ex1 + 1.5, ey);
      g.moveTo(ex2 - 1.5, ey); g.lineTo(ex2 + 1.5, ey);
      g.stroke();
      return;
    }
    g.fillStyle = WHITE;
    g.beginPath(); g.ellipse(ex1, ey, 1.9, 2.35, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(ex2, ey, 1.9, 2.35, 0, 0, 7); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.arc(ex1 + 0.75, ey + 0.15, 1.05, 0, 7); g.fill();
    g.beginPath(); g.arc(ex2 + 0.75, ey + 0.15, 1.05, 0, 7); g.fill();
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(ex1 + 0.35, ey - 0.75, 0.45, 0, 7); g.fill();
    g.beginPath(); g.arc(ex2 + 0.35, ey - 0.75, 0.45, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(ex1 - 1.9, ey - 2); g.lineTo(ex1 + 1.9, ey - 2.3);
    g.moveTo(ex2 - 1.9, ey - 2); g.lineTo(ex2 + 1.9, ey - 2.3);
    g.stroke();
    if (a.attackKey) {
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(ex1 - 2, ey - 4); g.lineTo(ex1 + 1.5, ey - 2.6);
      g.moveTo(ex2 + 2.5, ey - 4.2); g.lineTo(ex2 - 1, ey - 2.6);
      g.stroke();
    } else {
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.8, ey - 4.1); g.lineTo(ex1 + 1.5, ey - 4.3);
      g.moveTo(ex2 - 1.5, ey - 4.3); g.lineTo(ex2 + 1.8, ey - 4.1);
      g.stroke();
    }
  }

  function mitt(g, col, R, x, y, r) {
    g.fillStyle = R.out; g.beginPath(); g.arc(x, y, r + 1.1, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = R.lt; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.52, 0, 7); g.fill();
    g.fillStyle = R.dk; g.beginPath(); g.arc(x + r * 0.55, y + r * 0.28, r * 0.32, 0, 7); g.fill();
  }

  function shoe(g, col, R, fx, fy) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5.4, fy - 6.4, 12.2, 7.6, 3); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(fx - 4.6, fy - 5.7, 10.6, 6.2, 2.6); g.fill();
    g.fillStyle = R.lt; g.fillRect(fx - 4.6, fy - 1.1, 10.6, 1.6);
    g.fillStyle = R.hi; g.beginPath(); g.arc(fx + 3.6, fy - 4.2, 1.1, 0, 7); g.fill();
  }

  // 4-point star as an 8-vertex diamond (the engine's sparkle shape)
  function star4(g, x, y, r) {
    const i = r * 0.27;
    g.beginPath();
    g.moveTo(x - r, y); g.lineTo(x - i, y - i); g.lineTo(x, y - r); g.lineTo(x + i, y - i);
    g.lineTo(x + r, y); g.lineTo(x + i, y + i); g.lineTo(x, y + r); g.lineTo(x - i, y + i);
    g.closePath(); g.fill();
  }

  // ============================= PRINCESS ADDI =============================
  // THE ETERNAL WINTER, her coronation saber: ice-crown claw guard, wrapped
  // grip, jewel pommel, deep-ice core blade under a three-layer frost envelope.
  function eternalWinter(g, a, x, y, rot, len) {
    const t = a.animT;
    const SIL = a.ramp(AD_SILVER), ICE = a.ramp(AD_ICE);
    const fl = Math.sin(t * 9), fl2 = Math.sin(t * 7 + 2); // slower/jaggier than fire
    const tip = len, mid = len - 2.4, sp = len / 36.4; // envelope scales with reach
    g.save();
    g.translate(x, y); g.rotate(rot);
    // 1 silhouette: claw guard + wrapped grip + jewel pommel
    g.fillStyle = SIL.out;
    g.beginPath();
    g.roundRect(-0.6, -6, 4.2, 12, 1.5);
    g.moveTo(2.2, -5.6); g.lineTo(5.8, -9); g.lineTo(7.4, -5.8); g.closePath();
    g.moveTo(2.2, 5.6); g.lineTo(5.8, 9); g.lineTo(7.4, 5.8); g.closePath();
    g.fill();
    g.fillStyle = AD_SILVER;
    g.beginPath(); g.roundRect(0, -5.4, 3, 10.8, 1.2); g.fill();
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.moveTo(2.8, -5.8); g.lineTo(5.6, -8.4); g.lineTo(6.9, -6); g.closePath();
    g.moveTo(2.8, 5.8); g.lineTo(5.6, 8.4); g.lineTo(6.9, 6); g.closePath();
    g.fill();
    g.lineCap = 'butt';
    g.strokeStyle = AD_WRAP; g.lineWidth = 3.6;
    g.beginPath(); g.moveTo(-4.6, 0); g.lineTo(0, 0); g.stroke();
    g.lineCap = 'round';
    g.fillStyle = ICE.out; g.beginPath(); g.arc(-6, 0, 2.6, 0, 7); g.fill();
    g.fillStyle = AD_JEWEL; g.beginPath(); g.arc(-6, 0, 2, 0, 7); g.fill();
    g.fillStyle = AD_CORE; g.beginPath(); g.arc(-6.4, -0.4, 0.9, 0, 7); g.fill();
    g.fillStyle = AD_STEEL;
    g.beginPath();
    g.moveTo(3.4, -2.6); g.lineTo(mid, -2.6); g.lineTo(tip, 0); g.lineTo(mid, 2.6); g.lineTo(3.4, 2.6);
    g.closePath(); g.fill();
    // 2 frost envelope, 3 fills: deep tongues, aurora mid, near-white core
    g.fillStyle = AD_JEWEL;
    g.beginPath();
    g.moveTo(4, -2.4);
    g.lineTo(7 * sp, -7 - 1.2 * fl); g.lineTo(10 * sp, -2.8);
    g.lineTo(13.5 * sp, -8.4 + fl2); g.lineTo(17 * sp, -3);
    g.lineTo(20 * sp, -9 - 1.2 * fl); g.lineTo(23 * sp, -3);
    g.lineTo(26.5 * sp, -7.6 + fl2); g.lineTo(30 * sp, -2.6);
    g.lineTo(tip + 1.8, 0);
    g.lineTo(30 * sp, 2.2); g.lineTo(5, 2.8);
    g.closePath(); g.fill();
    g.fillStyle = AD_ICE;
    g.beginPath();
    g.moveTo(5, -1.8);
    g.lineTo(8 * sp, -5.2 - fl2); g.lineTo(11.5 * sp, -2.2);
    g.lineTo(15 * sp, -6.2 + fl); g.lineTo(18.5 * sp, -2.4);
    g.lineTo(22 * sp, -6.6 - fl2); g.lineTo(25 * sp, -2.2);
    g.lineTo(28 * sp, -5.2 + fl); g.lineTo(31 * sp, -1.8); g.lineTo(tip, 0);
    g.lineTo(30 * sp, 2.2); g.lineTo(6, 2.2);
    g.closePath(); g.fill();
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.moveTo(6, -1); g.lineTo(20 * sp, -1.5); g.lineTo(31 * sp, -0.5); g.lineTo(tip - 0.6, 0);
    g.lineTo(29 * sp, 1); g.lineTo(7, 1);
    g.closePath(); g.fill();
    // 3 core line (flat white — no shadowBlur pass on this body)
    g.strokeStyle = WHITE; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(6, 0.1); g.lineTo(tip - 1, 0.1); g.stroke();
    g.restore();
  }

  FB.addi = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ak = a.attackKey, ext = ak ? a.attackExt : 0;
    const cf = a.crouch ? 0.6 : 1;
    const sy = a.shy, hy = -78 * cf - 7, hx = 3 + a.lean * 0.6;
    const hpx = a.hipx + a.lean * 0.3, shx = a.shx + a.lean * 0.5;
    const ICE = a.ramp(AD_ICE), MID = a.ramp(AD_MID), GLD = a.ramp(AD_GOLD);
    const C2R = a.ramp(a.color2), SKR = a.ramp(a.skin);
    const csway = Math.sin(t * 1.5) * 2; // regal drift on the half-cape

    // 1 glacial half-cape, behind everything
    g.globalAlpha = 0.75;
    g.fillStyle = AD_CAPE;
    g.beginPath();
    g.moveTo(-6, sy); g.lineTo(6, sy);
    g.lineTo(14 + csway, -4); g.lineTo(-18 + csway, -2);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = AD_CORE; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(14 + csway, -4); g.lineTo(-18 + csway, -2); g.stroke();

    // 2 body: engine limbs in her colors
    a.limbStroke(g, hpx, a.hipy, a.bfx, a.bfy, LEG_W, a.color2);
    shoe(g, a.color2, C2R, a.bfx, a.bfy);
    a.limbStroke(g, shx, sy, a.bhx, a.bhy, ARM_W, a.color2);
    a.limbStroke(g, hpx, a.hipy, shx, sy, TORSO_W, a.color);
    a.limbStroke(g, hpx, a.hipy, a.ffx, a.ffy, LEG_W, a.color);
    shoe(g, a.color2, C2R, a.ffx, a.ffy);

    // 3 ball-gown bell — control points swish with the gait, flare on attack
    const fl = ak ? 4 * ext : 0, gs = Math.sin(a.walkCyc) * 3;
    g.fillStyle = MID.out;
    g.beginPath();
    g.moveTo(-7, a.hipy - 2);
    g.quadraticCurveTo(-19 - fl + gs, -16, -17 - fl, -1);
    g.lineTo(17 + fl, -1);
    g.quadraticCurveTo(19 + fl + gs, -16, 7, a.hipy - 2);
    g.closePath(); g.fill();
    g.fillStyle = AD_MID;
    g.beginPath();
    g.moveTo(-6, a.hipy - 1);
    g.quadraticCurveTo(-18 - fl + gs, -16, -16 - fl, -2);
    g.lineTo(16 + fl, -2);
    g.quadraticCurveTo(18 + fl + gs, -16, 6, a.hipy - 1);
    g.closePath(); g.fill();
    g.fillStyle = AD_ICE;
    g.beginPath();
    g.moveTo(-4, a.hipy - 2); g.lineTo(6, -1); g.lineTo(-8, -1);
    g.closePath(); g.fill();
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.moveTo(-15, -1); g.arc(-12, -1, 3, PI, 0);
    g.moveTo(-7, -1); g.arc(-4, -1, 3, PI, 0);
    g.moveTo(1, -1); g.arc(4, -1, 3, PI, 0);
    g.moveTo(9, -1); g.arc(12, -1, 3, PI, 0);
    g.moveTo(-8.3, -13); g.arc(-9, -13, 0.7, 0, 7);
    g.moveTo(3.7, -18); g.arc(3, -18, 0.7, 0, 7);
    g.moveTo(9.7, -9); g.arc(9, -9, 0.7, 0, 7);
    g.fill();

    // 4 bodice + frozen waist band
    g.fillStyle = AD_ICE;
    g.beginPath(); g.roundRect(-6, sy, 13, 16, 4); g.fill();
    g.strokeStyle = ICE.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-4.6, sy + 2.4); g.lineTo(-4.6, sy + 13.6); g.stroke();
    g.fillStyle = AD_JEWEL; g.fillRect(-6, sy + 15, 13, 2.6);

    // 5 faceted ice pauldrons
    g.fillStyle = ICE.out;
    g.beginPath();
    g.moveTo(shx - 13, sy); g.lineTo(shx - 8, sy - 9); g.lineTo(shx - 3, sy);
    g.closePath();
    g.moveTo(shx + 3, sy); g.lineTo(shx + 8, sy - 9); g.lineTo(shx + 13, sy);
    g.closePath();
    g.fill();
    g.fillStyle = AD_ICE;
    g.beginPath();
    g.moveTo(shx - 11.8, sy - 0.6); g.lineTo(shx - 8, sy - 7.4); g.lineTo(shx - 4.2, sy - 0.6);
    g.closePath();
    g.moveTo(shx + 4.2, sy - 0.6); g.lineTo(shx + 8, sy - 7.4); g.lineTo(shx + 11.8, sy - 0.6);
    g.closePath();
    g.fill();
    g.globalAlpha = ak === 'B' ? 1 : 0.75; // the volley pins the facets bright
    g.strokeStyle = AD_CORE; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(shx - 11.8, sy - 0.6); g.lineTo(shx - 8, sy - 7.4);
    g.moveTo(shx + 4.2, sy - 0.6); g.lineTo(shx + 8, sy - 7.4);
    g.stroke();
    g.globalAlpha = 1;

    // 6 ice-diamond brooch, twinkling out of phase with the crown jewel
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.moveTo(1, sy + 2.4); g.lineTo(3.6, sy + 5); g.lineTo(1, sy + 7.6); g.lineTo(-1.6, sy + 5);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = AD_JEWEL; g.lineWidth = 0.8; g.stroke();

    // 7 head + crown (chibi group, as drawFighter scales it)
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    g.save();
    if (a.hurt) { // even winter flinches
      g.translate(hx, hy - 9.5); g.rotate(0.12); g.translate(-hx, -(hy - 9.5));
    }
    g.fillStyle = GLD.out;
    g.beginPath(); g.roundRect(hx - 7.5, hy - 9.5, 15, 3.4, 1.4); g.fill();
    g.fillStyle = AD_GOLD;
    g.beginPath(); g.roundRect(hx - 7, hy - 9, 14, 2.4, 1.1); g.fill();
    g.fillStyle = AD_ICE; // five faceted ice spikes off the band
    g.beginPath();
    g.moveTo(hx - 1.5, hy - 9.5); g.lineTo(hx, hy - 17); g.lineTo(hx + 1.5, hy - 9.5); g.closePath();
    g.moveTo(hx - 4.9, hy - 9.5); g.lineTo(hx - 3.4, hy - 14.5); g.lineTo(hx - 1.9, hy - 9.5); g.closePath();
    g.moveTo(hx + 1.9, hy - 9.5); g.lineTo(hx + 3.4, hy - 14.5); g.lineTo(hx + 4.9, hy - 9.5); g.closePath();
    g.moveTo(hx - 7.6, hy - 9.5); g.lineTo(hx - 6.4, hy - 12.5); g.lineTo(hx - 5.2, hy - 9.5); g.closePath();
    g.moveTo(hx + 5.2, hy - 9.5); g.lineTo(hx + 6.4, hy - 12.5); g.lineTo(hx + 7.6, hy - 9.5); g.closePath();
    g.fill();
    g.strokeStyle = AD_CORE; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hx - 1.5, hy - 9.5); g.lineTo(hx, hy - 17);
    g.moveTo(hx - 4.9, hy - 9.5); g.lineTo(hx - 3.4, hy - 14.5);
    g.moveTo(hx + 1.9, hy - 9.5); g.lineTo(hx + 3.4, hy - 14.5);
    g.stroke();
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
    g.fillStyle = AD_JEWEL;
    g.beginPath(); g.arc(hx, hy - 8, 1.5, 0, 7); g.fill();
    if (ak === 'B') { // the blizzard volley visibly leaves from the crown
      g.globalAlpha = ext;
      g.fillStyle = WHITE;
      g.beginPath(); g.arc(hx, hy - 8, 1.5, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
    faceEyes(g, a, hx, hy, false);
    g.restore();

    // 8 front arm, then the twin ice swords: saber lead, frost shard rear
    a.limbStroke(g, shx, sy, a.fhx, a.fhy, ARM_W, a.color);
    eternalWinter(g, a, a.bhx, a.bhy, -2.5 - ext * 0.6, 16);
    eternalWinter(g, a, a.fhx, a.fhy, -0.6 + ext * 1.2, 36.4);

    // 9 mitts + frost glove cuffs
    mitt(g, a.skin, SKR, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SKR, a.bhx, a.bhy, 3.38);
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.roundRect(a.fhx - 2, a.fhy + 1.4, 4, 3, 1);
    g.roundRect(a.bhx - 2, a.bhy + 1.4, 4, 3, 1);
    g.fill();

    // 10 snowflake motes — ice is grav-true, so they FALL
    const ssp = ak ? 0.6 : 0.3, samp = a.hurt ? 0.3 : 0.8;
    g.strokeStyle = AD_CORE; g.lineWidth = 1;
    for (let i = 0; i < 16; i += 4) {
      const p = SNOW_MOTES[i + 2], r = SNOW_MOTES[i + 3];
      const cyc = (t * ssp + p) % 1;
      const sx = SNOW_MOTES[i] + Math.sin(t * 2 + p) * 2.5;
      const sny = SNOW_MOTES[i + 1] + cyc * 16;
      const ax = r * 0.5, ay = r * SIN60;
      g.globalAlpha = (1 - cyc) * samp;
      g.beginPath();
      g.moveTo(sx - r, sny); g.lineTo(sx + r, sny);
      g.moveTo(sx - ax, sny - ay); g.lineTo(sx + ax, sny + ay);
      g.moveTo(sx - ax, sny + ay); g.lineTo(sx + ax, sny - ay);
      g.stroke();
    }
    g.globalAlpha = 1;
  };

  // ============================ BOOMERANG BROOKS ============================
  // one painted arm of the back rig; drawn in rig space, caller owns the rotate
  function rangArm(g, a, ang) {
    const GR = a.ramp(BR_GRN);
    g.save(); g.rotate(ang);
    g.fillStyle = GR.out; g.beginPath(); g.roundRect(-27, -5, 27, 10, 5); g.fill();
    g.fillStyle = BR_GRN; g.beginPath(); g.roundRect(-26, -4, 25, 8, 4); g.fill();
    g.fillStyle = BR_STRIPE; g.fillRect(-24, -1.2, 22, 2.4);
    g.fillStyle = BR_DK; g.beginPath(); g.roundRect(-27, -4.5, 5, 9, 3.5); g.fill();
    g.restore();
  }

  FB.brooks = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ak = a.attackKey, ext = ak ? a.attackExt : 0;
    const cf = a.crouch ? 0.6 : 1;
    const sy = a.shy, hy = -78 * cf - 7, hx = 3 + a.lean * 0.6;
    const hpx = a.hipx + a.lean * 0.3, shx = a.shx + a.lean * 0.5;
    const C2R = a.ramp(a.color2), SKR = a.ramp(a.skin), STR = a.ramp(BR_STRAP);
    const air = !a.onGround;
    // the rig bobs, sweeps back into velocity and goes horizontal in the air
    const bt = Math.sin(t * 3) * 0.06 + (a.moving ? -0.15 : 0) + (air ? -0.75 : 0)
      + (ak === 'B' ? 0.4 * ext : -0.1 * ext);

    // 1 the boomerang V, strapped across his back
    g.save(); g.translate(-3, -56); g.rotate(bt);
    rangArm(g, a, -0.35); // down-left
    rangArm(g, a, 0.98);  // up-left, taller than his shoulders
    const GLD = a.ramp(BR_GOLD);
    g.fillStyle = GLD.out; g.beginPath(); g.arc(0, 0, 3.6, 0, 7); g.fill();
    g.fillStyle = BR_GOLD; g.beginPath(); g.arc(0, 0, 2.8, 0, 7); g.fill();
    g.fillStyle = GLD.dk; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill();
    g.restore();

    // 2 body: engine limbs in his green
    a.limbStroke(g, hpx, a.hipy, a.bfx, a.bfy, LEG_W, a.color2);
    shoe(g, a.color2, C2R, a.bfx, a.bfy);
    a.limbStroke(g, shx, sy, a.bhx, a.bhy, ARM_W, a.color2);
    a.limbStroke(g, hpx, a.hipy, shx, sy, TORSO_W, a.color);

    // 3 X harness (over the torso, or the straps would never be seen)
    g.strokeStyle = BR_STRAP; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-8, sy); g.lineTo(8, sy + 18);
    g.moveTo(8, sy); g.lineTo(-8, sy + 18);
    g.stroke();
    g.fillStyle = BR_GOLD; g.fillRect(-1.5, sy + 8, 3, 3);

    a.limbStroke(g, hpx, a.hipy, a.ffx, a.ffy, LEG_W, a.color);
    shoe(g, a.color2, C2R, a.ffx, a.ffy);

    // 4 head: leather flight helmet, goggles, and the grin (chibi group)
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, false);
    g.fillStyle = STR.out;
    g.beginPath(); g.arc(hx, hy - 2, 10.6, PI, 0.15); g.closePath(); g.fill();
    g.fillStyle = BR_STRAP;
    g.beginPath(); g.arc(hx, hy - 2, 9.6, PI, 0.15); g.closePath(); g.fill();
    g.beginPath(); g.roundRect(hx - 9.5, hy - 1, 4, 6, 2); g.fill();
    g.strokeStyle = BR_CHIN; g.lineWidth = 1;
    g.beginPath(); g.arc(hx + 0.5, hy + 1, 8.6, 0.45, PI * 0.82); g.stroke();
    faceEyes(g, a, hx, hy, true);
    // 5 goggles ride the dome — until he gets hit and they drop over his eyes
    const gy = a.hurt ? hy - 1.5 : hy - 8;
    g.globalAlpha = 0.9;
    g.fillStyle = BR_LENS;
    g.beginPath(); g.arc(hx - 3, gy, 2.8, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 3.6, gy, 2.8, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = BR_GOLD; g.lineWidth = 1.2;
    g.beginPath();
    g.arc(hx - 3, gy, 2.8, 0, 7);
    g.moveTo(hx - 0.2, gy); g.lineTo(hx + 0.8, gy);
    g.moveTo(hx + 6.4, gy); g.arc(hx + 3.6, gy, 2.8, 0, 7);
    g.stroke();
    g.strokeStyle = BR_CHIN; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(hx - 5.8, gy); g.lineTo(hx - 9.4, gy + 1.4);
    g.moveTo(hx + 6.4, gy - 0.6); g.lineTo(hx + 8.6, gy + 2);
    g.stroke();
    // 6 the grin, plus a tooth-gleam twinkle
    g.strokeStyle = BR_GLEAM; g.lineWidth = 2;
    g.beginPath(); g.arc(hx + 3, hy + 3.5, 3.4, 0.15, PI * 0.85); g.stroke();
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = BR_GLEAM;
    star4(g, hx + 6.5, hy + 2, 1.4);
    g.globalAlpha = 1;
    g.restore();

    // 7 front arm + the fanged throwing boomerang he actually swings
    a.limbStroke(g, shx, sy, a.fhx, a.fhy, ARM_W, a.color);
    g.save();
    g.translate(a.fhx, a.fhy);
    g.rotate(-0.5 + (ak ? ext * 2.4 : Math.sin(t * 3) * 0.12));
    const GR = a.ramp(BR_GRN);
    for (let i = 0; i < 2; i++) {
      g.save(); g.rotate(i ? 0.62 : -0.62);
      g.fillStyle = GR.out; g.beginPath(); g.roundRect(0, -3.2, 16, 6.4, 3.2); g.fill();
      g.fillStyle = BR_GRN; g.beginPath(); g.roundRect(0.7, -2.6, 14.6, 5.2, 2.6); g.fill();
      g.fillStyle = BR_STRIPE; g.fillRect(2.4, -0.8, 11, 1.6);
      g.restore();
    }
    // the bite in the V's mouth: snaps shut through the swing
    const gap = ak ? (1 - ext) * 3.2 + 1.4 : 2.4 + 0.9 * Math.sin(t * 10);
    g.fillStyle = BR_GLEAM;
    g.beginPath();
    for (let i = 0; i < 3; i++) {
      const bx = 7 + i * 3.2;
      g.moveTo(bx - 1.4, -gap - 3); g.lineTo(bx + 1.4, -gap - 3); g.lineTo(bx, -gap); g.closePath();
      g.moveTo(bx - 1.4, gap + 3); g.lineTo(bx + 1.4, gap + 3); g.lineTo(bx, gap); g.closePath();
    }
    g.fill();
    g.fillStyle = GLD.out; g.beginPath(); g.arc(0, 0, 3.2, 0, 7); g.fill();
    g.fillStyle = BR_GOLD; g.beginPath(); g.arc(0, 0, 2.4, 0, 7); g.fill();
    g.restore();

    mitt(g, a.skin, SKR, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SKR, a.bhx, a.bhy, 3.38);

    // 8 speed lines — he leans into velocity, doubled in the air
    if (a.moving || air) {
      const sh2 = (a.walkCyc * 40) % 8;
      g.strokeStyle = air ? BR_SPEED2 : BR_SPEED; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-30 - sh2, -66); g.lineTo(-20 - sh2, -66);
      g.moveTo(-30 - sh2, -56); g.lineTo(-20 - sh2, -56);
      g.moveTo(-30 - sh2, -46); g.lineTo(-20 - sh2, -46);
      if (air) {
        g.moveTo(-44 - sh2, -62); g.lineTo(-34 - sh2, -62);
        g.moveTo(-44 - sh2, -52); g.lineTo(-34 - sh2, -52);
        g.moveTo(-44 - sh2, -42); g.lineTo(-34 - sh2, -42);
      }
      g.stroke();
    }

    // 9 tooth-gleam sparks off the boomerang tips (rig space, so they follow it)
    g.save(); g.translate(-3, -56); g.rotate(bt);
    const gsp = air ? 1.8 : 0.9;
    for (let i = 0; i < 3; i++) {
      const p = GLEAM_MOTES[i], k = (i & 1) << 1;
      const cyc = (t * gsp + p) % 1;
      const gx = BR_TIPS[k] + Math.sin(t * 4 + p) * 2;
      const gyy = BR_TIPS[k + 1] - cyc * 6;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.fillStyle = BR_GLEAM;
      g.beginPath(); g.arc(gx, gyy, 1.1, 0, 7); g.fill();
      g.globalAlpha = (1 - cyc) * 0.5;
      g.strokeStyle = BR_GRN; g.lineWidth = 0.8;
      g.beginPath(); g.arc(gx, gyy, 1.8, 0, 7); g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
  };

  // ============================ KANSAS CITY DAYNE ============================
  FB.dayne = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ak = a.attackKey, ext = ak ? a.attackExt : 0;
    const cf = a.crouch ? 0.6 : 1;
    const sy = a.shy, hy = -78 * cf - 7, hx = 3 + a.lean * 0.6;
    const hpx = a.hipx + a.lean * 0.3, shx = a.shx + a.lean * 0.5;
    const BOX = a.ramp(KC_BOX), RED = a.ramp(KC_RED), GRY = a.ramp(KC_GREY);
    const SKR = a.ramp(a.skin);

    // 1 the moving box, rucksacked on his back — you can HEAR the cardboard
    const bob = a.moving ? Math.abs(Math.sin(a.walkCyc + PI)) * 1.5 : Math.sin(t * 2) * 1;
    g.fillStyle = BOX.out;
    g.beginPath(); g.roundRect(-24, -68 + bob, 17, 19, 2); g.fill();
    g.fillStyle = KC_BOX;
    g.beginPath(); g.roundRect(-23.3, -67.3 + bob, 15.6, 17.6, 1.6); g.fill();
    g.fillStyle = KC_TAPE;
    g.fillRect(-24, -60.5 + bob, 17, 3);
    g.fillRect(-17, -68 + bob, 3, 19);
    g.fillStyle = KC_FLAP;
    g.beginPath();
    g.moveTo(-24, -68 + bob); g.lineTo(-19, -73 + bob); g.lineTo(-14, -68 + bob);
    g.closePath(); g.fill();
    g.strokeStyle = KC_MARK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-21, -64 + bob); g.lineTo(-17, -64 + bob);
    g.lineTo(-15.5, -62 + bob); g.lineTo(-14, -64 + bob); g.lineTo(-11, -64 + bob);
    g.stroke();

    // 2 towel cape, knotted at the shoulder
    const fw = Math.sin(t * 2.4) * 2;
    g.globalAlpha = 0.92;
    g.fillStyle = KC_RED;
    g.beginPath();
    g.moveTo(-8, sy); g.lineTo(-20 + fw, -18); g.lineTo(-10 + fw, -16); g.lineTo(-2, sy + 4);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = KC_GOLD; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-20 + fw, -18); g.lineTo(-10 + fw, -16); g.stroke();
    g.fillStyle = KC_RED; g.beginPath(); g.arc(-5, sy + 1, 2.5, 0, 7); g.fill();

    // 3 body: grey sweats, his own torso color
    a.limbStroke(g, hpx, a.hipy, a.bfx, a.bfy, LEG_W, KC_GREY);
    shoe(g, a.color2, a.ramp(a.color2), a.bfx, a.bfy);
    a.limbStroke(g, shx, sy, a.bhx, a.bhy, ARM_W, a.color2);
    a.limbStroke(g, hpx, a.hipy, shx, sy, TORSO_W, a.color);
    a.limbStroke(g, hpx, a.hipy, a.ffx, a.ffy, LEG_W, KC_GREY);
    shoe(g, a.color2, a.ramp(a.color2), a.ffx, a.ffy);
    g.fillStyle = GRY.lt; g.fillRect(hpx - 7, a.hipy - 1, 14, 1.4); // sweatpant waist

    // 4 tailgate apron with the gold KC heart and an honest BBQ stain
    g.fillStyle = RED.out;
    g.beginPath(); g.roundRect(-7.5, sy + 6, 16, 22, 3); g.fill();
    g.fillStyle = KC_RED;
    g.beginPath(); g.roundRect(-6.7, sy + 6.8, 14.4, 20.4, 2.4); g.fill();
    g.strokeStyle = KC_DEEP; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-6, sy + 1); g.lineTo(-6.5, sy + 6.8);
    g.moveTo(8, sy + 1); g.lineTo(7.5, sy + 6.8);
    g.stroke();
    g.fillStyle = KC_GOLD;
    g.beginPath();
    g.moveTo(2, sy + 14); g.arc(0, sy + 14, 2, 0, 7);
    g.moveTo(5.4, sy + 14); g.arc(3.4, sy + 14, 2, 0, 7);
    g.moveTo(-1.8, sy + 15); g.lineTo(5.2, sy + 15); g.lineTo(1.7, sy + 20); g.closePath();
    g.fill();
    g.globalAlpha = 0.85;
    g.fillStyle = KC_DEEP;
    g.beginPath();
    g.moveTo(6.2, sy + 22); g.arc(4, sy + 22, 2.2, 0, 7);
    g.moveTo(4, sy + 23.5); g.arc(2.5, sy + 23.5, 1.5, 0, 7);
    g.fill();
    g.globalAlpha = 1;

    // 5 head + red cap (chibi group); the cap slips when he takes one
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    faceEyes(g, a, hx, hy, false);
    g.save();
    if (a.hurt) { g.translate(hx, hy + 2); g.rotate(0.15); g.translate(-hx, -hy); }
    g.fillStyle = KC_RED;
    g.beginPath(); g.arc(hx, hy - 3.5, 9.2, PI, 0); g.fill();
    g.fillRect(hx - 1, hy - 6, 14, 3.2);
    g.fillStyle = KC_GOLD;
    g.beginPath(); g.arc(hx + 3.5, hy - 8.6, 1.3, 0, 7); g.fill();
    g.restore();
    g.restore();

    // 6 front arm, back mitt, gold wristband
    a.limbStroke(g, shx, sy, a.fhx, a.fhy, ARM_W, a.color);
    mitt(g, a.skin, SKR, a.bhx, a.bhy, 3.38);
    g.fillStyle = KC_GOLD;
    g.beginPath(); g.roundRect(a.bhx - 2, a.bhy + 1.6, 4, 2.5, 1); g.fill();

    // 7 the #1 foam finger — it swallows his front hand and leads every attack.
    // X3 maps to the engine's 'kick' pose: overshoot to 1.3 rad, then flop back.
    g.save();
    g.translate(a.fhx, a.fhy);
    g.rotate(Math.sin(t * 6) * 0.08
      + (ak === 'kick' ? 1.3 * ext - 0.4 * ext * ext : ak ? 0.9 * ext : 0)
      - (a.hurt ? 0.5 : 0));
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(-2.6, -15, 11.2, 16, 3.4); g.fill();
    g.fillStyle = KC_RED; g.beginPath(); g.roundRect(-2, -14.4, 10, 14.8, 3); g.fill();
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(1.6, -21, 5.2, 8, 2.6); g.fill();
    g.fillStyle = KC_RED; g.beginPath(); g.roundRect(2.1, -20.5, 4.2, 7, 2.1); g.fill();
    g.strokeStyle = WHITE; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(2.6, -11); g.lineTo(2.6, -4);
    g.moveTo(2.6, -11); g.lineTo(0.9, -9.4);
    g.stroke();
    g.fillStyle = KC_GOLD; g.fillRect(-2.6, -1.4, 11.2, 2.4);
    g.restore();

    // 8 confetti — deliberately dim; comedy shimmer, never epic
    const camp = ak === 'B' ? 0.9 : 0.45;
    for (let i = 0; i < 9; i += 3) {
      const p = CONF_MOTES[i + 2];
      const cyc = (t * 0.4 + p) % 1;
      g.globalAlpha = (1 - cyc) * camp;
      g.fillStyle = (i % 6) ? KC_GOLD : KC_RED;
      g.fillRect(CONF_MOTES[i] + Math.sin(t * 2 + p) * 3, CONF_MOTES[i + 1] + cyc * 12, 1.7, 1.7);
    }
    g.globalAlpha = 1;
  };
})();
