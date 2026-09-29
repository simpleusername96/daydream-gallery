// One existing synthesized loop, shared by every scene. Flow Music remains on hold.
export const PLAYLIST = Object.freeze([Object.freeze({
  id: "shared-loop", title: "Daydream Gallery · 먼 길", loop: true,
  url: new URL("../assets/audio/shared-loop.wav", import.meta.url).href
})]);
