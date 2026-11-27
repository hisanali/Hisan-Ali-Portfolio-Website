// Smoke and steam: soft, billowing puffs that start small at their source, swell, rise, drift with the wind, turn and
// fade. Used for a damaged engine (white steam, then dark oily smoke), tyre smoke in a slide and crashed cars. Each puff
// has its own size, growth, colour, opacity and spin; they are drawn as camera-facing sprites with ordinary (not glowing)
// blending so dark smoke darkens what is behind it.
import * as THREE from '/evermile/vendor/three.module.js';

function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  // a cluster of soft blobs makes a lumpy, cloud-like puff rather than a disc
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 30, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r, s = 18 + Math.random() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  // fade the edge so no square shows
  const img = g.getImageData(0, 0, 128, 128), d = img.data;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const r = Math.hypot(x - 64, y - 64) / 64, k = Math.max(0, 1 - r * r); d[(y * 128 + x) * 4 + 3] *= k; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createSmoke(scene, max = 700) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), size = new Float32Array(max), alpha = new Float32Array(max), spin = new Float32Array(max);
  const vel = new Float32Array(max * 3), age = new Float32Array(max), life = new Float32Array(max), s0 = new Float32Array(max), s1 = new Float32Array(max), a0 = new Float32Array(max), rot = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1)); geo.setAttribute('spin', new THREE.BufferAttribute(spin, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: puffTexture() }, scale: { value: 600 }, light: { value: 1 } },
    vertexShader: `attribute float size, alpha, spin; attribute vec3 color; uniform float scale; varying float vA, vS; varying vec3 vC;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * scale / max(0.5, -mv.z); vA = alpha; vS = spin; vC = color; }`,
    fragmentShader: `uniform sampler2D map; uniform float light; varying float vA, vS; varying vec3 vC;
      void main() { vec2 p = gl_PointCoord - 0.5; float c = cos(vS), s = sin(vS); p = mat2(c, -s, s, c) * p + 0.5; vec4 t = texture2D(map, p);
        float a = t.a * vA; if (a < 0.004) discard; gl_FragColor = vec4(vC * light, a); }`,
    transparent: true, depthWrite: false, fog: false
  });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 5; scene.add(points);
  let next = 0, live = 0;
  return {
    points,
    // x,y,z: start; v: velocity; lifeS: seconds; from/to: start and end diameter (m); rgb: colour; op: peak opacity
    emit(x, y, z, vx, vy, vz, lifeS, from, to, r, g, b, op) {
      const i = next; next = (next + 1) % max; live = Math.min(max, live + 1);
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      age[i] = 0; life[i] = lifeS; s0[i] = from; s1[i] = to; a0[i] = op; col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
      rot[i] = (Math.random() - 0.5) * 1.2; spin[i] = Math.random() * 6.28; size[i] = from; alpha[i] = 0;
    },
    update(dt, camera, light = 1, pixelRatio = 1, wind = { x: 0.6, z: 0.25 }) {
      mat.uniforms.scale.value = innerHeight * pixelRatio * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * (camera.zoom || 1);
      mat.uniforms.light.value = light;
      for (let i = 0; i < max; i++) {
        if (age[i] >= life[i]) { if (alpha[i]) { alpha[i] = 0; } continue; }
        age[i] += dt; const u = Math.min(1, age[i] / life[i]), k = i * 3, drag = Math.exp(-1.6 * dt);
        vel[k] = vel[k] * drag + wind.x * (1 - drag); vel[k + 2] = vel[k + 2] * drag + wind.z * (1 - drag); vel[k + 1] = vel[k + 1] * Math.exp(-0.7 * dt) + 0.35 * dt; // slows, drifts downwind, keeps rising a little
        pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt; pos[k + 2] += vel[k + 2] * dt;
        size[i] = s0[i] + (s1[i] - s0[i]) * Math.sqrt(u); spin[i] += rot[i] * dt;
        alpha[i] = a0[i] * Math.min(1, u * 7) * (1 - u) * (1 - u); // quick to appear, slow to thin out
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; geo.attributes.spin.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    }
  };
}
