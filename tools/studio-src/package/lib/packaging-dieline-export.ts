import {generatedNet,netEdges,foldEdges,type StudioProject} from './packaging-document';
const pointsPerMm=72/25.4;
const number=(n:number)=>Number(n.toFixed(6)).toString();
/** Portable Level 2 EPS. The cutter stays vector; artwork is exported in the PDF/SVG options. */
export function dielineEPS(project:StudioProject):string {
 const net=generatedNet(project),width=net.width*pointsPerMm,height=net.height*pointsPerMm;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('The dieline has invalid dimensions.');
 const title=project.name.replace(/[^\x20-\x7e]/g,' ').replace(/[\r\n]/g,' ').slice(0,150);
 const sourcePaths=(kind:'cut'|'fold')=>net.sourcePaths?.filter(p=>p.kind===kind).map(p=>'newpath '+p.commands.map(c=>c[0]==='Z'?'closepath':c.slice(1).map(v=>number(v as number)).join(' ')+' '+({M:'moveto',L:'lineto',C:'curveto'}[c[0]])).join(' ')+' stroke').join('\n');
 const paths=(edges:number[][])=>edges.map(([x,y,X,Y])=>`newpath ${number(x)} ${number(y)} moveto ${number(X)} ${number(Y)} lineto stroke`).join('\n');
 return `%!PS-Adobe-3.0 EPSF-3.0
%%Title: ${title} - vector dieline
%%Creator: Studio Packaging Studio
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${number(width)} ${number(height)}
%%LanguageLevel: 2
%%Pages: 1
%%DocumentData: Clean7Bit
%%EndComments
%%Page: 1 1
gsave
0 ${number(height)} translate
${number(pointsPerMm)} ${number(-pointsPerMm)} scale
0.25 setlinewidth
1 setlinejoin
1 setlinecap
% CUT PATHS - magenta, solid. All coordinates are physical millimetres.
0 1 0 0 setcmykcolor
[] 0 setdash
${sourcePaths('cut')??paths(netEdges(net))}
% FOLD PATHS - cyan, dashed. Separate editable vector paths.
1 0 0 0 setcmykcolor
[2 1] 0 setdash
${sourcePaths('fold')??paths(foldEdges(net))}
grestore
showpage
%%Trailer
%%EOF
`;
}
