/* The names: letters extruded from the site's own display face, made of steel that
   holds heat. Each piece carries a small heat map that touches write into. */
import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { clamp } from './util.js';

export async function loadFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('font not found: ' + url);
  return new Font(new TTFLoader().parse(await res.arrayBuffer()));
}

const PARS = /* glsl */`
  uniform sampler2D uMask, uHeat;
  uniform vec4 uBox, uHot;
  uniform float uBaseT;
  varying vec3 vLocal;
  float fHash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float fNoise3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(fHash(i),fHash(i+vec3(1.,0.,0.)),f.x),mix(fHash(i+vec3(0.,1.,0.)),fHash(i+vec3(1.,1.,0.)),f.x),f.y),
               mix(mix(fHash(i+vec3(0.,0.,1.)),fHash(i+vec3(1.,0.,1.)),f.x),mix(fHash(i+vec3(0.,1.,1.)),fHash(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
  // glow of steel by temperature in Celsius: nothing below about 480, white near 1300
  vec3 fBlackbody(float T){ float x=clamp((T-480.)/820.,0.,1.);
    vec3 c=mix(vec3(.55,.02,0.),vec3(1.,.16,.01),smoothstep(0.,.3,x));
    c=mix(c,vec3(1.,.42,.06),smoothstep(.25,.55,x));
    c=mix(c,vec3(1.,.72,.3),smoothstep(.5,.8,x));
    c=mix(c,vec3(1.,.93,.78),smoothstep(.78,1.,x));
    return c*(pow(x,2.2)*3.1+x*.55); }
  // oxide colours that appear on clean steel as it is warmed: straw, brown, purple, blue, grey
  vec3 fTemper(float T){ vec3 c=vec3(1.);
    c=mix(c,vec3(.95,.78,.38),smoothstep(190.,230.,T));
    c=mix(c,vec3(.62,.36,.3),smoothstep(235.,262.,T));
    c=mix(c,vec3(.48,.27,.55),smoothstep(262.,282.,T));
    c=mix(c,vec3(.22,.33,.78),smoothstep(282.,305.,T));
    c=mix(c,vec3(.42,.55,.68),smoothstep(310.,345.,T));
    return mix(c,vec3(.5),smoothstep(350.,420.,T)); }
  vec3 fPerturb(vec3 pos, vec3 nrm, vec2 dh){ vec3 sx=normalize(dFdx(pos)), sy=normalize(dFdy(pos));
    vec3 r1=cross(sy,nrm), r2=cross(nrm,sx); float det=dot(sx,r1);
    return normalize(abs(det)*nrm-sign(det)*(dh.x*r1+dh.y*r2)); }`;
const SURFACE = /* glsl */`
  vec2 fUv=(vLocal.xy-uBox.xy)/uBox.zw;
  float fCore=smoothstep(.16,.8,texture2D(uMask,fUv).g);          // thick cores hold heat, edges and hairlines lose it
  float fTouch=texture2D(uHeat,fUv).r;
  vec3 fP=mat3(.36,.48,-.8,-.8,.6,0.,.48,.64,.6)*vLocal;
  float fN1=fNoise3(fP*2.3), fN2=.6*fNoise3(fP*13.+7.3)+.4*fNoise3(fP.zxy*31.+2.1), fN3=.5*fNoise3(vLocal*vec3(1.2,46.,46.))+.5*fNoise3(vLocal*vec3(3.1,120.,120.)+4.);
  float fT=25.+(uBaseT-25.)*(.7+.3*fCore)*(.955+.09*fN1)+fTouch*1150.;
  fT=max(fT,uHot.w*smoothstep(uHot.z,uHot.z*.35,length((fUv-uHot.xy)*vec2(uBox.z/uBox.w,1.))));
  fT=min(fT,1340.);
  float fScale=smoothstep(360.,600.,fT);                            // black oxide scale on metal that has been hot
  float fFlake=smoothstep(.5,.72,fN2)*fScale*(1.-smoothstep(880.,1060.,fT));
  diffuseColor.rgb=mix(diffuseColor.rgb*fTemper(fT)*(.94+.12*fN3),vec3(.04,.036,.034),fScale);
  roughnessFactor=mix(.34+.2*fN3,.82+.12*fN2,fScale);
  metalnessFactor=mix(.88,1.,fScale);
  float fHgt=mix(fN3*.012,fN2*.05+fFlake*.08,fScale);`;
const NORMAL = `normal=fPerturb(-vViewPosition,normal,vec2(dFdx(fHgt),dFdy(fHgt))*5.);`;
const EMIT = `totalEmissiveRadiance+=fBlackbody(fT)*max(.84+.16*fN1-.3*fFlake,.2);`;

function steel(uniforms) {
  const m = new THREE.MeshStandardMaterial({ color: 0x9a9da2, metalness: 1, roughness: .4 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal=position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + PARS)
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + SURFACE)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + NORMAL)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + EMIT);
  };
  m.customProgramCacheKey = () => 'foundry-steel';
  return m;
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), n = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * w + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { tmp[y * w + x] = s / n; s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  return out;
}

