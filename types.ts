export type CursorType =
  | "default"
  | "pointer"
  | "help"
  | "text"
  | "move"
  | "grab"
  | "grabbing"
  | "not-allowed"
  | "crosshair"
  | "zoom-in"
  | "zoom-out"
  | "ew-resize"
  | "ns-resize"
  | "nwse-resize"
  | "nesw-resize";
export type AnimationType =
  | "none"
  | "wiggle"
  | "pulse"
  | "glow"
  | "float"
  | "spin"
  | "shake"
  | "bounce"
  | "fade"
  | "slide-in"
  | "zoom"
  | "slide-up"
  | "slide-down";
export type InteractionType =
  | "none"
  | "dialogue"
  | "scene_change"
  | "link"
  | "sound"
  | "skill_check"
  | "give-item"
  | "collect"
  | "run_script"
  | "save_game"
  | "load_game"
  | "toggle_inventory"
  | "open_ui"
  | "close_ui"
  | "modify_number"
  | "open_crafting"
  | "open_quest_log"
  | "start_quest"
  | "complete_quest"
  | "open_skills"
  | "open_almanac"
  | "open_map"
  | "open_relationships"
  | "open_settings"
  | "set_flag"
  | "play_cutscene"
  | "restart_scene"
  | "restart_game"
  | "toggle_fullscreen"
  | "toggle_mute"
  | "exit_game";
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";
export type AssetCategory = string;

export type RuleConditionType =
  | "flag"
  | "item"
  | "quest_active"
  | "quest_completed"
  | "skill"
  | "need"
  | "relationship"
  | "time";

export type RuleComparator =
  | "is"
  | "is_not"
  | "at_least"
  | "at_most"
  | "greater_than"
  | "less_than";

export interface RuleCondition {
  id: string;
  type: RuleConditionType;
  targetId: string;
  comparator: RuleComparator;
  value?: number | boolean;
}

export interface RuntimeGameState {
  version: 1;
  currentSceneId: string;
  inventory: string[];
  flags: Record<string, boolean>;
  skills: Record<string, number>;
  needs: Record<string, number>;
  relationships: Record<string, number>;
  activeQuests: string[];
  completedQuests: string[];
  collectedObjects: string[];
  activeUiMenus: string[];
  triggeredRuleIds: string[];
  runtimePositions: Record<string, { x: number; y: number }>;
  time: number;
  day: number;
}

export interface ClickResponse {
  id: string;
  interaction: InteractionType;
  interactionData?: string;
  giveItemId?: string;
  dialogueTreeId?: string;
  targetUiId?: string;
  scriptAssetId?: string;
  conditionMode?: "all" | "any";
  conditions?: RuleCondition[];
  triggerOnce?: boolean;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  requiredGameFlag?: string;
  setGameFlag?: string;
  startQuestId?: string;
  completeQuestId?: string;
  giveItemId?: string;
  consumeItemId?: string;
  playSoundAssetId?: string;
  changeSceneId?: string;
  requiredSkillId?: string;
  requiredSkillValue?: number;
  timeCost?: number;
  needsEffect?: Record<string, number>;
  reputationEffect?: { factionId: string; value: number };
}
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  speakerAssetId?: string;
  portraitPosition?: "left" | "right";
}
export interface DialogueTree {
  id: string;
  name: string;
  nodes: DialogueNode[];
  startNodeId: string | null;
}
export interface ItemCombination {
  withItemId: string;
  resultItemId: string | null;
  destroyTarget: boolean;
  destroySelf: boolean;
  successMessage?: string;
}

export type ItemCategory =
  | "normal"
  | "consumable"
  | "ingredient"
  | "quest"
  | "crafting_station";

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredient1Id: string;
  ingredient2Id: string;
  ingredient3Id?: string;
  resultItemId: string;
  destroyIngredient1: boolean;
  destroyIngredient2: boolean;
  destroyIngredient3?: boolean;
  successMessage: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  iconAssetId: string | null;
  category?: ItemCategory;
  isUsable?: boolean;
  consumeOnUse?: boolean;
  useMessage?: string;
  useSoundAssetId?: string;
  customUseScript?: string;
  statRestores?: { stat: string; amount: number }[];
  combinations?: ItemCombination[];
}

