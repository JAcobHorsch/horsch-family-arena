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
    jrv: { name: "JR'S RV", color: '#c9b08a', color2: '#5a4632', bossKind: 'jrv', hp: 430, dmg: 20, speed: 100, reach: 95, windup: 0.9, cooldown: 1.5, value: 300, size: 1.85, hitW: 100, boss: true },
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
      { type: 'fight', stage: 'home-day', label: 'THE TOY BOX', spawnX: 620, waves: [['grunt', 'grunt'], ['grunt', 'stinger', 'grunt']] },
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
      { type: 'fight', stage: 'collette-yard', label: 'HEATH', boss: true, spawnX: 400, waves: [['heath']] },
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
  music: 'suburb-day', amb: 'day-room',
  // one soft source: the afternoon sun in the window glass (GL center ~x526)
  lights: [{ x: 526, y: 200, color: '#fff2c8', rim: 0.35, shadow: 'rgba(96,72,42,0.30)' }],
  actors: {
    todd: { char: 'todd', x: 300, y: GY, facing: 1 },
    pet: { char: 'petmonster', enemy: true, x: 620, y: GY, facing: -1, hide: true },
  },
  // MOVIE GRAMMAR: one tracked walk down the hallway, nostalgia typing over
  // the steps, fingertips on the photo frames — and the toy rises BEHIND him
  // mid-line where only the audience can see it.
  steps: [
    { shot: { size: 'wide', on: 'todd', warm: '#c9a86a' } },
    { title: 'CHAPTER ONE', sub: 'SUPER TODD  ·  THE CHILDHOOD HOME', dur: 2.6 },
    { wait: 0.7 },
    // the camera creeps with him past the framed photos (x330, x664)
    { cam: { follow: 'todd', lead: 70, lag: 2.4, zoom: 1.3 } },
    { par: [
      [{ move: { who: 'todd', x: 368, dur: 1.6, gait: 'walk', sfxStep: true } },
       { anim: { who: 'todd', frames: [{ pose: 'windup', ext: 0.45, dur: 0.4 }, { pose: null, ext: 0, dur: 0.45 }] } },
       { move: { who: 'todd', x: 700, dur: 2.6, gait: 'walk', sfxStep: true } },
       { anim: { who: 'todd', frames: [{ pose: 'windup', ext: 0.4, dur: 0.4 }, { pose: null, ext: 0, dur: 0.5 }] } }],
      [{ say: 'todd', text: "Forty years and this place still smells the same.", dur: 3.3 },
       { wait: 0.4 },
       { say: 'todd', text: "Same carpet. Same stairs. Same everything.", dur: 3.0 }],
      // it stands up behind his back, mid-sentence
      [{ wait: 4.4 },
       { set: { who: 'pet', hide: false, pose: 'windup', facing: 1 } },
       { sfx: 'creak' },
       { shake: 0.35 }],
    ] },
    // hold the wide: Todd at the frames, the thing upright behind him
    { shot: { size: 'wide', on: 'todd', x: 180, sway: 0.2, dutch: -0.02, warm: '#c9a86a' } },
    { sting: 'drama' },
    { wait: 1.0 },
    { shot: { face: true, on: 'todd', expr: 'surprised', size: 'cu', cut: 'whip' } },
    { set: { who: 'todd', facing: -1, pose: 'hurt' } },
    { say: 'todd', text: "...Why is my Pet Monster standing up." },
    { shot: { size: 'full', on: 'pet', x: 320, sway: 0.4, dutch: 0.03 } },
    { pose: { who: 'pet', pose: 'strike', ext: 1 } },
    { move: { who: 'pet', x: 648, dur: 0.3, gait: null } },
    { sfx: 'heavy' },
    { shake: 0.6 },
    { wait: 0.4 },
    { shot: { face: true, on: 'todd', expr: 'determined', size: 'mcu', push: 0.08 } },
    { wait: 0.5 },
    // the line lands over the windup — rolling straight into the fight
    { shot: { size: 'med', on: 'todd', sway: 0.25 } },
    { music: 'boss' },
    { par: [
      [{ say: 'todd', text: "Alright. Fine. Let's do this.", dur: 2.4 }],
      [{ wait: 0.4 }, { pose: { who: 'todd', pose: 'windup', ext: 1 } }, { shake: 0.3 }],
    ] },
  ],
};

