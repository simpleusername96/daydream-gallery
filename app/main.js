import { createAboutModal } from "./about.js";
import { analytics } from "./analytics.js";
import { ActiveTime } from "./analytics-time.js";
const analyticsTime = new ActiveTime(analytics);
import { WORLD_ORDER, WORLDS } from "./worlds.js";
import { PlaybackClock } from "./playback.js";
import { WorldMusic } from "./music.js";
import { createNavigation } from "./navigation.js";
import { createGlyphControls } from "./glyph-controls.js";
import { createMusicControls } from "./music-controls.js";

const $ = id => document.getElementById(id);
const worldSlot = $("worldSlot");
const veil = $("transitionVeil"), status = $("worldStatus");
const random = $("randomScene");
const playPause = $("playPause");
const clock = new PlaybackClock(), music = new WorldMusic(audioError);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const state = {
  home: true, index: 0, playing: !reducedMotion.matches,
  frame: null, previousFrame: null, ready: false, busy: false, mountToken: 0,
  capabilities: { play: false, scenes: false }, idleTimer: 0, statusTimer: 0,
  loadTimer: 0, slowTimer: 0, failed: false, transitionStart: 0, lastTransitionMs: 0,
  glassValleyHintShown: false
};
const navigation = createNavigation({ order: WORLD_ORDER, worlds: WORLDS, onSelect: selectWorld, onHome: () => navigate("home") });
const notice = $("loadingNotice"), loadingText = $("loadingText"), retry = $("retryWorld");
const activeWorld = () => WORLDS[WORLD_ORDER[state.index]];
const glyphControls = createGlyphControls({ container: $("playerControls"),
  onChange: value => { if (state.ready && !state.busy && state.capabilities.brush) { sendControl("set-brush", value); updateControls(); } },
  onActivity: showChrome
});
window.addEventListener("pagehide", () => glyphControls.destroy(), { once: true });
const musicControls = createMusicControls({ container: $("playerControls"), trigger: $("musicToggle"), music,
  onStart: () => { if (!state.playing) { state.playing = true; syncWorldState(); updateControls(); } },
  onActivity: showChrome, onOpen: () => { glyphControls.close(); aboutControls.close(false); }
});
window.addEventListener("pagehide", () => musicControls.destroy(), { once: true });
const aboutControls = createAboutModal({
  onOpen: () => { glyphControls.close(); musicControls.close(); showChrome(); },
  onClose: scheduleChrome,
  getScene: () => state.home ? null : bridge(state.previousFrame || state.frame)
});
function setStatus(message, persistent = false, durationMs = 2400, instruction = false) {
  clearTimeout(state.statusTimer);
  status.textContent = message; status.classList.toggle("visible", Boolean(message));
  status.classList.toggle("instruction", instruction);
  if (message && !persistent) state.statusTimer = setTimeout(() => { status.textContent = ""; status.classList.remove("visible"); }, durationMs);
}
function scheduleChrome() {
  clearTimeout(state.idleTimer);
  if (state.home || document.body.classList.contains('chromeHidden')) return;
  state.idleTimer = setTimeout(() => {
    if (!aboutControls.open && !navigation.open && !glyphControls.open && !musicControls.open && state.ready && !state.busy && !document.querySelector('.chrome:focus-visible, .chrome :focus-visible, .chrome:hover')) hideChrome();
  }, 3000);
}
function showChrome() {
  document.body.classList.remove('chromeHidden'); scheduleChrome();
}
function hideChrome() {
  glyphControls.close();
  musicControls.close();
  clearTimeout(state.idleTimer);
  document.activeElement?.blur?.();
  aboutControls.close(false);
  document.body.classList.add("chromeHidden");
}
function updateSelection() {
  navigation.showWorld(activeWorld().id);
  window.dispatchEvent(new CustomEvent("daydream-gallery-world-change", { detail: { world: activeWorld().id } }));
}
function updateControls() {
  let brush = null;
  if (!state.home && state.ready && !state.busy && state.capabilities.brush) {
    try { brush = bridge()?.getBrush?.(); } catch { /* The outgoing iframe may have unloaded. */ }
  }
  glyphControls.sync(brush);
  playPause.setAttribute("aria-pressed", String(!state.playing));
  playPause.setAttribute("aria-label", state.playing ? "전체 일시정지" : "전체 재생");
  playPause.title = state.playing ? "전체 일시정지 · Space" : "전체 재생 · Space"; playPause.classList.toggle("paused", !state.playing);
  random.disabled = !state.ready || state.busy || !state.capabilities.scenes;
  $("stage").setAttribute("aria-busy", String(!state.ready || state.busy));
}
function bridge(frame = state.frame) { try { return frame?.contentWindow?.daydreamWorld ?? null; } catch { return null; } }
function retireFrame(frame) {
  try { bridge(frame)?.destroy?.(); } catch { /* The source may already be gone. */ }
  frame?.remove();
}
function sendControl(action, value) {
  const method = { "set-brush":"setBrush", "set-playing":"setPlaying", "set-muted":"setMuted", "random-scene":"randomScene", "next-scene":"nextScene", "previous-scene":"previousScene" }[action];
  const direct = bridge();
  if (typeof direct?.[method] === "function") return direct[method](value);
  if (!state.frame?.contentWindow) return false;
  state.frame.contentWindow.postMessage({ source:"daydream-gallery",type:"control",action,value }, location.origin === "null" ? "*" : location.origin);
  return true;
}
function syncWorldState() {
  sendControl("set-playing", state.playing && !state.home && !document.hidden);
  sendControl("set-muted", true);
  try { bridge(state.previousFrame)?.setPlaying(state.playing && !document.hidden); } catch { /* A retired source may be unloading. */ }
  music.setPlaying(state.playing && !state.home); music.setHidden(document.hidden);
}
function coverLoading() {
  veil.classList.add("covering");
  state.transitionStart = performance.now();
}
function clearLoading() {
  clearTimeout(state.loadTimer); clearTimeout(state.slowTimer);
  notice.hidden = true; retry.hidden = true; notice.classList.remove("failed"); state.failed = false;
}
function beginLoading() {
  clearLoading(); setStatus("");
  loadingText.textContent = "장면 준비 중";
  notice.hidden = false;
  state.slowTimer = setTimeout(() => { loadingText.textContent = "장면을 준비하고 있습니다. 잠시만 기다려 주세요."; }, 8000);
  state.loadTimer = setTimeout(failLoading, 31000);
}
function failLoading() {
  clearLoading(); state.failed = true; state.ready = false; state.busy = false;
  if (!state.frame?.classList.contains("ready")) { retireFrame(state.frame); state.frame = null; }
  notice.hidden = false; retry.hidden = false; notice.classList.add("failed");
  loadingText.textContent = "장면을 불러오지 못했습니다.";
  updateControls();
}
// Allow pending UI to paint before synchronous source work. Tokens cancel stale choices.
function afterPaint(token, action) {
  requestAnimationFrame(() => requestAnimationFrame(() => { if (token === state.mountToken) action(); }));
}
function finishReady(capabilities) {
  clearLoading();
  const first = !state.ready;
  state.ready = true; state.busy = false; state.capabilities = capabilities;
  if (first) clock.resetWorld();
  state.lastTransitionMs = performance.now() - state.transitionStart;
  syncWorldState(); updateControls(); scheduleChrome();
  state.frame?.classList.add("ready");
  const outgoing = state.previousFrame;
  const fade = state.frame?.getAnimations().filter(animation => animation.transitionProperty === "opacity") ?? [];
  const retireOutgoing = () => {
    if (state.previousFrame !== outgoing) return;
    retireFrame(outgoing); state.previousFrame = null;
  };
  if (fade.length) Promise.allSettled(fade.map(animation => animation.finished)).then(retireOutgoing);
  else retireOutgoing();
  const token = state.mountToken;
  requestAnimationFrame(() => {
    if (token !== state.mountToken || state.busy) return;
    veil.classList.remove("covering");
  });
}
function mountWorld(index, force = false) {
  analyticsTime.flush();
  const nextIndex = (index + WORLD_ORDER.length) % WORLD_ORDER.length;
  if (!force && !state.failed && state.frame && nextIndex === state.index) { updateSelection(); updateControls(); return; }
  coverLoading();
  const token = ++state.mountToken;
  // Keep only the visible outgoing scene while one incoming scene initializes.
  // Rapid selections retire the pending scene, never accumulate hidden renderers.
  if (state.frame?.classList.contains("ready")) {
    retireFrame(state.previousFrame);
    state.previousFrame = state.frame; state.previousFrame.inert = true;
    // A new selection commits an interrupted fade before preparing its successor.
    state.previousFrame.getAnimations().forEach(animation => animation.finish());
  }
  else retireFrame(state.frame);
  state.frame = null;
  state.index = nextIndex; state.ready = false; state.busy = false; state.capabilities = { play:false, scenes:false };
  clearTimeout(state.loadTimer);
  const world = activeWorld();
  analyticsTime.select(world.id);
  analytics.view();
  const frame = document.createElement("iframe");
  frame.className = "worldFrame"; frame.title = world.label + " world"; frame.tabIndex = -1;
  frame.classList.toggle("interactive", world.interactive === true);
  frame.allow = "autoplay"; frame.referrerPolicy = "strict-origin-when-cross-origin";
  state.frame = frame;
  beginLoading();
  afterPaint(token, () => { frame.src = world.adapter; worldSlot.append(frame); });
  updateSelection(); updateControls();
  music.select(world.id).catch(audioError);

}
function changeScene(action = "random-scene") {
  if (!state.ready || state.busy || !state.capabilities.scenes) return;
  analyticsTime.flush();
  analytics.event("scene_change", {content_id:activeWorld().id, method:action});
  coverLoading(); state.busy = true; updateControls(); clock.resetScene();
  beginLoading();
  const token = ++state.mountToken;
  afterPaint(token, () => {
    const applied = sendControl(action);
    if (applied === false) { finishReady(state.capabilities); setStatus("이 장면은 변경할 수 없습니다."); }
  });
}
function selectWorld(id) {
  const index = WORLD_ORDER.indexOf(id); if (index < 0) return;
  navigate(id);
  // Keep play() within the scene-selection gesture, before async renderer readiness.
  music.setPlaying(state.playing && !state.home);
  void music.activate();
}

