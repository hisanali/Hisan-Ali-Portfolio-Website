(() => {
  const header = document.querySelector('[data-ua-header]');
  const menuButton = document.querySelector('[data-ua-menu-button]');
  const mobileNav = document.querySelector('[data-ua-mobile-nav]');
  const themeButton = document.querySelector('[data-ua-theme-toggle]');
  if (!header || !menuButton || !mobileNav || !themeButton) return;

  const syncTheme = () => {
    const dark = document.documentElement.classList.contains('theme-dark');
    document.body.classList.toggle('theme-dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
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

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
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
  syncTheme();
})();
