import * as T from './vendor/three.module.js';
import {scanned, maps} from './materials.js?v=20261103-realism1';
import {canvasTexture} from './scenery.js?v=20260927-train1';
import {clone as cloneSkin} from './vendor/utils/SkeletonUtils.js';
import {fitCitizen} from './citizen-assets.js?v=20260927-train1';

// Rooms you walk into: a shop, a café, the petrol-station shop. Each is built once as a small cell well below the
// world (the door you came in by leads back out), furnished for what it sells, with a shopkeeper behind the counter.
const PALETTES = {'CAFÉ AROMA': [0xe9dcc9, 0x6b4a33, 0xb7854f], 'TEA HOUSE': [0xe6e2d3, 0x4a5a44, 0xcbb089], BAKERY: [0xf3e7d2, 0x8a5a3c, 0xe0b071], 'MINI MARKET': [0xe8ecef, 0x2f5d7a, 0xd34b3a], GROCERY: [0xeef0e6, 0x3f6b3a, 0xd9a05b], PHARMACY: [0xf2f6f7, 0x2b8a6e, 0xffffff], 'BOOKS & CO': [0xe9e3d6, 0x5a3b2e, 0x8b6e4e], PIZZA: [0xf1e3d0, 0xa8322d, 0x2f5d45], FLOWERS: [0xf4eef0, 0x5e7f5a, 0xd96c8a], HARDWARE: [0xe6e6e2, 0x3a3a3c, 0xe0a030], TAILOR: [0xeae4dc, 0x3b3b4f, 0xc8b7a0], 'FRESH FRUIT': [0xf0f1e4, 0x4f7a3f, 0xe8a23a], 'ICE CREAM': [0xf6eef3, 0x7ec8d8, 0xf2a5c2], BARBER: [0xeeeeee, 0x1f2a36, 0xc9302c], 'TEA': [0xe6e2d3, 0x4a5a44, 0xcbb089], ELECTRONICS: [0xe4e8ee, 0x1b2733, 0x29b6f6], SWEETS: [0xfbf0f4, 0xd96c8a, 0x7ec8d8], 'PETROL STATION': [0xe8ecef, 0x1f3a5a, 0xf2b705], 'ROADSIDE CAFÉ': [0xf1e6d2, 0x2f5d45, 0x6b4a33]};
const CELL_Y = -900, CELL_GAP = 60;

