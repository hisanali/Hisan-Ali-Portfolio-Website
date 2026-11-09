(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const clear = () => { active.forEach(el => el.remove()); active.clear(); };
  reduced.addEventListener('change', clear);
  window.addEventListener('scroll', clear, { passive: true });
  let lastRipple = 0;
  document.addEventListener('click', e => {
    if (reduced.matches || e.detail === 0 || Date.now() - lastRipple < 120) return;
    if (e.target.closest('a,button,input,textarea,select,label,summary,canvas,iframe,[role="button"],[contenteditable],header,nav')) return;
    if (getSelection()?.toString()) return;
    lastRipple = Date.now();
    if (active.size >= 5) { const oldest = active.values().next().value; oldest.remove(); active.delete(oldest); }
    const ripple = document.createElement('span');
    ripple.className = 'tactile-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.append(ripple);
    active.add(ripple);
    document.dispatchEvent(new CustomEvent("site:ripple", {detail:{x:e.clientX,y:e.clientY}}));
    setTimeout(() => { ripple.remove(); active.delete(ripple); }, 1000);
  });
})();
