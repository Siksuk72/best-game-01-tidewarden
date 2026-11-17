// Deterministic screenshot scenes: ?shot=start|play|boss|win (&seed=1).
// Each scene plays the real rules forward from a fresh seeded world for a fixed
// number of fixed 1/60s steps, so the same seed always gives the same frame.
// Sets window.__shotReady = true once the scene is fully drawn.
import { createState, startGame, startWave, tryBuild, tryUpgrade, useSurge, SCREEN_TITLE, SCREEN_WIN, SCREEN_OVER } from './world.js';
import { update } from './world.js';
import { draw } from './render.js';

const DT = 1 / 60;

// A competent-looking defence: towers on plots near the pier, mixed types.
const DEFENCE = [
  ['harpoon', 1], ['cannon', 2], ['frost', 4], ['harpoon', 5],
  ['storm', 6], ['lantern', 3], ['cannon', 7], ['harpoon', 0],
  ['tide', 9], ['frost', 11], ['harpoon', 10], ['storm', 12],
];

function step(state, seconds) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    update(state, DT);
    if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) break;
  }
}

function renderAndReady(ctx, state) {
  draw(ctx, state);
  window.__shotReady = true;
}

function buildDefence(state) {
  state.gold = 100000;
  for (const [type, plot] of DEFENCE) tryBuild(state, plot, type);
  for (const t of state.towers) {
    if ((t.type === 'harpoon' || t.type === 'cannon') && t.tier === 1) {
      state.gold = 100000;
      tryUpgrade(state, t);
    }
  }
  state.gold = 850; // a believable mid-game purse for the frame
}

export function runShot(ctx, shot, seed) {
  const state = createState(seed, { shotMode: shot });
  // Silent in shot mode: replace the audio engine with a no-op so no AudioContext is made.
  state.audio = new Proxy({}, { get: () => () => {} });
  state.best = 1240;

  if (shot === 'start') {
    state.screen = SCREEN_TITLE;
    state.time = 3.2;
    renderAndReady(ctx, state);
    return state;
  }

  startGame(state);
  buildDefence(state);

  if (shot === 'play') {
    // A busy mid-game battle: wave 22, where the horde is thick and tough enough
    // that the front pushes well onto the pier before the defence grinds it down.
    state.wave = 21;
    state.phase = 'build';
    state.buildTimer = 999;
    startWave(state, false); // now wave 22
    for (let i = 0; i < 22; i++) {
      step(state, 1);
      const lead = Math.max(0, ...state.enemies.map((e) => e.dist));
      if (state.enemies.length >= 12 && lead > 500) break;
    }
    useSurge(state); // a visible frost wash for drama
    step(state, 0.5);
    renderAndReady(ctx, state);
    return state;
  }

  if (shot === 'boss') {
    // Wave 10: the Drowned King. Simulate until he is well onto the pier
    // (mid-map, already taking fire) so the frame clearly shows the boss + HP bar.
    state.wave = 9;
    state.phase = 'build';
    state.buildTimer = 999;
    startWave(state, false); // now wave 10
    for (let i = 0; i < 70; i++) {
      step(state, 1);
      const king = state.enemies.find((e) => e.type === 'king');
      if (king && king.dist >= 800) break;
    }
    renderAndReady(ctx, state);
    return state;
  }

  if (shot === 'win') {
    state.wave = 30;
    state.kills = 486;
    state.goldEarned = 2840;
    state.towersBuilt = 12;
    state.playTime = 1185;
    state.gold = 850;
    // Banked gold converts to score at victory: 850g -> +85, so 9840 + 85.
    state.score = 9925;
    state.lives = 17;
    state.screen = SCREEN_WIN;
    state.stats = { stars: 3, kills: 486, goldEarned: 2840, towersBuilt: 12, time: 1185, score: 9925, lives: 17, goldBanked: 850, goldBonus: 85 };
    state.banner = null; // no intro banner over the victory panel
    state.time = 2;
    renderAndReady(ctx, state);
    return state;
  }

  // Unknown shot: title.
  state.screen = SCREEN_TITLE;
  renderAndReady(ctx, state);
  return state;
}
