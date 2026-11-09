(() => {
  'use strict';
  const form = document.getElementById('pa-calc');
  const out = document.getElementById('pa-calc-result');
  if (!form || !out) return;
  const v = k => Number(form.elements.namedItem(k).value);
  const f = x => Math.round(x).toLocaleString('en-US');
  const render = () => {
    const spend = Math.max(0, v('spend') || 0), cpa = Math.max(0.01, v('cpa') || 0.01), lift = Math.min(90, Math.max(0, v('lift') || 0)), fee = Math.max(0, v('fee') || 0), margin = Math.max(0, v('margin') || 0);
    if (!spend) { out.innerHTML = '<p class="fe-error">Enter the ad spend you plan to put behind the partnership ad.</p>'; return; }
    const newCpa = cpa * (1 - lift / 100);
    const brandOrders = spend / cpa, partnerOrders = spend / newCpa, extra = partnerOrders - brandOrders;
    const gain = extra * margin - fee;
    // Lift at which the extra orders exactly cover the creator fee.
    const breakOrders = margin ? fee / margin : Infinity;
    const breakLift = margin && Number.isFinite(breakOrders) ? (1 - spend / (cpa * (brandOrders + breakOrders))) * 100 : null;
    out.innerHTML = '<div class="fe-out"><div><span>Extra orders</span><strong></strong><p></p></div><div><span>Profit after fee</span><strong></strong><p></p></div><div><span>Break-even improvement</span><strong></strong><p></p></div></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = (extra >= 0 ? '+' : '') + extra.toFixed(1); p[0].textContent = `${partnerOrders.toFixed(1)} orders vs ${brandOrders.toFixed(1)} from a brand ad, at a cost per purchase of ${newCpa.toFixed(2)}.`;
    s[1].textContent = (gain >= 0 ? '+' : '−') + f(Math.abs(gain)); p[1].textContent = gain >= 0 ? 'The creator pays for themselves at this spend.' : 'At this spend the fee costs more than the extra orders earn. Spend more behind the ad or negotiate the fee.';
    s[2].textContent = breakLift === null ? '—' : breakLift.toFixed(1) + '%'; p[2].textContent = breakLift === null ? 'Enter your profit per order.' : 'CPA improvement needed for the extra orders to cover the fee.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
