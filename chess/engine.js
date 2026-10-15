// Chess rules and search. Squares are 0..63 with a1 = 0, h1 = 7, a8 = 56.
export const WHITE = 0, BLACK = 1;
export const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
export const typeOf = p => p & 7;
export const colorOf = p => p >> 3;
export const makePiece = (color, type) => type | (color << 3);
export const squareName = sq => 'abcdefgh'[sq & 7] + ((sq >> 3) + 1);
export const parseSquare = s => (s.charCodeAt(0) - 97) + (s.charCodeAt(1) - 49) * 8;
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const F_CAPTURE = 1, F_EP = 2, F_CASTLE = 4, F_DOUBLE = 8, F_PROMO = 16;
const LETTERS = ' pnbrqk';

const KNIGHT_TO = [], KING_TO = [], RAYS = [];
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
for (let sq = 0; sq < 64; sq++) {
  const f = sq & 7, r = sq >> 3;
  KNIGHT_TO[sq] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
    .map(([a, b]) => [f + a, r + b]).filter(([x, y]) => x >= 0 && x < 8 && y >= 0 && y < 8).map(([x, y]) => y * 8 + x);
  KING_TO[sq] = DIRS.map(([a, b]) => [f + a, r + b]).filter(([x, y]) => x >= 0 && x < 8 && y >= 0 && y < 8).map(([x, y]) => y * 8 + x);
  RAYS[sq] = DIRS.map(([a, b]) => { const ray = []; let x = f + a, y = r + b; while (x >= 0 && x < 8 && y >= 0 && y < 8) { ray.push(y * 8 + x); x += a; y += b; } return ray; });
}
const CASTLE_MASK = new Array(64).fill(15);
CASTLE_MASK[0] = 15 & ~2; CASTLE_MASK[7] = 15 & ~1; CASTLE_MASK[4] = 15 & ~3;
CASTLE_MASK[56] = 15 & ~8; CASTLE_MASK[63] = 15 & ~4; CASTLE_MASK[60] = 15 & ~12;

let seed = 0x9e3779b9;
const rand32 = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
const ZP = [Int32Array.from({ length: 16 * 64 }, rand32), Int32Array.from({ length: 16 * 64 }, rand32)];
const ZC = [Int32Array.from({ length: 16 }, rand32), Int32Array.from({ length: 16 }, rand32)];
const ZE = [Int32Array.from({ length: 8 }, rand32), Int32Array.from({ length: 8 }, rand32)];
const ZS = [rand32(), rand32()];

export class Chess {
  constructor(fen = START_FEN) { this.load(fen); }

  load(fen) {
    const [placement, side, castle, ep, half, full] = fen.trim().split(/\s+/);
    this.board = new Int8Array(64); this.kings = [-1, -1];
    let r = 7, f = 0;
    for (const ch of placement) {
      if (ch === '/') { r--; f = 0; } else if (/\d/.test(ch)) f += Number(ch);
      else {
        const color = ch === ch.toUpperCase() ? WHITE : BLACK, type = LETTERS.indexOf(ch.toLowerCase());
        this.board[r * 8 + f] = makePiece(color, type); if (type === KING) this.kings[color] = r * 8 + f; f++;
      }
    }
    this.turn = side === 'b' ? BLACK : WHITE;
    this.castling = (castle.includes('K') ? 1 : 0) | (castle.includes('Q') ? 2 : 0) | (castle.includes('k') ? 4 : 0) | (castle.includes('q') ? 8 : 0);
    this.ep = ep && ep !== '-' ? parseSquare(ep) : -1;
    this.half = Number(half) || 0; this.full = Number(full) || 1;
    this.stack = []; this.played = [];
    this.rehash();
  }

  rehash() {
    let a = 0, b = 0;
    for (let sq = 0; sq < 64; sq++) if (this.board[sq]) { a ^= ZP[0][this.board[sq] * 64 + sq]; b ^= ZP[1][this.board[sq] * 64 + sq]; }
    a ^= ZC[0][this.castling]; b ^= ZC[1][this.castling];
    if (this.ep >= 0) { a ^= ZE[0][this.ep & 7]; b ^= ZE[1][this.ep & 7]; }
    if (this.turn) { a ^= ZS[0]; b ^= ZS[1]; }
    this.h1 = a; this.h2 = b;
  }

