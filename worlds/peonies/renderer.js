import {DEFAULT_SEED} from './pattern.js';
import {createDrawing} from './drawing.js';

const canvas=document.querySelector('canvas'),status=document.querySelector('[role=status]');
const context=canvas.getContext('2d',{alpha:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),lifetime=new AbortController();
let seed=DEFAULT_SEED,drawing,ready=false,disposed=false,error='';
let playing=window===parent&&!reduced.matches,time=0,last=null,raf=0,frames=0,lastPaint=-Infinity,frameCost=0,composition;
function draw(){
  if(disposed||!context||!drawing)return;
  const started=performance.now();composition=drawing.draw(canvas.width,canvas.height,time,seed);
  frames++;frameCost+=(performance.now()-started-frameCost)*.1;
}
function resize(){
  if(disposed)return;
  const density=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1800000/(innerWidth*innerHeight)));
  canvas.width=Math.max(1,Math.round(innerWidth*density));canvas.height=Math.max(1,Math.round(innerHeight*density));draw();
}
function tick(now){
  raf=0;if(!ready||disposed||!playing||document.hidden){last=null;return;}
  time+=last===null?0:Math.min(.1,(now-last)/1000);last=now;
  if(now-lastPaint>=1000/30-.5){draw();lastPaint=now;}raf=requestAnimationFrame(tick);
}
function sync(){cancelAnimationFrame(raf);raf=0;last=null;lastPaint=-Infinity;
  if(ready&&!disposed&&playing&&!document.hidden)raf=requestAnimationFrame(tick);}
function changeSeed(delta){if(!ready||disposed)return false;seed=((seed+delta)%3+3)%3;draw();return true;}
function dispose(){if(disposed)return;disposed=true;ready=false;playing=false;cancelAnimationFrame(raf);raf=0;lifetime.abort();drawing?.destroy();drawing=null;canvas.width=canvas.height=0;}
const snapshot=()=>({id:'peonies',ready,disposed,playing,time,frames,seed,error,frameCost,renderer:'original-eightfold-canvas',
  backing:[canvas.width,canvas.height],...composition});
const player=Object.freeze({
  setPlaying(value){if(disposed)return false;playing=Boolean(value);sync();return true;},setMuted(){return true;},
  randomScene:()=>changeSeed(1+Math.floor(Math.random()*2)),nextScene:()=>changeSeed(1),previousScene:()=>changeSeed(-1),
  destroy:dispose,snapshot,
  drawTo(target){if(!ready||disposed)return false;target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0);return true;}
});
window.landscape=Object.freeze({get ready(){return ready;},player,snapshot,dispose,
  // Deterministic authoring evidence; never exposed as a viewer control.
  renderAt(seconds,nextSeed=seed){if(!ready||disposed)return false;time=Math.max(0,Number(seconds)||0);if(nextSeed!==seed){seed=((nextSeed%3)+3)%3;}draw();sync();return true;}
});
addEventListener('resize',resize,{signal:lifetime.signal});addEventListener('pagehide',dispose,{once:true,signal:lifetime.signal});
document.addEventListener('visibilitychange',sync,{signal:lifetime.signal});
reduced.addEventListener('change',event=>{if(event.matches){playing=false;sync();}},{signal:lifetime.signal});
try{
  if(!context)throw Error('Canvas2D unavailable');
  const artwork=new Image();artwork.src='./source/assets/peonies.jpg';await artwork.decode();
  if(artwork.naturalWidth!==3400||artwork.naturalHeight!==2284)throw Error('Unexpected artwork dimensions');
  if(!disposed){drawing=createDrawing(context,artwork);resize();ready=true;status.hidden=true;sync();}
}
catch(e){error=e.message;status.hidden=false;status.textContent='장면을 준비하지 못했습니다. 다시 선택해 주세요.';console.error(e);}
