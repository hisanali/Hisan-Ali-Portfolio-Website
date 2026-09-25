(() => {
  'use strict';
  const form = document.getElementById('aj-mapper-form');
  const bar = document.getElementById('aj-bar');
  const out = document.getElementById('aj-mapper-result');
  if (!form || !bar || !out) return;
  const update = () => {
    const checked = [...form.querySelectorAll('input:checked')].map(input => input.value);
    const total = checked.length;
    const count = key => checked.filter(v => v === key).length;
    const share = key => total ? Math.round(count(key) / total * 100) : 0;
    const auto = share('auto'), assist = share('assist'), human = total ? 100 - auto - assist : 0;
    bar.querySelector('.aj-b-auto').style.width = `${auto}%`;
    bar.querySelector('.aj-b-assist').style.width = `${assist}%`;
    bar.querySelector('.aj-b-human').style.width = `${human}%`;
    bar.setAttribute('aria-label', `AI does it ${auto}%, AI drafts ${assist}%, stays human ${human}%`);
    if (!total) { out.textContent = 'Tick at least one task to see your mix.'; return; }
    let advice;
    if (auto >= 50) advice = 'Much of your week sits on the “AI does it” shelf. Start using AI for those tasks now, and deliberately take on reviewing and decision work.';
    else if (human >= 50) advice = 'Most of your week depends on presence and trust. Use AI to cut admin so you have more time for the human part.';
    else advice = 'Your week is mostly judgement work. AI makes you faster here, as long as you stay the one who checks and decides.';
    out.textContent = `AI does it: ${auto}% · AI drafts, you decide: ${assist}% · Stays human: ${human}%. ${advice}`;
  };
  form.addEventListener('change', update);
  update();
})();
