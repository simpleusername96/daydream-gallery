import { WORLD_ORDER, WORLDS } from "./worlds.js";
import { PlaybackClock } from "./playback.js";
import { WorldMusic } from "./music.js";

const $ = id => document.getElementById(id);
const worldSlot = $("worldSlot");
const veil = $("transitionVeil"), status = $("worldStatus"), switcher = $("worldSelect");
const random = $("randomScene");
const playPause = $("playPause"), sound = $("sound");
const clock = new PlaybackClock(), music = new WorldMusic(audioError);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const state = {
  index: 0, playing: !reducedMotion.matches, muted: true,
  frame: null, ready: false, busy: false, mountToken: 0,
  capabilities: { play: false, scenes: false }, idleTimer: 0, statusTimer: 0,
  loadTimer: 0, slowTimer: 0, failed: false, transitionStart: 0, lastTransitionMs: 0,
  glassValleyHintShown: false
};
for (const id of WORLD_ORDER) {
  const option = document.createElement("option"); option.value = id; option.textContent = WORLDS[id].label; switcher.append(option);
}
const notice = $("loadingNotice"), loadingText = $("loadingText"), retry = $("retryWorld");
const activeWorld = () => WORLDS[WORLD_ORDER[state.index]];
function setStatus(message, persistent = false, durationMs = 2400) {
  clearTimeout(state.statusTimer);
  status.textContent = message; status.classList.toggle("visible", Boolean(message));
  if (message && !persistent) state.statusTimer = setTimeout(() => { status.textContent = ""; status.classList.remove("visible"); }, durationMs);
}
function showChrome() {
  document.body.classList.remove("chromeHidden"); clearTimeout(state.idleTimer);
  state.idleTimer = setTimeout(() => { if (state.ready && !state.busy && !state.failed && !document.querySelector(".chrome:focus-within")) document.body.classList.add("chromeHidden"); }, 2600);
}
function hideChrome() {
  clearTimeout(state.idleTimer);
  document.activeElement?.blur?.();
  document.body.classList.add("chromeHidden");
}
function updateSelection() { switcher.value = activeWorld().id; }
function updateControls() {
  playPause.setAttribute("aria-pressed", String(!state.playing));
  playPause.setAttribute("aria-label", state.playing ? "정지" : "재생");
  playPause.title = state.playing ? "정지" : "재생"; playPause.classList.toggle("paused", !state.playing);
  const hasMusic = activeWorld().music !== false;
  sound.disabled = !hasMusic;
  sound.setAttribute("aria-pressed", String(hasMusic && !state.muted)); sound.classList.toggle("soundEnabled", hasMusic && !state.muted);
  sound.title = !hasMusic ? "이 장면에는 소리가 없습니다" : state.muted ? "소리 켜기" : "소리 끄기"; sound.setAttribute("aria-label", sound.title);
  random.disabled = !state.ready || state.busy || !state.capabilities.scenes;
  $("stage").setAttribute("aria-busy", String(!state.ready || state.busy));
}
function bridge() { try { return state.frame?.contentWindow?.ambientWorld ?? null; } catch { return null; } }
function sendControl(action, value) {
  const method = { "set-playing":"setPlaying", "set-muted":"setMuted", "random-scene":"randomScene", "next-scene":"nextScene", "previous-scene":"previousScene" }[action];
  const direct = bridge();
  if (typeof direct?.[method] === "function") return direct[method](value);
  if (!state.frame?.contentWindow) return false;
  state.frame.contentWindow.postMessage({ source:"ambient-worlds",type:"control",action,value }, location.origin === "null" ? "*" : location.origin);
  return true;
}
function syncWorldState() {
  sendControl("set-playing", state.playing && !document.hidden);
  sendControl("set-muted", true);
  music.setPlaying(state.playing); music.setHidden(document.hidden);
}
function coverLoading() {
  veil.classList.add("covering");
  state.transitionStart = performance.now();
}
function clearLoading() {
  clearTimeout(state.loadTimer); clearTimeout(state.slowTimer);
  notice.hidden = true; retry.hidden = true; notice.classList.remove("failed"); state.failed = false;
}
function beginLoading(label) {
  clearLoading(); setStatus(""); showChrome();
  loadingText.textContent = label + " 준비 중";
  notice.hidden = false;
  state.slowTimer = setTimeout(() => { loadingText.textContent = label + "을 준비하고 있습니다. 잠시만 기다려 주세요."; }, 8000);
  state.loadTimer = setTimeout(failLoading, 31000);
}
function failLoading() {
  clearLoading(); state.failed = true; state.ready = false; state.busy = false;
  notice.hidden = false; retry.hidden = false; notice.classList.add("failed");
  loadingText.textContent = "장면을 불러오지 못했습니다.";
  updateControls(); showChrome();
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
  syncWorldState(); updateControls();
  state.frame?.classList.add("ready");
  const token = state.mountToken;
  requestAnimationFrame(() => {
    if (token !== state.mountToken || state.busy) return;
    veil.classList.remove("covering");
  });
}
function mountWorld(index, force = false) {
  const nextIndex = (index + WORLD_ORDER.length) % WORLD_ORDER.length;
  if (!force && !state.failed && state.frame && nextIndex === state.index) { updateSelection(); updateControls(); return; }
  coverLoading();
  const token = ++state.mountToken;
  state.index = nextIndex; state.ready = false; state.busy = false; state.capabilities = { play:false, scenes:false };
  clearTimeout(state.loadTimer);
  try { bridge()?.destroy?.(); } catch { /* The outgoing frame may already be gone. */ }
  state.frame?.remove(); state.frame = null; worldSlot.replaceChildren();
  const world = activeWorld();
  const frame = document.createElement("iframe");
  frame.className = "worldFrame"; frame.title = world.label + " world"; frame.tabIndex = -1;
  frame.classList.toggle("interactive", world.interactive === true);
  frame.allow = "autoplay"; frame.referrerPolicy = "strict-origin-when-cross-origin";
  state.frame = frame;
  beginLoading(world.label);
  afterPaint(token, () => { frame.src = world.adapter; worldSlot.append(frame); });
  updateSelection(); updateControls();
  music.select(world.id).catch(audioError);

}
function changeScene(action = "random-scene") {
  if (!state.ready || state.busy || !state.capabilities.scenes) return;
  coverLoading(); state.busy = true; updateControls(); clock.resetScene();
  beginLoading(activeWorld().label);
  const token = ++state.mountToken;
  afterPaint(token, () => {
    const applied = sendControl(action);
    if (applied === false) { finishReady(state.capabilities); setStatus("이 장면은 변경할 수 없습니다."); }
  });
}
function selectWorld(id) {
  const index = WORLD_ORDER.indexOf(id); if (index < 0) return;
  mountWorld(index);
}

