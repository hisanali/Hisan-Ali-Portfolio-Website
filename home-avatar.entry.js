/* Live 3D portrait on the home page.
   The real studio photo is shown on a finely subdivided surface that is pushed
   into shape by a depth map (taken from a 3D model generated from the same
   photo), so every pixel is the real photograph while the figure has true depth.
   On its own it only drifts very slightly and breathes; while the pointer is
   over the panel (or a finger on it) head and body turn gently toward it.
   Loads only when the section is near the viewport; falls back to the photo. */
import {
  Clock, DoubleSide, MathUtils, Mesh, PerspectiveCamera, PlaneGeometry, Scene,
  ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, WebGLRenderer, LinearFilter
} from 'three';

const stage = document.querySelector('[data-avatar-stage]');
if (stage) {
  const host = stage.querySelector('[data-avatar-canvas]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHOTO = stage.dataset.photo;
  const DEPTH = stage.dataset.depth;
  const ASPECT = 744 / 1144; // photo width / height
  const HEIGHT = 1.75;

  const supportsWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();

  const vertexShader = /* glsl */`
    uniform sampler2D uDepth;
    uniform float uDepthScale;
    uniform vec2 uHead;      // extra head yaw / pitch (radians)
    uniform vec2 uNeck;      // neck pivot in uv
    uniform float uBreath;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      float d = texture2D(uDepth, uv).r;
      p.z = (d - 0.5) * uDepthScale;

      // Breathing: the chest rises and comes forward a touch.
      float chest = smoothstep(0.0, 0.25, uv.y) * (1.0 - smoothstep(0.45, 0.62, uv.y));
      p.y += chest * uBreath * 0.005;
      p.z += chest * uBreath * 0.009;

      // Head: rotate everything above the neck around a pivot inside the neck.
      float head = smoothstep(uNeck.y - 0.035, uNeck.y + 0.03, uv.y);
      vec3 pivot = vec3((uNeck.x - 0.5) * ${(ASPECT * HEIGHT).toFixed(4)}, (uNeck.y - 0.5) * ${HEIGHT.toFixed(2)}, -0.05);
      vec3 q = p - pivot;
      float yaw = uHead.x * head;
      float pitch = uHead.y * head;
      q = vec3(q.x * cos(yaw) + q.z * sin(yaw), q.y, -q.x * sin(yaw) + q.z * cos(yaw));
      q = vec3(q.x, q.y * cos(pitch) - q.z * sin(pitch), q.y * sin(pitch) + q.z * cos(pitch));
      p = q + pivot;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const fragmentShader = /* glsl */`
    uniform sampler2D uPhoto;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(uPhoto, vUv);
      // soft cut-out edge, and fade the bottom of the photo into the panel
      float a = smoothstep(0.12, 0.88, c.a) * smoothstep(0.0, 0.06, vUv.y);
      if (a < 0.01) discard;
      gl_FragColor = vec4(c.rgb, a);
      #include <colorspace_fragment>
    }
  `;

  const start = () => {
    if (!supportsWebGL) { stage.classList.add('is-fallback'); return; }
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(24, 1, 0.05, 30);

    let loaded = 0;
    const markReady = () => { loaded += 1; if (loaded === 2) stage.classList.add('is-ready'); };
    const loader = new TextureLoader();
    const photo = loader.load(PHOTO, markReady, undefined, () => stage.classList.add('is-fallback'));
    photo.colorSpace = SRGBColorSpace;
    photo.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const depth = loader.load(DEPTH, markReady, undefined, () => stage.classList.add('is-fallback'));
    depth.minFilter = LinearFilter;
    depth.generateMipmaps = false;

    const uniforms = {
      uPhoto: { value: photo },
      uDepth: { value: depth },
      uDepthScale: { value: 0.34 },
      uHead: { value: new Vector2() },
      uNeck: { value: new Vector2(0.49, 0.64) },
      uBreath: { value: 0 }
    };
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, side: DoubleSide });
    const figure = new Mesh(new PlaneGeometry(HEIGHT * ASPECT, HEIGHT, 240, 370), material);
    scene.add(figure);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      // Fit the figure to ~94% of the panel height (or width on narrow panels)
      // and stand it on the bottom edge of the panel.
      const tan = Math.tan(MathUtils.degToRad(camera.fov / 2));
      const byHeight = HEIGHT / 0.94 / (2 * tan);
      const byWidth = (HEIGHT * ASPECT) / 0.9 / (2 * tan * camera.aspect);
      const distance = Math.max(byHeight, byWidth);
      const viewHeight = 2 * distance * tan;
      figure.position.y = -viewHeight / 2 + HEIGHT / 2 - HEIGHT * 0.03;
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host);
    resize();

    // Hover (or touch) over the panel: turn gently toward the pointer.
    let hoverX = 0; let hoverY = 0; let hovering = false;
    let lookX = 0; let lookY = 0;
    const aim = (event) => {
      const box = stage.getBoundingClientRect();
      hoverX = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2));
      hoverY = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - 0.32) * 2));
    };
    stage.addEventListener('pointerenter', (event) => { hovering = true; aim(event); });
    stage.addEventListener('pointermove', (event) => { hovering = true; aim(event); });
    stage.addEventListener('pointerleave', () => { hovering = false; });
    stage.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') hovering = false; });
    stage.addEventListener('pointercancel', () => { hovering = false; });

    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '120px' }).observe(stage);

    const clock = new Clock();
    let t = 0;
    const tick = () => {
      requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      t += dt;
      const motion = reduceMotion ? 0 : 1;
      // Very subtle, slow idle motion only: two layered slow waves so it never
      // looks mechanical. About 1-2 degrees at most, well inside what the photo holds.
      const drift = Math.sin(t * 0.23) * 0.6 + Math.sin(t * 0.11 + 1.3) * 0.4;
      const nod = Math.sin(t * 0.17 + 0.6) * 0.6 + Math.sin(t * 0.07) * 0.4;
      // Ease toward the pointer while hovering, back to centre when it leaves.
      const ease = 1 - Math.pow(0.04, dt);
      lookX += ((hovering ? hoverX : 0) - lookX) * ease;
      lookY += ((hovering ? hoverY : 0) - lookY) * ease;
      figure.rotation.y = (drift * 0.022 + lookX * 0.085) * motion;
      figure.rotation.x = (nod * 0.006 + lookY * 0.03) * motion;
      const head = uniforms.uHead.value;
      head.x = ((Math.sin(t * 0.29 + 0.4) * 0.6 + drift * 0.4) * 0.02 + lookX * 0.07) * motion;
      head.y = ((Math.sin(t * 0.21 + 2.1) * 0.6 + nod * 0.4) * 0.01 + lookY * 0.035) * motion;
      uniforms.uBreath.value = Math.sin(t * 1.55) * motion;
      renderer.render(scene, camera);
    };
    tick();
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { io.disconnect(); start(); }
  }, { rootMargin: '400px' });
  io.observe(stage);
}
