// Optional scene-owned brush choices; playback and navigation stay in the shared shell.
export function createGlyphControls({ container, onChange, onActivity }) {
  const lifetime = new AbortController();
  const listen = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: lifetime.signal });
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet'; sheet.href = new URL('./glyph-controls.css', import.meta.url).href;
  document.head.append(sheet);
  const root = document.createElement('div');
  root.className = 'glyphControls'; root.hidden = true;
  root.setAttribute('role', 'group'); root.setAttribute('aria-label', '문자와 색 선택');
  container.prepend(root);
  let model = null, opened = null, signature = '';
  const entries = [
    { key: 'kind', choices: 'shapes', label: '모양', id: 'glyphShape' },
    { key: 'tone', choices: 'colors', label: '색', id: 'glyphTone' }
  ].map(spec => {
    const trigger = document.createElement('button'), icon = document.createElement('span');
    trigger.type = 'button'; trigger.className = 'iconButton glyphTrigger'; trigger.id = spec.id;
    trigger.append(icon); trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', spec.id + 'Picker');
    const picker = document.createElement('div');
    picker.id = spec.id + 'Picker'; picker.className = 'glyphPicker'; picker.hidden = true; picker.inert = true;
    picker.setAttribute('role', 'group'); picker.setAttribute('aria-label', spec.label + ' 선택');
    root.append(trigger, picker);
    return { ...spec, trigger, icon, picker };
  });
  function close(restoreFocus = false) {
    const previous = opened;
    opened = null;
    for (const entry of entries) { entry.picker.inert = true; entry.picker.hidden = true; entry.trigger.setAttribute('aria-expanded', 'false'); }
    if (restoreFocus && previous && !root.hidden) previous.trigger.focus({ preventScroll: true });
  }
  for (const entry of entries) {
    listen(entry.trigger, 'click', () => {
      if (!model) return;
      const opening = opened !== entry; close();
      if (opening) { opened = entry; entry.picker.inert = false; entry.picker.hidden = false; entry.trigger.setAttribute('aria-expanded', 'true'); }
      onActivity();
    });
    listen(entry.picker, 'click', event => {
      const button = event.target.closest('button[data-value]');
      if (!button || !entry.picker.contains(button) || !model) return;
      onChange({ [entry.key]: Number(button.dataset.value) }); close(true); onActivity();
    });
  }
  // Close before the shell handles Escape/focus view. Numeric world shortcuts are untouched.
  listen(document, 'keydown', event => {
    if (event.key !== 'Escape' || !opened) return;
    event.preventDefault(); event.stopImmediatePropagation(); close(true); onActivity();
  }, { capture: true });
  listen(document, 'pointerdown', event => { if (opened && !root.contains(event.target)) close(); }, { capture: true });
  listen(root, 'focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
  function sync(next) {
    const valid = next && entries.every(e => Array.isArray(next[e.choices]) && next[e.choices].length > 0 && next[e.choices].length <= 24 &&
      next[e.choices].some(c => Number.isInteger(c.value) && c.value === next[e.key]));
    if (!valid) { close(); root.hidden = true; model = null; return; }
    model = next; root.hidden = false;
    const updated = JSON.stringify(entries.map(e => next[e.choices]));
    if (updated !== signature) {
      signature = updated;
      for (const entry of entries) {
        entry.picker.replaceChildren();
        for (const choice of next[entry.choices]) {
          const button = document.createElement('button'), ink = document.createElement('span');
          button.type = 'button'; button.className = 'glyphChoice'; button.dataset.value = String(choice.value);
          button.title = choice.label; button.setAttribute('aria-label', choice.label); button.append(ink);
          if (entry.key === 'kind') ink.textContent = choice.glyph;
          else { ink.className = 'glyphSwatch'; ink.style.backgroundColor = choice.color; }
          entry.picker.append(button);
        }
      }
    }
    const tone = next.colors.find(c => c.value === next.tone);
    root.style.setProperty('--glyph-color', tone.color);
    for (const entry of entries) {
      const choice = next[entry.choices].find(c => c.value === next[entry.key]);
      entry.trigger.title = entry.label + ' 선택 · ' + choice.label;
      entry.trigger.setAttribute('aria-label', entry.trigger.title);
      entry.icon.textContent = entry.key === 'kind' ? choice.glyph : '';
      entry.icon.className = entry.key === 'tone' ? 'glyphSwatch' : '';
      entry.picker.querySelectorAll('[data-value]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.value) === next[entry.key])));
    }
  }
  return Object.freeze({ sync, close, get open() { return opened !== null; },
    destroy() { close(); lifetime.abort(); root.remove(); sheet.remove(); model = null; }
  });
}
