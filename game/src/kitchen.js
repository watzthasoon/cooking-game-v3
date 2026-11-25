// The kitchen: eight stations, realistic multi-step cooking, and the plate.
// Every ingredient has visible states (raw -> cooking -> done -> burnt) and the
// cook's actions change them: flip the patty, shake the fries, chop the vegetables,
// melt the cheese on a hot patty, pour the drink. Food left on the plate cools.

import { INGREDIENTS, ingredientById, sideDoneness, pattyState, fryState } from './recipes.js';

// A job running on a station. `kind` matches the ingredient kind.
//   grill: { side: 'A'|'B', sideA, sideB, total } — seconds per side + total
//   fry:   { secs, shakes, evenness, sinceShake } — evenness 0..1, drops without shakes
//   chop:  { chops } — 0..2 chops done
//   pour:  { fill } — 0..1, rises while pouring
export function makeKitchen() {
  return {
    jobs: {}, // station id -> job or null
    plate: [], // { id, hot, cooled, quality, bornAt } — bottom to top
    plateBorn: 0,
  };
}

export function stationJob(kitchen, id) {
  return kitchen.jobs[id] || null;
}

// --- Station actions -------------------------------------------------------

// Click (or press the key) on a station. Returns an event string the main loop
// turns into sound/effects: 'take' | 'start' | 'flip' | 'shake' | 'chop' |
// 'done' | 'burnt' | 'pour' | 'nothing'. `now` is the game clock (seconds).
export function clickStation(kitchen, id, now) {
  const ing = ingredientById(id);
  if (!ing) return 'nothing';
  const job = kitchen.jobs[id];

  if (ing.kind === 'instant') {
    // Bun and cheese are taken ready. Cheese melts only on a hot patty.
    const hotPatty = kitchen.plate.some((p) => p.id === 'patty' && p.hot && !p.cooled);
    addToPlate(kitchen, id, { hot: false, quality: id === 'cheese' && hotPatty ? 'melted' : 'plain' }, now);
    return 'take';
  }

  if (ing.kind === 'grill') {
    if (!job) {
      kitchen.jobs[id] = { kind: 'grill', side: 'A', sideA: 0, sideB: 0, total: 0 };
      return 'start';
    }
    const state = pattyState(job.sideA, job.sideB, job.total, ing.burnSecs);
    if (state === 'burnt') {
      kitchen.jobs[id] = null;
      return 'burnt'; // tossed
    }
    if (state === 'done') {
      kitchen.jobs[id] = null;
      addToPlate(kitchen, id, { hot: true, quality: 'done' }, now);
      return 'take';
    }
    // Flip: the side that was down keeps its doneness; the other side starts cooking.
    job.side = job.side === 'A' ? 'B' : 'A';
    return 'flip';
  }

  if (ing.kind === 'fry') {
    if (!job) {
      kitchen.jobs[id] = { kind: 'fry', secs: 0, shakes: 0, evenness: 1, sinceShake: 0 };
      return 'start';
    }
    const state = fryState(job.secs, ing.burnSecs);
    if (state === 'burnt') {
      kitchen.jobs[id] = null;
      return 'burnt';
    }
    if (state === 'done') {
      kitchen.jobs[id] = null;
      addToPlate(kitchen, id, { hot: true, quality: job.evenness >= 0.5 ? 'even' : 'uneven' }, now);
      return 'take';
    }
    // Shake: evens the cooking out again.
    job.shakes += 1;
    job.sinceShake = 0;
    job.evenness = Math.min(1, job.evenness + 0.3);
    return 'shake';
  }

  if (ing.kind === 'chop') {
    if (!job) {
      kitchen.jobs[id] = { kind: 'chop', chops: 0 };
      return 'start';
    }
    if (job.chops < ing.chops) {
      job.chops += 1;
      if (job.chops >= ing.chops) return 'done';
      return 'chop';
    }
    kitchen.jobs[id] = null;
    addToPlate(kitchen, id, { hot: false, quality: 'chopped' }, now);
    return 'take';
  }

  if (ing.kind === 'pour') {
    if (!job) {
      kitchen.jobs[id] = { kind: 'pour', fill: 0 };
      return 'start';
    }
    if (job.fill >= 1) {
      kitchen.jobs[id] = null;
      addToPlate(kitchen, id, { hot: false, quality: 'full' }, now);
      return 'take';
    }
    return 'pour'; // still filling; wait for it
  }

  return 'nothing';
}

// --- Plate -----------------------------------------------------------------

function addToPlate(kitchen, id, opts, now) {
  kitchen.plate.push({
    id,
    hot: !!opts.hot,
    cooled: false,
    quality: opts.quality || 'plain',
    bornAt: now,
  });
}

export function plateItems(kitchen) {
  return kitchen.plate.map((p) => p.id);
}

// Remove the last item from the plate (click the plate).
export function popPlate(kitchen) {
  return kitchen.plate.pop() || null;
}

export function clearPlate(kitchen) {
  kitchen.plate = [];
}

// A plate item is hot while it steams; after ~20s on the pass it cools and dulls.
export const COOL_AFTER = 20;
export function plateIsHot(item, now) {
  return item.hot && !item.cooled && now - item.bornAt < COOL_AFTER;
}

// --- Tick: advance every running job and cool the plate --------------------

export function tickKitchen(kitchen, dt, now) {
  for (const id of Object.keys(kitchen.jobs)) {
    const job = kitchen.jobs[id];
    const ing = ingredientById(id);
    if (!job || !ing) continue;
    if (job.kind === 'grill') {
      if (job.side === 'A') job.sideA += dt;
      else job.sideB += dt;
      job.total += dt;
    } else if (job.kind === 'fry') {
      job.secs += dt;
      job.sinceShake += dt;
      // Without a shake the fries cook unevenly: evenness bleeds away — but
      // once they are done, the evenness is locked in for the score.
      const done = job.secs >= ing.frySecs;
      if (!done && job.sinceShake > 2) job.evenness = Math.max(0, job.evenness - 0.15 * dt);
    } else if (job.kind === 'pour') {
      job.fill = Math.min(1, job.fill + dt / ing.pourSecs);
    }
  }
  // Cool the plate: hot items stop steaming after COOL_AFTER seconds.
  for (const item of kitchen.plate) {
    if (item.hot && now - item.bornAt >= COOL_AFTER) item.cooled = true;
  }
}

// --- Readable state for the renderer ---------------------------------------

// How browned is each side of the patty on the grill (0..1), and its state.
export function grillView(kitchen) {
  const job = kitchen.jobs.patty;
  if (!job) return null;
  const ing = ingredientById('patty');
  return {
    sideA: sideDoneness(job.sideA, ing.grillSecs),
    sideB: sideDoneness(job.sideB, ing.grillSecs),
    side: job.side,
    state: pattyState(job.sideA, job.sideB, job.total, ing.burnSecs),
    total: job.total,
  };
}

export function fryView(kitchen) {
  const job = kitchen.jobs.fries;
  if (!job) return null;
  const ing = ingredientById('fries');
  return {
    secs: job.secs,
    evenness: job.evenness,
    state: fryState(job.secs, ing.burnSecs),
    progress: Math.min(1, job.secs / ing.frySecs),
  };
}

export function chopView(kitchen, id) {
  const job = kitchen.jobs[id];
  if (!job) return null;
  return { chops: job.chops, total: ingredientById(id).chops };
}

export function pourView(kitchen) {
  const job = kitchen.jobs.drink;
  if (!job) return null;
  return { fill: job.fill, done: job.fill >= 1 };
}
