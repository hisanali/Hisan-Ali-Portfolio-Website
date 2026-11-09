(() => {
  'use strict';
  // Live countdowns. Dates: National Day 20 Nov; 2026 public holiday observed 25-26 Nov; White Friday 27 Nov.
  const cd = document.getElementById('nd-count');
  if (cd) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items = [['2026-11-20', 'until National Day (20 Nov)'], ['2026-11-25', 'until the two-day holiday (25–26 Nov)'], ['2026-11-27', 'until White Friday (27 Nov)']];
    cd.innerHTML = '';
    items.forEach(([d, label]) => {
      const days = Math.round((new Date(d + 'T00:00:00') - today) / 86400000);
      const box = document.createElement('div');
      box.innerHTML = '<b></b><span></span>';
      box.querySelector('b').textContent = days > 0 ? days + ' days' : days === 0 ? 'Today' : 'Passed';
      box.querySelector('span').textContent = label;
      cd.append(box);
    });
  }
  // Creative check. Based on MoCIIP guidance (Aug and Oct 2026) and the law on the State flag and emblem.
  const form = document.getElementById('nd-check');
  const out = document.getElementById('nd-check-result');
  if (!form || !out) return;
  const ban = { royal: 'The Royal Emblem', palace: 'Royal Palaces or Royal Mosques' };
  const ask = { emblem: 'the State Emblem', sultan: 'the image of His Majesty the Sultan', flag: 'the national flag', map: 'the official map of Oman' };
  const render = () => {
    const on = name => form.elements.namedItem(name).checked;
    const banned = Object.keys(ban).filter(on).map(k => ban[k]);
    const needs = Object.keys(ask).filter(on).map(k => ask[k]);
    const approved = on('approved');
    let cls, icon, title, text;
    if (banned.length) { cls = 'no'; icon = '✕'; title = 'Do not use'; text = `${banned.join(' and ')} must not be used on commercial products under the ministry’s guidance. Remove ${banned.length > 1 ? 'them' : 'it'}.`; }
    else if (needs.length && !approved) { cls = 'ask'; icon = '!'; title = 'Approval needed first'; text = `Your design uses ${needs.join(', ')}. ${needs.length > 1 ? 'These need' : 'This needs'} prior approval from MoCIIP before you produce or market it. This year’s deadline for National Day product applications was 15 October 2026; contact the ministry before going ahead.`; }
    else if (needs.length && approved) { cls = 'ok'; icon = '✓'; title = 'Approved: keep the paperwork'; text = 'Keep the approval with your campaign files and use the symbols exactly as approved.'; }
    else { cls = 'ok'; icon = '✓'; title = 'No restricted symbols'; text = 'Colours, local stories, landscapes and your own products celebrate the day without restricted symbols. Still keep the tone respectful.'; }
    out.innerHTML = `<div class="nd-verdict ${cls}"><i aria-hidden="true"></i><div><strong></strong><p></p></div></div>`;
    out.querySelector('i').textContent = icon; out.querySelector('strong').textContent = title; out.querySelector('p').textContent = text;
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
