# best-game-01-entry

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Richat1801/best-game-01-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Richat1801/best-game-01-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Lumenkeep** — a tower-defence game for make.fun's "Make the best game" bounty. Hold the last lighthouse against the gloom: build towers on the glowing plots, survive all 12 waves, and stop the Gloom Titan from snuffing the light.

## The game

- **Goal:** survive 12 waves. If the gloom reaches the keep and its light hits 0, the night wins.
- **4 towers:** Arrow Spire (fast bolts), Frost Lantern (slows 45%), Ember Mortar (splash shells), Storm Coil (lightning arcs to 3 foes) — each upgradable to level 3, sellable for 70%.
- **7 foes:** Mites, fast Runners, armoured Shellbacks, Spitters, Wisps, wave-6 Brutes, and the Gloom Titan on wave 12.
- **Economy:** gold for every foe felled plus a wave-clear bonus; spend it on towers and upgrades between waves.
- **Feel:** particles, screen shake, floating gold popups, a rotating lighthouse beam, and fully synthesised WebAudio sound effects and music — no audio or image files, everything is drawn and played in code.
- **Controls:** mouse to build · 1–4 pick a tower · SPACE starts the next wave · F fast-forward · P pause · M mute · R restart.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static file server — no build step, no network requests. `main.ts` (Node 22) hands the entry in: it copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's `vendor/makefun-game.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=dss38k9p&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
