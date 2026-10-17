import {studioFetch as fetch} from "../../storage";
import {panelPathData,cutterPathData} from "./packaging-contours";
import {
  generatedNet,
  netEdges,
  foldEdges,
  type StudioProject,
} from "./packaging-document";
import { panelCanvas } from "../packaging/canvas";
import { PACKAGE_FONTS } from "./packaging-assets";
import { downloadPackage } from "./packaging-export";
import {encodePdfMap,PDF_MAP_NAMESPACE} from './packaging-pdf-map';
const ns = "http://www.w3.org/2000/svg";
export async function embedSVG(svg: string, outline = false) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror"))
    throw new Error("Artwork export could not be prepared.");
  const fonts = Object.entries(PACKAGE_FONTS);
  if (outline) {
    const kit = (await import("@pdf-lib/fontkit")).default,
      cache = new Map<string, any>();
    const style = (node: Element, key: string, fallback: string) =>
      node.getAttribute(key) ||
      node
        .getAttribute("style")
        ?.split(";")
        .find((s) => s.split(":")[0].trim() === key)
        ?.split(":")
        .slice(1)
        .join(":")
        .trim() ||
      fallback;
    for (const text of Array.from(doc.querySelectorAll("text"))) {
      const group = doc.createElementNS(ns, "g");
      if (text.getAttribute("transform"))
        group.setAttribute("transform", text.getAttribute("transform")!);
      const parentFamily = style(
        text,
        "font-family",
        "PKMullerRegular",
      ).replaceAll(/["']/g, "");
      let cursorX = Number(text.getAttribute("x") || 0),
        cursorY = Number(text.getAttribute("y") || 0);
      const spans = Array.from(text.querySelectorAll("tspan"));
      for (const span of spans.length ? spans : [text]) {
        const family = style(span, "font-family", parentFamily),
          fontInfo =
            fonts.find(([, v]) => family.includes(v.family))?.[1] ||
            PACKAGE_FONTS["muller-regular"];
        let font = cache.get(fontInfo.src);
        if (!font) {
          const r = await fetch(fontInfo.src);
          if (!r.ok) throw new Error("A required font could not load.");
          font = kit.create(new Uint8Array(await r.arrayBuffer()));
          cache.set(fontInfo.src, font);
        }
        const size = Number(
            style(span, "font-size", style(text, "font-size", "12")).replace(
              "px",
              "",
            ),
          ),
          scale = size / font.unitsPerEm,
          x = span.hasAttribute("x")
            ? Number(span.getAttribute("x"))
            : cursorX + Number(span.getAttribute("dx") || 0),
          y = span.hasAttribute("y")
            ? Number(span.getAttribute("y"))
            : cursorY + Number(span.getAttribute("dy") || 0),
          run = font.layout(span.textContent || "");
        let offset = x;
        for (let i = 0; i < run.glyphs.length; i++) {
          const glyph = run.glyphs[i],
            pos = run.positions[i];
          if (glyph.id === 0 && !(span.textContent || "")[i]?.match(/\s/))
            throw new Error(
              "This font does not contain one of the characters. Choose a supported font.",
            );
          const path = doc.createElementNS(ns, "path");
          path.setAttribute("d", glyph.path.toSVG());
          path.setAttribute(
            "transform",
            `translate(${offset + pos.xOffset * scale} ${y - pos.yOffset * scale}) scale(${scale} ${-scale})`,
          );
          path.setAttribute(
            "fill",
            style(span, "fill", style(text, "fill", "#222222")),
          );
          group.appendChild(path);
          offset += pos.xAdvance * scale;
        }
        cursorX = offset;
        cursorY = y;
      }
      text.replaceWith(group);
    }
  }
  for (const img of Array.from(doc.querySelectorAll("image"))) {
    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
    if (!href || href.startsWith("data:")) continue;
    const r = await fetch(href);
    if (!r.ok)
      throw new Error("An image is unavailable. Replace it before exporting.");
    const blob = await r.blob(),
      data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    img.removeAttribute("xlink:href");
    img.setAttribute("href", data);
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
export async function studioNetSVG(
  p: StudioProject,
  inside = false,
  outline = true,
  guides = true,
) {
  const n = generatedNet(p);
  let body = "";
  for (const q of n.pieces) {
    const panel = q.face ? p.panels[q.face] : null;
    let artwork = "";
    if (panel) {
      const rendered = await panelCanvas(panel, inside, 1);
      artwork = await embedSVG(rendered.svg(), outline);
      await rendered.dispose();
    }
    const points = q.points || [
        [0, 0],
        [q.w, 0],
        [q.w, q.h],
        [0, q.h],
      ],
      clip = `clip-${q.id}`;
    body += `<defs><clipPath id="${clip}"><path d="${panelPathData(q)}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath></defs><g transform="translate(${q.x} ${q.y})" clip-path="url(#${clip})"><rect width="${q.w}" height="${q.h}" fill="${panel ? (inside ? panel.insideColor : panel.color) : p.material === "kraft" ? "#cba878" : "#f4f1e9"}"/>${artwork}</g>`;
  }
  if (guides) {
    if(n.sourcePaths) body += n.sourcePaths.map(path=>`<path d="${cutterPathData(path)}" fill="none" stroke="${path.kind==='cut'?'#c65d75':'#358d80'}" stroke-width=".25"${path.kind==='fold'?' stroke-dasharray="2 1"':''}/>`).join('');
    else {
    body += `<g fill="none" stroke="#c65d75" stroke-width=".25">${netEdges(n)
      .map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}"/>`)
      .join(
        "",
      )}</g><g fill="none" stroke="#358d80" stroke-width=".25" stroke-dasharray="2 1">${foldEdges(
      n,
    )
      .map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}"/>`)
      .join("")}</g>`;
    }
  }
  return `<svg xmlns="${ns}" width="${n.width}mm" height="${n.height}mm" viewBox="0 0 ${n.width} ${n.height}">${body}</svg>`;
}
export async function screenProof(p: StudioProject, inside = false) {
  const { jsPDF } = await import("jspdf");
  await import("svg2pdf.js");
  const svg = await studioNetSVG(p, inside, true),
    n = generatedNet(p),
    doc = new jsPDF({
      orientation: n.width > n.height ? "landscape" : "portrait",
      unit: "mm",
      format: [n.width, n.height],
      compress: true,
    });
  const element = new DOMParser().parseFromString(
    svg,
    "image/svg+xml",
  ).documentElement;
  await doc.svg(element as unknown as SVGElement, {
    x: 0,
    y: 0,
    width: n.width,
    height: n.height,
  });
  doc.setProperties({
    title: p.name + " — artwork and dieline",
    subject: "Actual-size RGB design interchange: artwork with vector cut and fold paths. Text outlined; placed images remain raster. Not a validated production PDF.",
  });
  const foldMap=encodePdfMap(p);
  if(foldMap)doc.addMetadata(foldMap,PDF_MAP_NAMESPACE);
  return doc.output("blob");
}
export async function portableProject(p: StudioProject) {
  const { zipSync, strToU8 } = await import("fflate");
  const files: Record<string, Uint8Array> = {
    "project.json": strToU8(JSON.stringify(p, null, 2)),
  };
  const assets = new Set<string>();
  function scan(v: any) {
    if (!v || typeof v !== "object") return;
    for (const [key, val] of Object.entries(v)) {
      if (
        typeof val === "string" &&
        ["src", "source", "preview", "backgroundImage", "iccAsset"].includes(
          key,
        ) &&
        val.startsWith("/")
      )
        assets.add(val);
      else if (val && typeof val === "object") scan(val);
    }
  }
  scan(p);
  const manifest: Record<string, string> = {};
  let i = 0;
  for (const src of assets) {
    const response = await fetch(src);
    if (!response.ok)
      throw new Error(
        "A project asset could not load. Replace it before exporting.",
      );
    const name = `assets/${i++}.${response.headers.get("content-type")?.includes("svg") ? "svg" : response.headers.get("content-type")?.includes("jpeg") ? "jpg" : "png"}`;
    manifest[src] = name;
    files[name] = new Uint8Array(await response.arrayBuffer());
  }
  for (const [id, font] of Object.entries(PACKAGE_FONTS)) {
    const response = await fetch(font.src);
    if (response.ok)
      files[`fonts/${id}.${/\.ttf$/i.test(font.src) ? "ttf" : "otf"}`] =
        new Uint8Array(await response.arrayBuffer());
  }
  const license=await fetch("/tools/studio-runtime/datasheets/standard-fonts/LICENSE_LIBERATION.txt");
  if(!license.ok)throw new Error("Font license could not load. Retry the project export.");
  files["fonts/LICENSE.txt"]=new Uint8Array(await license.arrayBuffer());
  files["assets.json"] = strToU8(JSON.stringify(manifest));
  files["README.txt"] = strToU8(
    "Packaging Studio project. Import this ZIP in Projects to restore artwork and included assets. Original fonts included for rendering.",
  );
  return new Blob([zipSync(files)], { type: "application/zip" });
}
export function downloadStudio(
  blob: Blob,
  p: StudioProject,
  extension: string,
) {
  downloadPackage(
    blob,
    p.name.replace(/[^\w -]/g, "").trim() || "Packaging" + extension,
  );
}
export function preflight(p: StudioProject) {
  const errors: string[] = [],
    warnings: string[] = [];
  if (!p.print.iccAsset)
    errors.push("Choose a printer ICC profile before production export.");
  for (const panel of Object.values(p.panels)) {
    for (const o of [...panel.objects, ...panel.insideObjects]) {
      if (o.visible === false) continue;
      const left = Number(o.left || 0),
        top = Number(o.top || 0),
        w = Number(o.width || 0) * Number(o.scaleX || 1),
        h = Number(o.height || 0) * Number(o.scaleY || 1);
      if (
        o.type?.toLowerCase().includes("text") &&
        (left < p.print.safe ||
          top < p.print.safe ||
          left + w > panel.width - p.print.safe ||
          top + h > panel.height - p.print.safe)
      )
        warnings.push(`${panel.name}: text is outside the safe area.`);
      if (o.type?.toLowerCase() === "image") {
        const dpiX = (Number(o.width || 0) / Math.max(0.01, w)) * 25.4;
        if (dpiX < p.print.dpi)
          warnings.push(
            `${panel.name}: image resolution is approximately ${Math.round(dpiX)} dpi.`,
          );
      }
    }
  }
  if (p.structure === "custom" && !p.imported?.confirmed)
    errors.push("Confirm custom folds before export.");
  return { errors, warnings: [...new Set(warnings)] };
}
