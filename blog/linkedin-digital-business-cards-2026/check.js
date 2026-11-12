(() => {
  'use strict';
  const form = document.getElementById('lc-check');
  const out = document.getElementById('lc-check-result');
  if (!form || !out) return;
  const TIPS = { photo: 'Upload a clear, recent photo.', headline: 'Rewrite your headline to say what you do and for whom.', about: 'Refresh your About section in three short paragraphs.', featured: 'Add featured links to your website, a case study and a booking page.', contact: 'Fill in email, WhatsApp and website in contact info.', post: 'Post something useful this week so your profile looks active.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready to share' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
