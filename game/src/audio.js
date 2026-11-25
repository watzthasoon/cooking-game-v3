// Sound for The Copper Kettle v3 — all synthesized with WebAudio, no audio files.
// Sizzle is a filtered-noise loop tied to the heat (grill/fryer on); chops are
// thuds, the pour is a gurgle, the serve is a ding, and a perfect serve gets a
// happy chime. Nothing here throws if audio is unavailable or muted.

export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    sizzle: null, // { src, gain, filter } while something is on the heat
    sizzleOn: false,
  };
}

function ensureCtx(audio) {
  if (audio.ctx) {
    // Browsers start the context suspended until a gesture; resume it so the
    // first click actually makes sound.
    if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
    return audio.ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
  } catch (e) {
    audio.ctx = null;
  }
  return audio.ctx;
}

// A short tone: sine/triangle/square at freq, sliding to freq2, over secs.
function tone(audio, type, freq, freq2, secs, vol, delay) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freq2 && freq2 !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t0 + secs);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + secs);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + secs + 0.05);
  } catch (e) { /* audio is best-effort */ }
}

// A burst of filtered noise (thud, whoosh, pop, gurgle).
function noiseBurst(audio, filterFreq, secs, vol, type) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * secs));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type || 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + secs);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  } catch (e) { /* best-effort */ }
}

export function playPop(audio) { tone(audio, 'sine', 620, 900, 0.09, 0.12); }
export function playChop(audio) { noiseBurst(audio, 220, 0.12, 0.3, 'lowpass'); tone(audio, 'sine', 130, 70, 0.1, 0.2); }
export function playFlip(audio) { noiseBurst(audio, 900, 0.18, 0.14, 'bandpass'); }
export function playPour(audio) { noiseBurst(audio, 500, 0.5, 0.12, 'bandpass'); tone(audio, 'sine', 300, 520, 0.5, 0.05); }
export function playDing(audio) { tone(audio, 'sine', 880, 880, 0.5, 0.16); tone(audio, 'sine', 1318, 1318, 0.4, 0.1, 0.02); }
export function playChime(audio) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => tone(audio, 'triangle', f, f, 0.35, 0.14, i * 0.09));
}
export function playSad(audio) { tone(audio, 'sine', 420, 140, 0.6, 0.14); }
export function playBuzz(audio) { tone(audio, 'square', 110, 90, 0.18, 0.08); }
export function playArrive(audio) { tone(audio, 'sine', 520, 780, 0.12, 0.1); }
export function playFanfare(audio) {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => tone(audio, 'triangle', f, f, 0.3, 0.13, i * 0.08));
}
export function playMunch(audio) { noiseBurst(audio, 300, 0.09, 0.18, 'lowpass'); }
export function playCoin(audio) { tone(audio, 'sine', 1245, 1245, 0.12, 0.1); tone(audio, 'sine', 1661, 1661, 0.18, 0.08, 0.07); }

// Sizzle: a looping filtered-noise bed while the grill or fryer is hot.
// `on` toggles it; the gain sits low so it reads as background, not noise.
export function setSizzle(audio, on) {
  if (audio.muted) on = false;
  if (on === audio.sizzleOn) return;
  audio.sizzleOn = on;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  try {
    if (on) {
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 4200;
      filter.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.value = 0.0;
      gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.4);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      audio.sizzle = { src, gain };
    } else if (audio.sizzle) {
      const s = audio.sizzle;
      audio.sizzle = null;
      try {
        s.gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.25);
        s.src.stop(ctx.currentTime + 0.3);
      } catch (e) { /* already stopped */ }
    }
  } catch (e) { /* best-effort */ }
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.muted) setSizzle(audio, false);
  return audio.muted;
}
