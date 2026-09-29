'use strict';
(() => {
  // Every large form is a mask of real grid cells. No image or oversized glyph is overlaid.
  const SHAPES = Object.freeze([
    null,
    { id: 'heart', name: '하트', glyph: '♥' },
    { id: 'asterisk', name: '별', glyph: '*' },
    { id: 'plus', name: '더하기', glyph: '+' },
    { id: 'diamond', name: '다이아몬드', glyph: '◆' },
    { id: 'ring', name: '고리', glyph: '○' },
    { id: 'flower', name: '꽃', glyph: '✿' },
    { id: 'crescent', name: '초승달', glyph: '☾' },
    { id: 'lightning', name: '번개', glyph: 'ϟ' },
    { id: 'infinity', name: '무한대', glyph: '∞' },
    { id: 'wave', name: '물결', glyph: '~' },
    { id: 'cross', name: '교차', glyph: '×' },
    { id: 'spiral', name: '소용돌이', glyph: '@' }
  ].map(s => s && Object.freeze(s)));
  const SYMBOLS = Object.freeze(SHAPES.map(s => s ? s.glyph : ''));
  const KINDS = Object.freeze(SHAPES.slice(1).map((_, i) => i + 1));
  const PALETTES = Object.freeze([
    { name: '회색', colors: ['#777d86', '#90969f', '#a9afb7'] },
    { name: '로즈', colors: ['#d67e99', '#ea98b1', '#f5b5c7'] },
    { name: '골드', colors: ['#c4a267', '#e0bd7e', '#f3d7a0'] },
    { name: '하늘', colors: ['#77aeca', '#92c9e4', '#b2dcec'] },
    { name: '라일락', colors: ['#9d8ccc', '#bba7e7', '#d5c3f6'] },
    { name: '민트', colors: ['#73ad99', '#93cbb6', '#b8e2ce'] },
    { name: '핑크', colors: ['#bc87b0', '#d9a1c9', '#eec1e0'] },
    { name: '페리윙클', colors: ['#899bce', '#a8b8e9', '#c9d5f3'] },
    { name: '살구', colors: ['#ce957a', '#e9b194', '#f7d0b4'] },
    { name: '코럴', colors: ['#ce857d', '#e9a399', '#f7c2b7'] },
    { name: '터쿼이즈', colors: ['#66aaa9', '#86c8c5', '#afe0dc'] },
    { name: '라임', colors: ['#9ead76', '#bccb92', '#d9e4b4'] },
    { name: '아이리스', colors: ['#9991c5', '#b7aedf', '#d5cef0'] }
  ].map(p => Object.freeze({ ...p, colors: Object.freeze(p.colors) })));
  const DEFAULTS = Object.freeze({
    changeMin: 2.8, changeMax: 8.2,
    transitionMin: .32, transitionMax: .60,
    waveStep: .09, waveTransition: .24, // Seconds per grid cell; duration at each arrival.
    seedProbability: .012, initialSeedProbability: .018,
    seedLifeMin: 12, seedLifeMax: 20,
    threshold: 4, neighborhoodRadius: 3,
    shapeSize: 17, holdMin: 4.5, holdMax: 6.5,
    cooldown: 4.5, maxShapes: 4, maxReservedFraction: .23,
    scanInterval: .18,
    ambientMin: 3.8, ambientMax: 5.8
  });
  // Any glyph that can grow is excluded from the monochrome background.
  const NEUTRAL = Object.freeze(Array.from('0123456789.:;,!?/\\|=-_^<>[]{}()#%&').filter(g => !SYMBOLS.includes(g)));
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const odd = n => Math.max(1, Math.floor(n) % 2 ? Math.floor(n) : Math.floor(n) - 1);
  const validKind = kind => Number.isInteger(kind) && kind >= 1 && kind < SHAPES.length;

  class Random {
    constructor(seed) { this.state = (Number(seed) >>> 0) || 0x8f23b819; }
    value() { let x = this.state; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.state = x >>> 0; return this.state / 4294967296; }
    between(a, b) { return a + (b - a) * this.value(); }
    int(n) { return Math.floor(this.value() * n); }
    shuffle(values) {
      const a = [...values];
      for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
  }
  function inPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < (xj-xi) * (y-yi) / (yj-yi) + xi) inside = !inside;
    }
    return inside;
  }
  const infinityPath = Array.from({ length: 220 }, (_, i) => {
    const t = i / 219 * Math.PI * 2;
    return [Math.sin(t) * .86, Math.sin(2*t) * .44];
  });
  const spiralPath = Array.from({ length: 260 }, (_, i) => {
    const t = i / 259 * Math.PI * 4.25, r = .06 + i / 259 * .79;
    return [r * Math.cos(t), r * Math.sin(t)];
  });
  function nearPath(x, y, points, width) {
    return points.some(([px, py]) => (x-px)**2 + (y-py)**2 <= width**2);
  }
  function shapeMask(kind, size) {
    if (!validKind(kind) || !Number.isInteger(size) || size < 1 || size % 2 === 0) throw new RangeError('A shape needs a valid kind and an odd positive size');
    const result = [], half = (size - 1) / 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (x-half) / Math.max(half, 1), dy = (y-half) / Math.max(half, 1);
      const r = Math.hypot(dx, dy); let inside = false;
      switch (kind) {
        case 1: {
          const u = dx * 1.22, v = -dy * 1.22 + .12;
          inside = (u*u + v*v - 1)**3 - u*u*v*v*v <= 0; break;
        }
        case 2:
          for (const a of [Math.PI/2, Math.PI/6, -Math.PI/6]) {
            const along = dx*Math.cos(a) + dy*Math.sin(a), across = -dx*Math.sin(a) + dy*Math.cos(a);
            if (Math.abs(along) <= 1 && Math.abs(across) <= .17) inside = true;
          }
          break;
        case 3: inside = Math.max(Math.abs(dx), Math.abs(dy)) <= 1 && Math.min(Math.abs(dx), Math.abs(dy)) <= .26; break;
        case 4: inside = Math.abs(dx) + Math.abs(dy) <= 1.05; break;
        case 5: inside = r <= 1.03 && r >= .66; break;
        case 6: inside = r <= .68 + .27*Math.cos(5*(Math.atan2(dy,dx) + Math.PI/2)); break;
        case 7: inside = r <= 1 && Math.hypot(dx-.40, dy+.16) >= .84; break;
        case 8: inside = inPolygon(dx,dy,[[.05,-1],[-.68,.13],[-.13,.13],[-.36,1],[.69,-.21],[.12,-.21],[.46,-1]]); break;
        case 9: inside = nearPath(dx,dy,infinityPath,.15); break;
        case 10: inside = Math.abs(dx) <= 1 && Math.abs(dy - .40*Math.sin(dx*Math.PI*1.20)) <= .20; break;
        case 11: inside = Math.min(Math.abs(dx-dy),Math.abs(dx+dy)) <= .27; break;
        case 12: inside = nearPath(dx,dy,spiralPath,.12); break;
      }
      if (inside) result.push(Object.freeze({ dx: x-half, dy: y-half }));
    }
    return Object.freeze(result);
  }
  function validatedConfig(custom) {
    const c = { ...DEFAULTS, ...custom };
    for (const [key, value] of Object.entries(c)) if (!Number.isFinite(value)) throw new TypeError(`Invalid config: ${key}`);
    if (c.changeMin <= c.transitionMax || c.changeMax < c.changeMin || c.transitionMin <= 0 ||
        c.transitionMax < c.transitionMin || c.seedLifeMin <= c.transitionMax || c.seedLifeMax < c.seedLifeMin ||
        c.holdMin < 0 || c.holdMax < c.holdMin || c.scanInterval <= 0 || c.cooldown < 0 ||
        c.ambientMin <= 1.8 || c.ambientMax < c.ambientMin || c.waveStep <= 0 || c.waveTransition <= 0) throw new RangeError('Invalid timing configuration');
    if (!Number.isInteger(c.threshold) || c.threshold < 2 || !Number.isInteger(c.neighborhoodRadius) ||
        c.neighborhoodRadius < 1 || c.threshold > (2*c.neighborhoodRadius+1)**2 ||
        !Number.isInteger(c.shapeSize) || c.shapeSize < 5 || !Number.isInteger(c.maxShapes) || c.maxShapes < 1 ||
        c.seedProbability < 0 || c.seedProbability > 1 || c.initialSeedProbability < 0 || c.initialSeedProbability > 1 ||
        c.maxReservedFraction <= 0 || c.maxReservedFraction > 1) throw new RangeError('Invalid growth configuration');
    return Object.freeze(c);
  }

  class Field {
    constructor(cols, rows, options = {}) {
      if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) throw new RangeError('Invalid grid dimensions');
      this.cols = cols; this.rows = rows; this.config = validatedConfig(options.config || {});
      this.random = new Random(options.seed ?? Date.now());
      this.time = 0; this.nextScan = .20; this.nextId = 1;
      this.shapes = new Map(); this.cells = []; this.events = [];
      this.totalFormations = 0; this.totalChanges = 0; this.lastFormation = null; this.reserved = 0;
      this.formationsByKind = Array(SHAPES.length).fill(0);
      this.formationsByTone = Array(PALETTES.length).fill(0);
      this.ambient = options.ambient !== false && options.intro !== false;
      this.ambientBag = []; this.brushBag = []; this.toneBag = [];
      this.waitingKind = 0; this.nextAmbient = .55;
      const area = cols * rows;
      const compactSize = area < 350 ? 7 : area < 1050 ? 11 : area < 1650 ? 15 : this.config.shapeSize;
      this.size = odd(Math.min(this.config.shapeSize, compactSize, cols-2, rows-2));
      this.masks = [Object.freeze([]), ...KINDS.map(k => shapeMask(k, this.size))];
      this.shapeLimit = Math.min(this.config.maxShapes, Math.max(1, Math.floor(area/600) + 1));
      this.budget = Math.max(...this.masks.map(m => m.length), Math.floor(area*this.config.maxReservedFraction));
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const kind = this.random.value() < this.config.initialSeedProbability ? this.randomKind() : 0;
        const glyph = kind ? SYMBOLS[kind] : NEUTRAL[this.random.int(NEUTRAL.length)];
        const level = this.random.int(3), tone = kind;
        this.cells.push({
          x, y, kind, glyph, level, tone, oldKind: kind, oldGlyph: glyph, oldLevel: level, oldTone: tone,
          owner: 0, targetKind: 0, targetTone: 0, growAt: Infinity, releaseAt: Infinity, seedReadyAt: 0,
          cooldownUntil: 0, manualUntil: 0,
          waveAt: Infinity, waveKind: 0, waveTone: 0, waveX: 0, waveY: 0,
          nextChange: kind ? this.random.between(7,18) : this.random.between(.15,this.config.changeMax),
          animStart: -100, animDuration: .4, style: 0, direction: 1,
          dirty: true, wasAnimating: false, hovered: false
        });
      }
    }
    at(x,y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows ? this.cells[y*this.cols+x] : null; }
    randomKind() { return 1 + this.random.int(KINDS.length); }
    nextBrush() { if (!this.brushBag.length) this.brushBag = this.random.shuffle(KINDS); return this.brushBag.pop(); }
    nextTone() { if (!this.toneBag.length) this.toneBag = this.random.shuffle(KINDS); return this.toneBag.pop(); }
    neutralExcept(previous) {
      const i = NEUTRAL.indexOf(previous);
      return i < 0 ? NEUTRAL[this.random.int(NEUTRAL.length)] : NEUTRAL[(i+1+this.random.int(NEUTRAL.length-1)) % NEUTRAL.length];
    }
    switchCell(cell,kind,delay=0,tone=kind) {
      cell.waveAt=Infinity; // Any explicit replacement cancels an older pending wave.
      cell.oldGlyph = cell.glyph; cell.oldKind = cell.kind; cell.oldLevel = cell.level; cell.oldTone = cell.tone;
      cell.kind = kind; cell.tone = kind ? clamp(Math.round(tone) || kind,1,PALETTES.length-1) : 0;
      cell.glyph = kind ? SYMBOLS[kind] : this.neutralExcept(cell.glyph); cell.level = this.random.int(3);
      cell.animStart = this.time+delay; cell.animDuration = this.random.between(this.config.transitionMin,this.config.transitionMax);
      cell.style = this.random.value() < .76 ? 0 : 1; cell.direction = this.random.value() < .5 ? -1 : 1;
      cell.dirty = true; cell.seedReadyAt = cell.animStart + cell.animDuration;
      cell.nextChange = cell.animStart + (kind ? this.random.between(this.config.seedLifeMin,this.config.seedLifeMax) : this.random.between(this.config.changeMin,this.config.changeMax));
      this.totalChanges++;
    }
    seed(x,y,kind,delay=0,tone=kind,manual=true) {
      if (!validKind(kind) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      const cell = this.at(Math.round(x),Math.round(y));
      if (!cell || cell.owner || (!manual && (cell.cooldownUntil > this.time || cell.manualUntil > this.time))) return false;
      if (cell.kind === kind && cell.seedReadyAt > this.time) return false;
      if (manual) { cell.cooldownUntil = 0; cell.manualUntil = this.time+12; }
      this.switchCell(cell,kind,delay,tone); return true;
    }
    hitShape(x,y) {
      const cell = this.at(x,y);
      if (cell && cell.owner) return this.shapes.get(cell.owner) || null;
      // Hollow forms are also clickable at their centers.
      for (const shape of this.shapes.values()) {
        if (!shape.dissolving && Math.abs(x-shape.cx) <= (shape.size-1)/2 && Math.abs(y-shape.cy) <= (shape.size-1)/2) return shape;
      }
      return null;
    }
    seedPositions(x,y) {
      const cx = clamp(Math.round(x),Math.min(1,this.cols-1),Math.max(0,this.cols-2));
      const cy = clamp(Math.round(y),Math.min(1,this.rows-1),Math.max(0,this.rows-2));
      const offsets = [[-1,-1],[1,-1],[-1,1],[1,1],[0,0],[0,-1],[-1,0],[1,0],[0,1]];
      if (this.config.threshold > offsets.length) {
        const r = this.config.neighborhoodRadius;
        for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++) if (!offsets.some(p=>p[0]===dx&&p[1]===dy)) offsets.push([dx,dy]);
      }
      const seen = new Set(), result = [];
      for (const [dx,dy] of offsets) {
        const cell = this.at(clamp(cx+dx,0,this.cols-1),clamp(cy+dy,0,this.rows-1));
        if (cell && !cell.owner && !seen.has(cell)) { seen.add(cell); result.push(cell); }
        if (result.length >= this.config.threshold) break;
      }
      return result;
    }
    // A click schedules a radial wave, not a simultaneous stamp. Pending cells
    // keep their actual glyph/color until the wave arrives. The most recent
    // click owns the local schedule, so an earlier wave cannot repaint over it.
    stamp(x,y,kind=1,tone=kind) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !validKind(kind) ||
          !Number.isInteger(tone) || tone<1 || tone>=PALETTES.length) return 0;
      x=Math.round(x); y=Math.round(y);
      if (!this.at(x,y)) return 0;
      const half=(this.size-1)/2, born=this.time;
      // Preserve the clicked origin at screen edges; only the footprint is clipped.
      let targets=this.masks[kind].map(p=>this.at(x+p.dx,y+p.dy)).filter(Boolean);
      if (!targets.length) targets=[this.at(x,y)];
      const targetSet=new Set(targets), touched=new Set(), footprint=[];
      let maxDistance=0;
      for (let cy=Math.max(0,y-half);cy<=Math.min(this.rows-1,y+half);cy++) {
        for (let cx=Math.max(0,x-half);cx<=Math.min(this.cols-1,x+half);cx++) {
          const c=this.at(cx,cy), distance=Math.hypot(cx-x,cy-y);
          footprint.push({c,distance}); maxDistance=Math.max(maxDistance,distance);
        }
      }
      const completeAt=born+maxDistance*this.config.waveStep+this.config.waveTransition;
      const hold=this.random.between(this.config.holdMin,this.config.holdMax);
      const id=this.nextId++;
      const shape={id,kind,tone,cx:x,cy:y,size:this.size,born,cells:[],endAt:completeAt+hold,
        completeAt,dissolving:false,manual:true,trigger:'stamp'};
      for (const {c,distance} of footprint) {
        if (c.owner) { touched.add(c.owner); c.owner=0; this.reserved--; }
        c.growAt=c.releaseAt=Infinity; c.targetKind=c.targetTone=0;
        c.waveAt=born+distance*this.config.waveStep;
        c.waveKind=targetSet.has(c)?kind:0; c.waveTone=c.waveKind?tone:0;
        c.waveX=distance?(c.x-x)/distance:0; c.waveY=distance?(c.y-y)/distance:0;
        c.manualUntil=c.waveAt+this.config.waveTransition;
        c.cooldownUntil=completeAt+hold+this.config.cooldown;
        // Even the gray cells in a hollow form respond at their arrival time.
        // No colored rectangle or separate glow layer is drawn over the grid.
        if (targetSet.has(c)) {
          c.owner=id; c.targetKind=kind; c.targetTone=tone;
          c.releaseAt=completeAt+hold+this.random.between(0,.60);
          c.cooldownUntil=c.releaseAt+this.config.cooldown;
          shape.cells.push(c.y*this.cols+c.x); this.reserved++;
          shape.endAt=Math.max(shape.endAt,c.releaseAt+this.config.transitionMax);
        }
        c.dirty=true;
      }
      for (const oldId of touched) {
        const old=this.shapes.get(oldId);
        if (!old) continue;
        old.cells=old.cells.filter(i=>this.cells[i].owner===oldId);
        if (!old.cells.length) this.shapes.delete(oldId);
      }
      this.events=this.events.filter(e=>Math.abs(e.x-x)>half || Math.abs(e.y-y)>half);
      this.shapes.set(id,shape); this.totalFormations++;
      this.formationsByKind[kind]++; this.formationsByTone[tone]++;
      this.lastFormation={id,kind,tone,time:born,seedCount:0,x,y,manual:true,trigger:'stamp'};
      // Start at the actual click immediately; the remaining cells wait their turn.
      this.applyWave(this.at(x,y));
      return targets.length;
    }
    applyWave(cell) {
      if (this.time<cell.waveAt) return;
      const at=cell.waveAt, kind=cell.waveKind, tone=cell.waveTone;
      this.switchCell(cell,kind,at-this.time,tone);
      cell.style=2; cell.animDuration=this.config.waveTransition;
      cell.seedReadyAt=at+cell.animDuration;
    }
    // Retain the public name from earlier releases, with the same radial click behavior.
    plant(x,y,kind=1,tone=kind) { return this.stamp(x,y,kind,tone); }
    candidates(cell,kind) {
      const seeds = [], r = this.config.neighborhoodRadius;
      for (let y=Math.max(0,cell.y-r);y<=Math.min(this.rows-1,cell.y+r);y++) for (let x=Math.max(0,cell.x-r);x<=Math.min(this.cols-1,cell.x+r);x++) {
        const c = this.at(x,y);
        if (!c.owner && c.kind===kind && c.seedReadyAt<=this.time && c.cooldownUntil<=this.time) seeds.push(c);
      }
      seeds.sort((a,b) => ((a.x-cell.x)**2+(a.y-cell.y)**2) - ((b.x-cell.x)**2+(b.y-cell.y)**2));
      return seeds;
    }
    shapeCenter(seeds) {
      const half = (this.size-1)/2;
      return {
        x: clamp(Math.round(seeds.reduce((n,s)=>n+s.x,0)/seeds.length),half,this.cols-half-1),
        y: clamp(Math.round(seeds.reduce((n,s)=>n+s.y,0)/seeds.length),half,this.rows-half-1)
      };
    }
    overlapsBox(cx,cy,gap=1) {
      return [...this.shapes.values()].filter(s => Math.abs(s.cx-cx) < this.size+gap && Math.abs(s.cy-cy) < this.size+gap);
    }
    tryForm(cell) {
      if (!cell.kind || cell.owner || cell.seedReadyAt>this.time || cell.cooldownUntil>this.time || this.size<5) return false;
      const seeds = this.candidates(cell,cell.kind).slice(0,this.config.threshold);
      if (seeds.length < this.config.threshold) return false;
      const kind = cell.kind, half = (this.size-1)/2, mask = this.masks[kind], center = this.shapeCenter(seeds);
      const manual = seeds.some(s => s.manualUntil>this.time);
      const targets = mask.map(p => this.at(center.x+p.dx,center.y+p.dy));
      const conflicts = this.overlapsBox(center.x,center.y,1);
      if (conflicts.length) {
        if (manual) for (const s of conflicts) this.dissolve(s.id);
        return false;
      }
      const capacityBlocked = this.shapes.size>=this.shapeLimit || this.reserved+mask.length>this.budget;
      if (capacityBlocked) {
        // Do not silently drop a valid user cluster. Free one old form, then retry on the next scan.
        if (manual && ![...this.shapes.values()].some(s=>s.dissolving)) {
          const oldest = [...this.shapes.values()].sort((a,b)=>(a.manual-b.manual)||(a.born-b.born))[0];
          if (oldest) this.dissolve(oldest.id);
        }
        return false;
      }
      if (targets.some(c=>!c || c.owner || (!manual && (c.cooldownUntil>this.time || c.manualUntil>this.time)))) return false;
      const tones = new Map();
      for (const s of seeds) tones.set(s.tone,(tones.get(s.tone)||0)+1);
      const tone = [...tones.entries()].sort((a,b)=>b[1]-a[1])[0][0];
      const id=this.nextId++, born=this.time, hold=this.random.between(this.config.holdMin,this.config.holdMax);
      const shape={id,kind,tone,cx:center.x,cy:center.y,size:this.size,born,cells:[],endAt:0,dissolving:false,manual};
      const targetSet = new Set(targets);
      for (const target of targets) {
        const distance = Math.min(...seeds.map(s=>Math.hypot(target.x-s.x,target.y-s.y)));
        const outward = Math.hypot(target.x-center.x,target.y-center.y)/Math.max(half,1);
        target.owner=id; target.targetKind=kind; target.targetTone=tone; target.manualUntil=0;
        target.growAt=born+.10+distance*.075+this.random.between(0,.20);
        target.releaseAt=born+1.75+hold+(1-clamp(outward,0,1))*.85+this.random.between(0,.65);
        target.cooldownUntil=target.releaseAt+this.config.cooldown;
        shape.cells.push(target.y*this.cols+target.x); shape.endAt=Math.max(shape.endAt,target.releaseAt+this.config.transitionMax);
      }
      for (const seed of seeds) if (!targetSet.has(seed)) {
        this.switchCell(seed,0,this.random.between(.10,.25)); seed.manualUntil=0;
        seed.cooldownUntil=born+hold+3+this.config.cooldown;
      }
      this.reserved+=targets.length; this.shapes.set(id,shape); this.totalFormations++;
      this.formationsByKind[kind]++; this.formationsByTone[tone]++;
      this.lastFormation={id,kind,tone,time:born,seedCount:seeds.length,x:center.x,y:center.y,manual}; return true;
    }
    dissolve(id) {
      const shape=this.shapes.get(id); if (!shape || shape.dissolving) return false;
      shape.dissolving=true; shape.endAt=this.time;
      for (const index of shape.cells) {
        const c=this.cells[index]; if (c.owner!==id) continue;
        const d=Math.hypot(c.x-shape.cx,c.y-shape.cy);
        c.releaseAt=Math.min(c.releaseAt,this.time+.06+d*.042+this.random.between(0,.14));
        c.growAt=Infinity; c.waveAt=Infinity; shape.endAt=Math.max(shape.endAt,c.releaseAt+this.config.transitionMax);
      }
      return true;
    }
    ambientSite(kind) {
      if (this.size<5 || this.shapes.size>=this.shapeLimit || this.reserved+this.masks[kind].length>this.budget) return null;
      const half=(this.size-1)/2, candidates=[];
      for (let i=0;i<50;i++) {
        const cx=half+this.random.int(Math.max(1,this.cols-2*half));
        const cy=half+this.random.int(Math.max(1,this.rows-2*half));
        if (this.overlapsBox(cx,cy,2).length) continue;
        const points=[...this.masks[kind].map(p=>this.at(cx+p.dx,cy+p.dy)),...this.seedPositions(cx,cy)];
        if (points.some(c=>!c || c.owner || c.cooldownUntil>this.time || c.manualUntil>this.time)) continue;
        const clearance=this.shapes.size ? Math.min(...[...this.shapes.values()].map(s=>Math.hypot(s.cx-cx,s.cy-cy))) : this.random.value()*10;
        candidates.push({x:cx,y:cy,clearance});
      }
      return candidates.sort((a,b)=>b.clearance-a.clearance)[0] || null;
    }
    gatherAmbientSeeds() {
      if (!this.ambient || this.time<this.nextAmbient || this.events.length) return;
      if (!this.waitingKind) {
        if (!this.ambientBag.length) this.ambientBag=this.random.shuffle(KINDS);
        this.waitingKind=this.ambientBag.pop();
      }
      const point=this.ambientSite(this.waitingKind);
      if (!point) { this.nextAmbient=this.time+.75; return; }
      const kind=this.waitingKind, tone=this.nextTone(); this.waitingKind=0;
      // Local arrivals make each kind observable without bypassing the four-seed rule.
      // This shuffled ambient cycle is deliberately separate from independent cell changes.
      this.seedPositions(point.x,point.y).forEach((c,i)=>this.events.push({at:this.time+i*.28,x:c.x,y:c.y,kind,tone}));
      this.nextAmbient=this.time+this.random.between(this.config.ambientMin,this.config.ambientMax);
    }
    advance(dt) {
      if (!Number.isFinite(dt) || dt<0) throw new RangeError('dt must be a nonnegative finite number');
      this.time+=dt;
      while (this.events.length && this.events[0].at<=this.time) {
        const e=this.events.shift(); this.seed(e.x,e.y,e.kind,0,e.tone,false);
      }
      for (const c of this.cells) {
        if (this.time>=c.waveAt) this.applyWave(c);
        if (c.owner) {
          if (this.time>=c.releaseAt) {
            c.owner=0; this.reserved--; c.growAt=c.releaseAt=Infinity; c.targetKind=0; c.targetTone=0;
            this.switchCell(c,0); c.cooldownUntil=this.time+this.config.cooldown;
          } else if (this.time>=c.growAt) { this.switchCell(c,c.targetKind,0,c.targetTone); c.growAt=Infinity; }
        } else if (this.time>=c.nextChange && c.manualUntil<=this.time) {
          const kind=!c.kind && this.time>=c.cooldownUntil && this.random.value()<this.config.seedProbability ? this.randomKind() : 0;
          this.switchCell(c,kind);
        }
      }
      for (const [id,s] of this.shapes) if (this.time>=s.endAt) this.shapes.delete(id);
      if (this.time>=this.nextScan) {
        this.nextScan=this.time+this.config.scanInterval;
        const colored=this.cells.filter(c=>c.kind && !c.owner);
        // Explicit input is evaluated before ambient arrivals, even while capacity is full.
        colored.sort((a,b)=>(b.manualUntil>this.time)-(a.manualUntil>this.time));
        const manual=colored.filter(c=>c.manualUntil>this.time), ordinary=colored.filter(c=>c.manualUntil<=this.time);
        for (const c of manual) this.tryForm(c);
        const offset=this.random.int(Math.max(1,ordinary.length));
        for (let i=0;i<ordinary.length && this.shapes.size<this.shapeLimit;i++) this.tryForm(ordinary[(i+offset)%ordinary.length]);
        this.gatherAmbientSeeds();
      }
    }
    snapshot() {
      const colored=this.cells.filter(c=>c.kind>0).length;
      return {
        version:'4.0.0',time:this.time,cols:this.cols,rows:this.rows,cells:this.cells.length,colored,
        pendingWaveCells:this.cells.filter(c=>Number.isFinite(c.waveAt)).length,
        waveStep:this.config.waveStep,waveTransition:this.config.waveTransition,
        monochromeFraction:1-colored/this.cells.length,activeShapes:this.shapes.size,reserved:this.reserved,
        shapeSize:this.size,shapeLimit:this.shapeLimit,budget:this.budget,formations:this.totalFormations,changes:this.totalChanges,
        formationsByKind:this.formationsByKind.slice(1),formationsByTone:this.formationsByTone.slice(1),
        lastFormation:this.lastFormation?{...this.lastFormation}:null,
        shapes:[...this.shapes.values()].map(s=>({id:s.id,kind:s.kind,name:SHAPES[s.kind].name,tone:s.tone,x:s.cx,y:s.cy,size:s.size,born:s.born,cells:s.cells.length,dissolving:s.dissolving,manual:s.manual,trigger:s.trigger||'gather',completeAt:s.completeAt??null}))
      };
    }
  }
  globalThis.AsciiBloom=Object.freeze({Field,DEFAULTS,NEUTRAL,SYMBOLS,SHAPES,KINDS,PALETTES,shapeMask});
})();
