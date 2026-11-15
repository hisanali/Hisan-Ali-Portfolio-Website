(() => {
  'use strict';
  const form = document.getElementById('gi-check');
  const out = document.getElementById('gi-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const who = v('who'), ai = v('ai'), ok = v('ok');
    const level = who === 'no' ? 'hi' : (ai === 'yes' && ok === 'no') || who === 'like' ? 'lo' : ok === 'no' ? 'lo' : 'mid';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = level === 'hi' ? 'Low' : level === 'mid' ? 'Check' : 'High';
    box.querySelector('strong').textContent = level === 'hi' ? 'Low risk on impersonation' : level === 'mid' ? 'Allowed with care' : 'High risk of rejection or suspension';
    box.querySelector('p').textContent = who === 'no' ? 'No real person is shown or voiced, so the impersonation rule doesn’t apply.' : who === 'like' ? 'An AI face or voice that resembles a known person can be treated as impersonation. Replace it.' : ok === 'no' ? 'Using a real person without permission breaks Google’s rules, and an AI label won’t fix it.' : ai === 'yes' ? 'You have permission. Keep the contract, and mark the AI edits where disclosure applies.' : 'A real, permitted endorsement is fine. Keep the agreement on file.';
    const ul = box.querySelector('ul'); const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (who !== 'no' && ok === 'no') add('Remove the person or get written permission before running the ad.');
    if (ai === 'yes') add('Mark AI-created or edited assets in Google Ads where disclosure applies.');
    add('Ask agencies to confirm in writing which parts of each ad are AI-generated.');
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
