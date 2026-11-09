(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Scroll reveals, bar growth and line drawing all key off one observer.
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
  document.querySelectorAll('.mo, .mo-stagger, .mo-bar, .mo-draw').forEach(el => reveal.observe(el));
  // Looping scenes only run while on screen.
  const scenes = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('play', e.isIntersecting));
  }, { threshold: 0.3 });
  document.querySelectorAll('.mo-scene').forEach(el => scenes.observe(el));
  // Hero videos: autoplay muted loops with a pause control; reduced motion shows the poster only.
  document.querySelectorAll('.mo-video').forEach(fig => {
    const video = fig.querySelector('video'); if (!video) return;
    let userPaused = reduce, visible = false;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mo-toggle';
    const setUI = p => { fig.classList.toggle('paused', p); btn.textContent = p ? 'Play' : 'Pause'; btn.setAttribute('aria-label', p ? 'Play animation' : 'Pause animation'); };
    const tryPlay = () => { if (!userPaused) video.play().catch(() => {}); };
    btn.addEventListener('click', () => { userPaused = !userPaused; setUI(userPaused); if (userPaused) video.pause(); else tryPlay(); });
    fig.append(btn); setUI(userPaused);
    if (reduce) { video.removeAttribute('autoplay'); video.pause(); return; }
    const io = new IntersectionObserver(entries => { entries.forEach(e => { visible = e.isIntersecting; if (visible) tryPlay(); else video.pause(); }); }, { threshold: 0.2 });
    io.observe(fig);
  });
})();
