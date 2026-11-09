(() => {
  'use strict';
  const form = document.getElementById('gq-plan');
  const out = document.getElementById('gq-plan-result');
  if (!form || !out) return;
  const v = k => Number(form.elements.namedItem(k).value);
  const n = x => Math.round(x).toLocaleString('en-US');
  const render = () => {
    const clicks = Math.max(0, v('clicks') || 0), shift = Math.min(100, Math.max(0, v('shift') || 0)) / 100, rel = Math.max(0, v('rel') || 0) / 100, growth = 1 + (v('growth') || 0) / 100, cvr = Math.max(0, v('cvr') || 0) / 100;
    if (!clicks) { out.innerHTML = '<p class="fe-error">Enter your monthly clicks.</p>'; return; }
    const demand = clicks * growth;
    const classic = demand * (1 - shift), ai = demand * shift * rel, total = classic + ai;
    const convIndex = (classic + ai * cvr) / clicks * 100;
    out.innerHTML = '<div class="fe-out"><div><span>Clicks in this scenario</span><strong></strong><p></p></div><div><span>Change in clicks</span><strong></strong><p></p></div><div><span>Conversion index</span><strong></strong><p></p></div></div><div class="gq-bars"></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = n(total); p[0].textContent = `${n(classic)} from classic results, ${n(ai)} from AI answers.`;
    const d = (total - clicks) / clicks * 100; s[1].textContent = (d >= 0 ? '+' : '') + d.toFixed(1) + '%'; p[1].textContent = d < 0 ? 'Fewer clicks despite more searches: the Q3 pattern.' : 'Query growth outweighs the AI shift at these settings.';
    s[2].textContent = convIndex.toFixed(0); p[2].textContent = convIndex >= 100 ? 'Conversions hold up or rise if AI-answer clicks convert better.' : 'Expected conversions fall; make AI-answer clicks count.';
    const bars = out.querySelector('.gq-bars'); const max = Math.max(clicks, demand);
    [['Clicks today', clicks, 'var(--fe-muted)'], ['Searches in scenario', demand, 'var(--fe-border)'], ['Classic clicks', classic, 'var(--fe-accent-2)'], ['AI-answer clicks', ai, 'var(--fe-accent)']].forEach(([l, x, c]) => {
      const row = document.createElement('div'); row.className = 'gq-bar'; row.innerHTML = '<span></span><i></i><b></b>';
      row.children[0].textContent = l; row.children[1].style.setProperty('--w', (x / max * 100).toFixed(1) + '%'); row.children[1].style.setProperty('--c', c); row.children[2].textContent = n(x); bars.append(row);
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
