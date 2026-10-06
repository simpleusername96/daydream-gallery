import {startAnalytics} from './analytics-core.js';
import {WORLDS} from './worlds.js';
export const analytics=startAnalytics({id:'G-FX8HRJWNYK',host:'daydream.mmonoo.com',page:()=>{const world=WORLDS[location.hash.slice(1)];return {id:world?.id||'home',title:world ? world.label+' — Daydream Gallery' : 'Daydream Gallery',hash:world ? '#'+world.id : ''};}});
