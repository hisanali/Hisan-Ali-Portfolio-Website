import { createClient } from '@supabase/supabase-js';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const bridge = window.ticGameBridge;
  if (!bridge) return;

  const nameInput = $('[data-tic-player-name]');
  const roomInput = $('[data-tic-room-input]');
  const lobbyStatus = $('[data-tic-lobby-status]');
  const roomCodeEl = $('[data-tic-room-code]');
  const connectionEl = $('[data-tic-connection]');
  const networkNote = $('[data-tic-network-note]');
  const createButton = $('[data-tic-create-room]');
  const joinButton = $('[data-tic-join-room]');
  const playerEls = {
    X: $('[data-tic-player="X"]'),
    O: $('[data-tic-player="O"]')
  };

  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const clientId = sessionStorage.getItem('tic-client-id') || crypto.randomUUID();
  sessionStorage.setItem('tic-client-id', clientId);

  let realtime = null;
  let channel = null;
  let roomCode = '';
  let role = '';
  let playerName = localStorage.getItem('tic-player-name') || '';
  let connected = false;
  let presences = [];
  let roomCheckTimer = 0;
  let game = freshGame();

  nameInput.value = playerName;

  function freshGame() {
    return { board: Array(9).fill(''), turn: 'X', result: '', revision: 0 };
  }

  function getWinner(board) {
    for (const [a,b,c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every(Boolean) ? 'draw' : '';
  }

  function normalizeCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
  }

  function makeCode() {
    return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  }

  function setLobbyStatus(message, error = false) {
    lobbyStatus.textContent = message;
    lobbyStatus.classList.toggle('is-error', error);
  }

  function setBusy(busy) {
    createButton.disabled = busy;
    joinButton.disabled = busy;
    createButton.textContent = busy ? 'Connecting…' : 'Create a room ↗';
    joinButton.textContent = busy ? 'Connecting…' : 'Join room';
  }

  async function getRealtime() {
    if (realtime) return realtime;
    const response = await fetch('/api/multiplayer/config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Online play is temporarily unavailable.');
    const config = await response.json();
    realtime = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    return realtime;
  }

  function saveHostState() {
    if (role === 'X' && roomCode) localStorage.setItem(`tic-room-state:${roomCode}`, JSON.stringify(game));
  }

  function loadHostState(code, reset) {
    if (reset) return freshGame();
    try {
      const stored = JSON.parse(localStorage.getItem(`tic-room-state:${code}`) || 'null');
      if (stored && Array.isArray(stored.board) && stored.board.length === 9) {
        return { board: stored.board, turn: stored.turn === 'O' ? 'O' : 'X', result: stored.result || '', revision: Number(stored.revision) || 0 };
      }
    } catch (_) {}
    return freshGame();
  }

  function updateUrl(code = '') {
    const url = new URL(window.location.href);
    if (code) url.searchParams.set('tic', code);
    else url.searchParams.delete('tic');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function playerFor(mark) {
    return presences
      .filter((presence) => presence.role === mark)
      .sort((a, b) => String(a.joinedAt).localeCompare(String(b.joinedAt)))[0] || null;
  }

  function updatePlayers() {
    for (const mark of ['X', 'O']) {
      const player = playerFor(mark);
      const strong = playerEls[mark].querySelector('strong');
      const small = playerEls[mark].querySelector('small');
      strong.textContent = player ? `${player.name}${player.clientId === clientId ? ' (you)' : ''}` : 'Waiting…';
      small.textContent = mark === 'X' ? 'Room host' : 'Opponent';
    }
    const opponentReady = Boolean(playerFor(role === 'X' ? 'O' : 'X'));
    connectionEl.textContent = connected ? (opponentReady ? 'Both players live' : 'Waiting for player') : 'Connecting…';
    connectionEl.classList.toggle('is-live', connected && opponentReady);
    renderGame();
  }

  function renderGame(message = '') {
    if (!roomCode) return;
    const x = playerFor('X');
    const o = playerFor('O');
    const bothPlayers = Boolean(x && o);
    let status = message;
    let canPlay = false;
    let over = Boolean(game.result);

    if (!status) {
      if (!bothPlayers) status = role === 'X' ? 'Waiting for opponent' : 'Waiting for room host';
      else if (game.result === 'draw') status = 'Draw game';
      else if (game.result) status = game.result === role ? 'You won!' : `${playerFor(game.result)?.name || 'Opponent'} won`;
      else if (game.turn === role) { status = 'Your turn'; canPlay = true; }
      else status = `${playerFor(game.turn)?.name || 'Opponent'}’s turn`;
    }

    networkNote.hidden = false;
    networkNote.textContent = `${role ? `You are ${role}` : 'Spectating'} · ${connected ? 'Live room' : 'Reconnecting…'}`;
    bridge.applyOnlineState({ board: game.board, status, canPlay, over, resetLabel: game.result ? 'Play again' : 'Request rematch' });
  }

  async function send(event, payload) {
    if (!channel || !connected) return;
    await channel.send({ type: 'broadcast', event, payload });
  }

  async function sendState() {
    saveHostState();
    await send('state', { ...game, hostId: clientId });
  }

  function commitMove(index, mark, actorId) {
    if (role !== 'X' || game.result || game.turn !== mark || game.board[index]) return;
    if (mark === 'O' && playerFor('O')?.clientId !== actorId) return;
    const next = [...game.board];
    next[index] = mark;
    const result = getWinner(next);
    game = { board: next, turn: mark === 'X' ? 'O' : 'X', result, revision: game.revision + 1 };
    renderGame();
    sendState();
  }

  function flattenPresence() {
    if (!channel) return [];
    return Object.values(channel.presenceState()).flat().filter((item) => item && item.clientId);
  }

  async function handlePresenceSync() {
    presences = flattenPresence();
    const duplicate = presences.find((presence) => presence.role === role && presence.clientId !== clientId);
    if (duplicate) {
      const message = role === 'X' ? 'That room code is already in use. Create another room.' : 'This room already has two players.';
      await leaveRoom(false);
      setLobbyStatus(message, true);
      return;
    }
    updatePlayers();
    if (role === 'X') sendState();
    else send('request-state', { clientId });
  }

  async function joinChannel(code, nextRole, resetHost = false) {
    setBusy(true);
    setLobbyStatus('Opening the live room…');
    try {
      const client = await getRealtime();
      if (channel) await client.removeChannel(channel);
      roomCode = normalizeCode(code);
      role = nextRole;
      connected = false;
      presences = [];
      playerName = nameInput.value.trim() || (role === 'X' ? 'Room host' : 'Guest player');
      nameInput.value = playerName;
      localStorage.setItem('tic-player-name', playerName);
      sessionStorage.setItem('tic-room-session', JSON.stringify({ roomCode, role, playerName }));
      game = role === 'X' ? loadHostState(roomCode, resetHost) : freshGame();
      roomCodeEl.textContent = roomCode;
      updateUrl(roomCode);
      bridge.showOnlineRoom();
      connectionEl.textContent = 'Connecting…';
      networkNote.textContent = 'Connecting to the room…';

      channel = client.channel(`tic-room:${roomCode}`, {
        config: { broadcast: { ack: true, self: false }, presence: { key: clientId }, private: false }
      });

      channel
        .on('presence', { event: 'sync' }, handlePresenceSync)
        .on('broadcast', { event: 'state' }, ({ payload }) => {
          if (role !== 'O' || !payload || !Array.isArray(payload.board) || payload.board.length !== 9) return;
          if (Number(payload.revision) < game.revision) return;
          game = { board: payload.board, turn: payload.turn, result: payload.result || '', revision: Number(payload.revision) || 0 };
          renderGame();
        })
        .on('broadcast', { event: 'request-state' }, () => { if (role === 'X') sendState(); })
        .on('broadcast', { event: 'move-request' }, ({ payload }) => {
          if (role === 'X' && payload) commitMove(Number(payload.index), 'O', payload.clientId);
        })
        .on('broadcast', { event: 'rematch-request' }, () => { if (role === 'X') resetOnlineGame(); });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          connected = true;
          await channel.track({ clientId, role, name: playerName, joinedAt: new Date().toISOString() });
          updatePlayers();
          if (role === 'O') send('request-state', { clientId });
          clearTimeout(roomCheckTimer);
          roomCheckTimer = window.setTimeout(() => {
            if (role === 'O' && !playerFor('X')) renderGame('Host not connected yet');
          }, 5500);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          connected = false;
          connectionEl.textContent = 'Connection interrupted';
          connectionEl.classList.remove('is-live');
          renderGame('Reconnecting to room…');
        } else if (status === 'CLOSED') {
          connected = false;
          updatePlayers();
        }
      });
    } catch (error) {
      await leaveRoom(false);
      setLobbyStatus(error instanceof Error ? error.message : 'Could not open the room.', true);
    } finally {
      setBusy(false);
    }
  }

  function resetOnlineGame() {
    if (role !== 'X') return;
    game = { ...freshGame(), revision: game.revision + 1 };
    renderGame();
    sendState();
  }

  async function leaveRoom(clearUrl = true) {
    clearTimeout(roomCheckTimer);
    if (channel && realtime) await realtime.removeChannel(channel);
    channel = null;
    connected = false;
    presences = [];
    roomCode = '';
    role = '';
    game = freshGame();
    sessionStorage.removeItem('tic-room-session');
    if (clearUrl) updateUrl();
    bridge.showOnlineLobby();
    bridge.applyOnlineState({ board: game.board, status: 'Create or join a room', canPlay: false });
    setLobbyStatus('No account needed.');
  }

  async function shareRoom() {
    if (!roomCode) return;
    const url = `${window.location.origin}/games/?tic=${roomCode}#game-library`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Play Tic-Tac-Toe with me', text: `Join my room ${roomCode}`, url });return; } catch (_) {}
    }
    await navigator.clipboard.writeText(url);
    networkNote.textContent = 'Invite link copied.';
  }

  createButton.addEventListener('click', () => joinChannel(makeCode(), 'X', true));
  joinButton.addEventListener('click', () => {
    const code = normalizeCode(roomInput.value);
    roomInput.value = code;
    if (code.length !== 6) { setLobbyStatus('Enter the complete six-character room code.', true);return; }
    joinChannel(code, 'O');
  });
  roomInput.addEventListener('input', () => { roomInput.value = normalizeCode(roomInput.value); });
  roomInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') joinButton.click(); });
  $('[data-tic-copy-room]').addEventListener('click', async () => { if (!roomCode) return;await navigator.clipboard.writeText(roomCode);networkNote.textContent = 'Room code copied.'; });
  $('[data-tic-share-room]').addEventListener('click', shareRoom);
  $('[data-tic-leave-room]').addEventListener('click', () => leaveRoom());

  window.addEventListener('tic:online-open', () => {
    const invitation = normalizeCode(new URL(window.location.href).searchParams.get('tic'));
    const stored = (() => { try { return JSON.parse(sessionStorage.getItem('tic-room-session') || 'null'); } catch (_) { return null; } })();
    bridge.showOnlineLobby();
    if (invitation) {
      roomInput.value = invitation;
      setLobbyStatus('Invitation ready. Add your name and join the room.');
    } else setLobbyStatus('No account needed.');
    if (stored?.roomCode && stored?.role && normalizeCode(stored.roomCode) === invitation) {
      nameInput.value = stored.playerName || nameInput.value;
      joinChannel(stored.roomCode, stored.role, false);
    }
  });
  window.addEventListener('tic:online-close', () => { if (roomCode) leaveRoom(false); });
  window.addEventListener('tic:online-cell', ({ detail }) => {
    const index = Number(detail?.index);
    if (!connected || !Number.isInteger(index) || index < 0 || index > 8 || game.board[index] || game.result || game.turn !== role) return;
    if (role === 'X') commitMove(index, 'X', clientId);
    else { renderGame('Move sent…');send('move-request', { index, clientId, revision: game.revision }); }
  });
  window.addEventListener('tic:online-rematch', () => {
    if (!roomCode || !connected) return;
    if (role === 'X') resetOnlineGame();
    else { renderGame('Rematch requested…');send('rematch-request', { clientId }); }
  });

  const invitation = normalizeCode(new URL(window.location.href).searchParams.get('tic'));
  if (invitation) {
    roomInput.value = invitation;
    document.querySelector('[data-game="tic"]')?.click();
    bridge.openOnline();
  }
})();
