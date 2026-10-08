(() => {
  'use strict';
  if (window.__portfolioActivity || /^\/(admin|api)(\/|$)/.test(location.pathname)) return;
  window.__portfolioActivity = true;
  const queue = [];
  let busy = false;
  const scrub = (text, max = 100) => String(text || '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]').replace(/\+?\d[\d ().-]{6,}\d/g, '[number]').replace(/\s+/g, ' ').trim().slice(0, max);
  const page = () => scrub(location.pathname, 240);
  const device = () => innerWidth < 768 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop';
  const target = (url) => !url ? '' : /^(mailto|tel|whatsapp):$/.test(url.protocol) ? url.protocol.slice(0, -1) : url.origin === location.origin ? scrub(url.pathname, 240) : /^https?:$/.test(url.protocol) ? url.hostname : '';
  function emit(event, detail = {}) {
    const item = { id: crypto.randomUUID(), event, page: page(), label: scrub(detail.label), target: detail.target || '', area: detail.area || 'content', device: device() };
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
    emit(name, detailFor(el, url));
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && queue.length && navigator.sendBeacon) {
      const batch = queue.splice(0, 20);
      if (!navigator.sendBeacon('/api/site-activity/', new Blob([JSON.stringify({ events: batch })], { type: 'application/json' }))) queue.unshift(...batch);
    } else flush();
  });
})();
