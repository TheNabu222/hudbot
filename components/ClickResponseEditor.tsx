import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
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
  Plus,
  RotateCw,
  Save,
  Settings,
  Trash2,
  Users,
  Video,
  Wand2,
  X,
} from "lucide-react";
import {
  Asset,
  ClickResponse,
  Character,
  DialogueTree,
  InteractionType,
  InventoryItem,
  LoreEntry,
  Quest,
  RuleCondition,
  RuleConditionType,
  Scene,
  SceneObject,
} from "../types";

interface ClickResponseEditorProps {
  responses: ClickResponse[];
  assets: Asset[];
  scenes: Scene[];
  dialogueTrees: DialogueTree[];
  inventoryItems: InventoryItem[];
  quests: Quest[];
  loreEntries?: LoreEntry[];
  gameFlags: string[];
  uiMenus: Scene[];
  sceneObjects?: SceneObject[];
  characters?: Character[];
  skillIds: string[];
  needIds: string[];
  relationshipIds: string[];
  onChange: (responses: ClickResponse[]) => void;
  heading?: string;
  description?: string;
  startNumber?: number;
}

type ResponseChoice = {
  interaction: InteractionType;
  label: string;
  icon: React.ElementType;
};

const responseChoiceGroups: Array<{
  label: string;
  choices: ResponseChoice[];
}> = [
  {
    label: "Story",
    choices: [
      { interaction: "dialogue", label: "Say / Talk", icon: MessageSquare },
      { interaction: "set_flag", label: "Set Story Flag", icon: Flag },
      { interaction: "clear_flag", label: "Clear Story Flag", icon: Flag },
      { interaction: "toggle_flag", label: "Toggle Story Flag", icon: Flag },
      { interaction: "skill_check", label: "Skill Check", icon: Wand2 },
    ],
  },
  {
    label: "Items",
    choices: [
      { interaction: "give-item", label: "Give Item", icon: Gift },
      { interaction: "collect", label: "Pick Up + Hide", icon: Gift },
      { interaction: "open_crafting", label: "Open Crafting", icon: Hammer },
      { interaction: "gift_item", label: "Gift Selected Item", icon: Gift },
    ],
  },
  {
    label: "Quests / Lore",
    choices: [
      { interaction: "start_quest", label: "Start Quest", icon: BookOpen },
      { interaction: "complete_quest_objective", label: "Complete Quest Step", icon: BookOpen },
      { interaction: "complete_quest", label: "Complete Quest", icon: BookOpen },
      { interaction: "open_quest_log", label: "Open Quest Log", icon: BookOpen },
      { interaction: "open_almanac", label: "Open Almanac", icon: BookOpen },
      { interaction: "unlock_lore_entry", label: "Unlock Lore / Journal", icon: BookOpen },
      { interaction: "show_lore_entry", label: "Show Lore Popup", icon: BookOpen },
      { interaction: "open_relationships", label: "Open Relationships", icon: Users },
    ],
  },
  {
    label: "Scene / Objects",
    choices: [
      { interaction: "scene_change", label: "Go to Scene", icon: MapPin },
      { interaction: "open_map", label: "Open Map", icon: MapPin },
      { interaction: "show_object", label: "Show Object", icon: Eye },
      { interaction: "hide_object", label: "Hide Object", icon: EyeOff },
      { interaction: "toggle_object", label: "Toggle Object", icon: Eye },
      { interaction: "modify_number", label: "Change Meter / Text", icon: Wand2 },
    ],
  },
  {
    label: "Interface",
    choices: [
      { interaction: "open_ui", label: "Open Screen UI", icon: Wand2 },
      { interaction: "close_ui", label: "Close Screen UI", icon: X },
      { interaction: "toggle_inventory", label: "Open Inventory", icon: Backpack },
      { interaction: "toggle_needs_hud", label: "Toggle Needs HUD", icon: Wand2 },
      { interaction: "toggle_skills_hud", label: "Toggle Skills HUD", icon: Wand2 },
      { interaction: "open_skills", label: "Open Skills", icon: Wand2 },
      { interaction: "open_settings", label: "Open Settings", icon: Settings },
    ],
  },
  {
    label: "Media / System",
    choices: [
      { interaction: "sound", label: "Play Sound", icon: Music },
      { interaction: "play_cutscene", label: "Play Cutscene", icon: Video },
      { interaction: "run_script", label: "Run Script", icon: Wand2 },
      { interaction: "link", label: "Open Link", icon: Link },
      { interaction: "save_game", label: "Save Game", icon: Save },
      { interaction: "load_game", label: "Load Game", icon: Save },
      { interaction: "restart_scene", label: "Restart Room", icon: RotateCw },
      { interaction: "restart_game", label: "Restart Game", icon: RotateCw },
      { interaction: "advance_day", label: "Advance Day", icon: RotateCw },
      { interaction: "toggle_fullscreen", label: "Fullscreen", icon: Settings },
      { interaction: "toggle_mute", label: "Mute Audio", icon: Music },
      { interaction: "exit_game", label: "Stop Game", icon: X },
    ],
  },
];

