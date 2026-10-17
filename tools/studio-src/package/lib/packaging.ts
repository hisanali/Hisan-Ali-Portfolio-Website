import { PACKAGE_FONTS, type PackageFont } from "./packaging-assets";
export const FACES = [
  "top",
  "front",
  "right",
  "back",
  "left",
  "bottom",
] as const;
export type Face = (typeof FACES)[number];
export type Layer = {
  id: string;
  kind:
    | "text"
    | "image"
    | "rect"
    | "circle"
    | "line"
    | "waves"
    | "handling"
    | "stripes"
    | "dots"
    | "diamonds";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  color: string;
  text: string;
  size: number;
  src: string;
  font: PackageFont;
};
export type Panel = { color: string; layers: Layer[] };
export type PackageProject = {
  version: 1;
  name: string;
  width: number;
  depth: number;
  height: number;
  material: "colour" | "kraft";
  panels: Record<Face, Panel>;
};
export type PackageRecord = {
  id: string;
  revision: number;
  updatedAt: string;
  updatedBy: string;
  project: PackageProject;
};
export const faceName = (f: Face) =>
  ({
    top: "Lid",
    bottom: "Base",
    front: "Front",
    back: "Back",
    left: "Left",
    right: "Right",
  })[f];
const color = (v: unknown) =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const finite = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function cleanPackage(v: unknown): PackageProject | null {
  if (!v || typeof v !== "object") return null;
  const p = v as PackageProject;
  if (
    p.version !== 1 ||
    typeof p.name !== "string" ||
    p.name.length > 100 ||
    !p.name.trim() ||
    !["colour", "kraft"].includes(p.material) ||
    ![p.width, p.depth, p.height].every((n) => finite(n, 30, 800)) ||
    !p.panels
  )
    return null;
  const panels = {} as Record<Face, Panel>;
  for (const f of FACES) {
    const panel = p.panels[f];
    if (
      !panel ||
      !color(panel.color) ||
      !Array.isArray(panel.layers) ||
      panel.layers.length > 40
    )
      return null;
    const ids = new Set<string>();
    const layers: Layer[] = [];
    for (const l of panel.layers) {
      if (
        !l ||
        typeof l.id !== "string" ||
        !/^[\w-]{1,60}$/.test(l.id) ||
        ids.has(l.id) ||
        ![
          "text",
          "image",
          "rect",
          "circle",
          "line",
          "waves",
          "handling",
          "stripes",
          "dots",
          "diamonds",
        ].includes(l.kind) ||
        !color(l.color) ||
        (l.font !== undefined &&
          !Object.prototype.hasOwnProperty.call(PACKAGE_FONTS, l.font)) ||
        ![l.x, l.y].every((n) => finite(n, -100, 200)) ||
        ![l.w, l.h].every((n) => finite(n, 1, 300)) ||
        !finite(l.rotation, -180, 180) ||
        !finite(l.size, 1, 60) ||
        typeof l.text !== "string" ||
        l.text.length > 1000 ||
        typeof l.src !== "string" ||
        (l.src &&
          !/^\/(?:packaging\/[a-z0-9-]+\.png|api\/packaging\/assets\?id=[a-f0-9]{32})$/.test(
            l.src,
          ))
      )
        return null;
      ids.add(l.id);
      layers.push({
        id: l.id,
        kind: l.kind,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
        rotation: l.rotation,
        color: l.color,
        text: l.text,
        size: l.size,
        src: l.src,
        font: l.font || "muller-regular",
      });
    }
    panels[f] = { color: panel.color, layers };
  }
  return {
    version: 1,
    name: p.name.trim(),
    width: p.width,
    depth: p.depth,
    height: p.height,
    material: p.material,
    panels,
  };
}
export function layer(kind: Layer["kind"], props: Partial<Layer> = {}): Layer {
  return {
    id: crypto.randomUUID(),
    kind,
    x: 10,
    y: 10,
    w: 40,
    h: 25,
    rotation: 0,
    color: "#202b31",
    text: "Your text",
    size: 5,
    src: "",
    font: "muller-regular",
    ...props,
  };
}
export function faceSize(p: PackageProject, f: Face): [number, number] {
  return f === "top" || f === "bottom"
    ? [p.width, p.depth]
    : f === "left" || f === "right"
      ? [p.depth, p.height]
      : [p.width, p.height];
}
export type NetPiece = {
  id: string;
  face?: Face;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: string;
};
// Nominal mailer net. No board-caliper or die-maker compensation is implied.
export function packageNet(p: PackageProject) {
  const { width: w, depth: d, height: h } = p,
    m = 12,
    x = m + h,
    y = m + h + d + h;
  const tabWidth = Math.min(55, w / 3),
    tabHeight = Math.min(10, h / 4);
  const pieces: NetPiece[] = [
    {
      id: "lock-tab",
      x: x + (w - tabWidth) / 2,
      y: m - tabHeight,
      w: tabWidth,
      h: tabHeight,
      points: `4,0 ${tabWidth - 4},0 ${tabWidth},${tabHeight} 0,${tabHeight}`,
    },
    { id: "tuck", x, y: m, w, h },
    { id: "top", face: "top", x, y: m + h, w, h: d },
    { id: "back", face: "back", x, y: m + h + d, w, h },
    { id: "bottom", face: "bottom", x, y, w, h: d },
    { id: "front", face: "front", x, y: y + d, w, h },
    { id: "left", face: "left", x: m, y, w: h, h: d },
    { id: "right", face: "right", x: x + w, y, w: h, h: d },
  ];
  for (const side of [-1, 1]) {
    const sx = side < 0 ? m : x + w;
    pieces.push({
      id: `lid-wing-${side}`,
      x: sx,
      y: m + h,
      w: h,
      h: d,
      points:
        side < 0
          ? `${h},0 0,${Math.min(h / 3, d / 4)} 0,${d - Math.min(h / 3, d / 4)} ${h},${d}`
          : `0,0 ${h},${Math.min(h / 3, d / 4)} ${h},${d - Math.min(h / 3, d / 4)} 0,${d}`,
    });
    for (const fy of [y - h, y + d])
      pieces.push({
        id: `dust-${side}-${fy}`,
        x: sx,
        y: fy,
        w: h,
        h,
        points: `4,0 ${h - 4},0 ${h},${h} 0,${h}`,
      });
  }
  const folds = [
    [x + (w - tabWidth) / 2, m, x + (w + tabWidth) / 2, m],
    [x, m + h, x + w, m + h],
    [x, m + h + d, x + w, m + h + d],
    [x, y, x + w, y],
    [x, y + d, x + w, y + d],
    [x, m + h, x, m + h + d],
    [x + w, m + h, x + w, m + h + d],
    [x, y, x, y + d],
    [x + w, y, x + w, y + d],
    [m, y, x, y],
    [m, y + d, x, y + d],
    [x + w, y, x + w + h, y],
    [x + w, y + d, x + w + h, y + d],
  ];
  return {
    width: w + 2 * h + 2 * m,
    height: 2 * d + 3 * h + 2 * m,
    pieces,
    folds,
  };
}
export function cutSegments(p: PackageProject) {
  const n = packageNet(p),
    cuts: number[][] = [];
  for (const q of n.pieces) {
    const points = q.points
      ? q.points.split(" ").map((s) => s.split(",").map(Number))
      : [
          [0, 0],
          [q.w, 0],
          [q.w, q.h],
          [0, q.h],
        ];
    points.forEach(([ax, ay], i) => {
      const [bx, by] = points[(i + 1) % points.length],
        x = q.x + ax,
        y = q.y + ay,
        x2 = q.x + bx,
        y2 = q.y + by;
      if (x !== x2 && y !== y2) {
        cuts.push([x, y, x2, y2]);
        return;
      }
      const horizontal = y === y2,
        start = Math.min(horizontal ? x : y, horizontal ? x2 : y2),
        end = Math.max(horizontal ? x : y, horizontal ? x2 : y2),
        fixed = horizontal ? y : x;
      let intervals = [[start, end]];
      for (const [fx, fy, fx2, fy2] of n.folds) {
        if (
          horizontal ? fy !== fy2 || fy !== fixed : fx !== fx2 || fx !== fixed
        )
          continue;
        const a = Math.min(horizontal ? fx : fy, horizontal ? fx2 : fy2),
          b = Math.max(horizontal ? fx : fy, horizontal ? fx2 : fy2);
        intervals = intervals.flatMap(([s, e]) =>
          b <= s || a >= e
            ? [[s, e]]
            : [...(a > s ? [[s, a]] : []), ...(b < e ? [[b, e]] : [])],
        );
      }
      for (const [s, e] of intervals)
        cuts.push(horizontal ? [s, fixed, e, fixed] : [fixed, s, fixed, e]);
    });
  }
  return cuts.filter(
    (line, i) =>
      cuts.findIndex(
        (other) =>
          line.every((v, k) => v === other[k]) ||
          line.every((v, k) => v === other[(k + 2) % 4]),
      ) === i,
  );
}
export const xml = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function layerSvg(l: Layer, w: number, h: number) {
  const x = (l.x * w) / 100,
    y = (l.y * h) / 100,
    lw = (l.w * w) / 100,
    lh = (l.h * h) / 100;
  let body = "";
  if (l.kind === "text")
    body = `<text fill="${l.color}" data-font="${l.font || "muller-regular"}" font-family="${PACKAGE_FONTS[l.font || "muller-regular"].family}, sans-serif" font-size="${(l.size * w) / 100}">${l.text
      .split("\n")
      .map(
        (t, i) =>
          `<tspan x="0" y="${((i * l.size * w) / 100) * 1.3}">${xml(t)}</tspan>`,
      )
      .join("")}</text>`;
  if (l.kind === "image") {
    const logo = false;
    body = `${logo ? `<defs><filter id="tint-${l.id}" color-interpolation-filters="sRGB"><feFlood flood-color="${l.color}"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>` : ""}<image href="${xml(l.src)}" width="${lw}" height="${lh}" preserveAspectRatio="xMidYMid meet" ${logo ? `filter="url(#tint-${l.id})"` : ""}/>`;
  }
  if (l.kind === "rect")
    body = `<rect width="${lw}" height="${lh}" fill="${l.color}"/>`;
  if (l.kind === "circle")
    body = `<ellipse cx="${lw / 2}" cy="${lh / 2}" rx="${lw / 2}" ry="${lh / 2}" fill="${l.color}"/>`;
  if (l.kind === "line")
    body = `<path d="M0 0 L${lw} ${lh}" stroke="${l.color}" stroke-width="${w * 0.005}"/>`;
  if (l.kind === "waves")
    body = `<path d="M0 ${lh * 0.2} C${lw * 0.4} ${-lh * 0.2} ${lw * 0.5} ${lh * 0.9} ${lw} ${lh * 0.25} L${lw} ${lh * 0.5} C${lw * 0.5} ${lh} ${lw * 0.4} 0 0 ${lh * 0.5} Z" fill="${l.color}"/>`;
  if (["stripes", "dots", "diamonds"].includes(l.kind)) {
    const cell = Math.max(w * 0.06, 2),
      id = `pattern-${l.id}`;
    const motif =
      l.kind === "dots"
        ? `<circle cx="${cell / 2}" cy="${cell / 2}" r="${cell * 0.08}" fill="${l.color}"/>`
        : l.kind === "diamonds"
          ? `<path d="M${cell * 0.25} 0 H${cell} L${cell * 0.75} ${cell * 0.6} H0Z" fill="${l.color}"/>`
          : `<path d="M0 ${cell} L${cell} 0" stroke="${l.color}" stroke-width="${cell * 0.15}"/>`;
    body = `<defs><pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">${motif}</pattern></defs><rect width="${lw}" height="${lh}" fill="url(#${id})"/>`;
  }
  if (l.kind === "handling")
    body = `<g fill="none" stroke="${l.color}" stroke-width="1.5" transform="scale(${lw / 120} ${lh / 30})"><rect x="1" y="1" width="27" height="27"/><path d="M8 6 H21 L18 16 H11 Z M14.5 16 V23 M9 23 H20"/><rect x="31" y="1" width="27" height="27"/><path d="M38 23 V7 L34 12 M38 7 L42 12 M51 23 V7 L47 12 M51 7 L55 12"/><rect x="61" y="1" width="27" height="27"/><path d="M65 14 Q74 0 84 14 Z M74 14 V23 Q79 28 81 22"/><rect x="91" y="1" width="27" height="27"/><path d="M95 14 L105 6 L115 14 L105 23 Z M105 6 V23 M95 14 H115"/></g>`;
  return `<g transform="translate(${x} ${y}) rotate(${l.rotation} ${lw / 2} ${lh / 2})">${body}</g>`;
}
export function faceSvg(p: PackageProject, f: Face) {
  const [w, h] = faceSize(p, f),
    panel = p.panels[f];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%"><rect width="${w}" height="${h}" fill="${panel.color}"/>${panel.layers.map((l) => layerSvg(l, w, h)).join("")}</svg>`;
}
export function netFaceSvg(p: PackageProject, f: Face, w: number, h: number) {
  const art = faceSvg(p, f);
  return f === "left" || f === "right"
    ? `<g transform="translate(${w} 0) rotate(90)">${art.replace('width="100%" height="100%"', `width="${h}" height="${w}"`)}</g>`
    : ["top", "front", "bottom"].includes(f)
      ? `<g transform="translate(${w} ${h}) rotate(180)">${art}</g>`
      : art;
}
export function netSvg(p: PackageProject, guides = true) {
  const n = packageNet(p);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n.width}mm" height="${n.height}mm" viewBox="0 0 ${n.width} ${n.height}"><title>${xml(p.name)} — nominal mailer dieline in mm</title>${n.pieces.map((q) => `<svg x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" viewBox="0 0 ${q.w} ${q.h}" overflow="hidden">${q.face ? netFaceSvg(p, q.face, q.w, q.h) : `<${q.points ? "polygon" : "rect"} ${q.points ? `points="${q.points}"` : `width="${q.w}" height="${q.h}"`} fill="${p.material === "kraft" ? "#c99c6b" : p.panels.back.color}"/>`}</svg>`).join("")}${
    guides
      ? `<g fill="none" stroke="#e33b85" stroke-width="0.25">${cutSegments(p)
          .map(([x, y, x2, y2]) => `<path d="M${x} ${y} L${x2} ${y2}"/>`)
          .join(
            "",
          )}</g><g stroke="#1679be" stroke-width="0.45" stroke-dasharray="2 1">${n.folds.map(([x, y, x2, y2]) => `<path d="M${x} ${y} L${x2} ${y2}"/>`).join("")}</g>`
      : ""
  }</svg>`;
}
