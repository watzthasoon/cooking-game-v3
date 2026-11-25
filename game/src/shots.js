// Deterministic screenshot states for The Copper Kettle v3.
// Open game/index.html?shot=<name>&seed=1 and the game sets itself to that
// moment, then sets window.__shotReady so the shot script knows it is safe.
// Shots: start (title over the kitchen), order (a customer ordering),
// cooking (patty browning, fries bubbling, cheese melting), serve (a perfect
// serve: grade popup, the customer eating, hearts, tip coins).

import { makeRng } from './random.js';
import { dishById } from './recipes.js';
import { makeCustomer } from './customers.js';
import { makeOrder } from './orders.js';

export function applyShot(game, query) {
  const params = new URLSearchParams(query);
  const shot = params.get('shot') || 'start';
  const seed = Number(params.get('seed') || 1);
  const rng = makeRng(seed * 7919 + 13);
  game.rng = rng;
  game.screen = 'playing';

  if (shot === 'start') {
    game.screen = 'title';
    seedCustomers(game, rng, 3);
    window.__shotReady = true;
    return;
  }

  if (shot === 'order') {
    startPlaying(game, rng);
    // One customer ordering a Sunrise Burger, patience 48s.
    const cust = spawnCustomerAt(game, rng, 0, 'maya', 'sunrise', 48);
    cust.mood = 'patient';
    cust.x = 0;
    window.__shotReady = true;
    return;
  }

  if (shot === 'cooking') {
    startPlaying(game, rng);
    // Two customers waiting: Maya (41s) and Luna impatient (14s).
    const maya = spawnCustomerAt(game, rng, 0, 'maya', 'sunrise', 41);
    maya.mood = 'patient';
    maya.x = 0;
    const luna = spawnCustomerAt(game, rng, 1, 'luna', 'garden', 14);
    luna.mood = 'impatient';
    luna.x = 0;
    // Patty on the grill, side A mostly browned; fries frying; a bun + cheese
    // already on the plate; lettuce mid-chop.
    game.kitchen.jobs.patty = { kind: 'grill', side: 'A', sideA: 3.2, sideB: 0, total: 3.2 };
    game.kitchen.jobs.fries = { kind: 'fry', secs: 3.1, shakes: 2, evenness: 0.9, sinceShake: 0.4 };
    game.kitchen.jobs.lettuce = { kind: 'chop', chops: 1 };
    game.kitchen.plate = [
      { id: 'bun', hot: false, cooled: false, quality: 'plain', bornAt: 0 },
      { id: 'cheese', hot: false, cooled: false, quality: 'plain', bornAt: 0 },
    ];
    game.score = 120;
    game.served = 1;
    game.combo = 1;
    window.__shotReady = true;
    return;
  }

  if (shot === 'serve') {
    startPlaying(game, rng);
    // Maya delighted after a perfect serve, eating; grade popup + hearts + tip.
    const maya = spawnCustomerAt(game, rng, 0, 'maya', 'sunrise', 33);
    maya.mood = 'eating';
    maya.eaten = 1;
    maya.eatT = 0.9;
    maya.x = 0;
    maya.tip = 12;
    game.score = 312;
    game.served = 2;
    game.combo = 2;
    game.kitchen.plate = [];
    const { showGrade, spawnHearts, spawnSparkles, spawnCoins } = game.fxApi;
    showGrade(game.effects, 'Wonderful!', 'Perfect serve! +158  •  Tip +12 coins');
    spawnHearts(game.effects, 410, 150, 5);
    spawnSparkles(game.effects, 640, 330, 10);
    spawnCoins(game.effects, 410, 170, 5);
    window.__shotReady = true;
    return;
  }

  window.__shotReady = true;
}

function startPlaying(game, rng) {
  game.screen = 'playing';
  game.score = 0;
  game.served = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.level = 1;
  game.missed = 0;
  game.tipsEarned = 0;
  game.time = 0;
  game.customers = [];
  game.orders = [];
  game.kitchen.jobs = {};
  game.kitchen.plate = [];
}

// Two or three customers visible on the title screen (no orders yet).
function seedCustomers(game, rng, n) {
  const defs = ['maya', 'bobo', 'luna'];
  game.customers = [];
  for (let i = 0; i < n; i++) {
    const def = game.customerDefs.find((d) => d.id === defs[i]);
    if (!def) continue;
    const cust = makeCustomer(def, i, null);
    cust.mood = 'patient';
    cust.x = 0;
    game.customers.push(cust);
  }
}

// Spawn a customer at a seat with a fixed order (for deterministic shots).
function spawnCustomerAt(game, rng, seat, defId, dishId, patience) {
  const def = game.customerDefs.find((d) => d.id === defId);
  const dish = dishById(dishId);
  const order = makeOrder('o' + seat + '-' + dishId, 'c' + seat, dishId, patience);
  order.patience = patience;
  const cust = makeCustomer(def, seat, order);
  cust.id = 'c' + seat;
  order.customerId = cust.id;
  game.customers.push(cust);
  game.orders.push(order);
  return cust;
}
