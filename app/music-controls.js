// Compact music surface; WorldMusic remains the sole media/state owner.
const paths = {
  play: 'M9 5l11 7-11 7z', pause: 'M9 5v14M16 5v14',
  previous: 'M5 5v14M19 5L8 12l11 7z', next: 'M19 5v14M5 5l11 7-11 7z',
  shuffle: 'M4 7h3c4 0 5 10 9 10h4M17 14l3 3-3 3M4 17h3c1.7 0 2.9-1.8 4-4M15 7h5M17 4l3 3-3 3',
  repeat: 'M4 11V8a3 3 0 0 1 3-3h13l-3-3M20 5l-3 3M20 13v3a3 3 0 0 1-3 3H4l3 3M4 19l3-3M11 10l2-1v6',
  edit: 'M4 6h10M4 12h7M4 18h6M14 19l1-4 5-5 3 3-5 5z',
  done: 'M5 12l4 4L19 6', up: 'M6 14l6-6 6 6', down: 'M6 10l6 6 6-6',
  volume: 'M4 10h4l5-4v12l-5-4H4zM17 9c2 2 2 4 0 6M20 6c4 4 4 8 0 12',
  silent: 'M4 10h4l5-4v12l-5-4H4zM17 10l4 4M21 10l-4 4'
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
function label(button, text) { button.title = text; button.setAttribute('aria-label', text); }
function button(id, name, text) {
  return `<button type="button" id="${id}" class="musicButton" aria-label="${text}" title="${text}">${svg(name)}</button>`;
}
export function createMusicControls({ container, trigger, music, onStart, onActivity, onOpen }) {
  const lifetime = new AbortController();
  const listen = (node, type, handler) => node.addEventListener(type, handler, { signal: lifetime.signal });
  const panel = document.createElement('section');
  panel.id = 'musicPanel'; panel.className = 'musicPanel'; panel.hidden = true; panel.inert = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '음악');
  panel.innerHTML = `<div class="musicHeading"><span id="musicTitle"></span>${button('musicEdit', 'edit', '재생 순서 편집')}</div>
    <div class="musicTransport">${button('musicShuffle', 'shuffle', '현재 곡 다음부터 섞기')}${button('musicPrevious', 'previous', '이전 곡')}${button('musicPlay', 'play', '음악 재생 · M')}${button('musicNext', 'next', '다음 곡')}${button('musicRepeat', 'repeat', '한 곡 반복')}</div>
    <div class="musicVolume"><span id="musicVolumeIcon">${svg('volume')}</span><input id="musicVolume" type="range" min="0" max="100" step="1" aria-label="음악 음량"></div>
    <ol class="musicQueue" aria-label="재생목록"></ol><span class="srOnly" role="status" id="musicAnnouncement"></span>`;
  container.append(panel);
  const get = id => panel.querySelector('#' + id), queue = panel.querySelector('.musicQueue');
  function frameQueue() {
    const above = Math.min(10, queue.scrollTop), below = Math.min(10, Math.max(0, queue.scrollHeight - queue.clientHeight - queue.scrollTop));
    queue.style.maskImage = `linear-gradient(to bottom, transparent, #000 ${above}px, #000 calc(100% - ${below}px), transparent)`;
  }
  const resize = new ResizeObserver(frameQueue); resize.observe(queue);
  listen(queue, 'scroll', frameQueue);
  let opened = false, editing = false, order = '';
  const silentMark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  silentMark.setAttribute('d', 'M4 4l16 16'); silentMark.classList.add('musicSilentMark');
  trigger.querySelector('svg').append(silentMark);
  function labelTrigger(snapshot = music.snapshot()) {
    const reason = snapshot.blocked ? '자동재생 차단 · 재생하려면 화면 클릭 또는 M'
      : snapshot.failed ? '재생 실패 · 패널에서 다시 재생'
      : snapshot.volume === 0 ? '음량 0'
      : !snapshot.running ? '음악 일시정지' : '음악 재생 중';
    label(trigger, `음악 ${opened ? '닫기' : '열기'} · ${reason}`);
  }
  const title = track => track.title.split(' — ')[0].replace('Daydream Gallery · ', '');
  function render(snapshot = music.snapshot()) {
    const signature = snapshot.order.join('|');
    if (order !== signature) {
      const focused = document.activeElement?.closest('[data-track]');
      const focusId = focused?.dataset.track, action = document.activeElement?.dataset.move;
      order = signature;
      queue.replaceChildren(...music.playlist.map((track, index) => {
        const row = document.createElement('li'); row.dataset.track = track.id;
        const select = document.createElement('button'); select.type = 'button'; select.className = 'musicTrack';
        select.innerHTML = '<span class="musicTrackMark" aria-hidden="true"></span><span class="musicTrackName"></span>';
        select.querySelector('.musicTrackName').textContent = title(track);
        label(select, track.title); row.append(select);
        for (const [delta, icon, text] of [[-1, 'up', '위로'], [1, 'down', '아래로']]) {
          const move = document.createElement('button'); move.type = 'button'; move.className = 'musicButton musicMove';
          move.dataset.move = delta; move.innerHTML = svg(icon); label(move, `${title(track)} ${text}`);
          move.disabled = index + delta < 0 || index + delta >= music.playlist.length; row.append(move);
        }
        return row;
      }));
      if (focusId) {
        const row = [...queue.children].find(row => row.dataset.track === focusId);
        const target = action ? row?.querySelector(`[data-move="${action}"]:not(:disabled)`) : null;
        (target ?? row?.querySelector('.musicTrack'))?.focus({ preventScroll: true });
      }
    }
    const current = music.playlist[snapshot.index];
    get('musicTitle').textContent = current ? title(current) : '';
    get('musicTitle').title = current?.title ?? '';
    get('musicPlay').innerHTML = svg(snapshot.running ? 'pause' : 'play');
    label(get('musicPlay'), snapshot.running ? '음악 일시정지 · M' : '음악 재생 · M');
    get('musicRepeat').setAttribute('aria-pressed', String(snapshot.repeat));
    get('musicVolume').value = Math.round(snapshot.volume * 100);
    get('musicVolume').setAttribute('aria-valuetext', `${Math.round(snapshot.volume * 100)}%`);
    get('musicVolume').style.setProperty('--volume', `${snapshot.volume * 100}%`);
    get('musicVolumeIcon').innerHTML = svg(snapshot.volume === 0 ? 'silent' : 'volume');
    const audible = snapshot.running && !snapshot.paused && snapshot.volume > 0;
    trigger.classList.toggle('musicActive', audible);
    trigger.classList.toggle('musicSilent', !audible);
    labelTrigger(snapshot);
    trigger.disabled = !snapshot.available;
    panel.classList.toggle('musicSingle', snapshot.count < 2);
    for (const id of ['musicShuffle', 'musicPrevious', 'musicNext', 'musicRepeat', 'musicEdit']) get(id).hidden = snapshot.count < 2;
    queue.hidden = snapshot.count < 2;
    for (const row of queue.children) {
      const selected = row.dataset.track === snapshot.track;
      row.querySelector('.musicTrack').setAttribute('aria-current', String(selected));
      row.querySelector('.musicTrackMark').innerHTML = selected ? svg(snapshot.running ? 'pause' : 'play') : '';
    }
  }
  function close(restoreFocus = false) {
    if (!opened) return;
    opened = false; panel.inert = true; panel.hidden = true; trigger.setAttribute('aria-expanded', 'false');
    labelTrigger();
    if (restoreFocus) trigger.focus({ preventScroll: true });
    onActivity();
  }
  function start() { onStart(); void music.setMuted(false); }
  function togglePlayback() {
    if (music.snapshot().running) void music.setMuted(true);
    else start();
    onActivity();
  }
  listen(trigger, 'click', () => {
    if (opened) { close(true); return; }
    onOpen(); opened = true; panel.inert = false; panel.hidden = false; render();
    trigger.setAttribute('aria-expanded', 'true'); labelTrigger();
    get('musicPlay').focus({ preventScroll: true });
    queue.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
    onActivity();
  });
  listen(get('musicPlay'), 'click', togglePlayback);
  listen(get('musicPrevious'), 'click', () => { music.step(-1); onActivity(); });
  listen(get('musicNext'), 'click', () => { music.step(1); onActivity(); });
  listen(get('musicShuffle'), 'click', () => {
    music.shuffle(); get('musicAnnouncement').textContent = '현재 곡 다음부터 순서를 섞었습니다.'; onActivity();
  });
  listen(get('musicRepeat'), 'click', () => { music.setRepeat(!music.snapshot().repeat); onActivity(); });
  listen(get('musicVolume'), 'input', event => { music.setVolume(Number(event.target.value) / 100); onActivity(); });
  listen(get('musicEdit'), 'click', () => {
    editing = !editing; panel.classList.toggle('musicEditing', editing);
    get('musicEdit').innerHTML = svg(editing ? 'done' : 'edit');
    get('musicEdit').setAttribute('aria-pressed', String(editing));
    label(get('musicEdit'), editing ? '순서 편집 완료' : '재생 순서 편집'); onActivity();
  });
  listen(queue, 'click', event => {
    const row = event.target.closest('[data-track]'), target = event.target.closest('button');
    if (!row || !target) return;
    if (target.dataset.move) {
      const id = row.dataset.track; music.moveTrack(id, Number(target.dataset.move));
      get('musicAnnouncement').textContent = `${music.playlist.find(t => t.id === id).title}, ${music.playlist.findIndex(t => t.id === id) + 1}번째`;
    } else { music.selectTrack(row.dataset.track); start(); }
    onActivity();
  });
  listen(queue, 'keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tracks = [...queue.querySelectorAll('.musicTrack')];
    const index = tracks.findIndex(t => t.closest('li') === event.target.closest('li'));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tracks.length - 1 : Math.max(0, Math.min(tracks.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    tracks[next]?.focus();
  });
  listen(document, 'keydown', event => {
    if (event.key === 'Escape' && opened) { event.preventDefault(); close(true); }
  });
  listen(document, 'pointerdown', event => { if (!panel.contains(event.target) && !trigger.contains(event.target)) close(); });
  listen(document, 'focusin', event => { if (!panel.contains(event.target) && !trigger.contains(event.target)) close(); });
  listen(window, 'blur', () => { if (document.activeElement?.tagName === 'IFRAME') close(); });
  const unsubscribe = music.subscribe(render); render();
  return Object.freeze({ close, togglePlayback, get open() { return opened; },
    destroy() { unsubscribe(); resize.disconnect(); lifetime.abort(); panel.remove(); }
  });
}
