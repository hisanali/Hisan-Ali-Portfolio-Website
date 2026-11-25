(() => {
  'use strict';
  const form = document.getElementById('m5-check');
  const out = document.getElementById('m5-check-result');
  if (!form || !out) return;
  const render = () => {
    const offer = form.elements.namedItem('offer').value, lang = form.elements.namedItem('lang').value, goal = form.elements.namedItem('goal').value;
    const tips = [];
    let verdict, level;
    if (offer === 'diff') { verdict = 'Split into separate ads'; level = 'lo'; tips.push('Different offers need their own ads, so each one is measured and shown to the right people.'); }
    else if (goal === 'test') { verdict = 'Separate ads for now'; level = 'mid'; tips.push('Per-post results in a grouped ad aren’t clear yet. Test as separate ads, then group the winners.'); }
    else { verdict = 'Group them in one ad'; level = 'hi'; tips.push('Put up to five posts for the same offer in one ad and let Meta pick.'); }
    if (lang === 'mixed') tips.push('Make one ad per language, or target each by language, so people see a version they read.');
    tips.push('Choose posts with real engagement; comments and saves are the social proof you keep.');
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = level === 'hi' ? '1 ad' : '2+ ads';
    box.querySelector('strong').textContent = verdict;
    box.querySelector('p').textContent = 'Why:';
    const ul = box.querySelector('ul'); tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
