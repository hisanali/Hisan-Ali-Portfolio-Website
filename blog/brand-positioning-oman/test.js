(() => {
  'use strict';
  // "Sameness test": generic slogans, guess the business. Illustrative slogans; nothing is stored.
  const ROUNDS = [
    { line: '“Quality you can trust, service you deserve.”', answer: 'Car garage', options: ['Car garage', 'Dental clinic', 'Furniture shop', 'Law firm'], better: 'A video of the problem before we touch your car. Fixed price, agreed on WhatsApp.' },
    { line: '“Your satisfaction is our priority.”', answer: 'Laundry', options: ['Hotel', 'Laundry', 'Internet provider', 'Bakery'], better: 'Collected tonight, folded and back at your door by 6 pm tomorrow. Anywhere in Seeb.' },
    { line: '“The best prices in Oman, guaranteed.”', answer: 'Phone shop', options: ['Phone shop', 'Tyre shop', 'Travel agent', 'Electronics store'], better: 'Every phone tested for 30 points before sale, with a 6-month warranty, even on used models.' },
    { line: '“Excellence in every detail.”', answer: 'Interior designer', options: ['Wedding planner', 'Interior designer', 'Jeweller', 'Architect'], better: 'Your first apartment, fully designed and furnished in three weeks, on a fixed budget.' },
    { line: '“Innovative solutions for a better tomorrow.”', answer: 'IT company', options: ['Bank', 'IT company', 'Solar installer', 'University'], better: 'If a clinic’s system goes down, our engineer is there within two hours. 30 clinics rely on it.' }
  ];
  const stage = document.getElementById('bp-stage');
  if (!stage) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let i = 0;
  let right = 0;
  let picked = null;

  function round() {
    const r = ROUNDS[i];
    stage.innerHTML = `<div class="bp-card">
      <div class="bp-prog"><span>Slogan ${i + 1} of ${ROUNDS.length}</span><span class="bp-dots">${ROUNDS.map((_, k) => `<i class="${k < i ? 'is-done' : k === i ? 'is-on' : ''}"></i>`).join('')}</span></div>
      <div class="bp-sign"><span class="bp-sign-label">Sign above a shop door</span><span class="bp-sign-line">${esc(r.line)}</span></div>
      <div class="bp-q">Which business is this?</div>
      <div class="bp-opts">${r.options.map((o) => {
        let cls = '';
        if (picked) cls = o === r.answer ? ' is-right' : o === picked ? ' is-wrong' : ' is-dim';
        return `<button type="button" data-o="${esc(o)}" class="bp-opt${cls}" ${picked ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${picked ? `<div class="bp-reveal"><div class="bp-verdict">${picked === r.answer ? 'Correct, but probably a lucky guess.' : `It was a ${esc(r.answer.toLowerCase())}.`} <span>Any of these businesses could have used it.</span></div><div class="bp-better"><b>A positioned version</b>${esc(r.better)}</div><button type="button" class="bp-next" data-next>${i < ROUNDS.length - 1 ? 'Next slogan →' : 'See my result →'}</button></div>` : ''}
    </div>`;
  }
  function result() {
    stage.innerHTML = `<div class="bp-card bp-result">
      <div class="bp-score"><b>${right}/${ROUNDS.length}</b><span>correct guesses</span></div>
      <div class="bp-result-t">${right <= 2 ? 'You couldn’t tell them apart. Neither can customers.' : 'Good guessing, but notice how hard it was.'}</div>
      <div class="bp-result-b">Generic slogans don’t fail because they are wrong. They fail because they could belong to anyone. The positioned versions each name a customer, a specific promise and proof. Now try the swap test on your own homepage.</div>
      <button type="button" class="bp-next" data-again>Try again</button>
    </div>`;
  }
  stage.addEventListener('click', (e) => {
    const o = e.target.closest('[data-o]');
    if (o && !picked) { picked = o.dataset.o; if (picked === ROUNDS[i].answer) right++; round(); stage.querySelector('[data-next]').focus(); return; }
    if (e.target.closest('[data-next]')) { i++; picked = null; if (i < ROUNDS.length) round(); else result(); stage.querySelector('button').focus(); return; }
    if (e.target.closest('[data-again]')) { i = 0; right = 0; picked = null; round(); }
  });
  round();
})();
