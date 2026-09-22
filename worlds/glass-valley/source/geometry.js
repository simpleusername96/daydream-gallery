/** Small allocation-conscious geometry utilities. World coordinates are metres. */
const TAU = Math.PI * 2;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const length = v => Math.hypot(v[0],v[1],v[2]);
const normalize = v => {const d=length(v)||1;return v.map(x=>x/d);};
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const add = (a,b) => a.map((x,i)=>x+b[i]);
const scale = (a,s) => a.map(x=>x*s);
function hashSeed(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function hash2(x,z,seed){let h=Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,z,seed){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,tx=fx*fx*(3-2*fx),tz=fz*fz*(3-2*fz);return mix(mix(hash2(ix,iz,seed),hash2(ix+1,iz,seed),tx),mix(hash2(ix,iz+1,seed),hash2(ix+1,iz+1,seed),tx),tz);}
function identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
function transform(x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]);}
function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function lookAt(eye,target){const z=normalize(sub(eye,target)),x=normalize(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);}
function color(hex){const n=parseInt(hex.replace('#',''),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function catmull(points,t){const q=clamp(t,0,1)*(points.length-1),i=Math.floor(q),f=q-i,p0=points[Math.max(0,i-1)],p1=points[i],p2=points[Math.min(points.length-1,i+1)],p3=points[Math.min(points.length-1,i+2)];return[0,1,2].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*f+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*f*f+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*f*f*f));}
const damp=(a,b,rate,dt)=>mix(a,b,1-Math.exp(-rate*dt));
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const dampAngle=(a,b,rate,dt)=>a+angleDelta(a,b)*(1-Math.exp(-rate*dt));
function parseSeed(value){return value!==null&&/^\d{1,10}$/.test(value)&&Number(value)<=4294967295?Number(value)>>>0:hashSeed(value||'jade-and-amber');}
function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);}
function pose(x,y,z,yaw,pitch=0,roll=0){const cx=Math.cos(pitch),sx=Math.sin(pitch),cz=Math.cos(roll),sz=Math.sin(roll);return multiply(transform(x,y,z,yaw),new Float32Array([cz,sz*cx,sz*sx,0,-sz,cz*cx,cz*sx,0,0,-sx,cx,0,0,0,0,1]));}


/** Interleaved mesh: position / normal / colour / uv / material kind, variation. */
class MeshBuilder {
  constructor(){this.vertices=[];this.indices=[];}
  vertex(p,n,c,uv=[0,0],kind=0,variation=0){const i=this.vertices.length/13;this.vertices.push(...p,...n,...c,...uv,kind,variation);return i;}
  tri(a,b,c){this.indices.push(a,b,c);}
  grid(rows,cols,fn){const start=this.vertices.length/13;for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const v=fn(x/cols,y/rows);this.vertex(...v);}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=start+y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;this.tri(a,c,b);this.tri(b,c,d);}}
  build(){return{vertices:new Float32Array(this.vertices),indices:new Uint32Array(this.indices)};}
}
function ellipsoid(b,p,r,c,kind=2,variation=0){b.grid(10,20,(u,v)=>{const a=u*TAU,ph=v*Math.PI,n=[Math.sin(ph)*Math.cos(a),Math.cos(ph),Math.sin(ph)*Math.sin(a)];return[[p[0]+n[0]*r[0],p[1]+n[1]*r[1],p[2]+n[2]*r[2]],normalize([n[0]/r[0],n[1]/r[1],n[2]/r[2]]),c,[u,v],kind,variation];});}
function tube(b,points,radius,c,kind=3,segments=18,sides=8,endRadius=.035,variation=0){segments=Math.max(5,Math.round(segments*(b.detail||1)));sides=Math.max(3,Math.round(sides*Math.sqrt(b.detail||1)));b.grid(segments,sides,(u,v)=>{const p=catmull(points,v),t=normalize(sub(catmull(points,Math.min(1,v+.002)),catmull(points,Math.max(0,v-.002)))),axis=Math.abs(t[1])<.95?[0,1,0]:[1,0,0],n=normalize(cross(t,axis)),bn=cross(t,n),a=u*TAU,normal=add(scale(n,Math.cos(a)),scale(bn,Math.sin(a))),r=radius*(1-v)+endRadius*v;return[add(p,scale(normal,r)),normal,c,[u,v],kind,variation];});}
/** Hand-shaped scalloped pine canopy, not a generic sphere or cone. */
function canopy(b,p,r,c,variation){b.grid(8,24,(u,v)=>{const a=u*TAU,phi=v*Math.PI,scallop=1+.075*Math.cos(a*7+variation)+.035*Math.sin(a*11),rad=Math.sin(phi)*scallop,n=normalize([Math.cos(a)*Math.sin(phi)/r[0],Math.cos(phi)/r[1],Math.sin(a)*Math.sin(phi)/r[2]]);return[[p[0]+Math.cos(a)*rad*r[0],p[1]+Math.cos(phi)*r[1]+.10*Math.sin(a*5)*Math.sin(phi),p[2]+Math.sin(a)*rad*r[2]],n,c,[u,v],2,variation];});}
function quad(x0,z0,x1,z1,y,kind,c){const b=new MeshBuilder();b.grid(1,1,(u,v)=>[[x0+(x1-x0)*u,y,z0+(z1-z0)*v],[0,1,0],color(c),[u,v],kind,0]);return b.build();}



