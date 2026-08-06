// ===== Horsch Family Arena — static game data & balance =====

const CHARACTERS = [
  {
    id: 'blaze', name: 'BLAZE', title: 'The Ember Fist',
    color: '#ff5a2c', color2: '#8a1e00', accent: '#ffd977', skin: '#e8b58a',
    hp: 95, speed: 360, dmg: 0.95, atkSpeed: 0.8,
    specialName: 'Fireball', specialDesc: 'Hurls a piercing ball of flame across the arena.',
    finalForm: { name: 'INFERNO KING', desc: 'Wreathed in living flame. Fireballs erupt twice as large.' },
  },
  {
    id: 'frost', name: 'FROST', title: 'The Iron Glacier',
    color: '#5ab8ff', color2: '#123c6b', accent: '#d9f1ff', skin: '#cfd8e6',
    hp: 140, speed: 265, dmg: 1.0, atkSpeed: 1.05,
    specialName: 'Ice Nova', specialDesc: 'Freezes and shatters everything nearby.',
    finalForm: { name: 'GLACIER TITAN', desc: 'An unbreakable colossus. Novas leave enemies frozen solid.' },
  },
  {
    id: 'volt', name: 'VOLT', title: 'The Storm Blade',
    color: '#e6d84a', color2: '#5c5210', accent: '#ffffff', skin: '#d6a878',
    hp: 115, speed: 305, dmg: 1.25, atkSpeed: 1.12,
    specialName: 'Storm Dash', specialDesc: 'Blinks forward as lightning, scorching all in the path.',
    finalForm: { name: 'STORM GOD', desc: 'Becomes the storm itself. Dashes chain devastation.' },
  },
];

// Upgrade tracks: 5 tiers each. Maxing all three unlocks Ascension (final form).
const UPGRADE_TRACKS = {
  weapon: {
    label: 'Weapons', icon: '⚔',
    tiers: ['Iron Knuckles', 'Steel Claws', 'Twin Blades', 'Runeforged Edge', 'Voidsteel Arsenal'],
    costs: [100, 250, 600, 1400, 3000],
    blurb: '+35% attack damage per tier.',
  },
  armor: {
    label: 'Armor', icon: '⛨',
    tiers: ['Leather Guard', 'Chainmail', 'Plate Harness', 'Runed Aegis', 'Dragonscale'],
    costs: [80, 200, 500, 1200, 2600],
    blurb: '+15 max HP and damage resistance per tier.',
  },
  ability: {
    label: 'Abilities', icon: '✦',
    tiers: ['Focused Mind', 'Channeling I', 'Channeling II', 'Overcharge', 'Mastery'],
    costs: [150, 350, 800, 1800, 4000],
    blurb: '+40% special damage, cheaper energy cost per tier.',
  },
};
const MAX_TIER = 5;
const ASCEND_COST = 6000;

function computeStats(cdef, upg) {
  const w = upg.weapon, a = upg.armor, ab = upg.ability;
  const s = {
    maxHp: cdef.hp + a * 15,
    speed: cdef.speed,
    dmg: cdef.dmg * (1 + 0.35 * w),
    atkSpeed: cdef.atkSpeed,
    defense: 1 / (1 + 0.25 * a),
    specialMult: 1 + 0.4 * ab,
    energyCost: Math.max(22, 40 - 3 * ab),
  };
  if (upg.ascended) {
    s.maxHp = Math.round(s.maxHp * 1.5);
    s.dmg *= 1.75;
    s.specialMult *= 2;
    s.speed *= 1.15;
    s.defense *= 0.7;
  }
  return s;
}

// Normal attacks (durations in seconds, scaled by character atkSpeed)
const ATTACKS = {
  X: { name: 'Light Strike', dmg: 8,  startup: 0.08, active: 0.10, recovery: 0.13, range: 76,  kb: 150, kbY: -40,  anim: 'punch' },
  Y: { name: 'Heavy Kick',   dmg: 18, startup: 0.20, active: 0.12, recovery: 0.26, range: 100, kb: 460, kbY: -160, anim: 'kick'  },
  B: { name: 'Rising Break', dmg: 13, startup: 0.16, active: 0.12, recovery: 0.30, radius: 118, kb: 220, kbY: -540, anim: 'upper' },
};

