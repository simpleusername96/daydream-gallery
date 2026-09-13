// Active viewing time. Hidden/paused/loading intervals never consume a scene.
export class PlaybackClock {
  constructor() { this.worldMs = 0; this.sceneMs = 0; }
  resetWorld() { this.worldMs = this.sceneMs = 0; }
  resetScene() { this.sceneMs = 0; }
  advance(deltaMs, { running, auto, worldDurationMs, sceneDurationMs = 0 }) {
    if (!running || !Number.isFinite(deltaMs) || deltaMs < 0) return null;
    this.worldMs += deltaMs; this.sceneMs += deltaMs;
    if (auto && this.worldMs >= worldDurationMs) { this.resetWorld(); return "world"; }
    if (sceneDurationMs && this.sceneMs >= sceneDurationMs) { this.resetScene(); return "scene"; }
    return null;
  }
}
