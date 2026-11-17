// Mouse + keyboard input: hover picking, clicks, hotkeys. All coordinates are canvas pixels.
import { PLOTS, TOWER_ORDER, W, H, TOP_BAR, BOTTOM_BAR } from './config.js';

export function createInput(canvas) {
  const input = {
    mouse: { x: -1, y: -1, down: false },
    keys: new Set(),
    clickQueue: [],
    keyQueue: [],
  };
  const toCanvas = (ev) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (ev.clientX - rect.left) * (canvas.width / rect.width), y: (ev.clientY - rect.top) * (canvas.height / rect.height) };
  };
  canvas.addEventListener('mousemove', (ev) => { const p = toCanvas(ev); input.mouse.x = p.x; input.mouse.y = p.y; });
  canvas.addEventListener('mousedown', (ev) => { const p = toCanvas(ev); input.mouse.x = p.x; input.mouse.y = p.y; input.mouse.down = true; input.clickQueue.push(p); });
  canvas.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('mouseleave', () => { input.mouse.x = -1; input.mouse.y = -1; });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = ev.key.toLowerCase();
    input.keys.add(k);
    input.keyQueue.push(k);
    if (k === ' ' || k.startsWith('arrow')) ev.preventDefault();
  });
  window.addEventListener('keyup', (ev) => input.keys.delete(ev.key.toLowerCase()));
  return input;
}

export function plotAt(state, x, y) {
  for (let i = 0; i < PLOTS.length; i++) {
    const p = PLOTS[i];
    if (Math.hypot(p.x - x, p.y - y) <= 30) return i;
  }
  return -1;
}

export function towerAt(state, x, y) {
  for (const t of state.towers) {
    if (t.destroyed) continue;
    if (Math.hypot(t.x - x, t.y - y) <= 30) return t;
  }
  return null;
}

// Tower-bar slots (bottom bar): 6 slots starting at x=20, 120px wide, 76px tall.
export function towerBarSlot(x, y) {
  if (y < H - BOTTOM_BAR + 10 || y > H - 10) return -1;
  const i = Math.floor((x - 20) / 120);
  return i >= 0 && i < TOWER_ORDER.length ? i : -1;
}

export function towerBarRect(i) {
  return { x: 20 + i * 120, y: H - BOTTOM_BAR + 10, w: 110, h: 76 };
}

export function abilityButtonRect(which) {
  // Right side of the bottom bar.
  const x = which === 'surge' ? 790 : 920;
  return { x, y: H - BOTTOM_BAR + 10, w: 120, h: 76 };
}

export function controlButtonRect(which) {
  // Top-right of the top bar: speed, pause, mute.
  const x = which === 'speed' ? 1060 : which === 'pause' ? 1130 : 1200;
  return { x, y: 8, w: 56, h: 40 };
}

export function pointInRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
