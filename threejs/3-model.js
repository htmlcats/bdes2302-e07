import { THREE, scene, focus, updates, controls } from './1-scene.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 3. Add a GLB in the middle; the primitives and render loop stay unchanged.
const credit = document.createElement('p');
credit.className = 'fixed bottom-4 left-4 text-xs text-slate-400';
credit.innerHTML = '<a href="https://sketchfab.com/models/94b24a60dc1b48248de50bf087c0f042">Littlest Tokyo by glenatron</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
document.body.append(credit);

async function loadModel() {
  // Littlest Tokyo is Draco-compressed, so it needs this decoder.
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let gltf;
  try { gltf = await loader.loadAsync('./LittlestTokyo.glb'); }
  finally { draco.dispose(); }
  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.scale.setScalar(4 / Math.max(size.x, size.y, size.z));
  bounds.setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -1 - bounds.min.y, -center.z);
  scene.add(model);
  bounds.setFromObject(model).getCenter(focus);
  controls.target.copy(focus);
  const mixer = new THREE.AnimationMixer(model);
  gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  updates.push((delta) => mixer.update(delta));
}

loadModel().catch((error) => {
  console.error('GLB loading failed:', error);
  const message = document.createElement('p');
  message.className = 'fixed bottom-16 left-4 bg-slate-950 p-3 text-sm text-red-300';
  message.setAttribute('role', 'alert');
  message.textContent = `GLB failed: ${error.message} Check the model path and network, then reload.`;
  document.body.append(message);
});