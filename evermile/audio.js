// Driving sound, synthesised live: an engine voiced for each vehicle (V8 coupé, six-cylinder diesel coach, four-cylinder bike)
// revving through an automatic gearbox, with intake and exhaust character, overrun pops, brake hiss and squeal,
// tonal tyre squeal, road rumble, gravel crunch and a horn.
// Engine rpm per m/s in each gear, and the automatic gearbox's shift points (they rise with throttle, so flooring it holds gears and kicks down).
const GEARS = {
  mercedes: {ratio: [430,260,175,128,103], up: [2100,3700], down: [1000,1900]},
  grcorolla: {ratio: [470, 300, 215, 170, 140, 118], up: [2400, 6300], down: [1300, 3000]},
  landcruiser: {ratio: [520, 330, 240, 190, 155, 128, 108, 92, 80, 70], up: [1700, 4200], down: [1000, 2200]},
  coupe: {ratio: [490, 330, 245, 190, 155, 128, 105], up: [2300, 5200], down: [1250, 2600]},
  coach: {ratio: [480, 280, 175, 125, 95, 78], up: [1650, 800], down: [900, 550]},
  bike: {ratio: [680, 500, 400, 340, 300, 265], up: [5200, 5600], down: [2800, 2400]},
};
const ENGINE = {
  mercedes: {idle: 780, red: 6200, firing: 2, falloff: 1.15, sub: .3, drive: 1.6, reson: [125,510], bright: .7, pops: false, level: .05},
  grcorolla: {idle: 900, red: 7000, firing: 1.5, falloff: 1.1, sub: .34, drive: 2.4, reson: [170, 700], bright: 1.15, pops: true, level: .058},
  landcruiser: {idle: 650, red: 5600, firing: 3, falloff: .95, sub: .4, drive: 2.6, reson: [120, 480], bright: .75, pops: false, level: .06},
  coupe: {idle: 850, red: 7800, firing: 4, falloff: 1.05, sub: .42, drive: 2.2, reson: [150, 620], bright: 1, pops: true, level: .062},
  coach: {idle: 650, red: 2600, firing: 3, falloff: .8, sub: .25, drive: 3.4, reson: [95, 420], bright: .55, pops: false, level: .07, clatter: true},
  bike: {idle: 1300, red: 11500, firing: 2, falloff: .82, sub: .18, drive: 1.8, reson: [210, 900], bright: 1.3, pops: true, level: .05},
};

