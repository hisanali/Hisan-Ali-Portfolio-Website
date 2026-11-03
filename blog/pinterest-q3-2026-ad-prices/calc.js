(() => {
  'use strict';
  const form = document.getElementById('pq-calc');
  const out = document.getElementById('pq-calc-result');
  if (!form || !out) return;
  const n = k => Number(form.elements.namedItem(k).value) || 0;
  const f = x => Math.round(x).toLocaleString('en-US');
  const render = () => {
    const budget = Math.max(0, n('budget')), cpm = Math.max(0.1, n('cpm')), drop = Math.min(50, Math.max(-50, n('drop'))), ctr = Math.max(0, n('ctr'));
    const newCpm = cpm * (1 + drop / 100);
    const before = budget / cpm * 1000, after = budget / newCpm * 1000, extra = after - before;
    out.innerHTML = '<div class="pq-rows"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const rows = [['Impressions at your current CPM', f(before)], ['Impressions at the new CPM ($' + newCpm.toFixed(2) + ')', f(after)], ['Extra clicks at ' + ctr + '% CTR', f(extra * ctr / 100)]];
    const list = out.querySelector('.pq-rows');
    rows.forEach(([a, b]) => { const d = document.createElement('div'); d.className = 'pq-row'; d.innerHTML = '<span></span><strong></strong>'; d.querySelector('span').textContent = a; d.querySelector('strong').textContent = b; list.append(d); });
    const box = out.querySelector('.ed-result'); box.classList.add(extra > 0 ? 'hi' : extra < 0 ? 'lo' : 'mid');
    box.querySelector('.big').textContent = (extra >= 0 ? '+' : '−') + f(Math.abs(extra));
    box.querySelector('strong').textContent = extra >= 0 ? 'More reach for the same budget' : 'Less reach for the same budget';
    box.querySelector('p').textContent = `That is the same as $${f(Math.abs(budget - budget * (cpm / newCpm)))} of ${extra >= 0 ? 'free' : 'lost'} media a month at your old price.`;
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
