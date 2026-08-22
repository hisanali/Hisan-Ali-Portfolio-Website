(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeGet = (key, fallback = '') => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };

  const picks = $$('[data-game]');
  const panels = $$('[data-game-panel]');
  picks.forEach((pick) => pick.addEventListener('click', () => {
    const name = pick.dataset.game;
    picks.forEach((item) => { const active = item === pick; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
    panels.forEach((panel) => { const active = panel.dataset.gamePanel === name; panel.hidden = !active; panel.classList.toggle('is-active', active); });
    $(`[data-game-panel="${name}"] h3`)?.focus?.();
  }));

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
  const memorySymbols = ['✦','●','▲','■','◆','☀','☾','✚'];
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
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let ticBoard = Array(9).fill('');
  let ticOver = false;
  const winner = (board) => { for (const [a,b,c] of wins) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; return board.every(Boolean) ? 'draw' : ''; };
  const minimax = (board, maximizing) => {
    const result = winner(board); if (result) return result === 'O' ? 10 : result === 'X' ? -10 : 0;
    const scores = []; board.forEach((value,index) => { if (!value) { board[index] = maximizing ? 'O' : 'X'; scores.push(minimax(board,!maximizing)); board[index] = ''; } });
    return maximizing ? Math.max(...scores) : Math.min(...scores);
  };
  const renderTic = () => { $$('.tic-cell',ticBoardEl).forEach((cell,index) => { cell.textContent = ticBoard[index]; cell.className = `tic-cell${ticBoard[index] ? ` is-${ticBoard[index].toLowerCase()}` : ''}`; cell.disabled = ticOver || Boolean(ticBoard[index]); cell.setAttribute('aria-label', ticBoard[index] ? `Cell ${index + 1}: ${ticBoard[index]}` : `Cell ${index + 1}: empty`); }); };
  const finishTic = () => { const result = winner(ticBoard); if (!result) return false; ticOver = true; ticStatus.textContent = result === 'draw' ? 'Draw game' : result === 'X' ? 'You win' : 'Computer wins'; renderTic(); return true; };
  const computerMove = () => {
    if (ticOver) return; let bestScore = -Infinity, bestMove = -1;
    ticBoard.forEach((value,index) => { if (!value) { ticBoard[index] = 'O'; const score = minimax(ticBoard,false); ticBoard[index] = ''; if (score > bestScore) { bestScore = score; bestMove = index; } } });
    if (bestMove >= 0) ticBoard[bestMove] = 'O'; if (!finishTic()) { ticStatus.textContent = 'Your turn'; renderTic(); }
  };
  const resetTic = () => { ticBoard = Array(9).fill(''); ticOver = false; ticStatus.textContent = 'Your turn'; ticBoardEl.replaceChildren(); Array.from({length:9},(_,index) => { const cell=document.createElement('button'); cell.type='button'; cell.className='tic-cell'; cell.addEventListener('click',()=>{ if(ticOver||ticBoard[index])return; ticBoard[index]='X'; renderTic(); if(!finishTic()){ticStatus.textContent='Computer thinking…'; setTimeout(computerMove,260);} }); ticBoardEl.append(cell); }); renderTic(); };
  $('[data-tic-reset]').addEventListener('click',resetTic); resetTic();

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

  // Math Sprint
  const mathQuestion=$('[data-math-question]'),mathOptions=$('[data-math-options]'),mathRound=$('[data-math-round]'),mathScore=$('[data-math-score]'),mathStatus=$('[data-math-status]');
  let mathIndex=0,mathPoints=0,mathAnswer=0,mathLocked=true;
  const mathProblem=()=>{const level=mathIndex<4?'add':mathIndex<7?'subtract':'multiply';let first=2+Math.floor(Math.random()*11),second=2+Math.floor(Math.random()*10),symbol='+';if(level==='subtract'){first+=second;symbol='−';mathAnswer=first-second;}else if(level==='multiply'){first=2+Math.floor(Math.random()*8);second=2+Math.floor(Math.random()*8);symbol='×';mathAnswer=first*second;}else mathAnswer=first+second;return `${first} ${symbol} ${second}`;};
  const nextMath=()=>{if(mathIndex>=10){mathLocked=true;mathRound.textContent='Sprint complete';mathQuestion.textContent=`${mathPoints} / 10`;mathOptions.replaceChildren();mathStatus.textContent=mathPoints>=8?'Excellent work.':'Good run — start again to improve.';return;}mathLocked=false;mathStatus.textContent='Choose the correct answer.';mathQuestion.textContent=mathProblem();mathRound.textContent=`Question ${mathIndex+1} of 10`;const choices=new Set([mathAnswer]);const offsets=shuffle([-4,-3,-2,-1,1,2,3,4,5]);for(const offset of offsets){if(choices.size>=4)break;const choice=mathAnswer+offset;if(choice>=0)choices.add(choice);}mathOptions.replaceChildren();shuffle([...choices]).forEach(value=>{const button=document.createElement('button');button.type='button';button.textContent=String(value);button.addEventListener('click',()=>{if(mathLocked)return;mathLocked=true;$$('button',mathOptions).forEach(option=>option.disabled=true);if(value===mathAnswer){mathPoints+=1;button.classList.add('is-correct');mathStatus.textContent='Correct!';}else{button.classList.add('is-wrong');$$('button',mathOptions).find(option=>Number(option.textContent)===mathAnswer)?.classList.add('is-correct');mathStatus.textContent=`The answer is ${mathAnswer}.`;}mathIndex+=1;mathScore.textContent=`${mathPoints} / 10`;setTimeout(nextMath,650);});mathOptions.append(button);});};
  $('[data-math-start]').addEventListener('click',()=>{mathIndex=0;mathPoints=0;mathScore.textContent='0 / 10';mathStatus.textContent='Choose the correct answer.';nextMath();});

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
