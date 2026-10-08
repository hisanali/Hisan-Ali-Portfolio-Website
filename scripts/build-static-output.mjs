import { readdir, copyFile, mkdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { isPublicAsset } from '../app/insights/security.ts';

const root = process.cwd();
await build({entryPoints: ['scripts/portfolio-admin-entry.ts'], outfile: 'api/portfolio-admin.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node24'});
const output = path.join(root, '.vercel', 'site-static');
const internal = new Set(['app', 'components', 'api', 'server', 'scripts', 'node_modules', 'docs', 'tests']);
await rm(output, { recursive: true, force: true });
let count = 0;
async function copy(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || (!relative && directory === root && internal.has(entry.name))) continue;
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) { await copy(path.join(directory, entry.name), name); continue; }
    if (!entry.isFile() || !isPublicAsset(name.split(path.sep)) || /(?:^|\.)config\.[cm]?js$/.test(entry.name)) continue;
    await mkdir(path.dirname(path.join(output, name)), { recursive: true });
    await copyFile(path.join(directory, entry.name), path.join(output, name));
    count++;
  }
}
await copy(root);
// Existing /public/... URLs stay available; admin assets also use the standard root URLs.
await copy(path.join(root, 'public', 'insights'), 'insights');
for (const required of ['index.html', 'gcc/index.html', 'ar/index.html', 'sitemap.xml', 'insights/dashboard.js', 'insights/dashboard.css']) await access(path.join(output, required));
console.log(`Prepared ${count} public files; server code and credentials are excluded.`);
