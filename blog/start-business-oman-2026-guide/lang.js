(() => {
  'use strict';
  // Reads the guide in Arabic, Malayalam or Hindi by swapping text in place, so layout and interactions stay identical.
  const LANGS = { en: 'English', ar: 'العربية', ml: 'മലയാളം', hi: 'हिन्दी' };
  const KEY = 'sb-guide-lang';
  const FONTS = { ar: 'Noto+Kufi+Arabic:wght@400;600;800', ml: 'Noto+Sans+Malayalam:wght@400;600;800', hi: 'Noto+Sans+Devanagari:wght@400;600;800' };
  const bar = document.getElementById('sbLang');
  const roots = [document.querySelector('.blog-post-header'), document.getElementById('blog-content')].filter(Boolean);
  if (!bar || !roots.length) return;
  const original = new Map();
  const englishTitle = document.title;
  const cache = {};
  let current = 'en';

  function textNodes() {
    const out = [];
    roots.forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) out.push(n);
    });
    return out;
  }
  function loadFont(lang) {
    if (!FONTS[lang] || document.getElementById(`sb-font-${lang}`)) return;
    const l = document.createElement('link');
    l.id = `sb-font-${lang}`;
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${FONTS[lang]}&display=swap`;
    document.head.appendChild(l);
  }
  async function dict(lang) {
    if (!cache[lang]) {
      const r = await fetch(`/blog/start-business-oman-2026-guide/i18n/${lang}.json`);
      if (!r.ok) throw new Error('missing');
      cache[lang] = await r.json();
    }
    return cache[lang];
  }
  function mark(lang) {
    bar.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const status = document.getElementById('sbLangStatus');
    if (status) status.textContent = lang === 'en' ? '' : `${LANGS[lang]} ✓`;
  }
  async function apply(lang, save) {
    if (!LANGS[lang]) lang = 'en';
    let d = null;
    if (lang !== 'en') {
      try { d = await dict(lang); } catch (e) { lang = 'en'; }
      loadFont(lang);
    }
    textNodes().forEach((n) => {
      if (!original.has(n)) original.set(n, n.nodeValue);
      const src = original.get(n);
      const key = src.trim();
      n.nodeValue = d && d[key] ? src.replace(key, d[key]) : src;
    });
    roots.forEach((r) => {
      if (lang === 'en') { r.removeAttribute('lang'); r.removeAttribute('dir'); }
      else { r.setAttribute('lang', lang); r.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr'); }
    });
    document.body.dataset.sbLang = lang;
    document.title = d ? d.__title : englishTitle;
    current = lang;
    mark(lang);
    if (save) {
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      const u = new URL(location.href);
      if (lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
      history.replaceState(null, '', u);
    }
    window.dispatchEvent(new Event('scroll'));
  }

  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b && b.dataset.lang !== current) apply(b.dataset.lang, true);
  });
  let start = new URL(location.href).searchParams.get('lang');
  if (!start) { try { start = localStorage.getItem(KEY); } catch (e) {} }
  if (start && start !== 'en') apply(start, false); else mark('en');
})();
