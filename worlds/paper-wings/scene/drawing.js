import * as THREE from 'three';
import {createButterfly} from './butterfly.js';
import {FAMILIES} from './families.js';
import {createFlock} from './flock.js';
import {createPaperCycle} from './papers.js';
import {createPaperMaterial} from './paper-material.js';

export async function createDrawing(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setClearColor('#f4ecd9');renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,1,0,1,3000);
  camera.position.z=1000;
  // Soft light reveals curved membranes without turning the painted art glossy.
  scene.add(new THREE.AmbientLight('#ffffff',2.1));
  const light=new THREE.DirectionalLight('#fff1df',1.2);light.position.set(-300,700,900);scene.add(light);
  const fill=new THREE.DirectionalLight('#e7edf2',.7);fill.position.set(500,200,-500);scene.add(fill);
  const paperCycle=createPaperCycle();
  const textures=new Map(),actors=new Map();
  let flock,paperSurface,paper,width=1,height=1,seed=0,disposed=false;
  function clearActors(){for(const actor of actors.values())actor.dispose();actors.clear();}
  try{
    const loaded=await Promise.allSettled(FAMILIES.map(async family=>{
      const texture=await new THREE.TextureLoader().loadAsync(new URL(family.asset,import.meta.url).href);
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      textures.set(family.id,texture);
    }));
    const failure=loaded.find(result=>result.status==='rejected');if(failure)throw failure.reason;
    paperSurface=createPaperMaterial(renderer);
    paper=new THREE.Mesh(new THREE.PlaneGeometry(1,1),paperSurface.material);
    paper.position.z=-300;paper.renderOrder=-10;scene.add(paper);
  }catch(error){clearActors();for(const texture of textures.values())texture.dispose();paperSurface?.dispose();renderer.dispose();renderer.forceContextLoss();throw error;}
  function resize(w,h){
    if(disposed)return;width=w;height=h;flock=createFlock(w,h,seed);renderer.setSize(w,h,false);
    camera.right=w;camera.top=h;camera.updateProjectionMatrix();
    paper.scale.set(w,h,1);paper.position.set(w/2,h/2,-300);paperSurface.resize(w,h);
  }
  function draw(time,nextSeed=seed){
    if(disposed)return;
    if(seed!==nextSeed||!flock){seed=nextSeed;flock=createFlock(width,height,seed);clearActors();}
    const poses=flock.poses(time),active=new Set(poses.map(p=>p.id));
    for(const [id,actor] of actors)if(!active.has(id)){actor.dispose();actors.delete(id);}
    for(const pose of poses){
      let actor=actors.get(pose.id);
      if(!actor){const family=FAMILIES.find(f=>f.id===pose.family);actor=createButterfly(textures.get(family.id),family.parts,{...family.body,width:(family.body?.width??1)*(1+.05*Math.sin(pose.id*2.7+seed))});actors.set(pose.id,actor);scene.add(actor.root);}
      actor.update(pose);
    }
    const background=paperCycle.at(time);paperSurface.update(background);renderer.render(scene,camera);
    return {paper:background.from.id,background,count:poses.length,families:FAMILIES.length,subjects:poses,
      geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  }
  function destroy(){if(disposed)return;disposed=true;clearActors();for(const texture of textures.values())texture.dispose();paper.geometry.dispose();paperSurface.dispose();renderer.dispose();renderer.forceContextLoss();}
  return {resize,draw,destroy,randomPaper:(time,sceneSeed)=>!disposed&&paperCycle.randomize(time,sceneSeed)};
}
