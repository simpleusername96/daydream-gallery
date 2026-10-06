import { PLAYLIST } from "./music-playlist.js";
export { PLAYLIST };

// Fixed output attenuation applies at every slider setting, for every recording.
const OUTPUT_GAIN = 10 ** (-12 / 20);

// One streaming element belongs to the shell, independently of the scene renderer.
export class WorldMusic {
  constructor(onError = () => {}, createAudio = () => new Audio(), random = Math.random, catalog = PLAYLIST) {
    // Choose one session order; scene changes and repeat cycles never reshuffle it.
    this.playlist = [...catalog];
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    Object.assign(this, { onError, createAudio, audio: null, index: 0, world: null,
      muted: true, playing: false, hidden: false, disposed: false, revision: 0,
      pending: null, part: 0, failed: false, blocked: false, volume: this.playlist[0]?.volume ?? 0.2,
      repeat: false, hasPlaybackIntent: false, listeners: new Set() });
  }
  get available() { return this.playlist.length > 0; }
  get running() { return this.available && !this.disposed && !this.muted && this.playing && !this.hidden; }
  get currentTrack() { return this.playlist[this.index]; }
  get currentSource() { return this.currentTrack.parts?.[this.part]?.url ?? this.currentTrack.url; }
  get nativeLoop() { return !this.currentTrack.parts?.length && (this.repeat || this.currentTrack.loop === true); }
  ensureAudio() {
    if (this.audio || this.disposed || !this.available) return;
    this.audio = this.createAudio();
    this.audio.preload = "none";
    this.audio.volume = this.volume * OUTPUT_GAIN;
    this.audio.loop = this.nativeLoop;
    this.audio.addEventListener("ended", this.onEnded);
    this.audio.addEventListener("error", this.onMediaError);
    this.audio.src = this.currentSource;
  }
  onEnded = () => {
    if (this.disposed || !this.available) return;
    if (this.part + 1 < (this.currentTrack.parts?.length ?? 1)) {
      this.revision++; this.pending = null; this.part++; this.failed = false;
      this.audio.pause(); this.audio.src = this.currentSource;
      void this.sync(); this.notify(); return;
    }
    this.selectTrack(this.repeat ? this.playlist[this.index].id : this.playlist[(this.index + 1) % this.playlist.length].id, true);
  };
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { for (const listener of this.listeners) listener(this.snapshot()); }
  selectTrack(id, restart = false) {
    const index = this.playlist.findIndex(track => track.id === id);
    if (index < 0 || this.disposed || (index === this.index && !restart)) return;
    this.revision++;
    this.pending = null;
    this.index = index; this.part = 0;
    this.failed = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.loop = this.nativeLoop;
      this.audio.src = this.currentSource;
    }
    void this.sync();
    this.notify();
  }
  step(delta) {
    if (!this.available || this.disposed) return;
    this.selectTrack(this.playlist[(this.index + delta + this.playlist.length) % this.playlist.length].id, true);
  }
  setVolume(value) {
    if (!Number.isFinite(value) || this.disposed) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.audio) this.audio.volume = this.volume * OUTPUT_GAIN;
    this.notify();
  }
  setRepeat(value) {
    if (this.disposed) return;
    this.repeat = Boolean(value);
    if (this.audio) this.audio.loop = this.nativeLoop;
    this.notify();
  }
  moveTrack(id, delta) {
    const from = this.playlist.findIndex(track => track.id === id), to = from + delta;
    if (this.disposed || from < 0 || to < 0 || to >= this.playlist.length) return;
    const current = this.playlist[this.index];
    const [track] = this.playlist.splice(from, 1);
    this.playlist.splice(to, 0, track);
    this.index = this.playlist.indexOf(current);
    this.notify();
  }
  shuffle(random = Math.random) {
    if (!this.available || this.disposed) return;
    const current = this.playlist[this.index];
    const rest = this.playlist.filter(track => track !== current);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.playlist = [current, ...rest]; this.index = 0;
    this.notify();
  }
  onMediaError = () => { if (!this.disposed) this.fail(this.audio?.error); };
  fail(error) {
    if (this.failed || this.disposed) return;
    this.failed = true;
    this.blocked = error?.name === "NotAllowedError";
    this.muted = true;
    void this.sync();
    if (!this.blocked) this.onError(error);
  }
  async sync() {
    this.notify();
    if (!this.running) {
      this.revision++;
      this.pending = null;
      this.audio?.pause();
      return;
    }
    this.ensureAudio();
    if (this.pending || !this.audio.paused) return;
    const revision = ++this.revision;
    // Invoke play before yielding so the initiating gesture remains valid.
    try {
      const pending = this.audio.play();
      this.pending = pending;
      await pending;
    } catch (error) {
      if (revision === this.revision && this.running) this.fail(error);
    } finally {
      if (revision === this.revision) this.pending = null;
      if (!this.disposed) this.notify();
    }
  }
  async setMuted(value) {
    if (this.disposed) return;
    this.hasPlaybackIntent = true;
    if (value && this.blocked) { this.blocked = false; this.failed = false; }
    this.muted = value || !this.available;
    if (!this.available) return;
    if (!value && this.failed) {
      this.failed = false;
      if (!this.blocked) this.audio?.load();
      this.blocked = false;
    }
    await this.sync();
  }
  // Attempt once on entry; a real gesture can recover a browser-blocked start.
  async activate({ userGesture = true } = {}) {
    if ((!this.hasPlaybackIntent || (userGesture && this.blocked)) && this.available && !this.disposed) await this.setMuted(false);
  }
  setPlaying(value) { this.playing = value; void this.sync(); }
  setHidden(value) { this.hidden = value; void this.sync(); }
  async select(id) { this.world = id; }
  snapshot() {
    const parts = this.currentTrack?.parts;
    const offset = parts?.slice(0, this.part).reduce((sum, part) => sum + part.duration, 0) ?? 0;
    return { world: this.world, track: this.playlist[this.index]?.id ?? null, title: this.playlist[this.index]?.title ?? null,
      available: this.available, volume: this.volume, repeat: this.repeat, enabled: !this.muted, running: this.running,
      index: this.index, count: this.playlist.length, order: this.playlist.map(track => track.id), currentTime: offset + (this.audio?.currentTime ?? 0),
      part: this.part, parts: parts?.length ?? 1,
      duration: parts ? parts.reduce((sum, part) => sum + part.duration, 0) : Number.isFinite(this.audio?.duration) ? this.audio.duration : null,
      paused: this.audio?.paused ?? true, muted: this.muted, hidden: this.hidden,
      failed: this.failed, blocked: this.blocked, disposed: this.disposed };
  }
  dispose() {
    this.disposed = true;
    this.revision++;
    this.pending = null;
    this.listeners.clear();
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeEventListener("ended", this.onEnded);
    this.audio.removeEventListener("error", this.onMediaError);
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio = null;
  }
}
