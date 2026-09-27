// Fine indexed art with intermittent wind, attached foliage and surface sand transport.
export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;
export const POSE_FPS = 30;
const TAU = Math.PI * 2;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const anchors = {
  sky: [[13,81,192],[18,108,222],[29,133,237],[47,152,243],[69,169,246],[96,189,248]],
  leaf: [[57,70,39],[83,99,48],[114,131,57],[149,159,72],[184,187,97],[212,207,128]],
  bark: [[57,40,32],[86,57,38],[118,81,49],[154,112,65],[185,143,91]],
  apple: [[154,29,28],[202,35,28],[238,53,33],[255,139,98]],
  dune: [[105,123,194],[125,142,211],[146,160,222],[168,179,233],[190,197,241],[214,216,242],[234,230,242],[247,242,236],[255,249,238],[255,252,243]],
};
// Fine color ramps retain bark, individual leaves and delicate sand relief.
const counts={sky:128,leaf:14,bark:14,apple:8,dune:36};
const ramps=Object.fromEntries(Object.entries(anchors).map(([name,colors])=>[name,
  Array.from({length:counts[name]},(_,i)=>{
    const at=i/(counts[name]-1)*(colors.length-1),a=Math.floor(at),b=Math.min(a+1,colors.length-1);
    return colors[a].map((value,c)=>Math.round(value+(colors[b][c]-value)*(at-a)));
  })]));
export const PALETTE = Object.freeze(Object.values(ramps).flat().map(c => Object.freeze(c)));
const indexOf = color => PALETTE.indexOf(color);
const ids = Object.fromEntries(Object.entries(ramps).map(([name, colors]) => [name, colors.map(indexOf)]));
const skyAt = v => ids.sky[Math.round(clamp(v/.56)*(ids.sky.length-1))];

function nearest(r,g,b, choices=PALETTE.map((_,i)=>i)) {
  let best=choices[0],distance=Infinity;
  for (const id of choices) {
    const color=PALETTE[id],d=(r-color[0])**2+(g-color[1])**2+(b-color[2])**2;
    if(d<distance){best=id;distance=d;}
  }
  return best;
}

export function framing(width, height, imageWidth, imageHeight) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const visible = width / scale;
  const left = clamp(imageWidth * .366 - visible / 2, 0, imageWidth - visible);
  return {x:-left*scale,y:(height-imageHeight*scale)/2,width:imageWidth*scale,height:imageHeight*scale,scale};
}

// Seeded renewal events: variable gusts separated by genuinely motionless intervals.
const random=(seed,n)=>{let x=(seed^Math.imul(n+1,0x9e3779b9))>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296;};
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function weather(time,seed=1) {
  time=Math.max(0,time);seed>>>=0;
  let start=.3,event=0;
  for(;;event++) {
    const duration=9+random(seed,event*5)*5,finish=start+duration;
    if(time<finish) {
      const elapsed=Math.max(0,time-start),phase=random(seed,event*5+1)*TAU;
      const wind=time<start?0:smooth(elapsed/(2+random(seed,event*5+2)))*smooth((finish-time)/3);
      return {motion:elapsed*.65,wind,sway:wind,phase,light:0,event,elapsed,duration,
        travel:elapsed*(20+random(seed,event*5+3)*12),direction:1};
    }
    start=finish+5+random(seed,event*5+4)*11;
  }
}

// A gust bends a spray, briefly flutters it, then releases it; no idle pendulum.
const leafTurn=(motion,phase)=>.78+.17*Math.sin(motion*1.2+phase)+.05*Math.sin(motion*2.3+phase*1.7);

