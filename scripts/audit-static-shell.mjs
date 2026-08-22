import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const ignoredDirectories = new Set(['.git', '.next', '.vercel', 'node_modules']);
const pages = [];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const itemPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(itemPath);
    else if (entry.name === 'index.html') pages.push(itemPath);
  }
}

const count = (source, pattern) => (source.match(pattern) || []).length;
const failures = [];
const missingAssets = new Set();

await collect(projectRoot);

for (const pagePath of pages) {
  const relative = path.relative(projectRoot, pagePath);
  const source = await readFile(pagePath, 'utf8');
  const isHome = relative === 'index.html';
  const checks = [
    ['shared header', count(source, /class="ua-header"/g) === 1],
    ['shared footer', count(source, /class="ua-footer"/g) === 1],
    ['theme initializer', count(source, /id="theme-init"/g) === 1],
    ['light default', source.includes("const dark=saved==='dark'")],
    ['site-shell stylesheet', count(source, /href="\/site-shell\.css/g) === 1],
    ['site-shell script', count(source, /src="\/site-shell\.js/g) === 1],
    ['mobile menu control', count(source, /data-ua-menu-button/g) === 1],
    ['Games navigation', source.includes('href="/games/"')],
    ['Contact navigation', source.includes('href="/contact/"')],
    ['no emoji theme glyphs', !/[☀☾]/u.test(source)]
  ];

  if (!isHome) {
    checks.push(
      ['interior stylesheet', count(source, /href="\/interior-redesign\.css/g) === 1],
      ['interior script', count(source, /src="\/interior-redesign\.js/g) === 1]
    );
  }

  for (const [label, passed] of checks) {
    if (!passed) failures.push(`${relative}: ${label}`);
  }

  for (const match of source.matchAll(/(?:src|href)="(\/[^"?#]+\.[a-z0-9]{2,5})(?:[?#][^"]*)?"/gi)) {
    if (match[1].startsWith('/_vercel/')) continue;
    if (relative === 'tools/favicon-generator/index.html' && /^\/(?:favicon-(?:16|32)|apple-touch-icon)\.png$/.test(match[1])) continue;
    const assetPath = path.join(projectRoot, decodeURIComponent(match[1]).replace(/^\/+/, ''));
    try {
      const asset = await stat(assetPath);
      if (!asset.isFile()) missingAssets.add(`${relative}: ${match[1]}`);
    } catch {
      missingAssets.add(`${relative}: ${match[1]}`);
    }
  }
}

if (failures.length || missingAssets.size) {
  console.error(JSON.stringify({ pages: pages.length, failures, missingAssets: [...missingAssets] }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pages: pages.length, shellChecks: 'passed', assetChecks: 'passed' }));
