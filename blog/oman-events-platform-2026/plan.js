(() => {
  'use strict';
  const form = document.getElementById('ev-plan');
  const out = document.getElementById('ev-plan-result');
  if (!form || !out) return;
  const PLAN = {
    food: ['Plan an event-night menu or “show your ticket” offer', 'Post the offer and set special hours on Google', 'Run location ads around the venue', 'Thank visitors and ask for reviews'],
    stay: ['Build a stay or trip package around the event', 'Promote the package to past guests and nearby markets', 'Push last-minute availability', 'Share guest photos and collect reviews'],
    shop: ['Pick event-related products and stock up', 'Announce the event-weekend offer', 'Run location ads near the venue', 'Retarget event-weekend visitors'],
    org: ['Ask the ministry to list your event on Oman’s Events', 'Start ads linking to the listing and ticket page', 'Partner with nearby cafés and hotels', 'Share highlights and announce the next date']
  };
  const OFFS = [-42, -14, -3, 2];
  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const render = () => {
    const v = form.elements.namedItem('date').value; const type = form.elements.namedItem('type').value;
    const start = v ? new Date(v + 'T00:00:00') : null;
    out.innerHTML = '<div class="ed-result hi"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    if (!start || isNaN(start)) { box.querySelector('strong').textContent = 'Pick an event date'; return; }
    const days = Math.ceil((start - new Date()) / 864e5);
    box.querySelector('.big').textContent = days > 0 ? days + ' days' : 'Now';
    box.querySelector('strong').textContent = 'Your event plan';
    box.querySelector('p').textContent = days < 14 && days > 0 ? 'Short on time: start with the last two steps.' : 'Four steps, dated:';
    const ul = box.querySelector('ul');
    PLAN[type].forEach((t, i) => { const d = new Date(start); d.setDate(d.getDate() + OFFS[i]); const li = document.createElement('li'); li.textContent = fmt(d) + ': ' + t + '.'; ul.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
