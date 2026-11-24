import * as THREE from '/evermile/vendor/three.module.js';

const reach = 14, base = -12;

// Record a continuous distance and elevation for the nearest road segment. The landscape
// can then clear the deck and tunnel even where its large triangles span a whole road.
// cell: texel size in metres; range: the height span stored above `base`.
export function roadClearance(samples, cell = 2, range = 290) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const s of samples) {
    x0 = Math.min(x0, s.x - reach); z0 = Math.min(z0, s.z - reach);
    x1 = Math.max(x1, s.x + reach); z1 = Math.max(z1, s.z + reach);
  }
  const width = Math.ceil((x1 - x0) / cell) + 1, height = Math.ceil((z1 - z0) / cell) + 1;
  const distance = new Float32Array(width * height);
  distance.fill(reach * reach);
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels[i] = 255;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    if (a.road !== b.road || b.i !== a.i + 1 || a.bridge && b.bridge) continue;
    const dx = b.x - a.x, dz = b.z - a.z, span = dx * dx + dz * dz;
    const west = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / cell));
    const east = Math.min(width - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / cell));
    const south = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / cell));
    const north = Math.min(height - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / cell));
    for (let z = south; z <= north; z++) for (let x = west; x <= east; x++) {
      const rx = x0 + x * cell - a.x, rz = z0 + z * cell - a.z;
      const t = THREE.MathUtils.clamp((rx * dx + rz * dz) / span, 0, 1);
      const d = (rx - t * dx) ** 2 + (rz - t * dz) ** 2, index = z * width + x;
      if (d >= distance[index]) continue;
      distance[index] = d;
      const h = Math.round((THREE.MathUtils.lerp(a.y, b.y, t) - base) / range * 65535);
      const at = index * 4;
      pixels[at] = Math.round(Math.sqrt(d) / reach * 255);
      pixels[at + 1] = h >> 8;
      pixels[at + 2] = h & 255;
      pixels[at + 3] = a.tunnel || b.tunnel ? 255 : 116;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const sx = 1 / (width * cell), sz = 1 / (height * cell);
  return {
    uniforms: { uRoadCut: { value: texture }, uRoadCutBounds: { value: new THREE.Vector4(x0 - cell / 2, z0 - cell / 2, sx, sz) } },
    glsl: `
uniform sampler2D uRoadCut;
uniform vec4 uRoadCutBounds;
void clearRoad(vec3 p) {
  vec2 uv = (p.xz - uRoadCutBounds.xy) * uRoadCutBounds.zw;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return;
  vec4 road = texture2D(uRoadCut, uv);
  float d = road.r * ${reach.toFixed(1)};
  float y = dot(road.gb, vec2(65280.0, 255.0)) * (${range.toFixed(1)} / 65535.0) + ${base.toFixed(1)};
  if (road.a > 0.60) {
    if (d < 8.25 && p.y < y + 7.85) discard;
  } else if (road.a > 0.18 && d < 5.93 && p.y > y - 0.08) discard;
}
`
  };
}