  clone() { const c = new Chess(START_FEN); c.load(this.fen()); return c; }

  fen() {
    let out = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r * 8 + f];
        if (!p) { empty++; continue; }
        if (empty) { out += empty; empty = 0; }
        const ch = LETTERS[typeOf(p)]; out += colorOf(p) ? ch : ch.toUpperCase();
      }
      if (empty) out += empty; if (r) out += '/';
    }
    const c = (this.castling & 1 ? 'K' : '') + (this.castling & 2 ? 'Q' : '') + (this.castling & 4 ? 'k' : '') + (this.castling & 8 ? 'q' : '');
    return `${out} ${this.turn ? 'b' : 'w'} ${c || '-'} ${this.ep >= 0 ? squareName(this.ep) : '-'} ${this.half} ${this.full}`;
  }

  attacked(sq, by) {
    const b = this.board, f = sq & 7;
    if (by === WHITE) {
      if (sq >= 8) { if (f > 0 && b[sq - 9] === makePiece(WHITE, PAWN)) return true; if (f < 7 && b[sq - 7] === makePiece(WHITE, PAWN)) return true; }
    } else if (sq < 56) { if (f > 0 && b[sq + 7] === makePiece(BLACK, PAWN)) return true; if (f < 7 && b[sq + 9] === makePiece(BLACK, PAWN)) return true; }
    const kn = makePiece(by, KNIGHT); for (const t of KNIGHT_TO[sq]) if (b[t] === kn) return true;
    const kg = makePiece(by, KING); for (const t of KING_TO[sq]) if (b[t] === kg) return true;
    const rays = RAYS[sq], q = makePiece(by, QUEEN), rk = makePiece(by, ROOK), bs = makePiece(by, BISHOP);
    for (let d = 0; d < 8; d++) {
      for (const t of rays[d]) {
        const p = b[t]; if (!p) continue;
        if (p === q || (d < 4 ? p === rk : p === bs)) return true;
        break;
      }
    }
    return false;
  }

  inCheck(color = this.turn) { return this.attacked(this.kings[color], color ^ 1); }

  pseudo(capturesOnly = false) {
    const out = [], b = this.board, us = this.turn, them = us ^ 1;
    const add = (from, to, piece, flags = 0, promo = 0) => out.push({ from, to, piece, captured: flags & F_EP ? makePiece(them, PAWN) : b[to], flags, promo });
    for (let from = 0; from < 64; from++) {
      const p = b[from]; if (!p || colorOf(p) !== us) continue;
      const t = typeOf(p);
      if (t === PAWN) {
        const dir = us === WHITE ? 8 : -8, startRank = us === WHITE ? 1 : 6, lastRank = us === WHITE ? 7 : 0, f = from & 7;
        const one = from + dir;
        if (!b[one]) {
          if ((one >> 3) === lastRank) for (const pr of [QUEEN, KNIGHT, ROOK, BISHOP]) add(from, one, p, F_PROMO, makePiece(us, pr));
          else if (!capturesOnly) { add(from, one, p); if ((from >> 3) === startRank && !b[one + dir]) add(from, one + dir, p, F_DOUBLE); }
        }
        for (const df of [-1, 1]) {
          if (f + df < 0 || f + df > 7) continue;
          const to = one + df, target = b[to];
          if (target && colorOf(target) === them) {
            if ((to >> 3) === lastRank) for (const pr of [QUEEN, KNIGHT, ROOK, BISHOP]) add(from, to, p, F_CAPTURE | F_PROMO, makePiece(us, pr));
            else add(from, to, p, F_CAPTURE);
          } else if (to === this.ep) add(from, to, p, F_CAPTURE | F_EP);
        }
      } else if (t === KNIGHT || t === KING) {
        for (const to of (t === KNIGHT ? KNIGHT_TO : KING_TO)[from]) {
          const target = b[to];
          if (!target) { if (!capturesOnly) add(from, to, p); } else if (colorOf(target) === them) add(from, to, p, F_CAPTURE);
        }
        if (t === KING && !capturesOnly) {
          const home = us === WHITE ? 4 : 60;
          if (from === home && !this.attacked(home, them)) {
            if (this.castling & (us === WHITE ? 1 : 4) && !b[home + 1] && !b[home + 2] && b[home + 3] === makePiece(us, ROOK) && !this.attacked(home + 1, them) && !this.attacked(home + 2, them)) add(from, home + 2, p, F_CASTLE);
            if (this.castling & (us === WHITE ? 2 : 8) && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === makePiece(us, ROOK) && !this.attacked(home - 1, them) && !this.attacked(home - 2, them)) add(from, home - 2, p, F_CASTLE);
          }
        }
      } else {
        const d0 = t === BISHOP ? 4 : 0, d1 = t === ROOK ? 4 : 8;
        for (let d = d0; d < d1; d++) for (const to of RAYS[from][d]) {
          const target = b[to];
          if (!target) { if (!capturesOnly) add(from, to, p); continue; }
          if (colorOf(target) === them) add(from, to, p, F_CAPTURE);
          break;
        }
      }
    }
    return out;
  }

  make(m) {
    const b = this.board, us = this.turn;
    this.stack.push({ castling: this.castling, ep: this.ep, half: this.half, h1: this.h1, h2: this.h2 });
    let a = this.h1, c = this.h2;
    const z = (p, sq) => { a ^= ZP[0][p * 64 + sq]; c ^= ZP[1][p * 64 + sq]; };
    a ^= ZC[0][this.castling]; c ^= ZC[1][this.castling];
    if (this.ep >= 0) { a ^= ZE[0][this.ep & 7]; c ^= ZE[1][this.ep & 7]; }
    z(m.piece, m.from); b[m.from] = 0;
    if (m.flags & F_EP) { const cap = m.to + (us === WHITE ? -8 : 8); z(b[cap], cap); b[cap] = 0; }
    else if (m.captured) z(m.captured, m.to);
    const placed = m.promo || m.piece; b[m.to] = placed; z(placed, m.to);
    if (m.flags & F_CASTLE) {
      const [rf, rt] = m.to > m.from ? [m.from + 3, m.from + 1] : [m.from - 4, m.from - 1];
      const rook = b[rf]; z(rook, rf); b[rf] = 0; b[rt] = rook; z(rook, rt);
    }
    if (typeOf(m.piece) === KING) this.kings[us] = m.to;
    this.castling &= CASTLE_MASK[m.from] & CASTLE_MASK[m.to];
    this.ep = m.flags & F_DOUBLE ? (m.from + m.to) >> 1 : -1;
    this.half = typeOf(m.piece) === PAWN || m.captured ? 0 : this.half + 1;
    if (us === BLACK) this.full++;
    this.turn ^= 1;
    a ^= ZC[0][this.castling]; c ^= ZC[1][this.castling];
    if (this.ep >= 0) { a ^= ZE[0][this.ep & 7]; c ^= ZE[1][this.ep & 7]; }
    a ^= ZS[0]; c ^= ZS[1];
    this.h1 = a; this.h2 = c;
    this.played.push(m);
  }

  unmake() {
    const m = this.played.pop(), s = this.stack.pop(), b = this.board;
    this.turn ^= 1; const us = this.turn;
    if (us === BLACK) this.full--;
    b[m.from] = m.piece;
    if (m.flags & F_EP) { b[m.to] = 0; b[m.to + (us === WHITE ? -8 : 8)] = m.captured; }
    else b[m.to] = m.captured;
    if (m.flags & F_CASTLE) {
      const [rf, rt] = m.to > m.from ? [m.from + 3, m.from + 1] : [m.from - 4, m.from - 1];
      b[rf] = b[rt]; b[rt] = 0;
    }
    if (typeOf(m.piece) === KING) this.kings[us] = m.from;
    Object.assign(this, s);
    return m;
  }

  legalMoves(from = -1) {
    const us = this.turn, out = [];
    for (const m of this.pseudo()) {
      if (from >= 0 && m.from !== from) continue;
      this.make(m);
      if (!this.attacked(this.kings[us], us ^ 1)) out.push(m);
      this.unmake();
    }
    return out;
  }

  san(m) {
    const t = typeOf(m.piece);
    let s;
    if (m.flags & F_CASTLE) s = m.to > m.from ? 'O-O' : 'O-O-O';
    else {
      s = t === PAWN ? '' : LETTERS[t].toUpperCase();
      if (t !== PAWN) {
        const rivals = this.legalMoves().filter(o => o.piece === m.piece && o.to === m.to && o.from !== m.from);
        if (rivals.length) {
          const sameFile = rivals.some(o => (o.from & 7) === (m.from & 7)), sameRank = rivals.some(o => (o.from >> 3) === (m.from >> 3));
          s += !sameFile ? squareName(m.from)[0] : !sameRank ? squareName(m.from)[1] : squareName(m.from);
        }
      }
      if (m.captured) s += (t === PAWN ? squareName(m.from)[0] : '') + 'x';
      s += squareName(m.to);
      if (m.promo) s += '=' + LETTERS[typeOf(m.promo)].toUpperCase();
    }
    this.make(m);
    if (this.inCheck()) s += this.legalMoves().length ? '+' : '#';
    this.unmake();
    return s;
  }

  // Applies a move from {from,to,promo?} (squares as numbers or names); returns the move with its SAN, or null.
  move({ from, to, promo }) {
    if (typeof from === 'string') from = parseSquare(from);
    if (typeof to === 'string') to = parseSquare(to);
    const want = promo ? (typeof promo === 'string' ? LETTERS.indexOf(promo) : typeOf(promo)) : QUEEN;
    const m = this.legalMoves(from).find(o => o.to === to && (!o.promo || typeOf(o.promo) === want));
    if (!m) return null;
    m.san = this.san(m);
    this.make(m);
    return m;
  }

  uci(m) { return squareName(m.from) + squareName(m.to) + (m.promo ? LETTERS[typeOf(m.promo)] : ''); }
  moveUci(text) { return this.move({ from: text.slice(0, 2), to: text.slice(2, 4), promo: text[4] }); }

  repetitions() {
    let n = 1;
    for (let i = this.stack.length - 1, k = 0; i >= 0 && k < this.half; i--, k++) if (this.stack[i].h1 === this.h1 && this.stack[i].h2 === this.h2) n++;
    return n;
  }

  insufficient() {
    const minors = [[], []];
    for (let sq = 0; sq < 64; sq++) {
      const p = this.board[sq], t = typeOf(p);
      if (!p || t === KING) continue;
      if (t === PAWN || t === ROOK || t === QUEEN) return false;
      minors[colorOf(p)].push({ t, shade: ((sq >> 3) + (sq & 7)) & 1 });
    }
    const all = [...minors[0], ...minors[1]];
    if (all.length <= 1) return true;
    return all.every(m => m.t === BISHOP) && all.every(m => m.shade === all[0].shade);
  }

  // {over, result: 'white'|'black'|'draw', reason}
  status() {
    const moves = this.legalMoves();
    if (!moves.length) return this.inCheck() ? { over: true, result: this.turn ? 'white' : 'black', reason: 'checkmate' } : { over: true, result: 'draw', reason: 'stalemate' };
    if (this.half >= 100) return { over: true, result: 'draw', reason: 'fifty-move rule' };
    if (this.insufficient()) return { over: true, result: 'draw', reason: 'insufficient material' };
    if (this.repetitions() >= 3) return { over: true, result: 'draw', reason: 'threefold repetition' };
    return { over: false, check: this.inCheck() };
  }
}

