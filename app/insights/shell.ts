function escape(value: string) { return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!)); }
const svg = (path: string, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 18l-6-6 6-6"/>', out: '<path d="M7 17 17 7M8 7h9v9"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', device: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
};
const google = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function login(options: { ready: boolean; preview: boolean; error?: string }) {
  return `<main class="login" id="main">
  <section class="login-art" aria-hidden="true">
    <div class="art-glow"></div>
    <a class="login-logo" href="/" tabindex="-1"><span class="mark">h.</span><span>Hisan Ali<small>Portfolio admin</small></span></a>
    <div class="art-copy"><span class="pill">${svg(icons.sparkle)}Private analytics workspace</span><p class="art-title">Your growth,<br><em>in focus.</em></p><p>Traffic, enquiries and search visibility for hisanali.com — gathered into one calm, private place.</p></div>
    <svg class="art-chart" viewBox="0 0 600 220" preserveAspectRatio="none"><defs><linearGradient id="art-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfff63" stop-opacity=".35"/><stop offset="1" stop-color="#dfff63" stop-opacity="0"/></linearGradient></defs><path d="M0 180 C60 170 90 120 150 130 S250 160 300 110 S400 60 450 80 S540 40 600 20 V220 H0Z" fill="url(#art-fill)"/><path class="art-line" d="M0 180 C60 170 90 120 150 130 S250 160 300 110 S400 60 450 80 S540 40 600 20" fill="none" stroke="#dfff63" stroke-width="3" stroke-linecap="round"/><path d="M0 200 C80 195 120 170 190 175 S300 190 360 160 S470 130 600 110" fill="none" stroke="#9dd4ff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="6 8"/></svg>
    <ul class="art-tags"><li><i class="dot c-sky"></i>Traffic</li><li><i class="dot c-peach"></i>Leads</li><li><i class="dot c-pink"></i>Search</li><li><i class="dot c-mint"></i>Realtime</li></ul>
  </section>
  <section class="login-panel">
    <div class="login-card">
      <span class="mark mark-lg" aria-hidden="true">h.</span>
      <p class="eyebrow">Welcome back</p>
      <h1>Sign in to your dashboard</h1>
      <p class="lead">Only the verified owner account can open these reports.</p>
      ${options.error ? `<div class="alert" role="alert">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}<span>${escape(options.error)}</span></div>` : ''}
      ${options.ready
        ? `<a class="btn btn-google" href="/admin/login/">${google}<span>Continue with Google</span>${svg(icons.arrow)}</a>`
        : `<div class="callout">${svg(icons.lock)}<div><b>Google connection needed</b><p>The dashboard is ready. Add the Google OAuth client and session secret to enable private sign-in.</p></div></div>`}
      ${options.preview ? `<a class="btn btn-ghost" href="/admin/?demo=1">${svg(icons.eye)}<span>Explore the local preview</span>${svg(icons.arrow)}</a><p class="fine">The preview uses clearly labelled sample data.</p>` : ''}
      <ul class="trust"><li>${svg(icons.shield)}Owner-only</li><li>${svg(icons.lock)}Encrypted session</li><li>${svg(icons.eye)}Read-only access</li></ul>
    </div>
    <a class="back-site" href="/">${svg(icons.back)}Back to hisanali.com</a>
  </section>
</main>`;
}