function navigate(id) {
  const hash = id === 'home' ? '' : '#' + id;
  if (location.hash !== hash) history.pushState(null, '', location.pathname + location.search + hash);
  applyRoute(true);
}
function applyRoute(restoreFocus = false) {
  aboutControls.close(false);
  const id = location.hash.slice(1);
  const index = WORLD_ORDER.indexOf(id);
  if (index >= 0) {
    state.home = false; $('stage').hidden = false;
    navigation.showWorld(id); mountWorld(index); showChrome();
    music.setHidden(document.hidden); music.setPlaying(state.playing);
    void music.activate({ userGesture: false });
    if (restoreFocus) $('openScenes').focus({ preventScroll: true });
    return;
  }
  // Old #home links and unknown scenes resolve to the canonical home URL.
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const previousId = activeWorld().id;
  analyticsTime.select(null);
  analytics.view();
  state.home = true; ++state.mountToken; glyphControls.sync(null); musicControls.close();
  clearLoading(); clearTimeout(state.idleTimer); setStatus('');
  retireFrame(state.frame); retireFrame(state.previousFrame);
  state.frame = null; state.previousFrame = null;
  state.ready = false; state.busy = false;
  state.capabilities = { play: false, scenes: false };
  clock.resetWorld(); music.setPlaying(false);
  $('stage').hidden = true;
  aboutControls.close(false);
  document.body.classList.remove('chromeHidden');
  navigation.showHome();
  if (restoreFocus) navigation.focusHome(previousId);
}
window.addEventListener('hashchange', () => applyRoute(true));
function togglePlaying() {
  analyticsTime.flush();
  analytics.event(state.playing ? "scene_pause" : "scene_resume", {content_id:activeWorld().id});
  state.playing = !state.playing; syncWorldState(); updateControls(); showChrome();
}
function audioError() {
  setStatus("음악을 재생하지 못했습니다. 음악 패널에서 다시 재생해 주세요.");
}
function toggleSound() {
  if (!music.available) return;
  musicControls.togglePlayback();
}
function handleShortcut(key, fromFrame = false) {
  key = key.toLowerCase();
  if (key === "escape" && musicControls.open) { musicControls.close(true); showChrome(); return; }
  if (key === "escape" && glyphControls.open) { glyphControls.close(true); showChrome(); return; }
  if (aboutControls.open || navigation.open || ![' ','r','m','f','escape','tab'].includes(key) && !/^[1-9]$/.test(key)) return;
  if (key === 'tab') { if (!state.home) { showChrome(); if (fromFrame) $('goHome').focus({ preventScroll:true }); } return; }
  if (state.home) { if (/^[1-9]$/.test(key)) selectWorld(WORLD_ORDER[Number(key)-1]); return; }
  if (key === "f") hideChrome();
  else if (key === "escape") hideChrome();
  else showChrome();
  if (key === " ") togglePlaying();
  else if (key === "r") changeScene();
  else if (key === "m") toggleSound();
  else if (/^[1-9]$/.test(key)) selectWorld(WORLD_ORDER[Number(key)-1]);
}
retry.addEventListener("click", () => mountWorld(state.index, true));
random.addEventListener("click", () => { showChrome(); changeScene(); });
playPause.addEventListener("click", togglePlaying);
$("focusView").addEventListener("click", hideChrome);
window.addEventListener("message", event => {
  if (event.source !== state.frame?.contentWindow) return;
  const message = event.data;
  if (message?.source !== "daydream-gallery-world" || message.world !== activeWorld().id) return;
  if (message.type === "ready") {
    finishReady(message.capabilities);
    if (activeWorld().id === "glass-valley" && !state.glassValleyHintShown) {
      state.glassValleyHintShown = true;
      setStatus("화면을 드래그해 좌우로 둘러보세요", false, 8000, true);
    } else setStatus("");
  }
  if (message.type === "brush") updateControls();
  if (message.type === "error") failLoading();
  if (message.type === "loading") { state.busy = true; updateControls(); }
  if (message.type === "status") setStatus(message.message, Boolean(message.persistent));
  if (message.type === "shortcut" && typeof message.key === "string") handleShortcut(message.key, true);
  if (message.type === "activity" && message.intent === "activate") { glyphControls.close(); musicControls.close(); void music.activate(); showChrome(); }
});
window.addEventListener("keydown", event => {
  if (!event.isTrusted || event.ctrlKey || event.altKey || event.metaKey || event.target.closest?.(".analytics-consent, .analytics-settings") || aboutControls.open || navigation.open || event.defaultPrevented || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.target.tagName === "BUTTON" && [" ","Enter"].includes(event.key)) return;
  const key = event.key.toLowerCase();
  if ([" ","r"].includes(key)) event.preventDefault();
  handleShortcut(key);
});
// Movement, focus restoration and renderer notifications never wake hidden chrome.
let revealPointer = null;
window.addEventListener('pointerdown', event => {
  if (event.isTrusted) revealPointer = { x:event.clientX, y:event.clientY, moved:false };
}, { capture:true, passive:true });
window.addEventListener('pointermove', event => {
  if (revealPointer && Math.hypot(event.clientX-revealPointer.x,event.clientY-revealPointer.y)>8) revealPointer.moved=true;
  if (!document.body.classList.contains('chromeHidden') && event.target.closest?.('.chrome')) scheduleChrome();
}, { passive:true });
window.addEventListener('pointercancel', () => { revealPointer=null; }, { passive:true });
window.addEventListener('click', event => {
  if (!event.isTrusted || state.home || aboutControls.open || navigation.open) return;
  const moved = revealPointer?.moved; revealPointer=null;
  if (moved) return;
  // A scene tap retries browser-blocked autoplay without overriding manual pause.
  if (!event.target.closest?.('.chrome, #loadingNotice, .analytics-consent, .analytics-settings')) void music.activate();
  if (document.body.classList.contains('chromeHidden')) {
    showChrome();
    if (!event.target.closest?.('#loadingNotice, .analytics-consent, .analytics-settings')) { event.preventDefault(); event.stopImmediatePropagation(); }
  } else scheduleChrome();
}, true);
for (const event of ['focusin','focusout','pointerout']) window.addEventListener(event, scheduleChrome, { passive:true });
let lastTick = performance.now();
const timer = setInterval(() => {
  const now = performance.now(), delta = now - lastTick; lastTick = now;
  analyticsTime.advance(delta, state.playing && !state.home && !document.hidden && state.ready && !state.busy && !state.failed);
  const action = clock.advance(delta, {
    running: state.playing && !state.home && !document.hidden && state.ready && !state.busy,
    auto: false, worldDurationMs: 0,
    sceneDurationMs: state.capabilities.scenes ? activeWorld().sceneDurationMs : 0
  });
  if (action === "scene") changeScene("next-scene");
}, 250);
document.addEventListener("visibilitychange", () => { analyticsTime.flush(); lastTick = performance.now(); syncWorldState(); });
reducedMotion.addEventListener("change", event => { if (event.matches) { state.playing = false; syncWorldState(); updateControls(); } });
window.addEventListener("pagehide", () => { analyticsTime.flush(); clearInterval(timer); clearTimeout(state.idleTimer); clearLoading(); clearTimeout(state.statusTimer); retireFrame(state.frame); retireFrame(state.previousFrame); music.dispose(); }, { once:true });
// Read-only diagnostics for actual-browser checks; no authoring surface.
window.daydreamPlayer = Object.freeze({ snapshot: () => ({ view:state.home ? "home" : "player", world:state.home ? null : activeWorld().id, menuOpen:navigation.open, mode:"fixed", playing:state.playing, muted:music.snapshot().muted,
  ready:state.ready, busy:state.busy, failed:state.failed, worldMs:clock.worldMs, sceneMs:clock.sceneMs,
  lastTransitionMs:state.lastTransitionMs, frameCount:worldSlot.querySelectorAll("iframe").length, music:music.snapshot() }) });
applyRoute();
