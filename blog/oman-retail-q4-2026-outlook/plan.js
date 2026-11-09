(() => {
  'use strict';
  const form = document.getElementById('rq-plan');
  const out = document.getElementById('rq-plan-result');
  if (!form || !out) return;
  const PLAN = {
    fashion: [[0.25, 'National Day', 'Gift sets in national colours, wrapped and ready'], [0.35, 'White Friday', 'Bundles and gift with purchase rather than deep discounts'], [0.2, 'December', 'Winter visitors and school holidays: bestsellers and gifting'], [0.2, 'January', 'New Year and early Ramadan collections; settle approvals']],
    electronics: [[0.15, 'National Day', 'Family TVs and appliances for holiday gatherings'], [0.45, 'White Friday', 'Hero deals on a few models, with instalments and QR payment'], [0.2, 'December', 'Gifts and accessories; bundles with warranties'], [0.2, 'January', 'Ramadan home appliances: fridges, ovens, air fryers']],
    food: [[0.3, 'National Day', 'Family set menus and group bookings for the holiday'], [0.15, 'White Friday', 'Vouchers and gift cards rather than discounts'], [0.35, 'December', 'Winter evenings outdoors, visitors and New Year bookings'], [0.2, 'January', 'Iftar and suhoor packages, announced early']],
    home: [[0.2, 'National Day', 'Majlis refresh ahead of family visits'], [0.35, 'White Friday', 'Room bundles with delivery and assembly'], [0.15, 'December', 'Outdoor furniture for the cool season'], [0.3, 'January', 'Ramadan majlis, dining and kitchen sets']],
    online: [[0.2, 'National Day', 'Fast delivery before the holiday; gift messages'], [0.4, 'White Friday', 'Clear offers, prepaid by QR or transfer to cut COD'], [0.2, 'December', 'Retargeting holiday browsers; gifting'], [0.2, 'January', 'Ramadan pre-orders and delivery slots']]
  };
  const render = () => {
    const biz = form.elements.namedItem('biz').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="rq-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.rq-rows');
    PLAN[biz].forEach(([w, peak, idea]) => { const d = document.createElement('div'); d.className = 'rq-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = peak; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Keep 10–15% of each slice for retargeting people who visited but did not buy. Every discount needs approval before it is advertised.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
