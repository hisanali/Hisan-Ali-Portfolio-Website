import { bindHold, guardGameGestures } from './touch.js?v=9';
guardGameGestures();
import * as T from '../evermile/vendor/three.module.js';
import { GLTFLoader } from '../evermile/vendor/loaders/GLTFLoader.js';
import { EffectComposer } from '../evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../evermile/vendor/postprocessing/RenderPass.js';
import { OutputPass } from '../evermile/vendor/postprocessing/OutputPass.js';
import { clone as cloneSkinned } from '../evermile/vendor/utils/SkeletonUtils.js';
import { MeshoptDecoder } from '../penalty/vendor/meshopt_decoder.module.js';
import { HDRLoader } from '../penalty/vendor/three-addons/loaders/HDRLoader.js';
import { naturalGrade, matchOptics, goalCords } from './quality.js?v=10';
import { buildStadium } from '../penalty/stadium.js?v=9';
import { FootContacts, solveLimb, reachBall } from '../penalty/motion.js?v=9';
import { advance, launchVelocity, groundContact, sweepSphereSegment, reflectContact } from '../penalty/physics.js?v=9';
import { createMatchBall } from './ball.js?v=9';
import { installPresentation } from './presentation.js?v=10';
import { fittedGloves } from '../penalty/equipment.js?v=9';

/* ---------- Pitch geometry (metres). Your team attacks towards +z. ---------- */
const LEN = 70, WID = 46, HX = WID / 2, CZ = LEN / 2, GOAL_HW = 3, GOAL_H = 2.2, BOX_D = 11, BOX_HW = 11, R = .11, G = 9.81;
const $ = id => document.getElementById(id);
const settings = { kit: 'red', level: 'normal', length: '4', sound: true, size: '5' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('football-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('football-settings', JSON.stringify(settings)); } catch {} };
const KITS = { red: ['#c8102e', '#b7192b', 'Red Falcons'], white: ['#f2f2e4', '#172746', 'Muscat Whites'], blue: ['#1d4fb8', '#f2f2f2', 'Blue Waves'], green: ['#0f7a3e', '#1b1b1b', 'Green Oasis'] };
const LEVELS = { easy: { speed: .9, tackle: .45, save: .45, think: .55, accuracy: .55 }, normal: { speed: 1, tackle: .75, save: .62, think: .38, accuracy: .75 }, hard: { speed: 1.08, tackle: 1.05, save: .78, think: .24, accuracy: .9 } };
const level = () => LEVELS[settings.level] || LEVELS.normal;

/* ---------- Renderer ---------- */
const canvas = $('scene');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });renderer.info.autoReset=false;
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.15 : 1.5)); renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
const scene = new T.Scene(); scene.background = new T.Color('#9fb4c2'); scene.fog = new T.Fog('#9fb4c2', 120, 320);
const camera = new T.PerspectiveCamera(40, 1, .5, 600); camera.layers.enable(2);
const composer = new EffectComposer(renderer, new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: mobile ? 0 : 4 }));
composer.addPass(new RenderPass(scene,camera));const optics=matchOptics(scene,camera,mobile);composer.addPass(optics.ao);composer.addPass(optics.lens.pass);composer.addPass(new OutputPass());const grade=naturalGrade();composer.addPass(grade);

const environmentReady = new HDRLoader().loadAsync('./assets/stadium-light.bin?v=9').then(hdr => {
  hdr.mapping = T.EquirectangularReflectionMapping; const pm = new T.PMREMGenerator(renderer);
  scene.environment = pm.fromEquirectangular(hdr).texture; scene.environmentIntensity = .42; scene.environmentRotation.y = .8; hdr.dispose(); pm.dispose();
}).catch(() => scene.add(new T.HemisphereLight('#c7d9e8', '#52603d', .8)));
scene.add(new T.HemisphereLight('#d5e2eb', '#566044', .25));
const sun = new T.DirectionalLight('#fff3dd', 3.3); sun.position.set(-30, 45, CZ + 20); sun.target.position.set(0, 0, CZ); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 50, bottom: -50, near: 1, far: 160 }); sun.shadow.mapSize.set(mobile ? 2048 : 4096, mobile ? 2048 : 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .012;sun.shadow.radius=2;
scene.add(sun, sun.target);

/* ---------- Textures ---------- */
const jobs = [];
function asset(name, srgb = true, repeat = null, gltfUV = false) {
  let ok, bad; jobs.push(new Promise((a, b) => { ok = a; bad = b; }));
  const t = new T.TextureLoader().load(`${['pitch-color','pitch-normal','pitch-roughness','concrete-normal','player-detail','player-normal','hair-color'].includes(name)?'./assets/':'../penalty/assets/'}${name}.webp?v=9`, ok, undefined, bad);
  if (srgb) t.colorSpace = T.SRGBColorSpace; t.flipY = !gltfUV; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...repeat); } return t;
}
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };

