(() => {
  'use strict';
  const form = document.getElementById('dg-form');
  const out = document.getElementById('dg-result');
  if (!form || !out) return;
  const num = (k) => Math.max(0, Math.floor(Number(form.elements.namedItem(k).value) || 0));
  const on = (k) => form.elements.namedItem(k).checked;
  const render = () => {
    const count = num('count'); const cpc = Math.min(num('cpc'), count);
    const steps = [];
    if (!on('conv')) steps.push('Fix conversion tracking first. Demand Gen bidding learns from conversions, and you need a fair before-and-after comparison.');
    steps.push('Export the last 30 days of results for each Display campaign, so you can compare after the move.');
    if (cpc) steps.push(cpc === 1 ? '1 campaign uses Manual CPC. Set a Target CPC close to its current average cost per click.' : cpc + ' campaigns use Manual CPC. Set a Target CPC close to each one’s current average cost per click.');
    if (on('excl')) steps.push('Rebuild campaign-level placement and content exclusions at account level before migrating.');
    if (on('lift')) steps.push('Finish or report any Brand Lift or Search Lift studies on Display first; they are not supported there in Demand Gen.');
    if (!on('assets')) steps.push('Prepare square images and short vertical videos, so you can test YouTube and Discover later.');
    const batches = Math.max(1, Math.ceil(count / 100));
    steps.push(count ? 'Migrate in ' + batches + (batches === 1 ? ' batch' : ' batches') + ', keep campaigns on Display only, and compare results after two weeks.' : 'No Display campaigns to move. Plan new upper-funnel campaigns in Demand Gen.');
    const issues = (on('conv') ? 0 : 2) + (cpc ? 1 : 0) + (on('excl') ? 1 : 0) + (on('lift') ? 1 : 0);
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div><div class="dg-steps"></div>';
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = String(steps.length);
    if (!count) { box.classList.add('hi'); box.querySelector('strong').textContent = 'Nothing to migrate'; box.querySelector('p').textContent = 'You can go straight to Demand Gen for new campaigns.'; }
    else if (issues >= 3) { box.classList.add('lo'); box.querySelector('strong').textContent = 'Fix these before you migrate'; box.querySelector('p').textContent = 'Moving now could change costs and placements. Work through the steps in order.'; }
    else if (issues) { box.classList.add('mid'); box.querySelector('strong').textContent = 'A few fixes, then migrate'; box.querySelector('p').textContent = 'Most of the account will move cleanly once these are done.'; }
    else { box.classList.add('hi'); box.querySelector('strong').textContent = 'Ready to migrate'; box.querySelector('p').textContent = 'Use the migration tool now, before Google moves the campaigns for you.'; }
    const list = out.querySelector('.dg-steps');
    steps.forEach((s, i) => { const li = document.createElement('div'); li.className = 'dg-step'; li.innerHTML = '<b></b><span></span>'; li.querySelector('b').textContent = String(i + 1); li.querySelector('span').textContent = s; list.append(li); });
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
