(() => {
  'use strict';
  const form = document.getElementById('cx-plan');
  const out = document.getElementById('cx-plan-result');
  if (!form || !out) return;
  const render = () => {
    const groups = Number(form.elements.namedItem('groups').value), budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0), adv = form.elements.namedItem('adv').value;
    const per = budget / groups;
    const use = groups > 1 && per < 25;
    const level = groups === 1 ? 'lo' : use ? 'hi' : 'mid';
    out.innerHTML = '<div class="cx-rows"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const list = out.querySelector('.cx-rows');
    [['Budget if split into separate ad sets', '$' + per.toFixed(0) + ' a day each'], ['Budget kept together', '$' + budget.toFixed(0) + ' a day']].forEach(([a, b]) => { const d = document.createElement('div'); d.className = 'cx-row'; d.innerHTML = '<span></span><strong></strong>'; d.querySelector('span').textContent = a; d.querySelector('strong').textContent = b; list.append(d); });
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = groups === 1 ? 'No' : use ? 'Yes' : 'Maybe';
    box.querySelector('strong').textContent = groups === 1 ? 'You don’t need it' : use ? 'Per-creative audiences fit' : 'Either approach can work';
    box.querySelector('p').textContent = groups === 1 ? 'With one audience, a normal ad set is simpler.' : use ? 'Splitting would leave each ad set with too little budget to learn. Keep one ad set and set an audience on each creative.' : 'Each group could fund its own ad set. Use per-creative audiences if you want simpler management, separate ad sets if groups need different budgets.';
    const ul = box.querySelector('ul'); const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (groups > 1 && adv === 'yes') add('You will need to switch this ad set off Advantage+ audience; test it beside your current setup first.');
    if (groups > 1) add('Check age and gender breakdowns after a week to see where each ad delivered.');
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
