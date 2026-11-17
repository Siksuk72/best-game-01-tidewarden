// All canvas drawing: harbor map, towers, enemies, HUD, banners and screens.
import { W, H, TOP_BAR, BOTTOM_BAR, PATH, PATH_WIDTH, HEART, PLOTS, TOWERS, TOWER_ORDER, ABILITIES, PALETTE, TOTAL_WAVES } from './config.js';
import { towerStats, upgradeCost, sellValue, repairCost, lanternBuff } from './towers.js';
import { enemiesRemaining } from './world.js';
import { bossName } from './waves.js';
import { towerBarRect, abilityButtonRect, controlButtonRect, pointInRect } from './input.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function draw(ctx, state) {
  ctx.clearRect(0, 0, W, H);
  const off = state.particles.shakeOffset();
  ctx.save();
  ctx.translate(off.x, off.y);
  drawSea(ctx, state);
  drawPier(ctx, state);
  drawHeart(ctx, state);
  drawPlots(ctx, state);
  drawTowers(ctx, state);
  drawEnemies(ctx, state);
  drawProjectiles(ctx, state);
  state.particles.draw(ctx);
  ctx.restore();
  drawHUD(ctx, state);
  drawBanner(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (state.screen === SCREEN_PAUSE) drawPause(ctx, state);
  else if (state.screen === SCREEN_OVER) drawGameOver(ctx, state);
  else if (state.screen === SCREEN_WIN) drawVictory(ctx, state);
  if (state.selectedTower && state.screen === SCREEN_PLAY) drawTowerInfo(ctx, state);
}

// ---- Map -----------------------------------------------------------------