export interface Asset {
  id: string;
  src: string;
  dataURL?: string;
  name: string;
  isFavorite?: boolean;
  tags?: string[];
  description?: string;
  trimStart?: number;
  trimEnd?: number;
  volume?: number;
  type:
    | "image"
    | "hitbox"
    | "audio"
    | "script"
    | "video"
    | "ui_element"
    | "text";
  category: string;
  lore?: string;
  needsAttention?: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  src: string;
  _assetId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex: number;
  opacity: number;
  locked: boolean;
  hidden?: boolean;
  cursor: CursorType;
  cursorAssetId?: string;

  // Animation settings
  animation: AnimationType;
  animationDuration?: number;
  animationEasing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";

  // Relationship Systems
  parentObjectId?: string;
  affinityId?: string;

  interaction: InteractionType;
  interactionData?: string;
  clickResponses?: ClickResponse[];
  conditionMode?: "all" | "any";
  conditions?: RuleCondition[];
  triggerOnEnter?: boolean;
  triggerOnce?: boolean;
  ignoreClicks?: boolean;
  isHitbox?: boolean;
  isScript?: boolean;
  isVideo?: boolean;

  // Responsive UI & Positioning Constraints
  stretchToScreen?: boolean;
  pinToEdge?: "none" | "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  objectFit?: "fill" | "contain" | "cover";

  // Text Tool settings
  isText?: boolean;
  textContent?: string;
  textColor?: string;
  textFontSize?: number;
  textFontFamily?: string;
  textAlign?: "left" | "center" | "right";
  textStyle?: "plain" | "narrative" | "speech" | "thought" | "sign";
  textOutline?: boolean;
  textOutlineColor?: string;
  textLetterSpacing?: number;
  textLineHeight?: number;
  textShadow?: string;
  textWeight?:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";

  // UI Maker settings
  isUiElement?: boolean;
  isDraggable?: boolean;
  uiElementType?:
    | "panel"
    | "button"
    | "progress"
    | "toggle"
    | "icon"
    | "tooltip"
    | "selection"
    | "image"
    | "text";
  uiColorPrimary?: string;
  uiColorSecondary?: string;
  uiIconType?:
    | "bag"
    | "sword"
    | "book"
    | "gear"
    | "potion"
    | "key"
    | "check"
    | "cancel"
    | "arrow-left"
    | "arrow-right"
    | "arrow-up"
    | "arrow-down";
  uiValue?: number; // for progress bar
  uiChecked?: boolean; // for toggles
  uiBorderType?:
    | "none"
    | "solid"
    | "double"
    | "bevel"
    | "dashed"
    | "dotted"
    | "inset"
    | "outset"
    | "groove"
    | "ridge";
  uiBorderRadius?: number;
  uiBindingType?: "none" | "need" | "flag" | "inventory_count";
  uiBindingId?: string;
  uiAnchor?: 
    | "top-left" 
    | "top-center" 
    | "top-right" 
    | "center-left" 
    | "center" 
    | "center-right" 
    | "bottom-left" 
    | "bottom-center" 
    | "bottom-right";

  // RPG Logic
  requireItemId?: string;
  consumeRequiredItem?: boolean;
  giveItemId?: string;
  dialogueTreeId?: string;
  scriptAssetId?: string;
  showIfFlag?: string; // Natural Language: Only show if this event happened
  hideIfFlag?: string; // Natural Language: Hide if this event happened

  // Advanced Visuals
  blendMode: BlendMode;
  parallaxSpeed: number; // 1 = normal, <1 = background (slower), >1 = foreground (faster)
  filters?: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    hueRotate?: number;
    blur?: number;
    sepia?: number;
    invert?: number;
    grayscale?: number;
  };

  // Physics & Engine
  hasPhysics: boolean;
  physicsStatic?: boolean;
  physicsBounciness?: number; // 0-1 (restitution)
  physicsFriction?: number;
  physicsDensity?: number;
  audioSrc?: string;

  // Sim & RPG Elements (Urbz / TTRPG)
  flavorText?: string;
  requiredSkill?: string;
  skillCheckDifficulty?: number;
  timeCost?: number;
  needsEffect?: Record<string, number>;
  reputationEffect?: { npcId: string; value: number };
  grantSkill?: string;
  grantSkillValue?: number;

  // Dialogue, Inventory, UI
  targetUiId?: string;

  // Custom overriding CSS
  customCssClasses?: string;
}

