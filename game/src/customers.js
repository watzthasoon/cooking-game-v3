// Customers for The Copper Kettle v3 — five detailed, original people.
// Each one walks in, takes a seat at the counter, orders from a speech bubble,
// reacts while they wait, EATS the dish when served (three visible bites), leaves
// a TIP in coins, and goes. Their faces are drawn from canvas paths in render.js;
// this file holds their looks, their moods and their lifecycle.

// Moods: arriving (sliding in), patient, impatient, delighted, sad, angry,
// eating (three bites), tipping (coins floating up), leaving.
export const MOODS = ['arriving', 'patient', 'impatient', 'delighted', 'sad', 'angry', 'eating', 'tipping', 'leaving'];

export const CUSTOMER_DEFS = [
  {
    id: 'maya', name: 'Maya', skin: '#f2c29b', skinShade: '#d9a06f',
    hair: 'bun', hairColor: '#a63a2e', hairStyle: 'Red hair in a bun',
    top: '#f4c542', topShade: '#d9a91f', blurb: 'Yellow dress, red bun',
    face: { eye: '#4a2c14', brow: '#a63a2e', lip: '#c25a4a' },
  },
  {
    id: 'bobo', name: 'Bobo', skin: '#8a5a3b', skinShade: '#6f4527',
    hair: 'cap', hairColor: '#2e6fb0', hairStyle: 'Blue cap, short dark hair',
    top: '#4a9e5c', topShade: '#357a45', blurb: 'Green shirt, blue cap',
    face: { eye: '#241708', brow: '#241708', lip: '#7a3b2e' },
  },
  {
    id: 'luna', name: 'Luna', skin: '#f7d7c4', skinShade: '#e0b596',
    hair: 'bob', hairColor: '#6b4a8a', hairStyle: 'Purple bob, round glasses',
    top: '#e58bb1', topShade: '#c96a93', blurb: 'Pink top, purple bob',
    face: { eye: '#3a2a4a', brow: '#6b4a8a', lip: '#b04a6a' },
  },
  {
    id: 'kiko', name: 'Kiko', skin: '#e8b88a', skinShade: '#cf9c66',
    hair: 'spiky', hairColor: '#1c1c22', hairStyle: 'Spiky black hair, kid',
    top: '#e87a2e', topShade: '#c25f1c', blurb: 'Orange shirt, kid',
    face: { eye: '#1c1c22', brow: '#1c1c22', lip: '#a04a3a' },
  },
  {
    id: 'sari', name: 'Sari', skin: '#c98d5f', skinShade: '#a96f42',
    hair: 'long', hairColor: '#2a1a12', hairStyle: 'Long dark hair',
    top: '#2e8a8a', topShade: '#1f6a6a', blurb: 'Teal dress, long dark hair',
    face: { eye: '#241708', brow: '#2a1a12', lip: '#8a3a4a' },
  },
];

export function customerDefById(id) {
  return CUSTOMER_DEFS.find((def) => def.id === id);
}

// The customers in the order they first appear at the counter.
export function customerDefsInOrder() {
  return CUSTOMER_DEFS.slice();
}

// A live customer sitting at a seat. `order` is the order object from orders.js
// (dish, patience). `eaten` counts the bites taken (0..3). `tip` is the coins
// they leave, set when they finish eating.
export function makeCustomer(def, seatIndex, order) {
  return {
    id: def.id + '-' + Math.random().toString(36).slice(2, 7),
    def,
    seat: seatIndex,
    mood: 'arriving',
    moodT: 0,
    order,
    eaten: 0,
    eatT: 0,
    tip: 0,
    tipT: 0,
    x: -260, // slides in from the left
    targetX: 0,
  };
}

// Mood from patience: under 30% the customer is impatient; under 12% they are
// furious (the renderer draws the sweat drop / steam).
export function moodForPatience(patience, patienceMax) {
  const frac = patienceMax > 0 ? patience / patienceMax : 0;
  if (frac <= 0.12) return 'angry';
  if (frac <= 0.30) return 'impatient';
  return 'patient';
}

// Tip in coins: a fast serve earns more. Base 5, up to +10 for speed.
export function tipForServe(secondsLeft, patienceMax) {
  const frac = patienceMax > 0 ? secondsLeft / patienceMax : 0;
  return 5 + Math.round(frac * 10);
}

// The three bites of eating, spread over ~2.4s. Returns true when finished.
export function eatStep(customer, dt) {
  customer.eatT += dt;
  const want = Math.min(3, Math.floor(customer.eatT / 0.8));
  if (want > customer.eaten) {
    customer.eaten = want;
    return customer.eaten >= 3;
  }
  return customer.eaten >= 3;
}
