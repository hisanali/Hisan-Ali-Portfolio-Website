import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'hisan_admin';
export const STATE_COOKIE = 'hisan_oauth';
export const SESSION_SECONDS = 8 * 60 * 60;
export type AdminSession = { email: string; accessToken: string; refreshToken?: string; tokenExpires: number; expires: number };

export function configuration() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  const origin = process.env.ADMIN_ORIGIN || 'http://localhost:4318';
  const email = (process.env.ADMIN_EMAIL || 'hisanali73@gmail.com').trim().toLowerCase();
  const validOrigin = /^https:\/\/[^/?#]+$/.test(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
  return { clientId, clientSecret, secret, origin, email, ready: !!(clientId && clientSecret && secret.length >= 32 && validOrigin), property: process.env.GA4_PROPERTY_ID || '515896463', site: 'https://hisanali.com/' };
}

export function seal(value: object, purpose: string, secret = configuration().secret): string {
  if (secret.length < 32) throw new Error('Session secret is not configured.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function unseal<T extends { expires: number }>(value: string | undefined, purpose: string, secret = configuration().secret): T | null {
  try {
    if (!value || value.length > 6000 || secret.length < 32) return null;
    const data = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), data.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(data.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8')) as T;
    return Number.isFinite(result.expires) && result.expires > Date.now() ? result : null;
  } catch { return null; }
}

export function cookieValue(request: Request, name: string) {
  return request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(name + '='))?.slice(name.length + 1);
}
export function getSession(request: Request): AdminSession | null {
  const session = unseal<AdminSession>(cookieValue(request, SESSION_COOKIE), SESSION_COOKIE);
  return configuration().ready && session?.email === configuration().email && typeof session.accessToken === 'string' ? session : null;
}
export function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${configuration().origin.startsWith('https:') ? '; Secure' : ''}`;
}
export function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function localPreview(request: Request) {
  return process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
}
export function responseHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType, 'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  };
}

// The legacy static route must never serve source files, secrets, or dependency trees.
export function isPublicAsset(segments: string[]) {
  const blocked = new Set(['app', 'components', 'server', 'scripts', 'node_modules', 'api', 'admin', 'package.json', 'package-lock.json', 'tsconfig.json', 'vercel.json']);
  if (!segments.length || segments.some(segment => segment.startsWith('.') || segment.includes('\\') || blocked.has(segment))) return false;
  const last = segments[segments.length - 1];
  return !last.includes('.') || /\.(html|css|js|json|xml|txt|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|pdf|glb|gltf|bin|wasm|mp3|mp4|webm|ogg|wav)$/i.test(last);
}
