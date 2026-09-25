(() => {
  'use strict';
  const form = document.getElementById('bs-ratio-form');
  const out = document.getElementById('bs-ratio-result');
  const error = document.getElementById('bs-ratio-error');
  if (!form || !out) return;
  const num = name => form.elements.namedItem(name).value.trim();
  const fmt = v => Math.round(v).toLocaleString('en-OM');
  const render = () => {
    const brand = Number(num('brand')), generic = Number(num('generic'));
    const prevRaw = num('prev'), prev = prevRaw === '' ? null : Number(prevRaw);
    const bad = [brand, generic].some(v => !Number.isFinite(v) || v < 0) || (prev !== null && (!Number.isFinite(prev) || prev < 0)) || brand + generic === 0;
    if (bad) { error.hidden = false; error.textContent = 'Enter non-negative click numbers, with at least some clicks in total.'; out.hidden = true; return; }
    error.hidden = true; out.hidden = false;
    const share = brand / (brand + generic) * 100;
    const growth = prev ? (brand - prev) / prev * 100 : null;
    let reading;
    if (share < 15) reading = 'People find you for topics more than for your name. Work on brand memory: a clear name in every ad and consistent visuals.';
    else if (share <= 50) reading = 'A healthy mix of discovery and demand. Keep both growing and watch the yearly trend.';
    else reading = 'People know you, but you rely on existing demand. Reach new audiences with non-branded SEO and prospecting ads.';
    if (growth !== null) reading += growth > 5 ? ' Branded clicks are growing year on year: your marketing is building memory.' : growth < -5 ? ' Branded clicks are down year on year: check what changed in your visibility, offline presence and reviews.' : ' Branded clicks are roughly flat year on year.';
    out.innerHTML = `<div class="bs-gauge" aria-hidden="true"><i style="left:${Math.min(100, share).toFixed(1)}%"></i></div><div class="bs-gauge-labels" aria-hidden="true"><span>0%</span><span>15%</span><span>50%</span><span>100%</span></div><div class="bs-result-grid"><div><span>Branded share</span><strong>${share.toFixed(1)}%</strong></div><div><span>Total clicks</span><strong>${fmt(brand + generic)}</strong></div><div><span>Branded, year on year</span><strong>${growth === null ? '—' : (growth >= 0 ? '+' : '') + growth.toFixed(0) + '%'}</strong></div></div><p></p>`;
    out.querySelector('p').textContent = reading;
  };
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  render();
})();
