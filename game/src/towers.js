// Towers: buying, upgrading, selling, targeting and firing.
// A tower is {type, plot, level, x, y, cooldown, angle, kills}.
// Projectiles fly to a live target; spark lightning chains instantly.

import { TOWERS, UPGRADE, MAX_TOWER_LEVEL } from './config.js';
import { dist } from './rng.js';
import { damageEnemy } from './enemies.js';

export function towerStats(type, level) {
  const base = TOWERS[type];
  const stats = {
    name: base.name, cost: base.cost, range: base.range, damage: base.damage,
    rate: base.rate, projSpeed: base.projSpeed, splash: base.splash || 0,
    slowPct: base.slowPct || 0, slowSecs: base.slowSecs || 0,
    chain: base.chain || 0, color: base.color,
  };
  if (level >= 2) {
    stats.damage = Math.round(stats.damage * UPGRADE[2].dmgMul);
    stats.range = Math.round(stats.range * UPGRADE[2].rangeMul);
  }
  if (level >= 3) {
    stats.damage = Math.round(base.damage * UPGRADE[3].dmgMul);
    stats.range = Math.round(base.range * UPGRADE[3].rangeMul);
  }
  return stats;
}

export function upgradeCost(type, level) {
  if (level >= MAX_TOWER_LEVEL) return null;
  return Math.round(TOWERS[type].cost * UPGRADE[level + 1].costMul);
}

export function sellValue(tower) {
  let spent = TOWERS[tower.type].cost;
  for (let l = 2; l <= tower.level; l++) spent += Math.round(TOWERS[tower.type].cost * UPGRADE[l].costMul);
  return Math.floor(spent * 0.7);
}

export function placeTower(state, plotIndex, type) {
  const plot = state.plots[plotIndex];
  if (!plot || plot.tower) return false;
  const cost = TOWERS[type].cost;
  if (state.gold < cost) return false;
  state.gold -= cost;
  plot.tower = { type, plot: plotIndex, level: 1, x: plot.x, y: plot.y, cooldown: 0, angle: -Math.PI / 2, kills: 0 };
  state.audio.build();
  state.particles.burst(plot.x, plot.y, TOWERS[type].color, 12);
  return true;
}

export function upgradeTower(state, tower) {
  const cost = upgradeCost(tower.type, tower.level);
  if (cost === null || state.gold < cost) return false;
  state.gold -= cost;
  tower.level++;
  state.audio.upgrade();
  state.particles.burst(tower.x, tower.y, '#ffffff', 14);
  state.particles.text(tower.x, tower.y - 30, 'LEVEL ' + tower.level, '#7fe7ff');
  return true;
}

export function sellTower(state, tower) {
  const plot = state.plots[tower.plot];
  state.gold += sellValue(tower);
  plot.tower = null;
  state.audio.coin();
}

function nearestInRange(state, tower, stats) {
  let best = null;
  for (const e of state.enemies) {
    if (e.dead || e.leaked) continue;
    if (dist(tower.x, tower.y, e.x, e.y) <= stats.range + e.r) {
      if (!best || e.travelled > best.travelled) best = e;
    }
  }
  return best;
}

export function updateTowers(state, dt) {
  for (const plot of state.plots) {
    const t = plot.tower;
    if (!t) continue;
    const stats = towerStats(t.type, t.level);
    t.cooldown -= dt;
    const target = nearestInRange(state, t, stats);
    if (target) t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    if (target && t.cooldown <= 0) {
      t.cooldown = 1 / stats.rate;
      state.audio.shoot(t.type);
      if (t.type === 'spark') {
        // Lightning: instant hit on the target, then arcs to the nearest foes.
        let current = target;
        const hitSet = new Set();
        for (let i = 0; i < stats.chain && current; i++) {
          damageEnemy(state, current, stats.damage);
          if (current.dead) t.kills++;
          state.particles.arc(t.x, t.y, current.x, current.y, stats.color);
          hitSet.add(current);
          let next = null;
          for (const e of state.enemies) {
            if (e.dead || e.leaked || hitSet.has(e)) continue;
            if (dist(current.x, current.y, e.x, e.y) <= 130) {
              if (!next || e.travelled > next.travelled) next = e;
            }
          }
          current = next;
        }
      } else {
        state.projectiles.push({
          x: t.x, y: t.y - 14, target, speed: stats.projSpeed,
          damage: stats.damage, splash: stats.splash,
          slowPct: stats.slowPct, slowSecs: stats.slowSecs,
          color: stats.color, kind: t.type, dead: false,
        });
      }
    }
  }
}

export function updateProjectiles(state, dt) {
  for (const p of state.projectiles) {
    if (p.dead) continue;
    const tgt = p.target;
    if (!tgt || tgt.dead || tgt.leaked) { p.dead = true; continue; }
    const dx = tgt.x - p.x, dy = tgt.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const step = p.speed * dt;
    if (d <= step + tgt.r * 0.5) {
      p.dead = true;
      if (p.splash > 0) {
        for (const e of state.enemies) {
          if (e.dead || e.leaked) continue;
          if (dist(tgt.x, tgt.y, e.x, e.y) <= p.splash + e.r) {
            const before = e.hp;
            damageEnemy(state, e, e === tgt ? p.damage : Math.round(p.damage * 0.6));
            if (e.dead && before > 0) state.towerKills = (state.towerKills || 0) + 1;
          }
        }
        state.particles.burst(tgt.x, tgt.y, '#ff7a59', 12);
        state.shake = Math.min(10, state.shake + 2);
      } else {
        damageEnemy(state, tgt, p.damage);
        if (p.slowPct > 0) {
          tgt.slowUntil = state.time + p.slowSecs;
          tgt.slowPct = p.slowPct;
        }
        state.particles.burst(tgt.x, tgt.y, p.color, 4);
        state.audio.hit();
      }
    } else {
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.dead);
}
