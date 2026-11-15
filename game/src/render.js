// Rendering: one canvas, drawn in layers — night sky, road, keep, plots,
// towers, enemies, projectiles, particles, HUD, panels and screens.
// No images: every sprite is canvas vector art in a single coherent palette
// (deep indigo night, amber lamplight, teal grass).

import { VIEW_W, VIEW_H, PATH_POINTS, PATH_WIDTH, KEEP, TOWERS, TOWER_ORDER, MAX_WAVE } from './config.js';
import { hudButtons, buildBarRects, titleButtons, endButtons, towerPanelRect, HUD_H, BAR_H } from './ui.js';
import { towerStats, upgradeCost, sellValue } from './towers.js';
import { ENEMIES } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(ctx, r, label, opts) {
  const o = opts || {};
  ctx.save();
  ctx.fillStyle = o.bg || '#2a3a5f';
  ctx.strokeStyle = o.border || '#4a5f8f';
  ctx.lineWidth = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = o.fg || '#f8f9fa';
  ctx.font = 'bold ' + (o.size || 15) + 'px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.restore();
}

function drawPath(ctx) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  PATH_POINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = '#3d2f1d';
  ctx.lineWidth = PATH_WIDTH + 10;
  ctx.stroke();
  ctx.strokeStyle = '#6b5326';
  ctx.lineWidth = PATH_WIDTH;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 18]);
  ctx.stroke();
  ctx.restore();
}

