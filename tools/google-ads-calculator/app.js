(function () {
  'use strict';
  const { $, $$, icon, esc, copy, segmented, steps } = window.TK;

  // Rough GCC starting points (CPC in USD, conversion %, close %, sale value USD). Labelled as estimates in the UI.
  const PRESETS = {
    realestate: { cpc: 1.6, cvr: 3, close: 4, value: 6000 },
    clinic: { cpc: 1.2, cvr: 7, close: 35, value: 120 },
    restaurant: { cpc: 0.45, cvr: 9, close: 60, value: 25 },
    ecommerce: { cpc: 0.5, cvr: 2.2, close: 100, value: 45 },
    education: { cpc: 1.1, cvr: 6, close: 15, value: 900 },
    b2b: { cpc: 2.4, cvr: 4, close: 12, value: 2500 }
  };
  const CURRENCY = { OMR: { rate: 0.385, dp: 3 }, AED: { rate: 3.6725, dp: 2 }, SAR: { rate: 3.75, dp: 2 }, QAR: { rate: 3.64, dp: 2 }, USD: { rate: 1, dp: 2 } };

  const el = {
    cur: $('#gaCurrency'), budget: $('#gaBudget'), cpc: $('#gaCpc'), cvr: $('#gaCvr'), close: $('#gaClose'), value: $('#gaValue'), target: $('#gaTarget'),
    clicks: $('#gaClicks'), leads: $('#gaLeads'), cpl: $('#gaCpl'), customers: $('#gaCustomers'), revenue: $('#gaRevenue'), roas: $('#gaRoas'), profit: $('#gaProfit'),
    funnel: $('#gaFunnel'), verdict: $('#gaVerdict'), need: $('#gaNeed'), copyBtn: $('#gaCopy'), units: $$('[data-cur]')
  };
  const tracker = steps($('#tkSteps'));
  const mode = segmented($('#gaMode'), () => { $('#gaBudgetField').hidden = mode.value !== 'budget'; $('#gaTargetField').hidden = mode.value !== 'target'; calc(); });
  let cur = 'OMR';

  const num = (input) => { const v = parseFloat(String(input.value).replace(/,/g, '')); return Number.isFinite(v) && v >= 0 ? v : 0; };
  const money = (v, c = cur) => `${c} ${v.toLocaleString(undefined, { minimumFractionDigits: v >= 1000 ? 0 : CURRENCY[c].dp, maximumFractionDigits: v >= 1000 ? 0 : CURRENCY[c].dp })}`;
  const int = (v) => Math.round(v).toLocaleString();

  function convertInputs(from, to) {
    const k = CURRENCY[to].rate / CURRENCY[from].rate;
    [el.budget, el.cpc, el.value].forEach((i) => { if (i.value !== '') i.value = +(num(i) * k).toFixed(CURRENCY[to].dp); });
  }
  el.cur.addEventListener('change', () => { convertInputs(cur, el.cur.value); cur = el.cur.value; el.units.forEach((u) => { u.textContent = cur; }); calc(); });

  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.preset];
    const r = CURRENCY[cur].rate;
    el.cpc.value = +(p.cpc * r).toFixed(CURRENCY[cur].dp);
    el.cvr.value = p.cvr;
    el.close.value = p.close;
    el.value.value = +(p.value * r).toFixed(CURRENCY[cur].dp);
    $$('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    calc();
  }));

  function calc() {
    const cpc = num(el.cpc);
    const cvr = num(el.cvr) / 100;
    const close = num(el.close) / 100;
    const value = num(el.value);
    let budget = num(el.budget);
    if (mode.value === 'target') {
      const wanted = num(el.target);
      budget = cvr > 0 ? (wanted / cvr) * cpc : 0;
      el.need.innerHTML = cvr > 0 && cpc > 0 ? `To get <b>${int(wanted)} leads</b> a month you need about <b>${money(budget)}</b> in ad spend.` : 'Enter a cost per click and conversion rate.';
    }
    const ready = cpc > 0 && cvr > 0 && budget > 0;
    const clicks = ready ? budget / cpc : 0;
    const leads = clicks * cvr;
    const customers = leads * close;
    const revenue = customers * value;
    const roas = budget > 0 ? revenue / budget : 0;
    const profit = revenue - budget;
    el.clicks.textContent = int(clicks);
    el.leads.textContent = leads >= 10 ? int(leads) : leads.toFixed(1);
    el.cpl.textContent = leads > 0 ? money(budget / leads) : '–';
    el.customers.textContent = customers >= 10 ? int(customers) : customers.toFixed(1);
    el.revenue.textContent = money(revenue);
    el.roas.textContent = roas ? `${roas.toFixed(1)}×` : '–';
    el.profit.textContent = money(profit);
    el.profit.parentElement.classList.toggle('is-neg', profit < 0);

    const max = Math.max(clicks, 1);
    el.funnel.innerHTML = [['Clicks', clicks], ['Leads', leads], ['Customers', customers]].map(([k, v]) => `<div class="ga-bar"><span>${k}</span><i style="--w:${Math.max(2, (v / max) * 100)}%"></i><b>${v >= 10 ? int(v) : v.toFixed(1)}</b></div>`).join('');

    let tone = '';
    let msg = 'Enter your numbers — or pick an industry to start from typical figures.';
    if (ready && value > 0) {
      if (roas >= 4) { tone = 'is-ok'; msg = `Healthy: every ${cur} 1 in ads brings back about ${cur} ${roas.toFixed(1)} in sales.`; } else if (roas >= 1) { tone = 'is-warn'; msg = `Break-even zone: revenue covers ad spend, but margins and other costs may not be covered. Improving conversion rate is usually the fastest fix.`; } else { tone = 'is-err'; msg = 'At these numbers the campaign loses money. Raise the conversion rate, the close rate or the sale value before increasing budget.'; }
    } else if (ready) { tone = ''; msg = 'Add an average sale value to see revenue and return on ad spend.'; }
    el.verdict.className = `tk-note ${tone}`;
    el.verdict.innerHTML = `${icon(tone === 'is-ok' ? 'checkc' : tone ? 'alert' : 'info')}<span>${esc(msg)}</span>`;
    el.copyBtn.disabled = !ready;
    tracker.set(!ready ? 1 : value > 0 ? 3 : 2);
  }

  el.copyBtn.addEventListener('click', () => {
    const lines = [
      `Google Ads estimate (${cur})`,
      `Monthly budget: ${money(mode.value === 'target' ? (num(el.target) / (num(el.cvr) / 100)) * num(el.cpc) : num(el.budget))}`,
      `Avg. CPC: ${money(num(el.cpc))} · Conversion rate: ${num(el.cvr)}% · Close rate: ${num(el.close)}%`,
      `Clicks: ${el.clicks.textContent} · Leads: ${el.leads.textContent} · Cost per lead: ${el.cpl.textContent}`,
      `Customers: ${el.customers.textContent} · Revenue: ${el.revenue.textContent} · ROAS: ${el.roas.textContent}`,
      'Made with hisanali.com/tools/google-ads-calculator/'
    ];
    copy(lines.join('\n'), 'Summary copied');
  });

  $$('#gaInputs input').forEach((i) => i.addEventListener('input', calc));
  calc();
})();
