// A two-masted brig, built procedurally: lofted hull with bulwarks and deck, spars, standing and running
// rigging as real geometry, wind-filled canvas, deck furniture and lanterns. Local axes: +X bow, +Y up, +Z starboard.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smooth, rng, tex, texD, canvasTex, atmoUniform, A } from './core.js';

export const SHIP = { stern: -14.5, bow: 15.5, beam: 3.9, draft: 3.1, deck: 2.25, rail: 1.05 };
const S = SHIP;
// plan-view half breadth at the rail, and sheer line
export function halfBeam(x) {
  const u = (x - S.stern) / (S.bow - S.stern); if (u <= 0 || u >= 1) return 0;
  const fore = Math.pow(clamp((1 - u) / 0.42), 0.62), aft = lerp(0.72, 1, Math.pow(clamp(u / 0.3), 0.7));
  return S.beam * Math.min(fore, 1) * aft;
}
export const deckY = (x) => { const u = (x - S.stern) / (S.bow - S.stern) - 0.42; return S.deck + u * u * 3.4; };

function hullGeometry() {
  const NS = 56, NG = 18; const pos = [], uv = [], col = [], idx = [];
  const sec = (x, s, out) => { // s: 0 keel → 1 rail top
    const u = (x - S.stern) / (S.bow - S.stern); const w = halfBeam(x); const top = deckY(x) + S.rail;
    const rise = Math.pow(clamp((u - 0.8) / 0.2), 2) * 2.4 + Math.pow(clamp((0.16 - u) / 0.16), 1.6) * 1.9; // keel rises at the ends
    const kb = -S.draft + rise;
    const a = s * Math.PI / 2; const full = lerp(0.52, 0.36, Math.abs(u - 0.45) * 2); // fuller amidships
    const z = w * Math.pow(Math.sin(a), full) * (1 - 0.05 * smooth(0.75, 1, s)); // slight tumblehome
    const y = lerp(kb, top, Math.pow(s, 1.25) * 0.55 + (1 - Math.cos(a)) * 0.45);
    out[0] = x; out[1] = y; out[2] = z; return out;
  };
  const p = [0, 0, 0]; const V = (i, j, side) => (side * (NS + 1) + i) * (NG + 1) + j;
  for (let side = 0; side < 2; side++) for (let i = 0; i <= NS; i++) {
    let t = i / NS; t = t * t * (3 - 2 * t) * 0.5 + t * 0.5; const x = lerp(S.stern, S.bow - 0.02, t); let girth = 0, py = 0, pz = 0;
    for (let j = 0; j <= NG; j++) {
      sec(x, j / NG, p); if (j) girth += Math.hypot(p[1] - py, p[2] - pz); py = p[1]; pz = p[2];
      pos.push(p[0], p[1], side ? -p[2] : p[2]); uv.push(x / 3.2, girth / 3.2);
      // paint scheme: weathered copper below the waterline, tarred black topsides, one ochre strake
      const top = deckY(x) + S.rail; let c;
      if (p[1] < 0.25) c = [0.36, 0.5, 0.44]; else if (p[1] > top - 1.5 && p[1] < top - 0.95) c = [0.95, 0.72, 0.36]; else c = [0.13, 0.12, 0.115];
      col.push(c[0], c[1], c[2]);
    }
  }
  for (let side = 0; side < 2; side++) for (let i = 0; i < NS; i++) for (let j = 0; j < NG; j++) { const a = V(i, j, side), b = V(i + 1, j, side), c = V(i, j + 1, side), d = V(i + 1, j + 1, side); side ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c); }
  // transom
  const base = pos.length / 3;
  for (let j = 0; j <= NG; j++) { sec(S.stern, j / NG, p); pos.push(p[0], p[1], p[2], p[0], p[1], -p[2]); uv.push(p[2] / 3.2, p[1] / 3.2, -p[2] / 3.2, p[1] / 3.2); const c = p[1] < 0.25 ? [0.36, 0.5, 0.44] : [0.14, 0.12, 0.11]; col.push(...c, ...c); }
  for (let j = 0; j < NG; j++) { const a = base + j * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function deckGeometry() { // deck surface plus the inner face and cap of the bulwarks, so the hull is closed from above
  const NS = 48, NW = 8; const pos = [], uv = [], idx = [], col = []; const th = 0.2;
  for (let i = 0; i <= NS; i++) { const x = lerp(S.stern, S.bow - 0.5, i / NS); const w = Math.max(halfBeam(x) - th, 0.02), dy = deckY(x);
    for (let j = 0; j <= NW; j++) { const z = lerp(-w, w, j / NW); pos.push(x, dy + 0.07 * (1 - (z / Math.max(w, 0.1)) ** 2), z); uv.push(x / 2.2, z / 2.2); col.push(0.78, 0.74, 0.66); } }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NW; j++) { const a = i * (NW + 1) + j, b = a + NW + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  // inner bulwark and rail cap, both sides
  for (const sg of [1, -1]) { const base = pos.length / 3;
    for (let i = 0; i <= NS; i++) { const x = lerp(S.stern, S.bow - 0.5, i / NS); const wo = halfBeam(x) * 0.985 + 0.06, wi = Math.max(halfBeam(x) - th, 0.02), dy = deckY(x), top = dy + S.rail;
      pos.push(x, dy, sg * wi, x, top, sg * wi, x, top + 0.05, sg * (wi - 0.06), x, top + 0.05, sg * (wo + 0.05), x, top - 0.06, sg * (wo + 0.05));
      uv.push(x / 2.2, 0, x / 2.2, 0.45, x / 2.2, 0.5, x / 2.2, 0.62, x / 2.2, 0.66); col.push(0.55, 0.5, 0.42, 0.55, 0.5, 0.42, 0.42, 0.33, 0.24, 0.42, 0.33, 0.24, 0.2, 0.18, 0.16); }
    for (let i = 0; i < NS; i++) for (let j = 0; j < 4; j++) { const a = base + i * 5 + j, b = a + 5; sg > 0 ? idx.push(a, b, a + 1, a + 1, b, b + 1) : idx.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  // stern bulwark across the transom
  { const x = S.stern, w = halfBeam(x + 0.01) || S.beam * 0.72, dy = deckY(x), top = dy + S.rail, base = pos.length / 3;
    pos.push(x + th, dy, -w, x + th, dy, w, x + th, top, -w, x + th, top, w, x - 0.08, top + 0.05, -w, x - 0.08, top + 0.05, w); uv.push(0, 0, 1, 0, 0, 0.45, 1, 0.45, 0, 0.6, 1, 0.6); for (let k = 0; k < 6; k++) col.push(0.5, 0.45, 0.38);
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3, base + 2, base + 4, base + 3, base + 3, base + 4, base + 5); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

const _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _m = new THREE.Matrix4();
function cyl(a, b, r0, r1 = r0, seg = 8, uvScale = 1) { // tapered cylinder between two points
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _d.length(); const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 2 * uvScale, u.getY(i) * len / 2.5 * uvScale);
  _q.setFromUnitVectors(_up, _d.normalize()); _m.compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q, new THREE.Vector3(1, 1, 1)); g.applyMatrix4(_m); return g;
}
function box(c, s, ry = 0, tint = null) { const g = new THREE.BoxGeometry(s[0], s[1], s[2]); const u = g.attributes.uv; const m = Math.max(s[0], s[1], s[2]) / 2.2; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * m, u.getY(i) * m); if (ry) g.rotateY(ry); g.translate(c[0], c[1], c[2]); return g; }
function tintGeo(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function rope(a, b, r = 0.022, sag = 0) { // polyline rope with optional sag
  if (!sag) return cyl(a, b, r, r, 5);
  const parts = [], n = 7; let p = a; for (let i = 1; i <= n; i++) { const t = i / n; const q = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t)]; parts.push(cyl(p, q, r, r, 5)); p = q; }
  return mergeGeometries(parts);
}

