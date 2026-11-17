// TIDEWARDEN — entry point. Fixed 60 Hz timestep, screen state machine, input wiring,
// deterministic ?shot= scenes. No network requests; all art and sound are generated in code.
import { W, H } from './config.js';
import { TOWER_ORDER, TOWERS } from './config.js';
import { createState, startGame, startWave, tryBuild, tryUpgrade, trySell, tryRepair, useSurge, useFlare, update, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_OVER, SCREEN_WIN } from './world.js';
import { draw, bottomRightButtons, playAgainRect } from './render.js';
import { createInput, plotAt, towerAt, towerBarSlot, abilityButtonRect, controlButtonRect, pointInRect } from './input.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed')) || 1;

const input = createInput(canvas);
const state = createState(seed);
try { state.best = Number(localStorage.getItem('tidewarden-best')) || 0; } catch { /* ignore */ }

if (shot) {
  // Deterministic screenshot mode: no wall clock, no audio, one fixed scene.
  window.__shotReady = false;
  runShot(ctx, shot, seed);
} else {
  requestAnimationFrame(loop);
}

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const frame = Math.min(0.25, (now - last) / 1000);
  last = now;
  handleInput();
  if (state.screen === SCREEN_PLAY && !state.paused) {
    acc += frame * state.speed;
    let guard = 0;
    while (acc >= STEP && guard < 8) {
      update(state, STEP);
      acc -= STEP;
      guard += 1;
    }
    if (guard >= 8) acc = 0;
  } else {
    // Title / pause / end screens still animate (water, lantern flicker).
    state.time += frame;
    state.particles.update(frame);
  }
  updateHover();
  draw(ctx, state);
}

function updateHover() {
  state.mouse.x = input.mouse.x;
  state.mouse.y = input.mouse.y;
  if (state.screen !== SCREEN_PLAY) { state.hoverPlot = null; state.hoverTower = null; return; }
  state.hoverPlot = input.mouse.x >= 0 ? plotAt(state, input.mouse.x, input.mouse.y) : null;
  if (state.hoverPlot === -1) state.hoverPlot = null;
  state.hoverTower = input.mouse.x >= 0 ? towerAt(state, input.mouse.x, input.mouse.y) : null;
}

function handleInput() {
  // Clicks.
  while (input.clickQueue.length > 0) {
    const p = input.clickQueue.shift();
    handleClick(p.x, p.y);
  }
  // Keys.
  while (input.keyQueue.length > 0) {
    const k = input.keyQueue.shift();
    handleKey(k);
  }
}

function handleClick(x, y) {
  state.audio.unlock();
  if (state.screen === SCREEN_TITLE) { startGame(state); return; }
  if (state.screen === SCREEN_OVER || state.screen === SCREEN_WIN) {
    if (pointInRect(x, y, playAgainRect())) restart();
    return;
  }
  if (state.screen === SCREEN_PAUSE) { state.paused = false; state.screen = SCREEN_PLAY; return; }
  if (state.screen !== SCREEN_PLAY) return;

  // Control buttons (top-right).
  if (pointInRect(x, y, controlButtonRect('speed'))) { state.speed = state.speed === 1 ? 2 : 1; return; }
  if (pointInRect(x, y, controlButtonRect('pause'))) { togglePause(); return; }
  if (pointInRect(x, y, controlButtonRect('mute'))) { toggleMute(); return; }

  // Ability buttons.
  if (pointInRect(x, y, abilityButtonRect('surge'))) { useSurge(state); return; }
  if (pointInRect(x, y, abilityButtonRect('flare'))) { useFlare(state); return; }

  // Bottom-right buttons (start wave / upgrade / sell / repair).
  for (const b of bottomRightButtons(state)) {
    if (pointInRect(x, y, b.rect)) {
      if (!b.enabled) return;
      if (b.id === 'startWave') startWave(state, true);
      else if (b.id === 'upgrade') tryUpgrade(state, state.selectedTower);
      else if (b.id === 'sell') trySell(state, state.selectedTower);
      else if (b.id === 'repair') tryRepair(state, state.selectedTower);
      return;
    }
  }

  // Tower bar.
  const slot = towerBarSlot(x, y);
  if (slot >= 0) {
    state.selectedTowerType = TOWER_ORDER[slot];
    state.selectedTower = null;
    return;
  }

  // A built tower: select it.
  const t = towerAt(state, x, y);
  if (t) { state.selectedTower = t; state.selectedPlot = null; return; }

  // An empty plot: build the selected tower type.
  const pi = plotAt(state, x, y);
  if (pi >= 0) {
    if (tryBuild(state, pi, state.selectedTowerType)) state.selectedPlot = pi;
    return;
  }

  // Clicked empty ground: deselect.
  state.selectedTower = null;
  state.selectedPlot = null;
}

function handleKey(k) {
  if (k === 'm') { toggleMute(); return; }
  if (k === 'p' || k === 'escape') {
    if (state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSE) togglePause();
    return;
  }
  if (state.screen === SCREEN_TITLE && (k === 'enter' || k === ' ')) { state.audio.unlock(); startGame(state); return; }
  if ((state.screen === SCREEN_OVER || state.screen === SCREEN_WIN) && (k === 'r' || k === 'enter')) { restart(); return; }
  if (k === 'r' && state.screen === SCREEN_PLAY) { restart(); return; }
  if (state.screen !== SCREEN_PLAY) return;
  if (k === ' ') { startWave(state, true); return; }
  if (k === 'f') { state.speed = state.speed === 1 ? 2 : 1; return; }
  if (k === 'q') { useSurge(state); return; }
  if (k === 'e') { useFlare(state); return; }
  const idx = ['1', '2', '3', '4', '5', '6'].indexOf(k);
  if (idx >= 0) { state.selectedTowerType = TOWER_ORDER[idx]; state.selectedTower = null; }
}

function togglePause() {
  state.paused = !state.paused;
  state.screen = state.paused ? SCREEN_PAUSE : SCREEN_PLAY;
}

function toggleMute() {
  state.muted = !state.muted;
  state.audio.setMuted(state.muted);
}

function restart() {
  const best = state.best;
  const fresh = createState(seed);
  fresh.best = best;
  fresh.muted = state.muted;
  fresh.audio.setMuted(state.muted);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  startGame(state);
}
