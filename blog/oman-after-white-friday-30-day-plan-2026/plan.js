(() => {
  'use strict';
  const form = document.getElementById('aw-calc');
  const out = document.getElementById('aw-calc-result');
  if (!form || !out) return;
  const num = n => Math.max(0, Number(form.elements.namedItem(n).value) || 0);
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const render = () => {
    const buyers = num('buyers'), aov = num('aov'), opt = Math.min(100, num('opt')) / 100, rep = Math.min(100, num('rep')) / 100;
    const reach = buyers * opt, orders = reach * rep, rev = orders * aov;
    const lift = buyers * (1 - opt) * rep * 0.4 * aov; // non-opted buyers reached by ads at lower response
    out.innerHTML = '<div class="ed-result hi"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = 'OMR ' + fmt(rev + lift);
    box.querySelector('strong').textContent = 'Possible repeat sales in 30 days';
    box.querySelector('p').textContent = 'From ' + fmt(buyers) + ' new buyers:';
    const ul = box.querySelector('ul');
    [fmt(reach) + ' you can message, about ' + fmt(orders) + ' repeat orders (OMR ' + fmt(rev) + ').',
     'Retargeting ads to the other ' + fmt(buyers * (1 - opt)) + ', assumed at less than half the response: about OMR ' + fmt(lift) + '.',
     'Raising opt-in to ' + Math.min(100, Math.round(opt * 100) + 20) + '% would add about OMR ' + fmt(buyers * Math.min(0.2, 1 - opt) * rep * aov * 0.6) + '.']
      .forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
