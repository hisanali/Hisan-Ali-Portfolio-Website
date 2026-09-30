(function () {
  'use strict';
  const { $, icon, esc, fmtBytes, plural, baseName, safeFileName, toast, download, dropzone, sortable, moveItem, segmented, progress, steps, dock, reveal, pdflib, decodeImage, canvasToBlob, sampleImage, loadScript } = window.TK;

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
  const tracker = steps($('#tkSteps'));
  const valid = () => state.items.filter((i) => !i.error);
  const mobile = dock(el.run, () => `${plural(valid().length, 'page')} · ${size.value === 'fit' ? 'fit to image' : size.value.toUpperCase()}`);
  const size = segmented($('#ipSize'), () => { el.orientField.hidden = size.value === 'fit'; invalidate(); mobile.refresh(); });
  const orient = segmented($('#ipOrient'), invalidate);
  const margin = segmented($('#ipMargin'), invalidate);
  const quality = segmented($('#ipQuality'), invalidate);
  el.orientField.hidden = size.value === 'fit';
  el.name.addEventListener('input', invalidate);

  const isImage = (f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(f.name);
  dropzone(el.drop, { accept: isImage, onFiles: add, paste: true, veilLabel: 'Drop images to add pages', rejectMessage: (n) => `${plural(n, 'file')} skipped — only images can be added.` });
  sortable(el.list, (a, b) => { moveItem(state.items, a, b); invalidate(); render(); });

  $('[data-sample]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      add(await Promise.all([
        sampleImage({ name: 'receipt-scan.jpg', w: 1200, h: 1700, seed: 4, label: 'Scan 1' }),
        sampleImage({ name: 'site-photo.jpg', w: 1800, h: 1200, seed: 1, label: 'Photo' }),
        sampleImage({ name: 'whiteboard.png', w: 1400, h: 1050, seed: 2, type: 'image/png', label: 'Notes' })
      ]));
    } catch (err) { toast(err.message, 'err'); }
    btn.disabled = false;
  });

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
    el.drop.hidden = has;
    el.count.textContent = plural(state.items.length, 'page');
    el.list.innerHTML = state.items.map((it, i) => `<li class="tk-item${it.error ? ' is-error' : ''}" data-id="${it.id}">
      <button class="tk-grip" type="button" data-grip aria-label="Move ${esc(it.file.name)} — drag, or use arrow keys">${icon('grip')}</button>
      <div class="tk-thumb is-checker"><img src="${it.url}" alt="" style="transform:rotate(${it.rotate}deg)"><span class="tk-n">${i + 1}</span></div>
      <div class="tk-item-main"><span class="tk-item-name" title="${esc(it.file.name)}">${esc(it.file.name)}</span>
        <div class="tk-meta">${it.error ? `<span class="tk-chip is-err">${icon('alert')}${it.error}</span>` : `<span class="tk-chip">${it.w ? `${it.w}×${it.h}` : '…'}</span><span class="tk-chip">${fmtBytes(it.file.size)}</span>${it.rotate ? `<span class="tk-chip is-hl">${icon('rotate')}${it.rotate}°</span>` : ''}`}</div></div>
      <div class="tk-item-tools">
        <button class="tk-iconbtn" type="button" data-act="rotate" title="Rotate 90°" aria-label="Rotate ${esc(it.file.name)}">${icon('rotate')}</button>
        <button class="tk-iconbtn" type="button" data-act="up" title="Move up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
        <button class="tk-iconbtn" type="button" data-act="down" title="Move down" aria-label="Move down" ${i === state.items.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
        <button class="tk-iconbtn is-danger" type="button" data-act="remove" title="Remove" aria-label="Remove ${esc(it.file.name)}">${icon('x')}</button>
      </div></li>`).join('');
    const n = valid().length;
    el.run.disabled = state.busy || !n;
    el.hint.textContent = !state.items.length ? 'Add images to begin.' : state.items.length > n ? 'Images marked in red will be skipped.' : `Ready: ${plural(n, 'page')}, one image per page.`;
    if (!state.result) tracker.set(has ? 2 : 1);
    mobile.refresh();
  }

  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = state.items.findIndex((x) => x.id === b.closest('li').dataset.id);
    const it = state.items[i];
    const act = b.dataset.act;
    if (act === 'remove') { URL.revokeObjectURL(it.url); state.items.splice(i, 1); }
    if (act === 'up' && i > 0) moveItem(state.items, i, i - 1);
    if (act === 'down' && i < state.items.length - 1) moveItem(state.items, i, i + 1);
    if (act === 'rotate') it.rotate = (it.rotate + 90) % 360;
    invalidate();
    render();
    const again = act !== 'remove' && el.list.querySelector(`[data-id="${it.id}"] [data-act="${act}"]`);
    if (again && !again.disabled) again.focus();
  });
  el.clear.addEventListener('click', () => { state.items.forEach((i) => URL.revokeObjectURL(i.url)); state.items = []; el.name.value = ''; invalidate(); render(); });
  el.sortAz.addEventListener('click', () => { state.items.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })); invalidate(); render(); });
  el.again.addEventListener('click', () => { el.clear.click(); el.drop.focus(); });
  function invalidate() { state.result = null; el.result.hidden = true; }

  async function encode(item, doc) {
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
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(d.source, -w / 2, -h / 2, w, h);
    d.close();
    const blob = await canvasToBlob(c, keepAlpha ? 'image/png' : 'image/jpeg', q.q);
    const bytes = await blob.arrayBuffer();
    const img = keepAlpha ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    // Pixel size → points at 96 DPI, so "fit" pages get a natural physical size.
    return { img, pw: c.width / scale * 0.75, ph: c.height / scale * 0.75 };
  }

  el.run.addEventListener('click', async () => {
    if (state.busy || el.run.disabled) return;
    state.busy = true;
    invalidate();
    render();
    try {
      const PDFLib = await pdflib();
      const doc = await PDFLib.PDFDocument.create();
      const items = valid();
      const m = MARGINS[margin.value];
      for (let n = 0; n < items.length; n++) {
        prog.set(n / items.length, `Adding image ${n + 1} of ${items.length}`);
        const { img, pw, ph } = await encode(items[n], doc);
        let W;
        let H;
        if (size.value === 'fit') {
          W = pw + m * 2; H = ph + m * 2;
        } else {
          [W, H] = SIZES[size.value];
          const landscape = orient.value === 'landscape' || (orient.value === 'auto' && pw > ph);
          if (landscape) [W, H] = [H, W];
        }
        const k = Math.min((W - m * 2) / pw, (H - m * 2) / ph);
        const dw = pw * k;
        const dh = ph * k;
        doc.addPage([W, H]).drawImage(img, { x: (W - dw) / 2, y: (H - dh) / 2, width: dw, height: dh });
      }
      prog.set(0.98, 'Saving your PDF…');
      doc.setCreator('hisanali.com Image to PDF');
      const bytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = `${safeFileName(el.name.value.replace(/\.pdf$/i, ''), 'images')}.pdf`;
      state.result = { blob, name };
      prog.hide();
      el.resultMeta.textContent = `${name} · ${plural(items.length, 'page')} · ${fmtBytes(blob.size)}`;
      el.result.hidden = false;
      tracker.set(4);
      reveal(el.result);
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
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdflib').catch(() => {}); });
  render();
})();
