import { newGame, applyRoll, applyMove, movable, chooseMove, seatColors, COLORS, FINISH } from './rules.js?v=1';
import { LudoScene, HEX } from './scene.js?v=1';

const $ = id => document.getElementById(id);
const NAME = { red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue' };
const settings = { mode: 'ai', opponents: '3', color: 'red', players: '4', sound: true, name: '' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('ludo-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('ludo-settings', JSON.stringify(settings)); } catch {} };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Sound ---------- */
const sound = {
  ctx() { if (!this.c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.c = new A(); } if (this.c.state === 'suspended') this.c.resume(); return this.c; },
  noise(vol, freq, len = .08) { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6); const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 2; const g = c.createGain(); g.gain.value = vol; s.connect(f).connect(g).connect(c.destination); s.start(); },
  chime(freqs, vol = .1) { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime; freqs.forEach((fr, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * .08); g.gain.linearRampToValueAtTime(vol, t + i * .08 + .02); g.gain.exponentialRampToValueAtTime(.0008, t + i * .08 + .9); o.connect(g).connect(c.destination); o.start(t + i * .08); o.stop(t + i * .08 + 1); }); },
  dice() { for (let i = 0; i < 6; i++) setTimeout(() => this.noise(.35, 2200 + Math.random() * 1500, .05), i * 110 + Math.random() * 40); }
};

/* ---------- State ---------- */
const view = new LudoScene($('scene'));
view.onTap = () => sound.noise(.25, 1300);
let mode = null, state = newGame(COLORS), players = [], busy = false, queue = Promise.resolve(), botTimer = 0;
let room = null, myId = sessionStorage.getItem('ludo-id') || crypto.randomUUID(); sessionStorage.setItem('ludo-id', myId);
view.setTokens(state); view.camera.position.copy(view.viewFor('red', 1.5)); view.idle = true;

const current = () => players[state.turn];
const mine = p => p && (mode === 'online' ? p.id === myId : p.kind === 'human');
const humanTurn = () => !busy && !state.winner && mine(current());

/* ---------- Event pipeline: every roll and move goes through here, locally or from the network ---------- */
function run(event) { queue = queue.then(() => play(event)).catch(console.error); return queue; }

async function play(event) {
  busy = true; render();
  if (event.kind === 'roll') {
    sound.dice(); await view.rollDice(event.value);
    const color = state.colors[state.turn], res = applyRoll(state, event.value);
    if (res.forfeit) toast(`${who(color)} rolled three sixes — turn lost`);
    else if (!res.moves.length) toast(`${who(color)} can’t move with a ${event.value}`);
    if (!res.forfeit && res.moves.length) view.highlight(color, mine(players[state.turn]) ? res.moves : []);
    await wait(res.moves.length ? 150 : 700);
  } else if (event.kind === 'move') {
    view.highlight(null, []);
    const color = state.colors[state.turn], from = state.tokens[color][event.index];
    const res = applyMove(state, event.index); if (!res) { busy = false; return; }
    await view.moveToken(color, event.index, from, res.to);
    for (const c of res.captured) { sound.chime([330, 247]); toast(`${who(color)} captured ${who(c.color)}!`); await view.sendHome(c.color, c.index); }
    view.spread(state);
    if (res.finished) sound.chime([523, 659, 784]);
  }
  busy = false; render(); advance();
}

function advance() {
  clearTimeout(botTimer);
  if (state.winner) return finish();
  const p = current(); if (!p) return;
  const isBot = p.kind === 'bot' || (mode === 'online' && room?.host && p.id !== myId && !room.online(p.id));
  if (isBot && (mode !== 'online' || room?.host)) botTimer = setTimeout(() => act(state.phase === 'roll' ? { kind: 'roll' } : { kind: 'move', index: chooseMove(state) }), state.phase === 'roll' ? 650 : 450);
  else if (mine(p) && state.phase === 'move') { const opts = movable(state); if (opts.length === 1) botTimer = setTimeout(() => act({ kind: 'move', index: opts[0] }), 450); }
}

// The authority (local game or online host) resolves an action into an event.
function act(action) {
  if (busy || state.winner) return;
  if (mode === 'online' && !room.host) { room.send('intent', action); return; }
  if (action.kind === 'roll' && state.phase !== 'roll') return;
  if (action.kind === 'move' && (state.phase !== 'move' || !movable(state).includes(action.index))) return;
  const event = action.kind === 'roll' ? { kind: 'roll', value: 1 + Math.floor(Math.random() * 6) } : { kind: 'move', index: action.index };
  if (mode === 'online') room.send('event', { event, seq: state.seq });
  run(event);
}

function finish() {
  const p = players.find(x => x.color === state.winner);
  view.confetti(); sound.chime([523, 659, 784, 1047], .12);
  $('result-label').textContent = mine(p) ? 'Victory' : 'Game over';
  $('result-title').textContent = mine(p) && mode !== 'local' ? 'You win!' : `${who(state.winner)} wins!`;
  $('result-reason').textContent = 'All four tokens made it home.';
  $('again').hidden = mode === 'online' && !room?.host;
  setTimeout(() => { $('result').hidden = false; }, 900);
}

/* ---------- HUD ---------- */
const who = color => { const p = players.find(x => x.color === color); return p?.name || NAME[color]; };
let toastTimer = 0;
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2400); }

