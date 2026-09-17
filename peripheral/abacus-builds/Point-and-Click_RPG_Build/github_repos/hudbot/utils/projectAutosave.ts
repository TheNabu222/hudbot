import { Asset, Project, Scene, SceneObject } from "../types";
import { isEmbeddedSource } from "./projectPersistence";

export const AUTOSAVE_SCHEMA_VERSION = 2;

export type SaveStatus = "saved" | "saving" | "error";

export interface AutosaveManifest {
  schemaVersion: typeof AUTOSAVE_SCHEMA_VERSION;
  assetLibraryKey: string;
  assetLibraryFingerprint: string;
  savedAt: string;
}

export interface AutosaveMetrics {
  fullProjectBytes?: number;
  shellBytes: number;
  assetLibraryBytes?: number;
  shellAssetCount: number;
  assetLibraryCount: number;
  wroteAssetLibrary: boolean;
  durationMs?: number;
}

export type AutosaveShellProject = Project & {
  _autosave?: AutosaveManifest;
};

type Timer = ReturnType<typeof setTimeout>;

const byteLength = (value: string) => {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
};

const sourceFingerprint = (value?: string) => {
  if (!value) return "";
  if (isEmbeddedSource(value)) return `embedded:${value.length}`;
  return `linked:${value}`;
};

const stripObjectEmbeddedPayload = (object: SceneObject): SceneObject => {
  const shouldDropSrc = Boolean(object._assetId && isEmbeddedSource(object.src));
  const shouldDropAudioSrc = Boolean(
    object.audioSrc &&
      isEmbeddedSource(object.audioSrc) &&
      (object.interactionData || object.clickResponses?.length),
  );
  return {
    ...object,
    src: shouldDropSrc ? "" : object.src,
    audioSrc: shouldDropAudioSrc ? "" : object.audioSrc,
  };
};

const stripSceneEmbeddedPayloads = (scene: Scene): Scene => ({
  ...scene,
  objects: (scene.objects || []).map(stripObjectEmbeddedPayload),
});

export const stripAssetPayloadForAutosaveShell = (asset: Asset): Asset => ({
  ...asset,
  src: isEmbeddedSource(asset.src) ? "" : asset.src,
  dataURL: undefined,
});

export const createAutosaveAssetLibrarySnapshot = (project: Project): Asset[] =>
  (project.assets || []).map((asset) => ({ ...asset }));

export const getAutosaveAssetLibraryFingerprint = (
  assets: Asset[] = [],
): string =>
  assets
    .map((asset) =>
      [
        asset.id,
        asset.name,
        asset.type,
        asset.category,
        asset.width || "",
        asset.height || "",
        asset.exportSource || "",
        asset.isFavorite ? "favorite" : "",
        (asset.tags || []).join(","),
        sourceFingerprint(asset.src),
        sourceFingerprint(asset.dataURL),
      ].join("\u001f"),
    )
    .join("\u001e");

export const createAutosaveShellProject = (
  project: Project,
  assetLibraryKey: string,
  assetLibraryFingerprint = getAutosaveAssetLibraryFingerprint(project.assets || []),
): AutosaveShellProject => ({
  ...project,
  _autosave: {
    schemaVersion: AUTOSAVE_SCHEMA_VERSION,
    assetLibraryKey,
    assetLibraryFingerprint,
    savedAt: new Date().toISOString(),
  },
  assets: (project.assets || []).map(stripAssetPayloadForAutosaveShell),
  scenes: (project.scenes || []).map(stripSceneEmbeddedPayloads),
  uiMenus: (project.uiMenus || []).map(stripSceneEmbeddedPayloads),
});

export const restoreAutosaveAssetLibrary = (
  savedProject: any,
  assetLibrary?: Asset[] | null,
): any => {
  if (!Array.isArray(assetLibrary) || assetLibrary.length === 0) {
    return savedProject;
  }

  const payloadById = new Map(assetLibrary.map((asset) => [asset.id, asset]));
  const shellAssets = Array.isArray(savedProject?.assets) ? savedProject.assets : [];
  const restoredAssetIds = new Set<string>();
  const restoredAssets = shellAssets.map((shellAsset: Asset) => {
    const payloadAsset = payloadById.get(shellAsset.id);
    if (!payloadAsset) {
      restoredAssetIds.add(shellAsset.id);
      return shellAsset;
    }
    restoredAssetIds.add(shellAsset.id);
    return {
      ...payloadAsset,
      ...shellAsset,
      src: shellAsset.src || payloadAsset.src || "",
      dataURL: shellAsset.dataURL || payloadAsset.dataURL,
    };
  });

  assetLibrary.forEach((asset) => {
    if (!restoredAssetIds.has(asset.id)) restoredAssets.push(asset);
  });

  return {
    ...savedProject,
    assets: restoredAssets,
  };
};

export const measureAutosaveSerialization = (
  project: Project,
  assetLibraryKey: string,
) => {
  const fullJson = JSON.stringify(project);
  const assetFingerprint = getAutosaveAssetLibraryFingerprint(project.assets || []);
  const shellProject = createAutosaveShellProject(
    project,
    assetLibraryKey,
    assetFingerprint,
  );
  const shellJson = JSON.stringify(shellProject);
  const assetLibraryJson = JSON.stringify(
    createAutosaveAssetLibrarySnapshot(project),
  );
  return {
    fullProjectBytes: byteLength(fullJson),
    shellBytes: byteLength(shellJson),
    assetLibraryBytes: byteLength(assetLibraryJson),
    shellAssetCount: shellProject.assets.length,
    assetLibraryCount: project.assets?.length || 0,
  };
};

export interface CoalescedAutosaveQueueOptions<T> {
  debounceMs: number;
  persist: (project: T) => Promise<void>;
  onStatus?: (status: SaveStatus) => void;
  onError?: (error: unknown) => void;
  setTimeoutFn?: (callback: () => void, ms: number) => Timer;
  clearTimeoutFn?: (timer: Timer) => void;
}

export const createCoalescedAutosaveQueue = <T>({
  debounceMs,
  persist,
  onStatus,
  onError,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}: CoalescedAutosaveQueueOptions<T>) => {
  let timer: Timer | null = null;
  let pendingProject: T | null = null;
  let inFlight = false;
  let disposed = false;

  const clearTimer = () => {
    if (timer) clearTimeoutFn(timer);
    timer = null;
  };

  const run = async () => {
    clearTimer();
    if (disposed || inFlight || !pendingProject) return;

    const projectToPersist = pendingProject;
    pendingProject = null;
    inFlight = true;
    onStatus?.("saving");

    try {
      await persist(projectToPersist);
      inFlight = false;
      if (pendingProject && !disposed) {
        void run();
        return;
      }
      onStatus?.("saved");
    } catch (error) {
      inFlight = false;
      onError?.(error);
      if (pendingProject && !disposed) {
        void run();
        return;
      }
      onStatus?.("error");
    }
  };

  return {
    enqueue(project: T) {
      if (disposed) return;
      pendingProject = project;
      onStatus?.("saving");
      if (inFlight) return;
      clearTimer();
      timer = setTimeoutFn(() => {
        void run();
      }, debounceMs);
    },
    flush() {
      return run();
    },
    dispose() {
      disposed = true;
      pendingProject = null;
      clearTimer();
    },
    get pending() {
      return Boolean(pendingProject);
    },
    get isInFlight() {
      return inFlight;
    },
  };
};
