import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { attributes, siteOrigin } from './seo-pages.mjs';

// Bounded live verification: no indexing requests, mutations, or private URLs.
const origin = process.argv[2] || siteOrigin;
const output = process.argv[3];
const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
assert.equal(sitemapResponse.status, 200, 'Sitemap must return 200');
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert(urls.length > 0, 'Sitemap must contain URLs');
assert.equal(new Set(urls).size, urls.length, 'Sitemap must not contain duplicates');
const robotsResponse = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(20000) });
assert.equal(robotsResponse.status, 200, 'robots.txt must return 200');
assert((await robotsResponse.text()).includes(`Sitemap: ${siteOrigin}/sitemap.xml`), 'robots.txt must advertise sitemap');
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < urls.length) {
    const canonical = urls[cursor++];
    assert.equal(new URL(canonical).origin, siteOrigin, 'Unexpected sitemap origin');
    const target = new URL(new URL(canonical).pathname, origin).href;
    try {
      const response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      const html = await response.text();
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
      const tags = [...head.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(match => attributes(match[0]));
      const canonicals = tags.filter(tag => tag.rel === 'canonical').map(tag => tag.href);
      const directives = [response.headers.get('x-robots-tag'), ...tags.filter(tag => ['robots', 'googlebot'].includes(tag.name)).map(tag => tag.content)].join(',');
      const errors = [];
      if (response.status !== 200) errors.push(`HTTP ${response.status}`);
      if (canonicals.length !== 1 || canonicals[0] !== canonical) errors.push('Canonical mismatch');
      if (/\b(?:noindex|none)\b/i.test(directives)) errors.push('Indexing blocked');
      if (!response.headers.get('content-type')?.includes('text/html')) errors.push('Not HTML');
      results.push({ url: canonical, status: response.status, errors });
    } catch (error) { results.push({ url: canonical, errors: [String(error)] }); }
  }
}));
const { redirects } = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const redirectResults = [];
for (const rule of redirects.filter(rule => !rule.has && !rule.source.includes(':'))) {
  const response = await fetch(new URL(rule.source, origin), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  const location = response.headers.get('location');
  const expected = new URL(rule.destination, origin).href;
  const actual = location ? new URL(location, origin).href : null;
  // Vercel may first normalise the trailing slash. Follow one hop only.
  let destination = actual;
  if ([301, 308].includes(response.status) && destination !== expected && destination?.startsWith(origin + '/')) {
    const next = await fetch(destination, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if ([301, 308].includes(next.status) && next.headers.get('location')) destination = new URL(next.headers.get('location'), origin).href;
  }
  redirectResults.push({ source: rule.source, status: response.status, destination, pass: [301, 308].includes(response.status) && destination === expected });
}
const report = { checkedAt: new Date().toISOString(), origin, pages: results.sort((a,b) => a.url.localeCompare(b.url)), redirects: redirectResults };
if (output) await writeFile(output, JSON.stringify(report, null, 2));
const failures = [...results.filter(page => page.errors.length), ...redirectResults.filter(rule => !rule.pass)];
console.log(`Checked ${results.length} sitemap pages and ${redirectResults.length} legacy redirects; ${failures.length} failures.`);
if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
