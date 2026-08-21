// ===== Campaign Chapter 2 — SONYA: Mom's House =====
// Scenes only; the chapter entry and stage defs live in campaign.js.
//
// CINEMATOGRAPHY PASS: story, dialogue and staging are locked — this file's
// scenes carry the presentation layer on top. Yard scenes key off the low
// dusk sun at stage-left (218,156) with long right-leaning shadows; garage
// scenes key off the single bare bulb at (875,142) with shadows falling into
// the boss-black left end. Comedy earns irises and rimshot stings; the horror
// earns handheld, a dutched reveal, and an inverted impact frame on contact.

(function () {
  const GY = 468;
  const C = (window.CUTSCENES = window.CUTSCENES || {});

  // golden-hour rig shared by the three yard scenes: sun low at stage-left,
  // warm rim on the sun side, long shadows raking right across the lawn
  const DUSK_SUN = { x: 218, y: 156, color: '#ffd9a0', rim: 0.55, shadow: 'rgba(42,28,22,0.34)', flat: 0.34 };
  // the garage's only source: one bare bulb, hard rim, shadows thrown left
  // into the dark end where the boss goes to vanish
  const BULB = { x: 875, y: 142, color: '#ffd9a0', rim: 0.8, shadow: 'rgba(4,4,12,0.6)', flat: 0.3 };

  // --- open: the yard, the car on the lawn, and Heath ---
  // DIRECTION: dusk comedy. Hold the wides and let the walks be funny; one
  // silent beat while Sonya does the burrito math, then the iris winks on the
  // turn and a whip snaps to her panic.
  C['ch2-open'] = {
    stage: 'collette-yard', camX: 60, zoom: 1,
    music: 'dusk-comedy', amb: 'crickets',
    lights: [DUSK_SUN],
    actors: {
      sonya: { char: 'sonya', x: 260, y: GY, facing: 1 },
      heath: { char: 'heath', boss: true, x: 1150, y: GY, facing: -1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', warm: '#c98a4a', push: 0.05 } },
      { title: 'CHAPTER TWO', sub: "SONYA  ·  MOM'S HOUSE", dur: 2.6 },
      { wait: 0.7 },
      { shot: { size: 'med', on: 'sonya', push: 0.05, warm: '#c98a4a', focus: 0.35 } },
      { say: 'sonya', text: "Mom? It's Sonya." },
      { move: { who: 'sonya', x: 360, dur: 1.6, gait: 'walk', sfxStep: true } },
      { shot: { face: true, on: 'sonya', expr: 'neutral', size: 'mcu', push: 0.05 } },
      { say: 'sonya', text: "Your car is on the lawn again." },
      // Heath saunters in from the driveway — stay wide, the walk IS the joke
      { shot: { size: 'wide', on: 'sonya', x: 240, warm: '#c98a4a' } },
      { set: { who: 'heath', hide: false } },
      { move: { who: 'heath', x: 620, dur: 2, gait: 'walk', sfxStep: true } },
      { shot: { face: true, on: 'heath', expr: 'smug', size: 'mcu', push: 0.07 } },
      { say: 'heath', text: "Heyyy. Little sister." },
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { say: 'sonya', text: "Heath. Whatever you're about to do — don't." },
      { shot: { face: true, on: 'heath', expr: 'determined', size: 'cu', push: 0.1 } },
      { say: 'heath', text: "I just ate three gas station burritos." },
      // one silent beat: she does the math
      { shot: { face: true, on: 'sonya', expr: 'surprised', size: 'cu' } },
      { wait: 0.6 },
      // he turns around. she knows what that means.
      { shot: { size: 'full', on: 'heath', x: 420, warm: '#c98a4a', cut: 'iris' } },
      { sting: 'comedy' },
      { pose: { who: 'heath', pose: 'windup', ext: 1 } },
      { shake: 0.4 },
      { shot: { face: true, on: 'sonya', expr: 'scared', size: 'cu', cut: 'whip', sway: 0.35, push: 0.08 } },
      { say: 'sonya', text: "HEATH. NO." },
    ],
  };

  // --- JR arrives in the only way he knows ---
  // DIRECTION: monster movie. Feel him before you see him — the wide goes
  // handheld while the engine shakes the frame, dust, a drama sting on the
  // reveal, and the score tips into 'boss' so the fight starts already rolling.
  C['ch2-jr'] = {
    stage: 'collette-yard', camX: 200, zoom: 1,
    music: 'dusk-comedy', amb: 'crickets',
    lights: [DUSK_SUN],
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      rv: { char: 'jrv', boss: true, x: 1500, y: GY, facing: -1 },
    },
    steps: [
      { shot: { size: 'med', on: 'sonya', warm: '#c98a4a', push: 0.05, focus: 0.35 } },
      { say: 'sonya', text: "That's one brother down.", expr: 'smug' },
      // the RV rolls up, engine shaking the frame
      { shot: { size: 'wide', on: 'sonya', x: 260, warm: '#c98a4a', cut: 'whip', sway: 0.45, dutch: 0.02 } },
      { sfx: 'heavy' },
      { shake: 0.5 },
      { move: { who: 'rv', x: 760, dur: 2.2, gait: null } },
      { fx: 'dust', x: 860, y: GY, n: 10, dur: 0.9 },
      { shake: 0.5 },
      { sting: 'drama' },
      { shot: { face: true, on: 'rv', faceId: 'jr', expr: 'angry', size: 'mcu', push: 0.07, sway: 0.2 } },
      { say: 'jr', text: "You put Heath in the birdbath." },
      { shot: { face: true, on: 'sonya', expr: 'smug', size: 'cu' } },
      { say: 'sonya', text: "He started it." },
      { shot: { face: true, on: 'rv', faceId: 'jr', expr: 'rage', size: 'cu', push: 0.1, sway: 0.3, dutch: 0.02 } },
      { say: 'jr', text: "Nobody disrespects this family except ME. And maybe Mom." },
      { music: 'boss' },
      { shot: { size: 'full', on: 'rv', x: 520, warm: '#c98a4a', cut: 'whip', sway: 0.3, dutch: 0.03 } },
      { pose: { who: 'rv', pose: 'windup', ext: 1 } },
      { flash: '#ffdf8e' },
      { sfx: 'heavy' },
      { shake: 0.7 },
    ],
  };

  // --- Yvonne and the suitors ---
  // DIRECTION: romance parody. Her coverage is soap-opera — swaying handheld
  // close-ups, a blushier rim off the same low sun — until the whistle whips
  // us wide for the swarm and the comedy sting lands under Sonya's disbelief.
  C['ch2-yvonne'] = {
    stage: 'collette-yard', camX: 200, zoom: 1,
    music: 'dusk-comedy', amb: 'crickets',
    lights: [{ x: 218, y: 156, color: '#ffc4b0', rim: 0.5, shadow: 'rgba(42,28,22,0.34)', flat: 0.34 }],
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      yvonne: { char: 'yvonne', boss: true, x: 1100, y: GY, facing: -1, hide: true },
      s1: { char: 'suitor', x: 1350, y: GY, facing: -1, hide: true },
      s2: { char: 'suitor', x: 1440, y: GY, facing: -1, hide: true },
      s3: { char: 'suitor', x: 1530, y: GY, facing: -1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', x: 260, warm: '#b86a5a', push: 0.04 } },
      { set: { who: 'yvonne', hide: false } },
      { move: { who: 'yvonne', x: 640, dur: 2, gait: 'walk' } },
      { shot: { face: true, on: 'yvonne', expr: 'smug', size: 'mcu', push: 0.06, sway: 0.3 } },
      { say: 'yvonne', text: "Sonya, sweetie. You look tired." },
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { say: 'sonya', text: "Yvonne." },
      { shot: { face: true, on: 'yvonne', expr: 'determined', size: 'cu', push: 0.06, sway: 0.3 } },
      { say: 'yvonne', text: "You know I can't let you through. Boys?" },
      // she whistles and they ARRIVE
      { sfx: 'coin' },
      { shot: { size: 'wide', on: 'yvonne', x: 420, warm: '#b86a5a', cut: 'whip' } },
      { set: { who: 's1', hide: false } },
      { set: { who: 's2', hide: false } },
      { set: { who: 's3', hide: false } },
      { move: { who: 's1', x: 760, dur: 0.9, gait: 'walk' } },
      { move: { who: 's2', x: 850, dur: 0.9, gait: 'walk' } },
      { move: { who: 's3', x: 940, dur: 0.9, gait: 'walk' } },
      { sting: 'comedy' },
      { shot: { face: true, on: 'sonya', expr: 'surprised', size: 'cu', sway: 0.25 } },
      { say: 'sonya', text: "How many boyfriends do you HAVE?" },
      { shot: { face: true, on: 'yvonne', expr: 'smug', size: 'cu', push: 0.08, sway: 0.3, cut: 'iris' } },
      { say: 'yvonne', text: "Get her, my darlings." },
    ],
  };

  // --- the garage: mom, and the thing that comes back out of the dark ---
  // DIRECTION: the horror centerpiece. The bulb keys everything; dread score
  // under the scolding, heartbreak under "But I love him." When she retreats,
  // the bulb hum cuts to dead room tone (the engine has no score-stop step, so
  // the ambience carries the bottom drop). A fade blinks us onto the dark end,
  // 'garage-horror' creeps in with her, and the reveal hits with 'shock', a
  // 0.06 dutch and the camera coming apart. The lunge cuts fast — whip in,
  // inverted impact frame on contact.
  C['ch2-collette'] = {
    stage: 'collette-garage', camX: 120, zoom: 1,
    music: 'dread-night', amb: 'garage-hum',
    lights: [BULB],
    actors: {
      sonya: { char: 'sonya', x: 320, y: GY, facing: 1 },
      mom: { char: 'collettecalm', boss: true, x: 640, y: GY, facing: -1 },
      ghast: { char: 'collette', boss: true, x: 150, y: GY, facing: 1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', x: 160, warm: '#3a2a20', sway: 0.2, push: 0.04 } },
      { title: 'THE GARAGE', sub: 'SHE KNOWS YOU ARE HERE', dur: 2.4 },
      { wait: 0.6 },
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'rage', size: 'mcu', push: 0.08 } },
      { say: 'collette', text: "I don't want you seeing that Catholic boy anymore!" },
      { sting: 'heartbreak' },
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'cu', push: 0.08 } },
      { say: 'sonya', text: "But I love him." },
      // the screech, and the retreat into the dark
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'hurt', size: 'cu', sway: 0.3 } },
      { sfx: 'screech' },
      { shake: 0.6 },
      { wait: 0.7 },
      // the hum dies with the argument: nothing left but the room
      { amb: 'night-room' },
      { shot: { size: 'wide', on: 'mom', x: 100, warm: '#241c30', sway: 0.3, push: 0.05 } },
      { move: { who: 'mom', x: 150, dur: 3.2, gait: 'walk', facing: -1 } },
      { set: { who: 'mom', hide: true } },
      { wait: 1.3 },
      { shot: { face: true, on: 'sonya', expr: 'scared', size: 'cu', sway: 0.25, push: 0.05 } },
      { say: 'sonya', text: "Mom, are you okay?" },
      // hold on the dark. nothing. then it comes out.
      { shot: { size: 'med', on: 'ghast', x: 40, warm: '#241c30', cut: 'fade', sway: 0.45, dutch: 0.03, push: 0.06 } },
      { wait: 1.4 },
      { set: { who: 'ghast', hide: false } },
      { music: 'garage-horror' },
      { move: { who: 'ghast', x: 300, dur: 3, gait: 'walk' } },
      { sting: 'shock' },
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'rage', size: 'cu', push: 0.12, warm: '#2c1440', sway: 0.7, dutch: 0.06 } },
      { sfx: 'screech' },
      { shake: 0.8 },
      { say: 'colletteghast', text: "Hoard all of this stuff with me in my garage!!!" },
      // the lunge: claws first. Wide shot so the knockback LANDS in frame —
      // framing 'full' on sonya cropped the impact and the stars out entirely
      { shot: { size: 'wide', on: 'sonya', x: 150, warm: '#241c30', cut: 'whip', sway: 0.5, dutch: 0.04 } },
      { anim: { who: 'ghast', frames: [{ pose: 'windup', ext: 1, dur: 0.3 }] } },
      { move: { who: 'ghast', x: 400, dur: 0.24, gait: null, pose: 'strike' } },
      { impact: 0.12 },
      { flash: '#ffffff' },
      { sfx: 'heavy' },
      { shake: 1 },
      { move: { who: 'sonya', x: 230, y: GY, dur: 0.4, arc: 50, pose: 'hurt', facing: 1, gait: null } },
      { fx: 'stars', x: 230, y: GY - 50, dur: 0.9 },
      { wait: 0.4 },
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'mcu', push: 0.08, sway: 0.25 } },
      { set: { who: 'sonya', pose: null } },
      { say: 'sonya', text: "Okay, Mom. Book club's over." },
    ],
  };

  // --- after the fight: the confession, and the bats ---
  // DIRECTION: dead-air comedy in the wreckage — flat holds, a whip on
  // "WHAT.", a rimshot sting after the pillow-knife line — then the
  // transformation snaps ('shock', flash, impact), the hum dies, and the
  // ungraded wide plays the room as just a room before 'victory' carries
  // the title card.
  C['ch2-end'] = {
    stage: 'collette-garage', camX: 160, zoom: 1,
    music: 'dread-night', amb: 'garage-hum',
    lights: [{ x: 875, y: 142, color: '#ffd9a0', rim: 0.75, shadow: 'rgba(4,4,12,0.55)', flat: 0.3 }],
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      ghast: { char: 'collette', boss: true, x: 620, y: GY, facing: -1, pose: 'hurt' },
    },
    steps: [
      { shot: { size: 'med', on: 'sonya', warm: '#241c30', push: 0.05, focus: 0.35 } },
      { wait: 0.6 },
      { shot: { face: true, on: 'sonya', expr: 'neutral', size: 'mcu', push: 0.05 } },
      { say: 'sonya', text: "Mom. Those teenagers siphoning gas out of your car?" },
      { say: 'sonya', text: "I've been paying them." },
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'surprised', size: 'cu', cut: 'whip' } },
      { say: 'colletteghast', text: "WHAT." },
      { shot: { face: true, on: 'sonya', expr: 'smug', size: 'cu', push: 0.07 } },
      { say: 'sonya', text: "The only way to stop them is to park in the grass and sleep with a kitchen knife under your pillow." },
      { sting: 'comedy' },
      { wait: 0.4 },
      // she takes the news poorly
      { shot: { size: 'full', on: 'ghast', x: 380, warm: '#40182c', sway: 0.4, dutch: 0.03 } },
      { anim: { who: 'ghast', frames: [{ pose: 'windup', ext: 0.5, dur: 0.4 }, { pose: 'windup', ext: 1, dur: 0.4 }] } },
      { sfx: 'screech' },
      { shake: 0.8 },
      { sting: 'shock' },
      { flash: '#ffffff' },
      { impact: 0.1 },
      { sfx: 'die' },
      // she must vanish INSIDE the flash — hiding after the bats' hold left
      // her standing in plain view while her own bats flew away
      { set: { who: 'ghast', hide: true } },
      { fx: 'bats', x: 620, y: GY - 60, n: 16, dur: 2.8, hold: 1.6 },
      { shake: 0.6 },
      // and then the room is just a room again
      { amb: 'night-room' },
      { wait: 1.4 },
      { shot: { size: 'wide', on: 'sonya', x: 160, cut: 'fade', push: 0.04 } },
      { say: 'sonya', text: "...Thanksgiving is going to be so weird." },
      { sting: 'comedy' },
      { music: 'victory' },
      { title: 'CHAPTER TWO COMPLETE', sub: 'SONYA UNLOCKED FOR ARENA', dur: 3 },
    ],
  };
})();
