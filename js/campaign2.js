// ===== Campaign Chapter 2 — SONYA: Mom's House =====
// Scenes only; the chapter entry and stage defs live in campaign.js.
//
// CINEMATOGRAPHY PASS: story, dialogue and staging are locked — this file's
// scenes carry the presentation layer on top. Yard scenes key off the low
// dusk sun at stage-left (218,156) with long right-leaning shadows; garage
// scenes key off the single bare bulb at (875,142) with shadows falling into
// the boss-black left end. Comedy earns irises and rimshot stings; the horror
// earns handheld, a dutched reveal, and an inverted impact frame on contact.
//
// MOVIE-GRAMMAR PASS: nobody stands still to talk. Walks are tracked, lines
// type over the steps on parallel tracks, and every pre-fight scene ends with
// the energy already rolling into the fight (the ch1-night pattern).

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
  // DIRECTION: dusk comedy in motion. Sonya crosses the whole lawn to the
  // car under a tracking camera, both lines typing over her steps; Heath
  // arrives in one long unbroken follow shot WHILE the greeting plays, keeps
  // sauntering through her warning, then strolls right PAST her during the
  // stunned silent beat. The iris winks on the pivot, the whip snaps to her
  // panic, and she is already scrambling when the card cuts to the fight.
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
      // one tracked crossing: she walks the yard calling for Mom, and the
      // second line lands with her arm flung at the car on the lawn
      { cam: { follow: 'sonya', lead: 80, lag: 2.4, zoom: 1.3 } },
      { par: [
        [{ move: { who: 'sonya', x: 360, dur: 1.6, gait: 'walk', sfxStep: true } },
         { move: { who: 'sonya', x: 470, dur: 2.2, gait: 'walk', sfxStep: true } },
         { pose: { who: 'sonya', pose: 'windup', ext: 0.35 } }],
        [{ say: 'sonya', text: "Mom? It's Sonya.", dur: 1.8 },
         { wait: 0.4 },
         { say: 'sonya', text: "Your car is on the lawn again.", dur: 2.5 }],
      ] },
      { set: { who: 'sonya', pose: null } },
      // Heath saunters in from the driveway — one unbroken follow shot,
      // the greeting typing over the walk. The walk is still the joke.
      { set: { who: 'heath', hide: false } },
      { cam: { follow: 'heath', lead: 90, lag: 2.2, zoom: 1.25 } },
      { par: [
        [{ move: { who: 'heath', x: 620, dur: 3.6, gait: 'walk', sfxStep: true } }],
        [{ wait: 1.1 },
         { say: 'heath', text: "Heyyy. Little sister.", dur: 2.1, expr: 'smug' }],
      ] },
      // she squares up and warns him. he does not stop walking.
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { par: [
        [{ say: 'sonya', text: "Heath. Whatever you're about to do — don't.", dur: 3.0 }],
        [{ move: { who: 'heath', x: 560, dur: 2.6, gait: 'walk' } },
         { pose: { who: 'sonya', pose: 'windup', ext: 0.3 } }],
      ] },
      { shot: { face: true, on: 'heath', expr: 'determined', size: 'cu', push: 0.1 } },
      { say: 'heath', text: "I just ate three gas station burritos." },
      // the silent beat: she does the math WHILE he strolls right past her
      { shot: { face: true, on: 'sonya', expr: 'surprised', size: 'cu' } },
      { par: [
        [{ move: { who: 'heath', x: 380, dur: 1.5, gait: 'walk', sfxStep: true } },
         { set: { who: 'sonya', facing: -1 } }],
        [{ wait: 0.6 }],
      ] },
      // the pivot. she knows what that means.
      { shot: { size: 'full', on: 'heath', x: 60, warm: '#c98a4a', cut: 'iris' } },
      { sting: 'comedy' },
      { set: { who: 'heath', facing: 1 } },
      { pose: { who: 'heath', pose: 'windup', ext: 1 } },
      { shake: 0.4 },
      // she is backpedaling before the line even finishes — into the fight
      { shot: { face: true, on: 'sonya', expr: 'scared', size: 'cu', cut: 'whip', sway: 0.35, push: 0.08 } },
      { par: [
        [{ say: 'sonya', text: "HEATH. NO.", dur: 1.6 }],
        [{ move: { who: 'sonya', x: 620, dur: 1.2, facing: -1, gait: 'walk', pose: null } }],
        [{ wait: 0.3 }, { move: { who: 'heath', x: 430, dur: 0.5, gait: 'stomp' } }],
      ] },
    ],
  };

  // --- JR arrives in the only way he knows ---
  // DIRECTION: monster movie in one continuous roll. Sonya struts off dusting
  // her hands, the whip goes handheld as the engine hits, then the RV rolls
  // from offscreen all the way to its mark under a follow cam — dust blooming
  // in its wake, Sonya backpedaling, and JR's first line typing OVER the roll.
  // The drama sting punctuates the parked monster; it keeps creeping forward
  // through his rage line, and the lurch on the whip rolls into the fight.
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
      // she strolls off dusting her hands — one brother down
      { par: [
        [{ say: 'sonya', text: "That's one brother down.", expr: 'smug', dur: 2.2 }],
        [{ move: { who: 'sonya', x: 390, dur: 1.9, gait: 'walk', sfxStep: true } },
         { anim: { who: 'sonya', frames: [{ pose: 'punch', ext: 0.35, dur: 0.2 }, { pose: 'punch', ext: 0.05, dur: 0.2 }] } },
         { set: { who: 'sonya', pose: null } }],
      ] },
      // the engine shakes the frame before anything is on screen
      { shot: { size: 'wide', on: 'sonya', x: 260, warm: '#c98a4a', cut: 'whip', sway: 0.45, dutch: 0.02 } },
      { sfx: 'heavy' },
      { shake: 0.5 },
      // the RV rolls CONTINUOUSLY from offscreen to its mark: follow cam,
      // dust trailing the wheels, Sonya backing up, JR's line over the roll
      { cam: { follow: 'rv', lead: 150, lag: 3, zoom: 1.2 } },
      { par: [
        [{ move: { who: 'rv', x: 760, dur: 3.4, gait: null } }],
        [{ wait: 0.7 }, { fx: 'dust', x: 1430, y: GY, n: 8, dur: 0.7 },
         { wait: 0.7 }, { fx: 'dust', x: 1250, y: GY, n: 8, dur: 0.7 },
         { wait: 0.7 }, { fx: 'dust', x: 980, y: GY, n: 8, dur: 0.7 },
         { wait: 1.3 }, { shake: 0.5 }, { fx: 'dust', x: 860, y: GY, n: 10, dur: 0.9 }],
        [{ wait: 0.5 },
         { say: 'jr', text: "You put Heath in the birdbath.", dur: 2.5, expr: 'angry' }],
        [{ wait: 0.8 },
         { move: { who: 'sonya', x: 250, dur: 2.0, facing: 1, gait: 'walk' } }],
      ] },
      { sting: 'drama' },
      // she steps back IN to say it to the windshield
      { shot: { face: true, on: 'sonya', expr: 'smug', size: 'cu' } },
      { par: [
        [{ say: 'sonya', text: "He started it.", dur: 1.7 }],
        [{ move: { who: 'sonya', x: 310, dur: 1.1, gait: 'walk' } }],
      ] },
      // the RV creeps forward under his whole rage line
      { shot: { face: true, on: 'rv', faceId: 'jr', expr: 'rage', size: 'cu', push: 0.1, sway: 0.3, dutch: 0.02 } },
      { par: [
        [{ say: 'jr', text: "Nobody disrespects this family except ME. And maybe Mom.", dur: 3.6 }],
        [{ move: { who: 'rv', x: 690, dur: 3.2, gait: null } },
         { fx: 'dust', x: 730, y: GY, n: 6, dur: 0.6 }],
      ] },
      { music: 'boss' },
      { shot: { size: 'full', on: 'rv', x: 240, warm: '#c98a4a', cut: 'whip', sway: 0.3, dutch: 0.03 } },
      { pose: { who: 'rv', pose: 'windup', ext: 1 } },
      { flash: '#ffdf8e' },
      { sfx: 'heavy' },
      { shake: 0.7 },
      // it LURCHES. she plants. the fight is already rolling.
      { move: { who: 'rv', x: 610, dur: 0.35, gait: null } },
      { fx: 'dust', x: 650, y: GY, n: 10, dur: 0.7 },
      { shake: 0.5 },
      { pose: { who: 'sonya', pose: 'windup', ext: 0.6 } },
    ],
  };

  // --- Yvonne and the suitors ---
  // DIRECTION: romance parody in motion. Yvonne promenades the whole lawn
  // under a dreamy follow cam, hand-flip mid-line; she keeps pacing regally
  // through her refusal. The whistle whips wide and the suitors sprint in a
  // staggered cascade — the third one eats lawn (spin, dust, rimshot). The
  // pack is already surging at Sonya under "Get her, my darlings."
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
      // the promenade: a slow tracked sashay in two beats, the greeting
      // typing over the walk, a dismissive little hand-flip mid-line
      { cam: { follow: 'yvonne', lead: 80, lag: 2.2, zoom: 1.3 } },
      { par: [
        [{ move: { who: 'yvonne', x: 820, dur: 2.4, gait: 'walk', sfxStep: true } },
         { move: { who: 'yvonne', x: 640, dur: 2.2, gait: 'walk' } }],
        [{ wait: 1.0 },
         { say: 'yvonne', text: "Sonya, sweetie. You look tired.", dur: 2.5, expr: 'smug' }],
        [{ wait: 2.6 },
         { anim: { who: 'yvonne', frames: [{ pose: 'punch', ext: 0.45, dur: 0.35 }, { pose: 'punch', ext: 0.1, dur: 0.35 }] } }],
      ] },
      { set: { who: 'yvonne', pose: null } },
      // one flat word, closing the distance the whole time
      { shot: { face: true, on: 'sonya', expr: 'angry', size: 'cu' } },
      { par: [
        [{ say: 'sonya', text: "Yvonne.", dur: 1.4 }],
        [{ move: { who: 'sonya', x: 390, dur: 1.1, gait: 'walk' } }],
      ] },
      // she paces a regal little arc while she refuses — never breaking gaze
      { shot: { face: true, on: 'yvonne', expr: 'determined', size: 'cu', push: 0.06, sway: 0.3 } },
      { par: [
        [{ say: 'yvonne', text: "You know I can't let you through. Boys?", dur: 2.9 }],
        [{ move: { who: 'yvonne', x: 575, dur: 1.4, gait: 'walk', facing: -1 } },
         { move: { who: 'yvonne', x: 640, dur: 1.4, gait: 'walk', facing: -1 } }],
      ] },
      // she whistles and they ARRIVE — a staggered sprint, one casualty
      { sfx: 'coin' },
      { shot: { size: 'wide', on: 'yvonne', x: 420, warm: '#b86a5a', cut: 'whip' } },
      { set: { who: 's1', hide: false } },
      { set: { who: 's2', hide: false } },
      { set: { who: 's3', hide: false } },
      { par: [
        [{ move: { who: 's1', x: 760, dur: 0.8, gait: 'walk', sfxStep: true } }],
        [{ wait: 0.25 }, { move: { who: 's2', x: 850, dur: 0.85, gait: 'walk', sfxStep: true } }],
        [{ wait: 0.5 }, { move: { who: 's3', x: 1015, dur: 0.6, gait: 'walk', sfxStep: true } },
         { move: { who: 's3', x: 940, dur: 0.5, arc: 34, spin: 6.3, gait: null } },
         { sfx: 'stomp' }, { fx: 'dust', x: 940, y: GY, n: 9, dur: 0.7 },
         { set: { who: 's3', pose: 'hurt', rot: 0 } }],
        [{ wait: 0.6 }, { shake: 0.3 }],
      ] },
      { sting: 'comedy' },
      // she backs off the pack while she counts; the casualty pops back up
      { shot: { face: true, on: 'sonya', expr: 'surprised', size: 'cu', sway: 0.25 } },
      { par: [
        [{ say: 'sonya', text: "How many boyfriends do you HAVE?", dur: 2.5 }],
        [{ move: { who: 'sonya', x: 310, dur: 1.6, facing: 1, gait: 'walk' } }],
        [{ wait: 1.0 }, { set: { who: 's3', pose: null } }],
      ] },
      // the arm drops, the pack surges — into the fight
      { shot: { face: true, on: 'yvonne', expr: 'smug', size: 'cu', push: 0.08, sway: 0.3, cut: 'iris' } },
      { par: [
        [{ say: 'yvonne', text: "Get her, my darlings.", dur: 2.1 }],
        [{ pose: { who: 'yvonne', pose: 'windup', ext: 0.7 } },
         { wait: 0.3 }, { move: { who: 's1', x: 640, dur: 0.9, gait: 'walk', sfxStep: true } }],
        [{ wait: 0.5 }, { move: { who: 's2', x: 740, dur: 0.9, gait: 'walk' } }],
        [{ wait: 0.7 }, { move: { who: 's3', x: 830, dur: 0.9, gait: 'walk' } }],
      ] },
    ],
  };

  // --- the garage: mom, and the thing that comes back out of the dark ---
  // DIRECTION: the horror centerpiece. Calm mom PACES the bulb's light pool
  // through the scolding, finger jabbing on "anymore!", never breaking eye
  // contact; dread score under it, heartbreak under "But I love him." Her
  // retreat into the dark plays UNDER Sonya's worried line (the bulb hum cut
  // to dead room tone carries the bottom drop). The emergence is a slow
  // follow-cam creep — one floorboard creak, Sonya backing up — the reveal
  // hits with 'shock', a 0.06 dutch and the camera coming apart, her claws
  // rising through the whole hoard line. The lunge cuts fast — whip in,
  // inverted impact frame on contact — and Sonya gets up already advancing.
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
      // she paces the light pool sideways, eyes never leaving Sonya, and the
      // finger comes out on "anymore!"
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'rage', size: 'mcu', push: 0.08 } },
      { par: [
        [{ say: 'collette', text: "I don't want you seeing that Catholic boy anymore!", dur: 3.4 }],
        [{ move: { who: 'mom', x: 780, dur: 1.7, gait: 'walk', facing: -1, sfxStep: true } },
         { move: { who: 'mom', x: 660, dur: 1.7, gait: 'walk', facing: -1, sfxStep: true } }],
        [{ wait: 2.9 },
         { anim: { who: 'mom', frames: [{ pose: 'punch', ext: 0.6, dur: 0.25 }, { pose: 'punch', ext: 0.2, dur: 0.3 }] } }],
      ] },
      { set: { who: 'mom', pose: null } },
      { sting: 'heartbreak' },
      // she says it stepping TOWARD her mother
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'cu', push: 0.08 } },
      { par: [
        [{ say: 'sonya', text: "But I love him.", dur: 1.8 }],
        [{ move: { who: 'sonya', x: 380, dur: 1.1, gait: 'walk', sfxStep: true } }],
      ] },
      // the screech, the recoil
      { shot: { face: true, on: 'mom', faceId: 'collette', expr: 'hurt', size: 'cu', sway: 0.3 } },
      { sfx: 'screech' },
      { shake: 0.6 },
      { anim: { who: 'mom', frames: [{ pose: 'hurt', ext: 1, dur: 0.35 }] } },
      { wait: 0.7 },
      // the hum dies with the argument: nothing left but the room — and the
      // retreat into the dark plays UNDER Sonya's worried line
      { amb: 'night-room' },
      { shot: { size: 'wide', on: 'mom', x: 100, warm: '#241c30', sway: 0.3, push: 0.05 } },
      { par: [
        [{ move: { who: 'mom', x: 150, dur: 3.6, gait: 'walk', facing: -1 } },
         { set: { who: 'mom', hide: true } }],
        [{ wait: 1.4 },
         { say: 'sonya', text: "Mom, are you okay?", dur: 1.9, expr: 'scared' }],
      ] },
      { wait: 0.9 },
      // hold on the dark. nothing. then it comes out — a slow tracked creep,
      // the score building with her, one floorboard giving her away
      { shot: { size: 'med', on: 'ghast', x: 40, warm: '#241c30', cut: 'fade', sway: 0.45, dutch: 0.03, push: 0.06 } },
      { wait: 1.4 },
      { set: { who: 'ghast', hide: false } },
      { music: 'garage-horror' },
      { cam: { follow: 'ghast', lead: 200, lag: 2, zoom: 1.35 } },
      { par: [
        [{ move: { who: 'ghast', x: 300, dur: 4.2, gait: 'walk' } }],
        [{ wait: 1.6 }, { sfx: 'creak' }, { fx: 'creak', x: 240, y: GY, dur: 1.1 }],
        [{ wait: 2.6 }, { set: { who: 'sonya', facing: -1 } },
         { wait: 0.6 }, { move: { who: 'sonya', x: 430, dur: 1.0, facing: -1, gait: 'walk' } }],
      ] },
      { sting: 'shock' },
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'rage', size: 'cu', push: 0.12, warm: '#2c1440', sway: 0.7, dutch: 0.06 } },
      { sfx: 'screech' },
      { shake: 0.8 },
      // the claws rise through the whole line
      { par: [
        [{ say: 'colletteghast', text: "Hoard all of this stuff with me in my garage!!!", dur: 3.2 }],
        [{ anim: { who: 'ghast', frames: [{ pose: 'windup', ext: 0.35, dur: 1.5 }, { pose: 'windup', ext: 0.55, dur: 1.7 }] } }],
      ] },
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
      // she gets up already walking back in — into the fight
      { shot: { face: true, on: 'sonya', expr: 'determined', size: 'mcu', push: 0.08, sway: 0.25 } },
      { set: { who: 'sonya', pose: null } },
      { par: [
        [{ say: 'sonya', text: "Okay, Mom. Book club's over.", dur: 2.4 }],
        [{ move: { who: 'sonya', x: 280, dur: 0.9, gait: 'walk' } },
         { pose: { who: 'sonya', pose: 'windup', ext: 0.6 } }],
        [{ wait: 0.8 }, { set: { who: 'ghast', pose: 'windup', ext: 0.5 } }],
      ] },
    ],
  };

  // --- after the fight: the confession, and the bats ---
  // DIRECTION: dead-air comedy in the wreckage — but the ghast CIRCLES.
  // She picks herself up and prowls a full orbit around Sonya through the
  // confession, Sonya's head tracking her; she is still stalking back to her
  // mark on "WHAT.", then stops DEAD for the pillow-knife line (the stillness
  // IS the joke) before the transformation snaps ('shock', flash, impact),
  // the hum dies, and the ungraded wide plays the room as just a room while
  // Sonya wanders the wreckage; 'victory' carries the title card.
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
      // she picks herself up out of the wreckage
      { set: { who: 'ghast', pose: null } },
      { fx: 'dust', x: 620, y: GY, n: 6, dur: 0.6 },
      // the confession — the ghast prowls a full slow orbit around Sonya
      // while both lines play, and Sonya's head tracks her around
      { shot: { face: true, on: 'sonya', expr: 'neutral', size: 'mcu', push: 0.05 } },
      { par: [
        [{ say: 'sonya', text: "Mom. Those teenagers siphoning gas out of your car?", dur: 3.4 },
         { say: 'sonya', text: "I've been paying them.", dur: 2.1 }],
        [{ move: { who: 'ghast', x: 250, dur: 3.0, gait: 'walk' } },
         { set: { who: 'ghast', facing: 1 } },
         { wait: 0.4 },
         { move: { who: 'ghast', x: 470, dur: 2.6, gait: 'walk' } }],
        [{ wait: 1.4 }, { set: { who: 'sonya', facing: -1 } },
         { wait: 2.4 }, { set: { who: 'sonya', facing: 1 } }],
      ] },
      // still stalking back to her mark on the word itself
      { shot: { face: true, on: 'ghast', faceId: 'colletteghast', expr: 'surprised', size: 'cu', cut: 'whip' } },
      { par: [
        [{ say: 'colletteghast', text: "WHAT.", dur: 1.4 }],
        [{ move: { who: 'ghast', x: 620, dur: 1.3, gait: 'walk' } }],
      ] },
      // and then she stops DEAD. nobody moves for the diagnosis.
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
      // she wanders the wreckage toward the spot where Mom stood
      { shot: { size: 'wide', on: 'sonya', x: 160, cut: 'fade', push: 0.04 } },
      { par: [
        [{ say: 'sonya', text: "...Thanksgiving is going to be so weird.", dur: 2.9 }],
        [{ wait: 0.5 }, { move: { who: 'sonya', x: 450, dur: 2.6, gait: 'walk', sfxStep: true } }],
      ] },
      { sting: 'comedy' },
      { music: 'victory' },
      { title: 'CHAPTER TWO COMPLETE', sub: 'SONYA UNLOCKED FOR ARENA', dur: 3 },
    ],
  };
})();
