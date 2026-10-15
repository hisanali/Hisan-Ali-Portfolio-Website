import * as T from '../evermile/vendor/three.module.js';
import { OrbitControls } from '../evermile/vendor/controls/OrbitControls.js';
import { RoundedBoxGeometry } from '../evermile/vendor/geometries/RoundedBoxGeometry.js';
import { pieceGeometry } from './pieces.js?v=1';
import { typeOf, colorOf, KNIGHT, WHITE } from './engine.js?v=1';

export const THEMES = {
  walnut: { label: 'Walnut', kind: 'wood', light: '#e3c497', lightGrain: '#a87a46', dark: '#5a3420', darkGrain: '#2c170b', frame: '#3b2416', frameGrain: '#1d0f07', inlay: '#d4ad62', white: '#f1e6cf', black: '#2a201c', table: '#17110d', fog: '#0d0a08' },
  marble: { label: 'Marble', kind: 'marble', light: '#efece6', lightGrain: '#9b9890', dark: '#33403b', darkGrain: '#9fb3a8', frame: '#1d2220', frameGrain: '#0b0d0c', inlay: '#c8c0a8', white: '#f6f3ec', black: '#18191b', table: '#101413', fog: '#090b0b' },
  tournament: { label: 'Tournament', kind: 'flat', light: '#ecebd0', lightGrain: '#d8d6b6', dark: '#6f9450', darkGrain: '#5c7d41', frame: '#2b3122', frameGrain: '#15190f', inlay: '#e8e0b8', white: '#f4f0e6', black: '#26221f', table: '#12150f', fog: '#0a0c08' }
};

