import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readSeoPages, indexablePages, escapeXml, projectRoot } from './seo-pages.mjs';

const pages = indexablePages(await readSeoPages());
// Omit optional lastmod rather than claim a content update on every build.
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${escapeXml(page.url)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(projectRoot, 'sitemap.xml'), xml);
console.log(`Generated sitemap with ${pages.length} canonical, indexable pages`);
