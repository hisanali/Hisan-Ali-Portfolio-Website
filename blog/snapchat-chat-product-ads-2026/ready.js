(() => {
  'use strict';
  const form = document.getElementById('sc-ready');
  const out = document.getElementById('sc-ready-result');
  if (!form || !out) return;
  const ITEMS = [
    ['catalog', 3, 'Create a product catalogue in Snapchat Ads Manager and connect your feed.'],
    ['pixel', 3, 'Install the Snap Pixel and send purchase events with order value.'],
    ['prices', 2, 'Make feed prices OMR and identical to your website.'],
    ['stock', 2, 'Remove or mark out-of-stock items automatically, so you do not pay to show them.'],
    ['images', 2, 'Use clear product images without heavy text.'],
    ['capi', 1, 'Add the Conversions API so fewer purchases go missing.'],
    ['arabic', 1, 'Write product titles in the language your buyers chat in.'],
    ['orders', 1, 'Track real orders by source, so you can judge the test fairly.']
  ];
  const max = ITEMS.reduce((s, i) => s + i[1], 0);
  const render = () => {
    let score = 0; const todo = [];
    ITEMS.forEach(([name, w, fix]) => { if (form.elements.namedItem(name).checked) score += w; else todo.push(fix); });
    const pct = Math.round(score / max * 100);
    const blocked = !form.elements.namedItem('catalog').checked || !form.elements.namedItem('pixel').checked;
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = pct + '%';
    if (blocked) { box.classList.add('lo'); box.querySelector('strong').textContent = 'Not ready yet'; box.querySelector('p').textContent = 'Product ads need a catalogue and purchase data before they can work. Start with the first items below.'; }
    else if (pct < 80) { box.classList.add('mid'); box.querySelector('strong').textContent = 'Nearly ready'; box.querySelector('p').textContent = 'You can launch, but fix these first so the AI shows the right products.'; }
    else { box.classList.add('hi'); box.querySelector('strong').textContent = 'Ready to test'; box.querySelector('p').textContent = 'Launch product ads in Chat with a fair share of budget and compare cost per real order after two weeks.'; }
    if (todo.length) { const ul = document.createElement('div'); ul.className = 'sc-list'; todo.forEach((t) => { const li = document.createElement('div'); li.className = 'sc-item'; li.textContent = t; ul.append(li); }); out.append(ul); }
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
