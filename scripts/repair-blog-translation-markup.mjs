import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const slugs = process.argv.slice(2);
const locales = ["ar", "ml", "hi"];

function captureArticle(html) {
  return /<article\b[^>]*class="[^"]*blog-post-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i.exec(
    html,
  )?.[1]?.trim();
}

function textNodes(html) {
  return html
    .split(/(<[^>]+>)/g)
    .filter((part) => !part.startsWith("<") && part.trim())
    .map((part) => part.trim());
}

function rebuildArticle(sourceArticle, translatedArticle) {
  const translatedNodes = textNodes(translatedArticle);
  let cursor = 0;
  const parts = sourceArticle.split(/(<[^>]+>)/g);
  const sourceCount = parts.filter((part) => !part.startsWith("<") && part.trim()).length;
  if (sourceCount !== translatedNodes.length) return null;

  return parts
    .map((part) => {
      if (part.startsWith("<") || !part.trim()) return part;
      const leading = part.match(/^\s*/)?.[0] || "";
      const trailing = part.match(/\s*$/)?.[0] || "";
      return leading + translatedNodes[cursor++] + trailing;
    })
    .join("");
}

let repaired = 0;
let skipped = 0;
for (const slug of slugs) {
  const html = await fs.readFile(path.join(root, "blog", slug, "index.html"), "utf8");
  const sourceArticle = captureArticle(html);
  const languageFile = path.join(root, "blog", slug, "languages.js");
  const source = await fs.readFile(languageFile, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const config = context.window.blogLanguagePage;

  for (const locale of locales) {
    const copy = config.translations[locale];
    const rebuilt = rebuildArticle(sourceArticle, copy.article);
    if (!rebuilt) {
      console.log(`SKIP\t${slug}\t${locale}\ttext-node count differs`);
      skipped += 1;
      continue;
    }
    copy.article = rebuilt;
    copy.authorName = "Hisan Ali";
    console.log(`REPAIRED\t${slug}\t${locale}`);
    repaired += 1;
  }

  await fs.writeFile(
    languageFile,
    `window.blogLanguagePage = ${JSON.stringify(config, null, 2)};\n`,
  );
}

console.log(`Repaired ${repaired} locale versions; skipped ${skipped}.`);
