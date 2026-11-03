(() => {
  'use strict';
  const form = document.getElementById('it-check');
  const out = document.getElementById('it-check-result');
  if (!form || !out) return;
  const TIPS = { lic: 'Check your licence status on Itqan and keep a digital copy ready to share.', gbp: 'Add winter photos, hours and reviews to your Google Business Profile.', ota: 'List on at least one booking platform used by your visitors.', price: 'Publish clear prices and inclusions in English and Arabic.', book: 'Offer online booking with a deposit by card or QR.', reply: 'Reply to enquiries within a few hours, ideally with WhatsApp quick replies.', trade: 'Prepare net rates and a fact sheet for travel agents.', safety: 'Publish safety information and requirements for each activity.' };
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
