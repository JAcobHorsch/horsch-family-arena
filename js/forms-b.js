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
  FB.tim = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey;
    const STE = a.ramp(FT_STEEL), RED = a.ramp(FT_RED), CAB = a.ramp(FT_CAB);
    const PAN = a.ramp(FT_PANEL);
    const atk = !!ak && ak !== 'B';
    // suspension: 1.2u bounce, plus the cab dipping into a ladder ram
    const dy = (a.moving ? -Math.abs(Math.sin(w)) * 1.2 : 0) + (atk ? 1.5 * ext : 0);

    // 1 aerial ladder (behind the body, unsprung)
    const lift = ak === 'B' ? 0.15 + ext * 0.55 : 0.15;
    const L = 34 + (atk ? ext * 30 : 0);
    const cl = Math.cos(lift), sl = Math.sin(lift);
    const ex = -16 + cl * L, ey = -52 - sl * L;
    const rpx = sl * 2.6, rpy = cl * 2.6; // rail offset, perpendicular to the boom
    g.strokeStyle = STE.out; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-16 - rpx, -52 - rpy); g.lineTo(ex - rpx, ey - rpy);
    g.moveTo(-16 + rpx, -52 + rpy); g.lineTo(ex + rpx, ey + rpy);
    g.stroke();
    g.strokeStyle = FT_STEEL; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-16 - rpx, -52 - rpy); g.lineTo(ex - rpx, ey - rpy);
    g.moveTo(-16 + rpx, -52 + rpy); g.lineTo(ex + rpx, ey + rpy);
    g.stroke();
    g.lineWidth = 1.6;
    g.beginPath();
    for (let r = 0.12; r < 1; r += 0.14) {
      const rx = -16 + cl * L * r, ry = -52 - sl * L * r;
      g.moveTo(rx - rpx, ry - rpy); g.lineTo(rx + rpx, ry + rpy);
    }
    g.stroke();
    g.fillStyle = FT_DEEP; g.beginPath(); g.roundRect(ex - 2.5, ey - 2, 5, 4, 1); g.fill();

    g.save(); g.translate(0, dy);
    // 2 rear box
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(-31, -50, 44, 34, 4); g.fill();
    g.fillStyle = FT_RED; g.beginPath(); g.roundRect(-30, -49, 42, 32, 3.4); g.fill();
    g.strokeStyle = FT_DEEP; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-19, -48); g.lineTo(-19, -18);
    g.moveTo(-8, -48); g.lineTo(-8, -18);
    g.moveTo(3, -48); g.lineTo(3, -18);
    g.stroke();
    g.fillStyle = FT_DOOR; g.beginPath(); g.roundRect(-27, -46, 10, 24, 2); g.fill();
    g.strokeStyle = RED.lt; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-26, -39); g.lineTo(-18, -39);
    g.moveTo(-26, -33); g.lineTo(-18, -33);
    g.moveTo(-26, -27); g.lineTo(-18, -27);
    g.stroke();
    g.fillStyle = FT_VIS;
    g.fillRect(-30, -28, 42, 4);
    g.beginPath();
    g.moveTo(-30, -20); g.lineTo(-26, -20); g.lineTo(-30, -31); g.closePath();
    g.moveTo(-30, -33); g.lineTo(-26, -33); g.lineTo(-30, -44); g.closePath();
    g.fill();
    // 3 pump panel
    g.fillStyle = FT_PANEL; g.beginPath(); g.roundRect(-16, -44, 12, 14, 2); g.fill();
    g.fillStyle = FT_GAUGE;
    g.beginPath(); g.arc(-13, -40, 1.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-8, -40, 1.8, 0, 7); g.fill();
    g.strokeStyle = FT_NEEDLE; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-13, -40); g.lineTo(-12.2, -41.4);
    g.moveTo(-8, -40); g.lineTo(-7.4, -41.5);
    g.stroke();
    g.fillStyle = FT_INTAKE; g.beginPath(); g.arc(-10, -34, 2.6, 0, 7); g.fill();
    g.strokeStyle = FT_STEEL; g.lineWidth = 1; g.stroke();
    // 4 hose reel
    g.fillStyle = FT_DEEP; g.beginPath(); g.arc(-24, -38, 4.5, 0, 7); g.fill();
    g.strokeStyle = FT_HOSE; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-24, -38, 3, 0, 7); g.stroke();
    g.beginPath(); g.arc(-24, -38, 1.8, 0, 7); g.stroke();
    // 5 cab
    g.fillStyle = CAB.out; g.beginPath(); g.roundRect(13, -64, 19, 26, 3); g.fill();
    g.fillStyle = FT_CAB; g.beginPath(); g.roundRect(13.8, -63.2, 17.4, 24.4, 2.6); g.fill();
    g.fillStyle = FT_GLASS; g.beginPath(); g.roundRect(16, -61, 13, 9, 1.5); g.fill();
    g.strokeStyle = FT_GLINT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(17.5, -53); g.lineTo(23, -60.5); g.stroke();
    g.strokeStyle = FT_DEEP; g.lineWidth = 1;
    g.beginPath(); g.moveTo(18, -52); g.lineTo(18, -40); g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(29, -50, 4, 10, 1); g.fill();
    g.strokeStyle = STE.dk; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(29.4, -47.5); g.lineTo(32.6, -47.5);
    g.moveTo(29.4, -45); g.lineTo(32.6, -45);
    g.moveTo(29.4, -42.5); g.lineTo(32.6, -42.5);
    g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(28, -42, 7, 5, 1.5); g.fill();
    // 6 light bar (both lamps go red on the hurt frames)
    const flash = Math.floor(t * 6) % 2 === 0;
    g.fillStyle = FT_BAR; g.beginPath(); g.roundRect(15, -68, 14, 3.6, 1.5); g.fill();
    g.fillStyle = a.hurt || flash ? FT_LAMPR : FT_LAMPB;
    g.fillRect(16, -67.4, 4, 2.6);
    g.fillStyle = a.hurt || !flash ? FT_LAMPR : FT_LAMPB;
    g.fillRect(24, -67.4, 4, 2.6);
    g.globalAlpha = 0.7;
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(flash ? 18 : 26, -66.1, 1.1, 0, 7); g.fill();
    g.globalAlpha = 1;
    // 7 deck gun
    const bang = -0.35 - (ak === 'B' ? ext * 0.5 : 0);
    const nx = Math.cos(bang) * 13, ny = -52 + Math.sin(bang) * 13;
    g.fillStyle = PAN.out; g.beginPath(); g.arc(0, -52, 4.6, 0, 7); g.fill();
    g.fillStyle = FT_PANEL; g.beginPath(); g.arc(0, -52, 3.8, 0, 7); g.fill();
    g.strokeStyle = FT_BARREL; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(0, -52); g.lineTo(nx, ny); g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(nx - 1.5, ny - 2, 3, 4, 1); g.fill();
    // 8 unit shield (marks, never text)
    g.fillStyle = FT_SHIELD; g.beginPath(); g.arc(-2, -38, 3.4, 0, 7); g.fill();
    g.strokeStyle = a.INK; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-3.4, -38.8); g.lineTo(-0.6, -38.8);
    g.moveTo(-3.4, -36.8); g.lineTo(-0.6, -36.8);
    g.stroke();
    g.restore();

    // 9 wheels — unsprung, spokes turning with the gait
    g.fillStyle = FT_FLAP; g.fillRect(-30, -14, 6, 7);
    g.fillStyle = FT_TIRE;
    g.beginPath(); g.arc(-20, -9, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(-9, -9, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(20, -9, 9, 0, 7); g.fill();
    g.fillStyle = FT_PANEL;
    g.beginPath(); g.arc(-20, -9, 3.4, 0, 7); g.fill();
    g.beginPath(); g.arc(-9, -9, 3.4, 0, 7); g.fill();
    g.beginPath(); g.arc(20, -9, 3.4, 0, 7); g.fill();
    const sc = Math.cos(w) * 7, ss = Math.sin(w) * 7;
    g.strokeStyle = FT_SPOKE; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-20 - sc, -9 - ss); g.lineTo(-20 + sc, -9 + ss);
    g.moveTo(-9 - sc, -9 - ss); g.lineTo(-9 + sc, -9 + ss);
    g.moveTo(20 - sc, -9 - ss); g.lineTo(20 + sc, -9 + ss);
    g.stroke();

    g.save(); g.translate(0, dy);
    // 10 exhaust stack + one climbing puff (faster while rolling)
    g.fillStyle = FT_PANEL; g.beginPath(); g.roundRect(12, -72, 3, 8, 1.5); g.fill();
    const pc = (t * (a.moving ? 1.2 : 0.6)) % 1;
    g.globalAlpha = 1 - pc;
    g.fillStyle = FT_PUFF;
    g.beginPath(); g.arc(13.5, -74 - pc * 8, 1.5 + pc * 2, 0, 7); g.fill();
    // 11 deck-gun mist: droplets arc out and FALL
    g.fillStyle = FT_WATER;
    const msp = ak === 'B' ? 1.6 : 0.8;
    for (let i = 0; i < 9; i += 3) {
      const mc = (t * msp + MIST_MOTES[i + 2]) % 1;
      g.globalAlpha = (1 - mc) * 0.7;
      g.beginPath();
      g.arc(nx + MIST_MOTES[i] + mc * 8, ny + MIST_MOTES[i + 1] - 3 + mc * mc * 10, 1.2, 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
  };

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


  FB.ronathon = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const SUIT = a.ramp(RD_SUIT), SLK = a.ramp(RD_SLACK), TAG = a.ramp(RD_TAG);
    const HAIR = a.ramp(RD_HAIR);

    specOrbit(g, a, false); // 1 orbit, back half

    // 2 body
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, RD_SLACK);
    shoe(g, RD_SLACK, SLK, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, SUIT.dk);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, RD_SUIT);
    g.strokeStyle = SUIT.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();

    // 3 blazer pauldrons
    for (let i = 0; i < 2; i++) {
      const cx = sx - 8 + i * 16;
      g.fillStyle = SUIT.out;
      g.beginPath(); g.arc(cx, sy - 1, 5.8, PI, 0); g.closePath(); g.fill();
      g.fillStyle = RD_SUIT;
      g.beginPath(); g.arc(cx, sy - 1, 4.9, PI, 0); g.closePath(); g.fill();
      g.strokeStyle = SUIT.lt; g.lineWidth = 1.1;
      g.beginPath(); g.arc(cx, sy - 1, 3.6, PI * 1.05, PI * 1.6); g.stroke();
    }

    // 4 magenta tie with a T4-rung energy edge
    g.fillStyle = RD_E;
    g.fillRect(-0.5, -64, 4, 3);
    g.beginPath();
    g.moveTo(1, -61); g.lineTo(4.4, -57); g.lineTo(1, -45); g.lineTo(-2.4, -57);
    g.closePath(); g.fill();
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
    g.strokeStyle = RD_CORE; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-2.4, -57); g.lineTo(1, -45); g.stroke();
    g.globalAlpha = 1;

    // 5 armor-scale HELLO-MY-NAME-IS plate
    g.fillStyle = TAG.out; g.beginPath(); g.roundRect(-9.5, -60, 19, 14, 2.4); g.fill();
    g.fillStyle = RD_TAG; g.beginPath(); g.roundRect(-8.7, -59.2, 17.4, 12.4, 2); g.fill();
    g.fillStyle = RD_RED; g.fillRect(-8.7, -59.2, 17.4, 4);
    g.strokeStyle = WHITE; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-6.4, -57.2); g.lineTo(-1.4, -57.2);
    g.moveTo(0.6, -57.2); g.lineTo(5.6, -57.2);
    g.stroke();
    g.strokeStyle = a.INK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-6, -52);
    g.quadraticCurveTo(-2, -54.5, 2, -52);
    g.quadraticCurveTo(4, -51, 6, -52.5);
    g.stroke();
    g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-5, -49); g.lineTo(5, -49); g.stroke();
    g.fillStyle = RD_E;
    g.beginPath(); g.arc(-7.8, -58.3, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(7.8, -58.3, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-7.8, -47.7, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(7.8, -47.7, 0.8, 0, 7); g.fill();

    // 6 spare alias tag on the hip, for emergencies
    g.save(); g.translate(7, -38); g.rotate(0.3);
    g.fillStyle = RD_TAG; g.beginPath(); g.roundRect(-2.5, -1.7, 5, 3.4, 0.7); g.fill();
    g.fillStyle = RD_RED; g.fillRect(-2.5, -1.7, 5, 1.1);
    g.restore();

    // front leg
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, RD_SLACK);
    shoe(g, RD_SLACK, SLK, a.ffx, a.ffy);

    // 7 head: slicked hair, 8 the glasses (which ARE his eyes)
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    g.fillStyle = HAIR.out;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.9, PI, PI * 2); g.fill();
    g.fillStyle = RD_HAIR;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.2, PI * 1.02, PI * 1.98); g.fill();
    g.strokeStyle = HAIR.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hx - 2, hy - 9); g.lineTo(hx + 5, hy - 8); g.stroke();
    g.globalAlpha = ak && ak !== 'B' ? 1 : 0.65 + 0.35 * Math.sin(t * 6);
    g.fillStyle = RD_E;
    g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.fill();
    g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.fill();
    g.globalAlpha = 1;
    if (ak === 'B') { // the barrage launches from the lenses
      g.globalAlpha = ext;
      g.fillStyle = WHITE;
      g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.fill();
      g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.fill();
      g.globalAlpha = 1;
    }
    g.strokeStyle = RD_INK; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.stroke();
    g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.stroke();
    g.beginPath();
    g.moveTo(hx + 2.8, hy - 2.6); g.lineTo(hx + 4, hy - 2.6);
    g.moveTo(hx - 1.6, hy - 3.4); g.lineTo(hx - 7.4, hy - 2.2);
    g.stroke();
    g.fillStyle = RD_CORE;
    g.beginPath(); g.arc(hx - 0.5, hy - 3.6, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 5.1, hy - 3.6, 0.7, 0, 7); g.fill();
    g.restore();

    // front arm + mitts
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, RD_SUIT);
    const SK = a.ramp(a.skin);
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    specOrbit(g, a, true); // 9 orbit, front half
  };

  // ======================== 8 HOURS OF SLEEP MYAH ========================
  FB.myah = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const C2 = a.ramp(a.color2), PNK = a.ramp(MY_PINK), MSK = a.ramp(MY_MASK);
    const HAIR = a.ramp(MY_HAIR), SK = a.ramp(a.skin);
    const sway = Math.sin(t * 2);

    // 1 halo ring + wheeling sun rays, behind the crown
    g.globalAlpha = 0.8;
    g.strokeStyle = MY_GOLD; g.lineWidth = 2;
    g.beginPath(); g.ellipse(3, -96, 11, 3.2, 0, 0, 7); g.stroke();
    g.globalAlpha = a.hurt ? 0.35 : ak === 'B' ? 1 : 0.7;
    g.strokeStyle = MY_GLOW; g.lineWidth = 1.6;
    const rayAng = t * (ak ? 1.2 : 0.4);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const ra = rayAng + i * 0.785;
      const rc = Math.cos(ra), rs = Math.sin(ra) * 0.5;
      g.moveTo(3 + rc * 13, -86 + rs * 13); g.lineTo(3 + rc * 17, -86 + rs * 17);
    }
    g.stroke();
    g.globalAlpha = 1;

    // 2 body
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, a.color2);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, MY_PINK);
    g.strokeStyle = PNK.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.ffx, a.ffy);
    g.globalAlpha = 0.88;
    g.fillStyle = MY_PLUM;
    g.beginPath();
    g.moveTo(-6 + lean * 0.3, hpy - 2); g.lineTo(6 + lean * 0.3, hpy - 2);
    g.lineTo(16, -1); g.lineTo(-16, -1);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = MY_MASK; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-16, -1); g.lineTo(16, -1); g.stroke();

    // 3 silk sash + swaying ribbon tail
    g.fillStyle = MY_GOLD;
    g.fillRect(-7, hpy - 2, 14, 3);
    g.beginPath(); g.arc(5, hpy - 0.5, 2, 0, 7); g.fill();
    g.globalAlpha = 0.9;
    g.beginPath();
    g.moveTo(6, hpy + 1); g.lineTo(9 + sway * 2, hpy + 9); g.lineTo(4, hpy + 8);
    g.closePath(); g.fill();
    g.globalAlpha = 1;

    // 4-6 head: hair finally down, sleep mask as a laurel, rested eyes
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    g.fillStyle = HAIR.out;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.9, PI, PI * 2); g.fill();
    g.fillStyle = MY_HAIR;
    g.beginPath(); g.ellipse(hx - 8 + sway * 1.2, hy + 5, 3.2, 8.5, 0.25, 0, 7); g.fill();
    g.beginPath(); g.ellipse(hx + 9 + sway * 1.2, hy + 5, 2.8, 7.5, -0.2, 0, 7); g.fill();
    g.beginPath(); g.arc(hx, hy - 1.5, 9.2, PI * 1.02, PI * 1.98); g.fill();
    g.strokeStyle = HAIR.lt; g.lineWidth = 2;
    g.beginPath(); g.arc(hx, hy - 1.5, 7.8, PI * 1.08, PI * 1.55); g.stroke();
    g.fillStyle = MSK.out; g.beginPath(); g.roundRect(hx - 8.5, hy - 11, 17, 5, 2.4); g.fill();
    g.fillStyle = MY_MASK; g.beginPath(); g.roundRect(hx - 7.8, hy - 10.3, 15.6, 3.6, 2); g.fill();
    g.strokeStyle = MY_STRAP; g.lineWidth = 1;
    g.beginPath(); g.arc(hx - 8.5, hy - 8.5, 1.8, PI * 0.4, PI * 1.6); g.stroke();
    g.beginPath(); g.arc(hx + 8.5, hy - 8.5, 1.8, PI * 1.4, PI * 0.6); g.stroke();
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(hx - 4, hy - 8.8, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 4.6, hy - 8.6, 0.7, 0, 7); g.fill();
    faceEyes(g, a, hx, hy, true);
    g.restore();

    // front arm + mitts
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, MY_PINK);
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    // 7 checkmark motes — the impossible chores completing themselves
    g.strokeStyle = MY_GOLD; g.lineWidth = 1.8;
    for (let i = 0; i < 9; i += 3) {
      const p = CHK_MOTES[i + 2];
      const cyc = (t * 0.35 + p) % 1;
      const cx = CHK_MOTES[i] + Math.sin(t * 1.5 + p) * 2;
      const cy = CHK_MOTES[i + 1] - cyc * 14;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.beginPath();
      if (a.hurt && i === 0) { // the headache threatens to return
        g.moveTo(cx - 2.4, cy); g.lineTo(cx - 0.6, cy + 1.8); g.lineTo(cx + 2.8, cy + 2.6);
      } else {
        g.moveTo(cx - 2.4, cy); g.lineTo(cx - 0.6, cy + 1.8); g.lineTo(cx + 2.8, cy - 2.6);
      }
      g.stroke();
    }
    g.globalAlpha = 1;

    // 8 hand sparkle
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = MY_CORE;
    star4(g, a.fhx, a.fhy, 1.6 + (ak ? 1.4 * ext : 0));
    g.globalAlpha = 1;
  };

  // ============================== WALKING ISLA ==============================
  FB.isla = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const PNK = a.ramp(IS_PINK), CRM = a.ramp(IS_CREAM), WHT = a.ramp(WHITE);
    const SK = a.ramp(a.skin);
    const posed = !!ak || a.hurt || a.crouch;

    // 1 balance stance: arms up and out, micro-correcting at 4Hz
    let fhx = a.fhx, fhy = a.fhy, bhx = a.bhx, bhy = a.bhy;
    if (!posed) {
      if (a.moving) {
        fhx = 16 + Math.sin(w) * 7; fhy = -60;   // counter-swing x1.4
        bhx = -14 - Math.sin(w) * 7; bhy = -58;
      } else {
        fhx = 16; fhy = -60 + 1.5 * Math.sin(t * 4);
        bhx = -14; bhy = -58 - 1.5 * Math.sin(t * 4);
      }
    }
    // 2 double-bounce toddler step: wider stagger + a second harmonic
    let ffx = a.ffx, bfx = a.bfx;
    if (a.moving && !posed) {
      const h2 = 2 * Math.sin(2 * w);
      ffx = 8 + Math.sin(w) * 14.3 + h2;
      bfx = -8 - Math.sin(w) * 14.3 + h2;
    }
    // 5 the arms ARE the weapon: Baby Swole scaling
    const armW = 8.47 * (1 + a.weaponTier * 0.32);

    // back leg + bootie
    a.limbStroke(g, hpx, hpy, bfx, a.bfy, 8.5, a.color2);
    g.fillStyle = WHT.out; g.beginPath(); g.roundRect(bfx - 5.5, a.bfy - 6.5, 12.5, 7.5, 3.4); g.fill();
    g.fillStyle = WHITE; g.beginPath(); g.roundRect(bfx - 4.7, a.bfy - 5.7, 10.9, 6.1, 2.8); g.fill();
    g.fillStyle = IS_PINK; g.beginPath(); g.arc(bfx - 4, a.bfy - 5.5, 1.6, 0, 7); g.fill();
    a.limbStroke(g, sx, sy, bhx, bhy, armW, SK.dk);

    // 4 onesie torso + snaps
    a.limbStroke(g, hpx, hpy, sx, sy, 15, IS_PINK);
    g.strokeStyle = PNK.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(0, -58, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -52, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -46, 0.8, 0, 7); g.fill();

    // 6 double power-diaper
    g.fillStyle = CRM.out; g.beginPath(); g.roundRect(hpx - 8.5, hpy - 6, 17, 12, 5); g.fill();
    g.fillStyle = IS_CREAM; g.beginPath(); g.roundRect(hpx - 7.7, hpy - 5.2, 15.4, 10.4, 4.4); g.fill();
    g.strokeStyle = IS_PINK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(hpx - 7, hpy - 4.6); g.lineTo(hpx + 7, hpy - 4.6); g.stroke();
    g.strokeStyle = IS_PIN; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hpx - 7.4, hpy - 1); g.lineTo(hpx - 7.4, hpy + 2); g.stroke();
    g.fillStyle = IS_PIN;
    g.beginPath(); g.arc(hpx - 7.4, hpy + 2.8, 0.8, 0, 7); g.fill();

    // 7 pacifier worn as a medal
    g.strokeStyle = IS_RIBBON; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(sx - 6, sy + 2); g.lineTo(2, -56); g.lineTo(sx + 6, sy + 2);
    g.stroke();
    g.fillStyle = IS_PACI; g.beginPath(); g.arc(2, -55, 2.8, 0, 7); g.fill();
    g.strokeStyle = IS_PACI2; g.lineWidth = 1.2;
    g.beginPath(); g.arc(2, -55, 1.6, 0, 7); g.stroke();
    g.fillStyle = WHITE; g.beginPath(); g.arc(0.8, -56.2, 0.7, 0, 7); g.fill();

    // front leg + bootie
    a.limbStroke(g, hpx, hpy, ffx, a.ffy, 8.5, a.color);
    g.fillStyle = WHT.out; g.beginPath(); g.roundRect(ffx - 5.5, a.ffy - 6.5, 12.5, 7.5, 3.4); g.fill();
    g.fillStyle = WHITE; g.beginPath(); g.roundRect(ffx - 4.7, a.ffy - 5.7, 10.9, 6.1, 2.8); g.fill();
    g.fillStyle = IS_PINK; g.beginPath(); g.arc(ffx - 4, a.ffy - 5.5, 1.6, 0, 7); g.fill();

    // 8 head: baby face + the triple victory curl
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, false);
    g.strokeStyle = IS_CURL; g.lineWidth = 1.7;
    g.beginPath(); g.arc(hx - 3, hy - 10, 2.2, PI * 0.2, PI * 1.4); g.stroke();
    g.beginPath(); g.arc(hx, hy - 11.5, 2.6, PI * 0.2, PI * 1.4); g.stroke();
    g.beginPath(); g.arc(hx + 3, hy - 10, 2.2, PI * 0.2, PI * 1.4); g.stroke();
    faceEyes(g, a, hx, hy, true);
    g.restore();

    // front arm + mitts
    a.limbStroke(g, sx, sy, fhx, fhy, armW, a.skin);
    mitt(g, a.skin, SK, fhx, fhy, 3.6);
    mitt(g, a.skin, SK, bhx, bhy, 3.38);

    // 9 bicep stars (front arm first, then back)
    const starR = ak ? 3 : 1.5;
    for (let i = 0; i < 2; i++) {
      const p = BICEP_STARS[i];
      const mx = i === 0 ? (sx + fhx) / 2 : (sx + bhx) / 2;
      const my = i === 0 ? (sy + fhy) / 2 : (sy + bhy) / 2;
      g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + p);
      g.fillStyle = WHITE;
      star4(g, mx, my, starR);
      g.globalAlpha = 0.5;
      g.strokeStyle = IS_PINK; g.lineWidth = 0.8;
      g.beginPath(); g.arc(mx, my, 2.4, 0, 7); g.stroke();
    }
    g.globalAlpha = 1;

    // 10 milk motes off the fists
    g.fillStyle = IS_MILK;
    const msp = ak === 'B' ? 2.1 : 0.7;
    for (let i = 0; i < 3; i++) {
      const p = MILK_MOTES[i];
      const cyc = (t * msp + p) % 1;
      const mx = (i % 2 === 0 ? fhx : bhx) + Math.sin(t * 3 + p) * 3;
      const my = (i % 2 === 0 ? fhy : bhy) - cyc * 10;
      g.globalAlpha = (1 - cyc) * 0.7;
      g.beginPath(); g.arc(mx, my, 1.2, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  };

  // ============================== PRINCESS ADDI ==============================
  FB.addi = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const ICE = a.ramp(AD_ICE), MID = a.ramp(AD_MID), GLD = a.ramp(AD_GOLD);
    const C2 = a.ramp(a.color2), SK = a.ramp(a.skin);
    const cs = Math.sin(t * 1.5) * 2;
    const flare = ak ? 4 * ext : 0;
    const sway = Math.sin(w) * 3;

    // 1 glacial half-cape behind everything
    g.globalAlpha = 0.75;
    g.fillStyle = AD_CAPE;
    g.beginPath();
    g.moveTo(-6, -64); g.lineTo(6, -64);
    g.lineTo(14 + cs, -4); g.lineTo(-18 + cs, -2);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = AD_CORE; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(14 + cs, -4); g.lineTo(-18 + cs, -2); g.stroke();

    // 2 body
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, a.color2);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, a.color);
    g.strokeStyle = a.ramp(a.color).dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, a.color);
    shoe(g, a.color2, C2, a.ffx, a.ffy);

    // 3 ball-gown bell (the engine trapezoid is replaced outright)
    g.fillStyle = MID.out;
    g.beginPath();
    g.moveTo(-7, hpy - 2);
    g.quadraticCurveTo(-19 - flare + sway, -16, -17 - flare, -1);
    g.lineTo(17 + flare, -1);
    g.quadraticCurveTo(19 + flare + sway, -16, 7, hpy - 2);
    g.closePath(); g.fill();
    g.fillStyle = AD_MID;
    g.beginPath();
    g.moveTo(-6.2, hpy - 1);
    g.quadraticCurveTo(-18 - flare + sway, -16, -16 - flare, -1.8);
    g.lineTo(16 + flare, -1.8);
    g.quadraticCurveTo(18 + flare + sway, -16, 6.2, hpy - 1);
    g.closePath(); g.fill();
    g.fillStyle = AD_ICE;
    g.beginPath();
    g.moveTo(-4, hpy - 2); g.lineTo(6, -1); g.lineTo(-8, -1);
    g.closePath(); g.fill();
    g.fillStyle = AD_CORE;
    g.beginPath(); g.arc(-12, -1, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(-4, -1, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(4, -1, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(12, -1, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(-9, -12, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(3, -18, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(10, -8, 0.7, 0, 7); g.fill();

    // 4 bodice
    g.fillStyle = AD_ICE; g.beginPath(); g.roundRect(-6, -64, 13, 16, 4); g.fill();
    g.strokeStyle = ICE.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-5, -61); g.lineTo(-5, -51); g.stroke();
    g.fillStyle = AD_JEWEL; g.fillRect(-6, -49, 13, 2.6);

    // 5 faceted ice pauldrons
    for (let i = 0; i < 2; i++) {
      const px = sx - 8 + i * 16;
      g.fillStyle = ICE.out;
      g.beginPath();
      g.moveTo(px - 5, sy); g.lineTo(px, sy - 9); g.lineTo(px + 5, sy);
      g.closePath(); g.fill();
      g.fillStyle = AD_ICE;
      g.beginPath();
      g.moveTo(px - 4, sy - 0.4); g.lineTo(px, sy - 7.8); g.lineTo(px + 4, sy - 0.4);
      g.closePath(); g.fill();
      g.globalAlpha = ak === 'B' ? 1 : 0.8;
      g.strokeStyle = AD_CORE; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(px - 4, sy - 0.4); g.lineTo(px, sy - 7.8); g.stroke();
      g.globalAlpha = 1;
    }

    // 6 ice-diamond brooch
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = AD_CORE;
    g.beginPath();
    g.moveTo(1, -61.6); g.lineTo(3.6, -59); g.lineTo(1, -56.4); g.lineTo(-1.6, -59);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = AD_JEWEL; g.lineWidth = 0.8; g.stroke();

    // 8 crown of five ice spikes (the engine gold crown is replaced)
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    faceEyes(g, a, hx, hy, a.blush);
    if (a.hurt) { g.translate(hx, hy - 8); g.rotate(0.12); g.translate(-hx, -(hy - 8)); }
    g.fillStyle = GLD.out; g.beginPath(); g.roundRect(hx - 7.5, hy - 9.5, 15, 3.4, 1.4); g.fill();
    g.fillStyle = AD_GOLD; g.beginPath(); g.roundRect(hx - 7, hy - 9, 14, 2.6, 1.2); g.fill();
    g.fillStyle = AD_ICE;
    g.beginPath();
    g.moveTo(hx - 1.5, hy - 9.5); g.lineTo(hx, hy - 17); g.lineTo(hx + 1.5, hy - 9.5); g.closePath();
    g.moveTo(hx - 4.9, hy - 9.5); g.lineTo(hx - 3.4, hy - 14.5); g.lineTo(hx - 1.9, hy - 9.5); g.closePath();
    g.moveTo(hx + 1.9, hy - 9.5); g.lineTo(hx + 3.4, hy - 14.5); g.lineTo(hx + 4.9, hy - 9.5); g.closePath();
    g.moveTo(hx - 7.9, hy - 9.5); g.lineTo(hx - 6.4, hy - 12.5); g.lineTo(hx - 4.9, hy - 9.5); g.closePath();
    g.moveTo(hx + 4.9, hy - 9.5); g.lineTo(hx + 6.4, hy - 12.5); g.lineTo(hx + 7.9, hy - 9.5); g.closePath();
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
    g.globalAlpha = 1;
    if (ak === 'B') { // the volley visibly leaves from the crown
      g.globalAlpha = ext;
      g.fillStyle = WHITE;
      g.beginPath(); g.arc(hx, hy - 8, 1.5, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    g.restore();

    // front arm, 7 glove cuffs, mitts
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, a.color);
    g.fillStyle = AD_CORE;
    g.beginPath(); g.roundRect(a.fhx - 2, a.fhy - 4.4, 4, 3, 1); g.fill();
    g.beginPath(); g.roundRect(a.bhx - 2, a.bhy - 4.4, 4, 3, 1); g.fill();
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    // 9 falling six-arm snowflakes — ice is grav-true
    g.strokeStyle = AD_CORE; g.lineWidth = 1;
    const ssp = ak ? 0.6 : 0.3;
    for (let i = 0; i < 16; i += 4) {
      const p = SNOW_MOTES[i + 2], r = SNOW_MOTES[i + 3];
      const cyc = (t * ssp + p) % 1;
      const fx2 = SNOW_MOTES[i] + Math.sin(t * 2 + p) * 2.5;
      const fy2 = SNOW_MOTES[i + 1] + cyc * 16;
      g.globalAlpha = (a.hurt ? 0.3 : 0.8) * (1 - cyc);
      g.beginPath();
      g.moveTo(fx2 - r, fy2); g.lineTo(fx2 + r, fy2);
      g.moveTo(fx2 - r * 0.5, fy2 - r * 0.866); g.lineTo(fx2 + r * 0.5, fy2 + r * 0.866);
      g.moveTo(fx2 - r * 0.5, fy2 + r * 0.866); g.lineTo(fx2 + r * 0.5, fy2 - r * 0.866);
      g.stroke();
    }
    g.globalAlpha = 1;
  };

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


  FB.brooks = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const GRN = a.ramp(BR_GRN), GLD = a.ramp(BR_GOLD), STR = a.ramp(BR_STRAP);
    const C2 = a.ramp(a.color2), SK = a.ramp(a.skin);
    const air = !a.onGround;

    // 1 the boomerang he IS, strapped across his back
    const tilt = Math.sin(t * 3) * 0.06 + (a.moving ? -0.15 : 0) + (air ? -0.75 : 0)
      + (ak === 'B' ? 0.4 * ext : 0) - (ak && ak !== 'B' ? 0.1 * ext : 0);
    g.save(); g.translate(-3, -56); g.rotate(tilt);
    rangArm(g, GRN, -0.35);
    rangArm(g, GRN, 1);
    g.fillStyle = GLD.out; g.beginPath(); g.arc(0, 0, 3.6, 0, 7); g.fill();
    g.fillStyle = BR_GOLD; g.beginPath(); g.arc(0, 0, 2.8, 0, 7); g.fill();
    g.fillStyle = GLD.dk; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill();
    g.restore();

    // 6 speed lines whenever he is going somewhere
    if (a.moving || air) {
      const shift = (w * 40) % 8;
      g.strokeStyle = air ? BR_SPEED2 : BR_SPEED; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-30 - shift, -66); g.lineTo(-20 - shift, -66);
      g.moveTo(-30 - shift, -56); g.lineTo(-20 - shift, -56);
      g.moveTo(-30 - shift, -46); g.lineTo(-20 - shift, -46);
      if (air) {
        g.moveTo(-38 - shift, -61); g.lineTo(-28 - shift, -61);
        g.moveTo(-38 - shift, -51); g.lineTo(-28 - shift, -51);
        g.moveTo(-38 - shift, -41); g.lineTo(-28 - shift, -41);
      }
      g.stroke();
    }

    // 3 body
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, a.color2);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, a.color);
    g.strokeStyle = a.ramp(a.color).dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    // 2 X harness
    g.strokeStyle = BR_STRAP; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-8, -64); g.lineTo(8, -46);
    g.moveTo(8, -64); g.lineTo(-8, -46);
    g.stroke();
    g.fillStyle = BR_GOLD; g.fillRect(-1.5, -56, 3, 3);
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, a.color);
    shoe(g, a.color2, C2, a.ffx, a.ffy);

    // 4 flight helmet + goggles, 5 the grin
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, false);
    faceEyes(g, a, hx, hy, true);
    g.strokeStyle = BR_GLEAM; g.lineWidth = 2;
    g.beginPath(); g.arc(hx + 3, hy + 3.5, 3.4, 0.15, PI * 0.85); g.stroke();
    g.fillStyle = STR.out;
    g.beginPath(); g.arc(hx, hy - 2, 10.6, PI, 0.15); g.closePath(); g.fill();
    g.fillStyle = BR_STRAP;
    g.beginPath(); g.arc(hx, hy - 2, 9.6, PI, 0.15); g.closePath(); g.fill();
    g.beginPath(); g.roundRect(hx - 9.5, hy - 1, 4, 6, 2); g.fill();
    g.strokeStyle = BR_CHIN; g.lineWidth = 1;
    g.beginPath(); g.arc(hx, hy + 1, 8.6, PI * 0.28, PI * 0.72); g.stroke();
    // goggles ride the dome — until he gets hit and they drop to his eyes
    const glx = hx - 3, gly = a.hurt ? hy - 1.5 : hy - 8;
    const grx = hx + 3.6, gry = gly;
    g.globalAlpha = 0.9;
    g.fillStyle = BR_LENS;
    g.beginPath(); g.arc(glx, gly, 2.8, 0, 7); g.fill();
    g.beginPath(); g.arc(grx, gry, 2.8, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = BR_GOLD; g.lineWidth = 1.2;
    g.beginPath(); g.arc(glx, gly, 2.8, 0, 7); g.stroke();
    g.beginPath(); g.arc(grx, gry, 2.8, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(glx + 2.8, gly); g.lineTo(grx - 2.8, gry); g.stroke();
    g.strokeStyle = BR_CHIN; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(glx - 2.8, gly); g.lineTo(hx - 9, gly + 1);
    g.moveTo(grx + 2.8, gry); g.lineTo(hx + 9.2, gry + 1);
    g.stroke();
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = BR_GLEAM;
    star4(g, hx + 6.5, hy + 2, 1.4);
    g.globalAlpha = 1;
    g.restore();

    // front arm + mitts
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, a.color);
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    // 7 tooth-gleam sparks off the boomerang tips
    const ca = Math.cos(tilt - 0.35), sa = Math.sin(tilt - 0.35);
    const cb = Math.cos(tilt + 1), sb = Math.sin(tilt + 1);
    const tax = -3 - 26 * ca, tay = -56 - 26 * sa;
    const tbx = -3 - 26 * cb, tby = -56 - 26 * sb;
    const gsp = air ? 1.8 : 0.9;
    for (let i = 0; i < 3; i++) {
      const p = GLEAM_MOTES[i];
      const cyc = (t * gsp + p) % 1;
      const gx = (i % 2 === 0 ? tax : tbx) + Math.sin(t * 4 + p) * 2;
      const gy = (i % 2 === 0 ? tay : tby) - cyc * 6;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.fillStyle = BR_GLEAM;
      g.beginPath(); g.arc(gx, gy, 1.1, 0, 7); g.fill();
      g.globalAlpha = (1 - cyc) * 0.5;
      g.strokeStyle = BR_GRN; g.lineWidth = 0.8;
      g.beginPath(); g.arc(gx, gy, 1.8, 0, 7); g.stroke();
    }
    g.globalAlpha = 1;
  };

  // =========================== KANSAS CITY DAYNE ===========================
  FB.dayne = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const BOX = a.ramp(KC_BOX), RED = a.ramp(KC_RED), GRY = a.ramp(KC_GREY);
    const BASE = a.ramp(a.color), SK = a.ramp(a.skin);
    const cape = Math.sin(t * 2.4) * 2;

    // 1 the moving box, bouncing counter-phase to his step
    const bob = a.moving ? Math.abs(Math.sin(w + PI)) * 1.5 : Math.sin(t * 2) * 1;
    g.fillStyle = BOX.out; g.beginPath(); g.roundRect(-24, -68 + bob, 17, 19, 2); g.fill();
    g.fillStyle = KC_BOX; g.beginPath(); g.roundRect(-23.3, -67.3 + bob, 15.6, 17.6, 1.6); g.fill();
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
    g.lineTo(-15.5, -62.4 + bob); g.lineTo(-14, -64 + bob); g.lineTo(-11, -64 + bob);
    g.stroke();

    // 2 towel cape, knotted at the shoulder
    g.globalAlpha = 0.92;
    g.fillStyle = KC_RED;
    g.beginPath();
    g.moveTo(-8, -64); g.lineTo(-20 + cape, -18); g.lineTo(-10 + cape, -16); g.lineTo(-2, -60);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = KC_GOLD; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-20 + cape, -18); g.lineTo(-10 + cape, -16); g.stroke();
    g.fillStyle = KC_RED; g.beginPath(); g.arc(-5, -63, 2.5, 0, 7); g.fill();

    // 3 body — grey sweats, his own colors above the belt
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, KC_GREY);
    shoe(g, KC_GREY, GRY, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, a.color2);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, a.color);
    g.strokeStyle = BASE.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();

    // 4 tailgate apron: gold KC heart, honest BBQ stain
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(-7.5, -58, 16, 22, 3); g.fill();
    g.fillStyle = KC_RED; g.beginPath(); g.roundRect(-6.7, -57.2, 14.4, 20.4, 2.6); g.fill();
    g.strokeStyle = KC_DEEP; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(sx - 6, sy + 1); g.lineTo(-6.7, -57.2);
    g.moveTo(sx + 6, sy + 1); g.lineTo(7.7, -57.2);
    g.stroke();
    g.fillStyle = KC_GOLD;
    g.beginPath(); g.arc(0, -50, 2, 0, 7); g.fill();
    g.beginPath(); g.arc(3.4, -50, 2, 0, 7); g.fill();
    g.beginPath();
    g.moveTo(-1.8, -49); g.lineTo(5.2, -49); g.lineTo(1.7, -44);
    g.closePath(); g.fill();
    g.globalAlpha = 0.85;
    g.fillStyle = KC_DEEP;
    g.beginPath(); g.arc(4, -42, 2.2, 0, 7); g.fill();
    g.beginPath(); g.arc(2.5, -40.5, 1.5, 0, 7); g.fill();
    g.globalAlpha = 1;

    // front leg
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, KC_GREY);
    shoe(g, KC_GREY, GRY, a.ffx, a.ffy);

    // 5 the cap (it slips when he gets hit)
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    faceEyes(g, a, hx, hy, a.blush);
    if (a.hurt) { g.translate(hx, hy + 2); g.rotate(0.15); g.translate(-hx, -hy); }
    g.fillStyle = KC_RED;
    g.beginPath(); g.arc(hx, hy - 3.5, 9.2, PI, 0); g.fill();
    g.fillRect(hx - 1, hy - 6, 14, 3.2);
    g.fillStyle = KC_GOLD;
    g.beginPath(); g.arc(hx + 1, hy - 8.5, 1.3, 0, 7); g.fill();
    g.restore();

    // front arm, 6 wristband, back mitt (the front hand is all foam)
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, a.color);
    g.fillStyle = KC_GOLD;
    g.beginPath(); g.roundRect(a.bhx - 2, a.bhy - 4, 4, 2.5, 1); g.fill();
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    // 7 the #1 foam finger, which arrives before he does
    g.save();
    g.translate(a.fhx, a.fhy);
    g.rotate(Math.sin(t * 6) * 0.08
      + (ak === 'kick' ? 1.3 * ext - 0.4 * ext * ext : ak ? 0.9 * ext : 0)
      - (a.hurt ? 0.5 : 0));
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(-2.6, -15, 11.2, 16, 3.4); g.fill();
    g.fillStyle = KC_RED; g.beginPath(); g.roundRect(-2, -14.4, 10, 14.8, 3); g.fill();
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(1.6, -21, 5.2, 8, 2.6); g.fill();
    g.fillStyle = KC_RED; g.beginPath(); g.roundRect(2.2, -20.4, 4, 7, 2); g.fill();
    g.strokeStyle = WHITE; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(2.6, -11); g.lineTo(2.6, -4);
    g.moveTo(2.6, -11); g.lineTo(0.9, -9.4);
    g.stroke();
    g.fillStyle = KC_GOLD; g.fillRect(-2.6, -1.4, 11.2, 2.4);
    g.restore();

    // 8 confetti — comedy shimmer, deliberately dim
    const ca2 = ak === 'B' ? 0.9 : 0.45;
    for (let i = 0; i < 9; i += 3) {
      const p = CONF_MOTES[i + 2];
      const cyc = (t * 0.4 + p) % 1;
      g.globalAlpha = (1 - cyc) * ca2;
      g.fillStyle = i === 3 ? KC_GOLD : KC_RED;
      g.fillRect(CONF_MOTES[i] + Math.sin(t * 2 + p) * 3, CONF_MOTES[i + 1] + cyc * 12, 1.7, 1.7);
    }
    g.globalAlpha = 1;
  };
})();
