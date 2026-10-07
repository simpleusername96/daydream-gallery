// Procedural blooms and foliage. A bloom is a spiral of separate thin petals: each leaves
// the receptacle on its own angle, cups toward the heart, rolls its rim back and overlaps
// its neighbours like roof tiles, so no two petals share a surface and the head never
// fuses into a bowl underneath.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const color = hex => new THREE.Color().setHex(hex);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const LEAF = { deep: 0x16260f, mid: 0x2e4a1c, light: 0x6c8238 };

// petals: petals per turn of the spiral (fewer means broader petals); to: how far the
// spiral winds toward the heart; open: how far the outermost petals lean from the axis,
// in radians; width: how much of its slot a petal fills. Every form has a closed heart:
// the innermost petals are short, wrap half way round the axis and fold over the centre.
export const BLOOMS = Object.freeze({
  // A half-open bud, a formal double and a full rose; small heads take the simpler forms.
  single: { petals: 2.6, to: 6 * Math.PI, open: 0.78, ruffle: 0.008, width: 0.9 },
  camellia: { petals: 2.8, to: 9 * Math.PI, open: 0.96, ruffle: 0.008, width: 0.88 },
  rose: { petals: 3.1, to: 13 * Math.PI, open: 1.05, ruffle: 0.01, width: 0.86 },
  great: { petals: 3.3, to: 17 * Math.PI, open: 1.05, ruffle: 0.01, width: 0.86 }
});

// Collects grids of vertices into one indexed geometry with vertex colours.
function gather() {
  const positions = [], colors = [], indices = [];
  return {
    positions, colors, indices,
    grid(rows, cols, at) {
      const base = positions.length / 3, out = { p: new THREE.Vector3(), c: new THREE.Color() };
      for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { at(i, j, out); positions.push(out.p.x, out.p.y, out.p.z); colors.push(out.c.r, out.c.g, out.c.b); }
      const row = cols + 1;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = base + i * row + j, b = a + row; indices.push(a, a + 1, b, a + 1, b + 1, b); }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      g.setIndex(indices); g.computeVertexNormals();
      return g;
    }
  };
}

const SPINE = 40, BASE_LIMIT = 1.5;
// One thin petal as a wedge wrapped round the flower's axis, so petals of different lean
// nest inside each other and never cut through: x runs out from the axis, y along it and
// z is the angle round it. `a` runs from the claw to the rim, `v` from one side edge to
// the other. phi: lean of the petal from the axis; cup: how far it curves back toward the
// heart along its length; reflex: how far the outer half rolls away again; half: half the
// angle it spans; roll: how far the side edges turn back at the rim; twist: one edge
// raised over the neighbour, the other tucked under.
function petalShape(p) {
  const R = new Float32Array(SPINE + 1), H = new Float32Array(SPINE + 1), TH = new Float32Array(SPINE + 1);
  for (let n = 0; n <= SPINE; n++) {
    const s = n / SPINE;
    TH[n] = Math.min(BASE_LIMIT, p.phi + p.cup * Math.cos(Math.PI * s)) + p.reflex * smooth((s - 0.62) / 0.38);
    if (n) { const m = (TH[n - 1] + TH[n]) / 2; R[n] = R[n - 1] + Math.sin(m) / SPINE; H[n] = H[n - 1] + Math.cos(m) / SPINE; }
  }
  return (a, v, out) => {
    const edge = Math.abs(v);
    // The rim: broad square shoulders, a faint notch at the tip and a slightly uneven edge.
    const reach = (0.97 - 0.36 * Math.pow(edge, 2.6)) * (1 - p.notch * Math.exp(-v * v / 0.04)) + 0.012 * Math.sin(v * 5 + p.wave);
    const f = clamp(a * reach) * SPINE, n = Math.min(SPINE - 1, Math.floor(f)), k = f - n;
    const th = mix(TH[n], TH[n + 1], k);
    // The blade swells outward between claw and rim, so a petal is a full form, not a cone.
    const lift = p.twist * v * smooth(a * 2) - p.roll * v * v * smooth((a - 0.55) / 0.45) - p.belly * (1 - v * v) * Math.sin(Math.PI * Math.min(1, a * 1.15))
      + p.ruffle * a * a * (Math.sin(v * 5 + p.wave + a * 3) * (0.35 + 0.65 * edge) + 0.25 * a * Math.sin(v * 9 + p.wave * 2.3));
    out.x = p.length * (mix(R[n], R[n + 1], k) - Math.cos(th) * lift);
    out.y = p.length * (mix(H[n], H[n + 1], k) + Math.sin(th) * lift);
    out.z = v * p.half * (0.3 + 0.7 * smooth(a / 0.5));
  };
}

