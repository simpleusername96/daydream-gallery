// Append newly published worlds; the player shows the newest first.
export const WORLD_ORDER = ["journey", "stillwater", "glass-valley", "quiet-ascent"].reverse();

export const WORLDS = Object.freeze({
  "quiet-ascent": Object.freeze({
    id: "quiet-ascent", label: "Quiet Ascent", adapter: "worlds/quiet-ascent/adapter.html",
    autoDurationMs: 0, sceneDurationMs: 0, music: true,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  }),
  "glass-valley": Object.freeze({
    id: "glass-valley", label: "Glass Valley", adapter: "worlds/glass-valley/adapter.html",
    interactive: true,
    autoDurationMs: 0, sceneDurationMs: 0, music: true,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  }),
  journey: Object.freeze({
    id: "journey",
    label: "Journey",
    adapter: "worlds/journey/adapter.html",
    autoDurationMs: 210_000,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  }),
  stillwater: Object.freeze({
    id: "stillwater",
    label: "Stillwater",
    adapter: "worlds/stillwater/adapter.html",
    autoDurationMs: 180_000,
    sceneDurationMs: 0,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  })
});
