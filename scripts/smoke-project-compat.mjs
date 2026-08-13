import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const stateSource = fs.readFileSync(
  new URL(
    "../peripheral/abacus-builds/combined_abacus_build/js/state.js",
    import.meta.url,
  ),
  "utf8",
);

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
      ],
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

context.__normalized = normalized;
vm.runInContext("State.fromJSON(__normalized)", context);
const saved = vm.runInContext("JSON.parse(State.toJSON())", context);
assert.equal(saved.id, "main-project");
assert.equal(saved.assets[0].dataURL, embeddedImage);
assert.equal(saved.scenes[0].objects[0].assetId, "asset-1");

console.log("project compatibility smoke ok");
