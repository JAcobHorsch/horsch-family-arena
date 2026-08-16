// weapons-c.js — weapon bodies for LEVI (caveman clubs → carnival clown hammer),
// RONATHON (orbiting alias glyphs), TIM (fire axes → Jaws of Life) and MYAH
// (chore gear → sentient robot mop). Bodies draw in drawFighter local space:
// (0,0) = the fighter's FEET, -y is up, +x is forward (the caller owns the facing
// flip). 'under' runs before the mitts so the fist paints over the grip; 'over'
// runs after, for hand-riding art. The caller does NOT save/restore around us.
(function () {
  const W = (window.WEAPON_BODIES = window.WEAPON_BODIES || {});
  // strike-FX data the engine reads at the slash-spawn site and in hitEnemy
  const FX = (window.WEAPON_FX = window.WEAPON_FX || {});

  // ---- hoisted palettes (module scope — nothing allocated per frame) ----
  // levi: driftwood / bone / hardwood+steel+hide / granite / carnival
  const L_DRIFT = '#a09076';
  const L_BONE = '#e3dcc4';
  const L_WOOD = '#6a4a2c';
  const L_STEEL = '#c9ccd8';
  const L_HIDE = '#8a4ae8';
  const L_ROCK = '#8d8574';
  const L_E = '#ff4a92';       // carnival magenta (weaponEnergy)
  const L_CORE = '#ffd6e8';
  const L_DEEP = '#c22a68';    // outer wreath tongue
  const L_BRASS = '#ffd24a';
  const L_WHITE = '#ffffff';
  const L_HALO_A = '#ff4a9258';
  const L_HALO_B = '#ff4a9226';
  // ronathon: paper / brass / bone / dim violet / mythic gold
  const R_PAPER = '#d8d4c8';
  const R_BRASS = '#b87333';
  const R_BONE = '#e3dcc4';
  const R_DIM = '#9a3fbf';
  const R_GOLD = '#ffd24a';
  const R_E = '#c24ae8';       // alias magenta (weaponEnergy)
  const R_CORE = '#f0d6ff';
  const R_ENV_OUT = '#7a249647';
  const R_ENV_MID = '#c24ae83c';
  const R_HALO_A = '#c24ae852';
  const R_HALO_B = '#c24ae820';
  const R_BADGE = '#e84a3a';
  const R_FIELD = '#fff8e6';
  // tim: dull alloy / fire-engine red / chrome / blue steel / hi-vis
  const T_ALLOY = '#9aa0ae';
  const T_STUB = '#8a6a48';
  const T_HAFT = '#c98d48';
  const T_RED = '#d43b2f';
  const T_CHROME = '#dfe3e8';
  const T_HIVIS = '#f2ee4a';
  const T_BLUE = '#3c82b1';
  const T_GUN = '#4a5060';
  const T_STEEL = '#c9ccd8';
  const T_E = '#4ab2e8';       // water (weaponEnergy)
  const T_CORE = '#e8fbff';
  const T_DEEP = '#2a6a9e';
  const T_DROP = '#9fd8f2';
  const T_HALO_A = '#4ab2e852';
  const T_HALO_B = '#4ab2e824';
  // myah: dusty plastic / straw+wood / pink basket / tech teal / chassis
  const M_PLASTIC = '#c9a0ba';
  const M_STRAW = '#e0c070';
  const M_WOOD = '#c98d48';
  const M_STITCH = '#d43b2f';
  const M_PINK = '#d444b8';
  const M_WHITES = '#f4f0e6';
  const M_DENIM = '#4a6a9e';
  const M_SOCK = '#ffffff';
  const M_STRIPE = '#e84ad0';
  const M_TEAL = '#3c9eb1';
  const M_METAL = '#c9ccd8';
  const M_CUP = '#bfe6f580';   // baked alpha — no runtime concat
  const M_E = '#4adbe8';       // LED cyan (weaponEnergy)
  const M_CORE = '#e8fbff';
  const M_FOAM = '#9fd8f2';
  const M_HALO_A = '#4adbe852';
  const M_HALO_B = '#4adbe822';
  const TRANSPARENT = 'transparent';

  // T5 drift motes, flat [dx, dy, phase, r] quads — indexed loops so iterating
  // allocates nothing (a for..of over nested arrays would build an iterator)
  const LEVI_MOTES = [24, -14, 0, 1.3, 29, -16, 0.33, 1.1, 33, -13, 0.66, 1.4, 26, -12, 0.5, 0.9];
  const RON_MOTES = [-10, -12, 0, 1.1, 8, -15, 0.3, 1, 14, -6, 0.55, 1.2, -14, -4, 0.8, 0.9];
  const TIM_DROPS = [24, 2, 0, 1.1, 29, -3, 0.33, 1.2, 33, 1, 0.6, 1, 27, 5, 0.8, 0.9];
  const MYAH_BUBBLES = [25, -9, 0, 1.2, 30, -11, 0.3, 1, 33, -8, 0.55, 1.3, 27, -7, 0.8, 0.9];

  // T5 heavy-hit word tables, fed to the existing 35% impactWord chance
  const LEVI_WORDS = ['DING!', 'BONK!', 'TILT!'];
  const RON_WORDS = ['DOUGANOLD!', 'RYAN DUGAN!'];
  const TIM_WORDS = ['DOUSED!', 'BREACH!', 'HYDRO!'];
  const MYAH_WORDS = ['SPOTLESS!', 'SCRUBBED!', 'SO CLEAN!'];

  // Ronathon's alias per tier — the shop track names, glyph counts baked in
  const RON_TIER_WORDS = ['RONALD', 'REGINALD', 'RON', 'REGGIE', 'DOUGANOLD'];
  // glyphs bake once per color+letter into a two-level map (no key concat per frame)
  const RON_GLYPHS = {};
  const RON_GS = 3; // supersample; sprites blit at the tier's world w/h
  const RON_FONT = '800 24px Verdana, sans-serif'; // 8 world units * RON_GS
  function ronGlyph(ch, wc, sh) {
    let byColor = RON_GLYPHS[wc];
    if (!byColor) byColor = RON_GLYPHS[wc] = {};
    let s = byColor[ch];
    if (s) return s;
    s = document.createElement('canvas');
    s.width = 12 * RON_GS; s.height = 14 * RON_GS;
    const q = s.getContext('2d');
    q.font = RON_FONT; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillStyle = sh.out; q.fillText(ch, 6 * RON_GS + 0.9 * RON_GS, 7 * RON_GS + 0.9 * RON_GS);
    q.fillStyle = wc; q.fillText(ch, 6 * RON_GS, 7 * RON_GS);
    byColor[ch] = s;
    return s;
  }

  // the shared T3 twinkle (Addi's ice-sword pattern): 4-point star, 1.6 arms
  function star4(g, x, y) {
    g.beginPath();
    g.moveTo(x - 1.6, y); g.lineTo(x - 0.45, y - 0.45); g.lineTo(x, y - 1.6); g.lineTo(x + 0.45, y - 0.45);
    g.lineTo(x + 1.6, y); g.lineTo(x + 0.45, y + 0.45); g.lineTo(x, y + 1.6); g.lineTo(x - 0.45, y + 0.45);
    g.closePath(); g.fill();
  }

  // ============================== LEVI ==============================
  // Oonga escalation: driftwood → bone → spiked warclub → boulder-on-a-stick →
  // the carnival strongman hammer that rings the bell in magenta light.
  W.levi = {
    under: function (g, w) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.animT || 0;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.75 + (w.attackKey ? (w.attackExt || 0) * 1.25 : 0));
      switch (w.tier) {
        case 1: { // T1 DRIFTWOOD CLUB — one material, one taper, one sun line
          const s = w.ramp(L_DRIFT);
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(0, -2.6); g.lineTo(12, -4.2); g.lineTo(14.6, 0); g.lineTo(12, 4.2); g.lineTo(0, 2.6);
          g.closePath(); g.fill();
          g.fillStyle = L_DRIFT;
          g.beginPath();
          g.moveTo(0, -1.8); g.lineTo(12, -3.2); g.lineTo(13.6, 0); g.lineTo(12, 3.2); g.lineTo(0, 1.8);
          g.closePath(); g.fill();
          g.strokeStyle = s.lt; g.lineWidth = 1.1;
          g.beginPath(); g.moveTo(1.5, -1); g.lineTo(10.5, -2.4); g.stroke();
          break;
        }
        case 2: { // T2 BONE CLUB — double-condyle femur head, full ramp + spec
          const s = w.ramp(L_BONE);
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(0, -2.2); g.lineTo(14, -3); g.lineTo(16, 0); g.lineTo(14, 3); g.lineTo(0, 2.2);
          g.closePath(); g.fill();
          g.fillStyle = L_BONE;
          g.beginPath();
          g.moveTo(0, -1.5); g.lineTo(13.8, -2.3); g.lineTo(15, 0); g.lineTo(13.8, 2.3); g.lineTo(0, 1.5);
          g.closePath(); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(2, 1.6); g.lineTo(13, 2.4); g.stroke();
          g.fillStyle = s.out;
          g.beginPath(); g.arc(16.5, -2.6, 3.4, 0, 7); g.fill();
          g.fillStyle = L_BONE;
          g.beginPath(); g.arc(16.5, -2.6, 2.7, 0, 7); g.fill();
          g.fillStyle = s.out;
          g.beginPath(); g.arc(16.8, 2.4, 3.1, 0, 7); g.fill();
          g.fillStyle = L_BONE;
          g.beginPath(); g.arc(16.8, 2.4, 2.4, 0, 7); g.fill();
          g.fillStyle = s.lt;
          g.beginPath(); g.arc(15.9, -3.2, 1.1, 0, 7); g.fill();
          g.fillStyle = s.hi;
          g.beginPath(); g.arc(16.2, -3.4, 0.8, 0, 7); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 0.7;
          g.beginPath(); g.moveTo(6, -0.8); g.lineTo(9, 0.6); g.stroke();
          break;
        }
        case 3: { // T3 SPIKED CAVEMAN CLUB — steel spike row + violet hide grip
          const s = w.ramp(L_WOOD), sp = w.ramp(L_STEEL), hd = w.ramp(L_HIDE);
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(0, -2.8); g.lineTo(20, -4.6); g.lineTo(23, 0); g.lineTo(20, 4.6); g.lineTo(0, 2.8);
          g.closePath(); g.fill();
          g.fillStyle = L_WOOD;
          g.beginPath();
          g.moveTo(0, -2); g.lineTo(19.8, -3.6); g.lineTo(21.6, 0); g.lineTo(19.8, 3.6); g.lineTo(0, 2);
          g.closePath(); g.fill();
          g.strokeStyle = s.lt; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(2, -1.4); g.lineTo(18, -3); g.stroke();
          g.fillStyle = sp.out;
          g.beginPath(); g.moveTo(11.5, -3.6); g.lineTo(13, -9.2); g.lineTo(14.5, -3.9); g.closePath(); g.fill();
          g.fillStyle = L_STEEL;
          g.beginPath(); g.moveTo(11.68, -3.84); g.lineTo(13, -8.76); g.lineTo(14.32, -4.1); g.closePath(); g.fill();
          g.fillStyle = sp.out;
          g.beginPath(); g.moveTo(17.2, -4.2); g.lineTo(19, -10.4); g.lineTo(20.6, -4.5); g.closePath(); g.fill();
          g.fillStyle = L_STEEL;
          g.beginPath(); g.moveTo(17.41, -4.46); g.lineTo(18.99, -9.92); g.lineTo(20.4, -4.72); g.closePath(); g.fill();
          g.fillStyle = sp.out;
          g.beginPath(); g.moveTo(15.4, 4.2); g.lineTo(16.8, 9.6); g.lineTo(18.2, 4); g.closePath(); g.fill();
          g.fillStyle = L_STEEL;
          g.beginPath(); g.moveTo(15.57, 4.41); g.lineTo(16.8, 9.16); g.lineTo(18.03, 4.23); g.closePath(); g.fill();
          g.fillStyle = hd.out;
          g.beginPath(); g.roundRect(1.4, -3.4, 5.2, 6.8, 1.4); g.fill();
          g.fillStyle = L_HIDE;
          g.beginPath(); g.roundRect(1.8, -3, 4.4, 6, 1.2); g.fill();
          g.strokeStyle = hd.dk; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(2.4, -2.4); g.lineTo(5.6, 2.2);
          g.moveTo(5.6, -2.4); g.lineTo(2.4, 2.2);
          g.stroke();
          g.fillStyle = sp.hi;
          g.beginPath(); g.arc(13, -8.6, 0.7, 0, 7); g.fill();
          break;
        }
        case 4: { // T4 BOULDER-ON-A-STICK — first light: energy fissures pulse
          const s = w.ramp(L_WOOD), rk = w.ramp(L_ROCK);
          g.strokeStyle = s.out; g.lineWidth = 5;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(21, 0); g.stroke();
          g.strokeStyle = L_WOOD; g.lineWidth = 3;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(21, 0); g.stroke();
          g.strokeStyle = w.ramp(L_HIDE).dk; g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(17, -2.5); g.lineTo(20, 2.5);
          g.moveTo(18.5, -2.5); g.lineTo(21.5, 2.5);
          g.stroke();
          g.fillStyle = rk.out;
          g.beginPath();
          g.moveTo(18, -3); g.lineTo(21, -7.8); g.lineTo(27, -8.6); g.lineTo(31.6, -4.6);
          g.lineTo(32.4, 1.4); g.lineTo(28, 5.8); g.lineTo(21.4, 4.6);
          g.closePath(); g.fill();
          g.fillStyle = L_ROCK;
          g.beginPath();
          g.moveTo(19, -2.6); g.lineTo(21.8, -6.9); g.lineTo(26.8, -7.7); g.lineTo(30.8, -4.1);
          g.lineTo(31.5, 1); g.lineTo(27.6, 4.9); g.lineTo(21.9, 3.9);
          g.closePath(); g.fill();
          g.fillStyle = rk.lt;
          g.beginPath(); g.moveTo(21.8, -6.9); g.lineTo(26.8, -7.7); g.lineTo(24, -3.5); g.closePath(); g.fill();
          g.fillStyle = rk.dk;
          g.beginPath(); g.moveTo(27.6, 4.9); g.lineTo(21.9, 3.9); g.lineTo(25, 1); g.closePath(); g.fill();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6.3);
          g.strokeStyle = L_E; g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(21, -1); g.lineTo(24.6, -2.8); g.lineTo(27.2, 0.4); g.lineTo(30.6, -1.2);
          g.stroke();
          g.lineWidth = 1.1;
          g.beginPath();
          g.moveTo(24, 4); g.lineTo(26.4, 1.2); g.lineTo(29.6, 3);
          g.stroke();
          g.fillStyle = L_CORE;
          g.beginPath(); g.arc(24.6, -2.8, 0.9, 0, 7); g.fill();
          g.beginPath(); g.arc(26.4, 1.2, 0.8, 0, 7); g.fill();
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE CARNIVAL CLOWN HAMMER — striped circus cylinder + halo
          const br = w.ramp(L_BRASS), hd = w.ramp(L_HIDE), hm = w.ramp(L_E);
          if (w.isPlayer) { // the one radial gradient in the frame budget
            const rg = g.createRadialGradient(27, -2, 4, 27, -2, 17);
            rg.addColorStop(0, L_HALO_A);
            rg.addColorStop(0.6, L_HALO_B);
            rg.addColorStop(1, TRANSPARENT);
            g.fillStyle = rg;
            g.beginPath(); g.arc(27, -2, 17, 0, 7); g.fill();
          }
          g.strokeStyle = hd.out; g.lineWidth = 5.6;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(19, 0); g.stroke();
          g.strokeStyle = L_HIDE; g.lineWidth = 3.4;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(19, 0); g.stroke();
          g.fillStyle = br.out; g.fillRect(16.1, -3.5, 3, 7);
          g.fillStyle = L_BRASS; g.fillRect(16.4, -3.2, 2.4, 6.4);
          g.fillStyle = hm.out;
          g.beginPath(); g.roundRect(20.5, -11.8, 15, 23.6, 4.6); g.fill();
          g.fillStyle = L_E;
          g.beginPath(); g.roundRect(21.3, -11, 13.4, 22, 4); g.fill();
          g.fillStyle = L_WHITE;
          g.fillRect(24.6, -11, 2.8, 22);
          g.fillRect(30.2, -11, 2.8, 22);
          g.fillStyle = br.out;
          g.beginPath(); g.roundRect(20.9, -13.2, 14.2, 3, 1.4); g.fill();
          g.fillStyle = L_BRASS;
          g.beginPath(); g.roundRect(21.2, -12.9, 13.6, 2.4, 1.2); g.fill();
          g.fillStyle = br.out;
          g.beginPath(); g.roundRect(20.9, 10.2, 14.2, 3, 1.4); g.fill();
          g.fillStyle = L_BRASS;
          g.beginPath(); g.roundRect(21.2, 10.5, 13.6, 2.4, 1.2); g.fill();
          g.strokeStyle = hm.hi; g.lineWidth = 1.3;
          g.beginPath(); g.arc(23.5, -8, 3.2, 3.3, 5.34); g.stroke();
          // envelope: dark outer tongues, bright mid, near-white core line
          const s1 = Math.sin(t * 11) * 1.6;
          const s2 = Math.sin(t * 11 + 2.1) * 1.6;
          const s3 = Math.sin(t * 11 + 4.2) * 1.6;
          g.fillStyle = L_DEEP;
          g.beginPath();
          g.moveTo(21.5, -12.2); g.lineTo(23.5, -16.5 + s1); g.lineTo(25.5, -12.6); g.lineTo(27.5, -18.2 + s2);
          g.lineTo(29.5, -12.6); g.lineTo(31.5, -15.8 + s3); g.lineTo(33.5, -12.2);
          g.closePath(); g.fill();
          g.fillStyle = L_E;
          g.beginPath();
          g.moveTo(23, -12.4); g.lineTo(24, -14.8 + s1); g.lineTo(25.8, -12.6); g.lineTo(27.5, -16 + s2);
          g.lineTo(29.2, -12.6); g.lineTo(31, -14.4 + s3); g.lineTo(32.2, -12.4);
          g.closePath(); g.fill();
          g.fillStyle = L_CORE;
          g.beginPath();
          g.moveTo(26.8, -12.6); g.lineTo(27.5, -14.6 + s2); g.lineTo(28.2, -12.6);
          g.closePath(); g.fill();
          g.strokeStyle = L_CORE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(21.5, -12.3); g.lineTo(33.5, -12.3); g.stroke();
          if (w.isPlayer) { // the single allowed blur pass, zeroed immediately
            g.shadowColor = L_E; g.shadowBlur = 8;
            g.strokeStyle = L_E; g.lineWidth = 2;
            g.beginPath(); g.roundRect(21.3, -11, 13.4, 22, 4); g.stroke();
            g.shadowBlur = 0;
          }
          g.fillStyle = L_CORE;
          for (let i = 0; i < 16; i += 4) {
            const ph = LEVI_MOTES[i + 2];
            const cyc = (t * 0.5 + ph) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(LEVI_MOTES[i] + 1.5 * Math.sin(t * 4 + ph * 6.28), LEVI_MOTES[i + 1] - cyc * 9, LEVI_MOTES[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          break;
        }
      }
      g.restore();
    },
  };

  // ============================== RONATHON ==============================
  // Alias apotheosis: a cramped paper-letter clutter grows into a gold
  // DOUGANOLD constellation crowned by a HELLO badge and a magenta ring.
  // Rides the fist, so it draws OVER the mitts.
  W.ronathon = {
    over: function (g, w) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.animT || 0;
      const fx = w.hx, fy = w.hy;
      const fc = w.facing < 0 ? -1 : 1; // rings stay symmetric; glyphs unmirror
      const tier = w.tier;
      switch (tier) {
        case 1: { // T1 RONALD — 6 paper glyphs jostling in a tight orbit
          const word = RON_TIER_WORDS[0], sh = w.ramp(R_PAPER);
          g.save(); g.scale(fc, 1);
          for (let li = 0; li < 6; li++) {
            const ang = t * 0.9 + li * 1.0472;
            const gx = fx + Math.cos(ang) * 3.2, gy = fy + Math.sin(ang) * 2.1;
            g.drawImage(ronGlyph(word[li], R_PAPER, sh), fc * gx - 4, gy - 4.65, 8, 9.3);
          }
          g.restore();
          break;
        }
        case 2: { // T2 REGINALD — brass letterpress on a lanyard ring
          const word = RON_TIER_WORDS[1], sh = w.ramp(R_BRASS);
          g.strokeStyle = sh.dk; g.lineWidth = 1;
          g.beginPath(); g.ellipse(fx, fy, 4.5, 3, 0, 0, 7); g.stroke();
          g.save(); g.scale(fc, 1);
          for (let li = 0; li < 8; li++) {
            const ang = t * 1.1 + li * 0.7854;
            const gx = fx + Math.cos(ang) * 4.5, gy = fy + Math.sin(ang) * 3;
            g.drawImage(ronGlyph(word[li], R_BRASS, sh), fc * gx - 4.5, gy - 5.25, 9, 10.5);
          }
          g.fillStyle = sh.hi;
          g.beginPath();
          g.arc(fc * (fx + Math.cos(t * 1.1) * 4.5) - 2, fy + Math.sin(t * 1.1) * 3 - 3, 0.8, 0, 7);
          g.fill();
          g.restore();
          break;
        }
        case 3: { // T3 RON — three big bone letters, two violet rib-bones, twinkle
          const word = RON_TIER_WORDS[2], sh = w.ramp(R_BONE);
          g.strokeStyle = w.ramp(R_E).dk; g.lineWidth = 1.2;
          g.beginPath(); g.arc(fx - 8, fy + 1, 3, 0.4, 2.6); g.stroke();
          g.beginPath(); g.arc(fx + 8, fy - 1, 3, 3.5, 5.7); g.stroke();
          g.save(); g.scale(fc, 1);
          for (let li = 0; li < 3; li++) {
            const ang = t * 1.4 + li * 2.094;
            const gx = fx + Math.cos(ang) * 7, gy = fy + Math.sin(ang) * 4.5;
            g.drawImage(ronGlyph(word[li], R_BONE, sh), fc * gx - 6, gy - 7, 12, 14);
          }
          g.restore();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = L_WHITE;
          star4(g, fx, fy - 8);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 REGGIE — the orbit becomes a circuit, each letter drags a tail
          const word = RON_TIER_WORDS[3], sh = w.ramp(R_DIM);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6.3);
          g.strokeStyle = R_DIM; g.lineWidth = 1.2;
          g.beginPath(); g.ellipse(fx, fy, 11, 7, 0, 0, 7); g.stroke();
          g.globalAlpha = 1;
          g.save(); g.scale(fc, 1);
          g.strokeStyle = R_E; g.lineWidth = 1.6;
          for (let li = 0; li < 6; li++) {
            const ang = t * 1.8 + li * 1.047;
            g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6.3 + li);
            g.beginPath();
            g.moveTo(fc * (fx + Math.cos(ang - 0.45) * 11), fy + Math.sin(ang - 0.45) * 7);
            g.lineTo(fc * (fx + Math.cos(ang - 0.12) * 11), fy + Math.sin(ang - 0.12) * 7);
            g.stroke();
          }
          g.globalAlpha = 1; // glyphs ride on top of their own tails at full alpha
          for (let li = 0; li < 6; li++) {
            const ang = t * 1.8 + li * 1.047;
            const gx = fx + Math.cos(ang) * 11, gy = fy + Math.sin(ang) * 7;
            g.drawImage(ronGlyph(word[li], R_DIM, sh), fc * gx - 6, gy - 7, 12, 14);
          }
          g.restore();
          break;
        }
        default: { // T5 DOUGANOLD — nine gold letters inside a magenta arcane ring
          const word = RON_TIER_WORDS[4], sh = w.ramp(R_GOLD);
          if (w.isPlayer) { // the one radial gradient in the frame budget
            const rg = g.createRadialGradient(fx, fy, 6, fx, fy, 22);
            rg.addColorStop(0, R_HALO_A);
            rg.addColorStop(0.6, R_HALO_B);
            rg.addColorStop(1, TRANSPARENT);
            g.fillStyle = rg;
            g.beginPath(); g.arc(fx, fy, 22, 0, 7); g.fill();
          }
          g.fillStyle = R_ENV_OUT;
          g.beginPath(); g.ellipse(fx, fy, 16, 10.5, 0, 0, 7); g.fill();
          g.fillStyle = R_ENV_MID;
          g.beginPath(); g.ellipse(fx, fy, 15, 9.8, 0, 0, 7); g.fill();
          g.globalAlpha = 0.9;
          g.strokeStyle = R_CORE; g.lineWidth = 1.1;
          g.beginPath(); g.ellipse(fx, fy, 14, 9, 0, 0, 7); g.stroke();
          g.globalAlpha = 1;
          if (w.isPlayer) { // the single allowed blur pass, zeroed immediately
            g.shadowColor = R_E; g.shadowBlur = 8;
            g.strokeStyle = R_E; g.lineWidth = 1.5;
            g.beginPath(); g.ellipse(fx, fy, 14, 9, 0, 0, 7); g.stroke();
            g.shadowBlur = 0;
          }
          g.fillStyle = w.ramp(R_BADGE).out;
          g.beginPath(); g.roundRect(fx - 5.6, fy - 19.4, 11.2, 7, 1.6); g.fill();
          g.fillStyle = R_BADGE;
          g.beginPath(); g.roundRect(fx - 5.2, fy - 19, 10.4, 3.2, 1.4); g.fill();
          g.fillStyle = R_FIELD;
          g.beginPath(); g.roundRect(fx - 5.2, fy - 15.8, 10.4, 3, 1.2); g.fill();
          g.save(); g.scale(fc, 1);
          for (let li = 0; li < 9; li++) {
            const ang = t * 2.2 + li * 0.698;
            const gx = fx + Math.cos(ang) * 14, gy = fy + Math.sin(ang) * 9;
            g.drawImage(ronGlyph(word[li], R_GOLD, sh), fc * gx - 7, gy - 8.15, 14, 16.3);
          }
          g.restore();
          g.fillStyle = R_CORE;
          for (let i = 0; i < 16; i += 4) {
            const ph = RON_MOTES[i + 2];
            const cyc = (t * 0.45 + ph) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(fx + RON_MOTES[i] + 1.5 * Math.sin(t * 3.5 + ph * 6.28), fy + RON_MOTES[i + 1] - cyc * 8, RON_MOTES[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          break;
        }
      }
    },
  };

  // ============================== TIM ==============================
  // Forcible entry: camp hatchet → fire-engine axe → chrome flathead → halligan
  // bar → hi-vis Jaws of Life wreathed in WATER (the firefighter inverts flame).
  W.tim = {
    under: function (g, w) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.animT || 0;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.6 + (w.attackKey ? (w.attackExt || 0) * 1.15 : 0));
      switch (w.tier) {
        case 1: { // T1 HATCHET — a stubby garage hatchet
          const hs = w.ramp(T_STUB), s = w.ramp(T_ALLOY);
          g.strokeStyle = hs.out; g.lineWidth = 4.2;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(9.5, 0); g.stroke();
          g.strokeStyle = T_STUB; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(9.5, 0); g.stroke();
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(8, -5.4); g.lineTo(12.6, -4.6); g.lineTo(13.4, -0.6); g.lineTo(7.4, -1.2);
          g.closePath(); g.fill();
          g.fillStyle = T_ALLOY;
          g.beginPath();
          g.moveTo(8.3, -4.8); g.lineTo(12.2, -4.1); g.lineTo(12.9, -1); g.lineTo(7.8, -1.6);
          g.closePath(); g.fill();
          g.strokeStyle = s.lt; g.lineWidth = 1;
          g.beginPath(); g.moveTo(8.6, -4.2); g.lineTo(12, -3.6); g.stroke();
          break;
        }
        case 2: { // T2 PICKHEAD AXE — the rear pick spike is the silhouette add
          const hs = w.ramp(T_HAFT), s = w.ramp(T_RED);
          g.strokeStyle = hs.out; g.lineWidth = 4.8;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(15, 0); g.stroke();
          g.strokeStyle = T_HAFT; g.lineWidth = 2.6;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(15, 0); g.stroke();
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(13, -7.2); g.lineTo(18.4, -5.6); g.lineTo(19.2, -0.6); g.lineTo(12, -1.4);
          g.closePath(); g.fill();
          g.fillStyle = T_RED;
          g.beginPath();
          g.moveTo(13.3, -6.6); g.lineTo(18, -5.1); g.lineTo(18.7, -1); g.lineTo(12.5, -1.8);
          g.closePath(); g.fill();
          g.fillStyle = T_CHROME;
          g.beginPath();
          g.moveTo(17.6, -5.2); g.lineTo(19, -1); g.lineTo(17.8, -1.1); g.lineTo(16.6, -4.7);
          g.closePath(); g.fill();
          g.fillStyle = s.out;
          g.beginPath(); g.moveTo(12.6, -4.6); g.lineTo(8.8, -3.4); g.lineTo(12.6, -2.4); g.closePath(); g.fill();
          g.fillStyle = T_RED;
          g.beginPath(); g.moveTo(12.4, -4.2); g.lineTo(9.6, -3.4); g.lineTo(12.4, -2.7); g.closePath(); g.fill();
          g.fillStyle = s.hi;
          g.beginPath(); g.arc(15.4, -5.4, 0.9, 0, 7); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 1;
          g.beginPath(); g.moveTo(13.4, -1.8); g.lineTo(17.8, -1.4); g.stroke();
          break;
        }
        case 3: { // T3 FLATHEAD AXE — chrome blade, painted cheek, hi-vis bands
          const hs = w.ramp(T_HAFT), s = w.ramp(T_CHROME);
          g.strokeStyle = hs.out; g.lineWidth = 5;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(21, 0); g.stroke();
          g.strokeStyle = T_HAFT; g.lineWidth = 2.8;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(21, 0); g.stroke();
          g.fillStyle = T_HIVIS;
          g.fillRect(3.2, -1.9, 2.6, 3.8);
          g.fillRect(7.4, -1.9, 2.6, 3.8);
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(19, -9.4); g.lineTo(25.6, -7.6); g.lineTo(26.8, -0.6); g.lineTo(17.6, -1.6);
          g.closePath(); g.fill();
          g.fillStyle = T_CHROME;
          g.beginPath();
          g.moveTo(19.4, -8.7); g.lineTo(25.1, -7.1); g.lineTo(26.2, -1.1); g.lineTo(18.2, -2.1);
          g.closePath(); g.fill();
          g.fillStyle = T_RED;
          g.beginPath();
          g.moveTo(19.4, -7.6); g.lineTo(23.8, -6.4); g.lineTo(24.2, -3.4); g.lineTo(19, -4.2);
          g.closePath(); g.fill();
          g.fillStyle = s.hi;
          g.beginPath();
          g.moveTo(25, -7.2); g.lineTo(26.4, -1); g.lineTo(25.2, -1.1); g.lineTo(23.9, -6.6);
          g.closePath(); g.fill();
          g.fillStyle = s.out; g.fillRect(16.4, -4.9, 2.2, 3.6);
          g.fillStyle = T_CHROME; g.fillRect(16.6, -4.7, 1.8, 3.2);
          g.fillStyle = s.dk;
          g.beginPath(); g.arc(20.8, -5.6, 0.7, 0, 7); g.fill();
          g.beginPath(); g.arc(22.4, -5.1, 0.7, 0, 7); g.fill();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = L_WHITE;
          star4(g, 24.8, -6.8);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 HALLIGAN BAR — fork butt, adze + pick tip, water seam
          const s = w.ramp(T_BLUE);
          g.strokeStyle = s.out; g.lineWidth = 5.4;
          g.beginPath(); g.moveTo(2, 0); g.lineTo(26, 0); g.stroke();
          g.strokeStyle = T_BLUE; g.lineWidth = 3.4;
          g.beginPath(); g.moveTo(2, 0); g.lineTo(26, 0); g.stroke();
          g.strokeStyle = s.dk; g.lineWidth = 1.1;
          g.beginPath(); g.moveTo(8, -1.6); g.lineTo(20, -1.6); g.stroke();
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(2.6, -1.8); g.lineTo(-3.4, -4.6); g.lineTo(-1.4, -1.2); g.lineTo(-3.4, 2.2); g.lineTo(2.6, 1.8);
          g.closePath(); g.fill();
          g.fillStyle = T_BLUE;
          g.beginPath();
          g.moveTo(2.4, -1.3); g.lineTo(-2.5, -3.8); g.lineTo(-0.9, -1); g.lineTo(-2.5, 1.6); g.lineTo(2.4, 1.3);
          g.closePath(); g.fill();
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(25, -1.8); g.lineTo(30.4, -6.8); g.lineTo(32.2, -5.2); g.lineTo(27.4, -0.2);
          g.closePath(); g.fill();
          g.fillStyle = T_BLUE;
          g.beginPath();
          g.moveTo(25.6, -1.6); g.lineTo(30.3, -6); g.lineTo(31.5, -5); g.lineTo(27.3, -0.7);
          g.closePath(); g.fill();
          g.fillStyle = s.out;
          g.beginPath(); g.moveTo(26, 0.6); g.lineTo(30.8, 4.8); g.lineTo(26.6, 2.6); g.closePath(); g.fill();
          g.fillStyle = T_BLUE;
          g.beginPath(); g.moveTo(26.3, 1); g.lineTo(29.9, 4.2); g.lineTo(26.7, 2.4); g.closePath(); g.fill();
          g.strokeStyle = s.lt; g.lineWidth = 1.1;
          g.beginPath(); g.moveTo(3, -1.2); g.lineTo(25, -1.2); g.stroke();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6.3);
          g.strokeStyle = T_E; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(3.5, 0.2); g.lineTo(25.5, 0.2); g.stroke();
          g.fillStyle = T_E;
          g.beginPath(); g.arc(10, -0.2, 1.1, 0, 7); g.fill();
          g.beginPath(); g.arc(18, 0.4, 1, 0, 7); g.fill();
          g.fillStyle = T_CORE;
          g.beginPath(); g.arc(30.9, -5.8, 1, 0, 7); g.fill();
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE JAWS OF LIFE — hydraulic jaws that BITE on every strike
          const gs = w.ramp(T_GUN), ss = w.ramp(T_STEEL), js = w.ramp(T_HIVIS);
          const open = w.attackKey ? (1 - (w.attackExt || 0)) * 3 + 1.5 : 2.6 + 1.2 * Math.sin(t * 2.2);
          if (w.isPlayer) { // the one radial gradient in the frame budget
            const rg = g.createRadialGradient(26, -1, 5, 26, -1, 16);
            rg.addColorStop(0, T_HALO_A);
            rg.addColorStop(0.6, T_HALO_B);
            rg.addColorStop(1, TRANSPARENT);
            g.fillStyle = rg;
            g.beginPath(); g.arc(26, -1, 16, 0, 7); g.fill();
          }
          g.fillStyle = gs.out;
          g.beginPath(); g.roundRect(1.6, -4.4, 12, 8.8, 2.2); g.fill();
          g.fillStyle = T_GUN;
          g.beginPath(); g.roundRect(2, -4, 11.2, 8, 2); g.fill();
          g.fillStyle = T_HIVIS;
          g.beginPath();
          g.moveTo(4, -3); g.lineTo(6.4, -3); g.lineTo(5, 3); g.lineTo(2.6, 3); g.closePath(); g.fill();
          g.beginPath();
          g.moveTo(9, -3); g.lineTo(11.4, -3); g.lineTo(10, 3); g.lineTo(7.6, 3); g.closePath(); g.fill();
          g.strokeStyle = ss.out; g.lineWidth = 4.6;
          g.beginPath(); g.moveTo(13, 0); g.lineTo(20, 0); g.stroke();
          g.strokeStyle = T_STEEL; g.lineWidth = 2.8;
          g.beginPath(); g.moveTo(13, 0); g.lineTo(20, 0); g.stroke();
          g.fillStyle = js.out;
          g.beginPath();
          g.moveTo(19, -1.4); g.lineTo(27, -4.4 - open); g.lineTo(33.6, -3 - open);
          g.lineTo(34.8, -0.8 - open * 0.7); g.lineTo(21, 0);
          g.closePath(); g.fill();
          g.fillStyle = T_HIVIS;
          g.beginPath();
          g.moveTo(19.8, -1.1); g.lineTo(27, -3.7 - open); g.lineTo(33.2, -2.5 - open);
          g.lineTo(34.1, -0.7 - open * 0.7); g.lineTo(21.4, -0.2);
          g.closePath(); g.fill();
          g.fillStyle = js.out;
          g.beginPath();
          g.moveTo(19, 1.4); g.lineTo(27, 4.4 + open); g.lineTo(33.6, 3 + open);
          g.lineTo(34.8, 0.8 + open * 0.7); g.lineTo(21, 0);
          g.closePath(); g.fill();
          g.fillStyle = T_HIVIS;
          g.beginPath();
          g.moveTo(19.8, 1.1); g.lineTo(27, 3.7 + open); g.lineTo(33.2, 2.5 + open);
          g.lineTo(34.1, 0.7 + open * 0.7); g.lineTo(21.4, 0.2);
          g.closePath(); g.fill();
          // serrations ride the inner edge, which pivots with `open`
          const ju = -0.7 - open * 0.7;
          const y29 = ju * 0.6107, y31 = ju * 0.7634, y33 = ju * 0.916;
          g.fillStyle = js.dk;
          g.beginPath();
          g.moveTo(28.1, y29); g.lineTo(29, y29 + 1.5); g.lineTo(29.9, y29); g.closePath();
          g.moveTo(30.1, y31); g.lineTo(31, y31 + 1.5); g.lineTo(31.9, y31); g.closePath();
          g.moveTo(32.1, y33); g.lineTo(33, y33 + 1.5); g.lineTo(33.9, y33); g.closePath();
          g.fill();
          g.beginPath();
          g.moveTo(28.1, -y29); g.lineTo(29, -y29 - 1.5); g.lineTo(29.9, -y29); g.closePath();
          g.moveTo(30.1, -y31); g.lineTo(31, -y31 - 1.5); g.lineTo(31.9, -y31); g.closePath();
          g.moveTo(32.1, -y33); g.lineTo(33, -y33 - 1.5); g.lineTo(33.9, -y33); g.closePath();
          g.fill();
          g.fillStyle = ss.out;
          g.beginPath(); g.arc(20, 0, 2.6, 0, 7); g.fill();
          g.fillStyle = T_STEEL;
          g.beginPath(); g.arc(20, 0, 2, 0, 7); g.fill();
          g.fillStyle = ss.hi;
          g.beginPath(); g.arc(19.4, -0.6, 0.8, 0, 7); g.fill();
          // water wreath: dark outer tongues, bright mid, near-white tips + core
          const s1 = Math.sin(t * 9) * 1.8;
          const s2 = Math.sin(t * 9 + 2.4) * 1.8;
          g.fillStyle = T_DEEP;
          g.beginPath();
          g.moveTo(21, -3); g.lineTo(24, -7.5 + s1); g.lineTo(27, -4.5 - open * 0.5); g.lineTo(30, -8 + s2);
          g.lineTo(33, -4 - open); g.lineTo(33.6, -3 - open); g.lineTo(27, -4.4 - open); g.lineTo(21, -1.4);
          g.closePath(); g.fill();
          g.fillStyle = T_E;
          g.beginPath();
          g.moveTo(22, -2.6); g.lineTo(24.5, -6.2 + s1); g.lineTo(27, -4.2 - open * 0.5); g.lineTo(30, -6.6 + s2);
          g.lineTo(32.8, -3.6 - open); g.lineTo(27, -4.2 - open); g.lineTo(22, -1.4);
          g.closePath();
          g.moveTo(22, 2.6); g.lineTo(24.5, 6.2 - s1); g.lineTo(27, 4.2 + open * 0.5); g.lineTo(30, 6.6 - s2);
          g.lineTo(32.8, 3.6 + open); g.lineTo(27, 4.2 + open); g.lineTo(22, 1.4);
          g.closePath(); g.fill();
          g.fillStyle = T_CORE;
          g.beginPath();
          g.moveTo(24, -6.4 + s1); g.lineTo(24.6, -8.6 + s1); g.lineTo(25.2, -6.4 + s1); g.closePath();
          g.moveTo(29.4, -6.8 + s2); g.lineTo(30, -9 + s2); g.lineTo(30.6, -6.8 + s2); g.closePath();
          g.moveTo(26.6, 5.2 + open * 0.5); g.lineTo(27.2, 7 + open * 0.5); g.lineTo(27.8, 5.2 + open * 0.5); g.closePath();
          g.fill();
          g.globalAlpha = 0.9;
          g.strokeStyle = T_CORE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(13.5, 0); g.lineTo(20, 0); g.stroke();
          g.globalAlpha = 1;
          if (w.isPlayer) { // the single allowed blur pass, zeroed immediately
            g.shadowColor = T_E; g.shadowBlur = 8;
            g.strokeStyle = T_E; g.lineWidth = 2;
            g.beginPath();
            g.moveTo(19, -1.4); g.lineTo(27, -4.4 - open); g.lineTo(33.6, -3 - open); g.lineTo(34.8, -0.8 - open * 0.7);
            g.moveTo(19, 1.4); g.lineTo(27, 4.4 + open); g.lineTo(33.6, 3 + open); g.lineTo(34.8, 0.8 + open * 0.7);
            g.stroke();
            g.shadowBlur = 0;
          }
          g.fillStyle = T_DROP;
          for (let i = 0; i < 16; i += 4) { // droplets FALL
            const ph = TIM_DROPS[i + 2];
            const cyc = (t * 0.55 + ph) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(TIM_DROPS[i] + 1.2 * Math.sin(t * 3 + ph * 6.28), TIM_DROPS[i + 1] + cyc * 8, TIM_DROPS[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          break;
        }
      }
      g.restore();
    },
  };

  // ============================== MYAH ==============================
  // Chore ascension: feather duster → broom → laundry basket → cordless vac →
  // the sentient robot mop. Every tier changes CARRY ANGLE, not just length.
  W.myah = {
    under: function (g, w) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.animT || 0;
      const ext = w.attackKey ? (w.attackExt || 0) : 0;
      const tier = w.tier;
      // four stances: upright duster/broom, flat basket, lance vac, hoisted mop
      const rot = tier === 3 ? -0.2 + ext * 0.6
        : tier === 4 ? -0.5 + ext
          : tier >= 5 ? -0.85 + ext * 0.95
            : -1.05 + ext * 0.9;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(rot);
      switch (tier) {
        case 1: { // T1 FEATHER DUSTER — one blob of dollar-store fluff
          const s = w.ramp(M_PLASTIC);
          g.strokeStyle = s.out; g.lineWidth = 3.6;
          g.beginPath(); g.moveTo(-2, 0); g.lineTo(6.5, 0); g.stroke();
          g.strokeStyle = M_PLASTIC; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-2, 0); g.lineTo(6.5, 0); g.stroke();
          g.fillStyle = s.out;
          g.beginPath(); g.ellipse(9.5, 0, 4.6, 3.2, 0, 0, 7); g.fill();
          g.fillStyle = s.lt;
          g.beginPath(); g.ellipse(9.5, 0, 3.8, 2.6, 0, 0, 7); g.fill();
          g.strokeStyle = s.hi; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(7, -1.8); g.lineTo(11.6, -2.2); g.stroke();
          break;
        }
        case 2: { // T2 BROOM — flared bristle head, stitch band, one spec dot
          const hs = w.ramp(M_WOOD), s = w.ramp(M_STRAW);
          g.strokeStyle = hs.out; g.lineWidth = 3.8;
          g.beginPath(); g.moveTo(-3, 0); g.lineTo(12, 0); g.stroke();
          g.strokeStyle = M_WOOD; g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(-3, 0); g.lineTo(12, 0); g.stroke();
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(11.5, -3.8); g.lineTo(17.6, -5.4); g.lineTo(18.6, 5.4); g.lineTo(11.5, 3.8);
          g.closePath(); g.fill();
          g.fillStyle = M_STRAW;
          g.beginPath();
          g.moveTo(11.9, -3.2); g.lineTo(17.2, -4.6); g.lineTo(18.1, 4.6); g.lineTo(11.9, 3.2);
          g.closePath(); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(12.5, -2.2); g.lineTo(17.4, -3);
          g.moveTo(12.5, 0); g.lineTo(17.8, 0);
          g.moveTo(12.5, 2.2); g.lineTo(17.4, 3);
          g.stroke();
          g.fillStyle = M_STITCH; g.fillRect(11.2, -3.4, 2, 6.8);
          g.fillStyle = s.hi;
          g.beginPath(); g.arc(13, -3, 0.8, 0, 7); g.fill();
          break;
        }
        case 3: { // T3 LAUNDRY BASKET — total silhouette break, carried flat
          const s = w.ramp(M_PINK);
          g.fillStyle = s.out;
          g.beginPath();
          g.moveTo(-1.5, -7.5); g.lineTo(14.5, -7.5); g.lineTo(12.5, 2.5); g.lineTo(0.5, 2.5);
          g.closePath(); g.fill();
          g.fillStyle = M_PINK;
          g.beginPath();
          g.moveTo(-0.7, -6.8); g.lineTo(13.7, -6.8); g.lineTo(11.9, 1.8); g.lineTo(1.1, 1.8);
          g.closePath(); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 0.9;
          g.beginPath();
          g.moveTo(3.3, -6.4); g.lineTo(3.3, 1.4);
          g.moveTo(6.6, -6.4); g.lineTo(6.6, 1.4);
          g.moveTo(9.9, -6.4); g.lineTo(9.9, 1.4);
          g.stroke();
          g.beginPath();
          g.moveTo(0.3, -3.5); g.lineTo(13, -3.5);
          g.moveTo(0.3, -0.5); g.lineTo(13, -0.5);
          g.stroke();
          g.fillStyle = s.lt; g.fillRect(-1.9, -8.3, 16.8, 2);
          g.fillStyle = M_WHITES;
          g.beginPath();
          g.moveTo(5.8, -8.6); g.arc(3, -8.6, 2.8, 0, 7);
          g.moveTo(10.2, -9.6); g.arc(7, -9.6, 3.2, 0, 7);
          g.moveTo(13.6, -8.4); g.arc(11, -8.4, 2.6, 0, 7);
          g.fill();
          g.fillStyle = M_DENIM;
          g.beginPath(); g.arc(9.6, -8, 1.8, 0, 7); g.fill();
          g.fillStyle = M_SOCK;
          g.beginPath();
          g.moveTo(13.5, -6); g.lineTo(15.3, -2.6); g.lineTo(14.9, -0.6); g.lineTo(13.7, -1); g.lineTo(14.3, -3.2);
          g.closePath(); g.fill();
          g.strokeStyle = M_STRIPE; g.lineWidth = 0.8;
          g.beginPath(); g.moveTo(14, -2.2); g.lineTo(15, -2.5); g.stroke();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = L_WHITE;
          star4(g, 7, -10.6);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 CORDLESS VACUUM — first light: cyclone core + suction seam
          const ms = w.ramp(M_METAL), s = w.ramp(M_TEAL);
          g.strokeStyle = ms.out; g.lineWidth = 4;
          g.beginPath(); g.moveTo(4, 0); g.lineTo(22, 0); g.stroke();
          g.strokeStyle = M_METAL; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(4, 0); g.lineTo(22, 0); g.stroke();
          g.fillStyle = s.out;
          g.beginPath(); g.roundRect(-3.4, -5.2, 9.2, 8.4, 2.4); g.fill();
          g.fillStyle = M_TEAL;
          g.beginPath(); g.roundRect(-3, -4.8, 8.4, 7.6, 2.2); g.fill();
          g.strokeStyle = s.dk; g.lineWidth = 2;
          g.beginPath(); g.arc(-1.4, -6.4, 2.6, 2.83, 6.44); g.stroke();
          g.fillStyle = M_CUP;
          g.beginPath(); g.roundRect(1.4, -4.4, 3.6, 7, 1.4); g.fill();
          g.fillStyle = s.out;
          g.beginPath(); g.roundRect(21, -2.2, 7.4, 6, 1.8); g.fill();
          g.fillStyle = M_TEAL;
          g.beginPath(); g.roundRect(21.4, -1.8, 6.6, 5.2, 1.6); g.fill();
          g.fillStyle = s.lt; g.fillRect(21.4, -1.8, 6.6, 1.4);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7);
          g.fillStyle = M_E;
          g.beginPath(); g.arc(3.2, -1, 1.7, 0, 7); g.fill();
          g.strokeStyle = M_E; g.lineWidth = 1;
          g.beginPath(); g.arc(3.2, -1, 2.8, t * 4, t * 4 + 1.8); g.stroke();
          g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(5.2, 0.2); g.lineTo(21, 0.2); g.stroke();
          g.fillRect(21.8, 2.2, 5.8, 1);
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE SENTIENT ROBOT MOP — it has a face, and it is judging
          const ms = w.ramp(M_METAL), cs = w.ramp(M_WHITES);
          if (w.isPlayer) { // the one radial gradient in the frame budget
            const rg = g.createRadialGradient(28, -1, 5, 28, -1, 14);
            rg.addColorStop(0, M_HALO_A);
            rg.addColorStop(0.6, M_HALO_B);
            rg.addColorStop(1, TRANSPARENT);
            g.fillStyle = rg;
            g.beginPath(); g.arc(28, -1, 14, 0, 7); g.fill();
          }
          g.strokeStyle = ms.out; g.lineWidth = 4.4;
          g.beginPath(); g.moveTo(-3, 0); g.lineTo(22, 0); g.stroke();
          g.strokeStyle = M_METAL; g.lineWidth = 2.6;
          g.beginPath(); g.moveTo(-3, 0); g.lineTo(22, 0); g.stroke();
          g.strokeStyle = ms.hi; g.lineWidth = 1;
          g.beginPath(); g.moveTo(-1, -0.9); g.lineTo(20, -0.9); g.stroke();
          g.fillStyle = cs.out;
          g.beginPath(); g.roundRect(21, -6.6, 13.4, 10.8, 4.4); g.fill();
          g.fillStyle = M_WHITES;
          g.beginPath(); g.roundRect(21.6, -6, 12.2, 9.6, 4); g.fill();
          g.fillStyle = cs.lt;
          g.beginPath(); g.roundRect(21.6, -6, 12.2, 2.6, 2); g.fill();
          g.fillStyle = w.INK;
          g.beginPath(); g.roundRect(24.2, -4.2, 7.2, 3, 1.4); g.fill();
          g.globalAlpha = 0.7 + 0.3 * Math.sin(t * 5);
          g.fillStyle = M_E;
          g.beginPath();
          g.moveTo(27.2, -2.7); g.arc(26.2, -2.7, 1, 0, 7);
          g.moveTo(30.4, -2.7); g.arc(29.4, -2.7, 1, 0, 7);
          g.fill();
          g.globalAlpha = 1;
          g.strokeStyle = cs.dk; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(27.6, -6.6); g.lineTo(27.6, -9.4); g.stroke();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6.3);
          g.fillStyle = M_E;
          g.beginPath(); g.arc(27.6, -10.2, 1.2, 0, 7); g.fill();
          g.globalAlpha = 1;
          g.fillStyle = cs.dk;
          g.beginPath();
          g.moveTo(25.4, 5); g.arc(23.3, 5, 2.1, 0, 3.14);
          g.moveTo(29.3, 5.4); g.arc(27.1, 5.4, 2.2, 0, 3.14);
          g.moveTo(33, 5.2); g.arc(30.9, 5.2, 2.1, 0, 3.14);
          g.moveTo(35.2, 4.6); g.arc(33.6, 4.6, 1.6, 0, 3.14);
          g.fill();
          const tkx = 27.5 + 2.6 * Math.cos(t * 9), tky = 5 + 1.1 * Math.sin(t * 9);
          g.strokeStyle = ms.dk; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(tkx, tky); g.lineTo(tkx + 1.6, tky); g.stroke();
          // suds wreath: outer foam, bright mid, white core suds + core water line
          const s1 = Math.sin(t * 6) * 0.8;
          const s2 = Math.sin(t * 6 + 2.1) * 0.8;
          const s3 = Math.sin(t * 6 + 4.2) * 0.8;
          g.fillStyle = M_FOAM;
          g.beginPath();
          g.moveTo(24.4, -7.5 + s1); g.arc(22, -7.5 + s1, 2.4, 0, 7);
          g.moveTo(28.8, -8.6 + s2); g.arc(26, -8.6 + s2, 2.8, 0, 7);
          g.moveTo(32.6, -8.2 + s3); g.arc(30, -8.2 + s3, 2.6, 0, 7);
          g.moveTo(35.4, -6.6 + s1); g.arc(33.4, -6.6 + s1, 2, 0, 7);
          g.fill();
          g.fillStyle = M_CORE;
          g.beginPath();
          g.moveTo(25.8, -8 + s2); g.arc(24, -8 + s2, 1.8, 0, 7);
          g.moveTo(30, -8.8 + s3); g.arc(28, -8.8 + s3, 2, 0, 7);
          g.moveTo(33.2, -7.6 + s1); g.arc(31.6, -7.6 + s1, 1.6, 0, 7);
          g.fill();
          g.fillStyle = L_WHITE;
          g.beginPath();
          g.moveTo(27.5, -8.9 + s3); g.arc(26.5, -8.9 + s3, 1, 0, 7);
          g.moveTo(31.4, -8.4 + s1); g.arc(30.5, -8.4 + s1, 0.9, 0, 7);
          g.fill();
          g.globalAlpha = 0.9;
          g.strokeStyle = M_CORE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(21.6, 3.6); g.lineTo(33.8, 3.6); g.stroke();
          g.globalAlpha = 1;
          if (w.isPlayer) { // the single allowed blur pass, zeroed immediately
            g.shadowColor = M_E; g.shadowBlur = 7;
            g.strokeStyle = M_E; g.lineWidth = 1.8;
            g.beginPath(); g.roundRect(24.2, -4.2, 7.2, 3, 1.4); g.stroke();
            g.shadowBlur = 0;
          }
          g.strokeStyle = M_CORE; g.lineWidth = 0.8;
          for (let i = 0; i < 16; i += 4) { // bubbles rise as rings
            const ph = MYAH_BUBBLES[i + 2];
            const cyc = (t * 0.5 + ph) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(MYAH_BUBBLES[i] + 1.5 * Math.sin(t * 3 + ph * 6.28), MYAH_BUBBLES[i + 1] - cyc * 9, MYAH_BUBBLES[i + 3], 0, 7);
            g.stroke();
          }
          g.globalAlpha = 1;
          break;
        }
      }
      g.restore();
    },
  };

  // strike-FX ladder data: energy hex, core-white, particle gravity, T5 heavy words
  FX.levi = { e: L_E, c: L_CORE, grav: false, words: LEVI_WORDS };
  FX.ronathon = { e: R_E, c: R_CORE, grav: false, words: RON_WORDS };
  FX.tim = { e: T_E, c: T_CORE, grav: true, words: TIM_WORDS };
  FX.myah = { e: M_E, c: M_CORE, grav: false, words: MYAH_WORDS };
})();
