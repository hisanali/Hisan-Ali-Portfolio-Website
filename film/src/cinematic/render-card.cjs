// Renders the 5-second end card to JPEG frames at 24 fps.
// Usage: node render-card.cjs <outDir> [ar]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const out = process.argv[2];
  const arabic = process.argv[3] === 'ar';
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + (arabic ? path.join(__dirname, 'card-ar.html') : path.join(__dirname, '..', 'film.html')));
  await p.evaluate(() => window.ready);
  if (!arabic) await p.evaluate(() => { window.city = () => {}; });
  for (let f = 0; f < 120; f++) {
    await p.evaluate(v => window.render(v), arabic ? f / 24 : 85.4 + f / 24);
    await p.screenshot({ path: path.join(out, `c${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
  }
  await b.close();
})();
