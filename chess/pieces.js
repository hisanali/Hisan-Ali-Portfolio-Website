import * as T from '../evermile/vendor/three.module.js';
import { mergeGeometries } from '../evermile/vendor/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from '../evermile/vendor/geometries/RoundedBoxGeometry.js';
import { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } from './engine.js?v=1';

const SEGMENTS = 64;
const v = (x, y) => new T.Vector2(x, y);
const arc = (cx, cy, r, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + (a1 - a0) * i / n; return v(Math.max(0, cx + Math.cos(a) * r), cy + Math.sin(a) * r);
});
const base = R => [v(0, 0), v(R * .97, 0), ...arc(R * .97, .045, .045, -Math.PI / 2, Math.PI / 2, 6), v(R * .9, .1), v(R * .86, .125),
  ...arc(R * .86, .16, .035, -Math.PI / 2, Math.PI / 2, 6), v(R * .8, .2), v(R * .7, .235)];
const lathe = points => new T.LatheGeometry(points, SEGMENTS).toNonIndexed();
const flat = g => (g.index ? g.toNonIndexed() : g);

function finish(parts) {
  const merged = mergeGeometries(parts.map(flat).map(g => { g.deleteAttribute('uv1'); return g; }), false);
  merged.computeBoundingBox();
  return merged;
}

function pawn() {
  return finish([lathe([...base(.34), v(.24, .27), v(.19, .33), v(.155, .44), v(.135, .55), v(.215, .575), v(.23, .6), v(.215, .63), v(.13, .655),
    ...arc(0, .82, .175, -1.05, Math.PI / 2, 16)])]);
}

function rook() {
  const parts = [lathe([...base(.38), v(.3, .28), v(.27, .34), v(.255, .55), v(.255, .72), v(.28, .79), v(.33, .81), v(.335, .85), v(.3, .87),
    v(.295, .9), v(.31, 1.0), v(.31, 1.0), v(.22, 1.0), v(.22, .97), v(0, .97)])];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, merlon = new RoundedBoxGeometry(.15, .13, .09, 2, .02);
    merlon.rotateY(-a); merlon.translate(Math.cos(a) * .265, 1.05, Math.sin(a) * .265); parts.push(merlon);
  }
  return finish(parts);
}

// Side profile of a Staunton horse head; the snout points along +x.
const KNIGHT_PROFILE = [[-.3, 0], [.22, 0], [.3, .12], [.3, .27], [.21, .42], [.17, .52], [.27, .565], [.4, .585], [.5, .625], [.475, .665], [.525, .705],
  [.505, .785], [.37, .875], [.23, .975], [.15, 1.045], [.13, 1.14], [.07, 1.25], [.0, 1.14], [-.1, 1.085], [-.22, .985], [-.32, .8], [-.365, .56], [-.36, .3], [-.335, .1]];

function knight() {
  const shape = new T.Shape(); shape.moveTo(...KNIGHT_PROFILE[0]); shape.splineThru(KNIGHT_PROFILE.slice(1).map(([x, y]) => v(x, y))); shape.closePath();
  const head = new T.ExtrudeGeometry(shape, { depth: .16, bevelEnabled: true, bevelThickness: .1, bevelSize: .07, bevelSegments: 8, curveSegments: 80 });
  head.translate(0, 0, -.08);
  head.scale(.84, .84, 1); head.rotateY(Math.PI / 2); head.translate(0, .3, .03);
  const mane = new T.TubeGeometry(new T.CatmullRomCurve3([[-.12, 1.1], [-.24, 1.0], [-.33, .82], [-.37, .58], [-.36, .34]].map(([x, y]) => new T.Vector3(x * .84, y * .84 + .31, 0))), 40, .045, 10, false);
  mane.rotateY(Math.PI / 2); mane.translate(0, 0, .03);
  const eyes = [-1, 1].map(s => { const e = new T.SphereGeometry(.03, 16, 10); e.scale(.6, 1, 1.25); e.translate(s * .172, .31 + .93 * .84, .03 - .17 * .84); return e; });
  const nostrils = [-1, 1].map(s => { const e = new T.TorusGeometry(.022, .008, 6, 16); e.rotateY(Math.PI / 2); e.translate(s * .176, .31 + .69 * .84, .03 - .47 * .84); return e; });
  const collar = lathe([v(.27, .29), v(.31, .3), v(.315, .34), v(.29, .365), v(.22, .375), v(0, .375)]);
  return finish([lathe([...base(.38), v(.3, .27), v(.28, .3)]), collar, head, mane, ...eyes, ...nostrils]);
}

function bishop() {
  return finish([lathe([...base(.36), v(.26, .28), v(.2, .36), v(.155, .58), v(.13, .74), v(.225, .765), v(.24, .8), v(.215, .83), v(.12, .85),
    v(.15, .9), v(.185, .99), v(.18, 1.08), v(.14, 1.17), v(.08, 1.24), v(.04, 1.275), ...arc(0, 1.33, .055, -1.2, Math.PI / 2, 10)]),
    (() => { const slit = new T.TorusGeometry(.17, .012, 6, 32, 1.4); slit.rotateZ(.9); slit.translate(-.02, .95, 0); return slit; })()]);
}

function queen() {
  const parts = [lathe([...base(.4), v(.29, .28), v(.22, .38), v(.165, .66), v(.14, .9), v(.24, .925), v(.255, .96), v(.22, .99), v(.15, 1.0),
    v(.17, 1.08), v(.23, 1.19), v(.25, 1.23), v(.21, 1.24), v(.15, 1.27), v(.13, 1.31), ...arc(0, 1.37, .07, -1.1, Math.PI / 2, 12)])];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, s = new T.SphereGeometry(.042, 14, 10); s.translate(Math.cos(a) * .232, 1.265, Math.sin(a) * .232); parts.push(s); }
  return finish(parts);
}

function king() {
  const parts = [lathe([...base(.42), v(.31, .28), v(.24, .4), v(.175, .78), v(.15, .98), v(.265, 1.005), v(.275, 1.045), v(.225, 1.075), v(.16, 1.085),
    v(.18, 1.16), v(.24, 1.29), v(.245, 1.33), v(.19, 1.355), v(.12, 1.38), v(.1, 1.42), v(0, 1.43)])];
  const upright = new RoundedBoxGeometry(.075, .3, .075, 2, .02); upright.translate(0, 1.56, 0);
  const bar = new RoundedBoxGeometry(.21, .075, .075, 2, .02); bar.translate(0, 1.6, 0);
  parts.push(upright, bar);
  return finish(parts);
}

const builders = { [PAWN]: pawn, [KNIGHT]: knight, [BISHOP]: bishop, [ROOK]: rook, [QUEEN]: queen, [KING]: king };
const cache = new Map();
export function pieceGeometry(type) {
  if (!cache.has(type)) cache.set(type, builders[type]());
  return cache.get(type);
}
