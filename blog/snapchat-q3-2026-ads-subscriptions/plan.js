(() => {
  'use strict';
  const form = document.getElementById('sn-plan');
  const out = document.getElementById('sn-plan-result');
  if (!form || !out) return;
  const PLAN = {
    sales: [[0.55, 'Single image and video ads to your store', 'Optimise for purchases with the Snap Pixel'], [0.2, 'Collection or catalogue ads', 'Show several products from your feed'], [0.15, 'Sponsored Snaps', 'An offer in the inbox, with a reason to open'], [0.1, 'Retargeting', 'Visitors and cart abandoners from the past 30 days']],
    leads: [[0.5, 'Lead generation ads', 'Instant forms with two or three questions'], [0.25, 'Sponsored Snaps', 'Invite people to book, with a clear deadline'], [0.15, 'Video ads to a landing page', 'Explain the service in 10 seconds'], [0.1, 'Retargeting', 'People who opened but didn’t submit']],
    store: [[0.45, 'Video ads with location targeting', 'People within a few kilometres of your branches'], [0.25, 'Sponsored Snaps', 'Weekend offer to bring them in'], [0.2, 'AR Lens or filter', 'For launches and events in store'], [0.1, 'Retargeting', 'People who engaged with earlier ads']],
    launch: [[0.45, 'Video ads for reach', 'Native, fast vertical video with Arabic captions'], [0.25, 'AR Lens', 'Let people try the product or join the moment'], [0.2, 'Sponsored Snaps', 'Launch invitation in the inbox'], [0.1, 'Retargeting', 'Viewers who watched most of the video']]
  };
  const render = () => {
    const goal = form.elements.namedItem('goal').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="sn-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.sn-rows');
    PLAN[goal].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'sn-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = 'OMR ' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Install the Snap Pixel before you start, and compare cost per result with Meta and TikTok after four weeks.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