// --- Josh arrives ---
window.CUTSCENES['ch1-josh-in'] = {
  stage: 'home-day', camX: 200, zoom: 1.05,
  music: 'suburb-day', amb: 'day-room',
  lights: [{ x: 526, y: 200, color: '#fff2c8', rim: 0.35, shadow: 'rgba(96,72,42,0.30)' }],
  actors: {
    todd: { char: 'todd', x: 330, y: GY, facing: 1 },
    josh: { char: 'josh', boss: true, x: 900, y: GY, facing: -1 },
  },
  // MOVIE GRAMMAR: Josh never stops moving — a tracked entrance, then he
  // circles Todd like a shark under the threat line, Todd pivoting to keep
  // him in front.
  steps: [
    { shot: { size: 'med', on: 'todd', focus: 0.3, warm: '#c9a86a' } },
    { par: [
      [{ say: 'todd', text: "That's the last of them.", expr: 'neutral', dur: 2.2 }],
      [{ wait: 0.3 },
       { anim: { who: 'todd', frames: [{ pose: 'punch', ext: 0.35, dur: 0.35 }, { pose: null, ext: 0, dur: 0.4 }, { pose: 'punch', ext: 0.3, dur: 0.35 }, { pose: null, ext: 0, dur: 0.4 }] } }],
    ] },
    // he arrives from off frame; the camera walks him in, Todd gives ground
    { cam: { follow: 'josh', lead: 90, lag: 2.8, zoom: 1.2 } },
    { par: [
      [{ move: { who: 'josh', x: 620, dur: 1.8, gait: 'walk', sfxStep: true } }],
      [{ wait: 0.9 }, { move: { who: 'todd', x: 300, dur: 0.5 } }],
    ] },
    { sfx: 'hit' },
    // period-comedy flourish: iris into the smug big-brother close-up
    { shot: { face: true, on: 'josh', expr: 'smug', size: 'mcu', push: 0.07, cut: 'iris' } },
    { say: 'josh', text: "Still playing with stuffed animals, Toddy?" },
    { shot: { face: true, on: 'todd', expr: 'angry', size: 'cu' } },
    { say: 'todd', text: "Josh." },
    // the circle: Josh prowls across the room while the threat types,
    // Todd pivoting and backing up as he crosses
    { shot: { size: 'full', on: 'todd', x: 150, sway: 0.25, dutch: 0.02 } },
    { sting: 'drama' },
    { par: [
      [{ move: { who: 'josh', x: 470, dur: 1.1, gait: 'walk', sfxStep: true } },
       { move: { who: 'josh', x: 250, dur: 1.4, gait: 'walk', sfxStep: true } },
       { set: { who: 'josh', facing: 1 } }],
      [{ wait: 1.7 }, { set: { who: 'todd', facing: -1 } }, { move: { who: 'todd', x: 350, dur: 0.6 } }],
      [{ say: 'josh', text: "Mom's not home. Nobody's coming to save you.", dur: 3.1, expr: 'angry' }],
    ] },
    // reaction before the windup — let Todd answer with his face
    { shot: { face: true, on: 'todd', expr: 'determined', size: 'cu' } },
    { wait: 0.5 },
    // he stomps back across to finish the loop, and the fight is on
    { shot: { size: 'full', on: 'josh', x: 150, sway: 0.3 } },
    { music: 'boss' },
    { par: [
      [{ move: { who: 'josh', x: 520, dur: 1.2, gait: 'stomp' } }, { set: { who: 'josh', facing: -1 } }],
      [{ wait: 0.6 }, { set: { who: 'todd', facing: 1 } }],
    ] },
    { pose: { who: 'josh', pose: 'windup', ext: 1 } },
    { shake: 0.4 },
    { wait: 0.9 },
  ],
};