function render() {
  document.body.classList.toggle('is-playing', !!mode);
  $('players').innerHTML = players.map((p, i) => {
    const home = state.tokens[p.color].filter(x => x === FINISH).length, out = state.tokens[p.color].filter(x => x >= 0 && x < FINISH).length;
    const tag = mode === 'online' ? (p.id === myId ? 'You' : room?.online(p.id) ? 'Online' : 'Away') : p.kind === 'bot' ? 'Computer' : mode === 'ai' ? 'You' : 'Player';
    return `<li class="${i === state.turn && !state.winner ? 'is-turn' : ''}" style="--c:${HEX[p.color]}"><i></i><span><b>${escape(p.name)}</b><small>${tag} · ${home}/4 home${out ? ` · ${out} out` : ''}</small></span></li>`;
  }).join('');
  const p = current(), myTurn = humanTurn();
  const roll = $('roll');
  roll.disabled = !(myTurn && state.phase === 'roll');
  roll.style.setProperty('--c', HEX[p?.color] || '#fff');
  roll.querySelector('b').textContent = state.dice || '–';
  let status = '';
  if (state.winner) status = `${who(state.winner)} wins!`;
  else if (busy) status = '';
  else if (myTurn) status = state.phase === 'roll' ? (mode === 'local' ? `${who(p.color)}, roll the dice` : 'Your turn — roll the dice') : 'Pick a glowing token to move';
  else if (p) status = `${who(p.color)} is ${state.phase === 'roll' ? 'rolling' : 'moving'}…`;
  $('status').textContent = status;
  $('room-bar').hidden = mode !== 'online'; if (room) $('room-code').textContent = room.code;
}
const escape = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* ---------- Input ---------- */
$('roll').onclick = () => { sound.ctx(); if (humanTurn() && state.phase === 'roll') act({ kind: 'roll' }); };
addEventListener('keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && mode && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); $('roll').click(); } });
let down = null;
$('scene').addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
$('scene').addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8 || !mode || !humanTurn()) return;
  const hit = view.pick(e.clientX, e.clientY); if (!hit) return;
  if (hit.dice && state.phase === 'roll') return act({ kind: 'roll' });
  if (state.phase === 'move' && hit.color === state.colors[state.turn] && movable(state).includes(hit.index)) act({ kind: 'move', index: hit.index });
});

/* ---------- Starting games ---------- */
function begin(list, startState) {
  players = list; state = startState || newGame(list.map(p => p.color));
  queue = Promise.resolve(); busy = false;
  view.setTokens(state); view.highlight(null, []); view.idle = false;
  const me = list.find(p => mine(p)) || list[0];
  view.moveCamera(view.viewFor(mode === 'local' ? 'red' : me.color), 1600);
  $('start').hidden = true; $('waiting').hidden = true; $('result').hidden = true;
  render(); setTimeout(advance, 1500);
}

