const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({ console });
const unifiedPath = path.join(__dirname, '..', 'js', 'unified-project.js');
const statePath = path.join(__dirname, '..', 'js', 'state.js');

vm.runInContext(
  fs.readFileSync(unifiedPath, 'utf8').replace('const UnifiedProject =', 'globalThis.UnifiedProject ='),
  context,
  { filename: unifiedPath }
);
vm.runInContext(
  fs.readFileSync(statePath, 'utf8')
    .replace('const ProjectCompatibility =', 'globalThis.ProjectCompatibility =')
    .replace('const State =', 'globalThis.State ='),
  context,
  { filename: statePath }
);

const savePath = path.join(
  __dirname,
  '..',
  '..',
  'Point-and-Click_RPG_Build',
  'Uploads',
  '7262026_stripped.json'
);
const original = JSON.parse(fs.readFileSync(savePath, 'utf8'));

assert.equal(context.State.fromJSON(original), true);
assert.equal(context.State.project.name, 'My Neocities Game');
assert.equal(context.State.project.scenes.length, 31);
assert.ok(context.State.project.assets.length >= 208);
assert.ok(original.assets.every(asset => context.State.project.assets.some(imported => imported.id === asset.id)));
assert.equal(context.State.project.dialogueTrees.length, 10);
assert.equal(context.State.project.activeSceneId, original.currentSceneId);
assert.equal(context.State.project.scenes[0].objects.length, original.scenes[0].objects.length);

const savedAgain = JSON.parse(context.State.toJSON());
assert.equal(savedAgain.name, original.name);
assert.equal(savedAgain.scenes.length, original.scenes.length);
assert.ok(savedAgain.assets.length >= original.assets.length);
assert.ok(original.assets.every(asset => savedAgain.assets.some(saved => saved.id === asset.id)));
assert.equal(savedAgain.dialogueTrees.length, original.dialogueTrees.length);
assert.deepEqual(savedAgain.globalSettings, original.globalSettings);
assert.deepEqual(savedAgain.maps, original.maps);
assert.deepEqual(savedAgain.loreEntries, original.loreEntries);

console.log('Current Hudbot save compatibility test passed.');
