// Seeded random numbers (mulberry32) so screenshots are deterministic.
// Every run with the same seed deals the same customers and the same orders.

// mulberry32: a small fast seeded PRNG with a full 32-bit period.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element from an array using the seeded rng.
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Return a new array with the elements shuffled (Fisher-Yates, seeded).
export function shuffle(rng, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

// A number in [min, max) from the seeded rng.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// An integer in [min, max] from the seeded rng.
export function intRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// True with probability p (0..1) from the seeded rng.
export function chance(rng, p) {
  return rng() < p;
}
