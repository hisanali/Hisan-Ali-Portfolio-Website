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
  let cursor = 0;
  const parts = sourceArticle.split(/(<[^>]+>)/g);
  const sourceCount = parts.filter((part) => !part.startsWith("<") && part.trim()).length;
  if (sourceCount !== translations.length) {
    throw new Error(`Expected ${sourceCount} translations, received ${translations.length}`);
  }
  return parts
    .map((part) => {
      if (part.startsWith("<") || !part.trim()) return part;
      const leading = part.match(/^\s*/)?.[0] || "";
      const trailing = part.match(/\s*$/)?.[0] || "";
      return leading + translations[cursor++] + trailing;
    })
    .join("");
}

async function updateLanguageFile(slug, mutate) {
  const html = await fs.readFile(path.join(root, "blog", slug, "index.html"), "utf8");
  const file = path.join(root, "blog", slug, "languages.js");
  const source = await fs.readFile(file, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  mutate(context.window.blogLanguagePage.translations.ml, captureArticle(html));
  await fs.writeFile(
    file,
    `window.blogLanguagePage = ${JSON.stringify(context.window.blogLanguagePage, null, 2)};\n`,
  );
}

const helpfulContentMalayalam = [
  "Helpful Content സംബന്ധിച്ച Google മാർഗ്ഗനിർദേശം ഒരു trick അല്ലെങ്കിൽ toggle കുറിച്ചല്ല. ഒരു യഥാർത്ഥ വ്യക്തിക്ക് യഥാർത്ഥ പ്രശ്നം പരിഹരിക്കാൻ page സഹായിക്കുന്നുണ്ടോ എന്നതാണ് പ്രധാന ചോദ്യം. Search engine-നെ മാത്രം സന്തോഷിപ്പിക്കാൻ എഴുതിയ page ആണെന്ന് വായനക്കാർക്ക് പെട്ടെന്ന് മനസ്സിലാകും. മുന്നോട്ട് പോകാൻ സഹായിക്കുന്ന page ആണെങ്കിൽ trust സ്വാഭാവികമായി വളരും.",
  "ഒരു ലളിതമായ test ചെയ്യാം: Google search വഴി അല്ലാതെ bookmark, referral, അല്ലെങ്കിൽ social share വഴി എത്തിയാലും ഒരാൾ ഈ page തുറന്നതിൽ സന്തോഷിക്കുമോ? ഉത്തരം ഇല്ലെങ്കിൽ content വളരെ shallow, generic, അല്ലെങ്കിൽ brand-focused ആയിരിക്കാം.",
  "പ്രായോഗിക നിയമം:",
  "നല്ല Helpful Content പ്രശ്നം വ്യക്തമായി വിശദീകരിക്കുകയും അടുത്ത step നൽകുകയും വായനക്കാരനെ മുമ്പത്തേക്കാൾ നല്ല തീരുമാനമെടുക്കാൻ സഹായിക്കുകയും വേണം.",
  "Google യഥാർത്ഥത്തിൽ ആവശ്യപ്പെടുന്നത് എന്താണ്?",
  "Google-ന്റെ people-first guidance value, originality, usefulness എന്നിവയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കാനാണ് പറയുന്നത്. എല്ലാ page-വും വലിയ essay ആവേണ്ടതില്ല. പക്ഷേ ഓരോ page-ക്കും വ്യക്തമായ purpose ഉം സഹായിക്കേണ്ട audience ഉം ഉണ്ടായിരിക്കണം.",
  "അതായത് keyword count നിറയ്ക്കാൻ എഴുതാതെ reader ചെയ്യാൻ ശ്രമിക്കുന്ന task മനസ്സിലാക്കി എഴുതണം. ശക്തമായ page ചോദ്യത്തിന് ഉത്തരം നൽകും, ആവശ്യമായ proof കാണിക്കും, article നീട്ടാൻ വേണ്ടി filler ചേർക്കില്ല.",
  "വായനക്കാരന്റെ ആവശ്യം",
  "സഹായകരമായ version",
  "ദുർബലമായ version",
  "വിഷയം മനസ്സിലാക്കുക",
  "ലളിതമായ explanation, പ്രസക്തമായ examples, ആശയത്തിന്റെ short summary.",
  "ഒരേ headline വ്യത്യസ്ത വാക്കുകളിൽ ആവർത്തിക്കുന്ന keyword-stuffed text.",
  "Options താരതമ്യം ചെയ്യുക",
  "Trade-offs, തിരഞ്ഞെടുക്കാനുള്ള criteria, context അനുസരിച്ചുള്ള recommendation.",
  "എങ്ങനെ തിരഞ്ഞെടുക്കണമെന്ന് പറയാത്ത vague list.",
  "Action എടുക്കുക",
  "വ്യക്തമായ steps, proof, എളുപ്പത്തിൽ follow ചെയ്യാവുന്ന next move.",
  "പ്രധാന കാര്യത്തിലേക്ക് ഒരിക്കലും എത്താത്ത motivational intro.",
  "Content scorecard",
  "Publish ചെയ്യുന്നതിന് മുമ്പ് page ഒരു quick scorecard ഉപയോഗിച്ച് പരിശോധിക്കുക. പല മേഖലകളിലും page പരാജയപ്പെടുന്നുവെങ്കിൽ live ആക്കുന്നതിന് മുമ്പ് കൂടുതൽ depth ചേർക്കണം.",
  "Signal",
  "എന്ത് ഉൾപ്പെടുത്തണം",
  "എന്തുകൊണ്ട് പ്രധാനമാണ്",
  "Original value",
  "Example, insight, comparison, checklist, അല്ലെങ്കിൽ local context.",
  "ഇത് നിലവിലുള്ള content-ന്റെ rewrite മാത്രമല്ലെന്ന് തെളിയിക്കുന്നു.",
  "Proof",
  "Experience, process notes, screenshots, data, അല്ലെങ്കിൽ trusted references.",
  "Trust വർധിപ്പിക്കുകയും page വെറും opinion ആയി തോന്നുന്നത് ഒഴിവാക്കുകയും ചെയ്യുന്നു.",
  "Clarity",
  "ചെറിയ sections, നേരിട്ടുള്ള headings, വ്യക്തമായ next step.",
  "അനാവശ്യ friction ഇല്ലാതെ വായനക്കാരനെ മുന്നോട്ട് നയിക്കുന്നു.",
  "Usefulness",
  "വായനക്കാരന് ഇന്ന് തന്നെ പ്രയോഗിക്കാവുന്ന actionable advice.",
  "Search intent-നും user need-നും ഒരേസമയം ശരിയായ ഉത്തരം നൽകാൻ page-നെ സഹായിക്കുന്നു.",
  "Page പ്രശ്നത്തിന് ഉത്തരം നൽകുകയും proof കാണിക്കുകയും സ്വാഭാവികമായ next step നൽകുകയും ചെയ്യുമ്പോഴാണ് Helpful Content ഏറ്റവും നന്നായി പ്രവർത്തിക്കുന്നത്.",
  "ഒരു page യഥാർത്ഥത്തിൽ helpful ആക്കുന്നത് എങ്ങനെ?",
  "First screen മുതൽ തുടങ്ങുക. Page എന്തിനെക്കുറിച്ചാണ്, ആരെ സഹായിക്കുന്നു, എന്ത് outcome നൽകുന്നു എന്നിവ opening വ്യക്തമാക്കണം. തുടർന്ന് reader-ന് പ്രശ്നം ക്രമമായി പരിഹരിക്കാൻ സഹായിക്കുന്ന sections ഉപയോഗിക്കുക.",
  "Branding കൊണ്ടല്ല, പ്രശ്നം കൊണ്ടാണ് തുടങ്ങേണ്ടത്.",
  "ഓരോ section-ലും ഒരു പ്രധാന idea മാത്രം ഉപയോഗിക്കുക.",
  "നിങ്ങൾ സേവനം നൽകുന്ന market-നോട് യോജിക്കുന്ന examples ചേർക്കുക.",
  "Comparison സഹായകരമാകുന്നിടത്ത് checklist അല്ലെങ്കിൽ table നൽകുക.",
  "പെട്ടെന്ന് അവസാനിപ്പിക്കാതെ അടുത്ത useful page-ലേക്ക് link നൽകുക.",
  "Content സാധാരണയായി തെറ്റിപ്പോകുന്നിടങ്ങൾ",
  "പല weak pages-ഉം value-നേക്കാൾ volume-നായി എഴുതുന്നതിനാലാണ് പരാജയപ്പെടുന്നത്. അങ്ങനെ technically published ആയെങ്കിലും യഥാർത്ഥത്തിൽ ഉപയോഗമില്ലാത്ത pages ഉണ്ടാകുന്നു.",
  "Intro വായനക്കാരനേക്കാൾ കൂടുതൽ brand-നെക്കുറിച്ച് സംസാരിക്കുന്നു.",
  "Article ഒരേ point വ്യത്യസ്ത wording-ൽ വീണ്ടും വീണ്ടും ആവർത്തിക്കുന്നു.",
  "Proof, example, അല്ലെങ്കിൽ local detail ഒന്നുമില്ല.",
  "Reader-ന് value ലഭിക്കുന്നതിന് മുമ്പ് CTA കാണിക്കുന്നു.",
  "Page keyword-ന് ഉത്തരം നൽകുന്നു, പക്ഷേ അതിന് പിന്നിലെ യഥാർത്ഥ question പരിഹരിക്കുന്നില്ല.",
  "Official references",
  "Creating helpful, reliable, people-first content",
  "- Pages ആദ്യം users-ന് useful ആക്കാനുള്ള Google-ന്റെ ഏറ്റവും വ്യക്തമായ guidance.",
  "SEO Starter Guide",
  "- Structure, titles, headings, crawl-friendly pages എന്നിവ പരിശോധിക്കാൻ സഹായകരമാണ്.",
  "Google Search Essentials",
  "- Quality-ക്കും technical foundation-ക്കും വേണ്ട broad guidance.",
  "Spam policies for Google Search",
  "- വലിയ തോതിലുള്ള publishing abuse ആയി മാറുന്നുണ്ടോ എന്ന് പരിശോധിക്കാൻ ഉപയോഗിക്കുക.",
  "തുടർന്ന് വായിക്കാം",
  "അടുത്തത് വായിക്കുക",
  "Oman Businesses-നുള്ള SEO Content Brief Framework",
  "അടുത്തത് വായിക്കുക",
  "2026-ൽ SEO Content-നായി AI ഉപയോഗിക്കുന്നത്",
  "അടുത്തത് വായിക്കുക",
  "Oman Businesses-നുള്ള SEO Topic Map",
];

await updateLanguageFile("helpful-content-google-people-first", (copy, sourceArticle) => {
  copy.article = rebuildArticle(sourceArticle, helpfulContentMalayalam);
  copy.authorName = "Hisan Ali";
});

await updateLanguageFile("seo-audit-checklist-small-businesses", (copy, sourceArticle) => {
  const repaired = textNodes(copy.article);
  repaired.splice(
    29,
    1,
    "പ്രായോഗിക നിയമം:",
    "ഒരു SEO audit വിജയകരമാകുന്നത് ആശയക്കുഴപ്പത്തെ ചെറുതും മുൻഗണനാക്രമത്തിലുള്ളതുമായ fix list ആക്കി മാറ്റുമ്പോഴാണ്.",
  );
  copy.article = rebuildArticle(sourceArticle, repaired);
  copy.authorName = "Hisan Ali";
});

await updateLanguageFile("search-intent-seo-success", (copy) => {
  copy.description =
    "Search Intent മനസ്സിലാക്കി content, keywords, landing pages എന്നിവ user expectations-നൊപ്പം align ചെയ്ത് മികച്ച SEO results നേടാനുള്ള practical guide.";
  copy.authorName = "Hisan Ali";
});

console.log("Applied editorial Malayalam repairs to three affected blog translations.");