/* ---------- Pitch, markings and goals ---------- */
{
  const grass = new T.MeshStandardMaterial({ map: asset('pitch-color', true, [45, 55]), normalMap: asset('pitch-normal', false, [45, 55]), roughnessMap: asset('pitch-roughness', false, [45, 55]), normalScale:new T.Vector2(.28,.28), roughness: 1, color: '#83bc52' });
  grass.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vTurf;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTurf=(modelMatrix*vec4(transformed,1.0)).xz;');
    shader.fragmentShader='varying vec2 vTurf;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.88,1.,roughnessFactor);');shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec3 source=diffuseColor.rgb;float detail=dot(source,vec3(.25,.65,.1));
      vec3 turf=mix(source,vec3(detail*.42,detail*1.25,detail*.17),.45);
      float bands=step(.5,fract(vTurf.y/14.));
      float wear=exp(-dot(vTurf-vec2(0.,8.),vTurf-vec2(0.,8.))/1.3)+exp(-dot(vTurf-vec2(0.,62.),vTurf-vec2(0.,62.))/1.3);
      diffuseColor.rgb=turf*1.05*(1.-bands*.11);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(detail*.9,detail*.8,detail*.44),wear*.16);`);
  };
  const pitch = new T.Mesh(new T.PlaneGeometry(90, 110), grass); pitch.rotation.x = -Math.PI / 2; pitch.position.z = CZ; pitch.receiveShadow = true; scene.add(pitch);
  const PX = 24, lines = canvasTex((WID + 2) * PX, (LEN + 2) * PX, g => {
    const X = x => (x + HX + 1) * PX, Z = z => (z + 1) * PX; g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = .12 * PX;
    g.strokeRect(X(-HX), Z(0), WID * PX, LEN * PX); g.beginPath(); g.moveTo(X(-HX), Z(CZ)); g.lineTo(X(HX), Z(CZ)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(CZ), 7 * PX, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(X(0), Z(CZ), .18 * PX, 0, Math.PI * 2); g.fill();
    for (const [z0, dir] of [[0, 1], [LEN, -1]]) {
      g.strokeRect(X(-BOX_HW), Math.min(Z(z0), Z(z0 + dir * BOX_D)), BOX_HW * 2 * PX, BOX_D * PX);
      g.strokeRect(X(-6), Math.min(Z(z0), Z(z0 + dir * 4.5)), 12 * PX, 4.5 * PX);
      g.beginPath(); g.arc(X(0), Z(z0 + dir * 8), .15 * PX, 0, Math.PI * 2); g.fill();
      g.beginPath();g.arc(X(0),Z(z0+dir*8),6*PX,dir>0?Math.PI/6:7*Math.PI/6,dir>0?5*Math.PI/6:11*Math.PI/6);g.stroke();
    }
  });
  const mark = new T.Mesh(new T.PlaneGeometry(WID + 2, LEN + 2), new T.MeshStandardMaterial({ map: lines, transparent: true, depthWrite: false, roughness: .9 }));
  mark.rotation.x = -Math.PI / 2; mark.position.set(0, .006, CZ); mark.receiveShadow = true; scene.add(mark);
  const white = new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: .25, clearcoat: 1 });
  for (const [z, dir] of [[0, -1], [LEN, 1]]) {
    for (const x of [-GOAL_HW - .06, GOAL_HW + .06]) { const p = new T.Mesh(new T.CylinderGeometry(.06, .06, GOAL_H + .06, 16), white); p.position.set(x, (GOAL_H + .06) / 2, z); p.castShadow = true; scene.add(p); }
    const bar = new T.Mesh(new T.CylinderGeometry(.06, .06, GOAL_HW * 2 + .24, 16), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, GOAL_H + .06, z); bar.castShadow = true; scene.add(bar);
    const pts = [], D = 1.6, step = .2;
    for (let x = -GOAL_HW; x <= GOAL_HW + .01; x += step) { pts.push(x, GOAL_H, z, x, GOAL_H * .85, z + dir * D, x, GOAL_H * .85, z + dir * D, x, 0, z + dir * D); }
    for (let y = 0; y <= GOAL_H * .85 + .01; y += step) pts.push(-GOAL_HW, y, z + dir * D, GOAL_HW, y, z + dir * D);
    for (let k = 0; k <= D + .01; k += step) { const y = GOAL_H - (GOAL_H * .15) * (k / D); pts.push(-GOAL_HW, y, z + dir * k, GOAL_HW, y, z + dir * k); for (const x of [-GOAL_HW, GOAL_HW]) pts.push(x, 0, z + dir * k, x, y, z + dir * k); }
    for (const x of [-GOAL_HW, GOAL_HW]) for (let y = 0; y <= GOAL_H; y += step) pts.push(x, y, z, x, y * .85, z + dir * D);
    goalCords(scene,pts);
  }
}
const stadium = buildStadium(scene, asset('crowd-fans'), { concrete: asset('concrete-color', true, [48, 1]), normal: asset('concrete-normal', false, [48, 1]) });

/* ---------- Ball ---------- */
const ball=createMatchBall(R,canvasTex);ball.scale.setScalar(1.45);scene.add(ball); // drawn larger so it reads clearly from the broadcast camera
const ballShadow=new T.Mesh(new T.CircleGeometry(.3,24),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.42,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballShadow.renderOrder=3;scene.add(ballShadow);
const B = { p: ball.position, v: new T.Vector3(), owner: null, lastTouch: null, kicker: null, kickTime: 0, shot: null, spin:new T.Vector3() };

/* ---------- Footballers ---------- */
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let athlete;
const maps = { color: asset('player-detail', true, null, true), normal: asset('player-normal', false, null, true), hair: asset('hair-color', true, null, true), hairNormal: asset('hair-normal', false, null, true) };
const modelsReady = loader.loadAsync('./assets/athlete-match.glb?v=9', e => { if (e.total) $('load-progress').textContent = `${Math.round(e.loaded / e.total * 100)}%`; }).then(a => { athlete = a; });

const shadowTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const preparedClips=new Map();
function prepareClip(src){if(preparedClips.has(src.name))return preparedClips.get(src.name);
 const clip = src.clone();
      for (const t of clip.tracks) if (t.name === 'Hips.position') for (let i = 0; i < t.values.length; i += 3) { t.values[i] = t.values[0]; t.values[i + 1] = t.values[1]; }
      if(clip.name.startsWith('turn')){for(const track of clip.tracks)if(track.name==='Hips.quaternion'){const base=new T.Quaternion().fromArray(track.values,0),inverse=base.clone().invert();for(let i=0;i<track.values.length;i+=4){const q=new T.Quaternion().fromArray(track.values,i),delta=q.clone().multiply(inverse),twist=new T.Quaternion(0,0,delta.z,delta.w).normalize();q.premultiply(twist.invert()).toArray(track.values,i);}}}
 preparedClips.set(src.name,clip);return clip;
}
class Player {
  constructor(team, index, keeper, shirt, shorts) {
    this.team = team; this.index = index; this.surfaces=[]; this.stats = { pace: .9 + (index * 7 % 11) / 55, passing: .72 + (index * 3 % 7) / 28, shooting: .7 + (index * 5 % 7) / 26, defending: .7 + (index * 2 % 7) / 24 }; this.number = keeper ? 1 : index + 6; this.cards = 0; this.keeper = keeper; this.pos = new T.Vector3(); this.vel = new T.Vector3(); this.facing = 0; this.target = new T.Vector3(); this.busy = 0; this.stun = 0;
    const model = cloneSkinned(athlete.scene); this.root = new T.Group(); this.root.add(model); model.scale.setScalar(keeper ? 1.09 : [1.01, 1.045, 1.075, 1.03][index % 4]); this.model = model;
    model.traverse(o => {
      if (!o.isMesh) return; o.userData.matchLOD=o.name.endsWith('__LOD')?'low':o.name.endsWith('__MID')?'mid':'high';o.visible=o.userData.matchLOD==='mid'; o.castShadow = true; o.receiveShadow = !mobile; o.frustumCulled = false;
      const n = o.name.toLowerCase();
      if(n.includes('hair')||n.includes('body')){const key=o.name+index%4;if(!variants.has(key)){const geo=o.geometry.clone(),a=geo.attributes.position,skin=geo.attributes.skinIndex,weights=geo.attributes.skinWeight;geo.computeBoundingBox();const box=geo.boundingBox,cy=(box.max.y+box.min.y)/2,cx=(box.max.x+box.min.x)/2;for(let i=0;i<a.count;i++){let w=n.includes('hair')?1:0;if(n.includes('body')&&skin)for(let k=0;k<4;k++){const bone=o.skeleton.bones[skin.getComponent(i,k)];if(bone?.name==='Head')w+=weights.getComponent(i,k);}if(w>.01){a.setX(i,a.getX(i)+(a.getX(i)-cx)*[-.035,.035,0,.018][index%4]*w);if(n.includes('hair'))a.setY(i,cy+(a.getY(i)-cy)*[1,.82,1.1,.92][index%4]);}}a.needsUpdate=true;variants.set(key,geo);}o.geometry=variants.get(key);}
      const m = new T.MeshPhysicalMaterial({ map: maps.color, normalMap: maps.normal, normalScale:new T.Vector2(.65,.65), roughness: .67, envMapIntensity: .7, specularIntensity:.45 });
      if (n.includes('body')) m.color.set(['#ffffff', '#d6b59b', '#a17859', '#e8c9ac'][index % 4]);
      if (n.includes('shirt')) { m.map = numberedKit(this.number); m.color.set(shirt); m.roughness = .86;m.sheen=.65;m.sheenRoughness=.9;m.sheenColor.set(shirt); } if (n.includes('shorts')) { m.color.set(shorts); m.roughness = .88; }
      if (n.includes('socks')) { m.color.set(keeper?shirt:'#f2f3ed'); m.roughness = .95; } if (n.includes('shoes')) m.color.set(['#e8e8dd','#e4988a','#d5eea4','#a5c4df'][index%4]);
      if (n.includes('hair') || n.includes('eyelashes')) { m.map = maps.hair; m.normalMap = maps.hairNormal; m.color.set(['#211811','#5b3c23','#121314','#34271c'][index%4]); m.alphaTest = .32; m.side = T.DoubleSide; }
      o.material = m;this.surfaces.push(o);
    });
    if (keeper) fittedGloves(model, '#f4f4f4','Ch38_Body__MID');
    this.bones = {}; model.traverse(o => { if (o.isBone) this.bones[o.name] = o; });
    this.mixer = new T.AnimationMixer(model); this.clips = {};
    for (const src of athlete.animations) {
      const clip=prepareClip(src);
      const a = this.mixer.clipAction(clip); if (!['idle', 'jog', 'sprint', 'dribble-jog', 'backpedal', 'strafe-left', 'strafe-right', 'turn90', 'turn180', 'ready'].includes(clip.name)) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; } this.clips[clip.name] = a;
    }
    this.shadow = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); this.shadow.layers.set(2);this.shadow.rotation.x = -Math.PI / 2; scene.add(this.shadow);
    this.ring = new T.Mesh(new T.RingGeometry(.55, .68, 40), new T.MeshBasicMaterial({ color: '#dfff63', transparent: true, opacity: .9, depthWrite: false, toneMapped: false })); this.ring.layers.set(2);this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; scene.add(this.ring);
    this.pin = new T.Mesh(new T.ConeGeometry(.22, .45, 16), new T.MeshBasicMaterial({ color: '#39e07a', toneMapped: false })); this.pin.layers.set(2);this.pin.rotation.x = Math.PI; this.pin.visible = false; scene.add(this.pin);
    this.contacts = new FootContacts(this); this.blend = {}; this.current = null; this.play(keeper ? 'ready' : 'idle'); scene.add(this.root);
  }
  play(name, speed = 1, fade = .2, from = 0) {
    const a = this.clips[name]; if (!a) return; a.setEffectiveTimeScale(speed);
    if (this.current === a && from === 0) return;
    this.contacts?.reset(); this.blend = {}; for (const other of Object.values(this.clips)) if (other !== this.current) other.fadeOut(fade);
    a.enabled = true; a.reset(); a.time = from; a.setEffectiveWeight(1).play();
    if (this.current && this.current !== a) this.current.crossFadeTo(a, fade, false); this.current = a; this.anim = name;
  }
  get dir() { return this.team.dir; }
  update(dt) {
    const distance=this.root.position.distanceTo(camera.position),detail=distance<18?'high':mobile&&Number(settings.size)>5?'low':'mid';for(const mesh of this.surfaces)mesh.visible=mesh.userData.matchLOD===detail;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.busy <= 0) {
      const jockey = this.jockey && B.owner && B.owner.team !== this.team;
      if (jockey) this.face(B.owner.pos.x, B.owner.pos.z);
      else if (speed > .3) { const want = Math.atan2(this.vel.x, this.vel.z), d = Math.atan2(Math.sin(want-this.facing),Math.cos(want-this.facing)); this.facing += d * Math.min(1,dt*10); }
      const weights = {}, moving = T.MathUtils.smoothstep(speed, .12, 1.5), sprint = T.MathUtils.smoothstep(speed, 4.2, 7.5);
      weights[this.keeper ? 'ready' : 'idle'] = 1-moving;
      if (jockey && speed > .2) {
        const angle = Math.atan2(this.vel.x,this.vel.z)-this.facing, lateral = Math.sin(angle), backwards = Math.cos(angle)<-.3;
        weights[backwards ? 'backpedal' : lateral > .35 ? 'strafe-right' : lateral < -.35 ? 'strafe-left' : 'jog'] = moving;
      } else { const jog=B.owner===this?'dribble-jog':'jog';weights[jog] = moving*(1-sprint); weights.sprint = moving*sprint; const turn=T.MathUtils.clamp(Math.abs(this.turnRate||0)/7,0,.35)*(speed>1?1:0);if(turn){weights[Math.abs(this.turnAngle||0)>2?'turn180':'turn90']=turn;weights[jog]*=1-turn;weights.sprint*=1-turn;} }
      for (const [name,a] of Object.entries(this.clips)) {
        const weight = weights[name]||0;
        if (weight > 0 && !a.isRunning()) { a.reset().play(); a.time = (this.gait||0)*a.getClip().duration; }
        const w = T.MathUtils.damp(this.blend[name]||0,weight,12,dt); this.blend[name]=w; a.enabled=w>.001; a.setEffectiveWeight(w);
        if (['jog','dribble-jog','sprint','backpedal','strafe-left','strafe-right'].includes(name)) a.setEffectiveTimeScale(T.MathUtils.clamp(speed/(name==='sprint'?6.8:name==='jog'?3.8:3.1),.35,1.65));
      }
      this.gait=((this.gait||0)+dt*speed/2.8)%1; this.anim = speed>5?'sprint':speed>.3?'jog':'idle'; this.current=null;
    }
    this.mixer.update(dt);
    // Body lean: into the turn, forwards when accelerating, back when braking.
    const lean = T.MathUtils.clamp(-(this.turnRate || 0) * speed * .018, -.3, .3), pitch = T.MathUtils.clamp((this.accel || 0) * .022, -.12, .16);
    this.leanZ = T.MathUtils.damp(this.leanZ || 0, lean, 8, dt); this.leanX = T.MathUtils.damp(this.leanX || 0, pitch, 6, dt);
    this.root.position.set(this.pos.x, -.03, this.pos.z); this.root.rotation.set(this.leanX, this.facing, this.leanZ, 'YXZ');
    this.root.updateMatrixWorld(true);
    if(this.anim==='slide'||this.anim==='dive'||this.anim==='dive2'){const floor=Math.min(...['Hips','Spine2','Head'].map(n=>this.bones[n].getWorldPosition(new T.Vector3()).y-(n==='Head'?.11:.18)));if(floor<0){this.root.position.y-=floor;this.root.updateMatrixWorld(true);}}
    if(this.keeper&&B.owner===this&&!this.strike){for(const [side,dx]of [['Left',-.1],['Right',.1]])reachBall(this,side,B.p.clone().add(new T.Vector3(dx,0,0)),.8);}
    if(this.keeper && B.shot && B.shot.team!==this.team){for(const side of ['Left','Right']){const h=this.bones[side+'Hand'].getWorldPosition(new T.Vector3());if(h.distanceTo(B.p)<.6)reachBall(this,side,B.p,Math.min(.65,(.6-h.distanceTo(B.p))*2));}}
    this.contacts.update(dt, (this.busy <= 0 || this.strike) && !this.keeper);
    if (this.strike && this.strike.at - clock < .12 && this.strike.at > clock-.04) { const side=this.strike.clip==='pass-short'?'Left':'Right',foot=this.bones[side+'Foot'],target=B.p.clone(); target.y=.1; if(!['throw-in','keeper-throw'].includes(this.strike.clip))solveLimb(this.bones[side+'UpLeg'],this.bones[side+'Leg'],foot,target,1); }
    this.shadow.position.set(this.pos.x, .012, this.pos.z); this.ring.position.set(this.pos.x, .012, this.pos.z); this.pin.visible = this.ring.visible; this.pin.position.set(this.pos.x, 2.35 + Math.sin(performance.now() / 180) * .08, this.pos.z);
  }
  face(x, z) { this.facing = Math.atan2(x - this.pos.x, z - this.pos.z); }
}

/* ---------- Teams & formation ---------- */
// Base shape for a side attacking +z: keeper, two defenders, two forwards.
const formations = {
 '5': [[0,1.2],[-8,12],[8,12],[-7,26],[7,26]],
 '7': [[0,1.2],[-12,11],[0,10],[12,11],[-11,24],[11,24],[0,29]],
 '11': [[0,1.2],[-17,11],[-6,10],[6,10],[17,11],[-14,21],[0,19],[14,21],[-13,30],[0,31],[13,30]]
};
const kitMaps = new Map(); const variants=new Map();
function numberedKit(number){
 if(kitMaps.has(number))return kitMaps.get(number);
 const size=mobile?512:1024, map=canvasTex(size,size,g=>{
  const image=maps.color.image;g.drawImage(image,0,0,size,size);
  g.drawImage(image,image.width*.565,image.height*.81,image.width*.075,image.height*.085,size*.50,size*.70,size*.09,size*.11);
  g.fillStyle='#101419';g.textAlign='center';g.font=`900 ${size*.094}px Arial`;g.fillText(String(number),size*.55,size*.805);
 });map.flipY=false;kitMaps.set(number,map);return map;
}
let SHAPE = [[0, 1.2], [-8, 12], [8, 12], [-7, 26], [7, 26]];
let teams = [], all = [], user = null, controlled = null;
function buildTeams() {
  for (const p of all) { scene.remove(p.root, p.shadow, p.ring, p.pin); p.mixer.stopAllAction();p.root.traverse(o=>{if(o.isMesh&&o.material){o.material.dispose();if(o.userData.sourceVertices)o.geometry.dispose();}});p.shadow.material.dispose();p.ring.geometry.dispose();p.ring.material.dispose();p.pin.geometry.dispose();p.pin.material.dispose(); }
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?(settings.size==='11'?1:1.15):1.5));resize();
  SHAPE = formations[settings.size] || formations['5'];
  const [shirt, shorts, name] = KITS[settings.kit] || KITS.red, away = settings.kit === 'white' ? ['#1b1b1b', '#1b1b1b', 'Night Owls'] : ['#f2f2e4', '#172746', 'Muscat Whites'];
  teams = [{ name, dir: 1, score: 0, human: true, color: shirt }, { name: away[2], dir: -1, score: 0, human: false, color: away[0] }];
  teams[0].players = SHAPE.map((_, i) => new Player(teams[0], i, i === 0, i === 0 ? '#f2c230' : shirt, i === 0 ? '#1b1b1b' : shorts));
  teams[1].players = SHAPE.map((_, i) => new Player(teams[1], i, i === 0, i === 0 ? '#22c46e' : away[0], i === 0 ? '#1b1b1b' : away[1]));
  for (const t of teams) t.opp = teams[1 - teams.indexOf(t)];
  all = [...teams[0].players, ...teams[1].players]; user = teams[0];
}
const ownGoalZ = t => t.dir > 0 ? 0 : LEN, attackGoalZ = t => t.dir > 0 ? LEN : 0;
const toWorld = (t, x, z) => new T.Vector3(t.dir > 0 ? x : -x, 0, t.dir > 0 ? z : LEN - z);

function kickoffPositions(kicking) {
  for (const t of teams) t.players.forEach((p, i) => {
    let [x, z] = SHAPE[i]; z = Math.min(z, CZ - 1.5); if (i >= Math.ceil(SHAPE.length*.55)) { z = CZ - (t === kicking ? 1.2 : 8); x = t === kicking ? (i === Math.ceil(SHAPE.length*.55) ? -.6 : SHAPE[i][0]) : x; }
    p.pos.copy(toWorld(t, x, z)); p.vel.set(0, 0, 0); p.face(0, CZ); p.busy = 0; p.stun = 0;p.strike=null;p.tackleEvent=null;p.dived=false;p.jockey=false;p.restartType=null;
  });
  B.p.set(0, R, CZ); B.v.set(0, 0, 0); B.owner = null; B.shot = null; give(kicking.players[3]);
}

/* ---------- Ball control ---------- */
function give(p) { if (B.owner !== p && !p.keeper && B.v.length()>4 && p.busy<=0) { p.busy=.3; p.play('trap',1.4,.08,.4); } B.owner = p; B.lastTouch = p; B.shot = null; if (p.team === user && !p.keeper) setControlled(p); }
function setControlled(p) { if (controlled) controlled.ring.visible = false; controlled = p; if (p) p.ring.visible = true; }
function release(p) { if (B.owner === p) B.owner = null; B.kicker = p; B.kickTime = clock; B.lastTouch = p; }
// Ball release is a simulation event at the captured foot/hand contact, not button-down.
const CONTACT = { 'pass-short': .23, 'pass-ground': .48, 'pass-long': .19, strike: .41, 'throw-in': 1.55, 'keeper-throw': 1.48, 'goal-kick': 2.08, header: .65 };
function scheduleKick(p, clip, emit) {
  if (p.strike || p.busy>0 || B.owner!==p) return false;
  const contact = CONTACT[clip] || .23, speed = clip==='strike'?1.3:clip==='pass-ground'?1.6:1.15;
  p.busy=Math.max(.4,p.clips[clip].getClip().duration/speed); p.play(clip,speed,.07);
  p.strike={ at:clock+contact/speed, clip, emit }; return true;
}
const distSafe=(a,b)=>a.distanceTo(b);
function pass(p, target, lofted = false, through = false, power = .5) {
  if (!target || p.strike) return;
  const clip = p.restartType==='throw'?'throw-in':p.restartType==='goal-kick'?'goal-kick':p.keeper?'keeper-throw':lofted?'pass-long':'pass-ground';
  p.face(target.pos.x,target.pos.z);
  scheduleKick(p,clip,()=>{
    const lead=target.vel.clone().multiplyScalar(through?1:.3).add(new T.Vector3(0,0,through?p.team.dir*5:0)), aim=target.pos.clone().add(lead);aim.x+=(Math.random()-.5)*(1-p.stats.passing)*distSafe(target.pos,p.pos)*.045;
    if (isOffside(target,p)) { foulRestart(p.team.opp,target.pos,'Offside'); return; }
    if (through) target.runTo={at:aim.clone(),until:clock+2};
    const d=aim.sub(B.p).setY(0),dist=d.length(),speed=T.MathUtils.clamp(7+dist*.6+power*5,8,27)*(lofted?.8:1);
    release(p);d.normalize();B.v.set(d.x*speed,lofted||clip==='throw-in'||clip==='goal-kick'?Math.min(9,2.5+dist*.16):clip==='keeper-throw'?3:.25,d.z*speed); B.spin.set(0,0,0);B.passTo=target;p.restartType=null;sfx('kick',.6);
  });
}
function shoot(p, aimX, power, error = 0, type='driven') {
  if(p.strike)return;const gz=attackGoalZ(p.team);p.face(aimX,gz);
  scheduleKick(p,p.restartType==='goal-kick'?'goal-kick':'strike',()=>{
    const accuracy=(1-p.stats.shooting)*1.8+error,tx=T.MathUtils.clamp(aimX,-GOAL_HW+.3,GOAL_HW-.3)+(Math.random()-.5)*accuracy*3;
    const ty=type==='chip'?1.65:.3+power*1.15, from=B.p.clone(),dx=tx-from.x,dz=gz-from.z,dist=Math.hypot(dx,dz),hs=(17+power*13)*(.8+p.stats.shooting*.2)*(type==='chip'?.56:1),t=Math.max(.12,dist/hs);
    release(p);B.spin.set(0,type==='finesse'?(tx>0?-20:20)*p.team.dir:0,0);B.v.copy(launchVelocity(from,new T.Vector3(tx,ty,gz),t,B.spin));B.shot={team:p.team,t:clock};sfx('kick',1);
  });
}

/* ---------- Input ---------- */
const keys = {}, input = { x: 0, y: 0, sprint: false };
let technique = 'driven'; $('technique').onclick = () => { technique = ({driven:'lob',lob:'finesse',finesse:'chip',chip:'driven'})[technique]; $('technique').textContent = technique.toUpperCase(); };
let shootHold = 0, shootDown = false, passHold = 0, passDown = false;
addEventListener('keydown', e => { if (e.repeat) return; if(e.code==='KeyQ') $('technique').click(); keys[e.code] = true; if (e.code === 'Space' || e.code === 'KeyJ') { passDown = true; passHold = 0; } if (e.code === 'KeyK' || e.code === 'KeyL') {shootDown = true;shootHold=0;} if (e.code === 'Escape') togglePause(); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; if ((e.code === 'KeyK' || e.code === 'KeyL') && shootDown) { shootDown = false; action('shoot'); } if ((e.code === 'Space' || e.code === 'KeyJ') && passDown) { passDown = false; action('pass'); } });
const stick = $('stick'), knob = stick.querySelector('i'); let stickId = null, stickC = null;
stick.addEventListener('pointerdown', e => { if(stickId!==null)return;e.preventDefault();stickId = e.pointerId; stick.setPointerCapture(e.pointerId); const r = stick.getBoundingClientRect(); stickC = [r.left + r.width / 2, r.top + r.height / 2]; moveStick(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
const endStick = () => { const id=stickId;stickId = null;if(id!==null&&stick.hasPointerCapture(id))stick.releasePointerCapture(id); input.x = input.y = 0; knob.style.transform = ''; };
for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===stickId)endStick();});
function moveStick(e) { let dx = e.clientX - stickC[0], dy = e.clientY - stickC[1]; const r = Math.min(52,stick.clientWidth*.35), l = Math.hypot(dx, dy); if (l > r) { dx *= r / l; dy *= r / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / r; input.y = -dy / r; }
const cancelHolds=[
 bindHold($('btn-a'),{down:()=>{passDown=true;passHold=0;},release:()=>{passDown=false;action('pass');},cancel:()=>{passDown=false;passHold=0;}}),
 bindHold($('btn-b'),{down:()=>{shootDown=true;shootHold=0;},release:()=>{shootDown=false;action('shoot');},cancel:()=>{shootDown=false;shootHold=0;}}),
 bindHold($('btn-c'),{down:()=>input.sprint=true,release:()=>input.sprint=false,cancel:()=>input.sprint=false})
];
function resetControls(){cancelHolds.forEach(cancel=>cancel());endStick();shootDown=passDown=false;shootHold=passHold=0;input.sprint=false;for(const k of Object.keys(keys))keys[k]=false;}
addEventListener('blur',resetControls);
addEventListener('orientationchange',resetControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetControls();});

function readInput() {
  let x = input.x, y = input.y;
  if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1;
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  // Side-on broadcast camera: screen-right runs down the pitch (+z), screen-up is the far touchline (+x).
  return { x: y, z: x, mag: Math.min(1, l), sprint: input.sprint || keys.ShiftLeft || keys.ShiftRight };
}
function action(kind) {
  if(paused)return;
  if(state==='penalty'&&penaltyMatch?.team===user&&kind==='shoot'){const inp=readInput();shoot(penaltyMatch.taker,inp.x*2.5,T.MathUtils.clamp(.35+shootHold,0,1),.04,technique);return;}
  if (state !== 'play' || !controlled) return; sfx('ctx');
  const attacking = B.owner?.team === user;
  if (kind === 'pass') {
    if (B.owner === controlled) { const inp = readInput(), through = passHold > .28; pass(controlled, bestTarget(controlled, inp.mag > .2 ? new T.Vector3(inp.x, 0, inp.z) : null), technique==='lob', through, T.MathUtils.clamp(passHold,0,1)); if (through) toast('Through ball'); }
    else if (!attacking) setControlled(nearest(user, B.p, true));
  } else if (kind === 'shoot') {
    const power = T.MathUtils.clamp(.35 + shootHold * 1.3, .35, 1);
    if (B.owner === controlled) { const inp = readInput(); shoot(controlled, inp.x * 2.6 + (Math.random() - .5) * .4, power, power > .95 ? .35 : .08, technique);  }
    else if (B.owner && B.owner.team !== user) tackle(controlled, 1, shootHold>.25 || input.sprint);
  }
}
function bestTarget(p, wanted) {
  let best = null, score = -Infinity; const fwd = new T.Vector3(0, 0, p.team.dir);
  for (const m of p.team.players) {
    if (m === p || m.sentOff || isOffside(m,p)) continue; const d = m.pos.clone().sub(p.pos); const dist = d.length(); if (dist < 3) continue; d.normalize();
    let lane=0; for(const o of p.team.opp.players){const ap=o.pos.clone().sub(p.pos),along=T.MathUtils.clamp(ap.dot(d),0,dist),gap=ap.addScaledVector(d,-along).length();if(gap<2)lane+=1-gap/2;}
    let s = -lane*1.5-dist * .05 + d.dot(fwd) * .6 + openness(m) * .8; if (wanted) s += d.dot(wanted) * 3; if (m.keeper) s -= 1.5;
    if (s > score) { score = s; best = m; }
  } return best;
}
const openness = m => { let d = 99; for (const o of m.team.opp.players) d = Math.min(d, o.pos.distanceTo(m.pos)); return Math.min(1, d / 8); };
function nearest(team, point, outfield = false) { let best = null, bd = Infinity; for (const p of team.players) { if (p.sentOff || (outfield && p.keeper)) continue; const d = p.pos.distanceTo(point); if (d < bd) { bd = d; best = p; } } return best; }
function tackle(p, effort, slide=false) {
  const o=B.owner;if(!o||o.team===p.team||p.stun>0||p.busy>0)return;
  p.face(o.pos.x,o.pos.z);p.busy=Math.max(.65,p.clips[slide?'slide':'tackle'].getClip().duration/1.25);p.play(slide?'slide':'tackle',1.25,.07);p.tackleEvent={at:clock+(slide?.24:.16),opponent:o,slide,effort,fromBehind:p.pos.clone().sub(o.pos).dot(new T.Vector3(Math.sin(o.facing),0,Math.cos(o.facing)))<-.3};
  if(slide)p.vel.set(Math.sin(p.facing)*6,0,Math.cos(p.facing)*6);
}
function resolveTackle(p,event){
  const o=event.opponent;if(B.owner!==o)return;
  const d=p.pos.distanceTo(o.pos),bd=p.pos.distanceTo(B.p),behind=event.fromBehind;
  if(bd<(event.slide?1.8:1.2)*(.8+p.stats.defending*.25)&&(!behind||!event.slide)) {release(p);B.owner=null;B.v.copy(p.vel).multiplyScalar(.6);B.v.y=.3;B.lastTouch=p;o.stun=.25;}
  else if(d<(event.slide?2:1)&&event.slide){p.cards++;o.stun=.7;foulRestart(o.team,o.pos,p.cards>1?'Second yellow • sent off':'Foul • yellow card');if(p.cards>1){p.sentOff=true;p.root.visible=false;p.pos.set(HX+8,0,CZ);if(controlled===p)setControlled(nearest(p.team,B.p,true));if(p.team.players.filter(x=>!x.sentOff).length<Math.ceil(SHAPE.length*.6)){p.team.opp.score=Math.max(p.team.opp.score,p.team.score+3);half=2;pending=null;endHalf();}}}
}
function foulRestart(team,spot,label){
  B.owner=null;B.shot=null;B.v.set(0,0,0);state='restart';restartT=1.7;banner(label,null);whistle();
  const defending=team.opp,penalty=Math.abs(spot.x)<BOX_HW&&Math.abs(spot.z-ownGoalZ(defending))<BOX_D&&(label.startsWith('Foul')||label.includes('yellow'));
  pending=()=>{if(penalty)startPenalty(team);else {restartWith(team,spot.clone().setY(R));const toward=new T.Vector3(0,0,attackGoalZ(team)).sub(spot).setY(0).normalize(),wall=spot.clone().addScaledVector(toward,9.15);team.opp.players.filter(p=>!p.keeper&&!p.sentOff).slice(0,3).forEach((p,i)=>{p.wallSpot=wall.clone().add(new T.Vector3((i-1)*.8,0,0));p.wallUntil=clock+3;});}};
}
function isOffside(target,passer){
 if(target.keeper||['throw','goal-kick','corner'].includes(passer.restartType))return false;
 const dir=target.team.dir,defenders=target.team.opp.players.filter(p=>!p.sentOff).map(p=>p.pos.z*dir).sort((a,b)=>b-a);
 return (dir>0?target.pos.z>CZ:target.pos.z<CZ) && target.pos.z*dir>Math.max(B.p.z*dir,defenders[1]??defenders[0])+.2;
}

/* ---------- AI ---------- */
function teamTarget(p) {
  const t = p.team, [bx] = SHAPE[p.index], ball = t.dir > 0 ? B.p.z : LEN - B.p.z, bxl = t.dir > 0 ? B.p.x : -B.p.x, attacking = B.owner?.team === t, forward = p.index >= Math.ceil(SHAPE.length*.55);
  let x, z;
  if (attacking) {
    // Forwards run beyond the ball into the channels; defenders step up behind play.
    x = forward ? bx * 1.25 + bxl * .25 + Math.sin(clock * .7 + p.index) * 3 : bx + bxl * .3;
    z = forward ? Math.max(ball + 9 + (p.index === 3 ? 3 : 0), 22) : Math.max(ball - 12, 8);
  } else {
    // A flat back line, stepping with the ball, and forwards dropping to screen the middle.
    x = forward ? bx * .7 + bxl * .3 : bx * .9 + bxl * .35; z = forward ? Math.max(ball - 3, 16) : T.MathUtils.clamp(ball - 9, 5, 30);
    const mark = forward ? null : nearestAttacker(p);
    if (mark) { const m = t.dir > 0 ? mark.pos.z : LEN - mark.pos.z, mx = t.dir > 0 ? mark.pos.x : -mark.pos.x; if (m < ball + 2 && m < 34) { x = mx * .8 + bxl * .2; z = m - 1.6; } }
  }
  return toWorld(t, T.MathUtils.clamp(x, -HX + 1.5, HX - 1.5), T.MathUtils.clamp(z, 3, LEN - 4));
}
function nearestAttacker(p) {
  const side = Math.sign(SHAPE[p.index][0]) * p.team.dir; let best = null, bd = Infinity;
  for (const o of p.team.opp.players) { if (o.keeper || o === B.owner) continue; const score = o.pos.distanceTo(p.pos) + (Math.sign(o.pos.x) === side ? 0 : 6); if (score < bd) { bd = score; best = o; } }
  return best;
}
function think(p, dt) {
  const t = p.team, L = t.human ? LEVELS.normal : level(), goalZ = attackGoalZ(t);
  p.thinkT = (p.thinkT || 0) - dt;
  if (p.sentOff || p.strike || p.tackleEvent) return;
  if(p.wallUntil>clock)return seek(p,p.wallSpot,4,dt);
  if (p.keeper) return keeperAI(p, dt, L);
  if (B.owner === p) {
    const toGoal = Math.hypot(B.p.x, goalZ - B.p.z), press = Math.min(...t.opp.players.map(o => o.pos.distanceTo(p.pos)));
    if (p.thinkT <= 0) {
      p.thinkT = L.think * (.6 + Math.random() * .8);
      if (toGoal < 18 && Math.random() < .6) return shoot(p, (Math.random() < .5 ? -1 : 1) * (1.2 + Math.random() * 1.4), .7 + Math.random() * .3, 1 - L.accuracy);
      if (press < 3 && Math.random() < .75) return pass(p, bestTarget(p, null));
    }
    const dodge = t.opp.players.reduce((acc, o) => { const d = p.pos.clone().sub(o.pos); const l = d.length(); return l < 5 ? acc.add(d.multiplyScalar(1 / (l * l + .5))) : acc; }, new T.Vector3());
    p.target.set(p.pos.x * .85 + dodge.x * 10, 0, p.pos.z + t.dir * 12); return seek(p, p.target, (press < 4 ? 6.6 : 5.4) * L.speed, dt);
  }
  if (p.runTo && clock < p.runTo.until && !B.owner) return seek(p, p.runTo.at, 7.8 * L.speed, dt);
  const chaser = t.chaser === p;
  if (chaser) { seek(p, B.owner ? B.owner.pos.clone().addScaledVector(new T.Vector3(0, 0, t.dir), -.6) : B.p.clone().addScaledVector(B.v, T.MathUtils.clamp(p.pos.distanceTo(B.p)/12,.15,.8)), 7 * L.speed, dt); if (B.owner && B.owner.team !== t && p.pos.distanceTo(B.owner.pos) < 1.6 && Math.random() < dt * L.tackle * 1.4) tackle(p, L.tackle * .6, Math.random()<.16); return; }
  if (B.owner && B.owner.team !== t && t.cover === p) { const g = new T.Vector3(0, 0, ownGoalZ(t)), c = B.owner.pos.clone().lerp(g, .28); return seek(p, c, 6.4 * L.speed, dt); }
  const tgt = teamTarget(p); if(B.owner?.team===t && p.index%2===0 && p.index>1 && B.owner.pos.distanceTo(p.pos)<14){tgt.x= Math.sign(p.pos.x||1)*(HX-3);tgt.z=B.owner.pos.z+t.dir*9;} const far = tgt.distanceTo(p.pos); seek(p, tgt, (far > 8 ? 7.2 : far > 3 ? 5.6 : 3) * L.speed, dt);
}
function keeperAI(p,dt,L){
 const t=p.team,gz=ownGoalZ(t);
 if(B.owner===p){p.vel.multiplyScalar(Math.exp(-dt*8));p.holdT=(p.holdT||0)+dt;if(p.holdT>1.1&&!p.strike){p.holdT=0;pass(p,bestTarget(p,null),false,false,.5);}return;}
 const near=Math.abs(B.p.z-gz),attacker=B.owner?.team===t.opp, rush=attacker&&near<14&&Math.abs(B.p.x)<8;
 let tx=T.MathUtils.clamp(B.p.x*.23,-GOAL_HW+.4,GOAL_HW-.4),tz=gz+t.dir*(rush?Math.min(8,near*.6):Math.min(3,.6+near*.06));
 const incoming=B.shot&&B.shot.team!==t&&B.v.z*t.dir<0;
 if(incoming){const tt=(gz-B.p.z)/B.v.z,px=B.p.x+B.v.x*tt;if(tt>0&&tt<.65&&!p.dived){p.dived=true;p.busy=2.7;p.face(B.p.x,B.p.z);p.play(Math.abs(px-p.pos.x)<.6?'catch':(px-p.pos.x)*t.dir>0?'dive2':'dive',1.2,.06);p.diveTarget=T.MathUtils.clamp(px,-GOAL_HW-.6,GOAL_HW+.6);}if(p.dived)tx=p.diveTarget??tx;}
 if(p.busy<=0)seek(p,new T.Vector3(tx,0,tz),rush?6.2:4.2,dt);else if(p.dived){p.vel.x=T.MathUtils.clamp((tx-p.pos.x)*4,-5,5);p.vel.z=0;}
 if(!incoming&&p.busy<=0)p.dived=false;
 const hands=['LeftHand','RightHand'].map(n=>p.bones[n].getWorldPosition(new T.Vector3()));const reach=Math.min(...hands.map(h=>h.distanceTo(B.p)));
 if(inOwnBox(p)&&reach<.48&&B.p.y<2.7&&B.p.y>.15){
  const speed=B.v.length();B.lastTouch=p;B.shot=null;sfx('save');toast(speed>21?'Parried away':'Keeper holds it');
  if(speed>21){B.v.set((B.p.x>=p.pos.x?1:-1)*7,3,t.dir*8);B.owner=null;p.busy=.8;p.play('punch',1.5,.05);}
  else{give(p);B.v.set(0,0,0);p.vel.set(0,0,0);if(!p.dived){p.busy=.8;p.play('catch',1.2,.05);}}p.dived=false;
 }
}
function seek(p, target, maxSpeed, dt) {
  maxSpeed *= p.stats.pace;
  const d = target.clone().sub(p.pos); d.y = 0; const dist = d.length(), want = dist < .3 ? 0 : Math.min(maxSpeed, dist * 1.8);
  steer(p, dist > .001 ? d.multiplyScalar(want / dist) : d, dt);
}
// Human-like locomotion: limited acceleration, braking, and a turning circle that widens with speed.
function steer(p, want, dt) {
  const s = Math.hypot(p.vel.x, p.vel.z), ws = Math.hypot(want.x, want.z);
  let h = s > .25 ? Math.atan2(p.vel.x, p.vel.z) : (ws > .01 ? Math.atan2(want.x, want.z) : p.facing);
  const wh = ws > .01 ? Math.atan2(want.x, want.z) : h; let diff = Math.atan2(Math.sin(wh - h), Math.cos(wh - h));
  const maxTurn = T.MathUtils.lerp(13, 2.6, Math.min(1, s / 8.2)) * dt, turn = T.MathUtils.clamp(diff, -maxTurn, maxTurn); h += turn;
  let target = ws * Math.max(0, Math.cos(Math.min(Math.abs(diff), Math.PI / 2)));
  if (Math.abs(diff) > 2.1 && s > 3.5) target = 0; // plant and turn
  const rate = target > s ? 5.2 * (s < 4 ? 1.35 : 1) : 11;
  const ns = s + T.MathUtils.clamp(target - s, -rate * dt, rate * dt);
  p.vel.set(Math.sin(h) * ns, 0, Math.cos(h) * ns); p.turnAngle=diff;p.turnRate = turn / Math.max(dt, 1e-4); p.accel = (ns - s) / Math.max(dt, 1e-4);
}

/* ---------- Match flow ---------- */
let state = 'menu', clock = 0, matchTime = 0, half = 1, restartT = 0, pending = null, paused = false;
const matchLength = () => Number(settings.length) * 60;
function startMatch() {
  resetControls();
  buildTeams(); clock = 0; matchTime = 0; half = 1; teams.forEach(t => t.score = 0); stadium.updateScore(0, 0, 1);
  $('start').hidden = true; $('result').hidden = true; document.body.classList.add('is-playing'); kickoffPositions(teams[0]); state = 'walkout'; restartT = 3.5; for(const p of all){p.pos.set((p.index-(SHAPE.length-1)/2)*1.3,0,CZ-8+(p.team===user?-2:2));p.vel.set(0,0,1.8);p.facing=0;} pending=()=>{kickoffPositions(user);state='kickoff';restartT=1.2;};whistle();hud();
}
function goalScored(team) {
  team.score++; presentation.goal(B.lastTouch);  stadium.updateScore(teams[0].score, teams[1].score, half); state = 'goal'; restartT = 8.5; B.shot = null; B.v.multiplyScalar(.15);
  banner(team === user ? 'GOAL!' : `${team.name} score`, team === user); sfx(team === user ? 'cheer' : 'groan');
  const scorer = B.lastTouch?.team === team ? B.lastTouch : nearest(team, B.p, true); B.owner=null; for(const p of all){p.ring.visible=false;p.pin.visible=false;} scorer.busy = 8.5; scorer.vel.set(0, 0, 0); scorer.play(['celebrate','celebrate2','celebrate3'][scorer.index%3], 1, .2);
  for (const p of team.opp.players) if (!p.keeper) { p.busy = 2; p.play('idle', 1, .3); }
  pending = () => { kickoffPositions(team.opp); state = 'kickoff'; restartT = 1.2; whistle(); }; hud();
}
function outOfPlay() {
  const p = B.p, last = B.lastTouch?.team || teams[0];
  B.owner = null; B.shot = null; state = 'restart'; restartT = 1.1;
  if (Math.abs(p.x) > HX) { const t = last.opp, x = Math.sign(p.x) * (HX - .3), z = T.MathUtils.clamp(p.z, 1, LEN - 1); banner('Throw-in', null); pending = () => { restartWith(t, new T.Vector3(x, R, z)); B.owner.restartType='throw'; };  return; }
  const endTeam = p.z < CZ ? teams.find(t => ownGoalZ(t) === 0) : teams.find(t => ownGoalZ(t) === LEN), endZ = p.z < CZ ? 0 : LEN;
  if (last === endTeam) { const t = endTeam.opp; banner('Corner', null); pending = () => {restartWith(t, new T.Vector3(Math.sign(p.x || 1) * (HX - .5), R, endZ + (endZ ? -.5 : .5)));B.owner.restartType='corner';}; }
  else { banner('Goal kick', null); pending = () => restartWith(endTeam, new T.Vector3(0, R, endZ + (endZ ? -2 : 2)), endTeam.players[0]); }
}
function restartWith(team, spot, taker = null) {
  B.p.copy(spot); B.v.set(0, 0, 0); taker ||= nearest(team, spot, true);
  for (const p of all) if (p !== taker && p.pos.distanceTo(spot) < 4 && p.team !== team) p.pos.add(p.pos.clone().sub(spot).setY(0).normalize().multiplyScalar(4 - p.pos.distanceTo(spot)));
  taker.pos.copy(spot).addScaledVector(new T.Vector3(-Math.sign(spot.x) * .2, 0, team.dir), -.6); taker.pos.y = 0; taker.vel.set(0, 0, 0); give(taker); if(taker.keeper)taker.restartType='goal-kick'; state='play';
}
function endHalf() {
  if (half === 1) { half = 2; for(const t of teams)t.dir*=-1; state = 'restart'; restartT = 2.5; banner('Half-time', null); whistle(); pending = () => { kickoffPositions(teams[1]); state = 'kickoff'; restartT = 1.2; whistle(); }; return; }
  state = 'over'; whistle(); setTimeout(whistle, 400); const [a, b] = [teams[0].score, teams[1].score];
  $('result-label').textContent = 'Full time'; $('result-title').textContent = a > b ? 'You win!' : a < b ? 'Defeat' : 'Draw';
  $('result-reason').textContent = `${teams[0].name} ${a} – ${b} ${teams[1].name}`; setTimeout(() => { $('result').hidden = false; }, 1200);
}

let penaltyMatch=null;
function startPenalty(team){
 const taker=nearest(team,new T.Vector3(0,0,attackGoalZ(team)-team.dir*8),true),keeper=team.opp.players[0],gz=attackGoalZ(team);
 penaltyMatch={team,taker,keeper,elapsed:0};
 for(const p of all){p.vel.set(0,0,0);if(p!==taker&&p!==keeper)p.pos.z=gz-team.dir*(BOX_D+10+Math.floor(p.index/4));}
 taker.pos.set(0,0,gz-team.dir*8);keeper.pos.set(0,0,gz+team.dir*.1);keeper.dived=false;keeper.userDiveTarget=undefined;give(taker);B.p.set(0,R,gz-team.dir*7.4);state='penalty';setControlled(team===user?taker:nearest(user,B.p,true));toast(team===user?'Swipe upward to strike':'Tap the goal to dive');
}
function stepPenalty(dt){
 const m=penaltyMatch;m.elapsed+=dt;
 if(m.team!==user&&m.elapsed>1&&!m.taker.strike&&B.owner===m.taker){const inp=readInput();shoot(m.taker,m.team===user?inp.x*2.5:(Math.random()-.5)*4,.75,.05,technique);}
 if(m.taker.strike&&clock>=m.taker.strike.at){const e=m.taker.strike;m.taker.strike=null;e.emit();}
 if(m.team===user)keeperAI(m.keeper,dt,level());else if(m.keeper.userDiveTarget!==undefined){m.keeper.vel.x=T.MathUtils.clamp((m.keeper.userDiveTarget-m.keeper.pos.x)*4,-5,5);}
 m.taker.busy=Math.max(0,m.taker.busy-dt);m.keeper.busy=Math.max(0,m.keeper.busy-dt);m.keeper.pos.addScaledVector(m.keeper.vel,dt);
 if(!B.owner){state='play';moveBallLoose(dt);if(state==='play')state='penalty';}
 if(m.elapsed>(m.team===user?12:6)&&state==='penalty'){state='play';if(!B.owner)restartWith(m.team.opp,new T.Vector3(0,R,ownGoalZ(m.team.opp)+m.team.opp.dir*3),m.keeper);penaltyMatch=null;}
}

let penaltySwipe=null;
canvas.addEventListener('pointerdown',e=>{
 if(state!=='penalty'||!penaltyMatch)return;
 const m=penaltyMatch;if(m.team===user){penaltySwipe={x:e.clientX,y:e.clientY,time:performance.now()};canvas.setPointerCapture(e.pointerId);}
 else{m.keeper.userDiveTarget=T.MathUtils.clamp((e.clientX/innerWidth-.5)*GOAL_HW*2,-GOAL_HW,GOAL_HW);m.keeper.busy=2.7;m.keeper.play(m.keeper.userDiveTarget>0?'dive2':'dive',1.2,.05);}
});
canvas.addEventListener('pointerup',e=>{
 if(!penaltySwipe||state!=='penalty')return;const start=penaltySwipe;penaltySwipe=null;const dx=e.clientX-start.x,dy=start.y-e.clientY;
 if(Math.hypot(dx,dy)<15)return;const power=T.MathUtils.clamp(Math.hypot(dx,dy)/220,.3,1);shoot(penaltyMatch.taker,T.MathUtils.clamp(dx/90,-1,1)*2.6,power,.03,technique);
});
canvas.addEventListener('pointercancel',()=>penaltySwipe=null);

/* ---------- Simulation step ---------- */
function step(dt) {
  clock += dt;
  if (state === 'goal' || state === 'restart' || state === 'kickoff' || state === 'walkout') {
    restartT -= dt; for (const p of all) { if(state!=='walkout')p.vel.multiplyScalar(Math.exp(-dt * 5)); p.busy = Math.max(0, p.busy - dt); p.pos.addScaledVector(p.vel, dt); }
    if (state === 'goal') {moveBallLoose(dt);B.p.z=T.MathUtils.clamp(B.p.z,-1.3,LEN+1.3);B.p.x=T.MathUtils.clamp(B.p.x,-GOAL_HW+R,GOAL_HW-R);}
    if (restartT <= 0) { const before = state, f = pending; pending = null; if (f) f(); if (state === before) state = 'play'; }
    return;
  }
  if (state === 'penalty') {stepPenalty(dt);return;}
  if (state !== 'play') return;
  matchTime += dt; if (matchTime >= matchLength() * half / 2) return endHalf();
  for (const t of teams) { let best = null, bd = Infinity; const order = t.players.filter(p => !p.keeper && !p.sentOff).sort((a, b) => a.pos.distanceTo(B.owner ? B.owner.pos : B.p) - b.pos.distanceTo(B.owner ? B.owner.pos : B.p)); t.chaser = order[0]; t.cover = order[1]; }
  if (!B.owner && B.lastTouch?.team !== user && controlled && user.chaser !== controlled && controlled.pos.distanceTo(B.p) > user.chaser.pos.distanceTo(B.p) + 4) setControlled(user.chaser);
  const inp = readInput(); if (shootDown) shootHold += dt; if (passDown) passHold += dt;
  for (const p of all) {
    if(p.sentOff)continue;
    if(p.strike && clock>=p.strike.at){const e=p.strike;p.strike=null;if(B.owner===p)e.emit();}
    if(p.tackleEvent&&clock>=p.tackleEvent.at){const e=p.tackleEvent;p.tackleEvent=null;resolveTackle(p,e);}
    p.busy = Math.max(0, p.busy - dt); p.stun = Math.max(0, p.stun - dt);
    if (p.stun > 0) { p.vel.multiplyScalar(Math.exp(-dt * 6)); }
    else if(p.busy>0&&!p.keeper&&!p.strike&&!p.tackleEvent){p.vel.multiplyScalar(Math.exp(-dt*9));}
    else if (p === controlled) {
      p.jockey=inp.sprint && B.owner && B.owner.team!==p.team; const sp = (p.jockey?3.2:inp.sprint ? 8.2 : 6)*p.stats.pace * (B.owner === p ? .88 : 1), want = new T.Vector3(inp.x, 0, inp.z).multiplyScalar(sp * inp.mag);
      p.sprinting = inp.sprint; steer(p, want, dt);
    } else think(p, dt);
    if (p.busy > 0 && !p.keeper && !p.tackleEvent) p.vel.multiplyScalar(Math.exp(-dt * 3));
    p.pos.addScaledVector(p.vel, dt); p.pos.x = T.MathUtils.clamp(p.pos.x, -HX - 1, HX + 1); p.pos.z = T.MathUtils.clamp(p.pos.z, -1, LEN + 1);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], b = all[j], d = a.pos.clone().sub(b.pos); d.y = 0; const l = d.length(); if (l < .7 && l > .001) { d.multiplyScalar((.7 - l) / l / 2); a.pos.add(d); b.pos.sub(d); } }
  if(state!=='play')return;
  if (B.owner) dribble(dt); else moveBallLoose(dt);
  if (!B.owner) for (const p of all) {
    if (p.sentOff || p.busy>0 || p.stun > 0 || (p === B.kicker && clock - B.kickTime < .35)) continue;
    const reach = p.keeper && inOwnBox(p) ? 1.25 : .75, d = Math.hypot(B.p.x - p.pos.x, B.p.z - p.pos.z), fast = Math.hypot(B.v.x, B.v.z);
    if(!p.keeper&&d<.9&&B.p.y>1.45&&B.p.y<2.05&&p.busy<=0){p.busy=.8;p.play('header',1.1,.04,.65);B.v.set(Math.sin(p.facing)*9,2,Math.cos(p.facing)*9);B.lastTouch=p;continue;}
    if (d < reach && B.p.y < (p.keeper ? 2.2 : .9)) {
      if (B.shot && B.shot.team !== p.team && !p.keeper && fast > 14 && Math.random() > .35) continue;
      if(p.keeper && B.shot)continue;
      if (p.keeper && B.shot && B.shot.team !== p.team) { sfx('save'); toast('Saved!'); }
      give(p); B.v.set(0, 0, 0); sfx('touch'); break;
    }
  }
}
// The carrier pushes the ball ahead with each touch and runs onto it; it is only close-controlled when slow.
function dribble(dt) {
  const p = B.owner; if(p.strike){ B.v.set(0,0,0);if(['throw-in','keeper-throw'].includes(p.strike.clip)){p.root.updateMatrixWorld(true);const left=p.bones.LeftHand.getWorldPosition(new T.Vector3()),right=p.bones.RightHand.getWorldPosition(new T.Vector3());B.p.copy(p.strike.clip==='throw-in'?left.add(right).multiplyScalar(.5):right);} return; } const sp = Math.hypot(p.vel.x, p.vel.z), heading = sp > .3 ? Math.atan2(p.vel.x, p.vel.z) : p.facing, f = new T.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const foot = p.pos.clone().addScaledVector(f, .42), toBall = B.p.clone().sub(p.pos); toBall.y = 0; const d = toBall.length();
  if(p.keeper){const left=p.bones.LeftHand.getWorldPosition(new T.Vector3()),right=p.bones.RightHand.getWorldPosition(new T.Vector3());B.p.lerp(left.add(right).multiplyScalar(.5),1-Math.exp(-dt*20));B.v.set(0,0,0);return;}
  if (sp < 1.3) {
    const want = foot.clone(); want.y = p.keeper ? 1.1 : R; B.v.copy(want).sub(B.p).multiplyScalar(6); B.v.y = 0; B.p.lerp(want, Math.min(1, dt * 7)); B.p.y = want.y;
    ball.rotation.x += B.v.z * dt / R; ball.rotation.z -= B.v.x * dt / R;
  } else {
    const ahead = d > .01 ? toBall.dot(f) / d : 1, near = Math.min(...['LeftToeBase','RightToeBase'].map(n=>{const toe=p.bones[n].getWorldPosition(new T.Vector3());return toe.y<.32?toe.distanceTo(B.p):99;}));
    if (near < .65 && ahead > -.2 && clock - (p.touchT || 0) > .24) {
      const push = sp + (p.sprinting || sp > 7 ? .9 : .55); B.v.set(f.x * push, .25, f.z * push); p.touchT = clock; B.lastTouch = p; sfx('touch', .25);
    }
    moveBallLoose(dt);
  }
  if (!B.owner) return;
  if (d > 3.2) { B.owner = null; return; }
  for (const o of p.team.opp.players) {
    if (o.stun > 0 || o.tackleEvent || o.sentOff) continue; const od = Math.hypot(B.p.x - o.pos.x, B.p.z - o.pos.z);
    if (od < .62 && d > .5 && Math.random() < dt * 9) { give(o); B.v.set(0, 0, 0); sfx('touch'); return; }
  }
}
const inOwnBox = p => Math.abs(p.pos.x) < BOX_HW && Math.abs(p.pos.z - ownGoalZ(p.team)) < BOX_D;
function moveBallLoose(dt) {
  const p = B.p, v = B.v, prev = p.clone();
  advance(p,v,B.spin,dt); groundContact(p,v,B.spin,dt);
  ball.rotation.x += v.z * dt / R; ball.rotation.z -= v.x * dt / R;
  if (state !== 'play') return;
  if(!B.owner&&v.length()>5)for(const player of all){
    if(player.sentOff||(player===B.kicker&&clock-B.kickTime<.3)||Math.hypot(p.x-player.pos.x,p.z-player.pos.z)>2.3)continue;
    const segments=[['Spine','Spine2',.22],['LeftUpLeg','LeftFoot',.10],['RightUpLeg','RightFoot',.10]];
    if(player.keeper)segments.push(['LeftForeArm','LeftHand',.12],['RightForeArm','RightHand',.12]);
    for(const [from,to,radius]of segments){const a=player.bones[from].getWorldPosition(new T.Vector3()),b=player.bones[to].getWorldPosition(new T.Vector3()),hit=sweepSphereSegment(prev,p,a,b,radius+R);if(hit){p.copy(hit.center).addScaledVector(hit.normal,.002);reflectContact(v,hit.normal,.35,player.vel);B.lastTouch=player;if(player.keeper){B.shot=null;sfx('save');}break;}}
  }
  for(const gz of [0,LEN]) {
    const posts=[[new T.Vector3(-GOAL_HW-.06,0,gz),new T.Vector3(-GOAL_HW-.06,GOAL_H+.06,gz)],[new T.Vector3(GOAL_HW+.06,0,gz),new T.Vector3(GOAL_HW+.06,GOAL_H+.06,gz)],[new T.Vector3(-GOAL_HW,GOAL_H+.06,gz),new T.Vector3(GOAL_HW,GOAL_H+.06,gz)]];
    for(const [a,b] of posts){const hit=sweepSphereSegment(prev,p,a,b,R+.06);if(hit){p.copy(hit.center).addScaledVector(hit.normal,.002);reflectContact(v,hit.normal,.65);sfx('post');return;}}
    const line=gz===0?-R:LEN+R;
    if((prev.z-line)*(p.z-line)<=0&&prev.z!==p.z){const f=(line-prev.z)/(p.z-prev.z),at=prev.clone().lerp(p,f);if(Math.abs(at.x)+R<GOAL_HW&&at.y+R<GOAL_H)return goalScored(teams.find(t=>attackGoalZ(t)===gz));if(Math.abs(at.x)<GOAL_HW+2)sfx('groan');}
  }
  if (Math.abs(p.x) > HX + R || p.z < -R || p.z > LEN + R) outOfPlay();
}

/* ---------- Camera ---------- */
const camLook = new T.Vector3(0, 0, CZ), camPos = new T.Vector3(-HX - 30, 25, CZ);
function updateCamera(dt) {
  if(state==='penalty'&&penaltyMatch){const m=penaltyMatch,gz=attackGoalZ(m.team);camera.position.lerp(new T.Vector3(0,2.6,gz-m.team.dir*(m.team===user?15:-7)),1-Math.exp(-dt*5));camera.lookAt(0,.9,gz);return;}
  if(presentation.camera(dt,state,restartT,teams,controlled))return;
  // Elevated touchline camera that tracks the ball along the pitch, like a TV broadcast.
  const portrait = innerHeight > innerWidth, t = B.p;
  const z = T.MathUtils.clamp(t.z, portrait ? 8 : 14, LEN - (portrait ? 8 : 14)), x = T.MathUtils.clamp(t.x, -HX, HX);
  const want = new T.Vector3(-HX - (portrait ? 10 : 4) + x * .45, portrait ? 18 : 11.5, z), look = new T.Vector3(x * .7 + 3.5, 0, z);
  const k = 1 - Math.exp(-dt * (state === 'menu' ? .6 : 3.4)); camPos.lerp(want, k); camLook.lerp(look, k); camera.position.copy(camPos); camera.lookAt(camLook);
}

/* ---------- Sound ---------- */
let audio;
const bed=new Audio('../penalty/assets/stadium-bed.mp3');bed.loop=true;bed.volume=.22;
const reaction=new Audio('../penalty/assets/crowd-reaction.mp3');reaction.volume=.65;
const kickSound=new Audio('../penalty/assets/ball-kick.mp3');kickSound.volume=.65;
function sfx(kind, vol = 1) {
  if (!settings.sound) return; if (!audio) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; audio = new A(); } if (audio.state === 'suspended') audio.resume(); if(kind==='ctx'){if(bed.paused)bed.play().catch(()=>{});return;} if(kind==='groan'){reaction.currentTime=0;reaction.play().catch(()=>{});} if(kind==='kick'){kickSound.currentTime=0;kickSound.volume=.6*vol;kickSound.play().catch(()=>{});}
  const c = audio, t = c.currentTime, noise = (len, gain, type, freq) => { const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(.25, len * .2)); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f).connect(g).connect(c.destination); s.start(); };
  if (kind === 'kick' || kind === 'touch') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(kind === 'kick' ? 150 : 210, t); o.frequency.exponentialRampToValueAtTime(50, t + .1); g.gain.setValueAtTime(.5 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g).connect(c.destination); o.start(); o.stop(t + .16); }
  if(kind==='cheer'){bed.volume=.7;setTimeout(()=>bed.volume=.22,2800);}
  if (kind === 'groan' || kind === 'save') noise(1.6, .28, 'lowpass', 420);
  if (kind === 'post') [420, 1130, 2210].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .8); o.connect(g).connect(c.destination); o.start(); o.stop(t + .9); });
  if (kind === 'whistle') { const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + .02); g.gain.setValueAtTime(.1, t + .3); g.gain.linearRampToValueAtTime(0, t + .38); o.connect(g).connect(c.destination); o.start(); lfo.start(); o.stop(t + .4); lfo.stop(t + .4); }
}
const whistle = () => sfx('whistle');

/* ---------- HUD ---------- */
let bannerT = 0, toastT = 0;
function banner(text, good) { const b = $('banner'); b.textContent = text; b.className = 'banner is-on' + (good==null?' is-event':'') + (good === true ? ' is-good' : good === false ? ' is-bad' : ''); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('is-on'), 1800); }
function toast(text) { const el = $('toast'); el.textContent = text; el.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('is-on'), 1400); }
function hud() {
  document.body.dataset.matchState=state;
  if (!teams.length) return;
  const mins = Math.floor(matchTime / matchLength() * 90), shown = Math.min(mins, half === 1 ? 45 : 90);
  $('sb-home').textContent = teams[0].name; $('sb-away').textContent = teams[1].name; $('sb-score').textContent = `${teams[0].score} – ${teams[1].score}`; $('sb-time').textContent = `${String(shown).padStart(2,'0')}:${String(Math.floor((matchTime/matchLength()*90%1)*60)).padStart(2,'0')}`;
  if(controlled)$('player-info').textContent = `#${controlled.number}  ${['Aziz','Malik','Costa','Nouri','Silva','Ali','Santos','Idris','Rami','Khan','Omar'][controlled.index]}  •  PACE ${Math.round(controlled.stats.pace*80)}`;
  $('sb-home-c').style.background = teams[0].color; $('sb-away-c').style.background = teams[1].color;
  const attacking = B.owner?.team === user; $('btn-a').querySelector('b').textContent = attacking ? 'PASS' : 'SWITCH'; $('btn-b').querySelector('b').textContent = attacking ? 'SHOOT' : 'TACKLE'; $('btn-c').querySelector('b').textContent = attacking ? 'SPRINT' : 'PRESS'; $('phase').textContent = attacking ? 'ATTACKING' : B.owner ? 'DEFENDING' : ''; $('phase').className = 'phase' + (attacking ? '' : ' is-def'); $('phase').hidden = !B.owner;
  $('pass-power').style.transform=`scaleX(${passDown?Math.min(1,passHold):0})`;
  $('power').style.transform = `scaleX(${shootDown && B.owner === controlled ? T.MathUtils.clamp(.35 + shootHold * 1.3, .35, 1) : 0})`;
}

