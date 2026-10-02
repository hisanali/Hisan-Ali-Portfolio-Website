(function () {
  'use strict';
  const { $, $$, icon, esc, copy, steps } = window.TK;

  const el = {
    cur: $('#roiCurrency'), cost: $('#roiCost'), aov: $('#roiAov'), margin: $('#roiMargin'), sales: $('#roiSales'), salesOut: $('#roiSalesOut'), target: $('#roiTarget'), targetOut: $('#roiTargetOut'),
    be: $('#roiBe'), beRev: $('#roiBeRev'), roi: $('#roiRoi'), profit: $('#roiProfit'), revenue: $('#roiRevenue'), need: $('#roiNeed'), verdict: $('#roiVerdict'), meter: $('#roiMeter'), copyBtn: $('#roiCopy'), units: $$('[data-cur]')
  };
  const tracker = steps($('#tkSteps'));
  const num = (i) => { const v = parseFloat(String(i.value).replace(/,/g, '')); return Number.isFinite(v) && v >= 0 ? v : 0; };
  const money = (v) => `${el.cur.value} ${Math.round(v).toLocaleString()}`;

  el.cur.addEventListener('change', () => { el.units.forEach((u) => { u.textContent = el.cur.value; }); calc(); });

  function calc() {
    const cost = num(el.cost);
    const aov = num(el.aov);
    const margin = Math.min(100, num(el.margin)) / 100;
    const unitProfit = aov * margin;
    const ready = cost > 0 && unitProfit > 0;
    const be = ready ? Math.ceil(cost / unitProfit) : 0;
    // Keep the sales slider range sensible around break-even.
    const max = Math.max(20, be * 3);
    if (Number(el.sales.max) !== max) { el.sales.max = max; if (num(el.sales) > max) el.sales.value = max; }
    el.sales.style.setProperty('--p', `${(num(el.sales) / max) * 100}%`);
    const sales = num(el.sales);
    el.salesOut.textContent = `${sales.toLocaleString()} sales`;
    el.targetOut.textContent = `${num(el.target)}%`;
    const revenue = sales * aov;
    const profit = sales * unitProfit - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;
    const need = ready ? Math.ceil((cost * (1 + num(el.target) / 100)) / unitProfit) : 0;

    el.be.textContent = ready ? be.toLocaleString() : '–';
    el.beRev.textContent = ready ? money(be * aov) : '–';
    el.revenue.textContent = money(revenue);
    el.profit.textContent = money(profit);
    el.roi.textContent = cost > 0 ? `${roi >= 0 ? '+' : ''}${Math.round(roi)}%` : '–';
    el.roi.parentElement.classList.toggle('is-neg', roi < 0);
    el.need.innerHTML = ready ? `For a <b>${num(el.target)}% ROI</b> you need <b>${need.toLocaleString()} sales</b> (${money(need * aov)} revenue).` : 'Enter cost, sale value and margin.';
    el.meter.style.setProperty('--x', `${ready ? Math.min(100, (sales / max) * 100) : 0}%`);
    el.meter.style.setProperty('--be', `${ready ? Math.min(100, (be / max) * 100) : 0}%`);

    let tone = '';
    let msg = 'Fill in the campaign cost, average sale value and gross margin.';
    if (ready) {
      if (sales >= need) { tone = 'is-ok'; msg = `${sales} sales beats your ${num(el.target)}% ROI target.`; } else if (sales >= be) { tone = 'is-warn'; msg = `Profitable, but ${need - sales} more sales are needed to hit your ${num(el.target)}% target.`; } else { tone = 'is-err'; msg = `${be - sales} more sales needed just to break even.`; }
    }
    el.verdict.className = `tk-note ${tone}`;
    el.verdict.innerHTML = `${icon(tone === 'is-ok' ? 'checkc' : tone ? 'alert' : 'info')}<span>${esc(msg)}</span>`;
    el.copyBtn.disabled = !ready;
    tracker.set(!ready ? 1 : 3);
  }

  el.copyBtn.addEventListener('click', () => copy([
    'Marketing ROI summary',
    `Campaign cost: ${money(num(el.cost))} · Avg. sale: ${money(num(el.aov))} · Margin: ${num(el.margin)}%`,
    `Break-even: ${el.be.textContent} sales (${el.beRev.textContent})`,
    `At ${num(el.sales)} sales: revenue ${el.revenue.textContent}, profit ${el.profit.textContent}, ROI ${el.roi.textContent}`,
    'Made with hisanali.com/tools/marketing-roi-calculator/'
  ].join('\n'), 'Summary copied'));

  $$('#roiInputs input').forEach((i) => i.addEventListener('input', calc));
  calc();
})();
