import { readFile } from 'fs/promises';
import path from 'path';
import { applySharedShell } from '../site-shell';

type Params = {
  params: {
    slug: string[];
  };
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.xml') return 'application/xml; charset=utf-8';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.ico') return 'image/x-icon';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.ttf') return 'font/ttf';
  if (ext === '.otf') return 'font/otf';
  if (ext === '.pdf') return 'application/pdf';

  return 'application/octet-stream';
}

export async function GET(request: Request, { params }: Params) {
  const root = process.cwd();
  const cleanSegments = params.slug.filter(Boolean);

  const candidates = [
    path.join(root, ...cleanSegments, 'index.html'),
    path.join(root, ...cleanSegments)
  ];

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (!normalized.startsWith(path.normalize(root + path.sep))) {
      return new Response('Not found', { status: 404 });
    }

    try {
      if (path.extname(normalized).toLowerCase() === '.html') {
        const html = await readFile(normalized, 'utf8');
        const prepared = html
          .replace(/script\.js\?v=[^"']+/g, 'script.js?v=20260820-interior3')
          .replace('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/interior-redesign.css?v=28"></head>')
          .replace('</body>', '<script src="/interior-redesign.js?v=20"></script></body>');
        const enhanced = applySharedShell(prepared, new URL(request.url).pathname);

        return new Response(enhanced, {
          headers: { 'content-type': 'text/html; charset=utf-8' }
        });
      }

      const content = await readFile(normalized);
      return new Response(content, {
        headers: { 'content-type': contentTypeFor(normalized) }
      });
    } catch {
      // Try next candidate.
    }
  }

  return new Response('Not found', { status: 404 });
}
