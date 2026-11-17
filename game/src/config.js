// TIDEWARDEN — Hold the Last Harbor. Shared constants: canvas, map, towers, enemies, waves.
// All numbers are the single source of truth; world.js, towers.js, enemies.js and waves.js read them.

export const W = 1280;
export const H = 720;
export const TOP_BAR = 56;
export const BOTTOM_BAR = 96;
export const FIELD_TOP = TOP_BAR;
export const FIELD_BOTTOM = H - BOTTOM_BAR;

// The stone pier: sea gate (right) winds to the Harbor Heart (left).
export const PATH = [
  [1300, 130], [1060, 130], [1060, 320], [830, 320], [830, 560],
  [570, 560], [570, 200], [340, 200], [340, 420], [170, 420], [150, 360],
];
export const PATH_WIDTH = 64;
export const HEART = { x: 104, y: 360, r: 34 };

// Build plots beside the pier (14).
export const PLOTS = [
  { x: 1180, y: 240 }, { x: 950, y: 220 }, { x: 950, y: 440 }, { x: 1180, y: 440 },
  { x: 720, y: 230 }, { x: 720, y: 440 }, { x: 1150, y: 560 }, { x: 460, y: 300 },
  { x: 460, y: 500 }, { x: 660, y: 100 }, { x: 250, y: 100 }, { x: 250, y: 300 },
  { x: 250, y: 520 }, { x: 430, y: 590 },
];

export const START_GOLD = 200;
export const START_LIVES = 20;
export const TOTAL_WAVES = 30;
export const BUILD_COUNTDOWN = 18; // seconds of build phase before a wave auto-starts
export const EARLY_START_BONUS = 10;
export const SELL_REFUND = 0.7;
export const REPAIR_COST_FRAC = 0.25;

// Towers: id, name, cost, upgrade costs (tier 2, tier 3), colour, per-tier stats.
export const TOWERS = {
  harpoon: {
    name: 'Harpoon', cost: 50, up: [75, 125], color: '#ffd166', desc: 'Fast, long range',
    tiers: [
      { dmg: 12, range: 170, rate: 2.2, projSpeed: 540 },
      { dmg: 20, range: 190, rate: 2.6, projSpeed: 580 },
      { dmg: 34, range: 215, rate: 3.1, projSpeed: 640 },
    ],
  },
  cannon: {
    name: 'Cannon', cost: 100, up: [150, 250], color: '#ff7f51', desc: 'Splash damage',
    tiers: [
      { dmg: 26, range: 150, rate: 0.7, splash: 55 },
      { dmg: 44, range: 165, rate: 0.75, splash: 65 },
      { dmg: 75, range: 185, rate: 0.85, splash: 82 },
    ],
  },
  frost: {
    name: 'Frost Spire', cost: 80, up: [120, 200], color: '#7fe7f2', desc: 'Chills enemies',
    tiers: [
      { dmg: 4, range: 130, rate: 2.0, slow: 0.35, slowDur: 1.2 },
      { dmg: 8, range: 150, rate: 2.0, slow: 0.45, slowDur: 1.4 },
      { dmg: 14, range: 175, rate: 2.2, slow: 0.55, slowDur: 1.6 },
    ],
  },
  tide: {
    name: 'Tide Mill', cost: 60, up: [90, 150], color: '#4ecdc4', desc: '+gold per wave',
    tiers: [
      { dmg: 0, range: 0, rate: 0, income: 12 },
      { dmg: 0, range: 0, rate: 0, income: 20 },
      { dmg: 0, range: 0, rate: 0, income: 30 },
    ],
  },
  storm: {
    name: 'Storm Caller', cost: 160, up: [240, 400], color: '#b388ff', desc: 'Chain lightning',
    tiers: [
      { dmg: 18, range: 190, rate: 0.8, chains: 3 },
      { dmg: 32, range: 210, rate: 0.85, chains: 4 },
      { dmg: 55, range: 235, rate: 0.9, chains: 5 },
    ],
  },
  lantern: {
    name: 'Lantern', cost: 90, up: [135, 225], color: '#ffb703', desc: 'Buffs nearby towers',
    tiers: [
      { dmg: 0, range: 130, rate: 0, dmgBuff: 0.25, rangeBuff: 0.15 },
      { dmg: 0, range: 150, rate: 0, dmgBuff: 0.35, rangeBuff: 0.20 },
      { dmg: 0, range: 175, rate: 0, dmgBuff: 0.50, rangeBuff: 0.25 },
    ],
  },
};
export const TOWER_ORDER = ['harpoon', 'cannon', 'frost', 'tide', 'storm', 'lantern'];

// Enemies: hp is base at wave 1; waves.js scales it. speed in px/s.
export const ENEMIES = {
  crab:   { name: 'Skitter Crab', hp: 30,  speed: 96,  gold: 4,  lives: 1, r: 12, color: '#ff8c69', slowImmune: false },
  eel:    { name: 'Mire Eel',     hp: 58,  speed: 112, gold: 6,  lives: 1, r: 12, color: '#7bd88a', slowImmune: false },
  brute:  { name: 'Shell Brute',  hp: 230, speed: 46,  gold: 10, lives: 2, r: 18, color: '#c98f5f', slowImmune: false },
  spitter:{ name: 'Spitter',      hp: 95,  speed: 62,  gold: 9,  lives: 1, r: 13, color: '#d16ba5', slowImmune: false, range: 150, shootCd: 2.0, shotDmg: 10 },
  jelly:  { name: 'Dusk Jelly',   hp: 75,  speed: 72,  gold: 7,  lives: 1, r: 14, color: '#9b7ede', slowImmune: false, splits: true },
  jellyMini: { name: 'Jellylet',  hp: 22,  speed: 92,  gold: 2,  lives: 1, r: 8,  color: '#b9a5ec', slowImmune: false },
  ghost:  { name: 'Tide Ghost',   hp: 48,  speed: 132, gold: 8,  lives: 1, r: 12, color: '#cfe8ff', slowImmune: true },
  hulk:   { name: 'Barnacle Hulk',hp: 720, speed: 30,  gold: 18, lives: 3, r: 22, color: '#8a9a5b', slowImmune: false },
  king:   { name: 'Drowned King', hp: 2600,speed: 26,  gold: 150,lives: 5, r: 30, color: '#3ec1d3', slowImmune: false },
  kingling:{ name: 'Drowned Thrall', hp: 60, speed: 80, gold: 5, lives: 1, r: 10, color: '#5ec8d8', slowImmune: false },
};

export const ABILITIES = {
  surge: { key: 'q', name: 'Tide Surge', cd: 25, dur: 4, slow: 0.5, desc: 'Slow all 50% · 4s' },
  flare: { key: 'e', name: 'Flare Volley', cd: 35, dmg: 70, desc: 'Hit all on screen' },
};

export const PALETTE = {
  seaDeep: '#062a33', sea: '#0a3d4a', seaLight: '#0f5566', pier: '#8d7d6b', pierEdge: '#6b5d4f',
  sand: '#c9b18c', gold: '#ffd166', lantern: '#ffb703', coral: '#ff7f51', teal: '#2ec4b6',
  frost: '#7fe7f2', ink: '#eaf6f6', dim: '#9fc3c9', danger: '#ff5d5d', heart: '#ffe9a8',
};
