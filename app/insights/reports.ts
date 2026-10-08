import { configuration } from './security.ts';
import { googlePost } from './google.ts';

export type Row = Record<string, string | number>;
export type Dataset = { rows: Row[]; status: 'ok' | 'error'; error?: string; totalRows?: number; limited?: boolean; thresholded?: boolean };
export type Filters = { days: number; country: string; device: string };
export const contacts = ['lead_whatsapp', 'lead_email', 'lead_phone', 'lead_form'];
export const trackedEvents = [...contacts, 'cta_contact', 'file_download'];
const countryCodes: Record<string, string> = { OM: 'omn', AE: 'are', SA: 'sau', QA: 'qat', KW: 'kwt', BH: 'bhr', IN: 'ind' };
export const periodOptions = [7, 28, 90, 180, 365];
export function filtersFrom(url: URL): Filters {
  const days = Number(url.searchParams.get('days') || 28), country = url.searchParams.get('country') || '', device = url.searchParams.get('device') || '';
  if (!periodOptions.includes(days) || (country && !Object.prototype.hasOwnProperty.call(countryCodes, country)) || !['', 'desktop', 'mobile', 'tablet'].includes(device)) throw new Error('Invalid report filters.');
  return { days, country, device };
}
export function periods(days: number, delay: number, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const end = new Date(today + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() - delay);
  const shift = (value: Date, amount: number) => { const result = new Date(value); result.setUTCDate(result.getUTCDate() + amount); return result.toISOString().slice(0, 10); };
  return { startDate: shift(end, 1 - days), endDate: shift(end, 0), previousStart: shift(end, 1 - 2 * days), previousEnd: shift(end, -days) };
}
// `range` overrides the selected period: 'today' is intraday data, 'year' powers the tracking health check.
type Definition = { id: string; dimensions: string[]; metrics: string[]; previous?: boolean; eventFilter?: string[]; limit?: number; range?: 'today' | 'year'; unfiltered?: boolean };
const summaryMetrics = ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'engagementRate', 'userEngagementDuration', 'averageSessionDuration', 'screenPageViewsPerSession', 'bounceRate'];
const trafficMetrics = ['sessions', 'activeUsers', 'engagementRate'];
export const definitions: Definition[] = [
  { id: 'summary', dimensions: [], metrics: summaryMetrics }, { id: 'previous', dimensions: [], metrics: summaryMetrics, previous: true },
  { id: 'daily', dimensions: ['date'], metrics: ['sessions', 'activeUsers', 'screenPageViews'] },
  { id: 'dailyPrevious', dimensions: ['date'], metrics: ['sessions'], previous: true },
  { id: 'channels', dimensions: ['sessionDefaultChannelGroup'], metrics: trafficMetrics },
  { id: 'channelsPrevious', dimensions: ['sessionDefaultChannelGroup'], metrics: ['sessions'], previous: true },
  { id: 'sources', dimensions: ['sessionSourceMedium'], metrics: trafficMetrics },
  { id: 'sourcesPrevious', dimensions: ['sessionSourceMedium'], metrics: ['sessions'], previous: true },
  { id: 'countries', dimensions: ['country', 'countryId'], metrics: trafficMetrics, limit: 250 },
  { id: 'countriesPrevious', dimensions: ['country', 'countryId'], metrics: ['sessions'], previous: true, limit: 250 },
  { id: 'regions', dimensions: ['region', 'country'], metrics: trafficMetrics },
  { id: 'cities', dimensions: ['city', 'country', 'countryId'], metrics: trafficMetrics, limit: 250 },
  { id: 'devices', dimensions: ['deviceCategory'], metrics: trafficMetrics },
  { id: 'browsers', dimensions: ['browser'], metrics: trafficMetrics },
  { id: 'os', dimensions: ['operatingSystem'], metrics: trafficMetrics },
  { id: 'languages', dimensions: ['language'], metrics: ['activeUsers', 'sessions'] },
  { id: 'newReturning', dimensions: ['newVsReturning'], metrics: ['activeUsers', 'sessions', 'engagementRate'] },
  { id: 'hourly', dimensions: ['dayOfWeek', 'hour'], metrics: ['sessions'], limit: 200 },
  // Demographics need Google signals in GA4; each report fails independently when unavailable or thresholded.
  { id: 'ageGroups', dimensions: ['userAgeBracket'], metrics: ['activeUsers'] },
  { id: 'genders', dimensions: ['userGender'], metrics: ['activeUsers'] },
  { id: 'interests', dimensions: ['brandingInterest'], metrics: ['activeUsers'], limit: 20 },
  { id: 'brands', dimensions: ['mobileDeviceBranding'], metrics: ['sessions', 'activeUsers'] },
  { id: 'screens', dimensions: ['screenResolution'], metrics: ['sessions'], limit: 20 },
  { id: 'firstSources', dimensions: ['firstUserSourceMedium'], metrics: ['newUsers', 'activeUsers'] },
  { id: 'referrers', dimensions: ['pageReferrer'], metrics: ['screenPageViews', 'activeUsers'], limit: 150 },
  { id: 'journeys', dimensions: ['sessionSourceMedium', 'landingPage'], metrics: ['sessions', 'engagementRate'], limit: 150 },
  { id: 'campaigns', dimensions: ['sessionCampaignName'], metrics: trafficMetrics },
  { id: 'pages', dimensions: ['pagePath'], metrics: ['screenPageViews', 'activeUsers', 'userEngagementDuration'], limit: 250 },
  { id: 'pagesPrevious', dimensions: ['pagePath'], metrics: ['screenPageViews'], previous: true, limit: 250 },
  { id: 'landing', dimensions: ['landingPage'], metrics: ['sessions', 'engagementRate', 'bounceRate'], limit: 250 },
  { id: 'events', dimensions: ['eventName'], metrics: ['eventCount', 'totalUsers'], eventFilter: trackedEvents },
  { id: 'eventsPrevious', dimensions: ['eventName'], metrics: ['eventCount'], eventFilter: trackedEvents, previous: true },
  { id: 'allEvents', dimensions: ['eventName'], metrics: ['eventCount', 'totalUsers'], limit: 60 },
  { id: 'eventsToday', dimensions: ['eventName'], metrics: ['eventCount'], eventFilter: trackedEvents, range: 'today', unfiltered: true },
  { id: 'eventsLastSeen', dimensions: ['eventName', 'date'], metrics: ['eventCount'], eventFilter: trackedEvents, range: 'year', unfiltered: true, limit: 500 },
  { id: 'leadDaily', dimensions: ['date'], metrics: ['eventCount'], eventFilter: contacts },
  { id: 'leadPages', dimensions: ['pagePath', 'eventName'], metrics: ['eventCount'], eventFilter: contacts, limit: 250 },
  { id: 'leadSources', dimensions: ['sessionSourceMedium', 'eventName'], metrics: ['eventCount'], eventFilter: contacts },
];
export function gaRequest(definition: Definition, filters: Filters, period: ReturnType<typeof periods>) {
  const expressions: object[] = [];
  if (filters.country && !definition.unfiltered) expressions.push({ filter: { fieldName: 'countryId', stringFilter: { value: filters.country, matchType: 'EXACT' } } });
  if (filters.device && !definition.unfiltered) expressions.push({ filter: { fieldName: 'deviceCategory', stringFilter: { value: filters.device, matchType: 'EXACT' } } });
  if (definition.eventFilter) expressions.push({ filter: { fieldName: 'eventName', inListFilter: { values: definition.eventFilter } } });
  return {
    dateRanges: [definition.range === 'today' ? { startDate: 'today', endDate: 'today' } : definition.range === 'year' ? { startDate: '365daysAgo', endDate: 'today' } : { startDate: definition.previous ? period.previousStart : period.startDate, endDate: definition.previous ? period.previousEnd : period.endDate }],
    dimensions: definition.dimensions.map(name => ({ name })), metrics: definition.metrics.map(name => ({ name })),
    ...(expressions.length ? { dimensionFilter: { andGroup: { expressions } } } : {}),
    orderBys: definition.dimensions.includes('date') ? [{ dimension: { dimensionName: 'date' }, desc: definition.range === 'year' }] : [{ metric: { metricName: definition.metrics[0] }, desc: true }],
    limit: definition.limit || 100, returnPropertyQuota: true,
  };
}
function gaRows(result: any): Dataset {
  const dimensions = result.dimensionHeaders || [], metrics = result.metricHeaders || [];
  const rows = (result.rows || []).map((row: any) => Object.fromEntries([
    ...dimensions.map((header: any, index: number) => [header.name, row.dimensionValues[index].value]),
    ...metrics.map((header: any, index: number) => [header.name, Number(row.metricValues[index].value)]),
  ]));
  return { rows, status: 'ok', totalRows: result.rowCount || rows.length, limited: result.rowCount > rows.length, thresholded: result.metadata?.subjectToThresholding || !!result.metadata?.samplingMetadatas?.length || result.metadata?.dataLossFromOtherRow };
}
export const realtimeDefinitions = [
  { id: 'realtime', dimensions: [], metrics: ['activeUsers', 'screenPageViews', 'eventCount'] },
  { id: 'liveMinutes', dimensions: ['minutesAgo'], metrics: ['activeUsers', 'eventCount'] },
  { id: 'livePages', dimensions: ['unifiedScreenName'], metrics: ['screenPageViews', 'activeUsers'] },
  { id: 'liveEvents', dimensions: ['eventName'], metrics: ['eventCount'] },
  { id: 'liveCountries', dimensions: ['country', 'countryId'], metrics: ['activeUsers'] },
  { id: 'liveCities', dimensions: ['city', 'country', 'countryId'], metrics: ['activeUsers'] },
  { id: 'liveDevices', dimensions: ['deviceCategory'], metrics: ['activeUsers'] },
];
export async function loadRealtime(accessToken: string) {
  const deadline = AbortSignal.timeout(18000);
  const entries = await limited(realtimeDefinitions.map(definition => async () => [definition.id, await safe(async () => gaRows(await googlePost(
    `https://analyticsdata.googleapis.com/v1beta/properties/${configuration().property}:runRealtimeReport`,
    { dimensions: definition.dimensions.map(name => ({ name })), metrics: definition.metrics.map(name => ({ name })), minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }], limit: 100, returnPropertyQuota: true },
    accessToken, deadline,
  )))] as [string, Dataset]));
  return { mode: 'live', generatedAt: new Date().toISOString(), datasets: Object.fromEntries(entries) };
}
export function searchRequest(dimensions: string[], filters: Filters, period: ReturnType<typeof periods>, previous = false) {
  const rules = [];
  if (filters.country) rules.push({ dimension: 'country', operator: 'equals', expression: countryCodes[filters.country] });
  if (filters.device) rules.push({ dimension: 'device', operator: 'equals', expression: filters.device.toUpperCase() });
  return { startDate: previous ? period.previousStart : period.startDate, endDate: previous ? period.previousEnd : period.endDate, dimensions, type: 'web', dataState: 'final', rowLimit: 250, ...(rules.length ? { dimensionFilterGroups: [{ filters: rules }] } : {}) };
}
async function safe(run: () => Promise<Dataset>): Promise<Dataset> {
  try { return await run(); } catch (error) { return { rows: [], status: 'error', error: error instanceof Error ? error.message : 'Report unavailable.' }; }
}
// Bounded concurrency avoids spiking the GA4 concurrent-request quota.
async function limited<T>(jobs: (() => Promise<T>)[], concurrency = 3): Promise<T[]> {
  let cursor = 0; const results: T[] = [];
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => { while (cursor < jobs.length) { const index = cursor++; results[index] = await jobs[index](); } }));
  return results;
}
export async function loadReports(accessToken: string, filters: Filters) {
  const config = configuration(), gaPeriod = periods(filters.days, 1), searchPeriod = periods(filters.days, 3);
  const deadline = AbortSignal.timeout(42000);
  // GA4 and Search Console have separate quotas, so both run side by side.
  const gaWork: Promise<[string, Dataset][]> = limited(definitions.map(definition => async () => [definition.id, await safe(async () => gaRows(await googlePost(`https://analyticsdata.googleapis.com/v1beta/properties/${config.property}:runReport`, gaRequest(definition, filters, gaPeriod), accessToken, deadline)))] as [string, Dataset]), 4);
  const searchDefinitions: [string, string[], boolean?][] = [['searchSummary', []], ['searchPrevious', [], true], ['searchDaily', ['date']], ['queries', ['query']], ['queriesPrevious', ['query'], true], ['searchPages', ['page']], ['searchPagesPrevious', ['page'], true], ['searchCountries', ['country']], ['searchDevices', ['device']]];
  const searchWork = limited(searchDefinitions.map(([id, dimensions, previous]) => async () => [id, await safe(async () => {
    const result = await googlePost(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.site)}/searchAnalytics/query`, searchRequest(dimensions, filters, searchPeriod, previous), accessToken, deadline);
    return { status: 'ok', rows: (result.rows || []).map((row: any) => ({ ...Object.fromEntries(dimensions.map((key, index) => [key, row.keys[index]])), clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position })), limited: result.rows?.length === 250 };
  })] as [string, Dataset]));
  const [entries, searchEntries] = await Promise.all([gaWork, searchWork]);
  return { mode: 'live', generatedAt: new Date().toISOString(), filters, periods: { ga: gaPeriod, search: searchPeriod }, datasets: Object.fromEntries([...entries, ...searchEntries]) };
}