// --- after Josh loses: the knife, and the stairs ---
window.CUTSCENES['ch1-josh-stairs'] = {
  stage: 'home-day', camX: 240, zoom: 1.1,
  music: 'dusk-comedy', amb: 'day-room',
  lights: [{ x: 526, y: 200, color: '#fff2c8', rim: 0.35, shadow: 'rgba(96,72,42,0.30)' }],
  actors: {
    todd: { char: 'todd', x: 380, y: GY, facing: 1 },
    josh: { char: 'josh', boss: true, x: 640, y: GY, facing: -1, pose: 'hurt' },
  },
  // MOVIE GRAMMAR: the taunt types over the throw itself, the kick lunges,
  // and a chase cam rides Josh all the way down the stairs.
  steps: [
    { shot: { size: 'full', on: 'josh', x: 420, warm: '#c9a86a', cut: 'fade', sway: 0.2 } },
    { wait: 0.6 },
    { shot: { face: true, on: 'josh', expr: 'hurt', size: 'mcu' } },
    { say: 'josh', text: "Lucky shot." },
    { set: { who: 'josh', pose: null } },
    // he drags himself upright and paces it off while the line types
    { shot: { size: 'med', on: 'josh', x: 440, push: 0.05, sway: 0.2, warm: '#c9a86a' } },
    { par: [
      [{ anim: { who: 'josh', frames: [{ pose: 'hurt', ext: 0.6, dur: 0.35 }, { pose: null, ext: 0, dur: 0.4 }] } },
       { move: { who: 'josh', x: 730, dur: 1.0, gait: 'walk', facing: 1 } },
       { move: { who: 'josh', x: 660, dur: 0.8, gait: 'walk', facing: -1 } }],
      [{ say: 'josh', text: "You always did fight dirty.", dur: 2.3, expr: 'smug' }],
    ] },

    // the knife comes out — the comedy curdles for a beat
    { shot: { size: 'med', on: 'josh', x: 480, sway: 0.25, dutch: 0.025 } },
    { pose: { who: 'josh', pose: 'windup', ext: 1 } },
    { sfx: 'hit' },
    { sting: 'drama' },
    { wait: 0.5 },
    { shot: { face: true, on: 'josh', expr: 'angry', size: 'cu', push: 0.08 } },
    { wait: 0.55 },

    // wide for the throw — and the taunt types DURING the blade's flight,
    // Todd ducking under it mid-word
    { shot: { size: 'wide', on: 'todd', x: 300 } },
    { par: [
      [{ wait: 0.55 },
       { pose: { who: 'josh', pose: 'strike', ext: 1 } },
       { sfx: 'special' },
       { fx: 'knife', from: 'josh', to: 'todd', dur: 0.5, hold: 0.26 },
       { set: { who: 'todd', pose: 'crouch' } },
       { shake: 0.5 }],
      [{ say: 'josh', text: "Let's see you dodge THIS.", dur: 2.2, expr: 'angry' }],
    ] },
    { wait: 0.4 },
    { sting: 'comedy' },
    { shot: { face: true, on: 'todd', expr: 'surprised', size: 'cu' } },
    { say: 'todd', text: "...Seriously? A KNIFE?" },

    // the kick: he LUNGES the gap, then a whip cut ON the hit and the frame flinches
    { shot: { size: 'med', on: 'todd', x: 380 } },
    { set: { who: 'todd', pose: null } },
    { wait: 0.4 },
    { move: { who: 'todd', x: 540, dur: 0.3, gait: null } },
    { pose: { who: 'todd', pose: 'kick', ext: 0.2 } },
    { wait: 0.25 },
    { shot: { size: 'full', on: 'todd', x: 420, cut: 'whip' } },
    { pose: { who: 'todd', pose: 'kick', ext: 1 } },
    { sfx: 'heavy' },
    { impact: 0.14 },
    { shake: 0.9 },

    // DOWN THE STAIRS: the camera chases him into the tumble, beat for beat
    { cam: { follow: 'josh', lead: -120, lag: 5, zoom: 1.25 } },
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

    // the kiss-off lands over the walk to the body, camera drifting with him
    { set: { who: 'todd', pose: null } },
    { cam: { follow: 'todd', lead: 80, lag: 2.6, zoom: 1.35 } },
    { par: [
      [{ move: { who: 'todd', x: 1030, dur: 3.4, gait: 'walk', sfxStep: true } }],
      [{ wait: 0.8 }, { say: 'todd', text: "Tell Mom I said hi.", dur: 2.0 }],
    ] },
    { wait: 0.5 },
  ],
};

