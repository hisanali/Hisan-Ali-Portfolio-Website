/* Site-wide Arabic switch.
   The page is authored in English. When Arabic is chosen, this script flips the
   document to RTL and replaces English text with reviewed Arabic from
   /i18n/ar/<page>.json plus /i18n/ar/common.json. Choosing English again reloads
   the untouched English page. The choice is remembered in localStorage and can
   be forced with ?lang=ar or ?lang=en. */
(() => {
  'use strict';

  const root = document.documentElement;
  const STORAGE_KEY = 'site-language';
  const VERSION = '20261107-1';
  // Set by the lang-init script in <head> when the page itself is written in Arabic.
  const nativeArabic = root.dataset.nativeLang === 'ar';
  const alternatePath = (language) => {
    const href = document.querySelector(`link[rel="alternate"][hreflang="${language}"]`)?.getAttribute('href');
    if (!href) return '';
    try {
      const url = new URL(href, location.href);
      const here = location.pathname.replace(/index\.html$/, '');
      return url.pathname !== here ? url.pathname : '';
    } catch (error) { return ''; }
  };
  const englishAlternate = nativeArabic ? alternatePath('en') : '';
  // The home page is fully translated in place; other pages with a hand-written
  // Arabic edition (hreflang="ar") open that edition instead.
  const arabicAlternate = nativeArabic || location.pathname === '/' ? '' : alternatePath('ar');
  const extractMode = /[?&]i18n-extract=1\b/.test(location.search);

  const readLanguage = () => {
    try { return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch (error) { return 'en'; }
  };
  const saveLanguage = (language) => {
    try { localStorage.setItem(STORAGE_KEY, language); } catch (error) { /* Storage may be unavailable. */ }
  };

  /* ---------- Page key: which dictionary belongs to this URL ---------- */
  const pagePath = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  const pageKey = (() => {
    if (pagePath === '/') return 'home';
    const parts = pagePath.replace(/^\/+/, '').split('/');
    if (parts[0] === 'blog' && parts.length > 1) return 'blog-article';
    return parts.join('--');
  })();
  const postKey = (() => {
    const parts = pagePath.replace(/^\/+/, '').split('/');
    return parts[0] === 'blog' && parts.length === 2 ? `blog--${parts[1]}` : '';
  })();

  /* ---------- Text discovery ---------- */
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG', 'CANVAS', 'TEMPLATE', 'IFRAME', 'VIDEO', 'AUDIO', 'MATH', 'SELECT']);
  const INLINE_TAGS = new Set(['A', 'ABBR', 'B', 'BDI', 'BDO', 'BR', 'CITE', 'DATA', 'DFN', 'EM', 'I', 'IMG', 'KBD', 'MARK', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TIME', 'U', 'VAR', 'WBR']);
  const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt', 'aria-description', 'data-label', 'data-tooltip'];
  const hasLatin = (text) => /[A-Za-z]{2}/.test(text);
  const clean = (text) => text.replace(/\s+/g, ' ').trim();

  const isSkipped = (element) => SKIP_TAGS.has(element.tagName.toUpperCase())
    || element.hasAttribute('data-i18n-skip')
    || element.hasAttribute('data-i18n-managed')
    || element.getAttribute('translate') === 'no'
    || element.classList.contains('notranslate');

  const isInlineTree = (element) => {
    if (element.tagName.toUpperCase() === 'SVG') return true;
    if (!INLINE_TAGS.has(element.tagName.toUpperCase()) || isSkipped(element)) return false;
    for (const child of element.children) if (!isInlineTree(child)) return false;
    return true;
  };
  const isTextOnly = (element) => element.children.length === 0 && hasLatin(element.textContent || '');

  /* A unit is an element whose own text is mixed only with inline children,
     e.g. <p>Read the <a>guide</a> first</p>. The key keeps child positions as
     numbered placeholders: "Read the <0>guide</0> first". */
  const unitKey = (element) => {
    let ownText = false;
    for (const node of element.childNodes) {
      if (node.nodeType === 3 && hasLatin(node.nodeValue)) ownText = true;
      if (node.nodeType === 1 && !isInlineTree(node)) return null;
    }
    if (!ownText) return null;
    let index = 0;
    let key = '';
    const children = [];
    for (const node of element.childNodes) {
      if (node.nodeType === 3) key += node.nodeValue;
      else if (node.nodeType === 1) {
        const n = index++;
        children.push(node);
        key += isTextOnly(node) ? `<${n}>${clean(node.textContent)}</${n}>` : `<${n}/>`;
      }
    }
    return { key: clean(key), children };
  };

  /* ---------- Dictionaries ---------- */
  let dictionary = null;

  /* Repeating formats (dates, reading time) are translated by rule, not by dictionary. */
  const MONTHS = { jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو', jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر' };
  const minutes = (n) => {
    const value = Number(n);
    if (value === 1) return 'دقيقة واحدة';
    if (value === 2) return 'دقيقتان';
    if (value >= 3 && value <= 10) return `${n} دقائق`;
    return `${n} دقيقة`;
  };
  const RULES = [
    [/^(\d+)[ -]min(?:ute)?s? read$/i, (m) => `قراءة ${minutes(m[1])}`],
    [/^(\d+) min(?:ute)?s? remaining$/i, (m) => `متبقٍ ${minutes(m[1])}`],
    [/^(\d+)[ -]min(?:ute)?s?$/i, (m) => minutes(m[1])],
    [/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{1,2}),? (\d{4})$/i, (m) => `${Number(m[2])} ${MONTHS[m[1].toLowerCase()]} ${m[3]}`],
    [/^(\d{1,2}) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{4})$/i, (m) => `${Number(m[1])} ${MONTHS[m[2].toLowerCase()]} ${m[3]}`],
    [/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{4})$/i, (m) => `${MONTHS[m[1].toLowerCase()]} ${m[2]}`],
    [/^(\d+) of (\d+)$/i, (m) => `${m[1]} من ${m[2]}`],
    [/^(\d+) out of (\d+)$/i, (m) => `${m[1]} من ${m[2]}`],
    [/^Week (\d+)$/i, (m) => `الأسبوع ${m[1]}`],
    [/^Updated (.+)$/, (m) => { const inner = byRule(m[1]); return inner ? `آخر تحديث: ${inner}` : null; }],
    [/^Published (.+)$/, (m) => { const inner = byRule(m[1]); return inner ? `نُشر في ${inner}` : null; }]
  ];
  function byRule(key) {
    // Keep a leading icon placeholder such as "<0/> 9 min read".
    const prefix = key.match(/^(<\d+\/>\s*)/)?.[1] || '';
    const body = key.slice(prefix.length).trim();
    for (const [pattern, render] of RULES) {
      const match = body.match(pattern);
      if (match) { const value = render(match); if (value) return prefix + value; }
    }
    return null;
  }
  /* Dictionary keys written as "re:<regex>" translate text that scripts build from
     templates. In the value, $1..$9 insert the captured text, itself translated
     when the dictionary knows it (case-insensitively for lower-cased labels). */
  let patterns = [];
  const compilePatterns = () => {
    patterns = Object.keys(dictionary).filter((key) => key.startsWith('re:')).map((key) => {
      try { return [new RegExp(key.slice(3)), dictionary[key]]; } catch (error) { return null; }
    }).filter(Boolean);
  };
  const exact = (key) => {
    if (!dictionary) return null;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) return dictionary[key];
    const capital = key.charAt(0).toUpperCase() + key.slice(1);
    if (capital !== key && Object.prototype.hasOwnProperty.call(dictionary, capital)) return dictionary[capital];
    return null;
  };
  const lookup = (key) => {
    if (!dictionary) return null;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) return dictionary[key];
    const rule = byRule(key);
    if (rule != null) return rule;
    for (const [pattern, template] of patterns) {
      const match = key.match(pattern);
      if (match) return template.replace(/\$(\d)/g, (_all, n) => { const part = match[Number(n)] ?? ''; return exact(part) ?? lookup(part) ?? part; });
    }
    return null;
  };

  const loadJson = (name) => fetch(`/i18n/ar/${name}.json?v=${VERSION}`, { credentials: 'same-origin' })
    .then((response) => (response.ok ? response.json() : {}))
    .catch(() => ({}));

  /* ---------- Applying translations ---------- */
  const translated = new WeakMap(); // node -> Arabic text we wrote, to detect later English rewrites
  const collected = new Set();
  const collect = (key) => { if (key && hasLatin(key) && !byRule(key)) collected.add(key); };

  const buildFromTemplate = (template, children) => {
    const pieces = [];
    const used = new Set();
    const pattern = /<(\d+)>([\s\S]*?)<\/\1>|<(\d+)\/>/g;
    let last = 0;
    let match;
    while ((match = pattern.exec(template))) {
      if (match.index > last) pieces.push(document.createTextNode(template.slice(last, match.index)));
      const index = Number(match[1] ?? match[3]);
      const child = children[index];
      if (child && !used.has(index)) {
        used.add(index);
        if (match[1] !== undefined && isTextOnly(child)) child.textContent = match[2];
        pieces.push(child);
      }
      last = pattern.lastIndex;
    }
    if (last < template.length) pieces.push(document.createTextNode(template.slice(last)));
    children.forEach((child, index) => { if (!used.has(index)) pieces.push(child); });
    return pieces;
  };

  const translateText = (node) => {
    const value = node.nodeValue;
    if (!extractMode && dictionary && /^\s*,\s*$/.test(value)) { node.nodeValue = value.replace(',', '،'); return; }
    if (!hasLatin(value) || translated.get(node) === value) return;
    const key = clean(value);
    if (extractMode) { collect(key); return; }
    const arabic = lookup(key);
    if (arabic == null) return;
    const lead = value.match(/^\s*/)[0];
    const trail = value.match(/\s*$/)[0];
    node.nodeValue = lead + arabic + trail;
    translated.set(node, node.nodeValue);
  };

  const translateAttributes = (element) => {
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (!value || !hasLatin(value)) continue;
      const key = clean(value);
      if (extractMode) { collect(key); continue; }
      const arabic = lookup(key);
      if (arabic != null) element.setAttribute(name, arabic);
    }
    if (element.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(element.type) && hasLatin(element.value)) {
      const key = clean(element.value);
      if (extractMode) collect(key);
      else if (lookup(key) != null) element.value = lookup(key);
    }
  };

  const walk = (element) => {
    if (element.nodeType !== 1 || isSkipped(element)) return;
    translateAttributes(element);
    const unit = unitKey(element);
    if (unit && unit.children.length) {
      if (translated.get(element) !== element.innerHTML) {
        if (extractMode) collect(unit.key);
        else {
          const arabic = lookup(unit.key);
          if (arabic != null) {
            element.replaceChildren(...buildFromTemplate(arabic, unit.children));
            translated.set(element, element.innerHTML);
          }
        }
      }
      unit.children.forEach((child) => { if (child.nodeType === 1) { translateAttributes(child); if (!isTextOnly(child)) walk(child); } });
      return;
    }
    for (const node of [...element.childNodes]) {
      if (node.nodeType === 3) translateText(node);
      else if (node.nodeType === 1) walk(node);
    }
  };

  const translateHead = () => {
    const title = clean(document.title);
    if (hasLatin(title)) {
      if (extractMode) collect(title);
      else if (lookup(title) != null) document.title = lookup(title);
    }
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((meta) => {
      const key = clean(meta.content || '');
      if (!hasLatin(key)) return;
      if (extractMode) collect(key);
      else if (lookup(key) != null) meta.content = lookup(key);
    });
  };

  /* ---------- Blog articles ---------- */
  const prepareArticle = (hasPostDictionary) => {
    const article = document.getElementById('blog-content');
    if (!article) return;
    const hasArabic = Boolean(window.blogLanguagePage?.translations?.ar);
    const picker = document.querySelector('.article-language-switcher');
    if (hasArabic) {
      // The article picker owns the body, heading and meta for translated posts.
      const option = picker?.querySelector('.language-option[data-language="ar"]');
      if (option && option.getAttribute('aria-selected') !== 'true') option.click();
      document.querySelector('.blog-post-header h1')?.setAttribute('data-i18n-managed', '');
      // The picker keeps the English body when its Arabic copy no longer matches
      // the article's current layout; only hand the body over if it really changed.
      const bodyText = article.querySelector('p')?.textContent || '';
      if (/[\u0600-\u06FF]/.test(bodyText)) { article.setAttribute('data-i18n-managed', ''); return; }
    }
    // Posts with their own Arabic dictionary are translated in place like any page.
    if (hasPostDictionary || extractMode) {
      document.querySelector('.blog-post-header h1')?.removeAttribute('data-i18n-managed');
      return;
    }
    article.setAttribute('data-i18n-skip', '');
    article.setAttribute('dir', 'ltr');
    article.setAttribute('lang', 'en');
    const heading = document.querySelector('.blog-post-header h1, .article-hero h1, main h1');
    if (heading && !heading.hasAttribute('data-i18n-managed') && hasLatin(heading.textContent)) { heading.setAttribute('dir', 'ltr'); heading.setAttribute('lang', 'en'); heading.setAttribute('data-i18n-skip', ''); }
    if (!document.querySelector('.i18n-article-note')) {
      const note = document.createElement('p');
      note.className = 'i18n-article-note';
      note.setAttribute('role', 'note');
      note.textContent = 'هذا المقال متوفر حاليًا باللغة الإنجليزية فقط. القوائم والعناوين معروضة بالعربية.';
      article.parentNode.insertBefore(note, article);
    }
  };

  /* ---------- Watching for content that scripts add later ---------- */
  let observer = null;
  let queued = false;
  const pending = new Set();
  const flush = () => {
    queued = false;
    const nodes = [...pending];
    pending.clear();
    observer?.disconnect();
    nodes.forEach((node) => {
      if (!node.isConnected) return;
      if (node.nodeType === 3) { if (!node.parentElement?.closest('[data-i18n-skip],[data-i18n-managed]')) translateText(node); }
      else if (!node.closest?.('[data-i18n-skip],[data-i18n-managed]')) {
        const parent = node.parentElement;
        // Re-evaluate the parent so mixed inline units are keyed as a whole.
        if (parent && unitKey(parent)) walk(parent); else walk(node);
      }
    });
    observe();
  };
  const observe = () => {
    observer = observer || new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') pending.add(mutation.target);
        else if (mutation.type === 'attributes') pending.add(mutation.target);
        else mutation.addedNodes.forEach((node) => pending.add(node));
      });
      if (!queued && pending.size) { queued = true; requestAnimationFrame(flush); }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
  };

  /* ---------- Switch controls ---------- */
  const currentLanguage = () => (root.classList.contains('lang-ar') || nativeArabic ? 'ar' : 'en');
  const syncControls = () => {
    const arabic = currentLanguage() === 'ar';
    document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(arabic));
      button.setAttribute('aria-label', arabic ? 'Switch to English' : 'التبديل إلى العربية');
      button.setAttribute('lang', arabic ? 'en' : 'ar');
      const label = button.querySelector('[data-lang-label]');
      if (label) label.textContent = arabic ? 'English' : 'العربية';
      const short = button.querySelector('[data-lang-short]');
      if (short) short.textContent = arabic ? 'EN' : 'ع';
    });
  };

  const switchTo = (language) => {
    saveLanguage(language);
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    if (language === 'en') {
      if (nativeArabic && englishAlternate) { location.href = englishAlternate; return; }
      location.replace(url.toString());
      return;
    }
    if (nativeArabic) return;
    if (arabicAlternate) { location.href = arabicAlternate; return; }
    history.replaceState(history.state, '', url.toString());
    enableArabic();
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lang-toggle]');
    if (!button) return;
    event.preventDefault();
    switchTo(currentLanguage() === 'ar' ? 'en' : 'ar');
  });

  /* ---------- Turning Arabic on ---------- */
  const ensureFonts = () => {
    if (document.getElementById('i18n-ar-fonts')) return;
    const link = document.createElement('link');
    link.id = 'i18n-ar-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  };

  const reveal = () => root.classList.remove('i18n-loading');

  function enableArabic() {
    root.classList.add('lang-ar', 'i18n-loading');
    root.setAttribute('lang', 'ar');
    root.setAttribute('dir', 'rtl');
    ensureFonts();
    syncControls();
    const safety = setTimeout(reveal, 2500);
    // Articles also use the blog index dictionary for related-post titles and excerpts.
    // Articles also use the blog index dictionary (related-post titles) and their own post dictionary.
    const extra = pageKey === 'blog-article' ? loadJson('blog') : Promise.resolve({});
    const post = postKey ? loadJson(postKey) : Promise.resolve({});
    Promise.all([loadJson('common'), extra, loadJson(pageKey), post]).then(([common, blog, page, postDictionary]) => {
      dictionary = Object.assign({}, common, blog, page, postDictionary);
      // A page or post dictionary of its own means the article body is translated too.
      const hasPostDictionary = Object.keys(postDictionary).length > 20 || (pageKey !== 'blog-article' && Object.keys(page).length > 20);
      compilePatterns();
      prepareArticle(hasPostDictionary);
      translateHead();
      walk(document.body);
      observe();
      clearTimeout(safety);
      reveal();
      document.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: 'ar' } }));
    });
  }

  /* ---------- Start ---------- */
  const forced = (location.search.match(/[?&]lang=(ar|en)\b/) || [])[1];
  if (forced) saveLanguage(forced);

  if (extractMode) {
    const run = () => {
      prepareArticle();
      translateHead();
      walk(document.body);
      window.__i18nStrings = [...collected];
      window.__i18nPageKey = pageKey;
    };
    window.__i18nExtract = run;
    run();
    return;
  }

  if (nativeArabic) {
    saveLanguage('ar');
    enableArabic();
    return;
  }

  if ((forced || readLanguage()) === 'ar') {
    // A hand-written Arabic page exists for this URL: send the reader there.
    if (arabicAlternate) { location.replace(arabicAlternate); return; }
    enableArabic();
  } else {
    root.classList.remove('lang-ar');
    syncControls();
    reveal();
  }
})();
