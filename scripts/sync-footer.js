const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SNIPPET_PATH = path.join(ROOT_DIR, 'snippets', 'footer.html');
const FOOTER_PATTERN = /<footer class="footer">[\s\S]*?<\/footer>/;
const SKIP_DIRS = new Set(['.git', '.next', 'node_modules', 'snippets']);

function getHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.git')) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...getHtmlFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (path.extname(entry.name).toLowerCase() !== '.html') continue;
    if (entry.name.startsWith('tmp-')) continue;

    files.push(relativePath);
  }

  return files;
}

function normalizeForFile(snippet, content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  return snippet.replace(/\n/g, eol);
}

function main() {
  const footerSnippet = fs.readFileSync(SNIPPET_PATH, 'utf8').trimEnd();
  const htmlFiles = getHtmlFiles(ROOT_DIR);
  let updated = 0;
  let skipped = 0;

  for (const relativePath of htmlFiles) {
    const fullPath = path.join(ROOT_DIR, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (!FOOTER_PATTERN.test(content)) {
      skipped += 1;
      continue;
    }

    const replacement = normalizeForFile(footerSnippet, content);
    const nextContent = content.replace(FOOTER_PATTERN, replacement);

    if (nextContent !== content) {
      fs.writeFileSync(fullPath, nextContent, 'utf8');
      updated += 1;
    }
  }

  console.log(`Footer sync complete. Updated ${updated} files, skipped ${skipped} files.`);
}

main();
