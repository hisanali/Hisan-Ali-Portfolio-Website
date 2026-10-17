/** Generic vector library for this browser workspace. */
export type StudioAsset = {
  id: string;
  name: string;
  category: string;
  svg: string;
  width: number;
  height: number;
};
const svg = (body: string, width = 100, height = 100) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const asset = (
  id: string,
  name: string,
  category: string,
  body: string,
  width = 100,
  height = 100,
): StudioAsset => ({
  id,
  name,
  category,
  svg: svg(body, width, height),
  width,
  height,
});
const path = (d: string) => `<path d="${d}"/>`;
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const circle = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const rect = (x: number, y: number, w: number, h: number, r = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const polygon = (
  sides: number,
  radius: number,
  rotation = -Math.PI / 2,
  cx = 50,
  cy = 50,
) =>
  `<polygon points="${Array.from({ length: sides }, (_, i) => `${cx + radius * Math.cos(rotation + (i * Math.PI * 2) / sides)},${cy + radius * Math.sin(rotation + (i * Math.PI * 2) / sides)}`).join(" ")}"/>`;
const repeat = (n: number, f: (i: number) => string) =>
  Array.from({ length: n }, (_, i) => f(i)).join("");

const leaf = (x: number, y: number, s: number, rotation: number) =>
  `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${s})">${path("M0 0Q-20 -20 0 -40Q20 -20 0 0ZM0 0V-35")}</g>`;
// Only practical print-layout elements belong in the default Studio library.
// Handling symbols must be curated production artwork, never schematic placeholders.
export const STUDIO_ELEMENTS: StudioAsset[] = [
  asset("border-1", "Fine rule", "Borders", line(5, 50, 95, 50)),
  asset("border-2", "Double rule", "Borders", line(5, 45, 95, 45) + line(5, 55, 95, 55)),
  asset("border-3", "Dotted rule", "Borders", repeat(19, (i) => circle(5 + i * 5, 50, 1))),
  asset("border-4", "Dashed rule", "Borders", '<path d="M5 50H95" stroke-dasharray="7 5"/>'),
  asset("border-10", "Corner brackets", "Borders", path("M30 10H10V30M70 10H90V30M10 70V90H30M70 90H90V70")),
  asset("border-11", "Rounded frame", "Borders", rect(10, 10, 80, 80, 15)),
  asset("border-12", "Inset frame", "Borders", rect(10, 10, 80, 80) + rect(16, 16, 68, 68)),
  asset("border-20", "Open frame", "Borders", path("M40 10H10V90H90V60")),
];
const patternDefinitions: [string, string, string][] = [
  ["pinstripe", "Pinstripe", repeat(5, (i) => line(i * 20, 0, i * 20, 100))],
  [
    "horizontal-rule",
    "Horizontal rules",
    repeat(5, (i) => line(0, i * 20, 100, i * 20)),
  ],
  [
    "diagonal",
    "Diagonal lines",
    repeat(9, (i) => line(-100 + i * 25, 0, i * 25, 100)),
  ],
  [
    "crosshatch",
    "Crosshatch",
    repeat(
      9,
      (i) =>
        line(-100 + i * 25, 0, i * 25, 100) +
        line(i * 25, 0, -100 + i * 25, 100),
    ),
  ],
  [
    "dot-grid",
    "Dot grid",
    repeat(25, (i) =>
      circle(10 + (i % 5) * 20, 10 + Math.floor(i / 5) * 20, 2),
    ),
  ],
  [
    "offset-dots",
    "Offset dots",
    repeat(25, (i) =>
      circle(
        5 + (i % 5) * 20 + (Math.floor(i / 5) % 2) * 10,
        10 + Math.floor(i / 5) * 20,
        3,
      ),
    ),
  ],
  [
    "tiny-check",
    "Fine gingham",
    repeat(25, (i) =>
      (i + Math.floor(i / 5)) % 2
        ? rect((i % 5) * 20, Math.floor(i / 5) * 20, 20, 20)
        : "",
    ),
  ],
  [
    "grid",
    "Architect grid",
    repeat(
      5,
      (i) => line(i * 20, 0, i * 20, 100) + line(0, i * 20, 100, i * 20),
    ),
  ],
  [
    "diamond-lattice",
    "Diamond lattice",
    repeat(
      9,
      (i) =>
        line(-100 + i * 25, 0, i * 25, 100) +
        line(i * 25, 0, -100 + i * 25, 100),
    ) + circle(50, 50, 4),
  ],
  [
    "hex-tile",
    "Hexagonal tile",
    repeat(9, (i) =>
      polygon(
        6,
        17,
        Math.PI / 6,
        18 + (i % 3) * 32,
        18 + Math.floor(i / 3) * 32,
      ),
    ),
  ],
  [
    "triangles",
    "Triangle tiles",
    repeat(16, (i) =>
      polygon(
        3,
        12,
        Math.floor(i / 4) % 2 ? Math.PI / 2 : -Math.PI / 2,
        12 + (i % 4) * 25,
        12 + Math.floor(i / 4) * 25,
      ),
    ),
  ],
  [
    "circles",
    "Linked circles",
    repeat(9, (i) =>
      circle(16 + (i % 3) * 34, 16 + Math.floor(i / 3) * 34, 20),
    ),
  ],
  [
    "arches",
    "Repeating arches",
    repeat(9, (i) =>
      path(
        `M${(i % 3) * 34} ${Math.floor(i / 3) * 34 + 34}V${Math.floor(i / 3) * 34 + 17}a17 17 0 0 1 34 0v17`,
      ),
    ),
  ],
  [
    "scales",
    "Scallop tiles",
    repeat(12, (i) =>
      path(`M${(i % 4) * 25} ${Math.floor(i / 4) * 34}a25 25 0 0 0 50 0`),
    ),
  ],
  [
    "chevrons",
    "Chevron rows",
    repeat(5, (i) =>
      path(
        `M0 ${i * 20}L25 ${i * 20 + 15}L50 ${i * 20}L75 ${i * 20 + 15}L100 ${i * 20}`,
      ),
    ),
  ],
  [
    "herringbone",
    "Herringbone",
    repeat(
      16,
      (i) =>
        `<g transform="translate(${(i % 4) * 25} ${Math.floor(i / 4) * 25}) rotate(${((i % 4) + Math.floor(i / 4)) % 2 ? 45 : -45} 12 12)">${rect(4, 7, 25, 10)}</g>`,
    ),
  ],
  [
    "art-deco",
    "Art deco fans",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${(i % 2) * 50} ${Math.floor(i / 2) * 50})">${path("M0 45Q25 0 50 45M5 45Q25 10 45 45M10 45Q25 20 40 45M25 45V15")}</g>`,
    ),
  ],
  [
    "stepped",
    "Deco steps",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${(i % 2) * 50} ${Math.floor(i / 2) * 50})">${path("M0 45V30H10V20H20V10H30V20H40V30H50V45")}</g>`,
    ),
  ],
  [
    "greek-key",
    "Greek key",
    repeat(4, (i) =>
      path(
        `M${i * 25} 0V100M${i * 25} 25h20v20h-12v-12M${i * 25} 75h20v20h-12v-12`,
      ),
    ),
  ],
  [
    "woven",
    "Woven strips",
    repeat(
      5,
      (i) =>
        line(i * 20, 0, i * 20, 100) +
        line(i * 20 + 5, 0, i * 20 + 5, 100) +
        line(0, i * 20, 100, i * 20) +
        line(0, i * 20 + 5, 100, i * 20 + 5),
    ),
  ],
  [
    "leaf-sprigs",
    "Leaf sprigs",
    repeat(
      6,
      (i) =>
        `<g transform="translate(${15 + (i % 3) * 32} ${35 + Math.floor(i / 3) * 50})">${leaf(0, 0, 0.55, -25)}</g>`,
    ),
  ],
  [
    "olive",
    "Olive branches",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${(i % 2) * 50} ${Math.floor(i / 2) * 50})">${path("M10 45L35 5") + leaf(20, 30, 0.35, -50) + leaf(28, 18, 0.35, 50)}</g>`,
    ),
  ],
  [
    "petals",
    "Four petal flowers",
    repeat(
      9,
      (i) =>
        `<g transform="translate(${17 + (i % 3) * 33} ${17 + Math.floor(i / 3) * 33})">${repeat(4, (j) => `<ellipse cx="0" cy="-7" rx="4" ry="7" transform="rotate(${j * 90})"/>`)}</g>`,
    ),
  ],
  [
    "daisy-field",
    "Daisy field",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${25 + (i % 2) * 50} ${25 + Math.floor(i / 2) * 50})">${circle(0, 0, 3) + repeat(8, (j) => `<ellipse cx="0" cy="-11" rx="3" ry="7" transform="rotate(${j * 45})"/>`)}</g>`,
    ),
  ],
  [
    "fern-field",
    "Fern field",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${(i % 2) * 50} ${Math.floor(i / 2) * 50})">${path("M25 45V5") + repeat(4, (j) => path(`M25 ${15 + j * 8}L12 ${7 + j * 8}M25 ${15 + j * 8}L38 ${7 + j * 8}`))}</g>`,
    ),
  ],
  [
    "bamboo-grid",
    "Bamboo grove",
    repeat(
      4,
      (i) =>
        line(12 + i * 25, 0, 12 + i * 25, 100) +
        repeat(4, (j) => line(8 + i * 25, j * 25, 16 + i * 25, j * 25)),
    ),
  ],
  [
    "water-drops",
    "Water drops",
    repeat(
      9,
      (i) =>
        `<g transform="translate(${(i % 3) * 34} ${Math.floor(i / 3) * 34})">${path("M17 3Q0 22 17 29Q34 22 17 3Z")}</g>`,
    ),
  ],
  [
    "ripples",
    "Water ripples",
    repeat(
      4,
      (i) =>
        `<g transform="translate(${25 + (i % 2) * 50} ${25 + Math.floor(i / 2) * 50})"><ellipse rx="22" ry="8"/><ellipse rx="12" ry="4"/></g>`,
    ),
  ],
  [
    "waves",
    "Optional wave lines",
    repeat(5, (i) =>
      path(
        `M0 ${i * 20 + 10}Q25 ${i * 20 - 5} 50 ${i * 20 + 10}T100 ${i * 20 + 10}`,
      ),
    ),
  ],
  [
    "bubble",
    "Air bubbles",
    circle(10, 20, 8) +
      circle(40, 15, 4) +
      circle(75, 20, 12) +
      circle(25, 65, 15) +
      circle(65, 55, 7) +
      circle(88, 80, 9) +
      circle(50, 90, 5),
  ],
  [
    "contour",
    "Contour lines",
    repeat(7, (i) =>
      path(
        `M0 ${15 + i * 12}Q25 ${-15 + i * 12} 55 ${20 + i * 12}T100 ${10 + i * 12}`,
      ),
    ),
  ],
  [
    "pebbles",
    "Pebble outlines",
    path(
      "M5 10Q20 0 30 15Q35 35 15 30Q0 25 5 10ZM50 10Q75 0 85 20Q90 40 60 35Q40 28 50 10ZM10 60Q35 40 45 65Q40 85 15 85Q0 80 10 60ZM60 65Q80 40 95 65Q100 95 75 95Q55 90 60 65Z",
    ),
  ],
  [
    "grain",
    "Fine paper marks",
    repeat(25, (i) =>
      line(
        (i * 37) % 100,
        (i * 17) % 100,
        ((i * 37) % 100) + 3,
        ((i * 17) % 100) + 1,
      ),
    ),
  ],
  [
    "dash-field",
    "Short dash field",
    repeat(25, (i) =>
      line(
        7 + (i % 5) * 20,
        10 + Math.floor(i / 5) * 20,
        13 + (i % 5) * 20,
        10 + Math.floor(i / 5) * 20,
      ),
    ),
  ],
  [
    "plus-field",
    "Plus marks",
    repeat(
      16,
      (i) =>
        line(
          8 + (i % 4) * 25,
          12 + Math.floor(i / 4) * 25,
          16 + (i % 4) * 25,
          12 + Math.floor(i / 4) * 25,
        ) +
        line(
          12 + (i % 4) * 25,
          8 + Math.floor(i / 4) * 25,
          12 + (i % 4) * 25,
          16 + Math.floor(i / 4) * 25,
        ),
    ),
  ],
  [
    "sparkle",
    "Sparkle field",
    repeat(
      9,
      (i) =>
        `<g transform="translate(${17 + (i % 3) * 33} ${17 + Math.floor(i / 3) * 33})">${path("M0 -10Q2 -2 10 0Q2 2 0 10Q-2 2 -10 0Q-2 -2 0 -10Z")}</g>`,
    ),
  ],
  [
    "confetti",
    "Confetti",
    repeat(
      15,
      (i) =>
        `<g transform="translate(${(i * 37) % 100} ${(i * 23) % 100}) rotate(${i * 31})">${rect(0, 0, 3, 8)}</g>`,
    ),
  ],
  [
    "bricks",
    "Brickwork",
    repeat(
      4,
      (i) =>
        line(0, i * 25, 100, i * 25) +
        repeat(4, (j) =>
          line(
            j * 25 + (i % 2) * 12,
            i * 25,
            j * 25 + (i % 2) * 12,
            i * 25 + 25,
          ),
        ),
    ),
  ],
  [
    "truchet",
    "Quarter circle tiles",
    repeat(
      16,
      (i) =>
        `<g transform="translate(${(i % 4) * 25} ${Math.floor(i / 4) * 25}) rotate(${((i * 7) % 4) * 90} 12.5 12.5)">${path("M0 12.5A12.5 12.5 0 0 0 12.5 0M12.5 25A12.5 12.5 0 0 1 25 12.5")}</g>`,
    ),
  ],
  [
    "interlace",
    "Interlaced ribbons",
    repeat(4, (i) =>
      path(
        `M0 ${i * 25}Q25 ${i * 25 + 25} 50 ${i * 25}T100 ${i * 25}M0 ${i * 25 + 10}Q25 ${i * 25 - 15} 50 ${i * 25 + 10}T100 ${i * 25 + 10}`,
      ),
    ),
  ],
];
export const STUDIO_PATTERNS: StudioAsset[] = patternDefinitions
  .filter(([id]) => ["pinstripe", "horizontal-rule", "diagonal", "crosshatch", "dot-grid", "diamond", "hexagon", "herringbone", "ripples", "waves", "contour"].includes(id))
  .map(([id, name, body]) => asset(`pattern-${id}`, name,
    ["ripples", "waves", "contour"].includes(id) ? "Water & stone" : "Geometric", body));