const VALLEY=Object.freeze({chunk:90,behind:1,ahead:10,safeHalfWidth:20,far:1250});
const PROFILES=Object.freeze([
 {name:'broad shoulder',taper:.46,shoulder:.15,bend:.24},
 {name:'high asymmetric peak',taper:.75,shoulder:.05,bend:.45},
 {name:'layered ridge',taper:.62,shoulder:.28,bend:-.28},
 {name:'narrow spire',taper:.95,shoulder:.03,bend:.15},
 {name:'rounded massif',taper:.38,shoulder:.22,bend:-.19},
 {name:'split crest',taper:.67,shoulder:.14,bend:.34}
]);
function routeCenter(s,seed){const p=(seed%997)*.005;return 6*Math.sin(s*.0024+p)+3*Math.sin(s*.0061+p*.43);}
function riverCenter(s,seed){return routeCenter(s,seed)+4.4*Math.sin(s*.024+seed%17)+2.2*Math.sin(s*.058);}
function wantedChunks(s){const k=Math.floor(s/VALLEY.chunk);return Array.from({length:VALLEY.behind+VALLEY.ahead+1},(_,i)=>k+i-VALLEY.behind);}
function skyGeometry(){const b=new MeshBuilder(),c=[1,1,1],n=[0,0,1];b.vertex([-1,-1,0],n,c,[0,0]);b.vertex([1,-1,0],n,c,[1,0]);b.vertex([-1,1,0],n,c,[0,1]);b.vertex([1,1,0],n,c,[1,1]);b.tri(0,1,2);b.tri(1,3,2);return b.build();}
function groundGeometry(){const b=new MeshBuilder();b.grid(1,1,(u,v)=>[[(u-.5)*4000,0,200-v*1600],[0,1,0],[.2,.5,.45],[u,v],0,0]);return b.build();}
function makePeakSpec(x,z,w,d,h,rnd,type){const p=PROFILES[type];return{x,z,w,d,h,type,phase:rnd()*TAU,taper:p.taper,shoulder:p.shoulder,bend:p.bend*w*(.6+.7*rnd()),twist:(rnd()-.5)*.25,id:rnd()};}
function peakPoint(q,a,v){
 const s=Math.sin(Math.PI*v),fade=Math.pow(Math.max(0,1-v),q.taper);
 const waist=1+q.shoulder*Math.exp(-Math.pow((v-.39)*3.7,2));
 const facets=1+.12*Math.sin(a*3+q.phase+v*1.7)+.055*Math.cos(a*7+q.phase*.3-v*2.5);
 const r=fade*waist*facets;
 const ang=a+q.twist*v;
 return [q.x+q.bend*Math.pow(v,1.55)+q.w*r*Math.cos(ang),-.65+q.h*v+q.h*.021*s*Math.sin(a*4+q.phase),q.z+q.d*r*Math.sin(ang)+q.d*.11*s*Math.sin(q.phase+v*4.)];
}
function peak(b,q){
 const rows=Math.max(12,Math.round(30*(b.detail||1))),cols=Math.max(18,Math.round(44*(b.detail||1)));
 b.grid(rows,cols,(u,v)=>{
  const a=u*TAU,p=peakPoint(q,a,v),da=sub(peakPoint(q,a+.002,v),peakPoint(q,a-.002,v)),dv=sub(peakPoint(q,a,Math.min(1,v+.002)),peakPoint(q,a,Math.max(0,v-.002)));
  let n=normalize(cross(dv,da));if(v>.999)n=[0,1,0];
  const tint=[.93+.11*Math.sin(q.id*13),.97+.07*Math.sin(q.id*7),.92+.10*Math.cos(q.id*9)];
  return[p,n,tint,[u,v],1,q.id];
 });
}
function pineFan(b,p,r,seed){
 const rnd=random(seed),tint=color(['#418366','#577f54','#286c58','#679068','#3c7862'][Math.floor(rnd()*5)]),rot=(rnd()-.5)*.33;
 function pt(a,t){let x=Math.cos(a)*r*t*(1+.06*Math.sin(a*9+seed)),y=Math.sin(a)*r*.76*t;return[p[0]+x*Math.cos(rot)-y*Math.sin(rot),p[1]+y*Math.cos(rot)+x*Math.sin(rot),p[2]-.22*r*Math.sin(a)*t+.13*r*Math.sin(Math.PI*t)];}
 b.grid(Math.max(2,Math.round(4*(b.detail||1))),Math.max(12,Math.round(22*(b.detail||1))),(u,v)=>{const a=u*Math.PI;return[pt(a,v),normalize([Math.cos(a)*.24,Math.sin(a)*.50,.9]),tint,[Math.cos(a)*v,Math.sin(a)*v],2,(seed%197)*.17];});
 const border=[];for(let i=0;i<=22;i++)border.push(pt(i/22*Math.PI,1));border.push(pt(Math.PI,0),pt(0,1));
 tube(b,border,r*.016,color('#153b32'),6,30,3,r*.016);
}
function pine(b,p,height,seed,lean=1){
 const rnd=random(seed),h=height;
 const spine=[p,[p[0]-.13*h*lean,p[1]+.33*h,p[2]-.05*h],[p[0]+.12*h*lean,p[1]+.69*h,p[2]-.06*h],[p[0]+.25*h*lean,p[1]+.89*h,p[2]-.02*h]];
 tube(b,spine,h*.040,color('#9c6a46'),3,22,7,h*.006,seed%5);
 for(let i=0;i<7;i++){
  const f=.29+i*.084,side=i%2?1:-1,root=catmull(spine,f);
  const spread=h*(.38-i*.025)*(side===lean?1.18:.88);
  const end=[root[0]+side*spread,root[1]+h*(.08+rnd()*.025),root[2]+(rnd()-.3)*h*.16];
  const bend=[mix(root[0],end[0],.59),root[1]-.027*h,end[2]];
  tube(b,[root,bend,end],h*(.013-i*.001),color('#996b44'),3,12,5,h*.004,seed+i);
  const size=h*(.19-i*.007);
  for(let k=0;k<3;k++)pineFan(b,[end[0]+(k-1)*size*.66,end[1]+(k===1?size*.30:0),end[2]+(k===1?-.12:.17)*size],size*(.78+rnd()*.33),seed+i*431+k*79);
 }
 for(let k=0;k<3;k++)pineFan(b,[spine[3][0]+(k-1)*h*.09,spine[3][1]+(k===1?h*.055:0),spine[3][2]],h*.16,seed+779+k);
}
function cloudRibbon(b,p,width,height,seed){
 const rnd=random(seed),lobes=[[-.64,.31,.54],[-.23,.36,1.0],[.28,.29,.62],[.62,.29,.30]],phase=rnd()*TAU;
 const shape=x=>{
  const edge=Math.pow(Math.max(0,1-x*x),.65);
  let top=.07*edge;for(const[c,w,h]of lobes){const t=(x-c)/w;if(Math.abs(t)<1)top=Math.max(top,Math.sqrt(1-t*t)*h);}
  const ribbon=.065*Math.sin(x*7+phase)*edge;return[-.08*edge+ribbon,top*.62+ribbon];
 };
 const point=(x,y)=>[p[0]+x*width*.5,p[1]+y*height,p[2]+.13*height*(1-x*x)];
 b.grid(3,Math.max(24,Math.round(52*(b.detail||1))),(u,v)=>{const x=u*2-1,[lo,hi]=shape(x);return[point(x,mix(lo,hi,v)),[0,.05,1],color('#f8e6bb'),[u*2,v],4,seed%23];});
 const edge=[];for(let i=0;i<=52;i++){const x=i/26-1;edge.push(point(x,shape(x)[1]));}for(let i=52;i>=0;i--){const x=i/26-1;edge.push(point(x,shape(x)[0]));}edge.push(edge[0]);
 const r=Math.max(.036,height*.016);
 tube(b,edge,r,color('#4c513e'),6,110,3,r);
 for(const[c,w,h]of lobes.slice(0,3)){
  const pts=[],radius=height*h*.21;
  for(let i=0;i<=30;i++){const t=i/30,a=-Math.PI*.55+t*Math.PI*2.15,rr=radius*(1-t*.79);pts.push([p[0]+c*width*.5+rr*Math.cos(a),p[1]+height*h*.34+rr*Math.sin(a),p[2]+height*.15+.02]);}
  tube(b,pts,r*.95,color('#655e3f'),6,32,4,r*.95);
 }
}
/** A mountain stream is sampled over the full width of the mountain skin.
 * The previous ribbon only sampled its centre and then used a fixed X axis.
 * Arc-length / local speed gives a monotonic travel-time coordinate for flow.
 * No world-layout random numbers are consumed by these local detail helpers.
 */
