// music.js — runtime-synthesized cinematic score for campaign cutscenes.
// Everything is WebAudio built at runtime: no files, no libraries. Own
// AudioContext + master bus (separate from Sfx, same unlock pattern).
// Contract: MUSIC.play(mood) / stop / sting / ambience / ambienceOff /
// duck / unlock / .now — see MOODS/STINGS/AMBS tables for names.
(function () {
  'use strict';

  // ---- engine tuning (hoisted) ----
  const LOOKAHEAD = 0.12;      // schedule this far ahead of the audio clock
  const TICK_MS = 25;          // scheduler timer period
  const XFADE = 1.5;           // play() crossfade seconds
  const DUCK_LVL = 0.447;      // -7dB
  const DUCK_SEC = 0.08;       // setTargetAtTime tau (~0.25s to settle)
  const MUSIC_LVL = 0.9, AMB_LVL = 0.8, STING_LVL = 0.9, MASTER_LVL = 0.62;

  // midi -> Hz
  const FREQ = new Float32Array(128);
  for (let i = 0; i < 128; i++) FREQ[i] = 440 * Math.pow(2, (i - 69) / 12);

  // chord types: intervals in semitones above root
  const CH = {
    M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    d7: [0, 4, 7, 10], sus: [0, 5, 7], P: [0, 7, 12], m9: [0, 3, 7, 14],
  };

  // voice ids (indexes into WETV)
  const V_LEAD = 0, V_BASS = 1, V_PAD = 2, V_BOX = 3, V_KICK = 4, V_SNARE = 5,
    V_HAT = 6, V_TICK = 7, V_BOOM = 8, V_PLUCK = 9, V_BELL = 10, V_SWELL = 11,
    V_CHIRP = 12, V_BIRD = 13, V_CREAK = 14, V_STAB = 15, V_TOM = 16, V_DRONE = 17;
  // reverb send level per voice
  const WETV = [0.30, 0.05, 0.22, 0.55, 0.06, 0.22, 0.10, 0.30, 0.35, 0.60,
    0.65, 0.30, 0.15, 0.45, 0.35, 0.25, 0.25, 0.12];

  // ---------------------------------------------------------------
  // composition builders — run ONCE at module load, produce flat
  // Float64Array event streams [t, voice, freq, dur, vel, aux] * n
  // ---------------------------------------------------------------
  function note(L, t, v, f, d, vel, aux) { L.push(t, v, f, d, vel, aux || 0); }

  // melody from stride-3 triples [midi, beat, durBeats]
  function mel(L, spb, voice, vel, tri, trans, aux) {
    for (let i = 0; i < tri.length; i += 3) {
      const b = tri[i + 1];
      note(L, b * spb, voice, FREQ[tri[i] + (trans | 0)], tri[i + 2] * spb,
        vel * (b % 4 === 0 ? 1 : 0.85), aux);
    }
  }
  // driving eighth-note roots, octave pop on the back half of beats 1 and 3
  function bass8(L, spb, prog, bpb, vel) {
    for (let bar = 0; bar < prog.length; bar++) {
      const r = prog[bar][0], t0 = bar * bpb;
      for (let e = 0; e < bpb * 2; e++) {
        const up = (e === 3 || e === 7) ? 12 : 0;
        note(L, (t0 + e * 0.5) * spb, V_BASS, FREQ[r + up], 0.5 * spb,
          vel * (e % 2 ? 0.8 : 1));
      }
    }
  }
  function bassHalf(L, spb, prog, bpb, vel) {
    for (let bar = 0; bar < prog.length; bar++) {
      const r = prog[bar][0], t0 = bar * bpb;
      note(L, t0 * spb, V_BASS, FREQ[r], 1.8 * spb, vel);
      note(L, (t0 + 2) * spb, V_BASS, FREQ[r + 7], 1.8 * spb, vel * 0.85);
    }
  }
  function bassWhole(L, spb, prog, bpb, vel) {
    for (let bar = 0; bar < prog.length; bar++)
      note(L, bar * bpb * spb, V_BASS, FREQ[prog[bar][0]], bpb * spb * 0.96, vel);
  }
  // sustained chords, one per holdBars
  function padCh(L, spb, prog, bpb, vel, holdBars, voice, oct, det) {
    for (let bar = 0; bar < prog.length; bar += holdBars) {
      const c = prog[bar], iv = CH[c[1]];
      for (let k = 0; k < iv.length; k++)
        note(L, bar * bpb * spb, voice, FREQ[c[0] + iv[k] + (oct | 0)],
          holdBars * bpb * spb * 0.98, vel, det || 0);
    }
  }
  // broken-chord arpeggio; pat = chord-tone indices (wrap adds +12)
  function arp(L, spb, prog, bpb, pat, rate, vel, voice, oct) {
    for (let bar = 0; bar < prog.length; bar++) {
      const c = prog[bar], iv = CH[c[1]], n = (bpb / rate) | 0;
      for (let e = 0; e < n; e++) {
        const p = pat[e % pat.length], up = 12 * ((p / iv.length) | 0);
        note(L, (bar * bpb + e * rate) * spb, voice,
          FREQ[c[0] + iv[p % iv.length] + up + (oct | 0)], rate * spb * 0.9,
          vel * (e === 0 ? 1 : 0.8));
      }
    }
  }
  // drum bar template quads [voice, beat, vel, aux], fill variant every 8th bar
  function drums(L, spb, bars, bpb, tpl, fill) {
    for (let bar = 0; bar < bars; bar++) {
      const T = (fill && bar % 8 === 7) ? fill : tpl;
      for (let i = 0; i < T.length; i += 4)
        note(L, (bar * bpb + T[i + 1]) * spb, T[i], T[i + 3] || 0, 0.1, T[i + 2], T[i + 3] || 0);
    }
  }
  // sort a built list into the final flat typed array
  function finish(list, loopDur) {
    const n = list.length / 6, idx = new Array(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    idx.sort((a, b) => list[a * 6] - list[b * 6]);
    const out = new Float64Array(list.length);
    for (let i = 0; i < n; i++)
      for (let k = 0; k < 6; k++) out[i * 6 + k] = list[idx[i] * 6 + k];
    return { events: out, loopDur: loopDur };
  }

  // drum templates (voice, beat, vel, aux)
  const D_ROCK = [
    V_KICK, 0, 1, 0, V_KICK, 2, 0.9, 0, V_KICK, 2.5, 0.55, 0,
    V_SNARE, 1, 0.85, 0, V_SNARE, 3, 0.85, 0,
    V_HAT, 0, 0.4, 0, V_HAT, 0.5, 0.25, 0, V_HAT, 1, 0.4, 0, V_HAT, 1.5, 0.25, 0,
    V_HAT, 2, 0.4, 0, V_HAT, 2.5, 0.25, 0, V_HAT, 3, 0.4, 0, V_HAT, 3.5, 0.25, 0,
  ];
  const D_ROCK_F = D_ROCK.concat([V_SNARE, 3.5, 0.6, 0, V_SNARE, 3.75, 0.7, 0]);
  const D_SOFT = [
    V_KICK, 0, 0.45, 0, V_KICK, 2.5, 0.3, 0,
    V_HAT, 0.5, 0.16, 0, V_HAT, 1.5, 0.16, 0, V_HAT, 2.5, 0.16, 0, V_HAT, 3.5, 0.16, 0,
  ];
  const D_SWAY = [
    V_KICK, 0, 0.5, 0, V_KICK, 2, 0.4, 0,
    V_SNARE, 1, 0.3, 1, V_SNARE, 3, 0.3, 1,           // aux1 = brushed
    V_HAT, 0, 0.28, 0, V_HAT, 0.67, 0.14, 0, V_HAT, 1, 0.28, 0, V_HAT, 1.67, 0.14, 0,
    V_HAT, 2, 0.28, 0, V_HAT, 2.67, 0.14, 0, V_HAT, 3, 0.28, 0, V_HAT, 3.67, 0.14, 0,
  ];
  const D_SWAY_F = D_SWAY.concat([V_TOM, 3.33, 0.35, 0, V_TOM, 3.67, 0.3, 0]);
  const D_DRIVE = [
    V_KICK, 0, 1, 0, V_KICK, 1.5, 0.7, 0, V_KICK, 2, 0.95, 0, V_KICK, 3.5, 0.6, 0,
    V_SNARE, 1, 0.9, 0, V_SNARE, 3, 0.9, 0,
    V_HAT, 0.5, 0.35, 0, V_HAT, 1.5, 0.35, 0, V_HAT, 2.5, 0.35, 0, V_HAT, 3.5, 0.35, 1,
  ];
  const D_DRIVE_F = [
    V_KICK, 0, 1, 0, V_KICK, 1.5, 0.7, 0, V_KICK, 2, 0.95, 0,
    V_SNARE, 1, 0.9, 0, V_SNARE, 3, 0.8, 0, V_SNARE, 3.25, 0.6, 0,
    V_SNARE, 3.5, 0.7, 0, V_SNARE, 3.75, 0.85, 0,
    V_HAT, 0.5, 0.35, 0, V_HAT, 1.5, 0.35, 0, V_HAT, 2.5, 0.35, 0,
  ];
  const D_HEAVY = [
    V_KICK, 0, 1, 0, V_KICK, 0.75, 0.6, 0, V_KICK, 1.5, 0.75, 0, V_KICK, 2, 1, 0,
    V_KICK, 2.75, 0.6, 0, V_KICK, 3.5, 0.7, 0,
    V_SNARE, 1, 0.95, 0, V_SNARE, 3, 0.95, 0,
    V_HAT, 0, 0.45, 1, V_HAT, 1, 0.3, 0, V_HAT, 2, 0.45, 1, V_HAT, 3, 0.3, 0,
  ];
  const D_HEAVY_F = D_HEAVY.concat([
    V_KICK, 3, 0.8, 0, V_KICK, 3.25, 0.8, 0, V_KICK, 3.75, 0.85, 0,
    V_SNARE, 3.5, 0.75, 0,
  ]);

  // THE TITLE MOTIF — the family theme every other piece may quote.
  // stride-3: [midi, beat, durBeats]; 4 bars in C major.
  const MOTIF = [
    72, 0, 1, 76, 1, 1, 79, 2, 1.5, 76, 3.5, 0.5,
    81, 4, 1, 79, 5, 1, 76, 6, 2,
    74, 8, 1, 76, 9, 1, 77, 10, 1.5, 74, 11.5, 0.5,
    76, 12, 1, 74, 13, 1, 72, 14, 2,
  ];
  // the motif re-cast in E minor, timing stretched and broken (garage)
  const MOTIF_BROKEN = [
    64, 0, 2, 67, 2.1, 2, 71, 4.4, 3, 67, 7.6, 1,
    72, 9, 2, 71, 11.2, 2, 67, 13.5, 4,
    66, 18, 2, 67, 20.3, 2, 69, 22.5, 3,
    67, 26.2, 2, 66, 28.4, 2, 64, 30.5, 5,
  ];
  // per-note detune cents for the broken motif (precomputed "random")
  const BROKEN_DET = [-22, 14, -31, 8, 26, -18, -35, 19, -12, 29, -26, 11, -19, 33];

  // ---------------------------------------------------------------
  // THE SCORE — nine moods, built eagerly at load
  // ---------------------------------------------------------------
  function buildTitle() { // confident, warm — sitcom opening with fists
    const bpm = 132, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const A = [[60, 'M'], [57, 'm'], [53, 'M'], [55, 'M']];
    const prog = A.concat(A, [[53, 'M'], [55, 'M'], [52, 'm'], [57, 'm']],
      [[53, 'M'], [55, 'M'], [60, 'M'], [60, 'M']]);
    const lead = MOTIF.concat([
      72, 16, 1, 76, 17, 1, 79, 18, 1.5, 81, 19.5, 0.5,
      84, 20, 1.5, 81, 21.5, 0.5, 79, 22, 2,
      77, 24, 0.5, 76, 24.5, 0.5, 74, 25, 1, 76, 26, 1, 77, 27, 1,
      79, 28, 2, 67, 30, 0.5, 71, 30.5, 0.5,
      // B — the lift
      81, 32, 1, 84, 33, 1, 81, 34, 1, 79, 35, 1,
      76, 36, 1.5, 79, 37.5, 0.5, 83, 38, 2,
      79, 40, 1, 76, 41, 1, 74, 42, 1.5, 76, 43.5, 0.5,
      72, 44, 1, 74, 45, 1, 76, 46, 2,
      77, 48, 1, 81, 49, 1, 84, 50, 1.5, 83, 51.5, 0.5,
      79, 52, 1, 77, 53, 1, 74, 54, 2,
      72, 56, 1, 76, 57, 1, 79, 58, 1, 81, 59, 1, 84, 60, 3.5,
    ]);
    mel(L, spb, V_LEAD, 0.9, lead, 0, 0);
    bass8(L, spb, prog, bpb, 0.85);
    padCh(L, spb, prog, bpb, 0.4, 1, V_PAD, 0, 8);
    drums(L, spb, bars, bpb, D_ROCK, D_ROCK_F);
    return finish(L, bars * bpb * spb);
  }

  function buildMap() { // music-box arrangement of the theme
    const bpm = 76, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const prog = [[60, 'M'], [57, 'm'], [53, 'M'], [55, 'M'],
      [60, 'M'], [57, 'm'], [53, 'M'], [55, 'M'],
      [57, 'm'], [53, 'M'], [60, 'M'], [55, 'M'],
      [57, 'm'], [53, 'M'], [55, 'M'], [60, 'M']];
    mel(L, spb, V_BOX, 0.6, MOTIF, 0, 0);              // the theme, bars 0-3
    mel(L, spb, V_BOX, 0.34, MOTIF, 12, 4);            // echo up an octave...
    for (let i = L.length - (MOTIF.length / 3) * 6; i < L.length; i += 6)
      L[i] += 32 * spb;                                 // ...shifted to bars 8-11
    arp(L, spb, prog, bpb, [0, 2, 1, 2], 1, 0.3, V_BOX, 0);
    bassWhole(L, spb, prog, bpb, 0.4);
    padCh(L, spb, prog, bpb, 0.16, 2, V_PAD, -12, 5);
    return finish(L, bars * bpb * spb);
  }

  function buildSuburb() { // wistful 80s suburbia, F major, descending bass
    const bpm = 92, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const prog = [[65, 'M7'], [60, 'M'], [62, 'm7'], [58, 'M7'],
      [65, 'M7'], [60, 'M'], [62, 'm7'], [58, 'M7'],
      [55, 'm7'], [57, 'm7'], [58, 'M7'], [60, 'sus'],
      [65, 'M7'], [60, 'M'], [58, 'M7'], [65, 'M7']];
    const bl = [41, 40, 38, 34, 41, 40, 38, 34, 43, 45, 46, 48, 41, 40, 34, 41];
    for (let b = 0; b < 16; b++) note(L, b * 4 * spb, V_BASS, FREQ[bl[b]], 3.9 * spb, 0.5);
    arp(L, spb, prog, bpb, [0, 2, 1, 3, 2, 3, 1, 2], 0.5, 0.42, V_PLUCK, 0);
    padCh(L, spb, prog, bpb, 0.26, 2, V_PAD, 0, 7);
    mel(L, spb, V_LEAD, 0.5, [
      69, 16, 2, 67, 18, 1, 65, 19, 1, 67, 20, 3,
      65, 24, 1.5, 67, 25.5, 0.5, 69, 26, 1, 72, 27, 1, 70, 28, 2, 69, 30, 2,
      72, 48, 2, 74, 50, 1, 72, 51, 1, 70, 52, 2, 69, 54, 2,
      67, 56, 1.5, 65, 57.5, 0.5, 67, 58, 1, 69, 59, 1, 65, 60, 4,
    ], 0, 1);
    drums(L, spb, bars, bpb, D_SOFT, null);
    return finish(L, bars * bpb * spb);
  }

  function buildDread() { // 2AM hallway — clock, pedal tones, long silences
    const bpm = 60, bpb = 4, bars = 16, spb = 1, L = [];
    for (let b = 0; b < 64; b++)   // tick... tock...
      note(L, b * spb, V_TICK, b % 2 ? 1500 : 1900, 0.05, b % 2 ? 0.3 : 0.42);
    note(L, 0, V_DRONE, FREQ[33], 32 * spb, 0.4, 9);        // A1 pedal
    note(L, 32 * spb, V_DRONE, FREQ[33], 16 * spb, 0.36, 9);
    note(L, 48 * spb, V_DRONE, FREQ[41], 16 * spb, 0.3, 12); // F2 — the dread lean
    note(L, 32 * spb, V_DRONE, FREQ[40], 16 * spb, 0.22, 7); // E2 under it
    // sparse, unresolved music-box notes in the dark
    mel(L, spb, V_BOX, 0.34, [
      57, 8, 4, 59, 22, 3, 60, 30.5, 2, 64, 41, 3, 65, 46.5, 2.5, 56, 55, 4,
    ], 0, -14);
    note(L, 34.2 * spb, V_BELL, FREQ[88], 3, 0.1);
    note(L, 61.5 * spb, V_BELL, FREQ[87], 3, 0.07);          // Eb6 — wrong on purpose
    note(L, 15.7 * spb, V_BOOM, 52, 1.4, 0.3);               // irregular heartbeats
    note(L, 39.3 * spb, V_BOOM, 48, 1.4, 0.34);
    note(L, 58.6 * spb, V_BOOM, 55, 1.4, 0.28);
    return finish(L, bars * bpb * spb);
  }

  function buildDusk() { // porch-swing sway with a smirk (swung, A major, Dm borrow)
    const bpm = 100, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const prog = [[57, 'M'], [62, 'M'], [57, 'M'], [64, 'M'],
      [57, 'M'], [62, 'M'], [66, 'm'], [64, 'M'],
      [62, 'M'], [57, 'M'], [62, 'm'], [57, 'M'],
      [66, 'm'], [62, 'M'], [64, 'M'], [57, 'M']];
    for (let bar = 0; bar < bars; bar++) { // lazy 1-and-5 sway bass, swung walkup
      const r = prog[bar][0] - 12, t0 = bar * bpb;
      note(L, t0 * spb, V_BASS, FREQ[r], 1.5 * spb, 0.55);
      note(L, (t0 + 2) * spb, V_BASS, FREQ[r + 7], 1.3 * spb, 0.45);
      note(L, (t0 + 3.67) * spb, V_BASS, FREQ[r + (bar % 4 === 3 ? 4 : 5)], 0.3 * spb, 0.35);
    }
    padCh(L, spb, prog, bpb, 0.2, 2, V_PAD, 0, 6);
    mel(L, spb, V_LEAD, 0.55, [
      76, 0, 1.67, 73, 1.67, 0.33, 71, 2, 1, 69, 3, 1,
      74, 4, 0.67, 76, 4.67, 0.33, 78, 5, 2.5,
      73, 8, 0.67, 71, 8.67, 0.33, 69, 9, 1.5, 64, 10.67, 1.33,
      71, 12, 1, 68, 13, 1, 64, 14, 2,
      76, 16, 1.67, 78, 17.67, 0.33, 81, 18, 2,
      78, 20, 0.67, 76, 20.67, 0.33, 74, 21, 1, 73, 22, 2,
      73, 24, 1, 74, 25, 1, 76, 26, 1.67, 73, 27.67, 0.33,
      71, 28, 1, 68, 29, 1, 64, 30, 2,
      74, 32, 1.67, 78, 33.67, 0.33, 81, 34, 2,
      73, 36, 1, 71, 37, 1, 69, 38, 2,
      77, 40, 2, 76, 42, 1, 74, 43, 1,       // F natural over Dm — the melancholy
      76, 44, 3,
      78, 48, 1.67, 76, 49.67, 0.33, 74, 50, 1, 73, 51, 1,
      74, 52, 1, 76, 53, 1, 78, 54, 2,
      68, 56, 1, 71, 57, 1, 68, 58, 1, 64, 59, 1,
      69, 60, 3.5,
    ], 0, 1);
    drums(L, spb, bars, bpb, D_SWAY, D_SWAY_F);
    return finish(L, bars * bpb * spb);
  }

  function buildGarage() { // detuned music box over a drone — it's still his mom
    const bpm = 63, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    note(L, 0, V_DRONE, FREQ[28], 32 * spb, 0.5, 18);        // E1
    note(L, 32 * spb, V_DRONE, FREQ[28], 32 * spb, 0.46, 18);
    note(L, 32 * spb, V_DRONE, FREQ[34], 32 * spb, 0.2, 24); // Bb1 tritone creep
    for (let i = 0, k = 0; i < MOTIF_BROKEN.length; i += 3, k++) {
      if (k === 3 || k === 9) continue;                       // dropped notes: broken
      note(L, (MOTIF_BROKEN[i + 1] + 6) * spb, V_BOX, FREQ[MOTIF_BROKEN[i]],
        MOTIF_BROKEN[i + 2] * spb, 0.5, BROKEN_DET[k]);
    }
    // a fragment of it comes back near the end, higher and wronger
    note(L, 50 * spb, V_BOX, FREQ[79], 2 * spb, 0.36, 38);
    note(L, 52.3 * spb, V_BOX, FREQ[78], 2 * spb, 0.32, -41);
    note(L, 55 * spb, V_BOX, FREQ[76], 4 * spb, 0.34, 27);
    // irregular accents out of the dark
    note(L, 11.3 * spb, V_BOOM, 50, 1.6, 0.4);
    note(L, 27.8 * spb, V_BOOM, 44, 1.6, 0.46);
    note(L, 44.1 * spb, V_BOOM, 52, 1.6, 0.4);
    note(L, 55.6 * spb, V_BOOM, 40, 2, 0.5);
    note(L, 19.4 * spb, V_BELL, 1370, 2.5, 0.09);
    note(L, 37.7 * spb, V_BELL, 988, 2.5, 0.11);
    note(L, 51.2 * spb, V_BELL, 1580, 2.5, 0.08);
    note(L, 33 * spb, V_PLUCK, FREQ[40], 1.5, 0.4);          // low cluster knock
    note(L, 33.04 * spb, V_PLUCK, FREQ[41], 1.5, 0.36);
    note(L, 60.5 * spb, V_PLUCK, FREQ[41], 1.5, 0.4);
    note(L, 60.54 * spb, V_PLUCK, FREQ[42], 1.5, 0.34);
    note(L, 5.5 * spb, V_TICK, 1700, 0.05, 0.3);             // something tapping
    note(L, 21.2 * spb, V_TICK, 1700, 0.05, 0.26);
    note(L, 35.9 * spb, V_TICK, 1500, 0.05, 0.3);
    note(L, 50.1 * spb, V_TICK, 1700, 0.05, 0.24);
    return finish(L, bars * bpb * spb);
  }

  function buildBoss() { // driving fight loop — tense but fun, E minor
    const bpm = 138, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const prog = [[52, 'm'], [52, 'm'], [52, 'm'], [52, 'm'],
      [48, 'M'], [48, 'M'], [50, 'M'], [47, 'M'],
      [52, 'm'], [52, 'm'], [48, 'M'], [50, 'M'],
      [52, 'm'], [52, 'm'], [47, 'M'], [47, 'M']];
    bass8(L, spb, prog, bpb, 0.9);
    drums(L, spb, bars, bpb, D_DRIVE, D_DRIVE_F);
    padCh(L, spb, prog, bpb, 0.2, 2, V_PAD, 12, 10);
    for (let bar = 4; bar < 8; bar++) {                       // stabs on the turn
      const c = prog[bar], iv = CH[c[1]];
      for (let k = 0; k < 3; k++) {
        note(L, bar * 4 * spb, V_STAB, FREQ[c[0] + iv[k] + 12], 0.3, 0.5);
        note(L, (bar * 4 + 2.5) * spb, V_STAB, FREQ[c[0] + iv[k] + 12], 0.25, 0.4);
      }
    }
    mel(L, spb, V_LEAD, 0.8, [
      76, 0, 0.5, 79, 0.5, 0.5, 76, 1, 0.5, 74, 1.5, 0.5, 76, 2, 1, 71, 3, 1,
      76, 4, 0.5, 79, 4.5, 0.5, 81, 5, 1, 79, 6, 0.5, 76, 6.5, 0.5, 74, 7, 1,
      76, 8, 0.5, 79, 8.5, 0.5, 76, 9, 0.5, 74, 9.5, 0.5, 76, 10, 1, 82, 11, 1,
      81, 12, 0.5, 79, 12.5, 0.5, 76, 13, 1, 74, 14, 0.5, 71, 14.5, 0.5, 76, 15, 1,
      // over the turn: longer lines
      79, 16, 2, 81, 18, 1, 84, 19, 1, 83, 20, 2, 79, 22, 2,
      81, 24, 1.5, 79, 25.5, 0.5, 78, 26, 2, 74, 28, 1, 78, 29, 1, 71, 30, 2,
      // B: up the octave
      88, 32, 0.5, 91, 32.5, 0.5, 88, 33, 0.5, 86, 33.5, 0.5, 88, 34, 1, 83, 35, 1,
      88, 36, 0.5, 91, 36.5, 0.5, 93, 37, 1, 91, 38, 0.5, 88, 38.5, 0.5, 86, 39, 1,
      84, 40, 1, 88, 41, 1, 84, 42, 0.5, 83, 42.5, 0.5, 81, 43, 1,
      86, 44, 1, 84, 45, 0.5, 81, 45.5, 0.5, 79, 46, 2,
      88, 48, 0.5, 91, 48.5, 0.5, 88, 49, 0.5, 86, 49.5, 0.5, 88, 50, 1, 91, 51, 1,
      93, 52, 1.5, 91, 53.5, 0.5, 88, 54, 2,
      87, 56, 1, 83, 57, 1, 78, 58, 1, 75, 59, 1,
      74, 60, 0.5, 75, 60.5, 0.5, 74, 61, 0.5, 71, 61.5, 0.5, 68, 62, 2,
    ], -12, 0);
    return finish(L, bars * bpb * spb);
  }

  function buildBossFinal() { // bigger, darker — C minor, Neapolitan lean, gallop
    const bpm = 145, bpb = 4, bars = 16, spb = 60 / bpm, L = [];
    const prog = [[48, 'm'], [48, 'm'], [56, 'M'], [55, 'M'],
      [48, 'm'], [48, 'm'], [49, 'M'], [55, 'M'],
      [48, 'm'], [51, 'M'], [56, 'M'], [55, 'M'],
      [48, 'm'], [49, 'M'], [55, 'M'], [55, 'M']];
    for (let bar = 0; bar < bars; bar++) {                    // gallop bass
      const r = prog[bar][0] - 12, t0 = bar * bpb;
      for (let q = 0; q < 4; q++) {
        note(L, (t0 + q) * spb, V_BASS, FREQ[r], 0.4 * spb, 0.9);
        note(L, (t0 + q + 0.5) * spb, V_BASS, FREQ[r], 0.2 * spb, 0.6);
        note(L, (t0 + q + 0.75) * spb, V_BASS, FREQ[r], 0.2 * spb, 0.7);
      }
    }
    drums(L, spb, bars, bpb, D_HEAVY, D_HEAVY_F);
    padCh(L, spb, prog, bpb, 0.3, 2, V_PAD, 24, 14);          // high dark choir
    for (let bar = 0; bar < bars; bar += 4)
      note(L, bar * 4 * spb, V_BOOM, 48, 1.6, 0.5);
    mel(L, spb, V_LEAD, 0.85, [
      72, 0, 0.75, 75, 0.75, 0.75, 79, 1.5, 0.5, 80, 2, 1, 79, 3, 1,
      72, 4, 0.75, 75, 4.75, 0.75, 79, 5.5, 0.5, 83, 6, 1.5, 79, 7.5, 0.5,
      80, 8, 1, 79, 9, 0.5, 75, 9.5, 0.5, 72, 10, 1, 75, 11, 1,
      73, 12, 1.5, 72, 13.5, 0.5, 71, 14, 2,                  // Db lean, chromatic fall
      72, 16, 0.75, 75, 16.75, 0.75, 79, 17.5, 0.5, 80, 18, 1, 79, 19, 1,
      84, 20, 1.5, 83, 21.5, 0.5, 80, 22, 1, 79, 23, 1,
      85, 24, 1, 84, 25, 0.5, 80, 25.5, 0.5, 79, 26, 1, 75, 27, 1,
      74, 28, 1, 75, 28.5, 0.5, 74, 29, 0.5, 71, 30, 2,
      // B: high and relentless
      87, 32, 0.75, 84, 32.75, 0.75, 87, 33.5, 0.5, 91, 34, 2,
      90, 36, 1, 87, 37, 0.5, 84, 37.5, 0.5, 87, 38, 2,
      88, 40, 1, 87, 41, 0.5, 84, 41.5, 0.5, 83, 42, 1, 80, 43, 1,
      79, 44, 0.5, 80, 44.5, 0.5, 79, 45, 0.5, 77, 45.5, 0.5, 75, 46, 2,
      84, 48, 0.75, 87, 48.75, 0.75, 91, 49.5, 0.5, 92, 50, 1.5, 91, 51.5, 0.5,
      90, 52, 1, 91, 52.5, 0.5, 90, 53, 0.5, 87, 54, 2,
      86, 56, 1, 83, 57, 1, 80, 58, 1, 77, 59, 1,
      76, 60, 0.5, 77, 60.5, 0.5, 76, 61, 0.5, 74, 61.5, 0.5, 71, 62, 2,
    ], -12, 0);
    return finish(L, bars * bpb * spb);
  }

  function buildVictory() { // short triumphant loop, quotes the theme's ending
    const bpm = 126, bpb = 4, bars = 8, spb = 60 / bpm, L = [];
    const prog = [[60, 'M'], [53, 'M'], [60, 'M'], [55, 'M'],
      [57, 'm'], [53, 'M'], [55, 'M'], [60, 'M']];
    bass8(L, spb, prog, bpb, 0.8);
    drums(L, spb, bars, bpb, D_ROCK, D_ROCK_F);
    padCh(L, spb, prog, bpb, 0.35, 1, V_PAD, 0, 8);
    const fan = [
      72, 0, 0.5, 76, 0.5, 0.5, 79, 1, 0.5, 84, 1.5, 1.5, 81, 3, 1,
      84, 4, 1, 81, 5, 0.5, 79, 5.5, 0.5, 81, 6, 2,
      79, 8, 0.5, 81, 8.5, 0.5, 84, 9, 1, 84, 10, 0.5, 86, 10.5, 0.5, 88, 11, 1,
      86, 12, 1, 84, 13, 1, 83, 14, 1, 79, 15, 1,
      72, 16, 1, 76, 17, 1, 79, 18, 2,
      77, 20, 1, 81, 21, 1, 84, 22, 2,
      79, 24, 0.5, 81, 24.5, 0.5, 83, 25, 1, 86, 26, 2,
      84, 28, 3.5,
    ];
    mel(L, spb, V_LEAD, 0.9, fan, 0, 0);
    mel(L, spb, V_BELL, 0.12, fan, 12, 0);                    // sparkle double
    return finish(L, bars * bpb * spb);
  }

  const MOODS = {
    'title': buildTitle(), 'campaign-map': buildMap(), 'suburb-day': buildSuburb(),
    'dread-night': buildDread(), 'dusk-comedy': buildDusk(),
    'garage-horror': buildGarage(), 'boss': buildBoss(),
    'boss-final': buildBossFinal(), 'victory': buildVictory(),
  };

  // ---------------------------------------------------------------
  // STINGS — one-shots, flat [t, voice, freq, dur, vel, aux] (t in sec)
  // ---------------------------------------------------------------
  const STINGS = {
    'shock': [
      0, V_BOOM, 90, 1.8, 1, 0,
      0, V_SWELL, 1400, 1.5, 0.7, 0,
      0, V_STAB, FREQ[48], 2.2, 0.5, 0, 0, V_STAB, FREQ[49], 2.2, 0.45, 0,
      0, V_STAB, FREQ[54], 2.2, 0.4, 0, 0, V_STAB, FREQ[61], 2.2, 0.35, 0,
      0.05, V_BELL, 2793, 2.5, 0.12, 0,
    ],
    'drama': [
      0, V_BOOM, 65, 2, 0.8, 0,
      0, V_STAB, FREQ[38], 2.4, 0.4, 0, 0, V_STAB, FREQ[45], 2.4, 0.35, 0,
      0, V_STAB, FREQ[53], 2.4, 0.3, 0,
      0.02, V_PAD, FREQ[50], 2.6, 0.3, 10, 0.02, V_PAD, FREQ[57], 2.6, 0.28, 10,
    ],
    'comedy': [
      0, V_TOM, 170, 0.3, 0.7, 0, 0.16, V_TOM, 145, 0.3, 0.7, 0,
      0.34, V_SNARE, 0, 0.2, 0.8, 0, 0.34, V_HAT, 0, 0.6, 0.6, 1,
    ],
    'triumph': [
      0, V_LEAD, FREQ[72], 0.16, 0.7, 0, 0.13, V_LEAD, FREQ[76], 0.16, 0.7, 0,
      0.26, V_LEAD, FREQ[79], 0.16, 0.75, 0, 0.39, V_LEAD, FREQ[84], 0.7, 0.85, 0,
      0.39, V_BELL, FREQ[84], 1.6, 0.16, 0, 0.39, V_BELL, FREQ[88], 1.6, 0.1, 0,
      0.39, V_STAB, FREQ[60], 0.6, 0.35, 0, 0.39, V_STAB, FREQ[64], 0.6, 0.3, 0,
      0.39, V_STAB, FREQ[67], 0.6, 0.3, 0,
    ],
    'heartbreak': [
      0, V_BOX, FREQ[76], 1.6, 0.5, 0, 0.8, V_BOX, FREQ[67], 2.4, 0.44, 0,
      0, V_PAD, FREQ[57], 3.2, 0.24, 8, 0, V_PAD, FREQ[60], 3.2, 0.22, 8,
      0, V_PAD, FREQ[64], 3.2, 0.2, 8,
      1.7, V_BELL, FREQ[84], 2.5, 0.07, 0,
    ],
  };

  // ---------------------------------------------------------------
  // AMBIENCES — { drones: [wave|'n', freq, level, filtType, filtFreq, detune],
  //               loop-eventable chirps in the same flat event format }
  // ---------------------------------------------------------------
  function cricketGroup(L, t0, f, n, gap) {
    for (let i = 0; i < n; i++) note(L, t0 + i * gap, V_CHIRP, f, 0.02, 0.2);
  }
  const AMBS = {};
  (function () {
    let L = [];
    cricketGroup(L, 0.9, 4200, 5, 0.07); cricketGroup(L, 2.7, 4350, 4, 0.075);
    cricketGroup(L, 3.8, 3800, 3, 0.08); cricketGroup(L, 4.9, 4200, 6, 0.07);
    cricketGroup(L, 6.1, 4500, 3, 0.065);
    AMBS['crickets'] = Object.assign(finish(L, 7),
      { drones: [['n', 0, 0.05, 'lowpass', 420, 0]] });
    L = [];
    note(L, 6.2, V_CREAK, 120, 0.5, 0.35); note(L, 15.8, V_BOOM, 46, 1.2, 0.22);
    note(L, 20.1, V_CREAK, 96, 0.6, 0.26);
    AMBS['night-room'] = Object.assign(finish(L, 23), {
      drones: [['n', 0, 0.06, 'lowpass', 220, 0],
        ['sine', 60, 0.03, null, 0, 0], ['sine', 120, 0.012, null, 0, 0]],
    });
    L = [];
    note(L, 4.2, V_SWELL, 2200, 0.12, 0.1, 0); note(L, 11.7, V_SWELL, 2200, 0.09, 0.08, 0);
    note(L, 9.3, V_TICK, 1400, 0.05, 0.14, 0);
    AMBS['garage-hum'] = Object.assign(finish(L, 17), {
      drones: [['n', 0, 0.07, 'lowpass', 140, 0],
        ['sine', 119, 0.045, null, 0, 0], ['sine', 121.5, 0.03, null, 0, 0],
        ['sine', 1990, 0.008, null, 0, 0], ['sine', 2007, 0.006, null, 0, 0]],
    });
    L = [];
    note(L, 2.1, V_BIRD, 2600, 0.07, 0.1); note(L, 2.35, V_BIRD, 2300, 0.07, 0.09);
    note(L, 8.8, V_BIRD, 2900, 0.07, 0.1); note(L, 9.05, V_BIRD, 2500, 0.07, 0.1);
    note(L, 9.3, V_BIRD, 2200, 0.08, 0.08); note(L, 14.6, V_BIRD, 2500, 0.07, 0.09);
    note(L, 14.9, V_BIRD, 2700, 0.07, 0.08);
    AMBS['day-room'] = Object.assign(finish(L, 19),
      { drones: [['n', 0, 0.045, 'lowpass', 700, 0]] });
  })();

  // ---------------------------------------------------------------
  // the audio engine
  // ---------------------------------------------------------------
  let ac = null, noiseBuf = null, timer = 0;
  let musicBus, duckG, ambBus, stingBus, preLim, shaper, master, vSend, vOut;
  const ACTIVE = [];               // playing tracks (music + ambience)
  let curMood = null, curTrack = null, curAmb = null, curAmbTrack = null;
  let ducked = false;

  function ensure() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
      // shared noise buffer (2s white)
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // master chain: buses -> soft limiter -> master -> out
      preLim = ac.createGain(); preLim.gain.value = 0.85;
      shaper = ac.createWaveShaper();
      const curve = new Float32Array(1024), K = Math.tanh(1.6);
      for (let i = 0; i < 1024; i++)
        curve[i] = Math.tanh(1.6 * (i / 511.5 - 1)) / K;
      shaper.curve = curve;
      master = ac.createGain(); master.gain.value = MASTER_LVL;
      preLim.connect(shaper); shaper.connect(master); master.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = MUSIC_LVL;
      duckG = ac.createGain(); duckG.gain.value = ducked ? DUCK_LVL : 1;
      musicBus.connect(duckG); duckG.connect(preLim);
      ambBus = ac.createGain(); ambBus.gain.value = AMB_LVL; ambBus.connect(preLim);
      stingBus = ac.createGain(); stingBus.gain.value = STING_LVL; stingBus.connect(preLim);
      // feedback-delay 'reverb': two taps, lowpassed regeneration
      vSend = ac.createGain(); vSend.gain.value = 1;
      vOut = ac.createGain(); vOut.gain.value = 0.4; vOut.connect(preLim);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      const d1 = ac.createDelay(0.5), d2 = ac.createDelay(0.5);
      d1.delayTime.value = 0.181; d2.delayTime.value = 0.273;
      const fb = ac.createGain(); fb.gain.value = 0.42;
      vSend.connect(d1); vSend.connect(d2);
      d1.connect(vOut); d2.connect(vOut);
      d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1);
      timer = setInterval(tick, TICK_MS);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  // equal-power fade to target; robust under rapid re-fades
  const FADE_N = 33;
  function fade(g, target, sec) {
    const t = ac.currentTime;
    g.gain.cancelScheduledValues(t);
    const v0 = g.gain.value;
    try {
      const c = new Float32Array(FADE_N);
      for (let k = 0; k < FADE_N; k++) {
        const x = k / (FADE_N - 1);
        const w = target > v0 ? Math.sin(x * Math.PI / 2) : 1 - Math.cos(x * Math.PI / 2);
        c[k] = v0 + (target - v0) * w;
      }
      g.gain.setValueCurveAtTime(c, t, sec);
    } catch (e) {
      g.gain.setValueAtTime(v0, t);
      g.gain.linearRampToValueAtTime(target, t + sec);
    }
  }

  function startTrack(def, bus) {
    const g = ac.createGain(); g.gain.value = 0; g.connect(bus);
    const tr = {
      events: def.events, loopDur: def.loopDur, idx: 0,
      loopStart: ac.currentTime + 0.05, gain: g, stopAt: 0, drones: null,
    };
    if (def.drones) tr.drones = startDrones(def.drones, g);
    ACTIVE.push(tr);
    fade(g, 1, XFADE);
    return tr;
  }
  function stopTrack(tr, sec) {
    if (!tr || tr.stopAt) return;
    fade(tr.gain, 0, sec);
    tr.stopAt = ac.currentTime + sec + 0.15;
  }
  function startDrones(specs, dest) {
    const nodes = [];
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i], g = ac.createGain(); g.gain.value = s[2]; g.connect(dest);
      let src;
      if (s[0] === 'n') {
        src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      } else {
        src = ac.createOscillator(); src.type = s[0]; src.frequency.value = s[1];
        if (s[5]) src.detune.value = s[5];
      }
      if (s[3]) {
        const f = ac.createBiquadFilter(); f.type = s[3]; f.frequency.value = s[4];
        src.connect(f); f.connect(g);
      } else src.connect(g);
      src.start();
      nodes.push(src);
    }
    return nodes;
  }

  // the lookahead scheduler — hot path: no allocations beyond WebAudio nodes
  function tick() {
    const t = ac.currentTime, horizon = t + LOOKAHEAD;
    for (let i = 0; i < ACTIVE.length; i++) {
      const tr = ACTIVE[i], ev = tr.events, n = ev.length;
      if (tr.stopAt && t > tr.stopAt) {           // reap faded-out track
        if (tr.drones) for (let k = 0; k < tr.drones.length; k++) tr.drones[k].stop();
        tr.gain.disconnect();
        ACTIVE[i] = ACTIVE[ACTIVE.length - 1]; ACTIVE.pop(); i--;
        continue;
      }
      if (!n) continue;
      while (tr.loopStart + ev[tr.idx] < horizon) {
        const j = tr.idx, when = tr.loopStart + ev[j];
        if (when > t - 0.05)
          voice(tr.gain, when, ev[j + 1], ev[j + 2], ev[j + 3], ev[j + 4], ev[j + 5]);
        tr.idx += 6;
        if (tr.idx >= n) { tr.idx = 0; tr.loopStart += tr.loopDur; }
      }
    }
  }

  // ---- synth voices (each call builds throwaway WebAudio nodes) ----
  function out(dest, v, env) {
    env.connect(dest);
    const w = WETV[v];
    if (w > 0.01) {
      const s = ac.createGain(); s.gain.value = w; env.connect(s); s.connect(vSend);
    }
  }
  function mkNoise(when, dur) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.start(when, Math.random() * 1.5); s.stop(when + dur);
    return s;
  }
  function osc(type, f, det) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
    if (det) o.detune.value = det;
    return o;
  }
  function voice(dest, when, v, f, d, vel, aux) {
    const g = ac.createGain();
    switch (v | 0) {
      case V_LEAD: { // pulse lead; aux=1 -> mellow triangle
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
        lp.frequency.value = aux ? 1500 : 2800;
        const o1 = osc(aux ? 'triangle' : 'square', f, 5);
        const o2 = osc(aux ? 'triangle' : 'square', f, -5);
        o1.connect(lp); o2.connect(lp); lp.connect(g);
        const a = vel * (aux ? 0.13 : 0.075);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.012);
        g.gain.setTargetAtTime(a * 0.65, when + 0.012, 0.08);
        g.gain.setTargetAtTime(0, when + d, 0.03);
        out(dest, v, g);
        o1.start(when); o2.start(when);
        o1.stop(when + d + 0.25); o2.stop(when + d + 0.25);
        break;
      }
      case V_BASS: {
        const o = osc('triangle', f, 0); o.connect(g);
        const a = vel * 0.4;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.008);
        g.gain.setTargetAtTime(a * 0.7, when + 0.008, 0.1);
        g.gain.setTargetAtTime(0, when + d, 0.03);
        out(dest, v, g);
        o.start(when); o.stop(when + d + 0.2);
        break;
      }
      case V_PAD: { // detuned saws, slow bloom; aux = detune cents
        const det = aux || 6;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
        const o1 = osc('sawtooth', f, det), o2 = osc('sawtooth', f, -det);
        o1.connect(lp); o2.connect(lp); lp.connect(g);
        const a = vel * 0.06, atk = Math.min(d * 0.4, 1.2);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + atk);
        g.gain.setTargetAtTime(0, when + d - 0.1, 0.25);
        out(dest, v, g);
        o1.start(when); o2.start(when);
        o1.stop(when + d + 1); o2.stop(when + d + 1);
        break;
      }
      case V_BOX: { // music box; aux = detune cents (the garage uses this)
        const o1 = osc('sine', f, aux), o2 = osc('sine', f * 3.02, aux);
        const g2 = ac.createGain(); g2.gain.value = 0.3;
        o1.connect(g); o2.connect(g2); g2.connect(g);
        const a = vel * 0.22;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.004);
        g.gain.setTargetAtTime(0, when + 0.006, Math.min(d * 0.5, 0.9));
        out(dest, v, g);
        o1.start(when); o2.start(when);
        const end = when + Math.min(d + 1.2, 3.2);
        o1.stop(end); o2.stop(end);
        break;
      }
      case V_KICK: {
        const o = osc('sine', 150, 0); o.connect(g);
        o.frequency.setValueAtTime(150, when);
        o.frequency.exponentialRampToValueAtTime(44, when + 0.09);
        const a = vel * 0.85;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.004);
        g.gain.setTargetAtTime(0, when + 0.006, 0.07);
        out(dest, v, g);
        o.start(when); o.stop(when + 0.4);
        break;
      }
      case V_SNARE: { // aux=1 -> brushed (darker, softer)
        const n = mkNoise(when, 0.35);
        const bp = ac.createBiquadFilter();
        bp.type = aux ? 'lowpass' : 'bandpass';
        bp.frequency.value = aux ? 3600 : 1900; bp.Q.value = 0.8;
        n.connect(bp); bp.connect(g);
        const a = vel * (aux ? 0.22 : 0.42);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.003);
        g.gain.setTargetAtTime(0, when + 0.004, aux ? 0.07 : 0.05);
        out(dest, v, g);
        if (!aux) { // tonal body
          const o = osc('sine', 190, 0), gb = ac.createGain();
          o.frequency.setValueAtTime(190, when);
          o.frequency.exponentialRampToValueAtTime(120, when + 0.06);
          gb.gain.setValueAtTime(vel * 0.2, when);
          gb.gain.setTargetAtTime(0, when + 0.004, 0.035);
          o.connect(gb); gb.connect(dest);
          o.start(when); o.stop(when + 0.15);
        }
        break;
      }
      case V_HAT: { // aux=1 -> open
        const n = mkNoise(when, aux ? 0.7 : 0.12);
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6800;
        n.connect(hp); hp.connect(g);
        const a = vel * 0.22;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.002);
        g.gain.setTargetAtTime(0, when + 0.003, aux ? 0.09 : 0.018);
        out(dest, v, g);
        break;
      }
      case V_TICK: { // clock / something tapping; f is the tick pitch
        const o = osc('square', f, 0);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
        o.connect(lp); lp.connect(g);
        const a = vel * 0.11;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.002);
        g.gain.setTargetAtTime(0, when + 0.004, 0.007);
        out(dest, v, g);
        o.start(when); o.stop(when + 0.06);
        break;
      }
      case V_BOOM: { // sub hit; f = start freq
        const o = osc('sine', f, 0); o.connect(g);
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(Math.max(24, f * 0.45), when + 0.5);
        const a = vel * 0.6;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.008);
        g.gain.setTargetAtTime(0, when + 0.02, d * 0.3);
        out(dest, v, g);
        o.start(when); o.stop(when + d + 0.5);
        const n = mkNoise(when, d * 0.6);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 130;
        const gn = ac.createGain();
        gn.gain.setValueAtTime(vel * 0.3, when);
        gn.gain.setTargetAtTime(0, when + 0.01, d * 0.2);
        n.connect(lp); lp.connect(gn); gn.connect(dest);
        break;
      }
      case V_PLUCK: {
        const o = osc('triangle', f, 0);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
        o.connect(lp); lp.connect(g);
        const a = vel * 0.3;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.004);
        g.gain.setTargetAtTime(0, when + 0.006, Math.min(0.3, d * 0.6));
        out(dest, v, g);
        o.start(when); o.stop(when + d + 0.4);
        break;
      }
      case V_BELL: { // inharmonic partial — glassy, a little wrong
        const o1 = osc('sine', f, 0), o2 = osc('sine', f * 2.76, 0);
        const g2 = ac.createGain(); g2.gain.value = 0.35;
        o1.connect(g); o2.connect(g2); g2.connect(g);
        const a = vel * 0.5;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.005);
        g.gain.setTargetAtTime(0, when + 0.007, Math.min(d * 0.4, 0.8));
        out(dest, v, g);
        o1.start(when); o2.start(when); o1.stop(when + d); o2.stop(when + d);
        break;
      }
      case V_SWELL: { // filtered-noise hit/crash
        const n = mkNoise(when, d + 0.3);
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass';
        bp.frequency.value = f; bp.Q.value = 0.7;
        n.connect(bp); bp.connect(g);
        const a = vel * 0.5;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.012);
        g.gain.setTargetAtTime(0, when + 0.02, d * 0.4);
        out(dest, v, g);
        break;
      }
      case V_CHIRP: { // one cricket pulse
        const o = osc('sine', f, 0); o.connect(g);
        const a = vel * 0.12;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.006);
        g.gain.setTargetAtTime(0, when + 0.008, 0.012);
        out(dest, v, g);
        o.start(when); o.stop(when + 0.06);
        break;
      }
      case V_BIRD: { // distant falling chirp
        const o = osc('sine', f, 0); o.connect(g);
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(f * 0.78, when + d);
        const a = vel * 0.15;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.01);
        g.gain.setTargetAtTime(0, when + 0.015, 0.04);
        out(dest, v, g);
        o.start(when); o.stop(when + d + 0.15);
        break;
      }
      case V_CREAK: { // house settle
        const o = osc('triangle', f, 0); o.connect(g);
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(f * 0.72, when + d);
        const a = vel * 0.16;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + d * 0.3);
        g.gain.setTargetAtTime(0, when + d * 0.5, d * 0.4);
        out(dest, v, g);
        o.start(when); o.stop(when + d + 0.5);
        break;
      }
      case V_STAB: { // saw chord tone
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
        const o1 = osc('sawtooth', f, 7), o2 = osc('sawtooth', f, -7);
        o1.connect(lp); o2.connect(lp); lp.connect(g);
        const a = vel * 0.12;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.006);
        g.gain.setTargetAtTime(0, when + 0.01, Math.max(0.08, d * 0.3));
        out(dest, v, g);
        o1.start(when); o2.start(when);
        o1.stop(when + d + 0.4); o2.stop(when + d + 0.4);
        break;
      }
      case V_TOM: {
        if (f < 30) f = 165;         // drum-template toms carry no pitch
        const o = osc('sine', f, 0); o.connect(g);
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, when + 0.22);
        const a = vel * 0.5;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + 0.004);
        g.gain.setTargetAtTime(0, when + 0.006, 0.09);
        out(dest, v, g);
        o.start(when); o.stop(when + 0.5);
        break;
      }
      case V_DRONE: { // long dark pedal; aux = detune cents
        const det = aux || 10;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
        const o1 = osc('sawtooth', f, det), o2 = osc('sawtooth', f, -det);
        o1.connect(lp); o2.connect(lp); lp.connect(g);
        const a = vel * 0.11, atk = Math.min(1.5, d * 0.2);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(a, when + atk);
        g.gain.setTargetAtTime(0, when + d - 0.5, 0.5);
        out(dest, v, g);
        o1.start(when); o2.start(when);
        o1.stop(when + d + 2); o2.stop(when + d + 2);
        break;
      }
    }
  }

  // ---------------------------------------------------------------
  // public API
  // ---------------------------------------------------------------
  window.MUSIC = {
    unlock() { ensure(); },
    play(mood) {
      if (mood === curMood) return;
      const def = MOODS[mood];
      if (!def || !ensure()) return;
      if (curTrack) stopTrack(curTrack, XFADE);
      curMood = mood;
      curTrack = startTrack(def, musicBus);
    },
    stop(fadeSec) {
      if (ac && curTrack) stopTrack(curTrack, fadeSec == null ? 1 : fadeSec);
      curMood = null; curTrack = null;
    },
    sting(name) {
      const s = STINGS[name];
      if (!s || !ensure()) return;
      const t0 = ac.currentTime + 0.02;
      for (let i = 0; i < s.length; i += 6)
        voice(stingBus, t0 + s[i], s[i + 1], s[i + 2], s[i + 3], s[i + 4], s[i + 5]);
    },
    ambience(name) {
      if (name === curAmb) return;
      const def = AMBS[name];
      if (!def || !ensure()) return;
      if (curAmbTrack) stopTrack(curAmbTrack, XFADE);
      curAmb = name;
      curAmbTrack = startTrack(def, ambBus);
    },
    ambienceOff(fadeSec) {
      if (ac && curAmbTrack) stopTrack(curAmbTrack, fadeSec == null ? 1 : fadeSec);
      curAmb = null; curAmbTrack = null;
    },
    duck(on) {
      ducked = !!on;
      if (ac) duckG.gain.setTargetAtTime(ducked ? DUCK_LVL : 1, ac.currentTime, DUCK_SEC);
    },
    get now() { return curMood; },
    _graph() { return ac ? { ctx: ac, master: master, duckG: duckG } : null; }, // debug tap
  };
})();
