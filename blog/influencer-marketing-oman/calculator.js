(() => {
  'use strict';
  const form = document.getElementById('creator-calculator-form');
  if (!form) return;
  const results = document.getElementById('creator-calc-results');
  const error = document.getElementById('creator-calc-error');
  const money = value => `OMR ${(Math.round(value * 100) / 100).toLocaleString('en-OM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const whole = value => Math.round(value).toLocaleString('en-OM');
  const read = name => Number(form.elements.namedItem(name).value);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const creators = [['a', 'Creator A'], ['b', 'Creator B']].map(([key, label]) => ({ label, fee: read(`${key}Fee`), views: read(`${key}Views`), posts: read(`${key}Posts`), share: read(`${key}Share`) }));
    const margin = read('margin');
    const invalid = !form.checkValidity() || !Number.isFinite(margin) || margin <= 0 || creators.some(c => [c.fee, c.views, c.posts, c.share].some(v => !Number.isFinite(v) || v < 0) || !Number.isInteger(c.views) || !Number.isInteger(c.posts) || c.posts < 1 || c.share > 100);
    if (invalid) {
      error.hidden = false;
      error.textContent = 'Enter non-negative fees, whole numbers for views and posts (at least one post), an Oman audience share from 0 to 100, and a contribution per sale above zero.';
      results.hidden = true;
      return;
    }
    error.hidden = true;
    results.hidden = false;

    for (const c of creators) {
      c.omanViews = c.views * c.posts * c.share / 100;
      c.cpm = c.omanViews > 0 ? c.fee / c.omanViews * 1000 : null;
      c.sales = Math.ceil(c.fee / margin);
      c.perSale = c.sales > 0 && c.omanViews > 0 ? c.omanViews / c.sales : null;
    }
    const rows = [
      ['Views in Oman', c => whole(c.omanViews)],
      ['Cost per 1,000 Oman views', c => c.cpm === null ? 'No Oman views' : money(c.cpm)],
      ['Sales to cover the fee', c => whole(c.sales)],
      ['One sale needed per', c => c.sales === 0 ? 'No fee to cover' : c.perSale === null ? 'No Oman views' : `${whole(c.perSale)} Oman views`]
    ];

    const table = document.createElement('table');
    table.className = 'creator-results';
    const caption = document.createElement('caption');
    caption.textContent = 'Estimated results per package';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const text of ['Estimate', ...creators.map(c => c.label)]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text;
      headRow.append(cell);
    }
    head.append(headRow);
    const body = document.createElement('tbody');
    for (const [label, format] of rows) {
      const row = document.createElement('tr');
      const header = document.createElement('th');
      header.scope = 'row';
      header.textContent = label;
      row.append(header);
      for (const c of creators) {
        const cell = document.createElement('td');
        cell.textContent = format(c);
        row.append(cell);
      }
      body.append(row);
    }
    table.append(caption, head, body);
    const wrap = document.createElement('div');
    wrap.className = 'creator-results-wrap';
    wrap.append(table);

    const [a, b] = creators;
    let summary = 'At least one creator has no estimated views in Oman with these inputs, so compare their audience location before anything else.';
    if (a.cpm !== null && b.cpm !== null) {
      const cheaper = a.cpm <= b.cpm ? a : b;
      const pricier = cheaper === a ? b : a;
      const bigger = a.omanViews >= b.omanViews ? a : b;
      const smaller = bigger === a ? b : a;
      const reachGap = bigger.omanViews - smaller.omanViews;
      if (a.cpm === b.cpm) summary = `Both creators deliver estimated Oman views at the same cost.${reachGap >= 1 ? ` ${bigger.label} reaches about ${whole(reachGap)} more of them.` : ''}`;
      else if (reachGap < 1 || cheaper === bigger) summary = `${cheaper.label} delivers ${reachGap >= 1 ? 'more estimated Oman views and costs' : 'the same estimated Oman views but costs'} less per view.`;
      else summary = `${cheaper.label} delivers each estimated Oman view for about ${Math.round(cheaper.cpm / pricier.cpm * 100)}% of ${pricier.label}’s cost. ${bigger.label} reaches about ${whole(reachGap)} more estimated views in Oman, so decide which matters more for this campaign.`;
    }
    const note = document.createElement('p');
    note.textContent = summary;
    results.replaceChildren(wrap, note);
  });
})();
