// Original destinations inspired by the supplied reference images, not geographic replicas.
export const DESTINATIONS = {
  journey: {name: 'Endless journey', detail: 'The open road, with every place along it', type: 'country'},
  airport: {name: 'Escobar Airport', detail: 'Glass terminal · palms · arrivals', type: 'country', time: 'sunset'},
  neon: {name: 'Ocean Drive', detail: 'Art deco hotels · neon · ocean', type: 'coast', time: 'sunset'},
  oldtown: {name: 'Adriatic Old Town', detail: 'Stone ramparts · terracotta · harbour', type: 'coast', time: 'day'},
  estate: {name: 'Cypress Estate', detail: 'Arched villas · rain · warm courtyards', type: 'country', time: 'sunset'},
  palms: {name: 'Palm Hills', detail: 'Palm avenues · gardens · hillside homes', type: 'country', time: 'sunset'},
  pier: {name: 'Pacific Pier', detail: 'Ferris wheel · coaster · boardwalk', type: 'coast', time: 'sunset'},
  villa: {name: 'Azure Retreat', detail: 'Glass villas · infinity pools · coast', type: 'coast', time: 'sunset'},
  lake: {name: 'Silverpine Lake', detail: 'Woodland · mountain lake · timber jetties', type: 'coast', time: 'day'},
  city: {name: 'Eastgate City', detail: 'Tower blocks · shopfronts · busy pavements', type: 'country', time: 'day'},
  forest: {name: 'Pinecrest Forest', detail: 'Tall pines · mossy boulders · a quiet road', type: 'country', time: 'day'},
};
// A district runs from 180 m before its local origin to DISTRICT_END after it. On the endless road every district
// sits on the road network itself, reached by junctions like any other place; its origin is aligned to this grid.
export const DISTRICT_END = 1080, DISTRICT_START = -180, DISTRICT_GRID = 240;
// Road height through each district (the coast sits a few metres above the sea at -8).
export const DISTRICT_LEVEL = {lake: -3, oldtown: 1.5};
export const PLACE_KINDS = Object.keys(DESTINATIONS).filter((k) => k !== 'journey');
