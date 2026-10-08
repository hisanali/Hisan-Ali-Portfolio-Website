(() => {
  const page = document.querySelector('.ct-page');
  if (!page) return;

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const data = JSON.parse($('#ct-data')?.textContent || '{"services":[],"goals":[],"budgets":[],"colors":{}}');
  const DRAFT_KEY = 'ct-chat-v1';
  const store = {
    get: () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { return null; } },
    set: (value) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(value)); } catch (_) { /* storage unavailable */ } },
    clear: () => { try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* storage unavailable */ } }
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? 0 : ms));
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  /* ---------- Reveals ---------- */

  const revealTargets = $$('[data-ct-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty('--ct-delay', `${Math.min(index, 6) * 90}ms`);
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    const fold = innerHeight * 0.95;
    revealTargets.forEach((target) => {
      if (target.getBoundingClientRect().top < fold) target.classList.add('is-in');
      else observer.observe(target);
    });
  }
  page.classList.add('ct-js');

  /* ---------- "Say hello" in the languages people here actually use ---------- */

  const hello = $('[data-ct-hello-word]');
  if (hello && !reducedMotion.matches) {
    const words = [['hello', 'ltr'], ['مرحبا', 'rtl'], ['hola', 'ltr'], ['നമസ്കാരം', 'ltr'], ['bonjour', 'ltr'], ['नमस्ते', 'ltr'], ['hi', 'ltr']];
    let index = 0;
    setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % words.length;
      hello.classList.add('is-out');
      setTimeout(() => {
        [hello.textContent, hello.dir] = words[index];
        hello.classList.remove('is-out');
      }, 380);
    }, 2600);
  }

  /* ---------- Muscat time and availability ---------- */

  const clock = $('[data-ct-clock]');
  const status = $('[data-ct-status]');
  const statusLabel = $('[data-ct-status-label]');
  const presence = $('[data-ct-presence]');
  const presenceText = $('[data-ct-presence-text]');
  const hands = Object.fromEntries($$('[data-ct-hand]').map((hand) => [hand.dataset.ctHand, hand]));
  const weekDays = $$('[data-ct-week] li');
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', hour12: false });
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const muscatNow = () => Object.fromEntries(parts.formatToParts(new Date()).map((part) => [part.type, part.value]));
  const muscatTime = () => { const now = muscatNow(); return `${String(Number(now.hour) % 24).padStart(2, '0')}:${now.minute}`; };
  let secondTurns = 0;
  let lastSecond = -1;
  const tick = () => {
    const now = muscatNow();
    const hour = Number(now.hour) % 24;
    const minute = Number(now.minute);
    const second = Number(now.second);
    const day = dayIndex[now.weekday];
    const open = day <= 4 && hour >= 9 && hour < 18;
    if (clock) clock.textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    status?.classList.toggle('is-closed', !open);
    presence?.classList.toggle('is-away', !open);
    if (statusLabel) statusLabel.textContent = open ? 'Open now' : day >= 5 ? 'Weekend in Muscat' : 'After hours';
    if (presenceText) presenceText.textContent = open ? 'Online now · replies within 1–2 days' : 'Away · replies within 1–2 days';
    weekDays.forEach((item) => item.classList.toggle('is-today', Number(item.dataset.day) === day));
    if (second < lastSecond) secondTurns += 1;
    lastSecond = second;
    hands.h?.style.setProperty('--a', `${(hour % 12) * 30 + minute * 0.5}deg`);
    hands.m?.style.setProperty('--a', `${minute * 6 + second * 0.1}deg`);
    hands.s?.style.setProperty('--a', `${secondTurns * 360 + second * 6}deg`);
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Copy email & quick answers ---------- */

  $$('[data-ct-copy]').forEach((button) => {
    const label = $('span', button);
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(button.dataset.ctCopy);
        button.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        setTimeout(() => { button.classList.remove('is-copied'); if (label) label.textContent = 'Copy'; }, 1800);
      } catch (_) {
        location.href = `mailto:${button.dataset.ctCopy}`;
      }
    });
  });

  $$('.ct-qa button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.ct-qa');
      const open = !item.classList.contains('is-open');
      $$('.ct-qa').forEach((other) => {
        const on = other === item && open;
        other.classList.toggle('is-open', on);
        $('button', other).setAttribute('aria-expanded', String(on));
      });
    });
  });

  /* ================= Chat brief ================= */

  const chat = $('[data-ct-chat]');
  const log = $('[data-ct-log]');
  const composer = $('[data-ct-composer]');
  const restart = $('[data-ct-restart]');
  if (!chat || !log || !composer) return;

  const icon = (key) => key.startsWith('#')
    ? `<span class="ct-logo ct-logo-line"><svg class="ct-i" aria-hidden="true"><use href="${key}"/></svg></span>`
    : `<span class="ct-logo" style="--brand:${data.colors[key] || '#333'}"><svg aria-hidden="true"><use href="#ct-l-${key}"/></svg></span>`;
  const firstName = (name) => (name || '').trim().split(/\s+/)[0] || '';
  const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const MAX_MESSAGE = 2000;

  const reactions = {
    seo: 'Good choice — search compounds.', 'google-ads': 'Nice — intent is the best place to spend.', 'meta-ads': 'Great — let’s make the creative work harder.',
    'social-media': 'Love it — consistency wins on social.', content: 'Good — strong creative makes every channel cheaper.', analytics: 'Smart — good decisions start with good numbers.',
    other: 'Got it.', strategy: 'Perfect — direction first saves a lot of budget.', consultation: 'No problem — that’s exactly what the first chat is for.'
  };

  // Each step asks one question. `answer` renders what the visitor chose as their own bubble.
  const STEPS = [
    { id: 'service', type: 'choice', options: data.services, iconKey: 'icon',
      ask: () => ['What can I help you with?'] },
    { id: 'goal', type: 'choice', options: data.goals, skippable: true,
      ask: (s) => [`${reactions[s.service] || 'Got it.'} What’s the main outcome you’re after?`] },
    { id: 'message', type: 'text', multiline: true, min: 8, placeholder: 'e.g. We run a dental clinic in Al Khuwair and enquiries dropped this spring…',
      nudges: [['What you sell', 'We sell '], ['What’s happening now', 'Right now, '], ['Where you want to be', 'In three months I’d like '], ['Any deadline', 'The deadline is ']],
      ask: () => ['Tell me a little about the business — and what’s getting in the way right now.'] },
    { id: 'website', type: 'text', inputType: 'url', skippable: true, placeholder: 'https://', autocomplete: 'url',
      ask: () => ['Is there a website I can look at before I reply?'] },
    { id: 'budget', type: 'choice', options: data.budgets, skippable: true, prefix: 'OMR ',
      ask: () => ['Roughly what monthly budget should I plan around? It’s fine to skip this.'] },
    { id: 'name', type: 'text', min: 1, placeholder: 'Your name', autocomplete: 'name',
      ask: () => ['Really helpful, thank you. What’s your name?'] },
    { id: 'email', type: 'text', inputType: 'email', placeholder: 'you@company.com', autocomplete: 'email', validate: emailOk, error: 'That email doesn’t look quite right — mind checking it?',
      ask: (s) => [`Nice to meet you, ${escapeHtml(firstName(s.name))}. What’s the best email to reply to?`] },
    { id: 'phone', type: 'text', inputType: 'tel', skippable: true, placeholder: '+968', autocomplete: 'tel',
      ask: () => ['And a phone or WhatsApp number? Totally optional.'] },
    { id: 'reply', type: 'choice', skippable: true, options: [{ value: 'Email', label: 'Email' }, { value: 'WhatsApp', label: 'WhatsApp' }, { value: 'A call', label: 'A call' }],
      ask: () => ['Last one — how would you like me to get back to you?'] }
  ];
  const stepIndex = Object.fromEntries(STEPS.map((step, index) => [step.id, index]));

  let state = {};
  let labels = {};
  let current = -1;
  let busy = false;
  const persist = () => store.set({ state, labels, current });

  const scrollLog = () => { log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion.matches ? 'auto' : 'smooth' }); };

  const addBubble = (html, who = 'them', extra = {}) => {
    const bubble = document.createElement('div');
    bubble.className = `ct-bubble ct-bubble-${who}${extra.className ? ` ${extra.className}` : ''}`;
    if (extra.step) bubble.dataset.step = extra.step;
    bubble.innerHTML = `<div class="ct-bubble-body">${html}</div><span class="ct-bubble-meta">${muscatTime()}${who === 'me' ? '<i class="ct-ticks" aria-hidden="true"></i>' : ''}</span>`;
    log.append(bubble);
    scrollLog();
    return bubble;
  };

  const typing = async (ms = 700) => {
    const dots = document.createElement('div');
    dots.className = 'ct-bubble ct-bubble-them ct-typing';
    dots.setAttribute('aria-label', 'Hisan is typing');
    dots.innerHTML = '<span></span><span></span><span></span>';
    log.append(dots);
    scrollLog();
    await wait(ms);
    dots.remove();
  };

  const say = async (lines, step) => {
    for (const line of lines) {
      await typing(Math.min(1300, 450 + line.length * 12));
      addBubble(line, 'them', { step, className: 'ct-q' });
    }
  };

  /* Composer UIs */
  const clearComposer = () => { composer.replaceChildren(); composer.removeAttribute('data-kind'); };

  const renderChoice = (step) => {
    composer.dataset.kind = 'choice';
    const wrap = document.createElement('div');
    wrap.className = `ct-quick${step.iconKey ? ' ct-quick-tiles' : ''}`;
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Choose an answer');
    step.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ct-quick-btn';
      if (state[step.id] === option.value && labels[step.id] === option.label) button.classList.add('is-previous');
      button.innerHTML = `${step.iconKey ? icon(option[step.iconKey]) : ''}<span>${escapeHtml(step.prefix && !/under/i.test(option.label) ? `${step.prefix}${option.label}` : option.label)}</span>`;
      button.addEventListener('click', () => answer(step, option.value, option.label));
      wrap.append(button);
    });
    if (step.skippable) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'ct-quick-btn ct-quick-skip';
      skip.textContent = 'Skip';
      skip.addEventListener('click', () => answer(step, '', ''));
      wrap.append(skip);
    }
    composer.append(wrap);
    (wrap.querySelector('.is-previous') || wrap.firstElementChild)?.focus({ preventScroll: true });
  };

  const renderText = (step) => {
    composer.dataset.kind = 'text';
    const form = document.createElement('form');
    form.className = 'ct-type';
    form.noValidate = true;
    const id = `ct-input-${step.id}`;
    const field = document.createElement(step.multiline ? 'textarea' : 'input');
    field.id = id;
    field.className = 'ct-type-field';
    field.placeholder = step.placeholder || '';
    if (!step.multiline) field.type = step.inputType || 'text';
    else { field.rows = 3; field.maxLength = MAX_MESSAGE; }
    if (step.autocomplete) field.autocomplete = step.autocomplete;
    if (step.inputType === 'email') field.inputMode = 'email';
    if (step.inputType === 'tel') field.inputMode = 'tel';
    if (step.inputType === 'url') field.inputMode = 'url';
    field.value = state[step.id] || '';
    const label = document.createElement('label');
    label.className = 'ct-sr';
    label.htmlFor = id;
    label.textContent = step.placeholder || step.id;
    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'ct-send';
    send.setAttribute('aria-label', 'Send reply');
    send.innerHTML = '<svg class="ct-i" aria-hidden="true"><use href="#ct-send"/></svg>';
    const row = document.createElement('div');
    row.className = 'ct-type-row';
    row.append(label, field, send);
    const error = document.createElement('p');
    error.className = 'ct-type-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;

    if (step.nudges) {
      const nudges = document.createElement('div');
      nudges.className = 'ct-nudges';
      nudges.innerHTML = '<span>Need a nudge?</span>';
      step.nudges.forEach(([text, starter]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.addEventListener('click', () => {
          const joiner = !field.value ? '' : /\n$/.test(field.value) ? '' : '\n';
          field.value = `${field.value}${joiner}${starter}`.slice(0, MAX_MESSAGE);
          field.focus();
          field.setSelectionRange(field.value.length, field.value.length);
          grow();
        });
        nudges.append(button);
      });
      form.append(nudges);
    }
    form.append(row, error);
    if (step.skippable) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'ct-type-skip';
      skip.textContent = 'Skip this';
      skip.addEventListener('click', () => answer(step, '', ''));
      form.append(skip);
    }
    if (step.multiline) {
      const tip = document.createElement('p');
      tip.className = 'ct-type-tip';
      tip.innerHTML = '<kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line';
      form.append(tip);
    }
    const grow = () => {
      if (!step.multiline) return;
      field.style.height = 'auto';
      field.style.height = `${Math.min(180, field.scrollHeight)}px`;
    };
    field.addEventListener('input', () => { grow(); error.hidden = true; });
    field.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && step.multiline) { event.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = field.value.trim();
      if (!value && step.skippable) { answer(step, '', ''); return; }
      if (value.length < (step.min || 1) || (step.validate && !step.validate(value))) {
        error.textContent = step.error || (step.id === 'message' ? 'A sentence or two helps me reply usefully.' : 'This one’s needed so I can reply.');
        error.hidden = false;
        field.focus();
        return;
      }
      answer(step, value, value);
    });
    composer.append(form);
    grow();
    field.focus({ preventScroll: true });
  };

  const ask = async (index) => {
    current = index;
    persist();
    clearComposer();
    busy = true;
    const step = STEPS[index];
    await say(step.ask(state), step.id);
    busy = false;
    if (step.type === 'choice') renderChoice(step); else renderText(step);
  };

  const answerHtml = (step, label) => {
    if (!label) return '<span class="ct-skipped">Skipped</span>';
    const option = step.options?.find((item) => item.label === label);
    const text = escapeHtml(step.prefix && !/under/i.test(label) ? `${step.prefix}${label}` : label).replace(/\n/g, '<br>');
    return `${option && step.iconKey ? icon(option[step.iconKey]) : ''}<span>${text}</span>`;
  };

  // Tapping one of your own answers rewinds the chat to that question.
  const addAnswer = (step, label) => {
    const bubble = addBubble(answerHtml(step, label), 'me', { step: step.id });
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'ct-edit';
    edit.setAttribute('aria-label', `Change your answer: ${label || 'skipped'}`);
    edit.innerHTML = '<svg class="ct-i" aria-hidden="true"><use href="#ct-edit"/></svg>';
    edit.addEventListener('click', () => rewind(step.id));
    bubble.append(edit);
  };

  const answer = async (step, value, label) => {
    if (busy) return;
    state[step.id] = value;
    labels[step.id] = label;
    clearComposer();
    addAnswer(step, label);
    restart.hidden = false;
    const next = nextStep(stepIndex[step.id] + 1);
    if (next < STEPS.length) await ask(next);
    else await review();
  };

  const nextStep = (from) => from;

  const rewind = async (id) => {
    if (busy) return;
    const question = $$(`.ct-q[data-step="${id}"]`, log)[0];
    if (!question) return;
    let node = question.nextElementSibling;
    while (node) { const next = node.nextElementSibling; node.remove(); node = next; }
    current = stepIndex[id];
    persist();
    clearComposer();
    const step = STEPS[current];
    if (step.type === 'choice') renderChoice(step); else renderText(step);
  };

  /* Review card + submission (same Google Form and field mapping as before) */
  const GOOGLE_FORM = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfJndk37Z7sfGsaS8Nn3ujDMIBhU75pl0FRnykxge4fwxFfcQ/formResponse';
  const SERVICE_MAP = {
    seo: 'SEO Optimization', 'google-ads': 'Google ADS management', 'meta-ads': 'Social Media Marketing', 'social-media': 'Social Media Marketing',
    content: 'Graphic Design', analytics: 'Consultation', strategy: 'Consultation', consultation: 'Consultation', other: 'Other'
  };

  const review = async () => {
    current = STEPS.length;
    persist();
    await say(['Perfect. Here’s your brief — have a quick look:'], 'review');
    const rows = [
      ['Need', [labels.service, labels.goal].filter(Boolean).join(' · ')],
      ['Context', state.message],
      ['Website', state.website],
      ['Budget', labels.budget ? (/under/i.test(labels.budget) ? `${labels.budget} OMR` : `OMR ${labels.budget}`) + ' / month' : ''],
      ['Reply to', [state.name, state.email, state.phone, labels.reply ? `prefers ${labels.reply === 'WhatsApp' ? 'WhatsApp' : labels.reply.toLowerCase()}` : ''].filter(Boolean).join(' · ')]
    ].filter(([, value]) => value);
    const card = addBubble(`<p class="ct-card-title">Project brief</p><dl class="ct-card">${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${escapeHtml(value).replace(/\n/g, '<br>')}</dd></div>`).join('')}</dl><p class="ct-card-note">Tap any of your answers above to change it.</p>`, 'them', { className: 'ct-bubble-card' });
    composer.dataset.kind = 'send';
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'ct-btn ct-btn-primary ct-send-brief';
    send.innerHTML = 'Send brief <svg class="ct-i" aria-hidden="true"><use href="#ct-send"/></svg>';
    const note = document.createElement('p');
    note.className = 'ct-send-note';
    note.innerHTML = '<svg class="ct-i" aria-hidden="true"><use href="#ct-lock"/></svg>Read personally — never shared or added to a mailing list.';
    const error = document.createElement('p');
    error.className = 'ct-type-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    send.addEventListener('click', () => submit(send, error, card));
    composer.append(send, note, error);
    send.focus({ preventScroll: true });
  };

  const submit = async (button, error, card) => {
    const message = [
      state.message,
      labels.service ? `Service: ${labels.service}` : '',
      state.website ? `Website: ${state.website}` : '',
      state.goal ? `Primary goal: ${state.goal}` : '',
      labels.reply ? `Preferred reply: ${labels.reply}` : ''
    ].filter(Boolean).join('\n\n');
    const body = new FormData();
    body.append('entry.975940308', state.name || '');
    body.append('entry.974041241', state.email || '');
    body.append('entry.1031713771', state.phone || '');
    body.append('entry.406911209', '');
    body.append('entry.1629603893', state.budget || '');
    body.append('entry.1936083772', message);
    if (SERVICE_MAP[state.service]) body.append('entry.427941684', SERVICE_MAP[state.service]);

    button.disabled = true;
    button.textContent = 'Sending…';
    error.hidden = true;
    try {
      await fetch(GOOGLE_FORM, { method: 'POST', mode: 'no-cors', body });
    } catch (_) {
      button.disabled = false;
      button.innerHTML = 'Try again <svg class="ct-i" aria-hidden="true"><use href="#ct-send"/></svg>';
      error.textContent = 'That didn’t go through. Try again, or email workhisan@gmail.com directly.';
      error.hidden = false;
      return;
    }
    document.dispatchEvent(new CustomEvent('portfolio:lead-submitted'));
    store.clear();
    clearComposer();
    restart.hidden = true;
    $$('.ct-edit', log).forEach((edit) => edit.remove());
    card.classList.add('is-sent');
    addBubble('<span>Sent the brief</span>', 'me', { className: 'is-read' });
    const name = firstName(state.name);
    await say([`Thank you${name ? `, ${escapeHtml(name)}` : ''}! It’s with me now — I’ll read it personally and reply within one to two days.`, 'If it’s time-sensitive, WhatsApp is the fastest way to reach me.'], 'done');
    composer.dataset.kind = 'done';
    const wa = document.createElement('a');
    wa.className = 'ct-btn ct-btn-primary';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.href = `https://wa.me/96896110846?text=${encodeURIComponent(`Hi Hisan, it's ${state.name} — I just sent a project brief through your website.`)}`;
    wa.innerHTML = 'Continue on WhatsApp <svg class="ct-i" aria-hidden="true"><use href="#ct-arrow"/></svg>';
    const read = document.createElement('a');
    read.className = 'ct-btn ct-btn-ghost';
    read.href = '/blog/';
    read.textContent = 'Read while you wait';
    composer.append(wa, read);
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: 'contact_chat', service: state.service || 'unspecified' });
  };

  /* ---------- Start, resume, or arrive with a brief ---------- */

  const replay = () => {
    // Rebuild the visible conversation from saved answers without the typing delays.
    STEPS.slice(0, current).forEach((step) => {
      addBubble(step.ask(state).join(' '), 'them', { step: step.id, className: 'ct-q' });
      addAnswer(step, labels[step.id] || '');
    });
  };

  const start = async (fromScratch) => {
    state = {};
    labels = {};
    $$('.ct-bubble', log).forEach((bubble) => bubble.remove());
    const params = new URLSearchParams(location.search);
    const brief = !fromScratch && (params.get('brief') || (params.get('diagnostic') ? `I completed the Growth Diagnostic. Result: ${params.get('diagnostic')}\n\nI would like help deciding what to prioritize first.` : ''));
    await say(['Hi — I’m Hisan. Thanks for stopping by.']);
    if (brief) {
      const service = data.services.find((item) => item.value === params.get('service'));
      const goal = data.goals.find((item) => item.value === params.get('goal'));
      if (service) { state.service = service.value; labels.service = service.label; }
      if (goal) { state.goal = goal.value; labels.goal = goal.label; }
      state.message = brief.slice(0, MAX_MESSAGE);
      labels.message = state.message;
      if (params.get('website')) { state.website = params.get('website').slice(0, 300); labels.website = state.website; }
      addBubble(`<span class="ct-attach-label">Your brief</span>${escapeHtml(state.message).replace(/\n/g, '<br>')}`, 'me', { className: 'ct-bubble-attach' });
      restart.hidden = false;
      await say(['Thanks for sending that over — it gives me a great head start. Just a few details so I can reply.']);
      await ask(state.service ? stepIndex.budget : stepIndex.service);
      return;
    }
    await ask(0);
  };

  restart.addEventListener('click', async () => {
    if (busy) return;
    store.clear();
    clearComposer();
    restart.hidden = true;
    history.replaceState(null, '', location.pathname);
    await start(true);
  });

  const saved = store.get();
  const hasParams = new URLSearchParams(location.search).has('brief') || new URLSearchParams(location.search).has('diagnostic');
  const beginWhenVisible = (fn) => {
    // Start the conversation when the chat scrolls into view, so the typing is actually seen.
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); fn(); }
    }, { threshold: 0.25 });
    observer.observe(chat);
  };

  if (saved && saved.current > 0 && !hasParams) {
    state = saved.state || {};
    labels = saved.labels || {};
    current = Math.min(saved.current, STEPS.length);
    replay();
    restart.hidden = false;
    beginWhenVisible(async () => {
      await say(['Welcome back — want to pick up where you left off?']);
      composer.dataset.kind = 'choice';
      const wrap = document.createElement('div');
      wrap.className = 'ct-quick';
      [['Continue', async () => { clearComposer(); addBubble('<span>Continue</span>', 'me'); if (current >= STEPS.length) await review(); else await ask(current); }],
        ['Start over', async () => { clearComposer(); store.clear(); await start(true); }]].forEach(([text, fn]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ct-quick-btn';
        button.textContent = text;
        button.addEventListener('click', fn);
        wrap.append(button);
      });
      composer.append(wrap);
    });
  } else {
    beginWhenVisible(() => start(false));
  }
})();
