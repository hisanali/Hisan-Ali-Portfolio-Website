(function () {
  'use strict';
  const { $, esc, toast, download, segmented, loadScript } = window.TK;

  const TYPES = {
    url: { fields: [['url', 'Website URL', 'https://example.com', 'url']] },
    text: { fields: [['text', 'Text', 'Any text…', 'textarea']] },
    whatsapp: { fields: [['phone', 'WhatsApp number (with country code)', '+968 9611 0846', 'tel'], ['msg', 'Pre-filled message (optional)', 'Hi! I’d like to know more…', 'textarea']] },
    email: { fields: [['to', 'Email address', 'name@example.com', 'email'], ['subject', 'Subject (optional)', '', 'text'], ['body', 'Message (optional)', '', 'textarea']] },
    phone: { fields: [['phone', 'Phone number', '+968 9611 0846', 'tel']] },
    sms: { fields: [['phone', 'Phone number', '+968 9611 0846', 'tel'], ['msg', 'Message (optional)', '', 'textarea']] },
    wifi: { fields: [['ssid', 'Network name (SSID)', 'MyWiFi', 'text'], ['pass', 'Password', '', 'text'], ['enc', 'Security', 'WPA', 'select:WPA|WPA/WPA2/WPA3,WEP|WEP,nopass|None (open)'], ['hidden', 'Hidden network', '', 'check']] },
    vcard: { fields: [['first', 'First name', '', 'text'], ['last', 'Last name', '', 'text'], ['phone', 'Phone', '', 'tel'], ['email', 'Email', '', 'email'], ['org', 'Company', '', 'text'], ['title', 'Job title', '', 'text'], ['url', 'Website', '', 'url']] }
  };

  const el = {
    fields: $('#qrFields'), fg: $('#qrFg'), fgText: $('#qrFgText'), bg: $('#qrBg'), bgText: $('#qrBgText'), transparent: $('#qrTransparent'),
    logo: $('#qrLogo'), logoName: $('#qrLogoName'), logoClear: $('#qrLogoClear'), logoSize: $('#qrLogoSize'), logoSizeOut: $('#qrLogoSizeOut'), logoOpts: $('#qrLogoOpts'),
    margin: $('#qrMargin'), marginOut: $('#qrMarginOut'), canvasWrap: $('#qrCanvas'), payload: $('#qrPayload'), status: $('#qrStatus'),
    size: $('#qrSize'), png: $('#qrPng'), svg: $('#qrSvg'), jpg: $('#qrJpg'), copyImg: $('#qrCopyImg')
  };
  const values = {};
  let logoUrl = '';
  let qr = null;
  let timer = 0;

  const type = segmented($('#qrType'), () => { buildFields(); update(); });
  const dots = segmented($('#qrDots'), update);
  const corners = segmented($('#qrCorners'), update);
  const ecc = segmented($('#qrEcc'), update);

  function buildFields() {
    const t = type.value;
    values[t] = values[t] || {};
    el.fields.innerHTML = TYPES[t].fields.map(([key, label, ph, kind]) => {
      const id = `qrf-${key}`;
      const v = values[t][key] ?? (kind.startsWith('select:') ? kind.slice(7).split(',')[0].split('|')[0] : '');
      if (kind === 'textarea') return `<div class="tk-field"><label class="tk-label" for="${id}">${label}</label><textarea class="tk-textarea" id="${id}" data-k="${key}" rows="3" placeholder="${esc(ph)}" style="min-height:84px">${esc(v)}</textarea></div>`;
      if (kind === 'check') return `<div class="tk-field"><label class="tk-check"><input type="checkbox" id="${id}" data-k="${key}" ${v ? 'checked' : ''}> ${label}</label></div>`;
      if (kind.startsWith('select:')) {
        const opts = kind.slice(7).split(',').map((o) => o.split('|'));
        return `<div class="tk-field"><label class="tk-label" for="${id}">${label}</label><select class="tk-select" id="${id}" data-k="${key}">${opts.map(([val, txt]) => `<option value="${val}" ${val === v ? 'selected' : ''}>${txt}</option>`).join('')}</select></div>`;
      }
      return `<div class="tk-field"><label class="tk-label" for="${id}">${label}</label><input class="tk-input" id="${id}" data-k="${key}" type="${kind === 'url' ? 'url' : kind}" placeholder="${esc(ph)}" value="${esc(v)}" autocomplete="off" ${kind === 'tel' ? 'inputmode="tel"' : ''}></div>`;
    }).join('');
    if (type.value === 'wifi') el.fields.insertAdjacentHTML('beforeend', '<p class="tk-help">Phones that scan this join the network automatically — no typing needed.</p>');
  }

  el.fields.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    values[type.value][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    update();
  });
  el.fields.addEventListener('change', (e) => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') { values[type.value][e.target.dataset.k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; update(); } });

  const wifiEsc = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');
  const vEsc = (s) => String(s).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
  const digits = (s) => String(s || '').replace(/[^\d+]/g, '');

  /** Returns { data } or { error } for the current type. */
  function payload() {
    const v = values[type.value] || {};
    switch (type.value) {
      case 'url': {
        let u = (v.url || '').trim();
        if (!u) return { error: 'Enter a website address.' };
        if (!/^[a-z][a-z\d+.-]*:/i.test(u)) u = `https://${u}`;
        try { const p = new URL(u); if (!p.hostname.includes('.') && p.hostname !== 'localhost') throw 0; } catch (e) { return { error: 'That doesn’t look like a valid web address.' }; }
        return { data: u };
      }
      case 'text': return (v.text || '').trim() ? { data: v.text } : { error: 'Enter some text.' };
      case 'whatsapp': {
        const n = digits(v.phone).replace(/^\+/, '').replace(/^00/, '');
        if (n.length < 8) return { error: 'Enter the full number including country code, e.g. +968…' };
        return { data: `https://wa.me/${n}${v.msg ? `?text=${encodeURIComponent(v.msg)}` : ''}` };
      }
      case 'email': {
        const to = (v.to || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: 'Enter a valid email address.' };
        const q = [v.subject && `subject=${encodeURIComponent(v.subject)}`, v.body && `body=${encodeURIComponent(v.body)}`].filter(Boolean).join('&');
        return { data: `mailto:${to}${q ? `?${q}` : ''}` };
      }
      case 'phone': return digits(v.phone).length >= 5 ? { data: `tel:${digits(v.phone)}` } : { error: 'Enter a phone number.' };
      case 'sms': return digits(v.phone).length >= 5 ? { data: `SMSTO:${digits(v.phone)}:${v.msg || ''}` } : { error: 'Enter a phone number.' };
      case 'wifi': {
        if (!(v.ssid || '').trim()) return { error: 'Enter the network name.' };
        const enc = v.enc || 'WPA';
        if (enc !== 'nopass' && !v.pass) return { error: 'Enter the Wi-Fi password (or choose an open network).' };
        return { data: `WIFI:T:${enc};S:${wifiEsc(v.ssid)};${enc !== 'nopass' ? `P:${wifiEsc(v.pass)};` : ''}${v.hidden ? 'H:true;' : ''};` };
      }
      case 'vcard': {
        if (!(v.first || v.last || v.org)) return { error: 'Enter at least a name or company.' };
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vEsc(v.last || '')};${vEsc(v.first || '')};;;`, `FN:${vEsc([v.first, v.last].filter(Boolean).join(' ') || v.org)}`];
        if (v.org) lines.push(`ORG:${vEsc(v.org)}`);
        if (v.title) lines.push(`TITLE:${vEsc(v.title)}`);
        if (v.phone) lines.push(`TEL;TYPE=CELL:${digits(v.phone)}`);
        if (v.email) lines.push(`EMAIL:${v.email.trim()}`);
        if (v.url) lines.push(`URL:${v.url.trim()}`);
        lines.push('END:VCARD');
        return { data: lines.join('\n') };
      }
      default: return { error: 'Unknown type' };
    }
  }

  function luminance(hex) {
    const c = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function options(p, size) {
    return {
      width: size, height: size, type: 'canvas', data: p.data, margin: Number(el.margin.value) * size / 40,
      image: logoUrl || undefined,
      qrOptions: { errorCorrectionLevel: logoUrl && ecc.value !== 'H' ? 'Q' : ecc.value },
      imageOptions: { crossOrigin: 'anonymous', margin: Math.round(size / 100), imageSize: Number(el.logoSize.value) / 100, hideBackgroundDots: true },
      dotsOptions: { type: dots.value, color: el.fg.value },
      cornersSquareOptions: { type: corners.value === 'square' ? 'square' : corners.value === 'dot' ? 'dot' : 'extra-rounded', color: el.fg.value },
      cornersDotOptions: { type: corners.value === 'dot' ? 'dot' : 'square', color: el.fg.value },
      backgroundOptions: { color: el.transparent.checked ? 'transparent' : el.bg.value }
    };
  }

  function update() {
    clearTimeout(timer);
    timer = setTimeout(render, 80);
  }

  async function render() {
    const p = payload();
    const buttons = [el.png, el.svg, el.jpg, el.copyImg];
    buttons.forEach((b) => { b.disabled = !!p.error; });
    el.payload.textContent = p.error ? '' : p.data;
    // Contrast: scanners need dark modules on a light background.
    const fgL = luminance(el.fg.value);
    const bgL = el.transparent.checked ? 1 : luminance(el.bg.value);
    const ratio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
    let status = '';
    let cls = 'is-ok';
    if (p.error) { status = p.error; cls = ''; } else if (fgL > bgL) { status = 'Light code on a dark background — many scanners can’t read inverted QR codes.'; cls = 'is-warn'; } else if (ratio < 3.5) { status = 'Low contrast between code and background — it may not scan reliably.'; cls = 'is-warn'; } else if (p.data.length > 900) { status = `Long content (${p.data.length} characters) makes a dense code. Keep it short, or print it large.`; cls = 'is-warn'; } else { status = 'Ready to scan. Test it with your phone camera before printing.'; }
    el.status.className = `tk-note ${cls}`;
    el.status.innerHTML = `<span class="fas ${cls === 'is-ok' ? 'fa-circle-check' : cls === 'is-warn' ? 'fa-triangle-exclamation' : 'fa-circle-info'}" aria-hidden="true"></span><span>${esc(status)}</span>`;
    el.canvasWrap.classList.toggle('is-empty', !!p.error);
    if (p.error) return;
    try {
      await loadScript('qrstyling');
      const opts = options(p, 360);
      if (!qr) { qr = new window.QRCodeStyling(opts); el.canvasWrap.innerHTML = ''; qr.append(el.canvasWrap); } else qr.update(opts);
    } catch (e) {
      el.status.className = 'tk-note is-err';
      el.status.innerHTML = `<span class="fas fa-circle-exclamation" aria-hidden="true"></span><span>${esc(e.message)}</span>`;
    }
  }

  function exporter(ext) {
    return async () => {
      const p = payload();
      if (p.error) return;
      const size = Number(el.size.value);
      const opts = options(p, size);
      if (ext === 'svg') opts.type = 'svg';
      if (ext === 'jpeg' && el.transparent.checked) opts.backgroundOptions.color = '#ffffff';
      const q = new window.QRCodeStyling(opts);
      const blob = await q.getRawData(ext);
      download(blob, `qr-code-${type.value}.${ext === 'jpeg' ? 'jpg' : ext}`);
    };
  }
  el.png.addEventListener('click', exporter('png'));
  el.jpg.addEventListener('click', exporter('jpeg'));
  el.svg.addEventListener('click', exporter('svg'));
  el.copyImg.addEventListener('click', async () => {
    try {
      const p = payload();
      const blob = await new window.QRCodeStyling(options(p, 1024)).getRawData('png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('QR image copied');
    } catch (e) { toast('Your browser can’t copy images — use Download instead.', 'err'); }
  });

  function pair(picker, text) {
    picker.addEventListener('input', () => { text.value = picker.value; update(); });
    text.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(text.value.trim())) { picker.value = text.value.trim(); update(); } else text.value = picker.value; });
  }
  pair(el.fg, el.fgText); pair(el.bg, el.bgText);
  el.transparent.addEventListener('change', () => { el.bg.disabled = el.bgText.disabled = el.transparent.checked; update(); });
  el.margin.addEventListener('input', () => { el.marginOut.textContent = el.margin.value; update(); });
  el.logoSize.addEventListener('input', () => { el.logoSizeOut.textContent = `${el.logoSize.value}%`; update(); });
  $('#qrSwap').addEventListener('click', () => { const f = el.fg.value; el.fg.value = el.fgText.value = el.bg.value; el.bg.value = el.bgText.value = f; update(); });

  el.logo.addEventListener('change', () => {
    const f = el.logo.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Choose an image for the logo', 'err'); return; }
    const r = new FileReader();
    r.onload = () => { logoUrl = r.result; el.logoName.textContent = f.name; el.logoOpts.hidden = false; update(); };
    r.readAsDataURL(f);
    el.logo.value = '';
  });
  el.logoClear.addEventListener('click', () => { logoUrl = ''; el.logoOpts.hidden = true; update(); });

  // Deep-link support: /tools/qr-code-generator/?url=https://…
  const params = new URLSearchParams(location.search);
  if (params.get('url')) { values.url = { url: params.get('url') }; }
  buildFields();
  if (!values.url || !values.url.url) { values.url = { url: 'https://hisanali.com' }; buildFields(); }
  render();
})();
