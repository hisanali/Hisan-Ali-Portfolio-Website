(() => {
  'use strict';
  const form = document.getElementById('cwv-calculator-form');
  if (!form) return;
  const results = document.getElementById('cwv-calc-results');
  const error = document.getElementById('cwv-calc-error');
  const metrics = [
    { name: 'lcp', label: 'LCP (loading)', good: 2.5, poor: 4, format: v => `${v} s`, fix: 'Start with LCP: compress and correctly size the main image or hero, serve it early, and cut render-blocking scripts and fonts above it.' },
    { name: 'inp', label: 'INP (responsiveness)', good: 200, poor: 500, format: v => `${v} ms`, fix: 'Start with INP: find the slow taps (menus, filters, add-to-cart), and trim or defer the heavy JavaScript and third-party tags that run on them.' },
    { name: 'cls', label: 'CLS (visual stability)', good: 0.1, poor: 0.25, format: v => String(v), fix: 'Start with CLS: give images, videos, ads and embeds fixed dimensions, and stop banners or cookie bars from pushing content down after it appears.' }
  ];
  const rank = { Good: 0, 'Needs improvement': 1, Poor: 2 };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = metrics.map(m => Number(form.elements.namedItem(m.name).value));
    if (!form.checkValidity() || values.some(v => !Number.isFinite(v) || v < 0)) {
      error.hidden = false;
      error.textContent = 'Enter non-negative values: LCP in seconds, INP in milliseconds and CLS as a score such as 0.08.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;

    const rated = metrics.map((m, i) => ({ ...m, value: values[i], rating: values[i] <= m.good ? 'Good' : values[i] <= m.poor ? 'Needs improvement' : 'Poor' }));
    const passing = rated.every(m => m.rating === 'Good');
    const grid = document.createElement('div');
    grid.className = 'cwv-result-grid';
    const items = [...rated.map(m => [m.label, `${m.format(m.value)} · ${m.rating}`]), ['Core Web Vitals', passing ? 'Passing' : 'Not passing']];
    for (const [label, value] of items) {
      const item = document.createElement('div');
      const caption = document.createElement('span');
      const number = document.createElement('strong');
      caption.textContent = label;
      number.textContent = value;
      item.append(caption, number);
      grid.append(item);
    }
    const worst = rated.reduce((a, b) => (rank[b.rating] > rank[a.rating] ? b : a));
    const note = document.createElement('p');
    note.textContent = passing ? 'All three metrics are in the good range. Keep checking field data after every major site change.' : worst.fix;
    results.replaceChildren(grid, note);
  });
})();
