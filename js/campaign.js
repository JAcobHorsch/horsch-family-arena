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

// Chapter 2 stages — Collette's property. worldEnemyDef merges these defs over
// ENEMY_ROLES[key], which is undefined for custom keys, so every def is complete.
CAMPAIGN_STAGES['collette-yard'] = {
  id: 'collette-yard', name: "MOM'S FRONT YARD", props: 'house', stageArt: 'collette-yard', interior: true,
  theme: { sky1: '#b8664a', sky2: '#ffc76a', glow: '#ffca6a', ground: '#4a6a34', groundTop: '#78c850', far: '#8a6a58', near: '#44542f' },
  enemies: {
    suitor: { name: "Yvonne's Suitor", body: 'suitor', color: '#8a5a8e', color2: '#3a2440', hp: 26, dmg: 7, speed: 155, reach: 60, windup: 0.45, cooldown: 0.9, value: 14, size: 1.0 },
    heath: { name: 'HEATH', color: '#6a8a3a', color2: '#2c3a18', bossKind: 'heath', hp: 300, dmg: 16, speed: 120, reach: 82, windup: 0.8, cooldown: 1.3, value: 260, size: 1.55, boss: true },
    jrv: { name: "JR'S RV", color: '#c9b08a', color2: '#5a4632', bossKind: 'jrv', hp: 430, dmg: 20, speed: 100, reach: 95, windup: 0.9, cooldown: 1.5, value: 300, size: 1.85, boss: true },
    yvonne: { name: 'YVONNE', color: '#c44a8e', color2: '#4d1440', bossKind: 'yvonne', hp: 360, dmg: 18, speed: 140, reach: 78, windup: 0.6, cooldown: 1.0, value: 300, size: 1.5, boss: true },
  },
};
CAMPAIGN_STAGES['collette-garage'] = {
  id: 'collette-garage', name: 'THE GARAGE', props: 'house', stageArt: 'collette-garage', interior: true,
  theme: { sky1: '#241c2c', sky2: '#141018', glow: '#ffca6a', ground: '#3a3230', groundTop: '#4a423e', far: '#2a2226', near: '#201a20' },
  enemies: {
    collette: {
      name: 'COLLETTE', color: '#9a9aa8', color2: '#3a3a48', bossKind: 'collette', signature: 'lunge',
      hp: 520, dmg: 22, speed: 135, reach: 85, windup: 0.7, cooldown: 1.1, value: 380, size: 1.6, boss: true,
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
  {
    id: 'ch2', char: 'sonya', title: 'SONYA', where: "Mom's House",
    blurb: 'Three siblings, one mother, and a garage nobody has seen the back of since 1987.',
    unlocks: 'sonya',
    beats: [
      { type: 'cut', name: 'ch2-open' },
      { type: 'fight', stage: 'collette-yard', label: 'HEATH', boss: true, waves: [['heath']] },
      { type: 'cut', name: 'ch2-jr' },
      { type: 'fight', stage: 'collette-yard', label: "JR'S RV", boss: true, waves: [['jrv']] },
      { type: 'cut', name: 'ch2-yvonne' },
      {
        type: 'fight', stage: 'collette-yard', label: 'YVONNE', boss: true,
        waves: [['suitor', 'suitor', 'suitor', 'suitor'], ['suitor', 'suitor', 'suitor', 'suitor', 'suitor'], ['yvonne']],
      },
      { type: 'cut', name: 'ch2-collette' },
      { type: 'fight', stage: 'collette-garage', label: 'COLLETTE', boss: true, waves: [['collette']] },
      { type: 'cut', name: 'ch2-end' },
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
    { shot: { size: 'wide', on: 'todd', warm: '#c9a86a' } },
    { title: 'CHAPTER ONE', sub: 'SUPER TODD  ·  THE CHILDHOOD HOME', dur: 2.6 },
    { wait: 0.7 },
    { shot: { face: true, on: 'todd', expr: 'neutral', size: 'mcu', push: 0.07 } },
    { say: 'todd', text: "Forty years and this place still smells the same." },
    { shot: { size: 'med', on: 'todd', push: 0.05, warm: '#c9a86a' } },
    { say: 'todd', text: "Same carpet. Same stairs. Same everything." },

    // something moves behind him
    { set: { who: 'pet', hide: false, pose: 'windup' } },
    { sfx: 'creak' },
    { shake: 0.35 },
    { wait: 0.8 },
    { shot: { face: true, on: 'todd', expr: 'surprised', size: 'cu' } },
    { set: { who: 'todd', facing: 1, pose: 'hurt' } },
    { say: 'todd', text: "...Why is my Pet Monster standing up." },
    { shot: { size: 'full', on: 'pet', x: 380 } },
    { pose: { who: 'pet', pose: 'strike', ext: 1 } },
    { sfx: 'heavy' },
    { shake: 0.6 },
    { wait: 0.4 },
    { shot: { face: true, on: 'todd', expr: 'determined', size: 'mcu' } },
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
    { shot: { size: 'med', on: 'todd', warm: '#c9a86a' } },
    { say: 'todd', text: "That's the last of them." },
    // he arrives from off frame; hold wide so the walk has distance
    { shot: { size: 'wide', on: 'todd', x: 280 } },
    { move: { who: 'josh', x: 620, dur: 1.6 } },
    { sfx: 'hit' },
    { shot: { face: true, on: 'josh', expr: 'smug', size: 'mcu', push: 0.07 } },
    { say: 'josh', text: "Still playing with stuffed animals, Toddy?" },
    { shot: { face: true, on: 'todd', expr: 'angry', size: 'cu' } },
    { say: 'todd', text: "Josh." },
    { shot: { face: true, on: 'josh', expr: 'angry', size: 'cu', push: 0.1 } },
    { say: 'josh', text: "Mom's not home. Nobody's coming to save you." },
    { shot: { size: 'full', on: 'josh', x: 400 } },
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
    { shot: { size: 'full', on: 'josh', x: 420, warm: '#c9a86a' } },
    { wait: 0.6 },
    { shot: { face: true, on: 'josh', expr: 'hurt', size: 'mcu' } },
    { say: 'josh', text: "Lucky shot." },
    { set: { who: 'josh', pose: null } },
    { shot: { face: true, on: 'josh', expr: 'smug', size: 'cu', push: 0.08 } },
    { say: 'josh', text: "You always did fight dirty." },

    // the knife comes out
    { shot: { size: 'med', on: 'josh', x: 480 } },
    { pose: { who: 'josh', pose: 'windup', ext: 1 } },
    { sfx: 'hit' },
    { wait: 0.5 },
    { shot: { face: true, on: 'josh', expr: 'angry', size: 'cu' } },
    { say: 'josh', text: "Let's see you dodge THIS." },

    // wide for the throw so you can read the whole room
    { shot: { size: 'wide', on: 'todd', x: 300 } },
    { sfx: 'special' },
    { fx: 'knife', from: 'josh', to: 'todd', dur: 0.5, hold: 0.55 },
    { set: { who: 'todd', pose: 'crouch' } },
    { shake: 0.5 },
    { wait: 0.4 },
    { shot: { face: true, on: 'todd', expr: 'surprised', size: 'cu' } },
    { say: 'todd', text: "...Seriously? A KNIFE?" },

    // the kick: hold, then hard cut on the hit
    { shot: { size: 'med', on: 'todd', x: 380 } },
    { set: { who: 'todd', pose: null } },
    { wait: 0.4 },
    { pose: { who: 'todd', pose: 'kick', ext: 0.2 } },
    { wait: 0.25 },
    { shot: { size: 'full', on: 'todd', x: 420 } },
    { pose: { who: 'todd', pose: 'kick', ext: 1 } },
    { sfx: 'heavy' },
    { flash: '#ffffff' },
    { shake: 0.9 },

    // DOWN THE STAIRS: he tumbles end over end, bouncing off the treads
    { shot: { size: 'wide', on: 'josh', x: 780 } },
    { move: { who: 'josh', x: 1290, y: GY - 150, dur: 0.5, arc: 70, spin: 3.6, pose: 'hurt', facing: -1, gait: null } },
    { sfx: 'hit' },
    { shake: 0.35 },
    { fx: 'stars', x: 1290, y: GY - 170, dur: 0.8 },
    { move: { who: 'josh', x: 1252, y: GY - 72, dur: 0.32, arc: 30, spin: 2.4, gait: null } },
    { sfx: 'hit' },
    { shake: 0.35 },
    { move: { who: 'josh', x: 1206, y: GY, dur: 0.36, arc: 22, spin: 1.8, gait: null } },
    { sfx: 'die' },
    { shake: 0.7 },
    { fx: 'dust', x: 1206, y: GY, n: 12, dur: 0.9, hold: 0.4 },
    // he stays down, flat on his back at the foot of the stairs
    { set: { who: 'josh', rot: 1.55, y: GY - 10 } },
    { wait: 0.9 },

    { shot: { face: true, on: 'todd', expr: 'neutral', size: 'mcu', push: 0.06 } },
    { set: { who: 'todd', pose: null } },
    { say: 'todd', text: "Tell Mom I said hi." },
  ],
};

// --- 2 AM: the glass of water ---
window.CUTSCENES['ch1-night'] = {
  stage: 'home-night', camX: 160, zoom: 1,
  actors: {
    todd: { char: 'todd', x: 260, y: GY, facing: 1, scale: 0.82 },
    damon: { char: 'damon', boss: true, x: 780, y: GY, facing: -1, hide: true },
  },
  steps: [
    // establishing: hold on the empty hallway and let it be quiet
    { shot: { size: 'wide', on: 'todd', warm: '#2c3a6a' } },
    { title: 'LATER THAT NIGHT', sub: '2:14 AM', dur: 2.4 },
    { wait: 0.8 },

    // close on the kid, talking himself into it
    { shot: { face: true, on: 'todd', expr: 'scared', size: 'cu', push: 0.06 } },
    { say: 'todd', text: "Just water. In and out." },
    { say: 'todd', text: "Don't wake him up. Do not wake him up." },

    // back to the hallway; he actually tiptoes, step by step
    { shot: { size: 'med', on: 'todd', push: 0.05, warm: '#2c3a6a' } },
    { move: { who: 'todd', x: 360, dur: 2.4, gait: 'sneak', sfxStep: true } },
    { move: { who: 'todd', x: 430, dur: 2, gait: 'sneak', sfxStep: true } },

    // the floorboard
    { sfx: 'creak' },
    { fx: 'creak', x: 438, y: GY, dur: 1.2, hold: 0.6 },
    { set: { who: 'todd', pose: 'hurt' } },
    { shake: 0.25 },
    { shot: { face: true, on: 'todd', expr: 'scared', size: 'cu' } },
    { say: 'todd', text: "...no. no no no." },
    { wait: 1.1 },

    // hard cut to the door, and hold on nothing happening
    { shot: { size: 'med', on: 'damon', x: 600, warm: '#2c3a6a' } },
    { wait: 1.2 },

    // the door TEARS OFF ITS HINGES and Damon fills the empty frame
    { sfx: 'door' },
    { flash: '#ff4a3a' },
    { shake: 1 },
    { fx: 'doorburst', x: 762, x1: 898, y: 182, gy: GY },
    { set: { who: 'damon', hide: false, x: 830, pose: 'windup', ext: 1 } },
    { fx: 'dust', x: 830, y: GY, n: 14, dur: 0.9 },
    { shot: { face: true, on: 'damon', expr: 'rage', size: 'cu', push: 0.1, warm: '#ff3b1e', sfx: 'heavy' } },
    { say: 'damon', text: "WHAT DID I SAY ABOUT BEING UP." },

    // he stomps across the room — each footfall lands
    { shot: { size: 'full', on: 'todd', x: 320, warm: '#5a2a3a' } },
    { move: { who: 'damon', x: 505, dur: 1.1, gait: 'stomp', pose: null } },

    // THE GRAB: hand closes on Todd's neck and hauls him off the floor
    { anim: { who: 'damon', frames: [{ pose: 'windup', ext: 1, dur: 0.22 }, { pose: 'strike', ext: 1, dur: 0.14 }] } },
    { sfx: 'heavy' },
    { shake: 0.5 },
    // the victim's NECK lands in the fist, so his feet hang just off the floor
    { grab: { who: 'damon', victim: 'todd', dx: 52, dy: -4, lift: 14, dur: 0.9 } },
    { shot: { size: 'med', on: 'damon', x: 400 } },
    { say: 'damon', text: "I SAID GO TO BED." },
    { wait: 0.35 },

    // THE THROW: wind back with the boy still in hand, then launch him
    { anim: { who: 'damon', frames: [{ pose: 'windup', ext: 1, dur: 0.28 }] } },
    { flash: '#ffffff' },
    { sfx: 'die' },
    { shake: 1 },
    { pose: { who: 'damon', pose: 'strike', ext: 1 } },
    { shot: { size: 'wide', on: 'todd', x: 120 } },
    { move: { who: 'todd', x: 175, y: GY, dur: 0.55, arc: 100, spin: -6.8, facing: -1, pose: 'hurt', gait: null } },
    { sfx: 'hit' },
    { fx: 'dust', x: 180, y: GY, n: 12, dur: 0.8 },
    { fx: 'stars', x: 180, y: GY - 40, dur: 1 },
    { shake: 0.6 },
    { set: { who: 'todd', rot: 0 } },
    { wait: 1.2 },

    // he gets up. this is where Super Todd starts.
    { shot: { face: true, on: 'todd', expr: 'hurt', size: 'cu' } },
    { say: 'todd', text: "...Okay." },
    { shot: { face: true, on: 'todd', expr: 'determined', size: 'mcu', push: 0.12 } },
    { set: { who: 'todd', pose: null, scale: 1, facing: 1 } },
    { say: 'todd', text: "I'm up now." },
    { shot: { size: 'med', on: 'todd' } },
    { pose: { who: 'todd', pose: 'windup', ext: 1 } },
    { sfx: 'ascend' },
  ],
};

// --- chapter close ---
window.CUTSCENES['ch1-end'] = {
  stage: 'home-night', camX: 200, zoom: 1.1,
  actors: { todd: { char: 'todd', x: 380, y: GY, facing: 1 } },
  steps: [
    { shot: { size: 'med', on: 'todd', warm: '#2c3a6a' } },
    { wait: 0.7 },
    { shot: { face: true, on: 'todd', expr: 'sad', size: 'cu', push: 0.05 } },
    { say: 'todd', text: "Nobody in this family ever just... asks for a glass of water." },
    { shot: { size: 'wide', on: 'todd', push: 0.04 } },
    { wait: 0.8 },
    { title: 'CHAPTER ONE COMPLETE', sub: 'SUPER TODD UNLOCKED FOR ARENA', dur: 3 },
  ],
};