const KNIGHT_TURN = 1.15;
export const squareToWorld =sq => new T.Vector3((sq & 7) - 3.5, 0, 3.5 - (sq >> 3));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function drawWood(ctx, x, y, w, h, base, grain, rand, vertical) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  ctx.translate(x + w / 2, y + h / 2); if (vertical) ctx.rotate(Math.PI / 2); ctx.translate(-w / 2, -h / 2);
  const tone = ctx.createLinearGradient(0, 0, w, h); tone.addColorStop(0, 'rgba(255,255,255,.06)'); tone.addColorStop(1, 'rgba(0,0,0,.08)');
  ctx.fillStyle = tone; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = grain;
  const lines = 46 + Math.floor(rand() * 20), phase = rand() * 10, wobble = 2 + rand() * 5;
  for (let i = 0; i < lines; i++) {
    const y0 = rand() * h * 1.1 - h * .05; ctx.globalAlpha = .05 + rand() * .2; ctx.lineWidth = .6 + rand() * 2.6;
    ctx.beginPath();
    for (let px = -4; px <= w + 4; px += 6) {
      const py = y0 + Math.sin(px * .018 + phase + i * .3) * wobble + Math.sin(px * .061 + i) * 1.2;
      px < 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  if (rand() > .45) { // a soft knot
    const kx = rand() * w, ky = rand() * h, kr = 8 + rand() * 18;
    for (let r = kr; r > 2; r -= 3) { ctx.globalAlpha = .08; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(kx, ky, r * 2.2, r, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawMarble(ctx, x, y, w, h, base, vein, rand) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  const cloud = ctx.createRadialGradient(x + rand() * w, y + rand() * h, 10, x + w / 2, y + h / 2, w);
  cloud.addColorStop(0, 'rgba(255,255,255,.12)'); cloud.addColorStop(1, 'rgba(0,0,0,.07)'); ctx.fillStyle = cloud; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = vein; ctx.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    let px = x + rand() * w, py = y - 10, angle = Math.PI / 2 + (rand() - .5) * 1.2;
    ctx.globalAlpha = .12 + rand() * .3; ctx.lineWidth = .5 + rand() * 2.2; ctx.beginPath(); ctx.moveTo(px, py);
    for (let s = 0; s < 60; s++) { angle += (rand() - .5) * .7; px += Math.cos(angle) * 7; py += Math.sin(angle) * 7; ctx.lineTo(px, py); }
    ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function boardTexture(theme) {
  const size = 2048, sq = size / 8, canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), rand = rng(7 + theme.kind.length * 31);
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const dark = (f + r) % 2 === 0, x = f * sq, y = (7 - r) * sq;
    const base = dark ? theme.dark : theme.light, grain = dark ? theme.darkGrain : theme.lightGrain;
    if (theme.kind === 'wood') drawWood(ctx, x, y, sq, sq, base, grain, rand, (f + r) % 2 === 0);
    else if (theme.kind === 'marble') drawMarble(ctx, x, y, sq, sq, base, grain, rand);
    else { ctx.fillStyle = base; ctx.fillRect(x, y, sq, sq); for (let i = 0; i < 900; i++) { ctx.fillStyle = grain; ctx.globalAlpha = rand() * .18; ctx.fillRect(x + rand() * sq, y + rand() * sq, 2, 2); } ctx.globalAlpha = 1; }
  }
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * sq, 0); ctx.lineTo(i * sq, size); ctx.moveTo(0, i * sq); ctx.lineTo(size, i * sq); ctx.stroke(); }
  return canvas;
}

function frameTexture(theme, frameSize) {
  const size = 2048, canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), rand = rng(99), unit = size / frameSize, inner = 8 * unit, off = (size - inner) / 2;
  if (theme.kind === 'marble') drawMarble(ctx, 0, 0, size, size, theme.frame, theme.frameGrain, rand);
  else drawWood(ctx, 0, 0, size, size, theme.frame, theme.frameGrain, rand, false);
  ctx.strokeStyle = theme.inlay; ctx.lineWidth = unit * .045; ctx.strokeRect(off - unit * .1, off - unit * .1, inner + unit * .2, inner + unit * .2);
  ctx.lineWidth = unit * .015; ctx.strokeRect(off - unit * .5, off - unit * .5, inner + unit, inner + unit);
  ctx.fillStyle = theme.inlay; ctx.font = `600 ${unit * .26}px "DM Serif Display", Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 8; i++) {
    const c = off + (i + .5) * unit, letter = 'abcdefgh'[i], number = String(i + 1);
    ctx.fillText(letter, c, size - off + unit * .3);
    ctx.save(); ctx.translate(c, off - unit * .3); ctx.rotate(Math.PI); ctx.fillText(letter, 0, 0); ctx.restore();
    const ry = size - off - (i + .5) * unit;
    ctx.fillText(number, off - unit * .3, ry);
    ctx.save(); ctx.translate(size - off + unit * .3, ry); ctx.rotate(Math.PI); ctx.fillText(number, 0, 0); ctx.restore();
  }
  return canvas;
}

function radialTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function environment(renderer) {
  const env = new T.Scene();
  const room = new T.Mesh(new T.BoxGeometry(30, 16, 30), new T.MeshStandardMaterial({ color: 0x1d1a17, side: T.BackSide, roughness: 1 }));
  room.position.y = 6; env.add(room);
  const panel = (w, h, color, intensity, pos, rot) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(intensity) }));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  panel(14, 8, '#fff3df', 4.2, [0, 13.9, 0], [Math.PI / 2, 0, 0]);
  panel(6, 10, '#ffd7a8', 1.6, [-14.9, 6, 2], [0, Math.PI / 2, 0]);
  panel(6, 10, '#bcd4ff', 1.1, [14.9, 6, -3], [0, -Math.PI / 2, 0]);
  panel(18, 3, '#ffffff', .8, [0, 4, -14.9], [0, 0, 0]);
  const pmrem = new T.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(env, .035).texture; pmrem.dispose();
  return texture;
}

export class ChessScene {
  constructor(canvas) {
    this.canvas = canvas;
    const renderer = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = this.scene = new T.Scene();
    scene.environment = environment(renderer);
    this.camera = new T.PerspectiveCamera(38, 1, .1, 200);
    this.camera.position.set(0, 26, 2);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .08, enablePan: false, minDistance: 8, maxDistance: 30, maxPolarAngle: 1.32, minPolarAngle: .05, rotateSpeed: .7, zoomSpeed: .8 });
    this.controls.target.set(0, 0, 0);

    scene.add(new T.HemisphereLight(0xfff1dd, 0x1a120c, .55));
    const key = this.key = new T.SpotLight(0xfff0dc, 520, 60, .58, .55, 1.6);
    key.position.set(5, 20, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .02; key.shadow.radius = 5;
    key.shadow.camera.near = 8; key.shadow.camera.far = 40;
    scene.add(key, key.target);
    const rim = new T.DirectionalLight(0xa9c4ff, .55); rim.position.set(-9, 7, -10); scene.add(rim);

    this.frameSize = 9.5;
    this.frameMat = new T.MeshPhysicalMaterial({ roughness: .45, clearcoat: .7, clearcoatRoughness: .25, envMapIntensity: .8 });
    this.frameSideMat = new T.MeshPhysicalMaterial({ roughness: .5, clearcoat: .6, clearcoatRoughness: .3, envMapIntensity: .7 });
    const frame = new T.Mesh(new RoundedBoxGeometry(this.frameSize, .46, this.frameSize, 5, .14), this.frameSideMat);
    frame.position.y = -.232; frame.receiveShadow = true; frame.castShadow = true; scene.add(frame);
    const frameTop = new T.Mesh(new T.PlaneGeometry(this.frameSize - .26, this.frameSize - .26), this.frameMat);
    frameTop.rotation.x = -Math.PI / 2; frameTop.position.y = .001; frameTop.receiveShadow = true; scene.add(frameTop);
    this.frameTopScale = (this.frameSize - .26);
    this.boardMat = new T.MeshPhysicalMaterial({ roughness: .32, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: .9 });
    const board = this.board = new T.Mesh(new T.PlaneGeometry(8, 8), this.boardMat);
    board.rotation.x = -Math.PI / 2; board.position.y = .003; board.receiveShadow = true; scene.add(board);

    this.tableMat = new T.MeshStandardMaterial({ roughness: .92, metalness: 0 });
    const table = new T.Mesh(new T.CircleGeometry(60, 64), this.tableMat);
    table.rotation.x = -Math.PI / 2; table.position.y = -.46; table.receiveShadow = true; scene.add(table);
    const pool = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: radialTexture([[0, 'rgba(255,220,170,.16)'], [.5, 'rgba(255,200,140,.05)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -.455; scene.add(pool);

    this.pieceMats = [
      new T.MeshPhysicalMaterial({ roughness: .26, clearcoat: 1, clearcoatRoughness: .05, sheen: .25, sheenRoughness: .5, envMapIntensity: 1.25 }),
      new T.MeshPhysicalMaterial({ roughness: .2, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.5 })
    ];
    this.pieces = new Map(); this.captured = [[], []];
    this.tweens = []; this.effects = [];
    this.marks = new T.Group(); scene.add(this.marks);
    this.makeMarks();
    this.raycaster = new T.Raycaster(); this.pointer = new T.Vector2();
    this.clock = new T.Clock(); this.cameraTween = null; this.orbitIdle = false;
    this.resize(); addEventListener('resize', () => this.resize());
    this.setTheme('walnut');
    renderer.setAnimationLoop(() => this.frame());
  }

  setTheme(name) {
    const theme = this.theme = THEMES[name] || THEMES.walnut; this.themeName = name in THEMES ? name : 'walnut';
    const tex = canvas => { const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; t.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); return t; };
    this.boardMat.map?.dispose(); this.boardMat.map = tex(boardTexture(theme)); this.boardMat.needsUpdate = true;
    this.frameMat.map?.dispose(); this.frameMat.map = tex(frameTexture(theme, this.frameTopScale)); this.frameMat.needsUpdate = true;
    this.frameSideMat.color.set(theme.frame);
    this.tableMat.color.set(theme.table);
    this.scene.background = new T.Color(theme.fog); this.scene.fog = new T.Fog(theme.fog, 24, 52);
    this.pieceMats[0].color.set(theme.white); this.pieceMats[0].sheenColor = new T.Color(theme.white);
    this.pieceMats[1].color.set(theme.black);
    this.boardMat.roughness = theme.kind === 'flat' ? .55 : theme.kind === 'marble' ? .22 : .32;
  }

  // Keeps the board centred in the screen area left free by the HUD (in CSS pixels).
  setInsets(insets = {}) { this.insets = { top: 0, right: 0, bottom: 0, left: 0, ...insets }; this.resize(); }

  resize() {
    const w = innerWidth, h = innerHeight, i = this.insets || { top: 0, right: 0, bottom: 0, left: 0 };
    const dx = (i.left - i.right) / 2, dy = (i.top - i.bottom) / 2, fullW = w + 2 * Math.abs(dx), fullH = h + 2 * Math.abs(dy);
    this.renderer.setSize(w, h, false); this.camera.aspect = fullW / fullH;
    if (dx || dy) this.camera.setViewOffset(fullW, fullH, dx < 0 ? -2 * dx : 0, dy < 0 ? -2 * dy : 0, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.view = { fullW, fullH, freeW: Math.max(200, w - i.left - i.right), freeH: Math.max(200, h - i.top - i.bottom) };
    const portrait = this.view.freeW / this.view.freeH < 1;
    if (portrait !== this.portrait) { this.portrait = portrait; if (this.captured) this.arrangeTrays(); }
    this.controls.maxDistance = Math.max(30, this.fitDistance() * 1.4);
  }

  fitDistance() {
    const tan = Math.tan(T.MathUtils.degToRad(this.camera.fov) / 2), { fullW, fullH, freeW, freeH } = this.view || { fullW: innerWidth, fullH: innerHeight, freeW: innerWidth, freeH: innerHeight };
    const portrait = freeW / freeH < 1;
    const needH = (portrait ? 11.4 : 11.6) * fullH / (freeH * 2 * tan), needW = (portrait ? 10.2 : 12.4) * fullW / (freeW * 2 * tan * this.camera.aspect);
    return Math.max(needH, needW) * (portrait ? .97 : 1.05);
  }

  viewFor(color, overhead = false) {
    const d = this.fitDistance(), polar = overhead ? .12 : (this.view && this.view.freeW / this.view.freeH < .8 ? .5 : .72), side = color === WHITE ? 1 : -1;
    return new T.Vector3(0, Math.cos(polar) * d, Math.sin(polar) * d * side);
  }

  moveCamera(to, duration = 1400) {
    const from = this.camera.position.clone(), sFrom = new T.Spherical().setFromVector3(from), sTo = new T.Spherical().setFromVector3(to);
    let dTheta = sTo.theta - sFrom.theta; while (dTheta > Math.PI) dTheta -= Math.PI * 2; while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    this.cameraTween = { start: performance.now(), duration, sFrom, dTheta, sTo };
  }

  makeMarks() {
    const plane = (size, color, opacity, map) => {
      const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, map: map || null, toneMapped: false }));
      m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2; this.marks.add(m); return m;
    };
    const soft = radialTexture([[0, 'rgba(255,255,255,1)'], [.55, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
    const squareTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.globalAlpha = .55; x.fillRect(0, 0, 128, 128); x.globalAlpha = 1; x.lineWidth = 10; x.strokeStyle = '#fff'; x.strokeRect(5, 5, 118, 118); const t = new T.CanvasTexture(c); return t; })();
    this.lastFrom = plane(1, 0xf4c95d, .42); this.lastTo = plane(1, 0xf4c95d, .5);
    this.selected = plane(1, 0xdfff63, .5, squareTex); this.hover = plane(1, 0xffffff, .16);
    this.hintFrom = plane(1, 0x6ab8ff, .55, squareTex); this.hintTo = plane(1, 0x6ab8ff, .55, squareTex);
    this.checkGlow = plane(1.9, 0xff3b2f, .9, soft);
    this.dotGeo = new T.CircleGeometry(.15, 32); this.ringGeo = new T.RingGeometry(.36, .45, 48);
    this.dotMat = new T.MeshBasicMaterial({ color: 0x0f1a10, transparent: true, opacity: .38, depthWrite: false });
    this.ringMat = new T.MeshBasicMaterial({ color: 0x0f1a10, transparent: true, opacity: .42, depthWrite: false });
    this.dots = [];
  }

  placeMark(mesh, sq, y = .006) { if (sq < 0 || sq == null) { mesh.visible = false; return; } const p = squareToWorld(sq); mesh.position.set(p.x, y, p.z); mesh.visible = true; }

  showLegal(moves) {
    this.dots.forEach(d => this.marks.remove(d)); this.dots = [];
    const seen = new Set();
    for (const m of moves) {
      if (seen.has(m.to)) continue; seen.add(m.to);
      const dot = new T.Mesh(m.captured ? this.ringGeo : this.dotGeo, m.captured ? this.ringMat : this.dotMat);
      dot.rotation.x = -Math.PI / 2; const p = squareToWorld(m.to); dot.position.set(p.x, .008, p.z); dot.renderOrder = 3; dot.scale.setScalar(.01);
      dot.userData.born = performance.now(); this.marks.add(dot); this.dots.push(dot);
    }
  }

  setLastMove(m) { this.placeMark(this.lastFrom, m ? m.from : -1); this.placeMark(this.lastTo, m ? m.to : -1); }
  setCheck(sq) { this.checkSquare = sq; this.placeMark(this.checkGlow, sq, .007); }
  setHint(m) { this.placeMark(this.hintFrom, m ? m.from : -1, .009); this.placeMark(this.hintTo, m ? m.to : -1, .009); }

  makePieceMesh(piece) {
    const mesh = new T.Mesh(pieceGeometry(typeOf(piece)), this.pieceMats[colorOf(piece)]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    if (typeOf(piece) === KNIGHT) mesh.rotation.y = KNIGHT_TURN + (colorOf(piece) === WHITE ? 0 : Math.PI);
    mesh.userData.piece = piece; this.scene.add(mesh); return mesh;
  }

  setPosition(board) {
    for (const mesh of this.pieces.values()) this.scene.remove(mesh);
    for (const list of this.captured) for (const mesh of list) this.scene.remove(mesh);
    this.pieces.clear(); this.captured = [[], []]; this.tweens = [];
    for (let sq = 0; sq < 64; sq++) if (board[sq]) {
      const mesh = this.makePieceMesh(board[sq]); mesh.position.copy(squareToWorld(sq)); mesh.userData.square = sq; this.pieces.set(sq, mesh);
    }
  }

  setCapturedFromCounts(capturedPieces) {
    for (const piece of capturedPieces) {
      const mesh = this.makePieceMesh(piece); const slot = this.trayPosition(colorOf(piece) ^ 1, this.captured[colorOf(piece) ^ 1].length);
      mesh.position.copy(slot); mesh.scale.setScalar(.62); mesh.userData.settled = true; this.captured[colorOf(piece) ^ 1].push(mesh);
    }
  }

  // Captured pieces stand on the table beside the capturer's edge of the board (or behind it on portrait screens).
  trayPosition(capturer, index) {
    const side = capturer === WHITE ? 1 : -1, row = Math.floor(index / 8), col = index % 8, out = this.frameSize / 2 + .55 + row * .62;
    if (this.portrait) return new T.Vector3(side * (3.6 - col * .62 - .2), -.46, side * out);
    return new T.Vector3(side * out, -.46, side * (3.5 - col * .62 - .2));
  }

  arrangeTrays() {
    for (const capturer of [0, 1]) this.captured[capturer].forEach((mesh, i) => { if (mesh.userData.settled) mesh.position.copy(this.trayPosition(capturer, i)); });
  }

  tween(duration, update, done) { return new Promise(resolve => this.tweens.push({ start: performance.now(), duration, update, done: () => { done?.(); resolve(); } })); }

  async animateMove(m, fast = false, startAt = null) {
    const mesh = this.pieces.get(m.from); if (!mesh) return;
    this.pieces.delete(m.from); mesh.userData.lift = mesh.userData.liftNow = 0;
    const captureSq = m.flags & 2 ? m.to + (colorOf(m.piece) === WHITE ? -8 : 8) : m.to;
    const victim = m.captured ? this.pieces.get(captureSq) : null;
    if (victim) this.pieces.delete(captureSq);
    const from = startAt || squareToWorld(m.from), to = squareToWorld(m.to), distance = from.distanceTo(to);
    const knight = typeOf(m.piece) === KNIGHT, height = startAt ? 0 : knight ? 1.4 : Math.min(.35 + distance * .09, .9), duration = startAt ? 150 : fast ? 160 : 300 + distance * 45;
    const jobs = [this.tween(duration, t => {
      const e = ease(t); mesh.position.lerpVectors(from, to, e); mesh.position.y += Math.sin(Math.PI * e) * height;
      mesh.rotation.z = Math.sin(Math.PI * e) * (to.x - from.x) * -.04; mesh.rotation.x = Math.sin(Math.PI * e) * (to.z - from.z) * .04;
    }, () => { mesh.position.copy(to); mesh.rotation.x = mesh.rotation.z = 0; mesh.userData.square = m.to; })];
    if (m.flags & 4) {
      const [rf, rt] = m.to > m.from ? [m.from + 3, m.from + 1] : [m.from - 4, m.from - 1];
      const rook = this.pieces.get(rf); this.pieces.delete(rf);
      if (rook) { const a = squareToWorld(rf), b = squareToWorld(rt); jobs.push(new Promise(r => setTimeout(r, fast ? 0 : 140)).then(() => this.tween(fast ? 160 : 420, t => { const e = ease(t); rook.position.lerpVectors(a, b, e); rook.position.y = Math.sin(Math.PI * e) * .8; }, () => { rook.position.copy(b); rook.userData.square = rt; this.pieces.set(rt, rook); }))); }
    }
    if (victim) jobs.push(new Promise(r => setTimeout(r, fast ? 0 : duration * .72)).then(() => this.capture(victim, colorOf(m.piece), fast)));
    this.pieces.set(m.to, mesh);
    await Promise.all(jobs);
    if (!fast) this.thud(to, victim ? 1 : .5);
    if (m.promo) await this.promote(m.to, m.promo, fast);
  }

  async capture(mesh, capturer, fast) {
    const start = mesh.position.clone(), slot = this.trayPosition(capturer, this.captured[capturer].length);
    this.captured[capturer].push(mesh);
    if (!fast) this.burst(start, colorOf(mesh.userData.piece) === WHITE ? 0xfff2d6 : 0x8b6a4c, 26);
    const spin = (Math.random() - .5) * 6;
    await this.tween(fast ? 120 : 760, t => {
      const e = ease(t); mesh.position.lerpVectors(start, slot, e); mesh.position.y = start.y + Math.sin(Math.PI * e) * 2.4 + (slot.y - start.y) * e;
      mesh.scale.setScalar(1 - .38 * e); mesh.rotation.y = spin * e; mesh.rotation.z = Math.sin(Math.PI * e) * .7;
    }, () => { mesh.userData.settled = true; mesh.position.copy(this.trayPosition(capturer, this.captured[capturer].indexOf(mesh))); mesh.rotation.z = 0; });
  }

  async promote(sq, piece, fast) {
    const old = this.pieces.get(sq), pos = squareToWorld(sq);
    const fresh = this.makePieceMesh(piece); fresh.position.copy(pos); fresh.userData.square = sq; fresh.scale.setScalar(.01);
    this.pieces.set(sq, fresh);
    if (!fast) this.burst(pos.clone().setY(.6), 0xdfff63, 40);
    await this.tween(fast ? 60 : 520, t => { if (old) old.scale.setScalar(Math.max(.01, 1 - t * 1.6)); fresh.scale.setScalar(Math.max(.01, easeOutBack(t))); fresh.rotation.y = (1 - t) * Math.PI * 2 + (typeOf(piece) === KNIGHT ? KNIGHT_TURN + (colorOf(piece) === WHITE ? 0 : Math.PI) : 0); },
      () => { if (old) this.scene.remove(old); fresh.scale.setScalar(1); });
  }

  thud(at, strength) {
    const ring = new T.Mesh(new T.RingGeometry(.3, .38, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45 * strength, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(at.x, .01, at.z); this.scene.add(ring);
    this.tween(520, t => { ring.scale.setScalar(1 + t * 1.6); ring.material.opacity = .45 * strength * (1 - t); }, () => { this.scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); });
  }

  burst(at, color, count) {
    const geo = new T.BufferGeometry(), pos = new Float32Array(count * 3), vel = [];
    for (let i = 0; i < count; i++) { pos.set([at.x, at.y + .4, at.z], i * 3); const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3; vel.push([Math.cos(a) * s, 2 + Math.random() * 4, Math.sin(a) * s]); }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ color, size: .09, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    this.scene.add(pts);
    this.effects.push({ life: 0, max: 1.1, update: (dt, e) => {
      for (let i = 0; i < count; i++) { vel[i][1] -= 9 * dt; pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] = Math.max(.02, pos[i * 3 + 1] + vel[i][1] * dt); pos[i * 3 + 2] += vel[i][2] * dt; }
      geo.attributes.position.needsUpdate = true; pts.material.opacity = 1 - e.life / e.max;
    }, dispose: () => { this.scene.remove(pts); geo.dispose(); pts.material.dispose(); } });
  }

  confetti() {
    const count = 260, geo = new T.PlaneGeometry(.14, .22), mat = new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false });
    const mesh = new T.InstancedMesh(geo, mat, count), palette = [0xdfff63, 0xf47a52, 0x8b7bff, 0x66a6ff, 0xffffff, 0xf4c95d], items = [], m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, new T.Color(palette[i % palette.length]));
      items.push({ p: new T.Vector3((Math.random() - .5) * 12, 9 + Math.random() * 8, (Math.random() - .5) * 12), v: new T.Vector3((Math.random() - .5) * 2, -1 - Math.random() * 2, (Math.random() - .5) * 2), r: new T.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: new T.Vector3((Math.random() - .5) * 8, (Math.random() - .5) * 8, (Math.random() - .5) * 8) });
    }
    this.scene.add(mesh);
    this.effects.push({ life: 0, max: 6, update: (dt) => {
      items.forEach((it, i) => {
        it.v.y = Math.max(it.v.y - 2.2 * dt, -3.2); it.p.addScaledVector(it.v, dt); it.p.x += Math.sin(it.r.x) * dt * .6; it.r.addScaledVector(it.w, dt);
        if (it.p.y < .02) { it.p.y = .02; it.v.set(0, 0, 0); it.w.set(0, 0, 0); }
        m.compose(it.p, q.setFromEuler(e.set(it.r.x, it.r.y, it.r.z)), s); mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }, dispose: () => { this.scene.remove(mesh); geo.dispose(); mat.dispose(); } });
  }

  topple(sq) {
    const king = this.pieces.get(sq); if (!king) return;
    const dir = Math.random() < .5 ? 1 : -1;
    this.tween(1100, t => { const b = t < .7 ? ease(t / .7) : 1 + Math.sin((t - .7) / .3 * Math.PI) * .06; king.rotation.z = dir * b * 1.42; king.position.y = Math.sin(b * 1.42) * .28; king.position.x = squareToWorld(sq).x + dir * -Math.sin(b * 1.42) * .5; });
  }

  lift(sq, amount) { const mesh = this.pieces.get(sq); if (mesh) mesh.userData.lift = amount; }

  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.pieces.values()], false);
    const p = new T.Vector3(), onBoard = this.raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), p);
    const f = Math.floor(p.x + 4), r = Math.floor(4 - p.z), boardSquare = onBoard && f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1;
    // A tall piece in front can overlap a shorter one behind it; prefer the piece standing on the square under the pointer.
    const hit = hits.find(h => h.object.userData.square === boardSquare) || hits[0];
    if (hit) return { square: hit.object.userData.square, piece: true, boardSquare };
    return boardSquare >= 0 ? { square: boardSquare, piece: false, boardSquare } : null;
  }

  pointOnPlane(clientX, clientY, y) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const p = new T.Vector3(); return this.raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -y), p) ? p : null;
  }

  frame() {
    const now = performance.now(), dt = Math.min(this.clock.getDelta(), .05), time = now / 1000;
    this.tweens = this.tweens.filter(tw => { const t = Math.min(1, (now - tw.start) / tw.duration); tw.update(t); if (t >= 1) { tw.done(); return false; } return true; });
    this.effects = this.effects.filter(fx => { fx.life += dt; fx.update(dt, fx); if (fx.life >= fx.max) { fx.dispose(); return false; } return true; });
    for (const mesh of this.pieces.values()) {
      if (mesh === this.dragging) continue;
      const target = mesh.userData.lift || 0, cur = mesh.userData.liftNow || 0, next = cur + (target - cur) * (1 - Math.exp(-dt * 14));
      if (Math.abs(next - cur) > 1e-4 || target) { mesh.position.y += next - cur; mesh.userData.liftNow = next; }
    }
    for (const dot of this.dots) { const t = Math.min(1, (now - dot.userData.born) / 220); dot.scale.setScalar(Math.max(.01, easeOutBack(t))); }
    if (this.checkGlow.visible) { const s = 1 + Math.sin(time * 5) * .12; this.checkGlow.scale.setScalar(s); this.checkGlow.material.opacity = .65 + Math.sin(time * 5) * .25; }
    if (this.selected.visible) this.selected.material.opacity = .42 + Math.sin(time * 4) * .12;
    if (this.cameraTween) {
      const c = this.cameraTween, t = Math.min(1, (now - c.start) / c.duration), e = ease(t);
      const s = new T.Spherical(T.MathUtils.lerp(c.sFrom.radius, c.sTo.radius, e), T.MathUtils.lerp(c.sFrom.phi, c.sTo.phi, e), c.sFrom.theta + c.dTheta * e);
      this.camera.position.setFromSpherical(s); this.camera.lookAt(this.controls.target);
      if (t >= 1) this.cameraTween = null;
    } else if (this.orbitIdle) {
      const s = new T.Spherical().setFromVector3(this.camera.position); s.theta += dt * .07; this.camera.position.setFromSpherical(s); this.camera.lookAt(this.controls.target);
    } else this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
