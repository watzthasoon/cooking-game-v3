// The Copper Kettle v3 — game loop, state machine and wiring.
// Title -> playing -> game over. The loop clamps dt (a tighter clamp made game
// time crawl under headless software rendering), ticks the kitchen, the customers
// and the effects, and turns every click/key into a cooking action.

import { makeRng, pick } from './random.js';
import { INGREDIENTS, DISHES, dishById, matchingDish, dishesByPoints } from './recipes.js';
import { CUSTOMER_DEFS, makeCustomer, moodForPatience, tipForServe, eatStep } from './customers.js';
import { makeKitchen, clickStation, tickKitchen, plateItems, popPlate, clearPlate, plateIsHot, grillView, fryView } from './kitchen.js';
import { makeOrder, pickDish, patienceForLevel, serveOrder, gradeForServe, plateQuality, levelForServes, maxCustomersForLevel, gapForLevel } from './orders.js';
import { makeEffects, spawnSteam, spawnSizzle, spawnBubble, spawnSparkles, spawnHearts, spawnSmoke, spawnPop, spawnCoins, showGrade, flash, tickEffects } from './effects.js';
import { makeAudio, playPop, playChop, playFlip, playPour, playDing, playChime, playSad, playBuzz, playArrive, playFanfare, playMunch, playCoin, setSizzle, toggleMute } from './audio.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';
import { stationRectById, PLATE } from './layout.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function makeGame() {
  return {
    screen: 'title', // 'title' | 'playing' | 'gameover'
    time: 0,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    level: 1,
    missed: 0,
    tipsEarned: 0,
    customers: [],
    orders: [],
    kitchen: makeKitchen(),
    effects: makeEffects(),
    audio: makeAudio(),
    highlight: null,
    muted: false,
    matchDish: null,
    dishesByPoints: dishesByPoints(),
    customerDefs: CUSTOMER_DEFS,
    rng: makeRng(1),
    nextOrderId: 1,
    spawnT: 0,
    sizzleT: 0,
    fxApi: { showGrade, spawnHearts, spawnSparkles, spawnCoins },
  };
}

const game = makeGame();

// Expose the live game for the maker's own play-tests and screenshots
// (window.__game). The shipped game never reads it; it is a test hook only.
window.__game = game;

// --- Starting and ending a shift -------------------------------------------

function startGame() {
  const g = game;
  g.screen = 'playing';
  g.time = 0;
  g.score = 0;
  g.served = 0;
  g.combo = 0;
  g.bestCombo = 0;
  g.level = 1;
  g.missed = 0;
  g.tipsEarned = 0;
  g.customers = [];
  g.orders = [];
  g.kitchen = makeKitchen();
  g.effects = makeEffects();
  g.rng = makeRng((Date.now() % 100000) + 7);
  g.nextOrderId = 1;
  g.spawnT = 0;
  g.highlight = null;
  g.matchDish = null;
  spawnCustomer();
  spawnCustomer();
  playArrive(g.audio);
}

function endGame() {
  game.screen = 'gameover';
  setSizzle(game.audio, false);
  playSad(game.audio);
}

// --- Customers ---------------------------------------------------------------

