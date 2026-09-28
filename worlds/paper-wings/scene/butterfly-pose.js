// Local axes: +X nose, +Y up, +Z near wing. Camera observes the side.
const TAU = Math.PI * 2;
export const WING_PARTS = [
  {id:'fore',rect:[873,10,615,495],pivot:[894,486],root:[.04,.035],hind:false,topInset:1228},
  {id:'hind',rect:[899,511,526,480],pivot:[916,549],root:[-.07,.025],hind:true}
];
// Integrated frequency modulation keeps the phase continuous at every speed.
export function articulationAt(time,frequency=3.8,offset=0){
  const phase=TAU*(frequency*time+.08/.7*Math.sin(time*.7+offset)+offset);
  return {phase,frequency:frequency+.08*Math.cos(time*.7+offset),
    pitch:.018*Math.cos(phase-.3),abdomen:.025*Math.sin(phase-.6)};
}
// +X is the head. The short forelegs fold underneath the thorax; the longer
// middle/hind legs trail towards the abdomen, with bent knees rather than spikes.
export function legPoints(leg,side){
  const x=.095-leg*.095;
  if(leg===0)return [[x,-.045,side*.05],[x+.025,-.105,side*.075],[x-.035,-.145,side*.085],[x-.085,-.115,side*.075]];
  const length=leg===1?.24:.32;
  return [[x,-.045,side*.05],[x-.055,-.14,side*.10],[x-length*.7,-.21,side*.14],[x-length,-.16,side*.13]];
}
export function wingPoint(part,side,sx,sy,phase){
  const span=(sx-part.pivot[0])*(part.spanScale??.0032);
  const chord=(part.pivot[1]-sy)*(part.chordScale??.0021);
  const reach=Math.max(0,span),normalized=Math.min(1,reach/1.5);
  // Smooth full strokes with no glide hold. Hindwing/trailing edge lag is
  // proportional to reach, so all four roots remain attached to the thorax.
  const hind=part.paired?Math.max(0,Math.min(1,(sy-part.pivot[1])/350)):(part.hind?1:0);
  const lag=(.13*hind+.16)*normalized;
  const stroke=.28+.98*Math.sin(phase-lag);
  const cup=.10*normalized*normalized*Math.sin(phase-lag-.6);
  return [part.root[0]+chord+reach*.045*Math.sin(phase-lag),
    part.root[1]+reach*Math.sin(stroke)+cup,
    side*(.055+reach*Math.cos(stroke))];
}
