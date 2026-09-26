/*
  The car radio. Six stations, each with its own music (composed as it plays) and its own people: a breakfast show
  with two hosts and surprise phone calls, coast phone-ins, late-night stories, a classical host, a two-host podcast and
  a business talk show. The music keeps playing under the voices, hosts talk over the intros, and they react to the drive:
  towns, junctions, the road, the weather, tunnels (where the signal crackles) and stops. Voices use the best speech
  voices the browser has (the "Natural" and online voices sound far more human than the defaults).
*/
import {showFor, eventLine, songTitle} from './radio-shows.js?v=20260926-transit3';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const freq = (m) => 440 * 2 ** ((m - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
const wait = (s) => new Promise((ok) => setTimeout(ok, s * 1000));

// format: music (songs with DJ breaks), podcast and business (talk over a quiet music bed).
export const STATIONS = [
  {id: 'evermile', name: 'Evermile FM', freq: '98.4', genre: 'lofi', tempo: [76, 90], format: 'music', tag: 'easy beats for the long way round', cast: {host: {name: 'Maya', g: 'f', rate: 1.04}, co: {name: 'Leo', g: 'm', rate: 1.03}}},
  {id: 'coast', name: 'Coast Radio', freq: '104.2', genre: 'acoustic', tempo: [94, 110], format: 'music', tag: 'sunshine, sea air and your phone calls', cast: {host: {name: 'Jess', g: 'f', rate: 1.05}}},
  {id: 'night', name: 'Night Drive', freq: '89.1', genre: 'synthwave', tempo: [100, 114], format: 'music', tag: 'neon, chrome and empty roads', cast: {host: {name: 'Nate', g: 'm', rate: .93, pitch: .92}}},
  {id: 'classic', name: 'Classic Hills', freq: '101.7', genre: 'classical', tempo: [64, 80], format: 'music', tag: 'timeless music for timeless views', cast: {host: {name: 'Eleanor', g: 'f', rate: .95}}},
  {id: 'talk', name: 'Road Talk', freq: '92.7', genre: 'lofi', tempo: [70, 80], format: 'podcast', tag: 'the long way round podcast', cast: {host: {name: 'Ben', g: 'm', rate: 1.05}, co: {name: 'Priya', g: 'f', rate: 1.06}}},
  {id: 'growth', name: 'Growth FM', freq: '96.1', genre: 'acoustic', tempo: [92, 100], format: 'business', tag: 'business talk for Oman', cast: {host: {name: 'Omar', g: 'm', rate: 1.03}, co: {name: 'Sara', g: 'f', rate: 1.04}}},
];
// People who phone in (their voices are picked to differ from the hosts').
const GUESTS = {c1: {g: 'f', rate: 1.06, pitch: 1.05}, c2: {g: 'm', rate: 1.02, pitch: .97}, kid: {g: 'f', rate: 1.15, pitch: 1.9}};

/* ---------- Voices: rank what the browser offers and cast them ---------- */
const FEMALE = /female|woman|samantha|karen|victoria|moira|tessa|fiona|serena|allison|\bava\b|susan|zira|hazel|aria|jenny|sonia|libby|natasha|clara|emma|\bamy\b|joanna|kendra|kimberly|salli|\bivy\b|olivia|michelle|\bana\b|nova|shelley|sandy|\bflo\b|catherine|elizabeth|linda|heera|neerja|ashley|cora|elsa|isla|\bjane\b|maisie|nancy|\bsara\b|abbi|bella|hollie|\bmia\b|molly|ellie|freya|yara|jessa|emily|kate|\bleah\b|nicky|\bsiri.*female/i;
const MALE = /\bmale\b|daniel|\balex\b|\bguy\b|ryan|david|mark|george|oliver|thomas|arthur|aaron|james|brian|matthew|joey|justin|russell|\beric\b|rishi|reed|christopher|roger|andrew|brandon|davis|tony|jason|william|liam|noah|elliot|ethan|prabhat|ravi|connor|luke|mitchell|ollie|alfie|\blee\b|\bsteffan\b|\bduncan\b|\bnathan\b|\bgordon\b/i;
const NOVELTY = /compact|espeak|eloquence|zarvox|whisper|bad news|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|wobble|albert|bahh|junior|ralph|\bfred\b|kathy|princess|grandma|grandpa|rocko|shelley|sandy|\bflo\b|reed|eddy/i;
function gender(v) { const n = v.name; return FEMALE.test(n) ? 'f' : MALE.test(n) ? 'm' : '?'; }
function quality(v) {
  const n = v.name; let s = 0;
  if (/natural|neural/i.test(n)) s += 14; if (/premium|enhanced/i.test(n)) s += 9; if (/online/i.test(n)) s += 5; if (/google/i.test(n)) s += 6; if (/siri/i.test(n)) s += 6;
  if (/^en[-_](gb|us|au|ie|ca|nz)/i.test(v.lang)) s += 2; if (!v.localService) s += 2; if (NOVELTY.test(n)) s -= 30;
  return s;
}
export const natural = (v) => !!v && /natural|neural|premium|enhanced|online|google|siri/i.test(v.name);

export class Radio {
  constructor(ctx, getVolume, getContext) {
    this.ctx = ctx; this.getVolume = getVolume; this.getContext = getContext;
    this.index = -1; this.song = null; this.next = 0; this.step = 0; this.talking = false; this.wait(0);
    this.token = 0; this.events = []; this.lastTalk = -99; this.lastEvent = -99; this.memory = new Map(); this.log = []; this.said = 0; this.breakDue = false;
    // Car speakers: no deep bass, soft highs, a little compression. Reverb for space.
    this.out = ctx.createGain(); this.out.gain.value = 0;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 65;
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 9500;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
    this.duck = ctx.createGain(); this.duck.gain.value = 1;
    this.bus = ctx.createGain(); this.bus.gain.value = .8;
    this.fxBus = ctx.createGain(); this.fxBus.gain.value = 1;
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.2); this.wet = ctx.createGain(); this.wet.gain.value = .22;
    this.bus.connect(this.duck); this.bus.connect(this.verb).connect(this.wet).connect(this.duck);
    this.duck.connect(hp); this.fxBus.connect(hp); hp.connect(this.lp).connect(comp).connect(this.out).connect(ctx.destination);
    const n = ctx.sampleRate; this.noise = ctx.createBuffer(1, n, n); const d = this.noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    // Reception hiss (tunnels) and the phone line under callers.
    this.hiss = this.loop(2600, .5); this.line = this.loop(1500, 1.4);
    this.voices = []; this.cast = {}; this.loadVoices();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', () => this.loadVoices());
  }

  // Pause before the next song, measured on the audio clock.
  wait(sec) { this.resumeAt = this.ctx.currentTime + sec; }
  impulse(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
    return b;
  }
  loop(tone, q) {
    const src = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.noise; src.loop = true; bp.type = 'bandpass'; bp.frequency.value = tone; bp.Q.value = q; g.gain.value = 0;
    src.connect(bp).connect(g).connect(this.fxBus); src.start(); return g;
  }

  loadVoices() {
    try { this.voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)).sort((a, b) => quality(b) - quality(a)); } catch { this.voices = []; }
    this.cast = {};
  }
  // The voice for a role on the current station: the best voice of the right kind that nobody else on the show uses.
  voiceFor(who) {
    const key = this.index + ':' + who; if (key in this.cast) return this.cast[key];
    const st = this.station, role = st.cast[who] || GUESTS[who] || st.cast.host, taken = new Set(Object.entries(this.cast).filter(([k]) => k.startsWith(this.index + ':')).map(([, v]) => v));
    const good = this.voices.filter((v) => quality(v) > -10).sort((a, b) => quality(b) - quality(a)), same = good.filter((v) => gender(v) === role.g), maybe = good.filter((v) => gender(v) === '?');
    const pool = [...same, ...maybe, ...good].filter((v, i, l) => l.indexOf(v) === i);
    // Hosts on different stations get different voices where there are enough good ones.
    const tier = same.filter((v) => quality(v) >= quality(same[0]) - 6).length, offset = who === 'host' || who === 'co' ? this.index % Math.max(1, Math.min(3, tier)) : 0;
    const free = pool.filter((v) => !taken.has(v)), list = free.length ? free : pool;
    return (this.cast[key] = list[Math.min(offset, list.length - 1)] || null);
  }

  get station() { return this.index >= 0 ? STATIONS[this.index] : null; }
  get talkShow() { return this.station && this.station.format !== 'music'; }

  // Next station in the list, then off, then round again.
  cycle(dir = 1) { const n = STATIONS.length + 1; this.tune(((this.index + 1 + dir) % n + n) % n - 1); return this.station; }
  tune(i, greet = true) {
    this.index = i; this.song = null; this.wait(.9); this.cancelTalk(); this.events = [];
    this.static(.5);
    if (this.station && greet) { this.breakDue = false; setTimeout(() => { if (this.index === i && !this.talking) this.segment(showFor(this, 'tuned')); }, 900); }
  }
  // Something happened on the drive: the host may mention it (towns, junctions, stops, the start of the drive).
  notify(kind, data = {}) {
    if (!this.station) return;
    if (kind === 'start') { this.cancelTalk(); this.events = []; this.segment(showFor(this, 'welcome')); return; }
    this.events = this.events.filter((e) => e.kind !== kind); this.events.push({kind, data, until: this.ctx.currentTime + (kind === 'town' ? 25 : 40)});
  }

  static(len, level = .18) {
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = .6;
    g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    src.connect(bp).connect(g).connect(this.fxBus); src.start(t, Math.random() * .5); src.stop(t + len);
  }

  /* ---------- Songs ---------- */
  compose() {
    const st = this.station, minor = st.genre === 'synthwave' ? Math.random() < .75 : st.genre === 'classical' ? Math.random() < .4 : Math.random() < .35;
    const scale = minor ? MINOR : MAJOR, root = 45 + Math.floor(rand(0, 10));
    const progs = minor ? [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [0, 5, 3, 4]] : [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [3, 4, 0, 5]];
    const beats = st.genre === 'classical' && Math.random() < .6 ? 3 : 4;
    const tempo = rand(...st.tempo), bars = st.genre === 'classical' ? 30 : 36;
    const prog = pick(progs), prog2 = pick(progs);
    // A short melody motif, reused and varied.
    const motif = Array.from({length: 8}, () => (Math.random() < .3 ? null : Math.floor(rand(0, 6))));
    return {scale, root, prog, prog2, beats, tempo, bars, motif, minor, swing: st.genre === 'lofi' ? .16 : 0, seed: Math.random()};
  }

  // Scale degree to MIDI note, with octaves.
  note(song, degree, octave = 0) { const n = song.scale.length, d = ((degree % n) + n) % n, o = Math.floor(degree / n); return song.root + song.scale[d] + 12 * (o + octave); }
  chord(song, degree, size = 3) { return Array.from({length: size}, (_, i) => this.note(song, degree + i * 2)); }


  update(dt) {
    const ctx = this.ctx, vol = this.getVolume(), st = this.station, c = st ? this.getContext?.() || {} : {};
    this.out.gain.setTargetAtTime(st ? vol * .5 : 0, ctx.currentTime, .15);
    // In a tunnel the signal fades to a muffled crackle.
    const weak = c.tunnel ? 1 : 0;
    this.lp.frequency.setTargetAtTime(weak ? 1100 : 9500, ctx.currentTime, .4); this.hiss.gain.setTargetAtTime(weak * .05, ctx.currentTime, .4);
    if (this.weak && !weak && st) this.notify('signal'); this.weak = weak;
    // Talk stations keep their music low under the voices; music stations duck it while someone speaks.
    this.bus.gain.setTargetAtTime(this.talkShow ? .3 : .8, ctx.currentTime, .5);
    this.duck.gain.setTargetAtTime(this.talking && !this.musicUp ? (this.talkShow ? .7 : .28) : 1, ctx.currentTime, this.talking ? .15 : .6);
    if (!vol && this.talking) this.cancelTalk();
    if (!st || !vol) { this.next = 0; return; }
    this.watchWeather(c);
    // What to say next: news from the drive first, then the show itself.
    if (!this.talking && this.ctx.currentTime > (this.quietUntil || 0)) {
      this.events = this.events.filter((e) => e.until > ctx.currentTime);
      const e = this.events[0];
      if (e && ctx.currentTime - this.lastEvent > (e.kind === 'town' ? 12 : 20)) { this.events.shift(); this.lastEvent = ctx.currentTime; const items = eventLine(this, e.kind, e.data, c); if (items) this.segment(items); }
      else if (this.talkShow) this.segment(showFor(this, 'next'));
      else if (this.breakDue) { this.breakDue = false; this.segment(showFor(this, 'break')); }
    }
    if (!this.song) {
      if (ctx.currentTime < this.resumeAt) return;
      this.song = this.compose(); this.song.meta = songTitle(st, this.song); this.step = 0; this.next = ctx.currentTime + .1;
    }
    const song = this.song, sixteenth = 60 / song.tempo / 4;
    if (this.next < ctx.currentTime - .5) this.next = ctx.currentTime + .05;
    while (this.next < ctx.currentTime + .3) {
      const swing = this.step % 2 ? song.swing * sixteenth : 0;
      this.play(song, this.step, this.next + swing, sixteenth);
      this.next += sixteenth; this.step++;
      // Song over: straight into the next one, with the host talking over its intro.
      if (this.step >= song.bars * song.beats * 4) { this.last = song; this.song = this.compose(); this.song.meta = songTitle(st, this.song); this.step = 0; this.next = ctx.currentTime + .5; if (!this.talkShow) this.breakDue = true; break; }
    }
  }

  // Rain starting or clearing, night falling and the sun coming up are worth a word.
  watchWeather(c) {
    const wet = c.rain > .35 ? 1 : c.rain < .05 ? 0 : this.wet0;
    if (this.wet0 !== undefined && wet !== this.wet0) this.notify(wet ? 'rain' : 'dry');
    this.wet0 = wet;
    const h = c.hour ?? 12, dark = h > 20.3 || h < 5.6;
    if (this.dark0 !== undefined && dark !== this.dark0) this.notify(dark ? 'night' : 'sunrise');
    this.dark0 = dark;
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


  /* ---------- Sound effects for the shows ---------- */
  fx(kind) {
    const t = this.ctx.currentTime + .02;
    if (kind === 'jingle') { this.chime(t); this.sweep(t, .9); return 1.1; }
    if (kind === 'sting') { [0, 7, 12, 16].forEach((s, i) => { const g = this.env(t + i * .09, .004, .5, .06); g.connect(this.fxBus); this.osc('triangle', freq(67 + s), t + i * .09, .6, g); }); return .8; }
    if (kind === 'ring') { for (let r = 0; r < 2; r++) for (const b of [0, .6]) { const s = t + r * 2 + b, g = this.env(s, .01, .4, .05, 'lin'); g.connect(this.fxBus); this.osc('sine', 400, s, .4, g); this.osc('sine', 450, s, .4, g); } return 3.4; }
    if (kind === 'pickup' || kind === 'hangup') { this.click(t); if (kind === 'hangup') { const g = this.env(t + .15, .005, .25, .04, 'lin'); g.connect(this.fxBus); this.osc('sine', 480, t + .15, .25, g); } return .5; }
    if (kind === 'giggle') { for (let i = 0; i < 7; i++) { const s = t + i * .13 + rand(0, .03), f = rand(620, 980) * (1 + (i % 2) * .15), g = this.env(s, .015, .09, .05); const o = this.osc('sine', f, s, .12, g), v = this.ctx.createOscillator(), vd = this.ctx.createGain(); v.frequency.value = 26; vd.gain.value = f * .08; v.connect(vd).connect(o.frequency); v.start(s); v.stop(s + .13); g.connect(this.fxBus); } return 1.1; }
    if (kind === 'cheer') { const src = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain(); src.buffer = this.noise; src.loop = true; bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .4; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + .3); g.gain.linearRampToValueAtTime(0, t + 2); src.connect(bp).connect(g).connect(this.fxBus); src.start(t); src.stop(t + 2.1); return 1.6; }
    return 0;
  }
  sweep(t, len) { const src = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain(); src.buffer = this.noise; bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(6000, t + len); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + len * .7); g.gain.linearRampToValueAtTime(0, t + len); src.connect(bp).connect(g).connect(this.fxBus); src.start(t); src.stop(t + len); }
  click(t) { const src = this.ctx.createBufferSource(), g = this.env(t, .001, .03, .12); src.buffer = this.noise; src.connect(g).connect(this.fxBus); src.start(t); src.stop(t + .05); }

  /* ---------- Speaking ---------- */
  // A segment is a list of lines ({who, text, phone}), sound effects ({fx}) and pauses ({pause}), played in order.
  segment(items) {
    if (!items || !items.length) return;
    const token = ++this.token; this.talking = true; this.lastTalk = this.ctx.currentTime;
    const run = async () => {
      for (const it of items) {
        if (token !== this.token || !this.station) return;
        if (it.fx) { await wait(this.fx(it.fx)); continue; }
        if (it.pause) { await wait(it.pause); continue; }
        if (it.music) { this.musicUp = true; await wait(it.music); this.musicUp = false; continue; }
        this.line.gain.setTargetAtTime(it.phone ? .03 : 0, this.ctx.currentTime, .05);
        await this.say(it.who || 'host', it.text, it.phone);
        await wait(it.gap ?? rand(.18, .45));
      }
    };
    run().catch(() => {}).finally(() => {
      if (token !== this.token) return;
      this.line.gain.setTargetAtTime(0, this.ctx.currentTime, .05);
      this.musicUp = false; this.talking = false; this.quietUntil = this.ctx.currentTime + (this.talkShow ? rand(1.2, 3.2) : 4);
    });
  }

  // One person's turn: each sentence is its own utterance with a touch of natural variation in pace and pitch.
  say(who, text, phone) {
    this.log.push((this.station?.cast[who]?.name || who) + ': ' + text); if (this.log.length > 60) this.log.shift(); this.said++;
    if (typeof speechSynthesis === 'undefined' || !this.getVolume()) return wait(Math.min(8, text.length / 16));
    const st = this.station, role = st.cast[who] || GUESTS[who] || st.cast.host, voice = this.voiceFor(who), good = natural(voice);
    const parts = text.match(/[^.!?…]+[.!?…]*["”']?\s*/g) || [text];
    return new Promise((ok) => {
      let left = parts.length, done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); ok(); } };
      const words = text.split(/\s+/).length, timer = setTimeout(() => { try { speechSynthesis.cancel(); } catch {} finish(); }, (words / 2.3 / (role.rate || 1) + 3) * 1000);
      for (const p of parts) {
        const u = new SpeechSynthesisUtterance(p.trim()); if (voice) { u.voice = voice; u.lang = voice.lang; }
        // Good voices already sound natural; others get the character's pitch to tell people apart.
        const base = good ? 1 + ((role.pitch || 1) - 1) * .35 : role.pitch || 1, q = /[?]$/.test(p.trim()) ? 1.03 : /!$/.test(p.trim()) ? 1.02 : 1;
        u.pitch = Math.max(.1, Math.min(2, base * q * rand(.97, 1.03))); u.rate = (role.rate || 1) * rand(.97, 1.03) * (phone ? 1.02 : 1);
        u.volume = Math.min(1, this.getVolume() * (phone ? 1.8 : 2.2));
        u.onend = () => { if (--left <= 0) finish(); }; u.onerror = () => finish();
        try { speechSynthesis.speak(u); } catch { finish(); }
      }
    });
  }
  cancelTalk() { this.token++; try { speechSynthesis.cancel(); } catch {} this.talking = false; this.line.gain.setTargetAtTime(0, this.ctx.currentTime, .05); this.duck.gain.setTargetAtTime(1, this.ctx.currentTime, .2); }

  // Pick an option not used lately, so the shows do not repeat themselves.
  fresh(key, list) {
    const seen = this.memory.get(key) || []; let choice = list.filter((x, i) => !seen.includes(i));
    if (!choice.length) { seen.length = 0; choice = list; }
    const item = pick(choice), i = list.indexOf(item); seen.push(i); if (seen.length > Math.max(1, Math.floor(list.length * .7))) seen.shift(); this.memory.set(key, seen);
    return item;
  }
}
