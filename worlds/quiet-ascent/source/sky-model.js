/* Pure, seeded world-space sky and star traits. No repeating artwork sections. */
((root,factory)=>{
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./math.js'));
  else root.AscentSkyModel=factory(root.AscentMath);
})(typeof globalThis!=='undefined'?globalThis:this,math=>{
  'use strict';
  const {noiseField,random,mix,smooth,mod}=math;
  const starColors=[[144,168,198],[161,172,204],[177,170,202],[190,177,194],[199,189,174]];
  const recipes=Object.freeze([
    Object.freeze({id:'crescent',name:'Blue Crescent',gas:.8,hue:[46,34,82],planet:'crescent',side:1}),
    Object.freeze({id:'rings',name:'Distant Rings',gas:.35,hue:[31,49,65],planet:'rings',side:-1}),
    Object.freeze({id:'milky-way',name:'Violet Passage',gas:1.25,hue:[52,32,77],planet:null,side:-1}),
    Object.freeze({id:'gas',name:'Quiet Veil',gas:.85,hue:[26,52,62],planet:null,side:1}),
  ]);
  function recipe(index=0){return recipes[mod(index,recipes.length)];}
  function createField(seed,index=0){
    const n=noiseField(seed^0x534b5946),r=recipe(index);
    return (x,y)=>{
      // A broad broken ribbon, not a screen-wide dust texture. World coordinates
      // make both its empty intervals and its contours survive seeks and scrolling.
      const warp=(n(x*.0021+31,y*.0021+17)-.5)*230;
      const band=mod(y-x*.28+warp+720,1900)-950;
      const envelope=Math.exp(-Math.pow(band/135,2));
      const u=(x+y*.43+warp)*.014,v=(y-x*.37+warp*.6)*.014;
      const coarse=n(u+13,v+57)*.50+n(u*2.03+91,v*2.03+11)*.32+n(u*4.07+53,v*4.07+73)*.18;
      const mass=smooth(.32,.74,coarse)*envelope*r.gas;
      const fissure=smooth(.28,.64,n(u*2.7+73,v*2.7+39));
      const openSide=1-smooth(-150,850,x*r.side);
      const cloud=Math.floor(mass*(.46+.54*fissure)*openSide*14)/14;
      const shade=n(x*.001+113,y*.001+71);
      return [6+shade*2,9+shade*2,16+shade*4].map((c,k)=>c+r.hue[k]*cloud*.64);
    };
  }
  const planetSpacing=2400,planetSpeed=8.5;
  function planetDescriptor(seed,index,slot){
    const r=random(cellSeed(seed,slot,index,7)),theme=recipe(index);
    const kind=slot===0?theme.planet:['crescent','rings','rock',null][Math.floor(r()*4)];
    return {id:index+':'+slot,seed:cellSeed(seed,slot,index,11),kind,
      side:slot===0?theme.side:(r()<.5?-1:1),
      radius:kind==='rings'?145+r()*25:235+r()*60,
      y:-slot*planetSpacing+(slot===0?180:120+r()*160),
      edge:.045+r()*.045,tint:Math.floor(r()*3),phase:r()*6.28};
  }
  function visiblePlanets(seed,index,t,width,height){
    const unit=height/920,travel=t*planetSpeed,slot=Math.floor(travel/planetSpacing);
    const result=[];
    for(let i=slot-1;i<=slot+1;i++){
      if(i<0)continue;
      const p=planetDescriptor(seed,index,i);if(!p.kind)continue;
      const radius=p.radius*unit*Math.min(1,width/height/1.15);
      const y=(p.y+travel)*unit;
      if(y+radius< -12||y-radius>height+12)continue;
      result.push({...p,x:p.side>0?width*(1-p.edge):width*p.edge,y,radius,unit});
    }
    return result;
  }
  function createStars(seed,count=250){
    const r=random(seed^0x53544152);
    const clusters=Array.from({length:2},()=>[.18+r()*.64,.18+r()*.64]);
    return Array.from({length:count},(_,i)=>{
      let x=r(),y=r();
      if(r()<.18){
        const [cx,cy]=clusters[Math.floor(r()*clusters.length)];
        x=cx+(r()+r()-1)*.16;y=cy+(r()+r()-1)*.12;
      }
      const depth=r(),sizePick=r(),shapePick=r();
      const scale=sizePick<.62?1:sizePick<.87?2:sizePick<.96?3:4;
      // Most lights remain pinpoints. Only a few larger ones briefly grow rays.
      const shape=scale>=3?'plus':shapePick<.78?'point':shapePick<.93?'plus':'x';
      const glintPeriod=18+r()*16;
      return Object.freeze({x,y,depth,scale,shape,
        alpha:(.28+r()*.36)*(scale>2?.82:1),phase:r()*Math.PI*2,
        frequency:.28+r()*.40,colorPick:r(),warmPick:r(),
        glintPeriod,glintOffset:r()*glintPeriod,glintDuration:2.2+r()*1.2,
        glintSeed:Math.floor(r()*0x100000000)});
    });
  }
  function starColor(star,profile,glint=0){
    const warm=star.warmPick<profile.warmChance;
    const tone=warm?3+star.colorPick:star.colorPick*3;
    const i=Math.min(3,Math.floor(tone)),f=tone-i;
    return `rgb(${starColors[i].map((c,k)=>Math.round(mix(mix(c,starColors[i+1][k],f),[245,243,238][k],Math.min(1,glint*1.1)))).join(',')})`;
  }
  function glintEvent(star,t){
    // One bounded event per variable-position slot, with occasional quiet slots.
    // A seek derives the event directly; no timer queue or accumulated history.
    const slot=Math.floor((t+star.glintOffset)/star.glintPeriod);
    const r=random(star.glintSeed^Math.imul(slot+1,0x45d9f3b));
    if(r()<.35)return null;
    const duration=star.glintDuration*(.85+r()*.3);
    return {at:slot*star.glintPeriod-star.glintOffset+2+r()*(star.glintPeriod-duration-4),duration};
  }
  function starLight(star,t,twinkle,rayEnvelope=1){
    const strength=Math.min(1.5,Math.max(0,twinkle));
    const breath=.5+.5*Math.sin(t*star.frequency+star.phase);
    const event=star.shape==='point'?null:glintEvent(star,t);
    const u=event?(t-event.at)/event.duration:-1;
    const glint=u>0&&u<1?Math.sin(Math.PI*u)**2*strength*rayEnvelope:0;
    return {core:1-.16*strength*(1-breath)+.9*glint,rays:glint};
  }
  const starLayers=Object.freeze([
    Object.freeze({speed:2.6,depth:.15,count:42}),
    Object.freeze({speed:5.8,depth:.58,count:28}),
    Object.freeze({speed:10.1,depth:.91,count:12}),
  ]);
  const starCell=Object.freeze({width:800,height:1120});
  function cellSeed(seed,column,row,layer){
    return seed^Math.imul(column,0x1f123bb5)^Math.imul(row,0x5f356495)^Math.imul(layer+1,0x45d9f3b);
  }
  function starPosition(star,column,row,layer,width,height,t,speed=1){
    const unit=height/920;
    return {x:width/2+(column+star.x)*starCell.width*unit,
      y:((row+star.y)*starCell.height+t*starLayers[layer].speed*speed)*unit};
  }
  return Object.freeze({recipes,recipe,planetSpacing,planetSpeed,planetDescriptor,visiblePlanets,createField,createStars,starColor,starLight,glintEvent,starLayers,starCell,cellSeed,starPosition});
});
