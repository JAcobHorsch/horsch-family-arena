// ===== Campaign Chapter 2 — SONYA: Mom's House =====
// Scenes only; the chapter entry and stage defs live in campaign.js.

(function () {
  const GY = 468;
  const C = (window.CUTSCENES = window.CUTSCENES || {});

  // --- open: the yard, the car on the lawn, and Heath ---
  C['ch2-open'] = {
    stage: 'collette-yard', camX: 60, zoom: 1,
    actors: {
      sonya: { char: 'sonya', x: 260, y: GY, facing: 1 },
      heath: { char: 'heath', boss: true, x: 1150, y: GY, facing: -1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', warm: '#c98a4a' } },
      { title: 'CHAPTER TWO', sub: "SONYA  ·  MOM'S HOUSE", dur: 2.6 },
      { wait: 0.7 },
      { shot: { size: 'med', on: 'sonya', push: 0.05, warm: '#c98a4a' } },
      { say: 'sonya', text: "Mom? It's Sonya." },
      { move: { who: 'sonya', x: 360, dur: 1.6, gait: 'walk', sfxStep: true } },
      { shot: { face: true, on: 'sonya', expr: 'neutral', size: 'mcu' } },
      { say: 'sonya', text: "Your car is on the lawn again." },
      // Heath saunters in from the driveway
      { shot: { size: 'wide', on: 'sonya', x: 240 } },
      { set: { who: 'heath', hide: false } },
      { move: { who: 'heath', x: 620, dur: 2, gait: 'walk', sfxStep: true } },
      { shot: { face: true, on: 'heath', expr: 'smug', size: 'mcu', push: 0.07 } },
      { say: 'heath', text: "Heyyy. Little sister." },
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { say: 'sonya', text: "Heath. Whatever you're about to do — don't." },
      { shot: { face: true, on: 'heath', expr: 'determined', size: 'cu', push: 0.1 } },
      { say: 'heath', text: "I just ate three gas station burritos." },
      // he turns around. she knows what that means.
      { shot: { size: 'full', on: 'heath', x: 420 } },
      { pose: { who: 'heath', pose: 'windup', ext: 1 } },
      { shake: 0.4 },
      { shot: { face: true, on: 'sonya', expr: 'scared', size: 'cu' } },
      { say: 'sonya', text: "HEATH. NO." },
    ],
  };

  // --- JR arrives in the only way he knows ---
  C['ch2-jr'] = {
    stage: 'collette-yard', camX: 200, zoom: 1,
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      rv: { char: 'jrv', boss: true, x: 1500, y: GY, facing: -1 },
    },
    steps: [
      { shot: { size: 'med', on: 'sonya', warm: '#c98a4a' } },
      { say: 'sonya', text: "That's one brother down." },
      // the RV rolls up, engine shaking the frame
      { shot: { size: 'wide', on: 'sonya', x: 260 } },
      { sfx: 'heavy' },
      { shake: 0.5 },
      { move: { who: 'rv', x: 760, dur: 2.2, gait: null } },
      { fx: 'dust', x: 860, y: GY, n: 10, dur: 0.9 },
      { shake: 0.5 },
      { shot: { face: true, on: 'rv', faceId: 'jr', expr: 'angry', size: 'mcu', push: 0.07 } },
      { say: 'jr', text: "You put Heath in the birdbath." },
      { shot: { face: true, on: 'sonya', expr: 'smug', size: 'cu' } },
      { say: 'sonya', text: "He started it." },
      { shot: { face: true, on: 'rv', faceId: 'jr', expr: 'rage', size: 'cu', push: 0.1 } },
      { say: 'jr', text: "Nobody disrespects this family except ME. And maybe Mom." },
      { shot: { size: 'full', on: 'rv', x: 520 } },
      { pose: { who: 'rv', pose: 'windup', ext: 1 } },
      { flash: '#ffdf8e' },
      { sfx: 'heavy' },
      { shake: 0.7 },
    ],
  };

  // --- Yvonne and the suitors ---
  C['ch2-yvonne'] = {
    stage: 'collette-yard', camX: 200, zoom: 1,
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      yvonne: { char: 'yvonne', boss: true, x: 1100, y: GY, facing: -1, hide: true },
      s1: { char: 'suitor', x: 1350, y: GY, facing: -1, hide: true },
      s2: { char: 'suitor', x: 1440, y: GY, facing: -1, hide: true },
      s3: { char: 'suitor', x: 1530, y: GY, facing: -1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', x: 260, warm: '#b86a5a' } },
      { set: { who: 'yvonne', hide: false } },
      { move: { who: 'yvonne', x: 640, dur: 2, gait: 'walk' } },
      { shot: { face: true, on: 'yvonne', expr: 'smug', size: 'mcu', push: 0.06 } },
      { say: 'yvonne', text: "Sonya, sweetie. You look tired." },
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { say: 'sonya', text: "Yvonne." },
      { shot: { face: true, on: 'yvonne', expr: 'determined', size: 'cu' } },
      { say: 'yvonne', text: "You know I can't let you through. Boys?" },
      // she whistles and they ARRIVE
      { sfx: 'coin' },
      { shot: { size: 'wide', on: 'yvonne', x: 420 } },
      { set: { who: 's1', hide: false } },
      { set: { who: 's2', hide: false } },
      { set: { who: 's3', hide: false } },
      { move: { who: 's1', x: 760, dur: 0.9, gait: 'walk' } },
      { move: { who: 's2', x: 850, dur: 0.9, gait: 'walk' } },
      { move: { who: 's3', x: 940, dur: 0.9, gait: 'walk' } },
      { shot: { face: true, on: 'sonya', expr: 'surprised', size: 'cu' } },
      { say: 'sonya', text: "How many boyfriends do you HAVE?" },
      { shot: { face: true, on: 'yvonne', expr: 'smug', size: 'cu', push: 0.08 } },
      { say: 'yvonne', text: "Get her, my darlings." },
    ],
  };

  // --- the garage: mom, and the thing that comes back out of the dark ---
  C['ch2-collette'] = {
    stage: 'collette-garage', camX: 120, zoom: 1,
    actors: {
      sonya: { char: 'sonya', x: 320, y: GY, facing: 1 },
      mom: { char: 'collettecalm', boss: true, x: 640, y: GY, facing: -1 },
      ghast: { char: 'collette', boss: true, x: 150, y: GY, facing: 1, hide: true },
    },
    steps: [
      { shot: { size: 'wide', on: 'sonya', x: 160, warm: '#3a2a20' } },
      { title: 'THE GARAGE', sub: 'SHE KNOWS YOU ARE HERE', dur: 2.4 },
      { wait: 0.6 },
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'rage', size: 'mcu', push: 0.08 } },
      { say: 'collette', text: "I don't want you seeing that Catholic boy anymore!" },
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'cu', push: 0.06 } },
      { say: 'sonya', text: "But I love him." },
      // the screech, and the retreat into the dark
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'hurt', size: 'cu' } },
      { sfx: 'screech' },
      { shake: 0.6 },
      { wait: 0.7 },
      { shot: { size: 'wide', on: 'mom', x: 100, warm: '#241c30' } },
      { move: { who: 'mom', x: 150, dur: 3.2, gait: 'walk', facing: -1 } },
      { set: { who: 'mom', hide: true } },
      { wait: 1.3 },
      { shot: { face: true, on: 'sonya', expr: 'scared', size: 'cu' } },
      { say: 'sonya', text: "Mom, are you okay?" },
      // hold on the dark. nothing. then it comes out.
      { shot: { size: 'med', on: 'ghast', x: 40, warm: '#241c30' } },
      { wait: 1.4 },
      { set: { who: 'ghast', hide: false } },
      { move: { who: 'ghast', x: 300, dur: 3, gait: 'walk' } },
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'rage', size: 'cu', push: 0.12, warm: '#2c1440' } },
      { sfx: 'screech' },
      { shake: 0.8 },
      { say: 'colletteghast', text: "Hoard all of this stuff with me in my garage!!!" },
      // the lunge: claws first
      { shot: { size: 'full', on: 'sonya', x: 240 } },
      { anim: { who: 'ghast', frames: [{ pose: 'windup', ext: 1, dur: 0.3 }] } },
      { move: { who: 'ghast', x: 400, dur: 0.24, gait: null, pose: 'strike' } },
      { flash: '#ffffff' },
      { sfx: 'heavy' },
      { shake: 1 },
      { move: { who: 'sonya', x: 200, y: GY, dur: 0.4, arc: 50, pose: 'hurt', facing: 1, gait: null } },
      { fx: 'stars', x: 200, y: GY - 50, dur: 0.9 },
      { wait: 0.4 },
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'mcu' } },
      { set: { who: 'sonya', pose: null } },
      { say: 'sonya', text: "Okay, Mom. Book club's over." },
    ],
  };

  // --- after the fight: the confession, and the bats ---
  C['ch2-end'] = {
    stage: 'collette-garage', camX: 160, zoom: 1,
    actors: {
      sonya: { char: 'sonya', x: 330, y: GY, facing: 1 },
      ghast: { char: 'collette', boss: true, x: 620, y: GY, facing: -1, pose: 'hurt' },
    },
    steps: [
      { shot: { size: 'med', on: 'sonya', warm: '#241c30' } },
      { wait: 0.6 },
      { shot: { face: true, on: 'sonya', expr: 'neutral', size: 'mcu' } },
      { say: 'sonya', text: "Mom. Those teenagers siphoning gas out of your car?" },
      { say: 'sonya', text: "I've been paying them." },
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'surprised', size: 'cu' } },
      { say: 'colletteghast', text: "WHAT." },
      { shot: { face: true, on: 'sonya', expr: 'smug', size: 'cu', push: 0.07 } },
      { say: 'sonya', text: "The only way to stop them is to park in the grass and sleep with a kitchen knife under your pillow." },
      // she takes the news poorly
      { shot: { size: 'full', on: 'ghast', x: 380, warm: '#40182c' } },
      { anim: { who: 'ghast', frames: [{ pose: 'windup', ext: 0.5, dur: 0.4 }, { pose: 'windup', ext: 1, dur: 0.4 }] } },
      { sfx: 'screech' },
      { shake: 0.8 },
      { flash: '#ffffff' },
      { sfx: 'die' },
      { fx: 'bats', x: 620, y: GY - 60, n: 16, dur: 2.8, hold: 1.6 },
      { set: { who: 'ghast', hide: true } },
      { shake: 0.6 },
      { wait: 1.4 },
      { shot: { size: 'wide', on: 'sonya', x: 160 } },
      { say: 'sonya', text: "...Thanksgiving is going to be so weird." },
      { title: 'CHAPTER TWO COMPLETE', sub: 'SONYA UNLOCKED FOR ARENA', dur: 3 },
    ],
  };
})();