export class Interiors {
  constructor(scene, settings) {
    this.scene = scene; this.settings = settings; this.cells = new Map(); this.count = 0; this.current = null;
    this.floorMat = new T.MeshStandardMaterial({color: 0xd8d2c6, roughness: .55, metalness: .05});
    this.tile = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#c9c2b4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b1aa9c'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); } });
    this.tile.wrapS = this.tile.wrapT = T.RepeatWrapping; this.tile.repeat.set(4, 3.5); this.floorMat.map = this.tile;
    this.wall = scanned('plaster', {}, 2.6); this.wood = new T.MeshStandardMaterial({color: 0x6b4a33, roughness: .8}); this.dark = new T.MeshStandardMaterial({color: 0x2c2f33, roughness: .85}); this.glass = new T.MeshPhysicalMaterial({color: 0xa6c4d0, transparent: true, opacity: .35, roughness: .1});
  }
  // A cell for this place (built on first entry, kept). `name` picks the stock and the look.
  cell(key, name, stock) {
    if (this.cells.has(key)) return this.cells.get(key);
    const index = this.count++, g = new T.Group(), x0 = index * CELL_GAP, [wallTint, accent, product] = PALETTES[name] || [0xe9e3d6, 0x3f4a55, 0xc98b2b];
    g.position.set(x0, CELL_Y, 0); this.scene.add(g);
    const W = 9, D = 7, H = 3.2, box = (mat, w, h, d, x, y, z, ry = 0) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; };
    const colliders = [], solid = (x, z, hx, hz) => colliders.push({x: x0 + x, z, hx, hz, c: 1, s: 0, r: 0});
    box(this.floorMat, W, .1, D, 0, -.05, 0);
    const ceiling = box(new T.MeshStandardMaterial({color: 0xf4f2ec, roughness: .9}), W, .1, D, 0, H, 0);
    const tint = new T.MeshStandardMaterial({color: wallTint, roughness: .85, map: this.wall.map, normalMap: this.wall.normalMap, normalScale: new T.Vector2(.35, .35)});
    box(tint, W, H, .15, 0, H / 2, -D / 2); box(tint, .15, H, D, -W / 2, H / 2, 0); box(tint, .15, H, D, W / 2, H / 2, 0);
    // The street wall: windows either side of the door, the door is the way out.
    const front = D / 2; box(tint, 2.2, H, .15, -W / 2 + 1.1, H / 2, front); box(tint, 2.2, H, .15, W / 2 - 1.1, H / 2, front); box(tint, W, .6, .15, 0, H - .3, front);
    box(this.glass, 2.2, 2, .06, -W / 2 + 2.3, 1.5, front); box(this.glass, 2.2, 2, .06, W / 2 - 2.3, 1.5, front);
    box(this.wood, .12, 2.5, .2, -.7, 1.25, front); box(this.wood, .12, 2.5, .2, .7, 1.25, front); box(this.wood, 1.5, .12, .2, 0, 2.55, front);
    solid(0, -D / 2, W / 2, .1); solid(-W / 2, 0, .1, D / 2); solid(W / 2, 0, .1, D / 2); solid(-W / 2 + 1.75, front, 1.75, .1); solid(W / 2 - 1.75, front, 1.75, .1);
    // Counter at the back with the keeper behind it; shelves of product along the side walls.
    const counterMat = new T.MeshStandardMaterial({color: accent, roughness: .6, metalness: .1});
    box(counterMat, 4.2, 1.05, .8, 0, .525, -D / 2 + 1.6); box(this.wood, 4.4, .06, .9, 0, 1.08, -D / 2 + 1.6); solid(0, -D / 2 + 1.6, 2.1, .4);
    const shelfMat = new T.MeshStandardMaterial({color: 0xcfc9bd, roughness: .8});
    for (const side of [-1, 1]) { for (let k = 0; k < 3; k++) { const y = .6 + k * .75; box(shelfMat, .4, .04, 5, side * (W / 2 - .35), y, -.3); for (let i = 0; i < 9; i++) { const pm = new T.MeshStandardMaterial({color: new T.Color(product).offsetHSL((i % 3) * .08 - .08, 0, (i % 2) * .08), roughness: .5 + (i % 2) * .3, metalness: name === 'HARDWARE' || name === 'ELECTRONICS' ? .5 : .05 }); box(pm, .26, .22 + (i % 3) * .08, .26, side * (W / 2 - .35), y + .14, -2.6 + i * .55); } } solid(side * (W / 2 - .35), -.3, .3, 2.5); }
    // Café: tables and chairs; the petrol shop: a drinks fridge; barber: a chair and mirror.
    if (/CAF|TEA|BAKERY|ICE|PIZZA|SWEET/.test(name)) for (const [tx, tz] of [[-2.4, .6], [2.4, .6], [-2.4, -1.8], [2.4, -1.8]]) { box(this.wood, .9, .06, .9, tx, .76, tz); box(this.dark, .08, .74, .08, tx, .37, tz); for (const [cx, cz] of [[tx - .75, tz], [tx + .75, tz]]) { box(this.wood, .4, .05, .4, cx, .46, cz); box(this.wood, .05, .9, .4, cx + (cx < tx ? -.17 : .17), .6, cz); } solid(tx, tz, .9, .9); }
    if (name === 'PETROL STATION' || name === 'MINI MARKET' || name === 'GROCERY') { const fridge = box(new T.MeshStandardMaterial({color: 0xffffff, roughness: .4, metalness: .3}), 1.4, 2, .7, 2.6, 1, -D / 2 + .5); box(new T.MeshStandardMaterial({color: 0x9ad8ff, emissive: 0x66c0ff, emissiveIntensity: .8}), 1.2, 1.7, .05, 2.6, 1.05, -D / 2 + .86); solid(2.6, -D / 2 + .5, .7, .35); }
    if (name === 'BARBER') { box(this.dark, .7, .5, .7, 2.3, .5, 0); box(this.dark, .7, .9, .12, 2.3, 1.2, -.3); box(new T.MeshStandardMaterial({color: 0xdde6ee, metalness: .9, roughness: .05}), 1.2, 1, .05, W / 2 - .12, 1.6, 0, Math.PI / 2); solid(2.3, 0, .4, .4); }
    // Sign over the counter and a light.
    const sign = canvasTexture(1024, 192, (c, w, h) => { c.fillStyle = '#' + new T.Color(accent).getHexString(); c.fillRect(0, 0, w, h); c.fillStyle = '#f7f3ea'; c.font = '600 96px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2); });
    const signMesh = new T.Mesh(new T.PlaneGeometry(4.2, .8), new T.MeshStandardMaterial({map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: .25, roughness: .6})); signMesh.position.set(0, 2.45, -D / 2 + .09); g.add(signMesh);
    const lamp = new T.PointLight(0xfff0d8, 18, 14, 2); lamp.position.set(0, H - .25, 0); g.add(lamp);
    const amb = new T.PointLight(0xdde8ff, 6, 12, 2); amb.position.set(0, 2, 2.6); g.add(amb);
    const exit = canvasTexture(256, 96, (c, w, h) => { c.fillStyle = '#2f5d45'; c.fillRect(0, 0, w, h); c.fillStyle = '#e9f4df'; c.font = '600 56px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXIT', w / 2, h / 2); });
    const exitMesh = new T.Mesh(new T.PlaneGeometry(.9, .34), new T.MeshStandardMaterial({map: exit, emissive: 0xffffff, emissiveMap: exit, emissiveIntensity: .6})); exitMesh.position.set(0, 2.8, front - .12); exitMesh.rotation.y = Math.PI; g.add(exitMesh);
    const cell = {key, name, stock, group: g, x0, colliders, door: {x: x0, z: front - .9, yaw: 0}, counter: {x: x0, z: -D / 2 + 2.5}, keeper: null, keeperSpot: {x: x0, z: -D / 2 + .85}, floorY: CELL_Y, ceiling};
    this.cells.set(key, cell); return cell;
  }
  // The keeper: one of the civilians, idling behind the counter, dressed from the loaded assets when they are in.
  keep(cell, asset, key) {
    if (!asset || cell.keeperKey === key) return;
    if (cell.keeper) { cell.keeper.mixer?.stopAllAction(); cell.group.remove(cell.keeper.root); }
    const model = cloneSkin(asset.scene); fitCitizen(model, 4); model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
    const root = new T.Group(); root.add(model); root.position.set(0, 0, cell.keeperSpot.z); root.rotation.y = 0; cell.group.add(root);
    const mixer = new T.AnimationMixer(model), idle = mixer.clipAction(asset.animations.find((a) => a.name === 'Idle') || asset.animations[0]); idle.play();
    cell.keeper = {root, mixer}; cell.keeperKey = key;
  }
  update(dt) { for (const c of this.cells.values()) c.keeper?.mixer.update(dt); }
}
