(function () {
  'use strict';
  const { $, icon, fmtBytes, plural, baseName, toast, download, dropzone, segmented, progress, steps, dock, reveal, parseRanges, pdflib, jszip, samplePdf, loadScript, pdfThumbs } = window.TK;

  const state = { file: null, bytes: null, doc: null, pages: 0, picked: new Set(), busy: false, result: null };
  const el = {
    drop: $('#psDrop'), work: $('#psWork'), fileName: $('#psFileName'), fileMeta: $('#psFileMeta'), change: $('#psChange'), grid: $('#psGrid'),
    every: $('#psEvery'), everyField: $('#psEveryField'), ranges: $('#psRanges'), rangesField: $('#psRangesField'), rangesHelp: $('#psRangesHelp'),
    pickField: $('#psPickField'), pickInfo: $('#psPickInfo'), pickAll: $('#psPickAll'), pickNone: $('#psPickNone'), modeHelp: $('#psModeHelp'),
    run: $('#psRun'), hint: $('#psHint'), result: $('#psResult'), resultTitle: $('#psResultTitle'), resultMeta: $('#psResultMeta'), dl: $('#psDownload'), again: $('#psAgain')
  };
  const prog = progress($('#psProgress'));
  const tracker = steps($('#tkSteps'));
  const HELP = {
    extract: 'Tap pages to pick them. They’re saved together as one new PDF.',
    each: 'Every page becomes its own PDF, downloaded together as a ZIP.',
    every: 'Cut the document into equal chunks — e.g. every 2 pages.',
    ranges: 'Each range becomes a separate PDF, e.g. 1-3, 4-8, 9-.'
  };
  const mode = segmented($('#psMode'), () => { sync(); invalidate(); update(); });
  const mobile = dock(el.run, () => plan().label || '');

  dropzone(el.drop, { accept: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name), onFiles: (f) => load(f[0]), veilLabel: 'Drop your PDF', rejectMessage: () => 'Please choose a PDF file.' });
  $('[data-sample]').addEventListener('click', async (e) => { const b = e.currentTarget; b.disabled = true; try { load(await samplePdf({ name: 'annual-report.pdf', title: 'Annual report', pages: 8, seed: 1 })); } catch (err) { toast(err.message, 'err'); } b.disabled = false; });

  function sync() {
    const m = mode.value;
    el.everyField.hidden = m !== 'every';
    el.rangesField.hidden = m !== 'ranges';
    el.pickField.hidden = m !== 'extract';
    el.modeHelp.textContent = HELP[m];
    el.grid.classList.toggle('is-picking', m === 'extract');
    paintGrid();
  }

  async function load(file) {
    invalidate();
    try {
      const PDFLib = await pdflib();
      const bytes = await file.arrayBuffer();
      const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
      if (doc.isEncrypted) throw new Error('This PDF is password-protected — unlock it first.');
      Object.assign(state, { file, bytes, doc, pages: doc.getPageCount(), picked: new Set() });
      el.drop.hidden = true;
      el.work.hidden = false;
      el.fileName.textContent = file.name;
      el.fileMeta.innerHTML = `<span class="tk-chip is-hl">${plural(state.pages, 'page')}</span><span class="tk-chip">${fmtBytes(file.size)}</span>`;
      el.grid.innerHTML = Array.from({ length: state.pages }, (_, i) => `<button type="button" class="pg-card" data-i="${i}" aria-pressed="false"><span class="pg-thumb"><span class="pg-ph"></span></span><span class="pg-num">${i + 1}</span><span class="pg-check">${icon('check')}</span></button>`).join('');
      sync();
      update();
      pdfThumbs(bytes, (i, c) => { const t = el.grid.querySelector(`[data-i="${i}"] .pg-thumb`); if (t) { t.innerHTML = ''; t.appendChild(c); } }).catch(() => {});
    } catch (e) { toast(/password/i.test(e.message) ? e.message : 'This PDF couldn’t be read.', 'err'); }
  }
  el.change.addEventListener('click', () => { Object.assign(state, { file: null, bytes: null, doc: null, pages: 0 }); el.work.hidden = true; el.drop.hidden = false; invalidate(); update(); });

  el.grid.addEventListener('click', (e) => {
    const card = e.target.closest('.pg-card');
    if (!card || mode.value !== 'extract') return;
    const i = Number(card.dataset.i);
    if (state.picked.has(i)) state.picked.delete(i); else state.picked.add(i);
    invalidate();
    paintGrid();
    update();
  });
  el.pickAll.addEventListener('click', () => { state.picked = new Set(Array.from({ length: state.pages }, (_, i) => i)); invalidate(); paintGrid(); update(); });
  el.pickNone.addEventListener('click', () => { state.picked.clear(); invalidate(); paintGrid(); update(); });
  [el.every, el.ranges].forEach((i) => i.addEventListener('input', () => { invalidate(); paintGrid(); update(); }));

  /** Returns { groups: [[pageIdx...]...], label, error }. */
  function plan() {
    const n = state.pages;
    if (!n) return { groups: [] };
    const m = mode.value;
    if (m === 'extract') {
      const p = [...state.picked].sort((a, b) => a - b);
      return { groups: p.length ? [p] : [], label: p.length ? `${plural(p.length, 'page')} → 1 PDF` : '', error: p.length ? '' : 'Tap the pages you want to keep.' };
    }
    if (m === 'each') return { groups: Array.from({ length: n }, (_, i) => [i]), label: `${n} separate PDFs` };
    if (m === 'every') {
      const k = Math.max(1, Math.floor(Number(el.every.value) || 1));
      const groups = [];
      for (let i = 0; i < n; i += k) groups.push(Array.from({ length: Math.min(k, n - i) }, (_, j) => i + j));
      return { groups, label: `${plural(groups.length, 'PDF')} of up to ${plural(k, 'page')}` };
    }
    const parts = el.ranges.value.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return { groups: [], error: 'Type at least one range, e.g. 1-3, 4-6.' };
    try {
      const groups = parts.map((p) => parseRanges(p, n));
      return { groups, label: `${plural(groups.length, 'PDF')} from your ranges` };
    } catch (e) { return { groups: [], error: e.message }; }
  }

  const TONES = ['#ffb48c', '#9dd4ff', '#a8e6c2', '#f5b9e2', '#ffe27a', '#c9b8ff', '#dfff63'];
  function paintGrid() {
    const p = plan();
    const groupOf = new Map();
    if (mode.value !== 'extract') p.groups.forEach((g, gi) => g.forEach((i) => groupOf.set(i, gi)));
    el.grid.querySelectorAll('.pg-card').forEach((card) => {
      const i = Number(card.dataset.i);
      const picked = mode.value === 'extract' && state.picked.has(i);
      card.setAttribute('aria-pressed', String(picked));
      const g = groupOf.get(i);
      card.style.setProperty('--g', g === undefined ? 'transparent' : TONES[g % TONES.length]);
      card.dataset.group = g === undefined ? '' : `File ${g + 1}`;
    });
  }

  function update() {
    const p = plan();
    el.rangesHelp.textContent = mode.value === 'ranges' ? (p.error || p.label || '') : '';
    el.rangesHelp.classList.toggle('is-err', !!p.error && mode.value === 'ranges');
    el.pickInfo.textContent = `${state.picked.size} of ${plural(state.pages, 'page')} selected`;
    el.run.disabled = state.busy || !p.groups.length;
    el.run.innerHTML = `${icon('scissors')}${p.groups.length > 1 ? `Split into ${p.groups.length} PDFs` : 'Create PDF'}`;
    el.hint.textContent = !state.file ? 'Add a PDF to begin.' : p.error || `Ready: ${p.label}.`;
    if (!state.result) tracker.set(state.file ? 2 : 1);
    mobile.refresh();
  }
  function invalidate() { state.result = null; el.result.hidden = true; }

  el.run.addEventListener('click', async () => {
    const p = plan();
    if (state.busy || !p.groups.length) return;
    state.busy = true;
    update();
    try {
      const PDFLib = await pdflib();
      const stem = baseName(state.file.name);
      const files = [];
      for (let g = 0; g < p.groups.length; g++) {
        prog.set(g / p.groups.length, `Building file ${g + 1} of ${p.groups.length}`);
        const out = await PDFLib.PDFDocument.create();
        (await out.copyPages(state.doc, p.groups[g])).forEach((pg) => out.addPage(pg));
        const bytes = await out.save({ useObjectStreams: true });
        const grp = p.groups[g];
        const label = grp.length === 1 ? `page-${grp[0] + 1}` : `pages-${grp[0] + 1}-${grp[grp.length - 1] + 1}`;
        files.push({ name: `${stem}-${mode.value === 'extract' ? 'extract' : label}.pdf`, blob: new Blob([bytes], { type: 'application/pdf' }) });
      }
      let blob; let name;
      if (files.length === 1) ({ blob, name } = files[0]);
      else {
        prog.set(0.95, 'Packing your ZIP…');
        const JSZip = await jszip();
        const zip = new JSZip();
        files.forEach((f) => zip.file(f.name, f.blob));
        blob = await zip.generateAsync({ type: 'blob' });
        name = `${stem}-split.zip`;
      }
      prog.hide();
      state.result = { blob, name };
      el.resultTitle.textContent = files.length > 1 ? `${files.length} PDFs ready` : 'Your PDF is ready';
      el.resultMeta.textContent = `${name} · ${fmtBytes(blob.size)}`;
      el.result.hidden = false;
      tracker.set(4);
      reveal(el.result);
      download(blob, name);
      toast(files.length > 1 ? 'ZIP downloaded' : 'PDF downloaded');
    } catch (e) { prog.hide(); toast(`Split failed: ${e.message}`, 'err'); }
    state.busy = false;
    update();
  });
  el.dl.addEventListener('click', () => state.result && download(state.result.blob, state.result.name));
  el.again.addEventListener('click', () => el.change.click());
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { loadScript('pdflib').catch(() => {}); loadScript('pdfjs').catch(() => {}); });
  sync();
  update();
})();
