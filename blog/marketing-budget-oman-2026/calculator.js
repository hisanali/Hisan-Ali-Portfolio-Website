(() => {
  'use strict';
  const form = document.getElementById('mb-calc');
  const out = document.getElementById('mb-calc-result');
  if (!form || !out) return;
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Rules of thumb, not benchmarks. Share of revenue by stage, and seasonal weights per sector for Oman in 2027.
  const stage = { launch: [0.12, 0.20, 'New brands buy awareness and first customers.'], grow: [0.08, 0.12, 'Growing businesses fund both acquisition and brand.'], steady: [0.05, 0.08, 'Established businesses defend share and retention.'] };
  const season = {
    retail: [3, 4, 5, 2, 4, 3, 2, 4, 3, 3, 5, 4], food: [4, 5, 5, 3, 4, 3, 2, 3, 3, 4, 4, 5], travel: [5, 3, 4, 3, 4, 4, 5, 5, 3, 4, 4, 5],
    services: [4, 3, 3, 4, 3, 3, 2, 2, 4, 4, 4, 3], b2b: [5, 3, 3, 4, 3, 3, 2, 2, 5, 5, 4, 2], education: [3, 2, 2, 3, 3, 4, 4, 5, 4, 2, 2, 3]
  };
  const split = [['Paid media', 0.40], ['Content & creative', 0.25], ['People & agency', 0.25], ['Tools & tracking', 0.10]];
  const omr = v => 'OMR ' + Math.round(v).toLocaleString('en-US');
  const render = () => {
    const revenue = Number(form.elements.namedItem('revenue').value);
    if (!(revenue > 0)) { out.innerHTML = '<p class="fe-error">Enter your expected annual revenue in OMR.</p>'; return; }
    const [lo, hi, why] = stage[form.elements.namedItem('stage').value];
    const weights = season[form.elements.namedItem('sector').value];
    const mid = revenue * (lo + hi) / 2, total = weights.reduce((a, b) => a + b, 0), max = Math.max(...weights);
    out.innerHTML = `<div class="fe-out"><div><span>Annual budget</span><strong></strong><p></p></div><div><span>Monthly average</span><strong></strong><p>Spread unevenly: more in peak months, less in quiet ones.</p></div><div><span>Paid media</span><strong></strong><p>About 40% of the budget, the rest builds what the ads promote.</p></div></div>
      <div class="mb-split" role="img"></div><div class="mb-legend"></div><div class="mb-months" role="img"></div><p class="fe-small"></p>`;
    const strongs = out.querySelectorAll('.fe-out strong');
    strongs[0].textContent = omr(mid);
    out.querySelector('.fe-out p').textContent = `${Math.round(lo * 100)}–${Math.round(hi * 100)}% of revenue: ${omr(revenue * lo)} to ${omr(revenue * hi)}. ${why}`;
    strongs[1].textContent = omr(mid / 12);
    strongs[2].textContent = omr(mid * 0.4);
    const bar = out.querySelector('.mb-split'), legend = out.querySelector('.mb-legend');
    bar.setAttribute('aria-label', 'Budget split: ' + split.map(([n, s]) => `${n} ${s * 100}%, ${omr(mid * s)}`).join('; '));
    split.forEach(([name, share]) => {
      const seg = document.createElement('div'); seg.style.flex = String(share); seg.textContent = Math.round(share * 100) + '%'; bar.append(seg);
      const item = document.createElement('span'); item.innerHTML = '<i></i>'; item.append(`${name}: ${omr(mid * share)}`); legend.append(item);
    });
    legend.querySelectorAll('i').forEach((dot, i) => { dot.style.background = getComputedStyle(bar.children[i]).backgroundColor; });
    const chart = out.querySelector('.mb-months');
    const perMonth = weights.map(w => mid * w / total);
    chart.setAttribute('aria-label', 'Suggested monthly spend: ' + perMonth.map((v, i) => `${full[i]} ${omr(v)}`).join(', '));
    weights.forEach((w, i) => {
      const col = document.createElement('div'); if (w === max) col.className = 'is-peak';
      col.innerHTML = '<i></i>'; col.firstChild.style.setProperty('--h', (w / max * 100) + '%'); col.title = `${full[i]}: ${omr(perMonth[i])}`; col.append(months[i]); chart.append(col);
    });
    const peaks = weights.map((w, i) => [w, i]).filter(([w]) => w === max).map(([, i]) => full[i]);
    out.querySelector('.fe-small').textContent = `Biggest months: ${peaks.join(', ')} (about ${omr(perMonth[weights.indexOf(max)])} each). Quietest month: about ${omr(Math.min(...perMonth))}.`;
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
