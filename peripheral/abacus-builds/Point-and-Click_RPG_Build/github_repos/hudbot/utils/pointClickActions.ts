import type React from "react";
import {
  Backpack,
  BookOpen,
  Eye,
  EyeOff,
  Flag,
  Gift,
  Hammer,
  Link,
  MapPin,
  MessageSquare,
  Music,
  RotateCw,
  Save,
  Settings,
  Users,
  Video,
  Wand2,
  X,
} from "lucide-react";
import type { ClickResponse, InteractionType, Scene } from "../types";

export type ResponseChoice = {
  interaction: InteractionType;
  label: string;
  icon: React.ElementType;
  description?: string;
  pointClickRole?: "talk" | "inspect" | "take" | "travel" | "interface" | "system";
};

export const responseChoiceGroups: Array<{
  label: string;
  choices: ResponseChoice[];
}> = [
  {
    label: "Story",
    choices: [
      { interaction: "dialogue", label: "Say / Talk", icon: MessageSquare, pointClickRole: "talk" },
      { interaction: "set_flag", label: "Set Story Flag", icon: Flag, pointClickRole: "inspect" },
      { interaction: "clear_flag", label: "Clear Story Flag", icon: Flag },
      { interaction: "toggle_flag", label: "Toggle Story Flag", icon: Flag },
      { interaction: "skill_check", label: "Skill Check", icon: Wand2, pointClickRole: "inspect" },
    ],
  },
  {
    label: "Items",
    choices: [
      { interaction: "give-item", label: "Give Item", icon: Gift, pointClickRole: "take" },
      { interaction: "collect", label: "Pick Up + Hide", icon: Gift, pointClickRole: "take" },
      { interaction: "open_crafting", label: "Open Built-in Crafting", icon: Hammer, pointClickRole: "interface" },
      { interaction: "gift_item", label: "Gift Selected Item", icon: Gift },
    ],
  },
  {
    label: "Quests / Lore",
    choices: [
      { interaction: "start_quest", label: "Start Quest", icon: BookOpen, pointClickRole: "inspect" },
      { interaction: "complete_quest_objective", label: "Complete Quest Step", icon: BookOpen, pointClickRole: "inspect" },
      { interaction: "complete_quest", label: "Complete Quest", icon: BookOpen },
      { interaction: "open_quest_log", label: "Open Built-in Quest Log", icon: BookOpen, pointClickRole: "interface" },
      { interaction: "open_almanac", label: "Open Built-in Almanac", icon: BookOpen, pointClickRole: "interface" },
      { interaction: "unlock_lore_entry", label: "Unlock Lore / Journal", icon: BookOpen, pointClickRole: "inspect" },
      { interaction: "show_lore_entry", label: "Show Lore Popup", icon: BookOpen, pointClickRole: "inspect" },
      { interaction: "open_relationships", label: "Open Built-in Relationships", icon: Users, pointClickRole: "interface" },
    ],
  },
  {
    label: "Scene / Objects",
    choices: [
      { interaction: "scene_change", label: "Go to Scene", icon: MapPin, pointClickRole: "travel" },
      { interaction: "open_map", label: "Open Built-in Map", icon: MapPin, pointClickRole: "interface" },
      { interaction: "show_object", label: "Show Object", icon: Eye },
      { interaction: "hide_object", label: "Hide Object", icon: EyeOff },
      { interaction: "toggle_object", label: "Toggle Object", icon: Eye, pointClickRole: "inspect" },
      { interaction: "modify_number", label: "Change Meter / Text", icon: Wand2 },
    ],
  },
  {
    label: "Interface",
    choices: [
      { interaction: "open_ui", label: "Open Screen UI", icon: Wand2, pointClickRole: "interface" },
      { interaction: "close_ui", label: "Close Screen UI", icon: X, pointClickRole: "interface" },
      { interaction: "toggle_inventory", label: "Open Built-in Inventory", icon: Backpack, pointClickRole: "interface" },
      { interaction: "toggle_needs_hud", label: "Toggle Needs HUD", icon: Wand2, pointClickRole: "interface" },
      { interaction: "toggle_skills_hud", label: "Toggle Skills HUD", icon: Wand2, pointClickRole: "interface" },
      { interaction: "open_skills", label: "Open Built-in Skills", icon: Wand2, pointClickRole: "interface" },
      { interaction: "open_settings", label: "Open Built-in Settings", icon: Settings, pointClickRole: "interface" },
    ],
  },
  {
    label: "Media / System",
    choices: [
      { interaction: "sound", label: "Play Sound", icon: Music, pointClickRole: "inspect" },
      { interaction: "play_cutscene", label: "Play Cutscene", icon: Video },
      { interaction: "run_script", label: "Run Script", icon: Wand2 },
      { interaction: "link", label: "Open Link", icon: Link },
      { interaction: "save_game", label: "Save Game", icon: Save, pointClickRole: "system" },
      { interaction: "load_game", label: "Load Game", icon: Save, pointClickRole: "system" },
      { interaction: "restart_scene", label: "Restart Room", icon: RotateCw, pointClickRole: "system" },
      { interaction: "restart_game", label: "Restart Game", icon: RotateCw, pointClickRole: "system" },
      { interaction: "advance_day", label: "Advance Day", icon: RotateCw, pointClickRole: "system" },
      { interaction: "toggle_fullscreen", label: "Fullscreen", icon: Settings, pointClickRole: "system" },
      { interaction: "toggle_mute", label: "Mute Audio", icon: Music, pointClickRole: "system" },
      { interaction: "exit_game", label: "Stop Game", icon: X, pointClickRole: "system" },
    ],
  },
];

export const allResponseChoices = responseChoiceGroups.flatMap((group) => group.choices);

