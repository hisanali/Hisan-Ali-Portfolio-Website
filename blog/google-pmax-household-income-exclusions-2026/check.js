(() => {
  'use strict';
  const form = document.getElementById('hi-check');
  const out = document.getElementById('hi-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const price = v('price'), geo = v('geo'), unknown = v('unknown');
    const usable = unknown === 'low', worth = price === 'high';
    const level = worth && usable ? 'hi' : price === 'low' || unknown === 'high' ? 'lo' : 'mid';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = level === 'hi' ? 'Test' : level === 'lo' ? 'Skip' : 'Check';
    box.querySelector('strong').textContent = level === 'hi' ? 'Worth testing an exclusion' : level === 'lo' ? 'Leave income alone for now' : 'Check your data first';
    box.querySelector('p').textContent = price === 'low' ? 'For low-priced products, income rarely decides who buys.' : unknown === 'high' ? 'Most of your traffic has no income data, so exclusions would do little or cut reach.' : unknown === 'dk' ? 'Open the demographics report and see how much traffic falls under “unknown” before deciding.' : worth ? 'High order values and usable data: exclude the lowest band and compare results for four weeks.' : 'Mid-priced products can benefit, but only if the lower bands clearly convert worse.';
    const ul = box.querySelector('ul'); const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (geo === 'oman') add('Income data may be limited in the Gulf; confirm the setting appears in your account.');
    add('Never exclude the “unknown” band without checking how much reach it holds.');
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
