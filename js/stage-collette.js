// stage-collette.js — Collette's property, Campaign Chapter 2, in two stages.
// 'collette-yard': the front yard at golden hour — modest house facade, shaggy
// overgrown lawn, and the car parked dead centre of the grass beside a
// perfectly good driveway. 'collette-garage': inside at night, a floor-to-
// ceiling hoard under one bare bulb; the LEFT end (x 0-280) drops into
// near-black shadow deep enough for a boss to vanish into.
// Same contract as stage-home.js: far() paints the soft quarter-res backdrop,
// near() paints the sharp floor + cropped foreground. Fighting band 380-470
// stays low-contrast in both. Flat fills only — no gradients, no shadowBlur,
// no per-frame allocations.
(function () {
  const S = (window.STAGE_ART = window.STAGE_ART || {});

  // ======================= YARD GEOMETRY (world units) ======================
  const HZ = 332;                                  // lawn horizon
  const HB = 432;                                  // house base line
  const HX0 = 350, HX1 = 1030;                     // facade span
  const EAVE = 214, RIDGE = 150;
  const PR_X0 = 356, PR_X1 = 650, PR_DECK = 410;   // porch deck slab
  const PR_FASC = 258;                             // porch fascia top
  const WA0 = 682, WA1 = 766, WB0 = 856, WB1 = 940, WY0 = 268, WY1 = 378;
  const SD_X0 = 520, SD_X1 = 586, SD_Y = 252;      // screen door
  const DRV0 = 1080, DRV1 = 1230;                  // driveway at house base
  const DRN0 = 1046, DRN1 = 1300;                  // driveway at GROUND_Y
  const DRF0 = 986, DRF1 = 1394;                   // driveway at near bottom
  const CAR_X = 630;                               // nose; car spans 630-880
  const RV_X0 = 1428, RV_X1 = 1738;
  const SUN_X = 218, SUN_Y = 156;
  const FORE_TOP = 486;                            // foreground stays below this

  // ---- yard palette: warm apricot dusk, hue-dark inks, no pure black ----
  const Y_SKY0 = '#645086', Y_SKY1 = '#8a5a80', Y_SKY2 = '#b86a72', Y_SKY3 = '#e08a62', Y_SKY4 = '#f7b06a';
  const SUN_H1 = 'rgba(255,214,140,0.10)', SUN_H2 = 'rgba(255,214,140,0.18)', SUN_H3 = 'rgba(255,222,160,0.30)';
  const SUN_CORE = '#fff0c2';
  const TREE_BK = '#5a4160', TREE_FR = '#463050', TREE_RIM = '#7a5058', TREE_TRK = '#3a2838';
  const LAWN_A = '#9a8a4e', LAWN_B = '#7c8a44', LAWN_C = '#5f7a3a', LAWN_D = '#4c6a34';
  const TUFT_M = '#6e8040', TUFT_D = '#49602f', TUFT_W = '#a89a52';
  const SIDE_LT = '#f2cda2', SIDE_MID = '#dfae82', SIDE_SH = '#b5825f', SIDE_SEAM = '#c1926c', SIDE_INK = '#7c5340';
  const TRIM = '#f7ead2', TRIM_DK = '#c9ae8f', TRIM_INK = '#8a6a4c';
  const ROOF = '#7c4a38', ROOF_CRS = '#94604a', ROOF_LT = '#b07a54', ROOF_INK = '#4a2b20';
  const CHIM = '#9a5240', CHIM_LT = '#b86c52', CHIM_DK = '#6e392c';
  const DECK = '#b5825a', DECK_DK = '#8a5f42', DECK_INK = '#5c3c28';
  const MESH = '#4c4438', MESH_DK = '#38322a';
  const LACE = '#f6ead0', LACE_SH = '#dcc9a8', ROOM_DK = '#5c4444', SHEEN = 'rgba(255,240,214,0.30)';
  const CAR_OUT = '#4a3d2a', CAR_DK = '#8a7550', CAR_MID = '#b09a6a', CAR_LT = '#d6c491', CAR_HI = '#f0e0b0';
  const CAR_WIN = '#3f4a5c', CAR_WINL = '#c98a6a', TIRE = '#2c2822', TIRE_OUT = '#211d18', HUB = '#9a9080', RUST = '#8a5a3c';
  const CAN_OUT = '#5c1812', CAN_DK = '#8a2418', CAN_MID = '#c43a2c', CAN_LT = '#e06048', CAN_SPT = '#d9a03a';
  const HOSE_DK = '#2c4c28', HOSE_MID = '#3f6b34', HOSE_LT = '#5f8a48', HOSE_NOZ = '#b08a3c';
  const BATH_OUT = '#7a6a52', BATH_DK = '#a8987c', BATH_MID = '#cbbb9c', BATH_LT = '#e8dcbe';
  const BATH_WTR = '#7a92b0', BATH_GLN = '#f2c488';
  const MBX_PST = '#6e4a30', MBX_PDK = '#4c3020', MBX = '#6a7686', MBX_DK = '#4a5464', MBX_LT = '#8c98a8', MBX_OUT = '#333a48', FLAG = '#c43a2c';
  const RV_OUT = '#6a5a42', RV_DK = '#a89a80', RV_MID = '#d9cdb4', RV_LT = '#efe6cf';
  const RV_STR = '#8a5a3c', RV_STR2 = '#c9772f', RV_WIN = '#3a4452', RV_LIT = '#f0b060';
  const DRV_LT = '#c4b096', DRV_MID = '#a89680', DRV_DK = '#8a7864', DRV_INK = '#655847', CRACK = '#6e5c4c';
  const SHADOW = 'rgba(34,48,28,0.32)', SHADOW_SOFT = 'rgba(34,48,28,0.18)';
  const WARM_STREAK = 'rgba(255,196,120,0.08)';
  const POLLEN = '#ffe0a8';
  const FG_BLADE = '#2b4020', FG_BLADE2 = '#3a5228', FG_TIP = '#8a7a3c', FG_SEED = '#e8dcb4';

  // driveway crack polylines (x,y pairs, world units, NaN-free flat runs)
  const CRK_A = [1090, 480, 1120, 502, 1112, 528, 1140, 552];
  const CRK_B = [1250, 474, 1236, 500, 1258, 526, 1246, 550];
  const CRK_C = [1160, 470, 1178, 492, 1170, 516];
  // lawn tuft row baselines + spacing (far pass)
  const TROW_Y = [352, 372, 392, 412, 432, 450, 462];
  const TROW_SP = [46, 42, 38, 36, 34, 30, 28];
  // near-pass grass seam rows below GROUND_Y (depths like stage-home planks)
  const GROW = [10, 24, 42, 64, 90];

  // three nested ellipses stand in for a glow — no gradients in this file
  function wash(g, x, y, rx, ry, cOut, cMid, cCore) {
    g.fillStyle = cOut; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = cMid; g.beginPath(); g.ellipse(x, y, rx * 0.66, ry * 0.66, 0, 0, 7); g.fill();
    g.fillStyle = cCore; g.beginPath(); g.ellipse(x, y, rx * 0.36, ry * 0.36, 0, 0, 7); g.fill();
  }
  // cheap world-stable jitter (no per-frame closures needed in tight loops)
  function jit(n, m) { return ((n * 7919 + 131) % m + m) % m; }

  // ============================ YARD: SKY + FAR ===========================
  function ySky(g, x0, w0, yTop) {
    const h = HZ - yTop, b = h / 5;
    g.fillStyle = Y_SKY0; g.fillRect(x0, yTop, w0, b + 1);
    g.fillStyle = Y_SKY1; g.fillRect(x0, yTop + b, w0, b + 1);
    g.fillStyle = Y_SKY2; g.fillRect(x0, yTop + b * 2, w0, b + 1);
    g.fillStyle = Y_SKY3; g.fillRect(x0, yTop + b * 3, w0, b + 1);
    g.fillStyle = Y_SKY4; g.fillRect(x0, yTop + b * 4, w0, b + 2);
    // low sun, stage-left — the key light; everything shadows to the right
    g.fillStyle = SUN_H1; g.beginPath(); g.arc(SUN_X, SUN_Y, 118, 0, 7); g.fill();
    g.fillStyle = SUN_H2; g.beginPath(); g.arc(SUN_X, SUN_Y, 78, 0, 7); g.fill();
    g.fillStyle = SUN_H3; g.beginPath(); g.arc(SUN_X, SUN_Y, 52, 0, 7); g.fill();
    g.fillStyle = SUN_CORE; g.beginPath(); g.arc(SUN_X, SUN_Y, 32, 0, 7); g.fill();
    // thin dusk cloud bars catching the underside light
    g.fillStyle = Y_SKY4;
    g.fillRect(360, 120, 240, 7); g.fillRect(520, 96, 150, 5);
    g.fillRect(1060, 150, 300, 8); g.fillRect(1300, 108, 180, 6);
    g.fillStyle = Y_SKY2;
    g.fillRect(410, 127, 190, 3); g.fillRect(1120, 158, 240, 3);
  }

  function yTreeline(g, x0, w0) {
    // far neighbourhood canopy along the horizon, two soft rows
    g.fillStyle = TREE_BK;
    const c0 = Math.floor(x0 / 120) * 120;
    for (let x = c0; x < x0 + w0 + 120; x += 120) {
      const j = jit(x / 120, 26);
      g.beginPath(); g.arc(x + j, HZ - 12 - jit(x / 120 + 3, 14), 34, 0, 7); g.fill();
      g.beginPath(); g.arc(x + 62 + j, HZ - 6 - jit(x / 120 + 7, 10), 26, 0, 7); g.fill();
    }
    g.fillStyle = TREE_FR;
    for (let x = c0 + 40; x < x0 + w0 + 120; x += 150) {
      g.beginPath(); g.arc(x + jit(x / 150, 30), HZ - 2 - jit(x / 150 + 1, 8), 24, 0, 7); g.fill();
    }
    g.fillStyle = TREE_BK; g.fillRect(x0, HZ - 4, w0, 6);
  }

  function yLawnFar(g, s, x0, w0) {
    const gy = s.GROUND_Y;
    // banded ground plane, hazier toward the sunlit horizon
    g.fillStyle = LAWN_A; g.fillRect(x0, HZ, w0, 22);
    g.fillStyle = LAWN_B; g.fillRect(x0, 354, w0, 38);
    g.fillStyle = LAWN_C; g.fillRect(x0, 392, w0, 40);
    g.fillStyle = LAWN_D; g.fillRect(x0, 432, w0, gy - 432 + 2);
    g.globalAlpha = 0.5;
    g.fillStyle = s.checker(LAWN_B); g.fillRect(x0, 348, w0, 10);
    g.fillStyle = s.checker(LAWN_C); g.fillRect(x0, 386, w0, 10);
    g.fillStyle = s.checker(LAWN_D); g.fillRect(x0, 426, w0, 10);
    g.globalAlpha = 1;
  }

  // scattered shaggy tufts; values pulled close together inside the 380-470 band
  function yTufts(g, x0, w0) {
    for (let r = 0; r < 7; r++) {
      const y = TROW_Y[r], sp = TROW_SP[r];
      const inBand = y > 378;
      const c0 = Math.floor(x0 / sp);
      for (let c = c0; c * sp < x0 + w0; c++) {
        const x = c * sp + jit(c + r * 17, sp - 8);
        const h = 5 + r + jit(c * 3 + r, 5);
        const k = jit(c + r, 3);
        g.fillStyle = k === 0 ? TUFT_D : k === 1 ? TUFT_M : (inBand ? TUFT_M : TUFT_W);
        g.beginPath();
        g.moveTo(x - 4, y); g.lineTo(x - 2, y - h); g.lineTo(x, y);
        g.lineTo(x + 2, y - h + 2); g.lineTo(x + 4, y);
        g.closePath(); g.fill();
      }
    }
  }

  function yBigTree(g) {
    // framing silhouette at the far left, backlit by the low sun
    g.fillStyle = TREE_TRK;
    g.fillRect(96, 300, 18, 116);
    g.beginPath();
    g.moveTo(96, 322); g.lineTo(58, 268); g.lineTo(70, 262); g.lineTo(106, 306);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(114, 316); g.lineTo(152, 258); g.lineTo(140, 252); g.lineTo(104, 302);
    g.closePath(); g.fill();
    g.fillStyle = TREE_FR;
    g.beginPath(); g.arc(104, 216, 62, 0, 7); g.fill();
    g.beginPath(); g.arc(52, 250, 44, 0, 7); g.fill();
    g.beginPath(); g.arc(160, 246, 46, 0, 7); g.fill();
    g.beginPath(); g.arc(120, 168, 44, 0, 7); g.fill();
    g.fillStyle = TREE_RIM;   // sun-side rim
    g.beginPath(); g.arc(48, 238, 12, 0, 7); g.fill();
    g.beginPath(); g.arc(84, 178, 13, 0, 7); g.fill();
    g.beginPath(); g.arc(30, 262, 8, 0, 7); g.fill();
  }

  function yHouse(g) {
    // long cast shadows first, skewed right off the low sun
    g.fillStyle = SHADOW;
    g.beginPath();
    g.moveTo(HX0, HB); g.lineTo(HX1, HB); g.lineTo(HX1 + 260, 468); g.lineTo(HX0 + 260, 468);
    g.closePath(); g.fill();
    // roof
    g.fillStyle = ROOF_INK;
    g.beginPath();
    g.moveTo(HX0 - 16, EAVE + 2); g.lineTo(428, RIDGE - 2); g.lineTo(952, RIDGE - 2); g.lineTo(HX1 + 16, EAVE + 2);
    g.closePath(); g.fill();
    g.fillStyle = ROOF;
    g.beginPath();
    g.moveTo(HX0 - 12, EAVE); g.lineTo(430, RIDGE); g.lineTo(950, RIDGE); g.lineTo(HX1 + 12, EAVE);
    g.closePath(); g.fill();
    g.fillStyle = ROOF_CRS;
    g.fillRect(414, 164, 552, 3); g.fillRect(392, 180, 616, 3); g.fillRect(372, 196, 668, 3);
    g.fillStyle = ROOF_LT;
    g.beginPath(); g.moveTo(430, RIDGE); g.lineTo(950, RIDGE); g.lineTo(944, RIDGE + 4); g.lineTo(436, RIDGE + 4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(HX0 - 12, EAVE); g.lineTo(430, RIDGE); g.lineTo(438, RIDGE + 3); g.lineTo(HX0 - 4, EAVE); g.closePath(); g.fill();
    // chimney
    g.fillStyle = CHIM_DK; g.fillRect(878, 96, 46, 62);
    g.fillStyle = CHIM; g.fillRect(878, 96, 34, 62);
    g.fillStyle = CHIM_LT; g.fillRect(878, 96, 8, 62);
    g.fillStyle = CHIM_DK; g.fillRect(874, 88, 54, 10);
    // clapboard wall — lit from the left, shaded run at the right end
    g.fillStyle = SIDE_MID; g.fillRect(HX0, EAVE, HX1 - HX0, HB - EAVE);
    g.fillStyle = SIDE_LT; g.fillRect(HX0, EAVE, 250, HB - EAVE);
    g.fillStyle = SIDE_SH; g.fillRect(HX1 - 120, EAVE, 120, HB - EAVE);
    g.fillStyle = SIDE_SEAM;
    for (let y = EAVE + 14; y < HB - 4; y += 14) g.fillRect(HX0, y, HX1 - HX0, 2);
    g.fillStyle = SIDE_INK; g.fillRect(HX0, HB - 4, HX1 - HX0, 4);
    g.fillRect(HX0, EAVE, 3, HB - EAVE); g.fillRect(HX1 - 3, EAVE, 3, HB - EAVE);
    // eave shadow line under the roof
    g.fillStyle = SIDE_INK; g.fillRect(HX0, EAVE, HX1 - HX0, 5);
    windows(g);
    porch(g);
  }

  function windows(g) {
    lace(g, WA0, WA1); lace(g, WB0, WB1);
  }
  function lace(g, x0, x1) {
    const w = x1 - x0;
    // casing
    g.fillStyle = TRIM_INK; g.fillRect(x0 - 6, WY0 - 6, w + 12, WY1 - WY0 + 12);
    g.fillStyle = TRIM; g.fillRect(x0 - 4, WY0 - 4, w + 8, WY1 - WY0 + 8);
    g.fillStyle = TRIM_DK; g.fillRect(x1, WY0 - 4, 4, WY1 - WY0 + 8);
    // lace fills the whole pane — soft folds, a slim dark part line, then a
    // diagonal sheen so the glass reads in FRONT of the curtain
    g.fillStyle = LACE; g.fillRect(x0, WY0, w, WY1 - WY0);
    g.fillStyle = LACE_SH;
    for (let fx = x0 + 10; fx < x1 - 6; fx += 15) g.fillRect(fx, WY0 + 6, 2.4, WY1 - WY0 - 10);
    g.fillRect(x0, WY1 - 8, w, 4);                       // hem shadow
    g.fillStyle = ROOM_DK; g.fillRect(x0 + w * 0.5 - 3, WY0 + 10, 6, WY1 - WY0 - 12);
    g.fillStyle = SHEEN;
    g.beginPath();
    g.moveTo(x0 + w * 0.18, WY1); g.lineTo(x0 + w * 0.52, WY0);
    g.lineTo(x0 + w * 0.68, WY0); g.lineTo(x0 + w * 0.34, WY1);
    g.closePath(); g.fill();
    // sash bar + sill
    g.fillStyle = TRIM; g.fillRect(x0, WY0 + 50, w, 5);
    g.fillStyle = TRIM_DK; g.fillRect(x0, WY0 + 53, w, 2);
    g.fillStyle = TRIM; g.fillRect(x0 - 8, WY1, w + 16, 8);
    g.fillStyle = TRIM_DK; g.fillRect(x0 - 8, WY1 + 6, w + 16, 2);
  }

  function porch(g) {
    // deck slab + skirt
    g.fillStyle = DECK; g.fillRect(PR_X0, PR_DECK, PR_X1 - PR_X0, 8);
    g.fillStyle = DECK_DK; g.fillRect(PR_X0, PR_DECK + 8, PR_X1 - PR_X0, 4);
    g.fillStyle = SIDE_SH; g.fillRect(PR_X0 + 4, PR_DECK + 12, PR_X1 - PR_X0 - 8, HB - PR_DECK - 12);
    g.fillStyle = SIDE_INK;   // lattice hint
    for (let x = PR_X0 + 12; x < PR_X1 - 10; x += 18) g.fillRect(x, PR_DECK + 14, 2, HB - PR_DECK - 16);
    // steps down to the lawn
    g.fillStyle = DECK; g.fillRect(462, 418, 84, 7);
    g.fillStyle = DECK_DK; g.fillRect(462, 425, 84, 3);
    g.fillStyle = DECK; g.fillRect(454, 428, 100, 7);
    g.fillStyle = DECK_DK; g.fillRect(454, 435, 100, 3);
    // screen door behind the posts
    g.fillStyle = TRIM_INK; g.fillRect(SD_X0 - 5, SD_Y - 5, SD_X1 - SD_X0 + 10, PR_DECK - SD_Y + 5);
    g.fillStyle = TRIM; g.fillRect(SD_X0, SD_Y, SD_X1 - SD_X0, PR_DECK - SD_Y);
    g.fillStyle = MESH; g.fillRect(SD_X0 + 7, SD_Y + 8, SD_X1 - SD_X0 - 14, 62);
    g.fillRect(SD_X0 + 7, SD_Y + 84, SD_X1 - SD_X0 - 14, PR_DECK - SD_Y - 92);
    g.fillStyle = MESH_DK;
    g.fillRect(SD_X0 + 7, SD_Y + 8, SD_X1 - SD_X0 - 14, 3);
    g.fillRect(SD_X0 + 7, SD_Y + 84, SD_X1 - SD_X0 - 14, 3);
    g.fillStyle = TRIM_DK; g.fillRect(SD_X0, SD_Y + 70, SD_X1 - SD_X0, 14);
    g.fillStyle = TRIM_INK; g.fillRect(SD_X1 - 12, SD_Y + 96, 4, 22);   // pull handle
    // porch roof: shingle sliver + fascia
    g.fillStyle = ROOF_INK;
    g.beginPath();
    g.moveTo(PR_X0 - 10, PR_FASC - 4); g.lineTo(PR_X1 + 6, 234); g.lineTo(PR_X1 + 6, 242); g.lineTo(PR_X0 - 10, PR_FASC + 4);
    g.closePath(); g.fill();
    g.fillStyle = ROOF;
    g.beginPath();
    g.moveTo(PR_X0 - 10, PR_FASC - 12); g.lineTo(PR_X1 + 6, 226); g.lineTo(PR_X1 + 6, 236); g.lineTo(PR_X0 - 10, PR_FASC - 3);
    g.closePath(); g.fill();
    g.fillStyle = TRIM;
    g.beginPath();
    g.moveTo(PR_X0 - 10, PR_FASC); g.lineTo(PR_X1 + 6, 236); g.lineTo(PR_X1 + 6, 248); g.lineTo(PR_X0 - 10, PR_FASC + 12);
    g.closePath(); g.fill();
    g.fillStyle = TRIM_DK;
    g.beginPath();
    g.moveTo(PR_X0 - 10, PR_FASC + 8); g.lineTo(PR_X1 + 6, 244); g.lineTo(PR_X1 + 6, 248); g.lineTo(PR_X0 - 10, PR_FASC + 12);
    g.closePath(); g.fill();
    // posts + railing
    post(g, 372); post(g, 500); post(g, 628);
    g.fillStyle = TRIM; g.fillRect(378, 366, 246, 6);
    g.fillStyle = TRIM_DK; g.fillRect(378, 370, 246, 2);
    g.fillStyle = TRIM_DK;
    for (let x = 388; x < 620; x += 15) g.fillRect(x, 372, 4, 34);
    g.fillStyle = TRIM; g.fillRect(378, 404, 246, 5);
  }
  function post(g, x) {
    g.fillStyle = TRIM_INK; g.fillRect(x - 6, 250, 13, PR_DECK - 250);
    g.fillStyle = TRIM; g.fillRect(x - 5, 250, 8, PR_DECK - 250);
    g.fillStyle = TRIM_DK; g.fillRect(x + 3, 250, 3, PR_DECK - 250);
    g.fillStyle = TRIM; g.fillRect(x - 8, PR_DECK - 6, 17, 6);
  }

  function yDrivewayFar(g) {
    g.fillStyle = DRV_INK;
    g.beginPath();
    g.moveTo(DRV0 - 4, HB); g.lineTo(DRV1 + 4, HB); g.lineTo(DRN1 + 5, 468); g.lineTo(DRN0 - 5, 468);
    g.closePath(); g.fill();
    g.fillStyle = DRV_MID;
    g.beginPath();
    g.moveTo(DRV0, HB); g.lineTo(DRV1, HB); g.lineTo(DRN1, 468); g.lineTo(DRN0, 468);
    g.closePath(); g.fill();
    g.fillStyle = DRV_LT;   // sun side
    g.beginPath();
    g.moveTo(DRV0, HB); g.lineTo(DRV0 + 44, HB); g.lineTo(DRN0 + 66, 468); g.lineTo(DRN0, 468);
    g.closePath(); g.fill();
    // expansion joints marching back
    g.fillStyle = DRV_DK;
    g.fillRect(DRV0 - 6, 444, DRV1 - DRV0 + 46, 2.5);
    g.fillRect(DRV0 - 2, 438, DRV1 - DRV0 + 24, 2);
  }

  function yCar(g) {
    // the joke: parked dead centre of the lawn, nose to the sun
    g.fillStyle = SHADOW;
    g.beginPath();
    g.moveTo(CAR_X + 6, 450); g.lineTo(CAR_X + 250, 450); g.lineTo(CAR_X + 330, 466); g.lineTo(CAR_X + 66, 466);
    g.closePath(); g.fill();
    // body shell — sagging old sedan
    g.fillStyle = CAR_OUT;
    g.beginPath();
    g.moveTo(CAR_X - 4, 442); g.lineTo(CAR_X - 4, 408); g.lineTo(CAR_X + 20, 396);
    g.lineTo(CAR_X + 58, 392); g.lineTo(CAR_X + 84, 366); g.lineTo(CAR_X + 178, 364);
    g.lineTo(CAR_X + 206, 390); g.lineTo(CAR_X + 250, 398); g.lineTo(CAR_X + 254, 442);
    g.closePath(); g.fill();
    g.fillStyle = CAR_MID;
    g.beginPath();
    g.moveTo(CAR_X, 438); g.lineTo(CAR_X, 410); g.lineTo(CAR_X + 22, 399);
    g.lineTo(CAR_X + 60, 395); g.lineTo(CAR_X + 87, 369); g.lineTo(CAR_X + 175, 368);
    g.lineTo(CAR_X + 202, 393); g.lineTo(CAR_X + 246, 401); g.lineTo(CAR_X + 250, 438);
    g.closePath(); g.fill();
    // roof + hood catch the low sun from the left
    g.fillStyle = CAR_LT;
    g.beginPath();
    g.moveTo(CAR_X + 87, 369); g.lineTo(CAR_X + 175, 368); g.lineTo(CAR_X + 170, 373); g.lineTo(CAR_X + 90, 374);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(CAR_X, 410); g.lineTo(CAR_X + 22, 399); g.lineTo(CAR_X + 60, 395); g.lineTo(CAR_X + 60, 400); g.lineTo(CAR_X + 24, 404); g.lineTo(CAR_X + 4, 413);
    g.closePath(); g.fill();
    g.fillStyle = CAR_HI; g.fillRect(CAR_X + 92, 369, 30, 2.6);
    // beltline shade
    g.fillStyle = CAR_DK; g.fillRect(CAR_X + 2, 420, 246, 6);
    // windows: windshield + door glass with a dusk streak
    g.fillStyle = CAR_WIN;
    g.beginPath();
    g.moveTo(CAR_X + 66, 394); g.lineTo(CAR_X + 88, 372); g.lineTo(CAR_X + 126, 372); g.lineTo(CAR_X + 126, 394);
    g.closePath(); g.fill();
    g.fillRect(CAR_X + 132, 372, 42, 22);
    g.beginPath();
    g.moveTo(CAR_X + 180, 372); g.lineTo(CAR_X + 200, 392); g.lineTo(CAR_X + 180, 394);
    g.closePath(); g.fill();
    g.fillStyle = CAR_WINL;
    g.beginPath();
    g.moveTo(CAR_X + 70, 394); g.lineTo(CAR_X + 90, 374); g.lineTo(CAR_X + 100, 374); g.lineTo(CAR_X + 80, 394);
    g.closePath(); g.fill();
    // door seams, handle, rust blooms
    g.fillStyle = CAR_DK;
    g.fillRect(CAR_X + 128, 372, 2, 52); g.fillRect(CAR_X + 178, 374, 2, 48);
    g.fillRect(CAR_X + 138, 402, 14, 3);
    g.fillStyle = RUST;
    g.beginPath(); g.arc(CAR_X + 34, 430, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(CAR_X + 236, 428, 6, 0, 7); g.fill();
    g.beginPath(); g.arc(CAR_X + 118, 436, 4, 0, 7); g.fill();
    // bumpers + lights
    g.fillStyle = HUB; g.fillRect(CAR_X - 6, 428, 18, 7); g.fillRect(CAR_X + 240, 428, 18, 7);
    g.fillStyle = CAN_SPT; g.fillRect(CAR_X - 2, 412, 8, 6);           // headlamp
    g.fillStyle = CAN_DK; g.fillRect(CAR_X + 246, 406, 6, 6);          // tail lamp
    // wheels sunk into the shag
    wheel(g, CAR_X + 62, 444); wheel(g, CAR_X + 206, 444);
    g.fillStyle = TUFT_D;   // grass licking the tyres
    g.beginPath(); g.moveTo(CAR_X + 42, 458); g.lineTo(CAR_X + 48, 436); g.lineTo(CAR_X + 54, 458); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(CAR_X + 74, 460); g.lineTo(CAR_X + 80, 440); g.lineTo(CAR_X + 86, 460); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(CAR_X + 188, 458); g.lineTo(CAR_X + 194, 438); g.lineTo(CAR_X + 200, 458); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(CAR_X + 222, 460); g.lineTo(CAR_X + 227, 442); g.lineTo(CAR_X + 232, 460); g.closePath(); g.fill();
  }
  function wheel(g, x, y) {
    g.fillStyle = TIRE_OUT; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill();
    g.fillStyle = TIRE; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill();
    g.fillStyle = HUB; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
    g.fillStyle = CAR_DK; g.beginPath(); g.arc(x + 2, y + 2, 3, 0, 7); g.fill();
  }

  function yProps(g) {
    // garden hose coiled left of the car
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = HOSE_DK; g.lineWidth = 7;
    g.beginPath(); g.ellipse(556, 452, 30, 11, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(556, 448, 24, 9, 0, 0, 7); g.stroke();
    g.strokeStyle = HOSE_MID; g.lineWidth = 4;
    g.beginPath(); g.ellipse(556, 450, 27, 10, 0, 0, 7); g.stroke();
    g.strokeStyle = HOSE_LT; g.lineWidth = 2;
    g.beginPath(); g.ellipse(556, 446, 22, 8, 0, 2.8, 5.6); g.stroke();
    g.strokeStyle = HOSE_MID; g.lineWidth = 4;
    g.beginPath(); g.moveTo(584, 454); g.quadraticCurveTo(612, 462, 626, 452); g.stroke();
    g.fillStyle = HOSE_NOZ; g.fillRect(624, 448, 12, 6);
    g.lineCap = 'butt';
    // red gas can at the rear wheel
    g.fillStyle = SHADOW_SOFT;
    g.beginPath(); g.ellipse(902, 458, 26, 6, 0, 0, 7); g.fill();
    g.fillStyle = CAN_OUT; g.beginPath(); g.roundRect(874, 420, 34, 38, 3); g.fill();
    g.fillStyle = CAN_MID; g.beginPath(); g.roundRect(876, 422, 30, 34, 3); g.fill();
    g.fillStyle = CAN_LT; g.fillRect(878, 424, 7, 30);
    g.fillStyle = CAN_DK; g.fillRect(898, 424, 6, 30);
    g.fillStyle = CAN_DK; g.fillRect(882, 430, 20, 3);
    g.fillStyle = CAN_SPT;
    g.beginPath();
    g.moveTo(902, 422); g.lineTo(912, 412); g.lineTo(917, 416); g.lineTo(907, 425);
    g.closePath(); g.fill();
    g.fillStyle = CAN_OUT; g.fillRect(884, 415, 14, 6);   // handle
    g.fillStyle = CAN_MID; g.fillRect(886, 417, 10, 2.5);
    // bird bath, stage left
    g.fillStyle = SHADOW_SOFT;
    g.beginPath(); g.ellipse(232, 444, 52, 8, 0, 0, 7); g.fill();
    g.fillStyle = BATH_OUT; g.fillRect(172, 380, 16, 62);
    g.fillStyle = BATH_MID; g.fillRect(174, 380, 9, 62);
    g.fillStyle = BATH_LT; g.fillRect(174, 380, 4, 62);
    g.fillStyle = BATH_OUT; g.beginPath(); g.ellipse(180, 442, 24, 7, 0, 0, 7); g.fill();
    g.fillStyle = BATH_DK; g.beginPath(); g.ellipse(180, 440, 20, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = BATH_OUT; g.beginPath(); g.ellipse(180, 374, 40, 11, 0, 0, 7); g.fill();
    g.fillStyle = BATH_MID; g.beginPath(); g.ellipse(180, 371, 37, 9.5, 0, 0, 7); g.fill();
    g.fillStyle = BATH_WTR; g.beginPath(); g.ellipse(180, 370, 29, 6.5, 0, 0, 7); g.fill();
    g.fillStyle = BATH_GLN; g.beginPath(); g.ellipse(170, 368.6, 10, 2.2, 0, 0, 7); g.fill();
    g.fillStyle = BATH_LT; g.beginPath(); g.ellipse(166, 368, 12, 3, 0, 3.0, 5.4); g.fill();
    // mailbox leaning hard by the driveway
    g.fillStyle = SHADOW_SOFT;
    g.beginPath(); g.ellipse(1352, 462, 44, 6, 0, 0, 7); g.fill();
    g.save();
    g.translate(1322, 462); g.rotate(-0.16);
    g.fillStyle = MBX_PDK; g.fillRect(-5, -64, 10, 64);
    g.fillStyle = MBX_PST; g.fillRect(-5, -64, 6, 64);
    g.fillStyle = MBX_OUT; g.beginPath(); g.roundRect(-24, -88, 48, 26, 9); g.fill();
    g.fillStyle = MBX; g.beginPath(); g.roundRect(-22, -86, 44, 22, 8); g.fill();
    g.fillStyle = MBX_LT; g.beginPath(); g.roundRect(-22, -86, 44, 7, 4); g.fill();
    g.fillStyle = MBX_DK; g.fillRect(-22, -70, 44, 6);
    g.fillStyle = MBX_DK; g.beginPath(); g.ellipse(-22, -75, 3, 11, 0, 0, 7); g.fill();
    g.fillStyle = FLAG; g.fillRect(16, -102, 4, 18); g.fillRect(12, -102, 12, 6);
    g.restore();
  }

  function yRV(g) {
    // JR's rig looming at the far end
    g.fillStyle = SHADOW;
    g.beginPath();
    g.moveTo(RV_X0 + 10, 444); g.lineTo(RV_X1, 444); g.lineTo(RV_X1 + 70, 466); g.lineTo(RV_X0 + 80, 466);
    g.closePath(); g.fill();
    g.fillStyle = RV_OUT; g.beginPath(); g.roundRect(RV_X0 - 4, 246, RV_X1 - RV_X0 + 8, 194, 12); g.fill();
    g.fillStyle = RV_MID; g.beginPath(); g.roundRect(RV_X0, 250, RV_X1 - RV_X0, 186, 10); g.fill();
    g.fillStyle = RV_LT; g.fillRect(RV_X0 + 4, 254, 60, 178);
    g.fillStyle = RV_DK; g.fillRect(RV_X1 - 52, 254, 48, 178);
    // stripe band + pinstripe
    g.fillStyle = RV_STR; g.fillRect(RV_X0, 320, RV_X1 - RV_X0, 22);
    g.fillStyle = RV_STR2; g.fillRect(RV_X0, 346, RV_X1 - RV_X0, 6);
    // raked windshield on the left face
    g.fillStyle = RV_WIN;
    g.beginPath();
    g.moveTo(RV_X0 + 10, 306); g.lineTo(RV_X0 + 26, 262); g.lineTo(RV_X0 + 88, 262); g.lineTo(RV_X0 + 88, 306);
    g.closePath(); g.fill();
    g.fillStyle = CAR_WINL;
    g.beginPath();
    g.moveTo(RV_X0 + 18, 306); g.lineTo(RV_X0 + 33, 264); g.lineTo(RV_X0 + 45, 264); g.lineTo(RV_X0 + 30, 306);
    g.closePath(); g.fill();
    // side windows — one glowing warm: somebody is home in there
    g.fillStyle = RV_WIN; g.fillRect(RV_X0 + 118, 268, 56, 34); g.fillRect(RV_X0 + 254, 268, 50, 34);
    g.fillStyle = RV_LIT; g.fillRect(RV_X0 + 190, 268, 50, 34);
    g.fillStyle = RV_LT; g.fillRect(RV_X0 + 190, 268, 50, 4);
    // door + ladder + roof kit
    g.fillStyle = RV_DK; g.fillRect(RV_X0 + 224, 356, 4, 80);
    g.fillStyle = RV_OUT; g.fillRect(RV_X1 - 24, 258, 4, 178);
    g.fillRect(RV_X1 - 38, 280, 18, 4); g.fillRect(RV_X1 - 38, 320, 18, 4); g.fillRect(RV_X1 - 38, 360, 18, 4);
    g.fillStyle = RV_LT; g.fillRect(RV_X0 + 40, 238, 200, 12);
    g.fillStyle = RV_DK; g.beginPath(); g.roundRect(RV_X0 + 96, 228, 60, 14, 4); g.fill();
    // wheels behind the shag
    g.fillStyle = TIRE_OUT;
    g.beginPath(); g.arc(RV_X0 + 70, 440, 20, 0, 7); g.fill();
    g.beginPath(); g.arc(RV_X1 - 90, 440, 20, 0, 7); g.fill();
    g.fillStyle = TIRE;
    g.beginPath(); g.arc(RV_X0 + 70, 440, 16, 0, 7); g.fill();
    g.beginPath(); g.arc(RV_X1 - 90, 440, 16, 0, 7); g.fill();
    g.fillStyle = TUFT_D;
    g.beginPath(); g.moveTo(RV_X0 + 52, 460); g.lineTo(RV_X0 + 60, 434); g.lineTo(RV_X0 + 68, 460); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(RV_X1 - 106, 460); g.lineTo(RV_X1 - 98, 436); g.lineTo(RV_X1 - 90, 460); g.closePath(); g.fill();
  }

  function yardFar(g, s) {
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const yTop = -s.worldOffY - 24, hAll = s.viewH + 48;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    g.fillStyle = LAWN_D; g.fillRect(x0, yTop, w0, hAll);   // base so nothing shows through
    ySky(g, x0, w0, yTop);
    yTreeline(g, x0, w0);
    yLawnFar(g, s, x0, w0);
    yTufts(g, x0, w0);   // shag first — house, car and props sit on top of it
    yBigTree(g);
    yHouse(g);
    yDrivewayFar(g);
    yRV(g);
    yCar(g);
    yProps(g);
  }

  // ============================= YARD: NEAR ===============================
  function yGrassNear(g, s, x0, w0, botY) {
    const gy = s.GROUND_Y;
    g.fillStyle = LAWN_D; g.fillRect(x0, gy, w0, botY - gy);
    g.fillStyle = SHADOW_SOFT; g.fillRect(x0, gy, w0, 8);   // contact under the far plane
    // seam rows sink toward the camera; blades get taller and darker
    for (let r = 0; r < 5; r++) {
      const y = gy + GROW[r], sp = 26 + r * 8;
      g.fillStyle = r < 2 ? TUFT_D : FG_BLADE2;
      const c0 = Math.floor(x0 / sp);
      for (let c = c0; c * sp < x0 + w0; c++) {
        const x = c * sp + jit(c * 5 + r * 23, sp - 6);
        const h = 7 + r * 3 + jit(c + r, 6);
        g.beginPath();
        g.moveTo(x - 4 - r, y); g.lineTo(x - 1, y - h); g.lineTo(x + 1, y);
        g.lineTo(x + 3, y - h + 3); g.lineTo(x + 5 + r, y);
        g.closePath(); g.fill();
      }
      if (r === 1 || r === 3) {
        g.globalAlpha = 0.45;
        g.fillStyle = s.checker(FG_BLADE);
        g.fillRect(x0, y - 2, w0, 8);
        g.globalAlpha = 1;
      }
    }
    // stray dandelions gone to seed
    g.fillStyle = FG_SEED;
    g.beginPath(); g.arc(x0 + jit(Math.floor(x0 / 90), 620) + 60, gy + 34, 4.5, 0, 7); g.fill();
    g.beginPath(); g.arc(x0 + jit(Math.floor(x0 / 90) + 3, 700) + 180, gy + 62, 5.5, 0, 7); g.fill();
    // low warm streaks raking in from the sun side
    g.fillStyle = WARM_STREAK;
    g.beginPath();
    g.moveTo(x0, gy + 6); g.lineTo(x0 + w0, gy + 26); g.lineTo(x0 + w0, gy + 40); g.lineTo(x0, gy + 16);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(x0, gy + 52); g.lineTo(x0 + w0, gy + 78); g.lineTo(x0 + w0, gy + 88); g.lineTo(x0, gy + 60);
    g.closePath(); g.fill();
  }

  function yDrivewayNear(g, s, botY) {
    const gy = s.GROUND_Y;
    g.fillStyle = DRV_INK;
    g.beginPath();
    g.moveTo(DRN0 - 5, gy); g.lineTo(DRN1 + 5, gy); g.lineTo(DRF1 + 6, botY); g.lineTo(DRF0 - 6, botY);
    g.closePath(); g.fill();
    g.fillStyle = DRV_MID;
    g.beginPath();
    g.moveTo(DRN0, gy); g.lineTo(DRN1, gy); g.lineTo(DRF1, botY); g.lineTo(DRF0, botY);
    g.closePath(); g.fill();
    g.fillStyle = DRV_LT;
    g.beginPath();
    g.moveTo(DRN0, gy); g.lineTo(DRN0 + 66, gy); g.lineTo(DRF0 + 96, botY); g.lineTo(DRF0, botY);
    g.closePath(); g.fill();
    g.fillStyle = DRV_DK; g.fillRect(DRN0 - 2, gy, DRN1 - DRN0 + 4, 6);
    // expansion joint + cracks
    g.fillStyle = DRV_INK; g.fillRect(DRN0 - 14, gy + 40, DRN1 - DRN0 + 58, 3);
    g.strokeStyle = CRACK; g.lineWidth = 2.4; g.lineJoin = 'round'; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(CRK_A[0], CRK_A[1]); g.lineTo(CRK_A[2], CRK_A[3]); g.lineTo(CRK_A[4], CRK_A[5]); g.lineTo(CRK_A[6], CRK_A[7]); g.stroke();
    g.beginPath(); g.moveTo(CRK_B[0], CRK_B[1]); g.lineTo(CRK_B[2], CRK_B[3]); g.lineTo(CRK_B[4], CRK_B[5]); g.lineTo(CRK_B[6], CRK_B[7]); g.stroke();
    g.beginPath(); g.moveTo(CRK_C[0], CRK_C[1]); g.lineTo(CRK_C[2], CRK_C[3]); g.lineTo(CRK_C[4], CRK_C[5]); g.stroke();
    // weeds prying the cracks open — the drive is clean because nothing parks on it
    g.fillStyle = TUFT_M;
    g.beginPath(); g.moveTo(1114, 506); g.lineTo(1118, 490); g.lineTo(1122, 506); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(1250, 502); g.lineTo(1254, 488); g.lineTo(1258, 502); g.closePath(); g.fill();
  }

  function yPollen(g, s) {
    const r = s.seeded(83);
    g.fillStyle = POLLEN;
    for (let i = 0; i < 18; i++) {
      const bx = r() * s.STAGE_W, by = 180 + r() * 260, sp = 0.2 + r() * 0.5, ph = r() * 6.3;
      const x = bx + ((s.t * sp * 26 + bx) % 300) - 150 + Math.sin(s.t * sp * 2 + ph) * 9;
      const y = by + Math.sin(s.t * sp * 1.3 + ph) * 14;
      g.globalAlpha = 0.14 + 0.22 * (0.5 + 0.5 * Math.sin(s.t * 1.4 + ph));
      g.beginPath(); g.arc(x, y, 1.3 + (i % 3) * 0.6, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }

  function yFore(g, s, x0, w0, botY) {
    // cropped shaggy overgrowth along the bottom edge, below the fighting band
    g.save();
    g.beginPath(); g.rect(x0, FORE_TOP, w0, Math.max(0, botY - FORE_TOP)); g.clip();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const sp = 64;
    const c0 = Math.floor(x0 / sp);
    for (let c = c0; c * sp < x0 + w0; c++) {
      const x = c * sp + jit(c * 11, 40);
      const lean = (jit(c, 9) - 4) * 2.2;
      for (let b = 0; b < 5; b++) {
        const bx = x + b * 7 - 14, tip = 496 + jit(c + b * 7, 22);
        g.strokeStyle = (b + c) % 2 ? FG_BLADE : FG_BLADE2;
        g.lineWidth = 3.6 - (b % 3) * 0.7;
        g.beginPath();
        g.moveTo(bx, botY + 6);
        g.quadraticCurveTo(bx + lean * 0.4, (botY + tip) / 2, bx + lean, tip);
        g.stroke();
      }
      if (jit(c, 4) === 1) {   // odd sunlit tip
        g.strokeStyle = FG_TIP; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + 2, botY - 10);
        g.quadraticCurveTo(x + 4 + lean * 0.5, 520, x + lean, 502 + jit(c, 12));
        g.stroke();
      }
    }
    g.lineCap = 'butt';
    g.restore();
  }

  function yardNear(g, s) {
    const gy = s.GROUND_Y;
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const bot = s.viewH - s.worldOffY + 24;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    yGrassNear(g, s, x0, w0, bot);
    yDrivewayNear(g, s, bot);
    yPollen(g, s);
    yFore(g, s, x0, w0, bot);
  }

  // ====================== GARAGE GEOMETRY + PALETTE =======================
  const G_CEIL = 64;                              // joist undersides
  const BULB_X = 875, BULB_Y = 142;
  const DARK_X = 280;                             // deep-shadow boundary (boss zone 0-280)
  const WALL = '#1d2030', WALL_DK = '#151827', WALL_INK = '#101322';
  const CEIL_C = '#0e101a', JOIST = '#181b28', JOIST_DK = '#0b0d15';
  const BLACK = '#06070d', BLACK_SIL = '#10121c', BLACK_SIL2 = '#171927';
  const DARK_V1 = 'rgba(6,7,13,0.72)', DARK_V2 = 'rgba(6,7,13,0.42)', DARK_V3 = 'rgba(6,7,13,0.20)';
  const GLOW_A = 'rgba(255,186,108,0.05)', GLOW_B = 'rgba(255,186,108,0.10)', GLOW_C = 'rgba(255,196,124,0.17)';
  const CONE = 'rgba(255,190,110,0.06)', CONE_IN = 'rgba(255,200,130,0.05)';
  const BULB_GLASS = '#ffd9a0', BULB_CORE = '#fff4d8', BULB_CAP = '#5c5648', CORD = '#2a2c3a';
  const BX_LT = '#8a6a44', BX_MID = '#755a3a', BX_DK = '#5f4930', BX_DP = '#463623', BX_INK = '#241b14';
  const BX_TOP = '#9a7a50', TAPE = '#9a8a68', SCRAWL = '#3a2d20';
  const CARPET_R = '#6e3a34', CARPET_RD = '#4a2622', CARPET_B = '#8a7a5c', CARPET_BD = '#5f5340', CARPET_D = '#3a2a26';
  const CHAIR = '#33261c', CHAIR_LT = '#5c4430', CHAIR_INK = '#1d1510';
  const MANQ = '#6e604e', MANQ_LT = '#a08a6c', MANQ_HI = '#c9b08a', MANQ_INK = '#241e18', MANQ_POLE = '#3a3d4a';
  const NEWS = '#84816c', NEWS_LT = '#a8a48a', NEWS_DK = '#5f5d4c', TWINE = '#55503f';
  const BIKE = '#3d4252', BIKE_LT = '#6a7288', BIKE_INK = '#23262f', BIKE_SEAT = '#4a3626';
  const BENCH = '#4a3a2a', BENCH_LT = '#6e563c', BENCH_INK = '#2a2015';
  const PAINT = '#565c6a', PAINT_LT = '#7c8494', PAINT_INK = '#2c2f3a', DRIP_R = '#8a3a30', DRIP_T = '#3a7a72';
  const LAMP_P = '#6e5a34', LAMP_S = '#8a7a5c', LAMP_SD = '#5f5340', LAMP_INK = '#3a3020';
  const GDOOR = '#2a2e3e', GDOOR_LN = '#1a1d2c', GDOOR_LT = '#3a4054';
  const FLOOR_G = '#262a36', FLOOR_DKG = '#1f222c', FLOOR_INKG = '#12141d';
  const STAIN = 'rgba(10,10,16,0.35)', OIL = 'rgba(16,14,24,0.5)', OIL_SHEEN = 'rgba(120,110,160,0.08)';
  const POOL_A2 = 'rgba(255,180,100,0.16)', POOL_B2 = 'rgba(255,180,100,0.09)', POOL_C2 = 'rgba(255,180,100,0.04)';
  const MOTE_G = '#ffd9a0';
  const RIM_WARM = '#6e5638';

  // box stacks: x, yTop, w, h, shade 0(bright)-3(dim), stride 5.
  // Nothing below y 380 carries tape or scrawl — the band stays quiet.
  const G_BOXES = [
    // left tower (x 300-520), dimmer — it borders the dark zone
    306, 386, 176, 82, 2,
    318, 314, 150, 72, 2,
    300, 240, 168, 74, 3,
    330, 176, 120, 64, 3,
    322, 112, 132, 64, 3,
    338, 58, 104, 54, 3,
    // mid clutter behind the mannequin/newspapers
    760, 300, 120, 80, 1,
    772, 232, 96, 68, 2,
    // right of bench, tall tower (x 990-1200)
    996, 388, 190, 80, 1,
    1010, 316, 160, 72, 1,
    994, 244, 178, 72, 2,
    1024, 180, 120, 64, 2,
    1016, 118, 136, 62, 3,
    1032, 62, 104, 56, 3,
    // bench-top stack
    1150, 250, 120, 70, 2,
    1162, 190, 92, 60, 2,
    // right wall, blocking the roll-up door
    1452, 384, 150, 84, 2,
    1464, 314, 128, 70, 2,
    1448, 244, 144, 70, 3,
    1470, 182, 100, 62, 3,
    1610, 386, 128, 82, 2,
    1622, 318, 104, 68, 3,
  ];
  const G_BOX_C = ['#8a6a44', '#755a3a', '#5f4930', '#463623'];   // by shade idx
  const G_BOX_T = ['#9a7a50', '#826440', '#6a5236', '#4e3c28'];
  // floor stains: x, y, rx, ry, stride 4
  const G_STAINS = [520, 500, 60, 12, 1210, 522, 80, 16, 940, 548, 46, 10, 1560, 508, 54, 11];

  function gBox(g, x, y, w, h, sh) {
    g.fillStyle = BX_INK; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = G_BOX_C[sh]; g.fillRect(x, y, w, h);
    g.fillStyle = G_BOX_T[sh]; g.fillRect(x, y, w, 8);
    g.fillStyle = BX_INK; g.fillRect(x, y + 8, w, 2);           // flap seam
    if (y < 372 && sh < 3) {
      g.fillStyle = TAPE; g.fillRect(x + w * 0.42, y, w * 0.16, h * 0.5);
      g.fillStyle = SCRAWL;                                      // marker scribble
      g.fillRect(x + 10, y + h * 0.42, w * 0.3, 3);
      g.fillRect(x + 10, y + h * 0.42 + 8, w * 0.2, 3);
    }
    // bulb-side edge catches warm light
    g.fillStyle = G_BOX_T[sh];
    if (x + w / 2 < BULB_X) g.fillRect(x + w - 4, y, 4, h);
    else g.fillRect(x, y, 4, h);
  }

  function gShell(g, s, x0, w0, yTop, hAll) {
    const gy = s.GROUND_Y;
    g.fillStyle = WALL_DK; g.fillRect(x0, yTop, w0, hAll);
    // the bulb's throw on the back wall — biggest shapes first
    wash(g, BULB_X, 320, 620, 340, GLOW_A, GLOW_B, GLOW_C);
    // ceiling: joist undersides in the dark
    g.fillStyle = CEIL_C; g.fillRect(x0, yTop, w0, G_CEIL - yTop);
    g.fillStyle = JOIST;
    const j0 = Math.floor(x0 / 130) * 130;
    for (let x = j0; x < x0 + w0; x += 130) g.fillRect(x, G_CEIL - 26, 14, 26);
    g.fillStyle = JOIST_DK; g.fillRect(x0, G_CEIL - 4, w0, 4);
    // faint mortar courses, only legible where the wash reaches
    g.fillStyle = WALL_INK;
    g.fillRect(600, 236, 560, 2); g.fillRect(620, 312, 520, 2);
    g.fillRect(870, 150, 2, gy - 150);
    g.fillStyle = WALL_DK; g.fillRect(x0, gy - 6, w0, 6);
  }

  function gDoorRight(g, gy) {
    // roll-up door filling the right end — buried behind her boxes
    g.fillStyle = GDOOR; g.fillRect(1500, 96, 280, gy - 96);
    g.fillStyle = GDOOR_LN;
    for (let y = 140; y < gy - 10; y += 46) g.fillRect(1500, y, 280, 4);
    g.fillStyle = GDOOR_LT; g.fillRect(1500, 96, 280, 4);
    g.fillStyle = GDOOR_LT; g.fillRect(1560, gy - 60, 40, 8);   // handle
    g.fillStyle = GDOOR_LN; g.fillRect(1500, 96, 4, gy - 96);
  }

  function gCarpets(g, gy) {
    // two fat rolls leaning on the tower, spiral ends up
    g.lineCap = 'round';
    g.strokeStyle = CARPET_D; g.lineWidth = 46;
    g.beginPath(); g.moveTo(528, gy - 10); g.lineTo(572, 252); g.stroke();
    g.strokeStyle = CARPET_R; g.lineWidth = 38;
    g.beginPath(); g.moveTo(528, gy - 12); g.lineTo(571, 254); g.stroke();
    g.strokeStyle = CARPET_RD; g.lineWidth = 12;
    g.beginPath(); g.moveTo(542, gy - 12); g.lineTo(584, 258); g.stroke();
    g.strokeStyle = CARPET_BD; g.lineWidth = 40;
    g.beginPath(); g.moveTo(596, gy - 10); g.lineTo(634, 300); g.stroke();
    g.strokeStyle = CARPET_B; g.lineWidth = 32;
    g.beginPath(); g.moveTo(596, gy - 12); g.lineTo(633, 302); g.stroke();
    g.lineCap = 'butt';
    // spiral ends
    g.fillStyle = CARPET_D; g.beginPath(); g.arc(572, 252, 23, 0, 7); g.fill();
    g.fillStyle = CARPET_R; g.beginPath(); g.arc(572, 252, 17, 0, 7); g.fill();
    g.fillStyle = CARPET_D; g.beginPath(); g.arc(574, 254, 10, 0, 7); g.fill();
    g.fillStyle = CARPET_RD; g.beginPath(); g.arc(575, 255, 5, 0, 7); g.fill();
    g.fillStyle = CARPET_BD; g.beginPath(); g.arc(634, 300, 20, 0, 7); g.fill();
    g.fillStyle = CARPET_B; g.beginPath(); g.arc(634, 300, 14, 0, 7); g.fill();
    g.fillStyle = CARPET_BD; g.beginPath(); g.arc(636, 302, 7, 0, 7); g.fill();
  }

  function gChairs(g, gy) {
    // two chunky kitchen chairs: one upright, one flipped seat-to-seat on it
    g.lineJoin = 'round';
    // upright chair
    g.fillStyle = CHAIR_INK;
    g.fillRect(654, 384, 118, 18);                                   // seat
    g.fillRect(656, 402, 14, gy - 402); g.fillRect(750, 402, 14, gy - 402);
    g.fillRect(740, 292, 16, 96);                                    // back post
    g.fillRect(694, 298, 52, 14);                                    // back slat
    g.fillStyle = CHAIR;
    g.fillRect(656, 386, 114, 13);
    g.fillRect(658, 402, 10, gy - 402); g.fillRect(752, 402, 10, gy - 402);
    g.fillRect(742, 294, 12, 92);
    g.fillRect(696, 300, 48, 10);
    g.fillStyle = CHAIR_LT;
    g.fillRect(752, 402, 4, gy - 402); g.fillRect(750, 294, 4, 92);
    g.fillRect(656, 386, 114, 4);
    // flipped chair balanced on top, legs in the air
    g.fillStyle = CHAIR_INK;
    g.fillRect(658, 356, 114, 17);                                   // its seat
    g.fillRect(664, 282, 14, 76); g.fillRect(744, 282, 14, 76);      // legs up
    g.fillRect(678, 306, 70, 12);                                    // stretcher
    g.fillStyle = CHAIR;
    g.fillRect(660, 358, 110, 12);
    g.fillRect(666, 284, 10, 74); g.fillRect(746, 284, 10, 74);
    g.fillRect(680, 308, 66, 8);
    g.fillStyle = CHAIR_LT;
    g.fillRect(746, 284, 4, 74); g.fillRect(660, 358, 110, 3);
  }

  function gMannequin(g, gy) {
    // dressmaker's form right at the pool's edge — the almost-figure
    g.fillStyle = MANQ_POLE;
    g.fillRect(818, 300, 6, gy - 316);
    g.beginPath(); g.moveTo(821, gy - 20); g.lineTo(794, gy); g.lineTo(804, gy); g.lineTo(824, gy - 14); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(821, gy - 20); g.lineTo(848, gy); g.lineTo(838, gy); g.lineTo(818, gy - 14); g.closePath(); g.fill();
    g.fillStyle = MANQ_INK;
    g.beginPath();
    g.moveTo(821, 176); g.lineTo(842, 182); g.lineTo(850, 214); g.lineTo(842, 252);
    g.lineTo(852, 292); g.lineTo(844, 308); g.lineTo(798, 308); g.lineTo(790, 292);
    g.lineTo(800, 252); g.lineTo(792, 214); g.lineTo(800, 182);
    g.closePath(); g.fill();
    g.fillStyle = MANQ;
    g.beginPath();
    g.moveTo(821, 180); g.lineTo(839, 185); g.lineTo(846, 214); g.lineTo(838, 252);
    g.lineTo(848, 290); g.lineTo(841, 304); g.lineTo(801, 304); g.lineTo(794, 290);
    g.lineTo(804, 252); g.lineTo(796, 214); g.lineTo(803, 185);
    g.closePath(); g.fill();
    // bulb is to the right: warm edge on the right flank
    g.fillStyle = MANQ_LT;
    g.beginPath();
    g.moveTo(839, 185); g.lineTo(846, 214); g.lineTo(838, 252); g.lineTo(848, 290);
    g.lineTo(841, 304); g.lineTo(833, 304); g.lineTo(840, 288); g.lineTo(830, 252);
    g.lineTo(838, 214); g.lineTo(832, 188);
    g.closePath(); g.fill();
    g.fillStyle = MANQ_HI; g.fillRect(838, 210, 4, 30);
    // neck stub + cap
    g.fillStyle = MANQ_INK; g.fillRect(814, 158, 14, 20);
    g.fillStyle = MANQ; g.fillRect(816, 160, 10, 16);
    g.fillStyle = MANQ_LT; g.beginPath(); g.arc(821, 158, 7, 0, 7); g.fill();
  }

  function gNews(g, gy) {
    // bundled newspapers directly under the bulb — brightest stack
    g.fillStyle = NEWS_DK; g.fillRect(872, 432, 96, 36);
    g.fillStyle = NEWS; g.fillRect(874, 434, 92, 30);
    g.fillStyle = NEWS_LT; g.fillRect(874, 434, 92, 6);
    g.fillStyle = TWINE; g.fillRect(902, 432, 4, 36); g.fillRect(938, 432, 4, 36);
    g.save();
    g.translate(918, 402); g.rotate(0.05);
    g.fillStyle = NEWS_DK; g.fillRect(-46, 0, 92, 32);
    g.fillStyle = NEWS; g.fillRect(-44, 2, 88, 26);
    g.fillStyle = NEWS_LT; g.fillRect(-44, 2, 88, 5);
    g.fillStyle = TWINE; g.fillRect(-16, 0, 4, 32); g.fillRect(20, 0, 4, 32);
    g.restore();
    g.save();
    g.translate(914, 372); g.rotate(-0.07);
    g.fillStyle = NEWS_DK; g.fillRect(-40, 0, 80, 30);
    g.fillStyle = NEWS; g.fillRect(-38, 2, 76, 24);
    g.fillStyle = NEWS_LT; g.fillRect(-38, 2, 76, 5);
    g.fillStyle = TWINE; g.fillRect(-10, 0, 4, 30);
    g.restore();
  }

  function gBike(g, gy) {
    // exercise bike, right of the newspapers
    g.strokeStyle = BIKE_INK; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1010, 420); g.lineTo(1064, 356); g.stroke();
    g.beginPath(); g.moveTo(1010, 420); g.lineTo(985, 354); g.stroke();
    g.strokeStyle = BIKE; g.lineWidth = 6;
    g.beginPath(); g.moveTo(1010, 420); g.lineTo(1064, 356); g.stroke();
    g.beginPath(); g.moveTo(1010, 420); g.lineTo(985, 354); g.stroke();
    g.lineCap = 'butt';
    // flywheel
    g.fillStyle = BIKE_INK; g.beginPath(); g.arc(1010, 424, 36, 0, 7); g.fill();
    g.fillStyle = BIKE; g.beginPath(); g.arc(1010, 424, 30, 0, 7); g.fill();
    g.fillStyle = BIKE_INK; g.beginPath(); g.arc(1010, 424, 20, 0, 7); g.fill();
    g.fillStyle = BIKE_LT; g.beginPath(); g.arc(1002, 416, 7, 0, 7); g.fill();
    g.fillStyle = BIKE; g.beginPath(); g.arc(1010, 424, 5, 0, 7); g.fill();
    // pedal, seat, bars — the T-bar joins its post so nothing floats
    g.fillStyle = BIKE_INK; g.fillRect(1028, 434, 18, 6);
    g.fillStyle = BIKE_SEAT; g.beginPath(); g.roundRect(1050, 346, 30, 11, 5); g.fill();
    g.fillStyle = BIKE_LT; g.beginPath(); g.roundRect(972, 344, 26, 8, 4); g.fill();
    g.fillStyle = BIKE; g.fillRect(982, 350, 6, 8);
    // base feet
    g.fillStyle = BIKE_INK; g.fillRect(984, gy - 8, 60, 8);
  }

  function gBench(g, gy) {
    // workbench with the paint shelf
    g.fillStyle = BENCH_INK; g.fillRect(1128, 374, 210, 12);
    g.fillStyle = BENCH; g.fillRect(1130, 376, 206, 8);
    g.fillStyle = BENCH_LT; g.fillRect(1130, 376, 206, 3);
    g.fillStyle = BENCH; g.fillRect(1140, 386, 10, gy - 386); g.fillRect(1316, 386, 10, gy - 386);
    g.fillStyle = BENCH_INK; g.fillRect(1146, 386, 4, gy - 386); g.fillRect(1322, 386, 4, gy - 386);
    paintCan(g, 1160, 334, 0); paintCan(g, 1200, 334, 1); paintCan(g, 1240, 338, 0); paintCan(g, 1284, 334, 1);
  }
  function paintCan(g, x, y, drip) {
    g.fillStyle = PAINT_INK; g.fillRect(x - 2, y - 2, 38, 46);
    g.fillStyle = PAINT; g.fillRect(x, y, 34, 42);
    g.fillStyle = PAINT_LT; g.fillRect(x, y, 8, 42);
    g.fillStyle = PAINT_INK; g.beginPath(); g.ellipse(x + 17, y, 18, 4.5, 0, 0, 7); g.fill();
    g.fillStyle = PAINT_LT; g.beginPath(); g.ellipse(x + 17, y, 15, 3.4, 0, 0, 7); g.fill();
    g.fillStyle = drip ? DRIP_T : DRIP_R;
    g.fillRect(x + 6, y + 4, 5, 14); g.fillRect(x + 24, y + 2, 4, 9);
  }

  function gLamps(g, gy) {
    // two dead floor lamps leaning into the last tower
    g.strokeStyle = LAMP_INK; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1382, gy - 2); g.lineTo(1398, 260); g.stroke();
    g.strokeStyle = LAMP_P; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(1382, gy - 2); g.lineTo(1398, 260); g.stroke();
    g.lineCap = 'butt';
    g.save();
    g.translate(1400, 250); g.rotate(0.22);
    g.fillStyle = LAMP_INK;
    g.beginPath(); g.moveTo(-26, 26); g.lineTo(-16, -16); g.lineTo(20, -16); g.lineTo(30, 26); g.closePath(); g.fill();
    g.fillStyle = LAMP_SD;
    g.beginPath(); g.moveTo(-22, 23); g.lineTo(-13, -13); g.lineTo(17, -13); g.lineTo(26, 23); g.closePath(); g.fill();
    g.fillStyle = LAMP_S;
    g.beginPath(); g.moveTo(-22, 23); g.lineTo(-13, -13); g.lineTo(-2, -13); g.lineTo(-8, 23); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = LAMP_INK; g.beginPath(); g.ellipse(1382, gy - 2, 26, 6, 0, 0, 7); g.fill();
    // the second, shorter, shade knocked crooked
    g.strokeStyle = LAMP_INK; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1430, gy - 2); g.lineTo(1420, 330); g.stroke();
    g.strokeStyle = LAMP_P; g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(1430, gy - 2); g.lineTo(1420, 330); g.stroke();
    g.lineCap = 'butt';
    g.save();
    g.translate(1419, 322); g.rotate(-0.38);
    g.fillStyle = LAMP_INK;
    g.beginPath(); g.moveTo(-20, 20); g.lineTo(-12, -12); g.lineTo(15, -12); g.lineTo(23, 20); g.closePath(); g.fill();
    g.fillStyle = LAMP_SD;
    g.beginPath(); g.moveTo(-17, 17); g.lineTo(-10, -9); g.lineTo(13, -9); g.lineTo(20, 17); g.closePath(); g.fill();
    g.restore();
  }

  function gDarkLeft(g, s, yTop, hAll) {
    // the boss's corner: everything left of DARK_X drowns
    g.fillStyle = BLACK; g.fillRect(-40, yTop, DARK_X + 40, hAll);
    // silhouettes a breath lighter than the void, so the hoard continues into it
    g.fillStyle = BLACK_SIL;
    g.fillRect(56, 296, 148, 172); g.fillRect(76, 208, 118, 88);
    g.fillRect(150, 120, 92, 88);
    g.beginPath(); g.moveTo(214, 468); g.lineTo(232, 368); g.lineTo(248, 468); g.closePath(); g.fill();
    g.fillStyle = BLACK_SIL2;
    g.fillRect(56, 296, 148, 6); g.fillRect(76, 208, 118, 5);
    // falloff: three stepped veils, one narrow dithered edge between them
    g.fillStyle = DARK_V1; g.fillRect(DARK_X, yTop, 44, hAll);
    g.fillStyle = DARK_V2; g.fillRect(DARK_X + 44, yTop, 48, hAll);
    g.fillStyle = DARK_V3; g.fillRect(DARK_X + 92, yTop, 44, hAll);
    g.globalAlpha = 0.4; g.fillStyle = s.checker(BLACK);
    g.fillRect(DARK_X + 28, yTop, 32, hAll);
    g.globalAlpha = 1;
  }

  function gBulb(g, gy) {
    // light cone first, then the fixture over it
    g.fillStyle = CONE;
    g.beginPath();
    g.moveTo(BULB_X - 12, BULB_Y); g.lineTo(BULB_X + 12, BULB_Y);
    g.lineTo(BULB_X + 195, gy); g.lineTo(BULB_X - 195, gy);
    g.closePath(); g.fill();
    g.fillStyle = CONE_IN;
    g.beginPath();
    g.moveTo(BULB_X - 8, BULB_Y); g.lineTo(BULB_X + 8, BULB_Y);
    g.lineTo(BULB_X + 120, gy); g.lineTo(BULB_X - 120, gy);
    g.closePath(); g.fill();
    g.fillStyle = CORD; g.fillRect(BULB_X - 2, G_CEIL - 8, 4, BULB_Y - G_CEIL - 4);
    g.fillStyle = BULB_CAP; g.beginPath(); g.roundRect(BULB_X - 6, BULB_Y - 16, 12, 12, 3); g.fill();
    g.fillStyle = GLOW_C; g.beginPath(); g.arc(BULB_X, BULB_Y, 34, 0, 7); g.fill();
    g.fillStyle = BULB_GLASS; g.beginPath(); g.arc(BULB_X, BULB_Y, 13, 0, 7); g.fill();
    g.fillStyle = BULB_CORE; g.beginPath(); g.arc(BULB_X - 2, BULB_Y - 2, 6, 0, 7); g.fill();
  }

  function garageFar(g, s) {
    const gy = s.GROUND_Y;
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const yTop = -s.worldOffY - 24, hAll = s.viewH + 48;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    gShell(g, s, x0, w0, yTop, hAll);
    gDoorRight(g, gy);
    for (let i = 0; i < G_BOXES.length; i += 5) {
      gBox(g, G_BOXES[i], G_BOXES[i + 1], G_BOXES[i + 2], G_BOXES[i + 3], G_BOXES[i + 4]);
    }
    gCarpets(g, gy);
    gChairs(g, gy);
    gMannequin(g, gy);
    gNews(g, gy);
    gBike(g, gy);
    gBench(g, gy);
    gLamps(g, gy);
    gDarkLeft(g, s, yTop, hAll);
    gBulb(g, gy);
  }

  // ============================ GARAGE: NEAR ==============================
  function gMotes(g, s) {
    const r = s.seeded(59);
    g.fillStyle = MOTE_G;
    for (let i = 0; i < 20; i++) {
      const bx = BULB_X - 130 + r() * 260, by = r() * 300, sp = 0.15 + r() * 0.5, ph = r() * 6.3;
      const y = 170 + ((by + s.t * sp * 9) % 300);
      const x = bx + Math.sin(s.t * sp + ph) * 10;
      g.globalAlpha = 0.16 + 0.26 * (0.5 + 0.5 * Math.sin(s.t * 1.5 + ph));
      g.beginPath(); g.arc(x, y, 1.1 + (i % 3) * 0.5, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }

  function garageNear(g, s) {
    const gy = s.GROUND_Y;
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const bot = s.viewH - s.worldOffY + 24;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    // slab
    g.fillStyle = FLOOR_G; g.fillRect(x0, gy, w0, bot - gy);
    g.fillStyle = FLOOR_DKG; g.fillRect(x0, gy, w0, 20);
    g.globalAlpha = 0.4; g.fillStyle = s.checker(FLOOR_DKG);
    g.fillRect(x0, gy + 20, w0, 8);
    g.globalAlpha = 1;
    g.fillStyle = FLOOR_INKG; g.fillRect(x0, gy, w0, 5);
    // saw joints
    g.fillStyle = FLOOR_INKG;
    g.fillRect(585, gy, 3, bot - gy); g.fillRect(1165, gy, 3, bot - gy);
    g.fillRect(x0, gy + 52, w0, 2.5);
    // stains + the oil ghost of a car that never parks inside
    g.fillStyle = STAIN;
    for (let i = 0; i < G_STAINS.length; i += 4) {
      g.beginPath(); g.ellipse(G_STAINS[i], G_STAINS[i + 1], G_STAINS[i + 2], G_STAINS[i + 3], 0, 0, 7); g.fill();
    }
    g.fillStyle = OIL; g.beginPath(); g.ellipse(760, 516, 90, 20, 0, 0, 7); g.fill();
    g.fillStyle = OIL_SHEEN; g.beginPath(); g.ellipse(742, 512, 40, 8, 0, 0, 7); g.fill();
    // the bulb's pool mid-stage
    wash(g, BULB_X, gy + 40, 330, 74, POOL_C2, POOL_B2, POOL_A2);
    // deep-shadow floor at the boss end, same falloff as the wall
    g.fillStyle = BLACK; g.fillRect(x0 < -40 ? x0 : -40, gy, DARK_X + 40 + (x0 < -40 ? -x0 - 40 : 0), bot - gy);
    g.fillStyle = DARK_V1; g.fillRect(DARK_X, gy, 44, bot - gy);
    g.fillStyle = DARK_V2; g.fillRect(DARK_X + 44, gy, 48, bot - gy);
    g.fillStyle = DARK_V3; g.fillRect(DARK_X + 92, gy, 44, bot - gy);
    g.globalAlpha = 0.4; g.fillStyle = s.checker(BLACK);
    g.fillRect(DARK_X + 28, gy, 32, bot - gy);
    g.globalAlpha = 1;
    gMotes(g, s);
    // cropped foreground: overflow of the hoard, hard-clipped below the band
    g.save();
    g.beginPath(); g.rect(x0, FORE_TOP, w0, Math.max(0, bot - FORE_TOP)); g.clip();
    // near-black box corner drifting out of the dark zone
    g.fillStyle = BLACK; g.fillRect(60, 492, 300, bot - 492);
    g.fillStyle = BLACK_SIL2; g.fillRect(60, 492, 300, 7);
    g.fillStyle = BLACK_SIL; g.fillRect(352, 500, 8, bot - 500);
    // paint cans catching a warm rim from the bulb
    g.fillStyle = PAINT_INK; g.fillRect(1234, 500, 44, bot - 500);
    g.fillStyle = RIM_WARM; g.fillRect(1234, 500, 5, bot - 500);
    g.fillStyle = PAINT_INK; g.beginPath(); g.ellipse(1256, 500, 24, 7, 0, 0, 7); g.fill();
    g.fillStyle = RIM_WARM; g.beginPath(); g.ellipse(1256, 500, 24, 7, 0, 2.6, 4.6); g.fill();
    g.fillStyle = PAINT_INK; g.fillRect(1286, 512, 38, bot - 512);
    g.fillStyle = RIM_WARM; g.fillRect(1286, 512, 4, bot - 512);
    // rolled carpet end, lower right
    g.fillStyle = CARPET_D; g.beginPath(); g.arc(1520, 546, 46, 0, 7); g.fill();
    g.fillStyle = CARPET_RD; g.beginPath(); g.arc(1520, 546, 34, 0, 7); g.fill();
    g.fillStyle = CARPET_D; g.beginPath(); g.arc(1522, 548, 20, 0, 7); g.fill();
    g.fillStyle = CARPET_RD; g.beginPath(); g.arc(1524, 550, 9, 0, 7); g.fill();
    g.fillStyle = RIM_WARM; g.beginPath(); g.arc(1520, 546, 46, 3.6, 5.2); g.fill();
    g.fillStyle = CARPET_D; g.beginPath(); g.arc(1520, 546, 38, 3.6, 5.2); g.fill();
    g.restore();
  }

  S['collette-yard'] = {
    far: function (g, s) { yardFar(g, s); },
    near: function (g, s) { yardNear(g, s); },
  };
  S['collette-garage'] = {
    far: function (g, s) { garageFar(g, s); },
    near: function (g, s) { garageNear(g, s); },
  };
})();
