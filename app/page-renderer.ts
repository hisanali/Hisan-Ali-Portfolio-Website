import { applySharedShell } from './site-shell.ts';

const interiorFonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const interiorStyles = '<link rel="stylesheet" href="/interior-redesign.css?v=86">';
const experienceStyles = '<link rel="stylesheet" href="/experience-upgrades.css?v=1">';
const qualityRepairStyles = '<link rel="stylesheet" href="/quality-repairs.css?v=1">';
const fieldGuideStyles = '<link rel="stylesheet" href="/blog/field-guide.css?v=2">';
const interiorScript = '<script src="/interior-redesign.js?v=34"></script>';

export function prepareInteriorPage(html: string, pathname: string) {
  const isFieldGuide = /\bfield-guide-page\b/i.test(html);
  const pageStyles = `${interiorStyles}${isFieldGuide ? fieldGuideStyles : ''}${experienceStyles}${qualityRepairStyles}`;
  const path = pathname.replace(/^\/+|\/+$/g, '');
  const root = path.split('/')[0] || 'home';
  const known = ['about', 'services', 'tools', 'games', 'blog', 'contact', 'speed-test', 'gcc', 'legal', 'work', 'lab', 'growth-diagnostic'];
  const family = known.includes(root) ? root : 'landing';
  const bodyClasses = ['redesign-interior', `page-${family}`];
  if (root === 'blog' && path.split('/').length > 1) bodyClasses.push('page-blog-article');
  if (root === 'tools' && path.split('/').length > 1) bodyClasses.push('page-tool-detail');

  const prepared = html
    .replace(/script\.js\?v=[^"']+/g, 'script.js?v=20260903-shell3')
    .replace(/services-redesign\.css\?v=[^"']+/g, 'services-redesign.css?v=4')
    .replace(/<link\b[^>]*href=["']\/interior-redesign\.css[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']\/experience-upgrades\.css[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']\/quality-repairs\.css[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["']\/interior-redesign\.js[^>]*><\/script>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']\/blog\/field-guide\.css[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Serif\+Display[^>]*>\s*/gi, '')
    .replace('</head>', `${interiorFonts}${pageStyles}</head>`)
    .replace('</body>', `${interiorScript}</body>`)
    .replace(/<body(\s[^>]*)?>/i, (match, attributes = '') => {
      if (/\bclass=/i.test(attributes)) {
        return match.replace(/class=(["'])(.*?)\1/i, (_full, quote, classes) => {
          const merged = [...new Set(`${classes} ${bodyClasses.join(' ')}`.trim().split(/\s+/))];
          return `class=${quote}${merged.join(' ')}${quote}`;
        });
      }
      return `<body class="${bodyClasses.join(' ')}"${attributes}>`;
    });

  return applySharedShell(prepared, pathname);
}
