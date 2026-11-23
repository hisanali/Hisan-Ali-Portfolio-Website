// Sound: recorded ambience (rain, thunder, sea, gulls, birds, crickets, wind) mixed with the synthesised
// engine, tyres and horn, plus effects for traffic, the train, beacons and the interface.
import { DriveAudio } from '/evermile/audio.js';

const REC = '/eight-worlds/assets/audio/', LOOPS = { rain: REC + 'rain_heavy.mp3', waves: REC + 'waves.mp3', gulls: REC + 'gulls.mp3', birds: REC + 'birds.mp3', crickets: REC + 'crickets.mp3', wind: REC + 'wind.mp3' };
const SHOTS = { thunder0: REC + 'thunder.mp3', thunder1: '/tideworn/assets/audio/thunder1.mp3', thunder2: '/tideworn/assets/audio/thunder2.mp3' };
const TRANSMISSION = { ratio: [360, 255, 185, 144, 117, 98, 82], up: [2700, 4770], down: [1500, 2200], poweredUpshifts: true };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function createSound() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iOS: play even with the silent switch on
  const ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; master.connect(comp).connect(ctx.destination);
  const drive = new DriveAudio(ctx, master);
  const loops = {}, shots = {}; let nextThunder = 12, hornHeld = false, honkCool = 4, splashCool = 0, on = true;
  const load = async url => { const data = await (await fetch(url)).arrayBuffer(); return new Promise((res, rej) => { const p = ctx.decodeAudioData(data, res, rej); if (p && p.then) p.then(res, rej); }); };
  for (const [name, url] of Object.entries(LOOPS)) load(url).then(buf => { const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const g = ctx.createGain(); g.gain.value = 0; src.connect(g).connect(master); src.start(0, Math.random() * Math.max(0, buf.duration - 1)); loops[name] = g; }).catch(e => console.warn('sound', name, e));
  for (const [name, url] of Object.entries(SHOTS)) load(url).then(buf => { shots[name] = buf; }).catch(() => {});
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const noiseLoop = (type, freq, q) => { const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; src.connect(f).connect(g); if (pan) g.connect(pan).connect(master); else g.connect(master); src.start(0, Math.random()); return { g, f, pan }; };
  // Three voices for the nearest passing cars, one for the train overhead, one for rain drumming on the car.
  const passers = [0, 1, 2].map(() => noiseLoop('bandpass', 500, 0.7)), rumble = noiseLoop('lowpass', 90, 0.9), clack = noiseLoop('bandpass', 1900, 3), patter = noiseLoop('bandpass', 3400, 0.6);
  const set = (param, v, tc = 0.15) => param.setTargetAtTime(v, ctx.currentTime, tc);
  const tone = (freq, at, len, gain, type = 'sine', slideTo = 0) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g).connect(master); o.start(t); o.stop(t + len + 0.05); };
  const burst = (freq, q, gain, len, at = 0, type = 'bandpass', slideTo = 0) => { const t = ctx.currentTime + at, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noise; f.type = type; f.frequency.setValueAtTime(freq, t); if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + len); f.Q.value = q; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + len * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + len); src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + len + 0.05); };
  const api = {
    ctx, drive, master, loops, shots, get gear() { return drive.gear; }, get rpm() { return drive.rpm; },
    resume() { if (ctx.state !== 'running') ctx.resume?.(); }, setOn(v) { on = v; },
    click() { tone(1500, 0, 0.05, 0.05, 'triangle'); },
    start() { try { drive.lastVolume = 1; drive.starter(0.9); } catch (e) {} },
    beacon() { [659, 880, 1319, 1760].forEach((f, i) => { tone(f, i * 0.07, 0.5, 0.11, 'triangle'); tone(f * 2, i * 0.07, 0.3, 0.03); }); burst(6000, 2, 0.05, 0.5, 0, 'highpass'); },
    nearMiss() { burst(500, 0.8, 0.3, 0.45, 0, 'bandpass', 2600); },
    finish(best) { (best ? [523, 659, 784, 1047, 1319] : [784, 659, 523, 392]).forEach((f, i) => tone(f, i * 0.13, 0.6, 0.12, 'triangle')); },
    camera() { burst(2200, 3, 0.07, 0.07); tone(900, 0.01, 0.05, 0.03, 'square'); },
    crash(k) { try { drive.crash(k); } catch (e) {} burst(3800, 1.5, 0.25 * k, 0.5, 0.04, 'highpass'); if (k > 0.5) for (let i = 0; i < 5; i++) burst(5000 + Math.random() * 3000, 9, 0.12 * k, 0.1, 0.1 + i * 0.07); },
    horn(v) { hornHeld = v; },
    thunder() { const names = Object.keys(shots); if (!names.length) return false; const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = shots[names[Math.floor(Math.random() * names.length)]]; g.gain.value = 0.5 + Math.random() * 0.35; src.playbackRate.value = 0.9 + Math.random() * 0.2; src.connect(g).connect(master); src.start(); return true; },
    // Called every frame. s: { playing, speed, throttle, brake, hand, steer, slip, env, x, z, heading, beachX, cars, trainX, trainZ, cockpit, people }
    update(dt, s) {
      set(master.gain, on ? 1 : 0, 0.1); const e = s.env, sp = Math.abs(s.speed), live = s.playing ? 1 : 0.45;
      try { drive.update(dt, { speed: s.speed, throttle: s.throttle, brake: Math.max(s.brake, s.hand && sp > 6 ? 1 : 0), steer: s.hand ? Math.sign(s.steer || 1) : s.steer * (1 + s.slip * 0.15), offroad: false, volume: 1.35 * live, vehicle: 'coupe', transmission: TRANSMISSION, reverse: s.speed < -0.5, grounded: true });
        drive.horn(hornHeld && s.playing, 1.6); drive.townHum(0.55 + 0.45 * e.day); drive.chatter(s.people && e.rain < 0.4, 'street'); } catch (err) {}
      const shore = clamp(1 - (s.x - s.beachX) / 190), open = s.cockpit ? 0.8 : 1;
      if (loops.rain) set(loops.rain.gain, 0.62 * e.rain * open, 0.6);
      if (loops.waves) set(loops.waves.gain, 0.5 * shore * shore, 0.5);
      if (loops.gulls) set(loops.gulls.gain, 0.3 * shore * e.day * (1 - e.rain), 0.8);
      if (loops.birds) set(loops.birds.gain, 0.2 * e.day * (1 - shore * 0.6), 1.5);
      if (loops.crickets) set(loops.crickets.gain, 0.14 * e.night * (1 - e.rain), 1.5);
      if (loops.wind) set(loops.wind.gain, 0.42 * clamp(sp / 62) ** 1.6 * live + 0.05 * shore, 0.25);
      set(patter.g.gain, 0.05 * e.rain * (s.cockpit ? 1.6 : 0.6), 0.5);
      // Passing traffic: louder and brighter the closer and faster the closing speed, panned to its side.
      const near = []; for (const c of s.cars) { const dx = c.x - s.x, dz = c.z - s.z, d2 = dx * dx + dz * dz; if (d2 < 2500) near.push([d2, dx, dz, c.v]); } near.sort((a, b) => a[0] - b[0]);
      passers.forEach((p, k) => { const n = near[k]; if (!n) { set(p.g.gain, 0, 0.2); return; } const d = Math.sqrt(n[0]), rel = Math.abs(n[3]) + sp, side = (n[1] * Math.cos(s.heading) - n[2] * Math.sin(s.heading)) / (d + 1);
        set(p.g.gain, 0.34 * clamp(rel / 40) / (1 + d * d * 0.012), 0.08); set(p.f.frequency, 260 + rel * 22, 0.1); if (p.pan) set(p.pan.pan, clamp(-side, -1, 1), 0.1); });
      // Other drivers sound their horns when stuck behind you.
      honkCool -= dt; if (honkCool <= 0 && s.playing && sp < 1.5) { const stuck = near.find(n => n[0] < 200 && Math.abs(n[3]) < 0.3); if (stuck) { try { drive.hornBurst(Math.sqrt(stuck[0])); } catch (err) {} honkCool = 5 + Math.random() * 6; } else honkCool = 1.5; }
      // The train overhead: a low rumble with wheel clatter as it goes by.
      const td = Math.hypot(s.trainX - s.x, clamp(s.z, s.trainZ - 90, s.trainZ) - s.z), tk = clamp(1 - td / 150) ** 2; set(rumble.g.gain, 0.9 * tk, 0.3); set(clack.g.gain, 0.12 * tk * (0.5 + 0.5 * Math.sin(ctx.currentTime * 24)), 0.02);
      // Standing water at speed.
      splashCool -= dt; if (e.wet > 0.6 && sp > 24 && splashCool <= 0 && Math.random() < dt * 0.5) { try { drive.splash(clamp(sp / 60)); } catch (err) {} splashCool = 2.5; }
      // Thunder in the rain.
      if (e.rain > 0.5) { nextThunder -= dt; if (nextThunder <= 0) { nextThunder = 18 + Math.random() * 40; return api.thunder() ? 'thunder' : null; } }
      return null;
    }
  };
  return api;
}
