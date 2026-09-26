(() => {
  const page = document.querySelector('.sv-page');
  if (!page) return;

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const data = JSON.parse($('#sv-data')?.textContent || '{"goals":{},"services":{},"tools":{},"colors":{}}');
  const STORE_KEY = 'sv-brief-v1';
  const store = {
    get: () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (_) { return null; } },
    set: (value) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch (_) { /* storage unavailable */ } }
  };
  const onScroll = (fn) => {
    let ticking = false;
    const run = () => { ticking = false; fn(); };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run);
    run();
  };

  /* ---------- Reveals ---------- */

  const revealTargets = $$('[data-sv-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty('--sv-delay', `${Math.min(index, 6) * 80}ms`);
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    const fold = innerHeight * 0.92;
    revealTargets.forEach((target) => {
      if (target.getBoundingClientRect().top < fold) target.classList.add('is-in');
      else observer.observe(target);
    });
    page.classList.add('sv-js');
  }

  /* ---------- Brief state ---------- */
  // Services suggested by the chosen goal (auto) are kept apart from ones added by hand (manual),
  // so switching goals swaps the suggestion without discarding the visitor's own picks.

  const goalKeys = Object.keys(data.goals);
  const saved = store.get() || {};
  const known = (list) => (Array.isArray(list) ? list.filter((id) => id in data.services) : []);
  const state = {
    committed: saved.goal in data.goals || known(saved.manual).length > 0,
    goal: saved.goal in data.goals ? saved.goal : null,
    when: typeof saved.when === 'string' ? saved.when : null,
    auto: new Set(known(saved.auto)),
    manual: new Set(known(saved.manual))
  };
  // What the hero sentence currently shows (may be an un-committed preview while it cycles).
  const view = { goal: state.goal || goalKeys[0], when: state.when || 'Within a month' };

  const picked = () => {
    const all = new Set([...state.manual, ...state.auto]);
    return Object.keys(data.services).filter((id) => all.has(id));
  };
  const persist = () => store.set({ goal: state.goal, when: state.when, auto: [...state.auto], manual: [...state.manual] });

  const cards = new Map($$('[data-sv-card]').map((card) => [card.dataset.svCard, card]));
  const logoMarkup = (key) => `<span class="sv-logo" style="--brand:${data.colors[key] || '#333'}"><svg aria-hidden="true"><use href="#sv-l-${key}"/></svg></span>`;

  /* ---------- Contact hand-off ---------- */

  const contactUrl = () => {
    const ids = picked();
    if (!ids.length && !state.goal && !state.when) return '/contact/';
    const url = new URL('/contact/', location.origin);
    const goal = state.goal ? data.goals[state.goal] : null;
    url.searchParams.set('service', ids.length === 1 ? data.services[ids[0]].contact : 'consultation');
    if (goal?.goal) url.searchParams.set('goal', goal.goal);
    const lines = ['Hi Hisan,', ''];
    if (goal) lines.push(`What I need: ${goal.label.replace('’', "'")}`);
    if (ids.length) lines.push(`Services I'm interested in: ${ids.map((id) => data.services[id].name).join(', ')}`);
    if (state.when) lines.push(`Timeline: ${state.when}`);
    lines.push('', 'A bit about the business and what is getting in the way:', '');
    url.searchParams.set('brief', lines.join('\n'));
    return `${url.pathname}${url.search}`;
  };

  /* ---------- Hero: sentence composer ---------- */

  const assembly = $('[data-sv-assembly]');
  const assemblyLabel = $('[data-sv-assembly-label]');
  const why = $('[data-sv-why]');
  const commitButton = $('[data-sv-commit]');
  const heroSend = $('[data-sv-hero-send]');
  const words = Object.fromEntries($$('[data-sv-word]').map((button) => [button.dataset.svWord, button]));
  const menuOf = (button) => document.getElementById(button.getAttribute('aria-controls'));
  const selectOption = (button, value) => {
    $$('[role="option"]', menuOf(button)).forEach((option) => option.setAttribute('aria-selected', String(option.dataset.value === value)));
  };

  const swapText = (button, text) => {
    const holder = $('[data-sv-word-text]', button);
    if (!holder || holder.textContent === text) return;
    if (reducedMotion.matches) { holder.textContent = text; return; }
    holder.classList.add('is-swapping');
    setTimeout(() => { holder.textContent = text; holder.classList.remove('is-swapping'); }, 260);
  };

  const renderAssembly = () => {
    if (!assembly) return;
    const goal = data.goals[view.goal];
    const ids = picked();
    assembly.replaceChildren(...goal.services.map((id, index) => {
      const tile = document.createElement(state.committed ? 'button' : 'div');
      tile.className = 'sv-tile';
      tile.style.setProperty('--n', index);
      if (state.committed) {
        tile.type = 'button';
        tile.dataset.svAdd = id;
        tile.setAttribute('aria-pressed', String(ids.includes(id)));
      }
      const tools = (data.tools[id] || []).map(logoMarkup).join('');
      tile.innerHTML = `<span class="sv-tile-logos">${tools}</span><span><b>${data.services[id].short}</b><small>${data.services[id].stage}</small></span>${state.committed ? '<span class="sv-tile-state" aria-hidden="true"><svg class="sv-i"><use href="#sv-check"/></svg></span>' : ''}`;
      return tile;
    }));
    if (why) why.textContent = goal.why;
    if (assemblyLabel) assemblyLabel.textContent = state.committed ? 'Your team — tap to adjust' : 'The team for that';
    if (commitButton) commitButton.hidden = state.committed;
    if (heroSend) heroSend.hidden = !state.committed;
  };

  const syncTiles = () => {
    const ids = picked();
    $$('.sv-tile[data-sv-add]').forEach((tile) => tile.setAttribute('aria-pressed', String(ids.includes(tile.dataset.svAdd))));
  };

  const commitGoal = (goal) => {
    state.committed = true;
    state.goal = goal;
    state.when = view.when;
    state.auto = new Set(data.goals[goal].services.filter((id) => !state.manual.has(id)));
  };

  // Until the visitor touches the sentence, the goal word gently cycles to show what the page can do.
  let cycleTimer = null;
  const stopCycle = () => { clearInterval(cycleTimer); cycleTimer = null; };
  if (!state.committed && !reducedMotion.matches && words.goal) {
    cycleTimer = setInterval(() => {
      if (document.hidden) return;
      view.goal = goalKeys[(goalKeys.indexOf(view.goal) + 1) % goalKeys.length];
      swapText(words.goal, data.goals[view.goal].phrase);
      selectOption(words.goal, view.goal);
      setTimeout(renderAssembly, 200);
    }, 3400);
    $('.sv-hero')?.addEventListener('pointerdown', stopCycle);
    $('.sv-hero')?.addEventListener('focusin', stopCycle);
  }

  /* Listbox menus for the two editable words */
  const menus = [];
  $$('[data-sv-word]').forEach((button) => {
    const menu = menuOf(button);
    const options = $$('[role="option"]', menu);
    const api = { button, menu };
    api.close = (refocus) => {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (refocus) button.focus();
    };
    const open = () => {
      menus.forEach((other) => other !== api && other.close(false));
      // On phones the menu is fixed full-width just under the word, so it never runs off-screen.
      menu.style.top = innerWidth <= 760 ? `${Math.round(button.getBoundingClientRect().bottom + 8)}px` : '';
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      (options.find((option) => option.getAttribute('aria-selected') === 'true') || options[0]).focus({ preventScroll: true });
    };
    const choose = (option) => {
      const value = option.dataset.value;
      selectOption(button, value);
      if (button.dataset.svWord === 'goal') {
        view.goal = value;
        swapText(button, data.goals[value].phrase);
        commitGoal(value);
      } else {
        view.when = value;
        swapText(button, option.textContent);
        if (state.committed) state.when = value;
      }
      api.close(true);
      renderAssembly();
      render();
    };
    button.addEventListener('click', () => (menu.hidden ? open() : api.close(false)));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
    });
    options.forEach((option, index) => {
      option.addEventListener('click', () => choose(option));
      option.addEventListener('keydown', (event) => {
        const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
        if (step) { event.preventDefault(); options[(index + step + options.length) % options.length].focus(); }
        else if (event.key === 'Home') { event.preventDefault(); options[0].focus(); }
        else if (event.key === 'End') { event.preventDefault(); options[options.length - 1].focus(); }
        else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(option); }
        else if (event.key === 'Escape' || event.key === 'Tab') api.close(event.key === 'Escape');
      });
    });
    menus.push(api);
  });
  addEventListener('scroll', () => { if (innerWidth <= 760) menus.forEach((item) => item.menu.hidden || item.close(false)); }, { passive: true });
  document.addEventListener('pointerdown', (event) => {
    menus.forEach((item) => {
      if (!item.menu.hidden && !item.menu.contains(event.target) && !item.button.contains(event.target)) item.close(false);
    });
  });

  commitButton?.addEventListener('click', () => {
    stopCycle();
    commitGoal(view.goal);
    if (words.goal) selectOption(words.goal, view.goal);
    renderAssembly();
    render();
    heroSend?.focus();
  });

  /* ---------- Catalogue, stacks and tray ---------- */

  const tray = $('[data-sv-tray]');
  const trayList = $('[data-sv-tray-list]');
  const trayCount = $('[data-sv-count]');
  const traySummary = $('[data-sv-summary]');
  const trayIcon = $('.sv-tray-icon');
  let lastCount = picked().length;

  const render = () => {
    const ids = picked();
    cards.forEach((card, id) => {
      const on = ids.includes(id);
      card.classList.toggle('is-picked', on);
      card.classList.toggle('is-recommended', state.auto.has(id));
      const button = $('[data-sv-add]', card);
      if (button) {
        button.setAttribute('aria-pressed', String(on));
        $('span', button).textContent = on ? 'Added' : 'Add';
      }
    });
    syncTiles();

    if (tray) {
      tray.hidden = ids.length === 0;
      trayCount.textContent = ids.length;
      if (traySummary) traySummary.textContent = `${ids.length} service${ids.length === 1 ? '' : 's'} in brief`;
      trayList.replaceChildren(...ids.map((id) => {
        const item = document.createElement('li');
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.svRemove = id;
        remove.setAttribute('aria-label', `Remove ${data.services[id].name} from brief`);
        remove.innerHTML = `${data.services[id].short}<svg class="sv-i" aria-hidden="true"><use href="#sv-close"/></svg>`;
        item.append(remove);
        return item;
      }));
      if (ids.length > lastCount && trayIcon && !reducedMotion.matches) {
        trayIcon.classList.remove('is-bump');
        void trayIcon.offsetWidth;
        trayIcon.classList.add('is-bump');
      }
      lastCount = ids.length;
    }

    const href = contactUrl();
    $$('[data-sv-send]').forEach((link) => { link.href = href; });
    persist();
  };

  page.addEventListener('click', (event) => {
    const add = event.target.closest('[data-sv-add]');
    if (add) {
      const id = add.dataset.svAdd;
      if (picked().includes(id)) { state.manual.delete(id); state.auto.delete(id); }
      else state.manual.add(id);
      render();
      return;
    }
    const remove = event.target.closest('[data-sv-remove]');
    if (remove) {
      state.manual.delete(remove.dataset.svRemove);
      state.auto.delete(remove.dataset.svRemove);
      render();
      return;
    }
    const stack = event.target.closest('[data-sv-stack]');
    if (stack) {
      stack.dataset.svStack.split(' ').forEach((id) => { state.manual.add(id); state.auto.delete(id); });
      $$('.sv-stack').forEach((item) => item.classList.toggle('is-used', item.contains(stack)));
      const label = stack.firstChild;
      if (label?.nodeType === Node.TEXT_NODE) {
        label.textContent = 'Added to your brief ';
        setTimeout(() => { label.textContent = 'Use this mix '; }, 2200);
      }
      render();
      return;
    }
    if (event.target.closest('[data-sv-clear]')) {
      state.manual.clear();
      state.auto.clear();
      $$('.sv-stack').forEach((item) => item.classList.remove('is-used'));
      render();
    }
  });

  const filters = $$('[data-sv-filter]');
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const stage = button.dataset.svFilter;
      filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach((card) => {
        const show = stage === 'all' || card.dataset.svStage === stage;
        const wasHidden = card.hidden;
        card.hidden = !show;
        if (show && wasHidden && !reducedMotion.matches) {
          card.classList.remove('is-entering');
          void card.offsetWidth;
          card.classList.add('is-entering');
        }
      });
    });
  });

  /* ---------- Team bench ---------- */

  const seats = $$('[data-sv-seat]');
  const openSeat = (seat) => {
    seats.forEach((item) => {
      const on = item === seat;
      item.classList.toggle('is-open', on);
      $('.sv-seat-tab', item).setAttribute('aria-expanded', String(on));
    });
  };
  seats.forEach((seat) => {
    $('.sv-seat-tab', seat).addEventListener('click', () => openSeat(seat));
    seat.addEventListener('pointerenter', () => { if (finePointer.matches && innerWidth > 900) openSeat(seat); });
  });

  /* ---------- Pinned horizontal process ---------- */

  const process = $('[data-sv-process]');
  const track = $('[data-sv-track]');
  const meter = $('[data-sv-meter]');
  const meterNum = $('[data-sv-meter-num]');
  const steps = $$('[data-sv-step]');
  if (process && track) {
    onScroll(() => {
      const pinned = innerWidth > 900 && !reducedMotion.matches;
      const rect = process.getBoundingClientRect();
      const range = Math.max(1, process.offsetHeight - innerHeight);
      const progress = pinned ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      const distance = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = pinned ? `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)` : '';
      meter?.style.setProperty('--p', progress.toFixed(3));
      const active = pinned ? Math.min(steps.length - 1, Math.round(progress * (steps.length - 1))) : -1;
      steps.forEach((step, index) => step.classList.toggle('is-active', index === active));
      if (meterNum && active >= 0) meterNum.textContent = String(active + 1).padStart(2, '0');
    });
  }

  /* ---------- Promise: words light up with scroll ---------- */

  const promiseWords = $$('[data-sv-words] span');
  if (promiseWords.length && !reducedMotion.matches) {
    const block = $('[data-sv-words]');
    onScroll(() => {
      const rect = block.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.85 - rect.top) / (rect.height + innerHeight * 0.35)));
      const lit = Math.round(progress * promiseWords.length);
      promiseWords.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
    });
  } else {
    promiseWords.forEach((word) => word.classList.add('is-lit'));
  }

  /* ---------- FAQ ---------- */

  $$('.sv-qa button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.sv-qa');
      const open = !item.classList.contains('is-open');
      $$('.sv-qa').forEach((other) => {
        const on = other === item && open;
        other.classList.toggle('is-open', on);
        $('button', other).setAttribute('aria-expanded', String(on));
      });
    });
  });

  /* ---------- Magnetic CTA ---------- */

  const magnet = $('[data-sv-magnet]');
  if (magnet && finePointer.matches && !reducedMotion.matches) {
    const zone = magnet.closest('.sv-cta');
    zone.addEventListener('pointermove', (event) => {
      const rect = magnet.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const pull = Math.max(0, 1 - Math.hypot(dx, dy) / 280);
      magnet.classList.add('is-tracking');
      magnet.style.setProperty('--mx', `${(dx * pull * 0.35).toFixed(1)}px`);
      magnet.style.setProperty('--my', `${(dy * pull * 0.35).toFixed(1)}px`);
    });
    zone.addEventListener('pointerleave', () => {
      magnet.classList.remove('is-tracking');
      magnet.style.setProperty('--mx', '0px');
      magnet.style.setProperty('--my', '0px');
    });
  }

  /* ---------- Restore ---------- */

  if (state.goal && words.goal) {
    $('[data-sv-word-text]', words.goal).textContent = data.goals[state.goal].phrase;
    selectOption(words.goal, state.goal);
  }
  if (state.when && words.when) {
    const match = $$('[role="option"]', menuOf(words.when)).find((option) => option.dataset.value === state.when);
    if (match) {
      $('[data-sv-word-text]', words.when).textContent = match.textContent;
      selectOption(words.when, state.when);
    }
  }
  renderAssembly();
  render();
})();
