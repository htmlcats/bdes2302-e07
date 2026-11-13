import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Scene, camera, renderer, lights, and orbit controls. No objects yet.
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101827');
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.domElement.id = 'scene';
renderer.domElement.setAttribute('aria-label', 'Full-screen 3D scene');
renderer.domElement.style.cssText = 'position:fixed;inset:0;display:block';
document.body.style.margin = '0';
document.body.append(renderer.domElement);
const rendering = {
  render: () => renderer.render(scene, camera),
  resize: () => {},
};

scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 3));
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 5, 4);
scene.add(light);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  rendering.resize(innerWidth, innerHeight);
}
window.addEventListener('resize', resize);
resize();

// Later steps add updates here instead of starting additional render loops.
const updates = [];
const focus = new THREE.Vector3();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = true;
controls.minDistance = 2;
controls.maxDistance = 12;
const clock = new THREE.Clock();
renderer.setAnimationLoop((now) => {
  const delta = Math.min(clock.getDelta(), 0.1);
  for (const update of updates) update(delta, now);
  if (controls.enabled) controls.update();
  rendering.render(delta);
});

export { THREE, scene, camera, renderer, focus, updates, controls, rendering };
