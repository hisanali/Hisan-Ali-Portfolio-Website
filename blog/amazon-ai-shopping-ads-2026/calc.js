(() => {
  'use strict';
  const form = document.getElementById('am-calc');
  const out = document.getElementById('am-calc-result');
  if (!form || !out) return;
  const v = k => Number(form.elements.namedItem(k).value);
  const usd = x => '$' + x.toFixed(2);
  const render = () => {
    const cpc = Math.max(0.01, v('cpc') || 0.01), cvr = Math.max(0, v('cvr') || 0) / 100, aov = Math.max(1, v('aov') || 1), margin = Math.max(0, v('margin') || 0) / 100;
    const lcvr = 1 + (v('lcvr') || 0) / 100, laov = 1 + (v('laov') || 0) / 100;
    const std = { cvr, aov }, pr = { cvr: Math.min(1, cvr * lcvr), aov: aov * laov };
    const calc = s => { const cpo = s.cvr ? cpc / s.cvr : Infinity; const profitPerClick = s.cvr * s.aov * margin - cpc; return { cpo, profitPerClick, roas: s.cvr * s.aov / cpc }; };
    const a = calc(std), b = calc(pr);
    out.innerHTML = '<div class="fe-out"><div><span>Cost per order</span><strong></strong><p></p></div><div><span>Profit per click</span><strong></strong><p></p></div><div><span>ROAS</span><strong></strong><p></p></div></div>';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = Number.isFinite(b.cpo) ? usd(b.cpo) : '—'; p[0].textContent = Number.isFinite(a.cpo) ? `Prompt click, vs ${usd(a.cpo)} on a standard click.` : 'Enter a conversion rate above zero.';
    s[1].textContent = (b.profitPerClick >= 0 ? '+' : '−') + usd(Math.abs(b.profitPerClick)); p[1].textContent = `Prompt click, vs ${(a.profitPerClick >= 0 ? '+' : '−') + usd(Math.abs(a.profitPerClick))} standard. ${b.profitPerClick < 0 ? 'At these numbers, prompt clicks lose money; pause or lower lifts.' : b.profitPerClick > a.profitPerClick ? 'Prompt clicks earn more per click if the lift holds.' : 'No gain over standard clicks.'}`;
    s[2].textContent = b.roas.toFixed(2) + '×'; p[2].textContent = `vs ${a.roas.toFixed(2)}× on standard clicks.`;
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
