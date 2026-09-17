import assert from "node:assert/strict";
import esbuild from "esbuild";

const source = `
  import assert from "node:assert/strict";
  import {
    createAutosaveAssetLibrarySnapshot,
    createAutosaveShellProject,
    createCoalescedAutosaveQueue,
    getAutosaveAssetLibraryFingerprint,
    measureAutosaveSerialization,
    restoreAutosaveAssetLibrary,
  } from "./utils/projectAutosave.ts";

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const dataUrl = (label, bytes) =>
    "data:image/png;base64," + label + "." + "A".repeat(bytes);

  const makeObject = (id, assetId, zIndex) => ({
    id,
    name: id,
    src: dataUrl(id + "-duplicate", 64_000),
    _assetId: assetId,
    x: 12 + zIndex * 10,
    y: 24,
    width: 80,
    height: 80,
    rotation: 0,
    zIndex,
    opacity: 1,
    locked: false,
    cursor: "pointer",
    animation: "none",
    interaction: "dialogue",
    dialogueTreeId: "dialogue-hyenaba",
    blendMode: "normal",
    parallaxSpeed: 1,
    hasPhysics: false,
  });

  const makeProject = () => {
    const assets = Array.from({ length: 8 }, (_, index) => ({
      id: "asset-" + index,
      name: "Large Asset " + index,
      src: dataUrl("asset-" + index, 768_000),
      type: "image",
      category: "fixture",
      width: 640,
      height: 360,
    }));
    return {
      id: "autosave-smoke",
      name: "Autosave Smoke",
      currentSceneId: "scene-garden",
      currentUiMenuId: "field-notes-ui",
      assets,
      scenes: [
        {
          id: "scene-garden",
          name: "Garden",
          width: 800,
          height: 600,
          backgroundColor: "#101820",
          objects: assets.slice(0, 5).map((asset, index) =>
            makeObject("object-" + index, asset.id, index + 1),
          ),
        },
      ],
      uiMenus: [
        {
          id: "field-notes-ui",
          name: "Field Notes",
          width: 800,
          height: 600,
          backgroundColor: "transparent",
          objects: [
            {
              id: "field-notes-open",
              name: "Field Notes Button",
              src: "",
              x: 20,
              y: 20,
              width: 180,
              height: 48,
              rotation: 0,
              zIndex: 10,
              opacity: 1,
              locked: false,
              cursor: "pointer",
              animation: "none",
              interaction: "open_ui",
              targetUiId: "field-notes-ui",
              blendMode: "normal",
              parallaxSpeed: 1,
              hasPhysics: false,
            },
          ],
        },
      ],
      dialogueTrees: [
        {
          id: "dialogue-hyenaba",
          name: "Hyenaba Hears the Garden",
          startNodeId: "node-start",
          nodes: [
            {
              id: "node-start",
              speaker: "Hyenaba",
              text: "The garden is listening.",
              choices: [
                {
                  id: "choice-trail",
                  text: "I hear it. Show me the trail.",
                  nextNodeId: null,
                  startQuestId: "quest-garden-remembers",
                  completeQuestObjectiveId: "objective-talk-hyenaba",
                  setGameFlag: "garden_memory_heard",
                  unlockLoreEntryId: "lore-garden-remembers",
                  showLoreEntryId: "lore-garden-remembers",
                },
              ],
            },
          ],
        },
      ],
      quests: [
        {
          id: "quest-garden-remembers",
          name: "The Garden Remembers",
          description: "Listen with Hyenaba.",
          objectives: [
            {
              id: "objective-talk-hyenaba",
              type: "talk_to",
              targetId: "dialogue-hyenaba",
              description: "Talk to Hyenaba.",
            },
          ],
          rewards: [],
        },
      ],
      loreEntries: [
        {
          id: "lore-garden-remembers",
          title: "A Garden Remembers",
          content: "The garden keeps what it hears.",
          requiredFlagId: "garden_memory_heard",
        },
      ],
      inventoryItems: [],
      craftingRecipes: [],
      maps: [],
      gameFlags: [],
      factions: [],
      companions: [],
      characters: [],
      globalSettings: { stageWidth: 800, stageHeight: 600 },
    };
  };

  const editDialogue = (project, index) => ({
    ...project,
    dialogueTrees: project.dialogueTrees.map((tree) =>
      tree.id === "dialogue-hyenaba"
        ? {
            ...tree,
            nodes: tree.nodes.map((node) =>
              node.id === "node-start"
                ? { ...node, text: "The garden is listening " + index + "." }
                : node,
            ),
          }
        : tree,
    ),
  });

  export async function run() {
    const project = makeProject();
    const metrics = measureAutosaveSerialization(project, "asset-library");
    assert.ok(metrics.fullProjectBytes > 5_000_000, "fixture should reproduce large-project serialization pressure");
    assert.ok(metrics.shellBytes < metrics.fullProjectBytes * 0.04, "autosave shell should strip embedded payloads");

    const assetLibrary = createAutosaveAssetLibrarySnapshot(project);
    const shell = createAutosaveShellProject(
      project,
      "asset-library",
      getAutosaveAssetLibraryFingerprint(project.assets),
    );
    const restored = restoreAutosaveAssetLibrary(shell, assetLibrary);
    assert.equal(restored.assets[0].src, project.assets[0].src, "asset payload should restore from sidecar library");
    assert.equal(restored.uiMenus[0].objects[0].interaction, "open_ui", "open_ui Field Notes object should survive autosave shell");
    assert.equal(restored.uiMenus[0].objects[0].targetUiId, "field-notes-ui", "open_ui Field Notes target should survive autosave shell");

    let assetWrites = 0;
    let shellWrites = 0;
    let bytesWritten = 0;
    let lastAssets = null;
    let lastFingerprint = "";
    let hasAssetLibrary = false;
    const persistedNames = [];

    const persist = async (projectToPersist) => {
      shellWrites += 1;
      const fingerprint = getAutosaveAssetLibraryFingerprint(projectToPersist.assets);
      const shellProject = createAutosaveShellProject(
        projectToPersist,
        "asset-library",
        fingerprint,
      );
      bytesWritten += JSON.stringify(shellProject).length;
      const shouldWriteAssets =
        !hasAssetLibrary ||
        lastAssets !== projectToPersist.assets ||
        lastFingerprint !== fingerprint;
      if (shouldWriteAssets) {
        assetWrites += 1;
        bytesWritten += JSON.stringify(createAutosaveAssetLibrarySnapshot(projectToPersist)).length;
        lastAssets = projectToPersist.assets;
        lastFingerprint = fingerprint;
        hasAssetLibrary = true;
      }
      persistedNames.push(projectToPersist.dialogueTrees[0].nodes[0].text);
      await delay(15);
    };

    const queue = createCoalescedAutosaveQueue({
      debounceMs: 5,
      persist,
    });

    queue.enqueue(project);
    await delay(30);
    for (let index = 1; index <= 25; index += 1) {
      queue.enqueue(editDialogue(project, index));
    }
    await delay(120);

    assert.equal(assetWrites, 1, "rapid narrative edits should not rewrite the large asset library");
    assert.ok(shellWrites <= 3, "rapid narrative edits should coalesce into a small number of shell writes");
    assert.equal(
      persistedNames[persistedNames.length - 1],
      "The garden is listening 25.",
      "coalesced autosave should persist the latest edit",
    );

    const naiveBytes = metrics.fullProjectBytes * 26;
    assert.ok(bytesWritten < naiveBytes * 0.12, "coalesced split autosave should write far fewer bytes than full-project autosave");

    return {
      fullProjectMb: metrics.fullProjectBytes / 1024 / 1024,
      shellMb: metrics.shellBytes / 1024 / 1024,
      assetLibraryMb: (metrics.assetLibraryBytes || 0) / 1024 / 1024,
      shellWrites,
      assetWrites,
      naiveRapidEditMb: naiveBytes / 1024 / 1024,
      actualRapidEditMb: bytesWritten / 1024 / 1024,
    };
  }
`;

console.log("autosave smoke: bundling");
const result = await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: "autosave-smoke-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});

const bundled = Buffer.from(result.outputFiles[0].text).toString("base64");
const { run } = await import(`data:text/javascript;base64,${bundled}`);
const resultMetrics = await run();
console.log("autosave smoke metrics:", JSON.stringify(resultMetrics, null, 2));
