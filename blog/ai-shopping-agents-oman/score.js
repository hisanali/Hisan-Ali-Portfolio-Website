(() => {
  'use strict';
  const form = document.getElementById('ag-score-form');
  const out = document.getElementById('ag-score-result');
  if (!form || !out) return;
  const fixes = {
    price: 'Show every price as plain text in OMR. An agent can’t compare a price it can’t read.',
    schema: 'Add complete Product structured data: price, currency, availability and rating.',
    stock: 'Show stock status as text, and sync it with your real inventory.',
    delivery: 'Write delivery times and costs by region: Muscat, Batinah, Dakhiliyah, Dhofar and so on.',
    feed: 'Set up or clean your Google Merchant Center feed so titles, prices and stock match the site.',
    robots: 'Check robots.txt: allow OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User and PerplexityBot if you want to appear in answers.',
    returns: 'Publish a clear returns page and link it from every product.',
    specs: 'Move specs, sizes and warranty details out of images and into page text.',
    reviews: 'Ask recent customers for Google reviews and reply to each one.',
    checkout: 'Allow guest checkout and show the full total, including delivery, before payment.'
  };
  const boxes = [...form.querySelectorAll('input[type="checkbox"]')];
  const total = boxes.reduce((sum, box) => sum + Number(box.dataset.weight), 0);
  const render = () => {
    const score = Math.round(boxes.reduce((sum, box) => sum + (box.checked ? Number(box.dataset.weight) : 0), 0) / total * 100);
    const missing = boxes.filter(box => !box.checked).sort((a, b) => b.dataset.weight - a.dataset.weight).slice(0, 3);
    const verdict = score >= 80 ? 'Agent-ready. Keep the data accurate and watch AI referrals in GA4.'
      : score >= 50 ? 'Partly readable. Agents can find you, but may drop you in a close comparison.'
      : 'Mostly invisible to agents. The fixes below will also help ordinary search and human shoppers.';
    out.innerHTML = '<div class="ag-meter" aria-hidden="true"><i></i></div><p><strong></strong> / 100 · <span></span></p>';
    const bar = out.querySelector('i');
    bar.style.width = score + '%';
    bar.style.setProperty('--full', score ? (10000 / score).toFixed(1) + '%' : '100%');
    out.querySelector('strong').textContent = score;
    out.querySelector('span').textContent = verdict;
    if (missing.length) {
      const heading = document.createElement('p');
      heading.textContent = 'Your next three fixes:';
      const list = document.createElement('ol');
      missing.forEach(box => { const li = document.createElement('li'); li.textContent = fixes[box.name]; list.append(li); });
      out.append(heading, list);
    }
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
