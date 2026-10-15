import { Chess, WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, typeOf, colorOf, makePiece } from './engine.js?v=1';
import { ChessScene, THEMES, squareToWorld } from './scene.js?v=1';
import { Room, cleanCode, makeCode, playerId } from './online.js?v=1';

const $ = id => document.getElementById(id);
const GLYPH = { [KING]: '♚', [QUEEN]: '♛', [ROOK]: '♜', [BISHOP]: '♝', [KNIGHT]: '♞', [PAWN]: '♟' };
const glyph = type => GLYPH[type] + '︎';
const VALUE = { [PAWN]: 1, [KNIGHT]: 3, [BISHOP]: 3, [ROOK]: 5, [QUEEN]: 9, [KING]: 0 };
const LEVELS = {
  casual: { label: 'Casual', depth: 1, timeMs: 300, randomness: 140 },
  club: { label: 'Club', depth: 3, timeMs: 700, randomness: 30 },
  expert: { label: 'Expert', depth: 5, timeMs: 1600, randomness: 0 },
  master: { label: 'Master', depth: 9, timeMs: 3200, randomness: 0 }
};
const CLOCKS = { none: null, '3+2': [180000, 2000], '5+0': [300000, 0], '10+0': [600000, 0] };
const colorName = c => c === WHITE ? 'White' : 'Black';

const settings = { mode: 'ai', difficulty: 'club', color: 'white', clock: 'none', onlineClock: '10+0', onlineColor: 'random', rotate: 'off', theme: 'walnut', sound: true, name: '' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('chess-settings') || '{}')); } catch {}
if (!THEMES[settings.theme]) settings.theme = 'walnut';
const save = () => { try { localStorage.setItem('chess-settings', JSON.stringify(settings)); } catch {} };

/* ---------- Sound ---------- */
const sound = {
  ctx() { if (!this.c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.c = new A(); } if (this.c.state === 'suspended') this.c.resume(); return this.c; },
  knock(vol = .55, pitch = 1) {
    if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, len = .1;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 7);
    const src = c.createBufferSource(); src.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 * pitch; f.Q.value = 2.2;
    const g = c.createGain(); g.gain.value = vol; src.connect(f).connect(g).connect(c.destination); src.start(t);
    const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(210 * pitch, t); o.frequency.exponentialRampToValueAtTime(80, t + .13);
    og.gain.setValueAtTime(vol * .55, t); og.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(og).connect(c.destination); o.start(t); o.stop(t + .18);
  },
  chime(freqs, dur = .9, vol = .12) {
    if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime;
    freqs.forEach((fr, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * .07); g.gain.linearRampToValueAtTime(vol, t + i * .07 + .02); g.gain.exponentialRampToValueAtTime(.0008, t + i * .07 + dur); o.connect(g).connect(c.destination); o.start(t + i * .07); o.stop(t + i * .07 + dur + .05); });
  }
};

/* ---------- State ---------- */
const view = new ChessScene($('scene'));
view.setPosition(new Chess().board);
view.orbitIdle = true;
document.fonts?.ready.then(() => view.setTheme(settings.theme));

let mode = null, game = new Chess(), my = WHITE, bottom = WHITE, result = null, started = false;
let selected = -1, legal = [], busy = false, aiThinking = false, aiJob = 0, queue = Promise.resolve();
let clocks = null, hint = null, names = { [WHITE]: 'White', [BLACK]: 'Black' };
let room = null, online = null, helloTimer = 0, heartbeat = 0;

const worker = new Worker(new URL('./ai.worker.js?v=1', import.meta.url), { type: 'module' });
const pending = new Map(); let nextId = 1;
worker.onmessage = ({ data }) => { pending.get(data.id)?.(data.result); pending.delete(data.id); };
const think = (fen, options) => new Promise(resolve => { const id = nextId++; pending.set(id, resolve); worker.postMessage({ id, fen, options }); });

/* ---------- Game flow ---------- */
function capturedBy(color) { return game.played.filter(m => m.captured && colorOf(m.piece) === color).map(m => m.captured); }

function rebuild() {
  view.setPosition(game.board);
  view.setCapturedFromCounts(game.played.filter(m => m.captured).map(m => m.captured));
  view.setLastMove(game.played.at(-1) || null);
  view.setCheck(!result && game.inCheck() ? game.kings[game.turn] : -1);
  clearSelection(); render();
}

function newGame({ moves = [], cameraMove = true } = {}) {
  aiJob++; aiThinking = false; result = null; hint = null; view.setHint(null);
  game = new Chess();
  for (const uci of moves) if (!game.moveUci(uci)) break;
  const tc = mode === 'local' ? CLOCKS[settings.clock] : mode === 'online' ? online?.tc : null;
  clocks = tc ? { t: [tc[0], tc[0]], inc: tc[1], last: performance.now() } : null;
  if (mode === 'online' && online?.clocks) clocks.t = [...online.clocks];
  started = true; $('result').hidden = true; hideOffer();
  rebuild();
  if (cameraMove) { view.orbitIdle = false; view.moveCamera(view.viewFor(bottom), 1700); }
  if (mode === 'ai' && game.turn !== my) setTimeout(aiMove, cameraMove ? 1500 : 300);
}

