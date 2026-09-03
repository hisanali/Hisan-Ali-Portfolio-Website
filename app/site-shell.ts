export const sharedThemeInit = `<script id="theme-init">(()=>{const root=document.documentElement;try{const savedTheme=localStorage.getItem('preferred-theme');const mobileDefault=matchMedia('(max-width: 980px)').matches;const dark=savedTheme?savedTheme==='dark':mobileDefault;const path=location.pathname.replace(/\\/+$/,'');const eligible=path.startsWith('/blog/')&&path!=='/blog';const reading=eligible&&(localStorage.getItem('preferred-reading-mode')==='true'||localStorage.getItem('preferred-palette')==='desert');root.classList.toggle('theme-dark',dark);root.classList.toggle('reading-mode',reading);root.dataset.palette=reading?'desert':'forest';root.style.colorScheme=dark?'dark':'light'}catch(e){const dark=matchMedia('(max-width: 980px)').matches;root.classList.toggle('theme-dark',dark);root.classList.remove('reading-mode');root.dataset.palette='forest';root.style.colorScheme=dark?'dark':'light'}})();</script>`;

const links = [
  ['/work/', 'Work'],
  ['/services/', 'Services'],
  ['/blog/', 'Insights'],
  ['/about/', 'About'],
  ['/lab/', 'Lab'],
  ['/contact/', 'Contact']
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href.slice(0, -1) || pathname.startsWith(href);
}

export function sharedHeader(pathname: string) {
  const readingEligible = pathname.startsWith('/blog/') && pathname !== '/blog/';
  const navigation = links.map(([href, label]) => {
    const active = isActive(pathname, href);
    const link = `<a class="ua-nav-link${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
    if (href !== '/lab/') return link;
    return `<div class="ua-lab-menu">${link}<div class="ua-lab-popover" role="group" aria-label="Lab sections">
      <div class="ua-lab-popover-head"><span>Inside the Lab</span><small>03 destinations</small></div>
      <a class="ua-lab-item" href="/growth-diagnostic/"><span class="ua-lab-index" aria-hidden="true">01</span><span class="ua-lab-copy"><b>Growth Diagnostic</b><small>A focused business assessment</small></span><span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a class="ua-lab-item" href="/tools/"><span class="ua-lab-index" aria-hidden="true">02</span><span class="ua-lab-copy"><b>Browser Tools</b><small>Private, practical utilities</small></span><span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a class="ua-lab-item" href="/games/"><span class="ua-lab-index" aria-hidden="true">03</span><span class="ua-lab-copy"><b>Game Center</b><small>Short, polished challenges</small></span><span class="ua-icon-arrow" aria-hidden="true"></span></a>
    </div></div>`;
  }).join('');
  const mobileNavigation = links.map(([href, label], index) => {
    const active = isActive(pathname, href);
    const number = String(index + 1).padStart(2, '0');
    if (href !== '/lab/') return `<a class="ua-nav-link${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}><span class="ua-mobile-index" aria-hidden="true">${number}</span><b>${label}</b><span class="ua-icon-arrow" aria-hidden="true"></span></a>`;
    return `<section class="ua-mobile-lab${active ? ' is-active' : ''}" aria-label="Explore the Lab">
      <div class="ua-mobile-lab-head"><span><i aria-hidden="true"></i>The Lab</span><a href="/lab/"${active ? ' aria-current="page"' : ''}>View everything <span class="ua-icon-arrow" aria-hidden="true"></span></a></div>
      <div class="ua-mobile-lab-list">
        <a class="ua-mobile-lab-primary" href="/growth-diagnostic/"><span aria-hidden="true">01</span><b>Growth Diagnostic</b><small>Find the gaps worth fixing</small><i class="ua-icon-arrow" aria-hidden="true"></i></a>
        <a href="/tools/"><span aria-hidden="true">02</span><b>Browser Tools</b><small>Useful, private utilities</small><i class="ua-icon-arrow" aria-hidden="true"></i></a>
        <a href="/games/"><span aria-hidden="true">03</span><b>Game Center</b><small>Short browser challenges</small><i class="ua-icon-arrow" aria-hidden="true"></i></a>
      </div>
    </section>`;
  }).join('');
  const readingControl = readingEligible ? `<button class="ua-reading-toggle" type="button" aria-label="Enable reading mode" aria-pressed="false" data-ua-reading-toggle>
          <span class="ua-reading-glyph" aria-hidden="true">Aa</span>
          <span class="ua-reading-label">Reading</span>
          <span class="ua-reading-track" aria-hidden="true"><i></i></span>
        </button>
        <span class="ua-sr-only" aria-live="polite" data-ua-reading-status></span>` : '';

  return `<header class="ua-header" data-ua-header>
    <div class="ua-nav-shell">
      <a class="ua-brand" href="/" aria-label="Hisan Ali home">Hisan<span>.</span></a>
      <nav class="ua-desktop-nav" aria-label="Primary navigation">${navigation}</nav>
      <div class="ua-nav-actions">
${readingControl}
        <button class="ua-theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="false" data-ua-theme-toggle><span aria-hidden="true"></span></button>
        <a class="ua-nav-cta" href="/growth-diagnostic/">Growth diagnostic <span class="ua-icon-arrow" aria-hidden="true"></span></a>
        <button class="ua-menu-button" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="ua-mobile-menu" data-ua-menu-button><span></span><span></span></button>
      </div>
    </div>
    <nav class="ua-mobile-nav" id="ua-mobile-menu" aria-label="Mobile navigation" aria-hidden="true" data-ua-mobile-nav><div class="ua-mobile-menu-head"><span>Navigate</span><small>Muscat · Oman</small></div>${mobileNavigation}<a class="ua-mobile-cta" href="/contact/"><span>Start a conversation</span><span class="ua-icon-arrow" aria-hidden="true"></span></a></nav>
  </header>`;
}

