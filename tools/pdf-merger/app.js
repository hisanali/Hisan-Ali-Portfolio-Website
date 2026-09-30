(function () {
  'use strict';
  const { $, icon, esc, fmtBytes, plural, baseName, safeFileName, toast, download, dropzone, sortable, moveItem, parseRanges, progress, steps, dock, reveal, pdflib, pdfjs, samplePdf, loadScript } = window.TK;

  const state = { files: [], busy: false, result: null };
  const el = {
    drop: $('#mgDrop'), list: $('#mgList'), listWrap: $('#mgListWrap'), count: $('#mgCount'),
    stFiles: $('#mgStatFiles'), stPages: $('#mgStatPages'), stSize: $('#mgStatSize'),
    name: $('#mgName'), run: $('#mgRun'), clear: $('#mgClear'), sortAz: $('#mgSortAz'), reverse: $('#mgReverse'),
    hint: $('#mgHint'), result: $('#mgResult'), resultMeta: $('#mgResultMeta'), dl: $('#mgDownload'), again: $('#mgAgain')
  };
  const prog = progress($('#mgProgress'));
  const tracker = steps($('#tkSteps'));
  const totals = () => {
    const valid = state.files.filter((f) => !f.error && !f.loading);
    return { valid, pages: valid.reduce((s, f) => s + (selectedPages(f).pages.length || 0), 0) };
  };
  const mobile = dock(el.run, () => { const t = totals(); return `${plural(t.valid.length, 'file')} · ${plural(t.pages, 'page')}`; });

  const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  dropzone(el.drop, { accept: isPdf, onFiles: addFiles, veilLabel: 'Drop PDFs to add them', rejectMessage: (n) => `${plural(n, 'file')} skipped — only PDFs can be merged.` });
  sortable(el.list, (from, to) => { moveItem(state.files, from, to); invalidate(); render(); });

  $('[data-sample]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      addFiles(await Promise.all([
        samplePdf({ name: 'proposal.pdf', title: 'Project proposal', pages: 3, seed: 0 }),
        samplePdf({ name: 'pricing.pdf', title: 'Pricing & timeline', pages: 2, seed: 2 }),
        samplePdf({ name: 'appendix.pdf', title: 'Appendix', pages: 2, seed: 4 })
      ]));
    } catch (err) { toast(err.message, 'err'); }
    b.disabled = false;
  });

  async function addFiles(files) {
    const PDFLib = await pdflib().catch((e) => { toast(e.message, 'err'); return null; });
    if (!PDFLib) return;
    const added = files.map((file) => ({ id: Math.random().toString(36).slice(2), file, pages: 0, range: '', rotate: 0, error: '', thumb: '', loading: true }));
    state.files.push(...added);
    invalidate();
    render();
    for (const entry of added) {
      try {
        entry.bytes = await entry.file.arrayBuffer();
        const doc = await PDFLib.PDFDocument.load(entry.bytes, { ignoreEncryption: true, updateMetadata: false });
        if (doc.isEncrypted) throw new Error('Password-protected — unlock it first');
        entry.pages = doc.getPageCount();
        entry.doc = doc;
      } catch (e) {
        entry.error = /Password/.test(e.message) ? e.message : 'Unreadable or damaged PDF';
      }
      entry.loading = false;
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
      const view = page.getViewport({ scale: 128 / Math.max(vp.width, vp.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(view.width);
      canvas.height = Math.ceil(view.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise;
      entry.thumb = canvas.toDataURL('image/png');
      pdf.destroy();
      render();
    } catch (e) { /* the preview is optional */ }
  }

  function selectedPages(entry) {
    if (entry.error || entry.loading) return { pages: [], error: '' };
    try { return { pages: parseRanges(entry.range, entry.pages), error: '' }; } catch (e) { return { pages: [], error: e.message }; }
  }

  function metaHtml(f) {
    if (f.loading) return '<span class="tk-chip">Reading…</span>';
    if (f.error) return `<span class="tk-chip is-err">${icon('alert')}${esc(f.error)}</span>`;
    const sel = selectedPages(f);
    return `<span class="tk-chip">${plural(f.pages, 'page')}</span><span class="tk-chip">${fmtBytes(f.file.size)}</span>${sel.error ? `<span class="tk-chip is-err">${esc(sel.error)}</span>` : f.range ? `<span class="tk-chip is-ok">${icon('check')}${sel.pages.length} selected</span>` : ''}${f.rotate ? `<span class="tk-chip is-hl">${icon('rotate')}${f.rotate}°</span>` : ''}`;
  }

  function render() {
    const has = state.files.length > 0;
    el.listWrap.hidden = !has;
    el.drop.hidden = has;
    el.list.innerHTML = state.files.map((f, i) => `<li class="tk-item${f.error || selectedPages(f).error ? ' is-error' : ''}" data-id="${f.id}">
        <button class="tk-grip" type="button" data-grip aria-label="Move ${esc(f.file.name)} — drag, or use arrow keys">${icon('grip')}</button>
        <div class="tk-thumb">${f.thumb ? `<img src="${f.thumb}" alt="" style="transform:rotate(${f.rotate}deg)">` : icon('file')}<span class="tk-n">${i + 1}</span></div>
        <div class="tk-item-main">
          <span class="tk-item-name" title="${esc(f.file.name)}">${esc(f.file.name)}</span>
          <div class="tk-meta">${metaHtml(f)}</div>
          ${f.pages > 1 ? `<div class="tk-item-extra"><input class="tk-input${selectedPages(f).error ? ' is-invalid' : ''}" data-range value="${esc(f.range)}" placeholder="All pages — or e.g. 1-3, 7" aria-label="Pages to include from ${esc(f.file.name)}" spellcheck="false"></div>` : ''}
        </div>
        <div class="tk-item-tools">
          <button class="tk-iconbtn" type="button" data-act="rotate" title="Rotate 90°" aria-label="Rotate ${esc(f.file.name)}" ${f.error ? 'disabled' : ''}>${icon('rotate')}</button>
          <button class="tk-iconbtn" type="button" data-act="up" title="Move up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
          <button class="tk-iconbtn" type="button" data-act="down" title="Move down" aria-label="Move down" ${i === state.files.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
          <button class="tk-iconbtn is-danger" type="button" data-act="remove" title="Remove" aria-label="Remove ${esc(f.file.name)}">${icon('x')}</button>
        </div>
      </li>`).join('');
    updateSummary();
  }

  function updateSummary() {
    const { valid, pages } = totals();
    const loading = state.files.some((f) => f.loading);
    const rangeError = valid.some((f) => selectedPages(f).error);
    el.count.textContent = plural(state.files.length, 'file');
    el.stFiles.textContent = valid.length;
    el.stPages.textContent = pages;
    el.stSize.textContent = fmtBytes(valid.reduce((s, f) => s + f.file.size, 0));
    const single = valid.length === 1 && !valid[0].range && !valid[0].rotate;
    let hint = '';
    if (!state.files.length) hint = 'Add two or more PDFs to get started.';
    else if (loading) hint = 'Reading your files…';
    else if (rangeError) hint = 'Fix the highlighted page range to continue.';
    else if (!valid.length) hint = 'None of these files can be merged.';
    else if (single) hint = 'Add another PDF — or pick pages or rotate to save a new copy.';
    else if (state.files.length > valid.length) hint = 'Files marked in red will be skipped.';
    else hint = `Ready: ${plural(pages, 'page')} from ${plural(valid.length, 'file')}.`;
    el.hint.textContent = hint;
    el.run.disabled = state.busy || loading || rangeError || !valid.length || single;
    if (!state.result) tracker.set(state.files.length ? 2 : 1);
    mobile.refresh();
  }

  el.list.addEventListener('input', (e) => {
    if (!e.target.matches('[data-range]')) return;
    const li = e.target.closest('li');
    const entry = state.files.find((f) => f.id === li.dataset.id);
    entry.range = e.target.value;
    invalidate();
    const sel = selectedPages(entry);
    li.classList.toggle('is-error', !!sel.error);
    e.target.classList.toggle('is-invalid', !!sel.error);
    li.querySelector('.tk-meta').innerHTML = metaHtml(entry);
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
    const again = el.list.querySelector(`[data-id="${state.files[Math.min(i, state.files.length - 1)]?.id}"] [data-act="${act}"]`);
    if (again && !again.disabled && act !== 'remove') again.focus();
  });

  el.clear.addEventListener('click', () => { state.files = []; el.name.value = ''; invalidate(); render(); });
  el.sortAz.addEventListener('click', () => { state.files.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })); invalidate(); render(); });
  el.reverse.addEventListener('click', () => { state.files.reverse(); invalidate(); render(); });
  el.again.addEventListener('click', () => { el.clear.click(); el.drop.focus(); });

  function invalidate() {
    if (!state.result && el.result.hidden) return;
    state.result = null;
    el.result.hidden = true;
  }

  el.run.addEventListener('click', async () => {
    if (state.busy || el.run.disabled) return;
    state.busy = true;
    invalidate();
    updateSummary();
    try {
      const PDFLib = await pdflib();
      const out = await PDFLib.PDFDocument.create();
      const { valid, pages: total } = totals();
      let done = 0;
      for (const f of valid) {
        const copied = await out.copyPages(f.doc, selectedPages(f).pages);
        for (const page of copied) {
          if (f.rotate) page.setRotation(PDFLib.degrees((page.getRotation().angle + f.rotate) % 360));
          out.addPage(page);
          done++;
          prog.set(done / total * 0.9, `Adding page ${done} of ${total}`);
        }
        await new Promise((r) => setTimeout(r));
      }
      prog.set(0.95, 'Saving your PDF…');
      out.setProducer('hisanali.com PDF Merger');
      out.setCreator('hisanali.com');
      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = `${safeFileName(el.name.value.replace(/\.pdf$/i, ''), 'merged')}.pdf`;
      state.result = { blob, name };
      prog.hide();
      el.resultMeta.textContent = `${name} · ${plural(total, 'page')} · ${fmtBytes(blob.size)}`;
      el.result.hidden = false;
      tracker.set(4);
      reveal(el.result);
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
  el.name.addEventListener('input', invalidate);
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdflib').catch(() => {}); loadScript('pdfjs').catch(() => {}); });
  render();
})();
