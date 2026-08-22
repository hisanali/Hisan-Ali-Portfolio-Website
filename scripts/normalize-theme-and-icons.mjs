import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const ignoredDirectories = new Set(['.git', '.next', '.vercel', 'node_modules']);
const textExtensions = new Set(['.html', '.css', '.js', '.ts']);
const lightThemeInit = `<script id="theme-init">(()=>{try{const saved=localStorage.getItem('preferred-theme');const dark=saved==='dark';document.documentElement.classList.toggle('theme-dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){document.documentElement.classList.remove('theme-dark');document.documentElement.style.colorScheme='light'}})();</script>`;

async function normalize(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalize(filePath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;

    const source = await readFile(filePath, 'utf8');
    let output = source;
    if (entry.name.endsWith('.html')) {
      output = output.replace(/<script id="theme-init">[\s\S]*?<\/script>/g, lightThemeInit);
    }
    output = output
      .replace(/↗(?!︎)/gu, '↗︎')
      .replace(/→(?!︎)/gu, '→︎')
      .replace(/↓(?!︎)/gu, '↓︎')
      .replace(/↑(?!︎)/gu, '↑︎');

    if (output !== source) await writeFile(filePath, output, 'utf8');
  }
}

await normalize(projectRoot);
console.log('Normalized light-mode defaults and text-style arrows');