export const STUDIO_TEMPLATES = [
  [
    "noir-gold",
    "Noir & gold",
    "Luxury",
    "#182027",
    "#e3ca9b",
    "#a98b55",
    "frame",
  ],
  [
    "ivory-deco",
    "Ivory art deco",
    "Luxury",
    "#f6f1e6",
    "#484134",
    "#b49960",
    "deco",
    "pattern-art-deco",
  ],
  [
    "charcoal-arch",
    "Charcoal arch",
    "Luxury",
    "#29282c",
    "#efe9df",
    "#8a7970",
    "arch",
  ],
  [
    "pearl-label",
    "Pearl label",
    "Luxury",
    "#edebe4",
    "#44433f",
    "#a89d87",
    "label",
  ],
  [
    "burgundy",
    "Burgundy collection",
    "Luxury",
    "#512b39",
    "#f4e8d8",
    "#c8a378",
    "frame",
  ],
  [
    "deep-green",
    "Deep green edition",
    "Luxury",
    "#253c32",
    "#eee9dc",
    "#b5a47a",
    "split",
  ],
  [
    "pure-white",
    "Pure white",
    "Minimal",
    "#ffffff",
    "#252b30",
    "#aeb5b9",
    "logo-centre",
  ],
  [
    "quiet-grey",
    "Quiet grey",
    "Minimal",
    "#f0f1f0",
    "#30383b",
    "#9aa6a8",
    "corner",
  ],
  [
    "black-type",
    "Black typography",
    "Minimal",
    "#ffffff",
    "#191919",
    "#c5c5c5",
    "type-led",
  ],
  [
    "stone-panel",
    "Stone panel",
    "Minimal",
    "#ebe9e3",
    "#4d4b47",
    "#bbb7ac",
    "split",
  ],
  [
    "thin-rule",
    "Fine rule",
    "Minimal",
    "#fafaf8",
    "#343b40",
    "#929a9c",
    "rule",
  ],
  [
    "wide-margin",
    "Wide margins",
    "Minimal",
    "#f6f7f5",
    "#2a3c46",
    "#758d98",
    "label",
  ],
  [
    "blue-grid",
    "Blue grid",
    "Geometric",
    "#edf4f7",
    "#254254",
    "#8fa9b7",
    "corner",
    "pattern-grid",
  ],
  [
    "terracotta-block",
    "Terracotta blocks",
    "Geometric",
    "#f3e6da",
    "#7b4d3c",
    "#be7b5c",
    "split",
  ],
  [
    "sage-arch",
    "Sage arches",
    "Geometric",
    "#e2e8df",
    "#435347",
    "#90a18e",
    "arch",
    "pattern-arches",
  ],
  [
    "sand-diamond",
    "Sand diamonds",
    "Geometric",
    "#eee7d6",
    "#615444",
    "#b59c79",
    "band",
    "pattern-diamond-lattice",
  ],
  [
    "deco-fan",
    "Deco fans",
    "Geometric",
    "#e8e5df",
    "#38444b",
    "#a89c81",
    "deco",
    "pattern-art-deco",
  ],
  [
    "cobalt-step",
    "Cobalt steps",
    "Geometric",
    "#f4f5f7",
    "#244b7b",
    "#678eb6",
    "corner",
    "pattern-stepped",
  ],
  [
    "olive-garden",
    "Olive garden",
    "Botanical",
    "#eceee3",
    "#4b5e40",
    "#91a07b",
    "botanical",
    "pattern-olive",
  ],
  [
    "fern-paper",
    "Fern paper",
    "Botanical",
    "#f4f1e7",
    "#3f5847",
    "#8ba58b",
    "frame",
    "pattern-fern-field",
  ],
  [
    "lotus-calm",
    "Lotus calm",
    "Botanical",
    "#eee9e7",
    "#705c68",
    "#b79ca9",
    "label",
  ],
  [
    "bamboo-natural",
    "Bamboo natural",
    "Botanical",
    "#f0ebda",
    "#525c39",
    "#afb080",
    "band",
    "pattern-bamboo-grid",
  ],
  [
    "petal-cream",
    "Petal cream",
    "Botanical",
    "#faf0e4",
    "#775f4e",
    "#c5a488",
    "botanical",
    "pattern-petals",
  ],
  [
    "ink-leaves",
    "Ink leaves",
    "Botanical",
    "#f8f7f1",
    "#293e35",
    "#86998d",
    "corner",
    "pattern-leaf-sprigs",
  ],
  [
    "retail-strip",
    "Retail colour strip",
    "Retail",
    "#ffffff",
    "#252d36",
    "#e58a45",
    "band",
  ],
  [
    "retail-info",
    "Retail information",
    "Retail",
    "#f7f8f9",
    "#293744",
    "#4c8cb8",
    "spec-grid",
  ],
  [
    "retail-tag",
    "Retail label",
    "Retail",
    "#ecefe9",
    "#334639",
    "#74a577",
    "label",
  ],
  [
    "retail-bold",
    "Retail bold title",
    "Retail",
    "#f0e9da",
    "#282c35",
    "#d4a748",
    "type-led",
  ],
  [
    "kraft-black",
    "Kraft & black",
    "Kraft",
    "#bd956c",
    "#28231d",
    "#67513a",
    "logo-centre",
  ],
  [
    "kraft-grid",
    "Kraft architect",
    "Kraft",
    "#c3a078",
    "#382e24",
    "#846e52",
    "spec-grid",
    "pattern-grid",
  ],
  [
    "kraft-garden",
    "Kraft garden",
    "Kraft",
    "#b7926b",
    "#344336",
    "#73836a",
    "botanical",
    "pattern-olive",
  ],
  [
    "kraft-label",
    "Kraft label",
    "Kraft",
    "#c6a27c",
    "#3b3028",
    "#efe2ce",
    "label",
  ],
  [
    "kraft-white",
    "Kraft & white",
    "Kraft",
    "#ac855e",
    "#fffaf0",
    "#d7b795",
    "frame",
  ],
  [
    "kraft-craft",
    "Kraft stitched",
    "Kraft",
    "#be9c76",
    "#4a3c30",
    "#856b50",
    "rule",
    "pattern-dash-field",
  ],
].filter((t)=>t[2]!=="Botanical" && t[0]!=="kraft-garden").map(([id, name, category, background, ink, accent, layout, patternId]) => ({
  id,
  name,
  category,
  background,
  ink,
  accent,
  layout,
  patternId,
}));
export type StudioScene = {
  id: string;
  name: string;
  background: string;
  surface: "neutral" | "wood" | "stone" | "concrete";
  stage: "studio" | "table" | "floor" | "pedestal";
  light: number;
};
export const STUDIO_SCENES: StudioScene[] = [
  {
    id: "soft-white",
    name: "Soft white studio",
    background: "#f3f4f5",
    surface: "neutral",
    stage: "studio",
    light: 1.1,
  },
  {
    id: "warm-paper",
    name: "Warm paper studio",
    background: "#e9e3d8",
    surface: "neutral",
    stage: "studio",
    light: 1,
  },
  {
    id: "cool-grey",
    name: "Cool grey studio",
    background: "#d7dde1",
    surface: "neutral",
    stage: "studio",
    light: 1.15,
  },
  {
    id: "dark-studio",
    name: "Charcoal studio",
    background: "#2a3038",
    surface: "neutral",
    stage: "studio",
    light: 1.3,
  },
  {
    id: "oak-table",
    name: "Oak tabletop",
    background: "#e9e4dc",
    surface: "wood",
    stage: "table",
    light: 1,
  },
  {
    id: "walnut-table",
    name: "Walnut tabletop",
    background: "#c9bbae",
    surface: "wood",
    stage: "table",
    light: 0.9,
  },
  {
    id: "stone-table",
    name: "Stone tabletop",
    background: "#e8e6e1",
    surface: "stone",
    stage: "table",
    light: 1.15,
  },
  {
    id: "concrete-floor",
    name: "Concrete floor",
    background: "#d4d4d0",
    surface: "concrete",
    stage: "floor",
    light: 1.2,
  },
  {
    id: "stone-floor",
    name: "Stone floor",
    background: "#dedbd3",
    surface: "stone",
    stage: "floor",
    light: 1.1,
  },
  {
    id: "white-plinth",
    name: "White pedestal",
    background: "#eceff0",
    surface: "neutral",
    stage: "pedestal",
    light: 1.25,
  },
  {
    id: "stone-plinth",
    name: "Stone pedestal",
    background: "#c9c6bd",
    surface: "stone",
    stage: "pedestal",
    light: 1.1,
  },
  {
    id: "gallery-plinth",
    name: "Gallery pedestal",
    background: "#343e45",
    surface: "concrete",
    stage: "pedestal",
    light: 1.4,
  },
];
const libraryById = new Map(
  [...STUDIO_ELEMENTS, ...STUDIO_PATTERNS].map((a) => [a.id, a.svg]),
);
export const assetSVG = (id: string): string | undefined => libraryById.get(id);