/* ---------- Menus ---------- */
function syncSegments() { document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value)))); $('btn-sound').classList.toggle('is-off', !settings.sound); }
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments(); }));
$('play').onclick = () => { sfx('ctx'); startMatch(); };
$('again').onclick = () => startMatch();
const toMenu = () => { resetControls();state = 'menu'; paused = false; $('pause').hidden = true; $('result').hidden = true; $('start').hidden = false; document.body.classList.remove('is-playing'); };
$('to-menu').onclick = toMenu; $('quit').onclick = toMenu;

function togglePause() { if (state === 'menu' || state === 'over') return; resetControls();paused = !paused; $('pause').hidden = !paused; }
$('skip-replay').onclick=()=>{if(state==='goal')restartT=.01;};
$('btn-pause').onclick = togglePause; $('resume').onclick = togglePause;
$('btn-sound').onclick = () => { settings.sound = !settings.sound; bed.muted=!settings.sound; save(); syncSegments(); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});

/* ---------- Loop ---------- */
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.fov = w / h < .8 ? 58 : 36; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const presentation = installPresentation({T,scene,camera,ball,mobile,canvasTex,LEN,HX});
const timer = new T.Clock(); let hudT = 0, accumulator=0;
function loop() {
  const dt = Math.min(timer.getDelta(), 1 / 20);
  presentation.restore();
  if (!paused && state !== 'menu') { accumulator+=dt;while(accumulator>=1/120){step(1/120);accumulator-=1/120;} }
  for (const p of all) p.update(paused ? 0 : dt);
  B.p.y = Math.max(B.p.y, R); updateCamera(dt); stadium.update(performance.now() / 1000, state === 'goal' && B.lastTouch?.team === user, dt);
  optics.update(state,restartT,ball,B.lastTouch);grade.uniforms.time.value = performance.now() / 1000; if ((hudT -= dt) <= 0) { hud(); hudT = .1; }
  ballShadow.position.set(ball.position.x+.06,.012,ball.position.z-.04);ballShadow.scale.setScalar(Math.max(.4,1-ball.position.y*.25));ballShadow.material.opacity=.42*Math.max(.15,1-ball.position.y*.3);presentation.update(dt,all,B,state); renderer.shadowMap.needsUpdate=true; renderer.info.reset();composer.render();
}
if (['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('debug')) window.fb = { get input(){return {...input,shootDown,passDown,shootHold,passHold};}, get players(){return all;}, get ball(){return B;}, get state(){return state;}, get camera(){return camera;}, action, pass, shoot, tackle, give, restartWith, foulRestart, setControlled, startMatch, goal:()=>goalScored(user), penalty:()=>startPenalty(user), get renderer(){return renderer;}, sim(seconds) { for (let i = 0; i < seconds * 60; i++) step(1 / 60); for (const p of all) p.update(0); hud(); return { state, score: teams.map(t => t.score), time: matchTime.toFixed(1), owner: B.owner ? (B.owner.team === user ? 'user' : 'cpu') + B.owner.index : null, ball: B.p.toArray().map(v => +v.toFixed(1)) }; } };
syncSegments();
Promise.all([modelsReady, environmentReady, ...jobs]).then(() => {
  buildTeams(); kickoffPositions(teams[0]); state = 'menu'; $('loading').hidden = true; document.body.classList.add('is-ready'); renderer.setAnimationLoop(loop);
}).catch(err => { console.error(err); $('load-progress').textContent = 'Could not load the match. Please refresh.'; });
