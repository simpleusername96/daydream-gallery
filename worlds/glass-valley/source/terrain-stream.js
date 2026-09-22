// One worker per world, with only the current and next travel window retained.
export class TerrainStream {
  constructor(seed) {
    this.seed = seed;
    this.entries = new Map();
    this.worker = new Worker(new URL('./terrain-worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }) => {
      const entry = this.entries.get(data.key);
      if (!entry) return;
      if (data.error) this.fail(new Error(data.error));
      else { entry.chunk = data.chunk; entry.resolve(data.chunk); }
    };
    this.worker.onerror = event => { event.preventDefault(); this.fail(new Error(event.message)); };
    this.worker.onmessageerror = () => this.fail(new Error('Terrain worker message could not be decoded.'));
  }
  fail(error) {
    this.error = error;
    for (const entry of this.entries.values()) entry.reject(error);
    this.worker.terminate();
  }
  request(id, lod) {
    if (this.error) throw this.error;
    const key = `${id}:${lod}`;
    if (!this.entries.has(key)) {
      const entry = {};
      entry.promise = new Promise((resolve, reject) => Object.assign(entry, { resolve, reject }));
      // Prefetch may finish before anyone awaits it. Surface errors in update/settle.
      entry.promise.catch(() => {});
      this.entries.set(key, entry);
      this.worker.postMessage({ key, seed: this.seed, id, lod });
    }
    return this.entries.get(key);
  }
  retain(keys) {
    for (const [key, entry] of this.entries) if (!keys.has(key)) {
      entry.resolve(null);
      this.entries.delete(key);
    }
  }
  dispose() {
    this.worker.terminate();
    for (const entry of this.entries.values()) entry.resolve(null);
    this.entries.clear();
  }
}
