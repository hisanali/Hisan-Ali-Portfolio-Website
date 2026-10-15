// Ludo rules. Progress per token: -1 in the yard, 0..50 on the shared track, 51..55 in the home column, 56 finished.
export const COLORS = ['red', 'green', 'yellow', 'blue'];
export const START = { red: 0, green: 13, yellow: 26, blue: 39 };
export const FINISH = 56;
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const seatColors = n => n === 2 ? ['red', 'yellow'] : n === 3 ? ['red', 'green', 'yellow'] : [...COLORS];
export const trackIndex = (color, progress) => (START[color] + progress) % 52;

export function newGame(colors) {
  return { colors, turn: 0, tokens: Object.fromEntries(colors.map(c => [c, [-1, -1, -1, -1]])), dice: 0, phase: 'roll', sixes: 0, winner: null, seq: 0 };
}

export function target(progress, dice) {
  if (progress < 0) return dice === 6 ? 0 : null;
  return progress + dice <= FINISH ? progress + dice : null;
}

export function movable(state, color = state.colors[state.turn], dice = state.dice) {
  return state.tokens[color].map((p, i) => target(p, dice) == null ? -1 : i).filter(i => i >= 0);
}

// Opponent tokens that would be captured by moving to `progress`.
export function capturesAt(state, color, progress) {
  if (progress > 50) return [];
  const spot = trackIndex(color, progress);
  if (SAFE.has(spot)) return [];
  const hits = [];
  for (const other of state.colors) if (other !== color)
    state.tokens[other].forEach((p, i) => { if (p >= 0 && p <= 50 && trackIndex(other, p) === spot) hits.push({ color: other, index: i }); });
  return hits;
}

export const isSafe = spot => SAFE.has(spot);

// Applies a roll; returns what happened so the caller can animate it.
export function applyRoll(state, value) {
  state.dice = value; state.seq++;
  state.sixes = value === 6 ? state.sixes + 1 : 0;
  if (state.sixes === 3) { state.sixes = 0; passTurn(state); return { forfeit: true, moves: [] }; }
  const moves = movable(state);
  if (!moves.length) { passTurn(state); return { moves }; }
  state.phase = 'move';
  return { moves };
}

export function applyMove(state, index) {
  const color = state.colors[state.turn], from = state.tokens[color][index], to = target(from, state.dice);
  if (state.phase !== 'move' || to == null) return null;
  const captured = capturesAt(state, color, to);
  state.tokens[color][index] = to;
  captured.forEach(c => { state.tokens[c.color][c.index] = -1; });
  state.seq++;
  const finished = to === FINISH;
  if (state.tokens[color].every(p => p === FINISH)) { state.winner = color; state.phase = 'over'; }
  else if (state.dice === 6 || captured.length || finished) state.phase = 'roll';
  else passTurn(state);
  return { color, index, from, to, captured, finished };
}

function passTurn(state) { state.turn = (state.turn + 1) % state.colors.length; state.phase = 'roll'; state.sixes = 0; }

// Picks a move for the computer: finish, capture, escape danger, then progress.
export function chooseMove(state) {
  const color = state.colors[state.turn];
  const danger = (prog) => {
    if (prog < 0 || prog > 50) return 0;
    const spot = trackIndex(color, prog); if (SAFE.has(spot)) return 0;
    let n = 0;
    for (const other of state.colors) if (other !== color) for (const p of state.tokens[other]) {
      if (p < 0 || p > 50) continue;
      const gap = (spot - trackIndex(other, p) + 52) % 52;
      if (gap >= 1 && gap <= 6) n++;
    }
    return n;
  };
  let best = null, bestScore = -Infinity;
  for (const i of movable(state)) {
    const from = state.tokens[color][i], to = target(from, state.dice);
    let score = to / 10 + Math.random() * .5;
    if (to === FINISH) score += 100;
    score += capturesAt(state, color, to).length * 70;
    if (from < 0) score += 45;
    if (to > 50 && from <= 50) score += 30;
    score += (danger(from) - danger(to)) * 25;
    if (to <= 50 && SAFE.has(trackIndex(color, to))) score += 15;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}
