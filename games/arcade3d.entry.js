import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

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
      game.resize(width / height);
    };
    new ResizeObserver(resize).observe(canvas);
    let last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden || !canvas.offsetParent) return;
      game.frame(dt, now / 1000);
      view.renderer.render(view.scene, game.camera);
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

  /* ---------------- Signal Flight ---------------- */
  mount('flight', ({scene, ui}) => {
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);
    scene.fog = new THREE.Fog(0x061510, 40, 120);
    standardLights(scene, {sun: 1.4, x: 4, y: 20, z: 10, span: 12});
    const floorTexture = gridTexture('rgba(200,255,90,.55)', '#071a12', 4);
    floorTexture.repeat.set(20, 60);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 240), new THREE.MeshStandardMaterial({map: floorTexture, emissiveMap: floorTexture, emissive: 0x6f9f1f, emissiveIntensity: 0.55, roughness: 0.8}));
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -90;
    floor.receiveShadow = true;
    scene.add(floor);

    // Canyon towers on both sides for a sense of speed.
    const towerMaterial = new THREE.MeshStandardMaterial({color: 0x0d2a20, roughness: 0.6, metalness: 0.3});
    const capMaterial = new THREE.MeshStandardMaterial({color: 0xdfff63, emissive: 0xb6ff2a, emissiveIntensity: 1.1});
    const towers = Array.from({length: 22}, (_, index) => {
      const group = new THREE.Group();
      const height = rand(4, 16);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(rand(2, 4), height, rand(2, 4)), towerMaterial);
      tower.position.y = height / 2;
      tower.castShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(tower.geometry.parameters.width + 0.1, 0.12, tower.geometry.parameters.depth + 0.1), capMaterial);
      cap.position.y = height;
      group.add(tower, cap);
      group.position.set((index % 2 ? 1 : -1) * rand(9, 18), 0, -index * 10);
      scene.add(group);
      return group;
    });

    const stars = new THREE.BufferGeometry();
    const starPositions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i += 1) starPositions.set([rand(-60, 60), rand(6, 50), rand(-200, 10)], i * 3);
    stars.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starField = new THREE.Points(stars, new THREE.PointsMaterial({color: 0xffffff, size: 0.18, transparent: true, opacity: 0.8}));
    scene.add(starField);

    // The craft: a sleek body with wings and a glowing engine.
    const craft = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.6, 24), new THREE.MeshPhysicalMaterial({color: 0xf4f7f2, roughness: 0.25, metalness: 0.4, clearcoat: 1}));
    hull.rotation.x = -Math.PI / 2;
    hull.castShadow = true;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.55), new THREE.MeshPhysicalMaterial({color: 0x1d4d38, roughness: 0.3, metalness: 0.6, clearcoat: 1}));
    wing.position.set(0, -0.05, 0.25);
    wing.castShadow = true;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.45), wing.material);
    fin.position.set(0, 0.22, 0.45);
    const engine = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({color: 0xdfff63}));
    engine.position.z = 0.78;
    const glow = new THREE.PointLight(0xc8ff3a, 6, 6, 2);
    glow.position.z = 1;
    craft.add(hull, wing, fin, engine, glow);
    scene.add(craft);
    const trail = Array.from({length: 12}, (_, index) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({color: 0xdfff63, transparent: true, opacity: 0.45 * (1 - index / 12), depthWrite: false}));
      scene.add(puff);
      return puff;
    });

    const ringGeometry = new THREE.TorusGeometry(1.75, 0.16, 16, 64);
    const rings = [];
    const burst = makeBurst(scene);
    const shake = shaker();
    let running = false;
    let y = 4;
    let vy = 0;
    let speed = 18;
    let points = 0;
    let nextRingZ = -40;

    const addRing = (z) => {
      const material = new THREE.MeshStandardMaterial({color: 0xff8a62, emissive: 0xf4623a, emissiveIntensity: 1.2, roughness: 0.35});
      const mesh = new THREE.Mesh(ringGeometry, material);
      const base = rand(2.3, 7.2);
      mesh.position.set(0, base, z);
      mesh.castShadow = true;
      scene.add(mesh);
      rings.push({mesh, base, sway: points > 6 ? rand(0.6, 1.6) : 0, phase: rand(0, Math.PI * 2), passed: false, flash: 0});
    };
    const resetRings = () => {
      rings.splice(0).forEach((ring) => scene.remove(ring.mesh));
      nextRingZ = -40;
      for (let i = 0; i < 6; i += 1) { addRing(nextRingZ); nextRingZ -= 24; }
    };
    const end = (reason) => {
      running = false;
      burst.fire(craft.position.clone(), 0xffb36b, 9);
      shake.start();
      ui.label('Fly again');
      ui.say(`${reason} Flight ended after ${points} ring${points === 1 ? '' : 's'}.`);
    };
    const start = () => {
      running = true; y = 4; vy = 3.5; speed = 18; points = 0;
      resetRings();
      ui.score(0);
      ui.label('Lift');
      ui.say('Tap, click or press Space to lift. Fly through every ring.');
    };
    resetRings();
    window.addEventListener('keydown', (event) => {
      if ((event.code !== 'Space' && event.code !== 'ArrowUp') || !selected('flight')) return;
      event.preventDefault();
      game.primary();
    });
    const game = {
      camera,
      primary() { if (running) vy = 6.4; else start(); },
      peek() { const next = rings.filter((ring) => !ring.passed && ring.mesh.position.z < 0).sort((a, b) => b.mesh.position.z - a.mesh.position.z)[0]; return {running, y, vy, points, ringY: next?.mesh.position.y, ringZ: next?.mesh.position.z}; },
      pause() { if (!running) return; running = false; ui.label('Start flight'); ui.say('Paused. Start a new flight when you are ready.'); },
      resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
      frame(dt, t) {
        if (running) {
          vy -= 15 * dt;
          y += vy * dt;
          speed = Math.min(34, 18 + points * 0.55);
          if (y < 0.5) { y = 0.5; end('Hit the ground.'); }
          else if (y > 10.5) { y = 10.5; end('Flew too high.'); }
        } else if (!still()) {
          y += (4 + Math.sin(t * 1.6) * 0.35 - y) * Math.min(1, dt * 3);
        }
        const move = running ? speed * dt : (still() ? 0 : 3 * dt);
        craft.position.set(0, y, 0);
        craft.rotation.x = running ? THREE.MathUtils.clamp(vy * 0.06, -0.5, 0.45) : 0.05;
        craft.rotation.z = still() ? 0 : Math.sin(t * 2.2) * 0.08;
        trail.forEach((puff, index) => {
          puff.position.set(0, y + (running ? vy * 0.004 * index : 0), 0.85 + index * 0.22);
          puff.scale.setScalar(1 - index / 16);
        });
        floorTexture.offset.y += move / 4;
        towers.forEach((tower) => { tower.position.z += move; if (tower.position.z > 12) tower.position.z -= 220; });
        for (let i = 0; i < 600; i += 1) {
          starPositions[i * 3 + 2] += move * 0.4;
          if (starPositions[i * 3 + 2] > 10) starPositions[i * 3 + 2] -= 210;
        }
        stars.attributes.position.needsUpdate = true;
        for (let i = rings.length - 1; i >= 0; i -= 1) {
          const ring = rings[i];
          const before = ring.mesh.position.z;
          ring.mesh.position.z += move;
          if (ring.sway) ring.mesh.position.y = ring.base + Math.sin(t * ring.sway + ring.phase) * 1.1;
          ring.mesh.rotation.z += dt * 0.6;
          if (running && !ring.passed && before < 0 && ring.mesh.position.z >= 0) {
            ring.passed = true;
            if (Math.abs(y - ring.mesh.position.y) < 1.28) {
              points += 1;
              ui.score(points);
              ring.flash = 1;
              ring.mesh.material.color.set(0xdfff63);
              ring.mesh.material.emissive.set(0xb6ff2a);
              burst.fire(ring.mesh.position.clone(), 0xdfff63, 5, 16);
            } else { end('Missed the ring.'); }
          }
          if (ring.flash > 0) { ring.flash -= dt * 2; ring.mesh.scale.setScalar(1 + (1 - ring.flash) * 0.4); }
          if (ring.mesh.position.z > 14) {
            scene.remove(ring.mesh);
            rings.splice(i, 1);
          }
        }
        const farthest = rings.reduce((min, ring) => Math.min(min, ring.mesh.position.z), 0);
        while (rings.length < 6) addRing(Math.min(farthest, -24) - 24 * (6 - rings.length));
        burst.update(dt, 6);
        camera.position.set(0, y * 0.6 + 1.9, 5.8);
        shake.apply(camera, 0.4);
        camera.lookAt(0, y * 0.8 + 0.4, -12);
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
