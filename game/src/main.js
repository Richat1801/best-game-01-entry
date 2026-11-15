// Lumenkeep — bootstrap, game state, main loop and wave flow.
// A tower-defence game: build towers on the plots, hold the lighthouse
// through 12 waves. Win by clearing wave 12; lose if the keep hits 0 HP.

import { VIEW_W, VIEW_H, PLOTS, START_GOLD, START_KEEP_HP, MAX_WAVE, KILL_SCORE } from './config.js';
import { makeRng } from './rng.js';
import { AudioSys } from './audio.js';
import { Particles } from './particles.js';
import { buildSpawnQueue, makeEnemy, updateEnemies } from './enemies.js';
import { updateTowers, updateProjectiles } from './towers.js';
import { waveClearBonus } from './levels.js';
import { draw } from './render.js';
import { handleClick, handleKey, toGameCoords } from './ui.js';

export function createGame(seed) {
  const rng = makeRng(seed || 20261116);
  const state = {
    seed: seed || 20261116,
    rng,
    audio: new AudioSys(),
    particles: new Particles(rng),
    screen: 'title',
    time: 0,
    gold: START_GOLD,
    goldEarned: 0,
    score: 0,
    kills: 0,
    keepHp: START_KEEP_HP,
    maxKeepHp: START_KEEP_HP,
    wave: 0,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    leakedThisWave: 0,
    enemies: [],
    projectiles: [],
    plots: PLOTS.map((p) => ({ x: p.x, y: p.y, tower: null })),
    buildType: null,
    selectedTower: null,
    speedMul: 1,
    showRules: false,
    shake: 0,
    flashRed: 0,
    bannerText: '',
    bannerSub: '',
    bannerUntil: 0,
    best: 0,
    stars: [],
    grass: [],
  };
  try {
    state.best = Number(window.localStorage.getItem('lumenkeep-best') || 0);
  } catch (e) { state.best = 0; }
  for (let i = 0; i < 110; i++) {
    state.stars.push({ x: rng() * VIEW_W, y: rng() * 300, size: rng() < 0.8 ? 2 : 3, tw: rng() * 6 });
  }
  for (let i = 0; i < 160; i++) {
    state.grass.push({ x: rng() * VIEW_W, y: 70 + rng() * (VIEW_H - 180) });
  }

  state.startGame = function () {
    state.audio.ensure();
    state.reset();
    state.screen = 'playing';
    state.banner('WAVE 1 INCOMING', 'Build your towers, then press SPACE');
  };

  state.reset = function () {
    const keepBest = state.best;
    const fresh = createGame(state.seed);
    // Keep this state's own methods: fresh's closures point at fresh.
    delete fresh.startGame; delete fresh.reset; delete fresh.banner; delete fresh.update; delete fresh.startNextWave;
    Object.assign(state, fresh);
    state.best = keepBest;
    state.screen = 'playing';
  };

  state.banner = function (text, sub, secs) {
    state.bannerText = text;
    state.bannerSub = sub || '';
    state.bannerUntil = state.time + (secs || 2.6);
  };

  state.startNextWave = function () {
    if (state.screen !== 'playing' || state.waveActive || state.wave >= MAX_WAVE) return;
    state.wave++;
    state.waveActive = true;
    state.leakedThisWave = 0;
    state.spawnQueue = buildSpawnQueue(state.wave, state.rng);
    state.spawnTimer = 0;
    state.audio.horn();
    state.banner('WAVE ' + state.wave, waveName(state.wave), 2.4);
  };

  state.update = function (dt) {
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
    if (state.flashRed > 0) state.flashRed = Math.max(0, state.flashRed - dt);
    state.particles.update(dt);
    state.audio.musicTick(dt, state.waveActive);
    if (state.screen !== 'playing') return;

    // Spawning.
    if (state.waveActive && state.spawnQueue.length > 0) {
      state.spawnTimer += dt;
      while (state.spawnQueue.length > 0 && state.spawnQueue[0].at <= state.spawnTimer) {
        const item = state.spawnQueue.shift();
        state.enemies.push(makeEnemy(item.type, state.wave, state.rng));
      }
    }
    updateTowers(state, dt);
    updateProjectiles(state, dt);
    updateEnemies(state, dt);

    // Wave cleared?
    if (state.waveActive && state.spawnQueue.length === 0 && state.enemies.length === 0) {
      state.waveActive = false;
      const bonus = waveClearBonus(state.wave, state.leakedThisWave);
      state.gold += bonus;
      state.goldEarned += bonus;
      state.score += 100 * state.wave;
      state.particles.text(640, 300, 'WAVE CLEAR  +' + bonus + 'g', '#80ed99');
      if (state.wave >= MAX_WAVE) {
        state.screen = 'victory';
        state.score += 500;
        state.audio.victory();
        saveBest(state);
      } else {
        state.banner('WAVE ' + state.wave + ' CLEARED', '+' + bonus + ' gold — build up for wave ' + (state.wave + 1), 2.6);
        state.audio.coin();
      }
    }
    if (state.keepHp <= 0) {
      state.keepHp = 0;
      state.screen = 'defeat';
      state.audio.defeat();
      saveBest(state);
    }
  };

  return state;
}

function waveName(wave) {
  const names = {
    1: 'The mites come first',
    2: 'Runners join the march',
    3: 'Shellbacks roll in',
    4: 'Spitters take aim',
    5: 'Wisps drift through the dark',
    6: 'A Brute leads them',
    7: 'The horde quickens',
    8: 'Two Brutes this time',
    9: 'The road is crowded',
    10: 'Three Brutes — hold the line',
    11: 'The last storm before the Titan',
    12: 'THE GLOOM TITAN',
  };
  return names[wave] || '';
}

function saveBest(state) {
  if (state.score > state.best) {
    state.best = state.score;
    try { window.localStorage.setItem('lumenkeep-best', String(state.best)); } catch (e) { /* private mode */ }
  }
}

// ---- Boot ----

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed') || 20261116);
const state = createGame(seedParam);
window.__game = state;

canvas.addEventListener('click', (ev) => {
  const p = toGameCoords(canvas, ev.clientX, ev.clientY);
  handleClick(state, p.x, p.y);
});
canvas.addEventListener('mousemove', (ev) => {
  const p = toGameCoords(canvas, ev.clientX, ev.clientY);
  state.hover = p;
});
window.addEventListener('keydown', (ev) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(ev.key)) ev.preventDefault();
  handleKey(state, ev.key);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!window.__shotMode) state.update(dt * state.speedMul);
  draw(ctx, state);
  requestAnimationFrame(frame);
}

// Shot mode (for screenshots): the shots module stages a fixed scene,
// then the loop draws it once and stops advancing the simulation.
if (params.get('shot')) {
  window.__shotMode = true;
  import('./shots.js').then((m) => {
    m.stageShot(state, params.get('shot'), seedParam);
    draw(ctx, state);
    window.__shotReady = true;
  });
} else {
  requestAnimationFrame(frame);
}
