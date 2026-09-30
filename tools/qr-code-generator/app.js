(function () {
  'use strict';
  const { $, icon, esc, toast, download, segmented, steps, dock, loadScript } = window.TK;

  const TYPES = {
    url: { fields: [['url', 'Website address', 'https://example.com', 'url']] },
    text: { fields: [['text', 'Your text', 'Any message, code or note…', 'textarea']] },
    whatsapp: { fields: [['phone', 'WhatsApp number (with country code)', '+968 9611 0846', 'tel'], ['msg', 'Pre-filled message', 'Hi! I’d like to know more about…', 'textarea', true]] },
    email: { fields: [['to', 'Email address', 'name@example.com', 'email'], ['subject', 'Subject', 'Quick question', 'text', true], ['body', 'Message', '', 'textarea', true]] },
    phone: { fields: [['phone', 'Phone number', '+968 9611 0846', 'tel']] },
    sms: { fields: [['phone', 'Phone number', '+968 9611 0846', 'tel'], ['msg', 'Message', '', 'textarea', true]] },
    wifi: { fields: [['ssid', 'Network name (SSID)', 'MyHomeWiFi', 'text'], ['pass', 'Password', '', 'text'], ['enc', 'Security', 'WPA', 'select:WPA|WPA / WPA2 / WPA3,WEP|WEP (older routers),nopass|None — open network'], ['hidden', 'Hidden network', '', 'check']] },
    vcard: { fields: [['first', 'First name', '', 'text'], ['last', 'Last name', '', 'text'], ['phone', 'Phone', '', 'tel'], ['email', 'Email', '', 'email'], ['org', 'Company', '', 'text', true], ['title', 'Job title', '', 'text', true], ['url', 'Website', '', 'url', true]] }
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
  let downloaded = false;
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.png, () => 'Your QR code is ready');

  const type = segmented($('#qrType'), () => { buildFields(); update(); const first = el.fields.querySelector('input, textarea'); if (first) first.focus(); });
  const dots = segmented($('#qrDots'), update);
  const corners = segmented($('#qrCorners'), update);
  const ecc = segmented($('#qrEcc'), update);

  function buildFields() {
    const t = type.value;
    values[t] = values[t] || {};
    el.fields.innerHTML = TYPES[t].fields.map(([key, label, ph, kind, optional]) => {
      const id = `qrf-${key}`;
      const v = values[t][key] ?? (kind.startsWith('select:') ? kind.slice(7).split(',')[0].split('|')[0] : '');
      const lab = `<label class="tk-label" for="${id}">${label}${optional ? '<span class="tk-val">optional</span>' : ''}</label>`;
      if (kind === 'textarea') return `<div class="tk-field">${lab}<textarea class="tk-textarea" id="${id}" data-k="${key}" rows="3" placeholder="${esc(ph)}" style="min-height:88px">${esc(v)}</textarea></div>`;
      if (kind === 'check') return `<div class="tk-field"><label class="tk-switch">${label}<input type="checkbox" id="${id}" data-k="${key}" ${v ? 'checked' : ''}></label></div>`;
      if (kind.startsWith('select:')) {
        const opts = kind.slice(7).split(',').map((o) => o.split('|'));
        return `<div class="tk-field">${lab}<select class="tk-select" id="${id}" data-k="${key}">${opts.map(([val, txt]) => `<option value="${val}" ${val === v ? 'selected' : ''}>${txt}</option>`).join('')}</select></div>`;
      }
      return `<div class="tk-field">${lab}<input class="tk-input" id="${id}" data-k="${key}" type="${kind === 'url' ? 'url' : kind}" placeholder="${esc(ph)}" value="${esc(v)}" autocomplete="off" spellcheck="false"${kind === 'tel' ? ' inputmode="tel"' : ''}></div>`;
    }).join('');
    if (t === 'wifi') el.fields.insertAdjacentHTML('beforeend', `<p class="tk-help" style="margin-top:12px">${icon('info')} Guests scan to join your Wi-Fi — no typing passwords.</p>`);
    if (t === 'vcard') el.fields.insertAdjacentHTML('beforeend', `<p class="tk-help" style="margin-top:12px">${icon('info')} Scanning saves you straight into their phone’s contacts.</p>`);
  }

  const save = (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    values[type.value][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    update();
  };
  el.fields.addEventListener('input', save);
  el.fields.addEventListener('change', save);

  const wifiEsc = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');
  const vEsc = (s) => String(s).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
  const digits = (s) => String(s || '').replace(/[^\d+]/g, '');

  /** Returns { data } or { error } for the current type. */
  function payload() {
    const v = values[type.value] || {};
    switch (type.value) {
      case 'url': {
        let u = (v.url || '').trim();
        if (!u) return { error: 'Enter the web address the code should open.' };
        if (!/^[a-z][a-z\d+.-]*:/i.test(u)) u = `https://${u}`;
        try { const p = new URL(u); if (!p.hostname.includes('.') && p.hostname !== 'localhost') throw 0; } catch (e) { return { error: 'That doesn’t look like a web address yet — e.g. example.com' }; }
        return { data: u };
      }
      case 'text': return (v.text || '').trim() ? { data: v.text } : { error: 'Type the text you want to share.' };
      case 'whatsapp': {
        const n = digits(v.phone).replace(/^\+/, '').replace(/^00/, '');
        if (n.length < 8) return { error: 'Enter the full number with country code, e.g. +968…' };
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
        if (!(v.ssid || '').trim()) return { error: 'Enter your Wi-Fi network name.' };
        const enc = v.enc || 'WPA';
        if (enc !== 'nopass' && !v.pass) return { error: 'Enter the Wi-Fi password — or choose an open network.' };
        return { data: `WIFI:T:${enc};S:${wifiEsc(v.ssid)};${enc !== 'nopass' ? `P:${wifiEsc(v.pass)};` : ''}${v.hidden ? 'H:true;' : ''};` };
      }
      case 'vcard': {
        if (!(v.first || v.last || v.org)) return { error: 'Enter at least a name or a company.' };
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vEsc(v.last || '')};${vEsc(v.first || '')};;;`, `FN:${vEsc([v.first, v.last].filter(Boolean).join(' ') || v.org)}`];
        if (v.org) lines.push(`ORG:${vEsc(v.org)}`);
        if (v.title) lines.push(`TITLE:${vEsc(v.title)}`);
        if (v.phone) lines.push(`TEL;TYPE=CELL:${digits(v.phone)}`);
        if (v.email) lines.push(`EMAIL:${v.email.trim()}`);
        if (v.url) lines.push(`URL:${v.url.trim()}`);
        lines.push('END:VCARD');
        return { data: lines.join('\n') };
      }
      default: return { error: 'Choose what the code should do.' };
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

  function update() { clearTimeout(timer); timer = setTimeout(render, 70); }

  async function render() {
    const p = payload();
    [el.png, el.svg, el.jpg, el.copyImg].forEach((b) => { b.disabled = !!p.error; });
    el.payload.textContent = p.error ? '' : p.data;
    const fgL = luminance(el.fg.value);
    const bgL = el.transparent.checked ? 1 : luminance(el.bg.value);
    const ratio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
    let msg = 'Looks great — test it with your phone camera before printing.';
    let cls = 'is-ok';
    let ic = 'checkc';
    if (p.error) { msg = p.error; cls = ''; ic = 'info'; } else if (fgL > bgL) { msg = 'Light code on a dark background — many phone cameras can’t read inverted codes. Tap Swap to fix.'; cls = 'is-warn'; ic = 'alert'; } else if (ratio < 3.5) { msg = 'Low contrast between the code and background — it may not scan reliably.'; cls = 'is-warn'; ic = 'alert'; } else if (p.data.length > 900) { msg = `Long content (${p.data.length} characters) makes a dense code. Keep it short or print it large.`; cls = 'is-warn'; ic = 'alert'; }
    el.status.className = `tk-note ${cls}`;
    el.status.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`;
    el.canvasWrap.classList.toggle('is-empty', !!p.error);
    tracker.set(p.error ? 1 : downloaded ? 4 : 3);
    mobile.refresh();
    if (p.error) return;
    try {
      await loadScript('qrstyling');
      const opts = options(p, 340);
      if (!qr) { qr = new window.QRCodeStyling(opts); el.canvasWrap.innerHTML = ''; qr.append(el.canvasWrap); } else qr.update(opts);
    } catch (e) {
      el.status.className = 'tk-note is-err';
      el.status.innerHTML = `${icon('alert')}<span>${esc(e.message)}</span>`;
    }
  }

  function exporter(ext) {
    return async () => {
      const p = payload();
      if (p.error) return;
      try {
        await loadScript('qrstyling');
        const opts = options(p, Number(el.size.value));
        if (ext === 'svg') opts.type = 'svg';
        if (ext === 'jpeg' && el.transparent.checked) opts.backgroundOptions.color = '#ffffff';
        const blob = await new window.QRCodeStyling(opts).getRawData(ext);
        download(blob, `qr-code-${type.value}.${ext === 'jpeg' ? 'jpg' : ext}`);
        downloaded = true;
        tracker.set(4);
        toast(`QR code saved as ${ext === 'jpeg' ? 'JPG' : ext.toUpperCase()}`);
      } catch (e) { toast(e.message, 'err'); }
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
      toast('QR image copied — paste it anywhere');
    } catch (e) { toast('Your browser can’t copy images — use Download instead.', 'err'); }
  });

  function pair(picker, text) {
    picker.addEventListener('input', () => { text.value = picker.value; update(); });
    text.addEventListener('change', () => { const v = text.value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) { picker.value = v; update(); } else text.value = picker.value; });
  }
  pair(el.fg, el.fgText); pair(el.bg, el.bgText);
  el.transparent.addEventListener('change', () => { el.bg.disabled = el.bgText.disabled = el.transparent.checked; update(); });
  el.margin.addEventListener('input', () => { el.marginOut.textContent = el.margin.value; update(); });
  el.logoSize.addEventListener('input', () => { el.logoSizeOut.textContent = `${el.logoSize.value}%`; update(); });
  $('#qrSwap').addEventListener('click', () => { const f = el.fg.value; el.fg.value = el.fgText.value = el.bg.value; el.bg.value = el.bgText.value = f; update(); });

  el.logo.addEventListener('change', () => {
    const f = el.logo.files[0];
    el.logo.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Choose an image for the logo', 'err'); return; }
    const r = new FileReader();
    r.onload = () => { logoUrl = r.result; el.logoName.textContent = f.name; el.logoOpts.hidden = false; update(); };
    r.readAsDataURL(f);
  });
  el.logoClear.addEventListener('click', () => { logoUrl = ''; el.logoOpts.hidden = true; update(); });

  // Deep link: /tools/qr-code-generator/?url=https://…
  const deep = new URLSearchParams(location.search).get('url');
  values.url = { url: deep || 'https://hisanali.com' };
  buildFields();
  render();
})();
