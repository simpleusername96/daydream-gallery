// Collect only ordinary production visits; owner opt-outs and automation skip both providers.
export function startAnalytics({id, host, page, cloudflareToken}) {
  const key = 'analytics-consent-v1';
  const production = location.hostname === host && location.protocol === 'https:';
  const exclusionKey = 'analytics-excluded-v1';
  const url = new URL(location.href);
  const mode = url.searchParams.get('analytics');
  let browserExcluded = false;
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try { if (window[storageName].getItem(exclusionKey) === '1') browserExcluded = true; } catch {}
  }
  if (mode === 'off' || mode === 'on') {
    browserExcluded = mode === 'off';
    const save = storage => browserExcluded ? storage.setItem(exclusionKey, '1') : storage.removeItem(exclusionKey);
    for (const storageName of ['localStorage', 'sessionStorage']) {
      try { save(window[storageName]); } catch {}
    }
    url.searchParams.delete('analytics');
    history.replaceState(history.state, '', url.href);
  }
  const excluded = browserExcluded || navigator.webdriver === true;
  let choice = null, loaded = false, cloudflareLoaded = false, previousPage = '', lastTitle = '';
  const listeners = new Set();
  const readChoice = () => {
    try { let value; try { value=localStorage.getItem(key); } catch { value=sessionStorage.getItem(key); } const saved = JSON.parse(value); return saved && saved.expires > Date.now() && ['granted','denied'].includes(saved.value) ? saved.value : null; }
    catch { return null; }
  };
  choice = readChoice();
  const allowed = () => production && !excluded && choice !== 'denied';
  function gtag() { window.dataLayer.push(arguments); }
  function safeUrl(value, campaign = false) {
    try {
      const url = new URL(value);
      if (!['https:','http:'].includes(url.protocol)) return '';
      const clean = new URL(url.origin + url.pathname);
      if (campaign) for (const name of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
        const value = url.searchParams.get(name);
        if (value && /^[a-zA-Z0-9_.~ -]{1,100}$/.test(value)) clean.searchParams.set(name,value);
      }
      return clean.href;
    } catch { return ''; }
  }
  const entryReferrer = safeUrl(document.referrer);
  function currentPage() {
    const selected = page();
    const pageUrl = new URL(location.href);
    if (selected.path) pageUrl.pathname = selected.path;
    return {page_location:safeUrl(pageUrl.href,true) + (selected.hash || ''), page_title:selected.title, content_id:selected.id || 'home', site_language:document.documentElement.lang};
  }
  function view() {
    if (!allowed()) return;
    const values=currentPage();
    if (values.page_location === previousPage && values.page_title === lastTitle) return;
    gtag('set', {...values, page_referrer:previousPage || entryReferrer});
    gtag('event','page_view',{...values,page_referrer:previousPage || entryReferrer});
    previousPage=values.page_location; lastTitle=values.page_title;
  }
  function activate() {
    if (!allowed()) return;
    window['ga-disable-'+id]=false;
    if (!loaded) {
      window.dataLayer = window.dataLayer || [];
      gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('js',new Date());
      gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_expires:180*24*60*60,page_location:safeUrl(location.href,true),page_referrer:entryReferrer});
      const script=document.createElement('script');
      script.async=true; script.src='https://www.googletagmanager.com/gtag/js?id='+id;
      document.head.append(script); loaded=true;
    } else gtag('consent','update',{analytics_storage:'granted'});
    if (cloudflareToken && !cloudflareLoaded) {
      const script = document.createElement('script');
      script.defer = true;
      script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      script.dataset.cfBeacon = JSON.stringify({token: cloudflareToken});
      document.head.append(script);
      cloudflareLoaded = true;
    }
    view();
  }
  function apply(value) {
    choice=value;
    if (value!=='denied') activate();
    else {
      window['ga-disable-'+id]=true;
      if (loaded) gtag('consent','update',{analytics_storage:'denied'});
      for (const cookie of document.cookie.split(';')) {
        const name=cookie.trim().split('=')[0];
        if (name==='_ga' || name.startsWith('_ga_')) document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax';
      }
      previousPage=''; lastTitle='';
    }
    for (const callback of listeners) callback(allowed());
  }
  // Preserve existing visitor opt-outs; new visits require no site prompt.
  window.addEventListener('storage',event=>{
    if (event.key === exclusionKey || event.key === null) { location.reload(); return; }
    if (event.key === key) {
      const next = readChoice();
      if (next === 'denied' && cloudflareLoaded) location.reload();
      else apply(next);
    }
  });
  const api={allowed,excluded:()=>excluded,view,onChange(callback){listeners.add(callback);return()=>listeners.delete(callback);},event(name,params={}){if(allowed())gtag('event',name,{...currentPage(),...params});}};
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]'); if(!anchor)return;
    const url=new URL(anchor.href);
    if(url.origin!==location.origin && ['http:','https:'].includes(url.protocol)) api.event('outbound_click',{link_domain:url.hostname,link_url:safeUrl(url.href)});
  });
  activate();
  return api;
}
