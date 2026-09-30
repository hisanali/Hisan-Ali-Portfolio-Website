(function () {
  'use strict';
  const { $, icon, esc, copy, segmented, steps } = window.TK;

  const STOP = new Set('a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves also get got may might must one us via per etc like make made many much well even still yet within without upon across around dont doesnt isnt arent wasnt werent cant wont im ive youre theyre thats lets'.split(' '));
  const DRAFT_KEY = 'content-analyzer-draft-v2';
  const LIMITS = [['Meta title', 60], ['Meta description', 160], ['X / Twitter post', 280], ['Instagram caption', 2200], ['LinkedIn post', 3000]];
  const SAMPLE = `Choosing a digital marketing partner in Muscat can feel overwhelming. Every agency promises more leads, better rankings and viral content, but very few explain how they will actually measure success.

Start with one clear goal. Do you want more enquiries, more online sales or more people visiting your shop? A good partner will turn that goal into a simple plan with numbers you can check every month.

Next, look at how they report results. Monthly reports that are full of impressions and likes but never mention enquiries, calls or revenue are a warning sign that should make any business owner stop and ask some very direct questions about what is really being delivered.

Finally, ask for examples from businesses like yours. Digital marketing in Oman works best when it respects local search habits, Arabic and English audiences, and the way people here actually buy.`;

  const el = {
    text: $('#caText'), words: $('#caWords'), chars: $('#caChars'), charsNs: $('#caCharsNs'), sentences: $('#caSentences'), paras: $('#caParas'),
    read: $('#caRead'), speak: $('#caSpeak'), score: $('#caScore'), scoreLabel: $('#caScoreLabel'), scoreBar: $('#caScoreBar'), grade: $('#caGrade'),
    avgSent: $('#caAvgSent'), longList: $('#caLong'), longCount: $('#caLongCount'), passive: $('#caPassive'), keywords: $('#caKeywords'), focus: $('#caFocus'), focusOut: $('#caFocusOut'),
    limits: $('#caLimits'), clear: $('#caClear'), copyBtn: $('#caCopy'), sample: $('#caSample'), saved: $('#caSaved')
  };
  const gram = segmented($('#caGram'), analyze);
  const tracker = steps($('#tkSteps'));

  function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }
  const splitSentences = (text) => text.replace(/\s+/g, ' ').match(/[^.!?…]+(?:[.!?…]+["')\]]*|$)/g)?.map((s) => s.trim()).filter((s) => /\w/.test(s)) || [];
  const wordsOf = (s) => s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
  const fmtTime = (mins) => {
    if (mins < 1) return `${Math.max(0, Math.round(mins * 60))} s`;
    const m = Math.floor(mins); const s = Math.round((mins - m) * 60);
    return s ? `${m}m ${s}s` : `${m} min`;
  };
  function readability(score) {
    if (score >= 80) return ['Very easy', 'Easily understood by an 11-year-old.', 'is-ok'];
    if (score >= 60) return ['Easy to read', 'Plain English — ideal for most web content.', 'is-ok'];
    if (score >= 50) return ['Fairly difficult', 'Shorter sentences and simpler words will help.', 'is-warn'];
    if (score >= 30) return ['Difficult', 'Best suited to specialist readers.', 'is-warn'];
    return ['Very difficult', 'Academic level — consider simplifying.', 'is-err'];
  }

  function analyze() {
    const text = el.text.value;
    const words = wordsOf(text);
    const wc = words.length;
    const sentences = splitSentences(text);
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    el.words.textContent = wc.toLocaleString();
    el.chars.textContent = text.length.toLocaleString();
    el.charsNs.textContent = wc ? `${text.replace(/\s/g, '').length.toLocaleString()} characters without spaces.` : '';
    el.sentences.textContent = sentences.length.toLocaleString();
    el.paras.textContent = paras.toLocaleString();
    el.read.textContent = fmtTime(wc / 238);
    el.speak.textContent = fmtTime(wc / 140);

    const latin = words.filter((w) => /[a-z]/i.test(w));
    if (latin.length >= 30 && sentences.length) {
      const syl = latin.reduce((s, w) => s + syllables(w), 0);
      const wps = latin.length / sentences.length;
      const spw = syl / latin.length;
      const score = Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw));
      const grade = Math.max(0, 0.39 * wps + 11.8 * spw - 15.59);
      const [label, help, cls] = readability(score);
      el.score.textContent = Math.round(score);
      el.scoreLabel.innerHTML = `<b class="ca-${cls}">${label}.</b> ${help}`;
      el.scoreBar.style.left = `${score}%`;
      el.grade.textContent = `Grade ${grade.toFixed(1)}`;
      el.avgSent.textContent = `${wps.toFixed(1)} words`;
    } else {
      el.score.textContent = '–';
      el.scoreLabel.textContent = wc ? `Write ${30 - latin.length} more words for a readability score.` : 'Start writing to see your readability score.';
      el.scoreBar.style.left = '0%';
      el.grade.textContent = '–';
      el.avgSent.textContent = sentences.length ? `${(wc / sentences.length).toFixed(1)} words` : '–';
    }

    const long = sentences.map((s) => [s, wordsOf(s).length]).filter(([, n]) => n > 25);
    el.longCount.textContent = long.length;
    el.longList.innerHTML = long.length
      ? long.slice(0, 6).map(([s, n]) => `<li><span class="ca-pill">${n} words</span>${esc(s.length > 200 ? `${s.slice(0, 200)}…` : s)}</li>`).join('') + (long.length > 6 ? `<li>+ ${long.length - 6} more</li>` : '')
      : `<li>${sentences.length ? 'No sentences over 25 words — nice and punchy.' : 'Nothing to check yet.'}</li>`;
    const passive = (text.match(/\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/gi) || []).length;
    el.passive.textContent = passive ? `${passive} possible` : 'None found';

    const n = Number(gram.value);
    const lower = words.map((w) => w.toLowerCase().replace(/[’']/g, ''));
    const counts = new Map();
    for (let i = 0; i + n <= lower.length; i++) {
      const slice = lower.slice(i, i + n);
      if (STOP.has(slice[0]) || STOP.has(slice[n - 1]) || slice.some((w) => w.length < 2 || /^\d+$/.test(w))) continue;
      const key = slice.join(' ');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const top = [...counts].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
    const max = top[0]?.[1] || 1;
    el.keywords.innerHTML = top.length
      ? top.map(([k, c]) => `<li><button type="button" class="ca-kw" data-kw="${esc(k)}" title="Use as focus keyword"><span class="ca-kw-bar" style="width:${(c / max) * 100}%"></span><span class="ca-kw-t">${esc(k)}</span><span class="ca-kw-n">${c}× · ${(c * n / Math.max(1, wc) * 100).toFixed(1)}%</span></button></li>`).join('')
      : `<li class="tk-help">${wc ? `No repeated ${n > 1 ? 'phrases' : 'words'} yet.` : 'Your most-used words appear here.'}</li>`;

    const fk = el.focus.value.trim().toLowerCase();
    if (fk && wc) {
      const pattern = `(^|[^\\p{L}\\p{N}])${fk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?=$|[^\\p{L}\\p{N}])`;
      const hits = (text.match(new RegExp(pattern, 'giu')) || []).length;
      const density = hits * fk.split(/\s+/).length / wc * 100;
      const inFirst = new RegExp(pattern, 'iu').test(text.split(/\n\s*\n/)[0] || '');
      const checks = [
        [hits > 0, hits ? `Used ${hits} time${hits === 1 ? '' : 's'} · ${density.toFixed(1)}% density` : 'Not used yet — add it where it fits naturally'],
        [inFirst, inFirst ? 'Appears in your opening paragraph' : 'Mention it in the opening paragraph'],
        [density <= 3, density > 3 ? 'Above 3% can read as keyword stuffing' : 'Density looks natural']
      ];
      el.focusOut.innerHTML = checks.map(([ok, t]) => `<li class="${ok ? 'is-ok' : 'is-warn'}">${icon(ok ? 'checkc' : 'alert')}<span>${t}</span></li>`).join('');
    } else {
      el.focusOut.innerHTML = `<li class="tk-help" style="font-weight:600">Tip: click any top keyword below to check it.</li>`;
    }

    const len = text.trim().length;
    el.limits.innerHTML = LIMITS.map(([name, lim]) => `<li><div class="ca-lim-top"><span>${name}</span><span class="${len > lim ? 'ca-is-err' : ''}">${len.toLocaleString()} / ${lim.toLocaleString()}</span></div><div class="tk-progress-bar"><i style="width:${Math.min(100, len / lim * 100)}%;${len > lim ? 'background:var(--tk-err)' : ''}"></i></div></li>`).join('');
    tracker.set(!wc ? 1 : latin.length >= 30 ? 3 : 2);
  }

  let saveTimer = 0;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        if (el.text.value) localStorage.setItem(DRAFT_KEY, el.text.value); else localStorage.removeItem(DRAFT_KEY);
        el.saved.textContent = el.text.value ? 'Draft saved in this browser' : 'Autosaves in this browser';
      } catch (e) { /* storage unavailable */ }
    }, 500);
  }
  el.text.addEventListener('input', () => { analyze(); persist(); });
  el.focus.addEventListener('input', analyze);
  el.keywords.addEventListener('click', (e) => { const b = e.target.closest('[data-kw]'); if (b) { el.focus.value = b.dataset.kw; analyze(); } });
  el.clear.addEventListener('click', () => { el.text.value = ''; persist(); analyze(); el.text.focus(); });
  el.copyBtn.addEventListener('click', () => el.text.value && copy(el.text.value, 'Text copied'));
  el.sample.addEventListener('click', () => { el.text.value = SAMPLE; el.focus.value = 'digital marketing'; analyze(); persist(); });

  try { const d = localStorage.getItem(DRAFT_KEY); if (d) { el.text.value = d; el.saved.textContent = 'Restored your last draft'; } } catch (e) { /* ignore */ }
  analyze();
})();
