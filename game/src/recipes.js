// Ingredients, dishes and the exact-match rule for The Copper Kettle v3.
// Every ingredient carries its cooking model: how it is prepared, how long it takes,
// and what "done" and "burnt" mean for it. The realistic cooking in kitchen.js
// reads these numbers; the renderer reads them to draw each visible state.

// The eight ingredients. `kind` selects the station behaviour:
//   instant — ready the moment you take it (bun, cheese)
//   grill   — two-sided: each side browns on its own clock, flip to do the other side
//   chop    — two chops; each chop visibly splits the vegetable into pieces
//   fry     — fries in oil; shake it or it cooks unevenly
//   pour    — a drink poured with a rising fill level
export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     key: '1', kind: 'instant', blurb: 'Toasted, golden top' },
  { id: 'patty',   name: 'Patty',   key: '2', kind: 'grill',   blurb: 'Flip it — both sides brown', grillSecs: 4, burnSecs: 9 },
  { id: 'lettuce', name: 'Lettuce', key: '3', kind: 'chop',    blurb: 'Two chops, crisp leaves', chops: 2 },
  { id: 'tomato',  name: 'Tomato',  key: '4', kind: 'chop',    blurb: 'Two chops, juicy slices', chops: 2 },
  { id: 'cheese',  name: 'Cheese',  key: '5', kind: 'instant', blurb: 'Melts on a hot patty' },
  { id: 'onion',   name: 'Onion',   key: '6', kind: 'chop',    blurb: 'Two chops, fine rings', chops: 2 },
  { id: 'fries',   name: 'Fries',   key: '7', kind: 'fry',     blurb: 'Shake while frying', frySecs: 5, burnSecs: 10 },
  { id: 'drink',   name: 'Drink',   key: '8', kind: 'pour',    blurb: 'Pour to the line', pourSecs: 1.6 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id);
}

// The seven original dishes. `items` is the exact multiset the plate must hold:
// the same ingredient twice (two cheeses in a Cheesy Melt) counts twice.
export const DISHES = [
  { id: 'sunrise', name: 'Sunrise Burger',    points: 100, items: ['bun', 'patty', 'cheese', 'lettuce'] },
  { id: 'garden',  name: 'Garden Stack',      points: 120, items: ['bun', 'patty', 'lettuce', 'tomato', 'onion'] },
  { id: 'classic', name: 'Classic Burger',    points: 100, items: ['bun', 'patty', 'lettuce', 'tomato'] },
  { id: 'melt',    name: 'Cheesy Melt',       points: 110, items: ['bun', 'patty', 'cheese', 'cheese'] },
  { id: 'salad',   name: 'Fresh Garden Salad', points: 80, items: ['lettuce', 'tomato', 'onion'] },
  { id: 'basket',  name: 'Crispy Basket',     points: 60,  items: ['fries', 'drink'] },
  { id: 'feast',   name: 'Kettle Feast',      points: 160, items: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'fries', 'drink'] },
];

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

// Dishes sorted by points, for the recipe book (cheapest first).
export function dishesByPoints() {
  return DISHES.slice().sort((a, b) => a.points - b.points);
}

// The station an ingredient is cooked at (its key and its kind agree).
export function stationForIngredient(id) {
  const ing = ingredientById(id);
  return ing ? { key: ing.key, kind: ing.kind } : null;
}

// How many of one ingredient a dish wants (0, 1 or 2).
export function countInDish(dish, id) {
  return dish.items.filter((item) => item === id).length;
}

// The exact-match rule: the plate's items, as a multiset, must equal a dish's items.
// Order on the plate does not matter; counts do. Returns the dish or null.
export function matchingDish(plateItems) {
  const have = {};
  for (const item of plateItems) have[item] = (have[item] || 0) + 1;
  for (const dish of DISHES) {
    const want = {};
    for (const item of dish.items) want[item] = (want[item] || 0) + 1;
    const keys = new Set([...Object.keys(have), ...Object.keys(want)]);
    let same = true;
    for (const key of keys) {
      if ((have[key] || 0) !== (want[key] || 0)) { same = false; break; }
    }
    if (same) return dish;
  }
  return null;
}

// How browned a patty side is, 0 (raw) to 1 (fully browned), from seconds on the grill.
export function sideDoneness(secondsOnGrill, grillSecs) {
  return Math.min(1, Math.max(0, secondsOnGrill / grillSecs));
}

// A patty is done when both sides are browned. It is burnt past its burn time.
export function pattyState(sideA, sideB, totalSecs, burnSecs) {
  if (totalSecs >= burnSecs) return 'burnt';
  if (sideA >= 1 && sideB >= 1) return 'done';
  if (sideA > 0 || sideB > 0) return 'cooking';
  return 'raw';
}

// Fries are done at frySecs; past burnSecs they are burnt. Evenness 0..1 drops
// when the cook forgets to shake them — uneven fries still serve, but score less.
export function fryState(secondsInOil, burnSecs) {
  if (secondsInOil >= burnSecs) return 'burnt';
  if (secondsInOil >= 5) return 'done';
  if (secondsInOil > 0) return 'frying';
  return 'raw';
}
