// The phone (map, journey, jobs, postcards, home) and today's road: the snapshot the phone draws, opening and
// closing it, and the shared board. Split out of main.js; the game hands in its live state through initPhone.
import {DESTINATIONS} from './destinations.js?v=20260927-train1';
import {summary, bagText, saveJourney, dropJob, dailySeed, recordDaily, dailyBest, timeLeft, loadPostcards} from './journey.js?v=20261105-explore1';
import {renderPhone} from './phone.js?v=20261105-explore1';
import {fetchBoard, submitDrive} from './leaderboard.js?v=20261105-life1';
let g = null, phoneTab = 'map';
export function initPhone(game) { g = game; }
/* ---------- The phone: map, g.journey, jobs, home; the daily road ---------- */
// The next town with a different name from the one you are in, scanning the road ahead.
export function nextTownName(fromZ) { const r = g.world.road, here = r.townAt(fromZ); for (let z = fromZ + 150; z < fromZ + 9000; z += 100) { const t = r.townAt(z); if (t && z >= t.start && z <= t.end && t !== here && t.name !== here?.name) return t.name; } return null; }
export function townDistanceM(name, z0) { if (!name) return 0; const r = g.world.road; for (let z = z0; z < z0 + 9000; z += 50) { const t = r.townAt(z); if (t && t.name === name && z >= t.start) return Math.max(0, t.start - z0); } return 0; }
export function distanceToTown(name) { const r = g.world.road, z0 = g.state.onFoot ? g.walker.z : g.state.z; for (let z = z0; z < z0 + 9000; z += 100) { const t = r.townAt(z); if (t && t.name === name && z >= t.start) return `${((Math.max(t.start, z0) - z0) / 1000 * (g.settings.units === 'mi' ? .621371 : 1)).toFixed(1)} ${g.settings.units === 'mi' ? 'mi' : 'km'}`; } return null; }
export function noteDaily() { const d = dailySeed(); if (g.settings.seed === d.seed && g.session && !(g.state.crashes > 0)) { if (recordDaily(g.journey, d.date, g.session.km)) saveJourney(g.storage, g.journey); } }
export function phoneSnapshot() {
  const r = g.world.road, z0 = g.state.onFoot ? g.walker.z : g.state.z, x0 = r.x(z0), span = 3000, marks = [];
  for (const j of r.junctions) if (j.z > z0 - 50 && j.z < z0 + span) { const places = j.options.map((o) => o.district ? DESTINATIONS[o.district]?.name : null).filter(Boolean); marks.push({z: j.z, dx: 0, kind: 'junction', label: places.length ? places.join(' / ') : 'Junction'}); }
  const seenTowns = new Set(); for (let z = z0; z < z0 + span; z += 100) { const t = r.townAt(z); if (t && z >= t.start && z <= t.end && !seenTowns.has(t.name)) { seenTowns.add(t.name); marks.push({z: Math.max(t.start, z0), dx: 0, kind: 'town', label: t.name}); } }
  for (const st of r.stopsNear(z0 + span / 2, span / 2)) if (st.z > z0 && st.kind !== 'view') marks.push({z: st.z, dx: st.side * 20, kind: 'stop', label: st.kind === 'fuel' ? 'Petrol' : 'Café'});
  if (g.journey.home && g.journey.home.world === g.worldKey() && Math.abs(g.journey.home.z - z0) < span) marks.push({z: g.journey.home.z, dx: g.journey.home.x - r.x(g.journey.home.z), kind: 'home', label: 'Home'});
  marks.sort((a, b) => a.z - b.z);
  const j = r.junctionAhead(z0, 3000), note = j ? `Next junction in ${((j.z - z0) / 1000).toFixed(1)} km${j.options.some((o) => o.district) ? ': ' + j.options.map((o) => o.district ? DESTINATIONS[o.district].name : 'straight on').join(' or ') : ''}.` : 'Open road ahead.';
  const sum = summary(g.journey, g.session, g.settings.units, Object.keys(DESTINATIONS).length);
  const d = dailySeed(), best = dailyBest(g.journey, d.date), daily = g.settings.seed === d.seed ? `Today’s road · best crash-free drive ${best ? best.toFixed(1) + ' km' : 'not set yet'}` : `Today’s road is in the World panel${best ? ` · your best today ${best.toFixed(1)} km` : ''}`;
  const home = g.journey.home && g.journey.home.world === g.worldKey() ? {text: `${(Math.hypot(g.journey.home.x - x0, g.journey.home.z - z0) / 1000).toFixed(1)} km away, ${g.journey.home.z < z0 ? 'back the way you came' : 'up the road'}.`, homecomings: g.journey.homecomings} : null;
  return {clock: g.atmo.clock, map: {z0, span, road: (z) => r.x(z) - x0, marks, note}, journey: {cells: sum.cells, drive: sum.drive, money: g.journey.money, bag: bagText(g.journey), photos: g.journey.photos, jobsDone: g.journey.jobsDone, crashes: g.state.crashes || 0, knockdowns: g.state.knockdowns || 0}, job: g.journey.job ? {...g.journey.job, distance: g.journey.job.town ? distanceToTown(g.journey.job.town) : null, left: timeLeft(g.journey)} : null, postcards: Object.entries(loadPostcards(g.storage)).map(([k, src]) => ({name: DESTINATIONS[k]?.name || k, src})), pay: {delivery: 15, taxi: 12}, home, daily};
}
export function openPhone(tab = phoneTab) {
  if (!g.state.started) return; phoneTab = tab; g.cardOpen = true; const card = g.$('phone-card');
  const snap = phoneSnapshot(); snap.board = phoneBoard;
  renderPhone(card, snap, tab, {tab: (t) => openPhone(t), act: (a, value) => {
    if (a === 'drop') { dropJob(g.journey); saveJourney(g.storage, g.journey); g.toast('Job given up'); openPhone('jobs'); }
    if (a === 'submit') { const d = dailySeed(), km = dailyBest(g.journey, d.date), name = String(value || '').trim(); if (!name) { g.toast('Give yourself a name first'); return; } try { localStorage.setItem('evermile-name', name); } catch {} submitDrive(d.date, name, km).then((r) => { g.toast(r.ok ? 'Your drive is on today’s board' : `Couldn’t submit: ${r.why}`); if (r.ok) loadBoard(true); }); }
  }, close: closePhone}); card.hidden = false;
  if (tab === 'home') loadBoard();
}
let phoneBoard = null, boardLoadedFor = null;
export function loadBoard(force = false) { const d = dailySeed(); if (!force && boardLoadedFor === d.date) return; boardLoadedFor = d.date; phoneBoard = {loading: true, rows: [], name: (() => { try { return localStorage.getItem('evermile-name') || ''; } catch { return ''; } })()}; fetchBoard(d.date).then((r) => { phoneBoard = {loading: false, ok: r.ok, rows: r.rows, why: r.why, name: phoneBoard.name}; if (!g.$('phone-card').hidden && phoneTab === 'home') openPhone('home'); }); }
export function closePhone() { g.$('phone-card').hidden = true; g.cardOpen = false; document.activeElement?.blur?.(); }
