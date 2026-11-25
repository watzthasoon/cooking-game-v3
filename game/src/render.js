// Realistic rendering for The Copper Kettle v3. Everything is drawn from canvas
// paths with gradients, highlights, shadows and texture — no image files. Food
// browns, melts, bubbles and steams; the kitchen has wood grain, subway tiles,
// hanging pans and warm window light; customers have faces that change with mood.

import { W, H, HEADER, CUSTOMER_STRIP, CUSTOMER_SEATS, bubbleRect, BOARD, ticketRect, COUNTER, stationRect, stationRectById, RECIPES, PLATE, SERVE_BTN, CLEAR_BTN, FOOTER, inside } from './layout.js';
import { INGREDIENTS, ingredientById, dishById } from './recipes.js';
import { grillView, fryView, chopView, pourView } from './kitchen.js';

// --- Small drawing helpers -------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx, cx, cy, r, stops) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function softShadow(ctx, cx, cy, rx, ry, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(20,10,5,${alpha})`;
  ellipse(ctx, cx, cy, rx, ry);
  ctx.fill();
  ctx.restore();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

// --- The kitchen backdrop --------------------------------------------------

function drawBackdrop(ctx, game) {
  // Warm plaster wall.
  ctx.fillStyle = '#e8d9bd';
  ctx.fillRect(0, 0, W, H);

  // Subway-tile backsplash behind the work area.
  ctx.save();
  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(0, MAIN_TOP, W, 304);
  ctx.strokeStyle = 'rgba(120,100,70,0.35)';
  ctx.lineWidth = 1;
  const tw = 64, th = 32;
  for (let y = MAIN_TOP; y < MAIN_TOP + 304; y += th) {
    for (let x = -((y / th) % 2) * tw / 2; x < W; x += tw) {
      ctx.strokeRect(x, y, tw, th);
    }
  }
  ctx.restore();

  // A window with warm afternoon light (top right of the wall).
  ctx.save();
  rr(ctx, 1060, 60, 180, 120, 8);
  ctx.fillStyle = '#ffe9a8';
  ctx.fill();
  ctx.fillStyle = '#ffdf7e';
  ctx.fillRect(1060, 60, 180, 120);
  ctx.strokeStyle = '#7a5a34';
  ctx.lineWidth = 6;
  ctx.strokeRect(1060, 60, 180, 120);
  ctx.beginPath();
  ctx.moveTo(1150, 60); ctx.lineTo(1150, 180);
  ctx.moveTo(1060, 120); ctx.lineTo(1240, 120);
  ctx.stroke();
  // Sun glow + a soft cloud, so the window reads as warm afternoon light.
  ctx.fillStyle = 'rgba(255, 240, 170, 0.55)';
  ellipse(ctx, 1120, 100, 26, 26);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ellipse(ctx, 1180, 150, 22, 10);
  ctx.fill();
  ellipse(ctx, 1196, 146, 16, 9);
  ctx.fill();
  ctx.restore();

  // Hanging copper and steel pans on the wall (left).
  drawPan(ctx, 60, 120, '#b87333', '#8a5222');
  drawPan(ctx, 120, 112, '#c8c8c8', '#8f8f8f');
  drawPan(ctx, 180, 122, '#b87333', '#8a5222');

  // The wooden counter (front face + top) with grain.
  const c = COUNTER;
  ctx.save();
  ctx.fillStyle = '#7a4a26';
  rr(ctx, c.x - 8, c.y + c.h - 26, c.w + 16, 34, 6);
  ctx.fill();
  ctx.fillStyle = lin(ctx, c.x, c.y, c.x, c.y + c.h, [[0, '#a9713d'], [0.7, '#8a5a2e'], [1, '#6f4522']]);
  rr(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  // Wood grain lines.
  ctx.strokeStyle = 'rgba(90,50,20,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    const gy = c.y + 22 + i * 40 + Math.sin(i * 2.4) * 6;
    ctx.beginPath();
    ctx.moveTo(c.x + 8, gy);
    ctx.bezierCurveTo(c.x + 200, gy + 6, c.x + 500, gy - 6, c.x + c.w - 8, gy + 3);
    ctx.stroke();
  }
  ctx.restore();

  // A sink at the right end of the counter.
  ctx.save();
  ctx.fillStyle = '#b9c4c9';
  rr(ctx, 936, 492, 66, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#8fa0a8';
  rr(ctx, 942, 496, 54, 14, 4);
  ctx.fill();
  ctx.strokeStyle = '#6f7f87';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1000, 492); ctx.lineTo(1000, 476); ctx.lineTo(984, 476);
  ctx.stroke();
  ctx.restore();

  // Warm vignette: the kitchen feels lit from the window.
  const vg = ctx.createRadialGradient(640, 300, 200, 640, 360, 760);
  vg.addColorStop(0, 'rgba(255,220,140,0.06)');
  vg.addColorStop(1, 'rgba(40,20,8,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

const MAIN_TOP = 216;

function drawPan(ctx, x, y, light, dark) {
  ctx.save();
  ctx.fillStyle = lin(ctx, x, y, x + 34, y + 44, [[0, light], [1, dark]]);
  ellipse(ctx, x + 17, y + 26, 17, 18);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.fillRect(x + 14, y - 12, 6, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, x + 11, y + 20, 5, 7);
  ctx.fill();
  ctx.restore();
}

// --- Header ----------------------------------------------------------------

function drawHeader(ctx, game) {
  ctx.fillStyle = '#2b1a10';
  ctx.fillRect(HEADER.x, HEADER.y, HEADER.w, HEADER.h);
  ctx.fillStyle = '#f4c542';
  text(ctx, 'The Copper Kettle', 16, 24, 24, '#f4c542', 'left', 'bold');
  text(ctx, 'a realistic kitchen rush', 218, 26, 13, '#c9a86a', 'left', 'normal');
  text(ctx, `Score ${game.score}`, 560, 24, 18, '#fff', 'left');
  text(ctx, `Served ${game.served}`, 700, 24, 18, '#fff', 'left');
  // Combo meter: fills gold at x3+.
  const cx = 820, cw = 120;
  ctx.fillStyle = '#4a3423';
  rr(ctx, cx, 14, cw, 20, 10);
  ctx.fill();
  const frac = Math.min(1, game.combo / 5);
  ctx.fillStyle = game.combo >= 3 ? '#ffd94a' : '#e8a33d';
  if (frac > 0) { rr(ctx, cx, 14, cw * frac, 20, 10); ctx.fill(); }
  text(ctx, game.combo > 1 ? `COMBO x${game.combo}` : 'COMBO', cx + cw / 2, 24, 13, game.combo >= 3 ? '#3a2a10' : '#fff', 'center');
  text(ctx, `Level ${game.level}`, 970, 24, 18, '#fff', 'left');
  text(ctx, `Missed ${game.missed}/3`, 1090, 24, 18, game.missed > 0 ? '#ff8a7a' : '#fff', 'left');
  text(ctx, game.muted ? 'muted' : 'sound on', 1240, 24, 12, '#c9a86a', 'right', 'normal');
}

// --- Food: realistic, gradient-shaded, state-aware --------------------------

// Draw one food item. `size` is the half-width. `st` carries the cooking state
// for that item: { sideA, sideB, state } for a patty, { evenness } for fries,
// { quality } for cheese melt, { fill } for a drink, { chops } for chopped veg.
export function drawFood(ctx, id, x, y, size, st) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') drawBun(ctx, size, st);
  else if (id === 'patty') drawPatty(ctx, size, st);
  else if (id === 'lettuce') drawLettuce(ctx, size, st);
  else if (id === 'tomato') drawTomato(ctx, size, st);
  else if (id === 'cheese') drawCheese(ctx, size, st);
  else if (id === 'onion') drawOnion(ctx, size, st);
  else if (id === 'fries') drawFries(ctx, size, st);
  else if (id === 'drink') drawDrink(ctx, size, st);
  ctx.restore();
}

function drawBun(ctx, s, st) {
  // Toasted top dome (golden gradient) over a soft crumb base.
  softShadow(ctx, 0, s * 0.55, s * 0.9, s * 0.22, 0.25);
  ctx.fillStyle = lin(ctx, -s, -s, s, s, [[0, '#f7e3b0'], [0.6, '#e8c078'], [1, '#c99a52']]);
  ellipse(ctx, 0, s * 0.28, s, s * 0.42);
  ctx.fill();
  ctx.fillStyle = rad(ctx, 0, -s * 0.35, s, [[0, '#f9d98a'], [0.55, '#e0a44e'], [1, '#a86f2a']]);
  ctx.beginPath();
  ctx.arc(0, s * 0.1, s * 0.92, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Sesame seeds.
  ctx.fillStyle = '#fff3cf';
  for (const [sx, sy] of [[-0.45, -0.35], [0.1, -0.55], [0.5, -0.3], [-0.1, -0.2], [0.35, -0.55]]) {
    ellipse(ctx, sx * s, sy * s, s * 0.09, s * 0.05);
    ctx.fill();
  }
  // Highlight.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -s * 0.3, -s * 0.45, s * 0.3, s * 0.14);
  ctx.fill();
}

function pattyColor(doneness, state) {
  if (state === 'burnt') return ['#2a1a12', '#1a0f08', '#3a2418'];
  // Raw pink-red -> brown as it cooks.
  const t = Math.min(1, Math.max(0, doneness));
  const r = Math.round(198 - 96 * t);
  const g = Math.round(106 - 52 * t);
  const b = Math.round(90 - 54 * t);
  const r2 = Math.round(160 - 80 * t);
  const g2 = Math.round(80 - 40 * t);
  const b2 = Math.round(66 - 40 * t);
  return [`rgb(${r},${g},${b})`, `rgb(${r2},${g2},${b2})`, `rgb(${Math.round(r * 0.8)},${Math.round(g * 0.8)},${Math.round(b * 0.8)})`];
}

function drawPatty(ctx, s, st) {
  const sideA = (st && st.sideA) || 0;
  const sideB = (st && st.sideB) || 0;
  const state = (st && st.state) || 'done';
  const side = (st && st.side) || 'A';
  // The side facing up is the one currently cooking; its doneness shows.
  const up = side === 'A' ? sideA : sideB;
  const [hi, mid, dark] = pattyColor(up, state);
  softShadow(ctx, 0, s * 0.5, s * 0.95, s * 0.22, 0.3);
  ctx.fillStyle = rad(ctx, 0, 0, s, [[0, hi], [0.6, mid], [1, dark]]);
  ellipse(ctx, 0, 0, s, s * 0.62);
  ctx.fill();
  // Sear marks: dark cross-hatch that deepens as it browns.
  if (up > 0.15) {
    ctx.strokeStyle = `rgba(40,18,8,${0.25 + 0.45 * up})`;
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    for (const off of [-0.4, 0, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(off * s - s * 0.3, -s * 0.35);
      ctx.lineTo(off * s + s * 0.3, s * 0.35);
      ctx.stroke();
    }
  }
  // A glisten of fat when it is cooking.
  if (state === 'cooking') {
    ctx.fillStyle = 'rgba(255,220,150,0.35)';
    ellipse(ctx, -s * 0.3, -s * 0.2, s * 0.28, s * 0.12);
    ctx.fill();
  }
  if (state === 'burnt') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ellipse(ctx, 0, 0, s * 0.9, s * 0.5);
    ctx.fill();
  }
}

function drawLettuce(ctx, s, st) {
  const pieces = (st && st.chops) || 0;
  softShadow(ctx, 0, s * 0.45, s * 0.85, s * 0.2, 0.22);
  // A leaf (or chopped pieces) with veins.
  const leaf = (lx, ly, ls, rot) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = rad(ctx, 0, 0, ls, [[0, '#a8d94a'], [0.6, '#6fae2e'], [1, '#4a7d1c']]);
    ctx.beginPath();
    ctx.moveTo(0, -ls);
    ctx.quadraticCurveTo(ls, -ls * 0.4, ls * 0.7, ls * 0.6);
    ctx.quadraticCurveTo(0, ls, -ls * 0.7, ls * 0.6);
    ctx.quadraticCurveTo(-ls, -ls * 0.4, 0, -ls);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,255,200,0.6)';
    ctx.lineWidth = Math.max(1, ls * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, -ls * 0.8);
    ctx.lineTo(0, ls * 0.7);
    ctx.stroke();
    ctx.restore();
  };
  if (pieces >= 2) {
    leaf(-s * 0.4, s * 0.1, s * 0.5, -0.5);
    leaf(s * 0.35, -s * 0.05, s * 0.5, 0.6);
    leaf(0, s * 0.3, s * 0.45, 0.1);
  } else if (pieces === 1) {
    leaf(-s * 0.3, 0, s * 0.6, -0.3);
    leaf(s * 0.3, s * 0.1, s * 0.6, 0.4);
  } else {
    leaf(0, 0, s * 0.85, 0);
  }
}

