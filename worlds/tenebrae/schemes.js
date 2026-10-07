// Colour schemes: each one is a complete look over the same dark ground. A scheme sets
// the three bloom colours, the colour of the stamens, the foliage tint, the key light, a
// coloured back light, the faint glow of the ground and the final grade. Pure data.

// Petal colours from heart to rim.
export const TONES = Object.freeze({
  blush: { deep: 0xa85a58, mid: 0xe2aa9c, light: 0xf6e0d4 },
  cream: { deep: 0xa88c5c, mid: 0xe6d8ba, light: 0xf8f1e2 },
  crimson: { deep: 0x36050b, mid: 0x86101e, light: 0xc03a3c },
  apricot: { deep: 0x9c4a1c, mid: 0xdc944c, light: 0xf2cc92 },
  violet: { deep: 0x20143a, mid: 0x563c82, light: 0x9a84bc },
  flame: { deep: 0x94160f, mid: 0xd4482a, light: 0xf0c452 },
  magenta: { deep: 0x3a0030, mid: 0xe0109a, light: 0xff7ad8 },
  hotpink: { deep: 0x5a0830, mid: 0xff3c8c, light: 0xffb0d0 },
  electric: { deep: 0x160644, mid: 0x7a2cff, light: 0xc09aff },
  orange: { deep: 0x4a1400, mid: 0xff6a00, light: 0xffc060 },
  amber: { deep: 0x4a2800, mid: 0xffa600, light: 0xffe08a },
  blue: { deep: 0x030838, mid: 0x1846ff, light: 0x7ab0ff },
  lime: { deep: 0x183000, mid: 0x9be000, light: 0xe6ff7a },
  yellow: { deep: 0x3c3000, mid: 0xf2dc00, light: 0xfff8a0 },
  citron: { deep: 0x485810, mid: 0xd4ee5c, light: 0xf8ffc8 },
  white: { deep: 0x60606c, mid: 0xe6e6f0, light: 0xffffff },
  ice: { deep: 0x1c3650, mid: 0x9cc8ec, light: 0xeef8ff },
  teal: { deep: 0x002826, mid: 0x00b09a, light: 0x90f0e0 }
});

// Five looks that share nothing but the dark ground: warm oil colour, pink against cyan,
// orange against blue, yellow-green against violet, and cold white.
// tones: one list of three, or several to choose from by seed. key/back: light colours;
// backPower: strength of the back light relative to the key. foliage multiplies the
// green leaf colours. grade: tint of shadows, tint of lights, saturation.
export const SCHEMES = Object.freeze([
  { name: 'old master', tones: [['blush', 'cream', 'crimson'], ['cream', 'apricot', 'crimson'], ['crimson', 'cream', 'violet'], ['apricot', 'blush', 'cream'], ['cream', 'blush', 'flame']], stamen: 0xd8a020,
    key: 0xffd9a8, back: 0xffb070, backPower: 0, foliage: [1, 1, 1], ground: [0.02, 0.011, 0.0055], grade: { shadow: [1.1, 0.96, 0.78], light: [1.03, 1, 0.93], saturation: 1.1 } },
  { name: 'neon magenta', tones: [['magenta', 'hotpink', 'electric']], stamen: 0x9af8ff,
    key: 0xffa8e6, back: 0x00d8ff, backPower: 0.55, foliage: [0.25, 0.75, 1.5], ground: [0.008, 0.001, 0.007], grade: { shadow: [0.92, 0.88, 1.18], light: [1.02, 0.98, 1.04], saturation: 1.35 } },
  { name: 'orange and blue', tones: [['orange', 'amber', 'blue']], stamen: 0xfff2c0,
    key: 0xffb46e, back: 0x2a5cff, backPower: 0.7, foliage: [0.3, 0.5, 1.7], ground: [0.0015, 0.003, 0.011], grade: { shadow: [0.85, 0.92, 1.25], light: [1.05, 1, 0.92], saturation: 1.35 } },
  { name: 'acid', tones: [['lime', 'yellow', 'citron']], stamen: 0x7a2cff,
    key: 0xf4ffd0, back: 0x8a2cff, backPower: 0.6, foliage: [0.5, 0.45, 1.4], ground: [0.004, 0.0015, 0.01], grade: { shadow: [0.95, 0.9, 1.2], light: [1, 1.03, 0.94], saturation: 1.3 } },
  { name: 'ice', tones: [['ice', 'white', 'teal']], stamen: 0xfff0b0,
    key: 0xdcecff, back: 0x30ffd0, backPower: 0.45, foliage: [0.3, 0.9, 1.1], ground: [0.0015, 0.006, 0.009], grade: { shadow: [0.82, 0.98, 1.2], light: [0.96, 1.01, 1.06], saturation: 1.15 } }
]);

function shuffled(block) {
  let a = Math.imul(block + 1, 0x9e3779b1) | 0;
  const order = SCHEMES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    a = Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) + 0x297a2d39 | 0;
    const j = ((a ^ (a >>> 13)) >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
// The scheme of a seed is random but fair: every run of SCHEMES.length seeds starting at a
// multiple of that count uses each scheme once, in an order shuffled for that run, and
// two neighbouring seeds never share a scheme.
export function schemeOf(seed) {
  const n = SCHEMES.length, block = Math.floor(seed / n), order = shuffled(block);
  if (order[0] === shuffled(block - 1)[n - 1]) [order[0], order[1]] = [order[1], order[0]];
  return SCHEMES[order[((seed % n) + n) % n]];
}
