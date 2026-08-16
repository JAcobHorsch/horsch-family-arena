// weapons-b.js — weapon bodies for JACOB (plumbing tools), SAMANTHA (the toy
// box), CASSANDRA (the deli) and ERIKA (a bare hand plus a great deal of
// ceremony). Registered on window.WEAPON_BODIES; drawFighter calls `under`
// before the fist mitts (grips the hand must overlap) and `over` after them
// (hand-riding art). Local space matches drawFighter: (0,0) = feet, -y is up,
// +x is forward, facing handled by the caller's outer flip. The caller does not
// save/restore around these calls — each body balances its own.
(function () {
  const W = (window.WEAPON_BODIES = window.WEAPON_BODIES || {});

  // ============ hoisted palettes & tables (nothing allocated per frame) ============
  // jacob — plunger wood, basin steel, copper, dimmed press gold, golden wrench
  const J_WOOD = '#c98d48';
  const J_CUP = '#b03a2f';
  const J_LIP = '#e06a5a';
  const J_STEEL = '#c9ccd8';
  const J_COPPER = '#b87333';
  const J_GREEN = '#4ae86a';
  const J_WHEEL = '#dfe3e8';
  const J_PRESS = '#ba9842';
  const J_PLASTIC = '#3a3a42';
  const J_BATTERY = '#2a2e38';
  const J_GOLD = '#ffd24a';
  const J_WRAP = '#7a4a20';
  const J_GLOW = '#fff2b8';
  const J_TONGUE = '#c9781e';
  const J_CORE = '#fff6dd';
  const J_MOTE = '#ffe89a';
  // halo stops baked as literal alpha hexes — runtime concat is banned
  const J_HALO0 = '#ffd24a66';
  const J_HALO1 = '#ffd24a22';
  const J_HALO2 = '#ffd24a00';
  const JACOB_MOTES = [[8, -6, 0.0, 1.2], [15, -8, 0.33, 1.0], [21, -5, 0.62, 1.3], [26, -9, 0.85, 0.9]];

  // samantha — bath-worn duck, foam blue, blaster orange, pressed steel, LEGO red
  const S_DUCK = '#bcb24c';
  const S_BEAK = '#c9781e';
  const S_FOAM = '#4ab2e8';
  const S_GUARD = '#ffd24a';
  const S_DARK = '#3a3a42';
  const S_NERF = '#e8742a';
  const S_TEAL = '#4ae8b2';
  const S_BORE = '#2a2e38';
  const S_GREY = '#8d8d96';
  const S_TONKA = '#aa3e42';
  const S_GLASS = '#bfe8f4';
  const S_LEGO = '#e8524a';
  const S_STUD = '#ff7a72';
  const S_TONGUE = '#8a1e28';
  const S_INNER = '#ff9a8a';
  const S_HALO0 = '#e8524a55';
  const S_HALO1 = '#e8524a1e';
  const S_HALO2 = '#e8524a00';
  const LEGO_STUDS = [1.8, 6, 10.2, 14.4];
  const SAM_STARS = [[3, -12, 0.0, 1.0], [9, -14, 0.4, 1.2], [15, -11, 0.7, 0.9]];

  // cassandra — pale sandwich bread up through honest toast; T5 light is the growth
  const C_PBJ = '#cbb98e';
  const C_JELLY = '#8a3a8c';
  const C_PB = '#c9781e';
  const C_TOAST = '#e0a860';
  const C_CHEESE = '#ffc83a';
  const C_CLUB = '#f0c084';
  const C_TOMATO = '#d43b2f';
  const C_LETTUCE = '#7dc45f';
  const C_BACON = '#c98d48';
  const C_CREAM = '#fff4dd';
  const C_PICK = '#8a6a48';
  const C_FRILL = '#4adbe8';
  const C_OLIVE = '#37b34a';
  const C_ROLL = '#ba9842';
  const C_GOLD = '#ffd24a';
  const C_MEAT = '#7a4030';
  const C_SALAMI = '#c25a5a';
  const C_ONION = '#e8d8f0';
  const C_CORE = '#fff6dd';
  const C_HALO0 = '#ffd24a55';
  const C_HALO1 = '#ffd24a1e';
  const C_HALO2 = '#ffd24a00';
  const CASS_LETTUCE = [0, 5.5, 11, 16.5, 22, 27.5];
  // 5th slot picks the mote hex: 0 = steam cream, 1 = basil green
  const CASS_MOTES = [[6, -14, 0.0, 1.1, 0], [14, -16, 0.3, 1.3, 1], [22, -14, 0.6, 1.0, 0], [28, -15, 0.85, 0.9, 1]];

  // erika — five near-identical grays live in data; the art is all rgba ceremony
  const E_BAND = '#f4f0e6';
  const E_STRIPE = '#d43b2f';
  const E_DUST = '#d8d8e0';
  const E_A20 = 'rgba(255,255,255,0.2)';
  const E_A25 = 'rgba(255,255,255,0.25)';
  const E_A26 = 'rgba(255,255,255,0.26)';
  const E_A28 = 'rgba(255,255,255,0.28)';
  const E_A30 = 'rgba(255,255,255,0.3)';
  const E_A32 = 'rgba(255,255,255,0.32)';
  const E_A34 = 'rgba(255,255,255,0.34)';
  const E_A35 = 'rgba(255,255,255,0.35)';
  const E_A40 = 'rgba(255,255,255,0.4)';
  const E_A50 = 'rgba(255,255,255,0.5)';
  const E_A55 = 'rgba(255,255,255,0.55)';
  const E_A60 = 'rgba(255,255,255,0.6)';
  const E_A70 = 'rgba(255,255,255,0.7)';
  const E_RAY = 'rgba(255,255,255,0.10)';
  const E_HALO0 = 'rgba(255,255,255,0.14)';
  const E_HALO1 = 'rgba(255,255,255,0.05)';
  const E_HALO2 = 'rgba(255,255,255,0)';
  const ERIKA_RAYS = [0, 2.09, 4.19];
  // F-relative dust: dx, dy, phase, r — these DRIFT DOWN, dust settles
  const ERIKA_MOTES = [[5, -8, 0.0, 0.8], [-6, -6, 0.4, 0.7], [2, -11, 0.7, 0.8]];

  // shared literal, used by every twinkle/star/core in this file
  const WHITE = '#ffffff';

  // ---- shared painters ----
  // 4-point twinkle star (the Addi ice-sword pattern, game.js:3197): a = spike, b = waist
  function star4(g, x, y, a, b) {
    g.beginPath();
    g.moveTo(x - a, y); g.lineTo(x - b, y - b); g.lineTo(x, y - a); g.lineTo(x + b, y - b);
    g.lineTo(x + a, y); g.lineTo(x + b, y + b); g.lineTo(x, y + a); g.lineTo(x - b, y + b);
    g.closePath(); g.fill();
  }

  // ================================= JACOB =================================
  // Union-grade plumbing tools: garage plunger -> the radiant Golden Pipe Wrench.
  // Grip end sits under the painted fist, so this is an `under` body.
  W.jacob = {
    under: function (g, w) {
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.7 + (w.attackKey ? w.attackExt * 1.2 : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.tier;

      if (t === 1) {
        // T1 PLUNGER — one material, one sun line, zero light, zero animation
        const R = w.ramp(J_WOOD);
        g.strokeStyle = R.out; g.lineWidth = 4.6;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(12, 0); g.stroke();
        g.strokeStyle = J_WOOD; g.lineWidth = 2.8;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(12, 0); g.stroke();
        g.strokeStyle = R.lt; g.lineWidth = 1;
        g.beginPath(); g.moveTo(1, -0.8); g.lineTo(11, -0.8); g.stroke();
        const C = w.ramp(J_CUP);
        g.fillStyle = C.out;
        g.beginPath(); g.arc(13.4, 0, 5.2, -1.75, 1.75); g.closePath(); g.fill();
        g.fillStyle = J_CUP;
        g.beginPath(); g.arc(13.4, 0, 4.4, -1.7, 1.7); g.closePath(); g.fill();
        g.strokeStyle = J_LIP; g.lineWidth = 1;
        g.beginPath(); g.arc(13.4, 0, 3.4, -1.35, 1.35); g.stroke();
      } else if (t === 2) {
        // T2 BASIN WRENCH — real steel, full ramp + specular; T-bar is the one silhouette add
        const R = w.ramp(J_STEEL);
        g.strokeStyle = R.out; g.lineWidth = 4.8;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.stroke();
        g.strokeStyle = R.dk; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.stroke();
        g.strokeStyle = J_STEEL; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(0.5, -0.5); g.lineTo(15.5, -0.5); g.stroke();
        g.strokeStyle = R.out; g.lineWidth = 3.6;
        g.beginPath(); g.moveTo(0, -4.5); g.lineTo(0, 4.5); g.stroke();
        g.strokeStyle = J_STEEL; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, -4.5); g.lineTo(0, 4.5); g.stroke();
        g.fillStyle = R.out;
        g.beginPath(); g.moveTo(15, -1.8); g.lineTo(19.5, -3.2); g.lineTo(20.6, -0.6); g.lineTo(17.4, 1.4); g.closePath(); g.fill();
        g.fillStyle = J_STEEL;
        g.beginPath(); g.moveTo(15.6, -1.4); g.lineTo(19.2, -2.5); g.lineTo(19.9, -0.7); g.lineTo(17.3, 0.7); g.closePath(); g.fill();
        g.fillStyle = w.INK; g.fillRect(17.6, -1.9, 1.5, 1.5);
        g.fillStyle = R.dk; g.beginPath(); g.arc(15.6, -0.2, 1.2, 0, 7); g.fill();
        g.fillStyle = R.hi; g.beginPath(); g.arc(16.2, -2.2, 0.9, 0, 7); g.fill();
      } else if (t === 3) {
        // T3 PIPE CUTTER — copper + the Jacob-green grip band; twinkle is the only motion
        const R = w.ramp(J_COPPER);
        g.strokeStyle = R.out; g.lineWidth = 5;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(13, 0); g.stroke();
        g.strokeStyle = J_COPPER; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(13, 0); g.stroke();
        g.fillStyle = J_GREEN; g.fillRect(1.5, -1.8, 4, 3.6);
        g.strokeStyle = w.ramp(J_GREEN).dk; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(1.5, 0.6); g.lineTo(5.5, 0.6); g.stroke();
        g.fillStyle = R.out; g.beginPath(); g.arc(-2.2, 0, 2.4, 0, 7); g.fill();
        g.fillStyle = J_COPPER; g.beginPath(); g.arc(-2.2, 0, 1.7, 0, 7); g.fill();
        g.strokeStyle = R.dk; g.lineWidth = 0.7;
        g.beginPath(); g.moveTo(-3.4, 0); g.lineTo(-1, 0); g.stroke();
        g.strokeStyle = R.out; g.lineWidth = 4.4;
        g.beginPath(); g.arc(17, 0, 6.3, -2.2, 2.2); g.stroke();
        g.strokeStyle = J_COPPER; g.lineWidth = 2.8;
        g.beginPath(); g.arc(17, 0, 6.3, -2.2, 2.2); g.stroke();
        const H = w.ramp(J_WHEEL);
        g.fillStyle = H.out; g.beginPath(); g.arc(17, 0, 3.1, 0, 7); g.fill();
        g.fillStyle = J_WHEEL; g.beginPath(); g.arc(17, 0, 2.3, 0, 7); g.fill();
        g.fillStyle = w.INK; g.beginPath(); g.arc(17, 0, 0.8, 0, 7); g.fill();
        g.fillStyle = H.hi; g.beginPath(); g.arc(16.2, -0.9, 0.7, 0, 7); g.fill();
        g.fillStyle = R.dk;
        g.beginPath(); g.arc(7, -1.1, 0.8, 0, 7); g.arc(10, 1.1, 0.8, 0, 7); g.fill();
        g.globalAlpha = 0.5 + 0.5 * Math.sin(w.animT * 7);
        g.fillStyle = WHITE; star4(g, 17, -4.6, 1.6, 0.45);
        g.globalAlpha = 1;
      } else if (t === 4) {
        // T4 PRESS TOOL — dimmed gold steel plus the first light: a pulsing core seam
        const R = w.ramp(J_PRESS);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.6, -3.6, 20.2, 7.2, 2.2); g.fill();
        g.fillStyle = J_PRESS; g.beginPath(); g.roundRect(-2, -3, 19, 6, 1.8); g.fill();
        g.fillStyle = R.lt; g.fillRect(-2, -3, 19, 1.6);
        g.fillStyle = R.dk; g.fillRect(-2, 1.4, 19, 1.6);
        const P = w.ramp(J_PLASTIC);
        g.fillStyle = P.out; g.beginPath(); g.roundRect(-1.2, 2.8, 4.4, 7.4, 1.6); g.fill();
        g.fillStyle = J_PLASTIC; g.beginPath(); g.roundRect(-0.7, 3.3, 3.4, 6.4, 1.3); g.fill();
        g.strokeStyle = P.lt; g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(0.2, 4.8); g.lineTo(2.4, 4.8);
        g.moveTo(0.2, 6.8); g.lineTo(2.4, 6.8);
        g.stroke();
        g.fillStyle = w.ramp(J_BATTERY).out; g.beginPath(); g.roundRect(-4.8, 0.6, 4, 5, 1); g.fill();
        g.fillStyle = J_BATTERY; g.beginPath(); g.roundRect(-4.3, 1.1, 3, 4, 0.8); g.fill();
        // split jaws — the T4 silhouette beat
        g.fillStyle = R.out;
        g.beginPath(); g.moveTo(17, -3.4); g.lineTo(23.4, -5.6); g.lineTo(26.8, -2.2); g.lineTo(20.4, -0.6); g.closePath(); g.fill();
        g.fillStyle = J_WHEEL;
        g.beginPath(); g.moveTo(17.6, -3); g.lineTo(23.1, -4.9); g.lineTo(25.9, -2.2); g.lineTo(20.6, -1.1); g.closePath(); g.fill();
        g.fillStyle = R.out;
        g.beginPath(); g.moveTo(17, 3.4); g.lineTo(23.4, 5.6); g.lineTo(26.8, 2.2); g.lineTo(20.4, 0.6); g.closePath(); g.fill();
        g.fillStyle = J_WHEEL;
        g.beginPath(); g.moveTo(17.6, 3); g.lineTo(23.1, 4.9); g.lineTo(25.9, 2.2); g.lineTo(20.6, 1.1); g.closePath(); g.fill();
        g.fillStyle = R.dk; g.beginPath(); g.arc(18.6, 0, 1.5, 0, 7); g.fill();
        g.beginPath(); g.arc(2, -1.6, 0.7, 0, 7); g.arc(8, -1.6, 0.7, 0, 7); g.arc(14, -1.6, 0.7, 0, 7); g.fill();
        // energy pass — flat fills only, no gradient, no shadowBlur
        g.globalAlpha = 0.6 + 0.4 * Math.sin(w.animT * 6);
        g.fillStyle = J_GOLD; g.fillRect(0, -0.7, 16.4, 1.4);
        g.beginPath(); g.arc(-2.8, -1.4, 1, 0, 7); g.fill();
        g.fillStyle = J_GLOW; g.fillRect(3, -0.35, 10, 0.7);
        g.globalAlpha = 1;
      } else {
        // T5 THE GOLDEN PIPE WRENCH — order: halo, steel, wreath, core, motes
        const R = w.ramp(J_GOLD);
        if (w.isPlayer) { // the one radial gradient in the whole weapon budget
          const hg = g.createRadialGradient(17, -2, 4, 17, -2, 26);
          hg.addColorStop(0, J_HALO0);
          hg.addColorStop(0.6, J_HALO1);
          hg.addColorStop(1, J_HALO2);
          g.fillStyle = hg;
          g.beginPath(); g.arc(17, -2, 26 * (1 + 0.05 * Math.sin(w.animT * 5)), 0, 7); g.fill();
        }
        g.strokeStyle = R.out; g.lineWidth = 6;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(24, 0); g.stroke();
        g.strokeStyle = J_GOLD; g.lineWidth = 3.8;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(24, 0); g.stroke();
        g.fillStyle = J_WRAP; g.beginPath(); g.roundRect(1, -2.2, 7, 4.4, 1.8); g.fill();
        g.strokeStyle = w.ramp(J_WRAP).dk; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(2.6, -2.2); g.lineTo(2.6, 2.2);
        g.moveTo(4.6, -2.2); g.lineTo(4.6, 2.2);
        g.moveTo(6.6, -2.2); g.lineTo(6.6, 2.2);
        g.stroke();
        g.fillStyle = R.out; g.beginPath(); g.arc(-2.6, 0, 2.6, 0, 7); g.fill();
        g.globalAlpha = 0.6 + 0.4 * Math.sin(w.animT * 6);
        g.fillStyle = J_GLOW; g.beginPath(); g.arc(-2.6, 0, 1.8, 0, 7); g.fill();
        g.globalAlpha = 1;
        g.fillStyle = R.out; g.beginPath(); g.roundRect(22.5, -8.2, 9.6, 9.4, 1.8); g.fill();
        g.fillStyle = J_GOLD; g.beginPath(); g.roundRect(23.1, -7.6, 8.4, 8.2, 1.5); g.fill();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(24.4, -0.2, 7, 4.6, 1.2); g.fill();
        g.fillStyle = J_GOLD; g.beginPath(); g.roundRect(24.9, 0.3, 6, 3.6, 1); g.fill();
        g.fillStyle = w.INK; g.fillRect(26.4, -5.4, 3.2, 3);
        g.fillStyle = R.dk; g.beginPath(); g.arc(22.2, -1.6, 2.3, 0, 7); g.fill();
        g.strokeStyle = R.hi; g.lineWidth = 1;
        g.beginPath(); g.arc(22.2, -1.6, 1.4, 0, 7); g.stroke();
        g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(2, -1.2); g.lineTo(21, -1.2); g.stroke();
        // wreath — 3 fills, tongues licking off the top spine
        const f1 = Math.sin(w.animT * 13) * 1.5;
        const f2 = Math.sin(w.animT * 13 + 2.1) * 1.5;
        const f3 = Math.sin(w.animT * 13 + 4.2) * 1.5;
        g.fillStyle = J_TONGUE;
        g.beginPath();
        g.moveTo(6, -2.5); g.lineTo(9, -8 - f1); g.lineTo(12, -2.5); g.lineTo(15, -9.5 - f2);
        g.lineTo(18, -2.5); g.lineTo(21, -8.5 - f3); g.lineTo(24, -2.5);
        g.closePath(); g.fill();
        g.fillStyle = J_GOLD;
        g.beginPath();
        g.moveTo(6, -2.5); g.lineTo(9, -6.2 - f1 * 0.7); g.lineTo(12, -2.5); g.lineTo(15, -7.4 - f2 * 0.7);
        g.lineTo(18, -2.5); g.lineTo(21, -6.6 - f3 * 0.7); g.lineTo(24, -2.5);
        g.closePath(); g.fill();
        g.fillStyle = J_GLOW;
        g.beginPath();
        g.moveTo(13, -2.5); g.lineTo(15, -5.6 - f2 * 0.5); g.lineTo(17, -2.5); g.closePath();
        g.moveTo(19, -2.5); g.lineTo(21, -5 - f3 * 0.5); g.lineTo(23, -2.5); g.closePath();
        g.fill();
        // core line — the single player-only shadowBlur pass, zeroed immediately
        if (w.isPlayer) { g.shadowColor = J_GOLD; g.shadowBlur = 8; }
        g.strokeStyle = J_CORE; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(3, -0.6); g.lineTo(30, -0.6); g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = J_MOTE;
        for (let i = 0; i < JACOB_MOTES.length; i++) {
          const m = JACOB_MOTES[i];
          const cyc = (w.animT * 0.5 + m[2]) % 1;
          g.globalAlpha = (1 - cyc) * 0.8;
          g.beginPath();
          g.arc(m[0] + 1.5 * Math.sin(w.animT * 3 + m[2] * 6), m[1] - cyc * 10, m[3], 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      g.restore();
    },
  };

  // =============================== SAMANTHA ===============================
  // Toy box escalation: bath duck -> foam sword -> Nerf -> pressed-steel Tonka ->
  // The Forbidden LEGO. Every one of them is clutched, so `under`.
  W.samantha = {
    under: function (g, w) {
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.5 + (w.attackKey ? w.attackExt * 1.1 : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.tier;

      if (t === 1) {
        // T1 RUBBER DUCK — grubby, held by the body, zero light
        const R = w.ramp(S_DUCK);
        g.fillStyle = R.out; g.beginPath(); g.ellipse(5, -1, 5.6, 4.4, 0, 0, 7); g.fill();
        g.fillStyle = S_DUCK; g.beginPath(); g.ellipse(5, -1, 4.8, 3.7, 0, 0, 7); g.fill();
        g.fillStyle = R.out; g.beginPath(); g.arc(9.6, -4.6, 3, 0, 7); g.fill();
        g.fillStyle = S_DUCK; g.beginPath(); g.arc(9.6, -4.6, 2.4, 0, 7); g.fill();
        g.fillStyle = S_BEAK;
        g.beginPath(); g.moveTo(11.6, -4.8); g.lineTo(14, -4); g.lineTo(11.6, -3.4); g.closePath(); g.fill();
        g.fillStyle = w.INK; g.beginPath(); g.arc(10.2, -5.2, 0.5, 0, 7); g.fill();
        g.strokeStyle = R.lt; g.lineWidth = 1;
        g.beginPath(); g.arc(4, -2.6, 2.4, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
      } else if (t === 2) {
        // T2 FOAM SWORD — honest saturated foam; the guard disc is the silhouette add
        const R = w.ramp(S_FOAM);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.2, -3.5, 18.7, 7, 3.4); g.fill();
        g.fillStyle = S_FOAM; g.beginPath(); g.roundRect(0, -2.7, 16.4, 5.4, 2.7); g.fill();
        g.fillStyle = R.lt; g.fillRect(0.5, -2.7, 15, 1.6);
        g.strokeStyle = R.dk; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(1, 0.8); g.lineTo(15.5, 0.8); g.stroke();
        g.fillStyle = w.ramp(S_GUARD).out; g.beginPath(); g.arc(-0.6, 0, 3.6, 0, 7); g.fill();
        g.fillStyle = S_GUARD; g.beginPath(); g.arc(-0.6, 0, 2.8, 0, 7); g.fill();
        g.fillStyle = S_DARK; g.beginPath(); g.roundRect(-4.6, -1.6, 4, 3.2, 1.4); g.fill();
        g.fillStyle = R.hi; g.beginPath(); g.arc(12.4, -1.6, 0.9, 0, 7); g.fill();
      } else if (t === 3) {
        // T3 NERF BLASTER — blaster orange + her teal shell panel; muzzle twinkle only
        const R = w.ramp(S_NERF);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.6, -4.2, 15.2, 8.4, 2.6); g.fill();
        g.fillStyle = S_NERF; g.beginPath(); g.roundRect(-2, -3.6, 14, 7.2, 2.2); g.fill();
        g.fillStyle = R.lt; g.fillRect(-2, -3.6, 14, 1.8);
        g.fillStyle = S_TEAL; g.beginPath(); g.roundRect(1, -2.2, 6.4, 4.6, 1.4); g.fill();
        g.strokeStyle = w.ramp(S_TEAL).dk; g.lineWidth = 0.8;
        g.beginPath(); g.roundRect(1, -2.2, 6.4, 4.6, 1.4); g.stroke();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(12, -2.6, 8.6, 5.2, 2); g.fill();
        g.fillStyle = S_NERF; g.beginPath(); g.roundRect(12.5, -2.1, 7.6, 4.2, 1.7); g.fill();
        g.fillStyle = R.dk; g.beginPath(); g.arc(20.4, 0, 2.1, 0, 7); g.fill();
        g.fillStyle = S_BORE; g.beginPath(); g.arc(20.4, 0, 1.3, 0, 7); g.fill();
        g.fillStyle = S_FOAM; g.beginPath(); g.arc(20.4, 0, 0.9, 0, 7); g.fill();
        g.fillStyle = R.out; g.fillRect(0, -5.6, 9, 2);
        g.fillStyle = S_GREY; g.fillRect(0.4, -5.2, 8.2, 1.4);
        g.fillRect(7.4, -6.6, 1.6, 1.4);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.4, 3.6, 4.6, 6.8, 1.6); g.fill();
        g.fillStyle = S_NERF; g.beginPath(); g.roundRect(-0.9, 4.1, 3.6, 5.8, 1.3); g.fill();
        g.fillStyle = R.dk;
        g.beginPath(); g.arc(3, 1.4, 0.7, 0, 7); g.arc(9, 1.4, 0.7, 0, 7); g.fill();
        g.globalAlpha = 0.5 + 0.5 * Math.sin(w.animT * 7);
        g.fillStyle = WHITE; star4(g, 13.8, -3.4, 1.6, 0.45);
        g.globalAlpha = 1;
      } else if (t === 4) {
        // T4 METAL TONKA TRUCK — pressed steel, swung by the tailgate; headlights pulse
        const R = w.ramp(S_TONKA);
        g.fillStyle = R.out;
        g.beginPath(); g.moveTo(-2.6, -6); g.lineTo(8, -6); g.lineTo(9.4, -1); g.lineTo(-2.6, -1); g.closePath(); g.fill();
        g.fillStyle = S_TONKA;
        g.beginPath(); g.moveTo(-2, -5.4); g.lineTo(7.5, -5.4); g.lineTo(8.7, -1.6); g.lineTo(-2, -1.6); g.closePath(); g.fill();
        g.fillStyle = R.lt; g.fillRect(-2, -5.4, 9.5, 1.4);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(9, -8.2, 8, 7.4, 1.6); g.fill();
        g.fillStyle = S_TONKA; g.beginPath(); g.roundRect(9.6, -7.6, 6.8, 6.2, 1.3); g.fill();
        g.fillStyle = S_GLASS; g.fillRect(11, -6.8, 4, 3);
        g.strokeStyle = w.ramp(S_GLASS).hi; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(11.4, -6.4); g.lineTo(13, -4.4); g.stroke();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(16.6, -4.6, 7.8, 4, 1.2); g.fill();
        g.fillStyle = S_TONKA; g.beginPath(); g.roundRect(17.1, -4.1, 6.8, 3.2, 1); g.fill();
        g.fillStyle = R.lt; g.fillRect(17.1, -4.1, 6.8, 1);
        g.fillStyle = S_DARK; g.fillRect(-2, -1.2, 26, 2);
        // wheels batched by color — three fills, six discs
        g.fillStyle = w.ramp(S_BORE).out;
        g.beginPath(); g.arc(3, 1.6, 3.4, 0, 7); g.arc(19, 1.6, 3.4, 0, 7); g.fill();
        g.fillStyle = S_BORE;
        g.beginPath(); g.arc(3, 1.6, 2.7, 0, 7); g.arc(19, 1.6, 2.7, 0, 7); g.fill();
        g.fillStyle = S_GREY;
        g.beginPath(); g.arc(3, 1.6, 1, 0, 7); g.arc(19, 1.6, 1, 0, 7); g.fill();
        g.fillStyle = R.dk;
        g.beginPath(); g.arc(0, -4.2, 0.7, 0, 7); g.arc(3, -4.2, 0.7, 0, 7); g.arc(6, -4.2, 0.7, 0, 7); g.fill();
        // energy pass — flat fills only
        g.globalAlpha = 0.6 + 0.4 * Math.sin(w.animT * 6);
        g.fillStyle = S_LEGO;
        g.beginPath(); g.arc(24.6, -2.8, 1.2, 0, 7); g.fill();
        g.fillRect(24.2, -1.4, 1.2, 2.2);
        g.fillStyle = WHITE; g.beginPath(); g.arc(24.6, -2.8, 0.55, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else {
        // T5 THE FORBIDDEN LEGO — order: halo, brick, wreath, core edge, star motes
        const R = w.ramp(S_LEGO);
        if (w.isPlayer) { // the one radial gradient in the whole weapon budget
          const hg = g.createRadialGradient(8, -5, 3, 8, -5, 22);
          hg.addColorStop(0, S_HALO0);
          hg.addColorStop(0.6, S_HALO1);
          hg.addColorStop(1, S_HALO2);
          g.fillStyle = hg;
          g.beginPath(); g.arc(8, -5, 22 * (1 + 0.05 * Math.sin(w.animT * 5)), 0, 7); g.fill();
        }
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.4, -9.4, 18.8, 10.4, 1.6); g.fill();
        g.fillStyle = S_LEGO; g.beginPath(); g.roundRect(-0.6, -8.6, 17.2, 8.8, 1.2); g.fill();
        g.fillStyle = R.lt; g.fillRect(-0.6, -8.6, 17.2, 2.2);
        g.fillStyle = R.dk; g.fillRect(-0.6, -1.6, 17.2, 1.6);
        // studs: three batched passes over the hoisted x table
        g.fillStyle = R.out; g.beginPath();
        for (let i = 0; i < LEGO_STUDS.length; i++) g.arc(LEGO_STUDS[i], -9.6, 1.9, 0, 7);
        g.fill();
        g.fillStyle = S_STUD; g.beginPath();
        for (let i = 0; i < LEGO_STUDS.length; i++) g.arc(LEGO_STUDS[i], -9.6, 1.4, 0, 7);
        g.fill();
        g.fillStyle = WHITE; g.beginPath();
        for (let i = 0; i < LEGO_STUDS.length; i++) g.arc(LEGO_STUDS[i] - 0.4, -10, 0.5, 0, 7);
        g.fill();
        // wreath — 3 fills of wrath-tongues off the top
        const f1 = Math.sin(w.animT * 13) * 1.4;
        const f2 = Math.sin(w.animT * 13 + 2.1) * 1.4;
        const f3 = Math.sin(w.animT * 13 + 4.2) * 1.4;
        g.fillStyle = S_TONGUE;
        g.beginPath();
        g.moveTo(-1, -8.6); g.lineTo(2, -14 - f1); g.lineTo(5, -8.6); g.lineTo(8.5, -15.5 - f2);
        g.lineTo(12, -8.6); g.lineTo(15, -14.5 - f3); g.lineTo(18, -8.6);
        g.closePath(); g.fill();
        g.fillStyle = S_LEGO;
        g.beginPath();
        g.moveTo(-1, -8.6); g.lineTo(2, -12 - f1 * 0.7); g.lineTo(5, -8.6); g.lineTo(8.5, -13.2 - f2 * 0.7);
        g.lineTo(12, -8.6); g.lineTo(15, -12.4 - f3 * 0.7); g.lineTo(18, -8.6);
        g.closePath(); g.fill();
        g.fillStyle = S_INNER;
        g.beginPath();
        g.moveTo(6.5, -8.6); g.lineTo(8.5, -11.4 - f2 * 0.5); g.lineTo(10.5, -8.6); g.closePath();
        g.moveTo(13, -8.6); g.lineTo(15, -10.8 - f3 * 0.5); g.lineTo(17, -8.6); g.closePath();
        g.fill();
        // the edge that finds your foot in the dark — single player-only shadowBlur pass
        if (w.isPlayer) { g.shadowColor = S_LEGO; g.shadowBlur = 8; }
        g.strokeStyle = WHITE; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(0, -9.2); g.lineTo(17, -9.2); g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = WHITE;
        for (let i = 0; i < SAM_STARS.length; i++) {
          const m = SAM_STARS[i];
          const cyc = (w.animT * 0.5 + m[2]) % 1;
          g.globalAlpha = (1 - cyc) * 0.8;
          g.beginPath();
          g.arc(m[0] + 1.5 * Math.sin(w.animT * 3 + m[2] * 6), m[1] - cyc * 10, m[3], 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      g.restore();
    },
  };

  // =============================== CASSANDRA ===============================
  // Deli craft ascending: crustless PB&J -> the steaming Little Bear Special.
  // Hand-riding — draws OVER the painted mitts, so this is an `over` body.
  W.cassandra = {
    over: function (g, w) {
      g.save();
      g.translate(w.hx, w.hy);
      // shallow rotation on purpose: the sandwich stays near-horizontal so the
      // steam wreath always reads as rising and the halo crowns it in every pose
      g.rotate(-0.1 + (w.attackKey ? w.attackExt * 0.35 : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.tier;

      if (t === 1) {
        // T1 PB&J — pale, soft, crusts probably cut off
        const R = w.ramp(C_PBJ);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.2, -7.6, 13.6, 8.2, 1.8); g.fill();
        g.fillStyle = C_PBJ; g.beginPath(); g.roundRect(-0.5, -6.9, 12.2, 6.8, 1.5); g.fill();
        g.fillStyle = C_JELLY; g.fillRect(-0.5, -4.2, 12.2, 1.4);
        g.fillStyle = C_PB; g.fillRect(-0.5, -2.8, 12.2, 1.2);
        g.fillStyle = C_JELLY; g.beginPath(); g.arc(3.4, -1.4, 1, 0, 7); g.fill();
        g.fillStyle = R.lt; g.fillRect(-0.5, -6.9, 12.2, 1.4);
      } else if (t === 2) {
        // T2 GRILLED CHEESE — real griddle material; the cheese pull is the silhouette add
        const R = w.ramp(C_TOAST);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.6, -8, 17.6, 8.8, 2); g.fill();
        g.fillStyle = C_TOAST; g.beginPath(); g.roundRect(-0.8, -7.2, 16, 7.2, 1.6); g.fill();
        g.fillStyle = R.lt; g.fillRect(-0.8, -7.2, 16, 1.8);
        g.strokeStyle = R.dk; g.lineWidth = 1.1;
        g.beginPath();
        g.moveTo(2, -5.4); g.lineTo(6, -5.4);
        g.moveTo(8, -4.6); g.lineTo(12.6, -4.6);
        g.stroke();
        g.fillStyle = C_CHEESE;
        g.beginPath(); g.moveTo(15.2, -2.4); g.lineTo(18.8, -1.2); g.lineTo(15.2, -0.2); g.closePath(); g.fill();
        g.beginPath(); g.arc(17.6, 0.4, 0.8, 0, 7); g.fill();
        g.fillStyle = R.hi; g.beginPath(); g.arc(4, -6.2, 0.9, 0, 7); g.fill();
      } else if (t === 3) {
        // T3 CLUB SANDWICH — tall triple-decker; the frilled toothpick brings her cyan in
        const R = w.ramp(C_CLUB);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.8, -3, 19.6, 3.8, 1.4); g.fill();
        g.fillStyle = C_CLUB; g.beginPath(); g.roundRect(-1.2, -2.4, 18.4, 2.6, 1.1); g.fill();
        g.fillStyle = C_TOMATO; g.fillRect(-0.8, -4.4, 17.6, 1.5);
        g.fillStyle = C_LETTUCE;
        g.beginPath();
        g.arc(1, -5, 1.3, 0, 7); g.arc(5, -5.3, 1.3, 0, 7); g.arc(9, -5, 1.3, 0, 7);
        g.arc(13, -5.3, 1.3, 0, 7); g.arc(16.5, -5, 1.3, 0, 7);
        g.fill();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.4, -7.4, 18.8, 2.6, 1.1); g.fill();
        g.fillStyle = C_CLUB; g.beginPath(); g.roundRect(-0.9, -6.9, 17.8, 1.6, 0.9); g.fill();
        g.fillStyle = C_BACON; g.fillRect(-0.6, -8.6, 16.8, 1.3);
        g.fillStyle = C_CREAM; g.fillRect(-0.6, -9.7, 16.8, 1.2);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.2, -13.6, 18.4, 4.4, 2); g.fill();
        g.fillStyle = C_CLUB; g.beginPath(); g.roundRect(-0.6, -13, 17.2, 3.2, 1.7); g.fill();
        g.fillStyle = R.lt; g.fillRect(-0.6, -13, 17.2, 1.2);
        g.strokeStyle = C_PICK; g.lineWidth = 1;
        g.beginPath(); g.moveTo(8.4, -13.4); g.lineTo(8.4, -17.6); g.stroke();
        g.fillStyle = C_FRILL;
        g.beginPath(); g.moveTo(8.4, -17.6); g.lineTo(6.8, -19.4); g.lineTo(9.9, -19); g.closePath(); g.fill();
        g.fillStyle = C_OLIVE; g.beginPath(); g.arc(8.4, -16.4, 1.2, 0, 7); g.fill();
        g.fillStyle = C_TOMATO; g.beginPath(); g.arc(8.4, -16.4, 0.5, 0, 7); g.fill();
        g.fillStyle = C_CREAM;
        g.beginPath();
        g.arc(3, -12.4, 0.5, 0, 7); g.arc(8, -12.8, 0.5, 0, 7); g.arc(13, -12.3, 0.5, 0, 7);
        g.fill();
        g.globalAlpha = 0.5 + 0.5 * Math.sin(w.animT * 7);
        g.fillStyle = WHITE; g.beginPath(); g.arc(7.4, -18.6, 0.7, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else if (t === 4) {
        // T4 MEATBALL MARINARA — first light: the oven glow sits IN the split,
        // drawn before the meatballs so they occlude it
        const R = w.ramp(C_ROLL);
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.2, -4, 26.4, 5, 2.2); g.fill();
        g.fillStyle = C_ROLL; g.beginPath(); g.roundRect(-1.6, -3.4, 25.2, 3.8, 1.8); g.fill();
        const ga = 0.6 + 0.4 * Math.sin(w.animT * 6);
        g.globalAlpha = ga;
        g.fillStyle = C_GOLD; g.fillRect(-0.6, -6.2, 23.4, 1.6);
        g.fillStyle = C_CREAM; g.fillRect(3, -5.8, 16, 0.8);
        g.globalAlpha = 1;
        const M = w.ramp(C_MEAT);
        g.fillStyle = M.out;
        g.beginPath(); g.arc(4, -6.2, 3.4, 0, 7); g.arc(11.5, -6.6, 3.4, 0, 7); g.arc(19, -6.2, 3.4, 0, 7); g.fill();
        g.fillStyle = C_MEAT;
        g.beginPath(); g.arc(4, -6.2, 2.8, 0, 7); g.arc(11.5, -6.6, 2.8, 0, 7); g.arc(19, -6.2, 2.8, 0, 7); g.fill();
        g.fillStyle = M.hi;
        g.beginPath(); g.arc(3, -7.2, 0.8, 0, 7); g.arc(10.5, -7.6, 0.8, 0, 7); g.arc(18, -7.2, 0.8, 0, 7); g.fill();
        g.fillStyle = C_TOMATO;
        g.beginPath(); g.rect(1, -4.6, 21, 1.6); g.arc(5.5, -2.6, 1, 0, 7); g.arc(14, -2.4, 1, 0, 7); g.fill();
        g.strokeStyle = C_CREAM; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(2, -4.6); g.lineTo(4, -2.2); g.lineTo(6, -4.6);
        g.moveTo(13, -4.6); g.lineTo(15, -2); g.lineTo(17, -4.6);
        g.stroke();
        g.fillStyle = C_LETTUCE;
        g.beginPath(); g.arc(7, -8.4, 0.7, 0, 7); g.arc(15, -8.8, 0.7, 0, 7); g.arc(21.5, -8.2, 0.7, 0, 7); g.fill();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2, -10.6, 25.8, 3.4, 1.7); g.fill();
        g.fillStyle = C_ROLL; g.beginPath(); g.roundRect(-1.4, -10, 24.6, 2.4, 1.4); g.fill();
        g.fillStyle = R.lt; g.fillRect(-1.4, -10, 24.6, 1);
        g.globalAlpha = ga;
        g.fillStyle = C_GOLD; g.beginPath(); g.arc(22.6, -9, 1.1, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else {
        // T5 THE LITTLE BEAR SPECIAL — crust stays honest; the LIGHT does the growing.
        // Order: halo, sub, steam wreath, crown line, steam/basil motes.
        const R = w.ramp(C_TOAST);
        if (w.isPlayer) { // the one radial gradient in the whole weapon budget
          const hg = g.createRadialGradient(16, -6, 4, 16, -6, 24);
          hg.addColorStop(0, C_HALO0);
          hg.addColorStop(0.6, C_HALO1);
          hg.addColorStop(1, C_HALO2);
          g.fillStyle = hg;
          g.beginPath(); g.arc(16, -6, 24 * (1 + 0.05 * Math.sin(w.animT * 5)), 0, 7); g.fill();
        }
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.6, -4.4, 33.2, 5.6, 2.6); g.fill();
        g.fillStyle = C_TOAST; g.beginPath(); g.roundRect(-2, -3.8, 32, 4.4, 2.2); g.fill();
        g.fillStyle = C_LETTUCE; g.beginPath();
        for (let i = 0; i < CASS_LETTUCE.length; i++) g.arc(CASS_LETTUCE[i], -5.4, 1.4, 0, 7);
        g.fill();
        g.fillStyle = C_TOMATO; g.fillRect(0, -6.6, 29, 1.6);
        // salami half-discs hanging over the edge (0..PI sweeps downward here)
        g.fillStyle = C_SALAMI;
        g.beginPath();
        g.arc(3, -4.6, 2.2, 0, Math.PI); g.arc(11, -4.4, 2.2, 0, Math.PI);
        g.arc(19, -4.6, 2.2, 0, Math.PI); g.arc(26, -4.4, 2.2, 0, Math.PI);
        g.fill();
        g.fillStyle = C_CREAM;
        g.beginPath();
        g.moveTo(6, -6.6); g.lineTo(8.5, -3.6); g.lineTo(11, -6.6); g.closePath();
        g.moveTo(20, -6.6); g.lineTo(22.5, -3.8); g.lineTo(25, -6.6); g.closePath();
        g.fill();
        // onion rings: second moveTo is the arc-3.3 start precomputed, so the
        // batched stroke does not draw a connector between them
        g.strokeStyle = C_ONION; g.lineWidth = 0.8;
        g.beginPath();
        g.arc(9, -6.2, 1.6, 3.3, 6);
        g.moveTo(21.42, -6.45);
        g.arc(23, -6.2, 1.6, 3.3, 6);
        g.stroke();
        g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.2, -12.8, 32.4, 6, 3); g.fill();
        g.fillStyle = C_TOAST; g.beginPath(); g.roundRect(-1.6, -12.2, 31.2, 4.8, 2.6); g.fill();
        g.fillStyle = R.lt; g.fillRect(-1.6, -12.2, 31.2, 1.6);
        g.fillStyle = C_CREAM;
        g.beginPath();
        g.arc(4, -11, 0.5, 0, 7); g.arc(10, -11.5, 0.5, 0, 7); g.arc(16, -10.9, 0.5, 0, 7);
        g.arc(22, -11.4, 0.5, 0, 7); g.arc(27, -11, 0.5, 0, 7);
        g.fill();
        // wreath — golden steam tongues off the crown, 3 fills
        const f1 = Math.sin(w.animT * 11) * 1.6;
        const f2 = Math.sin(w.animT * 11 + 2.1) * 1.6;
        const f3 = Math.sin(w.animT * 11 + 4.2) * 1.6;
        g.fillStyle = C_PB;
        g.beginPath();
        g.moveTo(4, -12.4); g.lineTo(7, -17.5 - f1); g.lineTo(10, -12.4); g.lineTo(14, -18.8 - f2);
        g.lineTo(18, -12.4); g.lineTo(22, -17.8 - f3); g.lineTo(26, -12.4);
        g.closePath(); g.fill();
        g.fillStyle = C_GOLD;
        g.beginPath();
        g.moveTo(4, -12.4); g.lineTo(7, -15.6 - f1 * 0.7); g.lineTo(10, -12.4); g.lineTo(14, -16.6 - f2 * 0.7);
        g.lineTo(18, -12.4); g.lineTo(22, -15.8 - f3 * 0.7); g.lineTo(26, -12.4);
        g.closePath(); g.fill();
        g.fillStyle = C_CREAM;
        g.beginPath();
        g.moveTo(12, -12.4); g.lineTo(14, -14.8 - f2 * 0.5); g.lineTo(16, -12.4); g.closePath();
        g.moveTo(20, -12.4); g.lineTo(22, -14.4 - f3 * 0.5); g.lineTo(24, -12.4); g.closePath();
        g.fill();
        // crown line — the single player-only shadowBlur pass, zeroed immediately
        if (w.isPlayer) { g.shadowColor = C_GOLD; g.shadowBlur = 8; }
        g.strokeStyle = C_CORE; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, -12.2); g.lineTo(30, -12.2); g.stroke();
        g.shadowBlur = 0;
        for (let i = 0; i < CASS_MOTES.length; i++) {
          const m = CASS_MOTES[i];
          const cyc = (w.animT * 0.45 + m[2]) % 1;
          g.globalAlpha = (1 - cyc) * 0.8;
          g.fillStyle = m[4] ? C_LETTUCE : C_CREAM;
          g.beginPath();
          g.arc(m[0] + 1.5 * Math.sin(w.animT * 3 + m[2] * 6), m[1] - cyc * 11, m[3], 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      g.restore();
    },
  };

  // ================================= ERIKA =================================
  // The weapon is a bare hand and it never improves — only the ceremony does.
  // No transform frame: everything keys off the hand anchors in fighter space so
  // it tracks every pose for free. Drawn UNDER the mitts on purpose, so the fists
  // paint over the halo/ray origin and her hands stay unmistakably bare.
  function erikaFrontBand(g, w) {
    const R = w.ramp(E_BAND);
    g.fillStyle = R.out; g.beginPath(); g.roundRect(w.hx - 5.8, w.hy - 2.6, 3.4, 5.2, 1.5); g.fill();
    g.fillStyle = E_BAND; g.beginPath(); g.roundRect(w.hx - 5.4, w.hy - 2.1, 2.6, 4.2, 1.2); g.fill();
    g.strokeStyle = E_STRIPE; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(w.hx - 5.4, w.hy); g.lineTo(w.hx - 2.8, w.hy); g.stroke();
  }
  function erikaBackBand(g, w) {
    const R = w.ramp(E_BAND);
    g.fillStyle = R.out; g.beginPath(); g.roundRect(w.bx - 5.4, w.by - 2.4, 3.2, 4.8, 1.4); g.fill();
    g.fillStyle = E_BAND; g.beginPath(); g.roundRect(w.bx - 5, w.by - 1.9, 2.4, 3.8, 1.1); g.fill();
    g.strokeStyle = E_STRIPE; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(w.bx - 5, w.by); g.lineTo(w.bx - 2.6, w.by); g.stroke();
  }

  W.erika = {
    under: function (g, w) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      const t = w.tier;
      const fx = w.hx, fy = w.hy;
      const swinging = !!w.attackKey && w.attackExt > 0.3;

      if (t === 1) {
        // T1 LIMP WRIST — attack only. Buying it changes essentially nothing. Correct.
        if (!swinging) return;
        g.strokeStyle = E_A28; g.lineWidth = 2;
        g.beginPath(); g.arc(fx - 2, fy, 6.5, -0.7, 0.5); g.stroke();
        g.fillStyle = E_A30; g.beginPath(); g.arc(fx + 5.5, fy - 4, 0.6, 0, 7); g.fill();
        g.strokeStyle = E_A20; g.lineWidth = 1;
        g.beginPath(); g.moveTo(fx + 3, fy + 2); g.lineTo(fx + 5, fy + 4); g.stroke();
        return;
      }

      if (t === 2) {
        // T2 OPEN PALM — attack only; at idle the purchase appears to have done nothing
        if (!swinging) return;
        g.strokeStyle = E_A32; g.lineWidth = 2.4;
        g.beginPath(); g.arc(fx - 2, fy, 7.5, -0.85, 0.6); g.stroke();
        g.strokeStyle = E_A30; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(fx + 7, fy - 3); g.lineTo(fx + 9.5, fy - 3.6);
        g.moveTo(fx + 8, fy); g.lineTo(fx + 10.5, fy);
        g.stroke();
        g.fillStyle = E_A30;
        g.beginPath(); g.arc(fx + 6, fy - 5, 0.7, 0, 7); g.arc(fx + 7.5, fy - 1, 0.7, 0, 7); g.fill();
        return;
      }

      if (t === 5) {
        // T5 MAXIMUM EFFORT SWAT — the full legendary kit deployed around nothing.
        // PERF: she spends the halo gradient but deliberately NOT the shadowBlur
        // pass. The budgeted pass is conspicuously unspent. Do not "fix" this.
        if (w.isPlayer) {
          const hg = g.createRadialGradient(fx, fy, 4, fx, fy, 18);
          hg.addColorStop(0, E_HALO0);
          hg.addColorStop(0.6, E_HALO1);
          hg.addColorStop(1, E_HALO2);
          g.fillStyle = hg;
          g.beginPath(); g.arc(fx, fy, 18 * (1 + 0.05 * Math.sin(w.animT * 5)), 0, 7); g.fill();
        }
        // three slowly wheeling god-rays, one path, one fill
        g.fillStyle = E_RAY;
        g.beginPath();
        for (let i = 0; i < ERIKA_RAYS.length; i++) {
          const ang = w.animT * 0.6 + ERIKA_RAYS[i];
          g.moveTo(fx + Math.cos(ang) * 4, fy + Math.sin(ang) * 4);
          g.lineTo(fx + Math.cos(ang + 0.16) * 16, fy + Math.sin(ang + 0.16) * 16);
          g.lineTo(fx + Math.cos(ang - 0.16) * 16, fy + Math.sin(ang - 0.16) * 16);
          g.closePath();
        }
        g.fill();
        erikaFrontBand(g, w);
        erikaBackBand(g, w);
        // dust, not embers — it settles downward
        g.fillStyle = E_DUST;
        for (let i = 0; i < ERIKA_MOTES.length; i++) {
          const m = ERIKA_MOTES[i];
          const cyc = (w.animT * 0.4 + m[2]) % 1;
          g.globalAlpha = (1 - cyc) * 0.5;
          g.beginPath();
          g.arc(fx + m[0] + 1.2 * Math.sin(w.animT * 2.5 + m[2] * 6), fy + m[1] + cyc * 8, m[3], 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
        if (!swinging) return;
        g.strokeStyle = E_A40; g.lineWidth = 3;
        g.beginPath(); g.arc(fx - 2, fy, 9, -0.95, 0.65); g.stroke();
        g.strokeStyle = E_A55; g.lineWidth = 1.8;
        g.beginPath(); g.arc(fx - 2, fy, 7.2, -0.85, 0.55); g.stroke();
        g.strokeStyle = E_A70; g.lineWidth = 0.8;
        g.beginPath(); g.arc(fx - 2, fy, 5.6, -0.75, 0.45); g.stroke();
        g.strokeStyle = E_A30; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(fx + 7, fy - 4); g.lineTo(fx + 9.5, fy - 4.8);
        g.moveTo(fx + 8.5, fy - 1); g.lineTo(fx + 11, fy - 1.2);
        g.moveTo(fx + 8, fy + 2); g.lineTo(fx + 10.2, fy + 2.6);
        g.moveTo(fx + 6.5, fy + 4.5); g.lineTo(fx + 8.4, fy + 5.4);
        g.moveTo(fx + 9, fy + 0.5); g.lineTo(fx + 11.5, fy + 0.5);
        g.stroke();
        if (w.attackExt > 0.85) { g.fillStyle = E_A60; star4(g, fx + 9, fy, 2, 0.6); }
        return;
      }

      // T3 + T4 share the front sweatband — her first persistent item
      erikaFrontBand(g, w);
      if (t === 4) {
        // T4 SLIGHTLY FIRMER SWAT — athletic wear IS the silhouette beat
        erikaBackBand(g, w);
        // her "first light" rung: a barely-visible aura ring, flat stroke, no gradient
        g.globalAlpha = 0.1 + 0.06 * Math.sin(w.animT * 6);
        g.strokeStyle = WHITE; g.lineWidth = 1.2;
        g.beginPath(); g.arc(fx, fy, 7, 0, 7); g.stroke();
        g.globalAlpha = 1;
      }
      if (!swinging) return;
      if (t === 3) {
        // T3 BOTH HANDS — the back hand joins in, hardest-reading on the X2 cross
        g.strokeStyle = E_A34; g.lineWidth = 2.6;
        g.beginPath(); g.arc(fx - 2, fy, 8, -0.85, 0.6); g.stroke();
        g.strokeStyle = E_A26; g.lineWidth = 2;
        g.beginPath(); g.arc(w.bx - 2, w.by, 6.5, -0.7, 0.5); g.stroke();
        g.globalAlpha = (0.5 + 0.5 * Math.sin(w.animT * 7)) * 0.35;
        g.fillStyle = WHITE;
        g.beginPath();
        g.arc(fx + 6, fy - 6, 0.7, 0, 7); g.arc(fx + 9, fy - 2, 0.6, 0, 7); g.arc(fx + 7, fy + 2, 0.6, 0, 7);
        g.fill();
        g.globalAlpha = 1;
      } else {
        g.strokeStyle = E_A35; g.lineWidth = 2.8;
        g.beginPath(); g.arc(fx - 2, fy, 8.5, -0.9, 0.6); g.stroke();
        g.strokeStyle = E_A50; g.lineWidth = 1.2;
        g.beginPath(); g.arc(fx - 2, fy, 6.8, -0.8, 0.5); g.stroke();
        g.strokeStyle = E_A30; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(fx + 7, fy - 4); g.lineTo(fx + 9.5, fy - 4.8);
        g.moveTo(fx + 8.5, fy - 1); g.lineTo(fx + 11, fy - 1.2);
        g.moveTo(fx + 8, fy + 2); g.lineTo(fx + 10.2, fy + 2.6);
        g.moveTo(fx + 6.5, fy + 4.5); g.lineTo(fx + 8.4, fy + 5.4);
        g.stroke();
        g.strokeStyle = E_A25; g.lineWidth = 0.8;
        g.beginPath();
        g.moveTo(fx - 1, fy - 7); g.lineTo(fx, fy - 9);
        g.moveTo(fx + 2, fy - 7.5); g.lineTo(fx + 2.6, fy - 9.5);
        g.stroke();
      }
    },
  };
})();
