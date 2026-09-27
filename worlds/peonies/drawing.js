import {SEGMENTS,framing,poseAt} from './pattern.js';

// Match the preserved original's third-panel normalization and border-free crop.
export function createDrawing(ctx,image) {
  const panel=document.createElement('canvas');panel.width=377;panel.height=1293;
  panel.getContext('2d').drawImage(image,1243,263,384,1293,0,0,377,1293);
  const sw=353,sh=1269,tile=document.createElement('canvas');tile.width=sw*2;tile.height=sh*2;
  const ink=tile.getContext('2d',{alpha:false});
  for(let i=0;i<4;i++){
    ink.save();ink.translate(i%2?sw*2:0,i>1?sh*2:0);ink.scale(i%2?-1:1,i>1?-1:1);
    ink.drawImage(panel,12,8,sw,sh,0,0,sw,sh);ink.restore();
  }
  const material=ctx.createPattern(tile,'repeat'),wedge=document.createElement('canvas');
  return {
    draw(width,height,time,seed){
      const view=framing(width,height),pose=poseAt(time,seed),step=Math.PI*2/SEGMENTS;
      // One sampled wedge serves every mirrored sector, avoiding repeated raster work.
      const size=Math.ceil(view.radius)+6;
      if(wedge.width!==size){wedge.width=size;wedge.height=size;}
      const c=wedge.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,size,size);
      c.save();c.translate(2,size/2);c.beginPath();c.moveTo(-2,0);
      c.arc(0,0,view.radius,-step/2-.001,step/2+.001);c.closePath();c.clip();
      c.scale(view.scale,view.scale);c.translate(-pose.sx,-pose.sy);c.fillStyle=material;
      const extent=view.radius/view.scale+4;c.fillRect(pose.sx-extent,pose.sy-extent,extent*2,extent*2);c.restore();
      ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b39a69';ctx.fillRect(0,0,width,height);
      ctx.save();ctx.translate(view.x,view.y);
      for(let i=0;i<SEGMENTS;i++){
        ctx.save();ctx.rotate(i*step+pose.rotation);if(i%2)ctx.scale(1,-1);
        ctx.drawImage(wedge,-2,-size/2);ctx.restore();
      }
      ctx.restore();return {view,pose,sectors:SEGMENTS};
    },
    destroy(){panel.width=panel.height=tile.width=tile.height=wedge.width=wedge.height=0;}
  };
}
