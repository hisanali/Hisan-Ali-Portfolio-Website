// Weathering for flat-coloured instanced solids (harbour sheds, containers, towers, frontier houses): world-space grime,
// darker bases, rain streaks down walls, panel seams, and corrugated ribs on shipping containers, so they read as
// built things rather than painted blocks.
import * as THREE from '/evermile/vendor/three.module.js';

let grime = null;
const grimeTexture = () => { if (grime) return grime; grime = new THREE.TextureLoader().load('/eight-worlds/assets/tex/rock23_d.jpg'); grime.wrapS = grime.wrapT = THREE.RepeatWrapping; grime.anisotropy = 4; return grime; };

export const NO_TILE_GLSL = `
float wtH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float wtN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wtH(i), wtH(i + vec2(1, 0)), f.x), mix(wtH(i + vec2(0, 1)), wtH(i + vec2(1, 1)), f.x), f.y); }
// One texture read twice with offsets that change smoothly across the ground, so its repeat never lines up.
vec4 noTile(sampler2D s, vec2 uv) {
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  float l = wtN(uv * 0.13) * 8.0, f = fract(l), ia = floor(l);
  vec4 a = textureGrad(s, uv + sin(vec2(3.0, 7.0) * ia), dx, dy), b = textureGrad(s, uv + sin(vec2(3.0, 7.0) * (ia + 1.0)), dx, dy);
  return mix(a, b, smoothstep(0.2, 0.8, f - 0.1 * dot(a - b, vec4(1.0))));
}
`;

export function weather(material, { streaks = 1, seams = 1, containers = false } = {}) {
  const prev = material.onBeforeCompile, key = 'weathered-' + streaks + seams + containers;
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    sh.uniforms.wtGrime = { value: grimeTexture() };
    sh.vertexShader = 'varying vec3 wtP; varying vec3 wtNrm; varying vec3 wtScale;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec4 p = vec4(transformed, 1.0); vec3 n = objectNormal; wtScale = vec3(1.0);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n; wtScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  #endif
    wtP = (modelMatrix * p).xyz; wtNrm = normalize(mat3(modelMatrix) * n); }`);
    sh.fragmentShader = 'uniform sampler2D wtGrime; varying vec3 wtP; varying vec3 wtNrm; varying vec3 wtScale;\n' + NO_TILE_GLSL + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  vec3 wtB = pow(abs(normalize(wtNrm)), vec3(4.0)); wtB /= dot(wtB, vec3(1.0));
  float wtG = noTile(wtGrime, wtP.zy * 0.16).r * wtB.x + noTile(wtGrime, wtP.xz * 0.16).r * wtB.y + noTile(wtGrime, wtP.xy * 0.16).r * wtB.z;
  float wtBig = wtN(wtP.xz * 0.045 + wtP.y * 0.03);
  diffuseColor.rgb *= mix(0.68, 1.18, smoothstep(0.25, 0.75, wtG)) * mix(0.86, 1.06, wtBig);
  float wtWall = 1.0 - wtB.y, wtAlong = wtB.x > wtB.z ? wtP.z : wtP.x;
  float wtStreak = wtN(vec2(wtAlong * 2.7, wtP.y * 0.09)) * wtN(vec2(wtAlong * 0.9 + 3.0, wtP.y * 0.04));
  diffuseColor.rgb *= 1.0 - ${streaks.toFixed(2)} * wtWall * smoothstep(0.25, 0.6, wtStreak) * 0.3;
  diffuseColor.rgb *= 1.0 - ${seams.toFixed(2)} * 0.2 * wtWall * smoothstep(0.475, 0.492, abs(fract(wtAlong / 3.1) - 0.5));
  float wtCont = ${containers ? '1.0' : '0.0'} * step(abs(wtScale.y - 2.6), 0.08) * step(abs(wtScale.z - 2.44), 0.12);
  diffuseColor.rgb *= 1.0 - wtCont * 0.1 * (0.5 + 0.5 * sin(wtAlong * 25.1));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor + (0.5 - wtG) * 0.25, 0.05, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec3 wtB2 = pow(abs(normalize(wtNrm)), vec3(4.0)); wtB2 /= dot(wtB2, vec3(1.0)); float wall = 1.0 - wtB2.y, along = wtB2.x > wtB2.z ? wtP.z : wtP.x;
    float cont = ${containers ? '1.0' : '0.0'} * step(abs(wtScale.y - 2.6), 0.08) * step(abs(wtScale.z - 2.44), 0.12);
    vec3 side = wtB2.x > wtB2.z ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    float rib = cos(along * 25.1) * 0.55 * cont * wall * (1.0 - smoothstep(25.0, 90.0, length(cameraPosition - wtP)));
    normal = normalize(normal + (viewMatrix * vec4(side * rib, 0.0)).xyz); }`);
  };
  const prevKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => (prevKey ? prevKey() : '') + key;
  return material;
}
