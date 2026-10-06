import {createCyclingScene, framing, weather, daylight, LOGICAL_WIDTH, LOGICAL_HEIGHT, POSE_FPS} from './cycling.js';

const canvas=document.querySelector('canvas'), status=document.querySelector('[role=status]');
const context=canvas.getContext('2d',{alpha:false});
const plate=document.createElement('canvas');
plate.width=LOGICAL_WIDTH; plate.height=LOGICAL_HEIGHT;
const paint=plate.getContext('2d',{alpha:false,willReadFrequently:true});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const load=new AbortController();
let scene, buffer, image, ready=false, disposed=false, error='', seed=173;
let playing=window===parent&&!reduced.matches, time=0, last=null, frame=0, frames=0, lastPaint=-Infinity;
let view, frameCost=0;

function draw() {
  if(!scene||disposed)return;
  const began=performance.now();
  scene.render(time,seed); paint.putImageData(buffer,0,0);
  view=framing(canvas.width,canvas.height,plate.width,plate.height);
  context.imageSmoothingEnabled=false;
  // Extend open sky with its current palette color; tree/fruit keep a uniform scale.
  context.fillStyle='rgb('+Array.from(scene.pixels.slice(0,3)).join(',')+')';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(plate,view.x,view.y,view.width,view.height);
  const extra=Math.max(0,canvas.height-view.y-view.height);
  if(extra>0){
    // Add foreground depth only below the tree and its contact shadow. The eased
    // row mapping has no seam at the start and uses the live, wind-driven dune art.
    const start=Math.ceil(plate.height*.62),span=plate.height-start;
    for(let y=start;y<plate.height;y+=2){
      const next=Math.min(plate.height,y+2),a=(y-start)/span,b=(next-start)/span;
      const top=view.y+y*view.scale+extra*a*a,bottom=view.y+next*view.scale+extra*b*b;
      context.drawImage(plate,0,y,plate.width,next-y,view.x,top,view.width,bottom-top+.5);
    }
  }
  frames++; frameCost+=(performance.now()-began-frameCost)*.1;
}

function resize() {
  if(disposed)return;
  const ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.round(innerWidth*ratio));
  canvas.height=Math.max(1,Math.round(innerHeight*ratio));
  draw();
}

function tick(now) {
  frame=0;
  if(!playing||!ready||document.hidden||disposed){last=null;return;}
  time+=last===null?0:Math.min(.1,(now-last)/1000); last=now;
  if(now-lastPaint>=1000/POSE_FPS-.5){draw();lastPaint=now;}
  frame=requestAnimationFrame(tick);
}

function sync(){cancelAnimationFrame(frame);frame=0;last=null;lastPaint=-Infinity;
  if(playing&&ready&&!document.hidden&&!disposed)frame=requestAnimationFrame(tick);}
function changeScene(delta=1){if(disposed)return false;seed=(seed+delta*7919)>>>0;draw();return true;}
function dispose(){
  if(disposed)return;disposed=true;ready=false;playing=false;cancelAnimationFrame(frame);load.abort();
  removeEventListener('resize',resize);removeEventListener('pagehide',dispose);
  document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',onReduced);
  image?.close();image=null;scene=null;buffer=null;canvas.width=canvas.height=plate.width=plate.height=0;
}
function onReduced(event){if(event.matches){playing=false;sync();}}
const snapshot=()=>({id:'white-sands',ready,disposed,playing,time,frames,seed,error,frameCost,
  renderer:'indexed-canvas',logical:[LOGICAL_WIDTH,LOGICAL_HEIGHT],view,weather:weather(time,seed),day:daylight(time).cycle,tracks:scene?.stats});
window.whiteSands=Object.freeze({get ready(){return ready;},snapshot,player:Object.freeze({
  setPlaying(value){if(disposed)return false;playing=Boolean(value);sync();return true;},
  setMuted(){return true;},randomScene:()=>changeScene(1+Math.floor(Math.random()*997)),
  nextScene:()=>changeScene(1),previousScene:()=>changeScene(-1),destroy:dispose,snapshot,
  drawTo(target){if(!ready||disposed)return false;draw();target.width=canvas.width;target.height=canvas.height;
    target.getContext('2d').drawImage(canvas,0,0);return true;}
})});
addEventListener('resize',resize);addEventListener('pagehide',dispose,{once:true});
document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',onReduced);

(async()=>{
  const response=await fetch('./art/pixel-master.png',{signal:load.signal});
  if(!response.ok)throw new Error('Scene artwork unavailable');
  const loaded=await createImageBitmap(await response.blob());
  if(disposed){loaded.close();return;}image=loaded;
  // One fine display grid; only leaf coverage interpolates between logical pixels.
  paint.imageSmoothingEnabled=false;paint.drawImage(image,0,0,plate.width,plate.height);
  const source=paint.getImageData(0,0,plate.width,plate.height);
  scene=createCyclingScene(source.data,plate.width,plate.height);
  buffer=new ImageData(scene.pixels,plate.width,plate.height);
  image.close();image=null;resize();ready=true;status.hidden=true;sync();
})().catch(e=>{if(disposed)return;error=e.message;status.hidden=false;
  status.textContent='장면을 준비하지 못했습니다. 다시 선택해 주세요.';console.error(e);});
