// skins-road.js — World 2 "road" enemy + boss bodies (Owlboy-style dusk highway crew)
// Registered into window.ENEMY_BODIES / window.BOSS_BODIES; drawn in the local frames
// documented in game.js (drawFighter / roll branch / drawBoss). Flat fills only —
// no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // ---- hoisted palettes ----
  // Traffic Cone
  const CONE_OUT = '#6e2c10', CONE_LIT = '#ff8a3a', CONE_MID = '#e8742a', CONE_DK = '#b4501e';
  const CONE_BAND = '#c9b89a', CONE_BAND_LIT = '#fff4e0', CONE_GLINT = '#ffcf8a';
  const CONE_RUBBER = '#3a2c22', CONE_RUBBER_LIT = '#55402f', CONE_PUPIL = '#4a2210', CONE_MITT = '#ffb27a';
  // Runaway Tire
  const TIRE_OUT = '#14141c', TIRE_LUG = '#16161d', TIRE_RUBBER = '#23232c', TIRE_SHEEN = '#2e2e38';
  const TIRE_RING = '#3a3a46', TIRE_TICK = '#4a4a58', TIRE_GRIME = '#7a5c3a';
  const TIRE_HUB = '#8a8478', TIRE_HUB_LIT = '#d8d2c4', TIRE_GLINT = '#ffcf8a', TIRE_SPARK = '#fff4e0', TIRE_BOLT = '#55504a';
  // Rest-Stop Sasquatch
  const SQ_OUT = '#2e1c10', SQ_DK = '#4a3020', SQ_BASE = '#6a4a32', SQ_LIT = '#8a6544';
  const SQ_CHEST = '#caa27c', SQ_CHEST_DK = '#a8815c', SQ_RIM = '#ffb27a', SQ_SHADES = '#1d1416', SQ_GLINT = '#ffcf8a';
  const SQ_SKIRT_X = [-18, -12, -6, 0, 6, 12, 18];
  const SQ_MID_X = [-16, -9, -2, 5, 12];
  const SQ_BROW_X = [-9, -4.5, 0, 4.5];
  const SQ_CROWN_X = [-3, 1.5, 6, 10];
  // Speed Camera
  const CAM_OUT = '#2b3040', CAM_BODY = '#6a7288', CAM_LIT = '#8b93aa', CAM_DK = '#4d5468';
  const CAM_GLASS = '#2a3a55', CAM_IRIS = '#9fdcff', CAM_LED = '#ff4a3a', CAM_RIM = '#ffb27a';
  const CAM_SCREEN = '#1d222e', CAM_DIGIT = '#ffd24a', CAM_WHITE = '#fff4e0';
  // ROAD RAGE the minivan
  const VAN_OUT = '#4a4034', VAN_BASE = '#b8a888', VAN_LITP = '#d8c8a4', VAN_SHADE = '#8a7a60';
  const VAN_RUST = '#7a4a2c', VAN_GLASS = '#3a4a66', VAN_GLARE = '#cfeaff', VAN_CRACK = '#f4fbff';
  const VAN_CHROME = '#d8d2c4', VAN_CHROME_DK = '#8a8478', VAN_HEAD = '#ffd24a', VAN_GLOW = '#ffb27a';
  const VAN_TAIL = '#ff4a3a', VAN_TIRE = '#23232c', VAN_TIRE_OUT = '#14141c', VAN_SPOKE = '#55504a', VAN_MIRROR = '#9fdcff';
  const VAN_SMOKE_A = 'rgba(120,110,100,0.28)', VAN_SMOKE_B = 'rgba(180,170,158,0.2)';
  const VAN_WHEEL_X = [-20, 20];

  // =========================================================================
  // GRUNT — Traffic Cone. Local: feet y=0, +x forward; caller drew the shadow.
  // =========================================================================
  B.cone = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const w = a.walkCyc || 0;

    // pose vars (spec VARS)
    let lean;
    if (a.attackKey === 'windup') lean = -0.14;
    else if (a.attackKey === 'strike') lean = 0.12;
    else if (a.moving) lean = Math.sin(w) * 0.07;
    else lean = Math.sin(a.animT * 1.6) * 0.02;
    if (a.hurt) lean = -0.1;
    let fhx = 16, fhy = -44, bhx = -16, bhy = -44;
    if (a.attackKey === 'windup') { fhx = 8; fhy = -64; bhx = -4; bhy = -60; }
    else if (a.attackKey === 'strike') { fhx = 34; fhy = -40; }
    else if (a.moving) { fhx = 15 + Math.sin(w) * 5; fhy = -42; bhx = -15 - Math.sin(w) * 5; bhy = -42; }

    // body rock (hurt adds a squash)
    g.save();
    g.translate(0, -6); g.rotate(lean);
    if (a.hurt) g.scale(1.08, 0.92);
    g.translate(0, 6);

    // rubber base, outline first
    g.fillStyle = CONE_OUT;
    g.beginPath(); g.roundRect(-27.5, -13.5, 55, 15, 4); g.fill();
    g.fillStyle = CONE_RUBBER;
    g.beginPath(); g.roundRect(-26, -12, 52, 12, 3); g.fill();
    g.fillStyle = CONE_RUBBER_LIT;
    g.fillRect(-26, -12, 52, 3);

    // cone mass: outline, fill, shade side, lit face
    g.fillStyle = CONE_OUT;
    g.beginPath(); g.moveTo(-20.5, -10); g.lineTo(-6.5, -93); g.lineTo(6.5, -93); g.lineTo(20.5, -10); g.closePath(); g.fill();
    g.fillStyle = CONE_MID;
    g.beginPath(); g.moveTo(-19, -12); g.lineTo(-5.5, -90); g.lineTo(5.5, -90); g.lineTo(19, -12); g.closePath(); g.fill();
    g.fillStyle = CONE_DK;
    g.beginPath(); g.moveTo(6, -12); g.lineTo(2, -88); g.lineTo(5.5, -90); g.lineTo(19, -12); g.closePath(); g.fill();
    g.fillStyle = CONE_LIT;
    g.beginPath(); g.moveTo(-19, -12); g.lineTo(-5.5, -90); g.lineTo(-1, -88); g.lineTo(-9, -12); g.closePath(); g.fill();
    g.strokeStyle = CONE_GLINT; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-17.5, -16); g.lineTo(-6, -86); g.stroke();

    // reflective band LOW (follows the taper)
    g.fillStyle = CONE_BAND;
    g.beginPath(); g.moveTo(-14.6, -34); g.lineTo(-13, -45); g.lineTo(13, -45); g.lineTo(14.6, -34); g.closePath(); g.fill();
    g.fillStyle = CONE_BAND_LIT;
    g.beginPath(); g.moveTo(-14.1, -38); g.lineTo(-13, -45); g.lineTo(13, -45); g.lineTo(14.1, -38); g.closePath(); g.fill();
    g.fillStyle = CONE_GLINT;
    g.beginPath(); g.moveTo(-12, -38); g.lineTo(-10, -44); g.lineTo(-4, -44); g.lineTo(-6, -38); g.closePath(); g.fill();
    // reflective band HIGH
    g.fillStyle = CONE_BAND;
    g.beginPath(); g.moveTo(-10.7, -60); g.lineTo(-9.4, -69); g.lineTo(9.4, -69); g.lineTo(10.7, -60); g.closePath(); g.fill();
    g.fillStyle = CONE_BAND_LIT;
    g.beginPath(); g.moveTo(-10, -65); g.lineTo(-9.4, -69); g.lineTo(9.4, -69); g.lineTo(10, -65); g.closePath(); g.fill();
    g.fillStyle = CONE_GLINT;
    g.beginPath(); g.moveTo(-8, -64); g.lineTo(-6.5, -68.5); g.lineTo(-3, -68.5); g.lineTo(-4.5, -64); g.closePath(); g.fill();

    // tip cap + nub
    g.fillStyle = CONE_DK;
    g.beginPath(); g.ellipse(0, -90, 6, 3, 0, 0, 7); g.fill();
    g.fillStyle = CONE_MID;
    g.beginPath(); g.roundRect(-4, -96, 8, 7, 3); g.fill();
    g.strokeStyle = CONE_OUT; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(-4, -96, 8, 7, 3); g.stroke();

    // face on the upper cone (per-eye blink swaps the oval for a shut line)
    const blinkA = Math.sin(a.animT * 1.3 + 1.5) > 0.985;
    const blinkB = Math.sin(a.animT * 1.3 + 9) > 0.985;
    if (blinkA) {
      g.strokeStyle = CONE_OUT; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -52); g.lineTo(3, -52); g.stroke();
    } else {
      g.fillStyle = CONE_BAND_LIT;
      g.beginPath(); g.ellipse(1.5, -52, 3.4, 4.2, 0, 0, 7); g.fill();
      g.fillStyle = CONE_PUPIL;
      g.beginPath(); g.arc(2.4, -52, 1.5, 0, 7); g.fill();
    }
    if (blinkB) {
      g.strokeStyle = CONE_OUT; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(7.5, -52.5); g.lineTo(10.5, -52.5); g.stroke();
    } else {
      g.fillStyle = CONE_BAND_LIT;
      g.beginPath(); g.ellipse(9, -52.5, 3.1, 3.9, 0, 0, 7); g.fill();
      g.fillStyle = CONE_PUPIL;
      g.beginPath(); g.arc(9.8, -52.5, 1.4, 0, 7); g.fill();
    }
    g.strokeStyle = CONE_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-2, -58); g.lineTo(3.5, -55.5); g.stroke();
    g.beginPath(); g.moveTo(12.5, -58.5); g.lineTo(7, -56); g.stroke();
    g.lineWidth = 1.6;
    g.beginPath(); g.arc(5.5, -47, 3, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();

    g.restore(); // end body rock

    // stubby arms last, outside the rock so they trail the lean
    g.strokeStyle = CONE_OUT; g.lineWidth = 8.5;
    g.beginPath(); g.moveTo(-13, -40); g.lineTo(bhx, bhy); g.stroke();
    g.strokeStyle = CONE_DK; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-13, -40); g.lineTo(bhx, bhy); g.stroke();
    g.strokeStyle = CONE_OUT; g.lineWidth = 8.5;
    g.beginPath(); g.moveTo(13, -40); g.lineTo(fhx, fhy); g.stroke();
    g.strokeStyle = CONE_LIT; g.lineWidth = 6;
    g.beginPath(); g.moveTo(13, -40); g.lineTo(fhx, fhy); g.stroke();
    g.fillStyle = CONE_MITT;
    g.beginPath(); g.arc(fhx, fhy, 3.6, 0, 7); g.fill();
    g.strokeStyle = CONE_OUT; g.lineWidth = 1.5;
    g.beginPath(); g.arc(fhx, fhy, 3.6, 0, 7); g.stroke();
    g.fillStyle = CONE_MITT;
    g.beginPath(); g.arc(bhx, bhy, 3.4, 0, 7); g.fill();
    g.strokeStyle = CONE_OUT; g.lineWidth = 1.5;
    g.beginPath(); g.arc(bhx, bhy, 3.4, 0, 7); g.stroke();
  };

  // =========================================================================
  // STINGER — Runaway Tire. Local: wheel CENTER at (0,0), radius 22, frame is
  // already rotated by walkCyc (everything drawn here tumbles with the wheel).
  // The hubcap glint sweeps past the viewer once per revolution — free specular.
  // =========================================================================
  B.tire = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    // outline disc
    g.fillStyle = TIRE_OUT;
    g.beginPath(); g.arc(0, 0, 23.5, 0, 7); g.fill();
    // 8 chunky tread lugs studding the rim — the new silhouette
    g.fillStyle = TIRE_LUG;
    for (let ti = 0; ti < 8; ti++) {
      g.save(); g.rotate(ti * Math.PI / 4);
      g.fillRect(-3.6, -25, 7.2, 6);
      g.restore();
    }
    // rubber body + tumbling sun sheen
    g.fillStyle = TIRE_RUBBER;
    g.beginPath(); g.arc(0, 0, 21.5, 0, 7); g.fill();
    g.fillStyle = TIRE_SHEEN;
    g.beginPath(); g.arc(0, 0, 21.5, Math.PI * 0.85, Math.PI * 1.55); g.lineTo(0, 0); g.closePath(); g.fill();
    // sidewall ring + lettering ticks
    g.strokeStyle = TIRE_RING; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 0, 15.5, 0, 7); g.stroke();
    g.fillStyle = TIRE_TICK;
    for (let ti = 0; ti < 6; ti++) {
      g.save(); g.rotate(ti * Math.PI / 3 + 0.26);
      g.fillRect(-1.2, -18.5, 2.4, 3);
      g.restore();
    }
    // caked road grime
    g.strokeStyle = TIRE_GRIME; g.globalAlpha = 0.4; g.lineWidth = 3.5;
    g.beginPath(); g.arc(0, 0, 19, 0.2 * Math.PI, 0.75 * Math.PI); g.stroke();
    g.globalAlpha = 1;
    // hubcap: base, lit half, sweeping glint wedge, spark dot
    g.fillStyle = TIRE_HUB;
    g.beginPath(); g.arc(0, 0, 9.5, 0, 7); g.fill();
    g.fillStyle = TIRE_HUB_LIT;
    g.beginPath(); g.arc(0, 0, 9.5, Math.PI * 0.8, Math.PI * 1.8); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = TIRE_GLINT;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 9, -0.45, 0.15); g.closePath(); g.fill();
    g.fillStyle = TIRE_SPARK;
    g.beginPath(); g.arc(5.5, -4, 1.5, 0, 7); g.fill();
    // center bolt
    g.fillStyle = TIRE_BOLT;
    g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
    g.strokeStyle = TIRE_OUT; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, 3, 0, 7); g.stroke();
    // (spec's world-space dust kick-up needs the unrotated frame + rollDir —
    // not available in this contract, so the tumbling sheen/glint sell the roll)
  };

  // =========================================================================
  // BRUTE — Rest-Stop Sasquatch. Local: feet y=0, +x forward; caller applies
  // size 1.32. Body top stays ~-97 so the hitbox reads the same.
  // =========================================================================
  B.squatch = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const w = a.walkCyc || 0;
    const bob = Math.sin(a.animT * 2) * 1.2;

    // pose vars
    let bhx = -23, bhy = -8, fhx2 = 24, fhy2 = -8;
    if (a.attackKey === 'windup') { bhx = -8; bhy = -94; fhx2 = 12; fhy2 = -98; }
    else if (a.attackKey === 'strike') { fhx2 = 28; fhy2 = -4; bhx = 18; bhy = -6; }
    else if (a.moving) {
      fhx2 = 22 + Math.sin(w) * 8; fhy2 = -8 - Math.max(0, Math.sin(w)) * 4;
      bhx = -22 - Math.sin(w) * 8; bhy = -8 - Math.max(0, -Math.sin(w)) * 4;
    }
    let rot = 0;
    if (a.moving) rot += Math.sin(w) * 0.05;         // whole-body lumber
    if (a.attackKey === 'strike') rot += 0.12;       // slam lean
    if (a.hurt) rot -= 0.1;
    const jig = a.attackKey === 'strike' ? Math.sin(a.animT * 30) * 1.5 : 0;

    // feet stay planted, outside the lumber
    g.fillStyle = SQ_DK;
    g.beginPath(); g.ellipse(-11, -3, 8.5, 4, 0, 0, 7); g.fill();
    g.strokeStyle = SQ_OUT; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.ellipse(12, -3, 9.5, 4.5, 0, 0, 7); g.fill();
    g.stroke();
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.arc(-17, -4, 2.5, 0, 7); g.fill();
    g.beginPath(); g.arc(20, -4, 2.5, 0, 7); g.fill();

    g.save();
    g.translate(0, -10); g.rotate(rot); g.translate(0, 10);
    if (a.attackKey === 'windup') g.scale(1.05, 0.95); // crouch loading

    // back arm (behind the body)
    g.strokeStyle = SQ_OUT; g.lineWidth = 12.5;
    g.beginPath(); g.moveTo(-15, -58 + bob); g.lineTo(bhx, bhy); g.stroke();
    g.strokeStyle = SQ_DK; g.lineWidth = 9.5;
    g.beginPath(); g.moveTo(-15, -58 + bob); g.lineTo(bhx, bhy); g.stroke();
    g.fillStyle = SQ_DK;
    g.beginPath(); g.arc(bhx, bhy, 5.2, 0, 7); g.fill();
    g.strokeStyle = SQ_OUT; g.lineWidth = 2; g.stroke();

    // body silhouette outline
    g.fillStyle = SQ_OUT;
    g.beginPath(); g.ellipse(0, -46 + bob, 23.5, 27, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(0, -30, 25, 20, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-15, -63 + bob, 11.5, 10.5, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(15, -63 + bob, 11.5, 10.5, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(4, -81 + bob, 12.5, 11.5, 0, 0, 7); g.fill();

    // fur layer 1: dark under-fur + planted skirt scallops
    g.fillStyle = SQ_DK;
    g.beginPath(); g.ellipse(0, -30, 23.5, 18.5, 0, 0, 7); g.fill();
    for (let i = 0; i < SQ_SKIRT_X.length; i++) {
      g.beginPath(); g.arc(SQ_SKIRT_X[i] + jig, -13, 5.5, 0, 7); g.fill();
    }
    // fur layer 2: base mass + shoulder mounds + mid fur-bank
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.ellipse(0, -47 + bob, 21.5, 24, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-14, -62 + bob, 10, 9, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(14, -62 + bob, 10, 9, 0, 0, 7); g.fill();
    for (let i = 0; i < SQ_MID_X.length; i++) {
      g.beginPath(); g.arc(SQ_MID_X[i], -27, 5, 0, 7); g.fill();
    }
    // fur layer 3: sun-lit top-left + brow shag
    g.fillStyle = SQ_LIT;
    g.beginPath(); g.ellipse(-7, -59 + bob, 13, 11, 0, 0, 7); g.fill();
    for (let i = 0; i < SQ_BROW_X.length; i++) {
      g.beginPath(); g.arc(SQ_BROW_X[i], -72 + bob, 3.8, 0, 7); g.fill();
    }
    // sunset rim light
    g.strokeStyle = SQ_RIM; g.globalAlpha = 0.85; g.lineWidth = 1.8;
    g.beginPath(); g.arc(0, -52 + bob, 22, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
    g.globalAlpha = 1;
    // chest patch
    g.fillStyle = SQ_CHEST;
    g.beginPath(); g.ellipse(7, -44, 6.5, 9, 0, 0, 7); g.fill();
    g.fillStyle = SQ_CHEST_DK;
    g.beginPath(); g.ellipse(7, -40, 6, 5, 0, 0, 7); g.fill();

    // head dome + crown shag + cheek flares
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.ellipse(4, -81 + bob, 11, 10, 0, 0, 7); g.fill();
    g.strokeStyle = SQ_OUT; g.lineWidth = 2; g.stroke();
    g.fillStyle = SQ_LIT;
    for (let i = 0; i < SQ_CROWN_X.length; i++) {
      g.beginPath(); g.arc(SQ_CROWN_X[i], -89 + bob, 3.4, 0, 7); g.fill();
    }
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.ellipse(-5, -77 + bob, 4.5, 6, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(13, -77 + bob, 4, 5.5, 0, 0, 7); g.fill();
    // muzzle
    g.fillStyle = SQ_CHEST;
    g.beginPath(); g.roundRect(4, -79 + bob, 11.5, 8, 4); g.fill();
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.arc(9, -75.5 + bob, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(12.5, -75.5 + bob, 1, 0, 7); g.fill();
    g.strokeStyle = SQ_OUT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(6, -72.5 + bob); g.lineTo(13, -72.5 + bob); g.stroke();

    // tiny sunglasses (knocked askew when hurt)
    if (a.hurt) {
      g.save();
      g.translate(7, -83 + bob); g.rotate(0.2); g.translate(-7, 83 - bob);
    }
    g.fillStyle = SQ_SHADES;
    g.fillRect(0, -85 + bob, 6.5, 4.5);
    g.fillRect(8, -85 + bob, 6.5, 4.5);
    g.fillRect(6.5, -83.5 + bob, 1.5, 1.5);
    g.strokeStyle = SQ_OUT; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, -83 + bob); g.lineTo(-4, -82 + bob); g.stroke();
    g.fillStyle = SQ_GLINT;
    g.fillRect(1, -84.5 + bob, 2, 1.2);
    if (a.hurt) g.restore();

    // front arm over the body, knuckle-drag hand
    g.strokeStyle = SQ_OUT; g.lineWidth = 12.5;
    g.beginPath(); g.moveTo(15, -58 + bob); g.lineTo(fhx2, fhy2); g.stroke();
    g.strokeStyle = SQ_BASE; g.lineWidth = 9.5;
    g.beginPath(); g.moveTo(15, -58 + bob); g.lineTo(fhx2, fhy2); g.stroke();
    g.fillStyle = SQ_DK;
    g.beginPath(); g.arc((15 + fhx2) / 2, (-58 + bob + fhy2) / 2, 4, 0, 7); g.fill(); // elbow tuft
    g.fillStyle = SQ_BASE;
    g.beginPath(); g.arc(fhx2, fhy2, 5.8, 0, 7); g.fill();
    g.fillStyle = SQ_LIT;
    g.beginPath(); g.arc(fhx2 - 1.5, fhy2 - 1.5, 3.2, 0, 7); g.fill();
    g.strokeStyle = SQ_OUT; g.lineWidth = 2;
    g.beginPath(); g.arc(fhx2, fhy2, 5.8, 0, 7); g.stroke();
    g.fillStyle = SQ_DK;
    g.beginPath(); g.arc(fhx2 - 3.5, fhy2 - 5, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(fhx2, fhy2 - 5.6, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(fhx2 + 3.5, fhy2 - 5, 1.6, 0, 7); g.fill();

    g.restore(); // end lumber
  };

  // =========================================================================
  // SHOOTER — Speed Camera drone. Local: feet y=0 (hitbox anchor), +x forward;
  // the whole rig floats on a sine, the ground shadow was already drawn.
  // =========================================================================
  B.camera = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    let hov = 4 * Math.sin(t * 2.4);
    let tilt = Math.sin(t * 1.7) * 0.05;
    if (a.moving) tilt += 0.06;      // nose into the travel direction (+x local)
    if (a.hurt) { tilt = -0.22; hov = 0; } // drops flat, knocked over

    g.save();
    g.translate(0, -hov);
    g.translate(0, -54); g.rotate(tilt); g.translate(0, 54);
    if (a.attackKey === 'windup') g.translate(-4, 0);      // eases back, charging
    else if (a.attackKey === 'strike') g.translate(-6, 0); // recoil

    // dangling cable (behind the body)
    const sway = 3 * Math.sin(t * 3);
    g.strokeStyle = CAM_OUT; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -41); g.quadraticCurveTo(2, -33, sway, -25); g.stroke();
    g.fillStyle = CAM_DK;
    g.fillRect(sway - 1.5, -25, 3, 4.5);

    // rotor mast + blur disc
    g.fillStyle = CAM_DK;
    g.fillRect(-2, -78, 4, 10);
    g.fillStyle = CAM_LIT; g.globalAlpha = 0.25;
    g.beginPath(); g.ellipse(0, -80, 18, 3, 0, 0, 7); g.fill();
    g.globalAlpha = 0.5;
    g.beginPath(); g.ellipse(0, -80, 13, 2.2, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = CAM_OUT;
    g.beginPath(); g.arc(0, -80, 1.8, 0, 7); g.fill();

    // housing: outline, body, lit panels, seam, sunset rim
    g.fillStyle = CAM_OUT;
    g.beginPath(); g.roundRect(-16.5, -68.5, 33, 29, 7); g.fill();
    g.fillStyle = CAM_BODY;
    g.beginPath(); g.roundRect(-15, -67, 30, 26, 6); g.fill();
    g.fillStyle = CAM_LIT;
    g.beginPath(); g.roundRect(-15, -67, 30, 8, 6); g.fill();
    g.fillRect(-15, -63, 6, 20);
    g.strokeStyle = CAM_DK; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(2, -66); g.lineTo(2, -42); g.stroke();
    g.strokeStyle = CAM_RIM; g.lineWidth = 1.6; g.globalAlpha = 0.9;
    g.beginPath(); g.moveTo(-13, -67.5); g.lineTo(10, -67.5); g.stroke();
    g.globalAlpha = 1;

    // lens barrel + glass (iris kicks wide while charging)
    g.fillStyle = CAM_OUT;
    g.fillRect(13, -63.5, 11.5, 16);
    g.fillStyle = CAM_DK;
    g.fillRect(13, -62, 10, 13);
    g.fillStyle = CAM_OUT;
    g.beginPath(); g.arc(24.5, -55.5, 7.5, 0, 7); g.fill();
    g.fillStyle = CAM_GLASS;
    g.beginPath(); g.arc(24.5, -55.5, 6, 0, 7); g.fill();
    const irisKick = a.attackKey === 'windup' ? 1.8 + 0.7 * Math.sin(t * 18) : 0;
    g.strokeStyle = CAM_IRIS; g.lineWidth = 1.6;
    g.beginPath(); g.arc(24.5, -55.5, 3.8 + irisKick, 0, 7); g.stroke();
    g.fillStyle = CAM_WHITE;
    g.beginPath(); g.arc(22.5, -58, 1.8, 0, 7); g.fill();
    if (a.attackKey === 'windup') {
      // charge glint pulse
      g.fillStyle = CAM_WHITE; g.globalAlpha = 0.3 + 0.3 * Math.sin(t * 20);
      g.beginPath(); g.arc(24.5, -55.5, 5, 0, 7); g.fill();
      g.globalAlpha = 1;
    }

    // rear LED (blinks idle, forced solid while charging)
    const blinkOn = a.attackKey === 'windup' || Math.floor(t * 2.5) % 2 === 0;
    g.fillStyle = CAM_LED; g.globalAlpha = blinkOn ? 1 : 0.15;
    g.beginPath(); g.arc(-11, -71.5, 2, 0, 7); g.fill();
    if (blinkOn) {
      g.globalAlpha = 0.3;
      g.beginPath(); g.arc(-11, -71.5, 4.5, 0, 7); g.fill();
    }
    g.globalAlpha = 1;

    // speed readout: '88'
    g.fillStyle = CAM_SCREEN;
    g.fillRect(-11, -49, 13, 7);
    g.fillStyle = CAM_DIGIT;
    g.fillRect(-9, -47.5, 3, 4);
    g.fillRect(-4.5, -47.5, 3, 4);

    // faint amber downwash
    g.fillStyle = CAM_DIGIT; g.globalAlpha = 0.2;
    g.beginPath(); g.moveTo(-6, -40); g.lineTo(0, -29 - 2 * Math.sin(t * 8)); g.lineTo(6, -40); g.closePath(); g.fill();
    g.globalAlpha = 1;

    // muzzle flash while firing
    if (a.attackKey === 'strike') {
      g.fillStyle = CAM_WHITE; g.globalAlpha = 0.9;
      g.beginPath(); g.arc(24.5, -55.5, 11, 0, 7); g.fill();
      g.globalAlpha = 0.35;
      g.beginPath(); g.arc(24.5, -55.5, 18, 0, 7); g.fill();
      g.globalAlpha = 1;
    }

    // hurt sparks
    if (a.hurt) {
      g.strokeStyle = CAM_DIGIT; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(-10, -68); g.lineTo(-6, -64); g.stroke();
      g.beginPath(); g.moveTo(14, -46); g.lineTo(10, -42); g.stroke();
    }

    g.restore();
  };

  // =========================================================================
  // BOSS — ROAD RAGE the minivan. Called after translate/shadow/scale; the old
  // geometry anchors are preserved (wheels ±20,-6 r9-10; body roundRect
  // (-36,-46,72,38,6); cab (-26,-66,54,22,5)) so the hitbox reads identically.
  // =========================================================================
  BOSS.van = function (g, e, t) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const rev = e.state === 'windup' ? 1 : 0;

    // burnout smoke, rear = -x (2 extra puffs while revving)
    const nPuff = 4 + 2 * rev;
    for (let i = 0; i < nPuff; i++) {
      const px = -34 - i * 8 + Math.sin(t * 3 + i) * 2;
      const py = -10 - i * 6;
      const pr = 7 + i * 1.8 + Math.sin(t * 4 + i);
      g.fillStyle = VAN_SMOKE_A;
      g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
      g.fillStyle = VAN_SMOKE_B;
      g.beginPath(); g.arc(px - 2, py - 3, pr * 0.6, 0, 7); g.fill();
    }

    // wheels stay on the road, outside the body bounce; spin with walkCyc
    for (let wi = 0; wi < VAN_WHEEL_X.length; wi++) {
      g.save();
      g.translate(VAN_WHEEL_X[wi], -6);
      g.rotate((e.walkCyc || 0) * 2);
      g.fillStyle = VAN_TIRE_OUT;
      g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
      g.fillStyle = VAN_TIRE;
      g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
      g.fillStyle = VAN_CHROME;
      g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
      g.fillStyle = VAN_CHROME_DK;
      g.beginPath(); g.arc(0, 0, 4, 0, Math.PI); g.closePath(); g.fill();
      g.fillStyle = VAN_SPOKE;
      for (let k = 0; k < 3; k++) {
        g.rotate(Math.PI * 2 / 3);
        g.fillRect(-0.8, -3.8, 1.6, 2.2);
      }
      g.fillStyle = CAM_WHITE;
      g.beginPath(); g.arc(-1.5, -1.5, 1.2, 0, 7); g.fill();
      g.restore();
    }

    // body bounce: idle engine shudder, violent + nose-down under windup
    g.save();
    g.translate(e.state === 'strike' ? 4 : 0, Math.sin(t * (9 + 15 * rev)) * (0.8 + 0.8 * rev));
    g.rotate(0.03 * rev);

    // panels: outline then base
    g.fillStyle = VAN_OUT;
    g.beginPath(); g.roundRect(-37.5, -47.5, 75, 41, 7); g.fill();
    g.beginPath(); g.roundRect(-27.5, -67.5, 57, 25, 6); g.fill();
    g.fillStyle = VAN_BASE;
    g.beginPath(); g.roundRect(-36, -46, 72, 38, 6); g.fill();
    g.beginPath(); g.roundRect(-26, -66, 54, 22, 5); g.fill();

    // panel shading: lower band, wheel wells, rocker rust, dents
    g.fillStyle = VAN_SHADE;
    g.fillRect(-34, -18, 68, 10);
    g.strokeStyle = VAN_OUT; g.lineWidth = 2.5;
    g.beginPath(); g.arc(-20, -6, 11, Math.PI, 0); g.stroke();
    g.beginPath(); g.arc(20, -6, 11, Math.PI, 0); g.stroke();
    g.fillStyle = VAN_RUST; g.globalAlpha = 0.8;
    g.fillRect(-30, -11, 20, 3);
    g.beginPath(); g.arc(-8, -13, 1.6, 0, 7); g.fill();
    g.beginPath(); g.arc(24, -12, 1.4, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = VAN_SHADE; g.globalAlpha = 0.7;
    g.beginPath(); g.arc(-16, -30, 4, 0, 7); g.fill();
    g.beginPath(); g.arc(8, -24, 3, 0, 7); g.fill();
    g.globalAlpha = 1;

    // lit panels, sun top-left
    g.fillStyle = VAN_LITP;
    g.fillRect(-24, -65.5, 50, 4);
    g.beginPath(); g.moveTo(12, -46); g.lineTo(36, -46); g.lineTo(34, -38); g.lineTo(12, -38); g.closePath(); g.fill();
    g.fillRect(-34, -40, 44, 2.5);

    // windows + frames + the angry eyes in the rear panes
    g.fillStyle = VAN_GLASS;
    g.fillRect(-22, -62, 16, 13);
    g.fillRect(-2, -62, 14, 13);
    g.fillRect(16, -62, 9, 13);
    g.strokeStyle = VAN_OUT; g.lineWidth = 1.5;
    g.strokeRect(-22, -62, 16, 13);
    g.strokeRect(-2, -62, 14, 13);
    g.strokeRect(16, -62, 9, 13);
    g.fillStyle = VAN_HEAD;
    g.beginPath(); g.moveTo(-20, -59); g.lineTo(-8, -56); g.lineTo(-8, -53); g.lineTo(-20, -56); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, -56.5); g.lineTo(10, -59.5); g.lineTo(10, -56.5); g.lineTo(0, -53.5); g.closePath(); g.fill();

    // cracked windshield glare on the front pane
    g.fillStyle = VAN_GLARE; g.globalAlpha = 0.85;
    g.beginPath(); g.moveTo(17, -62); g.lineTo(20.5, -62); g.lineTo(18.5, -49); g.lineTo(16.5, -49); g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = VAN_CRACK; g.lineWidth = 1;
    g.beginPath(); g.moveTo(21, -56); g.lineTo(18, -60); g.stroke();
    g.beginPath(); g.moveTo(21, -56); g.lineTo(24, -59); g.stroke();
    g.beginPath(); g.moveTo(21, -56); g.lineTo(24, -52); g.stroke();
    g.beginPath(); g.moveTo(21, -56); g.lineTo(18.5, -51); g.stroke();
    g.beginPath(); g.arc(21, -56, 1, 0, 7); g.stroke();

    // headlight + glow cone (breathes; hotter while revving)
    g.fillStyle = VAN_HEAD;
    g.beginPath(); g.moveTo(30, -40); g.lineTo(38, -36); g.lineTo(30, -31); g.closePath(); g.fill();
    g.fillStyle = VAN_GLOW;
    g.globalAlpha = (0.2 + 0.08 * rev) * (0.9 + 0.1 * Math.sin(t * 7));
    g.beginPath(); g.moveTo(36, -40); g.lineTo(62, -31); g.lineTo(62, -17); g.lineTo(36, -31); g.closePath(); g.fill();
    g.fillStyle = VAN_HEAD; g.globalAlpha = 0.16;
    g.beginPath(); g.moveTo(36, -40); g.lineTo(52, -34.5); g.lineTo(52, -22.4); g.lineTo(36, -31); g.closePath(); g.fill();
    g.globalAlpha = 1;

    // taillight + brake glow (flares while revving)
    g.fillStyle = VAN_TAIL;
    g.fillRect(-36.5, -40, 3, 6);
    g.globalAlpha = 0.25 + 0.6 * rev;
    g.beginPath(); g.arc(-36, -37, 5, 0, 7); g.fill();
    g.globalAlpha = 1;

    // chrome + trim: bumper, grille, door seam, handle, mirror, antenna
    g.fillStyle = VAN_CHROME;
    g.fillRect(27, -30, 9, 4);
    g.fillStyle = VAN_CHROME_DK;
    g.fillRect(30, -36, 1.5, 4);
    g.fillRect(33, -36, 1.5, 4);
    g.strokeStyle = VAN_OUT; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-2, -44); g.lineTo(-2, -12); g.stroke();
    g.fillStyle = VAN_OUT;
    g.fillRect(-14, -38, 6, 2);
    g.fillStyle = VAN_BASE;
    g.fillRect(26, -53, 5, 4);
    g.lineWidth = 1.5;
    g.strokeRect(26, -53, 5, 4);
    g.fillStyle = VAN_MIRROR;
    g.fillRect(27, -52, 3, 2);
    g.strokeStyle = VAN_OUT; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(14, -66); g.lineTo(20, -78); g.stroke();
    g.fillStyle = VAN_OUT;
    g.beginPath(); g.arc(20, -78, 1.2, 0, 7); g.fill();

    // sunset rim light on the roof edge + hood lip
    g.strokeStyle = VAN_GLOW; g.globalAlpha = 0.9; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-24, -66.5); g.lineTo(24, -66.5); g.stroke();
    g.beginPath(); g.moveTo(30, -46.5); g.lineTo(36, -44); g.stroke();
    g.globalAlpha = 1;

    g.restore(); // end body bounce
  };
})();
