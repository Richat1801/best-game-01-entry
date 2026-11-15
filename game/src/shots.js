// Deterministic screenshot scenes (?shot=<scene>&seed=<n>).
// Each scene stages a fixed game state with the seeded RNG, runs a fixed
// number of 1/60 s simulation steps (no wall clock), and lets main.js
// draw one frame. Nothing here is reachable from normal play.

import { placeTower, upgradeTower } from './towers.js';
import { makeEnemy } from './enemies.js';
import { PATH_POINTS } from './config.js';

function simSteps(state, n) {
  for (let i = 0; i < n; i++) state.update(1 / 60);
}

function buildDemoBoard(state, gold) {
  state.gold = 9999; // fund the staging build; reset to the display amount below
  state.screen = 'playing';
  state.score = 1240;
  state.kills = 87;
  // A sensible mid-game board: two arrows, a frost, a mortar and a coil.
  placeTower(state, 0, 'arrow');
  placeTower(state, 2, 'frost');
  placeTower(state, 5, 'cannon');
  placeTower(state, 9, 'spark');
  placeTower(state, 3, 'arrow');
  upgradeTower(state, state.plots[0].tower);
  upgradeTower(state, state.plots[5].tower);
  state.gold = gold;
}

export function stageShot(state, scene, seed) {
  if (scene === 'start') {
    state.screen = 'title';
    state.showRules = false;
    state.best = 1240;
    // A lively title backdrop: towers on the plots, foes on the road.
    buildDemoBoard(state, 170);
    state.screen = 'title';
    state.time = 4.2;
    for (let i = 0; i < 6; i++) {
      const e = makeEnemy(i % 2 ? 'runner' : 'mite', 3, state.rng);
      e.x = PATH_POINTS[1].x + 40 + i * 90;
      e.y = PATH_POINTS[1].y;
      e.wp = 2;
      e.travelled = 200 + i * 90;
      state.enemies.push(e);
    }
    state.gold = 170;
    return;
  }

  if (scene === 'play') {
    buildDemoBoard(state, 320);
    state.wave = 5;
    state.waveActive = true;
    state.spawnQueue = [];
    // A busy wave-5 moment: foes spread along the road, some already hit.
    const spots = [
      [1, 120, 'mite'], [1, 260, 'runner'], [2, 80, 'shell'], [2, 200, 'wisp'],
      [3, 60, 'spitter'], [3, 180, 'mite'], [4, 100, 'runner'], [5, 40, 'wisp'],
      [6, 140, 'shell'], [7, 90, 'runner'],
    ];
    for (const [seg, along, type] of spots) {
      const e = makeEnemy(type, 5, state.rng);
      const a = PATH_POINTS[seg], b = PATH_POINTS[seg + 1];
      const t = Math.min(1, along / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)));
      e.x = a.x + (b.x - a.x) * t;
      e.y = a.y + (b.y - a.y) * t;
      e.wp = seg + 1;
      e.travelled = 400 + seg * 300 + along;
      e.hp = Math.round(e.maxHp * 0.7);
      state.enemies.push(e);
    }
    state.banner('WAVE 5', 'Wisps drift through the dark', 999);
    state.bannerUntil = state.time + 999;
    simSteps(state, 150); // 2.5 s of live combat: projectiles, particles, flashes.
    state.banner('WAVE 5', 'Wisps drift through the dark', 999);
    state.bannerUntil = state.time + 999;
    return;
  }

  if (scene === 'upgrade') {
    buildDemoBoard(state, 640);
    state.wave = 6;
    state.waveActive = false;
    state.selectedTower = state.plots[5].tower; // the level-2 mortar
    state.buildType = null;
    const e = makeEnemy('brute', 6, state.rng);
    e.x = PATH_POINTS[3].x; e.y = PATH_POINTS[3].y; e.wp = 4; e.travelled = 900;
    state.enemies.push(e);
    state.time = 6.0;
    state.banner('WAVE 6 CLEARED', '+112 gold — a Brute leads the next wave', 999);
    state.bannerUntil = state.time + 999;
    return;
  }

  if (scene === 'victory') {
    buildDemoBoard(state, 480);
    state.screen = 'victory';
    state.wave = 12;
    state.score = 4860;
    state.kills = 342;
    state.goldEarned = 2140;
    state.keepHp = 14;
    state.best = 4860;
    state.time = 8.0;
    return;
  }

  // Fallback: plain play scene.
  stageShot(state, 'play', seed);
}
