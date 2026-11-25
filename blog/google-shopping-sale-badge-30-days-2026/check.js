(() => {
  'use strict';
  const form = document.getElementById('sp-check');
  const out = document.getElementById('sp-check-result');
  if (!form || !out) return;
  const num = n => Math.max(0, Number(form.elements.namedItem(n).value) || 0);
  const render = () => {
    const base = num('base'), sale = num('sale'), len = num('len'), hist = Math.min(200, num('hist'));
    const off = base > 0 ? (base - sale) / base * 100 : 0;
    const checks = [
      [off > 5 && off < 90, base > 0 && sale < base ? Math.round(off) + '% off: ' + (off > 5 && off < 90 ? 'inside the 5–90% range.' : 'outside the 5–90% range.') : 'The sale price must be lower than the original price.'],
      [hist >= 30, hist + ' days at full price in the past 200: ' + (hist >= 30 ? 'enough.' : 'needs at least 30.')],
      [len <= 30, len + '-day sale: ' + (len <= 30 ? 'within 30 days.' : 'longer than 30 days; end it sooner or split it with a full-price gap.')]
    ];
    const ok = checks.filter(c => c[0]).length;
    const level = ok === 3 ? 'hi' : ok === 2 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = ok + '/3';
    box.querySelector('strong').textContent = level === 'hi' ? 'Likely to keep the badge' : level === 'mid' ? 'At risk' : 'Unlikely to show the badge';
    box.querySelector('p').textContent = 'Saving: OMR ' + Math.max(0, base - sale).toFixed(1);
    const ul = box.querySelector('ul'); checks.forEach(([pass, t]) => { const li = document.createElement('li'); li.textContent = (pass ? '✓ ' : '✗ ') + t; ul.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
