(function () {
  'use strict';
  const { $, icon, esc, fmtBytes, plural, baseName, toast, download, dropzone, segmented, progress, steps, dock, jszip, decodeImage, canvasToBlob, canEncode, sampleImage, loadScript } = window.TK;

  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' };
  const HELP = {
    'image/webp': 'WebP — the best all-rounder for websites.',
    'image/jpeg': 'JPG — works everywhere; no transparency.',
    'image/png': 'PNG — lossless and sharp; larger for photos.',
    'image/avif': 'AVIF — the smallest files in modern browsers.'
  };
  const state = { items: [], busy: false };
  const el = {
    drop: $('#icDrop'), listWrap: $('#icListWrap'), list: $('#icList'), count: $('#icCount'), clear: $('#icClear'), zip: $('#icZip'),
    quality: $('#icQuality'), qualityOut: $('#icQualityOut'), qualityField: $('#icQualityField'), formatHelp: $('#icFormatHelp'),
    resizeFields: $('#icResizeFields'), maxW: $('#icMaxW'), maxH: $('#icMaxH'), pct: $('#icPct'), pctOut: $('#icPctOut'), pctField: $('#icPctField'), dimField: $('#icDimField'),
    bgField: $('#icBgField'), bg: $('#icBg'), bgText: $('#icBgText'), summary: $('#icSummary'),
    run: $('#icRun'), hint: $('#icHint')
  };
  const prog = progress($('#icProgress'));
  const tracker = steps($('#tkSteps'));
  const valid = () => state.items.filter((i) => !i.error);
  const mobile = dock(el.run, () => `${plural(valid().length, 'image')} → ${EXT[format.value].toUpperCase()}`);

  ['image/avif', 'image/webp'].forEach((t) => { if (!canEncode(t)) $(`#icFormat [data-value="${t}"]`)?.remove(); });
  const format = segmented($('#icFormat'), sync);
  const resize = segmented($('#icResize'), sync);

  function sync() {
    const f = format.value;
    el.formatHelp.textContent = HELP[f];
    el.qualityField.hidden = f === 'image/png';
    el.bgField.hidden = f !== 'image/jpeg';
    el.resizeFields.hidden = resize.value === 'none';
    el.dimField.hidden = resize.value !== 'fit';
    el.pctField.hidden = resize.value !== 'pct';
    stale();
  }
  el.quality.addEventListener('input', () => { el.qualityOut.textContent = `${Math.round(el.quality.value * 100)}%`; stale(); });
  el.pct.addEventListener('input', () => { el.pctOut.textContent = `${el.pct.value}%`; stale(); });
  [el.maxW, el.maxH].forEach((i) => i.addEventListener('input', stale));
  el.bg.addEventListener('input', () => { el.bgText.value = el.bg.value; stale(); });
  el.bgText.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(el.bgText.value.trim())) { el.bg.value = el.bgText.value.trim(); stale(); } else el.bgText.value = el.bg.value; });

  const isImage = (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|svg|ico)$/i.test(f.name);
  dropzone(el.drop, { accept: isImage, onFiles: add, paste: true, veilLabel: 'Drop images to convert', rejectMessage: (n) => `${plural(n, 'non-image file')} skipped.` });

  $('[data-sample]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      add(await Promise.all([
        sampleImage({ name: 'hero-banner.png', w: 2400, h: 1350, seed: 0, type: 'image/png', label: 'Hero' }),
        sampleImage({ name: 'product-shot.png', w: 1600, h: 1600, seed: 3, type: 'image/png', label: 'Product' })
      ]));
    } catch (err) { toast(err.message, 'err'); }
    btn.disabled = false;
  });

  function add(files) {
    for (const file of files) {
      const it = { id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file), w: 0, h: 0, out: null, error: '' };
      state.items.push(it);
      decodeImage(file).then((d) => { it.w = d.width; it.h = d.height; d.close(); render(); }).catch(() => { it.error = 'Can’t read this image'; render(); });
    }
    render();
  }

  function stale() {
    let any = false;
    state.items.forEach((i) => { if (i.out) { URL.revokeObjectURL(i.out.url); i.out = null; any = true; } });
    if (any) render(); else updateSummary();
  }

  function targetSize(w, h) {
    if (resize.value === 'pct') { const k = el.pct.value / 100; return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))]; }
    if (resize.value === 'fit') {
      const mw = parseInt(el.maxW.value, 10) || Infinity;
      const mh = parseInt(el.maxH.value, 10) || Infinity;
      const k = Math.min(1, mw / w, mh / h);
      return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
    }
    return [w, h];
  }

  function render() {
    const has = state.items.length > 0;
    el.listWrap.hidden = !has;
    el.drop.hidden = has;
    el.count.textContent = plural(state.items.length, 'image');
    el.list.innerHTML = state.items.map((it) => {
      let meta;
      if (it.error) meta = `<span class="tk-chip is-err">${icon('alert')}${it.error}</span>`;
      else if (it.out) {
        const diff = Math.round((1 - it.out.blob.size / it.file.size) * 100);
        meta = `<span class="tk-chip">${fmtBytes(it.file.size)} → <b style="color:var(--tk-ink);margin-left:3px">${fmtBytes(it.out.blob.size)}</b></span><span class="tk-chip ${diff >= 0 ? 'is-ok' : 'is-err'}">${diff >= 0 ? `−${diff}%` : `+${-diff}%`}</span><span class="tk-chip">${it.out.w}×${it.out.h}</span>`;
      } else meta = `<span class="tk-chip">${it.w ? `${it.w}×${it.h}` : '…'}</span><span class="tk-chip">${fmtBytes(it.file.size)}</span><span class="tk-chip">${esc((it.file.type || '').replace('image/', '').replace('svg+xml', 'svg').toUpperCase() || 'IMAGE')}</span>`;
      return `<li class="tk-item is-plain${it.error ? ' is-error' : ''}" data-id="${it.id}">
        <div class="tk-thumb is-checker"><img src="${it.out ? it.out.url : it.url}" alt=""></div>
        <div class="tk-item-main"><span class="tk-item-name" title="${esc(it.file.name)}">${esc(it.out ? it.out.name : it.file.name)}</span><div class="tk-meta">${meta}</div></div>
        <div class="tk-item-tools">
          ${it.out ? `<button class="tk-btn tk-btn-sm tk-btn-dark" type="button" data-act="save">${icon('download')}Save</button>` : ''}
          <button class="tk-iconbtn is-danger" type="button" data-act="remove" aria-label="Remove ${esc(it.file.name)}" title="Remove">${icon('x')}</button>
        </div></li>`;
    }).join('');
    updateSummary();
  }

  function updateSummary() {
    const done = state.items.filter((i) => i.out);
    const n = valid().length;
    el.zip.hidden = done.length < 2;
    el.run.disabled = state.busy || !n;
    el.run.innerHTML = done.length && done.length === n
      ? `${icon('rotate')}Convert again`
      : `${icon('convert')}Convert ${n > 1 ? `${n} images` : 'image'}`;
    if (done.length) {
      const before = done.reduce((s, i) => s + i.file.size, 0);
      const after = done.reduce((s, i) => s + i.out.blob.size, 0);
      const pct = Math.round((1 - after / before) * 100);
      el.summary.hidden = false;
      el.summary.innerHTML = `<div class="tk-kpi" style="background:var(--tk-soft)"><b>${fmtBytes(before)}</b><span>Before</span></div><div class="tk-kpi" style="background:var(--tk-soft)"><b>${fmtBytes(after)}</b><span>After</span></div><div class="tk-kpi is-hl"><b>${pct >= 0 ? `−${pct}` : `+${-pct}`}%</b><span>${pct >= 0 ? 'Smaller' : 'Larger'}</span></div>`;
    } else el.summary.hidden = true;
    el.hint.textContent = !state.items.length ? 'Add images to begin.' : done.length ? 'Tip: change any setting to compare again.' : `Ready to convert ${plural(n, 'image')}.`;
    tracker.set(!state.items.length ? 1 : done.length ? 4 : 2);
    mobile.refresh();
  }

  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = state.items.findIndex((x) => x.id === b.closest('li').dataset.id);
    const it = state.items[i];
    if (b.dataset.act === 'save') download(it.out.blob, it.out.name);
    if (b.dataset.act === 'remove') { URL.revokeObjectURL(it.url); if (it.out) URL.revokeObjectURL(it.out.url); state.items.splice(i, 1); render(); }
  });
  el.clear.addEventListener('click', () => { state.items.forEach((i) => { URL.revokeObjectURL(i.url); if (i.out) URL.revokeObjectURL(i.out.url); }); state.items = []; render(); });

  async function convert(it) {
    const d = await decodeImage(it.file);
    const [w, h] = targetSize(d.width, d.height);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const type = format.value;
    if (type === 'image/jpeg') { ctx.fillStyle = el.bg.value; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = 'high';
    // Halve in steps for big reductions so edges stay smooth.
    let src = d.source; let sw = d.width; let sh = d.height;
    while (sw / 2 > w && sh / 2 > h) {
      const t = document.createElement('canvas');
      t.width = Math.round(sw / 2); t.height = Math.round(sh / 2);
      const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high';
      tc.drawImage(src, 0, 0, t.width, t.height);
      src = t; sw = t.width; sh = t.height;
    }
    ctx.drawImage(src, 0, 0, w, h);
    d.close();
    const blob = await canvasToBlob(c, type, Number(el.quality.value));
    return { blob, w, h, name: `${baseName(it.file.name)}.${EXT[type]}`, url: URL.createObjectURL(blob) };
  }

  el.run.addEventListener('click', async () => {
    if (state.busy || el.run.disabled) return;
    state.busy = true;
    stale();
    updateSummary();
    const todo = valid();
    let failed = 0;
    for (let n = 0; n < todo.length; n++) {
      prog.set(n / todo.length, `Converting ${n + 1} of ${todo.length}`);
      try { todo[n].out = await convert(todo[n]); } catch (e) { todo[n].error = e.message; failed++; }
    }
    prog.hide();
    state.busy = false;
    render();
    const ok = todo.length - failed;
    if (ok === 1 && todo.length === 1) { const o = todo[0].out; download(o.blob, o.name); toast('Converted — download started'); } else if (ok) toast(`${plural(ok, 'image')} converted — save them or download all`);
    if (failed) toast(`${plural(failed, 'image')} couldn’t be converted`, 'err');
  });

  el.zip.addEventListener('click', async () => {
    const done = state.items.filter((i) => i.out);
    el.zip.disabled = true;
    try {
      const JSZip = await jszip();
      const zip = new JSZip();
      const used = new Set();
      done.forEach((i) => {
        let name = i.out.name; let k = 2;
        while (used.has(name)) name = i.out.name.replace(/(\.\w+)$/, `-${k++}$1`);
        used.add(name);
        zip.file(name, i.out.blob);
      });
      download(await zip.generateAsync({ type: 'blob' }), 'converted-images.zip');
      toast('ZIP downloaded');
    } catch (e) { toast(e.message, 'err'); }
    el.zip.disabled = false;
  });

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => { loadScript('jszip').catch(() => {}); });
  sync();
  render();
})();
