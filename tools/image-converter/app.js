(function () {
  'use strict';
  const { $, esc, fmtBytes, baseName, toast, download, dropzone, segmented, progress, jszip, decodeImage, canvasToBlob, canEncode } = window.TK;

  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' };
  const state = { items: [], busy: false };
  const el = {
    drop: $('#icDrop'), listWrap: $('#icListWrap'), list: $('#icList'), count: $('#icCount'), clear: $('#icClear'), zip: $('#icZip'),
    quality: $('#icQuality'), qualityOut: $('#icQualityOut'), qualityField: $('#icQualityField'),
    resizeFields: $('#icResizeFields'), maxW: $('#icMaxW'), maxH: $('#icMaxH'), pct: $('#icPct'), pctOut: $('#icPctOut'), pctField: $('#icPctField'), dimField: $('#icDimField'),
    bgField: $('#icBgField'), bg: $('#icBg'), bgText: $('#icBgText'), strip: $('#icSummary'),
    run: $('#icRun'), hint: $('#icHint')
  };
  const prog = progress($('#icProgress'));

  dropUnsupportedFormats();
  function dropUnsupportedFormats() { if (!canEncode('image/avif')) $('#icFormat [data-value="image/avif"]')?.remove(); if (!canEncode('image/webp')) $('#icFormat [data-value="image/webp"]')?.remove(); }
  const format = segmented($('#icFormat'), sync);
  const resize = segmented($('#icResize'), sync);

  function sync() {
    const f = format.value;
    el.qualityField.hidden = f === 'image/png';
    el.bgField.hidden = f !== 'image/jpeg';
    el.resizeFields.hidden = resize.value === 'none';
    el.dimField.hidden = resize.value !== 'fit';
    el.pctField.hidden = resize.value !== 'pct';
    stale();
  }
  el.quality.addEventListener('input', () => { el.qualityOut.textContent = `${Math.round(el.quality.value * 100)}%`; stale(); });
  el.pct.addEventListener('input', () => { el.pctOut.textContent = `${el.pct.value}%`; stale(); });
  [el.maxW, el.maxH].forEach((i) => i.addEventListener('input', stale));
  el.bg.addEventListener('input', () => { el.bgText.value = el.bg.value; stale(); });
  el.bgText.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(el.bgText.value)) { el.bg.value = el.bgText.value; stale(); } else el.bgText.value = el.bg.value; });

  const isImage = (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|svg|ico)$/i.test(f.name);
  dropzone(el.drop, { accept: isImage, onFiles: add, paste: true, rejectMessage: (n) => `${n} non-image file${n > 1 ? 's' : ''} skipped.` });

  function add(files) {
    for (const file of files) {
      const it = { id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file), w: 0, h: 0, out: null, error: '' };
      state.items.push(it);
      decodeImage(file).then((d) => { it.w = d.width; it.h = d.height; d.close(); render(); }).catch(() => { it.error = 'Can’t read this image'; render(); });
    }
    render();
  }

  function stale() {
    let any = false;
    state.items.forEach((i) => { if (i.out) { URL.revokeObjectURL(i.out.url); i.out = null; any = true; } });
    if (any) render(); else updateSummary();
  }

  function targetSize(w, h) {
    if (resize.value === 'pct') { const k = el.pct.value / 100; return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))]; }
    if (resize.value === 'fit') {
      const mw = parseInt(el.maxW.value, 10) || Infinity;
      const mh = parseInt(el.maxH.value, 10) || Infinity;
      const k = Math.min(1, mw / w, mh / h);
      return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
    }
    return [w, h];
  }

  function render() {
    const has = state.items.length > 0;
    el.listWrap.hidden = !has;
    el.drop.classList.toggle('is-compact', has);
    el.count.textContent = `${state.items.length} image${state.items.length === 1 ? '' : 's'}`;
    el.list.innerHTML = state.items.map((it) => {
      let meta;
      if (it.error) meta = `<span class="is-err">${it.error}</span>`;
      else if (it.out) {
        const diff = Math.round((1 - it.out.blob.size / it.file.size) * 100);
        meta = `<span>${fmtBytes(it.file.size)} → <b>${fmtBytes(it.out.blob.size)}</b></span><span class="${diff >= 0 ? 'is-ok' : 'is-err'}">${diff >= 0 ? `−${diff}%` : `+${-diff}%`}</span><span>${it.out.w}×${it.out.h}</span>`;
      } else meta = `<span>${it.w ? `${it.w}×${it.h}` : '…'}</span><span>${fmtBytes(it.file.size)}</span><span>${esc((it.file.type || '').replace('image/', '').toUpperCase() || 'IMAGE')}</span>`;
      return `<li class="tk-item${it.error ? ' is-error' : ''}" data-id="${it.id}" style="grid-template-columns:52px minmax(0,1fr) auto;padding-left:10px">
        <div class="tk-thumb is-contain"><img src="${it.out ? it.out.url : it.url}" alt=""></div>
        <div class="tk-item-main"><span class="tk-item-name" title="${esc(it.file.name)}">${esc(it.out ? it.out.name : it.file.name)}</span><div class="tk-item-meta">${meta}</div></div>
        <div class="tk-item-tools">
          ${it.out ? '<button class="tk-btn tk-btn-sm tk-btn-dark" type="button" data-act="save"><span class="fas fa-download" aria-hidden="true"></span> Save</button>' : ''}
          <button class="tk-icon-btn is-danger" type="button" data-act="remove" aria-label="Remove" title="Remove"><span class="fas fa-xmark" aria-hidden="true"></span></button>
        </div></li>`;
    }).join('');
    updateSummary();
  }

  function updateSummary() {
    const done = state.items.filter((i) => i.out);
    const valid = state.items.filter((i) => !i.error);
    el.zip.hidden = done.length < 2;
    el.run.disabled = state.busy || !valid.length;
    el.run.innerHTML = done.length && done.length === valid.length
      ? '<span class="fas fa-rotate" aria-hidden="true"></span> Convert again'
      : `<span class="fas fa-arrows-rotate" aria-hidden="true"></span> Convert ${valid.length > 1 ? `${valid.length} images` : 'image'}`;
    if (done.length) {
      const before = done.reduce((s, i) => s + i.file.size, 0);
      const after = done.reduce((s, i) => s + i.out.blob.size, 0);
      const pct = Math.round((1 - after / before) * 100);
      el.strip.hidden = false;
      el.strip.innerHTML = `<div class="tk-stat"><b>${fmtBytes(before)}</b><span>Before</span></div><div class="tk-stat"><b>${fmtBytes(after)}</b><span>After</span></div><div class="tk-stat is-accent"><b>${pct >= 0 ? `−${pct}` : `+${-pct}`}%</b><span>Change</span></div>`;
    } else el.strip.hidden = true;
    el.hint.textContent = state.items.length ? '' : 'Add images to begin. You can also paste with Ctrl/⌘ + V.';
  }

  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = state.items.findIndex((x) => x.id === b.closest('li').dataset.id);
    const it = state.items[i];
    if (b.dataset.act === 'save') download(it.out.blob, it.out.name);
    if (b.dataset.act === 'remove') { URL.revokeObjectURL(it.url); if (it.out) URL.revokeObjectURL(it.out.url); state.items.splice(i, 1); render(); }
  });
  el.clear.addEventListener('click', () => { state.items.forEach((i) => { URL.revokeObjectURL(i.url); if (i.out) URL.revokeObjectURL(i.out.url); }); state.items = []; render(); });

  async function convert(it) {
    const d = await decodeImage(it.file);
    const [w, h] = targetSize(d.width, d.height);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const type = format.value;
    if (type === 'image/jpeg') { ctx.fillStyle = el.bg.value; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = 'high';
    // Step down in halves for large reductions to avoid aliasing.
    let src = d.source; let sw = d.width; let sh = d.height;
    while (sw / 2 > w && sh / 2 > h) {
      const t = document.createElement('canvas');
      t.width = Math.round(sw / 2); t.height = Math.round(sh / 2);
      const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high';
      tc.drawImage(src, 0, 0, t.width, t.height);
      src = t; sw = t.width; sh = t.height;
    }
    ctx.drawImage(src, 0, 0, w, h);
    d.close();
    const blob = await canvasToBlob(c, type, Number(el.quality.value));
    return { blob, w, h, name: `${baseName(it.file.name)}.${EXT[type]}`, url: URL.createObjectURL(blob) };
  }

  el.run.addEventListener('click', async () => {
    if (state.busy) return;
    state.busy = true;
    stale();
    updateSummary();
    const todo = state.items.filter((i) => !i.error);
    let failed = 0;
    for (let n = 0; n < todo.length; n++) {
      prog.set(n / todo.length, `Converting ${n + 1} of ${todo.length}`);
      try { todo[n].out = await convert(todo[n]); } catch (e) { todo[n].error = e.message; failed++; }
    }
    prog.hide();
    state.busy = false;
    render();
    const ok = todo.length - failed;
    if (ok === 1 && todo.length === 1) { const o = todo[0].out; download(o.blob, o.name); toast('Image converted and downloaded'); } else if (ok) toast(`${ok} image${ok > 1 ? 's' : ''} converted — save individually or as a ZIP`);
    if (failed) toast(`${failed} image${failed > 1 ? 's' : ''} failed to convert`, 'err');
  });

  el.zip.addEventListener('click', async () => {
    const done = state.items.filter((i) => i.out);
    el.zip.disabled = true;
    try {
      const JSZip = await jszip();
      const zip = new JSZip();
      const used = new Set();
      done.forEach((i) => {
        let name = i.out.name; let k = 2;
        while (used.has(name)) name = i.out.name.replace(/(\.\w+)$/, `-${k++}$1`);
        used.add(name);
        zip.file(name, i.out.blob);
      });
      download(await zip.generateAsync({ type: 'blob' }), 'converted-images.zip');
    } catch (e) { toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  sync();
  render();
})();
