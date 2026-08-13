const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!doctype html><body>
  <div id="hud-studio-container"></div>
  <div id="canvas-container"></div>
  <div id="preview-stage"></div>
</body>`, { url: 'http://127.0.0.1:5181/', runScripts: 'outside-only' });
const { window } = dom;
window.console = console;
window.Utils = { uid: () => 'test-id', debounce: fn => fn };

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
loadScript('js/device-frame.js', [['const DeviceFrame =', 'globalThis.DeviceFrame =']]);
loadScript('js/hud-runtime.js', [['const HudRuntime =', 'globalThis.HudRuntime =']]);

const previewStage = window.document.getElementById('preview-stage');
const preview = {
  previewStage,
  playerInventory: [],
  rpgState: {
    needs: { hunger: 72, energy: 44 },
    skills: { skills: { intuition: 61 } },
  },
  enter() {},
  transitionTo() {},
  _showSaveLoadModal() {},
};
window.Preview = preview;
loadScript('js/hud-studio.js', [['const HudStudio =', 'globalThis.HudStudio =']]);

const savePath = path.join(__dirname, '..', '..', 'Point-and-Click_RPG_Build', 'Uploads', '7262026_stripped.json');
const save = JSON.parse(fs.readFileSync(savePath, 'utf8'));
assert.equal(window.State.fromJSON(save), true);

window.HudStudio.init();
const studio = window.document.getElementById('hud-studio-container');
assert.equal(studio.querySelector('[data-hud-setting="uiTheme"]').value, 'retro');
assert.equal(studio.querySelectorAll('.hud-menu-row').length, 2);
assert.match(studio.textContent, /Inventory/);
assert.match(studio.textContent, /Inspect Item/);

const canvas = window.document.createElement('div');
canvas.className = 'preview-canvas';
previewStage.appendChild(canvas);

window.HudRuntime.renderOpenMenus(canvas, preview);
assert.equal(canvas.querySelectorAll('.hud-runtime-menu').length, 0);

const inventoryMenu = window.State.project.uiMenus.find(menu => menu.name === 'Inventory');
inventoryMenu.isOpenByDefault = true;
window.HudRuntime.renderOpenMenus(canvas, preview);
assert.equal(canvas.querySelectorAll('.hud-runtime-menu').length, 1);
assert.equal(canvas.querySelectorAll('.hud-runtime-object').length, 5);
canvas.querySelector('.hud-runtime-object.is-button').click();
assert.equal(canvas.querySelectorAll('.hud-runtime-menu').length, 0);

window.HudRuntime.openMenu(inventoryMenu.id, preview);
assert.equal(canvas.querySelector('.hud-runtime-menu').dataset.hudMenuId, inventoryMenu.id);

window.State.project.globalSettings.hideAllDefaultHud = false;
window.State.project.globalSettings.hideDefaultInventoryBtn = false;
window.HudRuntime.renderBuiltInHud(canvas, preview);
const builtIns = canvas.querySelector('.hud-runtime-builtins');
assert.ok(builtIns);
assert.equal(builtIns.querySelector('.hud-runtime-meters').style.left, '60px');
assert.equal(builtIns.querySelector('.hud-runtime-buttons').style.left, '420px');
assert.match(builtIns.textContent, /Inventory/);

window.DeviceFrame.init();
const inspectControl = window.State.project.globalSettings.deviceFrame.controls.find(control =>
  control.clickResponses?.[0]?.targetUiId === window.State.project.uiMenus[1].id
);
window.DeviceFrame.runControl(inspectControl, preview);
assert.ok([...canvas.querySelectorAll('.hud-runtime-menu')].some(menu =>
  menu.dataset.hudMenuId === window.State.project.uiMenus[1].id
));

const workspaceCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'unified-workspace.css'), 'utf8');
assert.match(workspaceCss, /#canvas-wrapper\[hidden\][\s\S]*display:\s*none\s*!important/);
assert.match(workspaceCss, /#canvas-status-bar\[hidden\][\s\S]*display:\s*none\s*!important/);

console.log('Hudbot HUD/UI graft and workspace visibility tests passed.');