// --- 2 AM: the glass of water ---
window.CUTSCENES['ch1-night'] = {
  stage: 'home-night', camX: 160, zoom: 1,
  music: 'dread-night', amb: 'night-room',
  // one hard warm source: the light under the bedroom door (slab 762-898)
  lights: [{ x: 830, y: 330, color: '#ffca6a', rim: 0.8, shadow: 'rgba(6,5,14,0.55)' }],
  actors: {
    todd: { char: 'todd', x: 200, y: GY, facing: 1, scale: 0.82 },
    damon: { char: 'damon', boss: true, x: 780, y: GY, facing: -1, hide: true },
  },
  // MOVIE GRAMMAR: this scene is choreography — tracking shots, action and
  // dialogue on parallel tracks, and nothing waits for a tap.
  steps: [
    { shot: { size: 'wide', on: 'todd', x: 60, warm: '#2c3a6a', cut: 'fade', sway: 0.15 } },
    { title: 'LATER THAT NIGHT', sub: '2:14 AM', dur: 2.4 },
    // one unbroken tracking shot: the camera creeps with him while he
    // whispers himself through it
    { cam: { follow: 'todd', lead: 90, lag: 2.2, zoom: 1.35 } },
    { par: [
      [{ move: { who: 'todd', x: 350, dur: 4.2, gait: 'sneak', sfxStep: true } },
       { move: { who: 'todd', x: 438, dur: 2.6, gait: 'sneak', sfxStep: true } }],
      [{ say: 'todd', text: "Just water. In and out.", dur: 2.4 },
       { wait: 0.5 },
       { say: 'todd', text: "Don't wake him up. Do not wake him up.", dur: 2.9 }],
    ] },
    // the creak stops the world
    { sfx: 'creak' },
    { fx: 'creak', x: 438, y: GY, dur: 1.1, hold: 0.3 },
    { set: { who: 'todd', pose: 'hurt' } },
    { shake: 0.3 },
    { shot: { face: true, on: 'todd', expr: 'scared', size: 'cu', sway: 0.4 } },
    { say: 'todd', text: "...no. no no no.", expr: 'scared' },
    // hold on the door. then it comes off its hinges.
    { shot: { size: 'med', on: 'damon', x: 560, warm: '#2c3a6a', sway: 0.4, dutch: 0.03 } },
    { wait: 1.2 },
    { sting: 'shock' },
    { sfx: 'door' },
    { flash: '#ff4a3a' },
    { shake: 1 },
    { fx: 'doorburst', x: 762, x1: 898, y: 182 },
    { set: { who: 'damon', hide: false, x: 830, pose: 'windup', ext: 1 } },
    { fx: 'dust', x: 830, y: GY, n: 12, dur: 0.8 },
    // he comes for Todd in one continuous move, camera tracking, his line
    // typing OVER the stomps
    { cam: { follow: 'damon', lead: 70, lag: 3, zoom: 1.5 } },
    { par: [
      [{ move: { who: 'damon', x: 520, dur: 1.9, gait: 'stomp' } }],
      [{ say: 'damon', text: "WHAT DID I SAY ABOUT BEING UP.", expr: 'rage', dur: 2.2 }],
    ] },
    // the grab, the lift, the sentence
    { shot: { size: 'mcu', on: 'todd', x: 350, cut: 'whip', sway: 0.55, dutch: 0.04, warm: '#40182c' } },
    { impact: 0.1 },
    { sfx: 'heavy' },
    { grab: { who: 'damon', victim: 'todd', dx: 44, dy: -26, lift: 30, dur: 1.1 } },
    { say: 'damon', text: "I SAID GO TO BED.", expr: 'rage', dur: 2 },
    // the throw: the camera chases Todd across the room
    { pose: { who: 'damon', pose: 'strike', ext: 1 } },
    { impact: 0.14 },
    { sfx: 'die' },
    { shake: 1 },
    { cam: { follow: 'todd', lead: -60, lag: 6, zoom: 1.3 } },
    { move: { who: 'todd', x: 150, y: GY, dur: 0.55, arc: 95, spin: -5.6, facing: -1, gait: null } },
    { fx: 'dust', x: 160, y: GY, n: 12, dur: 0.8 },
    { fx: 'stars', x: 150, y: GY - 45, dur: 1 },
    { shake: 0.6 },
    { wait: 0.7 },
    // he gets up. the fight is already here.
    { shot: { size: 'med', on: 'todd', x: 60, sway: 0.3, warm: '#2c3a6a' } },
    { say: 'todd', text: "...Okay.", expr: 'determined' },
    { set: { who: 'todd', pose: null, scale: 1, facing: 1, rot: 0 } },
    { music: 'boss-final' },
    { par: [
      [{ say: 'todd', text: "I'm up now.", expr: 'determined', dur: 1.6 }],
      [{ pose: { who: 'todd', pose: 'windup', ext: 1 } }, { sfx: 'ascend' }],
    ] },
  ],
};

