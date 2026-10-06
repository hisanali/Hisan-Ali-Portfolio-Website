(() => {
  'use strict';
  // Green flag / red flag game with interview answers. Illustrative only; nothing is stored.
  const CARDS = [
    { q: 'How will you grow our business?', a: '“We’ll post every day on all platforms and you’ll see followers grow fast.”', flag: 'red', why: 'Activity is not a strategy. Daily posting on every platform says nothing about leads, sales or your customers.' },
    { q: 'Who owns the Google Ads account?', a: '“You. We’ll set it up under your business email and you add us as managers.”', flag: 'green', why: 'Exactly right. If you ever part ways, your data, history and audiences stay with you.' },
    { q: 'Can you get us to page one of Google?', a: '“Guaranteed, within 30 days.”', flag: 'red', why: 'Nobody controls Google’s rankings. Guarantees like this are either naive or dishonest.' },
    { q: 'What would you do first?', a: '“Before recommending anything, I’d like to understand your margins, best customers and how you handle enquiries.”', flag: 'green', why: 'Good marketers diagnose before they prescribe. The right plan depends on your business, not their package.' },
    { q: 'How do you measure success?', a: '“Reach and engagement rate. Our clients average 300% more impressions.”', flag: 'red', why: 'Impressions don’t pay salaries. Ask for leads, sales and cost per customer.' },
    { q: 'What if it doesn’t work?', a: '“We review monthly. If a channel isn’t paying back after a fair test, I’ll tell you and we stop or change it.”', flag: 'green', why: 'Honesty about failure protects your budget. You want someone who will stop spending your money on what doesn’t work.' },
    { q: 'How do you write Arabic content?', a: '“We write in English and run it through a translation tool.”', flag: 'red', why: 'Machine-translated Arabic often reads badly and damages trust. Arabic should be written, not just translated.' },
    { q: 'Can I talk to one of your clients?', a: '“Of course, I’ll connect you with two this week.”', flag: 'green', why: 'Confident marketers have clients who will vouch for them.' }
  ];
  const stage = document.getElementById('hd-stage');
  if (!stage) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let i = 0, right = 0, answered = null;
  function card() {
    const c = CARDS[i];
    stage.innerHTML = `<div class="hd-card${answered ? ` is-${c.flag}` : ''}">
      <div class="hd-prog">Answer ${i + 1} of ${CARDS.length}<span>${right} right so far</span></div>
      <div class="hd-q"><span>You ask</span>${esc(c.q)}</div>
      <div class="hd-a"><span>They answer</span>${esc(c.a)}</div>
      ${answered ? `<div class="hd-res"><b>${answered === c.flag ? 'Correct' : 'Not quite'}: ${c.flag === 'green' ? '🟢 green flag' : '🔴 red flag'}</b><span>${esc(c.why)}</span><button type="button" class="hd-next" data-next>${i < CARDS.length - 1 ? 'Next answer →' : 'See result →'}</button></div>`
      : `<div class="hd-btns"><button type="button" class="hd-flag hd-green" data-f="green">🟢 Green flag</button><button type="button" class="hd-flag hd-red" data-f="red">🔴 Red flag</button></div>`}
    </div>`;
  }
  function result() {
    stage.innerHTML = `<div class="hd-card hd-final"><b>${right}/${CARDS.length}</b><div>${right >= 7 ? 'You’re ready to interview marketers.' : right >= 5 ? 'Good instincts. Keep the 12 questions below handy.' : 'Use the 12 questions below in your next interview.'}</div><button type="button" class="hd-next" data-again>Play again</button></div>`;
  }
  stage.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]');
    if (f && !answered) { answered = f.dataset.f; if (answered === CARDS[i].flag) right++; card(); stage.querySelector('[data-next]').focus(); return; }
    if (e.target.closest('[data-next]')) { i++; answered = null; if (i < CARDS.length) card(); else result(); stage.querySelector('button').focus(); return; }
    if (e.target.closest('[data-again]')) { i = 0; right = 0; answered = null; card(); }
  });
  card();
})();
