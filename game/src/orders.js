// Orders, scoring, combo, levels and tips for The Copper Kettle v3.
// An order belongs to a visible customer; the ticket on the board and the speech
// bubble above the customer show the same dish and the same patience clock.

import { dishById, matchingDish } from './recipes.js';
import { pick, intRange } from './random.js';

// An order: { id, customerId, dishId, patience, patienceMax, state }.
// state: 'waiting' | 'served' | 'missed'.
export function makeOrder(id, customerId, dishId, patienceMax) {
  return { id, customerId, dishId, patience: patienceMax, patienceMax, state: 'waiting' };
}

// Pick a dish for a new order. Higher levels favour the bigger, richer dishes.
export function pickDish(rng, level, dishes) {
  const pool = level >= 3 ? dishes : dishes.filter((d) => d.points <= 120);
  return pick(rng, pool.length ? pool : dishes);
}

// Patience for a new order, in seconds: shorter as the level rises.
export function patienceForLevel(level, rng) {
  const base = Math.max(34, 58 - level * 4);
  return base + intRange(rng, -4, 6);
}

// --- Scoring ---------------------------------------------------------------

// Serve the plate to an order. Returns the result (or null when the plate does
// not match). `quality` is 'perfect' | 'good' | 'ok' from the plate's cooking:
// perfect = fast serve, both patty sides browned, fries even, nothing cooled.
export function serveOrder(order, plate, secondsLeft, combo) {
  const dish = matchingDish(plate.map((p) => p.id));
  if (!dish || dish.id !== order.dishId) return null;
  const timeBonus = Math.round(secondsLeft);
  const comboMult = 1 + 0.1 * combo;
  const points = Math.round((dish.points + timeBonus) * comboMult);
  return { dish, points, timeBonus, comboMult };
}

// Grade for a serve: Wonderful (perfect — fast and well cooked), Excellent,
// Good, or a slow-but-served Good. A miss is not a serve and gets no grade.
export function gradeForServe(secondsLeft, patienceMax, quality) {
  const frac = patienceMax > 0 ? secondsLeft / patienceMax : 0;
  if (quality === 'perfect' && frac >= 0.45) return 'Wonderful!';
  if (frac >= 0.45) return 'Excellent!';
  return 'Good';
}

// The plate's cooking quality: 'perfect' when every cooked item is well done
// (both patty sides browned, fries even) and nothing has cooled; 'good' when
// it is done but not perfect; 'ok' when something is uneven or cooled.
export function plateQuality(plate, now) {
  let perfect = true;
  let ok = true;
  for (const item of plate) {
    if (item.id === 'patty' && item.quality !== 'done') { perfect = false; ok = false; }
    if (item.id === 'fries' && item.quality === 'uneven') { perfect = false; }
    if (item.cooled) { perfect = false; ok = false; }
  }
  if (!ok) return 'ok';
  return perfect ? 'perfect' : 'good';
}

// --- Levels ----------------------------------------------------------------

// Level up every 5 serves. Higher levels: faster tickets, shorter patience,
// and a third customer seat opens at level 3.
export function levelForServes(served) {
  return 1 + Math.floor(served / 5);
}

export function maxCustomersForLevel(level) {
  return level >= 3 ? 3 : 2;
}

// Time between one customer leaving and the next arriving (seconds).
export function gapForLevel(level) {
  return Math.max(0.8, 2.2 - level * 0.25);
}
