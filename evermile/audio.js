// Driving sound, synthesised live: an engine voiced for each vehicle (V8 coupé, six-cylinder diesel coach, four-cylinder bike)
// revving through an automatic gearbox, with intake and exhaust character, overrun pops, brake hiss and squeal,
// tonal tyre squeal, road rumble, gravel crunch and a horn.
// Engine rpm per m/s in each gear, and the automatic gearbox's shift points (they rise with throttle, so flooring it holds gears and kicks down).
const GEARS = {
  mercedes: {ratio: [430,260,175,128,103], up: [2100,3700], down: [1000,1900]},
  coupe: {ratio: [490, 330, 245, 190, 155, 128, 105], up: [2300, 5200], down: [1250, 2600]},
  coach: {ratio: [480, 280, 175, 125, 95, 78], up: [1650, 800], down: [900, 550]},
  bike: {ratio: [680, 500, 400, 340, 300, 265], up: [5200, 5600], down: [2800, 2400]},
};
const ENGINE = {
  mercedes: {idle: 780, red: 6200, firing: 2, falloff: 1.15, sub: .3, drive: 1.6, reson: [125,510], bright: .7, pops: false, level: .05},
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
  update(dt, {speed, throttle, brake, steer, offroad, volume, vehicle, reverse, grounded}) {
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
    this.engineGain.gain.setTargetAtTime(volume * e.level * (.45 + load * .55) * (.8 + rev * .3) * cut, t, .04);
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
