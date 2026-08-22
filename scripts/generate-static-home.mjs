import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySharedShell } from '../app/site-shell.ts';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const sourcePath = path.join(projectRoot, 'home-redesign.html');
const outputPath = path.join(projectRoot, 'index.html');

const source = await readFile(sourcePath, 'utf8');
const rendered = applySharedShell(source, '/', true);

await writeFile(outputPath, rendered, 'utf8');
console.log('Generated index.html from home-redesign.html');
