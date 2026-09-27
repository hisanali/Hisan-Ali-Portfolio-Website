(() => {
  'use strict';
  const form = document.getElementById('ex-planner');
  const out = document.getElementById('ex-planner-result');
  if (!form || !out) return;
  const groups = {
    omani: { label: 'Omani customers', lang: 'Arabic (Omani tone), with English for younger urban audiences', channel: 'Instagram, Snapchat, Google Search and WhatsApp' },
    arab: { label: 'Arab expatriates', lang: 'Arabic in a neutral Gulf or Levantine tone rather than heavy Omani dialect', channel: 'Facebook, Instagram, Google Search and WhatsApp' },
    southAsian: { label: 'South Asian residents', lang: 'Bengali, Urdu, Hindi, Malayalam or Tamil depending on the community; English for professionals', channel: 'WhatsApp, Facebook and YouTube; community groups and word of mouth' },
    seAsian: { label: 'Southeast Asian residents', lang: 'English, with Tagalog touches for Filipino audiences', channel: 'Facebook, TikTok and community pages' },
    western: { label: 'Western & other expatriates', lang: 'English', channel: 'Google Search, Instagram, LinkedIn and expat community groups' }
  };
  const inputs = [...form.querySelectorAll('input[type="range"]')];
  const render = () => {
    inputs.forEach(input => { form.querySelector(`output[for="${input.id}"]`).value = input.value + '%'; });
    const total = inputs.reduce((sum, input) => sum + Number(input.value), 0);
    if (!total) { out.innerHTML = '<p class="fe-error">Move at least one slider above zero.</p>'; return; }
    const rows = inputs.map(input => [input.name, Number(input.value) / total * 100]).filter(([, share]) => share > 0).sort((a, b) => b[1] - a[1]);
    out.innerHTML = '<div class="ex-plan"></div><p class="fe-small"></p>';
    const plan = out.querySelector('.ex-plan');
    rows.forEach(([key, share]) => {
      const g = groups[key];
      const pct = Math.round(share);
      const tier = pct >= 20 ? ['t1', 'Native creative'] : pct >= 8 ? ['t2', 'Adapt key ads'] : ['t3', 'Fallback only'];
      const row = document.createElement('div');
      row.innerHTML = '<strong></strong><em></em><p></p><p></p>';
      row.querySelector('strong').textContent = `${g.label} · ${pct}%`;
      const badge = row.querySelector('em'); badge.className = tier[0]; badge.textContent = tier[1];
      const [langP, chanP] = row.querySelectorAll('p');
      langP.textContent = 'Language: ' + g.lang + '.';
      chanP.textContent = 'Start with: ' + g.channel + '.';
      plan.append(row);
    });
    out.querySelector('.fe-small').textContent = total === 100 ? 'Shares add up to 100%.' : `Your sliders add up to ${total}%, so shares were scaled to 100%.`;
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
