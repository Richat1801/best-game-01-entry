// Input: mouse clicks and keyboard, mapped onto the game's buttons,
// build bar, plots and panels. All hit rectangles live here so the
// renderer and the input code can never disagree about where a button is.

import { TOWERS, TOWER_ORDER, VIEW_W, VIEW_H } from './config.js';
import { placeTower, upgradeTower, sellTower, upgradeCost, sellValue, towerStats } from './towers.js';

export const HUD_H = 56;
export const BAR_H = 96;

export function hudButtons(state) {
  const y = 10;
  return {
    startWave: { x: VIEW_W - 330, y, w: 150, h: 36, label: state.waveActive ? 'WAVE ' + state.wave + '/12' : (state.wave >= 12 ? 'FINAL WAVE' : 'START WAVE ' + (state.wave + 1)) },
    speed: { x: VIEW_W - 168, y, w: 52, h: 36, label: state.speedMul === 2 ? '2x' : '1x' },
    pause: { x: VIEW_W - 108, y, w: 48, h: 36, label: state.screen === 'paused' ? '▶' : 'II' },
    mute: { x: VIEW_W - 52, y, w: 42, h: 36, label: state.audio.muted ? '🔇' : '🔊' },
  };
}

export function buildBarRects() {
  const y = VIEW_H - BAR_H + 20;
  const rects = {};
  TOWER_ORDER.forEach((type, i) => {
    rects[type] = { x: 24 + i * 172, y, w: 160, h: 68 };
  });
  return rects;
}

export function titleButtons() {
  return {
    play: { x: VIEW_W / 2 - 130, y: 520, w: 260, h: 64 },
    rules: { x: VIEW_W / 2 - 130, y: 598, w: 260, h: 44 },
  };
}

export function endButtons() {
  return { again: { x: VIEW_W / 2 - 130, y: 560, w: 260, h: 60 } };
}

export function towerPanelRect(state) {
  if (!state.selectedTower) return null;
  const x = VIEW_W - 292, y = HUD_H + 14, w = 268, h = 218;
  return {
    box: { x, y, w, h },
    upgrade: { x: x + 14, y: y + 150, w: 118, h: 40 },
    sell: { x: x + 140, y: y + 150, w: 114, h: 40 },
    close: { x: x + w - 34, y: y + 8, w: 26, h: 26 },
  };
}

function inside(px, py, r) {
  return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

export function handleClick(state, px, py) {
  state.audio.ensure();
  if (state.screen === 'title') {
    const b = titleButtons();
    if (inside(px, py, b.play)) { state.startGame(); return; }
    if (inside(px, py, b.rules)) { state.showRules = !state.showRules; return; }
    return;
  }
  if (state.screen === 'victory' || state.screen === 'defeat') {
    if (inside(px, py, endButtons().again)) state.reset();
    return;
  }
  if (state.screen !== 'playing' && state.screen !== 'paused') return;

  const hb = hudButtons(state);
  if (inside(px, py, hb.startWave)) { state.startNextWave(); return; }
  if (inside(px, py, hb.speed)) { state.speedMul = state.speedMul === 1 ? 2 : 1; return; }
  if (inside(px, py, hb.pause)) {
    state.screen = state.screen === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (inside(px, py, hb.mute)) { state.audio.toggleMute(); return; }

  const panel = towerPanelRect(state);
  if (panel && state.selectedTower) {
    if (inside(px, py, panel.close)) { state.selectedTower = null; return; }
    if (inside(px, py, panel.upgrade)) { upgradeTower(state, state.selectedTower); return; }
    if (inside(px, py, panel.sell)) { sellTower(state, state.selectedTower); state.selectedTower = null; return; }
    if (inside(px, py, panel.box)) return;
  }

  const bar = buildBarRects();
  for (const type of TOWER_ORDER) {
    if (inside(px, py, bar[type])) {
      state.buildType = state.buildType === type ? null : type;
      state.selectedTower = null;
      return;
    }
  }

  // Plots: build with the chosen tower, or select the tower standing there.
  for (let i = 0; i < state.plots.length; i++) {
    const p = state.plots[i];
    const dx = px - p.x, dy = py - p.y;
    if (dx * dx + dy * dy <= 34 * 34) {
      if (p.tower) {
        state.selectedTower = p.tower;
        state.buildType = null;
      } else if (state.buildType) {
        if (placeTower(state, i, state.buildType)) state.buildType = null;
        else state.particles.text(p.x, p.y - 30, 'NOT ENOUGH GOLD', '#ff6b6b');
      }
      return;
    }
  }
  state.selectedTower = null;
}

export function handleKey(state, key) {
  if (key === 'm' || key === 'M') { state.audio.toggleMute(); return; }
  if (state.screen === 'title') {
    if (key === 'Enter' || key === ' ') state.startGame();
    return;
  }
  if (state.screen === 'victory' || state.screen === 'defeat') {
    if (key === 'Enter' || key === 'r' || key === 'R') state.reset();
    return;
  }
  if (key === 'p' || key === 'P') {
    state.screen = state.screen === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (state.screen === 'paused') return;
  if (key === ' ') { state.startNextWave(); return; }
  if (key === 'f' || key === 'F') { state.speedMul = state.speedMul === 1 ? 2 : 1; return; }
  if (key === 'Escape') { state.selectedTower = null; state.buildType = null; return; }
  const idx = TOWER_ORDER.findIndex((t) => TOWERS[t].key === key);
  if (idx >= 0) {
    const type = TOWER_ORDER[idx];
    state.buildType = state.buildType === type ? null : type;
    state.selectedTower = null;
  }
}

export { upgradeCost, sellValue, towerStats };
