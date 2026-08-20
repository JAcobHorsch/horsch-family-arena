// faces.js — cinematic close-up busts for the cutscene 'face' shots.
//
// Local frame: (0,0) is the CENTRE OF THE HEAD, +y is down. The head reads
// ~100 units across and ~118 tall; the shoulders run off the bottom of the
// frame. The caller owns the translate/scale; we own our save/restore.
//
// ONE generic bust renderer driven by two hoisted tables:
//   D[id]     — who this is: skin/hair/shirt ramps, skull width, jaw, eye
//               size + iris, nose, mouth width, and look extras.
//   EXPR[key] — how they feel. Brow ends, lid closure, pupil scale and mouth
//               kind all move together; nothing is a mouth swap.
// ASC[id] carries the finalForm.look variant, resolved ONCE at load.
//
// The bust faces the viewer square-on so both eyes are the same construction
// mirrored about x=0. The key light is authored UPPER-LEFT: form shadow down
// the right and lower edge, warm rim along the upper-left. spec.facing<0
// mirrors the whole bust, which flips the hair sweep with it.
//
// Flat fills only — no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const F = (window.FACES = window.FACES || {});

  /* ============================ shared ink ============================ */
  const INK = '#181220';
  const EYEW = '#fbf7ee';
  const LID_SH = 'rgba(104,74,96,0.20)';   // lid's cast shadow on the white
  const CATCH = 'rgba(255,255,255,0.96)';
  const CATCH2 = 'rgba(255,255,255,0.40)';
  const RIM = 'rgba(255,246,221,0.38)';    // warm sun rim, upper-left edge
  const SHADE = 'rgba(24,16,34,0.15)';     // form shadow, right/lower plane
  const JAWSH = 'rgba(24,16,34,0.13)';
  const NECKSH = 'rgba(20,14,30,0.32)';
  const NOSE_SH = 'rgba(98,54,44,0.22)';
  const NOSE_HI = 'rgba(255,246,221,0.34)';
  const LIPHI = 'rgba(255,238,216,0.34)';
  const LOWLID = 'rgba(122,80,74,0.28)';
  const CREASE = 'rgba(112,72,68,0.18)';
  const BLUSH = 'rgba(255,118,118,0.28)';
  const FLUSH1 = 'rgba(206,42,24,0.12)';
  const FLUSH2 = 'rgba(206,42,24,0.22)';
  const STUB = 'rgba(48,38,56,0.13)';      // beard shadow: a REGION, never dots
  const FRECK = 'rgba(170,98,60,0.34)';
  const TEETH = '#fbf6ea';
  const TEETH_SH = 'rgba(126,108,96,0.26)';
  const MOUTH_IN = '#3c1220';
  const TONGUE = '#cf5f6d';
  const HEAT_A = 'rgba(255,150,58,0.78)';
  const HEAT_B = 'rgba(255,198,132,0.44)';
  const TEAR = 'rgba(152,214,255,0.82)';
  const TEAR_HI = 'rgba(240,252,255,0.92)';
  const SWEAT = 'rgba(192,232,255,0.86)';
  const SHEEN = 'rgba(255,255,255,0.26)';
  const GLASSF = 'rgba(206,232,246,0.14)';
  const GLASSR = '#2a2a35';
  const HAIRSH = 'rgba(24,16,34,0.16)';
  const SWEAT_OUT = 'rgba(96,150,190,0.70)';
  const PACI = '#4ab2e8';
  const PACI_OUT = '#1f5c8a';
  const PACI_LT = '#9fdcff';
  const PACI_RING = '#2f7bd4';
  const BEAK = '#f0b23a';
  const BEAK_OUT = '#9c6a12';
  const HORN = '#e0cf9e';
  const HORN_OUT = '#8a7548';
  const HORN_LT = '#f6ecc8';
  const BAR_A = '#4adbe8';
  const BAR_B = '#ff4a3a';
  const EYEGLOW = 'rgba(255,106,42,0.30)';

  /* ===================== hoisted geometry tables ====================== */
  // 5 swept spikes, authored for cw=46 and scaled. An ODD, uneven crest —
  // never two matched points, which would read as cat ears.
  const SPIKE = [
    -33, -40, -43, -62, 8.5,
    -17, -54, -23, -80, 9.5,
    2, -58, 5, -87, 10,
    20, -53, 30, -77, 9,
    34, -38, 46, -58, 7.5,
  ];
  // shaggy: big overlapping rounded clumps + two side locks
  const SHAG = [
    -34, -30, 14, -27, -50, 16, -6, -60, 17.5, 15, -57, 16, 34, -38, 13.5,
    -42, -8, 11, 40, -12, 10,
  ];
  // levi's ascended wrecking-crew mop — fewer, bigger, messier
  const MOP = [
    -34, -34, 17, -18, -60, 20, 8, -64, 21, 32, -44, 17, -44, -6, 13, 42, -10, 12,
  ];
  // short hair: three soft bumps so the dome is not a dead arc
  const BUMP = [-24, -46, 13, -2, -55, 14, 24, -44, 12];
  // josh's scruffy crop
  const SCRUFF = [-26, -44, 12, -4, -52, 13, 20, -45, 12, 34, -32, 9];
  // freckles: ONE tight band across the nose bridge, never a scatter
  const FRECKLES = [-19, 9, -12, 12, -5, 14, 7, 13, 14, 11, 20, 8];
  // rage heat: side, x pad, base y, phase — it rises off the SIDES of the head
  const HEAT = [
    -1, 9, 8, 0, -1, 22, 0, 1.9, -1, 34, 14, 3.1,
    1, 9, 4, 4.4, 1, 22, -4, 0.8, 1, 34, 12, 2.4,
  ];
  // princess crown silhouette
  const CROWN = [-30, -50, -30, -76, -15, -60, 0, -84, 15, -60, 30, -76, 30, -50];
  // ascension aura: widest and faintest first, so the core stays brightest
  const AURA = [112, 2, 94, 1, 78, 0];

  /* ============================= palettes ============================= */
  // every ramp is the game's own ramp() of that character's hue, baked flat
  const D = {};

  D.todd = {
    sOut: '#7a5546', sDk: '#c08d63', sMid: '#e8b58a', sLt: '#f2caa6', sHi: '#f8ddc0',
    hOut: '#2a1218', hDk: '#3a161a', hMid: '#4b1e1f', hLt: '#7a4a42',
    hair: 'short', cw: 48, jw: 41, chin: 54,
    bw: 3.6, eW: 11, eH: 7.6, ir: '#5b3a22', irD: '#2c1a0c', irL: '#96693c',
    noseW: 14, mW: 27,
    lip: '#b4635c', lipD: '#7a3438', lipH: '#d9918a',
    cOut: '#68293a', cDk: '#aa3e42', cMid: '#e8524a', cLt: '#ee8073', acc: '#f7c2c0',
    band: 1, stubble: 1,
  };
  D.sonya = {
    sOut: '#7b5a50', sDk: '#c4906f', sMid: '#eeba90', sLt: '#f5cfaa', sHi: '#fae0c4',
    hOut: '#2a1020', hDk: '#3a1428', hMid: '#4b1b34', hLt: '#7c4a5c',
    hair: 'pony', cw: 45, jw: 31, chin: 55,
    bw: 2.4, eW: 11.4, eH: 8.6, ir: '#4a6b52', irD: '#22331f', irL: '#84ab88',
    noseW: 11, mW: 21,
    lip: '#cc6a80', lipD: '#8a3448', lipH: '#ef9daa',
    cOut: '#682655', cDk: '#aa3975', cMid: '#e84a92', cLt: '#ee7aa7', acc: '#f7c0d9',
    band: 1, lash: 1,
  };
  D.jordan = {
    sOut: '#785343', sDk: '#bf8b60', sMid: '#e8b184', sLt: '#f0c69f', sHi: '#f7dabb',
    hOut: '#2a161a', hDk: '#3a1e1c', hMid: '#4b291f', hLt: '#7a5644',
    hair: 'spiky', cw: 45, jw: 29, chin: 57,
    bw: 3, eW: 11, eH: 7.9, ir: '#3f5a74', irD: '#1c2a38', irL: '#7f9fb8',
    noseW: 11, mW: 22,
    lip: '#b96a63', lipD: '#7c383c', lipH: '#dc9890',
    cOut: '#68383a', cDk: '#aa5942', cMid: '#e8784a', cLt: '#ee9b73', acc: '#f7d0c0',
    band: 1, stubble: 1,
  };
  D.jerod = {
    sOut: '#7a5747', sDk: '#c39067', sMid: '#edbb92', sLt: '#f4cfab', sHi: '#f9e0c5',
    hOut: '#2a2214', hDk: '#3a3018', hMid: '#4b401f', hLt: '#7a6c46',
    hair: 'short', cw: 49, jw: 37, chin: 54,
    bw: 3.4, eW: 11, eH: 7.7, ir: '#4d6f5c', irD: '#22342a', irL: '#88ad94',
    noseW: 14, mW: 23,
    lip: '#b96b62', lipD: '#7c3a3a', lipH: '#dc998f',
    cOut: '#68563a', cDk: '#aa9142', cMid: '#e8c84a', cLt: '#eed573', acc: '#f7ecc0',
    band: 1, stubble: 1,
  };
  D.jacob = {
    sOut: '#775241', sDk: '#bd8a5f', sMid: '#e6ae80', sLt: '#efc59c', sHi: '#f7dabb',
    hOut: '#0f2618', hDk: '#153320', hMid: '#1c4928', hLt: '#4c7a58',
    hair: 'spiky', cw: 46, jw: 33, chin: 55,
    bw: 3.4, eW: 11, eH: 7.9, ir: '#3f6b4c', irD: '#1b3222', irL: '#7ba886',
    noseW: 12, mW: 23,
    lip: '#b6665f', lipD: '#7a3638', lipH: '#d9948b',
    cOut: '#2c6246', cDk: '#3ca759', cMid: '#4ae86a', cLt: '#7dec8a', acc: '#c0f7cb',
    band: 1, stubble: 1,
  };
  D.samantha = {
    sOut: '#7d5c4c', sDk: '#c69672', sMid: '#f0c09a', sLt: '#f6d2b0', sHi: '#fae2c8',
    hOut: '#0f2622', hDk: '#153630', hMid: '#1c493d', hLt: '#4c7a6c',
    hair: 'pony', cw: 46, jw: 32, chin: 53,
    bw: 2.5, eW: 11.6, eH: 8.8, ir: '#5a4a6e', irD: '#2a2136', irL: '#948aa8',
    noseW: 11, mW: 21,
    lip: '#cc6f7c', lipD: '#8a3a46', lipH: '#efa1a6',
    cOut: '#2c6261', cDk: '#3ca78b', cMid: '#4ae8b2', cLt: '#7decbe', acc: '#c0f7e4',
    band: 1, lash: 1,
  };
  D.cassandra = {
    sOut: '#7b5949', sDk: '#c4926e', sMid: '#ecb98e', sLt: '#f3cda8', sHi: '#f9dfc3',
    hOut: '#0f2028', hDk: '#152e38', hMid: '#1c464d', hLt: '#4c7378',
    hair: 'long', cw: 45, jw: 31, chin: 55,
    bw: 2.5, eW: 11.5, eH: 8.6, ir: '#6b5136', irD: '#33261a', irL: '#a4885e',
    noseW: 11, mW: 21,
    lip: '#c96876', lipD: '#88343e', lipH: '#ec9ba2',
    cOut: '#2c5d76', cDk: '#3c9eb1', cMid: '#4adbe8', cLt: '#7de3e5', acc: '#c0f2f7',
    band: 1, lash: 1,
  };
  D.erika = {
    sOut: '#7f5e50', sDk: '#c99976', sMid: '#f2c49f', sLt: '#f8d5b4', sHi: '#fbe4ca',
    hOut: '#101426', hDk: '#151f36', hMid: '#1c2d4d', hLt: '#4c5c78',
    hair: 'pony', cw: 47, jw: 34, chin: 53,
    bw: 2.2, eW: 11.2, eH: 8.8, ir: '#4a6178', irD: '#222c3a', irL: '#829bb0',
    noseW: 11, mW: 18,
    lip: '#c47784', lipD: '#82424c', lipH: '#e7a6ab',
    cOut: '#2c3d76', cDk: '#3c63b1', cMid: '#4a86e8', cLt: '#7da5e5', acc: '#c0d5f7',
    band: 1, lash: 1,
  };
  D.levi = {
    sOut: '#745040', sDk: '#b9855c', sMid: '#ddab7c', sLt: '#e8c197', sHi: '#f2d7b6',
    hOut: '#1a0f2a', hDk: '#241438', hMid: '#2f1b4d', hLt: '#5c4a74',
    hair: 'shaggy', cw: 49, jw: 38, chin: 56,
    bw: 4.2, eW: 10.8, eH: 7.4, ir: '#4d3f6b', irD: '#231c33', irL: '#8578a0',
    noseW: 14, mW: 25,
    lip: '#ae615c', lipD: '#74343a', lipH: '#d38f88',
    cOut: '#452676', cDk: '#6839b1', cMid: '#8a4ae8', cLt: '#ab7ae5', acc: '#d6c0f7',
    band: 1, stubble: 1,
  };
  D.ronathon = {
    sOut: '#795442', sDk: '#c08c62', sMid: '#e9b68c', sLt: '#f1cba4', sHi: '#f8dcc0',
    hOut: '#20102a', hDk: '#2e1538', hMid: '#401b4d', hLt: '#6c4a74',
    hair: 'short', cw: 44, jw: 29, chin: 58,
    bw: 3.2, eW: 10.8, eH: 7.6, ir: '#5a4460', irD: '#2a1e30', irL: '#927e98',
    noseW: 12, mW: 22,
    lip: '#b56760', lipD: '#78383a', lipH: '#d8958c',
    cOut: '#5a2676', cDk: '#9039b1', cMid: '#c24ae8', cLt: '#d37ae5', acc: '#eac0f7',
    band: 1, mous: 1,
  };
  D.tim = {
    sOut: '#765241', sDk: '#bb8860', sMid: '#e2ac7e', sLt: '#ecc39b', sHi: '#f5d9ba',
    hOut: '#241c18', hDk: '#33291e', hMid: '#423728', hLt: '#6f6250',
    hair: 'short', cw: 48, jw: 37, chin: 55,
    bw: 3.5, eW: 10.8, eH: 7.6, ir: '#4c6a7c', irD: '#22323e', irL: '#89a8b6',
    noseW: 13, mW: 24,
    lip: '#b4645d', lipD: '#78353a', lipH: '#d9928a',
    cOut: '#5d4a46', cDk: '#957a59', cMid: '#c9a86a', cLt: '#d8be8a', acc: '#f2ee4a',
    helmet: 1, stubble: 1,
    gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
  };
  D.myah = {
    sOut: '#7d5d4e', sDk: '#c69774', sMid: '#f0c19c', sLt: '#f6d3b2', sHi: '#fae3c9',
    hOut: '#2a1024', hDk: '#3a1430', hMid: '#4b1b46', hLt: '#7c4a68',
    hair: 'long', cw: 45, jw: 31, chin: 55,
    bw: 2.4, eW: 11.5, eH: 8.6, ir: '#6b4a5e', irD: '#332430', irL: '#a4838f',
    noseW: 11, mW: 21,
    lip: '#cc6b84', lipD: '#8a354c', lipH: '#ef9dae',
    cOut: '#68266d', cDk: '#aa39a0', cMid: '#e84ad0', cLt: '#ee7ad4', acc: '#f7c0ef',
    band: 1, lash: 1,
  };
  D.isla = {
    sOut: '#856155', sDk: '#d2a184', sMid: '#f8d0b0', sLt: '#fbdec1', sHi: '#fdead4',
    hOut: '#2c1c26', hDk: '#3c2632', hMid: '#4e3542', hLt: '#7d6068',
    hair: 'wisp', cw: 52, jw: 39, chin: 44,
    bw: 1.8, eW: 13.6, eH: 10.6, ir: '#4f6b86', irD: '#25334a', irL: '#8dabc0',
    noseW: 9, mW: 16, eyeY: 7, eyeSp: 1.04,
    lip: '#d97d88', lipD: '#93414e', lipH: '#f5a9ac',
    cOut: '#6c4867', cDk: '#b17796', cMid: '#f2a3c2', cLt: '#f6baca', acc: '#fadfea',
    baby: 1, blush: 1, paci: 1,
  };
  D.hayes = {
    sOut: '#7e5c4e', sDk: '#c89574', sMid: '#f2c096', sLt: '#f8d2ac', sHi: '#fbe2c4',
    hOut: '#100e28', hDk: '#171338', hMid: '#221b4d', hLt: '#514a75',
    hair: 'spiky', cw: 46, jw: 32, chin: 52,
    bw: 2.7, eW: 12.4, eH: 9.4, ir: '#4a5c9b', irD: '#222a4a', irL: '#8b98c6',
    noseW: 10, mW: 20, eyeY: 3,
    lip: '#c4707a', lipD: '#843c48', lipH: '#e7a3a6',
    cOut: '#332676', cDk: '#4839b1', cMid: '#5c4ae8', cLt: '#8a7ae5', acc: '#c6c0f7',
    band: 1, blush: 1, freckle: 1,
  };
  D.addi = {
    sOut: '#82604f', sDk: '#cd9a78', sMid: '#f6cdaa', sLt: '#fadaba', sHi: '#fce8ce',
    hOut: '#1c1e2c', hDk: '#28303e', hMid: '#364654', hLt: '#66727a',
    hair: 'pony', cw: 46, jw: 32, chin: 52,
    bw: 2.1, eW: 12.8, eH: 9.8, ir: '#5a9cc4', irD: '#2a475c', irL: '#9ccde4',
    noseW: 9, mW: 19, eyeY: 3,
    lip: '#d0757f', lipD: '#8c3f4c', lipH: '#eda6a9',
    cOut: '#4d5e7f', cDk: '#779fc1', cMid: '#9fdcff', cLt: '#bae3f5', acc: '#ddf3ff',
    band: 1, blush: 1, lash: 1, freckle: 1, bow: 1,
    gOut: '#4d5e7f', gDk: '#779fc1', gMid: '#9fdcff', gLt: '#bae3f5',
  };
  D.brooks = {
    sOut: '#815e4e', sDk: '#cb9776', sMid: '#f4c8a2', sLt: '#f9d7b6', sHi: '#fce5cb',
    hOut: '#0e1c14', hDk: '#122a19', hMid: '#173a1f', hLt: '#456a4c',
    hair: 'shaggy', cw: 47, jw: 34, chin: 51,
    bw: 2.4, eW: 12.6, eH: 9.6, ir: '#4a7a52', irD: '#22381f', irL: '#84b189',
    noseW: 10, mW: 22, eyeY: 3,
    lip: '#cc7078', lipD: '#8a3c48', lipH: '#efa2a4',
    cOut: '#254e3a', cDk: '#2e8242', cMid: '#37b34a', cLt: '#6fc673', acc: '#b9e4c0',
    band: 1, blush: 1, freckle: 1, toothy: 1,
  };
  D.dayne = {
    sOut: '#775444', sDk: '#bd8c64', sMid: '#e4b287', sLt: '#eec7a2', sHi: '#f6dcbf',
    hOut: '#20202a', hDk: '#2c2c36', hMid: '#3a3b42', hLt: '#67686c',
    hair: 'short', cw: 45, jw: 31, chin: 57,
    bw: 2.3, eW: 11.4, eH: 8, ir: '#7b8496', irD: '#3a404c', irL: '#b2b8c4',
    noseW: 14, mW: 21, eyeSp: 1.08,
    lip: '#b76e66', lipD: '#7c3e3e', lipH: '#da9b91',
    cOut: '#534f68', cDk: '#838498', cMid: '#b0b6c4', cLt: '#c6c8cb', acc: '#e3e5ea',
    band: 1, stubble: 1,
  };

  /* ------- campaign cast: ramps lifted from skins-campaign.js ------- */
  D.josh = {
    sOut: '#8a5030', sDk: '#c07f4f', sMid: '#e8b083', sLt: '#f0c69e', sHi: '#f7dabb',
    hOut: '#241609', hDk: '#33210f', hMid: '#57391d', hLt: '#866648',
    hair: 'scruff', cw: 44, jw: 28, chin: 58,
    bw: 3, eW: 11, eH: 7.6, ir: '#3a2a18', irD: '#1a1208', irL: '#74603e',
    noseW: 11, mW: 21,
    lip: '#b06861', lipD: '#78383a', lipH: '#d5968d',
    cOut: '#141220', cDk: '#221f2e', cMid: '#2f2b3c', cLt: '#4a4458', acc: '#ded8e8',
    stubble: 1, print: 1, bolt: '#ffd24a',
  };
  D.damon = {
    sOut: '#71401f', sDk: '#a8703f', sMid: '#d69d6c', sLt: '#e3b78e', sHi: '#efd0ad',
    hOut: '#2c2320', hDk: '#3d3229', hMid: '#655648', hLt: '#8e8070',
    hair: 'comb', cw: 51, jw: 42, chin: 56,
    bw: 4.6, eW: 10.8, eH: 7.2, ir: '#ff6a2a', irD: '#a83208', irL: '#ffd2a0',
    brow: '#4a3a2a', noseW: 16, mW: 26, nostril: 1,
    lip: '#a85a52', lipD: '#6e2f32', lipH: '#cd8a80',
    cOut: '#8f897a', cDk: '#c2bcac', cMid: '#e9e4d8', cLt: '#fbf8f0', acc: '#7e3a44',
    stubble: 1, glow: 1, baseFlush: 1,
  };
  D.petmonster = {
    sOut: '#241a42', sDk: '#4f3e81', sMid: '#6552a4', sLt: '#8a76c6', sHi: '#a996dd',
    hOut: '#241a42', hDk: '#3f2f6b', hMid: '#6552a4', hLt: '#8a76c6',
    hair: 'none', cw: 52, jw: 40, chin: 48,
    bw: 3.2, eW: 14.5, eH: 11.5, ir: '#3f2f6b', irD: '#1a1230', irL: '#7a68b4',
    noseW: 0, mW: 26,
    lip: '#5c2038', lipD: '#3d1526', lipH: '#8a3f56',
    cOut: '#241a42', cDk: '#3f2f6b', cMid: '#4f3e81', cLt: '#7a68b4', acc: '#ff7d1c',
    muzzle: 1, muzO: '#9c8455', muzM: '#f2e3bf', muzL: '#fff7e2',
    horns: 1, plushEar: 1, seam: '#4d3c80', collar: '#ff7d1c',
  };

  /* ===================== ascended (finalForm.look) ==================== */
  function variant(base, over) {
    return Object.assign(Object.assign({}, base), over);
  }
  const ASC = {};
  // THE TODDFATHER — bald, gloriously bearded, shirtless
  ASC.todd = variant(D.todd, {
    hair: 'none', bald: 1, band: 0, bare: 1, stubble: 0, beard: 1,
    bOut: '#2a1218', bDk: '#3a161a', bMid: '#4b1e1f', bLt: '#7a4a42',
    jw: 40, chin: 58, bw: 4.4,
  });
  // XANAX SONYA — serene, gently levitating, violet aura
  ASC.sonya = variant(D.sonya, {
    lidBias: 0.26, calm: 1, aura: 1,
    au1: 'rgba(224,184,255,0.26)', au2: 'rgba(224,184,255,0.15)', au3: 'rgba(224,184,255,0.08)',
  });
  // 3D PRINTER JEROD — the machine frame closes over his head
  ASC.jerod = variant(D.jerod, {
    band: 0, frame: 1,
    gOut: '#4b4760', gDk: '#747588', gMid: '#9aa0ae', gLt: '#b6b8bb',
  });
  // WRENCHY — a golden pipe wrench; the jaws bracket his face
  ASC.jacob = variant(D.jacob, {
    hair: 'none', band: 0, bald: 1, stubble: 0, jaws: 1, aura: 1,
    sOut: '#715a3a', sDk: '#ba9842', sMid: '#ffd24a', sLt: '#ffdf80', sHi: '#ffeaa8',
    lip: '#b8862a', lipD: '#7a5418', lipH: '#e0b45c',
    gOut: '#4b4760', gDk: '#747588', gMid: '#9aa0ae', gLt: '#b6b8bb',
    au1: 'rgba(255,210,74,0.26)', au2: 'rgba(255,210,74,0.14)', au3: 'rgba(255,210,74,0.07)',
  });
  // GIANT CHICKEN — feathers, comb, beak
  ASC.samantha = variant(D.samantha, {
    hair: 'none', band: 0, lash: 0, beak: 1, comb: 1, ruff: 1,
    sOut: '#7e7364', sDk: '#c9c0ae', sMid: '#f6f2e8', sLt: '#faf6ec', sHi: '#fdfaf2',
    cw: 47, jw: 33, chin: 50, bw: 2.2,
    ir: '#c9a23a', irD: '#63500f', irL: '#eed384',
    gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
  });
  // LITTLE BEAR SPECIAL — crowned with a toasted sub loaf
  ASC.cassandra = variant(D.cassandra, {
    hair: 'none', band: 0, loaf: 1,
    gOut: '#7a5424', sub: '#e0a860', gDk: '#a57a52', gMid: '#e0a860', gLt: '#f1d3a5',
    lettuce: '#7dc45f',
  });
  // RICKMOTHY — smaller, weaker and rounder all at once
  ASC.erika = variant(D.erika, {
    cw: 51, jw: 45, chin: 50, jowl: 1,
    eW: 9.8, eH: 7.4, mW: 15, noseW: 13,
  });
  // LEVIATHAN — the wrecking-crew mop, no headband
  ASC.levi = variant(D.levi, { hair: 'mop', band: 0, jw: 41, chin: 58, bw: 4.8, mW: 27 });
  // RYAN DUGAN — the eyeglasses alias
  ASC.ronathon = variant(D.ronathon, { glasses: 1 });
  // FIRETRUCK TIM — the helmet runs a live light bar
  ASC.tim = variant(D.tim, { lightbar: 1, baseFlush: 1 });
  // 8 HOURS OF SLEEP MYAH — fully rested, radiant
  ASC.myah = variant(D.myah, {
    sLt: '#fadec4', sHi: '#fdedd6', aura: 1,
    au1: 'rgba(255,242,184,0.28)', au2: 'rgba(255,242,184,0.16)', au3: 'rgba(255,242,184,0.08)',
  });
  // MECHA HAYES — sealed helmet, cyan visor
  ASC.hayes = variant(D.hayes, {
    hair: 'none', band: 0, blush: 0, freckle: 0, visor: 1,
    gOut: '#45415e', gDk: '#686b84', gMid: '#8a92a8', gLt: '#abaeb7',
    vOut: '#2c5d76', vMid: '#4adbe8', vLt: '#7de3e5',
  });
  // PRINCESS ADDI — coronation crown and a glacial aura
  ASC.addi = variant(D.addi, {
    band: 0, bow: 0, crown: 1, aura: 1,
    gOut: '#715a3a', gDk: '#ba9842', gMid: '#ffd24a', gLt: '#ffdf80',
    au1: 'rgba(191,234,255,0.28)', au2: 'rgba(191,234,255,0.16)', au3: 'rgba(191,234,255,0.08)',
  });
  // KANSAS CITY DAYNE — the cap, and he will not stop talking about it
  ASC.dayne = variant(D.dayne, {
    band: 0, cap: 1,
    gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
  });
  ASC.isla = variant(D.isla, { wobble: 1 });

  /* =========================== expressions ============================
     bi/bo  brow inner / outer end dy (+ pushes DOWN)   bp  inner pinch inward
     ba     one-brow lift (smug)      lt/lb  upper-lid closure / lower-lid raise
     pup    pupil scale               ey   eye-open scale
     m      mouth kind                mo   opening        mc  curve (+ = smile)
     fl flush   tn jaw tension   tr tears   sw sweat   sk shake   bl blinks   */
  const EXPR = {
    neutral: { bi: 0, bo: 0, bp: 0, ba: 0, lt: 0.16, lb: 0.04, pup: 1, ey: 1, m: 'lens', mo: 0, mc: 0.12, fl: 0, tn: 0, tr: 0, sw: 0, sk: 0, bl: 1 },
    angry: { bi: 9, bo: -7, bp: 2, ba: 0, lt: 0.34, lb: 0.20, pup: 0.82, ey: 0.98, m: 'lens', mo: 0, mc: -0.34, fl: 0.34, tn: 0.55, tr: 0, sw: 0, sk: 0, bl: 1 },
    rage: { bi: 15, bo: -11, bp: 3, ba: 0, lt: 0.34, lb: 0.36, pup: 0.50, ey: 1.06, m: 'teeth', mo: 0.9, mc: -0.18, fl: 1, tn: 1, tr: 0, sw: 0.5, sk: 1.2, bl: 0 },
    scared: { bi: -12, bo: -3, bp: 4, ba: 0, lt: 0, lb: 0, pup: 0.42, ey: 1.18, m: 'o', mo: 0.5, mc: -0.2, fl: 0, tn: 0.25, tr: 0, sw: 1, sk: 0.8, bl: 0 },
    smug: { bi: 3, bo: -8, bp: 0, ba: -8, lt: 0.46, lb: 0.26, pup: 1, ey: 0.95, m: 'smirk', mo: 0, mc: 0.34, fl: 0, tn: 0.2, tr: 0, sw: 0, sk: 0, bl: 1 },
    hurt: { bi: -13, bo: 9, bp: 4, ba: 0, lt: 1, lb: 0.5, pup: 1, ey: 0.86, m: 'grit', mo: 0.36, mc: -0.28, fl: 0.2, tn: 0.85, tr: 0, sw: 0.5, sk: 0.5, bl: 0 },
    shout: { bi: 10, bo: -5, bp: 1, ba: 0, lt: 0.06, lb: 0.10, pup: 0.74, ey: 1.1, m: 'shout', mo: 1, mc: 0, fl: 0.38, tn: 0.75, tr: 0, sw: 0, sk: 0.35, bl: 0 },
    sad: { bi: -10, bo: 6, bp: 3, ba: 0, lt: 0.40, lb: 0.12, pup: 1.12, ey: 1.02, m: 'wobble', mo: 0.1, mc: -0.42, fl: 0.1, tn: 0, tr: 1, sw: 0, sk: 0, bl: 1 },
    determined: { bi: 6, bo: 1, bp: 1, ba: 0, lt: 0.28, lb: 0.24, pup: 0.92, ey: 0.98, m: 'firm', mo: 0, mc: -0.05, fl: 0.12, tn: 0.75, tr: 0, sw: 0, sk: 0, bl: 1 },
    surprised: { bi: -13, bo: -12, bp: 2, ba: 0, lt: 0, lb: 0, pup: 0.78, ey: 1.2, m: 'o', mo: 0.55, mc: 0, fl: 0, tn: 0, tr: 0, sw: 0, sk: 0, bl: 0 },
  };

  // per-draw scratch — reused, never reallocated
  const S = {
    d: null, e: null, t: 0, cw: 46, jw: 32, chin: 55, my: 27, nb: 12, mW: 22,
    ex: 19, ey: -6, lt: 0, closed: 0, gaze: 0, flush: 0,
  };

  /* ======================= geometry primitives ======================== */
  // one rounded skull: wide cranium, soft taper to the jaw and chin.
  // headSub appends WITHOUT beginPath so two copies can make an evenodd ring —
  // that ring is the form shadow, and a ring always hugs the contour.
  function headSub(g, cw, jw, chin, dx, dy, s) {
    g.moveTo(dx - cw * 0.97 * s, dy + 4 * s);
    g.bezierCurveTo(dx - (cw + 2) * s, dy - 30 * s, dx - cw * 0.74 * s, dy - 60 * s, dx, dy - 60 * s);
    g.bezierCurveTo(dx + cw * 0.74 * s, dy - 60 * s, dx + (cw + 2) * s, dy - 30 * s, dx + cw * 0.97 * s, dy + 4 * s);
    g.bezierCurveTo(dx + cw * 0.92 * s, dy + 30 * s, dx + (jw + 4) * s, dy + (chin - 14) * s, dx, dy + chin * s);
    g.bezierCurveTo(dx - (jw + 4) * s, dy + (chin - 14) * s, dx - cw * 0.92 * s, dy + 30 * s, dx - cw * 0.97 * s, dy + 4 * s);
    g.closePath();
  }
  function headPath(g, cw, jw, chin) {
    g.beginPath();
    headSub(g, cw, jw, chin, 0, 0, 1);
  }
  // the inner copy must stay strictly inside the outer one or evenodd flips and
  // the "shadow" tears open on the key side — hence the offsets scale with 1-s
  function headRing(g, cw, jw, chin, s) {
    g.beginPath();
    headSub(g, cw, jw, chin, 0, 0, 1);
    headSub(g, cw, jw, chin, -cw * 0.78 * (1 - s), -42 * (1 - s), s);
    g.fill('evenodd');
  }

  // symmetric almond: ~2w wide, ~1.9h tall
  function almond(g, w, h) {
    g.beginPath();
    g.moveTo(-w, 0.8);
    g.bezierCurveTo(-w * 0.52, -h * 1.3, w * 0.52, -h * 1.3, w, -0.8);
    g.bezierCurveTo(w * 0.52, h * 1.22, -w * 0.52, h * 1.22, -w, 0.8);
    g.closePath();
  }

  // solid tapered brow: thickness runs along the brow's own normal, so a steep
  // angle never splits the shape into stray spikes
  function browShape(g, xi, yi, xo, yo, wi, wo, arch) {
    const dx = xo - xi, dy = yo - yi;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const mx = (xi + xo) * 0.5 + nx * arch, my = (yi + yo) * 0.5 + ny * arch;
    const wm = (wi + wo) * 0.5;
    g.beginPath();
    g.moveTo(xi + nx * wi, yi + ny * wi);
    g.quadraticCurveTo(mx + nx * wm, my + ny * wm, xo + nx * wo, yo + ny * wo);
    g.quadraticCurveTo(xo + (nx - ny) * wo * 1.3, yo + (ny + nx) * wo * 1.3, xo - nx * wo, yo - ny * wo);
    g.quadraticCurveTo(mx - nx * wm * 0.9, my - ny * wm * 0.9, xi - nx * wi, yi - ny * wi);
    g.quadraticCurveTo(xi - (nx + ny) * wi * 1.2, yi - (ny - nx) * wi * 1.2, xi + nx * wi, yi + ny * wi);
    g.closePath();
  }

  /* ============================== bust ================================ */
  // shoulders + neck, behind the head
  function drawBody(g, d) {
    const nw = S.jw * 0.6;
    // neck (always one plane darker than the lit face)
    g.fillStyle = d.sDk;
    g.beginPath();
    g.moveTo(-nw, S.chin - 22);
    g.bezierCurveTo(-nw - 2, S.chin + 18, -nw - 5, 78, -nw - 8, 96);
    g.lineTo(nw + 8, 96);
    g.bezierCurveTo(nw + 5, 78, nw + 2, S.chin + 18, nw, S.chin - 22);
    g.closePath();
    g.fill();
    g.strokeStyle = d.sOut; g.lineWidth = 2.6; g.stroke();
    // the chin's cast shadow across the throat
    g.fillStyle = NECKSH;
    g.beginPath();
    g.ellipse(0, S.chin - 4, nw + 3, 15, 0, 0, 7);
    g.fill();
    // shoulders running off the bottom of the frame
    g.fillStyle = d.bare ? d.sMid : d.cMid;
    g.beginPath();
    g.moveTo(-150, 168);
    g.bezierCurveTo(-132, 108, -92, 80, -44, 76);
    g.lineTo(44, 76);
    g.bezierCurveTo(92, 80, 132, 108, 150, 168);
    g.closePath();
    g.fill();
    g.strokeStyle = d.bare ? d.sOut : d.cOut; g.lineWidth = 3; g.stroke();
    // right shoulder in shadow, left shoulder catching the key
    g.save();
    g.beginPath();
    g.moveTo(-150, 168);
    g.bezierCurveTo(-132, 108, -92, 80, -44, 76);
    g.lineTo(44, 76);
    g.bezierCurveTo(92, 80, 132, 108, 150, 168);
    g.closePath();
    g.clip();
    g.fillStyle = SHADE;
    g.beginPath(); g.arc(120, 130, 96, 0, 7); g.fill();
    g.fillStyle = d.bare ? d.sLt : d.cLt;
    g.beginPath(); g.ellipse(-88, 106, 40, 20, -0.45, 0, 7); g.fill();
    if (d.print) {
      g.fillStyle = d.acc;
      g.beginPath(); g.ellipse(0, 150, 34, 22, 0, 0, 7); g.fill();
      g.fillStyle = d.bolt;
      g.beginPath();
      g.moveTo(2, 132); g.lineTo(-9, 152); g.lineTo(0, 152); g.lineTo(-3, 168);
      g.lineTo(11, 146); g.lineTo(2, 146);
      g.closePath(); g.fill();
    }
    g.restore();
    // collar
    if (!d.bare) {
      g.strokeStyle = d.cDk; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(-46, 78);
      g.quadraticCurveTo(0, 104, 46, 78);
      g.stroke();
    }
    if (d.collar) {
      g.fillStyle = d.collar; g.strokeStyle = d.cOut; g.lineWidth = 2.4;
      g.beginPath(); g.roundRect(-52, 74, 104, 16, 7); g.fill(); g.stroke();
    }
  }

  // one ear, authored on the right and mirrored by sd
  function drawEar(g, d, sd) {
    g.save();
    g.translate(sd * (S.cw - 4), 2);
    g.scale(sd, 1);
    g.fillStyle = d.sMid; g.strokeStyle = d.sOut; g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(-4, -13);
    g.bezierCurveTo(11, -15, 14, 3, 6, 14);
    g.bezierCurveTo(1, 19, -5, 15, -5, 10);
    g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = d.sDk; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-1, -6);
    g.quadraticCurveTo(8, -2, 4, 8);
    g.stroke();
    g.restore();
  }

  // plush ears for the monster
  function drawPlushEar(g, d, sd) {
    g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 3;
    g.beginPath(); g.ellipse(sd * (S.cw - 4), -22, 13, 17, sd * 0.3, 0, 7); g.fill(); g.stroke();
    g.fillStyle = d.hLt;
    g.beginPath(); g.ellipse(sd * (S.cw - 6), -24, 6, 9, sd * 0.3, 0, 7); g.fill();
  }

  // skull: flat base, form shadow right + under the jaw, key light upper-left
  function drawHead(g, d) {
    const cw = S.cw, jw = S.jw, chin = S.chin;
    headPath(g, cw, jw, chin);
    g.fillStyle = d.sMid;
    g.fill();
    g.save();
    headPath(g, cw, jw, chin);
    g.clip();
    // form shadow: two contour rings, offset up-left so the mass falls to the
    // right and under the jaw. Rings never cut a hard edge across the cheek.
    g.fillStyle = SHADE;
    headRing(g, cw, jw, chin, 0.945);
    headRing(g, cw, jw, chin, 0.86);
    // ONE lit accent on the brow ridge — everything else is left flat, because
    // stacking translucent patches is what makes a face look quilted
    g.fillStyle = d.sLt;
    g.beginPath(); g.ellipse(-9, -33, cw * 0.48, 12, -0.13, 0, 7); g.fill();
    g.fillStyle = d.sHi;
    g.beginPath(); g.ellipse(-14, -36, cw * 0.28, 6, -0.15, 0, 7); g.fill();
    // brow ridge casts over the eyes and seats them in the skull
    g.fillStyle = CREASE;
    g.beginPath(); g.ellipse(-S.ex, S.ey - 9, 15, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(S.ex, S.ey - 9, 15, 7, 0, 0, 7); g.fill();
    // jowls read as weight, not a second chin
    if (d.jowl) {
      g.fillStyle = JAWSH;
      g.beginPath(); g.ellipse(-jw + 2, chin - 20, 15, 13, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(jw - 2, chin - 20, 15, 13, 0, 0, 7); g.fill();
    }
    // beard shadow: ONE tinted region over the jaw, kept clear of the nose
    if (d.stubble) {
      g.fillStyle = STUB;
      g.beginPath();
      g.moveTo(-jw - 8, 4);
      g.quadraticCurveTo(-jw - 6, chin, 0, chin + 6);
      g.quadraticCurveTo(jw + 6, chin, jw + 8, 4);
      g.quadraticCurveTo(0, S.nb + 12, -jw - 8, 4);
      g.closePath();
      g.fill();
      // moustache shadow sits under the nose, never on it
      g.beginPath();
      g.ellipse(0, S.my - 7, S.mW * 0.74, 6, 0, 0, 7);
      g.fill();
    }
    // cheek colour
    if (d.blush) {
      g.fillStyle = BLUSH;
      g.beginPath(); g.ellipse(-27, 20, 12, 8, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(27, 20, 12, 8, 0, 0, 7); g.fill();
    }
    if (S.flush > 0) {
      // flushed skin covers the whole face — an ellipse would show its own edge
      g.fillStyle = S.flush > 0.6 ? FLUSH2 : FLUSH1;
      g.fillRect(-cw - 4, -66, cw * 2 + 8, chin + 74);
      g.fillStyle = FLUSH1;
      g.beginPath(); g.ellipse(-26, 12, 16, 10, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(26, 12, 16, 10, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(0, S.nb - 2, 12, 9, 0, 0, 7); g.fill();
    }
    if (d.freckle) {
      g.fillStyle = FRECK;
      for (let i = 0; i < FRECKLES.length; i += 2) {
        g.beginPath(); g.arc(FRECKLES[i], FRECKLES[i + 1] + S.ey + 6, 1.7, 0, 7); g.fill();
      }
    }
    // warm rim, upper-left
    g.strokeStyle = RIM; g.lineWidth = 5;
    g.beginPath(); g.arc(0, -14, cw - 3, 3.3, 4.5); g.stroke();
    g.restore();
    headPath(g, cw, jw, chin);
    g.strokeStyle = d.sOut; g.lineWidth = 3; g.stroke();
    if (d.seam) {
      g.strokeStyle = d.seam; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -58); g.lineTo(0, -40); g.stroke();
    }
  }

  /* =============================== eyes =============================== */
  // squeezed-shut / blinking eye: a curved line, never a bare circle
  function closedEye(g, d, w, h, bow, sd) {
    g.strokeStyle = d.hOut; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath();
    if (bow > 0) {
      // squeezed shut: a hard clenched crease, outer end dragged down
      g.lineJoin = 'round';
      g.moveTo(-sd * w, 1);
      g.lineTo(-sd * w * 0.15, -h * 0.9);
      g.lineTo(sd * (w + 1), 5);
    } else {
      g.moveTo(-w, -1);
      g.quadraticCurveTo(0, h * 1.5, w, -1);
    }
    g.stroke();
    if (bow > 0) {
      g.strokeStyle = CREASE; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(sd * (w + 4), 4); g.lineTo(sd * (w + 9), 1);
      g.moveTo(sd * (w + 4), 9); g.lineTo(sd * (w + 8), 7);
      g.stroke();
    }
  }

  // ONE eye construction, mirrored about x=0 by sd. Light stays upper-left.
  function drawEye(g, d, e, sd) {
    const w = d.eW * e.ey, h = d.eH * e.ey;
    g.save();
    g.translate(sd * S.ex, S.ey);
    g.rotate(sd * 0.06);
    // socket: seats the eye in the skull
    g.fillStyle = CREASE;
    g.beginPath(); g.ellipse(0, -1, w + 4, h + 5, 0, 0, 7); g.fill();
    if (S.closed) {
      closedEye(g, d, w, h, S.closed, sd);
      g.restore();
      return;
    }
    // 1 sclera
    almond(g, w, h);
    g.fillStyle = EYEW;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = LID_SH;
    g.fillRect(-w - 2, -h * 1.5, w * 2 + 4, h * 0.85);
    // 2 iris, sitting on the sclera's lower middle
    const ir = h * 0.9, iy = h * 0.2, ix = S.gaze;
    g.fillStyle = d.ir;
    g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
    g.fillStyle = d.irL;
    g.beginPath(); g.arc(ix, iy + ir * 0.3, ir * 0.66, 0, 7); g.fill();
    g.fillStyle = d.ir;
    g.beginPath(); g.arc(ix, iy - ir * 0.1, ir * 0.72, 0, 7); g.fill();
    g.strokeStyle = d.irD; g.lineWidth = 1.6;
    g.beginPath(); g.arc(ix, iy, ir - 0.7, 0, 7); g.stroke();
    // 3 pupil
    g.fillStyle = INK;
    g.beginPath(); g.arc(ix, iy, ir * 0.46 * e.pup, 0, 7); g.fill();
    // 4 ONE catchlight at the iris's upper-left
    g.fillStyle = CATCH;
    g.beginPath(); g.arc(ix - ir * 0.36, iy - ir * 0.4, ir * 0.3, 0, 7); g.fill();
    g.fillStyle = CATCH2;
    g.beginPath(); g.arc(ix + ir * 0.4, iy + ir * 0.34, ir * 0.16, 0, 7); g.fill();
    // 5 upper eyelid — filled skin that CUTS the sclera
    const ly = -h + S.lt * (h * 2.05);
    g.fillStyle = d.sLt;
    g.beginPath();
    g.moveTo(-w - 3, ly - 1.6);
    g.quadraticCurveTo(0, ly + 2.8, w + 3, ly - 1.6);
    g.lineTo(w + 3, -h * 2 - 6);
    g.lineTo(-w - 3, -h * 2 - 6);
    g.closePath();
    g.fill();
    // lower lid
    if (e.lb > 0) {
      const by = h - e.lb * (h * 1.4);
      g.fillStyle = d.sMid;
      g.beginPath();
      g.moveTo(-w - 3, by + 1.6);
      g.quadraticCurveTo(0, by - 2.6, w + 3, by + 1.6);
      g.lineTo(w + 3, h * 2 + 6);
      g.lineTo(-w - 3, h * 2 + 6);
      g.closePath();
      g.fill();
    }
    g.restore();
    // lash line along the lid's lower edge
    g.strokeStyle = d.hOut;
    g.lineWidth = d.lash ? 3.6 : 2.6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-w - 1, ly - 1.6);
    g.quadraticCurveTo(0, ly + 2.8, w + 1, ly - 1.6);
    g.stroke();
    if (d.lash) {
      g.fillStyle = d.hOut;
      g.beginPath();
      g.moveTo(sd * w, ly - 1);
      g.lineTo(sd * (w + 7), ly - 6);
      g.lineTo(sd * (w - 1), ly + 2.4);
      g.closePath(); g.fill();
    }
    // lid crease + lower rim
    g.strokeStyle = CREASE; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-w + 1, ly - 6.5);
    g.quadraticCurveTo(0, ly - 2.6, w - 1, ly - 6.5);
    g.stroke();
    g.strokeStyle = LOWLID; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-w + 2, h * 0.78);
    g.quadraticCurveTo(0, h * 1.24, w - 2, h * 0.78);
    g.stroke();
    if (d.glow) {
      g.fillStyle = EYEGLOW;
      g.beginPath(); g.arc(0, h * 0.16, h * 1.5, 0, 7); g.fill();
    }
    g.restore();
  }

  function drawBrow(g, d, e, sd) {
    const bc = d.brow || d.hDk;
    const lift = sd > 0 ? e.ba : 0;
    const xi = sd * (S.ex - 12 + e.bp), xo = sd * (S.ex + 12);
    const y0 = S.ey - 15 + (d.eH - 8) * 0.9;
    g.fillStyle = bc;
    browShape(g, xi, y0 + e.bi + lift, xo, y0 + e.bo + lift, d.bw, d.bw * 0.42, 2.4);
    g.fill();
  }

  /* =============================== nose =============================== */
  function drawNose(g, d) {
    if (!d.noseW) return;
    const nw = d.noseW * 0.5, nb = S.nb;
    // one small filled wedge, narrow at the bridge, rounded at the tip
    g.fillStyle = d.sDk;
    g.beginPath();
    g.moveTo(-1.8, nb - 13);
    g.bezierCurveTo(-nw * 0.6, nb - 7, -nw, nb - 4, -nw, nb);
    g.bezierCurveTo(-nw, nb + 4.6, nw, nb + 4.6, nw, nb);
    g.bezierCurveTo(nw, nb - 4, nw * 0.6, nb - 7, 1.8, nb - 13);
    g.closePath();
    g.fill();
    // ONE soft shadow down the right side, plus the tip's cast shadow
    g.fillStyle = NOSE_SH;
    g.beginPath();
    g.moveTo(0.4, nb - 12);
    g.bezierCurveTo(nw * 0.62, nb - 6, nw, nb - 4, nw, nb);
    g.bezierCurveTo(nw, nb + 4.6, 0.4, nb + 4.6, 0.4, nb + 4.6);
    g.closePath();
    g.fill();
    g.beginPath();
    g.ellipse(0, nb + 5.4, nw * 1.02, 2.6, 0, 0, 7);
    g.fill();
    // rounded tip catching the key light
    g.fillStyle = NOSE_HI;
    g.beginPath(); g.ellipse(-nw * 0.28, nb - 0.6, nw * 0.44, 2.8, -0.28, 0, 7); g.fill();
    if (d.nostril) {
      g.fillStyle = d.sOut;
      g.beginPath(); g.ellipse(-nw * 0.6, nb + 1.4, 2.2, 1.4, 0.35, 0, 7); g.fill();
      g.beginPath(); g.ellipse(nw * 0.6, nb + 1.4, 2.2, 1.4, -0.35, 0, 7); g.fill();
    }
  }

  /* =============================== mouth ============================== */
  function lipShine(g, hw, my, th) {
    g.fillStyle = LIPHI;
    g.beginPath();
    g.moveTo(-hw * 0.66, my + th * 0.7);
    g.quadraticCurveTo(0, my + th + 4, hw * 0.66, my + th * 0.7);
    g.quadraticCurveTo(0, my + th + 1, -hw * 0.66, my + th * 0.7);
    g.closePath();
    g.fill();
  }

  function drawMouth(g, d, e) {
    const hw = d.mW * 0.5, my = S.my;
    const k = e.m;
    if (k === 'lens' || k === 'firm' || k === 'smirk') {
      const th = k === 'firm' ? 4 : 3.3;
      const l1 = k === 'smirk' ? e.mc * hw * 0.7 : e.mc * hw * 0.45;
      const l2 = k === 'smirk' ? -e.mc * hw * 0.1 : e.mc * hw * 0.45;
      // upper lip plane, then the mouth line itself sits inside it
      g.fillStyle = d.lip;
      g.beginPath();
      g.moveTo(-hw - 1, my - l1);
      g.quadraticCurveTo(0, my - th - 5.5, hw + 1, my - l2);
      g.quadraticCurveTo(0, my - th * 0.4, -hw - 1, my - l1);
      g.closePath();
      g.fill();
      g.fillStyle = d.lipD;
      g.beginPath();
      g.moveTo(-hw, my - l1);
      g.quadraticCurveTo(0, my + th, hw, my - l2);
      g.quadraticCurveTo(0, my - th * 0.55, -hw, my - l1);
      g.closePath();
      g.fill();
      lipShine(g, hw, my, th);
      if (k === 'smirk') {
        g.strokeStyle = CREASE; g.lineWidth = 2.2; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(-hw - 1, my - l1 - 1);
        g.quadraticCurveTo(-hw - 5, my - l1 - 5, -hw - 5, my - l1 - 9);
        g.stroke();
      }
      return;
    }
    if (k === 'wobble') {
      const l = e.mc * hw * 0.5;
      g.fillStyle = d.lipD;
      g.beginPath();
      g.moveTo(-hw, my - l);
      g.quadraticCurveTo(-hw * 0.5, my + 5.5, 0, my + 2.6);
      g.quadraticCurveTo(hw * 0.5, my + 0.2, hw, my - l);
      g.quadraticCurveTo(hw * 0.5, my - 4.4, 0, my - 2);
      g.quadraticCurveTo(-hw * 0.5, my + 0.4, -hw, my - l);
      g.closePath();
      g.fill();
      lipShine(g, hw, my, 3);
      return;
    }
    if (k === 'o') {
      const oh = 5 + e.mo * 11;
      g.fillStyle = d.lipD;
      g.beginPath(); g.ellipse(0, my + 2, hw * 0.46, oh, 0, 0, 7); g.fill();
      g.fillStyle = MOUTH_IN;
      g.beginPath(); g.ellipse(0, my + 2.4, hw * 0.46 - 2.6, oh - 2.6, 0, 0, 7); g.fill();
      g.fillStyle = TONGUE;
      g.beginPath(); g.ellipse(0, my + oh - 1.5, hw * 0.28, oh * 0.3, 0, 0, 7); g.fill();
      lipShine(g, hw * 0.7, my + oh - 1, 2.2);
      return;
    }
    if (k === 'shout') {
      const oh = 12 + e.mo * 12;
      g.fillStyle = d.lipD;
      g.beginPath();
      g.moveTo(-hw, my - 8);
      g.quadraticCurveTo(0, my - 12, hw, my - 8);
      g.quadraticCurveTo(hw * 0.7, my + oh, 0, my + oh);
      g.quadraticCurveTo(-hw * 0.7, my + oh, -hw, my - 8);
      g.closePath();
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = MOUTH_IN;
      g.fillRect(-hw, my - 6, hw * 2, oh + 12);
      // ONE rounded rect of upper teeth, tucked under the lip
      g.fillStyle = TEETH;
      g.beginPath(); g.roundRect(-hw * 0.7, my - 11, hw * 1.4, 9, 3); g.fill();
      g.fillStyle = TEETH_SH;
      g.fillRect(-hw * 0.7, my - 3.4, hw * 1.4, 1.4);
      g.fillStyle = TONGUE;
      g.beginPath(); g.ellipse(0, my + oh + 3, hw * 0.62, oh * 0.5, 0, 0, 7); g.fill();
      g.restore();
      return;
    }
    if (k === 'teeth') {
      const oh = 8 + e.mo * 9;
      g.fillStyle = d.lipD;
      g.beginPath();
      g.moveTo(-hw - 2, my - 5);
      g.quadraticCurveTo(0, my - 11, hw + 2, my - 5);
      g.quadraticCurveTo(hw * 0.6, my + oh + 5, 0, my + oh + 3);
      g.quadraticCurveTo(-hw * 0.6, my + oh + 5, -hw - 2, my - 5);
      g.closePath();
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = MOUTH_IN;
      g.fillRect(-hw - 2, my - 8, hw * 2 + 4, oh + 16);
      g.fillStyle = TEETH;
      g.beginPath(); g.roundRect(-hw * 0.8, my - 11, hw * 1.6, 10, 3); g.fill();
      g.beginPath(); g.roundRect(-hw * 0.62, my + oh - 1, hw * 1.24, 8, 3); g.fill();
      g.fillStyle = TEETH_SH;
      g.fillRect(-hw * 0.8, my - 2.6, hw * 1.6, 1.6);
      g.restore();
      return;
    }
    // grit — a wide clenched grimace: corners level, one tooth row, teeth met
    const oh = 4 + e.mo * 5;
    g.fillStyle = d.lipD;
    g.beginPath();
    g.moveTo(-hw - 5, my + 7);
    g.quadraticCurveTo(0, my - oh - 4, hw + 5, my + 7);
    g.quadraticCurveTo(hw * 0.5, my + oh + 8, 0, my + oh + 8);
    g.quadraticCurveTo(-hw * 0.5, my + oh + 8, -hw - 5, my + 7);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = MOUTH_IN;
    g.fillRect(-hw - 6, my - oh - 6, hw * 2 + 12, oh * 2 + 20);
    g.fillStyle = TEETH;
    g.beginPath(); g.roundRect(-hw * 0.66, my - oh + 1, hw * 1.32, oh + 3, 2); g.fill();
    g.fillStyle = TEETH_SH;
    g.fillRect(-hw * 0.66, my + 1.4, hw * 1.32, 1.8);
    g.restore();
    // corner pull: the lips are dragged back, not smiling
    g.strokeStyle = CREASE; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-hw - 5, my + 7); g.lineTo(-hw - 11, my + 12);
    g.moveTo(hw + 5, my + 7); g.lineTo(hw + 11, my + 12);
    g.stroke();
  }

  /* =========================== facial hair ============================ */
  // a moustache sits ON the upper lip, so it draws AFTER the mouth
  function drawMoustache(g, d, col, out, lit, w) {
    g.fillStyle = col; g.strokeStyle = out; g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-w, S.my - 11);
    g.quadraticCurveTo(-w * 0.42, S.my - 14, 0, S.my - 7);
    g.quadraticCurveTo(w * 0.42, S.my - 14, w, S.my - 11);
    g.quadraticCurveTo(w * 0.6, S.my - 1, 0, S.my - 3);
    g.quadraticCurveTo(-w * 0.6, S.my - 1, -w, S.my - 11);
    g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = lit;
    g.beginPath(); g.ellipse(-w * 0.46, S.my - 9, 5, 1.8, -0.22, 0, 7); g.fill();
  }

  function drawFacialHair(g, d) {
    if (d.beard) {
      g.fillStyle = d.bOut;
      g.beginPath();
      g.moveTo(-S.jw - 12, 0);
      g.bezierCurveTo(-S.jw - 14, S.chin + 4, -20, S.chin + 26, 0, S.chin + 26);
      g.bezierCurveTo(20, S.chin + 26, S.jw + 14, S.chin + 4, S.jw + 12, 0);
      g.quadraticCurveTo(S.jw * 0.5, 16, 0, 12);
      g.quadraticCurveTo(-S.jw * 0.5, 16, -S.jw - 12, 0);
      g.closePath();
      g.fill();
      g.fillStyle = d.bMid;
      g.beginPath();
      g.moveTo(-S.jw - 8, 2);
      g.bezierCurveTo(-S.jw - 10, S.chin + 2, -18, S.chin + 21, 0, S.chin + 21);
      g.bezierCurveTo(18, S.chin + 21, S.jw + 10, S.chin + 2, S.jw + 8, 2);
      g.quadraticCurveTo(S.jw * 0.5, 18, 0, 14);
      g.quadraticCurveTo(-S.jw * 0.5, 18, -S.jw - 8, 2);
      g.closePath();
      g.fill();
      g.strokeStyle = d.bLt; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-S.jw - 2, 10);
      g.quadraticCurveTo(-S.jw + 2, S.chin - 2, -14, S.chin + 12);
      g.stroke();
    }
  }

  /* =============================== hair =============================== */
  // back mass, drawn behind the head
  function drawHairBack(g, d) {
    const st = d.hair;
    if (st === 'pony') {
      g.fillStyle = d.hDk; g.strokeStyle = d.hOut; g.lineWidth = 3;
      g.beginPath(); g.ellipse(-S.cw - 12, 18, 15, 32, 0.28, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.hMid;
      g.beginPath(); g.ellipse(-S.cw - 13, 12, 9, 21, 0.28, 0, 7); g.fill();
    } else if (st === 'long') {
      g.fillStyle = d.hDk; g.strokeStyle = d.hOut; g.lineWidth = 3;
      g.beginPath(); g.ellipse(-S.cw - 4, 30, 19, 48, 0.1, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(S.cw + 4, 32, 18, 46, -0.1, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.hMid;
      g.beginPath(); g.ellipse(-S.cw - 6, 24, 12, 36, 0.1, 0, 7); g.fill();
      g.beginPath(); g.ellipse(S.cw + 5, 26, 11, 34, -0.1, 0, 7); g.fill();
    }
  }

  // the dome + a swept, asymmetric hairline. Never two matched top points.
  function hairCap(g, cw, pad, hl) {
    const w = cw + pad;
    g.beginPath();
    g.moveTo(-w, 6);
    g.bezierCurveTo(-w - 2, -32, -w * 0.74, -62 - pad, 0, -62 - pad);
    g.bezierCurveTo(w * 0.74, -62 - pad, w + 2, -32, w, 6);
    g.lineTo(w - 8, -4);
    g.quadraticCurveTo(w - 14, -24, 6, hl);
    g.quadraticCurveTo(-14, hl - 3, -w + 18, -13);
    g.quadraticCurveTo(-w + 8, -6, -w + 2, 2);
    g.closePath();
  }

  function clumps(g, arr, k, off) {
    for (let i = 0; i < arr.length; i += 3) {
      g.beginPath();
      g.arc(arr[i] * k, arr[i + 1], arr[i + 2] + off, 0, 7);
      g.fill();
    }
  }

  function drawHair(g, d) {
    const st = d.hair;
    if (st === 'none') {
      if (d.bald) {
        g.strokeStyle = SHEEN; g.lineWidth = 5;
        g.beginPath(); g.arc(-4, -22, S.cw - 12, 3.5, 4.4); g.stroke();
      }
      return;
    }
    const cw = S.cw, k = cw / 46;
    const hl = st === 'comb' ? -36 : -30;
    // outline halo, then the mass
    g.fillStyle = d.hOut;
    if (st === 'spiky') {
      for (let i = 0; i < SPIKE.length; i += 5) {
        const bx = SPIKE[i] * k, by = SPIKE[i + 1], tx = SPIKE[i + 2] * k, ty = SPIKE[i + 3], hwd = SPIKE[i + 4] + 2.5;
        g.beginPath();
        g.moveTo(bx - hwd, by + 3);
        g.quadraticCurveTo(bx - hwd * 0.2, (by + ty) * 0.5, tx, ty);
        g.quadraticCurveTo(bx + hwd * 0.6, (by + ty) * 0.5 + 5, bx + hwd, by + 5);
        g.closePath();
        g.fill();
      }
    } else if (st === 'shaggy') clumps(g, SHAG, k, 3);
    else if (st === 'mop') clumps(g, MOP, k, 3);
    else if (st === 'scruff') clumps(g, SCRUFF, k, 3);
    else if (st === 'wisp') {
      g.strokeStyle = d.hOut; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-4, -46); g.quadraticCurveTo(6, -62, -6, -66); g.stroke();
    } else clumps(g, BUMP, k, 3);
    if (st !== 'wisp') {
      hairCap(g, cw, 3.5, hl + 2);
      g.fill();
    }
    // the mass
    g.fillStyle = d.hMid;
    if (st !== 'wisp') {
      hairCap(g, cw, 0, hl);
      g.fill();
    }
    if (st === 'spiky') {
      for (let i = 0; i < SPIKE.length; i += 5) {
        const bx = SPIKE[i] * k, by = SPIKE[i + 1], tx = SPIKE[i + 2] * k, ty = SPIKE[i + 3], hwd = SPIKE[i + 4];
        g.beginPath();
        g.moveTo(bx - hwd, by + 3);
        g.quadraticCurveTo(bx - hwd * 0.2, (by + ty) * 0.5, tx, ty);
        g.quadraticCurveTo(bx + hwd * 0.6, (by + ty) * 0.5 + 5, bx + hwd, by + 5);
        g.closePath();
        g.fill();
      }
    } else if (st === 'shaggy') clumps(g, SHAG, k, 0);
    else if (st === 'mop') clumps(g, MOP, k, 0);
    else if (st === 'scruff') clumps(g, SCRUFF, k, 0);
    else if (st === 'wisp') {
      g.strokeStyle = d.hMid; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-4, -45); g.quadraticCurveTo(5, -60, -5, -64); g.stroke();
    } else clumps(g, BUMP, k, 0);
    if (st === 'pony') {
      // gathered sweep + the tie
      g.fillStyle = d.hMid;
      g.beginPath(); g.ellipse(-cw + 4, -14, 12, 20, 0.35, 0, 7); g.fill();
      g.fillStyle = d.cMid; g.strokeStyle = d.cOut; g.lineWidth = 2;
      g.beginPath(); g.ellipse(-cw - 4, -2, 7, 5, 0.5, 0, 7); g.fill(); g.stroke();
    }
    if (st === 'comb') {
      // combed over: one strong sweep, a visible part on the key side
      g.strokeStyle = d.hDk; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-cw + 14, -40); g.quadraticCurveTo(0, -52, cw - 16, -32); g.stroke();
      g.beginPath(); g.moveTo(-cw + 12, -30); g.quadraticCurveTo(-4, -44, cw - 14, -24); g.stroke();
    }
    if (st === 'wisp') return;
    // ONE lighter highlight band across the top-left
    g.save();
    hairCap(g, cw, 3.5, hl + 2);
    g.clip();
    g.strokeStyle = d.hLt; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(-2, -20, cw - 6, 3.46, 4.36); g.stroke();
    g.fillStyle = HAIRSH;
    g.beginPath(); g.arc(cw * 0.85, -22, cw * 0.7, 0, 7); g.fill();
    g.restore();
  }

  /* =========================== accessories ============================ */
  function drawGear(g, d) {
    const cw = S.cw;
    if (d.band) {
      g.fillStyle = d.cMid;
      g.beginPath();
      g.moveTo(-cw - 1, -18);
      g.quadraticCurveTo(0, -56, cw + 1, -18);
      g.lineTo(cw + 1, -28);
      g.quadraticCurveTo(0, -64, -cw - 1, -28);
      g.closePath();
      g.fill();
      g.strokeStyle = d.cOut; g.lineWidth = 2.6; g.stroke();
      g.save();
      g.beginPath();
      g.moveTo(-cw - 1, -18);
      g.quadraticCurveTo(0, -56, cw + 1, -18);
      g.lineTo(cw + 1, -28);
      g.quadraticCurveTo(0, -64, -cw - 1, -28);
      g.closePath();
      g.clip();
      g.fillStyle = d.cLt;
      g.beginPath(); g.ellipse(-24, -48, 20, 6, 0.28, 0, 7); g.fill();
      g.fillStyle = SHADE;
      g.beginPath(); g.arc(cw, -22, 26, 0, 7); g.fill();
      g.restore();
      // knot + one tail hanging off the key side
      g.fillStyle = d.cDk; g.strokeStyle = d.cOut; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-cw - 1, -32);
      g.quadraticCurveTo(-cw - 12, -22, -cw - 14, -4);
      g.lineTo(-cw - 4, -2);
      g.quadraticCurveTo(-cw - 2, -16, -cw + 4, -24);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.cMid;
      g.beginPath(); g.ellipse(-cw - 2, -28, 8, 7, 0.5, 0, 7); g.fill(); g.stroke();
    }
    if (d.bow) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-cw + 6, -44);
      g.lineTo(-cw - 16, -56); g.lineTo(-cw - 14, -36);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(-cw + 6, -44);
      g.lineTo(-cw + 20, -60); g.lineTo(-cw + 24, -42);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.arc(-cw + 6, -46, 5, 0, 7); g.fill();
      g.strokeStyle = d.gOut; g.lineWidth = 2; g.stroke();
    }
    if (d.helmet) {
      // wide brim first, then the dome sits on it
      g.fillStyle = d.gDk; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-cw - 15, -30);
      g.quadraticCurveTo(0, -20, cw + 15, -30);
      g.quadraticCurveTo(0, -48, -cw - 15, -30);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gMid;
      g.beginPath();
      g.moveTo(-cw - 1, -38);
      g.bezierCurveTo(-cw + 1, -74, cw - 1, -74, cw + 1, -38);
      g.quadraticCurveTo(0, -30, -cw - 1, -38);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-19, -56, 14, 6, 0.32, 0, 7); g.fill();
      // front shield
      g.fillStyle = d.acc; g.strokeStyle = d.gOut; g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(-11, -62); g.lineTo(11, -62);
      g.quadraticCurveTo(11, -44, 0, -39);
      g.quadraticCurveTo(-11, -44, -11, -62);
      g.closePath();
      g.fill(); g.stroke();
      if (d.lightbar) {
        g.fillStyle = ((S.t * 5) | 0) % 2 ? BAR_A : BAR_B;
        g.beginPath(); g.roundRect(-16, -78, 32, 9, 4); g.fill();
        g.strokeStyle = d.gOut; g.lineWidth = 2; g.stroke();
      }
    }
    if (d.cap) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-cw - 6, -22);
      g.bezierCurveTo(-cw - 4, -62, cw + 4, -62, cw + 6, -22);
      g.quadraticCurveTo(0, -12, -cw - 6, -22);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gDk;
      g.beginPath();
      g.moveTo(2, -26);
      g.bezierCurveTo(cw + 22, -28, cw + 26, -14, cw + 10, -10);
      g.quadraticCurveTo(cw - 6, -14, 2, -18);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-20, -46, 16, 7, 0.3, 0, 7); g.fill();
      g.fillStyle = d.acc;
      g.beginPath(); g.arc(-2, -44, 4, 0, 7); g.fill();
    }
    if (d.crown) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(CROWN[0], CROWN[1]);
      for (let i = 2; i < CROWN.length; i += 2) g.lineTo(CROWN[i], CROWN[i + 1]);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.fillRect(-28, -50, 20, 4);
      g.fillStyle = d.acc;
      g.beginPath(); g.arc(0, -55, 4.5, 0, 7); g.fill();
    }
    if (d.frame) {
      g.strokeStyle = d.gMid; g.lineWidth = 7;
      g.beginPath();
      g.moveTo(-cw - 14, 40); g.lineTo(-cw - 14, -56); g.lineTo(cw + 14, -56); g.lineTo(cw + 14, 40);
      g.stroke();
      g.strokeStyle = d.gLt; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-cw - 12, 38); g.lineTo(-cw - 12, -54); g.lineTo(cw - 4, -54);
      g.stroke();
      g.fillStyle = d.gDk; g.strokeStyle = d.gOut; g.lineWidth = 2.4;
      g.beginPath(); g.roundRect(-14, -66, 28, 16, 4); g.fill(); g.stroke();
      g.fillStyle = d.cMid;
      g.beginPath(); g.arc(0, -48, 3.4, 0, 7); g.fill();
    }
    if (d.jaws) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath(); g.roundRect(-cw - 22, -50, 16, 96, 5); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(cw + 6, -50, 16, 96, 5); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.fillRect(-cw - 19, -46, 5, 88);
    }
    if (d.visor) {
      // a SEALED helmet — it has to reach the jaw or it reads as a headband
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-cw - 6, 10);
      g.bezierCurveTo(-cw - 10, -94, cw + 10, -94, cw + 6, 10);
      g.bezierCurveTo(cw + 2, S.chin - 2, S.jw, S.chin + 12, 0, S.chin + 12);
      g.bezierCurveTo(-S.jw, S.chin + 12, -cw - 2, S.chin - 2, -cw - 6, 10);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-20, -42, 16, 8, 0.3, 0, 7); g.fill();
      g.fillStyle = d.vOut; g.strokeStyle = d.vOut; g.lineWidth = 3;
      g.beginPath(); g.roundRect(-cw + 4, -22, cw * 2 - 8, 28, 10); g.fill(); g.stroke();
      g.fillStyle = d.vMid;
      g.beginPath(); g.roundRect(-cw + 7, -19, cw * 2 - 14, 22, 8); g.fill();
      g.fillStyle = d.vLt;
      g.beginPath(); g.ellipse(-16, -12, 14, 4, -0.2, 0, 7); g.fill();
      // breather grille where the mouth would be
      g.fillStyle = d.gDk; g.strokeStyle = d.gOut; g.lineWidth = 2.4;
      g.beginPath(); g.roundRect(-16, S.my - 6, 32, 15, 5); g.fill(); g.stroke();
      g.fillStyle = d.gOut;
      g.fillRect(-11, S.my - 2, 22, 2.4);
      g.fillRect(-11, S.my + 3, 22, 2.4);
    }
    if (d.glasses) {
      g.strokeStyle = GLASSR; g.lineWidth = 3.4;
      g.fillStyle = GLASSF;
      g.beginPath(); g.arc(-S.ex, S.ey, 15, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(S.ex, S.ey, 15, 0, 7); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(-S.ex + 15, S.ey - 1); g.lineTo(S.ex - 15, S.ey - 1);
      g.moveTo(-S.ex - 15, S.ey - 2); g.lineTo(-S.cw + 2, S.ey - 6);
      g.moveTo(S.ex + 15, S.ey - 2); g.lineTo(S.cw - 2, S.ey - 6);
      g.stroke();
      g.strokeStyle = SHEEN; g.lineWidth = 3;
      g.beginPath(); g.arc(-S.ex, S.ey, 10, 3.5, 4.4); g.stroke();
      g.beginPath(); g.arc(S.ex, S.ey, 10, 3.5, 4.4); g.stroke();
    }
    if (d.comb) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-20, -50);
      g.quadraticCurveTo(-14, -70, -4, -54);
      g.quadraticCurveTo(4, -74, 12, -52);
      g.quadraticCurveTo(20, -68, 24, -46);
      g.closePath();
      g.fill(); g.stroke();
    }
    if (d.ruff) {
      g.fillStyle = d.sLt; g.strokeStyle = d.sOut; g.lineWidth = 2.6;
      g.beginPath(); g.arc(-40, 74, 17, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(-12, 82, 19, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(18, 80, 18, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(44, 72, 16, 0, 7); g.fill(); g.stroke();
    }
    if (d.loaf) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath(); g.ellipse(0, -52, cw + 8, 22, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-16, -58, 22, 8, 0.1, 0, 7); g.fill();
      g.fillStyle = d.lettuce;
      g.beginPath(); g.arc(-30, -34, 11, 0, 7); g.fill();
      g.beginPath(); g.arc(-6, -30, 12, 0, 7); g.fill();
      g.beginPath(); g.arc(20, -33, 11, 0, 7); g.fill();
    }
    if (d.horns) {
      g.fillStyle = HORN; g.strokeStyle = HORN_OUT; g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-30, -42); g.quadraticCurveTo(-46, -58, -34, -72);
      g.quadraticCurveTo(-28, -60, -20, -48);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(30, -42); g.quadraticCurveTo(46, -58, 34, -72);
      g.quadraticCurveTo(28, -60, 20, -48);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = HORN_LT;
      g.beginPath(); g.ellipse(-33, -58, 3, 8, 0.4, 0, 7); g.fill();
    }
  }

  // the monster's plush muzzle carries its own nose + mouth
  function drawMuzzle(g, d) {
    g.fillStyle = d.muzM; g.strokeStyle = d.muzO; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, 19, 27, 20, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = d.muzL;
    g.beginPath(); g.ellipse(-10, 10, 12, 7, -0.25, 0, 7); g.fill();
    g.fillStyle = d.sOut;
    g.beginPath();
    g.moveTo(-8, 2); g.quadraticCurveTo(0, 13, 8, 2);
    g.quadraticCurveTo(0, -3, -8, 2);
    g.closePath(); g.fill();
  }

  /* ================================ fx ================================ */
  function drawFx(g, d, e) {
    if (e.fl >= 1) {
      g.lineCap = 'round';
      for (let i = 0; i < HEAT.length; i += 4) {
        const bx = HEAT[i] * (S.cw + HEAT[i + 1]), by = HEAT[i + 2];
        const wob = Math.sin(S.t * 3.4 + HEAT[i + 3]) * 7;
        g.strokeStyle = HEAT_A; g.lineWidth = 3.4;
        g.beginPath();
        g.moveTo(bx, by);
        g.bezierCurveTo(bx + wob, by - 7, bx - wob, by - 13, bx + wob * 0.4, by - 20);
        g.stroke();
        g.strokeStyle = HEAT_B; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(bx + wob * 0.4, by - 21);
        g.bezierCurveTo(bx - wob * 0.6, by - 26, bx + wob * 0.6, by - 30, bx, by - 35);
        g.stroke();
      }
    }
    if (e.tr > 0) {
      const fall = (S.t * 22) % 46;
      g.fillStyle = TEAR;
      g.beginPath(); g.ellipse(-S.ex - 9, S.ey + 10 + fall, 3.4, 5, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(S.ex + 9, S.ey + 6 + fall * 0.8, 3.2, 4.6, 0, 0, 7); g.fill();
      g.fillStyle = TEAR_HI;
      g.beginPath(); g.arc(-S.ex - 10, S.ey + 9 + fall, 1.2, 0, 7); g.fill();
    }
    if (e.sw > 0) {
      g.fillStyle = SWEAT; g.strokeStyle = SWEAT_OUT; g.lineWidth = 1.6;
      const bob = Math.sin(S.t * 3) * 2;
      g.beginPath();
      g.moveTo(-S.cw - 6, -38 + bob);
      g.quadraticCurveTo(-S.cw - 14, -28 + bob, -S.cw - 6, -24 + bob);
      g.quadraticCurveTo(-S.cw + 2, -28 + bob, -S.cw - 6, -38 + bob);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(S.cw + 8, -30 - bob);
      g.quadraticCurveTo(S.cw + 1, -21 - bob, S.cw + 8, -17 - bob);
      g.quadraticCurveTo(S.cw + 15, -21 - bob, S.cw + 8, -30 - bob);
      g.closePath(); g.fill(); g.stroke();
    }
  }

  function drawAura(g, d) {
    for (let i = 0; i < AURA.length; i += 2) {
      g.fillStyle = AURA[i + 1] === 0 ? d.au1 : (AURA[i + 1] === 1 ? d.au2 : d.au3);
      g.beginPath();
      g.ellipse(0, 6, AURA[i] * 0.92, AURA[i] * 1.06, 0, 0, 7);
      g.fill();
    }
  }

  /* =============================== draw =============================== */
  F.has = function (id) { return !!D[id]; };

  F.draw = function (g, spec) {
    const d = (spec.ascended && ASC[spec.id]) ? ASC[spec.id] : D[spec.id];
    if (!d) return;
    const e = EXPR[spec.expr] || EXPR.neutral;
    const t = spec.t || 0;

    S.d = d; S.e = e; S.t = t;
    S.cw = d.cw; S.jw = d.jw; S.chin = d.chin;
    S.my = d.chin * 0.48;
    S.nb = S.my - 15;
    S.mW = d.mW;
    S.ex = 19 * (d.eyeSp || 1);
    S.ey = -6 + (d.eyeY || 0);
    S.lt = Math.min(1, e.lt + (d.lidBias || 0));
    S.flush = e.fl + (d.baseFlush ? 0.4 : 0);
    S.gaze = Math.sin(t * 0.7) * 0.9;

    const blink = e.bl && ((t * 0.85) % 4.4) < 0.14;
    S.closed = S.lt >= 0.86 ? 1 : (blink ? -1 : 0);

    g.save();
    g.lineJoin = 'round';
    if (spec.facing < 0) g.scale(-1, 1);
    // breath, plus the shake that anger and fear carry
    const sk = e.sk;
    g.translate(
      sk ? Math.sin(t * 41) * sk * 1.5 : 0,
      Math.sin(t * 1.5) * 0.8 + (d.calm ? Math.sin(t * 0.9) * 2.5 : 0) + (sk ? Math.cos(t * 37) * sk : 0)
    );

    if (d.aura) drawAura(g, d);
    drawHairBack(g, d);
    drawBody(g, d);
    if (d.plushEar) { drawPlushEar(g, d, -1); drawPlushEar(g, d, 1); }
    else if (!d.visor && !d.jaws && !d.beak) { drawEar(g, d, -1); drawEar(g, d, 1); }
    drawHead(g, d);
    if (!d.visor) {
      drawEye(g, d, e, -1);
      drawEye(g, d, e, 1);
      drawBrow(g, d, e, -1);
      drawBrow(g, d, e, 1);
      if (d.muzzle) {
        drawMuzzle(g, d);
        drawMouth(g, d, e);
      } else if (d.beak) {
        g.fillStyle = BEAK; g.strokeStyle = BEAK_OUT; g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(-15, S.my - 12); g.lineTo(15, S.my - 12);
        g.quadraticCurveTo(10, S.my + 16, 0, S.my + 18);
        g.quadraticCurveTo(-10, S.my + 16, -15, S.my - 12);
        g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = BEAK_OUT; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(-13, S.my + 1); g.quadraticCurveTo(0, S.my + 5, 13, S.my + 1); g.stroke();
      } else {
        drawNose(g, d);
        drawFacialHair(g, d);
        drawMouth(g, d, e);
        if (d.beard) drawMoustache(g, d, d.bMid, d.bOut, d.bLt, d.mW * 0.72);
        else if (d.mous) drawMoustache(g, d, d.hMid, d.hOut, d.hLt, d.mW * 0.6);
      }
    }
    drawHair(g, d);
    drawGear(g, d);
    if (d.paci) {
      g.fillStyle = PACI; g.strokeStyle = PACI_OUT; g.lineWidth = 2.4;
      g.beginPath(); g.ellipse(S.mW * 0.5 + 7, S.my + 4, 10, 8, -0.3, 0, 7); g.fill(); g.stroke();
      g.fillStyle = PACI_LT;
      g.beginPath(); g.ellipse(S.mW * 0.5 + 4, S.my + 1, 4, 3, -0.3, 0, 7); g.fill();
      g.strokeStyle = PACI_RING; g.lineWidth = 2.6;
      g.beginPath(); g.arc(S.mW * 0.5 + 17, S.my + 8, 5.5, 0, 7); g.stroke();
    }
    drawFx(g, d, e);

    g.globalAlpha = 1;
    g.shadowBlur = 0;
    g.restore();
  };

  F.ids = Object.keys(D);
})();
