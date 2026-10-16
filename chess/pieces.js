import * as T from '../evermile/vendor/three.module.js';
import { mergeGeometries } from '../evermile/vendor/utils/BufferGeometryUtils.js';
import { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } from './engine.js?v=1';

const SEGMENTS = 48;
const v = (r, y) => new T.Vector2(r, y);

// A turned Staunton foot: rounded plinth, recessed bead and a broad shoulder.
const base = r => [[0, 0], [r * .88, 0], [r * .97, .016], [r, .042], [r, .065], [r * .97, .087],
  [r * .88, .105], [r * .87, .122], [r * .93, .14], [r * .93, .159], [r * .86, .18],
  [r * .79, .19], [r * .75, .221], [r * .70, .245]];

function turned(profile) {
  const curve = new T.CatmullRomCurve3(profile.map(([r, y]) => new T.Vector3(r, y, 0)), false, 'centripetal');
  const points = curve.getPoints(profile.length * 3).map(p => v(Math.max(0, p.x), Math.max(0, p.y)));
  return new T.LatheGeometry(points, SEGMENTS);
}
function sphere(x, y, z, rx, ry = rx, rz = rx, tilt = 0) {
  const g = new T.SphereGeometry(1, 24, 16); g.scale(rx, ry, rz); g.rotateZ(tilt); g.translate(x, y, z); return g;
}
function shade(g, value) { g.userData.shade = value; return g; }
function finish(parts) {
  const geometries = parts.map(source => {
    const g = source.index ? source.toNonIndexed() : source;
    for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(key)) g.deleteAttribute(key);
    if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const colors = new Float32Array(g.attributes.position.count * 3).fill(source.userData.shade ?? 1);
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); return g;
  });
  const g = mergeGeometries(geometries, false);
  g.computeBoundingBox(); g.computeBoundingSphere();
  for (const source of new Set([...parts, ...geometries])) source.dispose();
  return g;
}

function pawn() {
  return finish([turned([...base(.32), [.215, .28], [.165, .37], [.125, .49], [.12, .56],
    [.17, .585], [.205, .607], [.207, .633], [.175, .654], [.11, .669], [.1, .70], [0, .71]]),
  sphere(0, .839, 0, .166)]);
}

function rook() {
  const parts = [turned([...base(.365), [.25, .28], [.229, .34], [.218, .46], [.215, .68], [.23, .79],
    [.27, .82], [.303, .845], [.305, .875], [.275, .9], [.29, .935], [.29, 1.025], [.221, 1.025], [.22, .957], [0, .957]])];
  // Radial wedge battlements follow the circular wall, instead of rectangular pegs.
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, width = .61;
    const shape = new T.Shape();
    shape.absarc(0, 0, .29, a - width / 2, a + width / 2, false);
    shape.absarc(0, 0, .22, a + width / 2, a - width / 2, true); shape.closePath();
    const g = new T.ExtrudeGeometry(shape, { depth: .115, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .008, bevelThickness: .008, curveSegments: 8 });
    g.rotateX(-Math.PI / 2); g.translate(0, 1.02, 0); parts.push(g);
  }
  return finish(parts);
}

// Elliptical horizontal sections give the neck actual volume from every angle.
function neck() {
  const sections = [[.32, -.035, .245, .183], [.40, -.055, .25, .18], [.54, -.10, .222, .16],
    [.70, -.137, .183, .137], [.86, -.135, .166, .12], [1.0, -.09, .17, .126],
    [1.12, -.028, .154, .128], [1.23, .02, .10, .105], [1.28, .015, .015, .02]];
  const centers = new T.CatmullRomCurve3(sections.map(([y, x, rx]) => new T.Vector3(x, y, rx)), false, 'centripetal');
  const widths = new T.SplineCurve(sections.map(([y, x, rx, rz], i) => v(i / (sections.length - 1), rz)));
  const rows = 48, cols = 32, pos = [], uv = [], indices = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, p = centers.getPoint(t), rz = widths.getPoint(t).y;
    for (let j = 0; j <= cols; j++) {
      const a = j / cols * Math.PI * 2;
      pos.push(p.x + Math.cos(a) * p.z, p.y, Math.sin(a) * rz); uv.push(j / cols, t);
      if (i < rows && j < cols) { const k = i * (cols + 1) + j; indices.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2); }
    }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