export const sharedFooter = `<footer class="ua-footer" data-ua-footer>
  <div class="ua-footer-shell">
    <div class="ua-footer-intro">
      <a class="ua-footer-brand" href="/" aria-label="Hisan Ali home">Hisan<span>.</span></a>
      <p>Clear digital strategy and focused execution for businesses ready to grow across Oman and the GCC.</p>
      <a class="ua-footer-email" href="mailto:workhisan@gmail.com">workhisan@gmail.com <span class="ua-icon-arrow" aria-hidden="true"></span></a>
    </div>
    <nav class="ua-footer-group" aria-label="Footer navigation">
      <h2>Explore</h2>
      <a href="/work/">Work</a><a href="/services/">Services</a><a href="/blog/">Insights</a><a href="/about/">About</a><a href="/lab/">Lab</a><a href="/contact/">Contact</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Services">
      <h2>Services</h2>
      <a href="/services/#seo">SEO strategy</a><a href="/services/#google-ads">Google Ads</a><a href="/services/#social-media">Social media</a><a href="/services/#analytics">Content & analytics</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Useful tools">
      <h2>Lab</h2>
      <a href="/growth-diagnostic/">Growth Diagnostic</a><a href="/tools/">Browser tools</a><a href="/games/">Game Center</a><a href="/tools/painting-drawing/">Painting Studio</a><a href="/tools/pdf-merger/">PDF Merger</a><a href="/tools/utm-builder/">UTM Builder</a>
    </nav>
    <div class="ua-footer-group ua-footer-social">
      <h2>Connect</h2>
      <a href="https://www.linkedin.com/in/hisanali/" target="_blank" rel="noopener">LinkedIn <span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a href="https://www.instagram.com/_hisxnnn_/" target="_blank" rel="noopener">Instagram <span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a href="https://wa.me/96896497228" target="_blank" rel="noopener">WhatsApp <span class="ua-icon-arrow" aria-hidden="true"></span></a>
    </div>
  </div>
  <div class="ua-footer-lower">
    <span>© 2026 Hisan Ali</span><span>Muscat · Oman</span>
    <div><a href="/legal/privacy-policy/">Privacy</a><a href="/legal/terms/">Terms</a><a href="/legal/cookie-policy/">Cookies</a></div>
  </div>
</footer>`;

export function applySharedShell(html: string, pathname: string, home = false) {
  const header = sharedHeader(pathname);
  let enhanced = html
    .replace(/<script id="theme-init">[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*href=["']\/site-shell\.css[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["']\/site-shell\.js[^>]*><\/script>\s*/gi, '');

  const sharedHeaderPattern = /<header\b[^>]*class=["'][^"']*\bua-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i;
  const legacyHomeHeaderPattern = /<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i;
  const sharedFooterPattern = /<footer\b[^>]*class=["'][^"']*\bua-footer\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;
  const legacyHomeFooterPattern = /<footer\b[^>]*class=["'][^"']*\bfooter\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;

  if (sharedHeaderPattern.test(enhanced)) {
    enhanced = enhanced.replace(sharedHeaderPattern, header);
  } else if (home && legacyHomeHeaderPattern.test(enhanced)) {
    enhanced = enhanced.replace(legacyHomeHeaderPattern, header);
  } else {
    enhanced = enhanced.replace(/<body(\s[^>]*)?>/i, (match) => `${match}${header}`);
  }

  if (sharedFooterPattern.test(enhanced)) {
    enhanced = enhanced.replace(sharedFooterPattern, sharedFooter);
  } else if (home && legacyHomeFooterPattern.test(enhanced)) {
    enhanced = enhanced.replace(legacyHomeFooterPattern, sharedFooter);
  } else {
    enhanced = enhanced.replace('</body>', `${sharedFooter}</body>`);
  }

  enhanced = enhanced
    .replace('</head>', `${sharedThemeInit}<link rel="stylesheet" href="/site-shell.css?v=20260903-4"></head>`)
    .replace('</body>', '<script src="/site-shell.js?v=20260903-4"></script></body>');

  if (home) {
    enhanced = enhanced.replace(/<body(\s[^>]*)?>/i, (match, attributes = '') => {
      if (/\bclass=/i.test(attributes)) {
        return match.replace(/class=(["'])(.*?)\1/i, (_full, quote, classes) => `class=${quote}${classes} page-home-redesign${quote}`);
      }
      return `<body class="page-home-redesign"${attributes}>`;
    });
  }
  return enhanced;
}
