(() => {
  'use strict';
  const form = document.getElementById('fw-check');
  const out = document.getElementById('fw-check-result');
  if (!form || !out) return;
  const TIPS = { lic: 'Get the discount licence before advertising, display it and note its dates.', tags: 'Show original price, sale price and percentage on every tag and page.', meta: 'Untick Detected offers in Meta Commerce Manager.', google: 'Check AI Max, text automation, URL expansion and end dates in Google Ads.', consent: 'Remove contacts who never agreed to receive offers.', stock: 'Confirm stock, delivery capacity and holiday opening hours.', reply: 'Name who answers WhatsApp and calls on each holiday day.', track: 'Test a purchase on the sale page and check it records in your ad accounts.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready for the sale' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
