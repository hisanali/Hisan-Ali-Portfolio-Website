export const PACKAGE_FONTS = {
  "muller-regular": {
    name: "Liberation Sans · Regular",
    family: "PKMullerRegular",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf",
  },
  "muller-medium": {
    name: "Liberation Sans · Medium",
    family: "PKMullerMedium",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf",
  },
  "muller-bold": {
    name: "Liberation Sans · Bold",
    family: "PKMullerBold",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Bold.ttf",
  },
  "acta-book": {
    name: "Liberation Sans · Book",
    family: "PKActaBook",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf",
  },
  "acta-light": {
    name: "Liberation Sans · Light",
    family: "PKActaLight",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf",
  },
  "acta-medium": {
    name: "Liberation Sans · Medium",
    family: "PKActaMedium",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf",
  },
  "acta-bold": {
    name: "Liberation Sans · Bold",
    family: "PKActaBold",
    src: "/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Bold.ttf",
  },
} as const;
export type PackageFont = keyof typeof PACKAGE_FONTS;
export const BRAND_ASSETS: {name:string;src:string;group:string;w:number;h:number}[] = [];
export const PACKAGE_TEMPLATES = [
  ["colour", "Blue & white"],
  ["kraft", "Brown kraft"],
  ["minimal", "Clean white"],
  ["heritage", "Classic"],
  ["waves", "Signature waves"],
  ["blank", "Blank canvas"],
] as const;
