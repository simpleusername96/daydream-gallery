// A turning garland: large blooms orbit a great central flower in the dark.
// One light from the side means every body travels from darkness into light and back,
// so chiaroscuro becomes a cycle instead of a fixed composition.
// Pure data: no renderer imports, so every bound here is checkable in Node.
import { schemeOf } from './schemes.js';
const TAU = Math.PI * 2;

// radius: orbit radius; tilt: rotation about the x axis (positive drops the near side);
// height: lift of the ring centre; period: seconds per turn, sign is direction.
export const RINGS = Object.freeze([
  Object.freeze({ name: 'wreath', radius: 3.4, tilt: 0.5, height: 0.9, period: [-150, -115], body: 0.78, gap: [0.35, 0.9] }),
  Object.freeze({ name: 'garland', radius: 5.9, tilt: 0.3, height: -0.3, period: [170, 220], body: 1.4, gap: [0.25, 0.8] })
]);
export const GREAT = Object.freeze({ radius: 2.1, period: 176, centre: Object.freeze([0, 0.1, 0]) });
export const DUST = 14;

export const KINDS = Object.freeze(['single', 'camellia', 'rose']);

export function random(seed, stream = 0) {
  let a = (Math.imul((seed | 0) + 1, 0x9e3779b1) ^ Math.imul((stream | 0) + 1, 0x85ebca6b)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const range = (rng, a, b) => a + (b - a) * rng();
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = v => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };

function body(rng, kind, r, tone) {
  return {
    kind, r, tone, variant: Math.floor(rng() * 5), v: rng(),
    axis: norm([rng() - 0.5, rng() * 0.6 + 0.2, rng() - 0.5]), turn: range(rng, 50, 110) * (rng() < 0.5 ? -1 : 1), phase: rng() * TAU,
    bob: range(rng, 0.08, 0.2), bobPeriod: range(rng, 19, 37)
  };
}

// Bodies sit shoulder to shoulder along the ring with uneven gaps, like a tied garland.
function fill(rng, ring, next) {
  const length = TAU * ring.radius, bodies = [];
  let used = 0;
  for (let i = 0; i < 40; i++) {
    const b = next(i), need = b.r * 2 + range(rng, ...ring.gap);
    if (used + need > length) break;
    b.need = need; bodies.push(b); used += need;
  }
  const spare = (length - used) / bodies.length, start = rng() * TAU;
  let along = 0;
  for (const b of bodies) { b.angle = start + (along + (b.need + spare) / 2) / ring.radius; along += b.need + spare; delete b.need; }
  return bodies;
}

export function compose(seed) {
  const rng = random(seed), scheme = schemeOf(seed), tones = pick(rng, scheme.tones), lightSide = rng() < 0.7 ? -1 : 1;
  // Flowers only. Large and small heads alternate so each wreath has a rhythm, and no
  // colour or kind sits beside itself more than chance allows.
  // Small heads take the simplest forms; only large heads carry the fuller rose.
  const flower = (small, large) => { const r = range(rng, small, large); return body(rng, pick(rng, r < 0.7 ? ['single', 'camellia'] : r < 1 ? KINDS : ['camellia', 'rose']), r, pick(rng, tones)); };
  const makers = [
    i => i % 2 === 0 ? flower(0.62, 0.78) : flower(0.42, 0.56),
    i => i % 2 === 0 ? flower(1.12, 1.4) : flower(0.72, 0.96)
  ];
  const rings = RINGS.map((ring, index) => {
    const bodies = fill(rng, ring, makers[index]);
    return { index, period: range(rng, ...ring.period), bodies };
  });
  const dust = Array.from({ length: DUST }, () => ({
    radius: range(rng, 2.1, 7.8), height: range(rng, -2, 2.9), angle: rng() * TAU, period: 0, delay: rng() * 0.12, size: range(rng, 0.42, 0.7),
    spin: [range(rng, 0.2, 0.7), range(rng, 0.15, 0.5), rng() * TAU, rng() * TAU], drift: range(rng, 0.7, 1.3) * (rng() < 0.8 ? 1 : -1)
  }));
  for (const d of dust) d.period = (70 + d.radius * 24) / d.drift;
  return { seed, scheme: scheme.name, lightSide, tones, rings, dust, phase: Array.from({ length: 6 }, () => rng() * TAU), greatOffset: Math.floor(rng() * 3) };
}

// Slow drift of one warm key light.
export function lighting(scene, time) {
  const p = scene.phase, side = scene.lightSide;
  const azimuth = side * 1.38 + 0.14 * Math.sin(time * TAU / 173 + p[0]) + 0.06 * Math.sin(time * TAU / 67 + p[1]);
  const elevation = 0.6 + 0.07 * Math.sin(time * TAU / 127 + p[2]);
  const gain = 1 + 0.05 * Math.sin(time * TAU / 41 + p[3]) + 0.025 * Math.sin(time * TAU / 13.7 + p[4]);
  // Aimed at the near side the light comes from: the far side of each turn is left to the dark.
  const distance = 17, target = [side * 1.7, 0.3, 1.6];
  return { position: [target[0] + distance * Math.sin(azimuth) * Math.cos(elevation), target[1] + distance * Math.sin(elevation), target[2] + distance * Math.cos(azimuth) * Math.cos(elevation)], target, gain, azimuth, elevation };
}

const tiltX = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };

