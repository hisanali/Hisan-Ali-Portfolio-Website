(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const e = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = value => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(Number(value));
  const pct = value => value == null ? '—' : (Number(value) * 100).toFixed(1) + '%';
  const decimal = value => value == null ? '—' : Number(value).toFixed(1);
  const seconds = value => value == null ? '—' : Math.floor(value / 60) + 'm ' + Math.round(value % 60) + 's';
  const dateValue = value => /^\d{8}$/.test(value) ? value.slice(0,4) + '-' + value.slice(4,6) + '-' + value.slice(6,8) : value;
  const humanDate = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(dateValue(value) + 'T12:00:00Z'));
  const contactNames = ['lead_whatsapp', 'lead_email', 'lead_phone', 'lead_form'];
  const eventLabels = { lead_whatsapp: 'WhatsApp clicks', lead_email: 'Email clicks', lead_phone: 'Phone clicks', lead_form: 'Form submissions', cta_contact: 'Contact CTA clicks', file_download: 'File downloads' };
  const views = {
    overview: ['Overview', 'Understand what brings people in, and what turns visits into enquiries.', 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
    live: ['Live activity', 'Recent activity across your website, refreshed automatically every 30 seconds.', 'M3 12h4l3-8 4 16 3-8h4'],
    traffic: ['Traffic & audience', 'Explore how visitors find you and where they come from.', 'M3 17l6-6 4 4 8-11M15 4h6v6'],
    leads: ['Leads & actions', 'Follow the contact actions that move a visitor toward a conversation.', 'M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13'],
    seo: ['Search performance', 'See the searches and pages building your visibility on Google.', 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
    pages: ['Pages & content', 'Find the content people read, land on, and take action from.', 'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6'],
    sources: ['Sources & settings', 'Connection status, reporting coverage, and the meaning behind each metric.', 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6'],
  };
  const state = { view: 'overview', report: null, live: null, liveBusy: false, liveError: '', compare: true, request: 0, controller: null, tables: {}, exporting: [], busy: false };
  const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  $('#nav').innerHTML = Object.entries(views).map(([key, value]) => `<button data-view="${key}" class="nav-item" aria-label="${e(value[0])}" ${key === 'overview' ? 'aria-current="page"' : ''}>${icon(value[2])}<span>${value[0]}</span>${key === 'leads' ? '<span class="nav-count">6</span>' : ''}</button>`).join('');
  function dataset(id) { return id === 'realtime' || id.startsWith('live') ? state.live?.datasets[id] : state.report?.datasets[id]; }
  function rows(id) { return dataset(id)?.status === 'ok' ? dataset(id).rows : []; }
  function summary(id, field) { const data = dataset(id); return data?.status === 'ok' ? data.rows[0]?.[field] == null && ['ctr','position','engagementRate'].includes(field) ? null : Number(data.rows[0]?.[field] ?? 0) : null; }
  function totalContacts(id = 'events') { return dataset(id)?.status === 'ok' ? rows(id).filter(row => contactNames.includes(row.eventName)).reduce((sum, row) => sum + Number(row.eventCount), 0) : null; }
  function errorFor(id) { const data = dataset(id); return data?.status === 'error' ? `<div class="empty-state"><b>Report unavailable</b><span>${e(data.error)}</span></div>` : ''; }
  function coverage(id) { const data = dataset(id); return `${data?.limited ? '<span class="coverage">Top rows only</span>' : ''}${data?.thresholded ? '<span class="coverage">Google data limits apply</span>' : ''}`; }
  function delta(current, previous, format, inverse) {
    if (!state.compare || current == null || previous == null) return '';
    if (previous === 0) return `<span class="delta neutral">${current === 0 ? 'No change' : 'No prior baseline'}</span>`;
    const difference = current - previous;
    const change = format === pct ? (difference * 100).toFixed(1) + ' pp' : (Math.abs(difference / previous) * 100).toFixed(1) + '%';
    return `<span class="delta ${(inverse ? difference < 0 : difference > 0) ? 'positive' : difference === 0 ? 'neutral' : 'negative'}">${difference > 0 ? '↗' : difference < 0 ? '↘' : '→'} ${format === pct ? change : change}</span><span class="delta-caption">vs previous ${$('#period').value} days</span>`;
  }
  function spark(values) {
    if (!values.length) return '';
    const max = Math.max(1, ...values), min = Math.min(0, ...values);
    const points = values.map((value, i) => `${i / Math.max(1, values.length - 1) * 130},${34 - (value - min) / (max - min) * 29}`).join(' ');
    return `<svg class="spark" viewBox="0 0 132 38" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function metric(label, value, previous, format = number, help = '', series = [], inverse = false) {
    state.exporting.push({ section: 'Key metrics', metric: label, current: value ?? '', previous: state.compare ? previous ?? '' : '' });
    return `<article class="metric"><div class="metric-label">${e(label)}<span class="info" title="${e(help)}" aria-label="${e(help)}" tabindex="0">i</span></div><div class="metric-number">${format(value)}${spark(series)}</div><div class="metric-comparison">${delta(value, previous, format, inverse)}</div></article>`;
  }
  function panel(title, subtitle, body, cls = '', controls = '') {
    return `<section class="panel ${cls}"><div class="panel-head"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${controls}</div>${body}</section>`;
  }
  function lineChart(id, field, previousId, label = 'Sessions') {
    const raw = rows(id), rawPrevious = state.compare && previousId ? rows(previousId) : [];
    if (errorFor(id)) return errorFor(id);
    if (!raw.length) return '<div class="empty-state">No data was returned for this period.</div>';
    const period = id.startsWith('search') ? state.report.periods.search : state.report.periods.ga;
    const calendar = (source, start) => Array.from({length:state.report.filters.days},(_,i) => { const date = new Date(start+'T00:00:00Z'); date.setUTCDate(date.getUTCDate()+i); const key=date.toISOString().slice(0,10); return source.find(row => dateValue(row.date) === key) || {date:key,[field]:null}; });
    const data = calendar(raw,period.startDate), previous = rawPrevious.length ? calendar(rawPrevious,period.previousStart) : [];
    const numeric = data.filter(row => row[field] != null).map(row => Number(row[field]));
    const max = Math.max(1, ...numeric, ...previous.filter(row => row[field] != null).map(row => Number(row[field])));
    const ceiling = Math.ceil(max / 4 / 10) * 4 * 10, width = 800, height = 225, left = 46, top = 18, bottom = 193;
    const x = i => left + i / Math.max(1, data.length - 1) * (width - left - 18), y = value => bottom - Number(value) / ceiling * (bottom - top);
    const segments = source => { const groups=[]; let group=[]; source.forEach((row,i) => { if(row[field] == null) { if(group.length) groups.push(group); group=[]; } else group.push([x(i),y(row[field])]); }); if(group.length) groups.push(group); return groups; };
    const line = source => segments(source).map(group => 'M'+group.map(point=>point.join(',')).join(' L')).join(' ');
    const path = segments(data).map(group => 'M'+group.map(point=>point.join(',')).join(' L')+` L${group[group.length-1][0]},${bottom} L${group[0][0]},${bottom} Z`).join(' ');
    state.exporting.push(...data.map(row => ({ section: label + ' trend', ...row })));
    if (previous.length) state.exporting.push(...previous.map(row => ({ section: label + ' previous trend', ...row })));
    return `<div class="chart-legend"><span><i class="legend-current"></i>${e(label)}</span>${previous.length ? '<span><i class="legend-previous"></i>Previous period</span>' : ''}${data.some(row=>row[field]==null) ? '<span>Gaps: no row returned</span>' : ''}</div><div class="chart-scroll"><svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(label)} by day. Hover or focus a point for its exact value."><defs><linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#548678" stop-opacity=".2"/><stop offset="100%" stop-color="#548678" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3,4].map(i => `<line x1="${left}" x2="${width - 18}" y1="${y(ceiling*i/4)}" y2="${y(ceiling*i/4)}" stroke="#e9eeeb" stroke-dasharray="3 4"/><text x="${left - 12}" y="${y(ceiling*i/4)+4}" text-anchor="end">${number(ceiling*i/4)}</text>`).join('')}<path d="${path}" fill="url(#fill-${id})"/>${previous.length ? `<path d="${line(previous)}" fill="none" stroke="#b1beb9" stroke-width="2" stroke-dasharray="5 5"/>` : ''}<path d="${line(data)}" fill="none" stroke="#36725e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>${data.map((row,i) => row[field] == null ? '' : `<circle cx="${x(i)}" cy="${y(row[field])}" r="4" class="chart-point" tabindex="0" aria-label="${e(humanDate(row.date))}: ${number(row[field])} ${e(label)}"><title>${e(humanDate(row.date))}: ${number(row[field])} ${e(label)}</title></circle>`).join('')}${[...new Set([0, Math.round((data.length-1)/4), Math.round((data.length-1)/2), Math.round((data.length-1)*3/4), data.length-1])].map(i => `<text x="${x(i)}" y="218" text-anchor="${i === 0 ? 'start' : i === data.length-1 ? 'end' : 'middle'}">${e(humanDate(data[i].date))}</text>`).join('')}</svg></div>`;
  }
  function bars(id, field, metricField = 'sessions', limit = 6) {
    if (errorFor(id)) return errorFor(id);
    const data = rows(id).slice().sort((a,b) => b[metricField] - a[metricField]).slice(0, limit);
    if (!data.length) return '<div class="empty-state">No matching activity yet.</div>';
    const max = Math.max(1, ...data.map(row => Number(row[metricField])));
    state.exporting.push(...data.map(row => ({ section: id, ...row })));
    return `<div class="bar-list">${data.map((row, i) => `<div class="bar-row"><div class="bar-copy"><span><i class="rank">${String(i+1).padStart(2,'0')}</i>${e(row[field])}</span><b>${number(row[metricField])}</b></div><progress value="${Number(row[metricField])}" max="${max}" aria-label="${e(row[field])}: ${number(row[metricField])}"></progress></div>`).join('')}</div>${coverage(id)}`;
  }
  const col = (key, label, format = null) => ({ key, label, format });
  function table(id, title, subtitle, columns, options = {}) {
    const preference = state.tables[id] || { query: '', sort: columns.find(c => c.format)?.key || columns[0].key, desc: true };
    let data = (options.rows || rows(id)).filter(row => columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(preference.query.toLowerCase())));
    data = data.slice().sort((a,b) => (typeof a[preference.sort] === 'number' ? Number(a[preference.sort] || 0) - Number(b[preference.sort] || 0) : String(a[preference.sort] || '').localeCompare(String(b[preference.sort] || ''))) * (preference.desc ? -1 : 1));
    state.exporting.push(...data.map(row => ({ section: title, ...row })));
    const body = errorFor(id) || `<div class="table-scroll"><table><thead><tr>${columns.map(c => `<th scope="col" aria-sort="${preference.sort === c.key ? preference.desc ? 'descending' : 'ascending' : 'none'}"><button data-sort="${e(c.key)}" data-table="${id}">${e(c.label)}<span>${preference.sort === c.key ? preference.desc ? '↓' : '↑' : '↕'}</span></button></th>`).join('')}</tr></thead><tbody>${data.slice(0,100).map(row => `<tr>${columns.map(c => `<td ${c.format ? 'class="numeric"' : ''} title="${e(row[c.key])}">${c.format ? c.format(row[c.key]) : e(eventLabels[row[c.key]] || row[c.key] || '(not set)')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}" class="no-results">No matching rows. Try another filter or period.</td></tr>`}</tbody></table></div><div class="table-foot"><span>${data.length > 100 ? 'Showing 100 of ' : ''}${number(data.length)} rows${data.length > 100 ? ' · CSV includes all matching rows' : ''}</span><span>${coverage(id)}${options.note || ''}</span></div>`;
    return panel(title, subtitle, body, options.className || '', `<label class="table-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search ${e(title)}" placeholder="Search…" data-search="${id}" value="${e(preference.query)}"></label>`);
  }
  function eventCards() {
    return `<div class="event-grid">${Object.entries(eventLabels).map(([key,label], i) => {
      const data = dataset('events'), row = rows('events').find(row => row.eventName === key);
      const count = data?.status === 'ok' ? row ? Number(row.eventCount) : 0 : null;
      state.exporting.push({ section: 'Tracked actions', eventName: key, eventCount: count ?? '' });
      return `<article class="event-card"><span class="event-icon event-${i}">${['↗','@','⌕','▤','→','↓'][i]}</span><span>${label}<small>${key}</small></span><b>${number(count)}</b></article>`;
    }).join('')}</div>`;
  }
  function overview() {
    const daily = rows('daily');
    return `<div class="metrics">${metric('Active visitors', summary('summary','activeUsers'), summary('previous','activeUsers'), number, 'Distinct active GA4 users across the full period. Daily user counts are not added together.', daily.map(row => row.activeUsers))}${metric('Sessions', summary('summary','sessions'), summary('previous','sessions'), number, 'Visits reported by GA4 for the selected period and filters.', daily.map(row => row.sessions))}${metric('Contact actions', totalContacts(), totalContacts('eventsPrevious'), number, 'WhatsApp + email + phone + form events. Repeated actions count; these are not unique or qualified leads.', rows('leadDaily').map(row => row.eventCount))}${metric('Google search clicks', summary('searchSummary','clicks'), summary('searchPrevious','clicks'), number, 'Search Console web-search clicks. Reporting dates end three days ago.', rows('searchDaily').map(row => row.clicks))}</div><div class="grid-two-wide">${panel('Traffic over time', `Daily sessions · ${humanDate(state.report.periods.ga.startDate)} – ${humanDate(state.report.periods.ga.endDate)}`, lineChart('daily','sessions','dailyPrevious'), '', '<span class="source-tag">GA4</span>')}${panel('Traffic sources', 'Sessions by acquisition channel', bars('channels','sessionDefaultChannelGroup'), '', '<button class="text-button" data-view="traffic">Explore ↗</button>')}</div><div class="section-title"><h2>From visits to conversations</h2><button class="text-button" data-view="leads">Explore lead activity →</button></div>${eventCards()}<div class="grid-two-wide">${table('pages','Most viewed pages','Content attracting attention',[col('pagePath','Page'),col('screenPageViews','Views',number),col('activeUsers','Active users',number)])}${panel('Right now', 'All visitors · last 30 minutes · unaffected by filters', `<div class="realtime" id="live-summary"><span class="live-ring"></span><strong>${number(summary('realtime','activeUsers'))}</strong><span>active visitors</span></div>${errorFor('realtime')}<div class="realtime-foot">${liveStatus()}<br><button class="text-button" data-view="live">Explore live activity →</button></div>`, 'realtime-panel')}</div>`;
  }
  function liveStatus() {
    if (state.liveError) return `<span class="error-text">${e(state.liveError)}</span>`;
    if (!state.live) return 'Connecting to realtime reports…';
    return `${state.live.mode === 'demo' ? 'Sample activity' : 'Retrieved'} ${new Date(state.live.generatedAt).toLocaleTimeString('en-GB')} · refreshes every 30s`;
  }
  function live() {
    const minuteRows = rows('liveMinutes'), max = Math.max(1,...minuteRows.map(row=>Number(row.activeUsers)));
    const minuteChart = errorFor('liveMinutes') || (!minuteRows.length ? '<div class="empty-state">No recent activity returned by Google.</div>' : `<div class="minute-chart" role="img" aria-label="Active users by minute, from 29 minutes ago to the current minute">${Array.from({length:30},(_,i)=>{const ago=29-i,row=minuteRows.find(row=>Number(row.minutesAgo)===ago),value=row?.activeUsers; return `<div><progress max="${max}" value="${Number(value||0)}" aria-label="${ago} minutes ago: ${value==null?'no row returned':number(value)+' active users'}"></progress><span>${[29,20,10,0].includes(ago)?ago===0?'Now':ago+'m':''}</span></div>`;}).join('')}</div><p class="chart-note">Unique users in each minute. The same user may appear in several minutes. Blank minutes have no returned row.</p>`);
    const leadData=dataset('liveEvents'), contactCount=leadData?.status==='ok'?rows('liveEvents').filter(row=>contactNames.includes(row.eventName)).reduce((sum,row)=>sum+Number(row.eventCount),0):null;
    return `<div class="note"><span class="status-dot"></span><b>Last 30 minutes · all visitors</b><br>${liveStatus()}<br>Google’s realtime data typically arrives within a few minutes. Date, country and device filters apply to historical views only.</div><div class="metrics">${metric('Active visitors',summary('realtime','activeUsers'),null,number,'Distinct active users across the last 30 minutes.')}${metric('Page views',summary('realtime','screenPageViews'),null)}${metric('All events',summary('realtime','eventCount'),null)}${metric('Contact actions',contactCount,null,number,'Recent WhatsApp, email, phone and form events. Repeated actions count.')}</div>${panel('Activity by minute','Active users · latest 30 minutes',minuteChart)}<div class="grid-two">${table('livePages','Pages being viewed','Page titles reported in the last 30 minutes',[col('unifiedScreenName','Page title'),col('screenPageViews','Views',number),col('activeUsers','Users',number)])}${table('liveEvents','Recent events','Event totals, including your lead tracking',[col('eventName','Event'),col('eventCount','Events',number)])}${panel('Live countries','Distinct active users by country',bars('liveCountries','country','activeUsers'))}${panel('Live devices','Distinct active users by device',bars('liveDevices','deviceCategory','activeUsers'))}</div>${table('liveCities','Live locations','Approximate city-level reporting from Google',[col('city','City'),col('country','Country'),col('activeUsers','Users',number)])}`;
  }
  function traffic() {
    const sessionCount = summary('summary','sessions'), duration = summary('summary','userEngagementDuration');
    return `<div class="metrics">${metric('Sessions',sessionCount,summary('previous','sessions'))}${metric('New users',summary('summary','newUsers'),summary('previous','newUsers'))}${metric('Engagement rate',summary('summary','engagementRate'),summary('previous','engagementRate'),pct,'Engaged sessions divided by sessions.')}${metric('Engagement / session',sessionCount ? duration/sessionCount : null,null,seconds,'Total user engagement duration divided by sessions.')}</div>${panel('Sessions over time','Daily visits with the previous period aligned by day',lineChart('daily','sessions','dailyPrevious'))}<div class="grid-two">${panel('Countries','Sessions by country',bars('countries','country'))}${panel('Devices','Sessions by device',bars('devices','deviceCategory'))}</div><div class="grid-two">${table('sources','Sources & media','Session acquisition, not first-user attribution',[col('sessionSourceMedium','Source / medium'),col('sessions','Sessions',number),col('activeUsers','Users',number),col('engagementRate','Engaged',pct)])}${table('campaigns','Campaigns','Campaign labels reported by GA4',[col('sessionCampaignName','Campaign'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}${table('cities','Cities','Location inferred by Google',[col('city','City'),col('country','Country'),col('sessions','Sessions',number)])}${table('browsers','Browsers','Technology used by your visitors',[col('browser','Browser'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}</div>`;
  }
  function leads() {
    return `<div class="note"><b>Contact actions, not unique leads.</b> Repeat clicks are counted. Downloads and contact CTA clicks are tracked separately. New events may take about 24 hours to appear.</div>${eventCards()}${panel('Contact activity over time','WhatsApp, email, phone and form actions',lineChart('leadDaily','eventCount',null,'Contact actions'))}${table('events','All tracked actions','Compare event volume with the number of people triggering each event',[col('eventName','Action'),col('eventCount','Events',number),col('totalUsers','Users',number)],{note:'Users can overlap between actions.'})}<div class="grid-two">${table('leadPages','Where contact actions happen','Page path when the contact event fired',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}${table('leadSources','Sources behind contact actions','Session acquisition associated with the event',[col('sessionSourceMedium','Source / medium'),col('eventName','Action'),col('eventCount','Events',number)])}</div><div class="note subtle">The lead_location parameter needs a registered GA4 custom dimension before it can be reported by location. This dashboard does not change your tracking configuration.</div>`;
  }
  function seo() {
    const p = state.report.periods.search;
    const cols = [col('clicks','Clicks',number),col('impressions','Impressions',number),col('ctr','CTR',pct),col('position','Position',decimal)];
    return `<div class="note"><b>Search Console reporting</b> · ${humanDate(p.startDate)} – ${humanDate(p.endDate)}. Uses final web-search data and ends three days ago. Hidden queries and API limits mean table rows may not sum to totals.</div><div class="metrics">${metric('Search clicks',summary('searchSummary','clicks'),summary('searchPrevious','clicks'))}${metric('Impressions',summary('searchSummary','impressions'),summary('searchPrevious','impressions'))}${metric('Click-through rate',summary('searchSummary','ctr'),summary('searchPrevious','ctr'),pct,'Search clicks divided by impressions, from the aggregate Search Console report.')}${metric('Average position',summary('searchSummary','position'),summary('searchPrevious','position'),decimal,'Average position reported by Search Console. A lower value is better.',[],true)}</div>${panel('Search clicks over time','Google web search',lineChart('searchDaily','clicks',null,'Search clicks'))}${table('queries','Search queries','What people searched before seeing your website',[col('query','Search query'),...cols])}${table('searchPages','Pages in Google Search','Search performance for canonical URLs',[col('page','Page'),...cols])}<div class="grid-two">${table('searchCountries','Search by country','Google country codes',[col('country','Country'),...cols])}${table('searchDevices','Search by device','Device used for the search',[col('device','Device'),...cols])}</div>`;
  }
  function pages() {
    const content = rows('pages').map(row => ({ ...row, engagementPerUser: row.activeUsers ? Number(row.userEngagementDuration) / Number(row.activeUsers) : null }));
    return `${table('pages','Content performance','Page-level activity from Google Analytics',[col('pagePath','Page'),col('screenPageViews','Views',number),col('activeUsers','Active users',number),col('engagementPerUser','Engagement / user',seconds)],{ rows:content, note:'Engagement duration ÷ active users; users may visit multiple pages.' })}${table('landing','Landing pages','The first page in a session',[col('landingPage','Landing page'),col('sessions','Sessions',number),col('engagementRate','Engagement rate',pct),col('bounceRate','Bounce rate',pct)])}${table('leadPages','Pages generating contact actions','WhatsApp, email, phone and form events only',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}`;
  }
  function sources() {
    const isDemo = state.report.mode === 'demo';
    state.exporting.push(...Object.entries(state.report.datasets).map(([report,data])=>({section:'Source status',report,status:isDemo?'sample':data.status,returnedRows:data.rows.length,limited:!!data.limited,error:data.error||''})));
    return `<div class="grid-two">${panel('Google Analytics 4','Traffic, content and lead activity',`<dl class="source-details"><dt>Property</dt><dd>hisanali.com · 515896463</dd><dt>Measurement ID</dt><dd>G-DDNBW2YBFL</dd><dt>Access</dt><dd>${isDemo ? 'Preview only — not connected' : 'Read-only, authorized Google account'}</dd><dt>Period</dt><dd>${e(state.report.periods.ga.startDate)} → ${e(state.report.periods.ga.endDate)}</dd><dt>Timezone</dt><dd>API property timezone; periods selected in Asia/Muscat</dd></dl><a class="external-link" href="https://analytics.google.com/analytics/web/#/a377276860p515896463/admin/events" target="_blank" rel="noopener noreferrer">Open Google Analytics ↗</a>`)}${panel('Google Search Console','Organic search visibility',`<dl class="source-details"><dt>Property</dt><dd>https://hisanali.com/</dd><dt>Search type</dt><dd>Web · final data</dd><dt>Access</dt><dd>${isDemo ? 'Preview only — not connected' : 'Read-only, authorized Google account'}</dd><dt>Period</dt><dd>${e(state.report.periods.search.startDate)} → ${e(state.report.periods.search.endDate)}</dd><dt>Timezone</dt><dd>Search Console reports use Pacific Time</dd></dl><a class="external-link" href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fhisanali.com%2F" target="_blank" rel="noopener noreferrer">Open Search Console ↗</a>`)}</div>${panel('Reporting coverage','Every report has its own status; missing data is never shown as zero.',`<div class="coverage-grid">${Object.entries(state.report.datasets).map(([id,data]) => `<div><b>${e(id)}</b><span class="${data.status === 'ok' ? 'good-text' : 'error-text'}">${isDemo ? 'Sample data' : data.status === 'ok' ? data.rows.length ? 'Available' : 'No rows returned' : e(data.error)}</span>${coverage(id)}</div>`).join('')}</div>`)}${panel('Metric definitions','How to read the dashboard',`<dl class="definitions"><dt>Active visitors</dt><dd>Distinct active users in the full date range. Daily or category user counts are not added together.</dd><dt>Contact actions</dt><dd>Event counts for lead_whatsapp, lead_email, lead_phone and lead_form. These measure intent, not verified sales or unique enquiries.</dd><dt>Engagement rate</dt><dd>Engaged sessions divided by sessions, as reported by Google Analytics.</dd><dt>Search CTR & position</dt><dd>Read from the aggregate Search Console report. They are not averages of the displayed query rows.</dd><dt>Previous period</dt><dd>The immediately preceding equal-length date range, using each source’s reporting dates.</dd><dt>Data freshness</dt><dd>GA4 ends yesterday; Search Console ends three days ago. A fresh API retrieval can still contain delayed source data. Historical reports refresh every five minutes while open. Live activity refreshes every 30 seconds and covers the last 30 minutes.</dd><dt>Privacy & tracking</dt><dd>Only aggregate analytics are displayed. No visitor identities, message content, or new tracking scripts are added by this dashboard.</dd></dl><a class="secondary" href="/admin/">${isDemo ? 'Set up Google connection' : 'Admin home'}</a>${isDemo ? '' : '<a class="external-link" href="/admin/login/">Reconnect Google ↗</a>'}`)}`;
  }
  function render() {
    const [title, description] = views[state.view];
    $('#view-title').textContent = title; $('#view-description').textContent = description; $('#breadcrumb').textContent = title;
    document.querySelectorAll('#nav button').forEach(button => { if (button.dataset.view === state.view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
    ['#period','#country','#device','#compare'].forEach(selector => $(selector).disabled = state.view === 'live');
    if (!state.report) return;
    state.exporting = [];
    const failures = Object.values(state.view === 'live' ? state.live?.datasets || {} : state.report.datasets).filter(data => data.status === 'error').length;
    $('#content').innerHTML = (failures ? `<div class="note warning" role="status">${failures} report${failures > 1 ? 's are' : ' is'} unavailable. Other reports remain usable. <button data-view="sources" class="text-button">View source status →</button></div>` : '') + ({overview,live,traffic,leads,seo,pages,sources}[state.view])();
    $('#content').setAttribute('aria-busy','false');
    const p = state.report.periods.ga;
    $('#freshness').textContent = `${state.report.mode === 'demo' ? 'Sample data' : 'Retrieved'} · ${new Date(state.report.generatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · Traffic ${humanDate(p.startDate)}–${humanDate(p.endDate)} · Search ends ${humanDate(state.report.periods.search.endDate)}`;
  }
  async function loadLive() {
    if (state.liveBusy || document.hidden) return;
    state.liveBusy = true;
    try {
      const response = await fetch('/admin/realtime/' + (document.body.dataset.mode === 'demo' ? '?demo=1' : ''), {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Realtime is temporarily unavailable.');
      state.live = data; state.liveError = '';
    } catch (error) {
      state.liveError = error.message;
      state.live = null;
    } finally {
      state.liveBusy = false;
      if (['overview','live'].includes(state.view) && !document.activeElement?.matches('input,select')) render();
    }
  }
  async function load() {
    state.controller?.abort(); state.controller = new AbortController(); const sequence = ++state.request;
    state.busy = true; state.report = null; $('#export').disabled = true; $('#refresh').disabled = true;
    $('#content').setAttribute('aria-busy','true'); $('#content').innerHTML = '<div class="loading"><span class="loader"></span>Loading reports from Google…</div>';
    const params = new URLSearchParams({ days: $('#period').value, country: $('#country').value, device: $('#device').value });
    if (document.body.dataset.mode === 'demo') params.set('demo','1');
    try {
      const response = await fetch('/admin/data/?' + params, { signal: state.controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load reports.');
      if (sequence !== state.request) return;
      state.report = data; render();
    } catch (error) {
      if (error.name === 'AbortError') return;
      $('#content').innerHTML = `<div class="empty-state error"><b>Could not load analytics</b><span>${e(error.message)}</span><a class="secondary" href="/admin/">Return to sign in</a><button class="text-button" id="retry">Try again</button></div>`;
      $('#content').setAttribute('aria-busy','false');
    } finally { if (sequence === state.request) { state.busy = false; $('#refresh').disabled = false; $('#export').disabled = !state.report; } }
  }
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) { state.view = nav.dataset.view; if (state.view === 'live' && !state.live) loadLive(); render(); $('#main').scrollIntoView({ block:'start', behavior:'instant' }); }
    const sort = event.target.closest('[data-sort]');
    if (sort) { const old = state.tables[sort.dataset.table] || {query:'',sort:'',desc:true}; state.tables[sort.dataset.table] = {...old,sort:sort.dataset.sort,desc:old.sort === sort.dataset.sort ? !old.desc : true}; render(); }
    if (event.target.closest('#retry')) load();
  });
  document.addEventListener('input', event => {
    if (!event.target.dataset.search) return;
    const id = event.target.dataset.search, query = event.target.value, position = event.target.selectionStart;
    state.tables[id] = { ...(state.tables[id] || {sort:'',desc:true}), query }; render();
    const input = document.querySelector(`[data-search="${id}"]`); input.focus(); try { input.setSelectionRange(position,position); } catch {}
  });
  ['#period','#country','#device'].forEach(selector => $(selector).addEventListener('change',load));
  $('#compare').addEventListener('change',event => { state.compare = event.target.checked; render(); });
  $('#refresh').addEventListener('click',()=>{loadLive(); if(state.view !== 'live') load();});
  $('#export').addEventListener('click',() => {
    if (!state.report || state.busy) return;
    const rows = state.exporting.map(row => ({ mode:state.report.mode, retrievedAt:state.view === 'live' ? state.live?.generatedAt || '' : state.report.generatedAt, country:state.view === 'live' ? 'All' : $('#country').value || 'All', device:state.view === 'live' ? 'All' : $('#device').value || 'All', realtimeWindow:state.view === 'live' ? 'Last 30 minutes' : '', gaStart:state.report.periods.ga.startDate, gaEnd:state.report.periods.ga.endDate, searchStart:state.report.periods.search.startDate, searchEnd:state.report.periods.search.endDate, ...row }));
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const cell = value => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"','""') + '"'; };
    const csv = '\uFEFF' + [keys.map(cell).join(','),...rows.map(row => keys.map(key => cell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = `hisanali-${state.view}-${state.report.mode}-${state.report.periods.ga.endDate}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  load(); loadLive();
  setInterval(loadLive,30000);
  setInterval(()=>{if(!document.hidden && !state.busy && state.view !== 'live') load();},300000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) loadLive();});
})();