/** Separate small attached leaf clusters from the entirely stationary tree. */
export function createCyclingScene(source,width,height) {
  if(source.length!==width*height*4)throw new Error('Invalid source dimensions');
  const base=new Uint8Array(width*height),wood=new Uint8Array(base.length),ground=new Uint8Array(base.length);
  const leafMap=new Int16Array(base.length).fill(-1),shadow=[];
  const unit=width/LOGICAL_WIDTH;
  let leafCount=0,groundCount=0,woodCount=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const p=y*width+x,i=p*4,[r,g,b]=source.subarray(i,i+3),u=(x+.5)/width,v=(y+.5)/height;
    const inTree=u>.24&&u<.49&&v>.195&&v<.55;
    // Warm brown branch highlights must never be enrolled as moving foliage.
    const leaf=inTree&&g-b>12&&g>r*.90&&r>30&&b<200;
    const apple=inTree&&r>g*1.8&&r>b*1.7;
    const bark=inTree&&!leaf&&!apple&&r>b*.9&&b<165&&g<180;
    const sky=(!leaf&&!apple&&!bark&&inTree&&v<.445)||(b>r*1.45&&b>g*1.12&&g>r*1.35);
    const material=leaf?'leaf':apple?'apple':bark?'bark':sky?'sky':'dune';
    const id=sky?skyAt(v):nearest(r,g,b,ids[material]);base[p]=id;
    if(bark||apple){wood[p]=1;woodCount++;}
    if(leaf&&v<.445){leafMap[p]=id;leafCount++;}
    if(material==='dune') {
      ground[p]=1;groundCount++;
      const along=(u-.385)/.18;
      if(along>0&&along<1&&v>.521+along*.046&&v<.548+along*.06&&b-r>15&&r<205)
        shadow.push(p);
    }
  }

  // Connected leaves keep their own shape and rotate about a nearby fixed twig.
  // Isolated flecks without a plausible attachment remain part of the still art.
  const seen=new Uint8Array(base.length),clusters=[],groups=new Map();
  const groupSize=Math.max(4,Math.round(24*unit));
  const search=Math.max(3,Math.ceil(24*unit));
  for(let start=0;start<base.length;start++) {
    if(leafMap[start]<0||seen[start])continue;
    const members=[start];seen[start]=1;
    let minX=width,maxX=0,minY=height,maxY=0,cx=0,cy=0;
    for(let n=0;n<members.length;n++) {
      const p=members[n],x=p%width,y=Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);cx+=x;cy+=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const xx=x+dx,yy=y+dy,q=yy*width+xx;
        if(xx>=0&&xx<width&&yy>=0&&yy<height&&!seen[q]&&leafMap[q]>=0){seen[q]=1;members.push(q);}
      }
    }
    // Keep every connected leaf intact, then move nearby leaves as one local spray.
    // Per-speck pivots previously made most foliage change by less than a pixel.
    cx/=members.length;cy/=members.length;
    const key=Math.floor(cx/groupSize)+','+Math.floor(cy/groupSize);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(...members);
  }
  for(const members of groups.values()) {
    if(members.length<3)continue;
    let minX=width,maxX=0,minY=height,maxY=0,cx=0,cy=0;
    for(const p of members) {
      const x=p%width,y=Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);cx+=x;cy+=y;
    }
    cx/=members.length;cy/=members.length;
    // Pin the spray at wood toward the trunk, not inside its own leaf-colored pixels.
    const inwardX=width*.365-cx,inwardY=height*.51-cy,length=Math.hypot(inwardX,inwardY)||1;
    const targetX=cx+inwardX/length*14*unit,targetY=cy+inwardY/length*14*unit;
    let anchorX=cx,anchorY=cy,distance=Infinity;
    for(let y=Math.max(0,Math.floor(cy)-search);y<=Math.min(height-1,Math.ceil(cy)+search);y++)
      for(let x=Math.max(0,Math.floor(cx)-search);x<=Math.min(width-1,Math.ceil(cx)+search);x++) {
        const d=(x-targetX)**2+(y-targetY)**2;
        if(wood[y*width+x]&&d<distance){distance=d;anchorX=x;anchorY=y;}
      }
    if(!Number.isFinite(distance))continue;
    const w=maxX-minX+1,h=maxY-minY+1,texture=new Int16Array(w*h).fill(-1);
    for(const p of members){const x=p%width,y=Math.floor(p/width);texture[(y-minY)*w+x-minX]=leafMap[p];base[p]=skyAt((y+.5)/height);}
    const radius=Math.max(1,...[[minX,minY],[maxX,minY],[minX,maxY],[maxX,maxY]].map(([x,y])=>Math.hypot(x-anchorX,y-anchorY)));
    clusters.push({x:minX,y:minY,w,h,texture,anchorX,anchorY,radius,amount:Math.min(.50,10*unit/radius),phase:cx/width*7+cy/height*4,count:members.length});
  }
  // Extend the authored shadow mask with a feathered sampling border. The original
  // sand remains underneath: inverse sampling never punches white backing holes.
  const reach=Math.max(2,Math.ceil(8*unit));
  const shadowDistance=new Uint8Array(base.length).fill(255),shadowArea=[...shadow];
  for(const p of shadow)shadowDistance[p]=0;
  for(let n=0;n<shadowArea.length;n++) {
    const p=shadowArea[n],x=p%width,y=Math.floor(p/width),d=shadowDistance[p]+1;
    if(d>reach)continue;
    for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
      const q=yy*width+xx;
      if(xx>=0&&xx<width&&yy>=0&&yy<height&&ground[q]&&shadowDistance[q]>d){shadowDistance[q]=d;shadowArea.push(q);}
    }
  }
  const shadowWeight=new Float32Array(base.length);
  for(const p of shadowArea) {
    const f=1-shadowDistance[p]/(reach+1),rootFade=clamp((p%width/width-.395)/.055);
    shadowWeight[p]=f*f*(3-2*f)*rootFade;
  }

  // One low sheet of loose gypsum follows the near dune's shaded slope.
  // Its authored corridor keeps the root, skyline and sunlit ripples untouched.
  // There are no independently drawn specks or straight particle trails.
  const sand=[],sandWeight=new Float32Array(base.length),flowX=new Float32Array(base.length),flowY=new Float32Array(base.length);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const p=y*width+x,u=x/width,v=y/height;
    if(!ground[p]||shadowDistance[p]!==255)continue;
    const along=(u-.025)/.435;
    if(along<=0||along>=1)continue;
    const center=.91-.245*along-.012*Math.sin(along*Math.PI);
    const across=(v-center)/.095;
    const weight=Math.exp(-across*across*3.5)*smooth(along/.15)*smooth((1-along)/.18);
    if(weight>.005){sand.push(p);sandWeight[p]=weight;flowX[p]=along;flowY[p]=across;}
  }
  // Smooth correlated density, baked once. Large moving folds carry the motion;
  // source relief remains sharp underneath instead of being warped like water.
  const fieldWidth=256,fieldHeight=64,field=new Float32Array(fieldWidth*fieldHeight);
  const noise=(x,y,scale,salt)=>{
    x/=scale;y/=scale;const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
    const cols=fieldWidth/scale,rows=fieldHeight/scale;
    const value=(xx,yy)=>random(salt,((xx%cols+cols)%cols)+((yy%rows+rows)%rows)*cols);
    return (value(ix,iy)*(1-fx)+value(ix+1,iy)*fx)*(1-fy)+(value(ix,iy+1)*(1-fx)+value(ix+1,iy+1)*fx)*fy;
  };
  for(let y=0;y<fieldHeight;y++)for(let x=0;x<fieldWidth;x++)
    field[y*fieldWidth+x]=.75*noise(x,y,16,817)+.25*noise(x,y,8,139);
  const densityAt=(x,y)=>{
    x=(x%fieldWidth+fieldWidth)%fieldWidth;y=(y%fieldHeight+fieldHeight)%fieldHeight;
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,xx=(ix+1)%fieldWidth,yy=(iy+1)%fieldHeight;
    return (field[iy*fieldWidth+ix]*(1-fx)+field[iy*fieldWidth+xx]*fx)*(1-fy)+(field[yy*fieldWidth+ix]*(1-fx)+field[yy*fieldWidth+xx]*fx)*fy;
  };
  const pixels=new Uint8ClampedArray(source.length),packed=new Uint32Array(pixels.buffer);
  const paletteBytes=new Uint8ClampedArray(PALETTE.length*4);
  PALETTE.forEach((color,i)=>paletteBytes.set([...color,255],i*4));
  const palettePacked=new Uint32Array(paletteBytes.buffer);
  const opaque=source.every((value,i)=>i%4!==3||value===255);
  const sample=(c,x,y)=>x>=0&&x<c.w&&y>=0&&y<c.h?c.texture[y*c.w+x]:-1;
  return Object.freeze({width,height,pixels,
    stats:Object.freeze({palette:PALETTE.length,leaves:{pixels:leafCount,colors:ids.leaf.length},
      movingLeaves:{pixels:clusters.reduce((sum,c)=>sum+c.count,0),groups:clusters.length},
      fixedWood:{pixels:woodCount},shadow:{pixels:shadow.length,moving:shadowArea.length},sand:{pixels:sand.length},light:{pixels:groundCount}}),
    render(time,seed=1) {
      const w=weather(time,seed);
      for(let p=0;p<base.length;p++)packed[p]=palettePacked[base[p]];
      if(w.wind>0)for(const p of sand) {
        const along=flowX[p],across=flowY[p];
        const density=densityAt(along*105-w.elapsed*9+w.phase*12,across*24+along*14);
        const folds=smooth((density-.22)/.53);
        // The dense center and long feathered edges drift together along the slope.
        const alpha=sandWeight[p]*folds*w.wind*.22,i=p*4;
        for(let c=0;c<3;c++)pixels[i+c]=pixels[i+c]*(1-alpha)+[248,243,235][c]*alpha;
      }
      for(const p of shadowArea) {
        const x=p%width,y=Math.floor(p/width),f=shadowWeight[p];
        const turn=leafTurn(w.motion,w.phase-(x/width*7+1.2))*w.wind*f;
        const sx=clamp(x-turn*3.5*unit,0,width-1),sy=clamp(y-turn*1.2*unit,0,height-1);
        const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,i=p*4;
        let r=0,g=0,b=0;
        for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
          const q=Math.min(iy+yy,height-1)*width+Math.min(ix+xx,width-1),id=ground[q]?base[q]:base[p],at=id*4,weight=(xx?fx:1-fx)*(yy?fy:1-fy);
          r+=paletteBytes[at]*weight;g+=paletteBytes[at+1]*weight;b+=paletteBytes[at+2]*weight;
        }
        pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;
      }
      for(const c of clusters) {
        const turn=leafTurn(w.motion,w.phase-c.phase);
        const angle=turn*w.wind*c.amount;
        // Turning leaves reveal lighter faces only while a gust bends the spray.
        const sheen=turn*w.wind*24;
        const cosine=Math.cos(angle),sine=Math.sin(angle),margin=Math.ceil(c.radius*c.amount)+1;
        for(let y=Math.max(0,c.y-margin);y<Math.min(height,c.y+c.h+margin);y++)
          for(let x=Math.max(0,c.x-margin);x<Math.min(width,c.x+c.w+margin);x++) {
            const p=y*width+x;if(wood[p])continue;
            const dx=x-c.anchorX,dy=y-c.anchorY;
            const sx=cosine*dx+sine*dy+c.anchorX-c.x,sy=-sine*dx+cosine*dy+c.anchorY-c.y;
            const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
            let a=0,r=0,g=0,b=0;
            // Subpixel coverage at the logical grid avoids one-pixel popping.
            for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++) {
              const id=sample(c,ix+xx,iy+yy);if(id<0)continue;
              const weight=(xx?fx:1-fx)*(yy?fy:1-fy),color=PALETTE[id];
              a+=weight;r+=(color[0]+sheen)*weight;g+=(color[1]+sheen*.85)*weight;b+=(color[2]+sheen*.4)*weight;
            }
            if(a<.001)continue;
            const i=p*4;
            pixels[i]=r+pixels[i]*(1-a);pixels[i+1]=g+pixels[i+1]*(1-a);pixels[i+2]=b+pixels[i+2]*(1-a);
          }
      }
      if(!opaque)for(let i=3;i<pixels.length;i+=4)pixels[i]=source[i];
      return pixels;
    }
  });
}
