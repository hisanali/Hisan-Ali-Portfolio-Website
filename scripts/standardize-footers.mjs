import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const footerPath = resolve(projectRoot, "snippets/footer.html");
const canonicalFooter = (await readFile(footerPath, "utf8")).trim();
const htmlFiles = execFileSync(
    "rg",
    ["--files", "-g", "*.html", "-g", "!node_modules/**", "-g", "!.next/**"],
    { cwd: projectRoot, encoding: "utf8" }
).trim().split("\n").filter(Boolean);

let replaced = 0;
let inserted = 0;

for (const relativePath of htmlFiles) {
    if (relativePath === "snippets/footer.html") continue;

    const filePath = resolve(projectRoot, relativePath);
    const source = await readFile(filePath, "utf8");
    const footerPattern = /<footer\s+class=["']footer["'][^>]*>[\s\S]*?<\/footer>/i;
    let updated = source;

    if (footerPattern.test(source)) {
        updated = source.replace(footerPattern, canonicalFooter);
        replaced += 1;
    } else if (/<\/body>/i.test(source)) {
        updated = source.replace(/<\/body>/i, `${canonicalFooter}\n</body>`);
        inserted += 1;
    } else {
        throw new Error(`Cannot place footer in ${relativePath}: missing </body>`);
    }

    if (updated !== source) {
        await writeFile(filePath, updated);
    }
}

console.log(`Standardized ${replaced} existing footers and added ${inserted} missing footers.`);
