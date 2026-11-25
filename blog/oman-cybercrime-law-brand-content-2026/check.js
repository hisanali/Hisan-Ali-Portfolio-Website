(() => {
  'use strict';
  const form = document.getElementById('cy-check');
  const out = document.getElementById('cy-check-result');
  if (!form || !out) return;
  const FIX = { faces: 'Get consent from everyone identifiable, or blur them.', kids: 'Get parents’ written consent and take advice before featuring children under 15.', workers: 'Drop any joke built on domestic workers or staff.', victims: 'Remove accident, injury or hospital footage.', claims: 'Keep proof for every claim, or soften it.', rival: 'Compare products and prices, not named people or rivals.', ai: 'Remove AI faces or voices of real people unless they agreed, and label AI content.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const flagged = boxes.filter(b => b.checked).map(b => b.value);
    const level = flagged.length === 0 ? 'hi' : flagged.length <= 2 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = flagged.length + ' flag' + (flagged.length === 1 ? '' : 's');
    box.querySelector('strong').textContent = level === 'hi' ? 'Good to post' : level === 'mid' ? 'Fix before posting' : 'Hold this post';
    box.querySelector('p').textContent = flagged.length ? 'Before it goes live:' : 'Keep your consent records with the file.';
    const ul = box.querySelector('ul'); flagged.forEach(k => { const li = document.createElement('li'); li.textContent = FIX[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
