// Public catalog approved on 2026-10-01: Journey and five selected CC0 recordings.
export const PLAYLIST = Object.freeze([
  Object.freeze({ id: "shared-loop", title: "Journey — Daydream Gallery", loop: false, volume: 0.2,
    url: new URL("../assets/audio/shared-loop.wav", import.meta.url).href }),
  Object.freeze({ id: "aria", title: "Aria — Kimiko Ishizaka", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/aria.mp3", import.meta.url).href }),
  Object.freeze({ id: "vaporware", title: "Vaporware — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/vaporware.mp3", import.meta.url).href }),
  Object.freeze({ id: "sunset-plains", title: "Sunset Plains — Yoiyami", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/sunset-plains.mp3", import.meta.url).href }),
  Object.freeze({ id: "synthwave-4k", title: "Synthwave 4k — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/synthwave-4k.mp3", import.meta.url).href }),
  Object.freeze({ id: "lifewave-2k", title: "Lifewave 2k — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/lifewave-2k.mp3", import.meta.url).href })
]);
