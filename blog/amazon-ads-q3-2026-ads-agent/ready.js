(() => {
  'use strict';
  const form = document.getElementById('az-ready');
  const out = document.getElementById('az-ready-result');
  if (!form || !out) return;
  const ITEMS = { listings: [20, 'Complete titles, images and A+ content on your top products first; the agent can only promote what the listing shows well.'], reviews: [12, 'Push reviews through Vine or follow-up emails before giving thin listings automated budget.'], stock: [15, 'Secure holiday stock; an agent that scales a product just before it sells out wastes the peak.'], data: [15, 'Run manual Sponsored Products for a few months so you have a baseline to judge the agent against.'], video: [12, 'Make at least one video or lifestyle asset so the agent can use display and streaming placements well.'], rules: [13, 'Write down excluded products, keywords and placements before you hand over the budget.'], holdout: [13, 'Keep a share of budget or a region outside the agent so you can measure what it adds.'] };
  const render = () => {
    let s = 0; const miss = [];
    for (const [k, [w, fix]] of Object.entries(ITEMS)) { if (form.elements.namedItem(k).checked) s += w; else miss.push([w, fix]); }
    const cls = s >= 75 ? 'hi' : s >= 45 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = s + '%';
    box.querySelector('strong').textContent = cls === 'hi' ? 'Ready: test Ads Agent with 20–30% of budget' : cls === 'mid' ? 'Test small, after fixing the gaps' : 'Not yet: fix the basics first';
    box.querySelector('p').textContent = miss.length ? 'Before you test:' : 'Run the test for at least four weeks and compare cost per order and new-to-brand customers.';
    const ul = box.querySelector('ul'); miss.sort((a, b) => b[0] - a[0]).slice(0, 3).forEach(([, f]) => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
