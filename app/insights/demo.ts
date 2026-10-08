import { contacts, trackedEvents, periods, type Dataset, type Filters, type Row } from './reports.ts';

// Deliberately synthetic; available only through the development-only preview route.
const countryNames: Record<string, string> = { OM: 'Oman', AE: 'United Arab Emirates', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', IN: 'India' };
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
  // Previous-period values use a different growth factor per row, so "what changed" has real movers.
  const growth = [1.19, 1.42, .86, 1.05, 2.1, .74, 1.3, .95, 1.6];
  const summary = { activeUsers: Math.round(sessions * .76), newUsers: Math.round(sessions * .61), sessions, engagedSessions: Math.round(sessions * .682), screenPageViews: views, engagementRate: .682, userEngagementDuration: sessions * 74, averageSessionDuration: 118.4, screenPageViewsPerSession: views / sessions, bounceRate: .318 };
  add('summary', [summary]); add('previous', [{ ...summary, activeUsers: Math.round(summary.activeUsers / 1.16), newUsers: Math.round(summary.newUsers / 1.22), sessions: Math.round(sessions / 1.19), screenPageViews: Math.round(views / 1.14), engagementRate: .632, averageSessionDuration: 104.2, screenPageViewsPerSession: 1.76, bounceRate: .368 }]);
  add('daily', daily); add('dailyPrevious', daily.map((row, i) => { const date = new Date(ga.previousStart + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10).replaceAll('-', ''), sessions: Math.round(Number(row.sessions) / 1.19) }; }));
  const breakdown = (id: string, field: string, labels: string[], shares: number[], extra: (i: number) => Row = () => ({})) => {
    const counts = split(sessions, shares);
    add(id, counts.map((count, i) => ({ [field]: labels[i], ...extra(i), sessions: count, activeUsers: Math.round(count * .83), engagementRate: .54 + i * .035 })));
    return counts;
  };
  const previousOf = (id: string, field: string, labels: string[], counts: number[], extra: (i: number) => Row = () => ({})) => add(id, counts.map((count, i) => ({ [field]: labels[i], ...extra(i), sessions: Math.round(count / growth[i % growth.length]) })));
  const channelLabels = ['Organic Search', 'Direct', 'Organic Social', 'Referral', 'Paid Search'];
  previousOf('channelsPrevious', 'sessionDefaultChannelGroup', channelLabels, breakdown('channels', 'sessionDefaultChannelGroup', channelLabels, [.48, .24, .14, .09, .05]));
  const sourceLabels = ['google / organic', '(direct) / (none)', 'instagram / social', 'linkedin.com / referral', 'google / cpc', 'chatgpt.com / referral'];
  previousOf('sourcesPrevious', 'sessionSourceMedium', sourceLabels, breakdown('sources', 'sessionSourceMedium', sourceLabels, [.46, .24, .14, .08, .05, .03]));
  const countryIds = filters.country ? [filters.country] : ['OM', 'AE', 'SA', 'IN', 'QA', 'GB', 'US', 'KW', 'BH', 'DE'];
  const countryLabels = countryIds.map(id => countryNames[id] || ({ GB: 'United Kingdom', US: 'United States', DE: 'Germany' } as Record<string, string>)[id]);
  const countryShares = filters.country ? [1] : [.5, .14, .1, .09, .04, .04, .03, .02, .02, .02];
  previousOf('countriesPrevious', 'country', countryLabels, breakdown('countries', 'country', countryLabels, countryShares, i => ({ countryId: countryIds[i] })), i => ({ countryId: countryIds[i] }));
  breakdown('regions', 'region', ['Muscat', 'Dubai', 'Riyadh Region', 'Kerala', 'Al Batinah North', 'Doha'], [.36, .14, .1, .09, .18, .13], i => ({ country: ['Oman', 'United Arab Emirates', 'Saudi Arabia', 'India', 'Oman', 'Qatar'][i] }));
  const cities: [string, string, string][] = [['Muscat', 'Oman', 'OM'], ['Seeb', 'Oman', 'OM'], ['Dubai', 'United Arab Emirates', 'AE'], ['Riyadh', 'Saudi Arabia', 'SA'], ['Sohar', 'Oman', 'OM'], ['Kozhikode', 'India', 'IN'], ['Doha', 'Qatar', 'QA'], ['London', 'United Kingdom', 'GB'], ['Abu Dhabi', 'United Arab Emirates', 'AE'], ['Bengaluru', 'India', 'IN']];
  breakdown('cities', 'city', cities.map(c => c[0]), [.3, .12, .11, .09, .08, .07, .06, .06, .06, .05], i => ({ country: cities[i][1], countryId: cities[i][2] }));
  breakdown('devices', 'deviceCategory', filters.device ? [filters.device] : ['mobile', 'desktop', 'tablet'], filters.device ? [1] : [.64, .32, .04]);
  breakdown('browsers', 'browser', ['Chrome', 'Safari', 'Edge', 'Firefox', 'Samsung Internet'], [.55, .29, .08, .04, .04]);
  breakdown('os', 'operatingSystem', ['Android', 'iOS', 'Windows', 'Macintosh', 'Linux'], [.41, .3, .19, .08, .02]);
  breakdown('campaigns', 'sessionCampaignName', ['(organic)', '(direct)', 'portfolio-launch', 'oman-seo-guide'], [.48, .24, .18, .1]);
  add('languages', split(sessions, [.74, .15, .04, .04, .03]).map((count, i) => ({ language: ['English', 'Arabic', 'Hindi', 'Malayalam', 'French'][i], sessions: count, activeUsers: Math.round(count * .82) })));
  add('newReturning', split(sessions, [.63, .37]).map((count, i) => ({ newVsReturning: ['new', 'returning'][i], sessions: count, activeUsers: Math.round(count * (i ? .55 : .9)), engagementRate: i ? .78 : .62 })));
  // Weekly rhythm: Oman's weekend is Friday–Saturday, with morning and evening peaks.
  add('hourly', Array.from({ length: 7 * 24 }, (_, i) => { const day = Math.floor(i / 24), hour = i % 24; const curve = Math.max(.05, Math.exp(-((hour - 10) ** 2) / 8) + .8 * Math.exp(-((hour - 21) ** 2) / 6) + .12); return { dayOfWeek: String(day), hour: String(hour).padStart(2, '0'), sessions: Math.round(sessions / 168 * curve * (day === 5 ? .55 : day === 6 ? .75 : 1.12) * 1.6) }; }));
  add('ageGroups', split(summary.activeUsers, [.09, .38, .29, .14, .07, .03]).map((activeUsers, i) => ({ userAgeBracket: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][i], activeUsers })));
  add('genders', split(summary.activeUsers, [.66, .34]).map((activeUsers, i) => ({ userGender: ['male', 'female'][i], activeUsers })));
  add('interests', ['Technology/Technophiles', 'Business Professionals', 'Shoppers/Value Shoppers', 'Media & Entertainment/Movie Lovers', 'Travel/Business Travelers', 'Food & Dining/Coffee Shop Regulars', 'Sports & Fitness/Health & Fitness Buffs', 'Lifestyles & Hobbies/Business Professionals'].map((brandingInterest, i) => ({ brandingInterest, activeUsers: Math.round(summary.activeUsers * (.34 - i * .035)) })));
  breakdown('brands', 'mobileDeviceBranding', ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Google', 'OnePlus'], [.42, .27, .12, .08, .06, .05]);
  breakdown('screens', 'screenResolution', ['390x844', '1920x1080', '393x873', '1536x864', '412x915', '1440x900'], [.24, .2, .17, .15, .13, .11]);
  add('firstSources', split(summary.activeUsers, [.47, .26, .13, .09, .05]).map((activeUsers, i) => ({ firstUserSourceMedium: ['google / organic', '(direct) / (none)', 'instagram / social', 'linkedin.com / referral', 'chatgpt.com / referral'][i], newUsers: Math.round(activeUsers * .8), activeUsers })));
  add('referrers', ['https://www.google.com/', 'https://www.linkedin.com/', 'https://l.instagram.com/', 'https://chatgpt.com/', 'https://www.bing.com/', 'https://hisanali.com/', 'https://www.facebook.com/', 'https://duckduckgo.com/'].map((pageReferrer, i) => ({ pageReferrer, screenPageViews: Math.round(views * [.3, .07, .06, .04, .03, .25, .02, .01][i]), activeUsers: Math.round(summary.activeUsers * [.32, .06, .06, .04, .02, .2, .02, .01][i]) })));
  add('journeys', ['google / organic', '(direct) / (none)', 'instagram / social', 'linkedin.com / referral'].flatMap((source, i) => ['/', '/seo-expert-oman/', '/gcc/', '/blog/hire-digital-marketer-oman/'].map((landingPage, j) => ({ sessionSourceMedium: source, landingPage, sessions: Math.round(sessions * [.46, .24, .14, .08][i] * [.3, .35, .2, .15][(i + j) % 4]), engagementRate: .55 + ((i * 3 + j) % 7) * .04 }))).sort((a, b) => b.sessions - a.sessions));
  const paths = ['/', '/seo-expert-oman/', '/gcc/', '/blog/hire-digital-marketer-oman/', '/contact/', '/resources/oman-marketing-calendar-2027/'];
  const shares = [.29, .23, .18, .14, .1, .06];
  const pageViews = split(views, shares);
  add('pages', pageViews.map((count, i) => ({ pagePath: paths[i], screenPageViews: count, activeUsers: Math.round(count / 1.4), userEngagementDuration: count * (39 + i * 7) })));
  add('pagesPrevious', pageViews.map((count, i) => ({ pagePath: paths[i], screenPageViews: Math.round(count / growth[(i + 2) % growth.length]) })));
  add('landing', split(sessions, shares).map((count, i) => ({ landingPage: paths[i], sessions: count, engagementRate: .61 + i * .025, bounceRate: .39 - i * .025 })));
  const counts = [Math.round(sessions * .021), Math.round(sessions * .007), Math.round(sessions * .004), Math.round(sessions * .003), Math.round(sessions * .024), Math.round(sessions * .016)];
  add('events', trackedEvents.map((eventName, i) => ({ eventName, eventCount: counts[i], totalUsers: Math.round(counts[i] * .84) })));
  add('eventsPrevious', trackedEvents.map((eventName, i) => ({ eventName, eventCount: Math.round(counts[i] * .78) })));
  add('allEvents', [['page_view', views], ['user_engagement', Math.round(sessions * 1.4)], ['session_start', sessions], ['scroll', Math.round(views * .46)], ['first_visit', summary.newUsers], ['click', Math.round(sessions * .21)], ...trackedEvents.map((name, i) => [name, counts[i]] as [string, number])].map(([eventName, eventCount]) => ({ eventName, eventCount, totalUsers: Math.round(Number(eventCount) * .7) })).sort((a, b) => Number(b.eventCount) - Number(a.eventCount)));
  add('eventsToday', [{ eventName: 'lead_whatsapp', eventCount: 2 }, { eventName: 'cta_contact', eventCount: 3 }, { eventName: 'file_download', eventCount: 1 }]);
  add('eventsLastSeen', trackedEvents.filter(name => name !== 'lead_phone').map((eventName, i) => ({ eventName, date: ga.endDate.replaceAll('-', ''), eventCount: 1 + i })));
  const leadCount = counts.slice(0, 4).reduce((a, b) => a + b, 0);
  add('leadDaily', split(leadCount, daily.map(row => row.sessions / sessions)).map((eventCount, i) => ({ date: daily[i].date, eventCount })));
  add('leadPages', contacts.flatMap((eventName, i) => split(counts[i], shares).map((eventCount, j) => ({ pagePath: paths[j], eventName, eventCount }))));
  add('leadSources', contacts.flatMap((eventName, i) => split(counts[i], [.52, .28, .2]).map((eventCount, j) => ({ sessionSourceMedium: ['google / organic', '(direct) / (none)', 'instagram / social'][j], eventName, eventCount }))));
  const clicks = Math.round(sessions * .52), impressions = Math.round(clicks / .047);
  add('searchSummary', [{ clicks, impressions, ctr: clicks / impressions, position: 12.4 }]);
  add('searchPrevious', [{ clicks: Math.round(clicks / 1.24), impressions: Math.round(impressions / 1.17), ctr: .044, position: 15.1 }]);
  add('searchDaily', split(clicks, daily.map(row => row.sessions / sessions)).map((count, i) => { const date = new Date(search.startDate + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10), clicks: count, impressions: Math.round(count / .047) }; }));
  // Positions and click-through rates vary so the opportunity finder has realistic candidates.
  const searchRows = (field: string, labels: string[], previous = false) => labels.map((label, i) => {
    const position = [3.1, 6.8, 1.2, 9.4, 14.2, 7.6, 18.5, 11.3, 4.4, 22.8][i % 10], ctr = [.12, .028, .41, .018, .009, .022, .006, .011, .07, .004][i % 10];
    const shown = Math.round(impressions * [.08, .14, .02, .12, .09, .07, .1, .06, .04, .05][i % 10]), count = Math.round(shown * ctr);
    const factor = previous ? growth[(i + 4) % growth.length] : 1;
    return { [field]: label, clicks: Math.round(count / factor), impressions: Math.round(shown / factor), ctr, position: previous ? position + 2.4 - (i % 3) : position };
  });
  const queries = ['digital marketing consultant oman', 'seo expert oman', 'hisan ali', 'digital marketer muscat', 'gcc digital marketing', 'google ads agency oman', 'social media marketing oman', 'freelance marketer muscat', 'oman marketing calendar 2027', 'website design oman'];
  add('queries', searchRows('query', queries)); add('queriesPrevious', searchRows('query', queries, true));
  add('searchPages', searchRows('page', paths.map(path => 'https://hisanali.com' + path))); add('searchPagesPrevious', searchRows('page', paths.map(path => 'https://hisanali.com' + path), true));
  add('searchCountries', searchRows('country', filters.country ? [filters.country] : ['omn', 'are', 'sau', 'ind']));
  add('searchDevices', searchRows('device', filters.device ? [filters.device] : ['MOBILE', 'DESKTOP', 'TABLET']));
  return { mode: 'demo', generatedAt: new Date().toISOString(), filters, periods: { ga, search }, datasets };
}

