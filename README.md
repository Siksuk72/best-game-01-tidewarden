# TIDEWARDEN — Hold the Last Harbor

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Siksuk72/best-game-01-tidewarden/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Siksuk72/best-game-01-tidewarden/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A 2D canvas tower-defence game for make.fun bounty **best-game-01** (round 5).
The drowned horde sails in from the sea gate; build towers on the stone pier,
spend your gold wisely, and keep the Harbor Heart burning for 30 waves.

## Play

```sh
node serve.ts        # then open http://localhost:8080
```

No build step, no network requests, no libraries — plain HTML5 canvas 2D +
synthesized WebAudio. Everything (art, sound, music) is generated in code.

## The game

- **Map:** a winding stone pier from the sea gate (right) to the Harbor Heart
  lighthouse-crystal (left), with 14 build plots beside the path.
- **Lives:** 20. Enemies that reach the Heart cost 1–5 lives.
- **Towers (6):** Harpoon (fast, long range), Cannon (splash), Frost Spire
  (chills), Tide Mill (+gold per wave), Storm Caller (chain lightning),
  Lantern (buffs adjacent towers). Each has 3 tiers with distinct visuals;
  towers have HP, can be upgraded, sold (70% refund) or repaired.
- **Enemies (8 + boss):** Skitter Crab, Mire Eel, Shell Brute, Spitter (shoots
  your towers), Dusk Jelly (splits in two), Tide Ghost (immune to slow),
  Barnacle Hulk, and the Drowned King — boss on waves 10, 20 and 30, stronger
  each time, spawning minions at HP thresholds.
- **Waves:** 30, escalating. Wave-clear bonus gold, +10g for starting early.
- **Abilities (free, cooldown):** Q Tide Surge (slow all 50% for 4s), E Flare
  Volley (damage all enemies on screen).
- **Controls:** mouse to build/upgrade/sell · 1–6 select tower · Space start
  wave · P pause · F 1×/2× speed · M mute · R restart.
- **Victory** after wave 30: stars by lives remaining (3 if ≥15, 2 if ≥8,
  else 1) plus kills, gold earned, towers built and time.

## Files

```
game/
  index.html            page shell
  style.css             page frame
  src/
    config.js           constants: map, towers, enemies, palette
    random.js           seeded RNG (mulberry32)
    input.js            mouse/keyboard, hit-testing for plots & buttons
    audio.js            WebAudio SFX + ambient arpeggio (all synthesized)
    particles.js        particles, floating text, lightning, screen shake
    enemies.js          enemy movement, spitter shots, splits, boss minions
    towers.js           build/upgrade/sell/repair, targeting, projectiles
    waves.js            30-wave composition, boss tiers
    world.js            game state, economy, wave flow, abilities, win/lose
    render.js           harbor map, towers, enemies, HUD, screens
    shots.js            deterministic ?shot= scenes for screenshots
    main.js             fixed 60 Hz loop, screen state machine
main.ts                 copies game/ + screenshots/ to /output, writes dossier.json
serve.ts                tiny static server on :8080
shots.json              the 4 screenshots (start / play / boss / win)
```

Deterministic screenshot modes: `?shot=start|play|boss|win&seed=1` — seeded RNG,
fixed simulated time, `window.__shotReady = true` once drawn.

## Build the submission

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. Original idea, art, sounds and names; nothing copied
from any commercial game.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hz26ha21&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
