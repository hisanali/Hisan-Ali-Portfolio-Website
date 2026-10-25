(() => {
  'use strict';
  const form = document.getElementById('ab-audit');
  const out = document.getElementById('ab-audit-result');
  if (!form || !out) return;
  const boxes = [...form.querySelectorAll('input[type=checkbox]')];
  const render = () => {
    const score = boxes.reduce((s, b) => s + (b.checked ? Number(b.dataset.w) : 0), 0);
    const gaps = boxes.filter(b => !b.checked).sort((a, b) => b.dataset.w - a.dataset.w).slice(0, 3);
    const level = score >= 85 ? 'Google tells your story' : score >= 60 ? 'Mostly in control' : score >= 30 ? 'Others are telling it' : 'Your brand answer is up for grabs';
    out.innerHTML = '<div class="ab-res2"><div class="ab-ring" aria-hidden="true"><span></span></div><div><strong></strong><p></p><ol></ol></div></div>';
    out.querySelector('.ab-ring').style.setProperty('--p', score);
    out.querySelector('.ab-ring span').textContent = score;
    out.querySelector('strong').textContent = `${level}: ${score} / 100`;
    out.querySelector('p').textContent = gaps.length ? 'Fix these first:' : 'Everything is covered. Repeat the search every month.';
    const ol = out.querySelector('ol');
    gaps.forEach(g => { const li = document.createElement('li'); li.textContent = g.dataset.fix; ol.append(li); });
    if (!gaps.length) ol.remove();
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
