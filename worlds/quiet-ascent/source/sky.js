/* Continuous quiet terrain, with varied stars on the caller's pausable clock. */
(() => {
  'use strict';
  const {smooth,activeMeteor,noiseField}=window.AscentMath;
  const model=window.AscentSkyModel,starCache=new Map(),planetCache=new Map();
  let seed=19690917,sceneIndex=0,sceneStarted=0,field=model.createField(seed),visibleBodies=[];
  let drawnStars=0,drawnShapes={point:0,plus:0,x:0};
  const terrain=document.createElement('canvas'),tc=terrain.getContext('2d',{alpha:false});
  let viewport='',origin=0,cell=0,unit=1,worldLeft=0,band;
  const speed=5.2;
  function writeRows(first,count){
    if(count<=0)return;
    const frame=count===1?band:tc.createImageData(terrain.width,count);
    for(let y=0;y<count;y++)for(let x=0;x<terrain.width;x++){
      const color=field(worldLeft+(x-1)*6,(origin+first+y)*6);
      const offset=(y*terrain.width+x)*4;
      for(let k=0;k<3;k++)frame.data[offset+k]=color[k];
      frame.data[offset+3]=255;
    }
    tc.putImageData(frame,0,first);
  }
  function drawTerrain(ctx,width,height,t,atmosphere){
    unit=height/920;cell=6*unit;
    const travel=t*speed*unit, nextOrigin=Math.floor(-travel/cell)-1;
    const key=`${width}x${height}`;
    if(key!==viewport){
      terrain.width=Math.ceil(width/cell)+3;terrain.height=Math.ceil(height/cell)+3;
      worldLeft=-width/(2*unit);origin=nextOrigin;
      band=tc.createImageData(terrain.width,1);
      writeRows(0,terrain.height);viewport=key;
    }else if(nextOrigin!==origin){
      const delta=nextOrigin-origin;
      if(Math.abs(delta)>=terrain.height){
        origin=nextOrigin;writeRows(0,terrain.height);
      }else{
        tc.globalCompositeOperation='copy';
        tc.drawImage(terrain,0,-delta);
        tc.globalCompositeOperation='source-over';
        origin=nextOrigin;
        if(delta<0)writeRows(0,-delta);
        else writeRows(terrain.height-delta,delta);
      }
    }
    ctx.fillStyle='#0a0e1b';ctx.fillRect(0,0,width,height);
    ctx.globalAlpha=Math.min(1,Math.max(0,atmosphere));
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(terrain,-cell,origin*cell+travel,terrain.width*cell,terrain.height*cell);
    ctx.globalAlpha=1;
  }
  function count(){return drawnStars;}
  function drawStars(ctx,width,height,t,config){
    const unit=height/920,profile=config.stars,used=new Set();
    const {width:cellWidth,height:cellHeight}=model.starCell;
    const worldLeft=-width/(2*unit),worldRight=-worldLeft;
    const meteor=activeMeteor(t,seed^0x4d455445,config.meteor);
    const rayEnvelope=meteor?1-.72*smooth(0,.14,meteor.u)*(1-smooth(.72,1,meteor.u)):1;
    drawnStars=0;drawnShapes={point:0,plus:0,x:0};
    for(let layerIndex=0;layerIndex<model.starLayers.length;layerIndex++){
      const layer=model.starLayers[layerIndex];
      const travel=t*layer.speed*config.starSpeed*profile.speed;
      const population=Math.min(100,Math.max(0,Math.round(layer.count*config.dust*profile.density)));
      for(let column=Math.floor((worldLeft-24)/cellWidth);column<=Math.floor((worldRight+24)/cellWidth);column++){
        for(let row=Math.floor((-24-travel)/cellHeight);row<=Math.floor((944-travel)/cellHeight);row++){
          const key=layerIndex+':'+column+':'+row+':'+population;
          used.add(key);
          if(!starCache.has(key))starCache.set(key,model.createStars(model.cellSeed(seed,column,row,layerIndex),population));
          for(const s of starCache.get(key)){
            const {x,y}=model.starPosition(s,column,row,layerIndex,width,height,t,config.starSpeed*profile.speed);
            if(x< -20*unit||x>width+20*unit||y< -20*unit||y>height+20*unit)continue;
            drawnStars++;drawnShapes[s.shape]++;
            const base=layer.depth<profile.sizeWeights[0]?1:layer.depth<profile.sizeWeights[0]+profile.sizeWeights[1]?2:3;
            const size=Math.max(1,Math.min(2.5*unit,base*unit*Math.sqrt(s.scale)));
            const light=model.starLight(s,t,profile.twinkle*config.twinkle,rayEnvelope);
            // A soft, partial reduction protects the rocket without cutting an empty lane.
            const corridor=.78+.22*smooth(80,210,Math.abs((x-width/2)/unit));
            const rayAlpha=Math.min(.72,(.5+s.alpha*.6)*corridor*profile.brightness*light.rays*1.1);
            const alpha=Math.min(1,Math.max(s.alpha*corridor*profile.brightness*light.core,rayAlpha));
            ctx.fillStyle=model.starColor(s,profile,light.rays);ctx.globalAlpha=alpha;
            // Tiny distant points remain, but larger cores are diamonds rather
            // than enlarged square pixels. Only sparse glints grow long rays.
            ctx.beginPath();
            ctx.moveTo(x,y-size);ctx.lineTo(x+size*.7,y);
            ctx.lineTo(x,y+size);ctx.lineTo(x-size*.7,y);ctx.closePath();ctx.fill();
            if(s.shape!=='point'){
              const quietRay=s.scale>=3?.34:.12;
              const strength=quietRay+light.rays*(1-quietRay);
              const arm=(3.5+s.scale*1.3)*unit*strength;
              ctx.globalAlpha=Math.min(.78,rayAlpha+(s.scale>=3?.28:.07)*corridor*profile.brightness);
              if(s.shape==='plus'){
                ctx.fillRect(x-arm,y-.45*unit,arm*2,.9*unit);
                ctx.fillRect(x-.45*unit,y-arm*1.25,.9*unit,arm*2.5);
              }else{
                const reach=Math.min(4.2*unit,arm*.66);
                for(const sx of [-1,1])for(const sy of [-1,1]){
                  ctx.fillRect(x+sx*reach-.5*unit,y+sy*reach-.5*unit,unit,unit);
                }
                ctx.beginPath();ctx.moveTo(x,y-size*1.3);ctx.lineTo(x+size,y);
                ctx.lineTo(x,y+size*1.3);ctx.lineTo(x-size,y);ctx.closePath();ctx.fill();
              }
              if(light.rays>.12){
                ctx.globalAlpha=light.rays*.055;
                ctx.fillRect(x-arm*1.5,y-unit*.6,arm*3,unit*1.2);
                ctx.fillRect(x-unit*.6,y-arm*1.8,unit*1.2,arm*3.6);
              }
            }
          }
        }
      }
    }
    // Only cells touching the current view remain; seeking and resizing cannot grow history.
    for(const key of starCache.keys())if(!used.has(key))starCache.delete(key);
    ctx.globalAlpha=1;
  }
  function planetArt(p){
    const c=document.createElement('canvas'),rings=p.kind==='rings';
    c.width=rings?480:240;c.height=240;
    const pc=c.getContext('2d'),data=pc.createImageData(c.width,c.height),radius=110;
    const n=noiseField(p.seed),tints=[[61,74,135],[88,60,109],[45,91,112]];
    const tint=tints[p.tint];
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
      const nx=(x-c.width/2)/radius,ny=(y-c.height/2)/radius,rr=nx*nx+ny*ny;
      let color=null;
      if(rr<1){
        const z=Math.sqrt(1-rr);
        const relief=n(nx*6+43,ny*6+87)*.65+n(nx*15+93,ny*15+17)*.35;
        const bands=rings?(.7+.3*Math.sin(ny*23+relief*4)):(.52+.48*relief);
        const diffuse=Math.max(0,-nx*.78-ny*.34-z*(p.kind==='rock'?.36:.66));
        const rim=Math.pow(1-z,4)*Math.max(0,-nx*.88-ny*.35);
        const light=Math.floor((diffuse*bands*.9+rim*.9)*14)/14;
        color=[6,9,17].map((v,k)=>Math.round(v+tint[k]*light));
      }
      if(rings){
        const rx=nx*.955+ny*.296,ry=-nx*.296+ny*.955;
        const ring=Math.sqrt(rx*rx+Math.pow(ry/.30,2));
        if(ring>1.38&&ring<2.13&&(rr>=1||ry>0)){
          const band=.58+.25*Math.sin(ring*35)+.17*n(rx*4+19,ry*4+31);
          const edge=smooth(1.38,1.43,ring)*(1-smooth(2.08,2.13,ring));
          color=[40,44,65].map((v,k)=>Math.round(v*(.55+band*.45)*edge+(k===2?7:3)));
        }
      }
      if(color){const i=(y*c.width+x)*4;data.data.set([...color,255],i);}
    }
    pc.putImageData(data,0,0);return {image:c,radius};
  }
  function drawPlanets(ctx,width,height,t){
    const used=new Set();visibleBodies=model.visiblePlanets(seed,sceneIndex,t,width,height);
    for(const p of visibleBodies){
      const key=p.id+':'+p.seed;used.add(key);
      if(!planetCache.has(key))planetCache.set(key,planetArt(p));
      const art=planetCache.get(key),scale=p.radius/art.radius;
      ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
      ctx.drawImage(art.image,p.x-art.image.width*scale/2,p.y-art.image.height*scale/2,art.image.width*scale,art.image.height*scale);
    }
    for(const key of planetCache.keys())if(!used.has(key))planetCache.delete(key);
  }
  function setScene(index,nextSeed,at=0){
    sceneStarted=at;
    sceneIndex=((index%model.recipes.length)+model.recipes.length)%model.recipes.length;
    seed=nextSeed>>>0;field=model.createField(seed,sceneIndex);
    starCache.clear();planetCache.clear();viewport='';
  }
  function draw(ctx,width,height,t,config){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    drawTerrain(ctx,width,height,t-sceneStarted,config.atmosphere);
    drawStars(ctx,width,height,t,config);
    drawPlanets(ctx,width,height,t-sceneStarted);
    ctx.restore();
  }
  window.AscentSky=Object.freeze({ready:Promise.resolve(),draw,count,setScene,
    background:'downward-procedural-space',
    starSummary:()=>({cachedCells:starCache.size,scale:[1,4],shapes:{...drawnShapes}}),
    stats:()=>({recipe:model.recipe(sceneIndex).id,seed,direction:'down',planetCache:planetCache.size,planets:visibleBodies.map(({id,kind,x,y,radius})=>({id,kind,x,y,radius}))})});
})();
