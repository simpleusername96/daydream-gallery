import {startAnalytics} from './analytics-core.js';
import {WORLDS} from './worlds.js';
export const analytics=startAnalytics({id:'G-FX8HRJWNYK',host:'ambient-worlds.pages.dev',copy:{"title":"방문 통계","body":"동의하면 Google Analytics로 유입 경로와 페이지·기능 이용을 분석합니다. 거절해도 모든 기능을 사용할 수 있습니다.","accept":"허용","decline":"거절","privacy":"개인정보 안내","settings":"통계 설정"},privacyUrl:'/privacy.html',settingsParent:'.aboutCopy',page:()=>{const world=WORLDS[location.hash.slice(1)];return {id:world?.id||'home',title:world ? world.label+' — Ambient Worlds' : 'Ambient Worlds',hash:world ? '#'+world.id : ''};}});
