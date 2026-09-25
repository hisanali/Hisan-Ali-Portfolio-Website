// Driving sound: an engine that revs through an automatic gearbox, tyre squeal, road rumble, gravel crunch and a horn.
const GEARS = {coupe: [0, 9, 17, 25, 33, 42, 999], coach: [0, 5, 10, 16, 22, 999], bike: [0, 10, 19, 28, 37, 46, 999]};
const IDLE = 850, REDLINE = {coupe: 7800, coach: 2600, bike: 10500};

export class DriveAudio {
  constructor(ctx) {
    this.ctx = ctx; this.gear = 1; this.rpm = IDLE; this.shiftDip = 0;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination); this.out = out;
    // Engine: two detuned sawtooth voices and a sub, through a throttle-driven low-pass filter.
    this.engineGain = ctx.createGain(); this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter(); this.engineFilter.type = 'lowpass'; this.engineFilter.Q.value = 3;
    this.voices = [['sawtooth', 1, 0], ['sawtooth', 1.005, .6], ['square', .5, .45], ['triangle', 2, .25]].map(([type, ratio, level]) => {
      const o = ctx.createOscillator(); o.type = type; const g = ctx.createGain(); g.gain.value = level || .8;
      o.connect(g).connect(this.engineFilter); o.start(); return {o, ratio};
    });
    this.engineFilter.connect(this.engineGain).connect(out);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (type, freq, q) => {
      const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(out); src.start(); return {g, f};
    };
    this.road = loop('lowpass', 220, .7);
    this.gravel = loop('bandpass', 1400, .9);
    this.squeal = loop('bandpass', 2300, 9);
    this.hornGain = ctx.createGain(); this.hornGain.gain.value = 0;
    const hornFilter = ctx.createBiquadFilter(); hornFilter.type = 'lowpass'; hornFilter.frequency.value = 2400;
    for (const f of [415, 523]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(hornFilter); o.start(); }
    hornFilter.connect(this.hornGain).connect(out);
  }

  horn(on, volume) { this.hornGain.gain.setTargetAtTime(on ? .09 * volume : 0, this.ctx.currentTime, .015); }

  // Returns the current gear so the HUD can show it.
  update(dt, {speed, throttle, brake, steer, offroad, volume, vehicle, reverse, grounded}) {
    const t = this.ctx.currentTime, gears = GEARS[vehicle] || GEARS.coupe, red = REDLINE[vehicle] || 7800, v = Math.abs(speed);
    let gear = this.gear;
    while (gear < gears.length - 1 && v > gears[gear] + .6) { gear++; this.shiftDip = .18; }
    while (gear > 1 && v < gears[gear - 1] - 1.2) gear--;
    this.gear = gear;
    const lo = gears[gear - 1], hi = Math.min(gears[gear], gears[gear - 1] + 14), span = Math.max(1, hi - lo);
    const target = v < .3 ? IDLE + throttle * 900 : IDLE + 700 + ((v - lo) / span) * (red - IDLE - 900) + throttle * 400;
    this.shiftDip = Math.max(0, this.shiftDip - dt);
    this.rpm += ((this.shiftDip > 0 ? target * .72 : target) - this.rpm) * Math.min(1, dt * (this.shiftDip > 0 ? 18 : 7));
    const firing = this.rpm / 60 * (vehicle === 'coach' ? 3 : vehicle === 'bike' ? 2 : 4);
    for (const voice of this.voices) voice.o.frequency.setTargetAtTime(firing * voice.ratio, t, .03);
    this.engineFilter.frequency.setTargetAtTime(380 + throttle * 2400 + this.rpm * .12, t, .05);
    const load = .35 + throttle * .65;
    this.engineGain.gain.setTargetAtTime(volume * .055 * load * (this.shiftDip > 0 ? .55 : 1), t, .05);
    this.road.g.gain.setTargetAtTime(volume * .16 * Math.min(1, v / 30) * (grounded ? 1 : .2), t, .15);
    this.road.f.frequency.setTargetAtTime(160 + v * 6, t, .2);
    this.gravel.g.gain.setTargetAtTime(offroad && grounded ? volume * .12 * Math.min(1, v / 12) : 0, t, .1);
    const slip = grounded ? Math.max(Math.abs(steer) * v > 7.5 ? (Math.abs(steer) * v - 7.5) / 6 : 0, brake > .6 && v > 9 ? (brake - .6) * 2.5 : 0) : 0;
    this.squeal.g.gain.setTargetAtTime(offroad ? 0 : volume * .05 * Math.min(1, slip), t, .06);
    this.slip = offroad ? 0 : Math.min(1, slip);
    return reverse ? 'R' : `D${gear}`;
  }
}
