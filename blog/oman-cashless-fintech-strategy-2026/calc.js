(() => {
  'use strict';
  const form = document.getElementById('ft-calc');
  const out = document.getElementById('ft-calc-result');
  if (!form || !out) return;
  const n = k => Math.max(0, Number(form.elements.namedItem(k).value) || 0);
  const f = x => 'OMR ' + Math.round(x).toLocaleString('en-US');
  const render = () => {
    const orders = n('orders'), cod = Math.min(100, n('cod')) / 100, refuse = Math.min(100, n('refuse')) / 100, cost = n('cost');
    const failed = orders * cod * refuse, monthly = failed * cost, half = orders * (cod / 2) * refuse * cost;
    out.innerHTML = '<div class="ft-rows"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const list = out.querySelector('.ft-rows');
    [['Failed cash orders a month', Math.round(failed).toLocaleString('en-US')], ['Cost a month', f(monthly)], ['Cost a year', f(monthly * 12)]].forEach(([a, b]) => { const d = document.createElement('div'); d.className = 'ft-row'; d.innerHTML = '<span></span><strong></strong>'; d.querySelector('span').textContent = a; d.querySelector('strong').textContent = b; list.append(d); });
    const box = out.querySelector('.ed-result'); box.classList.add(monthly > 200 ? 'lo' : monthly > 50 ? 'mid' : 'hi');
    box.querySelector('.big').textContent = f((monthly - half) * 12);
    box.querySelector('strong').textContent = 'Saved a year if half your cash customers paid online';
    box.querySelector('p').textContent = 'A small prepay discount or free delivery usually costs less than failed deliveries, before counting lost stock time and courier fees.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
