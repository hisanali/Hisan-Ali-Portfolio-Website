import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const config = JSON.parse(await readFile('wrangler.production.jsonc', 'utf8'));
const route = config.routes[0];
const base = `https://api.cloudflare.com/client/v4/zones/${route.zone_id}/workers/routes`;
async function api(url, options = {}) {
  const response = await fetch(url, {...options, headers: {Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json'}});
  const data = await response.json();
  assert(response.ok && data.success, `Cloudflare route request failed: ${response.status}`);
  return data.result;
}
const current = (await api(base)).find(r => r.pattern === route.pattern && r.script === config.name);
assert(current, 'Production route is missing');
await api(`${base}/${current.id}`, {method: 'PUT', body: JSON.stringify({pattern: current.pattern, script: config.name, request_limit_fail_open: true})});
assert((await api(`${base}/${current.id}`)).request_limit_fail_open, 'Vercel fallback is not enabled');
// Compare deployed content with this build; retry while edge caches converge.
for (const path of ['site-shell.js', 'tactile.js', 'tactile.css', 'site-robot.js', 'site-robot.css']) {
  const expected = await readFile(`.vercel/site-static/${path}`, 'utf8');
  let matched = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`https://hisanali.com/${path}?deploy=${process.env.GITHUB_SHA || Date.now()}`, {cache: 'no-store'});
    if (response.ok && await response.text() === expected) { matched = true; break; }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  assert(matched, `Live ${path} does not match the deployment`);
}
const home = await fetch('https://hisanali.com/');
assert(home.ok, `Homepage returned ${home.status}`);
assert((await home.text()).includes('/tactile.js?v=5'), 'Homepage is missing the ripple script');
console.log('Production assets verified; Vercel fallback enabled.');
