import { Asset, Project, SceneObject } from "../types";

export const stripDuplicatedAssetSources = (project: Project): Project => {
  const embeddedAssetIds = new Map(
    project.assets.flatMap((asset) =>
      [asset.src, asset.dataURL]
        .filter((value): value is string => Boolean(value?.startsWith("data:")))
        .map((value) => [value, asset.id] as const),
    ),
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

type PrepareProjectOptions = {
  keepFavoriteAssets?: boolean;
};

const ASSET_REFERENCE_KEYS = new Set([
  "_assetId",
  "assetId",
  "audioSrc",
  "backgroundAssetId",
  "backgroundSrc",
  "bgmAssetId",
  "customCursorAssetId",
  "cursorAssetId",
  "iconAssetId",
  "iconSrc",
  "playSoundAssetId",
  "portraitAssetId",
  "scriptAssetId",
  "speakerAssetId",
  "src",
  "useSoundAssetId",
]);

const shouldCollectAssetReference = (key: string) =>
  ASSET_REFERENCE_KEYS.has(key) ||
  key.endsWith("AssetId") ||
  key.endsWith("AssetIds");

const collectReferencedAssetValues = (project: Project): Set<string> => {
  const referencedValues = new Set<string>();

  const collect = (value: unknown, key = "") => {
    if (key === "assets") return;
    if (
      typeof value === "string" &&
      value.length > 0 &&
      shouldCollectAssetReference(key)
    ) {
      referencedValues.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(
        ([childKey, childValue]) => collect(childValue, childKey),
      );
    }
  };

  collect(project);
  return referencedValues;
};

const isAssetReferenced = (
  asset: Asset,
  referencedValues: Set<string>,
  keepFavoriteAssets: boolean,
) => {
  if (keepFavoriteAssets && asset.isFavorite) return true;
  return Boolean(
    referencedValues.has(asset.id) ||
      referencedValues.has(asset.src) ||
      (asset.dataURL && referencedValues.has(asset.dataURL)),
  );
};

export const prepareProjectForExport = (
  project: Project,
  options: PrepareProjectOptions = {},
): Project => {
  const strippedProject = stripDuplicatedAssetSources(project);
  const referencedValues = collectReferencedAssetValues(strippedProject);
  const keepFavoriteAssets = options.keepFavoriteAssets ?? false;

  return {
    ...strippedProject,
    assets: (strippedProject.assets || []).filter((asset) =>
      isAssetReferenced(asset, referencedValues, keepFavoriteAssets),
    ),
  };
};
