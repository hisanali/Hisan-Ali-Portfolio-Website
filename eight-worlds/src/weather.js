// Weather and time-of-day state. Everything else reads from `env`.
import * as THREE from 'three';
import { clamp, lerp, damp, smooth, A, rng } from './core.js';

export const PRESETS = {
  clear:    { label: 'Clear',    cloud: 0.12, dens: 0.55, rain: 0, snow: 0, fog: 0.0, wind: 0.25, storm: 0, haze: 1.0 },
  fair:     { label: 'Broken cloud', cloud: 0.48, dens: 0.7, rain: 0, snow: 0, fog: 0.0, wind: 0.35, storm: 0, haze: 1.3 },
  overcast: { label: 'Overcast', cloud: 0.97, dens: 0.95, rain: 0, snow: 0, fog: 0.08, wind: 0.3, storm: 0, haze: 2.2 },
  rain:     { label: 'Rain',     cloud: 1.0, dens: 1.1, rain: 0.6, snow: 0, fog: 0.16, wind: 0.45, storm: 0, haze: 3.0 },
  storm:    { label: 'Thunderstorm', cloud: 1.0, dens: 1.5, rain: 1.0, snow: 0, fog: 0.22, wind: 0.9, storm: 1, haze: 3.5 },
  fog:      { label: 'Fog',      cloud: 0.7, dens: 0.6, rain: 0, snow: 0, fog: 1.0, wind: 0.06, storm: 0, haze: 4.0 },
  snow:     { label: 'Snow',     cloud: 0.98, dens: 0.9, rain: 0, snow: 0.85, fog: 0.3, wind: 0.3, storm: 0, haze: 3.0 },
  gale:     { label: 'Strong wind', cloud: 0.4, dens: 0.7, rain: 0, snow: 0, fog: 0.0, wind: 1.0, storm: 0, haze: 1.6 },
};
export const TIMES = { sunrise: 'Sunrise', day: 'Day', sunset: 'Sunset', blue: 'Blue hour', night: 'Night' };
const KEYS = ['cloud', 'dens', 'rain', 'snow', 'fog', 'wind', 'storm', 'haze'];
const TAUS = { cloud: 7, dens: 7, rain: 5, snow: 5, fog: 6, wind: 3.5, storm: 4, haze: 6 };

// --- atmosphere transmittance toward the sun (matches the sky shader constants) ---
const Re = 6371e3, Ra = 6471e3;
const bR = [5.802e-6, 13.558e-6, 33.1e-6], bMe = 4.4e-6, bO = [0.65e-6, 1.881e-6, 0.085e-6];
export function sunTransmittance(elev, mie = 1, out = new THREE.Color()) {
  const dy = Math.sin(elev), dx = Math.cos(elev);
  const oy = Re + 30; // start a little above ground
  const b = oy * dy, c = oy * oy - Ra * Ra; const tmax = -b + Math.sqrt(Math.max(b * b - c, 0));
  let r = 0, m = 0, o = 0; const N = 24;
  for (let i = 0; i < N; i++) {
    const t0 = tmax * (i / N) ** 2, t1 = tmax * ((i + 1) / N) ** 2, t = (t0 + t1) / 2, dt = t1 - t0;
    const px = dx * t, py = oy + dy * t; const h = Math.sqrt(px * px + py * py) - Re;
    if (h < -200) { r += 1e9; break; }
    r += Math.exp(-h / 8000) * dt; m += Math.exp(-h / 1200) * dt; o += Math.max(0, 1 - Math.abs(h - 25e3) / 15e3) * dt;
  }
  out.r = Math.exp(-(bR[0] * r + bMe * mie * m + bO[0] * o));
  out.g = Math.exp(-(bR[1] * r + bMe * mie * m + bO[1] * o));
  out.b = Math.exp(-(bR[2] * r + bMe * mie * m + bO[2] * o));
  return out;
}

