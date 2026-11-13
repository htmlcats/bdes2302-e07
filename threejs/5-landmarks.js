import { updates } from './1-scene.js';

// 5. Create the interface and draw landmarks. Do not move the camera yet.
const panel = document.createElement('main');
panel.className = 'fixed left-4 top-4 right-4 max-w-sm rounded-xl bg-slate-950/80 p-4 font-sans text-white backdrop-blur';
panel.innerHTML = `
  <h1 class="text-sm font-semibold">Three.js + MediaPipe</h1>
  <p id="instructions" class="mt-1 text-xs text-slate-300">Enable webcam to inspect face and hand landmarks.</p>
  <div class="my-3 flex gap-2 text-xs">
    <button id="start" class="rounded bg-teal-300 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">Enable webcam</button>
    <button id="recenter" hidden disabled class="rounded bg-slate-700 px-3 py-2 disabled:opacity-50">Recenter</button>
  </div>
  <p id="status" role="status" class="text-xs text-teal-200">Landmarks are normalized (0–1). Video stays in your browser.</p>
  <p class="mt-2 text-xs text-slate-400">Nose 1 · cheeks 234 / 454 · eyes 33 / 263</p>
  <output id="values" class="mt-1 block font-mono text-xs text-slate-400"></output>`;
const preview = document.createElement('figure');
preview.hidden = true;
preview.className = 'fixed bottom-4 right-4 w-40 overflow-hidden rounded-xl bg-slate-950/80 sm:w-52';
const overlay = document.createElement('canvas');
overlay.className = 'block w-full';
overlay.setAttribute('aria-label', 'Mirrored webcam with face and hand landmarks');
preview.append(overlay);
document.body.append(panel, preview);
const pen = overlay.getContext('2d');
const video = document.createElement('video');
video.muted = video.playsInline = true;
const start = document.getElementById('start');
const status = document.getElementById('status');
const recenter = document.getElementById('recenter');
const values = document.getElementById('values');

// Step 6 reads this raw data, keeping detection separate from camera math.
const tracking = { points: null, hand: null, aspect: 1, active: false };
let tracker, hands, stream;
let lastVideoTime = -1, lastDetection = 0, closed = false;
function stop() {
  tracking.active = false;
  tracking.points = tracking.hand = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = video.srcObject = null;
  preview.hidden = true;
  recenter.disabled = true;
  start.textContent = 'Enable webcam';
}
start.onclick = async () => {
  if (stream) { stop(); status.textContent = 'Webcam stopped.'; return; }
  start.disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use HTTPS or localhost for camera access.');
    status.textContent = 'Loading MediaPipe; then allow webcam access...';
    const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/+esm');
    const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
    if (closed) return;
    tracker ??= await FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task' },
      runningMode: 'VIDEO', numFaces: 1,
    });
    hands ??= await HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
      runningMode: 'VIDEO', numHands: 1,
    });
    if (closed) { tracker.close(); hands.close(); return; }
    const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    if (closed) { acquired.getTracks().forEach((track) => track.stop()); return; }
    stream = acquired;
    video.srcObject = stream;
    await video.play();
    if (closed) return;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    tracking.aspect = video.videoWidth / video.videoHeight;
    lastVideoTime = -1;
    tracking.active = true;
    preview.hidden = false;
    start.textContent = 'Stop webcam';
    stream.getVideoTracks()[0].onended = () => { stop(); status.textContent = 'Camera disconnected. Enable webcam to retry.'; };
  } catch (error) {
    stop();
    console.error('Webcam failed:', error);
    status.textContent = `Webcam failed: ${error.message} Enable webcam to retry.`;
  } finally { start.disabled = false; }
};

function drawPoints(points, color, labels) {
  pen.fillStyle = color;
  pen.font = '18px sans-serif';
  points?.forEach((point, index) => {
    const x = (1 - point.x) * overlay.width, y = point.y * overlay.height;
    pen.beginPath();
    pen.arc(x, y, labels.includes(index) ? 4 : 1, 0, Math.PI * 2);
    pen.fill();
    if (labels.includes(index)) pen.fillText(String(index), x + 6, y - 6);
  });
}
updates.push((delta, now) => {
  if (!tracking.active || video.readyState < 2 || video.currentTime === lastVideoTime || now - lastDetection < 50) return;
  lastVideoTime = video.currentTime;
  lastDetection = now;
  try {
    tracking.points = tracker.detectForVideo(video, now).faceLandmarks[0] ?? null;
    tracking.hand = hands.detectForVideo(video, now).landmarks[0] ?? null;
    pen.save();
    pen.translate(overlay.width, 0);
    pen.scale(-1, 1);
    pen.drawImage(video, 0, 0, overlay.width, overlay.height);
    pen.restore();
    drawPoints(tracking.points, '#5eead4', [1, 234, 454, 33, 263]);
    drawPoints(tracking.hand, '#fbbf24', [4, 8]);
    recenter.disabled = !tracking.points;
    status.textContent = tracking.points ? 'Face tracked. Teal = face; amber = hand.' : 'Face not found. Look at the webcam to resume.';
  } catch (error) {
    stop();
    console.error('Tracking failed:', error);
    status.textContent = `Tracking failed: ${error.message} Enable webcam to retry.`;
  }
});
window.addEventListener('pagehide', () => { closed = true; stop(); tracker?.close(); hands?.close(); });

export { tracking, recenter, values };