import * as THREE from '/evermile/vendor/three.module.js';

// A broad chassis penumbra and four tighter contact patches share one texture and draw.
let texture;
export function vehicleShadowMaterial() {
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
    patch(64, 128, 64, 128, 0.97, 0.63);
    for (const x of [30, 98]) for (const y of [67, 189]) patch(x, y, 18, 24, 0.94, 0.22);
    texture = new THREE.CanvasTexture(canvas);
  }
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
}