function drawTomato(ctx, s, st) {
  const pieces = (st && st.chops) || 0;
  softShadow(ctx, 0, s * 0.45, s * 0.85, s * 0.2, 0.22);
  const slice = (lx, ly, ls) => {
    ctx.fillStyle = rad(ctx, lx, ly, ls, [[0, '#ff7a5c'], [0.55, '#e8442e'], [1, '#b02818']]);
    ellipse(ctx, lx, ly, ls, ls * 0.62);
    ctx.fill();
    // Juicy highlight + seeds.
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ellipse(ctx, lx - ls * 0.3, ly - ls * 0.2, ls * 0.25, ls * 0.12);
    ctx.fill();
    ctx.fillStyle = '#ffd9a8';
    for (const [sx, sy] of [[-0.3, 0.1], [0.25, 0.15], [0, -0.1]]) {
      ellipse(ctx, lx + sx * ls, ly + sy * ls, ls * 0.09, ls * 0.06);
      ctx.fill();
    }
  };
  if (pieces >= 2) {
    slice(-s * 0.4, s * 0.05, s * 0.5);
    slice(s * 0.35, -s * 0.1, s * 0.5);
  } else if (pieces === 1) {
    slice(-s * 0.25, 0, s * 0.6);
    slice(s * 0.3, s * 0.08, s * 0.55);
  } else {
    // Whole tomato.
    ctx.fillStyle = rad(ctx, 0, -s * 0.1, s, [[0, '#ff8a6a'], [0.6, '#e8442e'], [1, '#a82614']]);
    ellipse(ctx, 0, 0, s * 0.9, s * 0.8);
    ctx.fill();
    ctx.fillStyle = '#4a7d1c';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(-s * 0.2, -s * 0.5);
    ctx.lineTo(s * 0.2, -s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ellipse(ctx, -s * 0.3, -s * 0.3, s * 0.25, s * 0.14);
    ctx.fill();
  }
}

function drawCheese(ctx, s, st) {
  const melted = (st && st.quality) === 'melted';
  softShadow(ctx, 0, s * 0.4, s * 0.9, s * 0.18, 0.22);
  if (melted) {
    // Draped and dripping over the patty below.
    ctx.fillStyle = lin(ctx, -s, -s * 0.5, s, s, [[0, '#ffd94a'], [0.6, '#f4a91f'], [1, '#d98a12']]);
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.3);
    ctx.lineTo(s, -s * 0.3);
    ctx.lineTo(s * 0.85, s * 0.25);
    ctx.quadraticCurveTo(s * 0.6, s * 0.75, s * 0.4, s * 0.3);
    ctx.quadraticCurveTo(s * 0.1, s * 0.85, -s * 0.1, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.7, -s * 0.6, s * 0.25);
    ctx.quadraticCurveTo(-s * 0.9, s * 0.1, -s, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, -s * 0.25, -s * 0.15, s * 0.3, s * 0.1);
    ctx.fill();
  } else {
    // A flat slice with holes.
    ctx.fillStyle = lin(ctx, -s, -s * 0.4, s, s * 0.4, [[0, '#ffd94a'], [0.6, '#f4b41f'], [1, '#d98a12']]);
    rr(ctx, -s, -s * 0.35, s * 2, s * 0.7, s * 0.12);
    ctx.fill();
    ctx.fillStyle = '#c07f0e';
    for (const [hx, hy] of [[-0.5, 0], [0.15, -0.1], [0.55, 0.12]]) {
      ellipse(ctx, hx * s, hy * s, s * 0.1, s * 0.07);
      ctx.fill();
    }
  }
}

