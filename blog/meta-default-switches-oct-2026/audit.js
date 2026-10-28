(() => {
  'use strict';
  const form = document.getElementById('ms-audit');
  const out = document.getElementById('ms-audit-result');
  if (!form || !out) return;
  const items = [...form.querySelectorAll('.ms-item')];
  const render = () => {
    const done = items.filter(i => i.querySelector('input').checked);
    const left = items.filter(i => !i.querySelector('input').checked);
    const pct = Math.round(done.length / items.length * 100);
    out.innerHTML = '<div class="ms-res"><div class="ms-ring" aria-hidden="true"><span></span></div><div><strong></strong><p></p><ul></ul></div></div>';
    out.querySelector('.ms-ring').style.setProperty('--p', pct);
    out.querySelector('.ms-ring span').textContent = done.length + '/' + items.length;
    out.querySelector('strong').textContent = pct === 100 ? 'All six reviewed. Set a reminder for 1 December.' : pct >= 50 ? `${left.length} switch${left.length > 1 ? 'es' : ''} still unreviewed` : 'Most of this month’s defaults are unreviewed';
    out.querySelector('p').textContent = left.length ? 'Still to check in Ads Manager:' : 'Document what you left on and why, before Meta’s new terms apply on 20 November.';
    const ul = out.querySelector('ul');
    left.forEach(i => { const li = document.createElement('li'); li.textContent = i.querySelector('b').textContent; ul.append(li); });
    if (!left.length) ul.remove();
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
