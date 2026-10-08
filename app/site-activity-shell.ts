// The static build and local preview share exactly the same tracking coverage.
export function withSiteActivity(html: string) {
  const cleaned = html.replace(/<script\b[^>]*src=["']\/site-activity\.js[^>]*><\/script>\s*/gi, '');
  return cleaned.replace(/<\/head>/i, '<script src="/site-activity.js?v=20261008-1" defer></script></head>');
}
