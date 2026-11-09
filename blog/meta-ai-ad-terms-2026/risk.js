(() => {
  'use strict';
  const days = document.getElementById('ma-days'), box = document.querySelector('.ma-count');
  if (days && box) {
    const left = Math.ceil((Date.parse(box.dataset.deadline) - Date.now()) / 864e5);
    if (left > 0) days.textContent = left;
    else { days.textContent = 'Now'; box.querySelector('.ma-count-l').textContent = 'The new terms apply. Keep auditing monthly.'; }
  }
  const form = document.getElementById('ma-check');
  const out = document.getElementById('ma-check-result');
  if (!form || !out) return;
  // Weights: settings that let AI change ads unseen count most; sector raises the stakes of any edit.
  const W = { regulated: 3, prices: 2, visual: 1, languages: 1, defaults: 3, text: 2, translate: 2, noreview: 3, nolog: 2 };
  const FIX = {
    defaults: 'Open each live ad and switch off Advantage+ creative enhancements you have not reviewed.',
    text: 'Turn off text improvements and variations, or approve every variation before it runs.',
    translate: 'Switch off automatic translations unless a fluent person checks each one.',
    noreview: 'Preview every placement (Feed, Stories, Reels, Threads) after launch and screenshot it.',
    nolog: 'Save the approved copy, image and settings for each ad, with the date.',
    regulated: 'For regulated claims, keep all AI text and image changes off and get claims signed off.',
    prices: 'Check that prices and discount wording in every variation match your offer exactly.'
  };
  const render = () => {
    const on = k => form.elements.namedItem(k).checked;
    const max = Object.values(W).reduce((a, b) => a + b, 0);
    const score = Object.keys(W).reduce((s, k) => s + (on(k) ? W[k] : 0), 0);
    const pct = Math.round(score / max * 100);
    const level = pct >= 67 ? ['High', 'AI could change your ads in ways nobody checks, in areas where mistakes are costly.']
      : pct >= 34 ? ['Medium', 'Some edits could slip through. Fix the settings below before 20 November.']
      : ['Low', 'Your setup limits unreviewed AI edits. Keep a monthly check in place.'];
    const todo = Object.keys(FIX).filter(on).map(k => FIX[k]).slice(0, 4);
    if (!todo.length) todo.push('Repeat this check monthly; Meta adds and re-enables features over time.');
    out.innerHTML = '<div class="ma-meter" aria-hidden="true"><i></i></div><div class="ma-meter-l" aria-hidden="true"><span>Low</span><span>Medium</span><span>High</span></div><div class="fe-out"><div><span>Exposure</span><strong></strong><p></p></div><div><span>Score</span><strong></strong><p>Higher means more room for unreviewed AI edits.</p></div></div><div class="ma-todo"><b>Do first</b><ol></ol></div>';
    out.querySelector('.ma-meter i').style.left = Math.min(98, Math.max(2, pct)) + '%';
    const s = out.querySelectorAll('.fe-out strong');
    s[0].textContent = level[0]; out.querySelector('.fe-out p').textContent = level[1];
    s[1].textContent = pct + ' / 100';
    const ol = out.querySelector('ol');
    todo.forEach(t => { const li = document.createElement('li'); li.textContent = t; ol.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
