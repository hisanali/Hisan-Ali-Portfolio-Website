/* Shared helpers for the browser tools. Exposes window.TK. */
(function () {
  'use strict';

  const LIBS = {
    pdflib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    qrstyling: 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js'
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const icon = (name, cls = '') => `<svg class="tk-i${cls ? ` ${cls}` : ''}" aria-hidden="true"><use href="#tk-i-${name}"/></svg>`;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / 1024 ** i;
    return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
  }

  const plural = (n, word, many) => `${n} ${n === 1 ? word : (many || `${word}s`)}`;
  const baseName = (name) => String(name || 'file').replace(/\.[^.]+$/, '') || 'file';
  function safeFileName(name, fallback = 'file') {
    const cleaned = String(name || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ');
    return cleaned || fallback;
  }

  const scriptCache = new Map();
  function loadScript(key) {
    const url = LIBS[key] || key;
    if (!scriptCache.has(url)) {
      scriptCache.set(url, new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => { scriptCache.delete(url); s.remove(); reject(new Error('A required component couldn’t load. Check your connection and try again.')); };
        document.head.appendChild(s);
      }));
    }
    return scriptCache.get(url);
  }
  async function pdfjs() {
    await loadScript('pdfjs');
    const lib = window.pdfjsLib;
    if (!lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = LIBS.pdfjsWorker;
    return lib;
  }
  async function pdflib() { await loadScript('pdflib'); return window.PDFLib; }
  async function jszip() { await loadScript('jszip'); return window.JSZip; }

  /* Toasts */
  let toastHost;
  function toast(message, type = 'ok') {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'tk-toasts';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    const el = document.createElement('div');
    el.className = `tk-toast${type === 'err' ? ' is-err' : ''}`;
    el.innerHTML = `<span>${icon(type === 'err' ? 'alert' : 'check')}</span><span>${esc(message)}</span>`;
    toastHost.appendChild(el);
    setTimeout(() => el.remove(), type === 'err' ? 5600 : 3000);
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function copy(text, message = 'Copied to clipboard') {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast(message);
  }

  /* Page-wide drop veil so files can be dropped anywhere on the page. */
  let veil;
  function showVeil(on, label) {
    if (!veil) {
      veil = document.createElement('div');
      veil.className = 'tk-veil';
      veil.setAttribute('aria-hidden', 'true');
      const c = getComputedStyle(document.querySelector('.tk') || document.body).getPropertyValue('--tk-c');
      if (c) veil.style.setProperty('--tk-c', c.trim());
      document.body.appendChild(veil);
    }
    if (label) veil.innerHTML = `<div>${icon('upload')}<span>${esc(label)}</span></div>`;
    veil.classList.toggle('is-on', on);
  }

  /**
   * Makes an element a file drop target and wires every [data-browse] button to the file picker.
   * opts: { input, accept(file) -> bool, onFiles(files), paste, veilLabel, rejectMessage(n) }
   */
  function dropzone(el, opts) {
    const input = opts.input || $('input[type=file]', el);
    const handle = (list) => {
      const files = Array.from(list || []);
      if (!files.length) return;
      const ok = opts.accept ? files.filter(opts.accept) : files;
      const rejected = files.length - ok.length;
      if (rejected) toast(opts.rejectMessage ? opts.rejectMessage(rejected) : `${plural(rejected, 'file')} skipped — unsupported type.`, 'err');
      if (ok.length) opts.onFiles(ok);
    };
    el.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, label')) return;
      input.click();
    });
    el.addEventListener('keydown', (e) => {
      if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); input.click(); }
    });
    $$('[data-browse]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); input.click(); }));
    input.addEventListener('change', () => { handle(input.files); input.value = ''; });

    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
    let depth = 0;
    window.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      const zoneVisible = el.offsetParent !== null && el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < innerHeight;
      if (zoneVisible) el.classList.add('is-over'); else showVeil(true, opts.veilLabel || 'Drop to add');
    });
    window.addEventListener('dragover', (e) => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    window.addEventListener('dragleave', (e) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) { el.classList.remove('is-over'); showVeil(false); }
    });
    window.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      el.classList.remove('is-over');
      showVeil(false);
      handle(e.dataTransfer.files);
    });
    if (opts.paste) {
      window.addEventListener('paste', (e) => {
        if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
        const files = Array.from(e.clipboardData?.files || []);
        if (files.length) { e.preventDefault(); handle(files); }
      });
    }
    return { open: () => input.click() };
  }

  /** Pointer-driven reordering for a list whose items contain a [data-grip]. onMove(from, to) fires on drop. */
  function sortable(list, onMove) {
    list.addEventListener('pointerdown', (e) => {
      const grip = e.target.closest('[data-grip]');
      if (!grip || e.button > 0) return;
      const item = grip.closest('li');
      const items = Array.from(list.children);
      const from = items.indexOf(item);
      if (from < 0 || items.length < 2) return;
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      const rects = items.map((n) => n.getBoundingClientRect());
      const gap = items.length > 1 ? rects[1].top - rects[0].bottom : 10;
      const startY = e.clientY;
      let to = from;
      item.classList.add('is-dragging');
      const move = (ev) => {
        const dy = ev.clientY - startY;
        item.style.transform = `translateY(${dy}px)`;
        const centre = rects[from].top + rects[from].height / 2 + dy;
        to = from;
        rects.forEach((r, i) => {
          if (i < from && centre < r.top + r.height / 2) to = Math.min(to, i);
          if (i > from && centre > r.top + r.height / 2) to = Math.max(to, i);
        });
        const shift = rects[from].height + gap;
        items.forEach((n, i) => {
          if (n === item) return;
          let s = 0;
          if (from < to && i > from && i <= to) s = -shift;
          if (from > to && i >= to && i < from) s = shift;
          n.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
          n.style.transform = s ? `translateY(${s}px)` : '';
        });
      };
      const up = () => {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up);
        grip.removeEventListener('pointercancel', up);
        items.forEach((n) => { n.style.transform = ''; n.style.transition = ''; });
        item.classList.remove('is-dragging');
        if (to !== from) onMove(from, to);
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
      grip.addEventListener('pointercancel', up);
    });
    list.addEventListener('keydown', (e) => {
      const grip = e.target.closest('[data-grip]');
      if (!grip || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      const items = Array.from(list.children);
      const from = items.indexOf(grip.closest('li'));
      const to = from + (e.key === 'ArrowUp' ? -1 : 1);
      if (to < 0 || to >= items.length) return;
      onMove(from, to);
      requestAnimationFrame(() => list.children[to]?.querySelector('[data-grip]')?.focus());
    });
  }

  function moveItem(arr, from, to) {
    const [x] = arr.splice(from, 1);
    arr.splice(to, 0, x);
    return arr;
  }

  /** Segmented button group. Returns { value, set(v, silent) }. */
  function segmented(el, onChange) {
    const buttons = () => $$('button[data-value]', el);
    const api = {
      get value() { const b = buttons(); return (b.find((x) => x.getAttribute('aria-pressed') === 'true') || b[0]).dataset.value; },
      set(v, silent) {
        buttons().forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
        if (!silent && onChange) onChange(v);
      }
    };
    buttons().forEach((b) => {
      b.type = 'button';
      if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') !== 'true') api.set(b.dataset.value); });
    });
    if (!buttons().some((b) => b.getAttribute('aria-pressed') === 'true') && buttons()[0]) buttons()[0].setAttribute('aria-pressed', 'true');
    return api;
  }

  function progress(el) {
    const bar = $('.tk-progress-bar i', el);
    const label = $('[data-progress-label]', el);
    const pct = $('[data-progress-pct]', el);
    return {
      set(fraction, text) {
        el.hidden = false;
        const p = Math.max(0, Math.min(1, fraction));
        bar.style.width = `${(p * 100).toFixed(1)}%`;
        if (pct) pct.textContent = `${Math.round(p * 100)}%`;
        if (text && label) label.textContent = text;
      },
      hide() { el.hidden = true; bar.style.width = '0'; }
    };
  }

  /** Studio step tracker: set(n) marks earlier steps done and step n current (1-based). */
  function steps(el) {
    const items = el ? $$('li', el) : [];
    return {
      set(n) {
        items.forEach((li, i) => {
          li.classList.toggle('is-done', i + 1 < n);
          li.classList.toggle('is-now', i + 1 === n);
          const num = li.querySelector('span');
          if (num) num.innerHTML = i + 1 < n ? icon('check') : String(i + 1);
        });
      }
    };
  }

  /**
   * Mobile dock: a floating bar that mirrors the primary action whenever the real button is off-screen.
   * label() returns the summary text shown next to the button.
   */
  function dock(button, label) {
    if (!button) return { refresh() {} };
    const bar = document.createElement('div');
    bar.className = 'tk-dock';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Quick action');
    bar.innerHTML = '<span></span><button type="button"></button>';
    document.body.appendChild(bar);
    const text = bar.querySelector('span');
    const btn = bar.querySelector('button');
    let offscreen = false;
    btn.addEventListener('click', () => button.click());
    const refresh = () => {
      btn.innerHTML = button.innerHTML;
      btn.disabled = button.disabled;
      text.textContent = label ? label() : '';
      const on = offscreen && !button.disabled && !button.closest('[hidden]');
      bar.classList.toggle('is-on', on);
      document.body.classList.toggle('tk-dock-on', on);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { offscreen = !entry.isIntersecting; refresh(); }, { rootMargin: '0px 0px -40px 0px' }).observe(button);
    }
    new MutationObserver(refresh).observe(button, { attributes: true, childList: true, subtree: true });
    return { refresh };
  }

  /** Keeps the filled part of every .tk-range track in sync with its value. */
  function syncRange(r) {
    const min = Number(r.min || 0);
    const max = Number(r.max || 100);
    r.style.setProperty('--p', `${((Number(r.value) - min) / (max - min)) * 100}%`);
  }
  document.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('tk-range')) syncRange(e.target); });
  const initRanges = () => $$('.tk-range').forEach(syncRange);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRanges); else initRanges();

  /** Parses "1-3, 5, 8-" into sorted unique 0-based page indices. Empty input selects every page. */
  function parseRanges(text, total) {
    const src = String(text || '').trim();
    if (!src) return Array.from({ length: total }, (_, i) => i);
    const out = new Set();
    for (const raw of src.split(/[,;\s]+/).filter(Boolean)) {
      const m = raw.match(/^(\d*)\s*[-–]\s*(\d*)$/);
      let a;
      let b;
      if (m) {
        a = m[1] ? parseInt(m[1], 10) : 1;
        b = m[2] ? parseInt(m[2], 10) : total;
      } else if (/^\d+$/.test(raw)) {
        a = b = parseInt(raw, 10);
      } else {
        throw new Error(`“${raw}” isn’t a page number or range.`);
      }
      if (a < 1 || b < 1) throw new Error('Page numbers start at 1.');
      if (a > b) [a, b] = [b, a];
      if (a > total) throw new Error(`Page ${a} doesn’t exist — this file has ${plural(total, 'page')}.`);
      for (let p = a; p <= Math.min(b, total); p++) out.add(p - 1);
    }
    if (!out.size) throw new Error('No pages selected.');
    return Array.from(out).sort((x, y) => x - y);
  }

  /** Decodes any browser-supported image (incl. SVG), respecting EXIF orientation. */
  async function decodeImage(file) {
    const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
    if (!isSvg && 'createImageBitmap' in window) {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close && bmp.close() };
      } catch (e) { /* fall back to <img> */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (isSvg && (!w || !h)) { w = 1024; h = 1024; }
      if (isSvg) {
        const scale = Math.max(1, 2048 / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      return { source: img, width: w, height: h, close: () => URL.revokeObjectURL(url) };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw new Error('This image couldn’t be read — it may be damaged or in an unsupported format.');
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Your browser couldn’t encode this image.'))), type, quality);
    });
  }

  const encodeSupport = {};
  function canEncode(type) {
    if (!(type in encodeSupport)) {
      const c = document.createElement('canvas');
      c.width = c.height = 2;
      encodeSupport[type] = c.toDataURL(type).startsWith(`data:${type}`);
    }
    return encodeSupport[type];
  }

  /* ---------- Sample files so anyone can try a tool instantly ---------- */
  const PALETTES = [['#ffb48c', '#d9522d'], ['#9dd4ff', '#2b6cb0'], ['#a8e6c2', '#1d7f52'], ['#f5b9e2', '#b83280'], ['#dfff63', '#17382d'], ['#ffe27a', '#b7791f']];

  function drawScene(ctx, w, h, seed, label) {
    const [light, deep] = PALETTES[seed % PALETTES.length];
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, light);
    sky.addColorStop(1, '#fffdf8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(w * (0.25 + (seed % 3) * 0.22), h * 0.3, Math.min(w, h) * 0.11, 0, Math.PI * 2);
    ctx.fill();
    const hills = [[0.62, deep, 0.55], [0.72, '#17382d', 0.85]];
    hills.forEach(([y, col, a], k) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += w / 8) ctx.lineTo(x, h * y + Math.sin((x / w) * Math.PI * (2 + k) + seed) * h * 0.06);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (label) {
      ctx.fillStyle = '#fffdf8';
      ctx.font = `800 ${Math.round(Math.min(w, h) * 0.07)}px Manrope, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(label, w * 0.06, h * 0.92);
    }
  }

  /** Returns a sample image File. */
  async function sampleImage({ w = 1600, h = 1067, type = 'image/jpeg', name = 'sample-photo.jpg', seed = 0, label = '' } = {}) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    drawScene(c.getContext('2d'), w, h, seed, label);
    const blob = await canvasToBlob(c, type, 0.92);
    return new File([blob], name, { type, lastModified: Date.now() });
  }

  /** Returns a sample logo (transparent PNG). */
  async function sampleLogo() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    x.fillStyle = '#d9522d';
    x.beginPath();
    x.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#dfff63';
    x.beginPath();
    x.moveTo(s * 0.3, s * 0.68);
    x.lineTo(s * 0.5, s * 0.26);
    x.lineTo(s * 0.7, s * 0.68);
    x.closePath();
    x.fill();
    x.fillStyle = '#17382d';
    x.beginPath();
    x.arc(s * 0.5, s * 0.6, s * 0.08, 0, Math.PI * 2);
    x.fill();
    const blob = await canvasToBlob(c, 'image/png');
    return new File([blob], 'sample-logo.png', { type: 'image/png', lastModified: Date.now() });
  }

  /** Returns a sample multi-page PDF File. withPhoto embeds a large image on each page (for the compressor). */
  async function samplePdf({ name = 'sample.pdf', title = 'Sample document', pages = 3, seed = 0, withPhoto = false } = {}) {
    const PDFLib = await pdflib();
    const { rgb, StandardFonts } = PDFLib;
    const doc = await PDFLib.PDFDocument.create();
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
    let photo = null;
    if (withPhoto) {
      // A grainy, photo-like image stored losslessly — typical of unoptimised brochures and scans.
      const c = document.createElement('canvas');
      c.width = 1800; c.height = 1200;
      const ctx = c.getContext('2d');
      drawScene(ctx, 1800, 1200, seed, '');
      const img = ctx.getImageData(0, 0, 1800, 1200);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 34;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
      ctx.putImageData(img, 0, 0);
      const blob = await canvasToBlob(c, 'image/png');
      photo = await doc.embedPng(await blob.arrayBuffer());
    }
    for (let p = 0; p < pages; p++) {
      const [light, deep] = PALETTES[(seed + p) % PALETTES.length];
      const page = doc.addPage([595.28, 841.89]);
      page.drawRectangle({ x: 0, y: 741.89, width: 595.28, height: 100, color: hex(light) });
      page.drawText(title, { x: 48, y: 790, size: 24, font: bold, color: hex('#14251f') });
      page.drawText(`Page ${p + 1} of ${pages}`, { x: 48, y: 764, size: 11, font: reg, color: hex(deep) });
      let y = 700;
      if (photo) {
        page.drawImage(photo, { x: 48, y: 400, width: 499, height: 333 });
        y = 370;
      }
      for (let l = 0; l < (photo ? 10 : 22); l++) {
        const width = 499 * (l % 5 === 4 ? 0.55 : 0.8 + ((l * 37) % 20) / 100);
        page.drawRectangle({ x: 48, y, width: Math.min(499, width), height: 7, color: hex('#e3dbcf') });
        y -= l % 5 === 4 ? 30 : 18;
      }
      page.drawText('hisanali.com/tools', { x: 48, y: 36, size: 9, font: reg, color: hex('#69756f') });
    }
    const bytes = await doc.save();
    return new File([bytes], name, { type: 'application/pdf', lastModified: Date.now() });
  }

  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  function reveal(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > innerHeight) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }

  window.TK = { $, $$, icon, esc, fmtBytes, plural, baseName, safeFileName, loadScript, pdfjs, pdflib, jszip, toast, download, copy, dropzone, sortable, moveItem, segmented, progress, steps, dock, parseRanges, decodeImage, canvasToBlob, canEncode, sampleImage, sampleLogo, samplePdf, nextFrame, reveal, LIBS };
})();
