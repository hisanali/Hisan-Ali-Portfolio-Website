// Renders film.html to numbered JPEG frames.
// Usage: node render.cjs <outDir> [fps] [workers]   or   node render.cjs --stills <outDir> t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const url = 'file://' + path.join(__dirname, 'film.html');

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.evaluate(() => window.ready);
  return page;
}

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  if (args[0] === '--stills') {
    const out = args[1]; fs.mkdirSync(out, { recursive: true });
    const page = await open(browser);
    for (const t of args.slice(2)) {
      await page.evaluate(v => window.render(v), Number(t));
      await page.screenshot({ path: path.join(out, `still-${t}.jpg`), type: 'jpeg', quality: 80 });
    }
  } else {
    const out = args[0]; const fps = Number(args[1] || 30); const workers = Number(args[2] || 4);
    fs.mkdirSync(out, { recursive: true });
    const probe = await open(browser);
    const total = Math.round((await probe.evaluate(() => window.DURATION)) * fps);
    await probe.close();
    let next = 0;
    await Promise.all(Array.from({ length: workers }, async () => {
      const page = await open(browser);
      while (next < total) {
        const f = next++;
        await page.evaluate(v => window.render(v), f / fps);
        await page.screenshot({ path: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
      }
    }));
    console.log(`rendered ${total} frames`);
  }
  await browser.close();
})();
