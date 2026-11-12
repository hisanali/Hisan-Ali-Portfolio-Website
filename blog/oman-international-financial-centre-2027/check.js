(() => {
  'use strict';
  const form = document.getElementById('fc-check');
  const out = document.getElementById('fc-check-result');
  if (!form || !out) return;
  const TIPS = { case: 'Write a one-page case for Oman: clients, services and timing.', site: 'Add bilingual Oman pages to your website.', people: 'Update partner and manager LinkedIn profiles with Oman focus.', content: 'Publish a monthly note on Oman or GCC market developments.', network: 'Arrange introductions to local banks, law firms and advisers.', track: 'Assign someone to follow the centre’s announcements.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready to apply' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
