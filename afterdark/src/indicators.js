// Turn indicators for every vehicle: amber lamps at the front and rear corners on the side a car is turning to,
// blinking at the usual 1.5 flashes a second. One additive sprite batch draws all of them.
import * as THREE from '/evermile/vendor/three.module.js';

export function createIndicators(scene, max = 160) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const pos = new Float32Array(max * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size: 0.55, map, color: new THREE.Color(1.6, 0.72, 0.08), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 4; scene.add(points);
  let n = 0, lit = true;
  return {
    points,
    // Start a frame at time t (seconds): the lamps are lit for 0.38 s of every 0.7 s.
    begin(t, night = 0) { n = 0; lit = t % 0.7 < 0.38; mat.size = 0.45 + 0.35 * night; },
    // A car at (x, y, z) heading h, of the given width, length and lamp height, signalling 'l' or 'r'.
    add(px, py, pz, h, width, len, side, height = 0.75) {
      if (!lit || !side || n + 2 > max) return;
      const s = side === 'l' ? 1 : -1, fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h) * s, lz = -Math.sin(h) * s, w = width * 0.47; // +x is the driver's left
      for (const along of [len * 0.5 + 0.03, -len * 0.5 - 0.03]) { pos.set([px + fx * along + lx * w, py + height, pz + fz * along + lz * w], n * 3); n++; }
    },
    end() { geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; }
  };
}
