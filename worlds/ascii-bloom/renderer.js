// Canvas rendering from the user-approved v4. The shared shell owns all controls.
const { Field, NEUTRAL, SYMBOLS, SHAPES, KINDS, PALETTES } = globalThis.AsciiBloom;
const BG = '#191a1d', ATLAS_COLS = 32;
const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d', { alpha: false });
if (!ctx) throw new Error('Canvas 2D is unavailable');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const lifetime = new AbortController();
const listen = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal: lifetime.signal });
let field, atlas, lookup, cellSize = 22, offsetX = 0, offsetY = 0, width = 0, height = 0, dpr = 1;
let currentSeed = 1, selected = 1, selectedTone = 1;
let paused = true, disposed = false, lastTime = null, forceDraw = true;
let pointer = { x: -1000, y: -1000 }, pointerId = null, cursorData = '';
let raf = 0, resizeTimer = 0, renderedCells = 0, lastFrameMs = 0;

// Regeneration/resize replace the field without rewinding the scene's active time.
function replaceField(cols, rows) {
  const time = field?.time || 0;
  field = new Field(cols, rows, { seed: currentSeed });
  field.time = time; field.nextScan += time; field.nextAmbient += time;
  for (const cell of field.cells) { cell.nextChange += time; cell.animStart += time; }
}
function fit() {
  if (disposed) return;
  width = Math.max(1, innerWidth); height = Math.max(1, innerHeight);
  cellSize = width < 600 ? 20 : 22;
  const cols = Math.ceil(width / cellSize), rows = Math.ceil(height / cellSize);
  dpr = Math.min(2, Math.max(1, Math.ceil(devicePixelRatio || 1)));
  canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true;
  offsetX = (width-cols*cellSize)/2; offsetY = (height-rows*cellSize)/2;
  if (!field || field.cols !== cols || field.rows !== rows) replaceField(cols, rows);
  buildAtlas(); updateCursor(); ctx.fillStyle = BG; ctx.fillRect(0, 0, width, height);
  forceDraw = true; render(); lastTime = null;
}
  function buildAtlas() {
    const tile=Math.round(cellSize*dpr),entries=[]; lookup=new Map();
    for (let kind=0;kind<SHAPES.length;kind++) {
      const glyphs=kind?[SYMBOLS[kind]]:NEUTRAL;
      const tones=kind?KINDS:[0];
      for (const glyph of glyphs) for (const tone of tones) for (let level=0;level<3;level++) {
        lookup.set(`${glyph}:${tone}:${level}`,entries.length); entries.push({glyph,kind,tone,level});
      }
    }
    atlas=document.createElement('canvas'); atlas.width=ATLAS_COLS*tile; atlas.height=Math.ceil(entries.length/ATLAS_COLS)*tile;
    const a=atlas.getContext('2d'); a.scale(dpr,dpr); a.textAlign='center'; a.textBaseline='middle';
    const layouts=new Map();
    const family='ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", "DejaVu Sans Mono", "Segoe UI Symbol", "DejaVu Sans", monospace';
    entries.forEach((entry,i)=>{
      let layout=layouts.get(entry.glyph);
      if (!layout) {
        let fontSize=cellSize*(entry.kind ? .68 : .60);
        let font=`${entry.kind ? 600 : 400} ${fontSize}px ${family}`;
        if (entry.kind) {
          // Equal ink size, not equal font size: '*' otherwise looks much smaller than a heart.
          a.font=font; a.textAlign='left'; a.textBaseline='alphabetic';
          let m=a.measureText(entry.glyph);
          const extent=Math.max(m.actualBoundingBoxLeft+m.actualBoundingBoxRight,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent);
          if (extent>0) fontSize*=cellSize*.59/extent;
          font=`600 ${fontSize}px ${family}`; a.font=font; m=a.measureText(entry.glyph);
          layout={font,align:'left',baseline:'alphabetic',dx:(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,dy:(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2};
        } else layout={font,align:'center',baseline:'middle',dx:0,dy:cellSize*.025};
        layouts.set(entry.glyph,layout);
      }
      a.font=layout.font; a.textAlign=layout.align; a.textBaseline=layout.baseline;
      a.fillStyle=PALETTES[entry.tone].colors[entry.level];
      a.fillText(entry.glyph,(i%ATLAS_COLS+.5)*cellSize+layout.dx,(Math.floor(i/ATLAS_COLS)+.5)*cellSize+layout.dy);
    });
  }

  function updateCursor() {
    if (!atlas || !lookup) return;
    // Native cursor, centered hotspot, no lagging DOM overlay. Render at its own
    // resolution: enlarging a small atlas tile blurs thin glyphs such as the ring.
    const icon=document.createElement('canvas'); icon.width=icon.height=32;
    const c=icon.getContext('2d'), glyph=SYMBOLS[selected];
    const family='ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", "DejaVu Sans Mono", "Segoe UI Symbol", "DejaVu Sans", monospace';
    let fontSize=24; c.textAlign='left'; c.textBaseline='alphabetic';
    c.font=`600 ${fontSize}px ${family}`;
    let m=c.measureText(glyph);
    const extent=Math.max(m.actualBoundingBoxLeft+m.actualBoundingBoxRight,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent);
    if (extent>0) fontSize*=22/extent;
    c.font=`600 ${fontSize}px ${family}`; m=c.measureText(glyph);
    c.fillStyle=PALETTES[selectedTone].colors[1];
    c.fillText(glyph,16+(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,16+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2);
    cursorData=icon.toDataURL('image/png');
    canvas.style.cursor=`url("${cursorData}") 16 16, crosshair`;
  }

  function sprite(glyph,tone,level,x,y,alpha=1,scaleY=1) {
    const index=lookup.get(`${glyph}:${tone}:${level}`); if (index===undefined || alpha<=.001) return;
    const tile=Math.round(cellSize*dpr); ctx.globalAlpha=Math.min(1,alpha);
    ctx.drawImage(atlas,(index%ATLAS_COLS)*tile,Math.floor(index/ATLAS_COLS)*tile,tile,tile,x-cellSize/2,y-cellSize*scaleY/2,cellSize,cellSize*scaleY);
  }
  const ease=t=>t*t*(3-2*t);

  function paintCell(cell,time,hover,transitioning) {
    const x=offsetX+cell.x*cellSize,y=offsetY+cell.y*cellSize,cx=x+cellSize/2,cy=y+cellSize/2;
    ctx.globalAlpha=1; ctx.fillStyle=BG; ctx.fillRect(x,y,cellSize,cellSize);
    const level=hover&&!cell.kind?Math.min(2,cell.level+1):cell.level;
    if (!transitioning) {
      if (time<cell.animStart) sprite(cell.oldGlyph,cell.oldTone,cell.oldLevel,cx,cy);
      else sprite(cell.glyph,cell.tone,level,cx,cy); return;
    }
    const p=ease(Math.max(0,Math.min(1,(time-cell.animStart)/cell.animDuration)));
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,cellSize,cellSize); ctx.clip();
    if (cell.style===2) {
      // This branch is reached only after this cell's radial arrival time.
      // Crossfade and a small outward movement make the advancing front visible.
      const travel=motionPreference.matches?0:cellSize*.16;
      sprite(cell.oldGlyph,cell.oldTone,cell.oldLevel,
        cx+cell.waveX*travel*p,cy+cell.waveY*travel*p,1-p);
      const scale=motionPreference.matches?1:.76+.24*p+.12*Math.sin(Math.PI*p);
      sprite(cell.glyph,cell.tone,level,
        cx-cell.waveX*travel*(1-p),cy-cell.waveY*travel*(1-p),p,scale);
    } else if (motionPreference.matches) {
      sprite(cell.oldGlyph,cell.oldTone,cell.oldLevel,cx,cy,1-p); sprite(cell.glyph,cell.tone,level,cx,cy,p);
    } else if (cell.style===1) {
      const scale=Math.max(.025,Math.abs(Math.cos(Math.PI*p)));
      if (p<.5) sprite(cell.oldGlyph,cell.oldTone,cell.oldLevel,cx,cy,.7+.3*scale,scale);
      else sprite(cell.glyph,cell.tone,level,cx,cy,.7+.3*scale,scale);
    } else {
      const travel=cellSize*.68*cell.direction;
      sprite(cell.oldGlyph,cell.oldTone,cell.oldLevel,cx,cy-p*travel,1-p);
      sprite(cell.glyph,cell.tone,level,cx,cy+(1-p)*travel,p);
    }
    ctx.restore();
  }

  function render() {
    if (!field) return; const time=field.time;
    const hx=Math.floor((pointer.x-offsetX)/cellSize),hy=Math.floor((pointer.y-offsetY)/cellSize); renderedCells=0;
    for (const cell of field.cells) {
      const transitioning=time>=cell.animStart&&time<cell.animStart+cell.animDuration;
      const hover=(cell.x-hx)**2+(cell.y-hy)**2<=3;
      if (forceDraw||cell.dirty||(!paused&&(transitioning||cell.wasAnimating))||hover!==cell.hovered) {
        paintCell(cell,time,hover,transitioning); cell.dirty=false; cell.wasAnimating=transitioning; cell.hovered=hover; renderedCells++;
      }
    }
    ctx.globalAlpha=1; forceDraw=false;
  }

function scheduleFrame() {
  if (!disposed && !paused && !document.hidden && !raf) raf = requestAnimationFrame(frame);
}
function frame(now) {
  raf = 0;
  if (disposed || paused || document.hidden) { lastTime = null; return; }
  const start = performance.now();
  if (lastTime !== null) field.advance(Math.min(.065, Math.max(0, (now-lastTime)/1000)));
  lastTime = now; render(); lastFrameMs = performance.now()-start; scheduleFrame();
}
function setPlaying(value) {
  if (disposed) return false;
  paused = !Boolean(value); lastTime = null;
  if (paused) { cancelAnimationFrame(raf); raf = 0; }
  else scheduleFrame();
  forceDraw = true; render(); return true;
}
function getBrush() {
  return {
    kind: selected, tone: selectedTone,
    shapes: KINDS.map(kind => ({ value: kind, label: SHAPES[kind].name, glyph: SYMBOLS[kind] })),
    colors: KINDS.map(tone => ({ value: tone, label: PALETTES[tone].name, color: PALETTES[tone].colors[1] }))
  };
}
function setBrush(value) {
  if (disposed || !value || typeof value !== 'object') return false;
  const kind = value.kind ?? selected, tone = value.tone ?? selectedTone;
  if (!KINDS.includes(kind) || !KINDS.includes(tone)) return false;
  selected = kind; selectedTone = tone; updateCursor(); return true;
}
function randomScene() {
  if (disposed) return false;
  currentSeed = (currentSeed + 1) >>> 0;
  replaceField(field.cols, field.rows); lastTime = null;
  forceDraw = true; render(); return true;
}
function stamp(x, y) {
  if (disposed) return 0;
  // A paused parent remains paused; pending waves continue when playback resumes.
  const changed = field.stamp(x, y, selected, selectedTone);
  render(); return changed;
}
function drawTo(target) {
  if (disposed || !target?.getContext) return false;
  forceDraw = true; render();
  const out = target.getContext('2d'); if (!out) return false;
  out.drawImage(canvas, 0, 0, target.width, target.height); return true;
}
function destroy() {
  if (disposed) return;
  disposed = true; paused = true;
  cancelAnimationFrame(raf); raf = 0; clearTimeout(resizeTimer);
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  pointerId = null; lifetime.abort(); atlas.width = atlas.height = 1;
  canvas.style.cursor = 'default';
}
function endPointer(event) {
  if (pointerId !== null && event.pointerId !== pointerId) return;
  pointerId = null;
  if (event.type !== 'lostpointercapture' && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (event.pointerType === 'touch') { pointer = { x: -1000, y: -1000 }; render(); }
}
listen(canvas, 'pointerdown', event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault(); canvas.focus({ preventScroll: true });
  pointerId = event.pointerId; canvas.setPointerCapture(pointerId);
  const rect = canvas.getBoundingClientRect();
  pointer = { x: event.clientX-rect.left, y: event.clientY-rect.top };
  stamp(Math.floor((pointer.x-offsetX)/cellSize), Math.floor((pointer.y-offsetY)/cellSize));
});
listen(canvas, 'pointermove', event => {
  if (!event.isPrimary) return;
  const rect = canvas.getBoundingClientRect();
  pointer = { x: event.clientX-rect.left, y: event.clientY-rect.top }; render();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(canvas, event, endPointer);
listen(canvas, 'pointerleave', () => { if (pointerId === null) { pointer = { x: -1000, y: -1000 }; render(); } });
listen(window, 'resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fit, 100); });
listen(document, 'visibilitychange', () => {
  lastTime = null;
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else scheduleFrame();
});
listen(motionPreference, 'change', () => { forceDraw = true; render(); });
listen(window, 'pagehide', destroy, { once: true });
fit();
window.asciiBloom = Object.freeze({
  get ready() { return !disposed; },
  player: Object.freeze({ setPlaying, randomScene, nextScene: randomScene, previousScene: randomScene, getBrush, setBrush, drawTo, destroy }),
  snapshot: () => ({ ...field.snapshot(), paused, disposed, selected, selectedTone, cellSize, renderedCells, lastFrameMs, rafPending: Boolean(raf),
    cursor: { glyph: SYMBOLS[selected], color: PALETTES[selectedTone].colors[1] } })
});
// In the shared player the adapter supplies playback intent after readiness.
if (window.parent === window) setPlaying(!motionPreference.matches);
