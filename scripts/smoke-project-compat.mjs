import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const stateCandidates = [
  "../peripheral/abacus-builds/combined_abacus_build/js/state.js",
  "../../../../combined_abacus_build/js/state.js",
];
const stateUrl = stateCandidates
  .map((candidate) => new URL(candidate, import.meta.url))
  .find((candidate) => fs.existsSync(candidate));
assert.ok(stateUrl, "Abacus combined state.js should be reachable from this smoke script");

const stateSource = fs.readFileSync(
  stateUrl,
  "utf8",
);
const unifiedUrl = new URL("./unified-project.js", stateUrl);
const unifiedSource = fs.existsSync(unifiedUrl)
  ? fs.readFileSync(unifiedUrl, "utf8")
  : "";

const context = vm.createContext({
  console,
  Date,
  JSON,
  Map,
  Number,
  Boolean,
  Array,
  Object,
  encodeURIComponent,
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
  },
});
if (unifiedSource) vm.runInContext(unifiedSource, context);
vm.runInContext(stateSource, context);

const embeddedImage = "data:image/png;base64,aHVkYm90";
const mainProject = {
  id: "main-project",
  name: "Main HUDbot Project",
  currentSceneId: "scene-1",
  globalSettings: { stageWidth: 1024, stageHeight: 576 },
  assets: [
    {
      id: "asset-1",
      name: "Nabu.png",
      src: embeddedImage,
      type: "image",
      width: 320,
      height: 180,
    },
    {
      id: "github:assets/linked.png",
      name: "Linked.png",
      src: "https://example.test/linked.png",
      type: "image",
      width: 64,
      height: 64,
    },
  ],
  scenes: [
    {
      id: "scene-1",
      name: "Room",
      backgroundColor: "#112233",
      objects: [
        {
          id: "object-1",
          name: "Nabu",
          _assetId: "asset-1",
          src: "",
          x: 12,
          y: 34,
          width: 320,
          height: 180,
          zIndex: 3,
          interaction: "scene_change",
        },
        {
          id: "field-notes-opener",
          name: "Open Field Notes",
          interaction: "open_ui",
          targetUiId: "field-notes-ui",
          clickResponses: [
            {
              id: "open-almanac-too",
              interaction: "open_ui",
              targetUiId: "almanac-ui",
              unknownHudbotField: "keep-me",
            },
          ],
        },
      ],
    },
  ],
  uiMenus: [
    {
      id: "field-notes-ui",
      name: "Field Notes",
      objects: [
        {
          id: "close-field-notes",
          name: "Close Field Notes",
          interaction: "close_ui",
          targetUiId: "field-notes-ui",
        },
      ],
    },
    {
      id: "almanac-ui",
      name: "Almanac",
      objects: [],
    },
  ],
};

context.__mainProject = mainProject;
const normalized = vm.runInContext(
  "ProjectCompatibility.normalize(__mainProject)",
  context,
);

assert.equal(normalized.canvasWidth, 1024);
assert.equal(normalized.canvasHeight, 576);
assert.equal(normalized.activeSceneId, "scene-1");
assert.equal(normalized.scenes[0].bgColor, "#112233");
assert.equal(normalized.assets[0].dataURL, embeddedImage);
assert.equal(
  normalized.assets[1].dataURL,
  "https://example.test/linked.png",
);
assert.equal(normalized.scenes[0].objects[0].assetId, "asset-1");
assert.equal(normalized.scenes[0].objects[0].clickAction, "scene-change");
const fieldNotesOpener = normalized.scenes[0].objects.find(
  (object) => object.id === "field-notes-opener",
);
assert.ok(fieldNotesOpener, "HUDbot UI opener object should import");
assert.equal(
  fieldNotesOpener.clickAction,
  "open-ui",
  "HUDbot open_ui should not import as clickAction none",
);
assert.equal(
  fieldNotesOpener.targetUiId,
  "field-notes-ui",
  "HUDbot open_ui target should survive compatibility import",
);
assert.equal(
  fieldNotesOpener.clickResponses[0].targetUiId,
  "almanac-ui",
  "chained custom UI opener target should survive compatibility import",
);
assert.equal(
  fieldNotesOpener.clickResponses[0].unknownHudbotField,
  "keep-me",
  "unknown click response fields should not be discarded",
);
assert.equal(normalized.uiMenus.length, 2, "custom HUDbot UI screens should import");
assert.equal(
  normalized.uiMenus[0].objects[0].clickAction,
  "close-ui",
  "HUDbot close_ui controls should not import as clickAction none",
);

context.__normalized = normalized;
vm.runInContext("State.fromJSON(__normalized)", context);
const saved = vm.runInContext("JSON.parse(State.toJSON())", context);
assert.equal(saved.id, "main-project");
assert.equal(saved.assets[0].dataURL, embeddedImage);
assert.equal(saved.scenes[0].objects[0].assetId, "asset-1");
const savedOpener = saved.scenes[0].objects.find(
  (object) => object.id === "field-notes-opener",
);
assert.equal(savedOpener.interaction, "open_ui");
assert.equal(savedOpener.clickAction, "open-ui");
assert.equal(savedOpener.targetUiId, "field-notes-ui");
assert.equal(savedOpener.clickResponses[0].targetUiId, "almanac-ui");
assert.equal(saved.uiMenus[0].objects[0].interaction, "close_ui");

console.log("project compatibility smoke ok");
