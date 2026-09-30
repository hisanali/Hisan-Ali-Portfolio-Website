(function () {
  'use strict';
  const { $, toast, download, copy, dropzone, segmented, steps, dock, jszip, decodeImage, canvasToBlob, sampleLogo, loadScript } = window.TK;

  const OUTPUTS = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180, opaque: true },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];
  const PREVIEWS = [[16, 32], [32, 48], [48, 64], [180, 84], [192, 84]];

  const state = { image: null, timer: 0, downloaded: false };
  const el = {
    imagePane: $('#fgImagePane'), textPane: $('#fgTextPane'), drop: $('#fgDrop'), srcInfo: $('#fgSrcInfo'), srcName: $('#fgSrcName'), srcChange: $('#fgSrcChange'), warn: $('#fgWarn'),
    text: $('#fgText'), fg: $('#fgFg'), fgText: $('#fgFgText'), font: $('#fgFont'),
    bgField: $('#fgBgField'), bg: $('#fgBg'), bgText: $('#fgBgText'), pad: $('#fgPad'), padOut: $('#fgPadOut'),
    appName: $('#fgAppName'), theme: $('#fgTheme'), themeText: $('#fgThemeText'),
    previews: $('#fgPreviews'), tabIcon: $('#fgTabIcon'), tabTitle: $('#fgTabTitle'), tabUrl: $('#fgTabUrl'), homeIcon: $('#fgHomeIcon'), homeLabel: $('#fgHomeLabel'),
    zip: $('#fgZip'), ico: $('#fgIco'), code: $('#fgCode'), copyCode: $('#fgCopy')
  };
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.zip, () => 'Complete favicon set');

  const source = segmented($('#fgSource'), () => { el.imagePane.hidden = source.value !== 'image'; el.textPane.hidden = source.value !== 'text'; schedule(); });
  const bgMode = segmented($('#fgBgMode'), () => { el.bgField.hidden = bgMode.value === 'none'; schedule(); });
  const shape = segmented($('#fgShape'), schedule);
  el.textPane.hidden = true;
  el.bgField.hidden = bgMode.value === 'none';

  function pairColor(picker, text) {
    picker.addEventListener('input', () => { text.value = picker.value; schedule(); });
    text.addEventListener('change', () => { const v = text.value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) { picker.value = v; schedule(); } else text.value = picker.value; });
  }
  pairColor(el.fg, el.fgText); pairColor(el.bg, el.bgText); pairColor(el.theme, el.themeText);
  [el.text, el.font, el.appName].forEach((i) => i.addEventListener('input', schedule));
  el.pad.addEventListener('input', () => { el.padOut.textContent = `${el.pad.value}%`; schedule(); });

  async function useImage(file) {
    try {
      const d = await decodeImage(file);
      if (state.image) state.image.close();
      state.image = d;
      el.drop.hidden = true;
      el.srcInfo.hidden = false;
      el.srcName.textContent = `${file.name} · ${d.width}×${d.height}`;
      const small = Math.min(d.width, d.height) < 256;
      const notSquare = Math.abs(d.width - d.height) / Math.max(d.width, d.height) > 0.02;
      el.warn.hidden = !small && !notSquare;
      el.warn.querySelector('span').textContent = small
        ? 'This image is small, so the 192 and 512 px icons may look soft. A 512 px+ square image or an SVG works best.'
        : 'This image isn’t square, so it’s centred with space around it. A square logo fills the icon better.';
      schedule();
    } catch (e) { toast(e.message, 'err'); }
  }

  dropzone(el.drop, { accept: (f) => f.type.startsWith('image/') || /\.svg$/i.test(f.name), onFiles: (files) => { source.set('image'); useImage(files[0]); }, paste: true, veilLabel: 'Drop your logo', rejectMessage: () => 'Please choose an image file.' });
  $('[data-sample]').addEventListener('click', async () => { useImage(await sampleLogo()); });
  el.srcChange.addEventListener('click', () => { el.drop.hidden = false; el.srcInfo.hidden = true; el.warn.hidden = true; el.drop.focus(); });

  const hasSource = () => (source.value === 'text' ? el.text.value.trim().length > 0 : !!state.image);

  /** Draws the icon at `size` px. `opaque` forces a background (iOS shows transparency as black). */
  function draw(size, opaque) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const s = shape.value;
    const transparent = bgMode.value === 'none';
    const radius = s === 'circle' ? size / 2 : s === 'rounded' ? size * 0.22 : 0;
    const bg = transparent ? (opaque ? '#ffffff' : null) : el.bg.value;
    ctx.save();
    if (radius && !(opaque && transparent)) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, size, size, radius); else ctx.rect(0, 0, size, size);
      ctx.clip();
    }
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
    const pad = size * (el.pad.value / 100);
    const box = size - pad * 2;
    if (source.value === 'text') {
      const txt = Array.from(el.text.value.trim()).slice(0, 3).join('');
      const family = el.font.value;
      const weight = family.match(/^\d+/)?.[0] || 700;
      const face = family.replace(/^\d+\s*/, '');
      const setFont = (px) => { ctx.font = `${weight} ${px}px ${face}`; };
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = el.fg.value;
      let fs = box;
      setFont(fs);
      let m = ctx.measureText(txt);
      const h0 = (m.actualBoundingBoxAscent || fs * 0.72) + (m.actualBoundingBoxDescent || 0);
      fs *= Math.min(box / Math.max(1, m.width), box / Math.max(1, h0));
      setFont(fs);
      m = ctx.measureText(txt);
      const asc = m.actualBoundingBoxAscent || fs * 0.72;
      const desc = m.actualBoundingBoxDescent || 0;
      ctx.fillText(txt, size / 2, size / 2 + (asc - desc) / 2);
    } else if (state.image) {
      const { source: img, width: w, height: h } = state.image;
      const k = Math.min(box / w, box / h);
      ctx.imageSmoothingQuality = 'high';
      let src = img; let sw = w; let sh = h;
      while (sw / 2 > w * k) {
        const t = document.createElement('canvas');
        t.width = Math.max(1, Math.round(sw / 2)); t.height = Math.max(1, Math.round(sh / 2));
        const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(src, 0, 0, t.width, t.height);
        src = t; sw = t.width; sh = t.height;
      }
      ctx.drawImage(src, (size - w * k) / 2, (size - h * k) / 2, w * k, h * k);
    }
    ctx.restore();
    return c;
  }

  function schedule() { clearTimeout(state.timer); state.timer = setTimeout(renderPreview, 50); }

  function renderPreview() {
    const ready = hasSource();
    el.zip.disabled = el.ico.disabled = !ready;
    if (!ready) {
      el.previews.innerHTML = PREVIEWS.map(([sz]) => `<figure class="fg-prev"><div class="fg-prev-box"></div><figcaption>${sz}×${sz}</figcaption></figure>`).join('');
      el.tabIcon.removeAttribute('src'); el.homeIcon.removeAttribute('src');
    } else {
      el.previews.innerHTML = PREVIEWS.map(([sz, shown]) => `<figure class="fg-prev"><div class="fg-prev-box"><img src="${draw(sz, sz === 180).toDataURL('image/png')}" width="${shown}" height="${shown}" alt="${sz} pixel icon" style="${sz <= 48 ? 'image-rendering:pixelated;' : ''}"></div><figcaption>${sz}×${sz}</figcaption></figure>`).join('');
      el.tabIcon.src = draw(32).toDataURL('image/png');
      el.homeIcon.src = draw(180, true).toDataURL('image/png');
    }
    const name = el.appName.value.trim() || 'My Website';
    el.tabTitle.textContent = name;
    el.tabUrl.textContent = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example'}.com`;
    el.homeLabel.textContent = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    el.code.textContent = snippet();
    tracker.set(state.downloaded ? 4 : ready ? 2 : 1);
    mobile.refresh();
  }

  function manifest() {
    const name = el.appName.value.trim() || 'My Website';
    return JSON.stringify({
      name, short_name: name.slice(0, 12),
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
      ],
      theme_color: el.theme.value, background_color: el.theme.value, display: 'standalone'
    }, null, 2);
  }

  function snippet() {
    return [
      '<link rel="icon" href="/favicon.ico" sizes="48x48">',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
      '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
      `<meta name="theme-color" content="${el.theme.value}">`
    ].join('\n');
  }

  /** Multi-resolution .ico with PNG-compressed entries (supported by all modern browsers and Windows Vista+). */
  function buildIco(pngs) {
    const header = 6 + 16 * pngs.length;
    const buf = new ArrayBuffer(header + pngs.reduce((s, p) => s + p.bytes.byteLength, 0));
    const dv = new DataView(buf);
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, pngs.length, true);
    let offset = header;
    pngs.forEach((p, i) => {
      const o = 6 + i * 16;
      dv.setUint8(o, p.size >= 256 ? 0 : p.size);
      dv.setUint8(o + 1, p.size >= 256 ? 0 : p.size);
      dv.setUint16(o + 4, 1, true);
      dv.setUint16(o + 6, 32, true);
      dv.setUint32(o + 8, p.bytes.byteLength, true);
      dv.setUint32(o + 12, offset, true);
      new Uint8Array(buf, offset, p.bytes.byteLength).set(new Uint8Array(p.bytes));
      offset += p.bytes.byteLength;
    });
    return new Blob([buf], { type: 'image/x-icon' });
  }

  async function icoBlob() {
    const parts = [];
    for (const s of [16, 32, 48]) parts.push({ size: s, bytes: await (await canvasToBlob(draw(s), 'image/png')).arrayBuffer() });
    return buildIco(parts);
  }

  el.zip.addEventListener('click', async () => {
    if (!hasSource()) return;
    el.zip.disabled = true;
    try {
      const JSZip = await jszip();
      const zip = new JSZip();
      for (const o of OUTPUTS) zip.file(o.name, await canvasToBlob(draw(o.size, o.opaque), 'image/png'));
      zip.file('favicon.ico', await icoBlob());
      zip.file('site.webmanifest', manifest());
      zip.file('favicon-snippet.html', `${snippet()}\n`);
      zip.file('README.txt', 'Upload every file to the root folder of your website, then paste favicon-snippet.html into the <head> of your pages.\n');
      download(await zip.generateAsync({ type: 'blob' }), 'favicon-package.zip');
      state.downloaded = true;
      tracker.set(4);
      toast('Favicon package downloaded');
    } catch (e) { toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  el.ico.addEventListener('click', async () => {
    if (!hasSource()) return;
    download(await icoBlob(), 'favicon.ico');
  });
  el.copyCode.addEventListener('click', () => copy(el.code.textContent, 'HTML copied'));
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => { loadScript('jszip').catch(() => {}); });
  renderPreview();
  if (document.fonts) document.fonts.ready.then(schedule);
})();