/* ---------- Search ---------- */
const VALUE = [0, 100, 320, 330, 500, 900, 0];
// Piece-square tables written from White's view, rank 8 first.
const PST = [[],
  [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
];
const KING_END = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

function evaluate(pos) {
  const b = pos.board; let score = 0, heavy = 0;
  for (let sq = 0; sq < 64; sq++) { const t = typeOf(b[sq]); if (t === QUEEN) heavy += 2; else if (t > PAWN && t < KING) heavy += t === ROOK ? 1 : .5; }
  const endgame = heavy <= 3;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq]; if (!p) continue;
    const t = typeOf(p), c = colorOf(p), idx = c === WHITE ? (7 - (sq >> 3)) * 8 + (sq & 7) : sq;
    const v = VALUE[t] + (t === KING && endgame ? KING_END[idx] : PST[t][idx]);
    score += c === WHITE ? v : -v;
  }
  return pos.turn === WHITE ? score : -score;
}

const MATE = 100000;
export function search(fen, { depth = 4, timeMs = 1500, randomness = 0, history = [] } = {}) {
  const pos = new Chess(fen);
  const seen = new Set(history);
  const tt = new Map(), killers = [];
  const deadline = Date.now() + timeMs;
  let nodes = 0, stopped = false;

  const order = (moves, ttMove, ply) => {
    for (const m of moves) {
      m.score = m.captured ? 10 * VALUE[typeOf(m.captured)] - VALUE[typeOf(m.piece)] + 10000 : 0;
      if (m.promo) m.score += 9000;
      if (ttMove && m.from === ttMove.from && m.to === ttMove.to && m.promo === ttMove.promo) m.score = 1e6;
      else if (!m.captured && killers[ply] && killers[ply].some(k => k.from === m.from && k.to === m.to)) m.score = 5000;
    }
    return moves.sort((a, b) => b.score - a.score);
  };

  const quiesce = (alpha, beta, qd) => {
    if (++nodes % 2048 === 0 && Date.now() > deadline) stopped = true;
    const stand = evaluate(pos);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (qd > 6) return alpha;
    const us = pos.turn;
    for (const m of order(pos.pseudo(true), null, 0)) {
      pos.make(m);
      if (pos.attacked(pos.kings[us], us ^ 1)) { pos.unmake(); continue; }
      const s = -quiesce(-beta, -alpha, qd + 1);
      pos.unmake();
      if (s >= beta) return beta;
      if (s > alpha) alpha = s;
    }
    return alpha;
  };

  const negamax = (d, alpha, beta, ply) => {
    if (++nodes % 2048 === 0 && Date.now() > deadline) stopped = true;
    if (stopped) return 0;
    if (ply > 0 && (pos.half >= 100 || pos.repetitions() >= 2 || seen.has(`${pos.h1},${pos.h2}`))) return 0;
    const key = `${pos.h1},${pos.h2}`, entry = tt.get(key);
    if (entry && entry.depth >= d && ply > 0) {
      if (entry.flag === 0) return entry.score;
      if (entry.flag === 1 && entry.score >= beta) return entry.score;
      if (entry.flag === 2 && entry.score <= alpha) return entry.score;
    }
    const us = pos.turn, check = pos.attacked(pos.kings[us], us ^ 1);
    if (d <= 0 && !check) return quiesce(alpha, beta, 0);
    let best = -Infinity, bestMove = null, legal = 0; const start = alpha;
    for (const m of order(pos.pseudo(), entry?.move, ply)) {
      pos.make(m);
      if (pos.attacked(pos.kings[us], us ^ 1)) { pos.unmake(); continue; }
      legal++;
      const s = -negamax(d - 1 + (check ? 1 : 0) * (ply < 6 ? 1 : 0), -beta, -alpha, ply + 1);
      pos.unmake();
      if (stopped) return 0;
      if (s > best) { best = s; bestMove = m; }
      if (s > alpha) alpha = s;
      if (alpha >= beta) { if (!m.captured) { killers[ply] = [m, ...(killers[ply] || [])].slice(0, 2); } break; }
    }
    if (!legal) return check ? -MATE + ply : 0;
    tt.set(key, { depth: d, score: best, flag: best <= start ? 2 : best >= beta ? 1 : 0, move: bestMove });
    return best;
  };

  const rootMoves = pos.legalMoves();
  if (!rootMoves.length) return null;
  let bestMove = rootMoves[0], bestScore = 0, reached = 0;
  for (let d = 1; d <= depth; d++) {
    const scored = [];
    let alpha = -Infinity;
    const entry = tt.get(`${pos.h1},${pos.h2}`);
    for (const m of order(rootMoves.slice(), entry?.move, 0)) {
      pos.make(m);
      const s = -negamax(d - 1, -Infinity, -alpha + (randomness ? randomness : 0), 1);
      pos.unmake();
      if (stopped) break;
      scored.push({ m, s });
      if (s > alpha) alpha = s;
    }
    if (stopped && d > 1) break;
    if (!scored.length) break;
    scored.sort((a, b) => b.s - a.s);
    let pick = scored[0];
    if (randomness) {
      const pool = scored.filter(x => x.s >= scored[0].s - randomness);
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    bestMove = pick.m; bestScore = pick.s; reached = d;
    tt.set(`${pos.h1},${pos.h2}`, { depth: d, score: bestScore, flag: 0, move: scored[0].m });
    if (Math.abs(bestScore) > MATE - 100) break;
  }
  return { uci: pos.uci(bestMove), score: bestScore, depth: reached, nodes };
}
