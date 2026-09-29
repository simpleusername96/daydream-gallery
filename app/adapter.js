// Shared protocol/lifetime only; each adapter selects its source-specific player.
export function connectWorld({ world, frame, resolve, prepare = () => {}, timeoutMs = 20000, scenes = true, brush = false }) {
  let ready = false, playing = null, timer = 0, deadline = performance.now() + timeoutMs, disposed = false;
  const notify = (type, detail = {}) => parent.postMessage({ source: "daydream-gallery-world", world, type, ...detail }, location.origin === "null" ? "*" : location.origin);
  const inputDocuments = new WeakSet();
  function prepareInput(doc) {
    if (!doc || inputDocuments.has(doc)) return;
    inputDocuments.add(doc); let pointer = null;
    doc.addEventListener("pointerdown", e => { if(e.isTrusted) pointer={x:e.clientX,y:e.clientY,moved:false}; }, {capture:true,passive:true});
    doc.addEventListener("pointermove", e => { if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8) pointer.moved=true; }, {passive:true});
    doc.addEventListener("pointercancel", () => { pointer=null; }, {passive:true});
    doc.addEventListener("click", e => { const moved=pointer?.moved; pointer=null; if(e.isTrusted&&!moved) notify("activity",{intent:"activate"}); }, true);
    doc.addEventListener("keydown", e => { if(e.isTrusted&&e.key==="Tab"&&!e.ctrlKey&&!e.altKey&&!e.metaKey) { e.preventDefault(); notify("shortcut",{key:"Tab"}); } });
  }
  const capabilities = { play: true, sound: false, scenes };
  if (brush) capabilities.brush = true;
  function poll() {
    clearTimeout(timer);
    if (disposed) return;
    try {
      const source = resolve();
      if (source?.ready) {
        if (playing !== null) source.player.setPlaying(playing);
        prepare(frame.contentDocument); prepareInput(frame.contentDocument);
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
    if (!ready || !scenes) return false;
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
  window.daydreamWorld = Object.freeze({
    get ready() { return ready; },
    setPlaying(value) {
      if (disposed) return false;
      playing = Boolean(value);
      if (ready) return resolve().player.setPlaying(playing);
      return false;
    },
    getBrush() { return !disposed && ready && brush ? resolve().player.getBrush() : null; },
    setBrush(value) {
      if (disposed || !ready || !brush || !value || typeof value !== "object") return false;
      const next = {};
      for (const key of ["kind", "tone"]) if (value[key] !== undefined) {
        if (!Number.isInteger(value[key]) || value[key] < 1) return false;
        next[key] = value[key];
      }
      if (!Object.keys(next).length || resolve().player.setBrush(next) === false) return false;
      notify("brush", { brush: resolve().player.getBrush() }); return true;
    },
    // Shared music owns playback; source audio remains muted.
    setMuted() { return true; },
    randomScene: () => change("randomScene"),
    nextScene: () => change("nextScene"),
    previousScene: () => change("previousScene"),
    capture(target) { return ready ? resolve().player.drawTo(target) : false; },
    destroy() {
      if (disposed) return;
      disposed = true; ready = false;
      clearTimeout(timer);
      try { resolve()?.player?.destroy?.(); } catch { /* The source may already be unloading. */ }
    }
  });
  window.addEventListener("message", event => {
    if (event.source !== parent) return;
    const m = event.data;
    if (m?.source !== "daydream-gallery" || m.type !== "control") return;
    const method = { "set-playing": "setPlaying", "set-muted": "setMuted", "random-scene": "randomScene", "next-scene": "nextScene", "previous-scene": "previousScene", "set-brush": "setBrush" }[m.action];
    if (method) window.daydreamWorld[method](m.value);
  });
  frame.addEventListener("load", () => { try { prepare(frame.contentDocument); } catch {} poll(); });
  window.addEventListener("pagehide", () => window.daydreamWorld.destroy(), { once: true });
  poll();
}
