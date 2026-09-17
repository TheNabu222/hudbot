import type { InteractionType, Scene, SceneObject } from "../types";

export const DEFAULT_OBJECT_CASCADE_STEP = 24;

const normalizeInteraction = (
  interaction?: InteractionType | string | null,
): InteractionType =>
  interaction && interaction !== "none"
    ? (interaction as InteractionType)
    : "none";

export const isInteractiveObject = (
  object: Pick<
    SceneObject,
    | "interaction"
    | "clickResponses"
    | "ignoreClicks"
    | "hidden"
    | "audioSrc"
    | "isDraggable"
    | "triggerOnEnter"
  >,
) =>
  !object.ignoreClicks &&
  object.hidden !== true &&
  (normalizeInteraction(object.interaction) !== "none" ||
    Boolean(object.audioSrc) ||
    object.isDraggable === true ||
    object.triggerOnEnter === true ||
    Boolean(object.clickResponses?.some((response) => response.interaction !== "none")));

export const getEffectiveInteraction = (
  object: Pick<SceneObject, "interaction" | "clickResponses">,
): InteractionType =>
  normalizeInteraction(object.interaction) !== "none"
    ? normalizeInteraction(object.interaction)
    : normalizeInteraction(
        object.clickResponses?.find(
          (response) => normalizeInteraction(response.interaction) !== "none",
        )?.interaction,
      );

export const getInteractionSummary = (
  object: Pick<
    SceneObject,
    | "interaction"
    | "interactionData"
    | "dialogueTreeId"
    | "targetUiId"
    | "giveItemId"
    | "clickResponses"
    | "audioSrc"
    | "isDraggable"
    | "triggerOnEnter"
  >,
  lookup: {
    dialogueName?: (id?: string) => string;
    sceneName?: (id?: string) => string;
    uiName?: (id?: string) => string;
    itemName?: (id?: string) => string;
    loreName?: (id?: string) => string;
  } = {},
) => {
  const interaction = getEffectiveInteraction(object);
  const targetId =
    object.dialogueTreeId ||
    object.targetUiId ||
    object.giveItemId ||
    object.interactionData ||
    object.clickResponses?.find((response) => response.interaction === interaction)
      ?.dialogueTreeId ||
    object.clickResponses?.find((response) => response.interaction === interaction)
      ?.targetUiId ||
    object.clickResponses?.find((response) => response.interaction === interaction)
      ?.giveItemId ||
    object.clickResponses?.find((response) => response.interaction === interaction)
      ?.interactionData;

  if (interaction === "dialogue") {
    return `Click -> Dialogue -> ${lookup.dialogueName?.(targetId) || targetId || "Choose dialogue"}`;
  }
  if (interaction === "scene_change") {
    return `Click -> Scene -> ${lookup.sceneName?.(targetId) || targetId || "Choose scene"}`;
  }
  if (interaction === "open_ui") {
    return `Click -> Open UI -> ${lookup.uiName?.(targetId) || targetId || "Choose UI"}`;
  }
  if (interaction === "give-item" || interaction === "collect") {
    return `Click -> Item -> ${lookup.itemName?.(targetId) || targetId || "Choose item"}`;
  }
  if (interaction === "unlock_lore_entry" || interaction === "show_lore_entry") {
    return `Click -> Lore -> ${lookup.loreName?.(targetId) || targetId || "Choose lore"}`;
  }
  if (interaction === "none" && object.audioSrc) return "Click -> Sound";
  if (interaction === "none" && object.triggerOnEnter) return "Hover -> Reaction";
  if (interaction === "none" && object.isDraggable) return "Drag -> Move object";
  if (interaction === "none") return "Click -> No action";
  return `Click -> ${String(interaction).replace(/_/g, " ")}`;
};

const overlaps = (
  a: Pick<SceneObject, "x" | "y" | "width" | "height">,
  b: Pick<SceneObject, "x" | "y" | "width" | "height">,
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const containsPoint = (
  object: Pick<SceneObject, "x" | "y" | "width" | "height">,
  x: number,
  y: number,
) =>
  x >= object.x &&
  x <= object.x + object.width &&
  y >= object.y &&
  y <= object.y + object.height;

const clampPlacement = (
  x: number,
  y: number,
  width: number,
  height: number,
  sceneWidth: number,
  sceneHeight: number,
) => ({
  x: Math.max(0, Math.min(Math.max(0, sceneWidth - width), Math.round(x))),
  y: Math.max(0, Math.min(Math.max(0, sceneHeight - height), Math.round(y))),
});

export const getNextObjectPlacement = ({
  existingObjects,
  width,
  height,
  sceneWidth,
  sceneHeight,
  preferredX,
  preferredY,
  cascadeStep = DEFAULT_OBJECT_CASCADE_STEP,
}: {
  existingObjects: Pick<SceneObject, "x" | "y" | "width" | "height">[];
  width: number;
  height: number;
  sceneWidth: number;
  sceneHeight: number;
  preferredX?: number;
  preferredY?: number;
  cascadeStep?: number;
}) => {
  const start = clampPlacement(
    preferredX ?? sceneWidth / 2 - width / 2,
    preferredY ?? sceneHeight / 2 - height / 2,
    width,
    height,
    sceneWidth,
    sceneHeight,
  );

  const maxAttempts = 48;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const row = Math.floor(attempt / 8);
    const col = attempt % 8;
    const candidate = clampPlacement(
      start.x + col * cascadeStep,
      start.y + row * cascadeStep,
      width,
      height,
      sceneWidth,
      sceneHeight,
    );
    const rect = { ...candidate, width, height };
    if (!existingObjects.some((object) => overlaps(rect, object))) {
      return candidate;
    }
  }

  const offset = existingObjects.length * cascadeStep;
  return clampPlacement(
    start.x + offset,
    start.y + offset,
    width,
    height,
    sceneWidth,
    sceneHeight,
  );
};

export const findObjectsAtPoint = (
  objects: SceneObject[],
  x: number,
  y: number,
) =>
  objects
    .filter(
      (object) =>
        object.hidden !== true &&
        containsPoint(object, x, y),
    )
    .sort((a, b) => b.zIndex - a.zIndex);

export const getObscuredInteractiveWarnings = (scene: Scene) => {
  const objects = scene.objects || [];
  return objects.flatMap((object) => {
    if (!isInteractiveObject(object)) return [];
    const coveringObject = objects
      .filter(
        (candidate) =>
          candidate.id !== object.id &&
          candidate.zIndex > object.zIndex &&
          candidate.hidden !== true &&
          candidate.opacity !== 0 &&
          !candidate.ignoreClicks &&
          candidate.x <= object.x &&
          candidate.y <= object.y &&
          candidate.x + candidate.width >= object.x + object.width &&
          candidate.y + candidate.height >= object.y + object.height,
      )
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    return coveringObject
      ? [
          {
            objectId: object.id,
            objectName: object.name,
            coveringObjectId: coveringObject.id,
            coveringObjectName: coveringObject.name,
          },
        ]
      : [];
  });
};

export const selectSceneObjectById = (
  scene: Scene,
  objectId: string,
): { selectedObjectId: string | null; selectedMultiIds: string[] } => {
  const object = scene.objects.find((candidate) => candidate.id === objectId);
  return object
    ? { selectedObjectId: object.id, selectedMultiIds: [object.id] }
    : { selectedObjectId: null, selectedMultiIds: [] };
};
