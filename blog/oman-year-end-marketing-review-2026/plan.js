(() => {
  'use strict';
  const form = document.getElementById('yr-calc');
  const out = document.getElementById('yr-calc-result');
  if (!form || !out) return;
  const num = n => Math.max(0, Number(form.elements.namedItem(n).value) || 0);
  const NAMES = ['Meta', 'Google', 'Other'];
  const render = () => {
    const rows = NAMES.map((name, i) => { const s = num('s' + (i + 1)), r = num('r' + (i + 1)); return { name, s, r, roas: s > 0 ? r / s : 0 }; }).filter(x => x.s > 0);
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    if (!rows.length) { box.classList.add('lo'); box.querySelector('.big').textContent = '—'; box.querySelector('strong').textContent = 'Enter spend for at least one channel'; return; }
    rows.sort((a, b) => b.roas - a.roas);
    const totS = rows.reduce((a, x) => a + x.s, 0), totR = rows.reduce((a, x) => a + x.r, 0);
    const best = rows[0], worst = rows[rows.length - 1];
    box.classList.add(totR / totS >= 3 ? 'hi' : totR / totS >= 2 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = (totR / totS).toFixed(1) + '×';
    box.querySelector('strong').textContent = 'Overall return on spend';
    box.querySelector('p').textContent = 'Best: ' + best.name + ' at ' + best.roas.toFixed(1) + '× revenue for each rial.';
    const ul = box.querySelector('ul');
    rows.forEach(x => { const li = document.createElement('li'); li.textContent = x.name + ': OMR ' + Math.round(x.s).toLocaleString('en-US') + ' spent, ' + x.roas.toFixed(1) + '× return.'; ul.append(li); });
    if (rows.length > 1 && worst.roas < best.roas * 0.6) { const li = document.createElement('li'); li.textContent = 'Consider moving part of ' + worst.name + '’s budget to ' + best.name + ', and keep 10–20% for tests.'; ul.append(li); }
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
