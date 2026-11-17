// Game state: economy, wave flow, lives, abilities, selection, win/lose.
import {
  START_GOLD, START_LIVES, TOTAL_WAVES, BUILD_COUNTDOWN, EARLY_START_BONUS,
  PLOTS, TOWERS, ABILITIES,
} from './config.js';
import { makeRng } from './random.js';
import { makeEnemy, updateEnemies, damageEnemy, killEnemy } from './enemies.js';
import { makeTower, updateTowers, updateProjectiles, buildCost, upgradeCost, sellValue, repairCost } from './towers.js';
import { buildWave, waveClearBonus, bossHpForTier } from './waves.js';
import { Particles } from './particles.js';
import { AudioEngine } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createState(seed = 1, opts = {}) {
  const rng = makeRng(seed);
  return {
    seed, rng,
    screen: SCREEN_TITLE,
    time: 0,
    gold: START_GOLD,
    lives: START_LIVES,
    wave: 0,
    score: 0,
    kills: 0,
    goldEarned: 0,
    towersBuilt: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: new Particles(),
    audio: new AudioEngine(),
    phase: 'build', // 'build' | 'wave'
    buildTimer: BUILD_COUNTDOWN,
    spawnQueue: [],
    spawnTimer: 0,
    spawnIndex: 0,
    waveActive: false,
    selectedTowerType: 'harpoon',
    selectedTower: null,
    selectedPlot: null,
    hoverPlot: null,
    hoverTower: null,
    mouse: { x: 0, y: 0 },
    surgeCd: 0, surgeUntil: 0,
    flareCd: 0,
    speed: 1,
    paused: false,
    muted: false,
    banner: null, // { text, sub, until }
    waveStartTime: 0,
    playTime: 0,
    best: 0,
    shotMode: opts.shotMode || null,
    auto: opts.auto || false,
    stats: null,
    log: [],
  };
}

export function showBanner(state, text, sub, dur = 2.2) {
  state.banner = { text, sub: sub || '', until: state.time + dur };
}

export function startGame(state) {
  state.screen = SCREEN_PLAY;
  state.phase = 'build';
  state.buildTimer = BUILD_COUNTDOWN;
  state.wave = 0;
  showBanner(state, 'HOLD THE LAST HARBOR', 'Build towers on the stone plots — Space starts the wave', 3);
}

export function startWave(state, early = false) {
  if (state.phase === 'wave') return;
  state.wave += 1;
  state.phase = 'wave';
  state.waveActive = true;
  state.waveStartTime = state.time;
  state.spawnQueue = buildWave(state.wave);
  state.spawnIndex = 0;
  state.spawnTimer = 0.8;
  if (early) {
    state.gold += EARLY_START_BONUS;
    state.goldEarned += EARLY_START_BONUS;
    state.particles.floatText(640, 90, `+${EARLY_START_BONUS}g early start`, '#ffd166', 15);
  }
  const isBoss = state.wave % 10 === 0;
  showBanner(state, isBoss ? `WAVE ${state.wave} — THE DROWNED KING` : `WAVE ${state.wave}`, isBoss ? 'He rises from the deep. Hold the line!' : '', 2.4);
  state.audio.waveHorn();
  if (isBoss) state.audio.roar();
}

function waveCleared(state) {
  const bonus = waveClearBonus(state.wave);
  let income = bonus;
  for (const t of state.towers) {
    if (t.destroyed || t.type !== 'tide') continue;
    income += TOWERS.tide.tiers[t.tier - 1].income;
  }
  state.gold += income;
  state.goldEarned += income;
  state.score += 100 + state.wave * 10;
  state.phase = 'build';
  state.buildTimer = BUILD_COUNTDOWN;
  state.waveActive = false;
  state.particles.floatText(640, 110, `Wave clear +${income}g`, '#ffd166', 17);
  state.audio.coin();
  if (state.wave >= TOTAL_WAVES) {
    winGame(state);
    return;
  }
  showBanner(state, `WAVE ${state.wave} CLEARED`, `+${income}g — build, then Space for wave ${state.wave + 1}`, 2.2);
}

function winGame(state) {
  state.screen = SCREEN_WIN;
  const stars = state.lives >= 15 ? 3 : state.lives >= 8 ? 2 : 1;
  // Gold sink: unspent gold is not dead weight — banked gold converts to score
  // at victory, +1 per 10g, so a rich win scores better than a broke one.
  const goldBonus = Math.floor(state.gold / 10);
  state.score += goldBonus;
  state.stats = {
    stars, kills: state.kills, goldEarned: state.goldEarned,
    towersBuilt: state.towersBuilt, time: state.playTime, score: state.score, lives: state.lives,
    goldBanked: state.gold, goldBonus,
  };
  state.best = Math.max(state.best, state.score);
  try { localStorage.setItem('tidewarden-best', String(state.best)); } catch { /* storage unavailable */ }
  state.audio.victory();
}