// Petals wind inward along a spiral, as in Paul Nylander's parametric rose, and stand
// more upright toward the heart; every petal has its own lean. `cups` lists how open each
// key is: the first is the resting geometry, the rest become morph targets on the same
// topology, so a bloom can close and open again without rebuilding.
export function roseGeometry(tone, rng, { petals = 3.1, from = -TAU, to = 13 * Math.PI, open = 1.05, heart = 0.02, ruffle = 0.01, width = 0.88, cups = [1], detail = 1 } = {}) {
  const deep = color(tone.deep), mid = color(tone.mid), light = color(tone.light), c = new THREE.Color();
  const ns = Math.round(16 * detail), nx = Math.round(14 * detail), k0 = Math.ceil(from * petals / TAU), k1 = Math.floor(to * petals / TAU);
  const keys = cups.map(() => []), colors = [], indices = [], point = { x: 0, y: 0, z: 0 };
  let reach = 0, base = 0;
  for (let k = k0; k < k1; k++) {
    const centre = (k + 0.5) * TAU / petals, inner = (centre - from) / (to - from);
    const shade = 0.88 + rng() * 0.24, wave = rng() * TAU, own = 0.92 + rng() * 0.16, lean = (rng() - 0.5) * 0.1 + ((k - k0) % 2 ? 0.04 : -0.04);
    const length = (1 - 0.55 * inner) * (0.94 + rng() * 0.12), notch = rng() * 0.03, streak = rng() * TAU;
    const rest = mix(open, heart, Math.pow(inner, 0.75));
    const shapes = cups.map(cup => {
      const tight = 0.62 + 0.38 * Math.min(1, cup);
      return {
        tight, shape: petalShape({
          // The outermost petals are a little narrower, so darkness shows between them.
          length: length * tight, half: Math.PI / petals * width * own * (0.9 + 0.1 * smooth(inner * 4)) * (1 + 0.8 * inner), wave, notch, ruffle: ruffle * cup, twist: 0.035,
          phi: rest * (cup + (1 - cup) * inner * 0.5) + lean * cup * (1 - inner), cup: mix(0.36, 0.8, inner * inner), belly: 0.07 * (1 - inner),
          reflex: mix(1.45, 0.4, Math.pow(inner, 0.8)) * clamp(cup * 1.6 - 0.6),
          roll: mix(0.2, 0.05, inner) * clamp(cup)
        })
      };
    });
    for (let i = 0; i <= ns; i++) {
      const v = i / ns * 2 - 1, edge = Math.abs(v), grain = 0.5 * Math.sin(v * 17 + streak) + 0.5 * Math.sin(v * 41 + streak * 2.1);
      for (let j = 0; j <= nx; j++) {
        // Rows gather toward the rim, where the petal turns fastest.
        const a = 1 - Math.pow(1 - j / nx, 1.5);
        shapes.forEach(({ tight, shape }, key) => {
          shape(a, v, point);
          // Petals leave a small ring on the receptacle, inner ones a little higher.
          const r = Math.max(0.006, (0.008 + 0.092 * (1 - inner)) * tight + point.x), turn = centre + point.z;
          keys[key].push(r * Math.sin(turn), 0.05 * inner * tight + point.y, r * Math.cos(turn));
          if (!key) reach = Math.max(reach, r);
        });
        // Deep in the claw and toward the heart, lighter over the blade and palest on the
        // rolled rim: the value pattern that keeps one smooth petal off the next.
        c.copy(mid).lerp(deep, clamp(Math.pow(inner, 1.2) * 0.45 + (1 - smooth(a * 1.8)) * 0.75 + smooth((edge - 0.75) / 0.25) * 0.15))
          .lerp(light, smooth((a - 0.45) / 0.55) * (1 - inner * 0.3) * 0.6).multiplyScalar(shade * (1 + 0.05 * grain * a))
          .lerp(light, 0.3 * smooth((a - 0.88) / 0.12));
        colors.push(c.r, c.g, c.b);
      }
    }
    const row = nx + 1;
    for (let i = 0; i < ns; i++) for (let j = 0; j < nx; j++) { const a = base + i * row + j, b = a + row; indices.push(a, a + 1, b, a + 1, b + 1, b); }
    base += (ns + 1) * row;
  }
  const shaped = keys.map(positions => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices); g.scale(1 / reach, 1 / reach, 1 / reach); g.computeVertexNormals();
    return g;
  });
  const geometry = shaped[0];
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  if (shaped.length > 1) {
    geometry.morphAttributes.position = shaped.slice(1).map(g => g.attributes.position);
    geometry.morphAttributes.normal = shaped.slice(1).map(g => g.attributes.normal);
  }
  return geometry;
}

