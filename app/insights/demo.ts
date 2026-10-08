import { contacts, trackedEvents, periods, type Dataset, type Filters, type Row } from './reports.ts';

// Deliberately synthetic; available only through the development-only preview route.
export function demoReports(filters: Filters) {
  const ga = periods(filters.days, 1), search = periods(filters.days, 3);
  const scale = (filters.country ? .57 : 1) * (filters.device ? .64 : 1);
  const daily = Array.from({ length: filters.days }, (_, i) => {
    const date = new Date(ga.startDate + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + i);
    const sessions = Math.round((94 + i * .9 + 32 * Math.sin(i * .8) + (i % 7 === 4 ? 41 : 0)) * scale);
    return { date: date.toISOString().slice(0, 10).replaceAll('-', ''), sessions, activeUsers: Math.round(sessions * .82), screenPageViews: Math.round(sessions * 1.83) };
  });
  const sessions = daily.reduce((total, row) => total + row.sessions, 0), views = daily.reduce((total, row) => total + row.screenPageViews, 0);
  const split = (total: number, shares: number[]) => { let used = 0; return shares.map((share, i) => { const value = i === shares.length - 1 ? total - used : Math.round(total * share); used += value; return value; }); };
  const datasets: Record<string, Dataset> = {};
  const add = (id: string, rows: Row[]) => { datasets[id] = { rows, status: 'ok' }; };
  const summary = { activeUsers: Math.round(sessions * .76), newUsers: Math.round(sessions * .61), sessions, engagedSessions: Math.round(sessions * .682), screenPageViews: views, engagementRate: .682, userEngagementDuration: sessions * 74 };
  add('summary', [summary]); add('previous', [{ ...summary, activeUsers: Math.round(summary.activeUsers / 1.16), sessions: Math.round(sessions / 1.19), screenPageViews: Math.round(views / 1.14), engagementRate: .632 }]);
  add('daily', daily); add('dailyPrevious', daily.map((row, i) => { const date = new Date(ga.previousStart + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10).replaceAll('-', ''), sessions: Math.round(Number(row.sessions) / 1.19) }; }));
  const breakdown = (id: string, field: string, labels: string[], shares: number[]) => add(id, split(sessions, shares).map((count, i) => ({ [field]: labels[i], sessions: count, activeUsers: Math.round(count * .83), engagementRate: .54 + i * .035 })));
  breakdown('channels', 'sessionDefaultChannelGroup', ['Organic Search', 'Direct', 'Organic Social', 'Referral', 'Paid Search'], [.48, .24, .14, .09, .05]);
  breakdown('sources', 'sessionSourceMedium', ['google / organic', '(direct) / (none)', 'instagram / social', 'linkedin.com / referral', 'google / cpc'], [.48, .24, .14, .09, .05]);
  breakdown('countries', 'country', filters.country ? [filters.country] : ['Oman', 'United Arab Emirates', 'Saudi Arabia', 'India', 'Other'], filters.country ? [1] : [.57, .15, .12, .1, .06]);
  breakdown('cities', 'city', ['Muscat', 'Seeb', 'Dubai', 'Riyadh', 'Other'], [.42, .15, .15, .12, .16]);
  breakdown('devices', 'deviceCategory', filters.device ? [filters.device] : ['mobile', 'desktop', 'tablet'], filters.device ? [1] : [.64, .32, .04]);
  breakdown('browsers', 'browser', ['Chrome', 'Safari', 'Edge', 'Firefox'], [.58, .29, .08, .05]);
  breakdown('campaigns', 'sessionCampaignName', ['(organic)', '(direct)', 'portfolio-launch', 'oman-seo-guide'], [.48, .24, .18, .1]);
  const paths = ['/', '/seo-expert-oman/', '/gcc/', '/blog/hire-digital-marketer-oman/', '/contact/', '/resources/oman-marketing-calendar-2027/'];
  const shares = [.29, .23, .18, .14, .1, .06];
  add('pages', split(views, shares).map((count, i) => ({ pagePath: paths[i], screenPageViews: count, activeUsers: Math.round(count / 1.4), userEngagementDuration: count * (39 + i * 7) })));
  add('landing', split(sessions, shares).map((count, i) => ({ landingPage: paths[i], sessions: count, engagementRate: .61 + i * .025, bounceRate: .39 - i * .025 })));
  const counts = [Math.round(sessions * .021), Math.round(sessions * .007), Math.round(sessions * .004), Math.round(sessions * .003), Math.round(sessions * .024), Math.round(sessions * .016)];
  add('events', trackedEvents.map((eventName, i) => ({ eventName, eventCount: counts[i], totalUsers: Math.round(counts[i] * .84) })));
  add('eventsPrevious', trackedEvents.map((eventName, i) => ({ eventName, eventCount: Math.round(counts[i] * .78) })));
  const leadCount = counts.slice(0, 4).reduce((a, b) => a + b, 0);
  add('leadDaily', split(leadCount, daily.map(row => row.sessions / sessions)).map((eventCount, i) => ({ date: daily[i].date, eventCount })));
  add('leadPages', contacts.flatMap((eventName, i) => split(counts[i], shares).map((eventCount, j) => ({ pagePath: paths[j], eventName, eventCount }))));
  add('leadSources', contacts.flatMap((eventName, i) => split(counts[i], [.52, .28, .2]).map((eventCount, j) => ({ sessionSourceMedium: ['google / organic', '(direct) / (none)', 'instagram / social'][j], eventName, eventCount }))));
  const clicks = Math.round(sessions * .52), impressions = Math.round(clicks / .047);
  add('searchSummary', [{ clicks, impressions, ctr: clicks / impressions, position: 12.4 }]);
  add('searchPrevious', [{ clicks: Math.round(clicks / 1.24), impressions: Math.round(impressions / 1.17), ctr: .044, position: 15.1 }]);
  add('searchDaily', split(clicks, daily.map(row => row.sessions / sessions)).map((count, i) => { const date = new Date(search.startDate + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10), clicks: count, impressions: Math.round(count / .047) }; }));
  const searchRows = (field: string, labels: string[]) => labels.map((label, i) => { const count = Math.round(clicks * (.23 - i * .032)); return { [field]: label, clicks: count, impressions: count * (13 + i * 8), ctr: 1 / (13 + i * 8), position: 4.2 + i * 4.7 }; });
  add('queries', searchRows('query', ['digital marketing consultant oman', 'seo expert oman', 'hisan ali', 'digital marketer muscat', 'gcc digital marketing']));
  add('searchPages', searchRows('page', paths.map(path => 'https://hisanali.com' + path)));
  add('searchCountries', searchRows('country', filters.country ? [filters.country] : ['omn', 'are', 'sau', 'ind']));
  add('searchDevices', searchRows('device', filters.device ? [filters.device] : ['MOBILE', 'DESKTOP', 'TABLET']));
  add('realtime', [{ activeUsers: 7 }]);
  return { mode: 'demo', generatedAt: new Date().toISOString(), filters, periods: { ga, search }, datasets };
}

