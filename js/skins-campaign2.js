// skins-campaign2.js — Campaign Chapter 2 cast: Sonya's side of the family.
// The suitor swarm (Yvonne's admirers), Heath the fart-cannon brother, JR's
// camper van, Yvonne the kiss-blowing sub-boss, and Collette the mom — calm
// cutscene form and the ghastly final-boss form. Registered into
// window.ENEMY_BODIES / window.BOSS_BODIES; drawn in the local frame from
// game.js (feet at 0,0, y negative up, +x toward the player). Caller owns the
// transform, ground shadow and flash/frozen overlays.
// Flat fills only — no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // shared two-tone limb strokes: outline pass, then fill pass
  function seg(g, x1, y1, x2, y2, w, out, fill) {
    g.strokeStyle = out; g.lineWidth = w + 2.6;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = fill; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  function seg2(g, x1, y1, x2, y2, x3, y3, w, out, fill) {
    g.strokeStyle = out; g.lineWidth = w + 2.6;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.stroke();
    g.strokeStyle = fill; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.stroke();
  }

  // ---- SUITOR: lovestruck admirer with a bouquet ----
  const SU_SKIN_OUT = '#8a5236', SU_SKIN_DK = '#c58255', SU_SKIN_MID = '#eab388', SU_SKIN_LT = '#fad4ae';
  const SU_HAIR_OUT = '#190f0c', SU_HAIR_MID = '#31201a', SU_HAIR_HI = '#7d5a42';
  const SU_HAIR2_OUT = '#5c3a10', SU_HAIR2_MID = '#8a5c1c', SU_HAIR2_HI = '#dcae54';
  const SU_SH_OUT = '#242e50', SU_SH_DK = '#39476e', SU_SH_MID = '#526397', SU_SH_LT = '#7a8cc0';
  const SU_SH2_OUT = '#451529', SU_SH2_DK = '#66233e', SU_SH2_MID = '#8c3457', SU_SH2_LT = '#b25a7d';
  const SU_PANT_OUT = '#241d30', SU_PANT_DK = '#3a3049', SU_PANT_MID = '#524668', SU_PANT_LT = '#6f6288';
  const SU_SHOE_OUT = '#2a1812', SU_SHOE_MID = '#4d2c1e', SU_SHOE_LT = '#6e4430';
  const SU_TIE = '#c22743', SU_TIE_DK = '#8a1a2e';
  const SU_WRAP_OUT = '#8f7648', SU_WRAP_DK = '#c2ab78', SU_WRAP_MID = '#e2cf9e', SU_WRAP_LT = '#f6ecc8';
  const SU_STEM = '#3f6b34', SU_LEAF = '#5c8a48';
  const SU_RO_OUT = '#571326', SU_RO_DK = '#8a2040', SU_RO_MID = '#c22750', SU_RO_LT = '#e05570';
  const SU_HEART = '#ff5d8a', SU_HEART_HI = '#ffc2d6';
  const SU_MOUTH = '#5c2a20';
  const SU_BLUSH = 'rgba(240,110,120,0.35)';
  const SU_SCENT_A = 'rgba(198,168,224,0.32)', SU_SCENT_B = 'rgba(198,168,224,0.16)';
  // cologne wisps: x, baseY, phase
  const SU_SCENT_PTS = [-9, -30, 0, 12, -33, 2.1, 1, -50, 4.0];
  // strike petals: dx, dy, rx, ry, rot
  const SU_PET = [
    3, -6, 2.2, 1.2, 0.5,
    8, -2, 2.0, 1.1, 1.2,
    6, -11, 1.8, 1.0, -0.6,
    12, -6, 2.2, 1.2, 2.2,
    11, -12, 1.7, 0.9, 0.9,
  ];

  function suHeart(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s);
    g.quadraticCurveTo(x - s * 1.25, y + s * 0.15, x - s * 0.85, y - s * 0.5);
    g.quadraticCurveTo(x - s * 0.5, y - s * 1.05, x, y - s * 0.35);
    g.quadraticCurveTo(x + s * 0.5, y - s * 1.05, x + s * 0.85, y - s * 0.5);
    g.quadraticCurveTo(x + s * 1.25, y + s * 0.15, x, y + s);
    g.closePath(); g.fill();
  }

  function suRose(g, x, y, r) {
    g.fillStyle = SU_RO_MID; g.strokeStyle = SU_RO_OUT; g.lineWidth = 1.3;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = SU_RO_LT;
    g.beginPath(); g.arc(x - r * 0.32, y - r * 0.36, r * 0.45, 0, 7); g.fill();
    g.strokeStyle = SU_RO_DK; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r * 0.55, 1.2, 5.6); g.stroke();
    g.beginPath(); g.arc(x + r * 0.12, y + r * 0.12, r * 0.24, 3.4, 7.6); g.stroke();
  }

  // wrapped cone held with roses up at ang 0
  function suBouquet(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.strokeStyle = SU_STEM; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-1, -6); g.lineTo(-3.4, -12);
    g.moveTo(0, -6); g.lineTo(0.4, -13);
    g.moveTo(1, -6); g.lineTo(3.8, -11.5);
    g.stroke();
    g.fillStyle = SU_WRAP_MID; g.strokeStyle = SU_WRAP_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-4.8, -8); g.lineTo(4.8, -8); g.lineTo(1.6, 2.5); g.lineTo(-1.6, 2.5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = SU_WRAP_LT;
    g.beginPath(); g.moveTo(-4.8, -8); g.lineTo(-1, -8); g.lineTo(-1.4, 2.3); g.closePath(); g.fill();
    g.fillStyle = SU_WRAP_DK;
    g.beginPath(); g.moveTo(4.8, -8); g.lineTo(2.9, -8); g.lineTo(1.6, 2.5); g.closePath(); g.fill();
    g.fillStyle = SU_LEAF;
    g.beginPath(); g.ellipse(-5.2, -10.5, 2.4, 1.2, -0.7, 0, 7); g.fill();
    g.beginPath(); g.ellipse(5.4, -10, 2.2, 1.1, 0.6, 0, 7); g.fill();
    suRose(g, -3.8, -13.5, 3);
    suRose(g, 4, -12.8, 2.8);
    suRose(g, 0.2, -15.8, 3.4);
    g.restore();
  }

  B.suitor = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const step = Math.sin(a.walkCyc);
    const bob = a.moving ? Math.abs(step) * 2 : Math.sin(t * 1.8) * 0.8;
    let tilt = a.moving ? step * 0.05 : Math.sin(t * 1.3) * 0.03; // lovesick sway
    if (windup) tilt = -0.16;
    else if (strike) tilt = 0.2;
    if (a.hurt) tilt = -0.22;
    const el = a.elite === true;
    const hairOut = el ? SU_HAIR2_OUT : SU_HAIR_OUT;
    const hairMid = el ? SU_HAIR2_MID : SU_HAIR_MID;
    const hairHi = el ? SU_HAIR2_HI : SU_HAIR_HI;
    const shOut = el ? SU_SH2_OUT : SU_SH_OUT;
    const shDk = el ? SU_SH2_DK : SU_SH_DK;
    const shMid = el ? SU_SH2_MID : SU_SH_MID;
    const shLt = el ? SU_SH2_LT : SU_SH_LT;

    // 1 cologne wisps, wobbling behind everything
    g.lineWidth = 1.1;
    for (let i = 0; i < 9; i += 3) {
      const sx = SU_SCENT_PTS[i], sy = SU_SCENT_PTS[i + 1];
      const wob = Math.sin(t * 2.4 + SU_SCENT_PTS[i + 2]) * 2.2;
      g.strokeStyle = SU_SCENT_A;
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(sx + wob, sy - 5, sx - wob, sy - 10);
      g.stroke();
      g.strokeStyle = SU_SCENT_B;
      g.beginPath();
      g.moveTo(sx - wob, sy - 10);
      g.quadraticCurveTo(sx + wob, sy - 15, sx - wob * 0.6, sy - 19);
      g.stroke();
    }

    // 2 dress shoes + slacks (feet planted)
    const fx = a.moving ? step * 5 : 0;
    const flift = a.moving ? Math.max(0, step) * 3 : 0;
    const blift = a.moving ? Math.max(0, -step) * 3 : 0;
    g.fillStyle = SU_SHOE_MID; g.strokeStyle = SU_SHOE_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-11 - fx, -5 - blift, 11, 5, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(1 + fx, -5 - flift, 12, 5, 2); g.fill(); g.stroke();
    g.fillStyle = SU_SHOE_LT;
    g.beginPath(); g.ellipse(-3 - fx, -3.6 - blift, 2.4, 1.2, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(10 + fx, -3.6 - flift, 2.6, 1.2, 0, 0, 7); g.fill();
    seg(g, -4, -20, -5 - fx, -4 - blift, 6.5, SU_PANT_OUT, SU_PANT_DK);
    seg(g, 4, -20, 5 + fx, -4 - flift, 6.5, SU_PANT_OUT, SU_PANT_MID);
    g.strokeStyle = SU_PANT_LT; g.lineWidth = 1.2; // front crease
    g.beginPath(); g.moveTo(3, -19); g.lineTo(4 + fx, -6 - flift); g.stroke();

    g.translate(0, -bob);
    g.translate(0, -20); g.rotate(tilt); g.translate(0, 20);

    // 3 hips + belt
    g.fillStyle = SU_PANT_MID; g.strokeStyle = SU_PANT_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-8, -24, 16, 6, 2); g.fill(); g.stroke();
    g.fillStyle = SU_PANT_OUT; g.fillRect(-8, -24, 16, 1.8);

    // 4 back arm pose
    let bhx = -10, bhy = -25;
    if (windup) { bhx = 13; bhy = -30; }
    else if (strike) { bhx = -13; bhy = -22; }
    else if (a.hurt) { bhx = -12, bhy = -30; }
    else if (a.moving) { bhx = -10 + step * 3; bhy = -25; }
    else { bhx = 9; bhy = -22; } // idle: clasped near the bouquet
    seg2(g, -7, -31, -10, -27, bhx, bhy, 4.6, shOut, shDk);
    g.fillStyle = SU_SKIN_DK; g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(bhx, bhy, 2.4, 0, 7); g.fill(); g.stroke();

    // 5 shirt torso
    g.fillStyle = shMid; g.strokeStyle = shOut; g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-8, -22);
    g.lineTo(-9, -31);
    g.quadraticCurveTo(-9.5, -34.5, -5, -35);
    g.lineTo(6, -35);
    g.quadraticCurveTo(10.5, -34.5, 10, -31);
    g.lineTo(9, -22);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shLt; // top-left key
    g.beginPath();
    g.moveTo(-8, -23); g.lineTo(-8.8, -31);
    g.quadraticCurveTo(-9.3, -34.4, -5, -35);
    g.lineTo(-2.4, -35); g.lineTo(-3.6, -23);
    g.closePath(); g.fill();
    g.fillStyle = shDk;
    g.beginPath();
    g.moveTo(9, -23); g.lineTo(9.8, -31); g.lineTo(6.2, -31); g.lineTo(5.6, -23);
    g.closePath(); g.fill();
    // collar points + red bow tie: the try-hard date look
    g.fillStyle = shLt; g.strokeStyle = shOut; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-2.6, -34.8); g.lineTo(0.4, -32.4); g.lineTo(-3.4, -31.8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(5.4, -34.8); g.lineTo(2.6, -32.4); g.lineTo(6.2, -31.8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = SU_TIE; g.strokeStyle = SU_TIE_DK; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(1.4, -32.6); g.lineTo(-2.2, -34); g.lineTo(-2.2, -31); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(1.4, -32.6); g.lineTo(5, -34); g.lineTo(5, -31); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = SU_TIE_DK;
    g.beginPath(); g.arc(1.4, -32.6, 1.2, 0, 7); g.fill();

    // 6 head
    g.fillStyle = SU_SKIN_DK; g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.rect(-0.5, -37.5, 5, 4); g.fill(); g.stroke();
    g.fillStyle = SU_SKIN_MID; g.lineWidth = 2.2;
    g.beginPath(); g.arc(2, -41, 6.8, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.arc(2, -41, 6.8, 0, 7); g.clip();
    g.fillStyle = SU_SKIN_LT;
    g.beginPath(); g.ellipse(-1, -44, 4, 3, -0.4, 0, 7); g.fill();
    g.fillStyle = SU_SKIN_DK; g.fillRect(6, -48, 4, 14);
    g.restore();
    g.fillStyle = SU_SKIN_DK; g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.2; // ear
    g.beginPath(); g.arc(-5.4, -40.6, 1.8, 0, 7); g.fill(); g.stroke();

    // 7 slicked hair, high shine
    g.fillStyle = hairMid; g.strokeStyle = hairOut; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-5.4, -43);
    g.quadraticCurveTo(-6.8, -48.6, -0.5, -49.6);
    g.quadraticCurveTo(5.5, -50.4, 9.2, -46.4);
    g.quadraticCurveTo(10.4, -44.8, 9.8, -43.4);
    g.quadraticCurveTo(6.5, -46.8, 1, -47);
    g.quadraticCurveTo(-3.4, -46.8, -5.4, -43);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = hairHi; g.lineWidth = 1.3; // pomade shine
    g.beginPath(); g.moveTo(-3.6, -46.4); g.quadraticCurveTo(1.5, -48.8, 7, -46.8); g.stroke();
    if (el) { // elite tell: thin mustache
      g.strokeStyle = hairMid; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(2.4, -38.4); g.quadraticCurveTo(4.4, -39.2, 6.2, -38.6);
      g.stroke();
    }

    // 8 heart-struck face
    if (a.hurt) {
      g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-1.8, -44); g.lineTo(1.4, -41);
      g.moveTo(1.4, -44); g.lineTo(-1.8, -41);
      g.moveTo(4.4, -44.2); g.lineTo(7.6, -41.2);
      g.moveTo(7.6, -44.2); g.lineTo(4.4, -41.2);
      g.stroke();
      g.strokeStyle = SU_MOUTH; g.lineWidth = 1.3; // wobble mouth
      g.beginPath(); g.moveTo(1.4, -37); g.quadraticCurveTo(3.4, -38.2, 5.6, -37); g.stroke();
    } else {
      const beat = 1 + Math.sin(t * 6) * 0.12; // hearts pulse
      g.fillStyle = SU_HEART;
      suHeart(g, -0.2, -42.4, 2.4 * beat);
      suHeart(g, 5.8, -42.8, 2.6 * beat);
      g.fillStyle = SU_HEART_HI;
      g.beginPath(); g.arc(-1, -43.4, 0.6, 0, 7); g.fill();
      g.beginPath(); g.arc(5, -43.8, 0.6, 0, 7); g.fill();
      g.strokeStyle = SU_HAIR_MID; g.lineWidth = 1.1; // brows floating high
      g.beginPath();
      g.moveTo(-2.6, -46.6); g.quadraticCurveTo(-0.4, -47.6, 1.6, -46.8);
      g.moveTo(3.8, -47); g.quadraticCurveTo(6, -47.9, 8, -47);
      g.stroke();
      g.fillStyle = SU_MOUTH; // dreamy open smile
      g.beginPath(); g.ellipse(3.8, -37.2, 1.7, 1.9, 0.1, 0, 7); g.fill();
      g.fillStyle = SU_SKIN_DK;
      g.beginPath(); g.ellipse(3.8, -36.2, 1.1, 0.7, 0.1, 0, 7); g.fill();
    }
    g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.2; // nose
    g.beginPath(); g.moveTo(8, -41); g.lineTo(9.2, -39.6); g.lineTo(7.6, -39.2); g.stroke();
    g.fillStyle = SU_BLUSH;
    g.beginPath(); g.ellipse(-2.4, -38.8, 2, 1.1, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(8.2, -39.2, 1.8, 1, 0, 0, 7); g.fill();

    // 9 front arm + the bouquet — held forward of the face, never over it
    let fhx = 12, fhy = -23, bang = 0.5;
    if (windup) { fhx = -8; fhy = -37; bang = -2.1; }
    else if (strike) { fhx = 16; fhy = -30; bang = 1.25; }
    else if (a.hurt) { fhx = 11; fhy = -21; bang = 0.95; }
    else if (a.moving) { fhx = 12 - step * 2; fhy = -23; bang = 0.5 + step * 0.06; }
    seg2(g, 7, -31, 11, -28, fhx, fhy, 4.6, shOut, shMid);
    suBouquet(g, fhx, fhy, bang);
    g.fillStyle = SU_SKIN_MID; g.strokeStyle = SU_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(fhx, fhy, 2.5, 0, 7); g.fill(); g.stroke();
    if (strike) { // petals shaken loose, drifting forward
      for (let i = 0; i < 25; i += 5) {
        const px = fhx + 6 + SU_PET[i] + Math.sin(t * 9 + i) * 0.8;
        const py = fhy - 4 + SU_PET[i + 1];
        g.fillStyle = (i % 10 === 0) ? SU_RO_MID : SU_RO_LT;
        g.beginPath(); g.ellipse(px, py, SU_PET[i + 2], SU_PET[i + 3], SU_PET[i + 4], 0, 7); g.fill();
      }
    }
  };

  // ---- HEATH: lanky brother, weaponized flatulence ----
  const HE_SKIN_OUT = '#845031', HE_SKIN_DK = '#bd7e50', HE_SKIN_MID = '#e6ad80', HE_SKIN_LT = '#f7d0a6';
  const HE_HAIR_OUT = '#3c2b0e', HE_HAIR_DK = '#6e5220', HE_HAIR_MID = '#95722e', HE_HAIR_LT = '#bd9848';
  const HE_TEE_OUT = '#160f16', HE_TEE_DK = '#241a24', HE_TEE_MID = '#332633', HE_TEE_LT = '#4c3a4c';
  const HE_PRINT = '#e8e0d0', HE_PRINT_R = '#c23838';
  const HE_SHORT_OUT = '#4f4426', HE_SHORT_DK = '#77683c', HE_SHORT_MID = '#9c8a52', HE_SHORT_LT = '#bcaa70';
  const HE_SHOE_OUT = '#4c4f44', HE_SHOE_MID = '#d8dacc', HE_SHOE_DK = '#a8aa9c', HE_SOCK = '#eeeae0';
  const HE_MOUTH = '#4a2018', HE_TEETH = '#f2ecdc';
  const HE_STUBBLE = 'rgba(60,43,14,0.22)';

  function heShoe(g, x, y) {
    g.fillStyle = HE_SHOE_MID; g.strokeStyle = HE_SHOE_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(x - 7, y - 8, 17, 8, 3); g.fill(); g.stroke();
    g.fillStyle = HE_SHOE_DK;
    g.beginPath(); g.roundRect(x - 7.4, y - 3.2, 17.8, 3.2, 1.6); g.fill();
    g.strokeStyle = HE_SHOE_OUT; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 2, y - 7.4); g.lineTo(x + 1.5, y - 5.4);
    g.moveTo(x + 1.5, y - 7.4); g.lineTo(x - 2, y - 5.4);
    g.stroke();
  }

  // one khaki cargo leg: thigh tube, hem cuff, side pocket
  function heCargo(g, hx, hy, kx, ky, mid, lt, pocket) {
    g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 13;
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.stroke();
    g.strokeStyle = mid; g.lineWidth = 10;
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.stroke();
    g.strokeStyle = lt; g.lineWidth = 2;
    g.beginPath(); g.moveTo(hx - 3, hy - 1); g.lineTo(kx - 3, ky - 1); g.stroke();
    g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 1.4; // cuff
    g.beginPath(); g.moveTo(kx - 5.5, ky + 1.5); g.lineTo(kx + 5.5, ky + 1.5); g.stroke();
    if (pocket) {
      g.fillStyle = mid; g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 1.3;
      g.beginPath(); g.roundRect(kx - 1, (hy + ky) * 0.5 - 4, 6.5, 7, 1.4); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(kx - 1, (hy + ky) * 0.5 - 1.4); g.lineTo(kx + 5.5, (hy + ky) * 0.5 - 1.4); g.stroke();
      g.fillStyle = HE_SHORT_OUT;
      g.beginPath(); g.arc(kx + 2.2, (hy + ky) * 0.5, 0.8, 0, 7); g.fill();
    }
  }

  BOSS.heath = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const sway = Math.sin(t * 1.5);

    // ============ REAR POSES: he turns around and takes aim ============
    if (windup || strike) {
      const rec = strike ? 1 : 0; // recoil amount
      const px = rec * -4;        // recoil shoves the whole body away
      // braced legs from behind: khaki thighs, bare shins, sneakers
      seg(g, -14 + px, -4, -14 + px, -9, 5.5, HE_SKIN_OUT, HE_SKIN_DK);
      seg(g, -3 + px, -40, -14 + px, -22, 11, HE_SHORT_OUT, HE_SHORT_DK);
      seg(g, -14 + px, -24, -14 + px, -6, 5.5, HE_SKIN_OUT, HE_SKIN_DK);
      g.strokeStyle = HE_SOCK; g.lineWidth = 5.5;
      g.beginPath(); g.moveTo(-14 + px, -10); g.lineTo(-14 + px, -7); g.stroke();
      heShoe(g, -14 + px, 0);
      seg(g, 6 + px, -42, 13 + px, -23, 11, HE_SHORT_OUT, HE_SHORT_MID);
      seg(g, 13 + px, -25, 14 + px, -6, 5.5, HE_SKIN_OUT, HE_SKIN_MID);
      g.strokeStyle = HE_SOCK; g.lineWidth = 5.5;
      g.beginPath(); g.moveTo(14 + px, -10); g.lineTo(14 + px, -7); g.stroke();
      heShoe(g, 14 + px, 0);
      g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 1.4; // hem cuffs
      g.beginPath();
      g.moveTo(-19 + px, -22); g.lineTo(-9 + px, -21);
      g.moveTo(8 + px, -22); g.lineTo(18 + px, -22.5);
      g.stroke();

      // the seat, presented to the viewer: two lit khaki mounds + seam
      const sx = 8 + rec * 5, sy = -46 - rec * 1;
      g.fillStyle = HE_SHORT_LT; g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 2.4;
      g.beginPath(); g.ellipse(sx, sy - 4.5, 9, 7, 0.3, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(sx + 1, sy + 4, 9, 6.6, 0.12, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#d8c896';
      g.beginPath(); g.ellipse(sx - 2.5, sy - 7, 4, 2.6, 0.3, 0, 7); g.fill();
      g.fillStyle = HE_SHORT_MID;
      g.beginPath(); g.ellipse(sx + 3.5, sy + 5.6, 4.5, 2.6, 0.2, 0, 7); g.fill();
      g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 1.7; // seam
      g.beginPath(); g.moveTo(sx + 7, sy - 9); g.quadraticCurveTo(sx + 9.6, sy - 0.5, sx + 6.8, sy + 7.5); g.stroke();
      g.strokeStyle = HE_SHORT_DK; g.lineWidth = 1.2; // back pocket
      g.beginPath(); g.roundRect(sx - 5.5, sy - 6, 5, 5, 1); g.stroke();

      // torso bent away and DOWN — a clean sloped slab of band tee
      const shx = -16 + px - rec * 3, shy = -56 + rec * 2;
      g.fillStyle = HE_TEE_MID; g.strokeStyle = HE_TEE_OUT; g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(sx - 3, sy - 10);
      g.quadraticCurveTo(sx - 12, sy - 14, shx + 3, shy - 8);
      g.quadraticCurveTo(shx - 3, shy - 10, shx - 6.5, shy - 5);
      g.quadraticCurveTo(shx - 8.5, shy, shx - 4, shy + 3);
      g.quadraticCurveTo(shx + 8, shy + 7, sx - 4, sy + 4);
      g.quadraticCurveTo(sx - 1, sy - 3, sx - 3, sy - 10);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = HE_TEE_LT; // rim light along the spine
      g.beginPath();
      g.moveTo(sx - 3, sy - 10);
      g.quadraticCurveTo(sx - 12, sy - 14, shx + 3, shy - 8);
      g.quadraticCurveTo(shx - 3, shy - 10, shx - 6.5, shy - 5);
      g.lineTo(shx - 4.5, shy - 3);
      g.quadraticCurveTo(shx - 1, shy - 7, shx + 4, shy - 5.5);
      g.quadraticCurveTo(sx - 11, sy - 11.5, sx - 3, sy - 7.5);
      g.closePath(); g.fill();
      g.strokeStyle = HE_TEE_DK; g.lineWidth = 1.6; // strain folds
      g.beginPath();
      g.moveTo(shx + 4, shy); g.quadraticCurveTo(sx - 10, sy - 6, sx - 6, sy - 2);
      g.moveTo(shx + 3, shy + 4); g.quadraticCurveTo(sx - 11, sy + 1, sx - 7, sy + 3);
      g.stroke();

      // head low and turned away: all mop, no face — the turn sells it
      const hx2 = shx - 9, hy2 = shy - 7 + rec * 3;
      g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 2;
      g.beginPath(); g.arc(hx2, hy2, 7.6, 0, 7); g.fill(); g.stroke();
      g.fillStyle = HE_HAIR_MID; g.strokeStyle = HE_HAIR_OUT; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(hx2 - 7.6, hy2 + 5.5);
      g.quadraticCurveTo(hx2 - 10.5, hy2 - 3, hx2 - 5.5, hy2 - 7.5);
      g.quadraticCurveTo(hx2, hy2 - 10, hx2 + 5.5, hy2 - 7.5);
      g.quadraticCurveTo(hx2 + 10, hy2 - 3.5, hx2 + 8.2, hy2 + 3.5);
      g.quadraticCurveTo(hx2 + 6, hy2 + 7, hx2 + 2.5, hy2 + 5.5);
      g.quadraticCurveTo(hx2 - 1, hy2 + 8, hx2 - 4.5, hy2 + 6);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = HE_HAIR_DK; // occipital shade
      g.beginPath(); g.ellipse(hx2 + 3, hy2 + 1.5, 4, 4.6, 0.4, 0, 7); g.fill();
      g.strokeStyle = HE_HAIR_LT; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(hx2 - 6, hy2 - 5); g.quadraticCurveTo(hx2, hy2 - 8, hx2 + 6, hy2 - 5); g.stroke();
      g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.3; // ear
      g.beginPath(); g.arc(hx2 + 6.8, hy2 + 1.5, 2.1, 0, 7); g.fill(); g.stroke();
      if (strike) { // puffed cheek bulging past the profile, eye screwed shut
        g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.6;
        g.beginPath(); g.arc(hx2 - 8, hy2 + 3.5, 4, 0, 7); g.fill(); g.stroke();
        g.fillStyle = HE_SKIN_LT;
        g.beginPath(); g.arc(hx2 - 9.2, hy2 + 2.3, 1.6, 0, 7); g.fill();
        g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(hx2 - 8.6, hy2 - 1.6); g.lineTo(hx2 - 5.8, hy2 - 1); g.stroke();
      }

      if (windup) {
        // the apology-that-isn't: palm raised high beside him
        seg2(g, shx - 2, shy - 5, shx - 9, shy - 13, shx - 6, shy - 23, 5, HE_SKIN_OUT, HE_SKIN_MID);
        g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
        g.beginPath(); g.arc(shx - 5.5, shy - 25.5, 3.6, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = HE_SKIN_DK; g.lineWidth = 1.1; // splayed fingers
        g.beginPath();
        g.moveTo(shx - 7.4, shy - 28.4); g.lineTo(shx - 7.8, shy - 26.2);
        g.moveTo(shx - 5.4, shy - 29.2); g.lineTo(shx - 5.6, shy - 26.8);
        g.moveTo(shx - 3.4, shy - 28.4); g.lineTo(shx - 4, shy - 26.2);
        g.stroke();
        // other hand braced on the front knee
        seg2(g, shx + 2, shy + 2, 2, -34, 10, -28, 5, HE_SKIN_OUT, HE_SKIN_DK);
        g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
        g.beginPath(); g.arc(10.5, -27.5, 3, 0, 7); g.fill(); g.stroke();
      } else {
        // recoil: both arms blown forward past the head, wide apart
        seg2(g, shx - 2, shy - 5, shx - 11, shy - 12, shx - 18, shy - 20, 5, HE_SKIN_OUT, HE_SKIN_MID);
        g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
        g.beginPath(); g.arc(shx - 19, shy - 21.5, 3.2, 0, 7); g.fill(); g.stroke();
        seg2(g, shx + 2, shy + 2, shx - 7, shy + 6, shx - 15, shy + 8, 5, HE_SKIN_OUT, HE_SKIN_DK);
        g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
        g.beginPath(); g.arc(shx - 16.5, shy + 8.5, 3, 0, 7); g.fill(); g.stroke();
      }
      return;
    }

    // ============ FRONT POSES: smug slacker strut ============
    const bob = moving ? Math.abs(step) * 2.2 : sway * 0.8;
    let lean = moving ? step * 1.4 : sway * 1.1;
    if (hurt) lean = -7;

    // 1 shins + sneakers + cargo shorts
    const fx = moving ? step * 9 : 0;
    const flift = moving ? Math.max(0, step) * 5 : 0;
    const blift = moving ? Math.max(0, -step) * 5 : 0;
    const bax = -6 - fx, fax = 7 + fx;
    seg(g, -5, -28, bax, -4 - blift, 5.5, HE_SKIN_OUT, HE_SKIN_DK);
    g.strokeStyle = HE_SOCK; g.lineWidth = 5;
    g.beginPath(); g.moveTo(bax, -9 - blift); g.lineTo(bax, -6.5 - blift); g.stroke();
    heShoe(g, bax, -blift);
    seg(g, 6, -28, fax, -4 - flift, 5.5, HE_SKIN_OUT, HE_SKIN_MID);
    g.strokeStyle = HE_SOCK; g.lineWidth = 5;
    g.beginPath(); g.moveTo(fax, -9 - flift); g.lineTo(fax, -6.5 - flift); g.stroke();
    heShoe(g, fax, -flift);
    heCargo(g, -5, -46, -5 - fx * 0.5, -28, HE_SHORT_DK, HE_SHORT_MID, false);
    heCargo(g, 6, -46, 6 + fx * 0.5, -28, HE_SHORT_MID, HE_SHORT_LT, true);

    g.translate(0, -bob);
    g.translate(0, -46); g.rotate(lean * 0.012); g.translate(0, 46);

    // 2 waistband
    g.fillStyle = HE_SHORT_MID; g.strokeStyle = HE_SHORT_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.roundRect(-11, -52, 23, 8, 3); g.fill(); g.stroke();
    g.fillStyle = HE_SHORT_OUT; g.fillRect(-11, -52, 23, 2.2);
    g.fillStyle = HE_SHORT_LT; g.fillRect(-10, -49, 4, 4);

    // 3 back arm hangs loose
    const bhx2 = hurt ? -18 : -15 + sway * 0.6;
    seg2(g, -10, -66, -14, -57, bhx2, -47, 4.8, HE_SKIN_OUT, HE_SKIN_DK);
    g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
    g.beginPath(); g.arc(bhx2, -47, 2.8, 0, 7); g.fill(); g.stroke();

    // 4 band tee, lanky cut
    g.fillStyle = HE_TEE_MID; g.strokeStyle = HE_TEE_OUT; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-10, -45);
    g.lineTo(-11, -64);
    g.quadraticCurveTo(-12, -70, -5, -71);
    g.lineTo(7, -71);
    g.quadraticCurveTo(14, -70, 13, -64);
    g.lineTo(12, -45);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = HE_TEE_LT;
    g.beginPath();
    g.moveTo(-10, -47); g.lineTo(-10.7, -64);
    g.quadraticCurveTo(-11.5, -69.8, -5, -71);
    g.lineTo(-2.4, -71); g.lineTo(-4.6, -47);
    g.closePath(); g.fill();
    g.fillStyle = HE_TEE_DK;
    g.beginPath();
    g.moveTo(12, -47); g.lineTo(12.8, -64); g.lineTo(8.4, -64); g.lineTo(7.6, -47);
    g.closePath(); g.fill();
    g.strokeStyle = HE_TEE_DK; g.lineWidth = 2.2; // collar
    g.beginPath(); g.arc(1, -71, 5, 0.15, 2.99); g.stroke();
    g.fillStyle = HE_TEE_DK; g.strokeStyle = HE_TEE_OUT; g.lineWidth = 2; // sleeves
    g.beginPath(); g.roundRect(-14, -70, 8, 10, 3); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(8, -70, 9, 11, 3); g.fill(); g.stroke();
    g.fillStyle = HE_TEE_MID; g.fillRect(9.2, -68.8, 6.6, 3.6);
    // band print: skull blob over a red scrawl — no real band harmed
    g.fillStyle = HE_PRINT;
    g.beginPath();
    g.moveTo(-4.4, -61);
    g.quadraticCurveTo(-4.8, -66.5, 1, -66.8);
    g.quadraticCurveTo(6.8, -66.5, 6.4, -61);
    g.lineTo(4.6, -58.2); g.lineTo(3, -59.6); g.lineTo(1, -58);
    g.lineTo(-1, -59.6); g.lineTo(-2.6, -58.2);
    g.closePath(); g.fill();
    g.fillStyle = HE_TEE_MID;
    g.beginPath(); g.ellipse(-1.4, -62.6, 1.7, 2, 0.1, 0, 7); g.fill();
    g.beginPath(); g.ellipse(3.4, -62.6, 1.7, 2, -0.1, 0, 7); g.fill();
    g.strokeStyle = HE_PRINT_R; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-4.6, -55.4); g.lineTo(-1.4, -56.6); g.lineTo(1.4, -55);
    g.lineTo(4, -56.8); g.lineTo(6.6, -55.2);
    g.stroke();

    // 5 neck + head
    g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 2;
    g.beginPath(); g.rect(-0.5, -76, 6, 7); g.fill(); g.stroke();
    g.fillStyle = HE_SKIN_MID; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(3, -82, 8.2, 9, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(3, -82, 8.2, 9, 0, 0, 7); g.clip();
    g.fillStyle = HE_SKIN_LT;
    g.beginPath(); g.ellipse(-1, -86, 5, 4, -0.4, 0, 7); g.fill();
    g.fillStyle = HE_SKIN_DK; g.fillRect(8.5, -92, 5, 22);
    g.fillStyle = HE_STUBBLE; // jaw scruff
    g.beginPath(); g.ellipse(3.5, -75.5, 7, 4, 0, 0, 7); g.fill();
    g.restore();
    g.fillStyle = HE_SKIN_DK; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.4; // ear
    g.beginPath(); g.arc(-4.4, -81.5, 2.5, 0, 7); g.fill(); g.stroke();

    // 6 smug face: lidded eyes, one hitched brow, wide closed grin
    if (hurt) {
      g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-0.6, -84.6); g.lineTo(2.4, -81.8);
      g.moveTo(2.4, -84.6); g.lineTo(-0.6, -81.8);
      g.moveTo(5.8, -84.8); g.lineTo(8.8, -82);
      g.moveTo(8.8, -84.8); g.lineTo(5.8, -82);
      g.stroke();
      g.strokeStyle = HE_MOUTH; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(1.4, -76.6); g.quadraticCurveTo(4.4, -75, 7.6, -76.8); g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(1.6, -83.4, 2.3, 1.9, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(7.6, -83.6, 2.1, 1.8, 0, 0, 7); g.fill();
      g.fillStyle = HE_HAIR_OUT;
      g.beginPath(); g.arc(2.4, -83.3, 1.15, 0, 7); g.fill();
      g.beginPath(); g.arc(8.3, -83.5, 1.15, 0, 7); g.fill();
      g.fillStyle = HE_SKIN_MID; // heavy lids
      g.fillRect(-0.9, -85.8, 5.2, 1.8);
      g.fillRect(5.3, -86, 4.8, 1.8);
      g.strokeStyle = HE_HAIR_DK; g.lineWidth = 1.4; // one brow hitched high
      g.beginPath();
      g.moveTo(-1, -87); g.lineTo(3.8, -86.4);
      g.moveTo(5.6, -88.8); g.lineTo(10.2, -87.2);
      g.stroke();
      g.strokeStyle = HE_MOUTH; g.lineWidth = 1.6; // the grin
      g.beginPath(); g.moveTo(-0.6, -77.6); g.quadraticCurveTo(4.5, -73.8, 9.8, -78.4); g.stroke();
      g.fillStyle = HE_TEETH;
      g.beginPath();
      g.moveTo(2, -76.2); g.quadraticCurveTo(4.8, -74.8, 8, -76.8);
      g.quadraticCurveTo(4.8, -75.9, 2, -76.2);
      g.closePath(); g.fill();
      g.strokeStyle = HE_SKIN_DK; g.lineWidth = 1; // smug dimple
      g.beginPath(); g.moveTo(10.4, -78.8); g.lineTo(11, -77.2); g.stroke();
    }
    g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.5; // nose
    g.beginPath(); g.moveTo(9.8, -82.6); g.lineTo(11.4, -80.2); g.lineTo(9, -79.8); g.stroke();

    // 7 mop of hair with a carved fringe
    g.fillStyle = HE_HAIR_MID;
    g.beginPath();
    g.moveTo(-8.6, -79.5);
    g.quadraticCurveTo(-11.4, -87.5, -6.4, -91.6);
    g.quadraticCurveTo(-0.5, -94.6, 7, -92.4);
    g.quadraticCurveTo(12.4, -90.2, 12.9, -84.5);
    g.quadraticCurveTo(10.8, -87.6, 6, -88);
    g.quadraticCurveTo(-1, -88.4, -5.4, -86.8);
    g.quadraticCurveTo(-8, -85.2, -8.6, -79.5);
    g.closePath(); g.fill();
    g.fillStyle = HE_HAIR_MID; // loose clumps, fill only
    g.beginPath(); g.moveTo(-7.8, -89.4); g.lineTo(-9.6, -92.6); g.lineTo(-1.4, -92); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-2, -92.4); g.lineTo(0.8, -94.4); g.lineTo(5.8, -92.6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(5.6, -91.6); g.lineTo(11.6, -92.4); g.lineTo(10.8, -88); g.closePath(); g.fill();
    g.fillStyle = HE_HAIR_DK;
    g.beginPath();
    g.moveTo(-7.2, -86.4);
    g.quadraticCurveTo(-9.4, -89.4, -8, -81.5);
    g.quadraticCurveTo(-6.2, -85.6, -4.4, -86.6);
    g.closePath(); g.fill();
    g.strokeStyle = HE_HAIR_LT; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-5.2, -88.8); g.quadraticCurveTo(0.8, -92.4, 7.8, -89.8); g.stroke();

    // 8 front arm: idle thumb hooked in the waistband; walk swings it
    if (moving) {
      const fhx2 = 14 + step * 4;
      seg2(g, 9, -66, 13, -57, fhx2, -48, 4.8, HE_SKIN_OUT, HE_SKIN_MID);
      g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
      g.beginPath(); g.arc(fhx2, -48, 2.8, 0, 7); g.fill(); g.stroke();
    } else {
      seg2(g, 9, -66, 15, -58, 10, -51, 4.8, HE_SKIN_OUT, HE_SKIN_MID);
      g.fillStyle = HE_SKIN_MID; g.strokeStyle = HE_SKIN_OUT; g.lineWidth = 1.7;
      g.beginPath(); g.arc(10, -51, 2.8, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = HE_SKIN_LT; g.lineWidth = 1.2; // hooked thumb
      g.beginPath(); g.moveTo(9.4, -51.8); g.lineTo(8, -49.8); g.stroke();
    }
  };

  // ---- JR'S RV: beige-and-brown 70s camper ----
  const RV_BD_OUT = '#5c4526', RV_BD_DK = '#a8905e', RV_BD_MID = '#d8c290', RV_BD_LT = '#efe0b4', RV_BD_HI = '#faf2d6';
  const RV_BR_OUT = '#341f0e', RV_BR_DK = '#5c3a1e', RV_BR_MID = '#7c5028', RV_BR_LT = '#a06c38';
  const RV_OR = '#c46a24', RV_OR_LT = '#e08a3c';
  const RV_ROOF = '#efe9da', RV_ROOF_DK = '#c4bca6';
  const RV_GL_OUT = '#27455c', RV_GL_DK = '#5590ac', RV_GL_MID = '#8ec8e0', RV_GL_LT = '#c8ecf8';
  const RV_CHROME_OUT = '#4c515d', RV_CHROME = '#c9cdd6', RV_CHROME_LT = '#eef0f5';
  const RV_TIRE_OUT = '#14161c', RV_TIRE = '#2c3038', RV_TIRE_LT = '#484e5a';
  const RV_HUB_OUT = '#3c414d', RV_HUB = '#b9bec9', RV_HUB_LT = '#e6e9ef';
  const RV_WELL = '#241708';
  const RV_LAMP = '#ffe9a8', RV_LAMP_CORE = '#fff7dc', RV_AMBER = '#e0912c';
  const RV_FLARE_A = 'rgba(255,224,130,0.55)', RV_FLARE_B = 'rgba(255,224,130,0.28)';
  const RV_BEAM = 'rgba(255,236,170,0.18)';
  const RV_PUFF_A = 'rgba(170,176,188,0.4)', RV_PUFF_B = 'rgba(170,176,188,0.26)', RV_PUFF_C = 'rgba(170,176,188,0.13)';
  const RV_CURTAIN = '#c9a86a';
  const JR_CAP = '#a83226', JR_CAP_DK = '#701d16', JR_CAP_LT = '#c9564a';
  const JR_SKIN = '#e2a678', JR_SKIN_DK = '#b5744a', JR_SKIN_OUT = '#7c452c';
  const JR_SHIRT = '#3a5a80';

  function rvWheel(g, x, y, wc) {
    g.fillStyle = RV_TIRE; g.strokeStyle = RV_TIRE_OUT; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = RV_TIRE_LT; g.lineWidth = 1.4; // tread ticks ride the roll
    for (let i = 0; i < 6; i++) {
      const ta = wc * 1.1 + i * 1.047;
      const c1 = Math.cos(ta), s1 = Math.sin(ta);
      g.beginPath(); g.moveTo(x + c1 * 10.4, y + s1 * 10.4); g.lineTo(x + c1 * 12.4, y + s1 * 12.4); g.stroke();
    }
    g.fillStyle = RV_HUB; g.strokeStyle = RV_HUB_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.arc(x, y, 6.2, 0, 7); g.fill(); g.stroke();
    g.fillStyle = RV_HUB_LT;
    g.beginPath(); g.arc(x - 1.6, y - 1.8, 2.2, 0, 7); g.fill();
    g.fillStyle = RV_HUB_OUT; // lugs rotate with walkCyc
    for (let i = 0; i < 4; i++) {
      const la = wc * 1.1 + 0.4 + i * 1.5708;
      g.beginPath(); g.arc(x + Math.cos(la) * 3.6, y + Math.sin(la) * 3.6, 1.1, 0, 7); g.fill();
    }
  }

  // body silhouette, rebuilt for fill/stroke/clip passes
  function rvBodyPath(g) {
    g.beginPath();
    g.moveTo(-60, -30);
    g.lineTo(-49, -30);
    g.arc(-34, -30, 14, 3.14159, 6.28318);
    g.lineTo(20, -30);
    g.arc(34, -30, 14, 3.14159, 6.28318);
    g.lineTo(56, -30);
    g.quadraticCurveTo(60, -31, 60, -38);
    g.lineTo(60, -56);
    g.quadraticCurveTo(60, -60, 58, -64);
    g.lineTo(50, -86);
    g.quadraticCurveTo(49, -89, 44, -89);
    g.lineTo(-54, -89);
    g.quadraticCurveTo(-60, -89, -60, -82);
    g.closePath();
  }

  BOSS.jrv = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const wc = a.walkCyc || 0;

    // 1 exhaust chuffs off the rear pipe
    if (moving || strike) {
      const n = strike ? 3 : 2;
      for (let i = 0; i <= n; i++) {
        const ph = (t * 0.9 + i * 0.31) % 1;
        const ex = -64 - ph * 14, ey = -20 - ph * 9;
        const er = (2.5 + ph * 3.5) * (strike ? 1.5 : 1);
        g.fillStyle = ph < 0.35 ? RV_PUFF_A : ph < 0.7 ? RV_PUFF_B : RV_PUFF_C;
        g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill();
      }
    }

    // 2 wheel wells + tires (unsprung — they stay on the ground)
    g.fillStyle = RV_WELL;
    g.beginPath(); g.arc(-34, -28, 14.5, 0, 7); g.fill();
    g.beginPath(); g.arc(34, -28, 14.5, 0, 7); g.fill();
    rvWheel(g, -34, -13, wc);
    rvWheel(g, 34, -13, wc);

    // 3 sprung body: engine rumble + pitch acting
    const rumble = Math.sin(t * 17) * (moving ? 0.7 : 0.3);
    let pitch = 0;
    if (windup) pitch = 0.045;         // nose dips as it gathers itself
    else if (strike) pitch = -0.06;    // rocks back and surges
    if (hurt) pitch = 0.03;
    g.save();
    g.translate(0, rumble);
    g.translate(34, -14); g.rotate(pitch); g.translate(-34, 14);
    if (strike) g.translate(3, 0);

    rvBodyPath(g);
    g.fillStyle = RV_BD_MID; g.fill();
    g.strokeStyle = RV_BD_OUT; g.lineWidth = 2.8; g.stroke();

    // striped livery + shading, clipped inside the shell
    g.save();
    rvBodyPath(g); g.clip();
    g.fillStyle = RV_ROOF; g.fillRect(-60, -89, 120, 5);       // white cap
    g.fillStyle = RV_ROOF_DK; g.fillRect(-60, -85, 120, 1.6);
    g.fillStyle = RV_BD_LT; g.fillRect(-60, -84, 120, 5);      // sky-lit upper
    g.fillStyle = RV_OR; g.fillRect(-60, -56, 120, 3);         // pinstripes
    g.fillStyle = RV_BR_MID; g.fillRect(-60, -53, 120, 14);    // big brown band
    g.fillStyle = RV_BR_LT; g.fillRect(-60, -53, 120, 2.4);
    g.fillStyle = RV_BR_DK; g.fillRect(-60, -43.6, 120, 4.6);
    g.fillStyle = RV_OR_LT; g.fillRect(-60, -39, 120, 2.4);
    g.fillStyle = RV_BD_DK; g.fillRect(-60, -33, 120, 7);      // rocker shade
    g.fillStyle = RV_BD_HI;                                    // top-left key: lit rear-upper corner
    g.beginPath(); g.moveTo(-60, -89); g.lineTo(-34, -89); g.lineTo(-46, -57); g.lineTo(-60, -57); g.closePath(); g.fill();
    g.globalAlpha = 0.35; g.fillStyle = RV_BD_DK;              // sun-away front shade
    g.beginPath(); g.moveTo(60, -30); g.lineTo(60, -64); g.lineTo(52, -86) ; g.lineTo(44, -86); g.lineTo(50, -30); g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.restore();

    // 4 rear ladder
    g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-62.5, -34); g.lineTo(-62.5, -80);
    g.moveTo(-57.5, -34); g.lineTo(-57.5, -80);
    g.stroke();
    g.strokeStyle = RV_CHROME; g.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const ry = -37 - i * 8;
      g.beginPath(); g.moveTo(-62.5, ry); g.lineTo(-57.5, ry); g.stroke();
    }

    // 5 windows: porthole, main window with curtains, cab glass with JR
    g.fillStyle = RV_GL_MID; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 2;
    g.beginPath(); g.arc(-40, -71, 5.5, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = RV_CHROME; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-40, -71, 5.5, 0, 7); g.stroke();
    g.fillStyle = RV_GL_LT;
    g.beginPath(); g.moveTo(-43.5, -72.5); g.lineTo(-39.5, -75.5); g.lineTo(-36.5, -73.5); g.lineTo(-42.5, -69.5); g.closePath(); g.fill();

    g.fillStyle = RV_GL_MID; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-26, -82, 36, 20, 3); g.fill(); g.stroke();
    g.fillStyle = RV_GL_LT;
    g.beginPath(); g.moveTo(-22, -82); g.lineTo(-12, -82); g.lineTo(-20, -62); g.lineTo(-26, -62); g.closePath(); g.fill();
    g.fillStyle = RV_GL_DK;
    g.beginPath(); g.moveTo(4, -82); g.lineTo(10, -82); g.lineTo(10, -62); g.lineTo(-2, -62); g.closePath(); g.fill();
    g.fillStyle = RV_CURTAIN; // granny curtains
    g.beginPath(); g.moveTo(-25, -81); g.quadraticCurveTo(-21, -72, -25, -63); g.lineTo(-25, -81); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(9, -81); g.quadraticCurveTo(5, -72, 9, -63); g.lineTo(9, -81); g.closePath(); g.fill();

    // cab side glass follows the windshield rake
    g.fillStyle = RV_GL_MID; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(28, -82); g.lineTo(45, -82); g.lineTo(52, -62); g.lineTo(28, -62);
    g.closePath(); g.fill(); g.stroke();
    g.save();
    g.beginPath();
    g.moveTo(28, -82); g.lineTo(45, -82); g.lineTo(52, -62); g.lineTo(28, -62);
    g.closePath(); g.clip();
    g.fillStyle = '#3a2410'; g.fillRect(28, -82, 26, 20);      // deep cab interior
    // JR at the wheel: cap, determined scowl, both fists on the rim
    g.fillStyle = JR_SHIRT;
    g.beginPath(); g.ellipse(38, -62.5, 8.5, 6.5, 0, 0, 7); g.fill();
    g.fillStyle = JR_SKIN; g.strokeStyle = JR_SKIN_OUT; g.lineWidth = 1.7;
    g.beginPath(); g.arc(38.5, -71, 5.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = JR_SKIN_DK;
    g.beginPath(); g.arc(34.5, -70.5, 1.7, 0, 7); g.fill();  // ear
    g.fillStyle = JR_CAP; g.strokeStyle = JR_CAP_DK; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(32.8, -73.5);
    g.quadraticCurveTo(33.6, -79.2, 39, -79);
    g.quadraticCurveTo(43.8, -78.8, 44.4, -73.8);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = JR_CAP_LT;
    g.beginPath(); g.moveTo(34, -74.4); g.quadraticCurveTo(34.8, -78, 38.6, -78.2); g.lineTo(38, -74.4); g.closePath(); g.fill();
    g.fillStyle = JR_CAP; g.strokeStyle = JR_CAP_DK;
    g.beginPath(); g.roundRect(43.2, -75.4, 5.4, 2.2, 1); g.fill(); g.stroke(); // brim
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(41, -71.2, 1.8, 1.5, 0, 0, 7); g.fill();
    g.fillStyle = JR_SKIN_OUT;
    g.beginPath(); g.arc(41.6, -71.1, 0.9, 0, 7); g.fill();
    g.strokeStyle = JR_SKIN_OUT; g.lineWidth = 1.4; // determined brow + set jaw
    g.beginPath(); g.moveTo(38.8, -74.2); g.lineTo(43, -72.8); g.stroke();
    g.beginPath(); g.moveTo(40.4, -67.4); g.lineTo(43.2, -67.7); g.stroke();
    g.strokeStyle = RV_TIRE_OUT; g.lineWidth = 2.2; // wheel rim
    g.beginPath(); g.arc(47, -63.5, 4.6, 3.5, 6.2); g.stroke();
    g.fillStyle = JR_SKIN; g.strokeStyle = JR_SKIN_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.arc(44.2, -66.6, 1.8, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(49, -65.4, 1.8, 0, 7); g.fill(); g.stroke();
    g.restore();
    g.fillStyle = RV_GL_LT; g.globalAlpha = 0.35; // windshield glare
    g.beginPath(); g.moveTo(29, -82); g.lineTo(33, -82); g.lineTo(39, -62); g.lineTo(34, -62); g.closePath(); g.fill();
    g.globalAlpha = 1;

    // 6 door seam + handle + JR's decal
    g.strokeStyle = RV_BD_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(24, -60); g.lineTo(24, -31); g.moveTo(52.5, -60); g.lineTo(53.5, -31); g.stroke();
    g.strokeStyle = RV_CHROME; g.lineWidth = 2;
    g.beginPath(); g.moveTo(27, -57); g.lineTo(32, -57); g.stroke();
    g.fillStyle = RV_ROOF; g.strokeStyle = RV_BR_OUT; g.lineWidth = 1.4; // "JR" plate
    g.beginPath(); g.roundRect(-52, -36.5, 11, 6, 1.5); g.fill(); g.stroke();
    g.strokeStyle = RV_BR_OUT; g.lineWidth = 1.3;
    g.beginPath(); // J
    g.moveTo(-48.6, -34.8); g.lineTo(-46.6, -34.8);
    g.moveTo(-47.6, -34.8); g.lineTo(-47.6, -32.2); g.quadraticCurveTo(-47.7, -31.4, -48.9, -31.7);
    g.stroke();
    g.beginPath(); // R
    g.moveTo(-45, -34.8); g.lineTo(-45, -31.6);
    g.moveTo(-45, -34.8); g.quadraticCurveTo(-43, -34.6, -43.4, -33.4);
    g.quadraticCurveTo(-43.8, -32.8, -45, -33.2);
    g.lineTo(-43.2, -31.6);
    g.stroke();

    // 7 roof vent + antenna
    g.fillStyle = RV_CHROME; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.roundRect(-18, -95.5, 16, 7, 2); g.fill(); g.stroke();
    g.fillStyle = RV_CHROME_LT; g.fillRect(-17, -95, 6, 2);
    g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-18, -90.5); g.lineTo(-2, -90.5); g.stroke();
    g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(46, -89); g.lineTo(51, -97); g.stroke();
    g.fillStyle = RV_CHROME;
    g.beginPath(); g.arc(51.2, -97.6, 1.3, 0, 7); g.fill();

    // 8 bumpers + lights
    g.fillStyle = RV_CHROME; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.roundRect(52, -33, 12, 6, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-64, -33, 12, 6, 2); g.fill(); g.stroke();
    g.fillStyle = RV_CHROME_LT; g.fillRect(-63, -32, 9, 1.6); g.fillRect(53, -32, 9, 1.6);
    g.fillStyle = RV_TIRE_OUT; // exhaust stub
    g.beginPath(); g.roundRect(-63, -20.5, 6, 3.5, 1.5); g.fill();
    g.fillStyle = RV_LAMP; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.8; // headlight
    g.beginPath(); g.arc(58.5, -49, 3.4, 0, 7); g.fill(); g.stroke();
    g.fillStyle = RV_LAMP_CORE;
    g.beginPath(); g.arc(57.6, -50, 1.4, 0, 7); g.fill();
    g.fillStyle = RV_AMBER; g.strokeStyle = RV_CHROME_OUT; g.lineWidth = 1.3; // signal
    g.beginPath(); g.arc(58.5, -41.5, 2, 0, 7); g.fill(); g.stroke();
    g.fillStyle = RV_HUB_OUT; // taillight
    g.beginPath(); g.roundRect(-61.5, -42, 3, 6, 1); g.fill();
    g.fillStyle = HE_PRINT_R;
    g.beginPath(); g.roundRect(-61, -41.4, 2, 4.8, 0.8); g.fill();

    if (windup) { // headlights flare before the charge
      g.fillStyle = RV_FLARE_A;
      g.beginPath(); g.arc(58.5, -49, 5.5, 0, 7); g.fill();
      g.fillStyle = RV_FLARE_B;
      g.beginPath(); g.arc(58.5, -49, 9.5, 0, 7); g.fill();
      g.fillStyle = RV_BEAM;
      g.beginPath(); g.moveTo(60, -52); g.lineTo(92, -62); g.lineTo(92, -38); g.lineTo(60, -46); g.closePath(); g.fill();
    }
    g.restore();
  };

  // ---- YVONNE: the stylish sister, blown-kiss sub-boss ----
  const YV_SKIN_OUT = '#7c452c', YV_SKIN_DK = '#b5744a', YV_SKIN_MID = '#e2a678', YV_SKIN_LT = '#f5cba2';
  const YV_HAIR_OUT = '#38160e', YV_HAIR_DK = '#571f0f', YV_HAIR_MID = '#7c3316', YV_HAIR_LT = '#a04a20', YV_HAIR_HI = '#c46a30';
  const YV_DR_OUT = '#4a1240', YV_DR_DK = '#6f1e5e', YV_DR_MID = '#992e80', YV_DR_LT = '#c050a2', YV_DR_HI = '#e084c6';
  const YV_BELT_OUT = '#6e5210', YV_BELT = '#c89e2e', YV_BELT_LT = '#ecd06a';
  const YV_LEG_OUT = '#17131f', YV_LEG_MID = '#2c2438', YV_LEG_LT = '#453a54';
  const YV_PUMP_OUT = '#4f0e14', YV_PUMP = '#8e1c26', YV_PUMP_LT = '#c23440';
  const YV_GOLD = '#e0b23c', YV_GOLD_DK = '#8a6a1a';
  const YV_LIP = '#c21c3c', YV_LIP_DK = '#8a1028';
  const YV_SHADOW_EYE = 'rgba(120,80,200,0.3)';
  const YV_BLUSH = 'rgba(235,105,110,0.3)';
  const YV_SPARK = 'rgba(240,196,90,0.75)';
  // interior curl arcs on the big hair: x, y, r
  const YV_CURL = [-11, -93, 3.6, 1, -98, 3.8, 12, -94, 3.4, 16.5, -83, 3, -13.5, -81, 3.2, -14, -89, 2.8, 16, -91, 2.6, -9, -74, 2.7];

  function yvPump(g, x, y) {
    g.fillStyle = YV_PUMP; g.strokeStyle = YV_PUMP_OUT; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(x - 4, y - 6);
    g.quadraticCurveTo(x + 4, y - 6.5, x + 8, y - 2.5);
    g.quadraticCurveTo(x + 9, y, x + 7, y);
    g.lineTo(x - 2.6, y);
    g.lineTo(x - 3.4, y);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 3.2, y - 5); g.lineTo(x - 4.4, y); g.lineTo(x - 5.8, y); g.lineTo(x - 4.4, y - 5.5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = YV_PUMP_LT;
    g.beginPath(); g.ellipse(x + 3, y - 4.4, 3, 1.2, 0.25, 0, 7); g.fill();
  }

  BOSS.yvonne = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const sway = Math.sin(t * 1.4);
    const bob = moving ? Math.abs(step) * 2.4 : sway * 0.7;
    let lean = moving ? step * 1.2 : sway * 0.8;
    if (windup) lean = -3.5;
    else if (strike) lean = 5;
    if (hurt) lean = -6.5;

    // 1 legging legs + red pumps (strut lifts the toe)
    const fx = moving ? step * 8 : 0;
    const flift = moving ? Math.max(0, step) * 5 : 0;
    const blift = moving ? Math.max(0, -step) * 5 : 0;
    seg(g, -4, -46, -6 - fx, -6 - blift, 6, YV_LEG_OUT, YV_LEG_MID);
    yvPump(g, -6 - fx, -blift);
    seg(g, 5, -46, 6 + fx, -6 - flift, 6, YV_LEG_OUT, YV_LEG_MID);
    g.strokeStyle = YV_LEG_LT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(3.6, -44); g.lineTo(4.6 + fx, -10 - flift); g.stroke();
    yvPump(g, 6 + fx, -flift);

    g.translate(0, -bob);
    g.translate(0, -50); g.rotate(lean * 0.013); g.translate(0, 50);

    // 2 A-line skirt, swishing with the hips
    const swish = moving ? step * 2 : sway * 0.8;
    g.fillStyle = YV_DR_MID; g.strokeStyle = YV_DR_OUT; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-9, -56);
    g.lineTo(-13 + swish * 0.6, -38);
    g.quadraticCurveTo(1, -34.5, 14 + swish, -38);
    g.lineTo(10, -56);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = YV_DR_LT;
    g.beginPath();
    g.moveTo(-9, -56); g.lineTo(-12.4 + swish * 0.6, -39);
    g.lineTo(-6.5 + swish * 0.4, -38.4); g.lineTo(-4.4, -56);
    g.closePath(); g.fill();
    g.fillStyle = YV_DR_DK;
    g.beginPath();
    g.moveTo(10, -56); g.lineTo(13.4 + swish, -38.6);
    g.lineTo(7.5 + swish * 0.6, -37.6); g.lineTo(5.6, -56);
    g.closePath(); g.fill();
    g.strokeStyle = YV_DR_DK; g.lineWidth = 1.4; // skirt folds
    g.beginPath();
    g.moveTo(-3.5, -54); g.lineTo(-5 + swish * 0.4, -39);
    g.moveTo(3, -54); g.lineTo(4.5 + swish * 0.6, -38);
    g.stroke();

    // 3 gold belt
    g.fillStyle = YV_BELT; g.strokeStyle = YV_BELT_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.roundRect(-9.5, -58.5, 20, 5.5, 2); g.fill(); g.stroke();
    g.fillStyle = YV_BELT_LT; g.fillRect(-8.5, -57.8, 18, 1.6);
    g.strokeStyle = YV_BELT_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0.5, -55.8, 2.2, 0, 7); g.stroke();

    // 4 back arm: staple pose is the hand on the hip
    if (strike) {
      seg2(g, -7, -69, -13, -62, -16, -54, 4.4, YV_SKIN_OUT, YV_SKIN_DK);
      g.fillStyle = YV_SKIN_DK; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(-16, -54, 2.6, 0, 7); g.fill(); g.stroke();
    } else {
      seg2(g, -7, -69, -14, -63, -9, -56, 4.4, YV_SKIN_OUT, YV_SKIN_DK);
      g.fillStyle = YV_SKIN_DK; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(-9, -56, 2.6, 0, 7); g.fill(); g.stroke();
    }
    g.fillStyle = YV_DR_MID; g.strokeStyle = YV_DR_OUT; g.lineWidth = 1.8; // puff sleeve
    g.beginPath(); g.arc(-7.5, -69, 4.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = YV_DR_HI;
    g.beginPath(); g.arc(-9, -70.6, 1.8, 0, 7); g.fill();

    // 5 fitted bodice with a V neck
    g.fillStyle = YV_DR_MID; g.strokeStyle = YV_DR_OUT; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-9, -56);
    g.lineTo(-8, -68);
    g.quadraticCurveTo(-8.5, -73, -4, -73.5);
    g.lineTo(8, -73.5);
    g.quadraticCurveTo(12.5, -73, 11.5, -68);
    g.lineTo(10, -56);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = YV_DR_LT;
    g.beginPath();
    g.moveTo(-9, -57); g.lineTo(-8.2, -68);
    g.quadraticCurveTo(-8.4, -72.6, -4, -73.5);
    g.lineTo(-1.6, -73.5); g.lineTo(-3.6, -57);
    g.closePath(); g.fill();
    g.fillStyle = YV_DR_DK;
    g.beginPath();
    g.moveTo(10, -57); g.lineTo(11.2, -68); g.lineTo(7.2, -68); g.lineTo(6.4, -57);
    g.closePath(); g.fill();
    g.fillStyle = YV_SKIN_MID; g.strokeStyle = YV_DR_OUT; g.lineWidth = 1.8; // V of collarbone
    g.beginPath(); g.moveTo(-2.8, -73.5); g.lineTo(2, -66.5); g.lineTo(6.8, -73.5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = YV_GOLD; // pendant
    g.beginPath(); g.arc(2, -68.4, 1.3, 0, 7); g.fill();

    // 6 neck + face (hair-colored backplate first so the carve never leaks)
    g.fillStyle = YV_SKIN_DK; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.rect(-0.5, -78, 6, 6); g.fill(); g.stroke();
    g.fillStyle = YV_HAIR_DK;
    g.beginPath(); g.ellipse(2.5, -86, 12.5, 11, 0, 0, 7); g.fill();
    g.fillStyle = YV_SKIN_MID; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(2.5, -83, 7.8, 8.6, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(2.5, -83, 7.8, 8.6, 0, 0, 7); g.clip();
    g.fillStyle = YV_SKIN_LT;
    g.beginPath(); g.ellipse(-1, -87, 4.6, 3.6, -0.4, 0, 7); g.fill();
    g.fillStyle = YV_SKIN_DK; g.fillRect(8, -93, 4, 22);
    g.restore();

    // 7 the BIG styled hair — a fat halo mass, carved with curls
    g.fillStyle = YV_HAIR_MID; g.strokeStyle = YV_HAIR_OUT; g.lineWidth = 2.4;
    const hsw = strike ? -1.5 : sway * 0.5; // swings on the fling
    g.beginPath();
    g.moveTo(-5 + hsw, -72);
    g.quadraticCurveTo(-11.5 + hsw, -69.5, -15 + hsw, -74.5);
    g.quadraticCurveTo(-18.5 + hsw, -80, -16.5 + hsw, -87);
    g.quadraticCurveTo(-16.5 + hsw, -95.5, -9 + hsw * 0.6, -99);
    g.quadraticCurveTo(0, -103.5, 9.5, -100);
    g.quadraticCurveTo(18.5, -96, 19.5, -87);
    g.quadraticCurveTo(21, -79, 17, -73.5);
    g.quadraticCurveTo(13.5, -68.8, 8.5, -71.5);
    g.quadraticCurveTo(13.2, -74.5, 13.4, -80);
    g.quadraticCurveTo(13, -87.5, 8, -90.4);
    g.quadraticCurveTo(0.5, -93.4, -4.4, -88.6);
    g.quadraticCurveTo(-8, -84.5, -6.6, -78.5)
    g.quadraticCurveTo(-6.2, -74.6, -5 + hsw, -72);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = YV_HAIR_DK; // under-shade on the sun-away lobe
    g.beginPath();
    g.moveTo(17, -73.5);
    g.quadraticCurveTo(21, -79, 19.5, -87);
    g.quadraticCurveTo(17.6, -80.5, 14, -76);
    g.quadraticCurveTo(12, -72.5, 8.5, -71.5);
    g.quadraticCurveTo(13.5, -68.8, 17, -73.5);
    g.closePath(); g.fill();
    g.strokeStyle = YV_HAIR_DK; g.lineWidth = 1.6; // curl carving
    for (let i = 0; i < 24; i += 3) {
      g.beginPath(); g.arc(YV_CURL[i] + hsw * 0.5, YV_CURL[i + 1], YV_CURL[i + 2], 0.6, 4.2); g.stroke();
    }
    g.strokeStyle = YV_HAIR_HI; g.lineWidth = 1.6; // key-light sheen
    g.beginPath(); g.moveTo(-10 + hsw * 0.6, -96); g.quadraticCurveTo(-1, -101, 8, -98); g.stroke();
    g.strokeStyle = YV_HAIR_LT; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-13.5 + hsw * 0.6, -89); g.quadraticCurveTo(-12, -94.5, -6, -97.5); g.stroke();

    // 8 hoop earrings, swinging with the sway
    const esw = sway * 0.8 + (strike ? -1.2 : 0);
    g.strokeStyle = YV_GOLD_DK; g.lineWidth = 2;
    g.beginPath(); g.arc(-6.5 + esw * 0.4, -75.5, 3.1, 0, 7); g.stroke();
    g.beginPath(); g.arc(11.5 + esw * 0.4, -76, 3.1, 0, 7); g.stroke();
    g.strokeStyle = YV_GOLD; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-6.5 + esw * 0.4, -75.5, 3.1, 2.6, 5.9); g.stroke();
    g.beginPath(); g.arc(11.5 + esw * 0.4, -76, 3.1, 2.6, 5.9); g.stroke();

    // 9 the face: lashes, shadow, red lips
    if (hurt) {
      g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-1.4, -85.6); g.lineTo(1.6, -82.8);
      g.moveTo(1.6, -85.6); g.lineTo(-1.4, -82.8);
      g.moveTo(5, -85.8); g.lineTo(8, -83);
      g.moveTo(8, -85.8); g.lineTo(5, -83);
      g.stroke();
      g.strokeStyle = YV_LIP_DK; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(2, -77.4); g.quadraticCurveTo(4.5, -76, 7, -77.6); g.stroke();
    } else if (windup) {
      // eyes closed for the kiss
      g.fillStyle = YV_SHADOW_EYE;
      g.beginPath(); g.ellipse(0.2, -85, 2.6, 1.6, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(6.6, -85.2, 2.4, 1.5, 0, 0, 7); g.fill();
      g.strokeStyle = YV_HAIR_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-2, -84); g.quadraticCurveTo(0.2, -82.6, 2.4, -84);
      g.moveTo(4.4, -84.2); g.quadraticCurveTo(6.6, -82.8, 8.8, -84.2);
      g.stroke();
      g.beginPath(); // lash flicks
      g.moveTo(-2, -84); g.lineTo(-3, -83);
      g.moveTo(8.8, -84.2); g.lineTo(9.8, -83.2);
      g.stroke();
    } else {
      g.fillStyle = YV_SHADOW_EYE;
      g.beginPath(); g.ellipse(0.2, -85.6, 2.7, 1.7, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(6.6, -85.8, 2.5, 1.6, 0, 0, 7); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(0.2, -84.4, 2.5, 2, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(6.8, -84.6, 2.3, 1.9, 0, 0, 7); g.fill();
      g.fillStyle = YV_HAIR_OUT;
      g.beginPath(); g.arc(1, -84.4, 1.2, 0, 7); g.fill();
      g.beginPath(); g.arc(7.5, -84.6, 1.2, 0, 7); g.fill();
      g.strokeStyle = YV_HAIR_OUT; g.lineWidth = 1.5; // heavy top lash line
      g.beginPath();
      g.moveTo(-2.2, -86.2); g.quadraticCurveTo(0.2, -87.2, 2.6, -86.4);
      g.moveTo(4.4, -86.6); g.quadraticCurveTo(6.8, -87.5, 9.2, -86.6);
      g.stroke();
      g.beginPath();
      g.moveTo(-2.2, -86.2); g.lineTo(-3.4, -87);
      g.moveTo(9.2, -86.6); g.lineTo(10.4, -87.4);
      g.stroke();
      g.strokeStyle = YV_HAIR_DK; g.lineWidth = 1.2; // thin confident brows
      g.beginPath();
      g.moveTo(-2.4, -89.2); g.quadraticCurveTo(0.2, -90.4, 2.6, -89.4);
      g.moveTo(4.6, -89.6); g.quadraticCurveTo(7, -90.7, 9.4, -89.6);
      g.stroke();
    }
    g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.3; // nose
    g.beginPath(); g.moveTo(8.8, -83); g.lineTo(10, -81); g.lineTo(8.2, -80.6); g.stroke();
    g.fillStyle = YV_BLUSH;
    g.beginPath(); g.ellipse(-2.2, -81, 2.2, 1.2, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(8.6, -81.4, 2, 1.1, 0, 0, 7); g.fill();
    if (windup) { // puckered for launch
      g.fillStyle = YV_LIP; g.strokeStyle = YV_LIP_DK; g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(7.8, -78.4, 1.9, 1.6, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = YV_LIP_DK; g.lineWidth = 1;
      g.beginPath(); g.moveTo(7, -78.4); g.lineTo(8.6, -78.4); g.stroke();
    } else if (!hurt) {
      g.fillStyle = YV_LIP; g.strokeStyle = YV_LIP_DK; g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(1, -78.2);
      g.quadraticCurveTo(2.8, -79.6, 4.4, -78.6);
      g.quadraticCurveTo(6, -79.6, 7.8, -78.4);
      g.quadraticCurveTo(6.5, -75.6, 4.2, -75.8);
      g.quadraticCurveTo(2.2, -76, 1, -78.2);
      g.closePath(); g.fill(); g.stroke();
      if (strike) { // open dazzling smile as the kiss flies
        g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(2, -78.2); g.quadraticCurveTo(4.4, -77, 7, -78.2); g.lineTo(6.4, -77); g.quadraticCurveTo(4.4, -76.4, 2.6, -77.2); g.closePath(); g.fill();
      }
    }

    // 10 front arm: hip, lips, or the big fling
    if (windup) {
      seg2(g, 9, -69, 15, -73, 9.5, -78.5, 4.4, YV_SKIN_OUT, YV_SKIN_MID);
      g.fillStyle = YV_SKIN_MID; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(9.8, -78.8, 2.6, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = YV_SKIN_DK; g.lineWidth = 1;
      g.beginPath(); g.moveTo(8.8, -80.6); g.lineTo(10.6, -80.2); g.stroke();
    } else if (strike) {
      seg2(g, 9, -69, 17, -72, 25, -76, 4.4, YV_SKIN_OUT, YV_SKIN_MID);
      g.fillStyle = YV_SKIN_MID; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(25.5, -76.5, 2.7, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = YV_SKIN_DK; g.lineWidth = 1.1; // fingers flung open
      g.beginPath();
      g.moveTo(27.4, -78.8); g.lineTo(28.8, -80.2);
      g.moveTo(28, -76.6); g.lineTo(29.8, -77.2);
      g.moveTo(27.6, -74.6); g.lineTo(29.4, -74.2);
      g.stroke();
      g.strokeStyle = YV_SPARK; g.lineWidth = 1.3; // glitter in the wake
      g.beginPath();
      g.moveTo(19, -84); g.lineTo(19, -80); g.moveTo(17, -82); g.lineTo(21, -82);
      g.moveTo(28, -68); g.lineTo(28, -65); g.moveTo(26.5, -66.5); g.lineTo(29.5, -66.5);
      g.stroke();
    } else {
      const fsw = moving ? step * 3 : sway * 1.2;
      seg2(g, 9, -69, 13, -61, 12 + fsw * 0.4, -52, 4.4, YV_SKIN_OUT, YV_SKIN_MID);
      g.fillStyle = YV_SKIN_MID; g.strokeStyle = YV_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(12 + fsw * 0.4, -52, 2.6, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = YV_GOLD; g.lineWidth = 1.4; // bracelet
      g.beginPath(); g.moveTo(10.6 + fsw * 0.4, -55.6); g.lineTo(13.6 + fsw * 0.4, -55); g.stroke();
    }
    g.fillStyle = YV_DR_MID; g.strokeStyle = YV_DR_OUT; g.lineWidth = 1.8; // front puff sleeve
    g.beginPath(); g.arc(9.5, -69.5, 4.8, 0, 7); g.fill(); g.stroke();
    g.fillStyle = YV_DR_HI;
    g.beginPath(); g.arc(8, -71.2, 1.9, 0, 7); g.fill();
  };

  // ---- COLLETTE, CALM: mom before the turn (cutscene) ----
  const CC_SKIN_OUT = '#7c4a34', CC_SKIN_DK = '#b0765a', CC_SKIN_MID = '#dba687', CC_SKIN_LT = '#f2cbae';
  const CC_BL_OUT = '#7c6a52', CC_BL_DK = '#bfae92', CC_BL_MID = '#e7dcc6', CC_BL_LT = '#f7f0e0';
  const CC_FLO_P = '#bc5f80', CC_FLO_B = '#6f86b8', CC_FLO_C = '#e8c050', CC_LEAF = '#7c9a5e';
  const CC_SL_OUT = '#1c3034', CC_SL_DK = '#2f484d', CC_SL_MID = '#436064', CC_SL_LT = '#628287';
  const CC_SH_OUT = '#5c3a34', CC_SH_MID = '#8a5e54', CC_SH_LT = '#b08578';
  const CC_SC_OUT = '#35506a', CC_SC_DK = '#5b7c96', CC_SC_MID = '#88abc2', CC_SC_LT = '#b6d3e2', CC_SC_DOT = '#f0f6fa';
  const CC_ROLL = '#d88a9e', CC_ROLL_DK = '#a75b72', CC_ROLL_HI = '#efb6c4';
  const CC_HAIR = '#9a8d80', CC_HAIR_DK = '#6e6156';
  const CC_GOLD = '#c8a84a', CC_GOLD_DK = '#8a7222';
  const CC_LENS = 'rgba(220,235,240,0.4)';
  const CC_MOUTH = '#5c3028';
  // blouse flowers: x, y, kind (0 pink / 1 blue)
  const CC_FLW = [-7, -62, 0, -1, -57, 1, 6, -64, 1, 9, -55, 0, -4, -68, 1, 3, -71, 0];
  // scarf dots: x, y
  const CC_SCD = [-4, -96.4, 3, -98.3, 9, -94.6, -7.6, -91.8];

  BOSS.collettecalm = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const breath = Math.sin(t * 1.8);
    const bob = moving ? Math.abs(step) * 1.8 : breath * 0.5;
    let lean = moving ? step * 0.8 : 0;
    if (windup) lean = -2.5;
    else if (strike) lean = 3.5;
    if (hurt) lean = -5;

    // 1 slacks + house slippers; idle taps the front toe
    const fx = moving ? step * 6 : 0;
    const flift = moving ? Math.max(0, step) * 4 : Math.max(0, Math.sin(t * 2.6)) * 1.6;
    const blift = moving ? Math.max(0, -step) * 4 : 0;
    g.fillStyle = CC_SH_MID; g.strokeStyle = CC_SH_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-13 - fx, -6 - blift, 14, 6, 2.6); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(0 + fx, -6 - flift, 15, 6, 2.6); g.fill(); g.stroke();
    g.fillStyle = CC_SH_LT;
    g.beginPath(); g.ellipse(-6 - fx, -4.4 - blift, 3.4, 1.6, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(8 + fx, -4.4 - flift, 3.6, 1.6, 0, 0, 7); g.fill();
    // wide polyester slack legs
    seg(g, -6, -48, -7 - fx * 0.7, -5 - blift, 10, CC_SL_OUT, CC_SL_DK);
    seg(g, 7, -48, 8 + fx * 0.7, -5 - flift, 10.5, CC_SL_OUT, CC_SL_MID);
    g.strokeStyle = CC_SL_LT; g.lineWidth = 1.6; // pressed crease
    g.beginPath(); g.moveTo(5, -46); g.lineTo(6 + fx * 0.7, -8 - flift); g.stroke();

    g.translate(0, -bob);
    g.translate(0, -50); g.rotate(lean * 0.012); g.translate(0, 50);

    // 2 hips
    g.fillStyle = CC_SL_MID; g.strokeStyle = CC_SL_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.roundRect(-13, -55, 27, 9, 3.5); g.fill(); g.stroke();
    g.fillStyle = CC_SL_LT; g.fillRect(-12, -54, 5, 7);

    // 3 floral blouse, matronly and square
    const chest = breath * 0.8;
    g.fillStyle = CC_BL_MID; g.strokeStyle = CC_BL_OUT; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-13, -52);
    g.quadraticCurveTo(-16, -63, -13, -72 + chest);
    g.quadraticCurveTo(-11, -77 + chest, -5, -78 + chest);
    g.lineTo(8, -78 + chest);
    g.quadraticCurveTo(14, -77 + chest, 15, -71 + chest);
    g.quadraticCurveTo(17.5, -62, 15, -52);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CC_BL_LT; // top-left key
    g.beginPath();
    g.moveTo(-13, -53); g.quadraticCurveTo(-15.4, -63, -12.6, -71 + chest);
    g.quadraticCurveTo(-10.7, -76.6 + chest, -5, -78 + chest);
    g.lineTo(-2, -78 + chest); g.lineTo(-6, -53);
    g.closePath(); g.fill();
    g.fillStyle = CC_BL_DK;
    g.beginPath();
    g.moveTo(15, -53); g.quadraticCurveTo(17, -61, 15.4, -69);
    g.lineTo(10.4, -69); g.quadraticCurveTo(11.6, -60, 9.8, -53);
    g.closePath(); g.fill();
    // the floral print
    for (let i = 0; i < 18; i += 3) {
      const fpx = CC_FLW[i], fpy = CC_FLW[i + 1];
      g.fillStyle = CC_FLW[i + 2] === 0 ? CC_FLO_P : CC_FLO_B;
      g.beginPath(); g.arc(fpx - 1.4, fpy, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(fpx + 1.4, fpy, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(fpx, fpy - 1.4, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(fpx, fpy + 1.4, 1.1, 0, 7); g.fill();
      g.fillStyle = CC_FLO_C;
      g.beginPath(); g.arc(fpx, fpy, 0.9, 0, 7); g.fill();
      g.strokeStyle = CC_LEAF; g.lineWidth = 1;
      g.beginPath(); g.moveTo(fpx + 1.8, fpy + 1.6); g.lineTo(fpx + 3, fpy + 2.6); g.stroke();
    }
    // rounded collar
    g.fillStyle = CC_BL_LT; g.strokeStyle = CC_BL_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(-1.5, -76 + chest, 3.4, 2.4, 0.3, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(5.5, -76 + chest, 3.4, 2.4, -0.3, 0, 7); g.fill(); g.stroke();

    // 4 arms: crossed by default — the whole posture reads "well?"
    // back forearm first, then the front one laid over it
    g.strokeStyle = CC_BL_OUT; g.lineWidth = 9.5;
    g.beginPath(); g.moveTo(-11, -68 + chest); g.lineTo(-13, -63); g.stroke();
    g.strokeStyle = CC_BL_DK; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-11, -68 + chest); g.lineTo(-13, -63); g.stroke();
    seg(g, -13, -63, 9, -60, 7.5, CC_BL_OUT, CC_BL_DK);
    g.fillStyle = CC_SKIN_DK; g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(10.5, -60, 2.6, 0, 7); g.fill(); g.stroke();
    if (windup || strike) {
      // the finger: raised on windup, jabbed forward on strike
      const px2 = strike ? 16 : 11, py2 = strike ? -68 : -76;
      g.strokeStyle = CC_BL_OUT; g.lineWidth = 9.5;
      g.beginPath(); g.moveTo(12, -70 + chest); g.lineTo(15, -66); g.stroke();
      g.strokeStyle = CC_BL_MID; g.lineWidth = 7;
      g.beginPath(); g.moveTo(12, -70 + chest); g.lineTo(15, -66); g.stroke();
      seg(g, 15, -66, px2, py2, 4.4, CC_SKIN_OUT, CC_SKIN_MID);
      g.fillStyle = CC_SKIN_MID; g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(px2, py2, 2.6, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = CC_SKIN_MID; g.lineWidth = 2.2; // the index
      g.beginPath();
      if (strike) { g.moveTo(px2 + 1, py2); g.lineTo(px2 + 5.5, py2 - 1); }
      else { g.moveTo(px2, py2 - 1); g.lineTo(px2 + 1, py2 - 5.5); }
      g.stroke();
    } else {
      seg(g, 11, -64 + chest, -11, -57, 7.5, CC_BL_OUT, CC_BL_MID);
      g.strokeStyle = CC_BL_LT; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(8, -66.5 + chest); g.lineTo(-8, -59.5); g.stroke();
      g.fillStyle = CC_SKIN_MID; g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(-12, -57, 2.6, 0, 7); g.fill(); g.stroke();
    }

    // 5 head
    g.fillStyle = CC_SKIN_DK; g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.rect(-1.5, -80, 7, 5); g.fill(); g.stroke();
    g.fillStyle = CC_SKIN_MID; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(2, -85, 8.4, 8.8, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(2, -85, 8.4, 8.8, 0, 0, 7); g.clip();
    g.fillStyle = CC_SKIN_LT;
    g.beginPath(); g.ellipse(-2, -89, 4.6, 3.6, -0.4, 0, 7); g.fill();
    g.fillStyle = CC_SKIN_DK; g.fillRect(8, -95, 4, 22);
    g.restore();
    g.fillStyle = CC_SKIN_DK; g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.3; // ear
    g.beginPath(); g.ellipse(-5.6, -83.6, 1.8, 2.5, 0, 0, 7); g.fill(); g.stroke();
    // jowl + brow furrow ticks: she has Seen Things
    g.strokeStyle = CC_SKIN_DK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-3.2, -79.6); g.quadraticCurveTo(-2.2, -78, -0.6, -77.6);
    g.moveTo(9.2, -79.8); g.quadraticCurveTo(8.6, -78.2, 7.2, -77.6);
    g.moveTo(1.2, -91.4); g.lineTo(3.2, -91);
    g.stroke();

    // 6 stern face: glare pitched over the reading glasses
    if (hurt) {
      g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-1.6, -87.6); g.lineTo(1.4, -84.8);
      g.moveTo(1.4, -87.6); g.lineTo(-1.6, -84.8);
      g.moveTo(4.8, -87.8); g.lineTo(7.8, -85);
      g.moveTo(7.8, -87.8); g.lineTo(4.8, -85);
      g.stroke();
      g.fillStyle = CC_MOUTH;
      g.beginPath(); g.ellipse(3.4, -79.2, 1.6, 1.9, 0, 0, 7); g.fill();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(0, -86.4, 2.4, 1.9, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(6.4, -86.6, 2.2, 1.8, 0, 0, 7); g.fill();
      g.fillStyle = CC_HAIR_DK;
      g.beginPath(); g.arc(0.8, -86.2, 1.15, 0, 7); g.fill();
      g.beginPath(); g.arc(7.1, -86.4, 1.15, 0, 7); g.fill();
      g.fillStyle = CC_SKIN_MID; // heavy flat lids
      g.fillRect(-2.5, -88.9, 5.2, 1.7);
      g.fillRect(4, -89.1, 4.8, 1.7);
      g.strokeStyle = CC_HAIR_DK; g.lineWidth = 1.5; // knit brows
      const bd = windup || strike ? 1 : 0; // deepen for the scolding
      g.beginPath();
      g.moveTo(-2.6, -90.4); g.lineTo(2.4, -89.6 - bd);
      g.moveTo(4.4, -89.6 - bd); g.lineTo(9.2, -90.6);
      g.stroke();
      g.strokeStyle = CC_MOUTH; g.lineWidth = 1.5; // pressed-flat mouth
      g.beginPath(); g.moveTo(0.6, -78.6); g.lineTo(6.6, -78.8); g.stroke();
      g.strokeStyle = CC_SKIN_DK; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0.6, -78.6); g.lineTo(-0.2, -77.8);
      g.moveTo(6.6, -78.8); g.lineTo(7.4, -78);
      g.stroke();
    }
    g.strokeStyle = CC_SKIN_OUT; g.lineWidth = 1.4; // nose
    g.beginPath(); g.moveTo(8.6, -85.2); g.lineTo(10, -82.4); g.lineTo(7.8, -82); g.stroke();
    g.fillStyle = CC_SKIN_DK; // beauty mark
    g.beginPath(); g.arc(9.4, -78.6, 0.7, 0, 7); g.fill();

    // 7 reading glasses low on the nose + chain to the shoulders
    g.strokeStyle = CC_GOLD_DK; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(-2.6, -83.4, 5.4, 3.2, 1.4); g.stroke();
    g.beginPath(); g.roundRect(4.2, -83.6, 5.2, 3.2, 1.4); g.stroke();
    g.beginPath(); g.moveTo(2.8, -82.6); g.lineTo(4.2, -82.7); g.stroke();
    g.fillStyle = CC_LENS;
    g.beginPath(); g.roundRect(-2.6, -83.4, 5.4, 3.2, 1.4); g.fill();
    g.beginPath(); g.roundRect(4.2, -83.6, 5.2, 3.2, 1.4); g.fill();
    g.strokeStyle = CC_GOLD; g.lineWidth = 1; // the chain
    g.beginPath();
    g.moveTo(-2.6, -82); g.quadraticCurveTo(-8, -77.5, -8.6, -72.5);
    g.moveTo(9.4, -82.2); g.quadraticCurveTo(13.6, -77.5, 13.8, -72.5);
    g.stroke();
    g.fillStyle = CC_GOLD_DK; // chain beads
    g.beginPath(); g.arc(-6.4, -77.2, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(-8.3, -74.4, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(12.2, -77.4, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(13.6, -74.6, 0.7, 0, 7); g.fill();

    // 8 rollers peeking under the scarf, then the scarf over the crown
    g.fillStyle = CC_HAIR; // grey hair at the temples
    g.beginPath(); g.ellipse(-5.8, -88, 2, 2.8, 0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(10, -88.5, 1.9, 2.6, -0.5, 0, 7); g.fill();
    g.fillStyle = CC_ROLL; g.strokeStyle = CC_ROLL_DK; g.lineWidth = 1.3;
    g.beginPath(); g.roundRect(-4.4, -94.2, 4.2, 2.8, 1.4); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(0.4, -95.1, 4.2, 2.8, 1.4); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(5.2, -94, 4.2, 2.8, 1.4); g.fill(); g.stroke();
    g.strokeStyle = CC_ROLL_DK; g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-2.3, -94.2); g.lineTo(-2.3, -91.4);
    g.moveTo(2.5, -95.1); g.lineTo(2.5, -92.3);
    g.moveTo(7.3, -94); g.lineTo(7.3, -91.2);
    g.stroke();
    g.fillStyle = CC_ROLL_HI;
    g.beginPath(); g.arc(-3.3, -93.5, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(1.5, -94.4, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(6.3, -93.3, 0.7, 0, 7); g.fill();
    // hairline band under the rollers so skull and rollers don't touch
    g.fillStyle = CC_HAIR;
    g.beginPath(); g.ellipse(2.4, -91.6, 7.6, 2.2, 0, 0, 7); g.fill();
    g.strokeStyle = CC_HAIR_DK; g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-3.4, -92.4); g.lineTo(-2.4, -90.8);
    g.moveTo(1.4, -93); g.lineTo(2.2, -91);
    g.moveTo(6.2, -92.4); g.lineTo(7, -90.8);
    g.stroke();
    // the kerchief
    g.fillStyle = CC_SC_MID; g.strokeStyle = CC_SC_OUT; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-8.8, -89);
    g.quadraticCurveTo(-9.8, -96.5, -2.5, -99);
    g.quadraticCurveTo(3, -100.6, 8.5, -98.2);
    g.quadraticCurveTo(13.2, -96, 12.8, -89.5);
    g.quadraticCurveTo(10.4, -94.2, 5.5, -95.8);
    g.quadraticCurveTo(-0.5, -97.4, -5.4, -94.6);
    g.quadraticCurveTo(-8, -92.6, -8.8, -89);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CC_SC_LT; // lit fold
    g.beginPath();
    g.moveTo(-7.4, -92.6);
    g.quadraticCurveTo(-7.6, -96.6, -2.4, -98.4);
    g.lineTo(0.4, -98.8);
    g.quadraticCurveTo(-4.4, -96.8, -6.2, -93.6);
    g.closePath(); g.fill();
    g.fillStyle = CC_SC_DOT;
    for (let i = 0; i < 8; i += 2) {
      g.beginPath(); g.arc(CC_SCD[i], CC_SCD[i + 1], 0.8, 0, 7); g.fill();
    }
    // knot + fluttering tail at the nape
    g.fillStyle = CC_SC_DK; g.strokeStyle = CC_SC_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.arc(-8.2, -88.8, 2, 0, 7); g.fill(); g.stroke();
    const flut = Math.sin(t * 2.2) * 1.4;
    g.beginPath();
    g.moveTo(-9.4, -88);
    g.quadraticCurveTo(-13.5, -85.4 + flut, -12.6, -81 + flut);
    g.quadraticCurveTo(-11, -83.4, -8.6, -86.6);
    g.closePath(); g.fill(); g.stroke();
  };

  // ---- COLLETTE: the ghastly form ----
  const CG_SKIN_OUT = '#232b3c', CG_SKIN_DK = '#5c6876', CG_SKIN_MID = '#8b98a3', CG_SKIN_LT = '#b0bdc7', CG_SKIN_HI = '#d2dee6';
  const CG_GN_OUT = '#3c3358', CG_GN_DK = '#5f5480', CG_GN_MID = '#8478a5', CG_GN_LT = '#a89dc6', CG_GN_HI = '#cbc2e2';
  const CG_HR_OUT = '#6e7890', CG_HR_DK = '#a8b2c6', CG_HR_MID = '#dde4ee', CG_HR_LT = '#ffffff';
  const CG_MAW = '#200e2c', CG_TEETH = '#e0dcc8', CG_TEETH_DK = '#a89f88';
  const CG_NAIL = '#e8e2cc', CG_NAIL_DK = '#a8a184';
  const CG_EYE_SOCK = 'rgba(16,20,34,0.55)';
  const CG_EYE_GLOW = 'rgba(190,255,225,0.4)';
  const CG_EYE_CORE = '#c8ffe4';
  const CG_MIST_A = 'rgba(168,198,220,0.3)', CG_MIST_B = 'rgba(168,198,220,0.16)';
  // cold wisps: x, baseY, phase
  const CG_MIST = [-18, -66, 0.4, -4, -80, 1.9, 14, -72, 3.6];
  // tattered hem: x,y zigzag pairs, left to right
  const CG_HEM = [-19, -13, -14.5, -6, -10, -12, -4.5, -5, 1, -12, 6, -6, 10, -11.5, 14, -6.5, 17, -12];
  // finger length spread so the talons read as a hand, not a rake
  const CG_FLEN = [0.85, 1.1, 1.22, 0.98];

  // ragged sleeve cuff jags, fanned along the forearm direction
  function cgCuff(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = CG_GN_DK; g.strokeStyle = CG_GN_OUT; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-1.5, -4.5); g.lineTo(4.5, -3); g.lineTo(-1.5, -1.2); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-1.5, -1.6); g.lineTo(5.5, 0.2); g.lineTo(-1.5, 2); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-1.5, 1.6); g.lineTo(4.5, 3.2); g.lineTo(-1.5, 4.8); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }

  // splayed claw: grey fingers, long bone nails hooking inward
  function cgClaw(g, x, y, ang, spread) {
    for (let i = 0; i < 4; i++) {
      const fa = ang + (i - 1.5) * spread;
      const fl = 8 * CG_FLEN[i];
      const ca = Math.cos(fa), sa = Math.sin(fa);
      const fx = x + ca * fl, fy = y + sa * fl;
      const na = fa + 0.28;
      const nl = 6.5 * CG_FLEN[i];
      const nx = fx + Math.cos(na) * nl, ny = fy + Math.sin(na) * nl;
      g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 3.6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(fx, fy); g.stroke();
      g.strokeStyle = CG_SKIN_DK; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(fx, fy); g.stroke();
      g.strokeStyle = CG_NAIL_DK; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(nx, ny); g.stroke();
      g.strokeStyle = CG_NAIL; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(nx, ny); g.stroke();
    }
    g.fillStyle = CG_SKIN_MID; g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(x, y, 2.7, 0, 7); g.fill(); g.stroke();
    g.fillStyle = CG_SKIN_LT;
    g.beginPath(); g.arc(x - 0.9, y - 1, 1, 0, 7); g.fill();
  }

  BOSS.collette = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const drift = Math.sin(t * 1.1);                  // slow haunted sway
    const twitch = Math.sin(t * 9.5) * 0.6;           // wrong little tremor
    const bob = moving ? Math.abs(step) * 3 : drift * 1.2;

    // pose skeleton: chest and head travel between stances
    let cx = 6, cy = -60, hx = 17, hy = -69;
    if (windup) { cx = -2; cy = -66; hx = 2; hy = -82; }
    else if (strike) { cx = 11; cy = -55; hx = 23; hy = -63; }
    if (hurt) { cx = 1; cy = -62; hx = 6, hy = -75; }

    // 1 cold graveyard wisps
    g.lineWidth = 1.5;
    for (let i = 0; i < 9; i += 3) {
      const mx = CG_MIST[i], my = CG_MIST[i + 1];
      const wob = Math.sin(t * 2.2 + CG_MIST[i + 2]) * 2.8;
      g.strokeStyle = CG_MIST_A;
      g.beginPath();
      g.moveTo(mx, my);
      g.quadraticCurveTo(mx + wob, my - 7, mx - wob, my - 13);
      g.stroke();
      g.strokeStyle = CG_MIST_B;
      g.beginPath();
      g.moveTo(mx - wob, my - 13);
      g.quadraticCurveTo(mx + wob, my - 19, mx - wob * 0.7, my - 25);
      g.stroke();
    }

    // 2 bare grey feet under the hem
    const fx = moving ? step * 5 : 0;
    g.fillStyle = CG_SKIN_MID; g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-12 - fx, -5, 12, 5, 2.2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(1 + fx, -5, 13, 5, 2.2); g.fill(); g.stroke();
    g.fillStyle = CG_NAIL_DK; // toenail ticks
    g.beginPath(); g.arc(-2.4 - fx, -1.6, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(12 + fx, -1.6, 0.9, 0, 7); g.fill();
    g.fillStyle = CG_SKIN_LT;
    g.beginPath(); g.ellipse(-6 - fx, -3.6, 2.6, 1.2, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(7 + fx, -3.6, 2.8, 1.2, 0, 0, 7); g.fill();

    g.translate(0, -bob);

    // 3 the nightgown, hunched bell with a tattered hem
    g.fillStyle = CG_GN_MID; g.strokeStyle = CG_GN_OUT; g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(CG_HEM[0], CG_HEM[1]);
    for (let i = 2; i < 18; i += 2) g.lineTo(CG_HEM[i], CG_HEM[i + 1]);
    g.quadraticCurveTo(19, -34, cx + 12, cy - 2);
    g.quadraticCurveTo(cx + 10, cy - 10, cx + 2, cy - 11);
    g.quadraticCurveTo(cx - 7, cy - 10.5, cx - 9, cy - 3);
    g.quadraticCurveTo(-19, -36, CG_HEM[0], CG_HEM[1]);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CG_GN_LT; // key light down the near side
    g.beginPath();
    g.moveTo(cx - 9, cy - 3);
    g.quadraticCurveTo(cx - 7, cy - 10.5, cx + 2, cy - 11);
    g.lineTo(cx + 2, cy - 6);
    g.quadraticCurveTo(cx - 4, cy - 6, cx - 5.5, cy - 1);
    g.quadraticCurveTo(-13, -32, -16.5, -11);
    g.lineTo(-19, -13);
    g.quadraticCurveTo(-17, -36, cx - 9, cy - 3);
    g.closePath(); g.fill();
    g.fillStyle = CG_GN_DK; // gutter folds
    g.beginPath();
    g.moveTo(cx + 12, cy - 2);
    g.quadraticCurveTo(19, -34, 17, -12);
    g.lineTo(12.4, -9);
    g.quadraticCurveTo(13, -34, cx + 7, cy - 4);
    g.closePath(); g.fill();
    g.strokeStyle = CG_GN_DK; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(cx - 2, cy - 4); g.quadraticCurveTo(-4, -36, -6, -12);
    g.moveTo(cx + 4, cy - 4); g.quadraticCurveTo(6, -34, 4.5, -10);
    g.stroke();
    g.strokeStyle = CG_GN_HI; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-14.5, -14); g.quadraticCurveTo(-13, -34, cx - 8, cy - 5); g.stroke();

    // 4 back arm — ragged sleeve, bare forearm, claw
    let bex = cx - 12, bey = cy + 10, bhx3 = cx - 14, bhy3 = cy + 22, bang2 = 1.35, bspread = 0.24;
    if (windup) { bex = cx - 13; bey = cy - 8; bhx3 = cx - 17; bhy3 = cy - 19; bang2 = -1.9; bspread = 0.42; }
    else if (strike) { bex = cx + 3; bey = cy - 9; bhx3 = cx + 15; bhy3 = cy - 16; bang2 = 0.45; bspread = 0.3; }
    g.strokeStyle = CG_GN_OUT; g.lineWidth = 9;
    g.beginPath(); g.moveTo(cx - 4, cy - 6); g.lineTo(bex, bey); g.stroke();
    g.strokeStyle = CG_GN_DK; g.lineWidth = 6.5;
    g.beginPath(); g.moveTo(cx - 4, cy - 6); g.lineTo(bex, bey); g.stroke();
    seg(g, bex, bey, bhx3, bhy3, 3.4, CG_SKIN_OUT, CG_SKIN_DK);
    cgCuff(g, bex, bey, Math.atan2(bhy3 - bey, bhx3 - bex));
    cgClaw(g, bhx3, bhy3 + twitch * 0.4, bang2, bspread);

    // 5 hunched chest — the dowager hump is the silhouette's whole story
    g.fillStyle = CG_GN_MID; g.strokeStyle = CG_GN_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(cx - 3, cy - 11, 9, 6.5, -0.55, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx, cy - 6, 11, 8.5, -0.5, 0, 7); g.fill();
    g.strokeStyle = CG_GN_OUT;
    g.beginPath(); g.ellipse(cx, cy - 6, 11, 8.5, -0.5, 3.4, 6.9); g.stroke();
    g.fillStyle = CG_GN_LT; // key light rolls over the hump
    g.beginPath(); g.ellipse(cx - 6, cy - 13.5, 4.5, 2.6, -0.55, 0, 7); g.fill();
    g.fillStyle = CG_GN_DK;
    g.beginPath(); g.ellipse(cx + 5, cy - 3, 4.5, 3, -0.4, 0, 7); g.fill();
    g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 7.5; // craning neck
    g.beginPath(); g.moveTo(cx + 3, cy - 11); g.lineTo(hx - 2, hy + 4); g.stroke();
    g.strokeStyle = CG_SKIN_DK; g.lineWidth = 5;
    g.beginPath(); g.moveTo(cx + 3, cy - 11); g.lineTo(hx - 2, hy + 4); g.stroke();
    g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.2; // tendon tick
    g.beginPath();
    g.moveTo(cx + 4.5, cy - 12.5); g.lineTo(hx - 1.5, hy + 2.5);
    g.stroke();

    // 6 wild white hair — one mass blown up and back, ragged tips trailing
    g.save();
    g.translate(hx, hy + twitch * 0.3);
    g.fillStyle = CG_HR_MID; g.strokeStyle = CG_HR_OUT; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(5.5, -8.5);
    g.quadraticCurveTo(4.5, -13, 1.5, -16.5);   // front lick
    g.lineTo(-2.5, -10.5);
    g.lineTo(-8, -17);
    g.lineTo(-8.5, -9);
    g.lineTo(-17, -12);
    g.lineTo(-11, -4.5);
    g.lineTo(-21.5, -2.5);
    g.lineTo(-12, 0.5);
    g.lineTo(-19.5, 6.5);
    g.lineTo(-10, 5.5);
    g.lineTo(-13.5, 12.5);
    g.quadraticCurveTo(-7.5, 10.5, -4.5, 8.5);  // nape
    g.quadraticCurveTo(1, 8, 4, 4);             // buried under the face
    g.quadraticCurveTo(7.5, -2, 5.5, -8.5);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CG_HR_DK; // under-shade in the trailing mass
    g.beginPath();
    g.moveTo(-4.5, 8.5);
    g.quadraticCurveTo(-8, 9.5, -12, 10.5);
    g.lineTo(-17.5, 5.5);
    g.quadraticCurveTo(-9, 5, -6, 1);
    g.quadraticCurveTo(-8, 6, -4.5, 8.5);
    g.closePath(); g.fill();
    g.fillStyle = CG_HR_LT; // lit crown
    g.beginPath();
    g.moveTo(0.5, -14.5);
    g.lineTo(-2.5, -10.5);
    g.lineTo(-7, -15.5);
    g.quadraticCurveTo(-2, -13.5, 0.5, -14.5);
    g.closePath(); g.fill();
    g.beginPath(); g.ellipse(-4, -7.5, 4.5, 2.6, -0.4, 0, 7); g.fill();
    g.strokeStyle = CG_HR_DK; g.lineWidth = 1.2; // strand streaks
    g.beginPath();
    g.moveTo(-6, -6); g.quadraticCurveTo(-13, -6.5, -18.5, -9.5);
    g.moveTo(-6.5, -1.5); g.quadraticCurveTo(-13, -1, -18, -1.5);
    g.moveTo(-6, 3.5); g.quadraticCurveTo(-12, 5.5, -16.5, 6);
    g.stroke();

    // 7 the face, grey and sunken
    g.fillStyle = CG_SKIN_MID; g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(3, 0.5, 8.3, 7.4, 0.1, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(3, 0.5, 8.3, 7.4, 0.1, 0, 7); g.clip();
    g.fillStyle = CG_SKIN_LT;
    g.beginPath(); g.ellipse(-1, -3, 4.4, 3, -0.4, 0, 7); g.fill();
    g.fillStyle = CG_SKIN_HI; // waxy sheen on the brow
    g.beginPath(); g.ellipse(-1.8, -4.2, 2.2, 1.2, -0.4, 0, 7); g.fill();
    g.fillStyle = CG_SKIN_DK; g.fillRect(7, -8, 5, 18);
    g.fillStyle = CG_EYE_SOCK; // hollowed cheeks
    g.beginPath(); g.ellipse(0, 3.6, 2.6, 1.6, 0.4, 0, 7); g.fill();
    g.beginPath(); g.ellipse(7, 3.2, 2.4, 1.5, -0.2, 0, 7); g.fill();
    g.restore();
    // straggle wisps over the brow
    g.strokeStyle = CG_HR_MID; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-3, -6); g.quadraticCurveTo(-1, -2.5, -2.6, 1.5);
    g.moveTo(2, -7); g.quadraticCurveTo(3.6, -4, 3, -1);
    g.stroke();

    // 8 glowing hollow eyes
    if (hurt) {
      g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-1.6, -2.6); g.lineTo(1.2, 0);
      g.moveTo(1.2, -2.6); g.lineTo(-1.6, 0);
      g.moveTo(4.8, -2.8); g.lineTo(7.6, -0.2);
      g.moveTo(7.6, -2.8); g.lineTo(4.8, -0.2);
      g.stroke();
    } else {
      const gl = windup ? 1.25 : 1 + Math.sin(t * 7) * 0.12;
      g.fillStyle = CG_EYE_SOCK;
      g.beginPath(); g.ellipse(-0.2, -1.4, 3.4, 2.8, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(6.4, -1.6, 3.2, 2.7, 0, 0, 7); g.fill();
      g.fillStyle = CG_EYE_GLOW;
      g.beginPath(); g.arc(-0.2, -1.4, 3 * gl, 0, 7); g.fill();
      g.beginPath(); g.arc(6.4, -1.6, 2.8 * gl, 0, 7); g.fill();
      g.fillStyle = CG_EYE_CORE;
      g.beginPath(); g.arc(-0.2, -1.4, 1.5 * gl, 0, 7); g.fill();
      g.beginPath(); g.arc(6.4, -1.6, 1.5 * gl, 0, 7); g.fill();
    }
    g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.3; // hooked nose
    g.beginPath(); g.moveTo(8.4, -1); g.quadraticCurveTo(10.6, 1.4, 8.6, 2.6); g.stroke();

    // 9 the jaw: pressed grim, or dropped WRONG
    if (windup || strike) {
      const drop = windup ? 12 : 9.5;
      g.fillStyle = CG_MAW; g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.8;
      g.beginPath(); // the maw, stretched taller than a mouth should go
      g.moveTo(0.2, 3.2);
      g.quadraticCurveTo(4.9, 1.6, 10, 3.2);
      g.quadraticCurveTo(11.2, 3 + drop * 0.55, 8.8, 2.4 + drop);
      g.quadraticCurveTo(5, 4.4 + drop, 1.8, 2.4 + drop);
      g.quadraticCurveTo(-1.1, 3 + drop * 0.55, 0.2, 3.2);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = CG_TEETH; // uppers hang from the skull lip
      g.beginPath();
      g.moveTo(1.6, 3.4); g.lineTo(8.8, 3.4);
      g.lineTo(8, 5.9); g.lineTo(6.6, 4); g.lineTo(5.1, 6); g.lineTo(3.7, 4); g.lineTo(2.3, 5.7);
      g.closePath(); g.fill();
      // unhinged chin cup + lower teeth
      g.fillStyle = CG_SKIN_MID; g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(1.9, 1.6 + drop);
      g.quadraticCurveTo(4.9, 4 + drop, 8.4, 1.6 + drop);
      g.quadraticCurveTo(8.7, 4.4 + drop, 5.2, 5 + drop);
      g.quadraticCurveTo(1.8, 4.4 + drop, 1.9, 1.6 + drop);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = CG_TEETH_DK;
      g.beginPath();
      g.moveTo(2.4, 2.5 + drop); g.lineTo(7.9, 2.5 + drop); g.lineTo(6.8, 0.9 + drop);
      g.lineTo(5.2, 2.1 + drop); g.lineTo(3.7, 0.9 + drop);
      g.closePath(); g.fill();
    } else {
      g.strokeStyle = CG_SKIN_OUT; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(1, 4.4); g.quadraticCurveTo(4.5, 6, 8.4, 4.2); g.stroke();
      g.strokeStyle = CG_SKIN_DK; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(1, 4.4); g.lineTo(0.2, 5.4);
      g.moveTo(8.4, 4.2); g.lineTo(9.2, 5.2);
      g.stroke();
    }
    g.restore();

    // 10 front arm + claw, always on top
    let fex = cx + 10, fey = cy + 8, fhx3 = cx + 13, fhy3 = cy + 20, fang = 1.3, fspread = 0.26;
    if (windup) { fex = cx + 14; fey = cy - 10; fhx3 = cx + 20; fhy3 = cy - 22; fang = -1.1; fspread = 0.44; }
    else if (strike) { fex = cx + 12; fey = cy - 3; fhx3 = cx + 24; fhy3 = cy + 1; fang = 0.1; fspread = 0.32; }
    else if (hurt) { fex = cx + 9; fey = cy + 2; fhx3 = cx + 8; fhy3 = cy + 14; }
    g.strokeStyle = CG_GN_OUT; g.lineWidth = 9;
    g.beginPath(); g.moveTo(cx + 4, cy - 8); g.lineTo(fex, fey); g.stroke();
    g.strokeStyle = CG_GN_MID; g.lineWidth = 6.5;
    g.beginPath(); g.moveTo(cx + 4, cy - 8); g.lineTo(fex, fey); g.stroke();
    g.strokeStyle = CG_GN_LT; g.lineWidth = 1.4; // sleeve rim
    g.beginPath(); g.moveTo(cx + 3, cy - 9.5); g.lineTo(fex - 1, fey - 1.5); g.stroke();
    seg(g, fex, fey, fhx3, fhy3, 3.4, CG_SKIN_OUT, CG_SKIN_MID);
    cgCuff(g, fex, fey, Math.atan2(fhy3 - fey, fhx3 - fex));
    cgClaw(g, fhx3, fhy3 + twitch * 0.5, fang, fspread);
  };
})();
