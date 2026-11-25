// Particles and feedback for The Copper Kettle v3: steam, sizzle wisps, oil
// bubbles, sparkles, hearts, smoke, "!" pops, tip coins, the grade popup and
// the golden screen flash. The renderer draws whatever is alive here.

export function makeEffects() {
  return {
    particles: [], // { kind, x, y, vx, vy, life, max, size, text }
    grade: null,   // { text, sub, t, max }
    flash: null,   // { t, max, color }
  };
}

function add(fx, kind, x, y, opts) {
  fx.particles.push({
    kind,
    x, y,
    vx: (opts && opts.vx) || 0,
    vy: (opts && opts.vy) || 0,
    life: 0,
    max: (opts && opts.max) || 1,
    size: (opts && opts.size) || 6,
    text: (opts && opts.text) || '',
    color: (opts && opts.color) || '#ffffff',
  });
}

// Steam rising from hot food: slow, grows, fades.
export function spawnSteam(fx, x, y, n) {
  for (let i = 0; i < (n || 1); i++) {
    add(fx, 'steam', x + (Math.random() - 0.5) * 24, y, {
      vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 14,
      max: 1.6 + Math.random() * 0.8, size: 5 + Math.random() * 5,
    });
  }
}

// Sizzle wisps on the grill: small, quick, white.
export function spawnSizzle(fx, x, y, n) {
  for (let i = 0; i < (n || 1); i++) {
    add(fx, 'sizzle', x + (Math.random() - 0.5) * 40, y - 4, {
      vx: (Math.random() - 0.5) * 6, vy: -30 - Math.random() * 20,
      max: 0.7 + Math.random() * 0.4, size: 3 + Math.random() * 3,
    });
  }
}

// Oil bubbles in the fryer: rise inside the oil and pop at the surface.
export function spawnBubble(fx, x, y, n) {
  for (let i = 0; i < (n || 1); i++) {
    add(fx, 'bubble', x + (Math.random() - 0.5) * 60, y + Math.random() * 10, {
      vy: -18 - Math.random() * 16, max: 0.9 + Math.random() * 0.5,
      size: 2 + Math.random() * 3, color: '#ffd97a',
    });
  }
}

// Gold sparkle/star burst on a cooking step done or a serve.
export function spawnSparkles(fx, x, y, n) {
  for (let i = 0; i < (n || 6); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 30 + Math.random() * 50;
    add(fx, 'sparkle', x, y, {
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
      max: 0.8 + Math.random() * 0.5, size: 4 + Math.random() * 4, color: '#ffd94a',
    });
  }
}

// Pink hearts floating up on a perfect serve.
export function spawnHearts(fx, x, y, n) {
  for (let i = 0; i < (n || 3); i++) {
    add(fx, 'heart', x + (Math.random() - 0.5) * 50, y, {
      vx: (Math.random() - 0.5) * 12, vy: -34 - Math.random() * 16,
      max: 1.4 + Math.random() * 0.6, size: 8 + Math.random() * 5, color: '#ff7aa2',
    });
  }
}

// Grey smoke from burnt food.
export function spawnSmoke(fx, x, y, n) {
  for (let i = 0; i < (n || 3); i++) {
    add(fx, 'smoke', x + (Math.random() - 0.5) * 20, y, {
      vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 12,
      max: 1.4 + Math.random() * 0.6, size: 7 + Math.random() * 6, color: '#8a8a8a',
    });
  }
}

// A red "!" pop on a mistake (burnt food, wrong serve).
export function spawnPop(fx, x, y, text) {
  add(fx, 'pop', x, y, { vy: -26, max: 1.1, size: 26, text: text || '!' });
}

// Gold tip coins floating up from a customer who just tipped.
export function spawnCoins(fx, x, y, n) {
  for (let i = 0; i < (n || 4); i++) {
    add(fx, 'coin', x + (Math.random() - 0.5) * 40, y, {
      vx: (Math.random() - 0.5) * 16, vy: -44 - Math.random() * 20,
      max: 1.2 + Math.random() * 0.4, size: 7 + Math.random() * 3, color: '#f4c542',
    });
  }
}

// The big centred grade popup after a serve: "Wonderful!" etc.
export function showGrade(fx, text, sub) {
  fx.grade = { text, sub: sub || '', t: 0, max: 1.8 };
}

// A full-screen flash (gold on a perfect serve, soft white otherwise).
export function flash(fx, color) {
  fx.flash = { t: 0, max: 0.45, color: color || '#ffd94a' };
}

// Advance everything. Particles die when their life passes max. The list is
// capped so a long sizzle session never grows it without bound.
export function tickEffects(fx, dt) {
  for (const p of fx.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'steam' || p.kind === 'smoke') p.vy *= (1 - 0.4 * dt);
    if (p.kind === 'sparkle') p.vy += 60 * dt;
  }
  fx.particles = fx.particles.filter((p) => p.life < p.max);
  if (fx.particles.length > 400) fx.particles.splice(0, fx.particles.length - 400);
  if (fx.grade) {
    fx.grade.t += dt;
    if (fx.grade.t >= fx.grade.max) fx.grade = null;
  }
  if (fx.flash) {
    fx.flash.t += dt;
    if (fx.flash.t >= fx.flash.max) fx.flash = null;
  }
}
