import { buildValleyChunk } from './geometry.js';

self.onmessage = ({ data: { key, seed, id, lod } }) => {
  try {
    const chunk = buildValleyChunk(seed, id, lod);
    const buffers = ['stone', 'plants', 'clouds', 'water', 'stream']
      .flatMap(name => [chunk[name].vertices.buffer, chunk[name].indices.buffer]);
    self.postMessage({ key, chunk }, buffers);
  } catch (error) {
    self.postMessage({ key, error: error.message });
  }
};
