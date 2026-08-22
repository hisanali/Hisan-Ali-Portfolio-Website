import { readFile } from 'fs/promises';
import path from 'path';
import { applySharedShell } from './site-shell';

export async function GET(request: Request) {
  const filePath = path.join(process.cwd(), 'home-redesign.html');

  try {
    const html = await readFile(filePath, 'utf8');
    const enhanced = applySharedShell(html, new URL(request.url).pathname, true);
    return new Response(enhanced, {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  } catch {
    return new Response('Home page not found', { status: 404 });
  }
}
