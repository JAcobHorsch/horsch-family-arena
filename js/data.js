// ===== Horsch Family Arena — static game data & balance =====

// -- small color helpers so each fighter only needs one base color --
function hexMix(hex, target, f) {
  const h = hex.replace('#', '');
  const t = target.replace('#', '');
  const c = [0, 2, 4].map(i => {
    const a = parseInt(h.slice(i, i + 2), 16), b = parseInt(t.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * f).toString(16).padStart(2, '0');
  });
  return '#' + c.join('');
}

// Upgrade tracks: 5 tiers each. Maxing all three unlocks Ascension (final form).
// Characters may override label/icon/tiers/blurb with their own themed versions;
// costs and the underlying math stay global so balance is uniform.
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

// Special move library — each character's A-button move is one of these types:
//   projectile: {dmg, speed, r, pierce, count, spreadY}   straight shot(s)
//   nova:       {dmg, radius, freeze, kb}                 blast around the fighter
//   dash:       {dmg, dist}                               lightning blink through enemies
//   buff:       {dur, dmgMult, speedMult}                 battle cry: temp power/speed
//   rain:       {dmg, count, r}                           projectiles crash down ahead
//   wave:       {dmg, speed, both}                        ground shockwave
//   heal:       {pct}                                     restore % of max HP
// Ascension automatically scales the special (double power, bigger effects).

function makeChar(def) {
  const base = {
    title: 'Horsch Family Fighter',
    hp: 110, speed: 310, dmg: 1.0, atkSpeed: 1.0,
    skin: '#e8b58a',
    weaponStyle: 'blade', // 'blade' | 'club' | 'staff' | 'none' (glowing fists)
    special: { type: 'projectile', name: 'Energy Bolt', desc: 'Hurls a bolt of raw energy.', dmg: 22, speed: 560, r: 13, pierce: true },
    tracks: {}, // per-character overrides of UPGRADE_TRACKS entries
    designed: false,
  };
  const c = Object.assign(base, def);
  c.color2 = c.color2 || hexMix(c.color, '#000000', 0.55);
  c.accent = c.accent || hexMix(c.color, '#ffffff', 0.65);
  c.finalForm = c.finalForm || { name: 'ASCENDED ' + c.name, desc: 'Final form to be designed — maxing all upgrades still unlocks a huge power boost.' };
  return c;
}

