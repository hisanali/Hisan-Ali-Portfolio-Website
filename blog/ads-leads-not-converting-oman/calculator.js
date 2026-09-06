(() => {
  'use strict';
  const form = document.getElementById('lead-calculator-form');
  if (!form) return;
  const results = document.getElementById('lead-calc-results');
  const error = document.getElementById('lead-calc-error');
  const money = value => `${value < 0 ? '−' : ''}OMR ${Math.abs(value).toLocaleString('en-OM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = ['spend', 'leads', 'wins', 'margin'].map(name => Number(form.elements.namedItem(name).value));
    const [spend, leads, wins, margin] = values;
    if (!form.checkValidity() || values.some(v => !Number.isFinite(v) || v < 0) || !Number.isInteger(leads) || !Number.isInteger(wins) || wins > leads) {
      error.hidden = false;
      error.textContent = 'Enter valid non-negative values. Enquiries and customers must be whole numbers, and customers cannot exceed enquiries.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;
    const items = [
      ['Cost per enquiry', leads ? money(spend / leads) : 'No enquiries'],
      ['Ad cost per customer', wins ? money(spend / wins) : 'No customers yet'],
      ['Lead-to-sale rate', leads ? `${(wins / leads * 100).toFixed(1)}%` : 'Not available'],
      ['Contribution after ads', money(wins * margin - spend)]
    ];
    const grid = document.createElement('div');
    grid.className = 'lead-result-grid';
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
    note.textContent = spend === 0 ? 'There is no advertising spend to recover in this scenario.' : margin === 0 ? 'With zero contribution per customer, additional customers cannot recover this ad spend.' : `${Math.ceil(spend / margin).toLocaleString('en-OM')} customers needed to cover this ad spend at ${money(margin)} contribution each.`;
    results.replaceChildren(grid, note);
  });
})();
