(() => {
  'use strict';
  const form = document.getElementById('ob-calc');
  const out = document.getElementById('ob-calc-result');
  if (!form || !out) return;
  const PLAN = {
    local: [[0.15, 'Setup (days 1–14)', 'Google Business Profile, photos, WhatsApp Business and signage QR code'], [0.55, 'Local ads (days 15–90)', 'Google and Instagram ads within a few kilometres of your location'], [0.15, 'Reviews and referrals', 'A small thank-you offer for reviews and for bringing a friend'], [0.15, 'Launch event or offer', 'Opening week offer, approved before it is advertised']],
    online: [[0.25, 'Store setup (days 1–21)', 'Website or store, payments by card and QR, product photos'], [0.55, 'Ads (days 15–90)', 'Meta and Google Shopping ads with conversion tracking'], [0.1, 'Content', 'Short videos showing products in use'], [0.1, 'Retention', 'WhatsApp list and a second-order offer']],
    service: [[0.2, 'Setup (days 1–14)', 'Google profile, simple website with services and prices, WhatsApp'], [0.5, 'Search ads (days 15–90)', 'Google search ads for your main services in your area'], [0.15, 'Reviews and case studies', 'Ask every early client for a review and a photo'], [0.15, 'Partnerships', 'Referral deals with related local businesses']]
  };
  const render = () => {
    const key = form.elements.namedItem('type').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="ob-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.ob-rows');
    PLAN[key].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'ob-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Track every enquiry by source from day one, so the second quarter’s budget goes to what works.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
