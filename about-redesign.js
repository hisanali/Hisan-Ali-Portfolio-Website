(() => {
  const page = document.querySelector('.ab-page');
  if (!page) return;

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Scroll reveals ---------- */

  const revealTargets = $$('[data-ab-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        const target = entry.target;
        target.style.setProperty('--ab-delay', `${Math.min(index, 6) * 80}ms`);
        target.classList.add('is-in');
        observer.unobserve(target);
        setTimeout(() => target.style.removeProperty('--ab-delay'), 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const fold = innerHeight * 0.92;
    revealTargets.forEach((target) => {
      if (target.getBoundingClientRect().top < fold) target.classList.add('is-in');
      else observer.observe(target);
    });
    page.classList.add('ab-js');
  }

  /* ---------- Muscat clock ---------- */

  const clock = $('[data-ab-clock]');
  const status = $('[data-ab-status]');
  const statusNote = $('[data-ab-status-note]');
  if (clock) {
    const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', hour: '2-digit', minute: '2-digit', hour12: false });
    const partsFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', hour: 'numeric', weekday: 'short', hour12: false });
    const tick = () => {
      const now = new Date();
      clock.textContent = `${timeFormat.format(now)} GST`;
      clock.dateTime = now.toISOString();
      const parts = Object.fromEntries(partsFormat.formatToParts(now).map((part) => [part.type, part.value]));
      const hour = Number(parts.hour) % 24;
      const weekend = parts.weekday === 'Fri' || parts.weekday === 'Sat';
      const working = !weekend && hour >= 9 && hour < 19;
      status?.classList.toggle('is-after-hours', !working);
      if (statusNote) statusNote.textContent = working ? 'Working hours — replies within 1–2 days' : 'After hours — replies within 1–2 days';
    };
    tick();
    setInterval(tick, 20000);
  }

  /* ---------- "Right now, probably…" ---------- */

  const now = $('[data-ab-now]');
  const nowLines = [
    'reading search-term reports so your budget doesn’t have to.',
    'rewriting an ad headline for the fifth time.',
    'checking whether that conversion actually fired.',
    'mapping what people in Oman Google before they buy.',
    'turning one good idea into ten useful posts.',
    'building something odd for the Lab.'
  ];
  if (now && !reducedMotion.matches) {
    let index = 0;
    setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % nowLines.length;
      now.classList.add('is-swapping');
      setTimeout(() => {
        now.textContent = nowLines[index];
        now.classList.remove('is-swapping');
      }, 350);
    }, 4200);
  }

  /* ---------- Count-up stats ---------- */

  const counters = $$('[data-ab-count]');
  const runCount = (element) => {
    const target = Number(element.dataset.abCount);
    const duration = 1400;
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = Math.round(target * eased).toString();
      if (progress < 1) requestAnimationFrame(step);
    };
    element.textContent = '0';
    requestAnimationFrame(step);
  };
  if (counters.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        runCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  /* ---------- Portrait tilt ---------- */

  const portrait = $('[data-ab-tilt]');
  if (portrait && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
    portrait.addEventListener('pointermove', (event) => {
      const rect = portrait.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.classList.add('is-tilting');
      portrait.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
      portrait.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    });
    portrait.addEventListener('pointerleave', () => {
      portrait.classList.remove('is-tilting');
      portrait.style.setProperty('--ry', '0deg');
      portrait.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Tabs (story length + disciplines) ---------- */

  const setupTabs = (tabs, onSelect) => {
    const select = (tab, focus) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
      onSelect?.(tab);
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = null;
        if (event.key in keys) next = tabs[(index + keys[event.key] + tabs.length) % tabs.length];
        else if (event.key === 'Home') next = tabs[0];
        else if (event.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        event.preventDefault();
        select(next, true);
      });
    });
  };

  const lengthSwitch = $('.ab-length');
  if (lengthSwitch) {
    setupTabs($$('[role="tab"]', lengthSwitch), (tab) => {
      lengthSwitch.classList.toggle('is-long', tab.dataset.abLength === 'long');
    });
  }

  const craftTabs = $('.ab-craft-tabs');
  if (craftTabs) {
    setupTabs($$('[role="tab"]', craftTabs), (tab) => {
      if (craftTabs.scrollWidth > craftTabs.clientWidth) {
        craftTabs.scrollTo({ left: tab.offsetLeft - 14, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
    });
  }

  /* ---------- Beliefs ---------- */

  $$('.ab-belief > button').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.parentElement.classList.toggle('is-open', open);
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (panel) panel.hidden = !open;
    });
  });

  /* ---------- Fit chooser (radio group) ---------- */

  const fitOptions = $$('[data-ab-fit]');
  const fitAnswers = $$('[data-ab-fit-answer]');
  const chooseFit = (option, focus) => {
    fitOptions.forEach((item) => {
      const checked = item === option;
      item.setAttribute('aria-checked', String(checked));
      item.tabIndex = checked ? 0 : -1;
    });
    fitAnswers.forEach((answer) => { answer.hidden = answer.dataset.abFitAnswer !== option.dataset.abFit; });
    if (focus) option.focus();
  };
  fitOptions.forEach((option, index) => {
    option.addEventListener('click', () => chooseFit(option, false));
    option.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      chooseFit(fitOptions[(index + keys[event.key] + fitOptions.length) % fitOptions.length], true);
    });
  });

  /* ---------- Creative wall parallax ---------- */

  const parallax = $('[data-ab-parallax]');
  if (parallax && !reducedMotion.matches) {
    const section = parallax.parentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const progress = (innerHeight - rect.top) / (innerHeight + rect.height);
      parallax.style.transform = `translate3d(0, ${((progress - 0.5) * -14).toFixed(2)}%, 0) scale(1.04)`;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Copy email ---------- */

  $$('[data-ab-copy]').forEach((button) => {
    const label = $('span', button);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.abCopy);
        button.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        setTimeout(() => {
          button.classList.remove('is-copied');
          if (label) label.textContent = 'Copy';
        }, 1800);
      } catch (_) {
        location.href = `mailto:${button.dataset.abCopy}`;
      }
    });
  });
})();
