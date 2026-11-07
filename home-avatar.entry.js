/* Live 3D portrait on the home page.
   A textured 3D model of Hisan (generated from his studio photo) rendered with
   three.js: soft studio lighting, a contact shadow, gentle breathing, a turn
   towards the visitor's pointer and drag-to-rotate. Loads only when the
   section is near the viewport; falls back to the photo without WebGL. */
import {
  NoToneMapping, AmbientLight, Box3, Clock, Color, DirectionalLight, Group, MathUtils,
  Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShadowMaterial, SRGBColorSpace,
  Vector3, WebGLRenderer, PCFSoftShadowMap, HemisphereLight
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const stage = document.querySelector('[data-avatar-stage]');
if (stage) {
  const canvasHost = stage.querySelector('[data-avatar-canvas]');
  const status = stage.querySelector('[data-avatar-status]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MODEL_URL = stage.dataset.model;

  const supportsWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();

  const start = () => {
    if (!supportsWebGL) { stage.classList.add('is-fallback'); return; }
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    canvasHost.appendChild(renderer.domElement);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new PerspectiveCamera(26, 1, 0.05, 50);

    // Studio lighting: warm key, cool rim, soft fill from below.
    scene.add(new HemisphereLight(0xffffff, 0x9aa59c, 0.25));
    scene.add(new AmbientLight(0xffffff, 0.15));
    const key = new DirectionalLight(0xfff3e6, 0.55);
    key.position.set(1.6, 2.4, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new DirectionalLight(0xdfffd0, 0.5);
    rim.position.set(-2.2, 1.8, -2.4);
    scene.add(rim);
    const fill = new DirectionalLight(0xffffff, 0.15);
    fill.position.set(-1.8, 0.4, 2);
    scene.add(fill);

    const ground = new Mesh(new PlaneGeometry(6, 6), new ShadowMaterial({ opacity: 0.18 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const rig = new Group();      // pointer turn + drag
    const body = new Group();     // breathing / sway
    rig.add(body);
    scene.add(rig);

    const resize = () => {
      const { width, height } = canvasHost.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(canvasHost);
    resize();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(MODEL_URL, (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          // The generated mesh ships without normals: compute smooth ones for soft shading.
          if (!node.geometry.attributes.normal) node.geometry.computeVertexNormals();
          node.castShadow = true;
          node.receiveShadow = false;
          // The texture already carries the real light from the photo shoot. Show it
          // mostly as-is (emissive) and add only a little scene light for depth, so the
          // skin reads as a photo rather than a lit statue.
          const map = node.material && node.material.map;
          if (map) {
            map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            node.material = new MeshStandardMaterial({
              map, emissiveMap: map, emissive: new Color(0xffffff), emissiveIntensity: 0.78,
              roughness: 0.92, metalness: 0, envMapIntensity: 0.12
            });
          }
        }
      });
      // Normalise: feet on the ground, 1.75 m tall, centred.
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const scale = 1.75 / size.y;
      model.scale.setScalar(scale);
      box.setFromObject(model);
      const centre = box.getCenter(new Vector3());
      model.position.x -= centre.x;
      model.position.z -= centre.z;
      model.position.y -= box.min.y;
      body.add(model);

      // Frame head and torso: the model is waist-up, so aim at the upper body.
      const top = box.max.y - box.min.y;
      const target = new Vector3(0, top * 0.62, 0);
      camera.position.set(0, top * 0.66, top * 2.05);
      camera.lookAt(target);
      key.target.position.copy(target);
      scene.add(key.target);

      stage.classList.add('is-ready');
      if (status) status.textContent = '';
    }, (event) => {
      if (status && event.total) status.textContent = `${Math.round((event.loaded / event.total) * 100)}%`;
    }, () => {
      stage.classList.add('is-fallback');
    });

    // Pointer: the figure turns towards the visitor.
    let aimX = 0; let aimY = 0;
    let dragYaw = 0; let dragVelocity = 0; let dragging = false; let lastX = 0;
    addEventListener('pointermove', (event) => {
      const box = stage.getBoundingClientRect();
      aimX = MathUtils.clamp(((event.clientX - (box.left + box.width / 2)) / innerWidth) * 2, -1, 1);
      aimY = MathUtils.clamp(((event.clientY - (box.top + box.height * 0.35)) / innerHeight) * 2, -1, 1);
    }, { passive: true });
    canvasHost.addEventListener('pointerdown', (event) => { dragging = true; lastX = event.clientX; canvasHost.setPointerCapture(event.pointerId); stage.classList.add('is-dragging'); });
    canvasHost.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const delta = (event.clientX - lastX) / canvasHost.clientWidth;
      lastX = event.clientX;
      dragVelocity = delta * 6;
      dragYaw += delta * 6;
    });
    const endDrag = () => { dragging = false; stage.classList.remove('is-dragging'); };
    canvasHost.addEventListener('pointerup', endDrag);
    canvasHost.addEventListener('pointercancel', endDrag);

    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '120px' }).observe(stage);

    const clock = new Clock();
    let elapsed = 0;
    const tick = () => {
      requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const t = elapsed;
      if (!dragging) {
        dragVelocity *= 0.92;
        dragYaw += dragVelocity * dt * 2;
        // ease the drag back to facing the visitor
        dragYaw = MathUtils.lerp(dragYaw, 0, 0.012);
      }
      const yaw = (reduceMotion ? 0 : aimX * 0.32) + dragYaw;
      const pitch = reduceMotion ? 0 : aimY * 0.06;
      rig.rotation.y = MathUtils.lerp(rig.rotation.y, yaw, 0.06);
      rig.rotation.x = MathUtils.lerp(rig.rotation.x, pitch, 0.06);
      if (!reduceMotion) {
        body.scale.y = 1 + Math.sin(t * 1.6) * 0.0035;           // breathing
        body.rotation.z = Math.sin(t * 0.55) * 0.012;             // gentle sway
        body.position.y = Math.sin(t * 1.6) * 0.002;
      }
      renderer.render(scene, camera);
    };
    tick();
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { io.disconnect(); start(); }
  }, { rootMargin: '400px' });
  io.observe(stage);
}
