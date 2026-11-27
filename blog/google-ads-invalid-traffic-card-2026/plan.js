(() => {
  'use strict';
  const form = document.getElementById('iv-calc');
  const out = document.getElementById('iv-calc-result');
  if (!form || !out) return;
  const num = n => Math.max(0, Number(form.elements.namedItem(n).value) || 0);
  const render = () => {
    const spend = num('spend'), save = num('save'), cred = num('cred');
    const gross = spend + save;
    const share = gross > 0 ? (save + cred) / gross * 100 : 0;
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(share < 5 ? 'hi' : share < 12 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = share.toFixed(1) + '%';
    box.querySelector('strong').textContent = 'Of your traffic value caught as invalid';
    box.querySelector('p').textContent = 'OMR ' + (save + cred).toFixed(0) + ' not charged or credited back this month.';
    const ul = box.querySelector('ul');
    const tips = share < 5 ? ['A normal-looking level. Keep checking monthly for jumps.'] : share < 12 ? ['Worth a look: find the campaign with the most invalid activity.', 'Review placements in Display, Demand Gen and Performance Max.'] : ['High. Check which campaigns and placements drive it.', 'Exclude poor apps and sites, and compare leads with your CRM.'];
    tips.push('These bands are a rule of thumb, not a Google benchmark.');
    tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
