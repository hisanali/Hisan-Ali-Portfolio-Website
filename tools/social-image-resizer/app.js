(function () {
  'use strict';
  const { $, $$, icon, esc, fmtBytes, plural, baseName, toast, download, dropzone, segmented, progress, steps, dock, jszip, decodeImage, canvasToBlob, sampleImage, loadScript } = window.TK;

  const SIZES = [
    ['ig-post', 'Instagram', 'Square post', 1080, 1080],
    ['ig-portrait', 'Instagram', 'Portrait post', 1080, 1350],
    ['ig-story', 'Instagram', 'Story / Reel', 1080, 1920],
    ['fb-post', 'Facebook', 'Link / feed post', 1200, 630],
    ['fb-cover', 'Facebook', 'Page cover', 851, 315],
    ['li-post', 'LinkedIn', 'Feed post', 1200, 627],
    ['li-banner', 'LinkedIn', 'Profile banner', 1584, 396],
    ['x-post', 'X / Twitter', 'Post image', 1600, 900],
    ['x-header', 'X / Twitter', 'Header', 1500, 500],
    ['yt-thumb', 'YouTube', 'Thumbnail', 1280, 720],
    ['yt-banner', 'YouTube', 'Channel banner', 2560, 1440],
    ['tiktok', 'TikTok', 'Video cover', 1080, 1920],
    ['pin', 'Pinterest', 'Pin', 1000, 1500],
    ['wa-status', 'WhatsApp', 'Status', 1080, 1920]
  ];
  const DEFAULT_ON = ['ig-post', 'ig-portrait', 'ig-story', 'fb-post', 'li-post', 'yt-thumb'];

  const state = { file: null, img: null, focus: { x: 0.5, y: 0.5 }, outputs: [], urls: [], busy: false, timer: 0 };
  const el = {
    drop: $('#srDrop'), work: $('#srWork'), source: $('#srSource'), sourceImg: $('#srSourceImg'), dot: $('#srDot'), srcMeta: $('#srSrcMeta'), change: $('#srChange'),
    sizes: $('#srSizes'), all: $('#srAll'), none: $('#srNone'), bg: $('#srBg'), bgText: $('#srBgText'), bgField: $('#srBgField'), format: $('#srFormat'),
    gallery: $('#srGallery'), run: $('#srRun'), hint: $('#srHint'), count: $('#srCount')
  };
  const prog = progress($('#srProgress'));
  const tracker = steps($('#tkSteps'));
  const fit = segmented($('#srFit'), () => { el.bgField.hidden = fit.value === 'fill'; schedule(); });
  const mobile = dock(el.run, () => `${plural(selected().length, 'size')} selected`);
  el.bgField.hidden = fit.value === 'fill';

  el.sizes.innerHTML = SIZES.map(([id, net, name, w, h]) => `<label class="sr-size"><input type="checkbox" value="${id}" ${DEFAULT_ON.includes(id) ? 'checked' : ''}><span><b>${net}</b>${name}<small>${w} × ${h}</small></span><i style="aspect-ratio:${w}/${h}"></i></label>`).join('');
  const selected = () => $$('input:checked', el.sizes).map((c) => SIZES.find((s) => s[0] === c.value));

  dropzone(el.drop, { accept: (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i.test(f.name), onFiles: (f) => load(f[0]), paste: true, veilLabel: 'Drop your image', rejectMessage: () => 'Please choose an image.' });
  $('[data-sample]').addEventListener('click', async (e) => { const b = e.currentTarget; b.disabled = true; try { load(await sampleImage({ name: 'campaign-photo.jpg', w: 2400, h: 1600, seed: 1, label: 'Summer sale' })); } catch (err) { toast(err.message, 'err'); } b.disabled = false; });

  async function load(file) {
    try {
      const d = await decodeImage(file);
      if (state.img) state.img.close();
      state.img = d;
      state.file = file;
      state.focus = { x: 0.5, y: 0.5 };
      if (el.sourceImg.src) URL.revokeObjectURL(el.sourceImg.src);
      el.sourceImg.src = URL.createObjectURL(file);
      el.srcMeta.innerHTML = `<span class="tk-chip is-hl">${d.width} × ${d.height}</span><span class="tk-chip">${fmtBytes(file.size)}</span>`;
      el.drop.hidden = true;
      el.work.hidden = false;
      placeDot();
      schedule();
    } catch (e) { toast(e.message, 'err'); }
  }
  el.change.addEventListener('click', () => { el.drop.hidden = false; el.work.hidden = true; clear(); update(); });

  function placeDot() { el.dot.style.left = `${state.focus.x * 100}%`; el.dot.style.top = `${state.focus.y * 100}%`; }
  el.source.addEventListener('click', (e) => {
    const r = el.sourceImg.getBoundingClientRect();
    state.focus = { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
    placeDot();
    schedule();
  });

  /** Draws the source into a w×h canvas, cropping around the focal point (fill) or letterboxing (fit/blur). */
  function draw(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const { source: img, width: iw, height: ih } = state.img;
    if (fit.value === 'fill') {
      const k = Math.max(w / iw, h / ih);
      const sw = w / k; const sh = h / k;
      const sx = Math.min(iw - sw, Math.max(0, state.focus.x * iw - sw / 2));
      const sy = Math.min(ih - sh, Math.max(0, state.focus.y * ih - sh / 2));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      if (fit.value === 'blur') {
        const k = Math.max(w / iw, h / ih);
        ctx.filter = `blur(${Math.round(Math.max(w, h) / 40)}px) brightness(.9)`;
        ctx.drawImage(img, (w - iw * k) / 2 - 20, (h - ih * k) / 2 - 20, iw * k + 40, ih * k + 40);
        ctx.filter = 'none';
      } else { ctx.fillStyle = el.bg.value; ctx.fillRect(0, 0, w, h); }
      const k = Math.min(w / iw, h / ih);
      ctx.drawImage(img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k);
    }
    return c;
  }

  function schedule() { clearTimeout(state.timer); state.timer = setTimeout(preview, 80); }
  function clear() { state.urls.forEach((u) => URL.revokeObjectURL(u)); state.urls = []; state.outputs = []; }

  function preview() {
    clear();
    if (!state.img) { el.gallery.innerHTML = ''; update(); return; }
    const list = selected();
    el.gallery.innerHTML = list.map(([id, net, name, w, h]) => {
      const scale = Math.min(1, 360 / Math.max(w, h));
      const url = draw(Math.round(w * scale), Math.round(h * scale)).toDataURL('image/jpeg', 0.8);
      return `<figure class="tk-tile sr-tile"><div class="sr-frame" style="aspect-ratio:${w}/${h}"><img src="${url}" alt="${esc(net)} ${esc(name)} preview"></div><figcaption><span><b>${esc(net)}</b>${esc(name)} · ${w}×${h}</span><button class="tk-iconbtn" type="button" data-one="${id}" aria-label="Download ${esc(net)} ${esc(name)}" title="Download">${icon('download')}</button></figcaption></figure>`;
    }).join('') || '<p class="tk-empty">Pick at least one size.</p>';
    update();
  }

  function update() {
    const n = selected().length;
    el.count.textContent = plural(n, 'size');
    el.run.disabled = state.busy || !state.img || !n;
    el.run.innerHTML = `${icon('zip')}Download ${n > 1 ? `all ${n} sizes` : n ? '1 size' : 'sizes'}`;
    el.hint.textContent = !state.img ? 'Add an image to begin.' : !n ? 'Pick at least one size.' : 'Tip: click the photo to set the focal point for crops.';
    tracker.set(!state.img ? 1 : 2);
    mobile.refresh();
  }

  async function render(size) {
    const [id, , , w, h] = size;
    const type = el.format.value;
    const blob = await canvasToBlob(draw(w, h), type, 0.9);
    return { blob, name: `${baseName(state.file.name)}-${id}-${w}x${h}.${type === 'image/png' ? 'png' : 'jpg'}` };
  }

  el.gallery.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-one]');
    if (!b) return;
    const o = await render(SIZES.find((s) => s[0] === b.dataset.one));
    download(o.blob, o.name);
  });

  el.run.addEventListener('click', async () => {
    if (state.busy || el.run.disabled) return;
    state.busy = true;
    update();
    try {
      const list = selected();
      const JSZip = list.length > 1 ? await jszip() : null;
      const zip = JSZip ? new JSZip() : null;
      let single = null;
      for (let i = 0; i < list.length; i++) {
        prog.set(i / list.length, `Rendering ${list[i][1]} ${list[i][2]}…`);
        const o = await render(list[i]);
        if (zip) zip.file(o.name, o.blob); else single = o;
      }
      prog.set(0.95, 'Packing…');
      if (zip) download(await zip.generateAsync({ type: 'blob' }), `${baseName(state.file.name)}-social-sizes.zip`); else download(single.blob, single.name);
      prog.hide();
      tracker.set(4);
      toast(`${plural(list.length, 'image')} downloaded`);
    } catch (e) { prog.hide(); toast(e.message, 'err'); }
    state.busy = false;
    update();
  });

  el.sizes.addEventListener('change', schedule);
  el.all.addEventListener('click', () => { $$('input', el.sizes).forEach((c) => { c.checked = true; }); schedule(); });
  el.none.addEventListener('click', () => { $$('input', el.sizes).forEach((c) => { c.checked = false; }); schedule(); });
  el.bg.addEventListener('input', () => { el.bgText.value = el.bg.value; schedule(); });
  el.bgText.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(el.bgText.value.trim())) el.bg.value = el.bgText.value.trim(); else el.bgText.value = el.bg.value; schedule(); });
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => { loadScript('jszip').catch(() => {}); });
  update();
})();
