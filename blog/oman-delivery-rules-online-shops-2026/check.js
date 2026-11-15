(() => {
  'use strict';
  const form = document.getElementById('wd-check');
  const out = document.getElementById('wd-check-result');
  if (!form || !out) return;
  const TIPS = { lic: 'Ask your courier for proof of licensing and rider registration.', sla: 'Agree delivery times, areas and failed-delivery handling in writing.', show: 'Show delivery cost and time on product pages and before checkout.', track: 'Send tracking links or WhatsApp updates for every order.', peak: 'Book extra courier capacity for National Day and White Friday.', returns: 'Publish your return and failed-delivery policy.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Delivery-ready' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
