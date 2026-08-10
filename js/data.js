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
  ranged: {
    label: 'Ranged', icon: '🏹',
    tiers: ['Improvised Throw', 'Practiced Arm', 'Deadeye', 'Cannon Arm', 'Legendary Aim'],
    costs: [90, 220, 550, 1300, 2800],
    blurb: '+35% ranged damage per tier (Y button).',
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
  {
    id: 'levi', name: 'LEVI', color: '#8a4ae8',
    title: 'The Wrecking Crew',
    // Tank: hard to move, harder to stop.
    hp: 158, speed: 245, dmg: 1.12, atkSpeed: 1.1,
    weaponStyle: 'club',
    weaponColors: ['#8a6a48', '#cfc4a8', '#7a5230', '#8d8574', '#ff4a92'],
    special: {
      type: 'car', name: 'Camaro Crash',
      desc: 'Whistles once — his Camaro comes screaming through and flattens everything in its path.',
      dmg: 30, speed: 720, color: '#d43b2f',
    },
    tracks: {
      weapon: {
        icon: '🏏', label: 'Clubs',
        tiers: ['Driftwood Club', 'Bone Club', 'Spiked Caveman Club', 'Boulder-on-a-Stick', 'The Carnival Clown Hammer'],
        blurb: '+35% attack damage per tier — oonga per boonga.',
      },
      armor: { tiers: ['Hoodie', 'Letterman Jacket', 'Roll Cage', 'Racing Harness', 'Monster Truck Chassis'] },
      ability: {
        icon: '🏎', label: 'Garage',
        tiers: ['Learner Permit', 'Fresh Tires', 'Cold Air Intake', 'Straight Pipes', 'Full Send'],
        blurb: '+40% crash damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'LEVIATHAN',
      desc: 'A one-man demolition. Giant fists, messy hair, and a clown hammer that ends conversations.',
      look: { muscle: 1.6, bigFists: true, hair: true },
      boost: { maxHp: 1.75, dmg: 1.9, defense: 0.55 },
      sizeMult: 1.5,
    },
    designed: true,
  },
  {
    id: 'ronathon', name: 'RONATHON', color: '#c24ae8',
    title: 'The Man of Many Names',
    // All-rounder: dependable under any alias.
    hp: 118, speed: 318, dmg: 1.06, atkSpeed: 0.97,
    weaponStyle: 'letters',
    special: {
      type: 'shout', name: "I'M NOT BUYING YOU A NEW MINIVAN SAMANTHA!",
      desc: 'He means it. A shockwave of pure dad-budget fury staggers everyone nearby.',
      dmg: 20, radius: 320, kb: 400, stun: 0.4,
      shoutLines: ["I'M NOT BUYING YOU", 'A NEW MINIVAN SAMANTHA!'],
    },
    tracks: {
      weapon: {
        icon: '🔤', label: 'Names',
        tiers: ['RONALD', 'REGINALD', 'RON TRON THE SKELETON', 'REGGIE', 'DOUGANOLD'],
        blurb: '+35% attack damage per tier — every alias hits harder than the last.',
      },
      armor: { tiers: ['Polo Shirt', 'Business Casual', 'Name Tag of Power', 'Triple-Alias Vest', 'The Full Douganold'] },
      ability: {
        icon: '📢', label: 'Dad Voice',
        tiers: ['Stern Look', 'Raised Voice', 'Middle Name Used', 'Full Name Used', 'The Final Warning'],
        blurb: '+40% shout damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'RYAN DUGAN',
      desc: 'The final alias. Eyeglasses blast from his body in all directions. No one knows why. No one asks twice.',
      look: { glasses: true },
      special: {
        type: 'radial', name: 'Glasses Barrage',
        count: 10, dmg: 16, speed: 500, r: 9, shape: 'glasses', life: 1.6,
        shoutLines: ["I'M NOT BUYING YOU", 'A NEW MINIVAN SAMANTHA!'],
      },
      boost: { dmg: 1.9, maxHp: 1.6 },
    },
    designed: true,
  },
  {
    id: 'tim', name: 'TIM', color: '#c9a86a', accent: '#f2ee4a',
    title: 'The Firefighter',
    // Firefighter archetype: tank stats, turnout gear, red helmet.
    hp: 162, speed: 248, dmg: 1.1, atkSpeed: 1.05,
    weaponStyle: 'blade',
    enemiesOnFire: true, // every enemy Tim faces is already ablaze
    baseLook: { helmet: true, helmetColor: '#d43b2f' },
    special: {
      type: 'projectile', name: 'Fire Hose',
      desc: 'Blasts a stream of water. Every enemy Tim faces is, naturally, already on fire — someone has to put them out.',
      dmg: 7, speed: 620, r: 6, count: 5, spreadY: 26, pierce: false, douse: true, color: '#4ab2e8',
    },
    tracks: {
      weapon: {
        icon: '🪓', label: 'Fire Axes',
        tiers: ['Hatchet', 'Pickhead Axe', 'Flathead Axe', 'Halligan Bar', 'The Jaws of Life'],
        blurb: '+35% attack damage per tier — forcible entry, forcible exit.',
      },
      armor: { tiers: ['Station Tee', 'Turnout Pants', 'Turnout Coat', 'SCBA Rig', 'Full Structure Gear'] },
      ability: {
        icon: '🚒', label: 'Water Pressure',
        tiers: ['Garden Hose', 'Booster Line', 'Attack Line', 'Deck Gun', 'The Master Stream'],
        blurb: '+40% water damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'FIRETRUCK',
      desc: 'He becomes a giant firetruck — swinging ladder, blasting hose, lights running hot.',
      look: { firetruck: true },
      special: { type: 'projectile', name: 'Deluge Cannon', dmg: 9, speed: 680, r: 8, count: 8, spreadY: 22, pierce: false, douse: true, color: '#4ab2e8' },
      boost: { maxHp: 1.8, dmg: 1.8, defense: 0.5 },
      sizeMult: 1.55,
    },
    designed: true,
  },
  {
    id: 'myah', name: 'MYAH', color: '#e84ad0',
    title: 'The Chore Champion',
    // All-rounder: graceful, efficient, always finishing something.
    hp: 114, speed: 322, dmg: 1.05, atkSpeed: 0.96,
    weaponStyle: 'staff',
    special: {
      type: 'projectile', name: 'Volleyball Set',
      desc: 'A flawless, graceful set... straight up. When the ball lands, it detonates like a grenade.',
      dmg: 30, speed: 210, r: 10, shape: 'ball', lob: true, grenade: true, noContact: true, blast: 140, life: 4,
    },
    tracks: {
      weapon: {
        icon: '🧹', label: 'Chore Gear',
        tiers: ['Feather Duster', 'Broom', 'Laundry Basket', 'Cordless Vacuum', 'The Sentient Robot Mop'],
        blurb: '+35% attack damage per tier — cleanliness is next to deadliness.',
      },
      armor: { tiers: ['Messy Bun', 'Comfy Hoodie', 'Rubber Gloves', 'Apron of Deflection', 'Sunday Reset Plate'] },
      ability: {
        icon: '🏐', label: 'Setting',
        tiers: ['Bump', 'Clean Set', 'Back Set', 'Quick Set', 'The Perfect Set'],
        blurb: '+40% blast damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: '8 HOURS OF SLEEP MYAH',
      desc: 'Fully rested. Radiant. Unstoppable. The impossible things keep happening.',
      look: { radiant: true, auraColor: '#fff2b8' },
      chatter: [
        "Wow, I'm finally all caught up on the laundry",
        "My head doesn't hurt",
        'The kitchen is clean',
        'I did the bed laundry',
        'I got all of the clothes hung up',
      ],
      boost: { maxHp: 1.65, dmg: 1.9, speed: 1.25, defense: 0.65 },
    },
    designed: true,
  },
  {
    id: 'isla', name: 'ISLA', color: '#f2a3c2',
    title: 'The Baby',
    // Baby archetype: cannot walk. Maxed stats. Incredibly powerful.
    hp: 145, speed: 300, dmg: 1.4, atkSpeed: 0.85,
    weaponStyle: 'muscles',
    baseSize: 0.6,
    baseLook: { crawl: true, baby: true },
    special: {
      type: 'projectile', name: 'Pacifier Throw',
      desc: 'Hurls her pacifier with terrifying force. She wants it back immediately.',
      dmg: 28, speed: 560, r: 8, pierce: true, shape: 'pacifier',
    },
    tracks: {
      weapon: {
        icon: '💪', label: 'Arms',
        tiers: ['Noodle Arms', 'Chunky Arms', 'Toddler Guns', 'Full Biceps', 'The Baby Swole'],
        blurb: '+35% attack damage per tier — visibly swole-er arms each time.',
      },
      armor: { tiers: ['Onesie', 'Double Diaper', 'Footie Pajamas', 'Snowsuit of Invulnerability', 'The Car Seat Carapace'] },
      ability: {
        icon: '🍼', label: 'Bottle',
        tiers: ['Snack Bottle', 'Full Bottle', 'Warm Bottle', 'The Good Bottle', 'Bottomless Bottle'],
        blurb: '+40% special damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'WALKING ISLA',
      desc: 'She walks now. Poorly. Wobbling, unbalanced, unstoppable — and blasting milk at everyone.',
      look: { baby: true, wobble: true },
      special: { type: 'projectile', name: 'Milk Blast', dmg: 12, count: 4, spreadY: 30, speed: 600, r: 9, pierce: true, color: '#f4f0e6' },
      boost: { maxHp: 1.7, dmg: 2.0, speed: 1.2, defense: 0.6 },
      sizeMult: 0.75,
    },
    designed: true,
  },
  {
    id: 'hayes', name: 'HAYES', color: '#5c4ae8',
    title: 'The Laser Knight',
    // Powerhouse: heavy swings, heavier stares.
    hp: 122, speed: 265, dmg: 1.34, atkSpeed: 1.13,
    weaponStyle: 'blade',
    weaponColors: ['#b8a888', '#c9ccd8', '#dfe3e8', '#8a4ae8', '#ff7a2c'],
    weaponBurn: { tier: 5, dur: 3 }, // the Fire Sword ignites on hit
    special: {
      type: 'laser', name: 'Laser Eyes',
      desc: 'Twin beams of pure eye-power sweep everything in front of him.',
      dmg: 22, color: '#ff3a3a',
    },
    tracks: {
      weapon: {
        icon: '⚔', label: 'Swords',
        tiers: ['Wooden Sword', 'Steel Sword', "Knight's Blade", 'Dragonfang', 'The Fire Sword'],
        blurb: '+35% attack damage per tier. The Fire Sword ignites enemies on hit.',
      },
      armor: { tiers: ['T-Shirt of Bravery', 'Cardboard Plate', 'Chainmail Hoodie', 'Knight Armor', 'Dragonscale Suit'] },
      ability: {
        icon: '👁', label: 'Eye Power',
        tiers: ['Intense Stare', 'Warm Gaze', 'Hot Look', 'Searing Glare', 'The Death Stare'],
        blurb: '+40% laser damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'MECHA HAYES',
      desc: 'A towering mech: laser sword, repulsor wrist blasts, and jet thrusters — hold JUMP to fly.',
      look: { mecha: true },
      special: { type: 'projectile', name: 'Repulsor Blasts', count: 3, dmg: 14, speed: 640, r: 7, pierce: true, spreadY: 40, color: '#4adbe8' },
      fly: true,
      boost: { maxHp: 1.7, dmg: 2.0, defense: 0.55 },
      sizeMult: 1.45,
    },
    designed: true,
  },
  {
    id: 'addi', name: 'ADDI', color: '#9fdcff',
    title: 'The Ice Princess in Training',
    // All-rounder with a cold streak.
    hp: 116, speed: 320, dmg: 1.05, atkSpeed: 0.95,
    weaponStyle: 'blade',
    weaponColors: ['#bfe6f5', '#9fdcff', '#6cc4f0', '#4adbe8', '#e8fbff'],
    special: {
      type: 'projectile', name: 'Ice Balls',
      desc: 'Fires twin orbs of biting frost that freeze enemies solid.',
      dmg: 16, count: 2, spreadY: 34, speed: 540, r: 9, pierce: true, freeze: 1.8, shape: 'iceball',
    },
    tracks: {
      weapon: {
        icon: '❄', label: 'Ice Swords',
        tiers: ['Icicle', 'Frost Blade', 'Glacier Edge', 'Aurora Saber', 'The Eternal Winter'],
        blurb: '+35% attack damage per tier — increasingly cooler. Literally.',
      },
      armor: { tiers: ['Snow Mittens', 'Puffer Coat', 'Frost Guard', 'Glacial Plate', 'The Frozen Fortress'] },
      ability: {
        icon: '🧊', label: 'Frost Magic',
        tiers: ['Cold Snap', 'Deep Chill', 'Flash Freeze', 'Absolute Zero', 'The Long Winter'],
        blurb: '+40% ice damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'PRINCESS ADDI',
      desc: 'The coronation. Crown, gown, glacial aura — winter does what she says now.',
      look: { crown: true, gown: true, auraColor: '#bfeaff' },
      special: { type: 'projectile', name: 'Blizzard Volley', count: 5, spreadY: 38, dmg: 14, speed: 560, r: 9, pierce: true, freeze: 2.2, shape: 'iceball' },
      boost: { maxHp: 1.65, dmg: 1.9, speed: 1.2, defense: 0.65 },
    },
    designed: true,
  },
  {
    id: 'brooks', name: 'BROOKS', color: '#37b34a',
    title: 'The Tasmanian Toddler',
    // Speedster: too fast to catch, too bitey to hold.
    hp: 95, speed: 375, dmg: 0.92, atkSpeed: 0.8,
    weaponStyle: 'teeth',
    special: {
      type: 'tornado', name: 'Tornado Brooks',
      desc: 'Spins like a Tasmanian devil — everything nearby gets chewed up and blown away.',
      dmg: 18, radius: 150, kb: 650,
    },
    tracks: {
      weapon: {
        icon: '🦷', label: 'Teeth',
        tiers: ['Baby Teeth', 'Full Set', 'Extra Sharp', 'Shark Week', 'The Unhinged Jaw'],
        blurb: '+35% attack damage per tier. He just bites people.',
      },
      armor: { tiers: ['Sticky Shirt', 'Overalls', 'Bike Helmet', 'Bubble Wrap Suit', 'Toddler-Proof Titanium'] },
      ability: {
        icon: '🌪', label: 'Spin Cycle',
        tiers: ['Dizzy Spin', 'Full Rotation', 'Double Spin', 'Cyclone', 'The Tasmanian Devil'],
        blurb: '+40% tornado damage, cheaper energy cost per tier.',
      },
    },
    finalForm: {
      name: 'BOOMERANG BROOKS',
      desc: 'His mother trained him well. He throws HIMSELF — out and back, hitting everything twice. WHEEE!',
      special: { type: 'selfrang', name: 'Self Toss', dmg: 20, dist: 420 },
      boost: { speed: 1.4, dmg: 1.85, maxHp: 1.55 },
    },
    designed: true,
  },
  {
    id: 'dayne', name: 'DAYNE', color: '#b0b6c4',
    title: 'The Dumb Guy',
    // Dumb Guy archetype: low stats, but hey — not Erika.
    hp: 85, speed: 250, dmg: 0.75, atkSpeed: 1.25,
    weaponStyle: 'noodle',
    weaponColors: ['#e8d24a', '#4ab2e8', '#e84a92', '#37b34a', '#ff7a2c'],
    special: {
      type: 'dive', name: 'Volleyball Dive',
      desc: 'A ball is tossed in from offscreen. He dives. He misses. It hits him in the chest. Upgrades only worsen his timing.',
      selfDmg: 6,
    },
    tracks: {
      weapon: {
        icon: '🛟', label: 'Soft Objects',
        tiers: ['Throw Pillow', 'Pool Noodle', 'Body Pillow', 'Foam Pit Cube', 'The Bouncy Castle Beam'],
        blurb: '+35% attack damage per tier, softly.',
      },
      armor: { tiers: ['Tank Top', 'Cargo Shorts', 'Knee Brace', 'Jorts of Fortitude', 'The Full Sweatsuit'] },
      ability: {
        icon: '🏐', label: 'Timing',
        tiers: ['Late', 'Later', 'Way Off', 'Embarrassing', 'The Worst Timing Imaginable'],
        blurb: 'Each tier makes his timing worse. The ball hits harder. Why upgrade this? Great question.',
      },
    },
    finalForm: {
      name: 'KANSAS CITY DAYNE',
      desc: 'He made the move. He will not stop talking about it.',
      look: { cap: true, capColor: '#d43b2f' },
      chatter: ["I'm moving to Kansas City", 'Get in the car Brooks, we are going to Kansas City'],
      boost: { maxHp: 1.4, dmg: 1.5, speed: 1.1 },
    },
    designed: true,
  },
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
  const w = upg.weapon, a = upg.armor, ab = upg.ability, rg = upg.ranged || 0;
  const s = {
    maxHp: cdef.hp + a * 15,
    speed: cdef.speed,
    dmg: cdef.dmg * (1 + 0.35 * w),
    rangedMult: 1 + 0.35 * rg,
    atkSpeed: cdef.atkSpeed,
    defense: 1 / (1 + 0.25 * a),
    specialMult: 1 + 0.4 * ab,
    energyCost: Math.max(22, 40 - 3 * ab),
  };
  if (upg.ascended) {
    const b = (cdef.finalForm && cdef.finalForm.boost) || {};
    s.maxHp = Math.round(s.maxHp * (b.maxHp || 1.5));
    s.dmg *= b.dmg || 1.75;
    s.rangedMult *= b.dmg || 1.75;
    s.specialMult *= b.special || 2;
    s.speed *= b.speed || 1.15;
    s.defense *= b.defense || 0.7;
  }
  return s;
}

// X is a real combo string now: jab -> cross -> spinning finisher.
// Each step lunges forward and can cancel its recovery into the next.
const CHAIN = [
  { name: 'Jab',      dmg: 7,  startup: 0.06, active: 0.09, recovery: 0.15, range: 76,  kb: 130, kbY: -30,  lunge: 190, pose: 'X1' },
  { name: 'Cross',    dmg: 9,  startup: 0.07, active: 0.09, recovery: 0.17, range: 84,  kb: 180, kbY: -50,  lunge: 235, pose: 'X2' },
  { name: 'Finisher', dmg: 17, startup: 0.11, active: 0.11, recovery: 0.26, range: 100, kb: 540, kbY: -260, lunge: 300, pose: 'X3' },
];
const ATTACKS = {
  B: { name: 'Rising Break', dmg: 13, startup: 0.16, active: 0.12, recovery: 0.30, radius: 118, kb: 220, kbY: -540, anim: 'upper' },
};

// Every fighter carries a themed ranged weapon on Y, with its own tier track.
const RANGED_WEAPONS = {
  todd:      { icon: '🍢', label: 'Skewers', tiers: ['Toothpick', 'Kebab Stick', 'Steel Skewer', 'Rebar Rod', 'The Brochette of Doom'], proj: { dmg: 10, speed: 640, r: 5, shape: 'needle' } },
  sonya:     { icon: '✈️', label: 'Late Notices', tiers: ['Friendly Reminder', '2nd Notice', 'Final Notice', 'Collections Letter', 'The Summons'], proj: { dmg: 9, speed: 480, r: 8, shape: 'plane', bounty: 2 } },
  jordan:    { icon: '📀', label: 'Lens Discs', tiers: ['Lens Cap', 'Kit Lens', 'Prime Lens', 'Telephoto', 'The L Glass'], proj: { dmg: 10, speed: 560, r: 8, shape: 'ball', pierce: true } },
  jerod:     { icon: '✴️', label: 'PLA Shurikens', tiers: ['Draft Quality', '0.2mm Layers', 'Carbon Star', 'Titanium Star', 'The Perfect Print'], proj: { dmg: 11, speed: 600, r: 7, shape: 'star' } },
  jacob:     { icon: '🔩', label: 'Pipe Fittings', tiers: ['Washer', 'Coupling', 'Elbow Joint', 'T-Fitting', 'The Golden Valve'], proj: { dmg: 12, speed: 500, r: 7, arc: true, bounce: true, life: 1.8 } },
  samantha:  { icon: '🧃', label: 'Juice Boxes', tiers: ['Water Cup', 'Apple Juice', 'Fruit Punch', 'The Big Capri', 'Sippy of Judgment'], proj: { dmg: 11, speed: 470, r: 8, arc: true } },
  cassandra: { icon: '🥓', label: 'Deli Slices', tiers: ['Bologna', 'Ham', 'Salami', 'Prosciutto', 'The Charcuterie Frisbee'], proj: { dmg: 10, speed: 540, r: 8, shape: 'ball', pierce: true } },
  erika:     { icon: '🧻', label: 'Damp Wipes', tiers: ['Single Ply', 'Damp Wipe', 'Damper Wipe', 'Alarmingly Damp', 'The Moist One'], proj: { dmg: 2, speed: 300, r: 5, life: 0.55 } },
  levi:      { icon: '🔧', label: 'Lug Nuts', tiers: ['Loose Bolt', 'Lug Nut', 'Impact Socket', 'Chrome Nut', "The Camaro's Own"], proj: { dmg: 11, speed: 660, r: 5 } },
  ronathon:  { icon: '📛', label: 'Name Tags', tiers: ['HELLO: RON', 'HELLO: REGGIE', 'HELLO: RONALD', 'HELLO: DOUGANOLD', 'HELLO: RYAN DUGAN'], proj: { dmg: 8, speed: 500, r: 7, count: 2, spreadY: 40, shape: 'plane' } },
  tim:       { icon: '🎈', label: 'Water Balloons', tiers: ['Dollar Store', 'Double Knot', 'The Fat One', 'Pressure Packed', 'The Hydro Bomb'], proj: { dmg: 10, speed: 460, r: 8, arc: true, douse: true } },
  myah:      { icon: '🧺', label: 'Dryer Balls', tiers: ['Sock Ball', 'Wool Ball', 'Double Bounce', 'Static Charged', 'The Uncatchable'], proj: { dmg: 10, speed: 520, r: 8, shape: 'ball', bounce: true, arc: true, life: 2 } },
  isla:      { icon: '🥣', label: 'Cheerios', tiers: ['A Single O', 'Small Handful', 'Full Fist', 'Bowl Toss', 'The Whole Box'], proj: { dmg: 6, speed: 560, r: 4, count: 3, spreadY: 34 } },
  hayes:     { icon: '⚡', label: 'Power Bolts', tiers: ['Sparkler', 'Zap Bolt', 'Plasma Bolt', 'Ion Lance', 'The Star Piercer'], proj: { dmg: 12, speed: 700, r: 6 } },
  addi:      { icon: '❄️', label: 'Icicle Darts', tiers: ['Ice Chip', 'Icicle', 'Frost Dart', 'Glacier Needle', "Winter's Kiss"], proj: { dmg: 9, speed: 580, r: 6, shape: 'iceball', freeze: 0.6 } },
  brooks:    { icon: '🦷', label: 'Loose Teeth', tiers: ['Wiggly Tooth', 'Baby Tooth', 'Molar', 'Full Set Volley', 'The Tooth Fairy Debt'], proj: { dmg: 7, speed: 620, r: 4, count: 2, spreadY: 26 } },
  dayne:     { icon: '🎯', label: 'Lawn Darts', tiers: ['Foam Dart', 'Plastic Dart', 'Regulation Dart', 'Sharpened Dart', 'The Banned Original'], proj: { dmg: 12, speed: 480, r: 6, arc: true, shape: 'needle' } },
};

// wire each fighter's ranged weapon + its shop track names
for (const c of CHARACTERS) {
  c.rangedWeapon = RANGED_WEAPONS[c.id] || { icon: '🪨', label: 'Rocks', tiers: UPGRADE_TRACKS.ranged.tiers, proj: { dmg: 9, speed: 520, r: 6 } };
  c.tracks.ranged = { icon: c.rangedWeapon.icon, label: c.rangedWeapon.label, tiers: c.rangedWeapon.tiers, blurb: '+35% ranged damage per tier (Y button).' };
}

// stylized hair per fighter (drawn under headbands, skipped under helmets/crowns)
const HAIR_STYLES = {
  todd: 'short', sonya: 'pony', jordan: 'spiky', jerod: 'short', jacob: 'spiky',
  samantha: 'pony', cassandra: 'long', erika: 'pony', levi: 'shaggy', ronathon: 'short',
  tim: 'short', myah: 'long', isla: 'none', hayes: 'spiky', addi: 'pony',
  brooks: 'shaggy', dayne: 'short',
};
for (const c of CHARACTERS) {
  c.hairStyle = HAIR_STYLES[c.id] || 'short';
  c.hairColor = hexMix(c.color2, '#14101a', 0.35);
}

// Base combat roles — per-world enemy skins override name/colors/accessory,
// the numbers stay role-based so balance is uniform everywhere.
const ENEMY_ROLES = {
  grunt:   { hp: 30,  dmg: 8,  speed: 125, reach: 62, windup: 0.5,  cooldown: 1.0, value: 15,  size: 1.0 },
  stinger: { hp: 18,  dmg: 6,  speed: 235, reach: 55, windup: 0.32, cooldown: 0.7, value: 18,  size: 0.85 },
  brute:   { hp: 95,  dmg: 18, speed: 82,  reach: 78, windup: 0.85, cooldown: 1.4, value: 40,  size: 1.32 },
  shooter: { hp: 24,  dmg: 10, speed: 105, reach: 380, windup: 0.7, cooldown: 1.8, value: 30,  size: 0.95, ranged: true },
  boss:    { hp: 420, dmg: 24, speed: 95,  reach: 95, windup: 0.75, cooldown: 1.2, value: 320, size: 1.7,  boss: true },
};

// The four worlds. Five levels each; the fifth is a boss level.
// Worlds loop endlessly with the difficulty curve still climbing.
const WORLDS = [
  {
    id: 'home', name: 'HORSCH FAMILY LAND',
    levelNames: ['The Backyard', 'The Kitchen', 'The Church Parking Lot', 'The Lake', 'The Cul-de-Sac Showdown'],
    props: 'fence',
    theme: { sky1: '#2e1e3e', sky2: '#0d0a14', glow: '#ffb04a', ground: '#1f2418', groundTop: '#3d4a2a', far: '#191024', near: '#242c1a' },
    enemies: {
      grunt:   { name: 'Yard Gnome',        color: '#c9342a', color2: '#3a5a8a', accessory: 'gnomehat' },
      stinger: { name: 'Murder Wasp',       color: '#e8c84a', color2: '#2a2418', accessory: 'wings', signature: 'lunge' },
      brute:   { name: 'Trash Panda',       color: '#8d8d96', color2: '#3a3a42', accessory: 'mask', signature: 'thief' },
      shooter: { name: 'Sprinkler Sentry',  color: '#5fae6a', color2: '#24482a', accessory: 'antenna' },
      boss:    { name: 'The Goose', color: '#b8bcc4', color2: '#1d1d24', bossKind: 'goose' },
    },
  },
  {
    id: 'pipes', name: 'THE PLUMBING UNDERWORLD',
    levelNames: ['The Crawlspace', 'The Drain Line', 'The Sewer Kingdom', 'The Water Heater Caverns', 'The Boiler Depths'],
    props: 'pipes',
    theme: { sky1: '#0f2a28', sky2: '#050d0d', glow: '#4ae8b2', ground: '#132018', groundTop: '#28443a', far: '#0a1a17', near: '#123128' },
    enemies: {
      grunt:   { name: 'Clog Blob',       color: '#6a8a3a', color2: '#2c3a18', accessory: 'drip', signature: 'split' },
      stinger: { name: 'Drain Rat',       color: '#8a7a6a', color2: '#3a3028', accessory: 'ears', signature: 'pack' },
      brute:   { name: 'Rust Golem',      color: '#b06a32', color2: '#4d2a10', accessory: 'bolts' },
      shooter: { name: 'Grease Spitter',  color: '#3a3a2a', color2: '#e8c84a', accessory: 'drip' },
      boss:    { name: 'The Water Heater', color: '#b06a32', color2: '#4d2a10', bossKind: 'heater' },
    },
  },
  {
    id: 'road', name: 'THE ROAD TO KANSAS CITY',
    levelNames: ['Leaving the Driveway', 'The Gas Station', "The World's Largest Ball of Twine", 'The Rest Stop at 2 AM', 'Kansas City Limits'],
    props: 'road',
    theme: { sky1: '#4a1e2e', sky2: '#140a10', glow: '#ff6a3c', ground: '#26221e', groundTop: '#4a4238', far: '#1d1218', near: '#2c2018' },
    enemies: {
      grunt:   { name: 'Traffic Cone',        color: '#e8742a', color2: '#5a2c10', accessory: 'conehat' },
      stinger: { name: 'Runaway Tire',        color: '#3a3a42', color2: '#18181e', signature: 'roll' },
      brute:   { name: 'Rest-Stop Sasquatch', color: '#6a4a32', color2: '#2c1e12', accessory: 'ears' },
      shooter: { name: 'Speed Camera',        color: '#6a7288', color2: '#282c3a', accessory: 'antenna' },
      boss:    { name: 'Road Rage', color: '#b8a888', color2: '#3a3028', bossKind: 'van' },
    },
  },
  {
    id: 'fantasy', name: 'THE FANTASY REALMS',
    levelNames: ['The Enchanted Forest', 'The Frost Peaks', 'The Volcano Rim', 'The Haunted Keep', 'The Shadow Throne'],
    props: 'castle',
    theme: { sky1: '#241040', sky2: '#0a0614', glow: '#c24ae8', ground: '#1a1224', groundTop: '#38284a', far: '#140a20', near: '#221430' },
    enemies: {
      grunt:   { name: 'Skeleton',  color: '#d8d4c8', color2: '#8a8578', accessory: 'ribs', signature: 'revive' },
      stinger: { name: 'Imp',       color: '#d4503a', color2: '#4d1408', accessory: 'imphorns', signature: 'blink' },
      brute:   { name: 'Ogre',      color: '#5f8a3a', color2: '#243a12', accessory: 'imphorns' },
      shooter: { name: 'Dark Mage', color: '#7a4ae8', color2: '#2c1460', accessory: 'wizardhat' },
      boss:    { name: 'Shadow Dragon', color: '#8a4ae8', color2: '#2c1460', bossKind: 'dragon' },
    },
  },
];

function worldFor(L) {
  return WORLDS[Math.floor((L - 1) / 5) % WORLDS.length];
}

function worldEnemyDef(world, role) {
  return Object.assign({}, ENEMY_ROLES[role], world.enemies[role] || {});
}

// Level plan: waves grow in size, world enemy types unlock across each
// world's five levels, stats scale with absolute level forever.
function levelPlan(L) {
  const world = worldFor(L);
  const lw = ((L - 1) % 5) + 1; // level within the world
  const pool = ['grunt'];
  if (lw >= 2) pool.push('stinger');
  if (lw >= 3) pool.push('brute');
  if (lw >= 4) pool.push('shooter');
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
  if (lw === 5) waves[waves.length - 1].push('boss');

  // level events: a chance of a mutator on non-boss levels from level 2 on
  const EVENT_POOL = ['coinrain', 'fog', 'fullsend', 'goose'];
  const event = (lw !== 5 && L >= 2 && Math.random() < 0.35)
    ? EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
    : null;

  const k = L - 1;
  return {
    level: L,
    world, lw,
    levelName: world.levelNames[lw - 1],
    event,
    waves,
    hpMult: 1 + 0.22 * k + 0.035 * k * k,
    dmgMult: 1 + 0.16 * k,
    speedMult: 1 + Math.min(0.04 * k, 0.5),
    valueMult: 1 + 0.32 * k,
    boss: lw === 5,
  };
}

function themeFor(L) { return worldFor(L).theme; }
