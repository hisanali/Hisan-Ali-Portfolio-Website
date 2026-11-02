(() => {
  'use strict';
  const form = document.getElementById('ga-ready');
  const out = document.getElementById('ga-ready-result');
  if (!form || !out) return;
  const ITEMS = { feed: [20, "Rewrite top product titles to include the attributes people ask about: size, material, model, use case."], broad: [18, "Test broad match or AI Max with smart bidding on one campaign; long questions rarely match short keywords."], pages: [16, "Put specifications, comparisons and delivery times near the top of landing pages."], conv: [14, "Track sales or leads as conversions so smart bidding has a target."], neg: [10, "Review search terms weekly and keep a negative list for irrelevant questions."], faq: [12, "Add FAQ or buying-guide sections that answer common questions in plain language."], reviews: [10, "Collect recent product and business reviews."] };
  const render = () => {
    let s = 0; const miss = [];
    for (const [k, [w, fix]] of Object.entries(ITEMS)) { if (form.elements.namedItem(k).checked) s += w; else miss.push([w, fix]); }
    const cls = s >= 75 ? 'hi' : s >= 45 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = s + '/100';
    box.querySelector('strong').textContent = cls === 'hi' ? 'Well placed for conversational search' : cls === 'mid' ? 'Partly ready: fix the gaps' : 'Your ads will struggle to match long questions';
    box.querySelector('p').textContent = miss.length ? 'Fix these first:' : 'Nothing missing. Keep it up and review monthly.';
    const ul = box.querySelector('ul'); miss.sort((a, b) => b[0] - a[0]).slice(0, 3).forEach(([, f]) => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
