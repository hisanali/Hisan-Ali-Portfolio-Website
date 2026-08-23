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
      if (card.matches('.page-about .skill-card')) {
        const horizontal = ((event.clientX - rect.left) / rect.width) - .5;
        const vertical = ((event.clientY - rect.top) / rect.height) - .5;
        card.style.setProperty('--expertise-shift-x', `${(horizontal * 8).toFixed(2)}px`);
        card.style.setProperty('--expertise-shift-y', `${(vertical * 8).toFixed(2)}px`);
        card.style.setProperty('--expertise-tilt-x', `${(-vertical * 1.8).toFixed(2)}deg`);
        card.style.setProperty('--expertise-tilt-y', `${(horizontal * 1.8).toFixed(2)}deg`);
      }
    });
    card.addEventListener('pointerleave', () => {
      if (!card.matches('.page-about .skill-card')) return;
      card.style.setProperty('--expertise-shift-x', '0px');
      card.style.setProperty('--expertise-shift-y', '0px');
      card.style.setProperty('--expertise-tilt-x', '0deg');
      card.style.setProperty('--expertise-tilt-y', '0deg');
    });
  });

  const articleHero = document.querySelector('.page-blog-article .blog-post-hero');
  const canTrackHeroPointer = matchMedia('(pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (articleHero && canTrackHeroPointer) {
    let heroPointerFrame = 0;
    let heroPointerEvent;
    const paintHeroPointer = () => {
      const rect = articleHero.getBoundingClientRect();
      const x = Math.max(0, Math.min(heroPointerEvent.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(heroPointerEvent.clientY - rect.top, rect.height));
      const normalizedX = (x / rect.width - .5) * 2;
      const normalizedY = (y / rect.height - .5) * 2;
      articleHero.style.setProperty('--hero-cursor-x', `${x + 28}px`);
      articleHero.style.setProperty('--hero-cursor-y', `${y + 28}px`);
      articleHero.style.setProperty('--hero-dots-x', `${normalizedX * 14}px`);
      articleHero.style.setProperty('--hero-dots-y', `${normalizedY * 10}px`);
      heroPointerFrame = 0;
    };
    articleHero.addEventListener('pointermove', (event) => {
      heroPointerEvent = event;
      if (!heroPointerFrame) heroPointerFrame = requestAnimationFrame(paintHeroPointer);
    }, { passive: true });
    articleHero.addEventListener('pointerleave', () => {
      articleHero.style.setProperty('--hero-cursor-x', '64%');
      articleHero.style.setProperty('--hero-cursor-y', '42%');
      articleHero.style.setProperty('--hero-dots-x', '0px');
      articleHero.style.setProperty('--hero-dots-y', '0px');
    });
  }

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

  const article = document.querySelector('.page-blog-article .blog-post-content');
  const articleSidebar = document.querySelector('.page-blog-article .blog-sidebar');
  if (article && articleSidebar) {
    const headings = [...article.querySelectorAll('h2')];
    const usedIds = new Set([...document.querySelectorAll('[id]')].map((element) => element.id));
    const slugify = (value) => value.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 64) || 'section';

    headings.forEach((heading, index) => {
      if (heading.id) return;
      const base = slugify(heading.textContent || `section-${index + 1}`);
      let id = base;
      let duplicate = 2;
      while (usedIds.has(id)) id = `${base}-${duplicate++}`;
      heading.id = id;
      usedIds.add(id);
    });

    if (headings.length) {
      const toc = document.createElement('nav');
      toc.className = 'article-toc';
      toc.setAttribute('aria-label', 'On this page');
      const eyebrow = document.createElement('span');
      eyebrow.className = 'article-toc-eyebrow';
      eyebrow.textContent = 'Reading map';
      const title = document.createElement('h2');
      title.textContent = 'Inside this article';
      const list = document.createElement('ol');
      const links = headings.slice(0, 9).map((heading) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        item.append(link);
        list.append(item);
        return { heading, link };
      });

      toc.append(eyebrow, title, list);
      articleSidebar.prepend(toc);

      if ('IntersectionObserver' in window) {
        const setCurrent = (activeHeading) => links.forEach(({ heading, link }) => {
          if (heading === activeHeading) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
        setCurrent(links[0].heading);
        const tocObserver = new IntersectionObserver((entries) => {
          const visible = entries.find((entry) => entry.isIntersecting);
          if (visible) setCurrent(visible.target);
        }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });
        links.forEach(({ heading }) => tocObserver.observe(heading));
      }
    }
  }

  const motionPreviewQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
  document.querySelectorAll('.blog-hover-video').forEach((video) => {
    const surface = video.closest('.blog-image, .blog-featured-image');
    const card = video.closest('.blog-card');
    const hoverTarget = card || surface;
    if (!surface) return;

    const resumePreview = () => {
      if (!motionPreviewQuery.matches) return;
      const playRequest = video.play();
      if (playRequest) playRequest.then(() => surface.classList.add('is-hover-playing')).catch(() => {});
    };

    function pausePreview() {
      video.pause();
    }

    hoverTarget.addEventListener('pointerenter', pausePreview);
    hoverTarget.addEventListener('pointerleave', resumePreview);
    if (card) {
      card.addEventListener('focusin', pausePreview);
      card.addEventListener('focusout', resumePreview);
    }
    motionPreviewQuery.addEventListener?.('change', (event) => {
      if (event.matches) resumePreview();
      else pausePreview();
    });
    resumePreview();
  });

  const blogLandingHero = document.querySelector('.page-blog .blog-hero');
  if (blogLandingHero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let heroMotionFrame = 0;
    let latestHeroPointer;
    const updateBlogHeroMotion = () => {
      const bounds = blogLandingHero.getBoundingClientRect();
      const x = ((latestHeroPointer.clientX - bounds.left) / bounds.width - .5) * 2;
      const y = ((latestHeroPointer.clientY - bounds.top) / bounds.height - .5) * 2;
      blogLandingHero.style.setProperty('--blog-orbit-x', `${x * 16}px`);
      blogLandingHero.style.setProperty('--blog-orbit-y', `${y * 12}px`);
      blogLandingHero.style.setProperty('--blog-dots-x', `${x * -10}px`);
      blogLandingHero.style.setProperty('--blog-dots-y', `${y * -8}px`);
      heroMotionFrame = 0;
    };
    blogLandingHero.addEventListener('pointermove', (event) => {
      latestHeroPointer = event;
      if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(updateBlogHeroMotion);
    }, { passive: true });
    blogLandingHero.addEventListener('pointerleave', () => {
      blogLandingHero.style.setProperty('--blog-orbit-x', '0px');
      blogLandingHero.style.setProperty('--blog-orbit-y', '0px');
      blogLandingHero.style.setProperty('--blog-dots-x', '0px');
      blogLandingHero.style.setProperty('--blog-dots-y', '0px');
    });
  }

  const journalCount = document.querySelector('.page-blog .blog-orbit-core [data-count-to]');
  if (journalCount) {
    const targetCount = Number(journalCount.dataset.countTo) || 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      journalCount.textContent = String(targetCount);
    } else {
      journalCount.textContent = '0';
      const runCount = () => {
        const duration = 1600;
        const startTime = performance.now();
        const countFrame = (timestamp) => {
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          journalCount.textContent = String(Math.round(targetCount * eased));
          if (progress < 1) requestAnimationFrame(countFrame);
        };
        requestAnimationFrame(countFrame);
      };
      if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          countObserver.disconnect();
          runCount();
        }, { threshold: .45 });
        countObserver.observe(journalCount);
      } else {
        runCount();
      }
    }
  }

  const journalTicker = document.querySelector('.page-blog .journal-ticker');
  const journalTickerTrack = journalTicker?.querySelector('.journal-ticker-track');
  const journalTickerGroup = journalTickerTrack?.querySelector('.journal-ticker-group');
  if (journalTicker && journalTickerTrack && journalTickerGroup) {
    const seedItems = [...journalTickerGroup.children].map((item) => item.cloneNode(true));
    const fillTicker = () => {
      journalTickerTrack.querySelectorAll('.journal-ticker-group[aria-hidden="true"]').forEach((clone) => clone.remove());
      const targetWidth = Math.max(window.innerWidth * 1.2, 1400);
      while (journalTickerGroup.scrollWidth < targetWidth) {
        seedItems.forEach((item) => journalTickerGroup.append(item.cloneNode(true)));
      }
      const duplicate = journalTickerGroup.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      journalTickerTrack.append(duplicate);
      journalTickerTrack.style.setProperty('--journal-loop-distance', `${journalTickerGroup.getBoundingClientRect().width * -1}px`);
    };
    fillTicker();
    let tickerResizeFrame = 0;
    window.addEventListener('resize', () => {
      if (tickerResizeFrame) cancelAnimationFrame(tickerResizeFrame);
      tickerResizeFrame = requestAnimationFrame(fillTicker);
    }, { passive: true });
  }

  const callSlider = document.querySelector('[data-call-slider]');
  const callThumb = callSlider?.querySelector('.contact-answer-thumb');
  const callLabel = callSlider?.querySelector('.contact-answer-label');
  if (callSlider && callThumb && callLabel) {
    let progress = 0;
    let isDragging = false;

    const paintCallSlider = (nextProgress) => {
      progress = Math.max(0, Math.min(nextProgress, 1));
      const maxTravel = Math.max(0, callSlider.clientWidth - callThumb.offsetWidth - 12);
      callSlider.style.setProperty('--call-slide-x', `${maxTravel * progress}px`);
      callSlider.style.setProperty('--call-slide-progress', progress);
    };

    const beginCall = () => {
      if (callSlider.classList.contains('is-answered')) return;
      paintCallSlider(1);
      callSlider.classList.add('is-answered');
      callLabel.textContent = 'Connecting…';
      callThumb.setAttribute('aria-label', 'Calling Hisan');
      callThumb.disabled = true;
      window.setTimeout(() => {
        window.location.href = `tel:${callSlider.dataset.phone}`;
      }, 450);
    };

    const updateFromPointer = (clientX) => {
      const bounds = callSlider.getBoundingClientRect();
      const maxTravel = Math.max(1, callSlider.clientWidth - callThumb.offsetWidth - 12);
      paintCallSlider((clientX - bounds.left - callThumb.offsetWidth / 2 - 6) / maxTravel);
    };

    callThumb.addEventListener('pointerdown', (event) => {
      isDragging = true;
      callThumb.setPointerCapture(event.pointerId);
      callSlider.classList.add('is-dragging');
      updateFromPointer(event.clientX);
    });
    callThumb.addEventListener('pointermove', (event) => {
      if (isDragging) updateFromPointer(event.clientX);
    });
    const finishSlide = (event) => {
      if (!isDragging) return;
      isDragging = false;
      callSlider.classList.remove('is-dragging');
      if (callThumb.hasPointerCapture(event.pointerId)) callThumb.releasePointerCapture(event.pointerId);
      if (progress >= .82) beginCall();
      else paintCallSlider(0);
    };
    callThumb.addEventListener('pointerup', finishSlide);
    callThumb.addEventListener('pointercancel', finishSlide);
    callThumb.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        beginCall();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        paintCallSlider(progress + .15);
        if (progress >= .82) beginCall();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        paintCallSlider(progress - .15);
      }
    });
    window.addEventListener('resize', () => paintCallSlider(progress), { passive: true });
    paintCallSlider(0);
  }

  const contactMapScene = document.querySelector('.page-contact .map-container');
  if (contactMapScene && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let mapFrame = 0;
    contactMapScene.addEventListener('pointermove', (event) => {
      const bounds = contactMapScene.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * -14;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * -10;
      if (mapFrame) cancelAnimationFrame(mapFrame);
      mapFrame = requestAnimationFrame(() => {
        contactMapScene.style.setProperty('--map-pan-x', `${x}px`);
        contactMapScene.style.setProperty('--map-pan-y', `${y}px`);
      });
    }, { passive: true });
    contactMapScene.addEventListener('pointerleave', () => {
      contactMapScene.style.setProperty('--map-pan-x', '0px');
      contactMapScene.style.setProperty('--map-pan-y', '0px');
    }, { passive: true });
  }

})();