function tube(points, radius, segments = 32) {
  return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), segments, radius, 8, false);
}
function knight() {
  const parts = [turned([...base(.365), [.26, .272], [.285, .29], [.288, .318], [.25, .345], [0, .347]]), neck(),
    sphere(.105, 1.135, 0, .233, .137, .128, -.45), // forehead and long nasal bridge
    sphere(.035, 1.075, 0, .143, .17, .143, -.25), // rounded cheek and jaw
    sphere(.305, .99, 0, .149, .095, .117, -.4)]; // tapered muzzle
  for (const side of [-1, 1]) {
    const ear = new T.ConeGeometry(.052, .17, 20, 6); ear.scale(.75, 1, .65); ear.rotateZ(-.18);
    ear.translate(-.048, 1.32, side * .075); parts.push(ear);
    parts.push(sphere(.115, 1.167, side * .119, .044, .037, .022, -.3));
    parts.push(shade(sphere(.122, 1.167, side * .137, .019, .021, .01), .16));
    parts.push(shade(sphere(.368, 1.012, side * .098, .022, .014, .009, -.4), .24));
    parts.push(shade(tube([[.291, .933, side * .093], [.35, .929, side * .091], [.412, .956, side * .072]], .005, 12), .35));
  }
  parts.push(tube([[-.255, .42, 0], [-.317, .62, 0], [-.30, .84, 0], [-.24, 1.04, 0], [-.128, 1.25, 0]], .041));
  // Small carved ridges along the mane, embedded into the curved neck.
  for (let i = 0; i < 9; i++) {
    const t = i / 8, y = .53 + t * .62, x = -.31 + .14 * t * t;
    parts.push(tube([[x + .028, y - .027, -.029], [x - .02, y, 0], [x + .028, y + .027, .029]], .012, 8));
  }
  // Match the game's established forward direction and knight animation orientation.
  const g = finish(parts); g.rotateY(Math.PI / 2); return g;
}

