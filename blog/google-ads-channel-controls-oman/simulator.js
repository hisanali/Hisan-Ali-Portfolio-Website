(() => {
  'use strict';
  const form = document.getElementById('gc-sim');
  const out = document.getElementById('gc-sim-result');
  if (!form || !out) return;
  // Models the announced logic: High-priority channels are funded first; Low-priority channels share what remains,
  // optionally limited to a percentage of the daily budget (a best-effort limit, not a hard cap).
  const channels = [['search', 'Google Search'], ['partners', 'Search partners'], ['display', 'Display Network']];
  const omr = v => 'OMR ' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const render = () => {
    const budget = Number(form.elements.namedItem('budget').value);
    if (!(budget > 0)) { out.innerHTML = '<p class="fe-error">Enter a daily budget above zero.</p>'; return; }
    const rows = channels.map(([key, label]) => {
      const low = form.elements.namedItem(key + '-p').value === 'low';
      const cap = Number(form.elements.namedItem(key + '-cap').value);
      form.querySelector(`output[for="gc-${key}-cap"]`).value = cap + '%';
      form.querySelector(`[data-cap="${key}"]`).classList.toggle('is-off', !low);
      return { key, label, low, cap };
    });
    const lows = rows.filter(r => r.low), highs = rows.filter(r => !r.low);
    if (!highs.length) { out.innerHTML = '<p class="fe-error">Keep at least one channel as High priority, usually Google Search.</p>'; return; }
    const lowMax = Math.min(budget, lows.reduce((s, r) => s + budget * r.cap / 100, 0));
    const highMin = budget - lowMax;
    const cells = [
      ['Funded first', omr(highMin) + '+', `${highs.map(r => r.label).join(' and ')} ${highs.length === 1 ? 'gets' : 'get'} budget before anything else.`],
      ['Most Low channels can take', lows.length ? omr(lowMax) : omr(0), lows.length ? lows.map(r => `${r.label} up to ${r.cap}%`).join(', ') + '. Best-effort, not a hard cap.' : 'No channel is set to Low.'],
      ['Monthly at that ceiling', lows.length ? omr(lowMax * 30.4) : omr(0), 'Roughly the most that could flow to Low-priority channels in a month.']
    ];
    out.innerHTML = '<div class="gc-stack" role="img"></div><div class="fe-out"></div>';
    const stack = out.querySelector('.gc-stack');
    stack.setAttribute('aria-label', `Daily budget ${omr(budget)}: at least ${omr(highMin)} for High priority, up to ${omr(lowMax)} for Low priority`);
    const hi = document.createElement('div'); hi.className = 'hi'; hi.style.flex = String(highMin || 0.0001); hi.textContent = 'High ≥ ' + Math.round(highMin / budget * 100) + '%'; stack.append(hi);
    if (lowMax) { const lo = document.createElement('div'); lo.className = 'lo'; lo.style.flex = String(lowMax); lo.textContent = 'Low ≤ ' + Math.round(lowMax / budget * 100) + '%'; stack.append(lo); }
    const grid = out.querySelector('.fe-out');
    cells.forEach(([a, b, c]) => { const d = document.createElement('div'); d.innerHTML = '<span></span><strong></strong><p></p>'; d.children[0].textContent = a; d.children[1].textContent = b; d.children[2].textContent = c; grid.append(d); });
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
