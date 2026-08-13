// skins-fantasy.js — twilight-realm enemy bodies + shadow dragon boss
// Contract: B.<key>(g, a) draws in local feet-space (caller did translate/shadow/scale);
// BOSS.<key>(g, e, t) same, using e.state/e.walkCyc. No shadows, no flash/frozen overlays here.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // ---- hoisted palettes (module init only — never build strings per frame) ----
  // skeleton
  const SK_HI = '#f4efe0', SK_BONE = '#d8d4c8', SK_SH = '#a29b88';
  const SK_GLOW = '#8be8d2', SK_OUT = '#4a4438', SK_CAVITY = '#2a2620';
  // imp
  const IM_HI = '#f08a52', IM_RED = '#d4503a', IM_SH = '#9c2f22', IM_MEM = '#6e1f12';
  const IM_HOOF = '#4d1408', IM_HORN = '#e8d9b0', IM_GLOW = '#ffd24a', IM_OUT = '#38100a';
  const IM_TOOTH = '#ffe8c8';
  // ogre
  const OG_HI = '#86b35c', OG_SKIN = '#5f8a3a', OG_BELLY = '#a8c576', OG_SH = '#3f6425';
  const OG_DEEP = '#243a12', OG_CLOTH = '#7a5230', OG_PATCH = '#a8763f', OG_STITCH = '#3d2812';
  const OG_WOOD = '#8a6238', OG_WOODDK = '#553c1e', OG_STUD = '#8d949e', OG_TUSK = '#e8dfc0';
  const OG_OUT = '#16260a', OG_SWEAT = '#cfe8ff';
  // mage
  const MG_HI = '#a97ef5', MG_ROBE = '#7a4ae8', MG_SH = '#5630b0', MG_DEEP = '#2c1460';
  const MG_VOID = '#150a2e', MG_EYE = '#f062ff', MG_RUNE = '#c24ae8', MG_TRIM = '#cfd2ff';
  const MG_OUT = '#1d0d42';
  // shadow dragon
  const DR_BODY = '#8a4ae8', DR_SH = '#5c2ba8', DR_DK = '#3a1878', DR_DEEP = '#2c1460';
  const DR_OUT = '#22104a', DR_BELLY = '#b493f0', DR_HI = '#a678f2', DR_HORN = '#e8d9b0';
  const DR_CRACK = '#ff5af0', DR_CORE = '#ffd6ff', DR_EMBER = '#c24ae8', DR_TOOTH = '#efe6ff';
  const DR_SMOKE = '#281042';

  // ---- module-scope helpers (plain fns: zero per-frame closure allocs) ----
  // skeleton bone segment: outline under-pass, bone core, joint knob at the far end
  function boneLimb(g, ax, ay, bx, by, wd) {
    g.strokeStyle = SK_OUT; g.lineWidth = wd + 2.6;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.strokeStyle = SK_BONE; g.lineWidth = wd;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.fillStyle = SK_HI;
    g.beginPath(); g.arc(bx, by, wd * 0.55, 0, 7); g.fill();
  }
  function limb2(g, col, wid, x1, y1, x2, y2) {
    g.strokeStyle = col; g.lineWidth = wid;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  function limb3(g, col, wid, x1, y1, x2, y2, x3, y3) {
    g.strokeStyle = col; g.lineWidth = wid;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.stroke();
  }
  // ogre club head (fill+outline, grain arcs, iron studs) rotated about its center
  function clubHead(g, cx, cy, rot) {
    g.save(); g.translate(cx, cy); g.rotate(rot);
    g.fillStyle = OG_WOOD;
    g.beginPath(); g.ellipse(0, 0, 8.5, 11, 0, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.ellipse(0, 0, 8.5, 11, 0, 0, 7); g.stroke();
    g.strokeStyle = OG_WOODDK; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0, -1, 3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    g.beginPath(); g.arc(0, 1, 5.2, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    g.fillStyle = OG_STUD;
    g.beginPath(); g.arc(-2, -6, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(3, 2, 1.6, 0, 7); g.fill();
    g.restore();
  }
  // imp claw: three short outline fingers fanning from the hand toward (dx,dy)
  function claw(g, hx, hy, dx, dy) {
    g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + dx - dy * 0.6, hy + dy + dx * 0.6); g.stroke();
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + dx * 1.15, hy + dy * 1.15); g.stroke();
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + dx + dy * 0.6, hy + dy - dx * 0.6); g.stroke();
  }
  function runeDiamond(g, rx, ry) {
    g.beginPath();
    g.moveTo(rx, ry - 3); g.lineTo(rx + 2.4, ry); g.lineTo(rx, ry + 3); g.lineTo(rx - 2.4, ry);
    g.closePath(); g.fill();
  }

  // ============================================================ SKELETON (grunt)
  B.skeleton = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc;
    const moving = a.moving, hurt = a.hurt;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const rat = moving ? Math.sin(t * 22) * 0.7 : 0; // bone rattle jitter
    const legS = moving ? Math.sin(w) * 6 : 0;
    const lx = hurt ? -3 : 0; // upper-body recoil lean (everything above the pelvis)

    // 1. back arm
    let bhx, bhy;
    if (windup) {
      boneLimb(g, -6 + lx, -62, -14 + lx, -70, 3.4);
      boneLimb(g, -14 + lx, -70, -6 + lx, -84, 3.0);
      bhx = -6 + lx; bhy = -84;
    } else {
      boneLimb(g, -6 + lx, -62, -12 + lx, -52 + rat, 3.4);
      boneLimb(g, -12 + lx, -52 + rat, -8 + lx, -44 + rat, 3.0);
      bhx = -8 + lx; bhy = -44 + rat;
    }

    // 2. back leg
    boneLimb(g, -5, -36, -7 - legS, -18, 3.8);
    boneLimb(g, -7 - legS, -18, -9 - legS * 2, 0, 3.8);

    // 3. pelvis
    g.fillStyle = SK_SH;
    g.beginPath(); g.roundRect(-8, -40, 16, 7, 3); g.fill();
    g.strokeStyle = SK_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(-8, -40, 16, 7, 3); g.stroke();
    g.fillStyle = SK_OUT; g.fillRect(-1.5, -36, 3, 3); // sacrum gap

    // 4. spine + vertebra ticks
    g.strokeStyle = SK_BONE; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -40); g.lineTo(2 + lx, -58); g.stroke();
    g.strokeStyle = SK_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-1.6 + lx, -44); g.lineTo(2.4 + lx, -44); g.stroke();
    g.beginPath(); g.moveTo(-1 + lx, -49); g.lineTo(3 + lx, -49); g.stroke();
    g.beginPath(); g.moveTo(-0.4 + lx, -54); g.lineTo(3.6 + lx, -54); g.stroke();

    // 5. rib cavity
    g.fillStyle = SK_CAVITY;
    g.beginPath(); g.ellipse(1 + lx, -56, 8.5, 9.5, 0, 0, 7); g.fill();

    // 6. ribs (downward bows) + clavicle + sternum
    g.strokeStyle = SK_HI; g.lineWidth = 2.2;
    g.beginPath(); g.arc(1 + lx, -63, 8.5, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.beginPath(); g.arc(1 + lx, -57.5, 7.8, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.beginPath(); g.arc(1 + lx, -52, 7.1, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.strokeStyle = SK_BONE; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-6 + lx, -63); g.lineTo(10 + lx, -63); g.stroke();
    g.fillStyle = SK_BONE; g.fillRect(0 + lx, -62, 2.4, 10);

    // 7. front leg
    boneLimb(g, 5, -36, 7 + legS, -18, 3.8);
    boneLimb(g, 7 + legS, -18, 9 + legS * 2, moving ? -Math.max(0, Math.sin(w)) * 4 : 0, 3.8);

    // 8. front arm (guard / cocked claw / rake)
    let fhx, fhy;
    if (strike) {
      boneLimb(g, 10 + lx, -62, 20 + lx, -58, 3.4);
      boneLimb(g, 20 + lx, -58, 32 + lx, -54, 3.0);
      fhx = 32 + lx; fhy = -54;
      g.strokeStyle = SK_OUT; g.lineWidth = 1.4; // finger rake
      g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(36 + lx, -57); g.stroke();
      g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(37 + lx, -54); g.stroke();
      g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(36 + lx, -51); g.stroke();
    } else if (windup) {
      boneLimb(g, 10 + lx, -62, 8 + lx, -74, 3.4);
      boneLimb(g, 8 + lx, -74, 0 + lx, -86, 3.0);
      fhx = 0 + lx; fhy = -86;
    } else {
      boneLimb(g, 10 + lx, -62, 16 + lx, -52 + rat, 3.4);
      boneLimb(g, 16 + lx, -52 + rat, 18 + lx, -46 + rat, 3.0);
      fhx = 18 + lx; fhy = -46 + rat;
    }

    // 9. hands
    g.fillStyle = SK_BONE;
    g.beginPath(); g.arc(bhx, bhy, 3, 0, 7); g.fill();
    g.beginPath(); g.arc(fhx, fhy, 3, 0, 7); g.fill();

    // 10. skull — floats a dark 2-unit gap above the clavicle (sells 'undead')
    g.fillStyle = SK_BONE;
    g.beginPath(); g.arc(3 + lx, -84, 9.5, 0, 7); g.fill();
    g.strokeStyle = SK_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.arc(3 + lx, -84, 9.5, 0, 7); g.stroke();
    g.fillStyle = SK_HI; // crescent key light
    g.beginPath(); g.arc(0.5 + lx, -86.5, 5.5, 0, 7); g.fill();
    g.fillStyle = SK_BONE;
    g.beginPath(); g.arc(2.5 + lx, -85.5, 5, 0, 7); g.fill();
    g.fillStyle = SK_SH; g.fillRect(8 + lx, -83, 4, 3); // cheekbone

    // 11. eye sockets + soul-flame pupils
    g.fillStyle = SK_OUT;
    g.beginPath(); g.ellipse(0 + lx, -84, 3, 3.4, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(8 + lx, -84, 3, 3.4, 0, 0, 7); g.fill();
    g.fillStyle = SK_GLOW;
    g.beginPath(); g.arc(0 + lx, -84, 1.3, 0, 7); g.fill();
    g.beginPath(); g.arc(8 + lx, -84, 1.3, 0, 7); g.fill();
    if (windup) { // eye glow doubles: the telegraph
      g.globalAlpha = 0.4;
      g.beginPath(); g.arc(0 + lx, -84, 2.8, 0, 7); g.fill();
      g.beginPath(); g.arc(8 + lx, -84, 2.8, 0, 7); g.fill();
      g.globalAlpha = 1;
    }

    // 12. nasal
    g.fillStyle = SK_OUT;
    g.beginPath();
    g.moveTo(4 + lx, -80); g.lineTo(5.5 + lx, -77.5); g.lineTo(2.5 + lx, -77.5);
    g.closePath(); g.fill();

    // 13. loose rattling jaw
    const jd = (windup ? 3 : hurt ? 5 : 1 + Math.sin(t * 2.6)) + rat;
    g.fillStyle = SK_BONE;
    g.beginPath(); g.roundRect(-2 + lx, -77 + jd, 12, 4.5, 2); g.fill();
    g.strokeStyle = SK_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(-2 + lx, -77 + jd, 12, 4.5, 2); g.stroke();
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(1 + lx, -77 + jd); g.lineTo(1 + lx, -74.6 + jd); g.stroke();
    g.beginPath(); g.moveTo(4 + lx, -77 + jd); g.lineTo(4 + lx, -74.6 + jd); g.stroke();
    g.beginPath(); g.moveTo(7 + lx, -77 + jd); g.lineTo(7 + lx, -74.6 + jd); g.stroke();
  };

  // ============================================================ IMP (stinger)
  B.imp = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, hurt = a.hurt;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const flap = Math.sin(t * 11) * 6;
    const sway = Math.sin(t * 3.2) * 5;
    const pulse = Math.sin(t * 6) * 0.6;

    // 1. far wing
    g.strokeStyle = IM_SH; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(-6, -62); g.lineTo(-18, -76 - flap); g.stroke();
    g.fillStyle = IM_MEM;
    g.beginPath();
    g.moveTo(-6, -62); g.lineTo(-18, -76 - flap);
    g.quadraticCurveTo(-24, -60 - flap * 0.5, -20, -48);
    g.quadraticCurveTo(-12, -52, -6, -56);
    g.closePath(); g.fill();
    g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-18, -76 - flap); g.lineTo(-20, -50); g.stroke();

    // 2. tail — lazy curl, or the scorpion snap overhead (the stinger telegraph)
    g.strokeStyle = IM_SH; g.lineWidth = 3.2;
    if (windup) {
      g.beginPath(); g.moveTo(-6, -30); g.quadraticCurveTo(-20, -62, -8, -76); g.stroke();
      g.fillStyle = IM_SH;
      g.beginPath(); g.moveTo(-8, -82); g.lineTo(-2, -74); g.lineTo(-14, -74); g.closePath(); g.fill();
      g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-8, -82); g.lineTo(-2, -74); g.lineTo(-14, -74); g.closePath(); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-6, -30); g.quadraticCurveTo(-22, -22 + sway, -26, -40 + sway); g.stroke();
      g.fillStyle = IM_SH;
      g.beginPath();
      g.moveTo(-26, -46 + sway); g.lineTo(-32, -36 + sway); g.lineTo(-20, -36 + sway);
      g.closePath(); g.fill();
      g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-26, -46 + sway); g.lineTo(-32, -36 + sway); g.lineTo(-20, -36 + sway);
      g.closePath(); g.stroke();
    }

    // 3. back leg + hoof
    limb3(g, IM_OUT, 6.4, -4, -26, -9, -14, -6, -5);
    limb3(g, IM_RED, 4, -4, -26, -9, -14, -6, -5);
    g.fillStyle = IM_HOOF;
    g.beginPath(); g.roundRect(-10, -4, 7, 4, 1.5); g.fill();

    // 4. torso pear + belly + ember core
    g.fillStyle = IM_RED;
    g.beginPath(); g.ellipse(0, -40, 11, 15, 0, 0, 7); g.fill();
    g.strokeStyle = IM_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(0, -40, 11, 15, 0, 0, 7); g.stroke();
    g.fillStyle = IM_HI;
    g.beginPath(); g.ellipse(2, -36, 6.5, 9, 0, 0, 7); g.fill();
    g.fillStyle = IM_GLOW;
    g.beginPath(); g.arc(2, -36, 2.6 + pulse, 0, 7); g.fill();

    // 5. front leg + hoof
    limb3(g, IM_OUT, 6.4, 4, -26, 9, -14, 6, -5);
    limb3(g, IM_RED, 4, 4, -26, 9, -14, 6, -5);
    g.fillStyle = IM_HOOF;
    g.beginPath(); g.roundRect(2, -4, 7, 4, 1.5); g.fill();

    // 6. near wing (over torso, under head)
    g.strokeStyle = IM_SH; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(2, -60); g.lineTo(14, -72 + flap); g.stroke();
    g.fillStyle = IM_MEM;
    g.beginPath();
    g.moveTo(2, -60); g.lineTo(14, -72 + flap);
    g.quadraticCurveTo(20, -56, 16, -46);
    g.quadraticCurveTo(8, -50, 2, -54);
    g.closePath(); g.fill();
    g.strokeStyle = IM_HI; g.lineWidth = 1.4; // rim light on the top bone
    g.beginPath(); g.moveTo(2, -60); g.lineTo(14, -72 + flap); g.stroke();

    // 7. arms
    if (windup) { // hands rise with the tail curl
      limb2(g, IM_OUT, 5.4, -5, -50, 2, -58); limb2(g, IM_RED, 3.2, -5, -50, 2, -58);
      limb2(g, IM_OUT, 5.4, 7, -50, 10, -56); limb2(g, IM_RED, 3.2, 7, -50, 10, -56);
      claw(g, 2, -58, -1, -3);
      claw(g, 10, -56, 1, -3);
    } else if (strike) {
      limb2(g, IM_OUT, 5.4, -5, -50, -10, -40); limb2(g, IM_RED, 3.2, -5, -50, -10, -40);
      claw(g, -10, -40, -1, 3);
      limb2(g, IM_OUT, 5.4, 7, -50, 22, -44); limb2(g, IM_RED, 3.2, 7, -50, 22, -44);
      claw(g, 22, -44, 3, 1);
      g.strokeStyle = IM_HI; g.lineWidth = 1.6; // slash streaks
      g.beginPath(); g.moveTo(16, -51); g.lineTo(26, -43); g.stroke();
      g.beginPath(); g.moveTo(16, -48); g.lineTo(26, -40); g.stroke();
      g.beginPath(); g.moveTo(16, -45); g.lineTo(26, -37); g.stroke();
    } else {
      limb2(g, IM_OUT, 5.4, -5, -50, -10, -40); limb2(g, IM_RED, 3.2, -5, -50, -10, -40);
      claw(g, -10, -40, -1, 3);
      limb2(g, IM_OUT, 5.4, 7, -50, 14, -40); limb2(g, IM_RED, 3.2, 7, -50, 14, -40);
      claw(g, 14, -40, 1, 3);
    }

    // 8. head + ears
    g.fillStyle = IM_RED;
    g.beginPath(); g.arc(3, -72, 11, 0, 7); g.fill();
    g.strokeStyle = IM_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.arc(3, -72, 11, 0, 7); g.stroke();
    g.fillStyle = IM_RED;
    g.beginPath(); g.moveTo(-6, -74); g.lineTo(-13, -78); g.lineTo(-5, -69); g.closePath(); g.fill();
    g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-6, -74); g.lineTo(-13, -78); g.lineTo(-5, -69); g.closePath(); g.stroke();
    g.fillStyle = IM_RED;
    g.beginPath(); g.moveTo(11, -75); g.lineTo(17, -80); g.lineTo(10, -70); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(11, -75); g.lineTo(17, -80); g.lineTo(10, -70); g.closePath(); g.stroke();

    // 9. horns
    g.fillStyle = IM_HORN;
    g.beginPath(); g.moveTo(-3, -80); g.lineTo(-7, -92); g.lineTo(1, -82); g.closePath(); g.fill();
    g.strokeStyle = IM_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-3, -80); g.lineTo(-7, -92); g.lineTo(1, -82); g.closePath(); g.stroke();
    g.fillStyle = IM_HORN;
    g.beginPath(); g.moveTo(9, -80); g.lineTo(14, -93); g.lineTo(5, -82); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(9, -80); g.lineTo(14, -93); g.lineTo(5, -82); g.closePath(); g.stroke();

    // 10. crescent key light
    g.fillStyle = IM_HI;
    g.beginPath(); g.arc(-1, -77, 5.5, 0, 7); g.fill();
    g.fillStyle = IM_RED;
    g.beginPath(); g.arc(1, -76, 5, 0, 7); g.fill();

    // 11. face
    g.fillStyle = IM_GLOW;
    g.fillRect(-1, -74, 3, 2.4); g.fillRect(6, -74, 3, 2.4);
    g.strokeStyle = IM_OUT; g.lineWidth = 1.4; // angry brows
    g.beginPath(); g.moveTo(-2, -77); g.lineTo(2, -76); g.stroke();
    g.beginPath(); g.moveTo(9, -77.5); g.lineTo(5, -76.5); g.stroke();
    if (hurt) { // wince: flat mouth, no grin
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, -66); g.lineTo(8, -66); g.stroke();
    } else {
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(4, -67, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
      g.fillStyle = IM_TOOTH;
      g.beginPath(); g.moveTo(1, -65); g.lineTo(2.5, -62.5); g.lineTo(4, -65); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(5, -64.5); g.lineTo(6.5, -62); g.lineTo(8, -64.5); g.closePath(); g.fill();
    }
  };

  // ============================================================ OGRE (brute)
  B.ogre = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc;
    const moving = a.moving, hurt = a.hurt;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const breathe = Math.sin(t * 1.6) * 1.5;
    const lb = moving ? Math.sin(w) * 7 : 0;
    const lf = moving ? -Math.sin(w) * 7 : 0;

    // 1. back arm + fist
    limb3(g, OG_OUT, 11.6, -10, -62, -18, -46, -14, -28);
    limb3(g, OG_SKIN, 9, -10, -62, -18, -46, -14, -28);
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.arc(-14, -28, 5, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(-14, -28, 5, 0, 7); g.stroke();

    // 2. back leg + foot
    limb2(g, OG_OUT, 12.6, -8, -26, -12 + lb, -4);
    limb2(g, OG_SKIN, 10, -8, -26, -12 + lb, -4);
    g.fillStyle = OG_DEEP;
    g.beginPath(); g.roundRect(-19 + lb, -5, 14, 6, 2); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.4; // toe notches
    g.beginPath(); g.moveTo(-14 + lb, -5); g.lineTo(-14 + lb, -1); g.stroke();
    g.beginPath(); g.moveTo(-10 + lb, -5); g.lineTo(-10 + lb, -1); g.stroke();

    // 3. THE BELLY (the star of the silhouette)
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.ellipse(1, -42, 25, 23 + breathe, 0, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(1, -42, 25, 23 + breathe, 0, 0, 7); g.stroke();
    g.fillStyle = OG_HI; // top-left crescent key light
    g.beginPath(); g.arc(-8, -56, 9, 0, 7); g.fill();
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.arc(-5, -54, 8.5, 0, 7); g.fill();
    g.fillStyle = OG_BELLY; // belly plate
    g.beginPath(); g.ellipse(4, -38, 16, 15 + breathe * 0.7, 0, 0, 7); g.fill();
    g.fillStyle = OG_OUT; // navel
    g.beginPath(); g.arc(5, -30, 1.8, 0, 7); g.fill();
    g.strokeStyle = OG_SH; g.lineWidth = 1.4; // scar ticks
    g.beginPath(); g.moveTo(-14, -48); g.lineTo(-10, -46); g.stroke();
    g.beginPath(); g.moveTo(-13, -44); g.lineTo(-9, -42); g.stroke();

    // 4. chest / shoulder hunch (top arc outlined only)
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.ellipse(0, -64, 17, 10, 0, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.ellipse(0, -64, 17, 10, 0, Math.PI, 2 * Math.PI); g.stroke();

    // 5. loincloth: jagged hem, belt, patch, stitches
    g.fillStyle = OG_CLOTH;
    g.beginPath();
    g.moveTo(-14, -32); g.lineTo(15, -32); g.lineTo(12, -14); g.lineTo(6, -18);
    g.lineTo(0, -12); g.lineTo(-8, -17);
    g.closePath(); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-14, -32); g.lineTo(15, -32); g.lineTo(12, -14); g.lineTo(6, -18);
    g.lineTo(0, -12); g.lineTo(-8, -17);
    g.closePath(); g.stroke();
    g.fillStyle = OG_DEEP; g.fillRect(-15, -34, 30, 4); // belt
    g.fillStyle = OG_PATCH; g.fillRect(2, -26, 8, 7);   // patch
    g.strokeStyle = OG_STITCH; g.lineWidth = 1.2;       // stitches crossing the patch edges
    g.beginPath(); g.moveTo(0.5, -24); g.lineTo(3.5, -24); g.stroke();
    g.beginPath(); g.moveTo(6, -20.5); g.lineTo(6, -17.5); g.stroke();
    g.beginPath(); g.moveTo(8.5, -23); g.lineTo(11.5, -23); g.stroke();

    // 6. front leg + foot
    limb2(g, OG_OUT, 12.6, 6, -26, 10 + lf, -4);
    limb2(g, OG_SKIN, 10, 6, -26, 10 + lf, -4);
    g.fillStyle = OG_DEEP;
    g.beginPath(); g.roundRect(3 + lf, -5, 15, 6, 2); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(8 + lf, -5); g.lineTo(8 + lf, -1); g.stroke();
    g.beginPath(); g.moveTo(12 + lf, -5); g.lineTo(12 + lf, -1); g.stroke();

    // 7. tiny head sunk between the shoulders
    const hj = hurt ? 2 : 0; // stunned jaw drop
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.arc(8, -80, 8, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(8, -80, 8, 0, 7); g.stroke();
    g.fillStyle = OG_SKIN; // underbite jaw
    g.beginPath(); g.roundRect(0, -78 + hj, 17, 8, 3); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(0, -78 + hj, 17, 8, 3); g.stroke();
    g.fillStyle = OG_TUSK; // tusks point UP from the lower jaw
    g.beginPath(); g.moveTo(3, -72 + hj); g.lineTo(2, -80 + hj); g.lineTo(6, -72 + hj); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(12, -72 + hj); g.lineTo(13, -80 + hj); g.lineTo(9, -72 + hj); g.closePath(); g.fill();
    g.fillStyle = OG_OUT; // beady close-set eyes
    g.beginPath(); g.arc(6, -85, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(13, -85, 1.6, 0, 7); g.fill();
    if (!hurt) { g.fillStyle = OG_SH; g.fillRect(2, -89, 14, 3.5); } // brow slab
    g.fillStyle = OG_SKIN; // ear
    g.beginPath(); g.arc(-1, -81, 3, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-1, -81, 3, 0, 7); g.stroke();
    if (windup) { g.fillStyle = OG_SWEAT; g.beginPath(); g.arc(0, -88, 1.6, 0, 7); g.fill(); }

    // 8. front arm + club: drag / overhead telegraph / ground slam
    let wristX, wristY;
    if (windup) {
      limb3(g, OG_OUT, 11.6, 12, -62, 16, -74, 10, -86);
      limb3(g, OG_SKIN, 9, 12, -62, 16, -74, 10, -86);
      limb2(g, OG_OUT, 8.6, 10, -86, 13, -96);
      limb2(g, OG_WOOD, 6, 10, -86, 13, -96);
      clubHead(g, 14, -99, 0.1);
      wristX = 10; wristY = -86;
    } else if (strike) {
      limb3(g, OG_OUT, 11.6, 12, -62, 24, -46, 30, -24);
      limb3(g, OG_SKIN, 9, 12, -62, 24, -46, 30, -24);
      limb2(g, OG_OUT, 8.6, 30, -24, 44, -8);
      limb2(g, OG_WOOD, 6, 30, -24, 44, -8);
      clubHead(g, 46, -6, 0.9);
      wristX = 30; wristY = -24;
    } else {
      limb3(g, OG_OUT, 11.6, 12, -62, 22, -50, 24, -34);
      limb3(g, OG_SKIN, 9, 12, -62, 22, -50, 24, -34);
      limb2(g, OG_OUT, 8.6, 24, -34, 38, -16);
      limb2(g, OG_WOOD, 6, 24, -34, 38, -16);
      clubHead(g, 41, -12, -0.55);
      wristX = 24; wristY = -34;
    }

    // 9. knuckle over the club shaft
    g.fillStyle = OG_SKIN;
    g.beginPath(); g.arc(wristX, wristY, 5.5, 0, 7); g.fill();
    g.strokeStyle = OG_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.arc(wristX, wristY, 5.5, 0, 7); g.stroke();
  };

  // ============================================================ DARK MAGE (shooter)
  B.mage = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, hurt = a.hurt;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    // hover bob (the caller's shadow stays on the ground — same trick as look.float)
    g.translate(0, -(Math.sin(t * 2.2) * 3));
    if (a.moving) g.rotate(0.06); // glide lean toward the player
    // charge progress: no state timer in the body contract, so throb near full charge
    const wprog = windup ? 0.75 + 0.25 * Math.sin(t * 14) : 0;

    // 1. hem wisps (swaying; kicked back on strike recoil)
    const kick = strike ? -4 : 0;
    const sx1 = Math.sin(t * 2.6) * 1.5 + kick;
    const sx2 = Math.sin(t * 2.6 + 2.1) * 1.5 + kick;
    const sx3 = Math.sin(t * 2.6 + 4.2) * 1.5 + kick;
    g.fillStyle = MG_SH;
    g.beginPath(); g.moveTo(-10 + sx1, -18); g.lineTo(-6 + sx1, -4); g.lineTo(-2 + sx1, -18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0 + sx2, -18); g.lineTo(5 + sx2, -2); g.lineTo(9 + sx2, -18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(10 + sx3, -20); g.lineTo(14 + sx3, -8); g.lineTo(16 + sx3, -22); g.closePath(); g.fill();

    // 2. robe core
    g.fillStyle = MG_ROBE;
    g.beginPath();
    g.moveTo(-4, -90);
    g.quadraticCurveTo(-15, -78, -14, -58);
    g.quadraticCurveTo(-17, -30, -12, -16);
    g.lineTo(16, -20);
    g.quadraticCurveTo(15, -52, 8, -72);
    g.quadraticCurveTo(5, -84, -4, -90);
    g.closePath(); g.fill();
    g.strokeStyle = MG_OUT; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-4, -90);
    g.quadraticCurveTo(-15, -78, -14, -58);
    g.quadraticCurveTo(-17, -30, -12, -16);
    g.lineTo(16, -20);
    g.quadraticCurveTo(15, -52, 8, -72);
    g.quadraticCurveTo(5, -84, -4, -90);
    g.closePath(); g.stroke();

    // 3. bottom-lit under-shadow
    g.fillStyle = MG_SH;
    g.beginPath();
    g.moveTo(-12, -16); g.lineTo(16, -20);
    g.quadraticCurveTo(14, -34, 12, -44);
    g.quadraticCurveTo(0, -30, -12, -16);
    g.closePath(); g.fill();

    // 4. hood key light crescent
    g.fillStyle = MG_HI;
    g.beginPath(); g.arc(-6, -80, 7, 0, 7); g.fill();
    g.fillStyle = MG_ROBE;
    g.beginPath(); g.arc(-3.5, -78, 6.5, 0, 7); g.fill();

    // 5. mantle + silver trim
    g.fillStyle = MG_DEEP;
    g.beginPath(); g.roundRect(-13, -70, 26, 8, 4); g.fill();
    g.strokeStyle = MG_TRIM; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-13, -61); g.lineTo(13, -61); g.stroke();

    // 6. void face + eye slits
    g.fillStyle = MG_VOID;
    g.beginPath(); g.ellipse(3, -76, 7.5, 8.5, 0, 0, 7); g.fill();
    g.strokeStyle = MG_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(3, -76, 7.5, 8.5, 0, 0, 7); g.stroke();
    const eyeY = hurt && Math.floor(t * 30) % 2 === 0 ? -77 : -78; // hurt flicker
    g.fillStyle = MG_EYE;
    g.fillRect(0, eyeY, 3, 2.4); g.fillRect(6.5, eyeY, 3, 2.4);
    if (!hurt) {
      g.globalAlpha = 0.25;
      g.beginPath(); g.arc(4, -77, 6, 0, 7); g.fill();
      g.globalAlpha = 1;
    }

    // 7. drooping hood peak + bead
    g.fillStyle = MG_ROBE;
    g.beginPath(); g.moveTo(-4, -90); g.lineTo(-12, -96); g.lineTo(-2, -84); g.closePath(); g.fill();
    g.fillStyle = MG_TRIM;
    g.beginPath(); g.arc(-12, -96, 1.5, 0, 7); g.fill();

    // 8. sash + crescent-moon clasp
    g.strokeStyle = MG_TRIM; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-8, -40); g.lineTo(10, -44); g.stroke();
    g.fillStyle = MG_TRIM;
    g.beginPath(); g.arc(1, -42, 2.6, 0, 7); g.fill();
    g.fillStyle = MG_ROBE;
    g.beginPath(); g.arc(2.3, -42, 2.2, 0, 7); g.fill();

    // 9. sleeves — empty darkness where hands should be
    let chx, chy; // casting (front) hand — the rune orbit anchor
    if (windup) {
      g.fillStyle = MG_ROBE; // raised front sleeve
      g.beginPath(); g.moveTo(10, -70); g.lineTo(22, -66); g.lineTo(14, -58); g.closePath(); g.fill();
      g.fillStyle = MG_VOID;
      g.beginPath(); g.arc(22, -66, 2.8, 0, 7); g.fill();
      g.fillStyle = MG_ROBE; // raised back sleeve
      g.beginPath(); g.moveTo(-8, -66); g.lineTo(-16, -60); g.lineTo(-9, -52); g.closePath(); g.fill();
      g.fillStyle = MG_VOID;
      g.beginPath(); g.arc(-16, -60, 2.4, 0, 7); g.fill();
      g.fillStyle = MG_RUNE;
      g.beginPath(); g.arc(-16, -60, 1.6 + Math.sin(t * 5) * 0.4, 0, 7); g.fill();
      // charge orb between the hands
      g.globalAlpha = 0.3 + 0.4 * wprog;
      g.fillStyle = MG_EYE;
      g.beginPath(); g.arc(16, -64, 2 + 4 * wprog, 0, 7); g.fill();
      g.globalAlpha = 1;
      chx = 16; chy = -64;
    } else if (strike) {
      g.fillStyle = MG_ROBE; // both sleeves thrust forward, no orb (bolt is engine-side)
      g.beginPath(); g.moveTo(8, -62); g.lineTo(24, -58); g.lineTo(12, -52); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-2, -58); g.lineTo(20, -54); g.lineTo(2, -48); g.closePath(); g.fill();
      g.fillStyle = MG_VOID;
      g.beginPath(); g.arc(24, -58, 2.8, 0, 7); g.fill();
      g.beginPath(); g.arc(20, -54, 2.4, 0, 7); g.fill();
      chx = 24; chy = -58;
    } else {
      g.fillStyle = MG_ROBE; // front sleeve + cuff
      g.beginPath(); g.moveTo(8, -58); g.lineTo(20, -50); g.lineTo(12, -44); g.closePath(); g.fill();
      g.fillStyle = MG_DEEP;
      g.beginPath(); g.moveTo(18, -52); g.lineTo(22, -49); g.lineTo(19, -45); g.closePath(); g.fill();
      g.fillStyle = MG_VOID;
      g.beginPath(); g.arc(22, -49, 2.8, 0, 7); g.fill();
      g.fillStyle = MG_ROBE; // back sleeve
      g.beginPath(); g.moveTo(-8, -56); g.lineTo(-16, -48); g.lineTo(-9, -44); g.closePath(); g.fill();
      g.fillStyle = MG_VOID;
      g.beginPath(); g.arc(-17, -48, 2.4, 0, 7); g.fill();
      g.fillStyle = MG_RUNE; // idle ember
      g.beginPath(); g.arc(-17, -48, 1.6 + Math.sin(t * 5) * 0.4, 0, 7); g.fill();
      chx = 22; chy = -49;
    }

    // 10. rune orbit: three diamonds circling the casting hand
    const R = windup ? 13 - 7 * wprog : 13;
    const spd = windup ? 9 : 2.4;
    g.fillStyle = MG_RUNE;
    const a1 = t * spd, a2 = t * spd + 2.094, a3 = t * spd + 4.188;
    runeDiamond(g, chx + Math.cos(a1) * R, chy + Math.sin(a1) * R * 0.6);
    runeDiamond(g, chx + Math.cos(a2) * R, chy + Math.sin(a2) * R * 0.6);
    runeDiamond(g, chx + Math.cos(a3) * R, chy + Math.sin(a3) * R * 0.6);
    g.globalAlpha = 0.18;
    g.strokeStyle = MG_RUNE; g.lineWidth = 1;
    g.beginPath(); g.ellipse(chx, chy, R, R * 0.6, 0, 0, 7); g.stroke();
    g.globalAlpha = 1;
  };

  // ============================================================ SHADOW DRAGON (boss)
  // Preserves every landmark of the old kind==='dragon' branch: tail to (-52,-46),
  // body ellipse (0,-32,26,17), head (30,-74), wing flap df=sin(t*5)*6, horn triangles.
  BOSS.dragon = function (g, e, t) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const df = Math.sin(t * 5) * 6;
    const df2 = Math.sin(t * 5 - 1.2) * 6; // far wing lags the near
    const windup = e.state === 'windup';
    const pulse = windup ? 0.75 + 0.25 * Math.sin(t * 22) : 0.3 + 0.12 * Math.sin(t * 2.7);

    // 1. smoke wisps rising off the back (looping, alloc-free)
    g.fillStyle = DR_SMOKE;
    const c1 = (t * 10) % 34;
    g.globalAlpha = 0.35 * (1 - c1 / 34);
    g.beginPath(); g.arc(-30 + Math.sin(t * 0.9) * 6, -70 - c1, 7, 0, 7); g.fill();
    const c2 = (t * 10 + 23) % 34;
    g.globalAlpha = 0.35 * (1 - c2 / 34);
    g.beginPath(); g.arc(-4 + Math.sin(t * 0.9 + 2.1) * 6, -70 - c2, 9, 0, 7); g.fill();
    const c3 = (t * 10 + 46) % 34;
    g.globalAlpha = 0.35 * (1 - c3 / 34);
    g.beginPath(); g.arc(22 + Math.sin(t * 0.9 + 4.2) * 6, -70 - c3, 11, 0, 7); g.fill();
    g.globalAlpha = 1;

    // 2. far wing (phase-lagged)
    g.strokeStyle = DR_DK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-4, -50); g.lineTo(-30, -80 - df2); g.stroke();
    g.fillStyle = DR_DK;
    g.beginPath();
    g.moveTo(-4, -48); g.lineTo(-30, -80 - df2);
    g.quadraticCurveTo(-34, -62 - df2 * 0.5, -26, -52);
    g.quadraticCurveTo(-16, -56, -4, -48);
    g.closePath(); g.fill();

    // 3. tail (existing anchor path) + dorsal spikes + spade tip
    g.strokeStyle = DR_BODY; g.lineWidth = 9;
    g.beginPath(); g.moveTo(-18, -30); g.quadraticCurveTo(-42, -26, -52, -46); g.stroke();
    g.fillStyle = DR_DEEP;
    g.beginPath(); g.moveTo(-28, -27); g.lineTo(-31, -35); g.lineTo(-24, -30); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-37, -29); g.lineTo(-41, -37); g.lineTo(-33, -32); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-45, -38); g.lineTo(-50, -45); g.lineTo(-42, -41); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-52, -46); g.lineTo(-56, -52); g.lineTo(-48, -53); g.closePath(); g.fill();
    g.strokeStyle = DR_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-52, -46); g.lineTo(-56, -52); g.lineTo(-48, -53); g.closePath(); g.stroke();

    // 4. hind leg (existing) + thigh cap + claws
    g.strokeStyle = DR_DEEP; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-10, -20); g.lineTo(-12, 0); g.stroke();
    g.fillStyle = DR_BODY;
    g.beginPath(); g.arc(-10, -22, 5, 0, 7); g.fill();
    g.fillStyle = DR_DEEP;
    g.beginPath(); g.moveTo(-15, -1); g.lineTo(-19, 1); g.lineTo(-14, 2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-10, -1); g.lineTo(-13, 2); g.lineTo(-8, 2); g.closePath(); g.fill();

    // 5. near wing: layered membrane, same flap and reach as the old flat triangles
    g.fillStyle = DR_SH;
    g.beginPath();
    g.moveTo(-2, -46); g.lineTo(-28, -76 - df);
    g.quadraticCurveTo(-30, -60 - df * 0.4, -20, -50);
    g.quadraticCurveTo(-10, -52, -2, -46);
    g.closePath(); g.fill();
    g.fillStyle = DR_DK;
    g.beginPath();
    g.moveTo(0, -46); g.lineTo(-14, -82 + df);
    g.quadraticCurveTo(-18, -62, -8, -50);
    g.closePath(); g.fill();
    g.strokeStyle = DR_DEEP; g.lineWidth = 2; // finger bones
    g.beginPath(); g.moveTo(-2, -46); g.lineTo(-28, -76 - df); g.stroke();
    g.beginPath(); g.moveTo(-1, -46); g.lineTo(-14, -82 + df); g.stroke();
    g.beginPath(); g.moveTo(-2, -46); g.lineTo(-22, -58); g.stroke();
    g.strokeStyle = DR_BODY; g.lineWidth = 4; // wing arm
    g.beginPath(); g.moveTo(2, -44); g.lineTo(-6, -52); g.stroke();
    g.globalAlpha = 0.5; // ember rim light on the leading edge
    g.strokeStyle = DR_EMBER; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-2, -46); g.lineTo(-28, -76 - df); g.stroke();
    g.globalAlpha = 1;

    // 6. body (existing ellipse) + outline + key light + scale texture
    g.fillStyle = DR_BODY;
    g.beginPath(); g.ellipse(0, -32, 26, 17, 0, 0, 7); g.fill();
    g.strokeStyle = DR_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(0, -32, 26, 17, 0, 0, 7); g.stroke();
    g.fillStyle = DR_HI;
    g.beginPath(); g.arc(-10, -42, 9, 0, 7); g.fill();
    g.fillStyle = DR_BODY;
    g.beginPath(); g.arc(-7.5, -40, 8.5, 0, 7); g.fill();
    g.strokeStyle = DR_DK; g.lineWidth = 1.6; // scales
    g.beginPath(); g.arc(-8, -34, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.beginPath(); g.arc(2, -30, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.beginPath(); g.arc(11, -35, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();

    // 7. belly plates
    g.fillStyle = DR_BELLY;
    g.beginPath(); g.roundRect(0, -30, 18, 4.4, 2); g.fill();
    g.beginPath(); g.roundRect(2, -25, 17, 4.4, 2); g.fill();
    g.beginPath(); g.roundRect(4, -20, 15, 4.4, 2); g.fill();
    g.strokeStyle = DR_DEEP; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, -25.6); g.lineTo(18, -25.6); g.stroke();
    g.beginPath(); g.moveTo(2, -20.6); g.lineTo(19, -20.6); g.stroke();
    g.beginPath(); g.moveTo(4, -15.6); g.lineTo(19, -15.6); g.stroke();

    // 8. glowing chest crack (throbs; spikes hard during windup)
    g.globalAlpha = pulse * 0.5;
    g.fillStyle = DR_CRACK;
    g.beginPath(); g.arc(8, -30, 11, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.lineJoin = 'miter';
    g.strokeStyle = DR_CRACK; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(4, -38); g.lineTo(9, -32); g.lineTo(6, -27); g.lineTo(12, -22); g.lineTo(9, -17);
    g.stroke();
    g.beginPath(); g.moveTo(9, -32); g.lineTo(14, -30); g.stroke();
    g.strokeStyle = DR_CORE; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(4, -38); g.lineTo(9, -32); g.lineTo(6, -27); g.lineTo(12, -22); g.lineTo(9, -17);
    g.stroke();
    g.lineJoin = 'round';

    // 9. neck (existing path) + plates + dorsal spikes
    g.strokeStyle = DR_BODY; g.lineWidth = 9;
    g.beginPath(); g.moveTo(16, -40); g.quadraticCurveTo(24, -62, 28, -72); g.stroke();
    g.fillStyle = DR_BELLY;
    g.beginPath(); g.roundRect(16, -46, 7, 3.6, 1.6); g.fill();
    g.beginPath(); g.roundRect(19, -54, 7, 3.6, 1.6); g.fill();
    g.beginPath(); g.roundRect(22, -62, 7, 3.6, 1.6); g.fill();
    g.fillStyle = DR_DEEP;
    g.beginPath(); g.moveTo(18, -52); g.lineTo(15, -58); g.lineTo(21, -56); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(22, -62); g.lineTo(20, -69); g.lineTo(26, -66); g.closePath(); g.fill();

    // 10. head (existing anchors) + brow + jaw + teeth + ear frill
    g.fillStyle = DR_BODY;
    g.beginPath(); g.ellipse(30, -74, 9, 6, 0.3, 0, 7); g.fill();
    g.beginPath(); g.moveTo(37, -77); g.lineTo(46, -72); g.lineTo(37, -69); g.closePath(); g.fill();
    g.fillStyle = DR_SH;
    g.beginPath(); g.ellipse(28, -78, 5, 2.5, 0.2, 0, 7); g.fill();
    g.strokeStyle = DR_OUT; g.lineWidth = 1.4; // jaw split
    g.beginPath(); g.moveTo(37, -72); g.lineTo(45, -72); g.stroke();
    g.fillStyle = DR_TOOTH;
    g.beginPath(); g.moveTo(39, -72); g.lineTo(40.5, -70); g.lineTo(42, -72); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(42.5, -72); g.lineTo(43.7, -70.5); g.lineTo(45, -72); g.closePath(); g.fill();
    g.fillStyle = DR_SH; // ear frill
    g.beginPath(); g.moveTo(24, -76); g.lineTo(20, -82); g.lineTo(26, -79); g.closePath(); g.fill();
    if (windup) { // fire tell: mouth glow before the volley
      g.globalAlpha = 0.7;
      g.fillStyle = DR_EMBER;
      g.beginPath(); g.moveTo(38, -75); g.lineTo(45, -72); g.lineTo(38, -70); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }

    // 11. horns (existing cream triangles) + leading-edge ridges
    g.fillStyle = DR_HORN;
    g.beginPath(); g.moveTo(26, -80); g.lineTo(22, -91); g.lineTo(29, -81); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(31, -81); g.lineTo(31, -93); g.lineTo(36, -80); g.closePath(); g.fill();
    g.strokeStyle = DR_OUT; g.lineWidth = 1;
    g.beginPath(); g.moveTo(29, -81); g.lineTo(22, -91); g.stroke();
    g.beginPath(); g.moveTo(36, -80); g.lineTo(31, -93); g.stroke();

    // 12. eye — magenta now, blooming on windup
    if (windup) {
      g.globalAlpha = 0.5;
      g.fillStyle = DR_CRACK;
      g.beginPath(); g.arc(31, -76, 3.4, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    g.fillStyle = DR_CRACK;
    g.beginPath(); g.arc(31, -76, 1.8, 0, 7); g.fill();

    // 13. front leg (existing) + shoulder cap + claws
    g.strokeStyle = DR_DEEP; g.lineWidth = 6;
    g.beginPath(); g.moveTo(10, -20); g.lineTo(12, 0); g.stroke();
    g.fillStyle = DR_BODY;
    g.beginPath(); g.arc(10, -22, 5, 0, 7); g.fill();
    g.fillStyle = DR_DEEP;
    g.beginPath(); g.moveTo(9, -1); g.lineTo(6, 2); g.lineTo(11, 2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(14, -1); g.lineTo(12, 2); g.lineTo(17, 2); g.closePath(); g.fill();
  };
})();
