(() => {
  'use strict';
  const form = document.getElementById('wa-calc');
  const out = document.getElementById('wa-calc-result');
  if (!form || !out) return;
  // Oman rates per delivered message from 1 October 2026, USD, as published in third-party trackers of Meta's rate card.
  // OMR is pegged at 1 USD = 0.3845 OMR.
  const RATE = { marketing: 0.0341, utility: 0.0247, auth: 0.0247, service: 0.0247 };
  const OMR = 0.3845, FREE_SERVICE = 1000;
  const n = name => Math.max(0, Number(form.elements.namedItem(name).value) || 0);
  const usd = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const omr = v => 'OMR ' + (v * OMR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const render = () => {
    const service = n('service'), utilIn = n('utilIn'), utilOut = n('utilOut'), marketing = n('marketing'), auth = n('auth');
    const billableService = Math.max(0, service - FREE_SERVICE);
    const lines = [
      ['Service replies', billableService * RATE.service, `${billableService.toLocaleString('en-US')} billable after the first ${FREE_SERVICE.toLocaleString('en-US')}`],
      ['Utility inside 24h window', utilIn * RATE.utility, 'Free until 30 Sep 2026, now charged'],
      ['Utility outside window', utilOut * RATE.utility, 'Charged before and after'],
      ['Marketing', marketing * RATE.marketing, 'Charged before and after'],
      ['Authentication', auth * RATE.auth, 'Charged before and after']
    ];
    const total = lines.reduce((s, l) => s + l[1], 0);
    const newCost = billableService * RATE.service + utilIn * RATE.utility;
    out.innerHTML = '<div class="fe-out"><div><span>New monthly cost</span><strong></strong><p></p></div><div><span>Added by the October change</span><strong></strong><p>Service replies above the free allowance plus utility messages inside the window.</p></div><div><span>Per year</span><strong></strong><p>At the same monthly volume.</p></div></div><div class="fe-table" style="margin-top:14px"><table><thead><tr><th scope="col">Message type</th><th scope="col">Cost / month</th><th scope="col">Note</th></tr></thead><tbody></tbody></table></div>';
    const st = out.querySelectorAll('.fe-out strong'), ps = out.querySelectorAll('.fe-out p');
    st[0].textContent = omr(total); ps[0].textContent = usd(total) + ' at Oman rates.';
    st[1].textContent = omr(newCost); st[2].textContent = omr(total * 12);
    const body = out.querySelector('tbody');
    lines.forEach(([a, v, c]) => { const tr = document.createElement('tr'); tr.innerHTML = '<th scope="row"></th><td class="fe-n"></td><td></td>'; tr.children[0].textContent = a; tr.children[1].textContent = omr(v); tr.children[2].textContent = c; body.append(tr); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
