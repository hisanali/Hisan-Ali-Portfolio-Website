(() => {
  'use strict';
  const form = document.getElementById('discount-calculator-form');
  if (!form) return;
  const results = document.getElementById('discount-calc-results');
  const error = document.getElementById('discount-calc-error');
  const money = value => `${value < 0 ? '−' : ''}OMR ${Math.abs(value).toLocaleString('en-OM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const price = Number(form.elements.namedItem('price').value);
    const cost = Number(form.elements.namedItem('cost').value);
    const discount = Number(form.elements.namedItem('discount').value);
    const units = Number(form.elements.namedItem('units').value);
    const values = [price, cost, discount, units];
    if (!form.checkValidity() || values.some(value => !Number.isFinite(value)) || price <= 0 || cost < 0 || discount < 0 || discount > 100 || !Number.isInteger(units) || units < 1) {
      error.hidden = false;
      error.textContent = 'Enter valid values. Discount must be between 0 and 100, and regular units must be a whole number.';
      results.hidden = true;
      return;
    }

    const regularContribution = price - cost;
    const discountedPrice = price * (1 - discount / 100);
    const discountedContribution = discountedPrice - cost;
    const baseline = regularContribution * units;
    error.hidden = true;
    results.hidden = false;

    let unitsNeeded = 'No finite break-even';
    let increase = 'Not achievable';
    let note = `Each promoted unit loses ${money(Math.abs(discountedContribution))} before fixed costs and campaign spend.`;
    if (regularContribution <= 0) {
      note = 'The regular price does not cover the entered variable cost, so there is no positive baseline contribution to protect.';
    } else if (discountedContribution > 0) {
      const required = Math.ceil(baseline / discountedContribution);
      unitsNeeded = required.toLocaleString('en-OM');
      increase = `${((required / units - 1) * 100).toFixed(1)}%`;
      note = `The promotion must sell ${unitsNeeded} units to match the ${money(baseline)} contribution from ${units.toLocaleString('en-OM')} regular-price units.`;
    } else if (discountedContribution === 0) {
      note = 'The promoted price only covers the entered variable cost. More volume cannot replace the regular contribution.';
    }

    const items = [
      ['Discounted price', money(discountedPrice)],
      ['Contribution per unit', money(discountedContribution)],
      ['Units to match baseline', unitsNeeded],
      ['Extra volume required', increase]
    ];
    const grid = document.createElement('div');
    grid.className = 'discount-result-grid';
    for (const [label, value] of items) {
      const item = document.createElement('div');
      const caption = document.createElement('span');
      const number = document.createElement('strong');
      caption.textContent = label;
      number.textContent = value;
      item.append(caption, number);
      grid.append(item);
    }
    const explanation = document.createElement('p');
    explanation.textContent = note;
    results.replaceChildren(grid, explanation);
  });
})();
