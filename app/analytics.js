import {startAnalytics} from './analytics-core.js?v=scenes-20261009';
import {WORLD_ORDER,WORLDS} from './worlds.js';
import {sceneFromLocation,scenePath} from './routes.js';
export const analytics=startAnalytics({id:'G-FX8HRJWNYK',cloudflareToken:'3c964a864ed444eba3134148b94c96e3',host:'daydream.mmonoo.com',page:()=>{const world=WORLDS[sceneFromLocation(location,WORLD_ORDER)];return {id:world?.id||'home',title:world ? world.label+' — Daydream Gallery' : 'Daydream Gallery',path:scenePath(world?.id)};}});
