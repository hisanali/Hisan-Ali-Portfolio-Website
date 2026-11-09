(() => {
  'use strict';
  const form = document.getElementById('ws-check');
  const out = document.getElementById('ws-check-result');
  if (!form || !out) return;
  // Approximate interface overlays on a 9:16 Status: progress bars and name at the top, reply bar and CTA at the bottom.
  const TOP = 13, BOT = 21;
  const POS = { top: 6, mid: 46, bottom: 82 };
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const ratio = v('ratio'), len = Math.max(1, Number(v('len')) || 1), logo = v('logo'), text = v('text'), cap = v('cap') === 'yes', open = v('open');
    const flags = [];
    const hiddenPos = p => POS[p] < TOP || POS[p] + 8 > 100 - BOT;
    if (ratio !== '916') flags.push(['bad', `A ${ratio === '45' ? '4:5' : ratio === '11' ? '1:1' : '16:9'} creative will be letterboxed on a full-screen 9:16 placement. Rebuild it vertical.`]);
    else flags.push(['ok', 'Full-screen 9:16: fills the Status frame.']);
    flags.push(hiddenPos(logo) ? ['bad', `Your logo sits ${logo === 'top' ? 'under the progress bars and name' : 'under the reply bar and CTA'}. Move it to the middle.`] : ['ok', 'Logo is in the safe middle of the frame.']);
    flags.push(hiddenPos(text) ? ['bad', `Your headline sits ${text === 'top' ? 'under the progress bars and name' : 'under the reply bar and CTA'}. Move it to the middle.`] : ['ok', 'Headline is in the safe middle of the frame.']);
    flags.push(cap ? ['ok', 'Captions or on-screen text: works with sound off.'] : ['bad', 'No captions: most Status viewers watch with sound off. Add on-screen text.']);
    flags.push(open === 'logo' ? ['bad', 'A logo animation in the first second invites a tap forward. Open on the product, offer or a person.'] : ['ok', `Opening on ${open === 'product' ? 'the product or offer' : 'a person talking'}: a strong first second.`]);
    flags.push(len > 30 ? ['bad', `${len}s is above the 30-second limit guides cite for ads. Cut it down.`] : len > 15 ? ['warn', `${len}s is allowed, but completion drops fast after 10–15 seconds. Try a 6–10s cut.`] : ['ok', `${len}s: short enough to finish.`]);
    const bad = flags.filter(f => f[0] === 'bad').length;
    out.innerHTML = '<div class="ws-out"><div class="ws-prev" aria-hidden="true"><div class="ws-zone top"></div><div class="ws-zone bot"></div><div class="ws-el" id="ws-el-logo">Logo</div><div class="ws-el" id="ws-el-text">Headline</div></div><div><p class="fe-small" id="ws-sum"></p><div class="ws-flags"></div></div></div>';
    const prev = out.querySelector('.ws-prev'); prev.classList.add('r' + ratio);
    const place = (id, p, hidden) => { const el = out.querySelector(id); el.style.top = POS[p] + '%'; el.classList.toggle('hidden', hidden); };
    place('#ws-el-logo', logo, hiddenPos(logo)); place('#ws-el-text', text, hiddenPos(text));
    out.querySelector('#ws-sum').textContent = bad ? `${bad} problem${bad > 1 ? 's' : ''} the Status interface or viewer behaviour would expose.` : 'Nothing hidden, nothing silent. Preview the real ad in Ads Manager to confirm.';
    const list = out.querySelector('.ws-flags');
    flags.forEach(([k, t]) => { const d = document.createElement('div'); d.className = 'ws-flag ' + k; d.innerHTML = '<i aria-hidden="true"></i><span></span>'; d.querySelector('i').textContent = k === 'ok' ? '✓' : k === 'warn' ? '!' : '✕'; d.querySelector('span').textContent = t; list.append(d); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
