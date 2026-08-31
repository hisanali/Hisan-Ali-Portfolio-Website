(() => {
  const header = document.querySelector('[data-ua-header]');
  const menuButton = document.querySelector('[data-ua-menu-button]');
  const mobileNav = document.querySelector('[data-ua-mobile-nav]');
  const themeButton = document.querySelector('[data-ua-theme-toggle]');
  const readingButton = document.querySelector('[data-ua-reading-toggle]');
  const readingStatus = document.querySelector('[data-ua-reading-status]');
  if (!header || !menuButton || !mobileNav || !themeButton) return;

  const syncBrowserColor = () => {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const paper = getComputedStyle(document.documentElement).getPropertyValue('--ua-paper').trim();
    if (themeMeta && paper) themeMeta.setAttribute('content', paper);
  };

  const syncTheme = () => {
    const dark = document.documentElement.classList.contains('theme-dark');
    document.body.classList.toggle('theme-dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    syncBrowserColor();
  };

  const pageSiblings = [...document.body.children].filter((node) => node !== header && node.tagName !== 'SCRIPT');
  const setMenu = (open, returnFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.setAttribute('aria-hidden', String(!open));
    mobileNav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('ua-menu-open', open);
    pageSiblings.forEach((node) => open ? node.setAttribute('inert', '') : node.removeAttribute('inert'));
    if (open) (mobileNav.querySelector('[aria-current="page"]') || mobileNav.querySelector('a'))?.focus();
    else if (returnFocus) menuButton.focus();
  };

  const syncReadingMode = (announce = false) => {
    const reading = document.documentElement.classList.contains('reading-mode');
    document.body.classList.toggle('reading-mode', reading);
    document.documentElement.dataset.palette = reading ? 'desert' : 'forest';
    if (readingButton) {
      readingButton.setAttribute('aria-pressed', String(reading));
      readingButton.setAttribute('aria-label', reading ? 'Disable reading mode' : 'Enable reading mode');
    }
    if (announce && readingStatus) readingStatus.textContent = reading ? 'Reading mode enabled' : 'Reading mode disabled';
    syncBrowserColor();
  };

  const switchReadingMode = () => {
    const reading = !document.documentElement.classList.contains('reading-mode');
    const update = () => {
      document.documentElement.classList.toggle('reading-mode', reading);
      try {
        localStorage.setItem('preferred-reading-mode', String(reading));
        localStorage.removeItem('preferred-palette');
      } catch (_) {}
      syncReadingMode(true);
    };
    document.documentElement.classList.add('palette-changing');
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(update).finished.finally(() => document.documentElement.classList.remove('palette-changing'));
    } else {
      update();
      setTimeout(() => document.documentElement.classList.remove('palette-changing'), 620);
    }
  };

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  readingButton?.addEventListener('click', switchReadingMode);
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    if (event.key !== 'Tab' || menuButton.getAttribute('aria-expanded') !== 'true') return;
    const focusable = [...mobileNav.querySelectorAll('a'), menuButton];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  addEventListener('resize', () => { if (innerWidth > 980) setMenu(false); });
  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 18), { passive: true });

  themeButton.addEventListener('click', () => {
    const dark = !document.documentElement.classList.contains('theme-dark');
    document.documentElement.classList.toggle('theme-dark', dark);
    try { localStorage.setItem('preferred-theme', dark ? 'dark' : 'light'); } catch (_) {}
    syncTheme();
  });
  syncReadingMode();
  syncTheme();
})();
