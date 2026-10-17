import {studioFetch as fetch} from "../../storage";
import { PACKAGE_FONTS, type PackageFont } from "./packaging-assets";
import {
  netSvg,
  packageNet,
  cutSegments,
  type PackageProject,
} from "./packaging";
export function downloadPackage(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function embeddedNet(
  p: PackageProject,
  guides = true,
  outline = false,
) {
  let svg = netSvg(p, guides);
  const paths = [
    ...new Set(
      [...svg.matchAll(/href="([^"]+)"/g)].map((m) =>
        m[1].replaceAll("&amp;", "&"),
      ),
    ),
  ];
  for (const path of paths) {
    const r = await fetch(path);
    if (!r.ok)
      throw new Error(
        "One artwork file could not be loaded. Try again before exporting.",
      );
    const blob = await r.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    svg = svg.split(path.replaceAll("&", "&amp;")).join(data);
  }
  const fonts = [
    ...new Set(
      Object.values(p.panels).flatMap((panel) =>
        panel.layers
          .filter((l) => l.kind === "text")
          .map((l) => l.font || "muller-regular"),
      ),
    ),
  ];
  const fontBytes = new Map(
    await Promise.all(
      fonts.map(async (key) => {
        const response = await fetch(PACKAGE_FONTS[key].src);
        if (!response.ok)
          throw new Error("A Studio font could not load. Please retry.");
        return [key, new Uint8Array(await response.arrayBuffer())] as const;
      }),
    ),
  );
  if (outline) {
    const fontkit = (await import("@pdf-lib/fontkit")).default,
      doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    for (const text of Array.from(doc.querySelectorAll("text[data-font]"))) {
      const key = text.getAttribute("data-font") as PackageFont,
        font = fontkit.create(fontBytes.get(key)!),
        size = Number(text.getAttribute("font-size")),
        scale = size / font.unitsPerEm,
        group = doc.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("fill", text.getAttribute("fill") || "#000000");
      for (const span of Array.from(text.querySelectorAll("tspan"))) {
        const run = font.layout(span.textContent || "");
        let x = Number(span.getAttribute("x")),
          y = Number(span.getAttribute("y"));
        run.glyphs.forEach((glyph, i) => {
          const pos = run.positions[i],
            path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
          if (glyph.id === 0 && glyph.codePoints.includes(9633)) {
            const a = font.unitsPerEm * 0.08,
              b = font.unitsPerEm * 0.6,
              c = font.unitsPerEm * 0.67;
            path.setAttribute("d", `M${a} 0H${b}V${c}H${a}Z`);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", text.getAttribute("fill") || "#000000");
            path.setAttribute("stroke-width", String(font.unitsPerEm * 0.05));
          } else {
            if (
              glyph.id === 0 &&
              !glyph.codePoints.every((code) => code === 32 || code === 10)
            )
              throw new Error(
                "This font does not support one of the characters in your text. Choose another font or upload that text as artwork.",
              );
            path.setAttribute("d", glyph.path.toSVG());
          }
          path.setAttribute(
            "transform",
            `translate(${x + pos.xOffset * scale} ${y - pos.yOffset * scale}) scale(${scale} ${-scale})`,
          );
          group.appendChild(path);
          x += pos.xAdvance * scale;
          y -= pos.yAdvance * scale;
        });
      }
      text.replaceWith(group);
    }
    svg = new XMLSerializer().serializeToString(doc);
  } else {
    const rules = await Promise.all(
      fonts.map(async (key) => {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(
            new Blob([new Uint8Array(fontBytes.get(key)!)], {
              type: "font/otf",
            }),
          );
        });
        return `@font-face{font-family:'${PACKAGE_FONTS[key].family}';src:url('${data}')} `;
      }),
    );
    svg = svg.replace(
      "</title>",
      "</title><defs><style>" + rules.join("") + "</style></defs>",
    );
  }
  return svg;
}
export async function exportPackage(
  p: PackageProject,
  format: "svg" | "pdf" | "json",
) {
  const name = p.name.replace(/[^\w\s-]/g, "").trim() || "Package";
  if (format === "json") {
    downloadPackage(
      new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
      `${name}.studio-package.json`,
    );
    return;
  }
  const svg = await embeddedNet(p, format === "svg", format === "pdf");
  if (format === "svg") {
    downloadPackage(
      new Blob([svg], { type: "image/svg+xml" }),
      `${name}-dieline.svg`,
    );
    return;
  }
  const { PDFDocument, rgb } = await import("pdf-lib"),
    n = packageNet(p),
    mm = 72 / 25.4,
    pdf = await PDFDocument.create();
  const page = pdf.addPage([n.width * mm, n.height * mm]);
  // Artwork is rasterized at 150 dpi, bounded for mobile memory; cut/fold lines stay vector.
  const scale = Math.min(150 / 25.4, 6000 / Math.max(n.width, n.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.ceil(n.width * scale);
  canvas.height = Math.ceil(n.height * scale);
  const image = new Image(),
    url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error("Artwork could not be prepared for PDF. Try SVG export."),
        );
      image.src = url;
    });
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PDF canvas unavailable.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await pdf.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(png, {
      x: 0,
      y: 0,
      width: n.width * mm,
      height: n.height * mm,
    });
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = canvas.height = 1;
  }
  const line = (x: number, y: number, x2: number, y2: number, fold = false) =>
    page.drawLine({
      start: { x: x * mm, y: (n.height - y) * mm },
      end: { x: x2 * mm, y: (n.height - y2) * mm },
      thickness: 0.5,
      color: fold ? rgb(0.08, 0.47, 0.75) : rgb(0.9, 0.15, 0.5),
      ...(fold ? { dashArray: [4, 2] } : {}),
    });
  for (const [x, y, x2, y2] of cutSegments(p)) line(x, y, x2, y2);
  for (const [x, y, x2, y2] of n.folds) line(x, y, x2, y2, true);
  pdf.setTitle(`${p.name} — nominal mailer dieline`);
  pdf.setSubject(
    "Design proof. Millimetres at 100%. Supplier must confirm board caliper, allowances, bleed and cutting tooling. RGB artwork.",
  );
  downloadPackage(
    new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }),
    `${name}-dieline-proof.pdf`,
  );
}
