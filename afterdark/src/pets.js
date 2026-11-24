import { animalAssets, animatedAnimal } from '/evermile/animated-assets.js';
import { loadGLB } from './car.js';
import { HALF, P } from './city.js';

// Short sidewalk routes stay within a block. The first pair lives on the starting avenue.
export function buildPets(scene) {
  const residents = [];
  for (const kind of ['cat', 'dog']) {
    loadGLB('/evermile/assets/models/' + animalAssets[kind].file + '.glb').then(asset => {
      const dog = kind === 'dog';
      for (const [index, [street, block]] of [[3, 3], [1, 1], [5, 4], [2, 6], [6, 2], [4, 5]].entries()) {
        const animal = animatedAnimal(asset, kind, index);
        const root = animal.root;
        root.name = 'Sidewalk ' + kind;
        root.position.set(street * P + (dog ? -1 : 1) * (HALF + 3.05), 0.17, block * P + (dog ? 44 : 50));
        root.rotation.y = dog ? 0 : -Math.PI / 3;
        root.visible = false;
        scene.add(root);
        residents.push({ animal, root, dog, start: block * P + 36, end: block * P + 57, direction: 1, wait: index * 0.45 });
      }
    }).catch(error => console.warn('Could not load sidewalk ' + kind, error));
  }
  return (dt, focus) => {
    for (const pet of residents) {
      const { root } = pet;
      root.visible = Math.hypot(root.position.x - focus.x, root.position.z - focus.z) < 115;
      if (!root.visible) continue;
      let speed = 0;
      if (pet.dog && pet.wait <= 0) {
        speed = 0.95;
        root.rotation.y = pet.direction > 0 ? 0 : Math.PI;
        root.position.z += pet.direction * speed * dt;
        if (root.position.z >= pet.end || root.position.z <= pet.start) {
          pet.direction *= -1;
          pet.wait = 2.5;
        }
      } else if (pet.wait > 0) pet.wait -= dt;
      pet.animal.update(dt, speed);
    }
  };
}
