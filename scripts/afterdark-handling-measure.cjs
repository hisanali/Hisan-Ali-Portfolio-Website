// Afterdark steering and grip measurements for every garage car, dry and wet.
// Serve the repo root (python3 -m http.server 8765), then: node scripts/afterdark-handling-measure.cjs [label]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 320, height: 200 } }); p.setDefaultTimeout(400000);
  p.on('pageerror', e => console.log('PAGEERR ' + e.message.slice(0, 300)));
  await p.route(/googletagmanager|fonts\.g/, r => r.abort());
  await p.goto('' + (process.env.AFTERDARK_URL || 'http://localhost:8765/afterdark/') + '?gfx=low', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__afterdark && window.__afterdark.S.mode === 'menu', null, { timeout: 400000 });
  const out = {};
  for (const id of ['coupe', 'hatch', 'sedan', 'pickup', 'suv']) {
    await p.evaluate(id => window.__afterdark.useCar(id), id);
    out[id] = await p.evaluate(() => { const A = window.__afterdark, pl = A.player, P = 120, DT = 1 / 60, env0 = A.city.setTime(13, 0), res = {};
      const C = o => Object.assign({ steer: 0, throttle: 0, brake: 0, hand: false }, o);
      const step = c => { const n = Math.min(10, Math.max(2, Math.ceil(Math.abs(pl.speed) * DT / 0.4))); let h = 0; for (let q = 0; q < n; q++) h = Math.max(h, pl.drive(DT / n, c)); return h; };
      const r1 = v => +v.toFixed(1), r2 = v => +v.toFixed(2), deg = v => +(v * 57.2958).toFixed(1);
      const cruise = (x, v) => { pl.place(x, 40, 0); let t = 0; while (pl.speed < v && t < 40) { step(C({ throttle: 1 })); t += DT; } return t; };
      for (const wet of [0, 1]) { pl.setTime({ ...env0, wet, night: 0 }); const R = res[wet ? 'wet' : 'dry'] = {};
        // 1. U-turn from rest at full lock with the throttle held, both ways, on a 20 m street
        for (const dir of [1, -1]) { pl.place(P * 3 - 5.5 * dir, P * 3 + 60, 0); const x0 = pl.pos.x; let t = 0, hit = 0, vmax = 0, wide = 0; while (Math.abs(pl.heading) < Math.PI && t < 30) { hit = Math.max(hit, step(C({ steer: dir, throttle: 1 }))); wide = Math.max(wide, Math.abs(pl.pos.x - x0)); vmax = Math.max(vmax, pl.speed); t += DT; }
          R['uturn' + (dir > 0 ? 'L' : 'R')] = { diameter: r1(wide), seconds: r1(t), topKmh: r1(vmax * 3.6), kerbHit: hit > 0.5, fitsStreet: wide + pl.wid / 2 <= 15.5 && hit < 0.5 }; }
        // 2. steady full-lock circle at walking pace (kinematic turning circle)
        { pl.place(P * 3 - 5.5, P * 3 + 60, 0); let t = 0; while (t < 1.6) { step(C({ steer: 1, throttle: pl.speed < 2.5 ? 1 : 0 })); t += DT; } R.lockCircle = r1(2 * Math.abs(pl.speed / (pl.yawRate || 1e-6))); }
        // 3. single tap at 80 km/h: left and right, 0.15 s and 0.30 s. Sideways move after 2 s, heading left behind, time for the yaw to die away
        for (const dir of [1, -1]) for (const tap of [0.15, 0.3]) { cruise(P * 3 - 5.5 * dir, 22.22); const x0 = pl.pos.x, h0 = pl.heading; let t = 0, peak = 0, settle = 0, hit = 0, lat1 = 0; while (t < 2) { const c = C({ steer: t < tap ? dir : 0, throttle: pl.speed < 22.22 ? 1 : 0 }); hit = Math.max(hit, step(c)); t += DT; peak = Math.max(peak, Math.abs(pl.yawRate)); if (Math.abs(pl.yawRate) > 0.01) settle = t; if (Math.abs(t - 1) < DT / 2) lat1 = Math.abs(pl.pos.x - x0); }
          R[`tap${dir > 0 ? 'L' : 'R'}${tap * 100 | 0}`] = { sideAt1s: r2(lat1), sideAt2s: r2(Math.abs(pl.pos.x - x0)), headingDeg: deg(Math.abs(pl.heading - h0)), peakYawDeg: deg(peak), yawGoneBy: r2(settle), hit: hit > 0.5 }; }
        // 4. full lane change at 80 km/h: tap away, tap back, to finish 3.6 m across and straight. Reports how straight and how far over a fixed pair of taps ends
        for (const dir of [1, -1]) { cruise(P * 3 - 5.5 * dir, 22.22); const x0 = pl.pos.x, h0 = pl.heading; let t = 0, over = 0; while (t < 3) { const s = t < 0.22 ? dir : t >= 0.55 && t < 0.77 ? -dir : 0; step(C({ steer: s, throttle: pl.speed < 22.22 ? 1 : 0 })); t += DT; over = Math.max(over, Math.abs(pl.pos.x - x0)); }
          R['pair' + (dir > 0 ? 'L' : 'R')] = { sideways: r2(Math.abs(pl.pos.x - x0)), headingLeftDeg: deg(Math.abs(pl.heading - h0)), slipPeak: 0 }; }
        // 4b. a driver on the keys changing lane (3.6 m) at 80 km/h: every 0.15 s it taps a key for a time in proportion to the correction it wants
        for (const dir of [1, -1]) { cruise(P * 3 - 5.5 * dir, 22.22); const x0 = pl.pos.x, want = 3.6; let t = 0, key = 0, over = 0, done = 0, presses = 0, hold = 0, want2 = 0, wob = 0, hit = 0;
          while (t < 6) { const moved = (pl.pos.x - x0) * dir, err = want - moved, hd = pl.heading * dir; const fr = Math.round(t * 60) % 9; if (fr === 0) { const aim = Math.max(-0.12, Math.min(0.12, err * 0.1)), d = aim - hd - pl.yawRate * dir * 0.25; hold = Math.abs(d) < 0.008 ? 0 : Math.max(1, Math.min(9, Math.round(Math.abs(d) / 0.07 * 9))); want2 = Math.sign(d) * dir; if (hold) presses++; } key = fr < hold ? want2 : 0;
            hit = Math.max(hit, step(C({ steer: key, throttle: pl.speed < 22.22 ? 1 : 0 }))); t += DT; over = Math.max(over, moved - want); if (Math.abs(err) > 0.3 || Math.abs(hd) > 0.02) done = t; if (t > 3) wob = Math.max(wob, Math.abs(pl.yawRate)); }
          R['lane' + (dir > 0 ? 'L' : 'R')] = { seconds: r2(done), overshoot: r2(Math.max(0, over)), keyPresses: presses, yawAfter3sDeg: deg(wob), endOff: r2(Math.abs((pl.pos.x - x0) * dir - want)), hit: hit > 0.5 }; }
        // 5. held steer at 80 km/h for 1 s: lateral g and yaw (high-speed response)
        { cruise(P * 3 - 5.5, 22.22); let t = 0, peak = 0; while (t < 1) { step(C({ steer: 1, throttle: pl.speed < 22.22 ? 1 : 0 })); t += DT; peak = Math.max(peak, Math.abs(pl.yawRate)); } R.hold80 = { yawDeg: deg(peak), lateralG: r2(peak * pl.speed / 9.81) }; }
        { cruise(P * 3 - 5.5, 44.44); let t = 0, peak = 0; const v = pl.speed; while (t < 0.6) { step(C({ steer: 1, throttle: 1 })); t += DT; peak = Math.max(peak, Math.abs(pl.yawRate)); } R.hold160 = { yawDeg: deg(peak), lateralG: r2(peak * v / 9.81) }; }
        // 6. braking from 80 km/h, then holding the pedal, then reversing
        { cruise(P * 3 - 5.5, 22.22); const z0 = pl.pos.z; let t = 0; while (pl.speed > 0.05 && t < 20) { step(C({ brake: 1 })); t += DT; } const d = pl.pos.z - z0, zs = pl.pos.z; let crept = 0; for (let i = 0; i < 90; i++) { step(C({ brake: 1 })); crept = Math.max(crept, Math.abs(pl.pos.z - zs)); }
          for (let i = 0; i < 6; i++) step(C({})); const zr = pl.pos.z, hr = pl.heading; for (let i = 0; i < 180; i++) step(C({ brake: 1, steer: i > 60 ? 1 : 0 })); const rev = { kmhAfter3s: r1(pl.speed * 3.6), metres: r1(zr - pl.pos.z), headingDeg: deg(pl.heading - hr) };
          const zq = pl.pos.z; let tq = 0; while (pl.speed < -0.05 && tq < 10) { step(C({ throttle: 1 })); tq += DT; }
          R.brake80 = { metres: r1(d), seconds: r2(t), creepWhileHeld: r2(crept) }; R.reverse = rev; }
      }
      pl.setTime(env0); return { len: r2(pl.len), wid: r2(pl.wid), ...res }; });
    console.log(id, JSON.stringify(out[id]));
  }
  require('fs').writeFileSync(`${process.env.OUT_DIR || '.'}/afterdark-handling-${process.argv[2] || 'run'}.json`, JSON.stringify(out, null, 1)); await b.close(); })();
