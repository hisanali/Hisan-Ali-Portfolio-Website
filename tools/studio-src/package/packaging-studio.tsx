import {studioFetch as fetch} from "../storage";
"use client";
import {createAssetUploader,finishUploads} from "./lib/packaging-upload";
import {panelPathData,cutterPathData} from "./lib/packaging-contours";
import {dielineEPS} from "./lib/packaging-dieline-export";
import {changePackageMaterial} from "./lib/packaging-material";
import {resizePackage} from "./lib/packaging-resize";
import {artworkRegions, separatePanelArtwork} from "./lib/packaging-artwork";
import {scaleImportedNet} from "./lib/studio-package-profiles";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Layers,
  Shapes,
  Palette,
  Type,
  Upload,
  LayoutTemplate,
  Grid2X2,
  Ruler,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Download,
  ChevronDown,
  ChevronLeft,
  X,
  Plus,
  Search,
  Image as ImageIcon,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  RotateCcw,
  Camera,
  Sun,
  SlidersHorizontal,
  ArrowUpToLine,
  ArrowDownToLine,
  FileInput,
  CheckCircle2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Replace,
} from "lucide-react";
import Sheet from "./sheet";
import {
  blankProject,
  migrateProject,
  syncPanels,
  generatedNet,
  STRUCTURES,
  DEFAULT_SCENE,
  cleanStudioProject,
  type StudioProject,
  type StudioRecord,
  type StudioObject,
  type StudioPanel,
  type StructureKind,
} from "./lib/packaging-document";
import { BRAND_ASSETS, PACKAGE_FONTS } from "./lib/packaging-assets";
import {
  STUDIO_ELEMENTS,
  STUDIO_PATTERNS,
  STUDIO_TEMPLATES,
  STUDIO_SCENES,
  type StudioAsset,
} from "./lib/packaging-library";
import CanvasEditor, {
  panelCanvas,
  type CanvasHandle,
  type CanvasSelection,
} from "./packaging/canvas";
import ScenePreview, { type SceneHandle } from "./packaging/scene";
import {
  analyseDieline,
  customNetFromPanels,
  foldMappingProblem,
  linePanels,
  type DielineAnalysis,
} from "./lib/packaging-import";
import {
  studioNetSVG,
  screenProof,
  portableProject,
  preflight,
} from "./lib/packaging-studio-export";
import { downloadPackage } from "./lib/packaging-export";
import "./packaging-studio.css";
const TOOLS = [
  { id: "structure", label: "Structure", Icon: Box },
  { id: "templates", label: "Templates", Icon: LayoutTemplate },
  { id: "elements", label: "Elements", Icon: Shapes },
  { id: "patterns", label: "Patterns", Icon: Grid2X2 },
  { id: "text", label: "Text", Icon: Type },
  { id: "colours", label: "Colours", Icon: Palette },
  { id: "uploads", label: "Uploads", Icon: Upload },
  { id: "layers", label: "Layers", Icon: Layers },
] as const;
function NumberField({
  label,
  value,
  min = -10000,
  max = 10000,
  step = 0.1,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  return (
    <label className="pk-field">
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (
            e.target.value.trim() &&
            Number.isFinite(+e.target.value) &&
            +e.target.value >= min &&
            +e.target.value <= max
          )
            onChange(+e.target.value);
        }}
        onBlur={() => setDraft(String(Math.round(value * 100) / 100))}
      />
    </label>
  );
}
function IconButton({
  label,
  children,
  onClick,
  disabled = false,
  active = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      className={`pk-icon ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
type UploadItem = { name: string; src: string; createdAt?: string; kind?: "element" | "texture" | "pattern"; mime?: string };
function DielineView({
  project,
  selected,
  onSelect,
}: {
  project: StudioProject;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [art, setArt] = useState<Record<string, string>>({});
  const net = generatedNet(project);
  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    Promise.all(
      Object.values(project.panels).map(async (panel) => {
        const render = await panelCanvas(panel, false, 2);
        const url = render.canvas.toDataURL();
        await render.dispose();
        return [panel.id, url] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setArt(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [project.panels]);
  return (
    <div className="pk-dieline-view">
      <svg
        viewBox={`0 0 ${net.width} ${net.height}`}
        role="img"
        aria-label="Dimensioned interactive packaging dieline"
      >
        {project.structure === "custom" && !project.imported?.profileId && project.imported?.preview && (
          <image href={project.imported.preview} width={net.width} height={net.height} preserveAspectRatio="none" />
        )}
        {net.pieces.map((q) => (
          <g
            key={q.id}
            transform={`translate(${q.x} ${q.y})`}
            role={q.face ? "button" : undefined}
            tabIndex={q.face ? 0 : undefined}
            aria-label={
              q.face
                ? `Design ${project.panels[q.face]?.name || q.face}`
                : undefined
            }
            onClick={() => q.face && onSelect(q.face)}
            onKeyDown={(e) => e.key === "Enter" && q.face && onSelect(q.face)}
          >
            <defs>
              <clipPath id={`net-${q.id}`}>
                <path d={panelPathData(q)} clipRule="evenodd" fillRule="evenodd" />
              </clipPath>
            </defs>
            <g clipPath={`url(#net-${q.id})`}>
              <rect
                width={q.w}
                height={q.h}
                fill={q.face ? project.panels[q.face]?.color : "#eee9df"}
              />
              {q.face && art[q.face] && (
                <image
                  href={art[q.face]}
                  width={q.w}
                  height={q.h}
                  preserveAspectRatio="none"
                />
              )}
            </g>
            <path
              d={panelPathData(q)}
              fill="none"
              stroke={selected === q.face ? "#27796b" : net.sourcePaths ? "none" : "#c9687a"}
              strokeWidth={selected === q.face ? 1.4 : 0.45}
            />
            {q.face && (
              <text
                x={q.w / 2}
                y={q.h / 2}
                textAnchor="middle"
                fontSize={Math.min(9, q.w / 10, q.h / 7)}
                fill="#263d39"
                className="pk-net-label"
              >
                {project.panels[q.face]?.name}
              </text>
            )}
          </g>
        ))}
        {net.sourcePaths?.map((path,i)=><path key={`source-${i}`} d={cutterPathData(path)} fill="none" stroke={path.kind==='cut'?'#c9687a':'#378f83'} strokeWidth=".45" strokeDasharray={path.kind==='fold'?'3 2':undefined} pointerEvents="none"/>)}
        {!net.sourcePaths && net.pieces
          .filter((q) => q.hinge)
          .map((q) => (
            <line
              key={q.id}
              x1={q.hinge!.a[0]}
              y1={q.hinge!.a[1]}
              x2={q.hinge!.b[0]}
              y2={q.hinge!.b[1]}
              stroke="#378f83"
              strokeWidth=".6"
              strokeDasharray="3 2"
            />
          ))}
      </svg>
      <div className="pk-net-meta">
        <span>
          <i className="cut" />
          Cut <i className="fold" />
          Fold
        </span>
        <span>
          {net.width.toFixed(1)} × {net.height.toFixed(1)} mm · click a printed
          panel to design
        </span>
      </div>
    </div>
  );
}
export default function PackagingStudio({
  canEdit,
  onClose,
}: {
  canEdit: boolean;
  onClose: () => void;
}) {
  const [project, setProject] = useState<StudioProject>(blankProject),
    [record, setRecord] = useState<StudioRecord | null>(null),
    [face, setFace] = useState("top"),
    [inside, setInside] = useState(false),
    [mode, setMode] = useState<"design" | "dieline" | "scene">("design"),
    [tool, setTool] = useState("structure"),
    [drawer, setDrawer] = useState(true),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [selected, setSelected] = useState<CanvasSelection | null>(null),
    [preview, setPreview] = useState<StudioObject[] | null>(null),
    [unfold, setUnfold] = useState(0),
    [foldAnimating, setFoldAnimating] = useState(false),
    [grid, setGrid] = useState(false),
    [snap, setSnap] = useState(true),
    [zoom, setZoom] = useState(1),
    [viewRotation,setViewRotation] = useState(0),
    [dirty, setDirty] = useState(false),
    [status, setStatus] = useState("Ready"),
    [busy, setBusy] = useState(false),
    [importProgress, setImportProgress] = useState<{label:string;done?:number;total?:number}|null>(null),
    [notice, setNotice] = useState(""),
    [importFailed,setImportFailed] = useState(false),
    [assetUploader] = useState(()=>createAssetUploader({onRetry:(name,attempt)=>setImportProgress({label:`Connection interrupted · retrying ${name} (${attempt} of 3)`})})),
    [history, setHistory] = useState<StudioProject[]>([]),
    [future, setFuture] = useState<StudioProject[]>([]),
    [uploads, setUploads] = useState<UploadItem[]>([]),
    [projects, setProjects] = useState<any[]>([]),
    [dialog, setDialog] = useState<
      "projects" | "export" | "import" | "template" | "print" | null
    >(null),
    [pendingTemplate, setPendingTemplate] = useState<
      (typeof STUDIO_TEMPLATES)[number] | null
    >(null),
    [analysis, setAnalysis] = useState<DielineAnalysis | null>(null),
    [importKind, setImportKind] = useState<StructureKind>("mailer"),
    [importScale, setImportScale] = useState(1),
    [importChecked, setImportChecked] = useState(false),
    [importDims, setImportDims] = useState<[number, number, number]>([
      285, 125, 74,
    ]),
    [mapping, setMapping] = useState<
      {
        id: string;
        name: string;
        parent: string;
        edge: "top" | "bottom" | "left" | "right";
        angle: number;
      }[]
    >([]),
    [nativeJob, setNativeJob] = useState<any>(null),
    [processing, setProcessing] = useState<{
      available: boolean;
      message?: string;
    }>({ available: false }),
    [recover, setRecover] = useState<{
      project: StudioProject;
      record: StudioRecord | null;
    } | null>(null),
    [split, setSplit] = useState(38),
    [replaceUpload, setReplaceUpload] = useState(false),
    [uploadKind, setUploadKind] = useState<"element" | "texture" | "pattern">("element");
  const canvas = useRef<CanvasHandle>(null),
    foldFrame = useRef<number|null>(null),
    foldPosition = useRef(unfold),
    foldTarget = useRef(0),
    scene = useRef<SceneHandle>(null),
    file = useRef<HTMLInputElement>(null),
    libraryFile = useRef<HTMLInputElement>(null),
    dielineFile = useRef<HTMLInputElement>(null),
    projectFile = useRef<HTMLInputElement>(null),
    backgroundFile = useRef<HTMLInputElement>(null),
    iccFile = useRef<HTMLInputElement>(null),
    current = useRef(project),
    recordRef = useRef(record),
    saveLock = useRef(false),
    draftKey = useRef(""),
    draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    importOriginal = useRef<File | null>(null),
    previewUrl = useRef("");
  current.current = project;
  recordRef.current = record;
  foldPosition.current = unfold;
  useEffect(()=>()=>{if(foldFrame.current!==null)cancelAnimationFrame(foldFrame.current);},[]);
  function stopFoldAnimation() {
    if(foldFrame.current!==null)cancelAnimationFrame(foldFrame.current);
    foldFrame.current=null;
    setFoldAnimating(false);
  }
  function toggleBoxOpening() {
    const target=foldFrame.current!==null ? (foldTarget.current===100?0:100) : (foldPosition.current>=50?0:100);
    stopFoldAnimation();foldTarget.current=target;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) {setUnfold(target);return;}
    const from=foldPosition.current,start=performance.now(),duration=Math.max(300,4000*Math.abs(target-from)/100);
    setFoldAnimating(true);
    const frame=(now:number)=>{
      const t=Math.min(1,(now-start)/duration),eased=t*t*(3-2*t);
      setUnfold(from+(target-from)*eased);
      if(t<1)foldFrame.current=requestAnimationFrame(frame);
      else {foldFrame.current=null;setFoldAnimating(false);}
    };
    foldFrame.current=requestAnimationFrame(frame);
  }
  const editable = canEdit && !busy,
    panel = project.panels[face] || Object.values(project.panels)[0],
    objects = inside ? panel?.insideObjects : panel?.objects,
    sceneProject =
      preview && panel
        ? {
            ...project,
            panels: {
              ...project.panels,
              [panel.id]: {
                ...panel,
                [inside ? "insideObjects" : "objects"]: preview,
              },
            },
          }
        : project;
  const remember = () => {
    setHistory((h) => [...h.slice(-59), current.current]);
    setFuture([]);
    setDirty(true);
  };
  const change = (next: StudioProject) => {
    if (!editable) return;
    remember();
    setProject(next);
    setStatus("Unsaved changes");
  };
  const patchPanel = (values: any) =>
    change({
      ...project,
      panels: { ...project.panels, [panel.id]: { ...panel,
        ...(values.color ? {objects:panel.objects.filter(o=>o.name!=="Imported background")} : {}),
        ...(values.insideColor ? {insideObjects:panel.insideObjects.filter(o=>o.name!=="Imported background")} : {}),
        ...values } },
    });
  const selectFace = (id: string, turnBox=false) => {
    if (!project.panels[id]) return;
    setFace(id);
    setSelected(null);
    setPreview(null);
    setMode("design");
    if(turnBox)scene.current?.focusFace(id);
  };
  const updateObjects = (next: StudioObject[]) => {
    if (!editable) return;
    remember();
    setProject((p) => ({
      ...p,
      panels: {
        ...p.panels,
        [panel.id]: {
          ...p.panels[panel.id],
          [inside ? "insideObjects" : "objects"]: next,
        },
      },
    }));
    setStatus("Unsaved changes");
  };
  async function editableImportedPanel(target:StudioPanel, sourceCanvas?:HTMLCanvasElement):Promise<StudioPanel> {
    if(target.objects.length !== 1 || target.objects[0].name === "Imported background" || !/image/i.test(target.objects[0].type))return target;
    const rasterScale=Math.min(5,2000/Math.max(target.width,target.height));
    const rendered=sourceCanvas ? null : await panelCanvas(target,false,rasterScale);
    let separated;
    try { separated=await separatePanelArtwork(sourceCanvas || rendered!.canvas,rasterScale); }
    finally { await rendered?.dispose(); }
    if(!separated)return target;
    if(!separated.pieces.length)return {...target,objects:target.objects.map(o=>({...o,name:"Imported background",locked:true}))};
    const [background,foreground]=await finishUploads([putAsset(separated.backdrop,"panel-background.png"),putAsset(separated.foreground,"panel-elements.png")]);
    const imageObject=(src:string,name:string,x:number,y:number,width:number,height:number,locked=false) => ({
      type:"Image",version:"7.4.0",id:crypto.randomUUID(),name,assetId:src,src,
      left:x/rasterScale,top:y/rasterScale,width,height,scaleX:1/rasterScale,scaleY:1/rasterScale,
      cropX:locked?0:x,cropY:locked?0:y,originX:"left",originY:"top",crossOrigin:"anonymous",locked,
    });
    const objects:StudioObject[]=[imageObject(background,"Imported background",0,0,Math.round(target.width*rasterScale),Math.round(target.height*rasterScale),true)];
    for(const [i,piece] of separated.pieces.entries()) objects.push(imageObject(foreground,`Artwork ${i+1}`,piece.x,piece.y,piece.width,piece.height));
    return {...target,objects};
  }
  async function editableImportedPanels(p:StudioProject, sheet?:HTMLImageElement) {
    const panels={...p.panels},pending=Object.values(panels);
    // Bound image decoding and uploads to three panels at once.
    for(let i=0;i<pending.length;i+=3) {
      setNotice(`Preparing editable artwork · ${i} of ${pending.length} panels`);
      setImportProgress({label:"Separating printed elements and saving panel artwork",done:i,total:pending.length});
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const ready=await finishUploads(pending.slice(i,i+3).map(target => {
        if (!sheet) return editableImportedPanel(target);
        const object=target.objects[0];
        const scale=Math.min(5,2000/Math.max(target.width,target.height));
        const source=document.createElement("canvas");source.width=Math.max(1,Math.round(target.width*scale));source.height=Math.max(1,Math.round(target.height*scale));
        const ctx=source.getContext("2d")!;ctx.fillStyle=target.color;ctx.fillRect(0,0,source.width,source.height);
        ctx.drawImage(sheet,Number(object.cropX||0),Number(object.cropY||0),Number(object.width),Number(object.height),0,0,Number(object.width)*Number(object.scaleX)*scale,Number(object.height)*Number(object.scaleY)*scale);
        return editableImportedPanel(target,source);
      }));
      for(const q of ready)panels[q.id]=q;
      setImportProgress({label:"Separating printed elements and saving panel artwork",done:Math.min(i+3,pending.length),total:pending.length});
    }
    return {...p,panels};
  }
  async function separateImportedArtwork() {
    if (!editable || busy || inside) return;
    const original=project;
    setBusy(true);
    try {
      const prepared=await editableImportedPanels(original);
      const next=cleanStudioProject(prepared);
      if(!next) throw new Error("The separated artwork exceeds project limits. Your original is unchanged.");
      if(current.current !== original) throw new Error("The project changed while artwork was being separated. Your latest edits are preserved; try again.");
      const count=Object.values(next.panels).reduce((n,q)=>n+q.objects.filter(o=>o.name?.startsWith("Artwork ")).length,0);
      if(!count)throw new Error("No separate marks were found against a solid background. The original artwork is preserved.");
      change(next);setSelected(null);setPreview(null);setMode("design");
      setNotice(`${count} movable artwork pieces across the package. Click the printed artwork to drag or resize it. Backgrounds stay locked. Printed lettering remains artwork; Undo restores the original.`);
    } catch(error) {setNotice(error instanceof Error?error.message:"Could not separate artwork. Your original is unchanged.");}
    finally {setBusy(false);}
  }
  async function selectMaterial(material:StudioProject['material']) {
    if (!editable || busy) return;
    const original=project;
    setBusy(true);
    try {
      const prepared=original.imported ? await editableImportedPanels(original) : original;
      if (current.current !== original) throw new Error("The project changed while preparing its paper. Please retry the material change.");
      const unresolved=Object.values(prepared.panels).some(p=>p.objects.some(o=>o.name==='Imported panel artwork'));
      if (unresolved) throw new Error("Some artwork has a photographic or mixed background that could not be separated. Remove that image background before changing the material; the original artwork is preserved.");
      change(changePackageMaterial(prepared,material));
      setNotice("Material updated. Imported paper backgrounds were replaced; printed elements are preserved.");
    } catch(error) { setNotice((error as Error).message); }
    finally { setBusy(false);setImportProgress(null); }
  }
  const undo = () => {
    if (!editable || !history.length) return;
    setFuture((f) => [project, ...f]);
    setProject(history.at(-1)!);
    setHistory((h) => h.slice(0, -1));
    setDirty(true);
    setPreview(null);
  };
  const redo = () => {
    if (!editable || !future.length) return;
    setHistory((h) => [...h, project]);
    setProject(future[0]);
    setFuture((f) => f.slice(1));
    setDirty(true);
  };
  const save = useCallback(
    async (copy = false) => {
      if (!canEdit || saveLock.current) return;
      saveLock.current = true;
      setStatus("Saving…");
      const snapshot = current.current,
        r = recordRef.current;
      try {
        if (!cleanStudioProject(snapshot))
          throw new Error(
            "Some artwork contains unsupported settings. Undo the last change and retry.",
          );
        const response = await fetch("/api/packaging", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: copy ? undefined : r?.id,
              revision: copy ? undefined : r?.revision,
              project: snapshot,
            }),
          }),
          data = (await response.json()) as StudioRecord & { error?: string };
        if (!response.ok) throw new Error(data.error || "Could not save.");
        setRecord(data);
        if (current.current === snapshot) setDirty(false);
        setStatus("Saved");
      } catch (e) {
        setStatus("Save needs attention");
        setNotice((e as Error).message);
      } finally {
        saveLock.current = false;
      }
    },
    [canEdit],
  );
  useEffect(() => {
    let alive = true;
    const refreshUploads = () => fetch("/api/packaging/elements")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => alive && setUploads((d as any).items || []))
      .catch(() => {});
    refreshUploads();
    window.addEventListener("focus", refreshUploads);
    const libraryChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("hisan-packaging-library") : null;
    if (libraryChannel) libraryChannel.onmessage = refreshUploads;
    fetch("/api/packaging/jobs")
      .then((r) => r.json())
      .then(
        (d) =>
          alive && setProcessing((d as any).processor || { available: false }),
      )
      .catch(() => {});
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: any) => {
        const actor = data.session?.username;
        if (!actor) return;
        draftKey.current = "hisan-packaging-v2:" + String(actor);
        try {
          const saved = JSON.parse(
            localStorage.getItem(draftKey.current) || "null",
          );
          const p = cleanStudioProject(saved?.project);
          if (p && alive)
            setRecover({ project: p, record: saved.record || null });
        } catch {}
      });
    return () => {
      alive = false;
      window.removeEventListener("focus", refreshUploads);
      libraryChannel?.close();
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        if (draftKey.current)
          localStorage.setItem(
            draftKey.current,
            JSON.stringify({ project, record }),
          );
      } catch {}
    }, 700);
    if (record && status !== "Save needs attention") {
      const id = setTimeout(() => void save(), 2500);
      return () => clearTimeout(id);
    }
  }, [project, record, dirty, status, save]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
        el.isContentEditable
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [history, future, project, save]);
  const close = () => {
    if (busy) return;
    if (
      dirty &&
      !window.confirm(
        "Your local draft is retained. Close Packaging Studio without saving to Projects?",
      )
    )
      return;
    onClose();
  };
  const putAsset = assetUploader;
  async function uploadArtwork(
    chosen?: File,
    target: "artwork" | "background" | "icc" | "element" | "texture" | "pattern" = "artwork",
  ) {
    if (!chosen || !editable) return;
    setBusy(true);
    setNotice("");
    try {
      let blob: Blob = chosen;
      if (chosen.size > 50 * 1024 * 1024)
        throw new Error("Choose a file under 50 MB.");
      if (target === "icc") {
        const src = await putAsset(chosen, chosen.name);
        remember();
        setProject((p) => ({
          ...p,
          print: { ...p.print, iccAsset: src, profileName: chosen.name },
        }));
        return;
      }
      if (chosen.type === "application/pdf") {
        const a = await analyseDieline(chosen);
        blob = a.preview;
      }
      if (chosen.name.toLowerCase().endsWith(".svg")) {
        const { sanitizeDielineSVG } = await import("./lib/packaging-import");
        blob = new Blob([sanitizeDielineSVG(await chosen.text())], {
          type: "image/svg+xml",
        });
      }
      const src = await putAsset(blob, chosen.name);
      if (target === "background") {
        remember();
        setProject((p) => ({
          ...p,
          scene: { ...p.scene, backgroundImage: src },
        }));
        return;
      }
      const metaResponse = await fetch("/api/packaging/elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chosen.name.replace(/\.[^.]+$/, "").slice(0, 100), src, kind: target === "texture" || target === "pattern" ? target : "element", mime: blob.type }),
      });
      const savedElement = await metaResponse.json() as UploadItem & { error?: string };
      if (!metaResponse.ok) throw new Error(savedElement.error || "Could not save the reusable element. Please try again.");
      const item = savedElement as UploadItem;
      setUploads((items) => [item, ...items.filter((i) => i.src !== src)]);
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("hisan-packaging-library");
        channel.postMessage("updated");
        channel.close();
      }
      setBusy(false);
      await new Promise(requestAnimationFrame);
      if (replaceUpload) {
        await canvas.current?.replace(src);
        setReplaceUpload(false);
      } else await addLibraryItem(item);
      setNotice(`“${item.name}” added to your design and saved for reuse.`);
      setQuery("");
      setCategory("All");
      setTool(target === "element" ? "elements" : target === "texture" || target === "pattern" ? "patterns" : "uploads");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addLibraryItem(item: UploadItem) {
    if (item.mime !== "image/svg+xml") return addImage(item.src, item.name);
    const response = await fetch(item.src);
    if (!response.ok) throw new Error("This element could not be loaded.");
    const { sanitizeDielineSVG } = await import("./lib/packaging-import");
    const svg = sanitizeDielineSVG(await response.text());
    const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
    const viewBox = root.getAttribute("viewBox")?.split(/[ ,]+/).map(Number);
    const width = viewBox?.[2] || Number.parseFloat(root.getAttribute("width") || "100");
    const height = viewBox?.[3] || Number.parseFloat(root.getAttribute("height") || "100");
    const w = Math.min(55, panel.width * 0.4, panel.height * 0.4 * width / height);
    const h = w * height / width;
    await canvas.current?.add({ svg, left: (panel.width-w)/2, top: (panel.height-h)/2,
      width: w, height: h, name: item.name, assetId: item.src });
  }
  const openLibraryUpload = (kind: "element" | "texture" | "pattern") => {
    setReplaceUpload(false);
    setUploadKind(kind);
    libraryFile.current?.click();
  };
  const reusableItems = (kinds: string[]) => uploads.filter(item =>
    kinds.includes(item.kind || "element") &&
    (!query || item.name.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => {
      const priority = ['Fragile glass', 'Keep dry', 'This side up', 'Handle with care'];
      const rank = (item: UploadItem) => priority.includes(item.name) ? priority.indexOf(item.name) : 100;
      return rank(a) - rank(b);
    });
  const libraryCards = (items: UploadItem[]) => (
    <div className="pk-card-grid uploads">
      {items.map(item => <button key={item.src} disabled={!editable}
        onClick={() => void addLibraryItem(item).catch(e => setNotice(e.message))}>
        <span><img src={item.src} alt={item.name} /></span>
        <strong>{item.name}</strong>
      </button>)}
    </div>
  );
  async function addImage(src: string, name = "Image") {
    if (!canEdit) return;
    const img = new window.Image();
    img.src = src;
    await img.decode();
    const w = Math.min(
        panel.width * 0.55,
        (panel.height * 0.55 * img.naturalWidth) / img.naturalHeight,
      ),
      h = (w * img.naturalHeight) / img.naturalWidth;
    await canvas.current?.add({
      type: "Image",
      version: "7.0.0",
      src,
      left: (panel.width - w) / 2,
      top: (panel.height - h) / 2,
      width: img.naturalWidth,
      height: img.naturalHeight,
      scaleX: w / img.naturalWidth,
      scaleY: h / img.naturalHeight,
      name,
      id: crypto.randomUUID(),
      crossOrigin: "anonymous",
      fit: "contain",
    });
  }
  async function addVector(asset: StudioAsset, pattern = false) {
    if (!editable) return;
    if (pattern) {
      const tile = asset.svg.replace(/<svg[^>]*>/, "").replace("</svg>", ""),
        size = Math.max(15, Math.min(panel.width, panel.height) / 3);
      let body = "";
      for (let x = 0; x < panel.width; x += size)
        for (let y = 0; y < panel.height; y += size)
          body += `<g transform="translate(${x} ${y}) scale(${size / asset.width} ${size / asset.height})">${tile}</g>`;
      await canvas.current?.add({
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${panel.width}" height="${panel.height}" viewBox="0 0 ${panel.width} ${panel.height}">${body}</svg>`,
        left: 0,
        top: 0,
        width: panel.width,
        height: panel.height,
        name: asset.name,
        assetId: asset.id,
      });
    } else {
      const w = Math.min(55, panel.width * 0.3),
        h = (w * asset.height) / asset.width;
      await canvas.current?.add({
        svg: asset.svg,
        left: (panel.width - w) / 2,
        top: (panel.height - h) / 2,
        width: w,
        height: h,
        name: asset.name,
        assetId: asset.id,
      });
    }
  }
  const addText = (text = "Your text", size = 8, font = "PKMullerRegular") =>
    canvas.current?.add({
      type: "Textbox",
      text,
      left: panel.width * 0.1,
      top: panel.height * 0.15,
      width: panel.width * 0.7,
      fontSize: size,
      fontFamily: font,
      lineHeight: 1.2,
      fill: "#223c36",
      name: "Text",
      splitByGrapheme: false,
    });
  const shape = (type: string) =>
    canvas.current?.add({
      type,
      left: panel.width * 0.2,
      top: panel.height * 0.2,
      width: 40,
      height: 25,
      radius: type === "Circle" ? 15 : undefined,
      fill: "#2e6d63",
      strokeWidth: 0,
      name: type,
    });
  async function openProjects() {
    setDialog("projects");
    setBusy(true);
    try {
      const r = await fetch("/api/packaging");
      if (!r.ok) throw new Error("Projects could not load.");
      setProjects(((await r.json()) as any).items || []);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadProject(id: string) {
    if (
      dirty &&
      !window.confirm(
        "Open this project? Your current local draft is retained.",
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/packaging?id=" + id),
        raw = (await r.json()) as any,
        p = migrateProject(raw.project);
      if (!r.ok || !p) throw new Error("This project could not be opened.");
      setProject(p);
      setRecord({ ...raw, project: p });
      setFace(p.panels.top ? "top" : Object.keys(p.panels)[0]);
      setSelected(null);
      setHistory([]);
      setFuture([]);
      setDirty(false);
      setDialog(null);
      setStatus(
        raw.project.version === 1
          ? "Legacy project opened · save to upgrade"
          : "Saved",
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const newProject = () => {
    if (
      dirty &&
      !window.confirm("Start a blank design? Your local draft is retained.")
    )
      return;
    setProject(blankProject());
    setRecord(null);
    setFace("top");
    setSelected(null);
    setDirty(false);
    setHistory([]);
    setFuture([]);
    setDialog(null);
    setStatus("New blank project");
  };
  function templateProject(
    t: (typeof STUDIO_TEMPLATES)[number],
    source = project,
  ) {
    let p = {
      ...source,
      panels: Object.fromEntries(
        Object.entries(source.panels).map(([id, panel]) => [
          id,
          {
            ...panel,
            color: t.background,
            objects: panel.objects.filter(
              (o) => o.name === "Product image" || o.name === "Product name",
            ),
            insideObjects: panel.insideObjects,
          },
        ]),
      ),
    };
    const top = p.panels.top || p.panels.front || Object.values(p.panels)[0];
    const w = top.width,
      h = top.height;
    const index = STUDIO_TEMPLATES.indexOf(t),
      variant = index % 6;
    const text = (
      value: string,
      left: number,
      topY: number,
      size: number,
      width: number,
      font = "PKMullerRegular",
    ) => ({
      type: "Textbox",
      id: crypto.randomUUID(),
      name: value === "YOUR PRODUCT" ? "Product name" : "Template text",
      text: value,
      left,
      top: topY,
      width,
      fontSize: size,
      fontFamily: font,
      fill: t.ink,
      lineHeight: 1.2,
      textAlign: variant === 1 ? "center" : "left",
    });
    const retained = top.objects;
    const objs: StudioObject[] = [];
    if (!retained.some((o) => o.name === "Product name"))
      objs.push(
        text(
          "YOUR PRODUCT",
          w * 0.1,
          h * (variant === 1 ? 0.4 : 0.55),
          Math.min(11, w / 20),
          w * 0.8,
        ),
      );
    objs.push(
      text(
        "THOUGHTFULLY MADE",
        w * 0.1,
        h * 0.76,
        Math.min(3, w / 65),
        w * 0.8,
      ),
    );
      objs.push(
        text(
          t.name.toUpperCase().split(" ").slice(0, 2).join(" "),
          w * 0.1,
          h * 0.1,
          Math.min(5, w / 35),
          w * 0.8,
          t.category === "Luxury" ? "PKActaBook" : "PKMullerMedium",
        ),
      );
    if (variant === 0 || variant === 3)
      objs.unshift({
        type: "Rect",
        id: crypto.randomUUID(),
        name: "Colour band",
        left: variant === 3 ? w * 0.7 : 0,
        top: 0,
        width: variant === 3 ? w * 0.3 : w * 0.035,
        height: h,
        fill: t.accent,
        strokeWidth: 0,
      });
    if (variant === 2 || variant === 5)
      objs.unshift({
        type: "Rect",
        id: crypto.randomUUID(),
        name: "Frame",
        left: w * 0.05,
        top: h * 0.08,
        width: w * 0.9,
        height: h * 0.84,
        fill: "transparent",
        stroke: t.accent,
        strokeWidth: variant === 5 ? 0.6 : 0.25,
      });
    if (variant === 4)
      objs.unshift({
        type: "Circle",
        id: crypto.randomUUID(),
        name: "Graphic disc",
        left: w * 0.65,
        top: -h * 0.2,
        radius: h * 0.55,
        fill: t.accent,
        opacity: 0.35,
      });
    top.objects = [...objs, ...retained];
    return p as StudioProject;
  }
  function applyTemplate() {
    if (!pendingTemplate) return;
    change(templateProject(pendingTemplate));
    setDialog(null);
    setMode("design");
    setFace(project.panels.top ? "top" : Object.keys(project.panels)[0]);
    setSelected(null);
  }
  async function importDieline(chosen?: File, page = 1) {
    if (!chosen || !editable) return;
    setBusy(true);
    setDialog("import");
    setNotice("");
    importOriginal.current = chosen;
    setImportFailed(false);
    setAnalysis(null);
    setImportProgress({label:"Reading dieline and preparing preview"});
    setImportChecked(false);
    try {
      const a = await analyseDieline(chosen, page);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = URL.createObjectURL(a.preview);
      setAnalysis(a);
      setImportKind("custom");
      setImportDims(
        a.dimensions || [project.width, project.depth, project.height],
      );
      setImportScale(a.studioProfile?.scale || 1);
      setImportChecked(!!a.studioProfile);
      setMapping(
        a.panels.map((q, i) => ({
          id: q.id,
          name: `Panel ${i + 1}`,
          parent: "",
          edge: "top",
          angle: 90,
        })),
      );
    } catch (e) {
      const extension = chosen.name.split(".").pop()?.toLowerCase();
      if (
        ["ai", "eps", "cdr", "psd"].includes(extension || "") &&
        processing.available
      ) {
        try {
          const source = await putAsset(chosen, chosen.name);
          const r = await fetch("/api/packaging/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                operation: "convert",
                source,
                filename: chosen.name,
              }),
            }),
            job = await r.json();
          if (!r.ok) throw new Error((job as any).error);
          setNativeJob(job);
        } catch (error) {
          setNotice((error as Error).message);
        }
      } else setNotice((e as Error).message);
    } finally {
      setBusy(false);
      setImportProgress(null);
    }
  }
  async function confirmImport(referenceOnly = false) {
    if (!analysis || !importOriginal.current || !importChecked) return;
    if (!referenceOnly && importKind === "custom" && !analysis.studioProfile) {
      const problem = foldMappingProblem(analysis.panels.map(q => ({id:q.id,parent:mapping.find(m => m.id === q.id)?.parent})));
      if (problem) { setNotice(problem); return; }
    }
    setBusy(true);
    setNotice("");setImportFailed(false);
    setImportProgress({label:"Saving original dieline and preview"});
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      const [source,preview] = await finishUploads([putAsset(
          importOriginal.current,
          importOriginal.current.name,
        ), putAsset(
          analysis.preview,
          "dieline-preview." +
            (analysis.preview.type.includes("svg") ? "svg" : "png"),
        )]);
      const importedAnalysis = referenceOnly ? {...analysis, panels: [{id:"reference",x:0,y:0,width:analysis.width,height:analysis.height}]} : analysis;
      let p: StudioProject = {
        ...blankProject(),
        name: analysis.name.replace(/\.[^.]+$/, ""),
        width: importDims[0],
        depth: importDims[1],
        height: importDims[2],
        structure: importKind,
        material: analysis.studioProfile?.material || "colour",
        imported: {
          name: analysis.name,
          source,
          preview,
          confirmed: true,
          referenceOnly,
          profileId: !referenceOnly ? analysis.studioProfile?.id : undefined,
          notes: analysis.notes,
          net: !referenceOnly && analysis.studioProfile ? scaleImportedNet(analysis.studioProfile.net, importScale) : customNetFromPanels(importedAnalysis, importScale, referenceOnly ? [] : mapping),
        },
      };
      if (importKind === "custom" && !importedAnalysis.panels.length)
        throw new Error(
          "Trace at least one panel before creating a custom dieline.",
        );
      p = syncPanels(p);
      if (importKind === "custom") {
        setImportProgress({label:"Preparing package panels and artwork"});
        const image = new Image();
        const artworkBlob = analysis.artworkPreview || analysis.preview;
        const artworkSource = analysis.artworkPreview ? await putAsset(artworkBlob,"dieline-artwork.png") : preview;
        const artworkUrl = URL.createObjectURL(artworkBlob);
        image.src = artworkUrl;
        try { await image.decode(); } finally { URL.revokeObjectURL(artworkUrl); }
        const px = image.naturalWidth / analysis.width;
        const py = image.naturalHeight / analysis.height;
        const sample=document.createElement("canvas"); sample.width=64; sample.height=64;
        const sampleContext=sample.getContext("2d")!;
        for (const q of importedAnalysis.panels) {
          const panel = p.panels[q.id];
          if (!panel) continue;
          panel.name = analysis.studioProfile ? ({bottom:"Base",top:"Lid",tuck:"Front closure"}[q.id] || q.id.replaceAll("-"," ")) : mapping.find(m => m.id === q.id)?.name || panel.name;
          sampleContext.clearRect(0,0,64,64);
          sampleContext.drawImage(image,q.x*px,q.y*py,q.width*px,q.height*py,0,0,64,64);
          const paper=artworkRegions(sampleContext.getImageData(0,0,64,64).data,64,64,1)?.background;
          panel.color=paper ? "#"+paper.map(c=>c.toString(16).padStart(2,"0")).join("") : p.material === "kraft" ? "#cba878" : "#faf9f6";
          panel.insideColor = p.material === "kraft" ? "#b78b56" : "#e6d4b7";
          panel.objects = [{
            type: "Image", version: "7.4.0", id: crypto.randomUUID(),
            name: "Imported panel artwork", assetId: artworkSource, src: artworkSource,
            originX: "left", originY: "top", left: 0, top: 0,
            width: q.width * px, height: q.height * py,
            cropX: q.x * px, cropY: q.y * py,
            scaleX: Math.min(importScale, panel.width/q.width, panel.height/q.height) / px,
            scaleY: Math.min(importScale, panel.width/q.width, panel.height/q.height) / py,
            crossOrigin: "anonymous", locked: false,
          }];
        }
        if(!referenceOnly) p=await editableImportedPanels(p,image);
      }
      const validated = cleanStudioProject(p);
      if (!validated)
        throw new Error(
          "Check panel connections: every parent must exist and folds cannot form a cycle.",
        );
      remember();
      setProject(validated);
      setStatus("Unsaved changes");
      stopFoldAnimation();setUnfold(0);
      setInside(false);
      setRecord(null);
      setFace(validated.panels.top ? "top" : Object.keys(validated.panels)[0]);
      setMode("design");
      setSelected(null);
      setDialog(null);
      setNotice(
        (referenceOnly || importKind === "custom" && !analysis.studioProfile &&
          mapping.filter((m) => m.parent).length < analysis.panels.length - 1)
          ? "Imported as a 2D dieline. Connect every panel in Structure before using a custom mockup."
          : "Dieline confirmed. Printed elements on solid backgrounds are now separate movable layers. Click a panel, then drag the artwork. Printed text remains artwork; the original PDF is retained.",
      );
    } catch (e) {
      setImportFailed(true);
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
      setImportProgress(null);
    }
  }
  async function exportAs(kind: string) {
    setBusy(true);
    setNotice("");
    try {
      const filename =
        project.name.replace(/[^\w -]/g, "").trim() || "Packaging";
      if (kind === "svg")
        downloadPackage(
          new Blob([await studioNetSVG(project, inside, true)], {
            type: "image/svg+xml",
          }),
          filename + ".svg",
        );
      if (kind === "pdf")
        downloadPackage(
          await screenProof(project, inside),
          filename + "-dieline.pdf",
        );
      if (kind === "eps")
        downloadPackage(new Blob([dielineEPS(project)], {type:"application/postscript"}),filename+"-dieline.eps");
      if (kind === "project")
        downloadPackage(
          await portableProject(project),
          filename + ".package.zip",
        );
      if (kind === "panel") {
        const render = await panelCanvas(
          panel,
          inside,
          Math.min(12, project.print.dpi / 25.4),
        );
        const svg = await import("./lib/packaging-studio-export").then((m) =>
          m.embedSVG(render.svg(), true),
        );
        await render.dispose();
        downloadPackage(
          new Blob([svg], { type: "image/svg+xml" }),
          filename + "-" + panel.name + ".svg",
        );
      }
      if (kind === "png" || kind === "jpg" || kind === "transparent") {
        const blob = await scene.current!.exportImage(
          kind === "transparent",
          kind === "jpg" ? "jpeg" : "png",
        );
        downloadPackage(
          blob,
          filename + "-mockup." + (kind === "jpg" ? "jpg" : "png"),
        );
      }
      if (kind === "production") {
        const check = preflight(project);
        if (check.errors.length) throw new Error(check.errors.join(" "));
        if (!processing.available)
          throw new Error(
            "The Studio prepress service is not connected. Screen proofs remain available; production PDF/X export is blocked.",
          );
        const svg = await studioNetSVG(project, inside, true, false),
          source = await putAsset(
            new Blob([svg], { type: "image/svg+xml" }),
            "production-artwork.svg",
          );
        const r = await fetch("/api/packaging/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "prepress",
              source,
              project,
              filename: filename + ".svg",
            }),
          }),
          job = await r.json();
        if (!r.ok) throw new Error((job as any).error);
        setNativeJob(job);
        return;
      }
      setDialog(null);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!nativeJob || !["queued", "processing"].includes(nativeJob.status))
      return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/packaging/jobs?id=" + nativeJob.id),
          job = (await response.json()) as any;
        if (!active) return;
        setNativeJob(job);
        if (job.status === "completed") {
          if (job.operation === "convert" && job.result) {
            const assetResponse = await fetch(job.result),
              blob = await assetResponse.blob();
            await importDieline(
              new File([blob], (job.filename||"converted-dieline").replace(/\.[^.]+$/, blob.type === "image/png" ? ".png" : ".svg"), {
                type: blob.type,
              }),
            );
          } else if (job.result)
            downloadPackage(
              await (await fetch(job.result)).blob(),
              project.name + "-production.pdf",
            );
        }
        if (job.status === "failed")
          setNotice(job.error || "Processing failed.");
      } catch {
        setNotice(
          "Processing connection interrupted. Retry from the job controls.",
        );
      }
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [nativeJob?.id, nativeJob?.status]);
  async function importProjectFile(chosen?: File) {
    if (!chosen || !editable) return;
    setBusy(true);
    try {
      let raw: any;
      if (chosen.name.endsWith(".zip")) {
        const { unzipSync, strFromU8 } = await import("fflate"),
          files = unzipSync(new Uint8Array(await chosen.arrayBuffer()));
        raw = JSON.parse(strFromU8(files["project.json"]));
        const assets = JSON.parse(
            strFromU8(files["assets.json"] || new Uint8Array([123, 125])),
          ),
          remap: Record<string, string> = {};
        for (const [src, path] of Object.entries(assets)) {
          const bytes = files[path as string];
          if (!bytes) throw new Error("A portable project asset is missing.");
          remap[src] = await putAsset(
            new Blob([bytes], {
              type: String(path).endsWith(".svg")
                ? "image/svg+xml"
                : String(path).endsWith(".jpg")
                  ? "image/jpeg"
                  : "image/png",
            }),
            String(path),
          );
        }
        let serialized = JSON.stringify(raw);
        for (const [from, to] of Object.entries(remap))
          serialized = serialized.split(from).join(to);
        raw = JSON.parse(serialized);
      } else raw = JSON.parse(await chosen.text());
      const p = migrateProject(raw.project || raw);
      if (!p)
        throw new Error(
          "This project is not supported. Your current design is unchanged.",
        );
      remember();
      setProject(p);
      setRecord(null);
      setFace(p.panels.top ? "top" : Object.keys(p.panels)[0]);
      setDialog(null);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reviewImportedDieline() {
    if (!project.imported || !editable) return;
    setBusy(true);
    try {
      const response = await fetch(project.imported.source);
      if (!response.ok) throw new Error("The original dieline could not load. Upload the original file again.");
      await importDieline(new File([await response.blob()], project.imported.name));
      setNotice("Review the original scale and folds. Applying this import replaces the current artwork layout; Undo restores it.");
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }
  const importMappingProblem = analysis && importKind === "custom" && !analysis.studioProfile
    ? foldMappingProblem(analysis.panels.map(q => ({id:q.id,parent:mapping.find(m => m.id === q.id)?.parent}))) : null;
  const filtered = (items: any[]) =>
    items.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!query ||
          `${a.name} ${a.category || ""}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    );
  const categories =
    tool === "templates"
      ? [...new Set(STUDIO_TEMPLATES.map((a) => a.category))]
      : tool === "patterns"
        ? [...new Set(STUDIO_PATTERNS.map((a) => a.category))]
        : tool === "elements"
          ? [...new Set(STUDIO_ELEMENTS.map((a) => a.category))]
          : [];
  const printCheck = preflight(project),
    customConnected =
      project.structure !== "custom" ||
      (!!project.imported && !project.imported.referenceOnly &&
        !foldMappingProblem(project.imported.net.pieces) &&
        project.imported.net.pieces.every(q => !q.parent || !!q.hinge));
  return (
    <Sheet
      label="Packaging Studio"
      className="pk-workspace"
      busy={busy}
      onClose={close}
    >
      <header className="pk-header">
        <div className="pk-brand">
          <Box />
          <div>
            <strong>Packaging Studio</strong>
            <span>HISAN ALI · BROWSER TOOLS</span>
          </div>
        </div>
        <input
          className="pk-project-name"
          aria-label="Project name"
          value={project.name}
          disabled={!editable}
          onChange={(e) => change({ ...project, name: e.target.value })}
        />
        <div className="pk-save-status">
          <span className={dirty ? "dirty" : "saved"} />
          {busy ? "Working…" : status}
        </div>
        <div className="pk-header-actions">
          <button onClick={openProjects}>
            <FolderOpen />
            Projects
          </button>
          <button
            className="pk-save"
            onClick={() => void save()}
            disabled={!editable}
          >
            <Save />
            Save
          </button>
          <button
            className="pk-primary"
            onClick={() => setDialog("export")}
            disabled={busy}
          >
            <Download />
            Export
          </button>
        </div>
      </header>
      {notice && (
        <div className="pk-notice" role="status">
          <AlertCircle />
          <span>{notice}</span>
          <IconButton label="Dismiss message" onClick={() => setNotice("")}>
            <X />
          </IconButton>
        </div>
      )}
      {recover && (
        <div className="pk-recover">
          <span>A recoverable draft is available.</span>
          <button
            onClick={() => {
              setProject(recover.project);
              setRecord(recover.record);
              setFace(
                recover.project.panels.top
                  ? "top"
                  : Object.keys(recover.project.panels)[0],
              );
              setDirty(true);
              setRecover(null);
            }}
          >
            Restore draft
          </button>
          <button onClick={() => setRecover(null)}>Keep this design</button>
        </div>
      )}
      <div className="pk-body">
        <nav className="pk-tool-rail" aria-label="Packaging design tools">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={tool === id && drawer ? "active" : ""}
              aria-label={label}
              aria-pressed={tool === id && drawer}
              onClick={() => {
                setTool(id);
                setDrawer(true);
                setCategory("All");
                setQuery("");
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
          <div className="pk-rail-bottom">
            <IconButton
              label="Printer settings"
              onClick={() => setDialog("print")}
            >
              <Settings2 />
            </IconButton>
          </div>
        </nav>
        {drawer && (
          <aside className="pk-library">
            <header>
              <div>
                <small>DESIGN TOOLS</small>
                <h3>{TOOLS.find((t) => t.id === tool)?.label}</h3>
              </div>
              <IconButton
                label="Collapse library"
                onClick={() => setDrawer(false)}
              >
                <PanelLeftClose />
              </IconButton>
            </header>
            {["templates", "elements", "patterns", "uploads"].includes(
              tool,
            ) && (
              <>
                <label className="pk-search">
                  <Search />
                  <input
                    aria-label="Search design library"
                    placeholder={`Search ${tool}…`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                {categories.length > 1 && (
                  <div className="pk-category-tabs">
                    {["All", ...categories].map((c) => (
                      <button
                        key={c}
                        className={category === c ? "active" : ""}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="pk-library-content">
              {tool === "structure" && (
                <>
                  <p className="pk-description">
                    Choose your package. Dimensions update the artwork surface
                    and 3D together.
                  </p>
                  <div className="pk-structure-grid">
                    {STRUCTURES.map((s) => (
                      <button
                        key={s.id}
                        disabled={!editable}
                        className={project.structure === s.id ? "active" : ""}
                        onClick={() => {
                          change(syncPanels({ ...project, structure: s.id }));
                          setFace(s.id === "carton" ? "front" : "top");
                          setSelected(null);
                        }}
                      >
                        <Box />
                        <strong>{s.name}</strong>
                        <span>{s.description}</span>
                      </button>
                    ))}
                  </div>
                  <h4>
                    Box dimensions <span>mm</span>
                  </h4>
                  <div className="pk-fields three">
                    {(["width", "depth", "height"] as const).map((key, i) => (
                      <NumberField
                        key={key}
                        label={["Length", "Depth", "Height"][i]}
                        value={project[key]}
                        min={30}
                        max={800}
                        disabled={!editable}
                        onChange={(n) =>
                          (() => { try { change(resizePackage(project, key, n)); } catch(error) { setNotice(error instanceof Error ? error.message : "Could not resize this package."); } })()
                        }
                      />
                    ))}
                  </div>
                  {project.structure === "custom" && <p className="pk-fine">Dimensions resize the mapped panels and folds together. Artwork keeps its proportions and is fitted inside smaller panels when needed. Review its placement after resizing.</p>}
                  <NumberField
                    label="Board thickness (mm)"
                    value={project.thickness}
                    min={0.1}
                    max={8}
                    disabled={!editable}
                    onChange={(n) => change({ ...project, thickness: n })}
                  />
                  <h4>Material</h4>
                  <div className="pk-materials">
                    {(["colour", "kraft"] as const).map((m) => (
                      <button
                        key={m}
                        className={project.material === m ? "active" : ""}
                        disabled={!editable}
                        onClick={() => void selectMaterial(m)}
                      >
                        <i
                          style={{
                            background: m === "kraft" ? "#cba878" : "#faf9f6",
                          }}
                        />
                        {m === "kraft" ? "Brown kraft" : "Coated white"}
                      </button>
                    ))}
                  </div>
                  <h4>Surface finish</h4>
                  <div className="pk-materials" role="group" aria-label="Surface finish">
                    {(["matte", "glossy"] as const).map(finish => <button key={finish}
                      disabled={!editable} aria-pressed={(project.finish || "matte") === finish}
                      className={(project.finish || "matte") === finish ? "active" : ""}
                      onClick={() => change({ ...project, finish })}>
                      {finish === "matte" ? "Matte" : "Glossy"}
                    </button>)}
                  </div>
                  <button
                    className="pk-wide"
                    onClick={() => dielineFile.current?.click()}
                    disabled={!editable}
                  >
                    <FileInput />
                    Import a dieline
                  </button>
                  <p className="pk-fine">
                    PDF, SVG, DXF and images. Confirm
                    scale and folds before creating a mockup.
                  </p>
                  {project.imported && (
                    <div className="pk-import-summary">
                      <strong>{project.imported.name}</strong>
                      <span>Original dieline retained</span>
                      {!customConnected && (
                        <p>
                          This import has no complete fold map. Review its original dieline to connect the panels and enable 3D.
                        </p>
                      )}
                      <button disabled={busy || !editable} onClick={() => void reviewImportedDieline()}>Review imported dieline & folds</button>
                    </div>
                  )}
                </>
              )}
              {tool === "templates" && (
                <>
                  <p className="pk-description">
                    Editable layouts for Studio and beyond. Start clean, then
                    make it yours.
                  </p>
                  <div className="pk-card-grid templates">
                    {filtered(STUDIO_TEMPLATES).map((t) => (
                      <button
                        key={t.id}
                        disabled={!editable}
                        onClick={() => {
                          setPendingTemplate(t);
                          setDialog("template");
                        }}
                      >
                        <span
                          className="pk-template-thumb"
                          style={{ background: t.background, color: t.ink }}
                        >
                          <i style={{ background: t.accent }} />
                          <small>{t.category}</small>
                          <b>{t.name}</b>
                          <em>YOUR BRAND</em>
                        </span>
                        <strong>{t.name}</strong>
                        <small>{t.category}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {(tool === "elements" || tool === "patterns") && (
                <>
                  <button className="pk-upload-area compact" disabled={!editable}
                    onClick={() => openLibraryUpload(tool === "elements" ? "element" : "pattern")}>
                    <Upload /><strong>{tool === "elements" ? "Upload element" : "Upload pattern"}</strong>
                    <span>{tool === "elements" ? "Save your logo, symbol or graphic for reuse" : "Add a pattern to your reusable library"}</span>
                    <small>SVG · PNG · JPG · WebP · PDF</small>
                  </button>
                  {tool === "patterns" && <button className="pk-library-upload-secondary" disabled={!editable}
                    onClick={() => openLibraryUpload("texture")}><Upload />Upload texture</button>}
                  {reusableItems(tool === "elements" ? ["element"] : ["pattern", "texture"]).length > 0 && <>
                    <h4>{tool === "elements" ? "Your elements" : "Your patterns & textures"}</h4>
                    {libraryCards(reusableItems(tool === "elements" ? ["element"] : ["pattern", "texture"]))}
                  </>}
                  {tool === "elements" && (
                    <>
                      <h4>Your brand assets</h4>
                      <div className="pk-card-grid brands">
                        {BRAND_ASSETS.filter(
                          (a) =>
                            !query ||
                            a.name.toLowerCase().includes(query.toLowerCase()),
                        ).map((a) => (
                          <button
                            key={a.src}
                            disabled={!editable}
                            onClick={() => void addImage(a.src, a.name)}
                          >
                            <span
                              className={a.src.includes("white") ? "dark" : ""}
                            >
                              <img src={a.src} alt={a.name} />
                            </span>
                            <strong>{a.name}</strong>
                          </button>
                        ))}
                      </div>
                      <div className="pk-quick-shapes">
                        <button
                          disabled={!editable}
                          onClick={() => shape("Rect")}
                        >
                          Rectangle
                        </button>
                        <button
                          disabled={!editable}
                          onClick={() => shape("Circle")}
                        >
                          Circle
                        </button>
                        <button
                          disabled={!editable}
                          onClick={() =>
                            canvas.current?.add({
                              type: "Line",
                              x1: 0,
                              y1: 0,
                              x2: 50,
                              y2: 0,
                              left: 20,
                              top: 20,
                              stroke: "#284f45",
                              strokeWidth: 1,
                              name: "Line",
                            })
                          }
                        >
                          Line
                        </button>
                      </div>
                      <h4>Packaging vectors &amp; print rules</h4>
                    </>
                  )}
                  <div className="pk-card-grid vectors">
                    {filtered(
                      tool === "elements" ? STUDIO_ELEMENTS : STUDIO_PATTERNS,
                    ).map((a) => (
                      <button
                        key={a.id}
                        disabled={!editable}
                        onClick={() => void addVector(a, tool === "patterns")}
                      >
                        <span dangerouslySetInnerHTML={{ __html: a.svg }} />
                        <strong>{a.name}</strong>
                        <small>{a.category}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {tool === "text" && (
                <>
                  <p className="pk-description">
                    Add text, then double-click it on the canvas to edit and
                    select individual characters.
                  </p>
                  <button
                    className="pk-text-preset heading"
                    disabled={!editable}
                    onClick={() =>
                      void addText("Add a heading", 12, "PKMullerBold")
                    }
                  >
                    Add a heading
                  </button>
                  <button
                    className="pk-text-preset subheading"
                    disabled={!editable}
                    onClick={() =>
                      void addText("Add a subheading", 7, "PKMullerMedium")
                    }
                  >
                    Add a subheading
                  </button>
                  <button
                    className="pk-text-preset"
                    disabled={!editable}
                    onClick={() => void addText("Add body text", 4)}
                  >
                    Add body text
                  </button>
                  <h4>Studio typography</h4>
                  {Object.entries(PACKAGE_FONTS).map(([key, f]) => (
                    <button
                      key={key}
                      className="pk-font-card"
                      style={{ fontFamily: f.family }}
                      disabled={!editable}
                      onClick={() =>
                        void addText("Thoughtfully designed.", 7, f.family)
                      }
                    >
                      <span>{f.name}</span>
                      <b>Thoughtfully designed.</b>
                    </button>
                  ))}
                </>
              )}
              {tool === "colours" && (
                <>
                  <p className="pk-description">
                    These colours print on the selected panel. Scene colours are
                    separate.
                  </p>
                  <label className="pk-colour-field">
                    {inside ? "Inside" : "Outside"} panel colour
                    <input
                      type="color"
                      aria-label="Printed panel colour"
                      value={inside ? panel.insideColor : panel.color}
                      disabled={!editable}
                      onChange={(e) =>
                        patchPanel({
                          [inside ? "insideColor" : "color"]: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="pk-swatches">
                    {[
                      "#faf9f6",
                      "#ffffff",
                      "#cba878",
                      "#24516b",
                      "#1f4039",
                      "#222222",
                      "#bd9d62",
                      "#e6e1d5",
                      "#c9d4cd",
                      "#a9bfd0",
                      "#d5b4a6",
                      "#7f6356",
                      "#536a60",
                      "#b88070",
                      "#c0b5d2",
                      "#ecdfc7",
                    ].map((c) => (
                      <button
                        key={c}
                        aria-label={`Panel colour ${c}`}
                        style={{ background: c }}
                        disabled={!editable}
                        onClick={() =>
                          patchPanel({ [inside ? "insideColor" : "color"]: c })
                        }
                      />
                    ))}
                  </div>
                  <button
                    className="pk-wide"
                    disabled={!editable}
                    onClick={() =>
                      change({
                        ...project,
                        panels: Object.fromEntries(
                          Object.entries(project.panels).map(([id, p]) => [
                            id,
                            {
                              ...p,
                              [inside ? "insideColor" : "color"]: inside
                                ? panel.insideColor
                                : panel.color,
                              [inside ? "insideObjects" : "objects"]: (inside ? p.insideObjects : p.objects).filter(o=>o.name!=="Imported background"),
                            },
                          ]),
                        ),
                      })
                    }
                  >
                    Apply this colour to all panels
                  </button>
                  {selected && (
                    <div>
                    <label className="pk-colour-field">
                      Selected artwork colour
                      <input
                        type="color"
                        aria-label="Selected artwork colour"
                        value={
                          selected.fill?.startsWith("#")
                            ? selected.fill
                            : "#24516b"
                        }
                        disabled={!editable}
                        onChange={(e) =>
                          canvas.current?.patch({ fill: e.target.value })
                        }
                      />
                    </label>
                    {selected.type.toLowerCase()==="image" && <button disabled={!editable} onClick={()=>canvas.current?.patch({tintColor:null})}>Restore original image colours</button>}
                    </div>
                  )}
                </>
              )}
              {tool === "uploads" && (
                <>
                  <button
                    className="pk-upload-area"
                    disabled={!editable}
                    onClick={() => {
                      setReplaceUpload(false);
                      file.current?.click();
                    }}
                  >
                    <Upload />
                    <strong>Upload artwork</strong>
                    <span>Logo, illustration, product photo or PDF</span>
                    <small>PNG · JPG · WebP · SVG · PDF</small>
                  </button>
                  <div className="pk-card-grid uploads">
                    {filtered(uploads).map((u) => (
                      <button
                        key={u.src}
                        disabled={!editable}
                        onClick={() => void addLibraryItem(u).catch(e => setNotice(e.message))}
                      >
                        <span>
                          <img src={u.src} alt={u.name} />
                        </span>
                        <strong>{u.name}</strong>
                      </button>
                    ))}
                  </div>
                  {!uploads.length && (
                    <p className="pk-empty">
                      Your uploaded elements will appear here for reuse across
                      projects.
                    </p>
                  )}
                </>
              )}
              {tool === "layers" && (
                <>
                  <p className="pk-description">
                    Select, organize and protect the artwork on this panel.
                  </p>
                  {[...(objects || [])].reverse().map((o) => (
                    <div
                      className={`pk-layer-row ${selected?.ids.includes(o.id) ? "active" : ""}`}
                      key={o.id}
                    >
                      <button
                        className="pk-layer-name"
                        onClick={() => canvas.current?.select(o.id)}
                      >
                        <span>
                          {o.type?.toLowerCase().includes("text") ? (
                            <Type />
                          ) : (
                            <Shapes />
                          )}
                        </span>
                        <strong>
                          {o.name || o.text?.slice(0, 30) || o.type}
                        </strong>
                      </button>
                      <IconButton
                        label={`${o.visible === false ? "Show" : "Hide"} ${o.name || "layer"}`}
                        disabled={!editable}
                        onClick={() => {
                          canvas.current?.select(o.id);
                          canvas.current?.command("hide");
                        }}
                      >
                        {o.visible === false ? <EyeOff /> : <Eye />}
                      </IconButton>
                      <IconButton
                        label={`${o.locked ? "Unlock" : "Lock"} ${o.name || "layer"}`}
                        disabled={!editable}
                        onClick={() => {
                          canvas.current?.select(o.id);
                          canvas.current?.command("lock");
                        }}
                      >
                        {o.locked ? <Lock /> : <Unlock />}
                      </IconButton>
                    </div>
                  ))}
                  {!objects?.length && (
                    <p className="pk-empty">
                      This panel is blank. Add text, elements or upload your
                      artwork.
                    </p>
                  )}
                  <div className="pk-layer-tools">
                    <button
                      onClick={() => canvas.current?.command("selectAll")}
                    >
                      Select all
                    </button>
                    <button
                      disabled={!editable || !selected}
                      onClick={() => canvas.current?.command("group")}
                    >
                      <Group />
                      Group
                    </button>
                    <button
                      disabled={!editable || !selected}
                      onClick={() => canvas.current?.command("ungroup")}
                    >
                      <Ungroup />
                      Ungroup
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
        <main
          className="pk-main"
          style={{ "--scene-width": split + "%" } as any}
        >
          <div className="pk-workbar">
            <div className="pk-workbar-left">
              {!drawer && (
                <IconButton
                  label="Open library"
                  onClick={() => setDrawer(true)}
                >
                  <PanelLeftOpen />
                </IconButton>
              )}
              <div className="pk-mode-tabs">
                {(["design", "dieline", "scene"] as const).map((m) => (
                  <button
                    key={m}
                    className={mode === m ? "active" : ""}
                    onClick={() => {setMode(m); if(m === "scene") setDrawer(false);}}
                  >
                    {m === "design"
                      ? "Design"
                      : m === "dieline"
                        ? "Dieline"
                        : "Scene"}
                  </button>
                ))}
              </div>
            </div>
            <div className="pk-workbar-actions">
              <IconButton
                label="Undo"
                onClick={undo}
                disabled={!editable || !history.length}
              >
                <Undo2 />
              </IconButton>
              <IconButton
                label="Redo"
                onClick={redo}
                disabled={!editable || !future.length}
              >
                <Redo2 />
              </IconButton>
              {mode === "design" && (
                <>
                  <IconButton
                    label="Toggle grid"
                    active={grid}
                    onClick={() => setGrid(!grid)}
                  >
                    <Grid2X2 />
                  </IconButton>
                  <IconButton
                    label="Toggle snapping"
                    active={snap}
                    onClick={() => setSnap(!snap)}
                  >
                    <Ruler />
                  </IconButton>
                  <select aria-label="Design view rotation" title="Rotate the editing view; printed artwork stays unchanged" value={viewRotation} onChange={e=>setViewRotation(Number(e.target.value))}>
                    {[0,90,180,270].map(angle=><option key={angle} value={angle}>View {angle}°</option>)}
                  </select>
                  <select
                    aria-label="Canvas zoom"
                    value={zoom}
                    onChange={(e) => {
                      setZoom(+e.target.value);
                      canvas.current?.zoom(+e.target.value);
                    }}
                  >
                    <option value={0.5}>50%</option>
                    <option value={1}>Fit</option>
                    <option value={1.5}>150%</option>
                    <option value={2}>200%</option>
                    <option value={3}>300%</option>
                  </select>
                </>
              )}
            </div>
          </div>
          <div className="pk-facebar">
            <div className="pk-face-list">
              {Object.values(project.panels).map((p) => (
                <button
                  key={p.id}
                  className={panel.id === p.id ? "active" : ""}
                  onClick={() => {
                    setFace(p.id);
                    setSelected(null);
                    setPreview(null);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="pk-side-switch">
              <button
                className={!inside ? "active" : ""}
                onClick={() => {
                  setInside(false);
                  setSelected(null);
                }}
              >
                Outside
              </button>
              <button
                className={inside ? "active" : ""}
                onClick={() => {
                  setInside(true);
                  setSelected(null);
                }}
              >
                Inside
              </button>
            </div>
          </div>
          {mode !== "scene" && project.imported && !inside && Object.values(project.panels).some(p=>p.objects.length === 1 && p.objects[0].name !== "Imported background" && /image/i.test(p.objects[0].type)) && (
            <div className="pk-import-edit-help">
              <span>{mode === "dieline" ? "Click a panel to edit its artwork." : "Some imported panels are still combined images."}</span>
              <button disabled={!editable || busy} onClick={() => void separateImportedArtwork()}><Ungroup />{busy ? "Separating artwork…" : "Separate all imported artwork"}</button>
            </div>
          )}
          <div className={`pk-stage ${mode === "scene" ? "scene-only" : ""}`}>
            {mode !== "scene" && (
              <section className="pk-artboard">
                {mode === "design" ? (
                  <CanvasEditor
                    ref={canvas}
                    key={panel.id + "-" + inside}
                    panel={panel}
                    inside={inside}
                    editable={editable}
                    grid={grid}
                    snap={snap}
                    safe={project.print.safe}
                    viewRotation={viewRotation}
                    selected={selected?.ids || []}
                    onChange={updateObjects}
                    onPreview={setPreview}
                    onSelect={setSelected}
                    onGuide={(axis, position) =>
                      patchPanel({
                        guides: [...panel.guides, { axis, position }],
                      })
                    }
                  />
                ) : (
                  <DielineView
                    project={project}
                    selected={panel.id}
                    onSelect={(id)=>selectFace(id,true)}
                  />
                )}
              </section>
            )}
            {mode !== "scene" && (
              <div
                className="pk-splitter"
                role="separator"
                aria-label="Resize live preview"
                aria-valuenow={split}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setSplit(Math.min(60, split + 3));
                  if (e.key === "ArrowRight") setSplit(Math.max(25, split - 3));
                }}
                onPointerDown={(e) => {
                  const start = e.clientX,
                    initial = split,
                    target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const move = (event: PointerEvent) =>
                    setSplit(
                      Math.min(
                        60,
                        Math.max(
                          25,
                          initial -
                            ((event.clientX - start) /
                              target.parentElement!.getBoundingClientRect()
                                .width) *
                              100,
                        ),
                      ),
                    );
                  target.addEventListener("pointermove", move);
                  target.addEventListener(
                    "pointerup",
                    () => target.removeEventListener("pointermove", move),
                    { once: true },
                  );
                }}
              />
            )}
            <section className="pk-preview" style={!customConnected && mode !== "scene" ? {display:"none"} : undefined}>
              <header>
                <span>
                  <Box />
                  Live 3D
                </span>
                <div>
                  <IconButton
                    label="Reset camera"
                    onClick={() => scene.current?.reset()}
                  >
                    <RotateCcw />
                  </IconButton>
                  <IconButton
                    label="Full scene workspace"
                    onClick={() => { setMode(mode === "scene" ? "design" : "scene"); if(mode !== "scene") setDrawer(false); }}
                  >
                    <Maximize2 />
                  </IconButton>
                </div>
              </header>
              {customConnected ? (
                <ScenePreview
                  ref={scene}
                  project={sceneProject}
                  unfold={unfold}
                  inside={inside}
                  selected={face}
                  onSelect={(id,inner)=>{setInside(!!inner);selectFace(id);}}
                  large={mode === "scene"}
                />
              ) : (
                <div className="pk-scene-error">
                  <strong>Fold mapping needed for 3D</strong>
                  <p>{project.imported?.referenceOnly ? "This file was imported as a 2D reference." : "The imported panels are not connected by a complete fold map."} Review the original dieline to map its panels and hinges.</p>
                  <button disabled={busy || !editable} onClick={() => void reviewImportedDieline()}>Review imported dieline & folds</button>
                </div>
              )}
              <div className="pk-fold-control">
                <div>
                  <span>Assembled</span>
                  <strong>{Math.round(unfold)}% unfolded</strong>
                  <button className="pk-fold-toggle" disabled={busy || !customConnected} onClick={toggleBoxOpening} aria-label={foldAnimating ? (foldTarget.current===100?"Close box":"Open box") : unfold>=50?"Close box":"Open box"}>
                    <Box />{foldAnimating ? (foldTarget.current===100?"Close box":"Open box") : unfold>=50?"Close box":"Open box"}
                  </button>
                  <span>Flat dieline</span>
                </div>
                <input
                  aria-label="Unfold complete package"
                  type="range"
                  min="0"
                  max="100"
                  value={unfold}
                  onChange={(e) => {stopFoldAnimation();setUnfold(+e.target.value);}}
                />
              </div>
              {mode === "scene" && (
                <div className="pk-scene-settings">
                  <div>
                    <h4>Presentation scene</h4>
                    <div className="pk-scene-presets">
                      {STUDIO_SCENES.map((s) => (
                        <button
                          key={s.id}
                          className={
                            project.scene.preset === s.id ? "active" : ""
                          }
                          disabled={!editable}
                          onClick={() =>
                            change({
                              ...project,
                              scene: { ...project.scene, ...s, preset: s.id },
                            })
                          }
                        >
                          <i style={{ backgroundColor: s.background, backgroundImage: s.surface !== "neutral" ? `url(/packaging/scenes/materials/${s.surface === "wood" ? "Wood095/Wood095" : s.surface === "stone" ? "Marble012/Marble012" : "Concrete034/Concrete034"}_1K-JPG_Color.jpg)` : undefined, backgroundSize:"cover", filter:s.id === "walnut-table" ? "brightness(.6) saturate(.8)" : undefined }} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4>Background & surface</h4>
                    <label className="pk-colour-field">
                      Background
                      <input
                        type="color"
                        aria-label="Scene background colour"
                        value={project.scene.background}
                        disabled={!editable}
                        onChange={(e) =>
                          change({
                            ...project,
                            scene: {
                              ...project.scene,
                              background: e.target.value,
                              backgroundImage: undefined,
                            },
                          })
                        }
                      />
                    </label>
                    <button
                      disabled={!editable}
                      onClick={() => backgroundFile.current?.click()}
                    >
                      <ImageIcon />
                      Upload background
                    </button>
                    <label className="pk-field">
                      <span>Surface</span>
                      <select
                        aria-label="Scene surface"
                        disabled={!editable}
                        value={project.scene.surface}
                        onChange={(e) =>
                          change({
                            ...project,
                            scene: {
                              ...project.scene,
                              surface: e.target.value as any,
                            },
                          })
                        }
                      >
                        {["neutral", "wood", "stone", "concrete"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <h4>Camera & light</h4>
                    <div className="pk-camera-presets">
                      {["hero", "front", "top", "left", "right"].map((s) => (
                        <button
                          key={s}
                          onClick={() => scene.current?.camera(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <label className="pk-field">
                      <span>Box pose</span>
                      <select
                        aria-label="Box pose"
                        disabled={!editable}
                        value={project.scene.pose}
                        onChange={(e) =>
                          change({
                            ...project,
                            scene: {
                              ...project.scene,
                              pose: e.target.value as any,
                            },
                          })
                        }
                      >
                        <option value="lying">Lying on surface</option>
                        <option value="standing">Standing</option>
                      </select>
                    </label>
                    <NumberField
                      label="Light intensity"
                      value={project.scene.light}
                      min={0.1}
                      max={4}
                      disabled={!editable}
                      onChange={(v) =>
                        change({
                          ...project,
                          scene: { ...project.scene, light: v },
                        })
                      }
                    />
                    <NumberField
                      label="Light direction (°)"
                      value={project.scene.direction}
                      min={-180}
                      max={180}
                      disabled={!editable}
                      onChange={(v) =>
                        change({
                          ...project,
                          scene: { ...project.scene, direction: v },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
          {mode === "design" && selected && (
            <div className="pk-inspector">
              <div className="pk-selection-title">
                <strong>
                  {selected.ids.length > 1
                    ? `${selected.ids.length} objects selected`
                    : selected.text
                      ? "Text properties"
                      : "Artwork properties"}
                </strong>
                <div>
                  <IconButton
                    label="Duplicate selection"
                    disabled={!editable}
                    onClick={() => canvas.current?.command("duplicate")}
                  >
                    <Copy />
                  </IconButton>
                  <IconButton
                    label="Remove selection"
                    disabled={!editable}
                    onClick={() => canvas.current?.command("delete")}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
              <div className="pk-transform-fields">
                {(["left", "top", "width", "height", "angle"] as const).map(
                  (k, i) => (
                    <NumberField
                      key={k}
                      label={
                        [
                          "X (mm)",
                          "Y (mm)",
                          "Width (mm)",
                          "Height (mm)",
                          "Rotation (°)",
                        ][i]
                      }
                      value={selected[k]}
                      disabled={!editable || selected.locked}
                      min={
                        k === "width" || k === "height"
                          ? 0.1
                          : k === "angle"
                            ? -180
                            : -2000
                      }
                      max={k === "angle" ? 180 : 2000}
                      onChange={(v) => canvas.current?.patch({ [k]: v })}
                    />
                  ),
                )}
                <NumberField
                  label="Opacity (%)"
                  value={selected.opacity * 100}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!editable}
                  onChange={(v) => canvas.current?.patch({ opacity: v / 100 })}
                />
              </div>
              <div className="pk-inspector-tools">
                <div className="pk-alignment-tools">
                  {[
                    { id: "left", label: "Align left", Icon: AlignLeft },
                    {
                      id: "center-x",
                      label: "Centre horizontally",
                      Icon: AlignCenter,
                    },
                    { id: "right", label: "Align right", Icon: AlignRight },
                    { id: "top", label: "Align top", Icon: AlignStartVertical },
                    {
                      id: "center-y",
                      label: "Centre vertically",
                      Icon: AlignCenterVertical,
                    },
                    {
                      id: "bottom",
                      label: "Align bottom",
                      Icon: AlignEndVertical,
                    },
                    {
                      id: "distribute-x",
                      label: "Equal horizontal spacing",
                      Icon: MoveHorizontal,
                    },
                    {
                      id: "distribute-y",
                      label: "Equal vertical spacing",
                      Icon: MoveVertical,
                    },
                  ].map(({ id, label, Icon }) => (
                    <IconButton
                      key={id}
                      label={label}
                      disabled={!editable}
                      onClick={() => canvas.current?.align(id)}
                    >
                      <Icon />
                    </IconButton>
                  ))}
                </div>
                <div className="pk-object-tools">
                  <IconButton
                    label="Bring to front"
                    disabled={!editable}
                    onClick={() => canvas.current?.command("front")}
                  >
                    <ArrowUpToLine />
                  </IconButton>
                  <IconButton
                    label="Send to back"
                    disabled={!editable}
                    onClick={() => canvas.current?.command("back")}
                  >
                    <ArrowDownToLine />
                  </IconButton>
                  <IconButton
                    label="Lock or unlock"
                    disabled={!editable}
                    onClick={() => canvas.current?.command("lock")}
                  >
                    <Lock />
                  </IconButton>
                  {selected.ids.length > 1 && (
                    <IconButton
                      label="Group selection"
                      disabled={!editable}
                      onClick={() => canvas.current?.command("group")}
                    >
                      <Group />
                    </IconButton>
                  )}
                </div>
              </div>
              {selected.text !== undefined && (
                <div className="pk-text-properties">
                  <select
                    aria-label="Text font"
                    value={selected.fontFamily}
                    disabled={!editable}
                    onChange={(e) =>
                      canvas.current?.patch({ fontFamily: e.target.value })
                    }
                  >
                    {Object.values(PACKAGE_FONTS).map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <NumberField
                    label="Font size (mm)"
                    value={selected.fontSize || 8}
                    min={1}
                    max={100}
                    disabled={!editable}
                    onChange={(v) => canvas.current?.patch({ fontSize: v })}
                  />
                  <NumberField
                    label="Line spacing"
                    value={selected.lineHeight || 1.2}
                    min={0.5}
                    max={4}
                    disabled={!editable}
                    onChange={(v) => canvas.current?.patch({ lineHeight: v })}
                  />
                  <NumberField
                    label="Tracking"
                    value={selected.charSpacing || 0}
                    min={-100}
                    max={1000}
                    disabled={!editable}
                    onChange={(v) => canvas.current?.patch({ charSpacing: v })}
                  />
                  <select
                    aria-label="Text alignment"
                    value={selected.textAlign || "left"}
                    disabled={!editable}
                    onChange={(e) =>
                      canvas.current?.patch({ textAlign: e.target.value })
                    }
                  >
                    {["left", "center", "right", "justify"].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <input
                    type="color"
                    aria-label="Text colour"
                    value={
                      selected.fill?.startsWith("#") ? selected.fill : "#223c36"
                    }
                    disabled={!editable}
                    onChange={(e) =>
                      canvas.current?.patch({ fill: e.target.value })
                    }
                  />
                </div>
              )}
              {!['image', 'textbox', 'i-text', 'text'].includes(selected.type.toLowerCase()) && (
                <div className="pk-vector-colours" role="group" aria-label="Element colour">
                  <span>Element colour</span>
                  {[['Black','#111111'],['Studio blue','#24516b'],['White','#ffffff'],['Grey','#737373']].map(([name, colour]) =>
                    <button key={colour} aria-label={`Element colour ${name}`} title={name}
                      disabled={!editable || selected.locked} style={{ backgroundColor:colour }}
                      onClick={() => canvas.current?.patch({fill:colour})} />)}
                  <input type="color" aria-label="Custom element colour"
                    value={selected.fill?.startsWith('#') ? selected.fill : '#111111'}
                    disabled={!editable || selected.locked}
                    onChange={e => canvas.current?.patch({fill:e.target.value})} />
                </div>
              )}
              {selected.type.toLowerCase() === "image" && (
                <div className="pk-image-properties">
                  <button
                    disabled={!editable}
                    onClick={() => {
                      setReplaceUpload(true);
                      file.current?.click();
                    }}
                  >
                    <Replace />
                    Replace image
                  </button>
                  <button
                    disabled={!editable}
                    onClick={() =>
                      canvas.current?.patch({
                        width: panel.width,
                        height: panel.height,
                        left: 0,
                        top: 0,
                      })
                    }
                  >
                    Fill panel
                  </button>
                  <p>
                    Corner handles scale proportionally. Shift allows free
                    resizing.
                  </p>
                </div>
              )}
            </div>
          )}
          <footer className="pk-footer">
            <span>
              {STRUCTURES.find((s) => s.id === project.structure)?.name ||
                (project.imported?.profileId ? "Studio mapped box" : "Custom dieline")}{" "}
              · {project.imported?.referenceOnly ? `${project.imported.net.width.toFixed(1)} × ${project.imported.net.height.toFixed(1)} mm sheet · folds not mapped` : `${project.width} × ${project.depth} × ${project.height} mm`}
            </span>
            <span>
              {canEdit ? "Editor" : "View only"} ·{" "}
              {inside ? "Inside" : "Outside"} · {panel.name}
            </span>
          </footer>
        </main>
      </div>
      {dialog && (
        <div
          className="pk-dialog-backdrop"
          onMouseDown={() => !busy && setDialog(null)}
        >
          <section
            className={`pk-dialog ${dialog === "import" ? "wide" : ""}`}
            role="dialog"
            aria-label={
              dialog === "import"
                ? "Import dieline"
                : dialog === "projects"
                  ? "Packaging projects"
                  : dialog === "template"
                    ? "Preview template"
                    : dialog === "print"
                      ? "Printer settings"
                      : "Export packaging"
            }
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <small>PACKAGING STUDIO</small>
                <h3>
                  {dialog === "import"
                    ? "Understand your dieline"
                    : dialog === "projects"
                      ? "Your projects"
                      : dialog === "template"
                        ? "Preview this layout"
                        : dialog === "print"
                          ? "Printer settings"
                          : "Export your design"}
                </h3>
              </div>
              <IconButton
                label="Close panel"
                disabled={busy}
                onClick={() => setDialog(null)}
              >
                <X />
              </IconButton>
            </header>
            {dialog === "projects" && (
              <>
                <div className="pk-dialog-actions">
                  <button disabled={!editable} onClick={newProject}>
                    <Plus />
                    Blank project
                  </button>
                  <button
                    disabled={!editable}
                    onClick={() => projectFile.current?.click()}
                  >
                    <Upload />
                    Import project
                  </button>
                  {record && (
                    <button
                      disabled={!editable}
                      onClick={() => void save(true)}
                    >
                      Save a copy
                    </button>
                  )}
                </div>
                <div className="pk-project-list">
                  {projects.map((p) => (
                    <button key={p.id} onClick={() => void loadProject(p.id)}>
                      <Box />
                      <div>
                        <strong>{p.name}</strong>
                        <span>
                          {p.width} × {p.depth} × {p.height} mm ·{" "}
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronLeft />
                    </button>
                  ))}
                  {!projects.length && (
                    <p>Save your first project to reuse it later.</p>
                  )}
                </div>
              </>
            )}
            {dialog === "template" && pendingTemplate && (
              <>
                <div
                  className="pk-template-preview"
                  style={{
                    background: pendingTemplate.background,
                    color: pendingTemplate.ink,
                  }}
                >
                  <small>{pendingTemplate.category}</small>
                  <h2>{pendingTemplate.name}</h2>
                  <span style={{ borderColor: pendingTemplate.accent }}>
                    YOUR PRODUCT
                  </span>
                  <p>THOUGHTFULLY MADE</p>
                </div>
                <p>
                  Applies an editable layout to this package. Product images and
                  named product text are retained. You can undo the change.
                </p>
                <button
                  className="pk-primary"
                  disabled={!editable}
                  onClick={applyTemplate}
                >
                  Apply template
                </button>
              </>
            )}
            {dialog === "print" && (
              <>
                <p>
                  Choose settings from your printer. Production output is
                  available only after the owned prepress service validates it.
                </p>
                <div className="pk-fields three">
                  <NumberField
                    label="Bleed (mm)"
                    value={project.print.bleed}
                    min={0}
                    max={20}
                    disabled={!editable}
                    onChange={(v) =>
                      change({
                        ...project,
                        print: { ...project.print, bleed: v },
                      })
                    }
                  />
                  <NumberField
                    label="Safe area (mm)"
                    value={project.print.safe}
                    min={0}
                    max={20}
                    disabled={!editable}
                    onChange={(v) =>
                      change({
                        ...project,
                        print: { ...project.print, safe: v },
                      })
                    }
                  />
                  <NumberField
                    label="Raster target (dpi)"
                    value={project.print.dpi}
                    min={72}
                    max={600}
                    disabled={!editable}
                    onChange={(v) =>
                      change({
                        ...project,
                        print: { ...project.print, dpi: v },
                      })
                    }
                  />
                </div>
                <label className="pk-field">
                  <span>Cut spot name</span>
                  <input
                    value={project.print.cutSpot}
                    disabled={!editable}
                    onChange={(e) =>
                      change({
                        ...project,
                        print: { ...project.print, cutSpot: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="pk-field">
                  <span>Crease spot name</span>
                  <input
                    value={project.print.creaseSpot}
                    disabled={!editable}
                    onChange={(e) =>
                      change({
                        ...project,
                        print: { ...project.print, creaseSpot: e.target.value },
                      })
                    }
                  />
                </label>
                <button
                  disabled={!editable}
                  onClick={() => iccFile.current?.click()}
                >
                  <Upload />
                  Upload printer ICC profile
                </button>
                <p className="pk-fine">
                  {project.print.profileName || "No printer profile selected"}
                </p>
                <div
                  className={`pk-service ${processing.available ? "online" : ""}`}
                >
                  <span />
                  {processing.available
                    ? "Studio prepress service connected"
                    : "Studio prepress service not connected"}
                </div>
              </>
            )}
            {dialog === "export" && (
              <>
                <h4>Design files</h4>
                <div className="pk-export-list">
                  <button disabled={busy} onClick={() => void exportAs("svg")}>
                    <Download />
                    <strong>Editable SVG dieline</strong>
                    <span>{project.imported ? "Actual size · includes imported artwork images" : "Actual size · vector art · text outlined"}</span>
                  </button>
                  <button disabled={busy} onClick={() => void exportAs("pdf")}>
                    <Download />
                    <strong>PDF for Illustrator</strong>
                    <span>Actual size · artwork + vector cut/fold paths · text outlined · RGB</span>
                  </button>
                  <button disabled={busy} onClick={() => void exportAs("eps")}>
                    <Download />
                    <strong>EPS vector dieline</strong>
                    <span>Actual size · editable cut/fold paths only · no artwork</span>
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void exportAs("panel")}
                  >
                    <Download />
                    <strong>Selected panel artwork</strong>
                    <span>
                      {panel.name} · {inside ? "inside" : "outside"} · SVG
                    </span>
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void exportAs("project")}
                  >
                    <FolderOpen />
                    <strong>Portable project</strong>
                    <span>Editable project with assets and fonts</span>
                  </button>
                </div>
                <h4>Mockup images</h4>
                <div className="pk-dialog-actions">
                  <button
                    disabled={busy || !customConnected}
                    onClick={() => void exportAs("png")}
                  >
                    PNG · 3840 px
                  </button>
                  <button
                    disabled={busy || !customConnected}
                    onClick={() => void exportAs("jpg")}
                  >
                    JPG · 3840 px
                  </button>
                  <button
                    disabled={busy || !customConnected}
                    onClick={() => void exportAs("transparent")}
                  >
                    Transparent PNG
                  </button>
                </div>
                <p className="pk-fine">PDF export uses RGB colour. Ask your printer to prepare and preflight production colour separations.</p>
              </>
            )}
            {dialog === "import" && (
              <>
                <p>
                  Keep the original file, identify structure, then confirm
                  physical scale and folds. Your current project stays unchanged
                  until confirmation.
                </p>
                <button
                  disabled={!editable || busy}
                  onClick={() => dielineFile.current?.click()}
                >
                  <Upload />
                  Choose another dieline
                </button>
                {importProgress && <div className="pk-import-progress" role="status" aria-live="polite" aria-busy="true">
                  <span className="pk-import-spinner" aria-hidden="true" />
                  <div><strong>{importProgress.label}</strong><span>{importProgress.total ? `${importProgress.done} of ${importProgress.total} panels ready` : "Your current project is kept safe while this file is prepared."}</span>
                  <progress max={importProgress.total || undefined} value={importProgress.total ? importProgress.done : undefined} /></div>
                </div>}
                {!analysis && !busy && <p className="pk-import-empty">Choose a dieline to see its preview and review the box structure.</p>}
                {!busy && notice && <p className="pk-import-error" role="alert">{notice}</p>}
                {analysis && (
                  <div className="pk-import-grid">
                    <div className="pk-import-preview">
                      <img
                        src={previewUrl.current}
                        alt="Original dieline preview"
                      />
                      <svg
                        viewBox={`0 0 ${analysis.width} ${analysis.height}`}
                        aria-label="Trace panels on imported dieline"
                        onPointerDown={(e) => {
                          if (importKind !== "custom") return;
                          const target = e.currentTarget,
                            r = target.getBoundingClientRect(),
                            start = [
                              ((e.clientX - r.left) / r.width) * analysis.width,
                              ((e.clientY - r.top) / r.height) *
                                analysis.height,
                            ];
                          target.setPointerCapture(e.pointerId);
                          const end = (event: PointerEvent) => {
                            const x =
                                ((event.clientX - r.left) / r.width) *
                                analysis.width,
                              y =
                                ((event.clientY - r.top) / r.height) *
                                analysis.height;
                            if (
                              Math.abs(x - start[0]) < 3 ||
                              Math.abs(y - start[1]) < 3
                            )
                              return;
                            const id =
                              "panel-" + crypto.randomUUID().slice(0, 8);
                            setAnalysis((a) =>
                              a
                                ? {
                                    ...a,
                                    panels: [
                                      ...a.panels,
                                      {
                                        id,
                                        x: Math.min(x, start[0]),
                                        y: Math.min(y, start[1]),
                                        width: Math.abs(x - start[0]),
                                        height: Math.abs(y - start[1]),
                                      },
                                    ],
                                  }
                                : a,
                            );
                            setMapping((m) => [
                              ...m,
                              {
                                id,
                                name: `Panel ${m.length + 1}`,
                                parent: "",
                                edge: "top",
                                angle: 90,
                              },
                            ]);
                          };
                          target.addEventListener("pointerup", end, {
                            once: true,
                          });
                        }}
                      >
                        {analysis.lines
                          .filter((l) => l.kind !== "artwork")
                          .map((l) => (
                            <polyline
                              key={l.id}
                              points={l.points
                                .map((p) => p.join(","))
                                .join(" ")}
                              fill="none"
                              stroke={l.kind === "fold" ? "#2f987d" : "#bc526b"}
                              strokeWidth={analysis.width / 1000}
                            />
                          ))}
                        {analysis.panels.map((p, i) => (
                          <g key={p.id}>
                            <path
                              d={[p.points || [[p.x,p.y],[p.x+p.width,p.y],[p.x+p.width,p.y+p.height],[p.x,p.y+p.height]],...(p.islands||[]),...(p.holes||[])].map(ring=>'M'+ring.map(point=>point.join(' ')).join(' L')+' Z').join(' ')}
                              fillRule="evenodd"
                              fill="#347c6818"
                              stroke="#277d6a"
                              strokeWidth={analysis.width / 600}
                            />
                            <text
                              x={p.x + p.width / 2}
                              y={p.y + p.height / 2}
                              textAnchor="middle"
                              fontSize={analysis.width / 50}
                              fill="#215447"
                            >
                              {i + 1}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="pk-import-controls">
                      {analysis.pages > 1 && (
                        <NumberField
                          label="PDF page"
                          value={analysis.page}
                          min={1}
                          max={analysis.pages}
                          step={1}
                          disabled={busy}
                          onChange={(v) =>
                            void importDieline(importOriginal.current!, v)
                          }
                        />
                      )}
                      <label className="pk-field">
                        <span>Box style</span>
                        <select
                          aria-label="Imported box style"
                          value={importKind}
                          disabled={busy}
                          onChange={(e) =>
                            setImportKind(e.target.value as StructureKind)
                          }
                        >
                          {STRUCTURES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                          <option value="custom">{analysis.studioProfile ? "Mapped Studio package" : "Custom panel mapping"}</option>
                        </select>
                      </label>
                      {!analysis.dimensions && <p className="pk-fine">Box dimensions could not be read reliably. The values below are placeholders: enter confirmed measurements before generating a standard box. Sheet size is independent of box size.</p>}
                      {analysis.notes.map((n) => (
                        <p className="pk-fine" key={n}>
                          {n}
                        </p>
                      ))}
                      <div className="pk-fields three">
                        {importDims.map((n, i) => (
                          <NumberField
                            key={i}
                            label={
                              [
                                "Imported length (mm)",
                                "Imported depth (mm)",
                                "Imported height (mm)",
                              ][i]
                            }
                            value={n}
                            min={30}
                            max={800}
                            disabled={busy || !!analysis.studioProfile}
                            onChange={(v) =>
                              setImportDims(
                                (d) =>
                                  d.map((old, j) => (j === i ? v : old)) as [
                                    number,
                                    number,
                                    number,
                                  ],
                              )
                            }
                          />
                        ))}
                      </div>
                      <NumberField
                        label="Known sheet width (mm)"
                        value={analysis.width * importScale}
                        min={1}
                        max={5000}
                        disabled={busy}
                        onChange={(v) => {
                          const scale = v / analysis.width;
                          setImportScale(scale);
                          if (analysis.studioProfile) setImportDims(analysis.studioProfile.dimensions.map(n => n * scale / analysis.studioProfile!.scale) as [number,number,number]);
                        }}
                      />
                      <p className="pk-fine">
                        Estimated sheet{" "}
                        {Math.round(analysis.width * importScale)} ×{" "}
                        {Math.round(analysis.height * importScale)} mm. Confirm
                        against the original drawing.
                      </p>
                      <details>
                        <summary>
                          Classify structural paths ({analysis.lines.filter(l => l.kind !== "artwork").length})
                        </summary>
                        {analysis.lines.filter(l => l.kind !== "artwork").slice(0, 150).map((l) => (
                          <label className="pk-path-row" key={l.id}>
                            <span>{l.id}</span>
                            <select
                              value={l.kind}
                              onChange={(e) =>
                                setAnalysis((a) => {
                                  if (!a) return a;
                                  const lines = a.lines.map((old) =>
                                    old.id === l.id
                                      ? { ...old, kind: e.target.value as any }
                                      : old,
                                  );
                                  return {
                                    ...a,
                                    lines,
                                    panels: linePanels(lines),
                                  };
                                })
                              }
                            >
                              <option value="cut">Cut</option>
                              <option value="fold">Fold</option>
                              <option value="artwork">
                                Artwork / dimension
                              </option>
                            </select>
                          </label>
                        ))}
                      </details>
                      {importKind === "custom" && analysis.studioProfile && <p className="pk-fine">{analysis.studioProfile.net.pieces.length} panels mapped, including curved tabs and rollover folds. Ready for a live 3D mockup.</p>}
                      {importKind === "custom" && !analysis.studioProfile && (
                        <>
                          <p className="pk-fine">
                            Drag over the preview to trace a rectangular panel.
                            Map each child to its parent and hinge. Leave one
                            root panel.
                          </p>
                          {mapping.map((m, i) => (
                            <div className="pk-mapping" key={m.id}>
                              <strong>Panel {i + 1}</strong>
                              <input
                                aria-label={`Panel ${i + 1} name`}
                                value={m.name}
                                onChange={(e) =>
                                  setMapping((items) =>
                                    items.map((v) =>
                                      v.id === m.id
                                        ? { ...v, name: e.target.value }
                                        : v,
                                    ),
                                  )
                                }
                              />
                              <select
                                aria-label={`Panel ${i + 1} parent`}
                                value={m.parent}
                                onChange={(e) =>
                                  setMapping((items) =>
                                    items.map((v) =>
                                      v.id === m.id
                                        ? { ...v, parent: e.target.value }
                                        : v,
                                    ),
                                  )
                                }
                              >
                                <option value="">Root / disconnected</option>
                                {mapping
                                  .filter((v) => v.id !== m.id)
                                  .map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.name}
                                    </option>
                                  ))}
                              </select>
                              <select
                                aria-label={`Panel ${i + 1} hinge edge`}
                                value={m.edge}
                                onChange={(e) =>
                                  setMapping((items) =>
                                    items.map((v) =>
                                      v.id === m.id
                                        ? { ...v, edge: e.target.value as any }
                                        : v,
                                    ),
                                  )
                                }
                              >
                                {["top", "bottom", "left", "right"].map(
                                  (edge) => (
                                    <option key={edge}>{edge}</option>
                                  ),
                                )}
                              </select>
                              <NumberField
                                label={`Panel ${i + 1} fold angle`}
                                value={m.angle}
                                min={-180}
                                max={180}
                                disabled={busy}
                                onChange={(v) =>
                                  setMapping((items) =>
                                    items.map((old) =>
                                      old.id === m.id
                                        ? { ...old, angle: v }
                                        : old,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </>
                      )}
                      {importKind === "custom" && !analysis.studioProfile && <button disabled={busy || !canEdit || !importChecked} onClick={() => void confirmImport(true)}>Keep complete original as a 2D reference</button>}
                      <label className="pk-field">
                        <span><input type="checkbox" checked={importChecked} onChange={e => setImportChecked(e.target.checked)} /> {analysis.studioProfile ? "Use reviewed Studio scale and fold map" : "I checked the sheet scale and panel boundaries against the original."}</span>
                      </label>
                      <p className="pk-fine">Custom mapping preserves this file's layout and panel artwork. Selecting a standard box creates a new blank dieline with the entered dimensions; it does not map the source artwork automatically.</p>
                      {importMappingProblem && <p className="pk-fine" role="status">{importMappingProblem} You can still keep the original as a 2D reference.</p>}
                    </div>
                  </div>
                )}
                {analysis && <div className="pk-import-footer">
                  <span>{busy ? importProgress?.label || "Preparing package…" : importFailed ? "Import paused. Your selected dieline is retained; retry when connected." : importMappingProblem || (!importChecked ? "Confirm the scale and panel boundaries to continue." : "Ready to create the package and live mockup.")}</span>
                  <button className="pk-primary" disabled={busy || !canEdit || !importChecked || !!importMappingProblem} onClick={() => void confirmImport()}>
                    {busy ? <span className="pk-import-spinner" aria-hidden="true" /> : <Check />}
                    {busy ? "Preparing package…" : importFailed ? "Retry import & open editor" : "Create package & open editor"}
                  </button>
                </div>}
              </>
            )}
            {nativeJob && (
              <div className="pk-job">
                <strong>
                  {nativeJob.operation === "prepress"
                    ? "Production export"
                    : "Native conversion"}{" "}
                  · {nativeJob.status}
                </strong>
                <span>{nativeJob.message || nativeJob.error}</span>
                {["queued", "processing"].includes(nativeJob.status) && (
                  <button
                    onClick={async () => {
                      const r = await fetch("/api/packaging/jobs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "cancel",
                          id: nativeJob.id,
                        }),
                      });
                      setNativeJob(await r.json());
                    }}
                  >
                    Cancel processing
                  </button>
                )}
                {nativeJob.status === "failed" && (
                  <button
                    onClick={async () => {
                      const r = await fetch("/api/packaging/jobs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "retry",
                          id: nativeJob.id,
                        }),
                      });
                      setNativeJob(await r.json());
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
      <input ref={libraryFile} hidden type="file"
        aria-label="Upload reusable design asset"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
        onChange={e => { void uploadArtwork(e.target.files?.[0], uploadKind); e.target.value = ""; }} />
      <input
        ref={file}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
        onChange={(e) => {
          void uploadArtwork(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={dielineFile}
        hidden
        type="file"
        accept=".pdf,.svg,.dxf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => {
          void importDieline(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={projectFile}
        hidden
        type="file"
        accept=".json,.zip"
        onChange={(e) => {
          void importProjectFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={backgroundFile}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          void uploadArtwork(e.target.files?.[0], "background");
          e.target.value = "";
        }}
      />
      <input
        ref={iccFile}
        hidden
        type="file"
        accept=".icc,.icm"
        onChange={(e) => {
          void uploadArtwork(e.target.files?.[0], "icc");
          e.target.value = "";
        }}
      />
    </Sheet>
  );
}
