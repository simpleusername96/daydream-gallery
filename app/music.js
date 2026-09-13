// Original Ambient Worlds scores. Native synthesis only; no downloaded samples.
export const LOOP_SECONDS = 32;
export const MUSIC_PROFILES = Object.freeze({
  meadow: { name: "Meadow · 풀빛", cutoff: 1700, pad: "sine", pluck: "triangle", melody: [74,78,81,76,74,71,69,73], air: 700 },
  journey: { name: "Journey · 먼 길", cutoff: 1300, pad: "triangle", pluck: "sine", melody: [69,74,76,73,71,69,66,69], air: 420 },
  stillwater: { name: "Stillwater · 잔물결", cutoff: 1100, pad: "sine", pluck: "sine", melody: [78,76,74,81,78,74,73,76], air: 240 }
});
const CHORDS = [[50,57,64,66],[47,54,57,62],[43,50,57,59],[45,52,55,59]];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

export async function renderScore(id, variant = 0, OfflineContext = globalThis.OfflineAudioContext) {
  const profile = MUSIC_PROFILES[id];
  if (!profile) throw Error("Unknown music family.");
  // Render two cycles; the second contains the previous cycle's tails at both ends.
  const rate = 22050, context = new OfflineContext(1, rate * LOOP_SECONDS * 2, rate);
  const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = profile.cutoff; filter.Q.value = .35;
  const dry = context.createGain(); dry.gain.value = .88; filter.connect(dry).connect(context.destination);
  const delay = context.createDelay(2), feedback = context.createGain(), wet = context.createGain();
  delay.delayTime.value = .75; feedback.gain.value = .24; wet.gain.value = .17;
  filter.connect(delay); delay.connect(feedback).connect(delay); delay.connect(wet).connect(context.destination);
  function note(midi, start, duration, amplitude, type, pad = false) {
    const gain = context.createGain(), oscillator = context.createOscillator();
    oscillator.type = type; oscillator.frequency.value = hz(midi);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(amplitude, start + (pad ? 2.6 : .045));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    gain.gain.linearRampToValueAtTime(0, start + duration + .04);
    oscillator.connect(gain).connect(filter);
    oscillator.start(start); oscillator.stop(start + duration + .05);
  }
  for (let cycle = 0; cycle < 2; cycle++) {
    const base = cycle * LOOP_SECONDS;
    CHORDS.forEach((chord, bar) => chord.forEach((midi, voice) =>
      note(midi, base + bar * 8 + voice * .025, 11.8, voice ? .026 : .034, profile.pad, true)));
    profile.melody.forEach((midi, i) => {
      const shift = variant && (i === 2 || i === 6) ? -2 : 0;
      note(midi + shift, base + i * 4 + 1 + (variant ? .5 : 0), id === "stillwater" ? 4.8 : 3.4, .06, profile.pluck);
      if (id === "meadow" && i % 2 === variant) note(midi + 12, base + i * 4 + 2.5, 1.8, .009, "sine");
    });
  }
  // Quiet filtered air/water; a short periodic buffer keeps the score seam exact.
  const noise = context.createBuffer(1, rate, rate), data = noise.getChannelData(0);
  let random = 8121, brown = 0;
  for (let i = 0; i < data.length; i++) { random = (Math.imul(random,1664525)+1013904223)>>>0; brown = .985*brown + (random/4294967296-.5)*.015; data[i] = brown; }
  const source = context.createBufferSource(), airFilter = context.createBiquadFilter(), air = context.createGain();
  source.buffer = noise; source.loop = true; airFilter.type = "lowpass"; airFilter.frequency.value = profile.air; air.gain.value = .035;
  source.connect(airFilter).connect(air).connect(context.destination); source.start();
  const rendered = await context.startRendering();
  const buffer = new AudioBuffer({ numberOfChannels: 1, length: rate * LOOP_SECONDS, sampleRate: rate });
  buffer.copyToChannel(rendered.getChannelData(0).subarray(rate * LOOP_SECONDS), 0);
  return buffer;
}

