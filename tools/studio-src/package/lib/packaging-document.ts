import {validCutterPaths, type CutterPath} from "./packaging-contours";
import {
  cleanPackage,
  FACES,
  faceSize,
  faceName,
  layerSvg,
  type PackageProject,
} from "./packaging";
export type StructureKind =
  | "mailer"
  | "carton"
  | "sleeve"
  | "lid-base"
  | "custom";
export type StudioObject = Record<string, any>;
export type StudioPanel = {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
  insideColor: string;
  objects: StudioObject[];
  insideObjects: StudioObject[];
  guides: { axis: "x" | "y"; position: number }[];
};
export type FoldPiece = {
  id: string;
  face?: string;
  component: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: number[][];
  holes?: number[][][];
  islands?: number[][][];
  parent?: string;
  inset?: number;
  hinge?: {
    a: [number, number];
    b: [number, number];
    angle: number;
    stage?: number;
    end?: number;
  };
};
export type StudioNet = { width: number; height: number; rootPlane?: "base" | "front"; pieces: FoldPiece[]; sourcePaths?: CutterPath[] };
export type StudioProject = {
  version: 2;
  units: "mm";
  name: string;
  width: number;
  depth: number;
  height: number;
  structure: StructureKind;
  material: "colour" | "kraft";
  finish?: "matte" | "glossy";
  thickness: number;
  panels: Record<string, StudioPanel>;
  scene: {
    preset: string;
    background: string;
    surface: "neutral" | "wood" | "stone" | "concrete";
    stage: "studio" | "table" | "floor" | "pedestal";
    light: number;
    direction: number;
    pose: "lying" | "standing";
    backgroundImage?: string;
  };
  print: {
    bleed: number;
    safe: number;
    dpi: number;
    iccAsset?: string;
    profileName?: string;
    cutSpot: string;
    creaseSpot: string;
    finishes: string[];
  };
  imported?: {
    name: string;
    source: string;
    preview?: string;
    net: StudioNet;
    confirmed: boolean;
    referenceOnly?: boolean;
    profileId?: string;
    notes: string[];
  };
  legacy?: PackageProject;
};
export type StudioRecord = {
  id: string;
  revision: number;
  updatedAt: string;
  updatedBy: string;
  project: StudioProject;
};
export const STRUCTURES: {
  id: StructureKind;
  name: string;
  description: string;
}[] = [
  {
    id: "mailer",
    name: "Hinged mailer",
    description: "Rollover lid · retail & delivery",
  },
  {
    id: "carton",
    name: "Folding carton",
    description: "Straight tuck · product packaging",
  },
  {
    id: "sleeve",
    name: "Sliding sleeve",
    description: "Open ends · presentation wrap",
  },
  {
    id: "lid-base",
    name: "Lid & base",
    description: "Two pieces · premium presentation",
  },
];
export const DEFAULT_SCENE: StudioProject["scene"] = {
  preset: "soft-studio",
  background: "#f0f1ee",
  surface: "neutral",
  stage: "studio",
  light: 1.1,
  direction: 45,
  pose: "lying",
};
export function blankProject(): StudioProject {
  const p: StudioProject = {
    version: 2,
    units: "mm",
    name: "Untitled packaging",
    width: 285,
    depth: 125,
    height: 74,
    structure: "mailer",
    material: "kraft",
    finish: "matte",
    thickness: 1.2,
    panels: {},
    scene: { ...DEFAULT_SCENE },
    print: {
      bleed: 3,
      safe: 3,
      dpi: 300,
      cutSpot: "CutContour",
      creaseSpot: "Crease",
      finishes: [],
    },
  };
  return syncPanels(p);
}
export function generatedNet(p: StudioProject): StudioNet {
  if (p.structure === "custom" && p.imported) return p.imported.net;
  const W = p.width,
    D = p.depth,
    H = p.height,
    m = 16;
  const pieces: FoldPiece[] = [];
  const add = (
    id: string,
    face: string | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    parent?: string,
    axis: "x" | "y" = "x",
    angle = 0,
    component = "box",
    points?: number[][],
  ) => {
    const par = pieces.find((q) => q.id === parent);
    let a: [number, number] = [x, y],
      b: [number, number] = [x + w, y];
    if (par) {
      if (axis === "x") {
        const hy = y >= par.y + par.h - 0.01 ? y : y + h;
        a = [Math.max(x, par.x), hy];
        b = [Math.min(x + w, par.x + par.w), hy];
      } else {
        const hx = x >= par.x + par.w - 0.01 ? x : x + w;
        a = [hx, Math.max(y, par.y)];
        b = [hx, Math.min(y + h, par.y + par.h)];
      }
    }
    pieces.push({
      id,
      face,
      component,
      x,
      y,
      w,
      h,
      points,
      parent,
      hinge: parent ? { a, b, angle } : undefined,
    });
  };
  if (p.structure === "mailer") {
    const x = m + H,
      y = m + H + D + H;
    add("bottom", "bottom", x, y, W, D);
    add("front", "front", x, y + D, W, H, "bottom", "x", -90);
    add("back", "back", x, y - H, W, H, "bottom", "x", 90);
    add("top", "top", x, y - H - D, W, D, "back", "x", 90);
    add("tuck", undefined, x, y - H - D - H, W, H, "top", "x", 90);
    add("left", "left", x - H, y, H, D, "bottom", "y", -90);
    add("right", "right", x + W, y, H, D, "bottom", "y", 90);
    for (const s of [-1, 1]) {
      const sx = s < 0 ? x - H : x + W;
      add(
        "wing-" + s,
        undefined,
        sx,
        y - H - D,
        H,
        D,
        "top",
        "y",
        s < 0 ? -90 : 90,
        "box",
        s < 0
          ? [
              [H, 0],
              [0, Math.min(H / 3, D / 4)],
              [0, D - Math.min(H / 3, D / 4)],
              [H, D],
            ]
          : [
              [0, 0],
              [H, Math.min(H / 3, D / 4)],
              [H, D - Math.min(H / 3, D / 4)],
              [0, D],
            ],
      );
      add(
        "dust-back-" + s,
        undefined,
        sx,
        y - H,
        H,
        H,
        s < 0 ? "left" : "right",
        "x",
        90,
        "box",
        [
          [3, 0],
          [H - 3, 0],
          [H, H],
          [0, H],
        ],
      );
      add(
        "dust-front-" + s,
        undefined,
        sx,
        y + D,
        H,
        H,
        s < 0 ? "left" : "right",
        "x",
        -90,
        "box",
        [
          [0, 0],
          [H, 0],
          [H - 3, H],
          [3, H],
        ],
      );
    }
    return { width: W + 2 * H + 2 * m, height: 2 * D + 3 * H + 2 * m, pieces };
  }
  if (p.structure === "carton") {
    const x = m,
      y = m + D + Math.min(15, H / 4);
    add("front", "front", x, y, W, H);
    add("right", "right", x + W, y, D, H, "front", "y", 90);
    add("back", "back", x + W + D, y, W, H, "right", "y", 90);
    add("left", "left", x + 2 * W + D, y, D, H, "back", "y", 90);
    add("glue", undefined, x + 2 * (W + D), y, 12, H, "left", "y", 90);
    add("top", "top", x, y - D, W, D, "front", "x", 90);
    add("bottom", "bottom", x, y + H, W, D, "front", "x", -90);
    const tuck = Math.min(15, H / 4);
    add("top-tuck", undefined, x, y - D - tuck, W, tuck, "top", "x", 90);
    add("bottom-tuck", undefined, x, y + H + D, W, tuck, "bottom", "x", -90);
    for (const side of ["right", "left"]) {
      const q = pieces.find((z) => z.id === side)!;
      const dust = Math.min(D, H / 2);
      add(side + "-top", undefined, q.x, y - dust, D, dust, side, "x", 90);
      add(side + "-bottom", undefined, q.x, y + H, D, dust, side, "x", -90);
    }
    return {
      width: 2 * (W + D) + 12 + 2 * m,
      height: H + 2 * (D + tuck) + 2 * m,
      pieces,
    };
  }
  if (p.structure === "sleeve") {
    const x = m,
      y = m;
    add("bottom", "bottom", x, y, W, D);
    add("right", "right", x + W, y, H, D, "bottom", "y", 90);
    add("top", "top", x + W + H, y, W, D, "right", "y", 90);
    add("left", "left", x + 2 * W + H, y, H, D, "top", "y", 90);
    add("glue", undefined, x + 2 * (W + H), y, 12, D, "left", "y", 90);
    return { width: 2 * (W + H) + 12 + 2 * m, height: D + 2 * m, pieces };
  }
  const lidHeight = Math.min(H * 0.45, 40),
    gap = 24;
  for (const comp of ["base", "lid"]) {
    const h = comp === "base" ? H : lidHeight,
      w = comp === "base" ? W : W + 2 * p.thickness + 1,
      d = comp === "base" ? D : D + 2 * p.thickness + 1;
    const x = m + h + (comp === "lid" ? W + 2 * H + gap : 0),
      y = m + h;
    add(
      comp,
      comp === "base" ? "bottom" : "top",
      x,
      y,
      w,
      d,
      undefined,
      "x",
      0,
      comp,
    );
    add(
      comp + "-front",
      comp === "base" ? "front" : "lid-front",
      x,
      y + d,
      w,
      h,
      comp,
      "x",
      -90,
      comp,
    );
    add(
      comp + "-back",
      comp === "base" ? "back" : "lid-back",
      x,
      y - h,
      w,
      h,
      comp,
      "x",
      90,
      comp,
    );
    add(
      comp + "-left",
      comp === "base" ? "left" : "lid-left",
      x - h,
      y,
      h,
      d,
      comp,
      "y",
      -90,
      comp,
    );
    add(
      comp + "-right",
      comp === "base" ? "right" : "lid-right",
      x + w,
      y,
      h,
      d,
      comp,
      "y",
      90,
      comp,
    );
  }
  return {
    width: Math.max(...pieces.map((q) => q.x + q.w)) + m,
    height: Math.max(...pieces.map((q) => q.y + q.h)) + m,
    pieces,
  };
}
export function syncPanels(p: StudioProject): StudioProject {
  const net = generatedNet(p),
    panels: { [id: string]: StudioPanel } = {};
  for (const q of net.pieces) {
    if (!q.face) continue;
    const old = p.panels[q.face];
    panels[q.face] = old
      ? { ...old, width: q.w, height: q.h }
      : {
          id: q.face,
          name: (FACES as readonly string[]).includes(q.face)
            ? faceName(q.face as any)
            : q.face.replaceAll("-", " "),
          width: q.w,
          height: q.h,
          color: p.material === "kraft" ? "#cba878" : "#faf9f6",
          insideColor: "#d1b38b",
          objects: [],
          insideObjects: [],
          guides: [],
        };
  }
  return { ...p, panels };
}
export function migrateProject(raw: unknown): StudioProject | null {
  if ((raw as any)?.version === 2) return cleanStudioProject(raw);
  const old = cleanPackage(raw);
  if (!old) return null;
  let p = syncPanels({
    ...blankProject(),
    name: old.name,
    width: old.width,
    depth: old.depth,
    height: old.height,
    material: old.material,
    legacy: old,
  });
  for (const f of FACES) {
    const [w, h] = faceSize(old, f);
    p.panels[f].color = old.panels[f].color;
    p.panels[f].objects = old.panels[f].layers.map((l) => ({
      type: "legacy",
      id: l.id,
      name: l.kind === "text" ? l.text : "Artwork",
      left: (l.x * w) / 100,
      top: (l.y * h) / 100,
      width: (l.w * w) / 100,
      height: (l.h * h) / 100,
      svg: layerSvg(l, w, h),
      legacyLayer: l,
    }));
  }
  return p;
}
const finite = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export const validAsset = (v:unknown) => typeof v==='string' && v.length<40_000_000 && (
 /^data:(?:image\/(?:png|jpeg|webp|svg\+xml)|application\/(?:pdf|dxf|octet-stream)|text\/(?:plain|xml));base64,[A-Za-z0-9+/=]+$/.test(v) ||
 /^\/tools\/studio-runtime\/[\w/.-]+\.(?:png|webp|jpg|svg|bin)$/.test(v)
);
const safeColor = (v: unknown) =>
  typeof v === "string" &&
  /^(?:#[a-f\d]{3,8}|rgba?\([\d\s.,%]+\)|transparent|black|white|none)$/i.test(
    v,
  );
