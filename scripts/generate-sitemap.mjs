import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readSeoPages, indexablePages, escapeXml, projectRoot } from './seo-pages.mjs';

const pages = indexablePages(await readSeoPages());
// Use editorial dates from article data, never the build time or filesystem mtime.
// Pages without a valid, non-future editorial date omit the optional lastmod.
export function editorialLastModified(html, now = new Date()) {
  const dates = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(visit);
    const types = [value['@type']].flat();
    if (types.some(type => ['Article', 'BlogPosting', 'NewsArticle'].includes(type))) {
      const raw = value.dateModified || value.datePublished;
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(raw)) {
        const date = new Date(raw);
        if (Number.isFinite(date.getTime()) && date <= now && date.toISOString().slice(0, 10) === raw.slice(0, 10)) dates.push(raw.slice(0, 10));
      }
    }
    Object.values(value).forEach(visit);
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch { /* The SEO audit reports invalid JSON-LD. */ }
  }
  return dates.sort().at(-1);
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => {
  const lastmod = editorialLastModified(page.html);
  return `  <url><loc>${escapeXml(page.url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
}).join('\n')}\n</urlset>\n`;
await writeFile(path.join(projectRoot, 'sitemap.xml'), xml);
console.log(`Generated sitemap with ${pages.length} canonical, indexable pages`);
