// One procedural paper, independent dye colors and a new seed for each sheet.
export const PAPER_COLORS=Object.freeze([
 {id:'ivory',name:'미색',hex:'#f4ecd9'}, {id:'fog',name:'회백',hex:'#f1f1ed'},
 {id:'sage',name:'연두',hex:'#c5cec0'}, {id:'indigo',name:'쪽빛',hex:'#203e56'},
 {id:'lilac',name:'연보라',hex:'#c9c3d0'}, {id:'rose',name:'흙분홍',hex:'#c28f80'},
 {id:'teal',name:'청록',hex:'#789c9b'}
]);
export const PAPER_TEXTURE_DEFAULT=100;
export const PAPER_HOLD=28,PAPER_FADE=8,PAPER_PERIOD=PAPER_HOLD+PAPER_FADE;
const ease=x=>x*x*x*(x*(x*6-15)+10);
export function createPaperCycle(){
 let origin=0,firstColor=0,firstSeed=113;
 function variant(step){
  const color=(firstColor+step)%PAPER_COLORS.length;
  return {id:'hanji',color,seed:firstSeed+step*137};
 }
 function at(time){
  const elapsed=Math.max(0,time-origin),step=Math.floor(elapsed/PAPER_PERIOD),local=elapsed-step*PAPER_PERIOD;
  const progress=Math.max(0,(local-PAPER_HOLD)/PAPER_FADE);
  return {from:variant(step),to:variant(step+1),mix:ease(progress),progress,remaining:Math.max(0,PAPER_HOLD-local)};
 }
 return {at,
  randomize(time,sceneSeed){
   const before=at(time),visible=before.mix<.5?before.from:before.to;
   let bits=(Math.imul(sceneSeed+1,747796405)+2891336453)>>>0;
   bits=Math.imul(bits^(bits>>>16),2246822519)>>>0;
   firstColor=(visible.color+1+bits%(PAPER_COLORS.length-1))%PAPER_COLORS.length;
   firstSeed=1+bits%1000000;if(firstSeed===visible.seed)firstSeed++;
   origin=time;return true;
  },
 };
}