$('start-btn').onclick = () => {
  sound.ctx(); mode = settings.mode;
  if (mode === 'ai') {
    const n = settings.opponents === '1' ? 2 : 4, colors = seatColors(n);
    const mineColor = colors.includes(settings.color) ? settings.color : colors[0];
    begin(colors.map(c => c === mineColor ? { color: c, kind: 'human', name: settings.name || 'You' } : { color: c, kind: 'bot', name: `${NAME[c]} bot` }));
  } else begin(seatColors(Number(settings.players)).map(c => ({ color: c, kind: 'human', name: NAME[c] })));
};

/* ---------- Online rooms ---------- */
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const cleanCode = v => String(v || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
let client = null;
async function realtime() {
  if (client) return client;
  const [{ createClient }, res] = await Promise.all([import('../evermile/vendor/realtime-client.js'), fetch('/api/multiplayer/config', { cache: 'no-store' })]);
  if (!res.ok) throw new Error('Online play is temporarily unavailable. Please try again shortly.');
  const cfg = await res.json();
  client = createClient(cfg.url, cfg.publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 20 } } });
  return client;
}

async function openRoom(code, host, name) {
  const c = await realtime(); room?.channel && c.removeChannel(room.channel);
  const channel = c.channel(`ludo:v1:${code}`, { config: { broadcast: { self: false }, presence: { key: myId } } });
  room = { code, host, name, channel, members: [], online: id => room.members.some(m => m.id === id), send: (type, data = {}) => channel.send({ type: 'broadcast', event: 'msg', payload: { ...data, type, from: myId } }).catch(() => {}) };
  channel.on('presence', { event: 'sync' }, () => { room.members = Object.values(channel.presenceState()).flat(); onMembers(); })
    .on('broadcast', { event: 'msg' }, ({ payload }) => onMessage(payload));
  await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('Could not connect. Please try again.')), 12000); channel.subscribe(async s => { if (s === 'SUBSCRIBED') { clearTimeout(t); await channel.track({ id: myId, name, host, at: Date.now() }); resolve(); } }); });
  const u = new URL(location.href); u.searchParams.set('room', code); history.replaceState({}, '', u);
}

function lobbyMembers() { return room.members.filter((m, i, a) => a.findIndex(x => x.id === m.id) === i).sort((a, b) => (b.host - a.host) || a.at - b.at).slice(0, 4); }
function onMembers() {
  if (mode === 'online' && players.length) { render(); if (room.host) advance(); return; }
  const list = lobbyMembers();
  $('lobby-list').innerHTML = list.map((m, i) => `<li style="--c:${HEX[seatColors(Math.max(2, list.length))[i]]}"><i></i>${escape(m.name)}${m.id === myId ? ' (you)' : ''}${m.host ? ' · host' : ''}</li>`).join('');
  $('lobby-start').hidden = !room.host; $('lobby-start').disabled = list.length < 2;
  $('waiting-text').textContent = room.host ? (list.length < 2 ? 'Share the code. Start when 2–4 players have joined.' : `${list.length} players ready — start when everyone is in.`) : 'Waiting for the host to start the game…';
  if (!room.host && !list.some(m => m.host)) $('waiting-text').textContent = 'Waiting for the host to open the room…';
}

function onMessage(msg) {
  if (!msg || msg.from === myId) return;
  if (msg.type === 'start' || msg.type === 'state') {
    if (room.host) return;
    const s = msg.state; if (!s) return;
    if (msg.type === 'start' || !players.length) { mode = 'online'; begin(msg.players, s); return; }
    if (s.seq !== state.seq && !busy) { players = msg.players; state = s; view.setTokens(state); render(); }
  } else if (msg.type === 'event' && !room.host) {
    if (msg.seq !== state.seq) { room.send('sync'); return; }
    run(msg.event);
  } else if (msg.type === 'intent' && room.host) {
    const p = current(); if (p?.id === msg.from) act(msg);
  } else if (msg.type === 'sync' && room.host && players.length) room.send('state', { state, players });
  else if (msg.type === 'again' && !room.host) { mode = 'online'; begin(msg.players, msg.state); }
}

