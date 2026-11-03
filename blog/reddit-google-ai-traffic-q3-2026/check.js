(() => {
  'use strict';
  const form = document.getElementById('rt-check');
  const out = document.getElementById('rt-check-result');
  if (!form || !out) return;
  const pct = k => Math.min(100, Math.max(0, Number(form.elements.namedItem(k).value) || 0));
  const render = () => {
    const org = pct('org'), info = pct('info'), owned = pct('owned'), brand = form.elements.namedItem('brand').value;
    const exposed = Math.round(org * info / 100);
    const score = exposed + (brand === 'no' ? 10 : brand === 'some' ? 5 : 0) - Math.round(owned / 4);
    const level = score >= 35 ? 'lo' : score >= 18 ? 'mid' : 'hi';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = exposed + '%';
    box.querySelector('strong').textContent = level === 'lo' ? 'Highly exposed' : level === 'mid' ? 'Moderately exposed' : 'Lower exposure';
    box.querySelector('p').textContent = `About ${exposed}% of your visits come from question-type Google searches, the kind AI answers absorb first.`;
    const tips = [];
    if (exposed >= 20) tips.push('Add email or WhatsApp sign-ups to your top guides now.');
    if (owned < 25) tips.push('Grow owned channels towards a quarter of your traffic.');
    if (brand !== 'yes') tips.push('Invest in brand searches: reviews, Google Business Profile and a brand campaign.');
    tips.push('Rewrite top informational pages around decisions: prices, comparisons and local availability.');
    const ul = box.querySelector('ul'); tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
