import { THREE, updates } from './1-scene.js';
import { tracking } from './5-landmarks.js';
import { cameraMapping, updateCamera } from './6-camera.js';

// 7. Optional thumb/index spacing multiplies the face-to-camera mapping.
const hint = document.createElement('p');
hint.className = 'mt-2 text-xs text-teal-200';
hint.innerHTML = 'Spread thumb + index for 1–4× amplification (no hand = 1×): <output>1.0×</output>';
document.querySelector('main').append(hint);
const readout = hint.querySelector('output');

function updateFingers() {
  const { hand, aspect, active } = tracking;
  cameraMapping.gain = 1;
  if (active && hand) {
    // Divide fingertip distance by palm length to reduce camera-distance sensitivity.
    const distance = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
    const palm = distance(hand[0], hand[9]);
    if (palm < 1 / 480) {
      readout.value = 'Hand too small. Move it closer to the webcam.';
      return;
    }
    cameraMapping.gain = THREE.MathUtils.clamp(1 + 3 * (distance(hand[4], hand[8]) / palm - 0.2), 1, 4);
  }
  readout.value = `${cameraMapping.gain.toFixed(1)}×`;
}

// Read the latest landmarks before the camera consumes the gain in the same frame.
updates.splice(updates.indexOf(updateCamera), 0, updateFingers);
