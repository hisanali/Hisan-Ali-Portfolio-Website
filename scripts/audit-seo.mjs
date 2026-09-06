import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readSeoPages, indexablePages, decode, projectRoot, siteOrigin } from './seo-pages.mjs';

const pages = await readSeoPages();
const indexable = indexablePages(pages);
const errors = [];
const titles = new Map();
const descriptions = new Map();
const redirects = JSON.parse(await readFile(path.join(projectRoot, 'vercel.json'), 'utf8')).redirects;
for (const page of pages) {
  const fail = message => errors.push(`${page.url}: ${message}`);
  const redirected = redirects.some(rule => !rule.has && !rule.source.includes(':') && rule.source.replace(/\/$/, '') === new URL(page.url).pathname.replace(/\/$/, ''));
  if (redirected || /\bnoindex\b/i.test(page.robots)) continue;
  if (page.canonicals.length !== 1 || page.canonicals[0] !== page.url) fail('Expected one self-referencing canonical');
  const titleTags = [...page.head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  const title = decode(titleTags[0]?.[1]?.trim());
  const descriptionTags = page.metas.filter(meta => meta.name === 'description');
  const description = descriptionTags[0]?.content?.trim();
  if (titleTags.length !== 1 || !title) fail('Expected one nonempty title');
  if (descriptionTags.length !== 1 || !description) fail('Expected one nonempty description');
  for (const [value, seen, label] of [[title, titles, 'title'], [description, descriptions, 'description']]) {
    if (value && seen.has(value)) fail(`Duplicate ${label} with ${seen.get(value)}`);
    seen.set(value, page.url);
  }
  const visibleMarkup = page.html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  if ([...visibleMarkup.matchAll(/<h1\b/gi)].length !== 1) fail('Expected one main heading outside inactive templates');
  for (const match of page.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { fail('Invalid JSON-LD'); }
  }
}
const sitemap = await readFile(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
try {
  assert.deepEqual([...urls].sort(), indexable.map(page => page.url).sort());
  assert.equal(new Set(urls).size, urls.length);
  for (const rule of redirects.filter(rule => !rule.has && !rule.source.includes(':'))) {
    assert(!urls.some(url => new URL(url).pathname.replace(/\/$/, '') === rule.source.replace(/\/$/, '')), `Redirect in sitemap: ${rule.source}`);
  }
} catch (error) { errors.push(`Sitemap coverage: ${error.message}`); }
const robots = await readFile(path.join(projectRoot, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) errors.push('robots.txt must reference the canonical sitemap');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`SEO checks passed: ${indexable.length} indexable pages; unique titles/descriptions, canonicals, headings, JSON-LD, and sitemap coverage.`);
