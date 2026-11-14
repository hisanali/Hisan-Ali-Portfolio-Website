/* Sound, all synthesised, started only from the button: the furnace, a hammer on steel, a quench. */
export function makeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const noise = seconds => {
    const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return buf;
  };
  const white = noise(2);
  // the furnace: low filtered noise that breathes
  const roar = ctx.createBufferSource(), low = ctx.createBiquadFilter(), roarGain = ctx.createGain(), lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  roar.buffer = white; roar.loop = true; low.type = 'lowpass'; low.frequency.value = 170; roarGain.gain.value = .9;
  lfo.frequency.value = .17; lfoGain.gain.value = .25; lfo.connect(lfoGain); lfoGain.connect(roarGain.gain);
  roar.connect(low); low.connect(roarGain); roarGain.connect(master); roar.start(); lfo.start();
  const hit = (type, freq, q, dur, vol, sweepTo) => {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    src.buffer = white; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + dur + .05);
  };
  return {
    ctx, master,
    strike() {            // steel rings in partials that are not a harmonic series
      const f0 = 380 + Math.random() * 190, t = ctx.currentTime;
      [[1, .22, 1.3], [2.32, .13, .9], [3.9, .08, .6], [5.41, .05, .4]].forEach(([m, v, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f0 * m;
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05);
      });
      hit('highpass', 2500, .5, .06, .3);
    },
    sizzle() { hit('highpass', 5200, .6, .22, .05); },
    quench() { hit('bandpass', 6500, .7, 2.2, .5, 800); hit('highpass', 3000, .5, .5, .25); }
  };
}
