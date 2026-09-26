import * as T from './vendor/three.module.js';
import {clamp, lerp, smooth, random} from './math.js?v=20260928a';

/*
  Time and weather. The clock runs as you drive (a full day in about half an hour, slower through dawn and golden hour,
  quicker at night), the sun and moon move across the sky, and the weather drifts on its own: clouds build, rain sets in,
  then it clears. Morning mist settles in the valleys. Everything else reads its colours and light levels from here.
*/
export const PRESETS = {dawn: 6.15, day: 11.5, sunset: 18.35, night: 22.5};

// Valley mist is added to the fog of every lit material. The arrays are shared by reference with each material's uniforms.
export const MIST = {params: new Float32Array([0, -1e4, 16, 110]), color: new Float32Array([.85, .87, .9, 0])};
T.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying float vFogHeight;\n#endif';
T.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n\tvFogHeight = ( transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) ).y;\n#endif';
T.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
	uniform vec3 fogColor;
	uniform vec4 mistParams;
	uniform vec4 mistColor;
	varying float vFogDepth;
	varying float vFogHeight;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`;
T.ShaderChunk.fog_fragment = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	float mistIn = clamp( ( mistParams.y - vFogHeight ) / mistParams.z, 0.0, 1.0 );
	float mist = mistParams.x * max( mistIn * mistIn * ( 3.0 - 2.0 * mistIn ) * ( 1.0 - exp( - vFogDepth / mistParams.w ) ), mistColor.w * ( 1.0 - exp( - vFogDepth / ( mistParams.w * 0.55 ) ) ) );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, mistColor.rgb, clamp( mist, 0.0, 0.93 ) * ( 1.0 - 0.6 * fogFactor ) );
#endif`;
for (const shader of Object.values(T.ShaderLib)) if (shader.fragmentShader?.includes('fog_fragment')) Object.assign(shader.uniforms, {mistParams: {value: MIST.params}, mistColor: {value: MIST.color}});
export function addMist(uniforms) { uniforms.mistParams = {value: MIST.params}; uniforms.mistColor = {value: MIST.color}; }

// Sky colours by the height of the sun: [sin(elevation), zenith, horizon].
const SKY = [[-.24, 0x040a19, 0x131d31], [-.1, 0x0d1633, 0x2c2b48], [-.035, 0x252c55, 0x9c6872], [.02, 0x3f4f86, 0xe6905c], [.09, 0x4f67a0, 0xf2b27a], [.22, 0x5a82bc, 0xe8d2ae]];
const c1 = new T.Color(), c2 = new T.Color(), c3 = new T.Color(), c4 = new T.Color();

export class Atmosphere {
  constructor(settings) {
    this.settings = settings;
    this.hour = PRESETS[settings.time] ?? 11.5; this.days = 0;
    this.cloud = .25; this.rain = 0; this.wet = 0; this.storm = false;
    this.phase = null; this.phaseTime = 0; this.rng = random(Date.now() % 1e9);
    this.sunDir = new T.Vector3(); this.moonDir = new T.Vector3(); this.lightDir = new T.Vector3();
    this.top = new T.Color(); this.bottom = new T.Color(); this.sunColor = new T.Color(); this.cloudTint = new T.Color();
    this.hemiSky = new T.Color(); this.hemiGround = new T.Color(); this.lightColor = new T.Color(); this.mistTint = new T.Color();
    this.applyWeather(true);
    this.update(0);
  }

  get live() { return this.settings.clock !== 'still'; }
  setPreset(name) { if (PRESETS[name] !== undefined) this.hour = PRESETS[name]; this.update(0); }
  // The part of the day to show on the time-of-day buttons.
  get period() { const h = this.hour; return h >= 4.8 && h < 8.5 ? 'dawn' : h >= 8.5 && h < 17.2 ? 'day' : h >= 17.2 && h < 20 ? 'sunset' : 'night'; }
  get clock() { const m = Math.floor(this.hour * 60) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }

