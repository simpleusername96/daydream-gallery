import {PAPER_TEXTURE_DEFAULT} from './papers.js';
// Internal material parameters. The retired comparison UI and browser overrides
// are intentionally not read by the scene; playback always uses these defaults.
// User's 2026-09-27 settings screenshot, reconfirmed 2026-09-28.
const PARAMETERS={strength:[0,100,1,PAPER_TEXTURE_DEFAULT],density:[.75,2,.05,2],detail:[.5,2.5,.05,1],marks:[0,24,1,24],balance:[0,100,1,100]};
export const PAPER_DEFAULTS=Object.freeze(Object.fromEntries(Object.entries(PARAMETERS).map(([key,p])=>[key,p[3]])));
export function normalizePaperSettings(input={}){
 return Object.fromEntries(Object.entries(PARAMETERS).map(([key,[min,max,step,fallback]])=>{
  const n=input?.[key],value=typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
  return [key,Number((Math.round(value/step)*step).toFixed(2))];
 }));
}
