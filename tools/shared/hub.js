/* Tools hub: search and category filters. */
(function () {
  'use strict';
  const input = document.getElementById('hubSearch');
  const chips = document.getElementById('hubChips');
  const empty = document.getElementById('hubEmpty');
  const status = document.getElementById('hubStatus');
  if (!input || !chips) return;
  const cards = Array.from(document.querySelectorAll('.hub-card'));
  const groups = Array.from(document.querySelectorAll('.hub-group'));
  let cat = 'all';

  function apply() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const text = card.dataset.k;
      const match = (cat === 'all' || card.dataset.cat === cat) && words.every((w) => text.includes(w));
      card.hidden = !match;
      if (match) shown++;
    });
    groups.forEach((g) => { g.hidden = !g.querySelector('.hub-card:not([hidden])'); });
    empty.hidden = shown > 0;
    status.textContent = `${shown} tool${shown === 1 ? '' : 's'} shown`;
  }

  input.addEventListener('input', apply);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = cards.find((c) => !c.hidden);
      if (first) location.href = first.href;
    }
    if (e.key === 'Escape') { input.value = ''; apply(); }
  });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });
})();
