import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const slugs = [
  "oman-business-launch-checklist",
  "oman-e-invoicing-2026-guide",
  "oman-data-privacy-marketing-guide",
  "whatsapp-commerce-oman-2026",
  "fifa-world-cup-2026-fixtures-marketing",
  "var-referee-rules-explained",
  "fifa-world-cup-2026-marketing-gcc",
  "ai-search-visibility-2026",
  "ai-max-search-campaigns-oman",
  "server-side-tracking-ga4-oman",
];
const locales = ["ar", "ml", "hi"];
const localeNames = { ar: "العربية", ml: "മലയാളം", hi: "हिन्दी" };
const endpoint = "https://translate.googleapis.com/translate_a/single";

const decodeEntities = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&ndash;", "–")
    .replaceAll("&mdash;", "—")
    .replaceAll("&nbsp;", " ");

const stripTags = (value = "") =>
  decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

function firstMatch(html, pattern, fallback = "") {
  return pattern.exec(html)?.[1]?.trim() || fallback;
}

function captureArticle(html) {
  const match = /<article\b[^>]*class="[^"]*blog-post-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i.exec(html);
  if (!match) throw new Error("Article content not found");
  return match[1].trim();
}

function captureShell(html) {
  const header = firstMatch(
    html,
    /<div class="blog-post-header">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/i,
  );
  const breadcrumbSpans = [...header.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
  const metaBlock = firstMatch(header, /<div class="blog-post-meta">([\s\S]*?)<\/div>/i);
  const meta = [...metaBlock.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map((match) =>
    match[1].trim(),
  );
  const author = firstMatch(html, /<div class="author-card">([\s\S]*?)<\/div>/i);
  const related = firstMatch(html, /<div class="related-posts">([\s\S]*?)<\/div>/i);
  const cta = firstMatch(html, /<div class="cta-content">([\s\S]*?)<\/div>/i);

  return {
    title: stripTags(firstMatch(html, /<title>([\s\S]*?)<\/title>/i)),
    description: decodeEntities(
      firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
    ),
    breadcrumb: stripTags(breadcrumbSpans.at(-1)?.[1] || ""),
    category: stripTags(firstMatch(header, /<div class="blog-category">([\s\S]*?)<\/div>/i)),
    heading: stripTags(firstMatch(header, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    meta,
    authorName: stripTags(firstMatch(author, /<h3[^>]*>([\s\S]*?)<\/h3>/i)),
    authorTitle: stripTags(
      firstMatch(author, /<p[^>]*class="author-title"[^>]*>([\s\S]*?)<\/p>/i),
    ),
    authorBio: stripTags(
      [...author.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].at(-1)?.[1] || "",
    ),
    relatedHeading: stripTags(firstMatch(related, /<h3[^>]*>([\s\S]*?)<\/h3>/i)),
    relatedTitles: [...related.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)].map((match) =>
      stripTags(match[1]),
    ),
    relatedMeta: [...related.matchAll(/<p[^>]*class="meta"[^>]*>([\s\S]*?)<\/p>/gi)].map(
      (match) => stripTags(match[1]),
    ),
    ctaHeading: stripTags(firstMatch(cta, /<h2[^>]*>([\s\S]*?)<\/h2>/i)),
    ctaText: stripTags(firstMatch(cta, /<p[^>]*>([\s\S]*?)<\/p>/i)),
    ctaButton: stripTags(firstMatch(cta, /<span[^>]*>([\s\S]*?)<\/span>/i)),
  };
}

function protectTerms(value) {
  const terms = [
    "Google Analytics 4",
    "Google Tag Manager",
    "Google Ads",
    "AI Max",
    "WhatsApp Business",
    "WhatsApp",
    "FIFA World Cup 2026",
    "FIFA World Cup",
    "FIFA",
    "GA4",
    "GTM",
    "VAR",
    "VAT",
    "ROI",
    "ROAS",
    "GDPR",
    "SEO",
    "CRM",
    "API",
  ];
  const replacements = [];
  let output = value;
  terms.forEach((term) => {
    const token = `ZXQ${String(replacements.length).padStart(3, "0")}QXZ`;
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    if (pattern.test(output)) {
      output = output.replace(pattern, token);
      replacements.push([token, term]);
    }
  });
  return { output, replacements };
}

function restoreTerms(value, replacements) {
  let output = value;
  replacements.forEach(([token, term]) => {
    output = output.replaceAll(token, term).replaceAll(token.toLowerCase(), term);
  });
  return output;
}

async function translateHtml(html, target) {
  if (!stripTags(html)) return html;
  const { output, replacements } = protectTerms(html);
  const body = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: target,
    dt: "t",
    q: output,
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = (data[0] || []).map((part) => part[0] || "").join("");
  return restoreTerms(translated, replacements);
}

function splitHtml(html, maxLength = 6500) {
  if (html.length <= maxLength) return [html];
  const parts = [];
  let rest = html;
  while (rest.length > maxLength) {
    const window = rest.slice(0, maxLength);
    const candidates = ["</p>", "</li>", "</h2>", "</h3>", "</div>", "</section>"];
    let cut = -1;
    for (const marker of candidates) cut = Math.max(cut, window.lastIndexOf(marker));
    cut = cut > maxLength * 0.45 ? cut + window.slice(cut).match(/^<\/[^>]+>/)?.[0].length : window.lastIndexOf(">");
    if (!cut || cut < 1) cut = maxLength;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) parts.push(rest);
  return parts;
}

async function translateLongHtml(html, target) {
  const chunks = splitHtml(html);
  const translated = [];
  for (const chunk of chunks) {
    translated.push(await translateHtml(chunk, target));
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  return translated.join("");
}

function shellToMarkup(shell) {
  const entries = [];
  Object.entries(shell).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        entries.push(`<p data-key="${key}-${index}">${item}</p>`);
      });
    } else {
      entries.push(`<p data-key="${key}">${value}</p>`);
    }
  });
  return entries.join("");
}

