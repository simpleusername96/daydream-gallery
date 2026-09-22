/* Quiet Ascent v4. Authored foreground with a procedural downward background for ascent.
 * No external services, WebGL, source controls, sound or camera shake.
 * The authored sky travels downward; the rocket keeps a stable stage while the exhaust
 * continues past the viewport edges.
 */
(() => {
  'use strict';
  const {clamp,mix,smooth,mod,random,noiseField,activeMeteor,meteorPath,view,stageView}=window.AscentMath;
  const W=1832,H=858,FIRE_TOP=460,FW=610,FH=134,GX=65,GY=25;
  const overrides=window.ASCENT_SETTINGS || {};
  const setting=(name,value,lo,hi)=>Number.isFinite(overrides[name])?clamp(overrides[name],lo,hi):value;
  const deepFreeze=value=>{
    if(value&&typeof value==='object'&&!Object.isFrozen(value)){
      Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);
    }
    return value;
  };

  // Six authoring options with three restrained values each. They never create visible UI.
  const OPTION_VALUES=deepFreeze({
    meteor:{
      cadence:{rare:{interval:54,delayMin:8,delaySpan:11},sparse:{interval:42,delayMin:7,delaySpan:9},occasional:{interval:32,delayMin:5,delaySpan:8}},
      speed:{slow:{durationMin:2.10,durationMax:2.42},calm:{durationMin:1.75,durationMax:2.08},brisk:{durationMin:1.43,durationMax:1.72}},
      tail:{short:{tailMin:100,tailMax:140},medium:{tailMin:150,tailMax:195},long:{tailMin:210,tailMax:260}},
      brightness:{faint:{intensity:.34},soft:{intensity:.44},clear:{intensity:.76}},
      slope:{level:{slopeMin:0,slopeMax:.0035},slight:{slopeMin:.12,slopeMax:.22},varied:{slopeMin:.14,slopeMax:.27}},
      direction:{rightward:{directionBias:.86},mixed:{directionBias:.60},leftward:{directionBias:.18}},
    },
    stars:{
      density:{sparse:{density:.72},balanced:{density:1},rich:{density:1.25}},
      speed:{drifting:{speed:.75},calm:{speed:1},flowing:{speed:1.18}},
      brightness:{dim:{brightness:.78},soft:{brightness:1},clear:{brightness:1.12}},
      twinkle:{still:{twinkle:.46},quiet:{twinkle:.78},alive:{twinkle:1.04}},
      size:{tiny:{sizeWeights:[.82,.17,.01]},small:{sizeWeights:[.62,.35,.03]},mixed:{sizeWeights:[.44,.48,.08]}},
      palette:{cool:{warmChance:.06,neutralChance:.25},balanced:{warmChance:.15,neutralChance:.34},warm:{warmChance:.26,neutralChance:.38}},
    },
  });
  const DEFAULT_VARIANTS=deepFreeze({
    meteor:{cadence:'occasional',speed:'brisk',tail:'long',brightness:'clear',slope:'varied',direction:'mixed'},
    stars:{density:'balanced',speed:'calm',brightness:'soft',twinkle:'alive',size:'tiny',palette:'balanced'},
  });
  const selectedName=(section,name)=>{
    const candidate=overrides[section]&&overrides[section][name];
    return typeof candidate==='string'&&OPTION_VALUES[section][name][candidate] ? candidate : DEFAULT_VARIANTS[section][name];
  };
  const selected=deepFreeze({
    meteor:Object.fromEntries(Object.keys(DEFAULT_VARIANTS.meteor).map(name=>[name,selectedName('meteor',name)])),
    stars:Object.fromEntries(Object.keys(DEFAULT_VARIANTS.stars).map(name=>[name,selectedName('stars',name)])),
  });
  const mergeSelected=section=>Object.assign({},...Object.entries(selected[section]).map(([name,value])=>OPTION_VALUES[section][name][value]));
  const meteorProfile=deepFreeze(Object.assign({firstAt:8.2,yMin:.08,yMax:.20},mergeSelected('meteor')));
  const starProfile=deepFreeze(mergeSelected('stars'));
  const CONFIG=deepFreeze({
    seed:19690917,maxFrameRate:60,maxCanvasPixels:1600*1100,minStageVisibleHeight:858,
    atmosphere:setting('atmosphere',1,0,2),dust:setting('dust',1,0,2),
    exhaust:setting('exhaust',1,0,1.8),
    twinkle:setting('twinkle',1,0,2),starSpeed:setting('starSpeed',1,0,2),
    variants:selected,meteor:meteorProfile,stars:starProfile,
  });
  const canvas=document.getElementById('space');
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) throw new Error('Canvas 2D is required.');
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const noise=noiseField(CONFIG.seed);
  const images={};
  let sceneIndex=0,sceneSerial=0,sceneSeed=CONFIG.seed;
  let ready=false,disposed=false,paused=false,failed=false,raf=0,clock=0;
  let lastTick=null,lastPaint=-Infinity,renderedFrames=0,renderMs=0;
  let camera=view(W,H,W,H),stage=stageView(W,H,W,H,CONFIG.minStageVisibleHeight);
  let reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');

  // Work at 1/3 resolution only for the animated plume; do not resample the rocket.
  const flame=makeCanvas(FW,FH),fc=flame.getContext('2d');
  const fireFrame=fc.createImageData(FW,FH),firePixels=new Uint32Array(fireFrame.data.buffer);
  let sourcePixels,sourceInterior,lastFire=-Infinity;
  const flowX=new Float32Array(GX*GY),flowY=new Float32Array(GX*GY);
  const xMap=new Uint16Array(FW),xWeight=new Float32Array(FW);
  const yMap=new Uint16Array(FH),yWeight=new Float32Array(FH);
  for(let x=0;x<FW;x++){
    const g=x/(FW-1)*(GX-1);xMap[x]=Math.min(GX-2,Math.floor(g));xWeight[x]=g-xMap[x];
  }
  for(let y=0;y<FH;y++){
    const g=y/(FH-1)*(GY-1);yMap[y]=Math.min(GY-2,Math.floor(g));yWeight[y]=g-yMap[y];
  }



  function resize(){
    if(disposed)return;
    const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
    const dpr=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(CONFIG.maxCanvasPixels/(w*h)));
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
    camera=view(canvas.width,canvas.height,W,H);
    stage=stageView(canvas.width,canvas.height,W,H,CONFIG.minStageVisibleHeight);
    if(ready)render(clock,true);
  }

  function renderExhaust(t){
    const strength=CONFIG.exhaust*(reducedMotion?.3:1);
    // Pin the entire injection zone, then gradually open the field downstream.
    // Curl displacements keep neighboring contours related instead of independently jittering.
    for(let gy=0;gy<GY;gy++){
      const y=gy/(GY-1)*(FH-1), downstream=y/(FH-1);
      const pin=smooth(2,19,y)*(.53+.47*smooth(20,FH,y));
      const width=8+y*.46;
      const wave=3.3*Math.sin(y*.074-t*2.75)+1.0*Math.sin(y*.123-t*4.3+.7);
      for(let gx=0;gx<GX;gx++){
        const x=gx/(GX-1)*(FW-1),side=(x-FW*.5)/width;
        const core=Math.exp(-side*side*.82), direction=Math.tanh(side*.24);
        const u=x*.023-direction*t*.17;
        const v=y*.040-t*(.43+.28*core);
        const e=.13;
        const curlX=(noise(u,v+e)-noise(u,v-e))/(2*e);
        const curlY=-(noise(u+e,v)-noise(u-e,v))/(2*e);
        const small=noise(x*.081+23,y*.112-t*1.8)-.5;
        const i=gy*GX+gx;
        // The fast narrow central flow and slow lateral billows have different phases.
        flowX[i]=strength*pin*(wave*(.40+.60*core)+5.5*curlX+.45*small
          +core*(1.2+1.6*downstream)*Math.sin(y*.14-t*5.3+.8));
        flowY[i]=strength*pin*(4.2*curlY+1.5*Math.sin(x*.032+y*.09-t*2.35)
          +core*2.4*Math.sin(y*.11-t*4.6));
      }
    }
    // Fine clusters preserve the approved contour texture and pinned injection.
    for(let y=0;y<FH;y++){
      const row=y*FW,gRow=yMap[y]*GX,wy=yWeight[y];
      for(let x=0;x<FW;x++){
        const p=gRow+xMap[x],wx=xWeight[x];
        const dx=mix(mix(flowX[p],flowX[p+1],wx),mix(flowX[p+GX],flowX[p+GX+1],wx),wy);
        const dy=mix(mix(flowY[p],flowY[p+1],wx),mix(flowY[p+GX],flowY[p+GX+1],wx),wy);
        const sx=clamp(Math.round(x+dx),0,FW-1),sy=clamp(Math.round(y+dy),0,FH-1);
        let value=sourcePixels[sy*FW+sx];
        // Preserve opaque interiors when a displaced lookup crosses transparency; only the
        // actual silhouette edge is allowed to open and close. This prevents dark pinholes.
        if(sourceInterior[row+x]&&(value>>>24)===0)value=sourcePixels[row+x];
        firePixels[row+x]=value;
      }
    }
    fc.putImageData(fireFrame,0,0);lastFire=t;
  }

  const METEOR_PALETTES=deepFreeze([
    {tail:'#496484',near:'#97cbe3',core:'#e2f2f4'},
    {tail:'#7883a6',near:'#b1b0b2',core:'#f0e8d9'},
    {tail:'#887d91',near:'#b9a99a',core:'#f3dfbd'},
  ]);
  function drawMeteor(t){
    if(reducedMotion)return;
    const e=activeMeteor(t,sceneSeed^0x4d455445,CONFIG.meteor);if(!e)return;
    const opacity=smooth(0,.14,e.u)*(1-smooth(.72,1,e.u))*e.intensity;
    // Both travel directions descend, with the tail aligned behind the head.
    const {tail,slope,x:head,y:hy}=meteorPath(e,camera);
    const palette=METEOR_PALETTES[e.tone];
    const segments=42,segmentWidth=Math.max(2,Math.ceil(tail/segments));
    for(let k=segments;k>=1;k--){
      const f=k/segments,tx=head-e.direction*tail*f,ty=hy-slope*tail*f;
      ctx.globalAlpha=opacity*Math.pow(1-f,1.35)*.92;
      ctx.fillStyle=k<7?palette.near:palette.tail;
      ctx.fillRect(Math.round(tx/2)*2,Math.round(ty/2)*2,segmentWidth,2);
    }
    ctx.globalAlpha=opacity*.14;ctx.fillStyle=palette.near;
    ctx.fillRect(Math.round(head)-2,Math.round(hy)-1,6,4);
    ctx.globalAlpha=opacity;ctx.fillStyle=palette.core;
    ctx.fillRect(Math.round(head),Math.round(hy),4,2);
    ctx.globalAlpha=1;
  }

  function drawBottomSafeStage(t){
    ctx.setTransform(stage.scale,0,0,stage.scale,stage.x,stage.y);
    const overscan=24;
    const expandedWidth=Math.max(W,stage.width+80);
    ctx.globalAlpha=1;
    // Keep the first plume row registered to the nozzle. Lower rows spread
    // beyond both viewport sides, while the source's final row stays below it.
    const rowHeight=(H-FIRE_TOP+overscan)/FH;
    for(let row=0;row<FH;row++){
      const spread=smooth(0,.18,row/FH);
      const width=W+(expandedWidth-W)*spread;
      ctx.drawImage(flame,0,row,FW,1,(W-width)/2,FIRE_TOP+row*rowHeight,width,rowHeight+0.4);
    }
    // One plate keeps the rocket and the pinned nozzle overlap in register.
    ctx.drawImage(images.foreground,0,0,W,FIRE_TOP+14,0,0,W,FIRE_TOP+14);
  }

  function render(t,force=false){
    if(!ready||disposed)return;
    const start=performance.now();
    if(force||t-lastFire>=1/60-.002||t<lastFire)renderExhaust(t);
    window.AscentSky.draw(ctx,canvas.width,canvas.height,t,CONFIG);
    ctx.setTransform(camera.scale,0,0,camera.scale,camera.x,camera.y);
    ctx.imageSmoothingEnabled=false;
    drawMeteor(t);
    drawBottomSafeStage(t);
    renderedFrames++;renderMs=performance.now()-start;
  }

  function stopLoop(){if(raf)cancelAnimationFrame(raf);raf=0;lastTick=null;}
  function startLoop(){if(!raf&&!disposed&&!paused&&!document.hidden&&ready)raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=0;if(disposed||paused||document.hidden||!ready)return;
    const dt=lastTick===null?0:Math.min((now-lastTick)/1000,.1);lastTick=now;
    clock+=dt*(reducedMotion?.18:1);
    const target=reducedMotion?24:CONFIG.maxFrameRate;
    if(now-lastPaint>=1000/target-.8){render(clock);lastPaint=now;}
    raf=requestAnimationFrame(tick);
  }
  function onVisibility(){if(document.hidden)stopLoop();else startLoop();}
  function onMotion(e){reducedMotion=e.matches;lastFire=-Infinity;if(ready)render(clock,true);}
  function onPageHide(){stopLoop();}
  function onPageShow(){startLoop();}
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pagehide',onPageHide);
  window.addEventListener('pageshow',onPageShow);
  document.addEventListener('visibilitychange',onVisibility);
  motionPreference.addEventListener('change',onMotion);
  const loadImage=uri=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Quiet Ascent artwork could not be decoded.'));im.src=uri;});
  const initialization=Promise.all([
    loadImage('./assets/foreground/foreground-v2.png'),window.AscentSky.ready,
  ]).then(([plate])=>{
    if(disposed)return false;
    // The generated master intentionally uses pure black backing after the image
    // tool failed real-alpha extraction. Composite that backing once at decode.
    const matte=makeCanvas(W,H),mc=matte.getContext('2d',{willReadFrequently:true});
    mc.drawImage(plate,0,0,W,H);
    const rgba=mc.getImageData(0,0,W,H);
    for(let i=0;i<rgba.data.length;i+=4){
      const peak=Math.max(rgba.data[i],rgba.data[i+1],rgba.data[i+2]);
      rgba.data[i+3]=Math.round(255*smooth(4,18,peak));
    }
    mc.putImageData(rgba,0,0);images.foreground=matte;
    const source=makeCanvas(FW,FH),sc=source.getContext('2d',{willReadFrequently:true});
    sc.imageSmoothingEnabled=false;
    sc.drawImage(matte,0,FIRE_TOP,W,H-FIRE_TOP,0,0,FW,FH);
    const graded=sc.getImageData(0,0,FW,FH);
    sourcePixels=new Uint32Array(graded.data.buffer);
    sourceInterior=new Uint8Array(FW*FH);
    for(let y=1;y<FH-1;y++)for(let x=1;x<FW-1;x++){
      const i=y*FW+x,opaque=index=>(sourcePixels[index]>>>24)!==0;
      sourceInterior[i]=opaque(i)&&opaque(i-1)&&opaque(i+1)&&opaque(i-FW)&&opaque(i+FW)?1:0;
    }
    ready=true;resize();render(0,true);startLoop();return true;
  });
  initialization.catch(error=>{failed=true;console.error('[Quiet Ascent]',error);});

  function changeScene(index){
    if(disposed||!ready)return false;
    sceneIndex=mod(index,window.AscentSkyModel.recipes.length);
    sceneSerial++;
    sceneSeed=(CONFIG.seed^Math.imul(sceneSerial,0x45d9f3b))>>>0;
    window.AscentSky.setScene(sceneIndex,sceneSeed,clock);
    render(clock,true);return true;
  }
  // Embedding and deterministic capture API, not an on-screen user interface.
  window.Ascent=Object.freeze({
    ready:initialization,config:CONFIG,optionValues:OPTION_VALUES,
    nextScene(){return changeScene(sceneIndex+1);},
    previousScene(){return changeScene(sceneIndex-1);},
    randomScene(){const r=random(sceneSeed^Math.imul(sceneSerial+1,71));return changeScene(sceneIndex+1+Math.floor(r()*3));},
    pause(){paused=true;stopLoop();},resume(){if(disposed)return;paused=false;startLoop();},
    renderAt(seconds){if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('seconds must be finite and non-negative.');paused=true;stopLoop();clock=seconds;render(clock,true);},
    stats(){return {version:4,ready,failed,paused,disposed,time:clock,frames:renderedFrames,lastRenderMs:renderMs,
      width:canvas.width,height:canvas.height,stars:window.AscentSky.count(CONFIG),
      skyBackground:window.AscentSky.background,skyTint:window.AscentSkyModel.recipe(sceneIndex).hue,starVariation:window.AscentSky.starSummary(),
      reducedMotion,renderer:'Canvas 2D',camera:{...camera},stageCamera:{...stage},
      variants:CONFIG.variants,meteorOptionCount:Object.keys(OPTION_VALUES.meteor).length,
      starOptionCount:Object.keys(OPTION_VALUES.stars).length,skyArtVersion:3,sceneIndex,sceneSerial,sceneSeed,scene:window.AscentSky.stats()};},
    destroy(){if(disposed)return;disposed=true;stopLoop();window.removeEventListener('resize',resize);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('pageshow',onPageShow);document.removeEventListener('visibilitychange',onVisibility);motionPreference.removeEventListener('change',onMotion);},
  });
  resize();
})();