function drawOnion(ctx, s, st) {
  const pieces = (st && st.chops) || 0;
  softShadow(ctx, 0, s * 0.4, s * 0.8, s * 0.18, 0.22);
  const ring = (lx, ly, ls) => {
    ctx.strokeStyle = '#f2e8f2';
    ctx.lineWidth = Math.max(1.5, ls * 0.14);
    ctx.beginPath();
    ctx.arc(lx, ly, ls * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c9a0c9';
    ctx.lineWidth = Math.max(1, ls * 0.08);
    ctx.beginPath();
    ctx.arc(lx, ly, ls * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx, ly, ls * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  };
  if (pieces >= 2) {
    ring(-s * 0.35, 0, s * 0.45);
    ring(s * 0.35, s * 0.05, s * 0.45);
    ring(0, s * 0.25, s * 0.4);
  } else if (pieces === 1) {
    ring(-s * 0.25, 0, s * 0.55);
    ring(s * 0.3, 0, s * 0.55);
  } else {
    ctx.fillStyle = rad(ctx, 0, 0, s, [[0, '#f7eef7'], [0.6, '#e8d0e8'], [1, '#c9a0c9']]);
    ellipse(ctx, 0, 0, s * 0.85, s * 0.75);
    ctx.fill();
    ctx.strokeStyle = '#b98ab9';
    ctx.lineWidth = 1.5;
    ellipse(ctx, 0, 0, s * 0.55, s * 0.48);
    ctx.stroke();
  }
}

function drawFries(ctx, s, st) {
  const even = (st && st.evenness !== undefined) ? st.evenness : 1;
  const state = (st && st.state) || 'done';
  softShadow(ctx, 0, s * 0.5, s * 0.85, s * 0.2, 0.25);
  // Red carton.
  ctx.fillStyle = lin(ctx, -s * 0.8, 0, s * 0.8, s * 0.8, [[0, '#d94a3a'], [1, '#a82e22']]);
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, s * 0.1);
  ctx.lineTo(s * 0.8, s * 0.1);
  ctx.lineTo(s * 0.6, s * 0.75);
  ctx.lineTo(-s * 0.6, s * 0.75);
  ctx.closePath();
  ctx.fill();
  // Fries sticking out: golden sticks; uneven fries have pale and dark sticks.
  for (let i = -2; i <= 2; i++) {
    const fx = i * s * 0.28;
    const fh = s * (0.9 + ((i * 7) % 3) * 0.12);
    const pale = even < 0.5 && (i % 2 === 0);
    const col = state === 'burnt' ? '#4a2a14'
      : pale ? '#f7e8b0'
      : lin(ctx, fx - 4, 0, fx + 4, 0, [[0, '#ffd94a'], [0.6, '#f4a91f'], [1, '#c07f0e']]);
    ctx.fillStyle = col;
    ctx.save();
    ctx.translate(fx, -fh * 0.4);
    ctx.rotate(i * 0.06);
    rr(ctx, -s * 0.09, -fh / 2, s * 0.18, fh, s * 0.05);
    ctx.fill();
    ctx.restore();
  }
}

function drawDrink(ctx, s, st) {
  const fill = (st && st.fill !== undefined) ? st.fill : 1;
  softShadow(ctx, 0, s * 0.55, s * 0.6, s * 0.18, 0.25);
  // Cup.
  ctx.fillStyle = lin(ctx, -s * 0.5, 0, s * 0.5, 0, [[0, '#f7f3ea'], [1, '#d9cfba']]);
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.5);
  ctx.lineTo(s * 0.5, -s * 0.5);
  ctx.lineTo(s * 0.38, s * 0.6);
  ctx.lineTo(-s * 0.38, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94a3a';
  ctx.fillRect(-s * 0.5, -s * 0.5, s, s * 0.18);
  // Liquid rising with the fill.
  if (fill > 0.03) {
    const top = -s * 0.32 + (1 - fill) * s * 0.85;
    ctx.fillStyle = lin(ctx, 0, top, 0, s * 0.55, [[0, '#a86a2e'], [1, '#6f3a12']]);
    ctx.beginPath();
    ctx.moveTo(-s * 0.44, top);
    ctx.lineTo(s * 0.44, top);
    ctx.lineTo(s * 0.38, s * 0.55);
    ctx.lineTo(-s * 0.38, s * 0.55);
    ctx.closePath();
    ctx.fill();
    // Bubbles.
    ctx.fillStyle = 'rgba(255,230,170,0.7)';
    for (const [bx, by, br] of [[-0.2, 0.2, 0.05], [0.15, 0.3, 0.04], [0.05, 0.1, 0.06]]) {
      ellipse(ctx, bx * s, by * s, br * s, br * s);
      ctx.fill();
    }
  }
  // Straw.
  ctx.strokeStyle = '#e84a6a';
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s * 0.5);
  ctx.lineTo(s * 0.35, -s * 0.95);
  ctx.stroke();
}

