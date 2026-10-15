import * as T from '../evermile/vendor/three.module.js';
import { OrbitControls } from '../evermile/vendor/controls/OrbitControls.js';
import { RoundedBoxGeometry } from '../evermile/vendor/geometries/RoundedBoxGeometry.js';
import { START, FINISH } from './rules.js?v=1';

export const HEX = { red: '#d42a2a', green: '#119a4c', yellow: '#eaa80c', blue: '#1f62d6' };
const U = .62;
const TRACK = [[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6]];
const HOME = { red: [[1,7],[2,7],[3,7],[4,7],[5,7]], green: [[7,1],[7,2],[7,3],[7,4],[7,5]], yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]], blue: [[7,13],[7,12],[7,11],[7,10],[7,9]] };
const YARD = { red: [0, 0], green: [9, 0], yellow: [9, 9], blue: [0, 9] };
const CENTER = { red: [6.15, 7], green: [7, 6.15], yellow: [7.85, 7], blue: [7, 7.85] };
const STARS = [8, 21, 34, 47];

const toWorld = ([x, y]) => new T.Vector3((x - 7) * U, 0, (y - 7) * U);
export function cellOf(color, progress, index) {
  if (progress < 0) { const [ox, oy] = YARD[color]; return [ox + 1.5 + (index % 2) * 2.5 + .25, oy + 1.5 + Math.floor(index / 2) * 2.5 + .25].map(v => v - .5); }
  if (progress === FINISH) { const [x, y] = CENTER[color], o = (index - 1.5) * .28; return color === 'red' || color === 'yellow' ? [x, y + o] : [x + o, y]; }
  if (progress > 50) return HOME[color][progress - 51];
  return TRACK[(START[color] + progress) % 52];
}
export const positionOf = (color, progress, index) => toWorld(cellOf(color, progress, index));

function boardTexture() {
  const N = 15, size = 2400, c = size / N, cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, size, size);
  const cell = (x, y, fill) => { g.fillStyle = fill; g.fillRect(x * c, y * c, c, c); };
  for (const [color, [ox, oy]] of Object.entries(YARD)) {
    g.fillStyle = HEX[color]; g.fillRect(ox * c, oy * c, 6 * c, 6 * c);
    g.fillStyle = '#fbf6ea'; const r = c * .6; g.beginPath(); g.roundRect((ox + 1) * c, (oy + 1) * c, 4 * c, 4 * c, r); g.fill();
    for (let i = 0; i < 4; i++) {
      const [x, y] = cellOf(color, -1, i); const px = (x + .5) * c, py = (y + .5) * c;
      g.fillStyle = HEX[color]; g.beginPath(); g.arc(px, py, c * .62, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(px, py, c * .42, 0, Math.PI * 2); g.fill();
    }
  }
  for (const [color, cells] of Object.entries(HOME)) cells.forEach(([x, y]) => cell(x, y, HEX[color]));
  for (const color of Object.keys(START)) { const [x, y] = TRACK[START[color]]; cell(x, y, HEX[color]); }
  const mid = 7.5 * c, corners = { red: [[6, 6], [6, 9]], green: [[6, 6], [9, 6]], yellow: [[9, 6], [9, 9]], blue: [[6, 9], [9, 9]] };
  for (const [color, [[ax, ay], [bx, by]]] of Object.entries(corners)) { g.fillStyle = HEX[color]; g.beginPath(); g.moveTo(ax * c, ay * c); g.lineTo(bx * c, by * c); g.lineTo(mid, mid); g.closePath(); g.fill(); }
  g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 4;
  for (const [x, y] of [...TRACK, ...Object.values(HOME).flat()]) g.strokeRect(x * c, y * c, c, c);
  g.lineWidth = 6; g.strokeRect(6 * c, 6 * c, 3 * c, 3 * c);
  const star = (x, y, fill) => { const px = (x + .5) * c, py = (y + .5) * c; g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? c * .16 : c * .36; g.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } g.closePath(); g.fill(); };
  STARS.forEach(i => star(...TRACK[i], 'rgba(60,50,40,.55)'));
  for (const color of Object.keys(START)) star(...TRACK[START[color]], 'rgba(255,255,255,.85)');
  return cv;
}

