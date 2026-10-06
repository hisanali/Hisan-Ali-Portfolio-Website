(() => {
  'use strict';
  // Five-question decision path. Points lean towards freelancer (f), agency (a) or in-house (i). Nothing is stored.
  const QS = [
    { q: 'What is your monthly marketing budget, including ads?', o: [['Small and focused', { f: 2, i: 0 }], ['Medium, growing', { f: 2, a: 1 }], ['Large, across many channels', { a: 3 }]] },
    { q: 'How many channels do you need right now?', o: [['One or two done properly', { f: 2 }], ['Three or four', { f: 1, a: 1 }], ['Everything: video, brand, ads, SEO, content', { a: 3 }]] },
    { q: 'How much daily marketing work is there?', o: [['A few hours a week', { f: 2 }], ['Steady daily posting and replies', { i: 2, f: 1 }], ['Many campaigns every week', { a: 2, i: 1 }]] },
    { q: 'Who do you want to talk to?', o: [['The expert doing the work', { f: 3 }], ['An account manager is fine', { a: 2 }], ['Someone sitting in our office', { i: 3 }]] },
    { q: 'How important is flexibility?', o: [['Very: we have busy and quiet seasons', { f: 2 }], ['Some', { f: 1, a: 1 }], ['We prefer a fixed long-term team', { a: 1, i: 2 }]] }
  ];
  const RESULTS = {
    f: { t: 'A freelance digital marketer', b: 'You need senior thinking on a focused set of channels, with direct access and flexibility. Check capacity, ownership of accounts and who covers design or video.', link: ['/freelance-digital-marketer-oman/', 'When a freelancer is the right choice'] },
    a: { t: 'A digital marketing agency', b: 'Your workload and channel mix need a team. Meet the people who will handle your account day to day, and keep ownership of every account.', link: ['/blog/digital-marketing-agency-oman/', 'How to choose an agency in Oman'] },
    i: { t: 'An in-house marketer, with expert support', b: 'There is enough daily work for a role in your office. Pair them with an external expert for ads, SEO and strategy so they don’t work alone.', link: ['/blog/hire-digital-marketer-oman/', 'Questions to ask when hiring'] }
  };
  const stage = document.getElementById('fa-stage');
  if (!stage) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let i = 0, pts = { f: 0, a: 0, i: 0 }, trail = [];
  function ask() {
    const q = QS[i];
    stage.innerHTML = `<div class="fa-card">
      <div class="fa-road">${QS.map((_, k) => `<span class="${k < i ? 'is-done' : k === i ? 'is-on' : ''}">${k + 1}</span>`).join('<i></i>')}</div>
      <div class="fa-q">${esc(q.q)}</div>
      <div class="fa-opts">${q.o.map(([label], k) => `<button type="button" data-k="${k}">${esc(label)}</button>`).join('')}</div>
      ${trail.length ? `<div class="fa-trail">${trail.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    </div>`;
  }
  function done() {
    const order = Object.keys(pts).sort((x, y) => pts[y] - pts[x]);
    const top = order[0], second = order[1];
    const close = pts[top] - pts[second] <= 1;
    const r = RESULTS[top];
    const total = pts.f + pts.a + pts.i || 1;
    stage.innerHTML = `<div class="fa-card fa-result">
      <span class="fa-k">Your best fit today</span>
      <div class="fa-r-t">${esc(r.t)}</div>
      <div class="fa-bars">${[['f', 'Freelancer'], ['a', 'Agency'], ['i', 'In-house']].map(([k, l]) => `<div class="${k === top ? 'is-top' : ''}"><span>${l}</span><i style="width:${Math.round((pts[k] / total) * 100)}%"></i></div>`).join('')}</div>
      <div class="fa-r-b">${esc(r.b)}${close ? ` <strong>It was close with ${esc(RESULTS[second].t.toLowerCase())}, so a hybrid could work well.</strong>` : ''}</div>
      <a class="fa-link" href="${r.link[0]}">${esc(r.link[1])} →</a>
      <button type="button" class="fa-again" data-again>Start again</button>
    </div>`;
  }
  stage.addEventListener('click', (e) => {
    if (e.target.closest('[data-again]')) { i = 0; pts = { f: 0, a: 0, i: 0 }; trail = []; ask(); return; }
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const [label, add] = QS[i].o[Number(b.dataset.k)];
    Object.entries(add).forEach(([k, v]) => { pts[k] += v; });
    trail.push(label);
    i++;
    if (i < QS.length) ask(); else done();
    stage.querySelector('button, a').focus();
  });
  ask();
})();
