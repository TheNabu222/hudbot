/* ============================================================
   Cavebot Studio — Schema v2 type definitions
   ============================================================ */

// ---- Primitives ----
export type ConditionOp = 'is' | 'is_not' | 'gte' | 'lte' | 'gt' | 'lt';
export type ConditionMode = 'all' | 'any' | 'none';
export type FactType = 'bool' | 'number' | 'enum';
export type InteractionType =
  | 'none' | 'dialogue' | 'scene_change' | 'sound' | 'collect'
  | 'give_item' | 'toggle_flag' | 'set_flag' | 'clear_flag'
  | 'start_quest' | 'complete_quest' | 'open_ui' | 'close_ui'
  | 'open_crafting' | 'skill_check' | 'run_script' | 'play_cutscene'
  | 'advance_day' | 'gift_item' | 'toggle_inventory' | 'open_map'
  | 'start-dialogue' | 'link' | 'save_game' | 'load_game'
  | 'modify_number' | 'restart_game' | 'restart_scene';

export type ObjectiveType = 'talk_to' | 'collect_item' | 'reach_scene' | 'skill_check' | 'custom_flag' | 'fact' | 'custom';

// ---- Core Entities ----
export interface Fact {
  id: string;
  key: string;
  label: string;
  type: FactType;
  default: boolean | number | string;
  values?: string[];  // for enum type
}

export interface Condition {
  id: string;
  type: 'fact' | 'item' | 'quest_stage' | 'quest_active' | 'quest_completed' | 'skill' | 'need' | 'relationship' | 'time' | 'day' | 'scene' | 'phase' | 'visit_count' | 'flag';
  targetId: string;
  op: ConditionOp;
  value: number | boolean | string;
}

export interface ConditionGroup {
  id: string;
  mode: ConditionMode;
  conditions: Condition[];
  children?: string[];  // nested condition group ids
}

export interface Action {
  id: string;
  type: 'show_text' | 'play_sound' | 'give_item' | 'remove_item' | 'set_fact'
    | 'adjust_relationship' | 'adjust_skill' | 'adjust_need' | 'adjust_reputation'
    | 'start_quest' | 'advance_quest' | 'complete_quest' | 'change_scene'
    | 'set_scene_variant' | 'set_story_phase' | 'open_ui' | 'play_animation'
    | 'queue_event' | 'exchange_item';
  params: Record<string, any>;
}

// ---- Assets ----
export interface Asset {
  id: string;
  kind: 'image' | 'audio' | 'video' | 'script' | 'font' | 'hitbox' | 'ui_element' | 'text';
  name: string;
  source: {
    mode: 'linked' | 'embedded' | 'repo';
    url?: string;
    dataRef?: string;
    repoPath?: string;
  };
  dims?: { w: number; h: number };
  tags?: string[];
  category?: string;
  audio?: { trimStart: number; trimEnd: number; volume: number };
}

// ---- Scene Objects ----
export interface SceneObjectTransform {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  flipX?: boolean;
  flipY?: boolean;
}

export interface ClickResponse {
  id: string;
  whenCondGroupId?: string | null;
  actionIds: string[];
  once?: boolean;
  // legacy compat
  interaction?: InteractionType;
  interactionData?: string | null;
  giveItemId?: string | null;
  dialogueTreeId?: string | null;
  conditions?: any[];
  conditionMode?: ConditionMode;
  triggerOnce?: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  assetId?: string | null;
  src?: string;
  characterId?: string | null;
  transform: SceneObjectTransform;
  cursor?: string;
  hidden?: boolean;
  locked?: boolean;
  isHitbox?: boolean;
  isText?: boolean;
  isScript?: boolean;
  isVideo?: boolean;
  isUiElement?: boolean;
  isDraggable?: boolean;
  // Text fields
  textContent?: string;
  textColor?: string;
  textFontSize?: number;
  textFontFamily?: string;
  // Interaction
  interaction?: InteractionType;
  interactionData?: string | null;
  dialogueTreeId?: string | null;
  giveItemId?: string | null;
  requireItemId?: string | null;
  // Conditions (legacy)
  showIfFlag?: string | null;
  hideIfFlag?: string | null;
  conditions?: any[];
  conditionMode?: ConditionMode;
  // v2
  showWhenCondGroupId?: string | null;
  onClick?: { responses: ClickResponse[] };
  triggerOnEnter?: boolean;
  triggerOnce?: boolean;
  // Rendering
  blendMode?: string;
  parallaxSpeed?: number;
  filters?: Record<string, number>;
  animation?: string;
  animationDuration?: number;
  // Click responses (legacy)
  clickResponses?: ClickResponse[];
  // Needs effects
  needsEffect?: Record<string, number>;
  reputationEffect?: { npcId?: string; factionId?: string; characterId?: string; value: number };
  // UI element
  uiElementType?: string;
  uiBindingType?: string;
  uiBindingId?: string;
  // Physics
  hasPhysics?: boolean;
  // Extra
  flavorText?: string;
  _assetId?: string;
  // Stretch/position
  stretchToScreen?: boolean;
  pinToEdge?: string;
  objectFit?: string;
  // width/height for legacy
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
}