// --- Customers -------------------------------------------------------------

function drawCustomer(ctx, game, cust, seat) {
  const def = cust.def;
  const cx = seat.x + seat.w / 2;
  const baseY = seat.y + seat.h; // counter line
  const bob = cust.mood === 'delighted' ? Math.sin(game.time * 8) * 3 : 0;
  const slide = cust.mood === 'arriving' ? (cust.x || 0) : 0;
  const ox = cx + slide;
  const oy = baseY + bob;

  // Stool (behind the customer, at the counter).
  ctx.save();
  ctx.fillStyle = '#6f4522';
  ctx.fillRect(ox - 34, oy - 6, 68, 8);
  ctx.fillStyle = '#5a3517';
  ctx.fillRect(ox - 26, oy + 2, 6, 14);
  ctx.fillRect(ox + 20, oy + 2, 6, 14);
  ctx.restore();

  // Torso (shoulders + top).
  ctx.save();
  ctx.fillStyle = lin(ctx, ox - 52, oy - 72, ox + 52, oy, [[0, def.top], [1, def.topShade]]);
  ctx.beginPath();
  ctx.moveTo(ox - 52, oy);
  ctx.quadraticCurveTo(ox - 56, oy - 58, ox - 34, oy - 70);
  ctx.lineTo(ox + 34, oy - 70);
  ctx.quadraticCurveTo(ox + 56, oy - 58, ox + 52, oy);
  ctx.closePath();
  ctx.fill();
  // Arms resting on the counter.
  ctx.strokeStyle = def.topShade;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ox - 44, oy - 52);
  ctx.quadraticCurveTo(ox - 58, oy - 18, ox - 34, oy - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + 44, oy - 52);
  ctx.quadraticCurveTo(ox + 58, oy - 18, ox + 34, oy - 8);
  ctx.stroke();
  ctx.restore();

  // Head.
  const hx = ox, hy = oy - 96;
  ctx.save();
  ctx.fillStyle = rad(ctx, hx, hy, 34, [[0, def.skin], [1, def.skinShade]]);
  ellipse(ctx, hx, hy, 30, 34);
  ctx.fill();
  // Ears.
  ctx.fillStyle = def.skinShade;
  ellipse(ctx, hx - 30, hy + 2, 5, 8);
  ctx.fill();
  ellipse(ctx, hx + 30, hy + 2, 5, 8);
  ctx.fill();
  drawHair(ctx, def, hx, hy);
  drawFace(ctx, def, hx, hy, cust.mood);
  ctx.restore();

  // Eating: a small plate in front of the customer, shrinking with each bite.
  if (cust.mood === 'eating' || cust.mood === 'tipping') {
    const left = 1 - cust.eaten / 3;
    const px = ox, py = oy - 2;
    ctx.save();
    ctx.fillStyle = '#f7f3ea';
    ellipse(ctx, px, py, 34, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9bfa8';
    ctx.lineWidth = 1.5;
    ellipse(ctx, px, py, 34, 10);
    ctx.stroke();
    if (left > 0) {
      const dish = dishById(cust.order.dishId);
      const items = dish ? dish.items : [];
      const show = Math.max(1, Math.ceil(items.length * left));
      for (let i = 0; i < show; i++) {
        drawFood(ctx, items[i], px - 16 + i * 16, py - 6 - i * 2, 9, {});
      }
    }
    ctx.restore();
  }
}

