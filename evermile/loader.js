import * as T from './vendor/three.module.js';

/* ---------- Loading screen: EVERMILE wordmark, tail-light drift and tyre smoke over black ---------- */
// Every model and texture goes through three's default loading manager, so it can tell us when the world is really ready.
// FileLoader is wrapped so large GLBs report bytes, which moves the bar evenly instead of stalling on the horse or the train.
const manager = T.DefaultLoadingManager, active = new Set(), files = new Map();
let started = 0, ended = 0;
{
  const start = manager.itemStart, end = manager.itemEnd;
  manager.itemStart = (url) => { started++; active.add(url); start(url); };
  manager.itemEnd = (url) => { ended++; active.delete(url); end(url); };
  const load = T.FileLoader.prototype.load;
  T.FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    const key = this.manager.resolveURL((this.path || '') + url), entry = files.get(key) || {loaded: 0, total: 0, done: false};
    files.set(key, entry); entry.done = false;
    const finish = () => { entry.done = true; entry.loaded = entry.total = Math.max(entry.total, entry.loaded, 1); };
    return load.call(this, url, (data) => { finish(); onLoad?.(data); }, (e) => { entry.loaded = e.loaded; if (e.lengthComputable) entry.total = e.total; onProgress?.(e); }, (err) => { finish(); onError?.(err); });
  };
}
const ESTIMATE = 1.5e6;
function snapshot() { return {started, ended, files: new Set(files.keys())}; }
function progress(base) {
  let loaded = 0, total = 0;
  for (const [url, f] of files) { if (base.files.has(url) && f.done) continue; loaded += f.done ? f.total : f.loaded; total += f.done ? f.total : Math.max(f.total, f.loaded, ESTIMATE); }
  const items = started - base.started, bytes = total ? loaded / total : 1;
  return .78 * bytes + .22 * (items ? (ended - base.ended) / items : 1);
}
const idle = () => started === ended;

