"""Builds the GCC hub, country guides, 2027 calendars, comparison page and Arabic country pages.
Run: python3 scripts/gcc/gen.py && node scripts/generate-static-site.mjs"""
import json, os, re, html, sys
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(__file__))
from data import C, ISLAMIC, MAWLID, SOURCES, EXTRA

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://hisanali.com'
TPL = open(os.path.join(R, 'blog/oman-expat-audience-marketing/index.html')).read()
ORDER = ['uae', 'ksa', 'qatar', 'bahrain', 'kuwait']
e = lambda s: html.escape(s, quote=True)
strip = lambda s: re.sub(r'<[^>]+>', '', s)

def page(path, title, desc, og_title, body, body_cls, ld_graph, js=None, extra_head='', image=f'{SITE}/blog-gcc-digital-marketing-playbook.webp'):
    url = f'{SITE}{path}'
    h = TPL.replace('href="../../style.css','href="/style.css').replace('href="../../blog.css','href="/blog.css')
    h = re.sub(r'<title>.*?</title>', f'<title>{e(title)}</title>', h, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(desc)}">', h)
    h = h.replace(f'{SITE}/blog/oman-expat-audience-marketing/', url)
    h = h.replace(f'{SITE}/blog-oman-expat-audience-marketing-poster.webp', image)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(og_title)}">', h)
    h = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(desc)}">', h)
    h = h.replace('<link rel="stylesheet" href="/blog/oman-expat-audience-marketing/article.css">', '<link rel="stylesheet" href="/gcc/gcc.css?v=1">')
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': ld_graph}, ensure_ascii=False) + '</script>', h, flags=re.S)
    if extra_head:
        h = h.replace('<link rel="canonical"', extra_head + '<link rel="canonical"', 1)
    h = h.replace('fe-violet ex-guide', body_cls)
    a = h.index('</header>') + 9; z = h.index('<button class="back-to-top"')
    h = h[:a] + '\n' + body + '\n' + h[z:]
    h = h.replace('<script src="/blog/oman-expat-audience-marketing/planner.js" defer></script>', f'<script src="{js}" defer></script>' if js else '')
    assert 'oman-expat' not in h, path
    d = os.path.join(R, path.strip('/')); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w').write(h)
    print('wrote', path)

def crumbs(items):
    return '<div class="breadcrumb">' + '<span aria-hidden="true"> / </span>'.join(f'<a href="{u}">{t}</a>' if u else f'<span>{t}</span>' for t, u in items) + '</div>'

def bc_ld(items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': t, 'item': f'{SITE}{u}'} for i, (t, u) in enumerate(items)]}

def faq_html(faq, pid):
    return f'<section class="lead-faq" id="faq" aria-labelledby="{pid}-faq"><h2 id="{pid}-faq">Questions</h2>' + ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in faq) + '</section>'

def faq_ld(faq, lang='en'):
    return {'@type': 'FAQPage', 'inLanguage': lang, 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}