function sans() { const g = new Chess(); return game.played.map(m => { const legalMove = g.legalMoves().find(o => o.from === m.from && o.to === m.to && o.promo === m.promo); const s = g.san(legalMove); g.make(legalMove); return s; }); }

function canHumanMove() {
  if (!started || result || busy) return false;
  if (mode === 'local') return true;
  if (mode === 'ai') return game.turn === my && !aiThinking;
  if (mode === 'online') return game.turn === my && !!room?.peer;
  return false;
}

function clearSelection() { if (selected >= 0) view.lift(selected, 0); selected = -1; legal = []; view.showLegal([]); view.placeMark(view.selected, -1); }
function select(sq) {
  clearSelection(); selected = sq; legal = game.legalMoves(sq);
  view.placeMark(view.selected, sq); view.showLegal(legal); view.lift(sq, .2);
}

function play(m, { remote = false, dragged = false, fast = false } = {}) {
  const run = async () => {
    if (result) return;
    const real = game.legalMoves(m.from).find(o => o.to === m.to && (o.promo || 0) === (m.promo || 0));
    if (!real) return false;
    const mover = game.turn;
    real.san = game.san(real); game.make(real);
    if (clocks) { if (game.played.length > 1) clocks.t[mover] += clocks.inc; clocks.last = performance.now(); if (remote && m.clock) clocks.t = [...m.clock]; }
    if (mode === 'online' && !remote) { room.send('move', { gameId: online.gameId, ply: game.played.length - 1, uci: game.uci(real), clock: clocks?.t }); if (room.host) persistHost(); }
    if (mode === 'online' && remote && room.host) persistHost();
    clearSelection(); hint = null; view.setHint(null); view.setCheck(-1);
    busy = true; render();
    const startAt = dragged ? view.pieces.get(real.from)?.position.clone() : null;
    if (startAt) view.dragging = null;
    await view.animateMove(real, fast, startAt);
    busy = false;
    view.setLastMove(real);
    const status = game.status();
    if (real.captured) { sound.knock(.75, .85); setTimeout(() => sound.knock(.4, 1.25), 70); } else if (real.flags & 4) { sound.knock(.55); setTimeout(() => sound.knock(.45, 1.1), 120); } else sound.knock();
    if (status.over) finish(status.result, status.reason);
    else {
      if (status.check) { view.setCheck(game.kings[game.turn]); sound.chime([660, 990], .5, .07); }
      if (mode === 'ai' && game.turn !== my) aiMove();
      if (mode === 'local' && settings.rotate === 'on') { bottom = game.turn; view.moveCamera(view.viewFor(bottom), 1100); }
    }
    render();
    return true;
  };
  queue = queue.then(run, run);
  return queue;
}

async function humanMove(from, to, dragged) {
  let options = legal.filter(m => m.from === from && m.to === to);
  if (!options.length) return false;
  let move = options[0];
  if (options.length > 1) {
    const type = await choosePromotion(game.turn);
    if (!type) { clearSelection(); if (dragged) snapBack(from); return true; }
    move = options.find(m => typeOf(m.promo) === type);
  }
  await play(move, { dragged });
  return true;
}

async function aiMove() {
  if (mode !== 'ai' || result || game.turn === my) return;
  const job = ++aiJob; aiThinking = true; render();
  const startedAt = performance.now(), level = LEVELS[settings.difficulty] || LEVELS.club;
  const res = await think(game.fen(), { ...level, history: game.stack.map(s => `${s.h1},${s.h2}`) });
  const wait = Math.max(0, 550 - (performance.now() - startedAt));
  await new Promise(r => setTimeout(r, wait));
  if (job !== aiJob || mode !== 'ai' || result) return;
  aiThinking = false;
  if (!res) return render();
  const from = squareFromName(res.uci.slice(0, 2)), to = squareFromName(res.uci.slice(2, 4));
  const promo = res.uci[4] ? makePiece(game.turn, ' pnbrqk'.indexOf(res.uci[4])) : 0;
  play({ from, to, promo });
}
const squareFromName = s => (s.charCodeAt(0) - 97) + (s.charCodeAt(1) - 49) * 8;

