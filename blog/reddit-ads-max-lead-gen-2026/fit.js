(() => {
  'use strict';
  const form = document.getElementById('rd-fit');
  const out = document.getElementById('rd-fit-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const type = v('type'), cat = v('cat'), value = Math.max(0, Number(v('value')) || 0), budget = Math.max(0, Number(v('budget')) || 0), page = v('page') === 'yes', crm = v('crm'), voice = v('voice') === 'yes';
    let score = 0; const fixes = [], plus = [];
    if (type === 'b2b') { score += 25; plus.push('B2B buyers research in subreddits; the October changes are built for you.'); } else if (type === 'pro') { score += 18; } else { score += 10; fixes.push('Consumer offers work on Reddit too, but the October lead gen tools are aimed at B2B; use conversion campaigns instead.'); }
    if (cat === 'inmarket') { score += 20; plus.push('Your category matches Reddit’s in-market audiences beta (Enterprise, Business AI, Cybersecurity).'); } else if (cat === 'tech') { score += 14; plus.push('Tech subreddits are active and specific; use subreddit and keyword targeting.'); } else if (cat === 'finance') { score += 10; } else { score += 6; fixes.push('Find at least three active subreddits where your buyers already discuss the problem before you spend.'); }
    if (value >= 2000) { score += 15; plus.push('Deal value justifies a lead-based model and a sales follow-up.'); } else if (value >= 300) { score += 10; } else { score += 4; fixes.push('Low order values rarely pay back lead generation; test a purchase objective instead.'); }
    if (budget >= 3000) score += 12; else if (budget >= 1000) { score += 8; } else { score += 3; fixes.push('Under about $1,000 a month, Max has too little data to learn; give the test four weeks and a bigger budget.'); }
    if (page) score += 12; else fixes.push('Reddit’s native lead forms are retired. Build a fast landing page with a three-field form first.');
    if (crm === 'hubspot') { score += 8; plus.push('HubSpot’s open-beta integration gives you attribution and reporting now.'); } else if (crm === 'other') { score += 5; fixes.push('Use UTMs and a lead-source field until Pixel and Conversions API support arrives.'); } else { fixes.push('Without a CRM you cannot judge lead quality; even a spreadsheet with a source column is better than nothing.'); }
    if (voice) score += 8; else fixes.push('Assign someone to answer comments on the ad within a day; unanswered replies are read by everyone.');
    score = Math.min(100, score);
    const cls = score >= 70 ? 'hi' : score >= 45 ? 'mid' : 'lo';
    const head = cls === 'hi' ? 'Strong fit: run the four-week test' : cls === 'mid' ? 'Possible fit: fix the gaps first' : 'Weak fit for lead gen on Reddit';
    out.innerHTML = '<div class="rd-verdict"><i aria-hidden="true"></i><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.rd-verdict'); box.classList.add(cls); box.querySelector('i').textContent = score;
    box.querySelector('strong').textContent = head;
    box.querySelector('p').textContent = (plus[0] || '') + (fixes.length ? ` Before spending: ` : ' Nothing is missing; judge results by pipeline after four weeks.');
    const ul = box.querySelector('ul'); fixes.forEach(f => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!fixes.length) ul.remove();
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
