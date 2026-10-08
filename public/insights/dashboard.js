(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const e = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = value => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(Number(value));
  const compact = value => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value) < 10000 ? number(value) : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
  const pct = value => value == null ? '—' : (Number(value) * 100).toFixed(1) + '%';
  const decimal = value => value == null ? '—' : Number(value).toFixed(1);
  const seconds = value => value == null ? '—' : Math.floor(value / 60) + 'm ' + Math.round(value % 60) + 's';
  const share = (value, total) => total ? Math.round(value / total * 100) + '%' : '';
  const dateValue = value => /^\d{8}$/.test(value) ? value.slice(0,4) + '-' + value.slice(4,6) + '-' + value.slice(6,8) : value;
  const humanDate = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(dateValue(value) + 'T12:00:00Z'));
  const contactNames = ['lead_whatsapp', 'lead_email', 'lead_phone', 'lead_form'];
  const eventLabels = { lead_whatsapp: 'WhatsApp clicks', lead_email: 'Email clicks', lead_phone: 'Phone clicks', lead_form: 'Form submissions', cta_contact: 'Contact CTA clicks', file_download: 'File downloads' };
  const paths = {
    overview: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    live: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', traffic: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    leads: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    seo: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', pages: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    sources: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    insights: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    audience: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', language: '<path d="M4 5h9M8.5 3v2M6 5c.5 3.5 3 6.5 6 8M11 5c-.8 4-3.5 7.5-7 9M13 21l4-10 4 10M14.5 17.5h5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>',
    session: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', userPlus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>', rank: '<path d="M8 21V11M16 21V5M12 21v-6M4 21h16"/>',
    whatsapp: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    form: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>', cursor: '<path d="m4 4 7 17 2.5-7.5L21 11z"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', up: '<path d="M7 17 17 7M9 7h8v8"/>', down: '<path d="M7 7l10 10M17 9v8H9"/>', flat: '<path d="M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    device: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>', check: '<path d="m5 12 5 5 9-10"/>', out: '<path d="M7 17 17 7M8 7h9v9"/>', analytics: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  };
  const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  const views = {
    overview: ['Overview', 'Understand what brings people in, and what turns visits into enquiries.', 'Portfolio intelligence'],
    live: ['Live activity', 'Who is on your website right now, and where in the world they are. Refreshes every 30 seconds.', 'Realtime · last 30 minutes'],
    insights: ['Insights', 'Interesting facts, biggest changes and quick wins — worked out from your data.', 'Automatic analysis'],
    audience: ['Audience & map', 'Where your visitors are, who they are, and when they arrive.', 'Audience'],
    traffic: ['Traffic & audience', 'Explore how visitors find you and where they come from.', 'Acquisition'],
    leads: ['Leads & actions', 'Follow the contact actions that move a visitor toward a conversation.', 'Conversion'],
    seo: ['Search performance', 'See the searches and pages building your visibility on Google.', 'Google Search Console'],
    pages: ['Pages & content', 'Find the content people read, land on, and take action from.', 'Content'],
    sources: ['Sources & settings', 'Connection status, reporting coverage, and the meaning behind each metric.', 'Configuration'],
  };
  const eventMeta = { lead_whatsapp: ['whatsapp', 'mint'], lead_email: ['mail', 'sky'], lead_phone: ['phone', 'peach'], lead_form: ['form', 'lilac'], cta_contact: ['cursor', 'lime'], file_download: ['download', 'pink'] };
  const state = { view: 'overview', days: 28, report: null, live: null, liveBusy: false, liveError: '', compare: true, request: 0, controller: null, tables: {}, exporting: [], busy: false, charts: {}, animate: true };

  const shortNames = { overview: 'Overview', live: 'Live', insights: 'Insights', audience: 'Audience', traffic: 'Traffic', leads: 'Leads', seo: 'Search', pages: 'Pages', sources: 'Settings' };
  function navMarkup(short = false) {
    return Object.entries(views).map(([key, value], i) => `<button data-view="${key}" class="nav-item" aria-label="${e(value[0])}" title="${e(value[0])} (${i + 1})" ${key === state.view ? 'aria-current="page"' : ''}>${icon(key)}<span>${short ? shortNames[key] : value[0]}</span>${badge(key)}<span class="nav-key" aria-hidden="true">${i + 1}</span></button>`).join('');
  }
  function badge(key) {
    if (key === 'live' && summary('realtime', 'activeUsers') != null && state.live) return `<span class="nav-badge is-live">${compact(summary('realtime','activeUsers'))}</span>`;
    if (key === 'leads' && state.report && totalContacts() != null) return `<span class="nav-badge">${compact(totalContacts())}</span>`;
    return '';
  }
  function renderNav() { $('#nav').innerHTML = navMarkup(); $('#tabbar').innerHTML = navMarkup(true); }

  function dataset(id) { return id === 'realtime' || id.startsWith('live') ? state.live?.datasets[id] : state.report?.datasets[id]; }
  function rows(id) { return dataset(id)?.status === 'ok' ? dataset(id).rows : []; }
  function summary(id, field) { const data = dataset(id); return data?.status === 'ok' ? data.rows[0]?.[field] == null && ['ctr','position','engagementRate'].includes(field) ? null : Number(data.rows[0]?.[field] ?? 0) : null; }
  function totalContacts(id = 'events') { return dataset(id)?.status === 'ok' ? rows(id).filter(row => contactNames.includes(row.eventName)).reduce((sum, row) => sum + Number(row.eventCount), 0) : null; }
  function errorFor(id) { const data = dataset(id); return data?.status === 'error' ? `<div class="empty-state error">${icon('alert')}<b>Report unavailable</b><span>${e(data.error)}</span></div>` : ''; }
  function coverage(id) { const data = dataset(id); return `${data?.limited ? '<span class="coverage">Top rows only</span>' : ''}${data?.thresholded ? '<span class="coverage">Google data limits apply</span>' : ''}`; }
  function coverageBlock(id) { const tags = coverage(id); return tags ? `<div class="coverage-tags">${tags}</div>` : ''; }
  const empty = (text = 'No data was returned for this period.') => `<div class="empty-state">${icon('analytics')}<span>${e(text)}</span></div>`;

  function change(current, previous, format, inverse) {
    if (!state.compare || current == null || previous == null) return null;
    if (previous === 0) return { cls: 'neutral', text: current === 0 ? 'No change' : 'New', dir: 'flat' };
    const difference = current - previous;
    const text = format === pct ? (Math.abs(difference) * 100).toFixed(1) + ' pp' : (Math.abs(difference / previous) * 100).toFixed(1) + '%';
    return { cls: (inverse ? difference < 0 : difference > 0) ? 'positive' : difference === 0 ? 'neutral' : 'negative', text, dir: difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat' };
  }
  function delta(current, previous, format, inverse, caption = true) {
    const c = change(current, previous, format, inverse);
    if (!c) return '';
    return `<span class="delta ${c.cls}">${icon(c.dir)}${c.text}</span>${caption ? `<span class="caption">vs previous ${state.days} days</span>` : ''}`;
  }
  function spark(values, id) {
    const clean = values.map(Number).filter(Number.isFinite);
    if (clean.length < 2) return '';
    const max = Math.max(1, ...clean), min = Math.min(0, ...clean), w = 200, h = 52;
    const pts = clean.map((value, i) => [i / (clean.length - 1) * w, h - 4 - (value - min) / (max - min || 1) * (h - 14)]);
    const line = smooth(pts, 4, h);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sp-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${line} L${w},${h} L0,${h} Z" fill="url(#sp-${id})"/><path d="${line}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>`;
  }
  // Catmull-Rom curve through the points, with control points clamped inside the plot.
  function smooth(points, top, bottom) {
    if (points.length < 3) return 'M' + points.map(p => p.join(',')).join(' L');
    const clamp = v => Math.min(bottom, Math.max(top, v));
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, clamp(p1[1] + (p2[1] - p0[1]) / 6)], c2 = [p2[0] - (p3[0] - p1[0]) / 6, clamp(p2[1] - (p3[1] - p1[1]) / 6)];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function metric({ label, value, previous = null, format = number, help = '', series = [], inverse = false, tone = 'sky', glyph = 'users', id = label }) {
    state.exporting.push({ section: 'Key metrics', metric: label, current: value ?? '', previous: state.compare ? previous ?? '' : '' });
    const key = String(id).replace(/\W+/g, '-');
    return `<article class="metric"><div class="metric-top"><span class="metric-icon tone-${tone}">${icon(glyph)}</span>${e(label)}${help ? `<span class="info" title="${e(help)}" aria-label="${e(help)}" tabindex="0" role="note">i</span>` : ''}</div><div class="metric-value">${format(value)}</div><div class="metric-foot">${delta(value, previous, format, inverse)}</div>${spark(series, key)}</article>`;
  }
  function panel(title, subtitle, body, cls = '', controls = '') {
    return `<section class="panel ${cls}"><div class="panel-head"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${controls}</div>${body}</section>`;
  }
  const tag = text => `<span class="tag">${e(text)}</span>`;

  function niceStep(value) {
    const raw = Math.max(1, value), power = 10 ** Math.floor(Math.log10(raw)), f = raw / power;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * power;
  }
  function lineChart(id, field, previousId, label = 'Sessions', width = 800) {
    const raw = rows(id), rawPrevious = state.compare && previousId ? rows(previousId) : [];
    if (errorFor(id)) return errorFor(id);
    if (!raw.length) return empty();
    const period = id.startsWith('search') ? state.report.periods.search : state.report.periods.ga;
    const calendar = (source, start) => Array.from({length:state.report.filters.days},(_,i) => { const date = new Date(start+'T00:00:00Z'); date.setUTCDate(date.getUTCDate()+i); const key=date.toISOString().slice(0,10); return source.find(row => dateValue(row.date) === key) || {date:key,[field]:null}; });
    const data = calendar(raw,period.startDate), previous = rawPrevious.length ? calendar(rawPrevious,period.previousStart) : [];
    const values = [...data, ...previous].filter(row => row[field] != null).map(row => Number(row[field]));
    const step = niceStep(Math.max(1, ...values) / 4), ceiling = step * 4;
    const height = 250, left = 44, right = 14, top = 14, bottom = 218;
    const x = i => left + i / Math.max(1, data.length - 1) * (width - left - right), y = value => bottom - Number(value) / ceiling * (bottom - top);
    const segments = source => { const groups=[]; let group=[]; source.forEach((row,i) => { if(row[field] == null) { if(group.length) groups.push(group); group=[]; } else group.push([x(i),y(row[field])]); }); if(group.length) groups.push(group); return groups; };
    const line = source => segments(source).map(group => smooth(group, top, bottom)).join(' ');
    const area = segments(data).map(group => smooth(group, top, bottom) + ` L${group[group.length-1][0]},${bottom} L${group[0][0]},${bottom} Z`).join(' ');
    state.exporting.push(...data.map(row => ({ section: label + ' trend', ...row })));
    if (previous.length) state.exporting.push(...previous.map(row => ({ section: label + ' previous trend', ...row })));
    state.charts[id] = { label, points: data.map((row, i) => ({ x: x(i), y: row[field] == null ? null : y(row[field]), date: row.date, value: row[field], prev: previous[i]?.[field] ?? null, prevDate: previous[i]?.date })) };
    const ticks = [...new Set([0, Math.round((data.length-1)/4), Math.round((data.length-1)/2), Math.round((data.length-1)*3/4), data.length-1])];
    return `<div class="legend"><span><i></i>${e(label)}</span>${previous.length ? '<span><i class="prev"></i>Previous period</span>' : ''}${data.some(row=>row[field]==null) ? '<span>Gaps mean no row was returned</span>' : ''}</div>
    <div class="chart" data-chart="${e(id)}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(label)} by day. Hover or focus a point for its exact value.">
      <defs><linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1"><stop class="area-stop" offset="0" stop-opacity=".28"/><stop class="area-stop" offset="1" stop-opacity="0"/></linearGradient></defs>
      ${[0,1,2,3,4].map(i => `<line class="gridline" x1="${left}" x2="${width - right}" y1="${y(step*i)}" y2="${y(step*i)}"/><text x="${left - 10}" y="${y(step*i)+4}" text-anchor="end">${compact(step*i)}</text>`).join('')}
      <path class="area" d="${area}" fill="url(#fill-${id})"/>
      ${previous.length ? `<path class="line-prev" d="${line(previous)}"/>` : ''}
      <path class="line" d="${line(data)}"/>
      <line class="guide" x1="0" x2="0" y1="${top}" y2="${bottom}"/><circle class="focus-dot" r="6" cx="-20" cy="-20"/>
      ${ticks.map(i => `<text x="${x(i)}" y="${height - 6}" text-anchor="${i === 0 ? 'start' : i === data.length-1 ? 'end' : 'middle'}">${e(humanDate(data[i].date))}</text>`).join('')}
      <rect class="hit" x="${left}" y="0" width="${width - left - right}" height="${bottom}"/>
      ${data.map((row,i) => row[field] == null ? '' : `<circle class="pt" cx="${x(i)}" cy="${y(row[field])}" r="5" tabindex="0" data-index="${i}" aria-label="${e(humanDate(row.date))}: ${number(row[field])} ${e(label)}"><title>${e(humanDate(row.date))}: ${number(row[field])} ${e(label)}</title></circle>`).join('')}
    </svg></div>`;
  }
  function bars(id, field, metricField = 'sessions', limit = 6) {
    if (errorFor(id)) return errorFor(id);
    const all = rows(id), total = all.reduce((sum, row) => sum + Number(row[metricField] || 0), 0);
    const data = all.slice().sort((a,b) => b[metricField] - a[metricField]).slice(0, limit);
    if (!data.length) return empty('No matching activity yet.');
    const max = Math.max(1, ...data.map(row => Number(row[metricField])));
    state.exporting.push(...data.map(row => ({ section: id, ...row })));
    return `<div class="bars">${data.map(row => `<div class="bar-row"><div class="bar-copy"><span class="name" title="${e(row[field])}">${e(row[field] || '(not set)')}</span><b>${number(row[metricField])}</b><small>${share(Number(row[metricField]), total)}</small></div><div class="bar-track" role="img" aria-label="${e(row[field])}: ${number(row[metricField])}"><div class="bar-fill" data-w="${(Number(row[metricField]) / max * 100).toFixed(1)}"></div></div></div>`).join('')}</div>${coverageBlock(id)}`;
  }
  function donut(id, field, metricField = 'sessions', unit = 'sessions') {
    if (errorFor(id)) return errorFor(id);
    const data = rows(id).slice().sort((a,b) => b[metricField] - a[metricField]).slice(0, 5);
    if (!data.length) return empty('No matching activity yet.');
    const total = data.reduce((sum, row) => sum + Number(row[metricField] || 0), 0), r = 60, c = 2 * Math.PI * r;
    state.exporting.push(...data.map(row => ({ section: id, ...row })));
    let offset = 0;
    const segs = data.map((row, i) => { const len = total ? Number(row[metricField]) / total * c : 0, gap = data.length > 1 ? Math.min(3, len / 2) : 0; const s = `<circle class="seg seg-${i}" cx="75" cy="75" r="${r}" stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${c.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"><title>${e(row[field])}: ${number(row[metricField])}</title></circle>`; offset += len; return s; }).join('');
    return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 150 150" role="img" aria-label="${e(unit)} split by ${e(field)}"><circle class="track-ring" cx="75" cy="75" r="${r}"/>${segs}</svg><div class="donut-center"><b>${compact(total)}</b><small>${e(unit)}</small></div></div><ul class="donut-legend">${data.map((row, i) => `<li><i class="dot seg-${i}"></i><span title="${e(row[field])}">${e(row[field] || '(not set)')}</span><b>${number(row[metricField])}</b><small>${share(Number(row[metricField]), total)}</small></li>`).join('')}</ul></div>${coverageBlock(id)}`;
  }
  const col = (key, label, format = null) => ({ key, label, format });
  function cell(row, c, barMax, barKey) {
    const value = row[c.key];
    if (c.format) {
      const text = c.format(value);
      return c.key === barKey && barMax ? `<span class="cell-bar">${text}<i data-w="${(Number(value || 0) / barMax * 100).toFixed(1)}"></i></span>` : text;
    }
    if (c.key === 'eventName') { const meta = eventMeta[value]; return eventLabels[value] ? `<span class="event-pill"><i class="dot c-${meta[1]}"></i>${e(eventLabels[value])}</span>` : e(value || '(not set)'); }
    if (/^(pagePath|landingPage|page)$/.test(c.key) && value) { const m = String(value).match(/^(https?:\/\/[^/]+)(.*)$/); return m ? `<span class="path"><span class="host">${e(m[1].replace(/^https?:\/\//, ''))}</span>${e(m[2] || '/')}</span>` : `<span class="path">${e(value)}</span>`; }
    return e(value || '(not set)');
  }
  function table(id, title, subtitle, columns, options = {}) {
    const preference = state.tables[id] || { query: '', sort: options.sort || columns.find(c => c.format)?.key || columns[0].key, desc: true };
    let data = (options.rows || rows(id)).filter(row => columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(preference.query.toLowerCase())));
    data = data.slice().sort((a,b) => (typeof a[preference.sort] === 'number' ? Number(a[preference.sort] || 0) - Number(b[preference.sort] || 0) : String(a[preference.sort] || '').localeCompare(String(b[preference.sort] || ''))) * (preference.desc ? -1 : 1));
    state.exporting.push(...data.map(row => ({ section: title, ...row })));
    const barKey = columns.find(c => c.format === number)?.key, barMax = barKey ? Math.max(0, ...data.map(row => Number(row[barKey] || 0))) : 0;
    const body = errorFor(id) || `<div class="table-scroll"><table><thead><tr>${columns.map(c => `<th scope="col" aria-sort="${preference.sort === c.key ? preference.desc ? 'descending' : 'ascending' : 'none'}"><button data-sort="${e(c.key)}" data-table="${id}">${e(c.label)}<span class="sort" aria-hidden="true">${preference.sort === c.key ? preference.desc ? '▼' : '▲' : '▲▼'}</span></button></th>`).join('')}</tr></thead><tbody>${data.slice(0,100).map(row => `<tr>${columns.map(c => `<td ${c.format ? 'class="numeric"' : ''} title="${e(eventLabels[row[c.key]] || row[c.key])}">${cell(row, c, barMax, barKey)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}" class="no-results">No matching rows. Try another search, filter or period.</td></tr>`}</tbody></table></div><div class="table-foot"><span>${data.length > 100 ? 'Showing 100 of ' : ''}${number(data.length)} rows${data.length > 100 ? ' · CSV includes all matching rows' : ''}</span><span>${options.note || ''}${coverage(id)}</span></div>`;
    return panel(title, subtitle, body, options.className || '', `<label class="search">${icon('search')}<input type="search" aria-label="Search ${e(title)}" placeholder="Search" data-search="${id}" value="${e(preference.query)}"></label>`);
  }
  function eventCards() {
    return `<div class="events">${Object.entries(eventLabels).map(([key,label]) => {
      const data = dataset('events'), row = rows('events').find(row => row.eventName === key), prevRow = rows('eventsPrevious').find(row => row.eventName === key);
      const count = data?.status === 'ok' ? row ? Number(row.eventCount) : 0 : null, prev = dataset('eventsPrevious')?.status === 'ok' ? prevRow ? Number(prevRow.eventCount) : 0 : null;
      state.exporting.push({ section: 'Tracked actions', eventName: key, eventCount: count ?? '' });
      const [glyph, tone] = eventMeta[key];
      return `<article class="event ${contactNames.includes(key) ? 'is-contact' : ''}"><span class="event-icon tone-${tone}">${icon(glyph)}</span><span class="event-copy"><span>${label}</span><small>${key}</small></span><span class="event-count"><b>${number(count)}</b>${delta(count, prev, number, false, false)}${todayCount(key) ? `<span class="today-badge">+${number(todayCount(key))} today</span>` : ''}</span></article>`;
    }).join('')}</div>`;
  }
  function miniBars() {
    const minuteRows = rows('liveMinutes'), max = Math.max(1, ...minuteRows.map(row => Number(row.activeUsers)));
    return `<svg class="mini-bars" viewBox="0 0 300 38" preserveAspectRatio="none" aria-hidden="true">${Array.from({length:30},(_,i)=>{ const ago = 29 - i, value = Number(minuteRows.find(row => Number(row.minutesAgo) === ago)?.activeUsers || 0), h = value ? Math.max(4, value / max * 38) : 3; return `<rect class="${value ? '' : 'empty'}" x="${i * 10 + 1}" y="${38 - h}" width="7" height="${h}" rx="2"/>`; }).join('')}</svg>`;
  }
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function hero() {
    const sessions = summary('summary','sessions'), c = change(sessions, summary('previous','sessions'), number), contacts = totalContacts();
    const top = rows('channels').slice().sort((a,b) => b.sessions - a.sessions)[0];
    const p = state.report.periods.ga;
    let story = sessions == null ? 'Your traffic report is unavailable right now.' : `<em>${number(sessions)} visits</em> in the last ${state.days} days${c && c.dir !== 'flat' && c.text !== 'New' ? `, ${c.dir === 'up' ? 'up' : 'down'} ${c.text} on the period before` : ''}.`;
    if (contacts != null) story += ` ${contacts ? `<em>${number(contacts)}</em> contact action${contacts === 1 ? '' : 's'} so far.` : 'No contact actions yet.'}`;
    const live = summary('realtime','activeUsers');
    return `<section class="hero"><div><p class="hero-greet">${greeting()}, Hisan</p><h2>${story}</h2><div class="hero-meta"><span>${icon('calendar')}${humanDate(p.startDate)} – ${humanDate(p.endDate)}</span>${top ? `<span>${icon('traffic')}Top channel · ${e(top.sessionDefaultChannelGroup)}</span>` : ''}${$('#country').value ? `<span>${icon('globe')}${e($('#country').selectedOptions[0].text)}</span>` : ''}${$('#device').value ? `<span>${icon('device')}${e($('#device').selectedOptions[0].text)}</span>` : ''}</div></div>
      <button class="hero-live" data-view="live"><span class="hero-live-top"><span class="pulse"></span>Right now</span><span><strong>${number(live)}</strong><small>${state.liveError ? e(state.liveError) : state.live ? 'active visitors · last 30 min' : 'Connecting to realtime…'}</small></span>${state.live ? miniBars() : ''}<span class="text-btn">Open live view ${icon('arrow')}</span></button></section>`;
  }

  // ───────── Comparisons ─────────
  function previousMap(id, key, metricField) {
    if (dataset(id)?.status !== 'ok') return null;
    const map = new Map(); rows(id).forEach(row => map.set(row[key], (map.get(row[key]) || 0) + Number(row[metricField] || 0))); return map;
  }
  // Adds `change` (ratio vs previous period; Infinity when new) to each row.
  function withChange(list, previousId, key, metricField) {
    const before = previousMap(previousId, key, metricField);
    return list.map(row => { const now = Number(row[metricField] || 0), prev = before ? before.get(row[key]) ?? 0 : null; return { ...row, change: prev == null ? null : prev ? (now - prev) / prev : now ? Infinity : 0 }; });
  }
  const changeCell = value => value == null ? '—' : value === Infinity ? '<span class="delta neutral">New</span>' : `<span class="delta ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}">${icon(value > 0 ? 'up' : value < 0 ? 'down' : 'flat')}${Math.abs(value * 100) >= 999 ? '999+' : Math.abs(value * 100).toFixed(0)}%</span>`;
  changeCell.isChange = true;
  const flag = code => /^[A-Z]{2}$/.test(code || '') ? String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0))) : '';
  const domain = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url || '(direct)'; } };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hourLabel = hour => { const h = Number(hour); return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); };
  const titleCase = text => String(text || '').replace(/\b\w/g, c => c.toUpperCase());

  // ───────── World map ─────────
  const cityKey = (name, country) => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + '|' + country;
  function ensureWorld() {
    if (state.world) return;
    state.world = 'loading';
    fetch('/insights/world.json').then(response => response.ok ? response.json() : Promise.reject()).then(world => {
      // One shared sprite keeps each rendered map tiny: maps reference outlines with <use>.
      const sprite = document.createElement('div');
      sprite.innerHTML = `<svg class="sr" aria-hidden="true" focusable="false"><defs>${world.countries.map(c => `<path id="geo-${c.id}" d="${c.d}"/>`).join('')}</defs></svg>`;
      document.body.appendChild(sprite.firstChild);
      world.byId = Object.fromEntries([...world.countries.map(c => [c.id, c]), ...Object.entries(world.dots).map(([id, dot]) => [id, { id, ...dot, dot: true }])]);
      state.world = world; render();
    }).catch(() => { state.world = { error: true }; render(); });
  }
  function worldMap({ countries = [], cities = [], live = [], unit = 'sessions', liveUnit = 'active now' }) {
    ensureWorld();
    const world = state.world;
    if (!world || world === 'loading') return `<div class="map-wrap"><div class="skeleton map-skeleton"></div></div>`;
    if (world.error) return empty('The map could not be loaded.');
    const total = countries.reduce((sum, c) => sum + c.value, 0), max = Math.max(1, ...countries.map(c => c.value));
    const values = new Map(countries.map(c => [c.id, c]));
    const level = value => value > 0 ? 1 + Math.floor(Math.sqrt(value / max) * 4.999) : 0;
    const tip = (name, value, unitLabel, all) => `data-tip="${e(name)}" data-tip-sub="${value == null ? 'No visits in this period' : `${number(value)} ${e(unitLabel)}${all ? ' · ' + share(value, all) : ''}`}"`;
    const land = world.countries.map(c => { const v = values.get(c.id); return `<use href="#geo-${c.id}" class="geo l${level(v?.value || 0)}" ${tip(v?.name || c.n, v?.value ?? null, unit, total)}/>`; }).join('');
    const smallStates = countries.filter(c => world.byId[c.id]?.dot).map(c => { const p = world.byId[c.id].c; return `<circle class="state-dot l${level(c.value)}" cx="${p[0]}" cy="${p[1]}" r="4.5" ${tip(c.name, c.value, unit, total)}/>`; }).join('');
    const position = place => world.cities[cityKey(place.name, place.id)] || world.byId[place.id]?.c;
    const placed = (list, cls) => { const top = Math.max(1, ...list.map(p => p.value)); return list.map(place => { const p = position(place); if (!p) return ''; const r = (cls === 'live' ? 4 : 2.5) + Math.sqrt(place.value / top) * (cls === 'live' ? 9 : 7); return `<g class="pin ${cls}" ${tip(`${flag(place.id)} ${place.name}${place.country ? ', ' + place.country : ''}`, place.value, cls === 'live' ? liveUnit : unit)}>${cls === 'live' ? `<circle class="ping" cx="${p[0]}" cy="${p[1]}" r="${r.toFixed(1)}"/>` : ''}<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="${r.toFixed(1)}"/></g>`; }).join(''); };
    return `<div class="map-wrap"><svg class="map" viewBox="0 0 ${world.width} ${world.height}" role="img" aria-label="World map of visitors by country${live.length ? ', with live visitors marked' : ''}">${land}${smallStates}${placed(cities.filter(c => c.name && c.name !== '(not set)').slice(0, 40), 'city')}${placed(live.filter(c => c.name && c.name !== '(not set)'), 'live')}</svg>
      <div class="map-legend"><span>Fewer</span><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><i class="l5"></i><span>More ${e(unit)}</span>${cities.length ? `<span class="legend-pin"><i class="city"></i>Top cities</span>` : ''}${live.length ? `<span class="legend-pin"><i class="live"></i>Live visitors</span>` : ''}</div></div>`;
  }
  const countryList = () => rows('countries').filter(row => row.countryId && row.countryId !== '(not set)').map(row => ({ id: row.countryId, name: row.country, value: Number(row.sessions) }));
  const cityList = () => rows('cities').map(row => ({ id: row.countryId, name: row.city, country: row.country, value: Number(row.sessions) })).sort((a, b) => b.value - a.value);
  const liveCityList = () => rows('liveCities').map(row => ({ id: row.countryId, name: row.city, country: row.country, value: Number(row.activeUsers) }));
  function topCountries(limit = 8) {
    const list = withChange(rows('countries'), 'countriesPrevious', 'country', 'sessions').sort((a, b) => b.sessions - a.sessions), total = list.reduce((sum, row) => sum + Number(row.sessions), 0);
    if (!list.length) return errorFor('countries') || empty('No country data yet.');
    return `<ol class="rank-list">${list.slice(0, limit).map((row, i) => `<li><span class="rank-n">${i + 1}</span><span class="flag">${flag(row.countryId)}</span><span class="name">${e(row.country)}</span><b>${number(row.sessions)}</b><small>${share(Number(row.sessions), total)}</small>${state.compare ? changeCell(row.change) : ''}</li>`).join('')}</ol><p class="list-foot">${number(list.length)} countr${list.length === 1 ? 'y' : 'ies'} reached this period</p>`;
  }

  // ───────── Heatmap ─────────
  function heatmap() {
    if (errorFor('hourly')) return errorFor('hourly');
    const data = rows('hourly'); if (!data.length) return empty();
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    data.forEach(row => { grid[Number(row.dayOfWeek)][Number(row.hour)] += Number(row.sessions); });
    const max = Math.max(1, ...grid.flat());
    state.exporting.push(...data.map(row => ({ section: 'Sessions by day and hour', ...row })));
    return `<div class="heatmap-scroll"><div class="heatmap" role="img" aria-label="Sessions by weekday and hour of day">${[0,1,2,3,4,5,6].map(day => `<span class="hm-day">${dayNames[day].slice(0, 3)}</span>${grid[day].map((value, hour) => `<span class="hm-cell h${value ? 1 + Math.floor(value / max * 4.999) : 0}" data-tip="${dayNames[day]} · ${hourLabel(hour)}" data-tip-sub="${number(value)} sessions"></span>`).join('')}`).join('')}<span></span>${Array.from({ length: 24 }, (_, hour) => `<span class="hm-hour">${hour % 3 === 0 ? hourLabel(hour).replace(' ', '') : ''}</span>`).join('')}</div></div><div class="map-legend hm-legend"><span>Quiet</span><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><i class="h5"></i><span>Busy · property time zone</span></div>`;
  }

  // ───────── Insights ─────────
  const aiSources = /chatgpt|openai|perplexity|gemini|bard|copilot|claude|anthropic|poe\.com|you\.com/i;
  function facts() {
    const list = [], add = (tone, glyph, label, value, text) => { if (value != null && value !== '—') list.push({ tone, glyph, label, value, text }); };
    const daily = rows('daily');
    if (daily.length) { const best = daily.reduce((a, b) => Number(b.sessions) > Number(a.sessions) ? b : a); add('lime', 'zap', 'Best day', humanDate(best.date), `${number(best.sessions)} sessions — your busiest day in this period.`); }
    const hourly = rows('hourly');
    if (hourly.length) {
      const byDay = Array(7).fill(0), byHour = Array(24).fill(0); hourly.forEach(row => { byDay[Number(row.dayOfWeek)] += Number(row.sessions); byHour[Number(row.hour)] += Number(row.sessions); });
      const day = byDay.indexOf(Math.max(...byDay)), hour = byHour.indexOf(Math.max(...byHour)), quiet = byDay.indexOf(Math.min(...byDay));
      add('sky', 'calendar', 'Busiest time', `${dayNames[day].slice(0, 3)} · ${hourLabel(hour)}`, `${dayNames[day]}s get the most visits and ${hourLabel(hour)} is the peak hour. ${dayNames[quiet]} is the quietest day — a good time to post fresh content is just before the peak.`);
    }
    const countries = rows('countries').slice().sort((a, b) => b.sessions - a.sessions), countryTotal = countries.reduce((s, r) => s + Number(r.sessions), 0);
    if (countries.length) add('mint', 'globe', 'Top country', `${flag(countries[0].countryId)} ${share(Number(countries[0].sessions), countryTotal)}`, `${countries[0].country} brings ${share(Number(countries[0].sessions), countryTotal)} of sessions. You reached ${number(countries.length)} countr${countries.length === 1 ? 'y' : 'ies'} in total.`);
    const cities = rows('cities').slice().sort((a, b) => b.sessions - a.sessions);
    if (cities[0] && cities[0].city !== '(not set)') add('peach', 'pin', 'Top city', cities[0].city, `${number(cities[0].sessions)} sessions came from ${cities[0].city}, ${cities[0].country}.`);
    const devices = rows('devices'), deviceTotal = devices.reduce((s, r) => s + Number(r.sessions), 0), mobile = devices.find(r => r.deviceCategory === 'mobile');
    if (deviceTotal) add('pink', 'device', 'Mobile visitors', share(Number(mobile?.sessions || 0), deviceTotal), Number(mobile?.sessions || 0) / deviceTotal > .5 ? 'Most people browse on a phone — check every page on mobile first.' : 'Desktop still leads, so detailed content and long pages work well.');
    const nr = rows('newReturning'), nrTotal = nr.reduce((s, r) => s + Number(r.activeUsers), 0), returning = nr.find(r => r.newVsReturning === 'returning');
    if (nrTotal) add('lilac', 'refresh', 'Returning visitors', share(Number(returning?.activeUsers || 0), nrTotal), `${number(returning?.activeUsers || 0)} people came back more than once${returning?.engagementRate != null ? `, with a ${pct(returning.engagementRate)} engagement rate` : ''}.`);
    const languages = rows('languages').slice().sort((a, b) => b.activeUsers - a.activeUsers);
    if (languages.length > 1) add('sky', 'language', 'Languages', number(languages.length), `${languages[0].language} leads, followed by ${languages.slice(1, 3).map(l => l.language).join(' and ')}.`);
    const sessions = summary('summary', 'sessions'), contacts = totalContacts();
    if (sessions && contacts != null) add('peach', 'target', 'Conversion rate', pct(contacts / sessions), `${number(contacts)} contact actions from ${number(sessions)} sessions — about 1 in every ${contacts ? Math.round(sessions / contacts) : '—'} visits.`);
    const leadPages = rows('leadPages'), byPage = {}; leadPages.forEach(r => { byPage[r.pagePath] = (byPage[r.pagePath] || 0) + Number(r.eventCount); });
    const topLead = Object.entries(byPage).sort((a, b) => b[1] - a[1])[0];
    if (topLead) add('mint', 'leads', 'Best converting page', topLead[0], `${number(topLead[1])} contact actions started here.`);
    const pages = rows('pages').filter(r => Number(r.screenPageViews) >= 20).map(r => ({ ...r, per: Number(r.userEngagementDuration) / Math.max(1, Number(r.activeUsers)) })).sort((a, b) => b.per - a.per);
    if (pages[0]) add('lime', 'session', 'Most engaging page', pages[0].pagePath, `Readers spend ${seconds(pages[0].per)} on average here.`);
    const growing = withChange(rows('pages'), 'pagesPrevious', 'pagePath', 'screenPageViews').filter(r => r.change != null && r.change !== Infinity && Number(r.screenPageViews) >= 20).sort((a, b) => b.change - a.change)[0];
    if (growing && growing.change > 0) add('pink', 'traffic', 'Fastest growing page', growing.pagePath, `Views up ${(growing.change * 100).toFixed(0)}% on the previous period.`);
    const sourcesList = rows('sources'), ai = sourcesList.filter(r => aiSources.test(r.sessionSourceMedium)), aiTotal = ai.reduce((s, r) => s + Number(r.sessions), 0);
    add('lilac', 'sparkle', 'AI assistant referrals', number(aiTotal), aiTotal ? `Visitors arrived from ${[...new Set(ai.map(r => domain('https://' + String(r.sessionSourceMedium).split(' / ')[0])))].slice(0, 3).join(', ')} — AI tools are recommending your site.` : 'No visits from ChatGPT, Perplexity, Gemini or Copilot yet in this period.');
    const referrers = rows('referrers').filter(r => r.pageReferrer && !/hisanali\.com/.test(r.pageReferrer)).sort((a, b) => b.screenPageViews - a.screenPageViews);
    if (referrers[0]) add('sky', 'out', 'Top referring site', domain(referrers[0].pageReferrer), `${number(referrers[0].activeUsers)} people followed a link from ${domain(referrers[0].pageReferrer)}.`);
    const queries = rows('queries').slice().sort((a, b) => b.clicks - a.clicks);
    if (queries[0]) add('pink', 'seo', 'Top Google search', `“${queries[0].query}”`, `${number(queries[0].clicks)} clicks at an average position of ${decimal(queries[0].position)}.`);
    const position = summary('searchSummary', 'position'), prevPosition = summary('searchPrevious', 'position');
    if (position != null && prevPosition != null && position !== prevPosition) add(position < prevPosition ? 'mint' : 'peach', 'rank', 'Google ranking', `${decimal(position)}`, `Average position ${position < prevPosition ? 'improved' : 'slipped'} from ${decimal(prevPosition)} — ${position < prevPosition ? 'your pages are climbing' : 'worth reviewing your top pages'}.`);
    const ages = rows('ageGroups').filter(r => r.userAgeBracket !== 'unknown').sort((a, b) => b.activeUsers - a.activeUsers);
    if (ages[0]) add('peach', 'users', 'Main age group', ages[0].userAgeBracket, `The largest share of identified visitors is aged ${ages[0].userAgeBracket}.`);
    const duration = summary('summary', 'averageSessionDuration'), perSession = summary('summary', 'screenPageViewsPerSession');
    if (duration != null && perSession != null) add('mint', 'pages', 'Visit depth', `${decimal(perSession)} pages`, `An average visit lasts ${seconds(duration)} and covers ${decimal(perSession)} pages.`);
    state.exporting.push(...list.map(f => ({ section: 'Insights', fact: f.label, value: String(f.value), detail: f.text })));
    return list;
  }
  const factCard = f => `<article class="fact"><span class="metric-icon tone-${f.tone}">${icon(f.glyph)}</span><p class="fact-label">${e(f.label)}</p><p class="fact-value" title="${e(f.value)}">${e(f.value)}</p><p class="fact-text">${e(f.text)}</p></article>`;
  function movers() {
    const groups = [['Channel', 'channels', 'channelsPrevious', 'sessionDefaultChannelGroup', 'sessions', 'sessions'], ['Source', 'sources', 'sourcesPrevious', 'sessionSourceMedium', 'sessions', 'sessions'], ['Country', 'countries', 'countriesPrevious', 'country', 'sessions', 'sessions'], ['Page', 'pages', 'pagesPrevious', 'pagePath', 'screenPageViews', 'views'], ['Search', 'queries', 'queriesPrevious', 'query', 'clicks', 'clicks']];
    const all = [];
    groups.forEach(([kind, id, prevId, key, metricField, unit]) => {
      const now = previousMap(id, key, metricField), before = previousMap(prevId, key, metricField);
      if (!now || !before) return;
      new Set([...now.keys(), ...before.keys()]).forEach(name => { const a = now.get(name) || 0, b = before.get(name) || 0; if (a !== b) all.push({ kind, name, now: a, before: b, diff: a - b, unit }); });
    });
    const rising = all.filter(m => m.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 7), falling = all.filter(m => m.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 7);
    state.exporting.push(...[...rising, ...falling].map(m => ({ section: 'What changed', type: m.kind, name: m.name, current: m.now, previous: m.before, difference: m.diff })));
    const item = m => `<li><span class="kind">${m.kind}</span><span class="name" title="${e(m.name)}">${e(m.name)}</span><span class="move ${m.diff > 0 ? 'up' : 'down'}">${m.diff > 0 ? '+' : '−'}${number(Math.abs(m.diff))}<small>${e(m.unit)}</small></span><small class="was">${number(m.before)} → ${number(m.now)}</small></li>`;
    if (!all.length) return empty('Not enough history to compare yet.');
    return `<div class="movers"><div><h3 class="movers-title up">${icon('up')}Rising</h3>${rising.length ? `<ul>${rising.map(item).join('')}</ul>` : '<p class="muted">Nothing grew this period.</p>'}</div><div><h3 class="movers-title down">${icon('down')}Falling</h3>${falling.length ? `<ul>${falling.map(item).join('')}</ul>` : '<p class="muted">Nothing declined — nice.</p>'}</div></div>`;
  }
  // Typical organic CTR by position; used only to estimate missed clicks.
  const expectedCtr = position => position <= 1.5 ? .28 : position <= 2.5 ? .16 : position <= 3.5 ? .11 : position <= 5 ? .07 : position <= 10 ? .03 : position <= 20 ? .012 : .005;
  function opportunities(id, key) {
    const list = rows(id).filter(r => Number(r.position) >= 3.5 && Number(r.position) <= 25 && Number(r.impressions) >= 10).map(r => {
      const position = Number(r.position), target = position > 10 ? 8 : Math.max(1, position - 3), gain = Math.max(0, Math.round(Number(r.impressions) * expectedCtr(target) - Number(r.clicks)));
      const lowCtr = Number(r.ctr) < expectedCtr(position) * .6;
      const action = position > 10 ? 'On page 2 — strengthen content and internal links to reach page 1' : lowCtr ? 'Ranks well but few click — rewrite the title and meta description' : 'Close to the top — add depth, FAQs and fresh examples';
      return { ...r, gain, action };
    }).filter(r => r.gain > 0).sort((a, b) => b.gain - a.gain);
    return list;
  }

  // ───────── Tracking health ─────────
  const todayCount = name => dataset('eventsToday')?.status === 'ok' ? Number(rows('eventsToday').find(r => r.eventName === name)?.eventCount || 0) : null;
  function trackingHealth() {
    const lastSeen = {}; rows('eventsLastSeen').forEach(r => { if (Number(r.eventCount) > 0 && (!lastSeen[r.eventName] || r.date > lastSeen[r.eventName])) lastSeen[r.eventName] = r.date; });
    const liveOk = dataset('liveEvents')?.status === 'ok', yearOk = dataset('eventsLastSeen')?.status === 'ok';
    const daysAgo = date => Math.round((Date.now() - new Date(dateValue(date) + 'T12:00:00Z')) / 864e5);
    const items = Object.entries(eventLabels).map(([name, label]) => {
      const today = todayCount(name), recent = liveOk ? Number(rows('liveEvents').find(r => r.eventName === name)?.eventCount || 0) : null, seen = lastSeen[name];
      const status = recent || today ? ['ok', 'Receiving now'] : seen && daysAgo(seen) <= 7 ? ['ok', 'Working'] : seen ? ['warn', `Quiet for ${daysAgo(seen)} days`] : yearOk ? ['err', 'Never received'] : ['idle', 'Unknown'];
      return { name, label, today, recent, seen, status };
    });
    state.exporting.push(...items.map(i => ({ section: 'Tracking health', eventName: i.name, today: i.today ?? '', last30Minutes: i.recent ?? '', lastSeen: i.seen ? dateValue(i.seen) : 'never', status: i.status[1] })));
    const missing = items.filter(i => contactNames.includes(i.name) && i.status[0] === 'err');
    const help = missing.length ? `<div class="callout fix">${icon('alert')}<div><b>${missing.map(i => i.name).join(', ')} ${missing.length === 1 ? 'has' : 'have'} never reached Google Analytics in the last 12 months.</b><p>Your website already sends these events to Google Tag Manager when someone clicks. If a click you just made does not appear under “Last 30 min” within a few minutes, Tag Manager is not forwarding them to GA4. Fix it once in <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer">Tag Manager</a>:</p><ol><li><b>Triggers → New → Custom Event</b>, event name <code>^(lead_whatsapp|lead_email|lead_phone|lead_form|cta_contact)$</code>, tick “Use regex matching”.</li><li><b>Tags → New → Google Analytics: GA4 Event</b>, Measurement ID <code>G-DDNBW2YBFL</code>, event name <code>{{Event}}</code>, add parameter <code>lead_location</code> = a Data Layer Variable named <code>lead_location</code>. Use the trigger above.</li><li>Click <b>Submit → Publish</b>. Then click WhatsApp on your site and watch this panel.</li></ol></div></div>` : '';
    const cell = value => value == null ? '<span class="faint">—</span>' : number(value);
    return `${help}<div class="table-scroll"><table class="health"><thead><tr><th scope="col"><button>Action</button></th><th scope="col"><button>Last 30 min</button></th><th scope="col"><button>Today so far</button></th><th scope="col"><button>Last received</button></th><th scope="col"><button>Status</button></th></tr></thead><tbody>${items.map(i => `<tr><td><span class="event-pill"><i class="dot c-${eventMeta[i.name][1]}"></i>${e(i.label)}</span> <code class="evt">${i.name}</code></td><td class="numeric">${cell(i.recent)}</td><td class="numeric">${cell(i.today)}</td><td class="numeric">${i.seen ? humanDate(i.seen) : yearOk ? 'Never' : '—'}</td><td class="numeric"><span class="status ${i.status[0]}"><i class="dot"></i>${i.status[1]}</span></td></tr>`).join('')}</tbody></table></div><div class="table-foot"><span>Today uses Google's intraday data (can lag a few hours). Last 30 min comes from realtime and is the fastest way to test a click.</span><span>${errorFor('eventsLastSeen') ? 'History unavailable' : ''}</span></div>`;
  }

  // ───────── Views ─────────
  function overview() {
    const daily = rows('daily'), live = liveCityList();
    const topFacts = state.report ? facts().slice(0, 3) : [];
    return `${hero()}<div class="metrics">${metric({ label: 'Active visitors', value: summary('summary','activeUsers'), previous: summary('previous','activeUsers'), help: 'Distinct active GA4 users across the full period. Daily user counts are not added together.', series: daily.map(row => row.activeUsers), tone: 'sky', glyph: 'users' })}${metric({ label: 'Sessions', value: summary('summary','sessions'), previous: summary('previous','sessions'), help: 'Visits reported by GA4 for the selected period and filters.', series: daily.map(row => row.sessions), tone: 'mint', glyph: 'session' })}${metric({ label: 'Contact actions', value: totalContacts(), previous: totalContacts('eventsPrevious'), help: 'WhatsApp + email + phone + form events. Repeated actions count; these are not unique or qualified leads.', series: rows('leadDaily').map(row => row.eventCount), tone: 'peach', glyph: 'leads' })}${metric({ label: 'Search clicks', value: summary('searchSummary','clicks'), previous: summary('searchPrevious','clicks'), help: 'Search Console web-search clicks. Reporting dates end three days ago.', series: rows('searchDaily').map(row => row.clicks), tone: 'pink', glyph: 'seo' })}</div>
    <section class="panel map-panel"><div class="panel-head"><div><h2>Where your visitors are</h2><p>Countries shaded by sessions · pulsing dots are people on the site right now</p></div><button class="text-btn" data-view="audience">Full audience ${icon('arrow')}</button></div><div class="map-layout">${worldMap({ countries: countryList(), live, unit: 'sessions' })}<div class="map-side"><h3>Top countries</h3>${topCountries(7)}</div></div></section>
    ${topFacts.length ? `<div class="section-title"><div><h2>Did you know?</h2><p>Facts worked out from your data this period.</p></div><button class="text-btn" data-view="insights">All insights ${icon('arrow')}</button></div><div class="facts facts-3">${topFacts.map(factCard).join('')}</div>` : ''}
    <div class="grid grid-wide">${panel('Traffic over time', `Daily sessions · ${humanDate(state.report.periods.ga.startDate)} – ${humanDate(state.report.periods.ga.endDate)}`, lineChart('daily','sessions','dailyPrevious'), '', tag('GA4'))}${panel('Traffic sources', 'Sessions by acquisition channel', bars('channels','sessionDefaultChannelGroup'), '', `<button class="text-btn" data-view="traffic">Explore ${icon('arrow')}</button>`)}</div>
    <div class="section-title"><div><h2>From visits to conversations</h2><p>Every tracked action that signals intent.</p></div><button class="text-btn" data-view="leads">Explore lead activity ${icon('arrow')}</button></div>${eventCards()}
    <div class="grid grid-wide">${table('pages','Most viewed pages','Content attracting attention',[col('pagePath','Page'),col('screenPageViews','Views',number),col('activeUsers','Active users',number)])}${panel('Devices', 'How visitors browse', donut('devices','deviceCategory'), '', tag('GA4'))}</div>`;
  }
  function liveStatus() {
    if (state.liveError) return `<span class="error-text">${e(state.liveError)}</span>`;
    if (!state.live) return 'Connecting to realtime reports…';
    return `${state.live.mode === 'demo' ? 'Sample activity' : 'Updated'} ${new Date(state.live.generatedAt).toLocaleTimeString('en-GB')} · refreshes every 30s`;
  }
  function minuteChart() {
    const minuteRows = rows('liveMinutes'), max = Math.max(1, ...minuteRows.map(row => Number(row.activeUsers)));
    if (errorFor('liveMinutes')) return errorFor('liveMinutes');
    if (!minuteRows.length) return empty('No recent activity returned by Google.');
    const w = 800, h = 190, base = 166, slot = w / 30;
    return `<div class="minute-chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Active users by minute, from 29 minutes ago to the current minute">${Array.from({length:30},(_,i)=>{ const ago = 29 - i, row = minuteRows.find(row => Number(row.minutesAgo) === ago), value = row?.activeUsers, bh = value ? Math.max(6, Number(value) / max * (base - 8)) : 4; return `<rect class="bar ${value ? '' : 'empty'}" x="${(i * slot + 3).toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${(slot - 6).toFixed(1)}" height="${bh.toFixed(1)}" rx="4" data-tip="${ago === 0 ? 'This minute' : ago + ' min ago'}" data-tip-sub="${value == null ? 'No row returned' : number(value) + ' active users'}"></rect>${[29,20,10,0].includes(ago) ? `<text x="${(i * slot + slot / 2).toFixed(1)}" y="${h - 4}" text-anchor="middle">${ago === 0 ? 'Now' : '-' + ago + 'm'}</text>` : ''}`; }).join('')}</svg></div><p class="chart-note">Unique users in each minute. The same visitor may appear in several minutes. Empty minutes have no returned row.</p>`;
  }
  function live() {
    const leadData = dataset('liveEvents'), contactCount = leadData?.status === 'ok' ? rows('liveEvents').filter(row => contactNames.includes(row.eventName)).reduce((sum,row) => sum + Number(row.eventCount), 0) : null;
    const liveCountries = rows('liveCountries').map(row => ({ id: row.countryId, name: row.country, value: Number(row.activeUsers) })), liveTotal = liveCountries.reduce((s, c) => s + c.value, 0);
    const side = liveCountries.length ? `<ol class="rank-list">${liveCountries.sort((a, b) => b.value - a.value).map((c, i) => `<li><span class="rank-n">${i + 1}</span><span class="flag">${flag(c.id)}</span><span class="name">${e(c.name)}</span><b>${number(c.value)}</b><small>${share(c.value, liveTotal)}</small></li>`).join('')}</ol>` : errorFor('liveCountries') || empty('Nobody on the site right now.');
    return `<div class="live-hero"><div class="live-count"><span class="hero-live-top"><span class="pulse"></span>Active right now</span><strong>${number(summary('realtime','activeUsers'))}</strong><small>${liveStatus()}</small></div>${panel('Activity by minute','Active users · latest 30 minutes',minuteChart(),'',tag('Realtime'))}</div>
    <section class="panel map-panel"><div class="panel-head"><div><h2>Live world map</h2><p>Each pulse is a city with visitors in the last 30 minutes</p></div>${tag('Realtime')}</div><div class="map-layout">${worldMap({ countries: liveCountries, live: liveCityList(), unit: 'active now' })}<div class="map-side"><h3>Visitors by country</h3>${side}</div></div></section>
    <div class="metrics">${metric({ label: 'Active visitors', value: summary('realtime','activeUsers'), help: 'Distinct active users across the last 30 minutes.', tone: 'mint', glyph: 'users' })}${metric({ label: 'Page views', value: summary('realtime','screenPageViews'), tone: 'sky', glyph: 'eye' })}${metric({ label: 'All events', value: summary('realtime','eventCount'), tone: 'lilac', glyph: 'zap' })}${metric({ label: 'Contact actions', value: contactCount, help: 'Recent WhatsApp, email, phone and form events. Repeated actions count.', tone: 'peach', glyph: 'leads' })}</div>
    <div class="note">${icon('info')}<span>Realtime always covers <b>all visitors</b> in the last 30 minutes. Google never shares who an individual visitor is — locations are approximate, city-level and come from Google. Filters apply to historical views only.</span></div>
    <div class="grid grid-2">${table('livePages','Pages being viewed','Page titles reported in the last 30 minutes',[col('unifiedScreenName','Page title'),col('screenPageViews','Views',number),col('activeUsers','Users',number)])}${table('liveCities','Live locations','Approximate city-level reporting from Google',[col('city','City'),col('country','Country'),col('activeUsers','Users',number)])}${table('liveEvents','Recent events','Event totals, including your lead tracking',[col('eventName','Event'),col('eventCount','Events',number)])}${panel('Live devices','Distinct active users by device',donut('liveDevices','deviceCategory','activeUsers','visitors'))}</div>`;
  }
  function insights() {
    const list = facts(), queryOps = opportunities('queries', 'query');
    return `<div class="note">${icon('sparkle')}<span><b>Worked out automatically</b> from Google Analytics and Search Console for the selected period${$('#country').value || $('#device').value ? ' and filters' : ''}. Compared with the previous ${state.days} days.</span></div>
    ${list.length ? `<div class="facts">${list.map(factCard).join('')}</div>` : empty('Not enough data for insights yet.')}
    ${panel('What changed', `Biggest movers versus the previous ${state.days} days, across channels, sources, countries, pages and searches`, movers(), '', tag('Comparison'))}
    ${queryOps.length ? panel('Quick SEO wins', 'Searches where a small improvement could bring noticeably more clicks', `<ul class="ops">${queryOps.slice(0, 5).map(r => `<li><div><b>“${e(r.query)}”</b><small>Position ${decimal(r.position)} · ${number(r.impressions)} impressions · ${pct(r.ctr)} CTR</small><p>${e(r.action)}</p></div><span class="gain">+${number(r.gain)}<small>clicks / period</small></span></li>`).join('')}</ul><div class="panel-actions"><button class="btn btn-soft" data-view="seo">See all opportunities ${icon('arrow')}</button></div>`) : ''}`;
  }
  function audience() {
    const nr = rows('newReturning'), nrTotal = nr.reduce((s, r) => s + Number(r.activeUsers), 0), returning = nr.find(r => r.newVsReturning === 'returning');
    const languages = rows('languages').slice().sort((a, b) => b.activeUsers - a.activeUsers);
    const demographicsHint = 'Demographics need Google signals: GA4 Admin → Data collection → turn on Google signals. Google also hides small groups to protect privacy.';
    const demo = (id, body) => dataset(id)?.status === 'error' || (dataset(id)?.status === 'ok' && !rows(id).length) ? `<div class="empty-state">${icon('info')}<b>Not available yet</b><span>${e(demographicsHint)}</span></div>` : body;
    const regions = rows('regions');
    return `<div class="metrics">${metric({ label: 'Countries reached', value: rows('countries').length || null, tone: 'mint', glyph: 'globe', previous: dataset('countriesPrevious')?.status === 'ok' ? rows('countriesPrevious').length : null })}${metric({ label: 'Cities', value: rows('cities').filter(r => r.city !== '(not set)').length || null, tone: 'sky', glyph: 'pin', help: 'Cities in the top 250 rows returned by Google.' })}${metric({ label: 'Returning visitors', value: nrTotal ? Number(returning?.activeUsers || 0) / nrTotal : null, format: pct, tone: 'lilac', glyph: 'refresh', help: 'Share of active users who had visited before.' })}${metric({ label: 'New users', value: summary('summary','newUsers'), previous: summary('previous','newUsers'), tone: 'peach', glyph: 'userPlus' })}</div>
    <section class="panel map-panel"><div class="panel-head"><div><h2>Visitors around the world</h2><p>Countries shaded by sessions · dots show the top cities</p></div>${tag('GA4')}</div><div class="map-layout">${worldMap({ countries: countryList(), cities: cityList(), unit: 'sessions' })}<div class="map-side"><h3>Top countries</h3>${topCountries(10)}</div></div></section>
    <div class="grid grid-2">${table('cities','Cities','Approximate location inferred by Google',[col('city','City'),col('country','Country'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)],{ rows: rows('cities').map(r => ({ ...r, city: r.city, country: `${flag(r.countryId)} ${r.country}` })) })}${table('regions','Regions & states','Governorate, emirate or state',[col('region','Region'),col('country','Country'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)],{ rows: regions })}</div>
    ${panel('When visitors arrive', 'Sessions by weekday and hour — use it to time posts, ads and replies', heatmap(), '', tag('GA4'))}
    <div class="grid grid-3">${panel('New vs returning','Active users',donut('newReturning','newVsReturning','activeUsers','users'))}${panel('Devices','Sessions by device',donut('devices','deviceCategory'))}${panel('Gender','Identified active users',demo('genders', donut('genders','userGender','activeUsers','users')))}</div>
    <div class="grid grid-2">${panel('Age groups','Identified active users by age',demo('ageGroups', bars('ageGroups','userAgeBracket','activeUsers',7)))}${panel('Interests','Affinity categories from Google',demo('interests', bars('interests','brandingInterest','activeUsers',8)))}</div>
    <div class="grid grid-2">${panel('Languages', languages.length ? `${number(languages.length)} browser languages` : 'Browser language', bars('languages','language','activeUsers',8))}${panel('Operating systems','Sessions by OS',bars('os','operatingSystem','sessions',7))}</div>
    <div class="grid grid-3">${panel('Browsers','Sessions by browser',bars('browsers','browser','sessions',6))}${panel('Phone brands','Sessions by device brand',bars('brands','mobileDeviceBranding','sessions',6))}${panel('Screen sizes','Most common resolutions',bars('screens','screenResolution','sessions',6))}</div>
    <div class="note subtle">${icon('shield')}<span>Google Analytics never shares names, emails or IP addresses of individual visitors, and collecting them would break Google's terms. Everything here is aggregated; small groups may be hidden by Google.</span></div>`;
  }
  function traffic() {
    const sessionCount = summary('summary','sessions'), daily = rows('daily');
    const channels = withChange(rows('channels'), 'channelsPrevious', 'sessionDefaultChannelGroup', 'sessions');
    const sourcesRows = withChange(rows('sources'), 'sourcesPrevious', 'sessionSourceMedium', 'sessions');
    const referrers = rows('referrers').filter(r => r.pageReferrer && !/^https?:\/\/(www\.)?hisanali\.com/.test(r.pageReferrer)).map(r => ({ ...r, site: domain(r.pageReferrer) }));
    const ch = state.compare ? [col('change','Change',changeCell)] : [];
    return `<div class="metrics">${metric({ label: 'Sessions', value: sessionCount, previous: summary('previous','sessions'), series: daily.map(row => row.sessions), tone: 'mint', glyph: 'session' })}${metric({ label: 'New users', value: summary('summary','newUsers'), previous: summary('previous','newUsers'), tone: 'sky', glyph: 'userPlus' })}${metric({ label: 'Engagement rate', value: summary('summary','engagementRate'), previous: summary('previous','engagementRate'), format: pct, help: 'Engaged sessions divided by sessions.', tone: 'lime', glyph: 'target' })}${metric({ label: 'Avg. session', value: summary('summary','averageSessionDuration'), previous: summary('previous','averageSessionDuration'), format: seconds, help: 'Average session duration reported by GA4.', tone: 'lilac', glyph: 'session', id: 'asd' })}</div>
    <div class="metrics">${metric({ label: 'Pages / session', value: summary('summary','screenPageViewsPerSession'), previous: summary('previous','screenPageViewsPerSession'), format: decimal, tone: 'peach', glyph: 'pages' })}${metric({ label: 'Bounce rate', value: summary('summary','bounceRate'), previous: summary('previous','bounceRate'), format: pct, inverse: true, help: 'Sessions that were not engaged. Lower is better.', tone: 'pink', glyph: 'out' })}${metric({ label: 'Page views', value: summary('summary','screenPageViews'), previous: summary('previous','screenPageViews'), series: daily.map(row => row.screenPageViews), tone: 'sky', glyph: 'eye' })}${metric({ label: 'Engaged sessions', value: summary('summary','engagedSessions'), previous: summary('previous','engagedSessions'), tone: 'mint', glyph: 'check' })}</div>
    ${panel('Sessions over time','Daily visits with the previous period aligned by day',lineChart('daily','sessions','dailyPrevious','Sessions',1200),'',tag('GA4'))}
    <div class="grid grid-wide">${table('channels','Channels','How visitors found you this period',[col('sessionDefaultChannelGroup','Channel'),col('sessions','Sessions',number),...ch,col('engagementRate','Engaged',pct)],{ rows: channels })}${panel('Channel mix','Share of sessions',donut('channels','sessionDefaultChannelGroup'))}</div>
    ${table('journeys','Visitor journeys','Where people came from → the first page they saw',[col('sessionSourceMedium','Came from'),col('landingPage','Landed on'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}
    <div class="grid grid-2">${table('sources','Sources & media','Session acquisition, not first-user attribution',[col('sessionSourceMedium','Source / medium'),col('sessions','Sessions',number),...ch,col('engagementRate','Engaged',pct)],{ rows: sourcesRows })}${table('referrers','Referring websites','External pages that linked people to you',[col('site','Website'),col('activeUsers','People',number),col('screenPageViews','Views',number)],{ rows: referrers })}${table('firstSources','How new people first found you','First-user source — the very first visit',[col('firstUserSourceMedium','First source'),col('newUsers','New users',number),col('activeUsers','Active',number)])}${table('campaigns','Campaigns','Campaign labels reported by GA4',[col('sessionCampaignName','Campaign'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}</div>`;
  }
  function leads() {
    const sessions = summary('summary','sessions'), contacts = totalContacts(), previousSessions = summary('previous','sessions'), previousContacts = totalContacts('eventsPrevious');
    return `<div class="note">${icon('info')}<span><b>Contact actions, not unique leads.</b> Repeat clicks are counted. Downloads and contact CTA clicks are tracked separately. New events may take about 24 hours to appear.</span></div>
    <div class="metrics">${metric({ label: 'Contact actions', value: contacts, previous: previousContacts, series: rows('leadDaily').map(r => r.eventCount), tone: 'peach', glyph: 'leads' })}${metric({ label: 'Conversion rate', value: sessions && contacts != null ? contacts / sessions : null, previous: previousSessions && previousContacts != null ? previousContacts / previousSessions : null, format: pct, help: 'Contact actions divided by sessions.', tone: 'lime', glyph: 'target' })}${metric({ label: 'WhatsApp share', value: contacts ? Number(rows('events').find(r => r.eventName === 'lead_whatsapp')?.eventCount || 0) / contacts : null, format: pct, help: 'WhatsApp clicks as a share of all contact actions.', tone: 'mint', glyph: 'whatsapp' })}${metric({ label: 'Visits per action', value: contacts ? sessions / contacts : null, format: decimal, inverse: true, help: 'Average number of sessions for each contact action. Lower is better.', tone: 'sky', glyph: 'session', id: 'vpa' })}</div>
    ${panel('Tracking health', 'Is every contact button reaching Google? Click one on your site and watch “Last 30 min”.', trackingHealth(), '', `<button class="text-btn" id="health-refresh">${icon('refresh')}Check now</button>`)}
    ${eventCards()}
    ${panel('Contact activity over time','WhatsApp, email, phone and form actions',lineChart('leadDaily','eventCount',null,'Contact actions',1200),'',tag('GA4'))}
    <div class="grid grid-2">${table('leadPages','Where contact actions happen','Page path when the contact event fired',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}${table('leadSources','Sources behind contact actions','Session acquisition associated with the event',[col('sessionSourceMedium','Source / medium'),col('eventName','Action'),col('eventCount','Events',number)])}</div>
    <div class="grid grid-2">${table('events','Tracked actions','Event volume and the number of people triggering each',[col('eventName','Action'),col('eventCount','Events',number),col('totalUsers','Users',number)],{note:'Users can overlap between actions. '})}${table('allEvents','Every event on the site','All GA4 events, including scrolls, clicks and first visits',[col('eventName','Event'),col('eventCount','Events',number),col('totalUsers','Users',number)])}</div>
    <div class="note subtle">${icon('info')}<span>The lead_location parameter needs a registered GA4 custom dimension before it can be reported by location. This dashboard does not change your tracking configuration.</span></div>`;
  }
  function seo() {
    const p = state.report.periods.search;
    const cols = [col('clicks','Clicks',number),col('impressions','Impressions',number),col('ctr','CTR',pct),col('position','Position',decimal)];
    const ch = state.compare ? [col('change','Change',changeCell)] : [];
    const queries = withChange(rows('queries'), 'queriesPrevious', 'query', 'clicks'), pagesRows = withChange(rows('searchPages'), 'searchPagesPrevious', 'page', 'clicks');
    const ops = opportunities('queries', 'query'), pageOps = opportunities('searchPages', 'page');
    const previousQueries = previousMap('queriesPrevious', 'query', 'impressions'), fresh = previousQueries ? rows('queries').filter(r => !previousQueries.has(r.query)) : [];
    return `<div class="note">${icon('calendar')}<span><b>${humanDate(p.startDate)} – ${humanDate(p.endDate)}.</b> Uses final web-search data and ends three days ago. Hidden queries and API limits mean table rows may not sum to totals.</span></div>
    <div class="metrics">${metric({ label: 'Search clicks', value: summary('searchSummary','clicks'), previous: summary('searchPrevious','clicks'), series: rows('searchDaily').map(row => row.clicks), tone: 'pink', glyph: 'cursor' })}${metric({ label: 'Impressions', value: summary('searchSummary','impressions'), previous: summary('searchPrevious','impressions'), series: rows('searchDaily').map(row => row.impressions), tone: 'sky', glyph: 'eye' })}${metric({ label: 'Click-through rate', value: summary('searchSummary','ctr'), previous: summary('searchPrevious','ctr'), format: pct, help: 'Search clicks divided by impressions, from the aggregate Search Console report.', tone: 'lime', glyph: 'percent' })}${metric({ label: 'Average position', value: summary('searchSummary','position'), previous: summary('searchPrevious','position'), format: decimal, help: 'Average position reported by Search Console. A lower value is better.', inverse: true, tone: 'lilac', glyph: 'rank' })}</div>
    ${panel('Search clicks over time','Google web search',lineChart('searchDaily','clicks',null,'Search clicks',1200),'',tag('Search Console'))}
    ${table('opportunities','SEO opportunities','Searches ranking 4–25 with room for more clicks — estimated from typical click-through rates',[col('query','Search query'),col('position','Position',decimal),col('impressions','Impressions',number),col('ctr','CTR',pct),col('gain','Extra clicks',number),col('action','What to do')],{ rows: ops, sort: 'gain', note: 'Estimates only. ' })}
    <div class="grid grid-2">${table('queries','Search queries','What people searched before seeing your website',[col('query','Search query'),...cols.slice(0, 2),...ch,...cols.slice(2)],{ rows: queries })}${table('newQueries','New searches this period','Queries that did not appear in the previous period',[col('query','Search query'),col('impressions','Impressions',number),col('clicks','Clicks',number),col('position','Position',decimal)],{ rows: fresh })}</div>
    ${table('searchPages','Pages in Google Search','Search performance for canonical URLs',[col('page','Page'),...cols.slice(0, 2),...ch,...cols.slice(2)],{ rows: pagesRows })}
    ${pageOps.length ? table('pageOpportunities','Pages to improve','Pages with the biggest estimated gain',[col('page','Page'),col('position','Position',decimal),col('impressions','Impressions',number),col('gain','Extra clicks',number),col('action','What to do')],{ rows: pageOps, sort: 'gain' }) : ''}
    <div class="grid grid-2">${table('searchCountries','Search by country','Google country codes',[col('country','Country'),...cols])}${table('searchDevices','Search by device','Device used for the search',[col('device','Device'),...cols])}</div>`;
  }
  function pages() {
    const content = withChange(rows('pages'), 'pagesPrevious', 'pagePath', 'screenPageViews').map(row => ({ ...row, engagementPerUser: row.activeUsers ? Number(row.userEngagementDuration) / Number(row.activeUsers) : null }));
    const ch = state.compare ? [col('change','Change',changeCell)] : [];
    return `${table('pages','Content performance','Page-level activity from Google Analytics',[col('pagePath','Page'),col('screenPageViews','Views',number),...ch,col('activeUsers','Active users',number),col('engagementPerUser','Engagement / user',seconds)],{ rows:content, note:'Engagement duration ÷ active users; users may visit multiple pages. ' })}${table('landing','Landing pages','The first page in a session',[col('landingPage','Landing page'),col('sessions','Sessions',number),col('engagementRate','Engagement rate',pct),col('bounceRate','Bounce rate',pct)])}${table('leadPages','Pages generating contact actions','WhatsApp, email, phone and form events only',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}`;
  }
  function sources() {
    const isDemo = state.report.mode === 'demo';
    state.exporting.push(...Object.entries(state.report.datasets).map(([report,data])=>({section:'Source status',report,status:isDemo?'sample':data.status,returnedRows:data.rows.length,limited:!!data.limited,error:data.error||''})));
    const status = isDemo ? `<span class="status idle"><i class="dot"></i>Preview only</span>` : `<span class="status ok"><i class="dot"></i>Connected</span>`;
    const source = (name, sub, tone, glyph, details, link, label) => `<section class="panel source-card"><div class="panel-head"><div class="source-title"><span class="source-logo tone-${tone}">${icon(glyph)}</span><div><h2>${name}</h2><p>${sub}</p></div></div>${status}</div><dl class="details">${details.map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl><div class="panel-actions"><a class="btn btn-soft" href="${link}" target="_blank" rel="noopener noreferrer">${label} ${icon('out')}</a></div></section>`;
    const access = isDemo ? 'Preview only — not connected' : 'Read-only, authorized Google account';
    const definitions = [['Active visitors','Distinct active users in the full date range. Daily or category user counts are not added together.'],['Contact actions','Event counts for lead_whatsapp, lead_email, lead_phone and lead_form. These measure intent, not verified sales or unique enquiries.'],['Engagement rate','Engaged sessions divided by sessions, as reported by Google Analytics.'],['Search CTR & position','Read from the aggregate Search Console report. They are not averages of the displayed query rows.'],['Previous period','The immediately preceding equal-length date range, using each source’s reporting dates.'],['Data freshness','GA4 ends yesterday; Search Console ends three days ago. Historical reports refresh every five minutes while open. Live activity refreshes every 30 seconds and covers the last 30 minutes.'],['Privacy & tracking','Only aggregate analytics are displayed. No visitor identities, message content, or new tracking scripts are added by this dashboard.']];
    return `<div class="grid grid-2">${source('Google Analytics 4','Traffic, content and lead activity','sky','analytics',[['Property','hisanali.com · 515896463'],['Measurement ID','G-DDNBW2YBFL'],['Access',access],['Period',`${e(state.report.periods.ga.startDate)} → ${e(state.report.periods.ga.endDate)}`],['Timezone','API property timezone; periods selected in Asia/Muscat']],'https://analytics.google.com/analytics/web/#/a377276860p515896463/admin/events','Open Google Analytics')}${source('Google Search Console','Organic search visibility','pink','seo',[['Property','https://hisanali.com/'],['Search type','Web · final data'],['Access',access],['Period',`${e(state.report.periods.search.startDate)} → ${e(state.report.periods.search.endDate)}`],['Timezone','Search Console reports use Pacific Time']],'https://search.google.com/search-console?resource_id=https%3A%2F%2Fhisanali.com%2F','Open Search Console')}</div>
    ${panel('Reporting coverage','Every report has its own status; missing data is never shown as zero.',`<div class="coverage-grid">${Object.entries(state.report.datasets).map(([id,data]) => `<div class="coverage-item"><i class="dot ${isDemo ? 'demo' : data.status === 'ok' ? 'ok' : 'err'}"></i><div><b>${e(id)}</b><span class="${data.status === 'ok' ? 'good-text' : 'error-text'}" title="${e(data.error || '')}">${isDemo ? 'Sample data' : data.status === 'ok' ? data.rows.length ? `${number(data.rows.length)} rows` : 'No rows returned' : e(data.error)}</span></div>${coverage(id)}</div>`).join('')}</div>`)}
    ${panel('Metric definitions','How to read the dashboard',`<dl class="definitions">${definitions.map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="panel-actions"><a class="btn btn-soft" href="/admin/">${isDemo ? 'Set up Google connection' : 'Admin home'}</a>${isDemo ? '' : `<a class="btn btn-soft" href="/admin/login/">Reconnect Google ${icon('out')}</a>`}</div>`)}`;
  }
  function skeleton() {
    return `<div aria-hidden="true">${state.view === 'overview' ? '<div class="skeleton sk-hero"></div>' : ''}<div class="metrics">${'<div class="skeleton sk-metric"></div>'.repeat(4)}</div><div class="grid grid-wide"><div class="skeleton sk-panel"></div><div class="skeleton sk-panel"></div></div></div><span class="sr">Loading reports from Google…</span>`;
  }
  function hydrate() {
    document.querySelectorAll('#content [data-w]').forEach(el => el.style.setProperty('--w', el.dataset.w + '%'));
  }
  function updateLiveBadges() {
    const value = state.live ? number(summary('realtime','activeUsers')) : '—';
    $('#live-chip-count').textContent = value; $('#side-live-count').textContent = value;
    renderNav();
  }
  function render() {
    const [title, description, eyebrow] = views[state.view];
    $('#view-title').textContent = title; $('#view-description').textContent = description; $('#breadcrumb').textContent = title; $('#view-eyebrow').textContent = eyebrow;
    document.title = `${title} · Hisan Ali admin`;
    renderNav();
    $('#toolbar').classList.toggle('is-disabled', state.view === 'live');
    ['#country','#device','#compare'].forEach(selector => $(selector).disabled = state.view === 'live');
    document.querySelectorAll('#period-group button').forEach(button => { button.disabled = state.view === 'live'; button.setAttribute('aria-checked', String(Number(button.dataset.days) === state.days)); button.tabIndex = Number(button.dataset.days) === state.days ? 0 : -1; });
    $('#country').closest('.select').classList.toggle('is-active', !!$('#country').value);
    $('#device').closest('.select').classList.toggle('is-active', !!$('#device').value);
    $('#reset').hidden = !$('#country').value && !$('#device').value;
    if (!state.report) return;
    state.exporting = []; state.charts = {};
    const failures = Object.values(state.view === 'live' ? state.live?.datasets || {} : state.report.datasets).filter(data => data.status === 'error').length;
    const content = $('#content');
    content.classList.toggle('animate', state.animate);
    content.innerHTML = (failures ? `<div class="note warning" role="status">${icon('alert')}<span>${failures} report${failures > 1 ? 's are' : ' is'} unavailable. Other reports remain usable. <button data-view="sources" class="text-btn">View source status ${icon('arrow')}</button></span></div>` : '') + ({overview,live,insights,audience,traffic,leads,seo,pages,sources}[state.view])();
    content.setAttribute('aria-busy','false');
    hydrate();
    if (state.animate) { state.animate = false; clearTimeout(state.animateTimer); state.animateTimer = setTimeout(() => content.classList.remove('animate'), 1600); }
    const p = state.report.periods.ga;
    $('#freshness').textContent = `${state.report.mode === 'demo' ? 'Sample data' : 'Retrieved'} ${new Date(state.report.generatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · Traffic ${humanDate(p.startDate)}–${humanDate(p.endDate)} · Search ends ${humanDate(state.report.periods.search.endDate)}`;
  }

  // Chart tooltips
  const tooltip = $('#tooltip');
  function showPoint(chartEl, index) {
    const chart = state.charts[chartEl.dataset.chart], point = chart?.points[index];
    if (!point || point.y == null) return hidePoint(chartEl);
    const svg = chartEl.querySelector('svg'), box = svg.getBoundingClientRect(), scale = box.width / svg.viewBox.baseVal.width;
    chartEl.classList.add('is-hover');
    svg.querySelector('.guide').setAttribute('x1', point.x); svg.querySelector('.guide').setAttribute('x2', point.x);
    svg.querySelector('.focus-dot').setAttribute('cx', point.x); svg.querySelector('.focus-dot').setAttribute('cy', point.y);
    tooltip.innerHTML = `<b>${e(humanDate(point.date))}</b><div><span><i></i>${e(chart.label)}</span><strong>${number(point.value)}</strong></div>${state.compare && point.prevDate ? `<div><span><i class="prev"></i>${e(humanDate(point.prevDate))}</span><strong>${number(point.prev)}</strong></div>` : ''}`;
    tooltip.hidden = false;
    const left = Math.min(window.innerWidth - 90, Math.max(90, box.left + point.x * scale));
    tooltip.style.left = left + 'px'; tooltip.style.top = (box.top + point.y * scale) + 'px';
  }
  function hidePoint(chartEl) { chartEl?.classList.remove('is-hover'); tooltip.hidden = true; }
  document.addEventListener('pointermove', event => {
    const tipEl = event.target.closest?.('[data-tip]');
    if (tipEl) {
      tooltip.innerHTML = `<b>${e(tipEl.dataset.tip)}</b>${tipEl.dataset.tipSub ? `<div><span>${e(tipEl.dataset.tipSub)}</span></div>` : ''}`;
      tooltip.hidden = false; tooltip.style.left = Math.min(window.innerWidth - 90, Math.max(90, event.clientX)) + 'px'; tooltip.style.top = event.clientY + 'px';
      return;
    }
    if (!tooltip.hidden && !event.target.closest?.('.chart[data-chart]') && !document.activeElement?.matches('.pt')) tooltip.hidden = true;
    const chartEl = event.target.closest?.('.chart[data-chart]');
    if (!chartEl) { if (!tooltip.hidden && !document.activeElement?.matches('.pt')) { document.querySelectorAll('.chart.is-hover').forEach(hidePoint); } return; }
    const chart = state.charts[chartEl.dataset.chart]; if (!chart) return;
    const svg = chartEl.querySelector('svg'), box = svg.getBoundingClientRect(), x = (event.clientX - box.left) / box.width * svg.viewBox.baseVal.width;
    let best = -1; chart.points.forEach((p, i) => { if (p.y != null && (best < 0 || Math.abs(p.x - x) < Math.abs(chart.points[best].x - x))) best = i; });
    if (best >= 0) showPoint(chartEl, best);
  });
  document.addEventListener('pointerleave', () => document.querySelectorAll('.chart.is-hover').forEach(hidePoint));
  document.addEventListener('focusin', event => { const pt = event.target.closest?.('.pt'); if (pt) showPoint(pt.closest('.chart'), Number(pt.dataset.index)); });
  document.addEventListener('focusout', event => { if (event.target.closest?.('.pt')) hidePoint(event.target.closest('.chart')); });
  window.addEventListener('scroll', () => { if (!tooltip.hidden) document.querySelectorAll('.chart.is-hover').forEach(hidePoint); }, { passive: true });

  function toast(message) {
    const el = $('#toast'); el.innerHTML = icon('check') + `<span>${e(message)}</span>`; el.hidden = false;
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
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
      updateLiveBadges();
      if (['overview','live','leads'].includes(state.view) && !document.activeElement?.matches('input,select')) render();
    }
  }
  // A silent reload keeps the current report on screen until fresh data arrives.
  async function load(silent = false) {
    state.controller?.abort(); state.controller = new AbortController(); const sequence = ++state.request;
    state.busy = true; $('#export').disabled = true; $('#refresh').disabled = true; $('#refresh').classList.add('is-spinning');
    if (!silent || !state.report) { state.report = null; $('#content').setAttribute('aria-busy','true'); $('#content').innerHTML = skeleton(); }
    const params = new URLSearchParams({ days: String(state.days), country: $('#country').value, device: $('#device').value });
    if (document.body.dataset.mode === 'demo') params.set('demo','1');
    try {
      const response = await fetch('/admin/data/?' + params, { signal: state.controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load reports.');
      if (sequence !== state.request) return;
      state.report = data; state.animate = !silent; render();
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (silent && state.report) { toast('Could not refresh — showing the previous retrieval'); return; }
      $('#content').innerHTML = `<div class="panel"><div class="empty-state error">${icon('alert')}<b>Could not load analytics</b><span>${e(error.message)}</span><span class="panel-actions"><button class="btn btn-primary" id="retry">Try again</button><a class="btn btn-soft" href="/admin/">Return to sign in</a></span></div></div>`;
      $('#content').setAttribute('aria-busy','false');
    } finally { if (sequence === state.request) { state.busy = false; $('#refresh').disabled = false; $('#refresh').classList.remove('is-spinning'); $('#export').disabled = !state.report; } }
  }
  function go(view) {
    if (!views[view]) return;
    const changed = view !== state.view;
    state.view = view; if (view === 'live' && !state.live) loadLive();
    state.animate = changed; render();
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) go(nav.dataset.view);
    const sort = event.target.closest('[data-sort]');
    if (sort) { const old = state.tables[sort.dataset.table] || {query:'',sort:'',desc:true}; state.tables[sort.dataset.table] = {...old,sort:sort.dataset.sort,desc:old.sort === sort.dataset.sort ? !old.desc : true}; render(); }
    if (event.target.closest('#retry')) load();
    if (event.target.closest('#health-refresh')) { loadLive(); load(true); toast('Checking tracking — realtime and today refreshed'); }
    const period = event.target.closest('[data-days]');
    if (period && Number(period.dataset.days) !== state.days) { state.days = Number(period.dataset.days); $('#period').value = String(state.days); render(); load(); }
  });
  $('#period-group').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const options = [7, 28, 90, 180, 365], next = options[(options.indexOf(state.days) + (event.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length];
    state.days = next; $('#period').value = String(next); render(); load(); $(`[data-days="${next}"]`).focus();
  });
  document.addEventListener('input', event => {
    if (!event.target.dataset.search) return;
    const id = event.target.dataset.search, query = event.target.value, position = event.target.selectionStart;
    state.tables[id] = { ...(state.tables[id] || {sort:'',desc:true}), query }; render();
    const input = document.querySelector(`[data-search="${id}"]`); input.focus(); try { input.setSelectionRange(position,position); } catch {}
  });
  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.target.matches('input,select,textarea')) return;
    const index = Number(event.key) - 1, keys = Object.keys(views);
    if (index >= 0 && index < keys.length) { event.preventDefault(); go(keys[index]); }
  });
  ['#country','#device'].forEach(selector => $(selector).addEventListener('change', () => { render(); load(); }));
  $('#reset').addEventListener('click', () => { $('#country').value = ''; $('#device').value = ''; render(); load(); });
  $('#compare').addEventListener('change',event => { state.compare = event.target.checked; render(); });
  $('#refresh').addEventListener('click',()=>{loadLive(); if(state.view !== 'live') load(true); else toast('Live activity refreshed');});
  $('#theme').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('admin-theme', document.documentElement.dataset.theme); } catch {}
  });
  $('#export').addEventListener('click',() => {
    if (!state.report || state.busy) return;
    const rows = state.exporting.map(row => ({ mode:state.report.mode, retrievedAt:state.view === 'live' ? state.live?.generatedAt || '' : state.report.generatedAt, country:state.view === 'live' ? 'All' : $('#country').value || 'All', device:state.view === 'live' ? 'All' : $('#device').value || 'All', realtimeWindow:state.view === 'live' ? 'Last 30 minutes' : '', gaStart:state.report.periods.ga.startDate, gaEnd:state.report.periods.ga.endDate, searchStart:state.report.periods.search.startDate, searchEnd:state.report.periods.search.endDate, ...row }));
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const cell = value => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"','""') + '"'; };
    const csv = '﻿' + [keys.map(cell).join(','),...rows.map(row => keys.map(key => cell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = `hisanali-${state.view}-${state.report.mode}-${state.report.periods.ga.endDate}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    toast(`Exported ${number(rows.length)} rows to CSV`);
  });
  render(); load(); loadLive();
  setInterval(loadLive,30000);
  setInterval(()=>{if(!document.hidden && !state.busy && state.view !== 'live') load(true);},300000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) loadLive();});
})();
