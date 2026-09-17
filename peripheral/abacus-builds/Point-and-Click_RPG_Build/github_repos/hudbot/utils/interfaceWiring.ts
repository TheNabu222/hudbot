import type { ClickResponse, InteractionType, Project, Scene, SceneObject } from "../types";
import { getNextObjectPlacement } from "./sceneObjectReliability";

export type InterfaceWiringTarget = {
  kind: "scene_object" | "ui_object" | "shell_control";
  id: string;
  sourceId: string;
  sourceName: string;
  objectName: string;
};

export type ProjectObjectRef = {
  kind: "scene_object" | "ui_object";
  sourceId: string;
  sourceName: string;
  object: SceneObject;
};

export const interfaceOpenActionFor = (menu: Pick<Scene, "id" | "name">) => ({
  interaction: "open_ui" as InteractionType,
  targetUiId: menu.id,
  summary: `Click -> Open UI -> ${menu.name}`,
});

const responseOpensMenu = (
  response: Pick<ClickResponse, "interaction" | "targetUiId">,
  menuId: string,
) => response.interaction === "open_ui" && response.targetUiId === menuId;

const objectOpensMenu = (
  object: Pick<SceneObject, "interaction" | "targetUiId" | "clickResponses">,
  menuId: string,
) =>
  (object.interaction === "open_ui" && object.targetUiId === menuId) ||
  Boolean(object.clickResponses?.some((response) => responseOpensMenu(response, menuId)));

export const findInterfaceWiringTargets = (
  project: Project,
  menuId: string,
): InterfaceWiringTarget[] => {
  const sceneTargets = (project.scenes || []).flatMap((scene) =>
    (scene.objects || [])
      .filter((object) => objectOpensMenu(object, menuId))
      .map((object) => ({
        kind: "scene_object" as const,
        id: object.id,
        sourceId: scene.id,
        sourceName: scene.name,
        objectName: object.name || object.id,
      })),
  );

  const uiTargets = (project.uiMenus || []).flatMap((menu) =>
    (menu.objects || [])
      .filter((object) => objectOpensMenu(object, menuId))
      .map((object) => ({
        kind: "ui_object" as const,
        id: object.id,
        sourceId: menu.id,
        sourceName: menu.name,
        objectName: object.name || object.id,
      })),
  );

  const shellTargets = (project.globalSettings.deviceFrame?.controls || [])
    .filter((control) =>
      (control.clickResponses || []).some((response) =>
        responseOpensMenu(response, menuId),
      ),
    )
    .map((control) => ({
      kind: "shell_control" as const,
      id: control.id,
      sourceId: project.globalSettings.deviceFrame?.assetId || "device-frame",
      sourceName: "Device shell",
      objectName: control.name || control.id,
    }));

  return [...sceneTargets, ...uiTargets, ...shellTargets];
};

export const findProjectObjectById = (
  project: Pick<Project, "scenes" | "uiMenus">,
  objectId?: string | null,
): ProjectObjectRef | null => {
  if (!objectId) return null;

  for (const scene of project.scenes || []) {
    const object = (scene.objects || []).find((candidate) => candidate.id === objectId);
    if (object) {
      return {
        kind: "scene_object",
        sourceId: scene.id,
        sourceName: scene.name,
        object,
      };
    }
  }

  for (const menu of project.uiMenus || []) {
    const object = (menu.objects || []).find((candidate) => candidate.id === objectId);
    if (object) {
      return {
        kind: "ui_object",
        sourceId: menu.id,
        sourceName: menu.name,
        object,
      };
    }
  }

  return null;
};

export const wireProjectObjectToInterface = (
  project: Project,
  objectId: string | undefined | null,
  menu: Pick<Scene, "id" | "name">,
): { project: Project; target?: ProjectObjectRef } => {
  const target = findProjectObjectById(project, objectId);
  if (!target) return { project };

  const wireObject = (object: SceneObject) =>
    object.id === objectId
      ? {
          ...object,
          interaction: "open_ui" as InteractionType,
          targetUiId: menu.id,
          cursor:
            object.cursor === "default" || !object.cursor
              ? "pointer"
              : object.cursor,
        }
      : object;

  return {
    target,
    project: {
      ...project,
      scenes: (project.scenes || []).map((scene) => ({
        ...scene,
        objects: (scene.objects || []).map(wireObject),
      })),
      uiMenus: (project.uiMenus || []).map((candidateMenu) => ({
        ...candidateMenu,
        objects: (candidateMenu.objects || []).map(wireObject),
      })),
    },
  };
};

export const createInterfaceOpenerObject = ({
  menu,
  existingObjects,
  sceneWidth,
  sceneHeight,
  label,
}: {
  menu: Pick<Scene, "id" | "name">;
  existingObjects: Pick<SceneObject, "x" | "y" | "width" | "height" | "zIndex">[];
  sceneWidth: number;
  sceneHeight: number;
  label?: string;
}): SceneObject => {
  const width = Math.min(190, Math.max(130, sceneWidth * 0.2));
  const height = 44;
  const placement = getNextObjectPlacement({
    existingObjects,
    width,
    height,
    sceneWidth,
    sceneHeight,
    preferredX: 18,
    preferredY: Math.max(18, sceneHeight - height - 18),
  });
  const zIndex =
    existingObjects.length > 0
      ? Math.max(...existingObjects.map((object) => object.zIndex || 0)) + 1
      : 10;

  return {
    id: crypto.randomUUID(),
    name: `Open ${menu.name}`,
    src: "",
    x: placement.x,
    y: placement.y,
    width,
    height,
    rotation: 0,
    zIndex,
    opacity: 1,
    locked: false,
    cursor: "pointer",
    animation: "none",
    interaction: "open_ui",
    targetUiId: menu.id,
    blendMode: "normal",
    parallaxSpeed: 1,
    hasPhysics: false,
    isUiElement: true,
    uiElementType: "button",
    uiColorPrimary: "#00ffcc",
    uiColorSecondary: "rgba(0,0,0,0.78)",
    uiBorderType: "solid",
    uiBorderRadius: 6,
    textContent: label || menu.name,
    textColor: "#ffffff",
    textFontSize: 13,
    textWeight: "bold",
    textAlign: "center",
  };
};
