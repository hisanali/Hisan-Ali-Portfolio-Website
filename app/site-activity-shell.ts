// The static build and local preview share exactly the same tracking coverage.
export function withSiteActivity(html: string) {
  const cleaned = html.replace(/<script\b[^>]*src=["']\/site-activity\.js[^>]*><\/script>\s*/gi, '');
  const script = '<script src="/site-activity.js?v=20261008-1" defer></script>';
  if (/<\/head>/i.test(cleaned)) return cleaned.replace(/<\/head>/i, script + '</head>');
  // Some standalone tools omit explicit head/body tags. HTML fragments are left alone.
  return cleaned.replace(/<\/html>/i, script + '</html>');
}
