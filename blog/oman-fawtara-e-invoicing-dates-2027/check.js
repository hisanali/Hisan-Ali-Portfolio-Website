(() => {
  'use strict';
  const form = document.getElementById('fz-check');
  const out = document.getElementById('fz-check-result');
  if (!form || !out) return;
  const DAY = 864e5;
  const render = () => {
    const vat = form.elements.namedItem('vat').value, big = form.elements.namedItem('size').value === 'big';
    const date = big ? new Date(2027, 3, 1) : new Date(2027, 9, 1);
    const label = big ? '1 April 2027' : '1 October 2027';
    const weeks = Math.max(0, Math.ceil((date - new Date()) / DAY / 7));
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    const ul = box.querySelector('ul');
    const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (vat === 'no') {
      box.classList.add('hi');
      box.querySelector('.big').textContent = 'Not yet';
      box.querySelector('strong').textContent = 'The mandate covers VAT-registered businesses';
      box.querySelector('p').textContent = 'If you register later, the 1 October 2027 date or your registration date will matter.';
      add('Choose accounting and store tools that can connect to a licensed provider.');
      return;
    }
    box.classList.add(weeks < 26 ? 'lo' : 'mid');
    box.querySelector('.big').textContent = weeks + ' wks';
    box.querySelector('strong').textContent = 'Your date: ' + label;
    box.querySelector('p').textContent = (vat === 'soon' ? 'Once registered, ' : '') + 'a plan that avoids Ramadan and your big sales:';
    const m = (d, t) => add(d + ': ' + t);
    if (big) { m('December', 'list every invoice source and ask vendors'); m('January', 'pick a licensed provider and clean customer data'); m('Before Ramadan', 'test with real invoices'); m('March', 'go live early if you can'); }
    else { m('January–February', 'list every invoice source and ask vendors'); m('April–May', 'pick a licensed provider and clean customer data'); m('June–July', 'test with real invoices'); m('August–September', 'go live before 1 October'); }
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