function finish(winner, reason, { announce = true, fromNetwork = false } = {}) {
  if (result) return;
  result = { winner, reason }; aiJob++; aiThinking = false; clearSelection(); view.setCheck(-1);
  if (mode === 'online' && room?.host) { online.result = result; persistHost(); }
  render();
  if (!announce) return;
  const winColor = winner === 'white' ? WHITE : winner === 'black' ? BLACK : -1;
  if (reason === 'checkmate') view.topple(game.kings[game.turn]);
  const youWon = winColor >= 0 && (mode === 'local' || winColor === my);
  if (winColor >= 0 && (mode === 'local' || youWon)) view.confetti();
  sound.chime(winColor < 0 ? [523, 659, 784] : youWon ? [523, 659, 784, 1047] : [392, 311, 262], 1.4, .1);
  setTimeout(() => showResult(winColor, reason), reason === 'checkmate' ? 1300 : 500);
}

function showResult(winColor, reason) {
  const label = $('result-label'), title = $('result-title'), why = $('result-reason');
  if (winColor < 0) { label.textContent = 'Game drawn'; title.textContent = 'Draw'; }
  else if (mode === 'local') { label.textContent = `${colorName(winColor)} wins`; title.textContent = reason === 'checkmate' ? 'Checkmate' : reason === 'time' ? 'Time’s up' : `${colorName(winColor)} wins`; }
  else if (winColor === my) { label.textContent = 'Victory'; title.textContent = reason === 'checkmate' ? 'Checkmate!' : 'You win!'; }
  else { label.textContent = mode === 'ai' ? `${LEVELS[settings.difficulty].label} computer wins` : `${names[winColor]} wins`; title.textContent = reason === 'checkmate' ? 'Checkmated' : 'Defeat'; }
  const reasons = { checkmate: 'by checkmate', resignation: 'by resignation', time: 'on time', stalemate: 'Stalemate — no legal moves remain.', agreement: 'Both players agreed to a draw.', 'fifty-move rule': 'Fifty moves without a capture or pawn move.', 'insufficient material': 'Neither side can deliver checkmate.', 'threefold repetition': 'The same position appeared three times.', abandoned: 'Your opponent left the room.' };
  why.textContent = winColor < 0 ? reasons[reason] || reason : `${colorName(winColor)} wins ${reasons[reason] || reason} · ${Math.ceil(game.played.length / 2)} moves`;
  $('again').textContent = mode === 'online' ? 'Rematch' : 'Play again';
  $('result').hidden = false;
}

function undo() {
  if (mode === 'online' || !started || busy || !game.played.length) return;
  aiJob++; aiThinking = false; result = null; $('result').hidden = true;
  game.unmake();
  if (mode === 'ai') while (game.turn !== my && game.played.length) game.unmake();
  hint = null; view.setHint(null); rebuild();
  if (mode === 'ai' && game.turn !== my) aiMove();
}

async function showHint() {
  if (!canHumanMove() || mode === 'online') return;
  $('btn-hint').disabled = true; setStatus('Looking for a strong move…');
  const ply = game.played.length;
  const res = await think(game.fen(), { depth: 5, timeMs: 1200, history: game.stack.map(s => `${s.h1},${s.h2}`) });
  $('btn-hint').disabled = false;
  if (!res || game.played.length !== ply) return render();
  hint = { from: squareFromName(res.uci.slice(0, 2)), to: squareFromName(res.uci.slice(2, 4)) };
  view.setHint(hint); select(hint.from); render();
}

function resign() {
  if (!started || result) return;
  if (mode === 'online') { if (!confirm('Resign this game?')) return; room.send('resign', { gameId: online.gameId, color: my }); finish(my === WHITE ? 'black' : 'white', 'resignation'); return; }
  const loser = mode === 'ai' ? my : game.turn;
  if (!confirm(`Resign as ${colorName(loser)}?`)) return;
  finish(loser === WHITE ? 'black' : 'white', 'resignation');
}

function flip() { bottom ^= 1; view.moveCamera(view.viewFor(bottom), 1100); render(); }

/* ---------- Clocks ---------- */
setInterval(() => {
  if (!clocks || !started || result || game.played.length < 1) { if (clocks) clocks.last = performance.now(); return; }
  const now = performance.now(); clocks.t[game.turn] -= now - clocks.last; clocks.last = now;
  const side = game.turn;
  if (clocks.t[side] <= 0) {
    clocks.t[side] = 0;
    if (mode === 'local') finish(side === WHITE ? 'black' : 'white', 'time');
    else if (mode === 'online' && (side === my || clocks.t[side] <= 0 && !room?.peer)) { room.send('flag', { gameId: online.gameId, color: side }); finish(side === WHITE ? 'black' : 'white', 'time'); }
  }
  renderClocks();
}, 100);
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s < 20 && ms > 0 && ms < 20000 ? (ms / 1000).toFixed(1) : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function renderClocks() {
  for (const [id, color] of [['card-top', bottom ^ 1], ['card-bottom', bottom]]) {
    const el = $(id).querySelector('.clock'); el.hidden = !clocks;
    if (clocks) { el.textContent = fmt(clocks.t[color]); el.classList.toggle('is-low', clocks.t[color] < 20000); el.classList.toggle('is-running', !result && game.turn === color && game.played.length > 0); }
  }
}

