// Sound: recorded ambience (rain, thunder, sea, gulls, birds, crickets, wind) mixed with the synthesised
// engine, tyres and horn, plus effects for traffic, the train, beacons and the interface.
import { DriveAudio } from '/evermile/audio.js';

const REC = '/eight-worlds/assets/audio/', LOOPS = { rain: REC + 'rain_heavy.mp3', waves: REC + 'waves.mp3', gulls: REC + 'gulls.mp3', birds: REC + 'birds.mp3', crickets: REC + 'crickets.mp3', wind: REC + 'wind.mp3', fire: REC + 'fire.mp3', boil: REC + 'boil.mp3', falls: REC + 'waterfall.mp3', winter: REC + 'winter.mp3', frogs: REC + 'frogs.mp3' };
const SHOTS = { thunder0: REC + 'thunder.mp3', thunder1: '/tideworn/assets/audio/thunder1.mp3', thunder2: '/tideworn/assets/audio/thunder2.mp3' };
const TRANSMISSION = { ratio: [360, 255, 185, 144, 117, 98, 82], up: [2700, 4770], down: [1500, 2200], poweredUpshifts: true };
const GEARBOX = {
  escalade: {
    ratio: [580, 370, 267, 211, 171, 140, 116, 96, 78, 64],
    up: [1850, 3650], down: [950, 1450],
    // Fifth is close to sixth. Use a shorter hold and a lower RPM target for that handoff.
    upByGear: { 5: [1850, 2850] }, holdByGear: { 5: 1.05 },
  },
  bus: { ratio: [510, 300, 192, 137, 106, 86], up: [1450, 750], down: [800, 470] }
};
const VOICE = { hatch: 'grcorolla', suv: 'landcruiser', gt500: 'coupe', interceptor: 'landcruiser' }; // supercharged V8; twin-turbo V6 with a 10-speed
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// A repeating two-revolution combustion cycle. On the cross-plane V8s the
// two exhaust banks reach the listener with different strengths and spacing.
const EXHAUST = {
  coupe: [8, 840, .036], hatch: [3, 730, .044], sedan: [4, 410, .029],
  pickup: [8, 420, .055], suv: [6, 460, .043], estate: [4, 355, .034],
  crossover: [6, 390, .031], compact: [4, 630, .032], van: [4, 305, .049],
  escalade: [8, 340, .13], mercedes: [4, 440, .039], gt500: [8, 470, .085], interceptor: [6, 400, .05],
  bus: [6, 245, .062], coach: [6, 305, .052]
};
function exhaustWave(ctx, cylinders, splitBanks) {
  const real = new Float32Array(97), imag = new Float32Array(97);
  const banks = [1, .46, 1, .46, .46, 1, .46, 1];
  for (let h = 1; h < real.length; h++) {
    for (let n = 0; n < cylinders; n++) {
      const strength = splitBanks ? banks[n] : 1 - .06 * (n % 3);
      const phase = 2 * Math.PI * h * n / cylinders;
      const amplitude = strength / (1 + (h / cylinders) ** 1.6);
      real[h] += amplitude * Math.cos(phase);
      imag[h] += amplitude * Math.sin(phase);
    }
  }
  return ctx.createPeriodicWave(real, imag);
}

