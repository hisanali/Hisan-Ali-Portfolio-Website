(() => {
  'use strict';
  const form = document.getElementById('pm-quiz');
  const out = document.getElementById('pm-quiz-result');
  if (!form || !out) return;
  // Answers follow Google's Search Help wording on Personal Intelligence ads, as reported in October 2026.
  const WHY = [
    'Google says ads are not based directly on your Gmail inbox.',
    'Inferences from connected apps may be used to show ads.',
    'Google says sensitive categories such as health are not used for personalised ads.',
    'Advertisers do not get access to users’ connected apps.',
    'Summaries and excerpts from connected apps may be used.'
  ];
  const qs = [...form.querySelectorAll('.pm-q')];
  const render = () => {
    let answered = 0, right = 0;
    qs.forEach((q, i) => {
      const pick = q.querySelector('input:checked');
      q.classList.remove('ok', 'bad');
      const old = q.querySelector('.why'); if (old) old.remove();
      if (!pick) return;
      answered++;
      const ok = pick.value === q.dataset.a; if (ok) right++;
      q.classList.add(ok ? 'ok' : 'bad');
      const why = document.createElement('span'); why.className = 'why';
      why.textContent = (ok ? 'Correct. ' : 'Not quite. ') + WHY[i];
      q.append(why);
    });
    out.innerHTML = answered ? '<div class="fe-out"><div><span>Score</span><strong></strong><p></p></div></div>' : '<p class="fe-small">Answer any question to see the result.</p>';
    if (answered) {
      out.querySelector('strong').textContent = `${right} / ${answered}`;
      out.querySelector('p').textContent = answered < qs.length ? `${qs.length - answered} still to answer.` : right === qs.length ? 'Full marks. You know the rules better than most advertisers.' : 'The key line: inferences may be used; raw emails, sensitive data and advertiser access are not.';
    }
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
