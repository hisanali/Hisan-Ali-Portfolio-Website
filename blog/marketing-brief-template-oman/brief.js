(() => {
  'use strict';
  // Annotated example brief for a fictional Muscat café. Nothing is stored or sent.
  const STRONG = [
    { k: 'Project', v: 'Ramadan evening menu launch · Qahwa House, Al Mouj' },
    { k: 'Background', v: 'Evening footfall dropped last Ramadan because people didn’t know we open after iftar. This year we have a new suhoor menu.', pin: 1 },
    { k: 'Objective', v: '300 table bookings via WhatsApp between 1 and 20 Ramadan.', pin: 2 },
    { k: 'Audience', v: 'Families and friend groups living within 15 minutes of Al Mouj who go out after iftar. Today they think we are a daytime coffee spot.', pin: 3 },
    { k: 'Key message', v: 'Your suhoor table is ready at Qahwa House, open until 2 am every night of Ramadan.', pin: 4 },
    { k: 'Proof', v: 'Sea-view terrace, 4.7★ from 900+ Google reviews, family seating, free parking.', pin: 5 },
    { k: 'Deliverables', v: '3 Reels (9:16), 4 Story frames, 1 carousel, WhatsApp auto-reply. Arabic first, English second.', pin: 6 },
    { k: 'Budget & timing', v: 'OMR 1,200 production + OMR 1,500 media. First drafts 10 days before Ramadan; live on day 1.', pin: 7 },
    { k: 'Approvals', v: 'Laila (marketing) day to day; Khalid (owner) signs off on drafts and final. 48-hour turnaround.', pin: 8 },
    { k: 'Avoid', v: 'Food shots during daylight hours in ads; music in Reels; any discount messaging.' }
  ];
  const WEAK = [
    { k: 'Project', v: 'Ramadan campaign' },
    { k: 'Background', v: 'We want to do something for Ramadan this year.', pin: 1 },
    { k: 'Objective', v: 'Increase awareness and get more customers and followers.', pin: 2 },
    { k: 'Audience', v: 'Everyone in Oman.', pin: 3 },
    { k: 'Key message', v: 'We are the best café with great food, great coffee, great service and a great view.', pin: 4 },
    { k: 'Proof', v: '—', pin: 5 },
    { k: 'Deliverables', v: 'Some posts and videos.', pin: 6 },
    { k: 'Budget & timing', v: 'ASAP. Budget to be discussed.', pin: 7 },
    { k: 'Approvals', v: 'Management.', pin: 8 }
  ];
  const NOTES = {
    1: { t: 'Background: say what changed', strong: 'It names a real problem (people think the café is closed in the evening) and why now (a new menu). The creative team can now aim at a specific belief.', weak: '“Something for Ramadan” gives no problem to solve, so every idea is equally right and equally wrong.' },
    2: { t: 'Objective: one number, one date', strong: 'One result, a number and a period. Everyone can tell on day 21 if it worked, and the WhatsApp booking route tells the designer what the call to action is.', weak: 'Three goals, no numbers. Awareness, customers and followers need different campaigns, and nobody can say afterwards if it worked.' },
    3: { t: 'Audience: who, where, and what they believe', strong: 'A group you can picture, a radius you can target, and the belief to change. That last part is what the creative really works on.', weak: 'Nobody advertises to everyone. This forces the team to guess, and generic work follows.' },
    4: { t: 'Message: one sentence they can repeat', strong: 'One idea (suhoor here, open late) in words a customer could say to a friend.', weak: 'Four claims every café makes. Nothing to remember and nothing to believe.' },
    5: { t: 'Proof: why believe it', strong: 'Specific, checkable reasons: the view, the rating, parking, family seating. These become visuals and captions.', weak: 'Empty. Without proof, the team will fill the space with adjectives.' },
    6: { t: 'Deliverables: a list to tick off', strong: 'Formats, quantities and language order. The supplier can quote accurately and nothing is forgotten.', weak: '“Some” is impossible to quote or plan. Expect a surprise invoice or a surprise gap.' },
    7: { t: 'Budget & timing: the real limits', strong: 'Production and media are split, and there is time for drafts before launch. Ideas will match what you can afford.', weak: 'ASAP with no budget usually means rushed work that is redesigned once the price is known.' },
    8: { t: 'Approvals: names and turnaround', strong: 'One day-to-day contact, one final decision-maker, a turnaround time. No surprise approver at the end.', weak: '“Management” could be five people with five opinions, arriving at the last minute.' }
  };
  const BLANK = 'MARKETING BRIEF\n\nProject:\nBackground (why now, what changed):\nObjective (one result, a number, a date):\nAudience (who, where, what they believe today):\nKey message (one sentence):\nProof (why believe it):\nDeliverables (formats, sizes, languages):\nBudget & timing:\nApprovals (names, turnaround):\nAvoid / must include:\nReferences (2–3 you like, 1 you don’t):\n';

  const paper = document.getElementById('mb-paper');
  const notes = document.getElementById('mb-notes');
  if (!paper || !notes) return;
  let ver = 'strong';
  let pin = 2;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const rows = ver === 'strong' ? STRONG : WEAK;
    paper.className = `mb-paper is-${ver}`;
    paper.innerHTML = `<div class="mb-paper-head"><span>Marketing brief</span><span>${ver === 'strong' ? 'v3 · ready to send' : 'v1 · draft'}</span></div>` +
      rows.map((r) => `<div class="mb-line${r.pin === pin ? ' is-on' : ''}"><span class="mb-k">${esc(r.k)}</span><span class="mb-v">${esc(r.v)}</span>${r.pin ? `<button type="button" class="mb-pin" data-pin="${r.pin}" aria-pressed="${r.pin === pin}" aria-label="Note ${r.pin}: ${esc(NOTES[r.pin].t)}">${r.pin}</button>` : ''}</div>`).join('') +
      (ver === 'weak' ? '<div class="mb-stamp" aria-hidden="true">Needs work</div>' : '');
    const n = NOTES[pin];
    notes.innerHTML = `<div class="mb-note is-${ver}"><span class="mb-note-n">${pin}</span><div class="mb-note-t">${esc(n.t)}</div><div class="mb-note-b">${esc(n[ver])}</div><div class="mb-note-alt"><b>${ver === 'strong' ? 'The weak version' : 'How the strong version fixes it'}</b>${esc(n[ver === 'strong' ? 'weak' : 'strong'])}</div><div class="mb-dots">${Object.keys(NOTES).map((k) => `<button type="button" data-pin="${k}" aria-label="Note ${k}" aria-pressed="${Number(k) === pin}"></button>`).join('')}</div></div>`;
  }

  document.getElementById('brief').addEventListener('click', (e) => {
    const p = e.target.closest('[data-pin]');
    if (p) { pin = Number(p.dataset.pin); render(); return; }
    const v = e.target.closest('[data-ver]');
    if (v) {
      ver = v.dataset.ver;
      document.querySelectorAll('.mb-switch [data-ver]').forEach((b) => b.setAttribute('aria-selected', String(b === v)));
      render();
    }
  });
  const copyBtn = document.getElementById('mb-copy');
  copyBtn?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(BLANK); copyBtn.textContent = 'Copied ✓'; }
    catch (err) { copyBtn.textContent = 'Copy failed'; }
    setTimeout(() => { copyBtn.textContent = 'Copy template'; }, 1800);
  });
  document.getElementById('mb-print')?.addEventListener('click', () => window.print());
  render();
})();