// Where a body is at `time`, which way it faces and trails, and how far its bloom is open.
export function place(scene, ringState, b, time) {
  const ring = RINGS[ringState.index], a = b.angle + TAU * time / ringState.period, dirSign = Math.sign(ringState.period);
  const out = [Math.cos(a), 0, Math.sin(a)], along = [-Math.sin(a) * dirSign, 0, Math.cos(a) * dirSign];
  const local = [out[0] * ring.radius, b.bob * Math.sin(time * TAU / b.bobPeriod + b.phase), out[2] * ring.radius];
  const position = tiltX(local, ring.tilt); position[1] += ring.height;
  const outward = tiltX(out, ring.tilt), travel = tiltX(along, ring.tilt);
  // Blooms open as they turn toward the light and close as they pass into the dark.
  const light = norm(lighting(scene, time).position), lit = (outward[0] * light[0] + outward[1] * light[1] + outward[2] * light[2] + 1) / 2;
  return { position, outward, travel, open: 0.5 + 0.5 * smooth((lit - 0.18) / 0.62), spin: b.phase + TAU * time / b.turn };
}

// The central flower stays fully grown; rotation, drift and petal flex carry its motion.
export function great(scene, time) {
  const at = time / GREAT.period + 0.5, cycle = Math.floor(at), u = at - cycle;
  return {
    position: [GREAT.centre[0] + 0.1 * Math.sin(time * TAU / 61 + scene.phase[0]), GREAT.centre[1] + 0.08 * Math.sin(time * TAU / 47 + scene.phase[1]), GREAT.centre[2]],
    rotation: [0.06 * Math.sin(time * TAU / 73 + scene.phase[2]), 0.11 * Math.sin(time * TAU / 97 + scene.phase[3]), 0.025 * Math.sin(time * TAU / 59 + scene.phase[4])],
    cycle, u, tone: scene.tones[scene.greatOffset],
    spin: TAU * time / 120,
    scale: GREAT.radius,
    open: 1
  };
}

const SETTLE = 38, DUST_LIFE = 1.8, DUST_FADE = 14;
// Petals shed by the central flower spiral outward, join the orbit for a while and fade.
// A pure function of time: half the petals answer to even cycles, half to odd ones.
export function dust(scene, time) {
  const out = [], T = GREAT.period;
  scene.dust.forEach((d, k) => {
    // Shedding of cycle c begins at (c + 0.34 + delay) * T.
    let cycle = Math.floor(time / T - 0.34 - d.delay);
    if (((cycle - k) % 2 + 2) % 2) cycle--;
    const age = time - (cycle + 0.34 + d.delay) * T, life = DUST_LIFE * T;
    if (age < 0 || age >= life) return;
    const settle = smooth(age / SETTLE), radius = 0.5 + (d.radius - 0.5) * settle, a = d.angle + TAU * age / d.period + (1 - settle) * 2.2 * d.drift;
    out.push({
      id: k, tone: scene.tones[scene.greatOffset],
      position: [GREAT.centre[0] + radius * Math.cos(a), GREAT.centre[1] + 0.6 + (d.height - 0.6) * settle + 0.25 * Math.sin(age * d.spin[1] + d.spin[2]), GREAT.centre[2] + radius * Math.sin(a)],
      rotation: [d.spin[2] + age * d.spin[0], d.spin[3] + age * d.spin[1], age * d.spin[0] * 0.6],
      scale: d.size * smooth(age / 5) * (1 - smooth((age - life + DUST_FADE) / DUST_FADE))
    });
  });
  return out;
}

export const FRAME = Object.freeze({ fov: 30, portraitHalfWidth: 4 });
// Wide views sit close and low so the near garland fills the foreground. Narrow views step
// back and look down more steeply, which turns the wide ellipse of the rings into a tall one.
export function staging(aspect) {
  const narrow = clamp((1.3 - aspect) / 0.75, 0, 1), tan = Math.tan(FRAME.fov * Math.PI / 360);
  const baseDistance = 13.5 + 9.5 * narrow, elevation = 0.22 + 0.34 * narrow;
  // Retain enough horizontal world space for the central flower and inner wreath.
  const distance = aspect < 1 ? Math.max(baseDistance, FRAME.portraitHalfWidth / (tan * aspect)) : baseDistance;
  return { fov: FRAME.fov, distance, elevation, backdropDistance: Math.max(44, distance + 12), lookY: 0.4 + 0.3 * narrow, halfHeight: distance * tan, halfWidth: distance * tan * aspect };
}