function noiseBuffer(ctx, seconds = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// Harmonic spectrum of one engine voice: falling partials with the low orders boosted, as an exhaust note has.
function engineWave(ctx, falloff, bright) {
  const n = 48, real = new Float32Array(n), imag = new Float32Array(n);
  for (let k = 1; k < n; k++) {
    const boost = k === 1 ? 1.1 : k === 2 ? 1.35 : k === 4 ? 1.2 : 1;
    imag[k] = boost * Math.pow(k, -falloff) * Math.exp(-k / (18 * bright)) * (k % 2 ? 1 : .8);
  }
  return ctx.createPeriodicWave(real, imag);
}

export class DriveAudio {
  constructor(ctx, dest = ctx.destination) {
    this.ctx = ctx; this.gear = 1; this.rpm = 850; this.shiftDip = 0; this.vehicle = 'coupe'; this.popClock = 0; this.stopSqueal = false;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(dest); this.out = out;
    this.noise = noiseBuffer(ctx);
    const loopNoise = () => { const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true; src.start(0, Math.random() * 1.5); return src; };

    // Engine: main voice, half-order burble voice and a 1.5-order voice, roughened by slow noise and pushed through a soft clipper.
    this.engineIn = ctx.createGain(); this.engineIn.gain.value = 1;
    this.voices = [1, .5, 1.5].map((ratio, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); g.gain.value = [.5, .2, .1][i];
      o.connect(g).connect(this.engineIn); o.start(); return {o, g, ratio};
    });
    this.rough = ctx.createGain(); this.rough.gain.value = .22;
    const roughNoise = loopNoise(), roughLp = ctx.createBiquadFilter(); roughLp.type = 'lowpass'; roughLp.frequency.value = 28;
    roughNoise.connect(roughLp).connect(this.rough).connect(this.engineIn.gain);
    this.drive = ctx.createGain(); this.drive.gain.value = 2;
    const shaper = ctx.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
    shaper.curve = curve; shaper.oversample = '2x';
    this.reson = [0, 1].map(() => { const f = ctx.createBiquadFilter(); f.type = 'peaking'; f.Q.value = 1.1; f.gain.value = 6; return f; });
    this.engineLp = ctx.createBiquadFilter(); this.engineLp.type = 'lowpass'; this.engineLp.Q.value = .8;
    this.engineHp = ctx.createBiquadFilter(); this.engineHp.type = 'highpass'; this.engineHp.frequency.value = 28;
    this.engineGain = ctx.createGain(); this.engineGain.gain.value = 0;
    this.engineIn.connect(this.drive).connect(shaper).connect(this.reson[0]).connect(this.reson[1]).connect(this.engineLp).connect(this.engineHp).connect(this.engineGain).connect(out);

    // Intake roar and diesel clatter from filtered noise.
    const band = (type, freq, q) => { const src = loopNoise(), f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(out); return {g, f}; };
    this.intake = band('bandpass', 1100, .8);
    this.clatter = band('bandpass', 2600, 2.5);
    this.road = band('lowpass', 220, .7);
    this.gravel = band('bandpass', 1400, .9);
    this.brakeHiss = band('bandpass', 3800, 1.4);
    // Tyre squeal is tonal: two detuned voices wobbled by noise through a resonant band.
    this.squealGain = ctx.createGain(); this.squealGain.gain.value = 0;
    const squealBp = ctx.createBiquadFilter(); squealBp.type = 'bandpass'; squealBp.frequency.value = 980; squealBp.Q.value = 3;
    this.squealVoices = [860, 1130].map((f) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(squealBp); o.start(); return o; });
    const wobble = loopNoise(), wobbleLp = ctx.createBiquadFilter(), wobbleGain = ctx.createGain(); wobbleLp.type = 'lowpass'; wobbleLp.frequency.value = 9; wobbleGain.gain.value = 140;
    wobble.connect(wobbleLp).connect(wobbleGain); for (const o of this.squealVoices) wobbleGain.connect(o.frequency);
    squealBp.connect(this.squealGain).connect(out);
    // Brake squeal near a stop: a thin high tone with vibrato.
    this.brakeTone = ctx.createOscillator(); this.brakeTone.type = 'sine'; this.brakeTone.frequency.value = 3150;
    const vib = ctx.createOscillator(), vibGain = ctx.createGain(); vib.frequency.value = 6.5; vibGain.gain.value = 22; vib.connect(vibGain).connect(this.brakeTone.frequency); vib.start();
    this.brakeToneGain = ctx.createGain(); this.brakeToneGain.gain.value = 0; this.brakeTone.connect(this.brakeToneGain).connect(out); this.brakeTone.start();
    // Gearbox whine rises with road speed.
    this.whine = ctx.createOscillator(); this.whine.type = 'sine'; this.whineGain = ctx.createGain(); this.whineGain.gain.value = 0;
    this.whine.connect(this.whineGain).connect(out); this.whine.start();
    // Horn: two voices with a slight attack; pitch depends on the vehicle.
    this.hornGain = ctx.createGain(); this.hornGain.gain.value = 0;
    const hornFilter = ctx.createBiquadFilter(); hornFilter.type = 'lowpass'; hornFilter.frequency.value = 2600; hornFilter.Q.value = 2;
    this.hornVoices = [415, 523].map((f) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(hornFilter); o.start(); return o; });
    hornFilter.connect(this.hornGain).connect(out);
    this.setVehicle('coupe');
  }

  setVehicle(vehicle) {
    if (this.voiced === vehicle) return;
    this.voiced = this.vehicle = vehicle;
    const e = ENGINE[vehicle] || ENGINE.coupe;
    const main = engineWave(this.ctx, e.falloff, e.bright), sub = engineWave(this.ctx, e.falloff + .35, e.bright * .6);
    this.voices[0].o.setPeriodicWave(main); this.voices[1].o.setPeriodicWave(sub); this.voices[2].o.setPeriodicWave(sub);
    this.voices[1].g.gain.value = e.sub * .5;
    this.reson[0].frequency.value = e.reson[0]; this.reson[1].frequency.value = e.reson[1];
    const horn = vehicle === 'coach' ? [311, 370] : vehicle === 'bike' ? [480, 480 * 1.26] : [415, 523];
    this.hornVoices.forEach((o, i) => o.frequency.value = horn[i]);
    this.rpm = e.idle;
  }

  horn(on, volume) { this.hornGain.gain.setTargetAtTime(on ? .075 * volume : 0, this.ctx.currentTime, on ? .012 : .03); }

  // A short exhaust pop on overrun.
  pop(volume) {
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600 + Math.random() * 900; f.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(volume * (.12 + Math.random() * .12), t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .05 + Math.random() * .05);
    src.connect(f).connect(g).connect(this.out); src.start(t, Math.random() * 1.5); src.stop(t + .12);
  }

  // Returns the current gear so the HUD can show it.
  // A collision: a low thump through the body, a short metallic clatter, and above about 40 km/h a scatter of glass.
  // Hitting something soft (a person or an animal) is a dull thud with no clatter.
  crash(strength = .5, soft = false) {
    const ctx = this.ctx, t = ctx.currentTime, k = Math.max(0, Math.min(1, strength)), vol = this.lastVolume ?? .35;
    if (!vol) return;
    const burst = (type, freq, q, gain, length, delay = 0) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(gain * vol, t + delay + .008); g.gain.exponentialRampToValueAtTime(.0001, t + delay + length);
      src.connect(f).connect(g).connect(this.out); src.start(t + delay, Math.random() * 1.5); src.stop(t + delay + length + .05);
    };
    burst('lowpass', 140 + 120 * k, .7, (soft ? .9 : 1.4) * (.3 + .7 * k), .32 + .25 * k);
    const thump = ctx.createOscillator(), tg = ctx.createGain(); thump.type = 'sine'; thump.frequency.setValueAtTime(90 + 30 * k, t); thump.frequency.exponentialRampToValueAtTime(38, t + .25);
    tg.gain.setValueAtTime((soft ? .5 : .7) * (.3 + .7 * k) * vol, t); tg.gain.exponentialRampToValueAtTime(.0001, t + .3); thump.connect(tg).connect(this.out); thump.start(t); thump.stop(t + .32);
    if (!soft) { burst('bandpass', 2600, 1.2, .5 * k, .14 + .1 * k, .01); burst('highpass', 1800, .8, .22 * k, .25, .05); }
    if (!soft && k > .45) for (let i = 0; i < 6; i++) burst('bandpass', 5200 + Math.random() * 3000, 8, .12 * k, .08, .06 + i * .05 + Math.random() * .04);
  }
  // Another driver's horn, from a direction: a short two-note blast, a little lower and further away than yours.
  hornBurst(distance = 20) {
    const ctx = this.ctx, t = ctx.currentTime, vol = (this.lastVolume ?? .35) * Math.max(.15, 1 - distance / 70);
    if (!vol) return;
    for (const [f, g] of [[392, .5], [494, .4]]) { const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), gain = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1800; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(g * vol * .18, t + .02); gain.gain.setValueAtTime(g * vol * .18, t + .32); gain.gain.linearRampToValueAtTime(0, t + .4); gain.gain.setValueAtTime(0, t + .46); gain.gain.linearRampToValueAtTime(g * vol * .18, t + .48); gain.gain.setValueAtTime(g * vol * .18, t + .7); gain.gain.linearRampToValueAtTime(0, t + .78); o.connect(lp).connect(gain).connect(this.out); o.start(t); o.stop(t + .8); }
  }
  // A car door: the latch click and the shut thunk.
  door(open = false) {
    const ctx = this.ctx, t = ctx.currentTime, vol = this.lastVolume ?? .35; if (!vol) return;
    const burst = (freq, q, gain, len, delay) => { const src = ctx.createBufferSource(); src.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(gain * vol, t + delay + .005); g.gain.exponentialRampToValueAtTime(.0001, t + delay + len); src.connect(f).connect(g).connect(this.out); src.start(t + delay, Math.random()); src.stop(t + delay + len + .02); };
    burst(2400, 4, .35, .06, 0);
    if (!open) burst(180, 1.2, .9, .22, .12);
  }
  // A footstep: a short filtered tap, heavier when running, duller on grass and crunchier on gravel.
  footstep(surface = 'paved', run = false) {
    const ctx = this.ctx, t = ctx.currentTime, vol = (this.lastVolume ?? .35) * (run ? .9 : .6); if (!vol) return;
    const [freq, q, len] = surface === 'grass' ? [420, .8, .07] : surface === 'gravel' ? [1800, .6, .09] : surface === 'wood' ? [320, 1.4, .08] : surface === 'indoor' ? [900, 1.6, .06] : [700, 1.1, .06];
    const src = ctx.createBufferSource(); src.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq * (.9 + Math.random() * .2); f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22 * vol, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    src.connect(f).connect(g).connect(this.out); src.start(t, Math.random()); src.stop(t + len + .02);
    if (surface === 'gravel') for (let i = 0; i < 3; i++) { const s2 = ctx.createBufferSource(); s2.buffer = this.noise; const f2 = ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 3000; const g2 = ctx.createGain(); const d = .01 + i * .012; g2.gain.setValueAtTime(0, t + d); g2.gain.linearRampToValueAtTime(.08 * vol, t + d + .003); g2.gain.exponentialRampToValueAtTime(.0001, t + d + .03); s2.connect(f2).connect(g2).connect(this.out); s2.start(t + d, Math.random()); s2.stop(t + d + .05); }
  }
  // The starter: a second of cranking (a low whine with a chug at the cranking rate), then the engine catches.
  starter(seconds = 1.1) {
    const ctx = this.ctx, t = ctx.currentTime, vol = this.lastVolume ?? .35; if (!vol) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(150, t + seconds); lp.type = 'lowpass'; lp.frequency.value = 900;
    const chug = ctx.createOscillator(), cg = ctx.createGain(); chug.type = 'square'; chug.frequency.value = 7.5; cg.gain.value = .45; const depth = ctx.createGain(); depth.gain.value = .5; chug.connect(cg).connect(depth.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12 * vol, t + .05); g.gain.setValueAtTime(.12 * vol, t + seconds - .15); g.gain.linearRampToValueAtTime(0, t + seconds);
    o.connect(lp).connect(depth).connect(g).connect(this.out); o.start(t); chug.start(t); o.stop(t + seconds + .02); chug.stop(t + seconds + .02);
    // The catch: a short rev flare as it fires up.
    const flare = ctx.createOscillator(), fg = ctx.createGain(); flare.type = 'sawtooth'; flare.frequency.setValueAtTime(55, t + seconds - .1); flare.frequency.exponentialRampToValueAtTime(140, t + seconds + .25); flare.frequency.exponentialRampToValueAtTime(70, t + seconds + .9);
    fg.gain.setValueAtTime(0, t + seconds - .1); fg.gain.linearRampToValueAtTime(.16 * vol, t + seconds + .1); fg.gain.exponentialRampToValueAtTime(.0001, t + seconds + 1); flare.connect(fg).connect(this.out); flare.start(t + seconds - .1); flare.stop(t + seconds + 1.05);
  }
  // A shop door chime: two bright notes.
  chime() {
    const ctx = this.ctx, t = ctx.currentTime, vol = this.lastVolume ?? .35; if (!vol) return;
    for (const [f, d] of [[1318, 0], [1760, .14]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.12 * vol, t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .9); o.connect(g).connect(this.out); o.start(t + d); o.stop(t + d + 1); }
  }
  // Room tone for cafés and shops: a low murmur of voices and crockery, faded in and out.
  chatter(on, kind = 'cafe') {
    const ctx = this.ctx, vol = this.lastVolume ?? .35;
    if (!this.chatterGain) { this.chatterGain = ctx.createGain(); this.chatterGain.gain.value = 0; const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .5; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .9; lg.gain.value = .35; const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = 3.1; lg2.gain.value = .2; const mod = ctx.createGain(); mod.gain.value = .5; lfo.connect(lg).connect(mod.gain); lfo2.connect(lg2).connect(mod.gain); lfo.start(); lfo2.start(); src.connect(bp).connect(mod).connect(this.chatterGain).connect(this.out); src.start(0, Math.random()); }
    this.chatterGain.gain.setTargetAtTime(on ? (kind === 'cafe' ? .16 : .07) * vol : 0, ctx.currentTime, .6);
    if (on && Math.random() < .02) { const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 2400 + Math.random() * 1200; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03 * vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g).connect(this.out); o.start(t); o.stop(t + .3); }
  }
  // Distant traffic and town hum, level 0..1.
  townHum(level) {
    const ctx = this.ctx, vol = this.lastVolume ?? .35;
    if (!this.humGain) { this.humGain = ctx.createGain(); this.humGain.gain.value = 0; const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = .4; const mod = ctx.createGain(); mod.gain.value = .6; lfo.connect(lg).connect(mod.gain); lfo.start(); src.connect(lp).connect(mod).connect(this.humGain).connect(this.out); src.start(0, Math.random()); }
    this.humGain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * .11 * vol, ctx.currentTime, 1.2);
  }
  // Driving into water: a splash that grows with speed, then a short wash.
  splash(strength = .5) {
    const ctx = this.ctx, t = ctx.currentTime, k = Math.max(0, Math.min(1, strength)), vol = this.lastVolume ?? .35;
    if (!vol) return;
    for (const [freq, gain, len, delay] of [[900, .9, .35, 0], [2400, .5, .5, .03], [400, .6, .8, .1]]) {
      const src = ctx.createBufferSource(); src.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .9;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(gain * (.25 + .75 * k) * vol, t + delay + .03); g.gain.exponentialRampToValueAtTime(.0001, t + delay + len);
      src.connect(f).connect(g).connect(this.out); src.start(t + delay, Math.random() * 1.5); src.stop(t + delay + len + .05);
    }
  }
  update(dt, {speed, throttle, brake, steer, offroad, volume, vehicle, reverse, grounded, engineOn = true}) {
    this.lastVolume = volume; this.engineOn = engineOn;
    this.setVehicle(vehicle);
    const t = this.ctx.currentTime, e = ENGINE[vehicle] || ENGINE.coupe, v = Math.abs(speed);
    const box = GEARS[vehicle] || GEARS.coupe, ratios = box.ratio;
    let gear = Math.min(this.gear, ratios.length);
    const push = throttle * throttle, upAt = box.up[0] + push * box.up[1], downAt = box.down[0] + push * box.down[1], rpmIn = (g) => v * ratios[g - 1];
    if (!reverse && this.shiftDip <= 0) {
      if (gear < ratios.length && rpmIn(gear) > upAt && rpmIn(gear + 1) > e.idle * 1.15) { gear++; this.shiftDip = .18; }
      else if (gear > 1 && rpmIn(gear) < downAt && rpmIn(gear - 1) < e.red * .92) { gear--; this.shiftDip = -.1; }
    }
    if (reverse || v < .5) gear = 1;
    this.gear = gear;
    // Below the clutch take-up speed the engine idles or revs freely; above it the rpm is set by the wheels.
    const wheelRpm = reverse ? v * ratios[0] : rpmIn(gear), free = e.idle + throttle * (e.red - e.idle) * .32;
    let target = Math.min(e.red, Math.max(e.idle, wheelRpm, v < 4 ? free * (1 - v / 4) + wheelRpm * (v / 4) : 0));
    if (this.shiftDip > 0) { this.shiftDip = Math.max(0, this.shiftDip - dt); }
    else if (this.shiftDip < 0) { target *= 1.06; this.shiftDip = Math.min(0, this.shiftDip + dt); }
    const wobble = v < .3 ? Math.sin(t * 7.3) * 18 : 0;
    this.rpm += (target + wobble - this.rpm) * Math.min(1, dt * (this.shiftDip ? 14 : 8));
    const firing = this.rpm / 60 * e.firing, load = Math.max(throttle, .12), rev = this.rpm / e.red;
    for (const voice of this.voices) voice.o.frequency.setTargetAtTime(firing * voice.ratio, t, .02);
    this.drive.gain.setTargetAtTime(1 + load * e.drive * .5, t, .05);
    this.rough.gain.setTargetAtTime(.12 + (1 - load) * .12, t, .1);
    this.engineLp.frequency.setTargetAtTime(420 + load * 3200 * e.bright + this.rpm * .22, t, .05);
    const cut = this.shiftDip > 0 ? .5 : 1;
    this.engineGain.gain.setTargetAtTime(volume * e.level * (.45 + load * .55) * (.8 + rev * .3) * cut * (engineOn ? 1 : 0), t, engineOn ? .04 : .25);
    this.intake.g.gain.setTargetAtTime(volume * .025 * throttle * rev * e.bright, t, .06);
    this.intake.f.frequency.setTargetAtTime(700 + rev * 1400, t, .1);
    this.clatter.g.gain.setTargetAtTime(e.clatter ? volume * .018 * (.5 + load * .5) : 0, t, .1);
    this.clatter.f.frequency.setTargetAtTime(2200 + rev * 900, t, .1);
    // Overrun: lifting off at high revs crackles through the exhaust.
    if (e.pops && throttle < .05 && rev > .45 && v > 8 && volume > 0) {
      this.popClock -= dt;
      if (this.popClock <= 0) { this.pop(volume); this.popClock = .05 + Math.random() * (rev > .7 ? .25 : .6); }
    } else this.popClock = .2;
    this.whine.frequency.setTargetAtTime(v * 26 + 40, t, .1);
    this.whineGain.gain.setTargetAtTime(volume * (reverse ? .012 : .0035) * Math.min(1, v / 8), t, .1);
    this.road.g.gain.setTargetAtTime(volume * .16 * Math.min(1, v / 30) * (grounded ? 1 : .2), t, .15);
    this.road.f.frequency.setTargetAtTime(160 + v * 6, t, .2);
    this.gravel.g.gain.setTargetAtTime(offroad && grounded ? volume * .12 * Math.min(1, v / 12) : 0, t, .1);
    // Brakes: pads hiss while slowing and many cars squeal faintly just before they stop.
    const braking = brake > .15 && v > .4 && grounded;
    this.brakeHiss.g.gain.setTargetAtTime(braking ? volume * .03 * brake * Math.min(1, v / 18) : 0, t, .05);
    if (!braking || v > 6) this.stopSqueal = braking ? this.stopSqueal : Math.random() < .7;
    this.brakeToneGain.gain.setTargetAtTime(braking && this.stopSqueal && v < 4.5 ? volume * .012 * Math.min(1, (4.5 - v) / 2) : 0, t, .04);
    const slip = grounded ? Math.max(Math.abs(steer) * v > 7.5 ? (Math.abs(steer) * v - 7.5) / 6 : 0, brake > .6 && v > 9 ? (brake - .6) * 2.5 : 0) : 0;
    this.slip = offroad ? 0 : Math.min(1, slip);
    this.squealGain.gain.setTargetAtTime(volume * .035 * this.slip, t, .05);
    return reverse ? 'R' : `D${gear}`;
  }
}
