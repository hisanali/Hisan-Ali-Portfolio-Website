(() => {
  'use strict';
  // Six-area audit explorer. Each check reveals "what good looks like" and a common finding. Content only.
  const AREAS = [
    { k: 'track', ic: '📈', t: 'Tracking', checks: [
      ['Are enquiries tracked as conversions?', 'Calls, WhatsApp clicks and form submissions recorded in GA4 and ad platforms.', 'Only page views are tracked, so nobody knows which channel brings customers.'],
      ['Do you own the accounts?', 'Analytics, Search Console, ad accounts and Meta Business Manager in the business’s name.', 'Accounts created by a former agency or employee under their email.'],
      ['Do the numbers agree?', 'Ad platform conversions roughly match real enquiries received.', 'Duplicate or broken tags inflate results, making campaigns look better than they are.']
    ] },
    { k: 'web', ic: '🖥️', t: 'Website', checks: [
      ['How fast is it on mobile data?', 'The main content appears quickly on a phone, not only on office Wi-Fi.', 'Huge images and sliders make the first screen slow, especially from Instagram.'],
      ['Is the next step obvious?', 'A clear WhatsApp or call button visible without scrolling.', 'Contact details hidden on a separate page, or a long form as the only option.'],
      ['Does it answer real questions?', 'Services, prices or ranges, areas served, proof and FAQs.', 'Generic text about “excellence” with no prices, photos or specifics.']
    ] },
    { k: 'gbp', ic: '📍', t: 'Google Profile', checks: [
      ['Is the profile complete?', 'Correct primary category, hours, services, photos, description and phone.', 'Wrong category or outdated hours, so the business misses relevant local searches.'],
      ['How are reviews handled?', 'A steady flow of genuine reviews, with replies to each one.', 'Few recent reviews and no replies, even to complaints.'],
      ['Are calls and directions tracked?', 'Profile insights reviewed monthly for calls, website clicks and directions.', 'Nobody has looked at the profile since it was created.']
    ] },
    { k: 'seo', ic: '🔎', t: 'Search (SEO)', checks: [
      ['Which searches bring visitors?', 'Search Console shows visibility for service and location searches customers use.', 'Traffic only for the brand name; invisible for what customers search.'],
      ['One page per main service?', 'Dedicated pages for each key service and area, in the right language.', 'All services squeezed onto one page, so none of them rank.'],
      ['Arabic and English?', 'Arabic pages written for Arabic searches, with proper language settings.', 'Arabic missing entirely, or a machine-translated copy.']
    ] },
    { k: 'social', ic: '📱', t: 'Social media', checks: [
      ['How fast are DMs answered?', 'Messages answered within hours during business hours, with a clear handover to sales.', 'Enquiries waiting a day or more, or not answered at all.'],
      ['Does content build trust?', 'Real people, real work, customer stories and helpful answers.', 'Mostly designed offers and stock images that look like every competitor.'],
      ['Is it connected to results?', 'Enquiries and bookings from social media tracked monthly.', 'Success judged only by likes and follower counts.']
    ] },
    { k: 'ads', ic: '🎯', t: 'Ads', checks: [
      ['Is the structure focused?', 'Campaigns organised by service and goal, with relevant ads and landing pages.', 'One campaign for everything, sending all traffic to the homepage.'],
      ['Are search terms reviewed?', 'Irrelevant searches excluded regularly with negative keywords.', 'Budget spent on unrelated searches, such as job seekers or other cities.'],
      ['Optimised for enquiries?', 'Bidding and reporting based on real conversions.', 'Optimised for clicks or reach, so cheap traffic that never enquires.']
    ] }
  ];
  const tabs = document.getElementById('da-tabs');
  const panel = document.getElementById('da-panel');
  if (!tabs) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cur = 0;
  const open = new Set();
  function render() {
    tabs.innerHTML = AREAS.map((a, i) => `<button type="button" role="tab" aria-selected="${i === cur}" data-i="${i}"><span aria-hidden="true">${a.ic}</span><b>${i + 1}. ${esc(a.t)}</b></button>`).join('');
    const a = AREAS[cur];
    panel.innerHTML = `<div class="da-card">${a.checks.map(([q, good, bad], j) => {
      const id = `${cur}-${j}`; const isOpen = open.has(id);
      return `<div class="da-check${isOpen ? ' is-open' : ''}"><button type="button" data-c="${id}" aria-expanded="${isOpen}"><span class="da-q">${esc(q)}</span><span class="da-tog" aria-hidden="true">${isOpen ? '−' : '+'}</span></button>${isOpen ? `<div class="da-ans"><div class="da-good"><b>What good looks like</b>${esc(good)}</div><div class="da-bad"><b>Common finding</b>${esc(bad)}</div></div>` : ''}</div>`;
    }).join('')}<div class="da-nav">${cur > 0 ? `<button type="button" data-go="-1">← ${esc(AREAS[cur - 1].t)}</button>` : '<span></span>'}${cur < AREAS.length - 1 ? `<button type="button" data-go="1">Next: ${esc(AREAS[cur + 1].t)} →</button>` : ''}</div></div>`;
  }
  tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { cur = Number(b.dataset.i); render(); } });
  panel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]');
    if (c) { const id = c.dataset.c; open.has(id) ? open.delete(id) : open.add(id); render(); panel.querySelector(`[data-c="${id}"]`).focus(); return; }
    const g = e.target.closest('[data-go]');
    if (g) { cur += Number(g.dataset.go); render(); }
  });
  render();
})();
