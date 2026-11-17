// Enemy instances: movement along the pier, slowing, spitter shots, jelly splits, boss minions.
import { ENEMIES, PATH, HEART } from './config.js';

let nextId = 1;

export function pathLength() {
  let len = 0;
  for (let i = 1; i < PATH.length; i++) len += Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
  return len;
}
export const TOTAL_PATH_LEN = pathLength();

export function pointAt(dist) {
  let d = Math.max(0, Math.min(TOTAL_PATH_LEN, dist));
  for (let i = 1; i < PATH.length; i++) {
    const seg = Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return { x: PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * t, y: PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * t };
    }
    d -= seg;
  }
  return { x: PATH[PATH.length - 1][0], y: PATH[PATH.length - 1][1] };
}

export function makeEnemy(type, wave, dist = 0, hpMul = 1) {
  const def = ENEMIES[type];
  // Bosses carry their own tier HP (passed via hpMul); normal enemies scale with the wave.
  const hpScale = type === 'king'
    ? hpMul
    : (1 + 0.11 * (wave - 1) + 0.0002 * wave * wave) * hpMul;
  const hp = Math.round(def.hp * hpScale);
  return {
    id: nextId++, type, def, wave,
    dist, x: 0, y: 0,
    hp, maxHp: hp,
    speed: def.speed * (1 + Math.min(0.25, 0.012 * (wave - 1))),
    slowUntil: 0, slowFactor: 0,
    chillUntil: 0, chillFactor: 0,
    shootCd: 0, flash: 0, wobble: Math.random() * Math.PI * 2,
    spawnedAt66: false, spawnedAt33: false,
    dead: false, leaked: false, reachedHeart: false,
  };
}

// Returns events the world should react to: { leaked, killed } lists.
export function updateEnemies(state, dt, rng) {
  const events = { leaked: [], killed: [] };
  const now = state.time;
  for (const e of state.enemies) {
    if (e.dead || e.leaked) continue;
    e.flash = Math.max(0, e.flash - dt * 6);
    // Spitter: stop at range of the nearest tower and shoot it.
    if (e.type === 'spitter') {
      const tower = nearestTowerInRange(state, e, e.def.range);
      if (tower) {
        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = e.def.shootCd;
          state.projectiles.push({ kind: 'spit', x: e.x, y: e.y, tx: tower.x, ty: tower.y, target: tower, speed: 320, dmg: e.def.shotDmg, r: 5, color: '#e26ee5', splash: 0 });
          state.audio.hit();
        }
        continue;
      }
    }
    let speed = e.speed;
    if (!e.def.slowImmune) {
      if (now < e.slowUntil) speed *= (1 - e.slowFactor);
      if (now < e.chillUntil) speed *= (1 - e.chillFactor);
    }
    if (state.surgeUntil > now) speed *= (1 - 0.5);
    e.dist += speed * dt;
    const p = pointAt(e.dist);
    e.x = p.x; e.y = p.y;
    e.wobble += dt * 6;
    if (e.dist >= TOTAL_PATH_LEN) {
      e.leaked = true;
      events.leaked.push(e);
    }
  }
  return events;
}

function nearestTowerInRange(state, e, range) {
  let best = null; let bestD = Infinity;
  for (const t of state.towers) {
    if (t.destroyed) continue;
    const d = Math.hypot(t.x - e.x, t.y - e.y);
    if (d <= range && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

export function damageEnemy(state, e, dmg, source) {
  if (e.dead || e.leaked) return false;
  e.hp -= dmg;
  e.flash = 1;
  if (source && source.x !== undefined) state.particles.floatText(e.x, e.y - e.def.r - 6, String(Math.round(dmg)), '#ffe9a8', 12);
  if (e.hp <= 0) {
    killEnemy(state, e);
    return true;
  }
  // Boss spawns minions at HP thresholds.
  if (e.type === 'king') {
    if (!e.spawnedAt66 && e.hp <= e.maxHp * 0.66) { e.spawnedAt66 = true; spawnMinions(state, e, 4); }
    if (!e.spawnedAt33 && e.hp <= e.maxHp * 0.33) { e.spawnedAt33 = true; spawnMinions(state, e, 6); }
  }
  return false;
}

function spawnMinions(state, boss, n) {
  for (let i = 0; i < n; i++) {
    const m = makeEnemy('kingling', boss.wave, Math.max(0, boss.dist - 20 - i * 14));
    const p = pointAt(m.dist);
    m.x = p.x; m.y = p.y;
    state.enemies.push(m);
  }
  state.particles.burst(boss.x, boss.y, 16, '#3ec1d3', 140, 3, 40);
  state.audio.roar();
}

export function killEnemy(state, e) {
  if (e.dead) return;
  e.dead = true;
  state.kills += 1;
  state.gold += e.def.gold;
  state.goldEarned += e.def.gold;
  state.score += 10 + e.def.gold;
  state.particles.coinPop(e.x, e.y);
  state.particles.floatText(e.x, e.y - 18, `+${e.def.gold}g`, '#ffd166', 13);
  state.particles.splash(e.x, e.y);
  if (e.type === 'king') {
    state.particles.addShake(12);
    state.particles.burst(e.x, e.y, 40, '#3ec1d3', 220, 4, 60);
    state.audio.roar();
  }
  if (e.def.splits) {
    for (let i = 0; i < 2; i++) {
      const mini = makeEnemy('jellyMini', e.wave, Math.max(0, e.dist - 6 - i * 10));
      const p = pointAt(mini.dist);
      mini.x = p.x; mini.y = p.y;
      state.enemies.push(mini);
    }
    state.particles.frostPuff(e.x, e.y);
  }
}

export function heartPos() { return { x: HEART.x, y: HEART.y }; }
