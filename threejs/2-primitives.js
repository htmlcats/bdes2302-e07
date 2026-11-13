import { THREE, scene } from './1-scene.js';

// 2. Add primitives to the existing scene.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({ color: '#8dfb7e', roughness: 1 }),
);
cube.position.set(-3, 0, 0);
cube.rotation.set(0.2, 0.4, 0);
scene.add(cube);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.65, 32, 24),
  new THREE.MeshPhysicalMaterial({
    color: '#c4b5fd', metalness: 0.7, roughness: 0.15, clearcoat: 1,
  }),
);
sphere.position.set(3, 0, 0);
scene.add(sphere);
const grid = new THREE.GridHelper(30, 30, 0x64748b, 0x334155);
grid.position.y = -1;
scene.add(grid);