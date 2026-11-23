(() => {
  'use strict';
  const form = document.getElementById('ht-check');
  const out = document.getElementById('ht-check-result');
  if (!form || !out) return;
  const TIPS = { base: 'Export the last 90 days of bookings, cost and return as a baseline.', feed: 'Check rates, availability and room types in your feed.', track: 'Track booking-engine purchases with values in Google Ads.', brand: 'Run a brand campaign so searches for your hotel show your own booking link.', assets: 'Refresh photos, descriptions and offers.', plan: 'Pick a quiet week to switch manually before the automatic move.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready to migrate' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
