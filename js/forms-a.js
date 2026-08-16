// forms-a.js — nine FINAL FORM bodies: THE TODDFATHER, XANAX SONYA, BABYSITTER
// JORDAN, 3D PRINTER JEROD, WRENCHY, GIANT CHICKEN, LITTLE BEAR SPECIAL,
// RICKMOTHY and LEVIATHAN. Same contract as skins-*.js: local feet-space with
// (0,0) at the feet, -y up, +x forward. The caller owns translate/flip/scale,
// the ground shadow, the ONE ascended radial gradient, and the flash/frozen
// overlays — these functions draw the body and nothing else. Every palette,
// mote table and constant array is hoisted; the draw bodies allocate nothing.
(function () {
  const F = (window.FORM_BODIES = window.FORM_BODIES || {});

  // ---- shared chibi-head tints (same values drawFighter uses) ----
  const HEAD_SHADE = 'rgba(20,16,26,0.16)';
  const HEAD_RIM = 'rgba(255,246,221,0.4)';
  const GAP_INK = '#14101a';

  // back-of-head shade crescent + warm sun rim, clipped to the skull
  function headBase(g, a, hx, hy, r, skin) {
    const S = a.ramp(skin);
    g.fillStyle = skin; g.strokeStyle = S.out; g.lineWidth = 2;
    g.beginPath(); g.arc(hx, hy, r, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.arc(hx, hy, r - 0.4, 0, 7); g.clip();
    g.fillStyle = HEAD_SHADE;
    g.fillRect(hx - r - 1, hy - r - 1, r * 0.62, r * 2 + 2);
    g.strokeStyle = HEAD_RIM; g.lineWidth = 2.2;
    g.beginPath(); g.arc(hx - 0.5, hy - 1, r * 0.77, 3.2, 5.09); g.stroke();
    g.restore();
  }

  // ============================ THE TODDFATHER ============================
  const TODD_SKIN = '#e8b58a';
  const TODD_JEAN = '#4a5a7a';
  const TODD_BOOT = '#6b4423';
  const TODD_BEARD = '#d8d4c8';
  const TODD_STRIA = '#b5ad96';
  const TODD_FLAN = '#e8524a';
  const TODD_PLAID = '#a83228';
  const TODD_GOLD = '#ffd24a';
  const TODD_WRAP = '#f2ede0';
  const TODD_SHINE = 'rgba(255,255,255,0.4)';
  const TODD_SHIMMER = 'rgba(255,210,74,0.25)';
  // knuckle embers: dx, dy, phase, r
  const TODD_EMBERS = [34, -44, 0.0, 1.3, -33, -42, 0.4, 1.1, 36, -38, 0.7, 1.2];

  F.todd = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const R = a.ramp(TODD_SKIN), BT = a.ramp(TODD_BOOT);
    const FL = a.ramp(TODD_FLAN), BR = a.ramp(TODD_BEARD), GD = a.ramp(TODD_GOLD);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;

    let lean = 0, flare = 0, beardUp = 0;
    let fhx = 34 + step * 8, fhy = -40, bhx = -34 + step * 8, bhy = -40;
    if (k === 'punch' || k === 'cross') { fhx = 34 + 30 * ext; fhy = -42; lean = 4 * ext; }
    else if (k === 'kick') { // X3 slot reinterpreted: the double overhead slam
      fhx = 10 + 16 * ext; fhy = -96 + 56 * ext; bhx = fhx - 15; bhy = fhy + 3; beardUp = 4;
    } else if (k === 'B') {
      fhx = 12; fhy = -50 - 34 * ext; bhx = -20; bhy = -50 - 20 * ext;
      lean = -4 * ext; flare = 4 * ext;
    }
    if (a.hurt) { lean = -8; beardUp = 3; }

    const shelf = Math.sin(t * 1.8);            // shoulder shelf breath
    const pb = Math.sin(t * 2.4) * 0.8;         // alternating pec flex
    const bs = Math.sin(t * 1.5) * 0.6;         // beard sway
    const drop = a.moving ? Math.abs(step) * 1.5 : 0;
    // feet stay planted: pre-subtract the stomp drop and lean shift
    const bfx = a.bfx - lean * 0.4, bfy = a.bfy - drop;
    const ffx = a.ffx - lean * 0.4, ffy = a.ffy - drop;
    g.translate(lean * 0.4, drop);

    // 1 back leg + steel-toe boot
    a.limbStroke(g, -3, -32, bfx, bfy, 10, TODD_JEAN);
    g.fillStyle = BT.out; g.beginPath(); g.roundRect(bfx - 5, bfy - 8, 14, 9, 3); g.fill();
    g.fillStyle = TODD_BOOT; g.beginPath(); g.roundRect(bfx - 4.2, bfy - 7.3, 12.6, 7.6, 2.6); g.fill();
    g.fillStyle = BT.hi; g.beginPath(); g.arc(bfx + 6.4, bfy - 4.6, 1.3, 0, 7); g.fill();

    // 2 the flannel war trophy, knotted at the hip
    g.fillStyle = TODD_FLAN; g.strokeStyle = FL.out; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-14, -34);
    g.lineTo(-24 - flare, -30);
    g.lineTo(-26 - flare - bs, -6);
    g.lineTo(-16, -10);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = TODD_PLAID; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-24 - flare, -26); g.lineTo(-15, -28);
    g.moveTo(-25 - flare, -18); g.lineTo(-16, -21);
    g.moveTo(-21 - flare, -31); g.lineTo(-22 - flare, -9);
    g.stroke();
    g.strokeStyle = FL.dk; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-26 - flare - bs, -6); g.lineTo(-23, -10); g.lineTo(-21, -6);
    g.lineTo(-19, -10); g.lineTo(-16, -10);
    g.stroke();

    // 3 back arm — forearm capsule is wider than the upper arm
    a.limbStroke(g, -24, -70 + shelf, bhx, bhy, 13, R.dk);
    a.limbStroke(g, (-24 + bhx) * 0.5, (-70 + shelf + bhy) * 0.5, bhx, bhy, 15, R.dk);

    // 4 torso wedge
    g.fillStyle = TODD_SKIN; g.strokeStyle = R.out; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-14, -34); g.lineTo(14, -34); g.lineTo(30, -72 + shelf); g.lineTo(-26, -72 + shelf);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = R.lt;
    g.beginPath();
    g.moveTo(-23, -70 + shelf); g.lineTo(-5, -70 + shelf); g.lineTo(-7, -50); g.lineTo(-18, -50);
    g.closePath(); g.fill();

    // 5 abs grid
    g.strokeStyle = R.dk; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-2, -38); g.lineTo(-2, -56);
    g.moveTo(4, -38); g.lineTo(4, -56);
    g.moveTo(-6, -42); g.lineTo(8, -42);
    g.moveTo(-6, -48); g.lineTo(8, -48);
    g.moveTo(-6, -54); g.lineTo(8, -54);
    g.stroke();

    // 6 shield pecs (right one flexes a half-cycle behind the left)
    g.fillStyle = TODD_SKIN;
    g.beginPath(); g.arc(-4, -62 + shelf, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(10, -62 + shelf, 9, 0, 7); g.fill();
    g.strokeStyle = R.dk; g.lineWidth = 1.6;
    g.beginPath(); g.arc(-4, -62 + shelf, 8, 0.35, 2.6); g.stroke();
    g.beginPath(); g.arc(10, -62 + shelf, 8, 0.35, 2.6); g.stroke();
    g.strokeStyle = R.lt; g.lineWidth = 2.2;
    g.beginPath(); g.arc(-4, -62 + shelf + pb, 6.4, 3.3, 4.6); g.stroke();
    g.beginPath(); g.arc(10, -62 + shelf - pb, 6.4, 3.3, 4.6); g.stroke();

    // 7 BBQ buckle
    g.fillStyle = TODD_GOLD; g.beginPath(); g.roundRect(-5, -36, 12, 7, 2); g.fill();
    g.strokeStyle = GD.dk; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-2.5, -33.2); g.lineTo(0.5, -33.2);
    g.moveTo(2, -33.2); g.lineTo(4.5, -33.2);
    g.stroke();

    // 8 shoulder boulders
    const sy = -70 + shelf;
    g.fillStyle = TODD_SKIN; g.strokeStyle = R.out; g.lineWidth = 2.4;
    g.beginPath(); g.arc(-26, sy, 12, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(26, sy, 12, 0, 7); g.fill(); g.stroke();
    g.fillStyle = R.lt;
    g.beginPath(); g.arc(-28, sy - 3.5, 5.6, 0, 7); g.fill();
    g.beginPath(); g.arc(23.6, sy - 3.5, 5.6, 0, 7); g.fill();
    g.strokeStyle = R.dk; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-26, sy, 9, 0.6, 2.2); g.stroke();
    g.beginPath(); g.arc(26, sy, 9, 0.6, 2.2); g.stroke();

    // 9 the silver avalanche
    g.fillStyle = TODD_BEARD; g.strokeStyle = BR.out; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(4, -84 - beardUp);
    g.quadraticCurveTo(-8 + bs, -70 - beardUp, -6 + bs, -54 - beardUp);
    g.quadraticCurveTo(4 + bs, -47 - beardUp, 14 + bs, -54 - beardUp);
    g.quadraticCurveTo(16, -70 - beardUp, 12, -84 - beardUp);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = TODD_STRIA; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-1, -78 - beardUp); g.lineTo(-3 + bs, -56 - beardUp);
    g.moveTo(4, -78 - beardUp); g.lineTo(3 + bs, -52 - beardUp);
    g.moveTo(9, -78 - beardUp); g.lineTo(9 + bs, -54 - beardUp);
    g.moveTo(13, -76 - beardUp); g.lineTo(14 + bs, -58 - beardUp);
    g.stroke();
    g.strokeStyle = BR.lt; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(3, -83 - beardUp); g.quadraticCurveTo(-9 + bs, -70 - beardUp, -5 + bs, -55 - beardUp);
    g.stroke();

    // 10 the head — small on purpose, and not chibi-scaled
    g.fillStyle = TODD_SKIN; g.strokeStyle = R.out; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-3.6, -89, 2.3, 0, 7); g.fill(); g.stroke();
    headBase(g, a, 4, -90, 8, TODD_SKIN);
    g.strokeStyle = TODD_SHINE; g.lineWidth = 1.6;
    g.beginPath(); g.arc(4, -90, 5.6, 3.6, 4.7); g.stroke();
    g.strokeStyle = a.INK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0.6, -93.6); g.lineTo(9.4, -92.4); g.stroke();
    g.fillStyle = a.INK;
    g.beginPath(); g.arc(3, -90.4, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(7.6, -90.1, 1.1, 0, 7); g.fill();

    // 11 front leg + boot
    a.limbStroke(g, 3, -32, ffx, ffy, 10, TODD_JEAN);
    g.fillStyle = BT.out; g.beginPath(); g.roundRect(ffx - 5, ffy - 8, 14, 9, 3); g.fill();
    g.fillStyle = TODD_BOOT; g.beginPath(); g.roundRect(ffx - 4.2, ffy - 7.3, 12.6, 7.6, 2.6); g.fill();
    g.fillStyle = BT.hi; g.beginPath(); g.arc(ffx + 6.4, ffy - 4.6, 1.3, 0, 7); g.fill();

    // 12 front arm + forearm overlay
    a.limbStroke(g, 26, -70 + shelf, fhx, fhy, 13, TODD_SKIN);
    a.limbStroke(g, (26 + fhx) * 0.5, (-70 + shelf + fhy) * 0.5, fhx, fhy, 15, TODD_SKIN);

    // 13 taped mitts: skin disc, wrap band, gold studs
    for (let i = 0; i < 2; i++) {
      const mx = i ? fhx : bhx, my = i ? fhy : bhy;
      g.fillStyle = i ? TODD_SKIN : R.dk; g.strokeStyle = R.out; g.lineWidth = 2.4;
      g.beginPath(); g.arc(mx, my, 10, 0, 7); g.fill(); g.stroke();
      g.fillStyle = TODD_WRAP;
      g.beginPath(); g.roundRect(mx - 7, my - 2, 14, 7, 2); g.fill();
      g.strokeStyle = a.ramp(TODD_WRAP).dk; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(mx - 6, my + 0.4); g.lineTo(mx + 6, my + 0.4);
      g.moveTo(mx - 6, my + 3); g.lineTo(mx + 6, my + 3);
      g.stroke();
      g.fillStyle = TODD_GOLD;
      g.beginPath(); g.arc(mx - 4, my - 4.6, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(mx + 0.4, my - 5.6, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(mx + 4.8, my - 4.6, 1.5, 0, 7); g.fill();
    }

    // 14 knuckle embers + the heat shimmer over the shoulder shelf
    g.fillStyle = TODD_GOLD;
    for (let i = 0; i < 12; i += 4) {
      const ph = TODD_EMBERS[i + 2];
      const cyc = (t * 0.5 + ph) % 1;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.beginPath();
      g.arc(TODD_EMBERS[i] + 1.5 * Math.sin(t * 3 + ph * 6), TODD_EMBERS[i + 1] - cyc * 10, TODD_EMBERS[i + 3], 0, 7);
      g.fill();
    }
    g.globalAlpha = 0.8 + 0.2 * Math.sin(t * 6);
    g.strokeStyle = TODD_SHIMMER; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-24, -76 + shelf); g.quadraticCurveTo(2, -82 + shelf, 28, -76 + shelf); g.stroke();
    g.globalAlpha = 1;
  };

  // ============================== XANAX SONYA =============================
  const SON_GOWN = '#8a3268';
  const SON_CARD = '#e84a92';
  const SON_SASH = '#e0b8ff';
  const SON_HALO = '#f4ecff';
  const SON_PAGE = '#fff8e6';
  const SON_SKIN = '#e8b58a';
  const SON_BLUSH = 'rgba(255,122,122,0.25)';
  // orbit books: phase, spine color
  const SONYA_BOOKS = [0, '#4a86e8', 2.09, '#37b34a', 4.19, '#d43b2f'];
  // sparkle motes: dx, dy, phase
  const SONYA_SPARKS = [-18, -70, 0.0, 20, -62, 0.3, -10, -92, 0.55, 14, -88, 0.8];

  function sonyaBook(g, a, bx, by, col, rot, pw) {
    const R = a.ramp(col);
    g.save(); g.translate(bx, by); g.rotate(rot);
    g.fillStyle = col; g.strokeStyle = R.out; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(-5, -3.5, 10, 7, 1); g.fill(); g.stroke();
    g.fillStyle = SON_PAGE; g.fillRect(3.2, -3, pw, 6);
    g.strokeStyle = R.lt; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-3.4, -2.6); g.lineTo(-3.4, 2.6); g.stroke();
    g.restore();
  }

  F.sonya = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const GW = a.ramp(SON_GOWN), CD = a.ramp(SON_CARD);
    const swat = k === 'punch' || k === 'cross';
    const ram = k === 'kick';
    const rise = k === 'B';
    const ry = rise ? 10 + 14 * ext : 10;                 // books spiral up on B
    const spin = rise ? 3.3 : 1.1;
    const hem = Math.sin(t * (a.moving ? 3.2 : 1.6)) * 2; // gown ripple
    const rib = Math.sin(t * 1.6 - 0.6) * 3;              // ribbon tips lag the hem
    const trail = a.moving ? -4 : 0;
    const flare = rise ? 4 * ext : 0;

    // 1 the three overdue books, back half of the orbit
    for (let i = 0; i < 6; i += 2) {
      const ph = SONYA_BOOKS[i];
      const ang = t * spin * (rise ? 3 : 1) + ph;
      if (Math.sin(ang) >= 0 || swat || ram) continue;
      sonyaBook(g, a, Math.cos(ang) * 30, -50 + Math.sin(ang) * ry, SONYA_BOOKS[i + 1], 0, 2.4);
    }

    // 2 the gown bell
    g.fillStyle = SON_GOWN; g.strokeStyle = GW.out; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-8, -64);
    g.quadraticCurveTo(-30 - flare, -30, -26 - flare + hem, -8);
    g.lineTo(26 + flare + hem, -8);
    g.quadraticCurveTo(30 + flare, -30, 12, -64);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = GW.lt;
    g.beginPath();
    g.moveTo(-7, -62); g.quadraticCurveTo(-22, -34, -18 + hem, -14);
    g.lineTo(-8 + hem, -14); g.quadraticCurveTo(-10, -36, 0, -62);
    g.closePath(); g.fill();
    g.strokeStyle = GW.dk; g.lineWidth = 1.6;
    g.beginPath();
    g.arc(-15 + hem, -9, 6, 3.34, 6.08);
    g.moveTo(-3 + hem, -9); g.arc(-3 + hem, -9, 6, 3.34, 6.08);
    g.moveTo(15 + hem, -9); g.arc(15 + hem, -9, 6, 3.34, 6.08);
    g.stroke();
    g.strokeStyle = SON_GOWN; g.lineWidth = 2.4;   // 2 trailing ribbon tips
    g.beginPath();
    g.moveTo(-22 + hem, -10); g.quadraticCurveTo(-28 - rib + trail, -6, -32 - rib + trail, -1);
    g.moveTo(-16 + hem, -9); g.quadraticCurveTo(-22 - rib + trail, -4, -25 - rib + trail, 1);
    g.stroke();

    // 3 sash
    g.fillStyle = SON_SASH; g.beginPath(); g.roundRect(-12, -46, 26, 5, 2); g.fill();
    g.strokeStyle = a.ramp(SON_SASH).hi; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-10, -44.4); g.lineTo(12, -44.4); g.stroke();

    // 4 cardigan yoke + the one (1) pill she took
    g.fillStyle = SON_CARD; g.strokeStyle = CD.out; g.lineWidth = 2;
    g.beginPath(); g.arc(-6, -64, 7, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(10, -64, 7, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = CD.dk; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-3, -68); g.lineTo(2, -58); g.lineTo(7, -68);
    g.stroke();
    g.fillStyle = '#ffffff'; g.strokeStyle = a.ramp('#ffffff').out; g.lineWidth = 1;
    g.beginPath(); g.ellipse(2, -58, 1.6, 1.1, 0, 0, 7); g.fill(); g.stroke();

    // 5 hands resting palm-up in the lap
    const hlx = rise ? -2 : -4, hly = rise ? -56 : -40;
    const hrx = rise ? 8 : 6, hry = rise ? -56 : -40;
    const SK = a.ramp(SON_SKIN);
    g.fillStyle = SON_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.6;
    g.beginPath(); g.arc(hlx, hly, 3.6, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(hrx, hry, 3.6, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = SK.dk; g.lineWidth = 1;
    g.beginPath(); g.arc(hlx, hly + 0.6, 2.4, 3.5, 5.9); g.stroke();
    g.beginPath(); g.arc(hrx, hry + 0.6, 2.4, 3.5, 5.9); g.stroke();

    // 6 chibi head group — serene, eyes closed
    g.save();
    g.translate(3, -85); g.rotate(Math.sin(t * 0.9) * 0.026); g.scale(1.32, 1.32); g.translate(-3, 85);
    const hair = a.ramp(a.color2).dk, HR = a.ramp(hair);
    g.fillStyle = HR.out;
    g.beginPath(); g.arc(3, -86.5, 9.9, Math.PI, Math.PI * 2); g.fill();
    headBase(g, a, 3, -85, 9, SON_SKIN);
    g.fillStyle = hair;
    g.beginPath(); g.ellipse(-6, -82, 3.4, 7, 0.5, 0, 7); g.fill();
    g.beginPath(); g.arc(3, -86.5, 9.2, Math.PI * 1.02, Math.PI * 1.98); g.fill();
    g.strokeStyle = HR.lt; g.lineWidth = 2;
    g.beginPath(); g.arc(3, -86.5, 7.8, Math.PI * 1.08, Math.PI * 1.55); g.stroke();
    g.fillStyle = SON_BLUSH;
    g.beginPath(); g.ellipse(3.6, -82.8, 1.7, 1.05, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(9.8, -83, 1.7, 1.05, 0, 0, 7); g.fill();
    g.strokeStyle = a.INK; g.lineWidth = 1.3;
    if (a.hurt) { // one eye cracks open — the closest she gets to bothered
      g.beginPath(); g.arc(5, -86.5, 1.5, 0.2, 2.9); g.stroke();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(9.2, -86.5, 1.9, 1.4, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(9.7, -86.4, 0.95, 0, 7); g.fill();
    } else {
      g.beginPath(); g.arc(5, -87.6, 1.7, 0.35, 2.79); g.stroke();
      g.beginPath(); g.arc(9.2, -87.6, 1.7, 0.35, 2.79); g.stroke();
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(3.1, -86.6); g.lineTo(2.1, -87.3);
      g.moveTo(6.9, -86.6); g.lineTo(7.6, -87.3);
      g.moveTo(7.3, -86.6); g.lineTo(6.4, -87.3);
      g.moveTo(11.1, -86.6); g.lineTo(11.8, -87.3);
      g.stroke();
    }
    g.strokeStyle = a.INK; g.lineWidth = 1.2;
    g.beginPath(); g.arc(7, -83.4, 2.2, 0.5, 2.64); g.stroke();
    g.restore();

    // 7 halo — flat stroke, breathing, never strobing
    g.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5);
    g.strokeStyle = SON_HALO; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(3, -97 - Math.sin(t * 5) * 0.5, 11, 3.5, 0, 0, 7); g.stroke();
    g.globalAlpha = 1;

    // 8 front half of the orbit (or the weaponized books)
    for (let i = 0; i < 6; i += 2) {
      const ph = SONYA_BOOKS[i];
      const ang = t * spin * (rise ? 3 : 1) + ph;
      if (swat) {
        if (i === 0) sonyaBook(g, a, 14 + 26 * ext, -52, SONYA_BOOKS[1], 0.4 * ext, ext > 0.5 ? 3.4 : 2.4);
        else if (Math.sin(ang) >= 0) sonyaBook(g, a, Math.cos(ang) * 30, -50 + Math.sin(ang) * ry, SONYA_BOOKS[i + 1], 0, 2.4);
        continue;
      }
      if (ram) { // X3: the three of them line up and ram together
        sonyaBook(g, a, 18 + i * 3 + 14 * ext, -52, SONYA_BOOKS[i + 1], 0, 2.4);
        continue;
      }
      if (Math.sin(ang) < 0) continue;
      sonyaBook(g, a, Math.cos(ang) * 30, -50 + Math.sin(ang) * ry, SONYA_BOOKS[i + 1], 0, 2.4);
    }

    // 9 unhurried sparkles drifting up
    g.strokeStyle = SON_HALO; g.lineWidth = 1;
    for (let i = 0; i < 12; i += 3) {
      const cyc = (t * 0.35 + SONYA_SPARKS[i + 2]) % 1;
      const sx = SONYA_SPARKS[i], sy2 = SONYA_SPARKS[i + 1] - cyc * 8;
      g.globalAlpha = (1 - cyc) * 0.7;
      g.beginPath();
      g.moveTo(sx - 2, sy2); g.lineTo(sx + 2, sy2);
      g.moveTo(sx, sy2 - 2); g.lineTo(sx, sy2 + 2);
      g.stroke();
    }
    g.globalAlpha = 1;
  };

  // ============================ BABYSITTER JORDAN =========================
  const JOR_TEE = '#e8784a';
  const JOR_VEST = '#6a7288';
  const JOR_ALU = '#c9ccd8';
  const JOR_CANOPY = '#4a86e8';
  const JOR_PIPE = '#ffec9a';
  const JOR_WHITE = '#ffffff';
  const JOR_PACK = '#37b34a';
  const JOR_STRAP = '#3a3f4a';
  const JOR_BODY = '#3a3f4a';
  const JOR_WIPE = '#f2ede0';
  const JOR_SWEAT = '#9fdcff';
  const JOR_SKIN = '#e8b58a';
  const JOR_SPIN = 'rgba(255,236,154,0.5)';
  // carrier-frame twinkles: dx, dy, phase
  const JORDAN_TWINKS = [-12, -98, 0.0, 14, -92, 0.4, 2, -108, 0.7];

  F.jordan = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const AL = a.ramp(JOR_ALU), VS = a.ramp(JOR_VEST);
    const CB = a.ramp(JOR_BODY), SK = a.ramp(JOR_SKIN);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    const kickPose = k === 'punch' || k === 'cross';
    const spin = k === 'kick';                         // the 720 no-look
    const bounce = a.moving ? -Math.abs(step) * 2 : 0; // all the gear rides it
    const lag = a.moving ? -Math.abs(Math.sin(a.walkCyc - 0.4)) * 2 : 0;
    const breath = Math.sin(t * 2) * 1;
    let lean = 0;
    let ffx = a.ffx, ffy = a.ffy, bfx = a.bfx, bfy = a.bfy;
    if (kickPose) { ffx = 10 + 34 * ext; ffy = -40 * ext; lean = -5 * ext; }
    else if (spin) { ffx = 18 + 14 * ext; ffy = -22 - 8 * ext; bfx = -16 - 10 * ext; bfy = -14 - 6 * ext; lean = -8; }
    const scat = a.hurt ? 2 : 0;

    // 1 the siege rig — poles, canopy, diaper roll, dangle toys
    g.save();
    g.translate(0, -40); g.rotate(Math.sin(t * 2) * 0.021); g.translate(0, 40 + bounce + scat);
    g.strokeStyle = JOR_ALU; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-14, -40); g.lineTo(-10, -104);
    g.moveTo(8, -40); g.lineTo(12, -104);
    g.moveTo(-10, -100); g.lineTo(12, -100);
    g.stroke();
    g.fillStyle = AL.dk;
    g.beginPath(); g.arc(-13, -56, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(-11.6, -80, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(9.2, -56, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(10.6, -80, 1.3, 0, 7); g.fill();
    g.fillStyle = JOR_CANOPY; g.strokeStyle = JOR_PIPE; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(-14, -104 + lag, 28, 10, 4); g.fill(); g.stroke();
    g.fillStyle = JOR_VEST; g.strokeStyle = VS.out; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(0, -96, 13, 5, 0, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = VS.dk; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-6, -100.6); g.lineTo(-6, -91.4);
    g.moveTo(6, -100.6); g.lineTo(6, -91.4);
    g.stroke();
    const swg = Math.sin(t * (a.moving ? 4.4 : 2.2)) * (a.moving ? 0.7 : 0.44);
    const sw2 = Math.sin(t * (a.moving ? 4.4 : 2.2) + 2.1) * (a.moving ? 0.7 : 0.44);
    // toys hang off the crossbar ENDS so they clear the canopy and his head
    g.strokeStyle = a.INK; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-15, -99); g.lineTo(-15 - Math.sin(swg) * 12, -99 + Math.cos(swg) * 12);
    g.moveTo(15, -99); g.lineTo(15 + Math.sin(sw2) * 13, -99 + Math.cos(sw2) * 13);
    g.stroke();
    const stx = -15 - Math.sin(swg) * 12, sty = -99 + Math.cos(swg) * 12;
    g.fillStyle = '#ffd24a';
    g.beginPath();
    g.moveTo(stx, sty - 3); g.lineTo(stx + 0.9, sty - 0.9); g.lineTo(stx + 3, sty - 0.6);
    g.lineTo(stx + 1.3, sty + 0.9); g.lineTo(stx + 1.8, sty + 3); g.lineTo(stx, sty + 1.8);
    g.lineTo(stx - 1.8, sty + 3); g.lineTo(stx - 1.3, sty + 0.9); g.lineTo(stx - 3, sty - 0.6);
    g.lineTo(stx - 0.9, sty - 0.9);
    g.closePath(); g.fill();
    g.strokeStyle = '#d43b2f'; g.lineWidth = 2;
    g.beginPath(); g.arc(15 + Math.sin(sw2) * 13, -99 + Math.cos(sw2) * 13, 2.6, 0, 7); g.stroke();
    g.restore();

    g.translate(lean * 0.3, 0);

    // 2 back leg + flash sneaker
    a.limbStroke(g, -2, -40, bfx, bfy, 8.5, JOR_TEE);
    g.fillStyle = a.ramp(JOR_WHITE).out;
    g.beginPath(); g.roundRect(bfx - 5.4, bfy - 6.4, 12.2, 7.6, 3); g.fill();
    g.fillStyle = JOR_WHITE;
    g.beginPath(); g.roundRect(bfx - 4.6, bfy - 5.7, 10.6, 6.2, 2.6); g.fill();
    g.fillStyle = JOR_PIPE; g.fillRect(bfx - 4.6, bfy - 1.1, 10.6, 1.6);

    // 3 back arm
    a.limbStroke(g, 2, -64, a.bhx, a.bhy, 7, SK.dk);

    // 4 orange tee + photographer vest
    a.limbStroke(g, 0, -40, 2, -64 + breath * 0.2, 15, JOR_TEE);
    g.fillStyle = JOR_VEST; g.strokeStyle = VS.out; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-9, -64); g.lineTo(-3, -64); g.lineTo(-4, -40); g.lineTo(-11, -42);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(7, -64); g.lineTo(13, -63); g.lineTo(12, -41); g.lineTo(6, -40);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = VS.dk;
    g.beginPath(); g.roundRect(-10, -58, 4, 4, 1); g.fill();
    g.beginPath(); g.roundRect(-10, -50, 4, 4, 1); g.fill();
    g.beginPath(); g.roundRect(7.6, -57, 4, 4, 1); g.fill();
    g.strokeStyle = VS.lt; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-10, -58); g.lineTo(-6, -58);
    g.moveTo(-10, -50); g.lineTo(-6, -50);
    g.moveTo(7.6, -57); g.lineTo(11.6, -57);
    g.stroke();
    g.fillStyle = JOR_WIPE;                       // a wet wipe escaping a pocket
    g.beginPath(); g.moveTo(-9, -54); g.lineTo(-6, -53.4); g.lineTo(-8.4, -51); g.closePath(); g.fill();

    // 5 fanny pack, worn front — he has given up on cool
    g.fillStyle = JOR_PACK; g.strokeStyle = a.ramp(JOR_PACK).out; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(-8, -38 + scat, 10, 6, 2); g.fill(); g.stroke();
    g.strokeStyle = a.ramp(JOR_PACK).hi; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-7, -35.4 + scat); g.lineTo(1, -35.4 + scat); g.stroke();

    // 6 the bandolier and its four cells
    g.strokeStyle = JOR_STRAP; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-10, -66); g.lineTo(10, -44); g.stroke();
    g.fillStyle = '#f4f0e6';
    g.beginPath(); g.roundRect(-9, -65 + bounce, 3, 6, 1); g.fill();
    g.fillStyle = '#e8a06a'; g.fillRect(-8.4, -66.4 + bounce, 1.8, 1.6);
    g.fillStyle = '#d43b2f';
    g.beginPath(); g.roundRect(-4, -60 + bounce, 4, 5, 1); g.fill();
    g.strokeStyle = '#f4f0e6'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-2, -60.4 + bounce); g.lineTo(-0.6, -63 + bounce); g.stroke();
    g.fillStyle = '#ffd24a';
    g.beginPath(); g.roundRect(1, -55 + bounce, 4, 5, 1); g.fill();
    g.fillStyle = a.ramp('#ffd24a').dk;
    g.beginPath(); g.arc(3, -52.6 + bounce, 0.8, 0, 7); g.fill();
    g.fillStyle = '#4ab2e8';
    g.beginPath(); g.arc(7.4, -47 + bounce, 2, 0, 7); g.fill();

    // 7 the chest camera — bigger than the base prop, and it fires on B
    g.strokeStyle = JOR_STRAP; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-6, -66); g.lineTo(2, -57);
    g.moveTo(10, -65); g.lineTo(9, -57);
    g.stroke();
    g.fillStyle = JOR_BODY; g.strokeStyle = CB.out; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(0, -58, 11, 8, 2); g.fill(); g.stroke();
    g.fillStyle = '#1d1d24';
    g.beginPath(); g.arc(5.6, -54, 3, 0, 7); g.fill();
    g.strokeStyle = JOR_SWEAT; g.lineWidth = 1;
    g.beginPath(); g.arc(5.6, -54, 2, 3.4, 5); g.stroke();
    g.fillStyle = JOR_WHITE; g.fillRect(1.4, -60, 2, 2);
    if (k === 'B') {
      g.globalAlpha = 1 - ext;
      g.strokeStyle = JOR_WHITE; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(3.6, -62); g.lineTo(3.6, -68);
      g.moveTo(5.6, -61.4); g.lineTo(9.6, -65.4);
      g.moveTo(1.4, -61.4); g.lineTo(-2.6, -65.4);
      g.moveTo(6.4, -60); g.lineTo(12.4, -60);
      g.stroke();
      g.globalAlpha = 1;
    }

    // 8 whistle on a lanyard
    g.strokeStyle = a.INK; g.lineWidth = 1;
    g.beginPath(); g.moveTo(4, -64); g.lineTo(8, -54); g.stroke();
    g.fillStyle = JOR_ALU;
    g.beginPath(); g.roundRect(6.4, -53.4, 4, 2.6, 1); g.fill();

    // 9 front leg + flash sneaker (with the strike wedge behind the foot)
    if (kickPose && ext > 0.6) {
      g.globalAlpha = 1 - ext;
      g.fillStyle = JOR_WHITE;
      g.beginPath();
      g.moveTo(ffx - 8, ffy - 4); g.lineTo(ffx - 1, ffy); g.lineTo(ffx - 8, ffy + 4);
      g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
    a.limbStroke(g, 2, -40, ffx, ffy, 8.5, JOR_TEE);
    g.fillStyle = a.ramp(JOR_WHITE).out;
    g.beginPath(); g.roundRect(ffx - 5.4, ffy - 6.4, 12.2, 7.6, 3); g.fill();
    g.fillStyle = JOR_WHITE;
    g.beginPath(); g.roundRect(ffx - 4.6, ffy - 5.7, 10.6, 6.2, 2.6); g.fill();
    g.fillStyle = JOR_PIPE; g.fillRect(ffx - 4.6, ffy - 1.1, 10.6, 1.6);
    if (spin) { // the spin trail
      g.globalAlpha = 0.5;
      g.strokeStyle = JOR_PIPE; g.lineWidth = 1.6;
      g.beginPath(); g.arc(6, -20, 16, -1.2, 1.6); g.stroke();
      g.beginPath(); g.arc(6, -20, 20, -0.8, 1.9); g.stroke();
      g.globalAlpha = 1;
    }

    // 10 chibi head — spiky, determined, outnumbered
    g.save();
    g.translate(3, -85); g.scale(1.32, 1.32); g.translate(-3, 85);
    const hair = a.ramp(a.color2).dk, HR = a.ramp(hair);
    g.fillStyle = HR.out;
    g.beginPath(); g.arc(3, -86.5, 9.9, Math.PI, Math.PI * 2); g.fill();
    headBase(g, a, 3, -85, 9, JOR_SKIN);
    g.fillStyle = JOR_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-5.1, -84, 2.3, 0, 7); g.fill(); g.stroke();
    g.fillStyle = hair;
    g.beginPath(); g.arc(3, -86.5, 9.2, Math.PI * 1.02, Math.PI * 1.98); g.fill();
    for (let i = 0; i < 3; i++) {
      const sx = -2 + i * 5;
      g.beginPath(); g.moveTo(sx - 2.2, -93); g.lineTo(sx, -98.5); g.lineTo(sx + 2.2, -93); g.fill();
    }
    g.strokeStyle = HR.lt; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-4, -93.3); g.lineTo(-2.4, -97.4);
    g.moveTo(1, -93.3); g.lineTo(2.6, -97.4);
    g.moveTo(6, -93.3); g.lineTo(7.6, -97.4);
    g.stroke();
    const px = spin ? -2 : 0;                       // the no-look glance at camera
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(5, -86.5, 1.9, 2.35, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(9.2, -86.5, 1.9, 2.35, 0, 0, 7); g.fill();
    g.fillStyle = a.INK;
    g.beginPath(); g.arc(5.75 + px, -86.35, 1.05, 0, 7); g.fill();
    g.beginPath(); g.arc(9.95 + px, -86.35, 1.05, 0, 7); g.fill();
    g.strokeStyle = a.INK; g.lineWidth = 1.4;       // determined brows, always on
    g.beginPath();
    g.moveTo(3, -90.5); g.lineTo(6.5, -89.1);
    g.moveTo(11.7, -90.7); g.lineTo(8.2, -89.1);
    g.stroke();
    g.fillStyle = JOR_SWEAT;                        // he is outnumbered
    g.beginPath(); g.ellipse(-3.4, -89, a.hurt ? 1.8 : 1.1, a.hurt ? 2.6 : 1.6, 0, 0, 7); g.fill();
    g.restore();

    // 11 front arm + mitt
    a.limbStroke(g, 2, -64, a.fhx, a.fhy, 7, JOR_SKIN);
    g.fillStyle = JOR_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.6;
    g.beginPath(); g.arc(a.fhx, a.fhy, 3.4, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(a.bhx, a.bhy, 3.2, 0, 7); g.fill(); g.stroke();

    // 12 flash discs under the planted sneakers + press-pit twinkles
    g.fillStyle = JOR_WHITE;
    g.globalAlpha = 0.35 + 0.15 * Math.sin(t * 6);
    g.beginPath(); g.arc(bfx, bfy, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(ffx, ffy, 5, 0, 7); g.fill();
    g.strokeStyle = JOR_WHITE; g.lineWidth = 1;
    for (let i = 0; i < 9; i += 3) {
      const tx = JORDAN_TWINKS[i], ty = JORDAN_TWINKS[i + 1] + bounce;
      g.globalAlpha = (0.5 + 0.5 * Math.sin(t * 5 + JORDAN_TWINKS[i + 2] * 6.28)) * 0.8;
      g.beginPath();
      g.moveTo(tx - 2.4, ty); g.lineTo(tx + 2.4, ty);
      g.moveTo(tx, ty - 2.4); g.lineTo(tx, ty + 2.4);
      g.stroke();
    }
    g.globalAlpha = 1;
  };

  // ============================ 3D PRINTER JEROD ==========================
  const JRD_CHAR = '#2a2e38';
  const JRD_STEEL = '#6a7288';
  const JRD_TRIM = '#c9ccd8';
  const JRD_FIL = '#e8c84a';
  const JRD_CYAN = '#4adbe8';
  const JRD_HOT = '#ff7a2c';
  const JRD_GLASS = '#14202a';
  const JRD_RIM = '#4a5060';
  const JRD_STEAMC = '#dffbff';
  // steam motes off the top housing: dx, dy, phase, r
  const JEROD_STEAM = [-6, -92, 0.0, 1.4, 4, -94, 0.35, 1.2, 0, -90, 0.7, 1.6];

  F.jerod = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const CH = a.ramp(JRD_CHAR), ST = a.ramp(JRD_STEEL), FI = a.ramp(JRD_FIL), HO = a.ramp(JRD_HOT);
    const hum = Math.sin(t * 7) * 0.4;                        // machine vibration
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    const pad = step * 6;
    const lift = a.moving ? -Math.max(0, step) * 2 : 0;
    const lift2 = a.moving ? -Math.max(0, -step) * 2 : 0;
    let ecx = Math.sin(t * (a.moving ? 5 : 2.5)) * 9;
    if (k === 'B') ecx = 0;                                   // carriage slams to center
    const beam = k === 'B' ? 0.9 : 0.55;
    const glow = 0.23 + 0.05 * Math.sin(t * 5);
    const spool = a.moving ? -step * 1.5 : 0;
    const pitch = k === 'kick' ? 4 : 0;                       // the print judges you

    // feet pads never ride the waddle
    g.fillStyle = CH.out; g.beginPath(); g.roundRect(-20 - pad, -8 + lift2, 16, 8, 2); g.fill();
    g.fillStyle = JRD_CHAR; g.beginPath(); g.roundRect(-19.2 - pad, -7.3 + lift2, 14.4, 6.8, 1.8); g.fill();
    g.fillStyle = JRD_TRIM;
    g.beginPath(); g.arc(-16 - pad, -4 + lift2, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(-9 - pad, -4 + lift2, 1.1, 0, 7); g.fill();
    g.fillStyle = CH.out; g.beginPath(); g.roundRect(4 + pad, -8 + lift, 16, 8, 2); g.fill();
    g.fillStyle = JRD_CHAR; g.beginPath(); g.roundRect(4.8 + pad, -7.3 + lift, 14.4, 6.8, 1.8); g.fill();
    g.fillStyle = JRD_TRIM;
    g.beginPath(); g.arc(8 + pad, -4 + lift, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(15 + pad, -4 + lift, 1.1, 0, 7); g.fill();

    g.translate(0, hum);
    if (a.moving) { g.translate(0, -8); g.rotate(step * 0.052); g.translate(0, 8); }

    // 1 filament spool backpack + the feed tube over the top
    g.strokeStyle = JRD_RIM; g.lineWidth = 3;
    g.beginPath(); g.arc(-16, -58 + spool, 12, 0, 7); g.stroke();
    g.fillStyle = JRD_FIL;
    g.beginPath(); g.arc(-16, -58 + spool, 11, 0, 7); g.fill();
    g.strokeStyle = FI.dk; g.lineWidth = 1;
    g.beginPath(); g.arc(-16, -58 + spool, 8.4, 0, 7); g.stroke();
    g.beginPath(); g.arc(-16, -58 + spool, 6, 0, 7); g.stroke();
    g.beginPath(); g.arc(-16, -58 + spool, 3.6, 0, 7); g.stroke();
    g.lineWidth = 1.6;
    const sa = t * 0.8;
    g.beginPath();
    g.moveTo(-16 + Math.cos(sa) * 10, -58 + spool + Math.sin(sa) * 10);
    g.lineTo(-16 - Math.cos(sa) * 10, -58 + spool - Math.sin(sa) * 10);
    g.moveTo(-16 + Math.cos(sa + 1.05) * 10, -58 + spool + Math.sin(sa + 1.05) * 10);
    g.lineTo(-16 - Math.cos(sa + 1.05) * 10, -58 + spool - Math.sin(sa + 1.05) * 10);
    g.moveTo(-16 + Math.cos(sa + 2.09) * 10, -58 + spool + Math.sin(sa + 2.09) * 10);
    g.lineTo(-16 - Math.cos(sa + 2.09) * 10, -58 + spool - Math.sin(sa + 2.09) * 10);
    g.stroke();
    g.fillStyle = JRD_RIM;
    g.beginPath(); g.arc(-16, -58 + spool, 2.2, 0, 7); g.fill();
    g.strokeStyle = JRD_TRIM; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-16, -70 + spool); g.quadraticCurveTo(-14, -92, 0, -86); g.stroke();

    // 2 base slab + vents + power LED
    g.fillStyle = CH.out; g.beginPath(); g.roundRect(-19, -18, 38, 10, 2); g.fill();
    g.fillStyle = JRD_CHAR; g.beginPath(); g.roundRect(-18.2, -17.3, 36.4, 8.6, 1.6); g.fill();
    g.fillStyle = GAP_INK;
    g.fillRect(-14, -15, 5, 1.6);
    g.fillRect(-7, -15, 5, 1.6);
    g.fillRect(0, -15, 5, 1.6);
    g.fillStyle = '#37b34a';
    g.beginPath(); g.arc(14, -13, 1.2, 0, 7); g.fill();

    // 3 beveled frame columns
    for (let i = 0; i < 2; i++) {
      const cx = i ? 13.5 : -20.5;
      g.fillStyle = ST.out; g.beginPath(); g.roundRect(cx, -80, 7, 64, 2); g.fill();
      g.fillStyle = JRD_STEEL; g.beginPath(); g.roundRect(cx + 0.7, -79.3, 5.6, 62.6, 1.6); g.fill();
      if (!(a.hurt && i === 0)) {   // hurt: one column's sun edge flickers off
        g.fillStyle = ST.lt; g.fillRect(cx + 0.7, -79.3, 1.4, 62.6);
      }
      g.fillStyle = JRD_TRIM;
      g.beginPath(); g.arc(cx + 3.5, -74, 1, 0, 7); g.fill();
      g.beginPath(); g.arc(cx + 3.5, -58, 1, 0, 7); g.fill();
      g.beginPath(); g.arc(cx + 3.5, -42, 1, 0, 7); g.fill();
      g.beginPath(); g.arc(cx + 3.5, -26, 1, 0, 7); g.fill();
    }

    // 4 chamber window + interior glow + heated bed
    g.fillStyle = JRD_GLASS; g.fillRect(-13, -72, 26, 46);
    g.globalAlpha = glow;
    g.fillStyle = JRD_CYAN; g.fillRect(-13, -72, 26, 46);
    g.globalAlpha = 1;
    g.fillStyle = JRD_HOT; g.fillRect(-11, -28, 22, 2.5);
    if (k === 'B') { g.fillStyle = HO.hi; g.fillRect(-11, -28, 22, 1.2); }

    // 5 the half-printed mini-Jerod, still missing his legs
    g.save();
    g.translate(0, -32); g.rotate(pitch * 0.03); g.translate(0, 32);
    g.fillStyle = JRD_FIL;
    g.beginPath(); g.roundRect(-4 + pitch * 0.4, -46, 8, 14, 2); g.fill();
    g.beginPath(); g.arc(pitch * 0.5, -50, 4, 0, 7); g.fill();
    g.strokeStyle = FI.dk; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-4 + pitch * 0.4, -42); g.lineTo(4 + pitch * 0.4, -42);
    g.moveTo(-4 + pitch * 0.4, -38); g.lineTo(4 + pitch * 0.4, -38);
    g.moveTo(-4 + pitch * 0.4, -34); g.lineTo(4 + pitch * 0.4, -34);
    g.moveTo(-4 + pitch * 0.4, -32); g.lineTo(-2 + pitch * 0.4, -30.4);
    g.lineTo(0 + pitch * 0.4, -32); g.lineTo(2 + pitch * 0.4, -30.4); g.lineTo(4 + pitch * 0.4, -32);
    g.stroke();
    g.restore();
    g.globalAlpha = beam;
    g.strokeStyle = JRD_CYAN; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(ecx, -80); g.lineTo(ecx * 0.4, -54); g.stroke();
    g.globalAlpha = 1;

    // 6 top housing + the LCD face (HE is the machine)
    g.fillStyle = CH.out; g.beginPath(); g.roundRect(-19, -88, 38, 9, 2); g.fill();
    g.fillStyle = JRD_CHAR; g.beginPath(); g.roundRect(-18.2, -87.3, 36.4, 7.6, 1.6); g.fill();
    g.fillStyle = JRD_GLASS; g.fillRect(-8, -86, 16, 6);
    g.fillStyle = JRD_CYAN;
    if (a.hurt) {
      g.fillRect(-5.6, -84.6, 1.4, 1.4); g.fillRect(-4.2, -83.2, 1.4, 1.4);
      g.fillRect(-4.2, -84.6, 1.4, 1.4); g.fillRect(-5.6, -83.2, 1.4, 1.4);
      g.fillRect(2.8, -84.6, 1.4, 1.4); g.fillRect(4.2, -83.2, 1.4, 1.4);
      g.fillRect(4.2, -84.6, 1.4, 1.4); g.fillRect(2.8, -83.2, 1.4, 1.4);
    } else if (Math.sin(t * 1.3 + 2) > 0.985) {      // same blink cadence as the roster
      g.fillRect(-5.6, -83.6, 1.5, 0.8);
      g.fillRect(2.8, -83.6, 1.5, 0.8);
    } else {
      g.fillRect(-5.6, -84.4, 1.5, 1.5);
      g.fillRect(2.8, -84.4, 1.5, 1.5);
    }
    g.fillStyle = JRD_CYAN;
    g.fillRect(-3.4, -81.4, 1.4, 1.4);
    g.fillRect(-1, -80.6, 1.4, 1.4);
    g.fillRect(1.4, -81.4, 1.4, 1.4);

    // 7 the gantry carriage and its hot end
    g.fillStyle = HO.out; g.beginPath(); g.roundRect(ecx - 4, -88, 8, 8, 1); g.fill();
    g.fillStyle = JRD_HOT; g.beginPath(); g.roundRect(ecx - 3.3, -87.3, 6.6, 6.6, 1); g.fill();
    g.fillStyle = JRD_CYAN;
    g.beginPath(); g.arc(ecx + 1.6, -85.6, 1, 0, 7); g.fill();
    g.fillStyle = JRD_STEEL; g.fillRect(ecx - 1, -80, 2, 3);
    if (k && k !== 'B') {                            // hot-end flare on the X chain
      g.globalAlpha = 1 - ext;
      g.fillStyle = JRD_HOT;
      g.beginPath(); g.moveTo(ecx - 1, -77); g.lineTo(ecx + 5, -75); g.lineTo(ecx + 1, -73); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }

    // 8 segmented gripper arms with 3-finger claws
    for (let i = 0; i < 2; i++) {
      const gx = i ? a.fhx : a.bhx, gy = i ? a.fhy : a.bhy;
      a.limbStroke(g, 0, -56, gx, gy, 8, JRD_STEEL);
      const mx = gx * 0.5, my = (-56 + gy) * 0.5;
      g.fillStyle = ST.out; g.beginPath(); g.roundRect(mx - 4, my - 3.4, 8, 6.8, 1.6); g.fill();
      g.fillStyle = JRD_STEEL; g.beginPath(); g.roundRect(mx - 3.3, my - 2.7, 6.6, 5.4, 1.3); g.fill();
      g.fillStyle = ST.lt; g.fillRect(mx - 3.3, my - 2.7, 6.6, 1.2);
      g.fillStyle = JRD_TRIM; g.beginPath(); g.arc(mx, my + 0.8, 1, 0, 7); g.fill();
      const snap = (k && ext > 0.7) ? 0.16 : 0.4;    // fingers snap shut late in the swing
      const dir = gx < 0 ? -1 : 1;
      g.strokeStyle = JRD_TRIM; g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(gx, gy); g.lineTo(gx + dir * 5 * Math.cos(snap), gy - 5 * Math.sin(snap));
      g.moveTo(gx, gy); g.lineTo(gx + dir * 5, gy);
      g.moveTo(gx, gy); g.lineTo(gx + dir * 5 * Math.cos(snap), gy + 5 * Math.sin(snap));
      g.stroke();
    }
    g.fillStyle = JRD_FIL;                           // a spare brass nozzle, pinched
    g.beginPath();
    g.moveTo(a.fhx + 6, a.fhy - 2); g.lineTo(a.fhx + 9, a.fhy); g.lineTo(a.fhx + 6, a.fhy + 2);
    g.closePath(); g.fill();

    // 9 warm-first-layer steam off the housing
    g.fillStyle = JRD_STEAMC;
    for (let i = 0; i < 12; i += 4) {
      const ph = JEROD_STEAM[i + 2];
      const cyc = (t * 0.45 + ph) % 1;
      g.globalAlpha = (1 - cyc) * 0.6;
      g.beginPath();
      g.arc(JEROD_STEAM[i] + 1.2 * Math.sin(t * 2 + ph * 6), JEROD_STEAM[i + 1] - cyc * 9, JEROD_STEAM[i + 3], 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
  };

  // ================================ WRENCHY ===============================
  const WR_GOLD = '#ffd24a';
  const WR_DARK = '#b8922a';
  const WR_DEEP = '#8a6a1f';
  const WR_HI = '#fff2b8';
  const WR_STEEL = '#c9ccd8';
  const WR_RED = '#d43b2f';
  const WR_BLUE = '#4a86e8';
  const WR_SHIMMER = 'rgba(255,242,184,0.3)';
  // torque sparks off the jaws and nut: dx, dy, phase, r
  const WRENCHY_SPARKS = [14, -90, 0.0, 1.2, -4, -98, 0.3, 1.0, 18, -72, 0.55, 1.3, 2, -64, 0.8, 1.1];

  F.jacob = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const GO = a.ramp(WR_GOLD), DK = a.ramp(WR_DARK), SE = a.ramp(WR_STEEL), RD = a.ramp(WR_RED);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    let gap = 2 + 2 * Math.sin(t * 3);
    if (k === 'B') gap = 10; else if (k === 'kick') gap = 6;
    if (a.hurt) gap = 8;                                  // aghast, and frozen that way
    const torque = k === 'kick' ? 0.15 * ext : 0;
    const risen = k === 'B' ? -26 * ext : 0;
    const knurl = (t * 0.6) % 4.4;
    const valve = a.moving ? a.walkCyc * 2 : t * 0.3;
    const boot = step * 6;

    // 1 hex-nut boots
    for (let i = 0; i < 2; i++) {
      const bx = i ? 10 + boot : -10 - boot;
      g.fillStyle = DK.out; g.strokeStyle = DK.out; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(bx - 7, -6); g.lineTo(bx - 3.5, -10); g.lineTo(bx + 3.5, -10);
      g.lineTo(bx + 7, -6); g.lineTo(bx + 3.5, -1); g.lineTo(bx - 3.5, -1);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = WR_DARK;
      g.beginPath();
      g.moveTo(bx - 5.6, -6); g.lineTo(bx - 2.8, -8.8); g.lineTo(bx + 2.8, -8.8);
      g.lineTo(bx + 5.6, -6); g.lineTo(bx + 2.8, -2.2); g.lineTo(bx - 2.8, -2.2);
      g.closePath(); g.fill();
      g.fillStyle = DK.lt;
      g.beginPath();
      g.moveTo(bx - 5.6, -6); g.lineTo(bx - 2.8, -8.8); g.lineTo(bx + 1, -8.8); g.lineTo(bx - 2, -6);
      g.closePath(); g.fill();
    }

    if (a.moving) { g.translate(0, -13); g.rotate(step * 0.07); g.translate(0, 13); }
    g.translate(0, Math.sin(t * 2) * 0.5);                // squash-breath

    // 2 the I-beam handle body
    g.fillStyle = GO.out; g.beginPath(); g.roundRect(-8, -58, 16, 45, 3); g.fill();
    g.fillStyle = WR_GOLD; g.beginPath(); g.roundRect(-7.2, -57.3, 14.4, 43.6, 2.6); g.fill();
    g.fillStyle = GO.lt; g.fillRect(-7.2, -57.3, 1.6, 43.6);
    g.strokeStyle = WR_DARK; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-4, -54); g.lineTo(-4, -18);
    g.moveTo(4, -54); g.lineTo(4, -18);
    g.stroke();
    g.fillStyle = WR_HI;
    g.beginPath(); g.arc(0, -50, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -42, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -34, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -26, 1, 0, 7); g.fill();
    g.strokeStyle = GO.dk; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-6, -46); g.lineTo(-6, -40);
    g.moveTo(6, -30); g.lineTo(6, -24);
    g.stroke();

    // 3 the grandfathered bloom pass — one stroke, then blur off immediately
    g.shadowColor = WR_GOLD; g.shadowBlur = 10;
    g.strokeStyle = WR_GOLD; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, -18); g.lineTo(0, -56); g.stroke();
    g.shadowBlur = 0;

    // 4 HM stamp plate + union sticker
    g.fillStyle = WR_DEEP; g.beginPath(); g.roundRect(-5, -40, 10, 6, 1); g.fill();
    g.strokeStyle = a.ramp(WR_DEEP).hi; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-2.6, -38.6); g.lineTo(-2.6, -35.4);
    g.moveTo(1.4, -38.6); g.lineTo(1.4, -35.4);
    g.stroke();
    g.fillStyle = WR_BLUE; g.beginPath(); g.roundRect(-4, -24, 8, 5, 1); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(-4, -22.4, 8, 1.4);

    // 5 pipe-elbow pauldrons + the red valve wheel
    for (let i = 0; i < 2; i++) {
      const px = i ? 19 : -19;
      g.strokeStyle = SE.out; g.lineWidth = 9;
      g.beginPath(); g.arc(px, -56, 6, i ? 4.71 : 3.14, i ? 6.28 : 4.71); g.stroke();
      g.strokeStyle = WR_STEEL; g.lineWidth = 7;
      g.beginPath(); g.arc(px, -56, 6, i ? 4.71 : 3.14, i ? 6.28 : 4.71); g.stroke();
      g.fillStyle = SE.dk;
      g.beginPath(); g.arc(px + (i ? 5 : -5), -55, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(px + (i ? 1 : -1), -61, 1.1, 0, 7); g.fill();
    }
    g.save();
    g.translate(-19, -62); g.rotate(valve);
    g.fillStyle = RD.out; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill();
    g.fillStyle = WR_RED; g.beginPath(); g.arc(0, 0, 3.7, 0, 7); g.fill();
    g.strokeStyle = RD.out; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-3.7, 0); g.lineTo(3.7, 0);
    g.moveTo(-1.85, -3.2); g.lineTo(1.85, 3.2);
    g.moveTo(1.85, -3.2); g.lineTo(-1.85, 3.2);
    g.stroke();
    g.fillStyle = RD.lt; g.beginPath(); g.arc(0, 0, 1.2, 0, 7); g.fill();
    g.restore();

    // 6 the collar nut, visibly threading
    g.fillStyle = GO.out; g.beginPath(); g.ellipse(0, -62, 11, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = WR_GOLD; g.beginPath(); g.ellipse(0, -62, 10, 4.7, 0, 0, 7); g.fill();
    g.strokeStyle = WR_DARK; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-8.8 + knurl, -64.6); g.lineTo(-8.8 + knurl, -59.4);
    g.moveTo(-4.4 + knurl, -65.4); g.lineTo(-4.4 + knurl, -58.6);
    g.moveTo(0 + knurl, -65.6); g.lineTo(0 + knurl, -58.4);
    g.moveTo(4.4 + knurl - 4.4, -65.4); g.lineTo(4.4 + knurl - 4.4, -58.6);
    g.moveTo(8.8 + knurl - 8.8, -64.6); g.lineTo(8.8 + knurl - 8.8, -59.4);
    g.stroke();

    // 7 the jaw stack — everything above the collar takes the torque
    g.save();
    g.translate(0, -62 + risen); g.rotate(torque); g.translate(0, 62);
    g.fillStyle = GO.out; g.beginPath(); g.roundRect(-8, -96, 8, 32, 2); g.fill();
    g.fillStyle = WR_GOLD; g.beginPath(); g.roundRect(-7.3, -95.3, 6.6, 30.6, 1.6); g.fill();
    g.fillStyle = GAP_INK; g.fillRect(-4, -90, 22, 22);            // the mouth cavity
    g.fillStyle = GO.out; g.beginPath(); g.roundRect(-8, -71, 26, 8, 2); g.fill();
    g.fillStyle = WR_GOLD; g.beginPath(); g.roundRect(-7.3, -70.3, 24.6, 6.6, 1.6); g.fill();
    g.fillStyle = GO.lt; g.fillRect(-7.3, -70.3, 24.6, 1.5);
    // upper jaw pivots at the back: its front edge rides mouthGap
    g.fillStyle = GO.out;
    g.beginPath();
    g.moveTo(-8, -96); g.lineTo(18, -96 - gap); g.lineTo(18, -88 - gap); g.lineTo(-8, -88);
    g.closePath(); g.fill();
    g.fillStyle = WR_GOLD;
    g.beginPath();
    g.moveTo(-7, -95.2); g.lineTo(17.2, -95.2 - gap); g.lineTo(17.2, -88.8 - gap); g.lineTo(-7, -88.8);
    g.closePath(); g.fill();
    g.fillStyle = GO.lt;
    g.beginPath();
    g.moveTo(-7, -95.2); g.lineTo(17.2, -95.2 - gap); g.lineTo(17.2, -93.7 - gap); g.lineTo(-7, -93.7);
    g.closePath(); g.fill();
    g.fillStyle = k === 'B' ? WR_HI : WR_DEEP;                      // teeth
    for (let i = 0; i < 4; i++) {
      const tx = 0 + i * 5.5;
      g.beginPath(); g.moveTo(tx, -63); g.lineTo(tx + 1.5, -59.5); g.lineTo(tx + 3, -63); g.closePath(); g.fill();
      const uy = -88 - gap * (tx + 8) / 26;
      g.beginPath(); g.moveTo(tx, uy); g.lineTo(tx + 1.5, uy + 3.5); g.lineTo(tx + 3, uy); g.closePath(); g.fill();
    }
    // 8 the furious face on the upper jaw
    const fy = -92 - gap * 0.6;
    if (a.hurt) {
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(6.6, fy - 1.6); g.lineTo(9.4, fy + 1.6);
      g.moveTo(9.4, fy - 1.6); g.lineTo(6.6, fy + 1.6);
      g.moveTo(13.6, fy - 1.6); g.lineTo(16.4, fy + 1.6);
      g.moveTo(16.4, fy - 1.6); g.lineTo(13.6, fy + 1.6);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(8, fy, 2.2, 2.8, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(15, fy, 2.2, 2.8, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(8.8, fy + 0.3, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(15.8, fy + 0.3, 1.1, 0, 7); g.fill();
    }
    g.strokeStyle = WR_DARK; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(5.4, fy - 4.4); g.lineTo(10.4, fy - 2.6);
    g.moveTo(17.6, fy - 4.4); g.lineTo(12.6, fy - 2.6);
    g.stroke();
    g.restore();

    // 9 arms + coupling fists
    for (let i = 0; i < 2; i++) {
      const hx = i ? a.fhx : a.bhx, hy = i ? a.fhy : a.bhy;
      if (i && k && k !== 'B') {                     // flash line trailing the piston
        g.globalAlpha = 1 - ext;
        g.strokeStyle = WR_HI; g.lineWidth = 2;
        g.beginPath(); g.moveTo(hx - 16, hy); g.lineTo(hx - 4, hy); g.stroke();
        g.globalAlpha = 1;
      }
      a.limbStroke(g, i ? 8 : -8, -56, hx, hy, 9, WR_GOLD);
      g.strokeStyle = WR_DARK; g.lineWidth = 4;
      g.beginPath();
      g.moveTo((hx + (i ? 8 : -8)) * 0.5 - 2, (hy - 56) * 0.5);
      g.lineTo((hx + (i ? 8 : -8)) * 0.5 + 2, (hy - 56) * 0.5);
      g.stroke();
      g.fillStyle = SE.out; g.beginPath(); g.roundRect(hx - 5, hy - 5, 10, 10, 3); g.fill();
      g.fillStyle = WR_STEEL; g.beginPath(); g.roundRect(hx - 4.3, hy - 4.3, 8.6, 8.6, 2.6); g.fill();
      g.strokeStyle = SE.dk; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(hx - 4, hy - 1.6); g.lineTo(hx + 4, hy - 1.6);
      g.moveTo(hx - 4, hy + 1.6); g.lineTo(hx + 4, hy + 1.6);
      g.stroke();
      g.fillStyle = WR_GOLD; g.fillRect(hx - 4.3, hy - 5, 8.6, 2);
    }

    // 10 torque sparks + one flat heat shimmer over the jaw
    g.fillStyle = WR_HI;
    for (let i = 0; i < 16; i += 4) {
      const ph = WRENCHY_SPARKS[i + 2];
      const cyc = (t * 0.6 + ph) % 1;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.beginPath();
      g.arc(WRENCHY_SPARKS[i] + 1.5 * Math.sin(t * 4 + ph * 6), WRENCHY_SPARKS[i + 1] - cyc * 8, WRENCHY_SPARKS[i + 3], 0, 7);
      g.fill();
    }
    g.globalAlpha = 0.8 + 0.2 * Math.sin(t * 6);
    g.strokeStyle = WR_SHIMMER; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-8, -100 + risen); g.quadraticCurveTo(6, -106 + risen, 20, -99 + risen); g.stroke();
    g.globalAlpha = 1;
  };

  // ============================= GIANT CHICKEN ============================
  const HEN_WHITE = '#f6f2e8';
  const HEN_CREAM = '#e3ddcc';
  const HEN_GOLD = '#e8a020';
  const HEN_SCALE = '#b87a10';
  const HEN_COMB = '#d43b2f';
  const HEN_EYE = '#e8524a';
  const HEN_TRIM = '#ffd24a';
  const HEN_PURE = '#ffffff';
  // tail quill tips: tx, ty
  const HEN_QUILLS = [-34, -64, -38, -56, -40, -46, -38, -36, -34, -28];
  // jubilee sparkles: dx, dy, phase
  const HEN_STARS = [-30, -60, 0.0, -36, -44, 0.3, -28, -30, 0.55, 6, -70, 0.8];

  F.samantha = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const WH = a.ramp(HEN_WHITE), CR = a.ramp(HEN_CREAM), GL = a.ramp(HEN_GOLD), CM = a.ramp(HEN_COMB);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    const puff = a.hurt ? 2 : 0;                       // the full indignant puff
    const heave = Math.sin(t * 1.8) * 1.2;
    const jerk = Math.sin(t * 2); // cubed below for the strut snap
    const peck = (k === 'punch' || k === 'cross') ? 20 * ext : 0;
    const slam = k === 'kick';
    const flap = k === 'B';
    const headX = 15 + jerk * jerk * jerk * 1.5 + (a.moving ? step * 4 : 0) + peck;
    const ruff = peck > 0 ? -3 : 0;
    const tailSway = Math.sin(t * 1.4) * 0.052 - (a.moving ? step * 0.087 : 0);

    // 1 the peacock-of-doom tail fan
    g.save();
    g.translate(-16, -46); g.rotate(tailSway);
    for (let i = 0; i < 10; i += 2) {
      const px = HEN_QUILLS[i], py = HEN_QUILLS[i + 1] + 46;
      const ph = Math.sin(t * 1.4 + i * 0.15) * 1.2;
      const col = (i & 2) ? HEN_CREAM : HEN_WHITE;
      const RQ = a.ramp(col);
      g.fillStyle = col; g.strokeStyle = RQ.out; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(px * 0.5 - 4, py * 0.5 - 6, px - puff + ph, py - puff * 0.4 + ph);
      g.quadraticCurveTo(px * 0.5 + 2, py * 0.5 + 4, 3, 3);
      g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = RQ.lt; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(1, 1); g.quadraticCurveTo(px * 0.5, py * 0.5, px - puff + ph, py - puff * 0.4 + ph); g.stroke();
      g.fillStyle = HEN_EYE;
      g.beginPath(); g.arc(px - puff + ph, py - puff * 0.4 + ph, 2.6, 0, 7); g.fill();
      g.strokeStyle = HEN_TRIM; g.lineWidth = 1.2;
      g.beginPath(); g.arc(px - puff + ph, py - puff * 0.4 + ph, 3.6, 0, 7); g.stroke();
    }
    g.restore();

    // 2 back talon leg
    const bhx2 = -9 - step * 9, bhy2 = a.moving ? -Math.max(0, -step) * 6 : 0;
    a.limbStroke(g, -6, -24, bhx2, bhy2, 7, HEN_GOLD);
    g.strokeStyle = HEN_SCALE; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(bhx2 - 3, bhy2 - 6); g.lineTo(bhx2 + 3, bhy2 - 6.6);
    g.moveTo(bhx2 - 3, bhy2 - 10); g.lineTo(bhx2 + 3, bhy2 - 10.6);
    g.moveTo(bhx2 - 3, bhy2 - 14); g.lineTo(bhx2 + 3, bhy2 - 14.6);
    g.stroke();
    g.strokeStyle = HEN_GOLD; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(bhx2, bhy2 - 2); g.lineTo(bhx2 - 7, bhy2);
    g.moveTo(bhx2, bhy2 - 2); g.lineTo(bhx2 + 1, bhy2 + 1);
    g.moveTo(bhx2, bhy2 - 2); g.lineTo(bhx2 + 7, bhy2);
    g.stroke();
    g.fillStyle = HEN_TRIM;
    g.beginPath(); g.moveTo(bhx2 - 7, bhy2 - 1.4); g.lineTo(bhx2 - 10, bhy2 + 0.6); g.lineTo(bhx2 - 6.4, bhy2 + 1); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(bhx2 + 7, bhy2 - 1.4); g.lineTo(bhx2 + 10, bhy2 + 0.6); g.lineTo(bhx2 + 6.4, bhy2 + 1); g.closePath(); g.fill();

    // 3 the heraldic breast shield
    g.fillStyle = HEN_WHITE; g.strokeStyle = WH.out; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, -44 + heave, 26, 20, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = WH.lt;
    g.beginPath(); g.ellipse(-7, -50 + heave, 14, 10, -0.3, 0, 7); g.fill();
    g.strokeStyle = WH.hi; g.lineWidth = 2.2;
    g.beginPath(); g.arc(0, -44 + heave, 22, 3.5, 4.6); g.stroke();
    g.strokeStyle = HEN_CREAM; g.lineWidth = 2;
    g.fillStyle = CR.lt;
    for (let r = 0; r < 3; r++) {
      const sy = -50 + r * 8 + heave;
      for (let c = 0; c < 4; c++) {
        const sx = -14 + c * 8 + (r & 1 ? 3 : 0) + puff;
        g.beginPath(); g.arc(sx, sy, 4, 0.2, Math.PI - 0.2); g.stroke();
        g.beginPath(); g.arc(sx + 4, sy, 0.9, 0, 7); g.fill();
      }
    }

    // 4 the folded wing (it flares on the slam)
    const wsp = slam ? 14 * ext : 0;
    const wrot = flap ? -0.6 * ext : 0;
    g.save();
    g.translate(-2, -42 + heave); g.rotate(wrot);
    g.fillStyle = HEN_CREAM; g.strokeStyle = CR.out; g.lineWidth = 2;
    // three lobes stepping down-right — offset far enough not to read as nested rings
    g.beginPath(); g.ellipse(-2, -5, 12 + wsp, 6, -0.16, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(3 + wsp * 0.4, 2, 10.5 + wsp, 5.5, -0.1, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(8 + wsp * 0.7, 9, 9 + wsp, 5, -0.05, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = CR.dk; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-11, -7); g.lineTo(8 + wsp, -4);
    g.moveTo(-6, 0); g.lineTo(12 + wsp, 3);
    g.moveTo(-1, 7); g.lineTo(16 + wsp, 10);
    g.stroke();
    if (slam) {
      g.globalAlpha = (1 - ext) * 0.9;
      g.strokeStyle = HEN_EYE; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(6 + wsp, -5); g.lineTo(16 + wsp, -3);
      g.moveTo(9 + wsp, 1); g.lineTo(19 + wsp, 3);
      g.moveTo(12 + wsp, 7); g.lineTo(21 + wsp, 9);
      g.stroke();
      g.globalAlpha = 1;
    }
    g.restore();

    // 5-7 the head group: ruff, neck, head, crown-comb, beak
    g.save();
    g.translate(headX - 15, 0);
    g.fillStyle = HEN_PURE; g.strokeStyle = HEN_TRIM; g.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const rx = 8 + i * 3, ry = -62 + i * 1 + ruff;
      g.beginPath(); g.moveTo(rx - 3, ry); g.lineTo(rx, ry - 6 - ruff); g.lineTo(rx + 3, ry); g.closePath();
      g.fill(); g.stroke();
    }
    g.fillStyle = HEN_WHITE; g.strokeStyle = WH.out; g.lineWidth = 2.4;
    g.beginPath(); g.roundRect(10, -76, 10, 20, 4); g.fill(); g.stroke();
    headBase(g, a, 15, -80, 9, HEN_WHITE);
    g.fillStyle = HEN_COMB; g.strokeStyle = CM.out; g.lineWidth = 2;
    g.beginPath();                                   // a five-point crown of a comb
    g.moveTo(7, -86);
    g.lineTo(8, -93); g.lineTo(10.5, -88); g.lineTo(13, -95); g.lineTo(15.5, -88);
    g.lineTo(18, -96); g.lineTo(20, -88); g.lineTo(22, -92); g.lineTo(22, -85);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CM.lt;
    g.beginPath();
    g.moveTo(13, -95); g.lineTo(15.5, -88); g.lineTo(14, -85); g.lineTo(12, -88);
    g.closePath(); g.fill();
    g.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5);
    g.strokeStyle = HEN_TRIM; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(8, -93); g.lineTo(10.5, -88);
    g.moveTo(13, -95); g.lineTo(15.5, -88);
    g.moveTo(18, -96); g.lineTo(20, -88);
    g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = HEN_COMB; g.strokeStyle = CM.out; g.lineWidth = 1.6;
    g.beginPath(); g.arc(20, -70, 3, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(23, -73, 2.4, 0, 7); g.fill(); g.stroke();
    const gape = peck > 0 ? 2 : 0;
    g.fillStyle = HEN_GOLD; g.strokeStyle = GL.out; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(23, -79); g.lineTo(32, -76); g.lineTo(23, -74); g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(23, -73.4 + gape); g.lineTo(30, -74.6 + gape); g.lineTo(23, -70.4 + gape);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = GL.hi; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(24, -78.2); g.lineTo(30, -76.2); g.stroke();
    if (a.hurt) {
      g.strokeStyle = a.INK; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(16, -83); g.lineTo(19.4, -79.6);
      g.moveTo(19.4, -83); g.lineTo(16, -79.6);
      g.stroke();
    } else {
      g.fillStyle = HEN_PURE;
      g.beginPath(); g.ellipse(17.8, -81.4, 2.6, 3, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(18.6, -81.2, 1.3, 0, 7); g.fill();
      g.fillStyle = HEN_EYE;
      g.beginPath(); g.arc(17.2, -82.4, 0.7, 0, 7); g.fill();
      g.strokeStyle = a.INK; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(14.6, -85.4); g.lineTo(20.6, -83.4); g.stroke();
    }
    g.restore();

    // 8 chest sigil — her sparkle, promoted to heraldry
    g.strokeStyle = HEN_PURE; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(2 - 4, -46 + heave); g.lineTo(2 + 4, -46 + heave);
    g.moveTo(2, -50 + heave); g.lineTo(2, -42 + heave);
    g.stroke();

    // 9 front talon leg
    const fhx2 = 9 + step * 9, fhy2 = a.moving ? -Math.max(0, step) * 6 : 0;
    a.limbStroke(g, 6, -24, fhx2, fhy2, 7, HEN_GOLD);
    g.strokeStyle = HEN_SCALE; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(fhx2 - 3, fhy2 - 6); g.lineTo(fhx2 + 3, fhy2 - 6.6);
    g.moveTo(fhx2 - 3, fhy2 - 10); g.lineTo(fhx2 + 3, fhy2 - 10.6);
    g.moveTo(fhx2 - 3, fhy2 - 14); g.lineTo(fhx2 + 3, fhy2 - 14.6);
    g.stroke();
    g.strokeStyle = HEN_GOLD; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(fhx2, fhy2 - 2); g.lineTo(fhx2 - 7, fhy2);
    g.moveTo(fhx2, fhy2 - 2); g.lineTo(fhx2 + 1, fhy2 + 1);
    g.moveTo(fhx2, fhy2 - 2); g.lineTo(fhx2 + 7, fhy2);
    g.stroke();
    g.fillStyle = HEN_TRIM;
    g.beginPath(); g.moveTo(fhx2 - 7, fhy2 - 1.4); g.lineTo(fhx2 - 10, fhy2 + 0.6); g.lineTo(fhx2 - 6.4, fhy2 + 1); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(fhx2 + 7, fhy2 - 1.4); g.lineTo(fhx2 + 10, fhy2 + 0.6); g.lineTo(fhx2 + 6.4, fhy2 + 1); g.closePath(); g.fill();

    // 10 jubilee sparkles + one drifting molt feather
    g.strokeStyle = HEN_PURE; g.lineWidth = 1;
    for (let i = 0; i < 12; i += 3) {
      const sx = HEN_STARS[i], sy = HEN_STARS[i + 1];
      g.globalAlpha = (0.5 + 0.5 * Math.sin(t * 5 + HEN_STARS[i + 2] * 6.28)) * 0.8;
      g.beginPath();
      g.moveTo(sx - 2.6, sy); g.lineTo(sx + 2.6, sy);
      g.moveTo(sx, sy - 2.6); g.lineTo(sx, sy + 2.6);
      g.stroke();
    }
    const mcyc = (t * 0.3) % 1;
    g.globalAlpha = (1 - mcyc) * 0.6;
    g.strokeStyle = HEN_WHITE; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-26 + 3 * Math.sin(t * 2), -60 + mcyc * 22);
    g.lineTo(-23 + 3 * Math.sin(t * 2), -56 + mcyc * 22);
    g.stroke();
    g.globalAlpha = 1;
  };

  // ========================== LITTLE BEAR SPECIAL =========================
  const SUB_DOME = '#e0a860';
  const SUB_BASE = '#c98d48';
  const SUB_LET = '#7dc45f';
  const SUB_TOM = '#d43b2f';
  const SUB_CHZ = '#ffd24a';
  const SUB_CAP = '#a05a3c';
  const SUB_WAX = '#fff4dd';
  const SUB_SHINE = '#ff8a70';
  const SUB_FAT = '#e8b58a';
  const SUB_ONION = '#f4f0e6';
  const SUB_PICK = '#8a6a48';
  const SUB_FLAG = '#e8524a';
  const SUB_OLIVE = '#37b34a';
  // sesame scatter: sx, sy
  const SUB_SEEDS = [-9, -74, -2, -77, 6, -73, 10, -68, -12, -67, 1, -70];
  // basil flecks: dx, dy, phase
  const SUB_BASIL = [8, -84, 0.0, -10, -80, 0.35, 2, -88, 0.7];

  F.cassandra = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const BD = a.ramp(SUB_BASE), DM = a.ramp(SUB_DOME), TM = a.ramp(SUB_TOM);
    const CP = a.ramp(SUB_CAP), WX = a.ramp(SUB_WAX), CZ = a.ramp(SUB_CHZ);
    const w = a.walkCyc;
    const xk = k === 'punch' || k === 'cross';
    const slam = k === 'kick';
    const sep = k === 'B' ? ext : 0;
    let lean = Math.sin(t * 1.4) * 3;
    if (xk) lean += 10 * ext;
    if (slam) lean += 8 * ext;
    const squash = slam ? 1 - 0.1 * ext : 1;
    const shake = slam ? 1 : 0;
    const shear = a.hurt ? 2 : 0;

    // 1 the crinkled waxed-paper skirt she rises out of
    g.fillStyle = SUB_WAX; g.strokeStyle = WX.out; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-20, -4);
    g.lineTo(-16, -16); g.lineTo(-11, -9); g.lineTo(-5, -18);
    g.lineTo(1, -10); g.lineTo(7, -18); g.lineTo(13, -10); g.lineTo(17, -16); g.lineTo(20, -4);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = WX.dk; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-13, -5); g.lineTo(-14, -14);
    g.moveTo(-2, -5); g.lineTo(-3, -15);
    g.moveTo(10, -5); g.lineTo(11, -14);
    g.stroke();

    // 2 bottom bread — the only stratum that does not lean
    g.fillStyle = BD.out; g.beginPath(); g.roundRect(-18, -32, 36, 15, 6); g.fill();
    g.fillStyle = SUB_BASE; g.beginPath(); g.roundRect(-17.2, -31.3, 34.4, 13.6, 5.4); g.fill();
    g.fillStyle = BD.lt; g.fillRect(-14, -30.4, 28, 2);
    g.strokeStyle = BD.dk; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-14, -24); g.quadraticCurveTo(0, -21, 14, -24); g.stroke();

    // everything above the bottom bread leans, shears and separates
    g.translate(0, -30); g.rotate(lean * 0.017); g.scale(1, squash); g.translate(0, 30);
    if (sep > 0) { g.fillStyle = GAP_INK; g.fillRect(-16, -62, 32, 32); }

    const s1 = (a.moving ? Math.sin(w + 0.8) * 1.5 : 0) + shear;
    const s2 = (a.moving ? Math.sin(w + 1.6) * 1.5 : 0) - shear;
    const s3 = (a.moving ? Math.sin(w + 2.4) * 1.5 : 0) + shear;
    const s4 = (a.moving ? Math.sin(w + 3.2) * 1.5 : 0) - shear;
    const s5 = (a.moving ? Math.sin(w + 4.0) * 1.5 : 0) + shear;
    const s6 = (a.moving ? Math.sin(w + 4.8) * 1.5 : 0) - shear;

    // 3 lettuce ruffle, overhanging the bread
    g.fillStyle = SUB_LET; g.strokeStyle = a.ramp(SUB_LET).out; g.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      g.beginPath(); g.arc(-16 + i * 6.5 + s1, -33 - sep * 2, 4, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = a.ramp(SUB_LET).lt;
    g.beginPath(); g.arc(-12 + s1, -36.4 - sep * 2, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(1 + s1, -36.4 - sep * 2, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(14 + s1, -36.4 - sep * 2, 1, 0, 7); g.fill();

    // 4 tomato — the middle one always bulges further out
    g.fillStyle = SUB_TOM; g.strokeStyle = TM.out; g.lineWidth = 1.6;
    g.beginPath(); g.arc(-11 + s2, -38 - sep * 4, 4.5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(1 + s2, -39 - sep * 4, 4.5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(10 + s2, -38 - sep * 4, 4.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = SUB_SHINE;
    g.beginPath(); g.arc(-12.4, -39.6 - sep * 4, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(-0.4, -40.6 - sep * 4, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(8.6, -39.6 - sep * 4, 1.2, 0, 7); g.fill();

    // 5 provolone, with cheese physics on the corners
    g.fillStyle = SUB_CHZ; g.fillRect(-16 + s3, -45 - sep * 6, 32, 4);
    const dr = Math.sin(t * 2.4) * 1;
    g.beginPath();
    g.moveTo(-16 + s3, -41 - sep * 6); g.lineTo(-11 + s3, -41 - sep * 6);
    g.lineTo(-14 + s3 + dr, -36 - sep * 6);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(12 + s3, -41 - sep * 6); g.lineTo(16 + s3, -41 - sep * 6);
    g.lineTo(14 + s3 - dr, -36 - sep * 6);
    g.closePath(); g.fill();
    g.fillStyle = CZ.dk;
    g.beginPath(); g.arc(-8 + s3, -43 - sep * 6, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(1 + s3, -43.4 - sep * 6, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(9 + s3, -43 - sep * 6, 1.1, 0, 7); g.fill();

    // 6 salami, one disc torqueing on the punch
    const sal = a.ramp(SUB_TOM).dk;
    g.fillStyle = sal; g.strokeStyle = TM.out; g.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(-12 + i * 8 + s4, -49 - sep * 8, 4, 0, 7); g.fill(); g.stroke();
    }
    g.save();
    g.translate(4 + s4, -49 - sep * 8); g.rotate(xk ? 0.5 * ext : 0);
    g.fillStyle = SUB_FAT;
    g.beginPath(); g.arc(-1.6, -1.4, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(1.4, 0.4, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-0.4, 1.8, 0.8, 0, 7); g.fill();
    g.restore();
    g.fillStyle = SUB_FAT;
    g.beginPath(); g.arc(-13 + s4, -50 - sep * 8, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-3 + s4, -48 - sep * 8, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(13 + s4, -50 - sep * 8, 0.8, 0, 7); g.fill();

    // 7 capicola
    g.fillStyle = SUB_CAP; g.strokeStyle = CP.out; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-15 + s5, -56 - sep * 10);
    g.quadraticCurveTo(0 + s5, -60 - sep * 10, 15 + s5, -53 - sep * 10);
    g.lineTo(15 + s5, -49 - sep * 10);
    g.quadraticCurveTo(0 + s5, -55 - sep * 10, -15 + s5, -52 - sep * 10);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = CP.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-11 + s5, -54 - sep * 10); g.quadraticCurveTo(0 + s5, -57 - sep * 10, 11 + s5, -52 - sep * 10); g.stroke();

    // 8 onion rings
    g.strokeStyle = SUB_ONION; g.lineWidth = 1.5;
    g.beginPath();
    g.arc(-6 + s6, -57 - sep * 12, 5, 3.34, 6.08);
    g.moveTo(13 + s6, -58 - sep * 12); g.arc(8 + s6, -58 - sep * 12, 5, 3.34, 6.08);
    g.stroke();

    // 9 the top bread dome
    const dy = -sep * 14;
    g.fillStyle = DM.out; g.beginPath(); g.roundRect(-17, -80 + dy, 34, 24, 11); g.fill();
    g.fillStyle = SUB_DOME; g.beginPath(); g.roundRect(-16.2, -79.3 + dy, 32.4, 22.6, 10.4); g.fill();
    g.fillStyle = DM.lt;
    g.beginPath(); g.ellipse(-6, -71 + dy, 9, 6, -0.35, 0, 7); g.fill();
    g.strokeStyle = DM.hi; g.lineWidth = 1.8;
    g.beginPath(); g.arc(0, -68 + dy, 14, 3.5, 4.6); g.stroke();
    g.fillStyle = SUB_WAX;
    for (let i = 0; i < 12; i += 2) {
      g.beginPath(); g.ellipse(SUB_SEEDS[i] + shake, SUB_SEEDS[i + 1] + dy - shake, 1.6, 1, 0.5, 0, 7); g.fill();
    }

    // 10 the face — she knows she is the best item on the menu
    if (a.hurt) {
      g.strokeStyle = a.INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(2.4, -65.6 + dy); g.lineTo(5.6, -62.4 + dy);
      g.moveTo(5.6, -65.6 + dy); g.lineTo(2.4, -62.4 + dy);
      g.stroke();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(11, -64 + dy, 1.9, 1.2, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(11.6, -64 + dy, 0.9, 0, 7); g.fill();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(4, -64 + dy, 1.9, 2.35, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(11, -64 + dy, 1.9, 2.35, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(4.75, -63.85 + dy, 1.05, 0, 7); g.fill();
      g.beginPath(); g.arc(11.75, -63.85 + dy, 1.05, 0, 7); g.fill();
    }
    g.strokeStyle = a.INK; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(8.8, -69.4 + dy); g.lineTo(13.2, -68 + dy); g.stroke();
    g.lineWidth = 1.2;
    g.beginPath(); g.arc(8, -60.4 + dy, 3.4, 0.25, 1.3); g.stroke();

    // 11 toothpick mast, cellophane flag, skewered olive
    const wave = Math.sin(t * 3) * 0.3 + (a.moving ? Math.sin(w - 0.8) * 0.2 : 0);
    g.strokeStyle = SUB_PICK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, -80 + dy); g.lineTo(0, -90 + dy); g.stroke();
    g.save();
    g.translate(0, -90 + dy); g.rotate(wave);
    g.globalAlpha = 0.85;
    g.fillStyle = SUB_FLAG;
    g.beginPath();
    g.moveTo(-1, 0); g.lineTo(9, 1.4); g.lineTo(7, 3); g.lineTo(9, 4.6);
    g.lineTo(7, 6.2); g.lineTo(9, 7.8); g.lineTo(-1, 7);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.restore();
    g.fillStyle = SUB_OLIVE; g.strokeStyle = a.ramp(SUB_OLIVE).out; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0, -92 + dy, 2.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = SUB_TOM;
    g.beginPath(); g.arc(0.6, -92 + dy, 1, 0, 7); g.fill();

    // 12 crust-colored gripper mitts
    g.fillStyle = SUB_BASE; g.strokeStyle = BD.out; g.lineWidth = 2;
    g.beginPath(); g.arc(a.bhx, a.bhy, 5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(a.fhx, a.fhy, 5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = BD.lt;
    g.beginPath(); g.arc(a.bhx - 1.4, a.bhy - 1.6, 1.8, 0, 7); g.fill();
    g.beginPath(); g.arc(a.fhx - 1.4, a.fhy - 1.6, 1.8, 0, 7); g.fill();

    // 13 oil drips, basil flecks, sheen — she glistens, she does not glow
    const ocyc = (t * 0.5) % 1;
    g.fillStyle = SUB_CHZ;
    g.globalAlpha = (1 - ocyc) * 0.8;
    g.beginPath(); g.arc(-14 + s3, -36 - sep * 6 + ocyc * 10, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(14 + s3, -36 - sep * 6 + ocyc * 10, 1.1, 0, 7); g.fill();
    g.fillStyle = SUB_WAX;
    g.globalAlpha = 0.65 + 0.25 * Math.sin(t * 4);
    g.beginPath(); g.arc(-13 + s3, -39 - sep * 6, 1, 0, 7); g.fill();
    g.globalAlpha = 0.65 + 0.25 * Math.sin(t * 4 + 3.14);
    g.beginPath(); g.arc(13 + s3, -39 - sep * 6, 1, 0, 7); g.fill();
    g.strokeStyle = SUB_LET; g.lineWidth = 1.4;
    for (let i = 0; i < 9; i += 3) {
      const ph = SUB_BASIL[i + 2];
      const cyc = (t * 0.4 + ph) % 1;
      const bx = SUB_BASIL[i] + 2 * Math.sin(t * 2 + ph * 6), by = SUB_BASIL[i + 1] + cyc * 14;
      g.globalAlpha = (1 - cyc) * 0.7;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 2, by + 1); g.stroke();
    }
    g.globalAlpha = 1;
  };

  // =============================== RICKMOTHY ==============================
  const RICK_SKIN = '#e8b58a';
  const RICK_PANT = '#8a8a94';
  const RICK_ROBE = '#f4f0e6';
  const RICK_CROWN = '#f2ede0';
  const RICK_WIPE = '#f2ede0';
  const RICK_TRIM = '#ffd24a';
  const RICK_STAIN = 'rgba(90,80,60,0.3)';
  const RICK_BLUSH = 'rgba(255,122,122,0.2)';
  const RICK_SHIM = 'rgba(255,255,255,0.25)';
  // defeated dust: dx, dy, phase
  const RICK_DUST = [-6, -70, 0.0, 8, -74, 0.5];

  F.erika = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const SK = a.ramp(RICK_SKIN), PT = a.ramp(RICK_PANT), RB = a.ramp(RICK_ROBE);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    const hover = Math.max(0, Math.sin(t * 0.7)) * 2;    // the failed hover
    const gate = Math.sin(t * 0.5) > -0.6 ? 1 : 0.15;    // the failing-bulb flicker
    let lean = a.moving ? step * 6 : 0;
    if (a.hurt) lean = -8;
    const belly = Math.sin(t * 2) * 1.5;
    let crownRot = 0.2 + hover * 0.025;
    let crownY = 0;
    if (a.hurt) { crownRot = 1.4; crownY = 4; }
    else if (k === 'B') crownY = -2 * ext;
    const swat = k === 'punch' || k === 'cross';
    const eff = k === 'kick';
    const rise = k === 'B';
    // the sock foot never lifts; the bare foot does all the work
    const bfx = -8 - step * 7, bfy = a.moving ? -Math.max(0, -step) * 7 : 0;
    const ffx = 8 + step * 5, ffy = a.moving ? Math.min(0, -Math.max(0, step) * 2) : 0;
    let fhx = 12 - (a.moving ? step * 3 : 0), fhy = -36;
    let bhx = -10 - (a.moving ? step * 3 : 0), bhy = -34;
    if (swat) { fhx = 12 + 18 * ext; fhy = -38; }
    else if (eff) { lean = -8 * (ext < 0.3 ? 1 : 0.3); fhx = 12 + 14 * Math.sin(t * 14); bhx = -10 + 14 * Math.sin(t * 14 + 3.14); }
    else if (rise) { fhx = 12; fhy = -50 - 20 * ext; bhx = -6; bhy = -46 - 14 * ext; }

    g.translate(lean * 0.3, -hover);

    // 1 back leg + bare foot
    a.limbStroke(g, -4, -22, bfx, bfy, 7, RICK_PANT);
    g.strokeStyle = PT.dk; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(bfx - 3, bfy - 12); g.lineTo(bfx + 3, bfy - 11);
    g.moveTo(bfx - 3, bfy - 9); g.lineTo(bfx + 3, bfy - 8);
    g.stroke();
    g.fillStyle = RICK_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(bfx, bfy - 2, 5, 3, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = SK.dk;
    g.beginPath(); g.arc(bfx + 3.4, bfy - 3, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(bfx + 4.2, bfy - 1.6, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(bfx + 3.6, bfy - 0.2, 0.8, 0, 7); g.fill();

    // 2 the tattered robe scrap, and the one nice thing he owns (on crooked)
    g.globalAlpha = 0.95;
    g.fillStyle = RICK_ROBE; g.strokeStyle = RB.out; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-10, -48); g.lineTo(-18, -30); g.lineTo(-16, -16);
    g.lineTo(-13, -20); g.lineTo(-11, -15); g.lineTo(-8, -20); g.lineTo(-6, -30);
    g.closePath(); g.fill(); g.stroke();
    g.globalAlpha = 1;
    g.strokeStyle = RICK_TRIM; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-8.5, -48); g.lineTo(-17, -30); g.lineTo(-17, -17); g.stroke();

    // 3 the belly, which breathes more than the chest does
    g.fillStyle = RICK_SKIN; g.strokeStyle = SK.out; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(2, -28, 15, 13 + belly, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = SK.lt;
    g.beginPath(); g.ellipse(-3, -33, 8, 6, -0.35, 0, 7); g.fill();
    g.strokeStyle = SK.dk; g.lineWidth = 1.4;
    g.beginPath(); g.arc(2, -28, 11, 0.6, 2.5); g.stroke();
    g.fillStyle = SK.dk;
    g.beginPath(); g.arc(2, -25, 1.2, 0, 7); g.fill();
    g.strokeStyle = RICK_PANT; g.lineWidth = 3;      // waistband passes behind the belly
    g.beginPath();
    g.moveTo(-11, -18); g.lineTo(-8, -18);
    g.moveTo(12, -18); g.lineTo(15, -18);
    g.stroke();

    // 4 narrow torso — the shoulders are the thin part of the pear
    a.limbStroke(g, 0, -30, 2, -48, 10, RICK_SKIN);

    // 5 robe panels that cannot meet over the belly
    g.fillStyle = RICK_ROBE; g.strokeStyle = RB.out; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-5, -48); g.lineTo(-11, -30); g.lineTo(-10, -20);
    g.lineTo(-7.5, -23); g.lineTo(-6, -20); g.lineTo(-5, -30);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(9, -48); g.lineTo(14, -30); g.lineTo(13, -20);
    g.lineTo(11, -23); g.lineTo(9.5, -20); g.lineTo(9, -30);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = RICK_TRIM; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(10.5, -48); g.lineTo(13, -30); g.lineTo(12, -21); g.stroke();

    // 6 one damp wipe, holstered
    g.fillStyle = RICK_WIPE; g.strokeStyle = a.ramp(RICK_WIPE).out; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect(7, -20, 4, 5, 1); g.fill(); g.stroke();

    // 7 noodle arms — the elbow never straightens
    const bmx = (2 + bhx) * 0.5, bmy = (-48 + bhy) * 0.5 + 2;
    const fmx = (2 + fhx) * 0.5, fmy = (-48 + fhy) * 0.5 + 2;
    a.limbStroke(g, 2, -48, bmx, bmy, 4, SK.dk);
    a.limbStroke(g, bmx, bmy, bhx, bhy, 4, SK.dk);
    a.limbStroke(g, 2, -48, fmx, fmy, 4, RICK_SKIN);
    a.limbStroke(g, fmx, fmy, fhx, fhy, 4, RICK_SKIN);
    if (swat || eff) {
      g.globalAlpha = eff ? 0.3 : 1;
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
      g.beginPath(); g.arc(fhx - 8, fhy, 10, -0.9, 0.9); g.stroke();
      if (eff) { g.beginPath(); g.arc(bhx + 8, bhy, 10, 2.24, 4.04); g.stroke(); }
      g.globalAlpha = 1;
      if (eff) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(fhx + 6, fhy - 4, 1.4, 0, 7); g.fill(); }
    }
    g.fillStyle = RICK_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.4;
    g.beginPath(); g.arc(bhx, bhy, 2.8, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(fhx, fhy, 2.8, 0, 7); g.fill(); g.stroke();

    // 8 the too-small head under a half-fallen pony
    const hair = a.ramp(a.color2).dk, HR = a.ramp(hair);
    g.fillStyle = HR.out;
    g.beginPath(); g.arc(3, -63.5, 8.3, Math.PI, Math.PI * 2); g.fill();
    headBase(g, a, 3, -62, 7.5, RICK_SKIN);
    g.fillStyle = hair;
    g.beginPath(); g.ellipse(-5, -56, 3, 5.4, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(3, -63.5, 7.7, Math.PI * 1.02, Math.PI * 1.98); g.fill();
    g.strokeStyle = hair; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-2, -66); g.quadraticCurveTo(1, -62, 4, -64);
    g.moveTo(2, -67); g.quadraticCurveTo(5, -63, 8, -65);
    g.stroke();
    g.fillStyle = RICK_BLUSH;
    g.beginPath(); g.ellipse(2.6, -59.4, 1.7, 1.05, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(7.4, -59.6, 1.7, 1.05, 0, 0, 7); g.fill();
    if (a.hurt) {
      g.strokeStyle = a.INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(1.2, -62.4); g.lineTo(4.2, -62.4);
      g.moveTo(5.6, -62.4); g.lineTo(8.6, -62.4);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(2.7, -62.4, 1.8, 2, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(7.1, -62.4, 1.8, 2, 0, 0, 7); g.fill();
      g.fillStyle = a.INK;                             // pupils looking slightly apart
      g.beginPath(); g.arc(3.2, -62.2, 1, 0, 7); g.fill();
      g.beginPath(); g.arc(6.8, -62.2, 1, 0, 7); g.fill();
      g.fillStyle = RICK_SKIN;                         // heavy lids, no sparkle
      g.fillRect(0.9, -64.6, 3.6, 1.9);
      g.fillRect(5.3, -64.6, 3.6, 1.9);
      g.strokeStyle = a.INK; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0.9, -62.8); g.lineTo(4.5, -62.8);
      g.moveTo(5.3, -62.8); g.lineTo(8.9, -62.8);
      g.stroke();
    }
    g.strokeStyle = a.INK; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(3.4, -57.4); g.lineTo(6.6, -57.4); g.stroke();

    // 9 the soggy paper crown, worn crooked, middle point flopped over
    g.save();
    g.translate(3, -68 + crownY); g.rotate(crownRot);
    g.fillStyle = RICK_CROWN; g.strokeStyle = a.ramp(RICK_CROWN).out; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-7, -2); g.lineTo(-5, -12); g.lineTo(-2, -2);
    g.lineTo(4, -2); g.lineTo(6, -12); g.lineTo(8, -2);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();                                     // the middle point, flopped
    g.moveTo(-2, -2); g.lineTo(5, -5); g.lineTo(4, -2);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = RICK_STAIN;
    g.beginPath(); g.ellipse(1, -5, 3.4, 2, 0.3, 0, 7); g.fill();
    g.restore();

    // 10 two motes, and they fall
    g.fillStyle = RICK_ROBE;
    for (let i = 0; i < 6; i += 3) {
      const cyc = (t * 0.35 + RICK_DUST[i + 2]) % 1;
      g.globalAlpha = (1 - cyc) * 0.4;
      g.beginPath(); g.arc(RICK_DUST[i], RICK_DUST[i + 1] + cyc * 10, 1, 0, 7); g.fill();
    }
    // the shimmer blinks out entirely whenever the gate is low
    g.globalAlpha = gate;
    g.strokeStyle = RICK_SHIM; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-4, -84); g.quadraticCurveTo(3, -88, 10, -84); g.stroke();
    g.globalAlpha = 1;
  };

  // =============================== LEVIATHAN ==============================
  const LEV_TEE = '#8a4ae8';
  const LEV_SLEEVE = '#5a2ea0';
  const LEV_SKIN = '#e8b58a';
  const LEV_HAIR = '#4a3020';
  const LEV_CRACK = '#ff4a92';
  const LEV_CORE = '#ffd6e8';
  const LEV_GOLD = '#ffd24a';
  const LEV_WOOD = '#c98d48';
  const LEV_STITCH = '#f2ede0';
  const LEV_PALE = '#f4f0e6';
  const LEV_CAR = '#d43b2f';
  // carnival sparks off the fists: dx, dy, phase, r
  const LEVI_SPARKS = [36, -18, 0.0, 1.2, -34, -16, 0.4, 1.0, 38, -10, 0.7, 1.1];
  // knuckle crack segments per fist: x1,y1, x2,y2, x3,y3
  const LEV_CRACKS = [-6, -5, -2, -1, -5, 3, 0, -7, 1, -2, -1, 4, 5, -6, 3, -1, 6, 3];

  F.levi = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, k = a.attackKey;
    const TE = a.ramp(LEV_TEE), SK = a.ramp(LEV_SKIN), HR = a.ramp(LEV_HAIR), WD = a.ramp(LEV_WOOD);
    const step = a.moving ? Math.sin(a.walkCyc) : 0;
    const legStep = a.moving ? Math.sin(a.walkCyc * 1.5) : 0;
    const breath = Math.sin(t * 1.8) * 2;               // gorilla breath
    const crackA = 0.8 + 0.2 * Math.sin(t * 6);
    const haymaker = k === 'punch' || k === 'cross';
    const slam = k === 'kick';
    const upright = k === 'B';
    let lean = 0, mop = Math.sin(t * 1.6) * 1, rise = 0;

    // fists: planted at knuckle-drag height unless something bigger is happening
    let fx = 36, fy = -14, bx = -36, by = -14;
    if (a.moving) {
      fx = 36 + step * 14; fy = -14 - Math.max(0, step) * 8;
      bx = -36 + step * 14; by = -14 - Math.max(0, -step) * 8;
    }
    if (haymaker) { fx = 36 + 22 * ext; fy = -44 * ext; lean = 5 * ext; }
    else if (slam) {
      if (ext < 0.5) { const u = ext * 2; fx = 36 - 22 * u; fy = -14 - 78 * u; bx = -36 + 22 * u; by = -14 - 78 * u; }
      else { const u = (ext - 0.5) * 2; fx = 14 + 16 * u; fy = -92 + 86 * u; bx = -14 - 16 * u; by = -92 + 86 * u; }
      mop += 5 * ext;
    } else if (upright) {                                // the comedy beat is load-bearing
      rise = -8 * ext; fx = 12; fy = -50 - 34 * ext; bx = -8; by = -46 - 22 * ext;
    }
    if (a.hurt) { lean = -8; fx = 16; fy = -62; bx = -6; by = -66; mop = 4; }

    // 1 the clown hammer, slung across his back — raised off the spec's hip anchor
    // so the size-14 forearm capsule doesn't swallow the mallet head entirely
    g.strokeStyle = WD.out; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-32, -46 + breath); g.lineTo(4, -84 + breath + rise); g.stroke();
    g.strokeStyle = LEV_WOOD; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-32, -46 + breath); g.lineTo(4, -84 + breath + rise); g.stroke();
    g.fillStyle = a.ramp(LEV_CRACK).out;
    g.beginPath(); g.roundRect(-45, -56 + breath, 18, 22, 7); g.fill();
    g.fillStyle = LEV_CRACK;
    g.beginPath(); g.roundRect(-44, -55 + breath, 16, 20, 6); g.fill();
    g.fillStyle = LEV_PALE;
    g.fillRect(-44, -50 + breath, 16, 5);
    g.fillRect(-44, -41 + breath, 16, 5);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-39, -45 + breath); g.lineTo(-33, -45 + breath);
    g.moveTo(-36, -48 + breath); g.lineTo(-36, -42 + breath);
    g.stroke();

    // 2 the tiny legs, scurrying double-time
    a.limbStroke(g, -3, -26, -8 - legStep * 6, -Math.max(0, -legStep) * 4, 6, LEV_TEE);
    a.limbStroke(g, 3, -26, 8 + legStep * 6, -Math.max(0, legStep) * 4, 6, LEV_TEE);
    for (let i = 0; i < 2; i++) {
      const sx = i ? 8 + legStep * 6 : -8 - legStep * 6;
      const sy = i ? -Math.max(0, legStep) * 4 : -Math.max(0, -legStep) * 4;
      g.fillStyle = a.ramp(LEV_SLEEVE).out;
      g.beginPath(); g.roundRect(sx - 4.3, sy - 5.1, 9.8, 6.1, 2.4); g.fill();
      g.fillStyle = LEV_SLEEVE;
      g.beginPath(); g.roundRect(sx - 3.7, sy - 4.6, 8.5, 5, 2.1); g.fill();
      g.fillStyle = a.ramp(LEV_SLEEVE).lt; g.fillRect(sx - 3.7, sy - 0.9, 8.5, 1.3);
    }

    g.translate(lean * 0.3, breath + rise);

    // 3 the colossal torso wedge, losing a fight with its own seams
    g.fillStyle = LEV_TEE; g.strokeStyle = TE.out; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-10, -28); g.lineTo(10, -28); g.lineTo(30, -66); g.lineTo(-30, -66);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = TE.lt;
    g.beginPath();
    g.moveTo(-26, -64); g.lineTo(-6, -64); g.lineTo(-8, -44); g.lineTo(-20, -44);
    g.closePath(); g.fill();
    g.strokeStyle = LEV_STITCH; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-26, -64); g.lineTo(-23, -61); g.lineTo(-20, -64); g.lineTo(-17, -61);
    g.moveTo(20, -64); g.lineTo(23, -61); g.lineTo(26, -64); g.lineTo(29, -61);
    g.stroke();
    g.strokeStyle = TE.dk; g.lineWidth = 2;
    g.beginPath(); g.arc(2, -66, 9, 0.35, 2.79); g.stroke();

    // 4 the championship belt, with the Camaro heart on it
    g.fillStyle = LEV_GOLD; g.beginPath(); g.roundRect(-6, -32, 14, 8, 2); g.fill();
    g.fillStyle = LEV_CAR;
    g.fillRect(-3, -29.4, 8, 2.4);
    g.fillRect(-1, -31.2, 4, 2);
    g.fillStyle = a.INK;
    g.beginPath(); g.arc(-1.4, -26.6, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(3.4, -26.6, 1, 0, 7); g.fill();
    g.fillStyle = a.ramp(LEV_GOLD).hi;
    g.beginPath(); g.arc(-3.6, -30.4, 1, 0, 7); g.fill();

    // 5 shoulder boulders bursting the sleeves
    for (let i = 0; i < 2; i++) {
      const sx = i ? 28 : -28;
      g.fillStyle = LEV_SKIN; g.strokeStyle = SK.out; g.lineWidth = 2.6;
      g.beginPath(); g.arc(sx, -64, 14, 0, 7); g.fill(); g.stroke();
      g.fillStyle = SK.lt;
      g.beginPath(); g.arc(sx - 3.5, -68, 6.4, 0, 7); g.fill();
      g.strokeStyle = SK.dk; g.lineWidth = 1.6;
      g.beginPath(); g.arc(sx, -64, 10.5, 0.5, 2.1); g.stroke();
      g.beginPath(); g.arc(sx, -64, 7, 0.7, 2.3); g.stroke();
      g.strokeStyle = LEV_SLEEVE; g.lineWidth = 3;
      g.beginPath(); g.arc(sx, -64, 13, 0.55, 2.6); g.stroke();
    }

    // 6 back arm + tape
    a.limbStroke(g, -28, -62, bx, by, 14, SK.dk);
    g.strokeStyle = LEV_STITCH; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(bx - 5, by - 14); g.lineTo(bx + 5, by - 16);
    g.moveTo(bx - 5, by - 20); g.lineTo(bx + 5, by - 22);
    g.stroke();

    // 8 front arm
    a.limbStroke(g, 28, -62, fx, fy, 14, LEV_SKIN);

    // 7 the fists — his power is visibly splitting the skin
    for (let i = 0; i < 2; i++) {
      const mx = i ? fx : bx, my = i ? fy : by;
      g.fillStyle = i ? LEV_SKIN : SK.dk; g.strokeStyle = SK.out; g.lineWidth = 2.6;
      g.beginPath(); g.arc(mx, my, 11, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = SK.dk; g.lineWidth = 1.4;
      g.beginPath();
      g.arc(mx + 5, my - 7, 3, 3.34, 6.08);
      g.moveTo(mx + 11, my - 3); g.arc(mx + 8, my - 3, 3, 3.34, 6.08);
      g.moveTo(mx + 12, my + 2); g.arc(mx + 9, my + 2, 3, 3.34, 6.08);
      g.moveTo(mx + 10, my + 6); g.arc(mx + 7, my + 6, 3, 3.34, 6.08);
      g.stroke();
      g.globalAlpha = haymaker && i ? 1 : crackA;
      g.strokeStyle = LEV_CRACK; g.lineWidth = 1.6;
      g.beginPath();
      for (let c = 0; c < 18; c += 6) {
        g.moveTo(mx + LEV_CRACKS[c], my + LEV_CRACKS[c + 1]);
        g.lineTo(mx + LEV_CRACKS[c + 2], my + LEV_CRACKS[c + 3]);
        g.lineTo(mx + LEV_CRACKS[c + 4], my + LEV_CRACKS[c + 5]);
      }
      g.stroke();
      g.fillStyle = LEV_CORE;
      g.beginPath(); g.arc(mx, my - 1, 1.4, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    if (slam && ext > 0.9) {                             // the impact line
      g.strokeStyle = a.INK; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-34, -2); g.lineTo(34, -2); g.stroke();
    }

    // 9 the head, jaw first
    g.fillStyle = LEV_SKIN; g.strokeStyle = SK.out; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(3, -74); g.lineTo(15, -75); g.lineTo(14, -69); g.lineTo(3, -68);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = SK.dk;
    g.beginPath(); g.arc(7, -70.5, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(10, -71, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(12.6, -71.6, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(9, -73, 0.7, 0, 7); g.fill();
    headBase(g, a, 3, -78, 9, LEV_SKIN);
    g.fillStyle = LEV_SKIN; g.strokeStyle = SK.out; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-6.5, -77, 2.3, 0, 7); g.fill(); g.stroke();
    if (!a.hurt) {
      g.fillStyle = a.INK;
      g.beginPath(); g.arc(5, -79, 1.2, 0, 7); g.fill();
      g.beginPath(); g.arc(9.4, -79, 1.2, 0, 7); g.fill();
    }
    g.strokeStyle = a.INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(2.4, -82); g.lineTo(11.4, -81.4); g.stroke();

    // 10 the mop, hanging so low only the eye-gap shows
    g.fillStyle = HR.out;
    g.beginPath(); g.arc(3, -84 - mop * 0.2, 11, Math.PI, Math.PI * 2); g.fill();
    g.fillStyle = LEV_HAIR;
    g.beginPath(); g.arc(-4, -86 - mop, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(1, -89 - mop, 6.5, 0, 7); g.fill();
    g.beginPath(); g.arc(7, -88 - mop, 6, 0, 7); g.fill();
    g.beginPath(); g.arc(12, -85 - mop, 5, 0, 7); g.fill();
    if (a.hurt) { g.beginPath(); g.arc(4, -80, 8, Math.PI, Math.PI * 2); g.fill(); }
    g.fillStyle = HR.lt;
    g.beginPath(); g.arc(-1.6, -91.4 - mop, 1.4, 0, 7); g.fill();
    g.beginPath(); g.arc(4.4, -92.6 - mop, 1.4, 0, 7); g.fill();

    // 11 carnival sparks popping off the fists
    g.fillStyle = LEV_CORE;
    for (let i = 0; i < 12; i += 4) {
      const ph = LEVI_SPARKS[i + 2];
      const cyc = (t * 0.55 + ph) % 1;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.beginPath();
      g.arc(LEVI_SPARKS[i] + 2 * Math.sin(t * 3 + ph * 6), LEVI_SPARKS[i + 1] - cyc * 9, LEVI_SPARKS[i + 3], 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
  };
})();
