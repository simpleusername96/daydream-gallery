(() => {
  'use strict';
  const lifetime=new AbortController();
  const listen=(target,type,handler,options={})=>target.addEventListener(type,handler,{...options,signal:lifetime.signal});
  const player=document.getElementById('player'),canvas=document.getElementById('scene');
  const playButton=document.getElementById('play'),fullscreenButton=document.getElementById('fullscreen'),notice=document.getElementById('notice');
  const embedded=new URLSearchParams(location.search).get('player')==='1';
  document.documentElement.classList.toggle('embedded',embedded);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let playing=!embedded&&!reducedMotion.matches,ready=false,failed=false,disposed=false,elapsed=8,auroraTime=8,lastFrame=0,frame=0,quietTimer,noticeTimer;
  let gl,seaProgram,veilProgram,compositeProgram,quad,veil,plateTexture,skyTexture,skyFramebuffer,skyWidth=0,skyHeight=0,aspect=1.777;
  let quality=.72,qualityFrames=0,qualityMs=0,qualitySince=0;
  // Fixed selection from the user's swatches; no saved browser values override this scene.
  const appearance={brightness:.90,overlap:.66,mist:2,speed:2,
    blue:'#7c9cfe',teal:'#62c6ba',lilac:'#a990ea'};
  const rgb=hex=>[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)/255);
  const seaVertex = `
    precision highp float;
    attribute vec2 aUV;
    varying highp vec2 vUV;
    void main(){vUV=aUV;gl_Position=vec4(aUV*2.0-1.0,0.0,1.0);}`;
  const seaFragment = `
    precision highp float;
    uniform sampler2D uPlate;
    uniform sampler2D uAurora;
    uniform vec2 uSkySize;
    uniform float uTime;
    uniform float uAspect;
    varying highp vec2 vUV;
    // A bounded sum of directional waves, with analytic slopes for stable normals.
    vec3 waves(vec2 p,float t,float farFade){
      p+=vec2(.22*sin(p.y*.61+t*.11),.18*sin(p.x*.93-t*.14));
      vec3 w=vec3(0.0);
      vec2 d=normalize(vec2(.92,.38));float k=.73,a=.045,ph=dot(p,d)*k-t*.32;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(-.46,.89));k=1.31;a=.023;ph=dot(p,d)*k+t*.39;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(.28,.96));k=2.83;a=.010*farFade;ph=dot(p,d)*k-t*.53;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(.83,-.55));k=6.7;a=.0043*farFade;ph=dot(p,d)*k+t*.67;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(-.13,.99));k=13.2;a=.0021*farFade;ph=dot(p,d)*k-t*.89;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(.94,.33));k=24.3;a=.0018*farFade;ph=dot(p,d)*k+t*1.03;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      d=normalize(vec2(-.68,.73));k=18.5;a=.0021*farFade;ph=dot(p,d)*k-t*.94;
      w+=vec3(a*sin(ph),d*a*k*cos(ph));
      return w;
    }
    float icebergMask(vec2 source){
      // The lower silhouette only; the upper iceberg is in the unchanged sky plate.
      vec2 p=source*vec2(1672.0,941.0);
      float left=mix(550.0,529.0,clamp((p.y-666.0)/23.0,0.0,1.0));
      float right=mix(598.0,624.0,clamp((p.y-666.0)/23.0,0.0,1.0));
      float sides=smoothstep(left-.65,left+.65,p.x)*(1.0-smoothstep(right-.65,right+.65,p.x));
      return sides*(1.0-smoothstep(688.0,690.0,p.y));
    }
    void main(){
      vec2 q=vec2(vUV.x,1.0-vUV.y);
      float fit=min(1.0,uAspect/1.777);
      // Crop around the iceberg; never squeeze the authored landscape into portrait.
      float photoX=fit<1.0?.345+(q.x-.345)*fit:q.x;
      float horizon=mix(.718,.710,smoothstep(.70,1.45,uAspect));
      horizon+=.008*pow(abs(q.x-.5)*2.0,2.0)*(1.0-exp(-pow((q.x-.345)/.105,4.0)));
      float delta=q.y-horizon;
      float k=max(0.0,((1.0-horizon)/.290-1.0)/(1.0-horizon));
      float photoY=.710+(delta<0.0?delta:delta/(1.0+k*delta));
      vec3 plate=texture2D(uPlate,clamp(vec2(photoX,1.0-photoY),vec2(.001),vec2(.999))).rgb;
      plate=mix(plate,vec3(.002,.007,.013),1.0-smoothstep(-.18,.02,photoY));
      vec3 color=plate;
      if(delta<=0.0){
        // Lift only the open sky; the fade ends above the fixed iceberg.
        float sky=1.0-smoothstep(.648,.675,photoY);
        // The clean plate already contains tiny stars. Animate their light, not their size or position.
        float star=smoothstep(.022,.16,min(plate.r,plate.g));
        float rate=.70+.25*sin(photoX*23.0+photoY*17.0);
        float pulse=.55+pow(.5+.5*sin(uTime*rate+photoX*67.0+photoY*43.0),3.0);
        color+=vec3(.012,.018,.035)*sky*(1.0-star);
        color+=plate*star*(pulse-1.0)*sky;
      }
      if(delta>0.0){
        float depth=clamp(delta/(1.0-horizon),0.0,1.0);
        float z=1.45/(delta+.030);
        vec2 world=vec2((q.x-.5)*z*uAspect*.65,z);
        float farFade=smoothstep(.004,.075,delta);
        vec3 w=waves(world,uTime,farFade);
        vec3 n=normalize(vec3(-w.y,1.0,-w.z));
        vec3 view=normalize(vec3(-world.x,.72,world.y));
        vec3 reflected=reflect(-view,n);
        float fresnel=.025+.975*pow(1.0-clamp(dot(n,view),0.0,1.0),5.0);
        float skyX=clamp(.5+reflected.x/max(.2,abs(reflected.z))*.43,.005,.995);
        float skyY=clamp(horizon-pow(max(.001,reflected.y),.60)*.85,.005,horizon);
        vec2 skyUV=vec2(fit<1.0?.345+(skyX-.345)*fit:skyX,1.0-skyY);
        vec2 spread=vec2(2.8,1.2)/uSkySize;
        vec3 light=texture2D(uAurora,skyUV).rgb*.5;
        light+=texture2D(uAurora,skyUV+spread).rgb*.25;
        light+=texture2D(uAurora,skyUV-spread).rgb*.25;
        vec3 ocean=mix(vec3(.006,.018,.029),vec3(.002,.008,.017),depth);
        float face=clamp(.50+w.z*6.5+w.y*1.7,0.0,1.0);
        ocean+=vec3(.010,.028,.041)*face*(.4+.6*depth);
        float crest=smoothstep(-.055,.050,w.x);
        ocean+=vec3(.006,.017,.024)*crest*(.35+.65*depth);
        ocean+=light*(.15+.26*fresnel)*farFade;
        // A narrow changing reflection beneath the fixed lit iceberg.
        float trail=exp(-pow((photoX-.345-w.y*.29)/(.009+depth*.045),2.0));
        float glint=pow(clamp(.42+w.z*8.0-w.y*3.0,0.0,1.0),2.8);
        ocean+=vec3(.10,.29,.35)*trail*glint*(.35+.65*exp(-depth*2.0));
        float distant=smoothstep(.0,.008,delta);
        ocean=mix(vec3(.006,.017,.026),ocean,distant);
        float keepIce=icebergMask(vec2(photoX,photoY));
        color=mix(plate,ocean,smoothstep(.0,.0035,delta)*(1.0-keepIce));
      }
      float vignette=1.0-.13*pow(abs(q.x-.5)*2.0,2.0);
      gl_FragColor=vec4(color*vignette,1.0);
    }`;
  // One continuous spectrum inside the established aurora silhouette.
  const veilVertex = `
    precision highp float;
    attribute vec2 aUV;
    varying highp vec2 vUV;
    void main(){vUV=aUV;gl_Position=vec4(aUV*2.0-1.0,0.0,1.0);}`;
  const veilFragment = `
    precision highp float;
    uniform float uTime;
    uniform float uBrightness;
    uniform float uOverlap;
    uniform float uMist;
    uniform vec3 uBlue;
    uniform vec3 uTeal;
    uniform vec3 uLilac;
    varying highp vec2 vUV;
    float softUnion(float a,float b){
      float h=clamp(.5+.5*(a-b)/.06,0.0,1.0);
      return mix(b,a,h)+.06*h*(1.0-h);
    }
    float colorWeight(vec2 p,float phase,float t){
      // Every color travels through both axes; none owns a fixed side or height.
      vec2 center=vec2(.5+.40*cos(t*.022+phase),.27+.23*sin(t*.017+phase));
      vec2 spread=vec2(.24,.16)+uOverlap*vec2(.20,.14);
      vec2 distance=(p-center)/spread;
      return exp(-dot(distance,distance));
    }
    float contour(float x,float layer,float t){
      float shapeX=x+.044*sin(x*7.0-t*.10)+.015*sin(x*17.0+t*.075);
      float edge=.18+.32/(1.0+exp(-(shapeX-.28)*12.0))+.10*shapeX;
      if(layer>.5 && layer<1.5){
        edge=.075+.49*exp(-pow((shapeX-.66)/.35,2.0))+.035*shapeX;
        edge+=.034*exp(-pow((shapeX-.72)/.09,2.0))-.030*exp(-pow((shapeX-.54)/.08,2.0));
      }
      if(layer>1.5)edge=.07+.38*exp(-pow((shapeX-.57)/.32,2.0));
      return edge+.029*sin(x*9.0-t*.095+layer)+.014*sin(x*18.0+t*.070);
    }
    void main(){
      float x=vUV.x,y=1.0-vUV.y,t=uTime;
      float middleEdge=contour(x,0.0,t),frontEdge=contour(x,1.0,t),rearEdge=contour(x,2.0,t);
      float edgeY=softUnion(rearEdge,softUnion(middleEdge,frontEdge));
      float v=(edgeY-y)/.74;
      if(v<-.012 || v>1.14)discard;
      float flow=.038*sin(x*6.0-v*2.5-t*.075)+.013*sin(x*13.0+v*1.8-t*.043);
      float u=x+.04*(v-.28)+flow;
      // Wide drifting fields mix continuously, independently of the outer silhouette.
      vec2 colorPosition=vec2(u,y+.026*sin(u*5.2-t*.032));
      vec3 weights=vec3(colorWeight(colorPosition,0.0,t),colorWeight(colorPosition,2.094395,t),colorWeight(colorPosition,4.188790,t));
      vec3 color=(uBlue*weights.x+uTeal*weights.y+uLilac*weights.z)/(weights.x+weights.y+weights.z);
      float upper=smoothstep(.22,.90,v);
      float lightX=.46+.24*sin(t*.048);
      float glow=exp(-pow((u-lightX)/.33,2.0)-pow((v-.30)/.65,2.0));
      float illumination=.72+.18*glow+.035*sin(u*4.2+v*2.2-t*.045)-.10*upper;
      float fade=smoothstep(-.012,.15,v)*(1.0-smoothstep(.96,1.12,v));
      float opacity=min(.98,(.72+.10*glow)*uMist);
      gl_FragColor=vec4(color*illumination*uBrightness,fade*opacity);
    }`;
  const compositeVertex = seaVertex;
  const compositeFragment = `precision highp float; uniform sampler2D uAurora; uniform float uAspect; varying highp vec2 vUV; void main(){float fit=min(1.0,uAspect/1.777);float x=fit<1.0?.345+(vUV.x-.345)*fit:vUV.x;gl_FragColor=texture2D(uAurora,vec2(x,vUV.y));}`;
  function showNotice(message, duration=3600) {
    notice.textContent=message;
    notice.classList.add('visible');
    clearTimeout(noticeTimer);
    if(duration) noticeTimer=setTimeout(()=>notice.classList.remove('visible'),duration);
  }
  function syncControls(){
    player.classList.toggle('paused',!playing);
    playButton.setAttribute('aria-label',playing?'일시 정지':'재생');
    playButton.title=playing?'일시 정지 (Space)':'재생 (Space)';
    playButton.setAttribute('aria-pressed',String(playing));
    document.getElementById('play-state').textContent=playing?'재생 중':'재생';
  }
  function revealControls(){
    if(embedded||disposed)return;
    player.classList.remove('quiet');
    clearTimeout(quietTimer);
    if(playing) quietTimer=setTimeout(()=>player.classList.add('quiet'),4000);
  }
  function setPlaying(value){
    if(failed||disposed) return false;
    playing=Boolean(value);
    syncControls();
    lastFrame=0;qualitySince=0;qualityFrames=0;qualityMs=0;
    cancelAnimationFrame(frame);frame=0;
    if(ready && playing && !document.hidden) frame=requestAnimationFrame(tick);
    if(playing) notice.classList.remove('visible');
    revealControls();
    return playing;
  }
  async function toggleFullscreen(){
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else if(player.classList.contains('expanded')) player.classList.remove('expanded');
      else if(player.requestFullscreen && document.fullscreenEnabled) await player.requestFullscreen();
      else {
        player.classList.add('expanded');
        showNotice('이 브라우저에서는 화면에 맞춰 표시해요');
      }
      syncFullscreen();
      resize();
    } catch (_) { showNotice('전체 화면을 시작할 수 없어요'); }
    revealControls();
  }
  function syncFullscreen(){
    const active=!!document.fullscreenElement||player.classList.contains('expanded');
    fullscreenButton.setAttribute('aria-label',active?'전체 화면 종료':'전체 화면');
    fullscreenButton.title=active?'전체 화면 종료 (F)':'전체 화면 (F)';
    fullscreenButton.setAttribute('aria-pressed',String(active));
  }
  listen(playButton,'click',()=>setPlaying(!playing));
  listen(fullscreenButton,'click',toggleFullscreen);
  listen(player,'pointermove',revealControls,{passive:true});
  listen(player,'pointerdown',revealControls,{passive:true});
  listen(player,'focusin',revealControls);
  listen(document,'fullscreenchange',()=>{syncFullscreen();resize();});
  listen(document,'keydown',event=>{
    if(embedded||event.altKey||event.ctrlKey||event.metaKey) return;
    if(event.code==='Space' && event.target instanceof HTMLButtonElement) return;
    if(event.code==='Space'||event.code==='KeyK') {event.preventDefault();setPlaying(!playing);}
    if(event.code==='KeyF') {event.preventDefault();void toggleFullscreen();}
    if(event.code==='Escape' && player.classList.contains('expanded')) {player.classList.remove('expanded');syncFullscreen();resize();}
  });
  listen(document,'visibilitychange',()=>{
    cancelAnimationFrame(frame);frame=0;
    lastFrame=0;
    if(!document.hidden && playing && ready) frame=requestAnimationFrame(tick);
  });
  const motionPreferenceChanged=event=>{if(!embedded&&event.matches) {setPlaying(false);showNotice('동작 줄이기 설정으로 멈췄어요. 재생을 누르면 움직여요',0);}};
  if(reducedMotion.addEventListener) listen(reducedMotion,'change',motionPreferenceChanged);
  else if(reducedMotion.addListener) reducedMotion.addListener(motionPreferenceChanged);
  syncControls();
  syncFullscreen();


  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function program(vertex,fragment){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return {p,uv:gl.getAttribLocation(p,'aUV'),time:gl.getUniformLocation(p,'uTime'),aspect:gl.getUniformLocation(p,'uAspect'),plate:gl.getUniformLocation(p,'uPlate'),aurora:gl.getUniformLocation(p,'uAurora'),skySize:gl.getUniformLocation(p,'uSkySize')};}
  function mesh(vertices,indices){const v=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);return {v,i,count:indices.length};}
  function allocateSky(){
    const w=Math.max(160,Math.round(canvas.width*quality)),h=Math.max(160,Math.round(canvas.height*quality));
    if(w===skyWidth&&h===skyHeight)return;
    skyWidth=w;skyHeight=h;gl.bindTexture(gl.TEXTURE_2D,skyTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,skyFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,skyTexture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Sky buffer unavailable');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  function resize(){
    if(!gl||disposed)return;
    const w=player.clientWidth,h=player.clientHeight,dpr=Math.min(devicePixelRatio||1,1.0,1280/w,900/h);aspect=w/h;
    const cw=Math.round(w*dpr),ch=Math.round(h*dpr);
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    if(skyTexture)allocateSky();if(ready)draw();
  }
  function bindQuad(p){gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(p.uv);gl.vertexAttribPointer(p.uv,2,gl.FLOAT,false,8,0);}
  function draw(){
    // Aurora is rendered once into a filtered buffer, then reused for its sea reflection.
    gl.bindFramebuffer(gl.FRAMEBUFFER,skyFramebuffer);gl.viewport(0,0,skyWidth,skyHeight);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    bindQuad(veilProgram);gl.uniform1f(veilProgram.time,auroraTime);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);
    bindQuad(seaProgram);gl.uniform1f(seaProgram.time,elapsed);gl.uniform1f(seaProgram.aspect,aspect);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,plateTexture);gl.uniform1i(seaProgram.plate,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,skyTexture);gl.uniform1i(seaProgram.aurora,1);gl.uniform2f(seaProgram.skySize,skyWidth,skyHeight);gl.drawArrays(gl.TRIANGLES,0,6);
    // The offscreen color is premultiplied by its accumulated alpha.
    gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    bindQuad(compositeProgram);gl.uniform1f(compositeProgram.aspect,aspect);gl.uniform1i(compositeProgram.aurora,1);gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.dataset.time=elapsed.toFixed(3);canvas.dataset.quality=quality.toFixed(3);canvas.dataset.engine='continuous-ocean-v19';canvas.dataset.frames=String((Number(canvas.dataset.frames)||0)+1);
  }
  function tick(now){
    frame=0;
    if(disposed||!playing||document.hidden||!ready)return;
    if(lastFrame){
      const dt=Math.max(0,(now-lastFrame)/1000);elapsed+=dt;auroraTime+=dt*appearance.speed;
      qualityMs+=dt*1000;qualityFrames++;
      if(!qualitySince)qualitySince=now;
      if(now-qualitySince>2500){
        const average=qualityMs/Math.max(1,qualityFrames);let next=quality;
        if(average>24)next=Math.max(.45,quality*.83);
        else if(average<18&&now-qualitySince>8000)next=Math.min(.78,quality+.035);
        if(next!==quality){quality=next;allocateSky();qualitySince=now;qualityMs=0;qualityFrames=0;}
        else if(now-qualitySince>8000){qualitySince=now;qualityMs=0;qualityFrames=0;}
      }
    }
    lastFrame=now;draw();frame=requestAnimationFrame(tick);
  }
  function fail(error){if(disposed)return;console.error('Night sea:',error);failed=true;playing=false;ready=false;syncControls();cancelAnimationFrame(frame);frame=0;player.classList.remove('ready');playButton.disabled=true;showNotice('이 브라우저에서는 정지 이미지로 표시해요',0);window.dispatchEvent(new Event('arctic-aurora-error'));}
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();fail(new Error('Graphics context lost'));});listen(canvas,'webglcontextrestored',()=>location.reload());
  async function init(){
    gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'});if(!gl)throw new Error('WebGL unavailable');
    const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Background unavailable'));i.src='assets/sculpted-aurora-clean-plate-v17.png';});
    if(disposed)return;
    plateTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,plateTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    seaProgram=program(seaVertex,seaFragment);veilProgram=program(veilVertex,veilFragment);compositeProgram=program(compositeVertex,compositeFragment);
    gl.useProgram(veilProgram.p);
    for(const key of ['brightness','overlap','mist'])gl.uniform1f(gl.getUniformLocation(veilProgram.p,'u'+key[0].toUpperCase()+key.slice(1)),appearance[key]);
    for(const key of ['blue','teal','lilac'])gl.uniform3fv(gl.getUniformLocation(veilProgram.p,'u'+key[0].toUpperCase()+key.slice(1)),rgb(appearance[key]));
    skyTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,skyTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);skyFramebuffer=gl.createFramebuffer();
    quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
    const vertices=[],indices=[],columns=1,rows=1;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)vertices.push(x/columns,y/rows);
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}
    veil=mesh(vertices,indices);gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    ready=true;resize();player.classList.add('ready');listen(window,'resize',resize,{passive:true});setPlaying(playing);if(reducedMotion.matches)showNotice('동작 줄이기 설정으로 멈췄어요. 재생을 누르면 움직여요',0);
  }

  // The shared gallery controls the same renderer and clock as the standalone page.
  function destroy(){
    if(disposed)return;
    disposed=true;playing=false;ready=false;
    cancelAnimationFrame(frame);frame=0;
    clearTimeout(quietTimer);clearTimeout(noticeTimer);
    lifetime.abort();
    if(!reducedMotion.removeEventListener)reducedMotion.removeListener?.(motionPreferenceChanged);
    if(gl){
      for(const program of [seaProgram,veilProgram,compositeProgram])if(program)gl.deleteProgram(program.p);
      for(const buffer of [quad,veil?.v,veil?.i])if(buffer)gl.deleteBuffer(buffer);
      for(const texture of [plateTexture,skyTexture])if(texture)gl.deleteTexture(texture);
      if(skyFramebuffer)gl.deleteFramebuffer(skyFramebuffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl=null;
    }
  }
  window.arcticAurora=Object.freeze({
    get ready(){return ready&&!disposed;},
    get failed(){return failed;},
    snapshot(){return {time:elapsed,auroraTime,playing,ready,failed,disposed,rafPending:Boolean(frame)};},
    player:Object.freeze({
      setPlaying(value){if(failed||disposed)return false;setPlaying(value);return true;},
      drawTo(target){
        if(!ready||disposed||failed)return false;
        target.width=canvas.width;target.height=canvas.height;
        const context=target.getContext('2d');if(!context)return false;
        draw();context.drawImage(canvas,0,0);return true;
      },
      destroy
    })
  });
  listen(window,'pagehide',destroy,{once:true});

  init().catch(fail);
  // The optional browser standard uses the very same playback action as the button.
  if(!embedded&&document.modelContext?.registerTool){
    try {
      Promise.resolve(document.modelContext.registerTool({
        name:'set_glacier_playback',title:'빙하 플레이어 재생 설정',
        description:'Play or pause the night-sea scene in the visible glacier player.',
        inputSchema:{type:'object',properties:{playing:{type:'boolean'}},required:['playing'],additionalProperties:false},
        annotations:{readOnlyHint:false,untrustedContentHint:false},
        execute(input){
          if(!input||typeof input.playing!=='boolean'||Object.keys(input).some(k=>k!=='playing')) throw new Error('Expected only a boolean playing value');
          if(failed)throw new Error('Animation unavailable');
          setPlaying(input.playing);return {playing};
        }
      },{signal:lifetime.signal})).catch(()=>{});

    } catch (_) {}
  }
})();