SERVICE_LD = {'@type': 'ProfessionalService', 'name': 'Hisan Ali – Digital Marketing', 'url': f'{SITE}/', 'telephone': '+96896110846', 'email': 'workhisan@gmail.com',
              'address': {'@type': 'PostalAddress', 'addressLocality': 'Muscat', 'addressCountry': 'OM'},
              'areaServed': [{'@type': 'Country', 'name': n} for n in ['Oman', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait']],
              'founder': {'@type': 'Person', 'name': 'Hisan Ali', 'url': f'{SITE}/about/'}, 'availableLanguage': ['en', 'ar']}

def sidebar(links):
    rel = ''.join(f'<a href="{u}" class="related-post-item"><h4>{t}</h4><p class="meta">{m}</p></a>' for t, u, m in links)
    return f'<aside class="blog-sidebar"><div class="author-card"><div class="author-avatar"><i class="fas fa-globe" aria-hidden="true"></i></div><h3>Hisan Ali</h3><p class="author-title">Digital Marketing Strategist, Muscat</p><p>SEO, Google Ads and social media for businesses across the GCC.</p></div><div class="related-posts"><h3>Related</h3>{rel}</div></aside>'

def cta(h2, p, btn):
    return f'<section class="cta-section"><div class="container"><div class="cta-content"><h2>{h2}</h2><p>{p}</p><a href="/contact/" class="btn-primary btn-large">{btn} <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></div></section>'

def hero(crumb, cat, h1, deck, meta):
    return f'<section class="blog-post-hero"><div class="container"><div class="blog-post-header">{crumb}<div class="blog-category">{cat}</div><h1>{h1}</h1><p class="fe-deck">{deck}</p><div class="blog-post-meta">{"".join(f"<span>{m}</span>" for m in meta)}</div></div></div></section>'

def country_dates(c):
    rows = list(c['dates'])
    rows += ISLAMIC
    if c['mawlid']: rows.append(MAWLID)
    order = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Spring': 3.5, 'May': 5, 'Jun': 6, 'Summer': 6.5, 'Jul': 7, 'Aug': 8, 'Late Aug': 8.5, 'Sep': 9, 'Oct': 10, 'From Oct': 10, 'Nov': 11, 'Late Nov': 11.5, 'Dec': 12, 'Dec–Jan': 12.5, 'February': 1.9, '30 Nov–1 Dec': 11.9}
    def key(r):
        d = r[0]
        if d in order: return order[d]
        m = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', d)
        n = re.search(r'\d+', d)
        return order.get(m.group(1), 13) + (int(n.group()) / 40 if n else 0) if m else 13
    return sorted(rows, key=key)

# ---------- Country guides ----------
for k in ORDER:
    c = C[k]; path = f'/gcc/{k}/'
    items = [('Home', '/'), ('GCC', '/gcc/'), (c['name'], path)]
    snap = ''.join(f'<div class="gc-snap-i"><span class="gc-snap-k">{e(t)}</span><span class="gc-snap-v">{e(d)}</span></div>' for t, d in c['snapshot'])
    plat = ''.join(f'<tr><td><strong>{e(p)}</strong></td><td>{e(d)}</td></tr>' for p, d in c['platforms'])
    dates = country_dates(c)[:8]
    drows = ''.join(f'<div class="gc-date"><b>{e(d)}</b><span>{e(t)}</span><small>{e(w)}</small></div>' for d, t, w in dates)
    body = hero(crumbs(items), f'GCC · {e(c["name"])}', c['h1'], e(c['deck']), ['Updated October 2026', '10 min read', 'By Hisan Ali']) + f'''
<section class="blog-post-section"><div class="blog-post-container"><article class="blog-post-content" id="blog-content">
<div class="gc-facts" aria-label="{e(c['name'])} at a glance"><div><span>{c['flag']}</span><b>{e(c['name'])}</b></div><div><span>Main markets</span><b>{e(c['cities'])}</b></div><div><span>Currency</span><b>{e(c['currency'])}</b></div><div><span>Weekend</span><b>{e(c['weekend'])}</b></div></div>
<nav class="gc-jump" aria-label="On this page"><a href="#market">The market</a><a href="#platforms">Platforms</a><a href="#language">Language</a><a href="#search">Search & ads</a><a href="#dates">Key dates</a><a href="#sectors">Sectors</a><a href="#law">Data rules</a><a href="#work">Working together</a><a href="/ar/{k}/" lang="ar" hreflang="ar">العربية</a></nav>
<h2 class="fe-h2" id="market"><small>01</small>How the {e(c['name'])} market behaves</h2>
<div class="gc-snap">{snap}</div>
<h2 class="fe-h2" id="platforms"><small>02</small>The platform mix</h2>
<p>Every GCC country uses the same apps, but not in the same way. This is how they typically divide the work in {e(c['the'])}.</p>
<div class="fe-table-wrap"><table class="fe-table"><thead><tr><th>Platform</th><th>Its job in {e(c['the'])}</th></tr></thead><tbody>{plat}</tbody></table></div>
<h2 class="fe-h2" id="language"><small>03</small>Arabic, English and tone</h2>
<p>{e(c['language'])}</p>
<div class="fe-note"><strong>Tip:</strong> run Arabic and English as separate campaigns and pages, each with its own keywords, rather than mixing both languages in one ad group or one page.</div>
<h2 class="fe-h2" id="search"><small>04</small>Search and Google Ads</h2>
<p>{e(c['search'])}</p>
<div class="gc-steps"><div><b>1. Track first</b><span>Calls, WhatsApp clicks and forms recorded as conversions before scaling spend.</span></div><div><b>2. Local relevance</b><span>Accurate Google Business Profile, area pages where you truly serve, local phone and address.</span></div><div><b>3. Clean search terms</b><span>Exclude job, visa, free and other-country searches every week.</span></div><div><b>4. Matching pages</b><span>Fast mobile landing pages that repeat the ad’s offer, with WhatsApp one tap away.</span></div></div>
<h2 class="fe-h2" id="dates"><small>05</small>Key dates in 2027</h2>
<div class="gc-dates">{drows}</div>
<p class="gc-more"><a href="/gcc/{k}/marketing-calendar-2027/">See the full {e(c['name'])} marketing calendar 2027 →</a></p>
<h2 class="fe-h2" id="sectors"><small>06</small>Sectors with momentum</h2>
<div class="fe-cards">{''.join(f'<div class="fe-card"><span class="fe-tag">Sector</span><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in EXTRA[k]['sectors'])}</div>
<h2 class="fe-h2" id="mistakes"><small>07</small>Common mistakes in {e(c['the'])}</h2>
<div class="gc-steps">{''.join(f'<div><b>{e(t)}</b><span>{e(d)}</span></div>' for t, d in EXTRA[k]['mistakes'])}</div>
<h2 class="fe-h2" id="law"><small>08</small>Data protection and marketing rules</h2>
<div class="gc-law"><b>{e(c['law'][0])}</b><span>{e(c['law'][1])}</span></div>
<p class="fe-small">General guidance, not legal advice. Check current rules with the regulator or a qualified adviser before collecting customer data.</p>
<h2 class="fe-h2" id="work"><small>09</small>Working together from Muscat</h2>
<p>I work with businesses in {e(c['the'])} remotely from Muscat: strategy, SEO, Google Ads, social media and tracking, with regular calls, WhatsApp updates and a short monthly report. For on-the-ground needs such as photo shoots or events, I coordinate trusted local partners.</p>
<div class="gc-links"><a href="/gcc/">All GCC markets</a><a href="/blog/gcc-digital-marketing-comparison/">Compare GCC markets</a><a href="/gcc/{k}/marketing-calendar-2027/">{e(c['name'])} calendar 2027</a><a href="/ar/{k}/" lang="ar">التسويق الرقمي في {e(c['ar_name'])}</a></div>
{faq_html(c['faq'], k)}
<section class="fe-sources" id="method"><h2>Method &amp; sources</h2><p>Updated October 2026. Platform and audience notes are qualitative and based on campaign experience across the GCC. Islamic dates for 2027 are projections confirmed by moon sighting; check official announcements before booking media.</p><ol>{''.join(f'<li>{e(t)}. <a href="{u}" target="_blank" rel="noopener">{e(u.split("/")[2])}</a></li>' for t, u in SOURCES)}</ol></section>
</article>{sidebar([(f'{c["name"]} calendar 2027', f'/gcc/{k}/marketing-calendar-2027/', 'Key dates & runway'), ('Compare GCC markets', '/blog/gcc-digital-marketing-comparison/', 'Country switcher'), ('GCC digital marketing playbook', '/blog/gcc-digital-marketing-playbook/', 'Regional strategy')])}</div></section>
{cta(f'Growing in {e(c["the"])}?', 'I’ll plan your SEO, Google Ads and social media for this market, in Arabic and English.', 'Plan my campaigns')}'''
    ld = [SERVICE_LD | {'url': f'{SITE}{path}', 'name': f'Hisan Ali – Digital Marketing for {c["name"]}'},
          {'@type': 'WebPage', 'name': strip(c['h1']), 'description': c['desc'], 'url': f'{SITE}{path}', 'inLanguage': 'en', 'about': {'@type': 'Country', 'name': c['name']}},
          faq_ld(c['faq']), bc_ld(items)]
    alt = f'<link rel="alternate" hreflang="en" href="{SITE}{path}"><link rel="alternate" hreflang="ar" href="{SITE}/ar/{k}/"><link rel="alternate" hreflang="x-default" href="{SITE}{path}">'
    page(path, c['title'], c['desc'], strip(c['h1']), body, f'{c["accent"]} gc-guide', ld, extra_head=alt)

# ---------- Country calendars 2027 ----------
QUARTERS = [('Q1', 'Jan–Mar', 'Ramadan (expected from ~8 February) and Eid al-Fitr (~10 March) dominate. Move ad schedules to evenings, plan Eid delivery cut-offs, and treat national days that fall in Ramadan with a calmer tone.'),
            ('Q2', 'Apr–Jun', 'A post-Eid reset in April, then Eid al-Adha (~16 May) and the start of summer. Good months for retention, reviews and testing new offers.'),
            ('Q3', 'Jul–Sep', 'Summer travel lowers activity in many cities; back to school in late August or September brings a sharp spike for retail, education and transport.'),
            ('Q4', 'Oct–Dec', 'Pleasant weather, events and the November sales cluster (11.11 and White Friday), followed by national celebrations and year-end budgets.')]
for k in ORDER:
    c = C[k]; path = f'/gcc/{k}/marketing-calendar-2027/'
    items = [('Home', '/'), ('GCC', '/gcc/'), (c['name'], f'/gcc/{k}/'), ('Calendar 2027', path)]
    rows = ''.join(f'<tr><td><strong>{e(d)}</strong></td><td>{e(t)}</td><td>{e(w)}</td></tr>' for d, t, w in country_dates(c))
    qs = ''.join(f'<div class="gc-q"><span>{q}</span><b>{m}</b><small>{e(t)}</small></div>' for q, m, t in QUARTERS)
    title = f'{c["name"]} Marketing Calendar 2027: Key Dates & Campaign Planner | Hisan Ali'
    desc = f'The {c["name"]} marketing calendar 2027: Ramadan, Eid, national days and the key sales moments in {c["the"]}, with when to start planning each campaign.'
    faq = [(f'When is Ramadan 2027 in {c["the"]}?', 'Ramadan 1448 is expected to begin around 8 February 2027, with Eid al-Fitr around 10 March 2027, subject to the official moon sighting.'),
           (f'What are the biggest marketing moments in {c["the"]} in 2027?', 'Ramadan and Eid al-Fitr in Q1, Eid al-Adha in May, back to school in late summer, and the November and December cluster of sales and national celebrations.'),
           ('How early should I plan GCC campaigns?', 'Plan Ramadan campaigns three to four months ahead, and other peaks about two to three months ahead, warming up audiences four to six weeks before each one.')]
    body = hero(crumbs(items), f'Planning · {e(c["name"])}', f'{e(c["name"])} Marketing Calendar 2027', f'Every date that moves demand in {e(c["the"])} in 2027, in order, with what each one means for your campaigns.', ['Updated October 2026', '6 min read', 'By Hisan Ali']) + f'''
<section class="blog-post-section"><div class="blog-post-container"><article class="blog-post-content" id="blog-content">
<div class="fe-note"><strong>2027 is unusual:</strong> Ramadan is expected to start around 8 February, so several February moments across the GCC fall inside the holy month. Plan evening-led, respectful campaigns.</div>
<h2 class="fe-h2" id="dates"><small>01</small>Key dates in order</h2>
<div class="fe-table-wrap"><table class="fe-table"><thead><tr><th>Date</th><th>Moment</th><th>What it means</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="fe-small">“~” marks expected Islamic dates, confirmed by moon sighting. Official days off are announced by each government and may be moved.</p>
<h2 class="fe-h2" id="quarters"><small>02</small>The year by quarter</h2>
<div class="gc-qs">{qs}</div>
<h2 class="fe-h2" id="runway"><small>03</small>When to start</h2>
<div class="fe-table-wrap"><table class="fe-table"><thead><tr><th>Moment</th><th>Start planning</th><th>Warm up audiences</th></tr></thead><tbody>
<tr><td>Ramadan &amp; Eid al-Fitr</td><td>Oct–Nov 2026</td><td>Mid-January 2027</td></tr><tr><td>Eid al-Adha</td><td>March 2027</td><td>Late April 2027</td></tr><tr><td>Back to school</td><td>May–June 2027</td><td>Late July 2027</td></tr><tr><td>November sales &amp; national days</td><td>August 2027</td><td>Mid-October 2027</td></tr></tbody></table></div>
<div class="gc-links"><a href="/gcc/{k}/">Digital marketing in {e(c["the"])}</a><a href="/gcc/">All GCC markets</a><a href="/resources/oman-marketing-calendar-2027/">Oman calendar (free PDF)</a></div>
{faq_html(faq, k + 'c')}
</article>{sidebar([(f'Digital marketing in {c["name"]}', f'/gcc/{k}/', 'Country guide'), ('Compare GCC markets', '/blog/gcc-digital-marketing-comparison/', 'Country switcher'), ('Ramadan 2027 runway', '/blog/ramadan-2027-marketing-oman/', '120-day plan')])}</div></section>
{cta('Want your 2027 mapped out?', f'I’ll build a 12-month plan for {e(c["the"])}: which moments to own, budgets and timing.', 'Plan my 2027')}'''
    page(path, title, desc, f'{c["name"]} Marketing Calendar 2027', body, f'{c["accent"]} gc-guide', [{'@type': 'WebPage', 'name': f'{c["name"]} Marketing Calendar 2027', 'description': desc, 'url': f'{SITE}{path}', 'inLanguage': 'en'}, faq_ld(faq), bc_ld(items)])

# ---------- Hub ----------
cards = ''.join(f'<div class="gc-card"><span class="gc-flag">{C[k]["flag"]}</span><b>{e(C[k]["name"])}</b><small>{e(C[k]["snapshot"][0][1])}</small><div class="gc-card-links"><a href="/gcc/{k}/">Market guide</a><a href="/gcc/{k}/marketing-calendar-2027/">Calendar 2027</a><a href="/ar/{k}/" lang="ar">العربية</a></div></div>' for k in ORDER)
cards = f'<div class="gc-card gc-card-om"><span class="gc-flag">🇴🇲</span><b>Oman</b><small>My home market: the most guides, studies and tools on this site.</small><div class="gc-card-links"><a href="/gcc/oman/">Market guide</a><a href="/resources/oman-marketing-calendar-2027/">Calendar 2027 (PDF)</a><a href="/ar/" lang="ar">العربية</a></div></div>' + cards
hub_faq = [('Do you work with businesses across the GCC?', 'Yes. I am based in Muscat and work remotely with businesses in Oman, the UAE, Saudi Arabia, Qatar, Bahrain and Kuwait, in Arabic and English.'),
           ('Can one campaign cover all GCC countries?', 'Rarely well. Languages, platforms, holidays and competition differ by country, so most businesses do better with a shared strategy and country-specific campaigns.'),
           ('Which GCC country should I expand to first?', 'Usually the one closest to your current customers, logistics and language. Test with a small, focused campaign before committing big budgets.')]
items = [('Home', '/'), ('GCC', '/gcc/')]
body = hero(crumbs(items), 'GCC · Market Guides', 'Digital Marketing Across the GCC', 'Six countries, one region, very different markets. Country guides, 2027 calendars and side-by-side comparisons for marketing in Oman, the UAE, Saudi Arabia, Qatar, Bahrain and Kuwait.', ['Updated October 2026', 'By Hisan Ali']) + f'''
<section class="blog-post-section"><div class="blog-post-container"><article class="blog-post-content" id="blog-content">
<h2 class="fe-h2" id="countries"><small>01</small>Choose a market</h2>
<div class="gc-cards">{cards}</div>
<h2 class="fe-h2" id="compare"><small>02</small>Compare the markets</h2>
<p>Platforms, language, weekends, data rules and peak seasons, side by side. <a href="/blog/gcc-digital-marketing-comparison/">Open the GCC comparison with the country switcher →</a></p>
<h2 class="fe-h2" id="guides"><small>03</small>Regional guides</h2>
<div class="gc-links"><a href="/blog/gcc-digital-marketing-playbook/">GCC digital marketing playbook</a><a href="/blog/performance-max-gcc-ecommerce/">Performance Max for GCC e-commerce</a><a href="/blog/linkedin-b2b-lead-generation-gcc/">LinkedIn B2B in the GCC</a><a href="/blog/whatsapp-business-gcc/">WhatsApp Business for GCC brands</a><a href="/blog/retargeting-ads-oman/">Retargeting</a><a href="/blog/landing-page-mistakes-oman/">Landing pages</a></div>
{faq_html(hub_faq, 'hub')}
</article>{sidebar([('Compare GCC markets', '/blog/gcc-digital-marketing-comparison/', 'Country switcher'), ('Saudi Arabia guide', '/gcc/ksa/', 'Arabic-first market'), ('UAE guide', '/gcc/uae/', 'International market')])}</div></section>
{cta('Planning to grow across the GCC?', 'I’ll help you choose markets, adapt campaigns per country and measure what works.', 'Talk about the GCC')}'''
page('/gcc/', 'Digital Marketing Across the GCC: Country Guides & 2027 Calendars | Hisan Ali', 'Digital marketing guides for every GCC country: Oman, UAE, Saudi Arabia, Qatar, Bahrain and Kuwait, with platform mixes, data rules, 2027 calendars and comparisons.', 'Digital Marketing Across the GCC', body, 'fe-teal gc-guide', [SERVICE_LD, {'@type': 'CollectionPage', 'name': 'Digital Marketing Across the GCC', 'url': f'{SITE}/gcc/', 'inLanguage': 'en'}, faq_ld(hub_faq), bc_ld(items)])

# ---------- Comparison page with switcher ----------
ALL = ['oman'] + ORDER
OMAN = dict(name='Oman', flag='🇴🇲', weekend='Friday–Saturday', currency='Omani rial (OMR)', language_short='Arabic and English; Arabic builds trust with Omani customers.', platforms_short='Instagram, Google, WhatsApp, Snapchat and TikTok', law_short='Personal Data Protection Law (Royal Decree 6/2022)', peak='Ramadan & Eid, Khareef in Dhofar (summer), National Day 20 Nov', link='/gcc/oman/')
short = {'uae': ('English-led business market; Arabic for Emirati audiences.', 'Google, Instagram, LinkedIn, TikTok, WhatsApp', 'Federal Decree-Law 45/2021 (PDPL)', 'DSF Dec–Jan, Eid Al Etihad 2–3 Dec, White Friday'),
         'ksa': ('Arabic-first, in a natural Saudi register.', 'Snapchat, TikTok, Google, X, Instagram', 'PDPL (SDAIA), enforced Sept 2024', 'Founding Day 22 Feb, National Day 23 Sep, Riyadh Season'),
         'qatar': ('Bilingual; polished Arabic signals quality.', 'Google, Instagram, Snapchat, TikTok, LinkedIn', 'Law No. 13 of 2016', 'National Sport Day (Feb), National Day 18 Dec'),
         'bahrain': ('Bilingual; Arabic also reaches Saudi visitors.', 'Google, Instagram, Snapchat, TikTok, LinkedIn', 'PDPL, Law No. 30 of 2018', 'Bahrain Grand Prix (spring), National Day 16–17 Dec'),
         'kuwait': ('Arabic essential for Kuwaiti audiences.', 'Instagram, Snapchat, Google, TikTok, WhatsApp', 'Data Privacy Protection Regulation (CITRA)', 'Hala February, National & Liberation Days 25–26 Feb')}
rows = [OMAN] + [dict(name=C[k]['name'], flag=C[k]['flag'], weekend=C[k]['weekend'], currency=C[k]['currency'], language_short=short[k][0], platforms_short=short[k][1], law_short=short[k][2], peak=short[k][3], link=f'/gcc/{k}/') for k in ORDER]
table = ''.join(f'<tr><td><strong>{r["flag"]} {e(r["name"])}</strong></td><td>{e(r["platforms_short"])}</td><td>{e(r["language_short"])}</td><td>{e(r["weekend"])}</td><td>{e(r["law_short"])}</td></tr>' for r in rows)
json.dump({r['name']: r for r in rows}, open(os.path.join(R, 'gcc/compare-data.json'), 'w'), ensure_ascii=False)
cmp_faq = [('How is digital marketing different across GCC countries?', 'Platforms, language, weekends, data protection laws and peak seasons all differ. Saudi Arabia is Arabic-first and Snapchat-heavy, the UAE is English-led and international, Kuwait is Instagram-commerce driven, and smaller markets like Qatar and Bahrain reward precise targeting.'),
           ('Which GCC countries have a Friday–Saturday weekend?', 'Oman, Saudi Arabia, Qatar, Bahrain and Kuwait. The UAE moved to a Saturday–Sunday weekend in 2022.'),
           ('Do all GCC countries have data protection laws?', 'Yes. Each has its own personal data rules, from Oman’s PDPL and the UAE’s Federal Decree-Law 45/2021 to Saudi Arabia’s PDPL, Qatar’s Law 13/2016, Bahrain’s Law 30/2018 and Kuwait’s CITRA regulation.')]
items = [('Home', '/'), ('Insights', '/blog/'), ('GCC comparison', '/blog/gcc-digital-marketing-comparison/')]
body = hero(crumbs(items), 'GCC · Comparison', 'Digital Marketing in the GCC: <br>Six Countries Compared', 'Same region, same apps, very different markets. Switch between countries to see how platforms, language, weekends, data rules and peak seasons change, then read the full guide for each.', ['Updated October 2026', '8 min read + country switcher', 'By Hisan Ali']) + f'''
<section class="blog-post-section"><div class="blog-post-container"><article class="blog-post-content" id="blog-content">
<section class="gc-switch" id="switcher" aria-labelledby="gc-sw-title"><span class="fe-kicker">Interactive</span><div class="gc-sw-title" id="gc-sw-title">Pick two countries to compare</div>
<div class="gc-sw-pickers"><div class="gc-sw-col"><span>Country A</span><div class="gc-sw-btns" data-side="a" role="group" aria-label="Country A">{''.join(f'<button type="button" data-c="{e(r["name"])}">{r["flag"]} {e(r["name"])}</button>' for r in rows)}</div></div><div class="gc-sw-col"><span>Country B</span><div class="gc-sw-btns" data-side="b" role="group" aria-label="Country B">{''.join(f'<button type="button" data-c="{e(r["name"])}">{r["flag"]} {e(r["name"])}</button>' for r in rows)}</div></div></div>
<div class="gc-sw-out" id="gc-sw-out" aria-live="polite"></div></section>
<h2 class="fe-h2" id="table"><small>01</small>All six at a glance</h2>
<div class="fe-table-wrap"><table class="fe-table"><thead><tr><th>Country</th><th>Key platforms</th><th>Language</th><th>Weekend</th><th>Data law</th></tr></thead><tbody>{table}</tbody></table></div>
<h2 class="fe-h2" id="lessons"><small>02</small>What this means for regional campaigns</h2>
<div class="fe-cards"><div class="fe-card"><span class="fe-tag">Structure</span><h3>One strategy, separate campaigns</h3><p>Keep the brand and offer consistent, but run each country with its own budget, language, keywords and calendar.</p></div><div class="fe-card"><span class="fe-tag">Language</span><h3>Arabic is not one market</h3><p>Saudi, Kuwaiti and Emirati searchers use different words. Research keywords per country.</p></div><div class="fe-card"><span class="fe-tag">Timing</span><h3>Watch the weekends</h3><p>The UAE’s Saturday–Sunday weekend shifts peak days compared with its neighbours.</p></div><div class="fe-card"><span class="fe-tag">Compliance</span><h3>Six data laws</h3><p>Consent, privacy policies and data transfers must meet each country’s rules.</p></div></div>
{faq_html(cmp_faq, 'cmp')}
<section class="fe-sources" id="method"><h2>Method &amp; sources</h2><p>Updated October 2026. Qualitative comparison from campaign experience across the GCC, with legal references below. Not legal advice.</p><ol>{''.join(f'<li>{e(t)}. <a href="{u}" target="_blank" rel="noopener">{e(u.split("/")[2])}</a></li>' for t, u in SOURCES)}</ol></section>
</article>{sidebar([('All GCC markets', '/gcc/', 'Country guides'), ('Saudi Arabia guide', '/gcc/ksa/', 'Arabic-first'), ('UAE guide', '/gcc/uae/', 'International')])}</div></section>
{cta('Expanding to another GCC country?', 'I’ll adapt your campaigns, language and calendar to each market.', 'Plan my expansion')}'''
page('/blog/gcc-digital-marketing-comparison/', 'GCC Digital Marketing Compared: Oman, UAE, Saudi, Qatar, Bahrain, Kuwait | Hisan Ali', 'Compare digital marketing across the six GCC countries: platforms, Arabic and English, weekends, data protection laws and peak seasons, with an interactive country switcher.', 'Digital Marketing in the GCC: Six Countries Compared', body, 'fe-violet gc-guide', [{'@type': 'BlogPosting', 'headline': 'Digital Marketing in the GCC: Six Countries Compared', 'datePublished': '2026-10-07', 'dateModified': '2026-10-07', 'author': {'@type': 'Person', 'name': 'Hisan Ali', 'url': f'{SITE}/about/'}, 'mainEntityOfPage': f'{SITE}/blog/gcc-digital-marketing-comparison/', 'inLanguage': 'en', 'image': f'{SITE}/blog-gcc-digital-marketing-playbook.webp'}, faq_ld(cmp_faq), bc_ld(items)], js='/gcc/compare.js?v=1')

# ---------- Arabic country pages ----------
AR = {
 'uae': ('التسويق الرقمي في الإمارات', 'سوق دولي تنافسي، تقوده اللغة الإنجليزية في الأعمال، مع أهمية العربية للجمهور الإماراتي.', ['جوجل وخرائط جوجل للبحث المحلي في دبي وأبوظبي', 'إنستغرام ولينكدإن وتيك توك', 'واتساب لتحويل الاستفسارات إلى حجوزات'], 'قانون حماية البيانات الشخصية (المرسوم بقانون اتحادي رقم 45 لسنة 2021)', ['عيد الاتحاد 2–3 ديسمبر', 'مهرجان دبي للتسوق (ديسمبر–يناير)', 'الجمعة البيضاء في نوفمبر']),
 'ksa': ('التسويق الرقمي في السعودية', 'أكبر سوق خليجي وأصغرها سنًا، يكافئ المحتوى العربي أولًا والفيديو القصير.', ['سناب شات وتيك توك للعلامات الاستهلاكية', 'جوجل للبحث المحلي في الرياض وجدة والشرقية', 'إكس وإنستغرام وواتساب'], 'نظام حماية البيانات الشخصية (سدايا)، نافذ بالكامل منذ 14 سبتمبر 2024', ['يوم التأسيس 22 فبراير', 'اليوم الوطني 23 سبتمبر', 'موسم الرياض (من أكتوبر)']),
 'qatar': ('التسويق الرقمي في قطر', 'سوق صغير مرتفع الدخل يتركز في الدوحة، يكافئ الاستهداف الدقيق والسمعة الجيدة.', ['جوجل وخرائط جوجل', 'إنستغرام وسناب شات وتيك توك', 'لينكدإن للأعمال وواتساب للحجوزات'], 'قانون حماية خصوصية البيانات الشخصية (القانون رقم 13 لسنة 2016)', ['اليوم الرياضي للدولة (فبراير)', 'اليوم الوطني 18 ديسمبر', 'الجمعة البيضاء في نوفمبر']),
 'bahrain': ('التسويق الرقمي في البحرين', 'سوق صغير ومترابط، مرتبط بالمنطقة الشرقية في السعودية وزوار عطلة نهاية الأسبوع.', ['جوجل وخرائط جوجل', 'إنستغرام وسناب شات وتيك توك', 'لينكدإن للقطاع المالي وواتساب'], 'قانون حماية البيانات الشخصية (القانون رقم 30 لسنة 2018)', ['سباق جائزة البحرين الكبرى (الربيع)', 'العيد الوطني 16–17 ديسمبر', 'الجمعة البيضاء في نوفمبر']),
 'kuwait': ('التسويق الرقمي في الكويت', 'قوة شرائية عالية وتجارة راسخة عبر إنستغرام وواتساب، حيث يكتشف العميل ويسأل ويطلب في مكان واحد.', ['إنستغرام كواجهة متجر', 'سناب شات وتيك توك', 'جوجل للخدمات والعيادات والبحث المحلي'], 'لائحة حماية خصوصية البيانات (هيئة الاتصالات وتقنية المعلومات)', ['هلا فبراير', 'العيد الوطني 25 فبراير ويوم التحرير 26 فبراير', 'الجمعة البيضاء في نوفمبر']),
}
for k in ORDER:
    t, lead, plats, law, dates = AR[k]; c = C[k]
    url = f'{SITE}/ar/{k}/'; en = f'{SITE}/gcc/{k}/'
    title = f'{t}: سيو، إعلانات جوجل ووسائل التواصل | حسان علي'
    desc = f'{t}: دليل عملي للشركات حول المنصات المناسبة، والمحتوى العربي، والبحث وإعلانات جوجل، وقوانين حماية البيانات، وأهم مواسم 2027.'
    wa = 'https://wa.me/96896110846?text=' + quote(f'مرحبًا حسان، أرغب في مناقشة التسويق الرقمي في {c["ar_name"]}.')
    faq = [(f'هل تعمل مع الشركات في {c["ar_name"]}؟', 'نعم، أعمل عن بُعد من مسقط مع الشركات في دول الخليج، بالعربية والإنجليزية، مع تقارير شهرية واضحة.'),
           ('هل أحتاج إلى محتوى عربي؟', 'غالبًا نعم، وبصفحات وإعلانات مكتوبة لعمليات البحث العربية في هذا البلد تحديدًا، لا بترجمة حرفية.'),
           ('متى يبدأ رمضان 2027؟', 'من المتوقع أن يبدأ رمضان نحو 8 فبراير 2027، وعيد الفطر نحو 10 مارس 2027، بحسب رؤية الهلال.')]
    ld = {'@context': 'https://schema.org', '@graph': [SERVICE_LD | {'name': 'حسان علي – تسويق رقمي', 'url': url}, {'@type': 'WebPage', 'name': title, 'description': desc, 'url': url, 'inLanguage': 'ar'}, faq_ld(faq, 'ar')]}
    cur = ' aria-current="page"'
    arnav = ''.join(f'<a href="/ar/{kk}/"{cur if kk == k else ""}>{C[kk]["ar_name"]}</a>' for kk in ORDER)
    lst = lambda xs: ''.join(f'<div>{e(x)}</div>' for x in xs)
    doc = f'''<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.png">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <meta name="author" content="Hisan Ali"><meta name="robots" content="index, follow">
  <link rel="alternate" hreflang="ar" href="{url}"><link rel="alternate" hreflang="en" href="{en}"><link rel="alternate" hreflang="x-default" href="{en}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website"><meta property="og:locale" content="ar"><meta property="og:url" content="{url}">
  <meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:image" content="https://hisanali.com/about-hisan-portrait.webp">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800&display=swap">
  <link rel="stylesheet" href="/ar/ar.css?v=1">
</head>
<body class="page-ar">
<header class="ua-header hd" data-ua-header data-hd></header>
<main class="ar" lang="ar" dir="rtl">
  <nav class="ar-nav" aria-label="صفحات عربية"><a href="/ar/">الرئيسية</a>{arnav}<a class="ar-en" href="/gcc/{k}/" hreflang="en" lang="en">English</a></nav>
  <section class="ar-hero"><span class="ar-k">{c["flag"]} الخليج · {e(c["ar_name"])}</span><h1>{e(t)}<br><em>خطة واضحة لسوق مختلف</em></h1><p class="ar-lead">{e(lead)}</p>
  <div class="ar-actions"><a class="ar-btn ar-btn-wa" href="{wa}" target="_blank" rel="noopener">تواصل عبر واتساب</a><a class="ar-btn ar-btn-2" href="/gcc/{k}/" hreflang="en">الدليل الكامل بالإنجليزية</a></div></section>
  <section class="ar-sec"><h2>المنصات الأهم</h2><div class="ar-list">{lst(plats)}</div></section>
  <section class="ar-sec"><h2>مواسم مهمة في 2027</h2><div class="ar-list">{lst(dates + ["رمضان متوقع من نحو 8 فبراير، وعيد الفطر نحو 10 مارس", "عيد الأضحى متوقع نحو 16 مايو"])}</div></section>
  <section class="ar-sec"><h2>حماية البيانات</h2><div class="ar-card"><b>{e(law)}</b><span>احصل على موافقة واضحة للتسويق، وانشر سياسة خصوصية بالعربية، واحترم طلبات إلغاء الاشتراك. هذا ليس استشارة قانونية.</span></div></section>
  <section class="ar-sec"><h2>كيف أعمل</h2><div class="ar-steps"><div class="ar-step"><span>1</span><b>أفهم السوق</b><small>العملاء والمنافسون والمواسم في {e(c["ar_name"])}.</small></div><div class="ar-step"><span>2</span><b>أخطط</b><small>خطة لثلاثين إلى تسعين يومًا بأهداف قابلة للقياس.</small></div><div class="ar-step"><span>3</span><b>أنفّذ وأقيس</b><small>سيو وإعلانات ووسائل تواصل مع تتبع الاستفسارات.</small></div><div class="ar-step"><span>4</span><b>أقدّم تقريرًا</b><small>تقرير شهري قصير وصادق.</small></div></div></section>
  <section class="ar-sec ar-faq"><h2>أسئلة شائعة</h2>{''.join(f'<details><summary>{e(q)}</summary><div>{e(a)}</div></details>' for q, a in faq)}</section>
  <section class="ar-cta"><div><b>لنبدأ بمحادثة قصيرة</b><span>أخبرني عن نشاطك وهدفك في {e(c["ar_name"])}.</span></div><a class="ar-btn ar-btn-wa" href="{wa}" target="_blank" rel="noopener">راسلني على واتساب</a></section>
</main>
<footer class="ua-footer" data-ua-footer></footer>
</body>
</html>
'''
    d = os.path.join(R, 'ar', k); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w').write(doc); print('wrote', f'/ar/{k}/')