const STAGES = [[/materials\//, 'Laying the road'], [/train/, 'Setting the trains on their rails'], [/pedestrian|citizen/, 'Waking the towns'], [/horse|fox|bighorn|cow|dog|cat|animal/, 'Letting the animals out'],
  [/place-/, 'Raising the old town'], [/prop-/, 'Opening the petrol station'], [/road-|coupe|motorcycle|traffic/, 'Fuelling the traffic']];
function stage() { for (const url of active) for (const [pattern, label] of STAGES) if (pattern.test(url)) return label; return active.size ? 'Preparing the scenery' : null; }

const frameOrTimeout = () => new Promise((r) => { const t = setTimeout(r, 120); requestAnimationFrame(() => { clearTimeout(t); r(); }); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export class Intro {
  constructor(root, renderer, scene, getCamera) {
    this.root = root; this.renderer = renderer; this.scene = scene; this.getCamera = getCamera; this.busy = false;
    this.canvas = root.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
    this.fill = root.querySelector('.intro-fill'); this.status = root.querySelector('.intro-status'); this.percent = root.querySelector('.intro-percent');
    this.sub = root.querySelector('.intro-sub'); this.skip = root.querySelector('.intro-skip');
    this.word = root.querySelector('.intro-word');
    this.word.innerHTML = [...'EVERMILE'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
    this.puffs = []; this.trail = []; this.raf = 0;
    addEventListener('resize', () => { if (!this.root.hidden) this.resize(); });
    // A soft smoke puff drawn once and stamped for every particle.
    const s = document.createElement('canvas'); s.width = s.height = 128; const c = s.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(226,230,234,.9)'); g.addColorStop(.45, 'rgba(200,205,212,.35)'); g.addColorStop(1, 'rgba(180,186,194,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); this.sprite = s;
  }

  // Shows the screen, runs the task behind it, and leaves once everything it started has loaded and been drawn.
  async run({task, label = 'THE SCENIC ROUTE', minimum = 2400, quick = false} = {}) {
    if (this.busy) { await task?.(); return; }
    this.busy = true; const base = snapshot(), t0 = performance.now();
    this.sub.textContent = label; this.skip.hidden = true; this.shown = 0; this.target = 0; this.phase = 'Preparing the scenery';
    this.root.hidden = false; this.root.classList.toggle('quick', quick); this.root.classList.remove('leaving');
    void this.root.offsetWidth; this.root.classList.add('on');
    this.resize(); this.puffs.length = 0; this.trail.length = 0; this.clock = 0; this.last = performance.now(); this.animate();
    let skipped = false; this.skip.onclick = () => { skipped = true; };
    const skipTimer = setTimeout(() => { this.skip.hidden = false; }, 14000);
    try {
      if (quick) await wait(260); // let the black settle before the world is rebuilt underneath
      await frameOrTimeout(); await task?.();
      // Wait for loads to go quiet; new ones can start as the world fills in, so it has to stay quiet for a moment.
      for (let quiet = 0; quiet < 3 && !skipped;) { await wait(140); quiet = idle() ? quiet + 1 : 0; this.target = Math.min(progress(base), .94); this.phase = stage() || this.phase; }
      if (!skipped) {
        this.phase = 'Warming the engine'; this.target = .96;
        try { await this.renderer.compileAsync(this.scene, this.getCamera()); } catch {}
        for (let i = 0; i < 3; i++) await frameOrTimeout();
      }
      this.target = 1; this.phase = 'Ready';
      // Hold for the wordmark to finish, and let the bar reach the end rather than jump.
      const until = Math.max(t0 + minimum, performance.now() + 700);
      while (!skipped && performance.now() < until && (performance.now() < t0 + minimum || this.shown < .995)) await wait(50);
    } finally { clearTimeout(skipTimer); }
    await this.leave();
    this.busy = false;
  }

  async leave() {
    this.burst(); this.root.classList.add('leaving'); document.body.classList.add('intro-arrive');
    await wait(reduced.matches ? 250 : 700);
    this.root.classList.remove('on', 'leaving'); this.root.hidden = true; cancelAnimationFrame(this.raf); this.raf = 0;
    setTimeout(() => document.body.classList.remove('intro-arrive'), 900);
  }

  resize() { const r = Math.min(devicePixelRatio, 1.5); this.w = innerWidth; this.h = innerHeight; this.canvas.width = this.w * r; this.canvas.height = this.h * r; this.ctx.setTransform(r, 0, 0, r, 0, 0); this.k = Math.min(1, Math.max(.45, this.w / 900)); }

  // The drift: a car's rear lamps swing across the bottom of the screen on a sideways arc, laying smoke from both rear tyres.
  lamps(t) {
    const w = this.w, h = this.h, u = t % 1, x = w * (-.15 + 1.3 * u), arc = .13 * Math.min(h, w * .75), y = h * .8 - arc * Math.sin(Math.PI * u);
    // Lamps sit either side of the path (across it, flattened by perspective) and swing with the drift angle.
    const tx = 1.3 * w, ty = -arc * Math.PI * Math.cos(Math.PI * u), n = Math.hypot(tx, ty), s = this.k, slide = Math.sin(Math.PI * u) * 16 * s;
    const px = -ty / n * 11 * s + slide, py = tx / n * 11 * s;
    return [[x - px, y - py], [x + px, y + py]];
  }
  emit(x, y, n, spread = 1) {
    const k = this.k, size = .5 + .5 * k;
    for (let i = 0; i < n; i++) this.puffs.push({x: x + (Math.random() - .5) * 12, y: y + 5 + (Math.random() - .5) * 6, vx: (-10 - Math.random() * 45 + (Math.random() - .5) * 40) * spread * k, vy: -(4 + Math.random() * 30) * spread * size,
      r: (12 + Math.random() * 16) * size, grow: (80 + Math.random() * 80) * size, age: 0, life: 2.8 + Math.random() * 1.8, seed: Math.random() * 6.3, alpha: (.09 + Math.random() * .1) * (.55 + .45 * k)});
  }
  burst() { if (reduced.matches || !this.w) return; const [a, b] = this.lamps(this.clock / 3.4); this.emit(a[0], a[1], 26, 1.8); this.emit(b[0], b[1], 26, 1.8); }

  animate() {
    if (this.raf) return;
    const step = (now) => {
      this.raf = requestAnimationFrame(step);
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now; this.clock += dt;
      this.shown += (Math.max(this.shown, this.target) - this.shown) * Math.min(1, dt * (this.target >= 1 ? 7 : 3));
      const p = Math.min(this.shown || 0, 1); this.fill.style.transform = `scaleX(${p})`; this.percent.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
      if (this.status.textContent !== this.phase) this.status.textContent = this.phase;
      if (reduced.matches) return;
      const c = this.ctx, t = this.clock / 3.4; c.clearRect(0, 0, this.w, this.h);
      // Tail-light trails, like a long exposure of the drift.
      const [a, b] = this.lamps(t); if (t % 1 < .02) this.trail.length = 0;
      this.trail.push([a, b]); if (this.trail.length > 46) this.trail.shift();
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const side of [0, 1]) for (let i = 1; i < this.trail.length; i++) {
        const k = i / this.trail.length, p0 = this.trail[i - 1][side], p1 = this.trail[i][side];
        c.strokeStyle = `rgba(255,${40 + k * 30},${40 + k * 20},${k * k * .75})`; c.lineWidth = 1 + k * 2.2; c.shadowColor = '#ff2a22'; c.shadowBlur = 14 * k;
        c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
      }
      c.shadowBlur = 0;
      if (t % 1 > .06 && t % 1 < .94) for (const [x, y] of [a, b]) if (Math.random() < .35 + .65 * this.k) this.emit(x, y, Math.random() < .5 ? 2 : 1);
      // Smoke rises, spreads and thins out.
      c.globalCompositeOperation = 'source-over';
      for (let i = this.puffs.length - 1; i >= 0; i--) {
        const q = this.puffs[i]; q.age += dt; if (q.age > q.life) { this.puffs.splice(i, 1); continue; }
        const k = q.age / q.life; q.x += (q.vx + Math.sin(q.seed + q.age * 1.3) * 14) * dt; q.y += q.vy * dt; q.vx *= .985; q.vy *= .99;
        const r = q.r + q.grow * Math.sqrt(k); c.globalAlpha = Math.min(1, k * 6) * (1 - k) ** 1.3 * q.alpha;
        c.drawImage(this.sprite, q.x - r, q.y - r, r * 2, r * 2);
      }
      c.globalAlpha = 1;
    };
    this.raf = requestAnimationFrame(step);
  }
}
