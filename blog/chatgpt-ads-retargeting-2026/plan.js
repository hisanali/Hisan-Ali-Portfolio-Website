(() => {
  'use strict';
  const form = document.getElementById('cr-plan');
  const out = document.getElementById('cr-plan-result');
  if (!form || !out) return;
  const PLAN = {
    big: [[0.4, 'Chat ad', 'Week 1–4', 'Answer the research question: specs, finance, comparisons'], [0.35, 'Connected TV', 'Week 2–6', 'A 15-second brand spot that builds trust'], [0.25, 'Display', 'Week 3–8', 'Book a test drive, viewing or consultation']],
    tech: [[0.45, 'Chat ad', 'Week 1–3', 'Show the product that fits the question asked'], [0.2, 'Connected TV', 'Week 2–4', 'A short demo of the product in use'], [0.35, 'Display', 'Week 2–5', 'Price, offer and free delivery']],
    travel: [[0.35, 'Chat ad', 'Week 1–4', 'Itinerary ideas and what makes the place special'], [0.4, 'Connected TV', 'Week 2–6', 'Scenery and experiences in motion'], [0.25, 'Display', 'Week 3–8', 'Dates, rates and a book-now link']],
    service: [[0.5, 'Chat ad', 'Week 1–4', 'Expert answer to the problem the person described'], [0.15, 'Connected TV', 'Week 2–6', 'A client story or founder message'], [0.35, 'Display', 'Week 2–8', 'Free consultation or audit offer']]
  };
  const render = () => {
    const biz = form.elements.namedItem('biz').value, budget = Math.max(0, Number(form.elements.namedItem('budget').value) || 0);
    out.innerHTML = '<div class="cr-rows"></div><p class="ed-fine"></p>';
    const list = out.querySelector('.cr-rows');
    PLAN[biz].forEach(([w, ch, when, msg]) => { const d = document.createElement('div'); d.className = 'cr-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = ch + ' · ' + when; d.querySelector('strong').textContent = '$' + Math.round(budget * w).toLocaleString('en-US'); d.querySelector('span').textContent = msg + '.'; list.append(d); });
    out.querySelector('.ed-fine').textContent = 'Keep a holdout group that sees only the chat ad, so you can measure what the follow-up adds.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
