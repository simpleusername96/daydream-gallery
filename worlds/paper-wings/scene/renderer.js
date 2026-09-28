import {createDrawing} from './drawing.js';
import {PAPER_DEFAULTS} from './paper-settings.js';
const paperSettings=PAPER_DEFAULTS;
const canvas=document.querySelector('canvas'),status=document.querySelector('[role=status]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),lifetime=new AbortController();
let drawing,ready=false,disposed=false,error='',playing=false,time=0,last=null,raf=0,frames=0,cost=0,seed=0,composition;
function paint(){if(!ready||disposed)return;const start=performance.now();composition=drawing.draw(time,seed);cost+=(performance.now()-start-cost)*.1;frames++;}
function resize(){if(!drawing||disposed)return;const d=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1800000/(innerWidth*innerHeight)));drawing.resize(Math.max(1,Math.round(innerWidth*d)),Math.max(1,Math.round(innerHeight*d)));paint();}
// Poses are sampled from time, not integrated physics. Preserve real-time wing
// frequency across dropped frames; visibility/pause resets last independently.
function tick(now){raf=0;if(!ready||disposed||!playing||document.hidden){last=null;return;}time+=last===null?0:Math.max(0,(now-last)/1000);last=now;paint();raf=requestAnimationFrame(tick);}
function sync(){cancelAnimationFrame(raf);raf=0;last=null;if(ready&&!disposed&&playing&&!document.hidden)raf=requestAnimationFrame(tick);}
function change(delta){if(!ready||disposed)return false;seed=(seed+delta+100000)%100000;drawing.randomPaper(time,seed);paint();return true;}
function dispose(){if(disposed)return;disposed=true;ready=false;playing=false;cancelAnimationFrame(raf);lifetime.abort();drawing?.destroy();}
const snapshot=()=>({id:'paper-wings',ready,disposed,playing,time,frames,seed,error,cost,renderer:'side-view-3d-flock',textureStrength:paperSettings.strength,paperSettings:{...paperSettings},backing:[canvas.width,canvas.height],...composition});
const player={setPlaying(value){if(disposed)return false;playing=!!value;sync();return true;},setMuted(){return true;},randomScene:()=>change(1),nextScene:()=>change(1),previousScene:()=>change(-1),drawTo(target){if(!ready||disposed)return false;target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0);return true;},snapshot,destroy:dispose};
window.landscape={get ready(){return ready;},player,snapshot,dispose,renderAt(seconds,nextSeed=seed){if(!ready||disposed)return false;time=Math.max(0,Number(seconds)||0);seed=nextSeed;paint();sync();return true;}};
addEventListener('resize',resize,{signal:lifetime.signal});document.addEventListener('visibilitychange',sync,{signal:lifetime.signal});addEventListener('pagehide',dispose,{once:true,signal:lifetime.signal});reduced.addEventListener('change',e=>{if(e.matches)player.setPlaying(false);},{signal:lifetime.signal});
try{const created=await createDrawing(canvas);if(disposed)created.destroy();else{drawing=created;ready=true;resize();status.hidden=true;sync();}}catch(e){error=e instanceof Error?e.message:'Artwork could not be loaded';status.hidden=false;status.textContent='장면을 준비하지 못했습니다. 다시 열어 주세요.';console.error(e);}
