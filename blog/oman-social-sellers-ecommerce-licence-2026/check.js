(() => {
  'use strict';
  const form = document.getElementById('sl-check');
  const out = document.getElementById('sl-check-result');
  if (!form || !out) return;
  const TIPS = { lic: 'Apply for an e-commerce licence on the Oman Business Platform.', maroof: 'Verify your store on Maroof Oman once licensed.', bio: 'Add your licence number or Maroof link to every profile.', pay: 'Offer card, QR or transfer payments to cut cash-on-delivery refusals.', policy: 'Publish prices, delivery times and return terms in Arabic and English.', invoice: 'Send a receipt or invoice with every order.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'A proper online store' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
