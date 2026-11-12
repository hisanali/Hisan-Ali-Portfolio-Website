(() => {
  'use strict';
  const form = document.getElementById('sv-check');
  const out = document.getElementById('sv-check-result');
  if (!form || !out) return;
  const TIPS = { cam: 'Check your cameras cover entrances, tills and stock areas, and that they work.', rec: 'Make sure recordings are stored and can be exported if requested.', alarm: 'Get quotes for an intrusion alarm, but wait for the regulations before buying.', sign: 'Put up a bilingual notice that the premises are recorded.', access: 'Limit footage access to named people and keep a log.', policy: 'Add camera recording to your privacy notice.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Well prepared' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