/* ---------- Rendering the HUD ---------- */
function setStatus(text) { $('status').textContent = text; }
let insetKey = '';
function layout(force = false) {
  const w = innerWidth, phone = matchMedia('(max-width: 900px) and (orientation: portrait), (max-width: 600px)').matches;
  const insets = !started ? {} : phone ? { top: 128, bottom: mode === 'online' ? 236 : 196 } : w <= 980 && w > innerHeight ? { right: 252 } : { right: w <= 1180 ? 300 : 340, left: w >= 1500 ? 0 : 40 };
  const key = JSON.stringify(insets) + w + 'x' + innerHeight;
  if (key === insetKey && !force) return;
  insetKey = key; view.setInsets(insets);
  if (started && !view.cameraTween) view.moveCamera(view.viewFor(bottom), 500);
}
addEventListener('resize', () => layout());
function render() {
  if (document.body.classList.contains('is-playing') !== started) { document.body.classList.toggle('is-playing', started); layout(); }
  document.body.dataset.mode = mode || '';
  const level = LEVELS[settings.difficulty];
  if (mode === 'ai') { names = { [my]: settings.name || 'You', [my ^ 1]: `Computer` }; }
  else if (mode === 'local') names = { [WHITE]: 'White', [BLACK]: 'Black' };
  const diff = capturedBy(WHITE).reduce((a, p) => a + VALUE[typeOf(p)], 0) - capturedBy(BLACK).reduce((a, p) => a + VALUE[typeOf(p)], 0);
  for (const [id, color] of [['card-top', bottom ^ 1], ['card-bottom', bottom]]) {
    const card = $(id);
    card.querySelector('.avatar').textContent = glyph(KING); card.querySelector('.avatar').dataset.color = color === WHITE ? 'w' : 'b';
    card.querySelector('.name').textContent = names[color];
    let sub = mode === 'local' ? (started && !result && game.turn === color ? 'To move' : 'Pass & play') : colorName(color);
    if (mode === 'ai') sub = color === my ? `${colorName(color)} · you` : `${colorName(color)} · ${level.label}`;
    if (mode === 'online') sub = color === my ? `${colorName(color)} · you` : `${colorName(color)} · ${room?.peer ? 'online' : 'offline'}`;
    card.querySelector('.sub').textContent = sub;
    const caps = capturedBy(color).sort((a, b) => VALUE[typeOf(b)] - VALUE[typeOf(a)]);
    const adv = color === WHITE ? diff : -diff;
    card.querySelector('.caps').innerHTML = caps.map(p => `<i data-c="${colorOf(p) ? 'b' : 'w'}">${glyph(typeOf(p))}</i>`).join('') + (adv > 0 ? `<b>+${adv}</b>` : '');
    card.classList.toggle('is-turn', started && !result && game.turn === color);
    card.classList.toggle('is-thinking', aiThinking && game.turn === color);
  }
  renderClocks();
  const list = sans(), moves = $('moves');
  moves.innerHTML = Array.from({ length: Math.ceil(list.length / 2) }, (_, i) => `<li><span>${i + 1}.</span><b class="${i * 2 === list.length - 1 ? 'is-last' : ''}">${list[i * 2]}</b><b class="${i * 2 + 1 === list.length - 1 ? 'is-last' : ''}">${list[i * 2 + 1] || ''}</b></li>`).join('') || '<li class="is-empty">Moves will appear here</li>';
  moves.scrollTop = moves.scrollHeight; moves.scrollLeft = moves.scrollWidth;
  let status;
  if (!started) status = '';
  else if (result) status = result.winner === 'draw' ? `Draw · ${result.reason}` : `${result.winner === 'white' ? 'White' : 'Black'} wins · ${result.reason}`;
  else if (mode === 'online' && !room?.peer) status = 'Waiting for your opponent to reconnect…';
  else if (aiThinking) status = 'Computer is thinking…';
  else if (mode === 'local') status = `${colorName(game.turn)} to move${game.inCheck() ? ' · check!' : ''}`;
  else status = game.turn === my ? `Your move${game.inCheck() ? ' — you’re in check!' : ''}` : `${names[game.turn]} is thinking…`;
  setStatus(status);
  $('btn-undo').hidden = mode === 'online'; $('btn-undo').disabled = !game.played.length || busy;
  $('btn-hint').hidden = mode === 'online'; $('btn-hint').disabled = !canHumanMove();
  $('btn-draw').hidden = mode !== 'online'; $('btn-draw').disabled = !!result || !room?.peer;
  $('btn-resign').disabled = !!result || !started;
  $('btn-new').querySelector('span').textContent = mode === 'online' ? 'Rematch' : 'New game'; $('btn-new').hidden = mode === 'online' && !result;
  $('room-bar').hidden = mode !== 'online'; if (room?.code) $('room-code').textContent = room.code;
}

