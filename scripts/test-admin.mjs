import test from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal, equal, isPublicAsset, localPreview, getSession, SESSION_COOKIE } from '../app/insights/security.ts';
import { periods, filtersFrom, gaRequest, searchRequest, definitions, contacts, loadReports, loadRealtime } from '../app/insights/reports.ts';
import { exchange } from '../app/insights/google.ts';
import { demoReports } from '../app/insights/demo.ts';

test('sessions reject tampering, expired data, wrong purpose and missing secrets', () => {
  const secret = 'test-only-secret-at-least-32-characters';
  const value = { email: 'admin@example.com', accessToken: 'test-token', expires: Date.now() + 10000 };
  const encrypted = seal(value, 'session', secret);
  assert.deepEqual(unseal(encrypted, 'session', secret), value);
  assert.equal(unseal(encrypted, 'oauth', secret), null);
  assert.equal(unseal(encrypted, 'session', 'different-test-secret-at-least-32-characters'), null);
  assert.equal(unseal(encrypted.slice(0, 10) + '!' + encrypted.slice(11), 'session', secret), null);
  assert.equal(unseal(seal({ expires: 1 }, 'session', secret), 'session', secret), null);
  assert.equal(unseal(encrypted, 'session', ''), null);
  assert.equal(equal('abc', 'abç'), false);
  assert.equal(equal('abc', 'abc'), true);
});
test('source files, environment files, traversal and internal trees are never public assets', () => {
  for (const value of ['.env.local', '.git/config', 'app/insights/security.ts', 'scripts/test-admin.mjs', 'package.json', 'node_modules/pkg/index.js', '../secret.json', 'api/oauth.json', 'secret.pem', 'file.ts', 'admin/index.html']) assert.equal(isPublicAsset(value.split('/')), false, value);
  for (const value of ['style.css', 'gcc', 'blog/article/index.html', 'games/arcade3d.bundle.js', 'sitemap.xml', 'assets/car.glb', 'public/docs/ga-tracking-sheet.pdf']) assert.equal(isPublicAsset(value.split('/')), true, value);
});
test('tracking health reports ignore filters and use their own date windows', () => {
  const filters = { days: 28, country: 'OM', device: 'mobile' }, period = periods(28, 1);
  const today = gaRequest(definitions.find(item => item.id === 'eventsToday'), filters, period);
  assert.deepEqual(today.dateRanges, [{ startDate: 'today', endDate: 'today' }]);
  assert.equal(today.dimensionFilter.andGroup.expressions.length, 1);
  const year = gaRequest(definitions.find(item => item.id === 'eventsLastSeen'), filters, period);
  assert.equal(year.dateRanges[0].startDate, '365daysAgo');
  assert.equal(year.orderBys[0].desc, true);
});
test('equal-length date windows are adjacent over year boundaries', () => {
  assert.deepEqual(periods(7, 1, new Date('2026-01-02T08:00:00Z')), { startDate:'2025-12-26',endDate:'2026-01-01',previousStart:'2025-12-19',previousEnd:'2025-12-25' });
  assert.equal(periods(7,3,new Date('2026-01-02T08:00:00Z')).endDate,'2025-12-30');
});
test('filters reject arbitrary inputs and apply consistently to both Google sources', () => {
  assert.throws(() => filtersFrom(new URL('http://localhost/admin/data/?days=3650')));
  assert.throws(() => filtersFrom(new URL('http://localhost/admin/data/?country=__proto__')));
  const filters = filtersFrom(new URL('http://localhost/admin/data/?days=7&country=OM&device=mobile'));
  const period = periods(7,1), request = gaRequest(definitions.find(item => item.id === 'eventsPrevious'), filters, period);
  assert.equal(request.dateRanges[0].endDate, period.previousEnd);
  assert.equal(request.dimensionFilter.andGroup.expressions.length,3);
  const search = searchRequest(['query'], filters, period);
  assert.deepEqual(search.dimensionFilterGroups[0].filters.map(item => item.expression), ['omn','MOBILE']);
  assert.equal(search.dataState,'final');
});
test('sample additive metrics reconcile and contact totals exclude downloads and CTA clicks', () => {
  for (const days of [7,28,90]) {
    const report = demoReports({ days,country:'',device:'' });
    assert.equal(report.mode,'demo');
    const d = report.datasets, sum = (id, key) => d[id].rows.reduce((total,row) => total + Number(row[key]),0);
    assert.equal(sum('daily','sessions'), d.summary.rows[0].sessions);
    assert.equal(sum('channels','sessions'), d.summary.rows[0].sessions);
    assert.equal(sum('pages','screenPageViews'), d.summary.rows[0].screenPageViews);
    const contactTotal = d.events.rows.filter(row => contacts.includes(row.eventName)).reduce((total,row) => total + row.eventCount,0);
    assert.equal(sum('leadDaily','eventCount'),contactTotal);
    assert.equal(sum('leadPages','eventCount'),contactTotal);
    assert.equal(sum('leadSources','eventCount'),contactTotal);
    assert.ok(sum('events','eventCount') > contactTotal);
  }
});
test('production cannot enable demo or authenticate without configured credentials', () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.equal(localPreview(new Request('http://localhost/admin/?demo=1')),false);
  assert.equal(getSession(new Request('https://hisanali.com/admin/')),null);
  if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before;
});
test('only the exact owner can open a configured production session', () => {
  const keys = ['NODE_ENV','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ADMIN_SESSION_SECRET','ADMIN_ORIGIN','ADMIN_EMAIL'];
  const before = Object.fromEntries(keys.map(key => [key,process.env[key]]));
  Object.assign(process.env,{NODE_ENV:'production',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',ADMIN_SESSION_SECRET:'test-session-secret-at-least-32-characters',ADMIN_ORIGIN:'https://hisanali.com',ADMIN_EMAIL:'hisanali73@gmail.com'});
  try {
    for (const email of ['hisanali73@gmail.com','other@gmail.com','hisanali73@gmail.com.attacker.test']) {
      const value=seal({email,accessToken:'test',expires:Date.now()+10000},SESSION_COOKIE);
      const result=getSession(new Request('https://hisanali.com/admin/data/',{headers:{cookie:`${SESSION_COOKIE}=${value}`}}));
      assert.equal(!!result,email==='hisanali73@gmail.com');
    }
  } finally { for (const key of keys) { if(before[key]===undefined) delete process.env[key]; else process.env[key]=before[key]; } }
});
test('Google callback rejects unverified addresses and different Google accounts', async () => {
  const original=global.fetch, owner=process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL='hisanali73@gmail.com';
  try {
    for (const user of [{email:'other@gmail.com',email_verified:true},{email:'hisanali73@gmail.com',email_verified:false},{email:'hisanali73@gmail.com',email_verified:true}]) {
      global.fetch=async url=>Response.json(String(url).includes('/token')?{access_token:'test',expires_in:3600}:user);
      if(user.email==='hisanali73@gmail.com' && user.email_verified) assert.equal((await exchange('test-code','test-verifier')).email,user.email);
      else await assert.rejects(exchange('test-code','test-verifier'),/not authorized/);
    }
  } finally { global.fetch=original; if(owner===undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL=owner; }
});
test('realtime uses a separate 30-minute window and preserves provider failures', async () => {
  const original=global.fetch;
  global.fetch=async (url,options)=>{
    assert.match(String(url),/:runRealtimeReport$/);
    const body=JSON.parse(options.body);
    assert.deepEqual(body.minuteRanges,[{startMinutesAgo:29,endMinutesAgo:0}]);
    assert.equal(body.dateRanges,undefined);
    // GA4 realtime rejects activeUsers when grouped by eventName.
    if(body.dimensions.some(d=>d.name==='eventName') && body.metrics.some(m=>m.name==='activeUsers')) return new Response('{}',{status:400});
    if(body.dimensions.some(d=>d.name==='city')) return new Response('{}',{status:403});
    return Response.json({dimensionHeaders:body.dimensions,metricHeaders:body.metrics,rows:[]});
  };
  try {
    const data=await loadRealtime('test');
    assert.equal(data.datasets.liveCities.status,'error');
    assert.equal(data.datasets.realtime.status,'ok');
    assert.equal(data.datasets.liveEvents.status,'ok');
    assert.equal(Object.keys(data.datasets).length,7);
  } finally {global.fetch=original;}
});
test('partial source failure preserves independent reports and distinguishes failures from no rows', async () => {
  const original = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(options.headers.Authorization,/^Bearer /);
    const body = JSON.parse(options.body);
    if (String(url).includes('webmasters')) return new Response(JSON.stringify({ rows: [] }),{status:200});
    if (body.dimensions?.some(d => d.name === 'city')) return new Response('{}',{status:403});
    return new Response(JSON.stringify({ dimensionHeaders:body.dimensions || [],metricHeaders:body.metrics,rows:[],rowCount:0 }),{status:200});
  };
  try {
    const report = await loadReports('test-token',{days:7,country:'OM',device:'mobile'});
    assert.equal(report.datasets.cities.status,'error');
    assert.equal(report.datasets.summary.status,'ok');
    assert.deepEqual(report.datasets.searchSummary.rows,[]);
    assert.equal(report.datasets.searchSummary.status,'ok');
    assert.equal(Object.keys(report.datasets).length,47);
  } finally { global.fetch = original; }
});
