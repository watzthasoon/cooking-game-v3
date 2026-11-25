// Geometry for The Copper Kettle v3. The renderer and the input handler both read
// these rects, so a click and a drawing always agree on where a station is.
// Canvas: 1280 x 720. The kitchen reads top to bottom: header, customers at the
// counter, the main work area (order board / counter / recipe book), the pass
// (plate + serve), and a footer of hints.

export const W = 1280;
export const H = 720;

// Header bar: title, score, served, combo, level, missed.
export const HEADER = { x: 0, y: 0, w: 1280, h: 48 };

// Customer strip: the far side of the counter. Customers sit here, each with a
// speech bubble above them. Three seats fit comfortably.
export const CUSTOMER_STRIP = { x: 0, y: 48, w: 1280, h: 168 };
export const CUSTOMER_SEATS = [
  { x: 300, y: 96, w: 220, h: 120 },   // seat 0 (left)
  { x: 560, y: 96, w: 220, h: 120 },   // seat 1 (centre)
  { x: 820, y: 96, w: 220, h: 120 },   // seat 2 (right)
];
// A speech bubble sits above each seated customer.
export function bubbleRect(seat) {
  return { x: seat.x - 20, y: seat.y - 44, w: 260, h: 46 };
}

// Main work area.
export const MAIN_Y = 216;
export const MAIN_H = 304; // 216 .. 520

// Order board (chalkboard on the tiled wall, left).
export const BOARD = { x: 12, y: 228, w: 224, h: 292 };
// A ticket on the board. Tickets stack from the top of the board.
export const TICKET_W = 200;
export const TICKET_H = 84;
export const TICKET_GAP = 10;
export function ticketRect(index) {
  return { x: BOARD.x + 12, y: BOARD.y + 34 + index * (TICKET_H + TICKET_GAP), w: TICKET_W, h: TICKET_H };
}

// Counter (wooden, middle). Eight stations in two rows of four.
export const COUNTER = { x: 248, y: 228, w: 764, h: 292 };
export const STATION_W = 182;
export const STATION_H = 140;
export const STATION_GAP = 12;
export const STATION_IDS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion', 'fries', 'drink'];
export function stationRect(index) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: COUNTER.x + col * (STATION_W + STATION_GAP),
    y: COUNTER.y + row * (STATION_H + STATION_GAP),
    w: STATION_W,
    h: STATION_H,
  };
}
export function stationRectById(id) {
  return stationRect(STATION_IDS.indexOf(id));
}

// Recipe book (menu card, right).
export const RECIPES = { x: 1024, y: 228, w: 244, h: 292 };

// The pass (below the counter): the plate where the dish is assembled, and SERVE.
export const PASS_Y = 532;
export const PASS_H = 116; // 532 .. 648
export const PLATE = { cx: 430, cy: 590, r: 56 }; // plate centre + radius
export const SERVE_BTN = { x: 640, y: 552, w: 220, h: 64 };
export const CLEAR_BTN = { x: 880, y: 552, w: 120, h: 64 };

// Footer hints.
export const FOOTER = { x: 0, y: 648, w: 1280, h: 72 };

// Hit test: is point (px, py) inside rect r?
export function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// The plate's bounding box (for hit-testing the whole pass area).
export function plateRect() {
  return { x: PLATE.cx - PLATE.r - 8, y: PLATE.cy - PLATE.r - 8, w: (PLATE.r + 8) * 2, h: (PLATE.r + 8) * 2 };
}

// Hit test for a circle (the plate).
export function insideCircle(px, py, c) {
  const dx = px - c.cx;
  const dy = py - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}
