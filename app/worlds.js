export const WORLD_ORDER = ["journey", "stillwater", "glass-valley"];

export const WORLDS = Object.freeze({
  "glass-valley": Object.freeze({
    id: "glass-valley", label: "Glass Valley", adapter: "worlds/glass-valley/adapter.html",
    interactive: true,
    fallbackImage: "worlds/glass-valley/source/previews/03-downstream.png",
    autoDurationMs: 0, sceneDurationMs: 0, music: false,
    defaultCapabilities: Object.freeze({ play: true, sound: false, scenes: true })
  }),
  journey: Object.freeze({
    id: "journey",
    label: "Journey",
    adapter: "worlds/journey/adapter.html",
    fallbackImage: "",
    autoDurationMs: 210_000,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  }),
  stillwater: Object.freeze({
    id: "stillwater",
    label: "Stillwater",
    adapter: "worlds/stillwater/adapter.html",
    fallbackImage: "",
    autoDurationMs: 180_000,
    sceneDurationMs: 0,
    defaultCapabilities: Object.freeze({ play: true, sound: true, scenes: true })
  })
});
