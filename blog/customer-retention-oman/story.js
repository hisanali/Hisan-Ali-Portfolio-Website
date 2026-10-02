(() => {
  'use strict';
  // A customer's first 120 days as WhatsApp messages, for three example businesses. Content only; nothing is stored.
  const STEPS = [
    { day: 'Day 0', tag: 'Thank', why: 'Sent the same day. It confirms they chose well and opens the chat so later messages aren’t from a stranger.', goal: 'Feel cared for' },
    { day: 'Day 2', tag: 'Help', why: 'A genuinely useful tip about what they bought. No offer. This earns permission to message again.', goal: 'Get more value' },
    { day: 'Day 7', tag: 'Ask', why: 'The experience is still fresh. Ask for a review, and offer a private route for problems so you can fix them first.', goal: 'Review or feedback' },
    { day: 'Day 25', tag: 'Remind', why: 'Timed to their natural cycle: when beans run out, a check-up is due, or the product needs replacing.', goal: 'Second purchase' },
    { day: 'Day 60', tag: 'Reward', why: 'They came back. Recognise it. Exclusive access feels better than a generic discount.', goal: 'Become a regular' },
    { day: 'Day 120', tag: 'Win back', why: 'Only for people who have gone quiet. A personal check-in first; a small incentive if it fits.', goal: 'Restart the habit' }
  ];
  const BIZ = {
    cafe: { name: 'Qahwa House', sub: 'Al Mouj, Muscat', av: 'Q', cust: 'Maryam', msgs: [
      ['Thank you for visiting Qahwa House today, Maryam! ☕ We hope you enjoyed the saffron latte. Save this number for table bookings anytime.', 'Thank you! It was lovely 😊'],
      ['Tip: the Ethiopian beans you bought taste best within 3 weeks. Keep them sealed, away from the fridge, and grind just before brewing.', 'Oh good to know, I was keeping them in the fridge 😅'],
      ['How was your week with the new beans? If you have a minute, a Google review helps a small café like ours a lot ⭐ (link). Anything we could do better? Just reply here.', 'Done! ⭐⭐⭐⭐⭐'],
      ['Your bag of Ethiopian beans is probably running low 🙂 Shall we keep one aside for you? Pick up anytime this week.', 'Yes please, Thursday evening'],
      ['You’re officially a regular, Maryam 🎉 You’re invited to our members-only tasting of the new Yemeni single origin, Saturday 7 pm. Bring a friend.', 'We’ll be there!'],
      ['We’ve missed you at Qahwa House! The winter menu is out, and your next saffron latte is on us this month. Hope to see you soon.', 'Aww thank you, coming this weekend']
    ] },
    clinic: { name: 'Smile Dental', sub: 'Al Khuwair, Muscat', av: 'S', cust: 'Ahmed', msgs: [
      ['Thank you for visiting Smile Dental today, Ahmed. Your cleaning went well. Any sensitivity in the next 24 hours is normal. We’re here if you need us.', 'Thanks, feeling fine'],
      ['A quick care tip from Dr Huda: use a soft brush and wait 30 minutes after meals before brushing. It protects enamel.', 'Will do 👍'],
      ['We hope you’re happy with your visit. Would you share your experience on Google? (link) If anything wasn’t right, reply here and our manager will call you.', 'Left a review. Great team'],
      ['Reminder: your follow-up check for the filling is due next week. Would Sunday 5 pm or Tuesday 7 pm suit you?', 'Tuesday 7 works'],
      ['Thank you for trusting us with your family’s care. As a returning patient, your children’s first check-up is complimentary this term.', 'That’s great, will book for both'],
      ['Hi Ahmed, it’s been 6 months since your last cleaning. Shall we book your next one? We have evening slots after work this month.', 'Yes, next Monday please']
    ] },
    shop: { name: 'Bayt Home', sub: 'Online · delivers across Oman', av: 'B', cust: 'Noor', msgs: [
      ['Your order is delivered 🎉 Thank you for shopping with Bayt Home, Noor. Any issue with the cushions or delivery, reply here and a real person will help.', 'Received, they look beautiful'],
      ['Care tip: the linen covers are machine-washable at 30°C. Wash inside out and air-dry to keep the colour rich.', 'Perfect, thanks'],
      ['How are the cushions settling in? A photo review helps other shoppers a lot (link). Not happy with anything? We’ll fix it.', 'Posted one with my sofa 📸'],
      ['The matching throw for your Sand cushions is back in stock, and it ships free with your next order this month.', 'Ooh, sending the order now'],
      ['Thank you for being a loyal customer 💛 You get early access to our Eid collection 48 hours before everyone else. Here’s your private link.', 'Love this'],
      ['We haven’t seen you in a while, Noor! Here’s what’s new for winter, and free delivery on us until the end of the month. Reply “stop” anytime to opt out.', 'Will have a look tonight']
    ] }
  };

  const chat = document.getElementById('cr-chat');
  const who = document.getElementById('cr-who');
  const chips = document.getElementById('cr-chips');
  const note = document.getElementById('cr-note');
  const prev = document.getElementById('cr-prev');
  const next = document.getElementById('cr-next');
  const play = document.getElementById('cr-play');
  if (!chat || !chips) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let biz = 'cafe';
  let step = 0;
  let timer = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render(animate) {
    const b = BIZ[biz];
    who.innerHTML = `<span class="cr-av">${b.av}</span><span><b>${esc(b.name)}</b><small>${esc(b.sub)}</small></span>`;
    chat.innerHTML = b.msgs.slice(0, step + 1).map(([out, reply], i) =>
      `<div class="cr-daymark">${esc(STEPS[i].day)}</div><div class="cr-msg cr-out${animate && i === step ? ' is-new' : ''}">${esc(out)}<small>10:${String(12 + i * 7).padStart(2, '0')}</small></div><div class="cr-msg cr-in${animate && i === step ? ' is-new is-late' : ''}">${esc(reply)}<small>${esc(b.cust)}</small></div>`).join('');
    chat.scrollTo({ top: chat.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    chips.innerHTML = STEPS.map((s, i) => `<button type="button" role="tab" aria-selected="${i === step}" data-s="${i}" class="${i < step ? 'is-done' : ''}"><span>${esc(s.day)}</span>${esc(s.tag)}</button>`).join('');
    const s = STEPS[step];
    note.innerHTML = `<div class="cr-note-in"><span class="cr-note-tag">${esc(s.day)} · ${esc(s.tag)}</span><div class="cr-note-why">${esc(s.why)}</div><div class="cr-note-goal"><span>Goal</span>${esc(s.goal)}</div></div>`;
    prev.disabled = step === 0;
    next.disabled = step === STEPS.length - 1;
  }
  function go(i) { step = Math.max(0, Math.min(STEPS.length - 1, i)); render(true); }
  function stop() { clearInterval(timer); timer = null; play.textContent = '▶ Play all'; }

  chips.addEventListener('click', (e) => { const c = e.target.closest('[data-s]'); if (c) { stop(); go(Number(c.dataset.s)); } });
  prev.addEventListener('click', () => { stop(); go(step - 1); });
  next.addEventListener('click', () => { stop(); go(step + 1); });
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    play.textContent = '❚❚ Pause';
    if (step === STEPS.length - 1) step = -1;
    go(step + 1);
    timer = setInterval(() => { if (step >= STEPS.length - 1) stop(); else go(step + 1); }, 2600);
  });
  document.querySelectorAll('.cr-biz [data-biz]').forEach((btn) => btn.addEventListener('click', () => {
    biz = btn.dataset.biz;
    document.querySelectorAll('.cr-biz [data-biz]').forEach((x) => x.setAttribute('aria-selected', String(x === btn)));
    render(false);
  }));
  render(false);
})();
