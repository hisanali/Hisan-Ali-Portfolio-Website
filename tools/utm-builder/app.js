(function () {
  'use strict';
  const { $, $$, esc, copy, toast } = window.TK;

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
    copy: $('#utCopy'), open: $('#utOpen'), qr: $('#utQr'), table: $('#utTable'), save: $('#utSave'), history: $('#utHistory'), historyWrap: $('#utHistoryWrap'), clearHist: $('#utClearHist'), reset: $('#utReset')
  };
  const input = (k) => $(`#ut-${k}`);

  const norm = (v) => (el.normalize.checked ? v.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w\-.~%]/g, '') : v.trim());

  function build() {
    const msgs = [];
    let raw = el.base.value.trim();
    let url = null;
    if (raw) {
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      try { url = new URL(raw); if (!url.hostname.includes('.') && url.hostname !== 'localhost') throw 0; } catch (e) { url = null; }
    }
    el.base.classList.toggle('is-invalid', !!el.base.value.trim() && !url);
    el.baseMsg.textContent = el.base.value.trim() && !url ? 'Enter a valid page address, e.g. https://example.com/offer' : '';
    const vals = {};
    KEYS.forEach((k) => { vals[k] = norm(input(k).value); });
    const missing = ['source', 'medium', 'campaign'].filter((k) => !vals[k]);
    if (!url) {
      el.out.textContent = 'Your tracking link will appear here.';
      el.out.classList.add('is-placeholder');
      setEnabled(false);
      el.table.innerHTML = '';
      el.msgs.innerHTML = '';
      return null;
    }
    // Replace any existing UTM params, keep everything else (including #hash).
    KEYS.forEach((k) => url.searchParams.delete(`utm_${k}`));
    KEYS.forEach((k) => { if (vals[k]) url.searchParams.set(`utm_${k}`, vals[k]); });
    const result = url.toString();
    el.out.textContent = result;
    el.out.classList.remove('is-placeholder');
    if (missing.length) msgs.push(['warn', `Add ${missing.map((m) => `utm_${m}`).join(', ')} — GA4 needs source, medium and campaign to attribute traffic properly.`]);
    KEYS.forEach((k) => { const v = input(k).value; if (!el.normalize.checked && /[A-Z]/.test(v)) msgs.push(['warn', `utm_${k} has capital letters. GA4 is case-sensitive, so “Facebook” and “facebook” become separate sources.`]); });
    if (/^(cpc|ppc)$/i.test(vals.medium) && /facebook|instagram|meta|tiktok|linkedin|snapchat|twitter/i.test(vals.source)) msgs.push(['info', 'For paid social campaigns, a medium of “paid_social” maps to GA4’s Paid Social channel.']);
    if (/utm_/i.test(el.base.value)) msgs.push(['info', 'Existing UTM parameters in the page URL were replaced.']);
    if (result.length > 2000) msgs.push(['warn', 'This link is very long. Some platforms truncate URLs over 2,000 characters.']);
    if (!missing.length && !msgs.length) msgs.push(['ok', 'Looks good — ready to use in your campaign.']);
    el.msgs.innerHTML = msgs.map(([t, m]) => `<div class="tk-note${t === 'info' ? '' : ` is-${t}`}"><span class="fas ${t === 'ok' ? 'fa-circle-check' : t === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-info'}" aria-hidden="true"></span><span>${esc(m)}</span></div>`).join('');
    el.table.innerHTML = Array.from(url.searchParams).filter(([k]) => k.startsWith('utm_')).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
    setEnabled(true);
    return { url: result, missing };
  }

  function setEnabled(on) { [el.copy, el.open, el.qr, el.save].forEach((b) => { b.disabled = !on; }); }

  [el.base, ...KEYS.map(input)].forEach((i) => i.addEventListener('input', build));
  el.normalize.addEventListener('change', build);
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.preset];
    input('source').value = p.source;
    input('medium').value = p.medium;
    $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    build();
    input('campaign').focus();
  }));

  el.copy.addEventListener('click', () => { const r = build(); if (r) { copy(r.url); remember(r.url); } });
  el.open.addEventListener('click', () => { const r = build(); if (r) window.open(r.url, '_blank', 'noopener'); });
  el.qr.addEventListener('click', () => { const r = build(); if (r) location.href = `/tools/qr-code-generator/?url=${encodeURIComponent(r.url)}`; });
  el.save.addEventListener('click', () => { const r = build(); if (r) { remember(r.url); toast('Saved to recent links'); } });
  el.reset.addEventListener('click', () => { [el.base, ...KEYS.map(input)].forEach((i) => { i.value = ''; }); $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', 'false')); build(); el.base.focus(); });

  function readHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { return []; } }
  function writeHistory(h) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 12))); } catch (e) { /* storage unavailable */ } }
  function remember(url) { writeHistory([{ url, at: Date.now() }, ...readHistory().filter((h) => h.url !== url)]); renderHistory(); }
  function renderHistory() {
    const h = readHistory();
    el.historyWrap.hidden = !h.length;
    el.history.innerHTML = h.map((x, i) => {
      const u = new URL(x.url);
      return `<li class="tk-item" style="grid-template-columns:minmax(0,1fr) auto;padding:10px 12px"><div class="tk-item-main"><span class="tk-item-name">${esc(u.searchParams.get('utm_campaign') || u.hostname)}</span><div class="tk-item-meta"><span class="tk-mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${esc(x.url)}</span></div></div>
      <div class="tk-item-tools"><button class="tk-icon-btn" type="button" data-h-load="${i}" title="Edit" aria-label="Load into builder"><span class="fas fa-pen" aria-hidden="true"></span></button><button class="tk-icon-btn" type="button" data-h-copy="${i}" title="Copy" aria-label="Copy"><span class="fas fa-copy" aria-hidden="true"></span></button><button class="tk-icon-btn is-danger" type="button" data-h-del="${i}" title="Remove" aria-label="Remove"><span class="fas fa-xmark" aria-hidden="true"></span></button></div></li>`;
    }).join('');
  }
  el.history.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const h = readHistory();
    if (b.dataset.hCopy) copy(h[b.dataset.hCopy].url);
    if (b.dataset.hDel) { h.splice(b.dataset.hDel, 1); writeHistory(h); renderHistory(); }
    if (b.dataset.hLoad) {
      const u = new URL(h[b.dataset.hLoad].url);
      KEYS.forEach((k) => { input(k).value = u.searchParams.get(`utm_${k}`) || ''; u.searchParams.delete(`utm_${k}`); });
      el.base.value = u.toString();
      build();
      window.scrollTo({ top: el.base.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' });
    }
  });
  el.clearHist.addEventListener('click', () => { writeHistory([]); renderHistory(); });

  renderHistory();
  build();
})();