  // Fixed weather sets the targets directly; changing weather walks through clear, building, rain and clearing.
  applyWeather(instant = false) {
    const w = this.settings.weather;
    if (w === 'changing') { if (!this.phase || instant) this.nextPhase('clear', instant); return; }
    this.phase = null;
    this.target = {clear: {cloud: .22, rain: 0}, overcast: {cloud: .9, rain: 0}, rain: {cloud: 1, rain: 1}}[w] || {cloud: .22, rain: 0};
    this.storm = w === 'rain';
    if (instant) { this.cloud = this.target.cloud; this.rain = this.target.rain; this.wet = this.rain; }
  }
  nextPhase(name, instant = false) {
    const r = this.rng;
    const phases = {
      clear: {cloud: .12 + r() * .22, rain: 0, time: 260 + r() * 300, next: 'building'},
      building: {cloud: .82 + r() * .12, rain: 0, time: 100 + r() * 80, next: r() < .72 ? 'rain' : 'clearing'},
      rain: {cloud: 1, rain: .4 + r() * .6, time: 110 + r() * 130, next: 'clearing'},
      clearing: {cloud: .38, rain: 0, time: 70 + r() * 50, next: 'clear'},
    };
    this.phase = name; this.target = phases[name]; this.phaseTime = this.target.time;
    if (name === 'rain') this.storm = this.target.rain > .78;
    if (instant) { this.cloud = this.target.cloud; this.rain = this.target.rain; }
  }

  // How fast game time passes: slow through dawn and golden hour, quick through the middle of the night.
  rate(h) { const night = h > 21 || h < 4.3, glow = (h > 4.8 && h < 8.2) || (h > 17 && h < 19.8); return .0105 * (night ? 2.6 : glow ? .72 : 1.25); }

  update(dt, {valleyY = 0, cameraY = 0} = {}) {
    if (this.live && dt) { this.hour += this.rate(this.hour) * dt; if (this.hour >= 24) { this.hour -= 24; this.days++; } }
    if (this.phase && dt) { this.phaseTime -= dt; if (this.phaseTime <= 0) this.nextPhase(this.target.next); }
    if (dt) {
      this.cloud += (this.target.cloud - this.cloud) * Math.min(1, dt / 45);
      // Rain only falls from a heavy sky, starting as drizzle.
      const want = this.cloud > .75 ? this.target.rain : 0;
      this.rain += clamp(want - this.rain, -dt / 30, dt / (this.rain < .2 ? 40 : 22));
      this.wet = clamp(this.wet + (this.rain > .05 ? dt * (.02 + this.rain * .05) : -dt / 150), 0, 1);
    }
    this.sky();
    this.mist(valleyY, cameraY);
  }

