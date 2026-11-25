[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/watzthasoon/cooking-game-v3/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/watzthasoon/cooking-game-v3/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# The Copper Kettle v3 — a realistic kitchen rush

A complete original 2D canvas cooking game for the
[best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137)
on [make.fun](https://make.fun). Static files, offline, keyboard + mouse.

## What is new in v3 — more realistic

- **A real kitchen:** wooden counter with grain, subway-tile backsplash, a window
  with warm light, hanging copper pans, a sink. Steam rises from hot food, the
  grill sizzles, the fryer oil bubbles.
- **Real cooking, step by step:** a patty browns one side at a time — **flip it**
  (click / F) to brown the other side, and each side visibly darkens. Fries need
  a **shake** while frying or they cook unevenly. Chopping splits vegetables into
  visible pieces. Cheese **melts and drips** on a hot patty. A drink is **poured**
  with a rising fill level. Food left too long cools down (the steam stops).
- **Real customers:** five detailed people (Maya, Bobo, Luna, Kiko, Sari) who
  walk in, take a seat, order from a speech bubble, and react — delighted,
  impatient, sad, angry. After being served they **eat the dish** (three bites,
  the plate visibly shrinks) and leave a **tip** in coins for a fast serve
  (up to +15 on top of the dish points).
- **Real sounds:** sizzle on the grill and fryer, chop thuds, a pour gurgle, a
  serve ding, happy chimes — all synthesized with WebAudio, no audio files.
- **Cooking Mama-style feedback, grounded in the kitchen:** sparkle bursts,
  "!" pops on mistakes, hearts on a perfect serve, a grade popup
  ("Wonderful!" / "Excellent!" / "Good" / "Try Again"), a gold combo meter.

## How to play

- Orders appear on the chalkboard and above each customer, with a patience bar.
- Click a station (or press 1–8) to cook: bun, patty (grill), lettuce / tomato /
  onion (chop twice), cheese, fries (fryer — shake with S), drink (pour).
- Flip the patty (click the grill again, or F) so both sides brown. Take it when
  both sides are done; a burnt patty gets tossed.
- Build the dish on the plate (bottom to top). Click the plate to take the last
  item off, C clears it.
- When the plate matches a ticket exactly, SERVE turns green. Click SERVE, press
  S, or click the customer. Fast serves earn bigger tips.
- Combo grows on consecutive serves. Level up every 5 serves. 3 missed orders
  ends the shift. Space restarts. M mutes.

## The dishes

Sunrise Burger (100), Garden Stack (120), Classic Burger (100), Cheesy Melt
(110), Fresh Garden Salad (80), Crispy Basket (60), Kettle Feast (160).

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

## Files

- `game/index.html` — the page + 1280×720 canvas.
- `game/src/` — main (loop), recipes, customers, kitchen (realistic cooking),
  orders (scoring/tips), effects (steam, sparkles, hearts), audio (WebAudio),
  render (realistic drawing), layout, input, random, shots.
- `main.ts` — builds `dist/` (game + screenshots + dossier.json).
- `screenshots/` — 4 real renders of the running game.
