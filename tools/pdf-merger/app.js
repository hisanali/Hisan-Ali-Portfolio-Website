(function () {
  'use strict';
  const { $, esc, fmtBytes, baseName, safeFileName, toast, download, dropzone, sortable, moveItem, parseRanges, progress, pdflib, pdfjs } = window.TK;

  const state = { files: [], busy: false, result: null };
  const el = {
    drop: $('#mgDrop'), list: $('#mgList'), listWrap: $('#mgListWrap'), count: $('#mgCount'),
    stFiles: $('#mgStatFiles'), stPages: $('#mgStatPages'), stSize: $('#mgStatSize'),
    name: $('#mgName'), run: $('#mgRun'), clear: $('#mgClear'), sortAz: $('#mgSortAz'), reverse: $('#mgReverse'),
    hint: $('#mgHint'), result: $('#mgResult'), resultMeta: $('#mgResultMeta'), dl: $('#mgDownload'), again: $('#mgAgain')
  };
  const prog = progress($('#mgProgress'));

  const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

  dropzone(el.drop, { accept: isPdf, onFiles: addFiles, rejectMessage: (n) => `${n} file${n > 1 ? 's' : ''} skipped — only PDF files can be merged.` });
  sortable(el.list, (from, to) => { moveItem(state.files, from, to); invalidate(); render(); });

  async function addFiles(files) {
    const PDFLib = await pdflib().catch((e) => { toast(e.message, 'err'); return null; });
    if (!PDFLib) return;
    for (const file of files) {
      const entry = { id: Math.random().toString(36).slice(2), file, pages: 0, range: '', rotate: 0, error: '', thumb: '', loading: true };
      state.files.push(entry);
      render();
      try {
        entry.bytes = await file.arrayBuffer();
        const doc = await PDFLib.PDFDocument.load(entry.bytes, { ignoreEncryption: true, updateMetadata: false });
        if (doc.isEncrypted) throw new Error('Password-protected — unlock it first.');
        entry.pages = doc.getPageCount();
        entry.doc = doc;
      } catch (e) {
        entry.error = /Password/.test(e.message) ? e.message : 'Unreadable or damaged PDF.';
      }
      entry.loading = false;
      invalidate();
      render();
      if (!entry.error) renderThumb(entry);
    }
    if (!el.name.value && state.files[0]) el.name.value = `${baseName(state.files[0].file.name)}-merged`;
  }

  async function renderThumb(entry) {
    try {
      const lib = await pdfjs();
      const pdf = await lib.getDocument({ data: new Uint8Array(entry.bytes.slice(0)) }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const scale = 104 / Math.max(vp.width, vp.height);
      const view = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(view.width);
      canvas.height = Math.ceil(view.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise;
      entry.thumb = canvas.toDataURL('image/png');
      pdf.destroy();
      render();
    } catch (e) { /* thumbnail is optional */ }
  }

  function selectedPages(entry) {
    try { return { pages: parseRanges(entry.range, entry.pages), error: '' }; } catch (e) { return { pages: [], error: e.message }; }
  }

  function render() {
    const has = state.files.length > 0;
    el.listWrap.hidden = !has;
    el.drop.classList.toggle('is-compact', has);
    el.list.innerHTML = state.files.map((f, i) => {
      const sel = f.error || f.loading ? null : selectedPages(f);
      const meta = f.loading ? '<span>Reading…</span>'
        : f.error ? `<span class="is-err">${esc(f.error)}</span>`
          : `<span>${f.pages} page${f.pages === 1 ? '' : 's'}</span><span>${fmtBytes(f.file.size)}</span>${sel.error ? `<span class="is-err">${esc(sel.error)}</span>` : f.range ? `<span class="is-ok">${sel.pages.length} selected</span>` : ''}${f.rotate ? `<span>Rotated ${f.rotate}°</span>` : ''}`;
      return `<li class="tk-item${f.error || (sel && sel.error) ? ' is-error' : ''}" data-id="${f.id}">
        <button class="tk-grip" type="button" data-grip aria-label="Reorder ${esc(f.file.name)} (use arrow keys)"><span class="fas fa-grip-vertical" aria-hidden="true"></span></button>
        <div class="tk-thumb is-contain">${f.thumb ? `<img src="${f.thumb}" alt="" style="transform:rotate(${f.rotate}deg)">` : '<span class="fas fa-file-pdf" aria-hidden="true"></span>'}</div>
        <div class="tk-item-main">
          <span class="tk-item-name" title="${esc(f.file.name)}">${i + 1}. ${esc(f.file.name)}</span>
          <div class="tk-item-meta">${meta}</div>
          ${f.pages > 1 ? `<div class="tk-item-extra"><input class="tk-input" data-range value="${esc(f.range)}" placeholder="Pages: all (e.g. 1-3, 7)" aria-label="Pages to include from ${esc(f.file.name)}"></div>` : ''}
        </div>
        <div class="tk-item-tools">
          <button class="tk-icon-btn" type="button" data-act="rotate" title="Rotate 90°" aria-label="Rotate" ${f.error ? 'disabled' : ''}><span class="fas fa-rotate-right" aria-hidden="true"></span></button>
          <button class="tk-icon-btn" type="button" data-act="up" title="Move up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}><span class="fas fa-arrow-up" aria-hidden="true"></span></button>
          <button class="tk-icon-btn" type="button" data-act="down" title="Move down" aria-label="Move down" ${i === state.files.length - 1 ? 'disabled' : ''}><span class="fas fa-arrow-down" aria-hidden="true"></span></button>
          <button class="tk-icon-btn is-danger" type="button" data-act="remove" title="Remove" aria-label="Remove"><span class="fas fa-xmark" aria-hidden="true"></span></button>
        </div>
      </li>`;
    }).join('');
    updateSummary();
  }

  function updateSummary() {
    const valid = state.files.filter((f) => !f.error && !f.loading);
    let pages = 0;
    let rangeError = false;
    valid.forEach((f) => { const s = selectedPages(f); if (s.error) rangeError = true; pages += s.pages.length; });
    el.count.textContent = `${state.files.length} file${state.files.length === 1 ? '' : 's'}`;
    el.stFiles.textContent = valid.length;
    el.stPages.textContent = pages;
    el.stSize.textContent = fmtBytes(valid.reduce((s, f) => s + f.file.size, 0));
    const loading = state.files.some((f) => f.loading);
    let hint = '';
    if (!state.files.length) hint = 'Add two or more PDFs to get started.';
    else if (loading) hint = 'Reading files…';
    else if (rangeError) hint = 'Fix the highlighted page range to continue.';
    else if (valid.length < 1) hint = 'None of the added files can be merged.';
    else if (valid.length === 1 && pages === valid[0].pages && !valid[0].rotate) hint = 'Add at least one more PDF to merge.';
    else if (state.files.length > valid.length) hint = 'Files marked in red will be skipped.';
    el.hint.textContent = hint;
    el.run.disabled = state.busy || loading || rangeError || !valid.length || (valid.length === 1 && pages === valid[0].pages && !valid[0].rotate);
  }

  el.list.addEventListener('input', (e) => {
    if (!e.target.matches('[data-range]')) return;
    const entry = state.files.find((f) => f.id === e.target.closest('li').dataset.id);
    entry.range = e.target.value;
    invalidate();
    const s = selectedPages(entry);
    const li = e.target.closest('li');
    li.classList.toggle('is-error', !!s.error);
    e.target.classList.toggle('is-invalid', !!s.error);
    const meta = li.querySelector('.tk-item-meta');
    meta.innerHTML = `<span>${entry.pages} pages</span><span>${fmtBytes(entry.file.size)}</span>${s.error ? `<span class="is-err">${esc(s.error)}</span>` : entry.range ? `<span class="is-ok">${s.pages.length} selected</span>` : ''}${entry.rotate ? `<span>Rotated ${entry.rotate}°</span>` : ''}`;
    updateSummary();
  });

  el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = state.files.findIndex((f) => f.id === btn.closest('li').dataset.id);
    const act = btn.dataset.act;
    if (act === 'remove') state.files.splice(i, 1);
    if (act === 'up' && i > 0) moveItem(state.files, i, i - 1);
    if (act === 'down' && i < state.files.length - 1) moveItem(state.files, i, i + 1);
    if (act === 'rotate') state.files[i].rotate = (state.files[i].rotate + 90) % 360;
    invalidate();
    render();
  });

  el.clear.addEventListener('click', () => { state.files = []; el.name.value = ''; invalidate(); render(); });
  el.sortAz.addEventListener('click', () => { state.files.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })); invalidate(); render(); });
  el.reverse.addEventListener('click', () => { state.files.reverse(); invalidate(); render(); });
  el.again.addEventListener('click', () => { el.clear.click(); window.scrollTo({ top: el.drop.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' }); });

  function invalidate() { state.result = null; el.result.hidden = true; }

  el.run.addEventListener('click', async () => {
    if (state.busy) return;
    state.busy = true;
    updateSummary();
    invalidate();
    try {
      const PDFLib = await pdflib();
      const out = await PDFLib.PDFDocument.create();
      const valid = state.files.filter((f) => !f.error && !f.loading);
      const total = valid.reduce((s, f) => s + selectedPages(f).pages.length, 0);
      let done = 0;
      for (const f of valid) {
        const indices = selectedPages(f).pages;
        const pages = await out.copyPages(f.doc, indices);
        for (const page of pages) {
          if (f.rotate) page.setRotation(PDFLib.degrees((page.getRotation().angle + f.rotate) % 360));
          out.addPage(page);
          done++;
          prog.set(done / total * 0.9, `Adding page ${done} of ${total}`);
        }
        await new Promise((r) => setTimeout(r));
      }
      prog.set(0.95, 'Saving merged PDF…');
      out.setProducer('hisanali.com PDF Merger');
      out.setCreator('hisanali.com');
      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = `${safeFileName(el.name.value.replace(/\.pdf$/i, ''), 'merged')}.pdf`;
      state.result = { blob, name };
      el.resultMeta.textContent = `${total} page${total === 1 ? '' : 's'} · ${fmtBytes(blob.size)} · ${name}`;
      el.result.hidden = false;
      prog.hide();
      download(blob, name);
      toast('Merged PDF downloaded');
    } catch (e) {
      prog.hide();
      console.error(e);
      toast(`Merge failed: ${e.message || 'unexpected error'}`, 'err');
    } finally {
      state.busy = false;
      updateSummary();
    }
  });

  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  render();
})();
