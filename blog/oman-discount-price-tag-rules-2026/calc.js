(() => {
  'use strict';
  const form = document.getElementById('dp-calc');
  const out = document.getElementById('dp-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const f = x => 'OMR ' + x.toFixed(3);
  const render = () => {
    const orig = n('orig'), oct = n('oct'), sale = n('sale');
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'), ul = box.querySelector('ul');
    const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (!orig || sale >= orig) { box.classList.add('lo'); box.querySelector('.big').textContent = '!'; box.querySelector('strong').textContent = 'This isn’t a discount'; box.querySelector('p').textContent = 'The sale price must be lower than the original price.'; return; }
    const pct = Math.round((1 - sale / orig) * 100), inflated = oct > 0 && orig > oct * 1.001;
    box.classList.add(inflated ? 'lo' : 'hi');
    box.querySelector('.big').textContent = '−' + pct + '%';
    box.querySelector('strong').textContent = inflated ? 'The “original” price looks raised' : 'Tag looks right';
    box.querySelector('p').textContent = inflated ? `The item sold for ${f(oct)} in October, but the tag says ${f(orig)}. Use the real price; against ${f(oct)} the discount is ${Math.max(0, Math.round((1 - sale / oct) * 100))}%.` : `Print: was ${f(orig)}, now ${f(sale)}, ${pct}% off.`;
    add('Show all three numbers together on the tag, product page and ads.');
    add('Keep the sale within your licensed or notified dates.');
    if (pct >= 50) add('Large discounts attract attention; keep proof of the normal price.');
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
