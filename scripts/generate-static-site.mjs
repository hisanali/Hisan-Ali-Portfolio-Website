import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySharedShell } from '../app/site-shell.ts';
import { prepareInteriorPage } from '../app/page-renderer.ts';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const ignoredDirectories = new Set(['.git', '.next', '.vercel', 'node_modules']);

const sourceHome = await readFile(path.join(projectRoot, 'home-redesign.html'), 'utf8');
await writeFile(path.join(projectRoot, 'index.html'), applySharedShell(sourceHome, '/', true), 'utf8');

let renderedPages = 1;

async function renderDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || ignoredDirectories.has(entry.name)) continue;
    const childDirectory = path.join(directory, entry.name);
    const indexPath = path.join(childDirectory, 'index.html');

    try {
      const source = await readFile(indexPath, 'utf8');
      const relativeDirectory = path.relative(projectRoot, childDirectory).split(path.sep).join('/');
      const pathname = `/${relativeDirectory}/`;
      await writeFile(indexPath, prepareInteriorPage(source, pathname), 'utf8');
      renderedPages += 1;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }

    await renderDirectory(childDirectory);
  }
}

await renderDirectory(projectRoot);
console.log(`Generated shared static shell for ${renderedPages} pages`);
