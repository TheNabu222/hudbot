import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Backpack,
  BookOpen,
  Flag,
  Gift,
  Link,
  MapPin,
  MessageSquare,
  Music,
  Plus,
  Trash2,
  Video,
  Wand2,
  X,
} from "lucide-react";
import {
  Asset,
  ClickResponse,
  DialogueTree,
  InteractionType,
  InventoryItem,
  Quest,
  RuleCondition,
  RuleConditionType,
  Scene,
} from "../types";

interface ClickResponseEditorProps {
  responses: ClickResponse[];
  assets: Asset[];
  scenes: Scene[];
  dialogueTrees: DialogueTree[];
  inventoryItems: InventoryItem[];
  quests: Quest[];
  gameFlags: string[];
  uiMenus: Scene[];
  skillIds: string[];
  needIds: string[];
  relationshipIds: string[];
  onChange: (responses: ClickResponse[]) => void;
}

const responseChoices: Array<{
  interaction: InteractionType;
  label: string;
  icon: React.ElementType;
}> = [
  { interaction: "dialogue", label: "Say or Show Something", icon: MessageSquare },
  { interaction: "sound", label: "Play Sound", icon: Music },
  { interaction: "give-item", label: "Give Item", icon: Gift },
  { interaction: "collect", label: "Pick Up and Remove", icon: Gift },
  { interaction: "set_flag", label: "Remember Something", icon: Flag },
  { interaction: "scene_change", label: "Go Somewhere Else", icon: MapPin },
  { interaction: "start_quest", label: "Start Quest", icon: BookOpen },
  { interaction: "complete_quest", label: "Complete Quest", icon: BookOpen },
  { interaction: "open_ui", label: "Open Menu or HUD", icon: Wand2 },
  { interaction: "play_cutscene", label: "Play Cutscene", icon: Video },
  { interaction: "link", label: "Open Link", icon: Link },
  { interaction: "toggle_inventory", label: "Open Inventory", icon: Backpack },
];

const labelForInteraction = (interaction: InteractionType) =>
  responseChoices.find((choice) => choice.interaction === interaction)?.label ||
  interaction.replace(/_/g, " ");

export const ClickResponseTypePicker: React.FC<{
  value: InteractionType;
  onChange: (interaction: InteractionType) => void;
}> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-1.5">
    <button
      type="button"
      onClick={() => onChange("none")}
      className={`rounded border px-2 py-2 text-left text-[10px] font-bold ${
        value === "none"
          ? "border-emerald-400 bg-emerald-500/15 text-white"
          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
      }`}
    >
      Do nothing
    </button>
    {responseChoices.map((choice) => {
      const Icon = choice.icon;
      return (
        <button
          key={choice.interaction}
          type="button"
          onClick={() => onChange(choice.interaction)}
          className={`flex items-center gap-2 rounded border px-2 py-2 text-left text-[10px] font-bold ${
            value === choice.interaction
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
          {choice.label}
        </button>
      );
    })}
  </div>
);

export const ClickResponseEditor: React.FC<ClickResponseEditorProps> = ({
  responses,
  assets,
  scenes,
  dialogueTrees,
  inventoryItems,
  quests,
  gameFlags,
  uiMenus,
  skillIds,
  needIds,
  relationshipIds,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);

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
            Then also…
          </div>
          <p className="text-[10px] text-neutral-500">
            Add as many click responses as this object needs.
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
        <div className="grid grid-cols-2 gap-1.5 rounded border border-neutral-700 bg-neutral-950 p-2">
          {responseChoices.map((choice) => {
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
                className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-2 py-2 text-left text-[10px] font-bold text-neutral-300 hover:border-emerald-500/50 hover:text-white"
              >
                <Icon size={13} className="text-pink-400" />
                {choice.label}
              </button>
            );
          })}
        </div>
      )}

      {responses.map((response, index) => (
        <div
          key={response.id}
          className="rounded border border-neutral-700 bg-neutral-900/80 p-2"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-comic text-xs font-bold text-emerald-300">
              {index + 2}. {labelForInteraction(response.interaction)}
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

          {response.interaction === "open_ui" && (
            <select
              value={response.targetUiId || ""}
              onChange={(event) =>
                updateResponse(response.id, {
                  targetUiId: event.target.value,
                })
              }
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs"
            >
              <option value="">Choose UI…</option>
              {uiMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
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
