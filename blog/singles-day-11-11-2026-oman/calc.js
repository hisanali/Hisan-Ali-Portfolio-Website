(() => {
  'use strict';
  const form = document.getElementById('ss-calc');
  const out = document.getElementById('ss-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const r = x => x.toFixed(3).replace(/\.?0+$/, '');
  const render = () => {
    const price = n('price'), cost = n('cost'), disc = Math.min(90, n('disc')), units = n('units');
    const sale = price * (1 - disc / 100), m0 = price - cost, m1 = sale - cost;
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    const ul = box.querySelector('ul');
    const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (m0 <= 0) { box.classList.add('lo'); box.querySelector('.big').textContent = '!'; box.querySelector('strong').textContent = 'No margin to start with'; box.querySelector('p').textContent = 'The cost is at or above the normal price. Fix pricing before discounting.'; return; }
    if (m1 <= 0) { box.classList.add('lo'); box.querySelector('.big').textContent = 'Loss'; box.querySelector('strong').textContent = 'Every sale loses money'; box.querySelector('p').textContent = `At ${disc}% off you sell at OMR ${r(sale)}, below your cost of OMR ${r(cost)}.`; add('Use a gift with purchase or free delivery instead of a price cut.'); return; }
    const need = Math.ceil(units * m0 / m1), lift = units ? Math.round((need / units - 1) * 100) : 0;
    box.classList.add(lift <= 30 ? 'hi' : lift <= 80 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = '+' + lift + '%';
    box.querySelector('strong').textContent = `Sell ${need} units instead of ${units} to break even`;
    box.querySelector('p').textContent = `Your margin falls from OMR ${r(m0)} to OMR ${r(m1)} per unit at a sale price of OMR ${r(sale)}.`;
    if (lift > 80) add('That lift is hard to reach. Try a smaller discount or a bundle.');
    add('Limit the offer to a few items and a short window.');
    add('Send it to your WhatsApp or email list first, before paying for ads.');
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