export function demoRealtime() {
  const datasets: Record<string, Dataset> = {};
  const add = (id: string, rows: Row[]) => { datasets[id] = { status: 'ok', rows }; };
  add('realtime', [{ activeUsers: 9, screenPageViews: 27, eventCount: 74 }]);
  add('liveMinutes', [{ minutesAgo: '01', activeUsers: 3, eventCount: 12 }, { minutesAgo: '02', activeUsers: 2, eventCount: 10 }, { minutesAgo: '06', activeUsers: 3, eventCount: 17 }, { minutesAgo: '09', activeUsers: 1, eventCount: 4 }, { minutesAgo: '12', activeUsers: 2, eventCount: 15 }, { minutesAgo: '18', activeUsers: 2, eventCount: 12 }, { minutesAgo: '23', activeUsers: 1, eventCount: 6 }, { minutesAgo: '26', activeUsers: 1, eventCount: 10 }]);
  add('livePages', [{ unifiedScreenName: 'Hisan Ali — Digital Marketing Consultant', screenPageViews: 12, activeUsers: 5 }, { unifiedScreenName: 'SEO Expert Oman', screenPageViews: 8, activeUsers: 3 }, { unifiedScreenName: 'GCC Digital Marketing', screenPageViews: 4, activeUsers: 2 }, { unifiedScreenName: 'Contact', screenPageViews: 3, activeUsers: 1 }]);
  add('liveEvents', [{ eventName: 'page_view', eventCount: 27 }, { eventName: 'user_engagement', eventCount: 22 }, { eventName: 'scroll', eventCount: 15 }, { eventName: 'lead_whatsapp', eventCount: 5 }, { eventName: 'lead_email', eventCount: 2 }]);
  add('liveCountries', [{ country: 'Oman', countryId: 'OM', activeUsers: 5 }, { country: 'United Arab Emirates', countryId: 'AE', activeUsers: 2 }, { country: 'India', countryId: 'IN', activeUsers: 1 }, { country: 'United Kingdom', countryId: 'GB', activeUsers: 1 }]);
  add('liveCities', [{ city: 'Muscat', country: 'Oman', countryId: 'OM', activeUsers: 3 }, { city: 'Seeb', country: 'Oman', countryId: 'OM', activeUsers: 1 }, { city: 'Sohar', country: 'Oman', countryId: 'OM', activeUsers: 1 }, { city: 'Dubai', country: 'United Arab Emirates', countryId: 'AE', activeUsers: 2 }, { city: 'Kozhikode', country: 'India', countryId: 'IN', activeUsers: 1 }, { city: 'London', country: 'United Kingdom', countryId: 'GB', activeUsers: 1 }]);
  add('liveDevices', [{ deviceCategory: 'mobile', activeUsers: 6 }, { deviceCategory: 'desktop', activeUsers: 3 }]);
  return { mode: 'demo', generatedAt: new Date().toISOString(), datasets };
}
