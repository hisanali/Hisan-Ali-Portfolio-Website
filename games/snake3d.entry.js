import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// 3D renderer for Snake Circuit. Game rules stay in games.js; this only draws the state it is given.
(() => {
  const source = document.querySelector('[data-snake-canvas]');
  const game = window.GameSnake;
  if (!source || !game || window.Snake3D) return;
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  const GRID = 18;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'snake3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Snake game board in 3D');
  source.before(canvas);
  source.hidden = true;

  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const cameraHome = new THREE.Vector3(0, 28.5, 12.5);
  const lookTarget = new THREE.Vector3(0, 0, 0.7);
  camera.position.copy(cameraHome);
  camera.lookAt(lookTarget);

  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x0e2419, 0.7));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
  sun.position.set(-8, 22, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 70});
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xd4ff7a, 0.7);
  rim.position.set(10, 7, -13);
  scene.add(rim);

  const cell = (x, y) => new THREE.Vector3(x - (GRID - 1) / 2, 0, y - (GRID - 1) / 2);

  // Board: a checkered lawn inside a dark base with glowing circuit rails.
  const lawn = document.createElement('canvas');
  lawn.width = lawn.height = GRID * 32;
  const lawnCtx = lawn.getContext('2d');
  for (let y = 0; y < GRID; y += 1) for (let x = 0; x < GRID; x += 1) {
    lawnCtx.fillStyle = (x + y) % 2 ? '#1d4b35' : '#22573d';
    lawnCtx.fillRect(x * 32, y * 32, 32, 32);
  }
  lawnCtx.strokeStyle = 'rgba(223,255,99,.07)';
  lawnCtx.lineWidth = 1.5;
  for (let i = 0; i <= GRID; i += 1) {
    lawnCtx.beginPath(); lawnCtx.moveTo(i * 32, 0); lawnCtx.lineTo(i * 32, GRID * 32); lawnCtx.stroke();
    lawnCtx.beginPath(); lawnCtx.moveTo(0, i * 32); lawnCtx.lineTo(GRID * 32, i * 32); lawnCtx.stroke();
  }
  const lawnTexture = new THREE.CanvasTexture(lawn);
  lawnTexture.colorSpace = THREE.SRGBColorSpace;
  lawnTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GRID, GRID), new THREE.MeshStandardMaterial({map: lawnTexture, roughness: 0.9}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const base = new THREE.Mesh(new RoundedBoxGeometry(GRID + 2.2, 1.4, GRID + 2.2, 4, 0.5), new THREE.MeshStandardMaterial({color: 0x0b1d15, roughness: 0.55, metalness: 0.15}));
  base.position.y = -0.72;
  base.receiveShadow = true;
  scene.add(base);
  const railMaterial = new THREE.MeshStandardMaterial({color: 0x123326, roughness: 0.35, metalness: 0.3});
  const glowMaterial = new THREE.MeshStandardMaterial({color: 0x9fd62a, emissive: 0x9fe01f, emissiveIntensity: 0.55, roughness: 0.4});
  [[0, -(GRID / 2 + 0.3), GRID + 1.1, 0.6], [0, GRID / 2 + 0.3, GRID + 1.1, 0.6], [-(GRID / 2 + 0.3), 0, 0.6, GRID], [GRID / 2 + 0.3, 0, 0.6, GRID]].forEach(([x, z, w, d]) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(w, 0.5, d, 3, 0.18), railMaterial);
    rail.position.set(x, 0.2, z);
    rail.castShadow = rail.receiveShadow = true;
    scene.add(rail);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(w > d ? w * 0.96 : w * 0.3, 0.05, d > w ? d * 0.96 : d * 0.3), glowMaterial);
    glow.position.set(x, 0.47, z);
    scene.add(glow);
  });

  // Snake body: glossy instanced spheres, two per segment so the body reads as one smooth tube.
  const MAX = GRID * GRID * 2 + 4;
  const body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 32, 20), new THREE.MeshPhysicalMaterial({roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.22}), MAX);
  body.castShadow = true;
  body.count = 0;
  scene.add(body);
  const headColor = new THREE.Color(0x9ed82c);
  const tailColor = new THREE.Color(0x2f6a12);
  const bodyColor = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scaleVector = new THREE.Vector3();

  const head = new THREE.Group();
  const headMaterial = new THREE.MeshPhysicalMaterial({color: headColor, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15});
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 28), headMaterial);
  skull.scale.set(1.12, 0.86, 1.3);
  skull.castShadow = true;
  head.add(skull);
  const eyeWhite = new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: 0.15, clearcoat: 1});
  const pupil = new THREE.MeshStandardMaterial({color: 0x0b1a12, roughness: 0.2});
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), eyeWhite);
    eye.position.set(side * 0.27, 0.25, 0.3);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), pupil);
    dot.position.set(side * 0.29, 0.29, 0.42);
    head.add(eye, dot);
  });
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.42), new THREE.MeshStandardMaterial({color: 0xe8453c, roughness: 0.4}));
  tongue.position.set(0, -0.02, 0.78);
  head.add(tongue);
  scene.add(head);

  // Food: an apple, an orange or a berry cluster, floating over a soft glow.
  const glossy = (color, roughness = 0.24) => new THREE.MeshPhysicalMaterial({color, roughness, clearcoat: 1, clearcoatRoughness: 0.12});
  const leafMaterial = new THREE.MeshStandardMaterial({color: 0x4caf32, roughness: 0.5, side: THREE.DoubleSide});
  const stemMaterial = new THREE.MeshStandardMaterial({color: 0x5a3b1c, roughness: 0.8});
  const shadowed = (mesh) => { mesh.castShadow = true; return mesh; };
  const leaf = (x, y, rotation) => {
    const mesh = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), leafMaterial));
    mesh.scale.set(1, 0.22, 0.5);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = rotation;
    return mesh;
  };
  const makeApple = () => {
    const group = new THREE.Group();
    const fruit = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 28), glossy(0xd3261d)));
    fruit.scale.set(1, 0.92, 1);
    const stem = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.26, 8), stemMaterial));
    stem.position.y = 0.45;
    stem.rotation.z = 0.2;
    group.add(fruit, stem, leaf(0.15, 0.48, -0.5));
    return group;
  };
  const makeOrange = () => {
    const group = new THREE.Group();
    const fruit = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.4, 40, 28), glossy(0xf28a1c, 0.55)));
    const nub = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.06, 8), stemMaterial));
    nub.position.y = 0.4;
    group.add(fruit, nub, leaf(0.14, 0.43, -0.35));
    return group;
  };
  const makeBerries = () => {
    const group = new THREE.Group();
    const material = glossy(0x5b2a86, 0.2);
    [[-0.17, 0, 0.06], [0.17, 0, 0.06], [0, 0.02, -0.18], [0, 0.26, 0]].forEach(([x, y, z]) => {
      const berry = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.21, 28, 18), material));
      berry.position.set(x, y, z);
      group.add(berry);
    });
    group.add(leaf(0.08, 0.47, -0.3));
    return group;
  };
  const foods = [makeApple(), makeOrange(), makeBerries()];
  const foodColors = [0xff5a3c, 0xffa53c, 0xa65cff];
  const foodHolder = new THREE.Group();
  foods.forEach((food) => { food.visible = false; foodHolder.add(food); });
  scene.add(foodHolder);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const glowCtx = glowCanvas.getContext('2d');
  const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  glowCtx.fillStyle = gradient;
  glowCtx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55}));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  scene.add(halo);

  // Particles for eating.
  const sparkGeometry = new THREE.SphereGeometry(0.08, 8, 6);
  const sparks = Array.from({length: 18}, () => {
    const mesh = new THREE.Mesh(sparkGeometry, new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true}));
    mesh.visible = false;
    scene.add(mesh);
    return {mesh, velocity: new THREE.Vector3(), life: 0};
  });

  let from = [];
  let to = [];
  let stepAt = 0;
  let interval = 125;
  let running = false;
  let foodCell = {x: 0, y: 0};
  let foodType = 0;
  let headAngle = 0;
  let crashAt = -1e9;
  let eatAt = -1e9;

  const burst = (position, color) => {
    sparks.forEach((spark) => {
      spark.mesh.visible = true;
      spark.mesh.material.color.set(color);
      spark.mesh.position.copy(position).setY(0.5);
      spark.velocity.set((Math.random() - 0.5) * 7, 3 + Math.random() * 4, (Math.random() - 0.5) * 7);
      spark.life = 1;
    });
  };

  window.Snake3D = {
    step(state) {
      const next = state.snake.map((part) => cell(part.x, part.y));
      const jumped = !to.length || next[0].distanceTo(to[0]) > 1.5;
      const grew = !jumped && state.running && next.length > to.length;
      if (grew) { burst(cell(foodCell.x, foodCell.y), foodColors[foodType]); eatAt = performance.now(); }
      from = jumped ? next.map((v) => v.clone()) : to;
      to = next;
      stepAt = performance.now();
      interval = state.interval || 125;
      running = state.running;
      if (state.food.x !== foodCell.x || state.food.y !== foodCell.y || jumped) {
        foodCell = {...state.food};
        foodType = (state.food.x * 7 + state.food.y * 13) % foods.length;
        foods.forEach((food, index) => { food.visible = index === foodType; });
        halo.material.color.set(foodColors[foodType]);
      }
    },
    crash() { crashAt = performance.now(); running = false; },
  };
  window.Snake3D.step(game.snapshot());

  // Swipe to steer on touch screens.
  let touchStart = null;
  canvas.addEventListener('pointerdown', (event) => { touchStart = {x: event.clientX, y: event.clientY}; });
  canvas.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    game.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  canvas.style.touchAction = 'none';

  const resize = () => {
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);

  const position = new THREE.Vector3();
  const points = [];
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden || !canvas.offsetParent) return;
    const t = now / 1000;
    const still = reduceMotion.matches;
    const alpha = running ? Math.min(1, (now - stepAt) / interval) : 1;

    points.length = 0;
    to.forEach((target, index) => {
      const start = from[index] || from[from.length - 1] || target;
      points.push(position.copy(start).lerp(target, alpha).clone());
    });

    // Body spheres, tapering from head to tail with a gentle slither.
    let count = 0;
    const n = points.length;
    const radiusAt = (i) => THREE.MathUtils.lerp(0.44, 0.27, n > 1 ? i / (n - 1) : 0);
    const place = (point, radius, shade, wave) => {
      scaleVector.setScalar(radius * 2);
      matrix.compose(position.set(point.x, radius + wave, point.z), quaternion, scaleVector);
      body.setMatrixAt(count, matrix);
      bodyColor.copy(headColor).lerp(tailColor, shade);
      if (Math.round(shade * n) % 3 === 1) bodyColor.multiplyScalar(0.86);
      body.setColorAt(count, bodyColor);
      count += 1;
    };
    for (let i = 1; i < n; i += 1) {
      const wave = running && !still ? Math.sin(t * 9 - i * 0.7) * 0.025 : 0;
      place(points[i], radiusAt(i), i / n, wave);
      const mid = points[i - 1].clone().lerp(points[i], 0.5);
      place(mid, (radiusAt(i) + radiusAt(i - 1)) / 2, (i - 0.5) / n, wave);
    }
    body.count = count;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    if (n) {
      head.position.set(points[0].x, 0.43, points[0].z);
      const toward = n > 1 ? points[0].clone().sub(points[1]) : new THREE.Vector3(1, 0, 0);
      if (toward.lengthSq() > 1e-6) {
        const target = Math.atan2(toward.x, toward.z);
        let delta = target - headAngle;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        headAngle += delta * Math.min(1, dt * 18);
      }
      head.rotation.y = headAngle;
      tongue.visible = running && Math.sin(t * 5) > 0.55;
    }
    const sinceCrash = now - crashAt;
    headMaterial.color.copy(headColor).lerp(new THREE.Color(0xff4a3a), sinceCrash < 900 ? 0.8 * (1 - sinceCrash / 900) : 0);

    const foodPosition = cell(foodCell.x, foodCell.y);
    const sinceEat = now - eatAt;
    const pop = sinceEat < 260 ? sinceEat / 260 : 1;
    foodHolder.position.set(foodPosition.x, 0.5 + (still ? 0 : Math.sin(t * 2.6) * 0.09), foodPosition.z);
    foodHolder.rotation.y = still ? 0.4 : t * 0.9;
    foodHolder.scale.setScalar(0.4 + 0.6 * pop);
    halo.position.set(foodPosition.x, 0.02, foodPosition.z);
    halo.material.opacity = 0.35 + (still ? 0 : Math.sin(t * 2.6) * 0.12);

    sparks.forEach((spark) => {
      if (spark.life <= 0) { spark.mesh.visible = false; return; }
      spark.life -= dt * 1.6;
      spark.velocity.y -= 12 * dt;
      spark.mesh.position.addScaledVector(spark.velocity, dt);
      spark.mesh.scale.setScalar(Math.max(0.01, spark.life));
      spark.mesh.material.opacity = Math.max(0, spark.life);
    });

    camera.position.copy(cameraHome);
    if (sinceCrash < 450 && !still) {
      const shake = (1 - sinceCrash / 450) * 0.35;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }
    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
  };
  resize();
  requestAnimationFrame(frame);
})();
