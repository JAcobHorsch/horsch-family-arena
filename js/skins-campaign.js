// skins-campaign.js — Campaign Chapter 1 cast: Super Todd's childhood home.
// My Pet Monster (plush grunt), Josh the older brother (knife sub-boss), and
// Damon the dad (final boss). Registered into window.ENEMY_BODIES /
// window.BOSS_BODIES; drawn in the local frame documented in game.js
// (feet at 0,0, y negative up, +x toward the player). Caller owns the
// transform, ground shadow and the flash/frozen overlays.
// Flat fills only — no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const B = (window.ENEMY_BODIES = window.ENEMY_BODIES || {});
  const BOSS = (window.BOSS_BODIES = window.BOSS_BODIES || {});

  // ---- MY PET MONSTER: blue-violet plush ----
  const PM_OUT = '#241a42';   // outline = fill hue darkened toward violet ink
  const PM_DK = '#3f2f6b';
  const PM_MID = '#6552a4';
  const PM_LT = '#8a76c6';
  const PM_HI = '#a996dd';
  const PM_SEAM = '#4d3c80';
  const PM_SHADE = 'rgba(36,26,66,0.22)';
  const PM_MZ_OUT = '#9c8455';
  const PM_MZ_DK = '#d8c69c';
  const PM_MZ_MID = '#f2e3bf';
  const PM_MZ_LT = '#fff7e2';
  const PM_TOOTH = '#fffaf0';
  const PM_TOOTH_DK = '#d0c3ac';
  const PM_MOUTH = '#5c2038';
  const PM_HORN_OUT = '#8a7548';
  const PM_HORN_MID = '#e0cf9e';
  const PM_HORN_LT = '#f6ecc8';
  const PM_EYE_W = '#fffdf6';
  const PM_CUFF_OUT = '#8a3408';
  const PM_CUFF_DK = '#c95410';
  const PM_CUFF_MID = '#ff7d1c';
  const PM_CUFF_LT = '#ffa752';
  const PM_CUFF_HI = '#ffd2a0';
  const PM_CHAIN_OUT = '#3d414d';
  const PM_CHAIN_MID = '#8a8e98';
  const PM_CHAIN_LT = '#c6cad4';
  const PM_TAG = '#f4f0e2';
  const PM_TAG_OUT = '#a89f86';
  const PM_TAG_LINE = '#8a8270';
  // shaggy edge tufts as flat triangles: baseA x,y / tip x,y / baseB x,y.
  // Drawn UNDER the body fills so only the tips clear the silhouette.
  const PM_TUFT = [
    -7.5, -39.5, -8.6, -45.0, -2.5, -42.0,
    0.0, -43.0, 2.0, -45.6, 5.5, -43.0,
    9.0, -42.0, 15.4, -44.6, 13.0, -39.5,
    13.5, -37.0, 21.5, -37.0, 14.0, -32.5,
    -8.0, -36.5, -16.0, -36.0, -7.5, -31.5,
    -7.5, -30.5, -14.5, -26.0, -3.5, -26.0,
    -14.0, -25.5, -22.5, -23.5, -14.5, -20.5,
    -15.5, -18.5, -23.5, -14.5, -14.5, -13.0,
    -14.5, -10.5, -21.5, -7.0, -13.0, -5.5,
    15.0, -24.5, 23.0, -22.5, 15.5, -19.5,
    15.5, -16.5, 23.5, -13.5, 14.5, -11.5,
    14.0, -9.0, 21.5, -5.5, 12.5, -4.5,
    -11.0, -33.5, -18.5, -31.0, -8.5, -28.5,
    14.5, -30.0, 22.0, -28.5, 15.0, -26.0,
  ];

  // ---- JOSH: lanky teenager ----
  const J_SKIN_OUT = '#8a5030';
  const J_SKIN_DK = '#c07f4f';
  const J_SKIN_MID = '#e8b083';
  const J_SKIN_LT = '#f8d3ab';
  const J_HAIR_DK = '#33210f';
  const J_HAIR_MID = '#57391d';
  const J_HAIR_LT = '#7d5530';
  const J_TEE_OUT = '#141220';
  const J_TEE_DK = '#221f2e';
  const J_TEE_MID = '#2f2b3c';
  const J_TEE_LT = '#453f56';
  const J_PRINT = '#ded8e8';
  const J_BOLT = '#ffd24a';
  const J_DENIM_OUT = '#1b2942';
  const J_DENIM_DK = '#2c4265';
  const J_DENIM_MID = '#3f5f8e';
  const J_DENIM_LT = '#5d80b1';
  const J_STITCH = '#d8c48a';
  const J_SHOE_OUT = '#5e5a52';
  const J_SHOE_DK = '#b4afa4';
  const J_SHOE_MID = '#eae5da';
  const J_SHOE_ACC = '#d43b2f';
  const J_SHOE_LACE = '#fbf8f0';
  const J_EYE = '#3a2a18';
  const K_BLADE_OUT = '#666a76';
  const K_BLADE_MID = '#c4c9d4';
  const K_BLADE_LT = '#eef1f7';
  const K_EDGE = '#ffffff';
  const K_HAND_OUT = '#1a120c';
  const K_HAND_MID = '#3b2a1e';
  const K_RIVET = '#c2ad82';

  // ---- DAMON: heavy-set dad, rendered as heat ----
  const D_SKIN_OUT = '#71401f';
  const D_SKIN_DK = '#a8703f';
  const D_SKIN_MID = '#d69d6c';
  const D_SKIN_LT = '#efc094';
  const D_FLUSH_LO = 'rgba(198,44,28,0.17)';
  const D_FLUSH_MID = 'rgba(206,42,24,0.29)';
  const D_FLUSH_HOT = 'rgba(255,64,28,0.4)';
  const D_HEAT_A = 'rgba(255,140,70,0.34)';
  const D_HEAT_B = 'rgba(255,176,112,0.2)';
  const D_SNARL = '#3a1a14';
  const D_TEETH = '#f4ece0';
  const D_EYE_GLOW = 'rgba(255,72,28,0.34)';
  const D_EYE_SOCKET = 'rgba(92,26,14,0.45)';
  const D_EYE_CORE = '#ff6a2a';
  const D_EYE_HI = '#ffdcae';
  const D_SHIRT_OUT = '#8f897a';
  const D_SHIRT_DK = '#c2bcac';
  const D_SHIRT_MID = '#e9e4d8';
  const D_SHIRT_LT = '#fbf8f0';
  const D_PJ_OUT = '#161c30';
  const D_PJ_DK = '#26304c';
  const D_PJ_MID = '#394463';
  const D_PJ_LT = '#525e82';
  const D_PJ_RED = '#7e3a44';
  const D_HAIR_DK = '#3d3229';
  const D_HAIR_MID = '#655648';
  const D_BROW = '#4a3a2a';
  // shimmer stalks off the shoulders: x, baseY, phase (kept outboard of the head)
  const D_HEAT = [-27, -76, 0, -19, -80, 1.7, 17, -80, 3.3, 25, -74, 4.8];

  // ======================= MY PET MONSTER (helpers) =======================
  // One shackled plush arm: limb, mitt, orange cuff, broken chain link.
  // The link hangs in BODY space (not the cuff's rotated frame) so it always
  // dangles downward regardless of arm angle.
  function pmArm(g, sx, sy, hx, hy, fill, lit) {
    g.strokeStyle = PM_OUT; g.lineWidth = 11;
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + hx) * 0.5, (sy + hy) * 0.5 + 4, hx, hy); g.stroke();
    g.strokeStyle = fill; g.lineWidth = 7.5;
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + hx) * 0.5, (sy + hy) * 0.5 + 4, hx, hy); g.stroke();

    const ang = Math.atan2(hy - sy, hx - sx);
    const wx = hx - Math.cos(ang) * 5.5, wy = hy - Math.sin(ang) * 5.5;

    // mitt
    g.fillStyle = fill; g.strokeStyle = PM_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.arc(hx, hy, 5.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = lit;
    g.beginPath(); g.arc(hx - 1.7, hy - 1.9, 2.3, 0, 7); g.fill();

    // the signature orange plastic shackle
    g.save();
    g.translate(wx, wy); g.rotate(ang);
    g.fillStyle = PM_CUFF_MID; g.strokeStyle = PM_CUFF_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.roundRect(-3.6, -6.4, 7.2, 12.8, 2.6); g.fill(); g.stroke();
    g.fillStyle = PM_CUFF_LT; g.fillRect(-2.7, -5.2, 2.1, 10.4);
    g.fillStyle = PM_CUFF_HI; g.fillRect(-2.7, -5.2, 2.1, 3.4);
    g.fillStyle = PM_CUFF_DK; g.fillRect(1.1, -5.2, 1.7, 10.4);
    g.restore();

    // short broken link — an open arc reads as snapped chain. Kept tight to the
    // cuff so a low fist pose cannot swing it under the ground plane.
    g.strokeStyle = PM_CHAIN_OUT; g.lineWidth = 3;
    g.beginPath(); g.arc(wx + 1, wy + 7.4, 2.9, 0.55, 5.85); g.stroke();
    g.strokeStyle = PM_CHAIN_MID; g.lineWidth = 1.8;
    g.beginPath(); g.arc(wx + 1, wy + 7.4, 2.9, 0.55, 5.85); g.stroke();
    g.strokeStyle = PM_CHAIN_LT; g.lineWidth = 0.9;
    g.beginPath(); g.arc(wx + 1, wy + 7.4, 2.9, 3.5, 4.6); g.stroke();
  }

  // ============================ MY PET MONSTER ============================
  B.petmonster = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT;
    const windup = a.attackKey === 'windup', strike = a.attackKey === 'strike';
    const step = Math.sin(a.walkCyc);
    const bob = a.moving ? Math.abs(step) * 2.2 : Math.sin(t * 1.6) * 0.7;
    let tilt = a.moving ? step * 0.06 : 0;
    if (windup) tilt = -0.17;
    else if (strike) tilt = 0.2;
    if (a.hurt) tilt = -0.22;

    // 1 stubby plush feet — planted, never ride the waddle
    const fx = a.moving ? step * 6 : 0;
    const flift = a.moving ? Math.max(0, step) * 3 : 0;
    const blift = a.moving ? Math.max(0, -step) * 3 : 0;
    g.fillStyle = PM_DK; g.strokeStyle = PM_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.roundRect(-16 - fx, -7 - blift, 14, 7, 3.4); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(3 + fx, -7 - flift, 15, 7, 3.4); g.fill(); g.stroke();
    g.fillStyle = PM_LT;
    g.beginPath(); g.ellipse(-9 - fx, -3.4 - blift, 3.6, 2, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(11 + fx, -3.4 - flift, 3.6, 2, 0, 0, 7); g.fill();

    // everything above waddles and rocks about the hips
    g.translate(0, -bob);
    g.translate(0, -14); g.rotate(tilt); g.translate(0, 14);

    // 2 fur tufts first — the fills below bury their bases, tips stay shaggy
    g.fillStyle = PM_MID; g.strokeStyle = PM_OUT; g.lineWidth = 2.4;
    for (let i = 0; i < 84; i += 6) {
      g.beginPath();
      g.moveTo(PM_TUFT[i], PM_TUFT[i + 1]);
      g.lineTo(PM_TUFT[i + 2], PM_TUFT[i + 3]);
      g.lineTo(PM_TUFT[i + 4], PM_TUFT[i + 5]);
      g.closePath(); g.fill(); g.stroke();
    }

    // 3 arm poses — loose swing, then the two-fisted overhead slam
    let fhx = 16, fhy = -12, bhx = -16, bhy = -12;
    if (windup) { fhx = 7; fhy = -45; bhx = -15; bhy = -42; }
    else if (strike) { fhx = 23; fhy = -12; bhx = 5; bhy = -14; }
    else if (a.hurt) { fhx = 12; fhy = -21; bhx = -17; bhy = -18; }
    else if (a.moving) {
      fhx = 16 - step * 5; fhy = -12 - Math.abs(step) * 2;
      bhx = -16 + step * 5; bhy = -12 - Math.abs(step) * 2;
    }
    pmArm(g, -12, -26, bhx, bhy, PM_DK, PM_MID);

    // 4 small plush ears, tucked behind the head
    g.fillStyle = PM_DK; g.strokeStyle = PM_OUT; g.lineWidth = 2;
    g.beginPath(); g.arc(-7, -38, 4.4, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(14, -37, 4.4, 0, 7); g.fill(); g.stroke();

    // 5 lumpy stuffed torso
    g.fillStyle = PM_MID; g.strokeStyle = PM_OUT; g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(-14, -4);
    g.quadraticCurveTo(-18, -13, -15, -20);
    g.quadraticCurveTo(-16, -27, -9, -30);
    g.lineTo(10, -30);
    g.quadraticCurveTo(17, -26, 15, -19);
    g.quadraticCurveTo(19, -11, 13, -4);
    g.closePath(); g.fill(); g.stroke();
    // belly light (top-left key) + hand-authored shade wedge on the sun-away edge
    g.fillStyle = PM_LT;
    g.beginPath(); g.ellipse(-3, -18, 7.5, 8.5, 0, 0, 7); g.fill();
    g.fillStyle = PM_DK;
    g.beginPath();
    g.moveTo(15, -19);
    g.quadraticCurveTo(19, -11, 13, -4);
    g.lineTo(7, -4);
    g.quadraticCurveTo(13, -11, 9.5, -20);
    g.closePath(); g.fill();
    g.strokeStyle = PM_HI; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-13, -24); g.quadraticCurveTo(-16, -17, -13.5, -10); g.stroke();
    if (a.elite) { // elite tell: a second lit rim down the shaded flank
      g.strokeStyle = PM_HI; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(14, -22); g.quadraticCurveTo(17.5, -13, 12.5, -6); g.stroke();
    }
    // 6 stitched seams — spaced ticks, no setLineDash
    g.strokeStyle = PM_SEAM; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(1, -29); g.lineTo(1, -26);
    g.moveTo(1, -24); g.lineTo(1, -21);
    g.moveTo(1, -19); g.lineTo(1, -16);
    g.moveTo(1, -14); g.lineTo(1, -11);
    g.moveTo(1, -9); g.lineTo(1, -6);
    g.moveTo(-11, -27); g.lineTo(-9, -25);
    g.moveTo(-8, -23); g.lineTo(-6, -21);
    g.stroke();
    // 7 toy tag on the hip
    g.save();
    g.translate(-13, -13); g.rotate(0.38);
    g.fillStyle = PM_TAG; g.strokeStyle = PM_TAG_OUT; g.lineWidth = 1;
    g.beginPath(); g.rect(-2.6, 0, 5.2, 7); g.fill(); g.stroke();
    g.strokeStyle = PM_TAG_LINE; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-1.6, 2); g.lineTo(1.6, 2);
    g.moveTo(-1.6, 4); g.lineTo(1.6, 4);
    g.stroke();
    g.restore();

    // 8 head — cast a contact shadow first or the head and torso read as one lump
    g.fillStyle = PM_SHADE;
    g.beginPath(); g.ellipse(3, -25, 10.5, 3.6, 0, 0, 7); g.fill();
    g.fillStyle = PM_MID; g.strokeStyle = PM_OUT; g.lineWidth = 2.8;
    g.beginPath(); g.ellipse(3, -33.5, 11.5, 10.5, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(3, -33.5, 11.5, 10.5, 0, 0, 7); g.clip();
    g.fillStyle = PM_SHADE; g.fillRect(9, -45, 8, 24);
    g.fillStyle = PM_LT;
    g.beginPath(); g.ellipse(-3, -40, 6, 4, -0.4, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = PM_SEAM; g.lineWidth = 1.2; // head seam
    g.beginPath();
    g.moveTo(-5, -41); g.lineTo(-3.4, -39);
    g.moveTo(-1.8, -37.6); g.lineTo(-0.6, -35.4);
    g.stroke();

    // 9 stubby horns
    g.fillStyle = PM_HORN_MID; g.strokeStyle = PM_HORN_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-8.5, -40.5); g.lineTo(-6, -45); g.lineTo(-1.5, -41.5); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(7.5, -42); g.lineTo(11, -45.3); g.lineTo(14.5, -40.5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = PM_HORN_LT;
    g.beginPath(); g.moveTo(-8.5, -40.5); g.lineTo(-6, -45); g.lineTo(-4.6, -41); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(7.5, -42); g.lineTo(11, -45.3); g.lineTo(11, -41); g.closePath(); g.fill();

    // 10 big cream muzzle
    g.fillStyle = PM_MZ_MID; g.strokeStyle = PM_MZ_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(9, -30.5, 10.5, 8, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = PM_MZ_LT;
    g.beginPath(); g.ellipse(5.5, -33.5, 4.5, 2.8, -0.3, 0, 7); g.fill();
    g.fillStyle = PM_MZ_DK;
    g.beginPath(); g.ellipse(13, -25.5, 4.5, 2.4, 0.3, 0, 7); g.fill();
    g.fillStyle = PM_MZ_OUT;
    g.beginPath(); g.ellipse(12, -35.2, 2.2, 1.4, 0, 0, 7); g.fill();

    // 11 wide toothy grin
    g.fillStyle = PM_MOUTH;
    g.beginPath();
    g.moveTo(0.5, -32);
    g.quadraticCurveTo(9.5, -33.5, 18.5, -31);
    g.quadraticCurveTo(10, -22, 0.5, -32);
    g.closePath(); g.fill();
    g.fillStyle = PM_TOOTH; // upper row as one zigzag band
    g.beginPath();
    g.moveTo(1.8, -33.6); g.lineTo(17.8, -32.8); g.lineTo(17.4, -30.4);
    g.lineTo(15.2, -32.2); g.lineTo(12.8, -29.8); g.lineTo(10.2, -32.4);
    g.lineTo(7.6, -29.8); g.lineTo(5, -32.6); g.lineTo(2.6, -30.4);
    g.closePath(); g.fill();
    g.fillStyle = PM_TOOTH; g.strokeStyle = PM_TOOTH_DK; g.lineWidth = 1.1;
    g.beginPath(); // two blunt fangs riding up over the lower lip
    g.moveTo(4, -24.8); g.lineTo(4.4, -30.4);
    g.quadraticCurveTo(6.4, -31.2, 7.6, -30.1);
    g.lineTo(8.4, -24.8);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(12, -25.2); g.lineTo(12.4, -30.7);
    g.quadraticCurveTo(14.4, -31.4, 15.6, -30.3);
    g.lineTo(16.2, -25.4);
    g.closePath(); g.fill(); g.stroke();

    // 12 large round eyes, small pupils
    if (a.hurt) {
      g.strokeStyle = PM_OUT; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-2.6, -41); g.lineTo(2.6, -36);
      g.moveTo(2.6, -41); g.lineTo(-2.6, -36);
      g.moveTo(7.2, -41.4); g.lineTo(12.6, -36.4);
      g.moveTo(12.6, -41.4); g.lineTo(7.2, -36.4);
      g.stroke();
    } else {
      g.fillStyle = PM_EYE_W; g.strokeStyle = PM_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.arc(0, -38.5, 4.2, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(10, -39, 4.4, 0, 7); g.fill(); g.stroke();
      g.fillStyle = PM_OUT;
      g.beginPath(); g.arc(1.4, -38.5, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(11.4, -39, 1.5, 0, 7); g.fill();
      g.fillStyle = PM_EYE_W;
      g.beginPath(); g.arc(0.8, -39.4, 0.6, 0, 7); g.fill();
      g.beginPath(); g.arc(10.8, -39.9, 0.6, 0, 7); g.fill();
      if (windup) { // plush brow drops into a glare
        g.fillStyle = PM_MID;
        g.fillRect(-4.2, -42.6, 8.4, 2.6);
        g.fillRect(5.8, -43, 8.4, 2.6);
      }
    }
    g.strokeStyle = PM_DK; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-4, -43); g.lineTo(2, -41.6);
    g.moveTo(14, -43.6); g.lineTo(8, -42.2);
    g.stroke();

    // 13 front arm last so the shackled fist stays on top
    pmArm(g, 13, -26, fhx, fhy, PM_MID, PM_LT);
  };

  // ============================== JOSH (helpers) ==========================
  function joshShoe(g, x, y, body) {
    g.fillStyle = body; g.strokeStyle = J_SHOE_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(x - 7, y - 9, 18, 9, 3); g.fill(); g.stroke();
    g.fillStyle = J_SHOE_DK;
    g.beginPath(); g.roundRect(x - 7.4, y - 3.6, 18.8, 3.6, 1.8); g.fill();
    g.fillStyle = J_SHOE_ACC;
    g.beginPath();
    g.moveTo(x - 4, y - 5); g.lineTo(x + 5.5, y - 8); g.lineTo(x + 5.5, y - 6);
    g.lineTo(x - 4, y - 3.4); g.closePath(); g.fill();
    g.strokeStyle = J_SHOE_LACE; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 2.5, y - 8.6); g.lineTo(x + 1, y - 6.6);
    g.moveTo(x + 1, y - 8.6); g.lineTo(x - 2.5, y - 6.6);
    g.stroke();
  }

  function joshArm(g, sx, sy, ex, ey, hx, hy, mid, lit) {
    g.strokeStyle = J_SKIN_OUT; g.lineWidth = 7.5;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = mid; g.lineWidth = 5;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = lit; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(sx - 1, sy + 1); g.lineTo(ex - 1.4, ey - 1); g.stroke();
    g.fillStyle = mid; g.strokeStyle = J_SKIN_OUT; g.lineWidth = 1.8;
    g.beginPath(); g.arc(hx, hy, 3.6, 0, 7); g.fill(); g.stroke();
  }

  // ordinary chef's knife: straight spine, curved belly, dark riveted handle
  function joshKnife(g, x, y, ang) {
    g.save();
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = K_HAND_MID; g.strokeStyle = K_HAND_OUT; g.lineWidth = 1.6;
    g.beginPath(); g.roundRect(-12, -2.7, 14, 5.4, 2.2); g.fill(); g.stroke();
    g.fillStyle = K_RIVET;
    g.beginPath(); g.arc(-8.6, 0, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(-4.8, 0, 0.9, 0, 7); g.fill();
    g.fillStyle = K_BLADE_OUT;
    g.beginPath(); g.roundRect(1.4, -3.6, 3.2, 7.2, 1.2); g.fill();
    g.fillStyle = K_BLADE_MID; g.strokeStyle = K_BLADE_OUT; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(4, -3.3);
    g.lineTo(25, -2.4);
    g.quadraticCurveTo(29.5, -1.1, 25.5, 1.5);
    g.quadraticCurveTo(15.5, 4.4, 4, 3.3);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = K_BLADE_LT; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(6, -1.5); g.lineTo(23, -0.7); g.stroke();
    g.strokeStyle = K_EDGE; g.lineWidth = 1.2; // the lit edge
    g.beginPath(); g.moveTo(5.5, 3.1); g.quadraticCurveTo(15.5, 4.1, 25.4, 1.4); g.stroke();
    g.restore();
  }

  // ================================== JOSH ================================
  // Boss bodies are invoked as (g, e, t) by game.js drawBoss with the raw
  // entity, so read both that shape and the documented skinCtx shape.
  BOSS.josh = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const sway = Math.sin(t * 1.6);                  // cocky idle
    const bob = moving ? Math.abs(step) * 2 : sway * 0.8;
    let lean = moving ? step * 1.2 : sway * 0.9;
    if (windup) lean = -4.5;
    else if (strike) lean = 5.5;
    if (hurt) lean = -7;

    // 1 sneakers + skinny jeans (feet planted, torso rides the sway)
    const fx = moving ? step * 9 : 0;
    const flift = moving ? Math.max(0, step) * 5 : 0;
    const blift = moving ? Math.max(0, -step) * 5 : 0;
    const bax = -5 - fx, bay = -blift;
    const fax = 6 + fx, fay = -flift;
    g.strokeStyle = J_DENIM_OUT; g.lineWidth = 12;
    g.beginPath(); g.moveTo(-4, -42); g.lineTo(bax, bay - 7); g.stroke();
    g.strokeStyle = J_DENIM_DK; g.lineWidth = 9;
    g.beginPath(); g.moveTo(-4, -42); g.lineTo(bax, bay - 7); g.stroke();
    joshShoe(g, bax, bay, J_SHOE_DK);
    g.strokeStyle = J_DENIM_OUT; g.lineWidth = 13;
    g.beginPath(); g.moveTo(5, -42); g.lineTo(fax, fay - 7); g.stroke();
    g.strokeStyle = J_DENIM_MID; g.lineWidth = 10;
    g.beginPath(); g.moveTo(5, -42); g.lineTo(fax, fay - 7); g.stroke();
    g.strokeStyle = J_DENIM_LT; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(1.5, -40); g.lineTo(fax - 3.5, fay - 10); g.stroke();
    g.strokeStyle = J_STITCH; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(9, -40); g.lineTo(fax + 4, fay - 10); g.stroke();
    joshShoe(g, fax, fay, J_SHOE_MID);

    g.translate(0, -bob);
    g.translate(0, -44); g.rotate(lean * 0.012); g.translate(0, 44);

    // 2 hip / waistband
    g.fillStyle = J_DENIM_MID; g.strokeStyle = J_DENIM_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.roundRect(-11, -50, 24, 10, 3); g.fill(); g.stroke();
    g.fillStyle = J_DENIM_LT; g.fillRect(-10, -49, 4, 8);
    g.fillStyle = J_DENIM_OUT; g.fillRect(-11, -50, 24, 2.4);

    // 3 back arm hangs slack — kept outboard of the torso edge (x=-12) so the
    // short sleeve isn't left hanging over empty space
    const bhx = hurt ? -18 : -16 + lean * 0.3, bhy = hurt ? -50 : -46;
    joshArm(g, -11, -66, -17, -57, bhx, bhy, J_SKIN_DK, J_SKIN_MID);

    // 4 narrow band tee — lanky, half the standard chest width
    g.fillStyle = J_TEE_MID; g.strokeStyle = J_TEE_OUT; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-11, -43);
    g.lineTo(-12, -64);
    g.quadraticCurveTo(-13, -70, -6, -71);
    g.lineTo(8, -71);
    g.quadraticCurveTo(15, -70, 14, -64);
    g.lineTo(12, -43);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = J_TEE_LT; // top-left key down the near edge
    g.beginPath();
    g.moveTo(-11, -45); g.lineTo(-11.6, -65);
    g.quadraticCurveTo(-12.4, -70, -6, -71);
    g.lineTo(-3, -71); g.lineTo(-5.5, -45);
    g.closePath(); g.fill();
    g.fillStyle = J_TEE_DK;
    g.beginPath();
    g.moveTo(12, -46); g.lineTo(13.6, -64); g.lineTo(9, -64); g.lineTo(8, -46);
    g.closePath(); g.fill();
    // collar + short sleeves
    g.strokeStyle = J_TEE_DK; g.lineWidth = 2.4;
    g.beginPath(); g.arc(1, -71, 5.5, 0.15, 2.99); g.stroke();
    g.fillStyle = J_TEE_DK; g.strokeStyle = J_TEE_OUT; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-15, -70, 8, 11, 3); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(9, -70, 9, 12, 3); g.fill(); g.stroke();
    g.fillStyle = J_TEE_MID; g.fillRect(10.2, -68.8, 6.6, 4);
    // band print: no real mark — a burst ring with a bolt through it
    g.fillStyle = J_PRINT;
    g.beginPath(); g.arc(1, -60, 6.8, 0, 7); g.fill();
    g.fillStyle = J_TEE_MID;
    g.beginPath(); g.arc(1, -60, 5.2, 0, 7); g.fill();
    g.fillStyle = J_BOLT;
    g.beginPath();
    g.moveTo(3.4, -65); g.lineTo(-1.6, -59.6); g.lineTo(1.2, -59.2);
    g.lineTo(-1, -54.8); g.lineTo(4.4, -60.6); g.lineTo(1.4, -61);
    g.closePath(); g.fill();
    g.fillStyle = J_PRINT;
    g.fillRect(-5, -51.6, 12, 1.9);
    g.fillRect(-3, -48.4, 8, 1.4);

    // 5 neck + head
    g.fillStyle = J_SKIN_DK; g.strokeStyle = J_SKIN_OUT; g.lineWidth = 2;
    g.beginPath(); g.rect(-1, -76, 7, 8); g.fill(); g.stroke();
    g.fillStyle = J_SKIN_MID; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(3, -81, 8, 9.5, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(3, -81, 8, 9.5, 0, 0, 7); g.clip();
    g.fillStyle = J_SKIN_LT;
    g.beginPath(); g.ellipse(-1, -85, 5, 4, -0.4, 0, 7); g.fill();
    g.fillStyle = J_SKIN_DK; g.fillRect(8, -92, 5, 22);
    g.restore();
    g.fillStyle = J_SKIN_DK; g.strokeStyle = J_SKIN_OUT; g.lineWidth = 1.4; // ear
    g.beginPath(); g.arc(-4.5, -80.5, 2.6, 0, 7); g.fill(); g.stroke();

    // 6 the permanent smirk — one corner hitched, the whole read
    if (hurt) {
      g.strokeStyle = J_SKIN_OUT; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-0.5, -83.5); g.lineTo(2.5, -80.7);
      g.moveTo(2.5, -83.5); g.lineTo(-0.5, -80.7);
      g.moveTo(6, -83.8); g.lineTo(9, -81);
      g.moveTo(9, -83.8); g.lineTo(6, -81);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(2, -82.4, 2.4, 2, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(8.2, -82.6, 2.2, 1.9, 0, 0, 7); g.fill();
      g.fillStyle = J_EYE;
      g.beginPath(); g.arc(2.8, -82.4, 1.2, 0, 7); g.fill();
      g.beginPath(); g.arc(9, -82.6, 1.2, 0, 7); g.fill();
      g.fillStyle = J_SKIN_MID; // half lids: bored, cocky
      g.fillRect(-0.6, -84.8, 5.2, 1.9);
      g.fillRect(5.8, -85, 4.8, 1.9);
    }
    g.strokeStyle = J_HAIR_DK; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-1, -86); g.lineTo(4.2, -85.2);
    g.moveTo(6.4, -85.4); g.lineTo(10.8, -86.4);
    g.stroke();
    g.strokeStyle = J_SKIN_OUT; g.lineWidth = 1.5; // nose
    g.beginPath(); g.moveTo(9.4, -81.6); g.lineTo(11, -79.2); g.lineTo(8.6, -78.8); g.stroke();
    g.strokeStyle = J_SKIN_OUT; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(1.4, -76.4); g.quadraticCurveTo(5.4, -75.4, 9.2, -78); g.stroke();

    // 7 scruffy mop
    // one mass with a carved fringe — overlapping circles buried his eyes
    g.fillStyle = J_HAIR_MID;
    g.beginPath();
    g.moveTo(-8.8, -78.5);
    g.quadraticCurveTo(-11.6, -86, -7, -90.6);
    g.quadraticCurveTo(-1, -93.6, 6.5, -91.4);
    g.quadraticCurveTo(12, -89.4, 12.6, -83.5);
    g.quadraticCurveTo(10.6, -86.6, 6, -87);     // fringe underside sits on the brow
    g.quadraticCurveTo(-1, -87.4, -5.6, -85.8);
    g.quadraticCurveTo(-8.2, -84.2, -8.8, -78.5);
    g.closePath(); g.fill();
    // broad clumps, FILL ONLY — an outline made each one read as a separate ear
    g.fillStyle = J_HAIR_MID;
    g.beginPath(); g.moveTo(-8, -88.4); g.lineTo(-9.8, -91.6); g.lineTo(-1.6, -91); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-2.4, -91.4); g.lineTo(0.4, -93.4); g.lineTo(5.4, -91.6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(5.2, -90.6); g.lineTo(11.2, -91.4); g.lineTo(10.4, -87); g.closePath(); g.fill();
    g.fillStyle = J_HAIR_DK; // parting shade gives the mass form instead
    g.beginPath();
    g.moveTo(-7.4, -85.4);
    g.quadraticCurveTo(-9.6, -88.4, -8.2, -80.5);
    g.quadraticCurveTo(-6.4, -84.6, -4.6, -85.6);
    g.closePath(); g.fill();
    g.strokeStyle = J_HAIR_LT; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-5.5, -87.8); g.quadraticCurveTo(0.5, -91.4, 7.5, -88.8); g.stroke();

    // 8 lead hand + the kitchen knife
    let khx = 17, khy = -54, kex = 15, key = -62, kang = -0.28;
    if (windup) { khx = -3; khy = -78; kex = 3; key = -70; kang = -2.5; }
    else if (strike) { khx = 30; khy = -57; kex = 20; key = -64; kang = 0.42; }
    else if (hurt) { khx = 13; khy = -46; kex = 14; key = -58; kang = 0.9; }
    else { khx = 17 + sway * 1.4; khy = -54; }
    joshArm(g, 10, -66, kex, key, khx, khy, J_SKIN_MID, J_SKIN_LT);
    joshKnife(g, khx, khy, kang);
  };

  // ============================= DAMON (helpers) ==========================
  function damonArm(g, sx, sy, ex, ey, hx, hy, r, mid, dk) {
    g.strokeStyle = D_SKIN_OUT; g.lineWidth = 13.5;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    g.strokeStyle = mid; g.lineWidth = 10.5;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    // forearm carries the extra mass — the thick-forearm read
    g.strokeStyle = D_SKIN_OUT; g.lineWidth = 14.5;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = dk; g.lineWidth = 11.5;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = mid; g.lineWidth = 7.5;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.fillStyle = mid; g.strokeStyle = D_SKIN_OUT; g.lineWidth = 2.4;
    g.beginPath(); g.arc(hx, hy, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = D_SKIN_LT;
    g.beginPath(); g.arc(hx - r * 0.32, hy - r * 0.36, r * 0.4, 0, 7); g.fill();
    g.strokeStyle = D_SKIN_OUT; g.lineWidth = 1.4; // clenched knuckles
    g.beginPath();
    g.moveTo(hx + r * 0.18, hy - r * 0.72); g.lineTo(hx + r * 0.76, hy - r * 0.28);
    g.moveTo(hx + r * 0.08, hy); g.lineTo(hx + r * 0.86, hy);
    g.moveTo(hx + r * 0.18, hy + r * 0.72); g.lineTo(hx + r * 0.76, hy + r * 0.28);
    g.stroke();
  }

  function damonLeg(g, topX, ankX, ankY, mid, lit) {
    g.beginPath();
    g.moveTo(topX - 12, -48);
    g.lineTo(topX + 12, -48);
    g.quadraticCurveTo(ankX + 11, -26, ankX + 9, ankY - 8);
    g.lineTo(ankX - 9, ankY - 8);
    g.quadraticCurveTo(topX - 13, -26, topX - 12, -48);
    g.closePath();
    g.fillStyle = mid; g.fill();
    g.strokeStyle = D_PJ_OUT; g.lineWidth = 2.6; g.stroke();
    g.save();
    g.clip(); // current path survives save/clip — plaid stays inside the leg
    g.strokeStyle = D_PJ_RED; g.lineWidth = 2.6;
    for (let i = 0; i < 3; i++) {
      const px = topX - 7 + i * 7;
      g.beginPath(); g.moveTo(px, -50); g.lineTo(px + (ankX - topX) * 0.85, ankY - 6); g.stroke();
    }
    g.strokeStyle = lit; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const py = -44 + i * 10;
      g.beginPath(); g.moveTo(topX - 15, py); g.lineTo(topX + 15, py); g.stroke();
    }
    g.restore();
    // bare foot
    g.fillStyle = D_SKIN_MID; g.strokeStyle = D_SKIN_OUT; g.lineWidth = 2.2;
    g.beginPath(); g.roundRect(ankX - 9, ankY - 8, 21, 8, 3); g.fill(); g.stroke();
    g.fillStyle = D_SKIN_LT;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(ankX + 4 + i * 2.6, ankY - 2.6, 1.3, 0, 7); g.fill();
    }
  }

  // ================================= DAMON ================================
  BOSS.damon = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT || 0;
    const st = a.attackKey || a.state;
    const windup = st === 'windup', strike = st === 'strike';
    const hurt = a.hurt === true || a.hurtT > 0;
    const moving = a.moving === true || a.state === 'approach';
    const step = Math.sin(a.walkCyc || 0);
    const breath = Math.sin(t * 2.2);                 // heavy breathing
    const chest = breath * 1.7;
    const rage = windup ? 1 : strike ? 0.85 : 0.42 + 0.18 * breath;
    const clench = 0.5 * Math.sin(t * 2.2 + 0.6);
    const bob = moving ? Math.abs(step) * 2.4 : breath * 0.6;
    let lean = moving ? step * 1.4 : 0;
    if (windup) lean = -5;
    else if (strike) lean = 7;
    if (hurt) lean = -6;

    // 1 heat shimmer rising off the shoulders, behind everything
    g.lineWidth = 1.5;
    for (let i = 0; i < 12; i += 3) {
      const hx = D_HEAT[i], hy = D_HEAT[i + 1], ph = D_HEAT[i + 2];
      const wob = Math.sin(t * 3 + ph) * 2.6;
      g.strokeStyle = D_HEAT_A;
      g.beginPath();
      g.moveTo(hx, hy);
      g.quadraticCurveTo(hx + wob, hy - 7, hx - wob, hy - 13);
      g.stroke();
      g.strokeStyle = D_HEAT_B; // capped so the shimmer tops out at his crown
      g.beginPath();
      g.moveTo(hx - wob, hy - 13);
      g.quadraticCurveTo(hx + wob * 1.3, hy - 19, hx - wob, hy - 24);
      g.stroke();
    }
    if (windup) { // the air boils harder as he cocks the fist
      g.strokeStyle = D_HEAT_A; g.lineWidth = 2.2;
      for (let i = 0; i < 12; i += 3) {
        const hx = D_HEAT[i], hy = D_HEAT[i + 1];
        const wob = Math.sin(t * 7 + D_HEAT[i + 2]) * 3.6;
        g.beginPath();
        g.moveTo(hx, hy - 4);
        g.quadraticCurveTo(hx + wob, hy - 13, hx - wob, hy - 22);
        g.stroke();
      }
    }

    // 2 baggy pajama legs + bare feet (planted)
    const fx = moving ? step * 8 : 0;
    const flift = moving ? Math.max(0, step) * 4 : 0;
    const blift = moving ? Math.max(0, -step) * 4 : 0;
    damonLeg(g, -11, -12 - fx, -blift, D_PJ_DK, D_PJ_MID);
    damonLeg(g, 11, 10 + fx, -flift, D_PJ_MID, D_PJ_LT);
    g.fillStyle = D_PJ_DK; g.strokeStyle = D_PJ_OUT; g.lineWidth = 2.6;
    g.beginPath(); g.roundRect(-23, -52, 46, 9, 3); g.fill(); g.stroke();
    g.strokeStyle = D_PJ_LT; g.lineWidth = 1.6; // drawstring
    g.beginPath(); g.moveTo(-4, -47); g.quadraticCurveTo(1, -43, 6, -47); g.stroke();

    g.translate(0, -bob);
    g.translate(0, -48); g.rotate(lean * 0.011); g.translate(0, 48);

    // 3 back arm
    const bfr = 7 + clench * 0.6;
    damonArm(g, -19, -72, -25, -62, -24 - lean * 0.3, -52, bfr, D_SKIN_DK, D_SKIN_OUT);

    // 4 thick neck — drawn UNDER the shirt so the scoop frames the throat
    // instead of the neck reading as a slab laid over the chest
    g.fillStyle = D_SKIN_DK;
    g.beginPath();
    g.moveTo(-10, -68);
    g.quadraticCurveTo(-5.5, -77, -4.5, -86);
    g.lineTo(9.5, -86);
    g.quadraticCurveTo(10.5, -77, 15, -68);
    g.closePath(); g.fill();
    g.save();
    g.clip(); // flush hottest at the base, cooled off before the jaw
    g.fillStyle = D_FLUSH_MID;
    g.beginPath(); g.ellipse(2.5, -73, 12, 8, 0, 0, 7); g.fill();
    g.globalAlpha = rage;
    g.fillStyle = D_FLUSH_HOT;
    g.beginPath(); g.ellipse(2.5, -69, 11, 6, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.restore();
    g.strokeStyle = D_SKIN_OUT; g.lineWidth = 2.2; // sides only — no boxed-in outline
    g.beginPath();
    g.moveTo(-10, -68); g.quadraticCurveTo(-5.5, -77, -4.5, -86);
    g.moveTo(15, -68); g.quadraticCurveTo(10.5, -77, 9.5, -86);
    g.stroke();

    // 5 the slab of a torso — broadest silhouette in the game
    g.fillStyle = D_SHIRT_MID; g.strokeStyle = D_SHIRT_OUT; g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(-20, -44);
    g.quadraticCurveTo(-25, -58, -20, -72 + chest);
    g.lineTo(-13, -80 + chest);
    g.lineTo(-6, -80 + chest);
    g.quadraticCurveTo(1, -72 + chest, 9, -80 + chest);
    g.lineTo(15, -80 + chest);
    g.quadraticCurveTo(23, -70, 23, -56);
    g.quadraticCurveTo(25, -47, 20, -44);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = D_SHIRT_LT; // top-left key on the near strap and chest
    g.beginPath();
    g.moveTo(-20, -46); g.quadraticCurveTo(-24, -58, -19.5, -71 + chest);
    g.lineTo(-13, -79.5 + chest); g.lineTo(-9, -79.5 + chest);
    g.lineTo(-11, -46);
    g.closePath(); g.fill();
    g.fillStyle = D_SHIRT_DK; // belly fold shade toward the sun-away side
    g.beginPath();
    g.moveTo(21, -60); g.quadraticCurveTo(24.5, -50, 19, -44);
    g.lineTo(11, -44); g.quadraticCurveTo(18, -50, 15, -60);
    g.closePath(); g.fill();
    g.strokeStyle = D_SHIRT_DK; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-14, -50); g.quadraticCurveTo(2, -46, 19, -51); g.stroke();
    g.beginPath(); g.moveTo(-11, -66 + chest); g.quadraticCurveTo(2, -61 + chest, 15, -65 + chest); g.stroke();

    // 6 heavy head
    g.fillStyle = D_SKIN_MID; g.strokeStyle = D_SKIN_OUT; g.lineWidth = 2.8;
    g.beginPath(); g.ellipse(2, -92, 10.5, 10, 0, 0, 7); g.fill(); g.stroke();
    g.save();
    g.beginPath(); g.ellipse(2, -92, 10.5, 10, 0, 0, 7); g.clip();
    g.fillStyle = D_SKIN_LT;
    g.beginPath(); g.ellipse(-3, -97, 6, 4, -0.35, 0, 7); g.fill();
    g.fillStyle = D_SKIN_DK; g.fillRect(9, -103, 6, 24);
    // rage climbs the face in stacked bands: jaw hot, forehead only on windup
    g.fillStyle = D_FLUSH_MID;
    g.beginPath(); g.ellipse(2, -84, 10, 6.5, 0, 0, 7); g.fill();
    g.fillStyle = D_FLUSH_LO; // overlapping bands stack alpha into a smoother ramp
    g.beginPath(); g.ellipse(2, -87, 10.6, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(2, -90.5, 10.4, 6.6, 0, 0, 7); g.fill();
    g.globalAlpha = rage;
    g.fillStyle = D_FLUSH_MID;
    g.beginPath(); g.ellipse(2, -88, 11, 7.5, 0, 0, 7); g.fill();
    g.fillStyle = D_FLUSH_LO;
    g.beginPath(); g.ellipse(2, -96, 11, 7, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.restore();
    g.fillStyle = D_SKIN_DK; g.strokeStyle = D_SKIN_OUT; g.lineWidth = 1.4; // ear
    g.beginPath(); g.ellipse(-8.2, -90.4, 1.9, 2.8, 0, 0, 7); g.fill(); g.stroke();

    // 7 thinning hair: a thin band hugging the skull, bare crown, comb-over
    g.fillStyle = D_HAIR_MID;
    g.beginPath();
    g.moveTo(-9.6, -95);
    g.quadraticCurveTo(-11.5, -99.5, -3, -102);
    g.quadraticCurveTo(2, -103.2, 7, -101.6);
    g.quadraticCurveTo(12.2, -99.8, 12.9, -96);
    g.quadraticCurveTo(10.6, -98.4, 5.5, -99.6);
    g.quadraticCurveTo(0.5, -100.6, -4, -99.4);
    g.quadraticCurveTo(-7.8, -98.4, -9.6, -95);
    g.closePath(); g.fill();
    g.strokeStyle = D_HAIR_DK; g.lineWidth = 1.2; // strands raked over the bare crown
    g.beginPath();
    g.moveTo(-6.5, -99); g.quadraticCurveTo(2, -102.4, 9.5, -99.4);
    g.moveTo(-5.5, -97); g.quadraticCurveTo(2, -100.2, 10.5, -97.4);
    g.stroke();
    g.strokeStyle = D_HAIR_MID; g.lineWidth = 1.6; // short sideburns, clear of the eyes
    g.beginPath();
    g.moveTo(-8.8, -95.5); g.lineTo(-8.2, -91.5);
    g.moveTo(12.2, -96); g.lineTo(11.6, -92);
    g.stroke();

    // 8 heavy brow + eyes lit red-hot (his whole read)
    // two separate ridges sloping down toward the front — one wide bar read as
    // sunglasses; splitting it makes the scowl legible
    g.fillStyle = D_BROW;
    g.beginPath();
    g.moveTo(-8, -97.4); g.lineTo(3, -93.6); g.lineTo(2.6, -90.6); g.lineTo(-7.8, -94);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(4.6, -97.6); g.lineTo(13.2, -93.4); g.lineTo(12.8, -90.4); g.lineTo(4.2, -94.4);
    g.closePath(); g.fill();
    if (hurt) {
      g.strokeStyle = D_SKIN_OUT; g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(-2.6, -93.6); g.lineTo(1.4, -90.4);
      g.moveTo(1.4, -93.6); g.lineTo(-2.6, -90.4);
      g.moveTo(6.4, -93.8); g.lineTo(10.4, -90.6);
      g.moveTo(10.4, -93.8); g.lineTo(6.4, -90.6);
      g.stroke();
    } else {
      g.fillStyle = D_EYE_SOCKET; // sets the glow INTO the face, not on it
      g.beginPath(); g.ellipse(-0.6, -92, 4.2, 3.4, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(8.4, -92.2, 4.2, 3.4, 0, 0, 7); g.fill();
      g.fillStyle = D_EYE_GLOW;
      g.beginPath(); g.arc(-0.6, -92, 3.6, 0, 7); g.fill();
      g.beginPath(); g.arc(8.4, -92.2, 3.6, 0, 7); g.fill();
      g.fillStyle = D_EYE_CORE;
      g.beginPath(); g.arc(-0.6, -92, windup ? 2.3 : 1.9, 0, 7); g.fill();
      g.beginPath(); g.arc(8.4, -92.2, windup ? 2.3 : 1.9, 0, 7); g.fill();
      g.fillStyle = D_EYE_HI;
      g.beginPath(); g.arc(-1.1, -92.5, 0.75, 0, 7); g.fill();
      g.beginPath(); g.arc(7.9, -92.7, 0.75, 0, 7); g.fill();
    }
    // 9 nose as a filled wedge — a stroked line read as a scratch
    g.fillStyle = D_SKIN_DK; g.strokeStyle = D_SKIN_OUT; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(9.6, -91.4);
    g.quadraticCurveTo(13.4, -89.6, 12.6, -87);
    g.quadraticCurveTo(10.6, -86.2, 8.8, -87);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = D_SKIN_OUT;
    g.beginPath(); g.ellipse(11.2, -87.2, 1.1, 0.7, 0.2, 0, 7); g.fill();
    g.strokeStyle = D_SKIN_OUT; g.lineWidth = 2.4;
    if (windup || strike) { // teeth bared through a snarl
      g.fillStyle = D_SNARL;
      g.beginPath();
      g.moveTo(0.5, -84.8);
      g.quadraticCurveTo(5.5, -87.2, 11, -84.4);
      g.quadraticCurveTo(5.5, -80.8, 0.5, -84.8);
      g.closePath(); g.fill();
      g.fillStyle = D_TEETH; // upper row follows the lip, not a flat bar
      g.beginPath();
      g.moveTo(1.8, -84.9); g.lineTo(10.2, -84.5); g.lineTo(9.8, -82.8);
      g.lineTo(7.4, -84); g.lineTo(4.9, -82.7); g.lineTo(2.5, -83.8);
      g.closePath(); g.fill();
    } else {
      g.beginPath(); g.moveTo(0.5, -83.4); g.quadraticCurveTo(5.5, -85.6, 10.5, -84.2); g.stroke();
    }

    // 10 lead arm: idle guard, cocked haymaker, then the hurl
    let ffx = 22, ffy = -53, fex = 24, fey = -64;
    if (windup) { ffx = -13; ffy = -71; fex = 4; fey = -63; }
    else if (strike) { ffx = 37; ffy = -68; fex = 26; fey = -71; }
    else if (hurt) { ffx = 16; ffy = -47; fex = 22; fey = -59; }
    else { ffy = -53 + breath * 1.2; }
    const ffr = (windup ? 9 : strike ? 8.6 : 7.6) + clench * 0.7;
    damonArm(g, 18, -72 + chest * 0.6, fex, fey, ffx, ffy, ffr, D_SKIN_MID, D_SKIN_DK);
    if (windup) { // the cocked fist runs hottest — a rim, not a disc
      g.globalAlpha = rage * 0.7;
      g.strokeStyle = D_FLUSH_HOT; g.lineWidth = 2.6;
      g.beginPath(); g.arc(ffx, ffy, ffr + 2.4, 0, 7); g.stroke();
      g.globalAlpha = 1;
    }
  };
})();
