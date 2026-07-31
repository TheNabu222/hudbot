'use client';
import { create } from 'zustand';
import type { Project, Scene, SceneObject, DialogueTree, DialogueNode, DialogueChoice, Character, InventoryItem, CraftingRecipe, Quest, Faction, Companion, FastTravelMap, LoreEntry, Fact, ConditionGroup, Action, EventRule, StoryPhase, EditorTab, NeedDefinition, SkillDefinition, Asset } from './types';
import { generateId, slugify } from './id-utils';

const STORAGE_KEY = 'cavebot_studio_project';

function emptyProject(): Project {
  return {
    schemaVersion: 2,
    id: generateId('proj'),
    name: 'New Project',
    meta: { author: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), startSceneId: null },
    scenes: [],
    uiMenus: [],
    assets: [],
    characters: [],
    factions: [],
    companions: [],
    items: [],
    recipes: [],
    dialogueTrees: [],
    quests: [],
    maps: [],
    lore: [],
    facts: [],
    conditionGroups: [],
    actions: [],
    eventRules: [],
    storyPhases: [],
    settings: {
      stageWidth: 800,
      stageHeight: 600,
      gridSize: 32,
      enableNeeds: true,
      uiTheme: 'retro',
      uiColorPrimary: '#fbff00',
      uiColorSecondary: '#bc7f2a',
      uiColorBackground: '#6b6bff',
      uiFontFamily: "'Press Start 2P', monospace",
      customNeeds: [],
      customSkills: [],
    },
    gameFlags: [],
  };
}

export interface StudioState {
  project: Project;
  activeTab: EditorTab;
  selectedSceneId: string | null;
  selectedObjectId: string | null;
  selectedDialogueTreeId: string | null;
  selectedDialogueNodeId: string | null;
  selectedCharacterId: string | null;
  selectedQuestId: string | null;
  selectedItemId: string | null;
  previewSceneId: string | null;
  dirty: boolean;

  // Actions
  setProject: (p: Project) => void;
  setActiveTab: (t: EditorTab) => void;
  setSelectedScene: (id: string | null) => void;
  setSelectedObject: (id: string | null) => void;
  setSelectedDialogueTree: (id: string | null) => void;
  setSelectedDialogueNode: (id: string | null) => void;
  setSelectedCharacter: (id: string | null) => void;
  setSelectedQuest: (id: string | null) => void;
  setSelectedItem: (id: string | null) => void;
  setPreviewScene: (id: string | null) => void;

  // Scene ops
  addScene: (name: string) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  addObjectToScene: (sceneId: string, obj: SceneObject) => void;
  updateObjectInScene: (sceneId: string, objId: string, patch: Partial<SceneObject>) => void;
  deleteObjectFromScene: (sceneId: string, objId: string) => void;

  // Dialogue ops
  addDialogueTree: (name: string) => void;
  updateDialogueTree: (id: string, patch: Partial<DialogueTree>) => void;
  deleteDialogueTree: (id: string) => void;
  addDialogueNode: (treeId: string, node: DialogueNode) => void;
  updateDialogueNode: (treeId: string, nodeId: string, patch: Partial<DialogueNode>) => void;
  deleteDialogueNode: (treeId: string, nodeId: string) => void;

  // Character ops
  addCharacter: (name: string) => void;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  // Quest ops
  addQuest: (name: string) => void;
  updateQuest: (id: string, patch: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;

  // Item ops
  addItem: (name: string) => void;
  updateItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;

  // Recipe ops
  addRecipe: (name: string) => void;
  updateRecipe: (id: string, patch: Partial<CraftingRecipe>) => void;
  deleteRecipe: (id: string) => void;

  // Fact ops
  addFact: (key: string, label: string) => void;
  updateFact: (id: string, patch: Partial<Fact>) => void;
  deleteFact: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<Project['settings']>) => void;
  updateProjectMeta: (patch: Partial<Project['meta']> & { name?: string }) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  exportJSON: () => string;
  importJSON: (json: string) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  project: emptyProject(),
  activeTab: 'scenes',
  selectedSceneId: null,
  selectedObjectId: null,
  selectedDialogueTreeId: null,
  selectedDialogueNodeId: null,
  selectedCharacterId: null,
  selectedQuestId: null,
  selectedItemId: null,
  previewSceneId: null,
  dirty: false,

