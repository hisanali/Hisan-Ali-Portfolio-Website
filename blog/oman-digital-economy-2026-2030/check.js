(() => {
  'use strict';
  const form = document.getElementById('de-check');
  const out = document.getElementById('de-check-result');
  if (!form || !out) return;
  const TIPS = { shop: 'Add online ordering or booking, even a simple WhatsApp catalogue.', pay: 'Accept card, QR or instant transfer; local transfers are now fee-free for individuals and SMEs.', gbp: 'Complete your Google Business Profile and ask recent customers for reviews.', verify: 'Register and verify your online store so customers can trust it.', data: 'Set up analytics that show sales by channel.', crm: 'Start a customer list with consent for email or WhatsApp.', ai: 'Pick one AI tool that saves time, such as drafting replies in Arabic and English.', team: 'Make one person responsible for digital, even part-time.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).map(b => b.value);
    const missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done.length / boxes.length * 100);
    const level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done.length + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Fix these first:' : 'Everything is in place. Keep it current through the season.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
