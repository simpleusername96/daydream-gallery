export const WORLD_ORDER = ["journey", "stillwater"];

export const WORLDS = Object.freeze({
  meadow: Object.freeze({
    id: "meadow",
    label: "Meadow",
    adapter: "worlds/meadow/adapter.html",
    fallbackImage: "references/user/2026-09-11-meadow-infinite-world.webp",
    autoDurationMs: 150_000,
    defaultCapabilities: Object.freeze({ play: false, sound: false, scenes: false })
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
