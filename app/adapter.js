// Shared protocol/lifetime only; each adapter selects its source-specific player.
export function connectWorld({ world, frame, resolve, prepare = () => {}, timeoutMs = 20000 }) {
  let ready = false, playing = null, timer = 0, deadline = performance.now() + timeoutMs, disposed = false;
  const notify = (type, detail = {}) => parent.postMessage({ source: "ambient-world", world, type, ...detail }, location.origin === "null" ? "*" : location.origin);
  const capabilities = { play: true, sound: false, scenes: true };
  function poll() {
    clearTimeout(timer);
    if (disposed) return;
    try {
      const source = resolve();
      if (source?.ready) {
        if (playing !== null) source.player.setPlaying(playing);
        prepare(frame.contentDocument);
        ready = true;
        notify("ready", { capabilities });
        return;
      }
    } catch { /* The inner document may still be navigating. */ }
    if (performance.now() >= deadline) {
      ready = false;
      document.body.classList.add("failed");
      notify("error");
      return;
    }
    timer = setTimeout(poll, 50);
  }
  function change(method) {
    if (!ready) return false;
    const source = resolve();
    ready = false;
    deadline = performance.now() + timeoutMs;
    notify("loading");
    try { source.player[method](); poll(); return true; }
    catch (error) {
      poll();
      notify("error");
      return false;
    }
  }
  window.ambientWorld = Object.freeze({
    get ready() { return ready; },
    setPlaying(value) {
      playing = Boolean(value);
      if (ready) return resolve().player.setPlaying(playing);
      return false;
    },
    // Shared music owns playback; source audio remains muted.
    setMuted() { return true; },
    randomScene: () => change("randomScene"),
    nextScene: () => change("nextScene"),
    previousScene: () => change("previousScene"),
    capture(target) { return ready ? resolve().player.drawTo(target) : false; }
  });
  window.addEventListener("message", event => {
    if (event.source !== parent) return;
    const m = event.data;
    if (m?.source !== "ambient-worlds" || m.type !== "control") return;
    const method = { "set-playing": "setPlaying", "set-muted": "setMuted", "random-scene": "randomScene", "next-scene": "nextScene", "previous-scene": "previousScene" }[m.action];
    if (method) window.ambientWorld[method](m.value);
  });
  frame.addEventListener("load", () => { try { prepare(frame.contentDocument); } catch {} poll(); });
  window.addEventListener("pagehide", () => { disposed = true; clearTimeout(timer); }, { once: true });
  poll();
}
