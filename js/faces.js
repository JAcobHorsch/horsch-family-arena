// faces.js — cinematic close-up busts for the cutscene 'face' shots.
//
// Local frame: (0,0) is the CENTRE OF THE HEAD, +y is down, one unit is one
// unit. The head reads ~100 units across; the shoulders run off the bottom of
// the frame. The caller owns the translate/scale; we own our save/restore.
//
// ONE generic bust renderer driven by two tables:
//   DESC[id]  — who this is: skin/hair/shirt ramps, face proportions, brow
//               weight, eye size + iris, nose, mouth, and look extras.
//   EXPR[key] — how they feel: brow ends, lid closure, pupil size, mouth kind,
//               flush and jaw tension. Every field moves; nothing is a mouth swap.
// ASC[id] carries the finalForm.look variant, resolved ONCE at load.
//
// Canonical drawing faces +x (front). spec.facing mirrors the whole bust the
// same way drawFighter does, so the key light is authored top-left in the
// canonical frame: broad shade on the back plane, warm rim on the upper-left
// edge, form light on the forehead and front cheekbone.
//
// Flat fills only — no gradients, no shadowBlur, no per-frame allocations.
(function () {
  const F = (window.FACES = window.FACES || {});

  // ============================ shared ink =============================
  const INK = '#14101a';
  const EYEW = '#fffdf6';
  const LID_SHADE = 'rgba(96,80,104,0.26)';   // upper lid shadow on the white
  const RIM = 'rgba(255,246,221,0.42)';       // warm sun rim, upper-left edge
  const RIM_SOFT = 'rgba(255,246,221,0.22)';
  const SHADE = 'rgba(20,16,26,0.17)';        // back-plane shade
  const SHADE_HARD = 'rgba(20,16,26,0.27)';
  const NECK_SHADE = 'rgba(20,16,26,0.34)';
  const BLUSH = 'rgba(255,122,122,0.34)';
  const BLUSH_HOT = 'rgba(255,110,110,0.48)';
  const FLUSH_LO = 'rgba(206,42,24,0.14)';
  const FLUSH_MID = 'rgba(206,42,24,0.26)';
  const FLUSH_HOT = 'rgba(255,64,28,0.38)';
  const HEAT_A = 'rgba(255,140,70,0.34)';
  const HEAT_B = 'rgba(255,176,112,0.20)';
  const TEAR = 'rgba(150,214,255,0.78)';
  const TEAR_HI = 'rgba(240,252,255,0.90)';
  const SWEAT = 'rgba(186,228,255,0.85)';
  const CATCH = 'rgba(255,255,255,0.95)';
  const CATCH2 = 'rgba(255,255,255,0.40)';
  const STUB = 'rgba(40,32,44,0.30)';
  const FRECK = 'rgba(168,96,58,0.44)';
  const TEETH = '#fbf6ea';
  const TEETH_DK = '#cfc4b2';
  const GUM = '#4d1f28';
  const GUM_HOT = '#6b1f24';
  const TONGUE = '#d4626e';
  const VEIN = 'rgba(190,42,30,0.55)';

  // hoisted scatter/geometry — indices, never rebuilt
  const STUBBLE = [
    -26, 34, -16, 42, -6, 47, 4, 49, 14, 47, 23, 42, 30, 34,
    -22, 26, -11, 34, 0, 39, 11, 39, 20, 33, 27, 25, 33, 17,
  ];
  const FRECKLES = [8, 4, 18, 2, 27, 5, 34, 10, -2, 6, -11, 9, 14, 10, 24, 12];
  const SPIKES = [-30, -78, -13, -88, 4, -90, 21, -83, 35, -70];
  const SHAG = [-32, -56, 20, -16, -66, 21, 2, -70, 22, 24, -64, 20, 40, -52, 17];
  const MOP = [-30, -62, 25, -6, -74, 27, 20, -66, 24, 38, -50, 19];
  const HEAT_ST = [-58, 0, -30, 1.7, 8, 3.3, 42, 4.8, 62, 2.4];
  const MOTES = [-64, -34, 0, 60, -50, 1.6, -50, 30, 3.1, 68, 18, 4.4, 10, -84, 5.2];
  const SEEDS = [-18, -30, -2, -38, 14, -32, 26, -20, -30, -16];
  const CROWN = [-34, -46, -34, -78, -17, -58, 2, -86, 21, -58, 38, -78, 38, -46];

  // ============================ palettes ===============================
  // every ramp is the game's own ramp() of the base hue, baked to literals
  const D = {};

  D.todd = {
    sOut: '#654a4b', sDk: '#a57a62', sMid: '#e0a878', sLt: '#e9be94', sHi: '#f1d3b0',
    hOut: '#2d152a', hDk: '#3c1a24', hMid: '#4b1e1f', hLt: '#7d5a54',
    hair: 'short', fx: 48, fy: 47, fj: 37, fc: 55, cx0: 7,
    bw: 6.2, bt: -1, eW: 10.5, eH: 10.4, ir: '#5b3a22', irD: '#31200f', irL: '#8f6338',
    noseL: 22, noseW: 13, noseHk: 3, mW: 23, mBias: -0.06,
    lip: '#b4635c', lipD: '#7e3a3c', lipH: '#d99189',
    cOut: '#68293a', cDk: '#aa3e42', cMid: '#e8524a', cLt: '#ee8073', acc: '#f7c2c0',
    band: 1, stubble: 1,
  };
  D.sonya = {
    sOut: '#6b5154', sDk: '#ae8773', sMid: '#eeba90', sLt: '#f3cba6', sHi: '#f7dbba',
    hOut: '#2d1432', hDk: '#3c1833', hMid: '#4b1b34', hLt: '#7d5863',
    hair: 'pony', fx: 45, fy: 47, fj: 30, fc: 55, cx0: 7,
    bw: 3.8, bt: -4, eW: 11.6, eH: 12.2, ir: '#4a6b52', irD: '#25392a', irL: '#7ba283',
    noseL: 17, noseW: 10, noseBtn: 1, mW: 20, mBias: 0.14,
    lip: '#cc6a80', lipD: '#8e3c50', lipH: '#ef9daa',
    cOut: '#682655', cDk: '#aa3975', cMid: '#e84a92', cLt: '#ee7aa7', acc: '#f7c0d9',
    band: 1, lash: 1,
  };
  D.jordan = {
    sOut: '#684d50', sDk: '#aa816b', sMid: '#e8b184', sLt: '#eec49d', sHi: '#f5d7b5',
    hOut: '#2d1a2a', hDk: '#3c2224', hMid: '#4b291f', hLt: '#7d6254',
    hair: 'spiky', fx: 43, fy: 50, fj: 27, fc: 59, cx0: 8,
    bw: 4.8, bt: -2, eW: 10.8, eH: 11.2, ir: '#3f5a74', irD: '#1e2e3e', irL: '#7292ab',
    noseL: 21, noseW: 10, mW: 21, mBias: 0.08,
    lip: '#b96a63', lipD: '#813e40', lipH: '#dc9890',
    cOut: '#68383a', cDk: '#aa5942', cMid: '#e8784a', cLt: '#ee9b73', acc: '#f7d0c0',
    band: 1, stubble: 1,
  };
  D.jerod = {
    sOut: '#6a5155', sDk: '#ae8875', sMid: '#edbb92', sLt: '#f2cca7', sHi: '#f7dbbb',
    hOut: '#2d222a', hDk: '#3c3224', hMid: '#4b401f', hLt: '#7d7354',
    hair: 'short', fx: 49, fy: 46, fj: 36, fc: 53, cx0: 6,
    bw: 5.4, bt: -1, eW: 10.6, eH: 10.8, ir: '#4d6f5c', irD: '#243a2c', irL: '#7fa48c',
    noseL: 20, noseW: 14, noseBtn: 1, mW: 22, mBias: 0.10,
    lip: '#b96b62', lipD: '#813f3f', lipH: '#dc998f',
    cOut: '#68563a', cDk: '#aa9142', cMid: '#e8c84a', cLt: '#eed573', acc: '#f7ecc0',
    band: 1, stubble: 1, xeye: 1,
  };
  D.jacob = {
    sOut: '#684c4e', sDk: '#a97f68', sMid: '#e6ae80', sLt: '#edc29a', sHi: '#f4d6b3',
    hOut: '#1b262d', hDk: '#1b382a', hMid: '#1c4928', hLt: '#5c795b',
    hair: 'spiky', fx: 46, fy: 47, fj: 33, fc: 55, cx0: 7,
    bw: 5.6, bt: -2, eW: 10.8, eH: 11, ir: '#3f6b4c', irD: '#1d3624', irL: '#729d7c',
    noseL: 21, noseW: 12, mW: 22, mBias: 0.05,
    lip: '#b6665f', lipD: '#7f3b3d', lipH: '#d9948b',
    cOut: '#2c6246', cDk: '#3ca759', cMid: '#4ae86a', cLt: '#7dec8a', acc: '#c0f7cb',
    band: 1, stubble: 1,
  };
  D.samantha = {
    sOut: '#6b5358', sDk: '#b08b7a', sMid: '#f0c09a', sLt: '#f4cfad', sHi: '#f8debf',
    hOut: '#1b2635', hDk: '#1b3839', hMid: '#1c493d', hLt: '#5c796a',
    hair: 'pony', fx: 46, fy: 46, fj: 31, fc: 53, cx0: 7,
    bw: 4, bt: -4, eW: 11.8, eH: 12.4, ir: '#5a4a6e', irD: '#2c2338', irL: '#8b7ba0',
    noseL: 17, noseW: 11, noseBtn: 1, mW: 20, mBias: 0.16,
    lip: '#cc6f7c', lipD: '#8e404c', lipH: '#efa1a6',
    cOut: '#2c6261', cDk: '#3ca78b', cMid: '#4ae8b2', cLt: '#7decbe', acc: '#c0f7e4',
    band: 1, lash: 1,
  };
  D.cassandra = {
    sOut: '#6a5054', sDk: '#ad8672', sMid: '#ecb98e', sLt: '#f1caa4', sHi: '#f6dbb9',
    hOut: '#1b253b', hDk: '#1b3644', hMid: '#1c464d', hLt: '#5c7775',
    hair: 'long', fx: 45, fy: 47, fj: 30, fc: 55, cx0: 7,
    bw: 4, bt: -3, eW: 11.4, eH: 12, ir: '#6b5136', irD: '#38281a', irL: '#9d8158',
    noseL: 18, noseW: 10, noseBtn: 1, mW: 20, mBias: 0.13,
    lip: '#c96876', lipD: '#8c3c48', lipH: '#ec9ba2',
    cOut: '#2c5d76', cDk: '#3c9eb1', cMid: '#4adbe8', cLt: '#7de3e5', acc: '#c0f2f7',
    band: 1, lash: 1,
  };
  D.erika = {
    sOut: '#6c545a', sDk: '#b18e7e', sMid: '#f2c49f', sLt: '#f6d2b0', sHi: '#f9e0c1',
    hOut: '#1b1b3b', hDk: '#1b2444', hMid: '#1c2d4d', hLt: '#5c6575',
    hair: 'pony', fx: 47, fy: 46, fj: 34, fc: 52, cx0: 5,
    bw: 3.2, bt: -6, eW: 11, eH: 12.6, ir: '#4a6178', irD: '#243040', irL: '#7d95a8',
    noseL: 16, noseW: 10, noseBtn: 1, mW: 16, mBias: -0.12,
    lip: '#c47784', lipD: '#874a54', lipH: '#e7a6ab',
    cOut: '#2c3d76', cDk: '#3c63b1', cMid: '#4a86e8', cLt: '#7da5e5', acc: '#c0d5f7',
    band: 1, lash: 1, xeye: 1,
  };
  D.levi = {
    sOut: '#644b4d', sDk: '#a37d65', sMid: '#ddab7c', sLt: '#e7c097', sHi: '#f0d4b1',
    hOut: '#22143b', hDk: '#291844', hMid: '#2f1b4d', hLt: '#695875',
    hair: 'shaggy', fx: 49, fy: 47, fj: 38, fc: 56, cx0: 7,
    bw: 7, bt: 0, eW: 10.2, eH: 10, ir: '#4d3f6b', irD: '#241d33', irL: '#7f7098',
    noseL: 22, noseW: 14, noseHk: 2, mW: 24, mBias: -0.04,
    lip: '#ae615c', lipD: '#79383b', lipH: '#d38f88',
    cOut: '#452676', cDk: '#6839b1', cMid: '#8a4ae8', cLt: '#ab7ae5', acc: '#d6c0f7',
    band: 1, stubble: 1,
  };
  D.ronathon = {
    sOut: '#694f53', sDk: '#ab8470', sMid: '#e9b68c', sLt: '#efc8a3', sHi: '#f5d9b9',
    hOut: '#28143b', hDk: '#351844', hMid: '#401b4d', hLt: '#755875',
    hair: 'short', fx: 43, fy: 50, fj: 28, fc: 59, cx0: 8,
    bw: 5.2, bt: -1, eW: 10.4, eH: 10.6, ir: '#5a4460', irD: '#2b2030', irL: '#8b7690',
    noseL: 24, noseW: 12, noseHk: 4, mW: 21, mBias: 0.02,
    lip: '#b56760', lipD: '#7e3c3d', lipH: '#d8958c',
    cOut: '#5a2676', cDk: '#9039b1', cMid: '#c24ae8', cLt: '#d37ae5', acc: '#eac0f7',
    band: 1, mous: 1,
  };
  D.tim = {
    sOut: '#664b4e', sDk: '#a67d67', sMid: '#e2ac7e', sLt: '#eac199', sHi: '#f2d5b2',
    hOut: '#291f2d', hDk: '#362b2a', hMid: '#423728', hLt: '#776c5b',
    hair: 'short', fx: 48, fy: 47, fj: 37, fc: 55, cx0: 7,
    bw: 6, bt: -1, eW: 10.4, eH: 10.6, ir: '#4c6a7c', irD: '#233642', irL: '#7f9fae',
    noseL: 21, noseW: 13, mW: 23, mBias: 0.02,
    lip: '#b4645d', lipD: '#7e393c', lipH: '#d9928a',
    cOut: '#5d4a46', cDk: '#957a59', cMid: '#c9a86a', cLt: '#d8be8a', acc: '#f2ee4a',
    helmet: 1, gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
    stubble: 1,
  };
  D.myah = {
    sOut: '#6b5359', sDk: '#b08c7c', sMid: '#f0c19c', sLt: '#f4d0ae', sHi: '#f8dec0',
    hOut: '#2d1438', hDk: '#3c183f', hMid: '#4b1b46', hLt: '#7d5870',
    hair: 'long', fx: 45, fy: 47, fj: 30, fc: 55, cx0: 7,
    bw: 3.8, bt: -3, eW: 11.4, eH: 12, ir: '#6b4a5e', irD: '#38242e', irL: '#9d7c8a',
    noseL: 17, noseW: 10, noseBtn: 1, mW: 20, mBias: 0.11,
    lip: '#cc6b84', lipD: '#8e3d52', lipH: '#ef9dae',
    cOut: '#68266d', cDk: '#aa39a0', cMid: '#e84ad0', cLt: '#ee7ad4', acc: '#f7c0ef',
    band: 1, lash: 1,
  };
  D.isla = {
    sOut: '#6e5961', sDk: '#b5968a', sMid: '#f8d0b0', sLt: '#fadbbd', sHi: '#fce5c9',
    hOut: '#2e1e37', hDk: '#3e2a3d', hMid: '#4e3542', hLt: '#806b6d',
    hair: 'none', fx: 52, fy: 50, fj: 38, fc: 50, cx0: 4,
    bw: 2.6, bt: -3, eW: 14.6, eH: 16, ir: '#4f6b86', irD: '#26364a', irL: '#84a0b6',
    noseL: 11, noseW: 9, noseBtn: 1, mW: 15, mBias: 0.14, eyeY: 7, eyeSp: 1.06,
    lip: '#d97d88', lipD: '#964a56', lipH: '#f5a9ac',
    cOut: '#6c4867', cDk: '#b17796', cMid: '#f2a3c2', cLt: '#f6baca', acc: '#fadfea',
    baby: 1, blush: 1, lash: 1, xeye: 1,
  };
  D.hayes = {
    sOut: '#6c5357', sDk: '#b18b77', sMid: '#f2c096', sLt: '#f6cfaa', sHi: '#f9debd',
    hOut: '#1d143b', hDk: '#201844', hMid: '#221b4d', hLt: '#605875',
    hair: 'spiky', fx: 46, fy: 47, fj: 31, fc: 53, cx0: 6,
    bw: 4.4, bt: -2, eW: 12.4, eH: 13.2, ir: '#4a5c9b', irD: '#232c4c', irL: '#8290c0',
    noseL: 15, noseW: 10, noseBtn: 1, mW: 19, mBias: 0.10,
    lip: '#c4707a', lipD: '#88414c', lipH: '#e7a3a6',
    cOut: '#332676', cDk: '#4839b1', cMid: '#5c4ae8', cLt: '#8a7ae5', acc: '#c6c0f7',
    band: 1, blush: 1, freckle: 1, xeye: 1,
  };
  D.addi = {
    sOut: '#6e585e', sDk: '#b49485', sMid: '#f6cdaa', sLt: '#f9d8b8', sHi: '#fbe4c6',
    hOut: '#25253e', hDk: '#2e3649', hMid: '#364654', hLt: '#6e777a',
    hair: 'pony', fx: 46, fy: 47, fj: 31, fc: 53, cx0: 6,
    bw: 3, bt: -5, eW: 13, eH: 14.2, ir: '#5a9cc4', irD: '#2b4c62', irL: '#93c6df',
    noseL: 14, noseW: 9, noseBtn: 1, mW: 18, mBias: 0.15,
    lip: '#d0757f', lipD: '#914350', lipH: '#eda6a9',
    cOut: '#4d5e7f', cDk: '#779fc1', cMid: '#9fdcff', cLt: '#bae3f5', acc: '#ddf3ff',
    band: 1, blush: 1, lash: 1, freckle: 1, bow: 1, xeye: 1,
    gOut: '#4d5e7f', gDk: '#779fc1', gMid: '#9fdcff', gLt: '#bae3f5',
  };
  D.brooks = {
    sOut: '#6d565b', sDk: '#b39180', sMid: '#f4c8a2', sLt: '#f7d5b3', sHi: '#fae1c2',
    hOut: '#19202a', hDk: '#182d24', hMid: '#173a1f', hLt: '#586f54',
    hair: 'shaggy', fx: 48, fy: 47, fj: 34, fc: 51, cx0: 5,
    bw: 3.6, bt: -3, eW: 12.8, eH: 13.6, ir: '#4a7a52', irD: '#233b28', irL: '#82ab86',
    noseL: 13, noseW: 9, noseBtn: 1, mW: 22, mBias: 0.22,
    lip: '#cc7078', lipD: '#8e414a', lipH: '#efa2a4',
    cOut: '#254e3a', cDk: '#2e8242', cMid: '#37b34a', cLt: '#6fc673', acc: '#b9e4c0',
    band: 1, blush: 1, freckle: 1, toothy: 1, xeye: 1,
  };
  D.dayne = {
    sOut: '#674e51', sDk: '#a7816d', sMid: '#e4b287', sLt: '#ecc59f', sHi: '#f3d7b6',
    hOut: '#262037', hDk: '#302e3d', hMid: '#3a3b42', hLt: '#716f6d',
    hair: 'short', fx: 44, fy: 50, fj: 30, fc: 58, cx0: 8,
    bw: 3.4, bt: -3, eW: 11.6, eH: 11.4, ir: '#7b8496', irD: '#3c414c', irL: '#a9b0bc',
    noseL: 20, noseW: 14, noseBtn: 1, mW: 20, mBias: 0.04, eyeSp: 1.14,
    lip: '#b76e66', lipD: '#804140', lipH: '#da9b91',
    cOut: '#534f68', cDk: '#838498', cMid: '#b0b6c4', cLt: '#c6c8cb', acc: '#e3e5ea',
    band: 1, stubble: 1, slack: 1, xeye: 1,
  };
  // ---- campaign cast: palettes lifted straight from skins-campaign.js ----
  D.josh = {
    sOut: '#684d50', sDk: '#aa806a', sMid: '#e8b083', sLt: '#eec49c', sHi: '#f5d7b5',
    hOut: '#312029', hDk: '#452d23', hMid: '#57391d', hLt: '#866e53',
    hair: 'scruff', fx: 43, fy: 50, fj: 26, fc: 60, cx0: 9,
    bw: 4.6, bt: -2, eW: 10.6, eH: 10.4, ir: '#3a2a18', irD: '#1c140b', irL: '#6d5a3e',
    noseL: 23, noseW: 10, noseHk: 2, mW: 20, mBias: 0.20, asym: 1, lidBias: 0.20,
    lip: '#b06861', lipD: '#7a3c3d', lipH: '#d5968d',
    cOut: '#221a35', cDk: '#292338', cMid: '#2f2b3c', cLt: '#696469', acc: '#ded8e8',
    print: 1,
  };
  D.damon = {
    sOut: '#614647', sDk: '#9e735a', sMid: '#d69d6c', sLt: '#e1b68c', sHi: '#edceaa',
    hOut: '#372b39', hDk: '#4f4141', hMid: '#655648', hLt: '#908372',
    hair: 'comb', fx: 51, fy: 48, fj: 42, fc: 56, cx0: 6,
    bw: 8.5, bt: 2, eW: 10.4, eH: 9.6, ir: '#ff6a2a', irD: '#a83208', irL: '#ffdcae',
    noseL: 24, noseW: 16, noseHk: 5, mW: 25, mBias: -0.16,
    lip: '#a85a52', lipD: '#743336', lipH: '#cd8a80',
    cOut: '#696170', cDk: '#aba4a6', cMid: '#e9e4d8', cLt: '#efe9d9', acc: '#7e3a44',
    stubble: 1, glow: 1, baseFlush: 1, brute: 1,
  };
  D.petmonster = {
    sOut: '#37295c', sDk: '#4f3e81', sMid: '#6552a4', sLt: '#9080b4', sHi: '#baacc3',
    hOut: '#37295c', hDk: '#4f3e81', hMid: '#6552a4', hLt: '#9080b4',
    hair: 'none', fx: 52, fy: 48, fj: 40, fc: 48, cx0: 3,
    bw: 5, bt: -2, eW: 15, eH: 15, ir: '#37295c', irD: '#241a42', irL: '#6552a4',
    noseL: 0, noseW: 0, mW: 26, mBias: 0.3,
    lip: '#5c2038', lipD: '#3d1526', lipH: '#8a3f56',
    cOut: '#37295c', cDk: '#4f3e81', cMid: '#6552a4', cLt: '#9080b4', acc: '#ff7d1c',
    muzzle: 'plush', horns: 1, plushEar: 1, seam: '#4d3c80', xeye: 1,
  };

  // ===================== ascended (finalForm.look) ======================
  // built once at load — the draw path only ever looks a variant up by id
  function variant(base, over) {
    const o = Object.assign({}, base);
    return Object.assign(o, over);
  }
  const ASC = {};
  // THE TODDFATHER — bald, bearded, shirtless
  ASC.todd = variant(D.todd, {
    hair: 'none', bald: 1, band: 0, bare: 1, stubble: 0, beard: 1,
    bOut: '#2d152a', bDk: '#3c1a24', bMid: '#4b1e1f', bLt: '#7d5a54',
    fj: 40, fc: 57, bw: 7.4,
  });
  // XANAX SONYA — serene, gently levitating, violet aura
  ASC.sonya = variant(D.sonya, {
    lidBias: 0.26, floaty: 1, mBias: 0.26,
    aur1: 'rgba(224,184,255,0.30)', aur2: 'rgba(224,184,255,0.18)', aur3: 'rgba(224,184,255,0.10)',
  });
  // 3D PRINTER JEROD — the machine frame closes over his head
  ASC.jerod = variant(D.jerod, {
    band: 0, machine: 1,
    gOut: '#4b4760', gDk: '#747588', gMid: '#9aa0ae', gLt: '#b6b8bb',
  });
  // WRENCHY — golden pipe wrench; the jaws bracket his face
  ASC.jacob = variant(D.jacob, {
    hair: 'none', band: 0, wrench: 1, bald: 1, stubble: 0,
    sOut: '#715a3a', sDk: '#ba9842', sMid: '#ffd24a', sLt: '#ffdc73', sHi: '#ffe69b',
    lip: '#b8862a', lipD: '#7d5a1a', lipH: '#e0b45c',
    gOut: '#4b4760', gDk: '#747588', gMid: '#9aa0ae', gLt: '#b6b8bb',
    aur1: 'rgba(255,210,74,0.30)', aur2: 'rgba(255,210,74,0.17)', aur3: 'rgba(255,210,74,0.09)',
  });
  // GIANT CHICKEN
  ASC.samantha = variant(D.samantha, {
    hair: 'none', band: 0, lash: 0, muzzle: 'beak', comb: 1, ruff: 1,
    sOut: '#6e6676', sDk: '#b4aeb1', sMid: '#f6f2e8', sLt: '#f9f3e5', sHi: '#fbf4e2',
    fx: 46, fy: 46, fj: 30, fc: 46, cx0: 4, bw: 3,
    ir: '#c9a23a', irD: '#6b5216', irL: '#ecd07a',
    gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
  });
  // LITTLE BEAR SPECIAL — a towering Italian sub
  ASC.cassandra = variant(D.cassandra, {
    hair: 'none', band: 0, lash: 0, muzzle: 'loaf',
    sOut: '#654a42', sDk: '#a57a52', sMid: '#e0a860', sLt: '#e9be83', sHi: '#f1d3a5',
    fx: 50, fy: 44, fj: 44, fc: 44, cx0: 2, bw: 3.4,
    ir: '#3a2a18', irD: '#1c140b', irL: '#6d5a3e',
    gOut: '#405442', gDk: '#5f8e51', gMid: '#7dc45f', gLt: '#a1d282',
  });
  // RICKMOTHY — smaller, weaker and fatter all at once
  ASC.erika = variant(D.erika, {
    fx: 52, fy: 45, fj: 46, fc: 48, cx0: 3, jowl: 1,
    eW: 9.6, eH: 10.4, mW: 14, noseW: 13, noseBtn: 1,
  });
  // LEVIATHAN — the wrecking-crew mop, no headband
  ASC.levi = variant(D.levi, { hair: 'mop', band: 0, fj: 41, fc: 58, bw: 8, mW: 26 });
  // RYAN DUGAN — the eyeglasses alias
  ASC.ronathon = variant(D.ronathon, { glasses: 1, glassCol: '#2a2a35' });
  // FIRETRUCK — helmet runs a live light bar
  ASC.tim = variant(D.tim, { lightbar: 1, baseFlush: 1 });
  // 8 HOURS OF SLEEP MYAH — fully rested, radiant
  ASC.myah = variant(D.myah, {
    sLt: '#f9dcc2', sHi: '#fdead2', radiant: 1, mBias: 0.24,
    aur1: 'rgba(255,242,184,0.34)', aur2: 'rgba(255,242,184,0.20)', aur3: 'rgba(255,242,184,0.11)',
  });
  // MECHA HAYES — sealed helmet, cyan visor
  ASC.hayes = variant(D.hayes, {
    hair: 'none', band: 0, blush: 0, freckle: 0, visor: 1,
    gOut: '#45415e', gDk: '#686b84', gMid: '#8a92a8', gLt: '#abaeb7',
    vOut: '#2c5d76', vMid: '#4adbe8', vLt: '#7de3e5',
  });
  // PRINCESS ADDI — coronation crown and glacial aura
  ASC.addi = variant(D.addi, {
    band: 0, bow: 0, crown: 1,
    gOut: '#715a3a', gDk: '#ba9842', gMid: '#ffd24a', gLt: '#ffdc73',
    aur1: 'rgba(191,234,255,0.32)', aur2: 'rgba(191,234,255,0.19)', aur3: 'rgba(191,234,255,0.10)',
  });
  // KANSAS CITY DAYNE — the cap, and he will not stop talking about it
  ASC.dayne = variant(D.dayne, {
    band: 0, cap: 1,
    gOut: '#612030', gDk: '#9c2e2f', gMid: '#d43b2f', gLt: '#e06f60',
  });

  // =========================== expressions =============================
  // bi/bo  brow inner / outer end dy (+ = pushed down)
  // lt/lb  upper lid closure, lower lid raise (0..1 of eye height)
  // pup    pupil scale     eye  eye-open scale
  // m      mouth kind      mo   how far it opens     mc  curve (+ = smile)
  // fl     flush   tn  jaw/cheek tension   tr tears  sw sweat  sk shake  bl blinks
  const EXPR = {
    neutral:    { bi: 0, bo: 0, lt: 0.14, lb: 0.04, pup: 1, eye: 1, m: 'line', mo: 0, mc: 0.10, fl: 0, tn: 0, tr: 0, sw: 0, sk: 0, bl: 1 },
    angry:      { bi: 8, bo: -6, lt: 0.30, lb: 0.18, pup: 0.86, eye: 0.96, m: 'frown', mo: 0, mc: -0.36, fl: 0.30, tn: 0.55, tr: 0, sw: 0, sk: 0, bl: 1 },
    rage:       { bi: 13, bo: -10, lt: 0.06, lb: 0.32, pup: 0.52, eye: 1.14, m: 'teeth', mo: 0.85, mc: -0.20, fl: 1, tn: 1, tr: 0, sw: 0.4, sk: 1.3, bl: 0 },
    scared:     { bi: -11, bo: -3, lt: 0, lb: 0, pup: 0.42, eye: 1.20, m: 'o', mo: 0.72, mc: -0.16, fl: 0, tn: 0.25, tr: 0, sw: 1, sk: 0.9, bl: 0 },
    smug:       { bi: 2, bo: -9, lt: 0.44, lb: 0.24, pup: 1, eye: 0.94, m: 'smirk', mo: 0, mc: 0.30, fl: 0, tn: 0.20, tr: 0, sw: 0, sk: 0, bl: 1 },
    hurt:       { bi: -7, bo: 6, lt: 0.92, lb: 0.52, pup: 1, eye: 0.82, m: 'grit', mo: 0.34, mc: -0.30, fl: 0.18, tn: 0.85, tr: 0, sw: 0.5, sk: 0.5, bl: 0 },
    shout:      { bi: 10, bo: -5, lt: 0.04, lb: 0.10, pup: 0.74, eye: 1.10, m: 'shout', mo: 1, mc: 0, fl: 0.35, tn: 0.75, tr: 0, sw: 0, sk: 0.4, bl: 0 },
    sad:        { bi: -9, bo: 5, lt: 0.42, lb: 0.10, pup: 1.10, eye: 1.02, m: 'wobble', mo: 0.10, mc: -0.42, fl: 0.10, tn: 0, tr: 1, sw: 0, sk: 0, bl: 1 },
    determined: { bi: 6, bo: 1, lt: 0.26, lb: 0.22, pup: 0.94, eye: 0.98, m: 'firm', mo: 0, mc: -0.06, fl: 0.10, tn: 0.75, tr: 0, sw: 0, sk: 0, bl: 1 },
    surprised:  { bi: -13, bo: -12, lt: 0, lb: 0, pup: 0.80, eye: 1.22, m: 'o', mo: 0.58, mc: 0, fl: 0, tn: 0, tr: 0, sw: 0, sk: 0, bl: 0 },
  };

  // per-draw scratch — reused, never reallocated
  const S = {
    d: null, e: null, t: 0, k: 1, v: 1, blink: 0, px: 0, py: 0,
    breath: 0, tense: 0, flush: 0, cOut: '', cDk: '', cLt: '',
  };

  // ======================= geometry primitives =========================
  // egg skull with a controllable jaw width and a forward-shifted chin
  function headPath(g, rx, ry, jaw, chin, cx) {
    g.beginPath();
    g.moveTo(-rx, -4);
    g.bezierCurveTo(-rx, -ry * 1.30, rx, -ry * 1.30, rx, -4);
    g.bezierCurveTo(rx * 0.99, ry * 0.52, cx + jaw, chin * 0.90, cx, chin);
    g.bezierCurveTo(cx - jaw, chin * 0.90, -rx * 0.99, ry * 0.52, -rx, -4);
    g.closePath();
  }

  // tapered brow: thick at the inner end, thin at the outer
  function browShape(g, xi, yi, xo, yo, wi, wo) {
    const mx = (xi + xo) * 0.5, my = (yi + yo) * 0.5;
    g.beginPath();
    g.moveTo(xi, yi - wi);
    g.quadraticCurveTo(mx, my - wi * 1.25, xo, yo - wo);
    g.lineTo(xo, yo + wo);
    g.quadraticCurveTo(mx, my + wo * 0.85, xi, yi + wi);
    g.closePath(); g.fill();
  }

  // ============================== hair =================================
  // volume that sits BEHIND the shoulders — depth only, darkest shade
  function hairBack(g, d, sway) {
    const h = d.hair;
    if (h === 'none' || h === 'short' || h === 'comb') return;
    g.fillStyle = d.hOut;
    if (h === 'pony') {
      g.beginPath();
      g.ellipse(-d.fx - 14 + sway * 0.5, 22, 20, 40, 0.34, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(-d.fx - 22 + sway * 1.6, 62, 13, 26, 0.5 + sway * 0.02, 0, 7);
      g.fill();
    } else if (h === 'long') {
      g.beginPath();
      g.moveTo(-d.fx - 6, -10);
      g.quadraticCurveTo(-d.fx - 30 + sway, 60, -d.fx - 22 + sway * 1.4, 150);
      g.lineTo(d.fx + 24 - sway * 1.4, 150);
      g.quadraticCurveTo(d.fx + 30 - sway, 60, d.fx + 4, -10);
      g.closePath(); g.fill();
    } else {
      g.beginPath();
      g.ellipse(-4, -6, d.fx + 11, d.fy + 9, 0, 0, 7);
      g.fill();
    }
  }

  // the mass on the skull, its clumps, and one highlight band on the key side
  function hairFront(g, d, sway, t) {
    const h = d.hair;
    if (h === 'none') return;
    const fx = d.fx, fy = d.fy;
    if (h === 'comb') { // thinning: a band hugging the skull, bare crown, rake
      g.fillStyle = d.hMid;
      g.beginPath();
      g.moveTo(-fx - 1, -fy * 0.24);
      g.quadraticCurveTo(-fx - 6, -fy * 1.10, -6, -fy * 1.30);
      g.quadraticCurveTo(fx * 0.72, -fy * 1.22, fx + 1, -fy * 0.30);
      g.quadraticCurveTo(fx * 0.62, -fy * 0.92, 0, -fy * 1.02);
      g.quadraticCurveTo(-fx * 0.62, -fy * 1.00, -fx - 1, -fy * 0.24);
      g.closePath(); g.fill();
      g.strokeStyle = d.hDk; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-fx * 0.68, -fy * 1.10); g.quadraticCurveTo(0, -fy * 1.30, fx * 0.70, -fy * 1.06);
      g.moveTo(-fx * 0.60, -fy * 0.98); g.quadraticCurveTo(2, -fy * 1.18, fx * 0.76, -fy * 0.92);
      g.stroke();
      g.strokeStyle = d.hMid; g.lineWidth = 3.4; // sideburns, clear of the eyes
      g.beginPath();
      g.moveTo(-fx - 1, -fy * 0.28); g.lineTo(-fx + 1, fy * 0.16);
      g.moveTo(fx + 1, -fy * 0.30); g.lineTo(fx - 1, fy * 0.08);
      g.stroke();
      return;
    }
    // shared cap: crown mass with a fringe carved out above the brows
    g.fillStyle = d.hMid; g.strokeStyle = d.hOut; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-fx - 4, fy * 0.24);
    g.bezierCurveTo(-fx - 10, -fy * 0.92, -fx * 0.44, -fy * 1.46, 5, -fy * 1.44);
    g.bezierCurveTo(fx * 0.72, -fy * 1.40, fx + 5, -fy * 0.62, fx * 0.95, -fy * 0.30);
    if (h === 'scruff') { // josh: the fringe hangs down onto the brow
      g.quadraticCurveTo(fx * 0.60, -fy * 0.40, 2, -fy * 0.36);
      g.quadraticCurveTo(-fx * 0.52, -fy * 0.34, -fx * 0.90, fy * 0.10);
    } else {
      g.quadraticCurveTo(fx * 0.56, -fy * 0.70, 2, -fy * 0.66);
      g.quadraticCurveTo(-fx * 0.52, -fy * 0.62, -fx * 0.88, -fy * 0.16);
    }
    g.closePath(); g.fill(); g.stroke();

    g.fillStyle = d.hMid;
    if (h === 'spiky') {
      for (let i = 0; i < 10; i += 2) {
        const bx = SPIKES[i] * (fx / 46), by = SPIKES[i + 1] * (fy / 47);
        g.beginPath();
        g.moveTo(bx - 11, by * 0.72);
        g.lineTo(bx + 3 + sway * 0.6, by);
        g.lineTo(bx + 11, by * 0.70);
        g.closePath(); g.fill();
      }
    } else if (h === 'shaggy' || h === 'mop') {
      const A = h === 'mop' ? MOP : SHAG;
      for (let i = 0; i < A.length; i += 3) {
        g.beginPath();
        g.arc(A[i] * (fx / 46) + sway * 0.3, A[i + 1] * (fy / 47), A[i + 2], 0, 7);
        g.fill();
      }
    } else if (h === 'scruff') { // broad clumps, fill only — outlines read as ears
      g.beginPath(); g.moveTo(-fx * 0.86, -fy * 1.08); g.lineTo(-fx * 0.98, -fy * 1.34); g.lineTo(-fx * 0.16, -fy * 1.32); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-fx * 0.22, -fy * 1.34); g.lineTo(fx * 0.06, -fy * 1.50); g.lineTo(fx * 0.54, -fy * 1.36); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(fx * 0.52, -fy * 1.28); g.lineTo(fx * 1.06, -fy * 1.32); g.lineTo(fx * 0.98, -fy * 0.98); g.closePath(); g.fill();
      g.fillStyle = d.hDk; // parting shade instead of an outline
      g.beginPath();
      g.moveTo(-fx * 0.78, -fy * 1.00);
      g.quadraticCurveTo(-fx * 1.02, -fy * 1.28, -fx * 0.88, -fy * 0.30);
      g.quadraticCurveTo(-fx * 0.68, -fy * 0.86, -fx * 0.48, -fy * 1.02);
      g.closePath(); g.fill();
    }
    if (h === 'pony') { // gathered band at the back
      g.fillStyle = d.hDk;
      g.beginPath(); g.ellipse(-fx - 4, fy * 0.10, 9, 15, 0.3, 0, 7); g.fill();
    }
    if (h === 'long') { // two falls in front of the shoulders
      g.fillStyle = d.hMid;
      g.beginPath();
      g.moveTo(-fx - 2, -fy * 0.30);
      g.quadraticCurveTo(-fx - 20 + sway, fy * 1.30, -fx - 10 + sway * 1.3, fy * 2.60);
      g.lineTo(-fx + 12, fy * 2.60);
      g.quadraticCurveTo(-fx + 6, fy * 1.10, -fx + 6, -fy * 0.30);
      g.closePath(); g.fill();
      g.beginPath();
      g.moveTo(fx + 1, -fy * 0.30);
      g.quadraticCurveTo(fx + 16 - sway, fy * 1.20, fx + 8 - sway * 1.2, fy * 2.30);
      g.lineTo(fx - 8, fy * 2.30);
      g.quadraticCurveTo(fx - 6, fy * 1.00, fx - 4, -fy * 0.30);
      g.closePath(); g.fill();
    }
    // one highlight band, sun side
    g.strokeStyle = d.hLt; g.lineWidth = 5;
    g.beginPath();
    g.arc(0, -8, fx * 0.80, Math.PI * 1.06, Math.PI * 1.54);
    g.stroke();
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(0, -8, fx * 0.98, Math.PI * 1.14, Math.PI * 1.40);
    g.stroke();
    if (h === 'pony' || h === 'long') { // strand threads down the fall
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(-fx - 8, fy * 0.20); g.quadraticCurveTo(-fx - 16 + sway, fy * 0.90, -fx - 14 + sway, fy * 1.60);
      g.stroke();
    }
  }

  // ============================== eyes =================================
  function drawEye(g, d, e, cx, cy, w, h, open, front) {
    if (open <= 0.06) { // lids shut: one lash-weighted line with a crease
      g.strokeStyle = d.sOut; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(cx - w, cy - 1); g.quadraticCurveTo(cx, cy + 2.6, cx + w, cy - 1); g.stroke();
      g.strokeStyle = d.sDk; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx - w * 0.8, cy - 6); g.quadraticCurveTo(cx, cy - 8, cx + w * 0.8, cy - 5.6); g.stroke();
      return;
    }
    const hh = h * open;
    // socket: the eye sits IN the skull, not on it
    g.fillStyle = d.sDk;
    g.beginPath(); g.ellipse(cx, cy - hh * 0.18, w + 4.4, hh + 4.2, 0, 0, 7); g.fill();
    g.fillStyle = EYEW;
    g.beginPath(); g.ellipse(cx, cy, w, hh, 0, 0, 7); g.fill();
    g.save();
    g.beginPath(); g.ellipse(cx, cy, w, hh, 0, 0, 7); g.clip();
    const ir = hh * 0.80;
    const ix = cx + S.px * (front ? 1 : 0.86), iy = cy + S.py + hh * 0.06;
    g.fillStyle = d.ir;
    g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
    g.fillStyle = d.irD; // iris shading: dark under the lid, dark limbal edge
    g.beginPath(); g.arc(ix, iy - ir * 0.34, ir * 0.86, 0, 7); g.fill();
    g.fillStyle = d.irL; // light pooling at the bottom of the iris
    g.beginPath(); g.arc(ix, iy + ir * 0.40, ir * 0.52, 0, 7); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.arc(ix, iy, ir * 0.46 * e.pup, 0, 7); g.fill();
    g.fillStyle = LID_SHADE; // upper lid casts across the white
    g.beginPath(); g.ellipse(cx, cy - hh * 1.28, w * 1.2, hh * 0.72, 0, 0, 7); g.fill();
    // lids, painted in skin so they close over the eye
    const ltop = e.lt + (d.lidBias || 0) + S.tense * 0.10;
    if (ltop > 0.01) {
      g.fillStyle = d.sMid;
      g.beginPath(); g.ellipse(cx, cy - hh - 1 + hh * 2 * ltop, w * 1.35, hh, 0, 0, 7); g.fill();
    }
    if (e.lb > 0.01) { // lower lid rides up on a squint / a cheek push
      g.fillStyle = d.sDk;
      g.beginPath(); g.ellipse(cx, cy + hh + 1 - hh * 2 * e.lb, w * 1.3, hh * 0.9, 0, 0, 7); g.fill();
    }
    g.restore();
    // catchlights — the whole reason for drawing an eye this big
    g.fillStyle = CATCH;
    g.beginPath(); g.arc(ix - ir * 0.42, iy - ir * 0.46, ir * 0.28, 0, 7); g.fill();
    g.fillStyle = CATCH2;
    g.beginPath(); g.arc(ix + ir * 0.40, iy + ir * 0.38, ir * 0.16, 0, 7); g.fill();
    // lash line + crease
    g.strokeStyle = d.sOut; g.lineWidth = d.lash ? 3.6 : 2.6;
    g.beginPath();
    g.moveTo(cx - w - 1, cy - hh * 0.34);
    g.quadraticCurveTo(cx, cy - hh * 1.32, cx + w + 1, cy - hh * 0.30);
    g.stroke();
    g.strokeStyle = d.sDk; g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(cx - w * 0.86, cy - hh - 6.5);
    g.quadraticCurveTo(cx, cy - hh - 9.5, cx + w * 0.86, cy - hh - 6);
    g.stroke();
    if (d.lash) { // three flicks off the outer corner
      g.strokeStyle = INK; g.lineWidth = 2.2;
      const s = front ? 1 : -1;
      g.beginPath();
      g.moveTo(cx + s * w * 0.86, cy - hh * 0.62); g.lineTo(cx + s * (w + 8), cy - hh * 1.16);
      g.moveTo(cx + s * w * 0.60, cy - hh * 0.86); g.lineTo(cx + s * (w + 4), cy - hh * 1.44);
      g.moveTo(cx + s * w * 1.00, cy - hh * 0.26); g.lineTo(cx + s * (w + 9), cy - hh * 0.62);
      g.stroke();
    }
  }

  function deadEye(g, d, cx, cy, w, h, x) {
    g.strokeStyle = d.sOut; g.lineWidth = 4;
    g.beginPath();
    if (x) {
      g.moveTo(cx - w * 0.8, cy - h * 0.7); g.lineTo(cx + w * 0.8, cy + h * 0.7);
      g.moveTo(cx + w * 0.8, cy - h * 0.7); g.lineTo(cx - w * 0.8, cy + h * 0.7);
    } else { // squeezed shut
      g.moveTo(cx - w, cy + h * 0.5);
      g.quadraticCurveTo(cx, cy - h * 0.9, cx + w, cy + h * 0.5);
    }
    g.stroke();
  }

  // ============================== nose =================================
  function drawNose(g, d, bx, by) {
    if (!d.noseL) return;
    const l = d.noseL, w = d.noseW, hk = d.noseHk || 0;
    g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(bx - 2, by);
    g.quadraticCurveTo(bx + l * 0.72 + hk, by + l * 0.42, bx + l * 0.50, by + l);
    g.quadraticCurveTo(bx + l * 0.10, by + l * 1.16, bx - w * 0.62, by + l * 0.96);
    g.closePath(); g.fill(); g.stroke();
    if (d.noseBtn) { // button tip: a soft ball instead of a wedge
      g.fillStyle = d.sLt;
      g.beginPath(); g.arc(bx + l * 0.36, by + l * 0.80, w * 0.40, 0, 7); g.fill();
    }
    g.fillStyle = d.sHi; // bridge highlight, key side
    g.beginPath(); g.ellipse(bx - 3, by + l * 0.34, 3.2, l * 0.34, -0.24, 0, 7); g.fill();
    g.fillStyle = d.sOut; // nostril, flared under tension
    g.beginPath();
    g.ellipse(bx + l * 0.18, by + l * 0.92, 3.2 + S.tense * 1.6, 2 + S.tense * 0.7, 0.24, 0, 7);
    g.fill();
    g.fillStyle = SHADE; // cast shadow, down and away from the key
    g.beginPath(); g.ellipse(bx + l * 0.10, by + l * 1.22, w * 0.66, 4.2, 0.12, 0, 7); g.fill();
  }

  // ============================= mouth =================================
  function drawMouth(g, d, cx, cy, t) {
    const e = S.e;
    const w = d.mW, curve = e.mc + (d.mBias || 0);
    const open = e.mo * (d.slack ? 1.15 : 1);
    const kind = e.m;
    const dy = curve * w * 0.55;
    g.lineCap = 'round';
    if (kind === 'o') { // scared / surprised: a held oval
      const oh = 9 + open * 15, ow = w * (0.44 + open * 0.14);
      g.fillStyle = GUM;
      g.beginPath(); g.ellipse(cx, cy + 4, ow, oh, 0, 0, 7); g.fill();
      g.fillStyle = d.lipD; g.lineWidth = 3;
      g.strokeStyle = d.lipD;
      g.beginPath(); g.ellipse(cx, cy + 4, ow, oh, 0, 0, 7); g.stroke();
      g.fillStyle = TONGUE;
      g.beginPath(); g.ellipse(cx, cy + 4 + oh * 0.56, ow * 0.62, oh * 0.32, 0, 0, 7); g.fill();
      g.fillStyle = d.lipH;
      g.beginPath(); g.ellipse(cx - ow * 0.40, cy + 4 - oh * 0.70, ow * 0.26, 2, 0, 0, 7); g.fill();
      return;
    }
    if (kind === 'shout') { // jaw fully dropped, tongue and lower teeth
      const oh = 26, ow = w * 0.92;
      g.fillStyle = GUM_HOT;
      g.beginPath();
      g.moveTo(cx - ow, cy - 4);
      g.quadraticCurveTo(cx, cy - 12, cx + ow, cy - 4);
      g.quadraticCurveTo(cx + ow * 0.72, cy + oh, cx, cy + oh);
      g.quadraticCurveTo(cx - ow * 0.72, cy + oh, cx - ow, cy - 4);
      g.closePath(); g.fill();
      g.fillStyle = TEETH; // upper row follows the lip
      g.beginPath();
      g.moveTo(cx - ow * 0.86, cy - 4.6); g.lineTo(cx + ow * 0.86, cy - 4.6);
      g.lineTo(cx + ow * 0.80, cy + 3.4); g.lineTo(cx - ow * 0.80, cy + 3.4);
      g.closePath(); g.fill();
      g.fillStyle = TONGUE;
      g.beginPath(); g.ellipse(cx, cy + oh * 0.66, ow * 0.58, oh * 0.30, 0, 0, 7); g.fill();
      g.strokeStyle = d.lipD; g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(cx - ow, cy - 4); g.quadraticCurveTo(cx, cy - 12, cx + ow, cy - 4);
      g.stroke();
      return;
    }
    if (kind === 'teeth') { // rage: lip peeled back off a bared row
      const ow = w * 0.98;
      g.fillStyle = GUM_HOT;
      g.beginPath();
      g.moveTo(cx - ow, cy - 2);
      g.quadraticCurveTo(cx, cy - 13, cx + ow, cy - 2);
      g.quadraticCurveTo(cx, cy + 17, cx - ow, cy - 2);
      g.closePath(); g.fill();
      g.fillStyle = TEETH; // upper zigzag: real teeth, not a bar
      g.beginPath();
      g.moveTo(cx - ow * 0.88, cy - 4);
      g.lineTo(cx + ow * 0.88, cy - 4);
      g.lineTo(cx + ow * 0.72, cy + 4.6);
      g.lineTo(cx + ow * 0.44, cy - 1.4);
      g.lineTo(cx + ow * 0.14, cy + 5.2);
      g.lineTo(cx - ow * 0.18, cy - 1.4);
      g.lineTo(cx - ow * 0.48, cy + 5);
      g.lineTo(cx - ow * 0.74, cy - 1);
      g.closePath(); g.fill();
      g.fillStyle = TEETH_DK;
      g.beginPath();
      g.moveTo(cx - ow * 0.64, cy + 12.4); g.lineTo(cx + ow * 0.64, cy + 12.4);
      g.lineTo(cx + ow * 0.50, cy + 7.4); g.lineTo(cx - ow * 0.50, cy + 7.4);
      g.closePath(); g.fill();
      g.strokeStyle = d.lipD; g.lineWidth = 3.6;
      g.beginPath();
      g.moveTo(cx - ow, cy - 2); g.quadraticCurveTo(cx, cy - 13, cx + ow, cy - 2);
      g.stroke();
      return;
    }
    if (kind === 'grit') { // hurt: clenched, teeth showing through
      g.fillStyle = GUM;
      g.beginPath();
      g.moveTo(cx - w * 0.9, cy - 6);
      g.quadraticCurveTo(cx, cy - 2, cx + w * 0.9, cy - 6);
      g.quadraticCurveTo(cx, cy + 12, cx - w * 0.9, cy - 6);
      g.closePath(); g.fill();
      g.fillStyle = TEETH;
      g.beginPath(); g.rect(cx - w * 0.80, cy - 5.4, w * 1.60, 8.4); g.fill();
      g.strokeStyle = TEETH_DK; g.lineWidth = 1.4;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(cx + i * w * 0.30, cy - 5.4); g.lineTo(cx + i * w * 0.30, cy + 3);
        g.stroke();
      }
      g.strokeStyle = d.lipD; g.lineWidth = 3.2;
      g.beginPath();
      g.moveTo(cx - w * 0.94, cy - 6); g.quadraticCurveTo(cx, cy - 1, cx + w * 0.94, cy - 6);
      g.stroke();
      return;
    }
    // the curve family: line / frown / smile / firm / smirk / wobble
    let lx = cx - w, rx = cx + w;
    let ly = cy, ry = cy;
    if (kind === 'smirk' || d.asym) { ry = cy - Math.abs(dy) * 1.5; ly = cy + 2; }
    if (kind === 'frown') { ly = cy - Math.abs(dy) * 0.5; ry = cy - Math.abs(dy) * 0.5; }
    g.strokeStyle = d.lipD; g.lineWidth = kind === 'firm' ? 5 : 4;
    g.beginPath();
    if (kind === 'wobble') { // sad: a trembling line, not a frown
      const q = Math.sin(t * 9) * 1.4;
      g.moveTo(lx, ly - dy * 0.4);
      g.quadraticCurveTo(cx - w * 0.5, cy + 5 + q, cx, cy + 1);
      g.quadraticCurveTo(cx + w * 0.5, cy - 3 - q, rx, ry - dy * 0.4);
    } else {
      g.moveTo(lx, ly);
      g.quadraticCurveTo(cx, cy + dy * 2, rx, ry);
    }
    g.stroke();
    if (open > 0.02) { // parted lips
      g.fillStyle = GUM;
      g.beginPath();
      g.moveTo(lx, ly);
      g.quadraticCurveTo(cx, cy + dy * 2, rx, ry);
      g.quadraticCurveTo(cx, cy + dy * 2 + open * 22, lx, ly);
      g.closePath(); g.fill();
      if (d.toothy) { // brooks: the teeth ARE the character
        g.fillStyle = TEETH;
        g.beginPath(); g.rect(cx - w * 0.62, cy + dy * 0.9, w * 1.24, 9); g.fill();
        g.strokeStyle = TEETH_DK; g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(cx, cy + dy * 0.9); g.lineTo(cx, cy + dy * 0.9 + 9);
        g.stroke();
      }
    }
    // lower lip volume + one highlight, top-left key
    g.fillStyle = d.lip;
    g.beginPath();
    g.moveTo(lx + 2, ly + 1);
    g.quadraticCurveTo(cx, cy + dy * 2 + 9, rx - 2, ry + 1);
    g.quadraticCurveTo(cx, cy + dy * 2 + 2, lx + 2, ly + 1);
    g.closePath(); g.fill();
    g.fillStyle = d.lipH;
    g.beginPath(); g.ellipse(cx - w * 0.26, cy + dy * 2 + 4.4, w * 0.24, 2, -0.1, 0, 7); g.fill();
  }

  // ==================== creature muzzles (campaign / forms) ============
  function plushMuzzle(g, d, t) {
    const e = S.e;
    g.fillStyle = '#f2e3bf'; g.strokeStyle = '#9c8455'; g.lineWidth = 3.4;
    g.beginPath(); g.ellipse(20, 18, 34, 27, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff7e2';
    g.beginPath(); g.ellipse(8, 6, 15, 9, -0.3, 0, 7); g.fill();
    g.fillStyle = '#d8c69c';
    g.beginPath(); g.ellipse(31, 35, 15, 8, 0.3, 0, 7); g.fill();
    g.fillStyle = '#9c8455';
    g.beginPath(); g.ellipse(28, 1, 7, 4.6, 0, 0, 7); g.fill();
    const grin = e.m === 'frown' || e.m === 'wobble' ? -1 : 1;
    g.fillStyle = '#5c2038';
    g.beginPath();
    g.moveTo(-4, 14);
    g.quadraticCurveTo(26, 9, 56, 17);
    g.quadraticCurveTo(28, 17 + grin * 30, -4, 14);
    g.closePath(); g.fill();
    g.fillStyle = TEETH;
    g.beginPath();
    g.moveTo(0, 9); g.lineTo(52, 12); g.lineTo(50, 20);
    g.lineTo(43, 12); g.lineTo(35, 21); g.lineTo(27, 11);
    g.lineTo(19, 21); g.lineTo(11, 10); g.lineTo(3, 18);
    g.closePath(); g.fill();
    g.fillStyle = TEETH; g.strokeStyle = TEETH_DK; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(7, 34); g.lineTo(8, 16);
    g.quadraticCurveTo(15, 13, 19, 17); g.lineTo(21, 34);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(33, 33); g.lineTo(34, 15);
    g.quadraticCurveTo(41, 12, 45, 16); g.lineTo(47, 33);
    g.closePath(); g.fill(); g.stroke();
  }

  function beakMuzzle(g, d, t) {
    const e = S.e;
    const gape = e.mo * 13;
    g.fillStyle = '#e8a020'; g.strokeStyle = '#68472a'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(14, 4); g.lineTo(66, 14 - gape * 0.4); g.lineTo(16, 24 - gape * 0.2);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(16, 26 + gape * 0.5); g.lineTo(58, 22 + gape); g.lineTo(16, 38 + gape * 0.8);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f5cf88';
    g.beginPath(); g.moveTo(16, 7); g.lineTo(46, 13); g.lineTo(17, 16); g.closePath(); g.fill();
    g.fillStyle = '#68472a';
    g.beginPath(); g.ellipse(24, 10, 3, 2, 0, 0, 7); g.fill();
    g.fillStyle = '#d43b2f'; g.strokeStyle = '#612030'; g.lineWidth = 2.4; // wattle
    g.beginPath(); g.ellipse(24, 46, 8, 13, 0.2, 0, 7); g.fill(); g.stroke();
  }

  function loafMuzzle(g, d, t) {
    g.fillStyle = '#f1d3a5'; // sesame seeds
    for (let i = 0; i < SEEDS.length; i += 2) {
      g.beginPath(); g.ellipse(SEEDS[i], SEEDS[i + 1], 3.4, 2.2, 0.5, 0, 7); g.fill();
    }
    g.strokeStyle = '#a57a52'; g.lineWidth = 3; // bake split across the crust
    g.beginPath();
    g.moveTo(-34, -12); g.quadraticCurveTo(0, -22, 36, -10);
    g.stroke();
    drawMouth(g, d, 16, 22, S.t);
  }

  // ============================= headgear ==============================
  function drawGear(g, d, t) {
    const fx = d.fx, fy = d.fy;
    if (d.band) { // the gameplay headband, in the character's own colour
      g.fillStyle = S.cDk;
      g.beginPath();
      g.moveTo(-fx - 3, -fy * 0.44);
      g.quadraticCurveTo(0, -fy * 1.06, fx + 3, -fy * 0.40);
      g.lineTo(fx + 2, -fy * 0.14);
      g.quadraticCurveTo(0, -fy * 0.80, -fx - 2, -fy * 0.18);
      g.closePath(); g.fill();
      g.fillStyle = d.cMid;
      g.beginPath();
      g.moveTo(-fx - 3, -fy * 0.44);
      g.quadraticCurveTo(0, -fy * 1.06, fx + 3, -fy * 0.40);
      g.lineTo(fx + 2, -fy * 0.26);
      g.quadraticCurveTo(0, -fy * 0.92, -fx - 2, -fy * 0.30);
      g.closePath(); g.fill();
      g.fillStyle = S.cLt; // key-side band highlight
      g.beginPath(); g.ellipse(-fx * 0.46, -fy * 0.80, 12, 4, -0.42, 0, 7); g.fill();
      g.fillStyle = d.cMid; // band tail, streaming behind
      g.beginPath();
      g.moveTo(-fx - 1, -fy * 0.42);
      g.quadraticCurveTo(-fx - 22, fy * 0.10, -fx - 16 + Math.sin(t * 1.6) * 4, fy * 0.72);
      g.lineTo(-fx - 5 + Math.sin(t * 1.6) * 3, fy * 0.66);
      g.quadraticCurveTo(-fx - 8, fy * 0.06, -fx + 5, -fy * 0.28);
      g.closePath(); g.fill();
    }
    if (d.cap) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath(); g.ellipse(0, -fy * 0.38, fx + 5, fy * 0.98, 0, Math.PI, 7); g.fill(); g.stroke();
      g.fillStyle = d.gDk;
      g.beginPath();
      g.moveTo(fx * 0.10, -fy * 0.50);
      g.quadraticCurveTo(fx + 40, -fy * 0.70, fx + 46, -fy * 0.26);
      g.quadraticCurveTo(fx + 20, -fy * 0.18, fx * 0.10, -fy * 0.34);
      g.closePath(); g.fill();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-fx * 0.40, -fy * 0.92, 14, 7, -0.4, 0, 7); g.fill();
      g.fillStyle = d.gOut;
      g.beginPath(); g.arc(0, -fy * 1.30, 4.4, 0, 7); g.fill();
    }
    if (d.helmet) { // firefighter shell: dome, wide front brim, front shield
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3.4;
      g.beginPath(); g.ellipse(0, -fy * 0.30, fx + 7, fy * 1.06, 0, Math.PI, 7); g.fill(); g.stroke();
      g.fillStyle = d.gDk;
      g.beginPath();
      g.moveTo(-fx - 16, -fy * 0.34);
      g.quadraticCurveTo(0, -fy * 0.62, fx + 30, -fy * 0.36);
      g.quadraticCurveTo(fx + 34, -fy * 0.06, fx + 12, -fy * 0.10);
      g.quadraticCurveTo(0, -fy * 0.34, -fx - 12, -fy * 0.12);
      g.closePath(); g.fill();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-fx * 0.42, -fy * 0.96, 16, 8, -0.4, 0, 7); g.fill();
      g.fillStyle = d.acc; // hi-vis front shield
      g.beginPath();
      g.moveTo(4, -fy * 1.16); g.lineTo(20, -fy * 1.00); g.lineTo(12, -fy * 0.62);
      g.lineTo(-2, -fy * 0.70);
      g.closePath(); g.fill();
      g.fillStyle = d.gOut;
      g.beginPath(); g.arc(9, -fy * 0.92, 3.4, 0, 7); g.fill();
      if (d.lightbar) { // FIRETRUCK: the shell runs live emergency lights
        const on = Math.floor(t * 5) % 2 === 0;
        g.fillStyle = on ? '#ff4a3a' : '#4a86e8';
        g.beginPath(); g.rect(-fx * 0.66, -fy * 1.34, 16, 8); g.fill();
        g.fillStyle = on ? '#4a86e8' : '#ff4a3a';
        g.beginPath(); g.rect(fx * 0.24, -fy * 1.34, 16, 8); g.fill();
      }
      g.strokeStyle = d.sDk; g.lineWidth = 3; // chin strap
      g.beginPath();
      g.moveTo(-fx - 2, -fy * 0.10); g.quadraticCurveTo(d.cx0, d.fc + 6, fx - 2, -fy * 0.06);
      g.stroke();
    }
    if (d.crown) {
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(CROWN[0], CROWN[1]);
      for (let i = 2; i < CROWN.length; i += 2) g.lineTo(CROWN[i], CROWN[i + 1]);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.rect(-30, -52, 62, 4); g.fill();
      g.fillStyle = d.cMid;
      g.beginPath(); g.arc(2, -58, 5.4, 0, 7); g.fill();
      g.beginPath(); g.arc(-19, -50, 3.6, 0, 7); g.fill();
      g.beginPath(); g.arc(23, -50, 3.6, 0, 7); g.fill();
    }
    if (d.bow) { // addi's hair bow, riding the pony band
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 2.6;
      g.beginPath(); g.ellipse(-fx - 14, -fy * 0.20, 13, 9, -0.5, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(-fx - 2, fy * 0.10, 12, 9, -0.5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.arc(-fx - 8, -fy * 0.04, 4.6, 0, 7); g.fill();
    }
    if (d.visor) { // MECHA HAYES: sealed plate, cyan bar
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3.4;
      g.beginPath(); g.roundRect(-fx - 4, -fy * 1.16, fx * 2 + 8, fy * 1.62, 12); g.fill(); g.stroke();
      g.fillStyle = d.gDk;
      g.beginPath(); g.roundRect(-fx - 10, -fy * 0.50, 14, 30, 5); g.fill();
      g.beginPath(); g.roundRect(fx - 4, -fy * 0.50, 14, 30, 5); g.fill();
      g.fillStyle = d.vOut;
      g.beginPath(); g.roundRect(-fx * 0.72, -fy * 0.42, fx * 1.5, 26, 6); g.fill();
      g.fillStyle = d.vMid;
      g.beginPath(); g.roundRect(-fx * 0.66, -fy * 0.38, fx * 1.4, 20, 5); g.fill();
      g.fillStyle = d.vLt;
      g.beginPath(); g.rect(-fx * 0.58, -fy * 0.32, fx * 0.7, 5); g.fill();
      g.fillStyle = d.gLt;
      g.beginPath(); g.rect(-fx * 0.30, -fy * 1.02, 30, 6); g.fill();
    }
    if (d.machine) { // 3D PRINTER JEROD: gantry frame + a hot extruder
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3;
      g.beginPath(); g.rect(-fx - 16, -fy * 1.42, 12, fy * 2.5); g.fill(); g.stroke();
      g.beginPath(); g.rect(fx + 4, -fy * 1.42, 12, fy * 2.5); g.fill(); g.stroke();
      g.beginPath(); g.rect(-fx - 16, -fy * 1.52, fx * 2 + 32, 13); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.rect(-fx - 13, -fy * 1.49, fx * 1.1, 4); g.fill();
      g.fillStyle = '#4a505c';
      g.beginPath(); g.rect(fx * 0.10, -fy * 1.36, 20, 16); g.fill();
      g.fillStyle = '#ff7a2c';
      g.beginPath();
      g.moveTo(fx * 0.10 + 6, -fy * 1.20); g.lineTo(fx * 0.10 + 14, -fy * 1.20);
      g.lineTo(fx * 0.10 + 10, -fy * 1.06);
      g.closePath(); g.fill();
      g.fillStyle = d.cMid;
      g.beginPath(); g.rect(fx * 0.10 + 8.6, -fy * 1.06, 3, 14); g.fill();
    }
    if (d.wrench) { // WRENCHY: the jaws bracket his face
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 3.4;
      g.beginPath(); g.roundRect(-fx - 22, -fy * 1.34, 18, fy * 1.10, 5); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(fx + 6, -fy * 1.34, 18, fy * 1.10, 5); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(-fx - 22, -fy * 1.46, fx * 2 + 46, 16, 5); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.rect(-fx - 18, -fy * 1.42, fx * 1.2, 5); g.fill();
      g.fillStyle = d.sDk;
      g.beginPath(); g.arc(-fx - 13, -fy * 0.50, 5, 0, 7); g.fill();
      g.beginPath(); g.arc(fx + 15, -fy * 0.50, 5, 0, 7); g.fill();
    }
    if (d.comb) { // GIANT CHICKEN: comb over the crown
      g.fillStyle = d.gMid; g.strokeStyle = d.gOut; g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-22, -fy * 0.90);
      g.quadraticCurveTo(-16, -fy * 1.44, -6, -fy * 0.96);
      g.quadraticCurveTo(2, -fy * 1.52, 12, -fy * 0.94);
      g.quadraticCurveTo(20, -fy * 1.42, 28, -fy * 0.86);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = d.gLt;
      g.beginPath(); g.ellipse(-12, -fy * 1.16, 5, 3.4, -0.4, 0, 7); g.fill();
    }
    if (d.horns) { // petmonster
      g.fillStyle = '#e0cf9e'; g.strokeStyle = '#8a7548'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-34, -34); g.lineTo(-24, -56); g.lineTo(-4, -38); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(22, -38); g.lineTo(38, -56); g.lineTo(48, -32); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f6ecc8';
      g.beginPath(); g.moveTo(-34, -34); g.lineTo(-24, -56); g.lineTo(-18, -38); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(22, -38); g.lineTo(38, -56); g.lineTo(38, -36); g.closePath(); g.fill();
    }
    if (d.glasses) { // RYAN DUGAN
      g.strokeStyle = d.glassCol || '#2a2a35'; g.lineWidth = 3.4;
      g.beginPath(); g.arc(-3 * S.k, -3, 17, 0, 7); g.stroke();
      g.beginPath(); g.arc(29 * S.k, -3, 17, 0, 7); g.stroke();
      g.beginPath();
      g.moveTo(-3 * S.k + 17, -5); g.lineTo(29 * S.k - 17, -5);
      g.moveTo(-3 * S.k - 17, -5); g.lineTo(-d.fx - 2, -10);
      g.stroke();
      g.strokeStyle = RIM_SOFT; g.lineWidth = 4; // lens glare, key side
      g.beginPath(); g.moveTo(-11 * S.k, -12); g.lineTo(-1 * S.k, -1); g.stroke();
      g.beginPath(); g.moveTo(21 * S.k, -12); g.lineTo(31 * S.k, -1); g.stroke();
    }
    if (d.baby) { // isla: one proud curl and the pacifier she wants back
      g.strokeStyle = d.hMid; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.arc(-4, -fy * 1.10, 13, Math.PI * 0.15, Math.PI * 1.45); g.stroke();
      g.strokeStyle = d.hLt; g.lineWidth = 2.4;
      g.beginPath(); g.arc(-4, -fy * 1.10, 13, Math.PI * 0.9, Math.PI * 1.35); g.stroke();
    }
  }

  // =============================== bust ================================
  function drawBust(g, d, t) {
    const top = d.fc + 4;
    // shoulders / chest — a broad wedge running off the bottom of the frame
    const fill = d.bare ? d.sMid : d.cMid;
    const dk = d.bare ? d.sDk : S.cDk;
    const lt = d.bare ? d.sLt : S.cLt;
    const out = d.bare ? d.sOut : S.cOut;
    g.fillStyle = fill; g.strokeStyle = out; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-118, 176);
    g.quadraticCurveTo(-112, 96, -40, top + 30);
    g.lineTo(42, top + 30);
    g.quadraticCurveTo(114, 96, 120, 176);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = dk; // shaded flank, away from the key
    g.beginPath();
    g.moveTo(52, top + 34);
    g.quadraticCurveTo(114, 100, 120, 176);
    g.lineTo(72, 176);
    g.quadraticCurveTo(74, 108, 34, top + 40);
    g.closePath(); g.fill();
    g.strokeStyle = lt; g.lineWidth = 5; // lit trapezius edge, top-left key
    g.beginPath();
    g.moveTo(-104, 168); g.quadraticCurveTo(-100, 102, -44, top + 38);
    g.stroke();

    // neck, then its shadow under the jaw
    g.fillStyle = d.sMid; g.strokeStyle = d.sOut; g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(-30, top - 22);
    g.quadraticCurveTo(-34, top + 26, -40, top + 44);
    g.lineTo(42, top + 44);
    g.quadraticCurveTo(34, top + 24, 30, top - 22);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = d.sDk;
    g.beginPath();
    g.moveTo(6, top - 6); g.quadraticCurveTo(30, top + 4, 32, top + 30);
    g.lineTo(42, top + 32); g.lineTo(40, top - 10);
    g.closePath(); g.fill();
    g.fillStyle = NECK_SHADE; // the jaw casts onto the throat
    g.beginPath(); g.ellipse(d.cx0, top - 12, 34, 15, 0, 0, 7); g.fill();
    g.strokeStyle = d.sOut; g.lineWidth = 2.6; // sternocleidomastoid
    g.beginPath(); g.moveTo(-14, top - 14); g.quadraticCurveTo(-6, top + 16, 6, top + 40); g.stroke();

    // collar over the neck root, then a collarbone hint
    if (!d.bare) {
      g.fillStyle = d.cMid; g.strokeStyle = S.cOut; g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(-64, top + 26);
      g.quadraticCurveTo(-30, top + 30, -22, top + 40);
      g.quadraticCurveTo(d.cx0, top + 74, 26, top + 40);
      g.quadraticCurveTo(34, top + 30, 68, top + 26);
      g.lineTo(74, top + 52);
      g.quadraticCurveTo(d.cx0, top + 100, -70, top + 52);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = S.cLt;
      g.beginPath(); g.ellipse(-52, top + 40, 16, 6, 0.24, 0, 7); g.fill();
      if (d.print) { // josh's band tee
        g.fillStyle = d.acc;
        g.beginPath(); g.rect(-26, top + 84, 56, 9); g.fill();
        g.fillStyle = '#ffd24a';
        g.beginPath();
        g.moveTo(2, top + 74); g.lineTo(16, top + 74); g.lineTo(6, top + 84);
        g.lineTo(18, top + 84); g.lineTo(0, top + 100); g.lineTo(6, top + 86);
        g.closePath(); g.fill();
      }
    } else { // shirtless: collarbone and pec shelf instead of a collar
      g.strokeStyle = d.sDk; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-72, top + 44); g.quadraticCurveTo(-32, top + 34, -8, top + 46);
      g.moveTo(74, top + 42); g.quadraticCurveTo(36, top + 32, 12, top + 44);
      g.stroke();
      g.beginPath();
      g.moveTo(-78, top + 92); g.quadraticCurveTo(d.cx0, top + 74, 80, top + 90);
      g.stroke();
      g.strokeStyle = d.sLt; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-74, top + 50); g.quadraticCurveTo(-34, top + 40, -10, top + 52);
      g.stroke();
    }
    if (d.ruff) { // GIANT CHICKEN: feather ruff instead of a collar
      g.fillStyle = d.sLt; g.strokeStyle = d.sOut; g.lineWidth = 2.4;
      for (let i = -5; i <= 5; i++) {
        g.beginPath();
        g.ellipse(i * 19, top + 40 + Math.abs(i) * 4, 15, 24, i * 0.14, 0, 7);
        g.fill(); g.stroke();
      }
    }
  }

  // ============================ main draw ==============================
  F.has = function (id) { return !!D[id]; };

  F.draw = function (g, spec) {
    const id = spec.id;
    const d = (spec.ascended && ASC[id]) || D[id];
    if (!d) return;
    const e = EXPR[spec.expr] || EXPR.neutral;
    const t = spec.t || 0;

    // the shirt follows the game's own memoised ramp when the caller hands it
    // over, so a close-up torso and the gameplay torso are the same four tones
    S.cOut = d.cOut; S.cDk = d.cDk; S.cLt = d.cLt;
    if (spec.ramp && d.cMid) {
      const r = spec.ramp(d.cMid);
      S.cOut = r.out; S.cDk = r.dk; S.cLt = r.lt;
    }
    S.d = d; S.e = e; S.t = t;
    S.k = d.fx / 46; S.v = d.fy / 47;
    S.tense = e.tn;

    // idle life: breathing, an irregular blink, a slow pupil drift, hair settle
    const breath = Math.sin(t * 1.15) * 1.5 + (d.floaty ? Math.sin(t * 0.7) * 3 : 0);
    const bClock = t * 0.43 + Math.sin(t * 0.21) * 0.7;
    const bFrac = bClock - Math.floor(bClock);
    const blink = e.bl && bFrac < 0.055 ? 1 - Math.abs(bFrac - 0.0275) / 0.0275 : 0;
    S.px = (Math.sin(t * 0.7) * 1.5 + Math.sin(t * 0.23) * 1.1) * (e.pup < 0.6 ? 0.3 : 1);
    S.py = Math.sin(t * 0.53) * 0.9;
    const sway = Math.sin(t * 1.3) * 2 + Math.sin(t * 0.47) * 1.4;
    const shake = e.sk ? Math.sin(t * 47) * e.sk : 0;

    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (spec.facing < 0) g.scale(-1, 1);
    g.translate(shake, breath * 0.4);

    // ---- ascended aura, behind everything (flat rings, never a gradient) ----
    if (d.aur1) {
      const pulse = 6 + Math.sin(t * 1.4) * 4;
      g.lineWidth = 9;
      g.strokeStyle = d.aur1;
      g.beginPath(); g.arc(0, 8, d.fx + 26 + pulse * 0.4, 0, 7); g.stroke();
      g.strokeStyle = d.aur2;
      g.beginPath(); g.arc(0, 8, d.fx + 46 + pulse * 0.7, 0, 7); g.stroke();
      g.strokeStyle = d.aur3;
      g.beginPath(); g.arc(0, 8, d.fx + 68 + pulse, 0, 7); g.stroke();
      g.fillStyle = d.aur1;
      for (let i = 0; i < MOTES.length; i += 3) {
        const my = MOTES[i + 1] + Math.sin(t * 0.9 + MOTES[i + 2]) * 9;
        g.beginPath(); g.arc(MOTES[i], my, 3.4, 0, 7); g.fill();
      }
    }

    hairBack(g, d, sway);
    drawBust(g, d, t);
    g.translate(0, breath * 0.5); // the head rides the breath a beat later

    // ---- head ----
    headPath(g, d.fx, d.fy, d.fj, d.fc, d.cx0);
    g.fillStyle = d.sMid; g.fill();
    g.strokeStyle = d.sOut; g.lineWidth = 3.6; g.stroke();
    g.save();
    headPath(g, d.fx, d.fy, d.fj, d.fc, d.cx0);
    g.clip();
    g.fillStyle = SHADE; // back plane falls away from the light
    g.beginPath(); g.rect(-d.fx - 4, -d.fy * 1.4, d.fx * 0.44, d.fc * 2.4); g.fill();
    g.fillStyle = SHADE_HARD; // under the jaw and the cheekbone
    g.beginPath(); g.ellipse(d.cx0 + 4, d.fc * 0.82, d.fj * 0.92, 13, 0, 0, 7); g.fill();
    g.fillStyle = d.sLt; // form light: forehead and front cheekbone
    g.beginPath(); g.ellipse(-2, -d.fy * 0.72, d.fx * 0.56, 15, -0.16, 0, 7); g.fill();
    g.beginPath(); g.ellipse(d.fx * 0.52, d.fy * 0.30, 15, 11, -0.3, 0, 7); g.fill();
    g.fillStyle = d.sHi;
    g.beginPath(); g.ellipse(-d.fx * 0.26, -d.fy * 0.86, 16, 6.4, -0.24, 0, 7); g.fill();
    if (d.jowl) { // RICKMOTHY: the jaw gives up
      g.fillStyle = d.sDk;
      g.beginPath(); g.ellipse(-d.fx * 0.5, d.fc * 0.74, 16, 12, 0.2, 0, 7); g.fill();
      g.beginPath(); g.ellipse(d.fx * 0.58, d.fc * 0.70, 16, 12, -0.2, 0, 7); g.fill();
    }
    if (S.tense > 0.4) { // jaw muscle bunches at the hinge
      g.fillStyle = d.sDk;
      g.beginPath(); g.ellipse(-d.fx * 0.62, d.fy * 0.42, 9, 13 * S.tense, 0.2, 0, 7); g.fill();
    }
    // flush: overlapping bands stack into a smoother ramp than one fill
    const fl = e.fl + (d.baseFlush ? 0.4 : 0);
    if (fl > 0.05) {
      g.fillStyle = FLUSH_LO;
      g.beginPath(); g.ellipse(d.cx0, d.fy * 0.44, d.fx, 17, 0, 0, 7); g.fill();
      if (fl > 0.28) {
        g.fillStyle = FLUSH_MID;
        g.beginPath(); g.ellipse(d.cx0, d.fy * 0.18, d.fx, 20, 0, 0, 7); g.fill();
      }
      if (fl > 0.7) {
        g.fillStyle = FLUSH_HOT;
        g.beginPath(); g.ellipse(d.cx0, -d.fy * 0.16, d.fx, 22, 0, 0, 7); g.fill();
        g.fillStyle = FLUSH_MID;
        g.beginPath(); g.ellipse(d.cx0, -d.fy * 0.62, d.fx * 0.96, 18, 0, 0, 7); g.fill();
      }
    }
    if (d.blush || d.baby) {
      g.fillStyle = fl > 0.5 ? BLUSH_HOT : BLUSH;
      g.beginPath(); g.ellipse(-d.fx * 0.52, d.fy * 0.34, 13, 8, -0.14, 0, 7); g.fill();
      g.beginPath(); g.ellipse(d.fx * 0.56, d.fy * 0.30, 14, 8.6, -0.14, 0, 7); g.fill();
    }
    if (d.stubble) {
      g.fillStyle = STUB;
      for (let i = 0; i < STUBBLE.length; i += 2) {
        g.beginPath(); g.arc(STUBBLE[i] * S.k + d.cx0 * 0.4, STUBBLE[i + 1] * S.v, 2.1, 0, 7); g.fill();
      }
    }
    if (d.freckle) {
      g.fillStyle = FRECK;
      for (let i = 0; i < FRECKLES.length; i += 2) {
        g.beginPath(); g.arc(FRECKLES[i] * S.k, FRECKLES[i + 1] * S.v, 2.2, 0, 7); g.fill();
      }
    }
    g.restore();
    // warm sun rim on the upper-left edge, riding just inside the outline
    g.strokeStyle = RIM; g.lineWidth = 4;
    g.beginPath(); g.arc(0, -4, d.fx - 2, Math.PI * 1.04, Math.PI * 1.60); g.stroke();

    // ear, before the hair so low styles overlap it
    if (!d.visor && !d.helmet && !d.muzzle) {
      g.fillStyle = d.sMid; g.strokeStyle = d.sOut; g.lineWidth = 2.6;
      g.beginPath(); g.ellipse(-d.fx * 0.94, 6, 8, 13, -0.12, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = d.sDk; g.lineWidth = 2.4;
      g.beginPath(); g.arc(-d.fx * 0.94 + 1, 6, 5, Math.PI * 0.35, Math.PI * 1.55); g.stroke();
    }
    if (d.plushEar) {
      g.fillStyle = d.sDk; g.strokeStyle = d.sOut; g.lineWidth = 3;
      g.beginPath(); g.arc(-d.fx - 4, -14, 15, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(d.fx + 6, -18, 15, 0, 7); g.fill(); g.stroke();
    }
    hairFront(g, d, sway, t);
    if (d.bald) { // the Toddfather shine
      g.strokeStyle = RIM; g.lineWidth = 5;
      g.beginPath(); g.arc(-4, -6, d.fx * 0.62, Math.PI * 1.16, Math.PI * 1.58); g.stroke();
    }
    if (d.seam) { // petmonster stitching
      g.strokeStyle = d.seam; g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-24, -32); g.lineTo(-16, -24);
      g.moveTo(-8, -18); g.lineTo(-2, -10);
      g.stroke();
    }

    // ---- face ----
    const eSp = (d.eyeSp || 1) * S.k;
    const e1x = -3 * eSp, e2x = 27 * eSp;
    const eY = -4 * S.v + (d.eyeY || 0);
    const eh = d.eH * e.eye;
    const open = Math.max(0, 1 - blink);
    if (!d.visor) {
      if (e.m === 'grit' && e.lt > 0.85) { // hurt: the eyes give out entirely
        deadEye(g, d, e1x, eY, d.eW, eh, d.xeye);
        deadEye(g, d, e2x, eY, d.eW, eh, d.xeye);
      } else {
        drawEye(g, d, e, e1x, eY, d.eW * 0.94, eh, open, 0);
        drawEye(g, d, e, e2x, eY, d.eW, eh, open, 1);
        if (d.glow) { // damon's eyes are lit from inside
          g.fillStyle = 'rgba(255,72,28,0.34)';
          g.beginPath(); g.arc(e1x, eY, d.eW * 1.1, 0, 7); g.fill();
          g.beginPath(); g.arc(e2x, eY, d.eW * 1.1, 0, 7); g.fill();
        }
      }
      // brows last over the lids — inner ends carry the expression
      const bY = -25 * S.v;
      const bi = e.bi + (d.bt || 0) * 0.2, bo = e.bo;
      g.fillStyle = d.beard ? d.bMid : d.hMid;
      // back eye: its inner end is the +x one
      browShape(g, e1x + d.eW + 3, bY + bi, e1x - d.eW - 6, bY + bo + (d.bt || 0), d.bw, d.bw * 0.52);
      // front eye: inner end is the -x one
      browShape(g, e2x - d.eW - 3, bY + bi, e2x + d.eW + 7, bY + bo + (d.bt || 0), d.bw, d.bw * 0.52);
      if (e.fl > 0.7) { // rage: the brow ridge bulges and a vein pops
        g.fillStyle = d.sDk;
        g.beginPath(); g.ellipse(e2x - 4, bY + 9, d.eW * 1.3, 7, -0.16, 0, 7); g.fill();
        g.strokeStyle = VEIN; g.lineWidth = 3;
        g.beginPath();
        g.moveTo(-d.fx * 0.50, -d.fy * 0.86);
        g.lineTo(-d.fx * 0.34, -d.fy * 0.66);
        g.lineTo(-d.fx * 0.52, -d.fy * 0.50);
        g.stroke();
      }
      if (e.bi < -6) { // scared / sad: forehead creases
        g.strokeStyle = d.sDk; g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(-d.fx * 0.5, bY - 16); g.quadraticCurveTo(d.cx0, bY - 22, d.fx * 0.66, bY - 14);
        g.moveTo(-d.fx * 0.44, bY - 8); g.quadraticCurveTo(d.cx0, bY - 14, d.fx * 0.60, bY - 7);
        g.stroke();
      }
    }

    // nose, beard, mouth
    if (d.muzzle === 'plush') plushMuzzle(g, d, t);
    else if (d.muzzle === 'beak') beakMuzzle(g, d, t);
    else if (d.muzzle === 'loaf') loafMuzzle(g, d, t);
    else if (!d.visor) {
      drawNose(g, d, 24 * S.k, -6 * S.v);
      if (d.beard) { // mass first, the mouth cuts back into it
        g.fillStyle = d.bMid; g.strokeStyle = d.bOut; g.lineWidth = 3.4;
        g.beginPath();
        g.moveTo(-d.fx * 0.96, -2);
        g.quadraticCurveTo(-d.fx * 0.88, d.fc + 34, d.cx0, d.fc + 40);
        g.quadraticCurveTo(d.fx * 0.94, d.fc + 30, d.fx * 0.92, -6);
        g.quadraticCurveTo(d.fx * 0.66, d.fy * 0.46, d.cx0, d.fy * 0.34);
        g.quadraticCurveTo(-d.fx * 0.62, d.fy * 0.42, -d.fx * 0.96, -2);
        g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = d.bLt; g.lineWidth = 2.6; // strand clumps
        g.beginPath();
        g.moveTo(-d.fx * 0.5, d.fy * 0.62); g.lineTo(-d.fx * 0.42, d.fc + 26);
        g.moveTo(d.cx0, d.fy * 0.66); g.lineTo(d.cx0 + 2, d.fc + 32);
        g.moveTo(d.fx * 0.52, d.fy * 0.60); g.lineTo(d.fx * 0.56, d.fc + 22);
        g.stroke();
      }
      drawMouth(g, d, 16 * S.k, 30 * S.v, t);
      if (d.mous || d.beard) { // moustache over the upper lip
        g.fillStyle = d.beard ? d.bMid : d.hMid;
        g.beginPath();
        g.moveTo(16 * S.k - d.mW - 4, 20 * S.v);
        g.quadraticCurveTo(16 * S.k, 10 * S.v, 16 * S.k + d.mW + 6, 19 * S.v);
        g.quadraticCurveTo(16 * S.k + d.mW * 0.4, 26 * S.v, 16 * S.k, 24 * S.v);
        g.quadraticCurveTo(16 * S.k - d.mW * 0.5, 27 * S.v, 16 * S.k - d.mW - 4, 20 * S.v);
        g.closePath(); g.fill();
      }
      if (S.tense > 0.5) { // nasolabial crease under real jaw tension
        g.strokeStyle = d.sDk; g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(34 * S.k, 6 * S.v); g.quadraticCurveTo(40 * S.k, 24 * S.v, 33 * S.k, 38 * S.v);
        g.stroke();
      }
    }

    drawGear(g, d, t);

    // ---- expression FX ----
    if (e.tr > 0) { // tears run on their own clock
      const run = (t * 0.55) % 1;
      g.fillStyle = TEAR;
      g.beginPath(); g.ellipse(e1x - 2, eY + 14 + run * 44, 4.6, 7 + run * 3, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(e2x + 2, eY + 12 + ((run + 0.4) % 1) * 44, 4.6, 7, 0, 0, 7); g.fill();
      g.fillStyle = TEAR_HI;
      g.beginPath(); g.arc(e1x - 3.4, eY + 12 + run * 44, 1.8, 0, 7); g.fill();
    }
    if (e.sw > 0.3) { // cold sweat on the temple
      g.fillStyle = SWEAT;
      const drip = (t * 0.8) % 1;
      g.beginPath(); g.ellipse(-d.fx * 0.62, -d.fy * 0.70 + drip * 34, 4.4, 7, 0, 0, 7); g.fill();
      g.fillStyle = TEAR_HI;
      g.beginPath(); g.arc(-d.fx * 0.66, -d.fy * 0.74 + drip * 34, 1.6, 0, 7); g.fill();
    }
    if (e.fl > 0.7 || (d.brute && e.fl > 0.25)) { // heat shimmer off the head
      g.lineWidth = 4.6;
      for (let i = 0; i < HEAT_ST.length; i += 2) {
        const hx = HEAT_ST[i], ph = HEAT_ST[i + 1];
        g.strokeStyle = i % 4 === 0 ? HEAT_A : HEAT_B;
        g.beginPath();
        g.moveTo(hx, -d.fy * 1.3);
        g.quadraticCurveTo(hx + Math.sin(t * 5 + ph) * 9, -d.fy * 1.7, hx + Math.sin(t * 5 + ph + 1) * 7, -d.fy * 2.1);
        g.stroke();
      }
    }

    g.restore();
    g.globalAlpha = 1;
  };
})();