function freeSeat() {
  const used = new Set(game.customers.map((c) => c.seat));
  for (let i = 0; i < 3; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

function spawnCustomer() {
  const g = game;
  if (g.customers.length >= maxCustomersForLevel(g.level)) return;
  const seat = freeSeat();
  if (seat < 0) return;
  // Pick a customer not already seated.
  const seated = new Set(g.customers.map((c) => c.def.id));
  const defs = CUSTOMER_DEFS.filter((d) => !seated.has(d.id));
  const def = pick(g.rng, defs.length ? defs : CUSTOMER_DEFS);
  const dish = pickDish(g.rng, g.level, DISHES);
  const patienceMax = patienceForLevel(g.level, g.rng);
  const order = makeOrder('o' + g.nextOrderId++, 'pending', dish.id, patienceMax);
  const cust = makeCustomer(def, seat, order);
  order.customerId = cust.id;
  g.customers.push(cust);
  g.orders.push(order);
  playArrive(g.audio);
}

function removeCustomer(cust) {
  game.customers = game.customers.filter((c) => c !== cust);
  game.orders = game.orders.filter((o) => o.customerId !== cust.id);
}

// --- Serving -----------------------------------------------------------------

function serveToCustomer(customerId) {
  const g = game;
  if (g.screen !== 'playing') return;
  const cust = g.customers.find((c) => c.id === customerId);
  if (!cust || !cust.order || cust.order.state !== 'waiting') return;
  const order = cust.order;
  const result = serveOrder(order, g.kitchen.plate, order.patience, g.combo);
  if (!result) {
    // Wrong dish: refused, plate kept, a red "!" and a buzz.
    playBuzz(g.audio);
    const seat = cust.seat;
    spawnPop(g.effects, 410 + seat * 260, 260, '!');
    return;
  }
  // Served: score, grade, effects, and the customer starts eating.
  // Quality is read BEFORE the plate is cleared.
  const quality = plateQuality(g.kitchen.plate, g.time);
  order.state = 'served';
  g.orders = g.orders.filter((o) => o !== order);
  g.kitchen.plate = [];
  g.score += result.points;
  g.served += 1;
  g.combo += 1;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  g.level = levelForServes(g.served);
  const grade = gradeForServe(order.patience, order.patienceMax, quality);
  const perfect = grade === 'Wonderful!';
  showGrade(g.effects, grade, `${result.dish.name} served! +${result.points} pts`);
  const seatX = 410 + cust.seat * 260;
  spawnSparkles(g.effects, seatX, 200, perfect ? 12 : 6);
  if (perfect) {
    spawnHearts(g.effects, seatX, 180, 4);
    flash(g.effects, '#ffd94a');
    playChime(g.audio);
  } else {
    playDing(g.audio);
  }
  cust.mood = 'delighted';
  cust.moodT = 0;
  cust.eatT = 0;
  cust.eaten = 0;
  if (g.served % 5 === 0) playFanfare(g.audio);
}

function serveAny() {
  // Serve to the first waiting customer whose dish matches the plate.
  const g = game;
  const plate = plateItems(g.kitchen);
  const dish = matchingDish(plate);
  if (!dish) {
    playBuzz(g.audio);
    spawnPop(g.effects, 640, 560, '!');
    return;
  }
  const cust = g.customers.find((c) => c.order && c.order.state === 'waiting' && c.order.dishId === dish.id);
  if (!cust) {
    playBuzz(g.audio);
    spawnPop(g.effects, 640, 560, '!');
    return;
  }
  serveToCustomer(cust.id);
}

// --- Station actions ---------------------------------------------------------

function doStation(id) {
  const g = game;
  if (g.screen !== 'playing') return;
  g.highlight = id;
  const ev = clickStation(g.kitchen, id, g.time);
  const rect = stationRectById(id);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 82;
  if (ev === 'take') {
    playPop(g.audio);
    spawnSparkles(g.effects, cx, cy, 3);
  } else if (ev === 'chop') {
    playChop(g.audio);
  } else if (ev === 'done') {
    playChop(g.audio);
    spawnSparkles(g.effects, cx, cy, 4);
  } else if (ev === 'flip') {
    playFlip(g.audio);
  } else if (ev === 'shake') {
    playPop(g.audio);
    spawnSizzle(g.effects, cx, cy - 10, 3);
  } else if (ev === 'burnt') {
    playBuzz(g.audio);
    spawnSmoke(g.effects, cx, cy - 10, 4);
    spawnPop(g.effects, cx, cy - 30, '!');
  } else if (ev === 'pour') {
    playPour(g.audio);
  } else if (ev === 'start') {
    playPop(g.audio);
  }
  refreshMatch();
}

function refreshMatch() {
  const g = game;
  const dish = matchingDish(plateItems(g.kitchen));
  if (!dish) { g.matchDish = null; return; }
  const waiting = g.orders.some((o) => o.state === 'waiting' && o.dishId === dish.id);
  g.matchDish = waiting ? dish : null;
}

// --- The tick ----------------------------------------------------------------

function tick(dt) {
  const g = game;
  g.time += dt;
  tickEffects(g.effects, dt);
  if (g.screen !== 'playing') return;

  tickKitchen(g.kitchen, dt, g.time);

  // Ambient steam + sizzle from the heat.
  g.sizzleT -= dt;
  const grill = grillView(g.kitchen);
  const fry = fryView(g.kitchen);
  const heating = (grill && grill.state === 'cooking') || (fry && fry.state === 'frying');
  setSizzle(g.audio, !!heating);
  if (g.sizzleT <= 0) {
    g.sizzleT = 0.28;
    if (grill && grill.state === 'cooking') {
      const r = stationRectById('patty');
      spawnSizzle(g.effects, r.x + r.w / 2, r.y + 70, 1);
      spawnSteam(g.effects, r.x + r.w / 2, r.y + 60, 1);
    }
    if (fry && fry.state === 'frying') {
      const r = stationRectById('fries');
      spawnBubble(g.effects, r.x + r.w / 2, r.y + 78, 2);
    }
    // Steam off hot food on the plate.
    for (const item of g.kitchen.plate) {
      if (plateIsHot(item, g.time) && Math.random() < 0.5) {
        spawnSteam(g.effects, PLATE.cx, PLATE.cy - 20, 1);
      }
    }
  }

  // Customers: slide in, wait, eat, tip, leave; patience drains.
  for (const cust of [...g.customers]) {
    cust.moodT += dt;
    if (cust.mood === 'arriving') {
      cust.x = Math.min(0, (cust.x || -260) + dt * 520);
      if (cust.x >= 0) {
        cust.x = 0;
        cust.mood = 'patient';
        cust.moodT = 0;
      }
      continue;
    }
    if (cust.mood === 'delighted') {
      if (cust.moodT > 0.6) {
        cust.mood = 'eating';
        cust.eatT = 0;
        cust.eaten = 0;
      }
      continue;
    }
    if (cust.mood === 'eating') {
      const before = cust.eaten;
      const done = eatStep(cust, dt);
      if (cust.eaten > before) playMunch(g.audio);
      if (done) {
        cust.mood = 'tipping';
        cust.moodT = 0;
        const tip = tipForServe(cust.order.patience, cust.order.patienceMax);
        cust.tip = tip;
        g.score += tip;
        g.tipsEarned += tip;
        const seatX = 410 + cust.seat * 260;
        spawnCoins(g.effects, seatX, 170, 4);
        playCoin(g.audio);
      }
      continue;
    }
    if (cust.mood === 'tipping') {
      if (cust.moodT > 1.2) {
        cust.mood = 'leaving';
        cust.moodT = 0;
      }
      continue;
    }
    if (cust.mood === 'sad' || cust.mood === 'angry') {
      // Only after the order is already missed: wait, then leave. While the
      // order is still waiting, fall through to the waiting branch below so
      // patience keeps draining and the miss still registers.
      if (!cust.order || cust.order.state !== 'waiting') {
        if (cust.moodT > 1.5) {
          cust.mood = 'leaving';
          cust.moodT = 0;
        }
        continue;
      }
    }
    if (cust.mood === 'leaving') {
      if (cust.moodT > 0.5) removeCustomer(cust);
      continue;
    }
    // Waiting (patient / impatient / angry while still waiting): patience
    // drains; the mood follows it; a miss is counted the moment it hits 0.
    const order = cust.order;
    if (order && order.state === 'waiting') {
      order.patience -= dt;
      cust.mood = moodForPatience(order.patience, order.patienceMax);
      if (order.patience <= 0) {
        order.state = 'missed';
        g.orders = g.orders.filter((o) => o !== order);
        g.missed += 1;
        g.combo = 0;
        cust.mood = cust.mood === 'angry' ? 'angry' : 'sad';
        cust.moodT = 0;
        playSad(g.audio);
        const seatX = 410 + cust.seat * 260;
        spawnPop(g.effects, seatX, 200, '!');
        if (g.missed >= 3) endGame();
      }
    }
  }

  // Spawn the next customer when a seat is free.
  g.spawnT -= dt;
  if (g.spawnT <= 0 && g.customers.length < maxCustomersForLevel(g.level)) {
    spawnCustomer();
    g.spawnT = gapForLevel(g.level);
  }

  refreshMatch();
}

// --- Wiring ------------------------------------------------------------------

const actions = {
  station: (id) => doStation(id),
  flip: () => {
    if (game.screen !== 'playing') return;
    doStation('patty');
  },
  serveOrShake: () => {
    if (game.screen !== 'playing') return;
    // S shakes the fries while they are frying; otherwise it serves.
    const fry = fryView(game.kitchen);
    if (fry && fry.state === 'frying') doStation('fries');
    else serveAny();
  },
  serve: () => serveAny(),
  serveTo: (id) => serveToCustomer(id),
  clearPlate: () => {
    if (game.screen !== 'playing') return;
    clearPlate(game.kitchen);
    refreshMatch();
    playPop(game.audio);
  },
  popPlate: () => {
    if (game.screen !== 'playing') return;
    popPlate(game.kitchen);
    refreshMatch();
    playPop(game.audio);
  },
  startOrRestart: () => {
    if (game.screen === 'playing') return;
    startGame();
  },
  toggleMute: () => {
    game.muted = toggleMute(game.audio);
  },
  cycleHighlight: (dir) => {
    const ids = INGREDIENTS.map((i) => i.id);
    const cur = game.highlight ? ids.indexOf(game.highlight) : -1;
    const next = (cur + dir + ids.length) % ids.length;
    game.highlight = ids[next];
  },
};

attachInput(canvas, game, actions);

// Screenshot states (?shot=...&seed=1) for the maker.
const query = window.location.search;
if (query.includes('shot=')) {
  applyShot(game, query);
}

// --- Main loop ---------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
  last = now;
  tick(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