function cascadeProfile(q,seed){
 const rnd=random(seed),phase=rnd()*TAU,top=.79+rnd()*.055;
 return {q,seed,phase,top,bottom:.74/q.h,width:2.45+q.w*.088,
  bend:.13+rnd()*.06,poolA:.34+rnd()*.10,poolB:.69+rnd()*.11};
}
function cascadeSection(flow,t){
 t=clamp(t,0,1);const {q,phase}=flow;
 const v=mix(flow.top,flow.bottom,t);
 // Irregular S bends approach the inner valley side toward the foot.
 const a=Math.PI*.5+q.side*(.075+.30*smooth(.48,1,t))
  +flow.bend*Math.sin(t*7.6+phase)*Math.sin(Math.PI*t)
  +.038*Math.sin(t*16.2+phase*.7)*Math.sin(Math.PI*t);
 const pool=.29*Math.exp(-Math.pow((t-flow.poolA)/.075,2))
  +.37*Math.exp(-Math.pow((t-flow.poolB)/.087,2));
 const width=flow.width*(.055+.945*smooth(0,.09,t))
  *(.85+.14*Math.sin(t*14.7+phase)+.075*Math.cos(t*27.1+phase*.7)
    +pool+.40*smooth(.88,1,t));
 const da=scale(sub(peakPoint(q,a+.001,v),peakPoint(q,a-.001,v)),500);
 return {a,v,width,arcPerRad:Math.max(2,Math.hypot(da[0],da[2])),pool};
}
function cascadePoint(flow,u,t){
 const section=cascadeSection(flow,t),{q,phase}=flow;
 const angle=section.a+(u-.5)*section.width/section.arcPerRad;
 const p=peakPoint(q,angle,section.v);
 // Stay above the actual tessellated skin, not a straight chord through it.
 // Across-stream sampling also prevents the outer edges cutting into a slope.
 p[2]+=.29+.035*Math.sin(u*18+t*26+phase)*Math.sin(Math.PI*t);
 p[1]=mix(Math.max(.055,p[1]),.055,smooth(.967,1,t));
 return p;
}
function makeCascade(q,seed){
 const flow=cascadeProfile(q,seed),samples=192,travel=[0],arc=[0],foam=[],slope=[];
 const points=Array.from({length:samples+1},(_,i)=>cascadePoint(flow,.5,i/samples));
 for(let i=0;i<=samples;i++){
  const d=sub(points[Math.min(samples,i+1)],points[Math.max(0,i-1)]);
  slope.push(clamp(-d[1]/Math.max(.0001,length(d)),0,1));
 }
 for(let i=0;i<=samples;i++){
  const t=i/samples,section=cascadeSection(flow,t);
  const impact=Math.max(0,slope[Math.max(0,i-4)]-slope[i]);
  foam.push(clamp(.075+section.pool*.65+impact*2.5+.36*Math.exp(-Math.pow((t-.965)/.035,2)),0,.85));
  if(i){const distance=length(sub(points[i],points[i-1]));
   arc.push(arc[i-1]+distance);
   const velocity=2.8+6.7*(slope[i]+slope[i-1])*.5;
   travel.push(travel[i-1]+distance/velocity);
  }
 }
 const value=(values,t)=>{const f=clamp(t,0,1)*samples,i=Math.min(samples-1,Math.floor(f));return mix(values[i],values[i+1],f-i);};
 return {...flow,points,arc,travel,foam,slope,value,
  end:points[samples],endWidth:cascadeSection(flow,1).width};
}
function buildCascade(b,stone,flow){
 const rows=Math.max(54,Math.round(112*(b.detail||1))),cols=10;
 b.grid(rows,cols,(u,t)=>{
  const p=cascadePoint(flow,u,t),across=sub(cascadePoint(flow,Math.min(1,u+.002),t),cascadePoint(flow,Math.max(0,u-.002),t));
  const tangent=sub(cascadePoint(flow,u,Math.min(1,t+.002)),cascadePoint(flow,u,Math.max(0,t-.002)));
  let n=normalize(cross(across,tangent));if(n[2]<0)n=scale(n,-1);
  // Material 5 colour channels carry turbulence, path fraction and slope.
  return [p,n,[flow.value(flow.foam,t),t,flow.value(flow.slope,t)],
   [u,flow.value(flow.travel,t)],5,flow.phase];
 });
 // Local wet-rock shoulders, in the same mountain atlas and surface space.
 // They replace a detached rectangular water strip with a shallow channel.
 for(const bank of [-1,1])stone.grid(rows,3,(u,t)=>{
  const sec=cascadeSection(flow,t),bankWidth=(.42+.25*Math.sin(t*19+flow.phase)**2)*smooth(0,.06,t);
  const offset=bank*(sec.width*.5+u*bankWidth),a=sec.a+offset/sec.arcPerRad;
  const p=peakPoint(flow.q,a,sec.v),fade=smooth(0,.05,t)*(1-smooth(.94,1,t));
  p[2]+=(.34*(1-u)+.24*Math.sin(u*Math.PI)+.09)*fade;
  const da=sub(peakPoint(flow.q,a+.002,sec.v),peakPoint(flow.q,a-.002,sec.v));
  const dv=sub(peakPoint(flow.q,a,Math.min(1,sec.v+.002)),peakPoint(flow.q,a,Math.max(0,sec.v-.002)));
  const n=normalize(cross(dv,da)),tint=mix(.56,1,u);
  return [p,n,[tint,tint,tint],[a/TAU,sec.v],1,flow.q.id];
 });
 return flow;
}
function riverWidth(s){return 3.7+.6*Math.sin(s*.018);}
function riverDerivative(s,seed){return (riverCenter(s+.05,seed)-riverCenter(s-.05,seed))/.1;}
/** Closest main-river cross-section: allows tributaries to match its exact UV
 * and suppress their own bank seams at a junction, rather than forming a T.
 */
