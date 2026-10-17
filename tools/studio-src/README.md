# Public browser studios

Adapted from the owner’s existing internal authoring tools. These public
editions contain generic templates and browser-local persistence.

- `/tools/pdf-editor/`: native PDF text/image editing, annotations, camera scan,
  OCR, signatures, page arrangement, PDF/image export.
- `/tools/packaging-studio/`: linked artwork/dieline/Three.js preview, dimensions,
  materials, imported artwork, local project library, portable project ZIP,
  SVG, RGB PDF, EPS and mockup exports. Starts with matte kraft.

The committed `../studio-runtime/bundle/` is deployable as static files; there is
no new server API and no runtime compilation. Prepare updated artifacts with:

```sh
npm ci --prefix tools/studio-src --ignore-scripts
node scripts/build-browser-studios.mjs
```

`storage.ts` handles only this tool's virtual project/library calls, using
IndexedDB; it never contacts an external application API and does not override global fetch.
Artwork is embedded as data URLs for self-contained saves/portable exports.
Drafts and saved projects are local to this browser; exporting a project is the
backup/transfer path. Source files and dependency trees are blocked by the public
static route. No accounts, staff data, credentials, uploaded files, company logos,
or reviewed company-specific fold-map profiles are copied.

Native AI/CDR/PSD conversion and validated production PDF/X require a
server processor and are not offered by this public browser edition. Export
PDF/SVG from native design software before importing. Public PDF output is RGB;
printer colour separation/preflight remains a separate production step.

Fonts are Liberation Sans (SIL OFL), replacing the original paid/private font
families while retaining internal project font IDs for compatibility. Existing
company-specific template categories have generic text and no logo assets.

## Credits

React/React DOM, Three.js, Lucide, PDF-lib, fontkit, Fabric, fflate, jsPDF,
svg2pdf.js, PDF.js and Tesseract retain their upstream licenses. Runtime notices
are in `../studio-runtime/THIRD-PARTY-LICENSES.txt` and bundle `*.LEGAL.txt` files.
PDF.js standard fonts have their own notices in `datasheets/standard-fonts/`;
OCR engine notices are in `datasheets/ocr/`.

PBR materials: ambientCG Paper001, Paper006, Wood095, Concrete034, Marble012,
CC0; exact source URLs and map lists are retained in
`../studio-runtime/packaging/scenes/materials/manifest.json`.
Studio environment: Poly Haven Studio Small 09, CC0,
https://polyhaven.com/a/studio_small_09. The original HDR uses `.bin` for the
site's static route, with unchanged Radiance contents.

Run `node scripts/test-browser-studios.cjs` against a repository-root static
server on port 8765. Set `STUDIOS_BASE` to exercise a different host and
`PLAYWRIGHT_MODULE` to an installed Playwright module if needed.
