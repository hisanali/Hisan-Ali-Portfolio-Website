(() => {
  'use strict';
  const form = document.getElementById('om-plan');
  const out = document.getElementById('om-plan-result');
  if (!form || !out) return;
  const PLAN = {
    hotel: [[0.4, 'Residents and expats in Oman', 'Weekend and holiday packages, family rooms, Arabic and English'], [0.2, 'India and Asia', 'Long-weekend offers; travel agents and targeted ads in key cities'], [0.2, 'Europe', 'Flexible cancellation and tour operators; reassure on travel'], [0.1, 'GCC', 'Drive-in markets and short breaks with clear prices'], [0.1, 'Retargeting', 'People who viewed rooms but didn’t book']],
    tour: [[0.3, 'Residents and expats in Oman', 'Weekend trips, school holidays and group bookings'], [0.25, 'Europe', 'Listings with tour operators and booking platforms'], [0.2, 'India and Asia', 'Packages with hotels and travel agents'], [0.15, 'GCC', 'Desert and mountain weekends'], [0.1, 'Retargeting', 'Visitors to your booking page']],
    rest: [[0.5, 'Residents and expats in Oman', 'Weekend offers, family deals and events'], [0.2, 'Hotel guests nearby', 'Partnerships with hotels and concierge desks'], [0.15, 'Tourists on Google Maps', 'Complete profile, photos, menus and reviews in English'], [0.15, 'Retargeting', 'People who engaged with your posts and ads']]
  };
  const render = () => {
    const goal = form.elements.namedItem('type').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="om-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.om-rows');
    PLAN[goal].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'om-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Keep 15–20% of each line for bookings in the final two weeks before a holiday; guests are booking later this year.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