// Clip a convex head and close the exposed cut with a planar cap. The bishop's
// mitre has a real negative-space saw cut, visible without a painted fake line.
function clipped(source, plane) {
  const g = source.index ? source.toNonIndexed() : source;
  const positions = g.attributes.position, normals = g.attributes.normal, out = [], norms = [], edge = [];
  const emit = (p, n) => { out.push(p.x, p.y, p.z); norms.push(n.x, n.y, n.z); };
  for (let i = 0; i < positions.count; i += 3) {
    const input = [0, 1, 2].map(j => ({p: new T.Vector3().fromBufferAttribute(positions, i + j), n: new T.Vector3().fromBufferAttribute(normals, i + j)}));
    const polygon = [];
    for (let j = 0; j < 3; j++) {
      const a = input[j], b = input[(j + 1) % 3], da = plane.distanceToPoint(a.p), db = plane.distanceToPoint(b.p);
      if (da >= 0) polygon.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db), p = a.p.clone().lerp(b.p, t), n = a.n.clone().lerp(b.n, t).normalize(); polygon.push({p, n}); edge.push(p);
      }
    }
    for (let j = 1; j + 1 < polygon.length; j++) for (const q of [polygon[0], polygon[j], polygon[j + 1]]) emit(q.p, q.n);
  }
  if (edge.length) {
    const unique = [...new Map(edge.map(p => [p.toArray().map(n => n.toFixed(6)).join(','), p])).values()];
    const center = unique.reduce((sum, p) => sum.add(p), new T.Vector3()).multiplyScalar(1 / unique.length);
    const normal = plane.normal.clone().negate(), u = new T.Vector3(1, 0, 0), w = new T.Vector3().crossVectors(normal, u);
    unique.sort((a, b) => Math.atan2(a.clone().sub(center).dot(w), a.clone().sub(center).dot(u)) - Math.atan2(b.clone().sub(center).dot(w), b.clone().sub(center).dot(u)));
    for (let i = 0; i < unique.length; i++) { emit(center, normal); emit(unique[i], normal); emit(unique[(i + 1) % unique.length], normal); }
  }
  const result = new T.BufferGeometry(); result.setAttribute('position', new T.Float32BufferAttribute(out, 3)); result.setAttribute('normal', new T.Float32BufferAttribute(norms, 3));
  if (g !== source) g.dispose(); return result;
}
function bishop() {
  const body = turned([...base(.35), [.239, .28], [.18, .4], [.13, .64], [.115, .79],
    [.16, .818], [.224, .835], [.23, .863], [.207, .888], [.125, .908], [.11, .95], [0, .97]]);
  const head = turned([[0, .94], [.105, .956], [.16, 1.007], [.186, 1.085], [.17, 1.165], [.125, 1.242], [.055, 1.31], [0, 1.34]]);
  const normal = new T.Vector3(0, .6, .8), offset = .802, gap = .014;
  // Stop the cut above the neck so the head remains physically joined at its foot.
  const bottom = clipped(head, new T.Plane(new T.Vector3(0, -1, 0), 1.025));
  const top = clipped(head, new T.Plane(new T.Vector3(0, 1, 0), -1.025));
  const left = clipped(top, new T.Plane(normal, -offset - gap));
  const right = clipped(top, new T.Plane(normal.clone().negate(), offset - gap));
  head.dispose(); top.dispose();
  return finish([body, bottom, left, right, sphere(0, 1.36, 0, .047)]);
}

function queen() {
  const parts = [turned([...base(.385), [.268, .28], [.2, .41], [.145, .72], [.128, .94],
    [.16, .976], [.238, .992], [.248, 1.021], [.221, 1.046], [.145, 1.061],
    [.142, 1.11], [.195, 1.23], [.246, 1.32], [.247, 1.345], [.202, 1.351], [.14, 1.285], [0, 1.276]]),
    turned([[0, 1.26], [.10, 1.28], [.113, 1.32], [.09, 1.363], [.045, 1.384], [0, 1.386]]), sphere(0, 1.424, 0, .056)];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    parts.push(sphere(Math.cos(a) * .226, 1.365, Math.sin(a) * .226, .039));
  }
  return finish(parts);
}
function king() {
  const parts = [turned([...base(.405), [.29, .28], [.217, .43], [.157, .79], [.139, 1.01],
    [.19, 1.04], [.26, 1.063], [.266, 1.092], [.24, 1.116], [.158, 1.13],
    [.16, 1.2], [.224, 1.325], [.23, 1.355], [.196, 1.384], [.116, 1.408], [.098, 1.445], [0, 1.448]])];
  // A single beveled cross silhouette avoids the seam of two intersecting bars.
  const cross = new T.Shape();
  const points = [[-.038,0],[.038,0],[.038,.13],[.115,.13],[.115,.205],[.038,.205],[.038,.292],[-.038,.292],[-.038,.205],[-.115,.205],[-.115,.13],[-.038,.13]];
  cross.moveTo(...points[0]); for (const p of points.slice(1)) cross.lineTo(...p); cross.closePath();
  const g = new T.ExtrudeGeometry(cross, { depth: .058, bevelEnabled: true, bevelSize: .009, bevelThickness: .009, bevelSegments: 3, steps: 1 });
  g.translate(0, 1.43, -.029); parts.push(g); return finish(parts);
}

const builders = { [PAWN]: pawn, [KNIGHT]: knight, [BISHOP]: bishop, [ROOK]: rook, [QUEEN]: queen, [KING]: king };
const cache = new Map();
export function pieceGeometry(type) {
  if (!cache.has(type)) cache.set(type, builders[type]());
  return cache.get(type);
}
