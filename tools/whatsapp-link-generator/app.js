(function () {
  'use strict';
  const { $, $$, esc, copy, download, segmented, steps, loadScript, toast } = window.TK;

  const TEMPLATES = {
    enquiry: 'Hi! I found you online and I’d like to know more about your services.',
    price: 'Hello, could you share your prices and availability?',
    booking: 'Hi, I’d like to book an appointment. What times are available this week?',
    order: 'Hello, I’d like to place an order.',
    support: 'Hi, I need help with my recent order.'
  };
  const el = {
    cc: $('#waCc'), phone: $('#waPhone'), msg: $('#waMsg'), label: $('#waLabel'), color: $('#waColor'), colorText: $('#waColorText'),
    link: $('#waLink'), copyLink: $('#waCopyLink'), open: $('#waOpen'), msgCount: $('#waMsgCount'), phoneHelp: $('#waPhoneHelp'),
    preview: $('#waPreview'), code: $('#waCode'), copyCode: $('#waCopyCode'), qr: $('#waQr'), qrPng: $('#waQrPng'), status: $('#waStatus')
  };
  const tracker = steps($('#tkSteps'));
  const style = segmented($('#waStyle'), render);
  let qr = null;
  let timer = 0;

  const digits = () => {
    let n = el.phone.value.replace(/[^\d]/g, '');
    const cc = el.cc.value.replace(/[^\d]/g, '');
    if (n.startsWith('00')) n = n.slice(2);
    else if (cc && n.startsWith(cc) && n.length > 9) { /* already includes country code */ } else n = cc + n.replace(/^0+/, '');
    return n;
  };

  function link() {
    const n = digits();
    if (n.length < 8) return '';
    const m = el.msg.value.trim();
    return `https://wa.me/${n}${m ? `?text=${encodeURIComponent(m)}` : ''}`;
  }

  function snippet(url) {
    const label = esc(el.label.value.trim() || 'Chat on WhatsApp');
    const c = el.color.value;
    const svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.2 1.2Z"/></svg>';
    if (style.value === 'float') {
      return `<a href="${url}" target="_blank" rel="noopener" aria-label="${label}" style="position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:50%;background:${c};color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);text-decoration:none">${svg.replace('width="20" height="20"', 'width="30" height="30"')}</a>`;
    }
    if (style.value === 'outline') {
      return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border:2px solid ${c};border-radius:999px;color:${c};font:600 15px/1 system-ui,sans-serif;text-decoration:none">${svg}${label}</a>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:999px;background:${c};color:#fff;font:600 15px/1 system-ui,sans-serif;text-decoration:none">${svg}${label}</a>`;
  }

  function render() {
    const url = link();
    const n = digits();
    el.msgCount.textContent = `${el.msg.value.length} characters`;
    el.phoneHelp.textContent = n.length >= 8 ? `Number used: +${n}` : 'Enter the number without the leading 0.';
    el.phoneHelp.classList.toggle('is-err', !!el.phone.value && n.length < 8);
    [el.copyLink, el.open, el.copyCode, el.qrPng].forEach((b) => { b.disabled = !url; });
    el.link.textContent = url || 'Your WhatsApp link appears here.';
    el.link.classList.toggle('is-placeholder', !url);
    el.code.textContent = url ? snippet(url) : '';
    el.preview.innerHTML = url ? `<div class="wa-site"><i></i><i></i><i></i>${snippet('#').replace('href="#"', 'href="#" onclick="return false"')}</div>` : '<p class="tk-empty">Your button preview appears here.</p>';
    el.preview.classList.toggle('is-float', style.value === 'float');
    tracker.set(!url ? 1 : el.msg.value.trim() ? 3 : 2);
    clearTimeout(timer);
    timer = setTimeout(() => renderQr(url), 120);
  }

  async function renderQr(url) {
    if (!url) { el.qr.innerHTML = ''; el.qr.classList.add('is-empty'); return; }
    try {
      await loadScript('qrstyling');
      const opts = { width: 220, height: 220, type: 'canvas', data: url, margin: 6, qrOptions: { errorCorrectionLevel: 'M' }, dotsOptions: { type: 'rounded', color: '#14251f' }, cornersSquareOptions: { type: 'extra-rounded', color: '#128c4b' }, backgroundOptions: { color: '#ffffff' } };
      if (!qr) { qr = new window.QRCodeStyling(opts); el.qr.innerHTML = ''; qr.append(el.qr); } else qr.update(opts);
      el.qr.classList.remove('is-empty');
    } catch (e) { el.qr.innerHTML = `<p class="tk-help">${esc(e.message)}</p>`; }
  }

  $$('[data-template]').forEach((b) => b.addEventListener('click', () => { el.msg.value = TEMPLATES[b.dataset.template]; $$('[data-template]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render(); el.msg.focus(); }));
  el.copyLink.addEventListener('click', () => { const u = link(); if (u) copy(u, 'WhatsApp link copied'); });
  el.open.addEventListener('click', () => { const u = link(); if (u) window.open(u, '_blank', 'noopener'); });
  el.copyCode.addEventListener('click', () => copy(el.code.textContent, 'Button code copied'));
  el.qrPng.addEventListener('click', async () => {
    const u = link();
    if (!u) return;
    try {
      await loadScript('qrstyling');
      const big = new window.QRCodeStyling({ width: 1024, height: 1024, type: 'canvas', data: u, margin: 30, dotsOptions: { type: 'rounded', color: '#14251f' }, cornersSquareOptions: { type: 'extra-rounded', color: '#128c4b' }, backgroundOptions: { color: '#ffffff' } });
      download(await big.getRawData('png'), 'whatsapp-qr.png');
      toast('QR code downloaded');
    } catch (e) { toast(e.message, 'err'); }
  });
  el.color.addEventListener('input', () => { el.colorText.value = el.color.value; render(); });
  el.colorText.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(el.colorText.value.trim())) el.color.value = el.colorText.value.trim(); else el.colorText.value = el.color.value; render(); });
  [el.cc, el.phone, el.msg, el.label].forEach((i) => i.addEventListener('input', render));
  render();
})();