export const labelForInteraction = (interaction: InteractionType) =>
  allResponseChoices.find((choice) => choice.interaction === interaction)?.label ||
  interaction.replace(/_/g, " ");

export const quickInterfaceChoices: ResponseChoice[] = [
  { interaction: "toggle_inventory", label: "Open Built-in Inventory", icon: Backpack, pointClickRole: "interface" },
  { interaction: "open_quest_log", label: "Open Built-in Quest Log", icon: BookOpen, pointClickRole: "interface" },
  { interaction: "open_almanac", label: "Open Built-in Almanac", icon: BookOpen, pointClickRole: "interface" },
  { interaction: "open_map", label: "Open Built-in Map", icon: MapPin, pointClickRole: "interface" },
  { interaction: "open_crafting", label: "Open Built-in Crafting", icon: Hammer, pointClickRole: "interface" },
  { interaction: "open_skills", label: "Open Built-in Skills", icon: Wand2, pointClickRole: "interface" },
  { interaction: "open_relationships", label: "Open Built-in People", icon: Users, pointClickRole: "interface" },
  { interaction: "open_settings", label: "Open Built-in Settings", icon: Settings, pointClickRole: "interface" },
  { interaction: "toggle_needs_hud", label: "Toggle Needs HUD", icon: Wand2, pointClickRole: "interface" },
  { interaction: "toggle_skills_hud", label: "Toggle Skills HUD", icon: Wand2, pointClickRole: "interface" },
];

const uiScreenKindPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "Inventory Screen", pattern: /inventory|item wheel|equipment|loadout|player menu/i },
  { label: "Item Inspector", pattern: /inspect item|item detail|item inspector|use item|hotspot inspector|object examine/i },
  { label: "Quest Screen", pattern: /quest|objective|game log/i },
  { label: "Almanac Screen", pattern: /almanac|codex|journal|lore|field notes|notes|gallery|collectable|content browser|tutorial|bestiary/i },
  { label: "Map Screen", pattern: /map|travel|door/i },
  { label: "Crafting Screen", pattern: /craft|recipe/i },
  { label: "People Screen", pattern: /relationship|people|roster|character|npc talk/i },
  { label: "Settings Screen", pattern: /settings|pause|audio|music|sfx|controls|accessibility|language/i },
  { label: "Skills Screen", pattern: /skill|ability/i },
];

const uiRegionLabels: Record<string, string> = {
  inventory_grid: "item grid",
  journal_text: "text pane",
  quest_list: "quest list",
  stat_list: "meter list",
  button: "button",
  panel: "panel",
};

const pluralize = (label: string, count: number) =>
  count === 1 ? label : `${label}s`;

export const getUiScreenKind = (menu: Scene) =>
  uiScreenKindPatterns.find((candidate) => candidate.pattern.test(menu.name || ""))
    ?.label || "Custom Screen";

export const summarizeUiMenu = (menu: Scene) => {
  const counts = (menu.objects || []).reduce<Record<string, number>>((acc, object) => {
    const key = object.uiElementType || (object.isUiElement ? "ui element" : "");
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const priority = ["inventory_grid", "journal_text", "quest_list", "stat_list", "button", "panel"];
  const parts = priority
    .filter((key) => counts[key])
    .map((key) => `${counts[key]} ${pluralize(uiRegionLabels[key] || key.replace(/_/g, " "), counts[key])}`);
  const remaining = Object.entries(counts)
    .filter(([key]) => !priority.includes(key))
    .reduce((sum, [, count]) => sum + count, 0);
  if (remaining) parts.push(`${remaining} other ${remaining === 1 ? "region" : "regions"}`);
  return parts.length ? parts.join(", ") : "empty custom UI canvas";
};

export const buildUiScreenActions = (uiMenus: Scene[]) =>
  uiMenus.map((menu) => ({
    menu,
    kind: getUiScreenKind(menu),
    description: summarizeUiMenu(menu),
  }));

export const labelForResponse = (response: ClickResponse, uiMenus: Scene[]) => {
  if (response.interaction === "open_ui") {
    const menu = uiMenus.find((candidate) => candidate.id === response.targetUiId);
    return menu ? `Open Screen UI -> ${menu.name}` : "Open Screen UI";
  }
  if (response.interaction === "close_ui") {
    const menu = uiMenus.find((candidate) => candidate.id === response.targetUiId);
    return menu ? `Close Screen UI -> ${menu.name}` : "Close top Screen UI";
  }
  return labelForInteraction(response.interaction);
};

export const pointClickQuickActions = [
  {
    id: "talk",
    label: "Talk",
    description: "Start dialogue with an NPC or speaking object.",
    updates: { interaction: "dialogue", cursor: "help" },
  },
  {
    id: "inspect",
    label: "Inspect",
    description: "Show lore, a clue, or descriptive text.",
    updates: { interaction: "show_lore_entry", cursor: "help" },
  },
  {
    id: "take",
    label: "Pick up",
    description: "Collect an item and hide the scene object.",
    updates: { interaction: "collect", cursor: "pointer" },
  },
  {
    id: "use_item",
    label: "Use item",
    description: "Require an inventory item before the click succeeds.",
    updates: { interaction: "dialogue", cursor: "pointer" },
  },
  {
    id: "travel",
    label: "Go",
    description: "Move to another room or map scene.",
    updates: { interaction: "scene_change", cursor: "pointer" },
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Open the built-in inventory.",
    updates: { interaction: "toggle_inventory", cursor: "pointer" },
  },
  {
    id: "almanac",
    label: "Almanac",
    description: "Open the built-in lore/almanac view.",
    updates: { interaction: "open_almanac", cursor: "help" },
  },
] satisfies Array<{
  id: string;
  label: string;
  description: string;
  updates: Partial<{ interaction: InteractionType; cursor: string }>;
}>;
