(() => {
  'use strict';
  const form = document.getElementById('pr-checker');
  const out = document.getElementById('pr-checker-result');
  if (!form || !out) return;
  const num = name => Number(form.elements.namedItem(name).value);
  const on = name => form.elements.namedItem(name).checked;
  // Limits as announced by MoCIIP and the CPA in July 2024. Confirm current rules before launch.
  const render = () => {
    const discount = num('discount'), days = num('days'), times = num('times');
    const checks = [];
    const add = (state, title, note) => checks.push([state, title, note]);
    if (!(discount > 0 && discount <= 100) || !(days >= 1) || !(times >= 1)) { out.innerHTML = '<p class="fe-error">Enter a discount between 1 and 100%, and at least 1 day and 1 promotion.</p>'; return; }
    add(discount <= 30 ? 'ok' : 'bad', `Discount ${discount}%`, discount <= 30 ? 'Within the 30% maximum announced in 2024.' : 'Above the 30% maximum announced in 2024. Reduce it, or confirm in writing with the CPA (national campaign terms may differ).');
    add(days <= 3 ? 'ok' : 'bad', `${days} consecutive day${days === 1 ? '' : 's'}`, days <= 3 ? 'Within the limit of 3 consecutive days a week.' : 'Longer than 3 consecutive days a week. Split it into shorter windows.');
    add(times <= 3 ? 'ok' : 'bad', `Promotion ${times} of the month`, times <= 3 ? 'Within the limit of 3 promotions a month.' : 'More than 3 promotions this month. Merge or move one to next month.');
    add(on('notified') ? 'ok' : 'bad', 'Consumer Protection Authority notified', on('notified') ? 'Keep a copy of your notification with the dates and terms.' : 'Notify the CPA before the promotion starts. Prior permission is no longer needed, but notification is.');
    add(on('genuine') ? 'ok' : 'bad', 'Prices genuinely reduced', on('genuine') ? 'Keep records of the pre-promotion price.' : 'Promotional prices must not be higher than the price before the promotion. Do not inflate the “was” price.');
    if (on('tobacco')) add('bad', 'Tobacco products', 'Promotions and discounts on tobacco products are prohibited.');
    if (on('creator')) add(on('licensed') ? 'ok' : 'bad', 'Paid creator promotion', on('licensed') ? 'Licence checked. Keep a copy with the campaign file.' : 'Creators promoting other businesses need a MoCIIP licence. Check it before you pay.');
    if (on('food')) add(on('fsqc') ? 'ok' : 'warn', 'Food product promoted by creators', on('fsqc') ? 'Approval in place.' : 'Since July 2026, creators need prior approval from the Food Safety and Quality Centre to promote food products.');
    const bad = checks.filter(c => c[0] === 'bad').length, warn = checks.filter(c => c[0] === 'warn').length;
    out.innerHTML = '<p><strong></strong></p><div class="pr-checks"></div>';
    out.querySelector('strong').textContent = bad ? `${bad} issue${bad === 1 ? '' : 's'} to fix before launch` : warn ? 'Nearly ready: one thing to check' : 'Ready to launch, based on the announced rules';
    const list = out.querySelector('.pr-checks');
    checks.forEach(([state, title, note]) => {
      const row = document.createElement('div');
      row.className = 'pr-check ' + state;
      row.innerHTML = '<i aria-hidden="true"></i><div><strong></strong><p></p></div>';
      row.querySelector('i').textContent = state === 'ok' ? '✓' : state === 'warn' ? '!' : '✕';
      row.querySelector('strong').textContent = title;
      row.querySelector('p').textContent = note;
      list.append(row);
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
