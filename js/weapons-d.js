// weapons-d.js — weapon bodies for isla, hayes, addi, brooks, dayne.
// Bodies draw in drawFighter local space: (0,0) = the fighter's feet, -y is up,
// +x is forward (the caller owns the facing flip). 'under' runs before the mitts so
// the fist paints over a grip; 'over' runs after, for art the hand carries in front.
// The caller does NOT save/restore around these — each body owns its own transform.
(function () {
  const W = (window.WEAPON_BODIES = window.WEAPON_BODIES || {});
  const PI = Math.PI;
  const WHITE = '#ffffff';

  // ---- hoisted palettes (module scope — nothing allocated per frame) ----
  // Every tier base is the literal named in the spec, mirrored from the suggested
  // data.js weaponColors so the recipe holds whether or not data.js is refreshed.
  // hayes — swords
  const H_WC = ['#8a6a48', '#c9ccd8', '#dfe3e8', '#b85a24', '#ff7a2c'];
  const H_GOLD = '#ffd24a';
  const H_WRAP = '#6a4a32';
  const H_IRON = '#5a5464';
  const H_GRIP = '#3a2a20';
  const H_FIRE = '#ff7a2c';
  const H_DEEP = '#e04a1a';
  const H_EDGE = '#fff6dd';
  const H_STEEL5 = '#5a2c1a'; // ember steel under the wreath
  const H_HALO0 = '#ff7a2c66';
  const H_HALO1 = '#ff7a2c24';
  const H_HALO2 = '#ff7a2c00';
  const EMBER_MOTES = [9, -8, 0, 1.7, 17, -11, 0.33, 1.3, 25, -9, 0.58, 1.8, 31, -12, 0.82, 1.2];
  // addi — ice swords
  const A_WC = ['#bfe6f5', '#9fdcff', '#6cc4f0', '#4adbe8', '#e8fbff'];
  const A_CORE = '#e8fbff';
  const A_SILVER = '#c9ccd8';
  const A_ENERGY = '#9fdcff';
  const A_DEEP = '#4adbe8';
  const A_WRAP = '#2c3a4a';
  const A_STEEL5 = '#2c4a6a'; // deep-ice core blade
  const A_HALO0 = '#9fdcff66';
  const A_HALO1 = '#9fdcff22';
  const A_HALO2 = '#9fdcff00';
  const SNOW_MOTES = [10, -14, 0, 1.5, 18, -16, 0.3, 1.2, 26, -13, 0.55, 1.7, 32, -16, 0.8, 1.1];
  // brooks — teeth
  const BR_GUM = '#ff8aa0';
  const BR_SLAB = '#b8b4a8';
  const BR_TOOTH = '#ffffff';
  const BR_TOOTH2 = '#d8d4c8';
  const BR_GREEN = '#37b34a';
  const BR_KEY = '#c9ccd8';
  const BR_FIN = '#6a7288';
  const BR_SWEAT = '#9fdcff';
  const BR_SPEC = '#fff6dd';
  const BR_HALO0 = '#ffffff59';
  const BR_HALO1 = '#37b34a26';
  const BR_HALO2 = '#37b34a00';
  const TOOTH_MOTES = [-6, -8, 0, 1.2, 0, -11, 0.3, 1, 6, -8, 0.55, 1.3, 3, -6, 0.8, 0.9];
  const CHOMP_N = [3, 3, 6, 7, 7];      // fangs per jaw, by tier
  const CHOMP_SPAN = [12, 12, 14, 17, 22];
  // isla — arms
  const IS_SKIN = '#e8b58a'; // == cdef.skin; the biceps are her own flesh
  const IS_PINK = '#f2a3c2';
  const IS_PINK_HI = '#ffd6e8';
  const IS_MILK = '#f4f0e6';
  const IS_HALO0 = '#f4f0e666';
  const IS_HALO1 = '#f2a3c22e';
  const IS_HALO2 = '#f2a3c200';
  const IS_BR = [0, 4, 4.9, 5.8, 7];      // lead bicep radius by tier
  const IS_BR2 = [0, 3.6, 4.4, 5.2, 6.3]; // rear bicep radius by tier
  const MILK_MOTES = [0, -9, 0, 1.4, -4, -7, 0.35, 1.1, 4, -8, 0.6, 1.5, 1, -6, 0.85, 1];
  // dayne — soft objects
  const D_WC = ['#e8d24a', '#4ab2e8', '#e84a92', '#37b34a', '#ff7a2c'];
  const D_PINK = '#ffd6e8';
  const D_WHITE = '#ffffff';
  const D_FLAG = '#e8524a';
  const D_POLE = '#c9ccd8';
  const D_HALO0 = '#ffd6e83e';
  const D_HALO1 = '#ffd6e81c';
  const D_HALO2 = '#ffd6e800';
  const SQUEAK_MOTES = [8, -9, 0, 1.3, 16, -11, 0.3, 1, 24, -9, 0.55, 1.4, 30, -11, 0.8, 1];

  // ---- shared painters ----
  // 4-point twinkle star; path only, caller owns fillStyle and fill()
  function star4(g, x, y, r) {
    const i = r * 0.28;
    g.beginPath();
    g.moveTo(x - r, y); g.lineTo(x - i, y - i); g.lineTo(x, y - r); g.lineTo(x + i, y - i);
    g.lineTo(x + r, y); g.lineTo(x + i, y + i); g.lineTo(x, y + r); g.lineTo(x - i, y + i);
    g.closePath();
  }

  // the frame's ONE radial gradient — T5 halo, player only
  function halo(g, x, y, r0, r1, mid, c0, c1, c2) {
    const hg = g.createRadialGradient(x, y, r0, x, y, r1);
    hg.addColorStop(0, c0); hg.addColorStop(mid, c1); hg.addColorStop(1, c2);
    g.fillStyle = hg;
    g.beginPath(); g.arc(x, y, r1, 0, 7); g.fill();
  }

  // T5 drift motes: fixed [dx,dy,phase,r] table, stride 4, zero allocations.
  // rise > 0 floats up, rise < 0 falls. cA paints motes 1/3, cB motes 2/4.
  function drift(g, tbl, ox, oy, t, speed, rise, wob, wobHz, amp, cA, cB) {
    for (let i = 0; i < tbl.length; i += 4) {
      const ph = tbl[i + 2];
      const cyc = (t * speed + ph) % 1;
      g.globalAlpha = (1 - cyc) * amp;
      g.fillStyle = ((i >> 2) & 1) ? cB : cA;
      g.beginPath();
      g.arc(ox + tbl[i] + wob * Math.sin(t * wobHz + ph * 6.28), oy + tbl[i + 1] - cyc * rise, tbl[i + 3], 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // ============================== HAYES — SWORDS ==============================
  W.hayes = {
    under: function (g, w) {
      const t = w.animT;
      const ext = w.attackKey ? (w.attackExt || 0) : 0;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.6 + ext * 1.2); // X1 levels the blade into a thrust
      switch (w.tier) {
        case 1: { // T1 Wooden Sword — one plank, one sun line, no light at all
          const R = w.ramp(H_WC[0]);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.2, -2.6); g.lineTo(11.2, -2.6); g.lineTo(13.8, 0); g.lineTo(11.2, 2.6); g.lineTo(1.2, 2.6);
          g.closePath(); g.fill();
          g.fillStyle = H_WC[0];
          g.beginPath();
          g.moveTo(1.8, -1.9); g.lineTo(11, -1.9); g.lineTo(12.8, 0); g.lineTo(11, 1.9); g.lineTo(1.8, 1.9);
          g.closePath(); g.fill();
          g.fillStyle = R.dk; g.fillRect(0.6, -3.8, 2, 7.6); // plank crossbar
          g.strokeStyle = R.lt; g.lineWidth = 1;
          g.beginPath(); g.moveTo(2.6, -1); g.lineTo(10.8, -1); g.stroke();
          break;
        }
        case 2: { // T2 Steel Sword — real material + the first silhouette add (crossguard)
          const R = w.ramp(H_WC[1]);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -2.7); g.lineTo(15.4, -2.7); g.lineTo(18.6, 0); g.lineTo(15.4, 2.7); g.lineTo(1.4, 2.7);
          g.closePath(); g.fill();
          g.fillStyle = H_WC[1];
          g.beginPath();
          g.moveTo(2, -1.9); g.lineTo(15.2, -1.9); g.lineTo(17.6, 0); g.lineTo(15.2, 1.9); g.lineTo(2, 1.9);
          g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(3, 0.3); g.lineTo(15, 0.3); g.stroke();
          g.strokeStyle = R.hi; g.lineWidth = 1;
          g.beginPath(); g.moveTo(2.6, -1.1); g.lineTo(15.8, -1.1); g.stroke();
          g.fillStyle = R.hi;
          g.beginPath(); g.arc(13.2, -1.3, 0.8, 0, 7); g.fill();
          g.fillStyle = R.out;
          g.beginPath(); g.roundRect(-0.2, -5.2, 3.4, 10.4, 1.2); g.fill();
          g.fillStyle = H_WC[1];
          g.beginPath(); g.roundRect(0.3, -4.7, 2.4, 9.4, 1); g.fill();
          g.fillStyle = R.dk;
          g.beginPath(); g.arc(-1.4, 0, 1.5, 0, 7); g.fill();
          break;
        }
        case 3: { // T3 Knight's Blade — gold enters: crossguard, pommel, wrap, twinkle
          const R = w.ramp(H_WC[2]);
          const RG = w.ramp(H_GOLD);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -2.9); g.lineTo(21.4, -2.9); g.lineTo(25, 0); g.lineTo(21.4, 2.9); g.lineTo(1.4, 2.9);
          g.closePath(); g.fill();
          g.fillStyle = H_WC[2];
          g.beginPath();
          g.moveTo(2.1, -2.2); g.lineTo(21, -2.2); g.lineTo(24, 0); g.lineTo(21, 2.2); g.lineTo(2.1, 2.2);
          g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(3, 0.3); g.lineTo(21, 0.3); g.stroke();
          g.strokeStyle = R.hi; g.lineWidth = 1;
          g.beginPath(); g.moveTo(2.6, -1.2); g.lineTo(21.8, -1.2); g.stroke();
          g.strokeStyle = R.dk; g.lineWidth = 0.7;
          g.beginPath(); g.moveTo(5, 1.1); g.lineTo(14, 1.1); g.stroke();
          g.fillStyle = RG.out;
          g.beginPath(); g.roundRect(-0.3, -5.6, 3.8, 11.2, 1.4); g.fill();
          g.fillStyle = H_GOLD;
          g.beginPath(); g.roundRect(0.2, -5.1, 2.8, 10.2, 1.2); g.fill();
          g.fillStyle = RG.hi; g.fillRect(0.5, -4.8, 0.9, 2);
          g.fillStyle = RG.out;
          g.beginPath(); g.arc(-2, 0, 2.3, 0, 7); g.fill();
          g.fillStyle = H_GOLD;
          g.beginPath(); g.arc(-2, 0, 1.7, 0, 7); g.fill();
          g.fillStyle = RG.hi;
          g.beginPath(); g.arc(-2.5, -0.5, 0.6, 0, 7); g.fill();
          g.lineCap = 'butt'; // wrap ticks must not bleed past the grip
          g.strokeStyle = H_WRAP; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(-0.5, -1.6); g.lineTo(-1.1, 1.6);
          g.moveTo(-1.3, -1.6); g.lineTo(-1.9, 1.6);
          g.stroke();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7); // the tier's only motion
          g.fillStyle = WHITE;
          star4(g, 14, -2, 1.4); g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 Dragonfang — swept single edge, spine barb, first ember light
          const R = w.ramp(H_WC[3]);
          const RI = w.ramp(H_IRON);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -3); g.lineTo(20, -3.8); g.lineTo(29.4, -0.8); g.lineTo(31, 0.4); g.lineTo(20, 2.8); g.lineTo(1.4, 3);
          g.closePath(); g.fill();
          g.fillStyle = H_WC[3];
          g.beginPath();
          g.moveTo(2, -2.2); g.lineTo(19.8, -3); g.lineTo(29.6, 0.2); g.lineTo(19.8, 2); g.lineTo(2, 2.2);
          g.closePath(); g.fill();
          g.fillStyle = R.out; // spine barb
          g.beginPath();
          g.moveTo(10, -3.4); g.lineTo(12, -6.8); g.lineTo(14.6, -3.6); g.closePath(); g.fill();
          g.fillStyle = H_WC[3];
          g.beginPath();
          g.moveTo(10.8, -3.4); g.lineTo(12.1, -5.8); g.lineTo(13.8, -3.5); g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 1;
          g.beginPath(); g.moveTo(4, 1.4); g.lineTo(26, 1); g.stroke();
          g.fillStyle = RI.out;
          g.beginPath(); g.roundRect(-0.4, -5.4, 3.6, 10.8, 1.2); g.fill();
          g.beginPath();
          g.moveTo(1.4, -5.4); g.lineTo(2.6, -7.2); g.lineTo(3.4, -5.2);
          g.moveTo(1.4, 5.4); g.lineTo(2.6, 7.2); g.lineTo(3.4, 5.2);
          g.fill();
          g.fillStyle = H_IRON;
          g.beginPath(); g.roundRect(0.1, -4.9, 2.6, 9.8, 1); g.fill();
          g.lineCap = 'butt';
          g.strokeStyle = H_GRIP; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(-0.5, -1.6); g.lineTo(-1.1, 1.6);
          g.moveTo(-1.3, -1.6); g.lineTo(-1.9, 1.6);
          g.stroke();
          g.fillStyle = H_IRON;
          g.beginPath(); g.arc(-2, 0, 1.9, 0, 7); g.fill();
          g.fillStyle = H_FIRE;
          g.beginPath(); g.arc(-2, 0, 0.9, 0, 7); g.fill();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); // flat energy pass, no glow prims
          g.strokeStyle = H_FIRE; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(2.6, -1.4); g.lineTo(20, -2.2); g.lineTo(29.2, -0.2); g.stroke();
          g.fillStyle = H_FIRE;
          g.fillRect(7, -0.8, 1.8, 1.2);
          g.fillRect(12, -1.2, 1.8, 1.2);
          g.fillRect(17, -1.4, 1.8, 1.2);
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE FIRE SWORD — halo, gold claw guard, 3-layer wreath, embers
          const RG = w.ramp(H_GOLD);
          const fl = Math.sin(t * 13), fl2 = Math.sin(t * 11 + 2);
          // 0 halo first, behind everything — the frame's one radial gradient
          if (w.isPlayer) halo(g, 19, -2, 3, 26, 0.6, H_HALO0, H_HALO1, H_HALO2);
          // 1 ornate silhouette: gold claw guard
          g.fillStyle = RG.out;
          g.beginPath(); g.roundRect(-0.6, -6, 4.4, 12, 1.6); g.fill();
          g.beginPath();
          g.moveTo(2.2, -5.6); g.lineTo(6.4, -8.6); g.lineTo(7.6, -6.2); g.lineTo(3.6, -4.6); g.closePath();
          g.moveTo(2.2, 5.6); g.lineTo(6.4, 8.6); g.lineTo(7.6, 6.2); g.lineTo(3.6, 4.6); g.closePath();
          g.fill();
          g.fillStyle = H_GOLD;
          g.beginPath(); g.roundRect(0, -5.4, 3.2, 10.8, 1.2); g.fill();
          g.beginPath();
          g.moveTo(2.8, -5.7); g.lineTo(6.1, -8.1); g.lineTo(6.6, -6.2); g.lineTo(4, -5.1); g.closePath();
          g.moveTo(2.8, 5.7); g.lineTo(6.1, 8.1); g.lineTo(6.6, 6.2); g.lineTo(4, 5.1); g.closePath();
          g.fill();
          g.strokeStyle = H_EDGE; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(6.4, -8.6); g.lineTo(7.2, -7.3);
          g.moveTo(6.4, 8.6); g.lineTo(7.2, 7.3);
          g.stroke();
          // wrapped grip + glowing pommel, all inside x∈[-8.6,4] so the fist covers the wrap
          g.lineCap = 'butt';
          g.strokeStyle = H_GRIP; g.lineWidth = 3.6;
          g.beginPath(); g.moveTo(-4.6, 0); g.lineTo(0, 0); g.stroke();
          g.strokeStyle = w.INK; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(-3.8, -1.6); g.lineTo(-3, 1.6);
          g.moveTo(-2.2, -1.6); g.lineTo(-1.4, 1.6);
          g.stroke();
          g.fillStyle = RG.out;
          g.beginPath(); g.arc(-6, 0, 2.6, 0, 7); g.fill();
          g.fillStyle = H_FIRE;
          g.beginPath(); g.arc(-6, 0, 2, 0, 7); g.fill();
          g.fillStyle = RG.hi;
          g.beginPath(); g.arc(-6.4, -0.4, 0.9, 0, 7); g.fill();
          // ember steel — mostly eaten by the flame above it
          g.fillStyle = H_STEEL5;
          g.beginPath();
          g.moveTo(3.4, -2.6); g.lineTo(32, -2.6); g.lineTo(36.6, 0); g.lineTo(32, 2.6); g.lineTo(3.4, 2.6);
          g.closePath(); g.fill();
          // 2 flame envelope — exactly 3 fills, animated on literal vertices
          g.fillStyle = H_DEEP;
          g.beginPath();
          g.moveTo(4, -2.4);
          g.lineTo(7, -7.5 - 1.6 * fl); g.lineTo(10, -2.8);
          g.lineTo(13, -8.8 + 1.4 * fl2); g.lineTo(16, -3);
          g.lineTo(19, -9.5 - 1.5 * fl); g.lineTo(22, -3);
          g.lineTo(25, -8 + 1.3 * fl2); g.lineTo(28, -2.8);
          g.lineTo(31, -6.5 - fl); g.lineTo(34.5, -1.6); g.lineTo(38.5, 0);
          g.lineTo(34, 2); g.lineTo(26, 3.2); g.lineTo(14, 3.4); g.lineTo(5, 2.8);
          g.closePath(); g.fill();
          g.fillStyle = H_FIRE;
          g.beginPath();
          g.moveTo(5, -1.8);
          g.lineTo(8, -5.5 - 1.2 * fl2); g.lineTo(11, -2.2);
          g.lineTo(14.5, -6.6 + fl); g.lineTo(18, -2.4);
          g.lineTo(21, -7 - 1.1 * fl2); g.lineTo(24, -2.2);
          g.lineTo(27.5, -5.6 + fl); g.lineTo(31, -1.8); g.lineTo(36.8, 0);
          g.lineTo(30, 2.2); g.lineTo(16, 2.6); g.lineTo(6, 2.2);
          g.closePath(); g.fill();
          g.fillStyle = H_GOLD;
          g.beginPath();
          g.moveTo(6, -1); g.lineTo(20, -1.6); g.lineTo(33, -0.6); g.lineTo(36, 0);
          g.lineTo(32, 1); g.lineTo(18, 1.3); g.lineTo(7, 1.1);
          g.closePath(); g.fill();
          // 3 white-hot edge — the single shadowBlur pass, player only, zeroed at once
          if (w.isPlayer) { g.shadowColor = H_FIRE; g.shadowBlur = 9; }
          g.strokeStyle = H_EDGE; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(6, 0.1); g.lineTo(35.8, 0.1); g.stroke();
          g.shadowBlur = 0;
          // 4 embers rise
          drift(g, EMBER_MOTES, 0, 0, t, 0.5, 10, 1.5, 4, 0.8, H_GOLD, H_FIRE);
          break;
        }
      }
      g.restore();
    },
  };

  // ============================ ADDI — ICE SWORDS ============================
  W.addi = {
    under: function (g, w) {
      const t = w.animT;
      const ext = w.attackKey ? (w.attackExt || 0) : 0;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.6 + ext * 1.2); // deliberate mirror of the Hayes pose grammar
      switch (w.tier) {
        case 1: { // T1 Icicle — a found shard gripped raw, no guard
          const R = w.ramp(A_WC[0]);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0.6, -2.8); g.lineTo(9.5, -1.4); g.lineTo(13.6, 0); g.lineTo(9.5, 1.4); g.lineTo(0.6, 2.8);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[0];
          g.beginPath();
          g.moveTo(1.2, -2.1); g.lineTo(9.3, -1); g.lineTo(12.6, 0); g.lineTo(9.3, 1); g.lineTo(1.2, 2.1);
          g.closePath(); g.fill();
          g.strokeStyle = R.lt; g.lineWidth = 1;
          g.beginPath(); g.moveTo(1.8, -0.9); g.lineTo(11.6, -0.9); g.stroke();
          break;
        }
        case 2: { // T2 Frost Blade — faceted leaf + packed-snow guard knob
          const R = w.ramp(A_WC[1]);
          const RS = w.ramp(A_CORE);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -3); g.lineTo(9, -3.6); g.lineTo(16.2, -1); g.lineTo(19.4, 0);
          g.lineTo(16.2, 1); g.lineTo(9, 3.6); g.lineTo(1.4, 3);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[1];
          g.beginPath();
          g.moveTo(2.1, -2.3); g.lineTo(9, -2.9); g.lineTo(15.9, -0.6); g.lineTo(18.4, 0);
          g.lineTo(15.9, 0.6); g.lineTo(9, 2.9); g.lineTo(2.1, 2.3);
          g.closePath(); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath();
          g.moveTo(4, -1.8); g.lineTo(15.4, -0.2); g.lineTo(4, -0.2); g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(3, 1.6); g.lineTo(15, 0.6); g.stroke();
          g.fillStyle = WHITE;
          g.beginPath(); g.arc(12, -1.6, 0.8, 0, 7); g.fill();
          g.fillStyle = RS.out;
          g.beginPath(); g.arc(0.6, 0, 3.4, 0, 7); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath(); g.arc(0.6, 0, 2.6, 0, 7); g.fill();
          g.fillStyle = RS.lt;
          g.beginPath(); g.arc(-0.2, -0.8, 0.9, 0, 7); g.fill();
          break;
        }
        case 3: { // T3 Glacier Edge — silver trim, jewel pommel, ice serrations
          const R = w.ramp(A_WC[2]);
          const RS = w.ramp(A_SILVER);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -3.4); g.lineTo(12, -4.2); g.lineTo(20.6, -1.2); g.lineTo(25, 0);
          g.lineTo(20.6, 1.2); g.lineTo(12, 4.2); g.lineTo(1.4, 3.4);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[2];
          g.beginPath();
          g.moveTo(2.1, -2.7); g.lineTo(12, -3.5); g.lineTo(20.4, -0.8); g.lineTo(24, 0);
          g.lineTo(20.4, 0.8); g.lineTo(12, 3.5); g.lineTo(2.1, 2.7);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[1];
          g.beginPath();
          g.moveTo(3.6, -2.4); g.lineTo(20, -0.6); g.lineTo(3.6, -0.6); g.closePath(); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath();
          g.moveTo(5, -1.2); g.lineTo(22.4, -0.1); g.lineTo(5, -0.1); g.closePath(); g.fill();
          g.fillStyle = RS.out;
          g.beginPath(); g.roundRect(-0.3, -5.4, 3.4, 10.8, 1.3); g.fill();
          g.fillStyle = A_SILVER;
          g.beginPath(); g.roundRect(0.2, -4.9, 2.4, 9.8, 1.1); g.fill();
          g.fillStyle = RS.dk;
          g.beginPath(); g.arc(1.4, -3.4, 0.5, 0, 7); g.fill();
          g.beginPath(); g.arc(1.4, 3.4, 0.5, 0, 7); g.fill();
          g.fillStyle = RS.out;
          g.beginPath(); g.arc(-2, 0, 2.2, 0, 7); g.fill();
          g.fillStyle = A_SILVER;
          g.beginPath(); g.arc(-2, 0, 1.6, 0, 7); g.fill();
          g.fillStyle = A_CORE;
          star4(g, -2, 0, 1.1); g.fill();
          g.beginPath(); // three underside ice teeth, one path
          g.moveTo(8, 3.2); g.lineTo(9.2, 4.8); g.lineTo(10.4, 3);
          g.moveTo(12, 2.8); g.lineTo(13.2, 4.4); g.lineTo(14.4, 2.6);
          g.moveTo(16, 2.2); g.lineTo(17, 3.8); g.lineTo(18.2, 2);
          g.fill();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = WHITE;
          star4(g, 15.4, -2.5, 1.6); g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 Aurora Saber — back-spike + the first flat aurora light
          const R = w.ramp(A_WC[3]);
          const RS = w.ramp(A_SILVER);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(1.4, -3.2); g.lineTo(14, -4.6); g.lineTo(24, -3.2); g.lineTo(30.6, -0.8);
          g.lineTo(29, 1.4); g.lineTo(18, 3); g.lineTo(1.4, 3);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[3];
          g.beginPath();
          g.moveTo(2.1, -2.5); g.lineTo(14, -3.9); g.lineTo(23.8, -2.6); g.lineTo(29.6, -0.75);
          g.lineTo(28.2, 0.9); g.lineTo(17.8, 2.3); g.lineTo(2.1, 2.3);
          g.closePath(); g.fill();
          g.fillStyle = A_WC[1];
          g.beginPath();
          g.moveTo(4, -2.6); g.lineTo(26, -1.4); g.lineTo(6, -0.4); g.closePath(); g.fill();
          g.fillStyle = R.out; // back-spike
          g.beginPath();
          g.moveTo(9, -4); g.lineTo(10.6, -7.4); g.lineTo(13, -4.2); g.closePath(); g.fill();
          g.fillStyle = A_WC[3];
          g.beginPath();
          g.moveTo(9.8, -4.1); g.lineTo(10.7, -6.4); g.lineTo(12.2, -4.2); g.closePath(); g.fill();
          g.fillStyle = RS.out;
          g.beginPath(); g.roundRect(-0.3, -5.3, 3.2, 10.6, 1.1); g.fill();
          g.fillStyle = A_SILVER;
          g.beginPath(); g.roundRect(0.2, -4.8, 2.2, 9.6, 0.9); g.fill();
          g.beginPath(); g.arc(-2, 0, 1.8, 0, 7); g.fill();
          g.fillStyle = A_CORE;
          star4(g, -2, 0, 1); g.fill();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5.5);
          g.strokeStyle = A_ENERGY; g.lineWidth = 1.3;
          g.beginPath(); g.moveTo(3, -2.2); g.lineTo(24, -2.6); g.lineTo(29.8, -0.8); g.stroke();
          g.strokeStyle = A_DEEP; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(5, -0.9); g.lineTo(27, -1); g.stroke();
          g.fillStyle = A_ENERGY;
          g.fillRect(10, -0.4, 1.6, 1.1);
          g.fillRect(18, -0.9, 1.6, 1.1);
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE ETERNAL WINTER — frost wreath, snow falls where his embers rise
          const RS = w.ramp(A_SILVER);
          const RE = w.ramp(A_ENERGY);
          const fl = Math.sin(t * 9), fl2 = Math.sin(t * 7 + 2); // slower/jaggier than fire
          if (w.isPlayer) halo(g, 19, -2, 3, 26, 0.6, A_HALO0, A_HALO1, A_HALO2);
          // 1 silhouette: ice-crown claw guard
          g.fillStyle = RS.out;
          g.beginPath(); g.roundRect(-0.6, -6, 4.2, 12, 1.5); g.fill();
          g.beginPath();
          g.moveTo(2.2, -5.6); g.lineTo(5.8, -9); g.lineTo(7.4, -5.8); g.closePath();
          g.moveTo(2.2, 5.6); g.lineTo(5.8, 9); g.lineTo(7.4, 5.8); g.closePath();
          g.fill();
          g.fillStyle = A_SILVER;
          g.beginPath(); g.roundRect(0, -5.4, 3, 10.8, 1.2); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath();
          g.moveTo(2.8, -5.8); g.lineTo(5.6, -8.4); g.lineTo(6.9, -6); g.closePath();
          g.moveTo(2.8, 5.8); g.lineTo(5.6, 8.4); g.lineTo(6.9, 6); g.closePath();
          g.fill();
          g.lineCap = 'butt';
          g.strokeStyle = A_WRAP; g.lineWidth = 3.6;
          g.beginPath(); g.moveTo(-4.6, 0); g.lineTo(0, 0); g.stroke();
          g.strokeStyle = w.INK; g.lineWidth = 1;
          g.beginPath();
          g.moveTo(-3.8, -1.6); g.lineTo(-3, 1.6);
          g.moveTo(-2.2, -1.6); g.lineTo(-1.4, 1.6);
          g.stroke();
          g.fillStyle = RE.out;
          g.beginPath(); g.arc(-6, 0, 2.6, 0, 7); g.fill();
          g.fillStyle = A_ENERGY;
          g.beginPath(); g.arc(-6, 0, 2, 0, 7); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath(); g.arc(-6.4, -0.4, 0.9, 0, 7); g.fill();
          g.fillStyle = A_STEEL5;
          g.beginPath();
          g.moveTo(3.4, -2.6); g.lineTo(32, -2.6); g.lineTo(36.6, 0); g.lineTo(32, 2.6); g.lineTo(3.4, 2.6);
          g.closePath(); g.fill();
          // 2 frost envelope — 3 fills
          g.fillStyle = A_DEEP;
          g.beginPath();
          g.moveTo(4, -2.4);
          g.lineTo(7, -7 - 1.2 * fl); g.lineTo(10, -2.8);
          g.lineTo(13.5, -8.4 + fl2); g.lineTo(17, -3);
          g.lineTo(20, -9 - 1.2 * fl); g.lineTo(23, -3);
          g.lineTo(26.5, -7.6 + fl2); g.lineTo(30, -2.6);
          g.lineTo(33.5, -5.5 - fl); g.lineTo(38.4, 0);
          g.lineTo(33, 2.2); g.lineTo(20, 3.2); g.lineTo(5, 2.8);
          g.closePath(); g.fill();
          g.fillStyle = A_ENERGY;
          g.beginPath();
          g.moveTo(5, -1.8);
          g.lineTo(8, -5.2 - fl2); g.lineTo(11.5, -2.2);
          g.lineTo(15, -6.2 + fl); g.lineTo(18.5, -2.4);
          g.lineTo(22, -6.6 - fl2); g.lineTo(25, -2.2);
          g.lineTo(28, -5.2 + fl); g.lineTo(31, -1.8); g.lineTo(36.6, 0);
          g.lineTo(30, 2.2); g.lineTo(6, 2.2);
          g.closePath(); g.fill();
          g.fillStyle = A_CORE;
          g.beginPath();
          g.moveTo(6, -1); g.lineTo(20, -1.5); g.lineTo(33, -0.5); g.lineTo(36, 0);
          g.lineTo(31, 1); g.lineTo(7, 1);
          g.closePath(); g.fill();
          // 3 core line — the single shadowBlur pass, player only
          if (w.isPlayer) { g.shadowColor = A_ENERGY; g.shadowBlur = 8; }
          g.strokeStyle = WHITE; g.lineWidth = 1.3;
          g.beginPath(); g.moveTo(6, 0.1); g.lineTo(35.6, 0.1); g.stroke();
          g.shadowBlur = 0;
          // 4 snowflakes drift DOWN (negative rise)
          drift(g, SNOW_MOTES, 0, 0, t, 0.35, -12, 2, 3, 0.8, A_CORE, A_CORE);
          break;
        }
      }
      g.restore();
    },
  };

  // ============================== BROOKS — TEETH ==============================
  // gum half-disc + sun line, shared by every chatter base
  function gums(g, R, x, y, r) {
    g.fillStyle = R.out;
    g.beginPath(); g.arc(x, y + 1.5, r, 0, PI); g.closePath(); g.fill();
    g.fillStyle = BR_GUM;
    g.beginPath(); g.arc(x, y + 1.5, r - 0.8, 0, PI); g.closePath(); g.fill();
    g.strokeStyle = R.lt; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - r * 0.6, y + 1); g.lineTo(x + r * 0.6, y + 1); g.stroke();
  }

  // googly eyes; jit rattles the pupils at T5
  function googly(g, ink, x, y, r, jit) {
    g.fillStyle = BR_TOOTH;
    g.beginPath(); g.arc(x - 1.6, y, r, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 1.9, y - 0.2, r, 0, 7); g.fill();
    g.fillStyle = ink;
    g.beginPath(); g.arc(x - 1.3 + jit, y, r * 0.46, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 2.2 + jit, y - 0.2, r * 0.46, 0, 7); g.fill();
    g.fillStyle = BR_SPEC;
    g.beginPath(); g.arc(x + 1.4, y - 0.9, r * 0.31, 0, 7); g.fill();
  }

  // wind-up key on the toy's back; x is the key's left edge
  function windKey(g, R, ink, x, y) {
    g.fillStyle = R.out;
    g.beginPath(); g.roundRect(x, y - 1.3, 2.8, 2.6, 0.9); g.fill();
    g.fillStyle = BR_KEY;
    g.beginPath(); g.roundRect(x + 0.4, y - 0.9, 2, 1.8, 0.7); g.fill();
    g.fillStyle = ink; g.fillRect(x + 0.8, y - 0.4, 1.2, 0.8);
  }

  // one row of triangular fangs in a single path; caller owns fillStyle + fill/stroke
  function fangRow(g, x0, baseY, tipY, n, step, wide) {
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * step;
      g.moveTo(cx - wide, baseY); g.lineTo(cx + wide, baseY); g.lineTo(cx, tipY);
      g.closePath();
    }
  }

  W.brooks = {
    // the chomp overlay lives under the fist: it only exists mid-strike
    under: function (g, w) {
      const ext = w.attackExt || 0;
      if (!w.attackKey || ext <= 0.25) return;
      const t5 = w.tier >= 5;
      const jx = w.hx + (t5 ? 7 : 5), jy = w.hy;
      const open = t5 ? (1 - ext) * 11 + 3 : (1 - ext) * 7 + 2;
      const n = CHOMP_N[w.tier - 1], span = CHOMP_SPAN[w.tier - 1];
      const step = span / n, wide = step * 0.5;
      g.save(); // owns the lineJoin change below
      if (t5) g.globalAlpha = 0.9; // spectral jaws
      g.fillStyle = BR_TOOTH;
      g.beginPath();
      fangRow(g, jx + wide, jy - open - 4, jy - open + 1, n, step, wide);
      fangRow(g, jx + wide, jy + open + 4, jy + open - 1, n, step, wide);
      g.fill();
      if (w.tier >= 4) { // green rim outline from Shark Week up
        g.strokeStyle = BR_GREEN; g.lineWidth = t5 ? 1.6 : 1.4;
        g.lineJoin = 'round'; g.stroke();
      }
      g.globalAlpha = 1;
      g.restore();
    },
    // the chatter toy rides OVER the fist
    over: function (g, w) {
      const t = w.animT;
      const fx = w.hx, fy = w.hy;
      const RG = w.ramp(BR_GUM);
      switch (w.tier) {
        case 1: { // T1 Baby Teeth — three nubs, deliberately static
          gums(g, RG, fx, fy, 4.6);
          g.fillStyle = BR_TOOTH;
          g.beginPath(); g.arc(fx - 2.6, fy - 1, 1.1, 0, 7); g.fill();
          g.beginPath(); g.arc(fx, fy - 1.4, 1.1, 0, 7); g.fill();
          g.beginPath(); g.arc(fx + 2.6, fy - 1, 1.1, 0, 7); g.fill();
          break;
        }
        case 2: { // T2 Full Set — the wind-up mechanism arrives WITH the motion
          const tw = 6;
          const ch = w.attackKey ? (1 - (w.attackExt || 0)) * 3 : 1.2 + Math.sin(t * 10);
          gums(g, RG, fx, fy, 5.4);
          // both jaw slabs and both tooth rows go down as one path each — keeps the
          // toy plus the chomp overlay inside T2's 16-op ceiling
          g.fillStyle = BR_SLAB;
          g.beginPath();
          g.rect(fx - 6.7, fy - 2.9 - ch, 13.4, 3.3);
          g.rect(fx - 6.7, fy - 0.6 + ch * 0.4, 13.4, 2.9);
          g.fill();
          g.fillStyle = BR_TOOTH;
          g.beginPath();
          g.rect(fx - 6, fy - 2.4 - ch, 12, 2.6);
          g.rect(fx - 6, fy - 0.2 + ch * 0.4, 12, 2.2);
          g.fill();
          g.strokeStyle = BR_TOOTH2; g.lineWidth = 0.7;
          g.beginPath();
          g.moveTo(fx - 3, fy - 2.4 - ch); g.lineTo(fx - 3, fy + 2 + ch * 0.4);
          g.moveTo(fx, fy - 2.4 - ch); g.lineTo(fx, fy + 2 + ch * 0.4);
          g.moveTo(fx + 3, fy - 2.4 - ch); g.lineTo(fx + 3, fy + 2 + ch * 0.4);
          g.stroke();
          googly(g, w.INK, fx, fy - 4.6 - ch, 1.3, 0);
          windKey(g, w.ramp(BR_KEY), w.INK, fx - tw - 2.6, fy);
          break;
        }
        case 3: { // T3 Extra Sharp — nubs become fangs, tornado-green braces
          const tw = 8;
          const ch = w.attackKey ? (1 - (w.attackExt || 0)) * 3 : 1.2 + Math.sin(t * 10);
          gums(g, RG, fx, fy, 6);
          g.fillStyle = BR_SLAB;
          g.fillRect(fx - 8.3, fy - 3.4 - ch, 16.6, 3.4);
          g.fillRect(fx - 8.3, fy - 0.6 + ch * 0.4, 16.6, 3.4);
          g.fillStyle = BR_TOOTH;
          g.beginPath();
          fangRow(g, fx - 6, fy - 3.4 - ch, fy - 0.2 - ch, 4, 4, 1.7);
          fangRow(g, fx - 6, fy + 2.8 + ch * 0.4, fy - 0.4 + ch * 0.4, 4, 4, 1.7);
          g.fill();
          g.strokeStyle = BR_GREEN; g.lineWidth = 1;
          g.beginPath(); g.moveTo(fx - 6, fy - 1.8 - ch); g.lineTo(fx + 6, fy - 1.8 - ch); g.stroke();
          g.fillStyle = BR_GREEN;
          g.beginPath(); g.arc(fx - 3, fy - 1.8 - ch, 0.6, 0, 7); g.fill();
          g.beginPath(); g.arc(fx + 3, fy - 1.8 - ch, 0.6, 0, 7); g.fill();
          googly(g, w.INK, fx, fy - 5.2 - ch, 1.4, 0);
          windKey(g, w.ramp(BR_KEY), w.INK, fx - tw - 2.6, fy);
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = BR_TOOTH;
          star4(g, fx + 6, fy - 2.6 - ch, 1.2); g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 Shark Week — double fang rows, dorsal fin, first gleam light
          const tw = 9.5;
          const ch = w.attackKey ? (1 - (w.attackExt || 0)) * 3 : 1.2 + Math.sin(t * 10);
          const RF = w.ramp(BR_FIN);
          gums(g, RG, fx, fy, 6.8);
          g.fillStyle = BR_SLAB;
          g.fillRect(fx - 9.8, fy - 3.8 - ch, 19.6, 3.6);
          g.fillRect(fx - 9.8, fy - 0.6 + ch * 0.4, 19.6, 3.6);
          g.fillStyle = BR_TOOTH2; // second row sits behind, 0.8 shorter
          g.beginPath();
          fangRow(g, fx - 6.3, fy - 3.8 - ch, fy - 1.2 - ch, 4, 4, 1.6);
          fangRow(g, fx - 6.3, fy + 3 + ch * 0.4, fy + 0.4 + ch * 0.4, 4, 4, 1.6);
          g.fill();
          g.fillStyle = BR_TOOTH;
          g.beginPath();
          fangRow(g, fx - 8, fy - 3.8 - ch, fy - 0.4 - ch, 5, 4, 1.7);
          fangRow(g, fx - 8, fy + 3 + ch * 0.4, fy - 0.4 + ch * 0.4, 5, 4, 1.7);
          g.fill();
          g.fillStyle = RF.out; // dorsal fin on the toy's crown
          g.beginPath();
          g.moveTo(fx - 1, fy - 5.4 - ch); g.lineTo(fx + 1.6, fy - 9.6 - ch); g.lineTo(fx + 3.6, fy - 5.2 - ch);
          g.closePath(); g.fill();
          g.fillStyle = BR_FIN;
          g.beginPath();
          g.moveTo(fx - 0.2, fy - 5.5 - ch); g.lineTo(fx + 1.6, fy - 8.4 - ch); g.lineTo(fx + 2.9, fy - 5.4 - ch);
          g.closePath(); g.fill();
          googly(g, w.INK, fx, fy - 6 - ch, 1.5, 0);
          windKey(g, w.ramp(BR_KEY), w.INK, fx - tw - 2.6, fy);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7);
          g.strokeStyle = BR_TOOTH; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(fx - 8, fy - 2.6 - ch); g.lineTo(fx + 8, fy - 2.6 - ch); g.stroke();
          g.strokeStyle = BR_GREEN; g.lineWidth = 1;
          g.beginPath(); g.arc(fx, fy + 2, 6.2, 0.3, 2.8); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE UNHINGED JAW — the toy dislocates
          const ch = (w.attackKey ? (1 - (w.attackExt || 0)) * 3 : 1.2 + Math.sin(t * 10)) * 1.4;
          const s1 = Math.sin(t * 8), s2 = Math.sin(t * 6.5);
          if (w.isPlayer) halo(g, fx, fy, 4, 20, 0.6, BR_HALO0, BR_HALO1, BR_HALO2);
          // 1 silhouette: exposed hinge bolt, lower jaw, dislocated upper jaw
          g.fillStyle = BR_KEY;
          g.beginPath(); g.arc(fx - 7, fy, 1.4, 0, 7); g.fill();
          g.fillStyle = w.INK;
          g.beginPath(); g.arc(fx - 7, fy, 0.6, 0, 7); g.fill();
          gums(g, RG, fx, fy, 7);
          g.fillStyle = BR_SLAB;
          g.fillRect(fx - 10, fy - 0.6 + ch * 0.4, 20, 3.6);
          g.fillStyle = BR_TOOTH2;
          g.beginPath();
          fangRow(g, fx - 6.3, fy + 3 + ch * 0.4, fy + 0.4 + ch * 0.4, 5, 4, 1.6);
          g.fill();
          g.fillStyle = BR_TOOTH;
          g.beginPath();
          fangRow(g, fx - 8, fy + 3 + ch * 0.4, fy - 0.4 + ch * 0.4, 6, 3.2, 1.5);
          g.fill();
          g.save(); // upper jaw swings on the hinge; its own transform so the flip still works
          g.translate(fx - 7, fy);
          g.rotate(-0.5 - 0.1 * Math.sin(t * 10));
          g.fillStyle = BR_SLAB;
          g.fillRect(0, -3.4, 20, 3.6);
          g.beginPath(); fangRow(g, 3.4, 0.2, 1.8, 4, 3.2, 1.3); g.fill(); // stub row
          g.fillStyle = BR_TOOTH2;
          g.beginPath(); fangRow(g, 2.8, 0.2, 2.6, 5, 3.2, 1.4); g.fill();
          g.fillStyle = BR_TOOTH;
          g.beginPath(); fangRow(g, 2, 0.2, 3.4, 6, 3.2, 1.4); g.fill();
          g.restore();
          googly(g, w.INK, fx, fy - 7.4 - ch, 1.7, 0.4 * Math.sin(t * 12));
          g.fillStyle = BR_SWEAT;
          g.beginPath(); g.arc(fx + 3.4, fy - 7, 0.9, 0, 7); g.fill();
          // 2 wreath — 3 fills over the gape
          g.fillStyle = BR_GREEN;
          g.beginPath();
          g.moveTo(fx - 9, fy - 3);
          g.lineTo(fx - 3, fy - 10 - s1); g.lineTo(fx + 4, fy - 11 + s2); g.lineTo(fx + 10, fy - 4);
          g.lineTo(fx + 7, fy - 3); g.lineTo(fx, fy - 7); g.lineTo(fx - 6, fy - 2.6);
          g.closePath(); g.fill();
          g.fillStyle = BR_TOOTH;
          g.beginPath();
          g.moveTo(fx - 8, fy - 1);
          g.lineTo(fx - 3, fy - 8 - s1); g.lineTo(fx + 4, fy - 9 + s2); g.lineTo(fx + 9, fy - 2);
          g.lineTo(fx + 6.5, fy - 1.4); g.lineTo(fx, fy - 5.4); g.lineTo(fx - 5.5, fy - 0.8);
          g.closePath(); g.fill();
          g.beginPath();
          g.moveTo(fx - 8, fy - 3); g.lineTo(fx + 8, fy - 3.4); g.lineTo(fx + 8, fy - 2.6); g.lineTo(fx - 8, fy - 2.2);
          g.closePath(); g.fill();
          // 3 the single shadowBlur pass, player only
          if (w.isPlayer) { g.shadowColor = BR_GREEN; g.shadowBlur = 7; }
          g.strokeStyle = BR_TOOTH; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(fx - 8, fy - 3); g.lineTo(fx + 8, fy - 3.4); g.stroke();
          g.shadowBlur = 0;
          // 4 tooth-glints rise
          drift(g, TOOTH_MOTES, fx, fy, t, 0.5, 9, 1.5, 4, 0.8, BR_TOOTH, BR_TOOTH);
          break;
        }
      }
    },
  };

  // =============================== ISLA — ARMS ===============================
  // one bicep: out ring, skin, sun crescent, shadow underline
  function bicep(g, RS, x, y, r) {
    g.fillStyle = RS.out;
    g.beginPath(); g.arc(x, y, r + 1, 0, 7); g.fill();
    g.fillStyle = IS_SKIN;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = RS.lt;
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.5, 0, 7); g.fill();
    g.strokeStyle = RS.dk; g.lineWidth = 0.8;
    g.beginPath(); g.arc(x, y + r * 0.35, r * 0.55, 0.3, 2.8); g.stroke();
  }

  // baby-pink sweatband wrapped under a bicep
  function sweatband(g, RP, x, y, r) {
    g.fillStyle = RP.out;
    g.beginPath(); g.roundRect(x - r - 0.8, y + r * 0.35, (r + 0.8) * 2, 2.6, 1.2); g.fill();
    g.fillStyle = IS_PINK;
    g.beginPath(); g.roundRect(x - r - 0.3, y + r * 0.35 + 0.5, (r + 0.3) * 2, 1.6, 0.9); g.fill();
    g.fillStyle = IS_PINK_HI; g.fillRect(x - r + 0.4, y + r * 0.35 + 0.5, 2, 0.8);
  }

  W.isla = {
    under: function (g, w) {
      const t = w.animT;
      const RS = w.ramp(IS_SKIN);
      const bx = (w.shx + w.hx) / 2, by = (w.shy + w.hy) / 2 - 2;
      const bx2 = (w.shx + w.bx) / 2, by2 = (w.shy + w.by) / 2 - 2;
      const br = IS_BR[w.tier - 1], br2 = IS_BR2[w.tier - 1];
      g.save();
      g.lineCap = 'round';
      switch (w.tier) {
        case 1: { // T1 Noodle Arms — rubbery sag highlights, nothing else
          g.strokeStyle = RS.lt; g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(w.shx, w.shy); g.quadraticCurveTo(bx, by + 3.5, w.hx, w.hy); g.stroke();
          g.beginPath();
          g.moveTo(w.shx, w.shy); g.quadraticCurveTo(bx2, by2 + 3, w.bx, w.by); g.stroke();
          break;
        }
        case 2: { // T2 Chunky Arms — real bicep bumps + an elbow dimple
          bicep(g, RS, bx, by, br);
          bicep(g, RS, bx2, by2, br2);
          g.fillStyle = RS.dk;
          g.beginPath(); g.arc(bx + br * 0.7, by + br * 0.5, 0.7, 0, 7); g.fill();
          break;
        }
        case 3: { // T3 Toddler Guns — pink sweatbands, forearm bulge, star sticker
          const RP = w.ramp(IS_PINK);
          bicep(g, RS, bx, by, br);
          bicep(g, RS, bx2, by2, br2);
          g.fillStyle = RS.dk;
          g.beginPath(); g.arc(bx + br * 0.7, by + br * 0.5, 0.7, 0, 7); g.fill();
          g.fillStyle = RS.out;
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 3, 0, 7); g.fill();
          g.fillStyle = IS_SKIN;
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 2.4, 0, 7); g.fill();
          sweatband(g, RP, bx, by, br);
          sweatband(g, RP, bx2, by2, br2);
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = WHITE;
          star4(g, bx + br * 0.4, by - br * 0.5, 1.3); g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 4: { // T4 Full Biceps — deltoid caps + the first milk rim-light
          const RP = w.ramp(IS_PINK);
          g.fillStyle = RS.out;
          g.beginPath(); g.arc((w.shx + bx) / 2, (w.shy + by) / 2 - 1, 3.6, 0, 7); g.fill();
          g.beginPath(); g.arc((w.shx + bx2) / 2, (w.shy + by2) / 2 - 1, 3.6, 0, 7); g.fill();
          g.fillStyle = IS_SKIN;
          g.beginPath(); g.arc((w.shx + bx) / 2, (w.shy + by) / 2 - 1, 3, 0, 7); g.fill();
          g.beginPath(); g.arc((w.shx + bx2) / 2, (w.shy + by2) / 2 - 1, 3, 0, 7); g.fill();
          bicep(g, RS, bx, by, br);
          bicep(g, RS, bx2, by2, br2);
          g.fillStyle = RS.out;
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 3, 0, 7); g.fill();
          g.fillStyle = IS_SKIN;
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 2.4, 0, 7); g.fill();
          sweatband(g, RP, bx, by, br);
          sweatband(g, RP, bx2, by2, br2);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
          g.strokeStyle = IS_MILK; g.lineWidth = 1.4;
          g.beginPath(); g.arc(bx, by, br + 1.2, -2.6, -0.5); g.stroke();
          g.beginPath(); g.arc(bx2, by2, br2 + 1.1, -2.6, -0.5); g.stroke();
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(w.shx, w.shy); g.quadraticCurveTo(bx, by - br - 1, w.hx - 3, w.hy - 2); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE BABY SWOLE — milk wreath on the lead bicep
          const RP = w.ramp(IS_PINK);
          const fl = Math.sin(t * 8);
          const bi = br - 1;
          if (w.isPlayer) halo(g, bx, by, 2, 18, 0.55, IS_HALO0, IS_HALO1, IS_HALO2);
          // 1 full silhouette: deltoids, biceps, forearm bulges, sweatbands
          g.fillStyle = RS.out;
          g.beginPath(); g.arc((w.shx + bx) / 2, (w.shy + by) / 2 - 1, 3.6, 0, 7); g.fill();
          g.beginPath(); g.arc((w.shx + bx2) / 2, (w.shy + by2) / 2 - 1, 3.6, 0, 7); g.fill();
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 3, 0, 7); g.fill();
          g.beginPath(); g.arc(w.bx - 4, w.by - 2, 2.8, 0, 7); g.fill();
          g.fillStyle = IS_SKIN;
          g.beginPath(); g.arc((w.shx + bx) / 2, (w.shy + by) / 2 - 1, 3, 0, 7); g.fill();
          g.beginPath(); g.arc((w.shx + bx2) / 2, (w.shy + by2) / 2 - 1, 3, 0, 7); g.fill();
          g.beginPath(); g.arc(w.hx - 4, w.hy - 2, 2.4, 0, 7); g.fill();
          g.beginPath(); g.arc(w.bx - 4, w.by - 2, 2.2, 0, 7); g.fill();
          bicep(g, RS, bx2, by2, br2);
          bicep(g, RS, bx, by, br);
          sweatband(g, RP, bx, by, br);
          sweatband(g, RP, bx2, by2, br2);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); // rear arm keeps only the rim line
          g.strokeStyle = IS_MILK; g.lineWidth = 1.4;
          g.beginPath(); g.arc(bx2, by2, br2 + 1.1, -2.6, -0.5); g.stroke();
          g.globalAlpha = 1;
          // 2 milk wreath — 3 fills, lead bicep only
          g.fillStyle = IS_PINK;
          g.beginPath();
          g.moveTo(bx - br - 1, by);
          g.lineTo(bx - br * 0.5, by - br - 3 - fl); g.lineTo(bx, by - br - 1.5);
          g.lineTo(bx + br * 0.5, by - br - 3.5 + fl); g.lineTo(bx + br + 1, by);
          g.lineTo(bx + br * 0.6, by - br * 0.5); g.lineTo(bx - br * 0.6, by - br * 0.5);
          g.closePath(); g.fill();
          g.fillStyle = IS_MILK;
          g.beginPath();
          g.moveTo(bx - br, by);
          g.lineTo(bx - bi * 0.5, by - bi - 3 - fl); g.lineTo(bx, by - bi - 1.5);
          g.lineTo(bx + bi * 0.5, by - bi - 3.5 + fl); g.lineTo(bx + br, by);
          g.lineTo(bx + bi * 0.6, by - bi * 0.5); g.lineTo(bx - bi * 0.6, by - bi * 0.5);
          g.closePath(); g.fill();
          g.fillStyle = WHITE;
          g.beginPath();
          g.moveTo(bx - br * 0.8, by - br * 0.7); g.lineTo(bx, by - br - 0.8); g.lineTo(bx + br * 0.8, by - br * 0.6);
          g.lineTo(bx + br * 0.6, by - br * 0.3); g.lineTo(bx, by - br + 0.2); g.lineTo(bx - br * 0.6, by - br * 0.4);
          g.closePath(); g.fill();
          // 3 the single shadowBlur pass, player only
          if (w.isPlayer) { g.shadowColor = IS_MILK; g.shadowBlur = 7; }
          g.strokeStyle = WHITE; g.lineWidth = 1.2;
          g.beginPath(); g.arc(bx, by, br + 0.6, -2.7, -0.4); g.stroke();
          g.shadowBlur = 0;
          // 4 twin sparkles
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 9);
          g.fillStyle = WHITE;
          star4(g, bx - br * 0.6, by - br * 0.8, 1.4); g.fill();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 9 + 2);
          star4(g, bx + br * 0.7, by - br * 0.4, 1.4); g.fill();
          g.globalAlpha = 1;
          // 5 milk droplets FALL (negative rise)
          drift(g, MILK_MOTES, bx, by, t, 0.45, -8, 1.2, 3.5, 0.8, IS_MILK, IS_MILK);
          break;
        }
      }
      g.restore();
    },
  };

  // =========================== DAYNE — SOFT OBJECTS ===========================
  W.dayne = {
    under: function (g, w) {
      const t = w.animT;
      const ext = w.attackKey ? (w.attackExt || 0) : 0;
      if (w.tier === 2) { // T2 Pool Noodle — anchored bendy tube, no transform
        const R = w.ramp(D_WC[1]);
        const wob = Math.sin(t * 9) * 2;
        const nx = w.hx + 19, ny = w.hy - 6 + wob;
        const cx = w.hx + 11, cy = w.hy - 14;
        g.save();
        g.lineCap = 'round';
        g.strokeStyle = R.out; g.lineWidth = 6.6;
        g.beginPath(); g.moveTo(w.hx, w.hy); g.quadraticCurveTo(cx, cy, nx, ny); g.stroke();
        g.strokeStyle = D_WC[1]; g.lineWidth = 4.6;
        g.beginPath(); g.moveTo(w.hx, w.hy); g.quadraticCurveTo(cx, cy, nx, ny); g.stroke();
        g.strokeStyle = R.lt; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(w.hx, w.hy - 1.2); g.quadraticCurveTo(cx, cy - 1.2, nx, ny - 1.2); g.stroke();
        g.fillStyle = R.hi;
        g.beginPath(); g.arc(w.hx + 4, w.hy - 5, 0.9, 0, 7); g.fill();
        g.fillStyle = R.dk;
        g.beginPath(); g.arc(nx, ny, 2.3, 0, 7); g.fill();
        g.fillStyle = w.INK;
        g.beginPath(); g.arc(nx, ny, 0.9, 0, 7); g.fill();
        g.restore();
        return;
      }
      g.save();
      g.translate(w.hx, w.hy);
      switch (w.tier) {
        case 1: { // T1 Throw Pillow — found on the couch
          const R = w.ramp(D_WC[0]);
          g.rotate(-0.35 + ext * 0.9);
          g.fillStyle = R.out;
          g.beginPath(); g.roundRect(-1, -6, 13, 10, 3.4); g.fill();
          g.fillStyle = D_WC[0];
          g.beginPath(); g.roundRect(-0.4, -5.4, 11.8, 8.8, 3); g.fill();
          g.fillStyle = R.lt; g.fillRect(0.6, -4.6, 10.4, 1.4);
          g.strokeStyle = R.dk; g.lineWidth = 0.9;
          g.beginPath();
          g.moveTo(0.2, -4.8); g.lineTo(1.4, -3.8);
          g.moveTo(10.4, 3); g.lineTo(11.4, 2.2);
          g.stroke();
          break;
        }
        case 3: { // T3 Body Pillow — a slow tragic flop is this tier's twinkle
          const R = w.ramp(D_WC[2]);
          g.rotate(-0.35 + 0.04 * Math.sin(t * 2) + ext * 0.9);
          g.fillStyle = R.out;
          g.beginPath(); g.roundRect(-2, -7, 24, 12, 5); g.fill();
          g.fillStyle = D_WC[2];
          g.beginPath(); g.roundRect(-1.2, -6.2, 22.4, 10.4, 4.4); g.fill();
          g.strokeStyle = D_WHITE; g.lineWidth = 1;
          g.beginPath(); g.roundRect(0, -5.6, 20.4, 9.2, 4); g.stroke();
          g.strokeStyle = R.dk; g.lineWidth = 1;
          g.beginPath(); g.moveTo(2, -1); g.quadraticCurveTo(10, 1.5, 19, -1); g.stroke();
          g.fillStyle = R.lt; g.fillRect(0.6, -5.4, 20, 1.6);
          g.fillStyle = D_PINK; // embroidered heart
          g.beginPath(); g.arc(14, -3.2, 1.1, 0, 7); g.fill();
          g.beginPath(); g.arc(15.8, -3.2, 1.1, 0, 7); g.fill();
          g.beginPath();
          g.moveTo(12.9, -2.8); g.lineTo(16.9, -2.8); g.lineTo(14.9, -0.6); g.closePath(); g.fill();
          break;
        }
        case 4: { // T4 Foam Pit Cube — the energy rung as deliberately dim shimmer
          const R = w.ramp(D_WC[3]);
          g.rotate(-0.2 + ext * 0.9);
          g.fillStyle = R.out;
          g.beginPath(); g.roundRect(-1.2, -8.4, 16.8, 16.8, 2.4); g.fill();
          g.fillStyle = D_WC[3];
          g.beginPath(); g.roundRect(-0.4, -7.6, 15.2, 15.2, 2); g.fill();
          g.fillStyle = R.lt; g.fillRect(-0.4, -7.6, 15.2, 3.4);
          g.fillStyle = R.dk; g.fillRect(11.6, -7.6, 3.2, 15.2);
          g.beginPath(); g.arc(3, -2, 0.8, 0, 7); g.fill();
          g.beginPath(); g.arc(8, 1, 0.8, 0, 7); g.fill();
          g.beginPath(); g.arc(5, 4, 0.8, 0, 7); g.fill();
          g.beginPath(); g.arc(11, -4, 0.8, 0, 7); g.fill();
          g.fillStyle = R.out; // a bite-sized chunk missing
          g.beginPath(); g.arc(14.8, -7.6, 2.2, 0.6, 2.6); g.fill();
          g.beginPath(); g.arc(12.8, -8, 1.4, 0.4, 2.4); g.fill();
          g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 5);
          g.fillStyle = D_PINK;
          star4(g, 4, -5, 1.3); g.fill();
          star4(g, 12, 2, 1.3); g.fill();
          g.strokeStyle = D_PINK; g.lineWidth = 1;
          g.beginPath(); g.moveTo(-0.4, -7.6); g.lineTo(14.8, -7.6); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        default: { // T5 THE BOUNCY CASTLE BEAM — maximal ceremony, zero menace
          const R = w.ramp(D_WC[4]);
          const bs = 0.03 * Math.sin(t * 6);
          g.rotate(-0.25 + 0.05 * Math.sin(t * 3) + ext * 0.9);
          g.scale(1 + bs, 1 - bs); // it breathes; it is inflatable
          if (w.isPlayer) halo(g, 17, -2, 4, 24, 0.6, D_HALO0, D_HALO1, D_HALO2);
          // 1 god-rays behind the beam, 3 flat white fills
          g.fillStyle = D_WHITE;
          g.globalAlpha = 0.1 + 0.06 * Math.sin(t * 4);
          g.beginPath(); g.moveTo(2, -6); g.lineTo(40, -16); g.lineTo(40, -9); g.closePath(); g.fill();
          g.globalAlpha = 0.1 + 0.06 * Math.sin(t * 4 + 2);
          g.beginPath(); g.moveTo(10, -7); g.lineTo(41, -4); g.lineTo(41, 2); g.closePath(); g.fill();
          g.globalAlpha = 0.1 + 0.06 * Math.sin(t * 4 + 4);
          g.beginPath(); g.moveTo(4, 6); g.lineTo(40, 10); g.lineTo(40, 16); g.closePath(); g.fill();
          g.globalAlpha = 1;
          // 2 the castle itself
          g.fillStyle = R.out;
          g.beginPath(); g.roundRect(-1.4, -6.6, 34, 13.2, 6.4); g.fill();
          g.fillStyle = D_WC[4];
          g.beginPath(); g.roundRect(-0.6, -5.8, 32.4, 11.6, 5.8); g.fill();
          g.fillStyle = D_PINK;
          g.fillRect(3, -5.8, 3.4, 11.6);
          g.fillRect(11, -5.8, 3.4, 11.6);
          g.fillRect(19, -5.8, 3.4, 11.6);
          g.fillRect(27, -4.6, 3.4, 9.2); // shortened: this one rides the rounded end
          g.strokeStyle = R.dk; g.lineWidth = 1.1;
          g.beginPath(); g.arc(7, 0, 5.8, -1.3, 1.3); g.stroke();
          g.beginPath(); g.arc(15, 0, 5.8, -1.3, 1.3); g.stroke();
          g.beginPath(); g.arc(23, 0, 5.8, -1.3, 1.3); g.stroke();
          g.fillStyle = R.lt; g.fillRect(0.6, -5, 30, 1.8);
          g.fillStyle = R.out; // turret cone tip
          g.beginPath();
          g.moveTo(31.4, -7.4); g.lineTo(38.6, 0); g.lineTo(31.4, 7.4); g.closePath(); g.fill();
          g.fillStyle = D_WC[4];
          g.beginPath();
          g.moveTo(31.4, -6.4); g.lineTo(37.4, 0); g.lineTo(31.4, 6.4); g.closePath(); g.fill();
          g.fillStyle = D_PINK; g.fillRect(31.4, -1.4, 4.6, 2.8);
          g.strokeStyle = D_POLE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(34.6, -6.2); g.lineTo(34.6, -11); g.stroke();
          g.fillStyle = D_FLAG;
          g.beginPath();
          g.moveTo(34.6, -11); g.lineTo(38.4, -9.8); g.lineTo(34.6, -8.8); g.closePath(); g.fill();
          // 3 the 'energy' core: a squeak-glint, still a joke
          g.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5);
          g.strokeStyle = D_WHITE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(2, -4.6); g.lineTo(29, -4.6); g.stroke();
          g.globalAlpha = 1;
          // 4 squeak motes, dimmer than the real heroes. 5 no shadowBlur — ever.
          drift(g, SQUEAK_MOTES, 0, 0, t, 0.4, 8, 1.5, 3, 0.6, D_PINK, D_PINK);
          break;
        }
      }
      g.restore();
    },
  };
})();