/* ---------- Pointer input ---------- */
const canvas = $('scene');
let down = null, dragging = false;
canvas.addEventListener('pointerdown', e => {
  if (!started || e.button > 0) return;
  const hit = view.pick(e.clientX, e.clientY);
  if (hit && selected >= 0 && !legal.some(m => m.to === hit.square) && legal.some(m => m.to === hit.boardSquare)) hit.square = hit.boardSquare;
  down = { x: e.clientX, y: e.clientY, hit, wasSelected: selected, id: e.pointerId, piece: -1 };
  if (!hit || !canHumanMove()) return;
  const p = game.board[hit.square];
  if (selected >= 0 && legal.some(m => m.to === hit.square)) { view.controls.enabled = false; return; }
  if (p && colorOf(p) === game.turn) {
    view.controls.enabled = false; if (selected !== hit.square) select(hit.square); down.piece = hit.square;
    canvas.setPointerCapture(e.pointerId);
  }
}, { capture: true });

canvas.addEventListener('pointermove', e => {
  if (down && down.piece >= 0 && down.id === e.pointerId) {
    if (!dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) { dragging = true; view.dragging = view.pieces.get(down.piece); canvas.style.cursor = 'grabbing'; }
    if (dragging && view.dragging) {
      const p = view.pointOnPlane(e.clientX, e.clientY, .55);
      if (p) { view.dragging.position.set(Math.max(-4.4, Math.min(4.4, p.x)), .55, Math.max(-4.4, Math.min(4.4, p.z))); }
      const f = Math.floor(view.dragging.position.x + 4), r = Math.floor(4 - view.dragging.position.z);
      view.placeMark(view.hover, f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1, .007);
    }
    return;
  }
  if (!started || e.pointerType !== 'mouse') return;
  const hit = view.pick(e.clientX, e.clientY);
  const can = hit && canHumanMove() && ((game.board[hit.square] && colorOf(game.board[hit.square]) === game.turn) || legal.some(m => m.to === hit.square));
  canvas.style.cursor = can ? 'pointer' : '';
  view.placeMark(view.hover, can ? hit.square : -1, .007);
});

function snapBack(sq) {
  const mesh = view.pieces.get(sq); if (!mesh) return;
  const from = mesh.position.clone(), to = squareToWorld(sq); mesh.userData.liftNow = 0;
  view.tween(220, t => mesh.position.lerpVectors(from, to, t), () => mesh.position.copy(to));
}

canvas.addEventListener('pointerup', async e => {
  if (!down || down.id !== e.pointerId) return;
  const info = down; down = null; view.controls.enabled = true; canvas.style.cursor = ''; view.placeMark(view.hover, -1);
  if (dragging) {
    dragging = false; const mesh = view.dragging;
    const f = Math.floor(mesh.position.x + 4), r = Math.floor(4 - mesh.position.z), target = r * 8 + f;
    if (target !== info.piece && legal.some(m => m.to === target)) { await humanMove(info.piece, target, true); }
    else { view.dragging = null; snapBack(info.piece); select(info.piece); }
    view.dragging = null; return;
  }
  if (Math.hypot(e.clientX - info.x, e.clientY - info.y) > 7 || !info.hit) { if (!info.hit && Math.hypot(e.clientX - info.x, e.clientY - info.y) <= 7) clearSelection(); return; }
  const sq = info.hit.square;
  if (selected >= 0 && legal.some(m => m.to === sq) && canHumanMove()) { await humanMove(selected, sq, false); return; }
  if (info.piece >= 0 && info.wasSelected === info.piece) { clearSelection(); return; }
  if (info.piece < 0) clearSelection();
});
canvas.addEventListener('pointercancel', () => { down = null; view.controls.enabled = true; if (dragging && selected >= 0) snapBack(selected); dragging = false; view.dragging = null; });
addEventListener('keydown', e => { if (e.key === 'Escape') clearSelection(); if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); } });

/* ---------- Promotion ---------- */
function choosePromotion(color) {
  return new Promise(resolve => {
    const box = $('promo'), row = box.querySelector('.promo-row');
    row.innerHTML = [QUEEN, ROOK, BISHOP, KNIGHT].map(t => `<button type="button" data-type="${t}" data-c="${color ? 'b' : 'w'}" aria-label="${{ [QUEEN]: 'Queen', [ROOK]: 'Rook', [BISHOP]: 'Bishop', [KNIGHT]: 'Knight' }[t]}">${glyph(t)}</button>`).join('');
    box.hidden = false;
    const done = value => { box.hidden = true; box.onclick = null; resolve(value); };
    box.onclick = e => { const b = e.target.closest('button[data-type]'); if (b) done(Number(b.dataset.type)); else if (e.target === box) done(0); };
  });
}

