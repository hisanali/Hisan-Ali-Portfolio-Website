// Emergency lighting for the modelled police cars. Each car's own LED heads (the roof bar, the grille and push-bar
// lights, the visor and rear-window lights, the mirror and deck lights) are found by material name and lit in a real
// pattern: the roof bar quad-flashes one side then the other with an inside-to-outside chase, the low lights wig-wag
// front against rear. Lit heads glow into the bloom, throw halos and spill red and blue light onto the road; the caller
// adds the moving point lights. Red is on the driver's side (+x), blue on the passenger's.
import * as THREE from '/evermile/vendor/three.module.js';

export const EMERGENCY = /^Emergency_(Glow|Lamp)_(Red|Blue)/i;
const RED = new THREE.Color(1, 0.06, 0.08), BLUE = new THREE.Color(0.1, 0.3, 1);

let shared = null;
function sharedParts() {
  if (shared) return shared;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const glow = new THREE.CanvasTexture(c); glow.colorSpace = THREE.SRGBColorSpace;
  shared = { glow, lit: new Map(), flare: new THREE.PointsMaterial({ size: 1.4, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }) };
  return shared;
}
// A lit head: additive, so only the LEDs of a lens's emissive map show over the lens, and drawn just in front of it.
function litMaterial(colour, map) {
  const S = sharedParts(), key = colour + ':' + (map ? map.uuid : '-');
  if (!S.lit.has(key)) { const m = new THREE.MeshBasicMaterial({ color: (colour === 'red' ? RED : BLUE).clone(), map: map || null, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.base = colour === 'red' ? RED : BLUE; S.lit.set(key, m); }
  return S.lit.get(key);
}

// parts: [{ geo, local: Matrix4 in the car's space, name: material name, map: the lens's emissive map or null }]
export function createEmergencyLights(parts, height, seed = 0) {
  const S = sharedParts(), group = new THREE.Group(), heads = [], box = new THREE.Box3(), centre = new THREE.Vector3();
  let reach = 0.01;
  for (const p of parts) {
    const [, , c] = p.name.match(EMERGENCY), colour = c.toLowerCase();
    if (!p.geo.boundingBox) p.geo.computeBoundingBox();
    box.copy(p.geo.boundingBox).applyMatrix4(p.local); box.getCenter(centre);
    const mesh = new THREE.Mesh(p.geo, litMaterial(colour, p.map)); mesh.matrixAutoUpdate = false; mesh.matrix.copy(p.local); mesh.visible = false; mesh.renderOrder = 4; group.add(mesh);
    const roof = centre.y > height * 0.92;
    heads.push({ mesh, colour, side: centre.x >= 0 ? 1 : -1, x: Math.abs(centre.x), roof, front: centre.z > 0, pos: centre.clone() });
    if (roof) reach = Math.max(reach, Math.abs(centre.x));
  }
  for (const h of heads) h.rank = h.roof ? Math.min(3, Math.floor(h.x / reach * 3.999)) : 0;
  // halos: one sprite per head, coloured each frame
  const fp = new Float32Array(heads.length * 3), fc = new Float32Array(heads.length * 3);
  heads.forEach((h, i) => fp.set([h.pos.x, h.pos.y, h.pos.z], i * 3));
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('color', new THREE.BufferAttribute(fc, 3));
  const flares = new THREE.Points(fg, S.flare); flares.frustumCulled = false; group.add(flares);
  // light thrown onto the road on each side of the car
  const spill = [-1, 1].map(side => { const m = new THREE.Mesh(new THREE.PlaneGeometry(11, 13), new THREE.MeshBasicMaterial({ map: S.glow, color: side > 0 ? RED : BLUE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.material.polygonOffset = true; m.material.polygonOffsetFactor = -6; m.material.polygonOffsetUnits = -6;
    m.rotation.x = -Math.PI / 2; m.position.set(side * 2.2, 0.025, 0); m.renderOrder = 2; group.add(m); return m; });

  const phase = seed * 0.37, col = new THREE.Color();
  function level(h, t) {
    const u = t + phase;
    if (h.roof) { // four quick flashes on one side, then the other, chasing from the middle outwards
      const local = u % 1.25 - (h.side < 0 ? 0 : 0.625) - h.rank * 0.022;
      return local >= 0 && local <= 0.44 && local % 0.11 < 0.065 ? 1 : 0;
    }
    // low lights: a double-pulse wig-wag, left against right, the rear half a beat behind the front
    const w = (u + (h.front ? 0 : 0.25)) % 0.5, mine = h.side < 0 ? w < 0.25 : w >= 0.25, k = w % 0.25;
    return mine && (k < 0.06 || (k > 0.1 && k < 0.16)) ? 1 : 0;
  }
  return {
    group,
    // Returns how brightly each side is lit, [left (passenger, -x), right (driver, +x)], for the caller's lights.
    update(t, night = 0, on = true) {
      let left = 0, right = 0; const glow = 0.5 + 0.5 * night, hot = 2.2 + 2.6 * night;
      for (const m of S.lit.values()) m.color.copy(m.userData.base).multiplyScalar(hot);
      heads.forEach((h, i) => { const k = on ? level(h, t) : 0; h.mesh.visible = k > 0;
        col.copy(h.colour === 'red' ? RED : BLUE).multiplyScalar(k * glow * (h.roof ? 1 : 0.7)); fc.set([col.r, col.g, col.b], i * 3);
        if (k) { if (h.side < 0) left = Math.max(left, h.roof ? 1 : 0.6); else right = Math.max(right, h.roof ? 1 : 0.6); } });
      fg.attributes.color.needsUpdate = true;
      S.flare.size = 1.1 + 1.5 * night;
      spill[0].material.opacity = left * (0.06 + 0.5 * night); spill[1].material.opacity = right * (0.06 + 0.5 * night);
      group.visible = on;
      return [left, right];
    }
  };
}
