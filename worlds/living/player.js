// GPU resources, clock and capture lifetime; each painted world owns its art and motion.
export function random(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
export function cover(width, height, imageWidth, imageHeight, focus = .5, zoom = 1) {
  const scale = Math.max(width / imageWidth, height / imageHeight) * zoom;
  const w = imageWidth * scale, h = imageHeight * scale;
  return { scale, w, h, x: (width - w) * focus, y: (height - h) * .5 };
}
export function startWorld({ id, fragment, mask, paint, focus = .5, zoom = 1.025 }) {
  const canvas = document.querySelector('canvas'), status = document.querySelector('[role=status]');
  const output = canvas.getContext('2d', { alpha: false });
  const surface = document.createElement('canvas');
  const gl = surface.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false, disposed = false, playing = window === parent && !reduced.matches;
  let time = 0, last = null, frame = 0, frames = 0, seed = 8319, parameters = [0, 0, 0, 0];
  let image, program, buffer, textures = [], view;
  const load = new AbortController();
  let creatures = [], error = '', lastPaint = -Infinity, frameCost = 0;
  const shader = (type, source) => {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw Error(e); }
    return s;
  };
  const locations = {};
  function initialize() {
    const vertex = shader(gl.VERTEX_SHADER, 'attribute vec2 position;varying vec2 uv;void main(){uv=vec2(position.x*.5+.5,.5-position.y*.5);gl_Position=vec4(position,0.,1.);}');
    const pixel = shader(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, pixel); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(pixel);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const name of ['art','regions','time','variation','crop','resolution']) locations[name] = gl.getUniformLocation(program, name);
    (mask ? [image, mask(image)] : [image]).forEach((source, i) => {
      const texture = gl.createTexture(); textures.push(texture); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    });
    gl.uniform1i(locations.art, 0); gl.uniform1i(locations.regions, 1);
  }
  function scene(delta = 1) {
    seed = (seed + delta * 7919) >>> 0;
    const rng = random(seed); parameters = [rng(), rng(), rng(), rng()];
    creatures = Array.from({ length: id === 'verdure' ? 5 : 7 }, () => [rng(), rng(), rng(), rng()]);
    draw(); return true;
  }
  function draw() {
    if (!image || disposed) return;
    const began = performance.now();
    view = cover(canvas.width, canvas.height, image.width, image.height, focus, zoom);
    if (gl && program) {
      gl.viewport(0, 0, surface.width, surface.height);
      gl.uniform1f(locations.time, time); gl.uniform4fv(locations.variation, parameters);
      gl.uniform4f(locations.crop, -view.x/view.w, -view.y/view.h, canvas.width/view.w, canvas.height/view.h);
      gl.uniform2f(locations.resolution, image.width, image.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6); output.drawImage(surface, 0, 0);
      output.save(); output.translate(view.x, view.y); output.scale(view.w, view.h);
      paint?.(output, time, creatures, parameters); output.restore();
    } else output.drawImage(image, view.x, view.y, view.w, view.h);
    frames++; frameCost += (performance.now() - began - frameCost) * .06;
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (innerWidth * innerHeight)));
    canvas.width = surface.width = Math.max(1, Math.round(innerWidth * ratio));
    canvas.height = surface.height = Math.max(1, Math.round(innerHeight * ratio)); draw();
  }
  function tick(now) {
    frame = 0;
    if (!playing || !ready || document.hidden || disposed || !gl) { last = null; return; }
    const dt = last === null ? 0 : Math.min(.1, (now - last) / 1000); last = now; time += dt;
    if (now - lastPaint >= 1000/30 - .5) { draw(); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(frame); frame = 0; last = null; lastPaint = -Infinity;
    if (playing && ready && !document.hidden && !disposed && gl) frame = requestAnimationFrame(tick); }
  function dispose() {
    if (disposed) return; disposed = true; ready = false; cancelAnimationFrame(frame); load.abort();
    removeEventListener('resize', resize); document.removeEventListener('visibilitychange', sync);
    reduced.removeEventListener('change', onReduced); image?.close();
    if (gl) { textures.forEach(t=>gl.deleteTexture(t)); if(buffer)gl.deleteBuffer(buffer); if(program)gl.deleteProgram(program); }
    canvas.width = canvas.height = surface.width = surface.height = 0;
  }
  function onReduced(event) { if(event.matches){playing=false;sync();} }
  const snapshot = () => ({id,ready,playing,time,frames,seed,disposed,error,renderer:gl?'webgl':'static',frameCost,backing:[canvas.width,canvas.height],parameters:[...parameters],view});
  window.landscape = Object.freeze({get ready(){return ready;}, snapshot, dispose, player:Object.freeze({
    setPlaying(value){playing=Boolean(value);sync();return true;},setMuted(){return true;},
    randomScene:()=>scene(Math.floor(Math.random()*10000)+1),nextScene:()=>scene(1),previousScene:()=>scene(-1),
    destroy:dispose,
    drawTo(target){if(!ready||disposed)return false;draw();target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0);return true;},snapshot
  })});
  addEventListener('resize', resize); addEventListener('pagehide', dispose, {once:true});
  document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', onReduced);
  surface.addEventListener('webglcontextlost', event=>{event.preventDefault();ready=false;playing=false;sync();error='Graphics context lost';status.hidden=false;status.textContent='그래픽 연결이 중단되었습니다. 장면을 다시 선택해 주세요.';});
  (async()=>{
    const response=await fetch('./art/master.png',{signal:load.signal}); if(!response.ok)throw Error('Original art unavailable');
    const loaded=await createImageBitmap(await response.blob());
    if(disposed){loaded.close();return;}image=loaded;
    if(gl)initialize();scene();resize();ready=Boolean(gl);status.hidden=Boolean(gl);
    if(!gl){error='WebGL unavailable';status.textContent='정지 미리보기 · WebGL을 사용할 수 없습니다.';}sync();
  })().catch(e=>{if(disposed)return;error=e.message;status.hidden=false;status.textContent='장면을 준비하지 못했습니다. 다시 선택해 주세요.';console.error(e);});
}

// Spatial data only: polygons supply coverage; each source determines its meaning.
export function regionMap(image, regions, filter) {
  const map=document.createElement('canvas');map.width=image.width;map.height=image.height;
  const c=map.getContext('2d',{willReadFrequently:true});c.fillStyle='#000';c.fillRect(0,0,map.width,map.height);
  for(const [color,points] of regions){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*map.width,y*map.height):c.moveTo(x*map.width,y*map.height));c.closePath();c.fill();}
  if(filter){const pixels=c.getImageData(0,0,map.width,map.height);const source=document.createElement('canvas');source.width=map.width;source.height=map.height;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);filter(pixels.data,sc.getImageData(0,0,map.width,map.height).data,map.width,map.height);c.putImageData(pixels,0,0);source.width=source.height=0;}
  return map;
}
