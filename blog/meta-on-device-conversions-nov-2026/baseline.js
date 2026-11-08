(() => {
  'use strict';
  const form = document.getElementById('md-calc');
  const out = document.getElementById('md-calc-result');
  if (!form || !out) return;
  const n = (k) => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const omr = (x) => isFinite(x) ? 'OMR ' + (Math.round(x * 100) / 100).toLocaleString('en-US') : '–';
  const pct = (a, b) => (a > 0 ? (b / a - 1) * 100 : 0);
  const sign = (x) => (x > 0 ? '+' : '') + Math.round(x) + '%';
  const render = () => {
    const s1 = n('spend1'), s2 = n('spend2'), m1 = n('meta1'), m2 = n('meta2'), r1 = n('real1'), r2 = n('real2');
    const metaChange = pct(m1, m2), realChange = pct(r1, r2);
    const rows = [
      ['Cost per purchase, Meta before', omr(m1 ? s1 / m1 : Infinity)],
      ['Cost per purchase, Meta after', omr(m2 ? s2 / m2 : Infinity)],
      ['Cost per real order before', omr(r1 ? s1 / r1 : Infinity)],
      ['Cost per real order after', omr(r2 ? s2 / r2 : Infinity)],
      ['Change in Meta purchases', sign(metaChange)],
      ['Change in real orders', sign(realChange)]
    ];
    out.innerHTML = '<div class="md-rows"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const list = out.querySelector('.md-rows');
    rows.forEach(([a, b]) => { const d = document.createElement('div'); d.className = 'md-row'; d.innerHTML = '<span></span><strong></strong>'; d.querySelector('span').textContent = a; d.querySelector('strong').textContent = b; list.append(d); });
    const gap = metaChange - realChange;
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = sign(gap);
    if (gap > 5) {
      box.classList.add('mid');
      box.querySelector('strong').textContent = 'Meta is reporting more than your real orders grew';
      box.querySelector('p').textContent = 'Most of this rise is likely better measurement, not new sales. Keep budgets steady and judge campaigns by real orders.';
    } else if (gap < -5) {
      box.classList.add('lo');
      box.querySelector('strong').textContent = 'Real orders grew faster than Meta reports';
      box.querySelector('p').textContent = 'Meta may be missing conversions. Check the pixel, the Conversions API and that the setting is on.';
    } else {
      box.classList.add('hi');
      box.querySelector('strong').textContent = 'Meta and your real orders moved together';
      box.querySelector('p').textContent = 'The numbers line up, so changes in reported results are likely real.';
    }
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
