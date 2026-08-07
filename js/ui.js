// ===== Save data + DOM screens (title, select, marketplace, defeat, pause) =====

const SAVE_KEY = 'horschFamilyArenaSave_v1';

const Save = {
  data: null,
  fresh() {
    const chars = {};
    for (const c of CHARACTERS) chars[c.id] = { weapon: 0, armor: 0, ability: 0, ascended: false };
    return { money: 0, level: 1, chars };
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? Object.assign(this.fresh(), JSON.parse(raw)) : this.fresh();
      for (const c of CHARACTERS) if (!this.data.chars[c.id]) this.data.chars[c.id] = { weapon: 0, armor: 0, ability: 0, ascended: false };
    } catch (e) { this.data = this.fresh(); }
    return this.data;
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data = this.fresh(); this.write(); },
  upg(id) { return this.data.chars[id]; },
  isMaxed(id) { const u = this.upg(id); return u.weapon >= MAX_TIER && u.armor >= MAX_TIER && u.ability >= MAX_TIER; },
};

// Rotating bounty: win any level as the wanted fighter for bonus cash.
// Erika and Dayne pay triple — someone has to play them.
function ensureBounty() {
  if (Save.data.bounty) return;
  const pool = CHARACTERS.filter(c => c.id !== Save.data.lastBountyChar);
  const c = pool[Math.floor(Math.random() * pool.length)];
  const hard = c.id === 'erika' || c.id === 'dayne';
  Save.data.bounty = { charId: c.id, reward: (300 + Save.data.level * 100) * (hard ? 3 : 1) };
  Save.data.lastBountyChar = c.id;
  Save.write();
}

const UI = (() => {
  const screens = ['title', 'select', 'shop', 'defeat', 'pause'];
  const $ = (id) => document.getElementById(id);
  const money = () => '$' + Save.data.money.toLocaleString();

  function show(name) {
    for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name);
    const inGame = name === null;
    $('controls').classList.toggle('hidden', !inGame);
    $('pauseBtn').classList.toggle('hidden', !inGame);
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
    for (const c of CHARACTERS) {
      const u = Save.upg(c.id);
      const st = computeStats(c, u);
      const card = document.createElement('div');
      card.className = 'char-card';
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
        <div class="char-upg">${trackMeta(c, 'weapon').icon} <b>${u.weapon}</b>/5 &nbsp; ${trackMeta(c, 'armor').icon} <b>${u.armor}</b>/5 &nbsp; ${trackMeta(c, 'ability').icon} <b>${u.ability}</b>/5</div>
        <div class="char-special">A: ${c.special.name} — ${u.ascended ? c.finalForm.desc : c.special.desc}</div>`;
      card.addEventListener('click', () => { Sfx.buy(); show(null); Game.startLevel(c.id); });
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

    for (const key of ['weapon', 'armor', 'ability']) {
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
        <div class="shop-desc">${c.name} has mastered every upgrade. Unlock the final form: massive power, HP, speed and a doubled special.</div>
        <button class="buybtn" ${Save.data.money < ASCEND_COST ? 'disabled' : ''}>ASCEND — $${ASCEND_COST.toLocaleString()}</button>`;
      asc.querySelector('.buybtn').addEventListener('click', () => {
        if (Save.data.money < ASCEND_COST) { Sfx.denied(); return; }
        Save.data.money -= ASCEND_COST;
        u.ascended = true;
        Save.write(); Sfx.ascend(); buildShop();
      });
    } else {
      asc.innerHTML = `<h3>★ ASCENSION ★</h3>
        <div class="shop-desc">Max out all three upgrade tracks for ${c.name} to reveal their FINAL FORM.</div>
        <button class="buybtn" disabled>LOCKED</button>`;
    }
    cards.appendChild(asc);
    $('shopContinue').textContent = 'CONTINUE — LEVEL ' + Save.data.level;
  }

  function toSelect() { buildSelect(); show('select'); }
  function toShop(earnedText, charId) {
    shopEarnedText = earnedText || 'Spend your winnings, then return to the arena.';
    if (charId) shopChar = charId;
    if (!shopChar) shopChar = CHARACTERS[0].id;
    buildShop(); show('shop');
  }
  function toDefeat(text) {
    $('defeatText').textContent = text;
    show('defeat'); Sfx.defeat();
  }

  // ---------- Wiring ----------
  function init() {
    Save.load();
    const dirty = Save.data.money > 0 || Save.data.level > 1 ||
      CHARACTERS.some(c => { const u = Save.upg(c.id); return u.weapon + u.armor + u.ability > 0; });
    $('titleReset').classList.toggle('hidden', !dirty);
    $('titleStart').addEventListener('click', () => { Sfx.unlock(); Sfx.buy(); toSelect(); });
    $('titleReset').addEventListener('click', () => {
      Save.reset(); Sfx.denied(); $('titleReset').classList.add('hidden');
    });
    $('selectShopBtn').addEventListener('click', () => toShop(null));
    $('shopContinue').addEventListener('click', () => { Sfx.buy(); toSelect(); });
    $('defeatShop').addEventListener('click', () => toShop(null, Game.lastCharId));
    $('defeatRetry').addEventListener('click', () => toSelect());
    $('pauseBtn').addEventListener('click', () => { Game.setPaused(true); show('pause'); });
    $('pauseResume').addEventListener('click', () => { show(null); Game.setPaused(false); });
    $('pauseQuit').addEventListener('click', () => { Game.quit(); toSelect(); });
    show('title');
  }

  return { init, show, toSelect, toShop, toDefeat };
})();
