(function () {
  'use strict';
  const { $, $$, esc, copy, toast, segmented, steps } = window.TK;

  const SOCIAL = { linkedin: 'LinkedIn', instagram: 'Instagram', x: 'X', facebook: 'Facebook', whatsapp: 'WhatsApp', youtube: 'YouTube' };
  const el = { form: $('#esForm'), preview: $('#esPreview'), color: $('#esColor'), colorText: $('#esColorText'), copyRich: $('#esCopy'), copyHtml: $('#esCopyHtml'), code: $('#esCode'), example: $('#esExample'), status: $('#esStatus') };
  const tracker = steps($('#tkSteps'));
  const layout = segmented($('#esLayout'), render);
  const v = (id) => ($(`#es-${id}`)?.value || '').trim();
  const href = (u) => (u && !/^https?:\/\//i.test(u) && !/^mailto:|^tel:/.test(u) ? `https://${u}` : u);

  function socials(c) {
    return Object.keys(SOCIAL).filter((k) => v(k)).map((k) => {
      let url = v(k);
      if (k === 'whatsapp') url = `https://wa.me/${url.replace(/[^\d]/g, '')}`;
      return `<a href="${esc(href(url))}" style="display:inline-block;margin:0 6px 0 0;padding:4px 9px;border-radius:12px;background:${c};color:#ffffff;font:600 11px Arial,sans-serif;text-decoration:none">${SOCIAL[k]}</a>`;
    }).join('');
  }

  function html() {
    const c = el.color.value;
    const name = esc(v('name') || 'Your Name');
    const title = esc([v('title'), v('company')].filter(Boolean).join(' · '));
    const phone = v('phone');
    const email = v('email');
    const site = v('website');
    const addr = esc(v('address'));
    const photo = v('photo');
    const logo = v('logo');
    const line = (label, value, link) => (value ? `<tr><td style="padding:1px 8px 1px 0;color:${c};font:700 12px Arial,sans-serif">${label}</td><td style="padding:1px 0;font:13px Arial,sans-serif;color:#333333">${link ? `<a href="${esc(link)}" style="color:#333333;text-decoration:none">${esc(value)}</a>` : esc(value)}</td></tr>` : '');
    const details = `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${line('P', phone, phone && `tel:${phone.replace(/[^\d+]/g, '')}`)}${line('E', email, email && `mailto:${email}`)}${line('W', site.replace(/^https?:\/\//, ''), site && href(site))}${addr ? `<tr><td style="padding:1px 8px 1px 0;color:${c};font:700 12px Arial,sans-serif">A</td><td style="padding:1px 0;font:13px Arial,sans-serif;color:#333333">${addr}</td></tr>` : ''}</table>`;
    const soc = socials(c);
    const img = photo ? `<img src="${esc(href(photo))}" width="84" height="84" alt="${name}" style="display:block;width:84px;height:84px;border-radius:42px;object-fit:cover">` : '';
    const logoImg = logo ? `<img src="${esc(href(logo))}" height="28" alt="${esc(v('company'))}" style="display:block;height:28px;margin-top:10px">` : '';
    const disclaimer = v('disclaimer') ? `<p style="margin:12px 0 0;max-width:520px;color:#8a8a8a;font:11px/1.4 Arial,sans-serif">${esc(v('disclaimer'))}</p>` : '';
    if (layout.value === 'compact') {
      return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,sans-serif"><tr><td style="padding:0 0 4px"><span style="font:700 15px Arial,sans-serif;color:#111111">${name}</span>${title ? `<span style="font:13px Arial,sans-serif;color:#666666"> &nbsp;|&nbsp; ${title}</span>` : ''}</td></tr><tr><td style="font:12px Arial,sans-serif;color:#333333">${[phone && `<a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" style="color:#333333;text-decoration:none">${esc(phone)}</a>`, email && `<a href="mailto:${esc(email)}" style="color:${c};text-decoration:none">${esc(email)}</a>`, site && `<a href="${esc(href(site))}" style="color:${c};text-decoration:none">${esc(site.replace(/^https?:\/\//, ''))}</a>`].filter(Boolean).join(' &nbsp;·&nbsp; ')}</td></tr>${soc ? `<tr><td style="padding-top:8px">${soc}</td></tr>` : ''}</table>${disclaimer}`;
    }
    if (layout.value === 'stacked') {
      return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,sans-serif"><tr><td style="padding-bottom:10px">${img}</td></tr><tr><td style="border-top:3px solid ${c};padding-top:10px"><div style="font:700 17px Arial,sans-serif;color:#111111">${name}</div>${title ? `<div style="font:13px Arial,sans-serif;color:#666666;margin:2px 0 8px">${title}</div>` : ''}${details}${soc ? `<div style="margin-top:10px">${soc}</div>` : ''}${logoImg}</td></tr></table>${disclaimer}`;
    }
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,sans-serif"><tr>${img ? `<td style="padding-right:16px;vertical-align:top">${img}</td>` : ''}<td style="border-left:3px solid ${c};padding-left:16px;vertical-align:top"><div style="font:700 17px Arial,sans-serif;color:#111111">${name}</div>${title ? `<div style="font:13px Arial,sans-serif;color:#666666;margin:2px 0 8px">${title}</div>` : ''}${details}${soc ? `<div style="margin-top:10px">${soc}</div>` : ''}${logoImg}</td></tr></table>${disclaimer}`;
  }

  function render() {
    const out = html();
    el.preview.innerHTML = out;
    el.code.textContent = out;
    const named = !!v('name');
    const warn = [];
    if ([v('photo'), v('logo')].some((u) => u && !/^https?:\/\//i.test(href(u)))) warn.push('Image links must be full web addresses.');
    el.status.hidden = !warn.length;
    el.status.querySelector('span').textContent = warn.join(' ');
    tracker.set(!named ? 1 : 3);
  }

  el.copyRich.addEventListener('click', async () => {
    const out = html();
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([out], { type: 'text/html' }), 'text/plain': new Blob([el.preview.innerText], { type: 'text/plain' }) })]);
      toast('Signature copied — paste it into your email settings');
    } catch (e) {
      const r = document.createRange();
      r.selectNodeContents(el.preview);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      const ok = document.execCommand('copy');
      s.removeAllRanges();
      toast(ok ? 'Signature copied — paste it into your email settings' : 'Couldn’t copy — use “Copy HTML” instead', ok ? 'ok' : 'err');
    }
    tracker.set(4);
  });
  el.copyHtml.addEventListener('click', () => copy(el.code.textContent, 'HTML copied'));
  el.color.addEventListener('input', () => { el.colorText.value = el.color.value; render(); });
  el.colorText.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(el.colorText.value.trim())) el.color.value = el.colorText.value.trim(); else el.colorText.value = el.color.value; render(); });
  el.example.addEventListener('click', () => {
    const ex = { name: 'Sara Al Balushi', title: 'Marketing Manager', company: 'Example Trading LLC', phone: '+968 9123 4567', email: 'sara@example.com', website: 'example.com', address: 'Al Khuwair, Muscat, Oman', linkedin: 'linkedin.com/in/example', instagram: 'instagram.com/example', whatsapp: '+968 9123 4567' };
    Object.entries(ex).forEach(([k, val]) => { const i = $(`#es-${k}`); if (i) i.value = val; });
    render();
  });
  $$('#esForm input, #esForm textarea').forEach((i) => i.addEventListener('input', render));
  render();
})();
