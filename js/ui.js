// ===== Save data + DOM screens (title, select, marketplace, defeat, pause) =====

const SAVE_KEY = 'horschFamilyArenaSave_v1';

const Save = {
  data: null,
  fresh() {
    const chars = {};
    for (const c of CHARACTERS) chars[c.id] = { weapon: 0, ranged: 0, armor: 0, ability: 0, ascended: false };
    return { money: 0, level: 1, chars, unlocked: {}, campaignDone: {}, campaignMigrated: true };
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? Object.assign(this.fresh(), JSON.parse(raw)) : this.fresh();
      for (const c of CHARACTERS) {
        if (!this.data.chars[c.id]) this.data.chars[c.id] = { weapon: 0, ranged: 0, armor: 0, ability: 0, ascended: false };
        if (typeof this.data.chars[c.id].ranged !== 'number') this.data.chars[c.id].ranged = 0; // migrate pre-ranged saves
      }
      if (!this.data.unlocked) this.data.unlocked = {};
      if (!this.data.campaignDone) this.data.campaignDone = {};
      // anyone already playing before campaign mode existed keeps the whole
      // roster — locking fighters they had earned would be a punishment
      if (!this.data.campaignMigrated) {
        const played = this.data.level > 1 || this.data.money > 0 ||
          CHARACTERS.some(c => { const u = this.data.chars[c.id]; return u.weapon || u.ranged || u.armor || u.ability || u.ascended; });
        if (played) for (const c of CHARACTERS) this.data.unlocked[c.id] = true;
        this.data.campaignMigrated = true;
      }
    } catch (e) { this.data = this.fresh(); }
    return this.data;
  },
  isUnlocked(id) { return !!this.data.unlocked[id]; },
  anyUnlocked() { return CHARACTERS.some(c => this.data.unlocked[c.id]); },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data = this.fresh(); this.write(); },
  upg(id) { return this.data.chars[id]; },
  isMaxed(id) { const u = this.upg(id); return u.weapon >= MAX_TIER && u.ranged >= MAX_TIER && u.armor >= MAX_TIER && u.ability >= MAX_TIER; },
};

// Rotating bounty: win any level as the wanted fighter for bonus cash.
// Erika and Dayne pay triple — someone has to play them.
function ensureBounty() {
  if (Save.data.bounty) return;
  const pool = CHARACTERS.filter(c => c.id !== Save.data.lastBountyChar && Save.isUnlocked(c.id));
  if (!pool.length) return;
  const c = pool[Math.floor(Math.random() * pool.length)];
  const hard = c.id === 'erika' || c.id === 'dayne';
  Save.data.bounty = { charId: c.id, reward: (300 + Save.data.level * 100) * (hard ? 3 : 1) };
  Save.data.lastBountyChar = c.id;
  Save.write();
}

