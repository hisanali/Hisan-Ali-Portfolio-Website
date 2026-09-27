(() => {
  'use strict';
  // Count-up for stat numbers. The final value is already in the HTML, so crawlers and no-JS readers see real figures.
  const nums = [...document.querySelectorAll('.fe-num[data-count]')];
  if (!nums.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const run = el => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    const format = v => prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    const start = performance.now(), duration = 1400;
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = format(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick); else el.textContent = format(target);
    };
    requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    run(entry.target);
  }), { threshold: 0.6 });
  nums.forEach(el => observer.observe(el));
})();
