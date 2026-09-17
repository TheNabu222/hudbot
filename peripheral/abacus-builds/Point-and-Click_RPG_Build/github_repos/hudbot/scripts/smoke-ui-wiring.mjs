import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const clickEditorSource = fs.readFileSync(
  new URL("../components/ClickResponseEditor.tsx", import.meta.url),
  "utf8",
);
const pointClickActionsSource = fs.readFileSync(
  new URL("../utils/pointClickActions.ts", import.meta.url),
  "utf8",
);

assert.match(
  appSource,
  /const sameKindCount\s*=\s*\n?\s*targetMenu\?\.objects\?\.filter/,
  "smart UI region creation should count existing regions instead of blocking them",
);
assert.match(
  appSource,
  /const duplicateOffset\s*=\s*sameKindCount \* 28/,
  "duplicate smart UI regions should cascade instead of landing exactly on top of each other",
);
assert.doesNotMatch(
  appSource,
  /This interface already has a .*smart region/,
  "custom UI screens must allow more than one smart region of the same type",
);
assert.match(
  appSource,
  /prev\.includes\(obj\.targetUiId!\) \? prev : \[\.\.\.prev, obj\.targetUiId!\]/,
  "runtime open_ui should not stack duplicate copies of the same custom screen",
);
assert.match(
  appSource,
  /const wireSelectedObjectToInterface = \(menu: Scene\)/,
  "Interface Studio should wire the selected canvas object directly to a custom screen",
);
assert.match(
  appSource,
  /data-testid=\{`wire-selected-to-ui-\$\{scene\.id\}`\}/,
  "custom screen cards should expose a stable Wire selected control",
);
assert.match(
  appSource,
  /openFromObjectId: selectedProjectObject\?\.object\.id/,
  "screen starter Wire buttons should target the selected canvas object when one exists",
);
assert.match(
  appSource,
  /placeOpener: !selectedProjectObject/,
  "screen starter Wire buttons should only place a separate opener when nothing is selected",
);
assert.match(
  appSource,
  /const testInterfaceScreen = \(menu: Scene\)/,
  "Interface Studio should directly test a custom screen in Play mode",
);
assert.match(
  appSource,
  /data-testid=\{`test-ui-screen-\$\{scene\.id\}`\}/,
  "custom screen cards should expose a stable Test screen control",
);
assert.match(
  pointClickActionsSource,
  /export const responseChoiceGroups/,
  "point-and-click response choices should live in a shared action registry",
);
assert.match(
  pointClickActionsSource,
  /id: "use_item"[\s\S]*Require an inventory item/,
  "shared point-and-click quick actions should include Use item",
);
assert.match(
  clickEditorSource,
  /from "\.\.\/utils\/pointClickActions"/,
  "click response editor should consume the shared point-and-click action registry",
);
assert.doesNotMatch(
  clickEditorSource,
  /const responseChoiceGroups/,
  "click response editor should not keep a private action taxonomy",
);
assert.match(
  appSource,
  /pointClickQuickActions\.map/,
  "selected-object inspector should render quick actions from the shared registry",
);
assert.match(
  appSource,
  /data-testid=\{`point-click-quick-action-\$\{action\.id\}`\}/,
  "point-and-click quick actions should expose stable test IDs",
);
assert.match(
  appSource,
  /aria-label=\{`Create \$\{preset\} screen and make this click open it`\}/,
  "selected-object custom screen quick-create buttons should have stable accessible labels",
);
assert.match(
  appSource,
  /aria-label=\{`Create \$\{preset\} interface screen`\}/,
  "Interface Studio preset buttons should have stable accessible labels",
);
assert.match(
  appSource,
  /!ruleState\.activeUiMenus\.includes\(response\.targetUiId\)/,
  "chained open_ui responses should dedupe active custom screens",
);
assert.match(
  appSource,
  /const getUiMenuPreviewLayout = \(uiMenu: Scene\)/,
  "builder and Play/Test should share one custom UI preview layout calculation",
);
assert.match(
  appSource,
  /Math\.min\(\s*logicalStageWidth \/ Math\.max\(1, width\),\s*logicalStageHeight \/ Math\.max\(1, height\),\s*\)/,
  "custom UI previews should fit uniformly instead of stretching X and Y independently",
);
assert.doesNotMatch(
  appSource,
  /uiMenuScaleX|uiMenuScaleY|scale\(\$\{uiMenuScaleX\}, \$\{uiMenuScaleY\}\)/,
  "custom UI previews should not use non-uniform scaling",
);
assert.doesNotMatch(
  appSource,
  /rightSidebarTab === "assets" \|\| rightSidebarTab === "prefabs"/,
  "canvas inspector must not force the integrated Assets/Stamps tabs back to Options",
);
assert.match(
  appSource,
  /aria-label="Open collected assets panel"/,
  "canvas inspector should expose Collect assets without leaving the canvas workflow",
);
assert.match(
  appSource,
  /aria-label="Open stamps panel"/,
  "canvas inspector should expose Stamps without leaving the canvas workflow",
);
assert.match(
  appSource,
  /editorMode === "ui_stage" \? "Place in UI screen" : "Place in room"/,
  "shared asset placement controls should label the active UI canvas separately from room placement",
);
assert.match(
  appSource,
  /const handleWorkflowModeChange = \(mode: EditorMode\) => \{\s*if \(isPlaying\) \{\s*setIsPlaying\(false\);[\s\S]*?setActiveDialogue\(null\);[\s\S]*?closePlayOverlays\(\);[\s\S]*?setEditorMode\(mode\);[\s\S]*?\};/,
  "switching workflow tabs while testing should end Play mode and close runtime overlays before changing editor context",
);
assert.match(
  appSource,
  /const handleWorkflowExport = \(\) => \{\s*if \(isPlaying\) \{\s*setIsPlaying\(false\);[\s\S]*?setActiveDialogue\(null\);[\s\S]*?closePlayOverlays\(\);[\s\S]*?setIsPublishMenuOpen\(true\);[\s\S]*?\};/,
  "opening Publish while testing should end Play mode and close runtime overlays before showing export choices",
);
assert.match(
  appSource,
  /setEditorMode\(editorModeBeforePlayRef\.current\);[\s\S]*?closePlayOverlays\(\);[\s\S]*?setActiveDialogue\(null\);[\s\S]*?setPreviewDialogue\(null\);/,
  "Stop Test should close runtime overlays before returning to authoring",
);
assert.match(
  appSource,
  /onPointerDown=\{\(\) => \{\s*if \(isPlaying\) \{\s*if \(selectedInventoryItemId\) \{[\s\S]*?setPreviewDialogue\(null\);[\s\S]*?\}\s*return;\s*\}[\s\S]*?setSelectedObjectId\(null\);/,
  "runtime canvas clicks should not clear the authoring object selection",
);

assert.match(
  clickEditorSource,
  /Open Your Custom Screens/,
  "click editor should expose custom UI screens as first-class actions",
);
assert.match(
  pointClickActionsSource,
  /Inventory Screen.*inventory\|item wheel\|equipment\|loadout\|player menu/s,
  "custom inventory-like screens should be classified for click wiring",
);
assert.match(
  pointClickActionsSource,
  /Almanac Screen.*almanac\|codex\|journal\|lore\|field notes/s,
  "custom almanac and journal screens should be classified for click wiring",
);
assert.match(
  clickEditorSource,
  /Built-in HUD and Menus/,
  "built-in overlay actions should remain separately available from custom Screen UI actions",
);
assert.match(
  pointClickActionsSource,
  /Open Screen UI -> \$\{menu\.name\}/,
  "saved responses should summarize the exact custom UI target",
);

console.log("ui wiring smoke ok");