export class Env {
  constructor() {
    this.hour = 10; this.hourTarget = null; this.timeSpeed = 0; // hours per second when free-running
    this.lat = 45; this.decl = 12; // degrees
    this.w = { ...PRESETS.fair }; this.t = { ...PRESETS.fair }; this.preset = 'fair';
    this.windUser = null; // user override 0..1
    this.windAngle = 0.6; this.windDir = new THREE.Vector2(1, 0);
    this.gust = 0; this.windNow = 0.3;
    this.wetness = 0; this.snowCover = 0; this.baseSnow = 0; this.cold = false;
    this.sunDir = new THREE.Vector3(0, 1, 0); this.moonDir = new THREE.Vector3(0, -1, 0);
    this.lightDir = new THREE.Vector3(0, 1, 0); this.lightColor = new THREE.Color(1, 1, 1); this.lightIntensity = 1;
    this.sunElev = 0.5; this.night = 0; this.sunColor = new THREE.Color();
    this.flash = 0; this.flashDir = new THREE.Vector3(1, 0.3, 0); this.onThunder = null; this.onBolt = null;
    this._nextStrike = 6; this._flashSeq = []; this.time = 0; this.cloudScroll = 0;
    this.exposure = 0.6; this.rnd = rng(99);
    this.precipRain = 0; this.precipSnow = 0;
  }
  setPreset(name, instant = false) {
    if (!PRESETS[name]) return; this.preset = name;
    for (const k of KEYS) this.t[k] = PRESETS[name][k];
    if (instant) for (const k of KEYS) this.w[k] = this.t[k];
    if (instant) { this.wetness = this.t.rain > 0.1 ? 0.8 : 0; this.snowCover = this.t.snow > 0.1 ? 0.7 : 0; }
  }
  setTime(name, instant = false) {
    // hours at which the sun sits where we want it for the current latitude
    const h = this.hourFor(name);
    if (instant) { this.hour = h; this.hourTarget = null; } else this.hourTarget = h;
  }
  hourFor(name) {
    const elevAt = (h) => this.sunAt(h, _v).y;
    const find = (target, from, to) => { // bisection on monotonic stretch
      let a = from, b = to; const fa = Math.asin(elevAt(a)) - target;
      for (let i = 0; i < 30; i++) { const m = (a + b) / 2; const fm = Math.asin(elevAt(m)) - target; if ((fm > 0) === (fa > 0)) a = m; else b = m; }
      return (a + b) / 2;
    };
    const D = Math.PI / 180;
    const noonEl = Math.asin(elevAt(12)), midEl = Math.asin(elevAt(0));
    const ok = (e) => e < noonEl - 0.01 && e > midEl + 0.01;
    switch (name) {
      case 'sunrise': return ok(3 * D) ? find(3 * D, 0, 12) : 6;
      case 'sunset': return ok(2.5 * D) ? find(2.5 * D, 12, 24) : 18;
      case 'blue': return ok(-5 * D) ? find(-5 * D, 12, 24) : 23.5;
      case 'night': return 0.5;
      default: return 12.8;
    }
  }
  sunAt(hour, out) {
    const D = Math.PI / 180, ha = (hour - 12) / 24 * Math.PI * 2, phi = this.lat * D, de = this.decl * D;
    const sinEl = Math.sin(phi) * Math.sin(de) + Math.cos(phi) * Math.cos(de) * Math.cos(ha);
    const el = Math.asin(clamp(sinEl, -1, 1));
    const az = Math.atan2(-Math.cos(de) * Math.sin(ha), Math.cos(phi) * Math.sin(de) - Math.sin(phi) * Math.cos(de) * Math.cos(ha));
    // north = -z, east = +x; rotate whole sky per world via this.north
    const a = az + (this.north || 0);
    return out.set(Math.sin(a) * Math.cos(el), Math.sin(el), -Math.cos(a) * Math.cos(el));
  }
  update(dt) {
    this.time += dt;
    if (this.hourTarget != null) {
      let d = ((this.hourTarget - this.hour) % 24 + 24) % 24; if (d > 12) d -= 24;
      const step = Math.sign(d) * Math.min(Math.abs(d), dt * Math.max(1.2, Math.abs(d) * 0.9));
      this.hour = (this.hour + step + 24) % 24; if (Math.abs(d) < 0.01) this.hourTarget = null;
    } else if (this.timeSpeed) this.hour = (this.hour + this.timeSpeed * dt + 24) % 24;

    for (const k of KEYS) this.w[k] = damp(this.w[k], this.t[k], TAUS[k], dt);
    const w = this.w;
    const windBase = this.windUser != null ? damp(this._wu ?? w.wind, this.windUser, 2.5, dt) : w.wind; this._wu = windBase;
    this.gust = 0.5 + 0.5 * Math.sin(this.time * 0.31) * Math.sin(this.time * 0.13 + 1.7) + 0.25 * Math.sin(this.time * 1.1);
    this.wind = windBase; this.windNow = clamp(windBase * (0.8 + 0.35 * this.gust), 0, 1.3);
    this.windAngle += dt * 0.004 * Math.sin(this.time * 0.02);
    this.windDir.set(Math.cos(this.windAngle), Math.sin(this.windAngle));
    this.cloudScroll += dt * (0.004 + this.wind * 0.02);

    // cold worlds turn rain into snow
    const precip = Math.max(w.rain, w.snow);
    this.precipSnow = this.cold ? precip : w.snow; this.precipRain = this.cold ? 0 : w.rain;
    this.wetness = damp(this.wetness, this.precipRain > 0.05 ? clamp(0.4 + this.precipRain) : 0, this.precipRain > 0.05 ? 9 : 45, dt);
    this.snowCover = damp(this.snowCover, this.precipSnow > 0.05 ? clamp(0.35 + this.precipSnow * 0.7) : 0, this.precipSnow > 0.05 ? 14 : 50, dt);

    // sun, moon, main light
    this.sunAt(this.hour, this.sunDir); this.sunElev = Math.asin(clamp(this.sunDir.y, -1, 1));
    this.sunAt(this.hour + 12.6, this.moonDir); this.moonDir.y = Math.abs(this.moonDir.y) * 0.8 + 0.25 * (1 - smooth(-0.1, 0.3, this.sunDir.y)); this.moonDir.normalize();
    const D = Math.PI / 180;
    sunTransmittance(Math.max(this.sunElev, -1.5 * D), w.haze, this.sunColor);
    const sunFade = smooth(-3.5 * D, 1.5 * D, this.sunElev);
    const moonFade = smooth(-3.5 * D, -9 * D, this.sunElev);
    this.night = smooth(-2 * D, -12 * D, this.sunElev);
    const cloudOcc = smooth(0.55, 1.0, w.cloud) * clamp(0.55 + w.dens * 0.4); // direct light lost under solid cloud
    this.cloudOcc = cloudOcc;
    if (sunFade > 0.001) {
      this.lightDir.copy(this.sunDir); if (this.lightDir.y < 0.02) { this.lightDir.y = 0.02; this.lightDir.normalize(); }
      this.lightColor.copy(this.sunColor); this.lightIntensity = 6.2 * sunFade * (1 - cloudOcc * 0.94) * (1 - w.fog * 0.6);
    } else {
      this.lightDir.copy(this.moonDir); this.lightColor.setRGB(0.55, 0.68, 1.0);
      this.lightIntensity = 0.045 * moonFade * (1 - cloudOcc * 0.85) * (1 - w.fog * 0.5);
    }

    // lightning
    this.flash = 0;
    if (w.storm > 0.5) {
      this._nextStrike -= dt;
      if (this._nextStrike <= 0) {
        this._nextStrike = 5 + this.rnd() * 13;
        const a = this.rnd() * Math.PI * 2, dist = 900 + this.rnd() * 6500;
        this.flashDir.set(Math.cos(a), 0.22 + this.rnd() * 0.2, Math.sin(a)).normalize();
        const n = 2 + (this.rnd() * 3 | 0); this._flashSeq = []; let t = 0;
        for (let i = 0; i < n; i++) { this._flashSeq.push({ t, d: 0.05 + this.rnd() * 0.09, a: 0.5 + this.rnd() * 0.5 }); t += 0.07 + this.rnd() * 0.14; }
        this._flashT = 0; this.flashDist = dist;
        if (this.onBolt) this.onBolt(a, dist, t + 0.1);
        if (this.onThunder) this.onThunder(dist, a);
      }
    }
    if (this._flashSeq.length) {
      this._flashT += dt; let f = 0;
      for (const s of this._flashSeq) { const x = (this._flashT - s.t) / s.d; if (x >= 0 && x < 1) f = Math.max(f, s.a * (1 - x * x)); }
      this.flash = f * clamp(1.6 - this.flashDist / 6000, 0.25, 1);
      const last = this._flashSeq[this._flashSeq.length - 1]; if (this._flashT > last.t + last.d) this._flashSeq = [];
    }
  }
  // write the shared uniform block. fog colours come from the sky (set by Sky.update)
  writeUniforms(fogCol, fogSun, fogDensity, fogFalloff, fogBase) {
    const w = this.w;
    A[0] = this.lightDir.x; A[1] = this.lightDir.y; A[2] = this.lightDir.z; A[3] = this.lightIntensity;
    A[4] = this.lightColor.r; A[5] = this.lightColor.g; A[6] = this.lightColor.b; A[7] = this.time;
    A[8] = fogCol.r; A[9] = fogCol.g; A[10] = fogCol.b; A[11] = fogDensity;
    A[12] = fogFalloff; A[13] = fogBase; A[14] = this.wetness; A[15] = clamp(this.baseSnow + this.snowCover);
    A[16] = this.windDir.x; A[17] = this.windDir.y; A[18] = this.windNow; A[19] = this.precipRain;
    A[20] = fogSun.r; A[21] = fogSun.g; A[22] = fogSun.b; A[23] = this.flash;
    A[24] = this.sunDir.x; A[25] = this.sunDir.y; A[26] = this.sunDir.z; A[27] = this.night;
    A[28] = 1.3e-5 * w.haze + w.fog * 4e-5 + this.precipRain * 1.2e-4 + this.precipSnow * 2.2e-4;
    A[29] = w.cloud; A[30] = smooth(0.15, 0.4, w.cloud) * (1 - smooth(0.8, 1.0, w.cloud)) * 0.8 * (this.lightIntensity > 0.3 ? 1 : 0.5); A[31] = this.cloudScroll;
  }
}
const _v = new THREE.Vector3();
