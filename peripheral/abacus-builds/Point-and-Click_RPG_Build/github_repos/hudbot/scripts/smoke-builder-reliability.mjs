import assert from "node:assert/strict";
import esbuild from "esbuild";

const source = `
  import assert from "node:assert/strict";
  import {
    findObjectsAtPoint,
    getInteractionSummary,
    getNextObjectPlacement,
    getObscuredInteractiveWarnings,
    isInteractiveObject,
    selectSceneObjectById,
  } from "./utils/sceneObjectReliability.ts";
  import {
    createInterfaceOpenerObject,
    findProjectObjectById,
    findInterfaceWiringTargets,
    interfaceOpenActionFor,
    wireProjectObjectToInterface,
  } from "./utils/interfaceWiring.ts";

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

    const fieldNotesMenu = {
      id: "field-notes-ui",
      name: "Field Notes",
      width: 800,
      height: 600,
      backgroundColor: "transparent",
      objects: [],
    };
    const opener = createInterfaceOpenerObject({
      menu: fieldNotesMenu,
      existingObjects: scene.objects,
      sceneWidth: scene.width,
      sceneHeight: scene.height,
      label: "Notes",
    });
    assert.equal(opener.interaction, "open_ui", "interface opener should use the canonical open_ui action");
    assert.equal(opener.targetUiId, "field-notes-ui", "interface opener should target the selected UI screen");
    assert.equal(opener.textContent, "Notes", "interface opener should use the requested visible label");
    assert.equal(
      interfaceOpenActionFor(fieldNotesMenu).summary,
      "Click -> Open UI -> Field Notes",
      "interface screen cards should show the same click summary as the object inspector",
    );

    const project = {
      id: "wiring-project",
      name: "Wiring Project",
      currentSceneId: scene.id,
      currentUiMenuId: fieldNotesMenu.id,
      scenes: [{ ...scene, objects: [...scene.objects, opener] }],
      uiMenus: [fieldNotesMenu],
      assets: [],
      dialogueTrees: [],
      inventoryItems: [],
      craftingRecipes: [],
      quests: [],
      maps: [],
      gameFlags: [],
      loreEntries: [],
      globalSettings: {
        stageWidth: 800,
        stageHeight: 600,
        snapToGrid: false,
        gridSize: 10,
        showGhostOutlines: false,
        enableNeeds: false,
        enableTTRPGStats: false,
        useDayNightCycle: false,
      },
    };
    assert.deepEqual(
      findInterfaceWiringTargets(project, "field-notes-ui").map((target) => ({
        kind: target.kind,
        objectName: target.objectName,
        sourceName: target.sourceName,
      })),
      [
        { kind: "scene_object", objectName: "Higher Hotspot", sourceName: "Garden" },
        { kind: "scene_object", objectName: "Open Field Notes", sourceName: "Garden" },
      ],
      "Interface Studio should list every room object that opens a UI screen",
    );

    assert.equal(
      findProjectObjectById(project, "hyenaba")?.sourceName,
      "Garden",
      "Interface Studio should keep resolving a selected room object while another canvas is active",
    );

    const notesButton = baseObject({
      id: "notes-button",
      name: "Notes Button",
      interaction: "none",
    });
    const projectWithUiObject = {
      ...project,
      uiMenus: [{ ...fieldNotesMenu, objects: [notesButton] }],
    };
    assert.equal(
      findProjectObjectById(projectWithUiObject, "notes-button")?.kind,
      "ui_object",
      "Interface Studio should also resolve selected objects from a custom UI canvas",
    );

    const wired = wireProjectObjectToInterface(
      { ...project, currentUiMenuId: "other-ui" },
      "hyenaba",
      fieldNotesMenu,
    );
    const wiredHyenaba = wired.project.scenes[0].objects.find((object) => object.id === "hyenaba");
    const untouchedHotspot = wired.project.scenes[0].objects.find((object) => object.id === "hotspot");
    assert.equal(wired.target?.sourceName, "Garden");
    assert.equal(wiredHyenaba.interaction, "open_ui");
    assert.equal(wiredHyenaba.targetUiId, "field-notes-ui");
    assert.equal(untouchedHotspot.targetUiId, "field-notes-ui", "graph-level wiring should not retarget the overlapping higher-z object");

    const transparentHotspot = baseObject({
      id: "transparent-hotspot",
      name: "Transparent Hotspot",
      opacity: 0,
      interaction: "sound",
      interactionData: "sound-asset",
    });
    const emptyTransparentHitbox = baseObject({
      id: "empty-transparent-hitbox",
      name: "Empty Transparent Hitbox",
      opacity: 0,
      isHitbox: true,
      interaction: "none",
    });
    const soundOnlyObject = baseObject({
      id: "sound-only",
      name: "Sound Only",
      interaction: "none",
      audioSrc: "sound-asset",
    });
    assert.equal(
      isInteractiveObject(transparentHotspot),
      true,
      "transparent actionable hitboxes should remain clickable",
    );
    assert.equal(
      isInteractiveObject(emptyTransparentHitbox),
      false,
      "transparent empty hitboxes should not block real clickable objects",
    );
    assert.equal(
      isInteractiveObject(soundOnlyObject),
      true,
      "objects with only an attached click sound should still receive runtime clicks",
    );
    assert.equal(
      getInteractionSummary(soundOnlyObject),
      "Click -> Sound",
      "sound-only objects should not appear as no-action runtime click targets",
    );
    assert.equal(
      getInteractionSummary({ interaction: "none", isDraggable: true }),
      "Drag -> Move object",
      "drag-only objects should disclose that they are draggable instead of saying no action",
    );
    assert.equal(
      getInteractionSummary({ interaction: "none", triggerOnEnter: true }),
      "Hover -> Reaction",
      "hover-only objects should disclose hover behavior instead of saying no action",
    );
    assert.deepEqual(
      findObjectsAtPoint([transparentHotspot], 50, 50).map((object) => object.id),
      ["transparent-hotspot"],
      "transparent actionable hotspots should still be offered by exact selection",
    );
    const legacyObjectWithoutInteraction = {
      id: "legacy-object",
      name: "Legacy Object",
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      zIndex: 1,
      hidden: false,
      ignoreClicks: false,
    };
    assert.equal(
      isInteractiveObject(legacyObjectWithoutInteraction),
      false,
      "legacy decorative objects without an interaction field should not be treated as clickable",
    );
    assert.equal(
      getInteractionSummary(legacyObjectWithoutInteraction),
      "Click -> No action",
      "legacy objects without an interaction field should not crash click summaries",
    );

    return {
      firstPlacement,
      secondPlacement,
      overlapOrder: findObjectsAtPoint(scene.objects, 50, 50).map((object) => object.id),
      lowerSelection: selectSceneObjectById(scene, "hyenaba").selectedObjectId,
      warnings: getObscuredInteractiveWarnings(scene).length,
      interfaceOpeners: findInterfaceWiringTargets(project, "field-notes-ui").length,
      graphSelectedSource: wired.target?.sourceName,
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
