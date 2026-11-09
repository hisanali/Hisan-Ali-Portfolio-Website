(() => {
  'use strict';
  const days = document.getElementById('uc-days'), box = document.querySelector('.uc-count');
  if (days && box) {
    const left = Math.ceil((Date.parse(box.dataset.deadline) - Date.now()) / 864e5);
    if (left > 0) days.textContent = left;
    else { days.textContent = 'Now'; box.querySelector('.uc-count-l').textContent = 'Black Friday is here. Keep prices and stock in sync.'; }
  }
  const form = document.getElementById('uc-check');
  const out = document.getElementById('uc-check-result');
  if (!form || !out) return;
  const boxes = [...form.querySelectorAll('input[type=checkbox]')];
  const render = () => {
    const score = boxes.reduce((s, b) => s + (b.checked ? Number(b.dataset.w) : 0), 0);
    const gaps = boxes.filter(b => !b.checked).sort((a, b) => b.dataset.w - a.dataset.w).slice(0, 3);
    const level = score >= 85 ? 'Cart-ready' : score >= 60 ? 'Nearly there' : score >= 30 ? 'Gaps that cost sales' : 'Not ready yet';
    out.innerHTML = '<div class="uc-res"><div class="uc-ring" aria-hidden="true"><span></span></div><div><strong></strong><p></p><ol></ol></div></div>';
    out.querySelector('.uc-ring').style.setProperty('--p', score);
    out.querySelector('.uc-ring span').textContent = score;
    out.querySelector('strong').textContent = `${level}: ${score} / 100`;
    out.querySelector('p').textContent = gaps.length ? 'Fix these first:' : 'Every item is covered. Recheck diagnostics weekly through the holidays.';
    const ol = out.querySelector('ol');
    gaps.forEach(g => { const li = document.createElement('li'); li.textContent = g.dataset.fix; ol.append(li); });
    if (!gaps.length) ol.remove();
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