function diceFace(n) {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const g = cv.getContext('2d');
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, s, s);
  const pips = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.27, .27], [.5, .5], [.73, .73]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.27, .27], [.73, .27], [.5, .5], [.27, .73], [.73, .73]], 6: [[.27, .25], [.73, .25], [.27, .5], [.73, .5], [.27, .75], [.73, .75]] }[n];
  for (const [x, y] of pips) { const gr = g.createRadialGradient(x * s - 5, y * s - 5, 2, x * s, y * s, 26); gr.addColorStop(0, n === 1 ? '#ff5a4a' : '#3a3a3a'); gr.addColorStop(1, n === 1 ? '#a80f0f' : '#0c0c0c'); g.fillStyle = gr; g.beginPath(); g.arc(x * s, y * s, n === 1 ? 34 : 24, 0, Math.PI * 2); g.fill(); }
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
}
// Box face order: +x, -x, +y, -y, +z, -z.
const FACE_VALUES = [3, 4, 1, 6, 2, 5];
const FACE_NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function environment(renderer) {
  const env = new T.Scene();
  env.add(new T.Mesh(new T.BoxGeometry(30, 16, 30), new T.MeshStandardMaterial({ color: 0x1d1a17, side: T.BackSide })));
  const panel = (w, h, color, k, pos, rot) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(k) })); m.position.set(...pos); m.rotation.set(...rot); env.add(m); };
  panel(14, 8, '#fff3df', 4.2, [0, 7.9, 0], [Math.PI / 2, 0, 0]);
  panel(6, 10, '#ffd7a8', 1.6, [-14.9, 2, 2], [0, Math.PI / 2, 0]);
  panel(6, 10, '#bcd4ff', 1.1, [14.9, 2, -3], [0, -Math.PI / 2, 0]);
  const pm = new T.PMREMGenerator(renderer), tex = pm.fromScene(env, .035).texture; pm.dispose(); return tex;
}

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class LudoScene {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = .82;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    const s = this.scene = new T.Scene(); s.environment = environment(r);
    s.background = new T.Color('#0d0b10'); s.fog = new T.Fog('#0d0b10', 22, 48);
    this.camera = new T.PerspectiveCamera(38, 1, .1, 200);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .08, enablePan: false, minDistance: 7, maxDistance: 80, maxPolarAngle: 1.2, rotateSpeed: .7 });
    s.add(new T.HemisphereLight(0xfff1dd, 0x1a120c, .6));
    const key = new T.SpotLight(0xfff0dc, 420, 60, .6, .55, 1.6); key.position.set(4, 19, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .02; s.add(key, key.target);
    const rim = new T.DirectionalLight(0xa9c4ff, .5); rim.position.set(-9, 7, -10); s.add(rim);

    const side = 15 * U;
    const frame = new T.Mesh(new RoundedBoxGeometry(side + .7, .42, side + .7, 5, .16), new T.MeshPhysicalMaterial({ color: '#3a2416', roughness: .45, clearcoat: .8, clearcoatRoughness: .2 }));
    frame.position.y = -.21; frame.receiveShadow = frame.castShadow = true; s.add(frame);
    const tex = new T.CanvasTexture(boardTexture()); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    const board = new T.Mesh(new T.PlaneGeometry(side, side), new T.MeshPhysicalMaterial({ map: tex, color: '#b9b9b9', roughness: .55, clearcoat: .45, clearcoatRoughness: .35, envMapIntensity: .55 }));
    board.rotation.x = -Math.PI / 2; board.position.y = .002; board.receiveShadow = true; s.add(board);
    const table = new T.Mesh(new T.CircleGeometry(60, 64), new T.MeshStandardMaterial({ color: '#16121a', roughness: .92 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -.42; table.receiveShadow = true; s.add(table);

    const profile = [[0, 0], [.2, 0], [.215, .03], [.2, .06], [.13, .12], [.09, .26], [.1, .31], [.14, .33], [.1, .36], [.07, .38]];
    const arcPts = Array.from({ length: 13 }, (_, i) => { const a = -1 + i / 12 * (Math.PI / 2 + 1); return [Math.max(0, Math.cos(a) * .12), .47 + Math.sin(a) * .12]; });
    this.tokenGeo = new T.LatheGeometry([...profile, ...arcPts].map(([x, y]) => new T.Vector2(x, y)), 48);
    this.tokenMats = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, new T.MeshPhysicalMaterial({ color: v, roughness: .18, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.3 })]));
    this.tokens = {};

    const dice = this.dice = new T.Mesh(new RoundedBoxGeometry(.62, .62, .62, 5, .1), [1, 2, 3, 4, 5, 6].map(i => new T.MeshPhysicalMaterial({ map: diceFace(FACE_VALUES[i - 1]), roughness: .25, clearcoat: 1, clearcoatRoughness: .08 })));
    dice.castShadow = true; dice.position.set(0, .31, 0); s.add(dice);
    const ringGeo = new T.RingGeometry(.2, .27, 40);
    this.rings = []; for (let i = 0; i < 4; i++) { const m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; s.add(m); this.rings.push(m); }

    this.tweens = []; this.effects = []; this.clock = new T.Clock(); this.raycaster = new T.Raycaster(); this.ptr = new T.Vector2();
    this.resize(); addEventListener('resize', () => this.resize());
    r.setAnimationLoop(() => this.frame());
  }

  // The view is nudged up so the bottom dock never covers the board.
  resize() { const w = innerWidth, h = innerHeight, lift = h < 600 ? 30 : 46; this.renderer.setSize(w, h, false); this.camera.aspect = w / (h + lift * 2); this.camera.setViewOffset(w, h + lift * 2, 0, lift * 2, w, h); this.camera.updateProjectionMatrix(); }

  viewFor(color, extra = 1) {
    const aspect = this.camera.aspect, tan = Math.tan(T.MathUtils.degToRad(19)), portrait = aspect < .8;
    // Landscape looks across the board's diagonal; portrait faces an edge so the board fills the narrow screen.
    const width = portrait ? 10.6 : 14.8, polar = portrait ? .3 : .52;
    const d = Math.max(12.5 / (2 * tan), width / (2 * tan * aspect)) * (portrait ? 1.04 : 1.22) * extra;
    let [dx, dz] = { red: [-1, -1], green: [1, -1], yellow: [1, 1], blue: [-1, 1] }[color] || [0, 1];
    if (portrait) [dx, dz] = [(dx + dz) / 2, (dz - dx) / 2];
    this.scene.fog.near = d * .9; this.scene.fog.far = d * 2.4;
    const k = Math.sin(polar) * d / Math.hypot(dx, dz);
    return new T.Vector3(dx * k, Math.cos(polar) * d, dz * k);
  }

  moveCamera(to, duration = 1400) {
    const from = new T.Spherical().setFromVector3(this.camera.position), dest = new T.Spherical().setFromVector3(to);
    let dt = dest.theta - from.theta; while (dt > Math.PI) dt -= Math.PI * 2; while (dt < -Math.PI) dt += Math.PI * 2;
    this.camTween = { start: performance.now(), duration, from, dest, dt };
  }

  tween(duration, update) { return new Promise(resolve => this.tweens.push({ start: performance.now(), duration, update, done: resolve })); }

  setTokens(state) {
    for (const m of Object.values(this.tokens).flat()) this.scene.remove(m);
    this.tokens = {};
    for (const color of state.colors) this.tokens[color] = state.tokens[color].map((p, i) => {
      const m = new T.Mesh(this.tokenGeo, this.tokenMats[color]); m.castShadow = m.receiveShadow = true;
      m.userData = { color, index: i }; m.position.copy(positionOf(color, p, i)); this.scene.add(m); return m;
    });
    this.spread(state);
  }

  // Tokens sharing a square shrink and fan out so each stays visible and clickable.
  spread(state) {
    const groups = new Map();
    for (const color of state.colors) state.tokens[color].forEach((p, i) => {
      if (p < 0 || p === FINISH) { const m = this.tokens[color][i]; m.userData.offset = new T.Vector3(); m.userData.scale = 1; return; }
      const key = cellOf(color, p, i).join(','); if (!groups.has(key)) groups.set(key, []); groups.get(key).push([color, i]);
    });
    for (const list of groups.values()) list.forEach(([color, i], k) => {
      const m = this.tokens[color][i], n = list.length, a = k / n * Math.PI * 2;
      m.userData.offset = n > 1 ? new T.Vector3(Math.cos(a) * .15, 0, Math.sin(a) * .15) : new T.Vector3(); m.userData.scale = n > 1 ? .78 : 1;
    });
    for (const color of state.colors) state.tokens[color].forEach((p, i) => {
      const m = this.tokens[color][i]; if (m.userData.moving) return;
      m.position.copy(positionOf(color, p, i)).add(m.userData.offset); m.scale.setScalar(m.userData.scale);
    });
  }

  async rollDice(value) {
    const d = this.dice, up = new T.Vector3(0, 1, 0), face = FACE_VALUES.indexOf(value);
    const end = new T.Quaternion().setFromUnitVectors(new T.Vector3(...FACE_NORMALS[face]), up);
    end.premultiply(new T.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2));
    const axis = new T.Vector3(Math.random() - .5, .3, Math.random() - .5).normalize(), spins = 3 + Math.random() * 2;
    const startPos = new T.Vector3((Math.random() - .5) * 1.2, 2.6, 1.2), endPos = new T.Vector3((Math.random() - .5) * .5, .31, (Math.random() - .5) * .5);
    await this.tween(900, t => {
      const e = 1 - Math.pow(1 - t, 3), bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * .9;
      d.position.lerpVectors(startPos, endPos, e); d.position.y = .31 + (2.3 * (1 - e)) * (1 - t) + bounce;
      const spin = new T.Quaternion().setFromAxisAngle(axis, (1 - e) * spins * Math.PI * 2);
      d.quaternion.copy(end).premultiply(spin);
    });
    d.quaternion.copy(end); d.position.copy(endPos);
    this.pulse(endPos, '#ffffff');
  }

  async moveToken(color, index, from, to) {
    const m = this.tokens[color][index]; m.userData.moving = true; m.scale.setScalar(1);
    const steps = from < 0 ? [0] : Array.from({ length: to - from }, (_, k) => from + k + 1);
    let prev = m.position.clone();
    for (const p of steps) {
      const next = positionOf(color, p, index);
      const a = prev.clone();
      await this.tween(from < 0 ? 420 : 170, t => { const e = ease(t); m.position.lerpVectors(a, next, e); m.position.y = Math.sin(Math.PI * t) * (from < 0 ? .9 : .38); });
      prev = next; this.tap();
    }
    m.userData.moving = false;
    if (to === FINISH) { const final = positionOf(color, FINISH, index); await this.tween(380, t => m.position.lerpVectors(prev, final, ease(t))); this.burst(final, HEX[color], 50); }
  }

  async sendHome(color, index) {
    const m = this.tokens[color][index], a = m.position.clone(), b = positionOf(color, -1, index);
    m.userData.moving = true; this.burst(a, HEX[color], 30);
    await this.tween(800, t => { const e = ease(t); m.position.lerpVectors(a, b, e); m.position.y = Math.sin(Math.PI * e) * 3; m.rotation.x = e * Math.PI * 4; });
    m.rotation.x = 0; m.userData.moving = false;
  }

  highlight(color, indices) {
    this.rings.forEach((ring, k) => {
      const i = indices[k]; ring.visible = i != null;
      if (i != null) { ring.userData.target = this.tokens[color][i]; ring.material.color.set(HEX[color]); }
    });
  }

  pick(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    this.ptr.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.ptr, this.camera);
    const hit = this.raycaster.intersectObjects([...Object.values(this.tokens).flat(), this.dice], false)[0];
    if (!hit) return null;
    return hit.object === this.dice ? { dice: true } : { ...hit.object.userData };
  }

  pulse(at, color) {
    const ring = new T.Mesh(new T.RingGeometry(.3, .38, 48), new T.MeshBasicMaterial({ color, transparent: true, opacity: .5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(at.x, .01, at.z); this.scene.add(ring);
    this.tween(600, t => { ring.scale.setScalar(1 + t * 2); ring.material.opacity = .5 * (1 - t); }).then(() => this.scene.remove(ring));
  }

  burst(at, color, count) {
    const geo = new T.BufferGeometry(), pos = new Float32Array(count * 3), vel = [];
    for (let i = 0; i < count; i++) { pos.set([at.x, at.y + .3, at.z], i * 3); const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5; vel.push([Math.cos(a) * s, 2 + Math.random() * 4, Math.sin(a) * s]); }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ color, size: .1, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); this.scene.add(pts);
    this.effects.push({ life: 0, max: 1.1, update: (dt, e) => { for (let i = 0; i < count; i++) { vel[i][1] -= 9 * dt; pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] = Math.max(.02, pos[i * 3 + 1] + vel[i][1] * dt); pos[i * 3 + 2] += vel[i][2] * dt; } geo.attributes.position.needsUpdate = true; pts.material.opacity = 1 - e.life / e.max; }, dispose: () => { this.scene.remove(pts); geo.dispose(); } });
  }

  confetti() {
    const n = 240, mesh = new T.InstancedMesh(new T.PlaneGeometry(.12, .2), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), n), items = [], mx = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), one = new T.Vector3(1, 1, 1), pal = Object.values(HEX).concat('#ffffff');
    for (let i = 0; i < n; i++) { mesh.setColorAt(i, new T.Color(pal[i % pal.length])); items.push({ p: new T.Vector3((Math.random() - .5) * 11, 8 + Math.random() * 8, (Math.random() - .5) * 11), v: -1 - Math.random() * 2, r: new T.Vector3(Math.random() * 6, Math.random() * 6, 0), w: (Math.random() - .5) * 8 }); }
    this.scene.add(mesh);
    this.effects.push({ life: 0, max: 6, update: dt => { items.forEach((it, i) => { it.p.y = Math.max(.02, it.p.y + it.v * dt); if (it.p.y > .02) { it.r.x += it.w * dt; it.r.y += it.w * dt; } mx.compose(it.p, q.setFromEuler(e.set(it.r.x, it.r.y, 0)), one); mesh.setMatrixAt(i, mx); }); mesh.instanceMatrix.needsUpdate = true; }, dispose: () => this.scene.remove(mesh) });
  }

  tap() { this.onTap?.(); }

  frame() {
    const now = performance.now(), dt = Math.min(this.clock.getDelta(), .05);
    this.tweens = this.tweens.filter(tw => { const t = Math.min(1, (now - tw.start) / tw.duration); tw.update(t); if (t >= 1) { tw.done(); return false; } return true; });
    this.effects = this.effects.filter(fx => { fx.life += dt; fx.update(dt, fx); if (fx.life >= fx.max) { fx.dispose(); return false; } return true; });
    for (const ring of this.rings) if (ring.visible && ring.userData.target) { const p = ring.userData.target.position; ring.position.set(p.x, .012, p.z); ring.scale.setScalar(1.2 + Math.sin(now / 160) * .18); }
    if (this.camTween) {
      const c = this.camTween, t = Math.min(1, (now - c.start) / c.duration), e = ease(t);
      this.camera.position.setFromSpherical(new T.Spherical(T.MathUtils.lerp(c.from.radius, c.dest.radius, e), T.MathUtils.lerp(c.from.phi, c.dest.phi, e), c.from.theta + c.dt * e));
      this.camera.lookAt(0, 0, 0); if (t >= 1) this.camTween = null;
    } else if (this.idle) { const s = new T.Spherical().setFromVector3(this.camera.position); s.theta += dt * .08; this.camera.position.setFromSpherical(s); this.camera.lookAt(0, 0, 0); }
    else this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
