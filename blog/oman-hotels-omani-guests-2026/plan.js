(() => {
  'use strict';
  const form = document.getElementById('ho-plan');
  const out = document.getElementById('ho-plan-result');
  if (!form || !out) return;
  const PLAN = {
    city: [[0.45, 'Residents in Oman', 'Weekend staycations, brunch and pool passes, National Day stays'], [0.25, 'GCC visitors', 'Short breaks for UAE cities with direct flights; flexible cancellation'], [0.2, 'Business and events', 'Corporate rates and meeting packages for Q1'], [0.1, 'Retargeting', 'People who viewed rooms but didn’t book']],
    resort: [[0.4, 'Residents in Oman', 'Family weekends, school holidays and National Day packages'], [0.25, 'GCC visitors', 'Drive-in markets from the UAE; long-weekend offers'], [0.25, 'European winter sun', 'Through tour operators and trade partners, plus targeted ads'], [0.1, 'Retargeting', 'Abandoned searches and past guests']],
    camp: [[0.35, 'Residents and expats', 'Overnight escapes, stargazing and group bookings'], [0.3, 'International travellers', 'Listings on booking platforms and with tour operators'], [0.25, 'GCC visitors', 'Weekend desert trips with clear prices and transport'], [0.1, 'Retargeting', 'Visitors to your booking page']]
  };
  const render = () => {
    const key = form.elements.namedItem('type').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="ho-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.ho-rows');
    PLAN[key].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'ho-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Residents booked more in 2026 while GCC guests fell 19%, so the split leans local. Revisit it monthly.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
