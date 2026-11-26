// Caustics: the moving web of sunlight that waves focus onto anything under water. Shared uniforms (set each frame by
// underwater.js) and the GLSL that lights a surface below the water line with it, strongest in the shallows by day.
import { LAKE } from './frontier-land.js';
export const CAUSTICS = { uCausticK: { value: 0 }, uCausticT: { value: 0 }, uWaterLevel: { value: -0.62 }, uLake: { value: [LAKE.x, LAKE.z, LAKE.rx, LAKE.rz] }, uLakeLevel: { value: LAKE.level } };

export const CAUSTIC_GLSL = `uniform float uCausticK, uCausticT, uWaterLevel, uLakeLevel; uniform vec4 uLake;
float adCaustic(vec2 uv, float t) { // a tileable caustic net (after Dave Hoskins)
  vec2 p = mod(uv * 6.2831, 6.2831) - 250.0, i = p; float c = 1.0, inten = 0.005;
  for (int n = 0; n < 4; n++) { float tt = t * (1.0 - (3.5 / float(n + 1))); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))); }
  c /= 4.0; c = 1.17 - pow(c, 1.4); return pow(abs(c), 5.0); }
vec3 adCaustics(vec3 wpos, vec3 albedo) {
  vec2 lk = (wpos.xz - uLake.xy) / uLake.zw; float depth = (dot(lk, lk) < 1.5 ? uLakeLevel : uWaterLevel) - wpos.y; // the lake or the sea if (depth <= 0.05 || uCausticK <= 0.0) return vec3(0.0);
  float k = uCausticK * smoothstep(0.05, 0.6, depth) * (1.0 - smoothstep(4.0, 22.0, depth));
  return albedo * vec3(0.75, 1.0, 0.95) * k * (adCaustic(wpos.xz / 7.0, uCausticT) * 1.4 + adCaustic(wpos.xz / 4.3 + 3.1, uCausticT * 1.3) * 0.6);
}
`;
