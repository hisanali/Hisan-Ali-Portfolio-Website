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
const heroVisual = document.querySelector('.hero-visual');
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

    if (heroVisual) {
      const heroRect = heroVisual.getBoundingClientRect();
      const heroProgress = Math.max(0, Math.min(1, (window.innerHeight - heroRect.top) / (window.innerHeight + heroRect.height * .55)));
      heroVisual.style.setProperty('--hero-sat', (.7 + heroProgress * .48).toFixed(2));
      heroVisual.style.setProperty('--tone-opacity', Math.max(0, .28 - heroProgress * .34).toFixed(2));
    }
  }
  motionFrame = 0;
};

const requestScrollMotion = () => {
  if (!motionFrame) motionFrame = requestAnimationFrame(updateScrollMotion);
};

window.addEventListener('scroll', requestScrollMotion, { passive: true });
window.addEventListener('resize', requestScrollMotion, { passive: true });
updateScrollMotion();

const heroWord = document.querySelector('[data-hero-word]');
if (heroWord && !reduceMotion) {
  const heroWords = ['business growth.', 'qualified demand.', 'market momentum.', 'measurable revenue.'];
  let heroWordIndex = 0;
  window.setInterval(() => {
    heroWord.classList.add('is-changing');
    window.setTimeout(() => {
      heroWordIndex = (heroWordIndex + 1) % heroWords.length;
      heroWord.textContent = heroWords[heroWordIndex];
      heroWord.classList.remove('is-changing');
    }, 300);
  }, 3400);
}

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

  const growthStage = document.querySelector('[data-growth-stage]');
  const reactiveCards = [...document.querySelectorAll('.availability-card, .strategy-card')];
  growthStage?.addEventListener('pointermove', (event) => {
    const rect = growthStage.getBoundingClientRect();
    const x = Math.max(14, Math.min(86, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(14, Math.min(86, ((event.clientY - rect.top) / rect.height) * 100));
    growthStage.style.setProperty('--lens-x', `${x.toFixed(1)}%`);
    growthStage.style.setProperty('--lens-y', `${y.toFixed(1)}%`);
    growthStage.classList.add('is-exploring');
    reactiveCards.forEach((card, index) => {
      const force = index ? -1 : 1;
      card.style.setProperty('--react-x', `${((x - 50) * .08 * force).toFixed(1)}px`);
      card.style.setProperty('--react-y', `${((y - 50) * .05 * force).toFixed(1)}px`);
    });
  });
  growthStage?.addEventListener('pointerleave', () => {
    growthStage.classList.remove('is-exploring');
    reactiveCards.forEach((card) => {
      card.style.setProperty('--react-x', '0px');
      card.style.setProperty('--react-y', '0px');
    });
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

document.querySelector('#contactForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = `Project inquiry: ${data.get('subject')}`;
  const message = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
  window.location.href = `mailto:workhisan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
});
