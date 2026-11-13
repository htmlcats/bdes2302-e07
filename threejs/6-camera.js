import { THREE, camera, focus, updates, controls } from './1-scene.js';
import { tracking, recenter, values } from './5-landmarks.js';

// 6. Convert face landmarks into camera position and roll.
document.getElementById('instructions').textContent = 'Move sideways to orbit (a half-frame shift turns 180° at 1×). Lean to zoom; tilt to roll. Without tracking, drag to orbit; right-drag to pan.';
recenter.hidden = false;
const cameraMapping = { gain: 1 };
const orbit = { yaw: 0, pitch: 0, radius: 6 };
let targetYaw = 0, targetPitch = 0, targetRadius = 6;
let face, baseline, targetRoll = 0, cameraRoll = 0;
recenter.onclick = () => { baseline = face ? { ...face } : null; };

let wasActive = false;
function updateCamera(delta) {
  const { points, aspect, active } = tracking;
  controls.enabled = !active;
  if (!active) {
    if (wasActive) controls.target.copy(focus);
    baseline = face = null;
    cameraRoll = targetRoll = 0;
    wasActive = false;
    values.value = 'Drag to orbit / right-drag to pan / scroll to zoom.';
    return;
  }
  if (!wasActive) {
    const position = new THREE.Spherical().setFromVector3(camera.position.clone().sub(focus));
    orbit.yaw = position.theta;
    orbit.pitch = Math.PI / 2 - position.phi;
    orbit.radius = position.radius;
  }
  wasActive = true;
  const gain = cameraMapping.gain;
  if (points) {
    face = {
      x: points[1].x, y: points[1].y,
      width: Math.hypot(points[454].x - points[234].x, (points[454].y - points[234].y) / aspect),
      roll: Math.atan2(points[263].y - points[33].y, (points[263].x - points[33].x) * aspect),
    };
    if (face.width >= 0.01) {
      baseline ??= { ...face };
      // Spherical angles allow the camera to reach the back, not just slide sideways.
      targetYaw = -(face.x - baseline.x) * Math.PI * 2 * gain;
      targetPitch = THREE.MathUtils.clamp(-(face.y - baseline.y) * Math.PI * 2 * gain, -1.3, 1.3);
      targetRadius = THREE.MathUtils.clamp(6 + (6 * (baseline.width / face.width) ** 2 - 6) * gain, 2, 12);
      targetRoll = (face.roll - baseline.roll) * 1.8 * gain;
    } else {
      values.value = 'Face too small to estimate depth. Move closer to the webcam.';
      return;
    }
  } else {
    face = null;
    targetRoll = 0;
    targetYaw = targetPitch = 0;
    targetRadius = 6;
  }
  const smoothing = 1 - Math.exp(-8 * delta);
  // Smooth angles instead of XYZ so transitions follow an arc, not a chord through the model.
  orbit.yaw = THREE.MathUtils.lerp(orbit.yaw, targetYaw, smoothing);
  orbit.pitch = THREE.MathUtils.lerp(orbit.pitch, targetPitch, smoothing);
  orbit.radius = THREE.MathUtils.lerp(orbit.radius, targetRadius, smoothing);
  camera.position.setFromSphericalCoords(orbit.radius, Math.PI / 2 - orbit.pitch, orbit.yaw).add(focus);
  cameraRoll = THREE.MathUtils.lerp(cameraRoll, targetRoll, smoothing);
  camera.lookAt(focus);
  camera.rotateZ(cameraRoll);
  values.value = `Gain ${gain.toFixed(1)}× / X ${camera.position.x.toFixed(1)} / Y ${camera.position.y.toFixed(1)} / Z ${camera.position.z.toFixed(1)} / Roll ${THREE.MathUtils.radToDeg(cameraRoll).toFixed(0)}°`;
}
updates.push(updateCamera);

export { cameraMapping, updateCamera };
