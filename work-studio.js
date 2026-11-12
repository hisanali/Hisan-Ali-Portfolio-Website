/* Work — studio edition: motion and interaction for /work/.
   Vanilla, dependency-free. Every effect respects prefers-reduced-motion, pointer
   effects only run on fine pointers, and one requestAnimationFrame loop drives the
   continuous animations and sleeps when none of them are running. */
(() => {
  'use strict';

  const page = document.querySelector('.wk-page');
  if (!page) return;

  const root = document.documentElement;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = () => reducedQuery.matches;
  const fine = () => fineQuery.matches;
  const $ = (selector, scope = page) => scope.querySelector(selector);
  const $$ = (selector, scope = page) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const rtl = () => root.dir === 'rtl';

  root.classList.add('wk-live');

  /* Arabic pages stay hidden (html.i18n-loading) until translated; start the intro after. */
  const whenShown = (callback) => {
    if (!root.classList.contains('i18n-loading')) { callback(); return; }
    const watcher = new MutationObserver(() => {
      if (root.classList.contains('i18n-loading')) return;
      watcher.disconnect();
      callback();
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['class'] });
  };

  /* ---------- One shared animation loop ---------- */
  const tickers = new Set();
  let frameId = 0;
  let lastTime = 0;
  const loop = (time) => {
    const delta = Math.min(64, lastTime ? time - lastTime : 16);
    lastTime = time;
    tickers.forEach((tick) => tick(delta, time));
    if (tickers.size) frameId = requestAnimationFrame(loop);
    else { frameId = 0; lastTime = 0; }
  };
  const run = (tick) => { tickers.add(tick); if (!frameId) frameId = requestAnimationFrame(loop); };
  const halt = (tick) => { tickers.delete(tick); };

  const observeVisibility = (element, callback, options = {}) => {
    if (!element || !('IntersectionObserver' in window)) { callback(true); return; }
    new IntersectionObserver(([entry]) => callback(entry.isIntersecting), options).observe(element);
  };

  /* Scroll-linked jobs run at most once per frame, and only while scrolling or resizing. */
  const scrollJobs = new Set();
  let scrollQueued = false;
  const flushScroll = () => { scrollQueued = false; scrollJobs.forEach((job) => job()); };
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(flushScroll); } }, { passive: true });
  addEventListener('resize', () => scrollJobs.forEach((job) => job()));

  /* ---------- Scroll reveals ---------- */
  $$('[data-wk-stagger]').forEach((group) => {
    [...group.children].forEach((child, index) => child.style.setProperty('--wk-d', `${Math.min(index, 8) * 95}ms`));
  });
  const revealTargets = $$('[data-wk-reveal], [data-wk-stagger]');
  if ('IntersectionObserver' in window) {
    const revealer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        const target = entry.target;
        if (target.hasAttribute('data-wk-reveal') && !target.style.getPropertyValue('--wk-d')) {
          target.style.setProperty('--wk-d', `${Math.min(index, 4) * 110}ms`);
        }
        target.classList.add('is-in');
        revealer.unobserve(target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((target) => revealer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-in'));
  }

  /* ---------- Hero: intro, counters, deck and glow ---------- */
  const hero = $('[data-wk-hero]');
  let heroVisible = true;

  const countUp = (element) => {
    const match = element.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    const target = Number(match[1]);
    const suffix = match[2];
    const duration = 1900;
    const start = performance.now();
    element.textContent = `0${suffix}`;
    const step = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (hero) {
    whenShown(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
      if (!reduced()) setTimeout(() => $$('[data-wk-count]', hero).forEach(countUp), 820);
    });
    observeVisibility(hero, (visible) => { heroVisible = visible; });

    const fan = $('[data-wk-fan]', hero);
    const stage = fan && $('.wk-fan-stage', fan);
    const layers = fan ? $$('.wk-card', fan).map((card) => ({ element: $('.wk-card-par', card), depth: Number(card.dataset.depth) || 1 })) : [];
    const glow = $('.wk-hero-glow i', hero);
    let pointerX = 0;
    let pointerY = 0;
    let deckX = 0;
    let deckY = 0;
    let glowX = 0;
    let glowY = 0;
    let glowTargetX = 0;
    let glowTargetY = 0;
    let lastMove = 0;
    let glowPlaced = false;

    const heroTick = () => {
      deckX = lerp(deckX, pointerX, .06);
      deckY = lerp(deckY, pointerY, .06);
      glowX = lerp(glowX, glowTargetX, .08);
      glowY = lerp(glowY, glowTargetY, .08);
      if (stage) stage.style.transform = `rotateY(${(deckX * 10).toFixed(2)}deg) rotateX(${(-deckY * 8).toFixed(2)}deg)`;
      layers.forEach(({ element, depth }) => {
        if (element) element.style.transform = `translate3d(${(deckX * 16 * depth).toFixed(1)}px, ${(deckY * 12 * depth).toFixed(1)}px, 0)`;
      });
      if (glow) glow.style.transform = `translate3d(${glowX.toFixed(1)}px, ${glowY.toFixed(1)}px, 0)`;
      const settled = Math.abs(deckX - pointerX) < .002 && Math.abs(deckY - pointerY) < .002
        && Math.abs(glowX - glowTargetX) < .5 && Math.abs(glowY - glowTargetY) < .5;
      if (settled && performance.now() - lastMove > 300) halt(heroTick);
    };

    if (fine() && !reduced()) {
      addEventListener('pointermove', (event) => {
        if (!heroVisible || event.pointerType === 'touch') return;
        const box = (fan || hero).getBoundingClientRect();
        pointerX = clamp((event.clientX - (box.left + box.width / 2)) / (innerWidth / 2), -1, 1);
        pointerY = clamp((event.clientY - (box.top + box.height / 2)) / (innerHeight / 2), -1, 1);
        const heroBox = hero.getBoundingClientRect();
        glowTargetX = event.clientX - heroBox.left;
        glowTargetY = event.clientY - heroBox.top;
        if (!glowPlaced) { glowX = glowTargetX; glowY = glowTargetY; glowPlaced = true; }
        lastMove = performance.now();
        run(heroTick);
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; lastMove = performance.now(); run(heroTick); });
    }

    // The deck is a shortcut: each card jumps to its section.
    $$('.wk-card', hero).forEach((card) => card.addEventListener('click', () => {
      document.querySelector(card.dataset.target)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }));
  }

  /* ---------- Kinetic band: speed and skew follow scroll velocity ---------- */
  const band = $('[data-wk-band]');
  const track = band && $('.wk-band-track', band);
  if (band && track && !reduced()) {
    let offset = 0;
    let velocity = 0;
    let skew = 0;
    let direction = 1;
    let groupWidth = 0;
    let lastScroll = scrollY;
    // offsetWidth ignores the skew applied to the track, unlike getBoundingClientRect.
    const measure = () => { groupWidth = track.firstElementChild.offsetWidth; };
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track.firstElementChild);
    const bandTick = (delta) => {
      if (!groupWidth) return;
      const now = scrollY;
      const moved = now - lastScroll;
      lastScroll = now;
      velocity = lerp(velocity, (moved / Math.max(delta, 1)) * 16, .14);
      if (Math.abs(moved) > .5) direction = moved > 0 ? 1 : -1;
      const speed = (.55 + Math.min(Math.abs(velocity) * .4, 16)) * direction;
      offset = (offset + speed * (delta / 16)) % groupWidth;
      if (offset < 0) offset += groupWidth;
      skew = lerp(skew, clamp(-velocity * .22, -8, 8), .1);
      const x = rtl() ? offset : -offset;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    };
    observeVisibility(band, (visible) => { if (visible) { lastScroll = scrollY; run(bandTick); } else halt(bandTick); }, { rootMargin: '80px 0px' });
  }

  /* ---------- Bella: browser frame rises with scroll, hotspots tour the homepage ---------- */
  const showcase = $('[data-wk-showcase]');
  if (showcase) {
    const frame = $('[data-wk-frame]', showcase);
    const spots = $$('.wk-spot', showcase);
    const legend = $('.wk-legend', showcase);
    const items = $$('.wk-legend li', showcase);
    const tourDelay = 3600;
    let frameVisible = false;
    let active = -1;
    let timer = 0;
    let holds = 0;
    legend.style.setProperty('--wk-tour', `${tourDelay}ms`);

    const setActive = (index) => {
      active = index;
      spots.forEach((spot, i) => spot.classList.toggle('is-active', i === index));
      items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    };
    const schedule = () => {
      clearTimeout(timer);
      legend.classList.toggle('is-paused', holds > 0 || reduced());
      if (holds > 0 || reduced() || !frameVisible || active < 0) return;
      timer = setTimeout(() => { setActive((active + 1) % spots.length); schedule(); }, tourDelay);
    };

    const setFrame = () => {
      const box = frame.getBoundingClientRect();
      const progress = reduced() ? 1 : clamp((innerHeight - box.top) / (innerHeight * .78), 0, 1);
      frame.style.setProperty('--p', progress.toFixed(3));
      if (progress > .9 && !frame.classList.contains('is-on')) {
        frame.classList.add('is-on');
        setTimeout(() => frame.classList.add('is-settled'), 1100);
        if (active < 0) setTimeout(() => { setActive(0); schedule(); }, 650);
      }
    };
    observeVisibility(frame, (visible) => {
      frameVisible = visible;
      if (visible) scrollJobs.add(setFrame); else scrollJobs.delete(setFrame);
      setFrame();
      schedule();
    }, { rootMargin: '120px 0px' });

    const hold = () => { holds += 1; schedule(); };
    const release = () => { holds = Math.max(0, holds - 1); schedule(); };
    [frame, legend].forEach((area) => {
      area.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') hold(); });
      area.addEventListener('pointerleave', (event) => { if (event.pointerType !== 'touch') release(); });
    });
    legend.addEventListener('focusin', hold);
    legend.addEventListener('focusout', release);

    items.forEach((item, index) => {
      const button = $('button', item);
      button.addEventListener('click', () => { setActive(index); schedule(); });
      button.addEventListener('pointerenter', () => setActive(index));
      button.addEventListener('focus', () => setActive(index));
    });
    spots.forEach((spot, index) => {
      spot.addEventListener('pointerenter', () => setActive(index));
      spot.addEventListener('click', () => { setActive(index); schedule(); });
    });
    if (reduced()) { frame.classList.add('is-on', 'is-settled'); }
  }

  /* ---------- Approach: the active step drives an odometer and a progress bar ---------- */
  const approach = $('[data-wk-approach]');
  if (approach) {
    const steps = $$('[data-wk-step]', approach);
    const setStep = (index) => {
      steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
      approach.style.setProperty('--step', index);
      approach.style.setProperty('--prog', ((index + 1) / steps.length).toFixed(3));
    };
    setStep(0);
    if ('IntersectionObserver' in window) {
      const stepper = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setStep(steps.indexOf(entry.target)); });
      }, { rootMargin: '-44% 0px -44% 0px' });
      steps.forEach((step) => stepper.observe(step));
    }
  }

  /* ---------- Research index: a preview card follows the cursor ---------- */
  const index = $('[data-wk-index]');
  if (index && fine()) {
    const rows = $$('.wk-row', index);
    const sources = rows.map((row) => $('.wk-row-thumb', row)?.getAttribute('src') || '');
    const peek = document.createElement('div');
    peek.className = 'wk-peek';
    peek.setAttribute('aria-hidden', 'true');
    const frames = [document.createElement('img'), document.createElement('img')];
    frames.forEach((img) => { img.alt = ''; img.decoding = 'async'; peek.append(img); });
    document.body.append(peek);

    let front = 0;
    let current = '';
    let shown = false;
    let placed = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let tilt = 0;

    const preload = () => sources.forEach((src) => { if (src) { const image = new Image(); image.src = src; } });
    observeVisibility(index, (visible) => { if (visible) preload(); }, { rootMargin: '400px 0px' });

    const show = (src) => {
      if (!src || src === current) return;
      current = src;
      const next = 1 - front;
      frames[next].src = src;
      frames[next].classList.add('is-on');
      frames[front].classList.remove('is-on');
      front = next;
    };
    const peekTick = () => {
      const ease = reduced() ? 1 : .15;
      const previousX = x;
      x = lerp(x, targetX, ease);
      y = lerp(y, targetY, ease);
      tilt = reduced() ? 0 : lerp(tilt, clamp((x - previousX) * .5, -10, 10), .12);
      const width = peek.offsetWidth;
      const height = peek.offsetHeight;
      const offsetX = rtl() ? -width - 34 : 34;
      peek.style.transform = `translate3d(${(x + offsetX).toFixed(1)}px, ${(y - height / 2).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      if (!shown && Math.abs(x - targetX) < .5 && Math.abs(tilt) < .05) halt(peekTick);
    };

    index.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!placed) { x = targetX; y = targetY; placed = true; }
      run(peekTick);
    });
    rows.forEach((row, i) => row.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      show(sources[i]);
      shown = true;
      peek.classList.add('is-on');
      run(peekTick);
    }));
    index.addEventListener('pointerleave', () => { shown = false; placed = false; peek.classList.remove('is-on'); });
    addEventListener('scroll', () => { if (shown && !index.matches(':hover')) { shown = false; placed = false; peek.classList.remove('is-on'); } }, { passive: true });
  }

  /* ---------- Live builds: 3D tilt, spotlight and a drifting monogram ---------- */
  if (fine() && !reduced()) {
    $$('[data-wk-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        const px = clamp((event.clientX - box.left) / box.width, 0, 1);
        const py = clamp((event.clientY - box.top) / box.height, 0, 1);
        card.classList.add('is-tilting');
        card.style.setProperty('--rx', `${((.5 - py) * 8).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((px - .5) * 10).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        card.style.setProperty('--tx', `${((px - .5) * -34).toFixed(1)}px`);
        card.style.setProperty('--ty', `${((py - .5) * -26).toFixed(1)}px`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        ['--rx', '--ry', '--tx', '--ty'].forEach((property) => card.style.removeProperty(property));
      });
    });

    /* Magnetic buttons */
    $$('[data-wk-magnetic]').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const box = button.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        button.style.transform = `translate3d(${(dx * .22).toFixed(1)}px, ${(dy * .34).toFixed(1)}px, 0)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  /* ---------- Section rail ---------- */
  const rail = $('[data-wk-rail]');
  if (rail && 'IntersectionObserver' in window) {
    const links = $$('a', rail);
    const sections = links.map((link) => document.getElementById(link.dataset.wkTarget)).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle('is-active', link.dataset.wkTarget === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((section) => spy.observe(section));

    // Show the rail once the hero has scrolled away; hide it over the footer.
    let pastHero = false;
    let footerInView = false;
    const sync = () => rail.classList.toggle('is-on', pastHero && !footerInView);
    if (hero) observeVisibility(hero, (visible) => { pastHero = !visible; sync(); });
    const footer = document.querySelector('.ua-footer');
    if (footer) observeVisibility(footer, (visible) => { footerInView = visible; sync(); });
  }

  /* The language switch rewrites text without a reload: re-measure what depends on it. */
  document.addEventListener('site-language-change', () => dispatchEvent(new Event('resize')));
})();
