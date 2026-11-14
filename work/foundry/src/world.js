/* The workshop: renderer, a long steel casting table that mirrors what stands on it,
   the lights, the furnace, the dark hall behind, and the lens (bloom, shimmer, tone). */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { fbm, hash2, rng, smooth, lerp } from './util.js';

// Worn steel plate: colour, roughness and metalness (green and blue), and a normal map, all drawn here.
function plateMaps(aniso) {
  const S = 512, rnd = rng(3), R = (a, b) => a + rnd() * (b - a);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const col = mk(), orm = mk(), hgt = mk(), nrm = mk();
  const cx = col.getContext('2d'), ox = orm.getContext('2d'), hx = hgt.getContext('2d'), nx = nrm.getContext('2d');
  const ci = cx.createImageData(S, S), oi = ox.createImageData(S, S), hi = hx.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = i / S, v = j / S, n = fbm(u * 6, v * 6, 5), stain = fbm(u * 3 + 5, v * 3 + 2), fine = hash2(i, j), k = (j * S + i) * 4;
    const rust = smooth(.6, .78, stain), L = 47 + n * 22 + (fine - .5) * 9;
    ci.data[k] = L + rust * 16; ci.data[k + 1] = L + rust * 4; ci.data[k + 2] = L - rust * 6; ci.data[k + 3] = 255;
    oi.data[k] = 255; oi.data[k + 1] = (.48 + n * .17 - smooth(.5, .7, 1 - stain) * .07 + rust * .2) * 255; oi.data[k + 2] = (.92 - rust * .5) * 255; oi.data[k + 3] = 255;
    const h = 120 + n * 70 + (fine - .5) * 16; hi.data[k] = hi.data[k + 1] = hi.data[k + 2] = h; hi.data[k + 3] = 255;
  }
  cx.putImageData(ci, 0, 0); ox.putImageData(oi, 0, 0); hx.putImageData(hi, 0, 0);
  for (let n = 0; n < 170; n++) {               // scratches: brighter, smoother, slightly cut in
    const x0 = R(0, S), y0 = R(0, S), a = R(-.5, .5) + (rnd() < .5 ? 0 : Math.PI / 2), len = R(20, 260), w = R(.5, 1.6), al = R(.08, .32);
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    for (const [g, style] of [[cx, `rgba(200,206,214,${al})`], [ox, `rgba(255,70,250,${al * 1.6})`], [hx, `rgba(40,40,40,${al * 1.4})`]]) { g.strokeStyle = style; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  }
  for (const [g, style, w] of [[cx, 'rgba(8,8,9,.9)', 5], [ox, 'rgba(255,225,120,.9)', 5], [hx, 'rgba(0,0,0,.95)', 6]]) { g.strokeStyle = style; g.lineWidth = w; g.strokeRect(0, 0, S, S); }   // the joint between plates
  for (const [bx, by] of [[40, 40], [S - 40, 40], [40, S - 40], [S - 40, S - 40], [S / 2, 40], [S / 2, S - 40]]) {       // bolt heads
    for (const [g, style, r] of [[cx, 'rgba(96,100,106,1)', 9], [ox, 'rgba(255,95,255,1)', 9], [hx, 'rgba(255,255,255,1)', 9]]) { g.fillStyle = style; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill(); }
    cx.strokeStyle = 'rgba(10,10,11,.8)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(bx, by, 10, 0, 7); cx.stroke();
  }
  const hd = hx.getImageData(0, 0, S, S).data, ni = nx.createImageData(S, S), at = (i, j) => hd[(((j + S) % S) * S + ((i + S) % S)) * 4];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (at(i + 1, j) - at(i - 1, j)) / 255 * 3.2, dy = (at(i, j + 1) - at(i, j - 1)) / 255 * 3.2, l = Math.hypot(dx, dy, 1), k = (j * S + i) * 4;
    ni.data[k] = (-dx / l * .5 + .5) * 255; ni.data[k + 1] = (dy / l * .5 + .5) * 255; ni.data[k + 2] = (1 / l * .5 + .5) * 255; ni.data[k + 3] = 255;
  }
  nx.putImageData(ni, 0, 0);
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(col, true), orm: tex(orm), normal: tex(nrm) };
}

