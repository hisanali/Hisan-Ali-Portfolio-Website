// Your phone: a card with the map of the road ahead, the journey log, your jobs, and home. It only draws; the game
// hands it a snapshot each time it opens or a tab changes.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// The map: the road ahead as a ribbon with the next junctions, their signposted places, towns and stops, and home.
function mapSvg(snap) {
  const W = 320, H = 300, span = snap.map.span || 3000, y = (z) => H - 30 - ((z - snap.map.z0) / span) * (H - 60), x = (dx) => W / 2 + Math.max(-110, Math.min(110, dx * .6));
  let path = ''; for (let i = 0; i <= 40; i++) { const z = snap.map.z0 + span * i / 40, px = x(snap.map.road(z)); path += (i ? ' L' : 'M') + px.toFixed(1) + ' ' + y(z).toFixed(1); }
  const marks = snap.map.marks.map((m) => { const py = y(m.z), px = x(m.dx || 0); const label = `<text x="${(px + 10).toFixed(0)}" y="${(py + 4).toFixed(0)}" font-size="10" fill="#e5edcc" font-family="DM Mono, monospace">${esc(m.label)}</text>`; return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${m.kind === 'junction' ? 5 : 4}" fill="${m.kind === 'town' ? '#f2b705' : m.kind === 'junction' ? '#9fe0e8' : m.kind === 'home' ? '#ffb48c' : '#cfd8dc'}"/>${label}`; }).join('');
  const you = `<circle cx="${x(0).toFixed(1)}" cy="${y(snap.map.z0).toFixed(1)}" r="6" fill="#e5edcc" stroke="#263933" stroke-width="2"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;border-radius:12px;background:#1b2b28"><path d="${path}" stroke="#58706a" stroke-width="10" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#e5edcc33" stroke-width="1" fill="none" stroke-dasharray="6 6"/>${marks}${you}</svg>`;
}

export function renderPhone(card, snap, tab, handlers) {
  const tabs = ['map', 'journey', 'jobs', 'home'];
  const nav = tabs.map((t) => `<button data-tab="${t}" class="${t === tab ? 'on' : ''}">${t.toUpperCase()}</button>`).join('');
  let body = '';
  if (tab === 'map') body = mapSvg(snap) + `<p class="hint">${esc(snap.map.note)}</p>`;
  if (tab === 'journey') body = `<div class="stats">${snap.journey.cells.map((c) => `<span><b>${esc(c.value)}</b><small>${esc(c.label)}</small></span>`).join('')}</div><p class="hint">${esc(snap.journey.drive || 'Not far yet today.')}</p><p class="hint">Coins ${snap.journey.money} · Bag: ${esc(snap.journey.bag)}</p><p class="hint">Photos ${snap.journey.photos} · Jobs done ${snap.journey.jobsDone} · Crashes this drive ${snap.journey.crashes} · Knocked over ${snap.journey.knockdowns}</p>`;
  if (tab === 'jobs') body = snap.job ? `<p><b>${snap.job.kind === 'taxi' ? `Lift for ${esc(snap.job.passenger || 'a passenger')}` : `Parcel from ${esc(snap.job.from || 'the shop')}`}</b></p><p class="hint">To ${esc(snap.job.town)} · ${snap.job.pay} coins when you stop there${snap.job.distance != null ? ` · ${snap.job.distance}` : ''}</p><div class="row"><button data-act="drop">Give it up</button></div>` : `<p class="hint">No job on. Ask a shopkeeper about deliveries, or offer someone waiting at a bus stop a lift. Jobs pay ${snap.pay.delivery} and ${snap.pay.taxi} coins.</p>`;
  if (tab === 'home') body = snap.home ? `<p><b>Home</b></p><p class="hint">${esc(snap.home.text)}</p>${snap.home.canSet ? '' : ''}<p class="hint">Park within sight of home and get out to come home. Homecomings so far: ${snap.home.homecomings}.</p>` : `<p class="hint">Home is where this road began. Drive back there, park, and get out.</p>`;
  body += `<p class="hint">${esc(snap.daily)}</p>`;
  card.innerHTML = `<small>YOUR PHONE · ${esc(snap.clock)}</small><div class="tabs">${nav}</div>${body}<div class="row"><button data-close="1" class="primary">Put away</button></div>`;
  for (const b of card.querySelectorAll('[data-tab]')) b.onclick = () => handlers.tab(b.dataset.tab);
  for (const b of card.querySelectorAll('[data-act]')) b.onclick = () => handlers.act(b.dataset.act);
  card.querySelector('[data-close]').onclick = handlers.close;
}
