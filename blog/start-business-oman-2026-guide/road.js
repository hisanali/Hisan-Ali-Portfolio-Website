(() => {
  'use strict';
  // Founder switcher, myth cards and road-map progress for the main guide.
  const body = document.body;
  body.classList.add('sb-js');
  const KEY = 'sb-founder';
  const tabs = [...document.querySelectorAll('.sb-cast-list [data-founder]')];
  const items = [...document.querySelectorAll('.sb-case-item')];

  function pick(who, save) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.founder === who)));
    items.forEach((i) => i.classList.toggle('is-on', i.dataset.founder === who));
    if (save) { try { localStorage.setItem(KEY, who); } catch (e) {} }
  }
  let start = 'aisha';
  try { const s = localStorage.getItem(KEY); if (tabs.some((t) => t.dataset.founder === s)) start = s; } catch (e) {}
  pick(start, false);
  tabs.forEach((t) => t.addEventListener('click', () => pick(t.dataset.founder, true)));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    n.focus(); pick(n.dataset.founder, true);
  }));

  document.querySelectorAll('.sb-myth').forEach((m) => m.addEventListener('click', () => {
    m.setAttribute('aria-pressed', String(m.getAttribute('aria-pressed') !== 'true'));
  }));

  // Road progress: highlight the current stage on the map and in a small floating pill.
  const links = [...document.querySelectorAll('.sb-route-list a')];
  const stages = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!stages.length) return;
  const route = document.querySelector('.sb-route');
  const mini = document.createElement('a');
  mini.className = 'sb-mini';
  mini.href = '#blog-content';
  mini.setAttribute('aria-label', 'Back to the road map');
  mini.innerHTML = '<span class="sb-mini-n">0</span><span class="sb-mini-t">Ready?</span><span class="sb-mini-bar"><i></i></span>';
  body.appendChild(mini);
  mini.addEventListener('click', (e) => { e.preventDefault(); route.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  const end = document.getElementById('faq');
  let ticking = false;
  function update() {
    ticking = false;
    const y = innerHeight * 0.35;
    let cur = -1;
    stages.forEach((s, i) => { if (s.getBoundingClientRect().top < y) cur = i; });
    links.forEach((a, i) => { a.classList.toggle('is-here', i === cur); a.classList.toggle('is-past', i < cur); });
    const show = cur >= 0 && route.getBoundingClientRect().bottom < 0 && (!end || end.getBoundingClientRect().top > innerHeight * 0.6);
    mini.classList.toggle('is-on', show);
    if (cur >= 0) {
      mini.querySelector('.sb-mini-n').textContent = links[cur].querySelector('.sb-route-n').textContent;
      mini.querySelector('.sb-mini-t').textContent = links[cur].querySelector('b').textContent;
      mini.querySelector('i').style.width = `${((cur + 1) / links.length) * 100}%`;
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
