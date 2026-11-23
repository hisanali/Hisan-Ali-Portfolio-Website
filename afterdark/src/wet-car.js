import * as THREE from '/evermile/vendor/three.module.js';

let beadMap;
function waterBeads() {
  if (beadMap) return beadMap;
  const size = 128, pixels = new Uint8Array(size * size);
  let seed = 234021;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 105; i++) {
    const x = random() * size, y = random() * size;
    const rx = 1.0 + random() ** 2 * 3.1;
    const ry = rx * (0.82 + random() * 0.45) * (i % 11 === 0 ? 2.9 : 1);
    const height = 85 + random() * 158;
    for (let row = Math.floor(y - ry); row <= y + ry; row++) {
      for (let col = Math.floor(x - rx); col <= x + rx; col++) {
        const d = ((col - x) / rx) ** 2 + ((row - y) / ry) ** 2;
        if (d >= 1) continue;
        const at = (row & (size - 1)) * size + (col & (size - 1));
        pixels[at] = Math.max(pixels[at], Math.round(height * (1 - d) ** 1.25));
      }
    }
  }
  beadMap = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  beadMap.wrapS = beadMap.wrapT = THREE.RepeatWrapping;
  beadMap.magFilter = THREE.LinearFilter;
  beadMap.minFilter = THREE.LinearMipmapLinearFilter;
  beadMap.generateMipmaps = true;
  beadMap.needsUpdate = true;
  return beadMap;
}

export function wetCar(root, ...materials) {
  const wet = { value: 0 }, body = { value: new THREE.Matrix4() }, map = { value: waterBeads() };
  for (const material of materials) {
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, { uSurfaceRain: wet, uCarBody: body, uWaterBeads: map });
      shader.vertexShader = `uniform mat4 uCarBody;
varying vec3 vWetBody, vWetNormal;
` + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  mat4 wetLocal = uCarBody * modelMatrix;
  vWetBody = (wetLocal * vec4(transformed, 1.0)).xyz;
  vWetNormal = mat3(wetLocal) * normal;
`);
      shader.fragmentShader = `uniform float uSurfaceRain;
uniform sampler2D uWaterBeads;
varying vec3 vWetBody, vWetNormal;
vec3 waterNormal(vec3 n, vec3 p, vec2 slope) {
  vec3 a = cross(dFdy(p), n), b = cross(n, dFdx(p));
  float d = dot(dFdx(p), a);
  if (abs(d) < 1e-9) return n;
  return normalize(n * abs(d) - sign(d) * (slope.x * a + slope.y * b));
}
` + shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  vec3 wetAxis = normalize(vWetNormal);
  vec3 wetWeight = pow(abs(wetAxis), vec3(7.0));
  wetWeight /= max(0.01, wetWeight.x + wetWeight.y + wetWeight.z);
  vec3 wp = vWetBody * 2.75;
  float collected = smoothstep(-0.34, 0.68, wetAxis.y);
  float topBeads = texture2D(uWaterBeads, wp.xz).r;
  float sideBeads = texture2D(uWaterBeads, wp.zy * vec2(1.0, 0.66)).r * wetWeight.x
                  + texture2D(uWaterBeads, wp.xy * vec2(1.0, 0.66)).r * wetWeight.z;
  float bead = (topBeads * wetWeight.y * (0.18 + 0.82 * collected) + sideBeads * 0.68) * uSurfaceRain;
  float film = uSurfaceRain * (0.48 + collected * 0.40);
  diffuseColor.rgb *= 1.0 - film * 0.14 - bead * 0.075;
  roughnessFactor = max(0.055, mix(roughnessFactor, roughnessFactor * 0.56 + 0.016, film) + bead * 0.06);
`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  vec2 beadSlope = vec2(dFdx(bead), dFdy(bead)) * 0.00072;
  normal = waterNormal(normal, -vViewPosition, beadSlope * 0.64);
`)
        .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
  #ifdef USE_CLEARCOAT
    clearcoatNormal = waterNormal(clearcoatNormal, -vViewPosition, beadSlope);
  #endif
`);
    };
  }
  return (dt, rain) => {
    wet.value = THREE.MathUtils.lerp(wet.value, rain, -Math.expm1(-dt * (rain > wet.value ? 0.92 : 0.16)));
    root.updateWorldMatrix(true, false);
    body.value.copy(root.matrixWorld).invert();
    return wet.value;
  };
}
