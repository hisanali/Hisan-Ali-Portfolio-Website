(() => {
  'use strict';
  const form = document.getElementById('cb-plan');
  const out = document.getElementById('cb-plan-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const size = v('size'), type = v('type'), team = v('team');
    let route, why;
    if (type === 'brand' && size === 'l') { route = 'Amazon DSP or an ad-tech partner'; why = 'Large brands sold through retailers gain most from shopping data and managed help; check country availability first.'; }
    else if (team === 'agency' || size === 'l') { route = 'An ad-tech partner or AI campaign tool'; why = 'Running ChatGPT alongside other channels makes comparison and retargeting easier.'; }
    else { route = 'OpenAI Ads Manager (self-serve)'; why = 'Simplest set-up and direct control of budget and creative, where it is available.'; }
    const test = size === 's' ? 'OMR 150–300' : size === 'm' ? 'OMR 500–1,500' : 'OMR 2,000+';
    out.innerHTML = '<div class="cb-rows"></div><div class="ed-result hi"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const list = out.querySelector('.cb-rows');
    [['Suggested route', route, why], ['First test budget', test, 'Run for four weeks with the same tracking as your other channels.'], ['Best first ad', type === 'service' ? 'Answer a common question' : 'A product that answers the query', type === 'service' ? 'Offer a free check or consultation that continues the answer.' : 'Show price, delivery and stock clearly.']].forEach(([a, b, c]) => { const d = document.createElement('div'); d.className = 'cb-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = a; d.querySelector('strong').textContent = b; d.querySelector('span').textContent = c; list.append(d); });
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = '4 wks';
    box.querySelector('strong').textContent = 'Treat it as a test';
    box.querySelector('p').textContent = 'Compare cost per lead or sale with Google and Meta before scaling.';
    const ul = box.querySelector('ul'); ['Confirm the route serves Oman and your other markets.', 'Review any automatic creative enhancements before they run.'].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
