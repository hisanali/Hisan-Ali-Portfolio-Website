import { readFile } from 'fs/promises';
import path from 'path';

type Params = {
  params: {
    slug: string[];
  };
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.xml') return 'application/xml; charset=utf-8';
  if (ext === '.txt') return 'text/plain; charset=utf-8';

  return 'text/html; charset=utf-8';
}

export async function GET(_: Request, { params }: Params) {
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
