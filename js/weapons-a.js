// weapons-a.js — tier-ladder weapon bodies for todd (fists), sonya (books),
// jordan (feet) and jerod (3D-printed blades). Bodies draw in drawFighter local
// space: (0,0) = the fighter's feet, y negative is up, +x is forward (the caller
// owns the facing flip). 'under' runs before the fists so the mitt covers a grip;
// 'over' runs after them for hand-riding art. The caller does not save/restore.
(function () {
  const W = (window.WEAPON_BODIES = window.WEAPON_BODIES || {});

  // ---- hoisted palettes (module scope — nothing allocated per frame) ----
  const CLEAR = 'transparent';
  const WHITE = '#ffffff';

  // todd: worn leather -> brass -> concrete -> meteor rock -> obsidian + fire
  const T_LEATHER = '#8a6a48';
  const T_BRASS = '#c9963a';
  const T_CONCRETE = '#9aa0ae';
  const T_STRAP = '#e8524a';   // his red wrist strap (second color at T3)
  const T_REBAR = '#6a7078';
  const T_ROCK = '#5a4a44';
  const T_OBSID = '#3a3038';
  const T_EMBER = '#ff7a2c';
  const T_GOLD = '#ffd24a';
  const T_CORE = '#fff6dd';
  const T_TONGUE = '#c2401e';
  const T_HALO_0 = '#ff7a2c66';
  const T_HALO_1 = '#ff7a2c22';
  // sonya: kraft -> clothbound red -> encyclopedia green -> violet -> arcane
  const S_KRAFT = '#9a8a72';
  const S_CLOTH = '#c94f3f';
  const S_GREEN = '#3a6b52';
  const S_VIOLET = '#a586c1';
  const S_ARCANE = '#e0b8ff';
  const S_GOLD = '#ffd24a';
  const S_BRASS = '#c9963a';
  const S_PAGE_OLD = '#e8dfc8';
  const S_PAGE_WARM = '#fff4dd';
  const S_PAGE_T4 = '#efe6d2';
  const S_RULE = '#c9bfa8';
  const S_CHAIN = '#8a8e98';
  const S_TENDRIL = '#7a4ab0';
  const S_CORE = '#f4ecff';
  const S_HALO_0 = '#e0b8ff59';
  const S_HALO_1 = '#e0b8ff1e';
  // jordan: athletic tape -> clean wrap -> leather strapwork -> trainer -> legend
  const O_TAPE = '#b8b0a0';
  const O_WRAP = '#e6e2d8';
  const O_LEATHER = '#9b5031';
  const O_ORANGE = '#e8784a';
  const O_BRASS = '#c9963a';
  const O_TRAINER = '#bab7c1';
  const O_SHOE = '#f4f2ec';
  const O_GOLD = '#ffd24a';
  const O_PETAL = '#ffca6a';
  const O_MID = '#ffec9a';
  const O_HALO_0 = '#ffec9a55';
  const O_HALO_1 = '#ffec9a1c';
  // jerod: draft PLA -> glossy ABS -> carbon -> titanium+plasma -> masterprint
  const J_PLA = '#b0a068';
  const J_ABS = '#e8c84a';
  const J_CARBON = '#4a505c';
  const J_TITAN = '#aeb6c2';
  const J_PLASMA_DIM = '#3c9eb1';
  const J_PLASMA = '#4adbe8';
  const J_PRINT = '#eef1f4';
  const J_STRIA = '#c9d2da';
  const J_BRASS = '#c9963a';
  const J_GOLD = '#ffd24a';
  const J_NOZZLE = '#ff7a2c';
  const J_TAPE = '#8a8e98';
  const J_GRIP = '#2e3138';
  const J_GRIP2 = '#4a5060';
  const J_SHEET = '#2e7a9e';
  const J_CORE = '#dffbff';
  const J_HALO_0 = '#4adbe855';
  const J_HALO_1 = '#4adbe81c';

  // ---- hoisted geometry tables (flat, stride-indexed like skins-home P_RINGS) ----
  // wreath fans: b1x,b1y, b2x,b2y, tipx,tipy, phase, amp — the tip lerps toward
  // the base midpoint by the layer factor k, so one table drives all 3 layers.
  const TODD_TONGUES = [
    -6.2, -7.5, 0.2, -7.5, -3, -13.5, 0, 1.6,
    -1.9, -7.5, 4.9, -7.5, 1.5, -15, 2.1, 1.8,
    2.5, -7.5, 8.5, -7.5, 5.5, -12.8, 4.2, 1.4,
  ];
  const TODD_BACK_TONGUES = [
    -4.8, -6.8, 0.8, -6.8, -2, -12.2, 1, 1.4,
    0.4, -6.8, 5.6, -6.8, 3, -13.4, 3.1, 1.2,
  ];
  const SONYA_TENDRILS = [
    0.4, -16.6, 5.6, -16.6, 3, -25.5, 0, 1.6,
    4.2, -16.8, 9.8, -16.8, 7, -27, 2.1, 1.8,
    8.6, -16.6, 13.4, -16.6, 11, -25, 4.2, 1.4,
  ];
  const JORDAN_PETALS = [
    2, -4, 3.4, -11, 7, -8, 0, 1.4,
    -2.5, -3.4, -4, -11, -7.5, -7, 2.1, 1.2,
    -2.4, -13, 3.6, -12.6, 2, -16.5, 4.2, 1.6,
  ];
  // drifting motes: dx,dy,phase,r
  const TODD_EMBERS = [-4, -11, 0, 1.2, 3, -13, 0.31, 1, 7, -10, 0.62, 1.3, -1, -14, 0.85, 0.9];
  const SONYA_MOTES = [1, -19, 0, 1, 12, -20, 0.28, 0.8, 5, -22, 0.55, 1.1, 10, -17, 0.8, 0.7];
  const JORDAN_FLARES = [-5, -8, 0, 1.1, 4, -12, 0.27, 0.8, 8, -6, 0.5, 1, -2, -15, 0.78, 0.9];
  const JEROD_SPARKS = [8, -5, 0, 1, 16, -6, 0.3, 0.8, 24, -5, 0.55, 1.2, 31, -4, 0.82, 0.9];

  // ---- shared painters ----
  // Appends wreath-tongue subpaths to the open path; caller owns beginPath/fill.
  function flameFan(g, tbl, ox, oy, t, spd, k) {
    for (let i = 0; i < tbl.length; i += 8) {
      const mx = (tbl[i] + tbl[i + 2]) * 0.5, my = (tbl[i + 1] + tbl[i + 3]) * 0.5;
      const ty = tbl[i + 5] + Math.sin(t * spd + tbl[i + 6]) * tbl[i + 7];
      g.moveTo(ox + tbl[i], oy + tbl[i + 1]);
      g.lineTo(ox + mx + (tbl[i + 4] - mx) * k, oy + my + (ty - my) * k);
      g.lineTo(ox + tbl[i + 2], oy + tbl[i + 3]);
    }
  }
  // 4-point twinkle star (the Addi ice-sword pattern); caller owns fillStyle/alpha
  function star4(g, cx, cy, r) {
    const i = r * 0.29;
    g.beginPath();
    g.moveTo(cx - r, cy); g.lineTo(cx - i, cy - i); g.lineTo(cx, cy - r); g.lineTo(cx + i, cy - i);
    g.lineTo(cx + r, cy); g.lineTo(cx + i, cy + i); g.lineTo(cx, cy + r); g.lineTo(cx - i, cy + i);
    g.closePath(); g.fill();
  }

  // ============================ TODD — THE FISTS ============================
  // Both hands dress at every tier, so punch, cross and launcher all read armed.
  function toddGlove(g, hx, hy, R) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(hx - 5.4, hy - 4.6, 10.8, 9.2, 3.4); g.fill();
    g.fillStyle = T_LEATHER; g.beginPath(); g.roundRect(hx - 4.6, hy - 3.9, 9.2, 7.8, 3); g.fill();
    g.strokeStyle = R.dk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(hx - 4, hy + 2.4); g.lineTo(hx + 4, hy + 2.4); g.stroke();
    g.fillStyle = R.lt; g.beginPath(); g.arc(hx - 1.6, hy - 1.8, 1.5, 0, 7); g.fill();
  }
  function toddKnuckles(g, hx, hy, R, K) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(hx - 6, hy - 4.8, 12, 9.6, 3.6); g.fill();
    g.fillStyle = T_LEATHER; g.beginPath(); g.roundRect(hx - 5.2, hy - 4.1, 10.4, 8.2, 3.2); g.fill();
    g.fillStyle = K.out; g.beginPath(); g.roundRect(hx - 6.6, hy - 3.3, 13.2, 4.2, 2.1); g.fill();
    g.fillStyle = T_BRASS; g.beginPath(); g.roundRect(hx - 6, hy - 2.8, 12, 3.2, 1.6); g.fill();
    g.fillStyle = K.dk;
    g.beginPath(); g.arc(hx - 2.6, hy - 1.2, 0.9, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 1.4, hy - 1.2, 0.9, 0, 7); g.fill();
    g.fillStyle = K.hi; g.beginPath(); g.arc(hx + 4.2, hy - 2.4, 0.7, 0, 7); g.fill();
  }
  function toddConcrete(g, hx, hy, C, S) {
    g.fillStyle = C.out; g.beginPath(); g.roundRect(hx - 7.5, hy - 6.5, 15, 13, 2.4); g.fill();
    g.fillStyle = T_CONCRETE; g.beginPath(); g.roundRect(hx - 6.8, hy - 5.8, 13.6, 11.6, 2); g.fill();
    g.fillStyle = C.lt; g.fillRect(hx - 6.8, hy - 5.8, 13.6, 2.6);
    g.strokeStyle = C.dk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(hx - 2, hy - 5.8); g.lineTo(hx - 3.4, hy - 1); g.lineTo(hx - 1, hy + 2); g.stroke();
    g.fillStyle = C.dk;
    g.beginPath(); g.arc(hx + 3, hy - 2, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(hx - 4, hy + 3, 0.8, 0, 7); g.fill();
    g.fillStyle = T_STRAP; g.fillRect(hx - 7, hy + 3.6, 14, 2.6);
    g.fillStyle = S.lt; g.fillRect(hx - 7, hy + 3.6, 14, 0.9);
    g.fillStyle = T_REBAR; g.beginPath(); g.arc(hx + 5.4, hy - 4.4, 1.2, 0, 7); g.fill();
  }
  function toddMeteor(g, hx, hy, K) {
    g.fillStyle = K.out;
    g.beginPath();
    g.moveTo(hx - 10, hy - 4.5); g.lineTo(hx - 5.5, hy - 9.5); g.lineTo(hx + 1, hy - 7.8);
    g.lineTo(hx + 6.5, hy - 8.8); g.lineTo(hx + 10.5, hy - 2.8); g.lineTo(hx + 8.2, hy + 4.4);
    g.lineTo(hx + 2, hy + 7.6); g.lineTo(hx - 6.6, hy + 6);
    g.closePath(); g.fill();
    g.fillStyle = T_ROCK; // same polygon inset 0.9 toward the centroid
    g.beginPath();
    g.moveTo(hx - 9.1, hy - 4.3); g.lineTo(hx - 4.9, hy - 8.8); g.lineTo(hx + 1, hy - 6.9);
    g.lineTo(hx + 5.9, hy - 8.1); g.lineTo(hx + 9.6, hy - 2.7); g.lineTo(hx + 7.5, hy + 3.8);
    g.lineTo(hx + 1.9, hy + 6.7); g.lineTo(hx - 6, hy + 5.3);
    g.closePath(); g.fill();
    g.fillStyle = K.lt;
    g.beginPath(); g.moveTo(hx - 6.5, hy - 6); g.lineTo(hx - 1, hy - 7.2); g.lineTo(hx - 4.4, hy - 2); g.closePath(); g.fill();
    g.fillStyle = K.dk;
    g.beginPath(); g.moveTo(hx + 3, hy + 3.4); g.lineTo(hx + 7.6, hy + 1.2); g.lineTo(hx + 4.4, hy + 6.2); g.closePath(); g.fill();
  }
  function toddMagma(g, hx, hy, t, ph) {
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6 + ph);
    g.strokeStyle = T_EMBER; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(hx - 4.4, hy - 6.6); g.lineTo(hx - 2.2, hy - 1.6); g.lineTo(hx - 5, hy + 3.4); g.stroke();
    g.beginPath(); g.moveTo(hx + 2.2, hy - 5.5); g.lineTo(hx + 4.4, hy + 0.6); g.stroke();
    g.fillStyle = T_EMBER;
    g.beginPath(); g.arc(hx - 3.4, hy - 8.2, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 0.6, hy - 7.6, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 4.6, hy - 8.4, 1, 0, 7); g.fill();
    g.fillStyle = T_GOLD;
    g.beginPath(); g.arc(hx - 2.2, hy - 1.6, 1.1, 0, 7); g.fill();
    g.globalAlpha = 1;
  }
  function toddObsidian(g, hx, hy, O) {
    g.fillStyle = O.out; // T4 jag scaled ~15%, clamped to the spec's bounds
    g.beginPath();
    g.moveTo(hx - 11.2, hy - 5); g.lineTo(hx - 6.2, hy - 10.4); g.lineTo(hx + 1.1, hy - 8.6);
    g.lineTo(hx + 7.3, hy - 9.7); g.lineTo(hx + 11.6, hy - 3.1); g.lineTo(hx + 9.2, hy + 4.8);
    g.lineTo(hx + 2.2, hy + 8.4); g.lineTo(hx - 7.4, hy + 6.6);
    g.closePath(); g.fill();
    g.fillStyle = T_OBSID;
    g.beginPath();
    g.moveTo(hx - 10.2, hy - 4.8); g.lineTo(hx - 5.6, hy - 9.6); g.lineTo(hx + 1.1, hy - 7.6);
    g.lineTo(hx + 6.7, hy - 8.9); g.lineTo(hx + 10.6, hy - 3); g.lineTo(hx + 8.4, hy + 4.2);
    g.lineTo(hx + 2.1, hy + 7.4); g.lineTo(hx - 6.7, hy + 5.9);
    g.closePath(); g.fill();
    g.fillStyle = O.lt;
    g.beginPath(); g.moveTo(hx - 7.3, hy - 6.6); g.lineTo(hx - 1.1, hy - 7.9); g.lineTo(hx - 5, hy - 2.2); g.closePath(); g.fill();
  }
  // the front fist's gold veins live in their own path — the T5 blur pass restrokes it
  function toddFrontVeins(g, hx, hy) {
    g.beginPath();
    g.moveTo(hx - 4.8, hy - 7.2); g.lineTo(hx - 2.4, hy - 1.6); g.lineTo(hx - 5.2, hy + 3.8);
    g.moveTo(hx + 2.6, hy - 6.4); g.lineTo(hx + 5, hy - 0.6); g.lineTo(hx + 3.2, hy + 4.6);
    g.stroke();
  }

  W.todd = {
    over: function (g, w) {
      const hx = w.hx, hy = w.hy, bx = w.bx, by = w.by, t = w.animT;
      g.lineCap = 'round'; g.lineJoin = 'round';
      switch (w.tier) {
        case 1: { // WORK GLOVES — one material, one sun dot, zero light
          const R = w.ramp(T_LEATHER);
          toddGlove(g, hx, hy, R);
          toddGlove(g, bx, by, R);
          break;
        }
        case 2: { // BRASS KNUCKLES — the knuckle bar is the silhouette beat
          const R = w.ramp(T_LEATHER), K = w.ramp(T_BRASS);
          toddKnuckles(g, hx, hy, R, K);
          toddKnuckles(g, bx, by, R, K);
          break;
        }
        case 3: { // CONCRETE FISTS — square poured slabs, red wrist strap enters
          const C = w.ramp(T_CONCRETE), S = w.ramp(T_STRAP);
          toddConcrete(g, hx, hy, C, S);
          toddConcrete(g, bx, by, C, S);
          break;
        }
        case 4: { // METEOR MITTS — jagged rock, first light as magma cracks
          const K = w.ramp(T_ROCK);
          toddMeteor(g, hx, hy, K);
          toddMeteor(g, bx, by, K);
          toddMagma(g, hx, hy, t, 0);
          toddMagma(g, bx, by, t, 1.7);
          break;
        }
        case 5: { // FISTS OF THE TODDFATHER — obsidian, gold veins, layered flame
          const O = w.ramp(T_OBSID);
          if (w.isPlayer) { // the one radial gradient, front fist only
            const hg = g.createRadialGradient(hx, hy, 2, hx, hy, 16);
            hg.addColorStop(0, T_HALO_0); hg.addColorStop(0.6, T_HALO_1); hg.addColorStop(1, CLEAR);
            g.fillStyle = hg;
            g.beginPath(); g.arc(hx, hy, 16, 0, 7); g.fill();
          }
          toddObsidian(g, hx, hy, O);
          toddObsidian(g, bx, by, O);
          g.strokeStyle = T_GOLD; g.lineWidth = 1.2;
          toddFrontVeins(g, hx, hy);
          g.beginPath();
          g.moveTo(bx - 4.2, by - 6.8); g.lineTo(bx - 1.8, by - 1.2); g.lineTo(bx - 4.6, by + 4);
          g.stroke();
          // wreath: both fists share 3 fills via multi-subpath, then one core stroke
          g.fillStyle = T_TONGUE;
          g.beginPath();
          flameFan(g, TODD_TONGUES, hx, hy, t, 11, 1);
          flameFan(g, TODD_BACK_TONGUES, bx, by, t, 11, 1);
          g.fill();
          g.fillStyle = T_EMBER;
          g.beginPath();
          flameFan(g, TODD_TONGUES, hx, hy, t, 11, 0.65);
          flameFan(g, TODD_BACK_TONGUES, bx, by, t, 11, 0.65);
          g.fill();
          g.fillStyle = T_GOLD;
          g.beginPath();
          flameFan(g, TODD_TONGUES, hx, hy, t, 11, 0.3);
          flameFan(g, TODD_BACK_TONGUES, bx, by, t, 11, 0.3);
          g.fill();
          g.strokeStyle = T_CORE; g.lineWidth = 1;
          g.beginPath(); g.arc(hx, hy - 7.6, 5.2, 3.4, 6); g.stroke();
          g.fillStyle = T_GOLD;
          for (let i = 0; i < TODD_EMBERS.length; i += 4) {
            const cyc = (t * 0.5 + TODD_EMBERS[i + 2]) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(hx + TODD_EMBERS[i] + Math.sin(cyc * 6.28) * 1.5, hy + TODD_EMBERS[i + 1] - cyc * 9, TODD_EMBERS[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          if (w.isPlayer) { // the one shadowBlur pass, zeroed immediately after
            g.shadowColor = T_EMBER; g.shadowBlur = 8;
            g.strokeStyle = T_GOLD; g.lineWidth = 1.2;
            toddFrontVeins(g, hx, hy);
            g.shadowBlur = 0;
          }
          break;
        }
      }
    },
  };

  // =========================== SONYA — THE BOOKS ============================
  // The book always rides flat on the front palm; the pivot persists all tiers.
  W.sonya = {
    over: function (g, w) {
      const t = w.animT;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.15 + (w.attackKey ? (w.attackExt || 0) * 0.5 : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      switch (w.tier) {
        case 1: { // PAPERBACK — floppy kraft cover, one worn spine crease
          const R = w.ramp(S_KRAFT);
          g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.2, -8.2, 12.4, 9.4, 1.4); g.fill();
          g.fillStyle = S_KRAFT; g.fillRect(0, -7.2, 10.4, 7.6);
          g.fillStyle = S_PAGE_OLD; g.fillRect(8.6, -6.4, 1.8, 6);
          g.fillStyle = R.lt; g.fillRect(0, -7.2, 10.4, 1.3);
          g.strokeStyle = R.dk; g.lineWidth = 0.8;
          g.beginPath(); g.moveTo(2.4, -7.2); g.lineTo(2.4, 0.4); g.stroke();
          break;
        }
        case 2: { // HARDCOVER COOKBOOK — the raised spine is the silhouette beat
          const R = w.ramp(S_CLOTH);
          g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.6, -10.6, 16, 11.8, 1.8); g.fill();
          g.fillStyle = S_CLOTH; g.fillRect(0, -9.6, 13.2, 10);
          g.fillStyle = R.dk; g.fillRect(0, -9.6, 2.6, 10);
          g.fillStyle = S_PAGE_WARM; g.fillRect(11, -8.6, 2.2, 8.2);
          g.fillStyle = R.lt; g.fillRect(2.6, -9.6, 10.6, 1.6);
          g.fillStyle = S_PAGE_WARM; g.beginPath(); g.roundRect(4, -7.4, 6.6, 4.4, 0.8); g.fill();
          g.fillStyle = R.hi; g.beginPath(); g.arc(3.2, -8.7, 0.8, 0, 7); g.fill();
          g.fillStyle = R.dk;
          g.beginPath(); g.moveTo(8, 0.4); g.lineTo(9.6, 0.4); g.lineTo(8.8, 2.6); g.closePath(); g.fill();
          break;
        }
        case 3: { // ENCYCLOPEDIA VOL. K — gold enters as bands, corners and the K
          const R = w.ramp(S_GREEN), P = w.ramp(S_PAGE_OLD);
          g.fillStyle = R.out; g.beginPath(); g.roundRect(-1.8, -13.6, 21.4, 15, 2); g.fill();
          g.fillStyle = S_GREEN; g.fillRect(0, -12.6, 17.8, 13);
          g.fillStyle = S_PAGE_OLD; g.fillRect(15, -11.4, 2.8, 10.8);
          g.strokeStyle = P.dk; g.lineWidth = 0.6;
          g.beginPath();
          g.moveTo(15.3, -8.4); g.lineTo(17.6, -8.4);
          g.moveTo(15.3, -4.8); g.lineTo(17.6, -4.8);
          g.stroke();
          g.fillStyle = R.dk; g.fillRect(0, -12.6, 3.4, 13);
          g.fillStyle = S_GOLD;
          g.fillRect(0.5, -11.2, 2.4, 1.3);
          g.fillRect(0.5, -3.4, 2.4, 1.3);
          g.beginPath(); // two corner protectors in one path
          g.moveTo(17.8, -12.6); g.lineTo(13.8, -12.6); g.lineTo(17.8, -8.6);
          g.moveTo(17.8, 0.4); g.lineTo(13.8, 0.4); g.lineTo(17.8, -3.6);
          g.fill();
          g.strokeStyle = S_GOLD; g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(8, -9); g.lineTo(8, -4.4);
          g.moveTo(11, -9); g.lineTo(8.6, -6.8); g.lineTo(11, -4.4);
          g.stroke();
          g.fillStyle = R.lt; g.fillRect(3.4, -12.6, 14.4, 1.8);
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = WHITE;
          star4(g, 14.4, -10.8, 1.4);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // UNABRIDGED DICTIONARY — brass clasp + first light on the seam
          const R = w.ramp(S_VIOLET), B = w.ramp(S_BRASS);
          g.fillStyle = R.out; g.beginPath(); g.roundRect(-2.2, -17.6, 28.6, 19.4, 2.4); g.fill();
          g.fillStyle = S_VIOLET; g.fillRect(0, -16.4, 24.2, 17);
          g.fillStyle = R.dk; g.fillRect(0, -16.4, 4.2, 17);
          g.fillStyle = S_PAGE_T4; g.fillRect(20.6, -15, 3.6, 14.2);
          g.fillStyle = R.lt; g.fillRect(4.2, -16.4, 16.4, 2.2);
          g.fillStyle = B.out; g.beginPath(); g.roundRect(22.8, -9.6, 4, 5, 1); g.fill();
          g.fillStyle = S_BRASS; g.beginPath(); g.roundRect(23.3, -9.1, 3, 4, 0.8); g.fill();
          g.fillStyle = B.hi; g.beginPath(); g.arc(24.1, -8.3, 0.7, 0, 7); g.fill();
          g.fillStyle = S_PAGE_T4; g.fillRect(7, -13.4, 10.6, 2.6);
          g.strokeStyle = R.dk; g.lineWidth = 0.7; g.strokeRect(7, -13.4, 10.6, 2.6);
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
          g.strokeStyle = S_ARCANE; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(20.6, -15); g.lineTo(20.6, -0.8); g.stroke();
          g.beginPath(); g.moveTo(9.4, -8.6); g.lineTo(11, -6.2); g.lineTo(9.4, -4.6); g.stroke();
          g.beginPath(); g.arc(15, -6.6, 1.6, 0, 6.28); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        case 5: { // THE FORBIDDEN TOME — floats open, chained to the wrist, reading itself
          const bob = Math.sin(t * 3) * 1.2;
          const R = w.ramp(S_ARCANE), B = w.ramp(S_BRASS);
          if (w.isPlayer) { // the one radial gradient
            const hg = g.createRadialGradient(7, -14 + bob, 3, 7, -14 + bob, 17);
            hg.addColorStop(0, S_HALO_0); hg.addColorStop(0.55, S_HALO_1); hg.addColorStop(1, CLEAR);
            g.fillStyle = hg;
            g.beginPath(); g.arc(7, -14 + bob, 17, 0, 7); g.fill();
          }
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(7, -10.4 + bob); g.lineTo(-6, -14.6 + bob); g.lineTo(-5, -21.8 + bob); g.lineTo(7, -16.6 + bob);
          g.closePath(); g.fill();
          g.beginPath();
          g.moveTo(7, -10.4 + bob); g.lineTo(20, -14.6 + bob); g.lineTo(19, -21.8 + bob); g.lineTo(7, -16.6 + bob);
          g.closePath(); g.fill();
          g.fillStyle = S_PAGE_T4;
          g.beginPath();
          g.moveTo(7, -11.4 + bob); g.lineTo(-4.6, -15.2 + bob); g.lineTo(-3.9, -20.8 + bob); g.lineTo(7, -16.9 + bob);
          g.closePath(); g.fill();
          g.beginPath();
          g.moveTo(7, -11.4 + bob); g.lineTo(18.6, -15.2 + bob); g.lineTo(17.9, -20.8 + bob); g.lineTo(7, -16.9 + bob);
          g.closePath(); g.fill();
          g.strokeStyle = S_RULE; g.lineWidth = 0.5;
          g.beginPath();
          g.moveTo(-3.4, -16.6 + bob); g.lineTo(4.4, -13.9 + bob);
          g.moveTo(-3.2, -19 + bob); g.lineTo(4.6, -16.3 + bob);
          g.moveTo(17.4, -16.6 + bob); g.lineTo(9.6, -13.9 + bob);
          g.moveTo(17.2, -19 + bob); g.lineTo(9.4, -16.3 + bob);
          g.stroke();
          g.strokeStyle = S_CHAIN; g.lineWidth = 1.3;
          g.beginPath(); g.moveTo(2, -10.6 + bob); g.quadraticCurveTo(3.4, -6, 4, -1.6); g.stroke();
          g.fillStyle = S_BRASS; g.beginPath(); g.roundRect(3.2, -3.4, 3, 3.4, 0.8); g.fill();
          g.strokeStyle = B.dk; g.lineWidth = 0.9;
          g.beginPath(); g.arc(4.7, -3.6, 1.2, 3.3, 6.1); g.stroke();
          g.fillStyle = S_TENDRIL;
          g.beginPath();
          flameFan(g, SONYA_TENDRILS, 0, bob, t, 9, 1);
          g.fill();
          g.fillStyle = S_ARCANE;
          g.beginPath();
          flameFan(g, SONYA_TENDRILS, 0, bob, t, 9, 0.65);
          g.moveTo(5.6, -16.4 + bob); g.lineTo(8.4, -16.4 + bob); g.lineTo(7, -11.2 + bob); // gutter glow
          g.fill();
          g.strokeStyle = S_CORE; g.lineWidth = 1;
          g.beginPath(); g.moveTo(7, -16.2 + bob); g.lineTo(7, -10.6 + bob); g.stroke();
          g.fillStyle = S_CORE;
          for (let i = 0; i < SONYA_MOTES.length; i += 4) { // drifting page scraps
            const cyc = (t * 0.45 + SONYA_MOTES[i + 2]) % 1;
            const r = SONYA_MOTES[i + 3];
            g.globalAlpha = (1 - cyc) * 0.8;
            g.fillRect(SONYA_MOTES[i] + Math.sin(cyc * 6.28) * 1.8, SONYA_MOTES[i + 1] - cyc * 8 + bob, r * 1.6, r * 1.1);
          }
          g.globalAlpha = 1;
          if (w.isPlayer) { // the one shadowBlur pass
            g.shadowColor = S_ARCANE; g.shadowBlur = 8;
            g.strokeStyle = S_CORE; g.lineWidth = 1;
            g.beginPath(); g.moveTo(7, -16.2 + bob); g.lineTo(7, -10.6 + bob); g.stroke();
            g.shadowBlur = 0;
          }
          break;
        }
      }
      g.restore();
    },
  };

  // =========================== JORDAN — THE FEET ============================
  // Every tier dresses BOTH feet, so the stance reads armed and the kick pose
  // carries the dressing for free. All coords are foot-relative.
  function jordanTape(g, fx, fy, R) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 4.6, fy - 9.8, 9.2, 4.6, 1.6); g.fill();
    g.fillStyle = O_TAPE; g.beginPath(); g.roundRect(fx - 4, fy - 9.2, 8, 3.4, 1.3); g.fill();
    g.fillStyle = R.lt; g.fillRect(fx - 4, fy - 9.2, 8, 1);
    g.strokeStyle = R.dk; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(fx - 3.4, fy - 7.6); g.lineTo(fx + 3.4, fy - 7.6); g.stroke();
  }
  function jordanWrap(g, fx, fy, R) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5, fy - 13.4, 10, 8, 2); g.fill();
    g.fillStyle = O_WRAP; g.beginPath(); g.roundRect(fx - 4.4, fy - 12.8, 8.8, 6.8, 1.7); g.fill();
    g.strokeStyle = R.dk; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(fx - 3.8, fy - 10.6); g.lineTo(fx + 3.8, fy - 10.6);
    g.moveTo(fx - 3.8, fy - 8.4); g.lineTo(fx + 3.8, fy - 8.4);
    g.stroke();
    g.fillStyle = R.dk; g.beginPath(); g.arc(fx - 4.2, fy - 2.6, 2.2, 1.2, 4.6); g.fill();
    g.fillStyle = R.hi; g.beginPath(); g.arc(fx + 2.8, fy - 12, 0.9, 0, 7); g.fill();
  }
  function jordanStraps(g, fx, fy, R, B) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5.4, fy - 13.8, 10.8, 8.6, 2); g.fill();
    g.fillStyle = O_LEATHER; g.beginPath(); g.roundRect(fx - 4.8, fy - 13.2, 9.6, 7.4, 1.7); g.fill();
    g.fillStyle = O_ORANGE; // camera-strap diagonals
    g.beginPath();
    g.moveTo(fx - 4.8, fy - 8.2); g.lineTo(fx + 4.8, fy - 11.4); g.lineTo(fx + 4.8, fy - 9.8); g.lineTo(fx - 4.8, fy - 6.6);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(fx - 4.8, fy - 11.6); g.lineTo(fx + 4.8, fy - 13.2); g.lineTo(fx + 4.8, fy - 11.6); g.lineTo(fx - 4.8, fy - 10);
    g.closePath(); g.fill();
    g.fillStyle = O_BRASS; g.beginPath(); g.roundRect(fx + 2.6, fy - 7, 2.6, 2.2, 0.6); g.fill();
    g.strokeStyle = B.dk; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(fx + 3.9, fy - 6.6); g.lineTo(fx + 3.9, fy - 5.2); g.stroke();
    g.fillStyle = R.lt; g.fillRect(fx - 4.8, fy - 13.2, 9.6, 1.4);
  }
  function jordanHitop(g, fx, fy, R, t, ph) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5.8, fy - 14.2, 11.6, 9, 2.2); g.fill();
    g.fillStyle = O_TRAINER; g.beginPath(); g.roundRect(fx - 5.2, fy - 13.6, 10.4, 7.8, 1.9); g.fill();
    g.fillStyle = R.lt; g.fillRect(fx - 5.2, fy - 13.6, 10.4, 1.5);
    g.fillStyle = R.dk; // winged heel tab
    g.beginPath(); g.moveTo(fx - 5.8, fy - 12); g.lineTo(fx - 9.2, fy - 13.6); g.lineTo(fx - 5.8, fy - 9.4); g.closePath(); g.fill();
    g.strokeStyle = R.dk; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(fx - 2, fy - 12.6); g.lineTo(fx + 2, fy - 9.8);
    g.moveTo(fx + 2, fy - 12.6); g.lineTo(fx - 2, fy - 9.8);
    g.stroke();
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7 + ph);
    g.fillStyle = WHITE; g.fillRect(fx - 4.6, fy - 1.6, 10, 1.6);
    g.strokeStyle = WHITE; g.lineWidth = 1.1;
    g.beginPath(); g.arc(fx, fy - 9.4, 4.2, -0.6, 3.7); g.stroke();
    g.globalAlpha = 1;
  }
  function jordanLegend(g, fx, fy, R) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 6.2, fy - 14.6, 12.4, 9.4, 2.4); g.fill();
    g.fillStyle = O_SHOE; g.beginPath(); g.roundRect(fx - 5.6, fy - 14, 11.2, 8.2, 2); g.fill();
    g.strokeStyle = O_GOLD; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(fx - 4.6, fy - 8.8); g.quadraticCurveTo(fx - 0.5, fy - 10.8, fx + 4.6, fy - 12.6); g.stroke();
    g.fillStyle = O_GOLD;
    g.beginPath(); g.moveTo(fx - 6.2, fy - 12.4); g.lineTo(fx - 10.4, fy - 14.4); g.lineTo(fx - 6.2, fy - 9); g.closePath(); g.fill();
    g.fillStyle = R.lt; g.fillRect(fx - 5.6, fy - 14, 11.2, 1.4);
  }

  W.jordan = {
    under: function (g, w) {
      const fx = w.ffx, fy = w.ffy, bx = w.bfx, by = w.bfy, t = w.animT;
      const ext = w.attackExt || 0, kicking = w.attackKey === 'kick';
      g.lineCap = 'round'; g.lineJoin = 'round';
      switch (w.tier) {
        case 1: { // FRONT KICK — taped ankles, zero light
          const R = w.ramp(O_TAPE);
          jordanTape(g, fx, fy, R);
          jordanTape(g, bx, by, R);
          break;
        }
        case 2: { // ROUNDHOUSE — the dressing climbs the shin
          const R = w.ramp(O_WRAP);
          jordanWrap(g, fx, fy, R);
          jordanWrap(g, bx, by, R);
          break;
        }
        case 3: { // SPINNING BACK KICK — orange camera straps + brass buckle
          const R = w.ramp(O_LEATHER), B = w.ramp(O_BRASS);
          jordanStraps(g, fx, fy, R, B);
          jordanStraps(g, bx, by, R, B);
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = WHITE;
          star4(g, fx - 3.8, fy - 3, 1.3);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // FLYING SCISSOR KICK — LED soles are the first light
          const R = w.ramp(O_TRAINER);
          jordanHitop(g, fx, fy, R, t, 0);
          jordanHitop(g, bx, by, R, t, 1.6);
          if (kicking && ext > 0.2) { // motion streak behind the kicking foot
            g.globalAlpha = 0.5;
            g.strokeStyle = WHITE; g.lineWidth = 2.4;
            g.beginPath();
            g.moveTo(fx - 24 * ext, fy - 2);
            g.quadraticCurveTo(fx - 10 * ext, fy - 8 * ext, fx - 2, fy - 4);
            g.stroke();
            g.globalAlpha = 1;
          }
          break;
        }
        case 5: { // THE 720 NO-LOOK — legend sneakers inside a camera-flash wreath
          const R = w.ramp(O_SHOE);
          jordanLegend(g, fx, fy, R);
          jordanLegend(g, bx, by, R);
          g.fillStyle = O_PETAL; // wreath rides the front foot; the pair is one weapon
          g.beginPath();
          flameFan(g, JORDAN_PETALS, fx, fy, t, 10, 1);
          g.fill();
          g.fillStyle = O_MID;
          g.beginPath();
          flameFan(g, JORDAN_PETALS, fx, fy, t, 10, 0.6);
          g.fill();
          g.strokeStyle = WHITE; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(fx - 4.6, fy - 1); g.lineTo(fx + 5, fy - 1); g.stroke();
          g.fillStyle = WHITE;
          for (let i = 0; i < JORDAN_FLARES.length; i += 4) { // lens-flare sparks
            const cyc = (t * 0.55 + JORDAN_FLARES[i + 2]) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(fx + JORDAN_FLARES[i] + Math.sin(cyc * 6.28) * 1.5, fy + JORDAN_FLARES[i + 1] - cyc * 8, JORDAN_FLARES[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          if (w.isPlayer) { // the one radial gradient
            const hg = g.createRadialGradient(fx, fy - 4, 3, fx, fy - 4, 15);
            hg.addColorStop(0, O_HALO_0); hg.addColorStop(0.55, O_HALO_1); hg.addColorStop(1, CLEAR);
            g.fillStyle = hg;
            g.beginPath(); g.arc(fx, fy - 4, 15, 0, 7); g.fill();
          }
          if (w.isPlayer && kicking && ext > 0.5) { // the one shadowBlur pass
            g.shadowColor = WHITE; g.shadowBlur = 8;
            g.strokeStyle = WHITE; g.lineWidth = 1.2;
            g.beginPath(); g.moveTo(fx - 4.6, fy - 1); g.lineTo(fx + 5, fy - 1); g.stroke();
            g.shadowBlur = 0;
          }
          break;
        }
      }
    },
  };

  // =========================== JEROD — THE PRINTS ===========================
  // Layer striations stay visible at every tier; the grip stays inside x -6.5..0
  // so the mitt (drawn after this 'under' pass) covers it.
  W.jerod = {
    under: function (g, w) {
      const t = w.animT;
      g.save();
      g.translate(w.hx, w.hy);
      g.rotate(-0.55 + (w.attackKey ? (w.attackExt || 0) * 1.1 : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      switch (w.tier) {
        case 1: { // PLA SHIV — chalky draft filament, stringing hairs and duct tape
          const R = w.ramp(J_PLA);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0, -2.6); g.lineTo(9, -2.2); g.lineTo(12, 0); g.lineTo(9, 2.2); g.lineTo(0, 2.6);
          g.closePath(); g.fill();
          g.fillStyle = J_PLA;
          g.beginPath();
          g.moveTo(0.8, -1.9); g.lineTo(8.8, -1.6); g.lineTo(11, 0); g.lineTo(8.8, 1.6); g.lineTo(0.8, 1.9);
          g.closePath(); g.fill();
          g.strokeStyle = R.lt; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(1.4, -1); g.lineTo(9.6, -0.8); g.stroke();
          g.strokeStyle = R.dk; g.lineWidth = 0.5;
          g.beginPath();
          g.moveTo(5, -2.2); g.quadraticCurveTo(6.6, -4.2, 4.4, -4.8);
          g.moveTo(8, 2); g.quadraticCurveTo(9.8, 3.6, 7.6, 4.4);
          g.stroke();
          g.fillStyle = J_TAPE; g.fillRect(-1.6, -3, 2.4, 6);
          break;
        }
        case 2: { // ABS SHORT SWORD — glossy saturated plastic + printed crossguard
          const R = w.ramp(J_ABS);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0, -2.9); g.lineTo(13.6, -2.5); g.lineTo(17, 0); g.lineTo(13.6, 2.5); g.lineTo(0, 2.9);
          g.closePath(); g.fill();
          g.fillStyle = J_ABS;
          g.beginPath();
          g.moveTo(0.8, -2.2); g.lineTo(13.4, -1.8); g.lineTo(16, 0); g.lineTo(13.4, 1.8); g.lineTo(0.8, 2.2);
          g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 0.7;
          g.beginPath();
          g.moveTo(1, -0.9); g.lineTo(13.4, -0.9);
          g.moveTo(1, 0.9); g.lineTo(13.4, 0.9);
          g.stroke();
          g.fillStyle = R.dk; g.beginPath(); g.roundRect(-0.8, -4.6, 2.6, 9.2, 1); g.fill();
          g.strokeStyle = R.lt; g.lineWidth = 1;
          g.beginPath(); g.moveTo(1.4, -1.5); g.lineTo(13.8, -1.3); g.stroke();
          g.fillStyle = R.hi; g.beginPath(); g.arc(12.6, -1.6, 0.8, 0, 7); g.fill();
          g.fillStyle = J_GRIP2; g.fillRect(-2.6, -2.1, 2, 4.2);
          break;
        }
        case 3: { // CARBON-FIBER KATANA — cross-weave, gold wrap, brass tsuba
          const R = w.ramp(J_CARBON), B = w.ramp(J_BRASS);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0, -2.4); g.lineTo(19, -3.4); g.lineTo(24, -1.2); g.lineTo(19, 0.8); g.lineTo(0, 1.6);
          g.closePath(); g.fill();
          g.fillStyle = J_CARBON;
          g.beginPath();
          g.moveTo(0.8, -1.8); g.lineTo(18.8, -2.7); g.lineTo(22.9, -1.2); g.lineTo(18.8, 0.2); g.lineTo(0.8, 1);
          g.closePath(); g.fill();
          g.strokeStyle = R.dk; g.lineWidth = 0.5;
          g.beginPath();
          g.moveTo(4, -1.6); g.lineTo(6, 0.4);
          g.moveTo(9, -2); g.lineTo(11, 0.2);
          g.moveTo(14, -2.4); g.lineTo(16, -0.2);
          g.stroke();
          g.strokeStyle = R.lt; g.lineWidth = 0.5;
          g.beginPath();
          g.moveTo(6.6, 0.6); g.lineTo(8.4, -1.6);
          g.moveTo(11.6, 0.4); g.lineTo(13.4, -1.9);
          g.stroke();
          g.strokeStyle = J_TITAN; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(1, -2.1); g.lineTo(19.4, -3); g.stroke();
          g.fillStyle = B.out; g.beginPath(); g.arc(0, -0.4, 3.1, 0, 6.28); g.fill();
          g.fillStyle = J_BRASS; g.beginPath(); g.arc(0, -0.4, 2.4, 0, 6.28); g.fill();
          g.fillStyle = J_GRIP; g.fillRect(-6.4, -1.7, 6, 3.4);
          g.fillStyle = J_ABS; // gold wrap crossings, one path
          g.beginPath();
          g.moveTo(-6.2, 0); g.lineTo(-5.2, -1.4); g.lineTo(-4.2, 0); g.lineTo(-5.2, 1.4);
          g.moveTo(-4.4, 0); g.lineTo(-3.4, -1.4); g.lineTo(-2.4, 0); g.lineTo(-3.4, 1.4);
          g.moveTo(-2.6, 0); g.lineTo(-1.6, -1.4); g.lineTo(-0.6, 0); g.lineTo(-1.6, 1.4);
          g.fill();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
          g.fillStyle = WHITE;
          star4(g, 22, -1.8, 1.3);
          g.globalAlpha = 1;
          break;
        }
        case 4: { // TITANIUM-INFILL GREATBLADE — a glowing honeycomb window
          const R = w.ramp(J_TITAN);
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0, -4.2); g.lineTo(23, -4.8); g.lineTo(30, 0); g.lineTo(23, 4); g.lineTo(0, 3.4);
          g.closePath(); g.fill();
          g.fillStyle = J_TITAN;
          g.beginPath();
          g.moveTo(0.8, -3.5); g.lineTo(22.8, -4); g.lineTo(28.8, 0); g.lineTo(22.8, 3.2); g.lineTo(0.8, 2.7);
          g.closePath(); g.fill();
          g.fillStyle = R.dk;
          g.beginPath();
          g.moveTo(0.8, 0.6); g.lineTo(22.8, 0.4); g.lineTo(28.8, 0); g.lineTo(22.8, 3.2); g.lineTo(0.8, 2.7);
          g.closePath(); g.fill();
          g.fillStyle = R.lt; g.fillRect(0.8, -3.5, 22, 1.4);
          g.fillStyle = R.dk;
          g.beginPath(); g.arc(5, -3.2, 0.7, 0, 7); g.fill();
          g.beginPath(); g.arc(12, -3.5, 0.7, 0, 7); g.fill();
          g.beginPath(); g.arc(19, -3.8, 0.7, 0, 7); g.fill();
          g.beginPath(); g.roundRect(-0.6, -5.4, 2.8, 10.4, 1); g.fill();
          g.fillStyle = J_GRIP; g.fillRect(-3.4, -2.4, 3.2, 4.8);
          g.strokeStyle = R.dk; g.lineWidth = 0.8;
          g.beginPath(); g.roundRect(7, -1.9, 10, 3.4, 0.8); g.stroke();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
          g.fillStyle = J_PLASMA_DIM; g.fillRect(7.4, -1.5, 9.2, 2.6);
          g.strokeStyle = J_PLASMA; g.lineWidth = 0.7;
          g.beginPath();
          g.moveTo(8, 0.6); g.lineTo(9, -0.9); g.lineTo(10, 0.6);
          g.moveTo(11, 0.6); g.lineTo(12, -0.9); g.lineTo(13, 0.6);
          g.moveTo(14, 0.6); g.lineTo(15, -0.9); g.lineTo(16, 0.6);
          g.stroke();
          g.strokeStyle = J_PLASMA_DIM; g.lineWidth = 1;
          g.beginPath(); g.moveTo(23.4, -3.6); g.lineTo(29, 0); g.lineTo(23.4, 3); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        case 5: { // THE MASTERPRINT — pearl blade, plasma sheet, nozzle pommel
          const R = w.ramp(J_PRINT), G = w.ramp(J_GOLD);
          const s1 = Math.sin(t * 11) * 1.4, s2 = Math.sin(t * 11 + 2.1) * 1.6, s3 = Math.sin(t * 11 + 4.2) * 1.2;
          if (w.isPlayer) { // the one radial gradient
            const hg = g.createRadialGradient(19, -1, 4, 19, -1, 20);
            hg.addColorStop(0, J_HALO_0); hg.addColorStop(0.55, J_HALO_1); hg.addColorStop(1, CLEAR);
            g.fillStyle = hg;
            g.beginPath(); g.arc(19, -1, 20, 0, 7); g.fill();
          }
          g.fillStyle = R.out;
          g.beginPath();
          g.moveTo(0, -3.6); g.lineTo(29, -4.4); g.lineTo(38, 0); g.lineTo(29, 3.2); g.lineTo(0, 2.8);
          g.closePath(); g.fill();
          g.fillStyle = J_PRINT;
          g.beginPath();
          g.moveTo(0.8, -2.9); g.lineTo(28.8, -3.6); g.lineTo(36.8, 0); g.lineTo(28.8, 2.5); g.lineTo(0.8, 2.2);
          g.closePath(); g.fill();
          g.strokeStyle = J_STRIA; g.lineWidth = 0.5; // 0% warp: dead-straight layer lines
          g.beginPath();
          g.moveTo(1.5, -1.2); g.lineTo(29, -1.2);
          g.moveTo(1.5, 0.8); g.lineTo(29, 0.8);
          g.stroke();
          g.fillStyle = R.lt; g.fillRect(0.8, -2.9, 28, 1.2);
          g.fillStyle = G.out;
          g.beginPath();
          g.moveTo(-1, -6.4); g.lineTo(2.6, -4); g.lineTo(2.6, 4); g.lineTo(-1, 6.4); g.lineTo(0.4, 0);
          g.closePath(); g.fill();
          g.fillStyle = J_GOLD;
          g.beginPath();
          g.moveTo(-0.4, -5.4); g.lineTo(2, -3.4); g.lineTo(2, 3.4); g.lineTo(-0.4, 5.4); g.lineTo(0.8, 0);
          g.closePath(); g.fill();
          g.fillStyle = J_NOZZLE; // the maker's mark
          g.beginPath(); g.moveTo(-4.6, 1.4); g.lineTo(-4.6, -1.4); g.lineTo(-7, 0); g.closePath(); g.fill();
          g.fillStyle = J_TAPE; g.fillRect(-4.6, -1.9, 1.6, 3.8);
          g.fillStyle = J_GRIP; g.fillRect(-3, -2.2, 2.8, 4.4);
          g.fillStyle = J_SHEET; // plasma sheet hugging both edges
          g.beginPath();
          g.moveTo(1.5, -3.4); g.lineTo(8, -4.6); g.lineTo(12, -6.5 + s1); g.lineTo(16.5, -4.8);
          g.lineTo(21, -7.5 + s2); g.lineTo(25.5, -4.6); g.lineTo(30, -5.5 + s3); g.lineTo(35.5, -1);
          g.lineTo(30, 3.2); g.lineTo(20, 4.6); g.lineTo(8, 3.8);
          g.closePath(); g.fill();
          g.fillStyle = J_PLASMA;
          g.beginPath();
          g.moveTo(2.5, -3); g.lineTo(8, -4); g.lineTo(12, -5.8 + s1 * 0.6); g.lineTo(16.5, -4.2);
          g.lineTo(21, -6.4 + s2 * 0.6); g.lineTo(25.5, -4); g.lineTo(30, -5.1 + s3 * 0.6); g.lineTo(34, -0.8);
          g.lineTo(29.5, 2.6); g.lineTo(20, 3.8); g.lineTo(8, 3.2);
          g.closePath(); g.fill();
          g.strokeStyle = J_CORE; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(2, -0.4); g.lineTo(36, -0.4); g.stroke();
          g.fillStyle = J_CORE;
          for (let i = 0; i < JEROD_SPARKS.length; i += 4) {
            const cyc = (t * 0.6 + JEROD_SPARKS[i + 2]) % 1;
            g.globalAlpha = (1 - cyc) * 0.8;
            g.beginPath();
            g.arc(JEROD_SPARKS[i] + Math.sin(cyc * 6.28) * 1.4, JEROD_SPARKS[i + 1] - cyc * 8, JEROD_SPARKS[i + 3], 0, 7);
            g.fill();
          }
          g.globalAlpha = 1;
          if (w.isPlayer) { // the one shadowBlur pass
            g.shadowColor = J_PLASMA; g.shadowBlur = 9;
            g.strokeStyle = J_CORE; g.lineWidth = 1.2;
            g.beginPath(); g.moveTo(2, -0.4); g.lineTo(36, -0.4); g.stroke();
            g.shadowBlur = 0;
          }
          break;
        }
      }
      g.restore();
    },
  };
})();
