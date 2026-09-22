/* Pure deterministic helpers shared by the player and Node regression tests. */
((root, factory) => {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AscentMath = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const v = clamp((x-a)/(b-a), 0, 1); return v*v*(3-2*v); };
  const mod = (n, m) => ((n % m) + m) % m;
  function random(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let a = Math.imul(seed ^ seed >>> 15, 1 | seed);
      a = a + Math.imul(a ^ a >>> 7, 61 | a) ^ a;
      return ((a ^ a >>> 14) >>> 0) / 4294967296;
    };
  }
  function noiseField(seed) {
    const rand = random(seed), table = Float32Array.from({length: 256*256}, rand);
    return (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x-ix, fy = y-iy;
      const sx = fx*fx*fx*(fx*(fx*6-15)+10), sy = fy*fy*fy*(fy*(fy*6-15)+10);
      const x0=ix&255, x1=(ix+1)&255, y0=(iy&255)*256, y1=((iy+1)&255)*256;
      return mix(mix(table[y0+x0],table[y0+x1],sx),mix(table[y1+x0],table[y1+x1],sx),sy);
    };
  }
  function normalizedMeteorOptions(options={}) {
    const slopeMax=clamp(Number(options.slopeMax)||.4,0,.65);
    const interval=clamp(Number(options.interval)||40,24,120);
    const durationMin=clamp(Number(options.durationMin)||1.75,.8,4);
    const durationMax=clamp(Number(options.durationMax)||2.08,durationMin,4.5);
    const tailMin=clamp(Number(options.tailMin)||72,36,220);
    const tailMax=clamp(Number(options.tailMax)||108,tailMin,260);
    const delayMin=clamp(Number(options.delayMin)||6,0,interval-durationMax-.1);
    const delaySpan=clamp(Number(options.delaySpan)||8,0,interval-delayMin-durationMax-.1);
    return {
      interval, durationMin, durationMax, tailMin, tailMax, delayMin, delaySpan,
      firstAt:clamp(Number(options.firstAt)||8.2,.2,interval-durationMax-.1),
      yMin:clamp(Number(options.yMin)||.11,.04,.55),
      yMax:clamp(Number(options.yMax)||.31,.05,.62),
      directionBias:clamp(Number(options.directionBias)||.62,0,1),
      slopeMin:clamp(Number(options.slopeMin)||0,0,slopeMax),slopeMax,
      intensity:clamp(Number(options.intensity)||.38,.12,.8),
    };
  }
  function meteorForSlot(slot, seed, options={}) {
    const o=normalizedMeteorOptions(options);
    const r=random((seed ^ Math.imul(slot+1, 0x45d9f3b))>>>0);
    const y0=Math.min(o.yMin,o.yMax),y1=Math.max(o.yMin,o.yMax);
    return {
      slot,
      at:slot===0 ? o.firstAt : slot*o.interval+o.delayMin+r()*o.delaySpan,
      duration:mix(o.durationMin,o.durationMax,r()),
      y:mix(y0,y1,r()),
      direction:r()<o.directionBias?1:-1,
      tail:mix(o.tailMin,o.tailMax,r()),
      slope:mix(o.slopeMin,o.slopeMax,r()),
      intensity:o.intensity*(.90+r()*.10),
      tone:Math.min(2,Math.floor(r()*3)),
    };
  }
  function activeMeteor(t, seed, options={}) {
    // Constant memory/time even when seeking years into the animation.
    const interval=normalizedMeteorOptions(options).interval;
    const e=meteorForSlot(Math.floor(t/interval),seed,options), u=(t-e.at)/e.duration;
    return u>=0&&u<=1 ? {...e,u} : null;
  }
  function meteorPath(event,camera){
    const tail=Math.min(event.tail,camera.width*.17);
    const distance=camera.width+tail*2,travel=-tail+distance*event.u;
    const slope=Math.min(event.slope,camera.height*.52/distance);
    return {tail,slope,
      x:camera.left+(event.direction===1?travel:camera.width-travel),
      y:camera.top+camera.height*event.y+slope*travel};
  }
  function view(width,height,worldW=1536,worldH=1024) {
    const scale=Math.max(width/worldW,height/worldH);
    return {scale,x:(width-worldW*scale)/2,y:(height-worldH*scale)/2,
      left:(worldW-width/scale)/2,top:(worldH-height/scale)/2,
      width:width/scale,height:height/scale,
      // Only the background layout reflows on a narrow viewport. The rocket never stretches.
      reflow:smooth(1.30,.76,width/height)};
  }
  function stageView(width,height,worldW=1536,worldH=1024,minVisibleHeight=920) {
    // Keep the complete lower exhaust visible. On wide displays, cap the vertical crop and
    // leave side space for low fire-bank extensions instead of pushing the rocket too high.
    const coverScale=Math.max(width/worldW,height/worldH);
    const coverVisibleHeight=height/coverScale;
    const visibleHeight=clamp(Math.max(coverVisibleHeight,minVisibleHeight),1,worldH);
    const scale=height/visibleHeight;
    const x=(width-worldW*scale)/2,y=height-worldH*scale;
    return {scale,x,y,left:-x/scale,top:-y/scale,width:width/scale,height:visibleHeight,
      sideFill:Math.max(0,x),bottom:y+worldH*scale};
  }
  return Object.freeze({TAU,clamp,mix,smooth,mod,random,noiseField,
    normalizedMeteorOptions,meteorForSlot,activeMeteor,meteorPath,view,stageView});
});
