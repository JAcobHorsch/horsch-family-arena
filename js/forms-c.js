// forms-c.js — final-form bodies, batch C: FIRETRUCK, RYAN DUGAN, 8 HOURS OF
// SLEEP MYAH and WALKING ISLA. Contract: FC.<charId>(g, a) draws ONLY the body
// in local feet-space — the caller owns the transform, ground shadow, ascended
// aura and the flash/frozen overlays. Every palette and mote table is hoisted;
// nothing in a draw body allocates, concatenates a string, or builds an array.
(function () {
  const FC = (window.FORM_BODIES = window.FORM_BODIES || {});
  const PI = Math.PI;

  // ---- shared face/limb constants (same numbers drawFighter uses) ----
  const HEAD_SHADE = 'rgba(20,16,26,0.16)';
  const HEAD_RIM = 'rgba(255,246,221,0.4)';
  const WHITE = '#ffffff';
  const BLUSH = 'rgba(255,122,122,0.35)';

  // firetruck
  const FT_RED = '#c9342a', FT_DEEP = '#8a1f1a', FT_VIS = '#f2ee4a';
  const FT_STEEL = '#d8dce8', FT_GLASS = '#9fdcff', FT_WATER = '#4ab2e8';
  const FT_TIRE = '#101014', FT_CAB = '#d43b2f', FT_DOOR = '#a8261e';
  const FT_PANEL = '#8a92a8', FT_INTAKE = '#232838', FT_HOSE = '#e8d9b0';
  const FT_GAUGE = '#e8fbff', FT_NEEDLE = '#d43b2f', FT_BARREL = '#556070';
  const FT_SPOKE = '#3a3f4a', FT_FLAP = '#1d1d24', FT_BAR = '#2a2e38';
  const FT_LAMPR = '#ff4a3a', FT_LAMPB = '#4a86e8', FT_SHIELD = '#ffd24a';
  const FT_LIT = 'rgba(255,255,255,0.7)', FT_GLINT = 'rgba(255,255,255,0.6)';
  const FT_PUFF = 'rgba(200,205,215,0.35)';
  const MIST_MOTES = [0, 0, 0, 1.6, -1.2, 0.34, -1.4, 1, 0.67]; // dx, dy, phase

  // ryan dugan
  const RD_SUIT = '#5c2a72', RD_SLACK = '#3a2444', RD_TAG = '#f2ede0';
  const RD_RED = '#d43b2f', RD_E = '#c24ae8', RD_CORE = '#f0d6ff';
  const RD_INK = '#2a2a35', RD_HAIR = '#2a2230';
  const SPEC_ORBIT = [0, 2.09, 4.19]; // three aliases, fixed phases

  // 8 hours of sleep myah
  const MY_GOLD = '#ffd24a', MY_GLOW = '#fff2b8', MY_PINK = '#e84ad0';
  const MY_PLUM = '#8a3a78', MY_MASK = '#ffd6e8', MY_CORE = '#fff6dd';
  const MY_HAIR = '#4a2c1e', MY_STRAP = '#c98da8';
  const MY_CHROME = '#c9ccd8', MY_CHASSIS = '#f6f2e8', MY_LED = '#4adbe8';
  const CHK_MOTES = [-20, -40, 0, 22, -55, 0.4, -14, -70, 0.75]; // dx, dy, phase

  // walking isla
  const IS_PINK = '#f2a3c2', IS_CREAM = '#f6f2e8', IS_WHITE = '#ffffff';
  const IS_MILK = '#f4f0e6', IS_CURL = '#b87a3a', IS_PACI = '#4ab2e8';
  const IS_PACI2 = '#2f7bd4', IS_RIBBON = '#d43b2f', IS_PIN = '#c9ccd8';
  const MILK_MOTES = [0, 0.37, 0.71];
  const BICEP_STARS = [0, 1.6];

  // ---- module-scope helpers (plain fns: zero per-frame closure allocs) ----
  // chibi skull with drawFighter's shade crescent, sun rim and optional ear
  function headSkull(g, a, hx, hy, ear) {
    const R = a.ramp(a.skin);
    g.fillStyle = a.skin;
    g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
    g.strokeStyle = R.out; g.lineWidth = 2; g.stroke();
    g.save();
    g.beginPath(); g.arc(hx, hy, 8.6, 0, 7); g.clip();
    g.fillStyle = HEAD_SHADE; g.fillRect(hx - 10, hy - 10, 5.5, 20);
    g.strokeStyle = HEAD_RIM; g.lineWidth = 2.2;
    g.beginPath(); g.arc(hx - 0.5, hy - 1, 6.9, PI * 1.02, PI * 1.62); g.stroke();
    g.restore();
    if (ear) {
      g.fillStyle = a.skin;
      g.beginPath(); g.arc(hx - 8.1, hy + 1, 2.3, 0, 7); g.fill();
      g.strokeStyle = R.out; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = R.dk;
      g.beginPath(); g.arc(hx - 8.1, hy + 1.2, 1, 0, 7); g.fill();
    }
  }

  // drawFighter's eyes verbatim so every form blinks with the roster
  function faceEyes(g, a, hx, hy, blush) {
    const ex1 = hx + 2, ex2 = hx + 6.2, ey = hy - 1.5;
    const INK = a.INK;
    if (blush) {
      g.fillStyle = BLUSH;
      g.beginPath(); g.ellipse(hx + 0.6, hy + 2.2, 1.7, 1.05, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(hx + 6.8, hy + 2, 1.7, 1.05, 0, 0, 7); g.fill();
    }
    if (a.hurt) {
      g.strokeStyle = INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.6, ey - 1.6); g.lineTo(ex1 + 1.6, ey + 1.6);
      g.moveTo(ex1 + 1.6, ey - 1.6); g.lineTo(ex1 - 1.6, ey + 1.6);
      g.moveTo(ex2 - 1.6, ey - 1.6); g.lineTo(ex2 + 1.6, ey + 1.6);
      g.moveTo(ex2 + 1.6, ey - 1.6); g.lineTo(ex2 - 1.6, ey + 1.6);
      g.stroke();
      return;
    }
    if (Math.sin(a.animT * 1.3 + ex1) > 0.985) { // blink
      g.strokeStyle = INK; g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.5, ey); g.lineTo(ex1 + 1.5, ey);
      g.moveTo(ex2 - 1.5, ey); g.lineTo(ex2 + 1.5, ey);
      g.stroke();
      return;
    }
    g.fillStyle = WHITE;
    g.beginPath(); g.ellipse(ex1, ey, 1.9, 2.35, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(ex2, ey, 1.9, 2.35, 0, 0, 7); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.arc(ex1 + 0.75, ey + 0.15, 1.05, 0, 7); g.fill();
    g.beginPath(); g.arc(ex2 + 0.75, ey + 0.15, 1.05, 0, 7); g.fill();
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(ex1 + 0.35, ey - 0.75, 0.45, 0, 7); g.fill();
    g.beginPath(); g.arc(ex2 + 0.35, ey - 0.75, 0.45, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(ex1 - 1.9, ey - 2); g.lineTo(ex1 + 1.9, ey - 2.3);
    g.moveTo(ex2 - 1.9, ey - 2); g.lineTo(ex2 + 1.9, ey - 2.3);
    g.stroke();
    if (a.attackKey) {
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(ex1 - 2, ey - 4); g.lineTo(ex1 + 1.5, ey - 2.6);
      g.moveTo(ex2 + 2.5, ey - 4.2); g.lineTo(ex2 - 1, ey - 2.6);
      g.stroke();
    } else {
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex1 - 1.8, ey - 4.1); g.lineTo(ex1 + 1.5, ey - 4.3);
      g.moveTo(ex2 - 1.5, ey - 4.3); g.lineTo(ex2 + 1.8, ey - 4.1);
      g.stroke();
    }
  }

  function mitt(g, col, R, x, y, r) {
    g.fillStyle = R.out; g.beginPath(); g.arc(x, y, r + 1.1, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = R.lt; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.52, 0, 7); g.fill();
    g.fillStyle = R.dk; g.beginPath(); g.arc(x + r * 0.55, y + r * 0.28, r * 0.32, 0, 7); g.fill();
  }

  function shoe(g, col, R, fx, fy) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5.4, fy - 6.4, 12.2, 7.6, 3); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(fx - 4.6, fy - 5.7, 10.6, 6.2, 2.6); g.fill();
    g.fillStyle = R.lt; g.fillRect(fx - 4.6, fy - 1.1, 10.6, 1.6);
    g.fillStyle = R.hi; g.beginPath(); g.arc(fx + 3.6, fy - 4.2, 1.1, 0, 7); g.fill();
  }

  // 4-point star as an 8-vertex diamond (the engine's sparkle shape)
  function star4(g, x, y, r) {
    const i = r * 0.27;
    g.beginPath();
    g.moveTo(x - r, y); g.lineTo(x - i, y - i); g.lineTo(x, y - r); g.lineTo(x + i, y - i);
    g.lineTo(x + r, y); g.lineTo(x + i, y + i); g.lineTo(x, y + r); g.lineTo(x - i, y + i);
    g.closePath(); g.fill();
  }

  // ================================ FIRETRUCK ================================
  // A whole aerial apparatus — no hands, so no weapon: the ladder IS the punch.
  FC.tim = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey;
    const STE = a.ramp(FT_STEEL), RED = a.ramp(FT_RED), CAB = a.ramp(FT_CAB);
    const PAN = a.ramp(FT_PANEL);
    const atk = !!ak && ak !== 'B';
    // suspension bounce, plus the cab dipping into a ladder ram
    const dy = (a.moving ? -Math.abs(Math.sin(w)) * 1.2 : 0) + (atk ? 1.5 * ext : 0);

    // 1 aerial ladder, behind the body and unsprung (pivot -16,-52)
    const lift = ak === 'B' ? 0.15 + ext * 0.55 : 0.15;
    const L = 34 + (atk ? ext * 30 : 0);
    const cl = Math.cos(lift), sl = Math.sin(lift);
    const ex = -16 + cl * L, ey = -52 - sl * L;
    const rpx = sl * 2.6, rpy = cl * 2.6; // rail offset, perpendicular to the boom
    g.strokeStyle = STE.out; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-16 - rpx, -52 - rpy); g.lineTo(ex - rpx, ey - rpy);
    g.moveTo(-16 + rpx, -52 + rpy); g.lineTo(ex + rpx, ey + rpy);
    g.stroke();
    g.strokeStyle = FT_STEEL; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-16 - rpx, -52 - rpy); g.lineTo(ex - rpx, ey - rpy);
    g.moveTo(-16 + rpx, -52 + rpy); g.lineTo(ex + rpx, ey + rpy);
    g.stroke();
    g.lineWidth = 1.6;
    g.beginPath();
    for (let r = 0.12; r < 1; r += 0.14) { // rungs
      const rx = -16 + cl * L * r, ry = -52 - sl * L * r;
      g.moveTo(rx - rpx, ry - rpy); g.lineTo(rx + rpx, ry + rpy);
    }
    g.stroke();
    g.fillStyle = FT_DEEP; g.beginPath(); g.roundRect(ex - 2.5, ey - 2, 5, 4, 1); g.fill();

    g.save(); g.translate(0, dy);
    // 2 rear box + hi-vis belt and rear chevrons
    g.fillStyle = RED.out; g.beginPath(); g.roundRect(-31, -50, 44, 34, 4); g.fill();
    g.fillStyle = FT_RED; g.beginPath(); g.roundRect(-30, -49, 42, 32, 3.4); g.fill();
    g.strokeStyle = FT_DEEP; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-19, -48); g.lineTo(-19, -18);
    g.moveTo(-8, -48); g.lineTo(-8, -18);
    g.moveTo(3, -48); g.lineTo(3, -18);
    g.stroke();
    g.fillStyle = FT_DOOR; g.beginPath(); g.roundRect(-27, -46, 10, 24, 2); g.fill();
    g.strokeStyle = RED.lt; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-26, -39); g.lineTo(-18, -39);
    g.moveTo(-26, -33); g.lineTo(-18, -33);
    g.moveTo(-26, -27); g.lineTo(-18, -27);
    g.stroke();
    g.fillStyle = FT_VIS;
    g.fillRect(-30, -28, 42, 4);
    g.beginPath();
    g.moveTo(-30, -20); g.lineTo(-26, -20); g.lineTo(-30, -31); g.closePath();
    g.moveTo(-30, -33); g.lineTo(-26, -33); g.lineTo(-30, -44); g.closePath();
    g.fill();
    // 3 pump panel: two gauges, chrome-ringed intake
    g.fillStyle = FT_PANEL; g.beginPath(); g.roundRect(-16, -44, 12, 14, 2); g.fill();
    g.fillStyle = FT_GAUGE;
    g.beginPath(); g.arc(-13, -40, 1.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-8, -40, 1.8, 0, 7); g.fill();
    g.strokeStyle = FT_NEEDLE; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-13, -40); g.lineTo(-12.2, -41.4);
    g.moveTo(-8, -40); g.lineTo(-7.4, -41.5);
    g.stroke();
    g.fillStyle = FT_INTAKE; g.beginPath(); g.arc(-10, -34, 2.6, 0, 7); g.fill();
    g.strokeStyle = FT_STEEL; g.lineWidth = 1; g.stroke();
    // 4 hose reel
    g.fillStyle = FT_DEEP; g.beginPath(); g.arc(-24, -38, 4.5, 0, 7); g.fill();
    g.strokeStyle = FT_HOSE; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-24, -38, 3, 0, 7); g.stroke();
    g.beginPath(); g.arc(-24, -38, 1.8, 0, 7); g.stroke();
    // 5 cab: glass, door seam, chrome grille, bumper
    g.fillStyle = CAB.out; g.beginPath(); g.roundRect(13, -64, 19, 26, 3); g.fill();
    g.fillStyle = FT_CAB; g.beginPath(); g.roundRect(13.8, -63.2, 17.4, 24.4, 2.6); g.fill();
    g.fillStyle = FT_GLASS; g.beginPath(); g.roundRect(16, -61, 13, 9, 1.5); g.fill();
    g.strokeStyle = FT_GLINT; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(17.5, -53); g.lineTo(23, -60.5); g.stroke();
    g.strokeStyle = FT_DEEP; g.lineWidth = 1;
    g.beginPath(); g.moveTo(18, -52); g.lineTo(18, -40); g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(29, -50, 4, 10, 1); g.fill();
    g.strokeStyle = STE.dk; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(29.4, -47.5); g.lineTo(32.6, -47.5);
    g.moveTo(29.4, -45); g.lineTo(32.6, -45);
    g.moveTo(29.4, -42.5); g.lineTo(32.6, -42.5);
    g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(28, -42, 7, 5, 1.5); g.fill();
    // 6 light bar — 3Hz alternation, both lamps red on the hurt frames
    const flash = Math.floor(t * 6) % 2 === 0;
    g.fillStyle = FT_BAR; g.beginPath(); g.roundRect(15, -68, 14, 3.6, 1.5); g.fill();
    g.fillStyle = a.hurt || flash ? FT_LAMPR : FT_LAMPB;
    g.fillRect(16, -67.4, 4, 2.6);
    g.fillStyle = a.hurt || !flash ? FT_LAMPR : FT_LAMPB;
    g.fillRect(24, -67.4, 4, 2.6);
    g.fillStyle = FT_LIT;
    g.beginPath(); g.arc(flash ? 18 : 26, -66.1, 1.1, 0, 7); g.fill();
    // 7 deck gun, elevating on the launcher
    const bang = -0.35 - (ak === 'B' ? ext * 0.5 : 0);
    const nx = Math.cos(bang) * 13, ny = -52 + Math.sin(bang) * 13;
    g.fillStyle = PAN.out; g.beginPath(); g.arc(0, -52, 4.6, 0, 7); g.fill();
    g.fillStyle = FT_PANEL; g.beginPath(); g.arc(0, -52, 3.8, 0, 7); g.fill();
    g.strokeStyle = FT_BARREL; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(0, -52); g.lineTo(nx, ny); g.stroke();
    g.fillStyle = FT_STEEL; g.beginPath(); g.roundRect(nx - 1.5, ny - 2, 3, 4, 1); g.fill();
    // 8 unit shield (ink ticks, never text)
    g.fillStyle = FT_SHIELD; g.beginPath(); g.arc(-2, -38, 3.4, 0, 7); g.fill();
    g.strokeStyle = a.INK; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-3.4, -38.8); g.lineTo(-0.6, -38.8);
    g.moveTo(-3.4, -36.8); g.lineTo(-0.6, -36.8);
    g.stroke();
    g.restore();

    // 9 wheels — unsprung, dual rears, spokes turning with the gait
    g.fillStyle = FT_FLAP; g.fillRect(-30, -14, 6, 7);
    g.fillStyle = FT_TIRE;
    g.beginPath(); g.arc(-20, -9, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(-9, -9, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(20, -9, 9, 0, 7); g.fill();
    g.fillStyle = FT_PANEL;
    g.beginPath(); g.arc(-20, -9, 3.4, 0, 7); g.fill();
    g.beginPath(); g.arc(-9, -9, 3.4, 0, 7); g.fill();
    g.beginPath(); g.arc(20, -9, 3.4, 0, 7); g.fill();
    const sc = Math.cos(w) * 7, ss = Math.sin(w) * 7;
    g.strokeStyle = FT_SPOKE; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-20 - sc, -9 - ss); g.lineTo(-20 + sc, -9 + ss);
    g.moveTo(-9 - sc, -9 - ss); g.lineTo(-9 + sc, -9 + ss);
    g.moveTo(20 - sc, -9 - ss); g.lineTo(20 + sc, -9 + ss);
    g.stroke();

    g.save(); g.translate(0, dy);
    // 10 exhaust stack + one climbing puff (cycle doubles while rolling)
    g.fillStyle = FT_PANEL; g.beginPath(); g.roundRect(12, -72, 3, 8, 1.5); g.fill();
    const pc = (t * (a.moving ? 1.2 : 0.6)) % 1;
    g.globalAlpha = 1 - pc;
    g.fillStyle = FT_PUFF;
    g.beginPath(); g.arc(13.5, -74 - pc * 8, 1.5 + pc * 2, 0, 7); g.fill();
    // 11 deck-gun mist: droplets arc out and FALL (water is grav-true)
    g.fillStyle = FT_WATER;
    const msp = ak === 'B' ? 1.6 : 0.8;
    for (let i = 0; i < 9; i += 3) {
      const mc = (t * msp + MIST_MOTES[i + 2]) % 1;
      g.globalAlpha = (1 - mc) * 0.7;
      g.beginPath();
      g.arc(nx + MIST_MOTES[i] + mc * 8, ny + MIST_MOTES[i + 1] - 3 + mc * mc * 10, 1.2, 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
  };

  // =============================== RYAN DUGAN ===============================
  // three spectral eyeglasses wheel around him; the back half draws under him
  function specOrbit(g, a, front) {
    const t = a.animT, ext = a.attackExt, ak = a.attackKey;
    const R = 27 - (ak && ak !== 'B' ? 7 * ext : 0) + (ak === 'B' ? 10 * ext : 0);
    g.strokeStyle = RD_CORE; g.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const p = SPEC_ORBIT[i];
      const ang = t * 1.6 + p;
      const s = Math.sin(ang);
      if ((s >= 0) !== front) continue;
      const gx = Math.cos(ang) * R;
      let gy = -52 + s * 13;
      let al = 0.55 + 0.25 * Math.sin(t * 5 + p) + (front ? 0.1 : 0);
      if (a.hurt && i === 0) { gy += 3; al *= 0.5; } // an alias falters
      g.globalAlpha = al;
      g.beginPath(); g.arc(gx - 3.4, gy, 3, 0, 7); g.stroke();
      g.beginPath(); g.arc(gx + 3.4, gy, 3, 0, 7); g.stroke();
      g.beginPath();
      g.moveTo(gx - 0.6, gy); g.lineTo(gx + 0.6, gy);
      g.moveTo(gx + 6.2, gy); g.lineTo(gx + 8, gy - 1);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  FC.ronathon = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, ak = a.attackKey, lean = a.lean;
    const cf = a.crouch ? 0.6 : 1;
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const SUIT = a.ramp(RD_SUIT), SLK = a.ramp(RD_SLACK), TAG = a.ramp(RD_TAG);
    const HAIR = a.ramp(RD_HAIR), SK = a.ramp(a.skin);

    specOrbit(g, a, false); // 1 orbit, back half

    // 2 body: slacks, back arm, suit torso with the standard dk back-shade
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, RD_SLACK);
    shoe(g, RD_SLACK, SLK, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, SUIT.dk);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, RD_SUIT);
    g.strokeStyle = SUIT.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();

    // 3 blazer pauldrons
    for (let i = 0; i < 2; i++) {
      const cx = sx - 8 + i * 16;
      g.fillStyle = SUIT.out;
      g.beginPath(); g.arc(cx, sy - 1, 5.8, PI, 0); g.closePath(); g.fill();
      g.fillStyle = RD_SUIT;
      g.beginPath(); g.arc(cx, sy - 1, 4.9, PI, 0); g.closePath(); g.fill();
      g.strokeStyle = SUIT.lt; g.lineWidth = 1.1;
      g.beginPath(); g.arc(cx, sy - 1, 3.6, PI * 1.05, PI * 1.6); g.stroke();
    }

    // 4 magenta tie with a T4-rung energy edge
    g.fillStyle = RD_E;
    g.fillRect(-0.5, -64, 4, 3);
    g.beginPath();
    g.moveTo(1, -61); g.lineTo(4.4, -57); g.lineTo(1, -45); g.lineTo(-2.4, -57);
    g.closePath(); g.fill();
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
    g.strokeStyle = RD_CORE; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-2.4, -57); g.lineTo(1, -45); g.stroke();
    g.globalAlpha = 1;

    // 5 armor-scale HELLO-MY-NAME-IS plate (marks, never text)
    g.fillStyle = TAG.out; g.beginPath(); g.roundRect(-9.5, -60, 19, 14, 2.4); g.fill();
    g.fillStyle = RD_TAG; g.beginPath(); g.roundRect(-8.7, -59.2, 17.4, 12.4, 2); g.fill();
    g.fillStyle = RD_RED; g.fillRect(-8.7, -59.2, 17.4, 4);
    g.strokeStyle = WHITE; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-6.4, -57.2); g.lineTo(-1.4, -57.2);
    g.moveTo(0.6, -57.2); g.lineTo(5.6, -57.2);
    g.stroke();
    g.strokeStyle = a.INK; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-6, -52);
    g.quadraticCurveTo(-2, -54.5, 2, -52);
    g.quadraticCurveTo(4, -51, 6, -52.5);
    g.stroke();
    g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-5, -49); g.lineTo(5, -49); g.stroke();
    g.fillStyle = RD_E;
    g.beginPath(); g.arc(-7.8, -58.3, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(7.8, -58.3, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(-7.8, -47.7, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(7.8, -47.7, 0.8, 0, 7); g.fill();

    // 6 spare alias tag on the hip, for emergencies
    g.save(); g.translate(7, -38); g.rotate(0.3);
    g.fillStyle = RD_TAG; g.beginPath(); g.roundRect(-2.5, -1.7, 5, 3.4, 0.7); g.fill();
    g.fillStyle = RD_RED; g.fillRect(-2.5, -1.7, 5, 1.1);
    g.restore();

    // front leg
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, RD_SLACK);
    shoe(g, RD_SLACK, SLK, a.ffx, a.ffy);

    // 7 head: slicked hair with a hard side part
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    g.fillStyle = HAIR.out;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.9, PI, PI * 2); g.fill();
    g.fillStyle = RD_HAIR;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.2, PI * 1.02, PI * 1.98); g.fill();
    g.strokeStyle = HAIR.lt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hx - 2, hy - 9); g.lineTo(hx + 5, hy - 8); g.stroke();
    // 8 the glasses ARE the eyes — no separate face
    g.globalAlpha = ak && ak !== 'B' ? 1 : 0.65 + 0.35 * Math.sin(t * 6);
    g.fillStyle = RD_E;
    g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.fill();
    g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.fill();
    g.globalAlpha = 1;
    if (ak === 'B') { // the barrage visibly launches from the lenses
      g.globalAlpha = ext;
      g.fillStyle = WHITE;
      g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.fill();
      g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.fill();
      g.globalAlpha = 1;
    }
    g.strokeStyle = RD_INK; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(hx - 1.6, hy - 4.5, 4.4, 4, 1.2); g.stroke();
    g.beginPath(); g.roundRect(hx + 4, hy - 4.5, 4.4, 4, 1.2); g.stroke();
    g.beginPath();
    g.moveTo(hx + 2.8, hy - 2.6); g.lineTo(hx + 4, hy - 2.6); // bridge
    g.moveTo(hx - 1.6, hy - 3.4); g.lineTo(hx - 7.4, hy - 2.2); // temple
    g.stroke();
    g.fillStyle = RD_CORE;
    g.beginPath(); g.arc(hx - 0.5, hy - 3.6, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 5.1, hy - 3.6, 0.7, 0, 7); g.fill();
    g.restore();

    // front arm + bare mitts: his weapon is the orbit, not a held object
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, RD_SUIT);
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    specOrbit(g, a, true); // 9 orbit, front half
  };

  // ======================== 8 HOURS OF SLEEP MYAH ========================
  FC.myah = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, ext = a.attackExt, ak = a.attackKey;
    const cf = a.crouch ? 0.6 : 1;
    const lean = a.lean + (a.moving ? 2 : 0); // she glides into the travel
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const C2 = a.ramp(a.color2), PNK = a.ramp(MY_PINK), MSK = a.ramp(MY_MASK);
    const HAIR = a.ramp(MY_HAIR), SK = a.ramp(a.skin);
    const CHR = a.ramp(MY_CHROME), CHS = a.ramp(MY_CHASSIS);
    const sway = Math.sin(t * 2);

    // 1 halo ring + wheeling sun rays, squashed to sit behind the crown
    g.globalAlpha = 0.8;
    g.strokeStyle = MY_GOLD; g.lineWidth = 2;
    g.beginPath(); g.ellipse(3, -96, 11, 3.2, 0, 0, 7); g.stroke();
    g.globalAlpha = a.hurt ? 0.35 : ak === 'B' ? 1 : 0.7;
    g.strokeStyle = MY_GLOW; g.lineWidth = 1.6;
    const rayAng = t * (ak ? 1.2 : 0.4);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const ra = rayAng + i * 0.785;
      const rc = Math.cos(ra), rs = Math.sin(ra) * 0.5;
      g.moveTo(3 + rc * 13, -86 + rs * 13); g.lineTo(3 + rc * 17, -86 + rs * 17);
    }
    g.stroke();
    g.globalAlpha = 1;

    // 2 body: limbs, torso, gown bell with a lit hem
    a.limbStroke(g, hpx, hpy, a.bfx, a.bfy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.bfx, a.bfy);
    a.limbStroke(g, sx, sy, a.bhx, a.bhy, 7, a.color2);
    a.limbStroke(g, hpx, hpy, sx, sy, 15, MY_PINK);
    g.strokeStyle = PNK.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    a.limbStroke(g, hpx, hpy, a.ffx, a.ffy, 8.5, a.color2);
    shoe(g, a.color2, C2, a.ffx, a.ffy);
    g.globalAlpha = 0.88;
    g.fillStyle = MY_PLUM;
    g.beginPath();
    g.moveTo(-6 + lean * 0.3, hpy - 2); g.lineTo(6 + lean * 0.3, hpy - 2);
    g.lineTo(16, -1); g.lineTo(-16, -1);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = MY_MASK; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-16, -1); g.lineTo(16, -1); g.stroke();

    // 3 silk sash, knot and a swaying ribbon tail
    g.fillStyle = MY_GOLD;
    g.fillRect(-7, hpy - 2, 14, 3);
    g.beginPath(); g.arc(5, hpy - 0.5, 2, 0, 7); g.fill();
    g.globalAlpha = 0.9;
    g.beginPath();
    g.moveTo(6, hpy + 1); g.lineTo(9 + sway * 2, hpy + 9); g.lineTo(4, hpy + 8);
    g.closePath(); g.fill();
    g.globalAlpha = 1;

    // 4-6 head: hair finally DOWN, sleep mask worn as a laurel, rested eyes
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, true);
    g.fillStyle = HAIR.out;
    g.beginPath(); g.arc(hx, hy - 1.5, 9.9, PI, PI * 2); g.fill();
    g.fillStyle = MY_HAIR;
    g.beginPath(); g.ellipse(hx - 8 + sway * 1.2, hy + 5, 3.2, 8.5, 0.25, 0, 7); g.fill();
    g.beginPath(); g.ellipse(hx + 9 + sway * 1.2, hy + 5, 2.8, 7.5, -0.2, 0, 7); g.fill();
    g.beginPath(); g.arc(hx, hy - 1.5, 9.2, PI * 1.02, PI * 1.98); g.fill();
    g.strokeStyle = HAIR.lt; g.lineWidth = 2;
    g.beginPath(); g.arc(hx, hy - 1.5, 7.8, PI * 1.08, PI * 1.55); g.stroke();
    g.fillStyle = MSK.out; g.beginPath(); g.roundRect(hx - 8.5, hy - 11, 17, 5, 2.4); g.fill();
    g.fillStyle = MY_MASK; g.beginPath(); g.roundRect(hx - 7.8, hy - 10.3, 15.6, 3.6, 2); g.fill();
    g.strokeStyle = MY_STRAP; g.lineWidth = 1;
    g.beginPath(); g.arc(hx - 8.5, hy - 8.5, 1.8, PI * 0.4, PI * 1.6); g.stroke();
    g.beginPath(); g.arc(hx + 8.5, hy - 8.5, 1.8, PI * 1.4, PI * 0.6); g.stroke();
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(hx - 4, hy - 8.8, 0.7, 0, 7); g.fill();
    g.beginPath(); g.arc(hx + 4.6, hy - 8.6, 0.7, 0, 7); g.fill();
    faceEyes(g, a, hx, hy, true);
    g.restore();

    // front arm + mitts
    a.limbStroke(g, sx, sy, a.fhx, a.fhy, 7, MY_PINK);
    mitt(g, a.skin, SK, a.fhx, a.fhy, 3.6);
    mitt(g, a.skin, SK, a.bhx, a.bhy, 3.38);

    // the Sentient Robot Mop still rides her hand — rested, not disarmed
    g.save();
    g.translate(a.fhx, a.fhy);
    g.rotate(-0.85 + (ak ? ext * 0.95 : 0));
    g.strokeStyle = CHR.out; g.lineWidth = 4.4;
    g.beginPath(); g.moveTo(-3, 0); g.lineTo(20, 0); g.stroke();
    g.strokeStyle = MY_CHROME; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(-3, 0); g.lineTo(20, 0); g.stroke();
    g.strokeStyle = CHR.hi; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-1, -0.9); g.lineTo(18, -0.9); g.stroke();
    g.fillStyle = CHS.out; g.beginPath(); g.roundRect(19, -6, 12.4, 10, 4); g.fill();
    g.fillStyle = MY_CHASSIS; g.beginPath(); g.roundRect(19.6, -5.4, 11.2, 8.8, 3.6); g.fill();
    g.fillStyle = a.INK; g.beginPath(); g.roundRect(22, -3.8, 6.6, 2.8, 1.3); g.fill();
    g.globalAlpha = 0.7 + 0.3 * Math.sin(t * 5);
    g.fillStyle = MY_LED;
    g.beginPath(); g.arc(24, -2.4, 1, 0, 7); g.fill();
    g.beginPath(); g.arc(27, -2.4, 1, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = CHS.dk; // mop fringe
    g.beginPath();
    g.moveTo(23.1, 4.2); g.arc(21, 4.2, 2.1, 0, 3.14);
    g.moveTo(27, 4.4); g.arc(24.8, 4.4, 2.2, 0, 3.14);
    g.moveTo(30.6, 4.2); g.arc(28.5, 4.2, 2.1, 0, 3.14);
    g.fill();
    g.restore();

    // 7 checkmark motes — the impossible chores completing themselves
    g.strokeStyle = MY_GOLD; g.lineWidth = 1.8;
    for (let i = 0; i < 9; i += 3) {
      const p = CHK_MOTES[i + 2];
      const cyc = (t * 0.35 + p) % 1;
      const cx = CHK_MOTES[i] + Math.sin(t * 1.5 + p) * 2;
      const cy = CHK_MOTES[i + 1] - cyc * 14;
      g.globalAlpha = (1 - cyc) * 0.8;
      g.beginPath();
      if (a.hurt && i === 0) { // the headache threatens to return
        g.moveTo(cx - 2.4, cy); g.lineTo(cx - 0.6, cy + 1.8); g.lineTo(cx + 2.8, cy + 2.6);
      } else {
        g.moveTo(cx - 2.4, cy); g.lineTo(cx - 0.6, cy + 1.8); g.lineTo(cx + 2.8, cy - 2.6);
      }
      g.stroke();
    }
    g.globalAlpha = 1;

    // 8 hand sparkle, flaring with the swing
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 7);
    g.fillStyle = MY_CORE;
    star4(g, a.fhx, a.fhy, 1.6 + (ak ? 1.4 * ext : 0));
    g.globalAlpha = 1;
  };

  // ============================== WALKING ISLA ==============================
  // pompom bootie replaces the shoe
  function bootie(g, R, fx, fy) {
    g.fillStyle = R.out; g.beginPath(); g.roundRect(fx - 5.5, fy - 6.5, 12.5, 7.5, 3.4); g.fill();
    g.fillStyle = IS_WHITE; g.beginPath(); g.roundRect(fx - 4.7, fy - 5.7, 10.9, 6.2, 2.8); g.fill();
    g.fillStyle = IS_PINK; g.beginPath(); g.arc(fx - 4, fy - 5.5, 1.6, 0, 7); g.fill();
  }

  FC.isla = function (g, a) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const t = a.animT, w = a.walkCyc, ext = a.attackExt, ak = a.attackKey;
    const cf = a.crouch ? 0.6 : 1;
    const lean = a.lean; // the engine's wobble is already folded in
    const hpx = a.hipx + lean * 0.3, hpy = a.hipy;
    const sx = a.shx + lean * 0.5, sy = a.shy;
    const hx = 3 + lean * 0.6, hy = -78 * cf - 7;
    const PNK = a.ramp(IS_PINK), CRM = a.ramp(IS_CREAM), WHT = a.ramp(IS_WHITE);
    const SK = a.ramp(a.skin);
    // the arms ARE the weapon (weaponStyle 'muscles'): Baby Swole scaling
    const armW = 8.5 * (1 + a.weaponTier * 0.32);

    // 1 balance stance: arms up and out, micro-correcting at 4Hz. Attack and
    // hurt frames defer to the engine pose so the swings still read.
    const posed = !!ak;
    let fhx, fhy, bhx, bhy;
    if (posed) {
      fhx = a.fhx; fhy = a.fhy; bhx = a.bhx; bhy = a.bhy;
    } else if (a.moving) { // counter-swing at 1.4x
      fhx = 16 + Math.sin(w) * 7; fhy = -60 * cf;
      bhx = -14 - Math.sin(w) * 7; bhy = -58 * cf;
    } else {
      fhx = 16; fhy = -60 * cf + 1.5 * Math.sin(t * 4);
      bhx = -14; bhy = -58 * cf - 1.5 * Math.sin(t * 4);
    }

    // 2 legs: staggered double-bounce step (second harmonic on the x)
    let ffx = a.ffx, bfx = a.bfx;
    if (a.moving && !posed) {
      const h2 = 2 * Math.sin(2 * w);
      ffx = 8 + Math.sin(w) * 14.3 + h2;
      bfx = -8 - Math.sin(w) * 14.3 + h2;
    }

    g.save();
    if (a.hurt) g.scale(1.05, 0.85); // the plop — feet stay planted

    a.limbStroke(g, hpx, hpy, bfx, a.bfy, 8.5, a.color2);
    bootie(g, WHT, bfx, a.bfy);
    a.limbStroke(g, sx, sy, bhx, bhy, armW, SK.dk); // 5 swole back arm

    // 4 onesie torso with the standard dk back-shade + snap front
    a.limbStroke(g, hpx, hpy, sx, sy, 15, IS_PINK);
    g.strokeStyle = PNK.dk; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(hpx - 4.5, hpy); g.lineTo(sx - 4.5, sy); g.stroke();
    g.fillStyle = IS_WHITE;
    g.beginPath(); g.arc(0, -58 * cf, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -52 * cf, 0.8, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -46 * cf, 0.8, 0, 7); g.fill();

    // 6 double power-diaper, waistband and a safety pin
    g.fillStyle = CRM.out;
    g.beginPath(); g.roundRect(hpx - 8.5, hpy - 6, 17, 12, 5); g.fill();
    g.fillStyle = IS_CREAM;
    g.beginPath(); g.roundRect(hpx - 7.7, hpy - 5.2, 15.4, 10.4, 4.4); g.fill();
    g.strokeStyle = IS_PINK; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(hpx - 7, hpy - 4.8); g.lineTo(hpx + 7, hpy - 4.8); g.stroke();
    g.strokeStyle = IS_PIN; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hpx - 6.4, hpy - 1.4); g.lineTo(hpx - 6.4, hpy + 1.6); g.stroke();
    g.fillStyle = IS_PIN;
    g.beginPath(); g.arc(hpx - 6.4, hpy + 2.4, 0.9, 0, 7); g.fill();

    // 7 pacifier worn as a medal
    g.strokeStyle = IS_RIBBON; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(sx - 6, sy + 1); g.lineTo(2, -56 * cf);
    g.moveTo(sx + 6, sy + 1); g.lineTo(2, -56 * cf);
    g.stroke();
    g.fillStyle = IS_PACI;
    g.beginPath(); g.arc(2, -55 * cf, 2.8, 0, 7); g.fill();
    g.strokeStyle = IS_PACI2; g.lineWidth = 1.2;
    g.beginPath(); g.arc(2, -55 * cf, 1.6, 0, 7); g.stroke();
    g.fillStyle = IS_WHITE;
    g.beginPath(); g.arc(0.9, -56.2 * cf, 0.7, 0, 7); g.fill();

    // front leg
    a.limbStroke(g, hpx, hpy, ffx, a.ffy, 8.5, a.color2);
    bootie(g, WHT, ffx, a.ffy);

    // 8 head: baby face, blush, and a TRIPLE victory curl
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    headSkull(g, a, hx, hy, false);
    g.strokeStyle = IS_CURL; g.lineWidth = 1.7;
    g.beginPath(); g.arc(hx - 3, hy - 10, 2.2, PI * 0.2, PI * 1.4); g.stroke();
    g.beginPath(); g.arc(hx, hy - 11.5, 2.6, PI * 0.2, PI * 1.4); g.stroke();
    g.beginPath(); g.arc(hx + 3, hy - 10, 2.2, PI * 0.2, PI * 1.4); g.stroke();
    faceEyes(g, a, hx, hy, true);
    g.restore();

    // 5 swole front arm + fists
    a.limbStroke(g, sx, sy, fhx, fhy, armW, a.skin);
    mitt(g, a.skin, SK, fhx, fhy, 4.2);
    mitt(g, a.skin, SK, bhx, bhy, 3.9);

    // 9 bicep stars twinkling on the upper arms — the Baby Swole rung
    const sr = 1.5 * (ak ? 1 + ext : 1);
    for (let i = 0; i < 2; i++) {
      const p = BICEP_STARS[i];
      const mx = i === 0 ? (sx + fhx) / 2 : (sx + bhx) / 2;
      const my = i === 0 ? (sy + fhy) / 2 : (sy + bhy) / 2;
      g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + p);
      g.fillStyle = IS_WHITE;
      star4(g, mx, my, sr);
      g.globalAlpha = 0.5;
      g.strokeStyle = IS_PINK; g.lineWidth = 0.8;
      g.beginPath(); g.arc(mx, my, 2.4, 0, 7); g.stroke();
    }
    g.globalAlpha = 1;

    // 10 milk motes drifting off the fists (3x on the Milk Blast)
    g.fillStyle = IS_MILK;
    const msp = ak === 'B' ? 2.1 : 0.7;
    for (let i = 0; i < 3; i++) {
      const p = MILK_MOTES[i];
      const cyc = (t * msp + p) % 1;
      const mhx = i === 1 ? bhx : fhx, mhy = i === 1 ? bhy : fhy;
      g.globalAlpha = (1 - cyc) * 0.7;
      g.beginPath();
      g.arc(mhx + Math.sin(t * 3 + p) * 3, mhy - cyc * 10, 1.2, 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
  };
})();
