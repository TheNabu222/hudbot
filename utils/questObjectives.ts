import { QuestObjective } from "../types";

export interface QuestObjectiveContext {
  playerFlags: string[];
  playerInventory: string[];
  currentSceneId: string;
  playerSkills: Record<string, number>;
  playerTalkCounts: Record<string, number>;
}

export function isQuestObjectiveComplete(
  obj: QuestObjective,
  ctx: QuestObjectiveContext,
): boolean {
  switch (obj.type) {
    case "custom_flag":
      return ctx.playerFlags.includes(obj.targetId);
    case "talk_to":
      return (
        (ctx.playerTalkCounts[obj.targetId] || 0) >= (obj.requiredAmount || 1)
      );
    case "collect_item":
      return ctx.playerInventory.includes(obj.targetId);
    case "reach_scene":
      return ctx.currentSceneId === obj.targetId;
    case "skill_check":
      return (
        (ctx.playerSkills[obj.targetId] || 0) >= (obj.requiredAmount || 1)
      );
    default:
      return false;
  }
}

export function buildRelationshipTargets(
  characters: Array<{ id: string; name: string }> = [],
  factions: Array<{ id: string; name: string }> = [],
): Array<{ id: string; label: string }> {
  return [
    ...characters.map((character) => ({
      id: character.id,
      label: character.name,
    })),
    ...factions.map((faction) => ({
      id: faction.id,
      label: `${faction.name} (faction)`,
    })),
  ];
}