// ===== Horsch Family Arena — core engine: combat, AI, waves, rendering =====

const Game = (() => {
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');

  // Logical viewport: fixed height, variable width
  const VH = 540;
  const GROUND_Y = 468;
  const STAGE_W = 1750;
  const GRAV = 1950;

  // Portrait phones: never let the visible arena get narrower than MIN_VW
  // world-pixels — scale down instead and anchor the action above the touch
  // controls, letting sky fill the extra height.
  const MIN_VW = 640;
  let DPR = 1, scale = 1, viewW = 960, viewH = VH, worldOffY = 0, SW = 1, SH = 1;
  // Layout-viewport size: stable under iOS pinch-zoom, matches the canvas's
  // fixed inset:0 CSS box (window.innerWidth tracks the visual viewport and lies).
  function measure() {
    const el = document.documentElement;
    return [
      Math.max(1, el.clientWidth || window.innerWidth),
      Math.max(1, el.clientHeight || window.innerHeight),
    ];
  }
  function resize() {
    DPR = window.devicePixelRatio || 1;
    const m = measure();
    SW = m[0]; SH = m[1];
    cvs.width = Math.round(SW * DPR);
    cvs.height = Math.round(SH * DPR);
    // canvas is a replaced element: without an explicit CSS size it displays at
    // its intrinsic (backing-store) size — 3x too big on a DPR-3 phone
    cvs.style.width = SW + 'px';
    cvs.style.height = SH + 'px';
    scale = Math.min(SH / VH, SW / MIN_VW);
    viewW = SW / scale;
    viewH = SH / scale;
    worldOffY = Math.max(0, viewH - GROUND_Y - 380); // keep the fight clear of the touch controls
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => { resize(); setTimeout(resize, 300); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  // ---------- World state ----------
  let mode = 'idle';        // idle | playing | victory | defeat
  let paused = false;
  let plan = null, theme = themeFor(1);
  let player = null, enemies = [], projectiles = [], coins = [], particles = [], floats = [], minions = [], beams = [], pickups = [];
  let waveIdx = 0, spawnDelay = 0, endTimer = 0, endFired = false;
  let coinrainT = 0, gooseSpawned = false;
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
      buffT: 0, buffDmg: 1, buffSpeed: 1, returnT: 0, diveT: 0,
      combo: 0, comboT: 0, comboPop: 0,
      pwGiantT: 0, pwMagnetT: 0, shieldHits: 0,
      attack: null, hurtT: 0, invulnT: 0, walkCyc: 0, animT: 0, flash: 0,
      ascended: upg.ascended, size: upg.ascended ? (cdef.finalForm.sizeMult || 1.12) : (cdef.baseSize || 1),
    };
    enemies = []; projectiles = []; coins = []; particles = []; floats = []; minions = []; beams = []; pickups = [];
    coinrainT = 2; gooseSpawned = false;
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
    const evLabel = { coinrain: 'EVENT: COIN RAIN', fog: 'EVENT: FOG NIGHT', fullsend: 'EVENT: FULL SEND', goose: 'EVENT: GOOSE SIGHTING' }[plan.event] || '';
    setBanner(plan.levelName.toUpperCase(),
      plan.world.name + '  —  LEVEL ' + plan.level + (plan.boss ? '  —  BOSS' : '') + (evLabel ? '  —  ' + evLabel : ''), 2.2);
  }

  function spawnWave() {
    const list = plan.waves[waveIdx];
    let side = player.x > STAGE_W / 2 ? -1 : 1;
    for (let i = 0; i < list.length; i++) {
      const t = worldEnemyDef(plan.world, list[i]);
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
      // spawn modifiers: one roll per enemy, never on bosses
      if (!t.boss) {
        const roll = Math.random();
        if (plan.level >= 3 && roll < 0.06) {
          e.elite = true; e.valueMult = 5;
          e.hp *= 2; e.maxHp *= 2;
          e.size *= 1.15; e.w *= 1.15; e.h *= 1.15;
        } else if (roll < 0.16 || plan.event === 'fullsend') {
          e.frenzy = true; e.valueMult = 1.5;
          e.speed *= 1.5; e.dmg *= 1.3;
        } else if (roll < 0.26) {
          e.armorHits = 2;
        }
      }
      if (e.def.signature === 'roll') { e.rollDir = -dir; e.touchCd = 0; }
      enemies.push(e);
      burst(e.x, e.y - e.h / 2, theme.glow, 12, 200, false);
    }
    setBanner('WAVE ' + (waveIdx + 1) + ' / ' + plan.waves.length, plan.boss && waveIdx === plan.waves.length - 1 ? 'THE BOSS APPROACHES' : '', 1.3);
    waveIdx++;
  }

  function winLevel() {
    mode = 'victory'; timeScale = 0.55; endTimer = 2.0; endFired = false;
    let sub = '+$' + earned + ' earned';
    // bounty: win any level as the wanted fighter
    const b = Save.data.bounty;
    if (b && lastCharId === b.charId) {
      Save.data.money += b.reward;
      earned += b.reward;
      sub += '  ·  BOUNTY +$' + b.reward + '!';
      addFloat(player.x, player.y - player.h - 40, 'BOUNTY COMPLETE! +$' + b.reward, '#ffd24a', true);
      Save.data.bounty = null;
      ensureBounty();
    }
    setBanner('VICTORY', sub, 2.0);
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

  const IMPACT_WORDS = ['POW!', 'BAM!', 'WHACK!', 'BONK!', 'KRAK!', 'THWAP!'];
  function impactWord(x, y, txt) {
    floats.push({ x, y, txt, color: '#1a1408', t: 0.55, big: true, word: true, rot: rand(-0.18, 0.18) });
  }

  function hitEnemy(e, dmg, kbx, kby, heavy) {
    // armored enemies shrug off the first hits
    if (e.armorHits > 0) {
      e.armorHits--;
      e.flash = 0.5;
      e.vx += kbx * 0.2;
      burst(e.x, e.y - e.h * 0.6, '#c9ccd8', 6, 180, false);
      addFloat(e.x, e.y - e.h - 14, e.armorHits === 0 ? 'ARMOR BREAK!' : 'CLANK', '#c9ccd8', e.armorHits === 0);
      Sfx.hit();
      return;
    }
    e.hp -= dmg;
    e.flash = 1;
    e.vx += kbx; e.vy += kby || 0;
    if (kby < -100) e.onGround = false;
    e.hurtT = Math.max(e.hurtT, heavy ? 0.4 : 0.22);
    if (e.state === 'windup') { e.state = 'approach'; e.cd = 0.5; }
    addFloat(e.x, e.y - e.h - 14, Math.round(dmg), '#ffd977');
    burst(e.x, e.y - e.h * 0.55, '#ffcf7a', heavy ? 10 : 5, heavy ? 320 : 200);
    if (heavy && Math.random() < 0.35) impactWord(e.x + rand(-10, 10), e.y - e.h * 0.6, IMPACT_WORDS[Math.floor(Math.random() * IMPACT_WORDS.length)]);
    player.energy = Math.min(100, player.energy + 6);
    // combo: consecutive hits without taking damage multiply coin drops
    player.combo++;
    player.comboT = 4;
    player.comboPop = 0.25;
    if (player.combo > 0 && player.combo % 10 === 0) addFloat(player.x, player.y - player.h - 34, 'COMBO ×' + player.combo + '!', '#ffd24a', true);
    hitstop = Math.max(hitstop, heavy ? 0.07 : 0.035);
    shakeT = Math.max(shakeT, heavy ? 0.22 : 0.1); shakeMag = heavy ? 7 : 3;
    heavy ? Sfx.heavy() : Sfx.hit();
    if (e.hp <= 0) {
      // fantasy skeletons sometimes collapse into a pile and reassemble
      if (e.def.signature === 'revive' && !e.revived && Math.random() < 0.6) {
        e.revived = true;
        e.state = 'pile';
        e.pileT = 2.5;
        e.hp = 0.1;
        burst(e.x, e.y - 20, '#d8d4c8', 14, 220);
        addFloat(e.x, e.y - 40, 'rattle rattle...', '#d8d4c8');
        return;
      }
      killEnemy(e);
      return;
    }
    // imps blink away when struck
    if (e.def.signature === 'blink' && Math.random() < 0.4) {
      burst(e.x, e.y - e.h * 0.5, e.def.color, 10, 240, false);
      e.x = clamp(e.x + (Math.random() < 0.5 ? -1 : 1) * rand(120, 200), 40, STAGE_W - 40);
      burst(e.x, e.y - e.h * 0.5, e.def.color, 10, 240, false);
    }
  }

  function killEnemy(e) {
    const comboMult = 1 + Math.min(player ? player.combo : 0, 50) * 0.02;
    let v = Math.max(2, Math.round(e.def.value * plan.valueMult * (e.valueMult || 1) * comboMult));
    if (e.stolen) v += e.stolen * 2; // trash pandas pay back double
    if (e.def.cameo) addFloat(e.x, e.y - e.h, 'GOOSE BOUNTY!', '#ffd24a', true);
    if (e.elite) addFloat(e.x, e.y - e.h - 26, 'ELITE DOWN! ×5', '#ffd24a', true);
    // clog blobs split into two minis
    if (e.def.signature === 'split' && !e.noSplit) {
      for (const dir of [-1, 1]) {
        const mini = {
          type: e.type, def: Object.assign({}, e.def, { value: 6 }),
          x: clamp(e.x + dir * 26, 40, STAGE_W - 40), y: e.y, vx: dir * 160, vy: -240, facing: dir,
          w: e.w * 0.62, h: e.h * 0.62, size: e.size * 0.62,
          hp: e.maxHp * 0.3, maxHp: e.maxHp * 0.3,
          dmg: e.dmg * 0.5, speed: e.speed * 1.2,
          state: 'approach', stateT: 0, cd: rand(0.4, 1), pref: e.pref,
          hurtT: 0, frozenT: 0, flash: 0, walkCyc: 0, animT: rand(0, 6),
          shockT: 0, onGround: false, noSplit: true,
        };
        enemies.push(mini);
      }
    }
    // pickups: hearts, energy, powerups
    if (!e.def.cameo && Math.random() < (e.elite ? 0.5 : 0.13)) {
      const r = Math.random();
      const type = r < 0.4 ? 'heart' : r < 0.65 ? 'energy' : r < 0.79 ? 'giant' : r < 0.92 ? 'magnet' : 'shield';
      pickups.push({ x: e.x, y: e.y - 30, vy: -300, type, t: 0, life: 9 });
    }
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
    if (player.shieldHits > 0) {
      player.shieldHits--;
      player.invulnT = 0.6;
      burst(player.x, player.y - 50, '#7fdcff', 16, 300, false);
      addFloat(player.x, player.y - player.h - 18, 'BLOCKED!', '#7fdcff', true);
      Sfx.heavy();
      return;
    }
    player.combo = 0; // combo breaks when you get hit
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
    const p = player, st = p.stats;
    // final forms may carry a whole replacement special (e.g. Ryan Dugan)
    const def = (p.ascended && p.cdef.finalForm.special) || p.cdef.special;
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
              vx: dir * spd, vy: def.lob ? -560 : (def.arc ? 250 : (def.spreadY ? (i - (n - 1) / 2) * def.spreadY : 0)),
              dmg: (def.dmg || 22) * S, r: (def.r || 13) * size, life: def.life || 1.5,
              pierce: def.pierce !== false, shape: def.shape, bounty: def.bounty, bounce: def.bounce, flap: def.flap,
              boomerang: def.boomerang, dir, douse: def.douse, freeze: def.freeze,
              grenade: def.grenade, noContact: def.noContact, blast: def.blast, color: col,
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
      case 'tornado': {
        const R = (def.radius || 150) * size;
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          particles.push({ x: p.x + Math.cos(a) * rand(10, R * 0.8), y: p.y - rand(5, 85), vx: Math.cos(a + 1.5) * 260, vy: rand(-90, -20), life: rand(0.3, 0.6), max: 0.6, r: rand(2, 5), color: '#cfd8ba', grav: false });
        }
        for (const e of [...enemies]) {
          if (Math.abs(e.x - p.x) < R + e.w / 2) {
            hitEnemy(e, (def.dmg || 18) * S, (e.x >= p.x ? 1 : -1) * (def.kb || 650), -320, true);
          }
        }
        p.invulnT = Math.max(p.invulnT, 0.5);
        shakeT = 0.25; shakeMag = 6;
        break;
      }
      case 'selfrang': {
        // Boomerang Brooks throws himself. His mother would be proud.
        const dist2 = def.dist || 420;
        const dx2 = dist2 * p.facing;
        const sx0 = Math.min(p.x, p.x + dx2), sx1 = Math.max(p.x, p.x + dx2);
        for (const e of [...enemies]) {
          if (e.x + e.w / 2 > sx0 - 20 && e.x - e.w / 2 < sx1 + 20) hitEnemy(e, (def.dmg || 20) * S, p.facing * 300, -200, true);
        }
        p.returnX = p.x;
        p.x = clamp(p.x + dx2, 40, STAGE_W - 40);
        p.returnT = 0.4;
        p.selfrangDmg = (def.dmg || 20) * S;
        p.invulnT = Math.max(p.invulnT, 1.0);
        addFloat(p.x, p.y - p.h - 30, 'WHEEE!', p.cdef.accent, true);
        for (let i = 0; i < 14; i++) particles.push({ x: sx0 + (sx1 - sx0) * (i / 13), y: p.y - rand(20, 80), vx: 0, vy: rand(-50, 50), life: 0.3, max: 0.3, r: rand(2, 4), color: p.cdef.accent, grav: false });
        shakeT = 0.2; shakeMag = 5;
        break;
      }
      case 'laser': {
        const ly = p.y - 62 * p.size;
        beams.push({ x0: p.x + p.facing * 14, y0: ly, x1: p.x + p.facing * 900, y1: ly, t: 0.28, max: 0.28, color: def.color || '#ff3a3a' });
        for (const e of [...enemies]) {
          const inX = p.facing > 0 ? e.x > p.x : e.x < p.x;
          if (inX && e.y >= ly && e.y - e.h <= ly) {
            hitEnemy(e, (def.dmg || 22) * S, p.facing * 220, -80, true);
          }
        }
        shakeT = 0.2; shakeMag = 5;
        break;
      }
      case 'shout': {
        const R = (def.radius || 320) * (asc ? 1.4 : 1);
        if (def.shoutLines) def.shoutLines.forEach((ln, i) => addFloat(p.x, p.y - p.h - 34 + i * 26, ln, p.cdef.accent, true));
        for (const e of [...enemies]) {
          if (Math.abs(e.x - p.x) < R + e.w / 2) {
            if (def.stun) e.hurtT = Math.max(e.hurtT, def.stun);
            hitEnemy(e, (def.dmg || 20) * S, (e.x >= p.x ? 1 : -1) * (def.kb || 380), -120, true);
          }
        }
        burst(p.x, p.y - 60, col, 20, 360, false);
        shakeT = 0.3; shakeMag = 7;
        break;
      }
      case 'radial': {
        const n = def.count || 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          projectiles.push({
            type: 'fire', hostile: false, x: p.x, y: p.y - 55,
            vx: Math.cos(a) * (def.speed || 480), vy: Math.sin(a) * (def.speed || 480) * 0.6,
            dmg: (def.dmg || 16) * S, r: def.r || 9, life: def.life || 1.4,
            pierce: true, shape: def.shape, color: col,
          });
        }
        if (def.shoutLines) def.shoutLines.forEach((ln, i) => addFloat(p.x, p.y - p.h - 34 + i * 26, ln, p.cdef.accent, true));
        shakeT = 0.25; shakeMag = 6;
        break;
      }
      case 'car': {
        projectiles.push({
          type: 'car', hostile: false, x: p.x - p.facing * 80, y: GROUND_Y - 16,
          vx: p.facing * (def.speed || 720), vy: 0,
          dmg: (def.dmg || 30) * S, r: 26, life: 3, pierce: true, shape: 'car', color: def.color || '#d43b2f',
        });
        shakeT = 0.35; shakeMag = 7;
        Sfx.heavy();
        break;
      }
      case 'dive': {
        // someone offscreen tosses Dayne a volleyball. this ends predictably.
        projectiles.push({
          type: 'fire', hostile: false, noContact: true, shape: 'ball',
          x: p.x + p.facing * 520, y: p.y - 120, vx: -p.facing * 700, vy: 40,
          dmg: 0, r: 10, life: 0.8, pierce: true, color: '#f2f4f8',
        });
        p.diveT = 0.62;
        p.diveDmg = Math.round((def.selfDmg || 6) * (1 + 0.5 * p.upg.ability) * (asc ? 1.5 : 1));
        break;
      }
      case 'oops': {
        // Erika's special. It helps no one.
        const selfDmg = Math.round((def.selfDmg || 8) * (1 + 0.5 * p.upg.ability) * (asc ? 1.5 : 1));
        p.hp = Math.max(1, p.hp - selfDmg);
        p.flash = 0.8;
        addFloat(p.x, p.y - p.h - 18, '-' + selfDmg, '#ff6a5a');
        addFloat(p.x, p.y - p.h - 42, 'OH NO.', '#c9a227', true);
        for (let i = 0; i < 14; i++) {
          particles.push({ x: p.x + p.facing * rand(0, 8), y: p.y - rand(8, 38), vx: rand(-25, 25), vy: rand(40, 150), life: rand(0.4, 0.8), max: 0.8, r: rand(2, 4.5), color: '#7a5230', grav: true });
        }
        shakeT = 0.15; shakeMag = 3;
        Sfx.hurt();
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
    if (p.pwGiantT > 0) p.pwGiantT -= dt;
    if (p.pwMagnetT > 0) p.pwMagnetT -= dt;
    if (p.comboPop > 0) p.comboPop -= dt;
    if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
    // Volleyball Dive: the miss, the sternum, the shame
    if (p.diveT > 0) {
      p.diveT -= dt;
      if (p.diveT <= 0) {
        p.x = clamp(p.x + p.facing * 80, 40, STAGE_W - 40);
        p.hp = Math.max(1, p.hp - (p.diveDmg || 6));
        p.hurtT = 0.4; p.flash = 0.8;
        addFloat(p.x, p.y - p.h - 16, '-' + (p.diveDmg || 6), '#ff6a5a');
        const DIVE_LINES = ['RIGHT IN THE STERNUM', 'HE MISSED', 'NOT EVEN CLOSE', 'GOT IT! (he did not)'];
        addFloat(p.x, p.y - p.h - 42, DIVE_LINES[Math.floor(Math.random() * DIVE_LINES.length)], '#e8d24a', true);
        projectiles.push({
          type: 'fire', hostile: false, noContact: true, shape: 'ball', bounce: true,
          x: p.x + p.facing * 10, y: p.y - 60, vx: -p.facing * 180, vy: -260,
          dmg: 0, r: 10, life: 1.3, pierce: true, color: '#f2f4f8',
        });
        Sfx.hurt();
        shakeT = 0.15; shakeMag = 3;
      }
    }
    // Boomerang Brooks: the return leg of the self-toss
    if (p.returnT > 0) {
      p.returnT -= dt;
      if (p.returnT <= 0 && p.returnX !== undefined) {
        const rx0 = Math.min(p.x, p.returnX), rx1 = Math.max(p.x, p.returnX);
        for (const e of [...enemies]) {
          if (e.x + e.w / 2 > rx0 - 20 && e.x - e.w / 2 < rx1 + 20) {
            hitEnemy(e, p.selfrangDmg || 20, (p.returnX >= p.x ? 1 : -1) * 300, -200, true);
          }
        }
        for (let i = 0; i < 14; i++) particles.push({ x: rx0 + (rx1 - rx0) * (i / 13), y: p.y - rand(20, 80), vx: 0, vy: rand(-50, 50), life: 0.3, max: 0.3, r: rand(2, 4), color: p.cdef.accent, grav: false });
        p.x = p.returnX;
        p.returnX = undefined;
        Sfx.special();
      }
    }
    p.energy = Math.min(100, p.energy + 11 * dt);
    // 8-hours-of-sleep chatter: the impossible things keep happening
    if (p.ascended && p.cdef.finalForm.chatter && mode === 'playing' && Math.random() < dt * 0.45) {
      const lines = p.cdef.finalForm.chatter;
      p.chatterIdx = ((p.chatterIdx || 0) + 1) % lines.length;
      addFloat(p.x + rand(-26, 26), p.y - rand(50, 95), lines[p.chatterIdx], p.cdef.accent);
    }

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

    // physics (Mecha Hayes: hold JUMP to fly on jet thrusters)
    p.vy += GRAV * dt;
    if (p.ascended && p.cdef.finalForm.fly && Input.jumpHeld && !p.onGround) {
      p.vy = Math.max(p.vy - 3600 * dt, -300);
      if (Math.random() < 0.5) {
        particles.push({ x: p.x + rand(-8, 8), y: p.y - 4, vx: rand(-20, 20), vy: rand(120, 220), life: 0.3, max: 0.3, r: rand(2, 4), color: '#ffb04a', grav: false });
      }
    }
    p.x = clamp(p.x + p.vx * dt, 40, STAGE_W - 40);
    p.y += p.vy * dt;
    if (p.y < 150) { p.y = 150; if (p.vy < 0) p.vy = 0; } // flight ceiling
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
            hitEnemy(e, d.dmg * st.dmg * (p.buffT > 0 ? p.buffDmg : 1) * (p.pwGiantT > 0 ? 1.5 : 1), dir * d.kb, d.kbY, a.key !== 'X');
            const wb = p.cdef.weaponBurn;
            if (wb && p.upg.weapon >= wb.tier && enemies.includes(e)) e.burnT = wb.dur;
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
    if (e.dousedT > 0) e.dousedT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.hp -= 8 * dt;
      if (Math.random() < 0.3) {
        particles.push({ x: e.x + rand(-8, 8), y: e.y - e.h * rand(0.4, 0.9), vx: rand(-15, 15), vy: -rand(50, 100), life: rand(0.25, 0.5), max: 0.5, r: rand(2, 3.5), color: '#ff7a2c', grav: false });
      }
      if (e.hp <= 0) { killEnemy(e); return; }
    }
    // Tim's world: everything he fights is on fire until he hoses it down
    if (player && player.cdef.enemiesOnFire && !(e.dousedT > 0) && Math.random() < 0.2) {
      particles.push({
        x: e.x + rand(-10, 10), y: e.y - e.h * rand(0.4, 0.95),
        vx: rand(-15, 15), vy: -rand(50, 110),
        life: rand(0.3, 0.55), max: 0.55, r: rand(2, 4),
        color: Math.random() < 0.5 ? '#ff7a2c' : '#ffd24a', grav: false,
      });
    }

    // knockback physics always applies
    e.vy += GRAV * dt;
    e.y += e.vy * dt;
    if (e.y >= GROUND_Y) { e.y = GROUND_Y; e.vy = 0; e.onGround = true; }
    e.vx *= Math.pow(0.0015, dt); // friction on knockback impulse
    e.x = clamp(e.x + e.vx * dt, 40, STAGE_W - 40);

    if (e.frozenT > 0) { e.frozenT -= dt; return; }
    if (e.hurtT > 0) { e.hurtT -= dt; return; }
    if (mode !== 'playing') return;

    // signature: skeleton bone pile, reassembling
    if (e.state === 'pile') {
      e.pileT -= dt;
      if (e.pileT <= 0) {
        e.hp = e.maxHp * 0.3;
        e.state = 'approach';
        e.cd = 0.8;
        addFloat(e.x, e.y - e.h, 'REASSEMBLED!', '#d8d4c8');
        burst(e.x, e.y - e.h * 0.5, '#d8d4c8', 10, 200, false);
      }
      return;
    }
    // goose cameo: sprints across the arena robbing the place, then leaves
    if (e.def.cameo) {
      e.x += e.rollDir * e.def.speed * dt;
      e.facing = e.rollDir;
      e.walkCyc += dt * 20;
      for (const c of [...coins]) {
        if (Math.abs(c.x - e.x) < 60 && !c.magnet) {
          e.stolen = (e.stolen || 0) + c.v;
          coins.splice(coins.indexOf(c), 1);
          addFloat(e.x, e.y - e.h - 10, 'HONK', '#ffffff');
        }
      }
      if (e.x < 26 || e.x > STAGE_W - 26) enemies.splice(enemies.indexOf(e), 1);
      return;
    }
    // signature: rolling tire — bounces across the arena; jump it
    if (e.def.signature === 'roll') {
      e.touchCd = (e.touchCd || 0) - dt;
      e.x += e.rollDir * e.speed * 1.7 * dt;
      e.walkCyc += e.rollDir * dt * 9;
      if (e.x <= 44 || e.x >= STAGE_W - 44) e.rollDir *= -1;
      if (e.touchCd <= 0 && Math.abs(e.x - player.x) < 46 && player.y > e.y - 60) {
        damagePlayer(e.dmg, e.x);
        e.touchCd = 1.1;
      }
      return;
    }
    // signature: coin thief (trash panda) — eats your drops, pays double on death
    if (e.def.signature === 'thief') {
      for (const c of coins) {
        if (Math.abs(c.x - e.x) < 60 && Math.abs(c.y - (e.y - 30)) < 60) {
          e.stolen = (e.stolen || 0) + c.v;
          coins.splice(coins.indexOf(c), 1);
          addFloat(e.x, e.y - e.h - 10, 'YOINK', '#ffd977');
          break;
        }
      }
    }

    const dx = player.x - e.x;
    const dist = Math.abs(dx);
    e.facing = dx >= 0 ? 1 : -1;
    e.cd -= dt;

    if (e.def.boss) {
      e.shockT -= dt;
      if (e.charging > 0) {
        e.charging -= dt;
        e.x = clamp(e.x + e.chargeDir * 640 * dt, 40, STAGE_W - 40);
        e.walkCyc += dt * 30;
        if (Math.random() < 0.4) particles.push({ x: e.x - e.chargeDir * 40, y: e.y - rand(4, 20), vx: -e.chargeDir * 80, vy: -rand(20, 60), life: 0.4, max: 0.4, r: rand(2, 5), color: '#8d8574', grav: false });
        if (!e.chargeHit && Math.abs(e.x - player.x) < 70) {
          damagePlayer(e.dmg * 1.2, e.x);
          e.chargeHit = true;
        }
        return; // full send
      }
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
        let spd = e.speed;
        if (e.def.signature === 'pack') {
          // drain rats hunt in packs: faster for every living packmate
          const packmates = enemies.filter(o => o !== e && o.def.signature === 'pack' && o.state !== 'pile').length;
          spd *= 1 + Math.min(0.75, 0.15 * packmates);
        }
        if (move !== 0) { e.x = clamp(e.x + move * spd * dt, 40, STAGE_W - 40); e.walkCyc += dt * spd * 0.05; }
        const inRange = e.def.signature === 'lunge' ? dist <= 230
          : (e.def.ranged ? (dist <= e.def.reach && dist >= 150) : dist <= e.def.reach);
        if (inRange && e.cd <= 0) { e.state = 'windup'; e.stateT = e.def.windup; }
        break;
      }
      case 'windup': {
        e.stateT -= dt;
        if (e.stateT <= 0) {
          if (e.def.signature === 'lunge') {
            // murder wasp: dive-bombs at the player
            e.state = 'strike'; e.stateT = 0.6;
            e.vx = (Math.sign(player.x - e.x) || 1) * 520;
            e.vy = -330; e.onGround = false;
            e.lungeHit = false; e.lunging = true;
          } else {
            e.state = 'strike'; e.stateT = 0.16; doStrike(e);
          }
        }
        break;
      }
      case 'strike': {
        e.stateT -= dt;
        if (e.lunging) {
          if (!e.lungeHit && Math.abs(e.x - player.x) < 55 && Math.abs(e.y - player.y) < 80) {
            damagePlayer(e.dmg, e.x);
            e.lungeHit = true;
          }
          if (e.onGround) e.lunging = false;
        }
        if (e.stateT <= 0) { e.state = 'approach'; e.cd = e.def.cooldown; }
        break;
      }
    }
  }

  function doStrike(e) {
    if (e.shockNext) {
      e.shockNext = false;
      const kind = e.def.bossKind;
      if (kind === 'goose') {
        addFloat(e.x, e.y - e.h - 28, 'HONK!', '#ffffff', true);
        burst(e.x, e.y - 60, '#e8f0ff', 18, 340, false);
        if (Math.abs(player.x - e.x) < 280) damagePlayer(e.dmg * 0.9, e.x);
        if (player) player.vx += Math.sign(player.x - e.x || 1) * -500;
        shakeT = 0.35; shakeMag = 9; Sfx.heavy();
      } else if (kind === 'heater') {
        for (const dir of [-1, 1]) {
          for (const hy of [46, 84]) {
            projectiles.push({ type: 'bolt', hostile: true, x: e.x + dir * 26, y: e.y - hy, vx: dir * 330, vy: 0, dmg: e.dmg * 0.7, r: 8, life: 2.2, color: '#d8e4e8' });
          }
        }
        burst(e.x, e.y - e.h, '#d8e4e8', 14, 240, false);
        shakeT = 0.3; shakeMag = 7; Sfx.heavy();
      } else if (kind === 'van') {
        e.charging = 0.8;
        e.chargeDir = Math.sign(player.x - e.x) || 1;
        e.chargeHit = false;
        addFloat(e.x, e.y - e.h - 28, 'VROOOOM', '#ffd24a', true);
        Sfx.heavy();
      } else if (kind === 'dragon') {
        const dir = Math.sign(player.x - e.x) || 1;
        for (let i = 0; i < 4; i++) {
          projectiles.push({ type: 'bolt', hostile: true, x: e.x + dir * 30, y: e.y - 90, vx: dir * (300 + i * 60), vy: 40 + i * 26, dmg: e.dmg * 0.6, r: 9, life: 2.2, color: '#c24ae8' });
        }
        Sfx.special();
      } else {
        for (const dir of [-1, 1]) {
          projectiles.push({ type: 'wave', hostile: true, x: e.x + dir * 40, y: GROUND_Y, vx: dir * 300, vy: 0, dmg: e.dmg * 0.8, r: 16, life: 2.0, color: theme.glow });
        }
        shakeT = 0.3; shakeMag = 8; Sfx.heavy();
      }
      return;
    }
    if (e.def.ranged) {
      const dir = Math.sign(player.x - e.x) || 1;
      projectiles.push({ type: 'bolt', hostile: true, x: e.x + dir * 24, y: e.y - 70, vx: dir * 360, vy: 0, dmg: e.dmg, r: 6, life: 2.4, color: '#c89aff' });
      Sfx.hit();
    } else {
      const dxp = Math.abs(player.x - e.x);
      if (dxp <= e.def.reach + 24 && player.y > e.y - e.h - 40) {
        damagePlayer(e.dmg, e.x);
        // the goose also steals
        if (e.def.bossKind === 'goose' && Save.data.money > 0) {
          const steal = Math.min(5 + plan.level, Save.data.money);
          Save.data.money -= steal;
          addFloat(e.x, e.y - e.h - 46, 'THE GOOSE TOOK $' + steal, '#ffd977', true);
        }
      }
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
      if (pr.grenade) pr.vy += 1300 * dt;
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
        if (pr.grenade) {
          burst(pr.x, GROUND_Y - 10, pr.color, 26, 380);
          burst(pr.x, GROUND_Y - 10, '#ffd24a', 14, 300);
          for (const e of [...enemies]) {
            if (Math.abs(e.x - pr.x) < (pr.blast || 130) + e.w / 2) {
              hitEnemy(e, pr.dmg, Math.sign(e.x - pr.x || 1) * 300, -260, true);
            }
          }
          shakeT = 0.3; shakeMag = 8;
          Sfx.heavy();
          projectiles.splice(projectiles.indexOf(pr), 1); continue;
        }
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
        if (pr.noContact) continue; // grenades only hurt when they land
        for (const e of [...enemies]) {
          if (pr.hits && pr.hits.has(e)) continue;
          const [ex, ey, ew, eh] = entRect(e);
          if (overlap(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2, ex, ey, ew, eh)) {
            (pr.hits = pr.hits || new Set()).add(e);
            hitEnemy(e, pr.dmg, Math.sign(pr.vx) * 200, -120, true);
            if (pr.douse && enemies.includes(e)) {
              e.dousedT = 5;
              burst(e.x, e.y - e.h * 0.6, '#e8f4ff', 8, 180, false); // steam
            }
            if (pr.freeze && enemies.includes(e)) e.frozenT = Math.max(e.frozenT, pr.freeze);
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

  function updatePickups(dt) {
    for (const pk of [...pickups]) {
      pk.t += dt; pk.life -= dt;
      pk.vy = (pk.vy || 0) + GRAV * 0.7 * dt;
      pk.y += pk.vy * dt;
      if (pk.y > GROUND_Y - 22) { pk.y = GROUND_Y - 22; pk.vy = 0; }
      if (pk.life <= 0) { pickups.splice(pickups.indexOf(pk), 1); continue; }
      if (mode === 'playing' && Math.hypot(player.x - pk.x, (player.y - 45) - pk.y) < 46) {
        if (pk.type === 'heart') {
          const amt = Math.round(player.stats.maxHp * 0.25);
          player.hp = Math.min(player.stats.maxHp, player.hp + amt);
          addFloat(player.x, player.y - player.h - 16, '+' + amt + ' HP', '#7fd98a', true);
        } else if (pk.type === 'energy') {
          player.energy = Math.min(100, player.energy + 50);
          addFloat(player.x, player.y - player.h - 16, '+ENERGY', '#7fb8ff', true);
        } else if (pk.type === 'giant') {
          player.pwGiantT = 10;
          addFloat(player.x, player.y - player.h - 16, 'GIANT FISTS!', '#ffb04a', true);
        } else if (pk.type === 'magnet') {
          player.pwMagnetT = 10;
          addFloat(player.x, player.y - player.h - 16, 'COIN MAGNET!', '#ffd24a', true);
        } else if (pk.type === 'shield') {
          player.shieldHits = 1;
          addFloat(player.x, player.y - player.h - 16, 'SHIELD UP!', '#7fdcff', true);
        }
        burst(pk.x, pk.y, '#ffffff', 8, 200, false);
        Sfx.buy();
        pickups.splice(pickups.indexOf(pk), 1);
      }
    }
  }

  function updateCoins(dt) {
    for (const c of [...coins]) {
      c.t += dt;
      const dx = player.x - c.x, dy = (player.y - 40) - c.y;
      const dist = Math.hypot(dx, dy);
      if (c.magnet || (c.t > 0.35 && dist < (player.pwMagnetT > 0 ? 4000 : 140))) {
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
    for (const b of [...beams]) {
      b.t -= dt;
      if (b.t <= 0) beams.splice(beams.indexOf(b), 1);
    }
    // ambient embers (span the full visible height, portrait included)
    if (ambient.length < 40 && Math.random() < 0.3) {
      ambient.push({ x: camX + Math.random() * viewW, y: viewH - worldOffY + 10, vy: -rand(18, 60), drift: rand(-14, 14), r: rand(1, 2.6), a: rand(0.15, 0.5) });
    }
    for (const a of [...ambient]) {
      a.y += a.vy * dt; a.x += a.drift * dt;
      if (a.y < -worldOffY - 10) ambient.splice(ambient.indexOf(a), 1);
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
    updatePickups(dt);
    updateFx(dt);

    // level events
    if (mode === 'playing' && plan.event === 'coinrain') {
      coinrainT -= dt;
      if (coinrainT <= 0) {
        coinrainT = rand(1.2, 2.4);
        coins.push({ x: clamp(camX + rand(60, viewW - 60), 50, STAGE_W - 50), y: -worldOffY - 20, v: 2 + Math.floor(Math.random() * 4), vx: rand(-30, 30), vy: 80, t: 0, magnet: false });
      }
    }
    if (mode === 'playing' && plan.event === 'goose' && waveIdx >= 2 && !gooseSpawned) {
      gooseSpawned = true;
      const dir = Math.random() < 0.5 ? 1 : -1;
      enemies.push({
        type: 'cameo',
        def: { name: 'The Goose??', hp: 60, dmg: 0, speed: 430, reach: 0, windup: 1, cooldown: 1, value: 150, size: 1.1, bossKind: 'goose', cameo: true },
        x: dir > 0 ? 30 : STAGE_W - 30, y: GROUND_Y, vx: 0, vy: 0, facing: dir, rollDir: dir,
        w: 60, h: 80, size: 1.1, hp: 60, maxHp: 60, dmg: 0, speed: 430,
        state: 'approach', stateT: 0, cd: 99, pref: 0,
        hurtT: 0, frozenT: 0, flash: 0, walkCyc: 0, animT: 0, shockT: 0, onGround: true,
      });
      addFloat(dir > 0 ? camX + 80 : camX + viewW - 80, GROUND_Y - 140, 'HONK!!', '#ffffff', true);
    }

    // waves (goose cameos don't count toward clearing)
    const combatants = enemies.filter(e => !e.def.cameo).length;
    if (mode === 'playing' && combatants === 0) {
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
    const sky = g.createLinearGradient(0, -worldOffY, 0, GROUND_Y);
    sky.addColorStop(0, theme.sky1); sky.addColorStop(1, theme.sky2);
    g.fillStyle = sky; g.fillRect(camX, -worldOffY, viewW, viewH);

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

    // near props (parallax 0.55) — styled per world
    g.fillStyle = theme.near;
    const r2 = seeded((plan ? plan.level : 1) + 77);
    const propStyle = plan ? plan.world.props : 'castle';
    for (let i = 0; i < 10; i++) {
      const px = i * 300 + r2() * 120 - camX * 0.55;
      const sx = ((px % (viewW + 300)) + viewW + 300) % (viewW + 300) - 150 + camX;
      const h = 150 + r2() * 130, w = 26 + r2() * 22;
      if (propStyle === 'fence') {
        // picket fence run + a bush
        for (let f = 0; f < 4; f++) {
          g.fillRect(sx + f * 16, GROUND_Y - 46, 9, 46);
          g.beginPath(); g.moveTo(sx + f * 16, GROUND_Y - 46); g.lineTo(sx + f * 16 + 4.5, GROUND_Y - 56); g.lineTo(sx + f * 16 + 9, GROUND_Y - 46); g.fill();
        }
        g.fillRect(sx - 6, GROUND_Y - 36, 76, 7);
        g.beginPath(); g.arc(sx + 88, GROUND_Y - 14, 16, 0, 7); g.fill();
      } else if (propStyle === 'pipes') {
        // vertical pipe with elbow and valve wheel
        g.fillRect(sx, GROUND_Y - h, 20, h);
        g.fillRect(sx - 8, GROUND_Y - h, 36, 14);
        g.fillRect(sx - 4, GROUND_Y - h * 0.55, 28, 10);
        g.beginPath(); g.arc(sx + 10, GROUND_Y - h * 0.55 - 12, 9, 0, 7); g.fill();
      } else if (propStyle === 'road') {
        // highway sign: post + diamond
        g.fillRect(sx + 8, GROUND_Y - h * 0.7, 7, h * 0.7);
        g.save();
        g.translate(sx + 11.5, GROUND_Y - h * 0.7 - 4);
        g.rotate(Math.PI / 4);
        g.fillRect(-16, -16, 32, 32);
        g.restore();
      } else {
        // castle tower with crenellations
        g.fillRect(sx, GROUND_Y - h, w, h);
        for (let c = 0; c < 3; c++) g.fillRect(sx - 4 + c * (w + 8) / 3, GROUND_Y - h - 12, (w + 8) / 5, 14);
      }
    }
    if (propStyle === 'road') {
      // center-line dashes on the asphalt
      g.fillStyle = 'rgba(232,226,208,0.25)';
      for (let dx0 = Math.floor(camX / 90) * 90; dx0 < camX + viewW; dx0 += 90) {
        g.fillRect(dx0, GROUND_Y + 26, 42, 5);
      }
    }

    // ground (extends to the bottom of tall portrait screens)
    g.fillStyle = theme.ground;
    g.fillRect(camX, GROUND_Y, viewW, Math.max(VH - GROUND_Y, viewH - worldOffY - GROUND_Y));
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
    const look = o.look || {}; // callers pass finalForm.look when ascended, baseLook otherwise
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
    } else if (look.crawl) {
      // baby crawl: horizontal body on all fours
      hip = [-12, -16]; sh = [10, -20];
      const cw = Math.sin(o.walkCyc || 0) * 5;
      backFoot = [-20 + cw, 0]; frontFoot = [-4 - cw, 0];
      backHand = [4 - cw, 0]; frontHand = [14 + cw, 0];
      const cExt = o.attackExt || 0;
      if (o.attackKey === 'X' || o.attackKey === 'A') frontHand = [18 + 22 * cExt, -12];
      else if (o.attackKey === 'Y') frontFoot = [-8, -6 - 22 * cExt];
      else if (o.attackKey === 'B') frontHand = [12, -24 - 20 * cExt];
    }
    if (look.wobble) lean += Math.sin((o.animT || 0) * 6) * 5; // toddler balance
    const legCol = look.chicken ? '#e8a020' : o.color;
    const legCol2 = look.chicken ? '#b87a10' : o.color2;

    g.lineCap = 'round'; g.lineJoin = 'round';
    const limb = (from, to, width, color) => {
      g.strokeStyle = color; g.lineWidth = width;
      g.beginPath(); g.moveTo(from[0], from[1]); g.lineTo(to[0], to[1]); g.stroke();
    };

    // final-form look overrides (bald / beard / shirtless / muscle / fat)
    const muscleW = look.fat ? 1.9 : (look.muscle || 1);
    let armW = 6 * (1 + (muscleW - 1) * 0.7);
    if (o.weaponStyle === 'muscles' && o.weaponTier > 0) armW *= 1 + o.weaponTier * 0.32; // the arms ARE the weapon
    const torsoCol = look.shirtless ? o.skin : o.color;
    const backArmCol = look.shirtless ? hexMix(o.skin, '#000000', 0.3) : o.color2;
    const frontArmCol = look.shirtless ? o.skin : o.color;

    // back limbs
    if (!look.firetruck) limb([hip[0] + lean * 0.3, hip[1]], backFoot, 7.5, legCol2);
    if (!look.chicken && !look.firetruck) limb([sh[0] + lean * 0.5, sh[1]], backHand, armW, backArmCol);
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
    } else if (look.firetruck) {
      // GIANT FIRETRUCK
      const flash2 = Math.floor((o.animT || 0) * 5) % 2 === 0;
      g.fillStyle = '#c9342a';
      g.beginPath(); g.roundRect(-27, -42, 54, 28, 4); g.fill();
      g.fillStyle = '#f2ee4a'; g.fillRect(-27, -30, 54, 4);        // hi-vis stripe
      g.fillStyle = '#d43b2f';
      g.beginPath(); g.roundRect(10, -54, 17, 13, 3); g.fill();    // cab
      g.fillStyle = '#9fdcff'; g.fillRect(13, -52, 11, 7);         // windshield
      g.fillStyle = flash2 ? '#ff4a3a' : '#4a86e8'; g.fillRect(14, -58, 5, 4);
      g.fillStyle = flash2 ? '#4a86e8' : '#ff4a3a'; g.fillRect(20, -58, 5, 4);
      // ladder — extends when he attacks
      const lext = (o.attackKey ? (o.attackExt || 0) : 0) * 22;
      g.strokeStyle = '#d8dce8'; g.lineWidth = 2.2;
      const lx0 = -14, ly0 = -46, lx1 = 18 + lext, ly1 = -64 - lext * 0.4;
      g.beginPath(); g.moveTo(lx0, ly0 - 3); g.lineTo(lx1, ly1 - 3); g.stroke();
      g.beginPath(); g.moveTo(lx0, ly0 + 3); g.lineTo(lx1, ly1 + 3); g.stroke();
      for (let li = 0.12; li < 1; li += 0.18) {
        const rx = lx0 + (lx1 - lx0) * li, ry = ly0 + (ly1 - ly0) * li;
        g.beginPath(); g.moveTo(rx, ry - 3); g.lineTo(rx, ry + 3); g.stroke();
      }
      // wheels
      g.fillStyle = '#101014';
      g.beginPath(); g.arc(-16, -12, 8, 0, 7); g.fill();
      g.beginPath(); g.arc(16, -12, 8, 0, 7); g.fill();
      g.fillStyle = '#55555f';
      g.beginPath(); g.arc(-16, -12, 3.5, 0, 7); g.fill();
      g.beginPath(); g.arc(16, -12, 3.5, 0, 7); g.fill();
    } else {
    // torso
    limb([hip[0] + lean * 0.3, hip[1]], [sh[0] + lean * 0.5, sh[1]], 13 * muscleW, torsoCol);
    if (look.mecha) {
      // armored chest plate + shoulder pads + core light
      g.fillStyle = '#8a92a8';
      g.beginPath();
      g.moveTo(-11, -64); g.lineTo(13, -64); g.lineTo(9, -38); g.lineTo(-7, -38);
      g.closePath(); g.fill();
      g.fillStyle = '#6a7288';
      g.beginPath(); g.roundRect(-17, -68, 10, 8, 2); g.fill();
      g.beginPath(); g.roundRect(9, -68, 10, 8, 2); g.fill();
      g.fillStyle = '#4adbe8';
      g.fillRect(-2, -58, 7, 5); // arc core
    }
    if (look.fat) {
      g.fillStyle = o.color;
      g.beginPath(); g.ellipse(2 + lean * 0.3, -36 * cf, 13, 11, 0, 0, 7); g.fill();
    }
    if (look.shirtless) {
      // ab definition
      g.strokeStyle = hexMix(o.skin, '#000000', 0.25); g.lineWidth = 1.3;
      for (let ai = 0; ai < 3; ai++) {
        const ay = hip[1] - 4 - ai * 6;
        g.beginPath(); g.moveTo(-4 + lean * 0.4, ay); g.lineTo(5 + lean * 0.4, ay); g.stroke();
      }
    }
    // belt (or diaper)
    if (look.baby) {
      g.fillStyle = '#f6f2e8';
      g.beginPath(); g.roundRect(hip[0] - 7, hip[1] - 5, 14, 9, 4); g.fill();
    } else {
      g.fillStyle = o.accent;
      g.fillRect(-7 + lean * 0.3, hip[1] - 3, 14, 4);
    }
    }
    // front leg
    if (!look.firetruck) limb([hip[0] + lean * 0.3, hip[1]], frontFoot, 7.5, legCol);
    if (look.gown) {
      g.fillStyle = o.color2;
      g.globalAlpha = 0.88;
      g.beginPath();
      g.moveTo(-6 + lean * 0.3, hip[1] - 2);
      g.lineTo(6 + lean * 0.3, hip[1] - 2);
      g.lineTo(16, -1); g.lineTo(-16, -1);
      g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
    if (!look.printer && !look.wrench && !look.chicken && !look.sandwich && !look.firetruck) {
    // head
    const hx = (look.crawl ? 17 : 3) + lean * 0.6;
    const hy = look.crawl ? -26 : headY - 7;
    g.fillStyle = o.hood ? o.color2 : o.skin;
    g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
    if (look.mecha) {
      g.fillStyle = '#8a92a8';
      g.beginPath(); g.roundRect(hx - 8.5, hy - 8, 17, 15, 3); g.fill();
      g.fillStyle = '#4adbe8';
      g.fillRect(hx - 5, hy - 2.5, 11, 3.5); // visor
    } else if (look.baby) {
      // single proud curl + pacifier
      g.strokeStyle = '#b87a3a'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(hx - 1, hy - 10, 2.5, Math.PI * 0.2, Math.PI * 1.4); g.stroke();
      g.fillStyle = '#4ab2e8';
      g.beginPath(); g.arc(hx + 7, hy + 2.5, 2.6, 0, 7); g.fill();
      g.fillStyle = '#2f7bd4';
      g.beginPath(); g.arc(hx + 7, hy + 2.5, 1.1, 0, 7); g.fill();
    } else if (o.hood) {
      g.fillStyle = o.color;
      g.fillRect(-6 + lean * 0.6, headY - 17, 18, 6);
      // glowing eyes
      g.fillStyle = o.eyeColor || '#ffd34a';
      g.fillRect(5 + lean * 0.6, headY - 9, 4, 2.6);
      // world-themed accessory
      const ax = 3 + lean * 0.6, ay = headY - 7;
      switch (o.accessory) {
        case 'gnomehat':
          g.fillStyle = '#d43b2f';
          g.beginPath(); g.moveTo(ax - 8, ay - 8); g.lineTo(ax + 1, ay - 26); g.lineTo(ax + 8, ay - 8); g.closePath(); g.fill();
          break;
        case 'conehat':
          g.fillStyle = '#e8742a';
          g.beginPath(); g.moveTo(ax - 8, ay - 8); g.lineTo(ax, ay - 24); g.lineTo(ax + 8, ay - 8); g.closePath(); g.fill();
          g.fillStyle = '#f2ede0'; g.fillRect(ax - 5, ay - 16, 10, 3);
          break;
        case 'wizardhat':
          g.fillStyle = o.color;
          g.fillRect(ax - 11, ay - 10, 22, 4);
          g.beginPath(); g.moveTo(ax - 7, ay - 10); g.lineTo(ax + 3, ay - 28); g.lineTo(ax + 7, ay - 10); g.closePath(); g.fill();
          break;
        case 'wings': {
          const wf2 = Math.sin((o.animT || 0) * 26) * 4;
          g.fillStyle = 'rgba(232,240,255,0.65)';
          g.beginPath(); g.ellipse(-10, -58 * cf + wf2, 9, 4.5, -0.5, 0, 7); g.fill();
          g.beginPath(); g.ellipse(-13, -54 * cf - wf2, 8, 4, -0.9, 0, 7); g.fill();
          break;
        }
        case 'mask':
          g.fillStyle = '#1d1d24';
          g.fillRect(ax - 8, ay - 3.5, 16, 5);
          g.fillStyle = o.eyeColor || '#ffd34a';
          g.fillRect(ax + 2, ay - 2, 4, 2.4);
          break;
        case 'ears':
          g.fillStyle = o.color2;
          g.beginPath(); g.arc(ax - 6, ay - 10, 4, 0, 7); g.fill();
          g.beginPath(); g.arc(ax + 6, ay - 10, 4, 0, 7); g.fill();
          break;
        case 'imphorns':
          g.fillStyle = '#e8d9b0';
          g.beginPath(); g.moveTo(ax - 6, ay - 8); g.lineTo(ax - 9, ay - 16); g.lineTo(ax - 3, ay - 9); g.fill();
          g.beginPath(); g.moveTo(ax + 6, ay - 8); g.lineTo(ax + 9, ay - 16); g.lineTo(ax + 3, ay - 9); g.fill();
          break;
        case 'antenna':
          g.strokeStyle = o.color2; g.lineWidth = 2;
          g.beginPath(); g.moveTo(ax, ay - 9); g.lineTo(ax, ay - 20); g.stroke();
          g.fillStyle = o.eyeColor || '#ffd34a';
          g.beginPath(); g.arc(ax, ay - 22, 2.5, 0, 7); g.fill();
          break;
        case 'ribs':
          g.strokeStyle = 'rgba(240,238,228,0.8)'; g.lineWidth = 1.6;
          for (let rr2 = 0; rr2 < 3; rr2++) {
            g.beginPath(); g.moveTo(-5, -58 * cf + rr2 * 6); g.lineTo(7, -58 * cf + rr2 * 6); g.stroke();
          }
          break;
        case 'bolts':
          g.fillStyle = '#e8c84a';
          g.beginPath(); g.arc(-3, -56 * cf, 1.8, 0, 7); g.fill();
          g.beginPath(); g.arc(5, -50 * cf, 1.8, 0, 7); g.fill();
          g.beginPath(); g.arc(-1, -44 * cf, 1.8, 0, 7); g.fill();
          break;
        case 'tire':
          g.strokeStyle = '#101014'; g.lineWidth = 6;
          g.beginPath(); g.ellipse(0, -48 * cf, 13, 9, 0.2, 0, 7); g.stroke();
          break;
        case 'drip':
          g.fillStyle = o.color2;
          g.beginPath(); g.arc(-4, -30 * cf, 2.4, 0, 7); g.fill();
          g.beginPath(); g.arc(6, -38 * cf, 2, 0, 7); g.fill();
          break;
      }
    } else if (look.helmet) {
      g.fillStyle = look.helmetColor || '#d43b2f';
      g.beginPath(); g.arc(3 + lean * 0.6, headY - 9, 9.5, Math.PI, 0); g.fill();
      g.fillRect(-9 + lean * 0.6, headY - 10, 24, 3.5);
    } else if (look.cap) {
      g.fillStyle = look.capColor || '#d43b2f';
      g.beginPath(); g.arc(hx, hy - 3.5, 9.2, Math.PI, 0); g.fill();
      g.fillRect(hx - 1, hy - 6, 14, 3.2); // forward brim
    } else if (look.crown) {
      g.fillStyle = look.crownColor || '#ffd24a';
      g.beginPath();
      g.moveTo(hx - 7, hy - 7);
      g.lineTo(hx - 7, hy - 13); g.lineTo(hx - 4, hy - 9.5);
      g.lineTo(hx - 0.5, hy - 14.5); g.lineTo(hx + 3, hy - 9.5);
      g.lineTo(hx + 6.5, hy - 13); g.lineTo(hx + 6.5, hy - 7);
      g.closePath(); g.fill();
    } else if (look.bald) {
      // bald shine
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(1 + lean * 0.6, headY - 9, 6, Math.PI * 1.15, Math.PI * 1.6); g.stroke();
    } else if (look.hair) {
      // messy wrecking-crew mop
      g.fillStyle = look.hairColor || '#6b4423';
      g.beginPath();
      g.arc(-2 + lean * 0.6, headY - 12, 5, 0, 7);
      g.arc(4 + lean * 0.6, headY - 15, 5.5, 0, 7);
      g.arc(10 + lean * 0.6, headY - 11, 4.5, 0, 7);
      g.fill();
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
    if (look.glasses) {
      g.strokeStyle = '#2a2a35'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0.5 + lean * 0.6, headY - 6.5, 3.1, 0, 7); g.stroke();
      g.beginPath(); g.arc(7.5 + lean * 0.6, headY - 6.5, 3.1, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(3.6 + lean * 0.6, headY - 6.5); g.lineTo(4.4 + lean * 0.6, headY - 6.5); g.stroke();
    }
    }
    if (o.boss) { // horns
      g.fillStyle = '#e8d9b0';
      g.beginPath(); g.moveTo(-4, headY - 14); g.lineTo(-9, headY - 26); g.lineTo(-1, headY - 16); g.fill();
      g.beginPath(); g.moveTo(9, headY - 14); g.lineTo(14, headY - 26); g.lineTo(6, headY - 16); g.fill();
    }
    // front arm + weapon
    if (!look.chicken && !look.firetruck) limb([sh[0] + lean * 0.5, sh[1]], frontHand, armW, frontArmCol);
    if (o.weaponTier > 0 && !look.chicken && !look.firetruck) {
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
      } else if (o.weaponStyle === 'noodle') {
        // floppy, wobbling, deeply unthreatening
        const wob = Math.sin((o.animT || 0) * 9) * 4;
        g.strokeStyle = wc; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(frontHand[0], frontHand[1]);
        g.quadraticCurveTo(frontHand[0] + wl * 0.6, frontHand[1] - wl * 0.8, frontHand[0] + wl + 2, frontHand[1] - wl * 0.3 + wob);
        g.stroke();
      } else if (o.weaponStyle === 'teeth') {
        // the chomp: jaws snap shut at the strike point
        if (o.attackKey && (o.attackExt || 0) > 0.25) {
          const jx = frontHand[0] + 5, jy = frontHand[1];
          const open = (1 - (o.attackExt || 0)) * 7 + 2;
          const nTeeth = 3 + Math.min(o.weaponTier, 4);
          g.fillStyle = '#ffffff';
          for (let ti = 0; ti < nTeeth; ti++) {
            g.beginPath();
            g.moveTo(jx + ti * 4, jy - open - 4); g.lineTo(jx + ti * 4 + 2, jy - open + 1); g.lineTo(jx + ti * 4 + 4, jy - open - 4);
            g.fill();
            g.beginPath();
            g.moveTo(jx + ti * 4, jy + open + 4); g.lineTo(jx + ti * 4 + 2, jy + open - 1); g.lineTo(jx + ti * 4 + 4, jy + open + 4);
            g.fill();
          }
        }
      } else if (o.weaponStyle === 'muscles') {
        // bicep definition bumps from tier 2 up
        if (o.weaponTier >= 2) {
          g.fillStyle = o.skin;
          const bx = (sh[0] + frontHand[0]) / 2, by = (sh[1] + frontHand[1]) / 2 - 2;
          g.beginPath(); g.arc(bx, by, 2.2 + o.weaponTier * 0.9, 0, 7); g.fill();
          const bx2 = (sh[0] + backHand[0]) / 2, by2 = (sh[1] + backHand[1]) / 2 - 2;
          g.beginPath(); g.arc(bx2, by2, 2 + o.weaponTier * 0.8, 0, 7); g.fill();
        }
      } else if (o.weaponStyle === 'letters') {
        // his name orbits his fist, spelling doom
        const word = (o.weaponWord || 'RON').slice(0, 9);
        g.font = '700 7px "Segoe UI", sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = wc;
        for (let li = 0; li < word.length; li++) {
          if (word[li] === ' ') continue;
          const ang = (o.animT || 0) * 1.3 + li * (Math.PI * 2 / word.length);
          g.save();
          g.translate(frontHand[0] + Math.cos(ang) * 13, frontHand[1] + Math.sin(ang) * 8);
          g.scale(o.facing, 1); // unmirror the glyphs
          g.fillText(word[li], 0, 0);
          g.restore();
        }
        g.textBaseline = 'alphabetic';
      } else if (o.weaponStyle === 'swat') {
        // her weapon is disappointment; there is nothing to draw
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
        const bladeCol = look.mecha ? '#4adbe8' : wc;
        const bl = wl * (look.mecha ? 1.5 : 1);
        g.strokeStyle = bladeCol;
        if (look.mecha) { g.shadowColor = bladeCol; g.shadowBlur = 9; }
        g.beginPath(); g.moveTo(frontHand[0], frontHand[1]); g.lineTo(frontHand[0] + bl, frontHand[1] - bl * 0.35); g.stroke();
      }
      g.shadowBlur = 0;
    }
    if (look.mecha && !o.onGround) {
      // jet thrusters
      g.fillStyle = 'rgba(255,176,74,0.9)';
      g.beginPath(); g.moveTo(backFoot[0] - 3, backFoot[1] + 1); g.lineTo(backFoot[0], backFoot[1] + 10 + Math.random() * 4); g.lineTo(backFoot[0] + 3, backFoot[1] + 1); g.fill();
      g.beginPath(); g.moveTo(frontFoot[0] - 3, frontFoot[1] + 1); g.lineTo(frontFoot[0], frontFoot[1] + 10 + Math.random() * 4); g.lineTo(frontFoot[0] + 3, frontFoot[1] + 1); g.fill();
    }
    // fists
    if (!look.chicken && !look.firetruck) {
      const fr = look.bigFists ? 8 : 3.6;
      g.fillStyle = o.hood ? o.color2 : o.skin;
      g.beginPath(); g.arc(frontHand[0], frontHand[1], fr, 0, 7); g.fill();
      g.beginPath(); g.arc(backHand[0], backHand[1], fr * 0.94, 0, 7); g.fill();
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

  function drawBoss(g, e) {
    g.save();
    g.translate(e.x, e.y);
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath(); g.ellipse(0, 2, 30 * e.size, 6, 0, 0, 7); g.fill();
    g.scale(e.facing * e.size, e.size);
    const t = e.animT;
    const kind = e.def.bossKind;
    if (kind === 'goose') {
      const wk = Math.sin(e.walkCyc || 0) * 4;
      g.strokeStyle = '#e8a020'; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-6, -18); g.lineTo(-8 + wk, 0); g.stroke();
      g.beginPath(); g.moveTo(6, -18); g.lineTo(8 - wk, 0); g.stroke();
      g.fillStyle = '#b8bcc4';
      g.beginPath(); g.ellipse(-2, -30, 24, 15, 0, 0, 7); g.fill();
      g.fillStyle = '#8a8e98';
      g.beginPath(); g.moveTo(-22, -34); g.lineTo(-36, -48); g.lineTo(-20, -26); g.fill();
      const gf = e.state === 'windup' ? Math.sin(t * 30) * 8 : Math.sin(t * 3) * 2;
      g.fillStyle = '#9a9ea8';
      g.beginPath(); g.ellipse(-4, -34 + gf * 0.3, 14, 8, -0.3, 0, 7); g.fill();
      g.strokeStyle = '#1d1d24'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(12, -34); g.quadraticCurveTo(16, -60, 15, -74); g.stroke();
      g.fillStyle = '#1d1d24';
      g.beginPath(); g.ellipse(16, -76, 8, 6.5, 0.2, 0, 7); g.fill();
      g.fillStyle = '#f2f4f8';
      g.beginPath(); g.ellipse(14, -71.5, 3.5, 2.5, 0.3, 0, 7); g.fill();
      g.fillStyle = '#e8a020';
      g.beginPath(); g.moveTo(23, -77); g.lineTo(32, -74); g.lineTo(23, -71); g.fill();
      g.fillStyle = '#ff3a3a';
      g.beginPath(); g.arc(18, -78, 1.8, 0, 7); g.fill();
    } else if (kind === 'heater') {
      g.fillStyle = '#3a3028';
      g.fillRect(-16, -8, 7, 8); g.fillRect(9, -8, 7, 8);
      g.fillStyle = e.def.color;
      g.beginPath(); g.roundRect(-21, -84, 42, 78, 10); g.fill();
      g.fillStyle = '#8a4a20';
      g.fillRect(-21, -64, 42, 5); g.fillRect(-21, -34, 42, 5);
      g.fillStyle = 'rgba(77,42,16,0.7)';
      g.fillRect(-12, -60, 3, 26); g.fillRect(6, -30, 3, 20);
      g.fillStyle = '#6a7288';
      g.fillRect(-4, -94, 8, 10);
      g.strokeStyle = '#8d9aa8'; g.lineWidth = 3;
      g.beginPath(); g.arc(0, -97, 6, 0, 7); g.stroke();
      g.fillStyle = '#ffffff';
      g.fillRect(-13, -74, 9, 5); g.fillRect(4, -74, 9, 5);
      g.fillStyle = '#1d1d24';
      g.fillRect(-10, -73, 4, 3.5); g.fillRect(7, -73, 4, 3.5);
      g.strokeStyle = '#1d1d24'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(-14, -80); g.lineTo(-4, -77); g.stroke();
      g.beginPath(); g.moveTo(14, -80); g.lineTo(4, -77); g.stroke();
    } else if (kind === 'van') {
      g.fillStyle = '#101014';
      g.beginPath(); g.arc(-20, -6, 9, 0, 7); g.fill();
      g.beginPath(); g.arc(20, -6, 9, 0, 7); g.fill();
      g.fillStyle = e.def.color;
      g.beginPath(); g.roundRect(-36, -46, 72, 38, 6); g.fill();
      g.beginPath(); g.roundRect(-26, -66, 54, 22, 5); g.fill();
      g.fillStyle = '#9fdcff';
      g.fillRect(-22, -62, 16, 13); g.fillRect(-2, -62, 14, 13); g.fillRect(16, -62, 9, 13);
      g.strokeStyle = '#3a3028'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-2, -44); g.lineTo(-2, -12); g.stroke();
      g.fillStyle = '#ffd24a';
      g.beginPath(); g.moveTo(30, -40); g.lineTo(38, -36); g.lineTo(30, -31); g.fill();
      g.strokeStyle = '#3a3028'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(28, -20); g.lineTo(37, -23); g.stroke();
    } else if (kind === 'dragon') {
      g.strokeStyle = e.def.color; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-18, -30); g.quadraticCurveTo(-42, -26, -52, -46); g.stroke();
      const df = Math.sin(t * 5) * 6;
      g.fillStyle = '#5c2ba8';
      g.beginPath(); g.moveTo(-6, -44); g.lineTo(-28, -76 - df); g.lineTo(4, -52); g.fill();
      g.beginPath(); g.moveTo(0, -44); g.lineTo(-14, -82 + df); g.lineTo(8, -50); g.fill();
      g.fillStyle = e.def.color;
      g.beginPath(); g.ellipse(0, -32, 26, 17, 0, 0, 7); g.fill();
      g.strokeStyle = e.def.color2; g.lineWidth = 6;
      g.beginPath(); g.moveTo(-10, -20); g.lineTo(-12, 0); g.stroke();
      g.beginPath(); g.moveTo(10, -20); g.lineTo(12, 0); g.stroke();
      g.strokeStyle = e.def.color; g.lineWidth = 8;
      g.beginPath(); g.moveTo(16, -40); g.quadraticCurveTo(24, -62, 28, -72); g.stroke();
      g.fillStyle = e.def.color;
      g.beginPath(); g.ellipse(30, -74, 9, 6, 0.3, 0, 7); g.fill();
      g.beginPath(); g.moveTo(37, -77); g.lineTo(46, -72); g.lineTo(37, -69); g.fill();
      g.fillStyle = '#e8d9b0';
      g.beginPath(); g.moveTo(26, -80); g.lineTo(22, -91); g.lineTo(29, -81); g.fill();
      g.beginPath(); g.moveTo(31, -81); g.lineTo(31, -93); g.lineTo(36, -80); g.fill();
      g.fillStyle = '#ff4a3a';
      g.beginPath(); g.arc(31, -76, 1.8, 0, 7); g.fill();
    }
    g.restore();
    if (e.flash > 0) {
      g.globalAlpha = Math.min(0.7, e.flash);
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(e.x, e.y - 45 * e.size, 26 * e.size, 45 * e.size, 0, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    if (e.frozenT > 0) {
      g.globalAlpha = 0.45;
      g.fillStyle = '#9fdcff';
      g.beginPath(); g.ellipse(e.x, e.y - 45 * e.size, 28 * e.size, 48 * e.size, 0, 0, 7); g.fill();
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
      if (e.state === 'pile') {
        // collapsed skeleton, plotting its comeback
        g.fillStyle = '#d8d4c8';
        g.beginPath(); g.ellipse(e.x, e.y - 8, 20 * e.size, 8, 0, 0, 7); g.fill();
        g.beginPath(); g.arc(e.x - 8, e.y - 16, 6, 0, 7); g.fill();
        g.fillStyle = '#1a1408';
        g.beginPath(); g.arc(e.x - 10, e.y - 17, 1.5, 0, 7); g.fill();
      } else if (e.def.bossKind) {
        drawBoss(g, e);
      } else if (e.def.signature === 'roll') {
        // an actual rolling tire
        g.fillStyle = 'rgba(0,0,0,0.4)';
        g.beginPath(); g.ellipse(e.x, e.y + 2, 20 * e.size, 5, 0, 0, 7); g.fill();
        g.save();
        g.translate(e.x, e.y - 22 * e.size);
        g.rotate(e.walkCyc || 0);
        g.fillStyle = '#1d1d24';
        g.beginPath(); g.arc(0, 0, 22 * e.size, 0, 7); g.fill();
        g.strokeStyle = '#0d0d12'; g.lineWidth = 3;
        for (let ti = 0; ti < 6; ti++) {
          const ta = ti * Math.PI / 3;
          g.beginPath();
          g.moveTo(Math.cos(ta) * 16 * e.size, Math.sin(ta) * 16 * e.size);
          g.lineTo(Math.cos(ta) * 22 * e.size, Math.sin(ta) * 22 * e.size);
          g.stroke();
        }
        g.fillStyle = '#3a3a42';
        g.beginPath(); g.arc(0, 0, 11 * e.size, 0, 7); g.fill();
        g.fillStyle = '#8d8d96';
        g.beginPath(); g.arc(0, 0, 5 * e.size, 0, 7); g.fill();
        g.restore();
      } else {
        drawFighter(g, {
          x: e.x, y: e.y, facing: e.facing, size: e.size,
          color: e.def.color, color2: e.def.color2, accent: e.def.color2, skin: e.def.color,
          hood: true, boss: !!e.def.boss, accessory: e.def.accessory, eyeColor: e.def.boss ? '#ff4a3a' : '#ffd34a',
          moving: e.state === 'approach' && e.frozenT <= 0, walkCyc: e.walkCyc, animT: e.animT,
          onGround: e.y >= GROUND_Y - 1, attackKey: key,
          hurt: e.hurtT > 0, flash: e.flash, frozen: e.frozenT > 0,
          weaponTier: 0, crouch: false, ascended: false,
        });
      }
      // spawn-modifier overlays
      if (e.frenzy) {
        g.globalAlpha = 0.28 + 0.14 * Math.sin(e.animT * 12);
        g.fillStyle = '#ff4a3a';
        g.beginPath(); g.ellipse(e.x, e.y - e.h * 0.5, e.w * 0.95, e.h * 0.62, 0, 0, 7); g.fill();
        g.globalAlpha = 1;
      }
      if (e.armorHits > 0) {
        g.fillStyle = '#9aa2b5';
        g.fillRect(e.x - 9 * e.size, e.y - e.h * 0.74, 18 * e.size, 13 * e.size);
        g.fillStyle = '#6a7288';
        g.fillRect(e.x - 9 * e.size, e.y - e.h * 0.74, 18 * e.size, 3);
      }
      if (e.elite) {
        g.fillStyle = '#ffd24a';
        const cy2 = e.y - e.h - 4;
        g.beginPath();
        g.moveTo(e.x - 8, cy2); g.lineTo(e.x - 8, cy2 - 8); g.lineTo(e.x - 4, cy2 - 4);
        g.lineTo(e.x, cy2 - 10); g.lineTo(e.x + 4, cy2 - 4); g.lineTo(e.x + 8, cy2 - 8); g.lineTo(e.x + 8, cy2);
        g.closePath(); g.fill();
        if (Math.random() < 0.15) particles.push({ x: e.x + rand(-14, 14), y: e.y - rand(20, e.h), vx: 0, vy: -40, life: 0.4, max: 0.4, r: 1.5, color: '#ffd24a', grav: false });
      }
      // burning overlay for Tim's enemies and Fire Sword victims
      if ((player && player.cdef.enemiesOnFire && !(e.dousedT > 0)) || e.burnT > 0) {
        const fl = Math.sin(e.animT * 20) * 3;
        g.fillStyle = 'rgba(255,122,44,0.8)';
        g.beginPath(); g.moveTo(e.x - 8, e.y - e.h + 2); g.quadraticCurveTo(e.x - 6, e.y - e.h - 13 - fl, e.x, e.y - e.h - 2); g.fill();
        g.fillStyle = 'rgba(255,210,74,0.7)';
        g.beginPath(); g.moveTo(e.x + 1, e.y - e.h + 3); g.quadraticCurveTo(e.x + 7, e.y - e.h - 9 + fl, e.x + 10, e.y - e.h + 4); g.fill();
      }
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
          x: p.x, y: p.y, facing: p.facing, size: p.size * (p.pwGiantT > 0 ? 1.3 : 1),
          color: p.cdef.color, color2: p.cdef.color2, accent: p.cdef.accent, skin: p.cdef.skin,
          moving: Math.abs(p.vx) > 40 && p.onGround, walkCyc: p.walkCyc, animT: p.animT,
          onGround: p.onGround, crouch: p.crouch,
          attackKey: p.attack ? p.attack.key : null, attackExt: attackExt(p.attack),
          hurt: p.hurtT > 0, flash: p.flash, frozen: false,
          weaponTier: p.upg.weapon, weaponStyle: p.cdef.weaponStyle, weaponColors: p.cdef.weaponColors,
          weaponWord: p.upg.weapon > 0 ? trackMeta(p.cdef, 'weapon').tiers[p.upg.weapon - 1].split(' ')[0] : '',
          ascended: p.ascended,
          look: p.ascended ? p.cdef.finalForm.look : p.cdef.baseLook,
        });
      }
      if (p.buffT > 0) {
        g.strokeStyle = p.cdef.accent;
        g.globalAlpha = 0.45 + 0.3 * Math.sin(p.animT * 10);
        g.lineWidth = 3;
        g.beginPath(); g.ellipse(p.x, p.y - 2, 30, 8, 0, 0, 7); g.stroke();
        g.globalAlpha = 1;
      }
      if (p.shieldHits > 0) {
        g.strokeStyle = '#7fdcff';
        g.globalAlpha = 0.45 + 0.2 * Math.sin(p.animT * 6);
        g.lineWidth = 2.5;
        g.beginPath(); g.ellipse(p.x, p.y - 48 * p.size, 34 * p.size, 58 * p.size, 0, 0, 7); g.stroke();
        g.globalAlpha = 1;
      }
    }

    // laser beams
    for (const b of beams) {
      g.globalAlpha = Math.max(0, b.t / b.max);
      g.strokeStyle = b.color; g.lineWidth = 5;
      g.shadowColor = b.color; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
      g.shadowBlur = 0;
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
    }
    g.globalAlpha = 1;

    // projectiles
    for (const pr of projectiles) {
      g.fillStyle = pr.color;
      if (pr.type === 'wave' || pr.type === 'pwave') {
        g.beginPath(); g.moveTo(pr.x - 16, GROUND_Y); g.lineTo(pr.x, GROUND_Y - 34); g.lineTo(pr.x + 16, GROUND_Y); g.fill();
      } else if (pr.shape === 'iceball') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 6);
        g.fillStyle = 'rgba(159,220,255,0.9)';
        g.beginPath(); g.arc(0, 0, pr.r, 0, 7); g.fill();
        g.strokeStyle = '#e8fbff'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(-pr.r * 0.6, 0); g.lineTo(pr.r * 0.6, 0); g.stroke();
        g.beginPath(); g.moveTo(0, -pr.r * 0.6); g.lineTo(0, pr.r * 0.6); g.stroke();
        g.beginPath(); g.moveTo(-pr.r * 0.42, -pr.r * 0.42); g.lineTo(pr.r * 0.42, pr.r * 0.42); g.stroke();
        g.restore();
      } else if (pr.shape === 'pacifier') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 12);
        g.strokeStyle = '#4ab2e8'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(0, 2, 5.5, 0, 7); g.stroke();  // ring
        g.fillStyle = '#f2a3c2';
        g.beginPath(); g.ellipse(0, -4, 6, 3.5, 0, 0, 7); g.fill(); // shield
        g.fillStyle = '#e8b58a';
        g.beginPath(); g.arc(0, -8.5, 3, 0, 7); g.fill();   // teat
        g.restore();
      } else if (pr.shape === 'glasses') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 8);
        g.fillStyle = 'rgba(160,220,255,0.35)';
        g.beginPath(); g.arc(-5, 0, 4, 0, 7); g.fill();
        g.beginPath(); g.arc(5, 0, 4, 0, 7); g.fill();
        g.strokeStyle = '#2a2a35'; g.lineWidth = 2;
        g.beginPath(); g.arc(-5, 0, 4, 0, 7); g.stroke();
        g.beginPath(); g.arc(5, 0, 4, 0, 7); g.stroke();
        g.beginPath(); g.moveTo(-1.5, 0); g.lineTo(1.5, 0); g.stroke();
        g.restore();
      } else if (pr.shape === 'car') {
        g.save();
        g.translate(pr.x, pr.y);
        g.scale(Math.sign(pr.vx) || 1, 1);
        g.fillStyle = pr.color;
        g.beginPath();
        g.moveTo(-34, 6); g.lineTo(-30, -6); g.lineTo(-12, -8); g.lineTo(-6, -15);
        g.lineTo(14, -15); g.lineTo(22, -7); g.lineTo(34, -5); g.lineTo(34, 6);
        g.closePath(); g.fill();
        g.fillStyle = '#1a1a20'; g.fillRect(-30, -2, 64, 3); // racing stripe
        g.fillStyle = '#9fdcff';
        g.beginPath(); g.moveTo(-4, -13); g.lineTo(12, -13); g.lineTo(18, -7); g.lineTo(-8, -7); g.closePath(); g.fill();
        g.fillStyle = '#101014';
        g.beginPath(); g.arc(-20, 8, 7, 0, 7); g.fill();
        g.beginPath(); g.arc(20, 8, 7, 0, 7); g.fill();
        g.fillStyle = '#55555f';
        g.beginPath(); g.arc(-20, 8, 3, 0, 7); g.fill();
        g.beginPath(); g.arc(20, 8, 3, 0, 7); g.fill();
        g.restore();
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

    // pickups
    for (const pk of pickups) {
      if (pk.life < 2 && Math.floor(pk.life * 8) % 2 === 0) continue; // expiring blink
      const py2 = pk.y + Math.sin(pk.t * 4) * 3;
      g.save();
      g.translate(pk.x, py2);
      if (pk.type === 'heart') {
        g.fillStyle = '#ff5a6a';
        g.beginPath();
        g.moveTo(0, 8); g.bezierCurveTo(-12, -2, -7, -13, 0, -5); g.bezierCurveTo(7, -13, 12, -2, 0, 8);
        g.fill();
      } else if (pk.type === 'energy') {
        g.fillStyle = '#4ab2e8';
        g.beginPath();
        g.moveTo(2, -10); g.lineTo(-5, 2); g.lineTo(-1, 2); g.lineTo(-2, 10); g.lineTo(5, -2); g.lineTo(1, -2);
        g.closePath(); g.fill();
      } else if (pk.type === 'giant') {
        g.fillStyle = '#ffb04a';
        g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
        g.fillStyle = '#e8862a';
        for (let k2 = -1; k2 <= 1; k2++) { g.beginPath(); g.arc(k2 * 5, -7, 2.5, 0, 7); g.fill(); }
      } else if (pk.type === 'magnet') {
        g.strokeStyle = '#ff4a3a'; g.lineWidth = 5;
        g.beginPath(); g.arc(0, -2, 7, Math.PI, 0); g.stroke();
        g.fillStyle = '#e8e2d0';
        g.fillRect(-9.5, -2, 5, 6); g.fillRect(4.5, -2, 5, 6);
      } else {
        g.strokeStyle = '#7fdcff'; g.lineWidth = 2.5;
        g.fillStyle = 'rgba(127,220,255,0.25)';
        g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.stroke();
      }
      g.restore();
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
      if (f.word) {
        // comic impact word on a starburst
        g.save();
        g.translate(f.x, f.y);
        g.rotate(f.rot || 0);
        const ws = 1 + Math.max(0, f.t - 0.4) * 3;
        g.scale(ws, ws);
        g.fillStyle = '#ffd24a';
        g.strokeStyle = '#1a1408'; g.lineWidth = 2;
        g.beginPath();
        for (let i2 = 0; i2 < 12; i2++) {
          const a2 = i2 * Math.PI / 6;
          const r2 = i2 % 2 === 0 ? 30 : 17;
          if (i2 === 0) g.moveTo(Math.cos(a2) * r2 * 1.3, Math.sin(a2) * r2);
          else g.lineTo(Math.cos(a2) * r2 * 1.3, Math.sin(a2) * r2);
        }
        g.closePath(); g.fill(); g.stroke();
        g.font = "900 15px 'Segoe UI', sans-serif";
        g.textAlign = 'center';
        g.fillStyle = '#1a1408';
        g.fillText(f.txt, 0, 5);
        g.restore();
        continue;
      }
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
    // portrait phones get a modest HUD boost so text stays readable
    const hs = scale * (SH > SW ? 1.3 : 1);
    g.setTransform(DPR * hs, 0, 0, DPR * hs, 0, 0); // screen space
    const hw = SW / hs;
    const hh = SH / hs;
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

      // combo counter
      if (p.combo >= 3) {
        const pop = 1 + Math.max(0, p.comboPop) * 1.4;
        g.textAlign = 'right';
        g.font = "900 " + Math.round(22 * pop) + "px 'Segoe UI', sans-serif";
        g.fillStyle = p.combo >= 30 ? '#ff4a3a' : p.combo >= 15 ? '#ff9a2c' : '#ffd24a';
        g.fillText('×' + p.combo, hw - 14, 58);
        g.font = "700 9px 'Segoe UI', sans-serif";
        g.fillStyle = '#9a927e';
        g.fillText('COMBO', hw - 14, 69);
        g.textAlign = 'left';
      }

      // money — top right, clear of pause button
      g.textAlign = 'right';
      g.font = "900 17px 'Segoe UI', sans-serif";
      g.fillStyle = '#ffd977';
      g.fillText('$' + Save.data.money.toLocaleString(), hw - 92, 28);

      // level / wave
      g.textAlign = 'center';
      const cx = hw / 2;
      g.font = "900 13px 'Segoe UI', sans-serif";
      g.fillStyle = '#e8e2d0';
      g.fillText(plan.levelName.toUpperCase(), cx, 18);
      g.font = "700 10px 'Segoe UI', sans-serif";
      g.fillStyle = '#9a927e';
      g.fillText('LEVEL ' + plan.level + '  —  WAVE ' + Math.min(waveIdx, plan.waves.length) + ' / ' + plan.waves.length, cx, 34);
      if (plan.event) {
        g.font = "700 9px 'Segoe UI', sans-serif";
        g.fillStyle = theme.glow;
        g.fillText({ coinrain: '☂ COIN RAIN', fog: '~ FOG NIGHT ~', fullsend: '!! FULL SEND !!', goose: '? GOOSE SIGHTING ?' }[plan.event], cx, 46);
      }

      // boss bar
      const boss = enemies.find(e => e.def.boss);
      if (boss) {
        const bw = Math.min(420, hw - 120);
        bar(g, cx - bw / 2, 44, bw, 13, boss.hp / boss.maxHp, '#d43b2f');
        g.font = "900 10px 'Segoe UI', sans-serif"; g.fillStyle = '#ffb0a8';
        g.fillText(boss.def.name.toUpperCase(), cx, 54.5);
      }

      // banner (auto-shrinks to fit narrow screens)
      if (banner) {
        const a = Math.min(1, banner.t / 0.4, (banner.max - banner.t) / 0.25 + 0.2);
        g.globalAlpha = clamp(a, 0, 1);
        const maxW = hw * 0.92;
        let bf = 44;
        g.font = "900 44px 'Segoe UI', sans-serif";
        const tw = g.measureText(banner.text).width;
        if (tw > maxW) {
          bf = Math.max(18, Math.floor(44 * maxW / tw));
          g.font = "900 " + bf + "px 'Segoe UI', sans-serif";
        }
        const by = hh * 0.3;
        g.fillStyle = '#f3c14b';
        g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 14;
        g.fillText(banner.text, cx, by);
        if (banner.sub) {
          let sf = 16;
          g.font = "700 16px 'Segoe UI', sans-serif";
          const sw2 = g.measureText(banner.sub).width;
          if (sw2 > maxW) {
            sf = Math.max(10, Math.floor(16 * maxW / sw2));
          }
          g.font = "700 " + sf + "px 'Segoe UI', sans-serif";
          g.fillStyle = '#e8e2d0';
          g.fillText(banner.sub, cx, by + bf * 0.5 + 14);
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
    ctx.translate(-camX + ox, worldOffY + oy);
    drawBackground();
    if (mode !== 'idle') drawEntities();
    if (mode !== 'idle' && plan && plan.event === 'fog' && player) {
      const fg = ctx.createRadialGradient(player.x, player.y - 50, 240, player.x, player.y - 50, 430);
      fg.addColorStop(0, 'rgba(6,6,12,0)');
      fg.addColorStop(1, 'rgba(6,6,12,0.88)');
      ctx.fillStyle = fg;
      ctx.fillRect(camX - 20, -worldOffY - 20, viewW + 40, viewH + 40);
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // vignette
    const w = SW, h = SH;
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
    // watchdog: iOS fires rotation events before its sizes settle — re-measure
    // every frame so the canvas can never stay stretched or stale
    const m = measure();
    if (m[0] !== SW || m[1] !== SH || (window.devicePixelRatio || 1) !== DPR) resize();
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
      look: ascended ? cdef.finalForm.look : cdef.baseLook,
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
        t: e.type, name: e.def.name, hp: Math.round(e.hp), x: Math.round(e.x), y: Math.round(e.y),
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
