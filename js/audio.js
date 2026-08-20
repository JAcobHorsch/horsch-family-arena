// ===== Tiny WebAudio synth for hits, coins, and UI =====
const Sfx = (() => {
  let ac = null;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function blip(freq, dur, type, vol, slide) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  }
  function noise(dur, vol) {
    const a = ctx(); if (!a) return;
    const n = a.sampleRate * dur, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(), g = a.createGain();
    src.buffer = buf;
    g.gain.value = vol || 0.12;
    src.connect(g).connect(a.destination);
    src.start();
  }
  return {
    unlock() { ctx(); },
    hit()      { blip(160, 0.09, 'square', 0.07, -80); noise(0.06, 0.08); },
    heavy()    { blip(90, 0.16, 'sawtooth', 0.1, -50); noise(0.12, 0.14); },
    hurt()     { blip(220, 0.2, 'sawtooth', 0.09, -160); },
    coin()     { blip(880, 0.07, 'square', 0.05); setTimeout(() => blip(1320, 0.1, 'square', 0.05), 60); },
    special()  { blip(300, 0.3, 'sawtooth', 0.1, 500); noise(0.2, 0.1); },
    die()      { blip(140, 0.4, 'sawtooth', 0.1, -110); noise(0.25, 0.12); },
    jump()     { blip(240, 0.12, 'square', 0.04, 220); },
    buy()      { blip(660, 0.08, 'square', 0.06); setTimeout(() => blip(990, 0.14, 'square', 0.06), 70); },
    denied()   { blip(140, 0.15, 'square', 0.06, -40); },
    victory()  { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'square', 0.06), i * 120)); },
    defeat()   { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sawtooth', 0.07), i * 160)); },
    ascend()   { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'square', 0.06), i * 100)); },
    // one short chirp per letter of dialogue, pitched per speaker
    voice(f)   { blip((f || 180) * (0.94 + Math.random() * 0.12), 0.035, 'square', 0.03); },
    step()     { blip(120, 0.045, 'triangle', 0.035, -40); },
    stomp()    { blip(64, 0.1, 'sawtooth', 0.09, -20); noise(0.07, 0.07); },
    door()     { blip(70, 0.22, 'sawtooth', 0.12, -30); noise(0.18, 0.16); },
    creak()    { blip(320, 0.34, 'triangle', 0.05, -120); },
  };
})();
