(() => {
  'use strict';
  const form = document.getElementById('mr-score');
  const out = document.getElementById('mr-score-result');
  if (!form || !out) return;
  const W = { licence: 15, maroof: 20, cr: 10, address: 10, returns: 12, pay: 13, reviews: 10, reply: 10 };
  const FIX = { licence: 'Add the e-commerce activity to your commercial registration on the Oman Business Platform.', maroof: 'Verify the store on Maroof Oman and show the badge in your bio and at checkout.', cr: 'Show your commercial registration number in your bio, site footer and invoices.', address: 'List a real address or pickup point, even if you deliver everywhere.', returns: 'Write down return and exchange terms and pin them where buyers look.', pay: 'Offer card, QR or wallet payment so buyers are not asked for a transfer screenshot.', reviews: 'Pin real reviews or customer photos as a highlight.', reply: 'Answer messages within an hour in working time; set quick replies for common questions.' };
  const render = () => {
    let s = 0; const miss = [];
    for (const k of Object.keys(W)) { if (form.elements.namedItem(k).checked) s += W[k]; else miss.push(k); }
    const cls = s >= 75 ? 'hi' : s >= 45 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = s + '/100';
    box.querySelector('strong').textContent = cls === 'hi' ? 'A store careful buyers can trust' : cls === 'mid' ? 'Some reassurance, some gaps' : 'Buyers have to take your word for it';
    box.querySelector('p').textContent = miss.length ? 'Biggest gains first:' : 'Every signal is in place. Use them in your ads and first-order offers.';
    const ul = box.querySelector('ul'); miss.sort((a, b) => W[b] - W[a]).slice(0, 4).forEach(k => { const li = document.createElement('li'); li.textContent = FIX[k]; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
