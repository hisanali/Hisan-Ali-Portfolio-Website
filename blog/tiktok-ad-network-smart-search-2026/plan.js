(() => {
  'use strict';
  const form = document.getElementById('tn-plan');
  const out = document.getElementById('tn-plan-result');
  if (!form || !out) return;
  const PLAN = {
    sales: [[0.6, 'In-feed TikTok campaigns', 'Keep your proven campaigns as the control'], [0.25, 'Smart+ search ads', 'Capture product and brand searches; review search terms weekly'], [0.15, 'TikTok Ad Network', 'Retargeting only at first; judge on cost per purchase']],
    leads: [[0.6, 'In-feed lead campaigns', 'Your control, with instant forms or a landing page'], [0.25, 'Smart+ search ads', 'People searching for your service are warmer leads'], [0.15, 'TikTok Ad Network', 'Test with a strict app exclusion list and lead quality checks']],
    app: [[0.45, 'In-feed app campaigns', 'Your control for installs and in-app events'], [0.15, 'Smart+ search ads', 'Searches for your app category'], [0.4, 'TikTok Ad Network', 'Other apps are where app installs are cheapest; optimise for in-app events']],
    aware: [[0.6, 'In-feed reach campaigns', 'Creative-led video for attention'], [0.1, 'Smart+ search ads', 'Brand searches after people see your videos'], [0.3, 'TikTok Ad Network', 'Cheap extra reach; cap frequency and exclude low-quality apps']]
  };
  const render = () => {
    const key = form.elements.namedItem('goal').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="tn-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.tn-rows');
    PLAN[key].forEach(([w, name, idea]) => { const d = document.createElement('div'); d.className = 'tn-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = name; d.querySelector('strong').textContent = '\$' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = idea + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Run for four weeks, then compare cost per result by line and move budget to the winner.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