function app(options: { mode: 'demo' | 'live' }) {
  const demo = options.mode === 'demo';
  return `<div class="app">
<aside class="sidebar" aria-label="Admin navigation">
  <a class="brand" href="/admin/${demo ? '?demo=1' : ''}"><span class="mark">h.</span><span>Hisan Ali<small>Portfolio analytics</small></span></a>
  <a class="workspace" href="https://hisanali.com/" target="_blank" rel="noopener noreferrer"><span class="favicon"><img src="/favicon.png" alt="" width="20" height="20"></span><span>hisanali.com<small>${demo ? 'Preview workspace' : 'Connected workspace'}</small></span>${svg(icons.out)}</a>
  <p class="nav-label">Reports</p>
  <nav id="nav" aria-label="Analytics views"></nav>
  <div class="side-foot">
    <div class="side-live" id="side-live"><span class="pulse"></span><span><b id="side-live-count">—</b> on site now</span></div>
    <p class="shortcut">Press <kbd>1</kbd>–<kbd>7</kbd> to switch views</p>
  </div>
</aside>
<div class="main-wrap">
  <header class="topbar">
    <a class="brand brand-mobile" href="/admin/${demo ? '?demo=1' : ''}" aria-label="Admin home"><span class="mark">h.</span></a>
    <nav class="crumbs" aria-label="Breadcrumb"><span>Workspace</span>${svg('<path d="m9 6 6 6-6 6"/>')}<b id="breadcrumb">Overview</b></nav>
    <div class="top-actions">
      <button class="live-chip" id="live-chip" data-view="live" title="Visitors in the last 30 minutes"><span class="pulse"></span><b id="live-chip-count">—</b><span class="live-label">live</span></button>
      <span class="mode-chip ${demo ? 'is-demo' : ''}">${demo ? 'Sample data' : `${svg(icons.lock)}Private`}</span>
      <button class="icon-btn" id="theme" aria-label="Toggle dark mode" title="Toggle theme">${svg(icons.moon, 'i i-moon')}${svg(icons.sun, 'i i-sun')}</button>
      <span class="avatar" title="Hisan Ali · Administrator">HA</span>
      ${options.mode === 'live' ? `<form action="/admin/logout/" method="post"><button class="icon-btn" aria-label="Sign out" title="Sign out">${svg(icons.logout)}</button></form>` : ''}
    </div>
  </header>
  ${demo ? `<div class="demo-banner" role="note">${svg(icons.eye)}<span><b>Preview mode.</b> You're exploring sample data — these are not your website's results.</span><a href="/admin/">Connect Google ${svg(icons.arrow)}</a></div>` : ''}
  <main id="main">
    <div class="page-head">
      <div><p class="eyebrow" id="view-eyebrow">Portfolio intelligence</p><h1 id="view-title">Overview</h1><p id="view-description" class="lead">Understand what brings people in, and what turns visits into enquiries.</p></div>
      <div class="page-actions"><button id="refresh" class="btn btn-soft">${svg(icons.refresh)}<span>Refresh</span></button><button id="export" class="btn btn-primary">${svg(icons.download)}<span>Export CSV</span></button></div>
    </div>
    <section class="toolbar" id="toolbar" aria-label="Report filters">
      <div class="segmented" role="radiogroup" aria-label="Reporting period" id="period-group">
        <button role="radio" data-days="7" aria-checked="false">7 days</button><button role="radio" data-days="28" aria-checked="true">28 days</button><button role="radio" data-days="90" aria-checked="false">90 days</button>
      </div>
      <input type="hidden" id="period" value="28">
      <label class="select">${svg(icons.globe)}<span class="sr">Country</span><select id="country"><option value="">All countries</option><option value="OM">Oman</option><option value="AE">United Arab Emirates</option><option value="SA">Saudi Arabia</option><option value="QA">Qatar</option><option value="KW">Kuwait</option><option value="BH">Bahrain</option><option value="IN">India</option></select></label>
      <label class="select">${svg(icons.device)}<span class="sr">Device</span><select id="device"><option value="">All devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option></select></label>
      <button class="text-btn" id="reset" hidden>Clear filters</button>
      <label class="switch"><input type="checkbox" id="compare" checked><span class="track"><span class="thumb"></span></span>Compare with previous period</label>
    </section>
    <div id="content" aria-live="polite" aria-busy="true"></div>
    <footer class="footer"><span id="freshness">Google Analytics 4 + Search Console</span><button class="text-btn" data-view="sources">Sources &amp; metric definitions ${svg(icons.arrow)}</button></footer>
  </main>
</div>
<nav class="tabbar" id="tabbar" aria-label="Analytics views"></nav>
<div class="tooltip" id="tooltip" role="presentation" hidden></div>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</div>`;
}

export function shell(options: { mode: 'demo' | 'live' | 'login'; ready: boolean; preview: boolean; error?: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><title>${options.mode === 'login' ? 'Sign in' : 'Analytics'} · Hisan Ali admin</title><link rel="icon" href="/favicon.png"><link rel="preload" href="/insights/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/insights/dashboard.css"><script src="/insights/theme.js"></script></head>
<body data-mode="${options.mode}"><a class="skip" href="#main">Skip to content</a>${options.mode === 'login' ? login(options) : `${app({ mode: options.mode })}<script src="/insights/dashboard.js" defer></script>`}</body></html>`;
}
