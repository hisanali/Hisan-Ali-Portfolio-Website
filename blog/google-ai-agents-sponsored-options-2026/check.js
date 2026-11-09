(() => {
  'use strict';
  const form = document.getElementById('ag-check');
  const out = document.getElementById('ag-check-result');
  if (!form || !out) return;
  const TIPS = { feed: 'Set up Google Merchant Center and submit a product feed.', price: 'Update prices and stock in the feed at least daily.', ship: 'Add delivery times and costs to your feed and Merchant Center.', returns: 'Publish a clear return policy and add it in Merchant Center.', reviews: 'Start collecting product reviews after every order.', titles: 'Rewrite titles with brand, model, size and colour.', track: 'Track purchases with order values in Google Ads.', pmax: 'Run a Shopping or Performance Max campaign to build data.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Agent-ready' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Fix these first:' : 'Everything is in place. Keep your feed fresh.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
