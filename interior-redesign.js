(() => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const root = path.split('/')[0] || 'home';
  const known = ['about', 'services', 'tools', 'games', 'blog', 'contact', 'speed-test', 'gcc', 'legal'];
  const family = known.includes(root) ? root : 'landing';
  document.body.classList.add('redesign-interior', `page-${family}`);
  if (root === 'blog' && path.split('/').length > 1) document.body.classList.add('page-blog-article');
  if (root === 'tools' && path.split('/').length > 1) document.body.classList.add('page-tool-detail');

  const progress = document.createElement('div');
  progress.className = 'interior-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.prepend(progress);

  const progressBar = progress.firstElementChild;
  let frame = 0;
  const update = () => {
    const available = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    progressBar.style.transform = `scaleX(${Math.min(scrollY / available, 1)})`;
    document.querySelector('.header')?.classList.toggle('interior-scrolled', scrollY > 24);
    frame = 0;
  };
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  update();

  const targets = document.querySelectorAll('main section, body > section, .blog-card, .tool-card, .service-detail, .skill-card, .value-card, .why-card, .process-card');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('interior-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -35px' });
    targets.forEach((target) => {
      target.classList.add('interior-motion-target');
      observer.observe(target);
    });
  }

  document.querySelectorAll('.tool-card, .skill-card, .value-card, .why-card, .process-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (!matchMedia('(pointer: fine)').matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    });
  });

  const launcher = document.querySelector('.page-tools .tool-launcher');
  if (launcher) {
    const items = [...launcher.querySelectorAll('.launcher-item')];
    const preview = launcher.querySelector('.launcher-preview');
    const previewNumber = preview.querySelector('.launcher-preview-top b');
    const previewIcon = preview.querySelector('.launcher-preview-icon i');
    const previewTitle = preview.querySelector('h3');
    const previewDescription = preview.querySelector('.launcher-preview-description');
    const previewTags = preview.querySelector('.launcher-preview-tags');
    const previewLink = preview.querySelector('.launcher-preview-link');

    const selectTool = (item) => {
      const index = items.indexOf(item) + 1;
      items.forEach((candidate) => candidate.classList.toggle('is-active', candidate === item));
      preview.classList.remove('is-switching');
      void preview.offsetWidth;
      preview.classList.add('is-switching');
      previewNumber.textContent = `${String(index).padStart(2, '0')} / ${items.length}`;
      previewIcon.className = item.dataset.icon;
      previewTitle.textContent = item.dataset.title;
      previewDescription.textContent = item.dataset.description;
      previewTags.replaceChildren(...item.dataset.tags.split('|').map((tag) => {
        const chip = document.createElement('span');
        chip.textContent = tag;
        return chip;
      }));
      previewLink.href = item.href;
    };

    items.forEach((item) => {
      item.addEventListener('pointerenter', () => selectTool(item));
      item.addEventListener('focus', () => selectTool(item));
    });
  }

})();
