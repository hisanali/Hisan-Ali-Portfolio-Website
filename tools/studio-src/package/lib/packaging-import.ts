import {cleanStructuralInk} from "./packaging-print-marks";
import {detectBoxDimensions} from "./packaging-dimensions";
import {cutterPathPoints,type CutterCommand} from "./packaging-contours";
import {studioPackageProfile, type StudioPackageProfile} from "./studio-package-profiles";
import {readPdfMap} from './packaging-pdf-map';
import {netEdges,foldEdges} from './packaging-document';
import type { FoldPiece, StudioNet, StructureKind } from "./packaging-document";
export type ImportLine = {
  id: string;
  points: number[][];
  commands?: CutterCommand[];
  kind: "cut" | "fold" | "artwork";
  closed: boolean;
  colour?: number[];
};
export type DielineAnalysis = {
  name: string;
  width: number;
  height: number;
  scaleKnown: boolean;
  lines: ImportLine[];
  panels: { id: string; x: number; y: number; width: number; height: number; points?: number[][]; holes?: number[][][]; islands?: number[][][] }[];
  preview: Blob;
  artworkPreview?: Blob;
  studioProfile?: StudioPackageProfile;
  pages: number;
  page: number;
  notes: string[];
  suggested: StructureKind | null;
  dimensions: [number, number, number] | null;
};
const MM = 25.4 / 96;
export function svgLength(value: string | null) {
  if (!value) return null;
  const match = value.match(/^([\d.]+)\s*(mm|cm|in|pt|px)?$/);
  if (!match) return null;
  const units = match[2] || "px";
  return (
    Number(match[1]) *
    ({ mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, px: MM }[units] || 1)
  );
}
export function sanitizeDielineSVG(source: string) {
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror"))
    throw new Error("This SVG could not be read. Export a plain SVG or PDF.");
  const allowed = new Set([
    "svg",
    "g",
    "path",
    "line",
    "polyline",
    "polygon",
    "rect",
    "circle",
    "ellipse",
    "text",
    "tspan",
    "defs",
    "clipPath",
  ]);
  const attrs = new Set([
    "xmlns",
    "width",
    "height",
    "viewBox",
    "id",
    "d",
    "x",
    "y",
    "x1",
    "x2",
    "y1",
    "y2",
    "rx",
    "ry",
    "cx",
    "cy",
    "r",
    "points",
    "transform",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-dasharray",
    "opacity",
    "font-size",
    "font-family",
    "text-anchor",
    "clip-path",
  ]);
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    if (!allowed.has(el.localName)) {
      el.remove();
      continue;
    }
    for (const a of Array.from(el.attributes)) {
      if (
        !attrs.has(a.name) ||
        /(?:javascript:|https?:|data:|@import|expression\()/i.test(a.value)
      )
        el.removeAttribute(a.name);
    }
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
export function linePanels(lines: ImportLine[]) {
  const xs: number[] = [],
    ys: number[] = [];
  for (const l of lines.filter(l => l.kind !== "artwork")) {
    for (let i=1;i<l.points.length;i++) {
      const a=l.points[i-1], b=l.points[i];
      if (Math.abs(a[0]-b[0]) < .2 && Math.abs(a[1]-b[1]) > 20) xs.push(a[0]);
      if (Math.abs(a[1]-b[1]) < .2 && Math.abs(a[0]-b[0]) > 20) ys.push(a[1]);
    }
  }
  const unique = (values: number[]) =>
    [...new Set(values.map((v) => Math.round(v * 10) / 10))].sort(
      (a, b) => a - b,
    );
  const x = unique(xs),
    y = unique(ys);
  const panels: DielineAnalysis["panels"] = [];
  // Prefer explicit closed panel outlines. Do not infer physical scale from an image.
  for (const l of lines.filter((l) => l.closed && l.kind === "cut")) {
    const px = l.points.map((p) => p[0]),
      py = l.points.map((p) => p[1]),
      minX = Math.min(...px),
      maxX = Math.max(...px),
      minY = Math.min(...py),
      maxY = Math.max(...py);
    if (maxX - minX > 5 && maxY - minY > 5 && l.points.every(([x,y]) => (Math.abs(x-minX)<.4 || Math.abs(x-maxX)<.4) && (Math.abs(y-minY)<.4 || Math.abs(y-maxY)<.4)))
      panels.push({
        id: "panel-" + panels.length,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
  }
  if (panels.length < 3 && x.length < 35 && y.length < 35) {
    const onEdge = (ax: number, ay: number, bx: number, by: number) => {
      const vertical = Math.abs(ax-bx) < .1;
      const intervals: number[][] = [];
      for (const l of lines.filter(l => l.kind !== "artwork")) for(let i=1;i<l.points.length;i++) {
        const a=l.points[i-1], b=l.points[i];
        if (vertical ? Math.abs(a[0]-ax)<.6 && Math.abs(b[0]-ax)<.6 : Math.abs(a[1]-ay)<.6 && Math.abs(b[1]-ay)<.6) {
          const axis=vertical?1:0; intervals.push([Math.min(a[axis],b[axis]),Math.max(a[axis],b[axis])]);
        }
      }
      let end=vertical?ay:ax; const target=vertical?by:bx;
      for(const [lo,hi] of intervals.sort((a,b)=>a[0]-b[0])) {
        if(lo>end+2) break;
        if(hi>=end) end=hi;
        if(end>=target-.6) return true;
      }
      return false;
    };
    const cache = new Map<string, boolean>();
    const edge = (ax:number,ay:number,bx:number,by:number) => {
      const key=[ax,ay,bx,by].join(",");
      if(!cache.has(key)) cache.set(key,onEdge(ax,ay,bx,by));
      return cache.get(key)!;
    };
    const candidates: DielineAnalysis["panels"] = [];
    for (let i=0;i<x.length-1;i++) for(let k=i+1;k<x.length;k++) {
      if(x[k]-x[i]<20) continue;
      for(let j=0;j<y.length-1;j++) for(let l=j+1;l<y.length;l++) {
        const [ax,bx,ay,by]=[x[i],x[k],y[j],y[l]];
        if(by-ay<20) continue;
        if(edge(ax,ay,bx,ay)&&edge(ax,by,bx,by)&&edge(ax,ay,ax,by)&&edge(bx,ay,bx,by))
          candidates.push({id:"",x:ax,y:ay,width:bx-ax,height:by-ay});
      }
    }
    // Prefer the smallest enclosed face rather than a rectangle spanning several folds.
    candidates.sort((a,b)=>a.width*a.height-b.width*b.height);
    for(const q of candidates) if(!panels.some(p =>
      Math.min(p.x+p.width,q.x+q.width)-Math.max(p.x,q.x)>2 &&
      Math.min(p.y+p.height,q.y+q.height)-Math.max(p.y,q.y)>2
    )) panels.push({...q,id:"panel-"+panels.length});

  }
  return panels.filter((p,i) => panels.findIndex(q => Math.abs(p.x-q.x)<.6 && Math.abs(p.y-q.y)<.6 && Math.abs(p.width-q.width)<.6 && Math.abs(p.height-q.height)<.6) === i).slice(0, 100).map((p,i) => ({...p,id:"panel-"+i}));
}
function recognition(
  panels: DielineAnalysis["panels"],
): Pick<DielineAnalysis, "suggested" | "dimensions"> {
  if (panels.length < 4) return { suggested: null, dimensions: null };
  const sorted = [...panels].sort(
      (a, b) => b.width * b.height - a.width * a.height,
    ),
    large = sorted[0];
  const matching = panels.filter(
    (q) =>
      Math.abs(q.width - large.width) < 1 &&
      Math.abs(q.height - large.height) < 1,
  );
  const smallest = panels
    .map((q) => Math.min(q.width, q.height))
    .filter((n) => n >= 30)
    .sort((a, b) => a - b)[0];
  const sameRow = panels.filter(
    (q) => Math.abs(q.y - large.y) < 1 && Math.abs(q.height - large.height) < 1,
  );
  return {
    suggested:
      sameRow.length >= 4 ? "carton" : matching.length >= 2 ? "mailer" : null,
    dimensions: [
      Math.max(30, Math.min(800, large.width)),
      Math.max(30, Math.min(800, large.height)),
      Math.max(30, Math.min(800, smallest || 74)),
    ],
  };
}
export async function analyseSVG(file: File): Promise<DielineAnalysis> {
  const source = sanitizeDielineSVG(await file.text()),
    doc = new DOMParser().parseFromString(source, "image/svg+xml"),
    root = doc.documentElement;
  let w = svgLength(root.getAttribute("width")),
    h = svgLength(root.getAttribute("height"));
  const vb = root.getAttribute("viewBox")?.split(/[ ,]+/).map(Number) || [
    0,
    0,
    (w || 285) / MM,
    (h || 200) / MM,
  ];
  const physical = /mm|cm|in|pt/.test(root.getAttribute("width") || "");
  w = w || vb[2] * MM;
  h = h || vb[3] * MM;
  const temp = document.createElement("div");
  temp.style.cssText =
    "position:fixed;left:-20000px;top:0;width:1000px;height:1000px;visibility:hidden";
  temp.innerHTML = source;
  document.body.appendChild(temp);
  const svg = temp.querySelector("svg")!,
    lines: ImportLine[] = [];
  try {
    for (const el of Array.from(
      svg.querySelectorAll("path,line,polyline,polygon,rect"),
    ) as SVGGeometryElement[]) {
      let length = 0;
      try {
        length = el.getTotalLength();
      } catch {
        continue;
      }
      if (!length || !Number.isFinite(length)) continue;
      const steps = Math.min(400, Math.max(2, Math.ceil(length / 8))),
        points: number[][] = [];
      const matrix = el.getCTM(),
        base = svg.getCTM()?.inverse();
      if (!matrix || !base) continue;
      const transform = base.multiply(matrix);
      for (let i = 0; i <= steps; i++) {
        const pt = el.getPointAtLength((length * i) / steps),
          mapped = new DOMPoint(pt.x, pt.y).matrixTransform(transform);
        points.push([
          ((mapped.x - vb[0]) * w) / vb[2],
          ((mapped.y - vb[1]) * h) / vb[3],
        ]);
      }
      const closed =
          Math.hypot(
            points[0][0] - points.at(-1)![0],
            points[0][1] - points.at(-1)![1],
          ) < 0.5,
        label = (
          (el.getAttribute("id") || "") +
          " " +
          (el.parentElement?.getAttribute("id") || "")
        ).toLowerCase(),
        stroke = el.getAttribute("stroke") || getComputedStyle(el).stroke,
        dash =
          el.getAttribute("stroke-dasharray") ||
          getComputedStyle(el).strokeDasharray;
      const kind =
        /fold|crease|score/.test(label) || (dash && dash !== "none")
          ? "fold"
          : /art|logo|text/.test(label)
            ? "artwork"
            : "cut";
      lines.push({ id: "line-" + lines.length, points, closed, kind });
    }
  } finally {
    temp.remove();
  }
  const panels = linePanels(lines);
  return {
    name: file.name,
    width: w,
    height: h,
    scaleKnown: physical,
    lines,
    panels,
    preview: new Blob([source], { type: "image/svg+xml" }),
    pages: 1,
    page: 1,
    notes: physical
      ? ["Physical units found. Confirm panel and fold classification."]
      : [
          "No reliable physical units. Set a known measurement before creating 3D.",
        ],
    ...recognition(panels),
  };
}
export async function analyseDXF(file: File): Promise<DielineAnalysis> {
  const text = await file.text();
  if (text.length > 10000000) throw new Error("Use a DXF under 10 MB.");
  const rows = text.replaceAll("\r", "").split("\n"),
    pairs: [number, string][] = [];
  for (let i = 0; i + 1 < rows.length; i += 2)
    pairs.push([Number(rows[i].trim()), rows[i + 1].trim()]);
  const lines: ImportLine[] = [],
    entities: any[] = [];
  let current: any = null,
    units = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [code, value] = pairs[i];
    if (value === "$INSUNITS") {
      units = Number(pairs[i + 1]?.[1]);
    }
    if (code === 0) {
      if (current) entities.push(current);
      current = { type: value, values: [] };
    } else current?.values.push([code, value]);
  }
  if (current) entities.push(current);
  const factor = units === 1 ? 25.4 : units === 5 ? 10 : units === 6 ? 1000 : 1;
  for (const e of entities) {
    const val = (code: number) =>
        Number(e.values.find((v: any) => v[0] === code)?.[1] || 0),
      label = String(e.values.find((v: any) => v[0] === 8)?.[1] || "");
    let points: number[][] = [];
    if (e.type === "LINE")
      points = [
        [val(10), val(20)],
        [val(11), val(21)],
      ];
    if (e.type === "LWPOLYLINE") {
      let x = 0;
      for (const [c, v] of e.values) {
        if (c === 10) x = Number(v);
        if (c === 20) points.push([x, Number(v)]);
      }
      if (val(70) & 1) points.push(points[0]);
    }
    if (points.length > 1)
      lines.push({
        id: "line-" + lines.length,
        points: points.map(([x, y]) => [x * factor, -y * factor]),
        kind: /fold|crease|score/i.test(label)
          ? "fold"
          : /art|dim/i.test(label)
            ? "artwork"
            : "cut",
        closed: e.type === "LWPOLYLINE" && !!(val(70) & 1),
      });
  }
  if (!lines.length)
    throw new Error(
      "No supported LINE/LWPOLYLINE geometry found. Export a plain SVG or PDF.",
    );
  const all = lines.flatMap((l) => l.points),
    minX = Math.min(...all.map((p) => p[0])),
    minY = Math.min(...all.map((p) => p[1]));
  lines.forEach(
    (l) => (l.points = l.points.map(([x, y]) => [x - minX, y - minY])),
  );
  const width = Math.max(...lines.flatMap((l) => l.points.map((p) => p[0]))),
    height = Math.max(...lines.flatMap((l) => l.points.map((p) => p[1]))),
    panels = linePanels(lines),
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">${lines.map((l) => `<polyline fill="none" stroke="${l.kind === "fold" ? "#378b7e" : "#bd6174"}" stroke-width=".3" points="${l.points.map((p) => p.join(",")).join(" ")}"/>`).join("")}</svg>`;
  return {
    name: file.name,
    width,
    height,
    scaleKnown: units > 0,
    lines,
    panels,
    preview: new Blob([svg], { type: "image/svg+xml" }),
    pages: 1,
    page: 1,
    notes: [
      "DXF LINE and LWPOLYLINE geometry extracted. Confirm units, cuts and folds.",
    ],
    ...recognition(panels),
  };
}
export function extractPDFStrokePaths(ops: {fnArray: number[]; argsArray: any[]}, pdfjs: {OPS: Record<string, number>}, pageHeight: number) {
    const factor = 25.4 / 72;
    const lines: ImportLine[] = [];
    let matrix = [1, 0, 0, 1, 0, 0],
      stack: {matrix: number[]; dash: boolean; colour: number[]}[] = [],
      colour = [0, 0, 0],
      pending: ImportLine[] = [],
      dash = false,
      path: number[][] = [],
      commands: CutterCommand[] = [];
    const transform = (x: number, y: number) => [
      (matrix[0] * x + matrix[2] * y + matrix[4]) * factor,
      (pageHeight - (matrix[1] * x + matrix[3] * y + matrix[5])) * factor,
    ];
    // Subdivide in physical space: curved cutter paths must never become a chord.
    // A 0.01 mm control-polygon tolerance is below normal die manufacturing tolerance.
    const curve = (a: number[], b: number[], c: number[], d: number[], depth = 0) => {
      const distance = (p: number[]) => {
        const dx=d[0]-a[0], dy=d[1]-a[1];
        return Math.hypot(dx,dy) < 1e-10 ? Math.hypot(p[0]-a[0],p[1]-a[1]) : Math.abs(dy*p[0]-dx*p[1]+d[0]*a[1]-d[1]*a[0])/Math.hypot(dx,dy);
      };
      if (depth >= 16 || Math.max(distance(b),distance(c)) <= .01) { path.push(d); return; }
      const mid=(p:number[],q:number[])=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      const ab=mid(a,b),bc=mid(b,c),cd=mid(c,d),abc=mid(ab,bc),bcd=mid(bc,cd),centre=mid(abc,bcd);
      curve(a,ab,abc,centre,depth+1); curve(centre,bcd,cd,d,depth+1);
    };
    const flush = (closed = false) => {
      if(closed&&path.length){if(Math.hypot(path[0][0]-path.at(-1)![0],path[0][1]-path.at(-1)![1])>1e-8)path.push(path[0]);if(commands.at(-1)?.[0]!=='Z')commands.push(['Z']);}
      if (path.length > 1)
        pending.push({
          id: "pending",
          colour: [...colour],
          points: path,
          commands,
          kind: dash ? "fold" : "cut",
          closed,
        });
      path = []; commands = [];
    };
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i],
        arg = ops.argsArray[i];
      if (op === pdfjs.OPS.save) stack.push({matrix: [...matrix], dash, colour: [...colour]});
      else if (op === pdfjs.OPS.restore) {
        const state = stack.pop();
        if (state) { matrix = state.matrix; dash = state.dash; colour = state.colour; }
      } else if (op === pdfjs.OPS.setStrokeRGBColor) colour = Array.from(arg) as number[];
      else if (op === pdfjs.OPS.transform) {
        const [a, b, c, d, e, f] = arg,
          [aa, bb, cc, dd, ee, ff] = matrix;
        matrix = [
          aa * a + cc * b,
          bb * a + dd * b,
          aa * c + cc * d,
          bb * c + dd * d,
          aa * e + cc * f + ee,
          bb * e + dd * f + ff,
        ];
      } else if (op === pdfjs.OPS.setDash) dash = !!arg[0]?.length;
      else if (op === pdfjs.OPS.constructPath) {
        const [operators, coords] = arg;
        let at = 0;
        for (const command of operators) {
          if (command === pdfjs.OPS.moveTo) {
            flush();
            const point=transform(coords[at++], coords[at++]);path.push(point);commands.push(['M',point[0],point[1]]);
          } else if (command === pdfjs.OPS.lineTo) {
            const point=transform(coords[at++], coords[at++]);path.push(point);commands.push(['L',point[0],point[1]]);
          }
          else if (command === pdfjs.OPS.rectangle) {
            flush();
            const [x, y, w, h] = coords.slice(at, at + 4);
            at += 4;
            path = [
              transform(x, y),
              transform(x + w, y),
              transform(x + w, y + h),
              transform(x, y + h),
              transform(x, y),
            ];
            commands=path.map((p,i)=>[i?'L':'M',p[0],p[1]] as CutterCommand);
            flush(true);
          } else if (command === pdfjs.OPS.closePath) {
            if (path.length) path.push(path[0]);
            flush(true);
          } else if (command === pdfjs.OPS.curveTo) {
            const a=path[path.length-1], b=transform(coords[at++],coords[at++]), c=transform(coords[at++],coords[at++]), d=transform(coords[at++],coords[at++]);
            commands.push(['C',b[0],b[1],c[0],c[1],d[0],d[1]]);
            if(a) curve(a,b,c,d);
          } else if (command === pdfjs.OPS.curveTo2 || command === pdfjs.OPS.curveTo3) {
            const a=path[path.length-1], control=transform(coords[at++],coords[at++]), d=transform(coords[at++],coords[at++]);
            if(a){const b=command===pdfjs.OPS.curveTo2?a:control,c=command===pdfjs.OPS.curveTo2?control:d;commands.push(['C',b[0],b[1],c[0],c[1],d[0],d[1]]);curve(a,b,c,d);}
          }
        }
      } else if (
        [
          pdfjs.OPS.stroke,
          pdfjs.OPS.closeStroke,
          pdfjs.OPS.fillStroke,
          pdfjs.OPS.eoFillStroke,
        ].includes(op)
      ) {
        flush(op === pdfjs.OPS.closeStroke);
        lines.push(...pending.map(l => ({...l, id: "line-" + (lines.length + pending.indexOf(l))})));
        pending = [];
      } else if (
        [pdfjs.OPS.fill, pdfjs.OPS.eoFill, pdfjs.OPS.endPath].includes(op)
      ) { path = []; pending = []; }
    }
    // Coloured cutter strokes are distinct from product illustrations and filled logos.
    const coloured = lines.filter(l => l.colour && Math.max(...l.colour)-Math.min(...l.colour) > .2);
    if (coloured.length) for (const l of lines) {
      if (!coloured.includes(l)) l.kind = "artwork";
    }
    else for (const l of lines) {
      const xs=l.points.map(p=>p[0]), ys=l.points.map(p=>p[1]);
      if (Math.max(...xs)-Math.min(...xs)<20 && Math.max(...ys)-Math.min(...ys)<20) l.kind="artwork";
    }
    return lines;
}
export async function analysePDF(
  file: File,
  pageNumber = 1,
): Promise<DielineAnalysis> {
  const bytes = await file.arrayBuffer();
  let profile: StudioPackageProfile | null = await studioPackageProfile(bytes);
  const { datasheetPdfReader } = await import("./datasheet-pdf-reader"),
    pdfjs = await datasheetPdfReader(),
    task = pdfjs.getDocument({cMapUrl:"/tools/studio-runtime/datasheets/cmaps/",cMapPacked:true,standardFontDataUrl:"/tools/studio-runtime/datasheets/standard-fonts/",
      data: new Uint8Array(bytes),
      isEvalSupported: false,
    });
  try {
    const doc = await task.promise,
      page = await doc.getPage(pageNumber),
      viewport = page.getViewport({ scale: 1 }),
      factor = 25.4 / 72,
      lines: ImportLine[] = [];
    if(!profile && pageNumber===1) {
      const metadata=await doc.getMetadata().catch(()=>null);
      profile=readPdfMap(metadata?.metadata?.get('jspdf:metadata'),viewport.width*factor,viewport.height*factor);
    }
    if(profile?.net.sourcePaths) {
      lines.push(...profile.net.sourcePaths.map((path,i)=>({id:`source-${i}`,kind:path.kind,commands:path.commands,points:cutterPathPoints(path),closed:false})));
    } else if(profile) {
      for(const [kind,edges]of [['cut',netEdges(profile.net)],['fold',foldEdges(profile.net)]] as const)for(const [i,[x,y,X,Y]]of edges.entries())lines.push({id:`${kind}-${i}`,kind,points:[[x,y],[X,Y]],closed:false});
    } else lines.push(...extractPDFStrokePaths(await page.getOperatorList(),pdfjs,viewport.height));
    const content = (await page.getTextContent()).items.map((item: any) => item.str || "").join(" ");
    const detected = detectBoxDimensions(content, file.name);
    const annotatedDimensions = detected.dimensions;
    const canvas = document.createElement("canvas"),
      v = page.getViewport({
        scale: Math.min(3, 4096 / Math.max(viewport.width, viewport.height)),
      });
    canvas.width = v.width;
    canvas.height = v.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: v })
      .promise;
    const preview = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PDF preview failed."))),
        "image/png",
      ),
    );
    let artworkPreview: Blob | undefined;
    const prepareArtwork=(artCanvas:HTMLCanvasElement)=>{
      if(profile?.net.sourcePaths)cleanStructuralInk(artCanvas,profile.net.sourcePaths,profile.net.width,profile.net.height);
      return new Promise<Blob>((resolve,reject)=>artCanvas.toBlob(b=>b?resolve(b):reject(new Error("Artwork rendering failed")),"image/png"));
    };
    if (profile && profile.artworkPage !== pageNumber) {
      const artPage = await doc.getPage(profile.artworkPage);
      const artViewport = artPage.getViewport({scale:v.scale});
      const artCanvas = document.createElement("canvas");
      artCanvas.width = artViewport.width; artCanvas.height = artViewport.height;
      await artPage.render({canvasContext:artCanvas.getContext("2d")!,viewport:artViewport}).promise;
      artworkPreview = await prepareArtwork(artCanvas);
    }
    if(profile && !artworkPreview)artworkPreview=await prepareArtwork(canvas);
    const panels = profile ? profile.net.pieces.map(q=>({id:q.id,holes:q.holes?.map(ring=>ring.map(([x,y])=>[q.x+x,q.y+y])),islands:q.islands?.map(ring=>ring.map(([x,y])=>[q.x+x,q.y+y])),points:(q.points || [[0,0],[q.w,0],[q.w,q.h],[0,q.h]]).map(([x,y])=>[q.x+x,q.y+y]),...(profile?.artworkRects?.[q.id] || {x:q.x,y:q.y,width:q.w,height:q.h})})) : linePanels(lines);
    return {
      name: file.name,
      width: viewport.width * factor,
      height: viewport.height * factor,
      scaleKnown: true,
      lines,
      panels,
      preview,
      artworkPreview,
      studioProfile: profile || undefined,
      pages: doc.numPages,
      page: pageNumber,
      notes: [
        ...detected.notes,
        lines.length
          ? "Vector strokes extracted. PDF page size is known, but artwork may be drawn at reduced scale. Confirm one measurement."
          : "This PDF is flattened. Trace panels and calibrate a known measurement.",
      ],
      ...recognition(panels),
      ...(annotatedDimensions ? {dimensions: annotatedDimensions} : {}),
      ...(profile ? {dimensions:profile.dimensions, suggested:"custom" as const, notes:[...detected.notes, ...(detected.dimensions && detected.dimensions.some((v,i)=>Math.abs(v-profile!.dimensions[i])>.1) ? ["Detected dimensions differ from the reviewed fold map. The reviewed size is retained; confirm dimensions before resizing."] : []), ...(profile.geometryNotes || []), profile.id.startsWith("studio-export-") ? "Studio export fold map restored. Panels and hinges are ready for the live mockup." : "Studio reference matched by file content. Curved flaps, rollover walls, hinges and panel artwork have a prepared fold map.", profile.artworkPage !== pageNumber ? `Mockup artwork uses clean page ${profile.artworkPage}; dimension labels and cutter guides stay in the reference.` : "Artwork is cropped from this page at the mapped panel boundaries.", profile.scale !== 1 ? "This drawing is reduced-scale. Calibration to its 200 mm dimension is applied automatically." : "Source drawing uses actual-size millimetres."]} : {}),
    };
  } finally {
    await task.destroy();
  }
}
export async function analyseImage(file: File): Promise<DielineAnalysis> {
  const img = await createImageBitmap(file);
  const width = img.width * MM,
    height = img.height * MM;
  img.close();
  return {
    name: file.name,
    width,
    height,
    scaleKnown: false,
    lines: [],
    panels: [],
    preview: file,
    pages: 1,
    page: 1,
    notes: [
      "Image pixels do not establish millimetres. Calibrate scale and trace each panel.",
    ],
    suggested: null,
    dimensions: null,
  };
}
export async function analyseDieline(file: File, page = 1) {
  if (file.size > 50 * 1024 * 1024)
    throw new Error("Use a dieline under 50 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "svg") return analyseSVG(file);
  if (ext === "dxf") return analyseDXF(file);
  if (
    ext === "pdf" ||
    (ext === "ai" &&
      new TextDecoder()
        .decode((await file.arrayBuffer()).slice(0, 8))
        .startsWith("%PDF"))
  )
    return analysePDF(file, page);
  if (["png", "jpg", "jpeg", "webp"].includes(ext || ""))
    return analyseImage(file);
  throw new Error(
    "This native file needs the Studio processing service. PDF-compatible AI files work directly; otherwise export PDF/SVG or connect the service.",
  );
}
/** A complete custom box needs a single rooted, acyclic panel tree. */
export function foldMappingProblem(items: {id: string; parent?: string}[]): string | null {
  if (items.length < 2) return "Trace at least two panels before mapping a 3D package.";
  const byId = new Map(items.map(q => [q.id, q]));
  if (byId.size !== items.length) return "Panel IDs must be unique.";
  const roots = items.filter(q => !q.parent);
  if (roots.length !== 1) return `Keep one root panel and connect the other panels to their parent folds. ${roots.length} panels are currently disconnected.`;
  for (const item of items) {
    const visited = new Set<string>();
    let current: typeof item | undefined = item;
    while (current?.parent) {
      if (visited.has(current.id)) return "Panel connections form a cycle. Each panel must lead back to the root.";
      visited.add(current.id);
      current = byId.get(current.parent);
      if (!current) return "A selected parent panel is missing. Review the fold mapping.";
    }
  }
  return null;
}
export function customNetFromPanels(
  analysis: DielineAnalysis,
  scale: number,
  mapping: {
    id: string;
    name: string;
    parent: string;
    edge: "top" | "bottom" | "left" | "right";
    angle: number;
  }[],
): StudioNet {
  const pieces: FoldPiece[] = analysis.panels.map((q) => ({
    id: q.id,
    face: q.id,
    component: "custom",
    x: q.x * scale,
    y: q.y * scale,
    w: q.width * scale,
    h: q.height * scale,
    ...(q.points ? {points:q.points.map(([x,y])=>[(x-q.x)*scale,(y-q.y)*scale])} : {}),
    holes:q.holes?.map(ring=>ring.map(([x,y])=>[(x-q.x)*scale,(y-q.y)*scale])),
    islands:q.islands?.map(ring=>ring.map(([x,y])=>[(x-q.x)*scale,(y-q.y)*scale])),
  }));
  for (const m of mapping) {
    const q = pieces.find((q) => q.id === m.id),
      parent = pieces.find((q) => q.id === m.parent);
    if (!q || !parent) continue;
    q.parent = parent.id;
    const x = q.x,
      y = q.y,
      w = q.w,
      h = q.h;
    const a: [number, number] =
        m.edge === "top"
          ? [x, y]
          : m.edge === "bottom"
            ? [x, y + h]
            : m.edge === "left"
              ? [x, y]
              : [x + w, y],
      b: [number, number] =
        m.edge === "top"
          ? [x + w, y]
          : m.edge === "bottom"
            ? [x + w, y + h]
            : m.edge === "left"
              ? [x, y + h]
              : [x + w, y + h];
    const onParent = ([hx, hy]: [number, number]) =>
      hx >= parent.x - .6 && hx <= parent.x + parent.w + .6 &&
      hy >= parent.y - .6 && hy <= parent.y + parent.h + .6 &&
      Math.min(Math.abs(hx-parent.x), Math.abs(hx-parent.x-parent.w), Math.abs(hy-parent.y), Math.abs(hy-parent.y-parent.h)) < .6;
    if (!onParent(a) || !onParent(b))
      throw new Error(`${m.name}: the selected crease does not share an edge with its parent. Check the panel boundary and hinge edge.`);
    q.hinge = { a, b, angle: m.angle };
  }
  const structural=analysis.lines.filter(line=>line.kind!=='artwork');
  const sourcePaths=structural.length&&structural.every(line=>line.commands?.length) ? structural.map(line=>{
    const midpoint=line.points[Math.floor(line.points.length/2)];
    const owner=pieces.reduce((best,q)=>{
      const distance=(piece:FoldPiece)=>Math.hypot(Math.max(piece.x-midpoint[0]*scale,0,midpoint[0]*scale-piece.x-piece.w),Math.max(piece.y-midpoint[1]*scale,0,midpoint[1]*scale-piece.y-piece.h));
      return !best||distance(q)<distance(best)?q:best;
    },undefined as FoldPiece|undefined);
    return {kind:line.kind as 'cut'|'fold',piece:owner?.id,commands:line.commands!.map(c=>[c[0],...c.slice(1).map(v=>(v as number)*scale)] as CutterCommand)};
  }) : undefined;
  return {
    width: analysis.width * scale,
    height: analysis.height * scale,
    pieces,
    ...(sourcePaths?{sourcePaths}:{}),
  };
}
