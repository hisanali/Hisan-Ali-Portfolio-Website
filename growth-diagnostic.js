/* Growth Diagnostic — a playful ten-question marketing check-up. Namespaced gx-. */
(() => {
  const page = document.querySelector('[data-gx]');
  if (!page) return;

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const STORE_KEY = 'gx-diagnostic-v1';
  const store = {
    get: () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {}; } catch (_) { return {}; } },
    set: (value) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch (_) { /* storage unavailable */ } }
  };

  /* ---------- Content ---------- */

  const GOALS = [
    { value: 'qualified leads', label: 'More qualified leads', w: { seo: 1, ads: 1.2, conv: 1.35, content: 0.9, data: 1.1 } },
    { value: 'online sales', label: 'More online sales', w: { seo: 1, ads: 1.3, conv: 1.35, content: 0.85, data: 1.1 } },
    { value: 'search visibility', label: 'Better search visibility', w: { seo: 1.5, ads: 0.7, conv: 0.9, content: 1.25, data: 0.95 } },
    { value: 'brand demand', label: 'Stronger brand demand', w: { seo: 1, ads: 1.1, conv: 0.85, content: 1.45, data: 0.9 } },
    { value: 'measurement clarity', label: 'Clearer performance data', w: { seo: 0.8, ads: 1, conv: 0.9, content: 0.75, data: 1.6 } }
  ];

  const DOMAINS = [
    { id: 'seo', name: 'Visibility', long: 'Search visibility', service: 'seo',
      about: 'Can the buyers already searching for what you sell actually find you?',
      diag: ['Buyers searching for what you sell are mostly finding someone else. Search isn’t yet a channel you can count on.',
        'You show up for some searches, but visibility is uneven and hard to predict month to month.',
        'Search is a dependable source of demand. The job now is widening the lead, not fixing basics.'],
      acts: [['Check Search Console for indexing errors and fix anything blocking your key pages.', 'Complete and verify your Google Business Profile: categories, hours, photos and services.', 'List the five searches a ready-to-buy customer types and match each to one page.'],
        ['Rewrite the titles and intros of your top five commercial pages around the search each should win.', 'Link every helpful article to the service or product page it supports.', 'Ask your last ten happy customers for a Google review.'],
        ['Find pages ranking 5–15 in Search Console and improve the one closest to page one.', 'Publish one comparison or pricing page that buyers search for right before deciding.', 'Check how you appear in AI answers for your main queries and fill the gaps.']] },
    { id: 'ads', name: 'Acquisition', long: 'Paid acquisition', service: 'google-ads',
      about: 'Is paid media run as a system tied to revenue, or as a tap you open and hope?',
      diag: ['Paid media is either off or running without a clear link to revenue, so budget can’t be scaled with confidence.',
        'Campaigns are organised, but spend isn’t yet steered by the quality of leads or sales.',
        'Paid acquisition is disciplined. Gains now come from creative testing and sharper budget allocation.'],
      acts: [['Pick one primary conversion (a lead or a purchase) and make sure it records correctly.', 'Pause campaigns you can’t connect to any enquiry or sale.', 'Start with one high-intent search campaign on the terms buyers already use.'],
        ['Split brand, high-intent and awareness spend so each is judged on its own job.', 'Feed lead quality (won, lost, junk) back into the ad platforms.', 'Run one creative test with a written hypothesis and a stop date.'],
        ['Shift 10–15% of budget toward the campaign with the best cost per qualified outcome.', 'Build a monthly creative pipeline so winning ads never go stale.', 'Test one new audience or channel with a capped budget.']] },
    { id: 'conv', name: 'Conversion', long: 'Website conversion', service: 'strategy',
      about: 'When attention arrives, does it turn into enquiries — and are they answered fast?',
      diag: ['Traffic arrives but the next step isn’t obvious, and enquiries cool off before anyone replies.',
        'Pages and follow-up work, but friction and slow replies still waste good visitors.',
        'Visitors convert and leads are handled fast. Small tests now compound into real revenue.'],
      acts: [['Put one clear call to action above the fold on your most-visited page.', 'Add a WhatsApp button and make one person responsible for replies every working day.', 'Place real proof (reviews, client logos, a result) next to every call to action.'],
        ['Watch five recordings of visitors who left without acting and fix the first obstacle you see.', 'Set a same-day reply target for every enquiry and track it for a month.', 'Cut the enquiry form down to the fields you actually use.'],
        ['Run one A/B test on the headline or offer of your highest-traffic landing page.', 'Add an automatic follow-up for leads who go quiet for 48 hours.', 'Build a dedicated landing page for your best-performing campaign.']] },
    { id: 'content', name: 'Content', long: 'Content & message', service: 'content',
      about: 'Does what you publish help a buyer decide, and does every channel make the same promise?',
      diag: ['Content is irregular or mostly promotional, so it rarely helps a buyer decide, and the message shifts by channel.',
        'Useful content exists, but it isn’t mapped to the questions buyers ask right before they choose.',
        'Your message is clear and content earns trust. The next step is getting it in front of more people.'],
      acts: [['Write the one sentence that says who you help and why you’re the better choice.', 'List the five questions customers ask before buying. Check sales calls and WhatsApp.', 'Answer the most common question in one clear page or post.'],
        ['Turn your three best-performing pieces into short videos or carousels.', 'Align your homepage headline, ad copy and social bios to the same promise.', 'Publish one case study or before-and-after that shows a real result.'],
        ['Repurpose each strong article into five channel-specific assets.', 'Start one recurring format people recognise and look forward to.', 'Pitch one piece to a partner, publication or newsletter your buyers read.']] },
    { id: 'data', name: 'Measurement', long: 'Measurement', service: 'analytics',
      about: 'Can you trust your numbers, and do they change what you do next?',
      diag: ['Tracking is missing or unreliable, so decisions run on gut feel and platform-reported numbers.',
        'Key numbers are tracked, but reports describe activity more than they drive decisions.',
        'Data is trusted and used. Refine what you measure so it points at profit, not just volume.'],
      acts: [['Confirm GA4 is installed once on every page and records your key action.', 'Tag every campaign link with UTMs so you can see which channel brings enquiries.', 'Pick three numbers to check every week and write them down.'],
        ['Remove duplicate or vanity events so each conversion is counted once.', 'Build a one-page dashboard: five decision metrics, one owner each.', 'End every monthly report with three actions, not a tour of charts.'],
        ['Connect CRM or sales data so you see revenue by channel, not just leads.', 'Set alerts for sudden drops in conversions or traffic.', 'Run one holdout test on your biggest channel to measure its true lift.']] }
  ];
  const byId = Object.fromEntries(DOMAINS.map((domain) => [domain.id, domain]));

  const QUESTIONS = [
    { d: 'seo', q: 'When buyers search for what you sell, do they find you?', help: 'Think of searches like “your service in Muscat”, not searches for your own name.',
      o: [['Rarely', 'We don’t show up for the searches that matter.'], ['Sometimes', 'A few pages rank, but it’s inconsistent.'], ['Often', 'We win steady traffic for several key searches.'], ['Reliably', 'Search is a dependable source of qualified demand.']] },
    { d: 'seo', q: 'How well kept is your search foundation?', help: 'Site health, Google Business Profile, reviews and page structure all count.',
      o: [['Unknown', 'No recent check, and nobody owns it.'], ['Basics only', 'Pages and a profile exist; gaps are likely.'], ['Maintained', 'Technical basics and profile are kept up to date.'], ['Improved monthly', 'Issues and opportunities are reviewed regularly.']] },
    { d: 'ads', q: 'How are your paid campaigns run?', help: 'Google, Meta, TikTok, LinkedIn. Any paid media counts.',
      o: [['Not running', 'No active paid campaigns right now.'], ['Reactive', 'Campaigns exist, but changes happen on instinct.'], ['Structured', 'Clear audiences, goals and budgets per campaign.'], ['Tested', 'Creative, targeting and spend are tested deliberately.']] },
    { d: 'ads', q: 'Can you connect ad spend to real business results?', help: 'Clicks aren’t the finish line. Leads, sales and their quality are.',
      o: [['No', 'We can’t reliably tie spend to outcomes.'], ['Partly', 'Platforms report conversions, but we don’t fully trust them.'], ['Mostly', 'We know our cost per lead or sale.'], ['Clearly', 'Lead quality or revenue guides optimisation.']] },
    { d: 'conv', q: 'When someone lands on your site, is the next step obvious?', help: 'A clear offer, visible proof and one easy action, on mobile too.',
      o: [['Not really', 'Visitors have to hunt for what to do.'], ['Somewhat', 'There’s a contact option, but the page doesn’t persuade.'], ['Mostly', 'Key pages have a clear offer and action.'], ['Optimised', 'We test pages and improve conversion regularly.']] },
    { d: 'conv', q: 'How quickly are new enquiries answered?', help: 'Reply speed is one of the strongest predictors of winning a lead.',
      o: [['Days', 'Replies depend on whoever happens to notice.'], ['Next day', 'Most enquiries get a reply within a day.'], ['Same day', 'Someone owns replies and answers within hours.'], ['Minutes', 'Instant acknowledgement plus a fast, tracked follow-up.']] },
    { d: 'content', q: 'Does your content answer real buying questions?', help: 'Good content removes doubt for someone who is about to choose.',
      o: [['Rarely', 'Publishing is irregular or mostly promotional.'], ['Sometimes', 'Some useful pieces, but no clear plan.'], ['Usually', 'Content maps to audience needs and services.'], ['Consistently', 'Content drives discovery, trust and enquiries.']] },
    { d: 'content', q: 'Is your message consistent across channels?', help: 'Website, ads, social and sales conversations should make the same promise.',
      o: [['Fragmented', 'Each channel says something different.'], ['Developing', 'A core message exists but drifts.'], ['Aligned', 'Key channels share one clear direction.'], ['Distinct', 'People quickly understand and remember us.']] },
    { d: 'data', q: 'Do you trust your website and campaign tracking?', help: 'Important actions measured once, correctly and consistently.',
      o: [['No', 'Tracking is missing or unreliable.'], ['Limited', 'Basic analytics, with known gaps.'], ['Mostly', 'Key events and campaigns are measured.'], ['Decision-ready', 'Data is checked and used with confidence.']] },
    { d: 'data', q: 'Does reporting lead to clear next actions?', help: 'A useful report changes a decision.',
      o: [['No rhythm', 'We only look when something breaks.'], ['Numbers only', 'Reports describe activity, not decisions.'], ['Useful', 'Reviews set priorities and owners.'], ['Learning loop', 'Insights routinely shape the next move.']] }
  ];

  const GOAL_STEPS = {
    'qualified leads': ['Agree with sales what a “qualified” lead means, in one sentence.', 'Add a “how did you hear about us?” field to every enquiry route.', 'Review last month’s leads and tag each one qualified or not.'],
    'online sales': ['Find the biggest drop-off between product page, cart and checkout.', 'Set up an abandoned-cart email or WhatsApp reminder.', 'Compare margin by channel, not just revenue or ROAS.'],
    'search visibility': ['Track five commercial searches weekly in Search Console.', 'Post one Google Business Profile update each week.', 'Refresh the oldest page that still gets search impressions.'],
    'brand demand': ['Track branded search volume monthly as your demand signal.', 'Choose one recognisable content format and publish it weekly.', 'Put your one-sentence promise everywhere a buyer first meets you.'],
    'measurement clarity': ['Write down the five numbers the business actually decides on.', 'Give each number an owner and a weekly check-in slot.', 'Hold a 30-minute monthly review that ends in three decisions.']
  };

  const TIERS = [
    { min: 0, name: 'Needs care', title: 'Your marketing needs some care.', line: 'Several systems are missing or improvised, so effort and budget leak away before they turn into customers. The good news: the first fixes are the cheapest.' },
    { min: 35, name: 'Getting there', title: 'Getting there, with a few weak spots.', line: 'Some systems pull their weight while others quietly undo the progress. Fix the weakest one and everything around it gets easier.' },
    { min: 60, name: 'Healthy', title: 'Healthy, with room to grow.', line: 'The foundations are in place. The gains now come from tightening one weaker system and testing with discipline.' },
    { min: 80, name: 'Thriving', title: 'Thriving. Keep it that way.', line: 'Everything connects and results build on each other. Protect what works and place bigger, measured bets.' }
  ];
  const LEVELS = ['Missing', 'Ad hoc', 'Structured', 'Compounding'];
  const tierFor = (score) => [...TIERS].reverse().find((tier) => score >= tier.min);
  const band = (score) => (score < 40 ? 0 : score < 70 ? 1 : 2);
  const levelFor = (score) => LEVELS[Math.min(3, Math.floor(score / 25.01))];

  /* ---------- Look & voice ---------- */

  const LOOK = {
    seo: { color: '#9dd4ff', icon: 'seo' },
    ads: { color: '#ffb48c', icon: 'ads' },
    conv: { color: '#dfff63', icon: 'conv' },
    content: { color: '#f5b9e2', icon: 'content' },
    data: { color: '#a8e6c2', icon: 'data' }
  };
  const GOAL_LOOK = {
    'qualified leads': { short: 'More leads', icon: 'leads', color: '#dfff63' },
    'online sales': { short: 'More sales', icon: 'sales', color: '#ffb48c' },
    'search visibility': { short: 'More search traffic', icon: 'seo', color: '#9dd4ff' },
    'brand demand': { short: 'More brand buzz', icon: 'brand', color: '#f5b9e2' },
    'measurement clarity': { short: 'Clearer numbers', icon: 'data', color: '#a8e6c2' }
  };
  const REACTIONS = [
    ['Very common, and usually the quickest to fix.', 'Honest answer. That’s where the easy wins hide.', 'No stress. Most businesses start right here.'],
    ['You’re not alone. Most businesses sit here.', 'A start. A little structure goes a long way.', 'Okay! There’s room to tighten this up.'],
    ['Nice, that’s ahead of most.', 'Good. That’s a solid base to build on.', 'Solid. Plenty of businesses never get here.'],
    ['Love that. Genuinely rare.', 'Excellent, that’s a real strength.', 'Top marks. Protect that.']
  ];
  const icon = (name) => `<svg class="gx-i" aria-hidden="true" focusable="false"><use href="#gx-i-${name}"/></svg>`;
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const later = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion.matches ? Math.min(ms, 80) : ms));

  /* ---------- State ---------- */

  let state = { goal: '', answers: Array(QUESTIONS.length).fill(null), step: 0 };
  let viewingShared = false;
  let busy = false;
  const saved = store.get();
  if (saved.progress && Array.isArray(saved.progress.answers) && saved.progress.answers.length === QUESTIONS.length) state = saved.progress;
  const persist = (extra = {}) => { if (!viewingShared) store.set({ ...store.get(), progress: state, ...extra }); };

  const domainScores = (answers) => DOMAINS.map((domain) => {
    const values = QUESTIONS.map((question, i) => (question.d === domain.id ? answers[i] : undefined)).filter((value) => value !== undefined);
    const total = values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
    return Math.round((total / (values.length * 3)) * 100);
  });

  const views = $$('[data-gx-view]');
  const show = (name) => {
    views.forEach((view) => { view.hidden = view.dataset.gxView !== name; });
    page.dataset.gxMode = name;
  };

  /* ---------- Intro ---------- */

  const goalsHost = $('[data-gx-goals]');
  goalsHost.innerHTML = GOALS.map((goal, i) => {
    const look = GOAL_LOOK[goal.value];
    return `<button type="button" class="gx-goal" data-goal="${goal.value}" style="--c:${look.color};--r:${[-3, 2, -1.5, 3, -2][i]}deg"><span class="gx-goal-icon">${icon(look.icon)}</span><b>${look.short}</b>${icon('arrow')}</button>`;
  }).join('');
  goalsHost.addEventListener('click', (event) => {
    const button = event.target.closest('.gx-goal');
    if (!button) return;
    state = { goal: button.dataset.goal, answers: Array(QUESTIONS.length).fill(null), step: 0 };
    openQuiz(0, true);
  });

  $('[data-gx-stickers]').innerHTML = DOMAINS.map((domain, i) => `<li style="--c:${LOOK[domain.id].color};--r:${[-2, 1.5, -1, 2, -1.5][i]}deg"><span class="gx-sticker-icon">${icon(LOOK[domain.id].icon)}</span><b>${domain.name}</b><p>${domain.about}</p></li>`).join('');

  const resumeButton = $('[data-gx-resume]');
  const refreshResume = () => {
    const answered = state.answers.filter((value) => value !== null).length;
    const last = store.get().result;
    if (answered > 0 && answered < QUESTIONS.length) { resumeButton.hidden = false; resumeButton.dataset.mode = 'resume'; resumeButton.textContent = `↺ Pick up where you left off (${answered}/${QUESTIONS.length})`; }
    else if (last && /^[0-4][0-3n]{10}$/.test(last)) { resumeButton.hidden = false; resumeButton.dataset.mode = 'result'; resumeButton.textContent = '→ See my last result'; }
    else resumeButton.hidden = true;
  };
  resumeButton.addEventListener('click', () => {
    if (resumeButton.dataset.mode === 'result') renderResult(decode(store.get().result));
    else openQuiz(Math.max(0, state.answers.findIndex((value) => value === null)), true);
  });

  /* ---------- Quiz ---------- */

  const card = $('[data-gx-card]');
  const deck = $('[data-gx-deck]');
  const answersHost = $('[data-gx-answers]');
  const questionEl = $('[data-gx-q]');
  const bubble = $('[data-gx-bubble]');
  const track = $('[data-gx-track]');
  const ghosts = $$('.gx-ghost', deck);
  track.innerHTML = DOMAINS.map((domain) => `<li data-d="${domain.id}" style="--c:${LOOK[domain.id].color}"><span>${icon(LOOK[domain.id].icon)}</span>${QUESTIONS.map((q, i) => (q.d === domain.id ? `<i data-q="${i}"></i>` : '')).join('')}</li>`).join('');

  const coach = (text) => {
    bubble.classList.remove('is-pop');
    void bubble.offsetWidth;
    bubble.textContent = text;
    bubble.classList.add('is-pop');
  };

  const paint = () => {
    const question = QUESTIONS[state.step];
    const domain = byId[question.d];
    const inDomain = QUESTIONS.filter((q) => q.d === question.d);
    const position = inDomain.indexOf(question) + 1;
    deck.style.setProperty('--c', LOOK[question.d].color);
    ghosts.forEach((ghost, i) => {
      const upcoming = QUESTIONS[Math.min(QUESTIONS.length - 1, state.step + i + 1)];
      ghost.style.setProperty('--c', LOOK[upcoming.d].color);
      ghost.hidden = state.step + i + 1 >= QUESTIONS.length;
    });
    $('[data-gx-tag]').innerHTML = `${icon(LOOK[question.d].icon)}<b>${domain.name}</b><span>${position} of ${inDomain.length}</span>`;
    questionEl.textContent = question.q;
    $('[data-gx-help]').textContent = question.help;
    const chosen = state.answers[state.step];
    answersHost.innerHTML = question.o.map(([label, detail], value) => `<button type="button" class="gx-ans" data-value="${value}" aria-pressed="${chosen === value}"><span class="gx-bars" aria-hidden="true">${[0, 1, 2, 3].map((n) => `<i class="${n <= value ? 'on' : ''}"></i>`).join('')}</span><span class="gx-ans-text"><b>${label}</b><small>${detail}</small></span><kbd aria-hidden="true">${value + 1}</kbd></button>`).join('');
    $('[data-gx-unsure]').setAttribute('aria-pressed', String(chosen === 'n'));
    $('[data-gx-count]').textContent = `${state.step + 1} / ${QUESTIONS.length}`;
    $$('li', track).forEach((item) => item.classList.toggle('is-now', item.dataset.d === question.d));
    $$('i', track).forEach((dot) => {
      const i = Number(dot.dataset.q);
      dot.className = state.answers[i] !== null ? 'is-done' : i === state.step ? 'is-now' : '';
    });
  };

  const openQuiz = (step, fresh = false) => {
    state.step = Math.max(0, Math.min(QUESTIONS.length - 1, step));
    viewingShared = false;
    show('quiz');
    history.replaceState(null, '', `${location.pathname}?goal=${encodeURIComponent(state.goal)}`);
    paint();
    card.classList.remove('is-out', 'is-back');
    card.classList.add('is-in');
    if (fresh) coach(state.answers.some((value) => value !== null) ? 'Welcome back! Let’s carry on.' : `Great pick. Let’s see what’s helping, and what’s in the way of ${(GOAL_LOOK[state.goal] || GOAL_LOOK['qualified leads']).short.toLowerCase()}.`);
    persist();
    scrollTo({ top: 0, behavior: 'auto' });
    questionEl.focus({ preventScroll: true });
  };

  const move = async (nextStep, direction) => {
    busy = true;
    card.classList.remove('is-in', 'is-back');
    card.classList.add(direction > 0 ? 'is-out' : 'is-out-back');
    await later(320);
    state.step = nextStep;
    paint();
    card.classList.remove('is-out', 'is-out-back');
    void card.offsetWidth;
    card.classList.add(direction > 0 ? 'is-in' : 'is-back');
    persist();
    questionEl.focus({ preventScroll: true });
    busy = false;
  };

  const choose = async (value) => {
    if (busy) return;
    busy = true;
    state.answers[state.step] = value;
    $$('.gx-ans', answersHost).forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.value) === value)));
    $('[data-gx-unsure]').setAttribute('aria-pressed', String(value === 'n'));
    const lines = value === 'n' ? ['Fair enough. Not knowing usually means it isn’t measured yet.'] : REACTIONS[value];
    coach(lines[state.step % lines.length]);
    persist();
    await later(380);
    busy = false;
    const nextOpen = state.answers.findIndex((answer, i) => answer === null && i > state.step);
    const anyOpen = state.answers.findIndex((answer) => answer === null);
    if (nextOpen === -1 && anyOpen === -1) { finish(); return; }
    move(nextOpen !== -1 ? nextOpen : anyOpen, 1);
  };

  answersHost.addEventListener('click', (event) => {
    const button = event.target.closest('.gx-ans');
    if (button) choose(Number(button.dataset.value));
  });
  $('[data-gx-unsure]').addEventListener('click', () => choose('n'));
  const back = () => {
    if (busy) return;
    if (state.step === 0) { show('intro'); refreshResume(); return; }
    move(state.step - 1, -1);
  };
  $('[data-gx-back]').addEventListener('click', back);
  $('[data-gx-exit]').addEventListener('click', () => { show('intro'); refreshResume(); scrollTo({ top: 0 }); });
  document.addEventListener('keydown', (event) => {
    if (page.dataset.gxMode !== 'quiz' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : document.body;
    if (target.closest('input, textarea, select, [contenteditable]')) return;
    if (/^[1-4]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key) - 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'Backspace') { event.preventDefault(); back(); }
  });

  /* ---------- Result ---------- */

  const encode = (goal, answers) => `${Math.max(0, GOALS.findIndex((item) => item.value === goal))}${answers.map((value) => (typeof value === 'number' ? value : 'n')).join('')}`;
  const decode = (code) => ({ goal: GOALS[Number(code[0])].value, answers: [...code.slice(1)].map((char) => (char === 'n' ? 'n' : Number(char))) });

  const finish = () => {
    const code = encode(state.goal, state.answers);
    store.set({ ...store.get(), result: code, progress: { goal: state.goal, answers: Array(QUESTIONS.length).fill(null), step: 0 } });
    renderResult(decode(code));
  };

  const countUp = (el, to, duration = 1200) => {
    if (reducedMotion.matches) { el.textContent = to; return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Background tabs throttle rAF; make sure the final number still lands.
    setTimeout(() => { el.textContent = to; }, duration + 100);
  };

  let report = { text: '', share: '' };

  function renderResult({ goal, answers }, { shared = false } = {}) {
    viewingShared = shared;
    const goalInfo = GOALS.find((item) => item.value === goal) || GOALS[0];
    const code = encode(goalInfo.value, answers);
    const scores = domainScores(answers);
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const tier = tierFor(overall);
    const ranked = DOMAINS.map((domain, i) => ({ ...domain, score: scores[i], pull: (100 - scores[i]) * goalInfo.w[domain.id] }))
      .sort((a, b) => b.pull - a.pull || a.score - b.score);
    const lever = ranked[0];
    const second = ranked[1];
    const strongest = [...ranked].sort((a, b) => b.score - a.score)[0];
    const leverBand = band(lever.score);
    const unsure = answers.filter((value) => value === 'n').length;

    show('result');
    $('[data-gx-shared]').hidden = !shared;
    $('[data-gx-r-goal]').textContent = `Check-up for: ${GOAL_LOOK[goalInfo.value].short.toLowerCase()}`;
    $('[data-gx-tier]').textContent = tier.name;
    $('[data-gx-score-wrap]').dataset.tier = TIERS.indexOf(tier);
    $('[data-gx-r-title]').textContent = tier.title;
    $('[data-gx-r-note]').textContent = `${tier.line} Your strongest area is ${strongest.name.toLowerCase()} (${strongest.score}).${unsure ? ` You said “not sure” ${unsure === 1 ? 'once' : `${unsure} times`}, and I counted those as zero.` : ''}`;
    countUp($('[data-gx-overall]'), overall);

    $('[data-gx-vitals]').innerHTML = DOMAINS.map((domain, i) => {
      const score = scores[i];
      const isLever = domain.id === lever.id;
      return `<li class="gx-vital${isLever ? ' is-lever' : ''}" style="--c:${LOOK[domain.id].color};--s:${score}">${isLever ? '<span class="gx-flag">Fix first</span>' : ''}<div class="gx-vital-top"><span class="gx-vital-icon">${icon(LOOK[domain.id].icon)}</span><div class="gx-ring" role="img" aria-label="${domain.name}: ${score} out of 100"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26"/><circle class="gx-ring-fill" cx="32" cy="32" r="26" pathLength="100"/></svg><b>${score}</b></div></div><h4>${domain.name}</h4><em>${levelFor(score)}</em><p>${domain.diag[band(score)]}</p></li>`;
    }).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $('[data-gx-vitals]').classList.add('is-drawn')));

    $('[data-gx-first-icon]').innerHTML = icon(LOOK[lever.id].icon);
    $('.gx-first').style.setProperty('--c', LOOK[lever.id].color);
    $('[data-gx-first-area]').textContent = `${lever.name} · ${lever.score}/100`;
    $('[data-gx-first-action]').textContent = lever.acts[leverBand][0];
    $('[data-gx-first-why]').textContent = goalInfo.w[lever.id] > 1.1
      ? `${lever.diag[leverBand]} It matters most for ${GOAL_LOOK[goalInfo.value].short.toLowerCase()}, so it goes first.`
      : `${lever.diag[leverBand]} It’s your weakest area, so fixing it lifts the rest.`;

    const weeks = [
      { label: 'Week 1', title: `Fix ${lever.name.toLowerCase()}`, color: LOOK[lever.id].color, items: lever.acts[leverBand] },
      { label: 'Week 2', title: `Strengthen ${second.name.toLowerCase()}`, color: LOOK[second.id].color, items: second.acts[band(second.score)] },
      { label: 'Week 3', title: `Aim it at ${GOAL_LOOK[goalInfo.value].short.toLowerCase()}`, color: GOAL_LOOK[goalInfo.value].color, items: GOAL_STEPS[goalInfo.value] },
      { label: 'Week 4', title: 'Look back, pick the next bet', color: '#e9e2d3', items: ['Compare this month’s numbers with where you started.', 'Keep what moved the needle and drop one thing that didn’t.', 'Retake this check-up and set the next focus.'] }
    ];
    const checks = (store.get().checks || {})[code] || [];
    let n = 0;
    $('[data-gx-weeks]').innerHTML = weeks.map((week) => `<article class="gx-week" style="--c:${week.color}"><header><span>${week.label}</span><h4>${esc(week.title)}</h4></header><ul>${week.items.map((item) => { const id = n++; return `<li><label><input type="checkbox" data-check="${id}"${checks.includes(id) ? ' checked' : ''}><i aria-hidden="true"></i><span>${esc(item)}</span></label></li>`; }).join('')}</ul></article>`).join('');
    const total = n;
    const sync = () => {
      const done = $$('[data-check]:checked').length;
      $('[data-gx-done]').textContent = done;
      $('[data-gx-total]').textContent = total;
      $('[data-gx-bar]').style.width = `${(done / total) * 100}%`;
    };
    $('[data-gx-weeks]').onchange = (event) => {
      const all = store.get();
      all.checks = { ...(all.checks || {}), [code]: $$('[data-check]:checked').map((box) => Number(box.dataset.check)) };
      store.set(all);
      sync();
      if (event.target.checked) event.target.closest('label').classList.add('is-ticked');
    };
    sync();

    const shareUrl = `${location.origin}/growth-diagnostic/?r=${code}`;
    report = {
      share: shareUrl,
      text: [`Marketing check-up: ${overall}/100 (${tier.name})`, `Goal: ${goalInfo.label}`, '', ...DOMAINS.map((domain, i) => `${domain.name}: ${scores[i]}/100 (${levelFor(scores[i])})`), '', `Fix first: ${lever.name}. ${lever.acts[leverBand][0]}`, '', '30-day plan', ...weeks.flatMap((week) => [`${week.label}: ${week.title}`, ...week.items.map((item) => `  - ${item}`)]), '', `Full result: ${shareUrl}`].join('\n')
    };
    const short = `My marketing check-up: ${overall}/100 (${tier.name}). Fix first: ${lever.name.toLowerCase()}.\n${shareUrl}`;
    $('[data-gx-wa]').href = `https://wa.me/?text=${encodeURIComponent(short)}`;
    $('[data-gx-mail]').href = `mailto:?subject=${encodeURIComponent(`My marketing check-up: ${overall}/100`)}&body=${encodeURIComponent(report.text)}`;

    const contact = new URLSearchParams({ service: lever.service, goal: goalInfo.value, diagnostic: `${overall}/100 (${tier.name}). Fix first: ${lever.long} (${lever.score}). Then: ${second.long} (${second.score}). Full result: ${shareUrl}` });
    $('[data-gx-contact]').href = `/contact/?${contact}`;
    contact.set('diagnostic', `${overall}/100 (${tier.name}). I'd like help with ${lever.long.toLowerCase()} (${lever.score}/100). Full result: ${shareUrl}`);
    $('[data-gx-first-cta]').href = `/contact/?${contact}`;

    history.replaceState(null, '', `${location.pathname}?r=${code}`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('[data-gx-r-title]').focus({ preventScroll: true });
  }

  const toast = $('[data-gx-toast]');
  let toastTimer = 0;
  const say = (message) => { toast.textContent = message; toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600); };
  const copy = async (text, message) => {
    try { await navigator.clipboard.writeText(text); say(message); }
    catch (_) { say('Copying isn’t available here. Try the email option instead.'); }
  };
  $('[data-gx-copy]').addEventListener('click', () => copy(report.text, 'Report copied ✓'));
  $('[data-gx-link]').addEventListener('click', () => copy(report.share, 'Link copied ✓ It only holds your scores.'));
  $('[data-gx-print]').addEventListener('click', () => print());
  const restart = () => {
    state = { goal: '', answers: Array(QUESTIONS.length).fill(null), step: 0 };
    viewingShared = false;
    persist();
    history.replaceState(null, '', location.pathname);
    show('intro');
    refreshResume();
    scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };
  $('[data-gx-restart]').addEventListener('click', restart);
  $('[data-gx-own]').addEventListener('click', restart);

  /* ---------- Boot ---------- */

  const params = new URLSearchParams(location.search);
  const sharedCode = params.get('r');
  const requestedGoal = params.get('goal');
  if (sharedCode && /^[0-4][0-3n]{10}$/.test(sharedCode)) {
    renderResult(decode(sharedCode), { shared: sharedCode !== store.get().result });
  } else {
    show('intro');
    refreshResume();
    // Links like /growth-diagnostic/?goal=online%20sales (Home, Lab) highlight that goal.
    const match = requestedGoal && goalsHost.querySelector(`[data-goal="${CSS.escape(requestedGoal)}"]`);
    if (match) match.classList.add('is-suggested');
  }
})();
