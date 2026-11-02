(() => {
  'use strict';
  const form = document.getElementById('cp-check');
  const out = document.getElementById('cp-check-result');
  if (!form || !out) return;
  const ITEMS = { returns: [18, "Write a returns and exchange policy that accepts faulty goods, and show it on your site, Instagram and invoices."], approval: [18, "Get approval for every discount or promotion before you advertise it."], ads: [16, "Check that every advertised price, size and feature matches what you deliver."], invoice: [12, "Give an invoice or receipt with your business details for every sale."], reply: [14, "Reply to customer messages the same working day, with a named person."], delivery: [12, "Promise realistic delivery dates and message customers about delays."], arabic: [10, "Make key terms available in Arabic."] };
  const render = () => {
    let s = 0; const miss = [];
    for (const [k, [w, fix]] of Object.entries(ITEMS)) { if (form.elements.namedItem(k).checked) s += w; else miss.push([w, fix]); }
    const cls = s >= 75 ? 'hi' : s >= 45 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = s + '/100';
    box.querySelector('strong').textContent = cls === 'hi' ? 'Low complaint risk' : cls === 'mid' ? 'Some exposure: fix these before the busy season' : 'High complaint risk';
    box.querySelector('p').textContent = miss.length ? 'Fix these first:' : 'Nothing missing. Keep it up and review monthly.';
    const ul = box.querySelector('ul'); miss.sort((a, b) => b[0] - a[0]).slice(0, 3).forEach(([, f]) => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
