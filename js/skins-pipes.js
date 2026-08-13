// skins-pipes.js — World 1 (pipes) creature bodies: clog blob, drain rat,
// rust golem, grease spitter + the Water Heater boss fidelity upgrade.
// Contract: B.<key>(g, a) is called in local space (feet at 0,0, +x = facing,
// y negative = up); caller has already translated/scaled and drawn the shadow.
// BOSS.<key>(g, e, t) likewise — body only, overlays belong to the caller.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // ---- hoisted constants (no per-frame allocations) ----
  const HEAD_RO = [10, 10, 2, 2];       // golem head outline corner radii (tl,tr,br,bl)
  const HEAD_RI = [9, 9, 1, 1];         // golem head dome corner radii
  const GRIV = [-16, -70, 16, -70, -16, -44, 16, -44, -16, -27, 16, -27]; // golem torso rivets
  const BAND_YS = [-64, -34];           // heater weld band rows
  const RIVX = [-17, -8, 1, 10, 17];    // heater weld band rivet columns
  const WARTS = [-14, -44, -6, -56, -18, -32, 2, -60]; // toad wart spots
  const RUFF = [-12, -56, -4, -62, 3, -62, 9, -57];    // rat fur ruff spikes
  const S2 = Math.SQRT1_2;

  // small teardrop: base edge at (x0,y0) tapering to a point at (x1,y1)
  function drip(g, x0, y0, x1, y1) {
    const my = (y0 + y1) / 2;
    g.beginPath();
    g.moveTo(x0 - 1.6, y0);
    g.quadraticCurveTo(x1 - 1.8, my, x1, y1);
    g.quadraticCurveTo(x1 + 1.8, my, x0 + 1.6, y0);
    g.closePath();
    g.fill(); g.stroke();
  }

  // filled (optionally outlined) triangle
  function tri(g, ax, ay, bx, by, cx, cy, outline) {
    g.beginPath();
    g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy);
    g.closePath();
    g.fill();
    if (outline) g.stroke();
  }

  // ============================================================
  // GRUNT — CLOG BLOB: melting green mound with floating eyes
  // ============================================================
  B.clog = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';

    // 1. wobble transform, anchored at the feet
    const wob = Math.sin(a.animT * 4.6);
    let sx = 1 + 0.06 * wob, sy = 1 - 0.06 * wob;
    if (windup) { sy *= 0.82; sx *= 1.10; }
    else if (strike) { sx *= 1.16; sy *= 1.06; }
    if (a.hurt) sx *= 1 + 0.10 * Math.sin(a.animT * 30);
    g.scale(sx, sy);
    if (a.moving) g.rotate(Math.sin(a.walkCyc) * 0.05); // heavy slosh, not a walk

    // 2-3. body silhouette: outline pass then base fill on the same path
    g.beginPath();
    g.moveTo(-24, 0);
    g.quadraticCurveTo(-30, -22, -22, -42);
    g.quadraticCurveTo(-28, -52, -18, -62);
    g.quadraticCurveTo(-14, -80, 2, -80);
    g.quadraticCurveTo(16, -78, 18, -64);
    g.quadraticCurveTo(30, -52, 24, -36);
    g.quadraticCurveTo(28, -14, 22, 0);
    g.closePath();
    g.strokeStyle = '#24330f'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#6a8a3a'; g.fill();

    // 4-6. interior shading clipped to the body
    g.save();
    g.clip();
    g.fillStyle = '#3d5417'; // deep shade, lower-right
    g.beginPath(); g.ellipse(12, -24, 16, 22, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(20, -48, 8, 12, 0, 0, 7); g.fill();
    g.globalAlpha = 0.6; g.fillRect(-24, -6, 48, 6); g.globalAlpha = 1;
    g.fillStyle = '#8fae4e'; // light mass, top-left
    g.beginPath(); g.ellipse(-8, -58, 14, 18, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-2, -74, 9, 7, 0, 0, 7); g.fill();
    g.strokeStyle = '#c2d96a'; g.lineWidth = 2.5; // rim highlight along the crest
    g.beginPath(); g.arc(-4, -64, 16, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
    g.fillStyle = '#d8ecb0'; // wet specular
    g.beginPath(); g.arc(-10, -64, 2.2, 0, 7); g.fill();
    g.beginPath(); g.arc(-4, -72, 1.4, 0, 7); g.fill();
    g.fillStyle = '#4ae8b2'; g.globalAlpha = 0.22; // world-glow sheen
    g.beginPath(); g.ellipse(18, -20, 5, 10, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.restore();

    // 7. drip stalactites off the overhang lobes + one falling droplet
    g.fillStyle = '#6a8a3a'; g.strokeStyle = '#24330f'; g.lineWidth = 2;
    drip(g, -22, -40, -21, -26);
    drip(g, 24, -34, 24, -20);
    drip(g, -16, -60, -15, -50);
    const dy = (a.animT * 46) % 30;
    g.fillStyle = '#8fae4e'; g.globalAlpha = 1 - dy / 30;
    g.beginPath(); g.arc(24, -20 + dy, 1.8, 0, 7); g.fill();
    g.globalAlpha = 1;

    // 8. half-sunk bottle cap
    g.fillStyle = '#d4a02a';
    g.beginPath(); g.arc(10, -40, 4.5, 0, 7); g.fill();
    g.strokeStyle = '#8a5c14'; g.lineWidth = 1.5; g.stroke();
    for (let i = 0; i < 6; i++) {
      const ca = i * Math.PI / 3;
      g.beginPath();
      g.moveTo(10 + Math.cos(ca) * 4.5, -40 + Math.sin(ca) * 4.5);
      g.lineTo(10 + Math.cos(ca) * 6.5, -40 + Math.sin(ca) * 6.5);
      g.stroke();
    }
    g.fillStyle = '#8a5c14';
    g.beginPath(); g.arc(10, -40, 1.5, 0, 7); g.fill();

    // 9. hair tuft breaking the crown + half-sunk strand
    g.strokeStyle = '#2c2418'; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(0, -80); g.quadraticCurveTo(-6, -88, -12, -84);
    g.moveTo(-2, -80); g.quadraticCurveTo(2, -88, 8, -86);
    g.stroke();
    g.beginPath(); g.moveTo(-18, -44); g.quadraticCurveTo(-24, -50, -26, -46); g.stroke();

    // 10. googly eyes bobbing in the slime
    const eb = Math.sin(a.animT * 4.6 + 1) * 1.5;
    g.fillStyle = '#f4f8e8';
    g.beginPath(); g.arc(8, -52 + eb, 3.4, 0, 7); g.fill();
    g.beginPath(); g.arc(16, -46 + eb, 3.0, 0, 7); g.fill();
    if (a.hurt) {
      // X pupils
      g.strokeStyle = '#24330f'; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(8.2, -52.8 + eb); g.lineTo(9.8, -51.2 + eb);
      g.moveTo(9.8, -52.8 + eb); g.lineTo(8.2, -51.2 + eb);
      g.moveTo(16.2, -46.8 + eb); g.lineTo(17.8, -45.2 + eb);
      g.moveTo(17.8, -46.8 + eb); g.lineTo(16.2, -45.2 + eb);
      g.stroke();
    } else {
      const pc = windup ? 1.5 : 0; // pupils converge toward the player on windup
      g.fillStyle = '#24330f';
      g.beginPath(); g.arc(9 + pc, -52 + eb, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(17 + pc, -46 + eb, 1.4, 0, 7); g.fill();
    }

    // 11. mouth
    if (windup || strike) {
      g.fillStyle = '#24330f';
      g.beginPath(); g.ellipse(13, -36 + eb * 0.5, 6, 4, 0, 0, 7); g.fill();
    } else {
      g.strokeStyle = '#24330f'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(6, -38); g.quadraticCurveTo(11, -35, 16, -38); g.stroke();
    }
  };

  // ============================================================
  // STINGER — DRAIN RAT: hunched crescent, pointy nose, curly tail
  // ============================================================
  B.rat = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    if (strike) g.scale(1.15, 0.9); // feet-anchored lunge stretch

    // 1. body bob (feet and tail-root stay at ground)
    const by = a.moving ? Math.sin(a.walkCyc * 2) * 2 : 0;

    // 2. tail: outline pass then skin pass on the same path
    const tw = windup ? 0 : Math.sin(a.animT * 7) * 3;
    g.beginPath();
    g.moveTo(-18, -18 + by);
    g.quadraticCurveTo(-30, -8 + tw, -36, -6);
    g.quadraticCurveTo(-42, -4, -42, -12 + tw);
    g.quadraticCurveTo(-42, -18, -37, -16);
    g.strokeStyle = '#6a3a30'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#c88a7a'; g.lineWidth = 3; g.stroke();

    // 3. back haunch + paddling back foot
    g.fillStyle = '#4a3e32';
    g.beginPath(); g.ellipse(-10, -16, 11, 10, 0, 0, 7); g.fill();
    g.strokeStyle = '#241c14'; g.lineWidth = 2.5; g.stroke();
    const tp = a.moving ? Math.sin(a.walkCyc) * 3 : 0;
    g.fillStyle = '#8a5648';
    tri(g, -18 + tp, 0, -14 + tp, -4, -13 + tp, 0);
    tri(g, -13 + tp, 0, -10 + tp, -4, -8 + tp, 0);
    tri(g, -8 + tp, 0, -6 + tp, -3, -4 + tp, 0);

    // torso/head block rides the bob; windup crouches it 3 down
    g.save();
    g.translate(0, by + (windup ? 3 : 0));

    // 4. body arch
    g.beginPath();
    g.moveTo(-20, -10);
    g.quadraticCurveTo(-28, -36, -14, -56);
    g.quadraticCurveTo(-4, -68, 6, -60);
    g.quadraticCurveTo(16, -52, 20, -38);
    g.quadraticCurveTo(24, -22, 18, -8);
    g.closePath();
    g.strokeStyle = '#241c14'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#8a7a6a'; g.fill();

    // 5. fur ruff, belly, top-left light, rim
    g.fillStyle = '#4a3e32';
    for (let i = 0; i < 8; i += 2) {
      const rx = RUFF[i], ry = RUFF[i + 1];
      tri(g, rx - 2, ry + 2, rx + 2, ry + 1, rx - 1, ry - 3); // up-back spikes
    }
    g.fillStyle = '#ab9c8a';
    g.beginPath(); g.ellipse(6, -22, 9, 12, 0, 0, 7); g.fill();
    g.globalAlpha = 0.8;
    g.beginPath(); g.ellipse(-8, -50, 9, 12, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = '#d8cab4'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-4, -52, 14, Math.PI * 1.1, Math.PI * 1.5); g.stroke();

    // 6. head + wedge snout
    g.fillStyle = '#8a7a6a';
    g.beginPath(); g.arc(14, -46, 9, 0, 7); g.fill();
    g.strokeStyle = '#241c14'; g.lineWidth = 2.5; g.stroke();
    g.beginPath();
    g.moveTo(18, -52); g.lineTo(28, -36); g.lineTo(14, -38);
    g.closePath();
    g.fill(); g.stroke();

    // 7. ears (windup pins them back, hurt droops them)
    const ox = windup ? -2 : 0, oy = (windup ? 2 : 0) + (a.hurt ? 3 : 0);
    g.fillStyle = '#4a3e32'; // far ear
    g.beginPath(); g.arc(7 + ox, -64 + oy, 5, 0, 7); g.fill();
    g.fillStyle = '#8a5648';
    g.beginPath(); g.arc(7 + ox, -64 + oy, 2.6, 0, 7); g.fill();
    g.fillStyle = '#8a7a6a'; // near ear with the V bite
    g.beginPath();
    g.moveTo(13 + ox, -58 + oy);
    g.quadraticCurveTo(11 + ox, -68 + oy, 16 + ox, -69 + oy);
    g.lineTo(17 + ox, -64 + oy);
    g.lineTo(20 + ox, -68 + oy);
    g.quadraticCurveTo(23 + ox, -63 + oy, 21 + ox, -57 + oy);
    g.closePath();
    g.fill();
    g.strokeStyle = '#241c14'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c88a7a';
    tri(g, 15 + ox, -60 + oy, 18 + ox, -63 + oy, 19 + ox, -59 + oy);

    // 8. face: nose, teeth, eye
    g.fillStyle = '#8a5648';
    g.beginPath(); g.arc(28, -36, 1.8, 0, 7); g.fill();
    g.fillStyle = '#f2e8d0';
    if (strike) { g.fillRect(24, -35, 2, 4); g.fillRect(26.5, -35, 2, 4); }
    else { g.fillRect(24, -34, 2, 3); g.fillRect(26.5, -34, 2, 3); }
    if (a.hurt) {
      g.strokeStyle = '#241c14'; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(14.5, -49.5); g.lineTo(17.5, -46.5);
      g.moveTo(17.5, -49.5); g.lineTo(14.5, -46.5);
      g.stroke();
    } else {
      g.fillStyle = '#241c14';
      g.beginPath(); g.arc(16, -48, 3, 0, 7); g.fill();
      if (windup) { // glint halo brightens before the lunge
        g.fillStyle = '#ff5a3c'; g.globalAlpha = 0.4;
        g.beginPath(); g.arc(16.6, -48.4, 3, 0, 7); g.fill();
        g.globalAlpha = 1;
      }
      g.fillStyle = '#ff5a3c';
      g.beginPath(); g.arc(16.6, -48.4, 1.6, 0, 7); g.fill();
      g.fillStyle = '#ffd8c8';
      g.beginPath(); g.arc(17, -49, 0.6, 0, 7); g.fill();
    }

    // 9. whiskers
    g.strokeStyle = '#d8cab4'; g.lineWidth = 1; g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(26, -38); g.lineTo(34, -41);
    g.moveTo(26, -37); g.lineTo(35, -37);
    g.moveTo(26, -36); g.lineTo(33, -32);
    g.stroke();
    g.globalAlpha = 1;
    g.restore();

    // 10. front paws (extended forward mid-lunge)
    g.strokeStyle = '#8a5648'; g.lineWidth = 4;
    g.beginPath();
    if (strike) {
      g.moveTo(14, -12); g.lineTo(26, -8);
      g.moveTo(17, -14); g.lineTo(29, -10);
    } else {
      g.moveTo(12, -14 + by); g.lineTo(16, -2);
      g.moveTo(16, -14 + by); g.lineTo(20, -3);
    }
    g.stroke();
    g.fillStyle = '#c88a7a';
    if (strike) {
      g.beginPath(); g.arc(26, -8, 2, 0, 7); g.fill();
      g.beginPath(); g.arc(29, -10, 2, 0, 7); g.fill();
    } else {
      g.beginPath(); g.arc(16, -2, 2, 0, 7); g.fill();
      g.beginPath(); g.arc(20, -3, 2, 0, 7); g.fill();
    }
  };

  // ============================================================
  // BRUTE — RUST GOLEM: riveted boiler-plate slab, one cyan eye
  // ============================================================
  B.golem = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const hb = (a.moving && !a.hurt) ? -Math.abs(Math.sin(a.walkCyc)) * 2 : 0; // heavy bob, hurt jolts it flat
    const sw = a.moving ? Math.sin(a.walkCyc) * 3 : 0; // elbow swing
    const tilt = windup ? -0.12 : strike ? 0.15 : 0;   // torso lean about (0,-24)

    // 1. back arm — pipe segments, two-pass stroke (upper-body transform)
    g.save();
    g.translate(0, hb);
    if (tilt) { g.translate(0, -24); g.rotate(tilt); g.translate(0, 24); }
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(-14, -58); g.lineTo(-24 + sw, -42); g.lineTo(-20, -24);
    g.strokeStyle = '#38180a'; g.lineWidth = 13; g.stroke();
    g.strokeStyle = '#6e3a16'; g.lineWidth = 10; g.stroke();
    g.lineCap = 'round';
    g.fillStyle = '#4d2a10'; // elbow flange
    g.beginPath(); g.arc(-24 + sw, -42, 6, 0, 7); g.fill();
    g.strokeStyle = '#38180a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#4d2a10'; // pipe-cap fist
    g.beginPath(); g.arc(-20, -22, 7, 0, 7); g.fill();
    g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#e8c84a';
    g.beginPath(); g.arc(-20, -29.2, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(-26.3, -18.4, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(-13.7, -18.4, 1.1, 0, 7); g.fill();
    g.restore();

    // 2. back leg — planted
    g.fillStyle = '#6e3a16'; g.fillRect(-16, -24, 10, 24);
    g.fillStyle = '#4d2a10'; g.fillRect(-18, -24, 14, 4);
    g.fillRect(-19, -6, 16, 6);
    g.strokeStyle = '#38180a'; g.lineWidth = 2; g.strokeRect(-19, -6, 16, 6);

    // 3-12. torso, head, chimney (upper-body transform)
    g.save();
    g.translate(0, hb);
    if (tilt) { g.translate(0, -24); g.rotate(tilt); g.translate(0, 24); }
    // 3. torso: ink slab then body plate
    g.fillStyle = '#38180a';
    g.beginPath(); g.roundRect(-22, -76, 44, 56, 7); g.fill();
    g.fillStyle = '#b06a32';
    g.beginPath(); g.roundRect(-20, -74, 40, 52, 6); g.fill();
    // 4. plate seams + corrosion streaks
    g.strokeStyle = '#6e3a16'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-20, -58); g.lineTo(20, -58);
    g.moveTo(-20, -40); g.lineTo(20, -40);
    g.moveTo(2, -74); g.lineTo(2, -40);
    g.stroke();
    if (a.hurt) { // plates jolted apart
      g.fillStyle = '#38180a'; g.fillRect(-20, -57, 40, 2.5);
    }
    g.fillStyle = '#6e3a16'; g.globalAlpha = 0.7;
    g.fillRect(6, -54, 3, 12); g.fillRect(-12, -38, 3, 10);
    g.globalAlpha = 1;
    // 5. key light bevels + rim
    g.fillStyle = '#d18f4a';
    g.fillRect(-20, -74, 40, 4); g.fillRect(-20, -74, 4, 22);
    g.strokeStyle = '#f0b370'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-20, -73); g.lineTo(-4, -73); g.stroke();
    // 6. teal patina
    g.fillStyle = '#3a8a72'; g.globalAlpha = 0.85;
    g.beginPath(); g.ellipse(-13, -66, 5, 3.5, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(12, -30, 4, 3, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    // 7. rivets (under-shadow first, then brass)
    g.fillStyle = '#6e3a16';
    for (let i = 0; i < 12; i += 2) {
      g.beginPath(); g.arc(GRIV[i] + 0.7, GRIV[i + 1] + 0.7, 1.8, 0, 7); g.fill();
    }
    g.fillStyle = '#e8c84a';
    for (let i = 0; i < 12; i += 2) {
      g.beginPath(); g.arc(GRIV[i], GRIV[i + 1], 1.8, 0, 7); g.fill();
    }
    // 8. shoulder boilers
    g.fillStyle = '#6e3a16'; g.strokeStyle = '#38180a'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-27, -66, 11, 13, 3); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(16, -66, 11, 13, 3); g.fill(); g.stroke();
    g.fillStyle = '#d18f4a';
    g.fillRect(-27, -66, 11, 2); g.fillRect(16, -66, 11, 2);
    // 9. boiler-dome head
    g.fillStyle = '#38180a';
    g.beginPath(); g.roundRect(-13, -92, 28, 20, HEAD_RO); g.fill();
    g.fillStyle = '#b06a32';
    g.beginPath(); g.roundRect(-11, -90, 24, 18, HEAD_RI); g.fill();
    g.strokeStyle = '#f0b370'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-2, -84, 9, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
    // 10. furnace grate mouth with flickering slits
    g.fillStyle = '#38180a'; g.fillRect(-6, -79, 15, 5);
    g.fillStyle = '#ff8a3c'; g.globalAlpha = 0.7 + 0.3 * Math.sin(a.animT * 13);
    g.fillRect(-4, -78, 2, 3); g.fillRect(0, -78, 2, 3); g.fillRect(4, -78, 2, 3);
    g.globalAlpha = 1;
    // 11. THE eye (windup swaps it to rage orange — the telegraph)
    const eyeCol = windup ? '#ff6a3c' : '#4ae8b2';
    const coreR = windup ? 4 : 3 * (1 + 0.15 * Math.sin(a.animT * 9));
    g.fillStyle = eyeCol; g.globalAlpha = 0.35;
    g.beginPath(); g.arc(5, -85, 6, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.beginPath(); g.arc(5, -85, coreR, 0, 7); g.fill();
    g.fillStyle = '#d8fff0';
    g.beginPath(); g.arc(5, -85, 1.4, 0, 7); g.fill();
    // 12. chimney + steam puff(s)
    g.fillStyle = '#4d2a10'; g.fillRect(-9, -96, 6, 6);
    g.fillStyle = '#6e3a16'; g.fillRect(-10, -97, 8, 2);
    const p = (a.animT * 0.7) % 1;
    g.fillStyle = '#cfe8dc'; g.globalAlpha = 0.3 * (1 - p);
    g.beginPath(); g.arc(-6, -99 - p * 10, 2 + p * 3, 0, 7); g.fill();
    if (windup) {
      const p2 = (p + 0.5) % 1;
      g.globalAlpha = 0.3 * (1 - p2);
      g.beginPath(); g.arc(-6, -99 - p2 * 10, 2 + p2 * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    g.restore();

    // 13. front leg — planted
    g.fillStyle = '#b06a32'; g.fillRect(5, -24, 11, 24);
    g.fillStyle = '#e8c84a';
    g.beginPath(); g.arc(10, -20, 1.5, 0, 7); g.fill();
    g.fillStyle = '#4d2a10'; g.fillRect(3, -6, 17, 6);
    g.strokeStyle = '#38180a'; g.lineWidth = 2; g.strokeRect(3, -6, 17, 6);

    // 14. front arm — posed by state, drawn over everything
    let ex2, ey2, hx, hy;
    if (windup) { ex2 = 28; ey2 = -66; hx = 18; hy = -78; }        // raised overhead
    else if (strike) { ex2 = 30; ey2 = -40; hx = 34; hy = -16; }   // slammed down-forward
    else { ex2 = 26 + sw; ey2 = -44; hx = 24; hy = -24; }          // approach swing
    g.save();
    g.translate(0, hb);
    if (tilt) { g.translate(0, -24); g.rotate(tilt); g.translate(0, 24); }
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(14, -58); g.lineTo(ex2, ey2); g.lineTo(hx, hy);
    g.strokeStyle = '#38180a'; g.lineWidth = 13; g.stroke();
    g.strokeStyle = '#b06a32'; g.lineWidth = 10; g.stroke();
    g.lineCap = 'round';
    g.fillStyle = '#d18f4a'; // elbow flange
    g.beginPath(); g.arc(ex2, ey2, 6, 0, 7); g.fill();
    g.strokeStyle = '#38180a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#4d2a10'; // pipe-cap fist
    g.beginPath(); g.arc(hx, hy, 8, 0, 7); g.fill();
    g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#e8c84a'; // four lug rivets N/E/S/W
    g.beginPath(); g.arc(hx, hy - 8, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 8, hy, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(hx, hy + 8, 1.2, 0, 7); g.fill();
    g.beginPath(); g.arc(hx - 8, hy, 1.2, 0, 7); g.fill();
    g.restore();
  };

  // ============================================================
  // SHOOTER — GREASE SPITTER: grumpy fat toad leaking yellow
  // ============================================================
  B.grease = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const br = 1 + 0.05 * Math.sin(a.animT * 2.2); // belly breath
    g.rotate(Math.sin(a.walkCyc) * 0.05);          // waddle lean

    // 1. back haunch + webbed foot
    g.fillStyle = '#2a2a1c';
    g.beginPath(); g.ellipse(-15, -14, 12, 10, 0, 0, 7); g.fill();
    g.strokeStyle = '#16160c'; g.lineWidth = 2.5; g.stroke();
    g.lineWidth = 1.5;
    tri(g, -24, 0, -20, -5, -17, 0, true);
    tri(g, -17, 0, -13, -5, -10, 0, true);
    tri(g, -10, 0, -7, -4, -5, 0, true);

    // 2. pear body: outline then fill on the same path
    g.beginPath();
    g.moveTo(-24, -4);
    g.quadraticCurveTo(-32, -30, -18, -50);
    g.quadraticCurveTo(-6, -66, 8, -62);
    g.quadraticCurveTo(22, -56, 26, -40);
    g.quadraticCurveTo(30, -18, 20, -4);
    g.closePath();
    g.strokeStyle = '#16160c'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#4a4a30'; g.fill();

    // 3. shading + warts, clipped to the body
    g.save();
    g.clip();
    g.fillStyle = '#2a2a1c';
    g.beginPath(); g.ellipse(16, -18, 14, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#6e7048';
    g.beginPath(); g.ellipse(-10, -48, 12, 14, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a8c5e'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-6, -52, 16, Math.PI * 1.05, Math.PI * 1.5); g.stroke();
    for (let i = 0; i < 8; i += 2) {
      g.fillStyle = '#2a2a1c';
      g.beginPath(); g.arc(WARTS[i], WARTS[i + 1], 1.4, 0, 7); g.fill();
      g.fillStyle = '#6e7048';
      g.beginPath(); g.arc(WARTS[i] - 0.5, WARTS[i + 1] - 0.5, 0.6, 0, 7); g.fill();
    }
    g.restore();

    // 4. pot belly dome
    g.fillStyle = '#d8cfa0';
    g.beginPath(); g.ellipse(4, -22, 16, 14 * br, 0, 0, 7); g.fill();
    g.strokeStyle = '#b0a878'; g.lineWidth = 2;
    g.beginPath(); g.arc(4, -22, 13 * br, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-8, -16); g.quadraticCurveTo(2, -14, 12, -16); g.stroke();
    g.beginPath(); g.moveTo(-5, -10); g.quadraticCurveTo(2, -8.5, 9, -10); g.stroke();

    // 5. eye domes on top (far then near)
    g.fillStyle = '#4a4a30';
    g.beginPath(); g.arc(0, -64, 5.5, 0, 7); g.fill();
    g.strokeStyle = '#16160c'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffd34a';
    g.beginPath(); g.arc(0, -65, 3.2, 0, 7); g.fill();
    g.fillStyle = '#16160c'; g.fillRect(-0.6, -68, 1.2, 5.5);
    g.fillStyle = '#fff8d8';
    g.beginPath(); g.arc(-1.2, -66.5, 0.8, 0, 7); g.fill();
    g.fillStyle = '#4a4a30';
    g.beginPath(); g.arc(12, -62, 6.5, 0, 7); g.fill();
    g.strokeStyle = '#16160c'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffd34a';
    g.beginPath(); g.arc(12, -63, 3.8, 0, 7); g.fill();
    g.fillStyle = '#16160c'; g.fillRect(11.4, -66.5, 1.2, 6.5);
    g.fillStyle = '#fff8d8';
    g.beginPath(); g.arc(10.6, -64.5, 0.8, 0, 7); g.fill();
    if (a.hurt) {
      // eyes X'd
      g.strokeStyle = '#16160c'; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-1.25, -66.25); g.lineTo(1.25, -63.75);
      g.moveTo(1.25, -66.25); g.lineTo(-1.25, -63.75);
      g.moveTo(10.75, -64.25); g.lineTo(13.25, -61.75);
      g.moveTo(13.25, -64.25); g.lineTo(10.75, -61.75);
      g.stroke();
    } else {
      // lids: half-shut squeeze on windup, quick blink otherwise
      const lid = windup ? 0.5 : (Math.sin(a.animT * 1.3 + 2) > 0.98 ? 0.7 : 0);
      if (lid > 0) {
        g.fillStyle = '#4a4a30';
        const lo = (lid - 0.5) * 2; // 0 at half, ~0.4 at 70%
        g.beginPath(); g.arc(0, -65 + lo * 3.2 * 0.8, 3.6, Math.PI, Math.PI * 2); g.closePath(); g.fill();
        g.beginPath(); g.arc(12, -63 + lo * 3.8 * 0.8, 4.2, Math.PI, Math.PI * 2); g.closePath(); g.fill();
      }
    }

    // 6. the wide downturned mouth (wavy squiggle when hurt)
    g.strokeStyle = '#16160c'; g.lineWidth = 2.5;
    if (a.hurt) {
      g.beginPath();
      g.moveTo(-10, -44);
      g.quadraticCurveTo(-5, -40, 0, -43);
      g.quadraticCurveTo(5, -46, 12, -41);
      g.quadraticCurveTo(20, -45, 26, -42);
      g.stroke();
    } else {
      g.beginPath(); g.moveTo(-10, -44); g.quadraticCurveTo(8, -36, 26, -42); g.stroke();
      g.strokeStyle = '#6e7048'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-10, -46); g.quadraticCurveTo(8, -38, 26, -44); g.stroke();
    }

    // 7. grease pooling and dripping at the lip
    g.fillStyle = '#e8c84a';
    g.beginPath();
    g.moveTo(2, -40);
    g.quadraticCurveTo(10, -35, 18, -38);
    g.quadraticCurveTo(24, -40, 25, -42);
    g.lineTo(2, -40);
    g.closePath(); g.fill();
    tri(g, 6.8, -36, 9.2, -36, 8, -28);   // hanging drips
    tri(g, 15.9, -37, 18.1, -37, 17, -31);
    const dy = (a.animT * 40) % 24;
    g.globalAlpha = 1 - dy / 24;
    g.beginPath(); g.arc(8, -28 + dy, 1.5, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = '#a8842a'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(3, -39); g.quadraticCurveTo(11, -34.5, 19, -37.5); g.stroke();
    g.fillStyle = '#f6e08a';
    g.beginPath(); g.arc(5, -39, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(15, -38, 1, 0, 7); g.fill();

    // 8. bubbles at the mouth corner
    for (let i = 0; i < 3; i++) {
      const b = (a.animT * 0.8 + i * 0.37) % 1;
      const bx = 22 + i * 2.5, byy = -42 - b * 11, brr = 1.3 + i * 0.7;
      g.strokeStyle = '#a8842a'; g.lineWidth = 1; g.globalAlpha = (1 - b) * 0.8;
      g.beginPath(); g.arc(bx, byy, brr, 0, 7); g.stroke();
      g.fillStyle = '#e8c84a'; g.globalAlpha = (1 - b) * 0.35;
      g.fill();
    }
    g.globalAlpha = 1;

    // 9. nostrils
    g.fillStyle = '#16160c';
    g.beginPath(); g.arc(19, -50, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(22, -49, 0.9, 0, 7); g.fill();

    // 10. front stub arm + finger nubs
    g.beginPath(); g.moveTo(14, -22); g.lineTo(19, -6);
    g.strokeStyle = '#16160c'; g.lineWidth = 6.5; g.stroke();
    g.strokeStyle = '#4a4a30'; g.lineWidth = 4.5; g.stroke();
    g.fillStyle = '#4a4a30';
    g.beginPath(); g.arc(18, -3, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(21, -4, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(23, -6, 1.6, 0, 7); g.fill();

    // 11. windup: throat sac inflates — the ranged telegraph
    if (windup && !a.hurt) {
      const k = 0.7 + 0.3 * Math.sin(a.animT * 9); // throb near full (no stateT here)
      g.fillStyle = '#d8cfa0';
      g.beginPath(); g.ellipse(12, -38, 4 + 9 * k, 3 + 8 * k, 0, 0, 7); g.fill();
      g.strokeStyle = '#b0a878'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#2a1c10';
      g.beginPath(); g.ellipse(18, -44, 3 + 5 * k, 2 + 4 * k, 0, 0, 7); g.fill();
      g.fillStyle = '#e8c84a';
      g.beginPath(); g.ellipse(18, -41, 3 + 4 * k, 1.5, 0, 0, 7); g.fill();
    }

    // 12. strike: mouth thrown wide + spray flecks
    if (strike) {
      g.fillStyle = '#2a1c10';
      g.beginPath(); g.ellipse(19, -44, 9, 7, 0, 0, 7); g.fill();
      g.strokeStyle = '#e8c84a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#e8c84a'; g.globalAlpha = 0.85;
      g.beginPath(); g.arc(28, -46, 1.3, 0, 7); g.fill();
      g.beginPath(); g.arc(32, -42, 1.1, 0, 7); g.fill();
      g.beginPath(); g.arc(29, -38, 1.2, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
  };

  // ============================================================
  // BOSS — THE WATER HEATER: fidelity upgrade in the old footprint
  // ============================================================
  BOSS.heater = function (g, e, t) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const rage = 1 - e.hp / e.maxHp;
    const hot = e.state === 'windup' || rage > 0.7; // windup effects go permanent below 30% hp

    // 1. feet stubs + bolt flanges
    g.fillStyle = '#2a1408';
    g.fillRect(-16, -8, 7, 8); g.fillRect(9, -8, 7, 8);
    g.fillStyle = '#5a6472';
    g.fillRect(-18, -2, 11, 3); g.fillRect(7, -2, 11, 3);

    // 2-3. ink silhouette + tank body (hitbox rect untouched)
    g.fillStyle = '#38180a';
    g.beginPath(); g.roundRect(-23, -86, 46, 82, 11); g.fill();
    g.fillStyle = e.def.color;
    g.beginPath(); g.roundRect(-21, -84, 42, 78, 10); g.fill();

    // 4. cylinder ramp: vertical bands make the tank round
    g.fillStyle = '#d18f4a'; g.fillRect(-18, -82, 7, 74);
    g.strokeStyle = '#f0b370'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-19, -80); g.lineTo(-19, -12); g.stroke();
    g.fillStyle = '#6e3a16'; g.fillRect(8, -82, 12, 74);
    g.fillStyle = '#4d2a10'; g.fillRect(16, -82, 4, 74);

    // 5. riveted weld bands
    for (let bi = 0; bi < 2; bi++) {
      const y = BAND_YS[bi];
      g.fillStyle = '#8a4a20'; g.fillRect(-21, y, 42, 6);
      g.fillStyle = '#d18f4a'; g.fillRect(-21, y, 42, 1.5);
      g.fillStyle = '#38180a'; g.fillRect(-21, y + 6, 42, 1.5);
      g.fillStyle = '#6e3a16';
      for (let i = 0; i < 5; i++) {
        g.beginPath(); g.arc(RIVX[i] + 0.7, y + 3.7, 1.6, 0, 7); g.fill();
      }
      g.fillStyle = '#e8c84a';
      for (let i = 0; i < 5; i++) {
        g.beginPath(); g.arc(RIVX[i], y + 3, 1.6, 0, 7); g.fill();
      }
    }

    // 6. rust streaks + teal patina
    g.fillStyle = 'rgba(77,42,16,0.7)';
    g.fillRect(-12, -58, 3, 20); g.fillRect(6, -28, 3, 16);
    g.fillStyle = 'rgba(77,42,16,0.5)';
    g.fillRect(1, -58, 2, 8);
    g.fillStyle = '#3a8a72'; g.globalAlpha = 0.8;
    g.beginPath(); g.ellipse(14, -70, 4, 3, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-14, -24, 5, 3, 0, 0, 7); g.fill();
    g.globalAlpha = 1;

    // 7. pressure gauge — the needle is a live rage meter
    g.fillStyle = '#38180a';
    g.beginPath(); g.arc(0, -46, 8, 0, 7); g.fill();
    g.strokeStyle = '#5a6472'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, -46, 7, 0, 7); g.stroke();
    g.fillStyle = '#f2ede0';
    g.beginPath(); g.arc(0, -46, 5.5, 0, 7); g.fill();
    g.strokeStyle = '#d43b2f'; g.lineWidth = 2; // red zone, right side of the dial
    g.beginPath(); g.arc(0, -46, 4.5, -0.35, 0.5); g.stroke();
    g.strokeStyle = '#38180a'; g.lineWidth = 1; // ticks at 135 / 90 / 45 degrees
    g.beginPath();
    g.moveTo(-S2 * 3.2, -46 - S2 * 3.2); g.lineTo(-S2 * 5.2, -46 - S2 * 5.2);
    g.moveTo(0, -49.2); g.lineTo(0, -51.2);
    g.moveTo(S2 * 3.2, -46 - S2 * 3.2); g.lineTo(S2 * 5.2, -46 - S2 * 5.2);
    g.stroke();
    const ang = 2.8 - 3.3 * rage + (hot ? Math.sin(t * 17) * 0.07 : 0);
    g.strokeStyle = '#d43b2f'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, -46);
    g.lineTo(Math.cos(ang) * 4.5, -46 - Math.sin(ang) * 4.5);
    g.stroke();
    g.fillStyle = '#38180a';
    g.beginPath(); g.arc(0, -46, 1, 0, 7); g.fill();

    // 8. pilot-light window with a live blue flame
    g.fillStyle = '#5a6472';
    g.beginPath(); g.roundRect(-7, -22, 14, 10, 2); g.fill();
    g.fillStyle = '#16100a'; g.fillRect(-5.5, -20.5, 11, 7);
    const flick = Math.sin(t * 11) * 1.4 + (hot ? 3 : 0);
    g.fillStyle = '#ffb04a'; g.globalAlpha = 0.35;
    g.beginPath(); g.arc(0, -16, 5, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = '#4a86e8';
    g.beginPath();
    g.moveTo(-2.5, -14);
    g.quadraticCurveTo(-2.5, -19 - flick, 0, -21 - flick);
    g.quadraticCurveTo(2.5, -19 - flick, 2.5, -14);
    g.closePath(); g.fill();
    g.fillStyle = '#9fdcff';
    g.beginPath(); g.ellipse(0, -16, 1.2, 2.2 + flick * 0.5, 0, 0, 7); g.fill();

    // 9. warning label
    g.fillStyle = '#e8c84a'; g.fillRect(10, -54, 8, 11);
    g.fillStyle = '#38180a';
    g.fillRect(11, -51, 6, 1.5); g.fillRect(11, -48, 4, 1.5);
    g.strokeStyle = '#38180a'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(14, -44); g.lineTo(12, -41); g.lineTo(16, -41);
    g.closePath(); g.stroke();

    // 10. top fittings: chimney, valve wheel, copper relief pipe + hot drip
    g.fillStyle = '#6a7288'; g.fillRect(-4, -94, 8, 10);
    g.fillStyle = '#8d9aa8'; g.fillRect(-6, -95, 12, 3);
    g.beginPath(); g.arc(0, -97, 6, 0, 7);
    g.strokeStyle = '#38180a'; g.lineWidth = 4.5; g.stroke();
    g.strokeStyle = '#c87a3a'; g.lineWidth = 3; g.stroke();
    g.lineWidth = 2; // spokes at 0/60/120 degrees
    g.beginPath();
    g.moveTo(-6, -97); g.lineTo(6, -97);
    g.moveTo(-3, -102.2); g.lineTo(3, -91.8);
    g.moveTo(-3, -91.8); g.lineTo(3, -102.2);
    g.stroke();
    g.fillStyle = '#38180a';
    g.beginPath(); g.arc(0, -97, 1.5, 0, 7); g.fill();
    g.strokeStyle = '#c87a3a'; g.lineWidth = 3.5; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(4, -88); g.lineTo(15, -88); g.lineTo(15, -80); g.stroke();
    g.lineCap = 'round';
    const dd = (t * 30) % 10;
    g.fillStyle = '#4ae8b2'; g.globalAlpha = 0.7 * (1 - dd / 10);
    g.beginPath(); g.arc(15, -79 + dd, 1.2, 0, 7); g.fill();
    g.globalAlpha = 1;

    // 11. steam vents + phase-offset puffs (doubled when hot)
    g.fillStyle = '#5a6472';
    g.fillRect(-23, -78, 4, 6); g.fillRect(19, -78, 4, 6);
    g.fillStyle = '#dce8e4';
    for (let side = -1; side <= 1; side += 2) {
      const p = (t * 0.9 + (side + 1) * 0.25) % 1;
      g.globalAlpha = 0.35 * (1 - p);
      g.beginPath(); g.arc(side * 25 + side * p * 7, -80 - p * 9, 2 + p * 3.5, 0, 7); g.fill();
      if (hot) {
        const p2 = (p + 0.5) % 1;
        g.globalAlpha = 0.35 * (1 - p2);
        g.beginPath(); g.arc(side * 25 + side * p2 * 7, -80 - p2 * 9, 2 + p2 * 3.5, 0, 7); g.fill();
      }
    }
    g.globalAlpha = 1;

    // 12. face — same anchors as before, now inked and tracking the player
    g.fillStyle = hot ? '#ffd8c0' : '#ffffff'; // flushed when the pressure's up
    g.fillRect(-13, -74, 9, 5); g.fillRect(4, -74, 9, 5);
    g.strokeStyle = '#38180a'; g.lineWidth = 1;
    g.strokeRect(-13, -74, 9, 5); g.strokeRect(4, -74, 9, 5);
    g.fillStyle = '#1d1d24'; // pupils shifted +1 toward facing
    g.fillRect(-9, -73, 4, 3.5); g.fillRect(8, -73, 4, 3.5);
    g.strokeStyle = '#38180a'; g.lineWidth = 3; // angry brows
    g.beginPath();
    g.moveTo(-14, -80); g.lineTo(-4, -77);
    g.moveTo(14, -80); g.lineTo(4, -77);
    g.stroke();
    g.strokeStyle = '#d18f4a'; g.lineWidth = 1; // brow highlight
    g.beginPath();
    g.moveTo(-14, -81.5); g.lineTo(-4, -78.5);
    g.moveTo(14, -81.5); g.lineTo(4, -78.5);
    g.stroke();
  };
})();
