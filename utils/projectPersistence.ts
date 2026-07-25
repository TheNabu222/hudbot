import { Asset, Project, SceneObject } from "../types";

const GITHUB_RAW_ASSET_BASE =
  "https://raw.githubusercontent.com/thenabu222/entropic-ai/main/";

const REPOSITORY_FILE_EXTENSIONS =
  /\.(png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm|js|ts)$/i;

export const isEmbeddedSource = (src?: string) => Boolean(src?.startsWith("data:"));

const getOriginalEmbeddedSources = (asset: Asset) =>
  [asset.src, asset.dataURL].filter(
    (value): value is string => Boolean(value && isEmbeddedSource(value)),
  );

const cleanPathPart = (part: string) =>
  part
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

const restoreRepositoryFileName = (name: string) => {
  const cleaned = name.trim();
  const direct = cleaned.match(REPOSITORY_FILE_EXTENSIONS);
  if (direct) return cleaned.slice(0, direct.index! + direct[0].length);

  const cropSource = cleaned.match(
    /^(.+?\.(?:png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm|js|ts))(?:_crop.*)?$/i,
  );
  return cropSource ? cropSource[1] : cleaned;
};

export const inferGitHubAssetSrc = (asset: Asset): string => {
  const idSrc = inferGitHubAssetIdSrc(asset.id);
  if (idSrc) return idSrc;
  if (asset.src && !isEmbeddedSource(asset.src)) return asset.src;

  const category = cleanPathPart(asset.category || "");
  const name = restoreRepositoryFileName(asset.name || "");
  if (!name || !REPOSITORY_FILE_EXTENSIONS.test(name)) return "";

  const repoPath =
    category && category !== "root"
      ? category.startsWith("assets/")
        ? `${category}/${name}`
        : `assets/${category}/${name}`
      : `assets/${name}`;

  const encodedPath = repoPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${GITHUB_RAW_ASSET_BASE}${encodedPath}`;
};

export const inferGitHubAssetIdSrc = (assetId?: string | null): string => {
  if (!assetId?.startsWith("github:")) return "";
  const repoPath = cleanPathPart(assetId.slice("github:".length));
  if (!repoPath || !REPOSITORY_FILE_EXTENSIONS.test(repoPath)) return "";
  const encodedPath = repoPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${GITHUB_RAW_ASSET_BASE}${encodedPath}`;
};

