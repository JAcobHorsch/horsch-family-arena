// ===== Horsch Family Arena — core engine: combat, AI, waves, rendering =====

const Game = (() => {
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  // the world renders to a low-res buffer and upscales with nearest-neighbor:
  // everything becomes cohesive chunky pixel art (2 world units per pixel)
  const lowCvs = document.createElement('canvas');
  const lctx = lowCvs.getContext('2d');
  // far layers render even smaller and upscale WITH smoothing = tilt-shift blur
  const bgCvs = document.createElement('canvas');
  const bctx = bgCvs.getContext('2d');
  let rctx = ctx; // active render target for world-pass drawing
  let lowW = 1, lowH = 1, bgW = 1, bgH = 1;

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
  // world-buffer pixels per world unit. Was locked to 0.5 (the chunky pixel-art
  // look); now tracks device resolution, with a pixel budget so phones keep 60fps.
  let RES = 1;
  const IS_TOUCH = window.matchMedia && matchMedia('(pointer: coarse)').matches;
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
    const budget = IS_TOUCH ? 1300000 : 2400000; // max world-buffer pixels
    RES = Math.max(0.5, Math.min(scale * DPR, 3, Math.sqrt(budget / (viewW * viewH))));
    lowW = Math.max(160, Math.ceil(viewW * RES));
    lowH = Math.max(120, Math.ceil(viewH * RES));
    lowCvs.width = lowW;
    lowCvs.height = lowH;
    // the far pass stays at quarter-view resolution regardless of RES —
    // its softness IS the tilt-shift, only the gameplay plane sharpens
    bgW = Math.max(80, Math.ceil(viewW / 4));
    bgH = Math.max(60, Math.ceil(viewH / 4));
    bgCvs.width = bgW;
    bgCvs.height = bgH;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => { resize(); setTimeout(resize, 300); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  // ---------- World state ----------
  let mode = 'idle';        // idle | playing | victory | defeat
  let paused = false;
  let plan = null, theme = themeFor(1);
  let player = null, enemies = [], projectiles = [], coins = [], particles = [], floats = [], minions = [], beams = [], pickups = [], slashes = [], platforms = [], lights = [];

  // additive light splash (impacts, kills, specials)
  function spawnLight(x, y, r, color, a) {
    if (lights.length < 24) lights.push({ x, y, r, color, a: a || 0.4, t: 0.3, max: 0.3 });
  }

  // nearest standable surface at or below y for a given x
  function floorAt(x, y) {
    let f = GROUND_Y;
    for (const pl of platforms) {
      if (Math.abs(x - pl.x) < pl.w / 2 && pl.y >= y - 4 && pl.y < f) f = pl.y;
    }
    return f;
  }
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
      chainStep: 0, chainT: 0, rangedCd: 0,
      dropT: 0, standPlat: null, jumpCut: false,
      pwGiantT: 0, pwMagnetT: 0, shieldHits: 0,
      attack: null, hurtT: 0, invulnT: 0, walkCyc: 0, animT: 0, flash: 0,
      ascended: upg.ascended, size: upg.ascended ? (cdef.finalForm.sizeMult || 1.12) : (cdef.baseSize || 1),
    };
    enemies = []; projectiles = []; coins = []; particles = []; floats = []; minions = []; beams = []; pickups = []; slashes = []; lights = [];
    // floating one-way platforms: two low, one high placed a short hop
    // from the left low platform so every fighter can climb the tier
    platforms = [];
    const px1 = 380 + rand(-60, 60);
    platforms.push({ x: px1, y: GROUND_Y - 126 + rand(-8, 8), w: rand(150, 200) });
    platforms.push({ x: px1 + rand(195, 240), y: GROUND_Y - 190 + rand(-8, 8), w: rand(140, 180) });
    platforms.push({ x: STAGE_W - 380 + rand(-60, 60), y: GROUND_Y - 126 + rand(-8, 8), w: rand(150, 200) });
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
    // bake the level's terrain art up front so the first frame doesn't hitch
    getCliffStrip(plan.world);
    for (const pl of platforms) { pl.cvs = buildPlatformIsland(pl.w, plan.world); pl.cvsRes = RES; }
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
      // half the snipers take the high ground
      if (t.ranged && platforms.length && Math.random() < 0.5) {
        const pl = platforms[Math.floor(Math.random() * platforms.length)];
        e.plat = pl;
        e.x = clamp(pl.x + rand(-pl.w / 4, pl.w / 4), 60, STAGE_W - 60);
        e.y = pl.y;
      }
      enemies.push(e);
      burst(e.x, e.y - e.h / 2, theme.glow, 12, 200, false);
    }
    setBanner('WAVE ' + (waveIdx + 1) + ' / ' + plan.waves.length, plan.boss && waveIdx === plan.waves.length - 1 ? 'THE BOSS APPROACHES' : '', 1.3);
    waveIdx++;
  }

  function winLevel() {
    mode = 'victory'; timeScale = 0.55; endTimer = 2.0; endFired = false;
    // advance + bank immediately so quitting during the slow-mo can't
    // farm bounties or replay the cleared level
    Save.data.level += 1;
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
    spawnLight(e.x, e.y - e.h * 0.55, heavy ? 95 : 55, '#ffcf7a', heavy ? 0.5 : 0.3);
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
        e.burnT = 0; // bones don't burn; the pile must get its comeback chance
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
    if (e.stolen) v += e.stolen * (e.def.cameo ? 1 : 2); // pandas pay double; the goose just gives it back
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
    spawnLight(e.x, e.y - 44, e.def.boss ? 220 : 120, '#ffd24a', 0.55);
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

  // ---------- Ranged weapon (Y button) ----------
  function fireRanged() {
    const p = player, rw = p.cdef.rangedWeapon, def = rw.proj;
    const dmg = (def.dmg || 9) * p.stats.rangedMult;
    const n = def.count || 1;
    for (let i = 0; i < n; i++) {
      projectiles.push({
        type: 'fire', hostile: false, x: p.x + p.facing * 26, y: p.y - (def.arc ? 74 : 56) - i * 12,
        vx: p.facing * (def.speed || 520), vy: def.arc ? -170 : (def.spreadY ? (i - (n - 1) / 2) * def.spreadY : 0),
        dmg, r: def.r || 6, life: def.life || 1.3,
        pierce: !!def.pierce, shape: def.shape, bounce: def.bounce, arcGrav: def.arc && !def.bounce,
        douse: def.douse, freeze: def.freeze, bounty: def.bounty,
        dir: p.facing, color: p.cdef.color,
      });
    }
    p.rangedCd = def.cd || 0.55;
    p.attack = { key: 'X1', su: 0.04, ac: 0.06, rec: 0.14, t: 0, hits: new Set(), def: null };
    Sfx.jump();
  }

  // ---------- Specials (data-driven — see the special move library in data.js) ----------
  function fireSpecial() {
    const p = player, st = p.stats;
    // final forms may carry a whole replacement special (e.g. Ryan Dugan)
    const def = (p.ascended && p.cdef.finalForm.special) || p.cdef.special;
    if (p.energy < st.energyCost) { addFloat(p.x, p.y - p.h - 18, 'NO ENERGY', '#7fb8ff'); Sfx.denied(); return; }
    p.energy -= st.energyCost;
    Sfx.special();
    spawnLight(p.x, p.y - 50, 150, (p.cdef.special && p.cdef.special.color) || p.cdef.color, 0.6);
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
    if (p.rangedCd > 0) p.rangedCd -= dt;
    if (p.chainT > 0) { p.chainT -= dt; if (p.chainT <= 0) p.chainStep = 0; }
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
        if (code === 'JUMP' && p.onGround && p.crouch && p.standPlat) {
          // down+jump: drop through the platform
          p.dropT = 0.28; p.onGround = false; p.standPlat = null; p.y += 6;
        } else if (code === 'JUMP' && p.onGround && !p.crouch) { p.vy = -760; p.onGround = false; p.jumpCut = false; Sfx.jump(); }
        else if (code === 'A' && !attacking) fireSpecial();
        else if (code === 'Y' && !p.attack && p.rangedCd <= 0) fireRanged();
        else if (code === 'B' && !p.attack) {
          const def = ATTACKS.B;
          const sp = p.cdef.atkSpeed;
          p.attack = { key: 'B', def, su: def.startup * sp, ac: def.active * sp, rec: def.recovery * sp, t: 0, hits: new Set() };
        } else if (code === 'X') {
          // real combo string: jab -> cross -> finisher, recovery-cancellable
          const a = p.attack;
          const canFresh = !a;
          const canCancel = a && a.chain !== undefined && a.chain < 2 && a.t > a.su + a.ac * 0.5;
          if (canFresh || canCancel) {
            const step = (canCancel || p.chainT > 0) ? Math.min(p.chainStep, 2) : 0;
            const def = CHAIN[step];
            const sp = p.cdef.atkSpeed;
            p.attack = { key: def.pose, chain: step, def, su: def.startup * sp, ac: def.active * sp, rec: def.recovery * sp, t: 0, hits: new Set(), slashed: false };
            p.chainStep = step >= 2 ? 0 : step + 1;
            p.chainT = step >= 2 ? 0 : 0.9;
            if (p.onGround) p.vx = p.facing * def.lunge; // step into every hit
          }
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
    // variable jump height: releasing jump early cuts the arc
    if (!p.onGround && p.vy < -200 && !Input.jumpHeld && !p.jumpCut && !(p.ascended && p.cdef.finalForm.fly)) {
      p.vy *= 0.5; p.jumpCut = true;
    }
    const wasAirborne = !p.onGround;
    const prevY = p.y;
    p.y += p.vy * dt;
    if (p.y < 150) { p.y = 150; if (p.vy < 0) p.vy = 0; } // flight ceiling
    if (p.dropT > 0) p.dropT -= dt;
    p.onGround = false;
    if (p.vy >= 0) {
      if (p.dropT <= 0) {
        // one-way platforms: land only when falling across the top
        for (const pl of platforms) {
          if (prevY <= pl.y + 1 && p.y >= pl.y && Math.abs(p.x - pl.x) < pl.w / 2 + 8) {
            p.y = pl.y; p.vy = 0; p.onGround = true; p.standPlat = pl;
            break;
          }
        }
      }
      if (!p.onGround && p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.onGround = true; p.standPlat = null; }
    }
    if (wasAirborne && p.onGround) p.landT = 0.11; // landing squash
    if (p.landT > 0) p.landT -= dt;

    // attack progression + hit detection
    if (p.attack) {
      const a = p.attack;
      a.t += dt;
      if (a.def && a.t >= a.su && a.t < a.su + a.ac) {
        const d = a.def;
        if (!a.slashed) {
          a.slashed = true;
          slashes.push({
            x: p.x + p.facing * ((d.range || 90) * 0.5), y: p.y - 52,
            facing: p.facing, t: 0.16, max: 0.16,
            size: (d.range || 100) * 0.7, color: p.cdef.accent, up: a.key === 'B',
          });
        }
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
            hitEnemy(e, d.dmg * st.dmg * (p.buffT > 0 ? p.buffDmg : 1) * (p.pwGiantT > 0 ? 1.5 : 1), dir * d.kb, d.kbY, a.key === 'X3' || a.key === 'B');
            const wb = p.cdef.weaponBurn;
            if (wb && p.upg.weapon >= wb.tier && enemies.includes(e) && e.state !== 'pile') e.burnT = wb.dur;
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
    if (e.burnT > 0 && e.state !== 'pile') {
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
    const eFloor = (e.plat && Math.abs(e.x - e.plat.x) < e.plat.w / 2 + 12) ? e.plat.y : GROUND_Y;
    if (e.plat && eFloor === GROUND_Y) e.plat = null; // knocked off the ledge
    if (e.y >= eFloor) { e.y = eFloor; e.vy = 0; e.onGround = true; }
    e.vx *= Math.pow(0.0015, dt); // friction on knockback impulse
    // cameos are allowed to leave the stage — that's their whole exit strategy
    e.x = e.def.cameo ? e.x + e.vx * dt : clamp(e.x + e.vx * dt, 40, STAGE_W - 40);

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
        if (!e.chargeHit && Math.abs(e.x - player.x) < 70 && player.y > e.y - 100) {
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
        if (Math.abs(player.x - e.x) < 280 && Math.abs(player.y - e.y) < 120) damagePlayer(e.dmg * 0.9, e.x);
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
      // bolts leave each body's actual muzzle: grease spitter's mouth,
      // camera's lens, mage's thrust hands, sprinkler's rotor nozzle
      const muzY = e.def.body === 'grease' ? 42 : e.def.body === 'camera' ? 54 : e.def.body === 'mage' ? 55 : 70;
      const by = e.y - muzY;
      // elevated snipers aim down at the player instead of firing level
      const tFly = Math.max(0.25, Math.abs(player.x - (e.x + dir * 24)) / 360);
      const bvy = e.plat ? clamp(((player.y - 50) - by) / tFly, -160, 340) : 0;
      projectiles.push({ type: 'bolt', hostile: true, x: e.x + dir * 24, y: by, vx: dir * 360, vy: bvy, dmg: e.dmg, r: 6, life: 2.4, color: '#c89aff' });
      Sfx.hit();
    } else {
      const dxp = Math.abs(player.x - e.x);
      if (dxp <= e.def.reach + 24 && player.y > e.y - e.h - 40 && player.y - e.y > -60) {
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
    if (target && best < 70 && Math.abs(target.y - m.y) < 70 && m.cd <= 0) {
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
      if (pr.arcGrav) pr.vy += 1300 * dt;
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
      const pkFloor = floorAt(pk.x, pk.y - 16);
      if (pk.y > pkFloor - 22) { pk.y = pkFloor - 22; pk.vy = 0; }
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
      const cFloor = floorAt(c.x, c.y - 10);
      if (c.y > cFloor - 6 && !c.magnet) { c.y = cFloor - 6; c.vy *= -0.45; c.vx *= 0.8; }
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
    for (const s of [...slashes]) {
      s.t -= dt;
      if (s.t <= 0) slashes.splice(slashes.indexOf(s), 1);
    }
    for (const li of [...lights]) {
      li.t -= dt;
      if (li.t <= 0) lights.splice(lights.indexOf(li), 1);
    }
    // per-world ambiance: fireflies, sewer drips, road dust, bats & embers
    if (ambient.length < 40 && Math.random() < 0.3) {
      const props = plan ? plan.world.props : 'castle';
      if (props === 'fence') {
        // blossom petals and leaves drifting down from the trees (sparse)
        if (Math.random() < 0.55) ambient.push({ kind: 'petal', x: camX + Math.random() * viewW, y: -worldOffY - 8, vy: rand(24, 48), drift: rand(-30, 10), r: rand(1.4, 2.2), a: rand(0.4, 0.75), color: Math.random() < 0.6 ? '#ffd6e8' : '#8fd06a', t: rand(0, 9) });
      } else if (props === 'pipes') {
        ambient.push({ kind: 'drip', x: camX + Math.random() * viewW, y: -worldOffY - 8, vy: rand(200, 300), drift: 0, r: rand(1.5, 2.6), a: rand(0.4, 0.7), color: '#7fe2c0', t: 0 });
      } else if (props === 'road') {
        ambient.push({ kind: 'dust', x: camX + (Math.random() < 0.5 ? -10 : viewW + 10), y: GROUND_Y - rand(6, 90), vy: rand(-8, 8), drift: rand(60, 130) * (Math.random() < 0.5 ? 1 : -1), r: rand(1, 2.4), a: rand(0.2, 0.45), color: '#c9b8a0', t: 0 });
      } else if (Math.random() < 0.18) {
        ambient.push({ kind: 'bat', x: camX + (Math.random() < 0.5 ? -12 : viewW + 12), y: rand(-worldOffY + 40, GROUND_Y - 220), vy: 0, drift: rand(90, 150) * (Math.random() < 0.5 ? 1 : -1), r: 2, a: 0.8, t: rand(0, 9) });
      } else {
        ambient.push({ kind: 'ember', x: camX + Math.random() * viewW, y: viewH - worldOffY + 10, vy: -rand(18, 60), drift: rand(-14, 14), r: rand(1, 2.6), a: rand(0.15, 0.5), t: 0 });
      }
    }
    for (const a of [...ambient]) {
      a.t = (a.t || 0) + dt;
      a.y += a.vy * dt; a.x += a.drift * dt;
      if (a.kind === 'bat') a.y += Math.sin(a.t * 4) * 30 * dt;
      if (a.y < -worldOffY - 14 || a.y > viewH - worldOffY + 20 || a.x < camX - 50 || a.x > camX + viewW + 50) {
        ambient.splice(ambient.indexOf(a), 1);
      } else if (a.kind === 'drip' && a.y >= GROUND_Y - 4) {
        burst(a.x, GROUND_Y - 4, '#7fe2c0', 3, 90, false);
        ambient.splice(ambient.indexOf(a), 1);
      }
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

  // subtle print-grain overlay, built once
  let grainPattern = null;
  function getGrain() {
    if (grainPattern) return grainPattern;
    const pc = document.createElement('canvas');
    pc.width = 200; pc.height = 200;
    const q = pc.getContext('2d');
    for (let i = 0; i < 420; i++) {
      q.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.04).toFixed(3) + ')';
      q.fillRect(Math.random() * 200, Math.random() * 200, 1.4, 1.4);
    }
    for (let i = 0; i < 60; i++) {
      q.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.05).toFixed(3) + ')';
      q.fillRect(Math.random() * 200, Math.random() * 200, 2.2, 1);
    }
    grainPattern = ctx.createPattern(pc, 'repeat');
    return grainPattern;
  }

  // tinted checkerboard pattern for dither bands, cached per color.
  // cells are 8 user units so they survive the quarter-res far pass.
  const tintPats = {};
  function checkerPat(color) {
    if (tintPats[color]) return tintPats[color];
    const pc = document.createElement('canvas');
    pc.width = 16; pc.height = 16;
    const q = pc.getContext('2d');
    q.fillStyle = color;
    q.fillRect(0, 0, 8, 8); q.fillRect(8, 8, 8, 8);
    return tintPats[color] = ctx.createPattern(pc, 'repeat');
  }

  // per-world environment palettes — the Owlboy overhaul's single source of truth.
  // Hand-tuned ramps from the art-direction pass: hue-shifted shadows (cool),
  // warm keys, outlines as darkened hues (never black).
  const ENV_TABLES = {
    home: {
      bands: ['#2f86d9', '#4aa1e6', '#6cbbf0', '#9ad6f6', '#cfeef7'],
      cumulus: ['#fff8e6', '#f6faff', '#c6dcf0', '#8fb2d8'],
      seaBack: '#c6dcf0', seaFront: '#e9f2fb', mist: '#f6faff', mistA: 0.35,
      cliffLite: '#a5865a', cliffMid: '#7d5f42', cliffDark: '#5a4630', cliffInk: '#3d2f20',
      soil: '#6b4a30', soilDark: '#4c3320',
      grassDark: '#2e6b28', grass: '#4e9a3c', grassLite: '#78c850', grassRim: '#a8e070',
      rock: '#8d8d96', rockLite: '#b5b5c0',
      vine: '#3a7a30', vineInk: '#245020', leaf: '#5aae44',
    },
    pipes: {
      bands: ['#0c1a2c', '#11333a', '#175247', '#20705a', '#2c8f70'],
      cumulus: ['#bfeee0', '#9fd8c8', '#5a9a8a', '#2f6a5c'],
      seaBack: '#051512', seaFront: '#051512', mist: '#4ae8b2', mistA: 0.2,
      cliffLite: '#2e6e5c', cliffMid: '#1d4a40', cliffDark: '#12332c', cliffInk: '#0a201b',
      soil: '#274238', soilDark: '#182c24',
      grassDark: '#155a44', grass: '#2a8a64', grassLite: '#3fae86', grassRim: '#7fe2c0',
      rock: '#4a6a60', rockLite: '#7a9a8e',
      vine: '#7a5a38', vineInk: '#4c3820', leaf: '#3ad4a4',
    },
    road: {
      bands: ['#6a4a8e', '#9a5a86', '#d4707a', '#f09a62', '#ffc76a'],
      cumulus: ['#ffe0b0', '#ff9a80', '#a05a78', '#5f3a60'],
      seaBack: '#8a5568', seaFront: '#b87a70', mist: '#ffd8a0', mistA: 0.3,
      cliffLite: '#9a7a58', cliffMid: '#6e523c', cliffDark: '#4c3828', cliffInk: '#33251a',
      soil: '#5f4a38', soilDark: '#443428',
      grassDark: '#7a5828', grass: '#a87c3c', grassLite: '#c9a05a', grassRim: '#e8cf8a',
      rock: '#6e6258', rockLite: '#948678',
      vine: '#c9a86a', vineInk: '#7a5c34', leaf: '#c9a86a',
    },
    fantasy: {
      bands: ['#201a4e', '#2e2668', '#443684', '#6a4a9e', '#9a6ab4'],
      cumulus: ['#cabcf0', '#9a8ad0', '#5f4c96', '#352a60'],
      seaBack: '#4a3a78', seaFront: '#372a60', mist: '#8a6ae8', mistA: 0.18,
      cliffLite: '#5a4680', cliffMid: '#40305c', cliffDark: '#2c2044', cliffInk: '#1a1030',
      soil: '#38284a', soilDark: '#281c38',
      grassDark: '#3f2a70', grass: '#5a3f96', grassLite: '#7a5ac0', grassRim: '#a88ae8',
      rock: '#4a3f68', rockLite: '#7a6aa0',
      vine: '#7a4ae8', vineInk: '#3a2470', leaf: '#e8b8ff',
    },
  };
  const WORLD_SEED = { home: 1, pipes: 2, road: 3, fantasy: 4 };

  // theme-derived colors, computed once per world instead of per frame
  let shadeCache = null, shadeCacheKey = '';
  function themeShades() {
    const key2 = plan ? plan.world.id : 'home';
    if (shadeCacheKey === key2 && shadeCache) return shadeCache;
    shadeCacheKey = key2;
    const E = ENV_TABLES[key2] || ENV_TABLES.home;
    shadeCache = {
      E,
      bands: E.bands,
      farDeep: hexMix(theme.far, '#000000', 0.4),
      towerCol: hexMix(theme.far, '#000000', 0.35),
      houseBody: hexMix(theme.far, '#ffffff', 0.1),
      houseRoof: hexMix(theme.far, '#000000', 0.25),
      winDark: hexMix(theme.far, '#000000', 0.35),
      pipeCol: hexMix(theme.far, '#ffffff', 0.12),
      wallCol: hexMix(theme.far, '#ffffff', 0.08),
      billPost: hexMix(theme.far, '#000000', 0.2),
      billBoard: hexMix(theme.far, '#ffffff', 0.16),
    };
    return shadeCache;
  }

  // ---- tree construction kit (Owlboy canopy-blob style) ----
  const OAK_P = { trunk: '#7a5230', trunkDark: '#57381e', c1: '#2e6b28', c2: '#4e9a3c', c3: '#78c850', rim: '#a8e070' };
  const BLOSSOM_P = { trunk: '#6e4a3a', trunkDark: '#4c3128', c1: '#b06090', c2: '#d888b8', c3: '#f0aed0', rim: '#ffd6e8' };
  const OAK_B = [[-14, -40, 13], [13, -42, 12], [0, -52, 15], [-7, -50, 11], [8, -49, 10]];
  function drawOak(g, x, baseY, s, P) {
    g.fillStyle = P.trunkDark; g.fillRect(x - 3.5 * s, baseY - 34 * s, 7 * s, 34 * s);
    g.fillStyle = P.trunk; g.fillRect(x - 3.5 * s, baseY - 34 * s, 4.5 * s, 34 * s);
    g.strokeStyle = P.trunkDark; g.lineWidth = 3 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, baseY - 26 * s); g.lineTo(x - 10 * s, baseY - 40 * s); g.stroke();
    g.beginPath(); g.moveTo(x, baseY - 28 * s); g.lineTo(x + 9 * s, baseY - 42 * s); g.stroke();
    g.fillStyle = P.c1;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(x + OAK_B[i][0] * s, baseY + OAK_B[i][1] * s, (OAK_B[i][2] + 2.5) * s, 0, 7); g.fill();
    }
    g.fillStyle = P.c2;
    for (const b of OAK_B) { g.beginPath(); g.arc(x + (b[0] - 1) * s, baseY + (b[1] - 1.5) * s, b[2] * s, 0, 7); g.fill(); }
    g.fillStyle = P.c3;
    for (const b of OAK_B) {
      g.beginPath(); g.arc(x + b[0] * s - b[2] * s * 0.35, baseY + b[1] * s - b[2] * s * 0.35, b[2] * s * 0.55, 0, 7); g.fill();
    }
    g.fillStyle = P.rim;
    for (const b of [OAK_B[2], OAK_B[3], OAK_B[1]]) {
      g.beginPath(); g.arc(x + b[0] * s - b[2] * s * 0.4, baseY + b[1] * s - b[2] * s * 0.62, 3 * s, 0, 7); g.fill();
    }
    g.fillStyle = P.c1; g.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(x + (4 + i * 5) * s, baseY + (-38 - (i % 2) * 6) * s, 2 * s, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }
  const PETAL_SPOTS = [[-22, -58], [18, -62], [-8, -66], [24, -46], [-26, -44]];
  function drawBlossom(g, x, baseY, s) {
    drawOak(g, x, baseY, s, BLOSSOM_P);
    g.fillStyle = '#ffd6e8';
    for (const p of PETAL_SPOTS) { g.beginPath(); g.arc(x + p[0] * s, baseY + p[1] * s, 1.5 * s, 0, 7); g.fill(); }
  }
  function drawPipeCoral(g, x, baseY, s) {
    g.fillStyle = '#7a4520'; g.fillRect(x - 4 * s, baseY - 30 * s, 8 * s, 30 * s);
    g.fillStyle = '#b06a32'; g.fillRect(x - 4 * s, baseY - 30 * s, 5 * s, 30 * s);
    g.fillStyle = '#7a4520';
    g.fillRect(x - 6.5 * s, baseY - 30 * s, 13 * s, 4 * s);
    g.fillRect(x - 6.5 * s, baseY - 16 * s, 13 * s, 4 * s);
    g.fillStyle = '#e8c84a';
    g.beginPath(); g.arc(x - 2 * s, baseY - 22 * s, 1.2 * s, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 2 * s, baseY - 8 * s, 1.2 * s, 0, 7); g.fill();
    g.fillStyle = '#1c6a58';
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(x + OAK_B[i][0] * s * 0.8, baseY + (OAK_B[i][1] * 0.9 - 8) * s, (OAK_B[i][2] + 2.5) * s * 0.8, 0, 7); g.fill();
    }
    g.fillStyle = '#2fae9a';
    for (const b of OAK_B) { g.beginPath(); g.arc(x + (b[0] - 1) * s * 0.8, baseY + ((b[1] - 1.5) * 0.9 - 8) * s, b[2] * s * 0.8, 0, 7); g.fill(); }
    g.fillStyle = '#4ae8c8';
    for (const b of OAK_B) {
      g.beginPath(); g.arc(x + (b[0] - b[2] * 0.35) * s * 0.8, baseY + ((b[1] - b[2] * 0.35) * 0.9 - 8) * s, b[2] * s * 0.44, 0, 7); g.fill();
    }
    g.fillStyle = '#3ad4a4';
    for (const b of [OAK_B[2], OAK_B[3], OAK_B[1]]) {
      const gx = x + b[0] * s * 0.8, gy = baseY + ((b[1] - b[2] * 0.5) * 0.9 - 8) * s;
      g.globalAlpha = 0.25; g.beginPath(); g.arc(gx, gy, 5 * s, 0, 7); g.fill();
      g.globalAlpha = 0.9; g.beginPath(); g.arc(gx, gy, 1.6 * s, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }
  function drawDeadTree(g, x, baseY, s) {
    g.fillStyle = '#3a2820';
    g.beginPath();
    g.moveTo(x - 4 * s, baseY);
    g.quadraticCurveTo(x - 2 * s, baseY - 20 * s, x - 1 * s, baseY - 34 * s);
    g.lineTo(x + 1.5 * s, baseY - 34 * s);
    g.quadraticCurveTo(x + 3 * s, baseY - 18 * s, x + 5 * s, baseY);
    g.closePath(); g.fill();
    g.strokeStyle = '#3a2820'; g.lineWidth = 3.5 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, baseY - 30 * s); g.lineTo(x - 9 * s, baseY - 42 * s); g.lineTo(x - 14 * s, baseY - 40 * s); g.stroke();
    g.beginPath(); g.moveTo(x, baseY - 32 * s); g.lineTo(x + 8 * s, baseY - 44 * s); g.lineTo(x + 11 * s, baseY - 50 * s); g.stroke();
    g.lineWidth = 1.5 * s;
    g.beginPath(); g.moveTo(x - 9 * s, baseY - 42 * s); g.lineTo(x - 11 * s, baseY - 48 * s); g.stroke();
    g.beginPath(); g.moveTo(x + 8 * s, baseY - 44 * s); g.lineTo(x + 13 * s, baseY - 45 * s); g.stroke();
    g.strokeStyle = '#5f4330'; g.lineWidth = 1.5 * s;
    g.beginPath(); g.moveTo(x - 4 * s, baseY); g.quadraticCurveTo(x - 2 * s, baseY - 20 * s, x - 1 * s, baseY - 34 * s); g.stroke();
    g.fillStyle = '#ffca6a';
    g.beginPath(); g.arc(x - 11 * s, baseY - 45 * s, 2 * s, 0, 7); g.fill();
    g.beginPath(); g.arc(x + 10 * s, baseY - 47 * s, 2 * s, 0, 7); g.fill();
  }
  const CRYSTAL_SHARDS = [[-6, 26, 5], [0, 40, 7], [7, 22, 4.5]];
  function drawCrystalTree(g, x, baseY, s) {
    g.fillStyle = '#c24ae8'; g.globalAlpha = 0.2;
    g.beginPath(); g.arc(x, baseY - 22 * s, 20 * s, 0, 7); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = '#38284a';
    g.beginPath(); g.arc(x, baseY - 4 * s, 9 * s, 0, 7); g.fill();
    for (const [dx0, h, w2] of CRYSTAL_SHARDS) {
      g.fillStyle = '#6a3aa8';
      g.beginPath();
      g.moveTo(x + (dx0 - w2) * s, baseY - 4 * s); g.lineTo(x + dx0 * s, baseY - (4 + h) * s); g.lineTo(x + dx0 * s, baseY - 4 * s);
      g.closePath(); g.fill();
      g.fillStyle = '#c24ae8';
      g.beginPath();
      g.moveTo(x + dx0 * s, baseY - (4 + h) * s); g.lineTo(x + (dx0 + w2) * s, baseY - 4 * s); g.lineTo(x + dx0 * s, baseY - 4 * s);
      g.closePath(); g.fill();
    }
    g.strokeStyle = '#e8b8ff'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x - CRYSTAL_SHARDS[1][2] * s * 0.5, baseY - 24 * s); g.lineTo(x, baseY - 44 * s); g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(x + 1 * s, baseY - 42 * s, 1.5, 0, 7); g.fill();
  }

  // static flora baked once per (kind, scale) — trees were the biggest
  // recoverable per-frame cost in the near pass. 1 canvas px = 2 world
  // units, so sprites blit 1:1 onto the half-res buffer with no decimation.
  const floraCache = {};
  function drawFlora(g, kind, s, x, baseY) {
    const key = kind + s + '@' + RES;
    let f = floraCache[key];
    if (!f) {
      const wU = 84 * s, hU = 100 * s;
      const pc = document.createElement('canvas');
      pc.width = Math.ceil(wU * RES); pc.height = Math.ceil(hU * RES);
      const q = pc.getContext('2d');
      q.setTransform(RES, 0, 0, RES, wU * RES / 2, hU * RES); // world (0,0) = base center
      if (kind === 'oak') drawOak(q, 0, 0, s, OAK_P);
      else if (kind === 'blossom') drawBlossom(q, 0, 0, s);
      else if (kind === 'coral') drawPipeCoral(q, 0, 0, s);
      else if (kind === 'dead') drawDeadTree(q, 0, 0, s);
      else drawCrystalTree(q, 0, 0, s);
      f = floraCache[key] = { cvs: pc, wU, hU };
    }
    g.drawImage(f.cvs, x - f.wU / 2, baseY - f.hU, f.wU, f.hU);
  }

  // starfield pattern for the fantasy sky, built once
  let starPattern = null;
  function getStars() {
    if (starPattern) return starPattern;
    const pc = document.createElement('canvas');
    pc.width = 200; pc.height = 200;
    const q = pc.getContext('2d');
    const r = seeded(97);
    q.fillStyle = '#e8e4ff';
    for (let i = 0; i < 30; i++) {
      q.globalAlpha = 0.5 + r() * 0.5;
      // 1.6-3.4 world units so stars survive the quarter-res far pass
      q.beginPath(); q.arc(r() * 200, r() * 200, 1.6 + r() * 1.8, 0, 7); q.fill();
    }
    return starPattern = ctx.createPattern(pc, 'repeat');
  }

  // ---- the floating island: cliff strip baked once per world ----
  // baked at RES so it blits 1:1 onto the world buffer at any quality.
  const cliffStrips = {};
  function getCliffStrip(world) {
    const cacheKey = world.id + '@' + RES;
    if (cliffStrips[cacheKey]) return cliffStrips[cacheKey];
    const E = ENV_TABLES[world.id] || ENV_TABLES.home;
    const W = STAGE_W + 320;
    const pc = document.createElement('canvas');
    pc.width = Math.ceil(W * RES); pc.height = Math.ceil(312 * RES);
    const q = pc.getContext('2d');
    q.setTransform(RES, 0, 0, RES, 160 * RES, 24 * RES); // world x -160.., world y -24..288
    const r = seeded(WORLD_SEED[world.id] * 97 + 13);
    // underside silhouette: 3 keels tapering into the sky
    const kx = [0.18 * STAGE_W, 0.5 * STAGE_W, 0.82 * STAGE_W];
    const kd = [190 + r() * 50, 240 + r() * 40, 190 + r() * 50];
    const kw = STAGE_W * 0.24;
    const depthAt = (x) => {
      let d = 60;
      for (let i = 0; i < 3; i++) d += kd[i] * Math.pow(Math.max(0, 1 - Math.abs(x - kx[i]) / kw), 1.7);
      return Math.min(278, Math.max(40, d));
    };
    const xs = [], ys = [];
    for (let x = STAGE_W + 160; x >= -160; x -= 70) { xs.push(x); ys.push(Math.min(278, Math.max(40, depthAt(x) + (r() - 0.5) * 26))); }
    q.beginPath();
    q.moveTo(-160, 0); q.lineTo(STAGE_W + 160, 0); q.lineTo(STAGE_W + 160, 44);
    for (let i = 0; i < xs.length; i++) q.lineTo(xs[i], ys[i]);
    q.closePath();
    q.fillStyle = E.cliffMid; q.fill();
    q.save(); q.clip();
    // strata: sunlit band up top, cool depths below, dithered seams
    q.fillStyle = E.cliffLite; q.fillRect(-160, 4, W, 26);
    q.fillStyle = E.cliffDark; q.fillRect(-160, 120, W, 168);
    q.fillStyle = checkerPat(E.cliffLite); q.fillRect(-160, 26, W, 12);
    q.fillStyle = checkerPat(E.cliffDark); q.fillRect(-160, 112, W, 12);
    q.strokeStyle = E.cliffInk; q.globalAlpha = 0.5; q.lineWidth = 2;
    for (const yb of [36, 80, 130]) {
      q.beginPath();
      for (let x = -160; x <= STAGE_W + 160; x += 90) {
        const yy = yb + (r() - 0.5) * 10;
        if (x === -160) q.moveTo(x, yy); else q.lineTo(x, yy);
      }
      q.stroke();
    }
    q.globalAlpha = 1;
    // stepped ledges with cast shadows
    for (let i = 0; i < 6; i++) {
      const lx = r() * STAGE_W, lyy = 40 + r() * 90, lw2 = 40 + r() * 50;
      q.fillStyle = E.cliffLite; q.fillRect(lx, lyy, lw2, 5);
      q.fillStyle = E.cliffInk; q.fillRect(lx, lyy + 5, lw2, 2);
    }
    // embedded rocks with a lit chip
    for (let i = 0; i < 26; i++) {
      const rx = -140 + r() * (STAGE_W + 280), ry = 20 + r() * 180;
      q.fillStyle = E.cliffDark;
      q.beginPath(); q.roundRect(rx, ry, 10 + r() * 16, 8 + r() * 10, 3); q.fill();
      q.fillStyle = E.rockLite; q.fillRect(rx + 2, ry + 2, 5, 3);
    }
    if (world.id === 'pipes') {
      // slime drools off the ledges
      q.fillStyle = '#6a8a3a';
      q.beginPath(); q.roundRect(STAGE_W * 0.3, 60, 10, 12, 4); q.fill();
      q.beginPath(); q.roundRect(STAGE_W * 0.3 + 14, 60, 8, 20, 4); q.fill();
      q.beginPath(); q.roundRect(STAGE_W * 0.72, 90, 10, 16, 4); q.fill();
      q.fillStyle = '#8fae4a';
      q.fillRect(STAGE_W * 0.3 + 1, 61, 3, 8); q.fillRect(STAGE_W * 0.72 + 1, 91, 3, 8);
    } else if (world.id === 'fantasy') {
      // glowing runes carved in the rock
      for (const rx of [STAGE_W * 0.22, STAGE_W * 0.5, STAGE_W * 0.78]) {
        const ry = 66 + r() * 40;
        q.fillStyle = '#c24ae8'; q.globalAlpha = 0.2;
        q.beginPath(); q.arc(rx + 3, ry + 4, 7, 0, 7); q.fill();
        q.globalAlpha = 0.9; q.strokeStyle = '#c24ae8'; q.lineWidth = 1.6;
        q.beginPath();
        q.moveTo(rx, ry); q.lineTo(rx + 6, ry + 3); q.lineTo(rx, ry + 8);
        q.moveTo(rx + 3, ry - 2); q.lineTo(rx + 3, ry + 10);
        q.stroke();
        q.globalAlpha = 1;
      }
    }
    q.restore();
    // chunky under-edge: ink rim with a lighter inner band
    q.strokeStyle = E.cliffInk; q.lineWidth = 4; q.lineJoin = 'round';
    q.beginPath();
    for (let i = 0; i < xs.length; i++) { if (i === 0) q.moveTo(xs[i], ys[i]); else q.lineTo(xs[i], ys[i]); }
    q.stroke();
    q.strokeStyle = E.cliffDark; q.lineWidth = 7;
    q.beginPath();
    for (let i = 0; i < xs.length; i++) { if (i === 0) q.moveTo(xs[i], ys[i] - 3); else q.lineTo(xs[i], ys[i] - 3); }
    q.stroke();
    // baked dangles: pipe stubs in the underworld, roots elsewhere
    q.lineCap = 'round';
    if (world.id === 'pipes') {
      for (let i = 0; i < 5; i++) {
        const x = 100 + r() * (STAGE_W - 200), d0 = depthAt(x) - 8;
        q.fillStyle = '#b06a32'; q.fillRect(x - 3, d0 - 2, 6, 14);
        q.fillStyle = '#7a4520'; q.fillRect(x - 4, d0 + 10, 8, 3);
        q.fillStyle = '#3ad4a4'; q.beginPath(); q.arc(x, d0 + 16, 1.6, 0, 7); q.fill();
      }
    } else {
      const rootCol = world.id === 'road' ? '#7a5c3c' : world.id === 'fantasy' ? '#4a3a68' : E.soilDark;
      q.strokeStyle = rootCol;
      for (let i = 0; i < 8; i++) {
        const x = 60 + r() * (STAGE_W - 120), d0 = depthAt(x) - 8;
        const kx2 = (r() - 0.5) * 20, L1 = 10 + r() * 20, L2 = 10 + r() * 20;
        q.lineWidth = 3; q.beginPath(); q.moveTo(x, d0); q.lineTo(x + kx2 * 0.4, d0 + L1); q.stroke();
        q.lineWidth = 1.5; q.beginPath(); q.moveTo(x + kx2 * 0.4, d0 + L1); q.lineTo(x + kx2, d0 + L1 + L2); q.stroke();
      }
    }
    // soil band + grass lip with sun rim
    q.fillStyle = E.soil; q.fillRect(-160, 0, W, 14);
    q.fillStyle = E.soilDark; q.fillRect(-160, 12, W, 3);
    q.fillStyle = E.grassDark; q.fillRect(-160, -2, W, 6);
    q.fillStyle = E.grass; q.fillRect(-160, -6, W, 6);
    q.fillStyle = E.grassLite; q.fillRect(-160, -8, W, 3);
    q.fillStyle = E.grass;
    for (let x = -160; x < STAGE_W + 160; x += 22) { q.beginPath(); q.arc(x, 2, 5 + r() * 4, 0, Math.PI); q.fill(); }
    const tuftH = world.id === 'road' ? 9 : 5; // prairie grass grows taller
    for (let x = -150; x < STAGE_W + 150; x += 30 + r() * 30) {
      const n = 2 + Math.floor(r() * 3);
      for (let b = 0; b < n; b++) {
        q.strokeStyle = b % 2 ? E.grassLite : E.grassDark; q.lineWidth = 2;
        q.beginPath(); q.moveTo(x + b * 2, -4); q.lineTo(x + b * 2 + (r() * 6 - 3), -12 - r() * tuftH); q.stroke();
      }
    }
    cliffStrips[cacheKey] = pc;
    return pc;
  }

  // platforms as small floating islands, baked per platform per level
  // at RES so they blit 1:1 onto the world buffer.
  function buildPlatformIsland(w, world) {
    const E = ENV_TABLES[world.id] || ENV_TABLES.home;
    const pc = document.createElement('canvas');
    pc.width = Math.ceil((w + 36) * RES); pc.height = Math.ceil(76 * RES);
    const q = pc.getContext('2d');
    q.setTransform(RES, 0, 0, RES, 0, 0);
    const cx = w / 2 + 18;
    const keelY = 44 + Math.min(14, w * 0.06);
    q.beginPath();
    q.moveTo(18, 15); q.lineTo(w + 18, 15);
    q.lineTo(w * 0.82 + 18, 34);
    q.lineTo(cx + 6, keelY); q.lineTo(cx - 6, keelY);
    q.lineTo(w * 0.18 + 18, 34); q.closePath();
    q.fillStyle = E.cliffMid; q.fill();
    q.strokeStyle = E.cliffInk; q.lineWidth = 3; q.lineJoin = 'round'; q.stroke();
    q.fillStyle = E.cliffDark;
    q.beginPath(); q.moveTo(w * 0.2 + 18, 31); q.lineTo(w * 0.8 + 18, 31); q.lineTo(cx, keelY - 3); q.closePath(); q.fill();
    q.strokeStyle = E.cliffLite; q.lineWidth = 2;
    q.beginPath(); q.moveTo(w * 0.18 + 18, 33); q.lineTo(18, 16); q.stroke();
    q.fillStyle = E.rock;
    q.beginPath(); q.roundRect(cx - w * 0.22, 22, 9, 7, 2); q.fill();
    q.beginPath(); q.roundRect(cx + w * 0.14, 27, 7, 5, 2); q.fill();
    if (w > 170) { q.beginPath(); q.roundRect(cx + w * 0.3, 20, 8, 6, 2); q.fill(); }
    q.fillStyle = E.rockLite;
    q.fillRect(cx - w * 0.22 + 1.5, 23.5, 4, 2); q.fillRect(cx + w * 0.14 + 1.5, 28.5, 4, 2);
    q.fillStyle = E.grassDark; q.fillRect(16, 15, w + 4, 5);
    q.fillStyle = E.grass; q.fillRect(16, 12, w + 4, 4);
    q.fillStyle = E.grassLite; q.fillRect(16, 11, w + 4, 2);
    q.fillStyle = E.grass;
    for (let x = 20; x < w + 16; x += 18) { q.beginPath(); q.arc(x, 17, 4, 0, Math.PI); q.fill(); }
    q.beginPath(); q.arc(17, 18, 6, 0, Math.PI); q.fill();
    q.beginPath(); q.arc(w + 19, 18, 6, 0, Math.PI); q.fill();
    for (let x = 22; x < w + 14; x += 26) {
      q.strokeStyle = E.grassLite; q.lineWidth = 1.8; q.lineCap = 'round';
      q.beginPath(); q.moveTo(x, 11); q.lineTo(x + 2, 5); q.stroke();
      q.strokeStyle = E.grassDark;
      q.beginPath(); q.moveTo(x + 3, 11); q.lineTo(x + 1, 4); q.stroke();
    }
    q.strokeStyle = E.grassDark; q.lineWidth = 1.6;
    q.beginPath(); q.moveTo(19, 17); q.lineTo(21, 24); q.stroke();
    q.beginPath(); q.moveTo(24, 17); q.lineTo(25, 22); q.stroke();
    q.beginPath(); q.moveTo(w + 12, 17); q.lineTo(w + 10, 24); q.stroke();
    q.beginPath(); q.moveTo(w + 6, 17); q.lineTo(w + 7, 22); q.stroke();
    // per-world garnish
    if (world.id === 'home') {
      q.fillStyle = '#ffffff';
      q.beginPath(); q.arc(cx - 12, 8, 2, 0, 7); q.fill();
      q.beginPath(); q.arc(cx + 15, 9, 2, 0, 7); q.fill();
      q.fillStyle = '#ffca3a';
      q.beginPath(); q.arc(cx - 12, 8, 0.9, 0, 7); q.fill();
      q.beginPath(); q.arc(cx + 15, 9, 0.9, 0, 7); q.fill();
    } else if (world.id === 'pipes') {
      q.fillStyle = '#3ad4a4';
      q.globalAlpha = 0.9; q.beginPath(); q.arc(cx - w * 0.22 + 4, 21, 1.6, 0, 7); q.fill();
      q.globalAlpha = 0.4; q.fillRect(cx - w * 0.22 + 3, 22, 2, 8);
      q.globalAlpha = 1;
    } else if (world.id === 'road') {
      q.fillStyle = '#e8742a'; q.fillRect(w * 0.24 + 18, 27, 6, 3);
    } else {
      q.fillStyle = '#c24ae8'; q.globalAlpha = 0.25;
      q.beginPath(); q.arc(cx + w * 0.24, 24, 6, 0, 7); q.fill();
      q.globalAlpha = 1;
      q.beginPath(); q.moveTo(cx + w * 0.24 - 3, 27); q.lineTo(cx + w * 0.24, 20); q.lineTo(cx + w * 0.24 + 3, 27); q.closePath(); q.fill();
      q.strokeStyle = '#e8b8ff'; q.lineWidth = 1;
      q.beginPath(); q.moveTo(cx + w * 0.24 - 3, 27); q.lineTo(cx + w * 0.24, 20); q.stroke();
    }
    return pc;
  }

  // the FAR pass: everything here is rendered soft (tilt-shift) behind the action
  function drawBackgroundFar() {
    const g = rctx;
    const sh2 = themeShades();
    // banded sky — the quarter-res soft pass blends the seams on its own
    const skyTop = -worldOffY, skyH = viewH;
    const BANDS = 5;
    for (let b = 0; b < BANDS; b++) {
      const y0 = skyTop + (skyH * b) / BANDS;
      g.fillStyle = sh2.bands[b];
      g.fillRect(camX, y0, viewW, skyH / BANDS + 1);
    }

    const wid = plan ? plan.world.id : 'home';
    const E = sh2.E;

    // starfield over the twilight realms — near-screen-anchored so the
    // deepest layer scrolls slowest (patterns tile in user space)
    if (wid === 'fantasy') {
      g.globalAlpha = 0.8;
      g.fillStyle = getStars();
      g.save();
      g.translate(camX * 0.95, 0);
      g.fillRect(camX * 0.05, skyTop, viewW, viewH * 0.6);
      g.restore();
      g.globalAlpha = 1;
    }

    // the key light: high sun / cavern glow bloom / low dusk sun / cratered moon
    const mx = camX + viewW * 0.72, my = wid === 'road' ? 300 : 120;
    const core = wid === 'home' ? '#fff8d8' : wid === 'road' ? '#fff0c0' : theme.glow;
    g.fillStyle = theme.glow + '1e'; g.beginPath(); g.arc(mx, my, 112, 0, 7); g.fill();
    g.fillStyle = theme.glow + '38'; g.beginPath(); g.arc(mx, my, 76, 0, 7); g.fill();
    g.fillStyle = theme.glow + '60'; g.beginPath(); g.arc(mx, my, 52, 0, 7); g.fill();
    g.fillStyle = core; g.beginPath(); g.arc(mx, my, wid === 'road' ? 30 : 34, 0, 7); g.fill();
    if (wid === 'fantasy') {
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.beginPath(); g.arc(mx - 9, my - 5, 6, 0, 7); g.fill();
      g.beginPath(); g.arc(mx + 10, my + 9, 4.5, 0, 7); g.fill();
      g.beginPath(); g.arc(mx + 4, my - 13, 3, 0, 7); g.fill();
    }

    // cumulus banks: 4-shade Owlboy puffs with flat bottoms, slow drift
    const rc = seeded((plan ? plan.level : 1) * 7 + 31);
    const drift = performance.now() * 0.003;
    const C = E.cumulus;
    const flat = wid === 'road'; // long sunset clouds lit from beneath
    const nClouds = (wid === 'pipes' || wid === 'fantasy') ? 4 : 5;
    const cloudA = wid === 'pipes' ? 0.8 : wid === 'fantasy' ? 0.85 : 1;
    g.globalAlpha = cloudA;
    for (let i = 0; i < nClouds; i++) {
      let cw = 150 + rc() * 170;
      const baseX = rc() * (STAGE_W + 900);
      const cy = -worldOffY + 70 + rc() * 170;
      const wrap = viewW + 900;
      const x = camX + ((((baseX + drift * (8 + i * 3) - camX * 0.18) % wrap) + wrap) % wrap) - 450;
      if (flat) cw *= 1.6;
      const prMul = flat ? 0.55 : 1;
      const baseY = cy + cw * (flat ? 0.1 : 0.18);
      g.fillStyle = C[3];
      g.fillRect(x - cw * 0.42, baseY - 9, cw * 0.84, 9);
      for (let pass = 0; pass < 3; pass++) {
        g.fillStyle = pass === 0 ? C[2] : pass === 1 ? C[1] : C[0];
        for (let p = 0; p < 5; p++) {
          const u = (p - 2) / 2;
          const px = x + u * cw * 0.36;
          const pr = cw * (0.16 + 0.1 * (1 - Math.abs(u) * 0.72)) * prMul;
          const py = baseY - pr * 0.9 - (1 - Math.abs(u)) * cw * 0.1 * prMul;
          if (pass === 0) { g.beginPath(); g.arc(px + 2, py + 3, pr, 0, 7); g.fill(); }
          else if (pass === 1) { g.beginPath(); g.arc(px - 1, py - 2, pr * 0.94, 0, 7); g.fill(); }
          else if (!flat) { g.beginPath(); g.arc(px - pr * 0.32, py - pr * 0.34, pr * 0.5, 0, 7); g.fill(); }
          else {
            // underlight instead of a top highlight: the low sun catches the belly
            g.fillStyle = '#ffca6a'; g.globalAlpha = 0.8 * cloudA;
            g.fillRect(px - pr * 0.7, py + pr * 0.45, pr * 1.4, 2.5);
            g.globalAlpha = cloudA; g.fillStyle = C[0];
          }
        }
      }
      g.fillStyle = C[3]; g.fillRect(x - cw * 0.44, baseY - 6, cw * 0.88, 6);
      g.fillStyle = C[2]; g.fillRect(x - cw * 0.44, baseY - 8, cw * 0.88, 2);
    }
    g.globalAlpha = 1;

    // light shafts from the key
    g.globalAlpha = wid === 'home' ? 0.1 : wid === 'road' ? 0.09 : 0.07;
    g.fillStyle = theme.glow;
    for (let i = 0; i < 3; i++) {
      const sx0 = mx - 40 - i * 130;
      g.beginPath();
      g.moveTo(sx0, my); g.lineTo(sx0 - 130, GROUND_Y + 40); g.lineTo(sx0 - 60, GROUND_Y + 40); g.lineTo(sx0 + 30, my);
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;

    // deepest ridge (parallax 0.1) — or the Kansas City skyline on the road
    const r0 = seeded((plan ? plan.level : 1) * 3 + 5);
    if (plan && plan.world.props === 'road') {
      for (let i = 0; i < 9; i++) {
        const tw = 44 + r0() * 40, th = 110 + r0() * 150;
        const wx0 = i * 260 + r0() * 100 - camX * 0.1;
        const sx = camX + ((wx0 % (viewW + 500)) + viewW + 500) % (viewW + 500) - 250;
        g.fillStyle = sh2.towerCol;
        g.fillRect(sx, GROUND_Y - th, tw, th);
        g.fillStyle = '#ffd24a';
        for (let wy = GROUND_Y - th + 12; wy < GROUND_Y - 14; wy += 16) {
          for (let wx2 = sx + 6; wx2 < sx + tw - 6; wx2 += 12) {
            if (r0() < 0.42) { g.globalAlpha = 0.7; g.fillRect(wx2, wy, 4, 5); }
          }
        }
        g.globalAlpha = 1;
      }
    } else if (wid === 'home') {
      // far floating islands drifting in the daylight
      for (let i = 0; i < 3; i++) {
        const iw = 90 + r0() * 70, iy = 180 + r0() * 120;
        const wx0 = i * 620 + r0() * 200 - camX * 0.1;
        const sx = camX + ((wx0 % (viewW + 500)) + viewW + 500) % (viewW + 500) - 250;
        g.fillStyle = '#9fd08a'; g.fillRect(sx, iy, iw, 6);
        g.fillStyle = '#7f9aa8';
        g.beginPath(); g.moveTo(sx, iy + 6); g.lineTo(sx + iw, iy + 6); g.lineTo(sx + iw * 0.5, iy + 34); g.closePath(); g.fill();
        g.fillStyle = '#647f9a';
        g.beginPath(); g.moveTo(sx + iw * 0.5, iy + 6); g.lineTo(sx + iw, iy + 6); g.lineTo(sx + iw * 0.5, iy + 34); g.closePath(); g.fill();
      }
    } else if (wid === 'fantasy') {
      // floating castle spires against the stars
      for (let i = 0; i < 3; i++) {
        const sy = 140 + r0() * 110;
        const wx0 = i * 600 + r0() * 220 - camX * 0.1;
        const sx = camX + ((wx0 % (viewW + 500)) + viewW + 500) % (viewW + 500) - 250;
        g.fillStyle = sh2.towerCol; g.fillRect(sx, sy, 22, 90);
        g.fillStyle = '#241640';
        g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 11, sy - 26); g.lineTo(sx + 26, sy); g.closePath(); g.fill();
        g.fillStyle = '#ffb04a'; g.fillRect(sx + 9, sy + 20, 2, 3);
      }
    } else {
      g.fillStyle = sh2.farDeep;
      g.beginPath();
      g.moveTo(camX, VH);
      for (let i = 0; i <= 10; i++) {
        const wx0 = (i / 10) * (STAGE_W + viewW) - camX * 0.1;
        g.lineTo(camX + ((wx0 % (viewW + 600)) + viewW + 600) % (viewW + 600) - 300, 250 - r0() * 120);
      }
      g.lineTo(camX + viewW, VH); g.closePath(); g.fill();
    }
    g.fillStyle = theme.sky1 + '55';
    g.fillRect(camX, 220, viewW, Math.max(0, GROUND_Y - 220));

    // far ridge (parallax 0.25) — gentle low hills in daylight, big masses elsewhere
    const r1 = seeded(plan ? plan.level : 1);
    const ridgeY = wid === 'home' ? 420 : 300, ridgeAmp = wid === 'home' ? 60 : 160;
    g.fillStyle = theme.far;
    g.beginPath();
    g.moveTo(camX, VH);
    for (let i = 0; i <= 14; i++) {
      const wx = (i / 14) * (STAGE_W + viewW) - camX * 0.25;
      g.lineTo(camX + ((wx % (viewW + 400)) + viewW + 400) % (viewW + 400) - 200, ridgeY - r1() * ridgeAmp);
    }
    g.lineTo(camX + viewW, VH); g.closePath(); g.fill();

    // world scene layer (parallax 0.38): the lived-in middle distance
    if (plan) drawScene(g);

    // below-island layer, drawn last so it caps the ridge bottoms:
    // cloud sea (day/dusk), glowing abyss (underworld), violet mist (twilight)
    const botY = viewH - worldOffY;
    if (botY >= 560) {
      const dxD = performance.now() * 0.006;
      if (wid === 'home' || wid === 'road') {
        const seaTop = 512, par = 0.12;
        const wrapS = viewW + 112;
        g.fillStyle = E.seaBack;
        for (let sx2 = 0; sx2 < wrapS; sx2 += 56) {
          const x = camX + (((sx2 - camX * par + dxD * 8) % wrapS) + wrapS) % wrapS - 56;
          g.beginPath(); g.arc(x, seaTop + 6, 34, Math.PI, 0); g.fill();
        }
        const wrap2 = viewW + 148;
        g.fillStyle = E.seaFront;
        for (let sx2 = 0; sx2 < wrap2; sx2 += 74) {
          const x = camX + ((((sx2 - camX * par - dxD * 13) % wrap2) + wrap2) % wrap2) - 74;
          g.beginPath(); g.arc(x, seaTop + 22, 46, Math.PI, 0); g.fill();
        }
        g.fillRect(camX, seaTop + 24, viewW, Math.max(0, botY - (seaTop + 24)));
        g.fillStyle = C[0]; g.globalAlpha = 0.5;
        for (let sx2 = 0; sx2 < wrapS; sx2 += 224) {
          const x = camX + (((sx2 - camX * par + dxD * 8) % wrapS) + wrapS) % wrapS - 56;
          g.fillRect(x - 7, seaTop + 2, 14, 2);
        }
        g.globalAlpha = 1;
      } else if (wid === 'pipes') {
        g.fillStyle = '#051512';
        g.fillRect(camX, 520, viewW, Math.max(0, botY - 520));
        g.fillStyle = '#3ad4a4'; g.globalAlpha = 0.15;
        g.beginPath(); g.ellipse(camX + viewW * 0.3, 585, 130, 26, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(camX + viewW * 0.75, 600, 100, 20, 0, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else {
        const seaTop = 512, par = 0.12;
        const wrapS = viewW + 112;
        g.fillStyle = E.seaBack;
        for (let sx2 = 0; sx2 < wrapS; sx2 += 56) {
          const x = camX + (((sx2 - camX * par + dxD * 8) % wrapS) + wrapS) % wrapS - 56;
          g.beginPath(); g.arc(x, seaTop + 6, 34, Math.PI, 0); g.fill();
        }
        const wrap2 = viewW + 148;
        g.fillStyle = E.seaFront;
        for (let sx2 = 0; sx2 < wrap2; sx2 += 74) {
          const x = camX + ((((sx2 - camX * par - dxD * 13) % wrap2) + wrap2) % wrap2) - 74;
          g.beginPath(); g.arc(x, seaTop + 22, 46, Math.PI, 0); g.fill();
        }
        g.fillRect(camX, seaTop + 24, viewW, Math.max(0, botY - (seaTop + 24)));
      }
    }
  }

  function drawScene(g) {
    const props = plan.world.props;
    const sh3 = themeShades();
    const rs = seeded(plan.level * 11 + 3);
    const par = 0.38;
    const wrap = viewW + 700;
    const wx2 = (bx2) => camX + (((bx2 - camX * par) % wrap) + wrap) % wrap - 350;
    if (props === 'fence') {
      // neighborhood houses with warm lit windows, oaks between them
      for (let i = 0; i < 4; i++) {
        const hw2 = 120 + rs() * 60, hh2 = 85 + rs() * 45;
        const x = wx2(i * 460 + rs() * 160);
        const yb = GROUND_Y;
        g.fillStyle = sh3.houseBody;
        g.fillRect(x, yb - hh2, hw2, hh2);
        g.fillStyle = '#b05a48'; // terracotta
        g.beginPath(); g.moveTo(x - 10, yb - hh2); g.lineTo(x + hw2 / 2, yb - hh2 - 46); g.lineTo(x + hw2 + 10, yb - hh2); g.closePath(); g.fill();
        g.fillRect(x + hw2 * 0.72, yb - hh2 - 62, 14, 30); // chimney
        for (let wxx = x + 14; wxx < x + hw2 - 20; wxx += 34) {
          const lit = rs() < 0.62;
          g.fillStyle = lit ? '#ffd24a' : sh3.winDark;
          g.fillRect(wxx, yb - hh2 + 18, 16, 20);
          if (lit) {
            g.globalAlpha = 0.22; g.fillStyle = '#ffd24a';
            g.fillRect(wxx - 4, yb - hh2 + 14, 24, 28);
            g.globalAlpha = 1;
          }
        }
      }
      drawFlora(g, 'oak', 0.8, wx2(260), GROUND_Y);
      drawFlora(g, 'oak', 0.8, wx2(780), GROUND_Y);
    } else if (props === 'pipes') {
      // background pipe network with glowing valves
      g.strokeStyle = sh3.pipeCol; g.lineWidth = 12;
      const py = 320 + rs() * 20;
      g.beginPath(); g.moveTo(camX - 20, py); g.lineTo(camX + viewW + 20, py); g.stroke();
      for (let i = 0; i < 4; i++) {
        const x = wx2(i * 430 + rs() * 140);
        // re-set each pass: the chain stroke below clobbers this state
        g.strokeStyle = sh3.pipeCol; g.lineWidth = 12;
        g.beginPath(); g.moveTo(x, py); g.lineTo(x, GROUND_Y); g.stroke();
        g.fillStyle = '#3ad4a4';
        g.globalAlpha = 0.25; g.beginPath(); g.arc(x, py, 16, 0, 7); g.fill();
        g.globalAlpha = 0.9; g.beginPath(); g.arc(x, py, 6, 0, 7); g.fill();
        g.globalAlpha = 1;
        // hanging chain from the trunk line
        g.strokeStyle = '#4c3820'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x + 46, py + 6); g.lineTo(x + 46, py + 40 + (i % 2) * 14); g.stroke();
      }
      drawFlora(g, 'coral', 0.8, wx2(200), GROUND_Y);
      drawFlora(g, 'coral', 0.8, wx2(760), GROUND_Y);
    } else if (props === 'road') {
      // billboards catching the sunset
      for (let i = 0; i < 3; i++) {
        const x = wx2(i * 620 + rs() * 200);
        g.fillStyle = sh3.billPost;
        g.fillRect(x + 28, GROUND_Y - 120, 10, 120);
        g.fillStyle = sh3.billBoard;
        g.fillRect(x - 20, GROUND_Y - 175, 106, 60);
        g.fillStyle = theme.glow;
        g.globalAlpha = 0.4;
        g.fillRect(x - 14, GROUND_Y - 169, 94, 48);
        g.globalAlpha = 1;
      }
      drawFlora(g, 'dead', 0.9, wx2(320), GROUND_Y);
      drawFlora(g, 'dead', 0.9, wx2(960), GROUND_Y);
    } else {
      // torch-lit castle wall
      const flick = 1 + Math.sin(performance.now() * 0.02) * 0.15;
      for (let i = 0; i < 4; i++) {
        const x = wx2(i * 440 + rs() * 130);
        g.fillStyle = sh3.wallCol;
        g.fillRect(x, GROUND_Y - 140, 150, 140);
        for (let cxx = x; cxx < x + 150; cxx += 30) g.fillRect(cxx, GROUND_Y - 154, 16, 16);
        // arrow-slit windows
        g.fillStyle = '#ffb04a';
        g.globalAlpha = 0.85;
        g.fillRect(x + 38, GROUND_Y - 104, 6, 20);
        g.fillRect(x + 104, GROUND_Y - 96, 6, 20);
        g.globalAlpha = 1;
        // torch
        const tx = x + 74, ty = GROUND_Y - 118;
        g.fillStyle = '#6a4a2a'; g.fillRect(tx - 2, ty, 5, 22);
        g.fillStyle = '#ffb04a';
        g.globalAlpha = 0.18; g.beginPath(); g.arc(tx, ty - 4, 26 * flick, 0, 7); g.fill();
        g.globalAlpha = 0.45; g.beginPath(); g.arc(tx, ty - 4, 12 * flick, 0, 7); g.fill();
        g.globalAlpha = 1;
        g.fillStyle = '#ffd24a';
        g.beginPath(); g.arc(tx, ty - 4, 5 * flick, 0, 7); g.fill();
      }
      drawFlora(g, 'crystal', 0.9, wx2(300), GROUND_Y);
    }
  }

  const LEAF_US = [0.45, 0.8];
  function drawBackground() {
    const g = rctx;
    const E = themeShades().E;
    const wid = plan ? plan.world.id : 'home';
    const tS = performance.now() * 0.001; // shared sway clock

    // near props (parallax 0.55) — painted per world
    const r2 = seeded((plan ? plan.level : 1) + 77);
    const propStyle = plan ? plan.world.props : 'castle';
    for (let i = 0; i < 10; i++) {
      const px = i * 300 + r2() * 120 - camX * 0.55;
      const sx = ((px % (viewW + 300)) + viewW + 300) % (viewW + 300) - 150 + camX;
      const h = 150 + r2() * 130, w = 26 + r2() * 22;
      if (propStyle === 'fence') {
        // painted picket run, an oak every other slot, and a sunflower
        for (let f = 0; f < 4; f++) {
          g.fillStyle = '#e8e4d8';
          g.fillRect(sx + f * 16, GROUND_Y - 46, 9, 46);
          g.beginPath(); g.moveTo(sx + f * 16, GROUND_Y - 46); g.lineTo(sx + f * 16 + 4.5, GROUND_Y - 56); g.lineTo(sx + f * 16 + 9, GROUND_Y - 46); g.fill();
          g.fillStyle = '#b0aca0';
          g.fillRect(sx + f * 16 + 7, GROUND_Y - 46, 2, 46);
        }
        g.fillStyle = '#e8e4d8'; g.fillRect(sx - 6, GROUND_Y - 36, 76, 7);
        g.fillStyle = '#b0aca0'; g.fillRect(sx - 6, GROUND_Y - 31, 76, 2);
        if (i % 2 === 0) drawFlora(g, 'oak', 1.05, sx + 96, GROUND_Y + 2);
        const fx = sx + 70;
        g.strokeStyle = '#3f6b34'; g.lineWidth = 2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(fx, GROUND_Y); g.lineTo(fx, GROUND_Y - 26); g.stroke();
        g.fillStyle = '#3f6b34';
        g.beginPath(); g.ellipse(fx - 4, GROUND_Y - 12, 4, 2, -0.6, 0, 7); g.fill();
        g.beginPath(); g.ellipse(fx + 4, GROUND_Y - 16, 4, 2, 0.6, 0, 7); g.fill();
        g.fillStyle = '#ffca3a'; g.beginPath(); g.arc(fx, GROUND_Y - 29, 5, 0, 7); g.fill();
        g.fillStyle = '#7a4a20'; g.beginPath(); g.arc(fx, GROUND_Y - 29, 2.5, 0, 7); g.fill();
      } else if (propStyle === 'pipes') {
        // painted rust pipe with elbow, bolts, and a glowing valve wheel
        g.fillStyle = '#b06a32'; g.fillRect(sx, GROUND_Y - h, 20, h);
        g.fillStyle = '#7a4520'; g.fillRect(sx + 14, GROUND_Y - h, 6, h);
        g.fillRect(sx - 8, GROUND_Y - h, 36, 14);
        g.fillRect(sx - 4, GROUND_Y - h * 0.55, 28, 10);
        g.fillStyle = '#e8c84a';
        g.beginPath(); g.arc(sx + 2, GROUND_Y - h + 7, 1.5, 0, 7); g.fill();
        g.beginPath(); g.arc(sx + 18, GROUND_Y - h + 7, 1.5, 0, 7); g.fill();
        g.fillStyle = '#3ad4a4'; g.globalAlpha = 0.25;
        g.beginPath(); g.arc(sx + 10, GROUND_Y - h * 0.55 - 12, 16, 0, 7); g.fill();
        g.globalAlpha = 1;
        g.strokeStyle = '#3ad4a4'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(sx + 10, GROUND_Y - h * 0.55 - 12, 9, 0, 7); g.stroke();
      } else if (propStyle === 'road') {
        // highway sign catching the last light, a dead tree here and there
        g.fillStyle = theme.near;
        g.fillRect(sx + 8, GROUND_Y - h * 0.7, 7, h * 0.7);
        g.save();
        g.translate(sx + 11.5, GROUND_Y - h * 0.7 - 4);
        g.rotate(Math.PI / 4);
        g.fillStyle = '#e8b84a'; g.fillRect(-16, -16, 32, 32);
        g.strokeStyle = '#7a5c20'; g.lineWidth = 2; g.strokeRect(-16, -16, 32, 32);
        g.restore();
        if (i % 3 === 0) drawFlora(g, 'dead', 1, sx + 90, GROUND_Y + 2);
      } else {
        // castle tower with crenellations and one lit window
        g.fillStyle = theme.near;
        g.fillRect(sx, GROUND_Y - h, w, h);
        for (let c = 0; c < 3; c++) g.fillRect(sx - 4 + c * (w + 8) / 3, GROUND_Y - h - 12, (w + 8) / 5, 14);
        g.fillStyle = '#ffb04a'; g.fillRect(sx + w * 0.4, GROUND_Y - h + 18, 4, 6);
      }
    }
    if (propStyle === 'fence') drawFlora(g, 'blossom', 1.25, STAGE_W * 0.62, GROUND_Y + 2); // the landmark tree

    // ---- the floating island ----
    // mist wisps drifting under the keels (portrait only — invisible on landscape)
    if (viewH - worldOffY > 620) {
      g.globalAlpha = E.mistA;
      g.fillStyle = E.mist;
      for (let i = 0; i < 4; i++) {
        const wxm = 130 + i * 520 + Math.sin(tS * 0.11 + i * 2.1) * 40;
        if (wxm > camX - 160 && wxm < camX + viewW + 160) {
          const wym = GROUND_Y + 190 + i * 22 + Math.sin(tS * 0.23 + i) * 6;
          g.beginPath(); g.ellipse(wxm, wym, 70, 12, 0, 0, 7); g.fill();
          g.beginPath(); g.ellipse(wxm - 46, wym + 6, 46, 9, 0, 0, 7); g.fill();
          g.beginPath(); g.ellipse(wxm + 52, wym + 5, 40, 8, 0, 0, 7); g.fill();
        }
      }
      g.globalAlpha = 1;
    }
    if (plan) {
      // the cached cliff strip IS the ground now
      g.drawImage(getCliffStrip(plan.world), -160, GROUND_Y - 24, STAGE_W + 320, 312);
      if (propStyle === 'road') {
        // shoulder line along the island's soil band
        g.fillStyle = 'rgba(255,220,180,0.28)';
        for (let dx0 = Math.floor(camX / 90) * 90; dx0 < camX + viewW; dx0 += 90) {
          g.fillRect(dx0, GROUND_Y + 7, 42, 4);
        }
      }
      // live swaying strands off the lip: vines / chains / rope / glowing ivy
      const rv = seeded(plan.level * 13 + 7);
      const swayMul = wid === 'pipes' ? 0.5 : wid === 'road' ? 1.3 : 1;
      g.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const ax = 140 + i * (STAGE_W - 280) / 4 + (rv() - 0.5) * 120;
        const L = 34 + rv() * 46;
        if (ax < camX - 40 || ax > camX + viewW + 40) continue;
        const sw = Math.sin(tS * 1.4 + ax * 0.031 + i) * (2 + L * 0.05) * swayMul;
        const ay = GROUND_Y + 2;
        const cpx = ax + sw * 0.4, cpy = ay + L * 0.55, ex = ax + sw, ey = ay + L;
        g.strokeStyle = E.vineInk; g.lineWidth = 3.5;
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cpx, cpy, ex, ey); g.stroke();
        g.strokeStyle = E.vine; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cpx, cpy, ex, ey); g.stroke();
        if (wid === 'home') {
          g.fillStyle = E.leaf;
          for (const u of LEAF_US) {
            const inv = 1 - u;
            const qx = inv * inv * ax + 2 * u * inv * cpx + u * u * ex;
            const qy = inv * inv * ay + 2 * u * inv * cpy + u * u * ey;
            g.beginPath(); g.ellipse(qx - 4, qy, 4, 2, -0.9 + sw * 0.02, 0, 7); g.fill();
            g.beginPath(); g.ellipse(qx + 4, qy + 1, 4, 2, 0.9 + sw * 0.02, 0, 7); g.fill();
          }
          g.beginPath(); g.arc(ex, ey, 1.5, 0, 7); g.fill();
        } else if (wid === 'pipes') {
          g.fillStyle = '#3ad4a4';
          g.globalAlpha = 0.3; g.beginPath(); g.arc(ex, ey, 4, 0, 7); g.fill();
          g.globalAlpha = 1; g.beginPath(); g.arc(ex, ey, 1.6, 0, 7); g.fill();
        } else if (wid === 'road') {
          // frayed sub-strand splitting off mid-rope
          const mqx = 0.25 * ax + 0.5 * cpx + 0.25 * ex, mqy = 0.25 * ay + 0.5 * cpy + 0.25 * ey;
          g.strokeStyle = E.vine; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(mqx, mqy); g.quadraticCurveTo(mqx + sw * 0.3, mqy + L * 0.3, mqx + sw * 0.7, mqy + L * 0.5); g.stroke();
        } else {
          g.fillStyle = '#c24ae8'; g.globalAlpha = 0.25;
          for (const u of LEAF_US) {
            const inv = 1 - u;
            const qx = inv * inv * ax + 2 * u * inv * cpx + u * u * ex;
            const qy = inv * inv * ay + 2 * u * inv * cpy + u * u * ey;
            g.beginPath(); g.arc(qx, qy, 4, 0, 7); g.fill();
          }
          g.globalAlpha = 1; g.fillStyle = '#e8b8ff';
          for (const u of LEAF_US) {
            const inv = 1 - u;
            const qx = inv * inv * ax + 2 * u * inv * cpx + u * u * ex;
            const qy = inv * inv * ay + 2 * u * inv * cpy + u * u * ey;
            g.beginPath(); g.arc(qx, qy, 1.3, 0, 7); g.fill();
          }
          g.beginPath(); g.arc(ex, ey, 1.8, 0, 7); g.fill();
        }
      }
      // platforms as floating mini-islands with swaying keel roots
      for (const pl of platforms) {
        if (!pl.cvs || pl.cvsRes !== RES) { pl.cvs = buildPlatformIsland(pl.w, plan.world); pl.cvsRes = RES; }
        g.drawImage(pl.cvs, pl.x - pl.w / 2 - 18, pl.y - 14, pl.w + 36, 76);
        const keelY0 = pl.y + 30 + Math.min(14, pl.w * 0.06);
        for (let j = 0; j < 2; j++) {
          const ax2 = pl.x + (j ? -8 : 6);
          const L2 = 18 + j * 10;
          const sw2 = Math.sin(tS * 1.4 + pl.x * 0.05 + j) * (2 + L2 * 0.05) * swayMul;
          g.strokeStyle = E.cliffInk; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(ax2, keelY0); g.quadraticCurveTo(ax2 + sw2 * 0.4, keelY0 + L2 * 0.55, ax2 + sw2, keelY0 + L2); g.stroke();
          g.strokeStyle = E.vine; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(ax2, keelY0); g.quadraticCurveTo(ax2 + sw2 * 0.4, keelY0 + L2 * 0.55, ax2 + sw2, keelY0 + L2); g.stroke();
        }
      }
    }
    // stage edge glow markers
    g.fillStyle = theme.glow + '55';
    g.fillRect(30, GROUND_Y - 60, 6, 60); g.fillRect(STAGE_W - 36, GROUND_Y - 60, 6, 60);

    // ambiance
    for (const a of ambient) {
      g.globalAlpha = a.a * (a.blink ? (0.45 + 0.55 * Math.abs(Math.sin(a.t * 3))) : 1);
      if (a.kind === 'bat') {
        g.strokeStyle = '#1d1030'; g.lineWidth = 2;
        const fl2 = Math.sin(a.t * 18) * 3;
        g.beginPath();
        g.moveTo(a.x - 6, a.y - fl2);
        g.quadraticCurveTo(a.x - 2, a.y + 2, a.x, a.y);
        g.quadraticCurveTo(a.x + 2, a.y + 2, a.x + 6, a.y - fl2);
        g.stroke();
      } else {
        g.fillStyle = a.color || theme.glow;
        g.beginPath(); g.arc(a.x, a.y, a.r, 0, 7); g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  const WEAPON_COLORS = ['#c9ccd8', '#e6ebf5', '#7fb8ff', '#c47fff', '#ff7f4a'];

  // per-color shade ramp, cached forever (bounded by the roster's palette).
  // Outline is a darkened HUE biased toward violet ink, never pure black;
  // highlights mix toward warm white for the painterly sun.
  const SHADE = new Map();
  function ramp(c) {
    let r = SHADE.get(c);
    if (!r) {
      r = {
        out: hexMix(c, '#1a1030', 0.62),
        dk: hexMix(c, '#1a1030', 0.3),
        lt: hexMix(c, '#fff6dd', 0.28),
        hi: hexMix(c, '#fff6dd', 0.55),
      };
      SHADE.set(c, r);
    }
    return r;
  }

  // shared fighter-part painters, hoisted so drawFighter allocates nothing
  function limbStroke(g, fx, fy, tx, ty, width, color) {
    // shaded capsule: hue-dark outline, shadow base, sun-shifted core, rim thread
    const r = ramp(color);
    const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1;
    let px = -dy / len, py = dx / len;
    if (px + py > 0) { px = -px; py = -py; } // perpendicular points up-left, toward the sun
    g.strokeStyle = r.out; g.lineWidth = width + 3;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(tx, ty); g.stroke();
    g.strokeStyle = r.dk; g.lineWidth = width;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(tx, ty); g.stroke();
    const s = width * 0.18;
    g.strokeStyle = color; g.lineWidth = Math.max(2, width - 2.4);
    g.beginPath(); g.moveTo(fx + px * s, fy + py * s - 0.4); g.lineTo(tx + px * s, ty + py * s - 0.4); g.stroke();
    const e = width * 0.3;
    g.strokeStyle = r.lt; g.lineWidth = Math.max(1.3, width * 0.24);
    g.beginPath(); g.moveTo(fx + px * e, fy + py * e - 0.6); g.lineTo(tx + px * e, ty + py * e - 0.6); g.stroke();
  }
  function shoePart(g, col, fx, fy) {
    const bc = ramp(col);
    g.fillStyle = bc.out; g.beginPath(); g.roundRect(fx - 5.4, fy - 6.4, 12.2, 7.6, 3); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(fx - 4.6, fy - 5.7, 10.6, 6.2, 2.6); g.fill();
    g.fillStyle = bc.lt; g.fillRect(fx - 4.6, fy - 1.1, 10.6, 1.6);
    g.fillStyle = bc.hi; g.beginPath(); g.arc(fx + 3.6, fy - 4.2, 1.1, 0, 7); g.fill();
  }
  function kneepadPart(g, col, accent, kx, ky, accentStrap) {
    const A2 = ramp(col);
    g.fillStyle = A2.out; g.beginPath(); g.arc(kx, ky, 4.2, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(kx, ky, 3.3, 0, 7); g.fill();
    g.fillStyle = A2.lt; g.beginPath(); g.arc(kx - 1, ky - 1.1, 1.4, 0, 7); g.fill();
    g.strokeStyle = accentStrap ? accent : A2.dk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(kx - 3.2, ky + 1.6); g.lineTo(kx + 3.2, ky + 1.6); g.stroke();
  }
  function thighPart(g, col, tx, ty) {
    const A2 = ramp(col);
    g.fillStyle = A2.out; g.beginPath(); g.roundRect(tx - 3.6, ty - 2.9, 7.2, 5.8, 1.6); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(tx - 3, ty - 2.3, 6, 4.6, 1.3); g.fill();
    g.fillStyle = A2.lt; g.fillRect(tx - 3, ty - 2.3, 6, 1.2);
  }

  // Ronathon's orbiting glyphs, baked once per letter+tier (fillText is slow)
  const glyphCache = {};
  function glyphSprite(ch, wc) {
    const key = ch + '|' + wc;
    let s = glyphCache[key];
    if (s) return s;
    const pc = document.createElement('canvas');
    pc.width = 24; pc.height = 28;
    const q = pc.getContext('2d');
    q.font = '800 16px Verdana, sans-serif';
    q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillStyle = ramp(wc).out; q.fillText(ch, 13.8, 15.8);
    q.fillStyle = wc; q.fillText(ch, 12, 14);
    return glyphCache[key] = pc;
  }

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

    g.scale(o.facing * o.size * (o.stretchY ? 2 - o.stretchY : 1), o.size * (o.stretchY || 1));

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
    // normalize combo-chain keys into poses
    const ak = (o.attackKey === 'X1' || o.attackKey === 'X' || o.attackKey === 'A') ? 'punch'
      : o.attackKey === 'X2' ? 'cross'
      : (o.attackKey === 'X3' || o.attackKey === 'Y') ? 'kick'
      : o.attackKey;
    if (ak === 'punch') {
      frontHand = [14 + 26 * ext, (-56 + 4 * ext) * cf];
      lean = 3 * ext;
    } else if (ak === 'cross') {
      // rear hand whips across the body
      backHand = [14 + 30 * ext, (-53 + 3 * ext) * cf];
      frontHand = [6, -48 * cf];
      lean = 5 * ext;
    } else if (ak === 'kick') {
      frontFoot = [10 + 34 * ext, -40 * ext * cf];
      lean = -5 * ext;
      backHand = [-10 - 6 * ext, -50 * cf];
    } else if (ak === 'B') {
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
      if (o.attackKey && o.attackKey !== 'B') frontHand = [22 + 24 * pExt, -48];
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
      if (o.attackKey === 'X3') frontFoot = [-8, -6 - 22 * cExt];
      else if (o.attackKey === 'B') frontHand = [12, -24 - 20 * cExt];
      else if (o.attackKey) frontHand = [18 + 22 * cExt, -12];
    }
    if (look.wobble) lean += Math.sin((o.animT || 0) * 6) * 5; // toddler balance
    const legCol = look.chicken ? '#e8a020' : o.color;
    const legCol2 = look.chicken ? '#b87a10' : o.color2;

    g.lineCap = 'round'; g.lineJoin = 'round';
    const INK = '#14101a';
    const wearsShoes = !look.baby && !look.crawl && !look.printer && !look.wrench && !look.sandwich && !look.chicken && !look.firetruck;

    // final-form look overrides (bald / beard / shirtless / muscle / fat)
    const muscleW = look.fat ? 1.9 : (look.muscle || 1);
    let armW = 7 * (1 + (muscleW - 1) * 0.7);
    if (o.weaponStyle === 'muscles' && o.weaponTier > 0) armW *= 1 + o.weaponTier * 0.32; // the arms ARE the weapon
    const torsoCol = look.shirtless ? o.skin : o.color;
    const backArmCol = look.shirtless ? ramp(o.skin).dk : o.color2;
    const frontArmCol = look.shirtless ? o.skin : o.color;

    // back limbs
    if (!look.firetruck) {
      limbStroke(g, hip[0] + lean * 0.3, hip[1], backFoot[0], backFoot[1], 8.5, legCol2);
      if (wearsShoes) shoePart(g, o.color2, backFoot[0], backFoot[1]);
      if ((o.armorTier || 0) >= 2 && wearsShoes) {
        kneepadPart(g, o.color2, o.accent, (hip[0] + backFoot[0]) / 2 + lean * 0.15, (hip[1] + backFoot[1]) / 2, (o.armorTier || 0) >= 5);
      }
      if ((o.armorTier || 0) >= 5 && wearsShoes) {
        thighPart(g, o.color2, hip[0] + (backFoot[0] - hip[0]) * 0.3, hip[1] + (backFoot[1] - hip[1]) * 0.3);
      }
    }
    if (!look.chicken && !look.firetruck) limbStroke(g, sh[0] + lean * 0.5, sh[1], backHand[0], backHand[1], armW, backArmCol);
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
    // torso, with a two-tone back shade
    limbStroke(g, hip[0] + lean * 0.3, hip[1], sh[0] + lean * 0.5, sh[1], 15 * muscleW, torsoCol);
    g.strokeStyle = ramp(torsoCol).dk; g.lineWidth = 4.5 * muscleW;
    g.beginPath();
    g.moveTo(hip[0] + lean * 0.3 - 4.5, hip[1]);
    g.lineTo(sh[0] + lean * 0.5 - 4.5, sh[1]);
    g.stroke();
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
      g.strokeStyle = ramp(o.skin).dk; g.lineWidth = 1.3;
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
    // identity props on the chest
    if (o.charId === 'jordan') {
      // the camera never leaves him
      const ccx = sh[0] + 3 + lean * 0.4, ccy = sh[1] + 10;
      g.strokeStyle = '#2a2a35'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(sh[0] - 5, sh[1] - 2); g.lineTo(ccx + 3, ccy - 3); g.stroke();
      g.fillStyle = ramp('#3a3f4a').out; g.beginPath(); g.roundRect(ccx - 4.7, ccy - 3.7, 9.4, 7.4, 1.6); g.fill();
      g.fillStyle = '#3a3f4a'; g.beginPath(); g.roundRect(ccx - 4, ccy - 3, 8, 6, 1.2); g.fill();
      g.fillStyle = '#1d1d24'; g.beginPath(); g.arc(ccx + 0.6, ccy, 2.2, 0, 7); g.fill();
      g.fillStyle = '#9fdcff'; g.beginPath(); g.arc(ccx + 1.2, ccy - 0.7, 0.8, 0, 7); g.fill();
      g.fillStyle = o.accent; g.beginPath(); g.arc(ccx - 2.6, ccy - 2.3, 0.8, 0, 7); g.fill();
    } else if (o.charId === 'ronathon') {
      // HELLO my name is RONATHON
      g.fillStyle = '#f2ede0'; g.beginPath(); g.roundRect(sh[0] + 2 + lean * 0.4, sh[1] + 6, 8, 5.2, 1); g.fill();
      g.fillStyle = '#d43b2f'; g.fillRect(sh[0] + 2 + lean * 0.4, sh[1] + 6, 8, 1.7);
      g.strokeStyle = INK; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(sh[0] + 3.2 + lean * 0.4, sh[1] + 9.6); g.lineTo(sh[0] + 8.6 + lean * 0.4, sh[1] + 9.6); g.stroke();
    }
    // visible armor in the fighter's own colors: their gear, never a grey uniform
    const at = o.armorTier || 0;
    const A2 = ramp(o.color2);
    if (at >= 2) {
      // belt pouches
      for (const px2 of [-6.6 + lean * 0.3, 1.6 + lean * 0.3]) {
        g.fillStyle = A2.out; g.beginPath(); g.roundRect(px2 - 0.5, hip[1] + 1.5, 6, 6, 1.4); g.fill();
        g.fillStyle = o.color2; g.beginPath(); g.roundRect(px2, hip[1] + 2, 5, 5, 1.1); g.fill();
        g.fillStyle = A2.lt; g.fillRect(px2, hip[1] + 2, 5, 1.3);
      }
    }
    if (at >= 3) {
      // pauldron half-domes with a rivet in the character's accent
      for (const cx2 of [sh[0] + lean * 0.5 - 7, sh[0] + lean * 0.5 + 7]) {
        const cy2 = sh[1] - 1;
        g.fillStyle = A2.out; g.beginPath(); g.arc(cx2, cy2, 5.2, Math.PI, 0); g.closePath(); g.fill();
        g.fillStyle = o.color2; g.beginPath(); g.arc(cx2, cy2, 4.3, Math.PI, 0); g.closePath(); g.fill();
        g.strokeStyle = A2.lt; g.lineWidth = 1.2;
        g.beginPath(); g.arc(cx2, cy2, 3.1, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
        g.fillStyle = o.accent; g.beginPath(); g.arc(cx2, cy2 - 2.3, 0.8, 0, 7); g.fill();
        if (at >= 5) {
          g.fillStyle = A2.out;
          g.beginPath(); g.moveTo(cx2 - 2, cy2 - 4.4); g.lineTo(cx2, cy2 - 9.6); g.lineTo(cx2 + 2, cy2 - 4.4); g.closePath(); g.fill();
          g.fillStyle = o.color2;
          g.beginPath(); g.moveTo(cx2 - 1.4, cy2 - 4.8); g.lineTo(cx2, cy2 - 8.8); g.lineTo(cx2 + 1.4, cy2 - 4.8); g.closePath(); g.fill();
        }
      }
    }
    if (at >= 4 && !look.shirtless) {
      // chest plate below the shoulder line, center ridge catching the sun
      const lx = lean * 0.4, sy = sh[1];
      g.fillStyle = A2.out;
      g.beginPath(); g.moveTo(-7.9 + lx, sy + 1.4); g.lineTo(9.9 + lx, sy + 1.4); g.lineTo(7.7 + lx, sy + 16.8); g.lineTo(-5.7 + lx, sy + 16.8); g.closePath(); g.fill();
      g.fillStyle = o.color2;
      g.beginPath(); g.moveTo(-7 + lx, sy + 2.2); g.lineTo(9 + lx, sy + 2.2); g.lineTo(7 + lx, sy + 16); g.lineTo(-5 + lx, sy + 16); g.closePath(); g.fill();
      g.strokeStyle = A2.lt; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(1 + lx, sy + 3.2); g.lineTo(1 + lx, sy + 15); g.stroke();
      g.fillStyle = o.accent;
      g.beginPath(); g.arc(-3.8 + lx, sy + 4.6, 0.7, 0, 7); g.fill();
      g.beginPath(); g.arc(5.8 + lx, sy + 4.6, 0.7, 0, 7); g.fill();
      if (at >= 5) {
        g.strokeStyle = o.accent; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(-7 + lx, sy + 2.2); g.lineTo(9 + lx, sy + 2.2); g.lineTo(7 + lx, sy + 16); g.lineTo(-5 + lx, sy + 16); g.closePath(); g.stroke();
        g.fillStyle = o.accent; g.beginPath(); g.arc(1 + lx, sy + 8.5, 1.6, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0.5 + lx, sy + 7.9, 0.6, 0, 7); g.fill();
      }
    }
    }
    // front leg
    if (!look.firetruck) {
      limbStroke(g, hip[0] + lean * 0.3, hip[1], frontFoot[0], frontFoot[1], 8.5, legCol);
      if (wearsShoes) shoePart(g, o.color2, frontFoot[0], frontFoot[1]);
      if ((o.armorTier || 0) >= 1 && wearsShoes) {
        kneepadPart(g, o.color2, o.accent, (hip[0] + frontFoot[0]) / 2 + lean * 0.15, (hip[1] + frontFoot[1]) / 2, (o.armorTier || 0) >= 5);
      }
      if ((o.armorTier || 0) >= 5 && wearsShoes) {
        thighPart(g, o.color2, hip[0] + (frontFoot[0] - hip[0]) * 0.3, hip[1] + (frontFoot[1] - hip[1]) * 0.3);
      }
    }
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
    // body-anchored enemy accessories draw UNSCALED, before the chibi head group
    if (o.hood && o.accessory) {
      if (o.accessory === 'wings') {
        const wf2 = Math.sin((o.animT || 0) * 26) * 4;
        g.fillStyle = 'rgba(232,240,255,0.65)';
        g.beginPath(); g.ellipse(-10, -58 * cf + wf2, 9, 4.5, -0.5, 0, 7); g.fill();
        g.beginPath(); g.ellipse(-13, -54 * cf - wf2, 8, 4, -0.9, 0, 7); g.fill();
      } else if (o.accessory === 'ribs') {
        g.strokeStyle = 'rgba(240,238,228,0.8)'; g.lineWidth = 1.6;
        for (let rr2 = 0; rr2 < 3; rr2++) {
          g.beginPath(); g.moveTo(-5, -58 * cf + rr2 * 6); g.lineTo(7, -58 * cf + rr2 * 6); g.stroke();
        }
      } else if (o.accessory === 'bolts') {
        g.fillStyle = '#e8c84a';
        g.beginPath(); g.arc(-3, -56 * cf, 1.8, 0, 7); g.fill();
        g.beginPath(); g.arc(5, -50 * cf, 1.8, 0, 7); g.fill();
        g.beginPath(); g.arc(-1, -44 * cf, 1.8, 0, 7); g.fill();
      } else if (o.accessory === 'drip') {
        g.fillStyle = o.color2;
        g.beginPath(); g.arc(-4, -30 * cf, 2.4, 0, 7); g.fill();
        g.beginPath(); g.arc(6, -38 * cf, 2, 0, 7); g.fill();
      }
    }
    // head — chibi-scaled as a group so every head accessory scales with it
    const hx = (look.crawl ? 17 : 3) + lean * 0.6;
    const hy = look.crawl ? -26 : headY - 7;
    g.save();
    g.translate(hx, hy); g.scale(1.32, 1.32); g.translate(-hx, -hy);
    const headCol = o.hood ? o.color2 : o.skin;
    g.fillStyle = headCol;
    g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
    g.strokeStyle = ramp(headCol).out; g.lineWidth = 2; g.stroke();
    if (!o.hood) {
      // back-of-head shading crescent + a warm sun rim up top-left
      g.save();
      g.beginPath(); g.arc(hx, hy, 8.6, 0, 7); g.clip();
      g.fillStyle = 'rgba(20,16,26,0.16)';
      g.fillRect(hx - 10, hy - 10, 5.5, 20);
      g.strokeStyle = 'rgba(255,246,221,0.4)'; g.lineWidth = 2.2;
      g.beginPath(); g.arc(hx - 0.5, hy - 1, 6.9, Math.PI * 1.02, Math.PI * 1.62); g.stroke();
      g.restore();
      // ear (hair overlaps it where styles hang low)
      if (!look.mecha && !look.helmet && !look.baby) {
        g.fillStyle = o.skin;
        g.beginPath(); g.arc(hx - 8.1, hy + 1, 2.3, 0, 7); g.fill();
        g.strokeStyle = ramp(o.skin).out; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = ramp(o.skin).dk;
        g.beginPath(); g.arc(hx - 8.1, hy + 1.2, 1, 0, 7); g.fill();
      }
    }
    // stylized hair (skipped under helmets, crowns, caps, and special looks)
    if (!o.hood && !look.bald && !look.baby && !look.mecha && !look.helmet && !look.crown && !look.cap && !look.hair && o.hairStyle && o.hairStyle !== 'none') {
      const hc = o.hairColor || '#2a2230';
      const HR = ramp(hc);
      // outline halo under the hair mass
      g.fillStyle = HR.out;
      g.beginPath(); g.arc(hx, hy - 1.5, 9.9, Math.PI, Math.PI * 2); g.fill();
      g.fillStyle = hc;
      if (o.hairStyle === 'pony') {
        g.beginPath(); g.ellipse(hx - 9, hy + 3, 3.4, 7, 0.5, 0, 7); g.fill();
      } else if (o.hairStyle === 'long') {
        g.beginPath(); g.ellipse(hx - 7.5, hy + 4, 3, 8, 0.25, 0, 7); g.fill();
        g.beginPath(); g.ellipse(hx + 8.5, hy + 4, 2.6, 7, -0.2, 0, 7); g.fill();
      }
      g.beginPath(); g.arc(hx, hy - 1.5, 9.2, Math.PI * 1.02, Math.PI * 1.98); g.fill();
      if (o.hairStyle === 'spiky') {
        for (let hs2 = 0; hs2 < 3; hs2++) {
          const hxx = hx - 5 + hs2 * 5;
          g.beginPath(); g.moveTo(hxx - 2.2, hy - 8); g.lineTo(hxx, hy - 13.5); g.lineTo(hxx + 2.2, hy - 8); g.fill();
        }
      } else if (o.hairStyle === 'shaggy') {
        for (let hs2 = 0; hs2 < 4; hs2++) {
          g.beginPath(); g.arc(hx - 6 + hs2 * 4, hy - 7.5, 2.7, 0, 7); g.fill();
        }
      }
      // highlight band on the sun side
      g.strokeStyle = HR.lt; g.lineWidth = 2;
      g.beginPath(); g.arc(hx, hy - 1.5, 7.8, Math.PI * 1.08, Math.PI * 1.55); g.stroke();
      if (o.hairStyle === 'spiky') {
        g.lineWidth = 1.3;
        for (let hs2 = 0; hs2 < 3; hs2++) {
          const hxx = hx - 5 + hs2 * 5;
          g.beginPath(); g.moveTo(hxx - 2, hy - 8.3); g.lineTo(hxx - 0.4, hy - 12.4); g.stroke();
        }
      } else if (o.hairStyle === 'shaggy') {
        g.fillStyle = HR.lt;
        g.beginPath(); g.arc(hx - 6.9, hy - 8.3, 1.1, 0, 7); g.fill();
        g.beginPath(); g.arc(hx - 2.9, hy - 8.6, 1.1, 0, 7); g.fill();
      } else if (o.hairStyle === 'pony') {
        g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(hx - 9.9, hy + 0.2); g.lineTo(hx - 8.7, hy + 4.2); g.stroke();
      } else if (o.hairStyle === 'long') {
        g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(hx - 8.2, hy + 1); g.lineTo(hx - 7.6, hy + 6); g.stroke();
        g.beginPath(); g.moveTo(hx + 8.9, hy + 1.4); g.lineTo(hx + 8.5, hy + 5.4); g.stroke();
      }
    }
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
    // the face: everyone in this family has eyes now (mecha wears a visor)
    if (!o.hood && !look.glasses && !look.mecha) {
      const ex1 = hx + 2, ex2 = hx + 6.2, ey2 = hy - 1.5;
      const blinkE = Math.sin((o.animT || 0) * 1.3 + ex1) > 0.985;
      if (o.blush || look.baby) {
        g.fillStyle = 'rgba(255,122,122,0.35)';
        g.beginPath(); g.ellipse(hx + 0.6, hy + 2.2, 1.7, 1.05, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(hx + 6.8, hy + 2, 1.7, 1.05, 0, 0, 7); g.fill();
      }
      if (o.hurt) {
        g.strokeStyle = INK; g.lineWidth = 1.3;
        for (const exx of [ex1, ex2]) {
          g.beginPath();
          g.moveTo(exx - 1.6, ey2 - 1.6); g.lineTo(exx + 1.6, ey2 + 1.6);
          g.moveTo(exx + 1.6, ey2 - 1.6); g.lineTo(exx - 1.6, ey2 + 1.6);
          g.stroke();
        }
      } else if (blinkE) {
        g.strokeStyle = INK; g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(ex1 - 1.5, ey2); g.lineTo(ex1 + 1.5, ey2);
        g.moveTo(ex2 - 1.5, ey2); g.lineTo(ex2 + 1.5, ey2);
        g.stroke();
      } else {
        // almond whites, offset pupil, sparkle, upper lid
        g.fillStyle = '#ffffff';
        g.beginPath(); g.ellipse(ex1, ey2, 1.9, 2.35, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(ex2, ey2, 1.9, 2.35, 0, 0, 7); g.fill();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex1 + 0.75, ey2 + 0.15, 1.05, 0, 7); g.fill();
        g.beginPath(); g.arc(ex2 + 0.75, ey2 + 0.15, 1.05, 0, 7); g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(ex1 + 0.35, ey2 - 0.75, 0.45, 0, 7); g.fill();
        g.beginPath(); g.arc(ex2 + 0.35, ey2 - 0.75, 0.45, 0, 7); g.fill();
        g.strokeStyle = INK; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(ex1 - 1.9, ey2 - 2); g.lineTo(ex1 + 1.9, ey2 - 2.3); g.stroke();
        g.beginPath(); g.moveTo(ex2 - 1.9, ey2 - 2); g.lineTo(ex2 + 1.9, ey2 - 2.3); g.stroke();
      }
      if (o.attackKey && !o.hurt) {
        g.strokeStyle = INK; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(ex1 - 2, ey2 - 4); g.lineTo(ex1 + 1.5, ey2 - 2.6); g.stroke();
        g.beginPath(); g.moveTo(ex2 + 2.5, ey2 - 4.2); g.lineTo(ex2 - 1, ey2 - 2.6); g.stroke();
      } else if (!o.hurt) {
        g.strokeStyle = INK; g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(ex1 - 1.8, ey2 - 4.1); g.lineTo(ex1 + 1.5, ey2 - 4.3); g.stroke();
        g.beginPath(); g.moveTo(ex2 - 1.5, ey2 - 4.3); g.lineTo(ex2 + 1.8, ey2 - 4.1); g.stroke();
      }
    }
    g.restore(); // end chibi head group
    }
    if (o.boss) { // horns
      g.fillStyle = '#e8d9b0';
      g.beginPath(); g.moveTo(-4, headY - 14); g.lineTo(-9, headY - 26); g.lineTo(-1, headY - 16); g.fill();
      g.beginPath(); g.moveTo(9, headY - 14); g.lineTo(14, headY - 26); g.lineTo(6, headY - 16); g.fill();
    }
    // front arm + weapon
    if (!look.chicken && !look.firetruck) limbStroke(g, sh[0] + lean * 0.5, sh[1], frontHand[0], frontHand[1], armW, frontArmCol);
    if (o.weaponTier > 0 && !look.chicken && !look.firetruck) {
      const tier = o.weaponTier;
      const wl = 9 + tier * 2.6;
      const wc = (o.weaponColors && o.weaponColors[tier - 1]) || WEAPON_COLORS[tier - 1];
      const chid = o.charId || '';
      const F = frontHand;
      if (o.weaponStyle === 'club' && chid === 'jacob') {
        // plumbing tools: tier 1 plunger, then pipe wrenches — gold at the top
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.7 + (o.attackKey ? (o.attackExt || 0) * 1.2 : 0));
        if (tier === 1) {
          g.strokeStyle = ramp('#c98d48').out; g.lineWidth = 4.4;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(8.5, 0); g.stroke();
          g.strokeStyle = '#c98d48'; g.lineWidth = 2.6;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(8.5, 0); g.stroke();
          g.fillStyle = ramp('#b03a2f').out;
          g.beginPath(); g.arc(9.6, 0, 4.6, -1.75, 1.75); g.closePath(); g.fill();
          g.fillStyle = '#b03a2f';
          g.beginPath(); g.arc(9.6, 0, 3.8, -1.7, 1.7); g.closePath(); g.fill();
          g.strokeStyle = '#e06a5a'; g.lineWidth = 1;
          g.beginPath(); g.arc(9.6, 0, 3, -1.4, 1.4); g.stroke();
        } else {
          g.strokeStyle = ramp(wc).out; g.lineWidth = 5.4;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 3, 0); g.stroke();
          g.strokeStyle = wc; g.lineWidth = 3.2;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 3, 0); g.stroke();
          g.fillStyle = ramp(wc).out; g.beginPath(); g.roundRect(wl - 5.2, -6.4, 7.6, 7.2, 1.4); g.fill();
          g.fillStyle = wc; g.beginPath(); g.roundRect(wl - 4.6, -5.8, 6.4, 6, 1.2); g.fill();
          g.fillStyle = INK; g.fillRect(wl - 1.7, -4.6, 2.5, 2.2);
          g.fillStyle = ramp(wc).dk; g.beginPath(); g.arc(wl - 6.1, -1.8, 1.9, 0, 7); g.fill();
          g.strokeStyle = ramp(wc).hi; g.lineWidth = 1;
          g.beginPath(); g.moveTo(1.5, -0.9); g.lineTo(wl - 5, -0.9); g.stroke();
        }
        g.restore();
      } else if (o.weaponStyle === 'club' && chid === 'samantha') {
        // foam toy sword with a star sticker
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.5 + (o.attackKey ? (o.attackExt || 0) * 1.1 : 0));
        g.fillStyle = ramp(wc).out; g.beginPath(); g.roundRect(-1.2, -3.3, wl + 2.4, 6.6, 3.1); g.fill();
        g.fillStyle = wc; g.beginPath(); g.roundRect(0, -2.5, wl, 5, 2.5); g.fill();
        g.fillStyle = tier === 1 ? '#4ab2e8' : '#ffd24a'; g.fillRect(-1.8, -4.1, 2.6, 8.2);
        g.fillStyle = '#ffffff';
        const stx = wl * 0.55;
        g.beginPath();
        g.moveTo(stx - 2, 0); g.lineTo(stx - 0.5, -0.5); g.lineTo(stx, -2); g.lineTo(stx + 0.5, -0.5);
        g.lineTo(stx + 2, 0); g.lineTo(stx + 0.5, 0.5); g.lineTo(stx, 2); g.lineTo(stx - 0.5, 0.5);
        g.closePath(); g.fill();
        g.strokeStyle = ramp(wc).hi; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(1, -1.3); g.lineTo(wl - 2, -1.3); g.stroke();
        g.restore();
      } else if (o.weaponStyle === 'club' && chid === 'levi') {
        // knobby caveman clubs; tier 5 is the carnival clown hammer
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.75 + (o.attackKey ? (o.attackExt || 0) * 1.25 : 0));
        if (tier < 5) {
          g.fillStyle = ramp(wc).out;
          g.beginPath(); g.moveTo(0, -2.3); g.lineTo(wl, -3.9); g.lineTo(wl + 2.6, 0); g.lineTo(wl, 3.9); g.lineTo(0, 2.3); g.closePath(); g.fill();
          g.fillStyle = wc;
          g.beginPath(); g.moveTo(0, -1.5); g.lineTo(wl, -3); g.lineTo(wl + 1.6, 0); g.lineTo(wl, 3); g.lineTo(0, 1.5); g.closePath(); g.fill();
          g.fillStyle = ramp(wc).dk;
          g.beginPath(); g.arc(wl * 0.45, -1.2, 1, 0, 7); g.fill();
          g.beginPath(); g.arc(wl * 0.7, 1.4, 1, 0, 7); g.fill();
          g.strokeStyle = ramp(wc).dk; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(wl * 0.3, -2.2); g.lineTo(wl * 0.3, 2.2); g.stroke();
          g.strokeStyle = ramp(wc).hi; g.lineWidth = 1.1;
          g.beginPath(); g.moveTo(1, -1); g.lineTo(wl - 2, -2.2); g.stroke();
        } else {
          g.strokeStyle = ramp('#c98d48').out; g.lineWidth = 4.6;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 4, 0); g.stroke();
          g.strokeStyle = '#c98d48'; g.lineWidth = 2.8;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 4, 0); g.stroke();
          g.fillStyle = ramp(wc).out; g.beginPath(); g.roundRect(wl - 6.5, -6.7, 11, 13.4, 3.4); g.fill();
          g.fillStyle = wc; g.beginPath(); g.roundRect(wl - 5.8, -6, 9.6, 12, 3); g.fill();
          g.fillStyle = '#ffffff'; g.fillRect(wl - 5.8, -6, 2, 12); g.fillRect(wl + 1, -6, 1.6, 12);
          g.strokeStyle = ramp(wc).hi; g.lineWidth = 1.2;
          g.beginPath(); g.arc(wl - 3.2, -3.4, 2.2, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
        }
        g.restore();
      } else if (o.weaponStyle === 'club') {
        g.strokeStyle = wc; g.lineWidth = 5;
        g.beginPath(); g.moveTo(F[0], F[1]); g.lineTo(F[0] + wl * 0.7, F[1] - wl * 0.5); g.stroke();
        g.fillStyle = wc;
        g.beginPath(); g.arc(F[0] + wl * 0.7, F[1] - wl * 0.5, 4.5, 0, 7); g.fill();
      } else if (o.weaponStyle === 'staff') {
        // Myah's broom, carried near-upright; tier 5 is the sentient robot mop
        g.save(); g.translate(F[0], F[1]); g.rotate(-1.05 + (o.attackKey ? (o.attackExt || 0) * 0.9 : 0));
        g.strokeStyle = ramp('#c9a86a').out; g.lineWidth = 3.8;
        g.beginPath(); g.moveTo(-3, 0); g.lineTo(wl, 0); g.stroke();
        g.strokeStyle = '#c9a86a'; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(-3, 0); g.lineTo(wl, 0); g.stroke();
        g.fillStyle = ramp(wc).out;
        g.beginPath(); g.moveTo(wl - 1, -3.6); g.lineTo(wl + 5.8, -4.8); g.lineTo(wl + 6.6, 4.8); g.lineTo(wl - 1, 3.6); g.closePath(); g.fill();
        g.fillStyle = wc;
        g.beginPath(); g.moveTo(wl - 0.4, -3); g.lineTo(wl + 5.4, -4); g.lineTo(wl + 6, 4); g.lineTo(wl - 0.4, 3); g.closePath(); g.fill();
        g.strokeStyle = ramp(wc).dk; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(wl + 0.5, -2); g.lineTo(wl + 5.6, -2.6); g.stroke();
        g.beginPath(); g.moveTo(wl + 0.5, 0); g.lineTo(wl + 5.9, 0); g.stroke();
        g.beginPath(); g.moveTo(wl + 0.5, 2); g.lineTo(wl + 5.6, 2.6); g.stroke();
        g.fillStyle = o.accent; g.fillRect(wl - 2.3, -3.3, 2.2, 6.6);
        if (tier >= 5) {
          g.fillStyle = '#4adbe8'; g.beginPath(); g.arc(wl + 2.6, 0, 1.4, 0, 7); g.fill();
          g.strokeStyle = ramp('#4adbe8').hi; g.lineWidth = 0.8;
          g.beginPath(); g.arc(wl + 2.6, 0, 2.2, 0, 7); g.stroke();
        }
        g.restore();
      } else if (o.weaponStyle === 'noodle') {
        // pool noodle: outline, core, sun stripe, honest tube end
        const wob = Math.sin((o.animT || 0) * 9) * 4;
        const nx = F[0] + wl + 2, ny = F[1] - wl * 0.3 + wob;
        g.lineCap = 'round';
        g.strokeStyle = ramp(wc).out; g.lineWidth = 6.6;
        g.beginPath(); g.moveTo(F[0], F[1]); g.quadraticCurveTo(F[0] + wl * 0.6, F[1] - wl * 0.8, nx, ny); g.stroke();
        g.strokeStyle = wc; g.lineWidth = 4.6;
        g.beginPath(); g.moveTo(F[0], F[1]); g.quadraticCurveTo(F[0] + wl * 0.6, F[1] - wl * 0.8, nx, ny); g.stroke();
        g.strokeStyle = ramp(wc).lt; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(F[0], F[1] - 1.2); g.quadraticCurveTo(F[0] + wl * 0.6, F[1] - wl * 0.8 - 1.2, nx, ny - 1.2); g.stroke();
        g.fillStyle = ramp(wc).dk; g.beginPath(); g.arc(nx, ny, 2.3, 0, 7); g.fill();
        g.fillStyle = INK; g.beginPath(); g.arc(nx, ny, 0.9, 0, 7); g.fill();
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
        // the arms ARE the weapon: shaded bicep bumps from tier 2 up
        if (tier >= 2) {
          const RS = ramp(o.skin);
          const bx = (sh[0] + F[0]) / 2, by = (sh[1] + F[1]) / 2 - 2, br = 2.2 + tier * 0.9;
          const bx2 = (sh[0] + backHand[0]) / 2, by2 = (sh[1] + backHand[1]) / 2 - 2, br2 = 2 + tier * 0.8;
          for (const [mx2, my2, mr] of [[bx, by, br], [bx2, by2, br2]]) {
            g.fillStyle = RS.out; g.beginPath(); g.arc(mx2, my2, mr + 1, 0, 7); g.fill();
            g.fillStyle = o.skin; g.beginPath(); g.arc(mx2, my2, mr, 0, 7); g.fill();
            g.fillStyle = RS.lt; g.beginPath(); g.arc(mx2 - mr * 0.3, my2 - mr * 0.35, mr * 0.5, 0, 7); g.fill();
            g.strokeStyle = RS.dk; g.lineWidth = 0.8;
            g.beginPath(); g.arc(mx2, my2 + mr * 0.35, mr * 0.55, 0.3, 2.8); g.stroke();
          }
          if (tier >= 5) {
            g.fillStyle = '#ffffff';
            const px3 = bx + br * 0.5, py3 = by - br * 0.7;
            g.beginPath();
            g.moveTo(px3 - 1.3, py3); g.lineTo(px3 - 0.35, py3 - 0.35); g.lineTo(px3, py3 - 1.3); g.lineTo(px3 + 0.35, py3 - 0.35);
            g.lineTo(px3 + 1.3, py3); g.lineTo(px3 + 0.35, py3 + 0.35); g.lineTo(px3, py3 + 1.3); g.lineTo(px3 - 0.35, py3 + 0.35);
            g.closePath(); g.fill();
          }
        }
      } else if (o.weaponStyle === 'letters' || o.weaponStyle === 'sandwich' || o.weaponStyle === 'book' || o.weaponStyle === 'none') {
        // these ride ON the hands — drawn after the fists block
      } else if (o.weaponStyle === 'swat') {
        // her weapon is disappointment; visible only mid-swat
        if (o.attackKey && (o.attackExt || 0) > 0.3) {
          g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2 + tier * 0.3;
          g.beginPath(); g.arc(F[0] - 2, F[1], 7, -0.9, 0.6); g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.4)';
          g.beginPath(); g.arc(F[0] + 6, F[1] - 5, 0.7, 0, 7); g.fill();
          g.beginPath(); g.arc(F[0] + 7.5, F[1] - 1, 0.7, 0, 7); g.fill();
        }
      } else if (o.weaponStyle === 'feet') {
        // the kicks are the weapon: glow rides the feet, wraps ride the ankles
        g.fillStyle = wc; g.globalAlpha = 0.5;
        g.beginPath(); g.arc(frontFoot[0], frontFoot[1] - 2, 5, 0, 7); g.fill();
        g.beginPath(); g.arc(backFoot[0], backFoot[1] - 2, 4.6, 0, 7); g.fill();
        g.globalAlpha = 1;
        g.strokeStyle = wc; g.lineWidth = 2;
        g.beginPath(); g.moveTo(frontFoot[0] - 3.6, frontFoot[1] - 4.8); g.lineTo(frontFoot[0] + 4.6, frontFoot[1] - 4.8); g.stroke();
        g.beginPath(); g.moveTo(backFoot[0] - 3.6, backFoot[1] - 4.8); g.lineTo(backFoot[0] + 4.6, backFoot[1] - 4.8); g.stroke();
      } else if (look.mecha) {
        // Mecha Hayes keeps the cyan energy blade
        const bl = (10 + tier * 4.5) * 1.5;
        g.strokeStyle = '#4adbe8'; g.lineWidth = 3.4;
        g.shadowColor = '#4adbe8'; g.shadowBlur = 9;
        g.beginPath(); g.moveTo(F[0], F[1]); g.lineTo(F[0] + bl, F[1] - bl * 0.35); g.stroke();
        g.shadowBlur = 0;
      } else if (chid === 'jerod') {
        // 3D-printed sword with layer striations
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.55 + (o.attackKey ? (o.attackExt || 0) * 1.1 : 0));
        g.fillStyle = ramp(wc).out;
        g.beginPath(); g.roundRect(-1.2, -2.9, wl + 2.4, 5.8, 1.5); g.fill();
        g.beginPath(); g.moveTo(wl + 1, -2.9); g.lineTo(wl + 4.4, 0); g.lineTo(wl + 1, 2.9); g.closePath(); g.fill();
        g.fillStyle = wc;
        g.beginPath(); g.roundRect(0, -2, wl, 4, 1); g.fill();
        g.beginPath(); g.moveTo(wl, -2); g.lineTo(wl + 3.2, 0); g.lineTo(wl, 2); g.closePath(); g.fill();
        g.strokeStyle = ramp(wc).dk; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(1, -0.9); g.lineTo(wl - 0.5, -0.9); g.stroke();
        g.beginPath(); g.moveTo(1, 0.9); g.lineTo(wl - 0.5, 0.9); g.stroke();
        g.fillStyle = '#4a5060'; g.fillRect(-1.7, -3.5, 2.3, 7);
        g.strokeStyle = ramp(wc).hi; g.lineWidth = 1;
        g.beginPath(); g.moveTo(1, -1.5); g.lineTo(wl - 1.5, -1.5); g.stroke();
        g.restore();
      } else if (chid === 'tim') {
        // fire axe; tier 5 is the hi-vis Jaws of Life
        const headC = tier === 5 ? '#f2ee4a' : '#d43b2f';
        const edgeC = tier === 5 ? '#ffffff' : '#e6ebf5';
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.6 + (o.attackKey ? (o.attackExt || 0) * 1.15 : 0));
        g.strokeStyle = ramp('#c98d48').out; g.lineWidth = 4.8;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 2, 0); g.stroke();
        g.strokeStyle = '#c98d48'; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(wl - 2, 0); g.stroke();
        g.fillStyle = '#1d1d24'; g.beginPath(); g.arc(0, 0, 1.6, 0, 7); g.fill();
        const x0 = wl - 2;
        g.fillStyle = ramp(headC).out;
        g.beginPath(); g.moveTo(x0 - 2.2, -6.9); g.lineTo(x0 + 4.6, -5.2); g.lineTo(x0 + 5.4, -0.4); g.lineTo(x0 - 4.6, -1.2); g.closePath(); g.fill();
        g.fillStyle = headC;
        g.beginPath(); g.moveTo(x0 - 1.8, -6.2); g.lineTo(x0 + 4.2, -4.6); g.lineTo(x0 + 4.8, -0.8); g.lineTo(x0 - 4.2, -1.6); g.closePath(); g.fill();
        g.fillStyle = edgeC;
        g.beginPath(); g.moveTo(x0 + 3.4, -4.9); g.lineTo(x0 + 4.8, -0.9); g.lineTo(x0 + 3.6, -1); g.lineTo(x0 + 2.4, -4.4); g.closePath(); g.fill();
        g.fillStyle = headC;
        g.beginPath(); g.moveTo(x0 - 3.8, -3.6); g.lineTo(x0 - 6.6, -2.6); g.lineTo(x0 - 3.8, -1.8); g.closePath(); g.fill();
        g.fillStyle = ramp(headC).hi; g.beginPath(); g.arc(x0 - 0.6, -4.9, 0.9, 0, 7); g.fill();
        g.restore();
      } else if (chid === 'addi') {
        // ice sword: faceted crystal with a twinkle
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.6 + (o.attackKey ? (o.attackExt || 0) * 1.2 : 0));
        g.fillStyle = ramp(wc).out;
        g.beginPath(); g.moveTo(1.4, -3.1); g.lineTo(wl * 0.55, -3.7); g.lineTo(wl + 4.2, 0); g.lineTo(wl * 0.55, 3.7); g.lineTo(1.4, 3.1); g.closePath(); g.fill();
        g.fillStyle = wc;
        g.beginPath(); g.moveTo(2, -2.4); g.lineTo(wl * 0.55, -3); g.lineTo(wl + 3.2, 0); g.lineTo(wl * 0.55, 3); g.lineTo(2, 2.4); g.closePath(); g.fill();
        g.fillStyle = '#e8fbff';
        g.beginPath(); g.moveTo(wl * 0.3, -2.2); g.lineTo(wl + 2.4, -0.2); g.lineTo(wl * 0.3, -0.2); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(2.5, 0.5); g.lineTo(wl + 1, 0.5); g.stroke();
        g.fillStyle = ramp('#9fdcff').out;
        g.beginPath(); g.moveTo(1, -4.9); g.lineTo(3.9, 0); g.lineTo(1, 4.9); g.lineTo(-1.9, 0); g.closePath(); g.fill();
        g.fillStyle = '#9fdcff';
        g.beginPath(); g.moveTo(1, -4.2); g.lineTo(3.2, 0); g.lineTo(1, 4.2); g.lineTo(-1.2, 0); g.closePath(); g.fill();
        g.globalAlpha = 0.5 + 0.5 * Math.sin((o.animT || 0) * 7);
        g.fillStyle = '#ffffff';
        const tx2 = wl * 0.7, ty2 = -2.8;
        g.beginPath();
        g.moveTo(tx2 - 1.6, ty2); g.lineTo(tx2 - 0.45, ty2 - 0.45); g.lineTo(tx2, ty2 - 1.6); g.lineTo(tx2 + 0.45, ty2 - 0.45);
        g.lineTo(tx2 + 1.6, ty2); g.lineTo(tx2 + 0.45, ty2 + 0.45); g.lineTo(tx2, ty2 + 1.6); g.lineTo(tx2 - 0.45, ty2 + 0.45);
        g.closePath(); g.fill();
        g.globalAlpha = 1;
        g.restore();
      } else {
        // knight sword (Hayes and any future blade): gold guard, tier 5 flames
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.6 + (o.attackKey ? (o.attackExt || 0) * 1.2 : 0));
        g.fillStyle = ramp(wc).out;
        g.beginPath(); g.moveTo(1.4, -2.7); g.lineTo(wl + 1.5, -2.7); g.lineTo(wl + 4.8, 0); g.lineTo(wl + 1.5, 2.7); g.lineTo(1.4, 2.7); g.closePath(); g.fill();
        g.fillStyle = wc;
        g.beginPath(); g.moveTo(2, -1.9); g.lineTo(wl + 1.2, -1.9); g.lineTo(wl + 3.7, 0); g.lineTo(wl + 1.2, 1.9); g.lineTo(2, 1.9); g.closePath(); g.fill();
        g.strokeStyle = ramp(wc).dk; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(3, 0.3); g.lineTo(wl + 1, 0.3); g.stroke();
        g.strokeStyle = ramp(wc).hi; g.lineWidth = 1;
        g.beginPath(); g.moveTo(2.6, -1.1); g.lineTo(wl + 1.6, -1.1); g.stroke();
        g.fillStyle = ramp('#ffd24a').out; g.fillRect(0.6, -4.8, 3, 9.6);
        g.fillStyle = '#ffd24a'; g.fillRect(1, -4.4, 2.2, 8.8);
        g.beginPath(); g.arc(-1.2, 0, 1.7, 0, 7); g.fill();
        if (tier >= 5 && chid === 'hayes') {
          g.fillStyle = 'rgba(255,178,58,0.85)';
          const fl3 = Math.sin((o.animT || 0) * 13) * 1.5;
          g.beginPath(); g.moveTo(wl * 0.4, -2); g.lineTo(wl * 0.5, -5.6 - fl3); g.lineTo(wl * 0.62, -2); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(wl * 0.68, -2); g.lineTo(wl * 0.74, -3.8 + fl3 * 0.5); g.lineTo(wl * 0.8, -2); g.closePath(); g.fill();
        }
        g.restore();
      }
    }
    if (look.mecha && !o.onGround) {
      // jet thrusters
      g.fillStyle = 'rgba(255,176,74,0.9)';
      g.beginPath(); g.moveTo(backFoot[0] - 3, backFoot[1] + 1); g.lineTo(backFoot[0], backFoot[1] + 10 + Math.random() * 4); g.lineTo(backFoot[0] + 3, backFoot[1] + 1); g.fill();
      g.beginPath(); g.moveTo(frontFoot[0] - 3, frontFoot[1] + 1); g.lineTo(frontFoot[0], frontFoot[1] + 10 + Math.random() * 4); g.lineTo(frontFoot[0] + 3, frontFoot[1] + 1); g.fill();
    }
    // hands as mitts: outline disk, sun spot, knuckle notch
    if (!look.chicken && !look.firetruck) {
      const fr = look.bigFists ? 8 : 3.6;
      const skinC = o.hood ? o.color2 : o.skin;
      const rs2 = ramp(skinC);
      for (const [hx2, hy2, hr] of [[frontHand[0], frontHand[1], fr], [backHand[0], backHand[1], fr * 0.94]]) {
        g.fillStyle = rs2.out; g.beginPath(); g.arc(hx2, hy2, hr + 1.1, 0, 7); g.fill();
        g.fillStyle = skinC; g.beginPath(); g.arc(hx2, hy2, hr, 0, 7); g.fill();
        g.fillStyle = rs2.lt; g.beginPath(); g.arc(hx2 - hr * 0.3, hy2 - hr * 0.32, hr * 0.52, 0, 7); g.fill();
        g.fillStyle = rs2.dk; g.beginPath(); g.arc(hx2 + hr * 0.55, hy2 + hr * 0.28, hr * 0.32, 0, 7); g.fill();
      }
    }
    // hand-riding weapons draw over the mitts
    if (o.weaponTier > 0 && !look.chicken && !look.firetruck) {
      const tier = o.weaponTier;
      const wc = (o.weaponColors && o.weaponColors[tier - 1]) || WEAPON_COLORS[tier - 1];
      const chid = o.charId || '';
      const F = frontHand;
      if (o.weaponStyle === 'none' && chid === 'todd') {
        // knuckle wraps over both mitts
        const fr = look.bigFists ? 8 : 3.6;
        const WR = ramp('#f2ede0');
        for (const [hx2, hy2, hr] of [[F[0], F[1], fr], [backHand[0], backHand[1], fr * 0.94]]) {
          g.fillStyle = WR.out; g.beginPath(); g.roundRect(hx2 - hr - 0.6, hy2 - 3.2, hr * 2 + 1.2, 6, 2.4); g.fill();
          g.fillStyle = '#f2ede0'; g.beginPath(); g.roundRect(hx2 - hr + 0.2, hy2 - 2.5, hr * 2 - 0.4, 4.6, 2); g.fill();
          g.strokeStyle = WR.dk; g.lineWidth = 0.9;
          g.beginPath(); g.moveTo(hx2 - hr + 0.6, hy2 - 0.8); g.lineTo(hx2 + hr - 0.6, hy2 - 0.8); g.stroke();
          g.beginPath(); g.moveTo(hx2 - hr + 0.6, hy2 + 1); g.lineTo(hx2 + hr - 0.6, hy2 + 1); g.stroke();
          if (tier >= 3) {
            g.fillStyle = tier >= 5 ? '#ffd24a' : '#c9ccd8';
            g.beginPath(); g.arc(hx2 - 2, hy2 - 2.9, 0.7, 0, 7); g.fill();
            g.beginPath(); g.arc(hx2, hy2 - 2.9, 0.7, 0, 7); g.fill();
            g.beginPath(); g.arc(hx2 + 2, hy2 - 2.9, 0.7, 0, 7); g.fill();
          }
        }
      } else if (o.weaponStyle === 'none') {
        g.fillStyle = wc; g.globalAlpha = 0.85;
        g.beginPath(); g.arc(F[0], F[1], 5.5, 0, 7); g.fill();
        g.beginPath(); g.arc(backHand[0], backHand[1], 5, 0, 7); g.fill();
        g.globalAlpha = 1;
      } else if (o.weaponStyle === 'book') {
        // hardback held flat on the palm
        const bw = 9 + tier * 1.4, bh = 7 + tier * 0.8;
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.15 + (o.attackKey ? (o.attackExt || 0) * 0.5 : 0));
        g.fillStyle = ramp(wc).out; g.beginPath(); g.roundRect(-1.4, -bh - 1.2, bw + 2.8, bh + 2.4, 1.6); g.fill();
        g.fillStyle = wc; g.fillRect(0, -bh, bw, bh);
        g.fillStyle = '#fff8e6'; g.fillRect(bw - 2.2, -bh + 1, 2.2, bh - 2);
        g.fillStyle = ramp(wc).lt; g.fillRect(0, -bh, 2.2, bh);
        g.fillStyle = ramp(wc).hi; g.fillRect(3.4, -bh + 2.4, bw - 7, 1.4);
        g.restore();
      } else if (o.weaponStyle === 'sandwich') {
        // the Little Bear Special, fully stacked
        const sw = 8 + tier * 1.7;
        g.save(); g.translate(F[0], F[1]); g.rotate(-0.1 + (o.attackKey ? (o.attackExt || 0) * 0.35 : 0));
        g.fillStyle = ramp('#e0a860').out; g.beginPath(); g.roundRect(-2.8, -8.8, sw + 2.8, 9.8, 2); g.fill();
        g.fillStyle = '#c98d48'; g.fillRect(-2, -2.2, sw, 2.4);
        g.fillStyle = '#7dc45f';
        for (let lx2 = -1; lx2 <= sw - 3; lx2 += 3) { g.beginPath(); g.arc(lx2, -2.8, 1.4, 0, 7); g.fill(); }
        g.fillStyle = '#d43b2f'; g.fillRect(-1, -4.3, sw - 2, 1.7);
        g.fillStyle = '#ffd24a';
        g.beginPath(); g.moveTo(-1.5, -5); g.lineTo(sw - 3, -5); g.lineTo(sw - 5, -6.8); g.closePath(); g.fill();
        g.fillStyle = '#e0a860'; g.beginPath(); g.roundRect(-2, -8.6, sw, 4.6, 2.4); g.fill();
        g.fillStyle = '#fff4dd';
        g.beginPath(); g.ellipse(1.5, -7.3, 0.9, 0.6, 0.4, 0, 7); g.fill();
        g.beginPath(); g.ellipse(sw * 0.5, -7.9, 0.9, 0.6, -0.3, 0, 7); g.fill();
        g.beginPath(); g.ellipse(sw - 3.5, -7.1, 0.9, 0.6, 0.5, 0, 7); g.fill();
        g.strokeStyle = '#f0c084'; g.lineWidth = 1;
        g.beginPath(); g.arc(1.5, -6.2, 2.6, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
        g.restore();
      } else if (o.weaponStyle === 'letters') {
        // his name orbits his fist, spelling doom — glyphs baked, one unmirror
        const word = (o.weaponWord || 'RON').slice(0, 9);
        g.save();
        g.scale(o.facing, 1); // unmirror the glyphs
        for (let li = 0; li < word.length; li++) {
          if (word[li] === ' ') continue;
          const ang = (o.animT || 0) * 1.3 + li * (Math.PI * 2 / word.length);
          const gx = F[0] + Math.cos(ang) * 13, gy = F[1] + Math.sin(ang) * 8;
          g.drawImage(glyphSprite(word[li], wc), o.facing * gx - 6, gy - 7, 12, 14);
        }
        g.restore();
      } else if (o.weaponStyle === 'teeth') {
        // chatter-teeth toy riding the fist, always chattering
        const tw = 7 + tier * 0.8;
        const chatter = o.attackKey ? (1 - (o.attackExt || 0)) * 3 : 1.4 + 1.2 * Math.sin((o.animT || 0) * 10);
        g.fillStyle = ramp('#ff8aa0').out;
        g.beginPath(); g.arc(F[0], F[1] + 1.5, 5.2, 0, Math.PI); g.closePath(); g.fill();
        g.fillStyle = '#ff8aa0';
        g.beginPath(); g.arc(F[0], F[1] + 1.5, 4.4, 0, Math.PI); g.closePath(); g.fill();
        g.fillStyle = '#b8b4a8';
        g.fillRect(F[0] - tw - 0.7, F[1] - 2.9 - chatter, tw * 2 + 1.4, 3.3);
        g.fillRect(F[0] - tw - 0.7, F[1] - 0.6 + chatter * 0.4, tw * 2 + 1.4, 2.9);
        g.fillStyle = '#ffffff';
        g.fillRect(F[0] - tw, F[1] - 2.4 - chatter, tw * 2, 2.6);
        g.fillRect(F[0] - tw, F[1] - 0.2 + chatter * 0.4, tw * 2, 2.2);
        g.strokeStyle = '#d8d4c8'; g.lineWidth = 0.7;
        for (const gx2 of [F[0] - tw / 2, F[0], F[0] + tw / 2]) {
          g.beginPath(); g.moveTo(gx2, F[1] - 2.4 - chatter); g.lineTo(gx2, F[1] + 2 + chatter * 0.4); g.stroke();
        }
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(F[0] - 1.6, F[1] - 4.6 - chatter, 1.3, 0, 7); g.fill();
        g.beginPath(); g.arc(F[0] + 1.9, F[1] - 4.8 - chatter, 1.3, 0, 7); g.fill();
        g.fillStyle = INK;
        g.beginPath(); g.arc(F[0] - 1.3, F[1] - 4.6 - chatter, 0.6, 0, 7); g.fill();
        g.beginPath(); g.arc(F[0] + 2.2, F[1] - 4.8 - chatter, 0.6, 0, 7); g.fill();
      }
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

  // unique creature bodies live in js/skins-*.js; this shim owns the
  // shared transform, shadow, and post overlays so bodies stay pure
  const skinCtx = { walkCyc: 0, animT: 0, attackKey: null, hurt: false, moving: false, elite: false };
  function drawEnemySkin(g, e, key) {
    g.save();
    g.translate(e.x, e.y);
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath(); g.ellipse(0, 2, 22 * e.size, 5, 0, 0, 7); g.fill();
    g.scale(e.facing * e.size, e.size);
    skinCtx.walkCyc = e.walkCyc || 0;
    skinCtx.animT = e.animT || 0;
    skinCtx.attackKey = key;
    skinCtx.hurt = e.hurtT > 0;
    skinCtx.moving = e.state === 'approach' && e.frozenT <= 0;
    window.ENEMY_BODIES[e.def.body](g, skinCtx);
    g.restore();
    if (e.flash > 0) {
      g.globalAlpha = Math.min(0.7, e.flash);
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(e.x, e.y - 45 * e.size, 20 * e.size, 42 * e.size, 0, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    if (e.frozenT > 0) {
      g.globalAlpha = 0.45;
      g.fillStyle = '#9fdcff';
      g.beginPath(); g.ellipse(e.x, e.y - 45 * e.size, 22 * e.size, 46 * e.size, 0, 0, 7); g.fill();
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
    if (window.BOSS_BODIES && window.BOSS_BODIES[kind]) {
      window.BOSS_BODIES[kind](g, e, t);
    } else if (kind === 'goose') {
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

  // fast-parallax foreground silhouettes: the depth seller
  function drawForeground() {
    if (!plan) return;
    const g = rctx;
    g.setTransform(lowW / viewW, 0, 0, lowW / viewW, 0, 0);
    const period = 320;
    const off = ((camX * 1.35) % period + period) % period;
    const yb = viewH;
    const props = plan.world.props;
    g.fillStyle = props === 'fence' ? 'rgba(18,28,14,0.85)' : props === 'road' ? 'rgba(20,12,10,0.85)' : 'rgba(8,6,12,0.85)';
    for (let sx = -period; sx < viewW + period; sx += period) {
      const x = sx - off + period;
      if (props === 'fence') {
        g.beginPath(); g.arc(x, yb + 28, 62, Math.PI, 0); g.fill();
      } else if (props === 'pipes') {
        g.fillRect(x - 16, yb - 46, 32, 46);
        g.fillRect(x - 24, yb - 54, 48, 12);
      } else if (props === 'road') {
        g.fillRect(x - 5, yb - 42, 10, 42);
        g.fillRect(x - 70, yb - 34, 140, 8);
      } else {
        g.fillRect(x - 42, yb - 30, 84, 30);
        g.fillRect(x - 42, yb - 44, 18, 16);
        g.fillRect(x + 24, yb - 44, 18, 16);
      }
    }
  }

  function drawEntities() {
    const g = rctx;
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
        if (window.ENEMY_BODIES && window.ENEMY_BODIES.tire) {
          // 0.88: the lugs reach r25 in body space; scaled they sit flush at r22
          g.scale(e.size * 0.88, e.size * 0.88);
          skinCtx.walkCyc = e.walkCyc || 0;
          skinCtx.animT = e.animT || 0;
          skinCtx.attackKey = e.state === 'windup' ? 'windup' : e.state === 'strike' ? 'strike' : null;
          skinCtx.hurt = e.hurtT > 0;
          skinCtx.moving = e.state === 'approach' && e.frozenT <= 0;
          window.ENEMY_BODIES.tire(g, skinCtx);
        } else {
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
        }
        g.restore();
      } else {
        if (e.def.body && window.ENEMY_BODIES && window.ENEMY_BODIES[e.def.body]) {
          drawEnemySkin(g, e, key);
        } else {
          drawFighter(g, {
            x: e.x, y: e.y, facing: e.facing, size: e.size,
            color: e.def.color, color2: e.def.color2, accent: e.def.color2, skin: e.def.color,
            hood: true, boss: !!e.def.boss, accessory: e.def.accessory, eyeColor: e.def.boss ? '#ff4a3a' : '#ffd34a',
            moving: e.state === 'approach' && e.frozenT <= 0, walkCyc: e.walkCyc, animT: e.animT,
            onGround: e.onGround !== false, attackKey: key,
            hurt: e.hurtT > 0, flash: e.flash, frozen: e.frozenT > 0,
            weaponTier: 0, crouch: false, ascended: false,
          });
        }
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
        if (!paused && !hitstop && particles.length < 300 && Math.random() < 0.15) particles.push({ x: e.x + rand(-14, 14), y: e.y - rand(20, e.h), vx: 0, vy: -40, life: 0.4, max: 0.4, r: 1.5, color: '#ffd24a', grav: false });
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
        hairStyle: m.cdef.hairStyle, hairColor: m.cdef.hairColor, charId: m.cdef.id, blush: m.cdef.blush,
        moving: m.strikeT <= 0, walkCyc: m.walkCyc, animT: m.animT,
        onGround: m.y >= GROUND_Y - 1, attackKey: m.strikeT > 0 ? 'strike' : null,
        hurt: false, flash: 0, frozen: false, weaponTier: 0, weaponStyle: 'none', crouch: false, ascended: false,
        look: m.cdef.baseLook, // crawling babies stay crawling babies
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
          armorTier: p.upg.armor,
          hairStyle: p.cdef.hairStyle, hairColor: p.cdef.hairColor, charId: p.cdef.id, blush: p.cdef.blush,
          stretchY: p.landT > 0 ? 0.9 : (!p.onGround && p.vy < -160 ? 1.07 : 1),
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

    // melee slash arcs
    for (const s of slashes) {
      g.globalAlpha = Math.max(0, s.t / s.max) * 0.85;
      g.save();
      g.translate(s.x, s.y);
      g.scale(s.facing, 1);
      const grow = 0.6 + (1 - s.t / s.max) * 0.5;
      g.strokeStyle = s.color; g.lineWidth = 4.5;
      g.beginPath();
      if (s.up) g.arc(0, 6, s.size * grow, -Math.PI * 0.85, -Math.PI * 0.15);
      else g.arc(-s.size * 0.25, 0, s.size * grow, -Math.PI * 0.4, Math.PI * 0.32);
      g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 2;
      g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;

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
      } else if (pr.shape === 'plane') {
        g.save();
        g.translate(pr.x, pr.y);
        g.scale(Math.sign(pr.vx) || 1, 1);
        g.fillStyle = '#f2f4f8';
        g.beginPath(); g.moveTo(9, 0); g.lineTo(-7, -5); g.lineTo(-3, 0); g.lineTo(-7, 5); g.closePath(); g.fill();
        g.strokeStyle = '#8d8d96'; g.lineWidth = 1; g.stroke();
        g.restore();
      } else if (pr.shape === 'star') {
        g.save();
        g.translate(pr.x, pr.y);
        g.rotate(pr.life * 18);
        g.fillStyle = pr.color;
        g.beginPath();
        for (let i2 = 0; i2 < 8; i2++) {
          const a2 = i2 * Math.PI / 4, r2 = i2 % 2 === 0 ? pr.r + 3 : pr.r * 0.45;
          if (i2 === 0) g.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
          else g.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
        }
        g.closePath(); g.fill();
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

    // additive light splashes
    g.globalCompositeOperation = 'lighter';
    for (const li of lights) {
      const la = Math.max(0, li.t / li.max) * li.a;
      const lg2 = g.createRadialGradient(li.x, li.y, 3, li.x, li.y, li.r);
      lg2.addColorStop(0, li.color);
      lg2.addColorStop(1, li.color + '00');
      g.globalAlpha = la;
      g.fillStyle = lg2;
      g.beginPath(); g.arc(li.x, li.y, li.r, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
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
    // --- far pass: soft (tilt-shift) background layers ---
    let ox = 0, oy = 0;
    if (shakeT > 0) { ox = rand(-1, 1) * shakeMag * shakeT * 4; oy = rand(-1, 1) * shakeMag * shakeT * 4; }
    rctx = bctx;
    const k2 = bgW / viewW;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, bgW, bgH);
    bctx.setTransform(k2, 0, 0, k2, 0, 0);
    bctx.translate(-camX + ox * 0.5, worldOffY + oy * 0.5);
    drawBackgroundFar();

    // --- near pass: sharp pixel world ---
    rctx = lctx;
    const k = lowW / viewW;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.imageSmoothingEnabled = true;
    lctx.drawImage(bgCvs, 0, 0, bgW, bgH, 0, 0, lowW, lowH);
    lctx.setTransform(k, 0, 0, k, 0, 0);
    lctx.translate(-camX + ox, worldOffY + oy);
    drawBackground();
    if (mode !== 'idle') drawEntities();
    if (mode !== 'idle' && plan && plan.event === 'fog' && player) {
      const fg = lctx.createRadialGradient(player.x, player.y - 50, 240, player.x, player.y - 50, 430);
      fg.addColorStop(0, 'rgba(6,6,12,0)');
      fg.addColorStop(1, 'rgba(6,6,12,0.88)');
      lctx.fillStyle = fg;
      lctx.fillRect(camX - 20, -worldOffY - 20, viewW + 40, viewH + 40);
    }
    drawForeground();
    rctx = ctx;

    // --- composite the world buffer, then crisp UI on top ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lowCvs, 0, 0, lowW, lowH, 0, 0, cvs.width, cvs.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // vignette
    const w = SW, h = SH;
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 0.95);
    vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = getGrain(); // print grain over everything
    ctx.fillRect(0, 0, w, h);
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
      hurt: false, flash: 0, frozen: false, weaponTier: Save.upg(cdef.id).weapon, weaponStyle: cdef.weaponStyle, weaponColors: cdef.weaponColors, ascended,
      hairStyle: cdef.hairStyle, hairColor: cdef.hairColor, charId: cdef.id, blush: cdef.blush,
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
