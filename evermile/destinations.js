// Original destinations inspired by the supplied reference images, not geographic replicas.
export const DESTINATIONS = {
  journey: {name: 'Endless journey', detail: 'The original open road', type: 'country'},
  airport: {name: 'Escobar Airport', detail: 'Glass terminal · palms · arrivals', type: 'country', time: 'sunset'},
  neon: {name: 'Ocean Drive', detail: 'Art deco hotels · neon · ocean', type: 'coast', time: 'sunset'},
  oldtown: {name: 'Adriatic Old Town', detail: 'Stone ramparts · terracotta · harbour', type: 'coast', time: 'day'},
  estate: {name: 'Cypress Estate', detail: 'Arched villas · rain · warm courtyards', type: 'country', time: 'sunset'},
  palms: {name: 'Palm Hills', detail: 'Palm avenues · gardens · hillside homes', type: 'country', time: 'sunset'},
  pier: {name: 'Pacific Pier', detail: 'Ferris wheel · coaster · boardwalk', type: 'coast', time: 'sunset'},
  villa: {name: 'Azure Retreat', detail: 'Glass villas · infinity pools · coast', type: 'coast', time: 'sunset'},
  lake: {name: 'Silverpine Lake', detail: 'Woodland · mountain lake · timber jetties', type: 'coast', time: 'day'},
};
export const DISTRICT_END = 1080;
export function inDestination(settings, z) { return settings.location === 'hills' && settings.destination && settings.destination !== 'journey' && z > -180 && z < DISTRICT_END; }
