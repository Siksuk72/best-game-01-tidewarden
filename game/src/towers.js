// Towers: build / upgrade / sell / repair, targeting, projectiles, frost aura, lantern buffs.
import { TOWERS, TOWER_ORDER, SELL_REFUND, REPAIR_COST_FRAC } from './config.js';
import { damageEnemy } from './enemies.js';

let nextTowerId = 1;

export function towerStats(t) {
  return TOWERS[t.type].tiers[t.tier - 1];
}

export function buildCost(type) { return TOWERS[type].cost; }
export function upgradeCost(t) {
  if (t.tier >= 3) return null;
  return TOWERS[t.type].up[t.tier - 1];
}
export function sellValue(t) {
  let invested = TOWERS[t.type].cost;
  for (let i = 1; i < t.tier; i++) invested += TOWERS[t.type].up[i - 1];
  return Math.floor(invested * SELL_REFUND);
}
export function repairCost(t) { return Math.ceil(TOWERS[t.type].cost * REPAIR_COST_FRAC); }

export function makeTower(type, plot) {
  const stats = TOWERS[type].tiers[0];
  const maxHp = 200 + (type === 'cannon' ? 40 : 0);
  return {
    id: nextTowerId++, type, tier: 1, x: plot.x, y: plot.y, plot,
    cd: 0, angle: -Math.PI / 2, hp: maxHp, maxHp, destroyed: false,
    flash: 0, builtAt: 0,
  };
}

// Lantern buffs for a tower: strongest adjacent lantern wins per stat.
export function lanternBuff(state, tower) {
  let dmg = 0, range = 0;
  for (const t of state.towers) {
    if (t.destroyed || t.type !== 'lantern') continue;
    const d = Math.hypot(t.x - tower.x, t.y - tower.y);
    const ls = TOWERS.lantern.tiers[t.tier - 1];
    if (d <= ls.range && d > 1) {
      dmg = Math.max(dmg, ls.dmgBuff);
      range = Math.max(range, ls.rangeBuff);
    }
  }
  return { dmg, range };
}

export function updateTowers(state, dt, rng) {
  for (const t of state.towers) {
    if (t.destroyed) continue;
    t.flash = Math.max(0, t.flash - dt * 5);
    t.cd -= dt;
    if (t.type === 'tide' || t.type === 'lantern') continue; // passive
    const stats = towerStats(t);
    const buff = lanternBuff(state, t);
    const range = stats.range * (1 + buff.range);
    const dmg = stats.dmg * (1 + buff.dmg);

    if (t.type === 'frost') {
      // Aura: chill + chip damage to everything in radius, ticking with rate.
      if (t.cd <= 0) {
        t.cd = 1 / stats.rate;
        let hitAny = false;
        for (const e of state.enemies) {
          if (e.dead || e.leaked) continue;
          if (Math.hypot(e.x - t.x, e.y - t.y) <= range) {
            hitAny = true;
            if (!e.def.slowImmune) { e.chillUntil = state.time + stats.slowDur; e.chillFactor = stats.slow; }
            damageEnemy(state, e, dmg, t);
            state.particles.frostPuff(e.x, e.y);
          }
        }
        if (hitAny) state.audio.frost();
      }
      continue;
    }

    if (t.cd > 0) continue;
    const target = pickTarget(state, t, range);
    if (!target) continue;
    t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    t.cd = 1 / stats.rate;

    if (t.type === 'harpoon') {
      state.projectiles.push({ kind: 'harpoon', x: t.x, y: t.y, target, speed: stats.projSpeed, dmg, r: 4, color: '#ffd166', splash: 0 });
      state.particles.muzzle(t.x + Math.cos(t.angle) * 20, t.y + Math.sin(t.angle) * 20, '#ffd166');
      state.audio.shoot();
    } else if (t.type === 'cannon') {
      state.projectiles.push({ kind: 'shell', x: t.x, y: t.y, target, speed: 380, dmg, r: 6, color: '#ff7f51', splash: stats.splash, tx: target.x, ty: target.y });
      state.particles.muzzle(t.x + Math.cos(t.angle) * 22, t.y + Math.sin(t.angle) * 22, '#ff7f51');
      state.audio.cannon();
    } else if (t.type === 'storm') {
      chainLightning(state, t, target, stats.chains, dmg, rng);
      state.audio.zap();
    }
  }
}

