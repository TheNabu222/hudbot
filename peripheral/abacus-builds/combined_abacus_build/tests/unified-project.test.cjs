const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const sourcePath = path.join(__dirname, '..', 'js', 'unified-project.js');
const source = fs.readFileSync(sourcePath, 'utf8')
  .replace('const UnifiedProject =', 'globalThis.UnifiedProject =');
const context = vm.createContext({ console });
vm.runInContext(source, context, { filename: sourcePath });
const { UnifiedProject } = context;

const v2Project = {
  schemaVersion: 2,
  id: 'project-1',
  name: 'Compatibility Test',
  sentinel: { keepMe: true },
  meta: { startSceneId: 'scene-a' },
  settings: {
    stageWidth: 960,
    stageHeight: 540,
    customNeeds: [{ id: 'need-rest', key: 'rest', label: 'Rest', default: 80, decayPerTick: 0.5 }],
    customSkills: [{ id: 'skill-lore', key: 'lore', label: 'Lore', default: 2, max: 10 }],
  },
  assets: [{ id: 'asset-1', name: 'Door', kind: 'image', source: { mode: 'linked', url: 'door.gif' }, dims: { w: 64, h: 96 } }],
  scenes: [
    {
      id: 'scene-a',
      name: 'Outside',
      size: { w: 960, h: 540 },
      objects: [{
        id: 'door-1',
        name: 'Door',
        assetId: 'asset-1',
        transform: { x: 12, y: 18, w: 64, h: 96, rotation: 0, zIndex: 2, opacity: 1 },
        interaction: 'scene_change',
        interactionData: 'scene-b',
      }],
    },
    { id: 'scene-b', name: 'Inside', size: { w: 960, h: 540 }, objects: [] },
  ],
  items: [{ id: 'item-1', name: 'Key' }],
  characters: [{ id: 'char-1', name: 'Caretaker', defaultAffinity: 30 }],
  quests: [{ id: 'quest-1', name: 'Open the Door', objectives: [{ id: 'step-1', description: 'Find the key' }] }],
  facts: [{ id: 'fact-1', key: 'door_open', label: 'Door Open', type: 'bool', default: false }],
  conditionGroups: [{ id: 'conditions-1', mode: 'all', conditions: [] }],
  actions: [{ id: 'action-1', type: 'change_scene', params: { sceneId: 'scene-b' } }],
  eventRules: [{ id: 'rule-1' }],
  storyPhases: [{ id: 'phase-1', name: 'Beginning' }],
};

const converted = UnifiedProject.toAnzu(v2Project);
assert.equal(converted.canvasWidth, 960);
assert.equal(converted.canvasHeight, 540);
assert.equal(converted.activeSceneId, 'scene-a');
assert.equal(converted.scenes[0].objects[0].x, 12);
assert.equal(converted.scenes[0].objects[0].clickAction, 'scene-change');
assert.equal(converted.scenes[0].objects[0].targetSceneId, 'scene-b');
assert.equal(converted.assets[0].src, 'door.gif');
assert.equal(converted.inventoryItems[0].name, 'Key');
assert.equal(converted.rpgNPCs[0].name, 'Caretaker');
assert.equal(converted.rpgQuests[0].milestones[0].text, 'Find the key');
assert.equal(converted.flags[0].name, 'door_open');
assert.equal(converted.rpgNeeds.needs[0].defaultValue, 80);
assert.equal(converted.rpgSkills.skills[0].defaultLevel, 2);
assert.equal(converted.sentinel.keepMe, true);
assert.equal(converted.actions[0].params.sceneId, 'scene-b');

converted.scenes[0].objects[0].x = 44;
const portable = JSON.parse(UnifiedProject.serialize(converted));
assert.equal(portable.scenes[0].objects[0].transform.x, 44);
assert.equal(portable.items[0].name, 'Key');
assert.equal(portable.characters[0].name, 'Caretaker');
assert.equal(portable.facts[0].key, 'door_open');
assert.equal(portable.sentinel.keepMe, true);

console.log('Unified project compatibility tests passed.');