const ENEMY_TYPES = {
  grunt:   { name: 'Grunt',   hp: 30,  dmg: 8,  speed: 125, reach: 62, windup: 0.5,  cooldown: 1.0, value: 15,  size: 1.0,  color: '#8a4a5c', color2: '#3d1f28' },
  stinger: { name: 'Stinger', hp: 18,  dmg: 6,  speed: 235, reach: 55, windup: 0.32, cooldown: 0.7, value: 18,  size: 0.85, color: '#7dc45f', color2: '#2c4d1e' },
  brute:   { name: 'Brute',   hp: 95,  dmg: 18, speed: 82,  reach: 78, windup: 0.85, cooldown: 1.4, value: 40,  size: 1.32, color: '#b06a32', color2: '#4d2a10' },
  shooter: { name: 'Shooter', hp: 24,  dmg: 10, speed: 105, reach: 380, windup: 0.7, cooldown: 1.8, value: 30,  size: 0.95, color: '#9a6ad4', color2: '#3c2360', ranged: true },
  boss:    { name: 'Warlord', hp: 420, dmg: 24, speed: 95,  reach: 95, windup: 0.75, cooldown: 1.2, value: 320, size: 1.7,  color: '#d43b2f', color2: '#4d0e08', boss: true },
};

// Level plan: waves grow in size, new enemy types unlock, stats scale up.
function levelPlan(L) {
  const pool = ['grunt'];
  if (L >= 2) pool.push('stinger');
  if (L >= 3) pool.push('brute');
  if (L >= 4) pool.push('shooter');
  const weights = { grunt: 4, stinger: 3, brute: 2, shooter: 2 };

  const nWaves = Math.min(2 + Math.ceil(L / 2), 6);
  const waves = [];
  for (let w = 0; w < nWaves; w++) {
    const count = Math.min(2 + Math.floor((L + w) / 2), 7);
    const arr = [];
    for (let i = 0; i < count; i++) {
      let total = 0;
      for (const t of pool) total += weights[t];
      let r = Math.random() * total;
      let pick = pool[0];
      for (const t of pool) { r -= weights[t]; if (r <= 0) { pick = t; break; } }
      arr.push(pick);
    }
    waves.push(arr);
  }
  if (L % 5 === 0) waves[waves.length - 1].push('boss');

  const k = L - 1;
  return {
    level: L,
    waves,
    hpMult: 1 + 0.22 * k + 0.035 * k * k,
    dmgMult: 1 + 0.16 * k,
    speedMult: 1 + Math.min(0.04 * k, 0.5),
    valueMult: 1 + 0.32 * k,
    boss: L % 5 === 0,
  };
}

// Arena palettes cycle as you climb.
const THEMES = [
  { sky1: '#2a1230', sky2: '#0b0a12', glow: '#ff6a3c', ground: '#241722', groundTop: '#4a2f3a', far: '#170d1e', near: '#251429' },
  { sky1: '#0f2438', sky2: '#070b14', glow: '#5ab8ff', ground: '#14202c', groundTop: '#2c4356', far: '#0b1622', near: '#12233a' },
  { sky1: '#31240c', sky2: '#100c06', glow: '#ffd24a', ground: '#292013', groundTop: '#54432a', far: '#1c1408', near: '#2c2210' },
  { sky1: '#0f2e1c', sky2: '#06110a', glow: '#5fe08a', ground: '#12251a', groundTop: '#2b4d36', far: '#0a1b10', near: '#123422' },
  { sky1: '#380f14', sky2: '#12060a', glow: '#ff3a4a', ground: '#2a1216', groundTop: '#57262c', far: '#1d0a0e', near: '#331318' },
];
function themeFor(L) { return THEMES[(L - 1) % THEMES.length]; }
