(() => {
  'use strict';
  const form = document.getElementById('rf-calc-form');
  const out = document.getElementById('rf-calc-result');
  const error = document.getElementById('rf-calc-error');
  if (!form || !out) return;
  const num = name => form.elements.namedItem(name).value.trim();
  const omr = v => 'OMR ' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 2 });
  // Round rewards to amounts people would actually print on a card.
  const nice = v => v < 2 ? Math.max(0.5, Math.round(v * 2) / 2) : v < 20 ? Math.round(v) : Math.round(v / 5) * 5;
  const render = () => {
    const aov = Number(num('aov')), margin = Number(num('margin')), orders = Number(num('orders'));
    const cacRaw = num('cac'), cac = cacRaw === '' ? null : Number(cacRaw);
    const bad = !(aov > 0) || !(margin > 0 && margin <= 100) || !(orders >= 1) || (cac !== null && !(cac >= 0));
    if (bad) { error.hidden = false; error.textContent = 'Enter an average order above 0, a margin between 1 and 100%, at least 1 order, and a non-negative ad cost.'; out.hidden = true; return; }
    error.hidden = true; out.hidden = false;
    const firstProfit = aov * margin / 100;
    const yearProfit = firstProfit * orders;
    const budget = cac ? Math.min(cac * 0.6, yearProfit * 0.3) : yearProfit * 0.3;
    const friend = nice(budget * 0.6), referrer = nice(budget * 0.4);
    const cost = friend + referrer;
    const saving = cac ? (cac - cost) / cac * 100 : null;
    const cells = [
      ['Friend gets', omr(friend) + ' off', `About ${Math.round(friend / aov * 100)}% of a first order. This is what gets the friend to act.`],
      ['Referrer gets', omr(referrer) + ' credit', 'As store credit, a free extra or a donation option, paid once the friend buys.'],
      ['Cost per new customer', omr(cost), saving === null ? `Out of ${omr(Math.round(yearProfit * 10) / 10)} first-year gross profit per customer.` : saving > 0 ? `${Math.round(saving)}% less than the ${omr(cac)} you pay through ads.` : `Not cheaper than ads at ${omr(cac)}. Lower the reward or improve repeat orders first.`]
    ];
    out.innerHTML = '<div class="rf-out">' + cells.map(() => '<div><span></span><strong></strong><p></p></div>').join('') + '</div>';
    out.querySelectorAll('.rf-out > div').forEach((cell, i) => {
      cell.querySelector('span').textContent = cells[i][0];
      cell.querySelector('strong').textContent = cells[i][1];
      cell.querySelector('p').textContent = cells[i][2];
    });
    if (cost > firstProfit) {
      const note = document.createElement('p');
      note.className = 'rf-note';
      note.textContent = `Heads up: the total reward (${omr(cost)}) is more than the gross profit on the first order (${omr(Math.round(firstProfit * 10) / 10)}). You only earn it back if referred customers come back, so track their repeat orders.`;
      out.append(note);
    }
  };
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  render();
})();
