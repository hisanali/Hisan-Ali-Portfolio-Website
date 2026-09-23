(() => {
  'use strict';
  const form = document.getElementById('dm-calculator-form');
  if (!form) return;
  const results = document.getElementById('dm-calc-results');
  const error = document.getElementById('dm-calc-error');
  const money = value => `OMR ${(Math.round(value * 100) / 100).toLocaleString('en-OM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const whole = value => Math.round(value).toLocaleString('en-OM');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = ['weekly', 'minutes', 'silent', 'hourly'].map(name => Number(form.elements.namedItem(name).value));
    const [weekly, minutes, silent, hourly] = values;
    if (!form.checkValidity() || values.some(v => !Number.isFinite(v) || v < 0) || !Number.isInteger(weekly) || silent > 100) {
      error.hidden = false;
      error.textContent = 'Enter a whole number of weekly price questions, non-negative minutes and cost, and a silent share from 0 to 100.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;

    const monthly = weekly * 52 / 12;
    const hours = monthly * minutes / 60;
    const items = [
      ['Price questions per month', whole(monthly)],
      ['Staff hours per month', hours.toFixed(1)],
      ['Staff cost per month', money(hours * hourly)],
      ['Chats that end at the price', whole(monthly * silent / 100)]
    ];
    const grid = document.createElement('div');
    grid.className = 'dm-result-grid';
    for (const [label, value] of items) {
      const item = document.createElement('div');
      const caption = document.createElement('span');
      const number = document.createElement('strong');
      caption.textContent = label;
      number.textContent = value;
      item.append(caption, number);
      grid.append(item);
    }
    const note = document.createElement('p');
    note.textContent = hours > 0
      ? `That is ${hours.toFixed(1)} hours a month spent answering a question a visible price or price range could answer before anyone types.`
      : 'With these inputs, price questions take no staff time. Check the silent share: those are still buyers who left.';
    results.replaceChildren(grid, note);
  });
})();
