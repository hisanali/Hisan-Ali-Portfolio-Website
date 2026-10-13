(() => {
  'use strict';
  if (window.__portfolioActivity || /^\/(admin|api)(\/|$)/.test(location.pathname)) return;
  window.__portfolioActivity = true;
  const queue = [];
  let busy = false, session = null, pageId = crypto.randomUUID(), precise = false;
  let lastInteraction = Date.now(), lastTick = Date.now(), maxScroll = 0;
  let entry = null;
  const preferenceKey = 'portfolio-journey-choice', sessionKey = 'portfolio-journey-session';
  const read = (key) => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
  let preference = null; try { preference = JSON.parse(localStorage.getItem(preferenceKey)); } catch {}
  function startSession() {
    const saved = read(sessionKey);
    const reuse = saved && Date.now()-saved.seen < 1800000;
    if(!reuse)try{sessionStorage.removeItem('portfolio-journey-entry');}catch{}
    session = reuse ? saved.id : crypto.randomUUID();
    touch();
  }
  function touch() { if (session) try { sessionStorage.setItem(sessionKey,JSON.stringify({id:session,seen:lastInteraction})); } catch {} }
  if (preference?.allowed && Date.now()-preference.at < 180*86400000) startSession();
  function interaction() {
    const expired=Date.now()-lastInteraction>1800000;lastInteraction=Date.now();
    if(session&&expired){try{sessionStorage.removeItem(sessionKey);sessionStorage.removeItem('portfolio-journey-entry');}catch{}entry=null;startSession();pageId=crypto.randomUUID();lastTick=Date.now();maxScroll=0;emit('page_view',{label:'New visit after inactivity'});}
  }
  const context = () => {
    const ua = navigator.userAgent;
    let referrer = ''; try { referrer = new URL(document.referrer).hostname; } catch {}
    const params = new URLSearchParams(location.search);
    if(!entry){entry=read('portfolio-journey-entry') || {referrer,source:params.get('utm_source')||'',medium:params.get('utm_medium')||'',campaign:params.get('utm_campaign')||''};if(session)try{sessionStorage.setItem('portfolio-journey-entry',JSON.stringify(entry));}catch{}}
    return { state:document.hidden ? 'away' : Date.now()-lastInteraction>60000 ? 'idle' : 'active',
      browser:/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Other',
      os:/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Other',
      language:navigator.language, ...entry };
  };
  const scrub = (text, max = 100) => String(text || '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]').replace(/\+?\d[\d ().-]{6,}\d/g, '[number]').replace(/\s+/g, ' ').trim().slice(0, max);
  const page = () => scrub(location.pathname, 240);
  const device = () => innerWidth < 768 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop';
  const target = (url) => !url ? '' : /^(mailto|tel|whatsapp):$/.test(url.protocol) ? url.protocol.slice(0, -1) : url.origin === location.origin ? scrub(url.pathname, 240) : /^https?:$/.test(url.protocol) ? url.hostname : '';
  function emit(event, detail = {}) {
    const item = { id: crypto.randomUUID(), event, page: page(), label: scrub(detail.label), target: detail.target || '', area: detail.area || 'content', device: device(), ...(session ? {consent:true, session_id:session,page_id:pageId,metadata:{...context(),...detail.metadata}} : {}) };
    touch();
    if (queue.length < 100) queue.push(item);
    if (['lead_whatsapp','lead_email','lead_phone','lead_form','cta_contact','file_download'].includes(event)) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, lead_location: page(), link_text: item.label, ...(event === 'lead_form' ? { form_name: 'contact_form' } : {}), ...(event === 'file_download' ? { file_url: item.target } : {}) });
    }
    flush();
  }
  async function flush() {
    if (busy || !queue.length) return;
    busy = true; const batch = queue.splice(0, 20);
    try {
      const response = await fetch('/api/site-activity/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: batch }), credentials: 'omit', keepalive: true });
      if (!response.ok && response.status >= 500) queue.unshift(...batch);
    } catch { queue.unshift(...batch); }
    finally { queue.splice(100); busy = false; }
  }
  // Labels from user-editable surfaces are never read. IDs and generic control types suffice there.
  const controls = 'a[href],button,summary,input,select,textarea,[role="button"],[role="tab"],[role="switch"],[role="checkbox"],[onclick],[data-analytics-label],canvas';
  function detailFor(el, url) {
    const sensitive = !el.matches(controls) || el.closest('form,[contenteditable],.ct-chat-log,.ct-composer,[data-analytics-private]');
    return { label: sensitive ? (el.getAttribute('data-analytics-label') || `${el.tagName.toLowerCase()} control`) : (el.getAttribute('data-analytics-label') || el.getAttribute('aria-label') || (/^(INPUT|SELECT|TEXTAREA|CANVAS)$/.test(el.tagName) ? el.tagName.toLowerCase() + ' control' : el.textContent)), target: target(url), area: el.closest('header') ? 'header' : el.closest('footer') ? 'footer' : sensitive ? 'form' : 'content' };
  }
  function click(event) {
    const el = event.target?.closest?.(controls) || event.target;
    if (!el?.tagName || el.closest('[data-analytics-ignore]')) return;
    let url; try { if (el.matches('a[href]')) url = new URL(el.getAttribute('href'), location.href); } catch {}
    let name = 'site_click';
    if (url?.protocol === 'whatsapp:' || ['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url?.hostname)) name = 'lead_whatsapp';
    else if (url?.protocol === 'mailto:' && url.pathname) name = 'lead_email';
    else if (url?.protocol === 'tel:') name = 'lead_phone';
    else if (el.hasAttribute('download') || /\.(pdf|zip|docx?|xlsx?|csv|ics)$/i.test(url?.pathname || '')) name = 'file_download';
    else if (url?.origin === location.origin && /^\/contact\/?$/.test(url.pathname)) name = 'cta_contact';
    interaction();
    const detail = detailFor(el,url); emit(name, detail);
    if (session) {
      const stamp = Date.now(), key = detail.label + detail.target;
      click.recent = (click.recent || []).filter(x => stamp-x.at < 1500); click.recent.push({at:stamp,key});
      if (click.recent.filter(x=>x.key===key).length===3) emit('rage_click',{...detail,label:'Repeated clicks: '+detail.label});
    }
  }
  document.addEventListener('click', click, true);
  document.addEventListener('auxclick', event => { if (event.button === 1) click(event); }, true);
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.matches?.('select,input[type="checkbox"],input[type="radio"],input[type="range"]') && !el.closest('[data-analytics-ignore]')) emit('control_change', detailFor(el));
  }, true);
  document.addEventListener('submit', event => {
    if (!event.target.matches?.('form') || event.target.closest('[data-analytics-ignore]')) return;
    emit(event.target.matches('form[data-lead-form]') ? 'lead_form' : 'form_submit', { label: 'Form submission attempt', area: 'form' });
  }, true);
  document.addEventListener('portfolio:lead-submitted', () => emit('lead_form', { label: 'Contact brief sent', area: 'form' }));
  emit('page_view', { label: 'Page opened' });
  window.addEventListener('popstate', () => emit('page_view', { label: 'Page opened' }));
  setInterval(flush, 3000);
  const tick = (exit = false) => {
    if (!session) return;
    const now = Date.now(), elapsed = Math.min(30,(now-lastTick)/1000); lastTick=now;
    emit(exit ? 'page_exit' : 'heartbeat',{label:exit?'Page left':'Visit heartbeat',metadata:{...(exit?{state:'away'}:{}),active_seconds:!document.hidden && now-lastInteraction<60000 ? Math.round(elapsed) : 0,scroll:maxScroll}});
  };
  setInterval(()=>{if(!document.hidden && Date.now()-lastInteraction<1800000)tick();},15000);
  document.addEventListener('pointerdown',()=>{interaction();},{passive:true});
  document.addEventListener('keydown',()=>{interaction();});
  window.addEventListener('scroll',()=>{
    interaction(); if (!session) return;
    const range=document.documentElement.scrollHeight-innerHeight;
    const depth=range>0 ? Math.min(100,Math.round(scrollY/range*100)) : 100;
    const milestone=Math.floor(depth/25)*25;
    if(milestone>maxScroll){maxScroll=milestone;emit('scroll_depth',{label:milestone+'% of page',metadata:{scroll:milestone}});}
  },{passive:true});
  window.addEventListener('pagehide',()=>{tick(true);beacon();});
  window.portfolioJourney = { session: () => session };
  function beacon(){ if(queue.length && navigator.sendBeacon){const batch=queue.splice(0,20);if(!navigator.sendBeacon('/api/site-activity/',new Blob([JSON.stringify({events:batch})],{type:'application/json'})))queue.unshift(...batch);} }
  function privacyUI() {
    const style=document.createElement('link');style.rel='stylesheet';style.href='/journey-privacy.css?v=20261013';document.head.append(style);
    const box=document.createElement('section');box.className='journey-privacy';box.setAttribute('data-analytics-ignore','');box.setAttribute('aria-label','Website analytics privacy');
    box.innerHTML='<button class="jp-open" type="button">Privacy settings</button><div class="jp-panel" hidden><strong>Help improve this website</strong><p>Allow Hisan to see your anonymous page journey, clicks, time spent, device and approximate city in his private dashboard for 30 days. We never record what you type. Basic action counts continue without a visit ID.</p><div class="jp-actions"><button type="button" data-choice="allow">Allow journey analytics</button><button type="button" data-choice="basic">Basic only</button></div><div class="jp-location" hidden><p>Optional: share your precise location with Hisan for this visit. Your browser will ask permission. You can remove it here.</p><button type="button" data-choice="location">Share my location</button><button type="button" data-choice="revoke" hidden>Remove shared location</button></div><small class="jp-status" role="status"></small><button type="button" class="jp-close">Close</button></div>';
    document.body.append(box);const panel=box.querySelector('.jp-panel'),locationBox=box.querySelector('.jp-location'),status=box.querySelector('.jp-status');
    const show=()=>{panel.hidden=false;locationBox.hidden=!session;box.querySelector('[data-choice="revoke"]').hidden=!session;};
    box.querySelector('.jp-open').onclick=show;box.querySelector('.jp-close').onclick=()=>{panel.hidden=true;};
    if(!preference || Date.now()-preference.at>=180*86400000)show();
    box.addEventListener('click',event=>{
      const choice=event.target.dataset.choice;if(!choice)return;
      if(choice==='allow'||choice==='basic'){
        if(choice==='basic'&&session)emit('location_revoked',{label:'Journey analytics disabled'});
        preference={allowed:choice==='allow',at:Date.now()};try{localStorage.setItem(preferenceKey,JSON.stringify(preference));}catch{}
        if(preference.allowed){if(!session){startSession();lastTick=Date.now();emit('page_view',{label:'Journey analytics enabled'});}}else{session=null;precise=false;try{sessionStorage.removeItem(sessionKey);sessionStorage.removeItem('portfolio-journey-entry');entry=null;}catch{}}
        locationBox.hidden=!session;status.textContent=preference.allowed?'Anonymous journeys enabled. Precise location is off unless you share it.':'Basic action counts only. Your visit is not linked across pages.';panel.hidden=true;
      }
      if(choice==='location' && session){
        if(!navigator.geolocation){status.textContent='Location is unavailable in this browser.';return;}
        status.textContent='Waiting for your browser location permission…';
        const sharingSession=session;
        navigator.geolocation.getCurrentPosition(position=>{
          if(!session||session!==sharingSession)return;precise=true;emit('location_shared',{label:'Visitor shared location',metadata:{location_consent:true,latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy}});
          box.querySelector('[data-choice="revoke"]').hidden=false;status.textContent='Location shared for this visit. Accuracy: approximately '+Math.round(position.coords.accuracy)+' metres.';
        },()=>{status.textContent='Location was not shared. You can keep using the website.';},{enableHighAccuracy:true,timeout:10000,maximumAge:0});
      }
      if(choice==='revoke'&&session){precise=false;emit('location_revoked',{label:'Visitor removed shared location'});event.target.hidden=true;status.textContent='Shared coordinates removed from this visit.';}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',privacyUI);else privacyUI();
  document.addEventListener('visibilitychange', () => {
    if (session) tick();
    if (document.hidden && queue.length && navigator.sendBeacon) {
      const batch = queue.splice(0, 20);
      if (!navigator.sendBeacon('/api/site-activity/', new Blob([JSON.stringify({ events: batch })], { type: 'application/json' }))) queue.unshift(...batch);
    } else flush();
  });
})();
