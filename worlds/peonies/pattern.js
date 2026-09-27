// Original R07 route: purple peonies → red peonies → blue ornamental rocks.
// Use the scene's pausable active clock rather than the original page's wall clock.
export const DEFAULT_SEED = 0;
export const SEGMENTS = 8;
export const PERIOD = 27;
export const STOPS = Object.freeze([
  Object.freeze({name:'Purple peonies',x:.55,y:.03}),
  Object.freeze({name:'Red peonies',x:.60,y:.37}),
  Object.freeze({name:'Blue rocks',x:.55,y:.77})
]);
const wrap=(value,length)=>((value%length)+length)%length;
export function poseAt(time,seed=DEFAULT_SEED) {
  const phase=wrap(time/9+wrap(seed,STOPS.length),STOPS.length);
  const index=Math.floor(phase),amount=(1-Math.cos((phase-index)*Math.PI))/2;
  const a=STOPS[index],b=STOPS[(index+1)%STOPS.length];
  const x=a.x+(b.x-a.x)*amount,y=a.y+(b.y-a.y)*amount;
  return {x,y,sx:70+x*210+Math.sin(time*.027)*10,
    sy:80+y*1080+Math.cos(time*.041)*10,rotation:time*.005,
    from:a.name,to:b.name,progress:amount};
}
export function framing(width,height) {
  const radius=Math.hypot(width,height)/2+5;
  return {x:width/2,y:height/2,radius,scale:radius/(270+.55*170)};
}