  setProject: (p) => set({ project: p, dirty: true }),
  setActiveTab: (t) => set({ activeTab: t }),
  setSelectedScene: (id) => set({ selectedSceneId: id }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setSelectedDialogueTree: (id) => set({ selectedDialogueTreeId: id }),
  setSelectedDialogueNode: (id) => set({ selectedDialogueNodeId: id }),
  setSelectedCharacter: (id) => set({ selectedCharacterId: id }),
  setSelectedQuest: (id) => set({ selectedQuestId: id }),
  setSelectedItem: (id) => set({ selectedItemId: id }),
  setPreviewScene: (id) => set({ previewSceneId: id }),

  // ---- Scene ----
  addScene: (name) => set((s) => {
    const scene: Scene = {
      id: generateId('scene'),
      name,
      slug: slugify(name),
      size: { w: s.project?.settings?.stageWidth ?? 800, h: s.project?.settings?.stageHeight ?? 600 },
      backgroundColor: '#1a1a2e',
      objects: [],
      variants: [],
    };
    return { project: { ...(s.project ?? {}), scenes: [...(s.project?.scenes ?? []), scene] } as Project, dirty: true };
  }),
  updateScene: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      scenes: (s.project?.scenes ?? [])?.map?.((sc: Scene) => sc?.id === id ? { ...(sc ?? {}), ...(patch ?? {}) } : sc) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteScene: (id) => set((s) => ({
    project: { ...(s.project ?? {}), scenes: (s.project?.scenes ?? [])?.filter?.((sc: Scene) => sc?.id !== id) ?? [] } as Project,
    selectedSceneId: s.selectedSceneId === id ? null : s.selectedSceneId,
    dirty: true,
  })),
  addObjectToScene: (sceneId, obj) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      scenes: (s.project?.scenes ?? [])?.map?.((sc: Scene) =>
        sc?.id === sceneId ? { ...(sc ?? {}), objects: [...(sc?.objects ?? []), obj] } : sc
      ) ?? [],
    } as Project,
    dirty: true,
  })),
  updateObjectInScene: (sceneId, objId, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      scenes: (s.project?.scenes ?? [])?.map?.((sc: Scene) =>
        sc?.id === sceneId
          ? { ...(sc ?? {}), objects: (sc?.objects ?? [])?.map?.((o: SceneObject) => o?.id === objId ? { ...(o ?? {}), ...(patch ?? {}) } : o) ?? [] }
          : sc
      ) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteObjectFromScene: (sceneId, objId) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      scenes: (s.project?.scenes ?? [])?.map?.((sc: Scene) =>
        sc?.id === sceneId
          ? { ...(sc ?? {}), objects: (sc?.objects ?? [])?.filter?.((o: SceneObject) => o?.id !== objId) ?? [] }
          : sc
      ) ?? [],
    } as Project,
    dirty: true,
  })),

  // ---- Dialogue ----
  addDialogueTree: (name) => set((s) => {
    const tree: DialogueTree = { id: generateId('dtree'), name, startNodeId: null, nodes: [] };
    return { project: { ...(s.project ?? {}), dialogueTrees: [...(s.project?.dialogueTrees ?? []), tree] } as Project, dirty: true };
  }),
  updateDialogueTree: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      dialogueTrees: (s.project?.dialogueTrees ?? [])?.map?.((dt: DialogueTree) => dt?.id === id ? { ...(dt ?? {}), ...(patch ?? {}) } : dt) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteDialogueTree: (id) => set((s) => ({
    project: { ...(s.project ?? {}), dialogueTrees: (s.project?.dialogueTrees ?? [])?.filter?.((dt: DialogueTree) => dt?.id !== id) ?? [] } as Project,
    dirty: true,
  })),
  addDialogueNode: (treeId, node) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      dialogueTrees: (s.project?.dialogueTrees ?? [])?.map?.((dt: DialogueTree) =>
        dt?.id === treeId
          ? {
              ...(dt ?? {}),
              nodes: [...(dt?.nodes ?? []), node],
              startNodeId: dt?.startNodeId ?? node?.id,
            }
          : dt
      ) ?? [],
    } as Project,
    dirty: true,
  })),
  updateDialogueNode: (treeId, nodeId, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      dialogueTrees: (s.project?.dialogueTrees ?? [])?.map?.((dt: DialogueTree) =>
        dt?.id === treeId
          ? { ...(dt ?? {}), nodes: (dt?.nodes ?? [])?.map?.((n: DialogueNode) => n?.id === nodeId ? { ...(n ?? {}), ...(patch ?? {}) } : n) ?? [] }
          : dt
      ) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteDialogueNode: (treeId, nodeId) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      dialogueTrees: (s.project?.dialogueTrees ?? [])?.map?.((dt: DialogueTree) =>
        dt?.id === treeId
          ? { ...(dt ?? {}), nodes: (dt?.nodes ?? [])?.filter?.((n: DialogueNode) => n?.id !== nodeId) ?? [] }
          : dt
      ) ?? [],
    } as Project,
    dirty: true,
  })),

  // ---- Character ----
  addCharacter: (name) => set((s) => {
    const char: Character = {
      id: generateId('char'),
      name,
      slug: slugify(name),
      portraitAssetId: null,
      description: '',
      defaultAffinity: 50,
      thresholds: [
        { value: 0, label: 'Hostile', color: '#ef4444' },
        { value: 25, label: 'Wary', color: '#f97316' },
        { value: 50, label: 'Neutral', color: '#eab308' },
        { value: 75, label: 'Friendly', color: '#22c55e' },
        { value: 100, label: 'Bonded', color: '#3b82f6' },
      ],
      giftPreferences: [],
      relationships: [],
    };
    return { project: { ...(s.project ?? {}), characters: [...(s.project?.characters ?? []), char] } as Project, dirty: true };
  }),
  updateCharacter: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      characters: (s.project?.characters ?? [])?.map?.((c: Character) => c?.id === id ? { ...(c ?? {}), ...(patch ?? {}) } : c) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteCharacter: (id) => set((s) => ({
    project: { ...(s.project ?? {}), characters: (s.project?.characters ?? [])?.filter?.((c: Character) => c?.id !== id) ?? [] } as Project,
    dirty: true,
  })),

  // ---- Quest ----
  addQuest: (name) => set((s) => {
    const quest: Quest = { id: generateId('quest'), name, description: '', objectives: [], rewards: [], autoStart: false };
    return { project: { ...(s.project ?? {}), quests: [...(s.project?.quests ?? []), quest] } as Project, dirty: true };
  }),
  updateQuest: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      quests: (s.project?.quests ?? [])?.map?.((q: Quest) => q?.id === id ? { ...(q ?? {}), ...(patch ?? {}) } : q) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteQuest: (id) => set((s) => ({
    project: { ...(s.project ?? {}), quests: (s.project?.quests ?? [])?.filter?.((q: Quest) => q?.id !== id) ?? [] } as Project,
    dirty: true,
  })),

  // ---- Item ----
  addItem: (name) => set((s) => {
    const item: InventoryItem = {
      id: generateId('item'),
      name,
      description: '',
      iconAssetId: null,
      category: 'normal',
      stackable: false,
    };
    return { project: { ...(s.project ?? {}), items: [...(s.project?.items ?? []), item] } as Project, dirty: true };
  }),
  updateItem: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      items: (s.project?.items ?? [])?.map?.((i: InventoryItem) => i?.id === id ? { ...(i ?? {}), ...(patch ?? {}) } : i) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteItem: (id) => set((s) => ({
    project: { ...(s.project ?? {}), items: (s.project?.items ?? [])?.filter?.((i: InventoryItem) => i?.id !== id) ?? [] } as Project,
    dirty: true,
  })),

  // ---- Recipe ----
  addRecipe: (name) => set((s) => {
    const recipe: CraftingRecipe = {
      id: generateId('recipe'),
      name,
      resultItemId: '',
      successMessage: '',
    };
    return { project: { ...(s.project ?? {}), recipes: [...(s.project?.recipes ?? []), recipe] } as Project, dirty: true };
  }),
  updateRecipe: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      recipes: (s.project?.recipes ?? [])?.map?.((r: CraftingRecipe) => r?.id === id ? { ...(r ?? {}), ...(patch ?? {}) } : r) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteRecipe: (id) => set((s) => ({
    project: { ...(s.project ?? {}), recipes: (s.project?.recipes ?? [])?.filter?.((r: CraftingRecipe) => r?.id !== id) ?? [] } as Project,
    dirty: true,
  })),

  // ---- Fact ----
  addFact: (key, label) => set((s) => {
    const fact: Fact = { id: generateId('fact'), key, label, type: 'bool', default: false };
    return { project: { ...(s.project ?? {}), facts: [...(s.project?.facts ?? []), fact] } as Project, dirty: true };
  }),
  updateFact: (id, patch) => set((s) => ({
    project: {
      ...(s.project ?? {}),
      facts: (s.project?.facts ?? [])?.map?.((f: Fact) => f?.id === id ? { ...(f ?? {}), ...(patch ?? {}) } : f) ?? [],
    } as Project,
    dirty: true,
  })),
  deleteFact: (id) => set((s) => ({
    project: { ...(s.project ?? {}), facts: (s.project?.facts ?? [])?.filter?.((f: Fact) => f?.id !== id) ?? [] } as Project,
    dirty: true,
  })),

  // ---- Settings ----
  updateSettings: (patch) => set((s) => ({
    project: { ...(s.project ?? {}), settings: { ...(s.project?.settings ?? {}), ...(patch ?? {}) } } as Project,
    dirty: true,
  })),
  updateProjectMeta: (patch) => set((s) => {
    const { name, ...metaPatch } = patch ?? {};
    const newProj: any = { ...(s.project ?? {}) };
    if (name !== undefined) newProj.name = name;
    newProj.meta = { ...(s.project?.meta ?? {}), ...(metaPatch ?? {}) };
    return { project: newProj as Project, dirty: true };
  }),

  // ---- Persistence ----
  saveToLocalStorage: () => {
    try {
      const proj = get()?.project;
      if (proj) {
        const updated = { ...(proj ?? {}), meta: { ...(proj?.meta ?? {}), updatedAt: new Date().toISOString() } };
        localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(updated));
        set({ dirty: false });
      }
    } catch (e: any) {
      console.error('Save failed:', e);
    }
  },
  loadFromLocalStorage: () => {
    try {
      const raw = localStorage?.getItem?.(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ project: parsed, dirty: false });
        return true;
      }
    } catch (e: any) {
      console.error('Load failed:', e);
    }
    return false;
  },
  exportJSON: () => {
    const proj = get()?.project;
    return JSON.stringify(proj ?? {}, null, 2);
  },
  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json);
      set({ project: parsed, dirty: true });
    } catch (e: any) {
      console.error('Import failed:', e);
    }
  },
}));
