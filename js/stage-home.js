// stage-home.js — the interior of Super Todd's childhood home. This stage
// replaces the floating island outright: far() paints the back wall, windows,
// doorways and the staircase onto the blurred quarter-res buffer; near() paints
// the floor the fighters stand on, the rug and the cropped foreground furniture.
// 'home-day' and 'home-night' share every coordinate so they read as one house —
// only the palette object and a handful of night-only lights differ.
(function () {
  const S = (window.STAGE_ART = window.STAGE_ART || {});

  // ---- room geometry (world units; the floor line arrives as s.GROUND_Y = 468) ----
  const CEIL_Y = 34, CROWN_B = 47;        // ceiling plane bottom, crown molding bottom
  const RAIL_Y = 330, RAIL_B = 343;       // chair rail
  const BASE_Y = 440;                     // baseboard top
  // hallway doorway (left) — cased opening, no door
  const HALL_X0 = 128, HALL_X1 = 300, HALL_Y = 140;
  const HOLE_X0 = 146, HOLE_X1 = 282, HOLE_Y = 158;
  // window
  const WIN_X0 = 418, WIN_X1 = 634, WIN_Y0 = 108, WIN_Y1 = 312;
  const GL_X0 = 434, GL_X1 = 618, GL_Y0 = 124, GL_Y1 = 296, GL_MX = 522, GL_MY = 208;
  // bedroom door — the one the boss comes through
  const DR_X0 = 746, DR_X1 = 914, DR_Y = 166;   // casing
  const DS_X0 = 762, DS_X1 = 898, DS_Y = 182;   // slab
  // staircase: nose line runs up and to the right, off the top-right corner
  const ST_X = 1232, ST_RUN = 44, ST_RISE = 34, ST_N = 13, ST_SLOPE = 34 / 44;
  const RAIL_H = 104;                     // handrail height above the nose line
  const NEWEL_X = 1196, NEWEL_W = 30;
  // foreground furniture never rises above this line — the fighting band is 380-470
  const FORE_TOP = 486;
  const SOFA_X = 300, TV_X = 1150;

  // framed photos: x, y, w, h, style (0 pair / 1 landscape / 2 single), stride 5
  const FRAMES = [
    330, 128, 60, 76, 0,
    336, 236, 50, 42, 1,
    664, 120, 54, 68, 2,
    672, 214, 72, 52, 1,
    930, 238, 46, 46, 2,
    1068, 116, 58, 72, 0,
    1058, 218, 76, 56, 1,
  ];
  // plank seam depths below the floor line — spacing grows toward the camera
  const PLANKS = [6, 14, 24, 37, 53, 73, 98, 129, 167, 213, 268, 334, 412, 504];
  const PLANK_JIT = [0, 63, 27, 91, 44, 12, 78, 35];
  const LEAF_A = [-2.5, -1.95, -1.4, -0.95, -0.5];   // houseplant frond angles
  const PLAID_V = [18, 64, 110, 156, 202, 248, 294, 340];
  const PLAID_H = [16, 46, 76, 106];

  const DAY = {
    night: false,
    ceil: '#f2ead3', ceilDk: '#ddd2b4',
    crown: '#f8f2e0', crownDk: '#cdc1a0', trimInk: '#8a7a58',
    paperBase: '#d8c398', paperLt: '#e6d5ae', motif: '#bfa578', motifDk: '#a88f63',
    topShade: 'rgba(120,96,60,0.16)', shadeTint: '#a88f63',
    cornerShade: 'rgba(110,86,52,0.20)', cast: 'rgba(96,72,42,0.18)',
    rail: '#f2ead6', railDk: '#cdc1a0', railInk: '#8a7a58', railLt: '#fdf8ea',
    wain: '#e7dcc1', wainDk: '#d3c6a6', bead: '#d9cdae',
    washCore: 'rgba(255,244,196,0.13)', washMid: 'rgba(255,240,186,0.08)', washOut: 'rgba(255,238,180,0.05)',
    jamb: '#f2ead6', jambDk: '#cdc1a0',
    hallVoid: '#6f5f4a', hallVoidDk: '#4e4234', hallWall: '#8a7a60', hallFloor: '#8a6136',
    door: '#8a5a34', doorLt: '#a67243', doorDk: '#6b4326', doorInk: '#472b16',
    panel: '#7d5030', panelDk: '#5f3c22', panelLt: '#a3703f',
    brass: '#d9a93c', brassLt: '#f4d685', brassDk: '#8a6b1f',
    winFrame: '#f6f0dd', winFrameDk: '#cdc1a0', winInk: '#8a7a58',
    sky: '#bfe0f2', skyLo: '#e8f2f0', outFar: '#8fb98a', outNear: '#5d8f52', orb: '#fff6d0',
    glassSheen: 'rgba(255,255,255,0.22)',
    beamA: 'rgba(255,238,182,0.13)', beamB: 'rgba(255,244,206,0.09)',
    poolA: 'rgba(255,232,166,0.22)', poolB: 'rgba(255,240,196,0.13)',
    mote: '#fff8d6',
    tread: '#b8834b', treadLt: '#d3a067', riser: '#efe7d2', riserDk: '#cdc1a0', nose: '#6d4526',
    stringer: '#e2d7ba', stringerDk: '#bfb190', under: '#c7b791', underDk: '#a99a76',
    hand: '#7a4f2c', handLt: '#a3703f', handInk: '#4a2c16',
    spindle: '#f4eeda', spindleDk: '#cdc1a0',
    frameA: '#8a5a34', frameB: '#d9a93c', frameC: '#5f6b7a',
    matte: '#f4efe2', photoSky: '#a9c4d8', photoGround: '#c9a86e', sil: '#5b6a7c',
    clockRim: '#8a5a34', clockFace: '#f4efe2', clockInk: '#4a2c16', clockHand: '#3a2a1a',
    hourA: 0.61, minA: -0.52,                    // ten past four, afternoon
    plate: '#f4efe2', plateDk: '#cdc1a0', toggle: '#e0d6bd',
    tableTop: '#8a5a34', tableDk: '#5f3c22', tableLt: '#a3703f',
    shade: '#e9d9a8', shadeDk: '#c9b47c', shadeLt: '#f7ecc4', lampBase: '#c9a05a', lampBaseDk: '#8a6b1f',
    pot: '#b06a48', potDk: '#7f4a30', potLt: '#c98a63',
    leaf: '#4e8f46', leafDk: '#2f6b30', leafLt: '#78bb5c',
    floor: '#b07c46', floorLt: '#c9975c', floorDk: '#8f6034',
    seam: 'rgba(74,44,22,0.45)', seamLt: 'rgba(240,214,166,0.28)', grain: 'rgba(74,44,22,0.16)',
    contact1: 'rgba(74,44,22,0.30)', contact2: 'rgba(74,44,22,0.15)',
    rug: '#9a4a44', rugDk: '#6e2f2c', rugLt: '#c06a5c', rugCream: '#e3cfa4', rugAccent: '#3f6f70', rugInk: '#4a1f1d',
    sofa: '#7c5c3e', sofaDk: '#5a4029', sofaLt: '#9a7550', sofaInk: '#3d2b1a', plaidA: '#a8733f', plaidB: '#46604f',
    tv: '#5b5560', tvDk: '#3e3944', tvLt: '#7a7381', tvInk: '#2a262f',
    screen: '#3a4450', screenLt: '#5f7183', tvKnob: '#c9a05a', antenna: '#b9b2bf',
  };

  const NIGHT = {
    night: true,
    ceil: '#232a3d', ceilDk: '#1a2030',
    crown: '#39445e', crownDk: '#242c40', trimInk: '#141826',
    paperBase: '#39415c', paperLt: '#454f6e', motif: '#2e3550', motifDk: '#262c44',
    topShade: 'rgba(10,12,24,0.30)', shadeTint: '#262c44',
    cornerShade: 'rgba(8,10,20,0.30)', cast: 'rgba(8,10,20,0.34)',
    rail: '#4c5674', railDk: '#333b53', railInk: '#171c2b', railLt: '#5d688a',
    wain: '#46506c', wainDk: '#39415a', bead: '#3f4863',
    washCore: 'rgba(150,190,255,0.11)', washMid: 'rgba(150,190,255,0.07)', washOut: 'rgba(150,190,255,0.04)',
    jamb: '#4c5674', jambDk: '#333b53',
    hallVoid: '#2a3048', hallVoidDk: '#1c2134', hallWall: '#38405a', hallFloor: '#3a3040',
    door: '#3d3340', doorLt: '#50434f', doorDk: '#2c242f', doorInk: '#171219',
    panel: '#372e3a', panelDk: '#261f28', panelLt: '#4a3d47',
    brass: '#8f7440', brassLt: '#c9a45e', brassDk: '#4f3f22',
    winFrame: '#4c5674', winFrameDk: '#333b53', winInk: '#171c2b',
    sky: '#16213f', skyLo: '#1e2b4c', outFar: '#1b2a3e', outNear: '#131d2c', orb: '#e8eefc',
    glassSheen: 'rgba(170,205,255,0.14)',
    beamA: 'rgba(150,190,255,0.10)', beamB: 'rgba(180,210,255,0.07)',
    poolA: 'rgba(150,190,255,0.20)', poolB: 'rgba(180,214,255,0.12)',
    mote: '#c8d8ff',
    tread: '#3a3442', treadLt: '#4d4557', riser: '#4a5470', riserDk: '#333b53', nose: '#221d29',
    stringer: '#414a64', stringerDk: '#2d3448', under: '#333b53', underDk: '#252c3f',
    hand: '#332a38', handLt: '#4a3d4c', handInk: '#171219',
    spindle: '#4e5876', spindleDk: '#353d55',
    frameA: '#3a2f38', frameB: '#6b5a34', frameC: '#3c4557',
    matte: '#4a5169', photoSky: '#39445e', photoGround: '#4a4152', sil: '#242a3c',
    clockRim: '#3a2f38', clockFace: '#4e5674', clockInk: '#171219', clockHand: '#20263a',
    hourA: -1.27, minA: 2.09,                    // twelve thirty-five, after midnight
    plate: '#4a5169', plateDk: '#333b53', toggle: '#5b6584',
    tableTop: '#3a2f38', tableDk: '#241d26', tableLt: '#4d404c',
    shade: '#525d7c', shadeDk: '#3b445e', shadeLt: '#68749a', lampBase: '#4a4054', lampBaseDk: '#2c2434',
    pot: '#4a3340', potDk: '#301f28', potLt: '#5e4350',
    leaf: '#2c4450', leafDk: '#1c2f39', leafLt: '#3d5c64',
    floor: '#2b2532', floorLt: '#3a3242', floorDk: '#201a26',
    seam: 'rgba(10,7,16,0.50)', seamLt: 'rgba(126,138,178,0.16)', grain: 'rgba(10,7,16,0.20)',
    contact1: 'rgba(8,6,14,0.40)', contact2: 'rgba(8,6,14,0.20)',
    rug: '#3f2b34', rugDk: '#2a1c23', rugLt: '#543a44', rugCream: '#6b6070', rugAccent: '#2c4450', rugInk: '#1b1218',
    sofa: '#33293a', sofaDk: '#241c29', sofaLt: '#463a4e', sofaInk: '#150f19', plaidA: '#463245', plaidB: '#2b3a3c',
    tv: '#2f2b38', tvDk: '#211e2a', tvLt: '#413c4c', tvInk: '#15121c',
    screen: '#232b3a', screenLt: '#33405a', tvKnob: '#5a4a30', antenna: '#4a4557',
  };

  // night-only lights (hoisted rgba literals — no alpha string built per frame)
  const NL_CORE = 'rgba(255,206,140,0.26)', NL_MID = 'rgba(255,196,120,0.15)', NL_OUT = 'rgba(255,186,96,0.07)';
  const NL_BULB = '#ffd79a', NL_BODY = '#e8dcc0';
  const LEAK = 'rgba(255,204,132,0.80)', LEAK_A = 'rgba(255,186,96,0.22)', LEAK_B = 'rgba(255,186,96,0.12)', LEAK_C = 'rgba(255,186,96,0.06)';
  const DOOR_RIM = 'rgba(255,206,140,0.30)';
  const MOON_HALO = 'rgba(200,222,255,0.18)';

  // ---- wallpaper baked once per variant; tiles in world units so the repeat
  // survives the quarter-res far pass (motif ~22 units across) ----
  let patDay = null, patNight = null;
  function petal(q, x, y, r) {
    q.beginPath(); q.arc(x, y - r * 1.3, r, 0, 7); q.fill();
    q.beginPath(); q.arc(x, y + r * 1.3, r, 0, 7); q.fill();
    q.beginPath(); q.arc(x - r * 1.3, y, r, 0, 7); q.fill();
    q.beginPath(); q.arc(x + r * 1.3, y, r, 0, 7); q.fill();
  }
  function paperPat(g, P) {
    if (P.night) { if (patNight) return patNight; } else if (patDay) return patDay;
    const c = document.createElement('canvas');
    c.width = 72; c.height = 66;
    const q = c.getContext('2d');
    q.fillStyle = P.paperBase; q.fillRect(0, 0, 72, 66);
    q.fillStyle = P.paperLt; q.fillRect(6, 0, 6, 66); q.fillRect(42, 0, 6, 66);
    q.fillStyle = P.motif;
    petal(q, 27, 17, 5); petal(q, 63, 50, 5);
    q.fillStyle = P.motifDk;
    q.beginPath(); q.arc(27, 17, 2.6, 0, 7); q.fill();
    q.beginPath(); q.arc(63, 50, 2.6, 0, 7); q.fill();
    // small diamonds fill the half-drop gaps
    q.fillStyle = P.motifDk;
    q.beginPath(); q.moveTo(63, 12); q.lineTo(68, 17); q.lineTo(63, 22); q.lineTo(58, 17); q.closePath(); q.fill();
    q.beginPath(); q.moveTo(27, 45); q.lineTo(32, 50); q.lineTo(27, 55); q.lineTo(22, 50); q.closePath(); q.fill();
    const p = g.createPattern(c, 'repeat');
    if (P.night) patNight = p; else patDay = p;
    return p;
  }

  // three nested ellipses stand in for a glow — no gradients in this file
  function wash(g, x, y, rx, ry, cOut, cMid, cCore) {
    g.fillStyle = cOut; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = cMid; g.beginPath(); g.ellipse(x, y, rx * 0.66, ry * 0.66, 0, 0, 7); g.fill();
    g.fillStyle = cCore; g.beginPath(); g.ellipse(x, y, rx * 0.36, ry * 0.36, 0, 0, 7); g.fill();
  }

  // ================================ BACK WALL =============================
  function shell(g, s, P, x0, w0, yTop, hAll) {
    const gy = s.GROUND_Y;
    g.fillStyle = P.wain; g.fillRect(x0, yTop, w0, hAll);   // base so nothing shows through
    // ceiling plane + crown molding
    g.fillStyle = P.ceil; g.fillRect(x0, yTop, w0, CEIL_Y - yTop);
    g.fillStyle = P.ceilDk; g.fillRect(x0, CEIL_Y - 9, w0, 9);
    g.fillStyle = P.crown; g.fillRect(x0, CEIL_Y, w0, 13);
    g.fillStyle = P.crownDk; g.fillRect(x0, CEIL_Y + 9, w0, 4);
    g.fillStyle = P.trimInk; g.fillRect(x0, CROWN_B - 2, w0, 2);
    // wallpaper, then the shadow the ceiling drops onto it, dithered at its edge
    g.fillStyle = paperPat(g, P); g.fillRect(x0, CROWN_B, w0, RAIL_Y - CROWN_B);
    g.fillStyle = P.topShade; g.fillRect(x0, CROWN_B, w0, 26);
    g.globalAlpha = 0.4; g.fillStyle = s.checker(P.shadeTint);
    g.fillRect(x0, CROWN_B + 26, w0, 16);
    g.globalAlpha = 1;
    // chair rail
    g.fillStyle = P.rail; g.fillRect(x0, RAIL_Y, w0, 13);
    g.fillStyle = P.railLt; g.fillRect(x0, RAIL_Y, w0, 3);
    g.fillStyle = P.railDk; g.fillRect(x0, RAIL_Y + 8, w0, 3);
    g.fillStyle = P.railInk; g.fillRect(x0, RAIL_B - 2, w0, 2);
    // wainscot below the rail is deliberately plain — the fighters read against it
    g.fillStyle = P.wain; g.fillRect(x0, RAIL_B, w0, BASE_Y - RAIL_B);
    g.fillStyle = P.bead;
    const b0 = Math.floor(x0 / 26) * 26;
    for (let x = b0; x < x0 + w0; x += 26) g.fillRect(x, RAIL_B + 2, 2, BASE_Y - RAIL_B - 2);
    g.fillStyle = P.wainDk; g.fillRect(x0, BASE_Y - 5, w0, 5);
    // baseboard
    g.fillStyle = P.rail; g.fillRect(x0, BASE_Y, w0, gy - BASE_Y);
    g.fillStyle = P.railLt; g.fillRect(x0, BASE_Y, w0, 4);
    g.fillStyle = P.railDk; g.fillRect(x0, BASE_Y + 4, w0, 3);
    g.fillStyle = P.trimInk; g.fillRect(x0, gy - 3, w0, 3);
    // room corner at stage left implies the fourth wall folding away
    g.fillStyle = P.cornerShade; g.fillRect(0, CROWN_B, 34, gy - CROWN_B);
  }

  // ============================ HALLWAY DOORWAY ===========================
  function doorway(g, P, gy) {
    // casing
    g.fillStyle = P.jamb;
    g.fillRect(HALL_X0, HALL_Y, HALL_X1 - HALL_X0, gy - HALL_Y);
    g.fillStyle = P.jambDk;
    g.fillRect(HALL_X0, HALL_Y, HALL_X1 - HALL_X0, 4);
    g.fillRect(HALL_X1 - 5, HALL_Y, 5, gy - HALL_Y);
    // opening: a dim hall running away from the room
    g.fillStyle = P.hallVoid; g.fillRect(HOLE_X0, HOLE_Y, HOLE_X1 - HOLE_X0, gy - HOLE_Y);
    g.fillStyle = P.hallWall;
    g.beginPath();
    g.moveTo(HOLE_X0, HOLE_Y); g.lineTo(HOLE_X0 + 34, HOLE_Y + 34);
    g.lineTo(HOLE_X0 + 34, gy - 34); g.lineTo(HOLE_X0, gy);
    g.closePath(); g.fill();
    g.fillStyle = P.hallVoidDk;
    g.fillRect(HOLE_X0 + 34, HOLE_Y + 30, HOLE_X1 - HOLE_X0 - 34, gy - HOLE_Y - 60);
    g.fillStyle = P.hallFloor;
    g.beginPath();
    g.moveTo(HOLE_X0, gy); g.lineTo(HOLE_X0 + 34, gy - 34);
    g.lineTo(HOLE_X1, gy - 34); g.lineTo(HOLE_X1, gy);
    g.closePath(); g.fill();
    // jamb inner edges catch the room light on their left faces
    g.fillStyle = P.jambDk; g.fillRect(HOLE_X1 - 4, HOLE_Y, 4, gy - HOLE_Y);
    g.fillStyle = P.jamb; g.fillRect(HOLE_X0 - 4, HOLE_Y - 4, 4, gy - HOLE_Y + 4);
    g.fillRect(HOLE_X0 - 4, HOLE_Y - 4, HOLE_X1 - HOLE_X0 + 8, 4);
    if (P.night) {
      // the nightlight: the only warm source in the house after midnight
      wash(g, 214, gy - 26, 108, 74, NL_OUT, NL_MID, NL_CORE);
      g.fillStyle = NL_BODY; g.beginPath(); g.roundRect(206, gy - 40, 16, 22, 4); g.fill();
      g.fillStyle = NL_BULB; g.beginPath(); g.roundRect(209, gy - 34, 10, 9, 3); g.fill();
    }
  }

  // ============================= BEDROOM DOOR =============================
  function bedroomDoor(g, P, gy) {
    // casing, deliberately heavier than the hallway's — this door has to matter
    g.fillStyle = P.jamb; g.fillRect(DR_X0, DR_Y, DR_X1 - DR_X0, gy - DR_Y);
    g.fillStyle = P.jambDk;
    g.fillRect(DR_X0, DR_Y, DR_X1 - DR_X0, 5);
    g.fillRect(DR_X1 - 6, DR_Y, 6, gy - DR_Y);
    g.fillStyle = P.trimInk;
    g.fillRect(DR_X0 - 3, DR_Y - 6, DR_X1 - DR_X0 + 6, 6);
    // slab
    g.fillStyle = P.door; g.fillRect(DS_X0, DS_Y, DS_X1 - DS_X0, gy - DS_Y);
    g.fillStyle = P.doorLt; g.fillRect(DS_X0, DS_Y, 6, gy - DS_Y);       // top-left key
    g.fillRect(DS_X0, DS_Y, DS_X1 - DS_X0, 5);
    g.fillStyle = P.doorDk; g.fillRect(DS_X1 - 7, DS_Y, 7, gy - DS_Y);
    g.fillStyle = P.doorInk; g.fillRect(DS_X0 - 2, DS_Y - 2, DS_X1 - DS_X0 + 4, 2);
    // four sunken panels
    g.fillStyle = P.panelDk;
    g.fillRect(774, 200, 48, 116); g.fillRect(834, 200, 48, 116);
    g.fillRect(774, 330, 48, 106); g.fillRect(834, 330, 48, 106);
    g.fillStyle = P.panel;
    g.fillRect(777, 203, 45, 113); g.fillRect(837, 203, 45, 113);
    g.fillRect(777, 333, 45, 103); g.fillRect(837, 333, 45, 103);
    g.fillStyle = P.panelLt;
    g.fillRect(777, 203, 45, 3); g.fillRect(837, 203, 45, 3);
    g.fillRect(777, 333, 45, 3); g.fillRect(837, 333, 45, 3);
    // brass knob with a backplate
    g.fillStyle = P.brassDk; g.beginPath(); g.roundRect(884, 312, 10, 34, 4); g.fill();
    g.fillStyle = P.brass; g.beginPath(); g.arc(889, 330, 7.5, 0, 7); g.fill();
    g.fillStyle = P.brassLt; g.beginPath(); g.arc(887, 327.6, 2.6, 0, 7); g.fill();
    g.fillStyle = P.brassDk; g.beginPath(); g.arc(889, 330, 7.5, 0.6, 2.2); g.fill();
    if (P.night) {
      // warm light leaking out of the room beyond: sill line first, then the spill
      g.fillStyle = LEAK_C; g.fillRect(DS_X0 - 24, gy - 26, DS_X1 - DS_X0 + 48, 26);
      g.fillStyle = LEAK_B; g.fillRect(DS_X0 - 10, gy - 16, DS_X1 - DS_X0 + 20, 16);
      g.fillStyle = LEAK_A; g.fillRect(DS_X0 - 2, gy - 9, DS_X1 - DS_X0 + 4, 9);
      g.fillStyle = LEAK; g.fillRect(DS_X0, gy - 5, DS_X1 - DS_X0, 4);
      g.fillStyle = DOOR_RIM;
      g.fillRect(DS_X0 - 2, DS_Y, 2.4, gy - DS_Y);
      g.fillRect(DS_X1 - 0.4, DS_Y, 2.4, gy - DS_Y);
      g.fillRect(DS_X0 - 2, DS_Y - 2, DS_X1 - DS_X0 + 4, 2.4);
    }
  }

  // ================================ WINDOW ================================
  function windowUnit(g, P) {
    // outside first, then the sash sits on top of it
    g.fillStyle = P.sky; g.fillRect(GL_X0, GL_Y0, GL_X1 - GL_X0, GL_Y1 - GL_Y0);
    g.fillStyle = P.skyLo; g.fillRect(GL_X0, GL_Y1 - 70, GL_X1 - GL_X0, 70);
    // the source sits upper-LEFT in the glass — that is what leans the shaft right
    if (P.night) {
      g.fillStyle = MOON_HALO; g.beginPath(); g.arc(470, 152, 30, 0, 7); g.fill();
      g.fillStyle = P.orb; g.beginPath(); g.arc(470, 152, 15, 0, 7); g.fill();
      g.fillStyle = P.sky; g.beginPath(); g.arc(464, 147, 4, 0, 7); g.fill();
      g.beginPath(); g.arc(474, 158, 3, 0, 7); g.fill();
      g.fillStyle = P.orb;
      g.beginPath(); g.arc(556, 142, 1.8, 0, 7); g.fill();
      g.beginPath(); g.arc(592, 174, 1.5, 0, 7); g.fill();
      g.beginPath(); g.arc(548, 198, 1.6, 0, 7); g.fill();
    } else {
      g.fillStyle = P.orb; g.beginPath(); g.arc(466, 148, 17, 0, 7); g.fill();
    }
    // neighbour's tree and fence line across the bottom of the glass
    g.fillStyle = P.outFar;
    g.beginPath(); g.arc(470, GL_Y1 - 66, 34, 0, 7); g.fill();
    g.beginPath(); g.arc(504, GL_Y1 - 54, 26, 0, 7); g.fill();
    g.fillStyle = P.outNear;
    g.beginPath(); g.arc(456, GL_Y1 - 48, 26, 0, 7); g.fill();
    g.fillRect(GL_X0, GL_Y1 - 26, GL_X1 - GL_X0, 26);
    // glass sheen: two flat streaks, no gradient
    g.fillStyle = P.glassSheen;
    g.beginPath();
    g.moveTo(GL_X0 + 14, GL_Y1); g.lineTo(GL_X0 + 70, GL_Y0);
    g.lineTo(GL_X0 + 96, GL_Y0); g.lineTo(GL_X0 + 40, GL_Y1);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(GL_X0 + 106, GL_Y1); g.lineTo(GL_X0 + 162, GL_Y0);
    g.lineTo(GL_X0 + 176, GL_Y0); g.lineTo(GL_X0 + 120, GL_Y1);
    g.closePath(); g.fill();
    // sash bars
    g.fillStyle = P.winFrame;
    g.fillRect(GL_MX - 5, GL_Y0, 10, GL_Y1 - GL_Y0);
    g.fillRect(GL_X0, GL_MY - 5, GL_X1 - GL_X0, 10);
    g.fillStyle = P.winFrameDk;
    g.fillRect(GL_MX + 2, GL_Y0, 3, GL_Y1 - GL_Y0);
    g.fillRect(GL_X0, GL_MY + 2, GL_X1 - GL_X0, 3);
    // casing
    g.fillStyle = P.winFrame;
    g.fillRect(WIN_X0, WIN_Y0, WIN_X1 - WIN_X0, GL_Y0 - WIN_Y0);
    g.fillRect(WIN_X0, GL_Y1, WIN_X1 - WIN_X0, WIN_Y1 - GL_Y1);
    g.fillRect(WIN_X0, WIN_Y0, GL_X0 - WIN_X0, WIN_Y1 - WIN_Y0);
    g.fillRect(GL_X1, WIN_Y0, WIN_X1 - GL_X1, WIN_Y1 - WIN_Y0);
    g.fillStyle = P.winFrameDk;
    g.fillRect(GL_X1 - 4, WIN_Y0, 4, WIN_Y1 - WIN_Y0);
    g.fillRect(WIN_X0, WIN_Y1 - 5, WIN_X1 - WIN_X0, 5);
    g.fillStyle = P.winInk;
    g.fillRect(WIN_X0 - 2, WIN_Y0 - 2, WIN_X1 - WIN_X0 + 4, 2);
    // sill + apron
    g.fillStyle = P.winFrame; g.fillRect(WIN_X0 - 12, WIN_Y1, WIN_X1 - WIN_X0 + 24, 13);
    g.fillStyle = P.railLt; g.fillRect(WIN_X0 - 12, WIN_Y1, WIN_X1 - WIN_X0 + 24, 3);
    g.fillStyle = P.winFrameDk; g.fillRect(WIN_X0 - 12, WIN_Y1 + 10, WIN_X1 - WIN_X0 + 24, 3);
    g.fillStyle = P.winInk; g.fillRect(WIN_X0 - 4, WIN_Y1 + 13, WIN_X1 - WIN_X0 + 8, 6);
    // the light this window throws onto the wall around it
    wash(g, 560, 250, 300, 220, P.washOut, P.washMid, P.washCore);
  }

  // The shaft, glass to floor line. It leans right and widens with depth; the
  // gap between the halves is the shadow of the vertical sash bar.
  const SH_Y = GL_Y0 + 6;
  const SH_L0 = GL_X0 + 4, SH_M0 = GL_MX - 6, SH_M1 = GL_MX + 6, SH_R0 = GL_X1 - 4;
  const SH_L1 = 548, SH_ML = 658, SH_MR = 672, SH_R1 = 792;   // same edges at the floor
  function shaft(g, P, gy) {
    g.fillStyle = P.beamA;
    g.beginPath();
    g.moveTo(SH_L0, SH_Y); g.lineTo(SH_M0, SH_Y); g.lineTo(SH_ML, gy); g.lineTo(SH_L1, gy);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(SH_M1, SH_Y); g.lineTo(SH_R0, SH_Y); g.lineTo(SH_R1, gy); g.lineTo(SH_MR, gy);
    g.closePath(); g.fill();
    g.fillStyle = P.beamB;   // the brighter core, on the sun side of the bar
    g.beginPath();
    g.moveTo(SH_M1 + 14, SH_Y); g.lineTo(SH_R0 - 16, SH_Y);
    g.lineTo(SH_R1 - 22, gy); g.lineTo(SH_MR + 26, gy);
    g.closePath(); g.fill();
  }

  // ============================== STAIRCASE ===============================
  // handrail height above the line through the tread noses
  function railY(x, gy) { return gy - ST_RISE - (x - ST_X) * ST_SLOPE - RAIL_H; }
  function stairs(g, P, gy) {
    const topX = ST_X + ST_N * ST_RUN;
    const bx0 = ST_X - 8, by0 = gy - ST_RISE + 8 * ST_SLOPE;   // nose line at bx0
    const by1 = gy - ST_RISE - (topX - ST_X) * ST_SLOPE;        // nose line at topX
    // the solid mass under the stepped profile
    g.beginPath();
    g.moveTo(ST_X, gy);
    for (let i = 0; i < ST_N; i++) {
      const rx = ST_X + i * ST_RUN, ry = gy - (i + 1) * ST_RISE;
      g.lineTo(rx, ry); g.lineTo(rx + ST_RUN, ry);
    }
    g.lineTo(topX, gy);
    g.closePath();
    g.fillStyle = P.under; g.fill();
    g.fillStyle = P.underDk; g.fillRect(ST_X, gy - 46, topX - ST_X, 46);
    // stringer board, parallel to the noses
    g.fillStyle = P.stringer;
    g.beginPath();
    g.moveTo(bx0, by0); g.lineTo(topX, by1);
    g.lineTo(topX, by1 + 34); g.lineTo(bx0, by0 + 34);
    g.closePath(); g.fill();
    g.fillStyle = P.stringerDk;
    g.beginPath();
    g.moveTo(bx0, by0 + 25); g.lineTo(topX, by1 + 25);
    g.lineTo(topX, by1 + 34); g.lineTo(bx0, by0 + 34);
    g.closePath(); g.fill();
    // treads and risers — lit tread tops, shadowed risers, so the steps read
    for (let i = 0; i < ST_N; i++) {
      const nx = ST_X + i * ST_RUN, ty = gy - (i + 1) * ST_RISE;
      g.fillStyle = P.riser; g.fillRect(nx - 5, ty + 9, 7, ST_RISE - 9);
      g.fillStyle = P.riserDk; g.fillRect(nx + 2, ty + 9, 3, ST_RISE - 9);
      g.fillStyle = P.tread; g.fillRect(nx - 6, ty, ST_RUN + 8, 9);
      g.fillStyle = P.treadLt; g.fillRect(nx - 6, ty, ST_RUN + 8, 2.8);
      g.fillStyle = P.nose; g.fillRect(nx - 6, ty + 9, ST_RUN + 8, 2);
    }
    // newel post, chamfered cap, ball finial
    const nCx = NEWEL_X + NEWEL_W / 2;
    const nTop = railY(nCx, gy);
    g.fillStyle = P.hand; g.fillRect(NEWEL_X, nTop, NEWEL_W, gy - nTop);
    g.fillStyle = P.handLt; g.fillRect(NEWEL_X, nTop, 6, gy - nTop);
    g.fillStyle = P.handInk; g.fillRect(NEWEL_X + NEWEL_W - 5, nTop, 5, gy - nTop);
    g.fillStyle = P.hand; g.beginPath(); g.roundRect(NEWEL_X - 7, nTop - 12, NEWEL_W + 14, 14, 3); g.fill();
    g.fillStyle = P.handLt; g.fillRect(NEWEL_X - 7, nTop - 12, NEWEL_W + 14, 3);
    g.fillStyle = P.hand; g.beginPath(); g.arc(nCx, nTop - 21, 10, 0, 7); g.fill();
    g.fillStyle = P.handLt; g.beginPath(); g.arc(nCx - 3, nTop - 24, 3.4, 0, 7); g.fill();
    // turned spindles, two per tread, standing on the tread tops
    for (let i = 0; i < ST_N; i++) {
      const nx = ST_X + i * ST_RUN, ty = gy - (i + 1) * ST_RISE;
      for (let k = 0; k < 2; k++) {
        const sx = nx + 13 + k * 19;
        const sy = railY(sx, gy);
        if (sy < -70) continue;
        g.fillStyle = P.spindleDk; g.fillRect(sx - 2.6, sy, 5.2, ty - sy);
        g.fillStyle = P.spindle; g.fillRect(sx - 2.6, sy, 2.4, ty - sy);
        g.fillStyle = P.spindleDk; g.fillRect(sx - 4.4, ty - 7, 8.8, 6);
        g.fillStyle = P.spindle;
        g.beginPath(); g.ellipse(sx - 0.6, sy + (ty - sy) * 0.42, 4.2, 6.5, 0, 0, 7); g.fill();
        g.fillStyle = P.spindleDk;
        g.beginPath(); g.ellipse(sx + 2.4, sy + (ty - sy) * 0.42, 1.6, 6, 0, 0, 7); g.fill();
      }
    }
    // handrail, parallel to the noses and out through the top-right corner
    const hx = topX + 60, hy = railY(hx, gy);
    g.lineCap = 'round';
    g.strokeStyle = P.handInk; g.lineWidth = 13;
    g.beginPath(); g.moveTo(nCx, nTop - 16); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = P.hand; g.lineWidth = 10;
    g.beginPath(); g.moveTo(nCx, nTop - 16); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = P.handLt; g.lineWidth = 3;
    g.beginPath(); g.moveTo(nCx, nTop - 20); g.lineTo(hx, hy - 4); g.stroke();
    g.lineCap = 'butt';
  }

  // ================== FRAMED PHOTOS, CLOCK, LIGHT SWITCH ==================
  function photoIn(g, P, x, y, w, h, style) {
    g.fillStyle = P.photoSky; g.fillRect(x, y, w, h);
    if (style === 1) {
      g.fillStyle = P.photoGround;
      g.beginPath(); g.arc(x + w * 0.5, y + h * 1.2, w * 0.62, Math.PI, 0); g.fill();
      g.fillStyle = P.matte; g.beginPath(); g.arc(x + w * 0.74, y + h * 0.3, h * 0.13, 0, 7); g.fill();
    } else if (style === 2) {
      g.fillStyle = P.photoGround; g.fillRect(x, y + h * 0.62, w, h * 0.38);
      g.fillStyle = P.sil;
      g.beginPath(); g.arc(x + w * 0.5, y + h * 0.42, h * 0.17, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.92, w * 0.3, h * 0.28, 0, 0, 7); g.fill();
    } else {
      g.fillStyle = P.photoGround; g.fillRect(x, y + h * 0.66, w, h * 0.34);
      g.fillStyle = P.sil;
      g.beginPath(); g.arc(x + w * 0.34, y + h * 0.4, h * 0.15, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + w * 0.34, y + h * 0.94, w * 0.24, h * 0.3, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(x + w * 0.68, y + h * 0.46, h * 0.13, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + w * 0.68, y + h * 0.98, w * 0.2, h * 0.26, 0, 0, 7); g.fill();
    }
  }
  function decor(g, P, s) {
    for (let i = 0; i < FRAMES.length; i += 5) {
      const x = FRAMES[i], y = FRAMES[i + 1], w = FRAMES[i + 2], h = FRAMES[i + 3];
      const k = (i / 5) % 3;
      const col = k === 0 ? P.frameA : k === 1 ? P.frameB : P.frameC;
      const R = s.ramp(col);
      g.fillStyle = P.cast; g.fillRect(x + 4, y + 5, w, h);   // cast shadow
      g.fillStyle = R.out; g.fillRect(x - 3, y - 3, w + 6, h + 6);
      g.fillStyle = col; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = R.lt; g.fillRect(x - 1, y - 1, w + 2, 2.4);
      g.fillStyle = R.dk; g.fillRect(x - 1, y + h - 1, w + 2, 2.4);
      g.fillStyle = P.matte; g.fillRect(x, y, w, h);
      photoIn(g, P, x + 5, y + 5, w - 10, h - 10, FRAMES[i + 4]);
    }
    // wall clock
    g.fillStyle = P.cast; g.beginPath(); g.arc(1004, 175, 36, 0, 7); g.fill();
    g.fillStyle = P.clockRim; g.beginPath(); g.arc(1000, 170, 36, 0, 7); g.fill();
    g.fillStyle = P.clockInk; g.beginPath(); g.arc(1000, 170, 31, 0, 7); g.fill();
    g.fillStyle = P.clockFace; g.beginPath(); g.arc(1000, 170, 29, 0, 7); g.fill();
    g.fillStyle = P.clockInk;
    g.fillRect(999, 145, 2.6, 6); g.fillRect(999, 189, 2.6, 6);
    g.fillRect(975, 169, 6, 2.6); g.fillRect(1019, 169, 6, 2.6);
    g.strokeStyle = P.clockHand; g.lineCap = 'round';
    g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(1000, 170);
    g.lineTo(1000 + Math.cos(P.hourA) * 15, 170 + Math.sin(P.hourA) * 15); g.stroke();
    g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(1000, 170);
    g.lineTo(1000 + Math.cos(P.minA) * 23, 170 + Math.sin(P.minA) * 23); g.stroke();
    g.lineCap = 'butt';
    g.fillStyle = P.clockInk; g.beginPath(); g.arc(1000, 170, 2.6, 0, 7); g.fill();
    // light switch beside the bedroom door
    g.fillStyle = P.plateDk; g.beginPath(); g.roundRect(718, 346, 20, 30, 3); g.fill();
    g.fillStyle = P.plate; g.beginPath(); g.roundRect(719, 347, 18, 28, 3); g.fill();
    g.fillStyle = P.plateDk; g.fillRect(725, 353, 7, 17);
    g.fillStyle = P.toggle; g.fillRect(726, 354, 5, 9);
  }

  // ====================== SIDE TABLE, LAMP, HOUSEPLANT ====================
  function lampTable(g, P, gy) {
    // shade and body sit above the fighting band; only the table is inside it
    g.fillStyle = P.lampBaseDk; g.fillRect(1104, 372, 18, 26);
    g.fillStyle = P.lampBase; g.fillRect(1104, 372, 7, 26);
    g.beginPath(); g.ellipse(1113, 398, 22, 7, 0, 0, 7); g.fill();
    g.fillStyle = P.lampBaseDk; g.fillRect(1110, 336, 6, 40);
    g.fillStyle = P.shadeDk;
    g.beginPath();
    g.moveTo(1086, 340); g.lineTo(1096, 302); g.lineTo(1130, 302); g.lineTo(1140, 340);
    g.closePath(); g.fill();
    g.fillStyle = P.shade;
    g.beginPath();
    g.moveTo(1088, 338); g.lineTo(1097, 304); g.lineTo(1126, 304); g.lineTo(1134, 338);
    g.closePath(); g.fill();
    g.fillStyle = P.shadeLt;
    g.beginPath();
    g.moveTo(1088, 338); g.lineTo(1097, 304); g.lineTo(1105, 304); g.lineTo(1098, 338);
    g.closePath(); g.fill();
    // table
    g.fillStyle = P.tableDk; g.fillRect(1068, 398, 92, 10);
    g.fillStyle = P.tableTop; g.fillRect(1068, 396, 92, 6);
    g.fillStyle = P.tableLt; g.fillRect(1068, 396, 92, 2.4);
    g.fillStyle = P.tableDk;
    g.fillRect(1076, 408, 8, gy - 408); g.fillRect(1144, 408, 8, gy - 408);
    g.fillStyle = P.tableTop; g.fillRect(1076, 408, 3, gy - 408);
    g.fillRect(1078, 430, 68, 5);                     // stretcher
  }
  function plant(g, P, gy) {
    g.strokeStyle = P.leafDk; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 5; i++) {
      const a = LEAF_A[i];
      const ex = 364 + Math.cos(a) * 62, ey = 416 + Math.sin(a) * 76;
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(364, 420); g.quadraticCurveTo(364 + Math.cos(a) * 34, 416 + Math.sin(a) * 52, ex, ey); g.stroke();
      g.fillStyle = i % 2 ? P.leaf : P.leafLt;
      g.beginPath(); g.ellipse(ex, ey, 15, 8, a + 1.5, 0, 7); g.fill();
      g.fillStyle = P.leafDk;
      g.beginPath(); g.ellipse(ex + 3, ey + 3, 8, 4, a + 1.5, 0, 7); g.fill();
    }
    g.lineCap = 'butt';
    g.fillStyle = P.potDk;
    g.beginPath();
    g.moveTo(336, 416); g.lineTo(392, 416); g.lineTo(384, gy); g.lineTo(344, gy);
    g.closePath(); g.fill();
    g.fillStyle = P.pot;
    g.beginPath();
    g.moveTo(338, 418); g.lineTo(386, 418); g.lineTo(379, gy); g.lineTo(345, gy);
    g.closePath(); g.fill();
    g.fillStyle = P.potLt; g.fillRect(342, 420, 9, gy - 420);
    g.fillStyle = P.potDk; g.fillRect(334, 410, 60, 8);
    g.fillStyle = P.potLt; g.fillRect(334, 410, 60, 2.4);
  }

  // ================================= FLOOR ================================
  function floorNear(g, s, P, x0, w0, botY) {
    const gy = s.GROUND_Y;
    g.fillStyle = P.floor; g.fillRect(x0, gy, w0, botY - gy);
    // the boards nearest the wall sit in its shadow, dithered out of it
    g.fillStyle = P.floorDk; g.fillRect(x0, gy, w0, 24);
    g.globalAlpha = 0.5; g.fillStyle = s.checker(P.floorDk);
    g.fillRect(x0, gy + 24, w0, 14);
    g.globalAlpha = 1;
    g.fillStyle = P.contact1; g.fillRect(x0, gy, w0, 7);
    g.fillStyle = P.contact2; g.fillRect(x0, gy + 7, w0, 9);
    const r = s.seeded(211);
    for (let i = 0; i < 13; i++) {
      const y = gy + PLANKS[i], bh = PLANKS[i + 1] - PLANKS[i];
      const lw = 1 + i * 0.2;
      if (i > 1) { g.fillStyle = P.seamLt; g.fillRect(x0, y - lw, w0, lw); }
      g.fillStyle = P.seam; g.fillRect(x0, y, w0, lw);
      // staggered board ends
      const sp = 150 + i * 34, j = PLANK_JIT[i & 7];
      const sx = Math.floor((x0 - j) / sp) * sp + j;
      for (let x = sx; x < x0 + w0; x += sp) g.fillRect(x, y, 1.4 + i * 0.2, bh);
      // a little grain so the wide near boards aren't flat
      if (i > 4) {
        g.fillStyle = P.grain;
        const gx = x0 + r() * w0;
        g.fillRect(gx, y + bh * 0.4, 40 + i * 12, 1.6 + i * 0.2);
        g.fillRect(gx + 90 + i * 8, y + bh * 0.7, 30 + i * 9, 1.4 + i * 0.2);
      }
    }
  }

  function rugNear(g, P, gy) {
    // laid in perspective: the far edge is shorter and higher
    const ty = gy + 30, by = gy + 156;
    g.fillStyle = P.rugInk;
    g.beginPath();
    g.moveTo(690, ty); g.lineTo(1178, ty); g.lineTo(1240, by); g.lineTo(636, by);
    g.closePath(); g.fill();
    g.fillStyle = P.rug;
    g.beginPath();
    g.moveTo(696, ty + 3); g.lineTo(1172, ty + 3); g.lineTo(1230, by - 4); g.lineTo(646, by - 4);
    g.closePath(); g.fill();
    g.fillStyle = P.rugCream;
    g.beginPath();
    g.moveTo(714, ty + 12); g.lineTo(1154, ty + 12); g.lineTo(1202, by - 15); g.lineTo(674, by - 15);
    g.closePath(); g.fill();
    g.fillStyle = P.rugDk;
    g.beginPath();
    g.moveTo(722, ty + 18); g.lineTo(1146, ty + 18); g.lineTo(1190, by - 22); g.lineTo(686, by - 22);
    g.closePath(); g.fill();
    // medallions down the middle
    for (let i = 0; i < 3; i++) {
      const cx = 800 + i * 140, cy = gy + 92;
      g.fillStyle = P.rugAccent;
      g.beginPath();
      g.moveTo(cx, cy - 26); g.lineTo(cx + 44, cy); g.lineTo(cx, cy + 26); g.lineTo(cx - 44, cy);
      g.closePath(); g.fill();
      g.fillStyle = P.rugLt;
      g.beginPath();
      g.moveTo(cx, cy - 15); g.lineTo(cx + 26, cy); g.lineTo(cx, cy + 15); g.lineTo(cx - 26, cy);
      g.closePath(); g.fill();
      g.fillStyle = P.rugCream; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
    }
    // fringe on the near edge
    g.fillStyle = P.rugCream;
    for (let x = 650; x < 1230; x += 16) g.fillRect(x, by - 3, 6, 10);
  }

  function poolNear(g, P, gy) {
    // the shaft carrying on across the floorboards — same edges it had at the
    // floor line, sash-bar shadow included — then the bright pool inside it
    const d = gy + 190;
    g.fillStyle = P.poolB;
    g.beginPath();
    g.moveTo(SH_L1, gy); g.lineTo(SH_ML, gy); g.lineTo(SH_ML + 84, d); g.lineTo(SH_L1 + 64, d);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(SH_MR, gy); g.lineTo(SH_R1, gy); g.lineTo(SH_R1 + 108, d); g.lineTo(SH_MR + 88, d);
    g.closePath(); g.fill();
    g.fillStyle = P.poolA;
    g.beginPath();
    g.moveTo(SH_MR + 22, gy + 34); g.lineTo(SH_R1 - 18, gy + 34);
    g.lineTo(SH_R1 + 68, gy + 162); g.lineTo(SH_MR + 96, gy + 162);
    g.closePath(); g.fill();
  }

  function motesNear(g, P, s) {
    const r = s.seeded(41);
    g.fillStyle = P.mote;
    for (let i = 0; i < 26; i++) {
      const bx = 442 + r() * 150, by = r() * 320, sp = 0.3 + r() * 0.9, ph = r() * 6.3;
      const y = 132 + ((by + s.t * sp * 11) % 320);
      const x = bx + (y - 132) * 0.42 + Math.sin(s.t * sp + ph) * 8;
      g.globalAlpha = 0.22 + 0.34 * (0.5 + 0.5 * Math.sin(s.t * 1.7 + ph));
      g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }

  // ========================= FOREGROUND FURNITURE =========================
  function couchPiece(g, P, x, fy) {
    g.fillStyle = P.sofaInk;
    g.beginPath(); g.roundRect(x - 20, fy - 176, 400, 176, 18); g.fill();
    g.fillStyle = P.sofa;
    g.beginPath(); g.roundRect(x - 14, fy - 170, 388, 168, 15); g.fill();
    // plaid, clipped to the back
    g.save();
    g.beginPath(); g.roundRect(x - 14, fy - 170, 388, 168, 15); g.clip();
    g.fillStyle = P.plaidA;
    for (let i = 0; i < 8; i++) g.fillRect(x + PLAID_V[i], fy - 170, 11, 168);
    g.fillStyle = P.plaidB;
    for (let i = 0; i < 4; i++) g.fillRect(x - 14, fy - 170 + PLAID_H[i] * 1.5, 388, 8);
    g.fillStyle = P.sofaLt; g.fillRect(x - 14, fy - 170, 388, 5);
    g.restore();
    // arms
    g.fillStyle = P.sofaInk;
    g.beginPath(); g.roundRect(x - 34, fy - 128, 58, 128, 16); g.fill();
    g.beginPath(); g.roundRect(x + 340, fy - 128, 58, 128, 16); g.fill();
    g.fillStyle = P.sofaDk;
    g.beginPath(); g.roundRect(x - 29, fy - 123, 50, 123, 14); g.fill();
    g.beginPath(); g.roundRect(x + 345, fy - 123, 50, 123, 14); g.fill();
    g.fillStyle = P.sofaLt;
    g.beginPath(); g.roundRect(x - 29, fy - 123, 50, 12, 6); g.fill();
    g.beginPath(); g.roundRect(x + 345, fy - 123, 50, 12, 6); g.fill();
    // seat cushions
    g.fillStyle = P.sofaInk;
    g.beginPath(); g.roundRect(x + 8, fy - 96, 344, 62, 12); g.fill();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = P.sofa;
      g.beginPath(); g.roundRect(x + 13 + i * 114, fy - 91, 108, 54, 10); g.fill();
      g.fillStyle = P.sofaLt;
      g.beginPath(); g.roundRect(x + 13 + i * 114, fy - 91, 108, 9, 5); g.fill();
      g.fillStyle = P.plaidA; g.fillRect(x + 46 + i * 114, fy - 82, 10, 45);
    }
    g.fillStyle = P.sofaInk;
    g.fillRect(x + 6, fy - 22, 20, 22); g.fillRect(x + 336, fy - 22, 20, 22);
  }
  function tvPiece(g, P, x, fy, night) {
    // rabbit ears first so the cabinet overlaps their feet
    g.strokeStyle = P.antenna; g.lineCap = 'round'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + 92, fy - 146); g.lineTo(x + 34, fy - 226); g.stroke();
    g.beginPath(); g.moveTo(x + 98, fy - 146); g.lineTo(x + 168, fy - 214); g.stroke();
    g.fillStyle = P.antenna;
    g.beginPath(); g.arc(x + 34, fy - 226, 4, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 168, fy - 214, 4, 0, 7); g.fill();
    g.lineCap = 'butt';
    g.fillStyle = P.tvInk;
    g.beginPath(); g.roundRect(x - 6, fy - 154, 202, 154, 10); g.fill();
    g.fillStyle = P.tv;
    g.beginPath(); g.roundRect(x, fy - 148, 190, 146, 8); g.fill();
    g.fillStyle = P.tvLt; g.fillRect(x, fy - 148, 190, 5);
    g.fillStyle = P.tvDk; g.fillRect(x + 178, fy - 148, 12, 146);
    // screen
    g.fillStyle = P.tvInk;
    g.beginPath(); g.roundRect(x + 12, fy - 136, 136, 112, 18); g.fill();
    g.fillStyle = P.screen;
    g.beginPath(); g.roundRect(x + 17, fy - 131, 126, 102, 15); g.fill();
    g.fillStyle = P.screenLt;
    g.beginPath();
    g.moveTo(x + 30, fy - 33); g.lineTo(x + 74, fy - 129);
    g.lineTo(x + 96, fy - 129); g.lineTo(x + 52, fy - 33);
    g.closePath(); g.fill();
    if (night) { g.fillStyle = P.screenLt; g.fillRect(x + 17, fy - 131, 126, 3); }
    // knobs and grille
    g.fillStyle = P.tvDk;
    g.beginPath(); g.arc(x + 168, fy - 122, 9, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 168, fy - 96, 9, 0, 7); g.fill();
    g.fillStyle = P.tvKnob;
    g.beginPath(); g.arc(x + 168, fy - 122, 5.5, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 168, fy - 96, 5.5, 0, 7); g.fill();
    g.fillStyle = P.tvInk;
    for (let i = 0; i < 5; i++) g.fillRect(x + 156 + i * 6, fy - 74, 3, 40);
    g.fillStyle = P.tvInk; g.fillRect(x + 10, fy - 12, 22, 12); g.fillRect(x + 158, fy - 12, 22, 12);
  }

  // ================================ PASSES ================================
  function drawFar(g, s, P) {
    const gy = s.GROUND_Y;
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const yTop = -s.worldOffY - 24, hAll = s.viewH + 48;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    shell(g, s, P, x0, w0, yTop, hAll);
    stairs(g, P, gy);
    doorway(g, P, gy);
    bedroomDoor(g, P, gy);
    windowUnit(g, P);
    decor(g, P, s);
    lampTable(g, P, gy);
    plant(g, P, gy);
    shaft(g, P, gy);
  }

  function drawNear(g, s, P) {
    const gy = s.GROUND_Y;
    const x0 = s.camX - 24, w0 = s.viewW + 48;
    const bot = s.viewH - s.worldOffY;
    g.lineJoin = 'round'; g.lineCap = 'butt';
    floorNear(g, s, P, x0, w0, bot + 24);
    rugNear(g, P, gy);
    poolNear(g, P, gy);
    if (P.night) {
      // the two live sources spilling onto the boards
      wash(g, 214, gy + 34, 150, 68, NL_OUT, NL_MID, NL_CORE);
      g.fillStyle = LEAK_C;
      g.beginPath();
      g.moveTo(DS_X0 - 20, gy); g.lineTo(DS_X1 + 20, gy);
      g.lineTo(DS_X1 + 54, gy + 96); g.lineTo(DS_X0 - 54, gy + 96);
      g.closePath(); g.fill();
      g.fillStyle = LEAK_B;
      g.beginPath();
      g.moveTo(DS_X0 - 6, gy); g.lineTo(DS_X1 + 6, gy);
      g.lineTo(DS_X1 + 26, gy + 54); g.lineTo(DS_X0 - 26, gy + 54);
      g.closePath(); g.fill();
      g.fillStyle = LEAK_A; g.fillRect(DS_X0, gy, DS_X1 - DS_X0, 14);
    } else {
      motesNear(g, P, s);
    }
    // foreground furniture, hard-clipped out of the fighting band
    g.save();
    g.beginPath(); g.rect(x0, FORE_TOP, w0, Math.max(0, bot + 24 - FORE_TOP)); g.clip();
    const fy = bot + 18;
    couchPiece(g, P, SOFA_X, fy);
    tvPiece(g, P, TV_X, fy, P.night);
    g.restore();
  }

  S['home-day'] = {
    far: function (g, s) { drawFar(g, s, DAY); },
    near: function (g, s) { drawNear(g, s, DAY); },
  };
  S['home-night'] = {
    far: function (g, s) { drawFar(g, s, NIGHT); },
    near: function (g, s) { drawNear(g, s, NIGHT); },
  };
})();
