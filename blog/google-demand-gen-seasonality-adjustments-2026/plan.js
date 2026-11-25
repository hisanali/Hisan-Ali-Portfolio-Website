(() => {
  'use strict';
  const form = document.getElementById('dg-calc');
  const out = document.getElementById('dg-calc-result');
  if (!form || !out) return;
  const num = n => Math.max(0, Number(form.elements.namedItem(n).value) || 0);
  const render = () => {
    const n = num('n'), s = num('s'), d = num('d');
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'), ul = box.querySelector('ul');
    const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (!n) { box.classList.add('lo'); box.querySelector('.big').textContent = '—'; box.querySelector('strong').textContent = 'Enter your normal conversion rate'; return; }
    const ch = Math.round((s / n - 1) * 100);
    const safe = Math.round(ch * 0.8);
    box.querySelector('.big').textContent = (safe >= 0 ? '+' : '') + safe + '%';
    box.querySelector('strong').textContent = 'Suggested conversion-rate change';
    box.querySelector('p').textContent = 'Your past sale changed conversion rate by ' + (ch >= 0 ? '+' : '') + ch + '%. Entering about 80% of that avoids overspending.';
    if (d > 7) { box.classList.add('lo'); add('A ' + d + '-day event is long for an adjustment; let Smart Bidding adapt and raise budgets instead.'); }
    else { box.classList.add(ch > 0 ? 'hi' : 'mid'); add('Set exact start and end times for the ' + d + '-day sale.'); }
    if (ch <= 0) add('No lift in the past sale; an adjustment won’t help.');
    add('Raise daily budgets for the sale days too, or the higher bids will hit the cap early.');
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
