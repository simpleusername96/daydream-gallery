import { startWorld } from '../living/player.js';

// The authored field retains the archive's flat central/peripheral flower hierarchy.
// Motion opens drawn motifs locally; it does not travel through or mirror a source photo.
const fragment = `
precision highp float;
varying vec2 uv;
uniform sampler2D art;
uniform float time;
uniform vec4 variation,crop;
float field(vec2 p,vec2 center,vec2 extent){return 1.-smoothstep(.50,1.,length((p-center)/extent));}
vec2 opening(vec2 p,vec2 center,vec2 extent,float phase,float amount){
 return (p-center)*sin(time*.31+phase)*amount*field(p,center,extent);
}
void main(){
 vec2 p=crop.xy+uv*crop.zw;
 vec2 center=vec2(.514,.516),d=p-center;
 float envelope=field(p,center,vec2(.32,.45));
 float phase=variation.x*6.283185;
 float unfold=(sin(time*.34+phase)*.72+sin(time*.17+1.4+phase)*.28)*(.018+variation.y*.01);
 vec2 shift=d*unfold*envelope;
 shift+=opening(p,vec2(.025,.574),vec2(.19,.22),phase+1.1,.015);
 shift+=opening(p,vec2(.946,.445),vec2(.17,.24),phase+2.3,.014);
 shift+=opening(p,vec2(.823,.057),vec2(.21,.20),phase+3.4,.012);
 shift+=opening(p,vec2(.192,.026),vec2(.17,.15),phase+4.1,.012);
 shift+=opening(p,vec2(.207,.945),vec2(.20,.19),phase+2.7,.013);
 shift+=opening(p,vec2(.767,.984),vec2(.22,.18),phase+.4,.013);
 vec3 color=texture2D(art,p-shift).rgb;
 color*=vec3(.98+variation.z*.02,.975+variation.w*.025,.97+variation.z*.03);
 gl_FragColor=vec4(color,1.);
}
`;
startWorld({id:'peonies',fragment,focus:.51});
