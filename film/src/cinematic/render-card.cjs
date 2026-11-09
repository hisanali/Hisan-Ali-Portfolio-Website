const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, '..', 'film.html'));
  await p.evaluate(() => window.ready);
  await p.evaluate(() => { window.city = () => {}; });
  for (let f = 0; f < 120; f++) {
    await p.evaluate(v => window.render(v), 85.4 + f / 24);
    await p.screenshot({ path: path.join(out, `c${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
  }
  await b.close();
})();
