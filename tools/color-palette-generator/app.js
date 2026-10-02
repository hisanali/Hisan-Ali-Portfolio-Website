(function () {
  'use strict';
  const { $, icon, copy, download, dropzone, steps, decodeImage, canvasToBlob, sampleImage, toast } = window.TK;

  const state = { img: null, colors: [], pixels: null, w: 0, h: 0 };
  const el = {
    drop: $('#cpDrop'), work: $('#cpWork'), canvas: $('#cpCanvas'), change: $('#cpChange'), count: $('#cpCount'), countOut: $('#cpCountOut'),
    swatches: $('#cpSwatches'), strip: $('#cpStrip'), code: $('#cpCode'), copyCode: $('#cpCopyCode'), png: $('#cpPng'), picked: $('#cpPicked')
  };
  const tracker = steps($('#tkSteps'));
  let format = 'css';

  const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  function hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    let h = 0; let s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const contrast = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const NAMES = ['primary', 'secondary', 'accent', 'neutral', 'highlight', 'muted', 'soft', 'deep', 'bright', 'extra'];

  dropzone(el.drop, { accept: (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name), onFiles: (f) => load(f[0]), paste: true, veilLabel: 'Drop your image', rejectMessage: () => 'Please choose an image.' });
  $('[data-sample]').addEventListener('click', async () => load(await sampleImage({ name: 'brand-photo.jpg', w: 1600, h: 1067, seed: 3 })));
  el.change.addEventListener('click', () => { el.work.hidden = true; el.drop.hidden = false; tracker.set(1); });

  async function load(file) {
    try {
      const d = await decodeImage(file);
      const k = Math.min(1, 900 / Math.max(d.width, d.height));
      const w = Math.round(d.width * k); const h = Math.round(d.height * k);
      el.canvas.width = w; el.canvas.height = h;
      const ctx = el.canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(d.source, 0, 0, w, h);
      d.close();
      state.pixels = ctx.getImageData(0, 0, w, h).data;
      state.w = w; state.h = h;
      el.drop.hidden = true;
      el.work.hidden = false;
      extract();
    } catch (e) { toast(e.message, 'err'); }
  }

  /** k-means++ on a pixel sample; returns colours sorted by how much of the image they cover. */
  function extract() {
    const k = Number(el.count.value);
    el.countOut.textContent = `${k} colours`;
    const px = state.pixels;
    const sample = [];
    const step = Math.max(1, Math.floor(px.length / 4 / 12000));
    for (let i = 0; i < px.length; i += 4 * step) if (px[i + 3] > 125) sample.push([px[i], px[i + 1], px[i + 2]]);
    if (!sample.length) return;
    const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const centres = [sample[Math.floor(rand() * sample.length)].slice()];
    while (centres.length < k) {
      const d = sample.map((p) => Math.min(...centres.map((c) => dist(p, c))));
      const total = d.reduce((s, v) => s + v, 0);
      let r = rand() * total; let idx = 0;
      while (r > d[idx] && idx < d.length - 1) { r -= d[idx]; idx++; }
      centres.push(sample[idx].slice());
    }
    const counts = new Array(k).fill(0);
    for (let iter = 0; iter < 12; iter++) {
      const sums = centres.map(() => [0, 0, 0]);
      counts.fill(0);
      sample.forEach((p) => {
        let best = 0; let bd = Infinity;
        centres.forEach((c, j) => { const dd = dist(p, c); if (dd < bd) { bd = dd; best = j; } });
        counts[best]++;
        sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2];
      });
      centres.forEach((c, j) => { if (counts[j]) for (let t = 0; t < 3; t++) c[t] = sums[j][t] / counts[j]; });
    }
    state.colors = centres.map((c, j) => ({ rgb: c.map((v) => Math.round(v)), share: counts[j] / sample.length })).filter((c) => c.share > 0).sort((a, b) => b.share - a.share);
    render();
  }

  function render() {
    const white = [255, 255, 255]; const black = [20, 37, 31];
    el.strip.innerHTML = state.colors.map((c) => `<i style="background:${hex(c.rgb)};flex:${Math.max(0.04, c.share)}"></i>`).join('');
    el.swatches.innerHTML = state.colors.map((c, i) => {
      const h = hex(c.rgb); const [hh, s, l] = hsl(c.rgb);
      const onWhite = contrast(c.rgb, white); const onDark = contrast(c.rgb, black);
      const textOn = onWhite > onDark ? '#fff' : '#14251f';
      return `<li class="cp-sw"><button type="button" class="cp-chip" data-copy="${h}" style="background:${h};color:${textOn}" aria-label="Copy ${h}"><b>${h}</b><span>${Math.round(c.share * 100)}%</span></button>
        <div class="cp-info"><button type="button" data-copy="rgb(${c.rgb.join(', ')})">rgb(${c.rgb.join(', ')})</button><button type="button" data-copy="hsl(${hh} ${s}% ${l}%)">hsl(${hh} ${s}% ${l}%)</button>
        <span class="cp-aa ${onWhite >= 4.5 ? 'ok' : ''}" title="Contrast as text on white">${onWhite.toFixed(1)}:1 on white</span><span class="cp-aa ${onDark >= 4.5 ? 'ok' : ''}" title="Contrast as text on dark">${onDark.toFixed(1)}:1 on dark</span></div><small>${NAMES[i] || `color-${i + 1}`}</small></li>`;
    }).join('');
    renderCode();
    tracker.set(3);
  }

  function renderCode() {
    const list = state.colors.map((c, i) => [NAMES[i] || `color-${i + 1}`, hex(c.rgb)]);
    if (format === 'css') el.code.textContent = `:root {\n${list.map(([n, h]) => `  --color-${n}: ${h};`).join('\n')}\n}`;
    if (format === 'tailwind') el.code.textContent = `// tailwind.config.js → theme.extend.colors\ncolors: {\n  brand: {\n${list.map(([n, h]) => `    ${n}: '${h}',`).join('\n')}\n  }\n}`;
    if (format === 'json') el.code.textContent = JSON.stringify(Object.fromEntries(list), null, 2);
    if (format === 'hex') el.code.textContent = list.map(([, h]) => h).join(', ');
  }

  document.querySelectorAll('#cpFormat button').forEach((b) => b.addEventListener('click', () => { format = b.dataset.value; document.querySelectorAll('#cpFormat button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderCode(); }));
  el.count.addEventListener('change', () => state.pixels && extract());
  el.count.addEventListener('input', () => { el.countOut.textContent = `${el.count.value} colours`; });
  el.swatches.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy, `${b.dataset.copy} copied`); });
  el.copyCode.addEventListener('click', () => copy(el.code.textContent, 'Palette code copied'));
  el.canvas.addEventListener('click', (e) => {
    const r = el.canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * state.w); const y = Math.floor(((e.clientY - r.top) / r.height) * state.h);
    const i = (y * state.w + x) * 4;
    const c = [state.pixels[i], state.pixels[i + 1], state.pixels[i + 2]];
    el.picked.hidden = false;
    el.picked.innerHTML = `<i style="background:${hex(c)}"></i><span><b>${hex(c)}</b> rgb(${c.join(', ')})</span><button class="tk-btn tk-btn-sm" type="button" data-pick="${hex(c)}">${icon('copy')}Copy</button>`;
  });
  el.picked.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) copy(b.dataset.pick, `${b.dataset.pick} copied`); });
  el.png.addEventListener('click', async () => {
    if (!state.colors.length) return;
    const W = 1200; const H = 520; const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#fffdf8'; x.fillRect(0, 0, W, H);
    const n = state.colors.length; const gap = 16; const sw = (W - 80 - gap * (n - 1)) / n;
    state.colors.forEach((col, i) => {
      const left = 40 + i * (sw + gap);
      x.fillStyle = hex(col.rgb);
      x.beginPath(); if (x.roundRect) x.roundRect(left, 40, sw, 340, 24); else x.rect(left, 40, sw, 340); x.fill();
      x.fillStyle = '#14251f'; x.font = '700 22px Manrope, system-ui, sans-serif'; x.fillText(hex(col.rgb), left, 420);
      x.fillStyle = '#56645d'; x.font = '500 16px Manrope, system-ui, sans-serif'; x.fillText(`rgb(${col.rgb.join(', ')})`, left, 448);
    });
    x.fillStyle = '#9aa39e'; x.font = '500 14px Manrope, system-ui, sans-serif'; x.fillText('hisanali.com/tools/color-palette-generator/', 40, 496);
    download(await canvasToBlob(c, 'image/png'), 'color-palette.png');
    toast('Palette image downloaded');
  });
})();
