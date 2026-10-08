import { createHash } from 'node:crypto';

const kinds = new Set(['page_view', 'site_click', 'control_change', 'form_submit', 'lead_whatsapp', 'lead_email', 'lead_phone', 'lead_form', 'cta_contact', 'file_download']);
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const limits = new Map<string, { count: number; expires: number }>();
export function cleanText(value: unknown, max = 100) {
  return String(value || '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]').replace(/\+?\d[\d ().-]{6,}\d/g, '[number]').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
export function cleanPath(value: unknown) {
  try {
    const url = new URL(String(value || ''), 'https://hisanali.com');
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    return cleanText(decodeURIComponent(url.pathname), 240);
  } catch { return ''; }
}
export function sanitizeEvent(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>, pathname = cleanPath(v.page);
  if (!kinds.has(String(v.event)) || !/^\/[\s\S]*$/.test(pathname) || /^\/(admin|api)(\/|$)/i.test(pathname) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v.id))) return null;
  // No visitor identifiers, IPs, full URLs, form values or arbitrary payload fields are stored.
  return { id: v.id, event_name: v.event, page: pathname, label: cleanText(v.label), target: cleanText(v.target, 240).split(/[?#]/)[0], area: ['header', 'footer', 'form', 'content'].includes(String(v.area)) ? v.area : 'content', device: ['mobile', 'tablet', 'desktop'].includes(String(v.device)) ? v.device : 'desktop' };
}
async function database(rpc: string, body: object) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Activity storage is not configured.');
  const response = await fetch(`${url}/rest/v1/rpc/${rpc}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) throw new Error('Activity storage is temporarily unavailable.');
  return response.json();
}
export async function collectActivity(request: Request) {
  const origin = request.headers.get('origin'), ownOrigin = new URL(request.url).origin;
  const allowed = origin === 'https://hisanali.com' || origin === 'https://www.hisanali.com' || (process.env.NODE_ENV !== 'production' && origin === ownOrigin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || ''));
  const response = (data: object, status: number) => Response.json(data, { status, headers });
  if (!allowed) return response({ error: 'Invalid origin.' }, 403);
  // A bounded, per-instance abuse guard. The IP is hashed, held briefly in memory, and never persisted.
  const now = Date.now(), key = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').digest('hex');
  for (const [id, limit] of limits) if (limit.expires <= now) limits.delete(id);
  const limit = limits.get(key) || { count: 0, expires: now + 60000 };
  if (++limit.count > 120 || limits.size > 10000) return response({ error: 'Too many requests.' }, 429);
  limits.set(key, limit);
  try {
    // Stream with a hard limit: do not buffer arbitrarily large untrusted request bodies.
    const reader = request.body?.getReader(); if (!reader) return response({ error: 'Missing body.' }, 400);
    let size = 0, text = ''; const decoder = new TextDecoder();
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 12000) { await reader.cancel(); return response({ error: 'Payload too large.' }, 413); } text += decoder.decode(value, { stream: true }); }
    text += decoder.decode();
    const data = JSON.parse(text);
    if (!Array.isArray(data.events) || !data.events.length || data.events.length > 20) return response({ error: 'Invalid events.' }, 400);
    const events = data.events.map(sanitizeEvent).filter(Boolean);
    if (!events.length) return response({ error: 'No valid events.' }, 400);
    await database('portfolio_record_activity', { items: events });
    return response({ received: events.length }, 202);
  } catch (error) {
    return response({ error: error instanceof SyntaxError ? 'Invalid JSON.' : 'Activity collection is temporarily unavailable.' }, error instanceof SyntaxError ? 400 : 503);
  }
}
export async function loadActivity() { return database('portfolio_read_activity', {}); }
