export const sharedThemeInit = `<script id="theme-init">(()=>{const root=document.documentElement;try{const savedTheme=localStorage.getItem('preferred-theme');const dark=savedTheme?savedTheme==='dark':true;const path=location.pathname.replace(/\\/+$/,'');const eligible=path.startsWith('/blog/')&&path!=='/blog';const reading=eligible&&(localStorage.getItem('preferred-reading-mode')==='true'||localStorage.getItem('preferred-palette')==='desert');root.classList.toggle('theme-dark',dark);root.classList.toggle('reading-mode',reading);root.dataset.palette=reading?'desert':'forest';root.style.colorScheme=dark?'dark':'light'}catch(e){root.classList.add('theme-dark');root.classList.remove('reading-mode');root.dataset.palette='forest';root.style.colorScheme='dark'}})();</script>`;

const sectionPrefixes: Record<string, string[]> = {
  services: ['/services/'],
  insights: ['/blog/'],
  lab: ['/lab/', '/tools/', '/games/', '/growth-diagnostic/', '/speed-test/']
};

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href.slice(0, -1) || pathname.startsWith(href);
}

export function sharedHeader(pathname: string) {
  const readingEligible = pathname.startsWith('/blog/') && pathname !== '/blog/';
  const readingControl = readingEligible ? `<button class="ua-reading-toggle" type="button" aria-label="Enable reading mode" aria-pressed="false" data-ua-reading-toggle>
          <span class="ua-reading-glyph" aria-hidden="true">Aa</span>
          <span class="ua-reading-label">Reading</span>
          <span class="ua-reading-track" aria-hidden="true"><i></i></span>
        </button>
        <span class="ua-sr-only" aria-live="polite" data-ua-reading-status></span>` : '';

  let header = `<header class="ua-header hd" data-ua-header data-hd>
  <svg class="hd-sprite" aria-hidden="true" focusable="false">
    <symbol id="hd-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
    <symbol id="hd-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="hd-out" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></symbol>
    <symbol id="hd-strategy" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/></symbol>
    <symbol id="hd-seo" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></symbol>
    <symbol id="hd-google" viewBox="0 0 24 24"><path d="M4 18 10 6l4 8M14 14l2 4"/><circle cx="18" cy="17" r="2.5"/></symbol>
    <symbol id="hd-social" viewBox="0 0 24 24"><path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M17 9a4 4 0 0 1 0 6"/></symbol>
    <symbol id="hd-calendar" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></symbol>
    <symbol id="hd-web" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></symbol>
    <symbol id="hd-pen" viewBox="0 0 24 24"><path d="m15 5 4 4L8 20H4v-4Z"/><path d="m13 7 4 4"/></symbol>
    <symbol id="hd-video" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/></symbol>
    <symbol id="hd-chart" viewBox="0 0 24 24"><path d="M4 20h16M7 16v-4M12 16V7M17 16v-7"/></symbol>
    <symbol id="hd-spark" viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></symbol>
    <symbol id="hd-pulse" viewBox="0 0 24 24"><path d="M2 12h4l2.5-6 4 12 3-9 1.8 3H22"/></symbol>
    <symbol id="hd-tools" viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4Z"/></symbol>
    <symbol id="hd-game" viewBox="0 0 24 24"><path d="M7 8h10a4 4 0 0 1 3.9 4.8l-.8 3.7a2 2 0 0 1-3.4 1L14.5 15h-5l-2.2 2.5a2 2 0 0 1-3.4-1l-.8-3.7A4 4 0 0 1 7 8Z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/></symbol>
    <symbol id="hd-car" viewBox="0 0 24 24"><path d="M5 16h14v-3l-2-5H7l-2 5Z"/><path d="M3 13h18"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/></symbol>
    <symbol id="hd-book" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5M9 7h6"/></symbol>
    <symbol id="hd-whatsapp" viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2Z"/></symbol>
  </svg>

  <div class="hd-bar">
    <a class="hd-brand" href="/" aria-label="Hisan Ali home">Hisan<span>.</span></a>

    <nav class="hd-nav" aria-label="Primary navigation" data-hd-nav>
      <ul>
        <li><a class="hd-link" href="/work/">Work</a></li>
        <li class="hd-has" data-hd-item="services"><a class="hd-link hd-trigger" href="/services/" data-hd-trigger="services">Services</a><button class="hd-caret" type="button" aria-expanded="false" aria-controls="hd-p-services" aria-label="Show Services menu" data-hd-caret="services"><svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button></li>
        <li class="hd-has" data-hd-item="insights"><a class="hd-link hd-trigger" href="/blog/" data-hd-trigger="insights">Insights</a><button class="hd-caret" type="button" aria-expanded="false" aria-controls="hd-p-insights" aria-label="Show Insights menu" data-hd-caret="insights"><svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button></li>
        <li><a class="hd-link" href="/about/">About</a></li>
        <li class="hd-has" data-hd-item="lab"><a class="hd-link hd-trigger" href="/lab/" data-hd-trigger="lab">Lab</a><button class="hd-caret" type="button" aria-expanded="false" aria-controls="hd-p-lab" aria-label="Show Lab menu" data-hd-caret="lab"><svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button></li>
        <li><a class="hd-link" href="/contact/">Contact</a></li>
      </ul>
      <span class="hd-pill" aria-hidden="true" data-hd-pill></span>
    </nav>

    <div class="hd-actions">
${readingControl}
      <button class="ua-theme-toggle hd-theme" type="button" aria-label="Toggle color theme" aria-pressed="false" data-ua-theme-toggle><span aria-hidden="true"></span></button>
      <a class="hd-cta" href="/growth-diagnostic/"><svg class="hd-i" aria-hidden="true"><use href="#hd-pulse"/></svg>Free check-up</a>
      <button class="hd-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="hd-mobile" data-ua-menu-button><span></span><span></span></button>
    </div>
  </div>

  <!-- Desktop mega sheet: one surface that morphs between panels -->
  <div class="hd-sheet" data-hd-sheet>
    <div class="hd-sheet-inner" data-hd-sheet-inner>

      <section class="hd-panel hd-p-services" id="hd-p-services" data-hd-panel="services" aria-label="Services" hidden>
        <div class="hd-feature hd-feature-dark">
          <p class="hd-eyebrow">Services</p>
          <p class="hd-feature-title">One accountable lead. The right specialists.</p>
          <a class="hd-textlink" href="/services/">See all 10 services <svg class="hd-i" aria-hidden="true"><use href="#hd-arrow"/></svg></a>
          <a class="hd-promo" href="/growth-diagnostic/"><b>Not sure what you need?</b><span>Take the 3-min check-up</span><svg class="hd-i" aria-hidden="true"><use href="#hd-arrow"/></svg></a>
        </div>
        <div class="hd-groups">
          <div class="hd-group">
            <p class="hd-group-title">Get found</p>
            <a class="hd-item" href="/services/#seo" style="--c:#9dd4ff"><span class="hd-ico"><svg class="hd-i"><use href="#hd-seo"/></svg></span><span><b>SEO &amp; local search</b><small>Google, Maps and AI answers</small></span></a>
            <a class="hd-item" href="/services/#google-ads" style="--c:#ffb48c"><span class="hd-ico"><svg class="hd-i"><use href="#hd-google"/></svg></span><span><b>Google Ads</b><small>Search &amp; Performance Max</small></span></a>
            <a class="hd-item" href="/services/#meta-ads" style="--c:#f5b9e2"><span class="hd-ico"><svg class="hd-i"><use href="#hd-social"/></svg></span><span><b>Meta, TikTok &amp; LinkedIn ads</b><small>Paid social that converts</small></span></a>
            <a class="hd-item" href="/services/#social-media" style="--c:#dfff63"><span class="hd-ico"><svg class="hd-i"><use href="#hd-calendar"/></svg></span><span><b>Social media management</b><small>Content, publishing, community</small></span></a>
          </div>
          <div class="hd-group">
            <p class="hd-group-title">Build</p>
            <a class="hd-item" href="/services/#websites" style="--c:#a8e6c2"><span class="hd-ico"><svg class="hd-i"><use href="#hd-web"/></svg></span><span><b>Websites &amp; landing pages</b><small>Built to explain and convert</small></span></a>
            <a class="hd-item" href="/services/#creative" style="--c:#f5b9e2"><span class="hd-ico"><svg class="hd-i"><use href="#hd-pen"/></svg></span><span><b>Creative &amp; design</b><small>Arabic and English</small></span></a>
            <a class="hd-item" href="/services/#video" style="--c:#ffb48c"><span class="hd-ico"><svg class="hd-i"><use href="#hd-video"/></svg></span><span><b>Video &amp; reels</b><small>Concept to delivery</small></span></a>
            <a class="hd-item" href="/services/#ai" style="--c:#9dd4ff"><span class="hd-ico"><svg class="hd-i"><use href="#hd-spark"/></svg></span><span><b>AI &amp; automation</b><small>Remove repetitive work</small></span></a>
          </div>
          <div class="hd-group">
            <p class="hd-group-title">Plan &amp; measure</p>
            <a class="hd-item" href="/services/#strategy" style="--c:#dfff63"><span class="hd-ico"><svg class="hd-i"><use href="#hd-strategy"/></svg></span><span><b>Strategy &amp; growth</b><small>Goal to practical roadmap</small></span></a>
            <a class="hd-item" href="/services/#analytics" style="--c:#a8e6c2"><span class="hd-ico"><svg class="hd-i"><use href="#hd-chart"/></svg></span><span><b>Analytics &amp; CRO</b><small>Tracking you can trust</small></span></a>
          </div>
        </div>
      </section>

      <section class="hd-panel hd-p-insights" id="hd-p-insights" data-hd-panel="insights" aria-label="Insights" hidden>
        <div class="hd-topics">
          <p class="hd-group-title">Browse by topic</p>
          <a class="hd-topic" href="/blog/seo-strategy-hub/" style="--c:#9dd4ff"><svg class="hd-i"><use href="#hd-seo"/></svg>SEO strategy hub</a>
          <a class="hd-topic" href="/blog/google-ads-topic-map/" style="--c:#ffb48c"><svg class="hd-i"><use href="#hd-google"/></svg>Google Ads guides</a>
          <a class="hd-topic" href="/blog/meta-social-topic-map/" style="--c:#f5b9e2"><svg class="hd-i"><use href="#hd-social"/></svg>Meta &amp; social</a>
          <a class="hd-topic" href="/blog/start-business-oman-2026-guide/" style="--c:#dfff63"><svg class="hd-i"><use href="#hd-book"/></svg>Start a business in Oman</a>
          <a class="hd-textlink" href="/blog/">All insights <svg class="hd-i" aria-hidden="true"><use href="#hd-arrow"/></svg></a>
        </div>
        <div class="hd-reads">
          <p class="hd-group-title">Worth reading</p>
          <div class="hd-read-grid">
            <a class="hd-read" href="/blog/oman-digital-fact-file-2026/"><img src="/blog-oman-digital-fact-file-2026-poster.webp" alt="" loading="lazy" decoding="async"><span>Data · 8 min</span><b>Oman in Numbers 2026: The Digital Fact File</b></a>
            <a class="hd-read" href="/blog/oman-marketing-calendar-2027/"><img src="/blog-oman-marketing-calendar-2027-poster.webp" alt="" loading="lazy" decoding="async"><span>Planning · 9 min</span><b>The Oman Marketing Year 2027</b></a>
            <a class="hd-read" href="/blog/lead-response-system-oman/"><img src="/blog-lead-response-system-poster-v2.jpg" alt="" loading="lazy" decoding="async"><span>Sales · 9 min</span><b>The Lead Response System</b></a>
          </div>
        </div>
      </section>

      <section class="hd-panel hd-p-lab" id="hd-p-lab" data-hd-panel="lab" aria-label="Lab" hidden>
        <div class="hd-lab-cards">
          <a class="hd-lab" href="/growth-diagnostic/" style="--c:#dfff63"><span class="hd-lab-img"><img src="/hd-thumb-diagnostic.webp" alt="" width="560" height="350" loading="lazy" decoding="async"><span class="hd-ico"><svg class="hd-i"><use href="#hd-pulse"/></svg></span></span><span class="hd-lab-body"><b>Growth Diagnostic</b><small>3-min marketing check-up</small></span></a>
          <a class="hd-lab" href="/tools/" style="--c:#9dd4ff"><span class="hd-lab-img"><img src="/hd-thumb-tools.webp" alt="" width="560" height="350" loading="lazy" decoding="async"><span class="hd-ico"><svg class="hd-i"><use href="#hd-tools"/></svg></span></span><span class="hd-lab-body"><b>Browser Tools</b><small>Private, free utilities</small></span></a>
          <a class="hd-lab" href="/games/" style="--c:#f5b9e2"><span class="hd-lab-img"><img src="/hd-thumb-games.webp" alt="" width="560" height="350" loading="lazy" decoding="async"><span class="hd-ico"><svg class="hd-i"><use href="#hd-game"/></svg></span></span><span class="hd-lab-body"><b>Game Center</b><small>13 quick browser games</small></span></a>
          <a class="hd-lab" href="/evermile/" target="_blank" rel="noopener noreferrer" style="--c:#ffb48c"><span class="hd-lab-img"><img src="/hd-thumb-evermile.webp" alt="" width="560" height="350" loading="lazy" decoding="async"><span class="hd-ico"><svg class="hd-i"><use href="#hd-car"/></svg></span></span><span class="hd-lab-body"><b>Evermile <svg class="hd-i hd-out" aria-hidden="true"><use href="#hd-out"/></svg></b><small>Scenic 3D drive · new tab</small></span></a>
        </div>
        <div class="hd-popular">
          <p class="hd-group-title">Popular</p>
          <a href="/tools/painting-drawing/">Painting Studio</a>
          <a href="/tools/rubiks-cube/">Cube Studio</a>
          <a href="/speed-test/">Page Speed Test</a>
          <a href="/tools/utm-builder/">UTM Builder</a>
          <a href="/tools/qr-code-generator/">QR Code Generator</a>
          <a href="/tools/pdf-merger/">PDF Merger</a>
          <a class="hd-textlink" href="/lab/">Everything in the Lab <svg class="hd-i" aria-hidden="true"><use href="#hd-arrow"/></svg></a>
        </div>
      </section>

    </div>
  </div>
  <div class="hd-scrim" data-hd-scrim aria-hidden="true"></div>

  <!-- Mobile menu -->
  <nav class="hd-mobile" id="hd-mobile" aria-label="Mobile navigation" aria-hidden="true" data-ua-mobile-nav>
    <div class="hd-m-scroll">
      <a class="hd-m-link" href="/">Home</a>
      <a class="hd-m-link" href="/work/">Work</a>
      <div class="hd-m-group">
        <button class="hd-m-link" type="button" aria-expanded="false" data-hd-acc>Services<svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button>
        <div class="hd-m-sub"><div>
          <a href="/services/#seo" style="--c:#9dd4ff">SEO &amp; local search</a>
          <a href="/services/#google-ads" style="--c:#ffb48c">Google Ads</a>
          <a href="/services/#meta-ads" style="--c:#f5b9e2">Meta, TikTok &amp; LinkedIn ads</a>
          <a href="/services/#social-media" style="--c:#dfff63">Social media management</a>
          <a href="/services/#websites" style="--c:#a8e6c2">Websites &amp; landing pages</a>
          <a href="/services/#creative" style="--c:#f5b9e2">Creative &amp; design</a>
          <a href="/services/#video" style="--c:#ffb48c">Video &amp; reels</a>
          <a href="/services/#ai" style="--c:#9dd4ff">AI &amp; automation</a>
          <a href="/services/#strategy" style="--c:#dfff63">Strategy &amp; growth</a>
          <a href="/services/#analytics" style="--c:#a8e6c2">Analytics &amp; CRO</a>
          <a class="hd-m-all" href="/services/">All services →</a>
        </div></div>
      </div>
      <div class="hd-m-group">
        <button class="hd-m-link" type="button" aria-expanded="false" data-hd-acc>Insights<svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button>
        <div class="hd-m-sub"><div>
          <a href="/blog/seo-strategy-hub/" style="--c:#9dd4ff">SEO strategy hub</a>
          <a href="/blog/google-ads-topic-map/" style="--c:#ffb48c">Google Ads guides</a>
          <a href="/blog/meta-social-topic-map/" style="--c:#f5b9e2">Meta &amp; social</a>
          <a href="/blog/start-business-oman-2026-guide/" style="--c:#dfff63">Start a business in Oman</a>
          <a class="hd-m-all" href="/blog/">All insights →</a>
        </div></div>
      </div>
      <a class="hd-m-link" href="/about/">About</a>
      <div class="hd-m-group">
        <button class="hd-m-link" type="button" aria-expanded="false" data-hd-acc>Lab<svg class="hd-i hd-chev" aria-hidden="true"><use href="#hd-chev"/></svg></button>
        <div class="hd-m-sub"><div>
          <a href="/growth-diagnostic/" style="--c:#dfff63">Growth Diagnostic</a>
          <a href="/tools/" style="--c:#9dd4ff">Browser Tools</a>
          <a href="/games/" style="--c:#f5b9e2">Game Center</a>
          <a href="/evermile/" target="_blank" rel="noopener noreferrer" style="--c:#ffb48c">Evermile · 3D drive ↗</a>
          <a class="hd-m-all" href="/lab/">Everything in the Lab →</a>
        </div></div>
      </div>
      <a class="hd-m-link" href="/contact/">Contact</a>
    </div>
    <div class="hd-m-foot">
      <a class="hd-m-btn hd-m-btn-lime" href="/growth-diagnostic/"><svg class="hd-i" aria-hidden="true"><use href="#hd-pulse"/></svg>Free check-up</a>
      <a class="hd-m-btn" href="https://wa.me/96896110846" target="_blank" rel="noopener"><svg class="hd-i" aria-hidden="true"><use href="#hd-whatsapp"/></svg>WhatsApp</a>
    </div>
  </nav>
</header>`;
  for (const href of ['/work/', '/about/', '/contact/']) {
    if (isActive(pathname, href)) header = header.replace(`<a class="hd-link" href="${href}">`, `<a class="hd-link is-active" href="${href}" aria-current="page">`);
  }
  for (const [name, prefixes] of Object.entries(sectionPrefixes)) {
    if (prefixes.some((prefix) => isActive(pathname, prefix))) header = header.replace(new RegExp(`class="hd-link hd-trigger"( href="[^"]+" data-hd-trigger="${name}")`), 'class="hd-link hd-trigger is-active"$1');
  }
  return header;
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
      <a href="/">Home</a><a href="/work/">Work</a><a href="/services/">Services</a><a href="/blog/">Insights</a><a href="/about/">About</a><a href="/lab/">Lab</a><a href="/contact/">Contact</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Services">
      <h2>Services</h2>
      <a href="/services/#seo">SEO strategy</a><a href="/services/#google-ads">Google Ads</a><a href="/services/#social-media">Social media</a><a href="/services/#analytics">Content & analytics</a>
    </nav>
    <nav class="ua-footer-group" aria-label="Useful tools">
      <h2>Lab</h2>
      <a href="/growth-diagnostic/">Growth Diagnostic</a><a href="/tools/">Browser tools</a><a href="/games/">Game Center</a><a href="/evermile/" target="_blank" rel="noopener noreferrer" aria-label="Evermile (opens in a new tab)">Evermile <span class="ua-icon-arrow" aria-hidden="true"></span></a><a href="/tools/painting-drawing/">Painting Studio</a><a href="/tools/pdf-merger/">PDF Merger</a><a href="/tools/utm-builder/">UTM Builder</a>
    </nav>
    <div class="ua-footer-group ua-footer-social">
      <h2>Connect</h2>
      <a href="https://www.linkedin.com/in/hisanali/" target="_blank" rel="noopener">LinkedIn <span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a href="https://www.instagram.com/_hisxnnn_/" target="_blank" rel="noopener">Instagram <span class="ua-icon-arrow" aria-hidden="true"></span></a>
      <a href="https://wa.me/96896110846" target="_blank" rel="noopener">WhatsApp <span class="ua-icon-arrow" aria-hidden="true"></span></a>
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
    .replace(/<link\b[^>]*href=["']\/site-header\.css[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["']\/site-header\.js[^>]*><\/script>\s*/gi, '');

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
    .replace('</head>', `${sharedThemeInit}<link rel="stylesheet" href="/site-shell.css?v=20260906-7"><link rel="stylesheet" href="/site-header.css?v=2"></head>`)
    .replace('</body>', '<script src="/site-shell.js?v=20260906-4"></script><script src="/site-header.js?v=2"></script></body>');

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
