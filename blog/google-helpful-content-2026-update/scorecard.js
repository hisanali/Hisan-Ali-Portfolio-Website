(() => {
  'use strict';
  const form = document.getElementById('hc-score');
  const out = document.getElementById('hc-score-result');
  if (!form || !out) return;
  const NAMES = { effort: 'Effort', orig: 'Originality', skill: 'Talent or skill', acc: 'Accuracy' };
  const FIX = {
    effort: 'Add your own photos, tests or research, and say how and when the content was made.',
    orig: 'Add something only you have: data, a tool, a real example or first-hand experience.',
    skill: 'Cut padding, answer early, add tables and make sure every tool works on mobile.',
    acc: 'Link primary sources, add a “checked on” date and set a review schedule.'
  };
  const v = name => Number(form.elements.namedItem(name).value);
  const render = () => {
    const ymyl = v('ymyl') === 1, author = v('author');
    const scores = Object.keys(NAMES).map(k => [k, v(k)]);
    // Health, money, legal and safety topics need a higher accuracy bar, so accuracy counts double.
    const total = scores.reduce((s, [k, x]) => s + x * (ymyl && k === 'acc' ? 2 : 1), 0) / (ymyl ? 5 : 4) * 10 + author * 2;
    const pct = Math.max(0, Math.min(100, Math.round(total)));
    const weakest = scores.slice().sort((a, b) => a[1] - b[1] || (b[0] === 'acc' && ymyl ? 1 : 0))[0][0];
    const verdict = author < 0 ? ['Untrustworthy', 'Google’s guidance calls invented authors deception. Remove the fake profile before anything else.']
      : pct >= 75 ? ['Strong', 'The page shows the qualities Google describes. Keep it updated.']
      : pct >= 50 ? ['Average', 'Readers get value, but similar pages are easy to find. Lift the weakest attribute.']
      : ['Weak', 'The page is at risk of being seen as low effort. Start with the weakest attribute below.'];
    out.innerHTML = '<div class="fe-out"><div><span>Page score</span><strong></strong><p></p></div><div><span>Verdict</span><strong></strong><p></p></div><div><span>Fix first</span><strong></strong><p></p></div></div><div class="hc-bars"></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = pct + ' / 100'; p[0].textContent = ymyl ? 'Accuracy counted double for a health, money, legal or safety topic.' : 'Average of the four attributes, adjusted for authorship.';
    s[1].textContent = verdict[0]; p[1].textContent = verdict[1];
    s[2].textContent = NAMES[weakest]; p[2].textContent = FIX[weakest];
    const bars = out.querySelector('.hc-bars');
    scores.forEach(([k, x]) => {
      const row = document.createElement('div'); row.className = 'hc-bar' + (k === weakest ? ' weak' : '');
      row.innerHTML = '<span></span><i aria-hidden="true"></i><b></b>';
      row.children[0].textContent = NAMES[k]; row.children[2].textContent = x + '/10';
      row.children[1].style.setProperty('--w', x);
      row.children[1].style.setProperty('--c', x <= 3 ? 'var(--fe-low)' : x <= 6 ? 'var(--fe-mid)' : 'var(--fe-high)');
      bars.append(row);
    });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
