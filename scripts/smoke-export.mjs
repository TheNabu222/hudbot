import assert from "node:assert/strict";
import esbuild from "esbuild";

const source = `
	  import assert from "node:assert/strict";
	  import { prepareProjectForExport } from "./utils/projectPersistence.ts";
	  import { generateExportHtml } from "./utils/exportHtml.ts";

  const data = (name) => "data:image/png;base64," + Buffer.from(name).toString("base64");
  const audio = (name) => "data:audio/mpeg;base64," + Buffer.from(name).toString("base64");

  export function run() {
    const mapBg = data("map-bg");
    const mapIcon = data("map-icon");
    const objectSrc = data("object");

    const project = {
      id: "export-smoke",
      name: "Export Smoke",
      currentSceneId: "scene-1",
      currentUiMenuId: "ui-1",
      assets: [
        { id: "object-asset", src: objectSrc, name: "Object", type: "image", category: "used" },
        { id: "map-bg-asset", src: mapBg, name: "Map BG", type: "image", category: "used" },
        { id: "map-icon-asset", src: mapIcon, name: "Map Icon", type: "image", category: "used" },
        { id: "portrait-asset", src: data("portrait"), name: "Portrait", type: "image", category: "used" },
        { id: "speaker-asset", src: data("speaker"), name: "Speaker", type: "image", category: "used" },
        { id: "item-icon-asset", src: data("item-icon"), name: "Item Icon", type: "image", category: "used" },
        { id: "use-sound-asset", src: audio("use-sound"), name: "Use Sound", type: "audio", category: "used" },
        { id: "choice-sound-asset", src: audio("choice-sound"), name: "Choice Sound", type: "audio", category: "used" },
        { id: "bgm-asset", src: audio("bgm"), name: "BGM", type: "audio", category: "used" },
	        { id: "cursor-asset", src: data("cursor"), name: "Cursor", type: "image", category: "used" },
	        { id: "frame-asset", src: data("frame"), name: "Frame", type: "image", category: "used" },
	        { id: "unused-library-asset", src: data("unused"), name: "Unused Library", type: "image", category: "library" },
	        { id: "github:assets/_cavebot-assets/used-repo.png", src: "https://raw.githubusercontent.com/thenabu222/entropic-ai/main/assets/_cavebot-assets/used-repo.png", name: "Used Repo", type: "image", category: "repo" },
	      ],
      scenes: [
        {
          id: "scene-1",
          name: "Scene",
          width: 800,
          height: 600,
          backgroundColor: "#000",
          bgmAssetId: "bgm-asset",
          objects: [
            {
              id: "obj-1",
              name: "Object",
              src: objectSrc,
              x: 0,
              y: 0,
              width: 64,
              height: 64,
              rotation: 0,
              zIndex: 1,
              opacity: 1,
              locked: false,
              cursor: "pointer",
              cursorAssetId: "cursor-asset",
              animation: "none",
              interaction: "dialogue",
              dialogueTreeId: "dialogue-1",
              blendMode: "normal",
	              parallaxSpeed: 1,
	              hasPhysics: false,
	            },
	            {
	              id: "repo-obj",
	              name: "Repo Object",
	              src: "https://raw.githubusercontent.com/thenabu222/entropic-ai/main/assets/_cavebot-assets/used-repo.png",
	              _assetId: "github:assets/_cavebot-assets/used-repo.png",
	              x: 120,
	              y: 120,
	              width: 32,
	              height: 32,
	              rotation: 0,
	              zIndex: 2,
	              opacity: 1,
	              locked: false,
	              interaction: "none",
	              blendMode: "normal",
	              parallaxSpeed: 1,
	            },
	          ],
        },
      ],
      uiMenus: [
        {
          id: "ui-1",
          name: "UI",
          width: 800,
          height: 600,
          backgroundColor: "#000",
          objects: [],
        },
      ],
      dialogueTrees: [
        {
          id: "dialogue-1",
          name: "Dialogue",
          startNodeId: "node-1",
          nodes: [
            {
              id: "node-1",
              speaker: "Guide",
              text: "Hello",
              speakerAssetId: "speaker-asset",
              choices: [
                {
                  id: "choice-1",
                  text: "Take it",
                  nextNodeId: null,
                  giveItemId: "herb",
                  playSoundAssetId: "choice-sound-asset",
                },
              ],
            },
          ],
        },
      ],
      inventoryItems: [
        {
          id: "herb",
          name: "Herb",
          description: "Smokable herb",
          iconAssetId: "item-icon-asset",
          isUsable: true,
          consumeOnUse: true,
          useSoundAssetId: "use-sound-asset",
        },
        { id: "hookah", name: "Hookah", description: "Tool", iconAssetId: null },
        { id: "lighter", name: "Lighter", description: "Tool", iconAssetId: null, collectionCategory: "Tools" },
        { id: "smoke", name: "Smoke", description: "Result", iconAssetId: null },
      ],
      craftingRecipes: [
        {
          id: "recipe-1",
          name: "Smoke",
          requirements: [
            { id: "req-1", itemId: "herb", consume: true, role: "ingredient" },
            { id: "req-2", itemId: "hookah", consume: false, role: "tool" },
            { id: "req-3", itemId: "lighter", consume: false, role: "tool" },
          ],
          ingredient1Id: "herb",
          ingredient2Id: "hookah",
          ingredient3Id: "lighter",
          resultItemId: "smoke",
          destroyIngredient1: true,
          destroyIngredient2: false,
          destroyIngredient3: false,
          outcomes: [
            { id: "outcome-1", type: "give_item", targetId: "smoke" },
            { id: "outcome-2", type: "change_need", targetId: "hunger", amount: -5 },
            { id: "outcome-3", type: "change_skill", targetId: "Herbalism", amount: 1 },
          ],
          successMessage: "You smoke the herb.",
        },
      ],
      quests: [
        {
          id: "quest-1",
          name: "Quest",
          description: "Do it",
          objectives: [{ id: "objective-1", type: "collect_item", targetId: "herb", description: "Find herb" }],
          rewards: [{ type: "give_item", targetId: "smoke" }],
        },
      ],
      maps: [
        {
          id: "map-1",
          name: "Map",
          backgroundSrc: mapBg,
          backgroundFit: "contain",
          backgroundScale: 1,
          backgroundOffsetX: 0,
          backgroundOffsetY: 0,
          nodes: [{ id: "node-map-1", name: "Home", x: 50, y: 50, targetSceneId: "scene-1", iconSrc: mapIcon, unlockedByDefault: true }],
        },
      ],
      gameFlags: ["met-guide"],
      loreEntries: [{ id: "lore-1", title: "Lore", content: "World lore", category: "World", requiredFlagId: "met-guide" }],
      factions: [{ id: "faction-1", name: "Faction", description: "People", defaultAffinity: 0 }],
      companions: [{ id: "companion-1", name: "Follower", characterId: "character-1", assetId: "portrait-asset", dialogueTreeId: "dialogue-1", interjections: ["Hi"] }],
	      characters: [
	        {
	          id: "character-1",
	          name: "Guide",
	          portraitAssetId: "portrait-asset",
	          factionId: "faction-1",
	          description: "Helpful guide",
	          relationships: [
	            {
	              id: "tie-1",
	              characterId: "character-2",
	              kind: "family",
	              label: "Sibling",
	              value: 35,
	              isMutual: true,
	              isSecret: false,
	              notes: "Knows the old route.",
	            },
	          ],
	        },
	        { id: "character-2", name: "Scout", description: "Knows the trail" },
	      ],
      globalSettings: {
        stageWidth: 800,
        stageHeight: 600,
        customNeeds: ["hunger"],
	        enableNeeds: true,
	        enableTTRPGStats: true,
	        customSkills: ["Herbalism", "Hyena Whispering"],
        customNeedDefinitions: {
          hunger: { id: "hunger", label: "Hunger", defaultValue: 72, min: 0, max: 100, color: "#ff77aa", visibleInHud: true },
        },
	        customSkillDefinitions: {
	          Herbalism: { id: "Herbalism", label: "Herbalism", defaultValue: 3, min: 0, max: 20, color: "#00ffcc", visibleInHud: true },
	          "Hyena Whispering": { id: "Hyena Whispering", label: "Hyena Whispering", defaultValue: 7, min: 0, max: 20, color: "#facc15", visibleInHud: true },
	        },
        itemGroups: ["Tools"],
        customCursorAssetId: "cursor-asset",
        deviceFrame: { assetId: "frame-asset", outerWidth: 900, outerHeight: 700, screen: { x: 20, y: 20, width: 800, height: 600 }, controls: [] },
      },
    };

    const exported = prepareProjectForExport(project);
    const assetIds = new Set(exported.assets.map((asset) => asset.id));

    assert.equal(exported.dialogueTrees.length, 1, "dialogue trees should be exported");
    assert.equal(exported.maps.length, 1, "maps should be exported");
    assert.equal(exported.quests.length, 1, "quests should be exported");
    assert.equal(exported.inventoryItems.length, 4, "items should be exported");
    assert.equal(exported.craftingRecipes[0].requirements.length, 3, "flexible recipe requirements should be exported");
    assert.equal(exported.craftingRecipes[0].outcomes.length, 3, "crafting outcomes should be exported");
    assert.equal(exported.loreEntries.length, 1, "lore should be exported");
    assert.equal(exported.factions.length, 1, "factions should be exported");
    assert.equal(exported.companions.length, 1, "companions should be exported");
	    assert.equal(exported.characters.length, 2, "characters should be exported");
	    assert.equal(exported.characters[0].factionId, "faction-1", "character faction links should be exported");
	    assert.equal(exported.characters[0].relationships[0].kind, "family", "character tie kind should be exported");
	    assert.equal(exported.characters[0].relationships[0].isMutual, true, "character tie flags should be exported");
    assert.equal(exported.companions[0].characterId, "character-1", "companion character links should be exported");
    assert.equal(exported.loreEntries[0].requiredFlagId, "met-guide", "almanac visibility flags should be exported");
    assert.equal(exported.inventoryItems[2].collectionCategory, "Tools", "item collection groups should be exported");
	    assert.equal(exported.globalSettings.customNeedDefinitions.hunger.defaultValue, 72, "need definitions should be exported");
	    assert.equal(exported.globalSettings.customSkillDefinitions.Herbalism.defaultValue, 3, "skill definitions should be exported");
	    assert.equal(exported.globalSettings.customSkillDefinitions["Hyena Whispering"].defaultValue, 7, "multi-word skill definitions should be exported");
	    assert.deepEqual(exported.globalSettings.itemGroups, ["Tools"], "item groups should be exported");

	    const html = generateExportHtml(project);
	    assert.equal(html.includes("Hyena Whispering"), true, "generated HTML should display custom skill labels");
	    assert.equal(html.includes("id=\\"skill-Hyena_20Whispering\\""), true, "generated HTML should use stable encoded skill DOM ids");
	    assert.equal(html.includes("Family / kin"), true, "generated HTML should display relationship tie kinds");
	    assert.equal(html.includes("Skill 1"), false, "generated HTML should not fall back to placeholder skill labels");

    [
      "object-asset",
      "map-bg-asset",
      "map-icon-asset",
      "portrait-asset",
      "speaker-asset",
      "item-icon-asset",
      "use-sound-asset",
      "choice-sound-asset",
	      "bgm-asset",
	      "cursor-asset",
	      "frame-asset",
	      "github:assets/_cavebot-assets/used-repo.png",
	    ].forEach((assetId) => assert.equal(assetIds.has(assetId), true, assetId + " should be retained"));

	    assert.equal(assetIds.has("unused-library-asset"), false, "unused library asset should be pruned");
	    assert.equal(exported.scenes[0].objects[0].src, "", "duplicated object data URL should be stripped");
	    assert.equal(exported.scenes[0].objects[0]._assetId, "object-asset", "stripped object should keep asset reference");

	    const fullLibrary = prepareProjectForExport(project, { assetScope: "all" });
	    assert.equal(fullLibrary.assets.some((asset) => asset.id === "unused-library-asset"), true, "full-library export should keep unused library assets");

	    const repoRefs = prepareProjectForExport(project, { includeEmbeddedAssetData: false });
	    assert.equal(repoRefs.assets.some((asset) => String(asset.src).startsWith("data:")), false, "repo-reference export should strip embedded base64 sources");
	    const repoAsset = repoRefs.assets.find((asset) => asset.id === "github:assets/_cavebot-assets/used-repo.png");
	    assert.equal(repoAsset?.src, "https://raw.githubusercontent.com/thenabu222/entropic-ai/main/assets/_cavebot-assets/used-repo.png", "repo-reference export should keep raw GitHub URLs");
	  }
	`;

const result = await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: "export-smoke-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});

const bundled = Buffer.from(result.outputFiles[0].text).toString("base64");
const { run } = await import(`data:text/javascript;base64,${bundled}`);
run();
console.log("export smoke ok");
