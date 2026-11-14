export const TAU = Math.PI * 2, RAD = Math.PI / 180;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// A smooth curve through keyframes that never overshoots, so held values stay flat.
export function track(keys) {
  const n = keys.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return p => {
    if (p <= keys[0][0]) return keys[0][1];
    if (p >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (p > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], t = (p - keys[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

export function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }

// The colour of glowing steel at a temperature in degrees Celsius. Mirrors fBlackbody in the steel shader.
export function blackbody(T) {
  const x = clamp((T - 480) / 820), mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  let c = mix([.55, .02, 0], [1, .16, .01], smooth(0, .3, x));
  c = mix(c, [1, .42, .06], smooth(.25, .55, x));
  c = mix(c, [1, .72, .3], smooth(.5, .8, x));
  c = mix(c, [1, .93, .78], smooth(.78, 1, x));
  const k = Math.pow(x, 2.2) * 3.1 + x * .55;
  return c.map(v => v * k);
}
// What a smith would call the metal at this temperature.
export const heatName = T => T >= 1150 ? 'White heat' : T >= 980 ? 'Yellow heat' : T >= 830 ? 'Orange heat' : T >= 700 ? 'Cherry red' : T >= 560 ? 'Dull red' : T >= 420 ? 'Black heat' : T >= 190 ? 'Temper colours' : 'Cold steel';