export class WorldMusic {
  constructor(onError = () => {}) {
    this.onError = onError;
    this.world = "meadow"; this.muted = true; this.playing = true; this.hidden = false;
    this.context = null; this.buffers = new Map(); this.families = new Map();
    this.preparing = null; this.controlVersion = 0; this.suspendTimer = 0; this.disposed = false;
  }
  init() {
    if (this.context) return;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    this.context = new Context();
    this.master = this.context.createGain(); this.master.gain.value = 0;
    this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 2048;
    this.master.connect(this.analyser).connect(this.context.destination);
  }
  async setMuted(value) {
    this.muted = Boolean(value); const version = ++this.controlVersion;
    clearTimeout(this.suspendTimer);
    if (this.muted) {
      if (this.context) {
        this.master.gain.setTargetAtTime(0, this.context.currentTime, .05);
        this.suspendTimer = setTimeout(() => { if (this.muted) this.context.suspend().catch(() => {}); }, 250);
      }
      return;
    }
    this.init();
    await this.context.resume();
    if (this.muted || version !== this.controlVersion || this.disposed) return;
    this.master.gain.setTargetAtTime(.55, this.context.currentTime, .5);
    await this.select(this.world);
    this.sync();
  }
  setPlaying(value) { this.playing = Boolean(value); this.sync(); }
  setHidden(value) { this.hidden = Boolean(value); this.sync(); }
  sync() {
    if (!this.context || this.disposed) return;
    if (this.muted || !this.playing || this.hidden) this.context.suspend().catch(() => {});
    else this.context.resume().catch(() => {});
  }
  ramp(family, value, seconds = 8) {
    const t = this.context.currentTime, gain = family.gain.gain;
    gain.cancelAndHoldAtTime(t);
    gain.linearRampToValueAtTime(value, t + seconds);
    family.retireAt = value === 0 ? t + seconds : null;
  }
  async select(id) {
    if (!MUSIC_PROFILES[id] || this.disposed) return;
    this.world = id;
    if (!this.context || this.muted) return;
    this.update();
    const existing = this.families.get(id);
    if (existing) {
      if (existing.retireAt !== null) this.ramp(existing, 1);
      for (const [key, family] of this.families) if (key !== id && family.retireAt === null) this.ramp(family, 0);
      return;
    }
    // Rapid selections coalesce to the latest request while the current blend ends.
    if (this.families.size >= 2 || this.preparing) return;
    this.preparing = id;
    try {
      if (!this.buffers.has(id)) {
        const buffers = await Promise.all([renderScore(id, 0), renderScore(id, 1)]);
        if (this.disposed) return;
        this.buffers.set(id, buffers);
      }
      if (this.disposed || this.muted || this.world !== id) return;
      const family = this.startFamily(id, this.buffers.get(id));
      for (const other of this.families.values()) this.ramp(other, 0);
      this.families.set(id, family); this.ramp(family, 1, this.families.size > 1 ? 8 : 1);
    } finally { this.preparing = null; }
  }
  startFamily(id, buffers) {
    const c = this.context, gain = c.createGain(), lfo = c.createOscillator();
    gain.gain.value = 0; gain.connect(this.master); lfo.frequency.value = 1 / 128;
    const nodes = [gain, lfo], sources = [];
    const start = c.currentTime + .025;
    buffers.forEach((buffer, i) => {
      const source = c.createBufferSource(), mix = c.createGain(), amount = c.createGain();
      source.buffer = buffer; source.loop = true; mix.gain.value = .5; amount.gain.value = i ? -.28 : .28;
      lfo.connect(amount).connect(mix.gain); source.connect(mix).connect(gain);
      source.start(start, start % LOOP_SECONDS); sources.push(source); nodes.push(source,mix,amount);
    });
    lfo.start(start);
    return { id, gain, nodes, sources, lfo, startedAt: start, retireAt: null };
  }
  update() {
    if (!this.context || this.disposed) return;
    for (const [id, family] of this.families) if (family.retireAt !== null && this.context.currentTime >= family.retireAt) {
      for (const source of [...family.sources, family.lfo]) source.stop();
      family.nodes.forEach(node => node.disconnect()); this.families.delete(id);
    }
  }
  tick() {
    this.update();
    if (!this.muted && this.context && !this.families.has(this.world) && !this.preparing && this.families.size < 2) {
      this.select(this.world).catch(() => { this.muted = true; this.sync(); this.onError(); });
    }
  }
  snapshot() {
    return { world: this.world, muted: this.muted, state: this.context?.state || "uninitialized",
      time: this.context?.currentTime || 0, preparing: this.preparing, buffers: this.buffers.size * 2,
      families: [...this.families.values()].map(f => ({ id:f.id, startedAt:f.startedAt, retireAt:f.retireAt })),
      loopSeconds: LOOP_SECONDS };
  }
  dispose() {
    this.disposed = true; clearTimeout(this.suspendTimer);
    for (const f of this.families.values()) { for (const source of [...f.sources,f.lfo]) { try { source.stop(); } catch {} } f.nodes.forEach(n=>n.disconnect()); }
    this.families.clear(); this.buffers.clear(); this.context?.close().catch(()=>{});
  }
}
