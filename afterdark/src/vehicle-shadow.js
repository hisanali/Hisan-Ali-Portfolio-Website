import * as THREE from '/evermile/vendor/three.module.js';

// A broad chassis penumbra and four tighter contact patches share one texture and draw.
const textures = new Map();
export function vehicleShadowMaterial(wheels, width, length) {
  const contacts = wheels ? wheels.map(({x, z}) => [
    Math.round(128 * (.5 + x / (width * 1.6))),
    Math.round(256 * (.5 + z / (length * 1.32)))
  ]) : [[30,67], [98,67], [30,189], [98,189]];
  const key = contacts.join('|');
  let texture = textures.get(key);
  if (!texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const patch = (x, y, width, length, power, core) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(width, length);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, 'rgba(0,0,0,' + power + ')');
      gradient.addColorStop(core, 'rgba(0,0,0,' + power * 0.78 + ')');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    };
    // Overlapping axle and floor shadows follow the body footprint.
    patch(64, 136, 43, 75, .38, .42);
    patch(64, 74, 39, 33, .28, .35);
    patch(64, 184, 38, 32, .26, .35);
    for (const [x, y] of contacts) patch(x, y, 8, 12, .78, .16);
    texture = new THREE.CanvasTexture(canvas);
    textures.set(key, texture);
  }
  return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
}
