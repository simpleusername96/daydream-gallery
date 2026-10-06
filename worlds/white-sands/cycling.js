// Fine indexed art with aperiodic wind, attached foliage, wind-blown sand and a slow day cycle.
import {PALETTE, ids, daylight} from './daylight.js';
export {PALETTE, daylight};
export {DAY_SECONDS} from './daylight.js';
export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;
export const POSE_FPS = 30;
const TAU = Math.PI * 2;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const skyAt = v => ids.sky[Math.round(clamp(v/.56)*(ids.sky.length-1))];

function nearest(r,g,b, choices) {
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

const random=(seed,n)=>{let x=(seed^Math.imul(n+1,0x9e3779b9))>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296;};
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
// Smooth value noise along one axis: movement that never repeats on a fixed period.
const drift=(x,salt)=>{const i=Math.floor(x),a=random(salt,i);return a+(random(salt,i+1)-a)*smooth(x-i);};

// Wind is a light wandering breeze that sometimes dies away completely, plus seeded
// gusts of variable length and spacing. Both ramp; neither recurs on a cycle.
let found={seed:-1,event:0,start:.3,from:0};
export function weather(time,seed=1) {
  time=Math.max(0,time);seed>>>=0;
  if(found.seed!==seed||time<found.from)found={seed,event:0,start:.3,from:0};
  let {event,start,from}=found;
  for(;;event++) {
    const duration=8+random(seed,event*5)*6,finish=start+duration;
    if(time<finish) {
      found={seed,event,start,from};
      const elapsed=Math.max(0,time-start),strength=.7+.3*random(seed,event*5+3);
      const gust=time<start?0:smooth(elapsed/(2+random(seed,event*5+2)))*smooth((finish-time)/3)*strength;
      const breeze=.3*smooth((.6*drift(time/6.5,seed^0x51ed27)+.4*drift(time/2.3,seed^0x9e3719)-.34)/.4);
      return {wind:1-(1-gust)*(1-breeze),gust,breeze,event,start,elapsed,duration,strength,
        phase:random(seed,event*5+1)*TAU,direction:-1};
    }
    from=finish;start=finish+4+random(seed,event*5+4)*8;
  }
}

// The wind arrives from the right: everything to the left answers a little later.
const HISTORY=40,STEP=.1,CROSSING=2.6;
// Slip-face crest of the near dune, in logical pixels (y, x).
const CREST=[[276,306],[284,314],[292,324],[300,331],[308,338],[316,347],[324,362],[332,379],[340,392],[348,410],[356,422],[364,435],[372,444],[380,450],[388,452],[396,449],[404,443],[414,434],[424,423],[436,408],[448,392],[460,374],[472,355],[484,336],[496,315],[508,294],[520,272],[532,250],[540,236]];
const crestAt=y=>{
  if(y<=CREST[0][0])return CREST[0][1];
  for(let i=1;i<CREST.length;i++)if(y<=CREST[i][0]){
    const [y0,x0]=CREST[i-1],[y1,x1]=CREST[i];return x0+(x1-x0)*(y-y0)/(y1-y0);
  }
  return CREST.at(-1)[1];
};
// Far skyline summits that shed a little spindrift: [x, spread].
const SUMMITS=[[128,46],[690,38],[884,48]];

/** Index the artwork by material and animate only what wind, sand and light can move. */
export function createCyclingScene(source,width,height) {
  if(source.length!==width*height*4)throw new Error('Invalid source dimensions');
  const base=new Uint8Array(width*height),wood=new Uint8Array(base.length),ground=new Uint8Array(base.length),open=new Uint8Array(base.length);
  const leafMap=new Int16Array(base.length).fill(-1),shadow=[];
  const unit=width/LOGICAL_WIDTH;
  let leafCount=0,groundCount=0,woodCount=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const p=y*width+x,i=p*4,[r,g,b]=source.subarray(i,i+3),u=(x+.5)/width,v=(y+.5)/height;
    const inTree=u>.24&&u<.49&&v>.195&&v<.55;
    // Warm brown branch highlights must never be enrolled as moving foliage.
    const leaf=inTree&&g-b>12&&g>r*.90&&r>30&&b<200;
    const blue=b>r*1.45&&b>g*1.12&&g>r*1.35,red=r>g*1.8&&r>b*1.7;
    // Only the fruit is red: its pale highlight belongs to it, and reddish bark stays bark.
    const apple=inTree&&u>.43&&u<.47&&v>.34&&v<.40&&(red||(!blue&&!leaf&&r>150));
    const bark=inTree&&!leaf&&!apple&&(red||(r>b*.9&&b<165&&g<180));
    const sky=(!leaf&&!apple&&!bark&&inTree&&v<.445)||blue;
    const material=leaf?'leaf':apple?'apple':bark?'bark':sky?'sky':'dune';
    const id=sky?skyAt(v):nearest(r,g,b,ids[material]);base[p]=id;
    if(sky)open[p]=1;
    if(bark||apple){wood[p]=1;woodCount++;}
    if(leaf&&v<.445){leafMap[p]=id;leafCount++;}
    if(material==='dune') {
      ground[p]=1;groundCount++;
      const along=(u-.385)/.18;
      if(along>0&&along<1&&v>.521+along*.046&&v<.548+along*.06&&b-r>15&&r<205)
        shadow.push(p);
    }
  }

  // Blended edge pixels where sand meets sky were indexed as deep shade. They pass
  // unnoticed in daylight but turn into a dark outline once the palette shifts, so
  // each takes the tone of the sand just beneath it, or joins the sky if none is there.
  const tone=p=>base[p]-ids.dune[0],below=Math.max(1,Math.round(3*unit));
  for(let pass=0;pass<2;pass++) {
    const fixes=[];
    for(let y=1;y<height-below;y++)for(let x=1;x<width-1;x++) {
      const p=y*width+x;
      if(!ground[p]||!(open[p-width]||open[p-1]||open[p+1]))continue;
      const q=p+below*width;
      if(!ground[q])fixes.push([p,-1]);
      else if(tone(q)-tone(p)>=4)fixes.push([p,base[q]]);
    }
    for(const [p,id] of fixes) {
      if(id>=0){base[p]=id;continue;}
      base[p]=skyAt((Math.floor(p/width)+.5)/height);ground[p]=0;open[p]=1;groundCount--;
    }
  }

  // The same blend inside the trunk's outline belongs to the bark.
  for(let pass=0;pass<3;pass++)for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++) {
    const p=y*width+x,around=wood[p-1]+wood[p+1]+wood[p-width]+wood[p+width];
    if(!ground[p]||around<2||(around<3&&tone(p)>=16))continue;
    base[p]=nearest(source[p*4],source[p*4+1],source[p*4+2],ids.bark);ground[p]=0;wood[p]=1;groundCount--;woodCount++;
  }

  // Every leaf stays rooted where it meets wood. Its pixels are lifted into a canopy
  // layer and bent by their distance from the nearest twig: nothing moves at the
  // attachment, tips travel furthest, and no leaf can drift away from its branch.
  let minX=width,maxX=-1,minY=height,maxY=-1;
  for(let p=0;p<base.length;p++)if(leafMap[p]>=0){
    const x=p%width,y=Math.floor(p/width);
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  const pad=Math.ceil(12*unit),hasLeaves=maxX>=0;
  const cx0=hasLeaves?Math.max(0,minX-pad):0,cy0=hasLeaves?Math.max(0,minY-pad):0;
  const cw=hasLeaves?Math.min(width-1,maxX+pad)-cx0+1:0,ch=hasLeaves?Math.min(height-1,maxY+pad)-cy0+1:0;
  const canopy=new Int16Array(cw*ch).fill(-1),bend=new Float32Array(cw*ch);
  // Chamfer distance to wood, in logical pixels.
  const far=1e6,distance=new Float32Array(cw*ch).fill(far);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(wood[(y+cy0)*width+x+cx0])distance[y*cw+x]=0;
  const relax=(i,x,y,dx,dy,cost)=>{const xx=x+dx,yy=y+dy;if(xx>=0&&xx<cw&&yy>=0&&yy<ch)distance[i]=Math.min(distance[i],distance[yy*cw+xx]+cost);};
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=y*cw+x;relax(i,x,y,-1,0,1);relax(i,x,y,0,-1,1);relax(i,x,y,-1,-1,1.41);relax(i,x,y,1,-1,1.41);}
  for(let y=ch-1;y>=0;y--)for(let x=cw-1;x>=0;x--){const i=y*cw+x;relax(i,x,y,1,0,1);relax(i,x,y,0,1,1);relax(i,x,y,1,1,1.41);relax(i,x,y,-1,1,1.41);}
  let movingLeaves=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++) {
    const i=y*cw+x,p=(y+cy0)*width+x+cx0,d=distance[i]/unit;
    // Flecks with no twig within reach stay part of the still art.
    bend[i]=d<=9?d:Math.max(0,9-(d-9)*2.2);
    if(leafMap[p]<0)continue;
    canopy[i]=leafMap[p];base[p]=skyAt((p/width|0)/height+.5/height);open[p]=1;
    if(bend[i]>0)movingLeaves++;
  }
  // Coarse wind lattice over the crown: neighbors differ in timing but join smoothly.
  const CELL=Math.max(2,Math.round(15*unit)),gw=Math.ceil(cw/CELL)+2,gh=Math.ceil(ch/CELL)+2;
  const pushX=new Float32Array(gw*gh),pushY=new Float32Array(gw*gh);
  // Extend the authored shadow mask with a feathered sampling border. The original
  // sand remains underneath: inverse sampling never punches white backing holes.
  const reach=Math.max(2,Math.ceil(8*unit));
  const shadowDistance=new Uint8Array(base.length).fill(255),shadowArea=shadow.filter(p=>ground[p]);
  for(const p of shadowArea)shadowDistance[p]=0;
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

  // Sand moves where real dunes show it. Each region is a fixed mask with its own
  // flow coordinates; one smooth field is carried through them, so the motion is a
  // connected veil shaped by the terrain, never a set of separate specks.
  const region=()=>({p:[],weight:[],along:[],across:[]});
  const plume=region(),streamers=region(),spindrift=region(),plumeReach=[];
  const push=(r,p,weight,along,across)=>{r.p.push(p);r.weight.push(weight);r.along.push(along);r.across.push(across);};
  const skyline=new Int32Array(width).fill(-1);
  for(let x=0;x<width;x++)for(let y=1;y<height;y++)if(ground[y*width+x]){if(open[(y-1)*width+x])skyline[x]=y;break;}
  // Streamers run over the sunlit windward face in ground-plane perspective, crossing its ripples.
  const windX=-.94,windZ=.34;
  // Follow the painted edge of the slip face on each row, so the plume starts exactly
  // where shade meets light and leaves no untouched sliver along the crest.
  const edge=new Float32Array(height);
  for(let y=0;y<height;y++) {
    const guide=crestAt(y/unit);edge[y]=guide;
    for(let lx=guide+12;lx>=guide-12;lx--) {
      const x=Math.round(lx*unit);if(x<0||x>=width)continue;
      const p=y*width+x;
      if(ground[p]&&tone(p)<16){edge[y]=x/unit+1;break;}
    }
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const p=y*width+x,lx=x/unit,ly=y/unit;
    if(ground[p]&&ly>=CREST[0][0]-2) {
      const d=edge[y]-lx;
      // 1. Sand leaving the crest hangs over the shaded slip face and thins as it falls.
      if(d>=0&&ly>=CREST[0][0]) {
        const scale=.75+(ly-276)/264*.6,span=96*scale;
        if(d<span) {
          const weight=(1-d/span)**1.4*smooth((ly-278)/12)*(1-.65*smooth((ly-452)/70));
          // Flow lines fall away down the slip face; `reach` thins the veil into tapering tongues.
          if(weight>.004){push(plume,p,weight,d/(48*scale),(ly-d*.34)/11);plumeReach.push(d/span);}
        }
      }
      const top=281+(lx-339)*.19;
      if(d<-3&&ly>top+8) {
        const h=ly-top+26,X=(lx-520)*200/h,Z=40000/h;
        const weight=smooth((ly-top-8)/24)*smooth((-d-3)/7)*Math.min(1,shadowDistance[p]/reach);
        if(weight>.004)push(streamers,p,weight,(X*windX+Z*windZ)/150,(X*windZ-Z*windX)/24);
      }
    }
    // 2. A thin drift lifts off the far summits against the sky.
    if(open[p]&&skyline[x]>y) {
      const h=(skyline[x]-y)/unit;
      if(h<=16) {
        const near=SUMMITS.reduce((sum,[sx,spread])=>sum+Math.exp(-(((lx-sx)/spread)**2)),0);
        const weight=Math.min(1,near)*Math.exp(-h/4.5);
        if(weight>.01)push(spindrift,p,weight,(lx+h*2.4)/34,h/5+lx*.012);
      }
    }
  }
  for(const r of [plume,streamers,spindrift]) {
    r.p=Int32Array.from(r.p);r.weight=Float32Array.from(r.weight);r.along=Float32Array.from(r.along);r.across=Float32Array.from(r.across);
  }
  // Smooth correlated density, baked once and wrapped in both directions.
  const FIELD=256,field=new Float32Array(FIELD*FIELD);
  const lattice=(x,y,scale,salt)=>{
    x/=scale;y/=scale;const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy),cells=FIELD/scale;
    const value=(xx,yy)=>random(salt,((xx%cells+cells)%cells)+((yy%cells+cells)%cells)*cells);
    return (value(ix,iy)*(1-fx)+value(ix+1,iy)*fx)*(1-fy)+(value(ix,iy+1)*(1-fx)+value(ix+1,iy+1)*fx)*fy;
  };
  for(let y=0;y<FIELD;y++)for(let x=0;x<FIELD;x++)
    field[y*FIELD+x]=.6*lattice(x,y,16,817)+.28*lattice(x,y,8,139)+.12*lattice(x,y,4,523);
  const densityAt=(u,v)=>{
    u*=16;v*=16;const ix=Math.floor(u),iy=Math.floor(v);let fx=u-ix,fy=v-iy;
    // Eased weights: plain bilinear creases show up as hairlines once the field is stretched.
    fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
    const x0=ix&255,y0=(iy&255)<<8,x1=(ix+1)&255,y1=((iy+1)&255)<<8;
    return (field[y0+x0]*(1-fx)+field[y0+x1]*fx)*(1-fy)+(field[y1+x0]*(1-fx)+field[y1+x1]*fx)*fy;
  };

  // Fixed stars, visible only through open sky.
  const stars=[];
  for(let n=0;n<340;n++) {
    const x=Math.floor(random(733,n*4)*width),v=random(733,n*4+1)**1.35*.5,y=Math.floor(v*height),p=y*width+x;
    if(!open[p]||leafMap[p]>=0)continue;
    const glow=random(733,n*4+2)**3,warm=random(733,n*4+3);
    stars.push({p,x,y,glow:.3+.7*glow,rate:.5+random(911,n)*2.2,phase:random(912,n)*TAU,
      color:warm<.2?[255,226,196]:warm>.75?[200,220,255]:[240,244,255]});
  }

  const pixels=new Uint8ClampedArray(source.length),packed=new Uint32Array(pixels.buffer);
  const paletteBytes=new Uint8ClampedArray(PALETTE.length*4).fill(255),palettePacked=new Uint32Array(paletteBytes.buffer);
  const colors=new Float32Array(PALETTE.length*3);
  const opaque=source.every((value,i)=>i%4!==3||value===255);
  const history=new Float32Array(HISTORY+1),column=new Float32Array(width),force=new Float32Array(width);
  const windAt=delay=>{const at=clamp(delay/STEP,0,HISTORY-.001),i=Math.floor(at);return history[i]+(history[i+1]-history[i])*(at-i);};
  const lit=ids.dune[30]*4,dot=Math.max(1,Math.round(unit));
  const veil=(i,alpha,at)=>{
    pixels[i]+=(paletteBytes[at]-pixels[i])*alpha;pixels[i+1]+=(paletteBytes[at+1]-pixels[i+1])*alpha;pixels[i+2]+=(paletteBytes[at+2]-pixels[i+2])*alpha;
  };
  const glow=(x,y,color,amount)=>{
    if(x<0||x>=width||y<0||y>=height||!open[y*width+x])return;
    const i=(y*width+x)*4;pixels[i]+=color[0]*amount;pixels[i+1]+=color[1]*amount;pixels[i+2]+=color[2]*amount;
  };
  return Object.freeze({width,height,pixels,
    stats:Object.freeze({palette:PALETTE.length,leaves:{pixels:leafCount,colors:ids.leaf.length},
      movingLeaves:{pixels:movingLeaves},
      fixedWood:{pixels:woodCount},shadow:{pixels:shadow.length,moving:shadowArea.length},
      sand:{pixels:plume.p.length+streamers.p.length+spindrift.p.length,plume:plume.p.length,streamers:streamers.p.length,spindrift:spindrift.p.length},
      stars:stars.length,light:{pixels:groundCount}}),
    render(time,seed=1) {
      const light=daylight(time,colors);
      for(let i=0;i<PALETTE.length;i++){paletteBytes[i*4]=colors[i*3];paletteBytes[i*4+1]=colors[i*3+1];paletteBytes[i*4+2]=colors[i*3+2];}
      for(let p=0;p<base.length;p++)packed[p]=palettePacked[base[p]];
      // Oldest first, so the incremental gust search only ever walks forward.
      let moving=0;
      for(let k=HISTORY;k>=0;k--){history[k]=weather(time-k*STEP,seed).wind;moving=Math.max(moving,history[k]);}

      if(light.stars>.01) {
        for(const s of stars) {
          const amount=light.stars*s.glow*(.7+.3*Math.sin(time*s.rate+s.phase));
          glow(s.x,s.y,s.color,amount);
          if(s.glow>.8)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])glow(s.x+dx*dot,s.y+dy*dot,s.color,amount*.22);
        }
        // An occasional meteor: a short fading stroke, never a recurring fixture.
        const slot=Math.floor(time/23),age=time-slot*23-random(seed^0x5bd1e9,slot*3)*20;
        if(random(seed^0x5bd1e9,slot*3+1)<.5&&age>0&&age<.75) {
          const x0=(.15+.7*random(seed^0x5bd1e9,slot*3+2))*width,y0=(.04+.14*random(seed^0x5bd1e9,slot*3+1))*height;
          for(let n=0;n<26;n++) {
            const back=age-n*.006;if(back<0)break;
            glow(Math.round(x0-back*250*unit),Math.round(y0+back*120*unit),[235,240,255],light.stars*(1-n/26)*(1-age/.75)*.9);
          }
        }
      }
      if(light.moonlight>.01) {
        const mx=light.moon.x*unit,my=light.moon.y*unit,radius=8.5*unit,halo=radius*3.4;
        for(let y=Math.max(0,Math.floor(my-halo));y<=Math.min(height-1,Math.ceil(my+halo));y++)
          for(let x=Math.max(0,Math.floor(mx-halo));x<=Math.min(width-1,Math.ceil(mx+halo));x++) {
            const p=y*width+x;if(!open[p])continue;
            const d=Math.sqrt((x+.5-mx)**2+(y+.5-my)**2),disc=clamp(radius-d+.5),i=p*4;
            const aura=Math.exp(-((d/radius)**2)/3.2)*.3*light.moonlight;
            pixels[i]+=70*aura;pixels[i+1]+=84*aura;pixels[i+2]+=120*aura;
            if(disc<=0)continue;
            // Soft maria keep the disc from reading as a flat dot.
            const mare=smooth((densityAt((x-mx)/radius*.34+3.1,(y-my)/radius*.34+1.7)-.5)/.16),tone=1-.13*mare,alpha=disc*light.moonlight;
            pixels[i]+=(238*tone-pixels[i])*alpha;pixels[i+1]+=(240*tone-pixels[i+1])*alpha;pixels[i+2]+=(246*tone-pixels[i+2])*alpha;
          }
      }

      if(moving>0) {
        // Loose sand needs a real gust; the light breeze only stirs the leaves.
        for(let x=0;x<width;x++){column[x]=windAt((1-x/width)*CROSSING);force[x]=smooth((column[x]-.36)/.4);}
        if(moving>.36) {
          for(let n=0;n<plume.p.length;n++) {
            const p=plume.p[n],push=force[p%width];if(push<=0)continue;
            // Two drifting layers and a slow sideways wander keep the veil billowing rather than ruled.
            const along=plume.along[n]-time*2.4,across=plume.across[n]+time*.09;
            const wander=(densityAt(along*.4+7.3,across*.2+time*.05)-.5)*1.6;
            const density=.6*densityAt(along,across+wander)+.4*densityAt(along*1.8-time*.7,across*.6+3.7);
            const folds=smooth((density-.35-.2*plumeReach[n])/.3);
            if(folds>0)veil(p*4,plume.weight[n]*folds*push*.85,lit);
          }
          for(let n=0;n<streamers.p.length;n++) {
            const p=streamers.p[n],push=force[p%width];if(push<=0)continue;
            const density=densityAt(streamers.along[n]-time*.85,streamers.across[n]);if(density<.46)continue;
            const sheet=smooth((density-.46)/.3),amount=streamers.weight[n]*push,i=p*4;
            // A lifted sheet washes out the ripple shading beneath it.
            if(sheet>0)veil(i,amount*sheet*.62,lit);
          }
          for(let n=0;n<spindrift.p.length;n++) {
            const p=spindrift.p[n],push=force[p%width];if(push<=0)continue;
            const wisps=smooth((densityAt(spindrift.along[n]+time*1.5,spindrift.across[n])-.42)/.3);
            if(wisps>0)veil(p*4,spindrift.weight[n]*wisps*push*.55,lit);
          }
        }
        for(const p of shadowArea) {
          const x=p%width,y=Math.floor(p/width),f=shadowWeight[p],at=x/unit;
          const turn=column[x]*f*(.72+.28*(drift(time*.8+at*.05,71)*2-1)+.3*(drift(time*4.6+at*.11,72)*2-1));
          const sx=clamp(x+turn*3.5*unit,0,width-1),sy=clamp(y+turn*1.2*unit,0,height-1);
          const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,i=p*4;
          let r=0,g=0,b=0;
          for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
            const q=Math.min(iy+yy,height-1)*width+Math.min(ix+xx,width-1),id=ground[q]?base[q]:base[p],at=id*4,weight=(xx?fx:1-fx)*(yy?fy:1-fy);
            r+=paletteBytes[at]*weight;g+=paletteBytes[at+1]*weight;b+=paletteBytes[at+2]*weight;
          }
          pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;
        }
      }

      let bending=false;
      if(moving>0)for(let j=0;j<gh;j++)for(let i=0;i<gw;i++) {
        const n=j*gw+i,wind=windAt((1-(cx0+i*CELL)/width)*CROSSING);
        if(wind<=0){pushX[n]=pushY[n]=0;continue;}
        // A held lean downwind, a slow sway on top, and a quicker flutter that grows with the wind.
        const sway=drift(time*.8+n*7.31,977+n)*2-1,lift=drift(time*.7+n*3.17,1877+n)*2-1;
        const flutter=drift(time*4.4+n*1.9,2777+n)*2-1,shiver=drift(time*8.6+n*5.3,3677+n)*2-1;
        pushX[n]=-wind*(.68+.24*sway+.26*flutter+.14*wind*shiver)*.82;
        pushY[n]=wind*(.2*lift+.24*drift(time*4.9+n*2.3,4577+n)*2-.24+.1*wind)*.82;
        bending=true;
      }
      for(let y=0;y<ch;y++) {
        const gy=y/CELL,j=Math.floor(gy),ty=gy-j,row=(y+cy0)*width+cx0;
        for(let x=0;x<cw;x++) {
          const n=y*cw+x,p=row+x;if(wood[p])continue;
          const reach=bending?bend[n]:0;
          if(reach<=0) {
            const id=canopy[n];if(id<0)continue;
            packed[p]=palettePacked[id];continue;
          }
          const gx=x/CELL,i=Math.floor(gx),tx=gx-i,k=j*gw+i;
          const dx=((pushX[k]*(1-tx)+pushX[k+1]*tx)*(1-ty)+(pushX[k+gw]*(1-tx)+pushX[k+gw+1]*tx)*ty)*reach*unit;
          const dy=((pushY[k]*(1-tx)+pushY[k+1]*tx)*(1-ty)+(pushY[k+gw]*(1-tx)+pushY[k+gw+1]*tx)*ty)*reach*unit;
          const sx=x-dx,sy=y-dy,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
          let a=0,r=0,g=0,b=0;
          // Subpixel coverage at the logical grid avoids one-pixel popping.
          for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++) {
            const qx=ix+xx,qy=iy+yy;if(qx<0||qx>=cw||qy<0||qy>=ch)continue;
            const id=canopy[qy*cw+qx];if(id<0)continue;
            const weight=(xx?fx:1-fx)*(yy?fy:1-fy),at=id*4;
            a+=weight;r+=paletteBytes[at]*weight;g+=paletteBytes[at+1]*weight;b+=paletteBytes[at+2]*weight;
          }
          if(a<.001)continue;
          // Bent leaves show a little more of their lighter face.
          const sheen=Math.min(1,Math.abs(dx)/(5*unit))*20*light.sheen*a;
          const q=p*4;
          pixels[q]=r+sheen+pixels[q]*(1-a);pixels[q+1]=g+sheen*.85+pixels[q+1]*(1-a);pixels[q+2]=b+sheen*.4+pixels[q+2]*(1-a);
        }
      }

      if(!opaque)for(let i=3;i<pixels.length;i+=4)pixels[i]=source[i];
      return pixels;
    }
  });
}