// ---- Scene ----
export interface SceneVariant {
  id: string;
  name: string;
  activateWhenCondGroupId?: string | null;
  priority: number;
  overrides: Record<string, Partial<SceneObject>>;
  addObjects?: SceneObject[];
  removeObjectIds?: string[];
}

export interface Scene {
  id: string;
  name: string;
  slug?: string;
  size: { w: number; h: number };
  backgroundColor?: string;
  bgmAssetId?: string | null;
  objects: SceneObject[];
  variants?: SceneVariant[];
  // ui menu fields
  isOpenByDefault?: boolean;
  blocksClicks?: boolean;
  closeOnClickOutside?: boolean;
}

// ---- Dialogue ----
export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  showWhenCondGroupId?: string | null;
  actionIds?: string[];
  // legacy
  requiredGameFlag?: string | null;
  setGameFlag?: string | null;
  startQuestId?: string | null;
  completeQuestId?: string | null;
  completeQuestObjectiveId?: string | null;
  giveItemId?: string | null;
  consumeItemId?: string | null;
  changeSceneId?: string | null;
  grantSkillId?: string | null;
  grantSkillAmount?: number;
  reputationEffect?: { factionId?: string; characterId?: string; value: number };
  needsEffect?: Record<string, number>;
  timeCost?: number;
  playSoundAssetId?: string | null;
  unlockLoreEntryId?: string | null;
  showLoreEntryId?: string | null;
  requiredSkillId?: string | null;
  requiredSkillValue?: number;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  speakerAssetId?: string | null;
  portraitPosition?: 'left' | 'right';
  speakerCharId?: string | null;
}

export interface DialogueTree {
  id: string;
  name: string;
  startNodeId: string | null;
  nodes: DialogueNode[];
}

// ---- Characters ----
export interface RelationshipThreshold {
  value: number;
  label: string;
  color: string;
}

export interface GiftPreference {
  itemId: string;
  change: number;
  reactionText?: string;
}

export interface CharacterRelationship {
  characterId: string;
  kind: string;
  label: string;
  value: number;
  isMutual?: boolean;
  isSecret?: boolean;
  notes?: string;
}

export interface Character {
  id: string;
  name: string;
  slug?: string;
  portraitAssetId?: string | null;
  factionId?: string | null;
  description?: string;
  relationshipTrackName?: string;
  defaultAffinity?: number;
  thresholds?: RelationshipThreshold[];
  giftPreferences?: GiftPreference[];
  relationships?: CharacterRelationship[];
}

// ---- Items ----
export interface ItemCombination {
  withItemId: string;
  resultItemId: string | null;
  destroyTarget: boolean;
  destroySelf: boolean;
  successMessage?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  iconAssetId: string | null;
  category?: 'normal' | 'consumable' | 'ingredient' | 'quest' | 'crafting_station' | '';
  stackable?: boolean;
  maxStack?: number;
  isUsable?: boolean;
  consumeOnUse?: boolean;
  useMessage?: string;
  statRestores?: { stat: string; amount: number }[];
  combinations?: ItemCombination[];
  collectionCategory?: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredient1Id?: string | null;
  ingredient2Id?: string | null;
  ingredient3Id?: string | null;
  resultItemId: string;
  destroyIngredient1?: boolean;
  destroyIngredient2?: boolean;
  destroyIngredient3?: boolean;
  successMessage?: string;
  requirements?: any[];
  outcomes?: any[];
}

