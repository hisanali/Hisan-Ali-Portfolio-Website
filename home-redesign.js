const header = document.querySelector('[data-header]');
const button = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeToggle = document.querySelector('[data-theme-toggle]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

const applyTheme = (theme) => {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('theme-dark', dark);
  themeToggle?.setAttribute('aria-pressed', String(dark));
  themeToggle?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101814' : '#f4f0e8');
};

const savedTheme = () => {
  try {
    const value = localStorage.getItem('preferred-theme');
    return value === 'dark' || value === 'light' ? value : null;
  } catch (_) {
    return null;
  }
};

applyTheme(savedTheme() || 'light');
themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
  try { localStorage.setItem('preferred-theme', next); } catch (_) {}
  applyTheme(next);
});
systemTheme.addEventListener?.('change', (event) => {
  if (!savedTheme()) applyTheme('light');
});

if (!reduceMotion) document.documentElement.classList.add('motion-ready');

window.addEventListener('scroll', () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 20);
}, { passive: true });

button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  button.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  mobileNav?.classList.toggle('is-open', !open);
  document.body.classList.toggle('menu-open', !open);
});

mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  button?.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const progress = document.querySelector('[data-scroll-progress]');
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
let motionFrame = 0;

const updateScrollMotion = () => {
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  progress?.style.setProperty('transform', `scaleX(${Math.min(window.scrollY / scrollable, 1)})`);

  if (!reduceMotion) {
    const viewportCenter = window.innerHeight / 2;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -150 || rect.top > window.innerHeight + 150) return;
      const strength = Number(item.dataset.parallax || 5);
      const offset = ((rect.top + rect.height / 2 - viewportCenter) / window.innerHeight) * strength;
      item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }
  motionFrame = 0;
};

const requestScrollMotion = () => {
  if (!motionFrame) motionFrame = requestAnimationFrame(updateScrollMotion);
};

window.addEventListener('scroll', requestScrollMotion, { passive: true });
window.addEventListener('resize', requestScrollMotion, { passive: true });
updateScrollMotion();

if (window.location.hash) {
  const deepLinkTarget = document.querySelector(window.location.hash);
  window.setTimeout(() => deepLinkTarget?.scrollIntoView({ behavior: 'auto', block: 'start' }), 80);
}

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const glow = document.querySelector('[data-cursor-glow]');
  window.addEventListener('pointermove', (event) => {
    if (glow) {
      glow.style.opacity = '1';
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => {
    if (glow) glow.style.opacity = '0';
  });

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--rx', `${(-y * 3).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 3).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('[data-magnetic]').forEach((item) => {
    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--mx', `${((event.clientX - rect.left - rect.width / 2) * .12).toFixed(1)}px`);
      item.style.setProperty('--my', `${((event.clientY - rect.top - rect.height / 2) * .16).toFixed(1)}px`);
    });
    item.addEventListener('pointerleave', () => {
      item.style.setProperty('--mx', '0px');
      item.style.setProperty('--my', '0px');
    });
  });
}

const heroWatcher = document.querySelector('[data-hero-watcher]');
const watcherPupils = [...document.querySelectorAll('[data-watcher-pupil]')];
const watcherText = document.querySelector('[data-watcher-text]');
if (heroWatcher) {
  const visitContact = () => document.querySelector('#contact')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  const touchLayout = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  heroWatcher.addEventListener('click', () => {
    if (touchLayout && !heroWatcher.classList.contains('is-curious')) {
      heroWatcher.classList.add('is-curious');
      window.setTimeout(() => heroWatcher.classList.remove('is-curious'), 4800);
      return;
    }
    visitContact();
  });

  if (touchLayout && 'IntersectionObserver' in window) {
    const watcherObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      heroWatcher.classList.add('is-curious');
      window.setTimeout(() => heroWatcher.classList.remove('is-curious'), 4800);
      watcherObserver.disconnect();
    }, { threshold: .7 });
    watcherObserver.observe(heroWatcher);
  } else {
    window.setTimeout(() => heroWatcher.classList.add('is-curious'), 700);
    window.setTimeout(() => heroWatcher.classList.remove('is-curious'), 4600);
  }

  const watcherMessages = ['I see growth potential here.', 'Your next opportunity is closer than it looks.'];
  let watcherMessageIndex = 0;
  window.setInterval(() => {
    if (!watcherText) return;
    watcherMessageIndex = (watcherMessageIndex + 1) % watcherMessages.length;
    watcherText.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, easing: 'ease-out' });
    watcherText.textContent = watcherMessages[watcherMessageIndex];
  }, 4200);

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      const rect = heroWatcher.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
      const pupilX = Math.cos(angle) * 3.5;
      const pupilY = Math.sin(angle) * 3.5;
      watcherPupils.forEach((pupil) => {
        pupil.style.transform = `translate(calc(-50% + ${pupilX.toFixed(2)}px), calc(-50% + ${pupilY.toFixed(2)}px))`;
      });
    }, { passive: true });
  }
}

document.querySelector('#contactForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = `Project inquiry: ${data.get('subject')}`;
  const message = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
  window.location.href = `mailto:workhisan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
});
