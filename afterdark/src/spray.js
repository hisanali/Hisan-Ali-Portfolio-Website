import * as THREE from '/evermile/vendor/three.module.js';

const random = Math.random;
const gravity = 9.81;

export function createTyreSpray(capacity) {
  const particles = Array.from({ length: capacity }, () => ({ time: -1 }));
  const carry = new Float64Array(4);
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.setAttribute('position', plane.attributes.position);
  geometry.setAttribute('uv', plane.attributes.uv);
  function attribute(name, components) {
    const buffer = new Float32Array(capacity * components);
    geometry.setAttribute(name, new THREE.InstancedBufferAttribute(buffer, components).setUsage(THREE.DynamicDrawUsage));
    return buffer;
  }
  const centers = attribute('iCenter', 3);
  const directions = attribute('iDirection', 3);
  const shapes = attribute('iShape', 2);
  const optics = attribute('iOptics', 3);
  geometry.instanceCount = 0;

  const night = { value: 0 };
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uNight: night },
    vertexShader: `
      attribute vec3 iCenter, iDirection, iOptics;
      attribute vec2 iShape;
      varying vec2 vUv;
      varying vec3 vOptics;
      void main() {
        vec4 center = modelViewMatrix * vec4(iCenter, 1.0);
        vec3 motion = mat3(viewMatrix) * iDirection;
        float projected = length(motion.xy);
        vec2 along = projected > 0.02 ? motion.xy / projected : vec2(0.0, 1.0);
        vec2 across = vec2(along.y, -along.x);
        float lengthOnScreen = iShape.x * (0.34 + 0.66 * projected / max(0.1, length(motion)));
        center.xy += across * (position.x * iShape.y) + along * ((position.y - 0.26) * lengthOnScreen);
        vUv = uv;
        vOptics = vec3(iOptics.x, iOptics.y, iOptics.z * (0.49 + 0.51 * projected / max(0.1, length(motion))));
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `
      uniform float uNight;
      varying vec2 vUv;
      varying vec3 vOptics;
      void main() {
        float y = vUv.y;
        float width = mix(0.27, 0.81, smoothstep(0.18, 0.79, y));
        float across = abs(vUv.x * 2.0 - 1.0) / width;
        float rim = 1.0 - smoothstep(0.43, 1.0, across);
        float head = smoothstep(0.46, 0.77, y) * (1.0 - smoothstep(0.88, 1.0, y));
        float tail = pow(y, 1.45) * (1.0 - smoothstep(0.78, 1.0, y));
        vec3 body = mix(vec3(0.30, 0.36, 0.40), vec3(0.12, 0.17, 0.20), uNight);
        vec3 highlight = mix(vec3(0.81, 0.90, 0.94), vec3(0.36, 0.47, 0.55), uNight);
        highlight += vec3(0.30, 0.07, 0.026) * vOptics.y * uNight;
        vec3 color = mix(body, highlight, head * (0.45 + 0.55 * vOptics.z));
        gl_FragColor = vec4(color, rim * (head * 0.67 + tail * 0.46) * vOptics.x);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Tyre water spray';
  mesh.frustumCulled = false;
  mesh.visible = false;
  let next = 0;

  function spawn(x, ground, z, fore, lateral, up, forwardX, forwardZ, slopeX, slopeZ, rewind, scale, warm) {
    const p = particles[next];
    next = (next + 1) % capacity;
    p.x = x; p.z = z; p.ground = ground;
    p.vx = fore * forwardX + lateral * forwardZ;
    p.vz = fore * forwardZ - lateral * forwardX;
    p.vy = up;
    p.slope = p.vx * slopeX + p.vz * slopeZ;
    p.lift = 0.026 + random() * 0.028;
    p.time = rewind;
    p.width = 0.0045 + random() ** 1.28 * 0.014 + scale * 0.0035;
    p.streak = 0.0075 + random() * 0.015;
    p.alpha = 0.33 + random() * 0.30 + scale * 0.16;
    p.specular = random();
    p.warm = warm;
    p.justBorn = true;
  }

  function emit(dt, car, wet, puddleAt) {
    const speed = Math.abs(car.speed);
    if (wet < 0.24 || speed < 3.5 || car.air || car.onSand || car.rough || car.tunnel || car.onKerb) {
      carry.fill(0);
      return;
    }
    const sin = Math.sin(car.heading), cos = Math.cos(car.heading), sign = Math.sign(car.speed);
    const sx = car.slopeF * sin + car.slopeL * cos, sz = car.slopeF * cos - car.slopeL * sin;
    for (const [index, wheel] of car.tyreContacts.entries()) {
      const side = Math.sign(wheel.x), rear = wheel.z * sign < 0;
      const tx = car.pos.x + wheel.x * cos + wheel.z * sin;
      const tz = car.pos.z - wheel.x * sin + wheel.z * cos;
      const ground = car.surfaceY(tx, tz);
      const depth = puddleAt(tx, tz) * wet;
      const rate = Math.min(285, speed * (4.35 + depth * 10.7)) * wet * (rear ? 1 : 0.58);
      const total = carry[index] + rate * dt;
      const count = Math.floor(total);
      for (let i = 0; i < count; i++) {
        const rewind = (total - i - 1) / rate;
        const track = (random() - 0.5) * 0.16;
        const along = -sign * (0.13 + speed * rewind);
        const x = tx + along * sin + track * cos, z = tz + along * cos - track * sin;
        const fore = car.speed * (0.11 + random() * 0.27);
        const sideSpeed = side * (0.42 + random() * (1.35 + depth * 3.25) + speed * 0.016);
        const up = Math.min(3.70, 0.36 + Math.min(1.05, speed * 0.05) + random() * (0.91 + depth * 1.82));
        spawn(x, ground + sx * (x - tx) + sz * (z - tz), z, fore, sideSpeed, up,
          sin, cos, sx, sz, rewind, depth, rear && sign > 0 ? 0.45 : 0);
      }
      carry[index] = total - count;
    }
  }

  function update(dt, dark) {
    night.value = dark;
    let count = 0;
    for (const p of particles) {
      if (p.time < 0) continue;
      if (p.justBorn) p.justBorn = false;
      else p.time += dt;
      const t = p.time, floor = p.ground + p.slope * t;
      const lift = p.lift + (p.vy - p.slope) * t - gravity * t * t * 0.5;
      if (lift <= 0.013) { p.time = -1; continue; }
      const dy = p.vy - gravity * t;
      const set = count * 3;
      centers[set] = p.x + p.vx * t; centers[set + 1] = floor + lift; centers[set + 2] = p.z + p.vz * t;
      directions[set] = p.vx; directions[set + 1] = dy; directions[set + 2] = p.vz;
      shapes[count * 2] = Math.min(0.24, 0.025 + Math.hypot(p.vx, dy, p.vz) * p.streak);
      shapes[count * 2 + 1] = p.width;
      optics[set] = p.alpha * Math.min(1, lift * 38);
      optics[set + 1] = p.warm; optics[set + 2] = p.specular;
      count++;
    }
    geometry.instanceCount = count;
    mesh.visible = count > 0;
    if (count) for (const name of ['iCenter', 'iDirection', 'iShape', 'iOptics']) geometry.attributes[name].needsUpdate = true;
  }

  function clear() {
    for (const p of particles) p.time = -1;
    carry.fill(0);
    geometry.instanceCount = 0;
    mesh.visible = false;
  }

  return { mesh, emit, update, clear };
}