function drawSea(ctx, state) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a3d4a');
  g.addColorStop(0.55, '#083038');
  g.addColorStop(1, '#062a33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Dusk sky glow on the right (sea gate) and gentle wave lines.
  const glow = ctx.createRadialGradient(1280, 130, 10, 1280, 130, 420);
  glow.addColorStop(0, 'rgba(255, 150, 80, 0.28)');
  glow.addColorStop(1, 'rgba(255, 150, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(800, 0, 480, 520);
  ctx.strokeStyle = 'rgba(127, 231, 242, 0.10)';
  ctx.lineWidth = 2;
  const t = state.time;
  for (let row = 0; row < 9; row++) {
    const y = 70 + row * 72;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const yy = y + Math.sin(x * 0.02 + t * 0.9 + row * 1.7) * 4;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Distant rocks + gulls for depth.
  ctx.fillStyle = '#052028';
  ctx.beginPath(); ctx.ellipse(1240, 60, 90, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(80, 70, 70, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(234, 246, 246, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const gx = 300 + i * 130 + Math.sin(t * 0.4 + i) * 12;
    const gy = 78 + i * 14;
    ctx.beginPath();
    ctx.moveTo(gx - 8, gy); ctx.quadraticCurveTo(gx, gy - 6, gx + 8, gy);
    ctx.stroke();
  }
}

function drawPier(ctx, state) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Edge (darker, wider) then stone top.
  ctx.strokeStyle = PALETTE.pierEdge;
  ctx.lineWidth = PATH_WIDTH + 10;
  tracePath(ctx);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.pier;
  ctx.lineWidth = PATH_WIDTH;
  tracePath(ctx);
  ctx.stroke();
  // Cobble seams.
  ctx.strokeStyle = 'rgba(60, 48, 38, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  tracePath(ctx);
  ctx.stroke();
  ctx.setLineDash([]);
  // Lantern posts along the pier.
  for (let i = 0; i < PATH.length - 1; i++) {
    const mx = (PATH[i][0] + PATH[i + 1][0]) / 2;
    const my = (PATH[i][1] + PATH[i + 1][1]) / 2;
    const flick = 0.75 + Math.sin(state.time * 3 + i * 2.1) * 0.15;
    const glow = ctx.createRadialGradient(mx, my - 26, 2, mx, my - 26, 34);
    glow.addColorStop(0, `rgba(255, 183, 3, ${0.5 * flick})`);
    glow.addColorStop(1, 'rgba(255, 183, 3, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(mx, my - 26, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3f33';
    ctx.fillRect(mx - 2, my - 26, 4, 26);
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.arc(mx, my - 28, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function tracePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(PATH[0][0], PATH[0][1]);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i][0], PATH[i][1]);
}

function drawHeart(ctx, state) {
  const pulse = 1 + Math.sin(state.time * 2.2) * 0.06;
  const glow = ctx.createRadialGradient(HEART.x, HEART.y, 4, HEART.x, HEART.y, 90 * pulse);
  glow.addColorStop(0, 'rgba(255, 233, 168, 0.55)');
  glow.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(HEART.x, HEART.y, 90 * pulse, 0, Math.PI * 2); ctx.fill();
  // Lighthouse-crystal: stone base + glowing crystal.
  ctx.fillStyle = '#5d5348';
  ctx.beginPath(); ctx.arc(HEART.x, HEART.y + 14, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a6f60';
  ctx.beginPath(); ctx.arc(HEART.x, HEART.y + 10, 24, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(HEART.x, HEART.y - 8);
  ctx.rotate(Math.sin(state.time * 1.4) * 0.08);
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(0, -26); ctx.lineTo(14, 0); ctx.lineTo(0, 16); ctx.lineTo(-14, 0); ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath(); ctx.arc(HEART.x - 4, HEART.y - 14, 4, 0, Math.PI * 2); ctx.fill();
  // Lives as small hearts under the crystal.
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = state.lives <= 5 ? '#ff5d5d' : '#eaf6f6';
  ctx.fillText(`${state.lives} ♥`, HEART.x, HEART.y + 52);
}

function drawPlots(ctx, state) {
  for (let i = 0; i < PLOTS.length; i++) {
    const p = PLOTS[i];
    const occupied = state.towers.find((t) => t.plot === p && !t.destroyed);
    const hovered = state.hoverPlot === i && !occupied;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = occupied ? 'rgba(20, 40, 48, 0.5)' : 'rgba(201, 177, 140, 0.22)';
    ctx.fill();
    ctx.strokeStyle = hovered ? '#ffd166' : 'rgba(201, 177, 140, 0.65)';
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.setLineDash(hovered ? [] : [6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!occupied) {
      ctx.fillStyle = 'rgba(234, 246, 246, 0.55)';
      ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', p.x, p.y + 6);
    }
  }
  // Range preview for the selected tower type on the hovered plot.
  if (state.hoverPlot !== null && state.screen === SCREEN_PLAY) {
    const plot = PLOTS[state.hoverPlot];
    const occupied = state.towers.some((t) => t.plot === plot && !t.destroyed);
    if (plot && !occupied) {
      const stats = TOWERS[state.selectedTowerType].tiers[0];
      if (stats.range > 0) {
        ctx.beginPath(); ctx.arc(plot.x, plot.y, stats.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}

// ---- Towers ----------------------------------------------------------------

function drawTowers(ctx, state) {
  for (const t of state.towers) {
    if (t.destroyed) {
      // Rubble where a tower fell.
      ctx.fillStyle = 'rgba(90, 80, 70, 0.8)';
      ctx.beginPath(); ctx.arc(t.x, t.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(60, 50, 44, 0.9)';
      ctx.beginPath(); ctx.arc(t.x - 6, t.y + 4, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(t.x + 7, t.y - 2, 6, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    const def = TOWERS[t.type];
    const stats = towerStats(t);
    const tierScale = 1 + (t.tier - 1) * 0.12;
    // Lantern light radius.
    if (t.type === 'lantern') {
      const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, stats.range);
      g.addColorStop(0, 'rgba(255, 183, 3, 0.16)');
      g.addColorStop(1, 'rgba(255, 183, 3, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(t.x, t.y, stats.range, 0, Math.PI * 2); ctx.fill();
    }
    // Selected / hovered range ring.
    if (state.selectedTower === t || state.hoverTower === t) {
      if (stats.range > 0) {
        ctx.beginPath(); ctx.arc(t.x, t.y, stats.range * (1 + lanternBuff(state, t).range), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    // Stone base.
    ctx.fillStyle = '#5d5348';
    ctx.beginPath(); ctx.arc(t.x, t.y + 3, 22 * tierScale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a6f60';
    ctx.beginPath(); ctx.arc(t.x, t.y, 20 * tierScale, 0, Math.PI * 2); ctx.fill();
    if (t.tier === 3) {
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, 20 * tierScale, 0, Math.PI * 2); ctx.stroke();
    } else if (t.tier === 2) {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, 20 * tierScale, 0, Math.PI * 2); ctx.stroke();
    }
    drawTowerTop(ctx, state, t, def, stats, tierScale);
    // HP bar for damaged towers.
    if (t.hp < t.maxHp) {
      const w = 40;
      ctx.fillStyle = 'rgba(4, 20, 26, 0.8)';
      ctx.fillRect(t.x - w / 2, t.y - 34, w, 5);
      ctx.fillStyle = t.hp / t.maxHp > 0.4 ? '#4ecdc4' : '#ff5d5d';
      ctx.fillRect(t.x - w / 2, t.y - 34, w * (t.hp / t.maxHp), 5);
    }
    if (t.flash > 0) {
      ctx.globalAlpha = t.flash * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(t.x, t.y, 21 * tierScale, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawTowerTop(ctx, state, t, def, stats, s) {
  const { x, y } = t;
  ctx.save();
  ctx.translate(x, y);
  if (t.type === 'harpoon') {
    ctx.rotate(t.angle);
    ctx.strokeStyle = '#3d342c'; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(20 * s, 0); ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.moveTo(26 * s, 0); ctx.lineTo(16 * s, -5); ctx.lineTo(16 * s, 5); ctx.closePath(); ctx.fill();
    ctx.rotate(-t.angle);
    ctx.fillStyle = '#2ec4b6';
    ctx.beginPath(); ctx.arc(0, 0, 9 * s, 0, Math.PI * 2); ctx.fill();
  } else if (t.type === 'cannon') {
    ctx.rotate(t.angle);
    ctx.fillStyle = '#2b2620';
    ctx.beginPath(); ctx.arc(0, 0, 12 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(0, -5 * s, 20 * s, 10 * s);
    ctx.fillStyle = '#1a1712';
    ctx.beginPath(); ctx.arc(20 * s, 0, 5.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(-t.angle);
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, 5 * s, 0, Math.PI * 2); ctx.fill();
  } else if (t.type === 'frost') {
    ctx.fillStyle = '#7fe7f2';
    ctx.shadowColor = '#7fe7f2'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -18 * s); ctx.lineTo(10 * s, 0); ctx.lineTo(0, 12 * s); ctx.lineTo(-10 * s, 0); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eafcff';
    ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(4 * s, -2); ctx.lineTo(0, 4 * s); ctx.lineTo(-4 * s, -2); ctx.closePath(); ctx.fill();
    if (t.tier >= 2) { ctx.fillStyle = 'rgba(127, 231, 242, 0.8)'; ctx.beginPath(); ctx.arc(-12 * s, 6, 4, 0, Math.PI * 2); ctx.arc(12 * s, 6, 4, 0, Math.PI * 2); ctx.fill(); }
  } else if (t.type === 'tide') {
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath(); ctx.arc(0, 0, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bff5f0'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    const rot = state.time * 1.2 * (t.tier >= 2 ? 1.4 : 1);
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 16 * s, Math.sin(a) * 16 * s); ctx.stroke();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  } else if (t.type === 'storm') {
    ctx.fillStyle = '#b388ff';
    ctx.shadowColor = '#b388ff'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, -2, 11 * s, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffe94d';
    ctx.beginPath();
    ctx.moveTo(2, -12 * s); ctx.lineTo(-4, 0); ctx.lineTo(1, 0); ctx.lineTo(-2, 10 * s); ctx.lineTo(6, -2); ctx.lineTo(1, -2); ctx.closePath();
    ctx.fill();
  } else if (t.type === 'lantern') {
    ctx.strokeStyle = '#3d342c'; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -12); ctx.stroke();
    const flick = 0.8 + Math.sin(state.time * 4 + t.id) * 0.2;
    ctx.fillStyle = `rgba(255, 183, 3, ${flick})`;
    ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, -14, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(0, -14, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Tier pips.
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < t.tier; i++) {
    ctx.beginPath(); ctx.arc(x - 8 + i * 8, y + 28, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ---- Enemies ----------------------------------------------------------------

function drawEnemies(ctx, state) {
  for (const e of state.enemies) {
    const { x, y } = e;
    const r = e.def.r;
    const wob = Math.sin(e.wobble) * 2;
    ctx.save();
    ctx.translate(x, y + wob * 0.4);
    // Slow / chill tint.
    if ((state.time < e.chillUntil || state.time < e.slowUntil || state.surgeUntil > state.time) && !e.def.slowImmune) {
      ctx.strokeStyle = 'rgba(127, 231, 242, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2); ctx.stroke();
    }
    drawEnemyBody(ctx, state, e, r);
    ctx.restore();
    // HP bar when hurt.
    if (e.hp < e.maxHp) {
      const w = Math.max(26, r * 2);
      ctx.fillStyle = 'rgba(4, 20, 26, 0.8)';
      ctx.fillRect(x - w / 2, y - r - 12, w, 4);
      ctx.fillStyle = e.type === 'king' ? '#3ec1d3' : '#ff5d5d';
      ctx.fillRect(x - w / 2, y - r - 12, w * Math.max(0, e.hp / e.maxHp), 4);
    }
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawEnemyBody(ctx, state, e, r) {
  const t = e.type;
  ctx.fillStyle = e.def.color;
  if (t === 'crab') {
    ctx.strokeStyle = '#ff8c69'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(-r * 0.5, i * 5); ctx.lineTo(-r - 6, i * 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.5, i * 5); ctx.lineTo(r + 6, i * 8); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb59e';
    ctx.beginPath(); ctx.arc(-r - 4, -6, 4, 0, Math.PI * 2); ctx.arc(r + 4, -6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI * 2); ctx.arc(5, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'eel') {
    ctx.beginPath(); ctx.ellipse(0, 0, r + 6, r * 0.55, Math.sin(e.wobble) * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a8e6b0';
    ctx.beginPath(); ctx.ellipse(4, 0, r * 0.5, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(r + 2, -2, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'brute') {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5f3d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, -3, 2.5, 0, Math.PI * 2); ctx.arc(6, -3, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'spitter') {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0a0cd';
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.4, 4, 0, Math.PI * 2); ctx.arc(r * 0.4, -r * 0.4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a2b58';
    ctx.beginPath(); ctx.arc(-r * 0.55, 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-4, -4, 2, 0, Math.PI * 2); ctx.arc(4, -4, 2, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'jelly' || t === 'jellyMini') {
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = e.def.color; ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5, r * 0.4);
      ctx.quadraticCurveTo(i * r * 0.5 + Math.sin(e.wobble + i) * 4, r + 6, i * r * 0.5, r + 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-4, -3, 2, 0, Math.PI * 2); ctx.arc(4, -3, 2, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'ghost') {
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.4);
    ctx.quadraticCurveTo(0, -r * 1.5, r, -r * 0.4);
    ctx.lineTo(r, r * 0.6);
    ctx.quadraticCurveTo(r * 0.5, r * 0.2, 0, r * 0.6);
    ctx.quadraticCurveTo(-r * 0.5, r * 0.2, -r, r * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a2a33';
    ctx.beginPath(); ctx.arc(-4, -2, 2.5, 0, Math.PI * 2); ctx.arc(4, -2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'hulk') {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9d6a0';
    for (const [bx, by] of [[-10, -8], [8, -12], [12, 8], [-8, 10], [0, 0]]) {
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-7, -4, 2.5, 0, Math.PI * 2); ctx.arc(7, -4, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (t === 'king') {
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, r + 18);
    glow.addColorStop(0, 'rgba(62, 193, 211, 0.4)');
    glow.addColorStop(1, 'rgba(62, 193, 211, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, r + 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.def.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d7f8c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke();
    // Crown.
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-16, -r + 6); ctx.lineTo(-16, -r - 10); ctx.lineTo(-8, -r - 2); ctx.lineTo(0, -r - 12);
    ctx.lineTo(8, -r - 2); ctx.lineTo(16, -r - 10); ctx.lineTo(16, -r + 6); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#062a33';
    ctx.beginPath(); ctx.arc(-9, -3, 3, 0, Math.PI * 2); ctx.arc(9, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(-9, -3, 1.5, 0, Math.PI * 2); ctx.arc(9, -3, 1.5, 0, Math.PI * 2); ctx.fill();
  } else { // kingling
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#062a33';
    ctx.beginPath(); ctx.arc(-3, -2, 2, 0, Math.PI * 2); ctx.arc(3, -2, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawProjectiles(ctx, state) {
  for (const p of state.projectiles) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ---- HUD -------------------------------------------------------------------

function drawHUD(ctx, state) {
  if (state.screen === SCREEN_TITLE) return;
  // Top bar.
  ctx.fillStyle = 'rgba(4, 22, 28, 0.92)';
  ctx.fillRect(0, 0, W, TOP_BAR);
  ctx.fillStyle = '#0f5566';
  ctx.fillRect(0, TOP_BAR - 2, W, 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`● ${state.gold}g`, 18, TOP_BAR / 2 + 1);
  ctx.fillStyle = state.lives <= 5 ? '#ff5d5d' : '#ff8fa3';
  ctx.fillText(`♥ ${state.lives}`, 150, TOP_BAR / 2 + 1);
  ctx.fillStyle = '#eaf6f6';
  ctx.fillText(`Wave ${Math.max(1, state.wave)}/${TOTAL_WAVES}`, 260, TOP_BAR / 2 + 1);
  ctx.fillStyle = '#9fc3c9';
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText(`Score ${state.score}`, 400, TOP_BAR / 2 + 1);
  const remaining = state.screen === SCREEN_PLAY ? enemiesRemaining(state) : 0;
  ctx.fillText(`Foes left: ${remaining}`, 540, TOP_BAR / 2 + 1);
  if (state.phase === 'build' && state.screen === SCREEN_PLAY) {
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`Next wave in ${Math.ceil(state.buildTimer)}s — Space for +${10}g early`, 700, TOP_BAR / 2 + 1);
  }
  // Control buttons.
  drawControlButton(ctx, 'speed', state.speed === 1 ? '1×' : '2×');
  drawControlButton(ctx, 'pause', state.paused ? '▶' : '❚❚');
  drawControlButton(ctx, 'mute', state.muted ? '🔇' : '🔊');
  drawBossBar(ctx, state);

  // Bottom bar: tower slots.
  ctx.fillStyle = 'rgba(4, 22, 28, 0.92)';
  ctx.fillRect(0, H - BOTTOM_BAR, W, BOTTOM_BAR);
  ctx.fillStyle = '#0f5566';
  ctx.fillRect(0, H - BOTTOM_BAR, W, 2);
  for (let i = 0; i < TOWER_ORDER.length; i++) {
    const type = TOWER_ORDER[i];
    const def = TOWERS[type];
    const r = towerBarRect(i);
    const selected = state.selectedTowerType === type;
    const afford = state.gold >= def.cost;
    ctx.fillStyle = selected ? 'rgba(255, 209, 102, 0.28)' : 'rgba(15, 85, 102, 0.55)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = selected ? '#ffd166' : 'rgba(159, 195, 201, 0.4)';
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = afford ? def.color : 'rgba(159, 195, 201, 0.45)';
    ctx.beginPath(); ctx.arc(r.x + 11, r.y + 11, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eaf6f6';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(`${i + 1} ${def.name}`, r.x + r.w / 2, r.y + 20);
    ctx.fillStyle = afford ? '#ffd166' : '#ff8fa3';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(`${def.cost}g`, r.x + r.w / 2, r.y + 38);
    ctx.fillStyle = '#9fc3c9';
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.fillText(def.desc, r.x + r.w / 2, r.y + 56);
  }
  // Ability buttons.
  drawAbilityButton(ctx, state, 'surge', ABILITIES.surge, state.surgeCd);
  drawAbilityButton(ctx, state, 'flare', ABILITIES.flare, state.flareCd);
  // Bottom-right: start wave or tower actions.
  drawBottomRight(ctx, state);
}

function drawBossBar(ctx, state) {
  // A big, unmistakable boss bar while the Drowned King is on the pier.
  if (state.screen !== SCREEN_PLAY) return;
  const king = state.enemies.find((e) => e.type === 'king' && !e.dead && !e.leaked);
  if (!king) return;
  const tier = Math.max(1, Math.min(3, Math.round(state.wave / 10)));
  const w = 440, x = W / 2 - w / 2, y = TOP_BAR + 10;
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#3ec1d3';
  ctx.fillText(`${bossName(tier)}  ·  ${Math.max(0, Math.round(king.hp))} / ${king.maxHp} HP`, W / 2, y + 7);
  ctx.fillStyle = 'rgba(4, 20, 26, 0.85)';
  ctx.fillRect(x, y + 16, w, 13);
  ctx.fillStyle = '#3ec1d3';
  ctx.fillRect(x, y + 16, w * Math.max(0, king.hp / king.maxHp), 13);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 16, w, 13);
}

function drawControlButton(ctx, which, label) {
  const r = controlButtonRect(which);
  ctx.fillStyle = 'rgba(15, 85, 102, 0.7)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(159, 195, 201, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
}

function drawAbilityButton(ctx, state, which, def, cd) {
  const r = abilityButtonRect(which);
  const ready = cd <= 0;
  ctx.fillStyle = ready ? 'rgba(46, 196, 182, 0.35)' : 'rgba(15, 85, 102, 0.55)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = ready ? '#2ec4b6' : 'rgba(159, 195, 201, 0.4)';
  ctx.lineWidth = ready ? 2.5 : 1.5;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf6f6';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText(`${def.key.toUpperCase()} ${def.name}`, r.x + r.w / 2, r.y + 20);
  ctx.fillStyle = ready ? '#7fe7f2' : '#9fc3c9';
  ctx.font = '11px "Trebuchet MS", sans-serif';
  ctx.fillText(ready ? def.desc : `Ready in ${Math.ceil(cd)}s`, r.x + r.w / 2, r.y + 40);
  if (!ready) {
    ctx.fillStyle = 'rgba(4, 22, 28, 0.45)';
    ctx.fillRect(r.x, r.y, r.w * (cd / def.cd), r.h);
  }
}

export function bottomRightButtons(state) {
  // Returns clickable buttons in the bottom-right zone: { id, rect, label, sub, enabled }.
  const x = 1050, y = H - BOTTOM_BAR + 10, w = 210, h = 76;
  if (state.selectedTower && state.screen === SCREEN_PLAY) {
    const t = state.selectedTower;
    const up = upgradeCost(t);
    const btns = [];
    btns.push({ id: 'upgrade', rect: { x, y, w: 102, h: 36 }, label: up === null ? 'MAX TIER' : `Upgrade ${up}g`, enabled: up !== null && state.gold >= up });
    btns.push({ id: 'sell', rect: { x: x + 108, y, w: 102, h: 36 }, label: `Sell +${sellValue(t)}g`, enabled: true });
    const rc = repairCost(t);
    btns.push({ id: 'repair', rect: { x, y: y + 40, w: 210, h: 36 }, label: t.hp >= t.maxHp ? 'HP full' : `Repair ${rc}g  (${Math.round(t.hp)}/${t.maxHp} HP)`, enabled: t.hp < t.maxHp && state.gold >= rc });
    return btns;
  }
  return [{
    id: 'startWave', rect: { x, y, w, h },
    label: state.phase === 'wave' ? 'Wave running…' : '▶ Start Wave (Space)',
    sub: state.phase === 'build' ? `+${10}g early bonus` : '',
    enabled: state.phase === 'build' && state.screen === SCREEN_PLAY,
  }];
}

function drawBottomRight(ctx, state) {
  for (const b of bottomRightButtons(state)) {
    ctx.fillStyle = b.enabled ? 'rgba(255, 127, 81, 0.35)' : 'rgba(15, 85, 102, 0.55)';
    ctx.fillRect(b.rect.x, b.rect.y, b.rect.w, b.rect.h);
    ctx.strokeStyle = b.enabled ? '#ff7f51' : 'rgba(159, 195, 201, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.rect.x, b.rect.y, b.rect.w, b.rect.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = b.enabled ? '#ffe9d6' : '#9fc3c9';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(b.label, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2 - (b.sub ? 8 : 0));
    if (b.sub) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px "Trebuchet MS", sans-serif';
      ctx.fillText(b.sub, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2 + 12);
    }
  }
}

function drawBanner(ctx, state) {
  if (!state.banner || state.time > state.banner.until) return;
  const alpha = Math.min(1, (state.banner.until - state.time) / 0.4);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
  ctx.fillText(state.banner.text, W / 2, 150);
  if (state.banner.sub) {
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#eaf6f6';
    ctx.fillText(state.banner.sub, W / 2, 182);
  }
  ctx.restore();
}

function drawTowerInfo(ctx, state) {
  const t = state.selectedTower;
  const def = TOWERS[t.type];
  const stats = towerStats(t);
  const x = 18, y = TOP_BAR + 10, w = 250;
  const h = 108;
  ctx.fillStyle = 'rgba(4, 22, 28, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'left';
  ctx.fillStyle = def.color;
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  ctx.fillText(`${def.name} — Tier ${t.tier}`, x + 12, y + 22);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  const lines = [];
  if (stats.dmg > 0) lines.push(`Damage ${Math.round(stats.dmg)}  ·  Range ${Math.round(stats.range)}`);
  if (stats.splash) lines.push(`Splash radius ${stats.splash}`);
  if (stats.chains) lines.push(`Chains to ${stats.chains} enemies`);
  if (stats.slow) lines.push(`Slow ${Math.round(stats.slow * 100)}% for ${stats.slowDur}s`);
  if (stats.income) lines.push(`+${stats.income}g each wave cleared`);
  if (stats.dmgBuff) lines.push(`Buffs nearby towers +${Math.round(stats.dmgBuff * 100)}% dmg`);
  lines.push(`HP ${Math.round(t.hp)} / ${t.maxHp}`);
  lines.forEach((line, i) => ctx.fillText(line, x + 12, y + 44 + i * 17));
  ctx.fillStyle = '#9fc3c9';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText('Use the buttons at bottom-right to upgrade, sell or repair.', x + 12, y + h - 10);
}

// ---- Screens -----------------------------------------------------------------

function dimOverlay(ctx, alpha = 0.62) {
  ctx.fillStyle = `rgba(3, 18, 24, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(5, 26, 33, 0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 183, 3, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
}

export function playAgainRect() { return { x: W / 2 - 130, y: 520, w: 260, h: 56 }; }

function drawTitle(ctx, state) {
  dimOverlay(ctx, 0.45);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 84px Georgia, "Times New Roman", serif';
  ctx.shadowColor = 'rgba(255, 183, 3, 0.55)'; ctx.shadowBlur = 30;
  ctx.fillText('TIDEWARDEN', W / 2, 190);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#7fe7f2';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('— Hold the Last Harbor —', W / 2, 232);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillText('The drowned horde sails in from the sea gate. Build towers on the stone pier,', W / 2, 290);
  ctx.fillText('spend your gold wisely, and keep the Harbor Heart burning for 30 waves.', W / 2, 314);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  const blink = 0.65 + Math.sin(state.time * 3) * 0.35;
  ctx.globalAlpha = blink;
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', W / 2, 380);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#9fc3c9';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText('1–6 build towers  ·  Click a tower to upgrade / sell / repair  ·  Space start wave', W / 2, 430);
  ctx.fillText('Q Tide Surge  ·  E Flare Volley  ·  F speed  ·  P pause  ·  M mute  ·  R restart', W / 2, 454);
  if (state.best > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.fillText(`Best score: ${state.best}`, W / 2, 500);
  }
  ctx.fillStyle = 'rgba(159, 195, 201, 0.8)';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText('A tiny original tower defence. No downloads, no accounts — just the harbor, the gold, and the tide.', W / 2, 660);
}

function drawPause(ctx, state) {
  dimOverlay(ctx, 0.6);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('PAUSED', W / 2, 300);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText('Press P or click the pause button to resume.', W / 2, 350);
  ctx.fillText(`Wave ${state.wave}  ·  ${state.gold}g  ·  ${state.lives} lives  ·  Score ${state.score}`, W / 2, 384);
}

function statLines(s) {
  const lines = [
    `Score ${s.score}`,
    `Kills ${s.kills}`,
    `Gold earned ${s.goldEarned}g`,
    `Towers built ${s.towersBuilt}`,
    `Time ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}`,
  ];
  // Victory only: show the banked-gold conversion so the score makes sense.
  if (s.goldBonus) lines.splice(1, 0, `Gold banked ${s.goldBanked}g  →  +${s.goldBonus} score`);
  return lines;
}

function drawGameOver(ctx, state) {
  dimOverlay(ctx, 0.68);
  const s = state.stats || { score: 0, kills: 0, goldEarned: 0, towersBuilt: 0, time: 0, wave: 0 };
  panel(ctx, W / 2 - 280, 130, 560, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5d5d';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('THE HARBOR FALLS', W / 2, 200);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText(`The tide took the Heart on wave ${s.wave}.`, W / 2, 240);
  ctx.font = '17px "Trebuchet MS", sans-serif';
  statLines(s).forEach((line, i) => ctx.fillText(line, W / 2, 282 + i * 28));
  drawPlayAgain(ctx, 'PLAY AGAIN (R)');
}

function drawVictory(ctx, state) {
  dimOverlay(ctx, 0.55);
  const s = state.stats || { stars: 1, score: 0, kills: 0, goldEarned: 0, towersBuilt: 0, time: 0, lives: 0 };
  panel(ctx, W / 2 - 280, 110, 560, 360);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('THE HARBOR HOLDS!', W / 2, 180);
  // Stars.
  ctx.font = '56px Georgia, serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < s.stars ? '#ffd166' : 'rgba(159, 195, 201, 0.35)';
    ctx.fillText('★', W / 2 - 70 + i * 70, 250);
  }
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillText(`The Drowned King is broken. ${s.lives} lives remain.`, W / 2, 290);
  statLines(s).forEach((line, i) => ctx.fillText(line, W / 2, 322 + i * 26));
  drawPlayAgain(ctx, 'PLAY AGAIN (R)');
}

function drawPlayAgain(ctx, label) {
  const r = playAgainRect();
  ctx.fillStyle = 'rgba(255, 127, 81, 0.4)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#ff7f51';
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#ffe9d6';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}
