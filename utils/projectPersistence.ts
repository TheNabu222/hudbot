import { Project, SceneObject } from "../types";

export const stripDuplicatedAssetSources = (project: Project): Project => {
  const embeddedAssetIds = new Map(
    project.assets
      .filter((asset) => asset.src?.startsWith("data:"))
      .map((asset) => [asset.src, asset.id]),
  );

  const stripObject = (object: SceneObject): SceneObject => {
    const assetId = embeddedAssetIds.get(object.src);
    return assetId
      ? { ...object, src: "", _assetId: object._assetId || assetId }
      : object;
  };

  return {
    ...project,
    prefabs: (project.prefabs || []).map(stripObject),
    scenes: project.scenes.map((scene) => ({
      ...scene,
      objects: scene.objects.map(stripObject),
    })),
    uiMenus: (project.uiMenus || []).map((menu) => ({
      ...menu,
      objects: menu.objects.map(stripObject),
    })),
  };
};
