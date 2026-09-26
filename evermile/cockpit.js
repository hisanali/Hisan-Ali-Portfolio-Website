import * as T from './vendor/three.module.js';

/*
  From the driver's seat: raindrops gather on the windscreen, streak up and away at speed or trickle down when you
  are slow, and the wipers sweep them off (faster in heavy rain, now and then in drizzle). Above the dashboard, the
  rear-view mirror shows the road behind you.
*/
const rand = (a, b) => a + Math.random() * (b - a);

export class Windscreen {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.drops = []; this.time = 0;
    this.blades = [{px: .3, py: 1.04, len: .62}, {px: .66, py: 1.04, len: .56}];
    this.angle = 0; this.sweep = 0; this.pause = 0; this.wiping = false;
    // A single pre-drawn drop, scaled for every droplet: dark rim, bright lower edge where light refracts through it.
    const d = document.createElement('canvas'); d.width = d.height = 64; const x = d.getContext('2d');
    const g = x.createRadialGradient(28, 26, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.25, 'rgba(210,225,235,.18)'); g.addColorStop(.7, 'rgba(40,55,70,.22)'); g.addColorStop(.92, 'rgba(15,22,30,.45)'); g.addColorStop(1, 'rgba(15,22,30,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(32, 50, 13, 5, 0, 0, 7); x.fill();
    this.sprite = d;
    this.resize(); addEventListener('resize', () => this.resize());
  }

  resize() { const r = Math.min(devicePixelRatio || 1, 1.5); this.dpr = r; this.canvas.width = Math.round(innerWidth * r); this.canvas.height = Math.round(innerHeight * r); }

  // Wiper blade angle over its cycle: sweep up, sweep back, and in drizzle a pause at rest between wipes.
  wipers(dt, rain, on) {
    const period = rain > .6 ? 1.05 : rain > .25 ? 1.45 : 1.7;
    if (!on && this.sweep === 0) { this.wiping = false; return; }
    this.wiping = true;
    if (this.pause > 0) { this.pause -= dt; return; }
    this.sweep += dt / period;
    if (this.sweep >= 1) { this.sweep = 0; if (rain < .25) this.pause = rand(2, 4); if (!on) this.wiping = false; }
    this.angle = Math.sin(this.sweep * Math.PI) ** 1.2;
  }