export function createSound() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iOS: play even with the silent switch on
  const ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; master.connect(comp).connect(ctx.destination);
  const engineBus = ctx.createGain(); engineBus.gain.value = 0; engineBus.connect(comp);
  const drive = new DriveAudio(ctx, engineBus);
  let previewCar, previewStart;
  const exhaust = ctx.createOscillator(), exhaustFilter = ctx.createBiquadFilter(), exhaustGain = ctx.createGain();
  exhaustGain.gain.value = 0;
  exhaustFilter.Q.value = .72;
  exhaust.connect(exhaustFilter).connect(exhaustGain).connect(engineBus);
  exhaust.start();
  const waves = new Map();
  let exhaustCar;
  const loops = {}, shots = {}; let nextThunder = 12, hornHeld = false, honkCool = 4, splashCool = 0, on = true;
  const load = async url => { const data = await (await fetch(url)).arrayBuffer(); return new Promise((res, rej) => { const p = ctx.decodeAudioData(data, res, rej); if (p && p.then) p.then(res, rej); }); };
  // CC0 field recording by Walking.With.Microphones, freesound.org/s/337809/.
  const recordedGain = ctx.createGain(), recordedFilter = ctx.createBiquadFilter();
  recordedGain.gain.value = 0;
  recordedFilter.type = 'lowpass';
  recordedFilter.connect(recordedGain).connect(engineBus);
  let recordedEngine;
  load('/afterdark/assets/audio/escalade-drive.wav').then(buffer => {
    recordedEngine = ctx.createBufferSource();
    recordedEngine.buffer = buffer;
    recordedEngine.loop = true;
    recordedEngine.connect(recordedFilter);
    recordedEngine.start();
  }).catch(error => console.warn('Escalade engine recording unavailable', error));
  for (const [name, url] of Object.entries(LOOPS)) load(url).then(buf => { const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const g = ctx.createGain(); g.gain.value = 0; src.connect(g).connect(master); src.start(0, Math.random() * Math.max(0, buf.duration - 1)); loops[name] = g; }).catch(e => console.warn('sound', name, e));
  for (const [name, url] of Object.entries(SHOTS)) load(url).then(buf => { shots[name] = buf; }).catch(() => {});
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const noiseLoop = (type, freq, q) => { const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; src.connect(f).connect(g); if (pan) g.connect(pan).connect(master); else g.connect(master); src.start(0, Math.random()); return { g, f, pan }; };
  // Three voices for the nearest passing cars, one for the train overhead, one for rain drumming on the car.
  const passers = [0, 1, 2].map(() => noiseLoop('bandpass', 500, 0.7)), rumble = noiseLoop('lowpass', 90, 0.9), clack = noiseLoop('bandpass', 1900, 3), patter = noiseLoop('bandpass', 3400, 0.6);
  const set = (param, v, tc = 0.15) => param.setTargetAtTime(v, ctx.currentTime, tc);
  const tone = (freq, at, len, gain, type = 'sine', slideTo = 0) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g).connect(master); o.start(t); o.stop(t + len + 0.05); };
  const burst = (freq, q, gain, len, at = 0, type = 'bandpass', slideTo = 0) => { const t = ctx.currentTime + at, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noise; f.type = type; f.frequency.setValueAtTime(freq, t); if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + len); f.Q.value = q; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + len * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + len); src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + len + 0.05); };
  const score = ctx.createGain();
  score.gain.value = 0;
  score.connect(comp);
  const chords = [[50,57,65,69], [46,53,62,65], [53,60,64,69], [48,55,62,67]];
  let beat = 0, nextBeat = 0;
  const anthemBus = ctx.createGain(); anthemBus.gain.value = 0; anthemBus.connect(comp);
  let anthemBuffer, anthemSource, anthemLoading;
  function playAnthem(active) {
    if (active && !anthemLoading) {
      anthemLoading = load('/afterdark/assets/audio/vip-arrival.mp3').then(buffer => { anthemBuffer = buffer; })
        .catch(error => console.warn('VIP score unavailable',error));
    }
    if (active && anthemBuffer && !anthemSource) {
      anthemSource = ctx.createBufferSource(); anthemSource.buffer = anthemBuffer;
      anthemSource.loop = true; anthemSource.connect(anthemBus); anthemSource.start();
    } else if (!active && anthemSource) {
      const ending = anthemSource; anthemSource = null;
      ending.stop(ctx.currentTime+.3); ending.onended = () => ending.disconnect();
    }
    set(anthemBus.gain,active ? .40 : 0,.07);
    return active && !!anthemSource;
  }
  const vipChords = [[50,57,66,69],[55,62,66,71],[47,54,62,66],[45,52,61,64]];
  // Electronic sirens, one per police car: a buzzy saw-and-square tone driven hard into a horn speaker (soft clipping
  // and the horn's two resonances), sweeping in the standard wail and breaking into yelp ahead of junctions. Each one is
  // placed in the stereo field, pitched by the Doppler shift of its own speed, dulled with distance, and echoes off the
  // street walls.
  const sirenBus = ctx.createGain(); sirenBus.gain.value = 0; sirenBus.connect(comp);
  const echo = ctx.createDelay(0.6), echoBack = ctx.createGain(), echoTone = ctx.createBiquadFilter(), echoWet = ctx.createGain();
  echo.delayTime.value = 0.19; echoBack.gain.value = 0.32; echoTone.type = 'lowpass'; echoTone.frequency.value = 1800; echoWet.gain.value = 0.34;
  sirenBus.connect(echo); echo.connect(echoTone).connect(echoBack).connect(echo); echoTone.connect(echoWet).connect(comp);
  const hornCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 1023 * 2 - 1; hornCurve[i] = Math.tanh(2.6 * x) / Math.tanh(2.6); }
  const sirens = [0, 1].map(k => {
    const saw = ctx.createOscillator(), sq = ctx.createOscillator(), a = ctx.createGain(), b = ctx.createGain(), shaper = ctx.createWaveShaper(), low = ctx.createBiquadFilter(), horn1 = ctx.createBiquadFilter(), horn2 = ctx.createBiquadFilter(), air = ctx.createBiquadFilter(), level = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    saw.type = 'sawtooth'; sq.type = 'square'; a.gain.value = 0.55; b.gain.value = 0.3; shaper.curve = hornCurve; shaper.oversample = '2x';
    low.type = 'highpass'; low.frequency.value = 380; horn1.type = 'peaking'; horn1.frequency.value = 1150; horn1.Q.value = 1.1; horn1.gain.value = 7; horn2.type = 'peaking'; horn2.frequency.value = 2750; horn2.Q.value = 2.2; horn2.gain.value = 5;
    air.type = 'lowpass'; air.frequency.value = 6000; level.gain.value = 0;
    saw.connect(a).connect(shaper); sq.connect(b).connect(shaper); shaper.connect(low).connect(horn1).connect(horn2).connect(air).connect(level).connect(pan).connect(sirenBus); saw.start(); sq.start();
    return { saw, sq, air, level, pan, t: k * 2.1, pitch: 1 + k * 0.035 };
  });
  function sirenSweep(S, i, dt) {
    S.t += dt; const cycle = (S.t + i * 5.3) % 13, yelp = cycle > 9.4 && cycle < 12.2;
    if (yelp) return [700 + 820 * Math.pow((S.t * 3.2 + i * 0.4) % 1, 0.7), 0.012];
    const p = (S.t / 4.4 + i * 0.31) % 1, rise = 0.38, k = p < rise ? Math.sin(p / rise * Math.PI / 2) : Math.cos((p - rise) / (1 - rise) * Math.PI / 2) ** 1.4;
    return [620 + 830 * k, 0.03];
  }
  let lastSiren = ctx.currentTime;
  function updateSirens(active, list, L) {
    const now = ctx.currentTime, dt = Math.min(0.1, Math.max(0, now - lastSiren)); lastSiren = now;
    set(sirenBus.gain, active && list?.length ? 0.24 : 0, 0.25);
    sirens.forEach((S, i) => { const src = list?.[i];
      if (!active || !src || !L) { set(S.level.gain, 0, 0.2); return; }
      const [f, tc] = sirenSweep(S, i, dt), dx = src.x - L.x, dz = src.z - L.z, d = Math.hypot(dx, dz) + 0.5;
      const away = (src.vx * dx + src.vz * dz) / d, doppler = clamp(343 / (343 + away), 0.85, 1.18), hz = f * S.pitch * doppler;
      S.saw.frequency.setTargetAtTime(hz, now, tc); S.sq.frequency.setTargetAtTime(hz * 1.004, now, tc);
      const near = 1 / (1 + d / 14);
      set(S.level.gain, (0.003 + 0.055 * near) * (src.gain ?? 1), 0.08); set(S.air.frequency, 1300 + 9000 * near * near, 0.1);
      if (S.pan.pan) set(S.pan.pan, clamp((dz * L.fx - dx * L.fz) / d * 0.85, -1, 1), 0.08); });
  }
  function soundtrack(active, vip) {
    const anthemPlaying = playAnthem(active && vip);
    set(score.gain, active && !anthemPlaying ? (vip ? .68 : .38) : 0, .16);
    const now = ctx.currentTime;
    if (!active || anthemPlaying) { nextBeat = 0; beat = 0; return; }
    if (nextBeat < now) nextBeat = now + .015;
    while (nextBeat < now + .12) {
      const chord = (vip ? vipChords : chords)[Math.floor(beat / 8) % chords.length];
      const bass = beat % 8 === 0;
      const notes = bass ? [chord[0] - 12, chord[1], chord[2]] : [chord[[0,2,1,3,1,2,3,1][beat % 8]] + 12];
      for (const midi of notes) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        const end = nextBeat + (bass ? 2.65 : 1.05);
        osc.type = bass ? 'sine' : 'triangle';
        osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
        gain.gain.setValueAtTime(.0001, nextBeat);
        gain.gain.exponentialRampToValueAtTime(bass ? .10 : .045, nextBeat + (bass ? .30 : .04));
        gain.gain.exponentialRampToValueAtTime(.0001, end);
        osc.connect(gain).connect(score); osc.start(nextBeat); osc.stop(end);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      }
      beat++; nextBeat += vip ? .34 : .39;
    }
  }
  const api = {
    ctx, drive, master, loops, shots, get gear() { return drive.gear; }, get rpm() { return drive.rpm; },
    preview(id) { previewCar = id; previewStart = ctx.currentTime; },
    resume() { if (ctx.state !== 'running') ctx.resume?.(); }, setOn(v) { on = v; },
    click() { tone(1500, 0, 0.05, 0.05, 'triangle'); },
    tick(on) { tone(on ? 2300 : 1700, 0, 0.018, 0.022, 'square'); }, // indicator relay
    start() { try { drive.lastVolume = 1; drive.starter(0.9); } catch (e) {} },
    beacon() { [659, 880, 1319, 1760].forEach((f, i) => { tone(f, i * 0.07, 0.5, 0.11, 'triangle'); tone(f * 2, i * 0.07, 0.3, 0.03); }); burst(6000, 2, 0.05, 0.5, 0, 'highpass'); },
    nearMiss() { burst(500, 0.8, 0.3, 0.45, 0, 'bandpass', 2600); },
    finish(best) { (best ? [523, 659, 784, 1047, 1319] : [784, 659, 523, 392]).forEach((f, i) => tone(f, i * 0.13, 0.6, 0.12, 'triangle')); },
    camera() { burst(2200, 3, 0.07, 0.07); tone(900, 0.01, 0.05, 0.03, 'square'); },
    crash(k) { try { drive.crash(k); } catch (e) {} burst(3800, 1.5, 0.25 * k, 0.5, 0.04, 'highpass'); if (k > 0.5) for (let i = 0; i < 5; i++) burst(5000 + Math.random() * 3000, 9, 0.12 * k, 0.1, 0.1 + i * 0.07); },
    horn(v) { hornHeld = v; },
    thunder() { const names = Object.keys(shots); if (!names.length) return false; const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = shots[names[Math.floor(Math.random() * names.length)]]; g.gain.value = 0.5 + Math.random() * 0.35; src.playbackRate.value = 0.9 + Math.random() * 0.2; src.connect(g).connect(master); src.start(); return true; },
    // Called every frame. s: { playing, speed, reverse, throttle, brake, hand, steer, slip, env, x, z, heading, beachX, cars, trainX, trainZ, cockpit, people }
    update(dt, s) {
      updateSirens(on && s.playing && (s.cinematic ? !!s.vip : true), s.sirens, s.listener); // the convoy's in the film, the player's own police car in play
      soundtrack(on && s.playing && s.cinematic, s.vip);
      set(master.gain, on && s.playing ? (s.cinematic ? .32 : 1) : 0, 0.1);
      const elapsed = ctx.currentTime - previewStart;
      if (!s.garage || elapsed > 2.4) previewCar = null;
      if (previewCar) {
        const throttle = clamp(elapsed * 3) * clamp((1.65 - elapsed) * 2.5);
        s = { ...s, vehicle: previewCar, playing: true, speed: 0, throttle, brake: 0, slip: 0, steer: 0, people: false, urban: false, cockpit: false };
      }
      set(engineBus.gain, on && s.playing ? (s.cinematic ? .72 : 1) : 0, .06); const e = s.env, sp = Math.abs(s.speed), live = s.playing ? 1 : 0.45;
      try { drive.update(dt, { speed: s.speed, throttle: s.throttle, brake: Math.max(s.brake, s.hand && sp > 6 ? 1 : 0), steer: s.hand ? Math.sign(s.steer || 1) : s.steer * (1 + s.slip * 0.15), offroad: s.offroad, volume: (s.cockpit ? 1.0 : 1.35) * live, vehicle: VOICE[s.vehicle] || s.vehicle, shiftHold: s.vehicle === 'escalade' ? 1.5 : 1.05, transmission: s.vehicle === 'coupe' ? TRANSMISSION : GEARBOX[s.vehicle], reverse: s.reverse, grounded: s.grounded, tyreSlip: s.slip });
        const [cylinders, cutoff, level] = EXHAUST[s.vehicle] || EXHAUST.sedan;
        if (exhaustCar !== s.vehicle) {
          exhaustCar = s.vehicle;
          const split = s.vehicle === 'escalade' || s.vehicle === 'pickup' || s.vehicle === 'gt500';
          const key = cylinders + ':' + split;
          if (!waves.has(key)) waves.set(key, exhaustWave(ctx, cylinders, split));
          exhaust.setPeriodicWave(waves.get(key));
        }
        const load = s.throttle * drive.shiftLoadGain;
        set(exhaust.frequency, drive.rpm / 120, .025);
        set(exhaustFilter.frequency, (cutoff * (.5 + load) + drive.rpm * .1) * (s.cockpit ? .55 : 1), .085);
        const recorded = recordedEngine && s.vehicle === 'escalade';
        if (recorded) {
          set(recordedEngine.playbackRate, clamp((drive.rpm / 2600) ** .72, .65, 1.60), .035);
          set(recordedFilter.frequency, (650 + load * 2600) * (s.cockpit ? .52 : 1), .08);
        }
        set(recordedGain.gain, recorded && s.playing ? .22 * load * clamp((drive.rpm - 900) / 1400) : 0, .035);
        set(exhaustGain.gain, s.playing ? level * (recorded ? .55 : 1) * (.12 + .88 * load) : 0, .065);
        drive.horn(hornHeld && s.playing, 1.6); drive.townHum(s.urban && !s.sheltered ? 0.55 + 0.45 * e.day : 0); drive.chatter(s.urban && !s.sheltered && s.people && e.rain < 0.4, 'street'); } catch (err) {}
      // Frontier ambience: any open water nearby, the crater, the waterfalls, the high pass, the lake at night, the dunes.
      const a = s.amb || {}, shore = Math.max(clamp(1 - Math.abs(s.x - s.beachX) / 190), a.sea || 0), open = s.cockpit ? 0.8 : 1;
      const habitat = !s.urban && !s.sheltered && !shore && e.rain < .15 && (a.desert || 0) < .2 && (a.alpine || 0) < .2 && (a.fire || 0) < .1;
      const birdHours = (s.hour >= 5 && s.hour < 10.5) || (s.hour >= 16 && s.hour < 19);
      const birdPhrase = clamp((Math.sin(ctx.currentTime * .13 + Math.sin(ctx.currentTime * .037)) - .4) * 4);
      if (loops.fire) set(loops.fire.gain, 0.5 * (a.fire || 0), 1); if (loops.boil) set(loops.boil.gain, 0.4 * (a.fire || 0) ** 2, 1); if (loops.falls) set(loops.falls.gain, 0.6 * (a.falls || 0), 1);
      if (loops.winter) set(loops.winter.gain, 0.38 * (a.alpine || 0), 1.5); if (loops.frogs) set(loops.frogs.gain, 0.3 * (a.lake || 0) * e.night * (1 - e.rain), 1.5);
      if (loops.rain) set(loops.rain.gain, 0.62 * e.rain * open, 0.6);
      if (loops.waves) set(loops.waves.gain, 0.5 * shore * shore, 0.5);
      if (loops.gulls) set(loops.gulls.gain, (s.sheltered ? 0 : birdPhrase) * 0.3 * shore * e.day * (1 - e.rain), 0.8);
      if (loops.birds) set(loops.birds.gain, habitat && birdHours ? .16 * e.day * birdPhrase : 0, 1.5);
      if (loops.crickets) set(loops.crickets.gain, habitat ? .12 * e.night : 0, 1.5);
      if (loops.wind) set(loops.wind.gain, 0.42 * clamp(sp / 62) ** 1.6 * live + 0.05 * shore + 0.2 * (a.desert || 0) + 0.12 * (a.alpine || 0), 0.25);
      set(patter.g.gain, 0.05 * e.rain * (s.cockpit ? 1.6 : 0.6), 0.5);
      // Passing traffic: louder and brighter the closer and faster the closing speed, panned to its side.
      const near = []; for (const c of s.cars) { if (c === s.featuredCar) continue; const dx = c.x - s.x, dz = c.z - s.z, d2 = dx * dx + dz * dz; if (d2 < 2500) near.push([d2, dx, dz, c.v]); } near.sort((a, b) => a[0] - b[0]);
      passers.forEach((p, k) => { const n = near[k]; if (!n) { set(p.g.gain, 0, 0.2); return; } const d = Math.sqrt(n[0]), rel = Math.abs(n[3]) + sp, side = (n[1] * Math.cos(s.heading) - n[2] * Math.sin(s.heading)) / (d + 1);
        set(p.g.gain, 0.34 * clamp(rel / 40) / (1 + d * d * 0.012), 0.08); set(p.f.frequency, 260 + rel * 22, 0.1); if (p.pan) set(p.pan.pan, clamp(-side, -1, 1), 0.1); });
      // Other drivers sound their horns when stuck behind you.
      honkCool -= dt; if (honkCool <= 0 && s.playing && sp < 1.5) { const stuck = near.find(n => n[0] < 144 && Math.abs(n[3]) < .3 && n[1] * Math.sin(s.heading) + n[2] * Math.cos(s.heading) < -3 && Math.abs(n[1] * Math.cos(s.heading) - n[2] * Math.sin(s.heading)) < 2); if (stuck) { try { drive.hornBurst(Math.sqrt(stuck[0])); } catch (err) {} honkCool = 5 + Math.random() * 6; } else honkCool = 1.5; }
      // The train overhead: a low rumble with wheel clatter as it goes by.
      const td = Math.hypot(s.trainX - s.x, clamp(s.z, s.trainZ - 46, s.trainZ + 46) - s.z), tk = clamp(1 - td / 150) ** 2; set(rumble.g.gain, 0.9 * tk, 0.3); set(clack.g.gain, 0.12 * tk * (0.5 + 0.5 * Math.sin(ctx.currentTime * 24)), 0.02);
      // Standing water at speed.
      splashCool -= dt; if (s.puddleDepth > 0.5 && sp > 10 && splashCool <= 0) { try { drive.splash(clamp(sp / 60)); } catch (err) {} splashCool = 2.5; }
      // Thunder in the rain.
      if (e.rain > 0.5) { nextThunder -= dt; if (nextThunder <= 0) { nextThunder = 18 + Math.random() * 40; return api.thunder() ? 'thunder' : null; } }
      return null;
    }
  };
  return api;
}