/* ---------- Offers & toasts ---------- */
let toastTimer = 0;
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800); }
let offerHandler = null;
function showOffer(text, onAccept, onDecline) { $('offer-text').textContent = text; $('offer').hidden = false; offerHandler = { onAccept, onDecline }; }
function hideOffer() { $('offer').hidden = true; offerHandler = null; }
$('offer-accept').onclick = () => { const h = offerHandler; hideOffer(); h?.onAccept?.(); };
$('offer-decline').onclick = () => { const h = offerHandler; hideOffer(); h?.onDecline?.(); };

/* ---------- Online ---------- */
function persistHost() {
  if (!room?.host || !online) return;
  online.moves = game.played.map(m => game.uci(m)); online.clocks = clocks ? [...clocks.t] : null;
  try { localStorage.setItem(`chess-room:${room.code}`, JSON.stringify(online)); } catch {}
}
function sendState() { if (room?.host && online) { persistHost(); room.send('state', { state: online }); } }
const resultFromState = r => r ? { winner: r.winner, reason: r.reason } : null;

function adoptState(s) {
  const firstTime = !online || online.gameId !== s.gameId;
  online = s; my = s.white === room.id ? WHITE : BLACK;
  names = { [WHITE]: s.names[s.white] || 'White', [BLACK]: s.names[s.black] || 'Black' };
  const local = game.played.map(m => game.uci(m));
  if (firstTime || !started) {
    bottom = my; hideWaiting(); mode = 'online'; newGame({ moves: s.moves, cameraMove: true });
  } else if (s.moves.length === local.length + 1 && local.every((u, i) => u === s.moves[i])) {
    const g = new Chess(game.fen()); const m = g.moveUci(s.moves.at(-1)); if (m) play({ from: m.from, to: m.to, promo: m.promo, clock: s.clocks }, { remote: true });
  } else if (s.moves.length !== local.length || !local.every((u, i) => u === s.moves[i])) {
    result = null; game = new Chess(); s.moves.forEach(u => game.moveUci(u)); rebuild();
  }
  if (s.result && !result) finish(s.result.winner, s.result.reason, { announce: true });
  render();
}

function onMessage(msg) {
  if (!online && !room.host && msg.type !== 'state' && msg.type !== 'full') return;
  switch (msg.type) {
    case 'hello':
      if (!room.host) return;
      if (online.guest && online.guest !== msg.from && room.peer && room.peer.id === online.guest) { room.send('full', { to: msg.from }); return; }
      if (online.guest !== msg.from) { const guestColor = online.white ? 'black' : 'white'; online[guestColor] = msg.from; online.guest = msg.from; }
      online.names[msg.from] = String(msg.name || 'Guest').slice(0, 24);
      names = { [WHITE]: online.names[online.white] || 'White', [BLACK]: online.names[online.black] || 'Black' };
      sendState();
      if (!started) { hideWaiting(); mode = 'online'; bottom = my; newGame({ moves: online.moves }); toast(`${online.names[msg.from]} joined — good luck!`); }
      render(); break;
    case 'full': if (msg.to === room.id) { leaveRoom(); showStart('online'); joinNote('That room already has two players.', true); } break;
    case 'state': if (!room.host && msg.state) { clearInterval(helloTimer); adoptState(msg.state); } break;
    case 'sync': if (room.host) sendState(); break;
    case 'move':
      if (msg.gameId !== online?.gameId) return;
      queue.then(() => {
        if (msg.ply !== game.played.length) { room.host ? sendState() : room.send('sync'); return; }
        const g = new Chess(game.fen()); const m = g.moveUci(String(msg.uci || ''));
        if (!m) { room.host ? sendState() : room.send('sync'); return; }
        play({ from: m.from, to: m.to, promo: m.promo, clock: Array.isArray(msg.clock) ? msg.clock.map(Number) : null }, { remote: true });
      }); break;
    case 'resign': if (msg.gameId === online.gameId) finish(msg.color === WHITE ? 'black' : 'white', 'resignation'); break;
    case 'flag': if (msg.gameId === online.gameId) finish(msg.color === WHITE ? 'black' : 'white', 'time'); break;
    case 'draw-offer': if (!result) showOffer(`${names[my ^ 1]} offers a draw`, () => { room.send('draw-accept', { gameId: online.gameId }); finish('draw', 'agreement'); }, () => room.send('draw-decline')); break;
    case 'draw-accept': if (msg.gameId === online.gameId) finish('draw', 'agreement'); break;
    case 'draw-decline': toast('Draw offer declined'); break;
    case 'rematch':
      if (online.rematchMine) { if (room.host) startRematch(); }
      else { online.rematchTheirs = true; showOffer(`${names[my ^ 1]} wants a rematch`, () => requestRematch(), () => {}); }
      break;
  }
}

