/*
  The car radio. Four stations, each playing its own endless music, composed as it plays: lo-fi beats, acoustic guitar
  by the sea, synthwave for the night and gentle classical. Between songs the DJ talks now and then: the station, the
  time, the weather, the town you are coming into. The sound goes through a small car-speaker filter.
*/
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const freq = (m) => 440 * 2 ** ((m - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];

export const STATIONS = [
  {id: 'evermile', name: 'Evermile FM', freq: '98.4', genre: 'lofi', tempo: [76, 90], voice: {pitch: 1, rate: .96}, tag: 'easy beats for the long way round'},
  {id: 'coast', name: 'Coast Radio', freq: '104.2', genre: 'acoustic', tempo: [94, 110], voice: {pitch: 1.12, rate: 1}, tag: 'sunshine and sea air'},
  {id: 'night', name: 'Night Drive', freq: '89.1', genre: 'synthwave', tempo: [100, 114], voice: {pitch: .82, rate: .92}, tag: 'neon, chrome and empty roads'},
  {id: 'classic', name: 'Classic Hills', freq: '101.7', genre: 'classical', tempo: [64, 80], voice: {pitch: .95, rate: .9}, tag: 'timeless music for timeless views'},
];

export class Radio {
  constructor(ctx, getVolume, getContext) {
    this.ctx = ctx; this.getVolume = getVolume; this.getContext = getContext;
    this.index = -1; this.song = null; this.next = 0; this.step = 0; this.talking = false; this.wait(0); this.songsSinceTalk = 0;
    // Car speakers: no deep bass, soft highs, a little compression. Reverb for space.
    this.out = ctx.createGain(); this.out.gain.value = 0;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 65;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
    this.duck = ctx.createGain(); this.duck.gain.value = 1;
    this.bus = ctx.createGain(); this.bus.gain.value = .8;
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.2); this.wet = ctx.createGain(); this.wet.gain.value = .22;
    this.bus.connect(this.duck); this.bus.connect(this.verb).connect(this.wet).connect(this.duck);
    this.duck.connect(hp).connect(lp).connect(comp).connect(this.out).connect(ctx.destination);
    const n = ctx.sampleRate; this.noise = ctx.createBuffer(1, n, n); const d = this.noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.voices = []; this.loadVoices();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', () => this.loadVoices());
  }

  // Pause before the next song, measured on the audio clock.
  wait(sec) { this.resumeAt = this.ctx.currentTime + sec; }

  impulse(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
    return b;
  }

  loadVoices() { try { this.voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); } catch { this.voices = []; } }

  get station() { return this.index >= 0 ? STATIONS[this.index] : null; }

  // Next station in the list, then off, then round again.
  cycle(dir = 1) { const n = STATIONS.length + 1; this.tune(((this.index + 1 + dir) % n + n) % n - 1); return this.station; }
  tune(i) {
    this.index = i; this.song = null; this.wait(.9); this.cancelTalk();
    this.static(.5);
    // Often the DJ says hello before the music starts.
    if (this.station && Math.random() < .6) { this.wait(99); setTimeout(() => { if (this.station && this.index === i && !this.talking) this.talk(this.ident()); else if (this.index === i) this.wait(.5); }, 900); }
  }

  static(len) {
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = .6;
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    src.connect(bp).connect(g).connect(this.duck); src.start(t, Math.random() * .5); src.stop(t + len);
  }

  /* ---------- Songs ---------- */
  compose() {
    const st = this.station, minor = st.genre === 'synthwave' ? Math.random() < .75 : st.genre === 'classical' ? Math.random() < .4 : Math.random() < .35;
    const scale = minor ? MINOR : MAJOR, root = 45 + Math.floor(rand(0, 10));
    const progs = minor ? [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [0, 5, 3, 4]] : [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [3, 4, 0, 5]];
    const beats = st.genre === 'classical' && Math.random() < .6 ? 3 : 4;
    const tempo = rand(...st.tempo), bars = st.genre === 'classical' ? 40 : 48;
    const prog = pick(progs), prog2 = pick(progs);
    // A short melody motif, reused and varied.
    const motif = Array.from({length: 8}, () => (Math.random() < .3 ? null : Math.floor(rand(0, 6))));
    return {scale, root, prog, prog2, beats, tempo, bars, motif, minor, swing: st.genre === 'lofi' ? .16 : 0, seed: Math.random()};
  }

  // Scale degree to MIDI note, with octaves.
  note(song, degree, octave = 0) { const n = song.scale.length, d = ((degree % n) + n) % n, o = Math.floor(degree / n); return song.root + song.scale[d] + 12 * (o + octave); }
  chord(song, degree, size = 3) { return Array.from({length: size}, (_, i) => this.note(song, degree + i * 2)); }

  update(dt) {
    const ctx = this.ctx, vol = this.getVolume();
    this.out.gain.setTargetAtTime(this.station ? vol * .5 : 0, ctx.currentTime, .15);
    if (!vol && this.talking) this.cancelTalk();
    if (!this.station || !vol) { this.next = 0; return; }
    if (this.talking) return;
    if (!this.song) {
      if (ctx.currentTime < this.resumeAt) return;
      this.song = this.compose(); this.step = 0; this.next = ctx.currentTime + .1;
    }
    const song = this.song, sixteenth = 60 / song.tempo / 4;
    if (this.next < ctx.currentTime - .5) this.next = ctx.currentTime + .05;
    while (this.next < ctx.currentTime + .3) {
      const swing = this.step % 2 ? song.swing * sixteenth : 0;
      this.play(song, this.step, this.next + swing, sixteenth);
      this.next += sixteenth; this.step++;
      if (this.step >= song.bars * song.beats * 4) { this.song = null; this.songsSinceTalk++; this.wait(.8); if (this.songsSinceTalk >= 1 && Math.random() < .6) { this.songsSinceTalk = 0; this.wait(99); setTimeout(() => this.talk(this.line()), 900); } break; }
    }
  }

  play(song, step, t, dur) {
    const g = this.station.genre, spb = song.beats * 4, bar = Math.floor(step / spb), pos = step % spb, beat = pos / 4;
    const section = Math.floor(bar / 8) % 4, prog = section === 2 ? song.prog2 : song.prog, deg = prog[Math.floor(bar / (song.beats === 3 ? 1 : 1)) % 4];
    const end = song.bars * spb, fade = Math.min(1, (end - step) / (spb * 2), (step + 1) / (spb * 2)) * (section === 3 ? .92 : 1);
    const intro = bar < 2, full = section === 1 || section === 2;
    if (g === 'lofi') {
      if (!intro) {
        if (pos === 0 || pos === 10 || (pos === 7 && bar % 2)) this.kick(t, .55 * fade);
        if (pos === 4 || pos === 12) this.snare(t, .28 * fade, 1800);
        if (pos % 2 === 0) this.hat(t, (pos % 4 ? .05 : .08) * fade * rand(.6, 1));
      }
      if (pos === 0) { for (const m of this.chord(song, deg, 4)) this.ep(freq(m + 12), t + rand(0, .03), dur * 14, .08 * fade); this.bass(freq(this.note(song, deg, -1)), t, dur * 6, .3 * fade); }
      if (pos === 8) this.bass(freq(this.note(song, deg + (bar % 2 ? 4 : 0), -1)), t, dur * 5, .24 * fade);
      if (full && pos % 4 === 2) { const m = song.motif[(bar * 4 + pos / 4) % 8 | 0]; if (m !== null) this.ep(freq(this.note(song, deg + m, 2)), t, dur * 3, .06 * fade); }
      if (pos === 0 && bar % 4 === 0) this.crackle(t, dur * spb * 4);
    } else if (g === 'acoustic') {
      const tones = this.chord(song, deg, 3).map((m) => m + 12), order = [0, 1, 2, 1, 0, 2, 1, 2];
      if (pos % 2 === 0) this.pluck(freq(tones[order[(pos / 2) % 8]] + (pos % 8 === 6 ? 12 : 0)), t, .11 * fade);
      if (pos === 0) this.pluck(freq(this.note(song, deg, -1) + 12), t, .12 * fade);
      if (!intro) { if (pos === 0 || pos === 8) this.kick(t, .32 * fade, 80); if (pos === 4 || pos === 12) this.snare(t, .1 * fade, 3000); this.hat(t, .025 * fade); }
      if (pos === 0 || pos === 8) this.bass(freq(this.note(song, deg, -1)), t, dur * 7, .2 * fade, 'triangle');
      if (full && pos % 4 === 0) { const m = song.motif[(bar * 4 + pos / 4) % 8 | 0]; if (m !== null) this.flute(freq(this.note(song, deg + m, 2)), t, dur * 4, .05 * fade); }
    } else if (g === 'synthwave') {
      if (!intro) { if (pos % 4 === 0) this.kick(t, .6 * fade); if (pos === 4 || pos === 12) this.snare(t, .36 * fade, 1400, true); if (pos % 2 === 1) this.hat(t, .04 * fade); }
      const tones = this.chord(song, deg, 3);
      this.arp(freq(tones[pos % 3] + 12 + (pos % 6 > 2 ? 12 : 0)), t, dur * .9, .045 * fade);
      if (pos % 2 === 0) this.bass(freq(this.note(song, deg, -1) + (pos % 4 ? 12 : 0)), t, dur * 1.8, .22 * fade, 'sawtooth');
      if (pos === 0) for (const m of tones) this.pad(freq(m + 12), t, dur * spb, .05 * fade);
      if (full && pos % 8 === 0) { const m = song.motif[(bar * 2 + pos / 8) % 8 | 0]; if (m !== null) this.lead(freq(this.note(song, deg + m, 2)), t, dur * 6, .06 * fade); }
    } else {
      // Classical: broken chords on the piano, strings holding the harmony, a simple tune on top.
      const tones = this.chord(song, deg, 3);
      if (song.beats === 3) { if (pos === 0) this.piano(freq(this.note(song, deg, -1)), t, .16 * fade); if (pos === 4 || pos === 8) for (const m of tones) this.piano(freq(m + 12), t, .07 * fade); }
      else if (pos % 2 === 0) this.piano(freq((pos === 0 ? this.note(song, deg, -1) : tones[(pos / 2) % 3] + 12)), t, (pos === 0 ? .15 : .08) * fade);
      if (pos === 0) for (const m of tones) this.strings(freq(m), t, dur * spb, .035 * fade);
      if (!intro && pos % 4 === 0) { const m = song.motif[(bar * song.beats + pos / 4) % 8 | 0]; if (m !== null && (full || Math.random() < .5)) this.piano(freq(this.note(song, deg + m, 2)), t, .1 * fade); }
    }
  }

  /* ---------- Instruments ---------- */
  env(t, a, d, peak, curve = 'exp') { const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); else g.gain.linearRampToValueAtTime(0, t + a + d); return g; }
  osc(type, f, t, len, dest, detune = 0) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(dest); o.start(t); o.stop(t + len + .05); return o; }
  kick(t, v, top = 110) { const g = this.env(t, .003, .38, v), o = this.ctx.createOscillator(); o.frequency.setValueAtTime(top, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); o.connect(g).connect(this.bus); o.start(t); o.stop(t + .45); }
  snare(t, v, tone, big = false) { const src = this.ctx.createBufferSource(); src.buffer = this.noise; const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = tone; bp.Q.value = .8; const g = this.env(t, .002, big ? .32 : .16, v); src.connect(bp).connect(g).connect(this.bus); src.start(t, Math.random() * .5); src.stop(t + .4); const b = this.env(t, .002, .08, v * .5); this.osc('triangle', 185, t, .1, b); b.connect(this.bus); }
  hat(t, v) { const src = this.ctx.createBufferSource(); src.buffer = this.noise; const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500; const g = this.env(t, .001, .045, v); src.connect(hp).connect(g).connect(this.bus); src.start(t, Math.random() * .5); src.stop(t + .08); }
  bass(f, t, len, v, type = 'triangle') { const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = type === 'sawtooth' ? 600 : 900; const g = this.env(t, .01, len, v, 'lin'); lp.connect(g).connect(this.bus); this.osc(type, f, t, len, lp); }
  // Electric piano: a sine carrier with a decaying frequency-modulation shimmer.
  ep(f, t, len, v) { const g = this.env(t, .005, len, v), mod = this.ctx.createOscillator(), depth = this.ctx.createGain(); mod.frequency.value = f; depth.gain.setValueAtTime(f * 1.2, t); depth.gain.exponentialRampToValueAtTime(f * .05, t + .6); const car = this.ctx.createOscillator(); car.frequency.value = f; mod.connect(depth).connect(car.frequency); car.connect(g).connect(this.bus); mod.start(t); car.start(t); mod.stop(t + len); car.stop(t + len); }
  pluck(f, t, v) { const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + .4); const g = this.env(t, .002, .9, v); lp.connect(g).connect(this.bus); this.osc('sawtooth', f, t, 1, lp); this.osc('triangle', f * 2, t, .6, lp, 4); }
  flute(f, t, len, v) { const g = this.env(t, .08, len, v, 'lin'), o = this.osc('sine', f, t, len, g), vib = this.ctx.createOscillator(), vd = this.ctx.createGain(); vib.frequency.value = 5; vd.gain.value = f * .006; vib.connect(vd).connect(o.frequency); vib.start(t); vib.stop(t + len); g.connect(this.bus); }
  arp(f, t, len, v) { const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + len); const g = this.env(t, .002, len, v); lp.connect(g).connect(this.bus); this.osc('sawtooth', f, t, len, lp); this.osc('square', f * 1.005, t, len, lp); }
  pad(f, t, len, v) { const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + len * .3); g.gain.linearRampToValueAtTime(0, t + len); lp.connect(g).connect(this.bus); for (const d of [-9, 9]) this.osc('sawtooth', f, t, len, lp, d); }
  lead(f, t, len, v) { const g = this.env(t, .02, len, v), lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(g).connect(this.bus); const o = this.osc('square', f, t, len, lp); const vib = this.ctx.createOscillator(), vd = this.ctx.createGain(); vib.frequency.value = 5.5; vd.gain.value = f * .008; vib.connect(vd).connect(o.frequency); vib.start(t + .15); vib.stop(t + len); }
  piano(f, t, v) { const g = this.env(t, .002, 1.8, v); g.connect(this.bus); for (const [h, a] of [[1, 1], [2, .35], [3, .14], [4, .06]]) { const k = this.ctx.createGain(); k.gain.value = a; k.connect(g); this.osc(h === 1 ? 'triangle' : 'sine', f * h, t, 2, k, h * 1.5); } }
  strings(f, t, len, v) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .5); g.gain.linearRampToValueAtTime(0, t + len + .3); const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000; lp.connect(g).connect(this.bus); for (const d of [-6, 0, 7]) { const o = this.osc('sawtooth', f, t, len + .3, lp, d); const vib = this.ctx.createOscillator(), vd = this.ctx.createGain(); vib.frequency.value = 4.5 + d * .05; vd.gain.value = f * .004; vib.connect(vd).connect(o.frequency); vib.start(t); vib.stop(t + len + .3); } }
  crackle(t, len) { const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = .25; const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; const g = this.ctx.createGain(); g.gain.value = .012; src.connect(hp).connect(g).connect(this.bus); src.start(t); src.stop(t + len); }
  chime(t) { [0, 4, 7, 12].forEach((s, i) => { const g = this.env(t + i * .12, .005, 1.2, .07); g.connect(this.bus); this.osc('sine', freq(72 + s), t + i * .12, 1.3, g); }); }

  /* ---------- The DJ ---------- */
  ident() { const s = this.station; return pick([`You're tuned to ${s.name}, ${s.freq}. ${cap(s.tag)}.`, `This is ${s.name} on ${s.freq}. Glad you're with us.`, `${s.name}, ${s.freq}. Sit back, the road's all yours.`]); }

  line() {
    const s = this.station, c = this.getContext?.() || {}, h = c.hour ?? 12, lines = [];
    const time = c.clock ? `It's ${speakTime(c.clock)}` : '';
    const part = h < 5 ? 'in the small hours' : h < 9 ? 'this morning' : h < 12 ? 'this morning' : h < 17 ? 'this afternoon' : h < 20.5 ? 'this evening' : 'tonight';
    lines.push(this.ident());
    if (time) lines.push(`${time} here on ${s.name}. Hope the drive's treating you well ${part}.`);
    if (c.rain > .5) lines.push(pick(['Rain coming down across the hills right now. Take it easy out there, and keep those wipers going.', 'Wet roads out there tonight. Leave a little extra room, and enjoy the sound of the rain.']));
    else if (c.rain > .05) lines.push('A bit of drizzle about. It should clear through in a while.');
    else if (c.cloud > .7) lines.push('Clouds building up over the hills. Might be rain on the way later.');
    else if (h > 17.3 && h < 19.6) lines.push('That sun is getting low. If you can pull over somewhere, it is a beautiful evening for it.');
    else if (h > 5 && h < 8 && c.mist > .3) lines.push('Some mist lying in the valleys this morning. Lovely, but watch your speed down there.');
    else if (h > 21 || h < 4.5) lines.push(pick(['Clear skies tonight. Plenty of stars out, if you can find somewhere dark.', 'Late one tonight. Stay with us, we will keep you company.']));
    else lines.push(pick(['Clear and bright out there. Perfect driving weather.', 'Blue skies across the region. Windows down, if you ask me.']));
    if (c.town) lines.push(pick([`Coming up on ${c.town}? Say hello from all of us.`, `Shout out to everyone in ${c.town} today.`]));
    if (c.road === 'mountain') lines.push('If you are up on the mountain pass, mind those bends, and look out for snow near the top.');
    if (c.road === 'highway') lines.push('Traffic on the motorway is moving nicely in both directions.');
    if (c.road === 'coast') lines.push('Down on the lakeside road, the water is looking gorgeous right now.');
    if (c.fuel !== undefined && c.fuel < .2) lines.push('Running low on fuel? There are services along the way, keep an eye out for the signs.');
    lines.push(pick([`Here's another one for you on ${s.name}.`, 'Right, back to the music.', 'Keep it here. More music coming right up.', `${s.freq}, ${s.name}. Let's keep rolling.`]));
    // Two or three sentences: an opener, one about the conditions, a sign-off.
    const opener = lines[Math.random() < .5 ? 0 : Math.min(1, lines.length - 1)], mid = lines.slice(2, -1), close = lines[lines.length - 1];
    return [opener, mid.length ? pick(mid) : '', close].filter(Boolean).join(' ');
  }

  talk(text) {
    this.wait(1.2); this.song = null;
    if (!this.station || typeof speechSynthesis === 'undefined' || !this.getVolume()) { this.talking = false; return; }
    this.talking = true;
    const ctx = this.ctx; this.chime(ctx.currentTime + .05);
    this.duck.gain.setTargetAtTime(.35, ctx.currentTime, .2);
    const u = new SpeechSynthesisUtterance(text), p = this.station.voice;
    const voices = this.voices.length ? this.voices : [];
    if (voices.length) u.voice = voices[(this.index * 3 + 1) % voices.length];
    u.pitch = p.pitch; u.rate = p.rate; u.volume = Math.min(1, this.getVolume() * 2.2);
    const done = () => { this.talking = false; this.duck.gain.setTargetAtTime(1, this.ctx.currentTime, .4); this.wait(.6); };
    u.onend = done; u.onerror = done;
    setTimeout(() => { try { speechSynthesis.speak(u); } catch { done(); } }, 700);
    // Some browsers never fire onend: give up after a while.
    clearTimeout(this.talkTimer); this.talkTimer = setTimeout(() => { if (this.talking) done(); }, 16000);
  }
  cancelTalk() { if (this.talking) { try { speechSynthesis.cancel(); } catch {} this.talking = false; this.duck.gain.setTargetAtTime(1, this.ctx.currentTime, .2); } }
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function speakTime(clock) {
  const [h, m] = clock.split(':').map(Number), h12 = h % 12 || 12, words = m === 0 ? `${h12} o'clock` : m < 10 ? `${h12} oh ${m}` : `${h12} ${m}`;
  return `${words} ${h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night'}`;
}
