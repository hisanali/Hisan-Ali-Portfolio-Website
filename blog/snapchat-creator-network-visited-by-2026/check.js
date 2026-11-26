(() => {
  'use strict';
  const form = document.getElementById('sk-check');
  const out = document.getElementById('sk-check-result');
  if (!form || !out) return;
  const TIPS = { place: 'Visited By works best for places people can visit; online-only brands should focus on creator ads instead.', map: 'Check your business name and pin on Snap Map.', young: 'Snapchat skews young; check your customers match.', visual: 'Find one thing worth filming: a dish, a view, a process.', budget: 'Set aside a budget for creator fees and boosting the best snap.', rules: 'Confirm creators hold the needed e-marketing licence.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const level = done >= 5 ? 'hi' : done >= 3 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'A good fit' : level === 'mid' ? 'Worth a small test' : 'Not yet';
    box.querySelector('p').textContent = missing.length ? 'Next steps:' : 'Invite two or three local creators to start.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