function requestRematch() {
  if (!online) return;
  online.rematchMine = true;
  if (room.host && online.rematchTheirs) { startRematch(); return; }
  room.send('rematch'); toast('Rematch requested…');
}
function startRematch() {
  const prev = online;
  online = { ...prev, gameId: makeCode(), white: prev.black, black: prev.white, moves: [], result: null, clocks: prev.tc ? [prev.tc[0], prev.tc[0]] : null, rematchMine: false, rematchTheirs: false };
  my = online.white === room.id ? WHITE : BLACK; bottom = my;
  sendState(); newGame({ moves: [] });
}

function onPresence(peer, previous) {
  if (peer && !previous) { if (room.host && online?.guest) sendState(); if (started) toast(`${peer.name} is connected`); }
  if (!peer && previous && started && !result) toast('Your opponent disconnected — waiting for them to return');
  if (!room.host && peer && !started) room.send('hello', { name: room.name });
  render();
}

async function hostRoom() {
  const name = $('online-name').value.trim() || 'Player';
  settings.name = name; save();
  try {
    joinNote('Creating your room…');
    room = new Room({ message: onMessage, presence: onPresence, status: render });
    const code = makeCode(); await room.open(code, true, name);
    const pick = settings.onlineColor === 'random' ? (Math.random() < .5 ? 'white' : 'black') : settings.onlineColor;
    online = { gameId: makeCode(), white: pick === 'white' ? room.id : null, black: pick === 'black' ? room.id : null, guest: null, names: { [room.id]: name }, tc: CLOCKS[settings.onlineClock], clocks: null, moves: [], result: null };
    my = pick === 'white' ? WHITE : BLACK; bottom = my; mode = 'online';
    sessionStorage.setItem('chess-session', JSON.stringify({ code, host: true, name })); persistHost(); setRoomUrl(code);
    showWaiting(code, true);
  } catch (error) { joinNote(error.message || 'Could not create the room.', true); }
}

async function joinRoom(code, name, quiet = false) {
  code = cleanCode(code); name = (name || $('online-name').value).trim() || 'Player';
  if (code.length !== 6) { joinNote('Enter the six-character room code.', true); return; }
  settings.name = name; save();
  try {
    joinNote('Joining…');
    room = new Room({ message: onMessage, presence: onPresence, status: render });
    await room.open(code, false, name); mode = 'online'; online = null;
    sessionStorage.setItem('chess-session', JSON.stringify({ code, host: false, name })); setRoomUrl(code);
    showWaiting(code, false);
    const deadline = Date.now() + 15000;
    clearInterval(helloTimer);
    helloTimer = setInterval(() => {
      if (online) { clearInterval(helloTimer); return; }
      if (Date.now() > deadline) { clearInterval(helloTimer); leaveRoom(); showStart('online'); joinNote('Room not found. Ask your friend to create it and share the code.', true); return; }
      room.send('hello', { name });
    }, 1200);
    room.send('hello', { name });
  } catch (error) { if (!quiet) joinNote(error.message || 'Could not join the room.', true); }
}

async function resumeHost(code, name) {
  let saved = null; try { saved = JSON.parse(localStorage.getItem(`chess-room:${code}`) || 'null'); } catch {}
  if (!saved) return false;
  room = new Room({ message: onMessage, presence: onPresence, status: render });
  await room.open(code, true, name);
  online = saved; my = online.white === room.id ? WHITE : BLACK; bottom = my; mode = 'online';
  if (online.guest) { names = { [WHITE]: online.names[online.white] || 'White', [BLACK]: online.names[online.black] || 'Black' }; newGame({ moves: online.moves }); if (online.result) finish(online.result.winner, online.result.reason, { announce: false }); hideStartScreen(); }
  else showWaiting(code, true);
  return true;
}

function leaveRoom() {
  clearInterval(helloTimer); room?.leave(); room = null; online = null;
  sessionStorage.removeItem('chess-session'); setRoomUrl('');
}
function setRoomUrl(code) { const u = new URL(location.href); if (code) u.searchParams.set('room', code); else u.searchParams.delete('room'); history.replaceState({}, '', u); }
const inviteUrl = () => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('room', room.code); return u.href; };
async function copyInvite() { try { await navigator.clipboard.writeText(inviteUrl()); toast('Invite link copied'); } catch { prompt('Copy this invite link', inviteUrl()); } }
async function shareInvite() { if (navigator.share) { try { await navigator.share({ title: 'Play chess with me', text: `Join my chess room ${room.code}`, url: inviteUrl() }); return; } catch {} } copyInvite(); }

function showWaiting(code, host) {
  hideStartScreen(); $('waiting').hidden = false;
  $('waiting-code').textContent = code; $('waiting-title').textContent = host ? 'Your room is ready' : 'Joining room…';
  $('waiting-text').textContent = host ? 'Share the code or link. The game starts the moment your friend joins.' : 'Connecting to your friend’s board…';
  $('waiting-share').hidden = !host; $('waiting-copy').hidden = !host;
}
function hideWaiting() { $('waiting').hidden = true; }
function joinNote(text, error = false) { const n = $('online-note'); n.textContent = text; n.classList.toggle('is-error', error); }

