import * as THREE from 'three';
import {PAPER_COLORS} from './papers.js';
import {normalizePaperSettings} from './paper-settings.js';
const vertexShader='varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// One coordinate-based generator, no paper image input. Cache only two sheets;
// flight frames sample the cache instead of regenerating the fibers.
export function createPaperMaterial(renderer){
 let settings=normalizePaperSettings(),revision=0;
 const generation=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,vertexShader,uniforms:{
  extent:{value:new THREE.Vector2(1,1)},color:{value:new THREE.Color()},seed:{value:0},
  strength:{value:settings.strength/100},density:{value:settings.density},fineDetail:{value:settings.detail},markCount:{value:settings.marks},toneBalance:{value:settings.balance/100}
 },fragmentShader:`uniform vec2 extent;uniform vec3 color;
 uniform float seed,strength,density,fineDetail,markCount,toneBalance;varying vec2 uv0;
 float hash(vec2 p){uint h=uint(int(p.x))*1597334677u^uint(int(p.y))*3812015801u^uint(seed)*1013904223u;h=(h^(h>>16u))*2246822519u;h=(h^(h>>13u))*3266489917u;h=h^(h>>16u);return float(h&16777215u)/16777216.;}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fibers(vec2 p){
  vec2 cell=floor(p);float sum=0.;float aa=max(length(fwidth(p))*.55,.003);
  // Jittered centers, unrestricted angles and tapered curved strands avoid a weave.
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   vec2 c=cell+vec2(x,y),r=vec2(hash(c+vec2(17,53)),hash(c+vec2(93,11)));
   vec2 q=p-c-r;float angle=hash(c+vec2(71,27))*6.283185;
   q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
   float len=mix(.18,.72,hash(c+vec2(13,67)));
   float taper=1.-smoothstep(len*.45,len,abs(q.x));
   float bend=q.y+.035*sin(q.x/len*3.+r.x*6.28);
   float width=mix(.012,.035,r.y);
   float strand=1.-smoothstep(width,width+aa,abs(bend));
   float relief=1.-smoothstep(width,width+aa,abs(bend-width*1.8));
   sum+=(relief*.35-strand)*taper*mix(.25,1.,hash(c+vec2(59,41)));
  }
  return sum;
 }
 void main(){
  vec2 p=(uv0-.5)*extent*density;
  float body=(noise(p*7.)-.5)*.028+(noise(p*23.+37.)-.5)*.022;
  float grain=(noise(p*210.+19.)-.5)*.018+(noise(p*470.+71.)-.5)*.009;
  float strands=fibers(p*46.+1000.)*.065+fibers(p*103.+2000.)*.055;
  float surface=body+(grain+strands)*fineDetail;
  // Marks follow the fixed material settings; they do not define paper types.
  for(int i=0;i<24;i++){
   if(float(i)>=markCount)break;
   float k=float(i)*43.;vec2 center=vec2(hash(vec2(k,2)),hash(vec2(k,9)));
   vec2 q=(uv0-center)*extent;float angle=hash(vec2(k,12))*6.283185;
   q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
   float radius=mix(.025,.06,hash(vec2(k,17)));
   vec2 blot=q/vec2(radius,radius*.6);
   surface-=(1.-smoothstep(.15,1.,length(blot)+(noise(blot*2.+k)-.5)*.5))*.015;
   float len=mix(.06,.14,hash(vec2(k,22))),bend=q.y+.012*sin(q.x/len*2.+k);
   surface+=(exp(-pow((bend-.0025)/.002,2.))-exp(-pow(bend/.0015,2.)))*.008*(1.-smoothstep(.35,1.,abs(q.x)/len));
  }
  float luminance=dot(color,vec3(.2126,.7152,.0722));
  surface-=abs(surface)*(2.*luminance-1.)*toneBalance;
  float detail=surface*strength;detail=detail/(1.+abs(detail)*4.);
  vec3 room=detail>0.?1.-color:color;
  gl_FragColor=sRGBTransferEOTF(vec4(color+room*detail,1.));
 }`});
 const material=new THREE.ShaderMaterial({depthWrite:false,vertexShader,uniforms:{sheetA:{value:null},sheetB:{value:null},blend:{value:0}},fragmentShader:`uniform sampler2D sheetA,sheetB;uniform float blend;varying vec2 uv0;
 void main(){gl_FragColor=mix(texture2D(sheetA,uv0),texture2D(sheetB,uv0),blend);
 #include <colorspace_fragment>
 }`});
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=1;
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),generation);scene.add(quad);
 const cache=Array.from({length:2},()=>({key:'',target:new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false,stencilBuffer:false})}));
 function setSettings(input){const next=normalizePaperSettings(input);if(JSON.stringify(next)!==JSON.stringify(settings))revision++;settings=next;const u=generation.uniforms;u.strength.value=settings.strength/100;u.density.value=settings.density;u.fineDetail.value=settings.detail;u.markCount.value=settings.marks;u.toneBalance.value=settings.balance/100;return {...settings};}
 function resize(w,h){const side=Math.min(w,h);generation.uniforms.extent.value.set(w/side,h/side);for(const entry of cache){if(entry.target.width!==w||entry.target.height!==h){entry.target.setSize(w,h);entry.key='';}}}
 function update(state){
  const variants=[state.from,state.to],keys=variants.map(v=>v.seed+':'+v.color+':'+revision);
  const selected=variants.map((v,i)=>{
   let entry=cache.find(e=>e.key===keys[i]);
   if(!entry){entry=cache.find(e=>!keys.includes(e.key));const u=generation.uniforms;u.seed.value=v.seed;u.color.value.set(PAPER_COLORS[v.color].hex).convertLinearToSRGB();
    const previous=renderer.getRenderTarget();try{renderer.setRenderTarget(entry.target);renderer.render(scene,camera);}finally{renderer.setRenderTarget(previous);}entry.key=keys[i];
   }
   return entry.target.texture;
  });
  material.uniforms.sheetA.value=selected[0];material.uniforms.sheetB.value=selected[1];material.uniforms.blend.value=state.mix;
 }
 function dispose(){for(const entry of cache)entry.target.dispose();quad.geometry.dispose();generation.dispose();material.dispose();}
 return {material,setSettings,resize,update,dispose};
}
