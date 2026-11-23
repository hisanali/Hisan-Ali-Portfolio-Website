import * as THREE from '/evermile/vendor/three.module.js';

const SEA_LEVEL = -0.62;
const DEPTH_RANGE = 8;

function seaGeometry(promenade, center, length) {
  const positions = [], indices = [];
  const x0 = promenade - 124, x1 = promenade - 40;
  const z0 = center - length / 2, z1 = center + length / 2;
  const edge = 8000;
  function patch(west, east, south, north, columns = 1, rows = 1) {
    const start = positions.length / 3;
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      positions.push(THREE.MathUtils.lerp(west, east, col / columns), 0, THREE.MathUtils.lerp(south, north, row / rows));
      if (col < columns && row < rows) {
        const v = start + row * (columns + 1) + col, next = v + columns + 1;
        indices.push(v, next, v + 1, v + 1, next, next + 1);
      }
    }
  }
  patch(center - edge, x0, center - edge, center + edge);
  patch(x1, center + edge, center - edge, center + edge);
  patch(x0, x1, center - edge, z0);
  patch(x0, x1, z1, center + edge);
  patch(x0, x1, z0, z1, 56, Math.ceil(length / 2.4));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildSea(scene, promenade, center, beachLength) {
  const bounds = { value: new THREE.Vector4() };
  const bathymetry = { value: new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat) };
  bathymetry.value.needsUpdate = true;
  const time = { value: 0 }, weather = { value: 0 }, night = { value: 0 };
  const beach = { value: new THREE.Vector3(promenade, center - beachLength / 2, center + beachLength / 2) };
  const darkWater = new THREE.Color(0x081623);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x164755, roughness: 0.26, metalness: 0.04, envMapIntensity: 0.72, specularIntensity: 0.69
  });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, { oceanTime: time, oceanWeather: weather, oceanNight: night, oceanBounds: bounds,
      oceanDepth: bathymetry, oceanBeach: beach });
    shader.vertexShader = 'varying vec2 oceanWorld; varying float oceanElevation; uniform vec3 oceanBeach; uniform float oceanTime, oceanWeather;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  oceanWorld = (modelMatrix * vec4(transformed, 1.0)).xz;
  float west = oceanBeach.x - oceanWorld.x;
  float band = smoothstep(40.0, 53.0, west) * (1.0 - smoothstep(107.0, 124.0, west));
  band *= smoothstep(0.0, 34.0, oceanWorld.y - oceanBeach.y) * smoothstep(0.0, 34.0, oceanBeach.z - oceanWorld.y);
  float runup = oceanWorld.x * 0.81 + oceanWorld.y * 0.073 - oceanTime * 2.24
               + sin(oceanWorld.y * 0.10) * 1.5 + sin(oceanWorld.y * 0.28) * 0.62;
  float swell = sin(dot(oceanWorld, vec2(0.42, -0.14)) - oceanTime * 1.45);
  oceanElevation = band * (0.075 * swell + 0.145 * sin(runup)) * (1.0 + 0.46 * oceanWeather);
  transformed.y += oceanElevation;
`);
    const declarations = `
varying vec2 oceanWorld;
varying float oceanElevation;
uniform float oceanTime, oceanWeather, oceanNight;
uniform vec4 oceanBounds;
uniform vec3 oceanBeach;
uniform sampler2D oceanDepth;

