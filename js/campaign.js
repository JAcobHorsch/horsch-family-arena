// ===== Campaign mode: one chapter per fighter, in family order =====
//
// A chapter locks you to its character, plays out in beats (cutscene / fight),
// and on completion unlocks that fighter for Arena mode.

// Campaign stages look like a WORLDS[] entry so the existing level machinery
// can consume them unchanged; stageArt points at window.STAGE_ART for interiors.
const CAMPAIGN_STAGES = {
  'home-day': {
    id: 'home-day', name: "TODD'S CHILDHOOD HOME", props: 'house', stageArt: 'home-day', interior: true,
    theme: { sky1: '#c9a86a', sky2: '#8a6a48', glow: '#ffd9a0', ground: '#8a6440', groundTop: '#a87c50', far: '#7a6250', near: '#5f4a38' },
    enemies: {
      grunt: { name: 'My Pet Monster', body: 'petmonster', color: '#6a6ad4', color2: '#3a3a7a' },
      stinger: { name: 'My Pet Monster', body: 'petmonster', color: '#6a6ad4', color2: '#3a3a7a', signature: 'lunge' },
      brute: { name: 'Big Pet Monster', body: 'petmonster', color: '#8a5ad4', color2: '#4a2a7a' },
      boss: { name: 'JOSH', color: '#4a8a5a', color2: '#243a28', bossKind: 'josh', bossBody: 'josh' },
    },
  },
  'home-night': {
    id: 'home-night', name: 'THE HALLWAY, 2 AM', props: 'house', stageArt: 'home-night', interior: true,
    theme: { sky1: '#2c3050', sky2: '#141830', glow: '#ffb04a', ground: '#3a3048', groundTop: '#4a3e58', far: '#252a44', near: '#1d2036' },
    enemies: {
      grunt: { name: 'My Pet Monster', body: 'petmonster', color: '#5a5ab4', color2: '#2a2a5a' },
      stinger: { name: 'My Pet Monster', body: 'petmonster', color: '#5a5ab4', color2: '#2a2a5a', signature: 'lunge' },
      brute: { name: 'Big Pet Monster', body: 'petmonster', color: '#7a4ab4', color2: '#3a1a5a' },
      boss: { name: 'DAMON HORSCH', color: '#c9563a', color2: '#5a1e14', bossKind: 'damon', bossBody: 'damon' },
    },
  },
};

const CAMPAIGN = [
  {
    id: 'ch1', char: 'todd', title: 'SUPER TODD', where: 'The Childhood Home',
    blurb: 'Before he was the Toddfather, he was a kid in a house with thin walls.',
    unlocks: 'todd',
    beats: [
      { type: 'cut', name: 'ch1-open' },
      { type: 'fight', stage: 'home-day', label: 'THE TOY BOX', waves: [['grunt', 'grunt'], ['grunt', 'stinger', 'grunt']] },
      { type: 'fight', stage: 'home-day', label: 'THE LIVING ROOM', waves: [['grunt', 'stinger'], ['brute', 'grunt', 'stinger']] },
      { type: 'cut', name: 'ch1-josh-in' },
      { type: 'fight', stage: 'home-day', label: 'BIG BROTHER', boss: true, waves: [['boss']] },
      { type: 'cut', name: 'ch1-josh-stairs' },
      { type: 'cut', name: 'ch1-night' },
      { type: 'fight', stage: 'home-night', label: 'DAMON HORSCH', boss: true, waves: [['boss']] },
      { type: 'cut', name: 'ch1-end' },
    ],
  },
];

const GY = 468; // GROUND_Y

window.CUTSCENES = window.CUTSCENES || {};

// --- opening: Todd back in the house, and the toys are awake ---
window.CUTSCENES['ch1-open'] = {
  stage: 'home-day', camX: 120, zoom: 1,
  actors: {
    todd: { char: 'todd', x: 300, y: GY, facing: 1 },
    pet: { char: 'petmonster', enemy: true, x: 620, y: GY, facing: -1, hide: true },
  },
  steps: [
    { title: 'CHAPTER ONE', sub: 'SUPER TODD  ·  THE CHILDHOOD HOME', dur: 2.4 },
    { wait: 0.3 },
    { say: 'todd', text: "Forty years and this place still smells the same." },
    { cam: { x: 260, zoom: 1.12, dur: 1.1 } },
    { say: 'todd', text: "Same carpet. Same stairs. Same everything." },
    { set: { who: 'pet', hide: false, pose: 'windup' } },
    { sfx: 'creak' },
    { shake: 0.35 },
    { wait: 0.4 },
    { set: { who: 'todd', facing: 1, pose: 'hurt' } },
    { say: 'todd', text: "...Why is my Pet Monster standing up." },
    { pose: { who: 'pet', pose: 'strike', ext: 1 } },
    { sfx: 'heavy' },
    { shake: 0.6 },
    { say: 'todd', text: "Alright. Fine. Let's do this." },
    { set: { who: 'todd', pose: null } },
  ],
};

// --- Josh arrives ---
window.CUTSCENES['ch1-josh-in'] = {
  stage: 'home-day', camX: 200, zoom: 1.05,
  actors: {
    todd: { char: 'todd', x: 330, y: GY, facing: 1 },
    josh: { char: 'josh', boss: true, x: 900, y: GY, facing: -1 },
  },
  steps: [
    { say: 'todd', text: "That's the last of them." },
    { move: { who: 'josh', x: 620, dur: 1.2 } },
    { sfx: 'hit' },
    { say: 'josh', text: "Still playing with stuffed animals, Toddy?" },
    { cam: { x: 300, zoom: 1.15, dur: 0.7 } },
    { say: 'todd', text: "Josh." },
    { say: 'josh', text: "Mom's not home. Nobody's coming to save you." },
    { pose: { who: 'josh', pose: 'windup', ext: 1 } },
    { shake: 0.4 },
  ],
};

