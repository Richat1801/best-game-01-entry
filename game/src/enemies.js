// Enemies: spawning a wave's queue, walking the road, slowing, dying.
// An enemy is {type, x, y, wp, hp, maxHp, speed, slowUntil, slowPct,
// travelled, gold, dmg, r, color, wobble}. travelled ranks targets:
// towers always shoot the foe closest to the keep.

import { ENEMIES, PATH_POINTS, waveHpMul } from './config.js';
import { WAVES } from './levels.js';
import { range } from './rng.js';

export function buildSpawnQueue(wave, rng) {
  const groups = WAVES[wave] || [];
  const queue = [];
  let t = 0.5;
  // Interleave the groups so mixed waves arrive mixed, not in blocks.
  const streams = groups.map(([type, count, gap]) => ({ type, left: count, gap, next: t }));
  while (streams.some((s) => s.left > 0)) {
    let best = null;
    for (const s of streams) {
      if (s.left > 0 && (!best || s.next < best.next)) best = s;
    }
    queue.push({ type: best.type, at: best.next });
    best.left--;
    best.next += best.gap * range(rng, 0.85, 1.15);
  }
  return queue;
}

export function makeEnemy(type, wave, rng) {
  const def = ENEMIES[type];
  const hp = Math.round(def.hp * waveHpMul(wave));
  const start = PATH_POINTS[0];
  return {
    type, x: start.x + range(rng, -8, 8), y: start.y + range(rng, -10, 10),
    wp: 1, hp, maxHp: hp, speed: def.speed * range(rng, 0.92, 1.08),
    slowUntil: 0, slowPct: 0, travelled: 0, gold: def.gold, dmg: def.dmg,
    r: def.r, color: def.color, wobble: range(rng, 0, Math.PI * 2),
    flash: 0, dead: false, leaked: false,
  };
}

export function updateEnemies(state, dt) {
  const now = state.time;
  for (const e of state.enemies) {
    if (e.dead || e.leaked) continue;
    if (e.flash > 0) e.flash -= dt;
    const slowed = now < e.slowUntil;
    const speed = e.speed * (slowed ? 1 - e.slowPct : 1);
    let move = speed * dt;
    while (move > 0 && e.wp < PATH_POINTS.length) {
      const target = PATH_POINTS[e.wp];
      const dx = target.x - e.x, dy = target.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= move) {
        e.x = target.x; e.y = target.y; e.travelled += d; move -= d; e.wp++;
      } else {
        e.x += (dx / d) * move; e.y += (dy / d) * move; e.travelled += move; move = 0;
      }
    }
    if (e.wp >= PATH_POINTS.length) {
      e.leaked = true;
      state.keepHp -= e.dmg;
      state.leakedThisWave += e.dmg;
      state.shake = Math.min(14, state.shake + 6);
      state.flashRed = 0.45;
      state.audio.leak();
    }
  }
  state.enemies = state.enemies.filter((e) => !e.dead && !e.leaked);
}

export function damageEnemy(state, e, amount) {
  e.hp -= amount;
  e.flash = 0.09;
  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    state.gold += e.gold;
    state.score += 10 + (e.type === 'brute' || e.type === 'titan' ? 90 : 0);
    state.kills++;
    state.audio.coin();
    state.particles.burst(e.x, e.y, e.color, e.type === 'titan' ? 26 : 10);
    state.particles.text(e.x, e.y - e.r - 6, '+' + e.gold + 'g', '#ffd166');
    if (e.type === 'titan') state.shake = 12;
  }
}
