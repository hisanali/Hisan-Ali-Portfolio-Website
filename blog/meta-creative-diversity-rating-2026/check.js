(() => {
  'use strict';
  const form = document.getElementById('cd-check');
  const out = document.getElementById('cd-check-result');
  if (!form || !out) return;
  const TIPS = { video: 'Add a 10–15 second vertical video.', carousel: 'Add a carousel showing several products or steps.', people: 'Show a real person using the product.', ugc: 'Ask a customer or creator for a short clip.', angles: 'Make a second ad around a different reason to buy.', arabic: 'Make an Arabic version with its own visuals, not just translated text.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const level = done >= 4 ? 'hi' : done >= 2 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = level === 'hi' ? 'High' : level === 'mid' ? 'Medium' : 'Low';
    box.querySelector('strong').textContent = 'Likely creative diversity';
    box.querySelector('p').textContent = missing.length ? 'To make your ads more different:' : 'A strong mix. Keep refreshing every few weeks.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