function drawHair(ctx, def, hx, hy) {
  ctx.save();
  ctx.fillStyle = def.hairColor;
  if (def.hair === 'bun') {
    ctx.beginPath();
    ctx.arc(hx, hy - 30, 32, Math.PI, 0);
    ctx.fill();
    ellipse(ctx, hx, hy - 44, 12, 12);
    ctx.fill();
    ctx.fillStyle = '#f4c542';
    ellipse(ctx, hx + 10, hy - 42, 3, 3);
    ctx.fill();
  } else if (def.hair === 'cap') {
    ctx.beginPath();
    ctx.arc(hx, hy - 22, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(hx - 30, hy - 26, 60, 8);
    ellipse(ctx, hx + 26, hy - 20, 12, 4);
    ctx.fill();
  } else if (def.hair === 'bob') {
    ctx.beginPath();
    ctx.arc(hx, hy - 14, 33, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(hx - 33, hy - 16, 12, 34);
    ctx.fillRect(hx + 21, hy - 16, 12, 34);
    // Round glasses.
    ctx.strokeStyle = '#3a2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx - 12, hy + 2, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + 12, hy + 2, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - 4, hy + 2); ctx.lineTo(hx + 4, hy + 2); ctx.stroke();
  } else if (def.hair === 'spiky') {
    ctx.beginPath();
    ctx.moveTo(hx - 30, hy - 6);
    for (let i = 0; i < 6; i++) {
      const px = hx - 30 + i * 12;
      ctx.lineTo(px + 6, hy - 34 - (i % 2) * 8);
      ctx.lineTo(px + 12, hy - 6);
    }
    ctx.closePath();
    ctx.fill();
  } else { // long
    ctx.beginPath();
    ctx.arc(hx, hy - 16, 32, Math.PI, 0);
    ctx.fill();
    rr(ctx, hx - 32, hy - 18, 12, 52, 6);
    ctx.fill();
    rr(ctx, hx + 20, hy - 18, 12, 52, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawFace(ctx, def, hx, hy, mood) {
  const eye = def.face.eye;
  const brow = def.face.brow;
  const lip = def.face.lip;
  ctx.save();
  ctx.strokeStyle = brow;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  // Brows by mood.
  if (mood === 'angry') {
    ctx.beginPath(); ctx.moveTo(hx - 20, hy - 6); ctx.lineTo(hx - 8, hy - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 20, hy - 6); ctx.lineTo(hx + 8, hy - 12); ctx.stroke();
  } else if (mood === 'impatient' || mood === 'sad') {
    ctx.beginPath(); ctx.moveTo(hx - 20, hy - 12); ctx.lineTo(hx - 8, hy - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 20, hy - 12); ctx.lineTo(hx + 8, hy - 8); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(hx - 20, hy - 12); ctx.lineTo(hx - 8, hy - 13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 20, hy - 12); ctx.lineTo(hx + 8, hy - 13); ctx.stroke();
  }
  // Eyes.
  ctx.fillStyle = eye;
  if (mood === 'delighted' || mood === 'eating') {
    // Happy closed eyes (upward arcs).
    ctx.strokeStyle = eye;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(hx - 12, hy + 4, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + 12, hy + 4, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (mood === 'sad') {
    ellipse(ctx, hx - 12, hy + 2, 3.5, 5);
    ctx.fill();
    ellipse(ctx, hx + 12, hy + 2, 3.5, 5);
    ctx.fill();
    // Tear.
    ctx.fillStyle = '#7ec8e8';
    ellipse(ctx, hx - 12, hy + 12, 2.5, 4);
    ctx.fill();
  } else {
    ellipse(ctx, hx - 12, hy + 2, 3.5, 5);
    ctx.fill();
    ellipse(ctx, hx + 12, hy + 2, 3.5, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(ctx, hx - 13, hy, 1.2, 1.6);
    ctx.fill();
    ellipse(ctx, hx + 11, hy, 1.2, 1.6);
    ctx.fill();
  }
  // Blush when delighted.
  if (mood === 'delighted' || mood === 'eating') {
    ctx.fillStyle = 'rgba(255,120,140,0.5)';
    ellipse(ctx, hx - 20, hy + 12, 6, 4);
    ctx.fill();
    ellipse(ctx, hx + 20, hy + 12, 6, 4);
    ctx.fill();
  }
  // Sweat drop when impatient.
  if (mood === 'impatient') {
    ctx.fillStyle = '#7ec8e8';
    ellipse(ctx, hx + 26, hy - 14, 3.5, 5.5);
    ctx.fill();
  }
  // Steam when angry.
  if (mood === 'angry') {
    ctx.strokeStyle = 'rgba(200,200,200,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - 18, hy - 34); ctx.quadraticCurveTo(hx - 22, hy - 44, hx - 16, hy - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 18, hy - 34); ctx.quadraticCurveTo(hx + 22, hy - 44, hx + 16, hy - 50); ctx.stroke();
  }
  // Mouth.
  ctx.strokeStyle = lip;
  ctx.lineWidth = 2.5;
  if (mood === 'delighted' || mood === 'eating') {
    ctx.beginPath(); ctx.arc(hx, hy + 14, 9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#8a2a3a';
    ctx.beginPath(); ctx.arc(hx, hy + 16, 6, 0, Math.PI); ctx.fill();
  } else if (mood === 'sad') {
    ctx.beginPath(); ctx.arc(hx, hy + 24, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else if (mood === 'angry') {
    ctx.beginPath(); ctx.moveTo(hx - 8, hy + 18); ctx.lineTo(hx + 8, hy + 18); ctx.stroke();
  } else if (mood === 'impatient') {
    ctx.beginPath(); ctx.moveTo(hx - 5, hy + 18); ctx.lineTo(hx + 5, hy + 18); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(hx, hy + 12, 6, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  ctx.restore();
}

// --- Speech bubble ---------------------------------------------------------

function drawBubble(ctx, game, cust, seat) {
  const dish = dishById(cust.order.dishId);
  const r = bubbleRect(seat);
  const frac = cust.order.patienceMax > 0 ? cust.order.patience / cust.order.patienceMax : 0;
  ctx.save();
  // Bubble.
  ctx.fillStyle = '#fffdf5';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b9a06a';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  // Tail.
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath();
  ctx.moveTo(seat.x + seat.w / 2 - 8, r.y + r.h - 2);
  ctx.lineTo(seat.x + seat.w / 2 + 8, r.y + r.h - 2);
  ctx.lineTo(seat.x + seat.w / 2, r.y + r.h + 12);
  ctx.closePath();
  ctx.fill();
  // Name + dish.
  text(ctx, `${cust.def.name} wants`, r.x + 12, r.y + 13, 12, '#8a6a3a', 'left', 'bold');
  text(ctx, dish ? dish.name : '', r.x + 12, r.y + 30, 15, '#2b1a10', 'left', 'bold');
  // Patience bar + seconds.
  const bx = r.x + 12, bw = r.w - 66;
  ctx.fillStyle = '#e0d5bd';
  rr(ctx, bx, r.y + 38, bw, 6, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#6fae2e' : frac > 0.25 ? '#e8a33d' : '#d94a3a';
  if (frac > 0) { rr(ctx, bx, r.y + 38, bw * frac, 6, 3); ctx.fill(); }
  text(ctx, `${Math.ceil(cust.order.patience)}s`, r.x + r.w - 12, r.y + 30, 14, frac > 0.25 ? '#2b1a10' : '#d94a3a', 'right');
  ctx.restore();
}

// --- Order board (chalkboard) ----------------------------------------------

function drawBoard(ctx, game) {
  const b = BOARD;
  ctx.save();
  // Chalkboard frame + slate.
  ctx.fillStyle = '#6f4522';
  rr(ctx, b.x - 4, b.y - 4, b.w + 8, b.h + 8, 8);
  ctx.fill();
  ctx.fillStyle = '#2e4a3a';
  rr(ctx, b.x, b.y, b.w, b.h, 6);
  ctx.fill();
  text(ctx, 'ORDER BOARD', b.x + b.w / 2, b.y + 18, 15, '#f4efe2', 'center', 'bold');
  ctx.strokeStyle = 'rgba(244,239,226,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + 12, b.y + 30);
  ctx.lineTo(b.x + b.w - 12, b.y + 30);
  ctx.stroke();
  // Tickets.
  game.orders.forEach((order, i) => {
    const t = ticketRect(i);
    const cust = game.customers.find((c) => c.id === order.customerId);
    const dish = dishById(order.dishId);
    const frac = order.patienceMax > 0 ? order.patience / order.patienceMax : 0;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, t.x, t.y, t.w, t.h, 8);
    ctx.fill();
    ctx.fillStyle = cust ? cust.def.top : '#999';
    ctx.fillRect(t.x, t.y, 8, t.h);
    text(ctx, dish ? dish.name : '', t.x + 16, t.y + 16, 15, '#2b1a10', 'left', 'bold');
    text(ctx, cust ? cust.def.name : '', t.x + 16, t.y + 34, 12, '#8a6a3a', 'left');
    text(ctx, `${Math.ceil(order.patience)}s`, t.x + t.w - 10, t.y + 16, 14, frac > 0.25 ? '#2b1a10' : '#d94a3a', 'right');
    // Patience bar.
    ctx.fillStyle = '#e0d5bd';
    rr(ctx, t.x + 16, t.y + 46, t.w - 32, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#6fae2e' : frac > 0.25 ? '#e8a33d' : '#d94a3a';
    if (frac > 0) { rr(ctx, t.x + 16, t.y + 46, (t.w - 32) * frac, 7, 3); ctx.fill(); }
    // Ingredient dots.
    if (dish) {
      dish.items.forEach((item, j) => {
        drawFood(ctx, item, t.x + 26 + j * 26, t.y + 68, 9, {});
      });
    }
  });
  if (game.orders.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 70, 13, '#f4efe2', 'center', 'normal');
    text(ctx, 'the next guest is coming.', b.x + b.w / 2, b.y + 90, 13, '#f4efe2', 'center', 'normal');
  }
  ctx.restore();
}

// --- Stations ---------------------------------------------------------------

function drawStation(ctx, game, id, rect) {
  const ing = ingredientById(id);
  const job = game.kitchen.jobs[id];
  ctx.save();
  // Station card.
  ctx.fillStyle = 'rgba(255,250,240,0.92)';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = game.highlight === id ? '#f4c542' : '#c9b48a';
  ctx.lineWidth = game.highlight === id ? 3 : 1.5;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  // Label + key.
  text(ctx, ing.name, rect.x + 12, rect.y + 14, 14, '#2b1a10', 'left', 'bold');
  text(ctx, `[${ing.key}]`, rect.x + rect.w - 10, rect.y + 14, 12, '#8a6a3a', 'right');
  text(ctx, ing.blurb, rect.x + 12, rect.y + 30, 11, '#8a6a3a', 'left', 'normal');

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 82;
  if (id === 'patty') drawGrill(ctx, game, cx, cy, rect);
  else if (id === 'fries') drawFryer(ctx, game, cx, cy, rect);
  else if (id === 'drink') drawDrinkStation(ctx, game, cx, cy, rect);
  else if (ing.kind === 'chop') drawChopBoard(ctx, game, id, cx, cy, rect);
  else if (id === 'bun') drawFood(ctx, 'bun', cx, cy, 34, {});
  else if (id === 'cheese') drawFood(ctx, 'cheese', cx, cy, 34, {});
  ctx.restore();
}

function drawGrill(ctx, game, cx, cy, rect) {
  const view = grillView(game.kitchen);
  // Grill body: dark steel with grates.
  ctx.save();
  ctx.fillStyle = lin(ctx, cx - 70, cy - 26, cx + 70, cy + 26, [[0, '#4a4a4a'], [1, '#222']]);
  rr(ctx, cx - 70, cy - 26, 140, 52, 8);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 64, cy + i * 10);
    ctx.lineTo(cx + 64, cy + i * 10);
    ctx.stroke();
  }
  if (view) {
    drawFood(ctx, 'patty', cx, cy, 30, { sideA: view.sideA, sideB: view.sideB, side: view.side, state: view.state });
    // Side doneness bar.
    const bw = 110;
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, cx - bw / 2, cy + 34, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = view.state === 'burnt' ? '#d94a3a' : '#e8a33d';
    rr(ctx, cx - bw / 2, cy + 34, bw * Math.max(view.sideA, view.sideB), 8, 4);
    ctx.fill();
    if (view.state === 'cooking' && view.sideA >= 1 && view.side === 'A') {
      text(ctx, 'FLIP! (click / F)', cx, cy + 52, 12, '#d94a3a', 'center', 'bold');
    } else if (view.state === 'done') {
      text(ctx, 'Done — click to take', cx, cy + 52, 12, '#4a7d1c', 'center', 'bold');
    } else if (view.state === 'burnt') {
      text(ctx, 'Burnt! Click to toss', cx, cy + 52, 12, '#d94a3a', 'center', 'bold');
    } else {
      text(ctx, view.side === 'A' ? 'Grilling side A…' : 'Grilling side B…', cx, cy + 52, 12, '#8a6a3a', 'center', 'normal');
    }
  } else {
    text(ctx, 'Click to grill a patty', cx, cy + 44, 12, '#8a6a3a', 'center', 'normal');
  }
  ctx.restore();
}

function drawFryer(ctx, game, cx, cy, rect) {
  const view = fryView(game.kitchen);
  ctx.save();
  // Steel fryer pot with oil.
  ctx.fillStyle = lin(ctx, cx - 62, cy - 24, cx + 62, cy + 26, [[0, '#c8c8c8'], [1, '#8f8f8f']]);
  rr(ctx, cx - 62, cy - 24, 124, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#e8a33d';
  rr(ctx, cx - 54, cy - 16, 108, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#f4c542';
  rr(ctx, cx - 54, cy - 16, 108, 10, 6);
  ctx.fill();
  if (view) {
    drawFood(ctx, 'fries', cx, cy - 6, 26, { evenness: view.evenness, state: view.state });
    // Fry progress bar.
    const bw = 110;
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, cx - bw / 2, cy + 34, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = view.state === 'burnt' ? '#d94a3a' : '#e8a33d';
    rr(ctx, cx - bw / 2, cy + 34, bw * view.progress, 8, 4);
    ctx.fill();
    if (view.state === 'frying') {
      text(ctx, view.evenness < 0.5 ? 'Uneven! SHAKE (click / S)' : 'Frying… shake to keep even', cx, cy + 52, 12, view.evenness < 0.5 ? '#d94a3a' : '#8a6a3a', 'center', 'bold');
    } else if (view.state === 'done') {
      text(ctx, view.evenness >= 0.5 ? 'Golden — click to take' : 'Uneven — click to take', cx, cy + 52, 12, '#4a7d1c', 'center', 'bold');
    } else if (view.state === 'burnt') {
      text(ctx, 'Burnt! Click to toss', cx, cy + 52, 12, '#d94a3a', 'center', 'bold');
    }
  } else {
    text(ctx, 'Click to drop fries in', cx, cy + 44, 12, '#8a6a3a', 'center', 'normal');
  }
  ctx.restore();
}

function drawDrinkStation(ctx, game, cx, cy, rect) {
  const view = pourView(game.kitchen);
  ctx.save();
  drawFood(ctx, 'drink', cx, cy, 30, { fill: view ? view.fill : 0 });
  if (view) {
    const bw = 110;
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, cx - bw / 2, cy + 34, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#a86a2e';
    rr(ctx, cx - bw / 2, cy + 34, bw * view.fill, 8, 4);
    ctx.fill();
    text(ctx, view.done ? 'Full — click to take' : 'Pouring…', cx, cy + 52, 12, view.done ? '#4a7d1c' : '#8a6a3a', 'center', 'bold');
  } else {
    text(ctx, 'Click to pour a drink', cx, cy + 44, 12, '#8a6a3a', 'center', 'normal');
  }
  ctx.restore();
}

function drawChopBoard(ctx, game, id, cx, cy, rect) {
  const view = chopView(game.kitchen, id);
  ctx.save();
  // Wooden chopping board.
  ctx.fillStyle = lin(ctx, cx - 66, cy - 22, cx + 66, cy + 24, [[0, '#d9b98a'], [1, '#b98f5c']]);
  rr(ctx, cx - 66, cy - 22, 132, 46, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,40,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 58, cy - 8);
  ctx.lineTo(cx + 58, cy - 8);
  ctx.stroke();
  if (view) {
    drawFood(ctx, id, cx, cy, 28, { chops: view.chops });
    text(ctx, view.chops >= view.total ? 'Chopped — click to take' : `Chop ${view.chops}/${view.total} — click again`, cx, cy + 44, 12, view.chops >= view.total ? '#4a7d1c' : '#8a6a3a', 'center', 'bold');
  } else {
    drawFood(ctx, id, cx, cy, 28, { chops: 0 });
    text(ctx, 'Click to chop', cx, cy + 44, 12, '#8a6a3a', 'center', 'normal');
  }
  ctx.restore();
}

// --- Plate (the pass) ------------------------------------------------------

function drawPlate(ctx, game) {
  const p = PLATE;
  ctx.save();
  // Pass surface.
  ctx.fillStyle = '#3a2a1c';
  rr(ctx, 280, PASS_Y, 720, PASS_H, 10);
  ctx.fill();
  text(ctx, 'THE PASS — build the dish here', 640, PASS_Y + 16, 12, '#c9a86a', 'center', 'bold');
  // The plate itself: white ceramic with a rim and a soft shadow.
  softShadow(ctx, p.cx, p.cy, p.r + 8, p.r * 0.32, 0.4);
  ctx.fillStyle = rad(ctx, p.cx, p.cy, p.r, [[0, '#ffffff'], [0.8, '#f2ede2'], [1, '#d9cfba']]);
  ellipse(ctx, p.cx, p.cy, p.r, p.r * 0.82);
  ctx.fill();
  ctx.strokeStyle = '#b9a06a';
  ctx.lineWidth = 2;
  ellipse(ctx, p.cx, p.cy, p.r * 0.78, p.r * 0.62);
  ctx.stroke();
  // The dish, stacked bottom to top, each layer smaller and higher.
  const items = game.kitchen.plate;
  items.forEach((item, i) => {
    const y = p.cy + 8 - i * 13;
    const size = 30 - Math.min(8, i * 2);
    const hot = item.hot && !item.cooled;
    drawFood(ctx, item.id, p.cx, y, size, { quality: item.quality, sideA: 1, sideB: 1, state: 'done' });
    if (hot) {
      // Steam curls off a hot item.
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(ctx, p.cx - 12 + i * 6, y - size * 0.7, 3, 6);
      ctx.fill();
    }
  });
  if (items.length === 0) {
    text(ctx, 'Empty plate', p.cx, p.cy, 13, '#8a6a3a', 'center', 'normal');
  }
  // SERVE + CLEAR buttons.
  const match = game.matchDish;
  ctx.fillStyle = match ? '#4a9e2e' : '#8a8a8a';
  rr(ctx, SERVE_BTN.x, SERVE_BTN.y, SERVE_BTN.w, SERVE_BTN.h, 12);
  ctx.fill();
  if (match) {
    ctx.save();
    ctx.shadowColor = '#ffd94a';
    ctx.shadowBlur = 18;
    rr(ctx, SERVE_BTN.x, SERVE_BTN.y, SERVE_BTN.w, SERVE_BTN.h, 12);
    ctx.fill();
    ctx.restore();
  }
  text(ctx, match ? `SERVE ${match.name}` : 'SERVE', SERVE_BTN.x + SERVE_BTN.w / 2, SERVE_BTN.y + SERVE_BTN.h / 2, match ? 16 : 20, '#fff', 'center', 'bold');
  ctx.fillStyle = '#6f4522';
  rr(ctx, CLEAR_BTN.x, CLEAR_BTN.y, CLEAR_BTN.w, CLEAR_BTN.h, 12);
  ctx.fill();
  text(ctx, 'CLEAR [C]', CLEAR_BTN.x + CLEAR_BTN.w / 2, CLEAR_BTN.y + CLEAR_BTN.h / 2, 14, '#fff', 'center', 'bold');
  // Cooling warning.
  const cooling = items.some((it) => it.hot && !it.cooled && game.time - it.bornAt > 14);
  if (cooling) {
    text(ctx, 'Getting cold — serve it soon!', p.cx + 190, p.cy + 30, 13, '#e8a33d', 'left', 'bold');
  }
  ctx.restore();
}

const PASS_Y = 532;
const PASS_H = 116;

// --- Recipe book -----------------------------------------------------------

function drawRecipes(ctx, game) {
  const r = RECIPES;
  ctx.save();
  ctx.fillStyle = '#fff8e8';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  text(ctx, 'MENU', r.x + r.w / 2, r.y + 18, 16, '#2b1a10', 'center', 'bold');
  ctx.strokeStyle = 'rgba(180,150,100,0.5)';
  ctx.beginPath();
  ctx.moveTo(r.x + 14, r.y + 30);
  ctx.lineTo(r.x + r.w - 14, r.y + 30);
  ctx.stroke();
  let y = r.y + 48;
  for (const dish of game.dishesByPoints) {
    text(ctx, dish.name, r.x + 14, y, 13, '#2b1a10', 'left', 'bold');
    text(ctx, `${dish.points} pts`, r.x + r.w - 12, y, 12, '#8a6a3a', 'right');
    dish.items.forEach((item, j) => {
      drawFood(ctx, item, r.x + 22 + j * 24, y + 16, 9, {});
    });
    y += 30;
  }
  text(ctx, 'How to play:', r.x + 14, y + 6, 12, '#2b1a10', 'left', 'bold');
  const tips = [
    'Click a station (or press 1–8).',
    'Flip the patty (F) — both sides brown.',
    'Shake the fries (S) while they fry.',
    'Chop twice. Melt cheese on a hot patty.',
    'Serve the exact dish. Tips for fast serves!',
  ];
  tips.forEach((tip, i) => {
    text(ctx, tip, r.x + 14, y + 24 + i * 15, 11, '#6a5a42', 'left', 'normal');
  });
  ctx.restore();
}

// --- Effects ----------------------------------------------------------------

function drawParticles(ctx, game) {
  const fx = game.effects;
  for (const p of fx.particles) {
    const t = p.life / p.max;
    const alpha = 1 - t;
    ctx.save();
    if (p.kind === 'steam' || p.kind === 'smoke') {
      ctx.fillStyle = p.kind === 'steam' ? `rgba(255,255,255,${0.45 * alpha})` : `rgba(120,120,120,${0.5 * alpha})`;
      ellipse(ctx, p.x, p.y, p.size * (1 + t), p.size * (1 + t) * 1.4);
      ctx.fill();
    } else if (p.kind === 'sizzle') {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * alpha})`;
      ellipse(ctx, p.x, p.y, p.size * 0.4, p.size);
      ctx.fill();
    } else if (p.kind === 'bubble') {
      ctx.fillStyle = `rgba(255,217,122,${0.85 * alpha})`;
      ellipse(ctx, p.x, p.y, p.size, p.size);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.6 * alpha})`;
      ellipse(ctx, p.x - 1, p.y - 1, p.size * 0.4, p.size * 0.4);
      ctx.fill();
    } else if (p.kind === 'sparkle') {
      ctx.fillStyle = `rgba(255,217,74,${alpha})`;
      drawStar(ctx, p.x, p.y, p.size);
    } else if (p.kind === 'heart') {
      ctx.fillStyle = `rgba(255,122,162,${alpha})`;
      drawHeart(ctx, p.x, p.y, p.size);
    } else if (p.kind === 'coin') {
      ctx.fillStyle = `rgba(244,197,66,${alpha})`;
      ellipse(ctx, p.x, p.y, p.size, p.size);
      ctx.fill();
      ctx.strokeStyle = `rgba(180,130,20,${alpha})`;
      ctx.lineWidth = 1.5;
      ellipse(ctx, p.x, p.y, p.size * 0.6, p.size * 0.6);
      ctx.stroke();
      text(ctx, '$', p.x, p.y, p.size, `rgba(120,80,10,${alpha})`, 'center', 'bold');
    } else if (p.kind === 'pop') {
      text(ctx, p.text, p.x, p.y, p.size, `rgba(217,74,58,${alpha})`, 'center', 'bold');
    }
    ctx.restore();
  }
  // Grade popup.
  if (fx.grade) {
    const g = fx.grade;
    const pop = g.t < 0.25 ? 0.7 + (g.t / 0.25) * 0.3 : 1;
    const fade = g.t > g.max - 0.5 ? Math.max(0, (g.max - g.t) / 0.5) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(640, 330);
    ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(43,26,16,0.85)';
    rr(ctx, -190, -52, 380, 104, 18);
    ctx.fill();
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 3;
    rr(ctx, -190, -52, 380, 104, 18);
    ctx.stroke();
    text(ctx, g.text, 0, -14, 40, '#ffd94a', 'center', 'bold');
    text(ctx, g.sub, 0, 26, 16, '#fff', 'center', 'normal');
    ctx.restore();
  }
  // Screen flash.
  if (fx.flash) {
    const f = fx.flash;
    const a = (1 - f.t / f.max) * 0.25;
    ctx.fillStyle = f.color;
    ctx.globalAlpha = a;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad2 = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad2;
    const py = y + Math.sin(ang) * rad2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.7);
  ctx.bezierCurveTo(x - s, y, x - s * 0.5, y - s * 0.8, x, y - s * 0.2);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.8, x + s, y, x, y + s * 0.7);
  ctx.fill();
}

// --- Title / game over ------------------------------------------------------

function drawTitle(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(23,16,11,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2b1a10';
  rr(ctx, 340, 180, 600, 300, 20);
  ctx.fill();
  ctx.strokeStyle = '#f4c542';
  ctx.lineWidth = 3;
  rr(ctx, 340, 180, 600, 300, 20);
  ctx.stroke();
  text(ctx, 'The Copper Kettle', 640, 240, 46, '#f4c542', 'center', 'bold');
  text(ctx, 'a realistic kitchen rush', 640, 282, 20, '#e8d9bd', 'center', 'normal');
  text(ctx, 'Real cooking: flip the patty, shake the fries,', 640, 330, 16, '#fff', 'center', 'normal');
  text(ctx, 'melt the cheese, pour the drink — then serve it', 640, 354, 16, '#fff', 'center', 'normal');
  text(ctx, 'before your customers lose patience.', 640, 378, 16, '#fff', 'center', 'normal');
  ctx.fillStyle = '#4a9e2e';
  rr(ctx, 520, 410, 240, 52, 12);
  ctx.fill();
  text(ctx, 'START COOKING', 640, 436, 20, '#fff', 'center', 'bold');
  text(ctx, 'Click or press Space  •  1–8 stations  •  F flip  •  S serve / shake', 640, 500, 13, '#c9a86a', 'center', 'normal');
  ctx.restore();
}

function drawGameOver(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(23,16,11,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2b1a10';
  rr(ctx, 380, 190, 520, 300, 20);
  ctx.fill();
  ctx.strokeStyle = '#d94a3a';
  ctx.lineWidth = 3;
  rr(ctx, 380, 190, 520, 300, 20);
  ctx.stroke();
  text(ctx, 'Service Over', 640, 240, 40, '#ff8a7a', 'center', 'bold');
  text(ctx, `Score ${game.score}  •  Served ${game.served}  •  Best combo x${game.bestCombo}`, 640, 300, 18, '#fff', 'center', 'normal');
  text(ctx, `Level ${game.level}  •  Tips earned ${game.tipsEarned} coins  •  Missed ${game.missed}`, 640, 330, 16, '#e8d9bd', 'center', 'normal');
  text(ctx, 'Three guests walked out hungry.', 640, 366, 15, '#c9a86a', 'center', 'normal');
  ctx.fillStyle = '#4a9e2e';
  rr(ctx, 520, 410, 240, 52, 12);
  ctx.fill();
  text(ctx, 'COOK AGAIN', 640, 436, 20, '#fff', 'center', 'bold');
  text(ctx, 'Press Space', 640, 500, 13, '#c9a86a', 'center', 'normal');
  ctx.restore();
}

// --- Main render ------------------------------------------------------------

export function render(ctx, game) {
  ctx.clearRect(0, 0, W, H);
  drawBackdrop(ctx, game);
  drawHeader(ctx, game);
  // Customers (seated at the counter) + their bubbles.
  for (const cust of game.customers) {
    const seat = CUSTOMER_SEATS[cust.seat];
    if (!seat) continue;
    drawCustomer(ctx, game, cust, seat);
    if (cust.order && cust.mood !== 'eating' && cust.mood !== 'tipping' && cust.mood !== 'leaving') {
      drawBubble(ctx, game, cust, seat);
    }
  }
  drawBoard(ctx, game);
  // Counter stations.
  for (let i = 0; i < 8; i++) {
    drawStation(ctx, game, INGREDIENTS[i].id, stationRect(i));
  }
  drawRecipes(ctx, game);
  drawPlate(ctx, game);
  drawParticles(ctx, game);
  // Footer hints.
  text(ctx, 'Click a station to cook  •  F flips the patty  •  S serves (or shakes the fries)  •  C clears the plate  •  Space starts  •  M mutes', 640, 684, 13, '#b9a68f', 'center', 'normal');
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'gameover') drawGameOver(ctx, game);
}