function sailTexture() {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#d9cfb8'; c.fillRect(0, 0, w, h); const r = rng(8);
    for (let i = 0; i < 9000; i++) { const x = r() * w, y = r() * h, l = 6 + r() * 26; c.fillStyle = `rgba(${90 + r() * 80 | 0},${80 + r() * 70 | 0},${60 + r() * 50 | 0},${0.03 + r() * 0.05})`; r() > 0.5 ? c.fillRect(x, y, l, 1) : c.fillRect(x, y, 1, l); }
    for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, rad = 30 + r() * 110; const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(110,95,70,${0.05 + r() * 0.1})`); g.addColorStop(1, 'rgba(110,95,70,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    c.strokeStyle = 'rgba(70,60,45,0.5)'; c.lineWidth = 1.6; for (let i = 0; i <= 8; i++) { const x = i / 8 * w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.setLineDash([3, 5]); c.beginPath(); c.moveTo(x + 5, 0); c.lineTo(x + 5, h); c.stroke(); c.setLineDash([]); }
    c.strokeStyle = 'rgba(60,50,40,0.35)'; for (const y of [0.3, 0.52]) { c.beginPath(); c.moveTo(0, y * h); c.lineTo(w, y * h); c.stroke(); for (let i = 0; i < 32; i++) { c.fillStyle = 'rgba(60,50,40,0.5)'; c.fillRect(i / 32 * w + 6, y * h, 1.5, 12); } }
  });
}
function ropeTexture() { return canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#6f6047'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3b3122'; c.lineWidth = 3; for (let i = -8; i < 16; i++) { c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8 + 32, h); c.stroke(); } }); }

export function buildShip(app) {
  const group = new THREE.Group(); const r = rng(3);
  const woodD = texD('wood_d.jpg'), woodR = tex('wood_r.jpg'), woodB = tex('wood_b.jpg');
  const hullMat = new THREE.MeshStandardMaterial({ map: woodD, roughnessMap: woodR, bumpMap: woodB, bumpScale: 2.5, vertexColors: true, roughness: 0.82, metalness: 0 });
  const deckMat = new THREE.MeshStandardMaterial({ map: woodD, roughnessMap: woodR, bumpMap: woodB, bumpScale: 2, vertexColors: true, roughness: 0.9 });
  const sparMat = new THREE.MeshStandardMaterial({ map: texD('bark_pine_d.jpg'), color: 0xb08a58, roughness: 0.7, vertexColors: true });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodD, roughnessMap: woodR, bumpMap: woodB, bumpScale: 2, vertexColors: true, roughness: 0.8 });
  const ropeMat = new THREE.MeshStandardMaterial({ map: ropeTexture(), roughness: 0.95, color: 0xd8cbb0 });
  const tarMat = new THREE.MeshStandardMaterial({ map: ropeTexture(), roughness: 0.9, color: 0x3a342c });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.55, metalness: 0.85 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.35, metalness: 1 });

  const hull = new THREE.Mesh(hullGeometry(), hullMat); hull.castShadow = hull.receiveShadow = true; group.add(hull);
  const deck = new THREE.Mesh(deckGeometry(), deckMat); deck.receiveShadow = true; deck.castShadow = true; group.add(deck);

  const spars = [], wood = [], ropes = [], tar = [], iron = [], brass = [], sails = [];
  const W = (g, c = [1, 1, 1]) => wood.push(tintGeo(g, c)); const SP = (g, c = [1, 1, 1]) => spars.push(tintGeo(g, c));
  const masts = [{ x: 6.2, h: 26.5, name: 'fore' }, { x: -3.6, h: 28.5, name: 'main' }];
  const yardRot = 0.2; // braced a little to starboard
  const sailDefs = [];
  for (const m of masts) {
    const d = deckY(m.x), top = d + m.h;
    SP(cyl([m.x, -1.5, 0], [m.x, d + m.h * 0.47, 0], 0.36, 0.27, 12)); SP(cyl([m.x + 0.25, d + m.h * 0.42, 0], [m.x + 0.25, d + m.h * 0.78, 0], 0.2, 0.15, 10)); SP(cyl([m.x + 0.4, d + m.h * 0.74, 0], [m.x + 0.4, top, 0], 0.12, 0.06, 8));
    // tops (platforms) and crosstrees
    W(box([m.x + 0.1, d + m.h * 0.445, 0], [1.9, 0.1, 2.9]), [0.55, 0.45, 0.33]); W(box([m.x + 0.1, d + m.h * 0.42, 0.9], [1.7, 0.16, 0.12])); W(box([m.x + 0.1, d + m.h * 0.42, -0.9], [1.7, 0.16, 0.12]));
    W(box([m.x + 0.33, d + m.h * 0.76, 0], [0.9, 0.08, 1.7]), [0.4, 0.33, 0.25]);
    iron.push(cyl([m.x, d + 0.02, 0], [m.x, d + 0.2, 0], 0.5, 0.42, 14)); // mast coat
    // yards and square sails
    const yards = [{ y: d + m.h * 0.36, len: 13.6, r: 0.17 }, { y: d + m.h * 0.63, len: 10.6, r: 0.13 }, { y: d + m.h * 0.86, len: 7.6, r: 0.095 }];
    const c = Math.cos(yardRot), s = Math.sin(yardRot); const fx = m.x + 0.55;
    yards.forEach((y, i) => {
      const a = [fx - s * y.len / 2, y.y, -c * y.len / 2], b = [fx + s * y.len / 2, y.y, c * y.len / 2], mid = [fx, y.y, 0];
      SP(cyl(a, mid, y.r * 0.55, y.r, 8), [0.2, 0.18, 0.16]); SP(cyl(mid, b, y.r, y.r * 0.55, 8), [0.2, 0.18, 0.16]);
      // footropes under the yard
      tar.push(rope([a[0], a[1] - 0.05, a[2]], [mid[0], mid[1] - 0.1, mid[2] - 0.3], 0.014, 0.75), rope([mid[0], mid[1] - 0.1, mid[2] + 0.3], [b[0], b[1] - 0.05, b[2]], 0.014, 0.75));
      // lifts and braces
      ropes.push(rope(a, [m.x + 0.3, y.y + 2.6 - i * 0.5, 0], 0.014), rope(b, [m.x + 0.3, y.y + 2.6 - i * 0.5, 0], 0.014));
      const bx = m.name === 'fore' ? masts[1].x + 0.3 : S.stern + 2.0; const by = m.name === 'fore' ? deckY(masts[1].x) + masts[1].h * (0.3 + i * 0.2) : deckY(S.stern + 2) + S.rail + 0.1 + i * 0;
      ropes.push(rope(a, [bx, by, m.name === 'fore' ? -0.3 : -halfBeam(bx) * 0.95], 0.014, 0.5), rope(b, [bx, by, m.name === 'fore' ? 0.3 : halfBeam(bx) * 0.95], 0.014, 0.5));
      const foot = i === 0 ? d + 2.6 : yards[i - 1].y + 0.25; const footLen = i === 0 ? y.len * 0.96 : yards[i - 1].len * 0.97;
      sailDefs.push({ fx, top: y.y - y.r - 0.05, foot, w0: y.len * 0.94, w1: footLen, rot: yardRot, belly: 1.25 - i * 0.2, idx: sailDefs.length });
      // sheets from the clews
      const cl = [fx + s * footLen / 2 + 0.6, foot, c * footLen / 2], cr = [fx - s * footLen / 2 + 0.6, foot, -c * footLen / 2];
      if (i === 0) { ropes.push(rope(cl, [m.x - 3.5, deckY(m.x - 3.5) + S.rail, halfBeam(m.x - 3.5) * 0.95], 0.018, 0.25), rope(cr, [m.x - 3.5, deckY(m.x - 3.5) + S.rail, -halfBeam(m.x - 3.5) * 0.95], 0.018, 0.25), rope(cl, [m.x + 4.5, deckY(m.x + 4.5) + S.rail, halfBeam(m.x + 4.5) * 0.9], 0.016, 0.2), rope(cr, [m.x + 4.5, deckY(m.x + 4.5) + S.rail, -halfBeam(m.x + 4.5) * 0.9], 0.016, 0.2)); }
    });
    // shrouds with ratlines, both sides; backstays
    for (const sg of [1, -1]) {
      const topP = [m.x + 0.1, d + m.h * 0.44, sg * 1.3]; const N = 5; const feet = [];
      for (let k = 0; k < N; k++) { const fxk = m.x - 0.4 - k * 0.62; const f = [fxk, deckY(fxk) + S.rail + 0.05, sg * (halfBeam(fxk) + 0.12)]; feet.push(f); tar.push(rope(f, [topP[0] - k * 0.12, topP[1], topP[2]], 0.026)); iron.push(box([fxk, f[1] - 0.25, f[2]], [0.09, 0.5, 0.07])); }
      for (let q = 1; q < 22; q++) { const t = q / 23; const p0 = [lerp(feet[0][0], topP[0], t), lerp(feet[0][1], topP[1], t), lerp(feet[0][2], topP[2], t)], p1 = [lerp(feet[N - 1][0], topP[0] - (N - 1) * 0.12, t), lerp(feet[N - 1][1], topP[1], t), lerp(feet[N - 1][2], topP[2], t)]; tar.push(rope(p0, p1, 0.011)); }
      // topmast shrouds and backstays
      for (let k = 0; k < 3; k++) tar.push(rope([m.x + 0.1 - k * 0.35, d + m.h * 0.45, sg * 1.4], [m.x + 0.3, d + m.h * 0.76, sg * 0.75], 0.018));
      tar.push(rope([m.x + 0.3, d + m.h * 0.77, sg * 0.1], [m.x - 4.2, deckY(m.x - 4.2) + S.rail, sg * (halfBeam(m.x - 4.2) + 0.1)], 0.022), rope([m.x + 0.4, top - 0.4, sg * 0.05], [m.x - 5.2, deckY(m.x - 5.2) + S.rail, sg * (halfBeam(m.x - 5.2) + 0.1)], 0.018));
    }
    // fife rail with belaying pins at the mast foot
    W(box([m.x - 1.0, d + 0.85, 0], [0.14, 0.12, 2.4]), [0.4, 0.3, 0.2]); for (const z of [-1.1, 1.1]) W(box([m.x - 1.0, d + 0.45, z], [0.14, 0.9, 0.14]), [0.4, 0.3, 0.2]);
    for (let k = -4; k <= 4; k++) W(cyl([m.x - 1.0, d + 0.7, k * 0.24], [m.x - 1.0, d + 1.05, k * 0.24], 0.022, 0.03, 5), [0.7, 0.6, 0.45]);
  }
  // bowsprit, jib-boom and head stays
  const bs0 = [S.bow - 3.2, deckY(S.bow - 3) + 0.55, 0], bs1 = [S.bow + 6.2, deckY(S.bow) + 3.3, 0], jb = [S.bow + 10.8, deckY(S.bow) + 4.5, 0];
  SP(cyl(bs0, bs1, 0.3, 0.22, 10)); SP(cyl([bs1[0] - 1.5, bs1[1] - 0.25, 0], jb, 0.15, 0.08, 8));
  tar.push(rope([bs1[0], bs1[1] - 0.2, 0], [S.bow - 0.2, 0.9, 0], 0.035)); // bobstay
  const fm = masts[0], fd = deckY(fm.x), mm = masts[1], md = deckY(mm.x);
  const stays = [[[fm.x + 0.1, fd + fm.h * 0.44, 0], [bs1[0] - 2.6, bs1[1] - 0.6, 0]], [[fm.x + 0.3, fd + fm.h * 0.77, 0], [bs1[0], bs1[1] + 0.2, 0]], [[fm.x + 0.4, fd + fm.h - 0.3, 0], jb], [[mm.x + 0.1, md + mm.h * 0.44, 0], [fm.x - 0.2, fd + 2.2, 0]], [[mm.x + 0.3, md + mm.h * 0.77, 0], [fm.x, fd + fm.h * 0.46, 0]], [[mm.x + 0.4, md + mm.h - 0.3, 0], [fm.x + 0.25, fd + fm.h * 0.78, 0]]];
  for (const [a, b] of stays) tar.push(rope(a, b, 0.026));
  // gaff and boom for the spanker
  const bm0 = [mm.x - 0.4, md + 2.3, 0], bm1 = [S.stern - 1.2, md + 3.3, 0.35], gf0 = [mm.x - 0.4, md + mm.h * 0.4, 0], gf1 = [mm.x - 7.4, md + mm.h * 0.56, 0.4];
  SP(cyl(bm0, bm1, 0.14, 0.1, 8), [0.25, 0.22, 0.2]); SP(cyl(gf0, gf1, 0.12, 0.08, 8), [0.25, 0.22, 0.2]);
  ropes.push(rope(gf1, [mm.x + 0.3, md + mm.h * 0.75, 0], 0.016), rope(bm1, [S.stern + 0.6, deckY(S.stern + 0.6) + S.rail, 0.9], 0.02, 0.3), rope(bm1, [mm.x + 0.3, md + mm.h * 0.72, 0], 0.014));

  // --- sails ---
  const sailTex = sailTexture(); const sailGeos = [];
  const quad = (pfn, nu, nv, belly, kind) => { // parametric sheet; attribute aB = (billow weight, flutter weight, phase)
    const pos = [], uv = [], aB = [], idx = []; const ph = r() * 6.28;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; const p = pfn(u, v); pos.push(p[0], p[1], p[2]); uv.push(u * (kind === 'tri' ? 1.2 : 2), v * 1.6);
      const bw = kind === 'sq' ? Math.sin(u * Math.PI) ** 0.75 * (0.25 + 0.75 * Math.sin(Math.min(v * 1.15, 1) * Math.PI * 0.62)) : Math.sin(u * Math.PI) * Math.sin(v * Math.PI) ** 0.8;
      aB.push(bw * belly, (kind === 'sq' ? v * v : Math.sin(u * Math.PI) * v) * 0.9 + 0.05, ph); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i; idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 3)); g.setIndex(idx); g.computeVertexNormals(); sailGeos.push(g);
  };
  for (const sd of sailDefs) { const c = Math.cos(sd.rot), s = Math.sin(sd.rot);
    quad((u, v) => { const w = lerp(sd.w0, sd.w1, v), t = (u - 0.5) * w; const roach = Math.sin(u * Math.PI) * 0.35 * v * v; return [sd.fx + s * t + 0.12, lerp(sd.top, sd.foot + roach, v), c * t]; }, 14, 10, sd.belly, 'sq'); }
  // spanker (fore-and-aft) and three headsails
  quad((u, v) => { const a = [lerp(gf0[0], gf1[0], u), lerp(gf0[1], gf1[1], u), lerp(gf0[2], gf1[2], u)], b = [lerp(bm0[0], bm1[0] + 0.6, u), lerp(bm0[1], bm1[1], u) + 0.15, lerp(bm0[2], bm1[2], u)]; return [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)]; }, 10, 10, 0.7, 'fa');
  const jibs = [[stays[0][0], stays[0][1], 0.2, 0.85], [stays[1][0], stays[1][1], 0.12, 0.8], [stays[2][0], stays[2][1], 0.1, 0.72]];
  for (const [hd, tk, lo, hi] of jibs) { const head = [lerp(tk[0], hd[0], hi), lerp(tk[1], hd[1], hi), 0], tack = [lerp(tk[0], hd[0], lo), lerp(tk[1], hd[1], lo), 0]; const clew = [tack[0] - (head[1] - tack[1]) * 0.5, tack[1] + 0.7, 0.9];
    quad((u, v) => { const e = [lerp(tack[0], clew[0], u), lerp(tack[1], clew[1], u), lerp(tack[2], clew[2], u)]; return [lerp(head[0], e[0], v), lerp(head[1], e[1], v), lerp(head[2], e[2], v)]; }, 8, 10, 0.55, 'tri');
    ropes.push(rope(clew, [fm.x - 1.5, deckY(fm.x - 1.5) + S.rail, halfBeam(fm.x - 1.5) * 0.9], 0.015, 0.15)); }
  const sailMat = new THREE.MeshStandardMaterial({ map: sailTex, roughness: 0.92, side: THREE.DoubleSide, color: 0xfff8ea });
  const sailU = { uSailT: { value: 0 }, uSailWind: { value: 0.4 } };
  const patchSail = (sh, depth) => {
    Object.assign(sh.uniforms, sailU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aB; uniform float uSailT, uSailWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fill = 0.35 + 0.85*uSailWind; float fl = sin(uSailT*(2.2 + 4.0*uSailWind) + position.y*1.7 + position.z*1.3 + aB.z) + 0.6*sin(uSailT*5.3 + position.y*3.1 + aB.z*2.0);
        float slack = (1.0 - smoothstep(0.03, 0.3, uSailWind));
        transformed.x += aB.x*fill*(1.0 - slack*0.75) + aB.y*fl*(0.05 + 0.1*uSailWind + slack*0.12);
        transformed.z += aB.x*0.22*fill;`);
    if (!depth) sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { vec3 Ls = normalize((viewMatrix*vec4(uA[0].xyz, 0.0)).xyz); float back = max(dot(-normal, Ls), 0.0); reflectedLight.directDiffuse += diffuseColor.rgb*uA[1].rgb*uA[0].w*back*0.16; }`);
  };
  sailMat.onBeforeCompile = (sh) => patchSail(sh, false);
  const sailMesh = new THREE.Mesh(mergeGeometries(sailGeos), sailMat); sailMesh.castShadow = sailMesh.receiveShadow = true;
  sailMesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }); sailMesh.customDepthMaterial.onBeforeCompile = (sh) => patchSail(sh, true);
  group.add(sailMesh);

  // --- deck furniture ---
  const dk = deckY;
  // hatches with gratings, companionway, deckhouse, skylight
  for (const hx of [1.6, 9.6]) { W(box([hx, dk(hx) + 0.22, 0], [2.2, 0.36, 1.8]), [0.45, 0.36, 0.26]); for (let k = -3; k <= 3; k++) W(box([hx + k * 0.3, dk(hx) + 0.42, 0], [0.09, 0.05, 1.6]), [0.3, 0.24, 0.18]); for (let k = -2; k <= 2; k++) W(box([hx, dk(hx) + 0.42, k * 0.32], [2.0, 0.05, 0.08]), [0.3, 0.24, 0.18]); }
  W(box([-8.3, dk(-8.3) + 0.75, 0], [3.4, 1.4, 2.6]), [0.5, 0.42, 0.32]); W(box([-8.3, dk(-8.3) + 1.5, 0], [3.7, 0.1, 2.9]), [0.3, 0.25, 0.2]);
  W(box([-6.2, dk(-6.2) + 0.55, 0], [0.9, 1.0, 1.2]), [0.42, 0.34, 0.25]);
  // capstan
  W(cyl([11.6, dk(11.6), 0], [11.6, dk(11.6) + 0.95, 0], 0.42, 0.3, 12), [0.45, 0.35, 0.25]); W(cyl([11.6, dk(11.6) + 0.95, 0], [11.6, dk(11.6) + 1.12, 0], 0.5, 0.5, 12), [0.35, 0.28, 0.2]);
  // wheel, pedestal, binnacle
  const wx = -11.4, wy = dk(wx) + 1.05; W(box([wx - 0.25, dk(wx) + 0.5, 0], [0.3, 1.0, 0.36]), [0.4, 0.3, 0.22]);
  const wheel = new THREE.Group(); wheel.position.set(wx, wy, 0);
  { const rim = new THREE.TorusGeometry(0.52, 0.035, 6, 28); rim.rotateY(Math.PI / 2); const parts = [rim]; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; parts.push(cyl([0, 0, 0], [0, Math.cos(a) * 0.72, Math.sin(a) * 0.72], 0.022, 0.016, 5)); } parts.push(cyl([-0.06, 0, 0], [0.06, 0, 0], 0.09, 0.09, 10));
    const wm = new THREE.Mesh(mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g; })), new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.55 })); wm.castShadow = true; wheel.add(wm); }
  group.add(wheel);
  W(box([wx + 1.2, dk(wx + 1.2) + 0.5, 0], [0.4, 1.0, 0.4]), [0.38, 0.28, 0.2]); brass.push(cyl([wx + 1.2, dk(wx + 1.2) + 1.0, 0], [wx + 1.2, dk(wx + 1.2) + 1.18, 0], 0.16, 0.05, 10));
  // ship's boat on chocks, barrels, coiled rope, anchors
  { const bx = -0.2, by = dk(bx) + 0.95; const g = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(2.6, 0.75, 0.9); g.translate(bx + 3.2, by - 0.35, 0); W(g, [0.7, 0.68, 0.62]); W(box([bx + 2.1, dk(bx) + 0.25, 0], [0.16, 0.5, 1.7]), [0.35, 0.28, 0.2]); W(box([bx + 4.3, dk(bx) + 0.25, 0], [0.16, 0.5, 1.7]), [0.35, 0.28, 0.2]); }
  for (const [bx, bz] of [[-5.0, 2.2], [-5.7, 2.35], [-5.3, -2.3], [12.6, 1.2], [3.9, -2.7]]) { const g = new THREE.CylinderGeometry(0.3, 0.3, 0.85, 12, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.425; const k = 1 + 0.16 * (1 - y * y); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.translate(bx, dk(bx) + 0.47, bz); W(g, [0.5, 0.38, 0.25]); for (const hy of [0.18, 0.78]) iron.push(cyl([bx, dk(bx) + hy, bz], [bx, dk(bx) + hy + 0.05, bz], 0.335, 0.335, 12)); }
  for (const [cx, cz] of [[4.6, 2.4], [-2.0, -2.6], [8.5, -2.0]]) { const t = new THREE.TorusGeometry(0.32, 0.07, 6, 18); t.rotateX(Math.PI / 2); t.translate(cx, dk(cx) + 0.1, cz); ropes.push(t); const t2 = new THREE.TorusGeometry(0.24, 0.06, 6, 16); t2.rotateX(Math.PI / 2); t2.translate(cx, dk(cx) + 0.2, cz); ropes.push(t2); }
  for (const sg of [1, -1]) { const ax = S.bow - 3.4, az = sg * (halfBeam(ax) + 0.35), ay = dk(ax) + 0.2; W(box([ax, dk(ax) + S.rail + 0.05, sg * (halfBeam(ax) + 0.1)], [0.24, 0.22, 1.3]), [0.35, 0.28, 0.2]); iron.push(cyl([ax, ay + 0.9, az], [ax, ay - 1.3, az], 0.05, 0.05, 6), cyl([ax - 0.55, ay - 1.0, az], [ax, ay - 1.35, az], 0.05, 0.03, 6), cyl([ax + 0.55, ay - 1.0, az], [ax, ay - 1.35, az], 0.05, 0.03, 6), cyl([ax, ay + 0.8, az - 0.45], [ax, ay + 0.8, az + 0.45], 0.045, 0.045, 6)); }
  // rudder
  W(box([S.stern - 0.25, -0.6, 0], [0.5, 4.6, 0.2]), [0.3, 0.42, 0.38]);
  // stern windows: warm at night
  const winMat = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.2, metalness: 0.3, emissive: new THREE.Color(1.0, 0.62, 0.25), emissiveIntensity: 0 });
  const wins = []; for (let k = -2; k <= 2; k++) { const z = k * 0.95; wins.push(box([S.stern - 0.05, dk(S.stern) - 0.9, z], [0.08, 0.75, 0.62])); W(box([S.stern - 0.07, dk(S.stern) - 0.9, z + 0.47], [0.1, 0.9, 0.08]), [0.9, 0.7, 0.35]); }
  const winMesh = new THREE.Mesh(mergeGeometries(wins), winMat); group.add(winMesh);
  // lanterns
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x33291c, emissive: new THREE.Color(1.0, 0.55, 0.2), emissiveIntensity: 0, roughness: 0.4 });
  const lamps = []; const lampPos = [[S.stern - 0.3, dk(S.stern) + S.rail + 1.25, 0], [mm.x - 0.5, md + 2.6, 0.45], [fm.x - 0.5, fd + 2.6, -0.45]];
  for (const p of lampPos) { lamps.push(box(p, [0.24, 0.34, 0.24])); iron.push(cyl([p[0], p[1] + 0.17, p[2]], [p[0], p[1] + 0.3, p[2]], 0.15, 0.03, 6), cyl([p[0], p[1] - 0.17, p[2]], [p[0], p[1] - 1.2, p[2]], 0.03, 0.03, 5)); }
  const lampMesh = new THREE.Mesh(mergeGeometries(lamps), lampMat); group.add(lampMesh);
  const lights = lampPos.map((p, i) => { const l = new THREE.PointLight(0xffa050, 0, i === 0 ? 26 : 18, 1.6); l.position.set(p[0], p[1], p[2]); group.add(l); return l; });

  const add = (list, mat, shadow = true) => { if (!list.length) return null; const g = mergeGeometries(list.map((x) => { if (!x.attributes.color && mat.vertexColors) tintGeo(x, [1, 1, 1]); if (!mat.vertexColors && x.attributes.color) x.deleteAttribute('color'); return x.index ? x : x; })); const m = new THREE.Mesh(g, mat); m.castShadow = shadow; m.receiveShadow = true; group.add(m); return m; };
  add(spars, sparMat); add(wood, woodMat); add(ropes, ropeMat); add(tar, tarMat); add(iron, ironMat); add(brass, brassMat);

  // pennant at the main truck
  const pen = new THREE.PlaneGeometry(3.2, 0.42, 18, 2); pen.translate(-1.6, 0, 0);
  const penMat = new THREE.MeshStandardMaterial({ color: 0x8b1c1c, side: THREE.DoubleSide, roughness: 0.8 });
  penMat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, sailU); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSailT, uSailWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n float k = -position.x/3.2; transformed.y += sin(uSailT*7.0 - k*9.0)*0.16*k*(0.4 + uSailWind) - k*k*(1.0 - uSailWind)*1.2; transformed.z += sin(uSailT*5.0 - k*7.0)*0.2*k; transformed.y *= 1.0 - k*0.7;'); };
  const pennant = new THREE.Mesh(pen, penMat); pennant.position.set(mm.x + 0.4, md + mm.h + 0.15, 0); group.add(pennant);

  const colliders = [{ x: -8.3, z: 0, hx: 1.9, hz: 1.5, h: 1.7 }, { x: 1.6, z: 0, hx: 1.2, hz: 1.0, h: 0.5 }, { x: 9.6, z: 0, hx: 1.2, hz: 1.0, h: 0.5 }, { x: 3.0, z: 0, hx: 2.8, hz: 1.0, h: 1.0 }];
  return {
    group, masts, wheel, lights, colliders,
    update(dt, t, wind, night) {
      sailU.uSailT.value = t; sailU.uSailWind.value = wind;
      const glow = smooth(0.2, 0.8, night); winMat.emissiveIntensity = glow * 0.12; lampMat.emissiveIntensity = glow * 0.5;
      lights.forEach((l, i) => { l.intensity = glow * (i === 0 ? 2.2 : 1.4) * (0.92 + 0.08 * Math.sin(t * (9 + i * 2.3)) * Math.sin(t * 3.1 + i)); });
      wheel.rotation.x = Math.sin(t * 0.33) * 0.5 + Math.sin(t * 0.11) * 0.4;
    },
  };
}
