(() => {
  'use strict';
  const form = document.getElementById('vt-check');
  const out = document.getElementById('vt-check-result');
  if (!form || !out) return;
  const TIPS = { premium: 'Create a private or premium version of your experience with a clear price.', card: 'Accept cards and contactless payment everywhere.', photos: 'Invest in professional photos and short video.', lang: 'Offer your site in English and Arabic, plus a key visitor language.', trade: 'Ask Visit Oman and tour operators about listing your experience.', reviews: 'Ask recent guests for reviews on Google and travel platforms.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready for premium guests' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