function loseGame(state) {
  state.screen = SCREEN_OVER;
  state.stats = {
    kills: state.kills, goldEarned: state.goldEarned, towersBuilt: state.towersBuilt,
    time: state.playTime, score: state.score, wave: state.wave,
  };
  state.best = Math.max(state.best, state.score);
  try { localStorage.setItem('tidewarden-best', String(state.best)); } catch { /* storage unavailable */ }
  state.audio.defeat();
}

export function tryBuild(state, plotIndex, type) {
  const plot = PLOTS[plotIndex];
  if (!plot) return false;
  if (state.towers.some((t) => t.plot === plot && !t.destroyed)) return false;
  const cost = buildCost(type);
  if (state.gold < cost) return false;
  state.gold -= cost;
  const t = makeTower(type, plot);
  t.builtAt = state.time;
  state.towers.push(t);
  state.towersBuilt += 1;
  state.particles.burst(plot.x, plot.y, 14, '#ffd166', 120, 3, 60);
  state.audio.build();
  return true;
}

export function tryUpgrade(state, tower) {
  const cost = upgradeCost(tower);
  if (cost === null || state.gold < cost) return false;
  state.gold -= cost;
  tower.tier += 1;
  tower.maxHp += 60;
  tower.hp = tower.maxHp;
  state.particles.burst(tower.x, tower.y, 18, TOWERS[tower.type].color, 150, 3, 40);
  state.audio.upgrade();
  return true;
}

export function trySell(state, tower) {
  const val = sellValue(tower);
  state.gold += val;
  state.goldEarned += val;
  state.towers = state.towers.filter((t) => t !== tower);
  state.particles.floatText(tower.x, tower.y - 26, `+${val}g`, '#ffd166', 14);
  state.audio.sell();
  state.selectedTower = null;
  return val;
}

export function tryRepair(state, tower) {
  if (tower.destroyed) return false; // rubble can't be repaired — rebuild on the plot instead
  if (tower.hp >= tower.maxHp) return false;
  const cost = repairCost(tower);
  if (state.gold < cost) return false;
  state.gold -= cost;
  tower.hp = tower.maxHp;
  state.audio.build();
  return true;
}

export function useSurge(state) {
  if (state.surgeCd > 0 || state.screen !== SCREEN_PLAY) return false;
  state.surgeCd = ABILITIES.surge.cd;
  state.surgeUntil = state.time + ABILITIES.surge.dur;
  state.particles.burst(640, 360, 30, '#7fe7f2', 200, 3, 0);
  state.audio.surge();
  return true;
}

export function useFlare(state) {
  if (state.flareCd > 0 || state.screen !== SCREEN_PLAY) return false;
  state.flareCd = ABILITIES.flare.cd;
  const dmg = ABILITIES.flare.dmg + state.wave * 2;
  for (const e of [...state.enemies]) {
    if (e.dead || e.leaked) continue;
    state.particles.sparks(e.x, e.y, '#ff9f1c');
    damageEnemy(state, e, dmg, null);
  }
  state.particles.addShake(4);
  state.audio.flare();
  return true;
}

export function enemiesRemaining(state) {
  const alive = state.enemies.filter((e) => !e.dead && !e.leaked).length;
  return alive + (state.spawnQueue.length - state.spawnIndex);
}

export function update(state, dt) {
  if (state.screen !== SCREEN_PLAY) return;
  if (state.paused) return;
  state.time += dt;
  state.playTime += dt;
  state.surgeCd = Math.max(0, state.surgeCd - dt);
  state.flareCd = Math.max(0, state.flareCd - dt);

  if (state.phase === 'build') {
    state.buildTimer -= dt;
    if (state.buildTimer <= 0) startWave(state, false);
  }

  if (state.phase === 'wave') {
    state.spawnTimer -= dt;
    while (state.spawnIndex < state.spawnQueue.length && state.spawnTimer <= 0) {
      const s = state.spawnQueue[state.spawnIndex++];
      state.spawnTimer += s.delay;
      let hpMul = 1;
      if (s.type === 'king') hpMul = bossHpForTier(s.bossTier || 1) / 2600;
      const e = makeEnemy(s.type, state.wave, 0, hpMul);
      const p = { x: 1300, y: 130 };
      e.x = p.x; e.y = p.y;
      state.enemies.push(e);
      if (s.type === 'king') state.particles.addShake(6);
    }
    updateTowers(state, dt, state.rng);
    updateProjectiles(state, dt);
    const events = updateEnemies(state, dt, state.rng);
    for (const e of events.leaked) {
      state.lives -= e.def.lives;
      state.particles.addShake(7);
      state.particles.burst(104, 360, 20, '#ff5d5d', 160, 3, 60);
      state.particles.floatText(180, 330, `-${e.def.lives} ♥`, '#ff5d5d', 18);
      state.audio.leak();
      if (state.lives <= 0) {
        state.lives = 0;
        loseGame(state);
        return;
      }
    }
    // Remove finished enemies.
    state.enemies = state.enemies.filter((e) => !e.dead && !e.leaked);
    if (state.spawnIndex >= state.spawnQueue.length && state.enemies.length === 0 && state.waveActive) {
      waveCleared(state);
    }
  }

  state.particles.update(dt);
  if (!state.shotMode) state.audio.updateMusic(dt);
}