/* ---------- Start screen ---------- */
function syncSegments() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value))));
  document.querySelectorAll('[data-tab]').forEach(el => el.hidden = el.dataset.tab !== settings.mode);
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === settings.mode)));
  $('start-btn').hidden = settings.mode === 'online';
  $('btn-sound').setAttribute('aria-pressed', String(settings.sound)); $('btn-sound').classList.toggle('is-off', !settings.sound);
}
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button[data-value]'); if (!b) return;
  settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments();
  if (seg.dataset.setting === 'theme') view.setTheme(settings.theme);
}));
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { settings.mode = b.dataset.mode; save(); syncSegments(); }));

function showStart(tab) {
  if (tab) settings.mode = tab; syncSegments();
  started = false; $('start').hidden = false; $('result').hidden = true; hideWaiting(); hideOffer();
  document.body.classList.remove('is-playing'); layout();
  aiJob++; aiThinking = false; result = null; clocks = null; clearSelection(); view.setHint(null);
  game = new Chess(); view.setPosition(game.board); view.setLastMove(null); view.setCheck(-1);
  view.orbitIdle = true; view.moveCamera(view.viewFor(WHITE, false).multiplyScalar(1.15), 1400);
}
function hideStartScreen() { $('start').hidden = true; }

$('start-btn').onclick = () => {
  sound.ctx();
  mode = settings.mode; hideStartScreen();
  if (mode === 'ai') { my = settings.color === 'random' ? (Math.random() < .5 ? WHITE : BLACK) : settings.color === 'black' ? BLACK : WHITE; bottom = my; }
  else { my = WHITE; bottom = WHITE; }
  newGame();
};
$('online-create').onclick = () => { sound.ctx(); hostRoom(); };
$('online-join').onclick = () => { sound.ctx(); joinRoom($('online-code').value); };
$('online-code').addEventListener('input', e => { e.target.value = cleanCode(e.target.value); });
$('online-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('online-join').click(); });
$('online-name').value = settings.name || '';
$('waiting-copy').onclick = copyInvite; $('waiting-share').onclick = shareInvite;
$('waiting-cancel').onclick = () => { leaveRoom(); showStart('online'); joinNote('Room closed.'); };
$('room-copy').onclick = copyInvite;

/* ---------- Toolbar ---------- */
$('btn-undo').onclick = undo; $('btn-hint').onclick = showHint; $('btn-flip').onclick = flip; $('btn-resign').onclick = resign;
$('btn-draw').onclick = () => { if (room?.peer && !result) { room.send('draw-offer'); toast('Draw offered'); } };
$('btn-new').onclick = () => { if (mode === 'online') { requestRematch(); return; } if (!result && game.played.length > 1 && !confirm('Start a new game?')) return; newGame(); };
$('btn-menu').onclick = () => { if (mode === 'online' && room) { if (!result && started && !confirm('Leave this online game?')) return; leaveRoom(); } if (started && !result && mode !== 'online' && game.played.length > 2 && !confirm('Leave this game?')) return; mode = null; showStart(); };
$('again').onclick = () => { $('result').hidden = true; if (mode === 'online') requestRematch(); else { if (mode === 'ai' && settings.color === 'random') { my ^= 1; bottom = my; } newGame(); } };
$('review').onclick = () => { $('result').hidden = true; };
$('to-menu').onclick = () => { if (mode === 'online') leaveRoom(); mode = null; showStart(); };
$('btn-theme').onclick = () => { const keys = Object.keys(THEMES); settings.theme = keys[(keys.indexOf(settings.theme) + 1) % keys.length]; save(); view.setTheme(settings.theme); syncSegments(); toast(`${THEMES[settings.theme].label} board`); };
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments(); if (settings.sound) sound.knock(); };
$('btn-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
addEventListener('pagehide', () => room?.leave());

/* ---------- Boot ---------- */
syncSegments(); render();
view.camera.position.copy(view.viewFor(WHITE, true).multiplyScalar(1.6)); view.moveCamera(view.viewFor(WHITE).multiplyScalar(1.15), 2600);
setTimeout(() => document.body.classList.add('is-ready'), 50);
(async () => {
  const invite = cleanCode(new URL(location.href).searchParams.get('room'));
  if (!invite) return;
  let session = null; try { session = JSON.parse(sessionStorage.getItem('chess-session') || 'null'); } catch {}
  settings.mode = 'online'; syncSegments(); $('online-code').value = invite;
  try {
    if (session?.code === invite && session.host && await resumeHost(invite, session.name)) return;
    if (session?.code === invite && !session.host) { await joinRoom(invite, session.name, true); return; }
  } catch {}
  joinNote('You’ve been invited — add your name and press Join.');
  $('online-name').focus();
})();