export interface Scene {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  bgmAssetId?: string;
  objects: SceneObject[];
  isOpenByDefault?: boolean;
  blocksClicks?: boolean;
}

export interface QuestObjective {
  id: string;
  type:
    | "talk_to"
    | "collect_item"
    | "reach_scene"
    | "skill_check"
    | "custom_flag";
  targetId: string; // dialogueNodeId, itemId, sceneId, or flag string
  description: string;
  requiredAmount?: number;
}

export interface QuestReward {
  type: "give_item" | "modify_status" | "set_flag";
  targetId: string;
  amount?: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  autoStart?: boolean;
}

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  targetSceneId: string | null;
  iconSrc?: string | null;
  unlockedByDefault?: boolean;
  requiredFlagId?: string; // Must have this flag to travel here
}

export interface FastTravelMap {
  id: string;
  name: string;
  backgroundSrc: string | null;
  nodes: MapNode[];
}

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  requiredFlagId?: string;
}

export interface Companion {
  id: string;
  name: string;
  assetId: string | null;
  dialogueTreeId: string | null; // For clicking on them
  requiredFlagId?: string; // Follows if you have this flag
  interjections?: string[]; // Periodically says one of these
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  defaultAffinity: number;
}

export interface Project {
  id: string;
  name: string;
  scenes: Scene[];
  uiMenus: Scene[];
  currentSceneId: string;
  currentUiMenuId: string | null;
  assets: Asset[];
  dialogueTrees: DialogueTree[];
  inventoryItems: InventoryItem[];
  craftingRecipes: CraftingRecipe[];
  quests: Quest[];
  maps: FastTravelMap[];
  gameFlags: string[]; // Custom string flag names used throughout the project
  loreEntries?: LoreEntry[];
  factions?: Faction[];
  companions?: Companion[];
  prefabs?: SceneObject[];
  globalSettings: {
    useDayNightCycle: boolean;
    enableNeeds: boolean;
    enableTTRPGStats: boolean;
    stageWidth: number;
    stageHeight: number;
    snapToGrid: boolean;
    gridSize: number;
    showGhostOutlines: boolean;
    dialoguePosition?: "top" | "bottom" | "center" | "below";
    dialogueWidthPercent?: number; // default 91
    dialogueMaxHeightPercent?: number; // default 90
    dialogueMaxWidthPx?: number; // default 672
    typewriterSpeed?: number;
    hideDefaultInventoryBtn?: boolean;
    hideDefaultCraftingBtn?: boolean;
    hideDefaultQuestLogBtn?: boolean;
    hideDefaultSkillsBtn?: boolean;
    hideDefaultAlmanacBtn?: boolean;
    hideDefaultMapBtn?: boolean;
    hideDefaultRelationshipsBtn?: boolean;
    hideDefaultSettingsBtn?: boolean;
    enableSkillsHud?: boolean;
    enableAlmanacHud?: boolean;
    enableMapHud?: boolean;
    enableRelationshipsHud?: boolean;
    enableSettingsHud?: boolean;
    customCursorAssetId?: string; // ID of the custom cursor asset
    deviceFrame?: {
      assetId: string;
      outerWidth: number;
      outerHeight: number;
      screen: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
    hudOverlay?: {
      assetId?: string;
      opacity?: number;
      blendMode?: string;
      pointerEvents?: "none" | "auto";
      scale?: number;
      position?: "stretch" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
      offsetX?: number;
      offsetY?: number;
    };
    uiTheme?:
      | "default"
      | "barbie"
      | "terminal"
      | "cyberpunk"
      | "fantasy"
      | "retro"
      | "minimalist";
    uiColorPrimary?: string;
    uiColorSecondary?: string;
    uiColorBackground?: string;
    uiBorderRadius?: number;
    uiFontFamily?: string;
    customCss?: string;
    customSkills?: string[];
    customNeeds?: string[];
  };
}
