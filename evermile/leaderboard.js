// Today's road, shared: the best crash-free drives on today's seed from everyone who submitted one. Uses the site's
// public Realtime configuration and the evermile_daily table (supabase/migrations/20261105_evermile_daily.sql).
// Everything degrades to the local best when the table or the network is not there.
let clientPromise = null;
async function client() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const config = await fetch('/api/multiplayer/config', {cache: 'no-store'}).then((r) => r.ok ? r.json() : null).catch(() => null);
    if (!config?.url || !config?.publishableKey) return null;
    const {createClient} = await import('./vendor/realtime-client.js');
    return createClient(config.url, config.publishableKey, {auth: {persistSession: false}});
  })();
  return clientPromise;
}
export async function fetchBoard(day, limit = 10) {
  const c = await client(); if (!c) return {ok: false, rows: [], why: 'offline'};
  const {data, error} = await c.from('evermile_daily').select('name, km').eq('day', day).order('km', {ascending: false}).limit(200);
  if (error) return {ok: false, rows: [], why: error.message};
  const best = new Map(); for (const r of data) if (!best.has(r.name) || best.get(r.name) < Number(r.km)) best.set(r.name, Number(r.km));
  return {ok: true, rows: [...best.entries()].map(([name, km]) => ({name, km})).sort((a, b) => b.km - a.km).slice(0, limit)};
}
export async function submitDrive(day, name, km) {
  const c = await client(); if (!c) return {ok: false, why: 'offline'};
  const clean = String(name || '').trim().slice(0, 24); if (!clean || !(km > 0)) return {ok: false, why: 'nothing to submit'};
  const {error} = await c.from('evermile_daily').insert({day, name: clean, km: Math.round(km * 100) / 100});
  return error ? {ok: false, why: error.message} : {ok: true};
}
