/* Site header v2 — mega sheet, sliding pill, hide-on-scroll, mobile accordions.
   Theme toggle, mobile open/close and focus trapping stay in site-shell.js. */
(() => {
  const header = document.querySelector('[data-hd]');
  if (!header) return;

  const nav = header.querySelector('[data-hd-nav]');
  const pill = header.querySelector('[data-hd-pill]');
  const sheet = header.querySelector('[data-hd-sheet]');
  const scrim = header.querySelector('[data-hd-scrim]');
  const items = [...header.querySelectorAll('[data-hd-item]')];
  const panels = Object.fromEntries([...header.querySelectorAll('[data-hd-panel]')].map((panel) => [panel.dataset.hdPanel, panel]));
  const order = items.map((item) => item.dataset.hdItem);
  const itemFor = (name) => items.find((item) => item.dataset.hdItem === name);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let current = null;
  let openTimer = 0;
  let closeTimer = 0;
  let lastInput = 'mouse';

  /* Mark the current page (the generator also marks the active section) */
  const path = location.pathname;
  header.querySelectorAll('.hd-nav a.hd-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (path === href) link.setAttribute('aria-current', 'page');
    if (path.startsWith(href) && !link.classList.contains('hd-trigger')) link.classList.add('is-active');
  });

  /* Sliding pill */
  const movePill = (target) => {
    if (!target) { pill.classList.remove('is-on'); return; }
    const a = target.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    pill.style.width = `${a.width}px`;
    pill.style.transform = `translateX(${a.left - b.left}px)`;
    pill.classList.add('is-on');
  };
  nav.addEventListener('pointerover', (event) => { const target = event.target.closest('.hd-has, .hd-link'); if (target) movePill(target.closest('.hd-has') || target); });
  nav.addEventListener('pointerleave', () => movePill(current ? itemFor(current) : null));

  /* Mega sheet */
  const setHeight = () => { if (current) sheet.style.setProperty('--hd-sheet-h', `${panels[current].offsetHeight}px`); };
  const open = (name, { focus = false } = {}) => {
    clearTimeout(closeTimer);
    if (current === name) return;
    const previous = current;
    current = name;
    items.forEach((item) => {
      const on = item.dataset.hdItem === name;
      item.classList.toggle('is-open', on);
      item.querySelector('[data-hd-caret]').setAttribute('aria-expanded', String(on));
    });
    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== name;
      if (key === name) panel.dataset.dir = previous ? (order.indexOf(name) > order.indexOf(previous) ? 'right' : 'left') : '';
    });
    header.classList.add('has-panel');
    setHeight();
    movePill(itemFor(name));
    if (focus) panels[name].querySelector('a')?.focus();
  };
  const close = ({ returnFocus = false } = {}) => {
    clearTimeout(openTimer);
    if (!current) return;
    const caret = itemFor(current)?.querySelector('[data-hd-caret]');
    current = null;
    items.forEach((item) => {
      item.classList.remove('is-open');
      item.querySelector('[data-hd-caret]').setAttribute('aria-expanded', 'false');
    });
    header.classList.remove('has-panel');
    sheet.style.setProperty('--hd-sheet-h', '0px');
    movePill(null);
    setTimeout(() => { if (!current) Object.values(panels).forEach((panel) => { panel.hidden = true; }); }, 300);
    if (returnFocus) caret?.focus();
  };
  const scheduleClose = () => { clearTimeout(openTimer); clearTimeout(closeTimer); closeTimer = setTimeout(close, 220); };

  header.addEventListener('pointerdown', (event) => { lastInput = event.pointerType || 'mouse'; }, true);
  header.addEventListener('keydown', () => { lastInput = 'keyboard'; }, true);

  items.forEach((item) => {
    const name = item.dataset.hdItem;
    const link = item.querySelector('[data-hd-trigger]');
    const caret = item.querySelector('[data-hd-caret]');
    // Mouse: hover shows the menu and a click goes to the page.
    // Touch/pen: the first tap opens the menu, a second tap goes to the page.
    link.addEventListener('click', (event) => {
      if ((lastInput === 'touch' || lastInput === 'pen' || !finePointer.matches) && lastInput !== 'keyboard' && current !== name) {
        event.preventDefault();
        open(name);
      }
    });
    caret.addEventListener('click', () => (current === name ? close() : open(name)));
    item.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      // Open instantly when switching between panels, with a short intent delay otherwise.
      openTimer = setTimeout(() => open(name), current ? 0 : 90);
    });
    item.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') scheduleClose(); });
    [link, caret].forEach((control) => control.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(name, { focus: true }); }
    }));
  });
  // Plain links in the bar close any open panel when hovered.
  nav.querySelectorAll('li:not(.hd-has) > a.hd-link').forEach((link) => link.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse' && current) scheduleClose(); }));
  sheet.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  sheet.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') scheduleClose(); });
  scrim.addEventListener('click', () => close());
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && current) close({ returnFocus: true }); });
  document.addEventListener('pointerdown', (event) => { if (current && !header.contains(event.target)) close(); });
  header.addEventListener('focusout', () => setTimeout(() => { if (current && !header.contains(document.activeElement)) close(); }, 0));
  addEventListener('resize', () => { setHeight(); if (innerWidth <= 980) close(); });
  sheet.addEventListener('click', (event) => { if (event.target.closest('a')) close(); });

  /* Compact + hide on scroll down, reveal on scroll up */
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 18);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (current || header.classList.contains('is-open')) header.classList.remove('is-hidden');
    else if (goingDown && y > 320) header.classList.add('is-hidden');
    else if (goingUp || y < 320) header.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* Mobile accordions */
  header.querySelectorAll('[data-hd-acc]').forEach((button) => {
    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      header.querySelectorAll('[data-hd-acc]').forEach((other) => other.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });
})();
