(() => {
  'use strict';
  const form = document.getElementById('mq-calc');
  const out = document.getElementById('mq-calc-result');
  if (!form || !out) return;
  const v = k => Number(form.elements.namedItem(k).value);
  const n = x => Math.round(x).toLocaleString('en-US');
  const render = () => {
    const budget = Math.max(0, v('budget') || 0), cpm = Math.max(0.01, v('cpm') || 0.01), rise = v('rise') || 0, cvr = Math.max(0, v('cvr') || 0);
    if (!budget) { out.innerHTML = '<p class="fe-error">Enter your monthly budget.</p>'; return; }
    const newCpm = cpm * (1 + rise / 100);
    const before = budget / cpm * 1000, after = budget / newCpm * 1000;
    const lost = before - after, need = budget * (1 + rise / 100);
    const salesBefore = before / 1000 * cvr, salesAfter = after / 1000 * cvr;
    out.innerHTML = '<div class="fe-out"><div><span>Impressions now</span><strong></strong><p></p></div><div><span>Budget to stand still</span><strong></strong><p></p></div><div><span>Purchases</span><strong></strong><p></p></div></div><div class="mq-bars"><div class="mq-bar"><span>Last year</span><i></i><b></b></div><div class="mq-bar"><span>Same budget now</span><i></i><b></b></div></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = n(after); p[0].textContent = lost >= 0 ? `${n(lost)} fewer than last year (${(lost / before * 100).toFixed(1)}%).` : `${n(-lost)} more than last year.`;
    s[1].textContent = n(need); p[1].textContent = `Per month, to buy the same ${n(before)} impressions.`;
    s[2].textContent = salesAfter.toFixed(1); p[2].textContent = `Down from ${salesBefore.toFixed(1)} if conversion per impression stays the same.`;
    const bars = out.querySelectorAll('.mq-bar'), max = Math.max(before, after);
    [[before, 'var(--fe-border)'], [after, 'var(--fe-accent)']].forEach(([x, c], i) => {
      const bar = bars[i].querySelector('i'); bar.style.setProperty('--w', (x / max * 100).toFixed(1) + '%'); bar.style.setProperty('--c', i ? c : 'var(--fe-muted)');
      bars[i].querySelector('b').textContent = n(x);
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
