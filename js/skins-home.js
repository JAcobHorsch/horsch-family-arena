// skins-home.js — World 0 "home" creature skins: yard gnome (grunt), murder wasp
// (stinger), trash panda (brute), sprinkler sentry (shooter), and THE GOOSE boss
// upgrade. Bodies draw in drawFighter/drawBoss local space: (0,0) = feet on the
// ground, y negative is up, +x toward the player. Caller owns save/translate/
// shadow/scale and the world-space flash/frozen overlays.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // ---- hoisted constants (module scope — nothing allocated per frame) ----
  // gnome
  const GNOME_SHADE = 'rgba(90,40,20,0.18)';
  // wasp
  const WASP_FUZZ = [-1.2, -0.9, -0.6, -0.3, 0];
  const WING_REAR = 'rgba(235,242,255,0.35)';
  const WING_FRONT = 'rgba(235,242,255,0.55)';
  const WING_BLUR = 'rgba(235,242,255,0.2)';
  const VENOM = 'rgba(201,255,214,0.8)';
  // panda: tail ring cross-strokes as x,y,dx,dy — dx/dy are cos/sin of the spec's
  // angles (1.25 / 1.45 / 1.6 / 1.9 rad) times half-length 5, precomputed
  const P_RINGS = [
    -29, -33, 1.58, 4.75,
    -34, -43, 0.6, 4.96,
    -35, -53, -0.15, 5,
    -32, -63, -1.62, 4.73,
  ];
  const P_BROW = 'rgba(232,228,216,0.8)';
  // sprinkler
  const WATER55 = 'rgba(127,212,255,0.55)';
  const WATER80 = 'rgba(127,212,255,0.8)';
  // goose
  const G_ROW1 = [-14, -6, 2, 10];
  const G_ROW2 = [-10, -2, 6];
  const HONK = 'rgba(255,255,255,0.7)';

  // ============================== YARD GNOME ==============================
  B.gnome = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const step = Math.sin(a.walkCyc);
    const bob = a.moving ? Math.abs(step) * 2 : 0;
    let lean = a.attackKey === 'strike' ? 4 : a.attackKey === 'windup' ? -3 : (a.moving ? step * 1.5 : 0);
    if (a.hurt) lean = -6;

    // 1 tiny boots (planted — do not ride the lean/bob)
    const fbx = 3 + (a.moving ? step * 7 : 0), fby = -7 - (a.moving ? Math.max(0, step) * 4 : 0);
    const bbx = -14 - (a.moving ? step * 7 : 0), bby = -7 - (a.moving ? Math.max(0, -step) * 4 : 0);
    g.fillStyle = '#6b4423'; g.strokeStyle = '#3a2412'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(bbx, bby, 11, 7, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(fbx, fby, 11, 7, 2); g.fill(); g.stroke();
    g.fillStyle = '#8a5c30'; g.fillRect(fbx + 1, fby + 1, 4, 2);

    // 2 leg shadow grounding the bell over the boots
    g.fillStyle = '#24395c'; g.fillRect(-9, -14, 18, 8);

    g.translate(lean * 0.4, -bob); // everything above rides the waddle

    // 3 bell tunic
    g.fillStyle = '#3a5a8a'; g.strokeStyle = '#24395c'; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-17, -8);
    g.quadraticCurveTo(-21, -34, -8, -50);
    g.lineTo(8, -50);
    g.quadraticCurveTo(21, -34, 17, -8);
    g.closePath(); g.fill(); g.stroke();
    // 4 belly light (top-left key) + sun-side rim
    g.fillStyle = '#5b7fb5';
    g.beginPath(); g.ellipse(-4, -31, 10, 13, 0, 0, 7); g.fill();
    g.strokeStyle = '#7fa3d1'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(14, -40); g.quadraticCurveTo(18.5, -28, 16, -14); g.stroke();
    // 5 belt + buckle
    g.fillStyle = '#2a2418'; g.fillRect(-16, -26, 32, 5);
    g.fillStyle = '#ffd24a'; g.fillRect(-3, -27, 7, 7);
    g.fillStyle = '#8a6b1f'; g.fillRect(-1, -25, 3, 3);
    // 6 stub mitt arms
    let fmx = 16 + lean * 0.5, fmy = -34;
    if (a.attackKey === 'strike') { fmx = 28; fmy = -38; }
    else if (a.attackKey === 'windup') { fmx = -2; fmy = -44; }
    g.lineWidth = 2.2;
    g.fillStyle = '#3a5a8a'; g.strokeStyle = '#24395c';
    g.beginPath(); g.arc(-16 + lean * 0.3, -34, 4.5, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(fmx, fmy, 4.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#e8a06a'; g.strokeStyle = '#a05c32';
    g.beginPath(); g.arc(-18 + lean * 0.3, -33, 3, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(fmx + 2, fmy + 1, 3, 0, 7); g.fill(); g.stroke();
    // 7 the beard (before the head, swallowing the chest)
    g.fillStyle = '#f4efe2'; g.strokeStyle = '#b5ad96'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-7, -56);
    g.quadraticCurveTo(-14, -44, -6, -28);
    g.quadraticCurveTo(2, -22, 10, -30);
    g.quadraticCurveTo(15, -46, 12, -56);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c9c2ae';
    g.beginPath();
    g.moveTo(-6, -28);
    g.quadraticCurveTo(2, -22, 10, -30);
    g.quadraticCurveTo(3, -26, -6, -28);
    g.closePath(); g.fill();
    g.strokeStyle = '#d9d2bc'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-3, -50); g.lineTo(-4, -32); g.stroke();
    g.beginPath(); g.moveTo(2, -48); g.lineTo(2, -30); g.stroke();
    g.beginPath(); g.moveTo(7, -50); g.lineTo(8, -34); g.stroke();
    // 8 head with a clipped shade crescent
    g.fillStyle = '#e8a06a'; g.strokeStyle = '#a05c32'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(4, -58, 10, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.arc(4, -58, 10, 0, 7); g.clip();
    g.fillStyle = GNOME_SHADE;
    g.fillRect(-8, -70, 5, 24);
    g.restore();
    // 9 nose
    g.fillStyle = '#d4784a'; g.strokeStyle = '#a05c32'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(12, -55, 4.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f2b98a';
    g.beginPath(); g.arc(10.5, -56.5, 1.2, 0, 7); g.fill();
    // 10 eyes
    if (a.hurt) {
      g.strokeStyle = '#5c1416'; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(-0.5, -61.5); g.lineTo(2.5, -58.5);
      g.moveTo(2.5, -61.5); g.lineTo(-0.5, -58.5);
      g.moveTo(5.5, -61.6); g.lineTo(8.5, -58.4);
      g.moveTo(8.5, -61.6); g.lineTo(5.5, -58.4);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(1, -60, 2, 0, 7); g.fill();
      g.beginPath(); g.arc(7, -60, 2.2, 0, 7); g.fill();
      g.fillStyle = '#2c1e12';
      g.beginPath(); g.arc(1.6, -60, 1, 0, 7); g.fill();
      g.beginPath(); g.arc(7.6, -60, 1, 0, 7); g.fill();
      if (a.attackKey === 'windup') { // glare lids
        g.fillStyle = '#e8a06a';
        g.fillRect(-1, -62, 4, 2);
        g.fillRect(4.8, -62.2, 4.4, 2.2);
      }
    }
    // 11 droopy hat, ~40% of the read
    const tip = Math.sin(t * 2) * 1.5;
    g.fillStyle = '#8a1f22';
    g.beginPath(); g.ellipse(3, -65, 13, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#d43b2f'; g.strokeStyle = '#5c1416'; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-10, -63);
    g.quadraticCurveTo(-6, -84, 2, -95);
    g.quadraticCurveTo(8, -88, 7, -80);
    g.quadraticCurveTo(6, -74, 13 + tip, -72);
    g.lineTo(15 + tip, -69);
    g.quadraticCurveTo(9, -66, 16, -63);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#f2705a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-8, -65); g.quadraticCurveTo(-5, -82, 1, -91); g.stroke();
    g.fillStyle = '#d43b2f'; g.strokeStyle = '#5c1416'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(15 + tip, -70, 3.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f2705a';
    g.beginPath(); g.arc(14 + tip, -71.5, 1.2, 0, 7); g.fill();
  };

  // ============================== MURDER WASP =============================
  B.wasp = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const hov = -46 + Math.sin(t * 4) * 3;
    const wf = Math.sin(t * (windup ? 40 : 26)) * 5;
    if (windup) g.translate(-5 + Math.sin(t * 44) * 1.2, 2); // pull-back tremble
    if (strike) { g.translate(0, hov); g.rotate(0.35); g.translate(0, -hov); } // nose-down dive
    if (a.hurt) { g.translate(0, hov); g.rotate(-0.2); g.translate(0, -hov); }

    // 1 dangling legs
    g.strokeStyle = '#5c4a14'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      let ex = -8 + i * 7 + Math.sin(t * 3 + i) * 2;
      if (a.moving) ex += Math.sin(a.walkCyc + i) * 3;
      g.beginPath(); g.moveTo(-6 + i * 7, hov + 8); g.lineTo(ex, hov + 18); g.stroke();
    }
    // 2 stinger spike
    g.fillStyle = '#d8dce4'; g.strokeStyle = '#8a8e98'; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-26, hov - 4); g.lineTo(-26, hov + 2); g.lineTo(-38, hov - 1);
    g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(-30, hov - 1); g.lineTo(-34, hov - 1); g.stroke();
    if (windup) {
      g.fillStyle = VENOM;
      g.beginPath(); g.arc(-38, hov + 1, 1.4, 0, 7); g.fill();
    }
    // 3 fat striped abdomen
    g.fillStyle = '#e8c84a'; g.strokeStyle = '#5c4a14'; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(-13, hov, 16, 10.5, -0.12, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(-13, hov, 16, 10.5, -0.12, 0, 7); g.clip();
    g.fillStyle = '#2a2418';
    g.fillRect(-25, hov - 12, 4.5, 24);
    g.fillRect(-17, hov - 12, 5, 24);
    g.fillRect(-8, hov - 12, 4.5, 24);
    g.restore();
    g.strokeStyle = '#ffdf6e'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-24, hov - 7); g.quadraticCurveTo(-15, hov - 12, -5, hov - 9); g.stroke();
    g.fillStyle = '#b8922a';
    g.beginPath();
    g.moveTo(-24, hov + 6);
    g.quadraticCurveTo(-14, hov + 11, -4, hov + 9);
    g.quadraticCurveTo(-14, hov + 8, -24, hov + 6);
    g.closePath(); g.fill();
    // 4 fuzzy thorax
    g.fillStyle = '#b8922a'; g.strokeStyle = '#5c4a14'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(3, hov - 2, 8, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = '#e8c84a'; g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const ca = Math.cos(WASP_FUZZ[i]), sa = Math.sin(WASP_FUZZ[i]);
      g.beginPath();
      g.moveTo(3 + ca * 8, hov - 2 + sa * 8);
      g.lineTo(3 + ca * 11, hov - 2 + sa * 11);
      g.stroke();
    }
    // 5 head: one huge dark eye, brow, antennae
    g.fillStyle = '#e8c84a'; g.strokeStyle = '#5c4a14'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(14, hov - 3, 6.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#2a2418';
    g.beginPath(); g.ellipse(16, hov - 4, 3.2, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#ffdf6e';
    g.beginPath(); g.arc(15, hov - 6, 1.2, 0, 7); g.fill();
    g.strokeStyle = '#2a2418'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(11, hov - 9); g.lineTo(19, hov - 7); g.stroke();
    g.strokeStyle = '#5c4a14'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(13, hov - 9); g.quadraticCurveTo(10, hov - 13, 9, hov - 16); g.stroke();
    g.beginPath(); g.moveTo(16, hov - 9); g.quadraticCurveTo(16, hov - 14, 14, hov - 17); g.stroke();
    // 6 snapping mandibles (under-stroke then brass)
    const gap = strike ? 4 : 2;
    g.strokeStyle = '#5c4a14'; g.lineWidth = 3;
    g.beginPath(); g.arc(20, hov - gap / 2, 3, -0.6, 1); g.stroke();
    g.beginPath(); g.arc(20, hov + gap / 2, 3, -1, 0.6); g.stroke();
    g.strokeStyle = '#b8922a'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(20, hov - gap / 2, 3, -0.6, 1); g.stroke();
    g.beginPath(); g.arc(20, hov + gap / 2, 3, -1, 0.6); g.stroke();
    // 7 wing shimmer, drawn last above everything
    if (strike) g.globalAlpha = 0.6; // speed streak
    g.fillStyle = WING_REAR;
    g.beginPath(); g.ellipse(-3, hov - 14 + wf * 0.4, strike ? 16 : 12, 4, -0.6 - wf * 0.04, 0, 7); g.fill();
    g.fillStyle = WING_FRONT;
    g.beginPath(); g.ellipse(4, hov - 15 - wf * 0.4, 13, 4.5, -0.45 + wf * 0.05, 0, 7); g.fill();
    g.fillStyle = WING_BLUR;
    g.beginPath(); g.ellipse(4, hov - 15 - wf * 0.4, 13, 4.5, -0.27 + wf * 0.05, 0, 7); g.fill();
    g.globalAlpha = 1;
  };

  // ============================== TRASH PANDA =============================
  B.panda = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const lum = a.moving ? Math.sin(a.walkCyc) * 2.5 : Math.sin(t * 1.5);
    const ty = lum + (windup ? -6 : 0);        // torso lumber + windup rear-up
    const hy = -lum * 0.6 + (windup ? -6 : 0); // head counter-bob
    if (strike) { g.translate(0, -20); g.rotate(0.1); g.translate(0, 20); }
    else if (a.hurt) { g.translate(0, -20); g.rotate(-0.12); g.translate(0, 20); }

    // 1 ringed tail curling up behind, swaying
    const sway = Math.sin(t * 2) * 1.5;
    g.strokeStyle = '#26262e'; g.lineWidth = 12;
    g.beginPath();
    g.moveTo(-18, -24);
    g.quadraticCurveTo(-34 + sway, -30, -36, -52);
    g.quadraticCurveTo(-36 + sway, -64, -28, -70);
    g.stroke();
    g.strokeStyle = '#8d8d96'; g.lineWidth = 9;
    g.beginPath();
    g.moveTo(-18, -24);
    g.quadraticCurveTo(-34 + sway, -30, -36, -52);
    g.quadraticCurveTo(-36 + sway, -64, -28, -70);
    g.stroke();
    for (let i = 0; i < 16; i += 4) {
      const rx = P_RINGS[i], ry = P_RINGS[i + 1], dx = P_RINGS[i + 2], dy = P_RINGS[i + 3];
      g.strokeStyle = '#26262e'; g.lineWidth = 11;
      g.beginPath(); g.moveTo(rx - dx, ry - dy); g.lineTo(rx + dx, ry + dy); g.stroke();
      g.strokeStyle = '#3a3a42'; g.lineWidth = 9;
      g.beginPath(); g.moveTo(rx - dx, ry - dy); g.lineTo(rx + dx, ry + dy); g.stroke();
    }
    g.fillStyle = '#3a3a42'; g.strokeStyle = '#26262e'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(-27, -70, 5, 0, 7); g.fill(); g.stroke();
    // 2 haunch
    g.fillStyle = '#5c5c66'; g.strokeStyle = '#26262e'; g.lineWidth = 2.6;
    g.beginPath(); g.ellipse(-10, -20 + ty, 17, 16, 0, 0, 7); g.fill(); g.stroke();
    // 3 the boulder hump
    g.fillStyle = '#8d8d96'; g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(-24, -10 + ty);
    g.quadraticCurveTo(-28, -52 + ty, -8, -74 + ty);
    g.quadraticCurveTo(6, -82 + ty, 16, -70 + ty);
    g.quadraticCurveTo(20, -60 + ty, 18, -46 + ty);
    g.quadraticCurveTo(24, -24 + ty, 18, -10 + ty);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#a8a8b2'; g.lineWidth = 3; // spine light, top-left key
    g.beginPath(); g.moveTo(-18, -48 + ty); g.quadraticCurveTo(-17, -66 + ty, 0, -74 + ty); g.stroke();
    g.fillStyle = '#a8a8b2';
    g.beginPath(); g.ellipse(6, -30 + ty, 11, 14, 0, 0, 7); g.fill();
    // 4 shuffling feet
    const shf = a.moving ? Math.sin(a.walkCyc) * 5 : 0;
    g.fillStyle = '#3a3a42'; g.strokeStyle = '#26262e'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-16 + shf, -6, 12, 6, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(2 - shf, -6, 12, 6, 2); g.fill(); g.stroke();
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-11 + shf, -6); g.lineTo(-11 + shf, -2.5);
    g.moveTo(-8 + shf, -6); g.lineTo(-8 + shf, -2.5);
    g.moveTo(7 - shf, -6); g.lineTo(7 - shf, -2.5);
    g.moveTo(10 - shf, -6); g.lineTo(10 - shf, -2.5);
    g.stroke();
    // 5 small masked head, jutting forward and low
    g.fillStyle = '#8d8d96'; g.strokeStyle = '#26262e'; g.lineWidth = 2.6;
    g.beginPath(); g.arc(20, -58 + hy, 11, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#5c5c66'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(12, -68 + hy); g.lineTo(9, -77 + hy); g.lineTo(17, -70 + hy); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(22, -69 + hy); g.lineTo(26, -78 + hy); g.lineTo(28, -68 + hy); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#2c2c34'; // inner ears (60% size, precomputed toward centroids)
    g.beginPath(); g.moveTo(12.3, -69.5 + hy); g.lineTo(10.5, -74.9 + hy); g.lineTo(15.3, -70.7 + hy); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(23.3, -70.1 + hy); g.lineTo(25.7, -75.5 + hy); g.lineTo(26.9, -69.5 + hy); g.closePath(); g.fill();
    // 6 bandit mask + white brow
    g.fillStyle = '#2c2c34';
    g.beginPath(); g.roundRect(11, -63 + hy, 20, 6.5, 3); g.fill();
    g.fillStyle = P_BROW;
    g.fillRect(12, -65.5 + hy, 18, 2.2);
    // 7 eyes inside the mask
    if (a.hurt) {
      g.strokeStyle = '#26262e'; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(19, -62 + hy); g.lineTo(22, -59.6 + hy);
      g.moveTo(22, -62 + hy); g.lineTo(19, -59.6 + hy);
      g.moveTo(26, -61.5 + hy); g.lineTo(29, -59.1 + hy);
      g.moveTo(29, -61.5 + hy); g.lineTo(26, -59.1 + hy);
      g.stroke();
    } else {
      g.fillStyle = '#ffd977';
      g.fillRect(19, -62 + hy, 3, 2.4);
      g.fillRect(26, -61.5 + hy, 3, 2.4);
    }
    // 8 muzzle, nose, whiskers
    g.fillStyle = '#e8e4d8'; g.strokeStyle = '#8a8a80'; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(30, -53 + hy, 5.5, 4, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#1d1d24';
    g.beginPath(); g.arc(34, -54 + hy, 2.2, 0, 7); g.fill();
    g.strokeStyle = '#c9c2ae'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(33, -52 + hy); g.lineTo(39, -51 + hy); g.stroke();
    g.beginPath(); g.moveTo(33, -50 + hy); g.lineTo(38, -48 + hy); g.stroke();
    // 9 paws + the stolen coin (the signature tell)
    let cx = 22, cy = -42, p1x = 17, p1y = -40, p2x = 27, p2y = -41;
    if (windup) { cx = 12; cy = -78; p1x = 7; p1y = -76; p2x = 17; p2y = -76; }
    else if (strike) { cx = 32; cy = -34; p1x = 27; p1y = -32; p2x = 37; p2y = -33; }
    else if (a.hurt) { cx = 16; cy = -44; p1x = 11; p1y = -42; p2x = 21; p2y = -43; }
    g.save();
    g.translate(cx, cy); g.rotate(Math.sin(t * 3) * 0.1);
    g.fillStyle = '#ffd24a'; g.strokeStyle = '#8a6b1f'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, 6.5, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 1.2;
    g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.stroke();
    g.strokeStyle = '#ffefb0'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-1.5, -2, 2, 3.4, 5.1); g.stroke();
    g.restore();
    g.fillStyle = '#5c5c66'; g.strokeStyle = '#26262e'; g.lineWidth = 2;
    g.beginPath(); g.arc(p1x, p1y, 4, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(p2x, p2y, 4, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 1.2; // finger strokes gripping the coin edge
    g.beginPath();
    g.moveTo(p1x + 1, p1y - 2); g.lineTo(p1x + 2, p1y + 2);
    g.moveTo(p1x + 3, p1y - 2); g.lineTo(p1x + 4, p1y + 1);
    g.moveTo(p2x - 2, p2y - 2); g.lineTo(p2x - 3, p2y + 2);
    g.moveTo(p2x - 4, p2y - 2); g.lineTo(p2x - 5, p2y + 1);
    g.stroke();
    if (Math.sin(t * 4.2) > 0.98) { // sparkle ~every 1.5s
      g.strokeStyle = '#ffefb0'; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(cx + 7, cy); g.lineTo(cx + 11, cy);
      g.moveTo(cx - 7, cy); g.lineTo(cx - 11, cy);
      g.moveTo(cx, cy - 7); g.lineTo(cx, cy - 11);
      g.moveTo(cx, cy + 7); g.lineTo(cx, cy + 11);
      g.stroke();
    }
  };

  // ============================ SPRINKLER SENTRY ==========================
  B.sprinkler = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';

    // 1 staked base plate (never rides the hop/rock)
    g.fillStyle = '#3d7a46'; g.strokeStyle = '#1d3a22'; g.lineWidth = 2.2;
    g.beginPath(); g.roundRect(-15, -7, 30, 7, 2); g.fill(); g.stroke();
    g.fillStyle = '#6fbf7a'; g.fillRect(-15, -7, 30, 2);
    g.fillStyle = '#2c5c34'; // dirt prongs poking into the ground shadow
    g.beginPath(); g.moveTo(-8, 0); g.lineTo(-4, 0); g.lineTo(-6, 4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(4, 0); g.lineTo(8, 0); g.lineTo(6, 4); g.closePath(); g.fill();

    // pogo hop + rocking for everything above the stake
    if (a.moving) {
      g.rotate(Math.sin(a.walkCyc) * 0.04);
      g.translate(0, -Math.abs(Math.sin(a.walkCyc)) * 3);
    }
    if (a.hurt) g.rotate(-0.1);

    // 2 brass stem
    g.fillStyle = '#d4a83c'; g.strokeStyle = '#5c470f'; g.lineWidth = 2;
    g.beginPath(); g.rect(-4, -30, 8, 24); g.fill(); g.stroke();
    g.fillStyle = '#f0cf6e'; g.fillRect(-4, -30, 2, 24);
    g.fillStyle = '#8a6b1f';
    g.beginPath(); g.ellipse(0, -30, 7, 3, 0, 0, 7); g.fill();
    // 3 riveted canister body
    g.fillStyle = '#d4a83c'; g.strokeStyle = '#5c470f'; g.lineWidth = 2.4;
    g.beginPath(); g.roundRect(-13, -58, 26, 29, 6); g.fill(); g.stroke();
    g.fillStyle = '#f0cf6e'; g.fillRect(-10, -56, 4, 25);
    g.fillStyle = '#8a6b1f'; g.fillRect(7, -56, 4, 25);
    g.fillStyle = '#f7e6b0';
    g.beginPath(); g.arc(-9, -52, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -53, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(9, -52, 1.3, 0, 7); g.fill();
    // 4 pressure gauge (needle spins when hurt)
    g.fillStyle = '#24482a'; g.strokeStyle = '#5c470f'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(2, -44, 5.5, 0, 7); g.fill(); g.stroke();
    const na = a.hurt ? t * 12 : -0.6 + Math.sin(t * 2) * 0.5;
    g.strokeStyle = '#7fd4ff'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(2, -44); g.lineTo(2 + Math.cos(na) * 4, -44 + Math.sin(na) * 4); g.stroke();
    g.fillStyle = '#5fae6a'; // tick dots at angles -1.1 / 0.4, radius 4 (precomputed)
    g.beginPath(); g.arc(3.8, -47.6, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(5.7, -42.4, 0.8, 0, 7); g.fill();
    // 5 green shoulder cap + status light
    g.fillStyle = '#5fae6a'; g.strokeStyle = '#1d3a22'; g.lineWidth = 2.2;
    g.beginPath(); g.roundRect(-11, -64, 22, 8, 3); g.fill(); g.stroke();
    g.fillStyle = '#24482a'; g.fillRect(-6, -62, 12, 3);
    g.fillStyle = windup ? (Math.floor(t * 10) % 2 ? '#ff5a4a' : '#8a1f22') : '#5fae6a';
    g.beginPath(); g.arc(0, -61, 1.6, 0, 7); g.fill();
    // 6 neck
    g.fillStyle = '#8a6b1f'; g.strokeStyle = '#5c470f'; g.lineWidth = 1.6;
    g.beginPath(); g.rect(-2.5, -70, 5, 7); g.fill(); g.stroke();
    // 7 rotating T-bar head — nozzle lands ~(27,-72), owning the bolt spawn
    g.save();
    g.translate(0, -72);
    g.rotate(windup ? Math.sin(t * 44) * 0.05 : strike ? -0.12 : Math.sin(t * 1.6) * 0.6);
    g.fillStyle = '#d4a83c'; g.strokeStyle = '#5c470f'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-20, -3, 46, 6, 3); g.fill(); g.stroke();
    g.fillStyle = '#f0cf6e'; g.fillRect(-20, -3, 46, 1.6);
    g.fillStyle = '#8a6b1f';
    g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f0cf6e';
    g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill();
    g.fillStyle = '#8a6b1f';
    g.beginPath(); g.roundRect(24, -4.5, 7, 9, 2); g.fill(); g.stroke();
    g.fillStyle = '#24482a';
    g.beginPath(); g.arc(29, 0, 1.8, 0, 7); g.fill();
    g.fillStyle = '#8a6b1f';
    g.beginPath(); g.arc(-20, 0, 3.5, 0, 7); g.fill(); g.stroke();
    g.restore();
    // 8 water — formula-driven, allocation-free
    if (windup) { // charge bulb pulsing at the nozzle
      g.fillStyle = WATER55;
      g.beginPath(); g.arc(29, -72, 2 + 3 * Math.abs(Math.sin(t * 10)), 0, 7); g.fill();
      g.strokeStyle = '#7fd4ff'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(29, -72, 5, 0, 7); g.stroke();
    } else if (strike) { // streaks the instant the real bolt spawns
      g.strokeStyle = WATER80; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(31, -76); g.lineTo(41, -76);
      g.moveTo(31, -72); g.lineTo(45, -72);
      g.moveTo(31, -68); g.lineTo(41, -68);
      g.stroke();
    } else { // idle drips on a wrap formula
      g.fillStyle = '#7fd4ff';
      for (let i = 0; i < 3; i++) {
        const p = (t * 1.4 + i * 0.33) % 1;
        g.globalAlpha = (1 - p) * 0.7;
        g.beginPath(); g.arc(27 + p * 6, -70 + p * 26, 1.6, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    }
  };

  // ================================ THE GOOSE =============================
  // Fidelity upgrade over the old drawBoss goose — every anchor preserved:
  // legs (+/-6,-18), body ellipse (-2,-30,24,15), wing pivot (-4,-34) with the
  // existing gf driver, neck (12,-34)->(15,-74), head (16,-76), beak 23..32 x.
  BOSS.goose = function (g, e, t) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const wk = Math.sin(e.walkCyc || 0) * 4;
    const windup = e.state === 'windup', strike = e.state === 'strike';
    const gf = windup ? Math.sin(t * 30) * 8 : Math.sin(t * 3) * 2;
    const open = windup ? 4 + Math.sin(t * 30) * 1.5 : strike ? 5 : 1;
    const fx1 = -8 + wk, fx2 = 8 - wk;

    // 1 legs + webbed feet (same endpoints as before)
    g.strokeStyle = '#a86a10'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-6, -18); g.lineTo(fx1, 0); g.stroke();
    g.beginPath(); g.moveTo(6, -18); g.lineTo(fx2, 0); g.stroke();
    g.strokeStyle = '#e8a020'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-6, -18); g.lineTo(fx1, 0); g.stroke();
    g.beginPath(); g.moveTo(6, -18); g.lineTo(fx2, 0); g.stroke();
    g.fillStyle = '#a86a10';
    g.beginPath(); g.arc((fx1 - 6) / 2, -9, 1.8, 0, 7); g.fill();
    g.beginPath(); g.arc((fx2 + 6) / 2, -9, 1.8, 0, 7); g.fill();
    g.fillStyle = '#e8a020'; g.strokeStyle = '#a86a10'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(fx1 - 4, 0); g.lineTo(fx1 + 5, 0); g.lineTo(fx1 + 1, -3); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(fx2 - 4, 0); g.lineTo(fx2 + 5, 0); g.lineTo(fx2 + 1, -3); g.closePath(); g.fill(); g.stroke();
    // 2 layered tail feathers, tips bouncing on the flap driver
    const tb = gf * 0.2;
    g.strokeStyle = '#4a4e5c'; g.lineWidth = 1.6;
    g.fillStyle = '#8a8e98';
    g.beginPath(); g.moveTo(-20, -34); g.lineTo(-40, -50 + tb); g.lineTo(-18, -26); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#b8bcc4';
    g.beginPath(); g.moveTo(-20, -35); g.lineTo(-36, -52 + tb); g.lineTo(-18, -28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#d8dce4';
    g.beginPath(); g.moveTo(-19, -36); g.lineTo(-32, -52 + tb); g.lineTo(-17, -30); g.closePath(); g.fill(); g.stroke();
    // 3 body: same ellipse anchor, now with breast light, rim, belly shade
    g.fillStyle = '#b8bcc4'; g.strokeStyle = '#4a4e5c'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(-2, -30, 24, 15, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#d8dce4';
    g.beginPath(); g.ellipse(6, -33, 13, 9, 0, 0, 7); g.fill();
    g.strokeStyle = '#f4f6fa'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-18, -42); g.quadraticCurveTo(-7, -48, 6, -44); g.stroke();
    g.fillStyle = '#8a8e98';
    g.beginPath();
    g.moveTo(-14, -19);
    g.quadraticCurveTo(-1, -13, 12, -18);
    g.quadraticCurveTo(-1, -19, -14, -19);
    g.closePath(); g.fill();
    // 4 flank feather scallop rows, clipped to the body
    g.save();
    g.beginPath(); g.ellipse(-2, -30, 24, 15, 0, 0, 7); g.clip();
    g.strokeStyle = '#8a8e98'; g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(G_ROW1[i], -27, 4, 0, Math.PI); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(G_ROW2[i], -33, 4, 0, Math.PI); g.stroke(); }
    g.restore();
    // 5 wing: old pivot + gf driver, with 4 primaries fanning wide on windup
    const wy = -34 + gf * 0.3;
    g.fillStyle = '#9a9ea8'; g.strokeStyle = '#4a4e5c'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(-4, wy, 15, 8.5, -0.3, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = '#4a4e5c'; g.lineWidth = 6.5;
      g.beginPath(); g.moveTo(-8, wy);
      g.quadraticCurveTo(-22 - i * 3, -40 + gf * (0.5 + i * 0.28), -30 - i * 4, -28 + gf * (0.6 + i * 0.3));
      g.stroke();
      g.strokeStyle = i % 2 ? '#b8bcc4' : '#d8dce4'; g.lineWidth = 4.5;
      g.beginPath(); g.moveTo(-8, wy);
      g.quadraticCurveTo(-22 - i * 3, -40 + gf * (0.5 + i * 0.28), -30 - i * 4, -28 + gf * (0.6 + i * 0.3));
      g.stroke();
    }
    // 6 coverts along the wing leading edge
    g.strokeStyle = '#f4f6fa'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-12, -38 + gf * 0.3, 3, 0, Math.PI); g.stroke();
    g.beginPath(); g.arc(-4, -40 + gf * 0.3, 3, 0, Math.PI); g.stroke();
    g.beginPath(); g.arc(4, -39 + gf * 0.3, 3, 0, Math.PI); g.stroke();
    // 7 S-curve neck, same endpoints, with chinstrap collar
    g.strokeStyle = '#14141c'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(12, -34); g.quadraticCurveTo(19, -52, 14, -62); g.quadraticCurveTo(12, -70, 15, -74); g.stroke();
    g.strokeStyle = '#1d1d24'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(12, -34); g.quadraticCurveTo(19, -52, 14, -62); g.quadraticCurveTo(12, -70, 15, -74); g.stroke();
    g.strokeStyle = '#3d3d4c'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(13, -34); g.quadraticCurveTo(20, -52, 15, -62); g.quadraticCurveTo(13, -70, 16, -74); g.stroke();
    g.strokeStyle = '#f2f4f8'; g.lineWidth = 2;
    g.beginPath(); g.arc(12, -38, 5, -1, 1); g.stroke();
    // 8 head at the old anchor
    g.fillStyle = '#1d1d24'; g.strokeStyle = '#14141c'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(16, -76, 8.5, 7, 0.2, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = '#3d3d4c'; g.lineWidth = 2;
    g.beginPath(); g.arc(16, -76, 6, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    // 9 canada-goose cheek patch
    g.fillStyle = '#f2f4f8';
    g.beginPath(); g.ellipse(14, -71.5, 4, 2.8, 0.3, 0, 7); g.fill();
    // 10 the furious face
    g.fillStyle = '#14141c';
    g.beginPath(); g.moveTo(13, -82); g.lineTo(22, -79); g.lineTo(21, -77); g.lineTo(13, -79.5); g.closePath(); g.fill();
    g.fillStyle = '#ff3a3a';
    g.beginPath(); g.arc(18, -77.5, windup ? 3 : 2.4, 0, 7); g.fill();
    g.fillStyle = '#14141c'; g.fillRect(17.6, -79, 1, 3);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(17, -78.5, 0.7, 0, 7); g.fill();
    if (windup) { // rage strokes at angles -0.8 / 0 / 0.8, radius 4 -> 6.5
      g.strokeStyle = '#ff3a3a'; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(20.8, -80.4); g.lineTo(22.5, -82.2);
      g.moveTo(22, -77.5); g.lineTo(24.5, -77.5);
      g.moveTo(20.8, -74.6); g.lineTo(22.5, -72.8);
      g.stroke();
    }
    // 11 hinged honking beak
    g.fillStyle = '#e8a020'; g.strokeStyle = '#a86a10'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(23, -78); g.lineTo(33, -75); g.lineTo(23, -73); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#ffce54'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(23, -78); g.lineTo(33, -75); g.stroke();
    if (open > 3) {
      g.fillStyle = '#d4503a';
      g.beginPath(); g.moveTo(24, -72.5); g.lineTo(29, -71.5 + open * 0.5); g.lineTo(24, -70.5); g.closePath(); g.fill();
    }
    g.fillStyle = '#a86a10'; g.strokeStyle = '#6b4a08'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(23, -72); g.lineTo(31, -70 + open); g.lineTo(23, -69 + open); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#a86a10';
    g.beginPath(); g.arc(26, -75.5, 0.8, 0, 7); g.fill();
    // 12 honk rings during the strike (pairs with the HONK! float)
    if (strike) {
      g.strokeStyle = HONK; g.lineWidth = 1.5;
      g.beginPath(); g.arc(34, -73, 6, -0.5, 0.5); g.stroke();
      g.beginPath(); g.arc(34, -73, 9, -0.5, 0.5); g.stroke();
      g.beginPath(); g.arc(34, -73, 12, -0.5, 0.5); g.stroke();
    }
  };
})();