window.CUTSCENES['ch1-end'] = {
  stage: 'home-night', camX: 200, zoom: 1.1,
  music: 'dread-night', amb: 'night-room',
  // the house has gone quiet again; the only light left is the moon in the glass
  lights: [{ x: 470, y: 152, color: '#c8d8ff', rim: 0.45, shadow: 'rgba(6,5,14,0.5)' }],
  actors: { todd: { char: 'todd', x: 380, y: GY, facing: 1 } },
  // MOVIE GRAMMAR: the reflection plays over a slow walk through the wreck,
  // the camera drifting with him until he stops at the broken doorway.
  steps: [
    { shot: { size: 'med', on: 'todd', warm: '#2c3a6a', cut: 'fade', sway: 0.15, focus: 0.3 } },
    { wait: 1.0 },
    { cam: { follow: 'todd', lead: 70, lag: 2, zoom: 1.32 } },
    { par: [
      [{ move: { who: 'todd', x: 560, dur: 3.4, gait: 'walk', sfxStep: true } },
       { wait: 0.6 },
       { move: { who: 'todd', x: 668, dur: 2.2, gait: 'walk', sfxStep: true } }],
      [{ wait: 0.7 },
       { say: 'todd', text: "Nobody in this family ever just... asks for a glass of water.", dur: 3.9, expr: 'sad' }],
    ] },
    // he stops in front of the bedroom door and just looks at it
    { wait: 0.5 },
    // pull all the way out and leave him small in the room
    { shot: { size: 'wide', on: 'todd', push: 0.04, cut: 'fade' } },
    { wait: 1.2 },
    { music: 'victory' },
    { sting: 'triumph' },
    { title: 'CHAPTER ONE COMPLETE', sub: 'SUPER TODD UNLOCKED FOR ARENA', dur: 3 },
  ],
};
