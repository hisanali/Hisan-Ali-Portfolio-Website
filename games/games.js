(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeGet = (key, fallback = '') => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };

  const picks = $$('[data-game]');
  const panels = $$('[data-game-panel]');
  const filterButtons = $$('[data-game-filter]');
  const filterCount = $('[data-game-filter-count]');
  const picker = $('.game-picker');
  const pagination = $('[data-game-pagination]');
  const pageStatus = $('[data-game-page-status]');
  const pageHeading = $('[data-game-page-heading]');
  const pageButtons = $$('[data-game-page]');
  const pagePrevious = $('[data-game-page-prev]');
  const pageNext = $('[data-game-page-next]');
  const pageSize = 8;
  const priorityGames = ['draw', 'snake', 'tic', 'connect', 'dots', 'memory', 'flight', 'word', 'pong'];
  let activeFilter = 'all';
  let activePage = 0;

  picks.sort((a, b) => {
    const aRank = priorityGames.indexOf(a.dataset.game);
    const bRank = priorityGames.indexOf(b.dataset.game);
    return (aRank < 0 ? priorityGames.length : aRank) - (bRank < 0 ? priorityGames.length : bRank);
  });
  picks.forEach((pick) => picker?.append(pick));

  const matchesFilter = (pick) => activeFilter === 'all'
    || (activeFilter === 'online' && pick.dataset.online === 'true')
    || pick.dataset.category === activeFilter;

  const renderGamePage = () => {
    const matches = picks.filter(matchesFilter);
    const pageTotal = Math.max(1, Math.ceil(matches.length / pageSize));
    activePage = Math.min(activePage, pageTotal - 1);
    const first = activePage * pageSize;
    const pageGames = new Set(matches.slice(first, first + pageSize));

    picks.forEach((pick) => { pick.hidden = !pageGames.has(pick); });
    if (filterCount) filterCount.textContent = `${matches.length} game${matches.length === 1 ? '' : 's'} · Page ${activePage + 1}/${pageTotal}`;
    if (pagination) {
      pagination.hidden = pageTotal <= 1;
    }
    if (pageHeading) pageHeading.textContent = `Page ${activePage + 1} of ${pageTotal}`;
    if (pageStatus) pageStatus.textContent = activePage === 0 ? `Showing 1–${Math.min(pageSize, matches.length)} of ${matches.length}` : `Showing ${first + 1}–${Math.min(first + pageSize, matches.length)} of ${matches.length}`;
    pageButtons.forEach((button,index)=>{const available=index<pageTotal;const current=index===activePage;button.hidden=!available;button.classList.toggle('is-current',current);button.setAttribute('aria-current',current?'page':'false');});
    if (pagePrevious) pagePrevious.disabled = activePage === 0;
    if (pageNext) pageNext.disabled = activePage >= pageTotal - 1;
  };

  filterButtons.forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.gameFilter;
    activePage = 0;

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderGamePage();
  }));

  const changeGamePage = (direction) => {
    activePage += direction;
    renderGamePage();
    picker?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
  };
  pagePrevious?.addEventListener('click', () => changeGamePage(-1));
  pageNext?.addEventListener('click', () => changeGamePage(1));
  pageButtons.forEach(button=>button.addEventListener('click',()=>{activePage=Number(button.dataset.gamePage)||0;renderGamePage();picker?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}));
  renderGamePage();

  picks.forEach((pick) => pick.addEventListener('click', () => {
    const name = pick.dataset.game;
    picks.forEach((item) => { const active = item === pick; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
    panels.forEach((panel) => { const active = panel.dataset.gamePanel === name; panel.hidden = !active; panel.classList.toggle('is-active', active); });
    const activePanel = $(`[data-game-panel="${name}"]`);
    const activeHeading = activePanel?.querySelector('h3');
    if (activeHeading) {
      activeHeading.tabIndex = -1;
      activeHeading.focus({ preventScroll: true });
    }
    window.requestAnimationFrame(() => {
      activePanel?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }));

  // Dots & Boxes — computer opponent
  const dotsSoloBoard = $('[data-dots-solo-board]');
  const dotsSoloStatus = $('[data-dots-solo-status]');
  const dotsSoloScore = $('[data-dots-score]');
  const dotsSoloReset = $('[data-dots-reset]');
  const dotsBoxEdges = (index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    return [row * 3 + column, (row + 1) * 3 + column, 12 + row * 4 + column, 12 + row * 4 + column + 1];
  };
  const dotsBoxesForEdge = (edge) => Array.from({length: 9}, (_, index) => index)
    .filter((index) => dotsBoxEdges(index).includes(edge));
  let dotsEdges = Array(24).fill('');
  let dotsBoxes = Array(9).fill('');
  let dotsTurn = 'A';
  let dotsOver = false;
  let dotsComputerTimer = 0;

  const dotsScores = () => ({
    A: dotsBoxes.filter((owner) => owner === 'A').length,
    B: dotsBoxes.filter((owner) => owner === 'B').length
  });

  const renderDotsSolo = () => {
    if (!dotsSoloBoard) return;
    const cells = [];
    const canPlay = dotsTurn === 'A' && !dotsOver;
    for (let row = 0; row < 7; row += 1) for (let column = 0; column < 7; column += 1) {
      if (row % 2 === 0 && column % 2 === 0) {
        cells.push('<i class="dots-node" aria-hidden="true"></i>');
      } else if (row % 2 === 0) {
        const index = (row / 2) * 3 + Math.floor(column / 2);
        const owner = dotsEdges[index];
        cells.push(`<button type="button" class="dots-edge is-horizontal${owner ? ` is-${owner.toLowerCase()}` : ''}" data-dots-solo-edge="${index}" aria-label="${owner ? 'Line already drawn' : `Draw horizontal line ${index + 1}`}" ${!canPlay || owner ? 'disabled' : ''}></button>`);
      } else if (column % 2 === 0) {
        const index = 12 + Math.floor(row / 2) * 4 + column / 2;
        const owner = dotsEdges[index];
        cells.push(`<button type="button" class="dots-edge is-vertical${owner ? ` is-${owner.toLowerCase()}` : ''}" data-dots-solo-edge="${index}" aria-label="${owner ? 'Line already drawn' : `Draw vertical line ${index - 11}`}" ${!canPlay || owner ? 'disabled' : ''}></button>`);
      } else {
        const index = Math.floor(row / 2) * 3 + Math.floor(column / 2);
        const owner = dotsBoxes[index];
        cells.push(`<span class="dots-box${owner ? ` is-${owner.toLowerCase()}` : ''}" aria-label="${owner ? `${owner === 'A' ? 'You' : 'Computer'} claimed this box` : 'Unclaimed box'}">${owner === 'A' ? 'Y' : owner === 'B' ? 'C' : ''}</span>`);
      }
    }
    dotsSoloBoard.innerHTML = cells.join('');
    const score = dotsScores();
    if (dotsSoloScore) dotsSoloScore.textContent = `${score.A} — ${score.B}`;
    dotsSoloBoard.querySelectorAll('[data-dots-solo-edge]').forEach((button) => button.addEventListener('click', () => playDotsEdge(Number(button.dataset.dotsSoloEdge), 'A')));
  };

  const claimDotsBoxes = (player) => {
    let claimed = 0;
    dotsBoxes.forEach((owner, index) => {
      if (!owner && dotsBoxEdges(index).every((edge) => dotsEdges[edge])) {
        dotsBoxes[index] = player;
        claimed += 1;
      }
    });
    return claimed;
  };

  const finishDotsIfNeeded = () => {
    if (!dotsEdges.every(Boolean)) return false;
    dotsOver = true;
    const score = dotsScores();
    if (dotsSoloStatus) dotsSoloStatus.textContent = score.A === score.B
      ? `Draw — ${score.A} boxes each.`
      : score.A > score.B ? `You win ${score.A}–${score.B}!` : `Computer wins ${score.B}–${score.A}. Try another board.`;
    return true;
  };

  const chooseDotsComputerEdge = () => {
    const available = dotsEdges.map((owner, index) => owner ? -1 : index).filter((index) => index >= 0);
    const winning = available.filter((edge) => dotsBoxesForEdge(edge).some((box) => !dotsBoxes[box]
      && dotsBoxEdges(box).filter((boxEdge) => dotsEdges[boxEdge]).length === 3));
    if (winning.length) return winning[Math.floor(Math.random() * winning.length)];
    const safe = available.filter((edge) => !dotsBoxesForEdge(edge).some((box) => !dotsBoxes[box]
      && dotsBoxEdges(box).filter((boxEdge) => dotsEdges[boxEdge]).length === 2));
    const pool = safe.length ? safe : available;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const scheduleDotsComputer = () => {
    if (dotsOver) return;
    dotsTurn = 'B';
    if (dotsSoloStatus) dotsSoloStatus.textContent = 'Computer is choosing a line…';
    renderDotsSolo();
    clearTimeout(dotsComputerTimer);
    dotsComputerTimer = window.setTimeout(() => {
      const edge = chooseDotsComputerEdge();
      if (Number.isInteger(edge)) playDotsEdge(edge, 'B');
    }, 520);
  };

  function playDotsEdge(index, player) {
    if (dotsOver || dotsTurn !== player || !Number.isInteger(index) || index < 0 || index >= dotsEdges.length || dotsEdges[index]) return;
    dotsEdges[index] = player;
    const claimed = claimDotsBoxes(player);
    if (finishDotsIfNeeded()) { renderDotsSolo(); return; }
    if (claimed) {
      dotsTurn = player;
      if (dotsSoloStatus) dotsSoloStatus.textContent = player === 'A'
        ? `Box claimed — draw another line.`
        : `Computer claimed ${claimed === 1 ? 'a box' : `${claimed} boxes`} and plays again…`;
      renderDotsSolo();
      if (player === 'B') scheduleDotsComputer();
      return;
    }
    if (player === 'A') scheduleDotsComputer();
    else {
      dotsTurn = 'A';
      if (dotsSoloStatus) dotsSoloStatus.textContent = 'Your turn — draw any line.';
      renderDotsSolo();
    }
  }

  const resetDotsSolo = () => {
    clearTimeout(dotsComputerTimer);
    dotsEdges = Array(24).fill('');
    dotsBoxes = Array(9).fill('');
    dotsTurn = 'A';
    dotsOver = false;
    if (dotsSoloStatus) dotsSoloStatus.textContent = 'Your turn — draw any line.';
    renderDotsSolo();
  };
  dotsSoloReset?.addEventListener('click', resetDotsSolo);
  resetDotsSolo();

  // Reaction Rush
  const reactionTarget = $('[data-reaction-target]');
  const reactionStatus = $('[data-reaction-status]');
  const reactionBest = $('[data-reaction-best]');
  let reactionTimer = 0;
  let reactionStarted = 0;
  let reactionState = 'idle';
  const savedReaction = Number(safeGet('game-reaction-best', '0'));
  reactionBest.textContent = savedReaction ? `${savedReaction} ms` : '—';
  const reactionCopy = (title, note) => { reactionTarget.querySelector('span').textContent = title; reactionTarget.querySelector('small').textContent = note; };
  reactionTarget.addEventListener('click', () => {
    if (reactionState === 'idle' || reactionState === 'done') {
      reactionState = 'waiting'; reactionTarget.className = 'reaction-target is-waiting'; reactionCopy('Wait…', 'Do not tap yet'); reactionStatus.textContent = 'The signal can appear at any moment.';
      reactionTimer = window.setTimeout(() => { reactionState = 'go'; reactionStarted = performance.now(); reactionTarget.className = 'reaction-target is-go'; reactionCopy('Tap now!', 'Go, go, go'); reactionStatus.textContent = 'Signal live.'; }, 1200 + Math.random() * 2400);
      return;
    }
    if (reactionState === 'waiting') {
      clearTimeout(reactionTimer); reactionState = 'done'; reactionTarget.className = 'reaction-target'; reactionCopy('Too early', 'Tap to try again'); reactionStatus.textContent = 'Patience matters. The round has reset.'; return;
    }
    if (reactionState === 'go') {
      const time = Math.round(performance.now() - reactionStarted); reactionState = 'done'; reactionTarget.className = 'reaction-target'; reactionCopy(`${time} ms`, 'Tap for another round'); reactionStatus.textContent = time < 220 ? 'Excellent reflexes.' : time < 320 ? 'Sharp response.' : 'Good start—try to beat it.';
      const best = Number(safeGet('game-reaction-best', '0')); if (!best || time < best) { safeSet('game-reaction-best', time); reactionBest.textContent = `${time} ms`; }
    }
  });

  // Memory Match
  const memoryBoard = $('[data-memory-board]');
  const memoryMoves = $('[data-memory-moves]');
  const memorySymbols = ['A','B','C','D','E','F','G','H'];
  let memoryOpen = [];
  let memoryLocked = false;
  let matchedPairs = 0;
  let moveCount = 0;
  const shuffle = (array) => array.map(value => ({ value, sort: Math.random() })).sort((a,b) => a.sort-b.sort).map(item => item.value);
  const resetMemory = () => {
    memoryOpen = []; memoryLocked = false; matchedPairs = 0; moveCount = 0; memoryMoves.textContent = '0'; memoryBoard.replaceChildren();
    shuffle([...memorySymbols,...memorySymbols]).forEach((symbol,index) => {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'memory-card'; card.dataset.symbol = symbol; card.setAttribute('aria-label', `Hidden card ${index + 1}`); card.textContent = symbol;
      card.addEventListener('click', () => {
        if (memoryLocked || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
        card.classList.add('is-flipped'); card.setAttribute('aria-label', symbol); memoryOpen.push(card);
        if (memoryOpen.length < 2) return;
        moveCount += 1; memoryMoves.textContent = String(moveCount); memoryLocked = true;
        const [first,second] = memoryOpen;
        if (first.dataset.symbol === second.dataset.symbol) { first.classList.add('is-matched'); second.classList.add('is-matched'); memoryOpen = []; memoryLocked = false; matchedPairs += 1; if (matchedPairs === memorySymbols.length) memoryMoves.textContent = `${moveCount} · Won`; }
        else window.setTimeout(() => { first.classList.remove('is-flipped'); second.classList.remove('is-flipped'); first.setAttribute('aria-label','Hidden card'); second.setAttribute('aria-label','Hidden card'); memoryOpen = []; memoryLocked = false; }, 650);
      });
      memoryBoard.append(card);
    });
  };
  $('[data-memory-reset]').addEventListener('click', resetMemory); resetMemory();

  // Tic-Tac-Toe
  const ticBoardEl = $('[data-tic-board]');
  const ticStatus = $('[data-tic-status]');
  const ticDescription = $('[data-tic-description]');
  const ticReset = $('[data-tic-reset]');
  const ticArena = $('.tic-arena');
  const ticLobby = $('[data-tic-online-lobby]');
  const ticRoom = $('[data-tic-online-room]');
  const ticNetworkNote = $('[data-tic-network-note]');
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let ticBoard = Array(9).fill('');
  let ticOver = false;
  let ticMode = 'solo';
  let ticCanPlay = true;
  const winner = (board) => { for (const [a,b,c] of wins) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; return board.every(Boolean) ? 'draw' : ''; };
  const minimax = (board, maximizing) => {
    const result = winner(board); if (result) return result === 'O' ? 10 : result === 'X' ? -10 : 0;
    const scores = []; board.forEach((value,index) => { if (!value) { board[index] = maximizing ? 'O' : 'X'; scores.push(minimax(board,!maximizing)); board[index] = ''; } });
    return maximizing ? Math.max(...scores) : Math.min(...scores);
  };
  const renderTic = () => { $$('.tic-cell',ticBoardEl).forEach((cell,index) => { cell.textContent = ticBoard[index]; cell.className = `tic-cell${ticBoard[index] ? ` is-${ticBoard[index].toLowerCase()}` : ''}`; cell.disabled = ticOver || Boolean(ticBoard[index]) || (ticMode === 'online' && !ticCanPlay); cell.setAttribute('aria-label', ticBoard[index] ? `Cell ${index + 1}: ${ticBoard[index]}` : `Cell ${index + 1}: empty`); }); };
  const finishTic = () => { const result = winner(ticBoard); if (!result) return false; ticOver = true; ticStatus.textContent = result === 'draw' ? 'Draw game' : result === 'X' ? 'You win' : 'Computer wins'; renderTic(); return true; };
  const computerMove = () => {
    if (ticOver || ticMode !== 'solo') return; let bestScore = -Infinity, bestMove = -1;
    ticBoard.forEach((value,index) => { if (!value) { ticBoard[index] = 'O'; const score = minimax(ticBoard,false); ticBoard[index] = ''; if (score > bestScore) { bestScore = score; bestMove = index; } } });
    if (bestMove >= 0) ticBoard[bestMove] = 'O'; if (!finishTic()) { ticStatus.textContent = 'Your turn'; renderTic(); }
  };
  const playTicCell = (index) => {
    if (ticOver || ticBoard[index]) return;
    if (ticMode === 'online') { window.dispatchEvent(new CustomEvent('tic:online-cell',{detail:{index}})); return; }
    ticBoard[index]='X';renderTic();if(!finishTic()){ticStatus.textContent='Computer thinking…';setTimeout(computerMove,260);}
  };
  const buildTicBoard = () => { ticBoardEl.replaceChildren();Array.from({length:9},(_,index)=>{const cell=document.createElement('button');cell.type='button';cell.className='tic-cell';cell.addEventListener('click',()=>playTicCell(index));ticBoardEl.append(cell);}); };
  const resetTic = () => { ticBoard=Array(9).fill('');ticOver=false;ticCanPlay=true;ticStatus.textContent='Your turn';renderTic(); };
  const setTicMode = (mode) => {
    ticMode=mode;$$('[data-tic-mode]').forEach(button=>button.classList.toggle('is-active',button.dataset.ticMode===mode));
    if(mode==='solo'){
      ticDescription.textContent='You are X. The computer plays O and looks for the strongest move.';ticLobby.hidden=true;ticRoom.hidden=true;ticNetworkNote.hidden=true;ticArena.classList.remove('is-online-lobby');ticReset.textContent='Play again';resetTic();window.dispatchEvent(new CustomEvent('tic:online-close'));
    }else{
      ticDescription.textContent='Create a private room and play live from separate phones or computers.';ticBoard=Array(9).fill('');ticOver=false;ticCanPlay=false;ticStatus.textContent='Create or join a room';ticReset.textContent='Request rematch';renderTic();window.dispatchEvent(new CustomEvent('tic:online-open'));
    }
  };
  buildTicBoard();resetTic();
  $$('[data-tic-mode]').forEach(button=>button.addEventListener('click',()=>setTicMode(button.dataset.ticMode)));
  ticReset.addEventListener('click',()=>{if(ticMode==='online')window.dispatchEvent(new CustomEvent('tic:online-rematch'));else resetTic();});
  window.ticGameBridge={
    applyOnlineState({board,status,canPlay,over=false,resetLabel='Request rematch'}){if(ticMode!=='online')return;ticBoard=Array.isArray(board)&&board.length===9?[...board]:Array(9).fill('');ticStatus.textContent=status||'Waiting for the room';ticCanPlay=Boolean(canPlay);ticOver=Boolean(over);ticReset.textContent=resetLabel;renderTic();},
    showOnlineLobby(){if(ticMode!=='online')return;ticLobby.hidden=false;ticRoom.hidden=true;ticNetworkNote.hidden=true;ticArena.classList.add('is-online-lobby');},
    showOnlineRoom(){if(ticMode!=='online')return;ticLobby.hidden=true;ticRoom.hidden=false;ticNetworkNote.hidden=false;ticArena.classList.remove('is-online-lobby');},
    getMode(){return ticMode;},
    openOnline(){setTicMode('online');}
  };

  // Connect Four
  const connectBoardEl = $('[data-connect-board]');
  const connectStatus = $('[data-connect-status]');
  let connectBoard = Array(42).fill('');
  let connectOver = false;
  let connectLocked = false;
  const connectIndex = (row, column) => row * 7 + column;
  const connectWinner = (board) => {
    const directions = [[0,1],[1,0],[1,1],[1,-1]];
    for (let row = 0; row < 6; row += 1) for (let column = 0; column < 7; column += 1) {
      const player = board[connectIndex(row,column)]; if (!player) continue;
      for (const [dr,dc] of directions) if ([1,2,3].every((step) => {
        const nextRow=row+dr*step,nextColumn=column+dc*step;
        return nextRow>=0&&nextRow<6&&nextColumn>=0&&nextColumn<7&&board[connectIndex(nextRow,nextColumn)]===player;
      })) return player;
    }
    return board.every(Boolean) ? 'draw' : '';
  };
  const renderConnect = () => {
    $$('.connect-cell',connectBoardEl).forEach((cell,index) => { const value=connectBoard[index]; cell.className=`connect-cell${value ? ` is-${value.toLowerCase()}` : ''}`; cell.setAttribute('aria-label',value ? `${value === 'P' ? 'Your' : 'Computer'} piece` : `Empty circle, row ${Math.floor(index/7)+1}, column ${index%7+1}`);cell.disabled=connectOver||connectLocked||Boolean(value); });
  };
  const finishConnect = () => { const result=connectWinner(connectBoard); if(!result)return false;connectOver=true;connectStatus.textContent=result==='draw'?'Board draw':result==='P'?'You connected four!':'Computer connected four';renderConnect();return true; };
  const chooseConnectMove = () => {
    const open=connectBoard.map((value,index)=>value?null:index).filter(index=>index!==null);
    for(const player of ['C','P']) for(const index of open){const test=[...connectBoard];test[index]=player;if(connectWinner(test)===player)return index;}
    const preferred=[17,18,24,23,16,25,10,11,12,31,30,32].filter(index=>open.includes(index));const choices=preferred.length?preferred:open;return choices[Math.floor(Math.random()*choices.length)];
  };
  const computerConnect = () => { if(connectOver)return;const index=chooseConnectMove();if(index===undefined)return;connectBoard[index]='C';connectLocked=false;if(!finishConnect()){connectStatus.textContent='Choose any circle';renderConnect();} };
  const playConnect = (index) => { if(connectOver||connectLocked||connectBoard[index])return;connectBoard[index]='P';connectLocked=true;renderConnect();if(!finishConnect()){connectStatus.textContent='Computer is choosing…';setTimeout(computerConnect,320);} };
  const resetConnect = () => {connectBoard=Array(42).fill('');connectOver=false;connectLocked=false;connectStatus.textContent='Choose any circle';connectBoardEl.replaceChildren();Array.from({length:42},(_,index)=>{const cell=document.createElement('button');cell.type='button';cell.className='connect-cell';cell.addEventListener('click',()=>playConnect(index));connectBoardEl.append(cell);});renderConnect();};
  $('[data-connect-reset]').addEventListener('click',resetConnect);resetConnect();

  // Snake Circuit
  const snakeCanvas = $('[data-snake-canvas]');
  const snakeCtx = snakeCanvas.getContext('2d');
  const snakeScore = $('[data-snake-score]');
  const snakeStatus = $('[data-snake-status]');
  let snake = [];
  let snakeFood = {x:12,y:9};
  let snakeDirection = {x:1,y:0};
  let snakeNext = {x:1,y:0};
  let snakeLoop = 0;
  let snakeRunning = false;
  const snakeCell = 20;
  const placeFood = () => { do { snakeFood={x:Math.floor(Math.random()*18),y:Math.floor(Math.random()*18)}; } while(snake.some(part=>part.x===snakeFood.x&&part.y===snakeFood.y)); };
  const drawSnake = () => {
    snakeCtx.fillStyle='#10261f'; snakeCtx.fillRect(0,0,360,360); snakeCtx.strokeStyle='rgba(223,255,99,.055)'; snakeCtx.lineWidth=1;
    for(let i=0;i<=360;i+=20){snakeCtx.beginPath();snakeCtx.moveTo(i,0);snakeCtx.lineTo(i,360);snakeCtx.stroke();snakeCtx.beginPath();snakeCtx.moveTo(0,i);snakeCtx.lineTo(360,i);snakeCtx.stroke();}
    snakeCtx.fillStyle='#f47a52'; snakeCtx.beginPath(); snakeCtx.arc(snakeFood.x*snakeCell+10,snakeFood.y*snakeCell+10,7,0,Math.PI*2); snakeCtx.fill();
    snake.forEach((part,index)=>{snakeCtx.fillStyle=index===0?'#dfff63':'#75a48d';snakeCtx.fillRect(part.x*snakeCell+2,part.y*snakeCell+2,16,16);});
  };
  const endSnake = () => { clearInterval(snakeLoop); snakeRunning=false; snakeStatus.textContent=`Circuit ended with ${snake.length-3} points. Press start to try again.`; };
  const snakeStep = () => { snakeDirection=snakeNext;const head={x:snake[0].x+snakeDirection.x,y:snake[0].y+snakeDirection.y};if(head.x<0||head.x>=18||head.y<0||head.y>=18||snake.some(p=>p.x===head.x&&p.y===head.y)){endSnake();return;}snake.unshift(head);if(head.x===snakeFood.x&&head.y===snakeFood.y){snakeScore.textContent=String(snake.length-3);placeFood();}else snake.pop();drawSnake(); };
  const startSnake = () => { clearInterval(snakeLoop);snake=[{x:6,y:9},{x:5,y:9},{x:4,y:9}];snakeDirection={x:1,y:0};snakeNext={x:1,y:0};placeFood();snakeScore.textContent='0';snakeStatus.textContent='Circuit live.';snakeRunning=true;drawSnake();snakeLoop=setInterval(snakeStep,125); };
  const setDirection = (name) => { const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},next=map[name];if(!next||next.x===-snakeDirection.x&&next.y===-snakeDirection.y)return;snakeNext=next; };
  $('[data-snake-start]').addEventListener('click',startSnake);$$('[data-direction]').forEach(button=>button.addEventListener('click',()=>setDirection(button.dataset.direction)));
  document.addEventListener('keydown',(event)=>{const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(!map[event.key]||$('[data-game="snake"]')?.getAttribute('aria-selected')!=='true')return;event.preventDefault();setDirection(map[event.key]);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&snakeRunning){clearInterval(snakeLoop);snakeRunning=false;snakeStatus.textContent='Paused. Press start to continue with a new run.';}}); snake=[{x:6,y:9},{x:5,y:9},{x:4,y:9}];drawSnake();

  // Stack Drop
  const stackCanvas = $('[data-stack-canvas]');
  const stackCtx = stackCanvas.getContext('2d');
  const stackScore = $('[data-stack-score]');
  const stackStatus = $('[data-stack-status]');
  const stackAction = $('[data-stack-action]');
  let stackBlocks = [];
  let stackMoving = null;
  let stackRunning = false;
  let stackFrame = 0;
  let stackLastTime = 0;
  const drawStack = () => {
    stackCtx.fillStyle = '#10261f'; stackCtx.fillRect(0,0,540,460);
    stackCtx.strokeStyle = 'rgba(223,255,99,.055)'; stackCtx.lineWidth = 1;
    for(let x=0;x<=540;x+=30){stackCtx.beginPath();stackCtx.moveTo(x,0);stackCtx.lineTo(x,460);stackCtx.stroke();}
    for(let y=10;y<=460;y+=30){stackCtx.beginPath();stackCtx.moveTo(0,y);stackCtx.lineTo(540,y);stackCtx.stroke();}
    stackBlocks.forEach((block,index)=>{stackCtx.fillStyle=index%2?'#f47a52':'#dfff63';stackCtx.fillRect(block.x,block.y,block.w,22);stackCtx.fillStyle='rgba(23,56,45,.16)';stackCtx.fillRect(block.x,block.y+18,block.w,4);});
    if(stackMoving){stackCtx.fillStyle=stackBlocks.length%2?'#f47a52':'#dfff63';stackCtx.fillRect(stackMoving.x,stackMoving.y,stackMoving.w,22);}
  };
  const endStack = () => { stackRunning=false;cancelAnimationFrame(stackFrame);stackMoving=null;stackAction.textContent='Play again';stackStatus.textContent=`Tower complete — ${stackBlocks.length-1} blocks high.`;drawStack(); };
  const stackLoop = (time) => { if(!stackRunning)return;const dt=Math.min(32,time-stackLastTime||16);stackLastTime=time;stackMoving.x+=stackMoving.vx*dt/16;if(stackMoving.x<=0){stackMoving.x=0;stackMoving.vx=Math.abs(stackMoving.vx);}if(stackMoving.x+stackMoving.w>=540){stackMoving.x=540-stackMoving.w;stackMoving.vx=-Math.abs(stackMoving.vx);}drawStack();stackFrame=requestAnimationFrame(stackLoop); };
  const startStack = () => { cancelAnimationFrame(stackFrame);stackBlocks=[{x:160,y:424,w:220}];stackMoving={x:0,y:400,w:220,vx:3};stackRunning=true;stackLastTime=0;stackScore.textContent='0';stackStatus.textContent='Tap when the moving block aligns with the tower.';stackAction.textContent='Drop block';stackFrame=requestAnimationFrame(stackLoop); };
  const dropStack = () => { if(!stackRunning){startStack();return;}const last=stackBlocks[stackBlocks.length-1],left=Math.max(last.x,stackMoving.x),right=Math.min(last.x+last.w,stackMoving.x+stackMoving.w),width=right-left;if(width<7){endStack();return;}stackBlocks.push({x:left,y:stackMoving.y,w:width});const score=stackBlocks.length-1;stackScore.textContent=String(score);if(stackMoving.y<155)stackBlocks.forEach(block=>{block.y+=24;});const direction=score%2?-1:1;stackMoving={x:direction>0?0:540-width,y:stackBlocks[stackBlocks.length-1].y-24,w:width,vx:direction*(3+Math.min(4,score*.16))};stackStatus.textContent=width>last.w*.88?'Clean drop. Keep going.':'Narrower now — stay precise.'; };
  stackAction.addEventListener('click',dropStack);stackCanvas.addEventListener('pointerdown',dropStack);startStack();stackRunning=false;cancelAnimationFrame(stackFrame);stackMoving=null;stackAction.textContent='Start stacking';drawStack();

  // Signal Flight
  const flightCanvas=$('[data-flight-canvas]'),flightCtx=flightCanvas.getContext('2d'),flightScore=$('[data-flight-score]'),flightStatus=$('[data-flight-status]'),flightAction=$('[data-flight-action]');
  let flightRunning=false,flightFrame=0,flightLast=0,flightY=230,flightVelocity=0,flightPoints=0,flightGates=[];
  const makeFlightGate=(x)=>({x,gap:125+Math.random()*210,size:145,passed:false});
  const drawFlight=()=>{flightCtx.fillStyle='#10261f';flightCtx.fillRect(0,0,540,460);flightCtx.strokeStyle='rgba(223,255,99,.055)';flightCtx.lineWidth=1;for(let x=0;x<=540;x+=30){flightCtx.beginPath();flightCtx.moveTo(x,0);flightCtx.lineTo(x,460);flightCtx.stroke();}for(let y=10;y<=460;y+=30){flightCtx.beginPath();flightCtx.moveTo(0,y);flightCtx.lineTo(540,y);flightCtx.stroke();}flightGates.forEach(gate=>{const top=Math.max(0,gate.gap-gate.size/2),bottom=Math.min(460,gate.gap+gate.size/2);flightCtx.fillStyle='#f47a52';flightCtx.fillRect(gate.x,0,62,top);flightCtx.fillRect(gate.x,bottom,62,460-bottom);flightCtx.fillStyle='#dfff63';flightCtx.fillRect(gate.x-3,Math.max(0,top-7),68,7);flightCtx.fillRect(gate.x-3,bottom,68,7);});flightCtx.fillStyle='#dfff63';flightCtx.beginPath();flightCtx.arc(135,flightY,12,0,Math.PI*2);flightCtx.fill();flightCtx.strokeStyle='rgba(223,255,99,.2)';flightCtx.lineWidth=8;flightCtx.beginPath();flightCtx.arc(135,flightY,19,0,Math.PI*2);flightCtx.stroke();flightCtx.fillStyle='rgba(255,255,255,.68)';flightCtx.font='800 10px Manrope';flightCtx.textAlign='center';flightCtx.fillText(flightRunning?'TAP TO LIFT':'READY',270,32);};
  const endFlight=()=>{flightRunning=false;cancelAnimationFrame(flightFrame);flightAction.textContent='Fly again';flightStatus.textContent=`Flight ended after ${flightPoints} gate${flightPoints===1?'':'s'}. Tap to try again.`;drawFlight();};
  const flightLoop=(time)=>{if(!flightRunning)return;const scale=Math.min(2,(time-flightLast||16)/16);flightLast=time;flightVelocity+=.29*scale;flightY+=flightVelocity*scale;const speed=2.7+Math.min(2.1,flightPoints*.12);flightGates.forEach(gate=>{gate.x-=speed*scale;if(!gate.passed&&gate.x+62<123){gate.passed=true;flightPoints+=1;flightScore.textContent=String(flightPoints);flightStatus.textContent=flightPoints%5===0?'The gates are moving faster.':'Clean pass.';}});if(flightGates[0]?.x<-80){flightGates.shift();const lastX=flightGates[flightGates.length-1]?.x||540;flightGates.push(makeFlightGate(lastX+260));}const hitGate=flightGates.some(gate=>135+12>gate.x&&135-12<gate.x+62&&(flightY-12<gate.gap-gate.size/2||flightY+12>gate.gap+gate.size/2));if(flightY<12||flightY>448||hitGate){endFlight();return;}drawFlight();flightFrame=requestAnimationFrame(flightLoop);};
  const startFlight=()=>{cancelAnimationFrame(flightFrame);flightY=230;flightVelocity=-3.8;flightPoints=0;flightGates=[makeFlightGate(560),makeFlightGate(820),makeFlightGate(1080)];flightScore.textContent='0';flightStatus.textContent='Flight live. Tap to stay inside the gaps.';flightAction.textContent='Lift signal';flightRunning=true;flightLast=0;flightFrame=requestAnimationFrame(flightLoop);};
  const liftFlight=()=>{if(!flightRunning){startFlight();return;}flightVelocity=-5.35;flightStatus.textContent='Signal lifted.';};
  flightAction.addEventListener('click',liftFlight);flightCanvas.addEventListener('pointerdown',liftFlight);drawFlight();

  // Mini Pong
  const pongCanvas=$('[data-pong-canvas]'),pongCtx=pongCanvas.getContext('2d'),pongScore=$('[data-pong-score]'),pongStatus=$('[data-pong-status]'),pongAction=$('[data-pong-action]');
  let pongRunning=false,pongFrame=0,pongLast=0,pongPaddle=210,pongRally=0,pongBall={x:270,y:210,vx:3.2,vy:-3.6};
  const drawPong=()=>{pongCtx.fillStyle='#10261f';pongCtx.fillRect(0,0,540,460);pongCtx.strokeStyle='rgba(223,255,99,.08)';pongCtx.setLineDash([7,10]);pongCtx.beginPath();pongCtx.moveTo(270,0);pongCtx.lineTo(270,460);pongCtx.stroke();pongCtx.setLineDash([]);pongCtx.fillStyle='#dfff63';pongCtx.fillRect(pongPaddle,425,120,14);pongCtx.fillStyle='#f47a52';pongCtx.beginPath();pongCtx.arc(pongBall.x,pongBall.y,9,0,Math.PI*2);pongCtx.fill();pongCtx.fillStyle='rgba(255,255,255,.7)';pongCtx.font='800 10px Manrope';pongCtx.textAlign='center';pongCtx.fillText(pongRunning?'RALLY LIVE':'READY',270,34);};
  const endPong=()=>{pongRunning=false;cancelAnimationFrame(pongFrame);pongAction.textContent='Play again';pongStatus.textContent=`Rally ended at ${pongRally}. Keep the paddle beneath the ball.`;drawPong();};
  const pongLoop=(time)=>{if(!pongRunning)return;const scale=Math.min(2,(time-pongLast||16)/16);pongLast=time;pongBall.x+=pongBall.vx*scale;pongBall.y+=pongBall.vy*scale;if(pongBall.x<10||pongBall.x>530){pongBall.vx*=-1;pongBall.x=Math.max(10,Math.min(530,pongBall.x));}if(pongBall.y<10){pongBall.vy=Math.abs(pongBall.vy);pongBall.y=10;}if(pongBall.vy>0&&pongBall.y>=414&&pongBall.y<=435&&pongBall.x>=pongPaddle-8&&pongBall.x<=pongPaddle+128){pongBall.vy=-Math.abs(pongBall.vy)*1.025;pongBall.vx+=(pongBall.x-(pongPaddle+60))*.025;pongBall.y=413;pongRally+=1;pongScore.textContent=String(pongRally);pongStatus.textContent=pongRally%5===0?'Speed increased. Stay sharp.':'Clean return.';}if(pongBall.y>470){endPong();return;}drawPong();pongFrame=requestAnimationFrame(pongLoop);};
  const startPong=()=>{cancelAnimationFrame(pongFrame);pongPaddle=210;pongRally=0;pongBall={x:270,y:250,vx:(Math.random()>.5?1:-1)*3.1,vy:-3.7};pongScore.textContent='0';pongStatus.textContent='Rally live. Follow the ball.';pongAction.textContent='Restart rally';pongRunning=true;pongLast=0;pongFrame=requestAnimationFrame(pongLoop);};
  const movePongTo=(clientX)=>{const rect=pongCanvas.getBoundingClientRect(),x=(clientX-rect.left)*(pongCanvas.width/rect.width);pongPaddle=Math.max(0,Math.min(420,x-60));drawPong();};
  pongCanvas.addEventListener('pointermove',event=>movePongTo(event.clientX));pongCanvas.addEventListener('pointerdown',event=>{if(!pongRunning)startPong();movePongTo(event.clientX);});pongAction.addEventListener('click',startPong);$$('[data-pong-move]').forEach(button=>button.addEventListener('click',()=>{pongPaddle=Math.max(0,Math.min(420,pongPaddle+(button.dataset.pongMove==='left'?-48:48)));drawPong();}));drawPong();

  // Gravity Flip
  const gravityCanvas=$('[data-gravity-canvas]'),gravityCtx=gravityCanvas.getContext('2d'),gravityScore=$('[data-gravity-score]'),gravityStatus=$('[data-gravity-status]'),gravityAction=$('[data-gravity-action]');
  let gravityRunning=false,gravityFrame=0,gravityLast=0,gravityY=382,gravityTarget=382,gravityPoints=0,gravityObstacles=[];
  const drawGravity=()=>{gravityCtx.fillStyle='#10261f';gravityCtx.fillRect(0,0,540,460);gravityCtx.strokeStyle='rgba(223,255,99,.22)';gravityCtx.beginPath();gravityCtx.moveTo(0,48);gravityCtx.lineTo(540,48);gravityCtx.moveTo(0,412);gravityCtx.lineTo(540,412);gravityCtx.stroke();gravityObstacles.forEach(o=>{gravityCtx.fillStyle='#f47a52';gravityCtx.fillRect(o.x,o.top?48:332,34,80);});gravityCtx.fillStyle='#dfff63';gravityCtx.fillRect(100,gravityY,26,26);gravityCtx.fillStyle='rgba(255,255,255,.68)';gravityCtx.font='800 10px Manrope';gravityCtx.textAlign='center';gravityCtx.fillText(gravityRunning?'TAP TO FLIP':'READY',270,230);};
  const endGravity=()=>{gravityRunning=false;cancelAnimationFrame(gravityFrame);gravityAction.textContent='Run again';gravityStatus.textContent=`Run ended after ${gravityPoints} barriers.`;drawGravity();};
  const gravityLoop=(time)=>{if(!gravityRunning)return;const scale=Math.min(2,(time-gravityLast||16)/16);gravityLast=time;gravityY+=(gravityTarget-gravityY)*Math.min(1,.19*scale);gravityObstacles.forEach(o=>{o.x-=(3.2+Math.min(2,gravityPoints*.08))*scale;if(!o.passed&&o.x+34<100){o.passed=true;gravityPoints+=1;gravityScore.textContent=String(gravityPoints);}});gravityObstacles=gravityObstacles.filter(o=>o.x>-50);if(!gravityObstacles.length||gravityObstacles[gravityObstacles.length-1].x<350)gravityObstacles.push({x:570,top:Math.random()>.5,passed:false});if(gravityObstacles.some(o=>o.x<126&&o.x+34>100&&(o.top?gravityY<128:gravityY>320))){endGravity();return;}drawGravity();gravityFrame=requestAnimationFrame(gravityLoop);};
  const startGravity=()=>{cancelAnimationFrame(gravityFrame);gravityY=382;gravityTarget=382;gravityPoints=0;gravityObstacles=[{x:570,top:false,passed:false}];gravityScore.textContent='0';gravityStatus.textContent='Run live. Flip before the barrier.';gravityAction.textContent='Flip gravity';gravityRunning=true;gravityLast=0;gravityFrame=requestAnimationFrame(gravityLoop);};
  const flipGravity=()=>{if(!gravityRunning){startGravity();return;}gravityTarget=gravityTarget>200?52:382;gravityStatus.textContent=gravityTarget<200?'Running on the ceiling.':'Back on the floor.';};
  gravityAction.addEventListener('click',flipGravity);gravityCanvas.addEventListener('pointerdown',flipGravity);drawGravity();

  document.addEventListener('keydown',(event)=>{const selected=$('[data-game][aria-selected="true"]')?.dataset.game;if(event.code==='Space'&&selected==='flight'){event.preventDefault();liftFlight();}if(event.code==='Space'&&selected==='gravity'){event.preventDefault();flipGravity();}if(selected==='pong'&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();pongPaddle=Math.max(0,Math.min(420,pongPaddle+(event.key==='ArrowLeft'?-34:34)));drawPong();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;stackRunning=false;cancelAnimationFrame(stackFrame);flightRunning=false;cancelAnimationFrame(flightFrame);pongRunning=false;cancelAnimationFrame(pongFrame);gravityRunning=false;cancelAnimationFrame(gravityFrame);});

  // Word Scramble
  const words = [
    ['strategy','A clear plan for reaching a goal'],['campaign','A coordinated marketing effort'],['creative','Original thinking or expressive work'],['insight','A useful understanding'],['audience','The people a message is designed for'],['growth','Positive progress over time'],['analytics','The study of performance data'],['content','Information made for an audience'],['search','Looking for an answer online'],['convert','Turn interest into action'],['signal','A meaningful indicator'],['focus','Concentrated attention']
  ];
  const wordEl=$('[data-scrambled-word]'),wordHint=$('[data-word-hint]'),wordInput=$('[data-word-input]'),wordScoreEl=$('[data-word-score]'),wordRoundEl=$('[data-word-round]'),wordStatus=$('[data-word-status]');
  let wordOrder=[],wordIndex=0,wordPoints=0,currentWord='';
  const scrambleWord=(word)=>{let result=word;for(let tries=0;tries<8&&result===word;tries++)result=shuffle([...word]).join('');return result;};
  const nextWord=()=>{if(wordIndex>=10){wordEl.textContent='Complete';wordHint.textContent=`Final score: ${wordPoints} / 10`;wordRoundEl.textContent='Challenge complete';wordInput.disabled=true;wordStatus.textContent=wordPoints>=8?'Excellent word sense.':'Good run—play again to improve.';return;}const item=wordOrder[wordIndex];currentWord=item[0];wordEl.textContent=scrambleWord(currentWord);wordHint.textContent=item[1];wordRoundEl.textContent=`Round ${wordIndex+1} / 10`;wordInput.value='';wordInput.focus();};
  const resetWords=()=>{wordOrder=shuffle(words).slice(0,10);wordIndex=0;wordPoints=0;wordInput.disabled=false;wordScoreEl.textContent='0';wordStatus.textContent='';nextWord();};
  $('[data-word-form]').addEventListener('submit',(event)=>{event.preventDefault();if(wordInput.value.trim().toLowerCase()===currentWord){wordPoints+=1;wordStatus.textContent='Correct. Next word.';}else wordStatus.textContent=`Not quite — it was “${currentWord}”.`;wordScoreEl.textContent=String(wordPoints);wordIndex+=1;setTimeout(nextWord,450);});
  $('[data-word-skip]').addEventListener('click',()=>{wordStatus.textContent=`Skipped — the word was “${currentWord}”.`;wordIndex+=1;setTimeout(nextWord,450);});resetWords();

  // Color Focus
  const colorSet=[['RED','#f47a52'],['LIME','#dfff63'],['BLUE','#66a6ff'],['WHITE','#f2efe7']];
  const colorPrompt=$('[data-color-prompt]'),colorOptions=$('[data-color-options]'),colorRound=$('[data-color-round]'),colorScore=$('[data-color-score]'),colorStatus=$('[data-color-status]');
  let colorIndex=0,colorPoints=0,colorAnswer='';
  const showColorRound=()=>{if(colorIndex>=10){colorPrompt.textContent='DONE';colorPrompt.style.color='#dfff63';colorOptions.replaceChildren();colorRound.textContent='Challenge complete';colorScore.textContent=`${colorPoints} / 10`;colorStatus.textContent=colorPoints>=8?'Excellent focus.':'Nice effort—try another run.';return;}const ink=colorSet[Math.floor(Math.random()*colorSet.length)],word=colorSet[Math.floor(Math.random()*colorSet.length)];colorAnswer=ink[0];colorPrompt.textContent=word[0];colorPrompt.style.color=ink[1];colorRound.textContent=`Round ${colorIndex+1} / 10`;colorOptions.replaceChildren();shuffle(colorSet).forEach(([name])=>{const button=document.createElement('button');button.type='button';button.textContent=name;button.addEventListener('click',()=>{if(name===colorAnswer){colorPoints+=1;colorStatus.textContent='Correct.';}else colorStatus.textContent=`The ink was ${colorAnswer.toLowerCase()}.`;colorIndex+=1;colorScore.textContent=`${colorPoints} / 10`;setTimeout(showColorRound,300);});colorOptions.append(button);});};
  $('[data-color-start]').addEventListener('click',()=>{colorIndex=0;colorPoints=0;colorScore.textContent='0 / 10';colorStatus.textContent='Challenge started.';showColorRound();});
})();
