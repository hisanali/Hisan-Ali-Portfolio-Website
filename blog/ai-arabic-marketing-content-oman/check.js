(() => {
  'use strict';
  const form = document.getElementById('aa-check');
  const out = document.getElementById('aa-check-result');
  if (!form || !out) return;
  const TIPS = { native: 'Have a native Arabic speaker read it aloud.', tone: 'Rewrite stiff, formal lines in a warmer Gulf tone.', names: 'Check brand, product and place names.', prices: 'Match prices, dates and numbers with the English version.', claims: 'Remove claims you can’t prove and confirm the offer is approved.', layout: 'Check right-to-left text in the final design.', faces: 'Remove AI faces or voices of real people without consent.' };
  const LABELS = { hi: 'Ready to post', mid: 'Almost there', lo: 'Not ready yet' };
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
