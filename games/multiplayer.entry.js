import { createClient } from '@supabase/supabase-js';

(() => {
  const supported = ['connect', 'memory', 'word', 'color', 'dots', 'draw'];
  const labels = {
    connect: 'Four in a Row', memory: 'Memory Match', word: 'Word Scramble',
    color: 'Color Focus', dots: 'Dots & Boxes', draw: 'Draw & Guess'
  };
  const onlineDescriptions = {
    connect: 'Play a live two-player match with exact-circle placement. Tap any empty circle, connect four, and request a rematch without leaving the room.',
    memory: 'Take turns revealing two cards on one shared board. A matching pair earns a point and keeps the turn.',
    word: 'Solve the same ten scrambled words together. Answers lock privately, then both players advance at the same time.',
    color: 'Face the same ten colour prompts together. Choose the ink colour—not the written word—and chase the higher score.',
    dots: 'Draw one line per turn. Complete a square to claim it and play again—the player with the most boxes wins.',
    draw: 'Sketch a secret prompt live while your friend guesses. Roles switch each round across one shared, touch-friendly canvas.'
  };
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const words = [
    ['strategy','A clear plan for reaching a goal'],['campaign','A coordinated marketing effort'],
    ['creative','Original thinking or expressive work'],['insight','A useful understanding'],
    ['audience','The people a message is designed for'],['growth','Positive progress over time'],
    ['analytics','The study of performance data'],['content','Information made for an audience'],
    ['search','Looking for an answer online'],['convert','Turn interest into action']
  ];
  const colors = [['RED','#f47a52'],['LIME','#dfff63'],['BLUE','#66a6ff'],['WHITE','#f2efe7']];
  const drawPrompts = [
    ...['cup','mug','spoon','fork','plate','bowl','bottle','box','bag','hat','cap','shoe','sock','shirt','pants','bed','table','chair','door','window','key','lock','clock','book','pencil','pen','brush','comb','phone','television','fan','lamp','candle','ball','kite','balloon','gift','umbrella','glasses','toothbrush','camera','envelope','scissors','ruler'].map(word=>({word,category:'Everyday things'})),
    ...['apple','banana','orange','lemon','grapes','cherry','pear','carrot','egg','bread','pizza','burger','donut','cookie','cake','cupcake','ice cream','lollipop','popcorn','sandwich','watermelon','strawberry','corn','cheese','hot dog','mushroom'].map(word=>({word,category:'Easy food'})),
    ...['cat','dog','fish','bird','duck','chicken','rabbit','turtle','snail','bee','butterfly','spider','ant','crab','whale','frog','mouse','pig','cow','sheep','worm','ladybug'].map(word=>({word,category:'Easy animals'})),
    ...['sun','moon','star','cloud','rain','rainbow','flower','tree','leaf','grass','mountain','wave','snowman','snowflake','puddle','rock','fire','cactus','palm tree','planet'].map(word=>({word,category:'Nature'})),
    ...['house','school','shop','road','bridge','tent','car','bus','train','boat','airplane','bicycle','rocket','traffic light','stop sign','mailbox','fence','castle','igloo','playground'].map(word=>({word,category:'Places & travel'})),
    ...['happy face','sad face','heart','circle','square','triangle','smile','crown','robot','football','basketball','tennis ball','baseball','guitar','drum','music note','puzzle piece','dice','toy car','teddy bear','yo-yo','magic wand','party hat','birthday cake'].map(word=>({word,category:'Fun & simple'}))
  ];
  const clientId = sessionStorage.getItem('multi-client-id') || crypto.randomUUID();
  sessionStorage.setItem('multi-client-id', clientId);
  let supabase = null;
  let active = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const nativeArena = panel => panel.querySelector(':scope > :not(.game-panel-info):not(.multi-root)');
  const shuffle = (items) => items.map(value => ({value, rank: Math.random()})).sort((a,b) => a.rank-b.rank).map(item => item.value);
  const cleanCode = value => String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
  const roomCode = () => Array.from({length: 6}, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const playerName = () => localStorage.getItem('multi-player-name') || '';
  const setUrl = (game = '', code = '') => {
    const url = new URL(location.href);
    if (game && code) url.searchParams.set('play', `${game}-${code}`); else url.searchParams.delete('play');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };
  const parseInvite = () => {
    const value = new URL(location.href).searchParams.get('play') || '';
    const split = value.lastIndexOf('-');
    const game = value.slice(0, split); const code = cleanCode(value.slice(split + 1));
    return supported.includes(game) && code.length === 6 ? {game, code} : null;
  };
  async function client() {
    if (supabase) return supabase;
    let response = await fetch('/api/multiplayer/config', {cache: 'no-store'});
    if (!response.ok && ['localhost', '127.0.0.1'].includes(location.hostname)) {
      response = await fetch('https://hisanali.com/api/multiplayer/config', {cache: 'no-store'});
    }
    if (!response.ok) throw new Error('Online play is temporarily unavailable.');
    const config = await response.json();
    supabase = createClient(config.url, config.publishableKey, {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      realtime: {params: {eventsPerSecond: 40}}
    });
    return supabase;
  }

  function modeMarkup(game) {
    const creative = game === 'draw';
    return `<div class="multi-mode" role="group" aria-label="Choose ${labels[game]} mode">
      <button class="is-active" type="button" data-multi-mode="solo">${game === 'dots' ? 'Vs computer' : creative ? 'How it works' : 'Solo'}</button>
      <button type="button" data-multi-mode="online"><span></span>${game === 'dots' || creative ? 'Play online' : 'Online'}</button>
    </div>`;
  }
  function lobbyMarkup(game) {
    return `<section class="multi-lobby" aria-label="${labels[game]} online lobby">
      <div class="multi-lobby-heading"><span>Live multiplayer</span><h4>Challenge a friend.</h4><p>Both players can join from any phone or computer. No account needed.</p></div>
      <label class="multi-field"><span>Your name</span><input data-multi-name maxlength="24" autocomplete="nickname" placeholder="Player name" value="${playerName().replace(/[&<>\"]/g, '')}"></label>
      <button class="multi-primary" type="button" data-multi-create>Create a ${labels[game]} room <b>↗</b></button>
      <div class="multi-join"><label class="multi-field"><span>Have a room code?</span><input data-multi-code maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABC123"></label><button type="button" data-multi-join>Join</button></div>
      <p class="multi-note" data-multi-note>Private six-character room · two players</p>
    </section>`;
  }
  function roomShell(game, code) {
    return `<section class="multi-room">
      <div class="multi-room-top"><div><span>Live room</span><strong>${code}</strong></div><div><button type="button" data-multi-copy>Copy code</button><button type="button" data-multi-share>Share</button><button type="button" data-multi-leave>Leave</button></div></div>
      <div class="multi-scoreboard" aria-label="Live score"><div data-multi-player="A"><b>A</b><span class="multi-player-copy"><strong data-multi-name>Waiting…</strong><small data-multi-role>Room host</small></span><span class="multi-points"><small>Score</small><strong data-multi-score>0</strong></span></div><em><b>VS</b><small>Live</small></em><div data-multi-player="B"><b>B</b><span class="multi-player-copy"><strong data-multi-name>Waiting…</strong><small data-multi-role>Opponent</small></span><span class="multi-points"><small>Score</small><strong data-multi-score>0</strong></span></div></div>
      <div class="match-celebration" data-multi-celebration hidden aria-live="assertive"><div class="match-confetti" aria-hidden="true">${'<i></i>'.repeat(14)}</div><span data-celebration-label>Match complete</span><strong data-celebration-title>Winner!</strong><small data-celebration-score></small></div>
      <p class="multi-connection" data-multi-connection>Connecting…</p>
      <div class="multi-game" data-multi-game></div>
      <p class="multi-status" data-multi-status>Opening the room…</p>
      <button class="multi-rematch" type="button" data-multi-rematch hidden>Play again</button>
    </section>`;
  }

  function initialState(game, excludedDrawPrompts = []) {
    const base = {game, revision: 0, score: {A: 0, B: 0}, over: false};
    if (game === 'connect') return {...base, board: Array(42).fill(''), turn: 'A', result: ''};
    if (game === 'memory') return {...base, cards: shuffle([...symbols, ...symbols]), flipped: [], matched: [], turn: 'A', result: ''};
    if (game === 'reaction') return {...base, phase: 'ready', goAt: 0, results: {A: null, B: null}, round: 0, result: ''};
    if (game === 'word') return {...base, order: shuffle(words.map((_, index) => index)), round: 0, answers: {}, result: ''};
    if (game === 'dots') return {...base, edges: Array(24).fill(''), boxes: Array(9).fill(''), turn: 'A', result: ''};
    if (game === 'draw') {
      const excluded = new Set(excludedDrawPrompts);
      const available = drawPrompts.map((_, index) => index).filter(index => !excluded.has(index));
      return {...base, order: shuffle(available.length >= 5 ? available : drawPrompts.map((_, index) => index)).slice(0, 5), round: 0, drawer: 'A', phase: 'drawing', guesses: [], result: ''};
    }
    return {...base, prompts: Array.from({length: 10}, () => [Math.floor(Math.random()*4), Math.floor(Math.random()*4)]), round: 0, answers: {}, result: ''};
  }
  function connectWinner(board) {
    for (let row=0; row<6; row++) for (let col=0; col<7; col++) {
      const player = board[row*7+col]; if (!player) continue;
      for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) if ([1,2,3].every(step => {
        const r=row+dr*step,c=col+dc*step; return r>=0&&r<6&&c>=0&&c<7&&board[r*7+c]===player;
      })) return player;
    }
    return board.every(Boolean) ? 'draw' : '';
  }
  const cardDone = (state, index) => state.matched.includes(index);
  const dotsBoxEdges = index => {
    const row = Math.floor(index / 3); const column = index % 3;
    return [row * 3 + column, (row + 1) * 3 + column, 12 + row * 4 + column, 12 + row * 4 + column + 1];
  };
  function dotsBoard(state, canPlay) {
    const cells = [];
    for (let row = 0; row < 7; row++) for (let column = 0; column < 7; column++) {
      if (row % 2 === 0 && column % 2 === 0) {
        cells.push('<i class="dots-node" aria-hidden="true"></i>');
      } else if (row % 2 === 0) {
        const index = (row / 2) * 3 + Math.floor(column / 2); const owner = state.edges[index];
        cells.push(`<button type="button" class="dots-edge is-horizontal${owner ? ` is-${owner.toLowerCase()}` : ''}" data-dots-edge="${index}" aria-label="Draw horizontal line ${index + 1}" ${!canPlay || owner ? 'disabled' : ''}></button>`);
      } else if (column % 2 === 0) {
        const index = 12 + Math.floor(row / 2) * 4 + column / 2; const owner = state.edges[index];
        cells.push(`<button type="button" class="dots-edge is-vertical${owner ? ` is-${owner.toLowerCase()}` : ''}" data-dots-edge="${index}" aria-label="Draw vertical line ${index - 11}" ${!canPlay || owner ? 'disabled' : ''}></button>`);
      } else {
        const index = Math.floor(row / 2) * 3 + Math.floor(column / 2); const owner = state.boxes[index];
        cells.push(`<span class="dots-box${owner ? ` is-${owner.toLowerCase()}` : ''}" aria-label="${owner ? `Claimed by player ${owner}` : 'Unclaimed box'}">${owner || ''}</span>`);
      }
    }
    return cells.join('');
  }

  const escapeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const drawingActor = session => session.game === 'draw' ? session.state.drawer : '';
  const isDrawable = game => game === 'draw';
  function paintDrawLine(canvas, line) {
    const context = canvas?.getContext('2d'); if (!context || !line) return;
    context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = line.color || '#17382d';
    context.lineWidth = Math.max(2, Number(line.size) || 8); context.beginPath();
    context.moveTo(line.x1 * canvas.width, line.y1 * canvas.height); context.lineTo(line.x2 * canvas.width, line.y2 * canvas.height); context.stroke();
  }
  function redrawCanvas(session, canvas) {
    const context = canvas?.getContext('2d'); if (!context) return;
    context.fillStyle = '#fffdf7'; context.fillRect(0, 0, canvas.width, canvas.height);
    session.drawLines.forEach(line => paintDrawLine(canvas, line));
  }
  function bindDrawCanvas(session, canvas, enabled) {
    redrawCanvas(session, canvas); if (!enabled) return;
    let previous = null;
    const point = event => { const box=canvas.getBoundingClientRect(); return {x:Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))}; };
    canvas.addEventListener('pointerdown', event => {event.preventDefault();canvas.setPointerCapture(event.pointerId);previous=point(event);});
    canvas.addEventListener('pointermove', event => {
      if (!previous || !canvas.hasPointerCapture(event.pointerId)) return; event.preventDefault();
      const next=point(event); if(Math.hypot(next.x-previous.x,next.y-previous.y)<.003)return;
      const line={x1:previous.x,y1:previous.y,x2:next.x,y2:next.y,color:session.brushColor,size:session.brushSize};
      session.drawLines.push(line);paintDrawLine(canvas,line);session.send('draw-stroke',{line,actor:session.role,clientId});previous=next;
    });
    const stop = event => {if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);previous=null;};
    canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  }

  const canvasColor = '#fffdf7';
  const brushColors = [
    {value:'#17382d', label:'Ink'}, {value:'#b84224', label:'Orange'}, {value:'#6659cb', label:'Purple'},
    {value:'#278f70', label:'Green'}, {value:'#f0b83f', label:'Yellow'}
  ];
  const brushSizes = [
    {value:4, label:'Thin'}, {value:8, label:'Medium'}, {value:14, label:'Thick'}, {value:22, label:'Extra thick'}
  ];
  function drawToolsMarkup(session) {
    return `<div class="draw-tool-group"><span class="draw-tool-label">Colour</span><div class="draw-colors" aria-label="Brush colours">${brushColors.map(({value,label})=>`<button type="button" data-draw-color="${value}" class="${session.brushColor===value?'is-active':''}" style="--swatch:${value}" aria-label="${label}" title="${label}"></button>`).join('')}</div></div>
      <div class="draw-tool-group"><span class="draw-tool-label">Thickness</span><div class="draw-sizes" aria-label="Stroke thickness">${brushSizes.map(({value,label})=>`<button type="button" data-draw-size="${value}" class="${session.brushSize===value?'is-active':''}" aria-label="${label} stroke" title="${label}"><i style="--brush-dot:${Math.max(4,Math.round(value*.55))}px"></i></button>`).join('')}</div></div>
      <button class="draw-eraser ${session.brushColor===canvasColor?'is-active':''}" type="button" data-draw-eraser aria-pressed="${session.brushColor===canvasColor}" title="Erase part of the drawing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 15 8-9a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-6 7H8l-4-4a1 1 0 0 1 0-1Z"/><path d="m9 19 7-8"/></svg><span>Eraser</span></button>`;
  }
  function bindDrawTools(session, arena) {
    arena.querySelectorAll('[data-draw-color]').forEach(button=>button.addEventListener('click',()=>{session.brushColor=button.dataset.drawColor;renderGame(session);}));
    arena.querySelectorAll('[data-draw-size]').forEach(button=>button.addEventListener('click',()=>{session.brushSize=Number(button.dataset.drawSize);renderGame(session);}));
    $('[data-draw-eraser]',arena)?.addEventListener('click',()=>{session.brushColor=canvasColor;renderGame(session);});
  }

  function renderGame(session) {
    const {game, state, role, root} = session;
    const arena = $('[data-multi-game]', root); const status = $('[data-multi-status]', root);
    const both = Boolean(session.players.A && session.players.B);
    $('[data-multi-connection]', root).textContent = session.connected ? (both ? 'Both players live' : 'Waiting for opponent') : 'Reconnecting…';
    for (const key of ['A','B']) {
      const item = $(`[data-multi-player="${key}"]`, root); const player = session.players[key];
      $('[data-multi-name]', item).textContent = player ? `${player.name}${player.clientId === clientId ? ' (you)' : ''}` : 'Waiting…';
      $('[data-multi-role]', item).textContent = key === 'A' ? 'Room host' : 'Opponent';
      const score = state.score[key] || 0; $('[data-multi-score]', item).textContent = score;
      const activePlayer = ['connect','memory','dots'].includes(game) ? state.turn : game === 'draw' ? drawingActor(session) : '';
      item.classList.toggle('is-your-card', player?.clientId === clientId);
      item.classList.toggle('is-active-turn', both && !state.over && (activePlayer ? activePlayer === key : true));
      item.classList.toggle('is-winner', state.over && state.result === key);
      if (score > (session.renderedScores[key] || 0)) { item.classList.remove('is-score-bump');void item.offsetWidth;item.classList.add('is-score-bump');window.setTimeout(()=>item.classList.remove('is-score-bump'),700); }
      session.renderedScores[key] = score;
    }
    const celebration=$('[data-multi-celebration]',root);celebration.hidden=!state.over;
    if(state.over){const winner=state.result==='draw'?null:session.players[state.result];$('[data-celebration-label]',celebration).textContent=winner?.clientId===clientId?'You won the match':winner?'Match winner':'Match complete';$('[data-celebration-title]',celebration).textContent=winner?`${winner.name} wins!`:'Perfectly tied!';$('[data-celebration-score]',celebration).textContent=`Final score · ${state.score.A||0} — ${state.score.B||0}`;}
    const rematch = $('[data-multi-rematch]', root); rematch.hidden = !state.over;
    if (game === 'connect') {
      arena.className = 'multi-game multi-connect';
      const canPlay = both && !state.over && state.turn === role;
      arena.innerHTML = `<div class="connect-board">${state.board.map((value,index)=>`<button type="button" class="connect-cell${value ? ` is-${value==='A'?'p':'c'}` : ''}" data-board-index="${index}" aria-label="${value ? 'Occupied' : 'Place a piece'} at row ${Math.floor(index/7)+1}, column ${(index%7)+1}" ${!canPlay||Boolean(value)?'disabled':''}></button>`).join('')}</div>`;
      arena.querySelectorAll('[data-board-index]').forEach(button => button.addEventListener('click', () => session.action({type:'cell', index:Number(button.dataset.boardIndex)})));
      status.textContent = !both ? 'Share the room code with your opponent.' : state.result === 'draw' ? 'The board is full — draw.' : state.result ? `${session.players[state.result]?.name || 'Player'} connected four!` : state.turn === role ? 'Your turn — choose any empty circle.' : `${session.players[state.turn]?.name || 'Opponent'} is choosing a circle…`;
    } else if (game === 'memory') {
      arena.className = 'multi-game multi-memory';
      arena.innerHTML = `<div class="memory-board">${state.cards.map((symbol,index)=>`<button type="button" class="memory-card${state.flipped.includes(index)||cardDone(state,index)?' is-flipped':''}${cardDone(state,index)?' is-matched':''}" data-card="${index}" ${!both||state.over||state.turn!==role||state.flipped.includes(index)||cardDone(state,index)||state.flipped.length>=2?'disabled':''}>${symbol}</button>`).join('')}</div>`;
      arena.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => session.action({type:'card', index:Number(button.dataset.card)})));
      status.textContent = !both ? 'Share the room code to begin.' : state.over ? `${session.players[state.result]?.name || 'Player'} wins the memory match!` : state.turn === role ? 'Your turn — reveal two cards.' : `${session.players[state.turn]?.name || 'Opponent'} is remembering…`;
    } else if (game === 'dots') {
      arena.className = 'multi-game multi-dots';
      const canPlay = both && !state.over && state.turn === role;
      arena.innerHTML = `<div class="dots-live-board" role="grid" aria-label="Dots and Boxes board">${dotsBoard(state, canPlay)}</div>`;
      arena.querySelectorAll('[data-dots-edge]').forEach(button => button.addEventListener('click', () => session.action({type:'edge', index:Number(button.dataset.dotsEdge)})));
      status.textContent = !both ? 'Share the room code to begin.' : state.over ? (state.result === 'draw' ? 'The board ends level.' : `${session.players[state.result]?.name || 'Player'} claims the board!`) : state.turn === role ? 'Your turn — draw one line.' : `${session.players[state.turn]?.name || 'Opponent'} is drawing a line…`;
    } else if (game === 'reaction') {
      arena.className = 'multi-game multi-reaction';
      let copy = 'Start reflex round'; let sub = role === 'A' ? 'Both players must be online' : 'The host starts each round';
      if (state.phase === 'waiting') {copy='Wait…';sub='Do not tap yet';}
      if (state.phase === 'go') {copy=state.results[role] == null?'Tap now!':`${state.results[role]} ms`;sub=state.results[role] == null?'Go, go, go':'Waiting for opponent';}
      if (state.phase === 'done') {copy=state.result==='draw'?'Tie round':state.result===role?'You win!':'Opponent wins';sub='Ready for another round';}
      arena.innerHTML = `<button class="reaction-target ${state.phase==='waiting'?'is-waiting':''} ${state.phase==='go'?'is-go':''}" type="button" data-reaction-live ${!both||state.phase==='go'&&state.results[role]!=null||role!=='A'&&state.phase!=='go'?'disabled':''}><span>${copy}</span><small>${sub}</small></button>`;
      $('[data-reaction-live]', arena).addEventListener('click', () => session.action({type: state.phase === 'go' ? 'tap' : 'start', tappedAt: Date.now()}));
      status.textContent = !both ? 'Waiting for a challenger.' : state.phase === 'ready' ? (role === 'A' ? 'You control the start signal.' : 'Host will start the signal.') : state.phase === 'waiting' ? 'Stay patient.' : state.phase === 'go' ? 'React!' : state.result === 'draw' ? 'Exactly equal — impressive.' : `${session.players[state.result]?.name || 'Player'} was faster.`;
      if (state.phase === 'waiting') session.armReaction();
    } else if (game === 'word') {
      arena.className = 'multi-game multi-word';
      const completed = state.round >= 10; const item = completed ? null : words[state.order[state.round]];
      const scramble = item ? [...item[0]].sort((a,b)=>((a.charCodeAt(0)*17+state.round*13)%31)-((b.charCodeAt(0)*17+state.round*13)%31)).join('') : 'COMPLETE';
      const answered = Object.prototype.hasOwnProperty.call(state.answers, role);
      arena.innerHTML = `<span class="word-round">${completed?'Match complete':`Round ${state.round+1} / 10`}</span><strong class="scrambled-word">${scramble}</strong><p>${item?item[1]:'Final scores are in.'}</p>${completed?'':`<form data-live-word><label>Your answer</label><div><input autocomplete="off" spellcheck="false" ${answered?'disabled':''}><button ${answered?'disabled':''}>${answered?'Locked':'Check'}</button></div></form>`}`;
      const form = $('[data-live-word]', arena); if (form) form.addEventListener('submit', event => {event.preventDefault(); const input=$('input',form);session.action({type:'answer', answer:input.value.trim().toLowerCase()});});
      status.textContent = !both ? 'Waiting for your opponent.' : completed ? (state.result==='draw'?'The word duel ends level.':`${session.players[state.result]?.name || 'Player'} wins the word duel!`) : answered ? 'Answer locked — waiting for opponent.' : 'Solve it before your opponent.';
    } else if (game === 'draw') {
      arena.className = 'multi-game multi-draw';
      const prompt = drawPrompts[state.order[state.round]] || {word:'',category:'Surprise'}; const word = prompt.word;
      const isDrawer = state.drawer === role; const canDraw = both && !state.over && state.phase === 'drawing' && isDrawer;
      const hiddenWord = word.split('').map(character => character === ' ' ? '<i></i>' : '<b>_</b>').join('');
      const guesses = state.guesses.slice(-4).map(item => `<span><b>${escapeText(session.players[item.actor]?.name || 'Player')}</b>${escapeText(item.text)}</span>`).join('');
      arena.innerHTML = `<div class="draw-game-head"><div><span>Round ${Math.min(state.round + 1, 5)} / 5 · ${escapeText(prompt.category)}</span><strong>${state.over ? 'Match complete' : isDrawer ? `Draw: ${escapeText(word)}` : hiddenWord}</strong></div><em>${state.over ? 'Finished' : isDrawer ? 'You are drawing' : 'You are guessing'}</em></div>
        <div class="draw-canvas-shell"><canvas width="900" height="560" data-draw-canvas aria-label="Shared drawing canvas"></canvas>${!both?'<div class="draw-canvas-wait"><b>Invite a friend</b><span>The canvas opens when both players join.</span></div>':''}</div>
        <div class="draw-controls" ${canDraw?'':'hidden'}>${drawToolsMarkup(session)}<button class="draw-clear" type="button" data-draw-clear>Clear all</button><button class="draw-skip" type="button" data-draw-skip>Skip word</button></div>
        ${!state.over && state.phase==='drawing' && !isDrawer ? `<form class="draw-guess" data-draw-guess><input maxlength="40" autocomplete="off" placeholder="Type your guess…" aria-label="Your guess"><button>Guess</button></form>` : ''}
        ${state.phase==='round-over' && !state.over ? `<button class="draw-next" type="button" data-draw-next>Next round <span>→</span></button>` : ''}
        <div class="draw-guesses" aria-live="polite">${guesses || '<span class="is-empty">Guesses will appear here.</span>'}</div>`;
      const canvas=$('[data-draw-canvas]',arena);bindDrawCanvas(session,canvas,canDraw);
      bindDrawTools(session,arena);
      $('[data-draw-clear]',arena)?.addEventListener('click',()=>session.clearDrawing());
      $('[data-draw-skip]',arena)?.addEventListener('click',()=>session.action({type:'skip'}));
      $('[data-draw-guess]',arena)?.addEventListener('submit',event=>{event.preventDefault();const input=$('input',event.currentTarget);const guess=input.value.trim();if(guess){session.action({type:'guess',guess});input.value='';}});
      $('[data-draw-next]',arena)?.addEventListener('click',()=>session.action({type:'next-round'}));
      status.textContent = !both ? 'Share the room code to start drawing.' : state.over ? (state.result==='draw'?'Five rounds, perfectly tied.':`${session.players[state.result]?.name || 'Player'} wins the sketch match!`) : state.phase==='round-over' ? 'Correct! Ready for the next prompt.' : isDrawer ? 'Draw the prompt without writing the word.' : `Watch the canvas — ${session.players[state.drawer]?.name || 'Your friend'} is drawing.`;
    } else {
      arena.className = 'multi-game multi-color';
      const completed = state.round >= 10; const prompt = completed ? null : state.prompts[state.round]; const answered = Object.prototype.hasOwnProperty.call(state.answers, role);
      arena.innerHTML = `<span class="color-round">${completed?'Match complete':`Round ${state.round+1} / 10`}</span><strong class="color-prompt" style="color:${prompt?colors[prompt[1]][1]:'#dfff63'}">${prompt?colors[prompt[0]][0]:'DONE'}</strong>${completed?'':`<div class="color-options">${colors.map(([name])=>`<button type="button" data-live-color="${name}" ${answered?'disabled':''}>${name}</button>`).join('')}</div>`}`;
      arena.querySelectorAll('[data-live-color]').forEach(button => button.addEventListener('click', () => session.action({type:'answer', answer:button.dataset.liveColor})));
      status.textContent = !both ? 'Waiting for your opponent.' : completed ? (state.result==='draw'?'The focus duel ends level.':`${session.players[state.result]?.name || 'Player'} wins the focus duel!`) : answered ? 'Choice locked — waiting for opponent.' : 'Choose the ink colour, not the word.';
    }
  }

  function hostAction(session, action, actor) {
    const state = session.state; if (state.over && action.type !== 'rematch') return;
    if (action.type === 'rematch') { const fresh=initialState(session.game,session.game==='draw'?state.order:[]); fresh.score=['dots','draw'].includes(session.game) ? {A:0,B:0} : {...state.score};fresh.revision=state.revision+1;session.state=fresh;session.drawLines=[];session.send('draw-clear',{actor});session.publish();return; }
    if (session.game === 'connect' && action.type === 'cell' && state.turn === actor && Number.isInteger(action.index) && action.index >= 0 && action.index < state.board.length && !state.board[action.index]) {
      state.board[action.index]=actor;state.turn=actor==='A'?'B':'A';const result=connectWinner(state.board);if(result){state.result=result;state.over=true;if(result!=='draw')state.score[result]+=1;}
    } else if (session.game === 'memory' && action.type === 'card' && state.turn === actor && state.flipped.length < 2 && !state.flipped.includes(action.index) && !state.matched.includes(action.index)) {
      state.flipped.push(action.index);
      if (state.flipped.length === 2) {
        const [a,b]=state.flipped;
        session.bumpAndPublish();
        window.setTimeout(()=>{if(!active||active!==session)return;if(state.cards[a]===state.cards[b]){state.matched.push(a,b);state.score[actor]+=1;}else state.turn=actor==='A'?'B':'A';state.flipped=[];if(state.matched.length===16){state.over=true;state.result=state.score.A===state.score.B?'draw':state.score.A>state.score.B?'A':'B';}session.bumpAndPublish();},720);return;
      }
    } else if (session.game === 'dots' && action.type === 'edge' && state.turn === actor && Number.isInteger(action.index) && action.index >= 0 && action.index < state.edges.length && !state.edges[action.index]) {
      state.edges[action.index] = actor;
      let claimed = 0;
      state.boxes.forEach((owner, index) => {
        if (!owner && dotsBoxEdges(index).every(edge => state.edges[edge])) { state.boxes[index] = actor; claimed += 1; }
      });
      if (claimed) state.score[actor] += claimed; else state.turn = actor === 'A' ? 'B' : 'A';
      if (state.edges.every(Boolean)) { state.over = true; state.result = state.score.A === state.score.B ? 'draw' : state.score.A > state.score.B ? 'A' : 'B'; }
    } else if (session.game === 'reaction') {
      if (action.type === 'start' && actor === 'A' && (state.phase === 'ready'||state.phase === 'done')) {state.phase='waiting';state.results={A:null,B:null};state.result='';state.goAt=Date.now()+1500+Math.floor(Math.random()*2200);state.round+=1;}
      else if (action.type === 'go' && actor === 'A' && state.phase === 'waiting') state.phase='go';
      else if (action.type === 'tap' && state.phase === 'go' && state.results[actor] == null) {state.results[actor]=Math.max(0,action.tappedAt-state.goAt);if(state.results.A!=null&&state.results.B!=null){state.phase='done';state.result=state.results.A===state.results.B?'draw':state.results.A<state.results.B?'A':'B';if(state.result!=='draw')state.score[state.result]+=1;}}
      else return;
    } else if (session.game === 'draw') {
      if (action.type === 'guess' && state.phase === 'drawing' && actor !== state.drawer) {
        const guess=String(action.guess||'').trim().toLowerCase().replace(/\s+/g,' ');if(!guess)return;
        state.guesses.push({actor,text:guess});state.guesses=state.guesses.slice(-6);
        const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        if(normalize(guess)===normalize(drawPrompts[state.order[state.round]]?.word)){state.score[actor]+=2;state.score[state.drawer]+=1;state.phase='round-over';if(state.round===4){state.over=true;state.result=state.score.A===state.score.B?'draw':state.score.A>state.score.B?'A':'B';}}
      } else if (action.type === 'skip' && state.phase === 'drawing' && actor === state.drawer) {
        state.phase='round-over';state.guesses.push({actor,text:'skipped the prompt'});if(state.round===4){state.over=true;state.result=state.score.A===state.score.B?'draw':state.score.A>state.score.B?'A':'B';}
      } else if (action.type === 'next-round' && state.phase === 'round-over' && !state.over) {
        state.round+=1;state.drawer=state.drawer==='A'?'B':'A';state.phase='drawing';state.guesses=[];session.drawLines=[];session.send('draw-clear',{actor});
      } else return;
    } else if ((session.game === 'word'||session.game === 'color') && action.type === 'answer' && !Object.prototype.hasOwnProperty.call(state.answers,actor)) {
      const correct = session.game==='word' ? action.answer===words[state.order[state.round]][0] : action.answer===colors[state.prompts[state.round][1]][0];
      state.answers[actor]=correct;if(correct)state.score[actor]+=1;
      if(Object.keys(state.answers).length===2){session.bumpAndPublish();window.setTimeout(()=>{if(!active||active!==session)return;state.round+=1;state.answers={};if(state.round>=10){state.over=true;state.result=state.score.A===state.score.B?'draw':state.score.A>state.score.B?'A':'B';}session.bumpAndPublish();},650);return;}
    } else return;
    session.bumpAndPublish();
  }

  async function openRoom(game, code, role, name, fresh = false) {
    if (active) await active.leave(false);
    const service = await client(); const panel=$(`[data-game-panel="${game}"]`); const native=nativeArena(panel);
    panel.querySelectorAll(':scope > .multi-root').forEach(node => node.remove());
    const root=document.createElement('div');root.className=`multi-root multi-root-${game}`;root.innerHTML=roomShell(game,code);native.hidden=true;panel.append(root);
    const session={game,code,role,name,root,native,channel:null,connected:false,players:{A:null,B:null},state:initialState(game),reactionTimer:0,drawLines:[],brushColor:'#17382d',brushSize:8,renderedScores:{A:0,B:0},
      async send(event,payload){if(this.channel&&this.connected)await this.channel.send({type:'broadcast',event,payload});},
      async publish(){renderGame(this);await this.send('state',{state:this.state,hostId:clientId});},
      bumpAndPublish(){this.state.revision+=1;this.publish();},
      action(action){if(!this.players.A||!this.players.B)return;if(this.role==='A')hostAction(this,action,'A');else this.send('action',{action,clientId});},
      clearDrawing(){if(!isDrawable(this.game)||drawingActor(this)!==this.role||this.state.phase!=='drawing')return;this.drawLines=[];redrawCanvas(this,$('[data-draw-canvas]',this.root));this.send('draw-clear',{actor:this.role,clientId});},
      armReaction(){clearTimeout(this.reactionTimer);if(this.role==='A'&&this.state.phase==='waiting'){const wait=Math.max(0,this.state.goAt-Date.now());this.reactionTimer=setTimeout(()=>hostAction(this,{type:'go'},'A'),wait);}},
      async leave(clear=true){clearTimeout(this.reactionTimer);if(this.channel)await service.removeChannel(this.channel);this.channel=null;this.connected=false;this.root.remove();this.native.hidden=false;if(clear)setUrl();active=null;},
    };active=session;
    const stored=fresh?null:localStorage.getItem(`multi-state:${game}:${code}`);if(role==='A'&&stored){try{const parsed=JSON.parse(stored);if(parsed?.game===game)session.state=parsed;}catch{}}
    session.channel=service.channel(`game:${game}:${code}`,{config:{broadcast:{ack:true,self:false},presence:{key:clientId},private:false}})
      .on('presence',{event:'sync'},()=>{const all=Object.values(session.channel.presenceState()).flat().filter(Boolean);session.players={A:all.find(p=>p.role==='A')||null,B:all.find(p=>p.role==='B')||null};const duplicate=all.find(p=>p.role===role&&p.clientId!==clientId);if(duplicate){$('[data-multi-status]',root).textContent=role==='A'?'That room already has a host.':'That room already has two players.';return;}renderGame(session);if(role==='A')session.publish();else session.send('request-state',{clientId});})
      .on('broadcast',{event:'state'},({payload})=>{if(role==='B'&&payload?.state&&payload.state.game===game&&Number(payload.state.revision)>=session.state.revision){session.state=payload.state;renderGame(session);session.armReaction();}})
      .on('broadcast',{event:'request-state'},()=>{if(role==='A'){session.publish();if(isDrawable(game))session.send('draw-sync',{lines:session.drawLines});}})
      .on('broadcast',{event:'action'},({payload})=>{if(role==='A'&&payload?.clientId===session.players.B?.clientId)hostAction(session,payload.action,'B');})
      .on('broadcast',{event:'draw-stroke'},({payload})=>{if(!isDrawable(game)||!payload?.line||payload.actor!==drawingActor(session)||payload.clientId!==session.players[payload.actor]?.clientId)return;session.drawLines.push(payload.line);paintDrawLine($('[data-draw-canvas]',root),payload.line);})
      .on('broadcast',{event:'draw-clear'},()=>{if(isDrawable(game)){session.drawLines=[];redrawCanvas(session,$('[data-draw-canvas]',root));}})
      .on('broadcast',{event:'draw-sync'},({payload})=>{if(isDrawable(game)&&role==='B'&&Array.isArray(payload?.lines)){session.drawLines=payload.lines.slice(-4000);redrawCanvas(session,$('[data-draw-canvas]',root));}});
    session.channel.subscribe(async status=>{if(status==='SUBSCRIBED'){session.connected=true;await session.channel.track({clientId,role,name,joinedAt:new Date().toISOString()});renderGame(session);}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){session.connected=false;renderGame(session);}});
    const persist=()=>{if(role==='A')localStorage.setItem(`multi-state:${game}:${code}`,JSON.stringify(session.state));};
    const originalPublish=session.publish.bind(session);session.publish=async()=>{persist();return originalPublish();};
    $('[data-multi-copy]',root).addEventListener('click',async()=>{await navigator.clipboard.writeText(code);$('[data-multi-status]',root).textContent='Room code copied.';});
    $('[data-multi-share]',root).addEventListener('click',async()=>{const url=`${location.origin}/games/?play=${game}-${code}#game-library`;if(navigator.share)try{await navigator.share({title:`Play ${labels[game]} with me`,text:`Join room ${code}`,url});return;}catch{}await navigator.clipboard.writeText(url);$('[data-multi-status]',root).textContent='Invite link copied.';});
    $('[data-multi-leave]',root).addEventListener('click',()=>session.leave());
    $('[data-multi-rematch]',root).addEventListener('click',()=>session.action({type:'rematch'}));
    setUrl(game,code);renderGame(session);
  }

  async function showLobby(game, inviteCode='') {
    if(active)await active.leave(false);const panel=$(`[data-game-panel="${game}"]`),native=nativeArena(panel);native.hidden=true;
    panel.querySelectorAll(':scope > .multi-root').forEach(node => node.remove());
    panel.classList.add('is-multi-online');
    const description = $('.game-panel-info > p', panel);
    if (!description.dataset.soloCopy) description.dataset.soloCopy = description.textContent;
    description.textContent = onlineDescriptions[game];
    const root=document.createElement('div');root.className='multi-root';root.innerHTML=lobbyMarkup(game);panel.append(root);
    const modeButtons=panel.querySelectorAll('[data-multi-mode]');modeButtons.forEach(button=>button.classList.toggle('is-active',button.dataset.multiMode==='online'));
    const code=$('[data-multi-code]',root);code.value=inviteCode;
    const note=$('[data-multi-note]',root);const name=$('[data-multi-name]',root);
    const join=async(role,room,fresh)=>{const value=name.value.trim()||(role==='A'?'Room host':'Guest player');localStorage.setItem('multi-player-name',value);note.textContent='Opening the live room…';try{await openRoom(game,room,role,value,fresh);}catch(error){native.hidden=false;root.remove();note.textContent=error instanceof Error?error.message:'Could not open the room.';}};
    $('[data-multi-create]',root).addEventListener('click',()=>join('A',roomCode(),true));
    $('[data-multi-join]',root).addEventListener('click',()=>{const value=cleanCode(code.value);code.value=value;if(value.length!==6){note.textContent='Enter the complete six-character code.';note.classList.add('is-error');return;}join('B',value,false);});
    code.addEventListener('input',()=>{code.value=cleanCode(code.value);});code.addEventListener('keydown',event=>{if(event.key==='Enter')$('[data-multi-join]',root).click();});
  }

  supported.forEach(game=>{
    const panel=$(`[data-game-panel="${game}"]`);const info=$('.game-panel-info',panel);info.insertAdjacentHTML('beforeend',modeMarkup(game));
    info.querySelectorAll('[data-multi-mode]').forEach(button=>button.addEventListener('click',async()=>{
      if(button.dataset.multiMode==='online')await showLobby(game);else{if(active?.game===game)await active.leave();panel.querySelectorAll('.multi-root').forEach(root=>root.remove());nativeArena(panel).hidden=false;panel.classList.remove('is-multi-online');const description=$('.game-panel-info > p',panel);if(description.dataset.soloCopy)description.textContent=description.dataset.soloCopy;info.querySelectorAll('[data-multi-mode]').forEach(item=>item.classList.toggle('is-active',item.dataset.multiMode==='solo'));}
    }));
  });
  const invite=parseInvite();if(invite){document.querySelector(`[data-game="${invite.game}"]`)?.click();showLobby(invite.game,invite.code);}
})();