const safeKeys = new Set(
  "type version id name left top width height radius rx ry x1 y1 x2 y2 scaleX scaleY angle skewX skewY originX originY flipX flipY opacity fill stroke strokeWidth strokeDashArray strokeLineCap strokeLineJoin strokeMiterLimit strokeUniform paintFirst globalCompositeOperation shadow visible selectable evented locked lockMovementX lockMovementY lockScalingX lockScalingY lockRotation hasControls hasBorders cornerColor cornerStrokeColor transparentCorners borderColor cornerStyle cornerSize padding objectCaching excludeFromExport clipPath absolutePositioned inverted path pathOffset points objects text fontSize fontFamily fontWeight fontStyle lineHeight charSpacing textAlign direction underline overline linethrough styles textBackgroundColor backgroundColor splitByGrapheme minWidth src crossOrigin cropX cropY imageSmoothing resizeFilter filters preserveAspectRatio svg legacyLayer assetId fit tintColor".split(
    " ",
  ),
);
function cleanObject(o: any, depth = 0): StudioObject | null {
  if (
    !o ||
    typeof o !== "object" ||
    depth > 8 ||
    ![
      "Rect",
      "rect",
      "Circle",
      "circle",
      "Ellipse",
      "ellipse",
      "Line",
      "line",
      "Path",
      "path",
      "Polygon",
      "polygon",
      "Polyline",
      "polyline",
      "Group",
      "group",
      "Textbox",
      "textbox",
      "IText",
      "i-text",
      "Text",
      "text",
      "Image",
      "image",
      "legacy",
    ].includes(o.type)
  )
    return null;
  if (o.src && !validAsset(o.src)) return null;
  if (
    o.svg &&
    (/<(?:script|foreignObject)|\bon\w+\s*=|(?:href|url)\s*[=(]\s*['"]?(?:https?:|javascript:)/i.test(
      o.svg,
    ) ||
      String(o.svg).length > 100000)
  )
    return null;
  const result: StudioObject = {};
  for (const [k, v] of Object.entries(o)) {
    if (!safeKeys.has(k)) continue;
    if (
      [
        "left",
        "top",
        "width",
        "height",
        "scaleX",
        "scaleY",
        "angle",
        "skewX",
        "skewY",
        "fontSize",
      ].includes(k) &&
      !finite(v, -10000, 10000)
    )
      return null;
    if (k === "objects") {
      if (!Array.isArray(v) || v.length > 150) return null;
      const children = v.map((z) => cleanObject(z, depth + 1));
      if (children.some((z) => !z)) return null;
      result[k] = children;
    } else if (k === "id" || k === "name" || k === "text") {
      if (typeof v !== "string" || v.length > (k === "text" ? 10000 : 200))
        return null;
      result[k] = v;
    } else if (k === "styles") {
      if (!v || typeof v !== "object" || JSON.stringify(v).length > 100000)
        return null;
      const styles: any = {};
      for (const [line, chars] of Object.entries(v)) {
        if (!/^\d+$/.test(line) || !chars || typeof chars !== "object")
          return null;
        styles[line] = {};
        for (const [char, style] of Object.entries(chars)) {
          if (!/^\d+$/.test(char) || !style || typeof style !== "object")
            return null;
          styles[line][char] = Object.fromEntries(
            Object.entries(style).filter(
              ([key, val]) =>
                [
                  "fill",
                  "fontFamily",
                  "fontSize",
                  "fontWeight",
                  "fontStyle",
                  "underline",
                  "linethrough",
                ].includes(key) &&
                (typeof val === "string" ||
                  typeof val === "number" ||
                  typeof val === "boolean"),
            ),
          );
        }
      }
      result[k] = styles;
    } else if (
      k === "fill" ||
      k === "stroke" ||
      k === "backgroundColor" ||
      k === "textBackgroundColor"
    ) {
      if (v !== null && !(v === "" && (k === "backgroundColor" || k === "textBackgroundColor")) && !safeColor(v)) return null;
      result[k] = v;
    } else if (k === "tintColor") {
      if(v!==null && (typeof v!=="string" || !/^#[a-f0-9]{6}$/i.test(v))) return null;
      if(v!==null) result[k]=v;
    } else if (k === "filters" || k === "resizeFilter" || k === "shadow") {
      continue;
    } else result[k] = v;
  }
  return result;
}
export function cleanStudioProject(raw: unknown): StudioProject | null {
  const p = raw as StudioProject;
  if (
    !p ||
    p.version !== 2 ||
    p.units !== "mm" ||
    typeof p.name !== "string" ||
    !p.name.trim() ||
    p.name.length > 100 ||
    !["mailer", "carton", "sleeve", "lid-base", "custom"].includes(
      p.structure,
    ) ||
    ![p.width, p.depth, p.height].every((n) => finite(n, 30, 800)) ||
    !["colour", "kraft"].includes(p.material) ||
    (p.finish !== undefined && !["matte", "glossy"].includes(p.finish)) ||
    !finite(p.thickness, 0.1, 8) ||
    !p.panels ||
    Object.keys(p.panels).length > 100
  )
    return null;
  const panels: Record<string, StudioPanel> = {};
  let total = 0;
  for (const [id, v] of Object.entries(p.panels)) {
    if (
      !/^[\w-]{1,80}$/.test(id) ||
      !v ||
      typeof v.name !== "string" ||
      v.name.length > 100 ||
      !finite(v.width, 1, 2000) ||
      !finite(v.height, 1, 2000) ||
      !safeColor(v.color) ||
      !safeColor(v.insideColor) ||
      !Array.isArray(v.objects) ||
      !Array.isArray(v.insideObjects) ||
      (total += v.objects.length + v.insideObjects.length) > 600
    )
      return null;
    const objects = v.objects.map((o) => cleanObject(o)),
      insideObjects = v.insideObjects.map((o) => cleanObject(o));
    if ([...objects, ...insideObjects].some((o) => !o)) return null;
    if (
      !Array.isArray(v.guides) ||
      v.guides.length > 100 ||
      v.guides.some(
        (g) => !["x", "y"].includes(g.axis) || !finite(g.position, -2000, 2000),
      )
    )
      return null;
    panels[id] = {
      id,
      name: v.name,
      width: v.width,
      height: v.height,
      color: v.color,
      insideColor: v.insideColor,
      objects: objects as StudioObject[],
      insideObjects: insideObjects as StudioObject[],
      guides: v.guides,
    };
  }
  if (
    !p.scene ||
    !safeColor(p.scene.background) ||
    !["neutral", "wood", "stone", "concrete"].includes(p.scene.surface) ||
    !["studio", "table", "floor", "pedestal"].includes(p.scene.stage) ||
    !finite(p.scene.light, 0.1, 4) ||
    !finite(p.scene.direction, -180, 180) ||
    !["lying", "standing"].includes(p.scene.pose) ||
    (p.scene.backgroundImage && !validAsset(p.scene.backgroundImage))
  )
    return null;
  if (
    !p.print ||
    ![p.print.bleed, p.print.safe].every((n) => finite(n, 0, 20)) ||
    !finite(p.print.dpi, 72, 600) ||
    !/^[-\w ]{1,40}$/.test(p.print.cutSpot) ||
    !/^[-\w ]{1,40}$/.test(p.print.creaseSpot) ||
    !Array.isArray(p.print.finishes) ||
    p.print.finishes.length > 10 ||
    p.print.finishes.some((s) => !/^[-\w ]{1,40}$/.test(s)) ||
    (p.print.iccAsset && !validAsset(p.print.iccAsset))
  )
    return null;
  if (p.imported) {
    const imp = p.imported,
      n = imp.net;
    if (
      typeof imp.name !== "string" ||
      imp.name.length > 200 ||
      !validAsset(imp.source) ||
      (imp.preview && !validAsset(imp.preview)) ||
      !n ||
      (n.rootPlane !== undefined && !["base", "front"].includes(n.rootPlane)) ||
      !finite(n.width, 1, 5000) ||
      !finite(n.height, 1, 5000) ||
      !Array.isArray(n.pieces) ||
      n.pieces.length > 100
    )
      return null;
    const ids = new Set<string>();
    for (const q of n.pieces) {
      if (
        !/^[\w-]{1,80}$/.test(q.id) ||
        ids.has(q.id) ||
        ![q.x, q.y].every((z) => finite(z, -5000, 5000)) ||
        ![q.w, q.h].every((z) => finite(z, 0.1, 5000)) ||
        (q.inset !== undefined && !finite(q.inset, -4, 4)) ||
        (q.points &&
          (!Array.isArray(q.points) ||
            q.points.length > 8192 ||
            q.points.some(
              (z) =>
                !Array.isArray(z) ||
                z.length !== 2 ||
                z.some((v) => !finite(v, -5000, 5000)),
            )))
      )
        return null;
      for(const rings of [q.holes,q.islands]) if (rings && (!Array.isArray(rings) || rings.length>100 || rings.some(ring=>!Array.isArray(ring)||ring.length<3||ring.length>8192||ring.some(pt=>!Array.isArray(pt)||pt.length!==2||pt.some(v=>!finite(v,-5000,5000)))))) return null;
      ids.add(q.id);
      if (
        q.hinge &&
        (![...q.hinge.a, ...q.hinge.b].every((v) => finite(v, -5000, 5000)) ||
          !finite(q.hinge.angle, -180, 180) ||
          (q.hinge.stage !== undefined && !finite(q.hinge.stage, 0, .99)) ||
          (q.hinge.end !== undefined && (!finite(q.hinge.end, .01, 1) || q.hinge.end <= (q.hinge.stage || 0))))
      )
        return null;
    }
    if(n.sourcePaths && !validCutterPaths(n.sourcePaths,ids)) return null;
    for (const q of n.pieces) {
      if (q.parent && !ids.has(q.parent)) return null;
      let cur = q;
      const seen = new Set([q.id]);
      while (cur.parent) {
        if (seen.has(cur.parent)) return null;
        seen.add(cur.parent);
        cur = n.pieces.find((z) => z.id === cur.parent)!;
      }
    }
  }
  const clean: StudioProject = {
    ...p,
    name: p.name.trim(),
    finish: p.finish || "matte",
    panels,
    scene: { ...DEFAULT_SCENE, ...p.scene },
    print: { ...p.print },
  };
  if (p.legacy) {
    const legacy = cleanPackage(p.legacy);
    if (!legacy) return null;
    clean.legacy = legacy;
  }
  return clean;
}
export function foldEdges(net: StudioNet) {
  return net.pieces
    .filter((q) => q.hinge)
    .map((q) => [...q.hinge!.a, ...q.hinge!.b]);
}
export function netEdges(net: StudioNet) {
  const fold = foldEdges(net),
    all: number[][] = [];
  for (const q of net.pieces) {
    const pts = q.points || [
      [0, 0],
      [q.w, 0],
      [q.w, q.h],
      [0, q.h],
    ];
    for (const ring of [pts,...(q.islands||[]),...(q.holes||[])]) for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length],
        line = [q.x + a[0], q.y + a[1], q.x + b[0], q.y + b[1]];
      // A curved contour can split a straight crease into several segments.
      // Subtract collinear fold intervals rather than comparing only endpoints;
      // otherwise exported cutters also draw a solid cut across a partial fold.
      const dx=line[2]-line[0],dy=line[3]-line[1],length=Math.hypot(dx,dy);
      if(length<1e-7)continue;
      const intervals=fold.flatMap(f=>{
        const distance=(x:number,y:number)=>Math.abs((x-line[0])*dy-(y-line[1])*dx)/length;
        if(distance(f[0],f[1])>.15||distance(f[2],f[3])>.15)return [];
        const t=(x:number,y:number)=>((x-line[0])*dx+(y-line[1])*dy)/(length*length);
        const a=t(f[0],f[1]),b=t(f[2],f[3]);
        const lo=Math.max(0,Math.min(a,b)),hi=Math.min(1,Math.max(a,b));
        return hi>lo ? [[lo,hi]] : [];
      }).sort((a,b)=>a[0]-b[0]);
      let cursor=0;
      const add=(lo:number,hi:number)=>{if((hi-lo)*length>.01)all.push([line[0]+dx*lo,line[1]+dy*lo,line[0]+dx*hi,line[1]+dy*hi]);};
      for(const [lo,hi] of intervals){if(lo>cursor)add(cursor,lo);cursor=Math.max(cursor,hi);}
      if(cursor<1)add(cursor,1);
    }
  }
  // Dense printer curves can contain thousands of segments. Deduplicate in linear time.
  const seen=new Set<string>();
  return all.filter(line=>{
    const a=line.slice(0,2).map(v=>Math.round(v*1e6)).join(','),b=line.slice(2).map(v=>Math.round(v*1e6)).join(',');
    const key=a<b?a+'|'+b:b+'|'+a;
    if(seen.has(key))return false;seen.add(key);return true;
  });
}
