// ===== Horsch Family Arena — core engine: combat, AI, waves, rendering =====

const Game = (() => {
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');

  // Logical viewport: fixed height, variable width
  const VH = 540;
  const GROUND_Y = 468;
  const STAGE_W = 1750;
  const GRAV = 1950;

  let DPR = 1, scale = 1, viewW = 960;
  function resize() {
    DPR = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    cvs.width = Math.round(w * DPR);
    cvs.height = Math.round(h * DPR);
    scale = h / VH;
    viewW = w / scale;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  // ---------- World state ----------
  let mode = 'idle';        // idle | playing | victory | defeat
  let paused = false;
  let plan = null, theme = themeFor(1);
  let player = null, enemies = [], projectiles = [], coins = [], particles = [], floats = [], minions = [];
  let waveIdx = 0, spawnDelay = 0, endTimer = 0, endFired = false;
  let camX = 0, shakeT = 0, shakeMag = 0, hitstop = 0, timeScale = 1, flashFxT = 0;
  let banner = null; // {text, sub, t}
  let earned = 0, lastCharId = null;
  let ambient = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function setBanner(text, sub, dur) { banner = { text, sub: sub || '', t: dur || 1.6, max: dur || 1.6 }; }
  function addFloat(x, y, txt, color, big) { floats.push({ x: x + rand(-16, 16), y: y + rand(-8, 4), txt, color, t: 1, big: !!big }); }
  function burst(x, y, color, n, spd, grav) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(0.3, 1) * (spd || 260);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rand(0.25, 0.6), max: 0.6, r: rand(2, 5), color, grav: grav !== false });
    }
  }

  // ---------- Level flow ----------
  function startLevel(charId) {
    const cdef = CHARACTERS.find(c => c.id === charId);
    const upg = Save.upg(charId);
    const stats = computeStats(cdef, upg);
    lastCharId = charId;
    plan = levelPlan(Save.data.level);
    theme = themeFor(Save.data.level);

    player = {
      cdef, upg, stats,
      x: 260, y: GROUND_Y, vx: 0, vy: 0, w: 36, h: 96, facing: 1,
      hp: stats.maxHp, energy: 100, onGround: true, crouch: false,
      buffT: 0, buffDmg: 1, buffSpeed: 1,
      attack: null, hurtT: 0, invulnT: 0, walkCyc: 0, animT: 0, flash: 0,
      ascended: upg.ascended, size: upg.ascended ? (cdef.finalForm.sizeMult || 1.12) : 1,
    };
    enemies = []; projectiles = []; coins = []; particles = []; floats = []; minions = [];
    if (upg.ascended && cdef.finalForm.minions) {
      cdef.finalForm.minions.forEach((mid, i) => {
        const mdef = CHARACTERS.find(c => c.id === mid);
        minions.push({
          cdef: mdef, x: player.x - 60 - i * 40, y: GROUND_Y, vx: 0, vy: 0, facing: 1,
          size: 0.55, walkCyc: 0, animT: rand(0, 6), cd: rand(1, 3), strikeT: 0,
          oopsT: rand(6, 12), wanderX: 0, wanderT: 0, onGround: true,
        });
      });
    }
    waveIdx = 0; spawnDelay = 1.2; endTimer = 0; endFired = false;
    camX = clamp(player.x - viewW / 2, 0, Math.max(0, STAGE_W - viewW));
    earned = 0; mode = 'playing'; paused = false; timeScale = 1; hitstop = 0;
    ambient = [];
    Input.consume(); // discard anything buffered on menu screens
    setBanner('LEVEL ' + plan.level, plan.boss ? 'THE WARLORD AWAITS' : plan.waves.length + ' WAVES', 2.0);
  }

  function spawnWave() {
    const list = plan.waves[waveIdx];
    let side = player.x > STAGE_W / 2 ? -1 : 1;
    for (let i = 0; i < list.length; i++) {
      const t = ENEMY_TYPES[list[i]];
      const dir = (i % 2 === 0) ? side : -side;
      const x = clamp(player.x + dir * (viewW / 2 + rand(60, 220)), 50, STAGE_W - 50);
      const e = {
        type: list[i], def: t,
        x, y: GROUND_Y, vx: 0, vy: 0, facing: -dir,
        w: 34 * t.size, h: 92 * t.size, size: t.size,
        hp: t.hp * plan.hpMult, maxHp: t.hp * plan.hpMult,
        dmg: t.dmg * plan.dmgMult, speed: t.speed * plan.speedMult,
        state: 'approach', stateT: 0, cd: rand(0.3, 1.2), pref: t.reach * rand(0.78, 0.92),
        hurtT: 0, frozenT: 0, flash: 0, walkCyc: 0, animT: rand(0, 6),
        shockT: t.boss ? 4 : 0, onGround: true,
      };
      enemies.push(e);
      burst(e.x, e.y - e.h / 2, theme.glow, 12, 200, false);
    }
    setBanner('WAVE ' + (waveIdx + 1) + ' / ' + plan.waves.length, plan.boss && waveIdx === plan.waves.length - 1 ? 'WARLORD INCOMING' : '', 1.3);
    waveIdx++;
  }

  function winLevel() {
    mode = 'victory'; timeScale = 0.55; endTimer = 2.0; endFired = false;
    setBanner('VICTORY', '+$' + earned + ' earned', 2.0);
    Sfx.victory();
    for (const c of coins) c.magnet = true; // vacuum the rest
  }
  function loseLevel() {
    mode = 'defeat'; timeScale = 0.4; endTimer = 1.6; endFired = false;
    setBanner('DEFEATED', '', 1.6);
    Sfx.die();
    burst(player.x, player.y - 50, player.cdef.color, 30, 380);
  }

  // ---------- Combat helpers ----------
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function entRect(e) { return [e.x - e.w / 2, e.y - e.h * (e === player && e.crouch ? 0.62 : 1), e.w, e.h * (e === player && e.crouch ? 0.62 : 1)]; }

  function hitEnemy(e, dmg, kbx, kby, heavy) {
    e.hp -= dmg;
    e.flash = 1;
    e.vx += kbx; e.vy += kby || 0;
    if (kby < -100) e.onGround = false;
    e.hurtT = Math.max(e.hurtT, heavy ? 0.4 : 0.22);
    if (e.state === 'windup') { e.state = 'approach'; e.cd = 0.5; }
    addFloat(e.x, e.y - e.h - 14, Math.round(dmg), '#ffd977');
    burst(e.x, e.y - e.h * 0.55, '#ffcf7a', heavy ? 10 : 5, heavy ? 320 : 200);
    player.energy = Math.min(100, player.energy + 6);
    hitstop = Math.max(hitstop, heavy ? 0.07 : 0.035);
    shakeT = Math.max(shakeT, heavy ? 0.22 : 0.1); shakeMag = heavy ? 7 : 3;
    heavy ? Sfx.heavy() : Sfx.hit();
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    const v = Math.max(2, Math.round(e.def.value * plan.valueMult));
    const n = e.def.boss ? 8 : 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      coins.push({
        x: e.x, y: e.y - e.h * 0.5, v: Math.max(1, Math.round(v / n)),
        vx: rand(-180, 180), vy: rand(-420, -220), t: 0, magnet: false,
      });
    }
    burst(e.x, e.y - e.h * 0.5, e.def.color, e.def.boss ? 40 : 16, e.def.boss ? 420 : 280);
    Sfx.die();
    enemies.splice(enemies.indexOf(e), 1);
  }

  function damagePlayer(dmg, fromX) {
    if (player.invulnT > 0 || mode !== 'playing') return;
    let d = dmg * player.stats.defense;
    if (player.crouch) d *= 0.5;
    d = Math.max(1, Math.round(d));
    player.hp -= d;
    player.flash = 1; player.hurtT = 0.3; player.invulnT = 0.9;
    player.vx += (player.x >= fromX ? 1 : -1) * 220;
    addFloat(player.x, player.y - player.h - 16, '-' + d, '#ff6a5a');
    shakeT = 0.25; shakeMag = 6;
    Sfx.hurt();
    if (player.hp <= 0) { player.hp = 0; loseLevel(); }
  }

  // ---------- Specials (data-driven — see the special move library in data.js) ----------
  function fireSpecial() {
    const p = player, st = p.stats, def = p.cdef.special;
    if (p.energy < st.energyCost) { addFloat(p.x, p.y - p.h - 18, 'NO ENERGY', '#7fb8ff'); Sfx.denied(); return; }
    p.energy -= st.energyCost;
    Sfx.special();
    const asc = p.ascended;
    const S = st.specialMult;
    const size = asc ? 1.45 : 1;
    const col = def.color || p.cdef.color;
    switch (def.type) {
      case 'projectile': {
        const n = def.count || 1;
        const dirs = def.both ? [-1, 1] : [p.facing];
        const spd = (def.speed || 560) * (def.scaleSpeed ? 1 + 0.08 * p.upg.ability : 1);
        for (const dir of dirs) {
          for (let i = 0; i < n; i++) {
            projectiles.push({
              type: 'fire', hostile: false, x: p.x + dir * 30, y: p.y - (def.arc ? 78 : 55) - i * 16,
              vx: dir * spd, vy: def.arc ? 250 : (def.spreadY ? (i - (n - 1) / 2) * def.spreadY : 0),
              dmg: (def.dmg || 22) * S, r: (def.r || 13) * size, life: def.life || 1.5,
              pierce: def.pierce !== false, shape: def.shape, bounty: def.bounty, bounce: def.bounce, flap: def.flap,
              boomerang: def.boomerang, dir, color: col,
            });
          }
        }
        if (def.boomerang) addFloat(p.x, p.y - p.h - 30, 'WHEEE!', p.cdef.accent, true);
        break;
      }
      case 'nova': {
        const R = (def.radius || 175) * size;
        burst(p.x, p.y - 45, col, 34, 420, false);
        for (const e of [...enemies]) {
          if (Math.abs(e.x - p.x) < R + e.w / 2) {
            if (def.freeze) e.frozenT = def.freeze * (asc ? 1.6 : 1);
            hitEnemy(e, (def.dmg || 18) * S, (e.x >= p.x ? 1 : -1) * (def.kb || 120), -80, true);
          }
        }
        shakeT = 0.3; shakeMag = 8;
        break;
      }
      case 'dash': {
        const dx = (def.dist || 290) * (asc ? 1.35 : 1) * p.facing;
        const x0 = Math.min(p.x, p.x + dx), x1 = Math.max(p.x, p.x + dx);
        for (let i = 0; i < 16; i++) particles.push({ x: x0 + (x1 - x0) * (i / 15), y: p.y - rand(20, 80), vx: 0, vy: rand(-60, 60), life: 0.35, max: 0.35, r: rand(2, 5), color: p.cdef.accent, grav: false });
        for (const e of [...enemies]) {
          if (e.x + e.w / 2 > x0 - 20 && e.x - e.w / 2 < x1 + 20) hitEnemy(e, (def.dmg || 22) * S, p.facing * 260, -180, true);
        }
        p.x = clamp(p.x + dx, 40, STAGE_W - 40);
        p.invulnT = Math.max(p.invulnT, 0.35);
        shakeT = 0.2; shakeMag = 6;
        break;
      }
      case 'buff': {
        p.buffT = (def.dur || 6) * (asc ? 1.5 : 1);
        p.buffDmg = def.dmgMult || 1.5;
        p.buffSpeed = def.speedMult || 1.25;
        burst(p.x, p.y - 50, col, 24, 300, false);
        addFloat(p.x, p.y - p.h - 18, def.name.toUpperCase() + '!', p.cdef.accent, true);
        break;
      }
      case 'rain': {
        const n = def.count || 5;
        for (let i = 0; i < n; i++) {
          projectiles.push({
            type: 'meteor', hostile: false, x: p.x + p.facing * (70 + i * 60) + rand(-18, 18), y: -30 - i * 50,
            vx: p.facing * 40, vy: 540, dmg: (def.dmg || 16) * S, r: (def.r || 11) * size, life: 3, pierce: false, color: col,
          });
        }
        break;
      }
      case 'wave': {
        const dirs = def.both ? [-1, 1] : [p.facing];
        for (const d of dirs) {
          projectiles.push({ type: 'pwave', hostile: false, x: p.x + d * 30, y: GROUND_Y, vx: d * (def.speed || 340), vy: 0, dmg: (def.dmg || 20) * S, r: 18, life: 1.8, pierce: true, color: col });
        }
        shakeT = 0.2; shakeMag = 5;
        break;
      }
      case 'flash': {
        flashFxT = 0.35;
        const range = (def.range || 420) * (asc ? 1.4 : 1);
        for (const e of [...enemies]) {
          const dx = e.x - p.x;
          if (p.facing > 0 ? (dx > -40 && dx < range) : (dx < 40 && dx > -range)) {
            if (def.stun) e.hurtT = Math.max(e.hurtT, def.stun * (asc ? 1.5 : 1));
            hitEnemy(e, (def.dmg || 16) * S, Math.sign(dx || p.facing) * 100, -60, true);
          }
        }
        shakeT = 0.15; shakeMag = 4;
        break;
      }
      case 'heal': {
        const amt = Math.round(p.stats.maxHp * (def.pct || 0.25) * (asc ? 1.5 : 1));
        p.hp = Math.min(p.stats.maxHp, p.hp + amt);
        addFloat(p.x, p.y - p.h - 18, '+' + amt + ' HP', '#7fd98a', true);
        burst(p.x, p.y - 50, '#7fd98a', 20, 240, false);
        break;
      }
    }
    // burn a bit of anim time so the special reads as a move
    p.attack = { key: 'A', su: 0.06, ac: 0.1, rec: 0.18, t: 0, hits: new Set(), def: null };
  }

  // ---------- Player update ----------
  function updatePlayer(dt) {
    const p = player, st = p.stats;
    p.animT += dt;
    if (p.flash > 0) p.flash -= dt * 5;
    if (p.invulnT > 0) p.invulnT -= dt;
    if (p.hurtT > 0) { p.hurtT -= dt; }
    if (p.buffT > 0) p.buffT -= dt;
    p.energy = Math.min(100, p.energy + 11 * dt);

    const busy = p.hurtT > 0 || mode !== 'playing';
    const attacking = !!p.attack;

    // presses — buffered during hit-stagger rather than dropped
    if (mode !== 'playing') {
      Input.consume();
    } else if (p.hurtT <= 0) {
      for (const code of Input.consume()) {
        if (code === 'JUMP' && p.onGround && !p.crouch) { p.vy = -760; p.onGround = false; Sfx.jump(); }
        else if (code === 'A' && !attacking) fireSpecial();
        else if ((code === 'X' || code === 'Y' || code === 'B') && !attacking) {
          const def = ATTACKS[code];
          const sp = p.cdef.atkSpeed;
          p.attack = { key: code, def, su: def.startup * sp, ac: def.active * sp, rec: def.recovery * sp, t: 0, hits: new Set() };
        }
      }
    }

    // movement
    p.crouch = Input.crouch && p.onGround && !attacking;
    const canMove = !busy && !p.crouch && !(attacking && p.onGround);
    let mx = 0;
    if (canMove) {
      if (Input.left) mx -= 1;
      if (Input.right) mx += 1;
      if (mx !== 0) p.facing = mx;
    }
    const targetVx = mx * st.speed * (p.buffT > 0 ? p.buffSpeed : 1);
    p.vx += (targetVx - p.vx) * Math.min(1, dt * 12);
    if (mx !== 0 && p.onGround) p.walkCyc += dt * st.speed * 0.045;

    // physics
    p.vy += GRAV * dt;
    p.x = clamp(p.x + p.vx * dt, 40, STAGE_W - 40);
    p.y += p.vy * dt;
    if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.onGround = true; } else p.onGround = false;

    // attack progression + hit detection
    if (p.attack) {
      const a = p.attack;
      a.t += dt;
      if (a.def && a.t >= a.su && a.t < a.su + a.ac) {
        const d = a.def;
        for (const e of [...enemies]) {
          if (a.hits.has(e)) continue;
          let hit = false;
          const [ex, ey, ew, eh] = entRect(e);
          if (d.radius) {
            hit = Math.abs(e.x - p.x) < d.radius && e.y - e.h < p.y + 10;
          } else {
            const hx = p.facing > 0 ? p.x : p.x - d.range;
            hit = overlap(hx, p.y - p.h, d.range, p.h, ex, ey, ew, eh);
          }
          if (hit) {
            a.hits.add(e);
            const dir = d.radius ? (e.x >= p.x ? 1 : -1) : p.facing;
            hitEnemy(e, d.dmg * st.dmg * (p.buffT > 0 ? p.buffDmg : 1), dir * d.kb, d.kbY, a.key !== 'X');
          }
        }
      }
      if (a.t >= a.su + a.ac + a.rec) p.attack = null;
    }
  }

  // ---------- Enemy update ----------
  function updateEnemy(e, dt) {
    e.animT += dt;
    if (e.flash > 0) e.flash -= dt * 5;

    // knockback physics always applies
    e.vy += GRAV * dt;
    e.y += e.vy * dt;
    if (e.y >= GROUND_Y) { e.y = GROUND_Y; e.vy = 0; e.onGround = true; }
    e.vx *= Math.pow(0.0015, dt); // friction on knockback impulse
    e.x = clamp(e.x + e.vx * dt, 40, STAGE_W - 40);

    if (e.frozenT > 0) { e.frozenT -= dt; return; }
    if (e.hurtT > 0) { e.hurtT -= dt; return; }
    if (mode !== 'playing') return;

    const dx = player.x - e.x;
    const dist = Math.abs(dx);
    e.facing = dx >= 0 ? 1 : -1;
    e.cd -= dt;

    if (e.def.boss) {
      e.shockT -= dt;
      if (e.shockT <= 0 && e.state === 'approach') {
        e.shockT = 5.5;
        e.state = 'windup'; e.stateT = e.def.windup * 1.2; e.shockNext = true;
      }
    }

    switch (e.state) {
      case 'approach': {
        let move = 0;
        if (e.def.ranged) {
          if (dist < 230) move = -Math.sign(dx);
          else if (dist > e.def.reach) move = Math.sign(dx);
        } else if (dist > e.pref) move = Math.sign(dx);
        // separation from other grounded enemies
        for (const o of enemies) {
          if (o === e) continue;
          const sep = e.x - o.x;
          if (Math.abs(sep) < 38 && Math.abs(e.y - o.y) < 10) e.x += (sep === 0 ? (Math.random() - 0.5) : Math.sign(sep)) * 40 * dt;
        }
        if (move !== 0) { e.x = clamp(e.x + move * e.speed * dt, 40, STAGE_W - 40); e.walkCyc += dt * e.speed * 0.05; }
        const inRange = e.def.ranged ? (dist <= e.def.reach && dist >= 150) : dist <= e.def.reach;
        if (inRange && e.cd <= 0) { e.state = 'windup'; e.stateT = e.def.windup; }
        break;
      }
      case 'windup': {
        e.stateT -= dt;
        if (e.stateT <= 0) { e.state = 'strike'; e.stateT = 0.16; doStrike(e); }
        break;
      }
      case 'strike': {
        e.stateT -= dt;
        if (e.stateT <= 0) { e.state = 'approach'; e.cd = e.def.cooldown; }
        break;
      }
    }
  }

  function doStrike(e) {
    if (e.shockNext) {
      e.shockNext = false;
      for (const dir of [-1, 1]) {
        projectiles.push({ type: 'wave', hostile: true, x: e.x + dir * 40, y: GROUND_Y, vx: dir * 300, vy: 0, dmg: e.dmg * 0.8, r: 16, life: 2.0, color: theme.glow });
      }
      shakeT = 0.3; shakeMag = 8; Sfx.heavy();
      return;
    }
    if (e.def.ranged) {
      const dir = Math.sign(player.x - e.x) || 1;
      projectiles.push({ type: 'bolt', hostile: true, x: e.x + dir * 24, y: e.y - 70, vx: dir * 360, vy: 0, dmg: e.dmg, r: 6, life: 2.4, color: '#c89aff' });
      Sfx.hit();
    } else {
      const dxp = Math.abs(player.x - e.x);
      if (dxp <= e.def.reach + 24 && player.y > e.y - e.h - 40) damagePlayer(e.dmg, e.x);
    }
  }

  // ---------- Minions (Babysitter Jordan's nieces & nephews) ----------
  const OOPS_LINES = ['OOPS!', 'SORRY UNCLE JORDAN!', 'MY BAD!', 'I MEANT TO DO THAT', 'FRIENDLY FIRE!', 'WAS THAT YOU?'];
  function updateMinion(m, dt) {
    m.animT += dt;
    if (m.strikeT > 0) m.strikeT -= dt;
    m.vy += GRAV * dt;
    m.y += m.vy * dt;
    if (m.y >= GROUND_Y) { m.y = GROUND_Y; m.vy = 0; m.onGround = true; } else m.onGround = false;
    if (mode !== 'playing') return;
    m.cd -= dt;
    m.wanderT -= dt;
    if (m.wanderT <= 0) {
      m.wanderT = rand(1.5, 3.5);
      m.wanderX = rand(-70, 70);
      if (Math.random() < 0.18 && m.onGround) m.vy = -420; // kids gonna hop
    }
    let target = null, best = 1e9;
    for (const e of enemies) { const d = Math.abs(e.x - m.x); if (d < best) { best = d; target = e; } }
    const anchor = target ? target.x + m.wanderX * 0.4 : player.x + m.wanderX;
    const dx = anchor - m.x;
    if (Math.abs(dx) > 30) {
      m.facing = Math.sign(dx);
      m.x = clamp(m.x + Math.sign(dx) * 240 * dt, 40, STAGE_W - 40);
      m.walkCyc += dt * 11;
    } else if (target) m.facing = Math.sign(target.x - m.x) || 1;
    if (target && best < 70 && m.cd <= 0) {
      m.cd = rand(1.2, 2.4);
      m.strikeT = 0.22;
      hitEnemy(target, 8 * player.stats.dmg, m.facing * 140, -100, false);
    }
    // the babysitting tax: sometimes they kick the wrong guy
    m.oopsT -= dt;
    if (m.oopsT <= 0) {
      m.oopsT = rand(6, 13);
      if (Math.abs(m.x - player.x) < 130 && player.hp > 1) {
        player.hp = Math.max(1, player.hp - 3);
        player.flash = 0.6;
        addFloat(player.x, player.y - player.h - 16, '-3', '#ff6a5a');
        addFloat(m.x, m.y - 62, OOPS_LINES[Math.floor(Math.random() * OOPS_LINES.length)], m.cdef.accent, true);
        Sfx.hurt();
      }
    }
  }

  // ---------- Projectiles / coins / fx ----------
  function updateProjectiles(dt) {
    for (const pr of [...projectiles]) {
      if (pr.bounce) pr.vy += 1500 * dt;
      if (pr.flap) {
        pr.vy += 1100 * dt;
        pr.flapT = (pr.flapT || 0) - dt;
        if (pr.flapT <= 0) { pr.flapT = 0.35; pr.vy = -195; }
        if (pr.y < GROUND_Y - 115) pr.vy = Math.max(pr.vy, -40); // stay at kicking height
      }
      if (pr.boomerang && player) {
        pr.vx -= pr.dir * 320 * dt;
        if (!pr.returning && Math.sign(pr.vx) === -pr.dir) {
          pr.returning = true;
          if (pr.hits) pr.hits.clear(); // second pass hits everyone again
        }
        if (pr.returning) {
          pr.vx = clamp(pr.vx, -640, 640);
          const dy = (player.y - 55) - pr.y;
          pr.vy = clamp(dy * 4, -320, 320);
          if (Math.abs(pr.x - player.x) < 44 && Math.abs(dy) < 60) {
            burst(pr.x, pr.y, pr.color, 6, 160, false);
            projectiles.splice(projectiles.indexOf(pr), 1); continue;
          }
        }
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || pr.x < -60 || pr.x > STAGE_W + 60) { projectiles.splice(projectiles.indexOf(pr), 1); continue; }
      if (!pr.hostile && pr.vy > 0 && pr.y >= GROUND_Y) {
        if (pr.bounce || pr.flap) {
          pr.y = GROUND_Y;
          pr.vy = pr.flap ? -280 : -Math.max(Math.abs(pr.vy) * 0.8, 320);
          burst(pr.x, GROUND_Y - 4, pr.color, 4, 160, false);
        } else {
          burst(pr.x, GROUND_Y - 6, pr.color, 10, 220);
          projectiles.splice(projectiles.indexOf(pr), 1); continue;
        }
      }
      if (Math.random() < 0.5) particles.push({ x: pr.x, y: pr.y + rand(-4, 4), vx: -pr.vx * 0.15, vy: rand(-30, 30), life: 0.25, max: 0.25, r: rand(1.5, 3.5), color: pr.color, grav: false });
      if (pr.hostile) {
        const [px, py, pw, ph] = entRect(player);
        const top = pr.type === 'wave' ? pr.y - 34 : pr.y - pr.r;
        const h = pr.type === 'wave' ? 34 : pr.r * 2;
        if (mode === 'playing' && overlap(pr.x - pr.r, top, pr.r * 2, h, px, py, pw, ph)) {
          damagePlayer(pr.dmg, pr.x - pr.vx);
          projectiles.splice(projectiles.indexOf(pr), 1);
        }
      } else {
        for (const e of [...enemies]) {
          if (pr.hits && pr.hits.has(e)) continue;
          const [ex, ey, ew, eh] = entRect(e);
          if (overlap(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2, ex, ey, ew, eh)) {
            (pr.hits = pr.hits || new Set()).add(e);
            hitEnemy(e, pr.dmg, Math.sign(pr.vx) * 200, -120, true);
            if (pr.bounty) {
              const b = Math.max(1, Math.round(pr.bounty * plan.valueMult));
              Save.data.money += b; earned += b;
              addFloat(e.x, e.y - e.h - 30, '+$' + b + ' LATE FEE', '#ffd977');
              Sfx.coin();
            }
            if (!pr.pierce) { projectiles.splice(projectiles.indexOf(pr), 1); break; }
          }
        }
      }
    }
  }

  function updateCoins(dt) {
    for (const c of [...coins]) {
      c.t += dt;
      const dx = player.x - c.x, dy = (player.y - 40) - c.y;
      const dist = Math.hypot(dx, dy);
      if (c.magnet || (c.t > 0.35 && dist < 140)) {
        c.vx += (dx / (dist || 1)) * 2600 * dt;
        c.vy += (dy / (dist || 1)) * 2600 * dt;
        c.vx *= 0.92; c.vy *= 0.92;
      } else {
        c.vy += GRAV * 0.8 * dt;
      }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y > GROUND_Y - 6 && !c.magnet) { c.y = GROUND_Y - 6; c.vy *= -0.45; c.vx *= 0.8; }
      if (dist < 42) {
        Save.data.money += c.v; earned += c.v;
        addFloat(player.x, player.y - player.h - 10, '+$' + c.v, '#ffd977');
        Sfx.coin();
        coins.splice(coins.indexOf(c), 1);
      }
    }
  }

  function updateFx(dt) {
    for (const p of [...particles]) {
      p.life -= dt;
      if (p.life <= 0) { particles.splice(particles.indexOf(p), 1); continue; }
      if (p.grav) p.vy += GRAV * 0.5 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (const f of [...floats]) {
      f.t -= dt; f.y -= 46 * dt;
      if (f.t <= 0) floats.splice(floats.indexOf(f), 1);
    }
    // ambient embers
    if (ambient.length < 40 && Math.random() < 0.3) {
      ambient.push({ x: camX + Math.random() * viewW, y: VH + 10, vy: -rand(18, 60), drift: rand(-14, 14), r: rand(1, 2.6), a: rand(0.15, 0.5) });
    }
    for (const a of [...ambient]) {
      a.y += a.vy * dt; a.x += a.drift * dt;
      if (a.y < -10) ambient.splice(ambient.indexOf(a), 1);
    }
  }

  // ---------- Main update ----------
  function update(dt) {
    if (mode === 'idle') { updateFx(dt); return; }

    updatePlayer(dt);
    for (const e of [...enemies]) updateEnemy(e, dt);
    for (const m of minions) updateMinion(m, dt);
    updateProjectiles(dt);
    updateCoins(dt);
    updateFx(dt);

    // waves
    if (mode === 'playing' && enemies.length === 0) {
      if (waveIdx < plan.waves.length) {
        spawnDelay -= dt;
        if (spawnDelay <= 0) { spawnWave(); spawnDelay = 1.0; }
      } else {
        winLevel();
      }
    }

    // end-of-level handoff
    if (mode === 'victory' || mode === 'defeat') {
      endTimer -= dt;
      if (endTimer <= 0 && !endFired) {
        endFired = true;
        timeScale = 1;
        if (mode === 'victory') {
          Save.data.level += 1;
          Save.write();
          mode = 'idle';
          UI.toShop('LEVEL ' + plan.level + ' CLEARED  —  +$' + earned + ' earned this run', lastCharId);
        } else {
          Save.write();
          mode = 'idle';
          UI.toDefeat('You fell on Level ' + plan.level + ', wave ' + waveIdx + ' of ' + plan.waves.length +
            '. You keep the $' + earned + ' you earned — buy upgrades and come back stronger.');
        }
      }
    }

    // camera
    const target = clamp(player.x - viewW / 2, 0, Math.max(0, STAGE_W - viewW));
    camX += (target - camX) * Math.min(1, dt * 6);
    if (STAGE_W < viewW) camX = (STAGE_W - viewW) / 2;
    if (shakeT > 0) shakeT -= dt;
    if (flashFxT > 0) flashFxT -= dt;
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  }

  // ---------- Drawing ----------
  function seeded(n) { let s = n * 2654435761 % 2 ** 32; return () => { s = (s * 1597334677) % 2 ** 32; return (s >>> 8) / 2 ** 24; }; }

  function drawBackground() {
    const g = ctx;
    const sky = g.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, theme.sky1); sky.addColorStop(1, theme.sky2);
    g.fillStyle = sky; g.fillRect(camX, 0, viewW, VH);

    // glow moon
    const mx = camX + viewW * 0.72, my = 120;
    const mg = g.createRadialGradient(mx, my, 6, mx, my, 130);
    mg.addColorStop(0, theme.glow + 'cc'); mg.addColorStop(0.25, theme.glow + '44'); mg.addColorStop(1, 'transparent');
    g.fillStyle = mg; g.fillRect(mx - 140, my - 140, 280, 280);
    g.fillStyle = theme.glow; g.beginPath(); g.arc(mx, my, 34, 0, 7); g.fill();

    // far ridge (parallax 0.25)
    const r1 = seeded(plan ? plan.level : 1);
    g.fillStyle = theme.far;
    g.beginPath();
    g.moveTo(camX, VH);
    for (let i = 0; i <= 14; i++) {
      const wx = (i / 14) * (STAGE_W + viewW) - camX * 0.25;
      g.lineTo(camX + ((wx % (viewW + 400)) + viewW + 400) % (viewW + 400) - 200, 300 - r1() * 160);
    }
    g.lineTo(camX + viewW, VH); g.closePath(); g.fill();

    // near pillars (parallax 0.55) — ruined temple columns
    g.fillStyle = theme.near;
    const r2 = seeded((plan ? plan.level : 1) + 77);
    for (let i = 0; i < 10; i++) {
      const px = i * 300 + r2() * 120 - camX * 0.55;
      const sx = ((px % (viewW + 300)) + viewW + 300) % (viewW + 300) - 150 + camX;
      const h = 150 + r2() * 130, w = 26 + r2() * 22;
      g.fillRect(sx, GROUND_Y - h, w, h);
      g.fillRect(sx - 6, GROUND_Y - h - 12, w + 12, 14);
    }

    // ground
    g.fillStyle = theme.ground; g.fillRect(camX, GROUND_Y, viewW, VH - GROUND_Y);
    g.fillStyle = theme.groundTop; g.fillRect(camX, GROUND_Y, viewW, 5);
    // stage edge glow markers
    g.fillStyle = theme.glow + '55';
    g.fillRect(30, GROUND_Y - 60, 6, 60); g.fillRect(STAGE_W - 36, GROUND_Y - 60, 6, 60);

    // ambient embers
    for (const a of ambient) {
      g.globalAlpha = a.a; g.fillStyle = theme.glow;
      g.beginPath(); g.arc(a.x, a.y, a.r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }

  const WEAPON_COLORS = ['#c9ccd8', '#e6ebf5', '#7fb8ff', '#c47fff', '#ff7f4a'];

  function drawFighter(g, o) {
    // o: x,y feet in world coords; palette + pose fields
    const cf = o.crouch ? 0.6 : 1;
    const look = (o.ascended && o.look) || {};
    const lift = look.float ? 7 + 2 * Math.sin((o.animT || 0) * 3) : 0;
    g.save();
    g.translate(o.x, o.y);

    // shadow (stays on the ground even when floating)
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath(); g.ellipse(0, 2, (22 - lift * 0.4) * o.size, 5, 0, 0, 7); g.fill();

    g.translate(0, -lift * o.size);

    if (o.ascended) {
      const t = o.animT || 0;
      const ac = look.auraColor;
      const ag = g.createRadialGradient(0, -48 * o.size, 8, 0, -48 * o.size, 66 * o.size);
      ag.addColorStop(0, ac ? ac + '80' : 'rgba(255,214,199,0.5)');
      ag.addColorStop(0.6, ac ? ac + '38' : 'rgba(243,163,75,0.22)');
      ag.addColorStop(1, 'transparent');
      g.fillStyle = ag;
      g.beginPath(); g.arc(0, -48 * o.size, 66 * o.size * (1 + 0.05 * Math.sin(t * 6)), 0, 7); g.fill();
    }

    g.scale(o.facing * o.size, o.size);

    let hip = [0, -40 * cf], sh = [2, -64 * cf];
    const headY = -78 * cf;
    let backFoot = [-9, 0], frontFoot = [9, 0];
    let backHand = [-6, -48 * cf], frontHand = [15, -52 * cf]; // guard stance
    let lean = 0;

    const w = o.walkCyc || 0;
    if (o.moving) {
      frontFoot = [8 + Math.sin(w) * 11, -Math.max(0, Math.sin(w)) * 5];
      backFoot = [-8 - Math.sin(w) * 11, -Math.max(0, -Math.sin(w)) * 5];
      backHand = [-8 - Math.sin(w) * 5, -46 * cf];
      frontHand = [13 + Math.sin(w) * 5, -50 * cf];
    }
    if (!o.onGround) { backFoot = [-7, -12]; frontFoot = [11, -7]; }
    if (o.crouch) { backFoot = [-13, 0]; frontFoot = [13, 0]; }

    const ext = o.attackExt || 0; // 0..1 pose extension
    if (o.attackKey === 'X' || o.attackKey === 'A') {
      frontHand = [14 + 26 * ext, (-56 + 4 * ext) * cf];
      lean = 3 * ext;
    } else if (o.attackKey === 'Y') {
      frontFoot = [10 + 34 * ext, -40 * ext * cf];
      lean = -5 * ext;
      backHand = [-10 - 6 * ext, -50 * cf];
    } else if (o.attackKey === 'B') {
      frontHand = [12, -50 - 34 * ext];
      backHand = [4, -46 - 22 * ext];
      lean = -2 * ext;
    } else if (o.attackKey === 'windup') {
      frontHand = [-4, -66]; backHand = [-12, -60]; lean = -6;
    } else if (o.attackKey === 'strike') {
      frontHand = [36, -54]; lean = 4;
    }
    if (o.hurt) { lean = -8; frontHand = [18, -40]; backHand = [-16, -52]; }
    if (look.printer || look.wrench || look.sandwich) {
      // machine proportions: stubby legs under the base, gripper arms out the sides
      hip = [0, -13]; sh = [0, -56];
      backHand = [-21, -46]; frontHand = [21, -46];
      const pExt = o.attackExt || 0;
      if (o.attackKey === 'X' || o.attackKey === 'A') frontHand = [22 + 24 * pExt, -48];
      else if (o.attackKey === 'B') { frontHand = [16, -60 - 26 * pExt]; backHand = [-16, -60 - 26 * pExt]; }
    } else if (look.chicken) {
      hip = [0, -24]; // drumstick legs under the body
    }
    const legCol = look.chicken ? '#e8a020' : o.color;
    const legCol2 = look.chicken ? '#b87a10' : o.color2;

    g.lineCap = 'round'; g.lineJoin = 'round';
    const limb = (from, to, width, color) => {
      g.strokeStyle = color; g.lineWidth = width;
      g.beginPath(); g.moveTo(from[0], from[1]); g.lineTo(to[0], to[1]); g.stroke();
    };

    // final-form look overrides (bald / beard / shirtless / muscle)
    const muscleW = look.muscle || 1;
    const armW = 6 * (1 + (muscleW - 1) * 0.7);
    const torsoCol = look.shirtless ? o.skin : o.color;
    const backArmCol = look.shirtless ? hexMix(o.skin, '#000000', 0.3) : o.color2;
    const frontArmCol = look.shirtless ? o.skin : o.color;

    // back limbs
    limb([hip[0] + lean * 0.3, hip[1]], backFoot, 7.5, legCol2);
    if (!look.chicken) limb([sh[0] + lean * 0.5, sh[1]], backHand, armW, backArmCol);
    if (look.printer) {
      // he IS the machine: gantry frame body
      g.strokeStyle = '#3a3f4a'; g.lineWidth = 5; g.lineJoin = 'miter';
      g.beginPath();
      g.moveTo(-15, -14); g.lineTo(-15, -72); g.lineTo(15, -72); g.lineTo(15, -14);
      g.stroke();
      g.lineJoin = 'round';
      // base + bed
      g.fillStyle = '#2a2e38'; g.fillRect(-18, -16, 36, 8);
      g.fillStyle = o.color; g.fillRect(-18, -16, 36, 2);
      g.fillStyle = '#4a5060'; g.fillRect(-11, -26, 22, 3);
      // half-printed mini-Jerod on the bed
      g.strokeStyle = o.color; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -36); g.stroke();
      g.beginPath(); g.arc(0, -39, 3, 0, 7); g.stroke();
      // extruder carriage sweeping the top rail + nozzle beam
      const ecx = Math.sin((o.animT || 0) * 2.5) * 9;
      g.fillStyle = o.accent;
      g.fillRect(ecx - 4, -78, 8, 8);
      g.globalAlpha = 0.55;
      g.strokeStyle = o.accent; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(ecx, -70); g.lineTo(ecx, -28); g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(ecx, -29, 1.8, 0, 7); g.fill();
    } else if (look.wrench) {
      // WRENCHY: giant anthropomorphic golden pipe wrench
      const gold = '#ffd24a', goldDark = '#b8922a';
      g.shadowColor = gold; g.shadowBlur = 10;
      g.strokeStyle = gold; g.lineWidth = 14;
      g.beginPath(); g.moveTo(0, -16); g.lineTo(0, -58); g.stroke();
      g.shadowBlur = 0;
      g.strokeStyle = goldDark; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(-4, -22); g.lineTo(-4, -52); g.stroke();
      // adjustment nut
      g.fillStyle = goldDark;
      g.beginPath(); g.ellipse(0, -60, 8.5, 5, 0, 0, 7); g.fill();
      // jaws (the mouth opens toward his enemies)
      g.fillStyle = gold;
      g.fillRect(-7, -71, 23, 7);   // lower jaw
      g.fillRect(-7, -85, 23, 7);   // upper jaw
      g.fillRect(-7, -85, 7, 21);   // jaw back
      // eyes on the upper jaw
      g.fillStyle = '#1a1408';
      g.beginPath(); g.arc(6, -81.5, 1.8, 0, 7); g.fill();
      g.beginPath(); g.arc(12, -81.5, 1.8, 0, 7); g.fill();
    } else if (look.chicken) {
      // GIANT CHICKEN: massive body, tail feathers, wing, neck, comb, beak, wattle
      g.fillStyle = '#f6f2e8';
      g.beginPath(); g.ellipse(0, -40, 22, 17, 0, 0, 7); g.fill();
      g.fillStyle = '#e3ddcc';
      for (let tf = 0; tf < 3; tf++) {
        g.beginPath(); g.moveTo(-16, -44); g.quadraticCurveTo(-32, -58 - tf * 7, -20 - tf * 3, -38); g.fill();
      }
      const wflap = Math.sin((o.animT || 0) * 4) * 2;
      g.beginPath(); g.ellipse(-1, -40 + wflap * 0.4, 12, 8, -0.3, 0, 7); g.fill();
      g.fillStyle = '#f6f2e8';
      g.fillRect(10, -70, 9, 24);
      g.beginPath(); g.arc(14.5, -72, 8, 0, 7); g.fill();
      g.fillStyle = '#d43b2f';
      g.beginPath(); g.arc(11, -80, 3, 0, 7); g.arc(15, -82, 3, 0, 7); g.arc(19, -80, 3, 0, 7); g.fill();
      g.fillStyle = '#e8a020';
      g.beginPath(); g.moveTo(22, -73); g.lineTo(30, -71); g.lineTo(22, -68); g.fill();
      g.fillStyle = '#d43b2f';
      g.beginPath(); g.arc(21, -65, 2.5, 0, 7); g.fill();
      g.fillStyle = '#1a1408';
      g.beginPath(); g.arc(17, -74, 1.8, 0, 7); g.fill();
    } else if (look.sandwich) {
      // LITTLE BEAR SPECIAL: a towering Italian sub
      const rr = (x, y, w2, h2, r) => { g.beginPath(); g.roundRect(x, y, w2, h2, r); g.fill(); };
      g.fillStyle = '#c98d48'; rr(-17, -32, 34, 16, 6);           // bottom bread
      g.fillStyle = '#7dc45f';                                     // lettuce ruffle
      for (let lx = -15; lx <= 12; lx += 6) { g.beginPath(); g.arc(lx, -33, 4, 0, 7); g.fill(); }
      g.fillStyle = '#d43b2f';                                     // salami
      for (let sx = -11; sx <= 9; sx += 10) { g.beginPath(); g.arc(sx, -39, 4.5, 0, 7); g.fill(); }
      g.fillStyle = '#ffd24a'; g.fillRect(-16, -46, 32, 4);        // cheese
      g.fillStyle = '#a05a3c'; g.fillRect(-15, -51, 30, 5);        // meat
      g.fillStyle = '#e0a860'; rr(-17, -76, 34, 24, 10);           // top bread dome
      g.fillStyle = '#fff4dd';                                     // sesame seeds
      for (const [sx2, sy2] of [[-9, -70], [-2, -73], [6, -69], [10, -64], [-12, -63]]) {
        g.beginPath(); g.ellipse(sx2, sy2, 1.6, 1, 0.5, 0, 7); g.fill();
      }
      g.fillStyle = '#1a1408';                                     // eyes on the bread
      g.beginPath(); g.arc(4, -60, 1.8, 0, 7); g.fill();
      g.beginPath(); g.arc(11, -60, 1.8, 0, 7); g.fill();
    } else {
    // torso
    limb([hip[0] + lean * 0.3, hip[1]], [sh[0] + lean * 0.5, sh[1]], 13 * muscleW, torsoCol);
    if (look.shirtless) {
      // ab definition
      g.strokeStyle = hexMix(o.skin, '#000000', 0.25); g.lineWidth = 1.3;
      for (let ai = 0; ai < 3; ai++) {
        const ay = hip[1] - 4 - ai * 6;
        g.beginPath(); g.moveTo(-4 + lean * 0.4, ay); g.lineTo(5 + lean * 0.4, ay); g.stroke();
      }
    }
    // belt
    g.fillStyle = o.accent;
    g.fillRect(-7 + lean * 0.3, hip[1] - 3, 14, 4);
    }
    // front leg
    limb([hip[0] + lean * 0.3, hip[1]], frontFoot, 7.5, legCol);
    if (!look.printer && !look.wrench && !look.chicken && !look.sandwich) {
    // head
    g.fillStyle = o.hood ? o.color2 : o.skin;
    g.beginPath(); g.arc(3 + lean * 0.6, headY - 7, 9, 0, 7); g.fill();
    if (o.hood) {
      g.fillStyle = o.color;
      g.fillRect(-6 + lean * 0.6, headY - 17, 18, 6);
      // glowing eyes
      g.fillStyle = o.eyeColor || '#ffd34a';
      g.fillRect(5 + lean * 0.6, headY - 9, 4, 2.6);
    } else if (look.bald) {
      // bald shine
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(1 + lean * 0.6, headY - 9, 6, Math.PI * 1.15, Math.PI * 1.6); g.stroke();
    } else {
      // headband
      g.fillStyle = o.color;
      g.fillRect(-5 + lean * 0.6, headY - 12, 17, 5);
      g.fillRect(-9 + lean * 0.6, headY - 11, 5, 9); // band tail
    }
    if (look.beard) {
      g.fillStyle = look.beardColor || '#6b4423';
      g.beginPath(); g.arc(3 + lean * 0.6, headY - 4, 7.6, -0.04 * Math.PI, 1.04 * Math.PI); g.fill();
    }
    }
    if (o.boss) { // horns
      g.fillStyle = '#e8d9b0';
      g.beginPath(); g.moveTo(-4, headY - 14); g.lineTo(-9, headY - 26); g.lineTo(-1, headY - 16); g.fill();
      g.beginPath(); g.moveTo(9, headY - 14); g.lineTo(14, headY - 26); g.lineTo(6, headY - 16); g.fill();
    }
    // front arm + weapon
    if (!look.chicken) limb([sh[0] + lean * 0.5, sh[1]], frontHand, armW, frontArmCol);
    if (o.weaponTier > 0 && !look.chicken) {
      const wl = 10 + o.weaponTier * 4.5;
      const wc = (o.weaponColors && o.weaponColors[o.weaponTier - 1]) || WEAPON_COLORS[o.weaponTier - 1];
      g.strokeStyle = wc; g.lineWidth = 3.4;
      if (o.weaponTier >= 5) { g.shadowColor = wc; g.shadowBlur = 8; }
      if (o.weaponStyle === 'club') {
        g.lineWidth = 5;
        g.beginPath(); g.moveTo(frontHand[0], frontHand[1]); g.lineTo(frontHand[0] + wl * 0.7, frontHand[1] - wl * 0.5); g.stroke();
        g.fillStyle = wc;
        g.beginPath(); g.arc(frontHand[0] + wl * 0.7, frontHand[1] - wl * 0.5, 4.5, 0, 7); g.fill();
      } else if (o.weaponStyle === 'staff') {
        g.beginPath(); g.moveTo(frontHand[0] - wl * 0.8, frontHand[1] + wl * 0.5); g.lineTo(frontHand[0] + wl, frontHand[1] - wl * 0.6); g.stroke();
      } else if (o.weaponStyle === 'sandwich') {
        const sw = 8 + o.weaponTier * 1.7;
        g.fillStyle = '#e0a860';
        g.fillRect(frontHand[0] - 2, frontHand[1] - 7.5, sw, 3);
        g.fillRect(frontHand[0] - 2, frontHand[1] - 1.5, sw, 3);
        g.fillStyle = '#7dc45f'; g.fillRect(frontHand[0] - 3, frontHand[1] - 4.8, sw + 2, 1.7);
        g.fillStyle = '#d43b2f'; g.fillRect(frontHand[0] - 1, frontHand[1] - 3.1, sw - 2, 1.7);
      } else if (o.weaponStyle === 'feet') {
        g.fillStyle = wc; g.globalAlpha = 0.85;
        g.beginPath(); g.arc(frontFoot[0], frontFoot[1] - 2, 5, 0, 7); g.fill();
        g.beginPath(); g.arc(backFoot[0], backFoot[1] - 2, 4.6, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else if (o.weaponStyle === 'book') {
        const bw = 9 + o.weaponTier * 1.6, bh = 7 + o.weaponTier * 0.8;
        g.fillStyle = wc;
        g.fillRect(frontHand[0] - 2, frontHand[1] - bh + 2, bw, bh);
        g.fillStyle = 'rgba(255,252,235,0.8)';
        g.fillRect(frontHand[0] - 2, frontHand[1] - bh + 2, 2.4, bh); // spine
      } else if (o.weaponStyle === 'none') {
        g.fillStyle = wc; g.globalAlpha = 0.85;
        g.beginPath(); g.arc(frontHand[0], frontHand[1], 5.5, 0, 7); g.fill();
        g.beginPath(); g.arc(backHand[0], backHand[1], 5, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else {
        g.beginPath(); g.moveTo(frontHand[0], frontHand[1]); g.lineTo(frontHand[0] + wl, frontHand[1] - wl * 0.35); g.stroke();
      }
      g.shadowBlur = 0;
    }
    // fists
    if (!look.chicken) {
      g.fillStyle = o.hood ? o.color2 : o.skin;
      g.beginPath(); g.arc(frontHand[0], frontHand[1], 3.6, 0, 7); g.fill();
      g.beginPath(); g.arc(backHand[0], backHand[1], 3.4, 0, 7); g.fill();
    }

    g.restore();

    // overlays in world space
    if (o.flash > 0) {
      g.globalAlpha = Math.min(0.7, o.flash);
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(o.x, o.y - 45 * o.size * cf, 20 * o.size, 42 * o.size * cf, 0, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    if (o.frozen) {
      g.globalAlpha = 0.45;
      g.fillStyle = '#9fdcff';
      g.beginPath(); g.ellipse(o.x, o.y - 45 * o.size, 22 * o.size, 46 * o.size, 0, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
  }

  function attackExt(a) {
    if (!a) return 0;
    if (a.t < a.su) return 0.5 * (a.t / a.su);
    if (a.t < a.su + a.ac) return 1;
    return Math.max(0, 1 - (a.t - a.su - a.ac) / a.rec);
  }

  function drawEntities() {
    const g = ctx;
    for (const e of enemies) {
      let key = null;
      if (e.state === 'windup') key = 'windup';
      else if (e.state === 'strike') key = 'strike';
      drawFighter(g, {
        x: e.x, y: e.y, facing: e.facing, size: e.size,
        color: e.def.color, color2: e.def.color2, accent: e.def.color2, skin: e.def.color,
        hood: true, boss: !!e.def.boss, eyeColor: e.def.boss ? '#ff4a3a' : '#ffd34a',
        moving: e.state === 'approach' && e.frozenT <= 0, walkCyc: e.walkCyc, animT: e.animT,
        onGround: e.y >= GROUND_Y - 1, attackKey: key,
        hurt: e.hurtT > 0, flash: e.flash, frozen: e.frozenT > 0,
        weaponTier: 0, crouch: false, ascended: false,
      });
      // enemy hp pip
      if (e.hp < e.maxHp && !e.def.boss) {
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(e.x - 20, e.y - e.h - 12, 40, 5);
        g.fillStyle = '#ff5a4a'; g.fillRect(e.x - 20, e.y - e.h - 12, 40 * Math.max(0, e.hp / e.maxHp), 5);
      }
      // windup telegraph
      if (e.state === 'windup' && Math.floor(e.stateT * 12) % 2 === 0) {
        g.fillStyle = 'rgba(255,80,60,0.85)';
        g.beginPath(); g.arc(e.x, e.y - e.h - 22, 5, 0, 7); g.fill();
      }
    }

    for (const m of minions) {
      drawFighter(g, {
        x: m.x, y: m.y, facing: m.facing, size: m.size,
        color: m.cdef.color, color2: m.cdef.color2, accent: m.cdef.accent, skin: m.cdef.skin,
        moving: m.strikeT <= 0, walkCyc: m.walkCyc, animT: m.animT,
        onGround: m.y >= GROUND_Y - 1, attackKey: m.strikeT > 0 ? 'strike' : null,
        hurt: false, flash: 0, frozen: false, weaponTier: 0, weaponStyle: 'none', crouch: false, ascended: false,
      });
    }

    const p = player;
    if (p) {
      const blink = p.invulnT > 0 && Math.floor(p.invulnT * 14) % 2 === 0;
      if (!blink) {
        drawFighter(g, {
          x: p.x, y: p.y, facing: p.facing, size: p.size,
          color: p.cdef.color, color2: p.cdef.color2, accent: p.cdef.accent, skin: p.cdef.skin,
          moving: Math.abs(p.vx) > 40 && p.onGround, walkCyc: p.walkCyc, animT: p.animT,
          onGround: p.onGround, crouch: p.crouch,
          attackKey: p.attack ? p.attack.key : null, attackExt: attackExt(p.attack),
          hurt: p.hurtT > 0, flash: p.flash, frozen: false,
          weaponTier: p.upg.weapon, weaponStyle: p.cdef.weaponStyle, weaponColors: p.cdef.weaponColors, ascended: p.ascended,
          look: p.cdef.finalForm.look,
        });
      }
      if (p.buffT > 0) {
        g.strokeStyle = p.cdef.accent;
        g.globalAlpha = 0.45 + 0.3 * Math.sin(p.animT * 10);
        g.lineWidth = 3;
        g.beginPath(); g.ellipse(p.x, p.y - 2, 30, 8, 0, 0, 7); g.stroke();
        g.globalAlpha = 1;
      }
    }

    // projectiles
    for (const pr of projectiles) {
      g.fillStyle = pr.color;
      if (pr.type === 'wave' || pr.type === 'pwave') {
        g.beginPath(); g.moveTo(pr.x - 16, GROUND_Y); g.lineTo(pr.x, GROUND_Y - 34); g.lineTo(pr.x + 16, GROUND_Y); g.fill();
      } else if (pr.shape === 'brooks') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 16);
        g.strokeStyle = '#37b34a'; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, -2); g.lineTo(0, 8); g.stroke();
        g.beginPath(); g.moveTo(-6, 12); g.lineTo(0, 8); g.lineTo(6, 12); g.stroke();
        g.beginPath(); g.moveTo(-8, 0); g.lineTo(0, -1); g.lineTo(8, 0); g.stroke(); // helicopter arms
        g.fillStyle = '#e8b58a';
        g.beginPath(); g.arc(0, -7, 4.5, 0, 7); g.fill();
        g.restore();
      } else if (pr.shape === 'chicken') {
        g.save();
        g.translate(pr.x, pr.y);
        g.scale(Math.sign(pr.vx) || 1, 1);
        const wf = Math.sin(pr.life * 30) * 4;
        g.fillStyle = '#f6f2e8';
        g.beginPath(); g.ellipse(0, 0, 11, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#e3ddcc';
        g.beginPath(); g.ellipse(-2, -2 + wf * 0.4, 6, 3.5, -0.4, 0, 7); g.fill(); // wing
        g.beginPath(); g.moveTo(-9, -2); g.lineTo(-16, -8 + wf); g.lineTo(-8, 2); g.fill(); // tail
        g.fillStyle = '#f6f2e8';
        g.beginPath(); g.arc(9, -8, 4.5, 0, 7); g.fill(); // head
        g.fillStyle = '#d43b2f'; g.fillRect(7.5, -14.5, 3, 3); // comb
        g.fillStyle = '#e8a020';
        g.beginPath(); g.moveTo(13, -8); g.lineTo(18, -7); g.lineTo(13, -5.5); g.fill(); // beak
        g.fillStyle = '#1a1408';
        g.beginPath(); g.arc(10.5, -8.5, 1, 0, 7); g.fill(); // eye
        g.restore();
      } else if (pr.shape === 'ball') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 10 * Math.sign(pr.vx));
        g.fillStyle = '#f2f4f8';
        g.beginPath(); g.arc(0, 0, pr.r, 0, 7); g.fill();
        g.strokeStyle = '#3468b0'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(0, 0, pr.r * 0.72, 0.3, 2.2); g.stroke();
        g.beginPath(); g.arc(0, 0, pr.r * 0.72, Math.PI + 0.3, Math.PI + 2.2); g.stroke();
        g.restore();
      } else if (pr.shape === 'book') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 14 * Math.sign(pr.vx));
        g.fillStyle = pr.color; g.fillRect(-7, -5, 14, 10);
        g.fillStyle = '#fff8e8'; g.fillRect(-7, -5, 3, 10);
        g.restore();
      } else if (pr.shape === 'needle') {
        const ang = Math.atan2(pr.vy, pr.vx);
        g.strokeStyle = '#e8f0ff'; g.lineWidth = 2.5;
        g.shadowColor = pr.color; g.shadowBlur = 6;
        g.beginPath();
        g.moveTo(pr.x - Math.cos(ang) * 16, pr.y - Math.sin(ang) * 16);
        g.lineTo(pr.x, pr.y);
        g.stroke();
        g.shadowBlur = 0;
      } else {
        g.shadowColor = pr.color; g.shadowBlur = 12;
        g.beginPath(); g.arc(pr.x, pr.y, pr.r, 0, 7); g.fill();
        g.shadowBlur = 0;
      }
    }

    // coins
    for (const c of coins) {
      g.fillStyle = '#ffd34a'; g.strokeStyle = '#8a6200'; g.lineWidth = 1.5;
      const squish = 0.6 + 0.4 * Math.abs(Math.sin(c.t * 9));
      g.beginPath(); g.ellipse(c.x, c.y, 6 * squish, 6, 0, 0, 7); g.fill(); g.stroke();
    }

    // particles
    for (const pt of particles) {
      g.globalAlpha = Math.max(0, pt.life / pt.max);
      g.fillStyle = pt.color;
      g.beginPath(); g.arc(pt.x, pt.y, pt.r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;

    // float texts
    for (const f of floats) {
      g.globalAlpha = Math.min(1, f.t * 2);
      g.font = (f.big ? '900 26px' : '800 15px') + " 'Segoe UI', sans-serif";
      g.textAlign = 'center';
      g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 3;
      g.strokeText(f.txt, f.x, f.y);
      g.fillStyle = f.color; g.fillText(f.txt, f.x, f.y);
    }
    g.globalAlpha = 1;
  }

  function bar(g, x, y, w, h, frac, fill, back) {
    g.fillStyle = back || 'rgba(0,0,0,0.55)';
    g.fillRect(x, y, w, h);
    g.fillStyle = fill;
    g.fillRect(x + 1.5, y + 1.5, (w - 3) * clamp(frac, 0, 1), h - 3);
  }

  function drawHUD() {
    const g = ctx;
    g.save();
    g.setTransform(DPR * scale, 0, 0, DPR * scale, 0, 0); // screen space
    const p = player;
    if (p) {
      // name + HP + energy
      g.font = "900 13px 'Segoe UI', sans-serif"; g.textAlign = 'left';
      g.fillStyle = p.cdef.color;
      g.fillText(p.ascended ? p.cdef.finalForm.name : p.cdef.name, 14, 22);
      bar(g, 14, 28, 210, 15, p.hp / p.stats.maxHp, p.hp / p.stats.maxHp > 0.3 ? '#d43b2f' : '#ff7a3a');
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = "700 10px 'Segoe UI', sans-serif";
      g.fillText(Math.ceil(p.hp) + ' / ' + p.stats.maxHp, 18, 39.5);
      bar(g, 14, 46, 150, 9, p.energy / 100, p.energy >= p.stats.energyCost ? '#4aa8ff' : '#28527a');
      g.fillStyle = '#7fb8ff'; g.font = "700 9px 'Segoe UI', sans-serif";
      g.fillText('ENERGY (A)', 168, 54);

      // money — top right, clear of pause button
      g.textAlign = 'right';
      g.font = "900 17px 'Segoe UI', sans-serif";
      g.fillStyle = '#ffd977';
      g.fillText('$' + Save.data.money.toLocaleString(), window.innerWidth / scale - 92, 28);

      // level / wave
      g.textAlign = 'center';
      const cx = window.innerWidth / scale / 2;
      g.font = "900 14px 'Segoe UI', sans-serif";
      g.fillStyle = '#e8e2d0';
      g.fillText('LEVEL ' + plan.level, cx, 20);
      g.font = "700 11px 'Segoe UI', sans-serif";
      g.fillStyle = '#9a927e';
      g.fillText('WAVE ' + Math.min(waveIdx, plan.waves.length) + ' / ' + plan.waves.length, cx, 36);

      // boss bar
      const boss = enemies.find(e => e.def.boss);
      if (boss) {
        const bw = Math.min(420, window.innerWidth / scale - 120);
        bar(g, cx - bw / 2, 46, bw, 13, boss.hp / boss.maxHp, '#d43b2f');
        g.font = "900 10px 'Segoe UI', sans-serif"; g.fillStyle = '#ffb0a8';
        g.fillText('WARLORD', cx, 56.5);
      }

      // banner
      if (banner) {
        const a = Math.min(1, banner.t / 0.4, (banner.max - banner.t) / 0.25 + 0.2);
        g.globalAlpha = clamp(a, 0, 1);
        g.font = "900 44px 'Segoe UI', sans-serif";
        g.fillStyle = '#f3c14b';
        g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 14;
        g.fillText(banner.text, cx, VH * 0.34 * (window.innerHeight / scale / VH));
        if (banner.sub) {
          g.font = "700 16px 'Segoe UI', sans-serif";
          g.fillStyle = '#e8e2d0';
          g.fillText(banner.sub, cx, VH * 0.34 * (window.innerHeight / scale / VH) + 30);
        }
        g.shadowBlur = 0; g.globalAlpha = 1;
      }
    }
    g.restore();
  }

  function render() {
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, 0, 0);
    let ox = 0, oy = 0;
    if (shakeT > 0) { ox = rand(-1, 1) * shakeMag * shakeT * 4; oy = rand(-1, 1) * shakeMag * shakeT * 4; }
    ctx.translate(-camX + ox, oy);
    drawBackground();
    if (mode !== 'idle') drawEntities();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // vignette
    const w = window.innerWidth, h = window.innerHeight;
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 0.95);
    vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    if (flashFxT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, flashFxT * 2.6).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    if (mode !== 'idle') drawHUD();
  }

  // ---------- Loop ----------
  let last = performance.now();
  function schedule() {
    // rAF stalls entirely while the document is hidden; keep simulating via timer
    if (document.hidden) setTimeout(() => tick(performance.now()), 16);
    else requestAnimationFrame(tick);
  }
  function tick(now) {
    schedule();
    let dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    if (paused) { render(); return; }
    if (hitstop > 0) { hitstop -= dt; render(); return; }
    update(dt * timeScale);
    render();
  }

  // ---------- Portraits for the select screen ----------
  function drawPortrait(canvas, cdef, ascended) {
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    drawFighter(g, {
      x: canvas.width / 2, y: canvas.height - 8, facing: 1,
      size: (canvas.height / 118) * (ascended ? 1.08 : 1),
      color: cdef.color, color2: cdef.color2, accent: cdef.accent, skin: cdef.skin,
      moving: false, walkCyc: 0, animT: 2, onGround: true,
      crouch: false, attackKey: null, attackExt: 0,
      hurt: false, flash: 0, frozen: false, weaponTier: 0, weaponStyle: cdef.weaponStyle, weaponColors: cdef.weaponColors, ascended,
      look: cdef.finalForm.look,
    });
  }

  function setPaused(v) { paused = v; if (!v) last = performance.now(); }
  function quit() { mode = 'idle'; paused = false; Save.write(); }

  schedule();
  UI.init();

  function debug() {
    return {
      mode, waveIdx, spawnDelay: +spawnDelay.toFixed(2), timeScale, hitstop: +hitstop.toFixed(3),
      enemies: enemies.map(e => ({
        t: e.type, hp: Math.round(e.hp), x: Math.round(e.x), y: Math.round(e.y),
        st: e.state, cd: +e.cd.toFixed(2), fz: +e.frozenT.toFixed(1), hu: +e.hurtT.toFixed(1),
      })),
      player: player && { x: Math.round(player.x), hp: Math.round(player.hp), energy: Math.round(player.energy), attack: player.attack && player.attack.key },
      coins: coins.length, projectiles: projectiles.length,
      minions: minions.map(m => ({ id: m.cdef.id, x: Math.round(m.x) })),
    };
  }

  return {
    startLevel, drawPortrait, setPaused, quit, debug,
    get lastCharId() { return lastCharId; },
  };
})();
