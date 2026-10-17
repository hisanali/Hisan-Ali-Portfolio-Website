import type { FoldPiece, StructureKind, StudioNet } from "./packaging-document";
function smooth(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
/** Unfold around the shared physical crease; release closures before walls. */
export function foldAngle(piece: FoldPiece, structure: StructureKind, progress: number) {
  if (!piece.hinge) return 0;
  let start = piece.hinge.stage || 0, end = piece.hinge.end ?? 1;
  if (structure === "custom") {
    // A straight-tuck carton must withdraw its tongue vertically before it
    // rotates clear. Reverse this path to feed the tongue inside on closing.
    if (piece.id === "upper-tuck") {
      const release = .09;
      const lid = 90 * (1 - smooth(Math.min(progress, release), 0, .24));
      const withdrawn = 180 - lid;
      return withdrawn * (1 - smooth(progress, release, .34));
    }
    // The closure wings are trapped between the double side walls. Lift the
    // complete lid assembly first, keeping those wings parallel to the walls;
    // rotating them while the lid is seated cuts through the carton sides.
    if (piece.id === "top") [start,end] = [0,.34];
    else if (piece.id === "tuck") [start,end] = [.34,.48];
    else if (piece.id.startsWith("tuck-wing") || piece.id.startsWith("wing-")) [start,end] = [.48,.60];
    else if (piece.id === "lock") [start,end] = [0,.06];
    else if (piece.id.startsWith("inner-lock")) [start,end] = [.55,.62];
    else if (piece.id.startsWith("inner-")) [start,end] = [.60,.72];
    else if (piece.id.startsWith("bridge-")) [start,end] = [.72,.80];
    else if (piece.id === "left" || piece.id === "right") [start,end] = [.80,.90];
    else if (piece.id === "front") [start,end] = [.85,.95];
    else if (piece.id === "back") [start,end] = [.90,1];
    else if (piece.id.startsWith("dust")) [start,end] = [.93,1];
  }
  if (structure === "mailer") {
    if (piece.id === "tuck") [start, end] = [0, .16];
    else if (piece.id === "top") [start, end] = [.1, .58];
    else if (piece.id.startsWith("wing")) [start, end] = [.32, .62];
    else if (piece.id.startsWith("dust")) [start, end] = [.48, .7];
    else [start, end] = [.68, 1];
  } else if (structure === "carton") {
    if (piece.id.endsWith("tuck")) [start, end] = [0, .15];
    else if (piece.id === "top" || piece.id === "bottom") [start, end] = [.12, .42];
    else if (!piece.face && piece.id !== "glue") [start, end] = [.3, .54];
    else [start, end] = [.55, 1];
  } else if (structure === "lid-base") [start, end] = [.28, .72];
  return piece.hinge.angle * (1 - smooth(progress, start, end));
}

/** Seat reviewed straight-tuck allowances inside the receiving wall, never alter the flat cutter. */
export function cartonTuckSeating(net: Pick<StudioNet, "pieces">, piece: FoldPiece, thickness: number, progress: number) {
  if(piece.id !== 'upper-tuck' || !piece.hinge) return 0;
  const cover=net.pieces.find(p=>p.id===piece.parent);
  const side=net.pieces.find(p=>p.id==='carton-right');
  if(!cover?.hinge || !side) return 0;
  const reach=Math.abs(piece.hinge.a[1]-cover.hinge.a[1]);
  const clearance=Math.max(0,reach-side.w+(1-(piece.inset??1))*thickness+.05);
  // Manufacturing allowances only. Unknown/disconnected maps need review.
  if(clearance>Math.max(3,thickness*3)) return 0;
  return Math.sign(cover.hinge.a[1]-piece.hinge.a[1])*clearance*(1-smooth(progress,.09,.34));
}
