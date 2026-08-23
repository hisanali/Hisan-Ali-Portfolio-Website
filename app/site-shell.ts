export const sharedThemeInit = `<script id="theme-init">(()=>{try{const saved=localStorage.getItem('preferred-theme');const dark=saved==='dark';document.documentElement.classList.toggle('theme-dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){document.documentElement.classList.remove('theme-dark');document.documentElement.style.colorScheme='light'}})();</script>`;

const links = [
  ['/', 'Home'],
  ['/about/', 'About'],
  ['/services/', 'Services'],
  ['/tools/', 'Tools'],
  ['/games/', 'Games'],
  ['/blog/', 'Blog'],
  ['/contact/', 'Contact']
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href.slice(0, -1) || pathname.startsWith(href);
}

export function sharedHeader(pathname: string) {
  const navigation = links.map(([href, label]) => {
    const active = isActive(pathname, href);
    return `<a class="ua-nav-link${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');

  return `<header class="ua-header" data-ua-header>
    <div class="ua-nav-shell">
      <a class="ua-brand" href="/" aria-label="Hisan Ali home">Hisan<span>.</span></a>
      <nav class="ua-desktop-nav" aria-label="Primary navigation">${navigation}</nav>
      <div class="ua-nav-actions">
        <button class="ua-theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="true" data-ua-theme-toggle><span aria-hidden="true"></span></button>
        <a class="ua-nav-cta" href="/contact/">Let’s talk <span aria-hidden="true">↗︎</span></a>
        <button class="ua-menu-button" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="ua-mobile-menu" data-ua-menu-button><span></span><span></span></button>
      </div>
    </div>
    <nav class="ua-mobile-nav" id="ua-mobile-menu" aria-label="Mobile navigation" aria-hidden="true" data-ua-mobile-nav>${navigation}<a class="ua-mobile-cta" href="/contact/">Start a project <span aria-hidden="true">↗︎</span></a></nav>
  </header>`;
}

export const sharedFooter = `<footer class="ua-footer" data-ua-footer>
  <div class="ua-footer-shell">
    <div class="ua-footer-intro">
      <a class="ua-footer-brand" href="/" aria-label="Hisan Ali home">Hisan<span>.</span></a>
      <p>Clear digital strategy and focused execution for businesses ready to grow across Oman and the GCC.</p>
      <a class="ua-footer-email" href="mailto:workhisan@gmail.com">workhisan@gmail.com <span aria-hidden="true">↗︎</span></a>
    </div>
    <nav class="ua-footer-group" aria-label="Footer navigation">
      <h2>Explore</h2>
      <a href="/">Home</a><a href="/about/">About</a><a href="/services/">Services</a><a href="/tools/">Tools</a><a href="/games/">Game Center</a><a href="/blog/">Blog</a><a href="/contact/">Contact</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Services">
      <h2>Services</h2>
      <a href="/services/">SEO strategy</a><a href="/services/">Google Ads</a><a href="/services/">Social media</a><a href="/services/">Content & analytics</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Useful tools">
      <h2>Tools & play</h2>
      <a href="/tools/">All tools</a><a href="/games/">All games</a><a href="/tools/painting-drawing/">Painting Studio</a><a href="/tools/pdf-merger/">PDF Merger</a><a href="/tools/image-converter/">Image Converter</a><a href="/tools/qr-code-generator/">QR Generator</a><a href="/tools/utm-builder/">UTM Builder</a><a href="/speed-test/">Page Speed Test</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Regional pages">
      <h2>Across the GCC</h2>
      <a href="/gcc/oman/">Oman</a><a href="/gcc/uae/">UAE</a><a href="/gcc/ksa/">Saudi Arabia</a><a href="/gcc/qatar/">Qatar</a><a href="/gcc/kuwait/">Kuwait</a><a href="/gcc/bahrain/">Bahrain</a>
    </nav>
    <div class="ua-footer-group ua-footer-social">
      <h2>Connect</h2>
      <a href="https://www.linkedin.com/in/hisanali/" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗︎</span></a>
      <a href="https://www.instagram.com/_hisxnnn_/" target="_blank" rel="noopener">Instagram <span aria-hidden="true">↗︎</span></a>
      <a href="https://wa.me/96896497228" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">↗︎</span></a>
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
    .replace(/<script\b[^>]*src=["']\/site-shell\.js[^>]*><\/script>\s*/gi, '')
    .replace(/<header\b[\s\S]*?<\/header>/i, header)
    .replace(/<footer\b[\s\S]*?<\/footer>/i, sharedFooter);

  if (!/<header\b/i.test(enhanced)) {
    enhanced = enhanced.replace(/<body(\s[^>]*)?>/i, (match) => `${match}${header}`);
  }
  if (!/<footer\b/i.test(enhanced)) {
    enhanced = enhanced.replace('</body>', `${sharedFooter}</body>`);
  }

  enhanced = enhanced
    .replace('</head>', `${sharedThemeInit}<link rel="stylesheet" href="/site-shell.css?v=20260824-12"></head>`)
    .replace('</body>', '<script src="/site-shell.js?v=20260824-10"></script></body>');

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