function mainRiverUV(p,s0,seed){
 let s=s0-p[2];
 for(let i=0;i<5;i++){
  const dx=riverDerivative(s,seed),cx=riverCenter(s,seed);
  s+=((p[0]-cx)*dx+(s0-p[2]-s))/(1+dx*dx);
 }
 const dx=riverDerivative(s,seed),nx=1/Math.sqrt(1+dx*dx);
 return [.5+(p[0]-riverCenter(s,seed))/(riverWidth(s)*nx),s];
}
function makeTributary(flow,s0,seed,toS){
 const start=flow.end,dz=s0-toS-start[2],phase=flow.phase;
 const lastDir=normalize(sub(flow.points.at(-1),flow.points.at(-5)));
 const endX=riverCenter(toS,seed),c1=start[0]+lastDir[0]*9,c2=endX+riverDerivative(toS,seed)*dz/3;
 function center(t){
  const k=1-t,z=mix(start[2],s0-toS,t),s=s0-z;
  let x=k*k*k*start[0]+3*k*k*t*c1+3*k*t*t*c2+t*t*t*endX;
  x+=Math.sin(Math.PI*t)**2*Math.sin(t*6.2+phase)*1.05;
  x=mix(x,riverCenter(s,seed),smooth(.64,1,t));
  return [x,.055,z];
 }
 function width(t){
  const pool=1.7*Math.exp(-Math.pow((t-.055)/.065,2));
  let w=mix(flow.endWidth,2.25,smooth(0,.25,t))+pool;
  w*=1+.10*Math.sin(t*15+phase)*Math.sin(Math.PI*t);
  return mix(w,riverWidth(s0-center(t)[2])*.74,smooth(.72,1,t));
 }
 function point(u,t){
  const p=center(t),dir=sub(center(Math.min(1,t+.001)),center(Math.max(0,t-.001)));
  const side=normalize([dir[2],0,-dir[0]]); // screen-independent tangent frame
  // Waterfall U runs along its angular direction (towards -X on the front).
  const pos=add(p,scale(side,(.5-u)*width(t)));
  const fallStart=cascadePoint(flow,u,1),delta=sub(fallStart,start);
  const matchingStart=add(p,delta),blend=smooth(0,.075,t);
  return matchingStart.map((v,k)=>mix(v,pos[k],blend));
 }
 const samples=160,arc=[0],points=Array.from({length:samples+1},(_,i)=>center(i/samples));
 for(let i=1;i<=samples;i++)arc.push(arc[i-1]+length(sub(points[i],points[i-1])));
 const distance=t=>{const f=clamp(t,0,1)*samples,i=Math.min(samples-1,Math.floor(f));return mix(arc[i],arc[i+1],f-i);};
 return {center,width,point,distance,toS,s0,seed,flow};
}
function buildTributary(b,tributary){
 const rows=Math.max(44,Math.round(82*(b.detail||1)));
 b.grid(rows,10,(u,t)=>{
  const p=tributary.point(u,t),mainUV=mainRiverUV(p,tributary.s0,tributary.seed);
  const join=smooth(.72,.97,t)*(1-smooth(.39,.49,Math.abs(mainUV[0]-.5)));
  // Material 9 carries main-river UV + confluence blend in its colour fields.
  return [p,[0,1,0],[mainUV[0],mainUV[1],join],
   [u,tributary.distance(t)],9,tributary.flow.phase];
 });
}
function chunkDescription(seed,id){
 const rnd=random((Math.imul(id,73856093)^seed^19349663)>>>0),s0=id*VALLEY.chunk,peaks=[];
 for(const side of [-1,1]){
  for(let j=0;j<2;j++){
   const s=s0+17+j*43+(rnd()-.5)*14,type=Math.floor(rnd()*PROFILES.length);
   const w=13+rnd()*10,h=(type===3?52:33)+rnd()*26,d=16+rnd()*11;
   const x=routeCenter(s,seed)+side*(32+w+6*rnd());
   peaks.push({...makePeakSpec(x,-(s-s0),w,d,h,rnd,type),side,layer:0});
  }
  const s=s0+39+rnd()*18,w=27+rnd()*17,h=65+rnd()*45;
  peaks.push({...makePeakSpec(routeCenter(s,seed)+side*(83+w*.6),-(s-s0),w,31+rnd()*18,h,rnd,Math.floor(rnd()*6)),side,layer:1});
  for(let j=0;j<2;j++){
   const s=s0+13+j*42+rnd()*12,w=7+rnd()*5;
   peaks.push({...makePeakSpec(routeCenter(s,seed)+side*(23+w),-(s-s0),w,10+rnd()*5,9+rnd()*15,rnd,Math.floor(rnd()*5)),side,layer:2});
  }
 }
 return{s0,peaks};
}
function buildValleyChunk(seed,id,lod=0){
 const desc=chunkDescription(seed,id),s0=desc.s0,rnd=random((seed^Math.imul(id,83492791)^16411)>>>0);
 const stone=new MeshBuilder(),plants=new MeshBuilder(),clouds=new MeshBuilder(),water=new MeshBuilder(),stream=new MeshBuilder();
 const detail=[1,.70,.45][lod];for(const b of [stone,plants,clouds,water,stream])b.detail=detail;
 for(const q of desc.peaks){const hasWater=q.layer===0&&rnd()>.38;peak(stone,q);
  if(q.layer===0){
   for(let k=0;k<2;k++)peak(stone,{...q,x:q.x+q.side*q.w*(.51+k*.09),z:q.z+q.d*(.25+k*.47),w:q.w*(.39-k*.06),d:q.d*.66,h:q.h*(.76-k*.26),taper:.43,shoulder:.24,bend:-q.bend*.24,id:(q.id+k*.147+.22)%1});
  }
  if(q.layer===0&&!hasWater&&(q.type===0||q.type===2||q.type===4||q.type===5)){
   const child={...q,x:q.x-q.side*q.w*.26,z:q.z+q.d*.45,w:q.w*.69,d:q.d*.72,h:q.h*.56,taper:.53,bend:q.bend*.3,id:(q.id+.371)%1};
   peak(stone,child);
  }
  if(hasWater){
   const flow=buildCascade(water,stone,makeCascade(q,Math.floor(rnd()*1e5)));
   const absoluteS=s0-flow.end[2],toS=absoluteS-38-rnd()*24;
   buildTributary(stream,makeTributary(flow,s0,seed,toS));
  }
  if(q.layer===2&&rnd()>.40){
   const p=peakPoint(q,Math.PI*.52,.42);p[2]+=.4;
   pine(plants,p,7.2+rnd()*5,Math.floor(rnd()*999999),-q.side);
  }
 }
 for(const side of [-1,1]){
  const s=s0+30+rnd()*20;
  if((id+(side===1?1:0))%2===0)pine(plants,[routeCenter(s,seed)+side*(30+rnd()*4),.02,-(s-s0)],13+rnd()*4,Math.floor(rnd()*999999),-side);
  for(let j=0;j<2;j++){
   const ss=s0+22+j*45;
   cloudRibbon(clouds,[routeCenter(ss,seed)+side*(44+rnd()*24),1.5+rnd()*5,-(ss-s0)+4],19+rnd()*15,9.8+rnd()*4.8,Math.floor(rnd()*99999));
  }
  if(id%2===0)cloudRibbon(clouds,[side*(85+rnd()*20),37+rnd()*14,-(s-s0)-20],38+rnd()*25,13+rnd()*7,Math.floor(rnd()*99999));
 }
 // One longitudinal river is sampled at absolute coordinates on both sides of
 // every boundary. Its mesh cannot create a crack in the ground beneath it.
 stream.grid(46,6,(u,v)=>{
  const s=s0+v*VALLEY.chunk,x=riverCenter(s,seed),dx=(riverCenter(s+.05,seed)-riverCenter(s-.05,seed))/.1;
  const right=normalize([1,0,dx]);const width=3.7+.6*Math.sin(s*.018);
  return[[x+right[0]*(u-.5)*width,.035,-(s-s0)+right[2]*(u-.5)*width],[0,1,0],[.4,.7,.7],[u,s],8,0];
 });
 return{id,s0,lod,peaks:desc.peaks,stone:stone.build(),plants:plants.build(),clouds:clouds.build(),water:water.build(),stream:stream.build()};
}

export { TAU,clamp,mix,random,normalize,cross,sub,add,scale,identity,transform,multiply,perspective,lookAt,damp,parseSeed,VALLEY,PROFILES,routeCenter,wantedChunks,MeshBuilder,skyGeometry,groundGeometry,cloudRibbon, buildValleyChunk };
