(() => {
  'use strict';
  const form = document.getElementById('lift-calculator-form');
  if (!form) return;
  const results = document.getElementById('lift-calc-results');
  const error = document.getElementById('lift-calc-error');
  const minus = '−';
  const money = value => {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded < 0 ? minus : ''}OMR ${Math.abs(rounded).toLocaleString('en-OM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const whole = value => {
    const rounded = Math.round(value);
    return `${rounded < 0 ? minus : ''}${Math.abs(rounded).toLocaleString('en-OM')}`;
  };
  const percent = value => `${(value * 100).toFixed(2)}%`;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const names = ['testSize', 'testBuyers', 'holdSize', 'holdBuyers', 'spend', 'margin'];
    const values = names.map(name => Number(form.elements.namedItem(name).value));
    const [testSize, testBuyers, holdSize, holdBuyers, spend, margin] = values;
    const counts = [testSize, testBuyers, holdSize, holdBuyers];
    if (!form.checkValidity() || values.some(v => !Number.isFinite(v) || v < 0) || counts.some(v => !Number.isInteger(v)) || testSize < 1 || holdSize < 1 || testBuyers > testSize || holdBuyers > holdSize) {
      error.hidden = false;
      error.textContent = 'Enter whole numbers for people and buyers (buyers cannot exceed people in their group), and non-negative OMR amounts.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;

    const testRate = testBuyers / testSize;
    const holdRate = holdBuyers / holdSize;
    const extra = (testRate - holdRate) * testSize;
    const spread = 1.96 * Math.sqrt(testRate * (1 - testRate) / testSize + holdRate * (1 - holdRate) / holdSize) * testSize;
    const low = extra - spread;
    const high = extra + spread;
    const breakEven = margin > 0 ? Math.ceil(spend / margin) : null;
    const smallCounts = [testBuyers, testSize - testBuyers, holdBuyers, holdSize - holdBuyers].some(v => v < 10);

    let verdict;
    if (smallCounts) {
      verdict = 'At least one group has fewer than 10 buyers or non-buyers, so the range is unreliable. Run the test longer or with larger groups before deciding.';
    } else if (low > 0) {
      verdict = `Likely real: the rough 95% range for extra buyers (${whole(low)} to ${whole(high)}) excludes zero.`;
      if (spend > 0 && breakEven === null) verdict += ' With zero contribution per buyer, extra buyers cannot recover the spend.';
      else if (spend > 0 && low >= breakEven) verdict += ` Even the low end covers the ${whole(breakEven)} extra buyers needed to pay for the spend.`;
      else if (spend > 0 && high < breakEven) verdict += ` But even the high end falls short of the ${whole(breakEven)} extra buyers needed to cover the spend.`;
      else if (spend > 0) verdict += ` You need ${whole(breakEven)} extra buyers to cover the spend, and that sits inside the range, so profitability is not yet certain.`;
    } else if (high < 0) {
      verdict = `The holdout bought more than the targeted group (range ${whole(low)} to ${whole(high)}). Check the random split and the exclusions before trusting this campaign.`;
    } else {
      verdict = `Inconclusive: the rough 95% range (${whole(low)} to ${whole(high)} extra buyers) includes zero, so this test cannot separate the campaign’s effect from normal variation. Try a larger holdout or a longer test.`;
    }

    const items = [
      ['Buying rate: targeted vs holdout', `${percent(testRate)} vs ${percent(holdRate)}`],
      ['Extra buyers from the campaign', whole(extra)],
      ['Cost per extra buyer', extra >= 0.5 ? money(spend / extra) : 'No extra buyers'],
      ['Contribution after spend', money(extra * margin - spend)]
    ];
    const grid = document.createElement('div');
    grid.className = 'lift-result-grid';
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
    note.textContent = verdict;
    results.replaceChildren(grid, note);
  });
})();