/* One name. `lines` is an array of strings, stacked top to bottom. */
export function makePiece(font, lines, { size = 1.6, depth = .55, floatType, hotLast = false } = {}) {
  const group = new THREE.Group(), bevel = .022, parts = [], gap = size * .34;
  const box = new THREE.Box3();
  lines.forEach((text, li) => {
    const shapes = font.generateShapes(text, size);
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: .03, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 });
    geo.computeBoundingBox();
    const b = geo.boundingBox, dx = -(b.min.x + b.max.x) / 2, dy = (lines.length - 1 - li) * (size * 1.02 + gap) + bevel, dz = -depth / 2;
    geo.translate(dx, dy, dz); geo.computeBoundingBox(); box.union(geo.boundingBox);
    parts.push({ geo, shapes, dx, dy });
  });
  const min = box.min, sz = box.getSize(new THREE.Vector3());

  // Letter shapes drawn flat: red is inside the metal, green is how deep inside (used for edge cooling).
  const W = 512, H = Math.max(48, Math.round(W * sz.y / sz.x)), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), px = v => (v.x - min.x) / sz.x * W, py = v => (1 - (v.y - min.y) / sz.y) * H;
  x.fillStyle = '#fff';
  let hot = null;
  for (const part of parts) {
    part.shapes.forEach((shape, si) => {
      x.beginPath();
      const loops = [shape.getPoints(10), ...shape.holes.map(hole => hole.getPoints(10))];
      for (const loop of loops) { loop.forEach((p, k) => { const q = { x: p.x + part.dx, y: p.y + part.dy }; k ? x.lineTo(px(q), py(q)) : x.moveTo(px(q), py(q)); }); x.closePath(); }
      x.fill('evenodd');
      if (hotLast && part === parts[parts.length - 1] && si === part.shapes.length - 1) {     // the full stop of the wordmark
        const pts = loops[0], xs = pts.map(p => p.x + part.dx), ys = pts.map(p => p.y + part.dy);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, r = (Math.max(...xs) - Math.min(...xs)) * .5;
        hot = new THREE.Vector4((cx - min.x) / sz.x, (cy - min.y) / sz.y, r * 1.5 / sz.y, 0);
      }
    });
  }
  const img = x.getImageData(0, 0, W, H), a = new Float32Array(W * H);
  for (let i = 0; i < a.length; i++) a[i] = img.data[i * 4 + 3] / 255;
  const r = Math.max(2, Math.round(.11 / sz.x * W)), soft = boxBlur(boxBlur(a, W, H, r), W, H, r);
  for (let i = 0; i < a.length; i++) { img.data[i * 4] = a[i] * 255; img.data[i * 4 + 1] = soft[i] * 255; img.data[i * 4 + 2] = 0; img.data[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  const mask = new THREE.CanvasTexture(c); mask.generateMipmaps = false; mask.minFilter = mask.magFilter = THREE.LinearFilter;

  const hw = 192, hh = Math.max(24, Math.round(hw * sz.y / sz.x));
  const rt = () => new THREE.WebGLRenderTarget(hw, hh, { type: floatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const heat = [rt(), rt()];
  const uniforms = { uMask: { value: mask }, uHeat: { value: heat[0].texture }, uBox: { value: new THREE.Vector4(min.x, min.y, sz.x, sz.y) }, uHot: { value: hot || new THREE.Vector4(0, 0, .001, 0) }, uBaseT: { value: 25 } };
  const material = steel(uniforms);
  for (const part of parts) { const mesh = new THREE.Mesh(part.geo, material); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); }
  return { group, uniforms, heat, mask, min, size: sz, frontZ: depth / 2 + .03, width: sz.x, height: sz.y, texel: new THREE.Vector2(1 / hw, 1 / hh), aspect: sz.x / sz.y, pending: [] };
}

/* The heat that touches leave: it spreads a little and fades. */
export function makeHeatStepper(renderer) {
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: { tPrev: { value: null }, uTexel: { value: new THREE.Vector2() }, uPoint: { value: new THREE.Vector4(0, 0, 0, 0) }, uAspect: { value: 1 }, uKeep: { value: .98 }, uLoss: { value: .001 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `uniform sampler2D tPrev; uniform vec2 uTexel; uniform vec4 uPoint; uniform float uAspect,uKeep,uLoss; varying vec2 vUv;
      void main(){ float h=texture2D(tPrev,vUv).r;
        float near=(texture2D(tPrev,vUv+vec2(uTexel.x,0.)).r+texture2D(tPrev,vUv-vec2(uTexel.x,0.)).r+texture2D(tPrev,vUv+vec2(0.,uTexel.y)).r+texture2D(tPrev,vUv-vec2(0.,uTexel.y)).r)*.25;
        h=max(mix(h,near,.4)*uKeep-uLoss,0.);
        vec2 d=(vUv-uPoint.xy)*vec2(uAspect,1.); h+=uPoint.w*exp(-dot(d,d)/(uPoint.z*uPoint.z));
        gl_FragColor=vec4(min(h,1.15),0.,0.,1.); }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return (piece, dt) => {
    const p = piece.pending.shift();
    mat.uniforms.tPrev.value = piece.heat[0].texture; mat.uniforms.uTexel.value.copy(piece.texel); mat.uniforms.uAspect.value = piece.aspect;
    mat.uniforms.uKeep.value = Math.exp(-dt * .55); mat.uniforms.uLoss.value = dt * .02;
    if (p) mat.uniforms.uPoint.value.set(p.u, p.v, p.r, p.amount); else mat.uniforms.uPoint.value.w = 0;
    renderer.setRenderTarget(piece.heat[1]); renderer.render(scene, cam); renderer.setRenderTarget(null);
    piece.heat.reverse(); piece.uniforms.uHeat.value = piece.heat[0].texture;
  };
}
