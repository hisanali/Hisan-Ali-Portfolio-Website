(() => {
  'use strict';
  const form = document.getElementById('pc-check');
  const out = document.getElementById('pc-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const src = v('src'), rec = v('rec'), opt = v('out');
    const ok = src === 'optin' && rec === 'yes' && opt === 'yes';
    const level = src === 'bought' ? 'lo' : ok ? 'hi' : src === 'optin' ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = ok ? 'Send' : level === 'mid' ? 'Fix' : 'Stop';
    box.querySelector('strong').textContent = ok ? 'This list looks ready' : level === 'mid' ? 'Close the gaps first' : 'Don’t send marketing to this list yet';
    box.querySelector('p').textContent = src === 'bought' ? 'People on a bought or shared list never agreed to hear from you.' : src === 'checkout' ? 'Details given for a purchase or delivery are not agreement to marketing.' : src === 'chat' ? 'Messaging you about one question is not agreement to receive offers.' : ok ? 'Consent was actively given, recorded and can be withdrawn.' : 'The source is right, but records and opt-outs matter too.';
    const tips = [];
    if (src !== 'optin') tips.push('Ask these contacts once, in a service message, whether they want offers, and only add those who say yes.');
    if (rec === 'no') tips.push('Record the date, channel and wording each person agreed to.');
    if (opt === 'no') tips.push('Add a clear way to stop, such as “Reply STOP”, to every message.');
    if (!tips.length) tips.push('Keep messages between 8am and 9pm and use an approved sender name for SMS.');
    const ul = box.querySelector('ul'); tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