float oceanHash(vec2 p) {
  vec3 v = fract(vec3(p.xyx) * 0.1031);
  v += dot(v, v.yzx + 33.33);
  return fract((v.x + v.y) * v.z);
}
float oceanNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(oceanHash(i), oceanHash(i + vec2(1, 0)), f.x),
             mix(oceanHash(i + vec2(0, 1)), oceanHash(i + 1.0), f.x), f.y);
}
float swell(vec2 p, vec2 heading, float frequency, float speed, float bend) {
  return dot(p, heading) * frequency - oceanTime * speed + bend;
}
`;
    shader.fragmentShader = declarations + shader.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec2 p = oceanWorld;
  vec2 t = (p - oceanBounds.xy) * oceanBounds.zw;
  float depth = ${DEPTH_RANGE.toFixed(1)};
  if (all(greaterThanEqual(t, vec2(0.0))) && all(lessThanEqual(t, vec2(1.0)))) {
    depth = texture2D(oceanDepth, t).r * ${DEPTH_RANGE.toFixed(1)} - 0.5;
  }
  if (p.y > oceanBeach.y && p.y < oceanBeach.z && p.x > oceanBeach.x - 92.0) {
    float b = clamp((oceanBeach.x - p.x) / 92.0, 0.0, 1.0);
    depth = min(depth, (1.5 * b * b - 0.79));
  }
  depth += oceanElevation;
  float shore = clamp(depth, 0.0, 3.0);
  float detail = 1.0 - smoothstep(0.45, 2.4, max(fwidth(p.x), fwidth(p.y)));
  float shoreWarp = oceanNoise(p * vec2(0.15, 0.085) + vec2(-oceanTime * 0.14, 0.0));
  float broken = oceanNoise(p * vec2(0.47, 0.62) + vec2(-oceanTime * 0.31, oceanTime * 0.16)) * 2.0 - 1.0;
  float warp = (shoreWarp - 0.5) * 3.4 + sin(p.y * 0.31 + oceanTime * 0.59) * 0.39;
  float pulse = cos(shore * 43.5 + oceanTime * (1.45 + 0.5 * oceanWeather) + warp);
  float crest = smoothstep(0.37, 0.94, pulse) * (0.21 + 0.79 * smoothstep(-0.21, 0.48, broken + (shoreWarp - 0.5) * 0.75));
  float surf = 1.0 - smoothstep(0.06, 1.1, depth);
  float rime = (1.0 - smoothstep(0.009, 0.103 + 0.045 * sin(p.y * 0.5 + oceanTime), depth))
    * smoothstep(-0.85, 0.6, broken + 0.38 * sin(p.y * 3.2 - oceanTime));
  float foam = detail * max(crest * surf * 0.72, rime * 0.67);
  vec3 shallows = mix(vec3(0.22, 0.278, 0.188), vec3(0.031, 0.157, 0.125), smoothstep(0.0, 0.62, depth));
  vec3 water = mix(shallows, diffuseColor.rgb, smoothstep(0.13, 2.6, depth));
  float tidePattern = sin(p.x * 0.066 + p.y * 0.071 - oceanTime * 0.29) * sin(p.y * 0.11 + p.x * 0.031);
  water *= 1.0 + tidePattern * 0.13 * (1.0 - oceanNight * 0.48);
  diffuseColor.rgb = mix(water, vec3(0.58, 0.64, 0.60), foam);
`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp(0.175 + oceanWeather * 0.12 + foam * 0.38 + (1.0 - detail) * 0.08, 0.0, 1.0);
`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  float bend = (shoreWarp - 0.5) * 1.8 + sin(p.x * 0.12 + p.y * 0.08) * 0.45;
  vec2 a = normalize(vec2(1.0, 0.23)), b = normalize(vec2(-0.38, 1.0));
  vec2 c = normalize(vec2(0.68, -0.73)), d = normalize(vec2(0.94, 0.38));
  vec2 gradient = a * cos(swell(p, a, 0.57, 1.75, bend)) * 0.115
                + b * cos(swell(p, b, 0.94, 2.22, bend)) * 0.083
                + c * cos(swell(p, c, 1.47, 2.57, bend)) * 0.054;
  vec2 chop = d * cos(swell(p, d, 5.2, 3.95, bend)) * 0.095
            + b * cos(swell(p, b, 6.9, 4.21, bend * 2.0)) * 0.073
            + c * cos(swell(p, c, 11.5, 5.12, bend * 2.0)) * 0.05;
  gradient = gradient * (1.0 + 0.54 * oceanWeather) + chop * detail * (0.70 + oceanWeather * 0.62);
  gradient += vec2(1.0, -0.08) * pulse * surf * detail * (0.06 + 0.13 * shoreWarp);
  normal = normalize(mat3(viewMatrix) * vec3(-gradient.x, 1.0, -gradient.y));
`);
  };
  const sea = new THREE.Mesh(seaGeometry(promenade, center, beachLength), material);
  sea.name = 'Coastal water';
  sea.position.y = SEA_LEVEL;
  scene.add(sea);
  return {
    setTerrain(world, width, height, heights) {
      const data = Uint8Array.from(heights, h => Math.round(THREE.MathUtils.clamp((SEA_LEVEL - h + 0.5) / DEPTH_RANGE, 0, 1) * 255));
      const texture = new THREE.DataTexture(data, width, height, THREE.RedFormat);
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      bathymetry.value.dispose();
      bathymetry.value = texture;
      bounds.value.set(world.x0, world.z0, 1 / (world.x1 - world.x0), 1 / (world.z1 - world.z0));
    },
    update(t) { time.value = t; },
    setTime(env) {
      night.value = env.night;
      weather.value = env.rain;
      material.color.setHex(0x164755).lerp(darkWater, env.night);
      material.envMapIntensity = 0.71 - env.night * 0.32;
    }
  };
}

/** Match the darker saturated sand to the lowest part of the beach profile. */
export function wetSand(material) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 beachPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nbeachPos = position.xz;');
    shader.fragmentShader = 'varying vec2 beachPos;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  float breakLine = -13.8 + sin(beachPos.y * 0.31) * 0.8 + sin(beachPos.y * 0.071) * 1.2;
  float soaked = 1.0 - smoothstep(-3.5, 6.8, beachPos.x - breakLine);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.53, 0.57, 0.61), soaked);
`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.93, 0.70, soaked);');
  };
}
