// cine-cast.js — film-grade cutscene bodies drawn on the skeletal rig.
//
// A different production class from the gameplay chibis: real ~96-unit adult
// proportions straight off Rig's bone lengths, volumetric 3-shade capsule
// limbs with hue-dark outlines (key light upper-left, matching the game's art
// direction), mitt hands with thumb wedges, clothing with fold breaks, and
// real acting heads adapted from each character's faces.js design — blinking
// eyes, expression-driven brows, and a jaw that opens with the talk drive so
// dialogue visibly comes out of the speaker.
//
// window.CINE_CAST[id] = function (g, J, C)
//   J — the reused Rig.fk output (world joint positions + headAng)
//   C — reused context {facing, scale, expr, talk, blink, hurt, t}
//
// Draw order per actor: back arm, back leg, torso, front leg, (hem overlay),
// head, front arm — so limbs overlap correctly.
// Flat fills only — no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const CAST = (window.CINE_CAST = window.CINE_CAST || {});

  /* ============================ shared ink ============================ */
  const INK = '#181220';
  const EYEW = '#fbf7ee';
  const LID_SH = 'rgba(104,74,96,0.20)';
  const CATCH = 'rgba(255,255,255,0.96)';
  const CREASE = 'rgba(112,72,68,0.30)';
  const SHADE = 'rgba(24,16,34,0.14)';
  const JAWSH = 'rgba(24,16,34,0.13)';
  const STUB = 'rgba(48,38,56,0.15)';
  const BLUSH = 'rgba(255,118,118,0.30)';
  const FLUSH1 = 'rgba(206,42,24,0.14)';
  const FLUSH2 = 'rgba(206,42,24,0.26)';
  const TEETH = '#fbf6ea';
  const MOUTH_IN = '#3c1220';
  const TONGUE = '#cf5f6d';
  const HEAT_A = 'rgba(255,150,58,0.78)';
  const HEAT_B = 'rgba(255,198,132,0.44)';
  const GLASSF = 'rgba(206,232,246,0.16)';
  const GLASSR = '#2a2a35';
  const HOLLOW = 'rgba(16,10,28,0.24)';
  const HOOP_OUT = '#6e4e14';
  const HOOP = '#e8c04a';
  const HOOP_HI = '#f7e29a';
  const ROLL_OUT = '#7a3050';
  const ROLL_MID = '#e87ba4';
  const ROLL_LT = '#f5adc6';
  const HORN = '#e0cf9e';
  const HORN_OUT = '#8a7548';
  const HORN_LT = '#f6ecc8';
  const NAIL = '#e8e2cc';
  const NAIL_OUT = '#8a8468';
  const CHAIN = '#7a828e';
  const CHAIN_DK = '#3a3f4a';
  const GLOW_G = 'rgba(190,255,225,0.40)';
  const AURA_1 = 'rgba(198,236,218,0.09)';
  const AURA_2 = 'rgba(198,236,218,0.05)';
  const HEART = '#ff5d8a';
  const HEART_HI = '#ffc2d6';
  const TIE = '#c22743';
  const TIE_DK = '#8a1a2e';
  const WRAP_OUT = '#8f7648', WRAP_MID = '#e2cf9e', WRAP_LT = '#f6ecc8';
  const RO_OUT = '#571326', RO_MID = '#c22750', RO_LT = '#e05570';
  const LEAF = '#5c8a48', STEM = '#3f6b34';
  const SHEEN = 'rgba(255,255,255,0.30)';

  // damon's rage heat strands: side (-1 back / +1 front), base y, phase
  const HEATP = [-1, -12, 0, -1, -7, 1.9, 1, -13, 3.1, 1, -8, 0.8];
  // yvonne's perm cloud: x, y, r (head-local)
  const PERM = [
    -7.5, -14, 5.2, -1, -17.5, 5.8, 5.5, -14.5, 5.0, 9, -8.5, 4.2,
    -10.5, -7.5, 4.6, -11, 0.5, 4.0, 9.5, -2, 3.6, -9.5, 7, 3.4,
  ];
  // ghast hair: a hanging white mane — base x/y on the skull, tip x/y
  // drooping down the back, phase for the wobble
  const STRAND = [
    -3, -16, -13, -7, 0, -6, -13, -16, 1, 1.3, -7, -9, -17, 7, 2.4,
    -7, -4, -15, 13, 3.5, -5, 0, -12, 17, 4.6, 1, -17.5, -6, -14, 2.9,
    4, -17, 1, -23, 1.0,
  ];
  // tattered hem zigzag: dx (fraction of half-width), dy off hem line
  const TATTER = [-1, 0, -0.72, -7, -0.45, 1, -0.18, -8, 0.1, 0, 0.4, -6.5, 0.68, 2, 1, -4];
  // soft hem wave for skirts/coats: dx fraction, dy
  const WAVE = [-1, 0, -0.5, 2.5, 0, 0.5, 0.5, 3, 1, 0];
  // fur tufts on the monster's silhouette: x, y, angle (head-local)
  const TUFT = [-8.5, 3, 2.6, -9.5, -5, 2.9, 8, 6, 0.6, 6, -14, -0.6, -4, -16.5, -2.2];

  /* =========================== expressions ============================
     bi/bo brow inner/outer dy (+down, raw bust units, scaled by BK)
     lt lid closure   mc mouth curve (+smile)   mo mouth open bias
     fl flush   ey eye-open scale   pup pupil scale   th teeth on open */
  const BK = 0.17;
  const EXPR = {
    neutral: { bi: 0, bo: 0, lt: 0.14, mc: 0.10, mo: 0, fl: 0, ey: 1, pup: 1, th: 0 },
    angry: { bi: 9, bo: -7, lt: 0.30, mc: -0.30, mo: 0.15, fl: 0.3, ey: 0.95, pup: 0.8, th: 0 },
    rage: { bi: 15, bo: -11, lt: 0.28, mc: -0.20, mo: 0.85, fl: 1, ey: 1.05, pup: 0.5, th: 1 },
    scared: { bi: -12, bo: -3, lt: 0, mc: -0.25, mo: 0.5, fl: 0, ey: 1.2, pup: 0.45, th: 0 },
    smug: { bi: 3, bo: -8, lt: 0.45, mc: 0.42, mo: 0, fl: 0, ey: 0.92, pup: 1, th: 0 },
    determined: { bi: 6, bo: 1, lt: 0.26, mc: -0.05, mo: 0, fl: 0.1, ey: 0.97, pup: 0.9, th: 0 },
    hurt: { bi: -13, bo: 9, lt: 0.95, mc: -0.30, mo: 0.4, fl: 0.2, ey: 0.85, pup: 1, th: 1 },
    surprised: { bi: -13, bo: -12, lt: 0, mc: 0, mo: 0.6, fl: 0, ey: 1.2, pup: 0.7, th: 0 },
    sad: { bi: -10, bo: 6, lt: 0.40, mc: -0.40, mo: 0.08, fl: 0.1, ey: 1.02, pup: 1.1, th: 0 },
  };

  /* ======================= volumetric primitives ====================== */
  // one limb capsule: hue-dark outline, dark base, mid body, light band —
  // the light band rides the up-left normal so the tube reads lit top-left
  function cap(g, x1, y1, x2, y2, w, out, dk, mid, lt) {
    let nx = -(y2 - y1), ny = x2 - x1;
    const L = Math.hypot(nx, ny) || 1;
    nx /= L; ny /= L;
    if (nx + ny > 0) { nx = -nx; ny = -ny; }
    g.strokeStyle = out; g.lineWidth = w + 2.8;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = dk; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    const o1 = w * 0.13, o2 = w * 0.27;
    g.strokeStyle = mid; g.lineWidth = w * 0.62;
    g.beginPath();
    g.moveTo(x1 + nx * o1, y1 + ny * o1); g.lineTo(x2 + nx * o1, y2 + ny * o1);
    g.stroke();
    g.strokeStyle = lt; g.lineWidth = w * 0.24;
    g.beginPath();
    g.moveTo(x1 + nx * o2, y1 + ny * o2); g.lineTo(x2 + nx * o2, y2 + ny * o2);
    g.stroke();
  }

  // mitt hand at the wrist, oriented down the forearm, with a thumb wedge
  function mitt(g, ex, ey, wx, wy, r, out, dk, mid) {
    let ux = wx - ex, uy = wy - ey;
    const L = Math.hypot(ux, uy) || 1;
    ux /= L; uy /= L;
    const hx = wx + ux * r * 0.7, hy = wy + uy * r * 0.7;
    let nx = -uy, ny = ux;
    if (nx + ny > 0) { nx = -nx; ny = -ny; }
    g.fillStyle = mid; g.strokeStyle = out; g.lineWidth = 2.2;
    g.beginPath(); g.arc(hx, hy, r, 0, 7); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(hx + nx * r * 0.6, hy + ny * r * 0.6);
    g.lineTo(hx + nx * r * 1.4 + ux * r * 0.55, hy + ny * r * 1.4 + uy * r * 0.55);
    g.lineTo(hx + ux * r * 0.95, hy + uy * r * 0.95);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = dk;
    g.beginPath(); g.arc(hx - nx * r * 0.34, hy - ny * r * 0.34, r * 0.5, 0, 7); g.fill();
  }

  // the ghast's talon: gaunt palm and three long curved claws
  function talon(g, ex, ey, wx, wy, r, out, dk, mid) {
    let ux = wx - ex, uy = wy - ey;
    const L = Math.hypot(ux, uy) || 1;
    ux /= L; uy /= L;
    const nx = -uy, ny = ux;
    const hx = wx + ux * r * 0.6, hy = wy + uy * r * 0.6;
    g.fillStyle = dk; g.strokeStyle = out; g.lineWidth = 2;
    g.beginPath(); g.ellipse(hx, hy, r * 0.95, r * 0.72, Math.atan2(uy, ux), 0, 7);
    g.fill(); g.stroke();
    g.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const cx2 = hx + ux * r * 2.9 + nx * i * r * 1.15;
      const cy2 = hy + uy * r * 2.9 + ny * i * r * 1.15;
      g.strokeStyle = NAIL_OUT; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(hx + nx * i * r * 0.55, hy + ny * i * r * 0.55);
      g.quadraticCurveTo(hx + ux * r * 1.8 + nx * i * r * 0.95, hy + uy * r * 1.8 + ny * i * r * 0.95, cx2, cy2);
      g.stroke();
      g.strokeStyle = NAIL; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(hx + nx * i * r * 0.55, hy + ny * i * r * 0.55);
      g.quadraticCurveTo(hx + ux * r * 1.8 + nx * i * r * 0.95, hy + uy * r * 1.8 + ny * i * r * 0.95, cx2, cy2);
      g.stroke();
    }
  }

  // shoe from ankle to toe: outline, body, dark sole, light toe cap
  function shoe(g, ax, ay, tx, ty, w, out, dk, mid, lt) {
    g.strokeStyle = out; g.lineWidth = w + 2.8;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(tx, ty); g.stroke();
    g.strokeStyle = mid; g.lineWidth = w;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(tx, ty); g.stroke();
    g.strokeStyle = dk; g.lineWidth = w * 0.4;
    g.beginPath();
    g.moveTo(ax + (ax - tx) * 0.06, ay + w * 0.26);
    g.lineTo(tx, ty + w * 0.26);
    g.stroke();
    g.fillStyle = lt;
    g.beginPath();
    g.ellipse(tx - (tx - ax) * 0.12, ty - w * 0.14, w * 0.42, w * 0.24, Math.atan2(ty - ay, tx - ax), 0, 7);
    g.fill();
  }

  // shackle cuff + short hanging chain (the pet monster)
  function shackle(g, x, y, r, t, ph) {
    g.strokeStyle = CHAIN_DK; g.lineWidth = 5.2;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    g.strokeStyle = CHAIN; g.lineWidth = 2.6;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    const sw = Math.sin(t * 2.1 + ph);
    g.strokeStyle = CHAIN_DK; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(x + sw * (i + 1) * 1.3, y + r + 2.8 + i * 5.2, 2.7, 0, 7);
      g.stroke();
    }
  }

  /* =============================== torso ============================== */
  // clothed trunk from pelvis to chest: rounded shoulder top, belly bulge
  // for the heavy builds, lit edge on the world-left side, 2 fold breaks
  function torso(g, J, C, d) {
    const s = C.scale, f = C.facing;
    const px = J.pelvisX, py = J.pelvisY, cx = J.chestX, cy = J.chestY;
    let ux = cx - px, uy = cy - py;
    const L = Math.hypot(ux, uy) || 1;
    ux /= L; uy /= L;
    const qx = -uy * f, qy = ux * f; // +q = character forward
    const wH = d.hipW * s, wC = d.chestW * s, gut = (d.gut || 0) * s;
    const hFx = px + qx * wH, hFy = py + qy * wH;
    const hBx = px - qx * wH, hBy = py - qy * wH;
    const cFx = cx + qx * wC, cFy = cy + qy * wC;
    const cBx = cx - qx * wC, cBy = cy - qy * wC;
    const mFx = (hFx + cFx) * 0.5 + qx * (2.2 * s + gut * 7);
    const mFy = (hFy + cFy) * 0.5 + qy * (2.2 * s + gut * 7);
    const mBx = (hBx + cBx) * 0.5 - qx * 1.2 * s;
    const mBy = (hBy + cBy) * 0.5 - qy * 1.2 * s;
    const tx2 = cx + ux * 4.6 * s, ty2 = cy + uy * 4.6 * s; // shoulder dome
    // neck riser FIRST so the torso and collar bury its base
    cap(g, cx + (J.headBaseX - cx) * 0.2, cy + (J.headBaseY - cy) * 0.2,
      J.headBaseX, J.headBaseY, 4.2 * s, d.sOut, d.sDk, d.sDk, d.sMid);
    g.beginPath();
    g.moveTo(hBx, hBy);
    g.quadraticCurveTo(mBx, mBy, cBx, cBy);
    g.quadraticCurveTo(tx2 - qx * wC * 0.7, ty2 - qy * wC * 0.7, tx2, ty2);
    g.quadraticCurveTo(tx2 + qx * wC * 0.8, ty2 + qy * wC * 0.8, cFx, cFy);
    g.quadraticCurveTo(mFx, mFy, hFx, hFy);
    g.quadraticCurveTo(px, py + 2 * s, hBx, hBy);
    g.closePath();
    g.fillStyle = d.tMid;
    g.fill();
    g.save();
    g.clip();
    // lit band down the world-left edge, shade down the world-right
    const litF = f < 0; // facing left: the front edge catches the key
    g.strokeStyle = d.tLt; g.lineWidth = 3.6 * s; g.lineCap = 'round';
    g.beginPath();
    if (litF) { g.moveTo(cFx, cFy); g.quadraticCurveTo(mFx, mFy, hFx, hFy); }
    else { g.moveTo(cBx, cBy); g.quadraticCurveTo(mBx, mBy, hBx, hBy); }
    g.stroke();
    g.fillStyle = SHADE;
    g.beginPath();
    if (litF) g.ellipse(mBx - qx * 2 * s, mBy, wC * 0.9, L * 0.62, 0, 0, 7);
    else g.ellipse(mFx + qx * 0.5 * s, mFy, wC * 0.8, L * 0.62, 0, 0, 7);
    g.fill();
    // 2 cloth folds breaking across the waist
    g.strokeStyle = d.tDk; g.lineWidth = 1.5 * s;
    g.beginPath();
    g.moveTo(px - qx * wH * 0.5, py - ux * L * 0.3);
    g.quadraticCurveTo(px + qx * wH * 0.2, py - ux * L * 0.22 + 2 * s, px + qx * wH * 0.7, py - ux * L * 0.3);
    g.moveTo(cx - qx * wC * 0.6 - ux * 5 * s, cy + uy * -5 * s + 5 * s);
    g.quadraticCurveTo(cx, cy + 7 * s, cx + qx * wC * 0.5, cy + 5 * s);
    g.stroke();
    if (gut > 0) { // belly crease under the overhang
      g.strokeStyle = d.tDk; g.lineWidth = 1.8 * s;
      g.beginPath();
      g.moveTo(px + qx * wH * 0.9, py - 2 * s);
      g.quadraticCurveTo(mFx, mFy + 5 * s, mFx - qx * 3 * s, mFy - 5 * s);
      g.stroke();
    }
    g.restore();
    g.strokeStyle = d.tOut; g.lineWidth = 2.6;
    g.stroke();
    // chest decor
    const dcx = cx * 0.55 + px * 0.45 + qx * wC * 0.3, dcy = cy * 0.55 + py * 0.45 + qy * wC * 0.3;
    if (d.bolt) { // josh's band-tee lightning bolt
      g.fillStyle = d.acc;
      g.beginPath();
      g.moveTo(dcx + 1.2 * s, dcy - 6 * s); g.lineTo(dcx - 2.6 * s, dcy + 1.2 * s);
      g.lineTo(dcx - 0.2 * s, dcy + 1.2 * s); g.lineTo(dcx - 1.4 * s, dcy + 6 * s);
      g.lineTo(dcx + 3 * s, dcy - 0.6 * s); g.lineTo(dcx + 0.6 * s, dcy - 0.6 * s);
      g.closePath(); g.fill();
    }
    if (d.skull) { // heath's tee print
      g.fillStyle = d.acc;
      g.beginPath(); g.arc(dcx, dcy - 1.5 * s, 3.4 * s, 0, 7); g.fill();
      g.beginPath();
      g.moveTo(dcx - 2.2 * s, dcy + 1.2 * s); g.lineTo(dcx + 2.2 * s, dcy + 1.2 * s);
      g.lineTo(dcx + 1.4 * s, dcy + 3.6 * s); g.lineTo(dcx - 1.4 * s, dcy + 3.6 * s);
      g.closePath(); g.fill();
      g.fillStyle = d.tDk;
      g.beginPath(); g.arc(dcx - 1.3 * s, dcy - 2 * s, 1 * s, 0, 7); g.fill();
      g.beginPath(); g.arc(dcx + 1.3 * s, dcy - 2 * s, 1 * s, 0, 7); g.fill();
    }
    if (d.zip) { // todd's tracksuit zip + collar
      g.strokeStyle = d.acc; g.lineWidth = 1.3 * s;
      g.beginPath();
      g.moveTo(cx + qx * wC * 0.5, cy + qy * wC * 0.5);
      g.lineTo(px + qx * wH * 0.5, py + qy * wH * 0.5);
      g.stroke();
      g.strokeStyle = d.tDk; g.lineWidth = 2.4 * s;
      g.beginPath();
      g.moveTo(cBx + ux * 2 * s, cBy + uy * 2 * s);
      g.quadraticCurveTo(tx2, ty2 + 2 * s, cFx + ux * 2 * s, cFy + uy * 2 * s);
      g.stroke();
    }
    if (d.gi) { // sonya's gi wrap + knotted belt
      g.strokeStyle = d.tLt; g.lineWidth = 2 * s;
      g.beginPath();
      g.moveTo(cFx, cFy + 1 * s);
      g.lineTo(px - qx * wH * 0.4, py - 1 * s);
      g.stroke();
      g.strokeStyle = d.beltC; g.lineWidth = 3.4 * s;
      g.beginPath();
      g.moveTo(px - qx * wH, py + s);
      g.lineTo(px + qx * wH * 1.04, py + s);
      g.stroke();
      g.fillStyle = d.beltC;
      g.beginPath(); g.arc(px + qx * wH * 0.55, py + 3 * s, 2.2 * s, 0, 7); g.fill();
    }
    if (d.bodice) { // yvonne: neckline trim + cinched waist
      g.strokeStyle = d.tHi; g.lineWidth = 1.8 * s;
      g.beginPath();
      g.moveTo(cBx + ux * 1.5 * s, cBy + 2 * s);
      g.quadraticCurveTo(cx, cy + 4 * s, cFx, cFy + 2 * s);
      g.stroke();
      g.strokeStyle = d.tOut; g.lineWidth = 1.2 * s;
      g.beginPath();
      g.moveTo(px - qx * wH * 0.8, py - 1 * s); g.lineTo(px + qx * wH * 0.8, py - 1 * s);
      g.stroke();
    }
    if (d.floret) { // collette's floral blouse: sparse accent dots
      g.fillStyle = d.acc;
      g.beginPath(); g.arc(dcx - 2.5 * s, dcy - 3 * s, 1.1 * s, 0, 7); g.fill();
      g.beginPath(); g.arc(dcx + 2 * s, dcy + 1 * s, 1.1 * s, 0, 7); g.fill();
      g.beginPath(); g.arc(dcx - 1 * s, dcy + 5 * s, 1.1 * s, 0, 7); g.fill();
    }
    if (d.bowtie) { // the suitor's try-hard red bow at the collar
      const bx = cx + qx * wC * 0.42, by = cy + qy * wC * 0.42 + 0.6 * s;
      g.fillStyle = TIE; g.strokeStyle = TIE_DK; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(bx, by); g.lineTo(bx - 3.2 * s, by - 2 * s); g.lineTo(bx - 3.2 * s, by + 2 * s);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(bx, by); g.lineTo(bx + 3.2 * s, by - 2 * s); g.lineTo(bx + 3.2 * s, by + 2 * s);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = TIE_DK;
      g.beginPath(); g.arc(bx, by, 1.3 * s, 0, 7); g.fill();
    }
    if (d.collarBand) { // pet monster's collar
      g.strokeStyle = d.collarBand; g.lineWidth = 3.2 * s;
      g.beginPath();
      g.moveTo(cBx + ux * 2 * s, cBy + 2 * s);
      g.quadraticCurveTo(tx2, ty2 + 4.4 * s, cFx + ux * 2 * s, cFy + 2 * s);
      g.stroke();
    }
    if (d.strap) { // damon's undershirt shoulder strap
      g.strokeStyle = d.tDk; g.lineWidth = 2 * s;
      g.beginPath();
      g.moveTo(cBx + ux * 1 * s, cBy + 1 * s);
      g.quadraticCurveTo(tx2, ty2 + 3 * s, cFx + ux * 1 * s, cFy + 1 * s);
      g.stroke();
    }
  }

  // loose cloth hem hung from the waist (skirt / housecoat / gown / shirt
  // tail) — 1-2 segment lag sway driven by C.t, tattered variant for the
  // ghast. Drawn after the front leg so it drapes over both legs.
  function hem(g, J, C, d) {
    const s = C.scale, f = C.facing, t = C.t;
    const px = J.pelvisX, py = J.pelvisY;
    const w = d.hemW * s, len = d.hemLen * s;
    const sw1 = Math.sin(t * 1.6) * 1.6 * s;
    const sw2 = Math.sin(t * 1.6 - 0.7) * 2.2 * s;
    const y0 = py - 2 * s, y1 = py + len;
    const flare = w * (d.hemFlare == null ? 0.45 : d.hemFlare);
    const pts = d.tatter ? TATTER : WAVE;
    g.beginPath();
    g.moveTo(px - w, y0);
    g.quadraticCurveTo(px - w - flare * 0.5 + sw1 * 0.4, (y0 + y1) * 0.5, px - w - flare + sw2, y1 + pts[1] * s * 0.5);
    for (let i = 0; i < pts.length; i += 2) {
      g.lineTo(px + pts[i] * (w + flare) + sw2, y1 + pts[i + 1] * s * 0.5);
    }
    g.quadraticCurveTo(px + w + flare * 0.5 + sw1 * 0.4, (y0 + y1) * 0.5, px + w, y0);
    g.closePath();
    g.fillStyle = d.hMid2;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = SHADE;
    const shx = f > 0 ? px + w * 0.5 : px - w * 0.5;
    g.beginPath(); g.ellipse(shx + flare * 0.4, (y0 + y1) * 0.55, w * 0.9, len * 0.62, 0.1, 0, 7); g.fill();
    g.strokeStyle = d.hDk2; g.lineWidth = 1.5 * s; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(px - w * 0.42, y0 + 3 * s);
    g.quadraticCurveTo(px - w * 0.5 + sw1 * 0.5, (y0 + y1) * 0.55, px - w * 0.56 + sw2, y1 - 2 * s);
    g.moveTo(px + w * 0.3, y0 + 4 * s);
    g.quadraticCurveTo(px + w * 0.36 + sw1 * 0.5, (y0 + y1) * 0.6, px + w * 0.44 + sw2, y1 - 1.5 * s);
    g.stroke();
    g.strokeStyle = d.hLt2; g.lineWidth = 2 * s;
    g.beginPath();
    g.moveTo(px - w * 0.95, y0 + 2 * s);
    g.quadraticCurveTo(px - w - flare * 0.4 + sw1 * 0.4, (y0 + y1) * 0.5, px - w - flare * 0.8 + sw2, y1 - 3 * s);
    g.stroke();
    g.restore();
    g.strokeStyle = d.hOut2; g.lineWidth = 2.4;
    g.stroke();
  }

  /* ============================ arms + legs =========================== */
  function drawArm(g, J, C, d, side) {
    const s = C.scale, t = C.t;
    const sx = J.shoulderX, sy = J.shoulderY;
    const ex = J['elbow' + side + 'X'], ey = J['elbow' + side + 'Y'];
    const wx = J['wrist' + side + 'X'], wy = J['wrist' + side + 'Y'];
    const back = side === 'B';
    const aw = d.armW * s * (d.plush ? 1.5 : 1);
    // back limbs sit a full shade darker so depth reads
    const uO = d.sleeves === 'none' ? d.sOut : d.tOut;
    const uD = d.sleeves === 'none' ? d.sDk : d.tDk;
    const uM = back ? uD : (d.sleeves === 'none' ? d.sMid : d.tMid);
    const uL = back ? uM : (d.sleeves === 'none' ? d.sLt : d.tLt);
    const fSkin = d.sleeves !== 'long';
    const fO = fSkin ? d.sOut : d.tOut;
    const fD = fSkin ? d.sDk : d.tDk;
    const fM = back ? fD : (fSkin ? d.sMid : d.tMid);
    const fL = back ? fM : (fSkin ? d.sLt : d.tLt);
    cap(g, sx + (ex - sx) * 0.07, sy + (ey - sy) * 0.07, ex, ey, aw, uO, uD, uM, uL);
    cap(g, ex, ey, wx, wy, aw * 0.85, fO, fD, fM, fL);
    if (d.sleeves === 'short') { // cuff break at the elbow
      g.strokeStyle = d.tOut; g.lineWidth = 1.4;
      let cx2 = -(wy - ey), cy2 = wx - ex;
      const cl = Math.hypot(cx2, cy2) || 1;
      cx2 = cx2 / cl * aw * 0.62; cy2 = cy2 / cl * aw * 0.62;
      g.beginPath();
      g.moveTo(ex - cx2, ey - cy2); g.lineTo(ex + cx2, ey + cy2);
      g.stroke();
    }
    if (d.stripe && d.sleeves === 'long') { // tracksuit arm stripe
      g.strokeStyle = d.acc2; g.lineWidth = 1.2 * s;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(wx, wy); g.stroke();
    }
    const hr = 3.1 * s * (d.plush ? 1.35 : 1);
    const hd = back ? d.sDk : d.sMid;
    if (d.talons) talon(g, ex, ey, wx, wy, hr, d.sOut, hd, d.sLt);
    else mitt(g, ex, ey, wx, wy, hr, d.sOut, d.sDk, hd);
    if (d.shackles) shackle(g, wx, wy, hr * 1.18, t, back ? 2.1 : 0.4);
    if (d.bouquet && side === 'F') drawBouquet(g, wx, wy, s, t);
  }

  function drawLeg(g, J, C, d, side) {
    const s = C.scale, t = C.t;
    const hx = J['hip' + side + 'X'], hy = J['hip' + side + 'Y'];
    const kx = J['knee' + side + 'X'], ky = J['knee' + side + 'Y'];
    const ax = J['ankle' + side + 'X'], ay = J['ankle' + side + 'Y'];
    const tx2 = J['toe' + side + 'X'], ty2 = J['toe' + side + 'Y'];
    const back = side === 'B';
    const tw = d.thighW * s * (d.plush ? 1.35 : 1);
    const bare = d.legs === 'skin';
    const pO = bare ? d.sOut : d.pOut;
    const pD = bare ? d.sDk : d.pDk;
    const pM = back ? pD : (bare ? d.sMid : d.pMid);
    const pL = back ? pM : (bare ? d.sLt : d.pLt);
    const shSkin = d.legs === 'shorts' || bare;
    const sO = shSkin ? d.sOut : d.pOut;
    const sD = shSkin ? d.sDk : d.pDk;
    const sM = back ? sD : (shSkin ? d.sMid : d.pMid);
    const sL = back ? sM : (shSkin ? d.sLt : d.pLt);
    // inset the thigh start so its round cap doesn't invade the torso
    cap(g, hx + (kx - hx) * 0.12, hy + (ky - hy) * 0.12, kx, ky, tw, pO, pD, pM, pL);
    cap(g, kx, ky, ax, ay, tw * 0.8, sO, sD, sM, sL);
    if (d.legs === 'shorts') { // cargo shell over the thigh + hem cuff
      cap(g, hx, hy, hx + (kx - hx) * 0.6, hy + (ky - hy) * 0.62, tw * 1.14, d.pOut, d.pDk, back ? d.pDk : d.pMid, back ? d.pDk : d.pLt);
      if (!back) {
        g.fillStyle = d.pDk; g.strokeStyle = d.pOut; g.lineWidth = 1.1;
        g.beginPath(); g.roundRect(hx + tw * 0.1, (hy + ky) * 0.5 - 4 * s, 3.6 * s, 4.2 * s, 1); g.fill(); g.stroke();
      }
    }
    if (d.stripe) { // tracksuit leg stripe
      g.strokeStyle = d.acc2; g.lineWidth = 1.2 * s;
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(ax, ay); g.stroke();
    }
    if (d.sock) {
      g.strokeStyle = d.sock; g.lineWidth = tw * 0.62;
      g.beginPath();
      g.moveTo(ax + (kx - ax) * 0.12, ay + (ky - ay) * 0.12); g.lineTo(ax, ay);
      g.stroke();
    }
    const fw = 5.6 * s * (d.plush ? 1.3 : 1);
    if (d.talons) { // bare clawed feet
      cap(g, ax, ay, tx2, ty2, fw * 0.8, d.sOut, back ? d.sDk : d.sMid, back ? d.sDk : d.sMid, d.sLt);
      g.strokeStyle = NAIL_OUT; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(tx2, ty2); g.lineTo(tx2 + 3.4 * s * C.facing, ty2 + 0.6 * s); g.stroke();
      g.strokeStyle = NAIL; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(tx2, ty2); g.lineTo(tx2 + 3.4 * s * C.facing, ty2 + 0.6 * s); g.stroke();
    } else if (d.plush) { // stubby paw
      mitt(g, kx, ky, (ax + tx2) * 0.5, (ay + ty2) * 0.5, fw * 0.9, d.sOut, d.sDk, back ? d.sDk : d.sMid);
    } else {
      shoe(g, ax, ay, tx2, ty2, fw, d.shOut, d.shDk, back ? d.shDk : d.shMid, d.shLt);
    }
    if (d.shackles && !back) shackle(g, ax, ay, tw * 0.62, t, 3.2);
  }

  // wrapped rose cone riding the front hand
  function drawBouquet(g, wx, wy, s, t) {
    const sway = Math.sin(t * 1.7) * 0.06;
    g.save();
    g.translate(wx, wy - 1 * s);
    g.rotate(sway);
    g.scale(s * 1.15, s * 1.15);
    g.strokeStyle = STEM; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-1, -6); g.lineTo(-3.4, -12);
    g.moveTo(0, -6); g.lineTo(0.4, -13);
    g.moveTo(1, -6); g.lineTo(3.8, -11.5);
    g.stroke();
    g.fillStyle = WRAP_MID; g.strokeStyle = WRAP_OUT; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-4.8, -8); g.lineTo(4.8, -8); g.lineTo(1.6, 2.5); g.lineTo(-1.6, 2.5);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = WRAP_LT;
    g.beginPath(); g.moveTo(-4.8, -8); g.lineTo(-1, -8); g.lineTo(-1.4, 2.3); g.closePath(); g.fill();
    g.fillStyle = LEAF;
    g.beginPath(); g.ellipse(-5.2, -10.5, 2.4, 1.2, -0.7, 0, 7); g.fill();
    g.beginPath(); g.ellipse(5.4, -10, 2.2, 1.1, 0.6, 0, 7); g.fill();
    g.fillStyle = RO_MID; g.strokeStyle = RO_OUT; g.lineWidth = 1.3;
    g.beginPath(); g.arc(-3.8, -13.5, 3, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(4, -12.8, 2.8, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(0.2, -15.8, 3.4, 0, 7); g.fill(); g.stroke();
    g.fillStyle = RO_LT;
    g.beginPath(); g.arc(-4.7, -14.4, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(-0.7, -16.7, 1.5, 0, 7); g.fill();
    g.restore();
  }

  /* =============================== head =============================== */
  // Local frame: origin at J.headBase, +x forward, +y down, head bone runs
  // to (0,-14). Skull, acting face and hair all live here; the transform
  // (translate/scale(facing)/rotate(headAng)) turns it with the neck.

  // skull silhouette; drop lowers the jaw for talking
  function headPath(g, d, drop) {
    const hw = d.hw, ch = d.chin;
    g.beginPath();
    g.moveTo(-hw * 0.72, ch - 1.4);
    g.bezierCurveTo(-hw - 1.6, ch - 6, -hw - 1.9, -13, -hw * 0.35, -16.4);
    g.bezierCurveTo(hw * 0.4, -18.4, hw + 0.8, -12.5, hw + 0.9, -6.4);
    g.quadraticCurveTo(hw + 1.05, -4.6, hw * 0.92, -3.2);
    g.lineTo(hw * 0.95, -0.6 + drop * 0.3);
    g.quadraticCurveTo(hw * 0.92, 1.4 + drop, hw * 0.58, ch - 0.4 + drop);
    g.quadraticCurveTo(hw * 0.2, ch + 1 + drop, -hw * 0.15, ch + 0.3 + drop * 0.85);
    g.quadraticCurveTo(-hw * 0.52, ch - 0.3 + drop * 0.45, -hw * 0.72, ch - 1.4);
    g.closePath();
  }

  function drawEyeC(g, d, e, C, x, y, k) {
    const ew = d.ew * k, ehh = d.eh * k * e.ey;
    const c = Math.max(Math.min(1, e.lt + (d.lidBias || 0)), C.blink || 0);
    g.save();
    g.translate(x, y);
    g.fillStyle = d.sockC || CREASE;
    g.beginPath(); g.ellipse(0, -0.2, ew + 0.9, ehh + 1.1, 0, 0, 7); g.fill();
    if (c > 0.82) { // shut: a curved lash line, never a bare circle
      g.strokeStyle = d.hOut; g.lineWidth = 1.1; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-ew, -0.2); g.quadraticCurveTo(0, ehh * 0.9, ew, -0.3);
      g.stroke();
      g.restore();
      return;
    }
    if (d.glowE) {
      g.fillStyle = GLOW_G;
      g.beginPath(); g.arc(0, 0, ew * 1.7, 0, 7); g.fill();
    }
    g.beginPath(); g.ellipse(0, 0, ew, ehh, 0, 0, 7);
    g.fillStyle = d.glowE ? d.ir : EYEW;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = LID_SH;
    g.fillRect(-ew, -ehh, ew * 2, ehh * 0.7);
    const ir = ehh * 0.82, ix = 0.25; // gaze rides slightly forward
    if (d.heartEyes) {
      g.fillStyle = HEART;
      g.beginPath();
      g.moveTo(ix, ir);
      g.quadraticCurveTo(ix - ir * 1.2, ir * 0.1, ix - ir * 0.8, -ir * 0.5);
      g.quadraticCurveTo(ix - ir * 0.45, -ir * 1.05, ix, -ir * 0.35);
      g.quadraticCurveTo(ix + ir * 0.45, -ir * 1.05, ix + ir * 0.8, -ir * 0.5);
      g.quadraticCurveTo(ix + ir * 1.2, ir * 0.1, ix, ir);
      g.closePath(); g.fill();
      g.fillStyle = HEART_HI;
      g.beginPath(); g.arc(ix - ir * 0.4, -ir * 0.45, ir * 0.22, 0, 7); g.fill();
    } else {
      g.fillStyle = d.ir;
      g.beginPath(); g.arc(ix, ehh * 0.12, ir, 0, 7); g.fill();
      g.strokeStyle = d.irD; g.lineWidth = 0.8;
      g.beginPath(); g.arc(ix, ehh * 0.12, ir - 0.4, 0, 7); g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(ix, ehh * 0.12, ir * 0.48 * e.pup * (d.pupil || 1), 0, 7); g.fill();
      g.fillStyle = CATCH;
      g.beginPath(); g.arc(ix - ir * 0.36, ehh * 0.12 - ir * 0.4, ir * 0.26, 0, 7); g.fill();
    }
    // upper lid cuts down over everything
    if (c > 0.02) {
      g.fillStyle = d.sLt;
      g.fillRect(-ew - 1, -ehh - 1, ew * 2 + 2, ehh + c * ehh * 1.9);
    }
    g.restore();
    // lash line along the lid edge
    const ly = -ehh + c * ehh * 1.9;
    g.strokeStyle = d.hOut; g.lineWidth = d.lash ? 1.3 : 0.9; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-ew + 0.2, ly + 0.4); g.quadraticCurveTo(0, ly - 0.4, ew - 0.1, ly + 0.3);
    g.stroke();
    if (d.lash) {
      g.beginPath();
      g.moveTo(ew - 0.4, ly + 0.2); g.lineTo(ew + 1.5, ly - 1.1);
      g.stroke();
    }
    g.restore();
  }

  function drawBrowC(g, d, e, x, y, k) {
    const ew = d.ew * k;
    const y0 = y - d.eh * k - 1.3;
    g.strokeStyle = d.browC; g.lineWidth = d.bw * k; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x + ew * 0.95, y0 + e.bi * BK + (d.biBias || 0) * BK);
    g.quadraticCurveTo(x + ew * 0.1, y0 - 0.6 + (e.bi + e.bo) * 0.5 * BK, x - ew * 0.95, y0 + e.bo * BK);
    g.stroke();
  }

  function drawMouthC(g, d, e, C, open, drop) {
    const hw2 = d.hw, mx = hw2 * 0.5, my = 1.8 + drop * 0.55;
    const mc = e.mc + (d.mcBias || 0);
    if (open <= 0.08) {
      g.strokeStyle = d.lipD; g.lineWidth = 1.15; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(mx - 2.8, my - mc * 1.9);
      g.quadraticCurveTo(mx + 0.2, my + 1.2 - mc * 0.5, mx + 2.5, my - mc * 0.9);
      g.stroke();
      if (d.lipC) { // painted lip: a soft fill under the line
        g.fillStyle = d.lipC;
        g.beginPath(); g.ellipse(mx + 0.1, my + 0.4 - mc * 0.8, 2.3, 1.05, -mc * 0.3, 0, 7); g.fill();
      }
      if (mc > 0.3) { // smug corner crease
        g.strokeStyle = CREASE; g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(mx + 2.6, my - mc * 0.9); g.lineTo(mx + 3.4, my - mc * 1.8);
        g.stroke();
      }
      return;
    }
    const rw = 2.1 + open * 1.0, rh = 0.8 + open * 2.9 * (d.gapeK || 1);
    g.fillStyle = d.lipD;
    g.beginPath(); g.ellipse(mx, my + rh * 0.45, rw + 0.8, rh + 0.8, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(mx, my + rh * 0.45, rw, rh, 0, 0, 7);
    g.fillStyle = MOUTH_IN;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = TEETH;
    if (e.th || open > 0.25) g.fillRect(mx - rw, my - rh * 0.7, rw * 2, rh * 0.62);
    if (d.fangs) {
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.moveTo(mx + i * rw * 0.55 - 0.7, my - rh * 0.2);
        g.lineTo(mx + i * rw * 0.55, my + rh * 0.55);
        g.lineTo(mx + i * rw * 0.55 + 0.7, my - rh * 0.2);
        g.closePath(); g.fill();
      }
    }
    if (open > 0.45) {
      g.fillStyle = TONGUE;
      g.beginPath(); g.ellipse(mx, my + rh * 1.05, rw * 0.7, rh * 0.5, 0, 0, 7); g.fill();
    }
    g.restore();
  }

  // hair behind the skull: masses with a t-driven 1-2 segment lag
  function hairBack(g, d, C) {
    const t = C.t, hOut = d.hOut, hMid = d.hMid, hLt = d.hLt;
    if (d.hair === 'pony') {
      const s1 = Math.sin(t * 2.1) * 1.4, s2 = Math.sin(t * 2.1 - 0.7) * 2.4;
      g.strokeStyle = hOut; g.lineWidth = 6.4; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-d.hw + 1.5, -10);
      g.quadraticCurveTo(-d.hw - 4 + s1, -4, -d.hw - 5 + s1, 1);
      g.quadraticCurveTo(-d.hw - 6 + s2, 6, -d.hw - 4.5 + s2, 11);
      g.stroke();
      g.strokeStyle = hMid; g.lineWidth = 4.2;
      g.beginPath();
      g.moveTo(-d.hw + 1.5, -10);
      g.quadraticCurveTo(-d.hw - 4 + s1, -4, -d.hw - 5 + s1, 1);
      g.quadraticCurveTo(-d.hw - 6 + s2, 6, -d.hw - 4.5 + s2, 11);
      g.stroke();
      g.strokeStyle = hLt; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-d.hw - 0.5, -8.5);
      g.quadraticCurveTo(-d.hw - 4.6 + s1, -3, -d.hw - 5.4 + s1 * 0.8, 2);
      g.stroke();
    } else if (d.hair === 'big') {
      const bob = Math.sin(t * 1.7) * 0.5;
      g.fillStyle = hOut;
      for (let i = 0; i < PERM.length; i += 3) {
        g.beginPath(); g.arc(PERM[i], PERM[i + 1] + bob, PERM[i + 2] + 1.6, 0, 7); g.fill();
      }
      g.fillStyle = hMid;
      for (let i = 0; i < PERM.length; i += 3) {
        g.beginPath(); g.arc(PERM[i], PERM[i + 1] + bob, PERM[i + 2], 0, 7); g.fill();
      }
      g.fillStyle = hLt;
      g.beginPath(); g.arc(PERM[0] - 1, PERM[1] + bob - 1.5, 2, 0, 7); g.fill();
      g.beginPath(); g.arc(PERM[3] - 1.5, PERM[4] + bob - 2, 2.4, 0, 7); g.fill();
    } else if (d.hair === 'wild') {
      // hanging mane: strands sag mid-way and their tips drift on C.t
      g.lineCap = 'round';
      for (let i = 0; i < STRAND.length; i += 5) {
        const wob = Math.sin(t * 1.3 + STRAND[i + 4]) * 1.8;
        const mx2 = (STRAND[i] + STRAND[i + 2]) * 0.5 - 1;
        const my2 = (STRAND[i + 1] + STRAND[i + 3]) * 0.5 + 2.5;
        g.strokeStyle = hOut; g.lineWidth = 4.2;
        g.beginPath();
        g.moveTo(STRAND[i], STRAND[i + 1]);
        g.quadraticCurveTo(mx2, my2, STRAND[i + 2] + wob, STRAND[i + 3] + wob * 0.4);
        g.stroke();
        g.strokeStyle = hMid; g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(STRAND[i], STRAND[i + 1]);
        g.quadraticCurveTo(mx2, my2, STRAND[i + 2] + wob, STRAND[i + 3] + wob * 0.4);
        g.stroke();
      }
      g.strokeStyle = hLt; g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(-6, -13);
      g.quadraticCurveTo(-11, -8, -12, -3 + Math.sin(t * 1.3) * 1.2);
      g.stroke();
    } else if (d.hair === 'rollers') {
      // grey nape curls under the scarf
      g.fillStyle = hOut;
      g.beginPath(); g.arc(-d.hw + 0.5, 0.5, 4.4, 0, 7); g.fill();
      g.beginPath(); g.arc(-d.hw + 2, 4.5, 3.6, 0, 7); g.fill();
      g.fillStyle = hMid;
      g.beginPath(); g.arc(-d.hw + 0.5, 0.5, 3.2, 0, 7); g.fill();
      g.beginPath(); g.arc(-d.hw + 2, 4.5, 2.5, 0, 7); g.fill();
    } else if (d.plushEars) {
      g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 2.2;
      g.beginPath(); g.ellipse(-6.5, -16.5, 3.4, 4.6, -0.5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.hLt;
      g.beginPath(); g.ellipse(-6.8, -17, 1.6, 2.4, -0.5, 0, 7); g.fill();
    }
  }

  // hair over the skull
  function hairFront(g, d, C) {
    const hw = d.hw, t = C.t;
    const hOut = d.hOut, hMid = d.hMid, hLt = d.hLt;
    if (d.hair === 'short' || d.hair === 'pony' || d.hair === 'slick') {
      g.fillStyle = hOut;
      g.beginPath();
      g.moveTo(-hw - 1.2, -5);
      g.bezierCurveTo(-hw - 2.2, -13, -hw * 0.4, -18.4, hw * 0.35, -17.6);
      g.bezierCurveTo(hw + 1.0, -16.2, hw + 1.2, -13, hw + 0.7, -10.6);
      g.quadraticCurveTo(hw * 0.6, -13, hw * 0.1, -13.6);
      g.quadraticCurveTo(-hw * 0.4, -14.2, -hw + 1.4, -9.5);
      g.quadraticCurveTo(-hw * 0.9, -6.5, -hw - 1.2, -5);
      g.closePath();
      g.fill();
      g.fillStyle = hMid;
      g.beginPath();
      g.moveTo(-hw - 0.6, -5.6);
      g.bezierCurveTo(-hw - 1.6, -12.8, -hw * 0.4, -17.6, hw * 0.35, -16.9);
      g.bezierCurveTo(hw + 0.4, -15.7, hw + 0.5, -13.2, hw + 0.15, -11);
      g.quadraticCurveTo(hw * 0.55, -12.8, hw * 0.05, -13.3);
      g.quadraticCurveTo(-hw * 0.4, -13.9, -hw + 1.6, -9.3);
      g.quadraticCurveTo(-hw * 0.9, -6.8, -hw - 0.6, -5.6);
      g.closePath();
      g.fill();
      g.strokeStyle = hLt; g.lineWidth = 1.4; g.lineCap = 'round';
      g.beginPath(); g.arc(0.5, -10, hw * 0.78, 3.65, 4.55); g.stroke();
      if (d.hair === 'slick') {
        g.strokeStyle = SHEEN; g.lineWidth = 1.2;
        g.beginPath(); g.arc(0.5, -8, hw * 0.8, 3.8, 4.5); g.stroke();
      }
    } else if (d.hair === 'scruff') {
      g.fillStyle = hOut;
      g.beginPath(); g.arc(-hw * 0.55, -12.5, 4.6, 0, 7); g.fill();
      g.beginPath(); g.arc(0.5, -14.5, 5, 0, 7); g.fill();
      g.beginPath(); g.arc(hw * 0.6, -12, 4.4, 0, 7); g.fill();
      g.beginPath(); g.arc(-hw + 0.5, -7, 3.4, 0, 7); g.fill();
      g.beginPath(); g.arc(hw - 0.5, -8.5, 3.2, 0, 7); g.fill();
      g.fillStyle = hMid;
      g.beginPath(); g.arc(-hw * 0.55, -12.5, 3.5, 0, 7); g.fill();
      g.beginPath(); g.arc(0.5, -14.5, 3.9, 0, 7); g.fill();
      g.beginPath(); g.arc(hw * 0.6, -12, 3.3, 0, 7); g.fill();
      g.beginPath(); g.arc(-hw + 0.5, -7, 2.4, 0, 7); g.fill();
      g.beginPath(); g.arc(hw - 0.5, -8.5, 2.2, 0, 7); g.fill();
      g.fillStyle = hLt;
      g.beginPath(); g.arc(-hw * 0.6, -13.6, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(0.2, -15.8, 1.7, 0, 7); g.fill();
    } else if (d.hair === 'comb') {
      // thinning: scalp shows, side patch + strands combed over the top
      g.fillStyle = hMid; g.strokeStyle = hOut; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-hw - 1, -4);
      g.quadraticCurveTo(-hw - 2, -10.5, -hw * 0.55, -13.5);
      g.quadraticCurveTo(-hw * 0.5, -9, -hw * 0.55, -5);
      g.quadraticCurveTo(-hw * 0.8, -3.5, -hw - 1, -4);
      g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = hMid; g.lineWidth = 1.5; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-hw * 0.7, -13); g.quadraticCurveTo(0, -17.6, hw * 0.75, -13.5);
      g.moveTo(-hw * 0.65, -11.4); g.quadraticCurveTo(0, -15.6, hw * 0.7, -11.8);
      g.stroke();
      g.strokeStyle = hLt; g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(-hw * 0.6, -12.6); g.quadraticCurveTo(0, -16.6, hw * 0.6, -12.9);
      g.stroke();
    } else if (d.hair === 'big') {
      const bob = Math.sin(t * 1.7) * 0.5;
      g.fillStyle = hOut;
      g.beginPath(); g.arc(hw * 0.35, -13.5 + bob, 4.8, 0, 7); g.fill();
      g.beginPath(); g.arc(hw * 0.85, -9 + bob, 3.6, 0, 7); g.fill();
      g.fillStyle = hMid;
      g.beginPath(); g.arc(hw * 0.35, -13.5 + bob, 3.7, 0, 7); g.fill();
      g.beginPath(); g.arc(hw * 0.85, -9 + bob, 2.6, 0, 7); g.fill();
      g.fillStyle = hLt;
      g.beginPath(); g.arc(hw * 0.1, -15 + bob, 1.6, 0, 7); g.fill();
    } else if (d.hair === 'rollers') {
      // head scarf dome + knot, roller row peeking out the front
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(-hw - 1, -4.5);
      g.bezierCurveTo(-hw - 2.2, -14.5, -hw * 0.3, -19.8, hw * 0.4, -18);
      g.bezierCurveTo(hw + 1.2, -16.2, hw + 1.2, -11, hw + 0.4, -8);
      g.quadraticCurveTo(0, -11.5, -hw - 1, -4.5);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-2, -15.5, 4.4, 1.8, 0.25, 0, 7); g.fill();
      g.fillStyle = d.gDk; g.strokeStyle = d.gOut; g.lineWidth = 1.3;
      g.beginPath(); g.ellipse(hw * 0.55, -16.8, 2.6, 1.7, 0.5, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(hw * 0.9, -15, 1.7, 2.4, 0.2, 0, 7); g.fill(); g.stroke();
      g.fillStyle = ROLL_MID; g.strokeStyle = ROLL_OUT; g.lineWidth = 1.1;
      g.beginPath(); g.roundRect(hw * 0.25, -11.5, 5.2, 3.1, 1.5); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(hw * 0.05, -8.6, 4.6, 2.8, 1.4); g.fill(); g.stroke();
      g.fillStyle = ROLL_LT;
      g.fillRect(hw * 0.25 + 1, -11, 0.9, 2.2);
      g.fillRect(hw * 0.05 + 0.9, -8.2, 0.8, 2);
    } else if (d.hair === 'wild') {
      // front wisps falling over the brow
      g.strokeStyle = d.hMid; g.lineWidth = 1.8; g.lineCap = 'round';
      const wob = Math.sin(t * 1.3) * 1.2;
      g.beginPath();
      g.moveTo(1, -16.5); g.quadraticCurveTo(5 + wob, -13, 4.4 + wob, -9.5);
      g.moveTo(-2, -17); g.quadraticCurveTo(-5 - wob, -13.5, -4.6 - wob, -10);
      g.stroke();
      g.fillStyle = d.hMid;
      g.beginPath(); g.arc(0, -16.6, 3.2, 0, 7); g.fill();
      g.fillStyle = d.hLt;
      g.beginPath(); g.arc(-0.8, -17.2, 1.6, 0, 7); g.fill();
    }
  }

  function drawHeadGear(g, d, C, e) {
    const hw = d.hw, t = C.t;
    if (d.band) { // sweatband with a knotted tail flicking off the back
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-hw - 1.1, -6.5);
      g.quadraticCurveTo(0, -12.6, hw + 0.9, -7.5);
      g.lineTo(hw + 0.8, -10);
      g.quadraticCurveTo(0, -15.4, -hw - 1.2, -9.2);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-hw * 0.4, -10.3, 2.6, 0.9, 0.3, 0, 7); g.fill();
      const fl = Math.sin(t * 2.3) * 1.6;
      g.strokeStyle = d.gMid; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-hw - 0.8, -7.5);
      g.quadraticCurveTo(-hw - 4, -6 + fl * 0.4, -hw - 5.5, -2.5 + fl);
      g.stroke();
    }
    if (d.glasses) { // reading glasses, slid down the nose
      g.strokeStyle = GLASSR; g.lineWidth = 1.2;
      g.fillStyle = GLASSF;
      g.beginPath(); g.arc(hw * 0.48, -4.6, 3, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(-hw * 0.12, -4.9, 2.8, 0, 7); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(hw * 0.48 - 3, -5.2); g.lineTo(-hw * 0.12 + 2.8, -5.4);
      g.moveTo(-hw * 0.12 - 2.8, -5.5); g.lineTo(-hw * 0.8, -6.5);
      g.stroke();
      g.strokeStyle = SHEEN; g.lineWidth = 1;
      g.beginPath(); g.arc(hw * 0.48, -4.6, 1.9, 3.5, 4.4); g.stroke();
    }
    if (d.hoops) { // gold hoop swinging under the ear
      const sw = Math.sin(t * 1.9) * 0.8;
      g.strokeStyle = HOOP_OUT; g.lineWidth = 2.2;
      g.beginPath(); g.arc(-hw * 0.52 + sw * 0.4, 3.6, 2.6, 0, 7); g.stroke();
      g.strokeStyle = HOOP; g.lineWidth = 1.1;
      g.beginPath(); g.arc(-hw * 0.52 + sw * 0.4, 3.6, 2.6, 0, 7); g.stroke();
      g.strokeStyle = HOOP_HI; g.lineWidth = 0.7;
      g.beginPath(); g.arc(-hw * 0.52 + sw * 0.4, 3.6, 2.6, 3.4, 4.4); g.stroke();
    }
    if (d.horns) {
      g.fillStyle = HORN; g.strokeStyle = HORN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(3, -15.5); g.quadraticCurveTo(7.5, -19.5, 5.2, -22.5);
      g.quadraticCurveTo(4.6, -19.5, 0.8, -16.8);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(-5, -15); g.quadraticCurveTo(-9, -18.5, -7.4, -21.5);
      g.quadraticCurveTo(-6.6, -18.5, -2.8, -16.5);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = HORN_LT;
      g.beginPath(); g.ellipse(5, -20.5, 0.8, 1.6, 0.4, 0, 7); g.fill();
    }
    if (d.plushEars) {
      g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 2.2;
      g.beginPath(); g.ellipse(-1.5, -18, 3.6, 4.8, 0.25, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.hLt;
      g.beginPath(); g.ellipse(-1.8, -18.4, 1.8, 2.6, 0.25, 0, 7); g.fill();
    }
    if (d.heatRage && e.fl >= 1) { // heat shimmer rising off the skull sides
      g.lineCap = 'round';
      for (let i = 0; i < HEATP.length; i += 3) {
        const bx = HEATP[i] * (d.hw + 1.4);
        const by = HEATP[i + 1];
        const wob = Math.sin(t * 3.4 + HEATP[i + 2]) * 0.9;
        g.strokeStyle = HEAT_A; g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(bx, by);
        g.bezierCurveTo(bx + wob, by - 1.4, bx - wob, by - 2.6, bx + wob * 0.4, by - 4);
        g.stroke();
        g.strokeStyle = HEAT_B; g.lineWidth = 0.6;
        g.beginPath();
        g.moveTo(bx + wob * 0.4, by - 4.3);
        g.bezierCurveTo(bx - wob * 0.6, by - 5.4, bx + wob * 0.6, by - 6.2, bx, by - 7.2);
        g.stroke();
      }
    }
  }

  function drawHead(g, J, C, d, e) {
    const s = C.scale, f = C.facing;
    const open = Math.min(1, (C.talk || 0) * 0.95 + e.mo * 0.5);
    const drop = open * 2.3 * (d.gapeK || 1);
    const hw = d.hw;
    g.save();
    g.translate(J.headBaseX, J.headBaseY);
    g.scale(f * s, s);
    g.rotate(J.headAng * f);
    if (d.aura) { // the ghast's wrong-colored halo: one soft pale wash
      g.fillStyle = AURA_1;
      g.beginPath(); g.ellipse(0, -7, hw + 9, hw + 12, 0, 0, 7); g.fill();
    }
    hairBack(g, d, C);
    // skull base + form shading
    headPath(g, d, drop);
    g.fillStyle = d.sMid;
    g.fill();
    g.save();
    headPath(g, d, drop);
    g.clip();
    g.fillStyle = SHADE; // form shadow: back-lower mass
    g.beginPath(); g.ellipse(-hw * 0.42, d.chin * 0.3, hw * 0.85, hw * 1.05, 0.25, 0, 7); g.fill();
    g.fillStyle = JAWSH; // under-jaw
    g.beginPath(); g.ellipse(hw * 0.1, d.chin + drop * 0.8, hw * 0.75, 2.4, 0, 0, 7); g.fill();
    g.fillStyle = d.sLt; // brow ridge catching the key
    g.beginPath(); g.ellipse(hw * 0.28, -8.6, hw * 0.6, 2.6, -0.15, 0, 7); g.fill();
    if (d.jowl) {
      g.fillStyle = JAWSH;
      g.beginPath(); g.ellipse(hw * 0.45, d.chin - 2 + drop * 0.6, 2.6, 2.1, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(-hw * 0.3, d.chin - 1.6 + drop * 0.5, 2.9, 2.3, 0, 0, 7); g.fill();
    }
    if (d.hollow) {
      g.fillStyle = HOLLOW;
      g.beginPath(); g.ellipse(hw * 0.35, -0.5, 1.9, 3.2, 0.35, 0, 7); g.fill();
      g.beginPath(); g.ellipse(-hw * 0.25, -0.2, 2.2, 3.4, -0.2, 0, 7); g.fill();
    }
    if (d.stubble) {
      g.fillStyle = STUB;
      g.beginPath();
      g.moveTo(-hw * 0.7, d.chin - 3.5);
      g.quadraticCurveTo(0, d.chin + 2.5 + drop, hw * 0.75, d.chin - 3 + drop * 0.6);
      g.lineTo(hw * 0.8, 0.5); g.quadraticCurveTo(0, 2.5, -hw * 0.72, 0.5);
      g.closePath(); g.fill();
    }
    if (d.patchy) {
      g.fillStyle = STUB;
      g.beginPath(); g.ellipse(hw * 0.35, d.chin - 1 + drop * 0.7, 2.6, 1.7, 0.2, 0, 7); g.fill();
      g.beginPath(); g.ellipse(-hw * 0.35, d.chin - 2, 2.2, 1.5, -0.2, 0, 7); g.fill();
      g.beginPath(); g.ellipse(hw * 0.55, 0.6, 1.6, 1.1, 0.3, 0, 7); g.fill();
    }
    const flAmt = e.fl + (d.baseFlush ? 0.4 : 0);
    if (flAmt > 0) {
      g.fillStyle = flAmt > 0.6 ? FLUSH2 : FLUSH1;
      g.fillRect(-hw - 2, -18, hw * 2 + 4, d.chin + 22);
      g.fillStyle = FLUSH1;
      g.beginPath(); g.ellipse(hw * 0.35, -1, 2.8, 1.8, 0, 0, 7); g.fill();
    }
    if (d.blushC) {
      g.fillStyle = BLUSH;
      g.beginPath(); g.ellipse(hw * 0.42, -0.6, 2.2, 1.3, 0.2, 0, 7); g.fill();
      g.beginPath(); g.ellipse(-hw * 0.3, -0.6, 2, 1.2, -0.2, 0, 7); g.fill();
    }
    g.restore();
    headPath(g, d, drop);
    g.strokeStyle = d.sOut; g.lineWidth = 1.8;
    g.stroke();
    // ear, seated well back on the jaw hinge
    if (!d.muzzle) {
      g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 1.1;
      g.beginPath(); g.ellipse(-hw * 0.8, -2.6, 1.35, 2.1, -0.12, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = d.sOut; g.lineWidth = 0.7;
      g.beginPath(); g.arc(-hw * 0.8, -2.5, 0.8, 3.6, 5.4); g.stroke();
    }
    if (d.muzzle) { // pet monster: plush muzzle carries nose + mouth
      g.fillStyle = d.muzM; g.strokeStyle = d.muzO; g.lineWidth = 1.8;
      g.beginPath(); g.ellipse(hw * 0.5, 0.3 + drop * 0.4, hw * 0.62, 4.4 + drop * 0.5, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.muzL;
      g.beginPath(); g.ellipse(hw * 0.38, -1 + drop * 0.3, 2.6, 1.7, -0.2, 0, 7); g.fill();
      g.fillStyle = INK;
      g.beginPath(); g.ellipse(hw * 0.92, -1.6, 1.9, 1.4, 0.15, 0, 7); g.fill();
      drawMouthC(g, d, e, C, open, drop);
    } else {
      // nose wedge riding the front edge
      g.fillStyle = d.sMid; g.strokeStyle = d.sOut; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(hw * 0.88, -3.6);
      g.quadraticCurveTo(hw + d.noseK + 0.4, -2.6, hw * 0.98 + d.noseK * 0.7, -1.2);
      g.quadraticCurveTo(hw * 0.9, -0.6, hw * 0.86, -0.7);
      g.fill(); g.stroke();
      g.fillStyle = d.sDk;
      g.beginPath(); g.ellipse(hw * 0.94 + d.noseK * 0.4, -1.1, d.noseK * 0.5 + 0.7, 0.6, 0.2, 0, 7); g.fill();
      if (d.nostril) {
        g.fillStyle = d.sOut;
        g.beginPath(); g.ellipse(hw * 0.9 + d.noseK * 0.3, -1.3, 0.7, 0.45, 0.3, 0, 7); g.fill();
      }
      drawMouthC(g, d, e, C, open, drop);
    }
    // eyes: near (forward) full size, far smaller — a cheated 3/4 read
    const eyY = -5.2 + (d.eyeY || 0);
    if (!d.muzzle) {
      drawEyeC(g, d, e, C, -hw * 0.16, eyY - 0.35, 0.62);
      drawBrowC(g, d, e, -hw * 0.16, eyY - 0.35, 0.62);
    }
    drawEyeC(g, d, e, C, hw * 0.55, eyY, 1);
    drawBrowC(g, d, e, hw * 0.55, eyY, 1);
    hairFront(g, d, C);
    drawHeadGear(g, d, C, e);
    g.restore();
  }

  /* ============================== actor =============================== */
  function drawActor(g, J, C, d) {
    let e = EXPR[C.expr] || EXPR.neutral;
    if (C.hurt) e = EXPR.hurt;
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    drawArm(g, J, C, d, 'B');
    drawLeg(g, J, C, d, 'B');
    torso(g, J, C, d);
    drawLeg(g, J, C, d, 'F');
    if (d.hemLen) hem(g, J, C, d);
    drawHead(g, J, C, d, e);
    drawArm(g, J, C, d, 'F');
    if (d.hearts) { // lovestruck hearts bobbing off the suitor
      const s = C.scale, t = C.t;
      const bx = J.crownX, by = J.crownY - 6 * s + Math.sin(t * 2.6) * 1.5 * s;
      g.fillStyle = HEART;
      g.beginPath();
      g.moveTo(bx, by + 2.4 * s);
      g.quadraticCurveTo(bx - 3 * s, by, bx - 2 * s, by - 1.4 * s);
      g.quadraticCurveTo(bx - s, by - 2.8 * s, bx, by - 1 * s);
      g.quadraticCurveTo(bx + s, by - 2.8 * s, bx + 2 * s, by - 1.4 * s);
      g.quadraticCurveTo(bx + 3 * s, by, bx, by + 2.4 * s);
      g.closePath(); g.fill();
      g.fillStyle = HEART_HI;
      g.beginPath(); g.arc(bx - 0.9 * s, by - 1.2 * s, 0.6 * s, 0, 7); g.fill();
    }
    g.restore();
  }

  /* ======================== the cast (specs) ==========================
     Palettes lifted straight from each character's faces.js design and
     the campaign skin ramps, so scene actors read as the SAME people. */
  const CC = {};

  // TODD — red tracksuit, headband, worried default
  CC.todd = {
    sOut: '#7a5546', sDk: '#c08d63', sMid: '#e8b58a', sLt: '#f2caa6',
    hOut: '#2a1218', hMid: '#4b1e1f', hLt: '#7a4a42', hair: 'short',
    tOut: '#68293a', tDk: '#aa3e42', tMid: '#e8524a', tLt: '#ee8073',
    pOut: '#68293a', pDk: '#aa3e42', pMid: '#e8524a', pLt: '#ee8073',
    shOut: '#4c4f44', shDk: '#a8aa9c', shMid: '#d8dacc', shLt: '#eeeae0',
    acc: '#f7c2c0', acc2: '#f7c2c0', stripe: 1, zip: 1,
    gOut: '#68293a', gMid: '#e8524a', gLt: '#ee8073', band: 1,
    sleeves: 'long', legs: 'pants',
    hw: 9, chin: 3.8, ew: 2.5, eh: 1.9, bw: 1.5,
    ir: '#5b3a22', irD: '#2c1a0c', browC: '#3a161a', lipD: '#7a3438',
    noseK: 1.1, stubble: 1, biBias: -3, mcBias: -0.06,
    armW: 6.8, thighW: 8.6, hipW: 8.2, chestW: 9.2,
  };

  // DAMON — white undershirt, pajama pants, the gut, thinning comb-over
  CC.damon = {
    sOut: '#71401f', sDk: '#a8703f', sMid: '#d69d6c', sLt: '#e3b78e',
    hOut: '#2c2320', hMid: '#655648', hLt: '#8e8070', hair: 'comb',
    tOut: '#8f897a', tDk: '#c2bcac', tMid: '#e9e4d8', tLt: '#fbf8f0',
    pOut: '#45202a', pDk: '#6e3340', pMid: '#8f4656', pLt: '#a86470',
    shOut: '#3a3630', shDk: '#5c564c', shMid: '#7a7264', shLt: '#948a7a',
    sleeves: 'none', legs: 'pants', strap: 1, gut: 1.1, jowl: 1,
    hemLen: 6, hemW: 10.6, tatter: 0, hemFlare: 0.12,
    hOut2: '#8f897a', hDk2: '#c2bcac', hMid2: '#e9e4d8', hLt2: '#fbf8f0',
    hw: 9.8, chin: 4.4, ew: 2.4, eh: 1.7, bw: 1.9,
    ir: '#ff6a2a', irD: '#a83208', browC: '#4a3a2a', lipD: '#6e2f32',
    noseK: 1.9, nostril: 1, stubble: 1, baseFlush: 1, heatRage: 1,
    armW: 7.6, thighW: 9.4, hipW: 9.6, chestW: 10.4,
  };

  // JOSH — band tee, lanky
  CC.josh = {
    sOut: '#8a5030', sDk: '#c07f4f', sMid: '#e8b083', sLt: '#f0c69e',
    hOut: '#241609', hMid: '#57391d', hLt: '#866648', hair: 'scruff',
    tOut: '#141220', tDk: '#221f2e', tMid: '#2f2b3c', tLt: '#4a4458',
    pOut: '#1c2536', pDk: '#2c3a55', pMid: '#3d5273', pLt: '#56688a',
    shOut: '#2a1812', shDk: '#4d2c1e', shMid: '#6e4430', shLt: '#8a5c42',
    acc: '#ffd24a', bolt: 1,
    sleeves: 'short', legs: 'pants',
    hw: 8.4, chin: 4.2, ew: 2.5, eh: 1.8, bw: 1.3,
    ir: '#3a2a18', irD: '#1a1208', browC: '#33210f', lipD: '#78383a',
    noseK: 1.0, stubble: 1,
    armW: 5.6, thighW: 7.2, hipW: 7, chestW: 7.8,
  };

  // SONYA — pink gi, ponytail
  CC.sonya = {
    sOut: '#7b5a50', sDk: '#c4906f', sMid: '#eeba90', sLt: '#f5cfaa',
    hOut: '#2a1020', hMid: '#4b1b34', hLt: '#7c4a5c', hair: 'pony',
    tOut: '#682655', tDk: '#aa3975', tMid: '#e84a92', tLt: '#ee7aa7',
    pOut: '#8a5a68', pDk: '#d8a8b8', pMid: '#f2d4dc', pLt: '#fae8ec',
    shOut: '#4c4f44', shDk: '#a8aa9c', shMid: '#d8dacc', shLt: '#eeeae0',
    gi: 1, beltC: '#7a1c46',
    sleeves: 'long', legs: 'pants',
    hw: 8.6, chin: 3.6, ew: 2.6, eh: 2.05, bw: 1.0,
    ir: '#4a6b52', irD: '#22331f', browC: '#3a1428', lipD: '#8a3448',
    lipC: 'rgba(204,106,128,0.55)', noseK: 0.9, lash: 1,
    armW: 6, thighW: 7.6, hipW: 7.4, chestW: 8.2,
  };

  // HEATH — skull tee, cargo shorts, smug by default
  CC.heath = {
    sOut: '#7b5a50', sDk: '#c4906f', sMid: '#eeba90', sLt: '#f5cfaa',
    hOut: '#3c2b0e', hMid: '#95722e', hLt: '#bd9848', hair: 'scruff',
    tOut: '#160f16', tDk: '#241a24', tMid: '#332633', tLt: '#4c3a4c',
    pOut: '#4f4426', pDk: '#77683c', pMid: '#9c8a52', pLt: '#bcaa70',
    shOut: '#4c4f44', shDk: '#a8aa9c', shMid: '#d8dacc', shLt: '#eeeae0',
    acc: '#e8e0d0', skull: 1, sock: '#eeeae0',
    sleeves: 'short', legs: 'shorts',
    hw: 8.8, chin: 4, ew: 2.4, eh: 1.75, bw: 1.4,
    ir: '#4a6b52', irD: '#22331f', browC: '#3a2617', lipD: '#78383a',
    noseK: 1.05, patchy: 1, lidBias: 0.14, mcBias: 0.18,
    armW: 6.2, thighW: 7.8, hipW: 7.6, chestW: 8.6,
  };

  // YVONNE — towering perm, hoops, plum bodice + skirt
  CC.yvonne = {
    sOut: '#7c452c', sDk: '#b5744a', sMid: '#e2a678', sLt: '#f5cba2',
    hOut: '#38160e', hMid: '#7c3316', hLt: '#a04a20', hair: 'big',
    tOut: '#4a1240', tDk: '#6f1e5e', tMid: '#992e80', tLt: '#c050a2', tHi: '#e084c6',
    pOut: '#17131f', pDk: '#2c2438', pMid: '#453a54', pLt: '#5c4e6e',
    shOut: '#4f0e14', shDk: '#8e1c26', shMid: '#c23440', shLt: '#e05570',
    bodice: 1, hoops: 1,
    hemLen: 27, hemW: 9.6, tatter: 0,
    hOut2: '#4a1240', hDk2: '#6f1e5e', hMid2: '#992e80', hLt2: '#c050a2',
    sleeves: 'none', legs: 'pants',
    hw: 8.6, chin: 3.6, ew: 2.6, eh: 2.1, bw: 0.9,
    ir: '#4a6b52', irD: '#22331f', browC: '#38160e', lipD: '#8e1c34',
    lipC: 'rgba(212,52,80,0.72)', noseK: 0.9, lash: 1, lidBias: 0.12, mcBias: 0.12,
    armW: 5.8, thighW: 7.4, hipW: 7.8, chestW: 8.4,
  };

  // COLLETTE (calm) — floral blouse, housecoat, rollers, reading glasses
  CC.collettecalm = {
    sOut: '#7b5a50', sDk: '#c4906f', sMid: '#eeba90', sLt: '#f5cfaa',
    hOut: '#2e2c34', hMid: '#6e6c78', hLt: '#a2a0ac', hair: 'rollers',
    tOut: '#5c2f44', tDk: '#94506c', tMid: '#c4728e', tLt: '#d898ab',
    pOut: '#8a5a68', pDk: '#d8a8b8', pMid: '#f2d4dc', pLt: '#fae8ec',
    shOut: '#7a3050', shDk: '#c46a8e', shMid: '#e87ba4', shLt: '#f5adc6',
    acc: '#f2d0da', floret: 1, glasses: 1, jowl: 1,
    gOut: '#433464', gDk: '#6b559c', gMid: '#8f77c4', gLt: '#b3a0dc',
    hemLen: 22, hemW: 9.8, tatter: 0,
    hOut2: '#5c2f44', hDk2: '#94506c', hMid2: '#c4728e', hLt2: '#d898ab',
    sleeves: 'long', legs: 'pants',
    hw: 8.8, chin: 3.6, ew: 2.4, eh: 1.8, bw: 1.6,
    ir: '#4a6b52', irD: '#22331f', browC: '#4a4852', lipD: '#784046',
    noseK: 0.95, mcBias: -0.1,
    armW: 6.2, thighW: 7.8, hipW: 8.2, chestW: 8.8,
  };

  // COLLETTE (ghast) — ashen, gaunt, talons, tattered gown, glow eyes
  CC.colletteghast = {
    sOut: '#232b3c', sDk: '#5c6876', sMid: '#8b98a3', sLt: '#b0bdc7',
    hOut: '#6e7890', hMid: '#dde4ee', hLt: '#ffffff', hair: 'wild',
    tOut: '#3c3358', tDk: '#5f5480', tMid: '#8478a5', tLt: '#a89dc6',
    pOut: '#232b3c', pDk: '#5c6876', pMid: '#8b98a3', pLt: '#b0bdc7',
    shOut: '#232b3c', shDk: '#5c6876', shMid: '#8b98a3', shLt: '#b0bdc7',
    talons: 1, aura: 1, hollow: 1, fangs: 1, glowE: 1,
    hemLen: 24, hemW: 9.4, tatter: 1,
    hOut2: '#3c3358', hDk2: '#5f5480', hMid2: '#8478a5', hLt2: '#a89dc6',
    sleeves: 'long', legs: 'skin',
    hw: 8.8, chin: 4.6, ew: 2.8, eh: 2.2, bw: 1.2,
    ir: '#c8ffe4', irD: '#5f8577', browC: '#eef1f7', lipD: '#241826',
    pupil: 0.4, gapeK: 1.9, noseK: 0.7, lidBias: -0.06, sockC: HOLLOW,
    armW: 5.2, thighW: 6.6, hipW: 7, chestW: 7.8,
  };

  // PET MONSTER — plush blue-violet fur, shackled
  CC.petmonster = {
    sOut: '#241a42', sDk: '#4f3e81', sMid: '#6552a4', sLt: '#8a76c6',
    hOut: '#241a42', hMid: '#6552a4', hLt: '#a996dd', hair: 'none',
    tOut: '#241a42', tDk: '#3f2f6b', tMid: '#4f3e81', tLt: '#7a68b4',
    pOut: '#241a42', pDk: '#3f2f6b', pMid: '#4f3e81', pLt: '#7a68b4',
    shOut: '#241a42', shDk: '#3f2f6b', shMid: '#4f3e81', shLt: '#7a68b4',
    plush: 1, shackles: 1, muzzle: 1, horns: 1, plushEars: 1,
    collarBand: '#ff7d1c',
    muzO: '#9c8455', muzM: '#f2e3bf', muzL: '#fff7e2',
    sleeves: 'none', legs: 'skin',
    hw: 9.6, chin: 3.2, ew: 3.1, eh: 2.6, bw: 1.4,
    ir: '#3f2f6b', irD: '#1a1230', browC: '#241a42', lipD: '#3d1526',
    noseK: 0, eyeY: -1,
    armW: 6.6, thighW: 8, hipW: 8.6, chestW: 9.4,
  };

  // SUITOR — bow tie, heart eyes, bouquet
  CC.suitor = {
    sOut: '#8a5236', sDk: '#c58255', sMid: '#eab388', sLt: '#fad4ae',
    hOut: '#190f0c', hMid: '#31201a', hLt: '#7d5a42', hair: 'slick',
    tOut: '#242e50', tDk: '#39476e', tMid: '#526397', tLt: '#7a8cc0',
    pOut: '#241d30', pDk: '#3a3049', pMid: '#524668', pLt: '#6f6288',
    shOut: '#2a1812', shDk: '#4d2c1e', shMid: '#6e4430', shLt: '#8a5c42',
    bowtie: 1, bouquet: 1, hearts: 1, heartEyes: 1, blushC: 1,
    sleeves: 'long', legs: 'pants',
    hw: 8.6, chin: 3.9, ew: 2.6, eh: 2, bw: 1.0,
    ir: '#3f5a74', irD: '#1c2a38', browC: '#190f0c', lipD: '#78383a',
    noseK: 1.0,
    armW: 6, thighW: 7.6, hipW: 7.4, chestW: 8.2,
  };

  /* =========================== registration =========================== */
  function bind(d) {
    return function (g, J, C) { drawActor(g, J, C, d); };
  }
  for (const id in CC) CAST[id] = bind(CC[id]);
})();
