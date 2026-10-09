// Image navigation owns presentation and focus; main.js owns routing and renderers.
import { scenePath } from './routes.js';
export function createNavigation({ order, worlds, onSelect, onHome }) {
  const home = document.getElementById('homeGallery');
  const grid = document.getElementById('worldGrid');
  const scrollPosition = document.getElementById('homeScrollPosition');
  const dialog = document.getElementById('sceneMenu');
  const list = document.getElementById('sceneList');
  const trigger = document.getElementById('openScenes');
  const close = document.getElementById('closeScenes');
  let selected = null;
  let anchor = 0;
  let keyboardTarget = null;
  let movingFocus = false;
  let homeScroll = 0;
  let railWidth = 0, railHeight = 0;
  const positions = new Map();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = new Map();
  const follow = (event, action) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); action();
  };
  function card(id, lazy = true) {
    const world = worlds[id];
    const link = document.createElement('a');
    link.href = scenePath(id); link.className = 'worldCard';
    link.dataset.world = id; link.setAttribute('aria-label', world.label);
    const image = document.createElement('img');
    image.src = world.thumbnail; image.alt = ''; image.width = 800; image.height = 450;
    image.loading = lazy ? 'lazy' : 'eager'; image.decoding = 'async';
    link.append(image);
    link.addEventListener('click', event => follow(event, () => { dismiss(false); onSelect(id); }));
    return link;
  }
  grid.replaceChildren(); // Replace the exported crawlable cards with live navigation.
  order.forEach((id, index) => { const link = card(id, index > 2); cards.set(id, link); grid.append(link); });
  grid.classList.toggle('smallCollection', order.length < 3);
  grid.style.setProperty('--home-rows', Math.max(1, Math.ceil(order.length / 3)));
  function dismiss(restore = true) {
    if (!dialog.open) return;
    positions.set(selected, list.children[nearest()]?.dataset.world);
    keyboardTarget = null;
    dialog.close(); dialog.inert = true; trigger.setAttribute('aria-expanded', 'false');
    if (restore) trigger.focus({ preventScroll: true });
  }
  function nearest() {
    const middle = list.scrollTop + list.clientHeight / 2;
    let best = 0, distance = Infinity;
    [...list.children].forEach((item, index) => {
      const next = Math.abs(item.offsetTop + item.offsetHeight / 2 - middle);
      if (next < distance) { distance = next; best = index; }
    });
    return best;
  }
  function updateEdges(scroller = list) {
    const remaining = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    // Feather the clipping boundary only, and shrink continuously at either end.
    scroller.style.setProperty('--fade-top', Math.min(16, Math.max(0, scroller.scrollTop)) + 'px');
    scroller.style.setProperty('--fade-bottom', Math.min(16, Math.max(0, remaining)) + 'px');
  }
  function updateHomeScroll() {
    updateEdges(grid);
    const maximum = Math.max(0, grid.scrollHeight - grid.clientHeight);
    scrollPosition.hidden = maximum <= 1;
    scrollPosition.max = String(maximum);
    scrollPosition.value = String(grid.scrollTop);
    scrollPosition.setAttribute('aria-valuetext', Math.round(maximum ? grid.scrollTop / maximum * 100 : 0) + '%');
    scrollPosition.style.setProperty('--scroll-progress',
      (maximum ? Math.max(0, Math.min(1, grid.scrollTop / maximum)) * 100 : 0) + '%');
  }
  scrollPosition.addEventListener('input', () => { grid.scrollTop = scrollPosition.valueAsNumber; });
  function center(index, behavior = 'instant') {
    const item = list.children[index];
    if (!item) return;
    anchor = index;
    railWidth = list.clientWidth; railHeight = list.clientHeight;
    list.scrollTo({ top: item.offsetTop - (list.clientHeight - item.offsetHeight) / 2, behavior });
    updateEdges();
  }
  function open() {
    if (home.hidden === false || dialog.open) return;
    list.replaceChildren(...order.filter(id => id !== selected).map(id => card(id, false)));
    dialog.inert = false; dialog.showModal(); trigger.setAttribute('aria-expanded', 'true');
    // Remember the image, not pixel offsets, so rotation preserves the same place.
    const remembered = [...list.children].findIndex(item => item.dataset.world === positions.get(selected));
    center(remembered >= 0 ? remembered : Math.min(2, Math.floor((list.children.length - 1) / 2)));
    close.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', open);
  close.addEventListener('click', () => dismiss());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.classList.contains('sceneRail') || event.target === list) dismiss();
  });
  dialog.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      const current = keyboardTarget ?? nearest();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? list.children.length - 1 :
        Math.max(0, Math.min(list.children.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
      keyboardTarget = index;
      movingFocus = true;
      list.children[index]?.focus({ preventScroll: true });
      movingFocus = false;
      center(index, motion.matches ? 'instant' : 'smooth');
    }
  });
  list.addEventListener('focusin', event => {
    if (movingFocus) return;
    const index = [...list.children].indexOf(event.target);
    if (index >= 0) {
      keyboardTarget = index;
      center(index, motion.matches ? 'instant' : 'smooth');
    }
  });
  list.addEventListener('scroll', () => {
    // Layout can emit scroll before ResizeObserver; keep the pre-resize image anchor.
    if (list.clientWidth === railWidth && list.clientHeight === railHeight) anchor = nearest();
    updateEdges();
  }, { passive: true });
  for (const type of ['wheel', 'pointerdown']) {
    list.addEventListener(type, () => { keyboardTarget = null; }, { passive: true });
  }
  // Side gutters are part of the native scrollport. Forward wheel input only
  // from the fixed top/bottom margins, leaving native grid scrolling and zoom alone.
  home.addEventListener('wheel', event => {
    if (event.ctrlKey || grid.contains(event.target) || !event.deltaY) return;
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
      event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? grid.clientHeight : 1;
    grid.scrollBy({ top: event.deltaY * unit, behavior: 'instant' });
    event.preventDefault();
  }, { passive: false });
  grid.addEventListener('scroll', updateHomeScroll, { passive: true });
  const resize = new ResizeObserver(() => {
    if (!home.hidden) updateHomeScroll();
    // Opening also queues an observation; it must not interrupt an in-flight key scroll.
    if (dialog.open && (list.clientWidth !== railWidth || list.clientHeight !== railHeight)) {
      center(keyboardTarget ?? anchor);
    }
  });
  resize.observe(list);
  resize.observe(grid);
  const homeLink = document.getElementById('goHome');
  homeLink.href = '/' + location.search;
  homeLink.addEventListener('click', event => follow(event, onHome));
  return {
    get open() { return dialog.open; },
    close: dismiss,
    showHome() {
      dismiss(false); home.inert = false; home.hidden = false; selected = null;
      grid.scrollTop = homeScroll;
      document.body.classList.add('atHome');
      updateHomeScroll();
    },
    showWorld(id) {
      dismiss(false); selected = id;
      if (!home.hidden) homeScroll = grid.scrollTop;
      home.inert = true; home.hidden = true;
      document.body.classList.remove('atHome');
    },
    focusHome(id) { cards.get(id)?.focus({ preventScroll: true }); }
  };
}
