import { applySharedShell } from './site-shell.ts';

const interiorFonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const interiorStyles = '<link rel="stylesheet" href="/interior-redesign.css?v=71">';
const interiorScript = '<script src="/interior-redesign.js?v=33"></script>';

export function prepareInteriorPage(html: string, pathname: string) {
  const prepared = html
    .replace(/script\.js\?v=[^"']+/g, 'script.js?v=20260822-shell2')
    .replace(/<link\b[^>]*href=["']\/interior-redesign\.css[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["']\/interior-redesign\.js[^>]*><\/script>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Serif\+Display[^>]*>\s*/gi, '')
    .replace('</head>', `${interiorFonts}${interiorStyles}</head>`)
    .replace('</body>', `${interiorScript}</body>`);

  return applySharedShell(prepared, pathname);
}
