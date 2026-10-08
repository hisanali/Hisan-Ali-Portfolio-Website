// Generates public/insights/world.json: projected country outlines and city positions for the admin map.
// The admin CSP blocks third-party map tiles, so the geometry is self-hosted. Regenerate with:
//   npm i --no-save d3-geo@3 topojson-client@3 world-atlas@2 i18n-iso-countries@7 all-the-cities@3
//   node scripts/build-admin-map.mjs
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topology = require('world-atlas/countries-110m.json');
const iso = require('i18n-iso-countries');
const cities = require('all-the-cities');

const width = 1000, height = 500;
const land = feature(topology, topology.objects.countries);
land.features = land.features.filter(country => country.id !== '010'); // Antarctica only wastes space
const projection = geoNaturalEarth1().fitExtent([[4, 4], [width - 4, height - 4]], land);
const path = geoPath(projection).digits(1);
const round = point => point.map(value => Math.round(value * 10) / 10);

const countries = [];
for (const country of land.features) {
  const id = country.id === '-99' ? null : iso.numericToAlpha2(country.id);
  if (!id) continue;
  // Place the label/fallback dot on the largest polygon, so e.g. France is not centred in the Atlantic.
  const polygons = country.geometry.type === 'MultiPolygon' ? country.geometry.coordinates.map(coordinates => ({ type: 'Polygon', coordinates })) : [country.geometry];
  const largest = polygons.reduce((best, polygon) => path.area(polygon) > path.area(best) ? polygon : best);
  countries.push({ id, n: country.properties.name, d: path(country), c: round(path.centroid(largest)) });
}

// Small states (e.g. Bahrain, Singapore) are absent at 110m; place them as a dot at their capital.
const present = new Set(countries.map(country => country.id));
const dots = {};
for (const city of cities) if (city.featureCode === 'PPLC' && !present.has(city.country) && iso.getName(city.country, 'en') && !dots[city.country]) dots[city.country] = { n: iso.getName(city.country, 'en'), c: round(projection(city.loc.coordinates)) };

const key = (name, country) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + '|' + country;
const gcc = new Set(['OM', 'AE', 'SA', 'QA', 'KW', 'BH']);
const places = {};
for (const city of cities.slice().sort((a, b) => b.population - a.population)) {
  const keep = city.population >= 100000 || (gcc.has(city.country) && city.population >= 5000) || (city.country === 'IN' && city.population >= 50000);
  if (!keep) continue;
  const id = key(city.name, city.country);
  if (!places[id]) places[id] = round(projection(city.loc.coordinates));
}
await writeFile('public/insights/world.json', JSON.stringify({ width, height, countries, dots, cities: places }));
console.log(`Wrote ${countries.length} countries, ${Object.keys(dots).length} small-state dots and ${Object.keys(places).length} cities.`);
