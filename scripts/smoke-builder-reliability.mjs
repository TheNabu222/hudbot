import assert from "node:assert/strict";
import esbuild from "esbuild";

const source = `
  import assert from "node:assert/strict";
  import {
    findObjectsAtPoint,
    getInteractionSummary,
    getNextObjectPlacement,
    getObscuredInteractiveWarnings,
    selectSceneObjectById,
  } from "./utils/sceneObjectReliability.ts";

  const baseObject = (updates) => ({
    id: "object",
    name: "Object",
    src: "",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    cursor: "pointer",
    animation: "none",
    interaction: "none",
    blendMode: "normal",
    parallaxSpeed: 1,
    hasPhysics: false,
    ...updates,
  });

  export function run() {
    const firstPlacement = getNextObjectPlacement({
      existingObjects: [],
      width: 100,
      height: 100,
      sceneWidth: 300,
      sceneHeight: 220,
      preferredX: 0,
      preferredY: 0,
    });
    assert.deepEqual(firstPlacement, { x: 0, y: 0 });

    const secondPlacement = getNextObjectPlacement({
      existingObjects: [baseObject({ id: "first", x: 0, y: 0 })],
      width: 100,
      height: 100,
      sceneWidth: 300,
      sceneHeight: 220,
      preferredX: 0,
      preferredY: 0,
    });
    assert.notDeepEqual(secondPlacement, firstPlacement, "new objects should cascade instead of stacking at identical coordinates");
    assert.ok(secondPlacement.x >= 0 && secondPlacement.y >= 0, "cascaded object should stay inside the scene");
    assert.ok(secondPlacement.x + 100 <= 300 && secondPlacement.y + 100 <= 220, "cascaded object should stay within bounds");

    const lower = baseObject({
      id: "hyenaba",
      name: "Hyenaba Sprite",
      zIndex: 5,
      interaction: "dialogue",
      dialogueTreeId: "dialogue-hyenaba",
    });
    const higher = baseObject({
      id: "hotspot",
      name: "Higher Hotspot",
      zIndex: 20,
      interaction: "open_ui",
      targetUiId: "field-notes-ui",
    });
    const scene = {
      id: "scene-garden",
      name: "Garden",
      width: 800,
      height: 600,
      backgroundColor: "#000",
      objects: [lower, higher],
    };

    assert.deepEqual(
      selectSceneObjectById(scene, "hyenaba"),
      { selectedObjectId: "hyenaba", selectedMultiIds: ["hyenaba"] },
      "Layers selection should select the requested lower-z object by ID",
    );

    const editedObjects = scene.objects.map((object) =>
      object.id === selectSceneObjectById(scene, "hyenaba").selectedObjectId
        ? { ...object, dialogueTreeId: "dialogue-hyenaba-updated" }
        : object,
    );
    assert.equal(editedObjects.find((object) => object.id === "hyenaba").dialogueTreeId, "dialogue-hyenaba-updated");
    assert.equal(editedObjects.find((object) => object.id === "hotspot").targetUiId, "field-notes-ui", "wiring Hyenaba should not mutate the covering hotspot");

    assert.deepEqual(
      findObjectsAtPoint(scene.objects, 50, 50).map((object) => object.id),
      ["hotspot", "hyenaba"],
      "overlap hit test should offer top-to-bottom object choices",
    );

    assert.deepEqual(
      getObscuredInteractiveWarnings(scene).map((warning) => ({
        objectId: warning.objectId,
        coveringObjectId: warning.coveringObjectId,
      })),
      [{ objectId: "hyenaba", coveringObjectId: "hotspot" }],
      "completely covered interactive objects should be warned about",
    );

    assert.equal(
      getInteractionSummary(lower, {
        dialogueName: (id) => id === "dialogue-hyenaba" ? "Hyenaba Hears the Garden" : "",
      }),
      "Click -> Dialogue -> Hyenaba Hears the Garden",
    );
    assert.equal(
      getInteractionSummary(higher, {
        uiName: (id) => id === "field-notes-ui" ? "Field Notes" : "",
      }),
      "Click -> Open UI -> Field Notes",
      "Field Notes object should remain an open_ui action in summaries",
    );

    return {
      firstPlacement,
      secondPlacement,
      overlapOrder: findObjectsAtPoint(scene.objects, 50, 50).map((object) => object.id),
      lowerSelection: selectSceneObjectById(scene, "hyenaba").selectedObjectId,
      warnings: getObscuredInteractiveWarnings(scene).length,
    };
  }
`;

console.log("builder reliability smoke: bundling");
const result = await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: "builder-reliability-smoke-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});

const bundled = Buffer.from(result.outputFiles[0].text).toString("base64");
const { run } = await import(`data:text/javascript;base64,${bundled}`);
const resultMetrics = run();
console.log("builder reliability smoke metrics:", JSON.stringify(resultMetrics, null, 2));