const UI = (() => {
  const screens = ['title', 'campaign', 'select', 'shop', 'defeat', 'pause'];
  const $ = (id) => document.getElementById(id);
  const money = () => '$' + Save.data.money.toLocaleString();

  function show(name) {
    for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name);
    const inGame = name === null;
    combatControls(inGame);
  }
  // cutscenes need the canvas to themselves — the dpad sits over the scene and
  // would eat the taps that advance dialogue
  function combatControls(on) {
    $('controls').classList.toggle('hidden', !on);
    $('pauseBtn').classList.toggle('hidden', !on);
  }

  // ---------- Character select ----------
  function statBar(label, frac) {
    return `<div class="stat-row"><b>${label}</b><div class="stat-bar"><i style="width:${Math.round(frac * 100)}%"></i></div></div>`;
  }
  function buildSelect() {
    ensureBounty();
    const selWorld = worldFor(Save.data.level);
    const b = Save.data.bounty;
    const bChar = b && CHARACTERS.find(x => x.id === b.charId);
    $('selectLevelLabel').textContent = selWorld.name + '  —  LEVEL ' + Save.data.level + ': ' +
      selWorld.levelNames[(Save.data.level - 1) % 5] + (Save.data.level % 5 === 0 ? '  —  BOSS LEVEL' : '') +
      (bChar ? '   ·   🎯 BOUNTY: win as ' + bChar.name + ' (+$' + b.reward.toLocaleString() + ')' : '');
    $('selectMoney').textContent = money();
    const grid = $('charGrid');
    grid.innerHTML = '';
    let cardIdx = 0;
    for (const c of CHARACTERS) {
      cardIdx++;
      const u = Save.upg(c.id);
      const st = computeStats(c, u);
      const locked = !Save.isUnlocked(c.id);
      const card = document.createElement('div');
      card.className = 'char-card' + (u.ascended ? ' holo' : '') + (locked ? ' locked' : '');
      card.style.setProperty('--cc', c.color);
      card.innerHTML = `
        ${u.ascended ? `<div class="ff-badge">★ ${c.finalForm.name} ★</div>` : ''}
        ${Save.data.bounty && Save.data.bounty.charId === c.id ? `<div class="bounty-tag">🎯 BOUNTY $${Save.data.bounty.reward.toLocaleString()}</div>` : ''}
        <canvas width="76" height="92"></canvas>
        <div class="char-name">${u.ascended ? c.finalForm.name : c.name}</div>
        <div class="char-title">${c.title}</div>
        <div class="char-stats">
          ${statBar('HP', st.maxHp / 320)}
          ${statBar('POWER', st.dmg / 4)}
          ${statBar('SPEED', st.speed / 460)}
        </div>
        <div class="char-upg">${trackMeta(c, 'weapon').icon}<b>${u.weapon}</b> ${trackMeta(c, 'ranged').icon}<b>${u.ranged}</b> ${trackMeta(c, 'armor').icon}<b>${u.armor}</b> ${trackMeta(c, 'ability').icon}<b>${u.ability}</b></div>
        <div class="char-special">A: ${c.special.name} — ${u.ascended ? c.finalForm.desc : c.special.desc}</div>
        <div class="card-num">#${String(cardIdx).padStart(2, '0')}/${CHARACTERS.length}</div>
        ${locked ? '<div class="lock-veil"><span>🔒</span><b>Win their chapter<br>in Campaign</b></div>' : ''}`;
      card.addEventListener('click', () => {
        if (locked) { Sfx.denied(); return; }
        Sfx.buy(); show(null); Game.startLevel(c.id);
      });
      grid.appendChild(card);
      Game.drawPortrait(card.querySelector('canvas'), c, u.ascended);
    }
  }

  // ---------- Marketplace ----------
  let shopChar = null;
  let shopEarnedText = '';
  function buildShop() {
    $('shopEarned').textContent = shopEarnedText;
    $('shopMoney').textContent = money();
    const tabs = $('shopCharTabs');
    tabs.innerHTML = '';
    for (const c of CHARACTERS) {
      if (!Save.isUnlocked(c.id)) continue;
      const b = document.createElement('button');
      b.className = 'shop-tab' + (shopChar === c.id ? ' active' : '');
      b.style.setProperty('--cc', c.color);
      b.textContent = c.name;
      b.addEventListener('click', () => { shopChar = c.id; buildShop(); });
      tabs.appendChild(b);
    }
    const c = CHARACTERS.find(x => x.id === shopChar);
    const u = Save.upg(c.id);
    const cards = $('shopCards');
    cards.innerHTML = '';

    for (const key of ['weapon', 'ranged', 'armor', 'ability']) {
      const track = trackMeta(c, key);
      const tier = u[key];
      const maxed = tier >= MAX_TIER;
      const cost = maxed ? 0 : track.costs[tier];
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <h3>${track.icon} ${track.label}</h3>
        <div class="pips">${Array.from({ length: MAX_TIER }, (_, i) => `<span class="pip${i < tier ? ' on' : ''}"></span>`).join('')}</div>
        <div class="shop-tier-name">${maxed ? track.tiers[MAX_TIER - 1] + ' (MAX)' : 'Next: ' + track.tiers[tier]}</div>
        <div class="shop-desc">${track.blurb}</div>
        <button class="buybtn${maxed ? ' maxed' : ''}" ${maxed ? 'disabled' : (Save.data.money < cost ? 'disabled' : '')}>
          ${maxed ? 'MAXED OUT' : 'BUY — $' + cost.toLocaleString()}
        </button>`;
      if (!maxed) {
        card.querySelector('.buybtn').addEventListener('click', () => {
          if (Save.data.money < cost) { Sfx.denied(); return; }
          Save.data.money -= cost;
          u[key]++;
          Save.write(); Sfx.buy(); buildShop();
        });
      }
      cards.appendChild(card);
    }

    // Ascension card — appears once all three tracks are maxed
    const allMax = Save.isMaxed(c.id);
    const asc = document.createElement('div');
    asc.className = 'shop-card ascend';
    if (u.ascended) {
      asc.innerHTML = `<h3>★ ${c.finalForm.name} ★</h3>
        <div class="shop-desc">${c.finalForm.desc}</div>
        <button class="buybtn maxed" disabled>FINAL FORM UNLOCKED</button>`;
    } else if (allMax) {
      asc.innerHTML = `<h3>★ ASCENSION ★</h3>
        <div class="shop-tier-name">${c.finalForm.name}</div>
        <div class="shop-desc">${c.name} has mastered all four tracks. Unlock the final form: massive power, HP, speed and a doubled special.</div>
        <button class="buybtn" ${Save.data.money < ASCEND_COST ? 'disabled' : ''}>ASCEND — $${ASCEND_COST.toLocaleString()}</button>`;
      asc.querySelector('.buybtn').addEventListener('click', () => {
        if (Save.data.money < ASCEND_COST) { Sfx.denied(); return; }
        Save.data.money -= ASCEND_COST;
        u.ascended = true;
        Save.write(); Sfx.ascend(); buildShop();
      });
    } else {
      asc.innerHTML = `<h3>★ ASCENSION ★</h3>
        <div class="shop-desc">Max out all four upgrade tracks for ${c.name} to reveal their FINAL FORM.</div>
        <button class="buybtn" disabled>LOCKED</button>`;
    }
    cards.appendChild(asc);
    $('shopContinue').textContent = 'CONTINUE — LEVEL ' + Save.data.level;
  }

  // ---------- Campaign ----------
  function buildCampaign(justUnlocked) {
    const list = $('campaignList');
    list.innerHTML = '';
    let prevDone = true; // chapter 1 is always open
    CAMPAIGN.forEach((ch, i) => {
      const cdef = CHARACTERS.find(c => c.id === ch.char);
      const done = !!Save.data.campaignDone[ch.id];
      const open = prevDone;
      const row = document.createElement('div');
      row.className = 'chapter' + (done ? ' done' : '') + (open ? '' : ' shut');
      row.style.setProperty('--cc', cdef ? cdef.color : '#888');
      row.innerHTML = `
        <canvas width="76" height="92"></canvas>
        <div class="chapter-body">
          <div class="chapter-no">CHAPTER ${String(i + 1).padStart(2, '0')}${done ? '  ·  COMPLETE' : open ? '' : '  ·  LOCKED'}</div>
          <div class="chapter-name">${ch.title}</div>
          <div class="chapter-where">${ch.where}</div>
          <div class="chapter-blurb">${ch.blurb}</div>
        </div>
        <div class="chapter-go">${open ? (done ? 'REPLAY' : 'PLAY') : '🔒'}</div>`;
      if (open) {
        row.addEventListener('click', () => { Sfx.buy(); show(null); Game.startCampaign(ch.id); });
      } else {
        row.addEventListener('click', () => Sfx.denied());
      }
      list.appendChild(row);
      if (cdef) Game.drawPortrait(row.querySelector('canvas'), cdef, false);
      prevDone = done;
    });
    const note = $('campaignNote');
    if (justUnlocked) {
      const c = CHARACTERS.find(x => x.id === justUnlocked);
      note.textContent = '★ ' + (c ? c.name : justUnlocked) + ' is now playable in Arena mode.';
      note.classList.remove('hidden');
      Sfx.ascend();
    } else {
      note.classList.add('hidden');
    }
  }
  function toCampaign(justUnlocked) { buildCampaign(justUnlocked); show('campaign'); }

  function toSelect() { buildSelect(); show('select'); }
  function toShop(earnedText, charId) {
    shopEarnedText = earnedText || 'Spend your winnings, then return to the arena.';
    if (charId && Save.isUnlocked(charId)) shopChar = charId;
    // never land the shop on a fighter the player cannot use
    if (!shopChar || !Save.isUnlocked(shopChar)) {
      const first = CHARACTERS.find(c => Save.isUnlocked(c.id));
      shopChar = first ? first.id : null;
    }
    if (!shopChar) { toCampaign(null); return; }
    buildShop(); show('shop');
  }
  let defeatChapter = null;
  function toDefeat(text, chapterId) {
    $('defeatText').textContent = text;
    defeatChapter = chapterId || null;
    // losing a campaign fight must lead back to the campaign, not to an
    // arena roster a new player hasn't unlocked anything in yet
    $('defeatShop').classList.toggle('hidden', !!defeatChapter);
    $('defeatRetry').textContent = defeatChapter ? 'Back to Campaign' : 'Back to Fighter Select';
    show('defeat'); Sfx.defeat();
  }

  // ---------- Wiring ----------
  function init() {
    Save.load();
    const dirty = Save.data.money > 0 || Save.data.level > 1 ||
      CHARACTERS.some(c => { const u = Save.upg(c.id); return u.weapon + u.ranged + u.armor + u.ability > 0 || u.ascended; });
    $('titleReset').classList.toggle('hidden', !dirty);
    $('titleStart').addEventListener('click', () => { Sfx.unlock(); if (window.MUSIC) { MUSIC.unlock(); MUSIC.play('campaign-map'); } Sfx.buy(); toCampaign(null); });
    $('titleArena').addEventListener('click', () => {
      Sfx.unlock();
      if (!Save.anyUnlocked()) { Sfx.denied(); toCampaign(null); return; }
      Sfx.buy(); toSelect();
    });
    $('campaignBack').addEventListener('click', () => { Sfx.buy(); show('title'); });
    $('titleReset').addEventListener('click', () => {
      Save.reset(); Sfx.denied(); $('titleReset').classList.add('hidden');
    });
    $('selectShopBtn').addEventListener('click', () => toShop(null));
    $('shopContinue').addEventListener('click', () => { Sfx.buy(); toSelect(); });
    $('defeatShop').addEventListener('click', () => toShop(null, Game.lastCharId));
    $('defeatRetry').addEventListener('click', () => {
      if (defeatChapter) { defeatChapter = null; toCampaign(null); return; }
      toSelect();
    });
    $('pauseBtn').addEventListener('click', () => { Game.setPaused(true); show('pause'); });
    $('pauseResume').addEventListener('click', () => { show(null); Game.setPaused(false); });
    $('pauseQuit').addEventListener('click', () => {
      // abandoning a chapter belongs back in the campaign, not on an arena
      // roster a new player has nothing unlocked in
      const wasCampaign = Game.inCampaign();
      Game.quit();
      if (wasCampaign) toCampaign(null); else toSelect();
    });
    show('title');
  }

  return { init, show, toSelect, toShop, toDefeat, toCampaign, combatControls };
})();
