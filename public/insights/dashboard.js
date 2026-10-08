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
    live: ['Live activity', 'Who is on your website right now. Refreshes automatically every 30 seconds.', 'Realtime · last 30 minutes'],
    traffic: ['Traffic & audience', 'Explore how visitors find you and where they come from.', 'Acquisition'],
    leads: ['Leads & actions', 'Follow the contact actions that move a visitor toward a conversation.', 'Conversion'],
    seo: ['Search performance', 'See the searches and pages building your visibility on Google.', 'Google Search Console'],
    pages: ['Pages & content', 'Find the content people read, land on, and take action from.', 'Content'],
    sources: ['Sources & settings', 'Connection status, reporting coverage, and the meaning behind each metric.', 'Configuration'],
  };
  const eventMeta = { lead_whatsapp: ['whatsapp', 'mint'], lead_email: ['mail', 'sky'], lead_phone: ['phone', 'peach'], lead_form: ['form', 'lilac'], cta_contact: ['cursor', 'lime'], file_download: ['download', 'pink'] };
  const state = { view: 'overview', days: 28, report: null, live: null, liveBusy: false, liveError: '', compare: true, request: 0, controller: null, tables: {}, exporting: [], busy: false, charts: {}, animate: true };

  const shortNames = { overview: 'Overview', live: 'Live', traffic: 'Traffic', leads: 'Leads', seo: 'Search', pages: 'Pages', sources: 'Settings' };
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
    const preference = state.tables[id] || { query: '', sort: columns.find(c => c.format)?.key || columns[0].key, desc: true };
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
      return `<article class="event ${contactNames.includes(key) ? 'is-contact' : ''}"><span class="event-icon tone-${tone}">${icon(glyph)}</span><span class="event-copy"><span>${label}</span><small>${key}</small></span><span class="event-count"><b>${number(count)}</b>${delta(count, prev, number, false, false)}</span></article>`;
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

  function overview() {
    const daily = rows('daily');
    return `${hero()}<div class="metrics">${metric({ label: 'Active visitors', value: summary('summary','activeUsers'), previous: summary('previous','activeUsers'), help: 'Distinct active GA4 users across the full period. Daily user counts are not added together.', series: daily.map(row => row.activeUsers), tone: 'sky', glyph: 'users' })}${metric({ label: 'Sessions', value: summary('summary','sessions'), previous: summary('previous','sessions'), help: 'Visits reported by GA4 for the selected period and filters.', series: daily.map(row => row.sessions), tone: 'mint', glyph: 'session' })}${metric({ label: 'Contact actions', value: totalContacts(), previous: totalContacts('eventsPrevious'), help: 'WhatsApp + email + phone + form events. Repeated actions count; these are not unique or qualified leads.', series: rows('leadDaily').map(row => row.eventCount), tone: 'peach', glyph: 'leads' })}${metric({ label: 'Search clicks', value: summary('searchSummary','clicks'), previous: summary('searchPrevious','clicks'), help: 'Search Console web-search clicks. Reporting dates end three days ago.', series: rows('searchDaily').map(row => row.clicks), tone: 'pink', glyph: 'seo' })}</div>
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
    return `<div class="minute-chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Active users by minute, from 29 minutes ago to the current minute">${Array.from({length:30},(_,i)=>{ const ago = 29 - i, row = minuteRows.find(row => Number(row.minutesAgo) === ago), value = row?.activeUsers, bh = value ? Math.max(6, Number(value) / max * (base - 8)) : 4; return `<rect class="bar ${value ? '' : 'empty'}" x="${(i * slot + 3).toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${(slot - 6).toFixed(1)}" height="${bh.toFixed(1)}" rx="4"><title>${ago === 0 ? 'This minute' : ago + ' min ago'}: ${value == null ? 'no row returned' : number(value) + ' active users'}</title></rect>${[29,20,10,0].includes(ago) ? `<text x="${(i * slot + slot / 2).toFixed(1)}" y="${h - 4}" text-anchor="middle">${ago === 0 ? 'Now' : '-' + ago + 'm'}</text>` : ''}`; }).join('')}</svg></div><p class="chart-note">Unique users in each minute. The same visitor may appear in several minutes. Empty minutes have no returned row.</p>`;
  }
  function live() {
    const leadData = dataset('liveEvents'), contactCount = leadData?.status === 'ok' ? rows('liveEvents').filter(row => contactNames.includes(row.eventName)).reduce((sum,row) => sum + Number(row.eventCount), 0) : null;
    return `<div class="live-hero"><div class="live-count"><span class="hero-live-top"><span class="pulse"></span>Active right now</span><strong>${number(summary('realtime','activeUsers'))}</strong><small>${liveStatus()}</small></div>${panel('Activity by minute','Active users · latest 30 minutes',minuteChart(),'',tag('Realtime'))}</div>
    <div class="metrics">${metric({ label: 'Active visitors', value: summary('realtime','activeUsers'), help: 'Distinct active users across the last 30 minutes.', tone: 'mint', glyph: 'users' })}${metric({ label: 'Page views', value: summary('realtime','screenPageViews'), tone: 'sky', glyph: 'eye' })}${metric({ label: 'All events', value: summary('realtime','eventCount'), tone: 'lilac', glyph: 'zap' })}${metric({ label: 'Contact actions', value: contactCount, help: 'Recent WhatsApp, email, phone and form events. Repeated actions count.', tone: 'peach', glyph: 'leads' })}</div>
    <div class="note">${icon('info')}<span>Realtime always covers <b>all visitors</b> in the last 30 minutes. Date, country and device filters apply to historical views only. Google's realtime data typically arrives within a few minutes.</span></div>
    <div class="grid grid-2">${table('livePages','Pages being viewed','Page titles reported in the last 30 minutes',[col('unifiedScreenName','Page title'),col('screenPageViews','Views',number),col('activeUsers','Users',number)])}${table('liveEvents','Recent events','Event totals, including your lead tracking',[col('eventName','Event'),col('eventCount','Events',number)])}${panel('Live countries','Distinct active users by country',bars('liveCountries','country','activeUsers'))}${panel('Live devices','Distinct active users by device',donut('liveDevices','deviceCategory','activeUsers','visitors'))}</div>${table('liveCities','Live locations','Approximate city-level reporting from Google',[col('city','City'),col('country','Country'),col('activeUsers','Users',number)])}`;
  }
  function traffic() {
    const sessionCount = summary('summary','sessions'), duration = summary('summary','userEngagementDuration'), daily = rows('daily');
    return `<div class="metrics">${metric({ label: 'Sessions', value: sessionCount, previous: summary('previous','sessions'), series: daily.map(row => row.sessions), tone: 'mint', glyph: 'session' })}${metric({ label: 'New users', value: summary('summary','newUsers'), previous: summary('previous','newUsers'), tone: 'sky', glyph: 'userPlus' })}${metric({ label: 'Engagement rate', value: summary('summary','engagementRate'), previous: summary('previous','engagementRate'), format: pct, help: 'Engaged sessions divided by sessions.', tone: 'lime', glyph: 'target' })}${metric({ label: 'Engagement / session', value: sessionCount ? duration / sessionCount : null, format: seconds, help: 'Total user engagement duration divided by sessions.', tone: 'lilac', glyph: 'session', id: 'eps' })}</div>
    ${panel('Sessions over time','Daily visits with the previous period aligned by day',lineChart('daily','sessions','dailyPrevious','Sessions',1200),'',tag('GA4'))}
    <div class="grid grid-2">${panel('Countries','Sessions by country',bars('countries','country'))}${panel('Devices','Sessions by device',donut('devices','deviceCategory'))}</div>
    <div class="grid grid-2">${table('sources','Sources & media','Session acquisition, not first-user attribution',[col('sessionSourceMedium','Source / medium'),col('sessions','Sessions',number),col('activeUsers','Users',number),col('engagementRate','Engaged',pct)])}${table('campaigns','Campaigns','Campaign labels reported by GA4',[col('sessionCampaignName','Campaign'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}${table('cities','Cities','Location inferred by Google',[col('city','City'),col('country','Country'),col('sessions','Sessions',number)])}${table('browsers','Browsers','Technology used by your visitors',[col('browser','Browser'),col('sessions','Sessions',number),col('engagementRate','Engaged',pct)])}</div>`;
  }
  function leads() {
    return `<div class="note">${icon('info')}<span><b>Contact actions, not unique leads.</b> Repeat clicks are counted. Downloads and contact CTA clicks are tracked separately. New events may take about 24 hours to appear.</span></div>${eventCards()}
    ${panel('Contact activity over time','WhatsApp, email, phone and form actions',lineChart('leadDaily','eventCount',null,'Contact actions',1200),'',tag('GA4'))}
    ${table('events','All tracked actions','Compare event volume with the number of people triggering each event',[col('eventName','Action'),col('eventCount','Events',number),col('totalUsers','Users',number)],{note:'Users can overlap between actions. '})}
    <div class="grid grid-2">${table('leadPages','Where contact actions happen','Page path when the contact event fired',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}${table('leadSources','Sources behind contact actions','Session acquisition associated with the event',[col('sessionSourceMedium','Source / medium'),col('eventName','Action'),col('eventCount','Events',number)])}</div>
    <div class="note subtle">${icon('info')}<span>The lead_location parameter needs a registered GA4 custom dimension before it can be reported by location. This dashboard does not change your tracking configuration.</span></div>`;
  }
  function seo() {
    const p = state.report.periods.search;
    const cols = [col('clicks','Clicks',number),col('impressions','Impressions',number),col('ctr','CTR',pct),col('position','Position',decimal)];
    return `<div class="note">${icon('calendar')}<span><b>${humanDate(p.startDate)} – ${humanDate(p.endDate)}.</b> Uses final web-search data and ends three days ago. Hidden queries and API limits mean table rows may not sum to totals.</span></div>
    <div class="metrics">${metric({ label: 'Search clicks', value: summary('searchSummary','clicks'), previous: summary('searchPrevious','clicks'), series: rows('searchDaily').map(row => row.clicks), tone: 'pink', glyph: 'cursor' })}${metric({ label: 'Impressions', value: summary('searchSummary','impressions'), previous: summary('searchPrevious','impressions'), series: rows('searchDaily').map(row => row.impressions), tone: 'sky', glyph: 'eye' })}${metric({ label: 'Click-through rate', value: summary('searchSummary','ctr'), previous: summary('searchPrevious','ctr'), format: pct, help: 'Search clicks divided by impressions, from the aggregate Search Console report.', tone: 'lime', glyph: 'percent' })}${metric({ label: 'Average position', value: summary('searchSummary','position'), previous: summary('searchPrevious','position'), format: decimal, help: 'Average position reported by Search Console. A lower value is better.', inverse: true, tone: 'lilac', glyph: 'rank' })}</div>
    ${panel('Search clicks over time','Google web search',lineChart('searchDaily','clicks',null,'Search clicks',1200),'',tag('Search Console'))}
    ${table('queries','Search queries','What people searched before seeing your website',[col('query','Search query'),...cols])}${table('searchPages','Pages in Google Search','Search performance for canonical URLs',[col('page','Page'),...cols])}
    <div class="grid grid-2">${table('searchCountries','Search by country','Google country codes',[col('country','Country'),...cols])}${table('searchDevices','Search by device','Device used for the search',[col('device','Device'),...cols])}</div>`;
  }
  function pages() {
    const content = rows('pages').map(row => ({ ...row, engagementPerUser: row.activeUsers ? Number(row.userEngagementDuration) / Number(row.activeUsers) : null }));
    return `${table('pages','Content performance','Page-level activity from Google Analytics',[col('pagePath','Page'),col('screenPageViews','Views',number),col('activeUsers','Active users',number),col('engagementPerUser','Engagement / user',seconds)],{ rows:content, note:'Engagement duration ÷ active users; users may visit multiple pages. ' })}${table('landing','Landing pages','The first page in a session',[col('landingPage','Landing page'),col('sessions','Sessions',number),col('engagementRate','Engagement rate',pct),col('bounceRate','Bounce rate',pct)])}${table('leadPages','Pages generating contact actions','WhatsApp, email, phone and form events only',[col('pagePath','Page'),col('eventName','Action'),col('eventCount','Events',number)])}`;
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
    content.innerHTML = (failures ? `<div class="note warning" role="status">${icon('alert')}<span>${failures} report${failures > 1 ? 's are' : ' is'} unavailable. Other reports remain usable. <button data-view="sources" class="text-btn">View source status ${icon('arrow')}</button></span></div>` : '') + ({overview,live,traffic,leads,seo,pages,sources}[state.view])();
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
      if (['overview','live'].includes(state.view) && !document.activeElement?.matches('input,select')) render();
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
    const period = event.target.closest('[data-days]');
    if (period && Number(period.dataset.days) !== state.days) { state.days = Number(period.dataset.days); $('#period').value = String(state.days); render(); load(); }
  });
  $('#period-group').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const options = [7, 28, 90], next = options[(options.indexOf(state.days) + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
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
