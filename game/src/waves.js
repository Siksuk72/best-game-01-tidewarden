// Wave composition for all 30 waves. Deterministic from the wave number; bosses on 10/20/30.
import { ENEMIES } from './config.js';

// Returns a spawn list: [{ type, delay }] — delay is seconds after the previous spawn.
export function buildWave(wave) {
  const list = [];
  const add = (type, count, gap) => { for (let i = 0; i < count; i++) list.push({ type, delay: gap }); };
  if (wave % 10 === 0) {
    // Boss wave: the Drowned King plus escorts, then a trickle of reinforcements.
    // Escorts are trimmed from the original (which cost a full tier-3 defence
    // 9 lives on wave 30 alone) so the final wave is a hard fight, not a rout.
    const tier = wave / 10;
    add('crab', 4 + Math.floor((wave * 3) / 4), 0.5);
    add('eel', 3 + Math.floor(wave / 2), 0.7);
    add('brute', 2 + tier, 1.2);
    list.push({ type: 'king', delay: 2.5, bossTier: tier });
    add('ghost', 4 + tier, 0.9);
    add('eel', 4, 0.8);
    add('brute', 2, 1.4);
    return list;
  }
  const w = wave;
  add('crab', 5 + w, Math.max(0.35, 0.9 - w * 0.02));
  if (w >= 2) add('eel', 2 + Math.floor(w * 0.8), Math.max(0.4, 0.85 - w * 0.015));
  if (w >= 3) add('brute', 1 + Math.floor(w / 3), 1.3);
  if (w >= 4) add('jelly', 1 + Math.floor(w / 4), 1.1);
  if (w >= 5) add('spitter', 1 + Math.floor((w - 3) / 4), 1.6);
  if (w >= 6) add('ghost', 1 + Math.floor((w - 4) / 3), 0.9);
  if (w >= 8) add('hulk', Math.floor((w - 6) / 4), 2.2);
  if (w >= 7) add('crab', Math.floor(w / 2), 0.45);
  if (w >= 12) add('eel', Math.floor(w / 3), 0.6);
  return list;
}

export function waveClearBonus(wave) { return 20 + 2 * wave; }

export function bossHpForTier(tier) {
  // King III was a cliff (a full tier-3 defence lost 9 lives on wave 30 alone);
  // 7,000 keeps him the toughest fight in the game without making the win a rout.
  return [2600, 4600, 7000][tier - 1] || 2600;
}
export function bossName(tier) {
  return ['Drowned King I', 'Drowned King II', 'Drowned King III'][tier - 1] || 'Drowned King';
}
export { ENEMIES };