// One leaflet growing along +Y with its upper face toward +Z: folded along a pale midrib
// into two planes, saw-toothed at the margin, with veins running forward to the edge.
function leaflet(part, matrix, { length = 1, half = 0.3, fold = 0.4, bend = -0.5, twist = 0, wave = 0.05, teeth = 11, bite = 0.08, shade = 1, seed = 0 }) {
  const deep = color(LEAF.deep), mid = color(LEAF.mid), light = color(LEAF.light);
  part.grid(teeth * 2, 10, (i, j, out) => {
    const u = i / (teeth * 2), v = j / 10 * 2 - 1, edge = Math.abs(v);
    const body = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.85) * (1 - 0.3 * u);
    const s = v * half * body * (1 - (i % 2 ? 0 : bite) * Math.pow(edge, 3));
    const vein = Math.pow(0.5 + 0.5 * Math.cos((u - 0.13 * edge) * TAU * 7), 3) * smooth(edge * 5) * (1 - 0.4 * edge), rib = 1 - smooth(edge * 6);
    const along = Math.abs(bend) > 1e-3 ? Math.sin(bend * u) / bend : u, back = Math.abs(bend) > 1e-3 ? (1 - Math.cos(bend * u)) / bend : 0;
    const z = fold * Math.abs(s) + wave * Math.sin(u * 8 + seed) * edge * edge * half - 0.03 * vein * half, turn = twist * u;
    out.p.set((s * Math.cos(turn) - z * Math.sin(turn)) * length, along * length, (back + s * Math.sin(turn) + z * Math.cos(turn)) * length).applyMatrix4(matrix);
    out.c.copy(deep).lerp(mid, 0.3 + 0.55 * smooth(edge * 1.2) + 0.15 * Math.sin(u * 18 + edge * 9 + seed)).lerp(light, Math.max(rib * 0.7, vein * 0.4)).multiplyScalar(shade);
  });
}

// A compound leaf along +Y, upper face toward +Z: a terminal leaflet and one or two pairs
// on a thin stalk, as on a rose. Higher variants carry more leaflets and droop further.
export function leafGeometry(variant = 0) {
  const part = gather(), m = new THREE.Matrix4(), r = new THREE.Matrix4(), pairs = variant > 0.6 ? 2 : 1, droop = -(0.3 + variant * 0.5), stalk = color(LEAF.light).multiplyScalar(0.8);
  part.grid(6, 2, (i, j, out) => { out.p.set((j - 1) * 0.014, i / 6 * 0.52, j === 1 ? 0.01 : 0); out.c.copy(stalk); });
  leaflet(part, m.makeTranslation(0, 0.5, 0), { length: 0.5, half: 0.4, fold: 0.42, bend: -0.5 - variant * 0.4, twist: 0.25 - variant * 0.5, seed: variant * 9 });
  for (let pair = 0; pair < pairs; pair++) for (const side of [-1, 1]) {
    m.makeTranslation(0, 0.32 - pair * 0.2, 0).multiply(r.makeRotationZ(-side * (0.95 + pair * 0.12))).multiply(r.makeRotationY(side * 0.3));
    leaflet(part, m, { length: 0.4 - pair * 0.06, half: 0.4, fold: 0.5, bend: -0.35 - variant * 0.5, twist: side * 0.3, shade: side > 0 ? 1.06 : 0.92, seed: variant * 9 + pair * 3 + side });
  }
  // The whole leaf arches back over its stalk.
  for (let n = 0; n < part.positions.length; n += 3) {
    const y = part.positions[n + 1];
    part.positions[n + 1] = Math.sin(droop * y) / droop; part.positions[n + 2] += (1 - Math.cos(droop * y)) / droop;
  }
  return part.geometry();
}

// A sepal under the head: narrow, pointed, smooth-edged and turned back.
export function sepalGeometry() {
  const part = gather();
  leaflet(part, new THREE.Matrix4(), { half: 0.17, fold: 0.3, bend: -0.9, wave: 0.02, teeth: 8, bite: 0 });
  return part.geometry();
}

// A large shed petal, centred on its own middle: the same thin, cupped, rolled-back form
// as the petals of a head. Its colours are greys from shadowed claw to bright rim; the
// instance colour supplies the hue.
export function shedPetalGeometry() {
  const part = gather(), point = { x: 0, y: 0, z: 0 };
  const shape = petalShape({ length: 1, half: 0.62, phi: 1.1, cup: 0.55, reflex: 1.2, roll: 0.18, belly: 0.06, twist: 0.04, ruffle: 0.01, notch: 0.03, wave: 1.3 });
  part.grid(18, 16, (i, j, out) => {
    const v = i / 18 * 2 - 1, a = 1 - Math.pow(1 - j / 16, 1.5), edge = Math.abs(v);
    shape(a, v, point); out.p.set((0.3 + point.x) * Math.sin(point.z), point.y - 0.3, (0.3 + point.x) * Math.cos(point.z) - 0.7);
    out.c.setScalar((0.4 + 0.5 * smooth(a * 1.6) + 0.06 * Math.sin(v * 17) * a) * (1 - 0.15 * smooth((edge - 0.7) / 0.3)) + 0.3 * smooth((a - 0.9) / 0.1));
  });
  return part.geometry();
}
