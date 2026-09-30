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

  function baseName(name) {
    return String(name || 'file').replace(/\.[^.]+$/, '') || 'file';
  }

  function safeFileName(name, fallback = 'file') {
    const cleaned = String(name || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ');
    return cleaned || fallback;
  }

  const uid = (() => { let n = 0; return () => `tk${Date.now().toString(36)}${(n++).toString(36)}`; })();

  const scriptCache = new Map();
  function loadScript(key) {
    const url = LIBS[key] || key;
    if (!scriptCache.has(url)) {
      scriptCache.set(url, new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => { scriptCache.delete(url); reject(new Error('Could not load a required component. Check your connection and try again.')); };
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

  // Toasts
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
    el.innerHTML = `<span class="fas ${type === 'err' ? 'fa-circle-exclamation' : 'fa-circle-check'}" aria-hidden="true"></span><span>${esc(message)}</span>`;
    toastHost.appendChild(el);
    setTimeout(() => el.remove(), type === 'err' ? 5200 : 2800);
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

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Copied to clipboard');
  }

  /**
   * Makes an element a file drop target.
   * opts: { input, accept(file) -> bool, onFiles(files), pasteImages, rejectMessage }
   */
  function dropzone(el, opts) {
    const input = opts.input || $('input[type=file]', el);
    const handle = (list) => {
      const files = Array.from(list || []);
      if (!files.length) return;
      const ok = opts.accept ? files.filter(opts.accept) : files;
      const rejected = files.length - ok.length;
      if (rejected) toast(opts.rejectMessage ? opts.rejectMessage(rejected) : `${rejected} file${rejected > 1 ? 's were' : ' was'} skipped (unsupported type).`, 'err');
      if (ok.length) opts.onFiles(ok);
    };
    el.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, label')) return;
      input.click();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => { handle(input.files); input.value = ''; });
    let depth = 0;
    el.addEventListener('dragenter', (e) => { e.preventDefault(); depth++; el.classList.add('is-over'); });
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    el.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) el.classList.remove('is-over'); });
    el.addEventListener('drop', (e) => { e.preventDefault(); depth = 0; el.classList.remove('is-over'); handle(e.dataTransfer.files); });
    // Keep accidental drops elsewhere from navigating away from the tool.
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => { if (!el.contains(e.target)) { e.preventDefault(); handle(e.dataTransfer.files); } });
    if (opts.paste) {
      window.addEventListener('paste', (e) => {
        if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
        const files = Array.from(e.clipboardData?.files || []);
        if (files.length) { e.preventDefault(); handle(files); }
      });
    }
  }

  /**
   * Pointer-driven reordering for a list whose children each contain a [data-grip].
   * onMove(fromIndex, toIndex) is called once on drop.
   */
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
        const gap = rects[from].height + 8;
        items.forEach((n, i) => {
          if (n === item) return;
          let shift = 0;
          if (from < to && i > from && i <= to) shift = -gap;
          if (from > to && i >= to && i < from) shift = gap;
          n.style.transition = 'transform .15s';
          n.style.transform = shift ? `translateY(${shift}px)` : '';
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

  /** Segmented button group. Returns { get value, set(v) }. */
  function segmented(el, onChange) {
    const buttons = $$('button[data-value]', el);
    const api = {
      get value() { return (buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0]).dataset.value; },
      set(v, silent) {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
        if (!silent && onChange) onChange(v);
      }
    };
    buttons.forEach((b) => {
      b.type = 'button';
      if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => api.set(b.dataset.value));
    });
    if (!buttons.some((b) => b.getAttribute('aria-pressed') === 'true') && buttons[0]) buttons[0].setAttribute('aria-pressed', 'true');
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

  /**
   * Parses "1-3, 5, 8-" into sorted unique 0-based page indices.
   * Empty input returns every page. Throws Error with a readable message when invalid.
   */
  function parseRanges(text, total) {
    const src = String(text || '').trim();
    if (!src) return Array.from({ length: total }, (_, i) => i);
    const out = new Set();
    for (const raw of src.split(/[,;\s]+/).filter(Boolean)) {
      const m = raw.match(/^(\d*)\s*-\s*(\d*)$/);
      let a;
      let b;
      if (m) {
        a = m[1] ? parseInt(m[1], 10) : 1;
        b = m[2] ? parseInt(m[2], 10) : total;
      } else if (/^\d+$/.test(raw)) {
        a = b = parseInt(raw, 10);
      } else {
        throw new Error(`"${raw}" is not a valid page or range.`);
      }
      if (a < 1 || b < 1) throw new Error('Page numbers start at 1.');
      if (a > b) [a, b] = [b, a];
      if (a > total) throw new Error(`Page ${a} doesn't exist — the document has ${total} page${total === 1 ? '' : 's'}.`);
      for (let p = a; p <= Math.min(b, total); p++) out.add(p - 1);
    }
    if (!out.size) throw new Error('No pages selected.');
    return Array.from(out).sort((x, y) => x - y);
  }

  function readArrayBuffer(file) {
    return file.arrayBuffer ? file.arrayBuffer() : new Response(file).arrayBuffer();
  }

  /** Decodes any browser-supported image (incl. SVG) respecting EXIF orientation. */
  async function decodeImage(file) {
    const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
    if (!isSvg && 'createImageBitmap' in window) {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close && bmp.close() };
      } catch (e) { /* fall through to <img> */ }
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
        // Rasterise SVGs large enough to stay crisp.
        const scale = Math.max(1, 2048 / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      return { source: img, width: w, height: h, close: () => URL.revokeObjectURL(url) };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw new Error('This image could not be read. It may be corrupted or in an unsupported format.');
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Your browser could not encode this image.'))), type, quality);
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

  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  function objectUrl(blob, bag) {
    const url = URL.createObjectURL(blob);
    if (bag) bag.push(url);
    return url;
  }

  window.TK = { $, $$, esc, fmtBytes, baseName, safeFileName, uid, loadScript, pdfjs, pdflib, jszip, toast, download, copy, dropzone, sortable, moveItem, segmented, progress, parseRanges, readArrayBuffer, decodeImage, canvasToBlob, canEncode, nextFrame, objectUrl, LIBS };
})();
