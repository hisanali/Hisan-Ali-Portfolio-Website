(function () {
  'use strict';
  const { $, $$, esc, copy, segmented, steps } = window.TK;

  const SAMPLE = `digital marketing oman
SEO Muscat
seo muscat
google ads agency
social media marketing
تسويق رقمي
إعلانات جوجل
سوشيال ميديا مسقط
website design oman`;
  const el = {
    input: $('#khInput'), out: $('#khOut'), copyBtn: $('#khCopy'), stats: $('#khStats'), warn: $('#khWarn'), sample: $('#khSample'), clear: $('#khClear'),
    dedupe: $('#khDedupe'), lower: $('#khLower'), sort: $('#khSort'), add: $('#khAdd'), groups: $('#khGroups')
  };
  const tracker = steps($('#tkSteps'));
  const format = segmented($('#khFormat'), run);
  const hashStyle = segmented($('#khHashStyle'), run);
  const isArabic = (s) => /[؀-ۿ]/.test(s);

  function parse() {
    let items = el.input.value.split(/[\n,;|،#]+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (el.lower.checked) items = items.map((s) => (isArabic(s) ? s : s.toLowerCase()));
    const suffixes = el.add.value.split(/[,،]+/).map((s) => s.trim()).filter(Boolean);
    if (suffixes.length) items = items.flatMap((k) => [k, ...suffixes.filter((s) => !k.toLowerCase().includes(s.toLowerCase())).map((s) => `${k} ${s}`)]);
    let dupes = 0;
    if (el.dedupe.checked) {
      const seen = new Set();
      items = items.filter((s) => { const key = s.toLowerCase(); if (seen.has(key)) { dupes++; return false; } seen.add(key); return true; });
    }
    if (el.sort.checked) items.sort((a, b) => a.localeCompare(b, ['en', 'ar']));
    return { items, dupes };
  }

  const tag = (s) => {
    const words = s.replace(/[^\p{L}\p{N}\s_]/gu, '').split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    if (isArabic(s)) return `#${words.join('_')}`;
    if (hashStyle.value === 'camel') return `#${words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('')}`;
    if (hashStyle.value === 'title') return `#${words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')}`;
    return `#${words.join('').toLowerCase()}`;
  };

  function run() {
    const { items, dupes } = parse();
    const f = format.value;
    let text = '';
    if (f === 'hashtags') text = [...new Set(items.map(tag).filter(Boolean))].join(' ');
    if (f === 'lines') text = items.join('\n');
    if (f === 'comma') text = items.join(', ');
    if (f === 'phrase') text = items.map((k) => `"${k}"`).join('\n');
    if (f === 'exact') text = items.map((k) => `[${k}]`).join('\n');
    el.out.value = text;
    const ar = items.filter(isArabic).length;
    const tags = f === 'hashtags' ? text.split(' ').filter(Boolean).length : 0;
    el.stats.innerHTML = `<span class="tk-chip is-hl">${items.length} keywords</span><span class="tk-chip">${items.length - ar} English</span><span class="tk-chip">${ar} Arabic</span>${dupes ? `<span class="tk-chip is-ok">${dupes} duplicates removed</span>` : ''}<span class="tk-chip">${text.length} characters</span>`;
    const warns = [];
    if (f === 'hashtags' && tags > 30) warns.push(`Instagram allows up to 30 hashtags per post — you have ${tags}.`);
    if (f === 'hashtags' && tags > 5) warns.push('Tip: 3–5 focused hashtags usually perform as well as 30 on most platforms.');
    el.warn.hidden = !warns.length;
    el.warn.querySelector('span').textContent = warns.join(' ');
    // Group by first word so related keywords sit together.
    const groups = new Map();
    items.forEach((k) => { const first = k.split(' ')[0]; groups.set(first, [...(groups.get(first) || []), k]); });
    const multi = [...groups].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    el.groups.innerHTML = multi.length ? multi.map(([g, v]) => `<li><b dir="auto">${esc(g)}</b><span class="tk-count">${v.length}</span><p dir="auto">${v.map(esc).join(' · ')}</p></li>`).join('') : '<li class="tk-help">Groups of related keywords appear here.</li>';
    el.copyBtn.disabled = !text;
    tracker.set(!items.length ? 1 : 3);
  }

  el.copyBtn.addEventListener('click', () => copy(el.out.value, 'Copied to clipboard'));
  el.sample.addEventListener('click', () => { el.input.value = SAMPLE; run(); });
  el.clear.addEventListener('click', () => { el.input.value = ''; run(); el.input.focus(); });
  [el.input, el.add].forEach((i) => i.addEventListener('input', run));
  $$('#khOptions input[type=checkbox]').forEach((i) => i.addEventListener('change', run));
  run();
})();
