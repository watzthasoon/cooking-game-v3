// Input for The Copper Kettle v3: mouse clicks and keyboard.
// Clicks hit stations, the plate, SERVE / CLEAR, customers (serve to them),
// and the title / game-over buttons. Keys: 1-8 stations, F flip, S serve or
// shake the fries, C clear, Space start/restart, M mute, arrows cycle highlight.

import { stationRect, PLATE, SERVE_BTN, CLEAR_BTN, CUSTOMER_SEATS, inside, insideCircle, bubbleRect } from './layout.js';
import { INGREDIENTS } from './recipes.js';

// The station (if any) under a canvas point, or null.
export function stationAt(px, py) {
  for (let i = 0; i < 8; i++) {
    if (inside(px, py, stationRect(i))) return INGREDIENTS[i].id;
  }
  return null;
}

export function attachInput(canvas, game, actions) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const px = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const py = (ev.clientY - rect.top) * (canvas.height / rect.height);
    handleClick(game, actions, px, py);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key === ' ') {
      ev.preventDefault();
      actions.startOrRestart();
      return;
    }
    if (game.screen !== 'playing') return;
    if (key >= '1' && key <= '8') {
      const ing = INGREDIENTS[Number(key) - 1];
      if (ing) actions.station(ing.id);
    } else if (key === 'f') {
      actions.flip();
    } else if (key === 's') {
      actions.serveOrShake();
    } else if (key === 'c') {
      actions.clearPlate();
    } else if (key === 'm') {
      actions.toggleMute();
    } else if (key === 'arrowright' || key === 'arrowleft') {
      actions.cycleHighlight(key === 'arrowright' ? 1 : -1);
    }
  });
}

function handleClick(game, actions, px, py) {
  if (game.screen === 'title') {
    // START COOKING button.
    if (px >= 520 && px <= 760 && py >= 410 && py <= 462) actions.startOrRestart();
    return;
  }
  if (game.screen === 'gameover') {
    if (px >= 520 && px <= 760 && py >= 410 && py <= 462) actions.startOrRestart();
    return;
  }
  if (game.screen !== 'playing') return;

  // SERVE / CLEAR buttons.
  if (inside(px, py, SERVE_BTN)) { actions.serve(); return; }
  if (inside(px, py, CLEAR_BTN)) { actions.clearPlate(); return; }

  // The plate: click to take the last item off.
  if (insideCircle(px, py, PLATE)) { actions.popPlate(); return; }

  // A customer (or their bubble): serve to them.
  for (const cust of game.customers) {
    const seat = CUSTOMER_SEATS[cust.seat];
    if (!seat) continue;
    const body = { x: seat.x, y: seat.y, w: seat.w, h: seat.h };
    const bub = bubbleRect(seat);
    if (inside(px, py, body) || inside(px, py, bub)) {
      actions.serveTo(cust.id);
      return;
    }
  }

  // Stations.
  const hit = stationAt(px, py);
  if (hit) {
    actions.station(hit);
    return;
  }
}
