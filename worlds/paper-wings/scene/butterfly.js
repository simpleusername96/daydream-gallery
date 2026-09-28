import * as THREE from 'three';
import {WING_PARTS,wingPoint,legPoints} from './butterfly-pose.js';

export function createButterfly(texture,parts=WING_PARTS,profile={}){
  const length=profile.length??1,width=profile.width??1,head=profile.head??1,antenna=profile.antenna??1;
  const root=new THREE.Group(),body=new THREE.Group(),wings=[];
  root.add(body);
  const geometries=new Set(),materials=[];
  const pigment=new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,alphaTest:.25,alphaToCoverage:true,roughness:1,metalness:0});
  const bronze=new THREE.MeshStandardMaterial({color:profile.thorax??'#79644c',roughness:1});
  const dark=new THREE.MeshStandardMaterial({color:profile.dark??'#382d27',roughness:.9});
  const abdomenPigment=new THREE.MeshStandardMaterial({color:profile.abdomen??profile.thorax??'#79644c',roughness:1});
  materials.push(pigment,bronze,dark,abdomenPigment);
  function mesh(g,m,parent=body){geometries.add(g);const o=new THREE.Mesh(g,m);parent.add(o);return o;}
  function ellipsoid(at,scale,material=bronze,parent=body){
    const o=mesh(new THREE.SphereGeometry(1,16,12),material,parent);o.position.set(...at);o.scale.set(...scale);return o;
  }
  function tube(points,radius,material=dark,parent=body){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,18,radius,5,false),material,parent);
  }
  const thorax=ellipsoid([0,0,0],[.18,.092*width,.085*width]);thorax.name='thorax';
  const abdomen=new THREE.Group();abdomen.position.x=-.13;body.add(abdomen);
  const belly=ellipsoid([-.24*length,-.015,0],[.30*length,.068*width,.06*width],abdomenPigment,abdomen);belly.name='abdomen';
  ellipsoid([.205,.025,0],[.085*head,.075*head,.065*head]);
  for(const side of [-1,1]){
    ellipsoid([.205+.034*head,.036,side*.048*head],[.027*head,.038*head,.023*head],dark);
    const end=[.245+.405*antenna,.07+.24*antenna,side*.18];
    tube([[.245,.07,side*.028],[.245+.145*antenna,.07+.11*antenna,side*.07],[.245+.305*antenna,.07+.18*antenna,side*.15],end],.0065);
    const club=ellipsoid(end,[.035,.012,.012],dark);club.rotation.z=.42;
    for(let leg=0;leg<3;leg++){
      const foot=tube(legPoints(leg,side),.0055);foot.name='leg-'+leg+'-'+side;
    }
    for(const part of parts){
      // The wings occupy tens of pixels, not a full-screen surface. Keep enough
      // segments for the curved stroke without rebuilding thousands of hidden vertices.
      const nx=8,ny=12,samples=[],uv=[],indices=[];
      for(let j=0;j<=ny;j++){
        const sy=part.rect[1]+part.rect[3]*j/ny;
        const taper=part.topInset===undefined?part.rect[0]:part.pivot[0]+(part.topInset-part.pivot[0])*Math.max(0,(part.pivot[1]-sy)/(part.pivot[1]-part.rect[1]));
        const lo=Math.max(part.rect[0],taper);
        const hi=part.rect[0]+part.rect[2];
        for(let i=0;i<=nx;i++){const sx=lo+(hi-lo)*i/nx;samples.push([sx,sy]);uv.push(sx/(part.atlas?.[0]??1536),1-sy/(part.atlas?.[1]??1024));}
      }
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(samples.length*3),3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);
      const wing=mesh(g,pigment,root);wing.frustumCulled=false;
      wings.push({part,side,samples,g});
    }
  }
  function update(pose){
    root.position.set(pose.x,pose.y,pose.depth??80);root.scale.setScalar(pose.scale);
    root.rotation.set(pose.roll,pose.yaw,pose.heading+pose.pitch*(pose.facing??1),'ZYX');
    abdomen.rotation.z=pose.abdomen;
    for(const {part,side,samples,g} of wings){
      const a=g.attributes.position;
      samples.forEach(([sx,sy],i)=>a.setXYZ(i,...wingPoint(part,side,sx,sy,pose.phase)));
      a.needsUpdate=true;g.computeVertexNormals();
    }
    root.updateMatrixWorld(true);
  }
  function dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.removeFromParent();}
  return {root,update,dispose};
}
