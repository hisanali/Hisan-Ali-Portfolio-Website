(() => {
  'use strict';
  const form = document.getElementById('lw-plan');
  const out = document.getElementById('lw-plan-result');
  if (!form || !out) return;
  const PLAN = {
    food: [[0.3, 'Wed: National Day breakfast or lunch', 'Family set menus; ads to people within a few kilometres'], [0.25, 'Thu: celebration dinner', 'Group bookings and reservations by WhatsApp'], [0.25, 'Fri: White Friday treat', 'One simple offer, approved and on menus'], [0.2, 'Sat: last day out', 'Brunch and family deals; retarget past customers']],
    shop: [[0.2, 'Wed: gifts and early access', 'Preview the sale to your list; National Day gifting'], [0.2, 'Thu: last call before the sale', 'Show what goes on sale and delivery dates'], [0.4, 'Fri: White Friday', 'Main offer; fast replies; delivery promise you can keep'], [0.2, 'Sat: retargeting', 'People who browsed but didn’t buy']],
    stay: [[0.35, 'Wed: last-minute stays', 'Availability today and tomorrow; directions and photos'], [0.3, 'Thu: weekend escapes', 'Two-night packages and family rooms'], [0.2, 'Fri: White Friday booking offer', 'Book now for December–January stays'], [0.15, 'Sat: next long weekend', 'Retarget visitors for New Year and school holidays']],
    service: [[0.25, 'Wed: holiday hours and availability', 'Show open slots clearly'], [0.25, 'Thu: pre-celebration bookings', 'Grooming, beauty or check-ups before gatherings'], [0.3, 'Fri: White Friday package', 'Prepaid bundles to use in December'], [0.2, 'Sat: rebooking', 'Message past clients with next available slots']]
  };
  const render = () => {
    const goal = form.elements.namedItem('type').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="lw-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.lw-rows');
    PLAN[goal].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'lw-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Set Google Business Profile holiday hours for all four days, and schedule ads to pause outside your opening hours.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
