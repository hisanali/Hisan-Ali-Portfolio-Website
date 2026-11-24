import * as THREE from '/evermile/vendor/three.module.js';

// Apply the cutoff in the existing spotlight calculation to avoid using extra
// texture units on mobile GPUs. The range tags the player's two headlamps.
export const headlampRange = 85.25;
THREE.ShaderChunk.lights_pars_begin = THREE.ShaderChunk.lights_pars_begin.replace(
  'light.color = spotLight.color * spotAttenuation;',
  `light.color = spotLight.color * spotAttenuation;
   if (spotLight.distance == 85.25) {
     vec3 up = normalize(viewMatrix[1].xyz - spotLight.direction * dot(viewMatrix[1].xyz, spotLight.direction));
     float elevation = dot(-light.direction, up);
     light.color *= 1.0 - smoothstep(0.008, 0.035, elevation);
   }`
);

export function beamTexture() {
  const size = 128, pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    const u = (col + .5) / size, v = (row + .5) / size, x = u * 2 - 1;
    // Projector coordinates face the road. Ground decal UVs run from far to near.
    const d = 1 - v;
    const strength = Math.exp(-3.5 * (x / (.19 + .81 * d)) ** 2) * THREE.MathUtils.smoothstep(d, 0, .13) * (1 - THREE.MathUtils.smoothstep(d, .22, 1)) ** 1.5;
    const i = 4 * (row * size + col);
    pixels.fill(Math.round(255 * Math.max(0, strength) * (1 - THREE.MathUtils.smoothstep(Math.abs(x), .82, 1))), i, i + 3);
    pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function lampColor(style) {
  if (['mercedes', 'van', 'pickup', 'coach'].includes(style)) return 0xffe3bb;
  if (['escalade', 'gr-corolla', 'land-cruiser', 'sports-coupe'].includes(style)) return 0xf0f5ff;
  return 0xfff2da;
}
