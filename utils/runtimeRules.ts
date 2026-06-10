import type {
  RuleComparator,
  RuleCondition,
  RuntimeGameState,
} from "../types";

export const createRuntimeGameState = (
  currentSceneId: string,
  overrides: Partial<RuntimeGameState> = {},
): RuntimeGameState => ({
  version: 1,
  currentSceneId,
  inventory: [],
  flags: {},
  skills: {},
  needs: {},
  relationships: {},
  activeQuests: [],
  completedQuests: [],
  collectedObjects: [],
  activeUiMenus: [],
  triggeredRuleIds: [],
  runtimePositions: {},
  time: 8,
  day: 1,
  ...overrides,
});

export const compareRuleValue = (
  actual: number | boolean,
  comparator: RuleComparator,
  expected: number | boolean,
): boolean => {
  if (comparator === "is") return actual === expected;
  if (comparator === "is_not") return actual !== expected;

  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  if (comparator === "at_least") return actualNumber >= expectedNumber;
  if (comparator === "at_most") return actualNumber <= expectedNumber;
  if (comparator === "greater_than") return actualNumber > expectedNumber;
  if (comparator === "less_than") return actualNumber < expectedNumber;
  return false;
};

export const evaluateRuleCondition = (
  condition: RuleCondition,
  state: RuntimeGameState,
): boolean => {
  const expected = condition.value ?? true;

  if (condition.type === "flag") {
    return compareRuleValue(
      !!state.flags[condition.targetId],
      condition.comparator,
      Boolean(expected),
    );
  }
  if (condition.type === "item") {
    return compareRuleValue(
      state.inventory.includes(condition.targetId),
      condition.comparator,
      Boolean(expected),
    );
  }
  if (condition.type === "quest_active") {
    return compareRuleValue(
      state.activeQuests.includes(condition.targetId),
      condition.comparator,
      Boolean(expected),
    );
  }
  if (condition.type === "quest_completed") {
    return compareRuleValue(
      state.completedQuests.includes(condition.targetId),
      condition.comparator,
      Boolean(expected),
    );
  }
  if (condition.type === "skill") {
    return compareRuleValue(
      state.skills[condition.targetId] ?? 0,
      condition.comparator,
      Number(expected),
    );
  }
  if (condition.type === "need") {
    return compareRuleValue(
      state.needs[condition.targetId] ?? 0,
      condition.comparator,
      Number(expected),
    );
  }
  if (condition.type === "relationship") {
    return compareRuleValue(
      state.relationships[condition.targetId] ?? 0,
      condition.comparator,
      Number(expected),
    );
  }
  if (condition.type === "time") {
    return compareRuleValue(
      state.time,
      condition.comparator,
      Number(expected),
    );
  }
  return false;
};

export const evaluateRuleConditions = (
  conditions: RuleCondition[] = [],
  mode: "all" | "any" = "all",
  state: RuntimeGameState,
): boolean => {
  if (conditions.length === 0) return true;
  return mode === "any"
    ? conditions.some((condition) => evaluateRuleCondition(condition, state))
    : conditions.every((condition) => evaluateRuleCondition(condition, state));
};
