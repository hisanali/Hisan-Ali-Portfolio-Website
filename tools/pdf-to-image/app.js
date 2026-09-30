(function () {
  'use strict';
  const { $, fmtBytes, baseName, toast, download, dropzone, segmented, progress, parseRanges, pdfjs, jszip, canvasToBlob, canEncode } = window.TK;

  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const state = { file: null, bytes: null, pages: 0, busy: false, outputs: [], urls: [] };
  const el = {
    drop: $('#piDrop'), fileCard: $('#piFile'), fileName: $('#piFileName'), fileMeta: $('#piFileMeta'), thumb: $('#piThumb'), remove: $('#piRemove'),
    range: $('#piRange'), rangeHelp: $('#piRangeHelp'), quality: $('#piQuality'), qualityOut: $('#piQualityOut'), qualityField: $('#piQualityField'),
    run: $('#piRun'), hint: $('#piHint'), results: $('#piResults'), gallery: $('#piGallery'), resultMeta: $('#piResultMeta'), zip: $('#piZip')
  };
  const prog = progress($('#piProgress'));
  const format = segmented($('#piFormat'), () => { syncFormat(); });
  const dpi = segmented($('#piDpi'), updateHint);

  if (!canEncode('image/webp')) $('#piFormat [data-value="image/webp"]').remove();
  function syncFormat() { el.qualityField.hidden = format.value === 'image/png'; }
  syncFormat();
  el.quality.addEventListener('input', () => { el.qualityOut.textContent = `${Math.round(el.quality.value * 100)}%`; });
  el.range.addEventListener('input', updateHint);

  dropzone(el.drop, {
    accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
    onFiles: (files) => load(files[0]),
    rejectMessage: () => 'Please choose a PDF file.'
  });

  async function load(file) {
    clearOutputs();
    state.file = file;
    state.pages = 0;
    el.drop.hidden = true;
    el.fileCard.hidden = false;
    el.fileName.textContent = file.name;
    el.fileMeta.textContent = `${fmtBytes(file.size)} · reading…`;
    el.thumb.innerHTML = '<span class="fas fa-file-pdf" aria-hidden="true"></span>';
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
    } catch (e) {
      state.bytes = null;
      el.fileMeta.innerHTML = `<span class="is-err">${e && e.name === 'PasswordException' ? 'Password-protected PDF — unlock it first.' : 'This PDF could not be read.'}</span>`;
    }
    updateHint();
  }

  function selection() {
    try { return { pages: parseRanges(el.range.value, state.pages) }; } catch (e) { return { error: e.message }; }
  }

  function updateHint() {
    if (!state.bytes) { el.run.disabled = true; el.hint.textContent = state.file ? 'Choose a different file.' : 'Add a PDF to begin.'; return; }
    const sel = selection();
    el.range.classList.toggle('is-invalid', !!sel.error);
    el.rangeHelp.textContent = sel.error || `${sel.pages.length} of ${state.pages} page${state.pages === 1 ? '' : 's'} selected`;
    el.rangeHelp.style.color = sel.error ? 'var(--tk-err)' : '';
    el.run.disabled = state.busy || !!sel.error;
    el.hint.textContent = '';
  }

  el.remove.addEventListener('click', () => {
    state.file = null; state.bytes = null; state.pages = 0;
    clearOutputs();
    el.fileCard.hidden = true;
    el.drop.hidden = false;
    el.range.value = '';
    updateHint();
  });

  function clearOutputs() {
    state.urls.forEach((u) => URL.revokeObjectURL(u));
    state.urls = [];
    state.outputs = [];
    el.gallery.innerHTML = '';
    el.results.hidden = true;
  }

  el.run.addEventListener('click', async () => {
    const sel = selection();
    if (state.busy || sel.error) return;
    state.busy = true;
    el.run.disabled = true;
    clearOutputs();
    const type = format.value;
    const scale = Number(dpi.value) / 72;
    const quality = Number(el.quality.value);
    const stem = baseName(state.file.name);
    const pad = String(state.pages).length;
    try {
      const lib = await pdfjs();
      const pdf = await lib.getDocument({ data: new Uint8Array(state.bytes.slice(0)) }).promise;
      el.results.hidden = false;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      for (let n = 0; n < sel.pages.length; n++) {
        const pageNo = sel.pages[n] + 1;
        prog.set(n / sel.pages.length, `Rendering page ${pageNo} (${n + 1} of ${sel.pages.length})`);
        const page = await pdf.getPage(pageNo);
        const base = page.getViewport({ scale: 1 });
        const s = Math.min(scale, 8000 / Math.max(base.width, base.height));
        const vp = page.getViewport({ scale: s });
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (type !== 'image/png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        await page.render({ canvasContext: ctx, viewport: vp, background: type === 'image/png' ? 'rgba(255,255,255,1)' : undefined }).promise;
        const blob = await canvasToBlob(canvas, type, quality);
        const name = `${stem}-page-${String(pageNo).padStart(pad, '0')}.${EXT[type]}`;
        const url = URL.createObjectURL(blob);
        state.urls.push(url);
        state.outputs.push({ blob, name });
        el.gallery.insertAdjacentHTML('beforeend', `<figure class="tk-tile" style="margin:0">
          <div class="tk-tile-img"><img src="${url}" alt="Page ${pageNo}" loading="lazy"></div>
          <figcaption class="tk-tile-foot"><span>Page ${pageNo} · ${canvas.width}×${canvas.height}<br>${fmtBytes(blob.size)}</span>
          <button class="tk-icon-btn" type="button" data-i="${state.outputs.length - 1}" aria-label="Download page ${pageNo}" title="Download"><span class="fas fa-download" aria-hidden="true"></span></button></figcaption></figure>`);
        page.cleanup();
      }
      pdf.destroy();
      prog.hide();
      const total = state.outputs.reduce((s, o) => s + o.blob.size, 0);
      el.resultMeta.textContent = `${state.outputs.length} image${state.outputs.length === 1 ? '' : 's'} · ${fmtBytes(total)} · ${dpi.value} DPI`;
      el.zip.innerHTML = state.outputs.length === 1
        ? '<span class="fas fa-download" aria-hidden="true"></span> Download image'
        : '<span class="fas fa-file-zipper" aria-hidden="true"></span> Download all (.zip)';
      toast(`${state.outputs.length} page${state.outputs.length === 1 ? '' : 's'} converted`);
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(`Conversion failed: ${e.message}`, 'err');
    } finally {
      state.busy = false;
      updateHint();
    }
  });

  el.gallery.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) { const o = state.outputs[b.dataset.i]; download(o.blob, o.name); }
  });

  el.zip.addEventListener('click', async () => {
    if (!state.outputs.length) return;
    if (state.outputs.length === 1) { download(state.outputs[0].blob, state.outputs[0].name); return; }
    el.zip.disabled = true;
    try {
      const JSZip = await jszip();
      const zip = new JSZip();
      state.outputs.forEach((o) => zip.file(o.name, o.blob));
      const blob = await zip.generateAsync({ type: 'blob' }, (m) => prog.set(m.percent / 100, 'Packing ZIP…'));
      prog.hide();
      download(blob, `${baseName(state.file.name)}-images.zip`);
    } catch (e) { prog.hide(); toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  updateHint();
})();
