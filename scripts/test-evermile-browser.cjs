// Evermile in a real (software-rendered) browser: drives, walks, boards, shops, talks, uses the phone and
// switches every setting, failing on any page error or broken expectation. Slow by design on a CPU renderer.
// Run: node scripts/test-evermile-browser.cjs   (needs Playwright with Chromium; the preview server is started here)
const {spawn} = require('child_process');
const path = require('path');
const {chromium} = require('playwright');
const PORT = Number(process.env.EVERMILE_PORT || 4180), ROOT = path.resolve(__dirname, '..');
const M = '/evermile/main.js?v=20261103-journey1';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'scripts/serve-evermile.py'), String(PORT)], {cwd: ROOT, stdio: 'ignore'});
  const failures = [], errors = [];
  const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`); if (!ok) failures.push(name); };
  let browser;
  try {
    for (let i = 0; i < 30; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/evermile/`); if (r.ok) break; } catch {} await wait(300); }
    browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
    const page = await browser.newPage({viewport: {width: 800, height: 450}});
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/Tag Manager|gtm|TUNNEL|multiplayer\/config|502|Failed to load resource/.test(t)) errors.push(t.slice(0, 200)); });
    await page.addInitScript(() => localStorage.clear());
    await page.goto(`http://127.0.0.1:${PORT}/evermile/`, {waitUntil: 'load', timeout: 180000});
    await wait(6000); await page.evaluate(() => document.getElementById('begin').click());
    for (let i = 0; i < 24; i++) { await wait(2500); if (await page.evaluate(() => document.querySelector('#intro')?.hidden && document.querySelector('#start')?.hidden)) break; }
    const q = (fn, arg) => page.evaluate(async ({M, src, arg}) => { const m = await import(M); return (0, eval)(src)(m, arg); }, {M, src: fn.toString(), arg});
    const status = () => page.evaluate(() => document.querySelector('#drive-status').textContent);
    // The software renderer can take a second or more per frame, so wait for conditions rather than fixed times.
    const until = async (fn, arg, timeout = 20000) => { const end = Date.now() + timeout; while (Date.now() < end) { if (await q(fn, arg)) return true; await wait(500); } return false; };

    check('the drive starts', await q((m) => m.state.started && m.state.engineOn));
    await page.keyboard.press('f');
    check('F while stopped gets you out', await until((m) => m.state.onFoot && !m.state.engineOn && !m.state.transition));
    await page.keyboard.press('Space');
    check('Space jumps', await until((m) => m.debug.walker.grounded === false || m.debug.walker.y > m.debug.world.groundHeight(m.debug.walker.x, m.debug.walker.z) + .05, null, 3000));
    await until((m) => m.debug.walker.grounded !== false);
    await q((m) => { const w = m.debug.walker; w.place(w.x + 4, w.z + 1, w.yaw); });
    await until((m) => /GET IN/.test(document.querySelector('#drive-status').textContent)); await page.keyboard.press('f');
    check('F from a few metres walks you to the door', await until((m) => !!m.state.boarding, null, 8000));
    await q((m) => { const b = m.state.boarding; if (b) m.debug.walker.place(b.door.x, b.door.z, m.debug.walker.yaw); });
    check('you sit down and the engine starts', await until((m) => !m.state.onFoot && m.state.engineOn, null, 40000));
    for (const c of [0, 1, 2, 3, 4, 5]) { await q((m, c) => m.changeSetting('camera', c), c); await wait(700); }
    check('every camera view runs', errors.length === 0, errors.slice(-1)[0] || '');
    await q((m) => m.changeSetting('camera', 0));

    // A town shop: in, buy, out.
    const shop = await q((m) => { const r = m.debug.world.road; for (let z = 200; z < 9000; z += 50) { const t = r.townAt(z); if (t) { const lot = m.debug.scenery.layout(t).lots.find((l) => l.kind === 'shop'); if (lot) return {z: lot.z}; } } return null; });
    check('a town with a shop is on the road', !!shop);
    await q((m, z) => { m.state.z = z - 30; m.reset(); m.changeSetting('time', 'day'); }, shop.z); await wait(8000);
    await page.keyboard.press('f'); await wait(2500);
    await q((m, z) => { const r = m.debug.world.road, t = r.townAt(z); const lot = m.debug.scenery.layout(t).lots.find((l) => l.kind === 'shop' && l.name); m.debug.walker.place(lot.doorX, lot.doorZ, lot.doorYaw); }, shop.z); await wait(3500);
    const atDoor = await status();
    check('the shop door is recognised', /ENTER|CLOSED/.test(atDoor), atDoor);
    if (/ENTER/.test(atDoor)) {
      await page.keyboard.press('x'); await wait(5000);
      check('you go inside', await q((m) => !!m.state.inside));
      await q((m) => { const c = m.state.inside.cell; m.debug.walker.place(c.counter.x, c.counter.z + .2, Math.PI); });
      for (let i = 0; i < 10 && !/BUY/.test(await status()); i++) await wait(1000);
      await page.keyboard.press('x'); for (let i = 0; i < 6 && await page.evaluate(() => document.getElementById('shop-card').hidden); i++) await wait(700);
      check('the counter opens the shop', await page.evaluate(() => !document.getElementById('shop-card').hidden));
      const before = await q(() => JSON.parse(localStorage.getItem('evermile-journey') || '{}').money ?? 20);
      await page.evaluate(() => document.querySelector('#shop-card [data-buy]:not([disabled])')?.click()); await wait(800);
      const after = await q(() => JSON.parse(localStorage.getItem('evermile-journey') || '{}').money);
      check('buying costs coins', after < before, `${before} → ${after}`);
      await page.evaluate(() => document.querySelector('#shop-card [data-close]')?.click()); await wait(500);
      await q((m) => { const c = m.state.inside.cell; m.debug.walker.place(c.door.x, c.door.z - .5, 0); }); await wait(3000);
      await page.keyboard.press('x'); await wait(5000);
      check('you come back out', await q((m) => !m.state.inside && m.state.onFoot));
    }
    // Night: lamps light the street round you and shops close.
    await q((m) => m.changeSetting('time', 'night')); await wait(5000);
    check('street lamps light up round you at night', await q((m) => m.debug.scenery.lamps.some((l) => l.intensity > 1)));
    // Talk to the nearest person, if anyone is near.
    const talked = await q((m) => { const w = m.debug.walker, p = m.debug.life.town.people.find((q) => q.active && !q.hidden && Number.isFinite(q.x)); if (!p) return false; w.place(p.x + .9, p.z + .9, 0); return true; });
    if (talked) { await wait(3500); if (/TALK/.test(await status())) { await page.keyboard.press('x'); await wait(1200); check('a conversation opens', await page.evaluate(() => !document.getElementById('shop-card').hidden)); await page.evaluate(() => document.querySelector('#shop-card [data-close]')?.click()); } }
    // The phone, every tab, and a postcard.
    await q((m) => { m.state.postcard = {key: 'lake', at: m.state.time}; });
    await until(() => !!JSON.parse(localStorage.getItem('evermile-postcards') || '{}').lake);
    await page.keyboard.press('Tab'); await wait(600);
    for (const t of ['map', 'journey', 'jobs', 'cards', 'home']) { await page.evaluate((t) => document.querySelector(`#phone-card [data-tab="${t}"]`)?.click(), t); await wait(500); }
    check('the phone opens every tab', await page.evaluate(() => !document.getElementById('phone-card').hidden && !!document.querySelector('#phone-card .tabs')));
    check('a postcard is kept', await q(() => !!JSON.parse(localStorage.getItem('evermile-postcards') || '{}').lake));
    await page.keyboard.press('Tab'); await wait(400);
    // Settings while on foot and in the car; a world change from on foot.
    for (const [k, v] of [['outfit', 'soldier'], ['look', 'plain'], ['ao', 'off'], ['quality', 'low'], ['quality', 'high'], ['look', 'rich'], ['season', 'winter'], ['weather', 'rain'], ['destination', 'oldtown']]) { await q((m, kv) => m.changeSetting(kv[0], kv[1]), [k, v]); await wait(1500); }
    check('a world change from on foot leaves you in a clean state', await q((m) => !m.state.inside && !m.state.sitting && !m.state.riding));
    await until((m) => !m.state.transition && !m.state.onFoot);
    await page.keyboard.press('t');
    check('autodrive runs after all that', await until((m) => m.state.auto && !m.state.onFoot && (m.state.engineOn || !!m.state.starting))); await wait(6000);
    check('no page errors at all', errors.length === 0, errors.join(' | ').slice(0, 300));
  } catch (e) { failures.push('runner: ' + e.message); console.log('FAIL runner · ' + e.message); }
  finally { await browser?.close(); server.kill(); }
  console.log(failures.length ? `\n${failures.length} failed: ${failures.join(', ')}` : '\nall browser checks passed');
  process.exit(failures.length ? 1 : 0);
})();
