// forms-b.js — final-form bodies, batch B: MECHA HAYES, FIRETRUCK, RYAN DUGAN,
// 8 HOURS OF SLEEP MYAH, WALKING ISLA, PRINCESS ADDI, BOOMERANG BROOKS and
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

  // mecha hayes
  const M_SILVER = '#c9ccd8', M_STEEL = '#8a92a8', M_OLIVE = '#6a7258';
  const M_OLIVE2 = '#5c6448', M_DARK = '#232838', M_GLOW = '#4adbe8';
  const M_FLAME = '#ff9a3a', M_CORE = '#e8fbff', M_JET = 'rgba(255,176,74,0.9)';
  const BARREL_DY = [-3.3, 0, 3.3];

  // firetruck
  const FT_RED = '#c9342a', FT_DEEP = '#8a1f1a', FT_VIS = '#f2ee4a';
  const FT_STEEL = '#d8dce8', FT_GLASS = '#9fdcff', FT_WATER = '#4ab2e8';
  const FT_TIRE = '#101014', FT_CAB = '#d43b2f', FT_DOOR = '#a8261e';
  const FT_PANEL = '#8a92a8', FT_INTAKE = '#232838', FT_HOSE = '#e8d9b0';
  const FT_GAUGE = '#e8fbff', FT_NEEDLE = '#d43b2f', FT_BARREL = '#556070';
  const FT_SPOKE = '#3a3f4a', FT_FLAP = '#1d1d24', FT_BAR = '#2a2e38';
  const FT_LAMPR = '#ff4a3a', FT_LAMPB = '#4a86e8', FT_SHIELD = '#ffd24a';
  const FT_LIT = 'rgba(255,255,255,0.7)', FT_GLINT = 'rgba(255,255,255,0.6)';
  const FT_PUFF = 'rgba(200,205,215,0.35)';
  const MIST_MOTES = [0, 0, 0, 1.6, -1.2, 0.34, -1.4, 1, 0.67]; // dx, dy, phase

  // ryan dugan
  const RD_SUIT = '#5c2a72', RD_SLACK = '#3a2444', RD_TAG = '#f2ede0';
  const RD_RED = '#d43b2f', RD_E = '#c24ae8', RD_CORE = '#f0d6ff';
  const RD_INK = '#2a2a35', RD_HAIR = '#2a2230';
  const SPEC_ORBIT = [0, 2.09, 4.19];

  // 8 hours of sleep myah
  const MY_GOLD = '#ffd24a', MY_GLOW = '#fff2b8', MY_PINK = '#e84ad0';
  const MY_PLUM = '#8a3a78', MY_MASK = '#ffd6e8', MY_CORE = '#fff6dd';
  const MY_HAIR = '#4a2c1e', MY_STRAP = '#c98da8';
  const CHK_MOTES = [-20, -40, 0, 22, -55, 0.4, -14, -70, 0.75]; // dx, dy, phase

  // walking isla
  const IS_PINK = '#f2a3c2', IS_CREAM = '#f6f2e8', IS_MILK = '#f4f0e6';
  const IS_CURL = '#b87a3a', IS_PACI = '#4ab2e8', IS_PACI2 = '#2f7bd4';
  const IS_RIBBON = '#d43b2f', IS_PIN = '#c9ccd8';
  const MILK_MOTES = [0, 0.37, 0.71];
  const BICEP_STARS = [0, 1.6];

  // princess addi
  const AD_ICE = '#9fdcff', AD_MID = '#6cc4f0', AD_CORE = '#e8fbff';
  const AD_CAPE = '#bfe6f5', AD_GOLD = '#ffd24a', AD_JEWEL = '#4adbe8';
  const SNOW_MOTES = [-22, -74, 0, 2.2, 18, -84, 0.3, 1.8, -8, -92, 0.55, 2.6, 24, -60, 0.8, 2];

  // boomerang brooks
  const BR_GRN = '#37b34a', BR_DK = '#1f6b2e', BR_STRIPE = '#f2ede0';
  const BR_GLEAM = '#ffffff', BR_STRAP = '#8a5c30', BR_GOLD = '#ffd24a';
  const BR_CHIN = '#5c3a1e', BR_LENS = '#9fdcff', BR_SPEED = 'rgba(255,255,255,0.5)';
  const BR_SPEED2 = 'rgba(255,255,255,0.7)';
  const GLEAM_MOTES = [0, 0.33, 0.66];

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

  // ============================== MECHA HAYES ==============================
  // siege-engine leg: olive limb, silver knee disc, shin plate, huge boot
  function mechaLeg(g, a, col, fx, fy, bw) {
    const SIL = a.ramp(M_SILVER);
    const hpx = a.hipx + a.lean * 0.3, hpy = a.hipy;
    a.limbStroke(g, hpx, hpy, fx, fy, 11, col);
    const kx = (hpx + fx) / 2, ky = (hpy + fy) / 2;
    g.fillStyle = SIL.out; g.beginPath(); g.arc(kx, ky, 5.6, 0, 7); g.fill();
    g.fillStyle = M_SILVER; g.beginPath(); g.arc(kx, ky, 4.6, 0, 7); g.fill();
    g.fillStyle = SIL.dk; g.beginPath(); g.arc(kx, ky, 0.9, 0, 7); g.fill();
    g.fillStyle = SIL.out;
    g.beginPath();
    g.moveTo(kx - 5, ky + 2); g.lineTo(kx + 5, ky + 2);
    g.lineTo(fx + 4, fy - 9); g.lineTo(fx - 5, fy - 9);
    g.closePath(); g.fill();
    g.fillStyle = M_SILVER;
    g.beginPath();
    g.moveTo(kx - 4, ky + 3); g.lineTo(kx + 4, ky + 3);
    g.lineTo(fx + 3, fy - 9.8); g.lineTo(fx - 4, fy - 9.8);
    g.closePath(); g.fill();
    g.strokeStyle = SIL.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(kx - 4, ky + 3); g.lineTo(fx - 4, fy - 9.8); g.stroke();
    g.fillStyle = SIL.out; g.beginPath(); g.roundRect(fx - 8, fy - 10, bw, 11, 3); g.fill();
    g.fillStyle = M_SILVER; g.beginPath(); g.roundRect(fx - 7, fy - 9, bw - 2, 9.4, 2.6); g.fill();
    g.fillStyle = M_OLIVE; g.beginPath(); g.roundRect(fx + 5, fy - 9, 6, 9, 2); g.fill();
    g.fillStyle = M_DARK; g.fillRect(fx - 8, fy - 2, bw, 2.4);
  }

  // forearm rotary tri-barrel cannon; barrels counter-rotate while attacking
  function mechaCannon(g, a, px, py, plate, PR, flash) {
    const t = a.animT, ext = a.attackExt, spin = !!a.attackKey;
    g.save();
    g.translate(px, py);
    g.rotate(-0.1 + (a.attackKey ? ext * 0.9 : 0));
    g.fillStyle = PR.out; g.beginPath(); g.roundRect(-3, -6, 15, 12, 3.5); g.fill();
    g.fillStyle = plate; g.beginPath(); g.roundRect(-2, -5, 13, 10, 2.8); g.fill();
    g.strokeStyle = PR.dk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(4, -5); g.lineTo(4, 5); g.stroke();
    g.fillStyle = M_DARK;
    for (let i = 0; i < 3; i++) {
      const dy = spin ? 3.3 * Math.sin(t * 14 + i * 2.09) : BARREL_DY[i];
      g.beginPath(); g.roundRect(11, dy - 1.3, 9, 2.6, 1.3); g.fill();
    }
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
    g.fillStyle = M_GLOW;
    for (let i = 0; i < 3; i++) {
      const dy = spin ? 3.3 * Math.sin(t * 14 + i * 2.09) : BARREL_DY[i];
      g.beginPath(); g.arc(20, dy, 1, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (flash && ext > 0.6) {
      g.globalAlpha = 0.5;
      g.fillStyle = M_GLOW; g.beginPath(); g.arc(21, 0, 4.4, 0, 7); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = M_CORE; g.beginPath(); g.arc(21, 0, 2.6, 0, 7); g.fill();
    }
    g.restore();
  }

  FB.hayes = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, ak = a.attackKey;
    const SIL = a.ramp(M_SILVER), STL = a.ramp(M_STEEL);
    const OLV = a.ramp(M_OLIVE), OL2 = a.ramp(M_OLIVE2);
    // the suit rides the hip and dips 1u a step — a machine, not a jogger
    const dip = a.hipy + 40 - (a.moving ? Math.abs(Math.sin(a.walkCyc)) : 0);

    // 1 backpack thruster stacks, behind everything
    g.save(); g.translate(0, dip);
    g.fillStyle = OLV.out; g.beginPath(); g.roundRect(-22, -70, 9, 16, 3); g.fill();
    g.fillStyle = M_OLIVE; g.beginPath(); g.roundRect(-21.3, -69.3, 7.6, 14.6, 2.6); g.fill();
    g.fillStyle = M_DARK; g.beginPath(); g.roundRect(-21, -56, 7, 3.4, 1.5); g.fill();
    g.fillStyle = OLV.out; g.beginPath(); g.roundRect(-22, -52, 8, 10, 3); g.fill();
    g.fillStyle = M_OLIVE; g.beginPath(); g.roundRect(-21.3, -51.3, 6.6, 8.6, 2.6); g.fill();
    g.fillStyle = M_DARK; g.beginPath(); g.roundRect(-21, -45, 7, 3.4, 1.5); g.fill();
    g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 9);
    g.fillStyle = M_FLAME; g.beginPath(); g.arc(-17.5, -43, 1.3, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.restore();

    // 2 back leg
    mechaLeg(g, a, M_OLIVE, a.bfx, a.bfy, 19);
    // 3 back arm rotary cannon
    a.limbStroke(g, a.shx + a.lean * 0.5, a.shy, a.bhx, a.bhy, 10, M_OLIVE);
    mechaCannon(g, a, a.bhx, a.bhy, M_STEEL, STL, false);

    g.save(); g.translate(0, dip);
    // 4 torso mass
    g.fillStyle = OLV.out; g.beginPath(); g.roundRect(-19, -79, 39, 46, 13); g.fill();
    g.fillStyle = M_OLIVE; g.beginPath(); g.roundRect(-18, -78, 37, 44, 12); g.fill();
    g.fillStyle = SIL.out;
    g.beginPath();
    g.moveTo(-16, -76); g.lineTo(17, -76); g.lineTo(14, -46); g.lineTo(-13, -46);
    g.closePath(); g.fill();
    g.fillStyle = M_SILVER;
    g.beginPath();
    g.moveTo(-14.8, -74.8); g.lineTo(15.8, -74.8); g.lineTo(12.9, -47.2); g.lineTo(-11.9, -47.2);
    g.closePath(); g.fill();
    g.strokeStyle = SIL.lt; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-12, -72); g.lineTo(13, -72); g.stroke();
    g.strokeStyle = SIL.dk; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-13, -62); g.lineTo(14, -62);
    g.moveTo(-12, -52); g.lineTo(13, -52);
    g.stroke();
    g.fillStyle = SIL.dk;
    g.beginPath(); g.arc(-13, -74, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(14, -74, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(-11, -50, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(12, -50, 0.9, 0, 7); g.fill();
    g.fillStyle = M_OLIVE2;
    g.beginPath(); g.roundRect(-10, -45, 20, 5, 2); g.fill();
    g.beginPath(); g.roundRect(-9, -39, 18, 5, 2); g.fill();
    g.strokeStyle = OL2.lt; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-9, -44.2); g.lineTo(9, -44.2);
    g.moveTo(-8, -38.2); g.lineTo(8, -38.2);
    g.stroke();
    g.globalAlpha = 0.7 + 0.3 * Math.sin(t * 6);
    g.fillStyle = M_GLOW; g.beginPath(); g.roundRect(-3, -68, 8, 6, 2); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = M_CORE; g.beginPath(); g.arc(1, -65, 1.4, 0, 7); g.fill();

    // 5 shoulder missile pods
    g.fillStyle = OLV.out;
    g.beginPath(); g.roundRect(-28, -85, 13, 13, 3); g.fill();
    g.beginPath(); g.roundRect(16, -85, 13, 13, 3); g.fill();
    g.fillStyle = M_OLIVE;
    g.beginPath(); g.roundRect(-27.2, -84.2, 11.4, 11.4, 2.6); g.fill();
    g.beginPath(); g.roundRect(16.8, -84.2, 11.4, 11.4, 2.6); g.fill();
    g.fillStyle = M_SILVER;
    g.fillRect(-26.5, -83.5, 10, 10);
    g.fillRect(17.5, -83.5, 10, 10);
    g.fillStyle = M_DARK;
    for (let i = 0; i < 3; i++) {
      const lxp = -24.5 + i * 3, rxp = 19.5 + i * 3;
      g.beginPath(); g.arc(lxp, -81, 1.6, 0, 7); g.fill();
      g.beginPath(); g.arc(lxp, -77, 1.6, 0, 7); g.fill();
      g.beginPath(); g.arc(rxp, -81, 1.6, 0, 7); g.fill();
      g.beginPath(); g.arc(rxp, -77, 1.6, 0, 7); g.fill();
    }
    if (ak === 'B') { // one tube per pod flares on the launcher
      g.globalAlpha = ext;
      g.fillStyle = M_FLAME;
      g.beginPath(); g.arc(-21.5, -81, 1.6, 0, 7); g.fill();
      g.beginPath(); g.arc(22.5, -81, 1.6, 0, 7); g.fill();
      g.globalAlpha = 1;
    }

    // 6 tiny recessed visor head
    g.fillStyle = SIL.out; g.beginPath(); g.roundRect(-6, -92, 15, 13, 4); g.fill();
    g.fillStyle = M_SILVER; g.beginPath(); g.roundRect(-5.2, -91.2, 13.4, 11.4, 3.4); g.fill();
    g.fillStyle = M_OLIVE; g.fillRect(-5.2, -91.2, 13.4, 3);
    g.fillStyle = M_DARK; g.beginPath(); g.roundRect(-3, -86, 10, 4.6, 2); g.fill();
    g.globalAlpha = a.hurt ? 0.3 : 0.65 + 0.35 * Math.sin(t * 5);
    g.fillStyle = M_GLOW; g.fillRect(-2, -85, 8, 2.4);
    g.globalAlpha = 1;
    g.fillStyle = M_CORE;
    g.beginPath(); g.arc(-2 + 8 * (a.hurt ? 0.5 : (t * 0.7) % 1), -83.8, 0.8, 0, 7); g.fill();
    g.strokeStyle = SIL.dk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-3, -80.6); g.lineTo(7, -80.6); g.stroke();
    g.restore();

    // 7 front leg (silver-forward, boot 1u wider) + 8 front cannon
    mechaLeg(g, a, M_STEEL, a.ffx, a.ffy, 20);
    a.limbStroke(g, a.shx + a.lean * 0.5, a.shy, a.fhx, a.fhy, 10, M_STEEL);
    mechaCannon(g, a, a.fhx, a.fhy, M_SILVER, SIL, true);

    // 9 the cyan energy blade — his ONE grandfathered shadowBlur pass
    if (a.weaponTier > 0) {
      const bl = (10 + a.weaponTier * 4.5) * 1.5;
      g.strokeStyle = M_GLOW; g.lineWidth = 3.4;
      g.shadowColor = M_GLOW; g.shadowBlur = 9;
      g.beginPath(); g.moveTo(a.fhx, a.fhy); g.lineTo(a.fhx + bl, a.fhy - bl * 0.35); g.stroke();
      g.shadowBlur = 0;
    }

    // 10 thrusters: orange cone + cyan inner cone, in the air or posing on B
    if (!a.onGround || ak === 'B') {
      const jb = 10 + Math.random() * 4, jf = 10 + Math.random() * 4;
      g.fillStyle = M_JET;
      g.beginPath();
      g.moveTo(a.bfx - 3, a.bfy + 1); g.lineTo(a.bfx, a.bfy + jb); g.lineTo(a.bfx + 3, a.bfy + 1);
      g.moveTo(a.ffx - 3, a.ffy + 1); g.lineTo(a.ffx, a.ffy + jf); g.lineTo(a.ffx + 3, a.ffy + 1);
      g.fill();
      g.globalAlpha = 0.6;
      g.fillStyle = M_GLOW;
      g.beginPath();
      g.moveTo(a.bfx - 1.5, a.bfy + 1); g.lineTo(a.bfx, a.bfy + jb * 0.5); g.lineTo(a.bfx + 1.5, a.bfy + 1);
      g.moveTo(a.ffx - 1.5, a.ffy + 1); g.lineTo(a.ffx, a.ffy + jf * 0.5); g.lineTo(a.ffx + 1.5, a.ffy + 1);
      g.fill();
      g.globalAlpha = 1;
    }
  };

  // ================================ FIRETRUCK ================================

  // =============================== RYAN DUGAN ===============================
  // three spectral eyeglasses wheel around him; back half draws under the body
  function specOrbit(g, a, front) {
    const t = a.animT, ext = a.attackExt, ak = a.attackKey;
    const R = 27 - (ak && ak !== 'B' ? 7 * ext : 0) + (ak === 'B' ? 10 * ext : 0);
    g.strokeStyle = RD_CORE; g.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const p = SPEC_ORBIT[i];
      const ang = t * 1.6 + p;
      const s = Math.sin(ang);
      if ((s >= 0) !== front) continue;
      const gx = Math.cos(ang) * R;
      let gy = -52 + s * 13;
      let al = 0.55 + 0.25 * Math.sin(t * 5 + p) + (front ? 0.1 : 0);
      if (a.hurt && i === 0) { gy += 3; al *= 0.5; } // an alias falters
      g.globalAlpha = al;
      g.beginPath(); g.arc(gx - 3.4, gy, 3, 0, 7); g.stroke();
      g.beginPath(); g.arc(gx + 3.4, gy, 3, 0, 7); g.stroke();
      g.beginPath();
      g.moveTo(gx - 0.6, gy); g.lineTo(gx + 0.6, gy);
      g.moveTo(gx + 6.2, gy); g.lineTo(gx + 8, gy - 1);
      g.stroke();
    }
    g.globalAlpha = 1;
  }


  // ======================== 8 HOURS OF SLEEP MYAH ========================

  // ============================== WALKING ISLA ==============================

  // ============================== PRINCESS ADDI ==============================

  // ============================ BOOMERANG BROOKS ============================
  // one painted arm of the V; drawn twice inside the rig's rotation
  function rangArm(g, GRN, ang) {
    g.save(); g.rotate(ang);
    g.fillStyle = GRN.out; g.beginPath(); g.roundRect(-27, -5, 27, 10, 5); g.fill();
    g.fillStyle = BR_GRN; g.beginPath(); g.roundRect(-26, -4, 25, 8, 4); g.fill();
    g.fillStyle = BR_STRIPE; g.fillRect(-24, -1.2, 22, 2.4);
    g.fillStyle = BR_DK; g.beginPath(); g.roundRect(-27, -4.5, 5, 9, 3.5); g.fill();
    g.restore();
  }


  // =========================== KANSAS CITY DAYNE ===========================
})();