// Target the enemy furthest along the path within range.
function pickTarget(state, t, range) {
  let best = null; let bestDist = -1;
  for (const e of state.enemies) {
    if (e.dead || e.leaked) continue;
    if (Math.hypot(e.x - t.x, e.y - t.y) > range) continue;
    if (e.dist > bestDist) { best = e; bestDist = e.dist; }
  }
  return best;
}

function chainLightning(state, fromTower, first, chains, dmg, rng) {
  const hit = new Set();
  let current = first;
  let fromX = fromTower.x, fromY = fromTower.y;
  for (let i = 0; i < chains && current; i++) {
    hit.add(current.id);
    // Jagged bolt from previous point to this enemy.
    const pts = [{ x: fromX, y: fromY }];
    const segs = 4;
    for (let s = 1; s < segs; s++) {
      const f = s / segs;
      pts.push({
        x: fromX + (current.x - fromX) * f + (rng() - 0.5) * 22,
        y: fromY + (current.y - fromY) * f + (rng() - 0.5) * 22,
      });
    }
    pts.push({ x: current.x, y: current.y });
    state.particles.bolt(pts);
    state.particles.sparks(current.x, current.y, '#b388ff');
    damageEnemy(state, current, dmg * Math.pow(0.85, i), fromTower);
    fromX = current.x; fromY = current.y;
    // Next: nearest unhit enemy within 150 of current.
    let next = null; let bestD = 150;
    for (const e of state.enemies) {
      if (e.dead || e.leaked || hit.has(e.id)) continue;
      const d = Math.hypot(e.x - current.x, e.y - current.y);
      if (d < bestD) { bestD = d; next = e; }
    }
    current = next;
  }
}

// Homing / ballistic projectiles, including enemy spit at towers.
export function updateProjectiles(state, dt) {
  const kept = [];
  for (const p of state.projectiles) {
    if (p.kind === 'spit') {
      // Spit homes to a fixed tower position.
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step + 6) {
        const t = p.target;
        if (t && !t.destroyed) {
          t.hp -= p.dmg;
          t.flash = 1;
          state.particles.sparks(t.x, t.y, '#e26ee5');
          state.audio.hit();
          if (t.hp <= 0) {
            t.destroyed = true;
            state.particles.burst(t.x, t.y, 24, '#ff7f51', 160, 3, 80);
            state.particles.floatText(t.x, t.y - 26, 'TOWER DOWN', '#ff5d5d', 15);
            state.audio.leak();
          }
        }
        continue;
      }
      p.x += (dx / d) * step; p.y += (dy / d) * step;
      kept.push(p);
      continue;
    }
    const target = p.target;
    if (!target || target.dead || target.leaked) {
      if (p.kind === 'shell') {
        // Shell still explodes where the target was.
        explodeShell(state, p.tx, p.ty, p.dmg, p.splash);
      }
      continue;
    }
    const dx = target.x - p.x, dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + target.def.r * 0.5) {
      if (p.kind === 'shell') explodeShell(state, target.x, target.y, p.dmg, p.splash);
      else { damageEnemy(state, target, p.dmg, p); state.particles.sparks(target.x, target.y, p.color); }
      continue;
    }
    p.x += (dx / d) * step; p.y += (dy / d) * step;
    kept.push(p);
  }
  state.projectiles = kept;
}

function explodeShell(state, x, y, dmg, splash) {
  state.particles.burst(x, y, 14, '#ff7f51', 170, 3, 90);
  state.particles.burst(x, y, 6, '#ffd166', 120, 2.5, 60);
  for (const e of state.enemies) {
    if (e.dead || e.leaked) continue;
    if (Math.hypot(e.x - x, e.y - y) <= splash + e.def.r) damageEnemy(state, e, dmg, null);
  }
}

export { TOWER_ORDER };
