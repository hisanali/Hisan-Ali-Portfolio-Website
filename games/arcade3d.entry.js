import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// 3D versions of Stack Drop, Signal Flight, Mini Pong and Gravity Flip.
// Each game takes over its panel's canvas, score, status and main button; games.js keeps the flat fallback.
(() => {
  if (window.Arcade3D) return;
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduceMotion.matches;
  const playerOpen = () => { const stage = $('[data-game-stage]'); return !stage || stage.classList.contains('is-open'); };
  const selected = (key) => playerOpen() && $(`.game-pick[data-game="${key}"]`)?.getAttribute('aria-selected') === 'true';
  const rand = (min, max) => min + Math.random() * (max - min);
  const games = {};

  const createView = (canvas) => {
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    return {renderer, scene};
  };

  const gridTexture = (line, background, cells = 8, size = 256) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    const step = size / cells;
    for (let i = 0; i <= cells; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  // Shared particle bursts for hits, passes and crashes.
  const makeBurst = (scene, count = 26) => {
    const geometry = new THREE.SphereGeometry(0.07, 8, 6);
    const parts = Array.from({length: count}, () => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({transparent: true}));
      mesh.visible = false;
      scene.add(mesh);
      return {mesh, velocity: new THREE.Vector3(), life: 0};
    });
    return {
      fire(position, color, force = 6, amount = count) {
        parts.slice(0, amount).forEach((part) => {
          part.mesh.visible = true;
          part.mesh.material.color.set(color);
          part.mesh.position.copy(position);
          part.velocity.set(rand(-1, 1), rand(-0.3, 1.2), rand(-1, 1)).normalize().multiplyScalar(rand(0.4, 1) * force);
          part.life = 1;
        });
      },
      update(dt, gravity = 9) {
        parts.forEach((part) => {
          if (part.life <= 0) { part.mesh.visible = false; return; }
          part.life -= dt * 1.4;
          part.velocity.y -= gravity * dt;
          part.mesh.position.addScaledVector(part.velocity, dt);
          part.mesh.scale.setScalar(Math.max(0.01, part.life * 1.4));
          part.mesh.material.opacity = Math.max(0, part.life);
        });
      },
    };
  };

  const shaker = () => {
    let until = 0;
    return {
      start(duration = 0.45) { until = performance.now() + duration * 1000; },
      apply(camera, strength = 0.3) {
        const left = until - performance.now();
        if (left <= 0 || still()) return;
        const amount = strength * Math.min(1, left / 450);
        camera.position.x += rand(-1, 1) * amount;
        camera.position.y += rand(-1, 1) * amount;
      },
    };
  };

  const mount = (key, build) => {
    const panel = $(`[data-game-panel="${key}"]`);
    const flat = panel && $(`[data-${key}-canvas]`, panel);
    const oldAction = panel && $(`[data-${key}-action]`, panel);
    if (!flat || !oldAction) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'arcade3d-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${flat.getAttribute('aria-label') || 'Game board'} in 3D`);
    canvas.style.touchAction = 'none';
    flat.before(canvas);
    flat.hidden = true;
    const action = oldAction.cloneNode(true);
    oldAction.replaceWith(action);
    const score = $(`[data-${key}-score]`, panel);
    const status = $(`[data-${key}-status]`, panel);
    const ui = {
      action,
      score: (value) => { score.textContent = String(value); },
      say: (text) => { status.textContent = text; },
      label: (text) => { action.textContent = text; },
    };
    const view = createView(canvas);
    const game = build({canvas, ui, panel, ...view});
    games[key] = game;
    action.addEventListener('click', () => game.primary());
    canvas.addEventListener('pointerdown', (event) => { if (game.pointerDown) game.pointerDown(event); else game.primary(); });
    const resize = () => {
      const {width, height} = canvas.getBoundingClientRect();
      if (!width || !height) return;
      view.renderer.setSize(width, height, false);
      game.resize(width / height, width, height);
    };
    new ResizeObserver(resize).observe(canvas);
    let last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden || !canvas.offsetParent) return;
      game.frame(dt, now / 1000);
      if (game.render) game.render(); else view.renderer.render(view.scene, game.camera);
    };
    resize();
    requestAnimationFrame(loop);
  };

  const standardLights = (scene, {sun = 2, x = 6, y = 14, z = 8, span = 10} = {}) => {
    scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x10261c, 0.75));
    const light = new THREE.DirectionalLight(0xfff1dc, sun);
    light.position.set(x, y, z);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, {left: -span, right: span, top: span, bottom: -span, near: 0.5, far: 80});
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    scene.add(light, light.target);
    return light;
  };

  /* ---------------- Stack Drop ---------------- */
  mount('stack', ({scene, ui}) => {
    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
    let aspect = 1;
    let viewSize = 12;
    let viewTarget = 12;
    const sun = standardLights(scene, {sun: 2.2, x: -6, y: 16, z: 9, span: 9});
    const H = 0.6;
    const geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.035);
    const colorFor = (level) => new THREE.Color().setHSL((0.2 + level * 0.026) % 1, 0.78, 0.5);
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(3.6, 8, 3.6, 3, 0.12), new THREE.MeshStandardMaterial({color: 0x0f2a1f, roughness: 0.5, metalness: 0.2}));
    plinth.position.y = -4;
    plinth.receiveShadow = plinth.castShadow = true;
    scene.add(plinth);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false}));
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    const burst = makeBurst(scene);
    let blocks = [];
    let moving = null;
    let debris = [];
    let running = false;
    let combo = 0;
    let camY = 0;
    let ringLife = 0;

    const slab = (w, d, level) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color: colorFor(level), roughness: 0.42, metalness: 0.05}));
      mesh.scale.set(w, H, d);
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    const clear = () => {
      [...blocks.map((b) => b.mesh), ...debris.map((d) => d.mesh), moving?.mesh].forEach((mesh) => mesh && scene.remove(mesh));
      blocks = []; debris = []; moving = null;
    };
    const reset = () => {
      clear();
      const mesh = slab(3, 3, 0);
      mesh.position.set(0, H / 2, 0);
      blocks.push({x: 0, z: 0, w: 3, d: 3, mesh});
      combo = 0; viewTarget = 12;
    };
    const spawn = () => {
      const level = blocks.length;
      const top = blocks[level - 1];
      const axis = level % 2 ? 'x' : 'z';
      const mesh = slab(top.w, top.d, level);
      moving = {axis, x: axis === 'x' ? -5.5 : top.x, z: axis === 'z' ? -5.5 : top.z, w: top.w, d: top.d, dir: 1, speed: Math.min(9.5, 4.2 + level * 0.14), mesh, level};
      mesh.position.set(moving.x, level * H + H / 2, moving.z);
    };
    const fall = (x, z, w, d, level, y) => {
      const mesh = slab(w, d, level);
      mesh.position.set(x, y, z);
      debris.push({mesh, velocity: new THREE.Vector3((x - blocks[blocks.length - 1].x) * 1.2, 0, (z - blocks[blocks.length - 1].z) * 1.2), spin: new THREE.Vector3(rand(-2, 2), 0, rand(-2, 2)), life: 3});
    };
    const end = () => {
      running = false;
      const height = blocks.length - 1;
      ui.label('Play again');
      ui.say(`Tower finished at ${height} block${height === 1 ? '' : 's'}.`);
      viewTarget = Math.max(12, blocks.length * H * 1.35 + 6);
    };
    const drop = () => {
      const top = blocks[blocks.length - 1];
      const m = moving;
      const axis = m.axis;
      const size = axis === 'x' ? top.w : top.d;
      const delta = m[axis] - top[axis];
      const overlap = size - Math.abs(delta);
      const y = m.level * H + H / 2;
      scene.remove(m.mesh);
      moving = null;
      if (overlap <= 0.02) { fall(m.x, m.z, m.w, m.d, m.level, y); end(); return; }
      let x = m.x; let z = m.z; let w = m.w; let d = m.d;
      if (Math.abs(delta) < 0.09) {
        combo += 1;
        if (axis === 'x') x = top.x; else z = top.z;
        if (combo >= 3) { w = Math.min(3, w + 0.12); d = Math.min(3, d + 0.12); }
        ringLife = 1;
        ring.position.set(x, y + H / 2 + 0.01, z);
        ring.scale.set(w * 0.8, d * 0.8, 1);
        ui.say(combo > 1 ? `Perfect × ${combo}` : 'Perfect drop.');
        burst.fire(new THREE.Vector3(x, y + 0.3, z), 0xffffff, 4, 14);
      } else {
        combo = 0;
        const center = top[axis] + delta / 2;
        const cut = Math.abs(delta);
        const cutCenter = center + Math.sign(delta) * (overlap / 2 + cut / 2);
        if (axis === 'x') { fall(cutCenter, z, cut, d, m.level, y); x = center; w = overlap; }
        else { fall(x, cutCenter, w, cut, m.level, y); z = center; d = overlap; }
        ui.say('Keep it lined up.');
      }
      const mesh = slab(w, d, m.level);
      mesh.position.set(x, y, z);
      blocks.push({x, z, w, d, mesh});
      ui.score(blocks.length - 1);
      spawn();
    };
    const start = () => {
      reset();
      running = true;
      ui.score(0);
      ui.label('Drop');
      ui.say('Tap, click or press Space to drop the block.');
      spawn();
    };
    reset();
    window.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' || !selected('stack')) return;
      event.preventDefault();
      game.primary();
    });
    const game = {
      camera,
      primary() { if (running) drop(); else start(); },
      peek() { const top = blocks[blocks.length - 1]; return {running, height: blocks.length - 1, combo, offset: moving ? moving[moving.axis] - top[moving.axis] : null}; },
      pause() { if (!running) return; running = false; ui.label('Start stacking'); ui.say('Paused. Start a new tower when you are ready.'); },
      resize(value) { aspect = value; },
      frame(dt, t) {
        if (moving && running) {
          moving[moving.axis] += moving.dir * moving.speed * dt;
          if (Math.abs(moving[moving.axis]) > 5.5) { moving[moving.axis] = Math.sign(moving[moving.axis]) * 5.5; moving.dir *= -1; }
          moving.mesh.position.x = moving.x;
          moving.mesh.position.z = moving.z;
        }
        debris = debris.filter((piece) => {
          piece.velocity.y -= 20 * dt;
          piece.mesh.position.addScaledVector(piece.velocity, dt);
          piece.mesh.rotation.x += piece.spin.x * dt;
          piece.mesh.rotation.z += piece.spin.z * dt;
          piece.life -= dt;
          if (piece.life <= 0) { scene.remove(piece.mesh); return false; }
          return true;
        });
        if (ringLife > 0) {
          ringLife -= dt * 1.8;
          ring.material.opacity = Math.max(0, ringLife);
          ring.scale.multiplyScalar(1 + dt * 1.6);
        }
        burst.update(dt);
        const height = (running ? blocks.length : blocks.length * 0.5) * H;
        camY += (height - camY) * Math.min(1, dt * 3);
        viewSize += (viewTarget - viewSize) * Math.min(1, dt * 2.5);
        const drift = still() ? 0 : Math.sin(t * 0.3) * 0.5;
        camera.position.set(9 + drift, camY + 9, 9 - drift);
        camera.lookAt(0, camY, 0);
        const half = viewSize / 2;
        Object.assign(camera, {left: -half * aspect, right: half * aspect, top: half, bottom: -half});
        camera.updateProjectionMatrix();
        sun.position.set(-6, camY + 16, 9);
        sun.target.position.set(0, camY, 0);
      },
    };
    return game;
  });

  /* ---------------- Signal Flight: a jet over a city highway at night ---------------- */
  mount('flight', ({scene, ui, renderer}) => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.toneMappingExposure = 1;
    scene.environmentIntensity = 0.08;
    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 460);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.42, 0.32, 0.86);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const paint = (w, h, draw) => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      draw(canvas.getContext('2d'), w, h);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const dummy = new THREE.Object3D();

    // Night sky, haze, moon and stars.
    scene.background = paint(4, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      [[0, '#02050d'], [0.48, '#081229'], [0.74, '#1d1a3d'], [0.88, '#47294a'], [1, '#93503f']].forEach(([stop, color]) => g.addColorStop(stop, color));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    scene.fog = new THREE.FogExp2(0x291f40, 0.0085);
    const glowTexture = paint(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,248,230,.85)'); g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    });
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTexture, color: 0xfff0d2, fog: false, depthWrite: false}));
    moon.scale.set(38, 38, 1);
    moon.position.set(-80, 105, -320);
    scene.add(moon);
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i += 1) starPositions.set([rand(-260, 260), rand(40, 220), rand(-420, -200)], i * 3);
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({color: 0xdfe6ff, size: 0.7, fog: false, transparent: true, opacity: 0.85})));
    scene.add(new THREE.HemisphereLight(0x4a5790, 0x0c0907, 0.32));
    const moonLight = new THREE.DirectionalLight(0xa9bcff, 0.45);
    moonLight.position.set(-30, 60, -40);
    scene.add(moonLight);

    // Ground and the highway.
    const LENGTH = 420;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, LENGTH + 80), new THREE.MeshStandardMaterial({color: 0x090d0b, roughness: 1}));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.03, -150);
    scene.add(ground);
    const roadTexture = paint(256, 256, (ctx) => {
      ctx.fillStyle = '#18191c'; ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i += 1) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); }
      ctx.fillStyle = '#d9d9d2'; ctx.fillRect(10, 0, 4, 256); ctx.fillRect(242, 0, 4, 256);
      ctx.fillStyle = '#e2b13c'; ctx.fillRect(122, 0, 4, 256); ctx.fillRect(130, 0, 4, 256);
      ctx.fillStyle = '#d9d9d2';
      [66, 190].forEach((x) => { ctx.fillRect(x, 0, 3, 90); ctx.fillRect(x, 150, 3, 90); });
    });
    roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, LENGTH / 16);
    roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const road = new THREE.Mesh(new THREE.PlaneGeometry(16, LENGTH), new THREE.MeshStandardMaterial({map: roadTexture, roughness: 0.62, metalness: 0.12}));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -150);
    scene.add(road);
    [-1, 1].forEach((side) => {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, LENGTH), new THREE.MeshStandardMaterial({color: 0x2a2c30, roughness: 0.9}));
      walk.position.set(side * 9.2, 0.11, -150);
      scene.add(walk);
    });

    // Facades: window grids with random lit rooms, as colour and emissive maps.
    const facade = (variant) => {
      const glass = variant % 3 === 0;
      const wall = glass ? '#0c1521' : pick(['#1b1e24', '#20232a', '#17191e', '#221f1b']);
      const litChance = 0.12 + (variant % 2) * 0.1;
      const warm = ['#e8a64e', '#f2b865', '#d9913d', '#f0c27a', '#c98a45'];
      const cool = ['#7fa8d9', '#94b8e0', '#6d93c7'];
      const cells = [];
      for (let floor = 0; floor < 16; floor += 1) {
        const dark = Math.random() < 0.18;
        for (let col = 0; col < 8; col += 1) cells.push({floor, col, lit: !dark && Math.random() < litChance, color: Math.random() < 0.8 ? pick(warm) : pick(cool)});
      }
      const draw = (emissive) => (ctx) => {
        ctx.fillStyle = emissive ? '#000' : wall; ctx.fillRect(0, 0, 128, 256);
        cells.forEach(({floor, col, lit, color}) => {
          const x = col * 16 + (glass ? 1 : 3); const y = floor * 16 + (glass ? 1 : 4);
          const w = glass ? 14 : 10; const h = glass ? 14 : 9;
          if (lit) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); if (!emissive) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y + h - 3, w, 3); } }
          else if (!emissive) { ctx.fillStyle = glass ? '#122236' : '#0c1017'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(120,150,200,.08)'; ctx.fillRect(x, y, w, 2); }
        });
      };
      return {map: paint(128, 256, draw(false)), emissive: paint(128, 256, draw(true))};
    };
    const facades = Array.from({length: 8}, (_, i) => facade(i));
    const roofMaterial = new THREE.MeshStandardMaterial({color: 0x121418, roughness: 0.9});
    const beaconMaterial = new THREE.MeshBasicMaterial({color: 0xff2a1a});
    const antennaMaterial = new THREE.MeshStandardMaterial({color: 0x3a3d44, roughness: 0.5, metalness: 0.6});
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    unitBox.translate(0, 0.5, 0);
    const building = (w, h, d) => {
      const {map, emissive} = pick(facades);
      const side = (width) => {
        const colour = map.clone(); const glow = emissive.clone();
        [colour, glow].forEach((texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(width / 12, h / 30); texture.needsUpdate = true; });
        return new THREE.MeshStandardMaterial({map: colour, emissiveMap: glow, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.82, metalness: 0.18});
      };
      const front = side(w); const flank = side(d);
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(unitBox, [flank, flank, roofMaterial, roofMaterial, front, front]);
      mesh.scale.set(w, h, d);
      group.add(mesh);
      if (h > 34) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 6, 6), antennaMaterial);
        mast.position.y = h + 3;
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), beaconMaterial);
        beacon.position.y = h + 6.2;
        group.add(mast, beacon);
      }
      return group;
    };

    // Scenery is built in two chunks that leapfrog each other as the jet flies.
    const CHUNK = 210;
    const treeTrunk = new THREE.CylinderGeometry(0.12, 0.17, 1.5, 6);
    treeTrunk.translate(0, 0.75, 0);
    const treeTop = new THREE.IcosahedronGeometry(1.15, 1);
    const trunkMaterial = new THREE.MeshStandardMaterial({color: 0x2b1d14, roughness: 1});
    const leafMaterial = new THREE.MeshStandardMaterial({color: 0x16361f, roughness: 0.95, flatShading: true});
    const poleMaterial = new THREE.MeshStandardMaterial({color: 0x44474e, roughness: 0.5, metalness: 0.7});
    const lampMaterial = new THREE.MeshBasicMaterial({color: 0xffd9a0});
    const poolMaterial = new THREE.MeshBasicMaterial({map: glowTexture, color: 0xffb060, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false});
    const buildChunk = () => {
      const chunk = new THREE.Group();
      [-1, 1].forEach((sideSign) => {
        [[13.5, 18, 44], [30, 34, 70]].forEach(([inner, minH, maxH], row) => {
          for (let z = 0; z > -CHUNK;) {
            const w = rand(6, 11); const d = rand(6, row ? 14 : 10); const h = rand(minH, maxH);
            const b = building(w, h, d);
            b.position.set(sideSign * (inner + (row ? rand(0, 8) : 0) + d / 2), 0, z - w / 2);
            b.rotation.y = Math.PI / 2;
            chunk.add(b);
            z -= w + rand(1, row ? 5 : 2.5);
          }
        });
      });
      const trees = Math.floor(CHUNK / 6.5) * 2;
      const trunks = new THREE.InstancedMesh(treeTrunk, trunkMaterial, trees);
      const tops = new THREE.InstancedMesh(treeTop, leafMaterial, trees);
      for (let i = 0; i < trees; i += 1) {
        const sideSign = i % 2 ? 1 : -1;
        const s = rand(0.8, 1.3);
        dummy.position.set(sideSign * rand(10.8, 12), 0, -Math.floor(i / 2) * 6.5 - rand(0, 3));
        dummy.rotation.set(0, rand(0, Math.PI), 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        dummy.position.y = 1.9 * s;
        dummy.scale.set(s, s * rand(1.1, 1.5), s);
        dummy.updateMatrix();
        tops.setMatrixAt(i, dummy.matrix);
      }
      chunk.add(trunks, tops);
      const lamps = Math.floor(CHUNK / 21) * 2;
      const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 5.4, 6).translate(0, 2.7, 0), poleMaterial, lamps);
      const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), poleMaterial, lamps);
      const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.12, 0.28), lampMaterial, lamps);
      const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.6, 4.6).rotateX(-Math.PI / 2), poolMaterial, lamps);
      for (let i = 0; i < lamps; i += 1) {
        const sideSign = i % 2 ? 1 : -1;
        const z = -Math.floor(i / 2) * 21 - (i % 2) * 10;
        const x = sideSign * 8.4;
        dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
        dummy.position.set(x, 0, z); dummy.updateMatrix(); poles.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x - sideSign * 0.7, 5.35, z); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x - sideSign * 1.35, 5.25, z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x - sideSign * 2.4, 0.03, z); dummy.updateMatrix(); pools.setMatrixAt(i, dummy.matrix);
      }
      chunk.add(poles, arms, heads, pools);
      scene.add(chunk);
      return chunk;
    };
    const chunks = [buildChunk(), buildChunk()];
    chunks[0].position.z = 30;
    chunks[1].position.z = 30 - CHUNK;

    // Traffic: instanced cars, headlights toward you on the left, taillights ahead on the right.
    const CARS = 26;
    const carPaint = [0xb8c2cc, 0x1d2a44, 0x7a1418, 0xe6e6e6, 0x121212, 0x2f4f3f, 0xc9a24a, 0x3c4a5e];
    const bodies = new THREE.InstancedMesh(new RoundedBoxGeometry(1.2, 0.52, 2.7, 2, 0.16), new THREE.MeshPhysicalMaterial({roughness: 0.28, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.1}), CARS);
    const cabins = new THREE.InstancedMesh(new RoundedBoxGeometry(1.02, 0.44, 1.35, 2, 0.14), new THREE.MeshPhysicalMaterial({color: 0x0a1220, roughness: 0.06, metalness: 0.4, clearcoat: 1}), CARS);
    const lampGeometry = new THREE.BoxGeometry(0.28, 0.1, 0.06);
    const headlights = new THREE.InstancedMesh(lampGeometry, new THREE.MeshBasicMaterial({color: 0xfff7e6}), CARS * 2);
    const taillights = new THREE.InstancedMesh(lampGeometry, new THREE.MeshBasicMaterial({color: 0xff2414}), CARS * 2);
    const beams = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 5.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: glowTexture, color: 0xfff1cc, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false}), CARS);
    scene.add(bodies, cabins, headlights, taillights, beams);
    const lanes = [-5.8, -2.1, 2.1, 5.8];
    const cars = Array.from({length: CARS}, (_, i) => {
      const x = lanes[i % 4];
      bodies.setColorAt(i, new THREE.Color(pick(carPaint)));
      return {x, dir: x < 0 ? 1 : -1, speed: rand(10, 18), z: rand(-380, 40)};
    });
    const carMatrix = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const world = new THREE.Matrix4();
    const at = (x, y, z) => local.makeTranslation(x, y, z);
    const updateCars = (move, dt) => {
      cars.forEach((car, i) => {
        car.z += move + car.dir * car.speed * dt;
        if (car.z > 45) car.z -= 430;
        if (car.z < -385) car.z += 430;
        dummy.position.set(car.x, 0.36, car.z);
        dummy.rotation.set(0, car.dir > 0 ? 0 : Math.PI, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        carMatrix.copy(dummy.matrix);
        bodies.setMatrixAt(i, carMatrix);
        cabins.setMatrixAt(i, world.multiplyMatrices(carMatrix, at(0, 0.44, -0.2)));
        headlights.setMatrixAt(i * 2, world.multiplyMatrices(carMatrix, at(-0.38, 0.04, 1.36)));
        headlights.setMatrixAt(i * 2 + 1, world.multiplyMatrices(carMatrix, at(0.38, 0.04, 1.36)));
        taillights.setMatrixAt(i * 2, world.multiplyMatrices(carMatrix, at(-0.4, 0.08, -1.36)));
        taillights.setMatrixAt(i * 2 + 1, world.multiplyMatrices(carMatrix, at(0.4, 0.08, -1.36)));
        beams.setMatrixAt(i, world.multiplyMatrices(carMatrix, at(0, -0.33, 4.1)));
      });
      [bodies, cabins, headlights, taillights, beams].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    };

    // The jet: metal fuselage, glass canopy, swept wings, tail, engine flame and navigation lights.
    const jet = new THREE.Group();
    const skin = new THREE.MeshPhysicalMaterial({color: 0xdfe4ea, roughness: 0.24, metalness: 0.75, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide});
    const trim = new THREE.MeshPhysicalMaterial({color: 0x1f3a2e, roughness: 0.3, metalness: 0.6, clearcoat: 1, side: THREE.DoubleSide});
    const profile = [[0, 0], [0.09, 0.08], [0.19, 0.3], [0.26, 0.75], [0.27, 1.5], [0.23, 2.15], [0.15, 2.55], [0.12, 2.7]].map(([r, y]) => new THREE.Vector2(r, y));
    const fuselage = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), skin);
    fuselage.rotation.x = -Math.PI / 2;
    fuselage.position.z = 1.35;
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 18), new THREE.MeshPhysicalMaterial({color: 0x0a1a2e, roughness: 0.04, metalness: 0.3, clearcoat: 1}));
    canopy.scale.set(0.8, 0.7, 2.1);
    canopy.position.set(0, 0.17, -0.55);
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.18, -0.25); wingShape.lineTo(1.3, 0.38); wingShape.lineTo(1.3, 0.56); wingShape.lineTo(0.18, 0.62); wingShape.closePath();
    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1});
    wingGeometry.rotateX(Math.PI / 2);
    const rightWing = new THREE.Mesh(wingGeometry, skin);
    const leftWing = new THREE.Mesh(wingGeometry, skin);
    leftWing.scale.x = -1;
    [rightWing, leftWing].forEach((wing) => { wing.position.set(0, -0.02, 0.1); });
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0); finShape.lineTo(0.55, 0); finShape.lineTo(0.72, 0.62); finShape.lineTo(0.48, 0.62); finShape.closePath();
    const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: 0.04, bevelEnabled: false}), trim);
    fin.rotation.y = -Math.PI / 2;
    fin.position.set(0.02, 0.12, 0.62);
    const stabilizerRight = new THREE.Mesh(wingGeometry, trim);
    const stabilizerLeft = new THREE.Mesh(wingGeometry, trim);
    [stabilizerRight, stabilizerLeft].forEach((part, index) => { part.scale.set(index ? -0.42 : 0.42, 1, 0.42); part.position.set(0, 0.03, 1.02); });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 1.9), new THREE.MeshBasicMaterial({color: 0xc6f23a}));
    const stripeLeft = stripe.clone();
    stripe.position.set(0.262, 0.03, 0.15);
    stripeLeft.position.set(-0.262, 0.03, 0.15);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({color: 0x2c2f35, roughness: 0.4, metalness: 0.9, side: THREE.DoubleSide}));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.z = 1.42;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.95, 18, 1, true), new THREE.MeshBasicMaterial({color: 0xffa24a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false}));
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 1.95;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 12, 1, true), new THREE.MeshBasicMaterial({color: 0xbfe6ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false}));
    core.rotation.x = Math.PI / 2;
    core.position.z = 1.72;
    const navRed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({color: 0xff2a1a}));
    navRed.position.set(-1.3, -0.01, 0.5);
    const navGreen = new THREE.Mesh(navRed.geometry, new THREE.MeshBasicMaterial({color: 0x2aff6a}));
    navGreen.position.set(1.3, -0.01, 0.5);
    const strobe = new THREE.Mesh(navRed.geometry, new THREE.MeshBasicMaterial({color: 0xffffff}));
    strobe.position.set(0, 0.76, 1.12);
    const exhaustLight = new THREE.PointLight(0xffa04a, 5, 7, 2);
    exhaustLight.position.z = 1.9;
    jet.add(fuselage, canopy, rightWing, leftWing, fin, stabilizerRight, stabilizerLeft, stripe, stripeLeft, nozzle, flame, core, navRed, navGreen, strobe, exhaustLight);
    jet.scale.setScalar(0.9);
    scene.add(jet);
    const jetFill = new THREE.PointLight(0xdfe8ff, 9, 9, 1.6);
    scene.add(jetFill);

    // Checkpoint rings.
    const ringGeometry = new THREE.TorusGeometry(1.75, 0.13, 16, 72);
    const rings = [];
    const burst = makeBurst(scene);
    const shake = shaker();
    let running = false;
    let y = 4;
    let vy = 0;
    let speed = 20;
    let points = 0;
    const addRing = (z) => {
      const material = new THREE.MeshStandardMaterial({color: 0xffc46b, emissive: 0xff9a2a, emissiveIntensity: 2.2, roughness: 0.3, metalness: 0.2});
      const mesh = new THREE.Mesh(ringGeometry, material);
      const base = rand(2.3, 7.2);
      mesh.position.set(0, base, z);
      scene.add(mesh);
      rings.push({mesh, base, sway: points > 6 ? rand(0.6, 1.6) : 0, phase: rand(0, Math.PI * 2), passed: false, flash: 0});
    };
    const resetRings = () => {
      rings.splice(0).forEach((ring) => scene.remove(ring.mesh));
      for (let i = 0; i < 6; i += 1) addRing(-45 - i * 26);
    };
    const end = (reason) => {
      running = false;
      burst.fire(jet.position.clone(), 0xffb36b, 10);
      shake.start();
      ui.label('Fly again');
      ui.say(`${reason} Flight ended after ${points} ring${points === 1 ? '' : 's'}.`);
    };
    const start = () => {
      running = true; y = 4; vy = 3.5; speed = 20; points = 0;
      resetRings();
      ui.score(0);
      ui.label('Lift');
      ui.say('Tap, click or press Space to climb. Fly the jet through every ring.');
    };
    resetRings();
    window.addEventListener('keydown', (event) => {
      if ((event.code !== 'Space' && event.code !== 'ArrowUp') || !selected('flight')) return;
      event.preventDefault();
      game.primary();
    });
    let camY = 4;
    const game = {
      camera,
      primary() { if (running) vy = 6.4; else start(); },
      peek() { const next = rings.filter((ring) => !ring.passed && ring.mesh.position.z < 0).sort((a, b) => b.mesh.position.z - a.mesh.position.z)[0]; return {running, y, vy, points, ringY: next?.mesh.position.y, ringZ: next?.mesh.position.z}; },
      pause() { if (!running) return; running = false; ui.label('Start flight'); ui.say('Paused. Start a new flight when you are ready.'); },
      resize(aspect, width, height) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(width, height);
      },
      render() { composer.render(); },
      frame(dt, t) {
        if (running) {
          vy -= 15 * dt;
          y += vy * dt;
          speed = Math.min(36, 20 + points * 0.55);
          if (y < 0.6) { y = 0.6; end('The jet touched the road.'); }
          else if (y > 10.5) { y = 10.5; end('Climbed out of the flight path.'); }
        } else if (!still()) {
          y += (4 + Math.sin(t * 1.4) * 0.3 - y) * Math.min(1, dt * 3);
        }
        const move = running ? speed * dt : (still() ? 0 : 6 * dt);
        jet.position.set(0, y, 0);
        jetFill.position.set(0.8, y + 2.2, 2.4);
        jet.rotation.x = running ? THREE.MathUtils.clamp(vy * 0.055, -0.45, 0.4) : 0.04;
        jet.rotation.z = still() ? 0 : Math.sin(t * 1.7) * 0.07;
        const flicker = still() ? 1 : 0.85 + Math.random() * 0.3;
        flame.scale.set(1, running ? flicker * (1 + Math.max(0, vy) * 0.08) : 0.7, 1);
        core.scale.set(1, flicker, 1);
        strobe.visible = Math.sin(t * 7) > 0.85;
        beaconMaterial.color.setScalar(0).setRGB(Math.sin(t * 2.2) > 0 ? 1 : 0.25, 0.08, 0.04);

        roadTexture.offset.y += move / 16;
        chunks.forEach((chunk) => { chunk.position.z += move; if (chunk.position.z > 30 + CHUNK) chunk.position.z -= CHUNK * 2; });
        updateCars(move, dt);

        for (let i = rings.length - 1; i >= 0; i -= 1) {
          const ring = rings[i];
          const before = ring.mesh.position.z;
          ring.mesh.position.z += move;
          if (ring.sway) ring.mesh.position.y = ring.base + Math.sin(t * ring.sway + ring.phase) * 1.1;
          if (running && !ring.passed && before < 0 && ring.mesh.position.z >= 0) {
            ring.passed = true;
            if (Math.abs(y - ring.mesh.position.y) < 1.3) {
              points += 1;
              ui.score(points);
              ring.flash = 1;
              ring.mesh.material.color.set(0xdfff63);
              ring.mesh.material.emissive.set(0x9fe01f);
              burst.fire(ring.mesh.position.clone(), 0xdfff63, 5, 16);
            } else { end('Missed the ring.'); }
          }
          if (ring.flash > 0) { ring.flash -= dt * 2; ring.mesh.scale.setScalar(1 + (1 - ring.flash) * 0.35); }
          if (ring.mesh.position.z > 14) { scene.remove(ring.mesh); rings.splice(i, 1); }
        }
        const farthest = rings.reduce((min, ring) => Math.min(min, ring.mesh.position.z), 0);
        while (rings.length < 6) addRing(Math.min(farthest, -26) - 26 * (6 - rings.length));
        burst.update(dt, 6);

        camY += (y - camY) * Math.min(1, dt * 4);
        camera.position.set(Math.sin(t * 0.35) * (still() ? 0 : 0.35), camY * 0.7 + 2.35, 5.1);
        shake.apply(camera, 0.4);
        camera.lookAt(0, camY * 0.85 + 0.1, -12);
      },
    };
    return game;
  });

  /* ---------------- Mini Pong ---------------- */
  mount('pong', ({scene, ui, canvas, panel}) => {
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    standardLights(scene, {sun: 2.2, x: -3, y: 14, z: 6, span: 9});
    const W = 8; const L = 14; const R = 0.22; const PW = 1.9;
    const table = new THREE.Mesh(new RoundedBoxGeometry(W + 0.6, 0.4, L + 0.6, 3, 0.15), new THREE.MeshPhysicalMaterial({color: 0x134478, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6}));
    table.position.y = -0.2;
    table.receiveShadow = true;
    scene.add(table);
    const lineMaterial = new THREE.MeshBasicMaterial({color: 0xf4f7f2});
    [[0, 0, W, 0.06], [0, -L / 2 + 0.03, W, 0.06], [0, L / 2 - 0.03, W, 0.06]].forEach(([x, z, w, d]) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.005, z);
      scene.add(line);
    });
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.04, L), lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.005;
    scene.add(centerLine);
    const net = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.3, 0.03), new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0.35}));
    net.position.y = 0.15;
    scene.add(net);
    const railMaterial = new THREE.MeshStandardMaterial({color: 0xdfff63, emissive: 0xb6ff2a, emissiveIntensity: 0.9});
    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.34, L + 0.4, 2, 0.08), railMaterial);
      rail.position.set(side * (W / 2 + 0.2), 0.14, 0);
      rail.castShadow = true;
      scene.add(rail);
    });
    const paddle = (color, emissive) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(PW, 0.34, 0.34, 3, 0.14), new THREE.MeshPhysicalMaterial({color, emissive, emissiveIntensity: 0.35, roughness: 0.3, clearcoat: 1}));
      mesh.position.y = 0.2;
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    };
    const player = paddle(0xdfff63, 0x5f8f10);
    player.position.z = L / 2 - 0.5;
    const cpu = paddle(0xf47a52, 0x8a2a10);
    cpu.position.z = -L / 2 + 0.5;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 20), new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: 0.2, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0.15}));
    ball.castShadow = true;
    scene.add(ball);
    const trail = Array.from({length: 10}, (_, index) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(R * (1 - index / 12), 12, 8), new THREE.MeshBasicMaterial({color: 0xdfff63, transparent: true, opacity: 0.28 * (1 - index / 10)}));
      scene.add(mesh);
      return mesh;
    });
    const history = [];
    const burst = makeBurst(scene, 18);
    const shake = shaker();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
    const pointer = new THREE.Vector2();
    const hit = new THREE.Vector3();
    let running = false;
    let rally = 0;
    let bonus = 0;
    let targetX = 0;
    let keyDir = 0;
    let bx = 0; let bz = 0; let vx = 0; let vz = 0; let travel = 0;
    let cpuSpeed = 4.6;

    const serve = (towardPlayer) => {
      bx = 0; bz = towardPlayer ? -1 : 1;
      const pace = 7.5 + rally * 0.18;
      vx = rand(-2.2, 2.2); vz = (towardPlayer ? 1 : -1) * pace;
    };
    const aim = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) targetX = THREE.MathUtils.clamp(hit.x, -W / 2 + PW / 2, W / 2 - PW / 2);
    };
    const end = () => {
      running = false;
      shake.start();
      ui.label('Play again');
      ui.say(`Rally ended at ${rally}${bonus ? `, with ${bonus} point${bonus === 1 ? '' : 's'} won off the computer` : ''}.`);
    };
    const start = () => {
      running = true; rally = 0; bonus = 0; cpuSpeed = 4.6;
      ui.score(0);
      ui.label('Restart');
      ui.say('Move with the mouse, touch or arrow keys. Aim with the edge of the paddle.');
      serve(true);
    };
    serve(true);
    canvas.addEventListener('pointermove', (event) => aim(event.clientX, event.clientY));
    window.addEventListener('keydown', (event) => {
      if (!selected('pong') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      keyDir = event.key === 'ArrowLeft' ? -1 : 1;
    });
    window.addEventListener('keyup', (event) => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) keyDir = 0; });
    panel.querySelectorAll('[data-pong-move]').forEach((button) => {
      const fresh = button.cloneNode(true);
      button.replaceWith(fresh);
      const dir = fresh.dataset.pongMove === 'left' ? -1 : 1;
      fresh.addEventListener('pointerdown', () => { keyDir = dir; if (!running) start(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => fresh.addEventListener(type, () => { keyDir = 0; }));
    });
    const game = {
      camera,
      primary() { start(); },
      peek() { return {running, bx, bz, vz, rally, bonus, paddle: player.position.x}; },
      pointerDown(event) { aim(event.clientX, event.clientY); if (!running) start(); },
      pause() { if (!running) return; running = false; ui.label('Start rally'); ui.say('Paused. Start a new rally when you are ready.'); },
      resize(aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      },
      frame(dt, t) {
        if (keyDir) targetX = THREE.MathUtils.clamp(targetX + keyDir * 11 * dt, -W / 2 + PW / 2, W / 2 - PW / 2);
        player.position.x += (targetX - player.position.x) * Math.min(1, dt * 16);
        if (running) {
          const px = bz; bx += vx * dt; bz += vz * dt; travel += Math.hypot(vx, vz) * dt;
          if (Math.abs(bx) > W / 2 - R) { bx = Math.sign(bx) * (W / 2 - R); vx *= -1; burst.fire(new THREE.Vector3(bx, 0.3, bz), 0xdfff63, 3, 8); }
          const playerZ = player.position.z - 0.2;
          if (vz > 0 && px < playerZ && bz >= playerZ) {
            const offset = bx - player.position.x;
            if (Math.abs(offset) < PW / 2 + R) {
              rally += 1;
              ui.score(rally + bonus);
              vz = -Math.min(17, Math.abs(vz) * 1.05 + 0.15);
              vx = THREE.MathUtils.clamp(vx * 0.4 + offset * 4.2, -9, 9);
              bz = playerZ;
              burst.fire(new THREE.Vector3(bx, 0.3, bz), 0xdfff63, 4, 14);
              cpuSpeed = Math.min(9.5, cpuSpeed + 0.12);
            }
          }
          const cpuZ = cpu.position.z + 0.2;
          if (vz < 0 && px > cpuZ && bz <= cpuZ) {
            const offset = bx - cpu.position.x;
            if (Math.abs(offset) < PW / 2 + R) {
              vz = Math.abs(vz);
              vx = THREE.MathUtils.clamp(vx * 0.5 + offset * 3 + rand(-1.5, 1.5), -9, 9);
              bz = cpuZ;
              burst.fire(new THREE.Vector3(bx, 0.3, bz), 0xf47a52, 4, 12);
            }
          }
          if (bz > L / 2 + 1.2) end();
          if (bz < -L / 2 - 1.2) {
            bonus += 1;
            ui.score(rally + bonus);
            ui.say(`Point! The computer missed. ${bonus} won so far.`);
            burst.fire(new THREE.Vector3(bx, 0.4, -L / 2), 0xffffff, 7);
            serve(true);
          }
          const predict = vz < 0 ? bx : bx * 0.35;
          cpu.position.x += THREE.MathUtils.clamp(predict - cpu.position.x, -cpuSpeed * dt, cpuSpeed * dt);
          cpu.position.x = THREE.MathUtils.clamp(cpu.position.x, -W / 2 + PW / 2, W / 2 - PW / 2);
        } else if (!still()) {
          bx = Math.sin(t * 0.8) * 2.4; bz = Math.cos(t * 0.6) * 3.5; travel += dt * 4;
          cpu.position.x += (bx - cpu.position.x) * Math.min(1, dt * 3);
        }
        ball.position.set(bx, R + Math.abs(Math.sin(travel * 0.55)) * 0.55, bz);
        history.unshift(ball.position.clone());
        history.length = Math.min(history.length, trail.length * 2);
        trail.forEach((mesh, index) => { const point = history[index * 2]; if (point) mesh.position.copy(point); mesh.visible = running && Boolean(point); });
        burst.update(dt, 5);
        const aspect = camera.aspect;
        camera.position.set(0, aspect < 1 ? 14 : 9.5, aspect < 1 ? 14.5 : 12.5);
        shake.apply(camera, 0.25);
        camera.lookAt(0, 0, aspect < 1 ? 1.2 : 1.2);
      },
    };
    return game;
  });

  /* ---------------- Gravity Flip ---------------- */
  mount('gravity', ({scene, ui}) => {
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 160);
    scene.fog = new THREE.Fog(0x061510, 30, 90);
    standardLights(scene, {sun: 1.2, x: 4, y: 12, z: 6, span: 10});
    const TOP = 4.4; const WIDTH = 3.4; const SIZE = 0.9;
    const surfaceTexture = gridTexture('rgba(200,255,90,.5)', '#0a2218', 2);
    surfaceTexture.repeat.set(2, 60);
    const surface = new THREE.MeshStandardMaterial({map: surfaceTexture, emissiveMap: surfaceTexture, emissive: 0x6f9f1f, emissiveIntensity: 0.45, roughness: 0.6, metalness: 0.2});
    const floor = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, 0.3, 160), surface);
    floor.position.set(0, -0.15, -70);
    floor.receiveShadow = true;
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, 0.3, 160), surface);
    ceiling.position.set(0, TOP + 0.15, -70);
    ceiling.receiveShadow = true;
    scene.add(floor, ceiling);
    const edgeMaterial = new THREE.MeshStandardMaterial({color: 0xdfff63, emissive: 0xb6ff2a, emissiveIntensity: 1.3});
    [[-1, 0], [1, 0], [-1, TOP], [1, TOP]].forEach(([side, y]) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 160), edgeMaterial);
      edge.position.set(side * WIDTH / 2, y, -70);
      scene.add(edge);
    });
    // Arches every few metres make the tunnel and the speed readable.
    const archMaterial = new THREE.MeshStandardMaterial({color: 0x12382a, roughness: 0.4, metalness: 0.5});
    const arches = Array.from({length: 14}, (_, index) => {
      const group = new THREE.Group();
      [-1, 1].forEach((side) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, TOP + 0.3, 0.22), archMaterial);
        post.position.set(side * (WIDTH / 2 + 0.15), TOP / 2, 0);
        group.add(post);
      });
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.1, TOP, 0.05), edgeMaterial);
      light.position.set(-(WIDTH / 2 + 0.28), TOP / 2, 0);
      group.add(light);
      group.position.z = -index * 8;
      scene.add(group);
      return group;
    });

    const runner = new THREE.Group();
    const cube = new THREE.Mesh(new RoundedBoxGeometry(SIZE, SIZE, SIZE, 3, 0.14), new THREE.MeshPhysicalMaterial({color: 0xdfff63, emissive: 0x5f8f10, emissiveIntensity: 0.5, roughness: 0.25, clearcoat: 1}));
    cube.castShadow = true;
    runner.add(cube);
    const runnerLight = new THREE.PointLight(0xc8ff3a, 5, 5, 2);
    runner.add(runnerLight);
    scene.add(runner);

    const spikeMaterial = new THREE.MeshPhysicalMaterial({color: 0xf47a52, emissive: 0x9a2a10, emissiveIntensity: 0.6, roughness: 0.3, clearcoat: 1});
    const blockMaterial = new THREE.MeshStandardMaterial({color: 0x3a1410, roughness: 0.5, metalness: 0.4});
    const spikeGeometry = new THREE.ConeGeometry(0.28, 0.7, 4);
    const obstacles = [];
    const burst = makeBurst(scene);
    const shake = shaker();
    let running = false;
    let onCeiling = false;
    let flip = 1;
    let points = 0;
    let speed = 14;
    let roll = 0;

    const addObstacle = (z) => {
      const top = Math.random() > 0.5;
      const group = new THREE.Group();
      const block = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, 0.7, 0.9), blockMaterial);
      block.position.y = 0.35;
      block.castShadow = true;
      group.add(block);
      for (let i = 0; i < 5; i += 1) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.set(-WIDTH / 2 + 0.34 + i * ((WIDTH - 0.68) / 4), 1.05, 0);
        spike.castShadow = true;
        group.add(spike);
      }
      if (top) { group.rotation.z = Math.PI; group.position.y = TOP; }
      group.position.z = z;
      scene.add(group);
      obstacles.push({group, top, passed: false});
    };
    const resetObstacles = () => {
      obstacles.splice(0).forEach((item) => scene.remove(item.group));
      for (let i = 0; i < 6; i += 1) addObstacle(-26 - i * 14);
    };
    const end = () => {
      running = false;
      burst.fire(runner.position.clone(), 0xdfff63, 9);
      shake.start();
      ui.label('Run again');
      ui.say(`Run ended after ${points} barrier${points === 1 ? '' : 's'}.`);
    };
    const start = () => {
      running = true; onCeiling = false; flip = 1; points = 0; speed = 14;
      resetObstacles();
      ui.score(0);
      ui.label('Flip');
      ui.say('Tap, click or press Space to flip between floor and ceiling.');
    };
    resetObstacles();
    window.addEventListener('keydown', (event) => {
      if ((event.code !== 'Space' && event.code !== 'ArrowUp' && event.code !== 'ArrowDown') || !selected('gravity')) return;
      event.preventDefault();
      game.primary();
    });
    const game = {
      camera,
      primary() {
        if (!running) { start(); return; }
        onCeiling = !onCeiling;
        flip = 0;
      },
      peek() { const next = obstacles.filter((o) => o.group.position.z < 0).sort((a, b) => b.group.position.z - a.group.position.z)[0]; return {running, points, onCeiling, flip, nextZ: next?.group.position.z, nextTop: next?.top}; },
      pause() { if (!running) return; running = false; ui.label('Start run'); ui.say('Paused. Start a new run when you are ready.'); },
      resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
      frame(dt, t) {
        flip = Math.min(1, flip + dt / 0.26);
        const eased = flip < 0.5 ? 2 * flip * flip : 1 - Math.pow(-2 * flip + 2, 2) / 2;
        const fromY = onCeiling ? SIZE / 2 : TOP - SIZE / 2;
        const toY = onCeiling ? TOP - SIZE / 2 : SIZE / 2;
        const y = flip >= 1 ? toY : THREE.MathUtils.lerp(fromY, toY, eased);
        const move = running ? speed * dt : (still() ? 0 : 2.5 * dt);
        if (running) speed = Math.min(28, 14 + points * 0.45);
        roll -= move / (SIZE * 0.8);
        runner.position.set(0, y, 0);
        const upright = onCeiling ? [0, Math.PI] : [Math.PI, 0];
        cube.rotation.set(roll, 0, THREE.MathUtils.lerp(upright[0], upright[1], flip >= 1 ? 1 : eased));
        surfaceTexture.offset.y += move / 5.3;
        arches.forEach((arch) => { arch.position.z += move; if (arch.position.z > 8) arch.position.z -= 112; });
        for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const item = obstacles[i];
          item.group.position.z += move;
          const z = item.group.position.z;
          if (running && Math.abs(z) < 0.45 + SIZE / 2) {
            const hitFloor = !item.top && y - SIZE / 2 < 1.25;
            const hitTop = item.top && y + SIZE / 2 > TOP - 1.25;
            if (hitFloor || hitTop) { end(); break; }
          }
          if (running && !item.passed && z > SIZE) {
            item.passed = true;
            points += 1;
            ui.score(points);
          }
          if (z > 10) {
            scene.remove(item.group);
            obstacles.splice(i, 1);
            const farthest = obstacles.reduce((min, o) => Math.min(min, o.group.position.z), 0);
            addObstacle(farthest - rand(10, 16) + Math.min(4, points * 0.15));
          }
        }
        burst.update(dt, onCeiling ? -8 : 8);
        camera.position.set(1.05, TOP / 2 + 0.35 + (still() ? 0 : Math.sin(t * 0.7) * 0.12), 5.4);
        shake.apply(camera, 0.35);
        camera.lookAt(-0.25, TOP / 2, -10);
      },
    };
    return game;
  });

  const pauseAll = () => Object.values(games).forEach((game) => game.pause());
  window.addEventListener('games:pause', pauseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
  window.Arcade3D = {has: (key) => Boolean(games[key]), peek: (key) => games[key]?.peek?.()};
})();
