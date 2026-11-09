(() => {
  'use strict';
  const form = document.getElementById('hl-planner');
  const out = document.getElementById('hl-planner-result');
  if (!form || !out) return;
  // Shares of the 1 Nov - 31 Dec season from Adobe's 2026 US forecast: Cyber Week $47.5B and Cyber Monday $15.1B of $275.1B.
  const SEASON = 275.1, CYBER_WEEK = 47.5 / SEASON, CYBER_MONDAY = 15.1 / SEASON;
  // Assumed split of the other four Cyber Week days (Thanksgiving, Black Friday, Saturday, Sunday) by relative weight.
  const DAYS = [['Thu 26', 0.18], ['Fri 27', 0.33], ['Sat 28', 0.17], ['Sun 29', 0.17]];
  const render = () => {
    const v = k => Number(form.elements.namedItem(k).value);
    const rev = Math.max(0, v('rev') || 0), growth = v('growth') || 0, aov = Math.max(1, v('aov') || 1);
    const cur = form.elements.namedItem('cur').value;
    if (!rev) { out.innerHTML = '<p class="fe-error">Enter last season’s online revenue.</p>'; return; }
    const fmt = n => cur + ' ' + Math.round(n).toLocaleString('en-US');
    const season = rev * (1 + growth / 100), week = season * CYBER_WEEK, monday = season * CYBER_MONDAY;
    const rest = week - monday, wsum = DAYS.reduce((s, d) => s + d[1], 0);
    const days = DAYS.map(([d, w]) => [d, rest * w / wsum]).concat([['Mon 30', monday]]);
    const max = Math.max(...days.map(d => d[1]));
    out.innerHTML = '<div class="fe-out"><div><span>Season target</span><strong></strong><p></p></div><div><span>Cyber Week target</span><strong></strong><p></p></div><div><span>Cyber Monday</span><strong></strong><p></p></div></div><div class="hl-peak" aria-label="Daily targets for Cyber Week"></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = fmt(season); p[0].textContent = `1 Nov – 31 Dec, ${growth >= 0 ? '+' : ''}${growth}% on last year.`;
    s[1].textContent = fmt(week); p[1].textContent = `About ${Math.round(week / aov).toLocaleString('en-US')} orders in five days.`;
    s[2].textContent = fmt(monday); p[2].textContent = `About ${Math.round(monday / aov).toLocaleString('en-US')} orders in one day.`;
    const peak = out.querySelector('.hl-peak');
    days.forEach(([d, n]) => {
      const el = document.createElement('div');
      el.innerHTML = '<i></i><b></b><span></span>';
      el.querySelector('i').style.setProperty('--h', Math.max(4, n / max * 80) + '%');
      el.querySelector('b').textContent = fmt(n); el.querySelector('span').textContent = d + ' Nov';
      peak.append(el);
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
