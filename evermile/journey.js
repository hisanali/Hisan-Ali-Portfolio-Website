// The journey log: how far you have driven over every drive, the longest one, and the places you have found along the way.
// Pure functions over a plain record so the title screen and the milestone toasts can be tested without a browser.
export const KEY = 'evermile-journey';
export const MILESTONES_KM = [5, 10, 25, 50, 100, 200, 500, 1000];

export function emptyJourney() { return {drives: 0, totalKm: 0, longestKm: 0, seconds: 0, places: [], photos: 0, money: 20, bag: {}, bought: 0, job: null, jobsDone: 0, earnedFromJobs: 0, home: null, homecomings: 0, daily: {}}; }
// What the shops sell. Prices in the game's coins, earned by driving (one a kilometre) and finding places.
export const GOODS = {coffee: {name: 'Coffee', price: 2, kind: 'now', text: 'Twenty minutes with a coffee.'}, tea: {name: 'Tea', price: 2, kind: 'now', text: 'A quiet pot of tea.'}, snack: {name: 'Sandwich', price: 3, kind: 'now', text: 'That hit the spot.'}, cake: {name: 'Slice of cake', price: 3, kind: 'now', text: 'Worth the stop.'}, icecream: {name: 'Ice cream', price: 2, kind: 'now', text: 'Cold and sweet.'}, pizza: {name: 'Pizza slice', price: 4, kind: 'now', text: 'Hot and cheesy.'}, paper: {name: 'Newspaper', price: 1, kind: 'now', text: 'The local news.'}, flowers: {name: 'Flowers', price: 4, kind: 'keep', text: 'A bunch for the dashboard.'}, book: {name: 'Paperback', price: 5, kind: 'keep', text: 'Something for the viewpoints.'}, fuelcan: {name: 'Fuel can', price: 12, kind: 'keep', text: 'Twenty litres for a car that ran dry.'}, washtoken: {name: 'Car wash token', price: 6, kind: 'keep', text: 'A wash and the dents beaten out, at any petrol station.'}, map: {name: 'Road map', price: 5, kind: 'keep', text: 'Shows the places ahead on the junction signs.'}, haircut: {name: 'Haircut', price: 8, kind: 'now', text: 'Looking sharp.'}, plaster: {name: 'Plasters', price: 2, kind: 'keep', text: 'For the next knock.'}, bulb: {name: 'Headlight bulb', price: 4, kind: 'keep', text: 'Spare, just in case.'}};
// Which goods each kind of shop stocks.
export const STOCK = {'CAFÉ AROMA': ['coffee', 'tea', 'cake', 'snack'], 'TEA HOUSE': ['tea', 'cake', 'coffee'], BAKERY: ['cake', 'snack', 'coffee'], 'MINI MARKET': ['snack', 'paper', 'fuelcan', 'washtoken', 'map'], GROCERY: ['snack', 'paper', 'fuelcan', 'map'], PHARMACY: ['plaster', 'paper'], 'BOOKS & CO': ['book', 'paper', 'map'], PIZZA: ['pizza', 'snack'], FLOWERS: ['flowers'], HARDWARE: ['fuelcan', 'washtoken', 'bulb', 'map'], TAILOR: ['paper'], 'FRESH FRUIT': ['snack', 'icecream'], 'ICE CREAM': ['icecream', 'coffee'], BARBER: ['haircut', 'paper'], ELECTRONICS: ['bulb', 'map'], SWEETS: ['cake', 'icecream', 'snack'], 'PETROL STATION': ['fuelcan', 'washtoken', 'coffee', 'snack', 'map', 'paper'], 'ROADSIDE CAFÉ': ['coffee', 'tea', 'cake', 'snack', 'paper']};

