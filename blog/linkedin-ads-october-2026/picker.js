(() => {
  'use strict';
  const form = document.getElementById('li-pick');
  const out = document.getElementById('li-pick-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const goal = v('goal'), budget = Math.max(0, Number(v('budget')) || 0), aud = Math.max(0, Number(v('aud')) || 0), managed = v('managed') === 'managed';
    const recs = [];
    const add = (status, name, why) => recs.push({ status, name, why });
    if (goal === 'lead') { add('ok', 'Lead gen forms or document ads', 'Native forms keep the lead on LinkedIn; documents earn the download.'); add(budget >= 1500 ? 'ok' : 'maybe', 'Conversation or message ads', budget >= 1500 ? 'Works for high-value offers with a sales follow-up.' : 'Usually needs more budget to learn; start with sponsored content.'); }
    if (goal === 'aware') { add('ok', 'Video ads (auction)', 'Lowest cost per view for awareness; lead with the point in three seconds.'); add(aud >= 100000 ? 'ok' : 'no', 'Reserved Ads', aud >= 100000 ? 'Your audience meets the reported 100,000-member minimum for guaranteed first impressions.' : `Reported minimum is 100,000 members; your audience is ${aud.toLocaleString('en-US')}. Broaden it or stay in the auction.`); add(managed && budget >= 50000 ? 'ok' : 'no', 'Premiere video', managed && budget >= 50000 ? 'You have a managed account and the $50,000 reservation minimum.' : 'Needs a managed account and a $50,000 minimum reservation.'); }
    if (goal === 'follow') { add('ok', 'Thought Leader Ads', 'Promote a person’s posts; track member follows and profile clicks with API version 202610 or your dashboard.'); add('ok', 'Follower ads (dynamic)', 'Lower-cost follower growth for a company page.'); }
    if (goal === 'launch') { add('ok', 'Sponsored content with a lifetime budget and schedule', 'Daily budgets can now spend up to a reported 2× on a given day; a lifetime budget caps the launch window.'); add(aud >= 100000 ? 'ok' : 'no', 'Reserved Ads for launch day', aud >= 100000 ? 'Guaranteed first impressions on the day that matters.' : 'Audience below the reported 100,000 minimum.'); }
    add('maybe', 'In-Stream Ads (pre-roll before creators’ videos)', 'Invite-only US test since 15 October; no payouts, prices or exclusions published. Ask your rep.');
    if (budget < 300) recs.unshift({ status: 'maybe', name: 'Budget check', why: `$${budget.toLocaleString('en-US')} a month is near LinkedIn’s $10-a-day floor; expect slow learning and few leads.` });
    out.innerHTML = '<div class="li-out"></div>';
    const list = out.querySelector('.li-out');
    recs.forEach(r => { const d = document.createElement('div'); d.className = 'li-rec ' + r.status; d.innerHTML = '<div><b></b><small></small></div><em></em>'; d.querySelector('b').textContent = r.name; d.querySelector('small').textContent = r.why; d.querySelector('em').textContent = r.status === 'ok' ? 'Fits' : r.status === 'no' ? 'Not eligible' : 'Check'; list.append(d); });
    const note = document.createElement('p'); note.className = 'fe-small'; note.textContent = goal === 'launch' || budget < 1000 ? 'Pacing tip: use a lifetime budget and a schedule, not a daily figure, for anything with a hard date or a tight cap.' : 'Pacing tip: with the reported 2× daily allowance, review spend weekly rather than daily.'; list.append(note);
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
