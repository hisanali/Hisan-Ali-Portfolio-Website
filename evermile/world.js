import {Landmarks} from './landmarks.js?v=20260926-people3';
import {upgradeSurfaces} from './materials.js?v=20260926-people3';
import * as T from './vendor/three.module.js';
import {random, noise, lerp, smooth, clamp, hashSeed} from './math.js?v=20260926-people3';
import {Network, TYPES, ZONE, SEA} from './network.js?v=20260926-people3';
import {Scenery} from './scenery.js?v=20260926-people3';
import {Roadside} from './roadside.js?v=20260926-people3';
import {sheltered} from './atmosphere.js?v=20260926-people3';

// The landscape around the road network: terrain, road surfaces, trees, rocks, grass and guard rails, built in 240 m chunks.
const scratch = new T.Object3D(), col = new T.Color(), col2 = new T.Color();
export const CHUNK = 240, ROW = 5, ROWS = CHUNK / ROW + 1, SNOWLINE = 118;
// Terrain columns across the road: exact at the road edge, 25 fine columns out to 130 m, then coarser to the horizon.
const FAR = [155, 185, 222, 266, 320, 390, 470, 560, 680, 850];
function columnsFor(half) {
  const fine = [], step = (130 - half - 3) / 24;
  for (let k = 0; k < 25; k++) fine.push(half + 3 + k * step);
  const side = [half * .5, half + .25, half + .9, ...fine, ...FAR];
  return [...side.slice().reverse().map((v) => -v), 0, ...side];
}
export const COLS = columnsFor(5.3).length;

export const THEMES = {summer: {ground: 0x8c9e56, tree: 0x5f8a4a, horizon: 0xc4d6dc, sky: 0x6495c5}, spring: {ground: 0x7da555, tree: 0x5a8249, horizon: 0xd2e3e0, sky: 0x86b7d9}, autumn: {ground: 0x8b794c, tree: 0xa46930, horizon: 0xd6c9ad, sky: 0x8dabb9}, winter: {ground: 0xd7dedd, tree: 0x788c82, horizon: 0xd6e0e6, sky: 0x8faecb}, mars: {ground: 0x977151, tree: 0x795841, horizon: 0xd0b090, sky: 0x857969}, moon: {ground: 0x878c91, tree: 0x777777, horizon: 0x303845, sky: 0x050a14}, venus: {ground: 0xa89053, tree: 0x967945, horizon: 0xdbbc72, sky: 0x998045}};

function texture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d'), rng = random(9);
  ctx.fillStyle = '#dcd7c3'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 45000; i++) { const v = Math.floor(85 + rng() * 100); ctx.fillStyle = `rgba(${v},${v},${v},.13)`; const r = rng() * 2 + .3; ctx.fillRect(rng() * 512, rng() * 512, r, r); }
  for (let i = 0; i < 68000; i++) { const x = rng() * 512, y = rng() * 512; ctx.strokeStyle = rng() > .5 ? '#77775c40' : '#faf2cc60'; ctx.lineWidth = .4 + rng() * .7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2 + rng() * 4, y - 2 - rng() * 7); ctx.stroke(); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function foliageTexture(grass = false) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'), rand = random(grass ? 82 : 53);
  if (grass) { for (let i = 0; i < 90; i++) { const x = rand() * 256, h = 25 + rand() * 210, g = ctx.createLinearGradient(0, 256, 0, 256 - h), r0 = 130 + rand() * 75, g0 = 135 + rand() * 70, b0 = 95 + rand() * 65; g.addColorStop(0, `rgb(${r0 * .5},${g0 * .55},${b0 * .5})`); g.addColorStop(1, `rgb(${r0},${g0},${b0})`); ctx.strokeStyle = g; ctx.lineWidth = 1 + rand() * 2; ctx.beginPath(); ctx.moveTo(x, 256); ctx.quadraticCurveTo(x + (rand() - .5) * 40, 256 - h * .65, x + (rand() - .5) * 65, 256 - h); ctx.stroke(); } }
  else { for (let i = 0; i < 1600; i++) { const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 105, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r; const shade = 1.22 - (y / 256) * .5 - (r / 105) * .1, lum = Math.min(255, (92 + rand() * 125) * shade); ctx.fillStyle = `rgb(${lum * .9},${lum},${lum * .79})`; ctx.beginPath(); ctx.ellipse(x, y, 2 + rand() * 5, 2 + rand() * 2, rand() * 6, 0, Math.PI * 2); ctx.fill(); } }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
function pineTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const ctx = c.getContext('2d'), rand = random(31);
  ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(128, 512); ctx.lineTo(128, 30); ctx.stroke();
  const tiers = 22;
  for (let t = 0; t < tiers; t++) { const k = t / (tiers - 1), y = 492 - k * 460, w = (1 - k) * 112 + 12; for (const side of [-1, 1]) { const reach = w * (.85 + rand() * .25), clumps = Math.floor(reach * .9) + 6; for (let i = 0; i < clumps; i++) { const u = Math.pow(rand(), .8), bx = 128 + side * reach * u, by = y + reach * .3 * u * u - rand() * 14 * (1 - u * .5), r = (9 + rand() * 10) * (1 - u * .45); const lum = 55 + rand() * 55, lit = by < y - 4 ? 1.25 : .9; ctx.fillStyle = `rgb(${lum * .42 * lit | 0},${lum * .72 * lit | 0},${lum * .46 * lit | 0})`; ctx.beginPath(); for (let n = 0; n < 9; n++) { const a = n / 9 * Math.PI * 2, rr = r * (.55 + rand() * .55), px = bx + Math.cos(a) * rr, py = by + Math.sin(a) * rr * .55; n ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.fill(); } } }
  ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { ctx.beginPath(); ctx.arc(rand() * 256, rand() * 512, 1 + rand() * 2.2, 0, Math.PI * 2); ctx.fill(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

// Asphalt with road markings for each kind of road. The texture spans the full width (u 0..1) and repeats every 32 m.
function roadTexture(kind) {
  const W = kind === 'highway' ? 2048 : 1024, S = 1024, c = document.createElement('canvas'); c.width = W; c.height = S;
  const ctx = c.getContext('2d'), rng = random(717 + W);
  // Asphalt grain, written straight into the pixels: fine speckle with the odd light or dark stone.
  const img = ctx.createImageData(W, S), px = img.data, base = kind === 'farm' ? 93 : 86;
  for (let i = 0, n = W * S; i < n; i++) { const r = rng(), g = (r - .5) * 40 + (r > .965 ? 34 : r < .03 ? -26 : 0), k = i * 4; px[k] = base + g; px[k + 1] = base + 2 + g; px[k + 2] = base + 4 + g; px[k + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 5000 * W / 1024; i++) { ctx.fillStyle = rng() > .5 ? 'rgba(200,196,188,.22)' : 'rgba(24,24,26,.24)'; const r = rng() * 1.3 + .6; ctx.beginPath(); ctx.arc(rng() * W, rng() * S, r, 0, 6.3); ctx.fill(); }
  const track = (cx) => { for (const o of [-.07, .07]) { const g = ctx.createLinearGradient((cx + o - .05) * W, 0, (cx + o + .05) * W, 0); g.addColorStop(0, 'rgba(20,20,22,0)'); g.addColorStop(.5, 'rgba(20,20,22,.22)'); g.addColorStop(1, 'rgba(20,20,22,0)'); ctx.fillStyle = g; ctx.fillRect((cx + o - .05) * W, 0, .1 * W, S); } };
  const paint = (x, y, w, h, colr = '#e8e6dc') => { ctx.fillStyle = colr; ctx.fillRect(x, y, w, h); for (let i = 0; i < w * h / 10; i++) { ctx.fillStyle = 'rgba(70,70,72,.55)'; ctx.fillRect(x + rng() * w, y + rng() * h, 1.5, 1.5); } };
  for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(34,35,37,${.14 + rng() * .1})`; const x = rng() * .8 * W + .1 * W, y = rng() * S, w = (.05 + rng() * .12) * W, h = (.04 + rng() * .1) * S; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(15,15,15,.22)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); }
  ctx.strokeStyle = 'rgba(18,18,20,.55)'; for (let i = 0; i < 14; i++) { let x = rng() * W, y = rng() * S; ctx.lineWidth = .8 + rng() * 1.4; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 9; k++) { x += (rng() - .5) * 38; y += rng() * 30; ctx.lineTo(x, y); } ctx.stroke(); }
  if (kind === 'highway') {
    // 23.2 m across: carriageway, 3.4 m median, carriageway. Solid edge lines, dashed lane lines.
    const m = (metres) => (metres + 11.6) / 23.2 * W;
    ctx.fillStyle = '#6a6c6a'; ctx.fillRect(m(-1.7), 0, m(1.7) - m(-1.7), S);
    for (const sgn of [-1, 1]) { track((m(sgn * 4) / W)); track(m(sgn * 7.6) / W);
      paint(m(sgn * 2.2) - 7, 0, 14, S, '#e8d88a'); paint(m(sgn * 9.4) - 7, 0, 14, S);
      for (const y0 of [40, 552]) paint(m(sgn * 5.8) - 6, y0, 12, 300); }
  } else if (kind === 'farm') {
    track(.3); track(.7);
    // Crumbling unmarked edges, grass creeping in.
    for (let i = 0; i < 900; i++) { const edge = rng() < .5 ? rng() * 26 : W - rng() * 26; ctx.fillStyle = rng() < .5 ? 'rgba(90,100,60,.35)' : 'rgba(40,40,36,.35)'; ctx.fillRect(edge, rng() * S, 2 + rng() * 4, 2 + rng() * 6); }
    paint(W / 2 - 5, 60, 10, 200); paint(W / 2 - 5, 572, 10, 200);
  } else {
    track(.27); track(.73);
    paint(22, 0, 11, S); paint(W - 33, 0, 11, S);
    if (kind === 'mountain') { paint(W / 2 - 16, 0, 10, S); paint(W / 2 + 6, 0, 10, S); }
    else { paint(W / 2 - 6, 40, 12, 380); paint(W / 2 - 6, 552, 12, 380); }
  }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function foliageGeometry(grass = false) {
  const positions = [], uv = [], indices = [];
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3, dx = Math.cos(a), dz = Math.sin(a), n = i * 4; positions.push(-dx, -1, -dz, dx, -1, dz, dx, 1, dz, -dx, 1, -dz); uv.push(0, 0, 1, 0, 1, 1, 0, 1); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals();
  if (grass) g.scale(.55, .4, .55); return g;
}
const ROAD_KIND = {country: 'country', coast: 'country', farm: 'farm', mountain: 'mountain', highway: 'highway'};

export class World {
  constructor(scene, settings, atmo) {
    this.scene = scene; this.settings = settings; this.atmo = atmo; this.chunks = new Map();
    this.road = new Network(settings);
    this.groundTexture = texture('ground');
    this.roadTextures = {country: roadTexture('country'), farm: roadTexture('farm'), mountain: roadTexture('mountain'), highway: roadTexture('highway')};
    this.groundMat = new T.MeshStandardMaterial({vertexColors: true, map: this.groundTexture, bumpMap: this.groundTexture, bumpScale: .25, roughness: 1});
    this.roadMats = {};
    for (const [k, tex] of Object.entries(this.roadTextures)) { const m = new T.MeshStandardMaterial({map: tex, bumpMap: tex, bumpScale: .6, roughness: .88, metalness: .02}); m.userData.kind = k; this.roadMats[k] = m; }
    // Junction branches draw over the main road where they overlap.
    this.stubMats = {};
    for (const [k, m] of Object.entries(this.roadMats)) { const s = m.clone(); s.polygonOffset = true; s.polygonOffsetFactor = -1; s.polygonOffsetUnits = -2; this.stubMats[k] = s; }
    // Inside tunnels the road is lit only by the tunnel lamps and your headlights.
    this.tunnelMats = {};
    for (const [k, m] of Object.entries(this.roadMats)) this.tunnelMats[k] = sheltered(m.clone());
    this.roadMat = this.roadMats.country;
    this.trunkMat = new T.MeshStandardMaterial({color: 0x5c5140, roughness: 1});
    this.leafMat = new T.MeshStandardMaterial({map: foliageTexture(), alphaTest: .45, color: 0xffffff, roughness: .98, side: T.DoubleSide});
    this.rockMat = new T.MeshStandardMaterial({color: 0x868477, roughness: 1});
    this.postMat = new T.MeshStandardMaterial({color: 0x7b7f84, metalness: .6, roughness: .5});
    this.railMat = new T.MeshStandardMaterial({color: 0xc8ccd0, metalness: .85, roughness: .32});
    this.pineMat = new T.MeshStandardMaterial({map: pineTexture(), alphaTest: .42, color: 0xffffff, roughness: .97, side: T.DoubleSide});
    this.markerMat = new T.MeshStandardMaterial({color: 0xf2f2ec, roughness: .6});
    this.reflectorMat = new T.MeshStandardMaterial({color: 0xffb020, emissive: 0x8a4a00, emissiveIntensity: .5, roughness: .3, metalness: .2});
    this.grassMat = new T.MeshStandardMaterial({map: foliageTexture(true), alphaTest: .4, color: 0xffffff, side: T.DoubleSide, roughness: 1});
    this.skirtMat = new T.MeshStandardMaterial({color: 0x4a4a45, roughness: 1});
    this.geos = {trunk: new T.CylinderGeometry(.13, .22, 1, 5), leaves: foliageGeometry(), rock: new T.IcosahedronGeometry(1, 1), post: new T.BoxGeometry(.12, 1.05, .12), rail: new T.BoxGeometry(.07, .34, 6.4), marker: new T.BoxGeometry(.1, 1.05, .1), reflector: new T.BoxGeometry(.12, .16, .12), grass: foliageGeometry(true)};
    this.makeSky();
    this.scenery = new Scenery(this);
    this.roadside = new Roadside(this);
    this.landmarks = new Landmarks(this);
    upgradeSurfaces(this);
    this.updatePalette();
  }

  makeSky(){this.sunDir=new T.Vector3(-.35,.62,.7).normalize();this.moonDir=new T.Vector3(.2,.3,1).normalize();this.lightDir=this.sunDir.clone();
 this.skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x6495c5)},bottom:{value:new T.Color(0xdce7df)},sunDirection:{value:this.sunDir},moonDirection:{value:this.moonDir},sunColor:{value:new T.Color(0xfff6dd)},cloudTint:{value:new T.Color(0xf4f4ef)},cloud:{value:.22},night:{value:0},golden:{value:0},flash:{value:0}},
 vertexShader:`varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 // Sky: height gradient, a sun disc with halo and a warm horizon band at golden hour, a cratered full moon at night, drifting clouds lit by the sun or moon, and stars.
 fragmentShader:`varying vec3 vPosition;uniform vec3 top,bottom,sunDirection,moonDirection,sunColor,cloudTint;uniform float cloud,night,golden,flash;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return .5*n(p)+.25*n(p*2.1)+.125*n(p*4.3)+.0625*n(p*8.7);}
 void main(){vec3 d=normalize(vPosition);float y=max(d.y,0.);vec3 c=mix(bottom,top,pow(y,.5));
  float sun=max(dot(d,sunDirection),0.),day=1.-night;
  c=mix(c,sunColor*1.08,smoothstep(.3,0.,y)*(.28+.5*pow(sun,2.))*golden*day);
  c+=sunColor*(pow(sun,6.)*.12+pow(sun,40.)*.2)*(.6+golden*.7)*day;
  c=mix(c,bottom*1.04,smoothstep(.2,0.,y)*.3*day*(1.-golden*.6));
  float disc=smoothstep(.99988,.99993,dot(d,sunDirection));
  vec3 sunCore=mix(sunColor,vec3(1.,.96,.88),.55)*(golden>.5?6.:14.);
  vec3 lit=c+sunCore*disc*day+sunColor*pow(sun,1200.)*2.*day;
  float m=max(dot(d,moonDirection),0.);vec3 right=normalize(cross(moonDirection,vec3(0,1,0))),up=cross(right,moonDirection);
  vec2 mp=vec2(dot(d,right),dot(d,up))/.0165;float mr=dot(mp,mp);float onMoon=smoothstep(1.,.92,mr)*step(0.,dot(d,moonDirection));
  float maria=smoothstep(.42,.7,fbm(mp*2.4+7.))*.28+smoothstep(.55,.8,fbm(mp*6.+3.))*.12;
  vec3 moon=vec3(1.,.98,.93)*2.4*(.72+.28*sqrt(max(0.,1.-mr)))*(1.-maria);
  lit=mix(lit,moon,onMoon*night);lit+=vec3(.55,.63,.82)*(pow(m,500.)*.35+pow(m,60.)*.1+pow(m,8.)*.05)*night;
  vec2 uv=d.xz/(max(d.y,.03)+.24)*2.1;
  float density=fbm(uv*1.4+5.)*.72+fbm(uv*4.8+17.)*.28;
  float cl=smoothstep(.41,.65,density)*smoothstep(.015,.16,y);
  float relief=clamp((fbm(uv*1.4+5.+sunDirection.xz*.15)-fbm(uv*1.4+5.))*5.,-.25,.25);
  vec3 cloudCol=mix(cloudTint,sunColor*1.2,golden*(.25+.6*pow(sun,2.))*day);cloudCol=mix(cloudCol,vec3(.2,.23,.3)+vec3(.35,.38,.45)*pow(m,6.),night);
  cloudCol*=.76+relief;cloudCol+=sunColor*golden*max(0.,relief)*.6;
  lit=mix(lit,cloudCol,cl*cloud*(1.-night*.35));
  float stars=step(.9984,hash(floor(d.xz/(abs(d.y)+.1)*900.)))*night*smoothstep(0.,.25,y)*(1.-cl*cloud)*(1.-smoothstep(.97,1.,m));
  lit=mix(lit,vec3(.86,.9,1.),flash*.7);gl_FragColor=vec4(lit+stars*.65,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});this.sky=new T.Mesh(new T.SphereGeometry(2400,24,12),this.skyMaterial);this.sky.frustumCulled=false;this.scene.add(this.sky);this.water=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshStandardMaterial({color:0x6e9ca4,roughness:.22,metalness:.55,transparent:true,opacity:.87}));this.water.rotation.x=-Math.PI/2;this.water.position.y=-8;this.scene.add(this.water);this.sky.layers.enable(3);this.water.layers.enable(3);}

  get allRoadMats() { return [...Object.values(this.roadMats), ...Object.values(this.stubMats), ...Object.values(this.tunnelMats)]; }

  // Season and landscape: ground and road looks. Light, sky and fog follow the clock every frame in applyAtmosphere.
  updatePalette() {
    const s = this.settings; this.theme = THEMES[s.location === 'hills' ? s.season : s.planet];
    const hills = s.location === 'hills';
    for (const m of this.allRoadMats) { m.map = hills ? this.roadTextures[m.userData.kind] : this.groundTexture; m.bumpMap = m.map; m.color.set(hills ? (s.season === 'winter' ? 0xa7b1b3 : 0xffffff) : this.theme.ground); m.needsUpdate = true; }
    this.water.visible = hills;
    if (this.atmo) { this.atmo.theme = this.theme; this.atmo.update(0); this.applyAtmosphere(this.atmo, true); }
  }

  applyAtmosphere(a, force = false) {
    const u = this.skyMaterial.uniforms, s = this.settings;
    u.top.value.copy(a.top); u.bottom.value.copy(a.bottom); this.sunDir.copy(a.sunDir); this.moonDir.copy(a.moonDir);
    u.sunColor.value.copy(a.sunColor); u.cloudTint.value.copy(a.cloudTint); u.cloud.value = a.skyCloud;
    u.night.value = a.night; u.golden.value = a.golden * (1 - a.rain);
    this.lightDir.copy(a.lightDir);
    if (!this.scene.fog) this.scene.fog = new T.Fog(0xffffff, 400, 1900);
    this.scene.fog.color.copy(a.bottom); this.scene.fog.near = a.fogNear; this.scene.fog.far = a.fogFar;
    this.water.material.color.set(0x70979c).lerp(col.set(0x958676), a.golden).lerp(col2.set(0x203343), a.night);
    // Lamps and lit windows only need updating when the light level changes noticeably.
    const wet = a.wet > .3 || (s.location === 'hills' && (s.season === 'winter' || s.season === 'spring'));
    if (force || Math.abs(a.lit - (this.moodLit ?? -1)) > .02 || wet !== this.moodWet) {
      this.moodLit = a.lit; this.moodWet = wet;
      this.scenery?.setMood({lit: a.lit, wet});
      this.roadside?.setMood({lit: a.lit});
    }
  }

  makeInstances(group, geo, material, items, shadows = false) {
    if (!items.length) return;
    const mesh = new T.InstancedMesh(geo, material, items.length);
    for (let i = 0; i < items.length; i++) { const p = items[i]; scratch.position.set(...p.p); scratch.rotation.set(...(p.r || [0, 0, 0])); scratch.scale.set(...p.s); scratch.updateMatrix(); mesh.setMatrixAt(i, scratch.matrix); if (p.c !== undefined) mesh.setColorAt(i, col.set(p.c)); }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = shadows; mesh.receiveShadow = true; mesh.computeBoundingSphere(); group.add(mesh);
  }

  columns(z) { return columnsFor(this.road.half(z)); }

  // Height of the rendered terrain triangles at a point, so things rest exactly on the ground you see. Where a chunk is
  // built (or being built) its own grid is used: after a junction choice the road centre, and so the grid, can move
  // before the chunk is rebuilt, and sampling the new grid would put things a metre above or below the drawn ground.
  surfaceHeight(x, z, off = this.settings.location !== 'hills') {
    const index = Math.floor(z / CHUNK), grid = this.building?.index === index ? this.building : this.chunks.get(index)?.userData.grid;
    if (grid && grid.off === off) {
      const i = Math.min(ROWS - 2, Math.floor((z - index * CHUNK) / ROW)), A = grid.rows[i], B = grid.rows[i + 1], t = (z - A.z) / ROW, c0 = A.cols, c1 = B.cols, H = grid.heights, n = COLS;
      const dx = x - lerp(A.cx, B.cx, t);
      let j = 0; while (j < c0.length - 2 && lerp(c0[j + 1], c1[j + 1], t) < dx) j++;
      const lo = lerp(c0[j], c1[j], t), hi = lerp(c0[j + 1], c1[j + 1], t), u = clamp((dx - lo) / (hi - lo), 0, 1);
      const a = H[i * n + j], b = H[i * n + j + 1], c = H[(i + 1) * n + j], d = H[(i + 1) * n + j + 1];
      return u + t <= 1 ? a + (b - a) * u + (c - a) * t : d + (c - d) * (1 - u) + (b - d) * (1 - t);
    }
    const r = this.road, z0 = Math.floor(z / ROW) * ROW, z1 = z0 + ROW, t = (z - z0) / ROW;
    const c0 = this.columns(z0), c1 = this.columns(z1), x0 = r.x(z0), x1 = r.x(z1), dx = x - lerp(x0, x1, t);
    let j = 0; while (j < c0.length - 2 && lerp(c0[j + 1], c1[j + 1], t) < dx) j++;
    const lo = lerp(c0[j], c1[j], t), hi = lerp(c0[j + 1], c1[j + 1], t), u = clamp((dx - lo) / (hi - lo), 0, 1);
    const a = r.terrain(x0 + c0[j], z0, off), b = r.terrain(x0 + c0[j + 1], z0, off), c = r.terrain(x1 + c1[j], z1, off), d = r.terrain(x1 + c1[j + 1], z1, off);
    return u + t <= 1 ? a + (b - a) * u + (c - a) * t : d + (c - d) * (1 - u) + (b - d) * (1 - t);
  }

  buildChunk(index) {
    const group = new T.Group(); group.userData.index = index; group.userData.version = this.road.version;
    const plan = this.scenery.plan(index, CHUNK), fields = this.roadside.blocked(index), townBlocked = plan.blocked, rng = random(this.road.id + index * 331 + 91), r = this.road, off = this.settings.location !== 'hills';
    // Trees and grass keep out of farm fields as well as houses and streets.
    plan.blocked = (x, z) => townBlocked(x, z) || fields(x, z) || this.landmarks.blocked(x, z);
    const pos = [], uv = [], colors = [], indices = [], heights = [], rowInfo = [];
    const base = new T.Color(this.theme.ground), dry = base.clone().multiply(new T.Color(1.22, 1.1, .78)), lush = base.clone().multiply(new T.Color(.74, .9, .7));
    const winter = this.settings.season === 'winter', gravel = new T.Color(winter ? 0xb9bfc0 : 0x8a826f), rock = new T.Color(off ? 0x8a8073 : winter ? 0xaab6b7 : 0x8b8970);
    const sand = new T.Color(0xd8c89a), wetSand = new T.Color(0x9c8f6c), snow = new T.Color(0xf2f5f7), cliff = new T.Color(0x7d7a70);
    for (let i = 0; i < ROWS; i++) {
      const z = index * CHUNK + i * ROW, cx = r.x(z), cols = this.columns(z), roads = r.roadsAt(z);
      rowInfo.push({z, cx, cols, y: r.y(z), half: r.half(z), type: r.typeAt(z), tunnel: r.tunnelAt(z)});
      for (let j = 0; j < cols.length; j++) { const x = cx + cols[j], y = r.terrain(x, z, off); pos.push(x, y, z); heights.push(y); uv.push(x / 7, z / 7); }
    }
    const nc = COLS;
    for (let i = 0; i < ROWS; i++) {
      const R = rowInfo[i];
      for (let j = 0; j < nc; j++) {
        const k = i * nc + j, x = pos[k * 3], y = heights[k], z = R.z;
        const jl = Math.max(0, j - 1), jr = Math.min(nc - 1, j + 1), il = Math.max(0, i - 1), ir = Math.min(ROWS - 1, i + 1);
        const sx = (heights[i * nc + jr] - heights[i * nc + jl]) / Math.max(.5, pos[(i * nc + jr) * 3] - pos[(i * nc + jl) * 3]), sz = (heights[ir * nc + j] - heights[il * nc + j]) / Math.max(1, (ir - il) * ROW);
        const slope = Math.sqrt(sx * sx + sz * sz);
        col.copy(base).lerp(rock, smooth(.6, 1.7, slope) * .72);
        const macro = noise(x * .0065, z * .006, r.id + 17);
        col.lerp(dry, smooth(.55, .85, macro) * .5).lerp(lush, smooth(.45, .15, macro) * .45).multiplyScalar(.87 + noise(x * .029, z * .03, r.id) * .28);
        const road = r.roadUnder(x, z, 1.2);
        const ax = Math.abs(R.cols[j]);
        if (!off) {
          if (ax <= R.half + .9 || (road && !road.main)) col.copy(gravel).multiplyScalar(.9 + noise(x * .3, z * .3, r.id) * .2);
          else if (ax <= R.half + 6) col.lerp(lush, .35);
          // Beaches and rocky shores near the water line; snow on high ground; bare rock on steep mountain faces.
          if (y < SEA + 2.6 && y > SEA - 3) col.copy(y < SEA + .6 ? wetSand : sand).multiplyScalar(.92 + noise(x * .2, z * .2, r.id) * .16);
          if (R.type === 'mountain' || y > SNOWLINE - 10) { col.lerp(cliff, smooth(.9, 1.6, slope) * .8); const line = SNOWLINE + (noise(x * .01, z * .01, r.id + 8) - .5) * 24; if (y > line) col.lerp(snow, smooth(line, line + 14, y) * (1 - smooth(1.4, 2.2, slope) * .6)); }
        }
        colors.push(col.r, col.g, col.b);
        if (i < ROWS - 1 && j < nc - 1) {
          // A hole in the ground at tunnel mouths, where the portal stands.
          const Rn = rowInfo[i + 1], mouth = [R.tunnel, Rn.tunnel].some((t) => t && (Math.abs(R.z - t.start) < 6 || Math.abs(R.z - t.end) < 6 || Math.abs(Rn.z - t.start) < 6 || Math.abs(Rn.z - t.end) < 6));
          if (mouth && Math.abs(R.cols[j]) < R.half + 3.5 && Math.abs(R.cols[j + 1]) < R.half + 3.5) continue;
          const a = k, b = k + nc; indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    group.userData.grid = this.building = {index, rows: rowInfo, heights, off};
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    const ground = new T.Mesh(geo, this.groundMat); ground.receiveShadow = true; group.add(ground);
    this.buildRoads(group, index, rowInfo);
    this.buildVegetation(group, index, plan, rng, rowInfo);
    if (!this.landmarks.active(index * CHUNK + 120)) {
      this.scenery.build(group, plan);
      this.roadside.build(group, index, rowInfo);
    } else {
      group.userData.colliders ||= []; group.userData.lamps = []; group.userData.pumps = [];
      this.landmarks.build(group, index);
    }
    this.building = null;
    group.traverse((o) => o.layers.enable(3));
    this.scene.add(group); this.chunks.set(index, group);
  }

  // Road surfaces: the main road split wherever its kind changes, plus any junction branch passing through this chunk.
  buildRoads(group, index, rowInfo) {
    const r = this.road, z0 = index * CHUNK, z1 = z0 + CHUNK;
    const strip = (rows, mat, skirt) => {
      if (rows.length < 2) return;
      const p = [], u = [], idx = [], sp = [], si = [];
      rows.forEach(([x, y, z, half], n) => {
        p.push(x - half, y, z, x + half, y, z); u.push(0, z / 32, 1, z / 32);
        if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
        if (skirt) { sp.push(x - half, y, z, x - half, y - .8, z, x + half, y, z, x + half, y - .8, z); if (n) { const a = (n - 1) * 4; si.push(a, a + 1, a + 4, a + 1, a + 5, a + 4, a + 2, a + 6, a + 3, a + 3, a + 6, a + 7); } }
      });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(u, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, mat); m.receiveShadow = true; group.add(m);
      if (skirt) { const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals(); const sm = new T.Mesh(sg, this.skirtMat); group.add(sm); }
    };
    let run = [], kind = null;
    const matFor = (k) => (k.startsWith('t:') ? this.tunnelMats[k.slice(2)] : this.roadMats[k]);
    for (const R of rowInfo) {
      const k = (R.tunnel && R.z > R.tunnel.start + 4 && R.z < R.tunnel.end - 4 ? 't:' : '') + ROAD_KIND[R.type];
      if (kind && k !== kind) { run.push([R.cx, R.y + .055, R.z, R.half]); strip(run, matFor(kind)); run = []; }
      kind = k; run.push([R.cx, R.y + .055, R.z, R.half]);
    }
    strip(run, matFor(kind));
    for (const j of r.junctions) {
      if (j.z > z1 || j.z + ZONE < z0) continue;
      const seg = j.options[1 - j.chosen], rows = [], k = ROAD_KIND[seg.type];
      for (let z = Math.max(z0, j.z); z <= Math.min(z1, j.z + ZONE) + .01; z += ROW) rows.push([seg.x(z), seg.y(z) + .062, z, seg.half(z)]);
      strip(rows, this.stubMats[k], true);
      // Where a branch leaves ahead of you, the road you are on gets skirts too (it may now sit above the other branch's ground).
    }
  }

  buildVegetation(group, index, plan, rng, rowInfo) {
    const r = this.road, off = this.settings.location !== 'hills', quality = this.settings.quality, winter = this.settings.season === 'winter';
    const trunks = [], crowns = [], pines = [], rocks = [], posts = [], rails = [], grass = [], markers = [], reflectors = [], flowers = [];
    const onRoad = (x, z, pad) => r.roadUnder(x, z, pad) || (r.railAt(z) && Math.abs(x - r.railX(r.railAt(z), z)) < 7) || r.stopAt(z, 10) && Math.abs(x - r.x(z)) < r.half(z) + 30;
    const count = off ? 12 : quality === 'low' ? 22 : 40;
    for (let i = 0; i < count; i++) {
      const z = index * CHUNK + rng() * CHUNK, type = r.typeAt(z), side = rng() > .43 ? 1 : -1, half = r.half(z);
      const x = r.x(z) + side * (half + 7 + rng() ** 1.7 * 170), y = this.surfaceHeight(x, z, off);
      if (y < SEA + 1 || plan.blocked(x, z) || onRoad(x, z, 5)) continue;
      const size = (3.8 + rng() * 5.2) * (type === 'mountain' ? 1.1 : 1);
      if (off) { rocks.push({p: [x, y + .4, z], s: [size * .3, size * .17, size * .25], r: [rng(), rng() * 6, rng()], c: this.theme.ground}); continue; }
      if (type === 'farm' && rng() < .45) continue;
      trunks.push({p: [x, y + size * .43, z], s: [size * .28, size * .86, size * .28]});
      const high = y > SNOWLINE - 20, evergreen = rng() > (type === 'mountain' ? .08 : type === 'coast' ? .6 : .8) || high;
      if (evergreen) {
        const snowy = winter || y > SNOWLINE + (noise(x * .01, z * .01, r.id + 8) - .5) * 24, pc = col.set(snowy ? 0xe4ece9 : 0xc6d6c0).multiplyScalar(.82 + rng() * .3).getHex(), ph = size * (1.05 + rng() * .35);
        pines.push({p: [x, y + ph, z], s: [size * .44, ph, size * .44], r: [0, rng() * 6, 0], c: pc});
      } else {
        for (let k = 0; k < 7; k++) { const a = k * 2.399, sx = 1.35 + rng(); col.set(this.theme.tree).multiplyScalar(.78 + rng() * .44); crowns.push({p: [x + Math.cos(a) * size * .23, y + size * (.70 + rng() * .40), z + Math.sin(a) * size * .23], s: [size * .31 * sx, size * .34 * sx, size * .31 * sx], r: [rng() * .3, rng() * 6, rng() * .2], c: col.getHex()}); }
      }
    }
    const rockN = r.typeAt(index * CHUNK + CHUNK / 2) === 'mountain' ? 46 : r.typeAt(index * CHUNK + CHUNK / 2) === 'coast' ? 40 : 26;
    for (let i = 0; i < rockN; i++) {
      const z = index * CHUNK + rng() * CHUNK, side = rng() > .5 ? 1 : -1, x = r.x(z) + side * (r.half(z) + 3 + rng() * 44), y = this.surfaceHeight(x, z, off);
      if (y > SEA - 1.5 && !plan.blocked(x, z) && !onRoad(x, z, 1.5)) { const big = y < SEA + 1.2 ? 1.6 : 1; rocks.push({p: [x, y + .1, z], s: [(.3 + rng() * 1.7) * big, (.25 + rng()) * big, (.4 + rng()) * big], r: [rng(), rng() * 6, rng()], c: y > SNOWLINE ? 0xd9dfe2 : winter && !off ? 0xc1cacc : y < SEA + 2 ? 0x6f6a5e : 0x827e6c}); }
    }
    // Guard rails on the drop side; white marker posts with reflectors on the other.
    for (let z = index * CHUNK; z < (index + 1) * CHUNK; z += 6) {
      const sides = this.railSides(z); if (off || !sides.length || !this.railSides(z + 6).length) continue;
      for (const s of sides) {
        const off2 = r.half(z) + .85, x = r.x(z) + s * off2, y = r.y(z); posts.push({p: [x, y + .5, z], s: [1, 1, 1]});
        const z2 = z + 3; rails.push({p: [r.x(z2) + s * (r.half(z2) + .85), r.y(z2) + .85, z2], s: [1, 1, Math.sqrt(1 + r.tangent(z2) ** 2)], r: [-Math.atan(r.slope(z2)), Math.atan(r.tangent(z2)), 0]});
      }
    }
    if (!off) for (let z = index * CHUNK + 12; z < (index + 1) * CHUNK; z += 24) {
      const sides = this.railSides(z); if (sides.length !== 1 || r.typeAt(z) === 'farm') continue;
      const x = r.x(z) - sides[0] * (r.half(z) + 1.4), y = r.y(z); markers.push({p: [x, y + .5, z], s: [1, 1, 1]}); reflectors.push({p: [x, y + .86, z + .02], s: [1, 1, 1]});
    }
    if (!off && !winter) {
      const n = quality === 'low' ? 200 : ['high','ultra'].includes(quality) ? 1000 : 650;
      for (let i = 0; i < n; i++) {
        const z = index * CHUNK + rng() * CHUNK, x = r.x(z) + (rng() > .5 ? 1 : -1) * (r.half(z) + .7 + rng() * 21), y = this.surfaceHeight(x, z);
        if (y < SEA + 2.6 || y > SNOWLINE || plan.blocked(x, z) || onRoad(x, z, .4)) continue;
        col.set(this.theme.ground).multiplyScalar(.82 + rng() * .4); grass.push({p: [x, y + .25, z], s: [1 + rng(), .7 + rng() * .7, 1 + rng()], r: [0, rng() * 6, 0], c: col.getHex()});
      }
    }
    const spring = this.settings.season === 'spring', summer = this.settings.season === 'summer';
    if (!off && (spring || summer)) {
      const n = Math.round((spring ? 700 : 220) * (quality === 'low' ? .35 : quality === 'medium' ? .7 : 1));
      for (let i = 0; i < n; i++) {
        const z = index * CHUNK + rng() * CHUNK; if (noise(z * .012, 3.7, r.id + 29) < (spring ? .38 : .55)) continue;
        const side = rng() > .5 ? 1 : -1, x = r.x(z) + side * (r.half(z) + 1.2 + rng() ** 1.6 * 9), y = this.surfaceHeight(x, z);
        if (y < SEA + 2.6 || y > SNOWLINE - 20 || plan.blocked(x, z) || onRoad(x, z, .6)) continue;
        const sz = .45 + rng() * .35; flowers.push({p: [x, y + sz * .45, z], s: [sz, sz, sz], r: [0, rng() * 6, 0], c: col.set(0xffffff).multiplyScalar(.85 + rng() * .3).getHex()});
      }
    }
    group.userData.colliders = [...trunks.map((t) => ({x: t.p[0], z: t.p[2], r: t.s[0] * .22 + .18})), ...rocks.filter((k) => Math.max(k.s[0], k.s[2]) > .75).map((k) => ({x: k.p[0], z: k.p[2], r: Math.max(k.s[0], k.s[2]) * .8}))];
    this.makeInstances(group, this.geos.marker, this.markerMat, markers, true); this.makeInstances(group, this.geos.reflector, this.reflectorMat, reflectors);
    this.makeInstances(group, this.geos.trunk, this.trunkMat, trunks, true); this.makeInstances(group, this.geos.leaves, this.leafMat, crowns, ['high','ultra'].includes(quality)); this.makeInstances(group, this.geos.leaves, this.pineMat, pines, ['high','ultra'].includes(quality));
    this.makeInstances(group, this.geos.rock, this.rockMat, rocks, true); this.makeInstances(group, this.geos.post, this.postMat, posts, true); this.makeInstances(group, this.geos.rail, this.railMat, rails, true);
    this.makeInstances(group, this.geos.grass, this.grassMat, grass); this.makeInstances(group, this.geos.grass, this.scenery.flowerMat, flowers);
  }

  update(z, camera, immediate = false) {
    this.sky.position.copy(camera.position);
    const center = Math.floor(z / CHUNK), back = 2, front = this.settings.quality === 'low' ? 5 : 8;
    for (const [i, g] of this.chunks) if (i < center - back || i > center + front) { this.disposeChunk(g); this.chunks.delete(i); }
    let built = 0;
    for (let i = center - back; i <= center + front; i++) if (!this.chunks.has(i)) { if (!immediate && built >= 1) return; this.buildChunk(i); built++; }
    // Chunks left over from a road you did not take are replaced one at a time, nearest first, so nothing goes missing.
    for (let i = center - back; i <= center + front; i++) {
      const old = this.chunks.get(i);
      if (old && old.userData.stale) { if (!immediate && built >= 1) return; this.chunks.delete(i); this.buildChunk(i); this.disposeChunk(old); built++; }
    }
  }

  // The road beyond a junction changed: rebuild the chunks past the crest (those before it look the same either way).
  onRouteChange(fromZ, nearZ) {
    for (const [i, g] of this.chunks) if ((i + 1) * CHUNK > fromZ) g.userData.stale = true;
    const c = Math.floor(nearZ / CHUNK);
    for (let i = c - 2; i <= c + 1; i++) { const g = this.chunks.get(i); if (g?.userData.stale) { this.chunks.delete(i); this.buildChunk(i); this.disposeChunk(g); } }
  }

  collidersNear(x, z, range) {
    const out = [], c = Math.floor(z / CHUNK);
    for (let i = c - 1; i <= c + 1; i++) { const g = this.chunks.get(i); if (!g) continue; for (const k of g.userData.colliders || []) if (Math.abs(k.x - x) < range + (k.hx || 0) + (k.hz || 0) && Math.abs(k.z - z) < range + (k.hx || 0) + (k.hz || 0)) out.push(k); }
    return out;
  }

  // What you are driving on: roads (including junction branches), pavements, footpaths on bridges, lay-bys, else the ground.
  groundHeight(x, z) {
    const r = this.road;
    if (this.settings.location !== 'hills') { const d = Math.abs(x - r.x(z)); return d <= r.half(z) ? r.y(z) + .055 : this.surfaceHeight(x, z, true); }
    const road = r.roadUnder(x, z);
    if (road) return road.y + (road.main ? .055 : .062);
    const d = Math.abs(x - r.x(z)), w = r.half(z);
    if (this.landmarks.active(z) && d > w && d < w + 7.5) return r.y(z) + .2;
    if (r.tunnelAt(z) && d < w + 3) return r.y(z) + .055;
    if (d <= w + 3.3 && r.townFactor(z) > .02) return r.y(z) + .075;
    if (d <= w + 1.7 && r.bridgeAt(z)) return r.y(z) + .25;
    for (const st of r.stopsNear(z, 60)) if (r.stopPad(st, x, z)) return r.y(z) + .06;
    const ground = this.surfaceHeight(x, z, false);
    return this.roadside.inField(x, z) ? ground + .06 : ground;
  }

  // Paved surfaces you can drive on without slowing: roads and junction branches, tunnels, town streets, bridge footpaths and lay-bys.
  onPaved(x, z) {
    const r = this.road;
    if (this.settings.location !== 'hills') return Math.abs(x - r.x(z)) <= r.half(z) + .6;
    if (r.roadUnder(x, z, .6)) return true;
    const d = Math.abs(x - r.x(z)), w = r.half(z);
    if (this.landmarks.active(z) && d > w && d < w + 7.5) return r.y(z) + .2;
    if (d < w + 3.3 && (r.tunnelAt(z) || r.townFactor(z) > .02 || r.bridgeAt(z))) return true;
    for (const st of r.stopsNear(z, 70)) if (this.onStopPad(st, x, z)) return true;
    const t = r.townAt(z); if (t && this.scenery.layouts.has(t)) { const cr = this.scenery.layout(t).cross; if (Math.abs(z - cr.z) < cr.street + .5 && d < cr.len) return true; }
    return false;
  }
  onStopPad(st, x, z) { return this.road.stopPad(st, x, z) > 0; }
  // Petrol pumps: the spots beside each pump where a car stops to fill up.
  pumps(z) { const out = [], c = Math.floor(z / CHUNK); for (let i = c - 1; i <= c + 1; i++) for (const p of this.chunks.get(i)?.userData.pumps || []) out.push(p); return out; }
  pumpNear(x, z, radius) { return this.pumps(z).some((p) => Math.hypot(p.x - x, p.z - z) < radius); }
  pumpFor(st) {
    const r = this.road; let best = null;
    for (const p of this.pumps(st.z)) if (p.stop.z === st.z && p.stop.kind === st.kind) { const d = Math.abs(p.x - r.x(p.z)); if (!best || d < best.d - .5 || (Math.abs(d - best.d) < .5 && p.z < best.p.z)) best = {p, d}; }
    return best?.p || null;
  }

  // Which sides have a guard rail here: the drop side on hill roads, the sea side on the coast, the valley side on
  // mountain passes, both sides on the motorway; none in towns, on bridges, in tunnels, at junctions, crossings and lay-bys.
  railSides(z) {
    if (this.landmarks?.active(z)) return [];
    const r = this.road;
    if (this.settings.location !== 'hills') return [(Math.floor(Math.floor(z / CHUNK) / 3) % 3 === 0) ? 1 : -1];
    if (r.townFactor(z) > 0 || r.bridgeAt(z) || r.bridgeAt(z - 8) || r.bridgeAt(z + 8) || r.tunnelAt(z) || r.tunnelAt(z + 8) || r.crossingAt(z, 30) || r.stopAt(z, 14)) return [];
    for (const j of r.junctions) if (z > j.z - 40 && z < j.z + ZONE + 20) return [];
    const s = r.segAt(z), type = s.typeAt(z);
    if (type === 'farm') return [];
    if (type === 'highway') return [-1, 1];
    if (type === 'coast') return [s.type === 'coast' ? s.seaSide : s.parent ? s.parent.seaSide : 1];
    if (type === 'mountain') return [s.upF(z) > 0 ? -1 : 1];
    return [(Math.floor(Math.floor(z / CHUNK) / 3) % 3 === 0) ? 1 : -1];
  }
  railSide(z) { const s = this.railSides(z); return s.length === 1 ? s[0] : 0; }

  disposeChunk(g) { this.scene.remove(g); g.traverse((o) => { if (o.userData.shared) return; if (o.isInstancedMesh) o.dispose(); else if (o.isMesh) o.geometry.dispose(); }); }
  // keepRoute: the same road with other looks (season, width, quality), so the turns you took are kept.
  rebuild(keepRoute = false) { for (const g of this.chunks.values()) this.disposeChunk(g); this.chunks.clear(); this.road = new Network(this.settings, keepRoute && this.road.id === hashSeed(this.settings.seed) ? this.road.route : null); this.scenery.layouts.clear(); this.roadside.fieldCache?.clear(); this.updatePalette(); }
}