// Loads the log; older saves only kept a running distance, which becomes the lifetime total.
export function loadJourney(storage, legacyKm = 0) {
  let j = emptyJourney();
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const k of ['drives', 'totalKm', 'longestKm', 'seconds', 'photos', 'money', 'bought']) if (Number.isFinite(saved[k]) && saved[k] >= 0) j[k] = saved[k];
      if (saved.bag && typeof saved.bag === 'object') for (const [k, v] of Object.entries(saved.bag)) if (GOODS[k] && Number.isInteger(v) && v > 0) j.bag[k] = Math.min(9, v);
      for (const k of ['jobsDone', 'earnedFromJobs', 'homecomings']) if (Number.isFinite(saved[k]) && saved[k] >= 0) j[k] = saved[k];
      if (saved.job && typeof saved.job === 'object' && typeof saved.job.town === 'string' && Number.isFinite(saved.job.pay)) j.job = {kind: saved.job.kind === 'taxi' ? 'taxi' : 'delivery', town: saved.job.town, pay: saved.job.pay, from: typeof saved.job.from === 'string' ? saved.job.from : '', passenger: typeof saved.job.passenger === 'string' ? saved.job.passenger : null};
      if (saved.home && typeof saved.home === 'object' && Number.isFinite(saved.home.x) && Number.isFinite(saved.home.z)) j.home = {x: saved.home.x, z: saved.home.z, world: String(saved.home.world || '')};
      if (saved.daily && typeof saved.daily === 'object') for (const [d, v] of Object.entries(saved.daily)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(v) && v >= 0) j.daily[d] = v;
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
  journey.earned = (journey.earned || 0) + km; while (journey.earned >= 1) { journey.earned -= 1; journey.money += 1; }
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
  journey.places.push(key); session.places += 1; journey.money += 10; return true;
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

// Buying: enough money, and only things a shop stocks. Things used now are used; things kept go in the bag.
export function buy(journey, item, shop) {
  const g = GOODS[item]; if (!g) return {ok: false, why: 'Not sold here'};
  if (shop && !(STOCK[shop] || []).includes(item)) return {ok: false, why: 'Not sold here'};
  if (journey.money < g.price) return {ok: false, why: `You need ${g.price - journey.money} more`};
  if (g.kind === 'keep' && (journey.bag[item] || 0) >= 9) return {ok: false, why: 'The bag is full of those'};
  journey.money -= g.price; journey.bought += 1;
  if (g.kind === 'keep') journey.bag[item] = (journey.bag[item] || 0) + 1;
  return {ok: true, text: g.text, kind: g.kind};
}
export function useItem(journey, item) { if (!(journey.bag[item] > 0)) return false; journey.bag[item] -= 1; if (!journey.bag[item]) delete journey.bag[item]; return true; }
export function bagText(journey) { const parts = Object.entries(journey.bag).map(([k, n]) => `${GOODS[k].name}${n > 1 ? ' ×' + n : ''}`); return parts.length ? parts.join(' · ') : 'Nothing yet'; }

// Jobs: a parcel to deliver to a named town for a shop, or a passenger who wants a lift there. One at a time.
export function offerJob(journey, kind, town, from, passenger = null) {
  if (journey.job || !town) return null;
  journey.job = {kind: kind === 'taxi' ? 'taxi' : 'delivery', town, pay: kind === 'taxi' ? 12 : 15, from: from || '', passenger};
  return journey.job;
}
// Done when the car has stopped in the job's town.
export function completeJob(journey, townName, speed) {
  const job = journey.job; if (!job || !townName || townName !== job.town || Math.abs(speed) > 1) return null;
  journey.money += job.pay; journey.jobsDone += 1; journey.earnedFromJobs += job.pay; journey.job = null;
  return job;
}
export function dropJob(journey) { const j = journey.job; journey.job = null; return j; }
// Home: where this world's first drive began. Coming home (stopping within reach) is noted and paid a little.
export function setHome(journey, x, z, world) { if (!journey.home || journey.home.world !== world) journey.home = {x, z, world}; return journey.home; }
export function atHome(journey, x, z, world, reach = 28) { const h = journey.home; return !!h && h.world === world && Math.hypot(h.x - x, h.z - z) < reach; }
export function cameHome(journey) { journey.homecomings += 1; journey.money += 5; return journey.homecomings; }
// The daily road: a seed for the date, and the best crash-free distance driven on it, kept locally.
export function dailySeed(date = new Date()) { const d = date.toISOString().slice(0, 10); return {seed: 'daily-' + d, date: d}; }
export function recordDaily(journey, date, km) { const best = journey.daily[date] || 0; if (km > best) { journey.daily[date] = km; return true; } return false; }
export function dailyBest(journey, date) { return journey.daily[date] || 0; }
