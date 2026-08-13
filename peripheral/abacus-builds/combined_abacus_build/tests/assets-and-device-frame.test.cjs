const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!doctype html><body>
  <button id="btn-asset-view"></button>
  <input id="asset-search">
  <input id="asset-upload" type="file">
  <div id="asset-gallery"></div>
  <div id="canvas-container"></div>
  <div id="preview-stage"></div>
</body>`, { url: 'http://127.0.0.1:5180/', runScripts: 'outside-only' });
const { window } = dom;
window.console = console;
window.Utils = {
  uid: () => 'test-id',
  debounce: fn => fn,
};

function loadScript(relativePath, replacements = []) {
  let source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  replacements.forEach(([from, to]) => { source = source.replace(from, to); });
  window.eval(source);
}

loadScript('js/unified-project.js', [['const UnifiedProject =', 'globalThis.UnifiedProject =']]);
loadScript('js/state.js', [
  ['const ProjectCompatibility =', 'globalThis.ProjectCompatibility ='],
  ['const State =', 'globalThis.State ='],
]);
loadScript('js/assets.js', [['const Assets =', 'globalThis.Assets =']]);
loadScript('js/device-frame.js', [['const DeviceFrame =', 'globalThis.DeviceFrame =']]);

const savePath = path.join(__dirname, '..', '..', 'Point-and-Click_RPG_Build', 'Uploads', '7262026_stripped.json');
const save = JSON.parse(fs.readFileSync(savePath, 'utf8'));
assert.equal(window.State.fromJSON(save), true);

window.Assets.init();
window.Assets.render();
const gallery = window.document.getElementById('asset-gallery');
assert.equal(gallery.classList.contains('compact'), false);
assert.equal(gallery.children.length, window.State.project.assets.length);
assert.ok(gallery.querySelectorAll('.asset-thumb img').length > 0);
assert.ok(gallery.querySelectorAll('.asset-thumb.preview-missing').length > 0);
assert.match(gallery.querySelector('.asset-thumb.preview-missing .asset-meta').textContent, /Missing source/);
assert.equal(window.document.getElementById('btn-asset-view').title, 'Use compact thumbnails');

window.DeviceFrame.init();
window.DeviceFrame.renderEditor();
assert.equal(window.DeviceFrame.editorLayer.hidden, false);
assert.match(window.DeviceFrame.editorLayer.querySelector('.device-frame-image').src, /frame2\.png/);
assert.equal(window.DeviceFrame.editorLayer.querySelectorAll('.device-frame-editor-control').length, 7);

const canvas = window.document.createElement('div');
canvas.className = 'preview-canvas';
const preview = {
  previewStage: window.document.getElementById('preview-stage'),
  playerInventory: [],
  rpgState: { skills: { skills: {} } },
  transitionTo: () => {},
};
const shell = window.DeviceFrame.wrapPreview(canvas, preview);
preview.previewStage.appendChild(shell);
assert.equal(shell.classList.contains('preview-device-frame'), true);
assert.equal(shell.querySelectorAll('.device-frame-runtime-control').length, 7);
assert.equal(shell.querySelector('.preview-device-frame-screen').style.width, '465px');
assert.equal(shell.querySelector('.preview-device-frame-screen').style.height, '353px');

shell.querySelectorAll('.device-frame-runtime-control')[1].click();
assert.equal(canvas.querySelector('.device-shell-panel h3').textContent, 'Inspect Item');
assert.equal(canvas.querySelectorAll('.device-ui-object').length, 6);

console.log('Asset visibility and device-frame architecture tests passed.');