// The Horsch family roster. Colors are provisional; stats, specials, weapons,
// tracks and final forms get personalized one character at a time.
const CHARACTERS = [
  {
    id: 'todd', name: 'SUPER TODD', color: '#e8524a',
    title: 'The Patriarch',
    // Powerhouse: every hit is a truck; he just doesn't hurry.
    hp: 130, speed: 255, dmg: 1.35, atkSpeed: 1.15,
    weaponStyle: 'none',
    special: {
      type: 'projectile', name: 'Diabetes Cry',
      desc: 'Chugs pure sugar — his supercharged pancreas fires insulin needles out of his body in both directions.',
      dmg: 8, speed: 640, r: 5, pierce: true, count: 4, spreadY: 46, both: true, shape: 'needle',
    },
    tracks: {
      weapon: { icon: '👊', label: 'Fists', tiers: ['Work Gloves', 'Brass Knuckles', 'Concrete Fists', 'Meteor Mitts', 'Fists of the Toddfather'] },
      armor: { tiers: ['Flannel Shirt', 'Dad Jeans', 'Steel-Toe Boots', 'Grill Apron of Iron', 'Toddfather Hide'] },
      ability: {
        icon: '💉', label: 'Pancreas',
        tiers: ['Candy Stash', 'Sugar Rush', 'Glucose Overload', 'Pancreas Unleashed', 'Peak Insulin'],
        blurb: '+40% needle damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'THE TODDFATHER',
      desc: 'Bald, impossibly ripped, gloriously bearded, and completely shirtless. Respect must be paid.',
      look: { bald: true, beard: true, shirtless: true, muscle: 1.35 },
    },
    designed: true,
  },
  {
    id: 'sonya', name: 'SONYA', color: '#e84a92',
    title: 'The Matriarch',
    // All-rounder: dependable in every column.
    hp: 115, speed: 315, dmg: 1.05, atkSpeed: 0.98,
    weaponStyle: 'book',
    special: {
      type: 'projectile', name: 'Book Throw',
      desc: 'Hurls an overdue library book — every enemy it smacks owes a late fee (bonus money per hit).',
      dmg: 20, speed: 520, r: 10, pierce: true, shape: 'book', bounty: 6,
    },
    tracks: {
      weapon: {
        icon: '📖', label: 'Books',
        tiers: ['Paperback', 'Hardcover Cookbook', 'Encyclopedia Vol. K', 'Unabridged Dictionary', 'The Forbidden Tome (30 Years Overdue)'],
        blurb: '+35% attack damage per tier — heavier reading hits harder.',
      },
      armor: { tiers: ['Cozy Cardigan', 'Denim Jacket', 'Quilted Armor', 'Tote Bag Bulwark', 'Matriarch Mail'] },
      ability: {
        icon: '📚', label: 'Library',
        tiers: ['Library Card', 'Gentle Reminder', 'Late Notice', 'Collections Agency', 'Interlibrary Loan of Doom'],
        blurb: '+40% book damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'XANAX SONYA',
      desc: 'She takes one (1) Xanax. Instantly serene, completely unbothered, gently levitating — every stat boosted to the max.',
      look: { float: true, auraColor: '#e0b8ff' },
      boost: { maxHp: 1.7, dmg: 2.0, speed: 1.35, defense: 0.55, special: 2.2 },
    },
    designed: true,
  },
  {
    id: 'jordan', name: 'JORDAN', color: '#e8784a',
    title: 'The Shutter Speedster',
    // Speedster: fastest feet in the family, glass jaw.
    hp: 92, speed: 380, dmg: 0.9, atkSpeed: 0.78,
    weaponStyle: 'feet',
    special: {
      type: 'flash', name: 'Photography',
      desc: 'Snaps a photo — the camera flash sears everything in front of him and leaves enemies seeing spots.',
      dmg: 16, range: 430, stun: 0.9,
    },
    tracks: {
      weapon: {
        icon: '🦵', label: 'Kicks',
        tiers: ['Front Kick', 'Roundhouse', 'Spinning Back Kick', 'Flying Scissor Kick', 'The 720 No-Look'],
        blurb: '+35% attack damage per tier — fancier footwork hits harder.',
      },
      armor: { tiers: ['Hoodie', 'Camera Strap Harness', 'Photographer Vest', 'Tripod Plating', 'Uncle Armor'] },
      ability: {
        icon: '📸', label: 'Camera',
        tiers: ['Disposable Camera', 'Point & Shoot', 'DSLR', 'Full-Frame Mirrorless', 'The Paparazzi Rig'],
        blurb: '+40% flash damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'BABYSITTER JORDAN',
      desc: 'The nieces and nephews join the fight — Hayes, Addi, Brooks and Isla swarm his enemies... and occasionally kick Uncle Jordan by mistake.',
      minions: ['hayes', 'addi', 'brooks', 'isla'],
    },
    designed: true,
  },
  {
    id: 'jerod', name: 'JEROD', color: '#e8c84a',
    title: 'The Unbreakable',
    // Tank: an absolute unit; enemies chip at him all day.
    hp: 165, speed: 250, dmg: 1.05, atkSpeed: 1.05,
    weaponStyle: 'blade',
    special: {
      type: 'wave', name: 'Power Gulp',
      desc: 'Chugs a gallon of milk — the mighty swallow releases bone-rattling shockwaves in both directions.',
      dmg: 22, speed: 360, both: true, color: '#f4f0e6',
    },
    tracks: {
      weapon: {
        icon: '🖨', label: '3D Prints',
        tiers: ['PLA Shiv', 'ABS Short Sword', 'Carbon-Fiber Katana', 'Titanium-Infill Greatblade', 'The Masterprint (0% Warp)'],
        blurb: '+35% attack damage per tier — better filament, better carnage.',
      },
      armor: { tiers: ['Hoodie of Holding', 'PLA Plate', 'Honeycomb-Infill Vest', 'Carbon Weave Suit', 'Monolithic Print Armor'] },
      ability: {
        icon: '🥛', label: 'Milk',
        tiers: ['2% Milk', 'Whole Milk', 'Chocolate Milk', 'A Full Gallon', 'The Dairy Singularity'],
        blurb: '+40% gulp damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: '3D PRINTER JEROD',
      desc: 'He becomes the machine. A giant walking 3D printer, extruder blazing, printing victory layer by layer.',
      look: { printer: true },
      boost: { maxHp: 1.65, defense: 0.55 },
      sizeMult: 1.45,
    },
    designed: true,
  },
  {
    id: 'jacob', name: 'JACOB', color: '#4ae86a',
    title: 'The Master Plumber',
    // Plumber archetype: maxed out in every aspect. The most powerful archetype.
    hp: 150, speed: 370, dmg: 1.3, atkSpeed: 0.8,
    weaponStyle: 'club',
    weaponColors: ['#c9ccd8', '#b87333', '#dfe3e8', '#8a4ae8', '#ffd24a'],
    special: {
      type: 'projectile', name: 'Volleyball Spike',
      desc: 'Spikes a volleyball that rockets down and ricochets through the enemy line. Upgrades make it faster and meaner.',
      dmg: 24, speed: 540, r: 10, pierce: true, shape: 'ball', arc: true, bounce: true, scaleSpeed: true, life: 2.4,
    },
    tracks: {
      weapon: {
        icon: '🔧', label: 'Plumbing Tools',
        tiers: ['Plunger', 'Basin Wrench', 'Pipe Cutter', 'Press Tool', 'The Golden Pipe Wrench'],
        blurb: '+35% attack damage per tier — union rates apply.',
      },
      armor: { tiers: ['Work Tee', 'Knee Pads', 'Tool Belt', 'Coverall Carbonweave', 'HM Master Plumber Plate'] },
      ability: {
        icon: '🏐', label: 'Volleyball',
        tiers: ['Backyard Bump', 'Set & Spike', 'Jump Serve', 'Six-Pack Spike', 'The Kill Shot'],
        blurb: '+40% spike damage, faster ball, cheaper energy per tier.',
      },
    },
    finalForm: {
      name: 'WRENCHY',
      desc: 'He becomes a giant anthropomorphic golden pipe wrench. The jaws talk. The torque is infinite.',
      look: { wrench: true },
      boost: { maxHp: 1.7, dmg: 2.0, speed: 1.3, defense: 0.6, special: 2.2 },
      sizeMult: 1.4,
    },
    designed: true,
  },
  {
    id: 'samantha', name: 'SAMANTHA', color: '#4ae8b2',
    title: 'The Toy Box Titan',
    // Powerhouse: every hit lands like a dropped Tonka truck.
    hp: 120, speed: 270, dmg: 1.32, atkSpeed: 1.12,
    weaponStyle: 'club',
    weaponColors: ['#ffd24a', '#4ab2e8', '#e8524a', '#37b34a', '#ff4a92'],
    special: {
      type: 'projectile', name: 'Chicken Throw',
      desc: 'Throws a live chicken. It flaps, it panics, it hurts everyone it meets.',
      dmg: 26, speed: 320, r: 12, pierce: true, shape: 'chicken', flap: true, life: 2.6,
    },
    tracks: {
      weapon: {
        icon: '🧸', label: 'Kids Toys',
        tiers: ['Rubber Duck', 'Foam Sword', 'Nerf Blaster', 'Metal Tonka Truck', 'The Forbidden LEGO (Stepped On)'],
        blurb: '+35% attack damage per tier — toys are weapons, ask any barefoot parent.',
      },
      armor: { tiers: ['Mom Bun & Leggings', 'Diaper Bag Bandolier', 'Minivan Door Shield', 'Snack-Pouch Kevlar', 'Titanium Toy Chest Plate'] },
      ability: {
        icon: '🐔', label: 'Chicken Coop',
        tiers: ['One Free-Range Hen', 'Grumpy Rooster', 'Organic Feed', 'Prize Bird', 'The Apex Chicken'],
        blurb: '+40% chicken damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'GIANT CHICKEN',
      desc: 'She becomes a massive chicken. No explanation. No mercy. Just poultry.',
      look: { chicken: true },
      boost: { maxHp: 1.6, dmg: 2.1 },
      sizeMult: 1.5,
    },
    designed: true,
  },
  {
    id: 'cassandra', name: 'CASSANDRA', color: '#4adbe8',
    title: 'The Deli Duelist',
    // All-rounder: dependable in every column.
    hp: 112, speed: 320, dmg: 1.08, atkSpeed: 0.95,
    weaponStyle: 'sandwich',
    special: {
      type: 'projectile', name: 'Brooks Toss',
      desc: 'Throws her son Brooks like a boomerang. He hits everything twice — going out AND coming back. He loves it.',
      dmg: 18, speed: 520, r: 12, pierce: true, shape: 'brooks', boomerang: true, life: 4.5,
    },
    tracks: {
      weapon: {
        icon: '🥪', label: 'Sandwiches',
        tiers: ['PB&J', 'Grilled Cheese', 'Club Sandwich', 'Meatball Marinara', 'The Little Bear Special (Italian Sub)'],
        blurb: '+35% attack damage per tier — fresher ingredients, deadlier lunch.',
      },
      armor: { tiers: ['Apron', 'Oven Mitts', 'Cutting Board Plate', 'Cast Iron Cuirass', 'Deli Counter Fortress'] },
      ability: {
        icon: '🪃', label: 'Toss Technique',
        tiers: ['Gentle Lob', 'Two-Hand Heave', 'Spin Cycle', 'Full Windup', 'Orbital Brooks'],
        blurb: '+40% toss damage, cheaper energy cost per tier. Brooks remains unharmed and delighted.',
      },
    },
    finalForm: {
      name: 'LITTLE BEAR SPECIAL',
      desc: 'She becomes a giant Italian sub. Lettuce, tomato, salami, unstoppable.',
      look: { sandwich: true },
      boost: { maxHp: 1.6, dmg: 1.9, defense: 0.6 },
      sizeMult: 1.45,
    },
    designed: true,
  },
  {
    id: 'erika', name: 'ERIKA', color: '#4a86e8',
    title: 'Hard Mode Herself',
    // Terrible archetype: the worst at everything, on purpose.
    hp: 70, speed: 210, dmg: 0.55, atkSpeed: 1.35,
    weaponStyle: 'swat',
    special: {
      type: 'oops', name: 'Diarrhea',
      desc: 'It goes down her own leg. Does nothing to enemies. Hurts Erika. Upgrades only mean more diarrhea.',
      selfDmg: 8,
    },
    tracks: {
      weapon: {
        icon: '🖐', label: 'Her Hands',
        tiers: ['Limp Wrist', 'Open Palm', 'Both Hands', 'Slightly Firmer Swat', 'Maximum Effort Swat'],
        blurb: '+35% attack damage per tier, which for Erika means very little.',
      },
      armor: { tiers: ['Wet Wipes', 'Spare Pants', 'Plastic Poncho', 'Adult Diaper', 'Industrial Tarp'] },
      ability: {
        icon: '💩', label: 'Digestion',
        tiers: ['Mild Rumble', 'Concerning Gurgle', 'Code Brown', 'Full Evacuation', 'The Unspeakable'],
        blurb: 'Each tier is +50% more diarrhea. This helps no one.',
      },
    },
    finalForm: {
      name: 'RICKMOTHY',
      desc: 'Somehow smaller, weaker, and fatter all at once. A lateral move at best.',
      look: { fat: true },
      boost: { maxHp: 0.9, dmg: 0.8, speed: 0.9, defense: 1.15, special: 1 },
      sizeMult: 0.82,
    },
    designed: true,
  },
  { id: 'levi',      name: 'LEVI',       color: '#8a4ae8' },
  { id: 'ronathon',  name: 'RONATHON',   color: '#c24ae8' },
  { id: 'tim',       name: 'TIM',        color: '#cfe84a' },
  { id: 'myah',      name: 'MYAH',       color: '#e84ad0' },
  { id: 'isla',      name: 'ISLA',       color: '#f2a3c2' },
  { id: 'hayes',     name: 'HAYES',      color: '#5c4ae8' },
  { id: 'addi',      name: 'ADDI',       color: '#e8a04a' },
  { id: 'brooks',    name: 'BROOKS',     color: '#37b34a' },
  { id: 'dayne',     name: 'DAYNE',      color: '#b0b6c4' },
].map(makeChar);

function trackMeta(cdef, key) {
  const base = UPGRADE_TRACKS[key];
  const o = (cdef.tracks && cdef.tracks[key]) || {};
  return {
    label: o.label || base.label,
    icon: o.icon || base.icon,
    tiers: o.tiers || base.tiers,
    costs: base.costs,
    blurb: o.blurb || base.blurb,
  };
}

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
    const b = (cdef.finalForm && cdef.finalForm.boost) || {};
    s.maxHp = Math.round(s.maxHp * (b.maxHp || 1.5));
    s.dmg *= b.dmg || 1.75;
    s.specialMult *= b.special || 2;
    s.speed *= b.speed || 1.15;
    s.defense *= b.defense || 0.7;
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