function drawKeep(ctx, state) {
  const k = KEEP;
  const beamAngle = state.time * 0.7;
  ctx.save();
  // Rotating light beam.
  ctx.translate(k.x, k.y);
  ctx.rotate(beamAngle);
  const grad = ctx.createLinearGradient(0, 0, 190, 0);
  grad.addColorStop(0, 'rgba(255, 225, 130, 0.55)');
  grad.addColorStop(1, 'rgba(255, 225, 130, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(190, -52);
  ctx.lineTo(190, 52);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(Math.PI);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(190, -52);
  ctx.lineTo(190, 52);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  // Glow halo + stone tower + lamp room.
  const halo = ctx.createRadialGradient(k.x, k.y - 20, 8, k.x, k.y - 20, 110);
  halo.addColorStop(0, 'rgba(255, 209, 102, 0.35)');
  halo.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(k.x, k.y - 20, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d7b68';
  ctx.strokeStyle = '#5c4f42';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(k.x - 26, k.y + 34);
  ctx.lineTo(k.x - 18, k.y - 34);
  ctx.lineTo(k.x + 18, k.y - 34);
  ctx.lineTo(k.x + 26, k.y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(k.x, k.y - 42, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c4f42';
  ctx.stroke();
  ctx.fillStyle = '#343a40';
  ctx.beginPath();
  ctx.moveTo(k.x - 18, k.y - 56);
  ctx.lineTo(k.x, k.y - 70);
  ctx.lineTo(k.x + 18, k.y - 56);
  ctx.closePath();
  ctx.fill();
  // Keep HP ring.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = state.keepHp <= 5 ? '#ff6b6b' : '#80ed99';
  ctx.beginPath();
  ctx.arc(k.x, k.y, k.r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * state.keepHp) / state.maxKeepHp);
  ctx.stroke();
  ctx.restore();
}

function drawTowerShape(ctx, x, y, type, level, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  // Stone base.
  ctx.fillStyle = '#495057';
  ctx.strokeStyle = '#343a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  if (type === 'arrow') {
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#343a40';
    ctx.fill();
  } else if (type === 'frost') {
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0fbfc';
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-14, 6, 28, 5);
  } else if (type === 'cannon') {
    ctx.rotate(angle);
    ctx.fillRect(0, -6, 26, 12);
    ctx.fillStyle = '#343a40';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Storm coil: stacked rings + sparking tip.
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 4 - i * 8, 12 - i * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -20, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Level pips.
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < level; i++) {
    ctx.beginPath();
    ctx.arc(-10 + i * 10, 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(ctx, e, time) {
  ctx.save();
  const wob = Math.sin(time * 6 + e.wobble) * 2;
  ctx.translate(e.x, e.y + wob * 0.4);
  const slowed = time < e.slowUntil;
  // Shadow blob body.
  ctx.fillStyle = e.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (e.type === 'shell') {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, e.r - 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (e.type === 'titan') {
    ctx.fillStyle = '#ffd166';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14 - 6, -e.r + 4);
      ctx.lineTo(i * 14, -e.r - 12);
      ctx.lineTo(i * 14 + 6, -e.r + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Eyes.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-e.r * 0.35, -e.r * 0.2, Math.max(3, e.r * 0.2), 0, Math.PI * 2);
  ctx.arc(e.r * 0.35, -e.r * 0.2, Math.max(3, e.r * 0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(-e.r * 0.35 + 2, -e.r * 0.2, Math.max(1.5, e.r * 0.1), 0, Math.PI * 2);
  ctx.arc(e.r * 0.35 + 2, -e.r * 0.2, Math.max(1.5, e.r * 0.1), 0, Math.PI * 2);
  ctx.fill();
  if (slowed) {
    ctx.strokeStyle = '#7fe7ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (e.flash > 0) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // HP bar.
  if (e.hp < e.maxHp) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-w / 2, -e.r - 10, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#80ed99' : e.hp / e.maxHp > 0.25 ? '#ffd166' : '#ff6b6b';
    ctx.fillRect(-w / 2, -e.r - 10, w * (e.hp / e.maxHp), 5);
  }
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 32, 0.92)';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = '#2a3a5f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(VIEW_W, HUD_H);
  ctx.stroke();
  ctx.fillStyle = '#f8f9fa';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🪙 ' + state.gold, 18, HUD_H / 2);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('★ ' + state.score, 150, HUD_H / 2);
  ctx.fillStyle = '#7fe7ff';
  ctx.fillText('WAVE ' + Math.max(1, state.wave) + '/' + MAX_WAVE, 280, HUD_H / 2);
  ctx.fillStyle = state.keepHp <= 5 ? '#ff6b6b' : '#80ed99';
  ctx.fillText('♥ KEEP ' + state.keepHp + '/' + state.maxKeepHp, 420, HUD_H / 2);
  ctx.fillStyle = '#adb5bd';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Kills ' + state.kills, 580, HUD_H / 2);
  if (!state.waveActive && state.screen === 'playing') {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press SPACE for the next wave', 700, HUD_H / 2);
  }
  const hb = hudButtons(state);
  drawButton(ctx, hb.startWave, hb.startWave.label, {
    bg: state.waveActive ? '#3a4a6b' : '#b58900', border: '#ffd166', size: 14,
  });
  drawButton(ctx, hb.speed, hb.speed.label, { size: 14 });
  drawButton(ctx, hb.pause, hb.pause.label, { size: 14 });
  drawButton(ctx, hb.mute, hb.mute.label, { size: 14 });
  ctx.restore();
}

function drawBuildBar(ctx, state) {
  ctx.save();
  const y0 = VIEW_H - BAR_H;
  ctx.fillStyle = 'rgba(10, 14, 32, 0.92)';
  ctx.fillRect(0, y0, VIEW_W, BAR_H);
  ctx.strokeStyle = '#2a3a5f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y0);
  ctx.lineTo(VIEW_W, y0);
  ctx.stroke();
  ctx.fillStyle = '#adb5bd';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUILD  —  click a tower, then a glowing plot  (keys 1–4)', 24, y0 + 9);
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'right';
  ctx.fillText('Sell refunds 70%  ·  Upgrades to level 3', VIEW_W - 24, y0 + 9);
  ctx.textAlign = 'left';
  const bar = buildBarRects();
  for (const type of TOWER_ORDER) {
    const def = TOWERS[type];
    const r = bar[type];
    const afford = state.gold >= def.cost;
    const selected = state.buildType === type;
    ctx.fillStyle = selected ? '#4a3a10' : '#1d2742';
    ctx.strokeStyle = selected ? '#ffd166' : afford ? '#4a5f8f' : '#333333';
    ctx.lineWidth = selected ? 3 : 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.stroke();
    drawTowerShape(ctx, r.x + 26, r.y + 34, type, 1, -Math.PI / 2, def.color);
    ctx.fillStyle = afford ? '#f8f9fa' : '#6c757d';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(def.name, r.x + 54, r.y + 16);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('🪙 ' + def.cost, r.x + 54, r.y + 36);
    ctx.fillStyle = '#adb5bd';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(def.desc, r.x + 54, r.y + 56);
  }
  ctx.restore();
}

function drawTowerPanel(ctx, state) {
  const panel = towerPanelRect(state);
  if (!panel || !state.selectedTower) return;
  const t = state.selectedTower;
  const stats = towerStats(t.type, t.level);
  const def = TOWERS[t.type];
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 32, 0.95)';
  ctx.strokeStyle = '#4a5f8f';
  ctx.lineWidth = 2;
  roundRect(ctx, panel.box.x, panel.box.y, panel.box.w, panel.box.h, 10);
  ctx.fill();
  ctx.stroke();
  drawTowerShape(ctx, panel.box.x + 34, panel.box.y + 40, t.type, t.level, t.angle, def.color);
  ctx.fillStyle = '#f8f9fa';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.name + '  Lv ' + t.level, panel.box.x + 62, panel.box.y + 30);
  ctx.fillStyle = '#adb5bd';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Damage ' + stats.damage + '   Range ' + stats.range, panel.box.x + 16, panel.box.y + 78);
  ctx.fillText('Rate ' + stats.rate.toFixed(1) + '/s' + (stats.splash ? '   Splash ' + stats.splash : '') + (stats.chain ? '   Chains ' + stats.chain : '') + (stats.slowPct ? '   Slows ' + Math.round(stats.slowPct * 100) + '%' : ''), panel.box.x + 16, panel.box.y + 102);
  ctx.fillText('Kills by this tower: ' + t.kills, panel.box.x + 16, panel.box.y + 126);
  const upCost = upgradeCost(t.type, t.level);
  drawButton(ctx, panel.upgrade, upCost === null ? 'MAX LEVEL' : 'UPGRADE 🪙' + upCost, {
    bg: upCost !== null && state.gold >= upCost ? '#1b6b3a' : '#3a4a6b', size: 13,
  });
  drawButton(ctx, panel.sell, 'SELL 🪙' + sellValue(t), { bg: '#6b3a1b', size: 13 });
  drawButton(ctx, panel.close, '✕', { bg: '#3a4a6b', size: 13 });
  ctx.restore();
}

function drawBanner(ctx, state) {
  if (state.bannerUntil <= state.time || !state.bannerText) return;
  const alpha = Math.min(1, (state.bannerUntil - state.time) * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 18;
  ctx.fillText(state.bannerText, VIEW_W / 2, 220);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#f8f9fa';
  ctx.fillText(state.bannerSub || '', VIEW_W / 2, 268);
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.shadowColor = '#ffb703';
  ctx.shadowBlur = 30;
  ctx.fillText('LUMENKEEP', VIEW_W / 2, 180);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f8f9fa';
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('Hold the last lighthouse against the gloom.', VIEW_W / 2, 238);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#ced4da';
  const lines = [
    'GOAL: Survive all 12 waves. If the gloom reaches the keep, it loses light — at 0, the night wins.',
    'BUILD: Click a tower below, then a glowing plot. Towers earn gold for every foe they fell.',
    'UPGRADE: Click a tower to upgrade it to level 3 or sell it back for 70%.',
    'FOES: 7 kinds — fast Runners, armoured Shellbacks, slowing Wisps, and the Gloom Titan on wave 12.',
    'CONTROLS: Mouse to build · 1–4 pick a tower · SPACE starts the next wave · F fast-forward · P pause · M mute',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 300 + i * 32));
  const b = titleButtons();
  drawButton(ctx, b.play, '▶  PLAY — DEFEND THE LIGHT', { bg: '#b58900', border: '#ffd166', size: 20 });
  drawButton(ctx, b.rules, state.showRules ? 'HIDE TOWER GUIDE ▲' : 'TOWER GUIDE ▼', { size: 14 });
  if (state.showRules) {
    ctx.fillStyle = '#e9ecef';
    ctx.font = '15px system-ui, sans-serif';
    const guide = [
      'Arrow Spire (50g) — fast bolts, your workhorse.   Frost Lantern (70g) — slows the horde 45%.',
      'Ember Mortar (100g) — splash shells for packed roads.   Storm Coil (140g) — lightning arcs to 3 foes.',
      'Tip: Frost + Mortar together shred packed waves. Save gold before waves 6 and 12 — the Brutes and the Titan are coming.',
    ];
    guide.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 660 + i * 26));
  }
  if (state.best > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('BEST SCORE: ' + state.best, VIEW_W / 2, 748);
  }
  ctx.restore();
}

function drawEnd(ctx, state) {
  const win = state.screen === 'victory';
  ctx.save();
  ctx.fillStyle = win ? 'rgba(6, 22, 12, 0.78)' : 'rgba(22, 6, 10, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = win ? '#80ed99' : '#ff6b6b';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(win ? 'THE LIGHT HOLDS!' : 'THE LIGHT WENT OUT', VIEW_W / 2, 220);
  ctx.fillStyle = '#f8f9fa';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(
    win ? 'Twelve waves broken against the keep. Dawn returns to the valley.' : 'The gloom swallowed the lighthouse on wave ' + state.wave + '.',
    VIEW_W / 2, 280,
  );
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#ced4da';
  const stats = [
    'SCORE  ' + state.score + '      (best ' + Math.max(state.best, state.score) + ')',
    'WAVES CLEARED  ' + (win ? 12 : state.wave - 1) + ' / 12      FOES FELLED  ' + state.kills,
    'GOLD EARNED  ' + state.goldEarned + '      KEEP LIGHT  ' + Math.max(0, state.keepHp) + '/' + state.maxKeepHp,
  ];
  stats.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 350 + i * 38));
  const b = endButtons();
  drawButton(ctx, b.again, '↻  PLAY AGAIN', { bg: '#b58900', border: '#ffd166', size: 20 });
  ctx.fillStyle = '#adb5bd';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('or press R to restart', VIEW_W / 2, 648);
  ctx.restore();
}

