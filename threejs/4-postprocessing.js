import { THREE, scene, camera, renderer, rendering } from './1-scene.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

// 4. Render the scene through an optional effect, then convert colors for display.
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const pixelation = new RenderPixelatedPass(6, scene, camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.65, 0.3, 0.75);
const vignette = new ShaderPass(VignetteShader);
vignette.uniforms.darkness.value = 1.3;
for (const pass of [renderPass, pixelation, bloom, vignette, new OutputPass()]) {
  composer.addPass(pass);
}
const asciiResolution = 0.3;
const ascii = new AsciiEffect(renderer, ' .:-=+*#%@', { resolution: asciiResolution, invert: true });
const textMetrics = document.createElement('canvas').getContext('2d');
ascii.domElement.id = 'ascii';
ascii.domElement.setAttribute('aria-hidden', 'true');
ascii.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;color:#dbeafe;background:#101827';
// Keep the canvas as the input surface and place the ASCII output below the UI.
renderer.domElement.after(ascii.domElement);

const label = document.createElement('label');
label.className = 'fixed bottom-16 left-4 w-40 rounded-xl bg-slate-950/80 p-3 font-sans text-xs text-white backdrop-blur sm:bottom-auto sm:left-auto sm:right-4 sm:top-4';
label.innerHTML = `Postprocessing
  <select id="effect" class="mt-2 block w-full rounded bg-slate-700 p-2 text-white">
    <option value="bloom">Bloom</option>
    <option value="vignette">Vignette</option>
    <option value="pixelation">Pixellation</option>
    <option value="ascii">ASCII</option>
  </select>`;
document.body.append(label);
const select = label.querySelector('select');
select.onchange = () => {
  renderPass.enabled = select.value !== 'pixelation';
  pixelation.enabled = select.value === 'pixelation';
  bloom.enabled = select.value === 'bloom';
  vignette.enabled = select.value === 'vignette';
  ascii.domElement.hidden = select.value !== 'ascii';
};
select.onchange();

// Reuse step 1's loop. ASCII converts the rendered image into a character grid.
rendering.render = (delta) => {
  if (select.value === 'ascii') ascii.render(scene, camera);
  else composer.render(delta);
};
rendering.resize = (width, height) => {
  composer.setSize(width, height);
  ascii.setSize(width, height);
  // AsciiEffect's fixed letter spacing leaves gaps with tiny characters.
  const table = ascii.domElement.querySelector('table');
  const columns = Math.max(1, Math.floor(width * asciiResolution));
  const rows = Math.max(1, Math.ceil(Math.floor(height * asciiResolution) / 2));
  textMetrics.font = `${table.style.fontSize} ${table.style.fontFamily}`;
  table.style.letterSpacing = `${width / columns - textMetrics.measureText('M').width}px`;
  table.style.lineHeight = `${height / rows}px`;
};
rendering.resize(innerWidth, innerHeight);
