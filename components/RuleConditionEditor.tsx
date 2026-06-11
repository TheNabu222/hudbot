import React from "react";
import {
  InventoryItem,
  Quest,
  RuleCondition,
  RuleConditionType,
} from "../types";

interface RuleConditionEditorProps {
  conditions: RuleCondition[];
  conditionMode: "all" | "any";
  triggerOnce: boolean;
  gameFlags: string[];
  inventoryItems: InventoryItem[];
  quests: Quest[];
  skillIds: string[];
  needIds: string[];
  relationshipIds: string[];
  onChange: (updates: {
    conditions?: RuleCondition[];
    conditionMode?: "all" | "any";
    triggerOnce?: boolean;
  }) => void;
  title?: string;
}

export const RuleConditionEditor: React.FC<RuleConditionEditorProps> = ({
  conditions,
  conditionMode,
  triggerOnce,
  gameFlags,
  inventoryItems,
  quests,
  skillIds,
  needIds,
  relationshipIds,
  onChange,
  title = "Only do this if…",
}) => {
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

  const updateCondition = (
    conditionId: string,
    updates: Partial<RuleCondition>,
  ) => {
    onChange({
      conditions: conditions.map((condition) =>
        condition.id === conditionId
          ? { ...condition, ...updates }
          : condition,
      ),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-comic text-[11px] font-bold text-pink-300">
            {title}
          </p>
          <p className="text-[9px] text-neutral-500">
            Leave empty to always run this response.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              conditions: [
                ...conditions,
                {
                  id: crypto.randomUUID(),
                  type: "flag",
                  targetId: gameFlags[0] || "",
                  comparator: "is",
                  value: true,
                },
              ],
            })
          }
          className="rounded border border-pink-500/40 bg-pink-500/10 px-2 py-1 text-[9px] font-bold text-pink-200 hover:bg-pink-500/20"
        >
          + Add condition
        </button>
      </div>

      {conditions.length > 1 && (
        <label className="flex items-center gap-2 text-[10px] text-neutral-400">
          Match
          <select
            value={conditionMode}
            onChange={(event) =>
              onChange({
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

      {conditions.map((condition) => {
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
                updateCondition(condition.id, {
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
                updateCondition(condition.id, {
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
                updateCondition(condition.id, {
                  comparator: event.target
                    .value as RuleCondition["comparator"],
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
                  updateCondition(condition.id, {
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
                onChange({
                  conditions: conditions.filter(
                    (candidate) => candidate.id !== condition.id,
                  ),
                })
              }
              className="col-span-2 justify-self-end rounded px-2 py-1 text-[9px] text-red-400 hover:bg-red-500/10"
            >
              Remove condition
            </button>
          </div>
        );
      })}

      <label className="flex items-center gap-2 text-[10px] text-neutral-400">
        <input
          type="checkbox"
          checked={triggerOnce}
          onChange={(event) => onChange({ triggerOnce: event.target.checked })}
        />
        After it runs once, remember and skip it next time
      </label>
    </div>
  );
};
