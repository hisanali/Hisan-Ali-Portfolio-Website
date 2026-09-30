(function () {
  'use strict';
  const { $, icon, fmtBytes, plural, baseName, toast, download, dropzone, segmented, progress, steps, dock, reveal, parseRanges, pdfjs, jszip, canvasToBlob, canEncode, samplePdf, loadScript } = window.TK;

  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const DPI_HELP = { 72: '72 DPI — small files for screens and web.', 150: '150 DPI — sharp on any screen.', 300: '300 DPI — print quality, larger files.' };
  const state = { file: null, bytes: null, pages: 0, busy: false, outputs: [], urls: [] };
  const el = {
    drop: $('#piDrop'), fileCard: $('#piFile'), fileName: $('#piFileName'), fileMeta: $('#piFileMeta'), thumb: $('#piThumb'), remove: $('#piRemove'),
    range: $('#piRange'), rangeHelp: $('#piRangeHelp'), quality: $('#piQuality'), qualityOut: $('#piQualityOut'), qualityField: $('#piQualityField'), dpiHelp: $('#piDpiHelp'),
    run: $('#piRun'), hint: $('#piHint'), results: $('#piResults'), gallery: $('#piGallery'), resultMeta: $('#piResultMeta'), zip: $('#piZip')
  };
  const prog = progress($('#piProgress'));
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.run, () => { const s = selection(); return state.bytes && !s.error ? `${plural(s.pages.length, 'page')} · ${format.value.split('/')[1].toUpperCase().replace('JPEG', 'JPG')}` : ''; });

  if (!canEncode('image/webp')) $('#piFormat [data-value="image/webp"]').remove();
  const format = segmented($('#piFormat'), () => { syncFormat(); stale(); });
  const dpi = segmented($('#piDpi'), () => { el.dpiHelp.textContent = DPI_HELP[dpi.value]; stale(); });
  function syncFormat() { el.qualityField.hidden = format.value === 'image/png'; }
  syncFormat();
  el.quality.addEventListener('input', () => { el.qualityOut.textContent = `${Math.round(el.quality.value * 100)}%`; stale(); });
  el.range.addEventListener('input', () => { stale(); update(); });

  dropzone(el.drop, {
    accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
    onFiles: (files) => load(files[0]),
    veilLabel: 'Drop your PDF',
    rejectMessage: () => 'That isn’t a PDF — please choose a .pdf file.'
  });
  $('[data-sample]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try { load(await samplePdf({ name: 'slides.pdf', title: 'Quarterly review', pages: 4, seed: 2 })); } catch (err) { toast(err.message, 'err'); }
    btn.disabled = false;
  });

  async function load(file) {
    clearOutputs();
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
      el.fileMeta.innerHTML = `<span class="tk-chip is-hl">${plural(pdf.numPages, 'page')}</span><span class="tk-chip">${fmtBytes(file.size)}</span>`;
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
      el.fileMeta.innerHTML = `<span class="tk-chip is-err">${icon('alert')}${e && e.name === 'PasswordException' ? 'Password-protected — unlock it first' : 'This PDF couldn’t be read'}</span>`;
    }
    update();
  }

  function selection() {
    try { return { pages: parseRanges(el.range.value, state.pages) }; } catch (e) { return { pages: [], error: e.message }; }
  }

  function update() {
    if (!state.bytes) {
      el.run.disabled = true;
      el.rangeHelp.textContent = '';
      el.hint.textContent = state.file ? (state.pages ? '' : 'Choose a different file.') : 'Add a PDF to begin.';
    } else {
      const sel = selection();
      el.range.classList.toggle('is-invalid', !!sel.error);
      el.rangeHelp.classList.toggle('is-err', !!sel.error);
      el.rangeHelp.textContent = sel.error || (el.range.value.trim() ? `${sel.pages.length} of ${plural(state.pages, 'page')} selected` : `All ${plural(state.pages, 'page')}`);
      el.run.disabled = state.busy || !!sel.error;
      el.hint.textContent = sel.error ? 'Fix the page range to continue.' : `Ready to export ${plural(sel.pages.length, 'page')}.`;
    }
    if (!state.outputs.length) tracker.set(state.file ? 2 : 1);
    mobile.refresh();
  }

  el.remove.addEventListener('click', () => {
    state.file = null; state.bytes = null; state.pages = 0;
    clearOutputs();
    el.fileCard.hidden = true;
    el.drop.hidden = false;
    el.range.value = '';
    update();
  });

  function stale() { if (state.outputs.length && !state.busy) { clearOutputs(); update(); } }
  function clearOutputs() {
    state.urls.forEach((u) => URL.revokeObjectURL(u));
    state.urls = [];
    state.outputs = [];
    el.gallery.innerHTML = '';
    el.results.hidden = true;
  }

  el.run.addEventListener('click', async () => {
    const sel = selection();
    if (state.busy || sel.error || !state.bytes) return;
    state.busy = true;
    clearOutputs();
    update();
    const type = format.value;
    const scale = Number(dpi.value) / 72;
    const quality = Number(el.quality.value);
    const stem = baseName(state.file.name);
    const pad = String(state.pages).length;
    try {
      const lib = await pdfjs();
      const pdf = await lib.getDocument({ data: new Uint8Array(state.bytes.slice(0)) }).promise;
      el.results.hidden = false;
      el.resultMeta.textContent = 'Rendering…';
      reveal(el.results);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      for (let n = 0; n < sel.pages.length; n++) {
        const pageNo = sel.pages[n] + 1;
        prog.set(n / sel.pages.length, `Rendering page ${pageNo} (${n + 1} of ${sel.pages.length})`);
        const page = await pdf.getPage(pageNo);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: Math.min(scale, 8000 / Math.max(base.width, base.height)) });
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const blob = await canvasToBlob(canvas, type, quality);
        const name = `${stem}-page-${String(pageNo).padStart(pad, '0')}.${EXT[type]}`;
        const url = URL.createObjectURL(blob);
        state.urls.push(url);
        state.outputs.push({ blob, name });
        el.gallery.insertAdjacentHTML('beforeend', `<figure class="tk-tile">
          <div class="tk-tile-img"><img src="${url}" alt="Page ${pageNo}" loading="lazy"></div>
          <figcaption><span><b>Page ${pageNo} · ${fmtBytes(blob.size)}</b>${canvas.width} × ${canvas.height} px</span>
          <button class="tk-iconbtn" type="button" data-i="${state.outputs.length - 1}" aria-label="Download page ${pageNo}" title="Download">${icon('download')}</button></figcaption></figure>`);
        page.cleanup();
      }
      pdf.destroy();
      prog.hide();
      const total = state.outputs.reduce((s, o) => s + o.blob.size, 0);
      el.resultMeta.textContent = `${plural(state.outputs.length, 'image')} · ${fmtBytes(total)} · ${dpi.value} DPI ${type.split('/')[1].toUpperCase().replace('JPEG', 'JPG')}`;
      el.zip.innerHTML = state.outputs.length === 1 ? `${icon('download')}Download image` : `${icon('zip')}Download all (.zip)`;
      tracker.set(4);
      toast(`${plural(state.outputs.length, 'page')} converted`);
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(`Conversion failed: ${e.message}`, 'err');
    } finally {
      state.busy = false;
      update();
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
      const blob = await zip.generateAsync({ type: 'blob' }, (m) => prog.set(m.percent / 100, 'Packing your ZIP…'));
      prog.hide();
      download(blob, `${baseName(state.file.name)}-images.zip`);
      toast('ZIP downloaded');
    } catch (e) { prog.hide(); toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdfjs').catch(() => {}); });
  update();
})();
