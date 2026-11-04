/* Listen to this article.
   Reads the article aloud with the browser's own speech voices (no audio files,
   nothing leaves the device). Picks the most natural voices available — the
   "Natural", "Neural", "Online", "Enhanced" and "Premium" voices that Edge,
   Chrome, Safari and Android ship — and lets the reader choose a narrator or a
   three-voice cast that switches between headings, body text and quotes.
   Follows the article language: Arabic text is read by an Arabic voice. */
(() => {
  'use strict';

  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return;

  const article = document.getElementById('blog-content') || document.querySelector('article.blog-post-content');
  if (!article) return;

  const STORE = 'blog-listen-v1';
  const prefs = (() => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (error) { return {}; } })();
  const savePrefs = () => { try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch (error) { /* storage unavailable */ } };

  const arabicUi = () => document.documentElement.lang === 'ar';
  const T = {
    listen: ['Listen to this article', 'استمع إلى المقال'],
    listenShort: ['Listen', 'استمع'],
    minutes: ['min listen', ''],
    play: ['Play', 'تشغيل'],
    pause: ['Pause', 'إيقاف مؤقت'],
    resume: ['Resume', 'متابعة'],
    back: ['Previous paragraph', 'الفقرة السابقة'],
    next: ['Next paragraph', 'الفقرة التالية'],
    speed: ['Reading speed', 'سرعة القراءة'],
    voices: ['Voices', 'الأصوات'],
    narrator: ['Narrator', 'الراوي'],
    cast: ['Cast mode', 'وضع الأصوات المتعددة'],
    castHint: ['Headings, body and quotes each get their own voice', 'لكل من العناوين والنص والاقتباسات صوت مختلف'],
    follow: ['Follow along', 'تتبّع القراءة'],
    close: ['Close player', 'إغلاق المشغّل'],
    noVoices: ['No voices for this language on this device. Install one in your system speech settings.', 'لا توجد أصوات لهذه اللغة على هذا الجهاز. يمكنك تثبيت صوت من إعدادات النطق في النظام.'],
    best: ['Most natural', 'الأكثر طبيعية'],
    sample: ['Preview', 'استماع تجريبي'],
    done: ['Finished reading', 'انتهت القراءة'],
    of: ['of', 'من']
  };
  const t = (key) => T[key][arabicUi() ? 1 : 0];

  /* ---------- Voices ---------- */
  const ACCENTS = {
    'en-us': ['American', 'أمريكي'], 'en-gb': ['British', 'بريطاني'], 'en-au': ['Australian', 'أسترالي'], 'en-in': ['Indian', 'هندي'],
    'en-ie': ['Irish', 'أيرلندي'], 'en-ca': ['Canadian', 'كندي'], 'en-nz': ['New Zealand', 'نيوزيلندي'], 'en-za': ['South African', 'جنوب أفريقي'],
    'en-sg': ['Singapore', 'سنغافوري'], 'en-ph': ['Philippine', 'فلبيني'], 'en-ng': ['Nigerian', 'نيجيري'], 'en-ke': ['Kenyan', 'كيني'],
    'ar-sa': ['Saudi', 'سعودي'], 'ar-ae': ['Emirati', 'إماراتي'], 'ar-om': ['Omani', 'عُماني'], 'ar-qa': ['Qatari', 'قطري'], 'ar-kw': ['Kuwaiti', 'كويتي'],
    'ar-bh': ['Bahraini', 'بحريني'], 'ar-eg': ['Egyptian', 'مصري'], 'ar-jo': ['Jordanian', 'أردني'], 'ar-lb': ['Lebanese', 'لبناني'], 'ar-ma': ['Moroccan', 'مغربي'],
    'ar-dz': ['Algerian', 'جزائري'], 'ar-tn': ['Tunisian', 'تونسي'], 'ar-sy': ['Syrian', 'سوري'], 'ar-iq': ['Iraqi', 'عراقي'], 'ar-ye': ['Yemeni', 'يمني'], 'ar-ly': ['Libyan', 'ليبي'], 'ar-xa': ['Arabic', 'عربي']
  };
  const GULF = ['ar-om', 'ar-ae', 'ar-sa', 'ar-qa', 'ar-kw', 'ar-bh'];

  const quality = (voice) => {
    const name = voice.name;
    let score = 0;
    if (/natural|neural/i.test(name)) score += 60;
    if (/online/i.test(name)) score += 25;
    if (/premium|enhanced|\(enhanced\)|siri/i.test(name)) score += 45;
    if (/^google /i.test(name)) score += 30;
    if (!voice.localService) score += 8;
    if (/compact|eloquence|espeak|robot|novelty|bad news|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bahh|fred|junior|ralph|kathy|grandma|grandpa|rocko|sandy|shelley|flo|reed/i.test(name)) score -= 80;
    if (voice.default) score += 3;
    return score;
  };

  const tidyName = (voice) => voice.name
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s*\((?:Natural|Enhanced|Premium)\)/gi, '')
    .replace(/\s+Online/i, '')
    .replace(/\s*-\s*[A-Za-z]+(?:\s*\([^)]*\))?\s*$/, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\b(English|Arabic|United States|United Kingdom|US|UK)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || voice.name;
  const displayName = (voice) => {
    const name = tidyName(voice);
    if (/^(male|female)$/i.test(name)) {
      const male = /male/i.test(name) && !/female/i.test(name);
      return arabicUi() ? `${male ? 'صوت رجالي' : 'صوت نسائي'} ${accentOf(voice)}` : `${accentOf(voice)} ${male ? 'male' : 'female'}`;
    }
    return name;
  };

  const accentOf = (voice) => {
    const code = (voice.lang || '').toLowerCase().replace('_', '-');
    const entry = ACCENTS[code] || ACCENTS[code.slice(0, 2) + '-xa'];
    return entry ? entry[arabicUi() ? 1 : 0] : voice.lang;
  };

  let allVoices = [];
  const voicesFor = (language) => allVoices
    .filter((voice) => (voice.lang || '').toLowerCase().startsWith(language))
    .map((voice) => {
      let score = quality(voice);
      if (language === 'ar' && GULF.includes((voice.lang || '').toLowerCase().replace('_', '-'))) score += 6;
      if (language === 'en' && /en[-_](gb|us)/i.test(voice.lang)) score += 2;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.voice);

  const loadVoices = () => { allVoices = synth.getVoices(); return allVoices.length; };

  /* ---------- Reading script ---------- */
  const BLOCKS = 'h1,h2,h3,h4,h5,p,li,blockquote,figcaption,dt,dd,td,th,summary,.callout,.key-takeaway';
  const isArabic = (text) => /[؀-ۿ]/.test(text);
  const hidden = (element) => !element.getClientRects().length || getComputedStyle(element).visibility === 'hidden';

  const splitSentences = (text, limit = 230) => {
    const parts = text.match(/[^.!?؟。]+[.!?؟。]+["”’»)]*\s*|[^.!?؟。]+$/g) || [text];
    const out = [];
    let current = '';
    parts.forEach((part) => {
      if ((current + part).length > limit && current) { out.push(current.trim()); current = ''; }
      if (part.length > limit) {
        part.split(/(?<=[,،;:—–])\s+/).forEach((piece) => {
          if ((current + ' ' + piece).length > limit && current) { out.push(current.trim()); current = ''; }
          current += (current ? ' ' : '') + piece;
        });
      } else current += part;
    });
    if (current.trim()) out.push(current.trim());
    return out;
  };

  const roleOf = (element) => {
    if (/^H[1-5]$/.test(element.tagName)) return 'heading';
    if (element.closest('blockquote, .callout, .key-takeaway, figcaption, aside')) return 'quote';
    return 'body';
  };

  const buildScript = () => {
    const chunks = [];
    const heading = document.querySelector('.blog-post-header h1, .blog-post-hero h1, main h1');
    const add = (element, text, role) => {
      const clean = text.replace(/\s+/g, ' ').replace(/[↗→←↓↑›‹★☆✦✓×]/g, '').trim();
      if (!clean || !/[\p{L}\p{N}]/u.test(clean)) return;
      splitSentences(clean).forEach((sentence) => chunks.push({ element, text: sentence, role, lang: isArabic(sentence) ? 'ar' : 'en' }));
    };
    if (heading) add(heading, heading.textContent, 'heading');
    article.querySelectorAll(BLOCKS).forEach((element) => {
      if (hidden(element) || element.closest('[data-listen-skip], .blog-listen, nav, .toc, .table-of-contents, .article-language-switcher, pre, code, button')) return;
      // Read only the innermost blocks so nothing is spoken twice.
      if (element.querySelector(BLOCKS)) return;
      add(element, element.innerText || element.textContent, roleOf(element));
    });
    return chunks;
  };

  /* ---------- UI ---------- */
  const words = (article.innerText || article.textContent).split(/\s+/).filter(Boolean).length;
  const listenMinutes = Math.max(1, Math.round(words / 165));

  const icon = (name) => ({
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2v12H6zM9.5 12 18 6v12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
    wave: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 10v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    voice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2a5 5 0 0 1-10 0z"/></svg>'
  })[name];

  const launcher = document.createElement('div');
  launcher.className = 'blog-listen';
  launcher.setAttribute('data-i18n-skip', '');
  launcher.innerHTML = `<button type="button" class="bl-start" data-bl-start><span class="bl-start-icon">${icon('play')}</span><span class="bl-start-copy"><b data-bl-t="listen"></b><small><span data-bl-minutes></span> · <span data-bl-voice-name></span></small></span><span class="bl-start-wave" aria-hidden="true">${icon('wave')}</span></button>`;

  const player = document.createElement('div');
  player.className = 'bl-player';
  player.hidden = true;
  player.setAttribute('role', 'region');
  player.setAttribute('data-i18n-skip', '');
  player.innerHTML = `
    <div class="bl-progress" aria-hidden="true"><i data-bl-bar></i></div>
    <div class="bl-row">
      <button type="button" class="bl-btn" data-bl-back>${icon('back')}</button>
      <button type="button" class="bl-btn bl-main" data-bl-toggle>${icon('pause')}</button>
      <button type="button" class="bl-btn" data-bl-next>${icon('next')}</button>
      <div class="bl-now"><b data-bl-speaker></b><small data-bl-position></small></div>
      <button type="button" class="bl-chip" data-bl-rate></button>
      <button type="button" class="bl-chip bl-voice-btn" data-bl-voices aria-expanded="false">${icon('voice')}<span data-bl-t="voices"></span></button>
      <button type="button" class="bl-btn bl-close" data-bl-close>${icon('close')}</button>
    </div>
    <div class="bl-panel" data-bl-panel hidden>
      <label class="bl-switch"><input type="checkbox" data-bl-cast><span><b data-bl-t="cast"></b><small data-bl-t="castHint"></small></span></label>
      <label class="bl-switch"><input type="checkbox" data-bl-follow><span><b data-bl-t="follow"></b></span></label>
      <div class="bl-voice-list" data-bl-list role="listbox"></div>
    </div>
    <span class="bl-sr" aria-live="polite" data-bl-status></span>`;

  const $ = (selector, root = player) => root.querySelector(selector);
  const anchor = document.querySelector('.blog-post-meta') || document.querySelector('.blog-post-header') || article;
  if (anchor === article) article.before(launcher); else anchor.after(launcher);
  document.body.appendChild(player);

  const RATES = [0.85, 1, 1.15, 1.3, 1.5];
  if (!RATES.includes(prefs.rate)) prefs.rate = 1;
  if (prefs.follow === undefined) prefs.follow = true;

  const paintLabels = () => {
    [launcher, player].forEach((root) => root.querySelectorAll('[data-bl-t]').forEach((element) => { element.textContent = t(element.dataset.blT); }));
    const arMinutes = listenMinutes === 1 ? 'دقيقة واحدة' : listenMinutes === 2 ? 'دقيقتان' : listenMinutes <= 10 ? `${listenMinutes} دقائق` : `${listenMinutes} دقيقة`;
    launcher.querySelector('[data-bl-minutes]').textContent = arabicUi() ? `استماع ${arMinutes}` : `${listenMinutes} ${t('minutes')}`;
    $('[data-bl-back]').setAttribute('aria-label', t('back'));
    $('[data-bl-next]').setAttribute('aria-label', t('next'));
    $('[data-bl-close]').setAttribute('aria-label', t('close'));
    $('[data-bl-rate]').setAttribute('aria-label', t('speed'));
    $('[data-bl-rate]').textContent = `${prefs.rate}×`;
    player.setAttribute('aria-label', t('listen'));
    player.dir = arabicUi() ? 'rtl' : 'ltr';
    launcher.dir = arabicUi() ? 'rtl' : 'ltr';
  };

  /* ---------- Casting ---------- */
  const languageNow = () => (isArabic((article.innerText || '').slice(0, 600)) ? 'ar' : 'en');
  const castFor = (language) => {
    const list = voicesFor(language);
    if (!list.length) return null;
    const chosenName = prefs[`voice-${language}`];
    const narrator = list.find((voice) => voice.name === chosenName) || list[0];
    if (!prefs.cast) return { heading: narrator, body: narrator, quote: narrator };
    // Pick contrasting voices: prefer a different accent/name family for each role.
    const others = list.filter((voice) => voice !== narrator && quality(voice) > -20);
    const different = (base, pool) => pool.find((voice) => voice.lang !== base.lang) || pool[0] || base;
    const heading = different(narrator, others);
    const quote = others.find((voice) => voice !== heading && voice.lang !== narrator.lang) || others.find((voice) => voice !== heading) || heading;
    return { heading, body: narrator, quote };
  };

  let chunks = [];
  let index = 0;
  let playing = false;
  let session = 0;
  let current = null;

  const setStatus = (text) => { $('[data-bl-status]').textContent = text; };
  const voiceLabel = (voice) => (voice ? `${displayName(voice)} · ${accentOf(voice)}` : '');

  const updateLauncherVoice = () => {
    const cast = castFor(languageNow());
    launcher.querySelector('[data-bl-voice-name]').textContent = cast ? (prefs.cast ? t('cast') : voiceLabel(cast.body)) : t('noVoices');
  };

  const highlight = (element) => {
    document.querySelectorAll('.bl-reading').forEach((node) => node.classList.remove('bl-reading'));
    if (!element) return;
    element.classList.add('bl-reading');
    if (prefs.follow) {
      const box = element.getBoundingClientRect();
      if (box.top < 90 || box.bottom > innerHeight - 140) element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
  };

  const updateNow = (chunk, voice) => {
    const total = chunks.length;
    $('[data-bl-bar]').style.width = `${total ? ((index + 1) / total) * 100 : 0}%`;
    $('[data-bl-speaker]').textContent = voice ? displayName(voice) : '';
    const block = new Set(chunks.slice(0, index + 1).map((c) => c.element)).size;
    const blocks = new Set(chunks.map((c) => c.element)).size;
    $('[data-bl-position]').textContent = `${block} ${t('of')} ${blocks}${prefs.cast && chunk ? ` · ${chunk.role === 'heading' ? (arabicUi() ? 'عنوان' : 'Heading') : chunk.role === 'quote' ? (arabicUi() ? 'اقتباس' : 'Quote') : t('narrator')}` : ''}`;
  };

  const setToggle = () => {
    const button = $('[data-bl-toggle]');
    button.innerHTML = playing ? icon('pause') : icon('play');
    button.setAttribute('aria-label', playing ? t('pause') : t('resume'));
    launcher.classList.toggle('is-playing', playing);
  };

  const speakFrom = (start) => {
    synth.cancel();
    session += 1;
    const mySession = session;
    index = Math.max(0, Math.min(start, chunks.length - 1));
    playing = true;
    setToggle();
    const step = () => {
      if (mySession !== session || !playing) return;
      if (index >= chunks.length) {
        playing = false; setToggle(); highlight(null); setStatus(t('done')); index = 0; return;
      }
      const chunk = chunks[index];
      const cast = castFor(chunk.lang);
      const voice = cast ? cast[chunk.role] : null;
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else utterance.lang = chunk.lang === 'ar' ? 'ar-SA' : 'en-GB';
      utterance.rate = prefs.rate * (chunk.role === 'heading' ? 0.96 : 1);
      utterance.pitch = 1;
      utterance.onend = () => { if (mySession !== session) return; index += 1; step(); };
      utterance.onerror = (event) => { if (mySession !== session || event.error === 'interrupted' || event.error === 'canceled') return; index += 1; step(); };
      current = utterance;
      highlight(chunk.element);
      updateNow(chunk, voice);
      synth.speak(utterance);
    };
    step();
  };

  const pause = () => { playing = false; session += 1; synth.cancel(); setToggle(); };

  const open = () => {
    if (!allVoices.length) loadVoices();
    chunks = buildScript();
    if (!chunks.length) return;
    player.hidden = false;
    document.body.classList.add('bl-open');
    paintLabels();
    renderVoices();
    speakFrom(prefs.resume?.path === location.pathname && prefs.resume.index < chunks.length ? prefs.resume.index : 0);
  };

  const close = () => {
    pause();
    highlight(null);
    player.hidden = true;
    document.body.classList.remove('bl-open');
    $('[data-bl-panel]').hidden = true;
    $('[data-bl-voices]').setAttribute('aria-expanded', 'false');
  };

  const renderVoices = () => {
    const language = languageNow();
    const list = voicesFor(language).filter((voice) => quality(voice) > -20).slice(0, 12);
    const holder = $('[data-bl-list]');
    holder.innerHTML = '';
    if (!list.length) { holder.innerHTML = `<p class="bl-empty">${t('noVoices')}</p>`; return; }
    const chosen = castFor(language)?.body;
    list.forEach((voice, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'bl-voice';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(voice === chosen));
      const natural = quality(voice) >= 45;
      item.innerHTML = `<span class="bl-avatar" style="--h:${(i * 47 + 20) % 360}">${displayName(voice).charAt(0)}</span><span class="bl-voice-copy"><b></b><small></small></span>${natural ? `<em>${t('best')}</em>` : ''}`;
      item.querySelector('b').textContent = displayName(voice);
      item.querySelector('small').textContent = accentOf(voice);
      item.addEventListener('click', () => {
        prefs[`voice-${language}`] = voice.name;
        savePrefs();
        renderVoices();
        updateLauncherVoice();
        if (playing) speakFrom(index);
        else {
          const sample = new SpeechSynthesisUtterance(language === 'ar' ? 'مرحبًا، سأقرأ لك هذا المقال.' : 'Hello, I will read this article for you.');
          sample.voice = voice; sample.lang = voice.lang; sample.rate = prefs.rate; synth.cancel(); synth.speak(sample);
        }
      });
      holder.appendChild(item);
    });
  };

  /* ---------- Wiring ---------- */
  launcher.querySelector('[data-bl-start]').addEventListener('click', () => {
    if (!player.hidden && playing) { pause(); return; }
    if (!player.hidden) { speakFrom(index); return; }
    open();
  });
  $('[data-bl-toggle]').addEventListener('click', () => (playing ? pause() : speakFrom(index)));
  $('[data-bl-back]').addEventListener('click', () => {
    const here = chunks[index]?.element;
    let target = index;
    while (target > 0 && chunks[target].element === here) target -= 1;
    const previous = chunks[target]?.element;
    while (target > 0 && chunks[target - 1].element === previous) target -= 1;
    speakFrom(target);
  });
  $('[data-bl-next]').addEventListener('click', () => {
    const here = chunks[index]?.element;
    let target = index;
    while (target < chunks.length - 1 && chunks[target].element === here) target += 1;
    speakFrom(target);
  });
  $('[data-bl-rate]').addEventListener('click', () => {
    prefs.rate = RATES[(RATES.indexOf(prefs.rate) + 1) % RATES.length];
    savePrefs();
    $('[data-bl-rate]').textContent = `${prefs.rate}×`;
    if (playing) speakFrom(index);
  });
  $('[data-bl-voices]').addEventListener('click', () => {
    const panel = $('[data-bl-panel]');
    panel.hidden = !panel.hidden;
    $('[data-bl-voices]').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) renderVoices();
  });
  $('[data-bl-cast]').checked = Boolean(prefs.cast);
  $('[data-bl-cast]').addEventListener('change', (event) => { prefs.cast = event.target.checked; savePrefs(); updateLauncherVoice(); if (playing) speakFrom(index); });
  $('[data-bl-follow]').checked = Boolean(prefs.follow);
  $('[data-bl-follow]').addEventListener('change', (event) => { prefs.follow = event.target.checked; savePrefs(); });
  $('[data-bl-close]').addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (player.hidden || event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'Escape') close();
  });

  // Remember the position so a reload continues where the reader stopped.
  addEventListener('pagehide', () => {
    if (!player.hidden && index > 0) { prefs.resume = { path: location.pathname, index }; savePrefs(); }
    else if (prefs.resume?.path === location.pathname) { delete prefs.resume; savePrefs(); }
    synth.cancel();
  });
  // Chrome stops long sessions silently; nudge it while speaking.
  setInterval(() => { if (playing && !synth.speaking && !synth.pending && current) speakFrom(index); }, 4000);

  const refresh = () => { loadVoices(); paintLabels(); updateLauncherVoice(); if (!player.hidden) renderVoices(); };
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refresh);
  else synth.onvoiceschanged = refresh;
  refresh();
  setTimeout(refresh, 600);
  document.addEventListener('site-language-change', () => { refresh(); if (playing) { chunks = buildScript(); speakFrom(0); } });
  // The article picker swaps the body in place; rebuild the script when it does.
  new MutationObserver(() => { if (!player.hidden) { const wasPlaying = playing; chunks = buildScript(); if (wasPlaying) speakFrom(0); } updateLauncherVoice(); })
    .observe(article, { childList: true });
})();
