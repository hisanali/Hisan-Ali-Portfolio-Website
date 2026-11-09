(() => {
  'use strict';
  const form = document.getElementById('op-calc');
  const out = document.getElementById('op-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const omr = x => 'OMR ' + Math.round(x).toLocaleString('en-US');
  const render = () => {
    const cost = n('cost'), done = n('done'), escrow = n('escrow'), plan = n('plan');
    const need = cost * 0.2, gap = Math.max(0, need - done), cap = escrow * 0.03;
    const met = cost > 0 && gap === 0;
    const pct = cost > 0 ? Math.min(100, done / cost * 100) : 0;
    const cls = met && plan <= cap ? 'hi' : met ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = pct.toFixed(1) + '%';
    box.querySelector('strong').textContent = met ? 'Threshold reached: off-plan marketing can start once the permit is in place' : `${omr(gap)} to go before off-plan marketing in the zones`;
    box.querySelector('p').textContent = `The 20% threshold for a project of ${omr(cost)} is ${omr(need)}. Your escrow-funded marketing ceiling at 3% is ${omr(cap)}.`;
    const ul = box.querySelector('ul'); const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (plan > cap) add(`Your planned budget of ${omr(plan)} is ${omr(plan - cap)} above the escrow ceiling. Fund the difference from the developer’s own money or phase the campaign.`); else add(`Your planned budget of ${omr(plan)} fits within the escrow ceiling, leaving ${omr(cap - plan)}.`);
    if (!met) add('Until then, build a waiting list with brand and area content, and prepare the permit application and launch creative.');
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
