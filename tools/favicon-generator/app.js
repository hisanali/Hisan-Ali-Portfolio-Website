(function () {
  'use strict';
  const { $, toast, download, copy, dropzone, segmented, jszip, decodeImage, canvasToBlob } = window.TK;

  const OUTPUTS = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180, opaque: true },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  const state = { image: null, imageName: '', timer: 0 };
  const el = {
    imagePane: $('#fgImagePane'), textPane: $('#fgTextPane'), drop: $('#fgDrop'), srcInfo: $('#fgSrcInfo'), srcName: $('#fgSrcName'), srcChange: $('#fgSrcChange'),
    text: $('#fgText'), fg: $('#fgFg'), fgText: $('#fgFgText'), font: $('#fgFont'),
    bgField: $('#fgBgField'), bg: $('#fgBg'), bgText: $('#fgBgText'), pad: $('#fgPad'), padOut: $('#fgPadOut'),
    appName: $('#fgAppName'), theme: $('#fgTheme'), themeText: $('#fgThemeText'),
    previews: $('#fgPreviews'), tabIcon: $('#fgTabIcon'), tabTitle: $('#fgTabTitle'), homeIcon: $('#fgHomeIcon'), homeLabel: $('#fgHomeLabel'),
    zip: $('#fgZip'), code: $('#fgCode'), copyCode: $('#fgCopy'), warn: $('#fgWarn')
  };

  const source = segmented($('#fgSource'), () => { el.imagePane.hidden = source.value !== 'image'; el.textPane.hidden = source.value !== 'text'; schedule(); });
  const bgMode = segmented($('#fgBgMode'), () => { el.bgField.hidden = bgMode.value === 'none'; schedule(); });
  const shape = segmented($('#fgShape'), schedule);
  el.textPane.hidden = true;
  el.bgField.hidden = bgMode.value === 'none';

  function pairColor(picker, text) {
    picker.addEventListener('input', () => { text.value = picker.value; schedule(); });
    text.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(text.value.trim())) { picker.value = text.value.trim(); schedule(); } else text.value = picker.value; });
  }
  pairColor(el.fg, el.fgText); pairColor(el.bg, el.bgText); pairColor(el.theme, el.themeText);
  [el.text, el.font, el.appName].forEach((i) => i.addEventListener('input', schedule));
  el.pad.addEventListener('input', () => { el.padOut.textContent = `${el.pad.value}%`; schedule(); });

  dropzone(el.drop, {
    accept: (f) => f.type.startsWith('image/') || /\.svg$/i.test(f.name),
    onFiles: async (files) => {
      try {
        const d = await decodeImage(files[0]);
        if (state.image) state.image.close();
        state.image = d;
        state.imageName = files[0].name;
        el.drop.hidden = true;
        el.srcInfo.hidden = false;
        el.srcName.textContent = `${files[0].name} · ${d.width}×${d.height}`;
        el.warn.hidden = Math.min(d.width, d.height) >= 256 && Math.abs(d.width - d.height) / Math.max(d.width, d.height) < 0.02;
        el.warn.querySelector('span:last-child').textContent = Math.min(d.width, d.height) < 256
          ? 'This image is small — icons may look soft at 192 and 512 px. A 512 px or larger square image (or SVG) works best.'
          : 'This image isn’t square, so it will be centred with space around it.';
        schedule();
      } catch (e) { toast(e.message, 'err'); }
    },
    paste: true,
    rejectMessage: () => 'Please choose an image file.'
  });
  el.srcChange.addEventListener('click', () => { el.drop.hidden = false; el.srcInfo.hidden = true; el.drop.focus(); });

  function hasSource() { return source.value === 'text' ? el.text.value.trim().length > 0 : !!state.image; }

  /** Draws the icon at `size` px. `opaque` forces a background (Apple ignores transparency). */
  function draw(size, opaque) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const s = shape.value;
    const radius = s === 'circle' ? size / 2 : s === 'rounded' ? size * 0.22 : 0;
    const bg = bgMode.value === 'none' ? (opaque ? '#ffffff' : null) : el.bg.value;
    ctx.save();
    if (radius && !(opaque && bgMode.value === 'none')) {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(0, 0, size, size, radius) : ctx.rect(0, 0, size, size);
      ctx.clip();
    }
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
    const pad = size * (el.pad.value / 100);
    const box = size - pad * 2;
    if (source.value === 'text') {
      const txt = el.text.value.trim().slice(0, 3);
      const family = el.font.value;
      let fs = box;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = el.fg.value;
      const setFont = (px) => { ctx.font = `${family.match(/^\d+/)?.[0] || 700} ${px}px ${family.replace(/^\d+\s*/, '')}`; };
      setFont(fs);
      let m = ctx.measureText(txt);
      const fit = () => {
        const w = m.width;
        const h = (m.actualBoundingBoxAscent || fs * 0.72) + (m.actualBoundingBoxDescent || 0);
        return Math.min(box / w, box / h);
      };
      fs *= fit();
      setFont(fs);
      m = ctx.measureText(txt);
      const asc = m.actualBoundingBoxAscent || fs * 0.72;
      const desc = m.actualBoundingBoxDescent || 0;
      ctx.fillText(txt, size / 2, size / 2 + (asc - desc) / 2);
    } else if (state.image) {
      const { source: img, width: w, height: h } = state.image;
      const k = Math.min(box / w, box / h);
      ctx.imageSmoothingQuality = 'high';
      // Downscale in steps for crisp small icons.
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

  function schedule() { clearTimeout(state.timer); state.timer = setTimeout(renderPreview, 60); }

  function renderPreview() {
    const ready = hasSource();
    el.zip.disabled = !ready;
    if (!ready) {
      el.previews.innerHTML = '<p class="tk-empty" style="grid-column:1/-1">Add an image or type a letter to see your icons.</p>';
      el.tabIcon.removeAttribute('src'); el.homeIcon.removeAttribute('src');
    } else {
      el.previews.innerHTML = '';
      [16, 32, 48, 180, 192].forEach((sz) => {
        const cv = draw(sz, sz === 180);
        const url = cv.toDataURL('image/png');
        const shown = Math.min(sz, 96);
        el.previews.insertAdjacentHTML('beforeend', `<figure class="fg-prev" style="margin:0"><div class="fg-prev-box"><img src="${url}" width="${shown}" height="${shown}" alt="${sz}px icon" style="${sz < 64 ? 'image-rendering:pixelated;' : ''}"></div><figcaption>${sz}×${sz}</figcaption></figure>`);
      });
      el.tabIcon.src = draw(32).toDataURL('image/png');
      el.homeIcon.src = draw(180, true).toDataURL('image/png');
    }
    const name = el.appName.value.trim() || 'My Website';
    el.tabTitle.textContent = name;
    el.homeLabel.textContent = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    el.code.textContent = snippet();
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

  /** Builds a multi-resolution .ico with PNG-compressed entries (supported by every modern browser and Windows Vista+). */
  function buildIco(pngs) {
    const header = 6 + 16 * pngs.length;
    const total = header + pngs.reduce((s, p) => s + p.bytes.byteLength, 0);
    const buf = new ArrayBuffer(total);
    const dv = new DataView(buf);
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, pngs.length, true);
    let offset = header;
    pngs.forEach((p, i) => {
      const o = 6 + i * 16;
      dv.setUint8(o, p.size >= 256 ? 0 : p.size);
      dv.setUint8(o + 1, p.size >= 256 ? 0 : p.size);
      dv.setUint8(o + 2, 0); dv.setUint8(o + 3, 0);
      dv.setUint16(o + 4, 1, true); dv.setUint16(o + 6, 32, true);
      dv.setUint32(o + 8, p.bytes.byteLength, true);
      dv.setUint32(o + 12, offset, true);
      new Uint8Array(buf, offset, p.bytes.byteLength).set(new Uint8Array(p.bytes));
      offset += p.bytes.byteLength;
    });
    return new Blob([buf], { type: 'image/x-icon' });
  }

  el.zip.addEventListener('click', async () => {
    if (!hasSource()) return;
    el.zip.disabled = true;
    try {
      const JSZip = await jszip();
      const zip = new JSZip();
      const icoParts = [];
      for (const o of OUTPUTS) {
        const blob = await canvasToBlob(draw(o.size, o.opaque), 'image/png');
        zip.file(o.name, blob);
        if (o.size <= 48) icoParts.push({ size: o.size, bytes: await blob.arrayBuffer() });
      }
      zip.file('favicon.ico', buildIco(icoParts));
      zip.file('site.webmanifest', manifest());
      zip.file('favicon-snippet.html', `${snippet()}\n`);
      zip.file('README.txt', 'Upload every file to the root of your website, then paste favicon-snippet.html into the <head> of your pages.\n');
      download(await zip.generateAsync({ type: 'blob' }), 'favicon-package.zip');
      toast('Favicon package downloaded');
    } catch (e) { toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  $('#fgIco').addEventListener('click', async () => {
    if (!hasSource()) return toast('Add an image or text first', 'err');
    const parts = [];
    for (const s of [16, 32, 48]) parts.push({ size: s, bytes: await (await canvasToBlob(draw(s), 'image/png')).arrayBuffer() });
    download(buildIco(parts), 'favicon.ico');
  });
  el.copyCode.addEventListener('click', () => copy(el.code.textContent));
  renderPreview();
  if (document.fonts) document.fonts.ready.then(schedule);
})();
