(function () {
  'use strict';
  const { $, esc, copy, segmented } = window.TK;

  const STOP = new Set(('a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves also get got may might must one us via per etc like make made many much well even still yet within without upon across around dont doesnt isnt arent wasnt werent cant wont im ive youre theyre thats its lets').split(' '));
  const DRAFT_KEY = 'content-analyzer-draft-v2';
  const LIMITS = [['Meta title', 60], ['Meta description', 160], ['X / Twitter post', 280], ['Instagram caption', 2200], ['LinkedIn post', 3000]];

  const el = {
    text: $('#caText'), words: $('#caWords'), chars: $('#caChars'), charsNs: $('#caCharsNs'), sentences: $('#caSentences'), paras: $('#caParas'),
    read: $('#caRead'), speak: $('#caSpeak'), score: $('#caScore'), scoreLabel: $('#caScoreLabel'), scoreBar: $('#caScoreBar'), grade: $('#caGrade'),
    avgSent: $('#caAvgSent'), longList: $('#caLong'), passive: $('#caPassive'), keywords: $('#caKeywords'), focus: $('#caFocus'), focusOut: $('#caFocusOut'),
    limits: $('#caLimits'), clear: $('#caClear'), copyBtn: $('#caCopy'), saved: $('#caSaved')
  };
  const gram = segmented($('#caGram'), analyze);

  function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }

  function splitSentences(text) {
    return text.replace(/\s+/g, ' ').match(/[^.!?…]+(?:[.!?…]+["')\]]*|$)/g)?.map((s) => s.trim()).filter((s) => /\w/.test(s)) || [];
  }

  const fmtTime = (mins) => {
    if (mins < 1) { const s = Math.max(0, Math.round(mins * 60)); return `${s} sec`; }
    const m = Math.floor(mins); const s = Math.round((mins - m) * 60);
    return s ? `${m} min ${s} s` : `${m} min`;
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
    const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
    const wc = words.length;
    const sentences = splitSentences(text);
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    el.words.textContent = wc.toLocaleString();
    el.chars.textContent = text.length.toLocaleString();
    el.charsNs.textContent = text.replace(/\s/g, '').length.toLocaleString();
    el.sentences.textContent = sentences.length.toLocaleString();
    el.paras.textContent = paras.toLocaleString();
    el.read.textContent = fmtTime(wc / 238);
    el.speak.textContent = fmtTime(wc / 140);

    // Readability (Flesch reading ease + Flesch–Kincaid grade).
    const latin = words.filter((w) => /[a-z]/i.test(w));
    if (latin.length >= 30 && sentences.length) {
      const syl = latin.reduce((s, w) => s + syllables(w), 0);
      const wps = latin.length / sentences.length;
      const spw = syl / latin.length;
      const score = Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw));
      const grade = Math.max(0, 0.39 * wps + 11.8 * spw - 15.59);
      const [label, help, cls] = readability(score);
      el.score.textContent = Math.round(score);
      el.scoreLabel.innerHTML = `<b class="ca-${cls}">${label}</b> — ${help}`;
      el.scoreBar.style.width = `${score}%`;
      el.scoreBar.className = `ca-${cls}`;
      el.grade.textContent = `Grade ${grade.toFixed(1)}`;
      el.avgSent.textContent = `${wps.toFixed(1)} words`;
    } else {
      el.score.textContent = '–';
      el.scoreLabel.textContent = 'Write at least 30 words for a readability score.';
      el.scoreBar.style.width = '0';
      el.grade.textContent = '–';
      el.avgSent.textContent = sentences.length ? `${(wc / sentences.length).toFixed(1)} words` : '–';
    }

    const long = sentences.map((s) => [s, (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length]).filter(([, n]) => n > 25);
    el.longList.innerHTML = long.length
      ? long.slice(0, 6).map(([s, n]) => `<li><span class="ca-pill">${n} words</span> ${esc(s.length > 180 ? `${s.slice(0, 180)}…` : s)}</li>`).join('') + (long.length > 6 ? `<li class="tk-help">+ ${long.length - 6} more</li>` : '')
      : `<li class="tk-help">${sentences.length ? 'No sentences over 25 words. Nice and punchy.' : 'Nothing to check yet.'}</li>`;
    const passive = (text.match(/\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/gi) || []).length;
    el.passive.textContent = passive ? `${passive} possible` : 'None found';

    // Keyword phrases.
    const n = Number(gram.value);
    const lower = words.map((w) => w.toLowerCase().replace(/[’']/g, ''));
    const counts = new Map();
    for (let i = 0; i + n <= lower.length; i++) {
      const slice = lower.slice(i, i + n);
      if (STOP.has(slice[0]) || STOP.has(slice[n - 1]) || slice.some((w) => w.length < 2 || /^\d+$/.test(w))) continue;
      const key = slice.join(' ');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const top = [...counts].filter(([, c]) => c > (n > 1 ? 1 : 0)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
    const max = top[0]?.[1] || 1;
    el.keywords.innerHTML = top.length
      ? top.map(([k, c]) => { const d = (c * n / Math.max(1, wc) * 100); return `<li><button type="button" class="ca-kw" data-kw="${esc(k)}" title="Use as focus keyword"><span class="ca-kw-bar" style="width:${(c / max) * 100}%"></span><span class="ca-kw-t">${esc(k)}</span><span class="ca-kw-n">${c}× · ${d.toFixed(1)}%</span></button></li>`; }).join('')
      : `<li class="tk-help">${wc ? `No repeated ${n > 1 ? 'phrases' : 'keywords'} yet.` : 'Start typing to see your most-used words.'}</li>`;

    // Focus keyword.
    const fk = el.focus.value.trim().toLowerCase();
    if (fk && wc) {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${fk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?=$|[^\\p{L}\\p{N}])`, 'giu');
      const hits = (text.match(re) || []).length;
      const fkWords = fk.split(/\s+/).length;
      const density = hits * fkWords / wc * 100;
      const firstPara = (text.split(/\n\s*\n/)[0] || '').toLowerCase();
      const inFirst = new RegExp(re.source, 'iu').test(firstPara);
      const checks = [
        [hits > 0, `Appears ${hits} time${hits === 1 ? '' : 's'} (${density.toFixed(1)}% density)`],
        [inFirst, inFirst ? 'Used in the opening paragraph' : 'Not in the opening paragraph — mention it early'],
        [density <= 3, density > 3 ? 'Density above 3% can read as keyword stuffing' : 'Density is natural']
      ];
      el.focusOut.innerHTML = checks.map(([ok, t]) => `<li class="${ok ? 'is-ok' : 'is-warn'}"><span class="fas ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></span> ${t}</li>`).join('');
    } else el.focusOut.innerHTML = '';

    const len = text.trim().length;
    el.limits.innerHTML = LIMITS.map(([name, lim]) => `<li><div class="ca-lim-top"><span>${name}</span><span class="${len > lim ? 'ca-is-err' : ''}">${len.toLocaleString()} / ${lim.toLocaleString()}</span></div><div class="tk-progress-bar"><i style="width:${Math.min(100, len / lim * 100)}%;${len > lim ? 'background:var(--tk-err)' : ''}"></i></div></li>`).join('');
  }

  let saveTimer = 0;
  el.text.addEventListener('input', () => {
    analyze();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, el.text.value); el.saved.textContent = 'Draft saved in this browser'; } catch (e) { /* ignore */ } }, 500);
  });
  el.focus.addEventListener('input', analyze);
  el.keywords.addEventListener('click', (e) => { const b = e.target.closest('[data-kw]'); if (b) { el.focus.value = b.dataset.kw; analyze(); } });
  el.clear.addEventListener('click', () => { el.text.value = ''; try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } el.saved.textContent = ''; analyze(); el.text.focus(); });
  el.copyBtn.addEventListener('click', () => el.text.value && copy(el.text.value));

  try { const d = localStorage.getItem(DRAFT_KEY); if (d) { el.text.value = d; el.saved.textContent = 'Restored your last draft'; } } catch (e) { /* ignore */ }
  analyze();
})();
