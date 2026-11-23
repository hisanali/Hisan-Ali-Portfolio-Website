import * as THREE from '/evermile/vendor/three.module.js';

const random = Math.random;

export function createTyreSpray(capacity) {
  const pos = new Float32Array(capacity * 3), shape = new Float32Array(capacity * 2);
  const appearance = new Float32Array(capacity * 3);
  const particles = Array.from({ length: capacity }, () => ({ left: 0 }));
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.setAttribute('position', plane.attributes.position);
  geometry.setAttribute('uv', plane.attributes.uv);
  geometry.setAttribute('iCenter', new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('iShape', new THREE.InstancedBufferAttribute(shape, 2).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('iAppearance', new THREE.InstancedBufferAttribute(appearance, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.instanceCount = 0;
  const night = { value: 0 };
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uNight: night },
    vertexShader: `
      attribute vec3 iCenter;
      attribute vec2 iShape;
      attribute vec3 iAppearance;
      varying vec2 vUv;
      varying vec3 vAppearance;
      void main() {
        vec4 center = modelViewMatrix * vec4(iCenter, 1.0);
        float twist = sin(iAppearance.y * 1.7) * 0.33;
        float c = cos(twist), s = sin(twist);
        vec2 offset = mat2(c, s, -s, c) * (position.xy * iShape);
        center.xy += offset;
        vUv = uv;
        vAppearance = vec3(iAppearance.xy, iAppearance.z + dot(viewMatrix[1].xy, offset));
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `
      uniform float uNight;
      varying vec2 vUv;
      varying vec3 vAppearance;
      float hash(vec2 p) {
        vec3 h = fract(vec3(p.xyx) * 0.1031);
        h += dot(h, h.yzx + 33.33);
        return fract((h.x + h.y) * h.z);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
      }
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float edge = max(0.0, 1.0 - dot(p, p));
        float seed = vAppearance.y;
        float wisps = 0.46 + 0.39 * noise(p * 3.3 + seed) + 0.15 * noise(p * 9.0 - seed);
        vec3 color = mix(vec3(0.53, 0.56, 0.58), vec3(0.17, 0.19, 0.21), uNight);
        float contact = smoothstep(0.005, 0.15, vAppearance.z);
        gl_FragColor = vec4(color, edge * edge * wisps * vAppearance.x * contact);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Tyre water mist';
  mesh.frustumCulled = false;
  mesh.visible = false;
  let next = 0, carry = 0;

  function spawn(car, side, speed, wet) {
    const p = particles[next];
    next = (next + 1) % capacity;
    const x = Math.sin(car.heading), z = Math.cos(car.heading), sign = Math.sign(car.speed);
    const back = -sign * car.len * 0.32;
    const track = side * car.wid * (0.38 + random() * 0.075);
    p.x = car.pos.x + x * back + z * track;
    p.z = car.pos.z + z * back - x * track;
    p.roadY = car.groundY;
    p.y = p.roadY + 0.10 + random() * 0.10;
    const lateral = side * (random() * 1.55 - 0.45);
    const forward = car.speed * (0.09 + random() * 0.20);
    p.vx = x * forward + z * lateral;
    p.vz = z * forward - x * lateral;
    p.rise = 0.10 + Math.min(0.42, speed * 0.008) * random();
    p.life = p.left = 0.18 + random() * 0.25;
    p.width = 0.36 + random() * 0.40;
    p.height = 0.19 + random() * 0.16;
    p.opacity = (0.20 + wet * 0.16) * Math.min(1, speed / 15);
    p.seed = random() * 30;
  }

  function emit(dt, car, wet) {
    const speed = Math.abs(car.speed);
    if (wet < 0.24 || speed < 3.5 || car.air || car.onSand || car.rough || car.tunnel) {
      carry = 0;
      return;
    }
    carry += Math.min(105, (speed - 2.6) * 3.7) * wet * dt;
    const pairs = Math.floor(carry);
    carry -= pairs;
    for (let i = 0; i < pairs; i++) for (const side of [-1, 1]) spawn(car, side, speed, wet);
  }

  function update(dt, dark) {
    night.value = dark;
    let count = 0;
    for (const p of particles) {
      if (p.left <= 0) continue;
      p.left -= dt;
      if (p.left <= 0) continue;
      const age = 1 - p.left / p.life;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y += p.rise * p.left / p.life * dt;
      const center = count * 3, size = count * 2;
      pos[center] = p.x; pos[center + 1] = p.y; pos[center + 2] = p.z;
      shape[size] = p.width + age * 0.78; shape[size + 1] = p.height + age * 0.31;
      appearance[center] = p.opacity * (1 - age) * Math.min(1, 0.38 + age * 5.5);
      appearance[center + 1] = p.seed; appearance[center + 2] = p.y - p.roadY;
      count++;
    }
    geometry.instanceCount = count;
    mesh.visible = count > 0;
    if (count) for (const name of ['iCenter', 'iShape', 'iAppearance']) geometry.attributes[name].needsUpdate = true;
  }

  function clear() {
    for (const p of particles) p.left = 0;
    carry = 0;
    geometry.instanceCount = 0;
    mesh.visible = false;
  }

  return { mesh, emit, update, clear };
}
