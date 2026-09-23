(() => {
  'use strict';
  const form = document.getElementById('q4-calculator-form');
  if (!form) return;
  const results = document.getElementById('q4-calc-results');
  const error = document.getElementById('q4-calc-error');
  const moments = [
    ['11.11 sales', '2026-11-11'],
    ['National Day', '2026-11-20'],
    ['White Friday', '2026-11-27'],
    ['Year-end', '2026-12-31'],
    ['Ramadan 2027 (estimated)', '2027-02-08']
  ];
  const phase = days => days < 0 ? 'Passed' : days <= 6 ? 'Live now' : days <= 20 ? 'Warm up audiences' : days <= 42 ? 'Produce and test' : 'Plan and book';
  const toDay = value => Date.UTC(...value.split('-').map((part, i) => Number(part) - (i === 1 ? 1 : 0)));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const start = form.elements.namedItem('start').value;
    if (!form.checkValidity() || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      error.hidden = false;
      error.textContent = 'Choose a valid date.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;

    const today = toDay(start);
    const grid = document.createElement('div');
    grid.className = 'q4-result-grid';
    let next = null;
    for (const [label, date] of moments) {
      const days = Math.round((toDay(date) - today) / 86400000);
      if (days >= 0 && !next) next = [label, days];
      const item = document.createElement('div');
      const caption = document.createElement('span');
      const number = document.createElement('strong');
      caption.textContent = label;
      number.textContent = days < 0 ? 'Passed' : `${days} days · ${phase(days)}`;
      item.append(caption, number);
      grid.append(item);
    }
    const note = document.createElement('p');
    note.textContent = next
      ? `Next up: ${next[0]} in ${next[1]} days. Anything that needs creators, stock or new creative should already be booked by the “Produce and test” stage, six weeks out.`
      : 'Every moment in this calendar has passed. Start the 2027 plan from Ramadan onwards.';
    results.replaceChildren(grid, note);
  });

  const now = new Date();
  form.elements.namedItem('start').value = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(n => String(n).padStart(2, '0')).join('-');
  form.requestSubmit();
})();