  update(dt, {show, rain, speed, wipers}) {
    this.time += dt;
    const cv = this.canvas, c = this.ctx, W = cv.width, H = cv.height, before = this.angle;
    this.wipers(dt, rain, wipers);
    if (!show) { if (this.visible) { c.clearRect(0, 0, W, H); this.visible = false; cv.style.opacity = 0; } if (rain < .02) this.drops.length = 0; return; }
    if (!this.visible) { this.visible = true; cv.style.opacity = 1; }
    // New drops land in proportion to the rain, more at speed.
    const rate = rain * (40 + Math.abs(speed) * 4) * dt, top = H * .06, bottom = H * .74;
    for (let n = rate + Math.random() > 1 ? Math.floor(rate + Math.random()) : 0; n > 0 && this.drops.length < 520; n--) this.drops.push({x: rand(0, W), y: rand(top, bottom), r: rand(1.2, 3.8) * this.dpr * (Math.random() < .1 ? 1.8 : 1), age: 0, vx: 0, vy: 0});
    // Airflow pushes drops up and outwards; slow down and the big ones run down the glass.
    const v = Math.abs(speed), cx = W / 2;
    for (const d of this.drops) {
      d.age += dt;
      if (v > 9) { d.vy = -(v - 9) * 5 * this.dpr * (d.r / 3); d.vx = (d.x - cx) / W * v * 3 * this.dpr; }
      else { d.vx *= .9; d.vy = d.r > 3.2 * this.dpr ? d.r * 5 : 0; }
      d.px = d.x; d.py = d.y; d.x += d.vx * dt; d.y += d.vy * dt;
    }
    // The blades wipe everything in the arc they cross this frame.
    const a0 = Math.min(before, this.angle), a1 = Math.max(before, this.angle);
    if (a1 - a0 > 1e-4) for (const b of this.blades) {
      const px = b.px * W, py = b.py * H, len = b.len * H, lo = .12 + a0 * 2, hi = .12 + a1 * 2;
      this.drops = this.drops.filter((d) => { const dx = d.x - px, dy = py - d.y, ang = Math.atan2(dy, dx), dist = Math.hypot(dx, dy); return !(dist < len && dist > len * .12 && ang > Math.PI - hi - .05 && ang < Math.PI - lo + .05); });
    }
    this.drops = this.drops.filter((d) => d.y > -20 && d.y < H * .8 && d.x > -20 && d.x < W + 20 && d.age < 40);
    c.clearRect(0, 0, W, H);
    // A faint film of water on the glass.
    if (rain > .05) { c.fillStyle = `rgba(150,165,180,${.035 * rain})`; c.fillRect(0, 0, W, bottom); }
    for (const d of this.drops) {
      if (Math.abs(d.vy) > 20 || Math.abs(d.vx) > 20) { c.strokeStyle = 'rgba(210,225,235,.22)'; c.lineWidth = d.r * .7; c.beginPath(); c.moveTo(d.px, d.py); c.lineTo(d.x, d.y); c.stroke(); }
      c.drawImage(this.sprite, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    }
    if (this.wiping || this.angle > .001) for (const b of this.blades) {
      const px = b.px * W, py = b.py * H, len = b.len * H, ang = Math.PI - (.12 + this.angle * 2), ex = px + Math.cos(ang) * len, ey = py - Math.sin(ang) * len;
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 10 * this.dpr; c.beginPath(); c.moveTo(px + Math.cos(ang) * len * .18, py - Math.sin(ang) * len * .18 + 3); c.lineTo(ex, ey + 3); c.stroke();
      c.strokeStyle = '#121416'; c.lineWidth = 7 * this.dpr; c.beginPath(); c.moveTo(px + Math.cos(ang) * len * .18, py - Math.sin(ang) * len * .18); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#2b2f33'; c.lineWidth = 3.5 * this.dpr; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(ang) * len * .55, py - Math.sin(ang) * len * .55); c.stroke();
    }
  }
}

export class Mirror {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene;
    this.target = new T.WebGLRenderTarget(512, 168, {type: T.HalfFloatType});
    this.camera = new T.PerspectiveCamera(34, 512 / 168, .4, 900);
    this.hudScene = new T.Scene(); this.hudCamera = new T.OrthographicCamera(0, 1, 1, 0, -1, 1);
    // Mirrored image in a rounded frame with a dark bezel.
    this.material = new T.ShaderMaterial({
      uniforms: {map: {value: this.target.texture}, aspect: {value: 3}},
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float aspect; varying vec2 vUv;
        float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
        void main(){
          vec2 p = (vUv - .5) * vec2(aspect, 1.);
          float outer = box(p, vec2(aspect * .5, .5), .22), inner = box(p, vec2(aspect * .5 - .05, .44), .18);
          if (outer > 0.) discard;
          vec3 c = texture2D(map, vec2(1. - vUv.x, vUv.y)).rgb;
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          float glint = smoothstep(.2, .0, abs(p.x * .4 + p.y - .25)) * .06;
          gl_FragColor.rgb = mix(vec3(.03, .035, .04), gl_FragColor.rgb + glint, smoothstep(.01, -.01, inner));
        }`,
      depthTest: false, depthWrite: false, transparent: true,
    });
    this.quad = new T.Mesh(new T.PlaneGeometry(1, 1), this.material); this.hudScene.add(this.quad);
    this.frame = 0;
  }

  render(state, vehicle, every = 1) {
    const r = this.renderer, size = r.getSize(new T.Vector2()), w = Math.min(Math.max(size.x * .24, 210), 380), h = w / 3.05;
    if (this.frame++ % every === 0) {
      const yaw = state.yaw, cam = this.camera, up = vehicle.type === 'coach' ? 3.1 : vehicle.type === 'bike' ? 1.7 : 1.45;
      cam.position.set(state.x - Math.sin(yaw) * .3, state.y + up, state.z - Math.cos(yaw) * .3);
      cam.lookAt(state.x - Math.sin(yaw) * 40, state.y + up - 1.4, state.z - Math.cos(yaw) * 40);
      const shown = vehicle.group.visible, auto = r.shadowMap.autoUpdate, prev = r.getRenderTarget();
      vehicle.group.visible = false; r.shadowMap.autoUpdate = false;
      r.setRenderTarget(this.target); r.clear(); r.render(this.scene, cam); r.setRenderTarget(prev);
      vehicle.group.visible = shown; r.shadowMap.autoUpdate = auto;
    }
    // Draw it at the top middle of the screen.
    const hc = this.hudCamera; hc.left = 0; hc.right = size.x; hc.top = size.y; hc.bottom = 0; hc.updateProjectionMatrix();
    this.quad.scale.set(w, h, 1); this.quad.position.set(size.x / 2, size.y - h / 2 - Math.max(58, size.y * .075), 0);
    this.material.uniforms.aspect.value = w / h;
    const clear = r.autoClear; r.autoClear = false; r.render(this.hudScene, hc); r.autoClear = clear;
  }

  dispose() { this.target.dispose(); this.material.dispose(); }
}
