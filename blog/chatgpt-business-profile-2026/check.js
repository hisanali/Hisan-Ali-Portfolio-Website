(() => {
  'use strict';
  const form = document.getElementById('cb-check');
  const out = document.getElementById('cb-check-result');
  if (!form || !out) return;
  const TIPS = { ask: 'Ask ChatGPT about your business in English and Arabic and note errors.', site: 'Add clear hours, location and services to your website.', gbp: 'Make your Google Business Profile match your website.', email: 'Set up an email on your own domain for verification.', dns: 'Find who controls your domain’s DNS settings.', arabic: 'Publish your key details in Arabic as well as English.' };
  const LABELS = { hi: 'Ready to claim', mid: 'Nearly ready', lo: 'Fix the basics first' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const level = done >= boxes.length - 1 ? 'hi' : done >= Math.ceil(boxes.length / 2) ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = LABELS[level];
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'All set.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