const allResponseChoices = responseChoiceGroups.flatMap((group) => group.choices);

const labelForInteraction = (interaction: InteractionType) =>
  allResponseChoices.find((choice) => choice.interaction === interaction)?.label ||
  interaction.replace(/_/g, " ");

export const ClickResponseTypePicker: React.FC<{
  value: InteractionType;
  targetUiId?: string;
  uiMenus?: Scene[];
  onChange: (interaction: InteractionType) => void;
  onChooseAction?: (updates: Partial<ClickResponse>) => void;
}> = ({ value, targetUiId, uiMenus = [], onChange, onChooseAction }) => {
  const choose = (updates: Partial<ClickResponse>) => {
    if (onChooseAction) onChooseAction(updates);
    else if (updates.interaction) onChange(updates.interaction);
  };

  return (
    <div className="space-y-2 rounded border border-neutral-800 bg-neutral-950/70 p-2">
      <button
        type="button"
        onClick={() => choose({ interaction: "none", targetUiId: "" })}
        className={`w-full rounded border px-2 py-2 text-left text-[10px] font-bold ${
          value === "none"
            ? "border-emerald-400 bg-emerald-500/15 text-white"
            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
        }`}
      >
        Do nothing
      </button>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {uiMenus.length > 0 && (
          <div>
            <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
              Your Interface Screens
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {uiMenus.map((menu) => {
                const isActive = value === "open_ui" && targetUiId === menu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() =>
                      choose({
                        interaction: "open_ui",
                        targetUiId: menu.id,
                      })
                    }
                    className={`flex min-h-[38px] items-center gap-2 rounded border px-2 py-2 text-left text-[10px] font-bold ${
                      isActive
                        ? "border-cyan-300 bg-cyan-500/15 text-white"
                        : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-cyan-400/50 hover:text-white"
                    }`}
                  >
                    <Wand2
                      size={13}
                      className={isActive ? "text-cyan-200" : "text-cyan-400"}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{menu.name}</span>
                      <span className="block truncate text-[8px] text-neutral-500">
                        open this UI canvas
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {responseChoiceGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
              {group.label}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {group.choices.map((choice) => {
                const Icon = choice.icon;
                return (
                  <button
                    key={choice.interaction}
                    type="button"
                    onClick={() =>
                      choose({
                        interaction: choice.interaction,
                        targetUiId:
                          choice.interaction === "open_ui" ||
                          choice.interaction === "close_ui"
                            ? targetUiId || ""
                            : "",
                      })
                    }
                    className={`flex min-h-[38px] items-center gap-2 rounded border px-2 py-2 text-left text-[10px] font-bold ${
                      value === choice.interaction &&
                      (choice.interaction !== "open_ui" || !targetUiId)
                        ? "border-emerald-400 bg-emerald-500/15 text-white"
                        : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-emerald-500/40 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={
                        value === choice.interaction
                          ? "text-emerald-300"
                          : "text-pink-400"
                      }
                    />
                    <span className="min-w-0">{choice.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ClickResponseEditor: React.FC<ClickResponseEditorProps> = ({
  responses,
  assets,
  scenes,
  dialogueTrees,
  inventoryItems,
  quests,
  loreEntries = [],
  gameFlags,
  uiMenus,
  sceneObjects = [],
  characters = [],
  skillIds,
  needIds,
  relationshipIds,
  onChange,
  heading = "Then also…",
  description = "Add as many click responses as this object needs.",
  startNumber = 2,
}) => {
  const [isAdding, setIsAdding] = useState(responses.length === 0);

  useEffect(() => {
    if (responses.length === 0) setIsAdding(true);
  }, [responses.length]);

  const updateResponse = (id: string, updates: Partial<ClickResponse>) =>
    onChange(
      responses.map((response) =>
        response.id === id ? { ...response, ...updates } : response,
      ),
    );

  const moveResponse = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= responses.length) return;
    const next = [...responses];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  const conditionTargets = (
    type: RuleConditionType,
  ): Array<{ id: string; label: string }> => {
    if (type === "flag") return gameFlags.map((id) => ({ id, label: id }));
    if (type === "item")
      return inventoryItems.map((item) => ({ id: item.id, label: item.name }));
    if (type === "quest_active" || type === "quest_completed")
      return quests.map((quest) => ({ id: quest.id, label: quest.name }));
    if (type === "skill") return skillIds.map((id) => ({ id, label: id }));
    if (type === "need") return needIds.map((id) => ({ id, label: id }));
    if (type === "relationship")
      return relationshipIds.map((id) => ({ id, label: id }));
    return [{ id: "clock", label: "Current time" }];
  };

  const addCondition = (response: ClickResponse) => {
    const condition: RuleCondition = {
      id: crypto.randomUUID(),
      type: "flag",
      targetId: gameFlags[0] || "",
      comparator: "is",
      value: true,
    };
    updateResponse(response.id, {
      conditions: [...(response.conditions || []), condition],
    });
  };

  const updateCondition = (
    response: ClickResponse,
    conditionId: string,
    updates: Partial<RuleCondition>,
  ) => {
    updateResponse(response.id, {
      conditions: (response.conditions || []).map((condition) =>
        condition.id === conditionId
          ? { ...condition, ...updates }
          : condition,
      ),
    });
  };

  return (
    <div className="mt-4 space-y-2 border-t border-neutral-800 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-comic text-sm font-bold text-white">
            {heading}
          </div>
          <p className="text-[10px] text-neutral-500">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
        >
          {isAdding ? <X size={12} /> : <Plus size={12} />}
          {isAdding ? "Close" : "Add response"}
        </button>
      </div>

      {isAdding && (
        <div className="max-h-[52vh] space-y-3 overflow-y-auto rounded border border-neutral-700 bg-neutral-950 p-2 pr-1">
          {uiMenus.length > 0 && (
            <div>
              <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                Your Interface Screens
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {uiMenus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => {
                      onChange([
                        ...responses,
                        {
                          id: crypto.randomUUID(),
                          interaction: "open_ui",
                          targetUiId: menu.id,
                        },
                      ]);
                      setIsAdding(false);
                    }}
                    className="flex min-h-[38px] items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-2 py-2 text-left text-[10px] font-bold text-neutral-300 hover:border-cyan-400/50 hover:text-white"
                  >
                    <Wand2 size={13} className="text-cyan-400" />
                    <span className="min-w-0">
                      <span className="block truncate">{menu.name}</span>
                      <span className="block truncate text-[8px] text-neutral-500">
                        open this UI canvas
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {responseChoiceGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {group.choices.map((choice) => {
                  const Icon = choice.icon;
                  return (
                    <button
                      key={choice.interaction}
                      type="button"
                      onClick={() => {
                        onChange([
                          ...responses,
                          {
                            id: crypto.randomUUID(),
                            interaction: choice.interaction,
                          },
                        ]);
                        setIsAdding(false);
                      }}
                      className="flex min-h-[38px] items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-2 py-2 text-left text-[10px] font-bold text-neutral-300 hover:border-emerald-500/50 hover:text-white"
                    >
                      <Icon size={13} className="text-pink-400" />
                      <span className="min-w-0">{choice.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {responses.map((response, index) => (
        <div
          key={response.id}
          className="rounded border border-neutral-700 bg-neutral-900/80 p-2"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-comic text-xs font-bold text-emerald-300">
              {index + startNumber}. {labelForInteraction(response.interaction)}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveResponse(index, -1)}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                aria-label="Move response earlier"
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                disabled={index === responses.length - 1}
                onClick={() => moveResponse(index, 1)}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                aria-label="Move response later"
              >
                <ArrowDown size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    responses.filter((candidate) => candidate.id !== response.id),
                  )
                }
                className="rounded p-1 text-red-400 hover:bg-red-500/10"
                aria-label="Delete response"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {response.interaction === "dialogue" && (
            <div className="space-y-2">
              <select
                value={response.dialogueTreeId || ""}
                onChange={(event) =>
                  updateResponse(response.id, {
                    dialogueTreeId: event.target.value || undefined,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
              >
                <option value="">Simple message</option>
                {dialogueTrees.map((tree) => (
                  <option key={tree.id} value={tree.id}>
                    {tree.name}
                  </option>
                ))}
              </select>
              {!response.dialogueTreeId && (
                <textarea
                  value={response.interactionData || ""}
                  onChange={(event) =>
                    updateResponse(response.id, {
                      interactionData: event.target.value,
                    })
                  }
                  placeholder="What appears?"
                  className="min-h-16 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
                />
              )}
            </div>
          )}

          {response.interaction === "sound" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose sound…</option>
              {assets
                .filter((asset) => asset.type === "audio")
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
            </select>
          )}

          {response.interaction === "skill_check" && (
            <textarea
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              placeholder="Success text. Uses this object's skill and DC settings."
              className="min-h-16 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            />
          )}

          {(response.interaction === "give-item" ||
            response.interaction === "collect") && (
            <select
              value={response.giveItemId || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  giveItemId: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose item…</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}

          {response.interaction === "set_flag" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose story flag…</option>
              {gameFlags.map((flag) => (
                <option key={flag} value={flag}>
                  {flag}
                </option>
              ))}
            </select>
          )}

          {(response.interaction === "clear_flag" ||
            response.interaction === "toggle_flag") && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose story flag…</option>
              {gameFlags.map((flag) => (
                <option key={flag} value={flag}>
                  {flag}
                </option>
              ))}
            </select>
          )}

          {response.interaction === "scene_change" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose scene…</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}
                </option>
              ))}
            </select>
          )}

          {(response.interaction === "start_quest" ||
            response.interaction === "complete_quest") && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose quest…</option>
              {quests.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.name}
                </option>
              ))}
            </select>
	          )}

          {response.interaction === "complete_quest_objective" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose quest step…</option>
              {quests.flatMap((quest) =>
                (quest.objectives || []).map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {quest.name}: {objective.description || objective.type}
                  </option>
                )),
              )}
            </select>
          )}

          {(response.interaction === "unlock_lore_entry" ||
            response.interaction === "show_lore_entry") && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose lore or journal entry…</option>
              {loreEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          )}

          {(response.interaction === "open_ui" ||
            response.interaction === "close_ui") && (
            <select
              value={response.targetUiId || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  targetUiId: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">
                {response.interaction === "open_ui"
                  ? "Choose UI…"
                  : "Close top open UI"}
              </option>
              {uiMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
          )}

          {response.interaction === "modify_number" && (
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <select
                value={response.targetUiId || ""}
                onChange={(event) =>
                  updateResponse(response.id, {
                    targetUiId: event.target.value,
                  })
                }
                className="min-w-0 rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
              >
                <option value="">Choose meter or text…</option>
                {scenes.flatMap((scene) =>
                  scene.objects
                    .filter((object) => object.isUiElement || object.isText)
                    .map((object) => (
                      <option key={object.id} value={object.id}>
                        {scene.name}: {object.name || object.id}
                      </option>
                    )),
                )}
                {uiMenus.flatMap((menu) =>
                  menu.objects
                    .filter((object) => object.isUiElement || object.isText)
                    .map((object) => (
                      <option key={object.id} value={object.id}>
                        {menu.name}: {object.name || object.id}
                      </option>
                    )),
                )}
              </select>
              <input
                type="number"
                value={response.interactionData || 0}
                onChange={(event) =>
                  updateResponse(response.id, {
                    interactionData: event.target.value,
                  })
                }
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
              />
            </div>
          )}

          {(response.interaction === "show_object" ||
            response.interaction === "hide_object" ||
            response.interaction === "toggle_object") && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose object…</option>
              {sceneObjects.map((object) => (
                <option key={object.id} value={object.id}>
                  {object.name || `Object ${object.id.slice(0, 4)}`}
                </option>
              ))}
            </select>
          )}

          {response.interaction === "gift_item" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose roster character…</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          )}

          {response.interaction === "run_script" && (
            <select
              value={response.scriptAssetId || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  scriptAssetId: event.target.value || undefined,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose script…</option>
              {assets
                .filter((asset) => asset.type === "script")
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
            </select>
          )}

          {response.interaction === "play_cutscene" && (
            <select
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose video…</option>
              {assets
                .filter((asset) => asset.type === "video")
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
            </select>
          )}

          {response.interaction === "link" && (
            <input
              value={response.interactionData || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  interactionData: event.target.value,
                })
              }
              placeholder="https://…"
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            />
          )}

          {[
            "toggle_inventory",
            "toggle_needs_hud",
            "toggle_skills_hud",
            "open_crafting",
            "open_quest_log",
            "open_map",
            "open_skills",
            "open_almanac",
            "open_relationships",
            "open_settings",
            "exit_game",
            "save_game",
            "load_game",
            "restart_scene",
            "restart_game",
            "toggle_fullscreen",
            "toggle_mute",
            "advance_day",
          ].includes(response.interaction) && (
            <div className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[10px] text-neutral-400">
              This response uses the built-in game state. No extra target is needed.
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-neutral-700/70 pt-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-comic text-[11px] font-bold text-pink-300">
                  Only do this if…
                </p>
                <p className="text-[9px] text-neutral-500">
                  Leave empty to always run this response.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addCondition(response)}
                className="rounded border border-pink-500/40 bg-pink-500/10 px-2 py-1 text-[9px] font-bold text-pink-200 hover:bg-pink-500/20"
              >
                + Add condition
              </button>
            </div>

            {(response.conditions || []).length > 1 && (
              <label className="flex items-center gap-2 text-[10px] text-neutral-400">
                Match
                <select
                  value={response.conditionMode || "all"}
                  onChange={(event) =>
                    updateResponse(response.id, {
                      conditionMode: event.target.value as "all" | "any",
                    })
                  }
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[10px]"
                >
                  <option value="all">all conditions</option>
                  <option value="any">any condition</option>
                </select>
              </label>
            )}

            {(response.conditions || []).map((condition) => {
              const isNumberCondition = [
                "skill",
                "need",
                "relationship",
                "time",
              ].includes(condition.type);
              const targets = conditionTargets(condition.type);
              return (
                <div
                  key={condition.id}
                  className="grid grid-cols-2 gap-1 rounded border border-neutral-800 bg-neutral-950/70 p-1.5"
                >
                  <select
                    value={condition.type}
                    onChange={(event) => {
                      const type = event.target.value as RuleConditionType;
                      const nextTargets = conditionTargets(type);
                      const numberCondition = [
                        "skill",
                        "need",
                        "relationship",
                        "time",
                      ].includes(type);
                      updateCondition(response, condition.id, {
                        type,
                        targetId: nextTargets[0]?.id || "",
                        comparator: numberCondition ? "at_least" : "is",
                        value: numberCondition ? 1 : true,
                      });
                    }}
                    className="min-w-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-1 text-[9px]"
                  >
                    <option value="flag">story flag</option>
                    <option value="item">player has item</option>
                    <option value="quest_active">quest is active</option>
                    <option value="quest_completed">quest is finished</option>
                    <option value="skill">skill level</option>
                    <option value="need">need level</option>
                    <option value="relationship">relationship</option>
                    <option value="time">time of day</option>
                  </select>
                  <select
                    value={condition.targetId}
                    onChange={(event) =>
                      updateCondition(response, condition.id, {
                        targetId: event.target.value,
                      })
                    }
                    className="min-w-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-1 text-[9px]"
                  >
                    {targets.length === 0 && <option value="">None made yet</option>}
                    {targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={condition.comparator}
                    onChange={(event) =>
                      updateCondition(response, condition.id, {
                        comparator: event.target.value as RuleCondition["comparator"],
                      })
                    }
                    className="min-w-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-1 text-[9px]"
                  >
                    {isNumberCondition ? (
                      <>
                        <option value="at_least">at least</option>
                        <option value="at_most">at most</option>
                        <option value="greater_than">more than</option>
                        <option value="less_than">less than</option>
                        <option value="is">exactly</option>
                      </>
                    ) : (
                      <>
                        <option value="is">is true</option>
                        <option value="is_not">is false</option>
                      </>
                    )}
                  </select>
                  {isNumberCondition ? (
                    <input
                      type="number"
                      value={Number(condition.value ?? 1)}
                      onChange={(event) =>
                        updateCondition(response, condition.id, {
                          value: Number(event.target.value),
                        })
                      }
                      className="min-w-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-1 text-[9px]"
                    />
                  ) : (
                    <span className="self-center text-center text-[9px] text-neutral-500">
                      {condition.comparator === "is" ? "yes" : "no"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateResponse(response.id, {
                        conditions: (response.conditions || []).filter(
                          (candidate) => candidate.id !== condition.id,
                        ),
                      })
                    }
                    className="col-span-2 justify-self-end rounded px-2 py-1 text-[9px] text-red-400 hover:bg-red-500/10"
                    aria-label="Remove condition"
                  >
                    Remove condition
                  </button>
                </div>
              );
            })}

            <label className="flex items-center gap-2 text-[10px] text-neutral-400">
              <input
                type="checkbox"
                checked={!!response.triggerOnce}
                onChange={(event) =>
                  updateResponse(response.id, {
                    triggerOnce: event.target.checked,
                  })
                }
              />
              After it runs once, remember and skip it next time
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};
