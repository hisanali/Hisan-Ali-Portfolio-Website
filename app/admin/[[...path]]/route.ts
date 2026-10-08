import { configuration, cookie, cookieValue, equal, getSession, localPreview, responseHeaders, seal, SESSION_COOKIE, SESSION_SECONDS, STATE_COOKIE, unseal } from '../../insights/security';
import { authorization, exchange, freshSession } from '../../insights/google';
import { filtersFrom, loadReports, loadRealtime } from '../../insights/reports';
import { demoReports, demoRealtime } from '../../insights/demo';
import { shell } from '../../insights/shell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
type Params = { params: { path?: string[] } };
const cache = new Map<string, { expires: number; value: Awaited<ReturnType<typeof loadReports>> }>();
const pending = new Map<string, Promise<Awaited<ReturnType<typeof loadReports>>>>();
let liveCache: { key: string; expires: number; value: Awaited<ReturnType<typeof loadRealtime>> } | undefined;
const livePending = new Map<string, Promise<Awaited<ReturnType<typeof loadRealtime>>>>();
function json(data: object, status = 200) { return Response.json(data, { status, headers: responseHeaders() }); }
function redirect(path: string, cookies: string[] = []) {
  const headers = new Headers({ ...responseHeaders(), Location: path });
  cookies.forEach(value => headers.append('Set-Cookie', value));
  return new Response(null, { status: 303, headers });
}
export async function GET(request: Request, { params }: Params) {
  const route = (params.path || []).join('/'), url = new URL(request.url), config = configuration();
  const session = getSession(request), preview = localPreview(request), demo = preview && url.searchParams.get('demo') === '1';
  if (!route) return new Response(shell({ mode: demo ? 'demo' : session ? 'live' : 'login', ready: config.ready, preview, error: url.searchParams.get('error')?.slice(0, 200) }), { headers: responseHeaders('text/html; charset=utf-8') });
  if (route === 'login') {
    if (!config.ready) return redirect('/admin/?error=Google+sign-in+is+not+configured+yet.');
    const auth = authorization();
    return redirect(auth.url, [cookie(STATE_COOKIE, seal({ state: auth.state, verifier: auth.verifier, expires: auth.expires }, STATE_COOKIE), 600)]);
  }
  if (route === 'callback') {
    const state = unseal<{ state: string; verifier: string; expires: number }>(cookieValue(request, STATE_COOKIE), STATE_COOKIE);
    const clear = cookie(STATE_COOKIE, '', 0);
    if (!state || !equal(state.state, url.searchParams.get('state') || '') || !url.searchParams.get('code')) return redirect('/admin/?error=Sign-in+was+cancelled+or+expired.+Please+try+again.', [clear]);
    try {
      const authenticated = await exchange(url.searchParams.get('code')!, state.verifier);
      return redirect('/admin/', [clear, cookie(SESSION_COOKIE, seal(authenticated, SESSION_COOKIE), SESSION_SECONDS)]);
    } catch (error) { return redirect('/admin/?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Unable to sign in.'), [clear]); }
  }
  if (route !== 'data' && route !== 'realtime') return json({ error: 'Not found.' }, 404);
  if (!session && !demo) return json({ error: 'Sign in to view analytics.' }, 401);
  if (route === 'realtime') {
    if (demo) return json(demoRealtime());
    try {
      const refreshed = await freshSession(session!);
      const key = JSON.stringify([refreshed.email, config.property]);
      if (!liveCache || liveCache.key !== key || liveCache.expires < Date.now()) {
        let work = livePending.get(key);
        if (!work) { work = loadRealtime(refreshed.accessToken); livePending.set(key, work); }
        try { liveCache = { key, value: await work, expires: Date.now() + 25000 }; } finally { livePending.delete(key); }
      }
      const response = json(liveCache.value);
      if (refreshed !== session) response.headers.append('Set-Cookie', cookie(SESSION_COOKIE, seal(refreshed, SESSION_COOKIE), Math.max(0, Math.floor((refreshed.expires - Date.now()) / 1000))));
      return response;
    } catch { return json({ error: 'Your Google session could not be refreshed. Please sign in again.' }, 401); }
  }
  let filters;
  try { filters = filtersFrom(url); } catch { return json({ error: 'Invalid report filters.' }, 400); }
  if (demo) return json(demoReports(filters));
  try {
    const refreshed = await freshSession(session!);
    const key = JSON.stringify([refreshed.email, config.property, filters]);
    let report = cache.get(key);
    if (!report || report.expires < Date.now()) {
      let work = pending.get(key);
      if (!work) { work = loadReports(refreshed.accessToken, filters); pending.set(key, work); }
      let value;
      try { value = await work; } finally { pending.delete(key); }
      report = { value, expires: Date.now() + 5 * 60 * 1000 };
      if (cache.size >= 12) cache.delete(cache.keys().next().value!);
      cache.set(key, report);
    }
    const response = json(report.value);
    if (refreshed !== session) response.headers.append('Set-Cookie', cookie(SESSION_COOKIE, seal(refreshed, SESSION_COOKIE), Math.max(0, Math.floor((refreshed.expires - Date.now()) / 1000))));
    return response;
  } catch { return json({ error: 'Your Google session could not be refreshed. Please sign in again.' }, 401); }
}
export async function POST(request: Request, { params }: Params) {
  if ((params.path || []).join('/') !== 'logout') return json({ error: 'Not found.' }, 404);
  if (request.headers.get('origin') !== configuration().origin) return json({ error: 'Invalid request origin.' }, 403);
  cache.clear();
  liveCache = undefined;
  return redirect('/admin/', [cookie(SESSION_COOKIE, '', 0), cookie(STATE_COOKIE, '', 0)]);
}