export function demoRealtime() {
  const datasets: Record<string, Dataset> = {};
  const add = (id: string, rows: Row[]) => { datasets[id] = { status: 'ok', rows }; };
  add('realtime', [{ activeUsers: 7, screenPageViews: 23, eventCount: 64 }]);
  add('liveMinutes', [{ minutesAgo: '02', activeUsers: 2, eventCount: 10 }, { minutesAgo: '06', activeUsers: 3, eventCount: 17 }, { minutesAgo: '12', activeUsers: 2, eventCount: 15 }, { minutesAgo: '18', activeUsers: 2, eventCount: 12 }, { minutesAgo: '26', activeUsers: 1, eventCount: 10 }]);
  add('livePages', [{ unifiedScreenName: 'Hisan Ali — Digital Marketing Consultant', screenPageViews: 12, activeUsers: 5 }, { unifiedScreenName: 'SEO Expert Oman', screenPageViews: 8, activeUsers: 3 }, { unifiedScreenName: 'GCC Digital Marketing', screenPageViews: 3, activeUsers: 2 }]);
  add('liveEvents', [{ eventName: 'page_view', eventCount: 23, activeUsers: 7 }, { eventName: 'user_engagement', eventCount: 20, activeUsers: 6 }, { eventName: 'scroll', eventCount: 14, activeUsers: 5 }, { eventName: 'lead_whatsapp', eventCount: 5, activeUsers: 3 }, { eventName: 'lead_email', eventCount: 2, activeUsers: 1 }]);
  add('liveCountries', [{ country: 'Oman', activeUsers: 5 }, { country: 'United Arab Emirates', activeUsers: 2 }]);
  add('liveCities', [{ city: 'Muscat', country: 'Oman', activeUsers: 4 }, { city: 'Seeb', country: 'Oman', activeUsers: 1 }, { city: 'Dubai', country: 'United Arab Emirates', activeUsers: 2 }]);
  add('liveDevices', [{ deviceCategory: 'mobile', activeUsers: 5 }, { deviceCategory: 'desktop', activeUsers: 2 }]);
  return { mode: 'demo', generatedAt: new Date().toISOString(), datasets };
}