  sky() {
    const s = this.settings, h = this.hour;
    // Sun: rises ahead and to the left of the road's general heading, passes behind you at noon, and sets ahead to the right.
    const dayU = (h - 6) / 13.2, elev = Math.sin(dayU * Math.PI) * 1.08;
    const az = .45 + clamp(dayU, -.2, 1.2) * 5.66;
    this.sunDir.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)).normalize();
    const nightU = ((h - 19.4 + 24) % 24) / 11.2, mElev = Math.sin(clamp(nightU, 0, 1) * Math.PI) * .62 + .02, mAz = -.7 + clamp(nightU, 0, 1) * 1.3;
    this.moonDir.set(Math.sin(mAz) * Math.cos(mElev), Math.sin(mElev), Math.cos(mAz) * Math.cos(mElev)).normalize();
    const se = this.sunDir.y;
    this.se = se;
    this.night = 1 - smooth(-.2, -.025, se);
    this.golden = smooth(-.07, .02, se) * (1 - smooth(.14, .32, se));
    this.daylight = smooth(-.12, .3, se);
    const cloud = this.cloud, rain = this.rain, grey = smooth(.45, 1, cloud);
    // Street lamps, shop lights and headlights come on at dusk, and early under heavy rain clouds.
    this.lit = Math.max(1 - smooth(-.02, .12, se), grey * rain * .7, grey * .25 * (1 - this.daylight));
    // Sky gradient.
    const theme = this.theme || {sky: 0x6495c5, horizon: 0xc4d6dc};
    let i = 0; while (i < SKY.length - 1 && SKY[i + 1][0] < se) i++;
    if (se >= .45) { c1.set(theme.sky); c2.set(theme.horizon); }
    else if (se <= SKY[0][0]) { c1.set(SKY[0][1]); c2.set(SKY[0][2]); }
    else if (i >= SKY.length - 1) { const t = smooth(SKY[i][0], .45, se); c1.set(SKY[i][1]).lerp(c3.set(theme.sky), t); c2.set(SKY[i][2]).lerp(c4.set(theme.horizon), t); }
    else { const [a, ta, ba] = SKY[i], [b, tb, bb] = SKY[i + 1], t = clamp((se - a) / (b - a), 0, 1); c1.set(ta).lerp(c3.set(tb), t); c2.set(ba).lerp(c4.set(bb), t); }
    // Clouds and rain grey the sky, keeping it about as bright as the time of day allows.
    const bright = .08 + .92 * this.daylight;
    c3.set(rain > .3 ? 0x5b6672 : 0x7c8895).multiplyScalar(bright); c4.set(rain > .3 ? 0x98a3a8 : 0xc3ced0).multiplyScalar(bright);
    const overcast = grey * (.85 + .15 * this.daylight);
    this.top.copy(c1).lerp(c3, overcast * .9); this.bottom.copy(c2).lerp(c4, overcast * .85);
    if (s.location !== 'hills' && s.planet === 'moon') { this.top.set(0x050a14).lerp(c1, .04); this.bottom.set(0x303845).multiplyScalar(.3 + .7 * this.daylight); }
    this.sunColor.set(0xfff5db).lerp(c3.set(0xff9e4a), this.golden).lerp(c4.set(0xff6a3a), smooth(.02, -.08, se));
    this.cloudTint.set(0xf4f4ef).lerp(c3.set(rain > .3 ? 0xb4bcc2 : 0xe4e8ea), grey);
    this.skyCloud = lerp(.36, 1, cloud) * (1 - this.golden * .15);
    // Direct light: the sun by day, the moon at night, fading out around the horizon so the switch is never seen.
    const sunUp = smooth(-.04, .06, se), sunI = (this.golden > .5 && se < .2 ? 3.1 : 4.2) * (1 - .62 * grey) * sunUp;
    const moonI = .85 * this.night * (1 - .7 * grey);
    this.lightDir.copy(se > -.035 ? this.sunDir : this.moonDir);
    this.lightIntensity = (se > -.035 ? sunI : moonI) * (1 - .45 * rain);
    this.lightColor.set(0xfff0d5).lerp(c3.set(0xffa25a), this.golden).lerp(c4.set(0xa9bdff), this.night);
    this.hemiIntensity = lerp(lerp(1.2, .8, this.golden), .62, this.night) + grey * .35 * this.daylight;
    this.hemiSky.set(0xd3e6f5).lerp(c3.set(0xa6a2c8), this.golden).lerp(c4.set(0x6f86c2), this.night);
    const winter = s.season === 'winter' && s.location === 'hills';
    this.hemiGround.set(winter ? 0xb4c2cb : 0x77734c).lerp(c3.set(0x6e5238), this.golden * .8).lerp(c4.set(0x1d2433), this.night);
    this.exposure = lerp(1, 1.1, this.golden) * (1 - .06 * rain);
    // Distance fog thickens with cloud and rain.
    this.fogNear = lerp(lerp(420, 200, grey), 90, rain); this.fogFar = lerp(lerp(1900, 1400, grey), 850, rain);
  }

  mist(valleyY, cameraY) {
    const h = this.hour, s = this.settings;
    // Some mornings are mistier than others.
    const morning = smooth(4.2, 6.3, h) * (1 - smooth(7.4, 10, h)), luck = .45 + .55 * random(this.days * 7919 + 13)();
    const season = {autumn: 1.2, winter: 1.05, spring: 1, summer: .75}[s.season] || 1;
    const amount = s.location === 'hills' ? clamp(morning * luck * season * (1 - this.rain * .6), 0, 1) : 0;
    this.mistAmount = amount;
    const top = valleyY + 6 + 5 * morning;
    MIST.params[0] = amount * .9; MIST.params[1] = top; MIST.params[2] = 14; MIST.params[3] = 120;
    this.mistTint.copy(this.bottom).lerp(c3.set(0xf1ebe2), .55 * this.daylight).lerp(c4.set(0x8d97a3), .4 * this.night);
    MIST.color[0] = this.mistTint.r; MIST.color[1] = this.mistTint.g; MIST.color[2] = this.mistTint.b;
    MIST.color[3] = amount * smooth(-2, 8, top - cameraY) * .55;
    if (amount > .05) { this.fogNear *= 1 - .45 * amount; this.fogFar *= 1 - .3 * amount; }
  }
}

// Surfaces under cover (tunnel walls, ceilings and the road inside) take no sunlight and only a little of the sky,
// so a tunnel stays dim beyond the reach of the sun's shadow map and is lit by its own lamps.
const SHELTERED_LIGHTS = T.ShaderChunk.lights_fragment_begin
  .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct ) && !defined( SHELTERED )')
  .replace('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );', 'irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal ) * SHELTER_AMBIENT;');
function shelterShader(shader) { shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', SHELTERED_LIGHTS); }
export function sheltered(material, ambient = .22) {
  material.defines = {...material.defines, SHELTERED: '', SHELTER_AMBIENT: ambient.toFixed(3)};
  material.onBeforeCompile = shelterShader; material.customProgramCacheKey = () => 'sheltered';
  material.envMapIntensity = .15;
  return material;
}