$('online-create').onclick = async () => {
  sound.ctx(); const name = $('online-name').value.trim() || 'Host'; settings.name = name; save();
  try { note('Creating room…'); const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => ALPHA[n % ALPHA.length]).join(''); await openRoom(code, true, name); showWaiting(code); }
  catch (e) { note(e.message, true); }
};
$('online-join').onclick = async () => {
  sound.ctx(); const code = cleanCode($('online-code').value), name = $('online-name').value.trim() || 'Player'; settings.name = name; save();
  if (code.length !== 6) return note('Enter the six-character room code.', true);
  try { note('Joining…'); await openRoom(code, false, name); showWaiting(code); setTimeout(() => room?.send('sync'), 800); }
  catch (e) { note(e.message, true); }
};
$('online-code').oninput = e => { e.target.value = cleanCode(e.target.value); };
$('lobby-start').onclick = () => {
  const list = lobbyMembers(), colors = seatColors(list.length);
  mode = 'online'; const ps = list.map((m, i) => ({ id: m.id, name: m.name, color: colors[i], kind: 'human' }));
  const s = newGame(colors); room.send('start', { state: s, players: ps }); begin(ps, s);
};
function showWaiting(code) { $('start').hidden = true; $('waiting').hidden = false; $('waiting-code').textContent = code; onMembers(); }
function note(text, error = false) { $('online-note').textContent = text; $('online-note').classList.toggle('is-error', error); }
const invite = () => { const u = new URL(location.href); u.search = ''; u.searchParams.set('room', room.code); return u.href; };
async function copyInvite() { try { await navigator.clipboard.writeText(invite()); toast('Invite link copied'); } catch { prompt('Copy this invite link', invite()); } }
$('waiting-copy').onclick = $('room-copy').onclick = copyInvite;
$('waiting-share').onclick = async () => { if (navigator.share) { try { await navigator.share({ title: 'Play Ludo with me', text: `Join my Ludo room ${room.code}`, url: invite() }); return; } catch {} } copyInvite(); };
$('waiting-cancel').onclick = () => leave();

function leave() {
  clearTimeout(botTimer);
  if (room) { client?.removeChannel(room.channel); room = null; const u = new URL(location.href); u.searchParams.delete('room'); history.replaceState({}, '', u); }
  mode = null; players = []; state = newGame(COLORS); view.setTokens(state); view.highlight(null, []);
  $('waiting').hidden = true; $('result').hidden = true; $('start').hidden = false; view.idle = true; render();
}

/* ---------- Menus ---------- */
function syncSegments() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value))));
  document.querySelectorAll('[data-tab]').forEach(el => { el.hidden = el.dataset.tab !== settings.mode; });
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === settings.mode)));
  $('start-btn').hidden = settings.mode === 'online';
  $('btn-sound').classList.toggle('is-off', !settings.sound);
}
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments(); }));
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { settings.mode = b.dataset.mode; save(); syncSegments(); });
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments(); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
$('btn-menu').onclick = () => { if (mode && !state.winner && !confirm('Leave this game?')) return; leave(); };
$('again').onclick = () => {
  $('result').hidden = true;
  if (mode === 'online') { const s = newGame(state.colors); room.send('again', { state: s, players }); begin(players, s); }
  else begin(players);
};
$('to-menu').onclick = () => leave();
$('online-name').value = settings.name || '';
addEventListener('pagehide', () => room && client?.removeChannel(room.channel));

syncSegments(); render();
view.moveCamera(view.viewFor('red', 1.15), 2600);
setTimeout(() => document.body.classList.add('is-ready'), 50);
const inviteCode = cleanCode(new URL(location.href).searchParams.get('room'));
if (inviteCode) { settings.mode = 'online'; syncSegments(); $('online-code').value = inviteCode; note('You’ve been invited — add your name and press Join.'); }
