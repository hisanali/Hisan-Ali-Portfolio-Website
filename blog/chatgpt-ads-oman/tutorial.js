(() => {
  'use strict';
  // Progressive enhancement: all steps are in the HTML; JS turns them into a one-at-a-time walkthrough.
  const root = document.querySelector('.tu');
  if (!root) return;
  const steps = [...root.querySelectorAll('.tu-step')];
  const nav = root.querySelector('.tu-nav');
  const prev = root.querySelector('[data-tu="prev"]'), next = root.querySelector('[data-tu="next"]');
  let current = 0;
  const show = (i, focus) => {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, n) => s.classList.toggle('is-active', n === current));
    nav.querySelectorAll('button').forEach((b, n) => { b.setAttribute('aria-selected', String(n === current)); b.tabIndex = n === current ? 0 : -1; });
    prev.disabled = current === 0; next.disabled = current === steps.length - 1;
    next.textContent = current === steps.length - 1 ? 'Done' : 'Next step →';
    if (focus) steps[current].querySelector('h3').focus({ preventScroll: false });
  };
  steps.forEach((s, n) => {
    s.setAttribute('role', 'tabpanel'); s.id = s.id || 'tu-step-' + (n + 1);
    s.querySelector('h3').tabIndex = -1;
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', s.id);
    b.textContent = String(n + 1); b.title = s.querySelector('h3').textContent;
    b.addEventListener('click', () => show(n));
    nav.append(b);
  });
  nav.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(current + (e.key === 'ArrowRight' ? 1 : -1)); nav.children[current].focus(); }
  });
  prev.addEventListener('click', () => show(current - 1, true));
  next.addEventListener('click', () => show(current + 1, true));
  root.classList.add('is-enhanced');
  show(0);
})();
