// Interface wiring. Kept deliberately small: one bar, a few popovers, and it gets out of the way.
import { PRESETS, TIMES } from './weather.js';

const $ = (s) => document.querySelector(s);
export class UI {
  constructor(app, worlds) {
    this.app = app; this.worlds = worlds; this.idle = 0; this.hidden = false; this.open = null; this.titleT = 0;
    const wl = $('#worlds');
    worlds.forEach((w, i) => { const b = document.createElement('button'); b.dataset.world = w.id; b.innerHTML = `<b>${w.name}</b><span>${w.line}</span>`; b.onclick = () => { this.pop(null); app.loadWorld(w.id); }; wl.appendChild(b); });
    const tc = $('#timeChips'); for (const [k, v] of Object.entries(TIMES)) { const b = document.createElement('button'); b.dataset.time = k; b.textContent = v; b.onclick = () => { app.env.timeSpeed = 0; this.flow(0); app.env.setTime(k); this.mark('#timeChips', b); $('#timeLbl').textContent = v; }; tc.appendChild(b); }
    const wc = $('#wxChips'); for (const [k, v] of Object.entries(PRESETS)) { const b = document.createElement('button'); b.dataset.wx = k; b.textContent = v.label; b.onclick = () => { app.env.setPreset(k); this.syncWeather(); }; wc.appendChild(b); }
    document.querySelectorAll('#bar [data-pop]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); this.pop(this.open === b.dataset.pop ? null : b.dataset.pop); });
    document.querySelectorAll('#bar [data-mode]').forEach((b) => b.onclick = () => { this.pop(null); app.rig.setMode(b.dataset.mode); if (b.dataset.mode === 'explore' && !app.noLock) app.renderer.domElement.requestPointerLock?.(); });
    document.querySelectorAll('#poi [data-poi]').forEach((b) => b.onclick = () => app.rig.nextPoi(+b.dataset.poi));
    document.querySelectorAll('#flowChips button').forEach((b) => b.onclick = () => { app.env.hourTarget = null; app.env.timeSpeed = +b.dataset.flow; this.flow(+b.dataset.flow); });
    $('#hour').oninput = (e) => { app.env.hourTarget = null; app.env.hour = +e.target.value % 24; this.mark('#timeChips', null); };
    $('#wind').oninput = (e) => { app.env.windUser = +e.target.value; };
    $('#windAuto').onclick = () => { app.env.windUser = null; };
    $('#vol').oninput = (e) => { app.sound.setVolume(+e.target.value); if (app.sound.muted) this.mute(false); };
    $('#mute').onclick = () => this.mute(!app.sound.muted);
    $('#enter').onclick = () => { app.entered = true; app.sound.start(); this.veil(false); };
    document.querySelectorAll('.pop').forEach((p) => p.addEventListener('mousedown', (e) => e.stopPropagation()));
    addEventListener('mousedown', () => this.pop(null));
    const wake = () => { this.idle = 0; document.body.classList.remove('idle'); };
    addEventListener('mousemove', wake); addEventListener('touchstart', wake, { passive: true }); addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return; wake();
      if (e.code.startsWith('Digit')) { const i = +e.code.slice(5) - 1; if (worlds[i]) app.loadWorld(worlds[i].id); }
      if (e.code === 'KeyT') app.rig.setMode('tour'); if (e.code === 'KeyO') app.rig.setMode('orbit'); if (e.code === 'KeyX') app.rig.setMode('explore');
      if (e.code === 'KeyH') { this.hidden = !this.hidden; } if (e.code === 'KeyM') this.mute(!app.sound.muted); if (e.code === 'Escape') this.pop(null);
    });
    app.rig.onMode = (m) => this.syncMode(m); app.rig.onPoi = (p) => { $('#poi span').textContent = p.name || ''; };
    if (new URLSearchParams(location.search).has('noui')) { this.hidden = true; document.body.classList.add('idle'); }
    this.syncMode(app.rig.mode);
  }
  mark(sel, btn) { document.querySelectorAll(sel + ' button').forEach((b) => b.classList.toggle('on', b === btn)); }
  flow(v) { document.querySelectorAll('#flowChips button').forEach((b) => b.classList.toggle('on', +b.dataset.flow === v)); }
  mute(m) { this.app.sound.setMuted(m); $('#mute').classList.toggle('on', m); $('#mute').textContent = m ? 'Muted' : 'Mute'; $('#sndWave').style.display = m ? 'none' : ''; }
  pop(id) { this.open = id; document.querySelectorAll('.pop').forEach((p) => p.classList.toggle('show', p.id === id)); document.querySelectorAll('#bar [data-pop]').forEach((b) => b.classList.toggle('open', b.dataset.pop === id)); }
  toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('show'), 1600); }
  syncMode(m) { document.querySelectorAll('#bar [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m)); $('#poi').classList.toggle('show', m === 'orbit' && (this.app.world?.pois?.length || 0) > 1); }
  syncWeather() { const k = this.app.env.preset; document.querySelectorAll('#wxChips button').forEach((b) => b.classList.toggle('on', b.dataset.wx === k)); $('#wxLbl').textContent = PRESETS[k]?.label || ''; }
  setWorld(meta) {
    $('#worldName').textContent = meta.name; $('#title h1').textContent = meta.name; $('#title p').textContent = meta.line; $('#title').classList.remove('faded'); this.titleT = 9;
    document.querySelectorAll('#worlds button').forEach((b) => b.classList.toggle('on', b.dataset.world === meta.id));
    this.syncWeather(); this.syncMode(this.app.rig.mode); const p = this.app.rig.poi(); $('#poi span').textContent = p.name || '';
    this.mark('#timeChips', null);
  }
  veil(show, title, text) { const v = $('#veil'); if (show) { v.classList.remove('hide', 'ready'); if (title) { $('#vTitle').textContent = title; $('#vText').textContent = text; $('#vSmall').style.display = 'none'; } $('#vBar').style.width = '4%'; } else v.classList.add('hide'); }
  veilReady() { $('#veil').classList.add('ready'); $('#vTitle').textContent = 'Eight Worlds'; $('#vText').textContent = 'A ship at sea, and seven places to make landfall.'; $('#vSmall').style.display = ''; }
  progress(k) { $('#vBar').style.width = Math.round(k * 100) + '%'; }
  tick(dt) {
    const env = this.app.env; this.idle += dt; this.titleT -= dt;
    if (this.titleT < 0) $('#title').classList.add('faded');
    if ((this.idle > 5 && !this.open) || this.hidden) document.body.classList.add('idle');
    if (this.open === 'pTime' || (this._hf = (this._hf || 0) + 1) % 20 === 0) {
      const h = env.hour; $('#hour').value = h; const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); $('#hourOut').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
      const el = env.sunElev * 57.3; $('#timeLbl').textContent = el < -8 ? 'Night' : el < -1 ? 'Blue hour' : el < 7 ? (h < 12 ? 'Sunrise' : 'Sunset') : 'Day';
    }
    if (this.open === 'pWind') { const w = env.windUser ?? env.w.wind; if (document.activeElement !== $('#wind')) $('#wind').value = w; $('#windOut').textContent = Math.round(w * 45) + ' kn'; }
    if (this.open === 'pSound') $('#volOut').textContent = Math.round(this.app.sound.volume * 100) + '%';
  }
}
