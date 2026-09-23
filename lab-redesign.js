(() => {
  const page = document.querySelector('.lx-page');
  if (!page) return;

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const store = {
    get: (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ } }
  };
  const svgIcon = (id) => `<svg class="lx-i" aria-hidden="true" focusable="false"><use href="${id}"></use></svg>`;

  /* ---------- Scroll reveals ---------- */

  const revealTargets = $$('[data-lx-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        const target = entry.target;
        target.style.setProperty('--lx-delay', `${Math.min(index, 8) * 70}ms`);
        target.classList.add('is-in');
        observer.unobserve(target);
        setTimeout(() => target.style.removeProperty('--lx-delay'), 1400);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    const fold = innerHeight * 0.94;
    revealTargets.forEach((target) => {
      if (target.getBoundingClientRect().top < fold) target.classList.add('is-in');
      else observer.observe(target);
    });
    page.classList.add('lx-js');
  } else {
    revealTargets.forEach((target) => target.classList.add('is-in'));
  }

  /* ---------- Experiment index (single source for search and surprise) ---------- */

  const categoryLabels = { studio: 'Studio', game: 'Game', file: 'Files', growth: 'Business' };
  const categoryWords = { studio: 'studio studios create', game: 'game games play arcade', file: 'file files document documents convert', growth: 'business web marketing' };
  const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '');
  const words = (value) => value.split(/[^a-z0-9]+/).filter(Boolean);
  const items = $$('[data-lx-item]').map((link) => {
    const entry = link.closest('li');
    const item = {
      url: link.getAttribute('href'),
      name: $('b', link).textContent.trim(),
      desc: $('small', link).textContent.trim(),
      cat: entry?.dataset.cat || '',
      icon: $('.lx-card-icon use', link)?.getAttribute('href') || '#i-sparkle',
      tone: entry ? getComputedStyle(entry).getPropertyValue('--tone').trim() : ''
    };
    item.nameKey = normalize(item.name);
    item.nameWords = words(item.nameKey);
    item.hay = normalize(`${link.dataset.keywords || ''} ${$('.lx-card-meta em', link)?.textContent || ''} ${categoryWords[item.cat] || ''}`);
    item.hayWords = words(item.hay);
    item.descKey = normalize(item.desc);
    return item;
  });

  const iconTile = (item) => {
    const tile = document.createElement('span');
    tile.className = 'lx-result-icon';
    if (item.tone) tile.style.setProperty('--tone', item.tone);
    tile.innerHTML = svgIcon(item.icon);
    return tile;
  };

  /* ---------- Command search ---------- */

  const searchBox = $('[data-lx-search]');
  const input = $('#lx-search-input');
  const panel = $('[data-lx-search-panel]');
  const list = $('#lx-search-results');
  const searchLabel = $('[data-lx-search-label]');

  if (searchBox && input && panel && list) {
    const popular = ['Cube Studio', 'Canvas Studio', 'Growth Diagnostic', 'PDF Merger', 'Image Converter', 'Snake Circuit'];
    const stopWords = new Set(['a', 'an', 'and', 'the', 'my', 'me', 'i', 'to', 'for', 'of', 'with', 'some', 'please', 'want', 'need', 'how', 'do', 'can', 'in', 'on', 'into', 'from', 'this', 'it', 'is']);
    let results = [];
    let active = -1;

    const tokenScore = (item, token) => {
      if (item.nameKey.startsWith(token)) return 100;
      if (item.nameWords.some((word) => word.startsWith(token))) return 80;
      if (item.nameKey.includes(token)) return 60;
      if (item.hayWords.some((word) => word.startsWith(token))) return 45;
      if (token.length > 2 && item.hay.includes(token)) return 30;
      if (token.length > 2 && item.descKey.includes(token)) return 20;
      return 0;
    };

    // Every token has to match somewhere; plurals fall back to their singular ("pdfs" → "pdf").
    const scoreItem = (item, tokens) => {
      let total = 0;
      for (const token of tokens) {
        let score = tokenScore(item, token);
        if (token.length > 3 && token.endsWith('s')) score = Math.max(score, tokenScore(item, token.slice(0, -1)) * 0.9);
        if (!score) return 0;
        total += score;
      }
      return total;
    };

    const highlight = (name, tokens) => {
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      name.replace(/[A-Za-z0-9]+/g, (word, index) => {
        const token = tokens.find((candidate) => word.toLowerCase().startsWith(candidate));
        if (!token) return word;
        fragment.append(name.slice(cursor, index));
        const mark = document.createElement('mark');
        mark.textContent = word.slice(0, token.length);
        fragment.append(mark);
        cursor = index + token.length;
        return word;
      });
      fragment.append(name.slice(cursor));
      return fragment;
    };

    const setActive = (index) => {
      active = index;
      $$('[role="option"]', list).forEach((option, optionIndex) => option.setAttribute('aria-selected', String(optionIndex === index)));
      const current = list.children[index];
      if (current?.id) {
        input.setAttribute('aria-activedescendant', current.id);
        current.scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    const renderResults = () => {
      const query = input.value.trim();
      const tokens = words(normalize(query)).filter((token) => !stopWords.has(token));
      if (!tokens.length) {
        results = popular.map((name) => items.find((item) => item.name === name)).filter(Boolean);
        searchLabel.textContent = 'Popular right now';
      } else {
        const matches = items
          .map((item) => ({ item, score: scoreItem(item, tokens) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
        results = matches.slice(0, 7).map((entry) => entry.item);
        if (!matches.length) searchLabel.textContent = 'No matches yet';
        else if (matches.length > results.length) searchLabel.textContent = `Top ${results.length} of ${matches.length} matches`;
        else searchLabel.textContent = `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;
      }

      list.replaceChildren(...results.map((item, index) => {
        const option = document.createElement('li');
        option.id = `lx-option-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const link = document.createElement('a');
        link.href = item.url;
        link.tabIndex = -1;
        const text = document.createElement('span');
        const title = document.createElement('b');
        title.append(highlight(item.name, tokens));
        const description = document.createElement('small');
        description.textContent = item.desc;
        text.append(title, description);
        const category = document.createElement('em');
        category.textContent = categoryLabels[item.cat] || '';
        link.append(iconTile(item), text, category);
        option.append(link);
        option.addEventListener('pointermove', () => { if (active !== index) setActive(index); });
        return option;
      }));

      if (!results.length) {
        const empty = document.createElement('li');
        empty.className = 'lx-search-empty';
        empty.setAttribute('role', 'presentation');
        const strong = document.createElement('b');
        strong.textContent = `“${query}”`;
        const idea = document.createElement('a');
        idea.href = '/contact/';
        idea.textContent = 'suggest it for the Lab';
        empty.append('Nothing called ', strong, ' yet. Try “PDF”, “image” or “game”, or ', idea, '.');
        list.append(empty);
      }
      setActive(tokens.length && results.length ? 0 : -1);
    };

    const openPanel = () => {
      if (panel.hidden) {
        panel.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      }
      renderResults();
    };

    const closePanel = () => {
      panel.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    };

    input.addEventListener('focus', openPanel);
    input.addEventListener('input', openPanel);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (panel.hidden) openPanel();
        if (!results.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive(active < 0 ? (step > 0 ? 0 : results.length - 1) : (active + step + results.length) % results.length);
      } else if (event.key === 'Enter') {
        const target = results[active] || (input.value.trim() ? results[0] : null);
        if (target) {
          event.preventDefault();
          location.assign(target.url);
        }
      } else if (event.key === 'Escape') {
        if (!panel.hidden) {
          event.preventDefault();
          closePanel();
        }
      } else if (event.key === 'Tab') {
        closePanel();
      }
    });

    // Keep focus in the field while a result is clicked, so the panel stays open for the click.
    panel.addEventListener('mousedown', (event) => event.preventDefault());
    document.addEventListener('pointerdown', (event) => {
      if (!panel.hidden && !searchBox.contains(event.target)) closePanel();
    });

    document.addEventListener('keydown', (event) => {
      const typing = event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]');
      const slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
      const commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!slash && !commandK) return;
      event.preventDefault();
      input.focus();
      input.select();
    });
  }

  /* ---------- Surprise me ---------- */

  const surpriseButton = $('[data-lx-surprise]');
  const surpriseLabel = $('[data-lx-surprise-label]');
  const surpriseBox = $('[data-lx-surprise-result]');
  const surpriseStatus = $('[data-lx-surprise-status]');

  if (surpriseButton && surpriseBox && items.length) {
    let rolling = false;
    let lastPick = null;
    let card = null;

    const pick = () => {
      let choice;
      do { choice = items[Math.floor(Math.random() * items.length)]; } while (items.length > 1 && choice === lastPick);
      return choice;
    };

    const showCard = (item, finished) => {
      if (!card) {
        card = document.createElement('div');
        card.className = 'lx-surprise-card';
        surpriseBox.replaceChildren(card);
      }
      const text = document.createElement('span');
      const title = document.createElement('b');
      title.textContent = item.name;
      const description = document.createElement('small');
      description.textContent = item.desc;
      text.append(title, description);
      const go = document.createElement('a');
      go.className = 'lx-go';
      go.href = item.url;
      go.innerHTML = `Let’s go ${svgIcon('#i-arrow')}`;
      if (!finished) go.tabIndex = -1;
      card.classList.toggle('is-rolling', !finished);
      card.replaceChildren(iconTile(item), text, go);
    };

    surpriseButton.addEventListener('click', () => {
      if (rolling) return;
      const finalPick = pick();
      lastPick = finalPick;
      const finish = () => {
        showCard(finalPick, true);
        rolling = false;
        surpriseButton.classList.remove('is-rolling');
        surpriseLabel.textContent = 'Roll again';
        if (surpriseStatus) surpriseStatus.textContent = `Surprise pick: ${finalPick.name}. ${finalPick.desc}`;
      };
      if (reducedMotion.matches) { finish(); return; }
      rolling = true;
      surpriseButton.classList.add('is-rolling');
      let tick = 0;
      const spin = () => {
        tick += 1;
        if (tick >= 12) { finish(); return; }
        showCard(items[Math.floor(Math.random() * items.length)], false);
        setTimeout(spin, 42 + tick * tick * 1.5);
      };
      spin();
    });
  }

  /* ---------- Shared cube maths (hero cube and scanner demo) ---------- */

  const STICKER_COLOURS = { R: '#e52232', L: '#ff7200', U: '#ffffff', D: '#ffe600', F: '#00a957', B: '#1464ed' };
  const FACES = [
    { key: 'R', normal: [1, 0, 0], rotate: 'rotateY(90deg)' },
    { key: 'L', normal: [-1, 0, 0], rotate: 'rotateY(-90deg)' },
    { key: 'U', normal: [0, -1, 0], rotate: 'rotateX(90deg)' },
    { key: 'D', normal: [0, 1, 0], rotate: 'rotateX(-90deg)' },
    { key: 'F', normal: [0, 0, 1], rotate: 'rotateY(0deg)' },
    { key: 'B', normal: [0, 0, -1], rotate: 'rotateY(180deg)' }
  ];
  // Screen axes: x right, y down, z towards the viewer. Angles match CSS rotateX/Y/Z.
  const MOVES = {
    U: { axis: 1, layer: -1, angle: -90 },
    D: { axis: 1, layer: 1, angle: 90 },
    R: { axis: 0, layer: 1, angle: 90 },
    L: { axis: 0, layer: -1, angle: -90 },
    F: { axis: 2, layer: 1, angle: 90 },
    B: { axis: 2, layer: -1, angle: -90 }
  };
  const identity = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const rotation = (axis, angle) => {
    const c = Math.round(Math.cos(angle * Math.PI / 180));
    const s = Math.round(Math.sin(angle * Math.PI / 180));
    if (axis === 0) return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (axis === 1) return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  };
  const multiply = (a, b) => a.map((row) => [0, 1, 2].map((column) => row[0] * b[0][column] + row[1] * b[1][column] + row[2] * b[2][column]));
  const transform = (matrix, vector) => matrix.map((row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const inverse = (move) => (move.endsWith("'") ? move[0] : `${move}'`);
  const moveAngle = (move) => (move.endsWith("'") ? -MOVES[move[0]].angle : MOVES[move[0]].angle);
  const randomSequence = (length) => {
    const faces = Object.keys(MOVES);
    const sequence = [];
    let previous = '';
    while (sequence.length < length) {
      const face = faces[Math.floor(Math.random() * faces.length)];
      if (face === previous) continue;
      previous = face;
      sequence.push(Math.random() < 0.5 ? face : `${face}'`);
    }
    return sequence;
  };
  const eachCubie = (callback) => {
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          if (x || y || z) callback([x, y, z]);
        }
      }
    }
  };
  const turnModel = (cubies, move) => {
    const { axis, layer } = MOVES[move[0]];
    const matrix = rotation(axis, moveAngle(move));
    const members = cubies.filter((cubie) => cubie.pos[axis] === layer);
    members.forEach((cubie) => {
      cubie.pos = transform(matrix, cubie.pos);
      cubie.rot = multiply(matrix, cubie.rot);
    });
    return members;
  };

  /* ---------- Hero: interactive cube specimen ---------- */

  const specimen = $('[data-lx-specimen]');
  const cubeElement = $('[data-lx-cube]');
  const cubeStage = $('[data-lx-cube-stage]');

  if (specimen && cubeElement && cubeStage) {
    const stageBox = $('.lx-stage', specimen);
    const ticker = $('[data-lx-moves]', specimen);
    const hint = $('[data-lx-cube-hint]', specimen);
    const scrambleButton = $('[data-lx-scramble]', specimen);
    const solveButton = $('[data-lx-solve]', specimen);
    const cubeStatus = $('[data-lx-cube-status]', specimen);
    const cubies = [];
    const history = [];
    let recent = [];
    let mode = 'idle';
    let pending = 0;
    let queue = Promise.resolve();

    const matrixCss = (m) => `matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)`;
    const place = (cubie, turn = '') => {
      const [x, y, z] = cubie.pos;
      cubie.el.style.transform = `${turn} translate3d(calc(var(--step) * ${x}), calc(var(--step) * ${y}), calc(var(--step) * ${z})) ${matrixCss(cubie.rot)}`;
    };

    const fragment = document.createDocumentFragment();
    eachCubie((home) => {
      const el = document.createElement('div');
      el.className = 'lx-cubie';
      FACES.forEach((face) => {
        const side = document.createElement('i');
        side.className = 'lx-face';
        side.style.setProperty('--r', face.rotate);
        if (dot(home, face.normal) === 1) {
          side.classList.add('is-sticker');
          side.style.setProperty('--c', STICKER_COLOURS[face.key]);
        }
        el.append(side);
      });
      const cubie = { el, pos: home, rot: identity() };
      place(cubie);
      cubies.push(cubie);
      fragment.append(el);
    });
    cubeElement.append(fragment);

    const pretty = (move) => move.replace("'", '′');
    const setTicker = (chips) => {
      ticker.replaceChildren(...chips.map(({ text, className }) => {
        const chip = document.createElement('li');
        chip.textContent = text;
        if (className) chip.className = className;
        return chip;
      }));
    };
    const showRecent = () => {
      if (!history.length) setTicker([{ text: 'Solved · 0 moves', className: 'is-note' }]);
      else setTicker(recent.map((move, index) => ({ text: pretty(move), className: index === recent.length - 1 ? 'is-current' : '' })));
    };
    const pushRecent = (move) => {
      recent = [...recent, move].slice(-7);
      setTicker(recent.map((entry, index) => ({ text: pretty(entry), className: index === recent.length - 1 ? 'is-current' : '' })));
    };
    const syncButtons = () => {
      scrambleButton.disabled = mode !== 'idle';
      solveButton.disabled = mode !== 'idle' || (!history.length && !pending);
    };
    const remember = (move) => {
      if (history.length && history[history.length - 1] === inverse(move)) history.pop();
      else history.push(move);
    };

    const animateTurn = (move, duration) => new Promise((resolve) => {
      const { axis, layer } = MOVES[move[0]];
      const angle = moveAngle(move);
      const members = cubies.filter((cubie) => cubie.pos[axis] === layer);
      const axisName = ['X', 'Y', 'Z'][axis];
      const commit = () => {
        turnModel(members, move);
        members.forEach((cubie) => place(cubie));
        resolve();
      };
      if (reducedMotion.matches || duration <= 0) { commit(); return; }
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        members.forEach((cubie) => place(cubie, `rotate${axisName}(${angle * eased}deg)`));
        if (t < 1) requestAnimationFrame(frame);
        else commit();
      };
      requestAnimationFrame(frame);
    });

    const enqueue = (task) => {
      pending += 1;
      queue = queue.then(task).catch(() => {}).then(() => {
        pending -= 1;
        syncButtons();
      });
    };

    const playMoves = (moves, duration) => enqueue(async () => {
      for (const move of moves) {
        pushRecent(move);
        await animateTurn(move, duration);
        remember(move);
      }
      if (!history.length) recent = [];
      showRecent();
    });

    const twist = (move) => {
      if (mode !== 'idle' || pending > 2) return;
      playMoves([move], 210);
      syncButtons();
    };

    const scramble = () => {
      if (mode !== 'idle') return;
      mode = 'scramble';
      syncButtons();
      enqueue(async () => {
        const moves = randomSequence(18);
        recent = [];
        for (const move of moves) {
          pushRecent(move);
          await animateTurn(move, 120);
          remember(move);
        }
        mode = 'idle';
        cubeStatus.textContent = `Scrambled with ${moves.length} moves. Press Solve to watch it unwind.`;
      });
    };

    const solve = () => {
      if (mode !== 'idle' || (!history.length && !pending)) return;
      mode = 'solve';
      syncButtons();
      enqueue(async () => {
        const moves = history.slice().reverse().map(inverse);
        for (let index = 0; index < moves.length; index += 1) {
          const first = Math.max(0, Math.min(index - 2, moves.length - 6));
          setTicker([
            ...moves.slice(first, first + 6).map((move, offset) => ({
              text: pretty(move),
              className: first + offset === index ? 'is-current' : (first + offset < index ? 'is-past' : '')
            })),
            { text: `${index + 1}/${moves.length}`, className: 'is-note' }
          ]);
          await animateTurn(moves[index], 190);
        }
        history.length = 0;
        recent = [];
        mode = 'idle';
        if (moves.length) {
          setTicker([{ text: `✓ Solved in ${moves.length} ${moves.length === 1 ? 'move' : 'moves'}`, className: 'is-done' }]);
          cubeStatus.textContent = `Solved in ${moves.length} moves.`;
          cubeStage.classList.remove('is-solved');
          void cubeStage.offsetWidth;
          cubeStage.classList.add('is-solved');
        } else {
          showRecent();
        }
      });
    };

    scrambleButton.addEventListener('click', scramble);
    solveButton.addEventListener('click', solve);

    // Orbit the whole cube: drag, inertia and a slow idle drift.
    let yaw = -38;
    let pitch = -26;
    let velocityYaw = 0;
    let velocityPitch = 0;
    let lastInteraction = -Infinity;
    let drag = null;
    const applyView = () => { cubeElement.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`; };
    applyView();

    const randomTwist = () => {
      const faces = Object.keys(MOVES);
      const face = faces[Math.floor(Math.random() * faces.length)];
      return Math.random() < 0.5 ? face : `${face}'`;
    };

    cubeStage.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, time: event.timeStamp, moved: false };
      velocityYaw = 0;
      velocityPitch = 0;
      cubeStage.setPointerCapture?.(event.pointerId);
    });
    cubeStage.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
      drag.moved = true;
      cubeStage.classList.add('is-dragging');
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const elapsed = Math.max(8, event.timeStamp - drag.time);
      yaw += dx * 0.45;
      pitch = clamp(pitch - dy * 0.45, -80, 80);
      velocityYaw = (dx * 0.45 / elapsed) * 16;
      velocityPitch = (-dy * 0.45 / elapsed) * 16;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.time = event.timeStamp;
      lastInteraction = performance.now();
      applyView();
    });
    const endDrag = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const tapped = !drag.moved && event.type === 'pointerup';
      if (event.timeStamp - drag.time > 90) { velocityYaw = 0; velocityPitch = 0; }
      drag = null;
      cubeStage.classList.remove('is-dragging');
      lastInteraction = performance.now();
      if (tapped) twist(randomTwist());
    };
    cubeStage.addEventListener('pointerup', endDrag);
    cubeStage.addEventListener('pointercancel', endDrag);

    cubeStage.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const face = event.key.length === 1 ? event.key.toUpperCase() : '';
      if (MOVES[face]) {
        event.preventDefault();
        twist(event.shiftKey ? `${face}'` : face);
        return;
      }
      const nudges = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, 12], ArrowDown: [0, -12] };
      if (!nudges[event.key]) return;
      event.preventDefault();
      yaw += nudges[event.key][0];
      pitch = clamp(pitch + nudges[event.key][1], -80, 80);
      lastInteraction = performance.now();
      applyView();
    });
    const defaultHint = hint?.textContent || '';
    cubeStage.addEventListener('focus', () => {
      if (hint && cubeStage.matches(':focus-visible')) hint.textContent = 'Keys U D L R F B · Shift reverses';
    });
    cubeStage.addEventListener('blur', () => { if (hint) hint.textContent = defaultHint; });

    // Experiments orbiting the specimen.
    const rings = [
      { rx: 440, ry: 150, tilt: -13, speed: 0.15 },
      { rx: 505, ry: 245, tilt: 9, speed: -0.1 }
    ];
    const nodes = $$('.lx-node', specimen).map((el) => ({ el, ring: rings[Number(el.dataset.ring) || 0], offset: Number(el.dataset.offset) || 0 }));
    let orbitClock = 0;
    let orbitPaused = false;
    let stageScale = stageBox.clientWidth / 1120;
    const measure = () => { stageScale = stageBox.clientWidth / 1120; };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stageBox);
    else addEventListener('resize', measure);
    specimen.addEventListener('pointerover', (event) => { orbitPaused = Boolean(event.target.closest?.('.lx-node')); });
    specimen.addEventListener('pointerleave', () => { orbitPaused = false; });

    const placeNodes = () => {
      nodes.forEach((node) => {
        const { rx, ry, tilt, speed } = node.ring;
        const angle = node.offset + orbitClock * speed;
        const ex = rx * Math.cos(angle);
        const ey = ry * Math.sin(angle);
        const radians = tilt * Math.PI / 180;
        const x = 560 + ex * Math.cos(radians) - ey * Math.sin(radians);
        const y = 500 + ex * Math.sin(radians) + ey * Math.cos(radians);
        const depth = (Math.sin(angle) + 1) / 2;
        node.el.style.transform = `translate3d(${(x * stageScale).toFixed(1)}px, ${(y * stageScale).toFixed(1)}px, 0) scale(${(0.82 + depth * 0.18).toFixed(3)})`;
        node.el.style.opacity = (0.5 + depth * 0.5).toFixed(3);
        node.el.classList.toggle('is-front', depth > 0.5);
      });
    };

    let frameId = 0;
    let lastFrame = 0;
    let visible = true;
    const loop = (now) => {
      const elapsed = Math.min(48, now - lastFrame || 16);
      lastFrame = now;
      if (!drag) {
        if (Math.abs(velocityYaw) > 0.02 || Math.abs(velocityPitch) > 0.02) {
          yaw += velocityYaw * elapsed / 16;
          pitch = clamp(pitch + velocityPitch * elapsed / 16, -80, 80);
          const decay = Math.pow(0.93, elapsed / 16);
          velocityYaw *= decay;
          velocityPitch *= decay;
        } else if (!reducedMotion.matches && now - lastInteraction > 2600) {
          yaw += elapsed * 0.009;
          pitch += (-24 - pitch) * 0.015;
        }
        applyView();
      }
      if (!reducedMotion.matches && !orbitPaused) orbitClock += elapsed / 1000;
      placeNodes();
      frameId = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const startLoop = () => {
      if (frameId || !visible || document.hidden) return;
      lastFrame = performance.now();
      frameId = requestAnimationFrame(loop);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        startLoop();
      }).observe(specimen);
    }
    document.addEventListener('visibilitychange', startLoop);
    placeNodes();
    startLoop();

    // A short hello so it is obvious the layers really turn.
    if (!reducedMotion.matches) {
      setTimeout(() => {
        if (mode !== 'idle' || pending || history.length) return;
        playMoves(['R', 'U', "R'", "U'"], 260);
        syncButtons();
      }, 1500);
    }
  }

  /* ---------- Canvas Studio taster ---------- */

  const paper = $('[data-lx-paper]');
  const canvas = $('[data-lx-canvas]');

  if (paper && canvas && canvas.getContext) {
    const context = canvas.getContext('2d');
    const cursor = $('[data-lx-brush-cursor]', paper);
    const colourButtons = $$('[data-color]', paper);
    const sizeButtons = $$('[data-size]', paper);
    const eraserButton = $('[data-lx-eraser]', paper);
    const undoButton = $('[data-lx-undo]', paper);
    const clearButton = $('[data-lx-clear]', paper);
    const saveButton = $('[data-lx-save]', paper);
    const actions = [];
    let strokes = [];
    let current = null;
    let colour = '#17382d';
    let size = 7;
    let erasing = false;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let bounds = null;

    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    // Points are stored relative to the canvas width so a sketch keeps its shape when the tile resizes.
    const drawStroke = (stroke, from = 1) => {
      const points = stroke.points;
      if (!points.length) return;
      context.save();
      context.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
      context.strokeStyle = stroke.colour;
      context.fillStyle = stroke.colour;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (points.length === 1) {
        const point = points[0];
        context.beginPath();
        context.arc(point.x * width, point.y * width, Math.max(0.6, stroke.size * width * point.w / 2), 0, Math.PI * 2);
        context.fill();
      }
      for (let index = Math.max(1, from); index < points.length; index += 1) {
        const previous = points[index - 1];
        const point = points[index];
        const start = index === 1 ? previous : midpoint(points[index - 2], previous);
        const end = midpoint(previous, point);
        context.beginPath();
        context.moveTo(start.x * width, start.y * width);
        context.quadraticCurveTo(previous.x * width, previous.y * width, end.x * width, end.y * width);
        context.lineWidth = Math.max(0.8, stroke.size * width * (previous.w + point.w) / 2);
        context.stroke();
      }
      if (stroke.done && points.length > 1) {
        const last = points[points.length - 1];
        const tail = midpoint(points[points.length - 2], last);
        context.beginPath();
        context.moveTo(tail.x * width, tail.y * width);
        context.lineTo(last.x * width, last.y * width);
        context.lineWidth = Math.max(0.8, stroke.size * width * last.w);
        context.stroke();
      }
      context.restore();
    };

    const redraw = () => {
      context.clearRect(0, 0, width, height);
      strokes.forEach((stroke) => drawStroke(stroke));
      if (current) drawStroke(current);
    };

    const resize = () => {
      const rect = paper.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      ratio = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      redraw();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(paper);
    else addEventListener('resize', resize);
    resize();

    const syncState = () => {
      const hasInk = strokes.length > 0;
      paper.classList.toggle('has-ink', hasInk || Boolean(current));
      undoButton.disabled = !actions.length;
      clearButton.disabled = !hasInk;
      saveButton.disabled = !hasInk;
    };
    const syncTools = () => {
      colourButtons.forEach((button) => button.setAttribute('aria-pressed', String(!erasing && button.dataset.color === colour)));
      sizeButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.size) === size)));
      eraserButton.setAttribute('aria-pressed', String(erasing));
      cursor?.classList.toggle('is-eraser', erasing);
      if (cursor) {
        const diameter = Math.max(6, erasing ? size * 2.2 : size);
        cursor.style.width = `${diameter}px`;
        cursor.style.height = `${diameter}px`;
      }
    };

    const addPoint = (event) => {
      const x = (event.clientX - bounds.left) / width;
      const y = (event.clientY - bounds.top) / width;
      const last = current.points[current.points.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) * width < 0.9) return;
      let weight = 1;
      if (event.pointerType === 'pen' && event.pressure > 0) {
        weight = 0.25 + event.pressure * 1.25;
      } else if (last) {
        const speed = Math.hypot(x - last.x, y - last.y) * width / Math.max(1, event.timeStamp - current.time);
        const target = clamp(1.2 - speed * 0.3, 0.45, 1.15);
        weight = last.w + (target - last.w) * 0.35;
      }
      current.time = event.timeStamp;
      current.points.push({ x, y, w: weight });
    };

    const moveCursor = (event) => {
      if (!cursor || event.pointerType !== 'mouse') return;
      const rect = paper.getBoundingClientRect();
      const diameter = parseFloat(cursor.style.width) || size;
      cursor.style.transform = `translate(${event.clientX - rect.left - diameter / 2}px, ${event.clientY - rect.top - diameter / 2}px)`;
    };

    canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      bounds = canvas.getBoundingClientRect();
      current = { id: event.pointerId, colour, size: (erasing ? size * 2.2 : size) / width, erase: erasing, points: [], time: event.timeStamp };
      addPoint(event);
      drawStroke(current);
      syncState();
    });
    canvas.addEventListener('pointermove', (event) => {
      moveCursor(event);
      if (!current || event.pointerId !== current.id) return;
      const before = current.points.length;
      const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
      (samples.length ? samples : [event]).forEach(addPoint);
      if (current.points.length > before) drawStroke(current, before);
    });
    const finishStroke = (event) => {
      if (!current || event.pointerId !== current.id) return;
      current.done = true;
      strokes.push(current);
      actions.push({ type: 'stroke' });
      current = null;
      redraw();
      syncState();
    };
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);
    canvas.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      paper.classList.add('is-hovering');
      moveCursor(event);
    });
    canvas.addEventListener('pointerleave', () => paper.classList.remove('is-hovering'));

    colourButtons.forEach((button) => button.addEventListener('click', () => {
      colour = button.dataset.color;
      erasing = false;
      syncTools();
    }));
    sizeButtons.forEach((button) => button.addEventListener('click', () => {
      size = Number(button.dataset.size) || 7;
      syncTools();
    }));
    eraserButton.addEventListener('click', () => {
      erasing = !erasing;
      syncTools();
    });
    undoButton.addEventListener('click', () => {
      const action = actions.pop();
      if (!action) return;
      if (action.type === 'stroke') strokes.pop();
      else strokes = action.strokes;
      redraw();
      syncState();
    });
    clearButton.addEventListener('click', () => {
      if (!strokes.length) return;
      actions.push({ type: 'clear', strokes });
      strokes = [];
      redraw();
      syncState();
    });
    saveButton.addEventListener('click', () => {
      const output = document.createElement('canvas');
      output.width = canvas.width;
      output.height = canvas.height;
      const outputContext = output.getContext('2d');
      outputContext.fillStyle = '#fbf8f1';
      outputContext.fillRect(0, 0, output.width, output.height);
      outputContext.drawImage(canvas, 0, 0);
      output.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hisan-lab-sketch.png';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }, 'image/png');
    });
    syncTools();
    syncState();
  }

  /* ---------- Cube Studio scanner demo ---------- */

  const scan = $('[data-lx-scan]');

  if (scan) {
    const phoneFace = $('[data-lx-scan-face]', scan);
    const phoneLabel = $('[data-lx-scan-label]', scan);
    const net = $('[data-lx-net]', scan);
    const steps = $$('[data-lx-scan-steps] li', scan);
    const note = $('[data-lx-scan-note]', scan);
    const order = ['U', 'F', 'R', 'B', 'L', 'D'];
    // How each face looks when held towards the camera: its normal, then the screen's right and down directions.
    const views = {
      U: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, 1] },
      F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, 1, 0] },
      R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, 1, 0] },
      B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, 1, 0] },
      L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, 1, 0] },
      D: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, -1] }
    };

    const scrambledFaces = () => {
      const model = [];
      eachCubie((home) => {
        const stickers = FACES.filter((face) => dot(home, face.normal) === 1).map((face) => ({ normal: face.normal, colour: STICKER_COLOURS[face.key] }));
        model.push({ pos: home, rot: identity(), stickers });
      });
      randomSequence(24).forEach((move) => turnModel(model, move));
      const faces = {};
      Object.entries(views).forEach(([key, view]) => {
        const grid = [];
        model.forEach((cubie) => {
          if (dot(cubie.pos, view.normal) !== 1) return;
          const sticker = cubie.stickers.find((candidate) => dot(transform(cubie.rot, candidate.normal), view.normal) === 1);
          if (sticker) grid[(dot(cubie.pos, view.down) + 1) * 3 + dot(cubie.pos, view.right) + 1] = sticker.colour;
        });
        faces[key] = grid;
      });
      return faces;
    };

    const phoneStickers = Array.from({ length: 9 }, () => document.createElement('i'));
    phoneFace.replaceChildren(...phoneStickers);
    const netFaces = Object.fromEntries(order.map((key) => {
      const face = document.createElement('span');
      face.className = 'lx-net-face';
      face.dataset.face = key;
      face.append(...Array.from({ length: 9 }, () => document.createElement('i')));
      return [key, face];
    }));
    net.replaceChildren(...order.map((key) => netFaces[key]));

    const setStep = (name) => {
      const reached = steps.findIndex((step) => step.dataset.step === name);
      steps.forEach((step, index) => {
        step.classList.toggle('is-on', index === reached);
        step.classList.toggle('is-done', index < reached);
      });
    };
    const fillNetFace = (key, colours) => {
      const face = netFaces[key];
      [...face.children].forEach((sticker, index) => sticker.style.setProperty('--c', colours[index]));
      face.classList.add('is-filled');
    };
    const resetDemo = () => {
      phoneStickers.forEach((sticker) => { sticker.classList.remove('is-locked'); sticker.style.removeProperty('--c'); });
      order.forEach((key) => netFaces[key].classList.remove('is-filled'));
      net.classList.remove('is-checked');
    };

    if (reducedMotion.matches) {
      const faces = scrambledFaces();
      order.forEach((key) => fillNetFace(key, faces[key]));
      faces.D.forEach((colour, index) => { phoneStickers[index].style.setProperty('--c', colour); phoneStickers[index].classList.add('is-locked'); });
      phoneLabel.textContent = 'All 6 faces';
      net.classList.add('is-checked');
      setStep('solve');
      note.textContent = 'Solution ready. Follow it one turn at a time.';
    } else {
      let generation = 0;
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const run = async () => {
        const token = ++generation;
        const alive = () => token === generation;
        while (alive()) {
          const faces = scrambledFaces();
          resetDemo();
          setStep('scan');
          note.textContent = 'Scanning each face…';
          for (let faceIndex = 0; faceIndex < order.length; faceIndex += 1) {
            if (!alive()) return;
            const key = order[faceIndex];
            phoneLabel.textContent = `Face ${faceIndex + 1} of 6`;
            phoneStickers.forEach((sticker) => { sticker.classList.remove('is-locked'); sticker.style.removeProperty('--c'); });
            scan.classList.remove('is-scanning');
            void scan.offsetWidth;
            scan.classList.add('is-scanning');
            await wait(420);
            for (let index = 0; index < 9; index += 1) {
              if (!alive()) return;
              phoneStickers[index].style.setProperty('--c', faces[key][index]);
              phoneStickers[index].classList.add('is-locked');
              await wait(55);
            }
            await wait(300);
            if (!alive()) return;
            fillNetFace(key, faces[key]);
            await wait(320);
          }
          if (!alive()) return;
          phoneLabel.textContent = 'All 6 faces';
          setStep('check');
          net.classList.add('is-checked');
          note.textContent = 'Colours check out. Every piece fits.';
          await wait(1700);
          if (!alive()) return;
          setStep('solve');
          note.textContent = 'Solution ready. Follow it one turn at a time.';
          await wait(2800);
        }
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) run();
          else generation += 1;
        }, { threshold: 0.25 }).observe(scan);
      } else {
        run();
      }
    }
  }

  /* ---------- Reaction Rush taster ---------- */

  const pad = $('[data-lx-react]');

  if (pad) {
    const big = $('[data-lx-react-big]', pad);
    const small = $('[data-lx-react-small]', pad);
    const bestLabel = $('[data-lx-best]');
    const status = $('[data-lx-react-status]');
    let state = 'idle';
    let timer = 0;
    let goAt = 0;
    let lastTrigger = -Infinity;
    let best = Number(store.get('lx-reaction-best')) || 0;

    const showBest = () => { if (bestLabel) bestLabel.textContent = best ? `${best} ms` : '—'; };
    const setState = (next, headline, detail) => {
      state = next;
      pad.dataset.state = next;
      big.textContent = headline;
      small.textContent = detail;
    };
    const verdict = (ms) => {
      if (ms < 180) return 'Lightning fast.';
      if (ms < 230) return 'Seriously sharp.';
      if (ms < 290) return 'Nicely done.';
      if (ms < 380) return 'Solid. Go again?';
      return 'Warming up. Try again.';
    };

    const trigger = (time) => {
      if (time - lastTrigger < 90) return;
      lastTrigger = time;
      if (state === 'wait') {
        clearTimeout(timer);
        setState('early', 'Too soon!', 'Wait for lime before you tap. Tap to try again.');
        if (status) status.textContent = 'Too soon. Press again to retry.';
        return;
      }
      if (state === 'go') {
        clearTimeout(timer);
        const ms = Math.max(1, Math.round(time - goAt));
        const personalBest = !best || ms < best;
        if (personalBest) {
          best = ms;
          store.set('lx-reaction-best', String(ms));
          showBest();
        }
        setState('result', `${ms} ms`, `${personalBest ? 'New personal best! ' : ''}${verdict(ms)} Tap to play again.`);
        if (status) status.textContent = `${ms} milliseconds.${personalBest ? ' New personal best.' : ''}`;
        return;
      }
      setState('wait', 'Wait for lime…', 'Keep your finger ready.');
      if (status) status.textContent = 'Wait for the signal.';
      timer = setTimeout(() => {
        setState('go', 'Tap!', 'Now!');
        goAt = performance.now();
        requestAnimationFrame(() => { goAt = performance.now(); });
        if (status) status.textContent = 'Now!';
        timer = setTimeout(() => {
          setState('missed', 'Missed it!', 'The signal came and went. Tap to try again.');
          if (status) status.textContent = 'Missed the signal. Press again to retry.';
        }, 2500);
      }, 1100 + Math.random() * 2400);
    };

    pad.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      trigger(event.timeStamp);
    });
    pad.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) trigger(event.timeStamp);
    });
    // Assistive technology activates buttons with a synthetic click.
    pad.addEventListener('click', (event) => {
      if (event.detail === 0 && performance.now() - lastTrigger > 300) trigger(performance.now());
    });
    showBest();
  }

  /* ---------- Index filters and card spotlight ---------- */

  const filterButtons = $$('[data-lx-filters] button');
  const gridItems = $$('[data-lx-grid] > li');
  const filterStatus = $('[data-lx-filter-status]');
  const filterNames = { all: 'experiments', studio: 'studios', game: 'games', file: 'file and image tools', growth: 'business and web tools' };

  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    let shown = 0;
    gridItems.forEach((entry) => {
      const match = filter === 'all' || entry.dataset.cat === filter;
      entry.hidden = !match;
      entry.classList.remove('is-entering');
      if (!match) return;
      entry.classList.add('is-in');
      entry.style.setProperty('--lx-delay', `${Math.min(shown, 10) * 35}ms`);
      if (!reducedMotion.matches) {
        void entry.offsetWidth;
        entry.classList.add('is-entering');
      }
      shown += 1;
    });
    if (filterStatus) filterStatus.textContent = `Showing ${shown} ${filterNames[filter] || 'experiments'}.`;
  }));

  page.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;
    const card = event.target.closest('.lx-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });
})();
