// Indexed materials and the slow day cycle. Time of day is a palette change only:
// every pixel keeps its index, so shapes, shadows and relief stay registered.
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const mix = (a, b, t) => a.map((value, c) => value + (b[c] - value) * t);

const anchors = {
  sky: [[13,81,192],[18,108,222],[29,133,237],[47,152,243],[69,169,246],[96,189,248]],
  leaf: [[57,70,39],[83,99,48],[114,131,57],[149,159,72],[184,187,97],[212,207,128]],
  bark: [[57,40,32],[86,57,38],[118,81,49],[154,112,65],[185,143,91]],
  apple: [[154,29,28],[202,35,28],[238,53,33],[255,139,98]],
  dune: [[105,123,194],[125,142,211],[146,160,222],[168,179,233],[190,197,241],[214,216,242],[234,230,242],[247,242,236],[255,249,238],[255,252,243]],
};
// Fine color ramps retain bark, individual leaves and delicate sand relief.
const counts = {sky: 128, leaf: 14, bark: 14, apple: 8, dune: 36};
const ramp = (colors, count) => Array.from({length: count}, (_, i) => {
  const at = i / (count - 1) * (colors.length - 1), a = Math.floor(at), b = Math.min(a + 1, colors.length - 1);
  return mix(colors[a], colors[b], at - a).map(Math.round);
});
const dayRamps = Object.fromEntries(Object.entries(anchors).map(([name, colors]) => [name, ramp(colors, counts[name])]));
export const PALETTE = Object.freeze(Object.values(dayRamps).flat().map(c => Object.freeze(c)));
export const ids = Object.freeze(Object.fromEntries(Object.entries(dayRamps).map(([name, colors]) =>
  [name, Object.freeze(colors.map(color => PALETTE.indexOf(color)))])));

// Other hours restate the same ramps: a six-stop sky, a shade/mid/lit sand ramp that
// keeps the daytime tonal spacing, and a tint for the tree. The apple stays the accent.
const luminance = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
const duneTone = dayRamps.dune.map(c => (luminance(c) - luminance(dayRamps.dune[0])) /
  (luminance(dayRamps.dune.at(-1)) - luminance(dayRamps.dune[0])));
function hour({sky, dune: [shade, middle, lit], leaf, bark, apple, stars = 0, moonlight = 0, sheen = 1}) {
  const tint = (colors, t) => colors.map(c => c.map((value, i) => Math.round(clamp(value * t[i], 0, 255))));
  const colors = [
    ...ramp(sky, counts.sky), ...tint(dayRamps.leaf, leaf), ...tint(dayRamps.bark, bark), ...tint(dayRamps.apple, apple),
    ...duneTone.map(t => (t < .55 ? mix(shade, middle, t / .55) : mix(middle, lit, (t - .55) / .45)).map(Math.round)),
  ];
  return {colors: Float32Array.from(colors.flat()), stars, moonlight, sheen};
}
const hours = {
  day: {colors: Float32Array.from(PALETTE.flat()), stars: 0, moonlight: 0, sheen: 1},
  golden: hour({sky: [[16,70,170],[30,100,200],[66,134,214],[124,168,218],[190,196,204],[240,214,172]],
    dune: [[112,112,188],[206,180,212],[255,236,202]], leaf: [1.08,1,.8], bark: [1.1,.98,.84], apple: [1.04,.96,.86]}),
  sunset: hour({sky: [[34,46,124],[74,66,152],[140,86,160],[214,112,134],[248,150,102],[255,198,124]],
    dune: [[78,70,150],[170,116,168],[255,190,152]], leaf: [.92,.72,.66], bark: [.98,.76,.72], apple: [1,.8,.78], sheen: .8}),
  dusk: hour({sky: [[12,18,62],[22,32,92],[44,50,122],[84,70,136],[136,94,138],[186,126,134]],
    dune: [[40,46,104],[82,86,146],[146,140,184]], leaf: [.44,.46,.62], bark: [.46,.46,.62], apple: [.64,.44,.56],
    stars: .35, moonlight: .7, sheen: .4}),
  night: hour({sky: [[4,8,28],[6,12,38],[9,17,50],[13,24,62],[19,33,76],[27,45,92]],
    dune: [[20,30,72],[58,76,128],[148,170,214]], leaf: [.27,.36,.52], bark: [.28,.32,.48], apple: [.62,.3,.38],
    stars: 1, moonlight: 1, sheen: .3}),
  dawn: hour({sky: [[38,66,146],[80,106,182],[146,146,204],[216,168,190],[248,194,170],[255,220,182]],
    dune: [[96,104,176],[190,170,212],[255,228,216]], leaf: [.9,.84,.88], bark: [.92,.84,.88], apple: [1,.9,.92],
    stars: .1, moonlight: .35, sheen: .85}),
};

/** One full day in active seconds; playback opens in clear daylight about a minute before the light turns. */
export const DAY_SECONDS = 540;
const OPENING = .28;
const schedule = [[0,'day'],[.40,'day'],[.50,'golden'],[.57,'sunset'],[.64,'dusk'],[.71,'night'],[.85,'night'],[.925,'dawn'],[.975,'day'],[1,'day']];

/** Blend the two neighboring hours. `colors` is a flat RGB array in PALETTE order. */
export function daylight(time, colors = new Float32Array(PALETTE.length * 3)) {
  const cycle = ((Math.max(0, time) / DAY_SECONDS + OPENING) % 1 + 1) % 1;
  let k = 0; while (schedule[k + 1][0] <= cycle) k++;
  const [from, a] = schedule[k], [to, b] = schedule[k + 1], t = smooth((cycle - from) / (to - from));
  const A = hours[a], B = hours[b];
  if (a === b) colors.set(A.colors); else for (let i = 0; i < colors.length; i++) colors[i] = A.colors[i] + (B.colors[i] - A.colors[i]) * t;
  const value = key => A[key] + (B[key] - A[key]) * t;
  // The moon climbs from behind the far-left dune, on the side the fixed shadows already imply.
  const climb = clamp((cycle - .60) / .34);
  return {cycle, colors, stars: value('stars'), moonlight: value('moonlight'), sheen: value('sheen'),
    moon: {x: 34 + 196 * climb, y: 266 - 296 * Math.sin(climb * Math.PI / 2), climb}};
}
