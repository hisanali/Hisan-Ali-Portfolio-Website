(() => {
  'use strict';
  const form = document.getElementById('sc-fit');
  const out = document.getElementById('sc-fit-result');
  if (!form || !out) return;
  // Weights are editorial judgement: audience fit matters most, then creative capacity and measurement.
  const keys = ['age', 'b2c', 'visual', 'video', 'pixel', 'budget'];
  const max = { age: 30, b2c: 20, visual: 15, video: 15, pixel: 10, budget: 10 };
  const render = () => {
    const values = keys.map(k => Number((form.querySelector(`input[name="${k}"]:checked`) || { value: 0 }).value));
    const score = Math.round(values.reduce((a, b) => a + b, 0) / keys.reduce((a, k) => a + max[k], 0) * 100);
    const weak = keys.filter((k, i) => values[i] < max[k] / 2);
    const tips = { age: 'Your audience skews older; test a small budget before committing.', b2c: 'B2B buyers are harder to reach here; LinkedIn and Google Search usually come first.', visual: 'Find a visual angle: before-and-after, behind the scenes or the people behind the product.', video: 'Plan simple vertical videos filmed on a phone; polish matters less than the first two seconds.', pixel: 'Install the Snap Pixel and Conversions API before spending, or you cannot optimise for sales.', budget: 'Small budgets spread thin; run one campaign with one goal for at least two weeks.' };
    const verdict = score >= 75 ? 'Strong fit. Snapchat should be in your core mix.' : score >= 50 ? 'Good fit for a test. Start with one campaign and a clear goal.' : 'Weak fit for now. Prioritise other channels, or fix the gaps below first.';
    out.innerHTML = '<div class="sc-score"><div class="sc-ring"><b></b></div><div><strong></strong><p></p></div></div>';
    out.querySelector('.sc-ring').style.setProperty('--s', score);
    out.querySelector('.sc-ring b').textContent = score;
    out.querySelector('strong').textContent = verdict;
    out.querySelector('p').textContent = weak.length ? 'Fix first: ' + weak.slice(0, 2).map(k => tips[k]).join(' ') : 'No major gaps. Test creative weekly and measure cost per customer, not views.';
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
