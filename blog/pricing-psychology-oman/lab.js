(() => {
  'use strict';
  const form = document.getElementById('pp-lab-form');
  const out = document.getElementById('pp-lab-result');
  const error = document.getElementById('pp-lab-error');
  if (!form || !out) return;
  const field = name => form.elements.namedItem(name).value;
  const omr = baisa => {
    const whole = baisa % 1000 === 0 && baisa >= 20000;
    return 'OMR ' + (baisa / 1000).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 3, maximumFractionDigits: whole ? 0 : 3 });
  };
  const pct = (a, b) => { const v = (a - b) / b * 100; return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%'; };
  // Nearest charm prices just below and above, in baisa. Step and ending scale with the price.
  const charm = b => {
    const [step, end] = b < 1000 ? [100, 95] : b < 100000 ? [1000, 900] : [10000, 9000];
    const below = Math.floor((b - end) / step) * step + end;
    return below > 0 ? [below, below + step] : [below + step];
  };
  const roundStep = b => b < 20000 ? 1000 : b < 200000 ? 5000 : b < 1000000 ? 10000 : 50000;
  const styled = (b, kind) => {
    if (kind === 'premium') { const s = roundStep(b); return Math.max(s, Math.round(b / s) * s); }
    if (kind === 'b2b') { const s = b >= 1000000 ? 5000 : b >= 100000 ? 1000 : 50; return Math.max(s, Math.round(b / s) * s); }
    const c = charm(b); return c.length === 1 ? c[0] : (b - c[0] <= c[1] - b ? c[0] : c[1]);
  };
  const render = () => {
    const price = Number(field('price'));
    const kind = field('kind'), billing = field('billing');
    if (!Number.isFinite(price) || price < 0.1 || price > 10000000) { error.hidden = false; error.textContent = 'Enter a price between OMR 0.100 and OMR 10,000,000.'; out.hidden = true; return; }
    error.hidden = true; out.hidden = false;
    const b = Math.round(price * 1000);

    let ending;
    if (kind === 'premium') {
      const s = roundStep(b), down = Math.max(s, Math.floor(b / s) * s), up = Math.ceil(b / s) * s;
      ending = { title: 'Round price', value: omr(Math.abs(b - down) <= Math.abs(up - b) ? down : up), note: down === up ? 'Already round. For an emotional purchase, keep it that way.' : `Options: ${omr(down)} (${pct(down, b)}) or ${omr(up)} (${pct(up, b)}). Round numbers feel confident and premium.` };
    } else if (kind === 'b2b') {
      const precise = styled(Math.round(b * 0.985), 'b2b');
      ending = { title: 'Precise opening quote', value: omr(precise), note: `About 1.5% under your figure, not rounded. A costed-looking number tends to hold better in negotiation than ${omr(styled(b, 'premium'))}.` };
    } else {
      const c = charm(b);
      ending = { title: 'Charm price', value: omr(styled(b, kind)), note: c.length === 1 ? 'Already at the lowest charm step.' : `Nearest options: ${omr(c[0])} (${pct(c[0], b)}) or ${omr(c[1])} (${pct(c[1], b)}). Pick the one just below a round number.` };
    }

    let daily;
    if (billing === 'once') daily = { value: '—', note: 'Daily framing rarely suits one-off purchases. Lean on anchoring and a clear comparison instead.' };
    else {
      const perDay = b / (billing === 'month' ? 30 : 365);
      const value = perDay < 1000 ? `under ${Math.ceil(perDay / 10) * 10} baisa a day` : `about OMR ${(perDay / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} a day`;
      daily = { value, note: `Show it next to the full ${billing === 'month' ? 'monthly' : 'yearly'} price, never instead of it.` };
    }

    const anchor = styled(Math.round(b * 1.8), kind), entry = styled(Math.round(b * 0.55), kind);
    const ladder = { value: `${omr(anchor)} → ${omr(b)} → ${omr(entry)}`, note: 'Show the bigger option first, make yours the clearly “most chosen” middle, and keep a smaller entry option for price-sensitive buyers.' };

    out.innerHTML = '<div class="pp-out"><div><span></span><strong></strong><p></p></div><div><span>Daily framing</span><strong></strong><p></p></div><div><span>Three-option ladder</span><strong></strong><p></p></div></div>';
    const cells = out.querySelectorAll('.pp-out > div');
    cells[0].querySelector('span').textContent = ending.title;
    [[ending, 0], [daily, 1], [ladder, 2]].forEach(([item, i]) => {
      cells[i].querySelector('strong').textContent = item.value;
      cells[i].querySelector('p').textContent = item.note;
    });
  };
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  form.addEventListener('change', render);
  render();
})();
