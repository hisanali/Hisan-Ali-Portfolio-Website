(function () {
  'use strict';
  const { $, esc, fmtBytes, baseName, safeFileName, toast, download, dropzone, sortable, moveItem, segmented, progress, pdflib, decodeImage, canvasToBlob } = window.TK;

  const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
  const MARGINS = { none: 0, small: 18, large: 42 };
  const QUALITY = { high: { q: 0.92, max: 4000 }, compact: { q: 0.72, max: 2000 } };

  const state = { items: [], busy: false, result: null };
  const el = {
    drop: $('#ipDrop'), list: $('#ipList'), listWrap: $('#ipListWrap'), count: $('#ipCount'), clear: $('#ipClear'), sortAz: $('#ipSortAz'),
    name: $('#ipName'), run: $('#ipRun'), hint: $('#ipHint'), result: $('#ipResult'), resultMeta: $('#ipResultMeta'), dl: $('#ipDownload'), again: $('#ipAgain'),
    orientField: $('#ipOrientField')
  };
  const prog = progress($('#ipProgress'));
  const size = segmented($('#ipSize'), () => { el.orientField.hidden = size.value === 'fit'; invalidate(); });
  const orient = segmented($('#ipOrient'), invalidate);
  const margin = segmented($('#ipMargin'), invalidate);
  const quality = segmented($('#ipQuality'), invalidate);
  el.orientField.hidden = size.value === 'fit';

  const isImage = (f) => /^image\/(png|jpe?g|webp|gif|bmp|avif|svg\+xml)$/.test(f.type) || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(f.name);
  dropzone(el.drop, { accept: isImage, onFiles: add, paste: true, rejectMessage: (n) => `${n} file${n > 1 ? 's' : ''} skipped — only images can be added.` });
  sortable(el.list, (a, b) => { moveItem(state.items, a, b); invalidate(); render(); });

  function add(files) {
    for (const file of files) {
      const item = { id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file), rotate: 0, w: 0, h: 0, error: '' };
      state.items.push(item);
      decodeImage(file).then((d) => { item.w = d.width; item.h = d.height; d.close(); render(); }).catch(() => { item.error = 'Can’t read this image'; render(); });
    }
    if (!el.name.value && state.items[0]) el.name.value = baseName(state.items[0].file.name);
    invalidate();
    render();
  }

  function render() {
    const has = state.items.length > 0;
    el.listWrap.hidden = !has;
    el.drop.classList.toggle('is-compact', has);
    el.count.textContent = `${state.items.length} image${state.items.length === 1 ? '' : 's'}`;
    el.list.innerHTML = state.items.map((it, i) => `<li class="tk-item${it.error ? ' is-error' : ''}" data-id="${it.id}">
      <button class="tk-grip" type="button" data-grip aria-label="Reorder ${esc(it.file.name)} (use arrow keys)"><span class="fas fa-grip-vertical" aria-hidden="true"></span></button>
      <div class="tk-thumb"><img src="${it.url}" alt="" style="transform:rotate(${it.rotate}deg)"></div>
      <div class="tk-item-main"><span class="tk-item-name" title="${esc(it.file.name)}">${i + 1}. ${esc(it.file.name)}</span>
        <div class="tk-item-meta">${it.error ? `<span class="is-err">${it.error}</span>` : `<span>${it.w ? `${it.w}×${it.h}` : '…'}</span><span>${fmtBytes(it.file.size)}</span>${it.rotate ? `<span>Rotated ${it.rotate}°</span>` : ''}`}</div></div>
      <div class="tk-item-tools">
        <button class="tk-icon-btn" type="button" data-act="rotate" title="Rotate 90°" aria-label="Rotate"><span class="fas fa-rotate-right" aria-hidden="true"></span></button>
        <button class="tk-icon-btn" type="button" data-act="up" aria-label="Move up" title="Move up" ${i === 0 ? 'disabled' : ''}><span class="fas fa-arrow-up" aria-hidden="true"></span></button>
        <button class="tk-icon-btn" type="button" data-act="down" aria-label="Move down" title="Move down" ${i === state.items.length - 1 ? 'disabled' : ''}><span class="fas fa-arrow-down" aria-hidden="true"></span></button>
        <button class="tk-icon-btn is-danger" type="button" data-act="remove" aria-label="Remove" title="Remove"><span class="fas fa-xmark" aria-hidden="true"></span></button>
      </div></li>`).join('');
    const valid = state.items.filter((i) => !i.error).length;
    el.run.disabled = state.busy || !valid;
    el.hint.textContent = !state.items.length ? 'Add images to begin. You can also paste with Ctrl/⌘ + V.' : state.items.length > valid ? 'Images marked in red will be skipped.' : `${valid} page${valid === 1 ? '' : 's'} will be created.`;
  }

  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = state.items.findIndex((x) => x.id === b.closest('li').dataset.id);
    const it = state.items[i];
    if (b.dataset.act === 'remove') { URL.revokeObjectURL(it.url); state.items.splice(i, 1); }
    if (b.dataset.act === 'up' && i > 0) moveItem(state.items, i, i - 1);
    if (b.dataset.act === 'down' && i < state.items.length - 1) moveItem(state.items, i, i + 1);
    if (b.dataset.act === 'rotate') it.rotate = (it.rotate + 90) % 360;
    invalidate();
    render();
  });
  el.clear.addEventListener('click', () => { state.items.forEach((i) => URL.revokeObjectURL(i.url)); state.items = []; el.name.value = ''; invalidate(); render(); });
  el.sortAz.addEventListener('click', () => { state.items.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })); invalidate(); render(); });
  el.again.addEventListener('click', () => el.clear.click());
  function invalidate() { state.result = null; el.result.hidden = true; }

  async function encode(item, PDFLib, doc) {
    const d = await decodeImage(item.file);
    const q = QUALITY[quality.value];
    const rot = item.rotate;
    const scale = Math.min(1, q.max / Math.max(d.width, d.height));
    const w = Math.round(d.width * scale);
    const h = Math.round(d.height * scale);
    const swap = rot === 90 || rot === 270;
    const c = document.createElement('canvas');
    c.width = swap ? h : w;
    c.height = swap ? w : h;
    const ctx = c.getContext('2d');
    const keepAlpha = /png|webp|gif|svg|avif/.test(item.file.type) && quality.value === 'high';
    if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(rot * Math.PI / 180);
    ctx.drawImage(d.source, -w / 2, -h / 2, w, h);
    d.close();
    const blob = await canvasToBlob(c, keepAlpha ? 'image/png' : 'image/jpeg', q.q);
    const bytes = await blob.arrayBuffer();
    const img = keepAlpha ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    // Pixel dimensions → points at 96 DPI so "fit" pages have a natural physical size.
    return { img, pw: c.width / scale * 0.75, ph: c.height / scale * 0.75 };
  }

  el.run.addEventListener('click', async () => {
    if (state.busy) return;
    state.busy = true;
    el.run.disabled = true;
    invalidate();
    try {
      const PDFLib = await pdflib();
      const doc = await PDFLib.PDFDocument.create();
      const items = state.items.filter((i) => !i.error);
      const m = MARGINS[margin.value];
      for (let n = 0; n < items.length; n++) {
        prog.set(n / items.length, `Adding image ${n + 1} of ${items.length}`);
        const { img, pw, ph } = await encode(items[n], PDFLib, doc);
        let W;
        let H;
        if (size.value === 'fit') {
          W = pw + m * 2; H = ph + m * 2;
        } else {
          [W, H] = SIZES[size.value];
          const landscape = orient.value === 'landscape' || (orient.value === 'auto' && pw > ph);
          if (landscape) [W, H] = [H, W];
        }
        const boxW = W - m * 2;
        const boxH = H - m * 2;
        const k = Math.min(boxW / pw, boxH / ph);
        const dw = pw * k;
        const dh = ph * k;
        const page = doc.addPage([W, H]);
        page.drawImage(img, { x: (W - dw) / 2, y: (H - dh) / 2, width: dw, height: dh });
      }
      prog.set(0.98, 'Saving PDF…');
      doc.setCreator('hisanali.com Image to PDF');
      const bytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = `${safeFileName(el.name.value.replace(/\.pdf$/i, ''), 'images')}.pdf`;
      state.result = { blob, name };
      prog.hide();
      el.resultMeta.textContent = `${items.length} page${items.length === 1 ? '' : 's'} · ${fmtBytes(blob.size)} · ${name}`;
      el.result.hidden = false;
      download(blob, name);
      toast('PDF downloaded');
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(`Couldn’t create the PDF: ${e.message}`, 'err');
    } finally {
      state.busy = false;
      render();
    }
  });
  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  render();
})();