function markupToShell(markup, original) {
  const translated = {};
  for (const match of markup.matchAll(/<p\s+data-key="([^"]+)"[^>]*>([\s\S]*?)<\/p>/gi)) {
    const key = match[1];
    const value = stripTags(match[2]);
    const arrayMatch = /^(.*)-(\d+)$/.exec(key);
    if (arrayMatch) {
      translated[arrayMatch[1]] ||= [];
      translated[arrayMatch[1]][Number(arrayMatch[2])] = value;
    } else {
      translated[key] = value;
    }
  }
  for (const [key, value] of Object.entries(original)) {
    if (translated[key] == null) translated[key] = value;
  }
  return translated;
}

function normalizeLocale(copy, locale) {
  const localized = { ...copy };
  localized.title = localized.title.replace(/\s*\|\s*Hisan Ali\s*$/i, " | Hisan Ali");
  localized.changed =
    locale === "ar"
      ? "تم عرض المقال بالعربية"
      : locale === "ml"
        ? "ലേഖനം മലയാളത്തിൽ കാണിക്കുന്നു"
        : "लेख हिन्दी में दिखाया जा रहा है";
  return localized;
}

function serializeConfig(translations) {
  return `window.blogLanguagePage = ${JSON.stringify({ translations }, null, 2)};\n`;
}

async function ensurePageAssets(slug, htmlPath, html) {
  let updated = html;
  if (!/<article\b[^>]*\bid="blog-content"/i.test(updated)) {
    updated = updated.replace(
      /<article\b([^>]*class="[^"]*blog-post-content[^"]*"[^>]*)>/i,
      '<article id="blog-content"$1>',
    );
  }
  if (!updated.includes('href="/blog-language-picker.css"')) {
    updated = updated.replace(
      /(<link rel="stylesheet" href="(?:\.\.\/\.\.\/|\/)blog\.css">)/i,
      '$1<link rel="stylesheet" href="/blog-language-picker.css">',
    );
  }
  if (!updated.includes("Noto+Sans+Arabic")) {
    updated = updated.replace(
      /(<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+" rel="stylesheet">)/i,
      '$1<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap" rel="stylesheet">',
    );
  }
  if (!updated.includes("/blog-language-picker.js")) {
    updated = updated.replace(
      /(<script src="(?:\.\.\/\.\.\/|\/)script\.js"><\/script>)/i,
      `$1<script src="/blog/${slug}/languages.js"></script><script src="/blog-language-picker.js"></script>`,
    );
  }
  if (updated !== html) await fs.writeFile(htmlPath, updated);
}

for (const [slugIndex, slug] of slugs.entries()) {
  const directory = path.join(root, "blog", slug);
  const htmlPath = path.join(directory, "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  const shell = captureShell(html);
  const article = captureArticle(html);
  const translations = {};

  for (const locale of locales) {
    process.stdout.write(
      `[${slugIndex + 1}/${slugs.length}] ${slug} → ${localeNames[locale]}... `,
    );
    const [translatedShellMarkup, translatedArticle] = await Promise.all([
      translateHtml(shellToMarkup(shell), locale),
      translateLongHtml(article, locale),
    ]);
    translations[locale] = normalizeLocale(
      {
        ...markupToShell(translatedShellMarkup, shell),
        article: translatedArticle,
      },
      locale,
    );
    process.stdout.write("done\n");
  }

  await fs.writeFile(path.join(directory, "languages.js"), serializeConfig(translations));
  await ensurePageAssets(slug, htmlPath, html);
}

console.log(`Generated ${slugs.length * locales.length} localized article versions.`);
