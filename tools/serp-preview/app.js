(function () {
  'use strict';
  const { $, $$, icon, esc, copy, segmented, steps } = window.TK;

  // Approximate Google limits (pixels) for snippet truncation.
  const LIMITS = { desktop: { title: 580, desc: 920, titleFont: '400 20px Arial, sans-serif', descFont: '400 14px Arial, sans-serif' }, mobile: { title: 540, desc: 680, titleFont: '400 18px Arial, sans-serif', descFont: '400 14px Arial, sans-serif' } };
  const el = {
    title: $('#spTitle'), desc: $('#spDesc'), url: $('#spUrl'), site: $('#spSite'), query: $('#spQuery'), date: $('#spDate'),
    titleBar: $('#spTitleBar'), titleMeta: $('#spTitleMeta'), descBar: $('#spDescBar'), descMeta: $('#spDescMeta'),
    preview: $('#spPreview'), checks: $('#spChecks'), code: $('#spCode'), copyCode: $('#spCopy'), example: $('#spExample')
  };
  const tracker = steps($('#tkSteps'));
  const device = segmented($('#spDevice'), render);
  const ctx = document.createElement('canvas').getContext('2d');
  const width = (text, font) => { ctx.font = font; return ctx.measureText(text).width; };

  function truncate(text, font, limit) {
    if (width(text, font) <= limit) return { text, cut: false };
    let lo = 0;
    let hi = text.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (width(`${text.slice(0, mid)} …`, font) <= limit) lo = mid; else hi = mid - 1; }
    const cut = text.slice(0, lo).replace(/\s+\S*$/, '') || text.slice(0, lo);
    return { text: `${cut} …`, cut: true };
  }

  function bold(text, q) {
    let out = esc(text);
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    words.forEach((w) => { out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<b>$1</b>'); });
    return out;
  }

  function crumbs(raw) {
    try {
      const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw || 'example.com'}`);
      const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      return { host: u.hostname.replace(/^www\./, ''), full: u.origin + u.pathname, path: [u.origin.replace(/^https?:\/\//, ''), ...parts].join(' › ') };
    } catch (e) { return { host: 'example.com', full: 'https://example.com', path: 'example.com' }; }
  }

  function meter(bar, meta, px, limit, chars) {
    const p = Math.min(100, (px / limit) * 100);
    bar.style.width = `${p}%`;
    bar.style.background = px > limit ? 'var(--tk-err)' : p > 85 ? 'var(--tk-ok)' : p > 50 ? 'var(--tk-warn)' : 'var(--tk-muted)';
    meta.textContent = `${chars} characters · ${Math.round(px)} / ${limit} px`;
  }

  function render() {
    const d = LIMITS[device.value];
    const title = el.title.value.trim() || 'Your page title appears here';
    const desc = el.desc.value.trim() || 'Write a meta description that tells searchers exactly what they get on this page and why it’s worth the click.';
    const c = crumbs(el.url.value.trim());
    const site = el.site.value.trim() || c.host.split('.')[0].replace(/^\w/, (m) => m.toUpperCase());
    const tw = width(el.title.value.trim(), d.titleFont);
    const dw = width(el.desc.value.trim(), d.descFont);
    meter(el.titleBar, el.titleMeta, tw, d.title, el.title.value.trim().length);
    meter(el.descBar, el.descMeta, dw, d.desc, el.desc.value.trim().length);
    const t = truncate(title, d.titleFont, d.title);
    const ds = truncate(desc, d.descFont, d.desc);
    const date = el.date.checked ? `<span class="sp-date">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — </span>` : '';
    el.preview.className = `sp-serp is-${device.value}`;
    el.preview.innerHTML = `
      <div class="sp-site"><span class="sp-fav">${esc(site.slice(0, 1).toUpperCase())}</span><span><b>${esc(site)}</b><small>${esc(c.path)}</small></span><span class="sp-dots">⋮</span></div>
      <a class="sp-title" href="${esc(c.full)}" target="_blank" rel="noopener">${esc(t.text)}</a>
      <p class="sp-desc">${date}${bold(ds.text, el.query.value)}</p>`;

    const checks = [];
    const tl = el.title.value.trim();
    const dl = el.desc.value.trim();
    if (!tl) checks.push(['info', 'Add a title to start.']);
    else {
      checks.push(tw > d.title ? ['warn', 'Title is too wide and will be cut off — trim it.'] : tl.length < 30 ? ['warn', 'Title is short — use the space to add a benefit or location.'] : ['ok', 'Title length looks good.']);
      const q = el.query.value.trim().toLowerCase();
      if (q) checks.push(tl.toLowerCase().includes(q) ? ['ok', 'Title contains your target keyword.'] : ['warn', 'Your target keyword isn’t in the title.']);
    }
    if (dl) checks.push(dw > d.desc ? ['warn', 'Description will be truncated — Google may also rewrite it.'] : dl.length < 70 ? ['warn', 'Description is short — add a reason to click.'] : ['ok', 'Description length looks good.']);
    if (dl && !/[.!?]$/.test(dl)) checks.push(['info', 'Tip: end the description with a full stop or a call to action.']);
    el.checks.innerHTML = checks.map(([k, m]) => `<div class="tk-note${k === 'info' ? '' : ` is-${k}`}">${icon(k === 'ok' ? 'checkc' : k === 'warn' ? 'alert' : 'info')}<span>${esc(m)}</span></div>`).join('');
    el.code.textContent = `<title>${tl}</title>\n<meta name="description" content="${dl.replace(/"/g, '&quot;')}">`;
    tracker.set(!tl ? 1 : !dl ? 2 : 3);
  }

  el.example.addEventListener('click', () => {
    el.title.value = 'Digital Marketing Agency in Muscat | SEO & Google Ads Experts';
    el.desc.value = 'Get more qualified leads in Oman with SEO, Google Ads and social media campaigns built around measurable results. Book a free 20-minute strategy call.';
    el.url.value = 'https://example.com/services/digital-marketing-muscat/';
    el.site.value = 'Example Agency';
    el.query.value = 'digital marketing muscat';
    render();
  });
  el.copyCode.addEventListener('click', () => copy(el.code.textContent, 'Meta tags copied'));
  $$('#spInputs input, #spInputs textarea').forEach((i) => i.addEventListener('input', render));
  el.date.addEventListener('change', render);
  if (document.fonts) document.fonts.ready.then(render);
  render();
})();
