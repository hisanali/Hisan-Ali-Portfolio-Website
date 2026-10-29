(() => {
  'use strict';
  const form = document.getElementById('qr-calc');
  const out = document.getElementById('qr-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const omr = x => 'OMR ' + x.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const render = () => {
    const orders = n('orders'), aov = n('aov'), card = Math.min(10, n('card')) / 100, cod = Math.min(100, n('cod')) / 100, codcost = n('codcost'), shift = Math.min(100, n('shift')) / 100;
    form.querySelector('#qr-shift-out').textContent = Math.round(shift * 100) + '%';
    const qrFee = Math.min(aov * 0.005, 2);
    const moved = orders * shift;
    // Moved orders split equally between card and COD where both exist.
    const codShare = cod > 0 && cod < 1 ? 0.5 : cod >= 1 ? 1 : 0;
    const mc = moved * (1 - codShare), md = moved * codShare;
    const before = mc * aov * card + md * codcost;
    const after = moved * qrFee;
    const saved = Math.max(0, before - after);
    out.innerHTML = '<div class="qr-out"><div class="qr-out-grid"><div><small>QR fee per order</small><b></b></div><div><small>Saved per month</small><b></b></div><div><small>Saved per year</small><b></b></div></div><p></p></div>';
    const b = out.querySelectorAll('b'); b[0].textContent = omr(qrFee); b[1].textContent = omr(saved); b[2].textContent = omr(saved * 12);
    const capNote = aov * 0.005 > 2 ? ' Your orders are above OMR 400, so the OMR 2 cap applies and the saving per order grows with order size.' : '';
    const cardNote = card <= 0.005 ? ' Your card rate is already at or below the QR ceiling, so the saving here comes from fewer COD orders.' : '';
    out.querySelector('p').textContent = `Moving ${Math.round(moved)} of ${orders} monthly orders to QR or transfer, at a maximum QR fee of 0.50%.` + capNote + cardNote + ' Instant transfers from customers are free to them; ask your bank what, if anything, you pay to receive them.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
