(function () {
  'use strict';
  const { $, icon, fmtBytes, plural, baseName, toast, download, dropzone, segmented, progress, steps, dock, reveal, pdflib, pdfjs, canvasToBlob, samplePdf, loadScript } = window.TK;

  const PRESETS = {
    light: { dpi: 150, quality: 0.82, help: 'Sharp text and photos, moderate savings.' },
    balanced: { dpi: 110, quality: 0.68, help: 'Great for email and sharing — the sweet spot.' },
    strong: { dpi: 80, quality: 0.5, help: 'The smallest file. Fine print gets a little soft.' }
  };

  const state = { file: null, bytes: null, pages: 0, busy: false, result: null };
  const el = {
    drop: $('#pcDrop'), fileCard: $('#pcFile'), fileName: $('#pcFileName'), fileMeta: $('#pcFileMeta'), thumb: $('#pcThumb'), remove: $('#pcRemove'),
    modeHelp: $('#pcModeHelp'), rasterOpts: $('#pcRasterOpts'), levelHelp: $('#pcLevelHelp'), gray: $('#pcGray'),
    run: $('#pcRun'), hint: $('#pcHint'), result: $('#pcResult'), resultTitle: $('#pcResultTitle'), resultMeta: $('#pcResultMeta'),
    before: $('#pcBefore'), after: $('#pcAfter'), barBefore: $('#pcBarBefore'), barAfter: $('#pcBarAfter'), note: $('#pcNote'), dl: $('#pcDownload'), again: $('#pcAgain')
  };
  const prog = progress($('#pcProgress'));
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.run, () => (state.file ? `${state.file.name} · ${fmtBytes(state.file.size)}` : ''));
  const mode = segmented($('#pcMode'), () => { syncMode(); invalidate(); });
  const level = segmented($('#pcLevel'), () => { syncMode(); invalidate(); });
  el.gray.addEventListener('change', invalidate);

  function syncMode() {
    const raster = mode.value === 'raster';
    el.rasterOpts.hidden = !raster;
    el.modeHelp.textContent = raster
      ? 'Re-compresses every page as an optimised image. Biggest savings; text becomes part of the image.'
      : 'Rebuilds the file without touching content. Text stays selectable; savings vary by file.';
    el.levelHelp.textContent = PRESETS[level.value].help;
  }
  syncMode();

  dropzone(el.drop, {
    accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
    onFiles: (files) => load(files[0]),
    veilLabel: 'Drop your PDF',
    rejectMessage: () => 'That isn’t a PDF — please choose a .pdf file.'
  });

  $('[data-sample]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try { load(await samplePdf({ name: 'brochure-with-photos.pdf', title: 'Product brochure', pages: 3, seed: 1, withPhoto: true })); } catch (err) { toast(err.message, 'err'); }
    btn.disabled = false;
  });

  async function load(file) {
    invalidate();
    state.file = file;
    state.bytes = null;
    state.pages = 0;
    el.drop.hidden = true;
    el.fileCard.hidden = false;
    el.fileName.textContent = file.name;
    el.fileMeta.innerHTML = `<span class="tk-chip">${fmtBytes(file.size)}</span><span class="tk-chip">Reading…</span>`;
    el.thumb.innerHTML = icon('file');
    update();
    try {
      const bytes = await file.arrayBuffer();
      const lib = await pdfjs();
      const pdf = await lib.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      state.bytes = bytes;
      state.pages = pdf.numPages;
      el.fileMeta.innerHTML = `<span class="tk-chip is-hl">${fmtBytes(file.size)}</span><span class="tk-chip">${plural(pdf.numPages, 'page')}</span>`;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const view = page.getViewport({ scale: 260 / Math.max(vp.width, vp.height) });
      const c = document.createElement('canvas');
      c.width = Math.ceil(view.width); c.height = Math.ceil(view.height);
      await page.render({ canvasContext: c.getContext('2d'), viewport: view }).promise;
      el.thumb.innerHTML = '';
      el.thumb.appendChild(c);
      pdf.destroy();
    } catch (e) {
      const locked = e && e.name === 'PasswordException';
      el.fileMeta.innerHTML = `<span class="tk-chip is-err">${icon('alert')}${locked ? 'Password-protected — unlock it first' : 'This PDF couldn’t be read'}</span>`;
    }
    update();
  }

  function update() {
    el.run.disabled = state.busy || !state.bytes;
    el.hint.textContent = !state.file ? 'Add a PDF to begin.' : !state.bytes ? (state.pages ? '' : 'Choose a different file.') : `Ready to compress ${plural(state.pages, 'page')}.`;
    if (!state.result) tracker.set(state.file ? 2 : 1);
    mobile.refresh();
  }

  el.remove.addEventListener('click', reset);
  el.again.addEventListener('click', () => { reset(); el.drop.focus(); });
  function reset() {
    state.file = null; state.bytes = null; state.pages = 0;
    invalidate();
    el.fileCard.hidden = true;
    el.drop.hidden = false;
    update();
  }
  function invalidate() { state.result = null; el.result.hidden = true; }

  async function optimize() {
    const PDFLib = await pdflib();
    prog.set(0.3, 'Rebuilding the file structure…');
    const doc = await PDFLib.PDFDocument.load(state.bytes, { updateMetadata: false });
    prog.set(0.7, 'Writing the optimised file…');
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([bytes], { type: 'application/pdf' });
  }

  async function rasterize() {
    const { dpi, quality } = PRESETS[level.value];
    const gray = el.gray.checked;
    const [lib, PDFLib] = await Promise.all([pdfjs(), pdflib()]);
    const src = await lib.getDocument({ data: new Uint8Array(state.bytes.slice(0)) }).promise;
    const out = await PDFLib.PDFDocument.create();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    for (let i = 1; i <= src.numPages; i++) {
      prog.set((i - 1) / src.numPages, `Compressing page ${i} of ${src.numPages}`);
      const page = await src.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(dpi / 72, 5000 / Math.max(base.width, base.height));
      const vp = page.getViewport({ scale });
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      if (gray) {
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data;
        for (let p = 0; p < d.length; p += 4) { const y = d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114; d[p] = d[p + 1] = d[p + 2] = y; }
        ctx.putImageData(img, 0, 0);
      }
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      const jpg = await out.embedJpg(await blob.arrayBuffer());
      const pdfPage = out.addPage([base.width, base.height]);
      pdfPage.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
      page.cleanup();
    }
    src.destroy();
    prog.set(0.97, 'Saving…');
    const bytes = await out.save({ useObjectStreams: true });
    return new Blob([bytes], { type: 'application/pdf' });
  }

  el.run.addEventListener('click', async () => {
    if (state.busy || !state.bytes) return;
    state.busy = true;
    invalidate();
    update();
    try {
      const blob = mode.value === 'raster' ? await rasterize() : await optimize();
      prog.hide();
      const before = state.file.size;
      const after = blob.size;
      const smaller = after < before * 0.99;
      const pct = Math.round((1 - after / before) * 100);
      const name = `${baseName(state.file.name)}-compressed.pdf`;
      state.result = smaller ? { blob, name } : { blob: state.file, name: state.file.name };
      el.before.textContent = fmtBytes(before);
      el.after.textContent = fmtBytes(smaller ? after : before);
      el.barBefore.style.width = '100%';
      el.barAfter.style.width = `${Math.max(3, (smaller ? after / before : 1) * 100)}%`;
      el.resultTitle.textContent = smaller ? `${pct}% smaller` : 'Already as small as it gets';
      el.resultMeta.textContent = smaller ? `${name} · saved ${fmtBytes(before - after)}` : 'Compressing wouldn’t make this file smaller, so we kept your original.';
      el.note.hidden = smaller || mode.value === 'raster';
      el.dl.innerHTML = `${icon('download')}${smaller ? 'Download' : 'Download original'}`;
      el.result.hidden = false;
      tracker.set(4);
      reveal(el.result);
      if (smaller) { download(blob, name); toast(`Saved ${fmtBytes(before - after)} — download started`); }
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(/encrypt/i.test(e.message) ? 'This PDF is encrypted and can’t be optimised.' : `Compression failed: ${e.message}`, 'err');
    } finally {
      state.busy = false;
      update();
    }
  });

  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  $('#pcTryStrong').addEventListener('click', () => { mode.set('raster'); level.set('balanced'); el.run.click(); });
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdfjs').catch(() => {}); loadScript('pdflib').catch(() => {}); });
  update();
})();