// --- after Josh loses: the knife, and the stairs ---
window.CUTSCENES['ch1-josh-stairs'] = {
  stage: 'home-day', camX: 240, zoom: 1.1,
  actors: {
    todd: { char: 'todd', x: 380, y: GY, facing: 1 },
    josh: { char: 'josh', boss: true, x: 640, y: GY, facing: -1, pose: 'hurt' },
  },
  steps: [
    { wait: 0.5 },
    { say: 'josh', text: "Lucky shot." },
    { set: { who: 'josh', pose: null } },
    { say: 'josh', text: "You always did fight dirty." },
    { cam: { x: 300, zoom: 1.25, dur: 0.6 } },
    { pose: { who: 'josh', pose: 'windup', ext: 1 } },
    { say: 'josh', text: "Let's see you dodge THIS." },
    { sfx: 'special' },
    { fx: 'knife', from: 'josh', to: 'todd', dur: 0.5, hold: 0.5 },
    { set: { who: 'todd', pose: 'crouch' } },
    { shake: 0.5 },
    { say: 'todd', text: "...Seriously? A KNIFE?" },
    { set: { who: 'todd', pose: null } },
    { wait: 0.25 },
    { cam: { x: 340, zoom: 1.3, dur: 0.4 } },
    { pose: { who: 'todd', pose: 'kick', ext: 0.2 } },
    { wait: 0.2 },
    { pose: { who: 'todd', pose: 'kick', ext: 1 } },
    { sfx: 'heavy' },
    { flash: '#ffffff' },
    { shake: 0.9 },
    { move: { who: 'josh', x: 1010, y: GY - 40, dur: 0.45, arc: 60, pose: 'hurt', facing: -1 } },
    { fx: 'stars', x: 1010, y: GY - 60, dur: 0.9 },
    { move: { who: 'josh', x: 1120, y: GY + 120, dur: 0.7, arc: 20 } },
    { sfx: 'die' },
    { shake: 0.7 },
    { fx: 'dust', x: 1090, y: GY + 40, n: 10, dur: 0.8, hold: 0.4 },
    { set: { who: 'josh', hide: true } },
    { set: { who: 'todd', pose: null } },
    { cam: { x: 300, zoom: 1.05, dur: 0.7 } },
    { say: 'todd', text: "Tell Mom I said hi." },
  ],
};

// --- 2 AM: the glass of water ---
window.CUTSCENES['ch1-night'] = {
  stage: 'home-night', camX: 160, zoom: 1.1,
  actors: {
    todd: { char: 'todd', x: 260, y: GY, facing: 1, scale: 0.82 },
    damon: { char: 'damon', boss: true, x: 780, y: GY, facing: -1, hide: true },
  },
  steps: [
    { title: 'LATER THAT NIGHT', sub: '2:14 AM', dur: 2.2 },
    { say: 'todd', text: "Just water. In and out." },
    { say: 'todd', text: "Don't wake him up. Do not wake him up." },
    { move: { who: 'todd', x: 360, dur: 1.8 } },
    { cam: { x: 240, zoom: 1.2, dur: 1.4 } },
    { move: { who: 'todd', x: 430, dur: 1.4 } },
    { sfx: 'creak' },
    { fx: 'creak', x: 438, y: GY, dur: 1.1, hold: 0.5 },
    { set: { who: 'todd', pose: 'hurt' } },
    { shake: 0.3 },
    { say: 'todd', text: "...no. no no no." },
    { wait: 0.9 },
    { cam: { x: 380, zoom: 1.05, dur: 0.5 } },
    { sfx: 'door' },
    { flash: '#ff4a3a' },
    { shake: 1 },
    { set: { who: 'damon', hide: false, x: 700, pose: 'windup', ext: 1 } },
    { fx: 'dust', x: 700, y: GY, n: 12, dur: 0.8 },
    { say: 'damon', text: "WHAT DID I SAY ABOUT BEING UP." },
    { move: { who: 'damon', x: 500, dur: 0.42 } },
    { sfx: 'heavy' },
    { shake: 0.8 },
    { set: { who: 'todd', pose: 'hurt', y: GY - 34 } },
    { pose: { who: 'damon', pose: 'strike', ext: 1 } },
    { say: 'damon', text: "I SAID GO TO BED." },
    { wait: 0.3 },
    { flash: '#ffffff' },
    { sfx: 'die' },
    { shake: 1 },
    { move: { who: 'todd', x: 180, y: GY, dur: 0.5, arc: 90, facing: -1 } },
    { fx: 'dust', x: 180, y: GY, n: 12, dur: 0.8 },
    { fx: 'stars', x: 180, y: GY - 40, dur: 1 },
    { shake: 0.6 },
    { cam: { x: 120, zoom: 1.15, dur: 0.8 } },
    { wait: 0.6 },
    { say: 'todd', text: "...Okay." },
    { set: { who: 'todd', pose: null, scale: 1, facing: 1 } },
    { say: 'todd', text: "I'm up now." },
    { pose: { who: 'todd', pose: 'windup', ext: 1 } },
    { sfx: 'ascend' },
  ],
};

// --- chapter close ---
window.CUTSCENES['ch1-end'] = {
  stage: 'home-night', camX: 200, zoom: 1.1,
  actors: { todd: { char: 'todd', x: 380, y: GY, facing: 1 } },
  steps: [
    { wait: 0.4 },
    { say: 'todd', text: "Nobody in this family ever just... asks for a glass of water." },
    { title: 'CHAPTER ONE COMPLETE', sub: 'SUPER TODD UNLOCKED FOR ARENA', dur: 2.8 },
  ],
};
