import {FAMILIES} from './families.js';
import {articulationAt} from './butterfly-pose.js';
const TAU=Math.PI*2,FLIGHT_SPEED=2;
const randomFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const bezier=(a,b,c,d,u)=>{const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;};

// Staggered, overlapping visits keep both halves of three loose height bands
// populated at every timestamp. Individuals still follow finite curved paths.
export function createFlock(width,height,seed=0){
 const size=Math.min(width,height),aspect=[width/size,height/size],cache=new Map();
 const lanes=Array.from({length:3},(_,row)=>{
  const random=randomFor((seed*7919+row*1597334677+71)>>>0),life=64+random()*12;
  const count=Math.ceil((aspect[0]+.84)/(.49*aspect[0]));
  return {row,life,count,interval:life/count,phase:random()*life/count,sign:(row+seed)%2?-1:1};
 });
 function base(id,birth,life,axis,sign,random){
  return {id,birth,life,axis,sign,extent:aspect[axis]/2+.42,
   family:FAMILIES[Math.floor(random()*FAMILIES.length)],phase:random(),frequency:3.3+random()*.9,
   scale:.095+random()*.01,sway:random()*TAU,wave:.27+random()*.08,
   amplitude:.10*aspect[1],crossDrift:(random()<.5?-1:1)*(.45+random()*.25)};
 }
 function resident(lane,index){
  const id=index*4+lane.row;
  if(cache.has(id))return cache.get(id);
  const random=randomFor((Math.imul(id+173,2246822519)+seed*7919)>>>0);
  const actor=base(id,index*lane.interval+lane.phase,lane.life,0,lane.sign,random);
  const center=((lane.row+.5)/3-.5+(random()-.5)*.05)*aspect[1];
  const bend=(random()-.5)*.14*aspect[1];
  actor.controls=[center,center+bend,center-bend,center];
  cache.set(id,actor);return actor;
 }
 function residents(time){
  const result=[];
  for(const lane of lanes){
   const index=Math.floor((time-lane.phase)/lane.interval);
   for(let i=index-lane.count;i<=index;i++){
    const actor=resident(lane,i),age=time-actor.birth;
    if(age>=0&&age<actor.life)result.push(actor);
   }
  }
  return result;
 }
 function position(actor,age){
  const u=age/actor.life,along=actor.sign*actor.extent*(2*u-1);
  const lift=actor.amplitude*Math.sin(Math.PI*u)*Math.sin(age*actor.wave+actor.sway);
  return actor.axis===0?[along,bezier(...actor.controls,u)+lift]:[actor.controls[0]+(u-.5)*actor.crossDrift,along];
 }
 function crossing(index){
  const id=index*4+3;
  if(cache.has(id))return cache.get(id);
  const random=randomFor((Math.imul(id+273,1597334677)+seed*7919)>>>0);
  const actor=base(id,index*86+seed%23,68+random()*10,1,random()<.5?-1:1,random);
  const span=aspect[0]/2-Math.abs(actor.crossDrift)/2-.09,offset=random();
  // One occasional cross-screen visitor chooses the least crowded of nine
  // curves. It may still cross another route; no reactive snap or hard barrier.
  const samples=Array.from({length:25},(_,i)=>{
   const age=actor.life*i/24,time=actor.birth+age;
   return {age,others:residents(time).map(a=>position(a,time-a.birth)).filter(p=>Math.abs(p[0])<aspect[0]/2)};
  });
  let best=Infinity;
  for(let choice=0;choice<9;choice++){
   const lane=(((offset+choice*.38196601125)%1)*2-1)*span;
   actor.controls=[lane,lane,lane,lane];let cost=0;
   for(const sample of samples){const p=position(actor,sample.age);for(const q of sample.others){
    const d2=(p[0]-q[0])**2+(p[1]-q[1])**2;
    cost+=Math.max(0,1-d2/.1444)**2+5*Math.max(0,1-d2/.0144)**2;
   }}
   if(cost<best){best=cost;actor.selected=lane;}
  }
  actor.controls.fill(actor.selected);delete actor.selected;
  cache.set(id,actor);return actor;
 }
 function poses(seconds){
  const time=Math.max(0,seconds)*FLIGHT_SPEED;
  for(const [id,actor] of cache)if(actor.birth+actor.life<time-100||actor.birth>time+180)cache.delete(id);
  const actors=residents(time),crossIndex=Math.floor((time-seed%23)/86);
  const visitor=crossing(crossIndex);
  if(time>=visitor.birth&&time<visitor.birth+visitor.life)actors.push(visitor);
  return actors.map(actor=>{
   const age=time-actor.birth,p=position(actor,age),a=position(actor,age-.01),b=position(actor,age+.01);
   const vx=(b[0]-a[0])*size*FLIGHT_SPEED/.02,vy=(b[1]-a[1])*size*FLIGHT_SPEED/.02;
   const facing=vx<0?-1:1,heading=Math.atan2(vy,Math.abs(vx))*facing;
   const realAge=age/FLIGHT_SPEED,articulation=articulationAt(realAge,actor.frequency,actor.phase);
   return {id:actor.id,family:actor.family.id,kind:'butterfly',x:width/2+p[0]*size,y:height/2+p[1]*size,vx,vy,
    heading,facing,yaw:(facing===1?0:Math.PI)+facing*(-.38+.06*Math.sin(realAge*.19+actor.phase)),
    roll:.08+.025*Math.sin(realAge*.23+actor.phase),depth:80,scale:size*actor.scale*actor.family.scale/3,...articulation};
  });
 }
 return {poses};
}
