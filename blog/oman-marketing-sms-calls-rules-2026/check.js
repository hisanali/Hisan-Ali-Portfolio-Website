(() => {
  'use strict';
  const form = document.getElementById('sm-check');
  const out = document.getElementById('sm-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const render = () => {
    const sender = v('sender').trim(), brand = v('brand').trim(), time = v('time'), line = v('line'), list = v('list'), text = v('text').trim();
    const fixes = [], ok = [];
    const [h, m] = (time || '00:00').split(':').map(Number); const mins = h * 60 + m;
    if (mins >= 480 && mins <= 1260) { ok.push('Inside the 8am to 9pm window.'); if (mins > 1230) fixes.push('Scheduled within 30 minutes of 9pm. A slow queue could deliver late; aim for 8:30pm at the latest.'); }
    else fixes.push(`${time || 'That time'} is outside 8am to 9pm. Move the send to between 8am and about 8:30pm.`);
    if (/^AD[-_ ]?/i.test(sender) && /^AD/.test(sender.toUpperCase())) ok.push('Sender ID starts with AD.'); else fixes.push('Promotional sender IDs must start with “AD”, for example AD-' + (norm(brand).slice(0, 8).toUpperCase() || 'BRAND') + '.');
    const core = norm(sender.replace(/^AD[-_ ]?/i, ''));
    if (core.length >= 2 && norm(brand).includes(core.slice(0, Math.min(core.length, 5)))) ok.push('Sender ID matches your business name.'); else fixes.push('The sender ID should reflect your legal or trade name so people recognise it. Use a short form of “' + (brand || 'your brand') + '”.');
    if (line === 'personal') fixes.push('Personal phone lines may not be used for commercial promotion. Send through a licensed SMS platform or a business line.'); else ok.push('Sent through a business channel.');
    if (list === 'optin') ok.push('Sent to people who opted in.'); else if (list === 'customers') fixes.push('Past customers without a recorded opt-in: send one message asking them to stay subscribed, and record who says yes.'); else fixes.push('Bought or shared lists invite blocking and raise data protection risk. Drop them and grow an opt-in list.');
    if (/stop|الغاء|إلغاء|opt.?out|unsubscribe/i.test(text)) ok.push('Opt-out instruction included.'); else fixes.push('Add a clear opt-out, such as “Reply STOP to opt out”, and honour it within a day.');
    if (text.length > 160) fixes.push(`The text is ${text.length} characters, so it will be split into ${Math.ceil(text.length / 153)} SMS parts. Shorten it to keep costs down.`);
    if (/(!{2,}|last chance tonight|urgent)/i.test(text)) fixes.push('Pressure wording (“last chance tonight”, “!!”) reads like spam and gets blocked. State the offer and the end date plainly.');
    const score = Math.max(0, Math.round(100 * ok.length / (ok.length + fixes.length)));
    const cls = fixes.some(f => /outside 8am|must start with|Personal phone/.test(f)) ? 'lo' : fixes.length ? 'mid' : 'hi';
    const head = cls === 'hi' ? 'Ready to send' : cls === 'mid' ? 'Allowed, but fix these first' : 'Would break the reported rules';
    out.innerHTML = '<div class="sm-verdict"><i aria-hidden="true"></i><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.sm-verdict'); box.classList.add(cls); box.querySelector('i').textContent = score;
    box.querySelector('strong').textContent = head;
    box.querySelector('p').textContent = ok.length ? ok.join(' ') : 'Nothing passes yet.';
    const ul = box.querySelector('ul'); fixes.forEach(f => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!fixes.length) ul.remove();
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
