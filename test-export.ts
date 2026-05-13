import { generateExportHtml } from "./utils/exportHtml.js";
import { Project } from "./types.js";

const p = {
  id: "1", name: "test", scenes: [{id: "scene1", name: "scene1", objects: [{id: "hitbox1", type: "hitbox", isHitbox: true, interaction: "scene_change", interactionData: "scene2", x: 10, y: 10, width: 100, height: 100}]}], assets: [], flags: [], inventoryItems: [], dialogueTrees: [],
  globalSettings: {}
};
console.log(generateExportHtml(p as unknown as Project));

