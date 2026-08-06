# Horsch Family Arena

*Fight. Earn. Ascend.* A Mortal Kombat-styled side-scrolling arena brawler that runs in any
browser — desktop or mobile. No build step, no dependencies: plain HTML5 canvas + vanilla JS.

## Run it

Any static file server works. From this folder:

```bash
npx serve . -l 5199
```

Then open <http://localhost:5199>. On a phone, use your PC's LAN IP (e.g. `http://192.168.x.x:5199`)
and "Add to Home Screen" for a fullscreen app-like experience.

## How to play

| Input | Touch | Keyboard |
|---|---|---|
| Move | ◀ ▶ | A / D |
| Jump | ▲ | W or Space |
| Crouch (halves damage, ducks bolts) | ▼ | S |
| Light strike | **X** | J |
| Heavy kick | **Y** | K |
| Rising break (AoE launcher) | **B** | L |
| Special (costs energy) | **A** | I |

## The loop

1. **Pick a fighter** before each level — Blaze (fast, piercing fireball), Frost (tanky, freezing
   ice nova), or Volt (heavy hitter, lightning dash).
2. **Clear waves** of enemies — grunts, stingers, brutes, ranged shooters, and a Warlord boss every
   5th level. Kills drop coins.
3. **Spend in the marketplace** between levels: Weapons, Armor, and Abilities — five tiers each,
   tracked per character. Money is shared.
4. **Ascend**: max all three tracks on a character to unlock their **Final Form** (Inferno King,
   Glacier Titan, Storm God) — massive stat boosts and a doubled special.

Levels scale up faster than you do; when you fall, you keep every dollar you earned. Buy upgrades
and come back stronger.

Progress saves automatically in the browser (`localStorage`).

## Dev notes

- `js/data.js` — characters, enemies, upgrade tracks, level scaling & economy balance
- `js/game.js` — engine: combat, enemy AI, waves, physics, rendering, HUD (`Game.debug()` exposes
  live sim state for headless testing)
- `js/ui.js` — save data + DOM screens (title, select, marketplace, defeat, pause)
- `js/input.js` — multi-touch controls + keyboard fallback
- `js/audio.js` — tiny WebAudio synth for SFX
