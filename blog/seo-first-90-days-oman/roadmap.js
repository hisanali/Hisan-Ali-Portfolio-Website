(() => {
  'use strict';
  // 90-day SEO roadmap. The bars are an illustrative pattern of early signals, not real data or a forecast.
  const PHASES = [
    { days: 'Days 1–14', t: 'Foundations', work: ['Access to Search Console, Analytics and Google Business Profile, owned by you', 'Conversion tracking for calls, WhatsApp and forms', 'Technical audit: speed, mobile, indexing, broken pages', 'Keyword research in Arabic and English, by intent'], get: 'A written audit and a prioritised 90-day plan.', signs: 'No ranking changes yet, and that’s normal. You should see clear tracking and a plan.', bars: [1, 1, 1, 1] },
    { days: 'Days 15–30', t: 'Fix & optimise', work: ['Fix the most important technical issues', 'Rewrite titles and descriptions for key pages', 'Optimise Google Business Profile: categories, services, photos', 'Start a simple review request process'], get: 'A list of completed fixes and before/after notes.', signs: 'Search Console may show pages being re-crawled and small impression changes.', bars: [1, 1.2, 1.3, 1.4] },
    { days: 'Days 31–60', t: 'Content & local', work: ['Create or improve pages for main services and areas', 'Answer real customer questions in helpful content', 'Internal links between related pages', 'Consistent business details across directories'], get: 'New and improved pages, published and indexed.', signs: 'Impressions often rise first, with new long-tail searches appearing.', bars: [1.4, 1.7, 2, 2.3] },
    { days: 'Days 61–90', t: 'Grow & measure', work: ['Earn relevant local links and mentions honestly', 'Improve pages that are close to page one', 'Review which searches bring enquiries', 'Plan the next quarter'], get: 'A 90-day report with enquiries, visibility and next steps.', signs: 'Better positions for specific searches, more clicks, and the first organic enquiries.', bars: [2.3, 2.7, 3.1, 3.5] }
  ];
  const tabs = document.getElementById('s9-phases');
  const panel = document.getElementById('s9-panel');
  if (!tabs) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cur = 0;
  function render() {
    tabs.innerHTML = PHASES.map((p, i) => `<button type="button" role="tab" aria-selected="${i === cur}" data-i="${i}" class="${i < cur ? 'is-done' : ''}"><span>${esc(p.days)}</span><b>${esc(p.t)}</b></button>`).join('');
    const all = PHASES.flatMap((p) => p.bars);
    const max = Math.max(...all);
    const p = PHASES[cur];
    panel.innerHTML = `<div class="s9-card">
      <div class="s9-col"><span class="s9-k">The work</span><div class="s9-list">${p.work.map((w) => `<div>${esc(w)}</div>`).join('')}</div>
      <div class="s9-get"><b>You should receive</b>${esc(p.get)}</div></div>
      <div class="s9-col"><span class="s9-k">Signs of progress</span>
        <div class="s9-chart" aria-hidden="true">${all.map((v, i) => `<i class="${Math.floor(i / 4) === cur ? 'is-now' : Math.floor(i / 4) < cur ? 'is-past' : ''}" style="height:${(v / max) * 100}%"></i>`).join('')}</div>
        <div class="s9-chart-l"><span>Day 1</span><span>Search impressions (illustrative)</span><span>Day 90</span></div>
        <div class="s9-signs">${esc(p.signs)}</div></div>
    </div>`;
  }
  tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { cur = Number(b.dataset.i); render(); tabs.querySelector(`[data-i="${cur}"]`).focus(); } });
  render();
})();
