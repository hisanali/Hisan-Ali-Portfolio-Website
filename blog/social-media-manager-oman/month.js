(() => {
  'use strict';
  // Illustrative month of social media management for a fictional Muscat clinic. Content only.
  const DAYS = {
    1: ['plan', 'Monthly plan', 'Goals for the month, key dates, campaign ideas and a content calendar shared with the clinic for approval.'],
    2: ['plan', 'Competitor check', 'A quick look at what other clinics posted and advertised last month, and what customers commented on.'],
    3: ['create', 'Shoot day', 'Two hours at the clinic filming short clips: the team, a tour, a doctor answering common questions. One shoot feeds the whole month.'],
    4: ['create', 'Editing & captions', 'Editing Reels, writing captions in Arabic and English, preparing Stories. Drafts sent for approval.'],
    6: ['ads', 'Campaign launch', 'Launch a WhatsApp-click campaign for teeth whitening to people within 10 km, with two creative versions to test.'],
    7: ['engage', 'Daily replies', 'Every day: reply to comments and DMs, pass booking requests to reception, hide spam. This happens every day, not just today.'],
    9: ['create', 'Educational Reel', '“3 signs you need a dental check-up.” Useful posts build trust and get saved and shared.'],
    11: ['ads', 'Ad check', 'Compare the two creatives. Pause the weaker one and move budget to the version bringing cheaper WhatsApp chats.'],
    13: ['engage', 'Review replies', 'Reply to new Google and Instagram reviews, thank happy patients and handle one complaint privately.'],
    15: ['report', 'Mid-month check', 'Quick check on enquiries, ad costs and what content is working. Small changes now, not just at month end.'],
    17: ['create', 'Patient story', 'With permission, a short testimonial video. Real patients persuade more than any designed post.'],
    19: ['plan', 'Upcoming occasion', 'Prepare content for an upcoming national or seasonal date, with a respectful tone and no forced selling.'],
    21: ['engage', 'Community moment', 'Answer questions in Stories with a Q&A sticker; the doctor records short answers.'],
    23: ['ads', 'Retargeting', 'Show a reassurance ad to people who watched the videos or visited the website but did not book.'],
    25: ['create', 'Behind the scenes', 'Sterilisation process in 30 seconds. Showing care and hygiene answers an unspoken worry.'],
    27: ['plan', 'Next month draft', 'Draft next month’s plan using what worked this month.'],
    29: ['report', 'Monthly report', 'Enquiries from social media, cost per WhatsApp chat, best and worst posts, and three changes for next month.'],
    30: ['report', 'Review call', 'A 30-minute call with the clinic owner to agree next month’s focus.']
  };
  const LABELS = { plan: 'Planning', create: 'Creating', engage: 'Community', ads: 'Ads', report: 'Reporting' };
  const grid = document.getElementById('sm-grid');
  const box = document.getElementById('sm-day');
  if (!grid) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cur = 1;
  function render() {
    const head = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="sm-wd" role="columnheader">${d}</div>`).join('');
    let cells = '';
    for (let d = 1; d <= 30; d++) {
      const x = DAYS[d];
      cells += x ? `<button type="button" role="gridcell" class="sm-c sm-t-${x[0]}${d === cur ? ' is-on' : ''}" data-d="${d}" aria-pressed="${d === cur}" aria-label="Day ${d}: ${esc(x[1])}"><span>${d}</span><small>${esc(x[1])}</small></button>` : `<div class="sm-c sm-empty" role="gridcell"><span>${d}</span></div>`;
    }
    grid.innerHTML = head + cells;
    const x = DAYS[cur];
    box.innerHTML = `<div class="sm-detail sm-t-${x[0]}"><span class="sm-tag">Day ${cur} · ${LABELS[x[0]]}</span><b>${esc(x[1])}</b><span>${esc(x[2])}</span><div class="sm-nav"><button type="button" data-go="-1">← Previous task</button><button type="button" data-go="1">Next task →</button></div></div>`;
  }
  const keys = Object.keys(DAYS).map(Number);
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) { cur = Number(b.dataset.d); render(); } });
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const idx = keys.indexOf(cur) + Number(b.dataset.go);
    cur = keys[(idx + keys.length) % keys.length];
    render();
  });
  render();
})();
