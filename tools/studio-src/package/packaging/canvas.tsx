"use client";
import {artworkViewport,artworkRuler} from "../lib/packaging-view";
import {tintImage} from "../lib/packaging-image-colour";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  StaticCanvas,
  Rect,
  Line,
  Textbox,
  ActiveSelection,
  FabricObject,
  Group,
  FabricImage,
  loadSVGFromString,
  util,
  Point,
} from "fabric";
import type { StudioObject, StudioPanel } from "../lib/packaging-document";
export type CanvasSelection = {
  ids: string[];
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  locked?: boolean;
  fit?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
};
export type CanvasHandle = {
  add: (object: StudioObject) => Promise<void>;
  patch: (props: StudioObject) => void;
  command: (name: string) => void;
  align: (direction: string) => void;
  svg: () => string;
  png: (scale?: number) => string;
  select: (id: string) => void;
  zoom: (value: number) => void;
  replace: (src: string) => Promise<void>;
};
FabricObject.ownDefaults.originX = "left";
FabricObject.ownDefaults.originY = "top";
FabricObject.customProperties = ["id", "name", "assetId", "locked", "fit", "tintColor"];
const decor = {
  borderColor: "#2d756a",
  cornerColor: "#fff",
  cornerStrokeColor: "#2d756a",
  cornerStyle: "circle" as const,
  cornerSize: 9,
  transparentCorners: false,
  padding: 2,
};
const jsonObject = (o: FabricObject): StudioObject => {
  const raw=o.toObject(["id", "name", "assetId", "locked", "fit", "tintColor"]);
  // Fabric expands image.src to an absolute URL. Persist only our same-origin
  // asset path, including images nested inside groups, so edits pass validation.
  const normalize=(value:any) => {
    if(typeof value.src === "string" && value.src.startsWith(window.location.origin+"/")) value.src=value.src.slice(window.location.origin.length);
    if(Array.isArray(value.objects))value.objects.forEach(normalize);
    if(value.clipPath)normalize(value.clipPath);
  };
  normalize(raw);
  return raw;
};
async function objectFromJSON(raw: StudioObject) {
  if (raw.type === "legacy") {
    const parsed = await loadSVGFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${raw.svg}</svg>`,
    );
    const obj = util.groupSVGElements(
      parsed.objects.filter(Boolean) as FabricObject[],
      parsed.options,
    );
    obj.set({ id: raw.id, name: raw.name, ...decor } as any);
    return obj;
  }
  if (raw.svg) {
    const parsed = await loadSVGFromString(raw.svg);
    const obj = util.groupSVGElements(
      parsed.objects.filter(Boolean) as FabricObject[],
      parsed.options,
    );
    const width = Number(raw.width || 40),
      height = Number(raw.height || 40);
    obj.set({
      left: raw.left || 0,
      top: raw.top || 0,
      scaleX: width / Math.max(1, obj.width),
      scaleY: height / Math.max(1, obj.height),
      id: raw.id || crypto.randomUUID(),
      name: raw.name,
      ...decor,
    } as any);
    return obj;
  }
  const [obj] = await util.enlivenObjects<FabricObject>([raw]);
  const restoreTint=(object:FabricObject)=>{
    if(object instanceof Group) object.getObjects().forEach(restoreTint);
    if(object instanceof FabricImage && (object as any).tintColor) tintImage(object,(object as any).tintColor);
  };
  restoreTint(obj);
  obj.set({
    ...decor,
    ...(raw.locked
      ? {
          selectable: true,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          hasControls: false,
        }
      : {}),
  });
  return obj;
}
export async function panelCanvas(
  panel: StudioPanel,
  inside = false,
  scale = 3,
) {
  const el = document.createElement("canvas"),
    c = new StaticCanvas(el, {
      width: panel.width * scale,
      height: panel.height * scale,
      backgroundColor: inside ? panel.insideColor : panel.color,
      enableRetinaScaling: false,
    });
  c.setViewportTransform([scale, 0, 0, scale, 0, 0]);
  await document.fonts.ready;
  const objects = await Promise.all(
    (inside ? panel.insideObjects : panel.objects).map(objectFromJSON),
  );
  objects.forEach((o) => c.add(o));
  c.renderAll();
  return {
    canvas: el,
    dispose: () => c.dispose(),
    svg: () =>
      c.toSVG({
        viewBox: { x: 0, y: 0, width: panel.width, height: panel.height },
        width: String(panel.width),
        height: String(panel.height),
      }),
  };
}
const CanvasEditor = forwardRef<
  CanvasHandle,
  {
    panel: StudioPanel;
    inside: boolean;
    editable: boolean;
    grid: boolean;
    snap: boolean;
    safe: number;
    viewRotation?: number;
    selected: string[];
    onChange: (objects: StudioObject[]) => void;
    onPreview: (objects: StudioObject[] | null) => void;
    onSelect: (selection: CanvasSelection | null) => void;
    onGuide: (axis: "x" | "y", position: number) => void;
  }
>(function CanvasEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    element = useRef<HTMLCanvasElement>(null),
    canvas = useRef<Canvas | null>(null),
    latest = useRef(props),
    clipboard = useRef<StudioObject[]>([]),
    revision = useRef(0),
    zoomRef = useRef(1),
    fitRef = useRef(1),
    syncing = useRef(false),
    lastJSON = useRef(""),
    snapLines = useRef<{ axis: "x" | "y"; position: number }[]>([]),
    previewTime = useRef(0),
    [zoom, setZoom] = useState(100),
    [ready, setReady] = useState(false),
    [hint, setHint] = useState("");
  latest.current = props;
  const objects = () =>
    canvas.current!.getObjects().filter((o) => !o.excludeFromExport);
  const serialize = () => objects().map(o=>{
    const raw=jsonObject(o);
    if(o.group instanceof ActiveSelection){const t=util.qrDecompose(o.calcTransformMatrix());Object.assign(raw,{originX:'center',originY:'center',left:t.translateX,top:t.translateY,scaleX:t.scaleX,scaleY:t.scaleY,angle:t.angle,skewX:t.skewX,skewY:0,flipX:false,flipY:false});}
    return raw;
  });
  const commit = () => {
    if (syncing.current || !latest.current.editable) return;
    const list = serialize();
    lastJSON.current = JSON.stringify(list);
    latest.current.onChange(list);
    latest.current.onPreview(null);
    selection();
  };
  const selection = () => {
    const c = canvas.current;
    if (!c) return;
    const a = c.getActiveObject();
    if (!a) {
      latest.current.onSelect(null);
      return;
    }
    const members = c.getActiveObjects(),
      b = a.getBoundingRect();
    latest.current.onSelect({
      ids: members.map((o) => (o as any).id),
      type: a.type,
      left: a.left,
      top: a.top,
      width: a.getScaledWidth(),
      height: a.getScaledHeight(),
      angle: a.angle,
      opacity: a.opacity,
      text: (a as Textbox).text,
      fontFamily: (a as Textbox).fontFamily,
      fontSize: (a as Textbox).fontSize,
      fill: (a as any).tintColor || (typeof a.fill === "string" ? a.fill : undefined),
      locked: (a as any).locked,
      fit: (a as any).fit,
      textAlign: (a as Textbox).textAlign,
      lineHeight: (a as Textbox).lineHeight,
      charSpacing: (a as Textbox).charSpacing,
    });
  };
  const guides = () => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.contextTop;
    ctx.save();
    const [a,b,cc,d,x,y] = c.viewportTransform;
    const unit=Math.hypot(a,b);
    const retina = c.getRetinaScaling();
    ctx.setTransform(a*retina, b*retina, cc*retina, d*retina, x*retina, y*retina);
    const p = latest.current.panel;
    if (latest.current.grid) {
      ctx.strokeStyle = "#63857824";
      ctx.lineWidth = 0.5 / unit;
      ctx.beginPath();
      for (let i = 0; i < p.width; i += 10) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, p.height);
      }
      for (let j = 0; j < p.height; j += 10) {
        ctx.moveTo(0, j);
        ctx.lineTo(p.width, j);
      }
      ctx.stroke();
    }
    const safe = latest.current.safe;
    ctx.setLineDash([3 / unit, 3 / unit]);
    ctx.strokeStyle = "#839b9455";
    ctx.lineWidth = 1 / unit;
    ctx.strokeRect(
      safe,
      safe,
      Math.max(0, p.width - 2 * safe),
      Math.max(0, p.height - 2 * safe),
    );
    for (const g of [...p.guides, ...snapLines.current]) {
      ctx.beginPath();
      ctx.strokeStyle = "#33a696";
      if (g.axis === "x") {
        ctx.moveTo(g.position, 0);
        ctx.lineTo(g.position, p.height);
      } else {
        ctx.moveTo(0, g.position);
        ctx.lineTo(p.width, g.position);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  const fit = () => {
    const c = canvas.current,
      h = host.current,
      p = latest.current.panel;
    if (!c || !h) return;
    const r = h.getBoundingClientRect();
    c.setDimensions({width:Math.max(100,r.width-24),height:Math.max(100,r.height-24)});
    const transform=artworkViewport(p.width,p.height,c.width,c.height,latest.current.viewRotation || 0,zoomRef.current);
    const scale=Math.hypot(transform[0],transform[1]);
    fitRef.current=scale/zoomRef.current;
    c.setViewportTransform(transform);
    c.clipPath = undefined;
    c.backgroundColor = "#eef1eb";
    const oldBoard = c.getObjects().find((o) => o.excludeFromExport);
    if (oldBoard) c.remove(oldBoard);
    const board = new Rect({
      left: 0,
      top: 0,
      width: p.width,
      height: p.height,
      fill: latest.current.inside ? p.insideColor : p.color,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      stroke: "#d6ddd1",
      strokeWidth: 1 / scale,
    });
    c.add(board);
    c.sendObjectToBack(board);
    c.requestRenderAll();
  };
  const patch = (values: StudioObject) => {
    const c = canvas.current;
    if (!c || !latest.current.editable) return;
    const active = c.getActiveObject();
    if (!active) return;
    const { width, height, ...other } = values;
    if (active instanceof Textbox && active.isEditing) {
      const richKeys = [
        "fill",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "underline",
        "linethrough",
      ];
      const rich = Object.fromEntries(
        Object.entries(other).filter(([k]) => richKeys.includes(k)),
      );
      if (active.selectionStart !== active.selectionEnd)
        active.setSelectionStyles(rich);
      else active.set(rich);
      const rest = Object.fromEntries(
        Object.entries(other).filter(([k]) => !richKeys.includes(k)),
      );
      active.set(rest);
    } else {
      if (other.tintColor === null) {
        const clear=(object:FabricObject)=>{
          if(object instanceof Group) object.getObjects().forEach(clear);
          if(object instanceof FabricImage) tintImage(object,null);
          object.set('dirty',true);
        };
        clear(active);
      }
      if (typeof other.fill === "string") {
        const recolour = (object: FabricObject) => {
          if (object instanceof Group) object.getObjects().forEach(recolour);
          else if (object instanceof FabricImage) {
            if((object as any).name!=="Imported background") tintImage(object,other.fill as string);
          } else {
            if (object.fill && object.fill !== "none" && object.fill !== "transparent") object.set("fill", other.fill);
            if (object.stroke && object.stroke !== "none" && object.stroke !== "transparent") object.set("stroke", other.fill);
          }
          object.set("dirty", true);
        };
        recolour(active);
      }
      active.set(other);
      if (width !== undefined) {
        if (active instanceof Textbox)
          active.set({ width: Number(width), scaleX: 1 });
        else
          active.set({ scaleX: Number(width) / Math.max(0.01, active.width) });
      }
      if (height !== undefined && !(active instanceof Textbox))
        active.set({ scaleY: Number(height) / Math.max(0.01, active.height) });
    }
    active.setCoords();
    c.requestRenderAll();
    commit();
  };
  const add = async (raw: StudioObject) => {
    const c = canvas.current;
    if (!c || !latest.current.editable) return;
    const o = await objectFromJSON({
      ...raw,
      id: raw.id || crypto.randomUUID(),
    });
    c.add(o);
    c.setActiveObject(o);
    c.requestRenderAll();
    commit();
  };
  const command = async (name: string) => {
    const c = canvas.current;
    if (!c || !latest.current.editable) return;
    const active = c.getActiveObject(),
      members = c.getActiveObjects();
    if (active instanceof Textbox && active.isEditing) {
      if (name === "selectAll") {
        active.selectAll();
        c.requestRenderAll();
      }
      return;
    }
    if (name === "selectAll") {
      c.discardActiveObject();
      c.setActiveObject(
        new ActiveSelection(
          objects().filter((o) => o.visible && !(o as any).locked),
          { canvas: c, ...decor },
        ),
      );
      c.requestRenderAll();
      selection();
      return;
    }
    if (name === "copy") {
      clipboard.current = members.map(jsonObject);
      return;
    }
    if (name === "paste" || name === "duplicate") {
      const raws =
        name === "paste" ? clipboard.current : members.map(jsonObject);
      c.discardActiveObject();
      const added = await Promise.all(
        raws.map((o) =>
          objectFromJSON({
            ...o,
            id: crypto.randomUUID(),
            left: Number(o.left) + 4,
            top: Number(o.top) + 4,
          }),
        ),
      );
      added.forEach((o) => c.add(o));
      if (added.length)
        c.setActiveObject(
          added.length === 1
            ? added[0]
            : new ActiveSelection(added, { canvas: c, ...decor }),
        );
    }
    if (name === "delete") {
      members.filter((o) => !(o as any).locked).forEach((o) => c.remove(o));
      c.discardActiveObject();
    }
    if (name === "group" && members.length > 1) {
      c.discardActiveObject();
      members.forEach((o) => c.remove(o));
      const group = new Group(members, {
        id: crypto.randomUUID(),
        name: "Group",
        ...decor,
      } as any);
      c.add(group);
      c.setActiveObject(group);
    }
    if (
      name === "ungroup" &&
      active instanceof Group &&
      !(active instanceof ActiveSelection)
    ) {
      const items = active.removeAll();
      c.remove(active);
      items.forEach((o) => c.add(o));
      c.setActiveObject(new ActiveSelection(items, { canvas: c, ...decor }));
    }
    if (name === "lock") {
      members.forEach((o) => {
        const locked = !(o as any).locked;
        o.set({
          locked,
          lockMovementX: locked,
          lockMovementY: locked,
          lockScalingX: locked,
          lockScalingY: locked,
          lockRotation: locked,
          hasControls: !locked,
        } as any);
      });
    }
    if (name === "front") members.forEach((o) => c.bringObjectToFront(o));
    if (name === "back") members.forEach((o) => c.sendObjectToBack(o));
    if (name === "hide") members.forEach((o) => o.set({ visible: !o.visible }));
    c.requestRenderAll();
    commit();
  };
  useImperativeHandle(ref, () => ({
    add,
    patch,
    command,
    select(id) {
      const c = canvas.current,
        o = c?.getObjects().find((o) => (o as any).id === id);
      if (c && o) {
        c.setActiveObject(o);
        selection();
        c.requestRenderAll();
      }
    },
    align(direction) {
      const c = canvas.current;
      if (!c || !latest.current.editable) return;
      const active = c.getActiveObject();
      if (!active) return;
      const p = latest.current.panel,
        members = c.getActiveObjects();
      if (direction.startsWith("distribute") && members.length > 2) {
        c.discardActiveObject();
        const key = direction === "distribute-x" ? "left" : "top",
          size = key === "left" ? "width" : "height";
        members.sort((a, b) => a[key] - b[key]);
        const start = members[0][key],
          last = members[members.length - 1],
          end =
            last[key] +
            (size === "width" ? last.getScaledWidth() : last.getScaledHeight()),
          total = members.reduce(
            (n, o) =>
              n + (size === "width" ? o.getScaledWidth() : o.getScaledHeight()),
            0,
          ),
          gap = (end - start - total) / (members.length - 1);
        let at = start;
        members.forEach((o) => {
          o.set(key, at);
          at +=
            (size === "width" ? o.getScaledWidth() : o.getScaledHeight()) + gap;
          o.setCoords();
        });
        c.setActiveObject(
          new ActiveSelection(members, { canvas: c, ...decor }),
        );
      } else {
        const w = active.getScaledWidth(),
          h = active.getScaledHeight();
        if (direction === "left") active.set("left", 0);
        if (direction === "right") active.set("left", p.width - w);
        if (direction === "center-x") active.set("left", (p.width - w) / 2);
        if (direction === "top") active.set("top", 0);
        if (direction === "bottom") active.set("top", p.height - h);
        if (direction === "center-y") active.set("top", (p.height - h) / 2);
        active.setCoords();
      }
      c.requestRenderAll();
      commit();
    },
    svg() {
      return (
        canvas.current?.toSVG({
          viewBox: {
            x: 0,
            y: 0,
            width: latest.current.panel.width,
            height: latest.current.panel.height,
          },
          width: String(latest.current.panel.width),
          height: String(latest.current.panel.height),
        }) || ""
      );
    },
    png(scale = 3) {
      return (
        canvas.current?.toDataURL({
          format: "png",
          multiplier: scale / Math.max(0.01, canvas.current.getZoom()),
          left: canvas.current.viewportTransform[4],
          top: canvas.current.viewportTransform[5],
          width: latest.current.panel.width * canvas.current.getZoom(),
          height: latest.current.panel.height * canvas.current.getZoom(),
        }) || ""
      );
    },
    zoom(value) {
      zoomRef.current = value;
      setZoom(Math.round(value * 100));
      fit();
    },
    async replace(src) {
      const c = canvas.current,
        a = c?.getActiveObject();
      if (!c || !a || !latest.current.editable) return;
      const img = await FabricImage.fromURL(src);
      img.set({
        left: a.left,
        top: a.top,
        angle: a.angle,
        scaleX: a.getScaledWidth() / img.width,
        scaleY: a.getScaledHeight() / img.height,
        id: (a as any).id,
        name: "Image",
        ...decor,
      } as any);
      c.remove(a);
      c.add(img);
      c.setActiveObject(img);
      commit();
    },
  }));
  useEffect(() => {
    if (!element.current) return;
    const c = new Canvas(element.current, {
      selection: props.editable,
      preserveObjectStacking: true,
      uniformScaling: true,
      selectionColor: "#31857618",
      selectionBorderColor: "#318576",
      fireRightClick: true,
    });
    canvas.current = c;
    c.on("selection:created", selection);
    c.on("selection:updated", selection);
    c.on("selection:cleared", selection);
    c.on("object:modified", commit);
    c.on("text:changed", () => {
      commit();
    });
    c.on("object:moving", (e) => {
      const o = e.target;
      if (!o) return;
      const ev = e.e as MouseEvent;
      snapLines.current = [];
      const p = latest.current.panel;
      if (latest.current.snap && !ev.altKey) {
        const bounds = o.getBoundingRect(),
          tolerance = 5 / c.getZoom(),
          xs = [
            0,
            p.width / 2,
            p.width,
            ...p.guides.filter((g) => g.axis === "x").map((g) => g.position),
          ],
          ys = [
            0,
            p.height / 2,
            p.height,
            ...p.guides.filter((g) => g.axis === "y").map((g) => g.position),
          ];
        objects()
          .filter(
            (other) =>
              other !== o &&
              !c.getActiveObjects().includes(other) &&
              other.visible,
          )
          .forEach((other) => {
            const b = other.getBoundingRect();
            xs.push(b.left, b.left + b.width / 2, b.left + b.width);
            ys.push(b.top, b.top + b.height / 2, b.top + b.height);
          });
        for (const [axis, list, pos, size] of [
          ["x", xs, bounds.left, bounds.width],
          ["y", ys, bounds.top, bounds.height],
        ] as const) {
          let found = false;
          for (const anchor of [0, size / 2, size]) {
            const nearest = list.find(
              (v) => Math.abs(pos + anchor - v) < tolerance,
            );
            if (nearest !== undefined) {
              o.set(
                axis === "x" ? "left" : "top",
                o[axis === "x" ? "left" : "top"] + nearest - pos - anchor,
              );
              snapLines.current.push({ axis, position: nearest });
              found = true;
              break;
            }
          }
          if (found) o.setCoords();
        }
        if (latest.current.grid) {
          if (!snapLines.current.some((g) => g.axis === "x"))
            o.set("left", Math.round(o.left / 5) * 5);
          if (!snapLines.current.some((g) => g.axis === "y"))
            o.set("top", Math.round(o.top / 5) * 5);
        }
      }
      setHint(
        `${o.left.toFixed(1)} × ${o.top.toFixed(1)} mm · Alt bypasses snap`,
      );
      if (Date.now() - previewTime.current > 100) {
        previewTime.current = Date.now();
        latest.current.onPreview(serialize());
      }
    });
    c.on("object:scaling", () => {
      if (Date.now() - previewTime.current > 100) {
        previewTime.current = Date.now();
        latest.current.onPreview(serialize());
      }
    });
    c.on("object:rotating", () => {
      latest.current.onPreview(serialize());
    });
    c.on("mouse:up", () => {
      snapLines.current = [];
      setHint("");
      c.requestRenderAll();
    });
    c.on("after:render", guides);
    const obs = new ResizeObserver(fit);
    if (host.current) obs.observe(host.current);
    setReady(true);
    return () => {
      obs.disconnect();
      canvas.current = null;
      void c.dispose();
    };
  }, []);
  useEffect(() => {
    const c = canvas.current;
    if (!c || !ready) return;
    const raw = props.inside ? props.panel.insideObjects : props.panel.objects;
    const key = JSON.stringify(raw);
    c.selection = props.editable;
    objects().forEach(o => {const interactive=props.editable && !((o as any).locked && (o as any).name === "Imported background");o.selectable=interactive;o.evented=interactive;});
    if (key === lastJSON.current) {
      c.backgroundColor = props.inside
        ? props.panel.insideColor
        : props.panel.color;
      c.requestRenderAll();
      fit();
      return;
    }
    const gen = ++revision.current;
    syncing.current = true;
    Promise.all(raw.map(objectFromJSON))
      .then((items) => {
        if (gen !== revision.current || canvas.current !== c) return;
        c.discardActiveObject();
        c.clear();
        c.backgroundColor = props.inside
          ? props.panel.insideColor
          : props.panel.color;
        items.forEach((o) => {
          const interactive=props.editable && !((o as any).locked && (o as any).name === "Imported background");
          o.selectable = interactive;
          o.evented = interactive;
          c.add(o);
        });
        lastJSON.current = key;
        syncing.current = false;
        fit();
        const matches = items.filter((o) =>
          props.selected.includes((o as any).id),
        );
        if (matches.length)
          c.setActiveObject(
            matches.length === 1
              ? matches[0]
              : new ActiveSelection(matches, { canvas: c, ...decor }),
          );
        selection();
        c.requestRenderAll();
      })
      .catch(() => {
        syncing.current = false;
        setHint("An artwork item could not load. Replace it from Uploads.");
      });
  }, [props.panel, props.inside, props.editable, ready]);
  useEffect(() => {
    canvas.current?.requestRenderAll();
  }, [props.grid, props.snap, props.safe]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const c = canvas.current;
      if (
        !c ||
        !latest.current.editable ||
        !host.current
          ?.closest(".pk-workspace")
          ?.contains(document.activeElement)
      )
        return;
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      )
        return;
      const a = c.getActiveObject();
      if (a instanceof Textbox && a.isEditing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && ["a", "c", "v", "d", "g"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        void command(
          (
            {
              a: "selectAll",
              c: "copy",
              v: "paste",
              d: "duplicate",
              g: e.shiftKey ? "ungroup" : "group",
            } as any
          )[e.key.toLowerCase()],
        );
      } else if (["Delete", "Backspace"].includes(e.key)) {
        e.preventDefault();
        void command("delete");
      } else if (a && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const n = e.shiftKey ? 10 : 1;
        const dx=e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0;
        const dy=e.key==='ArrowDown'?n:e.key==='ArrowUp'?-n:0;
        const angle=(latest.current.viewRotation || 0)*Math.PI/180;
        const cos=Math.round(Math.cos(angle)),sin=Math.round(Math.sin(angle));
        a.set({left:a.left+cos*dx+sin*dy,top:a.top-sin*dx+cos*dy});
        a.setCoords();
        c.requestRenderAll();
        commit();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {if(ready)fit();},[props.viewRotation,ready]);
  const rulerGuide = (event:React.MouseEvent, horizontal:boolean) => {
    const c=canvas.current;if(!c)return;
    const point=c.getScenePoint(event.nativeEvent);
    const {axis}=artworkRuler(props.panel.width,props.panel.height,props.viewRotation || 0,horizontal);
    props.onGuide(axis,Math.max(0,Math.min(axis==='x'?props.panel.width:props.panel.height,point[axis])));
  };
  const rulerLabels=(horizontal:boolean)=>{
    const {length,reversed}=artworkRuler(props.panel.width,props.panel.height,props.viewRotation || 0,horizontal);
    return Array.from({length:Math.ceil(length/20)},(_,i)=><span key={i}>{reversed?Math.max(0,length-i*20):i*20}</span>);
  };
  return (
    <div
      className="pk-canvas-editor"
      ref={host}
      tabIndex={0}
      aria-label={`${props.panel.name} ${props.inside ? "inside" : "outside"} artwork editor`}
    >
      <div
        className="pk-ruler horizontal"
        onDoubleClick={e=>rulerGuide(e,true)}
      >
        {rulerLabels(true)}
      </div>
      <div
        className="pk-ruler vertical"
        onDoubleClick={e=>rulerGuide(e,false)}
      >
        {rulerLabels(false)}
      </div>
      <div className="pk-fabric">
        <canvas ref={element} />
      </div>
      <div className="pk-canvas-status">
        <span>
          {hint ||
            "Double-click text to edit · Shift to multi-select · Double-click a ruler to add a guide"}
        </span>
        <b>{zoom}%</b>
      </div>
    </div>
  );
});
export default CanvasEditor;
