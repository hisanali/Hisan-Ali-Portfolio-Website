(() => {
  'use strict';
  const form = document.getElementById('wu-check');
  const out = document.getElementById('wu-check-result');
  if (!form || !out) return;
  const TIPS = { reserve: 'Reserve your username in WhatsApp Manager or Meta Business Suite.', match: 'Choose a name that matches your Instagram and Facebook handles.', verified: 'Complete your business profile: hours, address, website and catalogue.', crm: 'Ask your CRM or chatbot provider how it handles business-scoped user IDs.', print: 'List where your number is printed so you can add the username at launch.', consent: 'Record when and how each contact agreed to receive offers.' };
  const render = () => {
    const boxes = [...form.querySelectorAll('input[name="c"]')];
    const done = boxes.filter(b => b.checked).length, missing = boxes.filter(b => !b.checked).map(b => b.value);
    const score = Math.round(done / boxes.length * 100), level = score >= 75 ? 'hi' : score >= 40 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = done + '/' + boxes.length;
    box.querySelector('strong').textContent = level === 'hi' ? 'Ready for usernames' : level === 'mid' ? 'Getting there' : 'Start with the basics';
    box.querySelector('p').textContent = missing.length ? 'Do these next:' : 'Everything is in place.';
    const ul = box.querySelector('ul'); missing.slice(0, 3).forEach(k => { const li = document.createElement('li'); li.textContent = TIPS[k]; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
