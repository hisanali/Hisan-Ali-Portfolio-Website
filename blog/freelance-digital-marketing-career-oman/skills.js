(() => {
  'use strict';
  // Freelance skills map: tap a tile to see demand, learning route and a first service to sell. Content only.
  const SKILLS = [
    { k: 'social', ic: '📱', t: 'Social media management', demand: 'High', learn: 'Platform help centres, studying local brands, practising content planning and short video.', first: 'Monthly content plan and posting for one small business, with a simple report.', note: 'Easy to start, hard to stand out. Specialise in one industry.' },
    { k: 'gbp', ic: '📍', t: 'Google Business Profile', demand: 'High', learn: 'Google’s Business Profile help pages and practice on real local listings.', first: 'Profile setup and optimisation package for local shops, clinics and restaurants.', note: 'Fast visible results make it a great first service.' },
    { k: 'ads', ic: '🎯', t: 'Google Ads', demand: 'High', learn: 'Google Skillshop certifications, then careful practice with small real budgets.', first: 'Search campaign setup with conversion tracking for one service business.', note: 'Valuable but mistakes cost clients money. Learn tracking first.' },
    { k: 'meta', ic: '📣', t: 'Meta Ads', demand: 'High', learn: 'Meta Blueprint, plus testing creatives and audiences on small budgets.', first: 'Lead or WhatsApp campaign for a local business, with weekly optimisation.', note: 'Creative matters as much as targeting.' },
    { k: 'seo', ic: '🔎', t: 'SEO', demand: 'Medium–high', learn: 'Google Search Central documentation, building and ranking your own site.', first: 'SEO audit with a prioritised fix list for a small business website.', note: 'Slow results; sell audits and fixes before long retainers.' },
    { k: 'content', ic: '✍️', t: 'Copywriting (Arabic/English)', demand: 'High', learn: 'Reading great ads, writing daily, getting feedback from native speakers.', first: 'Website copy or ad copy packages, especially bilingual.', note: 'Strong Arabic copywriting is rare and valued.' },
    { k: 'analytics', ic: '📊', t: 'Analytics & tracking', demand: 'Medium', learn: 'GA4 and Tag Manager documentation; set up tracking on your own projects.', first: 'Conversion tracking setup and a simple dashboard.', note: 'Few people do it properly. Pairs well with ads.' },
    { k: 'video', ic: '🎬', t: 'Short video editing', demand: 'High', learn: 'CapCut or Premiere tutorials, studying hooks and pacing in Reels and TikTok.', first: 'Monthly pack of edited Reels from client footage.', note: 'Combine with social media management for a stronger offer.' }
  ];
  const grid = document.getElementById('fc-grid');
  const detail = document.getElementById('fc-detail');
  if (!grid) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cur = 'gbp';
  function render() {
    grid.innerHTML = SKILLS.map((s) => `<button type="button" role="tab" aria-selected="${s.k === cur}" data-k="${s.k}"><span aria-hidden="true">${s.ic}</span><b>${esc(s.t)}</b></button>`).join('');
    const s = SKILLS.find((x) => x.k === cur);
    detail.innerHTML = `<div class="fc-card"><div class="fc-card-h"><span aria-hidden="true">${s.ic}</span><div><b>${esc(s.t)}</b><small>Client demand in Oman: ${esc(s.demand)}</small></div></div>
      <div class="fc-rows"><div><span>How to learn</span>${esc(s.learn)}</div><div><span>First service to sell</span>${esc(s.first)}</div></div>
      <div class="fc-tip">💡 ${esc(s.note)}</div></div>`;
  }
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { cur = b.dataset.k; render(); grid.querySelector(`[data-k="${cur}"]`).focus(); } });
  render();
})();
