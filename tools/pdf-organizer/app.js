(function () {
  'use strict';
  const { $, icon, esc, fmtBytes, plural, baseName, safeFileName, toast, download, dropzone, progress, steps, dock, reveal, pdflib, samplePdf, loadScript, pdfThumbs } = window.TK;

  // Each page: { id, src (index into sources), index, rotate, thumb (canvas|null) }
  const state = { sources: [], pages: [], busy: false, result: null, name: '' };
  const el = {
    drop: $('#poDrop'), work: $('#poWork'), grid: $('#poGrid'), count: $('#poCount'), clear: $('#poClear'), name: $('#poName'),
    run: $('#poRun'), hint: $('#poHint'), result: $('#poResult'), resultMeta: $('#poResultMeta'), dl: $('#poDownload'), again: $('#poAgain'), rotAll: $('#poRotAll')
  };
  const prog = progress($('#poProgress'));
  const tracker = steps($('#tkSteps'));
  const mobile = dock(el.run, () => plural(state.pages.length, 'page'));
  let uid = 0;

  dropzone(el.drop, { accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name), onFiles: add, veilLabel: 'Drop PDFs to add their pages', rejectMessage: () => 'Only PDF files can be added.' });
  $('[data-sample]').addEventListener('click', async (e) => { const b = e.currentTarget; b.disabled = true; try { add([await samplePdf({ name: 'scanned-pack.pdf', title: 'Scanned pack', pages: 6, seed: 3 })]); } catch (err) { toast(err.message, 'err'); } b.disabled = false; });

  async function add(files) {
    const PDFLib = await pdflib().catch((e) => { toast(e.message, 'err'); return null; });
    if (!PDFLib) return;
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        if (doc.isEncrypted) throw new Error('locked');
        const src = state.sources.push({ file, bytes, doc }) - 1;
        const fresh = Array.from({ length: doc.getPageCount() }, (_, i) => ({ id: ++uid, src, index: i, rotate: 0, thumb: null }));
        state.pages.push(...fresh);
        if (!state.name) { state.name = `${baseName(file.name)}-organized`; el.name.value = state.name; }
        invalidate();
        render();
        pdfThumbs(bytes, (i, c) => { fresh[i].thumb = c; const t = el.grid.querySelector(`[data-id="${fresh[i].id}"] .pg-thumb`); if (t) { t.innerHTML = ''; t.appendChild(c); applyRotate(fresh[i]); } }).catch(() => {});
      } catch (e) { toast(e.message === 'locked' ? `${file.name} is password-protected.` : `${file.name} couldn’t be read.`, 'err'); }
    }
  }

  function applyRotate(p) { const c = el.grid.querySelector(`[data-id="${p.id}"] canvas`); if (c) c.style.transform = `rotate(${p.rotate}deg)`; }

  function render() {
    const has = state.pages.length > 0;
    el.drop.hidden = has;
    el.work.hidden = !has;
    el.count.textContent = plural(state.pages.length, 'page');
    el.grid.innerHTML = state.pages.map((p, i) => `<li class="pg-card is-org" data-id="${p.id}">
        <span class="pg-thumb" data-grip title="Drag to move">${p.thumb ? '' : '<span class="pg-ph"></span>'}</span>
        <span class="pg-num">${i + 1}<small>${state.sources.length > 1 ? `${esc(baseName(state.sources[p.src].file.name).slice(0, 14))} · ` : ''}original p${p.index + 1}</small></span>
        <span class="pg-tools">
          <button class="tk-iconbtn" type="button" data-act="left" aria-label="Move page ${i + 1} earlier" ${i === 0 ? 'disabled' : ''}>${icon('arrow')}</button>
          <button class="tk-iconbtn" type="button" data-act="rotate" aria-label="Rotate page ${i + 1}">${icon('rotate')}</button>
          <button class="tk-iconbtn is-danger" type="button" data-act="delete" aria-label="Delete page ${i + 1}">${icon('trash')}</button>
          <button class="tk-iconbtn" type="button" data-act="right" aria-label="Move page ${i + 1} later" ${i === state.pages.length - 1 ? 'disabled' : ''}>${icon('arrow')}</button>
        </span></li>`).join('');
    state.pages.forEach((p) => { if (p.thumb) { const t = el.grid.querySelector(`[data-id="${p.id}"] .pg-thumb`); t.appendChild(p.thumb); applyRotate(p); } });
    update();
  }

  function update() {
    const n = state.pages.length;
    el.run.disabled = state.busy || !n;
    el.hint.textContent = !n ? 'Add a PDF to begin.' : `Ready: ${plural(n, 'page')} in this order.`;
    if (!state.result) tracker.set(n ? 2 : 1);
    mobile.refresh();
  }
  function invalidate() { state.result = null; el.result.hidden = true; }

  el.grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = state.pages.findIndex((p) => p.id === Number(b.closest('li').dataset.id));
    const p = state.pages[i];
    const act = b.dataset.act;
    if (act === 'rotate') { p.rotate = (p.rotate + 90) % 360; applyRotate(p); invalidate(); update(); return; }
    if (act === 'delete') state.pages.splice(i, 1);
    if (act === 'left' && i > 0) state.pages.splice(i - 1, 0, state.pages.splice(i, 1)[0]);
    if (act === 'right' && i < state.pages.length - 1) state.pages.splice(i + 1, 0, state.pages.splice(i, 1)[0]);
    invalidate();
    render();
    const again = act !== 'delete' && el.grid.querySelector(`[data-id="${p.id}"] [data-act="${act}"]`);
    if (again && !again.disabled) again.focus();
  });

  // Drag a page thumbnail to reorder the grid (mouse, pen and touch).
  el.grid.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('[data-grip]');
    if (!grip || e.button > 0) return;
    const card = grip.closest('li');
    e.preventDefault();
    card.classList.add('is-dragging');
    let moved = false;
    const move = (ev) => {
      moved = true;
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.pg-card');
      if (!over || over === card || over.parentElement !== el.grid) return;
      const r = over.getBoundingClientRect();
      el.grid.insertBefore(card, ev.clientX > r.left + r.width / 2 ? over.nextSibling : over);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      card.classList.remove('is-dragging');
      if (!moved) return;
      const order = Array.from(el.grid.children).map((li) => Number(li.dataset.id));
      state.pages.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      invalidate();
      render();
    };
    // Listen on window: moving the card in the DOM releases pointer capture.
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });

  el.rotAll.addEventListener('click', () => { state.pages.forEach((p) => { p.rotate = (p.rotate + 90) % 360; applyRotate(p); }); invalidate(); update(); });
  el.clear.addEventListener('click', () => { state.sources = []; state.pages = []; state.name = ''; el.name.value = ''; invalidate(); render(); });
  el.again.addEventListener('click', () => el.clear.click());
  el.name.addEventListener('input', invalidate);

  el.run.addEventListener('click', async () => {
    if (state.busy || !state.pages.length) return;
    state.busy = true;
    update();
    try {
      const PDFLib = await pdflib();
      const out = await PDFLib.PDFDocument.create();
      for (let i = 0; i < state.pages.length; i++) {
        const p = state.pages[i];
        prog.set(i / state.pages.length, `Adding page ${i + 1} of ${state.pages.length}`);
        const [pg] = await out.copyPages(state.sources[p.src].doc, [p.index]);
        if (p.rotate) pg.setRotation(PDFLib.degrees((pg.getRotation().angle + p.rotate) % 360));
        out.addPage(pg);
      }
      prog.set(0.96, 'Saving…');
      const bytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = `${safeFileName(el.name.value.replace(/\.pdf$/i, ''), 'organized')}.pdf`;
      state.result = { blob, name };
      prog.hide();
      el.resultMeta.textContent = `${name} · ${plural(state.pages.length, 'page')} · ${fmtBytes(blob.size)}`;
      el.result.hidden = false;
      tracker.set(4);
      reveal(el.result);
      download(blob, name);
      toast('PDF downloaded');
    } catch (e) { prog.hide(); toast(`Couldn’t save the PDF: ${e.message}`, 'err'); }
    state.busy = false;
    update();
  });
  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdflib').catch(() => {}); loadScript('pdfjs').catch(() => {}); });
  render();
})();
