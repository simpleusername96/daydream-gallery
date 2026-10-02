// Shared session catalog; public recordings require the reviewed export catalog.
export const PLAYLIST = Object.freeze([
  Object.freeze({ id: "shared-loop", title: "Journey — Daydream Gallery", loop: false, volume: 0.2,
    url: new URL("../assets/audio/shared-loop.wav", import.meta.url).href }),
  Object.freeze({ id: "vaporware", title: "Vaporware — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/vaporware.mp3", import.meta.url).href }),
  Object.freeze({ id: "synthwave-4k", title: "Synthwave 4k — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/synthwave-4k.mp3", import.meta.url).href }),
  Object.freeze({ id: "lifewave-2k", title: "Lifewave 2k — The Cynic Project", loop: false, volume: 0.2,
    url: new URL("../assets/music/cc0/lifewave-2k.mp3", import.meta.url).href }),
  Object.freeze({ id: "wisps-of-whorls", title: "Wisps of Whorls — Kevin MacLeod", loop: false, volume: 0.2,
    url: new URL("../assets/music/kevin-macleod/wisps-of-whorls.mp3", import.meta.url).href }),
  Object.freeze({ id: "deep-relaxation", title: "Deep Relaxation — Kevin MacLeod", loop: false, volume: 0.2,
    url: new URL("../assets/music/kevin-macleod/deep-relaxation-part-1.mp3", import.meta.url).href,
    parts: Object.freeze([{"url":"../assets/music/kevin-macleod/deep-relaxation-part-1.mp3","duration":1022},{"url":"../assets/music/kevin-macleod/deep-relaxation-part-2.mp3","duration":1022},{"url":"../assets/music/kevin-macleod/deep-relaxation-part-3.mp3","duration":1024.0816329999998}].map(part => Object.freeze({ ...part, url: new URL(part.url, import.meta.url).href }))) })
]);
