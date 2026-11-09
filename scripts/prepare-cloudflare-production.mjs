import {readdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root='.vercel/site-static';
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}if((await stat(file)).size>25*1024*1024)throw Error(`Oversized asset: ${file}`);}}
await walk(root);
// Keep original production robots, tracking, forms and multiplayer room names.
await writeFile(path.join(root,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n/tools/rubiks-cube/*\n  Cache-Control: no-store, max-age=0\n');
const config=JSON.parse(await readFile('vercel.json','utf8'));
await writeFile(path.join(root,'_redirects'),config.redirects.filter(r=>!r.has&&!r.source.includes(':')).map(r=>`${r.source} ${r.destination} 301`).join('\n')+'\n/wp-admin/* / 301\n/wp-content/* / 301\n/wp-includes/* / 301\n');
console.log('Prepared production assets; no preview data or noindex override');
