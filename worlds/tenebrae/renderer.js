// Shared-player lifetime: active-time clock, pause, capture, change of garland and disposal.
import * as THREE from 'three';
import { createStage } from './stage.js';
import { createPainter } from './paint.js';
const canvas = document.querySelector('canvas'), status = document.querySelector('[role=status]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), lifetime = new AbortController();
const DIM = 0.9, DARK = 0.15, RISE = 2.2;
// The painted layer starts under a million pixels and steps down if frames run slow;
// brush size follows the picture, so a smaller layer changes sharpness, not the strokes.
const PAINT_PIXELS = 700_000, MIN_PAINT_PIXELS = 250_000, DISPLAY_PIXELS = 3_200_000, SLOW_FRAME = 28;
const ease = v => { const t = Math.min(1, Math.max(0, v)); return t * t * (3 - 2 * t); };
let renderer, stage, painter, ready = false, disposed = false, error = '', playing = false, time = 0, last = null, raf = 0, frames = 0, change = null, life = null;
// Each visit opens on a different garland and colour scheme.
let seed = Math.floor(Math.random() * 100000);
let paintPixels = PAINT_PIXELS, pace = 16, slow = 0;

function hang(next) { seed = next; stage.setSeed(seed); painter.setGrade(stage.grade()); }
// The light goes down, another garland is hung in the dark, and the light returns.
function fade() {
  if (!change) return 1;
  const age = time - change.at;
  if (age >= DIM && change.pending) { hang(change.seed); change.pending = false; }
  if (age >= DIM + DARK + RISE) { change = null; return 1; }
  return age < DIM ? 1 - ease(age / DIM) : ease((age - DIM - DARK) / RISE);
}
function paint() {
  if (!ready || disposed) return;
  const level = fade();
  life = stage.pose(time); painter.render(stage.scene, stage.camera, level); frames++;
}
function resize() {
  if (!painter || disposed) return;
  const d = Math.min(devicePixelRatio || 1, 2, Math.sqrt(DISPLAY_PIXELS / (innerWidth * innerHeight)));
  const width = Math.max(1, Math.round(innerWidth * d)), height = Math.max(1, Math.round(innerHeight * d));
  painter.resize(width, height, paintPixels); stage.setAspect(width / height); paint();
}
function tick(now) {
  raf = 0;
  if (!ready || disposed || !playing || document.hidden) { last = null; return; }
  const elapsed = last === null ? 0 : Math.max(0, now - last); last = now;
  time += Math.min(0.25, elapsed / 1000);
  // Sustained slow frames shrink the painted layer; it never grows back mid-session.
  if (elapsed) { pace += (elapsed - pace) * 0.05; slow = pace > SLOW_FRAME ? slow + 1 : 0; }
  if (slow > 35 && paintPixels > MIN_PAINT_PIXELS) { paintPixels = Math.max(MIN_PAINT_PIXELS, paintPixels * 0.72); slow = 0; pace = 16; resize(); }
  else paint();
  raf = requestAnimationFrame(tick);
}
function sync() { cancelAnimationFrame(raf); raf = 0; last = null; if (ready && !disposed && playing && !document.hidden) raf = requestAnimationFrame(tick); }
function rearrange(delta) {
  if (!ready || disposed) return false;
  const next = ((change?.pending ? change.seed : seed) + delta + 100000) % 100000;
  // Paused or reduced motion: no clock runs, so the new garland appears at once.
  if (!playing) { change = null; hang(next); paint(); return true; }
  change = change?.pending ? { ...change, seed: next } : { at: time, seed: next, pending: true };
  return true;
}
function dispose() {
  if (disposed) return;
  disposed = true; ready = false; playing = false; cancelAnimationFrame(raf); lifetime.abort();
  stage?.destroy(); painter?.dispose();
  if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
}
const snapshot = () => ({ id: 'tenebrae', ready, disposed, playing, time, frames, seed, error, changing: Boolean(change), frameMs: pace, backing: [canvas.width, canvas.height], paintSize: painter?.size(), great: life && { cycle: life.cycle, tone: life.tone, open: life.open, scale: life.scale }, ...(ready ? stage.describe() : {}) });
const player = {
  setPlaying(value) { if (disposed) return false; playing = !!value; sync(); return true; },
  setMuted() { return true; },
  randomScene: () => rearrange(1), nextScene: () => rearrange(1), previousScene: () => rearrange(-1),
  drawTo(target) {
    if (!ready || disposed) return false;
    paint(); // the drawing buffer is only readable in the task that rendered it
    target.width = canvas.width; target.height = canvas.height; target.getContext('2d').drawImage(canvas, 0, 0); return true;
  },
  snapshot, destroy: dispose
};
window.tenebrae = {
  get ready() { return ready; }, get error() { return error; }, player, snapshot, dispose,
  // Review entries: pose an exact time and garland, or compare with the untreated render.
  renderAt(seconds, nextSeed = seed) { if (!ready || disposed) return false; time = Math.max(0, Number(seconds) || 0); change = null; if (nextSeed !== seed) hang(nextSeed); paint(); sync(); return true; },
  showUnpainted(value) { if (!ready || disposed) return false; painter.setRaw(value); paint(); return true; },
  // Moves the camera for a close look at one body; a resize restores the staged view.
  lookFrom(position, target) { if (!ready || disposed) return false; stage.camera.position.set(...position); stage.camera.lookAt(...target); paint(); return true; }
};
addEventListener('resize', resize, { signal: lifetime.signal });
document.addEventListener('visibilitychange', sync, { signal: lifetime.signal });
addEventListener('pagehide', dispose, { once: true, signal: lifetime.signal });
reduced.addEventListener('change', e => { if (e.matches) player.setPlaying(false); }, { signal: lifetime.signal });
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  {
    stage = createStage(renderer); painter = createPainter(renderer); hang(seed);
    ready = true; resize(); status.hidden = true;
    // Opened on its own it plays; embedded it waits for the intent of the shared player.
    if (parent === window && !reduced.matches) playing = true;
    sync();
  }
} catch (e) {
  error = e instanceof Error ? e.message : 'Scene could not be prepared';
  status.hidden = false; status.textContent = '장면을 준비하지 못했습니다. 다시 열어 주세요.'; console.error(e);
}
