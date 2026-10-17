/** Finished box dimensions, never inferred from the PDF sheet size. */
export type BoxDimensions = [number, number, number];
function candidates(text: string): BoxDimensions[] {
  const unit = '(mm|cm|in(?:ches)?|inch|″|")';
  const number = '(\\d+(?:[.,]\\d+)?)';
  const re = new RegExp(`${number}\\s*${unit}?\\s*[x×✕*]\\s*${number}\\s*${unit}?\\s*[x×✕*]\\s*${number}\\s*${unit}`, 'gi');
  const results: BoxDimensions[] = [];
  for (const m of text.matchAll(re)) {
    const values = [m[1],m[3],m[5]];
    const units = [m[2] || m[6],m[4] || m[6],m[6]];
    const dims = values.map((v,i) => Number(v.replace(',', '.')) * (/^cm$/i.test(units[i]) ? 10 : /^mm$/i.test(units[i]) ? 1 : 25.4)) as BoxDimensions;
    if (dims.every(v => Number.isFinite(v) && v >= 1 && v <= 10000) && !results.some(d => same(d,dims))) results.push(dims);
  }
  return results;
}
function same(a: BoxDimensions,b: BoxDimensions) { return a.every((v,i)=>Math.abs(v-b[i]) < .1); }
export function detectBoxDimensions(content: string, filename: string) {
  const inside = candidates(content), named = candidates(filename);
  const dimensions = inside[0] || named[0] || null;
  const source = inside.length ? 'PDF content' : named.length ? 'filename' : null;
  const conflict = inside.length > 1 || named.length > 1 || !!(inside[0] && named[0] && !same(inside[0],named[0]));
  const notes: string[] = [];
  if (dimensions) notes.push(`Finished box size detected from ${source}: ${dimensions.map(v=>Number(v.toFixed(3))).join(' × ')} mm (length × depth × height). Confirm the order against the drawing.`);
  if (conflict) notes.push(`Dimension mismatch: ${inside.map(d=>`PDF ${d.join(' × ')} mm`).concat(named.map(d=>`filename ${d.join(' × ')} mm`)).join('; ')}. Check the finished box dimensions before continuing.`);
  return {dimensions, source, conflict, notes};
}
