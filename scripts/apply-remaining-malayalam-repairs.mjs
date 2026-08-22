import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();

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

function rebuildArticle(sourceArticle, translations) {
  const parts = sourceArticle.split(/(<[^>]+>)/g);
  const sourceCount = parts.filter((part) => !part.startsWith("<") && part.trim()).length;
  if (sourceCount !== translations.length) {
    throw new Error(`Expected ${sourceCount} translations, received ${translations.length}`);
  }
  let cursor = 0;
  return parts
    .map((part) => {
      if (part.startsWith("<") || !part.trim()) return part;
      const leading = part.match(/^\s*/)?.[0] || "";
      const trailing = part.match(/\s*$/)?.[0] || "";
      return leading + translations[cursor++] + trailing;
    })
    .join("");
}

async function repair(slug, edit) {
  const html = await fs.readFile(path.join(root, "blog", slug, "index.html"), "utf8");
  const sourceArticle = captureArticle(html);
  const file = path.join(root, "blog", slug, "languages.js");
  const source = await fs.readFile(file, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const copy = context.window.blogLanguagePage.translations.ml;
  const nodes = textNodes(copy.article);
  edit(nodes);
  copy.article = rebuildArticle(sourceArticle, nodes);
  await fs.writeFile(
    file,
    `window.blogLanguagePage = ${JSON.stringify(context.window.blogLanguagePage, null, 2)};\n`,
  );
  console.log(`Repaired ${slug} Malayalam.`);
}

await repair("ai-search-visibility-2026", (nodes) => {
  nodes.splice(
    86,
    1,
    "AI Overviews article",
    "updated ആയി നിലനിർത്തുക; നിങ്ങളുടെ",
  );
});

await repair("fifa-world-cup-2026-fixtures-marketing", (nodes) => {
  nodes.splice(
    54,
    8,
    "GCC brands-ന് event-നെ യഥാർത്ഥ business pages-ുമായി ബന്ധിപ്പിക്കുന്ന internal links ആണ് ഏറ്റവും ശക്തം. Event സമയത്തെ demand capture ചെയ്യാൻ ഈ post നിങ്ങളുടെ",
    "trendjacking guide",
    ", നിങ്ങളുടെ",
    "social media marketing page",
    ", നിങ്ങളുടെ",
    "YouTube Shorts framework",
    ", കൂടാതെ നിങ്ങളുടെ",
    "World Cup marketing playbook",
    "എന്നിവയുമായി ബന്ധിപ്പിക്കുക. അങ്ങനെ idea മുതൽ execution വരെ reader-ന് വ്യക്തമായ വഴി ലഭിക്കും.",
  );
});

await repair("fifa-world-cup-2026-marketing-gcc", (nodes) => {
  nodes.splice(
    55,
    6,
    "GCC brands-ന് event-നെ യഥാർത്ഥ business pages-ുമായി ബന്ധിപ്പിക്കുന്ന internal links ആണ് പലപ്പോഴും ഏറ്റവും ശക്തം. Event സമയത്തെ demand capture ചെയ്യാൻ ഈ post നിങ്ങളുടെ",
    "trendjacking guide",
    ", നിങ്ങളുടെ",
    "social media marketing page",
    ", കൂടാതെ നിങ്ങളുടെ",
    "YouTube Shorts framework",
    "എന്നിവയുമായി ബന്ധിപ്പിക്കുക. അങ്ങനെ idea മുതൽ execution വരെ reader-ന് വ്യക്തമായ വഴി ലഭിക്കും.",
  );
});

await repair("oman-data-privacy-marketing-guide", (nodes) => {
  nodes.splice(
    42,
    10,
    "ചെയ്യേണ്ടത്",
    "ഓരോ channel-നും അനുയോജ്യമായ consent language ഉപയോഗിക്കുക.",
    "Sender ആരാണെന്ന് വ്യക്തമായി കാണിക്കുക.",
    "ഓരോ campaign-ലും എളുപ്പമുള്ള opt-out നൽകുക.",
    "എല്ലാ tools-ലും ഒരേ suppression list നിലനിർത്തുക.",
    "Consent പിൻവലിച്ചാൽ automation നിൽക്കുന്നുണ്ടെന്ന് test ചെയ്യുക.",
    "ചെയ്യരുതാത്തത്",
    "Source വ്യക്തമല്ലാത്ത lists വാങ്ങരുത്.",
    "എല്ലാ customers-നെയും default ആയി ad platforms-ലേക്ക് upload ചെയ്യരുത്.",
    "Marketing-ുമായി ബന്ധമില്ലാത്ത terms-ൽ consent ഒളിപ്പിക്കരുത്.",
    "Stop request ലഭിച്ചതിന് ശേഷവും messages അയക്കരുത്.",
    "CRM data അനാവശ്യമായി personal devices-ലേക്ക് export ചെയ്യരുത്.",
  );
  nodes.splice(88, 0, "Oman Personal Data Protection Law");
});

await repair("whatsapp-commerce-oman-2026", (nodes) => {
  if (/loading=|ivager/i.test(nodes[0] || "")) nodes.shift();
});

console.log("Applied the remaining five Malayalam structure repairs.");
