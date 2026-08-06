// ===== Input: multi-touch on-screen controls + keyboard fallback =====
const Input = {
  left: false, right: false, crouch: false,
  jumpHeld: false,
  presses: [],            // queued edge-triggered events: 'JUMP','X','Y','B','A'
  consume() { const p = this.presses; this.presses = []; return p; },
};

(function initInput() {
  const holdMap = { btnLeft: 'left', btnRight: 'right', btnCrouch: 'crouch' };
  const pressMap = { btnJump: 'JUMP', btnX: 'X', btnY: 'Y', btnB: 'B', btnA: 'A' };

  function bind(el, onDown, onUp) {
    const active = new Set();
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      if (!active.has(e.pointerId)) { active.add(e.pointerId); el.classList.add('held'); onDown(); }
    });
    const release = (e) => {
      if (active.delete(e.pointerId) && active.size === 0) { el.classList.remove('held'); onUp && onUp(); }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  for (const [id, prop] of Object.entries(holdMap)) {
    const el = document.getElementById(id);
    bind(el, () => { Input[prop] = true; Sfx.unlock(); }, () => { Input[prop] = false; });
  }
  for (const [id, code] of Object.entries(pressMap)) {
    const el = document.getElementById(id);
    bind(el, () => {
      Sfx.unlock();
      if (Input.presses.length < 4) Input.presses.push(code);
      if (code === 'JUMP') Input.jumpHeld = true;
    }, () => { if (code === 'JUMP') Input.jumpHeld = false; });
  }

  // Keyboard (desktop testing): A/D or arrows move, W/space jump, S crouch, J/K/L/I = X/Y/B/A
  const keyHold = {
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    KeyS: 'crouch', ArrowDown: 'crouch',
  };
  const keyPress = { KeyW: 'JUMP', ArrowUp: 'JUMP', Space: 'JUMP', KeyJ: 'X', KeyK: 'Y', KeyL: 'B', KeyI: 'A' };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (keyHold[e.code]) { Input[keyHold[e.code]] = true; e.preventDefault(); }
    if (keyPress[e.code]) {
      Sfx.unlock();
      if (Input.presses.length < 4) Input.presses.push(keyPress[e.code]);
      if (keyPress[e.code] === 'JUMP') Input.jumpHeld = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (keyHold[e.code]) Input[keyHold[e.code]] = false;
    if (keyPress[e.code] === 'JUMP') Input.jumpHeld = false;
  });

  // Block page scrolling/zooming from stray touches
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.screen')) e.preventDefault();
  }, { passive: false });

  // iOS Safari ignores user-scalable=no — block pinch and double-tap zoom
  // explicitly so the arena can never get stuck zoomed-in
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
})();