// The hall's back wall: poured concrete, darkened by years of smoke, with faint board lines.
function wallMap() {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), img = x.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const n = fbm(i / W * 7, j / H * 3.5, 5), run = fbm(i / W * 40, j / H * 1.2, 3), k = (j * W + i) * 4;
    const v = 20 + n * 26 + run * 12 - (j % 43 < 1 ? 7 : 0) + (hash2(i, j) - .5) * 5;
    img.data[k] = v + 3; img.data[k + 1] = v + 1; img.data[k + 2] = v; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makeWorld(canvas, { lite }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  const ext = renderer.extensions, floatType = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030304); scene.fog = new THREE.FogExp2(0x030304, .02);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 400);

  /* What the steel reflects: a dark hall with a furnace mouth, a strip of skylight, a window and a lamp. */
  {
    const room = new THREE.Scene(), glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b), side: THREE.DoubleSide });
    room.add(new THREE.Mesh(new THREE.BoxGeometry(44, 22, 44), new THREE.MeshBasicMaterial({ color: 0x040405, side: THREE.BackSide })));
    const panel = (w, h, x, y, z, rx, ry, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(...c)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); room.add(m); };
    panel(7, 4, -17, 2, -5, 0, Math.PI / 2, [26, 9, 2]);
    panel(28, 2.4, 3, 10.4, -1, Math.PI / 2, 0, [5, 7, 10]);
    panel(3.5, 3.5, 19, 5, 9, 0, -Math.PI / 2, [2.2, 3, 4.6]);
    panel(1.4, 1.4, -4, 9, 12, Math.PI / 2, 0, [12, 8, 4]);
    panel(30, 11, 2, 5, 20, 0, Math.PI, [1.5, 1.8, 2.3]);
    panel(10, 8, -20, 6, 10, 0, Math.PI / 2, [2.4, 1.3, .6]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(room, .05).texture; scene.environmentIntensity = 1;
    pmrem.dispose();
  }

  /* The casting table. */
  const maps = plateMaps(renderer.capabilities.getMaxAnisotropy());
  for (const t of [maps.map, maps.orm, maps.normal]) t.repeat.set(150, 15);
  const reflU = { tRefl: { value: null }, uReflMatrix: { value: new THREE.Matrix4() }, uReflK: { value: .62 } };
  const tableMat = new THREE.MeshStandardMaterial({ map: maps.map, roughnessMap: maps.orm, metalnessMap: maps.orm, normalMap: maps.normal, normalScale: new THREE.Vector2(.7, .7), roughness: 1, metalness: 1 });
  tableMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, reflU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix; varying vec4 vRefl;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRefl=uReflMatrix*modelMatrix*vec4(transformed,1.);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRefl; uniform float uReflK; varying vec4 vRefl;')
      .replace('#include <opaque_fragment>', /* glsl */`
        { // what stands on the table, mirrored in it: smeared along the view by the roughness of the plate
          vec2 ruv=vRefl.xy/vRefl.w; vec3 nW=inverseTransformDirection(normal,viewMatrix); ruv+=nW.xz*vec2(.05,.09);
          float spread=.2+roughnessFactor*1.7; vec3 rc=vec3(0.);
          for(int i=0;i<7;i++){ float t=(float(i)+.5)/7.-.5; rc+=texture2D(tRefl,ruv+vec2(t*.01,t*.085)*spread).rgb; }
          float fr=.3+.7*pow(1.-saturate(dot(normal,geometryViewDir)),2.5);
          outgoingLight+=rc/7.*fr*uReflK*(1.15-roughnessFactor*.75); }
        #include <opaque_fragment>`);
  };
  const table = new THREE.Mesh(new THREE.PlaneGeometry(600, 60), tableMat);
  table.rotation.x = -Math.PI / 2; table.position.set(60, 0, 8); table.receiveShadow = true; scene.add(table);

  /* Light. */
  scene.add(new THREE.HemisphereLight(0x5a6c86, 0x120d0a, .3));
  const key = new THREE.SpotLight(0xcfe0ff, 300, 44, .52, .7, 2);
  key.castShadow = true; key.shadow.mapSize.setScalar(lite ? 1024 : 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .025; key.shadow.camera.near = 3; key.shadow.camera.far = 34;
  scene.add(key, key.target);
  const furnaceLight = new THREE.PointLight(0xff7a2a, 260, 70, 2); furnaceLight.position.set(-6.4, 2.2, -4.2); scene.add(furnaceLight);
  const glowA = new THREE.PointLight(0xffffff, 0, 34, 2), glowB = new THREE.PointLight(0xffffff, 0, 34, 2); scene.add(glowA, glowB);

  /* The hall: a brick wall, a row of columns, a crane rail, the furnace, and a few lamps far off. */
  const concrete = wallMap(); concrete.repeat.set(28, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(700, 18), new THREE.MeshStandardMaterial({ map: concrete, bumpMap: concrete, bumpScale: 1.2, roughness: .96, metalness: 0 }));
  wall.position.set(60, 9, -9); scene.add(wall);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: .62, metalness: .7 });
  const columns = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, 16, .55), dark, 16), m4 = new THREE.Matrix4();
  for (let i = 0; i < 16; i++) columns.setMatrixAt(i, m4.makeTranslation(-22 + i * 15, 8, -7.6));
  scene.add(columns);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(700, .7, .7), dark); rail.position.set(60, 11, -6.2); scene.add(rail);
  const furnace = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.4, 3.4), new THREE.MeshStandardMaterial({ color: 0x141211, roughness: .9, metalness: .2 }));
  furnace.position.set(-7.6, 2.7, -6.6); scene.add(furnace);
  const mouthMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(9, 3.1, .65) });
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), mouthMat); mouth.position.set(-7.4, 1.75, -4.88); scene.add(mouth);
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(7, 5, 2.6) }), lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 12, 8), lampMat, 8);
  for (let i = 0; i < 8; i++) lamps.setMatrixAt(i, m4.makeTranslation(-9 + i * 19.5, 7.4 + (i % 2) * .8, -5.4));
  scene.add(lamps);

  /* Lens. */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .42, .5, 1); composer.addPass(bloom);
  let shimmer = null;
  if (!lite) {            // air above hot metal bends the view
    shimmer = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCenter: { value: new THREE.Vector2(.5, .5) }, uSize: { value: new THREE.Vector2(.3, .4) }, uAmt: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: /* glsl */`uniform sampler2D tDiffuse; uniform float uTime,uAmt; uniform vec2 uCenter,uSize; varying vec2 vUv;
        float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
        float n(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y); }
        void main(){ vec2 d=(vUv-uCenter)/uSize; float m=exp(-dot(d,d))*uAmt;
          vec2 q=vUv*vec2(26.,44.)+vec2(0.,-uTime*1.6);
          gl_FragColor=texture2D(tDiffuse,vUv+(vec2(n(q),n(q+19.3))-.5)*.0075*m); }`
    });
    composer.addPass(shimmer);
  }
  composer.addPass(new OutputPass());

  /* The mirror image for the table: the scene seen from below the plate. */
  const reflRT = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  reflU.tRefl.value = reflRT.texture;
  const mirror = new THREE.PerspectiveCamera(), v = new THREE.Vector3(), t = new THREE.Vector3();
  const bias = new THREE.Matrix4().set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
  function renderMirror(hidden) {
    camera.updateMatrixWorld();
    mirror.projectionMatrix.copy(camera.projectionMatrix); mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    v.setFromMatrixPosition(camera.matrixWorld); mirror.position.set(v.x, -v.y, v.z);
    t.set(0, 0, -1).applyQuaternion(camera.quaternion).add(v); t.y = -t.y;
    mirror.up.set(0, 1, 0).applyQuaternion(camera.quaternion); mirror.up.y = -mirror.up.y;
    mirror.lookAt(t); mirror.updateMatrixWorld();
    reflU.uReflMatrix.value.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    table.visible = false; for (const o of hidden) o.visible = false;
    renderer.setRenderTarget(reflRT); renderer.clear(); renderer.render(scene, mirror); renderer.setRenderTarget(null);
    table.visible = true; for (const o of hidden) o.visible = true;
  }

  function resize(w, h, dpr) {
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    const k = lite ? .35 : .5; reflRT.setSize(Math.max(2, Math.round(w * dpr * k)), Math.max(2, Math.round(h * dpr * k)));
    camera.aspect = w / h; camera.fov = lerp(48, 34, smooth(.62, 1.25, camera.aspect)); camera.updateProjectionMatrix();
  }
  function render(dt, t2, hidden = []) {
    mouthMat.color.setRGB(9, 3.1, .65).multiplyScalar(.86 + .14 * Math.sin(t2 * 9) * Math.sin(t2 * 5.3));
    furnaceLight.intensity = 260 * (.9 + .1 * Math.sin(t2 * 7.1) * Math.sin(t2 * 3.7));
    renderer.shadowMap.needsUpdate = true;
    renderMirror(hidden);
    composer.render(dt);
  }
  return { renderer, scene, camera, key, glowA, glowB, shimmer, floatType, resize, render };
}