// ---- Quests ----
export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  targetId: string;
  description: string;
  requiredAmount?: number;
}

export interface QuestReward {
  type: 'give_item' | 'modify_status' | 'set_flag';
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

// ---- Factions ----
export interface Faction {
  id: string;
  name: string;
  description?: string;
  defaultAffinity?: number;
  role?: string;
  reputationLabel?: string;
  joinFlagId?: string | null;
  allyFactionId?: string | null;
  rivalFactionId?: string | null;
}

// ---- Maps ----
export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  targetSceneId: string | null;
  iconSrc?: string;
  unlockedByDefault?: boolean;
  requiredFlagId?: string | null;
}

export interface FastTravelMap {
  id: string;
  name: string;
  backgroundSrc: string | null;
  nodes: MapNode[];
}

// ---- Lore ----
export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  entryType?: 'lore' | 'journal' | 'quest_note';
  questId?: string | null;
  requiredFlagId?: string | null;
}

// ---- Companions ----
export interface Companion {
  id: string;
  name: string;
  characterId?: string | null;
  assetId: string | null;
  dialogueTreeId: string | null;
  requiredFlagId?: string | null;
  interjections?: string[];
}

// ---- Needs/Stats Config ----
export interface NeedDefinition {
  id: string;
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  decayPerTick: number;
  showInHud: boolean;
}

export interface SkillDefinition {
  id: string;
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  showInHud: boolean;
}

// ---- Settings ----
export interface GlobalSettings {
  stageWidth: number;
  stageHeight: number;
  gridSize: number;
  useDayNightCycle?: boolean;
  enableNeeds?: boolean;
  enableTTRPGStats?: boolean;
  uiTheme?: string;
  uiColorPrimary?: string;
  uiColorSecondary?: string;
  uiColorBackground?: string;
  uiFontFamily?: string;
  uiBorderRadius?: number;
  dialoguePosition?: string;
  dialogueWidthPercent?: number;
  dialogueTextSizePx?: number;
  typewriterSpeed?: number;
  customNeeds?: any[];
  customSkills?: any[];
  customNeedDefinitions?: Record<string, any>;
  customSkillDefinitions?: Record<string, any>;
  [key: string]: any;
}

// ---- Event Rules ----
export interface EventRule {
  id: string;
  name: string;
  trigger: 'on_enter_scene' | 'on_fact_change' | 'on_interact' | 'on_day_start' | 'on_time' | 'on_next_visit';
  triggerParams: Record<string, any>;
  whenCondGroupId?: string | null;
  actionIds: string[];
  once: boolean;
}

// ---- Story Phases ----
export interface StoryPhase {
  id: string;
  key: string;
  label: string;
  order: number;
  enterWhenCondGroupId?: string | null;
  onEnterActionIds?: string[];
}

// ---- Root Project ----
export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  meta: {
    author: string;
    createdAt: string;
    updatedAt: string;
    startSceneId: string | null;
  };
  scenes: Scene[];
  uiMenus: Scene[];
  assets: Asset[];
  characters: Character[];
  factions: Faction[];
  companions: Companion[];
  items: InventoryItem[];
  recipes: CraftingRecipe[];
  dialogueTrees: DialogueTree[];
  quests: Quest[];
  maps: FastTravelMap[];
  lore: LoreEntry[];
  facts: Fact[];
  conditionGroups: ConditionGroup[];
  actions: Action[];
  eventRules: EventRule[];
  storyPhases: StoryPhase[];
  settings: GlobalSettings;
  // Legacy compat
  gameFlags?: string[];
  prefabs?: SceneObject[];
}

// ---- Active Editor Tab ----
export type EditorTab = 'scenes' | 'scene-editor' | 'dialogue' | 'characters' | 'quests' | 'items' | 'needs' | 'settings' | 'preview';
