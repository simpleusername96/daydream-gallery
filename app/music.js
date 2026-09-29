import { PLAYLIST } from "./music-playlist.js";
export { PLAYLIST };

// One streaming element belongs to the shell, independently of the scene renderer.
export class WorldMusic {
  constructor(onError = () => {}, createAudio = () => new Audio()) {
    Object.assign(this, { onError, createAudio, audio: null, index: 0, world: null,
      muted: true, playing: false, hidden: false, disposed: false, revision: 0,
      pending: null, failed: false });
  }
  get available() { return PLAYLIST.length > 0; }
  get running() { return this.available && !this.disposed && !this.muted && this.playing && !this.hidden; }
  ensureAudio() {
    if (this.audio || this.disposed || !this.available) return;
    this.audio = this.createAudio();
    this.audio.preload = "none";
    this.audio.volume = 0.65;
    this.audio.loop = PLAYLIST[this.index].loop === true;
    this.audio.addEventListener("ended", this.onEnded);
    this.audio.addEventListener("error", this.onMediaError);
    this.audio.src = PLAYLIST[this.index].url;
  }
  onEnded = () => {
    if (this.disposed || !this.available) return;
    this.revision++;
    this.pending = null;
    this.index = (this.index + 1) % PLAYLIST.length;
    this.audio.loop = PLAYLIST[this.index].loop === true;
    this.audio.src = PLAYLIST[this.index].url;
    void this.sync();
  };
  onMediaError = () => { if (!this.disposed) this.fail(this.audio?.error); };
  fail(error) {
    if (this.failed || this.disposed) return;
    this.failed = true;
    this.muted = true;
    void this.sync();
    this.onError(error);
  }
  async sync() {
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
    }
  }
  async setMuted(value) {
    if (this.disposed) return;
    this.muted = value || !this.available;
    if (!this.available) return;
    if (!value) {
      this.ensureAudio();
      if (this.failed) { this.failed = false; this.audio.load(); }
    }
    await this.sync();
  }
  setPlaying(value) { this.playing = value; void this.sync(); }
  setHidden(value) { this.hidden = value; void this.sync(); }
  async select(id) { this.world = id; }
  snapshot() {
    return { world: this.world, track: PLAYLIST[this.index]?.id ?? null, title: PLAYLIST[this.index]?.title ?? null,
      available: this.available,
      index: this.index, count: PLAYLIST.length, currentTime: this.audio?.currentTime ?? 0,
      duration: Number.isFinite(this.audio?.duration) ? this.audio.duration : null,
      paused: this.audio?.paused ?? true, muted: this.muted, hidden: this.hidden,
      failed: this.failed, disposed: this.disposed };
  }
  dispose() {
    this.disposed = true;
    this.revision++;
    this.pending = null;
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeEventListener("ended", this.onEnded);
    this.audio.removeEventListener("error", this.onMediaError);
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio = null;
  }
}
