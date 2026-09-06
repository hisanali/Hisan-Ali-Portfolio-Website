import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const siteOrigin = 'https://hisanali.com';
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['node_modules', 'public', 'server', 'admin']);
export const decode = (value = '') => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
export const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
export function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3])]));
}
export async function readSeoPages() {
  const pages = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    if (entries.some(entry => entry.name === 'index.html' && entry.isFile())) {
      const file = path.join(directory, 'index.html');
      const html = await readFile(file, 'utf8');
      const relative = path.relative(projectRoot, directory).split(path.sep).join('/');
      const url = `${siteOrigin}/${relative ? relative + '/' : ''}`;
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
      const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
      const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(tag => tag.rel === 'canonical').map(tag => tag.href);
      const robots = metas.filter(tag => ['robots', 'googlebot'].includes(tag.name)).map(tag => tag.content).join(',');
      pages.push({ file, html, head, url, canonicals, robots, metas });
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !excluded.has(entry.name)) await walk(path.join(directory, entry.name));
    }
  }
  await walk(projectRoot);
  return pages.sort((a, b) => a.url.localeCompare(b.url));
}
export function indexablePages(pages) {
  return pages.filter(page => !/\bnoindex\b/i.test(page.robots) && page.canonicals.length === 1 && page.canonicals[0] === page.url);
}
