// Afterdark rain measurements: dry against wet braking from the same speed, a puddle crossing, a run through the
// coast road tunnel on a rainy night, paint drying under cover, and the tyre water sound.
// Serve the repo root (python3 -m http.server 8765), then: node scripts/afterdark-rain-measure.cjs [label]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 320, height: 200 } }); p.setDefaultTimeout(400000);
  p.on('pageerror', e => console.log('PAGEERR ' + e.message.slice(0, 300)));
  await p.route(/googletagmanager|fonts\.g/, r => r.abort());
  await p.goto((process.env.AFTERDARK_URL || 'http://localhost:8765/afterdark/') + '?gfx=low', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__afterdark && window.__afterdark.S.mode === 'menu', null, { timeout: 400000 });
  const out = { braking: {} };

  // Shared helpers, installed once in the page
  await p.evaluate(() => { const A = window.__afterdark, DT = 1 / 60;
    const H = window.__rain = { DT, P: 120, env0: A.city.setTime(13, 0) };
    H.C = o => Object.assign({ steer: 0, throttle: 0, brake: 0, hand: false }, o);
    H.step = c => { const pl = A.player, n = Math.min(10, Math.max(2, Math.ceil(Math.abs(pl.speed) * DT / 0.4))); let h = 0; for (let q = 0; q < n; q++) h = Math.max(h, pl.drive(DT / n, c)); return h; };
    // Put the car down already moving at v along heading h
    H.launch = (x, z, h, v) => { const pl = A.player; pl.place(x, z, h); pl.vel.set(Math.sin(h) * v, 0, Math.cos(h) * v); pl.speed = v; };
    H.weather = (wet, rain = wet) => { A.player.setTime({ ...H.env0, wet, night: wet, rain }); return A.player.roadWet ?? wet; };
    H.wetHere = () => A.player.roadWet ?? 1;
    H.r1 = v => +v.toFixed(1); H.r2 = v => +v.toFixed(2); H.r3 = v => +v.toFixed(3);
    // The longest tunnel on the coast road, as [first sample, last sample]
    { const S = A.world.samples; let best = null, from = -1; for (let i = 0; i <= S.length; i++) { const on = i < S.length && S[i].tunnel && S[i].road === 'coast'; if (on && from < 0) from = i; if (!on && from >= 0) { if (!best || i - from > best[1] - best[0]) best = [from, i - 1]; from = -1; } } H.tunnel = best; }
  });

  // 1. Braking from the same speed on a dry and a soaked city street, every garage car
  for (const id of ['coupe', 'hatch', 'sedan', 'pickup', 'suv']) {
    await p.evaluate(id => window.__afterdark.useCar(id), id);
    out.braking[id] = await p.evaluate(() => { const A = window.__afterdark, H = window.__rain, pl = A.player, res = {};
      for (const kmh of [50, 80, 120]) for (const wet of [0, 1]) { H.weather(wet); H.launch(H.P * 3 - 5.5, 60, 0, kmh / 3.6); const z0 = pl.pos.z; let t = 0;
        while (pl.speed > 0.05 && t < 20) { H.step(H.C({ brake: 1 })); t += H.DT; }
        res[`${kmh} km/h ${wet ? 'wet' : 'dry'}`] = { metres: H.r1(pl.pos.z - z0), seconds: H.r2(t), meanG: H.r2((kmh / 3.6) ** 2 / (2 * (pl.pos.z - z0)) / 9.81) }; }
      for (const kmh of [50, 80, 120]) { const d = res[`${kmh} km/h dry`].metres, w = res[`${kmh} km/h wet`].metres; res[`${kmh} km/h wet is longer by`] = { metres: H.r1(w - d), percent: Math.round((w / d - 1) * 100) }; }
      return res; });
    console.log('braking', id, JSON.stringify(out.braking[id]));
  }
  await p.evaluate(() => window.__afterdark.useCar('coupe'));

  // 2. Braking from 80 km/h on a rainy night: open coast road against the middle of the tunnel
  out.tunnelBraking = await p.evaluate(() => { const A = window.__afterdark, H = window.__rain, pl = A.player, S = A.world.samples, res = {};
    const [a, e] = H.tunnel, mid = S[Math.round((a + e) / 2)], open = S[a - 60];
    const stop = (s, wet) => { H.weather(wet); H.launch(s.x - s.lx * 2.5, s.z - s.lz * 2.5, Math.atan2(s.tx, s.tz), 22.22); const x0 = pl.pos.x, z0 = pl.pos.z; let t = 0; const grip = H.wetHere();
      while (pl.speed > 0.05 && t < 20) { const la = S[Math.min(e + 80, s.i + 4 + Math.round(Math.hypot(pl.pos.x - s.x, pl.pos.z - s.z) / 3))], want = Math.atan2(la.x - la.lx * 2.5 - pl.pos.x, la.z - la.lz * 2.5 - pl.pos.z), df = Math.atan2(Math.sin(want - pl.heading), Math.cos(want - pl.heading));
        H.step(H.C({ brake: 1, steer: Math.abs(df) > 0.02 ? Math.sign(df) : 0 })); t += H.DT; }
      return { metres: H.r1(Math.hypot(pl.pos.x - x0, pl.pos.z - z0)), seconds: H.r2(t), roadWetness: H.r2(wet ? grip : 0), gradientPct: H.r1((S[s.i + 8].y - s.y) / 24 * 100) }; };
    res.tunnelLengthM = (e - a) * 3;
    res['open road, dry'] = stop(open, 0); res['open road, raining'] = stop(open, 1); res['mid tunnel, dry day'] = stop(mid, 0); res['mid tunnel, raining outside'] = stop(mid, 1);
    return res; });
  console.log('tunnel braking', JSON.stringify(out.tunnelBraking));

  // 3. Puddle crossing: hold a steady speed along a city lane, through one stretch of standing water with wet road before and after
  out.puddle = await p.evaluate(() => { const A = window.__afterdark, H = window.__rain, pl = A.player, spray = A.spray, res = {};
    if (!spray) return { skipped: 'spray is not exposed on this build' };
    const mesh = spray.mesh, geo = mesh.geometry, x0 = H.P * 3 - 3.2, depthAt = z => Math.max(...pl.tyreContacts.map(w => A.city.puddleAt(x0 + w.x, z)));
    // a puddle at least 4 m long and properly deep, with 20 m of plain wet road before and after it
    let spot = null; for (let z = 140; z < 900 && !spot; z += 0.25) { if (depthAt(z) < 0.02) continue; let end = z, deep = 0, clear = true; while (depthAt(end) >= 0.02 && end < z + 40) { deep = Math.max(deep, depthAt(end)); end += 0.25; }
      for (let q = z - 21; q < z - 1; q += 0.5) if (depthAt(q) > 0) clear = false; for (let q = end + 1; q < end + 21; q += 0.5) if (depthAt(q) > 0) clear = false;
      if (clear && deep > 0.85 && end - z >= 4 && end - z < 30) spot = { from: z, to: end, deep }; z = end; }
    if (!spot) return { skipped: 'no isolated puddle found' };
    res.puddle = { lane: 'x ' + H.r1(x0), fromZ: H.r1(spot.from), lengthM: H.r1(spot.to - spot.from), deepest: H.r2(spot.deep) };
    const front = Math.max(...pl.tyreContacts.map(w => w.z)), rear = Math.min(...pl.tyreContacts.map(w => w.z)), halfWidth = pl.wid / 2;
    for (const kmh of [50, 80, 120]) { const v = kmh / 3.6; H.weather(1); spray.clear(); H.launch(x0, spot.from - 19 - front, 0, v);
      const R = { before: [], inside: [], peak: 0, peakHeight: 0, heights: [], reach: 0, gone: null, lingerM: 0, outward: 0, back: 0, born: 0, launchDeg: [], outSpeed: [] }; let t = 0, leftAt = null, seenIds = 0;
      while (pl.pos.z + rear < spot.to + 19) { H.step(H.C({ throttle: pl.speed < v ? 1 : 0 })); spray.emit(H.DT, pl, H.wetHere(), A.city.puddleAt); spray.update(H.DT, 1); t += H.DT;
        const n = geo.instanceCount, c = geo.attributes.iCenter.array, d = geo.attributes.iDirection.array, zf = pl.pos.z + front, zr = pl.pos.z + rear, inWater = zf >= spot.from && zr <= spot.to;
        if (zr > spot.to && leftAt == null) leftAt = t;
        let top = 0; for (let i = 0; i < n; i++) { const h = c[i * 3 + 1] - pl.surfaceY(c[i * 3], c[i * 3 + 2]); top = Math.max(top, h); if (inWater || leftAt != null) { R.heights.push(h); R.reach = Math.max(R.reach, Math.abs(c[i * 3] - pl.pos.x) - halfWidth); }
          // a drop on its way up was thrown this instant or just before: read its direction then
          if (inWater && d[i * 3 + 1] > 0.5) { const out = d[i * 3] * Math.sign(c[i * 3] - pl.pos.x); R.born++; if (out > 1) { R.outward++; R.outSpeed.push(out); R.launchDeg.push(Math.atan2(d[i * 3 + 1], out) * 57.2958); } else if (Math.abs(d[i * 3]) < 0.6) R.back++; } }
        if (zf < spot.from - 1) R.before.push(n); else if (inWater) { R.inside.push(n); R.peak = Math.max(R.peak, n); R.peakHeight = Math.max(R.peakHeight, top); }
        else if (leftAt != null) { R.peakHeight = Math.max(R.peakHeight, top); const base = R.before.reduce((s, q) => s + q, 0) / Math.max(1, R.before.length); if (R.gone == null && n <= base * 1.25 + 2) { R.gone = t - leftAt; R.lingerM = pl.pos.z + rear - spot.to; } } }
      const mean = a => a.reduce((s, q) => s + q, 0) / Math.max(1, a.length), sorted = R.heights.slice().sort((a, q) => a - q);
      res[`${kmh} km/h`] = { dropsOnWetRoad: Math.round(mean(R.before)), dropsInPuddle: Math.round(mean(R.inside)), peakDrops: R.peak, crossingSeconds: H.r2((spot.to - spot.from + front - rear) / v), sprayGoneAfterSeconds: R.gone == null ? null : H.r2(R.gone), sprayGoneAfterMetres: H.r1(R.lingerM),
        highestDropM: H.r2(R.peakHeight), typicalDropHeightM: H.r2(sorted[Math.floor(sorted.length / 2)] || 0), reachBesideCarM: H.r2(R.reach), thrownSidewaysPct: Math.round(R.outward / Math.max(1, R.born) * 100), thrownStraightBackPct: Math.round(R.back / Math.max(1, R.born) * 100), sidewaysSpeedMs: H.r1(mean(R.outSpeed)), sideSheetAngleDeg: Math.round(mean(R.launchDeg)) }; }
    spray.clear(); return res; });
  console.log('puddle', JSON.stringify(out.puddle));

  // 4. Tunnel entry and exit at 80 km/h on a rainy night: road wetness, spray and the water on the paint
  out.tunnel = await p.evaluate(() => { const A = window.__afterdark, H = window.__rain, pl = A.player, spray = A.spray, S = A.world.samples, [a, e] = H.tunnel, res = {};
    const paintNow = () => { const w = pl.paintWater; return w ? { film: w.film, beads: w.beads } : { film: pl.bodyWetness, beads: pl.bodyWetness }; }, s0 = S[a - 70];
    H.weather(1, 1); spray?.clear(); H.launch(s0.x - s0.lx * 2.5, s0.z - s0.lz * 2.5, Math.atan2(s0.tx, s0.tz), 22.22);
    for (let i = 0; i < 1800; i++) pl.updateWetness(H.DT, 1); // half a minute in the rain before setting off
    let idx = s0.i, t = 0, tIn = null, tOut = null, sprayOff = null, sprayOn = null, hits = 0; const marks = {}, note = (k, v) => { if (!(k in marks)) marks[k] = v; };
    while (idx < e + 75 && t < 120) { for (let k = 0; k < 40; k++) { const n = idx + 1; if (Math.hypot(S[n].x - pl.pos.x, S[n].z - pl.pos.z) < Math.hypot(S[idx].x - pl.pos.x, S[idx].z - pl.pos.z)) idx = n; else break; }
      const la = S[idx + 8], want = Math.atan2(la.x - la.lx * 2.5 - pl.pos.x, la.z - la.lz * 2.5 - pl.pos.z), df = Math.atan2(Math.sin(want - pl.heading), Math.cos(want - pl.heading)) - pl.yawRate * 0.12;
      if (H.step(H.C({ steer: Math.abs(df) > 0.012 ? Math.sign(df) : 0, throttle: pl.speed < 22.22 ? 1 : 0 })) > 2.5) hits++;
      pl.updateWetness(H.DT, 1); if (spray) { spray.emit(H.DT, pl, H.wetHere(), A.city.puddleAt); spray.update(H.DT, 1); } t += H.DT;
      const n = spray ? spray.mesh.geometry.instanceCount : null, w = paintNow(), into = (idx - a) * 3, past = (idx - e) * 3;
      if (pl.tunnel && tIn == null) { tIn = t; res.atEntry = { film: H.r2(w.film), beads: H.r2(w.beads), sprayDrops: n, roadWetness: H.r2(H.wetHere()) }; }
      if (tIn != null && tOut == null) { for (const m of [10, 25, 50, 100]) if (into >= m) note(`${m} m in`, { roadWetness: H.r2(H.wetHere()), sprayDrops: n, film: H.r2(w.film), beads: H.r2(w.beads) }); if (n === 0 && sprayOff == null) sprayOff = into; if (w.film < 0.5) note('filmHalfGoneS', H.r1(t - tIn)); }
      if (tIn != null && !pl.tunnel && tOut == null) { tOut = t; res.atExit = { film: H.r2(w.film), beads: H.r2(w.beads), sprayDrops: n, roadWetness: H.r2(H.wetHere()), secondsUnderCover: H.r1(tOut - tIn) }; }
      if (tOut != null) { if (n > 5 && sprayOn == null) sprayOn = past; if (w.film > 0.9) note('filmBackS', H.r1(t - tOut)); if (w.beads > 0.9) note('beadsBackS', H.r1(t - tOut)); for (const sec of [2, 5]) if (t - tOut >= sec) note(`${sec} s after exit`, { film: H.r2(w.film), beads: H.r2(w.beads), sprayDrops: n }); } }
    Object.assign(res, marks, { tunnelLengthM: (e - a) * 3, sprayStopsMetresIn: sprayOff, sprayReturnsMetresOut: sprayOn, wallContacts: hits }); spray?.clear(); return res; });
  console.log('tunnel', JSON.stringify(out.tunnel));

  // 5. Drying under cover from fully wet: parked, and with air moving over the car at 80 km/h. Then wetting again in the rain.
  out.paint = await p.evaluate(() => { const A = window.__afterdark, H = window.__rain, pl = A.player, S = A.world.samples, [a, e] = H.tunnel, mid = S[Math.round((a + e) / 2)], res = {};
    const paintNow = () => { const w = pl.paintWater; return w ? { film: w.film, beads: w.beads } : { film: pl.bodyWetness, beads: pl.bodyWetness }; };
    for (const [name, v] of [['parked under cover', 0], ['under cover at 80 km/h', 22.22]]) { H.weather(1, 1); pl.place(mid.x, mid.z, Math.atan2(mid.tx, mid.tz)); pl.tunnel = false; pl.speed = 0; for (let i = 0; i < 3600; i++) pl.updateWetness(H.DT, 1);
      pl.tunnel = true; pl.speed = v; const R = {}, note = (k, t) => { if (!(k in R)) R[k] = H.r1(t); }; for (let t = 0; t < 400; t += H.DT) { pl.updateWetness(H.DT, 1); const w = paintNow(); if (w.film < 0.5) note('filmHalfS', t); if (w.film < 0.05) note('filmGoneS', t); if (w.beads < 0.75) note('beadsThreeQuartersS', t); if (w.beads < 0.5) note('beadsHalfS', t); if (w.beads < 0.05) note('beadsGoneS', t); }
      res[name] = R; }
    { pl.tunnel = false; pl.speed = 0; const R = {}, note = (k, t) => { if (!(k in R)) R[k] = H.r1(t); }; for (let t = 0; t < 120; t += H.DT) { pl.updateWetness(H.DT, 1); const w = paintNow(); if (w.film > 0.5) note('filmHalfS', t); if (w.film > 0.95) note('filmFullS', t); if (w.beads > 0.5) note('beadsHalfS', t); if (w.beads > 0.95) note('beadsFullS', t); } res['back out in the rain'] = R; }
    pl.speed = 0; pl.place(A.city.spawn.x, A.city.spawn.z, 0); return res; });
  console.log('paint', JSON.stringify(out.paint));

  // 6. Tyre water sound, measured on the game's own sound module in real time: level and pitch of the wet-road hiss and the puddle wash
  await p.goto((process.env.AFTERDARK_URL || 'http://localhost:8765/afterdark/').replace(/afterdark\/.*$/, 'robots.txt')); // a page with nothing else running, so the sound is timed properly
  out.sound = await p.evaluate(async () => { const { createSound } = await import('/afterdark/src/sound.js'), au = createSound();
    if (!au.tyres) { au.setOn(false); return { skipped: 'this build has no tyre water sound tied to the road' }; }
    await au.ctx.resume(); if (au.ctx.state !== 'running') return { skipped: 'audio context would not start' };
    au.setOn(false); await new Promise(r => setTimeout(r, 2500)); const tap = node => { const an = au.ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; node.connect(an); return an; };
    const hiss = tap(au.tyres.hiss.g), left = tap(au.tyres.wash[0].g), right = tap(au.tyres.wash[1].g), buf = new Float32Array(2048), spec = new Float32Array(1024);
    const level = an => { an.getFloatTimeDomainData(buf); let s = 0; for (const q of buf) s += q * q; return 10 * Math.log10(s / buf.length + 1e-12); };
    const pitch = an => { an.getFloatFrequencyData(spec); let sw = 0, sf = 0; for (let i = 1; i < spec.length; i++) { const pw = 10 ** (spec[i] / 10); sw += pw; sf += pw * i * au.ctx.sampleRate / 2048; } return sf / sw; };
    const env = { rain: 1, wet: 1, night: 1, day: 0 }, base = { playing: true, speed: 22.22, reverse: false, throttle: 0.3, brake: 0, hand: false, steer: 0, slip: 0, env, x: 300, z: 300, heading: 0, beachX: -100, cars: [], trainX: 9999, trainZ: 0, cockpit: false, people: false, grounded: true };
    // 0-1.5 s dry road, 1.5-3 s wet road, 3-3.25 s left wheels through a deep puddle, 3.25-4.5 s wet road, 4.5-6 s inside the tunnel
    const state = t => ({ ...base, roadWet: t < 1.5 || t >= 4.5 ? 0 : 1, water: { left: t >= 3 && t < 3.25 ? 0.9 : 0, right: 0 }, covered: t >= 4.5, env: t < 1.5 ? { ...env, wet: 0, rain: 0 } : env });
    const log = [], t0 = performance.now(); let last = t0;
    await new Promise(done => { const tick = () => { const now = performance.now(), t = (now - t0) / 1000; au.update((now - last) / 1000, state(t)); last = now; log.push({ t, hiss: level(hiss), left: level(left), right: level(right), hissHz: pitch(hiss), leftHz: pitch(left), rain: au.loops.rain ? au.loops.rain.gain.value : null, patter: au.rainOnCar.g.gain.value }); if (t < 6) setTimeout(tick, 10); else done(); }; tick(); });
    au.setOn(false); au.ctx.close();
    const span = (a, e, k) => { const v = log.filter(q => q.t >= a && q.t < e && q[k] != null).map(q => q[k]); return v.length ? v.reduce((s, q) => s + q, 0) / v.length : null; }, r1 = v => v == null ? null : +v.toFixed(1), peak = Math.max(...log.filter(q => q.t >= 3 && q.t < 3.4).map(q => q.left));
    const up = log.find(q => q.t >= 3 && q.left > peak - 6), down = log.find(q => q.t >= 3.25 && q.left < peak - 20);
    return { hissDryRoadDb: r1(span(1, 1.5, 'hiss')), hissWetRoadDb: r1(span(2.2, 3, 'hiss')), hissInTunnelDb: r1(span(5.4, 6, 'hiss')), hissCentreHz: Math.round(span(2.2, 3, 'hissHz')),
      washOutOfPuddleDb: r1(span(2.2, 3, 'left')), washInPuddlePeakDb: r1(peak), washCentreHz: Math.round(span(3.1, 3.25, 'leftHz')), washOtherSideDb: r1(Math.max(...log.filter(q => q.t >= 3 && q.t < 3.4).map(q => q.right))),
      washRiseMs: up ? Math.round((up.t - 3) * 1000) : null, washGone20DbAfterMs: down ? Math.round((down.t - 3.25) * 1000) : null, rainLoopGainOpen: +(span(2.5, 3, 'rain') ?? 0).toFixed(2), rainLoopGainInTunnel: +(span(5.6, 6, 'rain') ?? 0).toFixed(2), rainOnCarGainOpen: +span(2.5, 3, 'patter').toFixed(3), rainOnCarGainInTunnel: +span(5.6, 6, 'patter').toFixed(3) }; });
  console.log('sound', JSON.stringify(out.sound));

  require('fs').writeFileSync(`${process.env.OUT_DIR || '.'}/afterdark-rain-${process.argv[2] || 'run'}.json`, JSON.stringify(out, null, 1)); await b.close(); })();
