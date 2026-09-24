(() => {
  'use strict';
  const storeKey = 'topic-map-read';
  const load = () => {
    try { return new Set(JSON.parse(localStorage.getItem(storeKey) || '[]')); } catch { return new Set(); }
  };
  const save = set => {
    try { localStorage.setItem(storeKey, JSON.stringify([...set])); } catch { /* storage unavailable: progress lasts for this visit only */ }
  };

  // Problem finder: tabs that reveal the recommended reading order.
  const problems = [...document.querySelectorAll('.tm-problem')];
  const select = tab => {
    for (const other of problems) {
      const active = other === tab;
      other.setAttribute('aria-selected', String(active));
      other.tabIndex = active ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !active;
    }
  };
  problems.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = problems[(index + step + problems.length) % problems.length];
      select(next);
      next.focus();
    });
  });

  // Reading progress, shared across all three maps on this device.
  const read = load();
  const guides = [...document.querySelectorAll('.tm-guide')];
  const unique = [...new Set(guides.map(guide => guide.dataset.slug))];
  const bar = document.querySelector('[data-tm-bar]');
  const label = document.querySelector('[data-tm-label]');
  const render = () => {
    for (const guide of guides) {
      const done = read.has(guide.dataset.slug);
      guide.classList.toggle('is-done', done);
      guide.querySelector('.tm-done').setAttribute('aria-pressed', String(done));
    }
    const count = unique.filter(slug => read.has(slug)).length;
    if (bar) bar.style.width = `${unique.length ? count / unique.length * 100 : 0}%`;
    if (label) label.textContent = `${count} of ${unique.length} read`;
  };
  guides.forEach(guide => {
    guide.querySelector('.tm-done').addEventListener('click', () => {
      const slug = guide.dataset.slug;
      if (read.has(slug)) read.delete(slug); else read.add(slug);
      save(read);
      render();
    });
  });
  render();
})();
