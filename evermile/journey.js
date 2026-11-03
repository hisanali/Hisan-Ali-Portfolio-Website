// The journey log: how far you have driven over every drive, the longest one, and the places you have found along the way.
// Pure functions over a plain record so the title screen and the milestone toasts can be tested without a browser.
export const KEY = 'evermile-journey';
export const MILESTONES_KM = [5, 10, 25, 50, 100, 200, 500, 1000];

export function emptyJourney() { return {drives: 0, totalKm: 0, longestKm: 0, seconds: 0, places: [], photos: 0}; }

// Loads the log; older saves only kept a running distance, which becomes the lifetime total.
export function loadJourney(storage, legacyKm = 0) {
  let j = emptyJourney();
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const k of ['drives', 'totalKm', 'longestKm', 'seconds', 'photos']) if (Number.isFinite(saved[k]) && saved[k] >= 0) j[k] = saved[k];
      if (Array.isArray(saved.places)) j.places = saved.places.filter((p) => typeof p === 'string').slice(0, 64);
    }
  } catch {}
  if (!j.totalKm && Number.isFinite(legacyKm) && legacyKm > 0) j.totalKm = legacyKm;
  return j;
}

export function saveJourney(storage, journey) { try { storage?.setItem(KEY, JSON.stringify(journey)); } catch {} }

// A new drive starts when the player leaves the title screen; the session record tracks this drive only.
export function startDrive(journey) { journey.drives += 1; return {km: 0, seconds: 0, places: 0, milestone: 0, toBeat: journey.longestKm, beaten: false}; }

// Called every physics step with the distance covered: returns a milestone label when one is crossed this drive.
export function advance(journey, session, metres, dt, units = 'km') {
  const km = Math.max(0, metres) / 1000;
  session.km += km; session.seconds += dt; journey.totalKm += km; journey.seconds += dt;
  let note = null;
  const factor = units === 'mi' ? .621371 : 1, unit = units === 'mi' ? 'mi' : 'km';
  for (const m of MILESTONES_KM) if (session.km >= m && session.milestone < m) { session.milestone = m; note = `${Math.round(m * factor)} ${unit} this drive`; }
  if (session.km > journey.longestKm) journey.longestKm = session.km;
  if (!session.beaten && session.toBeat >= 1 && session.km > session.toBeat) { session.beaten = true; note = 'Your longest drive yet'; }
  return note;
}

// Marks a destination as found; true the first time ever.
export function foundPlace(journey, session, key) {
  if (!key || journey.places.includes(key)) return false;
  journey.places.push(key); session.places += 1; return true;
}

export function clockText(seconds) { const h = Math.floor(seconds / 3600), m = Math.floor(seconds / 60) % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`; }

function distanceText(km, units) { const v = km * (units === 'mi' ? .621371 : 1); return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units === 'mi' ? 'mi' : 'km'}`; }

// The cells shown on the title screen: lifetime first, then this drive while it is paused.
export function summary(journey, session, units = 'km', placeCount = 0) {
  const cells = [];
  if (journey.totalKm >= .05) cells.push({label: 'DRIVEN', value: distanceText(journey.totalKm, units)});
  if (journey.drives > 0) cells.push({label: journey.drives === 1 ? 'DRIVE' : 'DRIVES', value: String(journey.drives)});
  if (journey.longestKm >= .05) cells.push({label: 'LONGEST', value: distanceText(journey.longestKm, units)});
  if (journey.places.length) cells.push({label: 'PLACES FOUND', value: placeCount ? `${journey.places.length} / ${placeCount}` : String(journey.places.length)});
  const drive = session && session.km >= .05 ? `This drive · ${distanceText(session.km, units)} · ${clockText(session.seconds)}${session.places ? ` · ${session.places} new ${session.places === 1 ? 'place' : 'places'}` : ''}` : '';
  return {cells, drive};
}