function togglePlaying() {
  state.playing = !state.playing; syncWorldState(); updateControls(); showChrome();
}
function audioError() {
  state.muted = true; music.setMuted(true); updateControls();
  setStatus("소리를 시작하지 못했습니다. 소리 버튼을 다시 눌러 주세요.");
}
function toggleSound() {
  if (activeWorld().music === false) return;
  state.muted = !state.muted; updateControls(); showChrome();
  music.setMuted(state.muted).catch(audioError);
}
function handleShortcut(key) {
  key = key.toLowerCase();
  if (key === "f") hideChrome();
  else if (key === "escape") hideChrome();
  else showChrome();
  if (key === " ") togglePlaying();
  else if (key === "r") changeScene();
  else if (key === "m") toggleSound();
  else if (/^[1-9]$/.test(key)) selectWorld(WORLD_ORDER[Number(key)-1]);
}
switcher.addEventListener("change", () => { showChrome(); selectWorld(switcher.value); });
retry.addEventListener("click", () => mountWorld(state.index, true));
random.addEventListener("click", () => { showChrome(); changeScene(); });
playPause.addEventListener("click", togglePlaying);
sound.addEventListener("click", toggleSound);
$("focusView").addEventListener("click", hideChrome);
window.addEventListener("message", event => {
  if (event.source !== state.frame?.contentWindow) return;
  const message = event.data;
  if (message?.source !== "ambient-world" || message.world !== activeWorld().id) return;
  if (message.type === "ready") {
    finishReady(message.capabilities);
    if (activeWorld().id === "glass-valley" && !state.glassValleyHintShown) {
      state.glassValleyHintShown = true;
      setStatus("화면을 드래그해 좌우를 둘러보세요", false, 5000);
    } else setStatus(activeWorld().label);
  }
  if (message.type === "error") failLoading();
  if (message.type === "loading") { state.busy = true; updateControls(); }
  if (message.type === "status") setStatus(message.message, Boolean(message.persistent));
  if (message.type === "shortcut" && typeof message.key === "string") handleShortcut(message.key);
  if (message.type === "activity") showChrome();
});
window.addEventListener("keydown", event => {
  if (event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.target.tagName === "BUTTON" && [" ","Enter"].includes(event.key)) return;
  const key = event.key.toLowerCase();
  if ([" ","r"].includes(key)) event.preventDefault();
  handleShortcut(key);
});
// Native select menus can consume Escape keydown while still delivering keyup.
window.addEventListener("keyup", event => { if (event.key === "Escape") hideChrome(); });
for (const event of ["pointermove","pointerdown","focusin"]) window.addEventListener(event, showChrome, { passive:true });
let lastTick = performance.now();
const timer = setInterval(() => {
  const now = performance.now(), delta = now - lastTick; lastTick = now;
  const action = clock.advance(delta, {
    running: state.playing && !document.hidden && state.ready && !state.busy,
    auto: false, worldDurationMs: 0,
    sceneDurationMs: state.capabilities.scenes ? activeWorld().sceneDurationMs : 0
  });
  if (action === "scene") changeScene("next-scene");
  music.tick();
}, 250);
document.addEventListener("visibilitychange", () => { lastTick = performance.now(); syncWorldState(); });
reducedMotion.addEventListener("change", event => { if (event.matches) { state.playing = false; syncWorldState(); updateControls(); } });
window.addEventListener("pagehide", () => { clearInterval(timer); clearTimeout(state.idleTimer); clearLoading(); clearTimeout(state.statusTimer); music.dispose(); }, { once:true });
// Read-only diagnostics for actual-browser checks; no authoring surface.
window.ambientPlayer = Object.freeze({ snapshot: () => ({ world:activeWorld().id, mode:"fixed", playing:state.playing, muted:state.muted,
  ready:state.ready, busy:state.busy, failed:state.failed, worldMs:clock.worldMs, sceneMs:clock.sceneMs,
  lastTransitionMs:state.lastTransitionMs, frameCount:worldSlot.querySelectorAll("iframe").length, music:music.snapshot() }) });
mountWorld(0); showChrome();
