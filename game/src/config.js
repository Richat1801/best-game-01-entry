// Lumenkeep — configuration: canvas, path, build plots, tower and enemy definitions.
// Every number the game balances on lives here so tuning never touches logic.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// The road the gloom walks: from the western dark to the lighthouse keep.
export const PATH_POINTS = [
  { x: -40, y: 640 },
  { x: 240, y: 640 },
  { x: 240, y: 160 },
  { x: 480, y: 160 },
  { x: 480, y: 640 },
  { x: 760, y: 640 },
  { x: 760, y: 160 },
  { x: 1000, y: 160 },
  { x: 1000, y: 400 },
  { x: 1160, y: 400 },
];
export const PATH_WIDTH = 64;
export const KEEP = { x: 1160, y: 400, r: 46 };

// Grass plots where towers may be built. None of them sits on the road.
export const PLOTS = [
  { x: 120, y: 300 }, { x: 360, y: 300 }, { x: 600, y: 300 }, { x: 880, y: 300 },
  { x: 120, y: 520 }, { x: 360, y: 520 }, { x: 600, y: 520 }, { x: 880, y: 520 },
  { x: 360, y: 420 }, { x: 600, y: 420 }, { x: 880, y: 420 },
  { x: 1080, y: 300 }, { x: 1080, y: 560 }, { x: 120, y: 120 },
];

export const START_GOLD = 170;
export const START_KEEP_HP = 20;
export const MAX_WAVE = 12;
export const KILL_SCORE = 10;

// Towers: cost, range, damage, shots per second, projectile speed, extras.
export const TOWERS = {
  arrow: {
    name: 'Arrow Spire', key: '1', cost: 50, range: 135, damage: 14, rate: 2.0,
    projSpeed: 520, color: '#ffd166', desc: 'Fast bolts.',
  },
  frost: {
    name: 'Frost Lantern', key: '2', cost: 70, range: 125, damage: 5, rate: 1.1,
    projSpeed: 380, slowPct: 0.45, slowSecs: 1.6, color: '#7fe7ff',
    desc: 'Slows foes 45%.',
  },
  cannon: {
    name: 'Ember Mortar', key: '3', cost: 100, range: 155, damage: 34, rate: 0.6,
    projSpeed: 300, splash: 75, color: '#ff7a59', desc: 'Splash shells.',
  },
  spark: {
    name: 'Storm Coil', key: '4', cost: 140, range: 165, damage: 20, rate: 0.85,
    projSpeed: 900, chain: 3, color: '#c77dff', desc: 'Arcs to 3 foes.',
  },
};
export const TOWER_ORDER = ['arrow', 'frost', 'cannon', 'spark'];

// Upgrade multipliers per level (level 1 is the base tower).
export const UPGRADE = {
  2: { costMul: 0.8, dmgMul: 1.7, rangeMul: 1.12 },
  3: { costMul: 1.1, dmgMul: 2.6, rangeMul: 1.25 },
};
export const MAX_TOWER_LEVEL = 3;

// Enemies: base hp, speed (px/s), gold bounty, keep damage on leak, radius, color.
export const ENEMIES = {
  mite:    { name: 'Mite',    hp: 34,  speed: 58, gold: 6,  dmg: 1, r: 13, color: '#8d99ae' },
  runner:  { name: 'Runner',  hp: 26,  speed: 102, gold: 8, dmg: 1, r: 11, color: '#f4a261' },
  shell:   { name: 'Shellback', hp: 150, speed: 36, gold: 15, dmg: 2, r: 18, color: '#6c757d' },
  spitter: { name: 'Spitter', hp: 58,  speed: 48, gold: 12, dmg: 2, r: 14, color: '#90be6d' },
  wisp:    { name: 'Wisp',    hp: 44,  speed: 76, gold: 11, dmg: 1, r: 12, color: '#b5179e' },
  brute:   { name: 'Brute',   hp: 640, speed: 32, gold: 70, dmg: 5, r: 26, color: '#e63946' },
  titan:   { name: 'Gloom Titan', hp: 2600, speed: 27, gold: 400, dmg: 10, r: 38, color: '#3a0ca3' },
};
export const ENEMY_ORDER = ['mite', 'runner', 'shell', 'spitter', 'wisp', 'brute', 'titan'];

// HP grows with the wave so late waves stay threatening.
export function waveHpMul(wave) {
  return 1 + 0.22 * (wave - 1);
}
