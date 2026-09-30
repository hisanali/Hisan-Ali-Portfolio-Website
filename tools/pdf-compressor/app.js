(function () {
  'use strict';
  const { $, fmtBytes, baseName, toast, download, dropzone, segmented, progress, pdflib, pdfjs, canvasToBlob } = window.TK;

  const PRESETS = {
    light: { dpi: 150, quality: 0.82, label: 'Light — sharp text, moderate savings' },
    balanced: { dpi: 110, quality: 0.68, label: 'Balanced — good for email and sharing' },
    strong: { dpi: 80, quality: 0.5, label: 'Strong — smallest file, softer detail' }
  };

  const state = { file: null, bytes: null, pages: 0, busy: false, result: null };
  const el = {
    drop: $('#pcDrop'), fileCard: $('#pcFile'), fileName: $('#pcFileName'), fileMeta: $('#pcFileMeta'), thumb: $('#pcThumb'), remove: $('#pcRemove'),
    modeHelp: $('#pcModeHelp'), rasterOpts: $('#pcRasterOpts'), levelHelp: $('#pcLevelHelp'), gray: $('#pcGray'),
    run: $('#pcRun'), hint: $('#pcHint'), result: $('#pcResult'), resultTitle: $('#pcResultTitle'), resultMeta: $('#pcResultMeta'),
    before: $('#pcBefore'), after: $('#pcAfter'), saved: $('#pcSaved'), note: $('#pcNote'), dl: $('#pcDownload'), again: $('#pcAgain')
  };
  const prog = progress($('#pcProgress'));
  const mode = segmented($('#pcMode'), () => { syncMode(); invalidate(); });
  const level = segmented($('#pcLevel'), () => { syncMode(); invalidate(); });
  el.gray.addEventListener('change', invalidate);

  function syncMode() {
    const raster = mode.value === 'raster';
    el.rasterOpts.hidden = !raster;
    el.modeHelp.textContent = raster
      ? 'Re-renders each page as a compressed image. Biggest savings, but text is no longer selectable.'
      : 'Rebuilds the file structure without touching content. Text stays selectable; savings depend on the file.';
    el.levelHelp.textContent = PRESETS[level.value].label;
  }
  syncMode();

  dropzone(el.drop, {
    accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
    onFiles: (files) => load(files[0]),
    rejectMessage: () => 'Please choose a PDF file.'
  });

  async function load(file) {
    invalidate();
    state.file = file;
    state.pages = 0;
    el.drop.hidden = true;
    el.fileCard.hidden = false;
    el.fileName.textContent = file.name;
    el.fileMeta.textContent = `${fmtBytes(file.size)} · reading…`;
    el.thumb.innerHTML = '<span class="fas fa-file-pdf" aria-hidden="true"></span>';
    el.run.disabled = true;
    try {
      state.bytes = await file.arrayBuffer();
      const lib = await pdfjs();
      const pdf = await lib.getDocument({ data: new Uint8Array(state.bytes.slice(0)) }).promise;
      state.pages = pdf.numPages;
      el.fileMeta.textContent = `${fmtBytes(file.size)} · ${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}`;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const view = page.getViewport({ scale: 120 / Math.max(vp.width, vp.height) });
      const c = document.createElement('canvas');
      c.width = Math.ceil(view.width); c.height = Math.ceil(view.height);
      await page.render({ canvasContext: c.getContext('2d'), viewport: view }).promise;
      el.thumb.innerHTML = '';
      el.thumb.appendChild(c);
      pdf.destroy();
      el.run.disabled = false;
      el.hint.textContent = '';
    } catch (e) {
      const locked = e && e.name === 'PasswordException';
      el.fileMeta.innerHTML = `<span class="is-err">${locked ? 'Password-protected PDF — unlock it first.' : 'This PDF could not be read.'}</span>`;
      el.hint.textContent = 'Choose a different file.';
    }
  }

  el.remove.addEventListener('click', reset);
  el.again.addEventListener('click', reset);
  function reset() {
    state.file = null; state.bytes = null;
    invalidate();
    el.fileCard.hidden = true;
    el.drop.hidden = false;
    el.run.disabled = true;
    el.hint.textContent = 'Add a PDF to begin.';
  }
  function invalidate() { state.result = null; el.result.hidden = true; }

  async function optimize() {
    const PDFLib = await pdflib();
    prog.set(0.3, 'Rebuilding document structure…');
    const doc = await PDFLib.PDFDocument.load(state.bytes, { ignoreEncryption: false, updateMetadata: false });
    prog.set(0.7, 'Writing optimised file…');
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
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    for (let i = 1; i <= src.numPages; i++) {
      prog.set((i - 1) / src.numPages, `Compressing page ${i} of ${src.numPages}`);
      const page = await src.getPage(i);
      const base = page.getViewport({ scale: 1 });
      // Keep huge pages from blowing past canvas limits.
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
    el.run.disabled = true;
    invalidate();
    try {
      const blob = mode.value === 'raster' ? await rasterize() : await optimize();
      prog.hide();
      const before = state.file.size;
      const after = blob.size;
      const smaller = after < before;
      const pct = Math.round((1 - after / before) * 100);
      const name = `${baseName(state.file.name)}-compressed.pdf`;
      state.result = smaller ? { blob, name } : { blob: state.file, name: state.file.name };
      el.before.textContent = fmtBytes(before);
      el.after.textContent = fmtBytes(after);
      el.saved.textContent = smaller ? `−${pct}%` : '0%';
      el.resultTitle.textContent = smaller ? `${pct}% smaller` : 'Already well compressed';
      el.resultMeta.textContent = smaller ? name : 'The compressed version wasn’t smaller, so your original is the best copy.';
      el.note.hidden = smaller || mode.value === 'raster';
      el.result.hidden = false;
      if (smaller) { download(blob, name); toast('Compressed PDF downloaded'); }
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(/encrypt/i.test(e.message) ? 'This PDF is encrypted and can’t be optimised.' : `Compression failed: ${e.message}`, 'err');
    } finally {
      state.busy = false;
      el.run.disabled = !state.bytes;
    }
  });

  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  $('#pcTryStrong').addEventListener('click', () => { mode.set('raster'); level.set('balanced'); el.run.click(); });
})();