export const stripDuplicatedAssetSources = (project: Project): Project => {
  const assetsById = new Map(project.assets.map((asset) => [asset.id, asset]));
  const embeddedAssetIds = new Map(
    project.assets.flatMap((asset) =>
      getOriginalEmbeddedSources(asset).map((value) => [value, asset.id] as const),
    ),
  );

  const stripObject = (object: SceneObject): SceneObject => {
    const linkedAsset = object._assetId
      ? assetsById.get(object._assetId)
      : undefined;
    const assetId = object._assetId || embeddedAssetIds.get(object.src);
    const hasDuplicatedSource =
      isEmbeddedSource(object.src) ||
      Boolean(
        linkedAsset &&
          object.src &&
          (object.src === linkedAsset.src || object.src === linkedAsset.dataURL),
      );
    return assetId
      ? {
          ...object,
          src: hasDuplicatedSource ? "" : object.src,
          _assetId: object._assetId || assetId,
        }
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
  assetScope?: "used" | "all";
  includeEmbeddedAssetData?: boolean | "fallback";
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

const EMBEDDED_SOURCE_REFERENCE_KEYS = new Set([
  "audioSrc",
  "backgroundSrc",
  "iconSrc",
  "src",
]);

const shouldCollectAssetReference = (key: string) =>
  ASSET_REFERENCE_KEYS.has(key) ||
  key.endsWith("AssetId") ||
  key.endsWith("AssetIds");

const shouldRewriteEmbeddedSourceReference = (key: string) =>
  EMBEDDED_SOURCE_REFERENCE_KEYS.has(key) || key.endsWith("Src");

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
      value.forEach((item) => collect(item, key));
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

const rewriteEmbeddedSourceReferences = <T>(
  value: T,
  embeddedSourceMap: Map<string, string>,
  removeUnmappedEmbeddedSources = false,
  key = "",
): T => {
  if (key === "assets") return value;
  if (
    typeof value === "string" &&
    isEmbeddedSource(value) &&
    shouldRewriteEmbeddedSourceReference(key)
  ) {
    if (embeddedSourceMap.has(value)) {
      return embeddedSourceMap.get(value) as T;
    }
    return (removeUnmappedEmbeddedSources ? "" : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      rewriteEmbeddedSourceReferences(
        item,
        embeddedSourceMap,
        removeUnmappedEmbeddedSources,
        key,
      ),
    ) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [
        childKey,
        rewriteEmbeddedSourceReferences(
          child,
          embeddedSourceMap,
          removeUnmappedEmbeddedSources,
          childKey,
        ),
      ]),
    ) as T;
  }
  return value;
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
  const assetScope = options.assetScope ?? "used";
  const includeEmbeddedAssetData = options.includeEmbeddedAssetData ?? true;
  const keepFavoriteAssets = options.keepFavoriteAssets ?? false;
  const prepareAsset = (asset: Asset): Asset => {
    const inferredSrc = inferGitHubAssetSrc(asset);
    const hasLinkedSrc = Boolean(inferredSrc);
    const hasEmbeddedSource =
      isEmbeddedSource(asset.src) || isEmbeddedSource(asset.dataURL);
    if (includeEmbeddedAssetData === "fallback") {
      if (asset.exportSource === "embedded_fallback" && hasEmbeddedSource) {
        const embeddedSrc = isEmbeddedSource(asset.src) ? asset.src : asset.dataURL;
        return {
          ...asset,
          src: embeddedSrc || asset.src,
          dataURL: undefined,
          exportSource: "embedded_fallback",
          exportReason:
            asset.exportReason ||
            "Used asset is marked as an embedded fallback, so export keeps its data for reliability.",
        };
      }
      return hasLinkedSrc
        ? {
            ...asset,
            src: inferredSrc,
            dataURL: undefined,
            exportSource: hasEmbeddedSource ? "github_inferred" : "linked",
            exportReason: hasEmbeddedSource
              ? "Base64 replaced with inferred GitHub raw asset URL."
              : "Existing non-embedded asset URL preserved.",
          }
        : {
            ...asset,
            src:
              (isEmbeddedSource(asset.src) ? asset.src : asset.dataURL) ||
              asset.src,
            dataURL: undefined,
            exportSource: hasEmbeddedSource ? "embedded_fallback" : undefined,
            exportReason: hasEmbeddedSource
              ? "Used asset has no inferable repository filename, so embedded data is required for a self-contained export."
              : undefined,
          };
    }
    if (includeEmbeddedAssetData) {
      return {
        ...asset,
        exportSource: hasEmbeddedSource ? "embedded_fallback" : "linked",
        exportReason: hasEmbeddedSource
          ? "Full-library backup keeps embedded asset data by request."
          : "Existing non-embedded asset URL preserved.",
      };
    }
    const strippedAsset: Asset = {
      ...asset,
      dataURL: undefined,
      src: inferredSrc,
      exportSource: hasLinkedSrc ? "github_inferred" : undefined,
      exportReason: hasLinkedSrc
        ? "Base64 stripped and replaced with inferred GitHub raw asset URL."
        : "Embedded data stripped; no repository URL could be inferred.",
    };
    return strippedAsset;
  };
  const assets =
    assetScope === "all"
      ? strippedProject.assets || []
      : (strippedProject.assets || []).filter((asset) =>
          isAssetReferenced(asset, referencedValues, keepFavoriteAssets),
        );

  const preparedAssets = assets.map(prepareAsset);
  const embeddedSourceMap = new Map<string, string>();
  assets.forEach((originalAsset, index) => {
    const preparedAsset = preparedAssets[index];
    const replacement = preparedAsset.src || preparedAsset.dataURL || "";
    getOriginalEmbeddedSources(originalAsset).forEach((embeddedSource) => {
      embeddedSourceMap.set(embeddedSource, replacement);
    });
  });
  const rewrittenProject = rewriteEmbeddedSourceReferences(
    strippedProject,
    embeddedSourceMap,
    includeEmbeddedAssetData === false,
  );

  return {
    ...rewrittenProject,
    assets: preparedAssets,
  };
};
