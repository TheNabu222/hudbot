export type CursorType =
  | "default"
  | "pointer"
  | "help"
  | "text"
  | "move"
  | "not-allowed"
  | "crosshair"
  | "zoom-in";
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
  | "flavor_text"
  | "branching_dialogue"
  | "skill_check"
  | "start-dialogue"
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
  | "set_flag"
  | "play_cutscene";
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "color-dodge"
  | "difference"
  | "luminosity";
export type AssetCategory = string;

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  requiredGameFlag?: string;
  setGameFlag?: string;
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
  name: string;
  type:
    | "image"
    | "hitbox"
    | "audio"
    | "script"
    | "video"
    | "ui_element"
    | "text";
  category: string;
  description?: string;
  tags?: string[];
  lore?: string;
  needsAttention?: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  src: string;
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
  cursor: CursorType;

  // Animation settings
  animation: AnimationType;
  animationDuration?: number;
  animationEasing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";

  interaction: InteractionType;
  interactionData?: string;
  triggerOnEnter?: boolean;
  triggerOnce?: boolean;
  isHitbox?: boolean;
  isScript?: boolean;
  isVideo?: boolean;

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
  uiElementType?:
    | "panel"
    | "button"
    | "progress"
    | "toggle"
    | "icon"
    | "tooltip"
    | "selection";
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
  uiBorderType?: "none" | "solid" | "double" | "bevel";
  uiBorderRadius?: number;
  uiBindingType?: "none" | "need" | "flag" | "inventory_count";
  uiBindingId?: string;

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
  };

  // Physics & Engine
  hasPhysics: boolean;
  audioSrc?: string;

  // Sim & RPG Elements (Urbz / TTRPG)
  flavorText?: string;
  requiredSkill?: "none" | "naturalist" | "occultist" | "scribal";
  skillCheckDifficulty?: number;
  needsEffect?: {
    rest: number;
    hunger: number;
    connection: number;
    spiritual: number;
    novelty: number;
  };
  reputationEffect?: { npcId: string; value: number };

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
  quests: Quest[];
  gameFlags: string[]; // Custom string flag names used throughout the project
  globalSettings: {
    useDayNightCycle: boolean;
    enableNeeds: boolean;
    enableTTRPGStats: boolean;
    stageWidth: number;
    stageHeight: number;
    snapToGrid: boolean;
    gridSize: number;
    showGhostOutlines: boolean;
    dialoguePosition?: "top" | "bottom" | "center";
    typewriterSpeed?: number;
    hideDefaultInventoryBtn?: boolean;
    customCursorAssetId?: string; // ID of the custom cursor asset
    uiTheme?:
      | "default"
      | "barbie"
      | "terminal"
      | "cyberpunk"
      | "fantasy"
      | "retro"
      | "minimalist";
    uiColorPrimary?: string;
    uiColorBackground?: string;
    uiBorderRadius?: number;
    uiFontFamily?: string;
    customCss?: string;
  };
}
