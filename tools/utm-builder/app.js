(function () {
  'use strict';
  const { $, $$, icon, esc, copy, toast, steps, dock } = window.TK;

  const KEYS = ['source', 'medium', 'campaign', 'id', 'term', 'content'];
  const PRESETS = {
    google: { source: 'google', medium: 'cpc' },
    meta: { source: 'facebook', medium: 'paid_social' },
    instagram: { source: 'instagram', medium: 'social' },
    linkedin: { source: 'linkedin', medium: 'social' },
    tiktok: { source: 'tiktok', medium: 'paid_social' },
    newsletter: { source: 'newsletter', medium: 'email' },
    whatsapp: { source: 'whatsapp', medium: 'messaging' },
    qr: { source: 'qr_code', medium: 'print' }
  };
  const HISTORY_KEY = 'utm-builder-history-v2';

  const el = {
    base: $('#utBase'), baseMsg: $('#utBaseMsg'), normalize: $('#utNormalize'), out: $('#utOut'), msgs: $('#utMsgs'),
    copy: $('#utCopy'), open: $('#utOpen'), qr: $('#utQr'), table: $('#utTable'), save: $('#utSave'),
    history: $('#utHistory'), historyWrap: $('#utHistoryWrap'), clearHist: $('#utClearHist'), reset: $('#utReset'), example: $('#utExample')
  };
  const input = (k) => $(`#ut-${k}`);
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.copy, () => 'Your tracking link is ready');
  let copied = false;

  const norm = (v) => (el.normalize.checked ? v.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w\-.~%]/g, '') : v.trim());

  function build() {
    let raw = el.base.value.trim();
    let url = null;
    if (raw) {
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      try { url = new URL(raw); if (!url.hostname.includes('.') && url.hostname !== 'localhost') throw 0; } catch (e) { url = null; }
    }
    const invalid = !!el.base.value.trim() && !url;
    el.base.classList.toggle('is-invalid', invalid);
    el.baseMsg.textContent = invalid ? 'Enter a full page address, e.g. https://example.com/offer' : '';
    const vals = {};
    KEYS.forEach((k) => { vals[k] = norm(input(k).value); });
    const missing = ['source', 'medium', 'campaign'].filter((k) => !vals[k]);
    if (!url) {
      el.out.textContent = 'Add a page URL and your campaign tags — the link builds itself here.';
      el.out.classList.add('is-placeholder');
      [el.copy, el.open, el.qr, el.save].forEach((b) => { b.disabled = true; });
      el.table.innerHTML = '';
      el.msgs.innerHTML = '';
      tracker.set(1);
      mobile.refresh();
      return null;
    }
    const hadUtm = Array.from(url.searchParams.keys()).some((k) => k.startsWith('utm_'));
    KEYS.forEach((k) => url.searchParams.delete(`utm_${k}`));
    KEYS.forEach((k) => { if (vals[k]) url.searchParams.set(`utm_${k}`, vals[k]); });
    const result = url.toString();
    el.out.classList.remove('is-placeholder');
    el.out.innerHTML = esc(result).replace(/(utm_[a-z]+=)([^&#]*)/g, '$1<mark>$2</mark>');

    const msgs = [];
    if (missing.length) msgs.push(['warn', `Add ${missing.map((m) => `utm_${m}`).join(', ')} — GA4 needs source, medium and campaign to attribute traffic.`]);
    if (!el.normalize.checked) KEYS.forEach((k) => { if (/[A-Z]/.test(input(k).value)) msgs.push(['warn', `utm_${k} has capital letters. GA4 is case-sensitive, so “Facebook” and “facebook” would show as separate sources.`]); });
    if (/^(cpc|ppc)$/i.test(vals.medium) && /facebook|instagram|meta|tiktok|linkedin|snapchat|twitter/i.test(vals.source)) msgs.push(['info', 'For paid social, a medium of “paid_social” lands in GA4’s Paid Social channel.']);
    if (hadUtm) msgs.push(['info', 'Existing UTM tags in the page URL were replaced.']);
    if (result.length > 2000) msgs.push(['warn', 'This link is very long — some platforms cut off URLs over 2,000 characters.']);
    if (!missing.length && !msgs.length) msgs.push(['ok', 'Looks good — ready to use in your campaign.']);
    el.msgs.innerHTML = msgs.map(([t, m]) => `<div class="tk-note${t === 'info' ? '' : ` is-${t}`}">${icon(t === 'ok' ? 'checkc' : t === 'warn' ? 'alert' : 'info')}<span>${esc(m)}</span></div>`).join('');
    el.table.innerHTML = Array.from(url.searchParams).filter(([k]) => k.startsWith('utm_')).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
    [el.copy, el.open, el.qr, el.save].forEach((b) => { b.disabled = false; });
    tracker.set(missing.length ? 2 : copied ? 4 : 3);
    mobile.refresh();
    return { url: result, missing };
  }

  [el.base, ...KEYS.map(input)].forEach((i) => i.addEventListener('input', () => { copied = false; build(); }));
  el.normalize.addEventListener('change', build);
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.preset];
    input('source').value = p.source;
    input('medium').value = p.medium;
    $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    build();
    if (!input('campaign').value) input('campaign').focus();
  }));

  el.copy.addEventListener('click', () => {
    const r = build();
    if (!r) return;
    copy(r.url, r.missing.length ? 'Copied — but add the missing tags for clean reports' : 'Tracking link copied');
    remember(r.url);
    copied = true;
    tracker.set(r.missing.length ? 2 : 4);
  });
  el.open.addEventListener('click', () => { const r = build(); if (r) window.open(r.url, '_blank', 'noopener'); });
  el.qr.addEventListener('click', () => { const r = build(); if (r) location.href = `/tools/qr-code-generator/?url=${encodeURIComponent(r.url)}`; });
  el.save.addEventListener('click', () => { const r = build(); if (r) { remember(r.url); toast('Saved to recent links'); } });
  el.reset.addEventListener('click', () => {
    [el.base, ...KEYS.map(input)].forEach((i) => { i.value = ''; });
    $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    copied = false;
    build();
    el.base.focus();
  });
  el.example.addEventListener('click', () => {
    el.base.value = 'https://example.com/summer-sale';
    const vals = { source: 'instagram', medium: 'paid_social', campaign: 'summer_sale_2026', id: '', content: 'story_ad_a', term: '' };
    KEYS.forEach((k) => { input(k).value = vals[k]; });
    $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    copied = false;
    build();
  });

  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { return []; } }
  function writeHistory(h) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 12))); } catch (e) { /* storage unavailable */ } }
  function remember(url) { writeHistory([{ url, at: Date.now() }, ...readHistory().filter((h) => h.url !== url)]); renderHistory(); }
  function renderHistory() {
    const h = readHistory();
    el.historyWrap.hidden = !h.length;
    el.history.innerHTML = h.map((x, i) => {
      let label = x.url;
      try { const u = new URL(x.url); label = u.searchParams.get('utm_campaign') || u.hostname; } catch (e) { /* keep raw */ }
      return `<li class="tk-item" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 10px 12px 16px;background:var(--tk-card)"><div class="tk-item-main"><span class="tk-item-name">${esc(label)}</span><div class="tk-help" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:2px">${esc(x.url)}</div></div>
      <div class="tk-item-tools"><button class="tk-iconbtn" type="button" data-h-load="${i}" title="Edit" aria-label="Load into the builder">${icon('pen')}</button><button class="tk-iconbtn" type="button" data-h-copy="${i}" title="Copy" aria-label="Copy link">${icon('copy')}</button><button class="tk-iconbtn is-danger" type="button" data-h-del="${i}" title="Remove" aria-label="Remove">${icon('x')}</button></div></li>`;
    }).join('');
  }
  el.history.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const h = readHistory();
    if (b.dataset.hCopy) copy(h[b.dataset.hCopy].url, 'Link copied');
    if (b.dataset.hDel) { h.splice(b.dataset.hDel, 1); writeHistory(h); renderHistory(); }
    if (b.dataset.hLoad) {
      const u = new URL(h[b.dataset.hLoad].url);
      KEYS.forEach((k) => { input(k).value = u.searchParams.get(`utm_${k}`) || ''; u.searchParams.delete(`utm_${k}`); });
      el.base.value = u.toString();
      build();
      el.base.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  el.clearHist.addEventListener('click', () => { writeHistory([]); renderHistory(); });

  renderHistory();
  build();
})();
