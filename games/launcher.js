(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const stage = $('[data-game-stage]');
  const picker = $('.game-picker');
  if (!stage || !picker) return;

  // Section reveal animations add transforms that would trap a fixed player.
  document.body.append(stage);

  const picks = () => $$('.game-pick[data-game]', picker);
  const visiblePicks = () => picks().filter((pick) => !pick.hidden && !pick.classList.contains('is-search-miss'));
  const position = $('[data-player-position]');
  const closeButton = $('[data-player-close]');
  let lastTrigger = null;

  const setPosition = (pick) => {
    const list = picks();
    if (position) position.textContent = `${list.indexOf(pick) + 1} of ${list.length}`;
  };

  const bundles3D = { snake: '/games/snake3d.bundle.js?v=1', stack: '/games/arcade3d.bundle.js?v=1', flight: '/games/arcade3d.bundle.js?v=1', pong: '/games/arcade3d.bundle.js?v=1', gravity: '/games/arcade3d.bundle.js?v=1' };
  const load3D = (game) => {
    const src = bundles3D[game];
    if (!src || (game === 'snake' ? window.Snake3D : window.Arcade3D) || $$('script[data-game3d]').some((script) => script.dataset.game3d === src)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.game3d = src;
    document.body.append(script);
  };

  const open = (pick) => {
    load3D(pick.dataset.game);
    if (!stage.classList.contains('is-open')) lastTrigger = document.activeElement;
    setPosition(pick);
    stage.inert = false;
    stage.setAttribute('aria-hidden', 'false');
    stage.classList.add('is-open');
    document.documentElement.classList.add('is-playing');
    try { history.replaceState(null, '', `#${pick.dataset.game}`); } catch (_) {}
    requestAnimationFrame(() => {
      stage.scrollTop = 0;
      const heading = $(`[data-game-panel="${pick.dataset.game}"] h3`);
      (heading || closeButton)?.focus({ preventScroll: true });
    });
  };

  const close = () => {
    if (!stage.classList.contains('is-open')) return;
    closeRules();
    stage.classList.remove('is-open');
    stage.setAttribute('aria-hidden', 'true');
    stage.inert = true;
    document.documentElement.classList.remove('is-playing');
    window.dispatchEvent(new Event('games:pause'));
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    const selected = $('.game-pick[aria-selected="true"]', picker);
    const target = lastTrigger && document.contains(lastTrigger) && lastTrigger !== document.body ? lastTrigger : selected;
    target?.focus({ preventScroll: true });
  };

  const step = (direction) => {
    const list = picks();
    const current = list.findIndex((pick) => pick.getAttribute('aria-selected') === 'true');
    const next = list[(current + direction + list.length) % list.length];
    window.dispatchEvent(new Event('games:pause'));
    closeRules();
    next?.click();
  };

  // "How to play" opens the rules as a pop-over instead of a block of text under the board.
  const closeRules = () => $$('.game-panel.show-rules', stage).forEach((panel) => {
    panel.classList.remove('show-rules');
    $('.game-help', panel)?.setAttribute('aria-expanded', 'false');
  });
  $$('.game-panel', stage).forEach((panel) => {
    const info = $('.game-panel-info', panel);
    const rules = info && $(':scope > p', info);
    if (!rules) return;
    rules.id ||= `rules-${panel.dataset.gamePanel}`;
    const help = document.createElement('button');
    help.type = 'button';
    help.className = 'game-help';
    help.setAttribute('aria-expanded', 'false');
    help.setAttribute('aria-controls', rules.id);
    help.innerHTML = '<span aria-hidden="true">?</span>How to play';
    help.addEventListener('click', (event) => {
      event.stopPropagation();
      const show = !panel.classList.contains('show-rules');
      closeRules();
      panel.classList.toggle('show-rules', show);
      help.setAttribute('aria-expanded', String(show));
    });
    info.append(help);
  });
  stage.addEventListener('click', (event) => {
    if (!event.target.closest('.game-help, .game-panel-info > p')) closeRules();
  });

  stage.inert = !stage.classList.contains('is-open');
  picks().forEach((pick) => pick.addEventListener('click', () => open(pick)));
  closeButton?.addEventListener('click', close);
  $('[data-player-prev]')?.addEventListener('click', () => step(-1));
  $('[data-player-next]')?.addEventListener('click', () => step(1));

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if ($('.game-panel.show-rules', stage)) closeRules(); else close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = $$('button, [href], input, select, textarea, canvas[tabindex], [tabindex]:not([tabindex="-1"])', stage)
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !stage.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Shortcuts that open a game from elsewhere on the page (hero cards, CTA).
  $$('[data-open-game]').forEach((button) => button.addEventListener('click', () => {
    $(`.game-pick[data-game="${button.dataset.openGame}"]`, picker)?.click();
  }));

  // Hero cards reuse each game's cover art so the artwork lives in one place.
  $$('[data-hero-art]').forEach((slot) => {
    const art = $(`.game-pick[data-game="${slot.dataset.heroArt}"] .game-art svg`, picker);
    if (art) slot.append(art.cloneNode(true));
  });

  // Featured spotlight: each tab's progress bar is a CSS animation; when it ends, advance.
  const spot = $('[data-spot]');
  if (spot) {
    const slides = $$('[data-spot-slide]', spot);
    const tabs = $$('[data-spot-to]', spot);
    const show = (key) => {
      slides.forEach((slide) => {
        const on = slide.dataset.spotSlide === key;
        slide.classList.toggle('is-active', on);
        slide.inert = !on;
        slide.setAttribute('aria-hidden', String(!on));
      });
      tabs.forEach((tab) => {
        const on = tab.dataset.spotTo === key;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => show(tab.dataset.spotTo));
      tab.querySelector('.gc-spot-bar')?.addEventListener('animationend', () => {
        if (tab.classList.contains('is-active')) show(tabs[(index + 1) % tabs.length].dataset.spotTo);
      });
    });
    spot.addEventListener('keydown', (event) => {
      if (!event.target.matches('[data-spot-to]') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const index = tabs.indexOf(event.target);
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      show(next.dataset.spotTo);
      next.focus();
    });
    if (tabs[0]) show(tabs[0].dataset.spotTo);
  }

  // Search and filters.
  const search = $('[data-game-search]');
  const empty = $('[data-game-empty]');
  const count = $('[data-game-filter-count]');
  let filter = 'all';

  const refresh = () => {
    const query = (search?.value || '').trim().toLowerCase();
    picks().forEach((pick) => {
      const haystack = `${pick.dataset.title} ${pick.dataset.category} ${pick.textContent}`.toLowerCase();
      pick.classList.toggle('is-search-miss', Boolean(query) && !haystack.includes(query));
    });
    const shown = visiblePicks().length;
    picker.classList.toggle('is-filtered', filter !== 'all' || Boolean(query));
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = `${shown} game${shown === 1 ? '' : 's'}`;
  };

  $$('[data-game-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.gameFilter;
    requestAnimationFrame(refresh);
  }));
  search?.addEventListener('input', refresh);
  $('[data-game-search-clear]')?.addEventListener('click', () => {
    if (search) search.value = '';
    $('[data-game-filter="all"]')?.click();
    refresh();
    search?.focus();
  });

  // A shared room link or #game hash can open a game before this script ran.
  const selected = $('.game-pick[aria-selected="true"]', picker);
  const params = new URLSearchParams(location.search);
  const requested = location.hash.slice(1).replace(/^game-/, '');
  const invited = params.has('play') || params.has('tic');
  if (selected && (invited || (requested && selected.dataset.game === requested))) open(selected);
  refresh();
})();
