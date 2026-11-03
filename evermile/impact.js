// Collisions with weight. Everything solid has a mass: the car is only pushed by what outweighs it, people and
// animals are knocked aside rather than shoving a tonne and a half of car, and a wall takes the speed out of you
// along its normal (with a small bounce) instead of freezing the car in place. Pure functions, tested in node.
export const MASS = {person: 80, cat: 5, fox: 8, dog: 25, bighorn: 90, horse: 550, cow: 650, car: 1500, van: 2400, truck: 7500, bus: 12000, train: 90000};
export const PLAYER_MASS = {coupe: 1480, grcorolla: 1475, landcruiser: 2500, mercedes: 1220, coach: 11500, bike: 270};

// Mass of a collider: people and animals by kind, traffic by its vehicle kind, everything else is part of the world.
export function massOf(k) {
  if (!k) return Infinity;
  if (k.person) return MASS.person;
  if (k.animal) return MASS[k.kind || k.animal.kind] ?? 60;
  if (k.vehicle) return MASS[k.vehicle.kind] ?? MASS.car;
  if (k.train) return MASS.train;
  return Infinity;
}

// The share of an overlap the car takes on: none of a pedestrian, half of an equal car, all of a wall.
export function pushShare(mass, playerMass = 1480) { return mass === Infinity ? 1 : mass / (mass + playerMass); }

// Sample points round the body: the four corners (inset by the contact radius), the middles of each side and the
// nose and tail, in body coordinates (along, lateral). Corners mean the car can no longer slip into a building at an angle.
export function bodyPoints(width, length, radius) {
  const a = Math.max(0, length / 2 - radius), l = Math.max(0, width / 2 - radius), out = [];
  for (const s of [-1, 1]) { out.push({along: a * s, lateral: l}, {along: a * s, lateral: -l}, {along: a * s, lateral: 0}); }
  out.push({along: 0, lateral: l}, {along: 0, lateral: -l});
  if (length > 6) for (const f of [-.5, .5]) out.push({along: a * f, lateral: l}, {along: a * f, lateral: -l});
  return out;
}

// Speed after a contact. `approach` is the closing speed into the obstacle (m/s, positive when moving into it),
// `cos` the cosine between travel and the contact normal, `share` the car's share of the mass. A head-on hit with
// a wall leaves a small rebound; a glancing one scrubs off a little speed; a pedestrian barely slows the car.
export function respond({speed, approach, cos, share, restitution = .1}) {
  if (approach <= 0 || speed === 0) return {speed, loss: 0};
  const c = Math.min(1, Math.max(0, cos)), s = Math.sqrt(1 - c * c);
  const loss = (1 + restitution) * c * c * share + .35 * c * s * share;
  const next = speed * Math.max(-restitution, 1 - loss);
  return {speed: Math.abs(next) < .05 ? 0 : next, loss};
}

// How hard a hit feels in the car: closing speed weighted by what you hit. Running into a lamppost at 50 km/h is a
// crash; brushing a dog at the same speed is a bump for the car (and a very bad day for the dog).
export function severity(approach, share) { return Math.max(0, approach) * (share === 1 ? 1 : Math.max(.08, share)); }

// Body jolt for a hit: nose dips on a frontal hit, the body rolls away from a side hit. Radians, decays in updateCar.
export function jolt(sev, cos, side) { const k = Math.min(1, sev / 12); return {pitch: -k * .09 * Math.max(0, cos), roll: -Math.sign(side) * k * .07 * Math.sqrt(Math.max(0, 1 - cos * cos))}; }
