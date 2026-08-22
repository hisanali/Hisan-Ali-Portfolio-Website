import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const slugs = process.argv.slice(2);
const locales = ["ar", "ml", "hi"];
const localePatterns = {
  ar: /[\u0600-\u06ff]/g,
  ml: /[\u0d00-\u0d7f]/g,
  hi: /[\u0900-\u097f]/g,
};
const suspicious =
  /data-key|ZXQ|ZXZ|Read more|More information|I'm sorry|What is the reason|<\s*\/\s*[^\x00-\x7f]/i;

function captureArticle(html) {
  return /<article\b[^>]*class="[^"]*blog-post-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i.exec(
    html,
  )?.[1]?.trim();
}

function structureSignature(html = "") {
  return [...html.matchAll(/<\s*(\/?)\s*([a-z][a-z0-9-]*)\b([^>]*)>/gi)]
    .map((match) => {
      const attributes = match[3];
      const stable = ["class", "href", "src", "target", "rel"]
        .map((name) => {
          const value = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(
            attributes,
          )?.[1];
          return value == null ? "" : `${name}=${value}`;
        })
        .filter(Boolean)
        .join(";");
      return `${match[1] ? "/" : ""}${match[2].toLowerCase()}[${stable}]`;
    })
    .join("|");
}

function visibleText(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

let failures = 0;
for (const slug of slugs) {
  const html = await fs.readFile(path.join(root, "blog", slug, "index.html"), "utf8");
  const original = captureArticle(html);
  const source = await fs.readFile(path.join(root, "blog", slug, "languages.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const translations = context.window.blogLanguagePage?.translations || {};

  for (const locale of locales) {
    const copy = translations[locale];
    const article = copy?.article || "";
    const text = visibleText(article);
    const localeCharacters = (text.match(localePatterns[locale]) || []).length;
    const structureOk = structureSignature(article) === structureSignature(original);
    const suspiciousContent = suspicious.test(article);
    const requiredOk = Boolean(copy?.heading && copy?.description && article);
    const languageOk = localeCharacters >= 80;
    const ok = structureOk && !suspiciousContent && requiredOk && languageOk;
    if (!ok) failures += 1;
    console.log(
      [
        ok ? "PASS" : "FAIL",
        slug,
        locale,
        `structure=${structureOk}`,
        `languageChars=${localeCharacters}`,
        `suspicious=${suspiciousContent}`,
        `required=${requiredOk}`,
      ].join("\t"),
    );
  }
}

if (failures) {
  console.error(`Translation audit failed for ${failures} locale version(s).`);
  process.exitCode = 1;
} else {
  console.log(`Translation audit passed for ${slugs.length * locales.length} locale versions.`);
}
