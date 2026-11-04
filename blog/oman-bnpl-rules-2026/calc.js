(() => {
  'use strict';
  const form = document.getElementById('bn-calc');
  const out = document.getElementById('bn-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const r = x => (Math.round(x * 100) / 100).toLocaleString('en-US');
  const render = () => {
    const aov = n('aov'), m = Math.min(100, Math.max(1, n('margin'))) / 100, fee = Math.min(20, n('fee')) / 100, share = Math.min(100, n('share')) / 100;
    const profit = aov * m;
    const needAov = m > fee ? aov * m / (m - fee) : Infinity;
    const lift = isFinite(needAov) ? (needAov / aov - 1) * 100 : Infinity;
    const avgFee = aov * fee * share;
    out.innerHTML = '<div class="bn-rows"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const rows = [['Profit on an order today', 'OMR ' + r(profit)], ['Fee on an instalment order', 'OMR ' + r(aov * fee)], ['Average fee across all orders', 'OMR ' + r(avgFee)]];
    const list = out.querySelector('.bn-rows');
    rows.forEach(([a, b]) => { const d = document.createElement('div'); d.className = 'bn-row'; d.innerHTML = '<span></span><strong></strong>'; d.querySelector('span').textContent = a; d.querySelector('strong').textContent = b; list.append(d); });
    const box = out.querySelector('.ed-result');
    if (!isFinite(lift)) { box.classList.add('lo'); box.querySelector('.big').textContent = '!'; box.querySelector('strong').textContent = 'The fee is bigger than your margin'; box.querySelector('p').textContent = 'Every instalment order would lose money. Offer instalments only on higher-margin items.'; return; }
    box.classList.add(lift <= 15 ? 'hi' : lift <= 35 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = '+' + Math.round(lift) + '%';
    box.querySelector('strong').textContent = `Instalment orders need to average OMR ${r(needAov)} to earn the same profit`;
    box.querySelector('p').textContent = lift <= 15 ? 'Instalment shoppers often buy more, so this is usually reachable.' : lift <= 35 ? 'Reachable on big-ticket items; test it on a few categories first.' : 'Hard to reach. Negotiate the fee or limit instalments to high-margin products.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