export function draw(ctx, state) {
  ctx.save();
  if (state.shake > 0.3) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  // Night sky + stars.
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#0b1026');
  sky.addColorStop(0.6, '#16233f');
  sky.addColorStop(1, '#1d3a2f');
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const s of state.stars) {
    ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(state.time * 0.8 + s.tw));
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
  // Moon.
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.arc(1120, 84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dee2e6';
  ctx.beginPath();
  ctx.arc(1108, 76, 8, 0, Math.PI * 2);
  ctx.arc(1132, 92, 6, 0, Math.PI * 2);
  ctx.fill();
  // Grass tufts.
  ctx.fillStyle = 'rgba(128, 237, 153, 0.16)';
  for (const g of state.grass) {
    ctx.fillRect(g.x, g.y, 2, 7);
    ctx.fillRect(g.x + 3, g.y + 1, 2, 6);
  }
  drawPath(ctx);
  // Build plots.
  for (const p of state.plots) {
    ctx.save();
    ctx.fillStyle = p.tower ? '#3a4a3a' : 'rgba(255, 209, 102, 0.14)';
    ctx.strokeStyle = p.tower ? '#5c6b52' : 'rgba(255, 209, 102, 0.55)';
    ctx.setLineDash(p.tower ? [] : [6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  drawKeep(ctx, state);
  // Towers + range preview.
  if (state.selectedTower) {
    const stats = towerStats(state.selectedTower.type, state.selectedTower.level);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
    ctx.beginPath();
    ctx.arc(state.selectedTower.x, state.selectedTower.y, stats.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const p of state.plots) {
    if (p.tower) drawTowerShape(ctx, p.x, p.y, p.tower.type, p.tower.level, p.tower.angle, TOWERS[p.tower.type].color);
  }
  for (const e of state.enemies) drawEnemy(ctx, e, state.time);
  // Projectiles.
  ctx.save();
  for (const pr of state.projectiles) {
    ctx.fillStyle = pr.color;
    ctx.shadowColor = pr.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.kind === 'cannon' ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  state.particles.draw(ctx);
  drawHud(ctx, state);
  if (state.screen === 'playing' || state.screen === 'paused') drawBuildBar(ctx, state);
  drawTowerPanel(ctx, state);
  drawBanner(ctx, state);
  if (state.screen === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 8, 22, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = '#ced4da';
    ctx.fillText('Press P to resume · the gloom waits for no one', VIEW_W / 2, VIEW_H / 2 + 34);
    ctx.restore();
  }
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'victory' || state.screen === 'defeat') drawEnd(ctx, state);
  if (state.flashRed > 0) {
    ctx.fillStyle = 'rgba(230, 57, 70, ' + (state.flashRed * 0.5) + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }
  ctx.restore();
}
