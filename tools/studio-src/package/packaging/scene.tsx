"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { TAARenderPass } from "three/addons/postprocessing/TAARenderPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import {
  generatedNet,
  type FoldPiece,
  type StudioProject,
} from "../lib/packaging-document";
import { panelCanvas } from "./canvas";
import {creaseSpans,creaseRibbon,updateCreaseRibbon,creaseContacts,type CreaseContact} from "./creases";
import {panelShapes,panelBodyGeometry} from "./geometry";
import { foldAngle, cartonTuckSeating } from "../lib/packaging-motion";
export type SceneHandle = {
  exportImage: (transparent: boolean, format: "png" | "jpeg") => Promise<Blob>;
  camera: (preset: string) => void;
  reset: () => void;
  focusFace: (face:string) => void;
};

// Three's TAA hold buffer also needs resizing when the split preview changes size.
class PackagingRenderPass extends TAARenderPass {
  declare accumulateIndex:number;
  setSize(width:number,height:number){
    super.setSize(width,height);
    (this as any)._holdRenderTarget?.setSize(width,height);
    this.accumulateIndex=-1;
  }
}
function softboxPosition(light:THREE.DirectionalLight,base:THREE.Vector3,index:number,count:number) {
  const angle=index*2.399963229728653,radius=140*Math.sqrt((index+.5)/count);
  light.position.copy(base).add(new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius,0));
}
type MaterialMaps = { color: THREE.Texture; normal: THREE.Texture; roughness: THREE.Texture };
function loadMaterialMaps(id: string, repeatX: number, repeatY: number, onReady?:()=>void): MaterialMaps {
  const loader = new THREE.TextureLoader();
  const load = (map: string, color = false) => {
    const texture = loader.load(`/tools/studio-runtime/packaging/scenes/materials/${id}/${id}_1K-JPG_${map}.jpg`,()=>onReady?.());
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  return { color: load("Color", true), normal: load("NormalGL"), roughness: load("Roughness") };
}
const ScenePreview = forwardRef<
  SceneHandle,
  {
    project: StudioProject;
    unfold: number;
    inside: boolean;
    selected: string;
    onSelect: (face: string, inside?:boolean) => void;
    large?: boolean;
  }
>(function ScenePreview(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<any>(null),
    latest = useRef(props),
    [error, setError] = useState(""),
    [fps, setFps] = useState(0),
    [renderQuality,setRenderQuality] = useState<"interactive"|"high">("high"),
    [renderStatus,setRenderStatus] = useState(""),
    qualityRef=useRef(renderQuality);
  qualityRef.current=renderQuality;
  latest.current = props;
  const cameraPreset = (name: string) => {
    const a = api.current;
    if (!a) return;
    const radius = (a.radius || 300) * Math.max(1, .8 / a.camera.aspect);
    const positions: Record<string, number[]> = {
      hero: [1, 0.9, 1.2],
      front: [0, 0.25, 1.6],
      top: [0, 1.8, 0.001],
      left: [-1.6, 0.4, 0],
      right: [1.6, 0.4, 0],
    };
    const v = [...(positions[name] || positions.hero)];

    a.destination = new THREE.Vector3(
      ...(v.map((x) => x * radius) as [number, number, number]),
    );
  };
  useImperativeHandle(ref, () => ({
    camera: cameraPreset,
    focusFace(face) {
      const a=api.current;if(!a)return;
      a.focusRequest=face;
      a.destination=null;
    },
    reset() {
      const a=api.current;if(a){a.viewRotation.identity();a.viewTurn=null;a.focusRequest=null;}
      cameraPreset("hero");
    },
    async exportImage(transparent, format) {
      const a = api.current;
      if (!a) throw new Error("3D rendering is unavailable.");
      const { renderer, scene, camera } = a,
        size = new THREE.Vector2();
      renderer.getSize(size);
      const previous = scene.background,
        floor = a.floor.visible,
        pedestal = a.pedestal.visible,
        contact=a.contact.visible,pixelRatio=renderer.getPixelRatio(),lightPosition=a.key.position.clone();
      a.exporting=true;
      try {
      scene.background = transparent ? null : previous;
      a.floor.visible = !transparent && floor;
      a.contact.visible = !transparent && floor;
      a.pedestal.visible = !transparent && pedestal;
      renderer.setPixelRatio(1);
      renderer.setSize(3840, 2880, false);
      a.composer.setPixelRatio(1);a.composer.setSize(3840,2880);
      camera.aspect = 4 / 3;
      camera.updateProjectionMatrix();
      a.renderPass.enabled=qualityRef.current!=="high";a.refinedPass.enabled=!a.renderPass.enabled;
      a.refinedPass.accumulate=false;a.refinedPass.sampleLevel=3;
      if(transparent) renderer.render(scene,camera);
      else if(qualityRef.current==='high'){
        a.refinedPass.accumulate=true;a.refinedPass.accumulateIndex=-1;a.refinedPass.sampleLevel=1;
        for(let i=0;i<16;i++){softboxPosition(a.key,lightPosition,i,16);a.composer.render();}
      } else a.composer.render();
      a.refinedPass.sampleLevel=0;
      const blob = await new Promise<Blob>((resolve, reject) =>
        renderer.domElement.toBlob(
          (b: Blob | null) =>
            b ? resolve(b) : reject(new Error("Could not render scene.")),
          format === "png" ? "image/png" : "image/jpeg",
          0.96,
        ),
      );
      return blob;
      } finally {
      scene.background = previous;
      a.key.position.copy(lightPosition);
      a.floor.visible = floor;
      a.contact.visible = contact;
      a.pedestal.visible = pedestal;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size.x, size.y, false);
      a.composer.setPixelRatio(renderer.getPixelRatio());a.composer.setSize(size.x,size.y);
      camera.aspect = size.x / size.y;
      camera.updateProjectionMatrix();
      a.refinedPass.sampleLevel=0;a.exporting=false;
      }
    },
  }));
  useEffect(() => {
    const h = host.current;
    if (!h) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
    } catch {
      setError(
        "3D is unavailable on this device. Your dieline and artwork remain editable.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    h.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 5, 10000);
    camera.position.set(480, 440, 560);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 60;
    controls.maxDistance = 12000;
    controls.maxPolarAngle = Math.PI * 0.83;
    controls.enablePan = true;
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.45;
    room.dispose();
    const ambient = new THREE.HemisphereLight(0xffffff, 0x655646, 2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 12;
    key.shadow.blurSamples = 16;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 3000;
    key.shadow.camera.left = key.shadow.camera.bottom = -650;
    key.shadow.camera.right = key.shadow.camera.top = 650;
    key.shadow.normalBias = 0.12;
    key.shadow.bias = -0.0002;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe9f4ff, 0.3);
    fill.position.set(-350, 240, -300);
    scene.add(fill);
    const inspectionLight = new THREE.DirectionalLight(0xffffff,0);
    inspectionLight.position.set(0,-800,0);
    scene.add(inspectionLight);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshStandardMaterial({ color: "#dddcd5", roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const contactCanvas = document.createElement("canvas");
    contactCanvas.width = contactCanvas.height = 256;
    const contactContext = contactCanvas.getContext("2d")!;
    const gradient = contactContext.createRadialGradient(128,128,25,128,128,128);
    gradient.addColorStop(0,"rgba(28,23,17,.38)");
    gradient.addColorStop(.55,"rgba(28,23,17,.20)");
    gradient.addColorStop(1,"rgba(28,23,17,0)");
    contactContext.fillStyle=gradient; contactContext.fillRect(0,0,256,256);
    const contactTexture = new THREE.CanvasTexture(contactCanvas);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.8}));
    contact.rotation.x=-Math.PI/2; scene.add(contact);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(220, 240, 50, 64),
      new THREE.MeshStandardMaterial({ color: "#e2e2dc", roughness: 0.65 }),
    );
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    const container = new THREE.Group();
    // Dielines use a top-left origin. Convert their downward Y axis once;
    // otherwise every printed face is mirrored in world space.
    container.scale.y = -1;
    scene.add(container);
    const composer=new EffectComposer(renderer);
    const renderPass=new RenderPass(scene,camera);
    const refinedPass=new PackagingRenderPass(scene,camera);refinedPass.enabled=false;refinedPass.sampleLevel=0;
    const occlusion=new GTAOPass(scene,camera,512,512);
    occlusion.updateGtaoMaterial({radius:12,thickness:2,distanceExponent:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:false});
    occlusion.blendIntensity=.5;
    const outputPass=new OutputPass();
    composer.addPass(renderPass);composer.addPass(refinedPass);composer.addPass(occlusion);composer.addPass(outputPass);
    const a = {
      renderer, composer, occlusion, renderPass, refinedPass,exporting:false,
      detail:{value:0},qualityRevision:0,lastRenderSignature:"",lastQuality:"interactive",
      scene,
      camera,
      controls,
      key,
      ambient,
      floor,
      contact,
      pedestal,
      container,
      groups: new Map<string, THREE.Group>(),
      pieces: [] as FoldPiece[],
      creases:[] as {piece:FoldPiece;parent:FoldPiece;spans:[number,number][];contacts:CreaseContact;outer:THREE.Mesh;inner:THREE.Mesh}[],
      current: 0,
      inside: props.inside,
      autoFrame: false,
      target: 0,
      radius: 300,
      rootRotation: Math.PI / 2,
      viewRotation: new THREE.Quaternion(),
      viewTurn: null as {from:THREE.Quaternion;to:THREE.Quaternion;start:number}|null,
      focusRequest: null as string|null,
      destination: null as THREE.Vector3 | null,
      textureGeneration: 0,
      flatInspection: {value:0},
      artworkTextures: new Map<string, { signature: string; texture: THREE.Texture }>(),
      disposeTextures: [] as THREE.Texture[],
      backgroundTexture: null as THREE.Texture | null,
      renderStatus:"",
      paperMaps: null as MaterialMaps | null,
      surfaceMaps: null as MaterialMaps | null,
      lidMotion: null as any,
    };
    api.current = a;
    controls.addEventListener("start", () => { a.autoFrame = false; a.destination = null;a.viewTurn=null;a.focusRequest=null; });
    new RGBELoader().load(
      "/tools/studio-runtime/packaging/scenes/studio-small-09.bin",
      (hdr) => {
        if (api.current !== a) {
          hdr.dispose();
          return;
        }
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        const environment = pmrem.fromEquirectangular(hdr);
        scene.environment = environment.texture;
        a.qualityRevision++;
        a.disposeTextures.push(environment.texture);
        hdr.dispose();
      },
      undefined,
      () => {},
    );
    const ray = new THREE.Raycaster(),
      point = new THREE.Vector2();
    let down: [number, number] | null = null;
    const pd = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const pu = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
        return;
      const r = renderer.domElement.getBoundingClientRect();
      point.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(point, camera);
      const hit = ray
        .intersectObjects(container.children, true)
        .find((z) => z.object.userData.face);
      if (hit) latest.current.onSelect(hit.object.userData.face,!!hit.object.userData.inside);
    };
    renderer.domElement.addEventListener("pointerdown", pd);
    renderer.domElement.addEventListener("pointerup", pu);
    const resize = () => {
      const r = h.getBoundingClientRect();
      renderer.setSize(Math.max(100, r.width), Math.max(100, r.height));
      composer.setSize(Math.max(100,r.width),Math.max(100,r.height));
      camera.aspect = Math.max(0.1, r.width / Math.max(1, r.height));
      camera.updateProjectionMatrix();
      a.autoFrame = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(h);
    resize();
    let frame = 0,
      last = performance.now(),
      count = 0,
      lastMetric = last,
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if(a.exporting)return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = latest.current.unfold / 100;
      const busy=Math.abs(target-a.current)>.001?'true':'false';
      if(host.current?.getAttribute('aria-busy')!==busy)host.current?.setAttribute('aria-busy',busy);
      if (target !== a.target || a.inside !== latest.current.inside) a.autoFrame = true;
      a.inside = latest.current.inside;
      a.target = target;
      a.current = reduced
        ? a.target
        : THREE.MathUtils.damp(a.current, a.target, 9, dt);
      const inset=(piece:FoldPiece)=>-(piece.id.startsWith("tuck-wing")?1.7:piece.inset??(latest.current.project.imported?.profileId&&piece.id==="tuck"?-1.1:piece.face?0:1))*latest.current.project.thickness*(1-THREE.MathUtils.smoothstep(a.current,.75,1));
      for (const piece of a.pieces) {
        const g = a.groups.get(piece.id);
        if (!g || !piece.hinge) continue;
        // Offset only the thin flap surfaces, never their child hinges.
        g.children.forEach(mesh => {
          if (mesh instanceof THREE.Mesh && !mesh.userData.crease)
            mesh.position.z = inset(piece);
        });
        const h = piece.hinge;
        g.quaternion.setFromAxisAngle(
          new THREE.Vector3(h.b[0]-h.a[0], h.b[1]-h.a[1], 0).normalize(),
          THREE.MathUtils.degToRad(foldAngle(piece, latest.current.project.structure, a.current)),
        );
      }
      // Small receiving-wall allowances belong to the folded assembly only.
      for(const piece of a.pieces){
        const joint=a.groups.get(piece.id);
        if(joint?.userData.flatPosition){joint.position.copy(joint.userData.flatPosition);joint.position.y+=cartonTuckSeating(a,piece,latest.current.project.thickness,a.current);}
      }
      for(const crease of a.creases){
        const angle=THREE.MathUtils.degToRad(foldAngle(crease.piece,latest.current.project.structure,a.current));
        const radius=latest.current.project.thickness/2+.025;
        crease.outer.visible=crease.inner.visible=Math.abs(angle)>.0001;
        if(crease.outer.visible){
          updateCreaseRibbon(crease.outer.geometry,crease.piece,crease.spans,angle,radius,inset(crease.parent),inset(crease.piece),crease.contacts);
          updateCreaseRibbon(crease.inner.geometry,crease.piece,crease.spans,angle,-radius,inset(crease.parent),inset(crease.piece),crease.contacts);
        }
      }
      if (a.lidMotion) {
        const { root, flat, target } = a.lidMotion;
        const spread = THREE.MathUtils.smoothstep(a.current, .4, 1);
        const theta = Math.PI * (1 - THREE.MathUtils.smoothstep(a.current, .65, 1));
        const lifted = target.clone();
        lifted.z -= latest.current.project.height * 1.5 * Math.sin(Math.PI * a.current);
        root.rotation.x = theta;
        root.position.copy(
          flat
            .clone()
            .lerp(lifted, 1 - spread)
            .sub(
              flat.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), theta),
            ),
        );
      }
      // Keep the base on the work surface. Rotating the entire assembly halfway
      // through unfolding made the carton turn through itself and the floor.
      if(a.viewTurn) {
        const t=window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1,(now-a.viewTurn.start)/1800);
        a.viewRotation.slerpQuaternions(a.viewTurn.from,a.viewTurn.to,t*t*(3-2*t));
        if(t===1)a.viewTurn=null;
      }
      container.rotation.set(a.rootRotation,0,latest.current.project.scene.pose === "standing" ? Math.PI / 2 : 0);
      container.quaternion.premultiply(a.viewRotation);
      container.updateMatrixWorld(true);
      if(a.focusRequest) {
        let selectedMesh:THREE.Object3D|undefined;
        container.traverse(object=>{if(object.userData.face===a.focusRequest && !object.userData.inside)selectedMesh=object;});
        if(selectedMesh) {
          const normal=new THREE.Vector3(0,0,latest.current.inside?-1:1).transformDirection(selectedMesh.matrixWorld);
          const direction=camera.position.clone().sub(controls.target).normalize();
          const delta=new THREE.Quaternion().setFromUnitVectors(normal,direction);
          a.viewTurn={from:a.viewRotation.clone(),to:delta.multiply(a.viewRotation).normalize(),start:now};
        }
        a.focusRequest=null;
      }
      const box = new THREE.Box3().setFromObject(container),
        center = box.getCenter(new THREE.Vector3());
      if (Number.isFinite(center.x)) {
        const ground =
          latest.current.project.scene.stage === "pedestal" ? 50 : 0;
        container.position.y += ground - box.min.y + 0.5;
        container.position.x -= center.x; container.position.z -= center.z;
        contact.position.set(0,ground+.2,0);
        contact.scale.set((box.max.x-box.min.x)*1.35,(box.max.z-box.min.z)*1.5,1);
      }
      const outsideFlat = a.current > .9 && !latest.current.inside;
      if(a.flatInspection) a.flatInspection.value=outsideFlat ? THREE.MathUtils.smoothstep(a.current,.9,1) : 0;
      controls.maxPolarAngle = outsideFlat ? Math.PI - .01 : Math.PI * .83;
      inspectionLight.intensity = outsideFlat ? latest.current.project.scene.light * 1.8 : 0;
      floor.visible = !outsideFlat;
      contact.visible = !outsideFlat;
      pedestal.visible = !outsideFlat && latest.current.project.scene.stage === "pedestal";
      if (a.autoFrame) {
        const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const distance = radius / Math.sin(Math.atan(Math.tan(halfFov) * Math.min(1, camera.aspect))) * 1.08;
        const direction = camera.position.clone().sub(controls.target).normalize();
        if (!outsideFlat && direction.y < .15) direction.set(1,.9,1.2).normalize();
        if (outsideFlat) direction.lerp(new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(1,0,0),a.rootRotation).normalize(),THREE.MathUtils.smoothstep(a.current,.9,1)).normalize();
        a.destination = controls.target.clone().addScaledVector(direction, distance);
        if (Math.abs(a.current - a.target) < .001) a.autoFrame = false;
      }
      controls.target.lerp(
        new THREE.Vector3(0, Math.max(20, (box.max.y + box.min.y) / 2), 0),
        0.06,
      );
      if (a.destination) {
        camera.position.lerp(a.destination, 0.08);
        if (camera.position.distanceTo(a.destination) < 0.5)
          a.destination = null;
      }
      controls.update();
      occlusion.enabled = !outsideFlat;
      const high=qualityRef.current==='high';
      if(a.lastQuality!==qualityRef.current){
        a.lastQuality=qualityRef.current;a.detail.value=high?1:0;a.qualityRevision++;
        container.traverse(object=>{if(object instanceof THREE.Mesh){const material=object.material as THREE.MeshStandardMaterial;if(material.normalMap)material.normalScale.setScalar(high?(latest.current.project.material==="kraft"?.3:.16):.12);}});
        const shadowSize=Math.min(high?4096:2048,renderer.capabilities.maxTextureSize);
        key.shadow.mapSize.set(shadowSize,shadowSize);key.shadow.map?.dispose();key.shadow.map=null;key.shadow.mapPass?.dispose();key.shadow.mapPass=null;key.shadow.needsUpdate=true;
        key.shadow.blurSamples=high?32:16;
        occlusion.updateGtaoMaterial({samples:high?16:8});
      }
      const signature=[...camera.position.toArray(),...camera.quaternion.toArray(),...container.quaternion.toArray(),a.current,a.qualityRevision,camera.aspect].map(v=>Number(v).toFixed(5)).join(',');
      const moving=signature!==a.lastRenderSignature || !!a.destination || !!a.viewTurn || Math.abs(a.current-a.target)>.0001;
      a.lastRenderSignature=signature;
      renderPass.enabled=!high;refinedPass.enabled=high;
      refinedPass.accumulate=high&&!moving;refinedPass.sampleLevel=0;
      const lightPosition=key.position.clone();
      if(high&&!moving&&refinedPass.accumulateIndex<32)softboxPosition(key,lightPosition,Math.max(0,refinedPass.accumulateIndex),32);
      composer.render();
      key.position.copy(lightPosition);
      const state=high?(moving?'High render · moving':refinedPass.accumulateIndex<32?'High render · refining…':'High render · ready'):'';
      if(state!==a.renderStatus){a.renderStatus=state;setRenderStatus(state);}
      count++;
      if (now - lastMetric > 2000) {
        const rate = Math.round((count * 1000) / (now - lastMetric));
        setFps(rate);
        // Keep still previews crisp; reduce resolution only during active movement.
        const moving = Math.abs(a.current - a.target) > .002 || !!a.destination;
        const quality = moving && rate < 30 ? 1 : Math.min(Math.max(window.devicePixelRatio, 1.5), 2);
        if (renderer.getPixelRatio() !== quality) {renderer.setPixelRatio(quality);composer.setPixelRatio(quality);}
        count = 0;
        lastMetric = now;
      }
    };
    frame = requestAnimationFrame(animate);
    const lost = (e: Event) => {
      e.preventDefault();
      setError("3D rendering paused. Reopen the studio to restore the scene.");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      api.current = null;
      container.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      a.disposeTextures.forEach((t) => t.dispose());
      a.artworkTextures.forEach(({ texture }) => texture.dispose());
      [a.paperMaps, a.surfaceMaps].forEach(maps => maps && Object.values(maps).forEach(t => t.dispose()));
      a.backgroundTexture?.dispose();
      env.texture.dispose();
      pmrem.dispose();
      contact.geometry.dispose(); contact.material.dispose(); contactTexture.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      pedestal.geometry.dispose();
      (pedestal.material as THREE.Material).dispose();
      composer.dispose();occlusion.dispose();outputPass.dispose();renderPass.dispose();refinedPass.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const p = props.project,
      n = generatedNet(p);
    a.creases=[];
    a.qualityRevision++;
    a.container.children.slice().forEach((g: THREE.Object3D) => {
      a.container.remove(g);
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
    });
    if (a.paperMaps) Object.values(a.paperMaps as MaterialMaps).forEach(t => t.dispose());
    a.paperMaps = loadMaterialMaps(p.material === "kraft" ? "Paper006" : "Paper001", 2, 2,()=>a.qualityRevision++);
    a.groups.clear();
    a.pieces = n.pieces;
    a.rootRotation = p.structure === "carton" || n.rootPlane === "front" ? 0 : Math.PI / 2;
    const roots = new Map<string, THREE.Group>();
    const components = [...new Set(n.pieces.map((q) => q.component))];
    for (const comp of components) {
      const root = new THREE.Group();
      roots.set(comp, root);
      a.container.add(root);
    }
    for (const q of n.pieces) {
      const pivot = q.hinge?.a || [q.x + q.w / 2, q.y + q.h / 2],
        parent = n.pieces.find((v) => v.id === q.parent),
        parentPivot =
          parent?.hinge?.a ||
          (parent
            ? [parent.x + parent.w / 2, parent.y + parent.h / 2]
            : [n.width / 2, n.height / 2]);
      const joint = new THREE.Group();
      joint.position.set(
        pivot[0] - parentPivot[0],
        pivot[1] - parentPivot[1],
        0,
      );
      joint.userData.flatPosition=joint.position.clone();
      a.groups.set(q.id, joint);
      (q.parent
        ? a.groups.get(q.parent) || roots.get(q.component)
        : roots.get(q.component))!.add(joint);
      const shape = panelShapes(q),
        bodyGeo = panelBodyGeometry(q,p.thickness,p.structure==='custom');
      bodyGeo.translate(q.x - pivot[0], q.y - pivot[1], -p.thickness / 2);
      const paper = new THREE.MeshStandardMaterial({
        fog: false,
        color: p.material === "kraft" ? "#b68e60" : "#d0b592",
        roughness: 0.92,
      });
      const body = new THREE.Mesh(bodyGeo, paper);
      body.castShadow = true;
      body.receiveShadow = false;
      joint.add(body);
      const planeGeo = new THREE.ShapeGeometry(shape),
        uv = planeGeo.attributes.uv,
        pos = planeGeo.attributes.position;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, pos.getX(i) / q.w, 1 - pos.getY(i) / q.h);
      planeGeo.translate(
        q.x - pivot[0],
        q.y - pivot[1],
        p.thickness / 2 + 0.025,
      );
      const panel = q.face ? p.panels[q.face] : null;
      const material = new THREE.MeshPhysicalMaterial({
        fog: false,
        color: panel?.color || (p.material === "kraft" ? "#b78b56" : "#f4f1e9"),
        roughness: p.finish === "glossy" ? 0.24 : p.material === "kraft" ? 0.94 : 0.86,
        metalness: 0,
        clearcoat: p.finish === "glossy" ? 0.8 : 0,
        clearcoatRoughness: 0.12,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        normalMap: a.paperMaps.normal,
        normalScale: new THREE.Vector2(0.12, 0.12),
        roughnessMap: a.paperMaps.roughness,
      });
      material.onBeforeCompile = (shader) => {
        shader.uniforms.paperAlbedo = { value: a.paperMaps.color };
        shader.uniforms.renderDetail=a.detail;
        shader.uniforms.paperMean={value:p.material==="kraft"?.32:.65};
        shader.uniforms.paperPhysicalSize={value:new THREE.Vector2(q.w/160,q.h/160)};
        shader.uniforms.flatInspection = a.flatInspection || (a.flatInspection={value:0});
        shader.fragmentShader = 'uniform sampler2D paperAlbedo; uniform float flatInspection; uniform float renderDetail; uniform float paperMean; uniform vec2 paperPhysicalSize;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          #include <map_fragment>
          #ifdef USE_MAP
            float paperGrain = dot(texture2D(paperAlbedo, vMapUv * paperPhysicalSize).rgb, vec3(.2126, .7152, .0722));
            diffuseColor.rgb *= mix(mix(.94,1.04,paperGrain),clamp(paperGrain/paperMean,.65,1.32),renderDetail*.38);
          #endif
        `);
        // The fully opened dieline is an artwork inspection view: remove the
        // grazing-angle environment reflection that obscures fine black print.
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, diffuseColor.rgb, flatInspection);\n#include <opaque_fragment>');
      };
      material.customProgramCacheKey = () => 'studio-paper-grain-render-quality-v4';
      const face = new THREE.Mesh(planeGeo, material);
      face.userData.face = q.face;
      face.userData.panelId = q.id;
      face.receiveShadow = true;
      face.castShadow = false;
      joint.add(face);
      const innerGeo = planeGeo.clone();
      innerGeo.translate(0, 0, -p.thickness - 0.05);
      const inner = new THREE.Mesh(
        innerGeo,
        new THREE.MeshStandardMaterial({
          fog: false,
          color: panel?.insideColor || (p.material === "kraft" ? "#b78b56" : "#e5d6be"),
          roughness: 0.95,
          normalMap: a.paperMaps.normal,
          normalScale: new THREE.Vector2(0.18, 0.18),
          roughnessMap: a.paperMaps.roughness,
          side: THREE.BackSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      inner.receiveShadow = true;
      inner.userData.face = q.face;
      inner.userData.inside = true;
      joint.add(inner);
      const parentPiece=n.pieces.find(piece=>piece.id===q.parent),parentGroup=q.parent?a.groups.get(q.parent):null;
      if(parentPiece&&parentGroup&&q.hinge){
        const spans=creaseSpans(parentPiece,q,Math.min(1.25,p.thickness+.05));
        if(spans.length){
          const outerMaterial=material.clone();outerMaterial.side=THREE.DoubleSide;outerMaterial.onBeforeCompile=material.onBeforeCompile;outerMaterial.customProgramCacheKey=material.customProgramCacheKey;
          const innerMaterial=(inner.material as THREE.MeshStandardMaterial).clone();innerMaterial.side=THREE.DoubleSide;
          const outer=new THREE.Mesh(creaseRibbon(spans),outerMaterial),inside=new THREE.Mesh(creaseRibbon(spans),innerMaterial);
          for(const mesh of[outer,inside]){mesh.position.copy(joint.position);mesh.userData={face:q.face,panelId:q.id,crease:true,inside:mesh===inside};mesh.receiveShadow=true;mesh.castShadow=true;parentGroup.add(mesh);}
          a.creases.push({piece:q,parent:parentPiece,spans,contacts:creaseContacts(parentPiece,q,spans),outer,inner:inside});
        }
      }
    }
    a.lidMotion = null;
    // Independent lid closes above the base; the flat layout still uses both original components.
    if (p.structure === "lid-base") {
      const lid = roots.get("lid")!;
      const l = n.pieces.find((q) => q.component === "lid" && !q.parent)!;
      const b = n.pieces.find((q) => q.component === "base" && !q.parent)!;
      a.lidMotion = {
        root: lid,
        flat: new THREE.Vector3(
          l.x + l.w / 2 - n.width / 2,
          l.y + l.h / 2 - n.height / 2,
          0,
        ),
        target: new THREE.Vector3(
          b.x + b.w / 2 - n.width / 2,
          b.y + b.h / 2 - n.height / 2,
          -p.height,
        ),
      };
    }
    a.radius = Math.max(p.width, p.depth, p.height, n.width * 0.38) * 1.4;
    cameraPreset("hero");
    a.autoFrame = true;
  }, [
    props.project.structure,
    props.project.width,
    props.project.depth,
    props.project.height,
    props.project.thickness,
    props.project.material,
    props.project.finish,
    props.project.imported,
  ]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const generation = ++a.textureGeneration;
    const activeKeys = new Set<string>();
    const apply = (panelId: string, inside: boolean, texture: THREE.Texture) => {
      a.container.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh && o.userData.face === panelId &&
            Boolean(o.userData.inside) === inside) {
          const material = o.material as THREE.MeshStandardMaterial;
          material.map = texture;
          material.color.set("#ffffff");
          material.needsUpdate = true;
          a.qualityRevision++;
        }
      });
    };
    // Keep the existing face visible until its replacement is ready. Unchanged
    // panels reuse their GPU texture, including after a geometry-only rebuild.
    const updates = Object.values(props.project.panels).flatMap((panel) =>
      [false, true].map(async (inside) => {
        const key = `${panel.id}:${inside ? "inside" : "outside"}`;
        activeKeys.add(key);
        const signature = JSON.stringify([
          panel.width, panel.height,
          inside ? panel.insideColor : panel.color,
          inside ? panel.insideObjects : panel.objects,
        ]);
        const cached = a.artworkTextures.get(key);
        if (cached?.signature === signature) {
          apply(panel.id, inside, cached.texture);
          return;
        }
        const art = await panelCanvas(panel, inside,
          Math.min(6, 1800 / Math.max(panel.width, panel.height)));
        try {
          if (generation !== a.textureGeneration || api.current !== a) return;
          const pixels = document.createElement("canvas");
          pixels.width = art.canvas.width;
          pixels.height = art.canvas.height;
          pixels.getContext("2d")!.drawImage(art.canvas, 0, 0);
          const texture = new THREE.CanvasTexture(pixels);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = a.renderer.capabilities.getMaxAnisotropy();
          apply(panel.id, inside, texture);
          a.artworkTextures.set(key, { signature, texture });
          cached?.texture.dispose();
        } finally {
          await art.dispose();
        }
      }),
    );
    for (const [key, cached] of a.artworkTextures) {
      if (!activeKeys.has(key)) {
        cached.texture.dispose();
        a.artworkTextures.delete(key);
      }
    }
    Promise.all(updates).catch(() => {
      if (generation === a.textureGeneration && api.current === a)
        setError("Some artwork could not load in 3D. Replace the missing item from Uploads.");
    });
  }, [props.project.panels, props.project.structure, props.project.width,
      props.project.depth, props.project.height, props.project.thickness, props.project.material, props.project.finish,
      props.project.imported]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const s = props.project.scene;
    a.qualityRevision++;
    a.scene.background = new THREE.Color(s.background);
    a.scene.fog = new THREE.Fog(s.background, 1800, 6500);
    if (a.surfaceMaps) Object.values(a.surfaceMaps as MaterialMaps).forEach(t => t.dispose());
    a.surfaceMaps = s.surface === "wood"
      ? loadMaterialMaps("Wood095", 10000 / 650, 10000 / 325,()=>a.qualityRevision++)
      : s.surface === "stone"
        ? loadMaterialMaps("Marble012", 10000 / 700, 10000 / 700,()=>a.qualityRevision++)
        : s.surface === "concrete" ? loadMaterialMaps("Concrete034", 10000 / 900, 10000 / 450,()=>a.qualityRevision++)
        : null;
    const floorMaterial = a.floor.material as THREE.MeshStandardMaterial;
    floorMaterial.map = a.surfaceMaps?.color || null;
    floorMaterial.normalMap = a.surfaceMaps?.normal || null;
    floorMaterial.normalScale.set(s.surface === "stone" ? .12 : .45, s.surface === "stone" ? .12 : .45);
    floorMaterial.roughness = s.surface === "stone" ? .38 : s.surface === "wood" ? .68 : .92;
    if(a.surfaceMaps) Object.values(a.surfaceMaps as MaterialMaps).forEach(t => t.anisotropy = a.renderer.capabilities.getMaxAnisotropy());
    floorMaterial.roughnessMap = a.surfaceMaps?.roughness || null;
    floorMaterial.color.set(s.surface === "wood" && s.preset === "walnut-table" ? "#86604a" : a.surfaceMaps ? "#ffffff" : s.background);
    const pedestalMaterial = a.pedestal.material as THREE.MeshStandardMaterial;
    pedestalMaterial.map = a.surfaceMaps?.color || null;
    pedestalMaterial.normalMap = a.surfaceMaps?.normal || null;
    pedestalMaterial.roughnessMap = a.surfaceMaps?.roughness || null;
    pedestalMaterial.color.set(s.preset === "gallery-plinth" ? "#5b6064" : "#ededeb");
    pedestalMaterial.needsUpdate = true;
    floorMaterial.envMapIntensity = .4;
    floorMaterial.onBeforeCompile = shader => {
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=max(roughnessFactor,.55);');
    };
    floorMaterial.customProgramCacheKey=()=>"studio-honed-surface-v1";
    floorMaterial.needsUpdate = true;
    a.pedestal.visible = s.stage === "pedestal";
    a.pedestal.position.y = 25;
    a.pedestal.scale.set(
      props.project.width / 285,
      1,
      props.project.width / 285,
    );
    const angle = (s.direction * Math.PI) / 180;
    a.key.position.set(Math.cos(angle) * 650, 650, Math.sin(angle) * 650);
    a.key.intensity = s.light * 3.1;
    a.ambient.intensity = s.light * 0.32;
    a.backgroundTexture?.dispose();
    a.backgroundTexture = null;
    if (s.backgroundImage)
      new THREE.TextureLoader().load(s.backgroundImage, (t) => {
        if (api.current !== a) return;
        t.colorSpace = THREE.SRGBColorSpace;
        a.backgroundTexture = t;
        a.scene.background = t;
        a.qualityRevision++;
      });
  }, [props.project.scene]);
  return (
    <div
      className={`pk-scene ${props.large ? "large" : ""}`}
      ref={host}
      aria-label="Interactive realistic packaging mockup"
    >
      {error && <div className="pk-scene-error">{error}</div>}
      <div className="pk-scene-caption">
        <span>
          {error
            ? "2D artwork available"
            : "Drag to orbit · scroll to zoom · click a face"}
        </span>
        <label className="pk-render-quality"><span className="pk-render-status" role="status">{renderQuality==='high'?renderStatus:fps>0?`${fps} fps`:''}</span><select aria-label="3D render quality" value={renderQuality} onChange={e=>setRenderQuality(e.target.value as 'interactive'|'high')}><option value="interactive">Interactive</option><option value="high">High render</option></select></label>
      </div>
    </div>
  );
});
export default ScenePreview;
