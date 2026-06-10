import React, { useState, useRef, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Play,
  Download,
  MousePointer2,
  Square,
  Image as ImageIcon,
  Layers,
  Settings,
  MoveUp,
  MoveDown,
  Trash2,
  Copy,
  Undo,
  Redo,
  FolderPlus,
  Search,
  ArrowUpToLine,
  ArrowDownToLine,
  MessageSquare,
  Backpack,
  Plus,
  FileCode,
  Folder,
  HelpCircle,
  Save,
  Upload,
  CheckCircle2,
  Wand2,
  X,
  PackageX,
  RotateCw,
  Type,
  Music,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  PlusCircle,
  Unlock,
  Sun,
  Moon,
  LayoutTemplate,
  Palette,
  ToggleRight,
  Pointer,
  MousePointerClick,
  Menu,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Key,
  Book,
  Shield,
  ChevronDown,
  Package,
  LogIn,
  Gift,
  ArrowDown,
  Video,
  Map as MapIcon,
  Navigation,
  MapPin,
  FolderOpen,
  Bot,
  Users,
  FileText,
  Zap,
  Hammer,
  Box,
  ZoomIn,
  ZoomOut,
  Maximize2,
  History,
  Clock,
  Calendar,
} from "lucide-react";
import Matter from "matter-js";
import { AIAssistant } from "./components/AIAssistant";
import {
  Project,
  SceneObject,
  CursorType,
  AnimationType,
  InteractionType,
  Asset,
  BlendMode,
  DialogueTree,
  DialogueNode,
  InventoryItem,
  Scene,
  Quest,
  QuestObjective,
  CraftingRecipe,
  LoreEntry,
  Faction,
  Companion,
} from "./types";
import { analyzeAssetVibe } from "./services/gemini";
import { generateExportHtml } from "./utils/exportHtml";
import { TEMPLATES } from "./utils/templates";
import { ImageEditorModal } from "./components/ImageEditorModal";
import { exportToTwee, importFromTwee } from "./utils/twineAdapter";
import { downloadJSON, downloadText, loadJSON, loadText } from "./utils/fileHelpers";
import { MapMaker } from "./components/MapMaker";
import { AISpriteModal } from "./components/AISpriteModal";
import { AssetPickerModal } from "./components/AssetPickerModal";
import { AssetLibraryManager } from "./components/AssetLibraryManager";
import {
  EditorMode,
  StudioWorkflowNav,
} from "./components/StudioWorkflowNav";
import {
  DeviceFrameCalibration,
  DeviceFrameCalibrator,
  DeviceFrameOverlay,
} from "./components/DeviceFrameCalibrator";
import { get, set } from "idb-keyval";

export interface SaveSlotMeta {
  slotId: number;
  projectName: string;
  timestamp: string;
  savedSceneCount: number;
  gameFlagCount: number;
  timeMs?: number;
}

const Accordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const elementId = `accordion-${title.replace(/[^a-zA-Z0-9]/g, "-")}`;

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.title === title) {
        setIsOpen(true);
        setTimeout(() => {
          const el = document.getElementById(elementId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-emerald-500", "scale-[1.01]");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-emerald-500", "scale-[1.01]");
            }, 1500);
          }
        }, 120);
      }
    };
    window.addEventListener("open-accordion", handleOpen);
    return () => window.removeEventListener("open-accordion", handleOpen);
  }, [title, elementId]);

  return (
    <div 
      id={elementId} 
      className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shrink-0 transition-all duration-300"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
      >
        <span className="text-sm font-bold text-neutral-300 uppercase tracking-wider">{title}</span>
        <ChevronDown size={16} className={`text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-neutral-800">
          {children}
        </div>
      )}
    </div>
  );
};

const TypewriterText = ({
  text,
  speed = 15,
}: {
  text: string;
  speed?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (speed <= 0) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="relative">
      <div className="invisible whitespace-pre-wrap">{text}</div>
      <div className="absolute inset-0 whitespace-pre-wrap">
        {displayedText}
      </div>
    </div>
  );
};

const LabelWithHelp = ({
  label,
  helpText,
  className = "",
}: {
  label: string;
  helpText: string;
  className?: string;
}) => (
  <div className={`flex items-center gap-1 group relative w-max ${className}`}>
    <label className="text-sm font-medium text-neutral-400">{label}</label>
    <HelpCircle
      size={14}
      className="text-neutral-500 hover:text-neutral-300 cursor-help transition-colors"
    />
    <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-56 p-2 bg-neutral-950 text-neutral-300 text-sm rounded border border-neutral-700 shadow-xl z-[100] pointer-events-none whitespace-normal font-normal leading-relaxed">
      {helpText}
    </div>
  </div>
);

export const DEFAULT_ASSETS: Asset[] = [];

const App: React.FC = () => {
  const [project, setProject] = useState<Project>({
    id: uuidv4(),
    name: "My Neocities Game",
    currentSceneId: "scene-1",
    currentUiMenuId: null,
    assets: DEFAULT_ASSETS,
    globalSettings: {
      useDayNightCycle: false,
      enableNeeds: true,
      enableTTRPGStats: true,
      stageWidth: 800,
      stageHeight: 600,
      snapToGrid: false,
      gridSize: 32,
      showGhostOutlines: true,
    },
    scenes: [
      {
        id: "scene-1",
        name: "Start Scene",
        width: 800,
        height: 600,
        backgroundColor: "#2a2a2a",
        objects: [],
      },
    ],
    uiMenus: [],
    dialogueTrees: [],
    inventoryItems: [],
    craftingRecipes: [],
    quests: [],
    maps: [],
    gameFlags: [],
  });

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stageZoom, setStageZoom] = useState<number>(1);
  const [triggeredObjects, setTriggeredObjects] = useState<Set<string>>(
    new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId: string | null;
  } | null>(null);
  const [clipboard, setClipboard] = useState<SceneObject[]>([]);
  const [activeBin, setActiveBin] = useState<string>("all");
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // RPG Systems State
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [activeCompanionId, setActiveCompanionId] = useState<string | null>(null);
  const [newEventText, setNewEventText] = useState("");
  const [newSkillText, setNewSkillText] = useState("");
  const [newNeedText, setNewNeedText] = useState("");
  const [recentAssetIds, setRecentAssetIds] = useState<string[]>([]);

  const [editorMode, setEditorMode] = useState<EditorMode>("stage");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<"librarian" | "theme">(
    "librarian",
  );
  const [rightSidebarTab, setRightSidebarTab] = useState<
    "properties" | "layers" | "prefabs" | "assets"
  >("properties");
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(288);
  const [assetPaletteCategory, setAssetPaletteCategory] =
    useState<string>("all");
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [playerInventory, setPlayerInventory] = useState<string[]>([]);
  const [playerFlags, setPlayerFlags] = useState<string[]>([]);
  const [activeQuests, setActiveQuests] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<
    string | null
  >(null);
  const [collectedObjects, setCollectedObjects] = useState<string[]>([]);
  const [activeUiMenus, setActiveUiMenus] = useState<string[]>([]);
  const [activeDialogue, setActiveDialogue] = useState<{
    treeId: string;
    nodeId: string;
  } | null>(null);
  const [activeCompanionBubbles, setActiveCompanionBubbles] = useState<Record<string, string>>({});

  useEffect(() => {
    let interjectionInterval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interjectionInterval = setInterval(() => {
        const activeComps = (project.companions || []).filter(c => !c.requiredFlagId || playerFlags.includes(c.requiredFlagId));
        if (activeComps.length > 0) {
          const randomComp = activeComps[Math.floor(Math.random() * activeComps.length)];
          if (randomComp.interjections && randomComp.interjections.length > 0) {
            const dialogue = randomComp.interjections[Math.floor(Math.random() * randomComp.interjections.length)];
            setActiveCompanionBubbles(prev => ({ ...prev, [randomComp.id]: dialogue }));
            setTimeout(() => {
              setActiveCompanionBubbles(prev => {
                const next = { ...prev };
                delete next[randomComp.id];
                return next;
              });
            }, 5000);
          }
        }
      }, 15000); // Check every 15 seconds
    }
    return () => {
      if (interjectionInterval) clearInterval(interjectionInterval);
    };
  }, [isPlaying, project.companions, playerFlags]);
  const [runtimeOverrides, setRuntimeOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [runtimeDraggingId, setRuntimeDraggingId] = useState<string | null>(
    null,
  );
  const [quickEditPos, setQuickEditPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [quickEditDragging, setQuickEditDragging] = useState<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);
  const [activeCutscene, setActiveCutscene] = useState<{
    src: string;
    targetSceneId?: string;
  } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeFastTravelMapId, setActiveFastTravelMapId] = useState<
    string | null
  >(null);
  const [itemsTab, setItemsTab] = useState<"items" | "crafting">("items");
  const [rpgTab, setRpgTab] = useState<
    "quests" | "stats" | "factions" | "lore" | "companions"
  >("quests");
  const [playerNeeds, setPlayerNeeds] = useState<Record<string, number>>(() => {
    const defNeeds: Record<string, number> = {};
    const cNeeds = ["rest", "hunger", "connection", "spiritual", "novelty"];
    cNeeds.forEach((n) => (defNeeds[n] = 100));
    return defNeeds;
  });
  const [playerSkills, setPlayerSkills] = useState<Record<string, number>>(
    () => {
      const defSkills: Record<string, number> = {};
      const cSkills = ["naturalist", "occultist", "scribal"];
      cSkills.forEach((s) => (defSkills[s] = 1));
      return defSkills;
    },
  );
  const [playerFactions, setPlayerFactions] = useState<Record<string, number>>(
    () => {
      const defFactions: Record<string, number> = {};
      return defFactions;
    },
  );
  const [gameTime, setGameTime] = useState<number>(8); // 0-24

  const [assetPickerCb, setAssetPickerCb] = useState<{
    onSelect: (id: string) => void;
    filterType?: "image" | "audio" | "video" | "script" | "hitbox" | "text" | "ui_element";
    onlyOnCanvas?: boolean;
  } | null>(null);

  const [history, setHistory] = useState<{
    past: Project[];
    future: Project[];
  }>({ past: [], future: [] });
  const dragStartProjectRef = useRef<Project | null>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [transition, setTransition] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "fade" });
  const [physicsState, setPhysicsState] = useState<
    Record<string, { x: number; y: number; rotation: number }>
  >({});

  const [editorError, setEditorError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    message: string;
    defaultValue: string;
    onSubmit: (val: string) => void;
  } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [confirmTemplateId, setConfirmTemplateId] = useState<string | null>(
    null,
  );
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [calibratingFrameAssetId, setCalibratingFrameAssetId] = useState<
    string | null
  >(null);

  const didDragRef = useRef(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isAlmanacOpen, setIsAlmanacOpen] = useState(false);
  const [isRelationshipsOpen, setIsRelationshipsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerUiColor, setPlayerUiColor] = useState<string | null>(null);

  const [craftSlot1, setCraftSlot1] = useState<string | null>(null);
  const [craftSlot2, setCraftSlot2] = useState<string | null>(null);
  const [craftSlot3, setCraftSlot3] = useState<string | null>(null);

  const [saveSlotsMeta, setSaveSlotsMeta] = useState<SaveSlotMeta[]>(() => {
    try {
      const raw = localStorage.getItem("neocities_project_slots_meta");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse slots meta", e);
    }
    return [];
  });
  const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
  const [hideEditorHud, setHideEditorHud] = useState(true);

  const [isResizingCanvas, setIsResizingCanvas] = useState<{
    direction: "r" | "b" | "br";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  useEffect(() => {
    if (editorMode === "stage") {
      setHideEditorHud(true);
    } else if (editorMode === "ui_stage") {
      setHideEditorHud(false);
    }
  }, [editorMode]);

  useEffect(() => {
    if (!isResizingCanvas) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - isResizingCanvas.startX;
      const dy = e.clientY - isResizingCanvas.startY;

      const canvasDx = Math.round(dx / stageZoom);
      const canvasDy = Math.round(dy / stageZoom);

      let newWidth = isResizingCanvas.startWidth;
      let newHeight = isResizingCanvas.startHeight;

      if (isResizingCanvas.direction === "r" || isResizingCanvas.direction === "br") {
        newWidth = Math.max(100, Math.min(4000, isResizingCanvas.startWidth + canvasDx));
      }
      if (isResizingCanvas.direction === "b" || isResizingCanvas.direction === "br") {
        newHeight = Math.max(100, Math.min(4000, isResizingCanvas.startHeight + canvasDy));
      }

      if (isResizingCanvas.direction === "br" && e.shiftKey) {
        // Proportional resizing
        const aspect = isResizingCanvas.startWidth / isResizingCanvas.startHeight;
        if (newWidth / aspect > newHeight) {
          newHeight = Math.round(newWidth / aspect);
        } else {
          newWidth = Math.round(newHeight * aspect);
        }
      }

      setProject((p) => {
        const updatedScenes = p.scenes.map((s) => {
          if (s.id === p.currentSceneId) {
            return { ...s, width: newWidth, height: newHeight };
          }
          return s;
        });
        return {
          ...p,
          globalSettings: {
            ...p.globalSettings,
            stageWidth: newWidth,
            stageHeight: newHeight,
          },
          scenes: updatedScenes,
        };
      });
    };

    const handlePointerUp = () => {
      setIsResizingCanvas(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingCanvas, stageZoom]);

  const handleSaveToSlot = async (slotId: number) => {
    try {
      setSaveStatus("saving");
      const strippedProject = {
        ...project,
        prefabs: (project.prefabs || []).map((o) => {
          if (
            o.src &&
            o.src.startsWith("data:") &&
            project.assets.some((a) => a.src === o.src)
          ) {
            const asset = project.assets.find((a) => a.src === o.src);
            return { ...o, src: "", _assetId: asset?.id };
          }
          return o;
        }),
        scenes: project.scenes.map((s) => ({
          ...s,
          objects: s.objects.map((o) => {
            if (
              o.src &&
              o.src.startsWith("data:") &&
              project.assets.some((a) => a.src === o.src)
            ) {
              const asset = project.assets.find((a) => a.src === o.src);
              return { ...o, src: "", _assetId: asset?.id };
            }
            return o;
          }),
        })),
        uiMenus: project.uiMenus
          ? project.uiMenus.map((m) => ({
              ...m,
              objects: m.objects.map((o) => {
                if (
                  o.src &&
                  o.src.startsWith("data:") &&
                  project.assets.some((a) => a.src === o.src)
                ) {
                  const asset = project.assets.find((a) => a.src === o.src);
                  return { ...o, src: "", _assetId: asset?.id };
                }
                return o;
              }),
            }))
          : [],
      };

      await set(`neocities_project_slot_${slotId}`, strippedProject);

      const timestamp = new Date().toLocaleString();
      const newMeta: SaveSlotMeta = {
        slotId,
        projectName: project.name || "Untitled Game",
        timestamp,
        savedSceneCount: project.scenes?.length || 0,
        gameFlagCount: project.gameFlags?.length || 0,
        timeMs: Date.now(),
      };

      setSaveSlotsMeta((prev) => {
        const updated = prev.filter((s) => s.slotId !== slotId);
        updated.push(newMeta);
        updated.sort((a, b) => a.slotId - b.slotId);
        localStorage.setItem("neocities_project_slots_meta", JSON.stringify(updated));
        return updated;
      });

      setSaveStatus("saved");
      showError(`Saved project version to Slot ${slotId}!`);
    } catch (err) {
      console.error("Failed to save to slot", err);
      setSaveStatus("error");
      showError(`Failed to save to Slot ${slotId}.`);
    }
  };

  const handleLoadFromSlot = async (slotId: number) => {
    try {
      const saved = await get(`neocities_project_slot_${slotId}`);
      if (saved) {
        setProject((prev) => ({
          ...prev,
          ...hydrateProject(saved),
          globalSettings: {
            ...prev.globalSettings,
            ...(saved.globalSettings || {}),
          },
        }));
        setHistory({ past: [], future: [] });
        showError(`Restored Slot ${slotId} project version successfully!`);
      } else {
        showError(`No saved project version found in Slot ${slotId}.`);
      }
    } catch (err) {
      console.error("Failed to load from slot", err);
      showError(`Failed to load project from Slot ${slotId}.`);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      setSaveSlotsMeta((prev) => {
        const updated = prev.filter((s) => s.slotId !== slotId);
        localStorage.setItem("neocities_project_slots_meta", JSON.stringify(updated));
        return updated;
      });
      showError(`Reset Slot ${slotId} version backup info.`);
    } catch (err) {
      console.error("Failed to delete slot info", err);
    }
  };

  const showError = (msg: string) => {
    setEditorError(msg);
    setTimeout(() => setEditorError(null), 5000);
  };

  const pushHistory = (newProj: Project) => {
    setHistory((h) => ({ past: [...h.past.slice(-20), project], future: [] }));
    setProject(newProj);
  };

  const undo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      future: [project, ...h.future],
    }));
    setProject(previous);
  };

  const redo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory((h) => ({
      past: [...h.past, project],
      future: h.future.slice(1),
    }));
    setProject(next);
  };

  const hydrateProject = (parsed: any): Project => {
    const assets = parsed.assets || [];
    return {
      ...parsed,
      prefabs: (parsed.prefabs || []).map((o: any) => {
        if (o._assetId) {
          const asset = assets.find((a: any) => a.id === o._assetId);
          if (asset) return { ...o, src: asset.src };
        }
        return o;
      }),
      dialogueTrees: parsed.dialogueTrees
        ? parsed.dialogueTrees.map((t: any) => ({
            ...t,
            nodes: t.nodes
              ? t.nodes.map((n: any) => ({
                  ...n,
                  choices: n.choices || [],
                }))
              : [],
          }))
        : [],
      inventoryItems: parsed.inventoryItems || [],
      assets: assets,
      scenes: parsed.scenes
        ? parsed.scenes.map((s: any) => ({
            ...s,
            objects: (s.objects || []).map((o: any) => {
              if (o._assetId) {
                const asset = assets.find((a: any) => a.id === o._assetId);
                if (asset) return { ...o, src: asset.src };
              }
              return o;
            }),
          }))
        : [],
      uiMenus: parsed.uiMenus
        ? parsed.uiMenus.map((s: any) => ({
            ...s,
            objects: (s.objects || []).map((o: any) => {
              if (o._assetId) {
                const asset = assets.find((a: any) => a.id === o._assetId);
                if (asset) return { ...o, src: asset.src };
              }
              return o;
            }),
          }))
        : [],
      maps: parsed.maps || [],
      currentUiMenuId: parsed.currentUiMenuId || null,
      globalSettings: {
        ...(parsed.globalSettings || {}),
      },
    };
  };

  // Load from IndexedDB (fallback to LocalStorage) on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        let saved = await get("neocities_project");
        if (!saved) {
          const localSaved = localStorage.getItem("neocities_project");
          if (localSaved) {
            saved = JSON.parse(localSaved);
          }
        }
        if (saved) {
          setProject((prev) => ({
            ...prev,
            ...hydrateProject(saved),
            globalSettings: {
              ...prev.globalSettings,
              ...(saved.globalSettings || {}),
            },
          }));
        }
      } catch (e) {
        console.error("Failed to load project", e);
      }
    };
    loadProject();
  }, []);

  // Save to IndexedDB on change
  useEffect(() => {
    const saveProject = async () => {
      setSaveStatus("saving");
      try {
        // Strip out duplicated large base64 strings before saving
        const strippedProject = {
          ...project,
          prefabs: (project.prefabs || []).map((o) => {
            if (
              o.src &&
              o.src.startsWith("data:") &&
              project.assets.some((a) => a.src === o.src)
            ) {
              const asset = project.assets.find((a) => a.src === o.src);
              return { ...o, src: "", _assetId: asset?.id };
            }
            return o;
          }),
          scenes: project.scenes.map((s) => ({
            ...s,
            objects: s.objects.map((o) => {
              if (
                o.src &&
                o.src.startsWith("data:") &&
                project.assets.some((a) => a.src === o.src)
              ) {
                const asset = project.assets.find((a) => a.src === o.src);
                return { ...o, src: "", _assetId: asset?.id };
              }
              return o;
            }),
          })),
          uiMenus: project.uiMenus
            ? project.uiMenus.map((m) => ({
                ...m,
                objects: m.objects.map((o) => {
                  if (
                    o.src &&
                    o.src.startsWith("data:") &&
                    project.assets.some((a) => a.src === o.src)
                  ) {
                    const asset = project.assets.find((a) => a.src === o.src);
                    return { ...o, src: "", _assetId: asset?.id };
                  }
                  return o;
                }),
              }))
            : [],
        };
        await set("neocities_project", strippedProject);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Failed to save project to IndexedDB", e);
        setSaveStatus("error");
        showError("Failed to save project. Storage quota may be exceeded.");
      }
    };

    // Debounce save slightly to avoid thrashing
    const timeoutId = setTimeout(saveProject, 2000);
    return () => clearTimeout(timeoutId);
  }, [project]);

  const handleExportProject = () => {
    try {
      const strippedProject = {
        ...project,
        prefabs: (project.prefabs || []).map((o) => {
          if (
            o.src &&
            o.src.startsWith("data:") &&
            project.assets.some((a) => a.src === o.src)
          ) {
            const asset = project.assets.find((a) => a.src === o.src);
            return { ...o, src: "", _assetId: asset?.id };
          }
          return o;
        }),
        scenes: project.scenes.map((s) => ({
          ...s,
          objects: s.objects.map((o) => {
            if (
              o.src &&
              o.src.startsWith("data:") &&
              project.assets.some((a) => a.src === o.src)
            ) {
              const asset = project.assets.find((a) => a.src === o.src);
              return { ...o, src: "", _assetId: asset?.id };
            }
            return o;
          }),
        })),
        uiMenus: project.uiMenus
          ? project.uiMenus.map((m) => ({
              ...m,
              objects: m.objects.map((o) => {
                if (
                  o.src &&
                  o.src.startsWith("data:") &&
                  project.assets.some((a) => a.src === o.src)
                ) {
                  const asset = project.assets.find((a) => a.src === o.src);
                  return { ...o, src: "", _assetId: asset?.id };
                }
                return o;
              }),
            }))
          : [],
      };
      const jsonStr = JSON.stringify(strippedProject);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute(
        "download",
        `${project.name.replace(/\s+/g, "_")}_backup.json`,
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      document.body.removeChild(downloadAnchorNode);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showError("Failed to export project: " + err);
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let content = event.target?.result as string;
        if (file.name.endsWith(".html")) {
          const startIndex = content.indexOf(
            '<script id="__GAME_DATA__" type="application/json">',
          );
          if (startIndex !== -1) {
            const dataStart =
              startIndex +
              '<script id="__GAME_DATA__" type="application/json">'.length;
            const endIndex = content.indexOf("</script>", dataStart);
            if (endIndex !== -1) {
              content = content.substring(dataStart, endIndex);
            } else {
              showError("No embedded project data found in HTML.");
              return;
            }
          } else {
            showError("No embedded project data found in HTML.");
            return;
          }
        }
        const parsed = JSON.parse(content);
        if (parsed && parsed.id && parsed.scenes) {
          setProject(hydrateProject(parsed));
          setHistory({ past: [], future: [] });
          showError("Project loaded successfully!");
        } else {
          showError("Invalid project file format.");
        }
      } catch (err) {
        showError("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const currentScene = project.scenes.find(
      (s) => s.id === project.currentSceneId,
    );
    if (isPlaying && currentScene?.bgmAssetId) {
      const audioAsset = project.assets.find(
        (a) => a.id === currentScene.bgmAssetId,
      );
      if (audioAsset) {
        const mediaFragment = audioAsset.trimStart || audioAsset.trimEnd ? `#t=${audioAsset.trimStart || 0}${audioAsset.trimEnd ? ',' + audioAsset.trimEnd : ''}` : '';
        const fullSrc = audioAsset.src + mediaFragment;
        if (!bgmRef.current) {
          bgmRef.current = new Audio(fullSrc);
          bgmRef.current.loop = true;
          bgmRef.current.volume = audioAsset.volume ?? 1;
        } else if (bgmRef.current.src !== fullSrc || bgmRef.current.volume !== (audioAsset.volume ?? 1)) {
          bgmRef.current.pause();
          bgmRef.current = new Audio(fullSrc);
          bgmRef.current.loop = true;
          bgmRef.current.volume = audioAsset.volume ?? 1;
        }
        bgmRef.current
          .play()
          .catch((e) => console.error("Audio playback failed", e));
      }
    } else {
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    }

    return () => {
      if (!isPlaying && bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, [isPlaying, project.currentSceneId, project.assets, project.scenes]);

  useEffect(() => {
    let timeInterval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && project.globalSettings.useDayNightCycle) {
      timeInterval = setInterval(() => {
        setGameTime((prev) => {
          const next = prev + 0.1;
          return next >= 24 ? 0 : next;
        });

        // Deplete needs over time if enabled
        if (project.globalSettings.enableNeeds) {
          setPlayerNeeds(prev => {
            const next = { ...prev };
            if (next.rest) next.rest = Math.max(0, next.rest - 1); // Rest decreases faster
            if (next.hunger) next.hunger = Math.max(0, next.hunger - 0.5);
            if (next.connection) next.connection = Math.max(0, next.connection - 0.2);
            if (next.spiritual) next.spiritual = Math.max(0, next.spiritual - 0.1);
            if (next.novelty) next.novelty = Math.max(0, next.novelty - 0.3);
            return next;
          });
        }
      }, 1000);
    }
    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [isPlaying, project.globalSettings.useDayNightCycle]);

  useEffect(() => {
    if (isPlaying) {
      const engine = Matter.Engine.create();
      const runner = Matter.Runner.create();
      const bodies: Record<string, Matter.Body> = {};

      const ground = Matter.Bodies.rectangle(
        project.globalSettings.stageWidth / 2,
        project.globalSettings.stageHeight + 25,
        project.globalSettings.stageWidth,
        50,
        { isStatic: true },
      );
      const leftWall = Matter.Bodies.rectangle(
        -25,
        project.globalSettings.stageHeight / 2,
        50,
        project.globalSettings.stageHeight,
        { isStatic: true },
      );
      const rightWall = Matter.Bodies.rectangle(
        project.globalSettings.stageWidth + 25,
        project.globalSettings.stageHeight / 2,
        50,
        project.globalSettings.stageHeight,
        { isStatic: true },
      );
      Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

      const currentScene = project.scenes.find(
        (s) => s.id === project.currentSceneId,
      );
      if (currentScene) {
        currentScene.objects.forEach((obj) => {
          if (obj.hasPhysics) {
            const body = Matter.Bodies.rectangle(
              obj.x + obj.width / 2,
              obj.y + obj.height / 2,
              obj.width,
              obj.height,
              {
                isStatic: !!obj.physicsStatic,
                restitution: obj.physicsBounciness ?? 0.6,
                friction: obj.physicsFriction ?? 0.1,
                density: obj.physicsDensity ?? 0.05,
              },
            );
            Matter.Body.setAngle(body, obj.rotation * (Math.PI / 180));
            bodies[obj.id] = body;
            Matter.Composite.add(engine.world, body);
          }
        });
      }

      let mouseConstraint: any = null;
      if (stageRef.current) {
        const mouse = Matter.Mouse.create(stageRef.current);
        mouseConstraint = Matter.MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: {
            stiffness: 0.2,
            render: {
              visible: false,
            },
          },
        });
        Matter.Composite.add(engine.world, mouseConstraint);
      }

      Matter.Runner.run(runner, engine);

      let animationFrameId: number;
      const updatePhysics = () => {
        const newPhysicsState: Record<
          string,
          { x: number; y: number; rotation: number }
        > = {};
        for (const id in bodies) {
          const body = bodies[id];
          const obj = currentScene?.objects.find((o) => o.id === id);
          if (obj) {
            newPhysicsState[id] = {
              x: body.position.x - obj.width / 2,
              y: body.position.y - obj.height / 2,
              rotation: body.angle * (180 / Math.PI),
            };
          }
        }
        setPhysicsState(newPhysicsState);
        animationFrameId = requestAnimationFrame(updatePhysics);
      };
      updatePhysics();

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (mouseConstraint) {
          Matter.Mouse.clearSourceEvents(mouseConstraint.mouse);
        }
        Matter.Runner.stop(runner);
        Matter.Engine.clear(engine);
      };
    } else {
      setPhysicsState({});
    }
  }, [isPlaying, project.currentSceneId]);

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    project.assets.forEach(a => map.set(a.id, a));
    return map;
  }, [project.assets]);

  // Dragging state for stage objects
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Parallax tracking state
  const [mouseRatio, setMouseRatio] = useState({ x: 0, y: 0 });

  const stageRef = useRef<HTMLDivElement>(null);

  const getWorkingScene = () => {
    if (editorMode === "ui_stage" && !isPlaying) {
      return (
        (project.uiMenus || []).find((s) => s.id === project.currentUiMenuId) ||
        (project.uiMenus || [])[0] ||
        null
      );
    }
    return (
      project.scenes.find((s) => s.id === project.currentSceneId) ||
      project.scenes[0] ||
      null
    );
  };
  const currentScene = getWorkingScene() || {
    id: "fallback",
    name: "Fallback",
    width: 800,
    height: 600,
    backgroundColor: "#000",
    objects: [],
  };
  const selectedObject = currentScene?.objects.find(
    (o) => o.id === selectedObjectId,
  );

  const updateScene = (updates: Partial<typeof currentScene>) => {
    if (!currentScene) return;
    const isUI = editorMode === "ui_stage" && !isPlaying;
    const newProject = {
      ...project,
      [isUI ? "uiMenus" : "scenes"]: (
        project[isUI ? "uiMenus" : "scenes"] || []
      ).map((s) => (s.id === currentScene.id ? { ...s, ...updates } : s)),
    };
    pushHistory(newProject);
  };

  const updateObject = (id: string, updates: Partial<SceneObject>) => {
    if (!currentScene) return;
    const isUI = editorMode === "ui_stage" && !isPlaying;
    const newProject = {
      ...project,
      [isUI ? "uiMenus" : "scenes"]: (
        project[isUI ? "uiMenus" : "scenes"] || []
      ).map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              objects: s.objects.map((o) =>
                o.id === id ? { ...o, ...updates } : o,
              ),
            }
          : s,
      ),
    };
    pushHistory(newProject);
  };

  const updateObjectTransient = (id: string, updates: Partial<SceneObject>) => {
    if (!currentScene) return;
    const isUI = editorMode === "ui_stage" && !isPlaying;
    setProject((prev) => ({
      ...prev,
      [isUI ? "uiMenus" : "scenes"]: (
        prev[isUI ? "uiMenus" : "scenes"] || []
      ).map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              objects: s.objects.map((o) =>
                o.id === id ? { ...o, ...updates } : o,
              ),
            }
          : s,
      ),
    }));
  };

  const handleInsertAssetToStage = (asset: any) => {
    if (!stageRef.current) return;

    let objDefaults: Partial<SceneObject> = {};
    if (asset.type === "custom_prefab") {
       const newObj = { ...asset.prefabData, id: uuidv4(), x: 0, y: 0 };
       const isUI = editorMode === "ui_stage";
       const newProject = {
          ...project,
          [isUI ? "uiMenus" : "scenes"]: (project[isUI ? "uiMenus" : "scenes"] || []).map((s) => s.id === currentScene.id ? { ...s, objects: [...s.objects, newObj] } : s)
       };
       setProject(newProject);
       pushHistory(newProject);
       setSelectedObjectId(newObj.id);
       return;
    } else if (asset.type === "prefab") {
      if (asset.prefabType === "chest") {
        objDefaults = {
          isText: true,
          textContent: "🎁",
          textFontSize: 64,
          width: 64,
          height: 64,
          interaction: "give-item",
          name: "Loot Chest",
        };
      } else if (asset.prefabType === "door") {
        objDefaults = {
          isHitbox: true,
          width: 64,
          height: 128,
          interaction: "scene_change",
          name: "Portal / Door",
        };
      } else if (asset.prefabType === "npc") {
        objDefaults = {
          isHitbox: true,
          width: 100,
          height: 100,
          interaction: "dialogue",
          name: "NPC Trigger",
        };
      }
    }

    let actualSrc = asset.src || "";
    if (asset.id && !asset.src) {
      const matchedAsset = project.assets.find((a: any) => a.id === asset.id);
      if (matchedAsset) actualSrc = matchedAsset.src;
    }

    const currentArr =
      editorMode === "ui_stage"
        ? project.uiMenus.find((m) => m.id === project.currentUiMenuId)
            ?.objects || []
        : project.scenes.find((s) => s.id === project.currentSceneId)
            ?.objects || [];

    const newObj: SceneObject = {
      id: uuidv4(),
      name: asset.name,
      src: actualSrc,
      _assetId: asset.id,
      x: (project.globalSettings.stageWidth || 800) / 2 - 50,
      y: (project.globalSettings.stageHeight || 600) / 2 - 50,
      width:
        asset.type === "ui_element"
          ? asset.uiElementType === "panel"
            ? 200
            : asset.uiElementType === "progress"
              ? 150
              : 50
          : asset.type === "hitbox"
            ? 100
            : asset.type === "script"
              ? 64
              : asset.type === "text"
                ? 200
                : 100,
      height:
        asset.type === "ui_element"
          ? asset.uiElementType === "panel"
            ? 200
            : asset.uiElementType === "progress"
              ? 20
              : 50
          : asset.type === "hitbox"
            ? 100
            : asset.type === "script"
              ? 64
              : asset.type === "text"
                ? 50
                : 100,
      rotation: 0,
      zIndex:
        currentArr.length > 0
          ? Math.max(...currentArr.map((o) => o.zIndex)) + 1
          : 0,
      opacity: 1,
      locked: false,
      cursor:
        asset.type === "prefab" || asset.type === "audio"
          ? "pointer"
          : "default",
      animation: "none",
      interaction:
        asset.type === "audio"
          ? "sound"
          : asset.type === "video"
            ? "play_cutscene"
            : "none",
      interactionData:
        asset.type === "audio" || asset.type === "video" ? asset.id : undefined,
      isVideo: asset.type === "video",
      isHitbox: asset.type === "hitbox",
      isScript: asset.type === "script",
      isText: asset.type === "text" || asset.type === "audio",
      isUiElement: asset.type === "ui_element",
      uiElementType: asset.uiElementType,
      uiColorPrimary: "#00ffff",
      uiColorSecondary: "#ff00ff",
      uiIconType: "check",
      uiValue: 50,
      uiChecked: true,
      uiBorderType: "solid",
      textContent:
        asset.type === "text"
          ? "New Text"
          : asset.type === "audio"
            ? "🎵"
            : asset.type === "ui_element" && asset.uiElementType === "tooltip"
              ? "Tooltip text"
              : undefined,
      textColor: "#ffffff",
      textFontSize: 24,
      textFontFamily: "sans-serif",
      blendMode: "normal",
      parallaxSpeed: 1,
      hasPhysics: false,
      scriptAssetId: asset.type === "script" ? asset.id : undefined,
      ...objDefaults,
    };

    if (currentScene) {
      updateScene({ objects: [...currentScene.objects, newObj] });
    }
    setSelectedObjectId(newObj.id);
  };

  const handleDragStartAsset = (e: React.DragEvent, asset: any) => {
    // Omitting extremely large Data URL (base64) strings from the drag payload prevents crashing Chrome/Firefox
    // We will retrieve the src later by using the asset.id from the project.assets list
    const transferPayload = {
      ...asset,
      src: asset.id ? undefined : asset.src,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(transferPayload));
  };

  const getDescendantIds = (
    parentIds: string[],
    objects: SceneObject[],
  ): string[] => {
    let ids: string[] = [];
    const children = objects.filter(
      (o) => o.parentObjectId && parentIds.includes(o.parentObjectId),
    );
    if (children.length > 0) {
      const childIds = children.map((c) => c.id);
      ids = childIds.concat(getDescendantIds(childIds, objects));
    }
    return ids;
  };

  const handleDropOnStage = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / stageZoom;
    const y = (e.clientY - rect.top) / stageZoom;

    try {
      const assetData = e.dataTransfer.getData("application/json");
      if (assetData) {
        const asset = JSON.parse(assetData);

        let objDefaults: Partial<SceneObject> = {};
        if (asset.type === "custom_prefab") {
           const newObj = { ...asset.prefabData, id: uuidv4(), x, y };
           const isUI = editorMode === "ui_stage";
           const newProject = {
              ...project,
              [isUI ? "uiMenus" : "scenes"]: (project[isUI ? "uiMenus" : "scenes"] || []).map((s) => s.id === currentScene.id ? { ...s, objects: [...s.objects, newObj] } : s)
           };
           setProject(newProject);
           pushHistory(newProject);
           setSelectedObjectId(newObj.id);
           return;
        } else if (asset.type === "prefab") {
          if (asset.prefabType === "chest") {
            objDefaults = {
              isText: true,
              textContent: "🎁",
              textFontSize: 64,
              width: 64,
              height: 64,
              interaction: "give-item",
              name: "Loot Chest",
            };
            // Optional: automatically ask user what item? We can just leave it blank for now.
            showError(
              'Loot Chest dropped! Remember to select it and assign the "Item to Give" in the Interaction settings.',
            );
          } else if (asset.prefabType === "door") {
            objDefaults = {
              isHitbox: true,
              width: 64,
              height: 128,
              interaction: "scene_change",
              name: "Portal / Door",
            };
            showError(
              'Portal dropped! Select it and assign the "Portal Destination" in the property panel.',
            );
          } else if (asset.prefabType === "npc") {
            objDefaults = {
              isHitbox: true,
              width: 100,
              height: 100,
              interaction: "dialogue",
              name: "NPC Trigger",
            };
            showError(
              'NPC dropped! Select it and assign a "Conversation" in the Interaction settings.',
            );
          }
        }

        let actualSrc = asset.src || "";
        if (asset.id && !asset.src) {
          const matchedAsset = project.assets.find(
            (a: any) => a.id === asset.id,
          );
          if (matchedAsset) actualSrc = matchedAsset.src;
        }

        const newObj: SceneObject = {
          id: uuidv4(),
          name: asset.name,
          src: actualSrc,
          _assetId: asset.id,
          x: x - 50, // Center roughly
          y: y - 50,
          width:
            asset.type === "ui_element"
              ? asset.uiElementType === "panel"
                ? 200
                : asset.uiElementType === "progress"
                  ? 150
                  : 50
              : asset.type === "hitbox"
                ? 100
                : asset.type === "script"
                  ? 64
                  : asset.type === "text"
                    ? 200
                    : 100,
          height:
            asset.type === "ui_element"
              ? asset.uiElementType === "panel"
                ? 200
                : asset.uiElementType === "progress"
                  ? 20
                  : 50
              : asset.type === "hitbox"
                ? 100
                : asset.type === "script"
                  ? 64
                  : asset.type === "text"
                    ? 50
                    : 100,
          rotation: 0,
          zIndex:
            (currentScene?.objects.length ?? 0) > 0
              ? Math.max(...currentScene!.objects.map((o) => o.zIndex)) + 1
              : 0,
          opacity: 1,
          locked: false,
          cursor:
            asset.type === "prefab" || asset.type === "audio"
              ? "pointer"
              : "default",
          animation: "none",
          interaction: asset.type === "audio" ? "sound" : "none",
          interactionData: asset.type === "audio" ? asset.id : undefined,
          isVideo: asset.type === "video",
          isHitbox: asset.type === "hitbox",
          isScript: asset.type === "script",
          isText: asset.type === "text" || asset.type === "audio",
          isUiElement: asset.type === "ui_element",
          uiElementType: asset.uiElementType,
          uiColorPrimary: "#00ffff",
          uiColorSecondary: "#ff00ff",
          uiIconType: "check",
          uiValue: 50,
          uiChecked: true,
          uiBorderType: "solid",
          textContent:
            asset.type === "text"
              ? "New Text"
              : asset.type === "audio"
                ? "🎵"
                : asset.type === "ui_element" &&
                    asset.uiElementType === "tooltip"
                  ? "Tooltip text"
                  : undefined,
          textColor: "#ffffff",
          textFontSize: 24,
          textFontFamily: "sans-serif",
          blendMode: "normal",
          parallaxSpeed: 1,
          hasPhysics: false,
          scriptAssetId: asset.type === "script" ? asset.id : undefined,
          ...objDefaults,
        };

        updateScene({ objects: [...currentScene.objects, newObj] });
        setSelectedObjectId(newObj.id);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  const handleStageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Resizing state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    objX: 0,
    objY: 0,
    anchor: "se",
  });

  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotateStart, setRotateStart] = useState({
    r: 0,
    cx: 0,
    cy: 0,
    startAngle: 0,
  });

  // Object dragging on stage
  const handleObjectPointerDown = (e: React.PointerEvent, obj: SceneObject) => {
    if (isPlaying) {
      if (!obj.isDraggable) return;
      e.stopPropagation();
      setRuntimeDraggingId(obj.id);

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: ((e.clientX - rect.left) / rect.width) * obj.width,
        y: ((e.clientY - rect.top) / rect.height) * obj.height,
      });

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {}
      return;
    }
    if (obj.locked) return;
    e.stopPropagation();

    if (e.shiftKey) {
      if (selectedMultiIds.includes(obj.id)) {
        setSelectedMultiIds((prev) => prev.filter((id) => id !== obj.id));
        setSelectedObjectId((prev) => (prev === obj.id ? null : prev));
      } else {
        if (!selectedMultiIds.includes(selectedObjectId || "")) {
          setSelectedMultiIds(
            selectedObjectId ? [selectedObjectId, obj.id] : [obj.id],
          );
        } else {
          setSelectedMultiIds((prev) => [...prev, obj.id]);
        }
        setSelectedObjectId(obj.id);
      }
    } else {
      // If we click an object already in multi-selection, don't clear.
      // This allows dragging the whole group.
      if (!selectedMultiIds.includes(obj.id)) {
        setSelectedObjectId(obj.id);
        setSelectedMultiIds([obj.id]);
      } else {
        setSelectedObjectId(obj.id);
      }
    }

    setDraggingId(obj.id);
    dragStartProjectRef.current = project;
    didDragRef.current = false;

    // Calculate offset from top-left of object
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / stageZoom,
      y: (e.clientY - rect.top) / stageZoom,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleResizePointerDown = (
    e: React.PointerEvent,
    obj: SceneObject,
    anchor: string = "se",
  ) => {
    if (isPlaying || obj.locked) return;
    e.stopPropagation();
    setResizingId(obj.id);
    dragStartProjectRef.current = project;
    setResizeStart({
      w: obj.width,
      h: obj.height,
      x: e.clientX,
      y: e.clientY,
      objX: obj.x,
      objY: obj.y,
      anchor,
    });
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleRotatePointerDown = (e: React.PointerEvent, obj: SceneObject) => {
    if (isPlaying || obj.locked) return;
    e.stopPropagation();
    setRotatingId(obj.id);
    dragStartProjectRef.current = project;

    // Find absolute center of the object relative to viewport
    const parentEl = (e.currentTarget as HTMLElement).parentElement;
    if (!parentEl) return;

    const rect = parentEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Calculate initial angle of mouse pointer relative to center
    const startAngle =
      Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

    setRotateStart({ r: obj.rotation || 0, cx, cy, startAngle });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleObjectPointerMove = (e: React.PointerEvent) => {
    if (isPlaying) {
      if (runtimeDraggingId && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const stageWidth =
          currentScene.width || project.globalSettings.stageWidth || 800;
        const stageHeight =
          currentScene.height || project.globalSettings.stageHeight || 600;
        let newX =
          ((e.clientX - rect.left) / rect.width) * stageWidth - dragOffset.x;
        let newY =
          ((e.clientY - rect.top) / rect.height) * stageHeight - dragOffset.y;
        setRuntimeOverrides((prev) => ({
          ...prev,
          [runtimeDraggingId]: { x: newX, y: newY },
        }));
      }

      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width - 0.5;
        const my = (e.clientY - rect.top) / rect.height - 0.5;
        setMouseRatio({ x: mx, y: my });
      }
      return;
    }

    if (resizingId) {
      didDragRef.current = true;
      const dx = (e.clientX - resizeStart.x) / stageZoom;
      const dy = (e.clientY - resizeStart.y) / stageZoom;

      let newW = resizeStart.w;
      let newH = resizeStart.h;
      let newX = resizeStart.objX;
      let newY = resizeStart.objY;

      if (resizeStart.anchor.includes("e"))
        newW = Math.max(10, resizeStart.w + dx);
      if (resizeStart.anchor.includes("w")) {
        newW = Math.max(10, resizeStart.w - dx);
        newX = resizeStart.objX + (resizeStart.w - newW);
      }
      if (resizeStart.anchor.includes("s"))
        newH = Math.max(10, resizeStart.h + dy);
      if (resizeStart.anchor.includes("n")) {
        newH = Math.max(10, resizeStart.h - dy);
        newY = resizeStart.objY + (resizeStart.h - newH);
      }

      updateObjectTransient(resizingId, {
        width: newW,
        height: newH,
        x: newX,
        y: newY,
      });
      return;
    }

    if (rotatingId) {
      didDragRef.current = true;
      const angle =
        Math.atan2(e.clientY - rotateStart.cy, e.clientX - rotateStart.cx) *
        (180 / Math.PI);
      let newRot = rotateStart.r + (angle - rotateStart.startAngle);

      // Snap to 45 deg if shift
      if (e.shiftKey) {
        newRot = Math.round(newRot / 45) * 45;
      }

      updateObjectTransient(rotatingId, { rotation: Math.floor(newRot) % 360 });
      return;
    }

    if (selectionStart && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / stageZoom;
      const my = (e.clientY - rect.top) / stageZoom;
      setSelectionBox({
        x: selectionStart.x,
        y: selectionStart.y,
        w: mx - selectionStart.x,
        h: my - selectionStart.y,
      });
      return;
    }

    if (!draggingId || !stageRef.current) return;
    didDragRef.current = true;

    const rect = stageRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / stageZoom - dragOffset.x;
    let newY = (e.clientY - rect.top) / stageZoom - dragOffset.y;

    // Snap to grid if enabled or shift is held
    if (project.globalSettings.snapToGrid || e.shiftKey) {
      const grid = project.globalSettings.gridSize || 20;
      newX = Math.round(newX / grid) * grid;
      newY = Math.round(newY / grid) * grid;
    }

    if (selectedMultiIds.length > 1 && selectedMultiIds.includes(draggingId)) {
      const startSceneList =
        editorMode === "ui_stage"
          ? dragStartProjectRef.current?.uiMenus
          : dragStartProjectRef.current?.scenes;
      const startScene = startSceneList?.find(
        (s: any) =>
          s.id ===
          (editorMode === "ui_stage"
            ? dragStartProjectRef.current?.currentUiMenuId
            : dragStartProjectRef.current?.currentSceneId),
      );
      const startDragObj = startScene?.objects.find(
        (o: any) => o.id === draggingId,
      );

      if (!startDragObj) return;
      const dx = newX - startDragObj.x;
      const dy = newY - startDragObj.y;

      setProject((prev) => {
        const isUI = editorMode === "ui_stage" && !isPlaying;
        const sceneList = isUI ? prev.uiMenus : prev.scenes;
        if (!sceneList) return prev;

        return {
          ...prev,
          [isUI ? "uiMenus" : "scenes"]: sceneList.map((s: any) =>
            s.id === (isUI ? prev.currentUiMenuId : prev.currentSceneId)
              ? {
                  ...s,
                  objects: s.objects.map((o: any) => {
                    const descendantIds = getDescendantIds(
                      selectedMultiIds,
                      s.objects,
                    );
                    if (
                      !selectedMultiIds.includes(o.id) &&
                      !descendantIds.includes(o.id)
                    )
                      return o;
                    const startObj = startScene?.objects.find(
                      (so: any) => so.id === o.id,
                    );
                    if (!startObj) return o;
                    return { ...o, x: startObj.x + dx, y: startObj.y + dy };
                  }),
                }
              : s,
          ),
        };
      });
    } else {
      const startSceneList =
        editorMode === "ui_stage"
          ? dragStartProjectRef.current?.uiMenus
          : dragStartProjectRef.current?.scenes;
      const startScene = startSceneList?.find(
        (s: any) =>
          s.id ===
          (editorMode === "ui_stage"
            ? dragStartProjectRef.current?.currentUiMenuId
            : dragStartProjectRef.current?.currentSceneId),
      );
      const startDragObj = startScene?.objects.find(
        (o: any) => o.id === draggingId,
      );
      if (!startDragObj) return;

      const dx = newX - startDragObj.x;
      const dy = newY - startDragObj.y;

      setProject((prev) => {
        const isUI = editorMode === "ui_stage" && !isPlaying;
        const sceneList = isUI ? prev.uiMenus : prev.scenes;
        if (!sceneList) return prev;

        return {
          ...prev,
          [isUI ? "uiMenus" : "scenes"]: sceneList.map((s: any) =>
            s.id === (isUI ? prev.currentUiMenuId : prev.currentSceneId)
              ? {
                  ...s,
                  objects: s.objects.map((o: any) => {
                    const descendantIds = getDescendantIds(
                      [draggingId],
                      s.objects,
                    );
                    if (o.id !== draggingId && !descendantIds.includes(o.id))
                      return o;

                    const startObj = startScene?.objects.find(
                      (so: any) => so.id === o.id,
                    );
                    if (!startObj) return o;
                    return { ...o, x: startObj.x + dx, y: startObj.y + dy };
                  }),
                }
              : s,
          ),
        };
      });
    }
  };

  const handleObjectPointerUp = (e: React.PointerEvent) => {
    if (isPlaying) {
      if (runtimeDraggingId) {
        setRuntimeDraggingId(null);
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      setSelectionBox(null);
      setSelectionStart(null);
      return;
    }

    if (selectionBox) {
      const bx = Math.min(selectionBox.x, selectionBox.x + selectionBox.w);
      const by = Math.min(selectionBox.y, selectionBox.y + selectionBox.h);
      const bw = Math.abs(selectionBox.w);
      const bh = Math.abs(selectionBox.h);

      const selectedIds = currentScene.objects
        .filter((obj) => {
          return (
            !obj.locked &&
            obj.x < bx + bw &&
            obj.x + obj.width > bx &&
            obj.y < by + bh &&
            obj.y + obj.height > by
          );
        })
        .map((o) => o.id);

      setSelectedMultiIds(selectedIds);
      if (selectedIds.length > 0) setSelectedObjectId(selectedIds[0]);
      else setSelectedObjectId(null);
      setSelectionBox(null);
      setSelectionStart(null);
    }

    if (draggingId || resizingId || rotatingId) {
      if (dragStartProjectRef.current) {
        setHistory((h) => ({
          past: [...h.past.slice(-20), dragStartProjectRef.current!],
          future: [],
        }));
      }
    }
    if (draggingId) {
      if (!didDragRef.current && !e.shiftKey) {
        // If they just clicked (no drag) and not holding shift,
        // make sure this object is the only selected one.
        // If holding shift, it stays in the multi-select array (added in pointerdown).
        setSelectedMultiIds([draggingId]);
        setSelectedObjectId(draggingId);
      }
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setDraggingId(null);
    }
    if (resizingId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setResizingId(null);
    }
    if (rotatingId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setRotatingId(null);
    }
  };

  // Global keyboard shortcuts for Undo/Redo/Clipboard
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input text area
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedMultiIds(currentScene.objects.map((o) => o.id));
        setSelectedObjectId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const idsToCopy =
          selectedMultiIds.length > 0
            ? selectedMultiIds
            : selectedObjectId
              ? [selectedObjectId]
              : [];
        if (idsToCopy.length > 0) {
          e.preventDefault();
          const objs = currentScene.objects.filter((o) =>
            idsToCopy.includes(o.id),
          );
          setClipboard(objs);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        const idsToCut =
          selectedMultiIds.length > 0
            ? selectedMultiIds
            : selectedObjectId
              ? [selectedObjectId]
              : [];
        if (idsToCut.length > 0) {
          e.preventDefault();
          const objs = currentScene.objects.filter((o) =>
            idsToCut.includes(o.id),
          );
          setClipboard(objs);
          updateScene({
            objects: currentScene.objects.filter(
              (o) => !idsToCut.includes(o.id),
            ),
          });
          setSelectedMultiIds([]);
          setSelectedObjectId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboard.length > 0) {
          e.preventDefault();
          const newObjs = clipboard.map((o) => ({
            ...o,
            id: uuidv4(),
            x: o.x + 20,
            y: o.y + 20,
          }));
          updateScene({ objects: [...currentScene.objects, ...newObjs] });
          setSelectedMultiIds(newObjs.map((o) => o.id));
          if (newObjs.length === 1) setSelectedObjectId(newObjs[0].id);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    history,
    project,
    clipboard,
    selectedObjectId,
    selectedMultiIds,
    currentScene,
  ]);

  // Keyboard nudging and duplication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((!selectedObjectId && selectedMultiIds.length === 0) || isPlaying)
        return;
      // Don't nudge if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      const idsToModify =
        selectedMultiIds.length > 0
          ? selectedMultiIds
          : selectedObjectId
            ? [selectedObjectId]
            : [];
      const objs = currentScene.objects.filter(
        (o) => idsToModify.includes(o.id) && !o.locked,
      );
      if (objs.length === 0) return;

      // Copy with Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        setClipboard(objs);
        return;
      }

      // Paste with Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        if (clipboard.length === 0) return;
        const rect = stageRef.current?.getBoundingClientRect();
        // Since we don't have mouse position in keyboard event, paste slightly offset from center or original
        const firstX = clipboard[0].x;
        const firstY = clipboard[0].y;
        const maxZ = Math.max(...currentScene.objects.map((o) => o.zIndex), 0);
        
        const newObjs = clipboard.map((o, i) => ({
          ...o,
          id: uuidv4(),
          x: o.x + 40,
          y: o.y + 40,
          zIndex: maxZ + i + 1,
          locked: false,
        }));

        setProject((p) => ({
          ...p,
          scenes: p.scenes.map((s) => {
            if (
              editorMode === "stage" &&
              s.id === currentScene.id
            ) {
              return {
                ...s,
                objects: [...s.objects, ...newObjs],
              };
            }
            return s;
          }),
          uiMenus: p.uiMenus?.map((m) => {
            if (
              editorMode === "ui_stage" &&
              m.id === currentScene.id
            ) {
              return {
                ...m,
                objects: [...m.objects, ...newObjs],
              };
            }
            return m;
          }),
        }));
        setSelectedMultiIds(newObjs.map(o => o.id));
        setSelectedObjectId(newObjs[0]?.id || null);
        return;
      }

      // Duplicate with Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const maxZ = Math.max(...currentScene.objects.map((o) => o.zIndex), 0);
        const newObjs = objs.map((obj, i) => ({
          ...obj,
          id: uuidv4(),
          x: obj.x + 20,
          y: obj.y + 20,
          zIndex: maxZ + i + 1,
        }));
        updateScene({ objects: [...currentScene.objects, ...newObjs] });
        setSelectedMultiIds(newObjs.map((o) => o.id));
        setSelectedObjectId(newObjs[0]?.id || null);
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "Delete" || e.key === "Backspace") {
        updateScene({
          objects: currentScene.objects.filter(
            (o) => !idsToModify.includes(o.id),
          ),
        });
        setSelectedMultiIds([]);
        setSelectedObjectId(null);
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        // Since we are nudging array of objects, we use updateScene directly instead of updateObject so they move together
        updateScene({
          objects: currentScene.objects.map((o) => {
            if (idsToModify.includes(o.id) && !o.locked) {
              return { ...o, x: o.x + dx, y: o.y + dy };
            }
            return o;
          }),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedObjectId, selectedMultiIds, currentScene.objects, isPlaying, clipboard]);

  const handleExport = () => {
    try {
      const html = generateExportHtml(project);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = project.name ? project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'game';
      a.download = `${cleanName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showError("Failed to export HTML: " + err);
      console.error(err);
    }
  };

  const togglePlayMode = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    setRuntimeOverrides({});
    if (newState) {
      setTriggeredObjects(new Set());
      setPlayerInventory([]);
      setCollectedObjects([]);
      setPlayerFlags([]);
      setActiveQuests(
        project.quests?.filter((q) => q.autoStart).map((q) => q.id) || [],
      );
      setCompletedQuests([]);
      const defaultNeeds: Record<string, number> = {};
      const customNeeds = project.globalSettings?.customNeeds?.length
        ? project.globalSettings.customNeeds
        : ["rest", "hunger", "connection", "spiritual", "novelty"];
      customNeeds.forEach((need) => (defaultNeeds[need] = 100));
      setPlayerNeeds(defaultNeeds);

      const defaultSkills: Record<string, number> = {};
      const customSkills = project.globalSettings?.customSkills?.length
        ? project.globalSettings.customSkills
        : ["naturalist", "occultist", "scribal"];
      customSkills.forEach((skill) => (defaultSkills[skill] = 1));
      setPlayerSkills(defaultSkills);
      setGameTime(8);
    } else {
      setPlayerInventory([]);
      setCollectedObjects([]);
      setTriggeredObjects(new Set());
    }
    setActiveUiMenus(
      newState
        ? (project.uiMenus || [])
            .filter((menu) => menu.isOpenByDefault)
            .map((menu) => menu.id)
        : [],
    );
    setActiveDialogue(null);
    setPreviewDialogue(null);
    setIsInventoryOpen(false);
  };

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fetchFromGitHub = async () => {
    setIsFetchingGithub(true);
    try {
      let treeData: any[] = [];

      try {
        const headers: HeadersInit = {};
        if (import.meta.env.VITE_GITHUB_TOKEN) {
          headers["Authorization"] =
            `token ${import.meta.env.VITE_GITHUB_TOKEN}`;
        }

        // Try to fetch the full recursive tree
        const response = await fetch(
          "https://api.github.com/repos/thenabu222/entropic-ai/git/trees/main?recursive=1",
          { headers },
        );
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        if (data && Array.isArray(data.tree)) {
          treeData = data.tree;
        }
      } catch (err) {
        console.warn(
          "Recursive fetch failed, falling back to root directory",
          err,
        );
        // Fallback to root directory if recursive fails (e.g., due to size or rate limits)
        const headers: HeadersInit = {};
        if (import.meta.env.VITE_GITHUB_TOKEN) {
          headers["Authorization"] =
            `token ${import.meta.env.VITE_GITHUB_TOKEN}`;
        }
        const fallbackResponse = await fetch(
          "https://api.github.com/repos/thenabu222/entropic-ai/contents/",
          { headers },
        );
        if (!fallbackResponse.ok)
          throw new Error(`Fallback API Error: ${fallbackResponse.status}`);
        const fallbackData = await fallbackResponse.json();
        if (Array.isArray(fallbackData)) {
          treeData = fallbackData.map((f: any) => ({
            path: f.name,
            type: f.type === "file" ? "blob" : "tree",
            download_url: f.download_url,
          }));
        }
      }

      const validFiles = treeData.filter(
        (file: any) =>
          file.type === "blob" &&
          file.path &&
          file.path.match(/\.(png|jpg|jpeg|gif|webp|js|ts)$/i),
      );

      const newAssets: Asset[] = validFiles.map((file: any) => {
        const name = file.path.split("/").pop();
        const parts = file.path.split("/");
        parts.pop(); // remove filename
        const category = parts.length > 0 ? parts.join("/") : "root";

        // Properly encode the path to handle spaces and special characters
        const encodedPath = file.path
          .split("/")
          .map((p: string) => encodeURIComponent(p))
          .join("/");

        const isScript = file.path.match(/\.(js|ts)$/i);

        return {
          id: uuidv4(),
          type: isScript ? "script" : "image",
          category,
          src:
            file.download_url ||
            `https://raw.githubusercontent.com/thenabu222/entropic-ai/main/${encodedPath}`,
          name: name,
        };
      });

      setProject((p) => {
        let updatedAssets = [...p.assets];
        const timestamp = Date.now();
        const srcReplacements = new Map<string, string>();
        const nameReplacements = new Map<string, string>();

        newAssets.forEach((newA) => {
          const existingIndex = updatedAssets.findIndex(
            (a) => a.name === newA.name,
          );
          const newSrc = newA.src + `?t=${timestamp}`;
          nameReplacements.set(newA.name, newSrc);

          if (existingIndex !== -1) {
            srcReplacements.set(updatedAssets[existingIndex].src, newSrc);
            updatedAssets[existingIndex] = {
              ...updatedAssets[existingIndex],
              src: newSrc,
            };
          } else {
            updatedAssets.unshift({
              ...newA,
              src: newSrc,
            });
          }
        });

        // Deep replace src in scenes and uiMenus
        const migrateObjects = (scenes: Scene[]) => {
          return scenes.map((scene) => ({
            ...scene,
            objects: scene.objects.map((obj) => {
              let updatedSrc = obj.src;
              if (srcReplacements.has(obj.src)) {
                updatedSrc = srcReplacements.get(obj.src)!;
              } else if (
                obj.src &&
                obj.src.startsWith("data:") &&
                nameReplacements.has(obj.name)
              ) {
                updatedSrc = nameReplacements.get(obj.name)!;
              }
              return { ...obj, src: updatedSrc };
            }),
          }));
        };

        return {
          ...p,
          assets: updatedAssets,
          scenes: migrateObjects(p.scenes || []),
          uiMenus: migrateObjects(p.uiMenus || []),
        };
      });
    } catch (error: any) {
      console.error("GitHub fetch failed", error);
      showError(
        `Failed to fetch from GitHub: ${error.message || "Network Error"}. You may have hit the GitHub API rate limit.`,
      );
    } finally {
      setIsFetchingGithub(false);
    }
  };

  // Quick Edit UI Dragging
  useEffect(() => {
    if (!quickEditDragging) return;
    const handlePointerMove = (e: PointerEvent) => {
      setQuickEditPos({
        x:
          quickEditDragging.startPos.x + (e.clientX - quickEditDragging.startX),
        y:
          quickEditDragging.startPos.y + (e.clientY - quickEditDragging.startY),
      });
    };
    const handlePointerUp = () => setQuickEditDragging(null);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [quickEditDragging]);

  // Sidebar Resizing Logic
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (document.body.classList.contains("resizing-left-sidebar")) {
        setLeftSidebarWidth((w) => {
          const newWidth = e.clientX; // Left sidebar width is approximately the clientX
          if (newWidth < 120) return 0;
          if (w === 0 && newWidth > 30) return 256;
          return Math.max(0, Math.min(800, newWidth));
        });
      } else if (document.body.classList.contains("resizing-right-sidebar")) {
        setRightSidebarWidth((w) => {
          const newWidth = document.body.clientWidth - e.clientX;
          if (newWidth < 120) return 0;
          if (w === 0 && newWidth > 30) return 288;
          return Math.max(0, Math.min(800, newWidth));
        });
      }
    };
    const handlePointerUp = () => {
      document.body.classList.remove("resizing-left-sidebar");
      document.body.classList.remove("resizing-right-sidebar");
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [contextMenu]);

  // Auto-fetch from GitHub on mount
  useEffect(() => {
    fetchFromGitHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveZIndex = (id: string, dir: 1 | -1) => {
    const obj = currentScene.objects.find((o) => o.id === id);
    if (!obj) return;
    updateObject(id, { zIndex: obj.zIndex + dir });
  };

  const [previewDialogueText, _setPreviewDialogue] = useState<string | null>(
    null,
  );
  const previewDialogueRef = useRef<number | NodeJS.Timeout | null>(null);
  const setPreviewDialogue = (text: string | null) => {
    _setPreviewDialogue(text);
    if (previewDialogueRef.current) clearTimeout(previewDialogueRef.current);
    // Dialogues must be clicked to close
  };
  const previewDialogue = previewDialogueText;

  const handleObjectClick = (obj: SceneObject) => {
    if (!isPlaying) return;
    if (obj.triggerOnce && triggeredObjects.has(obj.id)) return;

    if (obj.triggerOnce) {
      setTriggeredObjects((prev) => new Set(prev).add(obj.id));
    }

    if (obj.audioSrc) {
      const audioAsset = project.assets.find((a) => a.id === obj.audioSrc);
      if (audioAsset) {
        const audio = new Audio(audioAsset.src);
        audio.play().catch((e) => console.error("SFX playback failed", e));
      }
    }

    // Evaluate global Skill requirement block (if the object has a skill set to something other than 'none' and interaction is NOT skill_check)
    if (
      obj.requiredSkill &&
      obj.requiredSkill !== "none" &&
      obj.interaction !== "skill_check"
    ) {
      const diff = obj.skillCheckDifficulty || 0;
      const roll =
        Math.floor(Math.random() * 20) +
        1 +
        (playerSkills[obj.requiredSkill] || 0);
      if (roll < diff) {
        setPreviewDialogue(
          `[Skill Check Failed] ${obj.requiredSkill} roll: ${roll} vs ${diff}`,
        );

        return; // Stop interaction!
      }
    }

    // Process Needs Effect
    if (obj.needsEffect) {
      try {
        if (typeof obj.needsEffect === "string") {
          const effect = JSON.parse(obj.needsEffect);
          // skip string parsing if it's already an object
        }
        const effect =
          typeof obj.needsEffect === "string"
            ? JSON.parse(obj.needsEffect)
            : obj.needsEffect;
        let changed = false;
        const nextNeeds = { ...playerNeeds };
        for (const [key, val] of Object.entries(effect) as [string, number][]) {
          if (val) {
            nextNeeds[key] = (nextNeeds[key] || 0) + val;
            changed = true;
          }
        }
        if (changed) setPlayerNeeds(nextNeeds);
      } catch (e) {
        console.error("Failed to parse needs effect", e);
      }
    }

    if (obj.grantSkill && obj.grantSkill !== "none") {
      const amount = obj.grantSkillValue || 1;
      setPlayerSkills((prev) => ({
        ...prev,
        [obj.grantSkill as string]: Math.min(
          20,
          (prev[obj.grantSkill as string] || 0) + amount,
        ),
      }));
      setPreviewDialogue(`Gained +${amount} ${obj.grantSkill}!`);
    }

    if (obj.timeCost) {
      setGameTime((prev) => (prev + (obj.timeCost || 0)) % 24);
    }

    if (obj.reputationEffect && obj.reputationEffect.npcId) {
      const effect = obj.reputationEffect;
      setPlayerFactions((prev) => ({
        ...prev,
        [effect.npcId]: Math.max(-100, Math.min(100, (prev[effect.npcId] || 0) + effect.value))
      }));
    }

    if (obj.requireItemId && !playerInventory.includes(obj.requireItemId)) {
      const item = project.inventoryItems.find(
        (i) => i.id === obj.requireItemId,
      );
      setPreviewDialogue(
        `You need ${item?.name || "a specific item"} to interact with this.`,
      );

      return;
    }

    if (
      obj.requireItemId &&
      obj.consumeRequiredItem &&
      playerInventory.includes(obj.requireItemId)
    ) {
      setPlayerInventory((prev) => {
        const next = [...prev];
        const idx = next.indexOf(obj.requireItemId!);
        if (idx !== -1) next.splice(idx, 1);
        return next;
      });
      const reqItem = project.inventoryItems.find(
        (i) => i.id === obj.requireItemId,
      );
      if (reqItem) {
        setPreviewDialogue(`You used up: ${reqItem.name}`);
      }
    }

    if (obj.interaction === "dialogue") {
      if (obj.dialogueTreeId) {
        const tree = project.dialogueTrees.find(
          (t) => t.id === obj.dialogueTreeId,
        );
        if (tree && tree.startNodeId) {
          setActiveDialogue({ treeId: tree.id, nodeId: tree.startNodeId });
        }
      } else if (obj.interactionData) {
        setPreviewDialogue(obj.interactionData);
      }
    } else if (
      obj.interaction === "give-item" ||
      obj.interaction === "collect"
    ) {
      if (obj.giveItemId) {
        setPlayerInventory((prev) => [...prev, obj.giveItemId!]);
        const item = project.inventoryItems.find(
          (i) => i.id === obj.giveItemId,
        );
        setPreviewDialogue(
          obj.interactionData || `You obtained: ${item?.name || "an item"}!`,
        );
      } else if (!obj.giveItemId) {
        setPreviewDialogue(obj.interactionData || `You interacted with this!`);
      }

      if (obj.interaction === "collect") {
        setCollectedObjects((prev) => [...prev, obj.id]);
      }
    } else if (obj.interaction === "link" && obj.interactionData) {
      window.open(obj.interactionData, "_blank");
    } else if (obj.interaction === "modify_number" && obj.targetUiId) {
      const amount = parseFloat(obj.interactionData || "0");

      const updateObjHelper = (s: Scene) => {
        return {
          ...s,
          objects: s.objects.map((o) => {
            if (o.id === obj.targetUiId) {
              if (o.uiElementType === "progress") {
                return {
                  ...o,
                  uiValue: Math.max(
                    0,
                    Math.min(100, (o.uiValue || 0) + amount),
                  ),
                };
              } else if (o.isText && o.textContent !== undefined) {
                const currentNum = parseFloat(o.textContent || "0");
                if (!isNaN(currentNum))
                  return {
                    ...o,
                    textContent: (currentNum + amount).toString(),
                  };
              }
            }
            return o;
          }),
        };
      };

      setProject((prev) => ({
        ...prev,
        scenes: (prev.scenes || []).map(updateObjHelper),
        uiMenus: (prev.uiMenus || []).map(updateObjHelper),
      }));
    } else if (obj.interaction === "open_ui" && obj.targetUiId) {
      setActiveUiMenus((prev) => [...prev, obj.targetUiId!]);
    } else if (obj.interaction === "close_ui") {
      setActiveUiMenus((prev) => {
        if (obj.targetUiId) {
          return prev.filter((id) => id !== obj.targetUiId);
        }
        const next = [...prev];
        if (next.length > 0) next.pop(); // Close the topmost UI menu
        return next;
      });
    } else if (obj.interaction === "scene_change" && obj.interactionData) {
      const targetScene = project.scenes.find(
        (s) => s.id === obj.interactionData,
      );
      if (targetScene) {
        setTransition({ active: true, type: "fade" });
        setTimeout(() => {
          setProject((p) => ({ ...p, currentSceneId: targetScene.id }));
        }, 500);
        setTimeout(() => {
          setTransition({ active: false, type: "fade" });
        }, 1000);
      } else {
        showError(`Scene not found: ${obj.interactionData}`);
      }
    } else if (obj.interaction === "toggle_inventory") {
      setIsInventoryOpen((prev) => !prev);
    } else if (obj.interaction === "restart_scene") {
      setPreviewDialogue("");
      setPlayerInventory([]);
      setCollectedObjects([]);
      setRuntimeOverrides({});
    } else if (obj.interaction === "restart_game") {
      setPreviewDialogue("");
      setPlayerInventory([]);
      setCollectedObjects([]);
      setPlayerFlags([]);
      setActiveQuests(
        project.quests?.filter((q) => q.autoStart).map((q) => q.id) || [],
      );
      setCompletedQuests([]);
      setPlayerSkills({});
      setRuntimeOverrides({});
      setPlayerNeeds({});
      setActiveUiMenus([]);
      setIsInventoryOpen(false);
      setIsCraftingOpen(false);
      setIsQuestLogOpen(false);
      const firstScene = (project.scenes && project.scenes[0]) || null;
      if (firstScene) {
        setProject((p) => ({ ...p, currentSceneId: firstScene.id }));
      }
    } else if (obj.interaction === "toggle_fullscreen") {
      if (!document.fullscreenElement) {
        document.documentElement
          .requestFullscreen()
          .catch((err) => console.error("Fullscreen error", err));
      } else {
        document
          .exitFullscreen()
          .catch((err) => console.error("Exit fullscreen error", err));
      }
    } else if (obj.interaction === "toggle_mute") {
      // In a real implementation this would toggle a global volume state,
      // but without a global audio context we can just mock it or toggle a player flag
      setPreviewDialogue("Audio mute toggled.");
    } else if (obj.interaction === "exit_game") {
      setIsPlaying(false);
    } else if (obj.interaction === "open_crafting") {
      setIsCraftingOpen(true);
    } else if (obj.interaction === "open_quest_log") {
      setIsQuestLogOpen(true);
    } else if (obj.interaction === "open_skills") {
      setIsSkillsOpen(true);
    } else if (obj.interaction === "open_almanac") {
      setIsAlmanacOpen(true);
    } else if (obj.interaction === "open_map") {
      if (project.maps && project.maps.length > 0 && !activeFastTravelMapId) {
        setActiveFastTravelMapId(project.maps[0].id);
      }
      setIsMapOpen(true);
    } else if (obj.interaction === "open_relationships") {
      setIsRelationshipsOpen(true);
    } else if (obj.interaction === "open_settings") {
      setIsSettingsOpen(true);
    } else if (obj.interaction === "start_quest" && obj.interactionData) {
      if (
        !activeQuests.includes(obj.interactionData) &&
        !completedQuests.includes(obj.interactionData)
      ) {
        setActiveQuests((prev) => [...prev, obj.interactionData!]);
        const questName =
          project.quests?.find((q) => q.id === obj.interactionData)?.name ||
          "Quest";
        setPreviewDialogue(`Started Quest: ${questName}`);
      }
    } else if (obj.interaction === "complete_quest" && obj.interactionData) {
      if (activeQuests.includes(obj.interactionData)) {
        setActiveQuests((prev) =>
          prev.filter((id) => id !== obj.interactionData),
        );
        setCompletedQuests((prev) => [...prev, obj.interactionData!]);
        const questName =
          project.quests?.find((q) => q.id === obj.interactionData)?.name ||
          "Quest";
        setPreviewDialogue(`Completed Quest: ${questName}`);
      }
    } else if (obj.interaction === "set_flag" && obj.interactionData) {
      if (!playerFlags.includes(obj.interactionData)) {
        setPlayerFlags((prev) => [...prev, obj.interactionData!]);
      }
      // Show the event text every time they interact with this object!
      setPreviewDialogue(obj.interactionData);
    } else if (obj.interaction === "save_game") {
      const stateToSave = {
        inventory: playerInventory,
        needs: playerNeeds,
        time: gameTime,
        skills: playerSkills,
        collectedObjects: collectedObjects,
        flags: playerFlags,
      };
      localStorage.setItem(
        `neocities_game_save_${project.id}`,
        JSON.stringify(stateToSave),
      );
      setPreviewDialogue("Game Saved!");
    } else if (obj.interaction === "load_game") {
      const saved = localStorage.getItem(`neocities_game_save_${project.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.inventory) setPlayerInventory(parsed.inventory);
          if (parsed.needs) setPlayerNeeds(parsed.needs);
          if (parsed.time) setGameTime(parsed.time);
          if (parsed.skills) setPlayerSkills(parsed.skills);
          if (parsed.collectedObjects)
            setCollectedObjects(parsed.collectedObjects);
          if (parsed.flags) setPlayerFlags(parsed.flags);
          setPreviewDialogue("Game Loaded!");
        } catch (e) {
          setPreviewDialogue("Load failed: Corrupted save data.");
        }
      } else {
        setPreviewDialogue("No save game found.");
      }
    } else if (obj.interaction === "skill_check") {
      const skill = obj.requiredSkill || "none";
      const dc = obj.skillCheckDifficulty || 10;
      const roll = Math.floor(Math.random() * 20) + 1;
      const modifier = 2; // Hardcoded for now, could be dynamic later
      const total = roll + modifier;
      const success = total >= dc;

      const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
      const resultText = success
        ? `[${skillName} Check: ${total} vs DC ${dc} - SUCCESS]\n\n${obj.interactionData || "You succeeded!"}`
        : `[${skillName} Check: ${total} vs DC ${dc} - FAILED]\n\nYou failed to interact with this object.`;

      setPreviewDialogue(resultText);
    } else if (obj.interaction === "sound" && obj.interactionData) {
      const audioAsset = project.assets.find(
        (a) => a.id === obj.interactionData,
      );
      if (audioAsset) {
        const mediaFragment = audioAsset.trimStart || audioAsset.trimEnd ? `#t=${audioAsset.trimStart || 0}${audioAsset.trimEnd ? ',' + audioAsset.trimEnd : ''}` : '';
        const audio = new Audio(audioAsset.src + mediaFragment);
        audio.volume = audioAsset.volume ?? 1;
        audio.play().catch((e) => console.error("SFX playback failed", e));
      }
    } else if (obj.interaction === "run_script" && obj.scriptAssetId) {
      const scriptAsset = project.assets.find(
        (a) => a.id === obj.scriptAssetId,
      );
      if (scriptAsset && scriptAsset.src) {
        fetch(scriptAsset.src)
          .then((res) => res.text())
          .then((code) => {
            try {
              const context = {
                project,
                setProject,
                playerInventory,
                setPlayerInventory,
                setPreviewDialogue,
                obj,
              };
              const func = new Function("context", code);
              func(context);
            } catch (err) {
              console.error("Script execution failed", err);
              setPreviewDialogue("Script execution failed!");
            }
          })
          .catch((err) => {
            console.error("Failed to fetch script", err);
          });
      }
    } else if (obj.interaction === "play_cutscene" && obj.interactionData) {
      const videoAsset = project.assets.find(
        (a) => a.id === obj.interactionData,
      );
      if (videoAsset) {
        setActiveCutscene({
          src: videoAsset.src,
          targetSceneId: obj.scriptAssetId || undefined,
        });
      }
    }
  };

  const usedAssetSrcs = new Set(
    project.scenes.flatMap((s) => s.objects.map((o) => o.src)),
  );
  const sortedImageAssets = [
    ...project.assets.filter((a) => a.type === "image"),
  ].sort((a, b) => {
    const aUsed = usedAssetSrcs.has(a.src);
    const bUsed = usedAssetSrcs.has(b.src);
    if (aUsed && !bUsed) return -1;
    if (!aUsed && bUsed) return 1;
    return a.name.localeCompare(b.name);
  });

  const uiBg = project.globalSettings.uiColorBackground || "#08060d";
  const uiPrimary =
    (isPlaying ? playerUiColor : null) ||
    project.globalSettings.uiColorPrimary ||
    "#00ffcc";
  const uiSecondary = project.globalSettings.uiColorSecondary || "#94a3b8";
  const uiFont = project.globalSettings.uiFontFamily || "sans-serif";
  const uiRadius = `${project.globalSettings.uiBorderRadius ?? 8}px`;
  const deviceFrame = project.globalSettings.deviceFrame;
  const deviceFrameAsset = deviceFrame
    ? project.assets.find((asset) => asset.id === deviceFrame.assetId)
    : undefined;
  const showDeviceFrame = !!(
    isPlaying &&
    deviceFrame &&
    deviceFrameAsset
  );
  const logicalStageWidth =
    currentScene.width || project.globalSettings.stageWidth || 800;
  const logicalStageHeight =
    currentScene.height || project.globalSettings.stageHeight || 600;

  return (
    <div className="studio-app flex flex-col h-screen bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
      {/* Top Bar */}
      {editorError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[9999] bg-red-500 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
          <span>{editorError}</span>
          <button
            onClick={() => setEditorError(null)}
            className="text-white/80 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-xl border border-neutral-700 w-80">
            <h3 className="text-lg font-medium text-white mb-6 text-center">
              {confirmDialog.message}
            </h3>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {promptModal?.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-xl border border-neutral-700 w-80">
            <h3 className="text-lg font-medium text-white mb-4">
              {promptModal.message}
            </h3>
            <input
              autoFocus
              type="text"
              defaultValue={promptModal.defaultValue}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-white mb-4 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  promptModal.onSubmit(e.currentTarget.value);
                  setPromptModal(null);
                } else if (e.key === "Escape") {
                  setPromptModal(null);
                }
              }}
              id="prompt-input"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPromptModal(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById(
                    "prompt-input",
                  ) as HTMLInputElement;
                  if (el) {
                    promptModal.onSubmit(el.value);
                  }
                  setPromptModal(null);
                }}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="studio-titlebar flex items-center justify-between gap-4 px-4 py-2 relative z-[2100] custom-scrollbar min-h-[58px] shrink-0">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="studio-brand hidden md:flex" aria-label="Cavebot Studio">
            <span className="studio-brand__sigil">✦</span>
            <span className="studio-brand__name">CAVEBOT</span>
            <span className="studio-brand__edition">divine freeware</span>
          </div>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="studio-new-button flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={12} /> New
          </button>
          <input
            type="text"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            className="studio-project-name w-36 lg:w-56 px-2.5 py-1.5 text-sm focus:outline-none transition-colors"
            placeholder="Game Title"
            aria-label="Project title"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1 mr-2 text-sm font-mono">
            {saveStatus === "saving" && (
              <span className="text-amber-500 animate-pulse">Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-500 font-bold">Save Failed!</span>
            )}
          </div>

          <button
            onClick={undo}
            disabled={history.past.length === 0}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={history.future.length === 0}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 mr-2"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>

          <div className="h-6 w-px bg-neutral-800 mx-2"></div>

          <div className="flex items-center gap-2 mr-2 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={project.globalSettings.snapToGrid}
              onChange={(e) =>
                setProject((p) => ({
                  ...p,
                  globalSettings: {
                    ...p.globalSettings,
                    snapToGrid: e.target.checked,
                  },
                }))
              }
              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950"
            />
            <LabelWithHelp
              label="Snap Grid"
              className="text-neutral-400"
              helpText="Align objects to a grid when moving them."
            />
          </div>
          <div className="flex items-center gap-2 mr-4 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={project.globalSettings.showGhostOutlines}
              onChange={(e) =>
                setProject((p) => ({
                  ...p,
                  globalSettings: {
                    ...p.globalSettings,
                    showGhostOutlines: e.target.checked,
                  },
                }))
              }
              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950"
            />
            <LabelWithHelp
              label="Show Helpers"
              className="text-neutral-400"
              helpText="Show outlines of invisible objects and hidden click targets."
            />
          </div>

          {/* Backup / Restore Controls */}
          <div className="relative">
            <button
              onClick={() => setIsBackupMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700/85 hover:bg-neutral-800 rounded-lg text-xs font-bold transition-all shadow-sm text-neutral-200 active:scale-95"
              title="Backup, restore, or manage version slots"
            >
              <Save size={13} className="text-emerald-500" />
              Backup / Restore
              <ChevronDown size={11} className={`transition-transform duration-200 ${isBackupMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBackupMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[2999]" 
                  onClick={() => setIsBackupMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-[410px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-[3000] p-4 flex flex-col gap-4 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                    <div className="flex items-center gap-1.5">
                      <History size={14} className="text-emerald-500 animate-pulse" />
                      <span className="font-bold text-neutral-200 uppercase tracking-wider text-[10px]">Project Version Control</span>
                    </div>
                    <button 
                      onClick={() => setIsBackupMenuOpen(false)}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Visual Save Timeline Sequence */}
                  {(() => {
                    const getSlotTime = (m: SaveSlotMeta) => {
                      if (m.timeMs) return m.timeMs;
                      try {
                        return new Date(m.timestamp).getTime();
                      } catch (e) {
                        return 0;
                      }
                    };
                    const occupiedSlots = [...saveSlotsMeta]
                      .filter((s) => s.projectName)
                      .sort((a, b) => getSlotTime(a) - getSlotTime(b)); // oldest first to newest last

                    const latestSlotMeta = occupiedSlots.length > 0 ? occupiedSlots[occupiedSlots.length - 1] : null;

                    return (
                      <div className="flex flex-col gap-2.5 p-3 bg-neutral-900/45 border border-neutral-850 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <History size={10} className="text-emerald-400" /> Save Chronology Track
                          </span>
                          {occupiedSlots.length > 0 && (
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Latest Slot: #{latestSlotMeta?.slotId}
                            </span>
                          )}
                        </div>

                        {occupiedSlots.length === 0 ? (
                          <div className="text-[10px] text-neutral-500 italic text-center py-2.5">
                            No checkpoint backups on the timeline yet.<br />Save a slot below to begin tracking versions!
                          </div>
                        ) : (
                          <div className="relative pt-4 pb-2">
                            {/* Horizontal timeline bar */}
                            <div className="absolute top-[26px] left-3 right-3 h-[2px] bg-neutral-800 z-0" />
                            
                            {/* Connected Nodes */}
                            <div className="relative z-10 flex items-center justify-between px-1.5">
                              {occupiedSlots.map((m, idx) => {
                                const isLatest = latestSlotMeta && m.slotId === latestSlotMeta.slotId;
                                const isOldest = idx === 0 && occupiedSlots.length > 1;
                                return (
                                  <div 
                                    key={m.slotId} 
                                    className="flex flex-col items-center group relative cursor-pointer"
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        message: `Load and restore your project state from Slot ${m.slotId} (${m.projectName})?`,
                                        onConfirm: () => {
                                          handleLoadFromSlot(m.slotId);
                                          setIsBackupMenuOpen(false);
                                        }
                                      });
                                    }}
                                  >
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-[36px] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 p-2.5 rounded-lg shadow-2xl w-48 -translate-x-1/2 left-1/2 z-[4000] flex flex-col gap-1 text-center">
                                      <div className="flex items-center justify-between font-bold border-b border-neutral-900 pb-1 mb-1 font-mono text-[9px]">
                                        <span className="text-emerald-400">Slot {m.slotId}</span>
                                        {isLatest && <span className="text-emerald-400 text-[8px] tracking-wider uppercase">LATEST VERSION</span>}
                                        {isOldest && <span className="text-indigo-400 text-[8px] tracking-wider uppercase">OLDEST</span>}
                                      </div>
                                      <div className="font-semibold truncate text-neutral-200 text-xs">{m.projectName}</div>
                                      <div className="text-[9px] text-neutral-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                                        <Clock size={8} /> {m.timestamp}
                                      </div>
                                      <div className="text-[9px] text-neutral-500 font-bold">
                                        {m.savedSceneCount} scenes • {m.gameFlagCount} flags
                                      </div>
                                      <div className="text-[9px] text-emerald-400 font-bold mt-1.5 border-t border-neutral-900/60 pt-1 flex items-center justify-center gap-1">
                                        <Upload size={10} /> Click to Restore version
                                      </div>
                                    </div>

                                    {/* Node Bubble */}
                                    <div 
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs ring-4 transition-all hover:scale-110 active:scale-95 ${
                                        isLatest 
                                          ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/15 border border-emerald-400" 
                                          : isOldest
                                            ? "bg-indigo-950/20 text-indigo-450 ring-indigo-500/10 border border-indigo-500/60 hover:border-indigo-400"
                                            : "bg-neutral-900 text-neutral-350 ring-neutral-950/40 border border-neutral-700 hover:border-neutral-500"
                                      }`}
                                      title={`Slot ${m.slotId}: ${m.projectName} (${m.timestamp})`}
                                    >
                                      {m.slotId}
                                    </div>

                                    {/* Tag label under node */}
                                    <span className={`text-[9px] mt-1.5 font-bold font-mono tracking-tight ${
                                      isLatest ? "text-emerald-400" : isOldest ? "text-indigo-400" : "text-neutral-500 font-medium"
                                    }`}>
                                      {isLatest ? "Latest" : isOldest ? "Oldest" : `#${m.slotId}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Standard File Backup / Restore */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        handleExportProject();
                        setIsBackupMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white rounded-lg transition-all active:scale-95 text-center font-semibold animate-none"
                      title="Download project version to your computer as a JSON file"
                    >
                      <Download size={13} className="text-indigo-400" /> Download File
                    </button>
                    <label
                      className="flex items-center justify-center gap-1.5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white rounded-lg transition-all active:scale-95 cursor-pointer text-center font-semibold"
                      title="Upload a previously exported JSON backup from your computer"
                    >
                      <Upload size={13} className="text-indigo-400" /> Upload File
                      <input
                        type="file"
                        accept=".json,.html"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          handleImportProject(e);
                          setIsBackupMenuOpen(false);
                        }}
                      />
                    </label>
                  </div>

                  <div className="h-px bg-neutral-800/60" />

                  {/* Local Storage Save Slots */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-450 uppercase tracking-wider text-[9px]">
                        Database Save Slots (Instant & Clean)
                      </span>
                      <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tight">Max 5 slots</span>
                    </div>
                    
                    {[1, 2, 3, 4, 5].map((slotId) => {
                      const meta = saveSlotsMeta.find((s) => s.slotId === slotId);
                      
                      // Highlight slot item if it's the latest save in the timeline
                      const occupiedSlotsCopy = [...saveSlotsMeta]
                        .filter((s) => s.projectName)
                        .sort((a, b) => {
                          const ta = a.timeMs || 0;
                          const tb = b.timeMs || 0;
                          return ta - tb;
                        });
                      const latestSlotId = occupiedSlotsCopy.length > 0 ? occupiedSlotsCopy[occupiedSlotsCopy.length - 1].slotId : null;
                      const isLatest = meta && meta.slotId === latestSlotId;

                      return (
                        <div 
                          key={slotId} 
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all border gap-3 ${
                            isLatest 
                              ? "bg-emerald-950/10 border-emerald-500/20 hover:bg-emerald-950/15" 
                              : "bg-neutral-900/60 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-800"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-sans">
                              <span className={`w-4 h-4 rounded font-bold font-mono text-[9px] flex items-center justify-center ${
                                isLatest ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-neutral-850 text-neutral-400 border border-neutral-800"
                              }`}>
                                {slotId}
                              </span>
                              <span className="font-bold text-neutral-200 truncate max-w-[170px]" title={meta?.projectName}>
                                {meta ? meta.projectName : "Empty Local Slot"}
                              </span>
                              {isLatest && (
                                <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1 py-0.5 rounded-md shrink-0">
                                  Latest
                                </span>
                              )}
                            </div>
                            {meta ? (
                              <div className="text-[10px] text-neutral-400 mt-1 font-medium font-mono flex flex-col gap-0.5">
                                <span className="flex items-center gap-1"><Clock size={9} className="text-neutral-500" /> {meta.timestamp}</span>
                                <span className="text-[9px] text-neutral-500 font-bold ml-3.5">
                                  {meta.savedSceneCount} scene(s) • {meta.gameFlagCount} flag(s)
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-500 italic mt-0.5 ml-5">
                                Ready for quick checkpoint save
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Save here button */}
                            <button
                              onClick={() => handleSaveToSlot(slotId)}
                              className={`p-1 px-2 rounded-lg border transition-all font-bold text-[10px] active:scale-95 ${
                                isLatest
                                  ? "bg-neutral-900 hover:bg-emerald-500/25 text-emerald-400 border-neutral-850 hover:border-emerald-500/30"
                                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-350 border-neutral-700/60"
                              }`}
                              title={`Save current project and overrides to Slot ${slotId}`}
                            >
                              Save
                            </button>
                            
                            {meta && (
                              <>
                                {/* Load button */}
                                <button
                                  onClick={() => {
                                    handleLoadFromSlot(slotId);
                                    setIsBackupMenuOpen(false);
                                  }}
                                  className="p-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-bold text-[10px] active:scale-95"
                                  title={`Load and restore the project version from Slot ${slotId}`}
                                >
                                  Load
                                </button>
                                {/* Clear/Delete button */}
                                <button
                                  onClick={() => handleDeleteSlot(slotId)}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-850 rounded-lg transition-all"
                                  title={`Clear Slot ${slotId}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAIAssistant((prev) => !prev)}
            className={`studio-ai-button flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${showAIAssistant ? "is-active" : ""}`}
          >
            <Bot size={16} />
            <span className="hidden xl:inline">Oracle</span>
          </button>
        </div>
      </header>

      <StudioWorkflowNav
        editorMode={editorMode}
        isPlaying={isPlaying}
        onModeChange={setEditorMode}
        onTogglePlay={togglePlayMode}
        onExport={handleExport}
      />

      <div className="flex flex-1 overflow-hidden">
        {(editorMode === "stage" || editorMode === "ui_stage") && (
          <>
            {/* Left Sidebar */}
            <aside
              className="bg-neutral-900 border-r border-neutral-800 flex flex-col relative flex-shrink-0"
              style={{ width: leftSidebarWidth }}
            >
              <div
                className="absolute top-0 bottom-0 -right-[3px] w-[6px] cursor-col-resize z-[100] hover:bg-emerald-500/50"
                onPointerDown={() =>
                  document.body.classList.add("resizing-left-sidebar")
                }
              />
              <div className="flex border-b border-neutral-800 bg-neutral-950">
                <button
                  onClick={() => setLeftSidebarTab("librarian")}
                  className={`flex-1 p-2 text-[11px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${leftSidebarTab === "librarian" ? "text-indigo-400 border-b-2 border-indigo-500 bg-neutral-900" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                >
                  <ImageIcon size={14} /> Library
                </button>
                <button
                  onClick={() => setLeftSidebarTab("theme")}
                  className={`flex-1 p-2 text-[11px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${leftSidebarTab === "theme" ? "text-indigo-400 border-b-2 border-indigo-500 bg-neutral-900" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                >
                  <Palette size={14} /> Theme
                </button>
              </div>

              {leftSidebarTab === "librarian" && (
                <>
                  <div className="p-2 border-b border-neutral-800 flex flex-col gap-2 bg-neutral-900">
                    <div className="flex flex-wrap gap-1 justify-between w-full">
                      <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex-1 cursor-pointer text-xs bg-emerald-600 border border-emerald-500 text-white font-bold px-1.5 py-1 rounded hover:bg-emerald-500 flex items-center justify-center gap-1 shadow-lg shrink-0"
                      >
                        <Wand2 size={12} /> AI Make
                      </button>
                      <button
                        onClick={fetchFromGitHub}
                        disabled={isFetchingGithub}
                        className="flex-1 cursor-pointer text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-1 rounded hover:bg-indigo-500/30 disabled:opacity-50 shrink-0"
                      >
                        {isFetchingGithub ? "Sync..." : "GH Sync"}
                      </button>
                      <button
                        onClick={() => {
                          const inUse = new Set([
                            ...project.scenes.flatMap((s) =>
                              s.objects.map((o) => o.src),
                            ),
                            ...project.uiMenus.flatMap((s) =>
                              s.objects.map((o) => o.src),
                            ),
                            ...project.inventoryItems
                              .map((i) =>
                                i.iconAssetId
                                  ? project.assets.find(
                                      (a) => a.id === i.iconAssetId,
                                    )?.src
                                  : null,
                              )
                              .filter(Boolean),
                          ]);
                          setProject((p) => ({
                            ...p,
                            assets: p.assets.filter(
                              (a) =>
                                !a.src.startsWith("data:") || inUse.has(a.src),
                            ),
                          }));
                          showError(
                            "Unused base64 assets removed to save space.",
                          );
                        }}
                        className="flex-1 cursor-pointer text-[10px] uppercase font-bold bg-red-500/20 text-red-400 px-1.5 py-1 rounded hover:bg-red-500/30 ring-1 ring-red-500/50 hover:ring-red-500 shrink-0"
                        title="Remove unused local assets to fix export size"
                      >
                        Purge B64
                      </button>
                      <label
                        className="flex-1 text-center cursor-pointer text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-1 rounded hover:bg-emerald-500/30 ring-1 ring-emerald-500/50 hover:ring-emerald-500 shrink-0"
                        title="Upload a folder of assets"
                      >
                        Folder
                        <input
                          type="file"
                          className="hidden"
                          {...({ webkitdirectory: "true" } as any)}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            const newAssets: Asset[] = [];
                            const promises = Array.from(files).map(
                              (file: File) => {
                                return new Promise<void>((resolve) => {
                                  const isAudio =
                                    file.type.startsWith("audio/");
                                  const isImage =
                                    file.type.startsWith("image/");
                                  const isVideo =
                                    file.type.startsWith("video/");
                                  if (!isAudio && !isImage && !isVideo) {
                                    resolve();
                                    return;
                                  }

                                  const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
                                  if (file.size > MAX_SIZE) {
                                    showError(
                                      `File ${file.name} is too large. Max size is 5MB to prevent export crashes.`,
                                    );
                                    resolve();
                                    return;
                                  }

                                  let category = isAudio
                                    ? "audio"
                                    : isVideo
                                      ? "video"
                                      : "unsorted";
                                  // Need any here because webkitRelativePath is missing from basic React File types
                                  const pathParts = (file as any)
                                    .webkitRelativePath
                                    ? (file as any).webkitRelativePath.split(
                                        "/",
                                      )
                                    : [];
                                  if (pathParts.length > 2) {
                                    category =
                                      pathParts[pathParts.length - 2] ||
                                      category;
                                  } else if (pathParts.length === 2) {
                                    category = pathParts[0];
                                  }

                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const src = ev.target?.result as string;
                                    newAssets.push({
                                      id: uuidv4(),
                                      type: isAudio
                                        ? "audio"
                                        : isVideo
                                          ? "video"
                                          : "image",
                                      category,
                                      src,
                                      name: file.name,
                                    });
                                    resolve();
                                  };
                                  reader.onerror = () => resolve();
                                  reader.readAsDataURL(file);
                                });
                              },
                            );

                            await Promise.all(promises);
                            if (newAssets.length > 0) {
                              setProject((p) => ({
                                ...p,
                                assets: [...newAssets, ...p.assets],
                              }));
                            }
                          }}
                        />
                      </label>
                      <label
                        className="flex-1 text-center cursor-pointer text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-1 rounded hover:bg-emerald-500/30 ring-1 ring-emerald-500/50 hover:ring-emerald-500 shrink-0"
                        title="Upload one or more files"
                      >
                        Files
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          accept="image/*, audio/*, video/*"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            const newAssets: Asset[] = [];
                            const vibesToAnalyze: Asset[] = [];

                            const promises = Array.from(files).map(
                              (file: File) => {
                                return new Promise<void>((resolve) => {
                                  const isAudio =
                                    file.type.startsWith("audio/");
                                  const isImage =
                                    file.type.startsWith("image/");
                                  const isVideo =
                                    file.type.startsWith("video/");
                                  if (!isAudio && !isImage && !isVideo) {
                                    resolve();
                                    return;
                                  }

                                  const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
                                  if (file.size > MAX_SIZE) {
                                    showError(
                                      `File ${file.name} is too large. Max size is 5MB to prevent export crashes.`,
                                    );
                                    resolve();
                                    return;
                                  }

                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const src = ev.target?.result as string;
                                    const newAsset: Asset = {
                                      id: uuidv4(),
                                      type: isAudio
                                        ? "audio"
                                        : isVideo
                                          ? "video"
                                          : "image",
                                      category: isAudio
                                        ? "audio"
                                        : isVideo
                                          ? "video"
                                          : "unsorted",
                                      src,
                                      name: file.name,
                                    };
                                    newAssets.push(newAsset);
                                    if (isImage && files.length <= 5) {
                                      // Only auto-analyze if 5 or fewer files uploaded at once
                                      vibesToAnalyze.push(newAsset);
                                    }
                                    resolve();
                                  };
                                  reader.onerror = () => resolve();
                                  reader.readAsDataURL(file);
                                });
                              },
                            );

                            await Promise.all(promises);

                            if (newAssets.length > 0) {
                              setProject((p) => ({
                                ...p,
                                assets: [...newAssets, ...p.assets],
                              }));

                              // Analyze vibes in background
                              vibesToAnalyze.forEach(async (asset) => {
                                try {
                                  const vibe = await analyzeAssetVibe(
                                    asset.src,
                                  );
                                  setProject((p) => ({
                                    ...p,
                                    assets: p.assets.map((a) =>
                                      a.id === asset.id
                                        ? {
                                            ...a,
                                            description: vibe.description || "",
                                            tags: vibe.tags || [],
                                            category: (
                                              vibe.tags || []
                                            ).includes("background")
                                              ? "backgrounds"
                                              : "sprites",
                                          }
                                        : a,
                                    ),
                                  }));
                                } catch (err) {
                                  console.error("Vibe analysis failed", err);
                                }
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    <div className="mb-4 space-y-2">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-2 top-2.5 text-neutral-500"
                        />
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={assetSearch}
                          onChange={(e) => setAssetSearch(e.target.value)}
                          className="w-full bg-neutral-800 text-neutral-300 text-sm rounded-lg pl-8 pr-3 py-2 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Breadcrumb Navigation */}
                      <div className="flex items-center gap-1 text-sm text-neutral-400 overflow-x-auto pb-1 custom-scrollbar">
                        <button
                          onClick={() => {
                            setActiveBin("all");
                            setPage(1);
                          }}
                          className={`hover:text-white whitespace-nowrap ${activeBin === "all" ? "text-emerald-400 font-medium" : ""}`}
                        >
                          All
                        </button>
                        <span className="text-neutral-600">/</span>
                        <button
                          onClick={() => {
                            setActiveBin("");
                            setPage(1);
                          }}
                          className={`hover:text-white whitespace-nowrap ${activeBin === "" ? "text-emerald-400 font-medium" : ""}`}
                        >
                          Root
                        </button>
                        {activeBin !== "all" &&
                          activeBin !== "" &&
                          activeBin
                            .split("/")
                            .filter(Boolean)
                            .map((part, i, arr) => (
                              <React.Fragment key={i}>
                                <span className="text-neutral-600">/</span>
                                <button
                                  onClick={() => {
                                    setActiveBin(arr.slice(0, i + 1).join("/"));
                                    setPage(1);
                                  }}
                                  className={`hover:text-white whitespace-nowrap ${i === arr.length - 1 ? "text-emerald-400 font-medium" : ""}`}
                                >
                                  {part}
                                </button>
                              </React.Fragment>
                            ))}
                      </div>
                    </div>

                    {editorMode === "ui_stage" ? (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "panel",
                              name: "UI Panel",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Square size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Panel
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "button",
                              name: "UI Button",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <MousePointerClick
                            size={16}
                            className="text-emerald-400"
                          />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Button
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "progress",
                              name: "UI Progress",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Menu size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Progress
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "toggle",
                              name: "UI Toggle",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <ToggleRight size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Toggle
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "icon",
                              name: "UI Icon",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Star size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Icon
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "tooltip",
                              name: "UI Tooltip",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <MessageSquare
                            size={16}
                            className="text-emerald-400"
                          />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Tooltip
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "ui_element",
                              uiElementType: "selection",
                              name: "UI Selection Indicator",
                            })
                          }
                          className="h-16 p-2 border border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-grab hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Pointer size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200 uppercase">
                            Selection
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "text",
                              name: "Text",
                            })
                          }
                          className="p-2 border border-dashed border-indigo-500/50 bg-indigo-500/10 rounded-lg cursor-grab hover:bg-indigo-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Type size={16} className="text-indigo-400" />
                          <span className="text-sm font-medium text-indigo-200 uppercase">
                            Text
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-4">
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "hitbox",
                              name: "Clickable Area",
                            })
                          }
                          className="flex-1 p-2 border border-dashed border-red-500/50 bg-red-500/10 rounded-lg cursor-grab hover:bg-red-500/20 flex flex-col items-center justify-center gap-1 transition-colors text-center"
                        >
                          <Square size={16} className="text-red-400" />
                          <span className="text-sm font-medium text-red-200 uppercase leading-tight">
                            Clickable Area
                          </span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStartAsset(e, {
                              type: "text",
                              name: "Text",
                            })
                          }
                          className="flex-1 p-2 border border-dashed border-indigo-500/50 bg-indigo-500/10 rounded-lg cursor-grab hover:bg-indigo-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <Type size={16} className="text-indigo-400" />
                          <span className="text-sm font-medium text-indigo-200 uppercase">
                            Text
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subfolders */}
                    {activeBin !== "all" &&
                      (() => {
                        const allCategories = Array.from(
                          new Set<string>(
                            project.assets.map((a) => a.category || ""),
                          ),
                        );
                        const subfolders = new Set<string>();
                        allCategories.forEach((cat) => {
                          if (activeBin === "") {
                            if (cat && cat !== "root")
                              subfolders.add(cat.split("/")[0]);
                          } else if (cat.startsWith(activeBin + "/")) {
                            const remaining = cat.substring(
                              activeBin.length + 1,
                            );
                            if (remaining)
                              subfolders.add(remaining.split("/")[0]);
                          }
                        });
                        const folders = Array.from(subfolders)
                          .filter(Boolean)
                          .sort();

                        if (folders.length === 0) return null;

                        return (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {folders.map((sub) => (
                              <div
                                key={sub}
                                onClick={() => {
                                  setActiveBin(
                                    activeBin ? `${activeBin}/${sub}` : sub,
                                  );
                                  setPage(1);
                                }}
                                className="bg-neutral-800 border border-neutral-700/50 rounded-lg cursor-pointer hover:bg-neutral-700 p-2 flex items-center gap-2 transition-colors"
                              >
                                <Folder
                                  size={14}
                                  className="text-emerald-400 shrink-0"
                                />
                                <span className="text-sm text-neutral-300 truncate">
                                  {sub}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                    <div className="grid grid-cols-2 gap-3">
                      {project.assets
                        .filter((a) => {
                          if (assetSearch)
                            return a.name
                              .toLowerCase()
                              .includes(assetSearch.toLowerCase());
                          if (activeBin === "all") return true;
                          const cat = a.category === "root" ? "" : a.category;
                          return cat === activeBin;
                        })
                        .slice(0, page * ITEMS_PER_PAGE)
                        .map((asset) => (
                          <div
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStartAsset(e, asset)}
                            className="bg-neutral-800 rounded-lg shadow cursor-grab hover:ring-2 hover:ring-emerald-500/50 group relative flex flex-col hover:z-50"
                          >
                            <div className="h-40 bg-neutral-900 flex items-center justify-center p-2 relative group/info rounded-t-lg">
                              {asset.type === "script" ? (
                                <FileCode
                                  size={32}
                                  className="text-neutral-500"
                                />
                              ) : asset.type === "audio" ? (
                                <Music size={32} className="text-emerald-500" />
                              ) : asset.type === "video" ? (
                                <video
                                  src={asset.src || undefined}
                                  className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md group-hover:scale-150 transition-transform"
                                />
                              ) : (
                                <img
                                  src={asset.src || undefined}
                                  alt={asset.name}
                                  className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md group-hover:scale-150 transition-transform max-w-[200%] max-h-[200%]"
                                  loading="lazy"
                                />
                              )}
                              <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover/info:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInsertAssetToStage(asset);
                                  }}
                                  className="p-1.5 bg-neutral-950/80 hover:bg-emerald-500/80 text-white rounded"
                                  title="Quick Insert to Stage"
                                >
                                  <PlusCircle size={12} />
                                </button>
                                {asset.type === "image" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAssetId(asset.id);
                                    }}
                                    className="p-1.5 bg-neutral-950/80 hover:bg-emerald-500/80 text-white rounded"
                                    title="Edit Image"
                                  >
                                    <Wand2 size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPromptModal({
                                      isOpen: true,
                                      message: "Enter new folder name:",
                                      defaultValue: asset.category,
                                      onSubmit: (newCat) => {
                                        if (newCat) {
                                          const newProj = {
                                            ...project,
                                            assets: project.assets.map((a) =>
                                              a.id === asset.id
                                                ? {
                                                    ...a,
                                                    category: newCat as any,
                                                  }
                                                : a,
                                            ),
                                          };
                                          pushHistory(newProj);
                                        }
                                      },
                                    });
                                  }}
                                  className="p-1.5 bg-neutral-950/80 hover:bg-emerald-500/80 text-white rounded"
                                  title="Move to Folder"
                                >
                                  <FolderPlus size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="p-2 border-t border-neutral-700/50">
                              <span
                                className="text-sm text-neutral-300 truncate block font-medium"
                                title={asset.name}
                              >
                                {asset.name}
                              </span>
                              <span className="text-[8px] uppercase tracking-wider text-neutral-500 mt-0.5 block">
                                {asset.category}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {project.assets.filter(
                      (a) => activeBin === "all" || a.category === activeBin,
                    ).length >
                      page * ITEMS_PER_PAGE && (
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        className="w-full mt-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Load More
                      </button>
                    )}
                  </div>
                </>
              )}

              {leftSidebarTab === "theme" && (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <LayoutTemplate size={16} /> UI Theme Designer
                    </h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      Design the look of menus, dialogue boxes, and overlays.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-neutral-500 block mb-1">
                          Preset Themes
                        </label>
                        <select
                          value={project.globalSettings.uiTheme || "default"}
                          onChange={(e) => {
                            const theme = e.target.value as any;
                            const presets: Record<string, any> = {
                              default: {
                                primary: "#00ffff",
                                bg: "#1a0033",
                                radius: 0,
                                font: '"VT323", monospace',
                              },
                              minimalist: {
                                primary: "#000000",
                                bg: "rgba(255,255,255,0.95)",
                                radius: 0,
                                font: "Helvetica, Arial, sans-serif",
                              },
                              barbie: {
                                primary: "#ff69b4",
                                bg: "rgba(255, 228, 225, 0.9)",
                                radius: 24,
                                font: '"Comic Sans MS", cursive',
                              },
                              terminal: {
                                primary: "#00ff00",
                                bg: "rgba(0,0,0,0.9)",
                                radius: 0,
                                font: "monospace",
                              },
                              cyberpunk: {
                                primary: "#fcee0a",
                                bg: "rgba(0,0,0,0.85)",
                                radius: 0,
                                font: "Impact, sans-serif",
                              },
                              fantasy: {
                                primary: "#d4af37",
                                bg: "rgba(43, 27, 23, 0.9)",
                                radius: 12,
                                font: "Papyrus, fantasy",
                              },
                              retro: {
                                primary: "#ffffff",
                                bg: "rgba(0,0,170,0.9)",
                                radius: 0,
                                font: '"Press Start 2P", monospace',
                              },
                            };
                            const s = presets[theme];
                            pushHistory({
                              ...project,
                              globalSettings: {
                                ...project.globalSettings,
                                uiTheme: theme,
                                uiColorPrimary: s.primary,
                                uiColorBackground: s.bg,
                                uiBorderRadius: s.radius,
                                uiFontFamily: s.font,
                              },
                            });
                          }}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="default">Default Dark</option>
                          <option value="minimalist">Minimalist Light</option>
                          <option value="barbie">Barbie Core / Y2K</option>
                          <option value="terminal">Hacker Terminal</option>
                          <option value="cyberpunk">Cyberpunk Neon</option>
                          <option value="fantasy">Ancient / Fantasy</option>
                          <option value="retro">Retro 8-bit</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-neutral-500 block mb-1">
                          Accent (Primary) Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={
                              project.globalSettings.uiColorPrimary || "#10b981"
                            }
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                globalSettings: {
                                  ...project.globalSettings,
                                  uiColorPrimary: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={
                              project.globalSettings.uiColorPrimary || "#10b981"
                            }
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                globalSettings: {
                                  ...project.globalSettings,
                                  uiColorPrimary: e.target.value,
                                },
                              })
                            }
                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-neutral-500 block mb-1">
                          Background Color (RGBA)
                        </label>
                        <input
                          type="text"
                          value={
                            project.globalSettings.uiColorBackground ||
                            "rgba(0,0,0,0.8)"
                          }
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              globalSettings: {
                                ...project.globalSettings,
                                uiColorBackground: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-neutral-500 block mb-1">
                          Border Radius (px)
                        </label>
                        <input
                          type="number"
                          value={project.globalSettings.uiBorderRadius ?? 8}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              globalSettings: {
                                ...project.globalSettings,
                                uiBorderRadius: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-neutral-500 block mb-1">
                          Font Family
                        </label>
                        <select
                          value={
                            project.globalSettings.uiFontFamily || "sans-serif"
                          }
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              globalSettings: {
                                ...project.globalSettings,
                                uiFontFamily: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="sans-serif">System Sans-Serif</option>
                          <option value="serif">System Serif</option>
                          <option value="monospace">
                            Monospace / Terminal
                          </option>
                          <option value="Helvetica, Arial, sans-serif">
                            Helvetica / Arial
                          </option>
                          <option value="'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif">
                            Trebuchet MS
                          </option>
                          <option value="Verdana, Geneva, sans-serif">
                            Verdana
                          </option>
                          <option value="'Times New Roman', Times, serif">
                            Times New Roman
                          </option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="Garamond, serif">Garamond</option>
                          <option value='"Comic Sans MS", cursive'>
                            Comic Sans / Bubbly
                          </option>
                          <option value="'Brush Script MT', cursive">
                            Brush Script
                          </option>
                          <option value="Impact, sans-serif">
                            Impact / Heavy
                          </option>
                          <option value="Papyrus, fantasy">
                            Papyrus / Ancient
                          </option>
                          <option value='"Press Start 2P", monospace'>
                            8-Bit Pixel
                          </option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-neutral-800">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={!!project.globalSettings.customCss}
                            onChange={(e) => {
                              if (!e.target.checked) {
                                pushHistory({
                                  ...project,
                                  globalSettings: {
                                    ...project.globalSettings,
                                    customCss: undefined,
                                  },
                                });
                              } else {
                                pushHistory({
                                  ...project,
                                  globalSettings: {
                                    ...project.globalSettings,
                                    customCss: "/* Custom CSS Editor */\\n",
                                  },
                                });
                              }
                            }}
                          />
                          <span className="text-sm text-neutral-300">
                            Enable Custom CSS
                          </span>
                        </label>
                        {project.globalSettings.customCss !== undefined && (
                          <textarea
                            value={project.globalSettings.customCss}
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                globalSettings: {
                                  ...project.globalSettings,
                                  customCss: e.target.value,
                                },
                              })
                            }
                            className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-neutral-400 focus:text-neutral-200 outline-none custom-scrollbar"
                            placeholder="body { ... }"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* Center - Stage */}
            <main
              className="flex-1 bg-neutral-950 overflow-auto p-4 relative flex flex-col"
              onPointerDown={() => {
                if (isPlaying && selectedInventoryItemId) {
                  setSelectedInventoryItemId(null);
                  setPreviewDialogue(null);
                }
                setSelectedObjectId(null);
                setSelectedMultiIds([]);
              }}
              onContextMenu={(e) => {
                if (isPlaying && selectedInventoryItemId) {
                  e.preventDefault();
                  setSelectedInventoryItemId(null);
                  setPreviewDialogue(null);
                }
              }}
            >
              {/* Quick Edit Toggle for Canvas */}
              {(editorMode === "stage" || editorMode === "ui_stage") &&
                !isPlaying && (
                  <div
                    className="absolute z-[5000] flex bg-neutral-900 border border-neutral-700 p-1 rounded-lg shadow-2xl items-center gap-1"
                    style={{
                      top: quickEditPos ? undefined : "1rem",
                      left: quickEditPos ? undefined : "50%",
                      transform: quickEditPos ? "none" : "translate(-50%, 0)",
                      ...(quickEditPos && {
                        left: quickEditPos.x,
                        top: quickEditPos.y,
                      }),
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div
                      className="px-2 py-1 cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        // If there is no quickEditPos yet, initialize to its center-top position so it doesn't jump
                        const rect = (
                          e.currentTarget.parentElement as HTMLElement
                        ).getBoundingClientRect();
                        const parentRect = (
                          e.currentTarget.parentElement!
                            .parentElement as HTMLElement
                        ).getBoundingClientRect();
                        const startPos = quickEditPos || {
                          x: rect.left - parentRect.left,
                          y: rect.top - parentRect.top,
                        };
                        setQuickEditPos(startPos);
                        setQuickEditDragging({
                          startX: e.clientX,
                          startY: e.clientY,
                          startPos,
                        });
                      }}
                    >
                      <svg
                        width="12"
                        height="20"
                        viewBox="0 0 12 20"
                        fill="currentColor"
                      >
                        <circle cx="4" cy="4" r="1.5" />
                        <circle cx="4" cy="10" r="1.5" />
                        <circle cx="4" cy="16" r="1.5" />
                        <circle cx="8" cy="4" r="1.5" />
                        <circle cx="8" cy="10" r="1.5" />
                        <circle cx="8" cy="16" r="1.5" />
                      </svg>
                    </div>
                    <div
                      className={`flex items-center gap-2 rounded-md px-2 transition-all ${editorMode === "stage" ? "bg-indigo-600 text-white shadow-inner" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                    >
                      <span className="pointer-events-none whitespace-nowrap font-comic text-xs font-bold">
                        🎮 Scene
                      </span>
                      <select
                        className={`bg-neutral-950/55 outline-none px-2 py-1 text-xs font-bold w-32 cursor-pointer border border-white/10 rounded-sm ${editorMode === "stage" ? "text-white" : "text-neutral-300"}`}
                        value={project.currentSceneId}
                        onChange={(e) => {
                          setEditorMode("stage");
                          pushHistory({
                            ...project,
                            currentSceneId: e.target.value,
                          });
                        }}
                        onClick={() => setEditorMode("stage")}
                      >
                        {project.scenes.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-neutral-800 text-white"
                          >
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className={`flex items-center gap-2 rounded-md px-2 transition-all ${editorMode === "ui_stage" ? "bg-emerald-600 text-white shadow-inner" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                    >
                      <span className="pointer-events-none whitespace-nowrap font-comic text-xs font-bold">
                        ✨ UI
                      </span>
                      <select
                        className={`bg-neutral-950/55 outline-none px-2 py-1 text-xs font-bold w-28 cursor-pointer border border-white/10 rounded-sm ${editorMode === "ui_stage" ? "text-white" : "text-neutral-300"}`}
                        value={project.currentUiMenuId || ""}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setEditorMode("ui_stage");
                          pushHistory({
                            ...project,
                            currentUiMenuId: e.target.value,
                          });
                        }}
                        onClick={() => {
                          if (project.uiMenus?.length)
                            setEditorMode("ui_stage");
                        }}
                      >
                        {!project.uiMenus?.length && (
                          <option value="">No UI Menus</option>
                        )}
                        {(project.uiMenus || []).map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-neutral-800 text-white"
                          >
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setHideEditorHud(!hideEditorHud)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${
                        hideEditorHud
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 font-bold"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white hover:bg-neutral-700"
                      }`}
                      title={hideEditorHud ? "Show HUD Menus in Editor" : "Hide HUD Menus in Editor"}
                    >
                      {hideEditorHud ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{hideEditorHud ? "HUD: Hidden" : "HUD: Visible"}</span>
                    </button>
                  </div>
                )}

              <div
                className={`relative mx-auto my-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] shrink-0 overflow-visible ${isPlaying ? "border-transparent" : "border-neutral-800 border"}`}
                style={{
                  width: showDeviceFrame
                    ? deviceFrame!.outerWidth
                    : logicalStageWidth,
                  height: showDeviceFrame
                    ? deviceFrame!.outerHeight
                    : logicalStageHeight,
                  transform: `scale(${stageZoom})`,
                  transformOrigin: "center center",
                  cursor:
                    (isPlaying || true) &&
                    project.globalSettings.customCursorAssetId
                      ? `url('${project.assets.find((a) => a.id === project.globalSettings.customCursorAssetId)?.src}'), auto`
                      : undefined,
                }}
              >
                {/* Ghost Background Stage for UI Editing */}
                {editorMode === "ui_stage" &&
                  !isPlaying &&
                  (() => {
                    const bgScene =
                      project.scenes.find(
                        (s) => s.id === project.currentSceneId,
                      ) || project.scenes[0];
                    if (!bgScene) return null;
                    return (
                      <div
                        className="absolute pointer-events-none select-none opacity-80 z-0 ring-1 ring-neutral-700/50"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width:
                            bgScene.width ||
                            project.globalSettings.stageWidth ||
                            800,
                          height:
                            bgScene.height ||
                            project.globalSettings.stageHeight ||
                            600,
                          backgroundColor: bgScene.backgroundColor,
                          overflow: "hidden",
                        }}
                      >
                        {bgScene.objects
                          .sort((a, b) => a.zIndex - b.zIndex)
                          .map((obj) => (
                            <div
                              key={`ghost-bg-${obj.id}`}
                              className="absolute"
                              style={{
                                left: obj.x,
                                top: obj.y,
                                width: obj.width,
                                height: obj.height,
                                transform: `rotate(${obj.rotation}deg)`,
                              }}
                            >
                              {!obj.isUiElement &&
                                !obj.isHitbox &&
                                !obj.isText &&
                                (obj.isVideo ? (
                                  <video
                                    src={obj.src || undefined}
                                    className="w-full h-full object-fill opacity-50 pointer-events-none"
                                  />
                                ) : (
                                  <img
                                    src={obj.src || undefined}
                                    className="w-full h-full object-fill opacity-50 pointer-events-none"
                                  />
                                ))}
                            </div>
                          ))}
                      </div>
                    );
                  })()}

                <div
                  ref={stageRef}
                  onDrop={handleDropOnStage}
                  onDragOver={handleStageDragOver}
                  onPointerDown={(e) => {
                    if (isPlaying) {
                      if (selectedInventoryItemId) {
                        setSelectedInventoryItemId(null);
                        setPreviewDialogue(null);
                      }
                      return;
                    }
                    e.stopPropagation();
                    try {
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    } catch (err) {}
                    const rect = stageRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    if (!e.shiftKey) {
                      setSelectedObjectId(null);
                      setSelectedMultiIds([]);
                    }
                    setSelectionStart({ x, y });
                    setSelectionBox({ x, y, w: 0, h: 0 });
                  }}
                  onPointerMove={handleObjectPointerMove}
                  onPointerUp={(e) => {
                    handleObjectPointerUp(e);
                    try {
                      (e.target as HTMLElement).releasePointerCapture(
                        e.pointerId,
                      );
                    } catch (err) {}
                  }}
                  onContextMenu={(e) => {
                    if (isPlaying) {
                      if (selectedInventoryItemId) {
                        e.preventDefault();
                        setSelectedInventoryItemId(null);
                        setPreviewDialogue(null);
                      }
                      return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedObjectId(null);
                    setSelectedMultiIds([]);
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      objectId: null,
                    });
                  }}
                  className={`absolute shadow-2xl transition-all overflow-visible ${editorMode === "ui_stage" ? "ring-4 ring-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.2)]" : "ring-2 ring-pink-500 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10"}`}
                  style={{
                    left: showDeviceFrame ? deviceFrame!.screen.x : 0,
                    top: showDeviceFrame ? deviceFrame!.screen.y : 0,
                    width: logicalStageWidth,
                    height: logicalStageHeight,
                    transform: showDeviceFrame
                      ? `scale(${deviceFrame!.screen.width / logicalStageWidth}, ${deviceFrame!.screen.height / logicalStageHeight})`
                      : undefined,
                    transformOrigin: "top left",
                    backgroundColor: currentScene.backgroundColor,
                    backgroundImage: project.globalSettings.snapToGrid
                      ? `linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px)`
                      : "none",
                    backgroundSize: `${project.globalSettings.gridSize || 32}px ${project.globalSettings.gridSize || 32}px`,
                    filter:
                      isPlaying && project.globalSettings.useDayNightCycle
                        ? gameTime > 18 || gameTime < 6
                          ? "brightness(0.5) sepia(0.3) hue-rotate(180deg)"
                          : gameTime > 16
                            ? "brightness(0.8) sepia(0.5) hue-rotate(-20deg)"
                            : "brightness(1)"
                        : "none",
                    transition: "filter 2s ease",
                  }}
                >
                  <div
                    className={`absolute inset-0 ${isPlaying ? "overflow-hidden" : "overflow-visible"} pointer-events-none`}
                  >
                    <div className="absolute inset-0 pointer-events-auto">
                      {/* Draw selection box */}
                      {selectionBox && !isPlaying && (
                        <div
                          className="absolute border border-emerald-500 bg-emerald-500/20 pointer-events-none z-[9999]"
                          style={{
                            left:
                              selectionBox.w >= 0
                                ? selectionBox.x
                                : selectionBox.x + selectionBox.w,
                            top:
                              selectionBox.h >= 0
                                ? selectionBox.y
                                : selectionBox.y + selectionBox.h,
                            width: Math.abs(selectionBox.w),
                            height: Math.abs(selectionBox.h),
                          }}
                        />
                      )}

                      {/* Render Stage Objects */}
                      {currentScene.objects
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((obj) => {
                          if (isPlaying && collectedObjects.includes(obj.id))
                            return null;

                          // Evaluate Story Event Conditions
                          if (isPlaying) {
                            const currentFlags = Array.isArray(
                              project.gameFlags,
                            )
                              ? playerFlags
                              : [];
                            if (
                              obj.showIfFlag &&
                              !currentFlags.includes(obj.showIfFlag)
                            ) {
                              return null;
                            }
                            if (
                              obj.hideIfFlag &&
                              currentFlags.includes(obj.hideIfFlag)
                            ) {
                              return null;
                            }
                          }

                          const isSelected =
                            (obj.id === selectedObjectId ||
                              selectedMultiIds.includes(obj.id)) &&
                            !activeUiMenus.length;
                          const phys = physicsState[obj.id];
                          let renderX = phys ? phys.x : obj.x;
                          let renderY = phys ? phys.y : obj.y;
                          const renderRot = phys ? phys.rotation : obj.rotation;

                          if (isPlaying && runtimeOverrides[obj.id]) {
                            renderX = runtimeOverrides[obj.id].x;
                            renderY = runtimeOverrides[obj.id].y;
                          }

                          const stageW =
                            currentScene.width ||
                            project.globalSettings.stageWidth ||
                            800;
                          const stageH =
                            currentScene.height ||
                            project.globalSettings.stageHeight ||
                            600;

                          const isOutOfBounds =
                            !isPlaying &&
                            (renderX + obj.width < 0 ||
                              renderY + obj.height < 0 ||
                              renderX > stageW ||
                              renderY > stageH);

                          // Apply animation classes
                          let animClass = "";
                          let animStyle: React.CSSProperties = {};

                          if (isPlaying || isSelected) {
                            if (obj.animation === "glow") {
                              animClass =
                                "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]";
                            } else if (obj.animation !== "none") {
                              const duration =
                                obj.animationDuration ||
                                (obj.animation === "pulse"
                                  ? 2
                                  : obj.animation === "float"
                                    ? 3
                                    : 0.5);
                              const easing =
                                obj.animationEasing || "ease-in-out";
                              animStyle.animation = `${obj.animation} ${duration}s ${easing} infinite`;
                            }
                          }

                          const filterStr = [
                            obj.filters?.brightness !== undefined
                              ? `brightness(${obj.filters.brightness})`
                              : "",
                            obj.filters?.contrast !== undefined
                              ? `contrast(${obj.filters.contrast})`
                              : "",
                            obj.filters?.saturate !== undefined
                              ? `saturate(${obj.filters.saturate})`
                              : "",
                            obj.filters?.hueRotate !== undefined
                              ? `hue-rotate(${obj.filters.hueRotate}deg)`
                              : "",
                            obj.filters?.blur !== undefined
                              ? `blur(${obj.filters.blur}px)`
                              : "",
                            obj.filters?.sepia !== undefined
                              ? `sepia(${obj.filters.sepia})`
                              : "",
                            obj.filters?.invert !== undefined
                              ? `invert(${obj.filters.invert})`
                              : "",
                            obj.filters?.grayscale !== undefined
                              ? `grayscale(${obj.filters.grayscale})`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <div
                              key={obj.id}
                              onClick={() => {
                                const anyBlockingUi = activeUiMenus.some(
                                  (id) =>
                                    (project.uiMenus || []).find(
                                      (m) => m.id === id,
                                    )?.blocksClicks,
                                );
                                if (isPlaying && anyBlockingUi) return; // Disable base scene interactions if UI blocking clicks
                                handleObjectClick(obj);
                              }}
                              onPointerDown={(e) => {
                                const anyBlockingUi = activeUiMenus.some(
                                  (id) =>
                                    (project.uiMenus || []).find(
                                      (m) => m.id === id,
                                    )?.blocksClicks,
                                );
                                if (isPlaying && anyBlockingUi) return;
                                handleObjectPointerDown(e, obj);
                              }}
                              onPointerEnter={() => {
                                if (!isPlaying) return;
                                if (obj.triggerOnEnter === true) {
                                  if (
                                    obj.triggerOnce &&
                                    triggeredObjects.has(obj.id)
                                  )
                                    return;
                                  const anyBlockingUi = activeUiMenus.some(
                                    (id) =>
                                      (project.uiMenus || []).find(
                                        (m) => m.id === id,
                                      )?.blocksClicks,
                                  );
                                  if (anyBlockingUi) return;
                                  handleObjectClick(obj);
                                  if (obj.triggerOnce) {
                                    setTriggeredObjects((prev) =>
                                      new Set(prev).add(obj.id),
                                    );
                                  }
                                }
                              }}
                              onContextMenu={(e) => {
                                if (isPlaying) return;
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedObjectId(obj.id);
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  objectId: obj.id,
                                });
                              }}
                              onDoubleClick={(e) => {
                                if (isPlaying || obj.locked) return;
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedObjectId(obj.id);
                                setTimeout(() => {
                                  const input = document.getElementById("properties-name-input");
                                  if (input) {
                                    input.focus();
                                    (input as HTMLInputElement).select();
                                  }
                                }, 50);
                              }}
                              onPointerMove={handleObjectPointerMove}
                              onPointerUp={handleObjectPointerUp}
                              className={`absolute ${animClass} ${obj.customCssClasses || ""}`}
                              style={{
                                ...animStyle,
                                filter: filterStr || undefined,
                                left: obj.stretchToScreen ? 0 : renderX,
                                top: obj.stretchToScreen ? 0 : renderY,
                                width: obj.stretchToScreen ? "100%" : obj.width,
                                height: obj.stretchToScreen ? "100%" : obj.height,
                                zIndex: obj.zIndex,
                                opacity: obj.hidden
                                  ? (isPlaying ? 0 : 0.2)
                                  : isOutOfBounds
                                  ? (obj.opacity || 1) * 0.3
                                  : obj.opacity,
                                transform: `${
                                  isPlaying &&
                                  obj.parallaxSpeed !== undefined &&
                                  obj.parallaxSpeed !== 1
                                    ? `translate(${-mouseRatio.x * ((obj.parallaxSpeed - 1) * 50)}px, ${-mouseRatio.y * ((obj.parallaxSpeed - 1) * 50)}px) `
                                    : ""
                                }rotate(${renderRot}deg)`,
                                cursor: isPlaying
                                  ? activeUiMenus.some(
                                      (id) =>
                                        (project.uiMenus || []).find(
                                          (m) => m.id === id,
                                        )?.blocksClicks,
                                    )
                                    ? "default"
                                    : obj.cursor
                                  : obj.locked
                                    ? "default"
                                    : "move",
                                pointerEvents: obj.ignoreClicks
                                  ? "none"
                                  : undefined,
                                outline:
                                  isSelected && !isPlaying
                                    ? "2px solid #34d399"
                                    : "none",
                                outlineOffset: "2px",
                                backgroundColor:
                                  (obj.isHitbox || obj.opacity === 0) &&
                                  !isPlaying &&
                                  project.globalSettings.showGhostOutlines
                                    ? "rgba(239, 68, 68, 0.3)"
                                    : "rgba(255, 255, 255, 0.01)",
                                border:
                                  (obj.isHitbox || obj.opacity === 0) &&
                                  !isPlaying &&
                                  project.globalSettings.showGhostOutlines
                                    ? "1px dashed #ef4444"
                                    : "none",
                                mixBlendMode: obj.blendMode || "normal",
                              }}
                            >
                              {/* Smart Overlays (Editor only) */}
                              {!isPlaying && (
                                <div
                                  className="absolute top-0 right-0 -translate-y-[calc(100%+4px)] pointer-events-none flex flex-col gap-1 z-[1000] scale-100 origin-bottom-right"
                                  style={{
                                    // Inverse rotation so badges stay upright
                                    transform: `rotate(${-renderRot}deg)`,
                                  }}
                                >
                                  {obj.interaction === "scene_change" && (
                                    <div className="bg-blue-600/90 backdrop-blur border border-blue-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <ArrowRight size={10} /> To{" "}
                                      {project.scenes.find(
                                        (s) => s.id === obj.interactionData,
                                      )?.name || "Unknown"}
                                    </div>
                                  )}
                                  {obj.requireItemId && (
                                    <div className="bg-amber-600/90 backdrop-blur border border-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <Lock size={10} /> Req:{" "}
                                      {project.inventoryItems.find(
                                        (i) => i.id === obj.requireItemId,
                                      )?.name || "Unknown"}
                                    </div>
                                  )}

                                  {obj.interaction === "dialogue" && (
                                    <div className="bg-emerald-600/90 backdrop-blur border border-emerald-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <MessageSquare size={10} /> Dialogue
                                    </div>
                                  )}
                                  {obj.interaction === "play_cutscene" && (
                                    <div className="bg-blue-600/90 backdrop-blur border border-blue-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <Video size={10} /> Cutscene
                                    </div>
                                  )}
                                  {obj.interaction === "give-item" &&
                                    obj.giveItemId && (
                                      <div className="bg-purple-600/90 backdrop-blur border border-purple-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                        <Gift size={10} /> Gives:{" "}
                                        {project.inventoryItems?.find(
                                          (i) => i.id === obj.giveItemId,
                                        )?.name || "Unknown"}
                                      </div>
                                    )}
                                  {obj.interaction === "open_ui" &&
                                    obj.targetUiId && (
                                      <div className="bg-indigo-600/90 backdrop-blur border border-indigo-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                        <Eye size={10} /> Opens:{" "}
                                        {project.uiMenus?.find(
                                          (m) => m.id === obj.targetUiId,
                                        )?.name || "Unknown UI"}
                                      </div>
                                    )}
                                  {obj.isUiElement && obj.uiBindingId && (
                                    <div className="bg-indigo-600/90 backdrop-blur border border-indigo-400 text-white text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <Settings size={10} /> Bounds:{" "}
                                      {obj.uiBindingId}
                                    </div>
                                  )}
                                </div>
                              )}

                              {((!obj.isHitbox && obj.opacity !== 0) ||
                                ((obj.isHitbox || obj.opacity === 0) &&
                                  !isPlaying &&
                                  project.globalSettings.showGhostOutlines)) &&
                                !obj.isScript &&
                                !obj.isText && (
                                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {(obj.isHitbox || obj.opacity === 0) && (
                                      <span className="text-red-900/50 font-bold text-sm text-center leading-tight">
                                        {obj.opacity === 0 && !obj.isHitbox
                                          ? "GHOST"
                                          : "CLICK TARGET"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              {obj.isScript && !isPlaying && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-blue-500/20 border border-dashed border-blue-500 rounded">
                                  <FileCode
                                    size={24}
                                    className="text-blue-400"
                                  />
                                  <span className="text-blue-400 font-bold text-sm mt-1 truncate w-full text-center px-1">
                                    {obj.name}
                                  </span>
                                </div>
                              )}
                              {obj.isUiElement &&
                                (() => {
                                  const borderStyle =
                                    obj.uiBorderType === "none"
                                      ? "none"
                                      : obj.uiBorderType === "double"
                                        ? "4px double"
                                        : obj.uiBorderType === "bevel"
                                          ? "3px outset"
                                          : obj.uiBorderType === "dashed"
                                            ? "2px dashed"
                                            : obj.uiBorderType === "dotted"
                                              ? "2px dotted"
                                              : obj.uiBorderType === "inset"
                                                ? "3px inset"
                                                : obj.uiBorderType === "groove"
                                                  ? "3px groove"
                                                  : obj.uiBorderType === "ridge"
                                                    ? "3px ridge"
                                                    : "2px solid";

                                  if (obj.uiElementType === "panel") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none"
                                        style={{
                                          backgroundColor:
                                            obj.uiColorSecondary || "#171717",
                                          border: `${borderStyle} ${obj.uiColorPrimary || "#10b981"}`,
                                          borderRadius:
                                            obj.uiBorderRadius ??
                                            project.globalSettings
                                              .uiBorderRadius,
                                        }}
                                      />
                                    );
                                  }
                                  if (obj.uiElementType === "progress") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none overflow-hidden"
                                        style={{
                                          backgroundColor:
                                            obj.uiColorSecondary || "#171717",
                                          border: `${borderStyle} ${obj.uiColorPrimary || "#10b981"}`,
                                          borderRadius:
                                            obj.uiBorderRadius ??
                                            project.globalSettings
                                              .uiBorderRadius,
                                        }}
                                      >
                                        <div
                                          className="h-full transition-all"
                                          style={{
                                            width: `${Math.max(0, Math.min(100, obj.uiValue || 0))}%`,
                                            backgroundColor:
                                              obj.uiColorPrimary || "#10b981",
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                  if (obj.uiElementType === "button") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none flex items-center justify-center shadow-lg"
                                        style={{
                                          backgroundColor:
                                            obj.uiColorPrimary || "#10b981",
                                          color:
                                            obj.uiColorSecondary || "#ffffff",
                                          border: `${borderStyle} color-mix(in srgb, ${obj.uiColorPrimary || "#10b981"} 80%, black)`,
                                          borderRadius:
                                            obj.uiBorderRadius ??
                                            project.globalSettings
                                              .uiBorderRadius,
                                          fontFamily:
                                            project.globalSettings.uiFontFamily,
                                          fontSize: obj.textFontSize || 16,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {obj.textContent || "Button"}
                                      </div>
                                    );
                                  }
                                  if (obj.uiElementType === "icon") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none flex items-center justify-center"
                                        style={{
                                          color:
                                            obj.uiColorPrimary || "#10b981",
                                        }}
                                      >
                                        {obj.uiIconType === "bag" ? (
                                          <Backpack
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "sword" ? (
                                          <svg
                                            width={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                            height={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="m5 19-3 3" />
                                            <path d="m14 4-9 9" />
                                            <path
                                              d="M18 20c-1.1-.9-2-2-2-2L14 16l-4-4 2-2 4 4c0 0 1.1.9 2 2 .4.9 1 2 2 2 0 0 .1 0 .2.1C21.7 18.2 22 17 22 16s-.3-2.2-.8-2.1c-.1-.1-.1-.2-.2-.2-2 0-3.1-.6-4-1l-3.3-1.6c-.6-.3-1.3-.4-2-.2L9 11l-3 3-1-1 3-3-2-2L4 6 5 5l2 2 2 2 3-3 1 1-3 3 1.8 3.5c.2.6.3 1.3.2 2l-1.6 3.3c-.4.9-1 2-1 4 0 .1-.1.2-.2.2-1.1.5-2.3.2-2.3-.8S2.8 21 3.5 20c.1 0 .1.1.2.2 0 0 1.1.9 2.1 2z"
                                              opacity=".2"
                                            />
                                            <path d="M20 4 11 13" />
                                            <path d="m18 20-2-2" />
                                            <path d="m4 6 2 2" />
                                          </svg>
                                        ) : obj.uiIconType === "book" ? (
                                          <Book
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "gear" ? (
                                          <Settings
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "potion" ? (
                                          <svg
                                            width={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                            height={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M8 22h8" />
                                            <path d="M12 2v6" />
                                            <path d="M6 14v-2c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
                                          </svg>
                                        ) : obj.uiIconType === "key" ? (
                                          <Key
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "check" ? (
                                          <Check
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "cancel" ? (
                                          <X
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "arrow-left" ? (
                                          <ArrowLeft
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "arrow-right" ? (
                                          <ArrowRight
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : obj.uiIconType === "arrow-up" ? (
                                          <ArrowUp
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        ) : (
                                          <Star
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        )}
                                      </div>
                                    );
                                  }
                                  if (obj.uiElementType === "toggle") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none rounded-full flex items-center p-1 transition-colors relative"
                                        style={{
                                          backgroundColor: obj.uiChecked
                                            ? obj.uiColorPrimary || "#10b981"
                                            : obj.uiColorSecondary || "#525252",
                                        }}
                                      >
                                        <div
                                          className="bg-white rounded-full h-full aspect-square shadow-sm transition-transform absolute"
                                          style={{
                                            transform: obj.uiChecked
                                              ? `translateX(${obj.width - obj.height}px)`
                                              : "translateX(0)",
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                  if (obj.uiElementType === "tooltip") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none flex items-center justify-center p-2 shadow-lg relative"
                                        style={{
                                          backgroundColor:
                                            obj.uiColorSecondary || "#171717",
                                          color:
                                            obj.uiColorPrimary || "#ffffff",
                                          border: `1px solid ${obj.uiColorPrimary || "#10b981"}`,
                                          borderRadius:
                                            project.globalSettings
                                              .uiBorderRadius,
                                          fontFamily:
                                            project.globalSettings.uiFontFamily,
                                          fontSize: obj.textFontSize || 12,
                                        }}
                                      >
                                        {obj.textContent || "Tooltip"}
                                        <div
                                          className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-8 border-l-8 border-r-8 border-transparent"
                                          style={{
                                            borderTopColor:
                                              obj.uiColorPrimary || "#10b981",
                                            borderLeftColor: "transparent",
                                            borderRightColor: "transparent",
                                            borderBottomColor: "transparent",
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                  if (obj.uiElementType === "selection") {
                                    return (
                                      <div
                                        className="w-full h-full pointer-events-none flex items-center justify-center animate-pulse"
                                        style={{
                                          color:
                                            obj.uiColorPrimary || "#10b981",
                                        }}
                                      >
                                        <Pointer
                                          size={Math.min(obj.width, obj.height)}
                                        />
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              {!obj.isHitbox &&
                                !obj.isScript &&
                                !obj.isText &&
                                !obj.isUiElement &&
                                (obj.isVideo ? (
                                  <video
                                    src={obj.src || undefined}
                                    className={`w-full h-full pointer-events-none ${obj.objectFit === "contain" ? "object-contain" : obj.objectFit === "cover" ? "object-cover" : "object-fill"}`}
                                    autoPlay
                                    loop
                                    muted={!isPlaying}
                                    playsInline
                                    style={{
                                      transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={obj.src || undefined}
                                    alt={obj.name}
                                    className={`w-full h-full pointer-events-none ${obj.objectFit === "contain" ? "object-contain" : obj.objectFit === "cover" ? "object-cover" : "object-fill"}`}
                                    draggable={false}
                                    style={{
                                      transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                    }}
                                  />
                                ))}
                              {obj.isText &&
                                (() => {
                                  const txtBaseStyle: React.CSSProperties = {
                                    color: obj.textColor || "#ffffff",
                                    fontSize: `${obj.textFontSize || 16}px`,
                                    fontFamily:
                                      obj.textFontFamily || "sans-serif",
                                    fontWeight: obj.textWeight || "normal",
                                    letterSpacing: `${obj.textLetterSpacing || 0}px`,
                                    textShadow: obj.textShadow || "none",
                                    WebkitTextStroke: obj.textOutline
                                      ? `1px ${obj.textOutlineColor || "#000000"}`
                                      : "none",
                                    transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                    pointerEvents: "none",
                                  };

                                  const boxStyle: React.CSSProperties = {
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                      obj.textAlign === "left"
                                        ? "flex-start"
                                        : obj.textAlign === "right"
                                          ? "flex-end"
                                          : "center",
                                    textAlign: obj.textAlign || "center",
                                    overflow: "hidden",
                                    wordBreak: "break-word",
                                    lineHeight: obj.textLineHeight
                                      ? `${obj.textLineHeight}`
                                      : "1.2",
                                  };

                                  if (obj.textStyle === "narrative") {
                                    boxStyle.background = "rgba(0,0,0,0.8)";
                                    boxStyle.border = "2px solid #555";
                                    boxStyle.padding = "8px";
                                    boxStyle.borderRadius = "8px";
                                  } else if (obj.textStyle === "speech") {
                                    boxStyle.background = "#ffffff";
                                    txtBaseStyle.color =
                                      obj.textColor || "#000000";
                                    boxStyle.border = "2px solid #000";
                                    boxStyle.padding = "12px";
                                    boxStyle.borderRadius = "20px";
                                  } else if (obj.textStyle === "thought") {
                                    boxStyle.background = "#f0f0f0";
                                    txtBaseStyle.color =
                                      obj.textColor || "#000000";
                                    boxStyle.border = "2px dashed #aaa";
                                    boxStyle.borderRadius = "30px";
                                    boxStyle.padding = "10px";
                                  } else if (obj.textStyle === "sign") {
                                    boxStyle.background = "#8b5a2b";
                                    txtBaseStyle.color =
                                      obj.textColor || "#ffffff";
                                    boxStyle.border = "3px solid #5c3a21";
                                    boxStyle.borderRadius = "2px";
                                    boxStyle.padding = "4px";
                                    boxStyle.boxShadow =
                                      "2px 2px 5px rgba(0,0,0,0.5)";
                                  }

                                  return (
                                    <div style={boxStyle}>
                                      <span style={txtBaseStyle}>
                                        {obj.textContent}
                                      </span>
                                    </div>
                                  );
                                })()}

                              {/* Resize Handles (Simplified) */}
                              {isSelected && !isPlaying && !obj.locked && (
                                <>
                                  <div
                                    className="absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 bg-emerald-500 rounded-full cursor-grab hover:bg-emerald-400 flex items-center justify-center text-black active:cursor-grabbing shadow-lg transition-transform hover:scale-110"
                                    onPointerDown={(e) =>
                                      handleRotatePointerDown(e, obj)
                                    }
                                  >
                                    <RotateCw size={12} strokeWidth={3} />
                                  </div>
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-emerald-500 pointer-events-none" />
                                  {/* nw */}
                                  <div
                                    className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-500 rounded-full cursor-nw-resize shadow-md transition-transform hover:scale-110"
                                    onPointerDown={(e) =>
                                      handleResizePointerDown(e, obj, "nw")
                                    }
                                  />
                                  {/* ne */}
                                  <div
                                    className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full cursor-ne-resize shadow-md transition-transform hover:scale-110"
                                    onPointerDown={(e) =>
                                      handleResizePointerDown(e, obj, "ne")
                                    }
                                  />
                                  {/* sw */}
                                  <div
                                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-500 rounded-full cursor-sw-resize shadow-md transition-transform hover:scale-110"
                                    onPointerDown={(e) =>
                                      handleResizePointerDown(e, obj, "sw")
                                    }
                                  />
                                  {/* se */}
                                  <div
                                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full cursor-se-resize shadow-md transition-transform hover:scale-110"
                                    onPointerDown={(e) =>
                                      handleResizePointerDown(e, obj, "se")
                                    }
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Ghost Foreground UI for Stage Editing */}
                {editorMode === "stage" &&
                  !isPlaying &&
                  (project.uiMenus || [])
                    .filter((m) => m.isOpenByDefault)
                    .map((uiMenu, menuIndex) => (
                      <div
                        key={`ghost-fg-ui-${uiMenu.id}`}
                        className="absolute pointer-events-none select-none z-[500]"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width:
                            uiMenu.width ||
                            project.globalSettings.stageWidth ||
                            800,
                          height:
                            uiMenu.height ||
                            project.globalSettings.stageHeight ||
                            600,
                          overflow: "visible",
                        }}
                      >
                        {uiMenu.objects.map((obj) => (
                          <div
                            key={`ghost-fg-obj-${obj.id}`}
                            className="absolute border border-dashed border-emerald-500/30 opacity-60 mix-blend-screen pointer-events-none"
                            style={{
                              left: obj.x,
                              top: obj.y,
                              width: obj.width,
                              height: obj.height,
                              transform: `rotate(${obj.rotation}deg)`,
                            }}
                          >
                            <span className="absolute -top-4 left-0 text-[8px] text-emerald-400 bg-black/50 px-1 rounded truncate max-w-full">
                              {obj.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}

                {/* Render Active UI Menus */}
                {isPlaying &&
                  activeUiMenus.map((uiId, menuIndex) => {
                    const uiMenu = (project.uiMenus || []).find(
                      (m) => m.id === uiId,
                    );
                    if (!uiMenu) return null;

                    return (
                      <div
                        key={`ui-${uiId}-${menuIndex}`}
                        className={`absolute ${uiMenu.blocksClicks ? "pointer-events-auto" : "pointer-events-none"}`}
                        style={{
                          zIndex: 1000 + menuIndex,
                          backgroundColor: uiMenu.backgroundColor,
                          width:
                            uiMenu.width ||
                            project.globalSettings.stageWidth ||
                            800,
                          height:
                            uiMenu.height ||
                            project.globalSettings.stageHeight ||
                            600,
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          overflow: "visible",
                        }}
                      >
                        {uiMenu.objects
                          .sort((a, b) => a.zIndex - b.zIndex)
                          .map((obj) => {
                            if (isPlaying && collectedObjects.includes(obj.id))
                              return null;

                            // Evaluate Story Event Conditions
                            if (isPlaying) {
                              const currentFlags = Array.isArray(
                                project.gameFlags,
                              )
                                ? playerFlags
                                : [];
                              if (
                                obj.showIfFlag &&
                                !currentFlags.includes(obj.showIfFlag)
                              ) {
                                return null;
                              }
                              if (
                                obj.hideIfFlag &&
                                currentFlags.includes(obj.hideIfFlag)
                              ) {
                                return null;
                              }
                            }

                            // Compute rendering properties similarly to stage objects, but no physics
                            let renderX = obj.x;
                            let renderY = obj.y;
                            const renderRot = obj.rotation;

                            if (isPlaying && runtimeOverrides[obj.id]) {
                              renderX = runtimeOverrides[obj.id].x;
                              renderY = runtimeOverrides[obj.id].y;
                            }

                            let animClass = "";
                            let animStyle: React.CSSProperties = {};

                            if (obj.animation === "glow") {
                              animClass =
                                "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]";
                            } else if (obj.animation !== "none") {
                              const duration =
                                obj.animationDuration ||
                                (obj.animation === "pulse"
                                  ? 2
                                  : obj.animation === "float"
                                    ? 3
                                    : 0.5);
                              const easing =
                                obj.animationEasing || "ease-in-out";
                              animStyle.animation = `${obj.animation} ${duration}s ${easing} infinite`;
                            }

                            const filterStr = [
                              obj.filters?.brightness !== undefined
                                ? `brightness(${obj.filters.brightness})`
                                : "",
                              obj.filters?.contrast !== undefined
                                ? `contrast(${obj.filters.contrast})`
                                : "",
                              obj.filters?.saturate !== undefined
                                ? `saturate(${obj.filters.saturate})`
                                : "",
                              obj.filters?.hueRotate !== undefined
                                ? `hue-rotate(${obj.filters.hueRotate}deg)`
                                : "",
                              obj.filters?.blur !== undefined
                                ? `blur(${obj.filters.blur}px)`
                                : "",
                              obj.filters?.sepia !== undefined
                                ? `sepia(${obj.filters.sepia})`
                                : "",
                              obj.filters?.invert !== undefined
                                ? `invert(${obj.filters.invert})`
                                : "",
                              obj.filters?.grayscale !== undefined
                                ? `grayscale(${obj.filters.grayscale})`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ");

                            return (
                              <div
                                key={`ui-obj-${obj.id}`}
                                onClick={() => handleObjectClick(obj)}
                                onPointerDown={(e) =>
                                  handleObjectPointerDown(e, obj)
                                }
                                onPointerMove={handleObjectPointerMove}
                                onPointerUp={handleObjectPointerUp}
                                className={`absolute ${animClass}`}
                                style={{
                                  ...animStyle,
                                  filter: filterStr || undefined,
                                  left: obj.stretchToScreen ? 0 : renderX,
                                  top: obj.stretchToScreen ? 0 : renderY,
                                  width: obj.stretchToScreen ? "100%" : obj.width,
                                  height: obj.stretchToScreen ? "100%" : obj.height,
                                  zIndex: obj.zIndex,
                                  opacity: obj.hidden
                                    ? (isPlaying ? 0 : 0.2)
                                    : obj.opacity === 0 ? 0.01 : obj.opacity,
                                  transform: `rotate(${renderRot}deg)`,
                                  cursor: obj.cursor,
                                  backgroundColor: "rgba(255, 255, 255, 0.01)",
                                  mixBlendMode: obj.blendMode || "normal",
                                  pointerEvents: obj.ignoreClicks
                                    ? "none"
                                    : undefined,
                                }}
                              >
                                {obj.isUiElement &&
                                  (() => {
                                    const borderStyle =
                                      obj.uiBorderType === "none"
                                        ? "none"
                                        : obj.uiBorderType === "double"
                                          ? "4px double"
                                          : obj.uiBorderType === "bevel"
                                            ? "3px outset"
                                            : obj.uiBorderType === "dashed"
                                              ? "2px dashed"
                                              : obj.uiBorderType === "dotted"
                                                ? "2px dotted"
                                                : obj.uiBorderType === "inset"
                                                  ? "3px inset"
                                                  : obj.uiBorderType ===
                                                      "groove"
                                                    ? "3px groove"
                                                    : obj.uiBorderType ===
                                                        "ridge"
                                                      ? "3px ridge"
                                                      : "2px solid";

                                    let boundValue = obj.uiValue || 0;
                                    let boundChecked = obj.uiChecked || false;
                                    let boundText =
                                      obj.textContent ||
                                      (obj.uiElementType === "button"
                                        ? "Button"
                                        : "Tooltip");

                                    if (
                                      obj.uiBindingType === "need" &&
                                      obj.uiBindingId
                                    ) {
                                      boundValue =
                                        playerNeeds[obj.uiBindingId] || 0;
                                    } else if (
                                      obj.uiBindingType === "inventory_count" &&
                                      obj.uiBindingId
                                    ) {
                                      const count = playerInventory.filter(
                                        (id) => id === obj.uiBindingId,
                                      ).length;
                                      boundText = count > 0 ? `${count}` : "0";
                                    } else if (
                                      obj.uiBindingType === "flag" &&
                                      obj.uiBindingId
                                    ) {
                                      boundChecked = playerFlags.includes(
                                        obj.uiBindingId,
                                      );
                                    }

                                    if (obj.uiElementType === "panel") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none"
                                          style={{
                                            backgroundColor:
                                              obj.uiColorSecondary || "#171717",
                                            border: `${borderStyle} ${obj.uiColorPrimary || "#10b981"}`,
                                            borderRadius:
                                              obj.uiBorderRadius ??
                                              project.globalSettings
                                                .uiBorderRadius ??
                                              0,
                                          }}
                                        />
                                      );
                                    }
                                    if (obj.uiElementType === "progress") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none overflow-hidden"
                                          style={{
                                            backgroundColor:
                                              obj.uiColorSecondary || "#171717",
                                            border: `${borderStyle} ${obj.uiColorPrimary || "#10b981"}`,
                                            borderRadius:
                                              obj.uiBorderRadius ??
                                              project.globalSettings
                                                .uiBorderRadius ??
                                              0,
                                          }}
                                        >
                                          <div
                                            className="h-full transition-all"
                                            style={{
                                              width: `${Math.max(0, Math.min(100, boundValue))}%`,
                                              backgroundColor:
                                                obj.uiColorPrimary || "#10b981",
                                            }}
                                          />
                                        </div>
                                      );
                                    }
                                    if (obj.uiElementType === "button") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none flex items-center justify-center shadow-lg"
                                          style={{
                                            backgroundColor:
                                              obj.uiColorPrimary || "#10b981",
                                            color:
                                              obj.uiColorSecondary || "#ffffff",
                                            border: `${borderStyle} color-mix(in srgb, ${obj.uiColorPrimary || "#10b981"} 80%, black)`,
                                            borderRadius:
                                              obj.uiBorderRadius ??
                                              project.globalSettings
                                                .uiBorderRadius ??
                                              0,
                                            fontFamily:
                                              project.globalSettings
                                                .uiFontFamily,
                                            fontSize: obj.textFontSize || 16,
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {boundText}
                                        </div>
                                      );
                                    }
                                    if (obj.uiElementType === "icon") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none flex items-center justify-center"
                                          style={{
                                            color:
                                              obj.uiColorPrimary || "#10b981",
                                          }}
                                        >
                                          {obj.uiIconType === "bag" ? (
                                            <Backpack
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "sword" ? (
                                            <svg
                                              width={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                              height={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="m5 19-3 3" />
                                              <path d="m14 4-9 9" />
                                              <path
                                                d="M18 20c-1.1-.9-2-2-2-2L14 16l-4-4 2-2 4 4c0 0 1.1.9 2 2 .4.9 1 2 2 2 0 0 .1 0 .2.1C21.7 18.2 22 17 22 16s-.3-2.2-.8-2.1c-.1-.1-.1-.2-.2-.2-2 0-3.1-.6-4-1l-3.3-1.6c-.6-.3-1.3-.4-2-.2L9 11l-3 3-1-1 3-3-2-2L4 6 5 5l2 2 2 2 3-3 1 1-3 3 1.8 3.5c.2.6.3 1.3.2 2l-1.6 3.3c-.4.9-1 2-1 4 0 .1-.1.2-.2.2-1.1.5-2.3.2-2.3-.8S2.8 21 3.5 20c.1 0 .1.1.2.2 0 0 1.1.9 2.1 2z"
                                                opacity=".2"
                                              />
                                              <path d="M20 4 11 13" />
                                              <path d="m18 20-2-2" />
                                              <path d="m4 6 2 2" />
                                            </svg>
                                          ) : obj.uiIconType === "book" ? (
                                            <Book
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "gear" ? (
                                            <Settings
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "potion" ? (
                                            <svg
                                              width={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                              height={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="M8 22h8" />
                                              <path d="M12 2v6" />
                                              <path d="M6 14v-2c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
                                            </svg>
                                          ) : obj.uiIconType === "key" ? (
                                            <Key
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "check" ? (
                                            <Check
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "cancel" ? (
                                            <X
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType ===
                                            "arrow-left" ? (
                                            <ArrowLeft
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType ===
                                            "arrow-right" ? (
                                            <ArrowRight
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : obj.uiIconType === "arrow-up" ? (
                                            <ArrowUp
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          ) : (
                                            <Star
                                              size={Math.min(
                                                obj.width,
                                                obj.height,
                                              )}
                                            />
                                          )}
                                        </div>
                                      );
                                    }
                                    if (obj.uiElementType === "toggle") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none rounded-full flex items-center p-1 transition-colors relative"
                                          style={{
                                            backgroundColor: boundChecked
                                              ? obj.uiColorPrimary || "#10b981"
                                              : obj.uiColorSecondary ||
                                                "#525252",
                                          }}
                                        >
                                          <div
                                            className="bg-white rounded-full h-full aspect-square shadow-sm transition-transform absolute"
                                            style={{
                                              transform: boundChecked
                                                ? `translateX(${obj.width - obj.height}px)`
                                                : "translateX(0)",
                                            }}
                                          />
                                        </div>
                                      );
                                    }
                                    if (obj.uiElementType === "tooltip") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none flex items-center justify-center p-2 shadow-lg relative"
                                          style={{
                                            backgroundColor:
                                              obj.uiColorSecondary || "#171717",
                                            color:
                                              obj.uiColorPrimary || "#ffffff",
                                            border: `1px solid ${obj.uiColorPrimary || "#10b981"}`,
                                            borderRadius:
                                              project.globalSettings
                                                .uiBorderRadius,
                                            fontFamily:
                                              project.globalSettings
                                                .uiFontFamily,
                                            fontSize: obj.textFontSize || 12,
                                          }}
                                        >
                                          {boundText}
                                          <div
                                            className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-8 border-l-8 border-r-8 border-transparent"
                                            style={{
                                              borderTopColor:
                                                obj.uiColorPrimary || "#10b981",
                                              borderLeftColor: "transparent",
                                              borderRightColor: "transparent",
                                              borderBottomColor: "transparent",
                                            }}
                                          />
                                        </div>
                                      );
                                    }
                                    if (obj.uiElementType === "selection") {
                                      return (
                                        <div
                                          className="w-full h-full pointer-events-none flex items-center justify-center animate-pulse"
                                          style={{
                                            color:
                                              obj.uiColorPrimary || "#10b981",
                                          }}
                                        >
                                          <Pointer
                                            size={Math.min(
                                              obj.width,
                                              obj.height,
                                            )}
                                          />
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                {!obj.isHitbox &&
                                  !obj.isScript &&
                                  !obj.isText &&
                                  !obj.isUiElement &&
                                  (obj.isVideo ? (
                                    <video
                                      src={obj.src || undefined}
                                      className={`w-full h-full pointer-events-none ${obj.objectFit === "contain" ? "object-contain" : obj.objectFit === "cover" ? "object-cover" : "object-fill"}`}
                                      autoPlay
                                      loop
                                      muted={!isPlaying}
                                      playsInline
                                      style={{
                                        transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                      }}
                                    />
                                  ) : (
                                    <img
                                      src={obj.src || undefined}
                                      alt={obj.name}
                                      className={`w-full h-full pointer-events-none ${obj.objectFit === "contain" ? "object-contain" : obj.objectFit === "cover" ? "object-cover" : "object-fill"}`}
                                      draggable={false}
                                      style={{
                                        transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                      }}
                                    />
                                  ))}
                                {obj.isText &&
                                  (() => {
                                    const txtBaseStyle: React.CSSProperties = {
                                      color: obj.textColor || "#ffffff",
                                      fontSize: `${obj.textFontSize || 16}px`,
                                      fontFamily:
                                        obj.textFontFamily || "sans-serif",
                                      fontWeight: obj.textWeight || "normal",
                                      letterSpacing: `${obj.textLetterSpacing || 0}px`,
                                      textShadow: obj.textShadow || "none",
                                      WebkitTextStroke: obj.textOutline
                                        ? `1px ${obj.textOutlineColor || "#000000"}`
                                        : "none",
                                      transform: `scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1})`,
                                      pointerEvents: "none",
                                    };

                                    const boxStyle: React.CSSProperties = {
                                      width: "100%",
                                      height: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent:
                                        obj.textAlign === "left"
                                          ? "flex-start"
                                          : obj.textAlign === "right"
                                            ? "flex-end"
                                            : "center",
                                      textAlign: obj.textAlign || "center",
                                      overflow: "hidden",
                                      wordBreak: "break-word",
                                      lineHeight: obj.textLineHeight
                                        ? `${obj.textLineHeight}`
                                        : "1.2",
                                    };

                                    if (obj.textStyle === "narrative") {
                                      boxStyle.background = "rgba(0,0,0,0.8)";
                                      boxStyle.border = "2px solid #555";
                                      boxStyle.padding = "8px";
                                      boxStyle.borderRadius = "8px";
                                    } else if (obj.textStyle === "speech") {
                                      boxStyle.background = "#ffffff";
                                      txtBaseStyle.color =
                                        obj.textColor || "#000000";
                                      boxStyle.border = "2px solid #000";
                                      boxStyle.padding = "12px";
                                      boxStyle.borderRadius = "20px";
                                    } else if (obj.textStyle === "thought") {
                                      boxStyle.background = "#f0f0f0";
                                      txtBaseStyle.color =
                                        obj.textColor || "#000000";
                                      boxStyle.border = "2px dashed #aaa";
                                      boxStyle.borderRadius = "30px";
                                      boxStyle.padding = "10px";
                                    } else if (obj.textStyle === "sign") {
                                      boxStyle.background = "#8b5a2b";
                                      txtBaseStyle.color =
                                        obj.textColor || "#ffffff";
                                      boxStyle.border = "3px solid #5c3a21";
                                      boxStyle.borderRadius = "2px";
                                      boxStyle.padding = "4px";
                                      boxStyle.boxShadow =
                                        "2px 2px 5px rgba(0,0,0,0.5)";
                                    }

                                    return (
                                      <div style={boxStyle}>
                                        <span style={txtBaseStyle}>
                                          {obj.textContent}
                                        </span>
                                      </div>
                                    );
                                  })()}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                {/* Fullscreen Cutscene Player */}
                {isPlaying && activeCutscene && (
                  <div className="absolute inset-0 z-[1000] bg-black flex items-center justify-center">
                    <video
                      src={activeCutscene.src || undefined}
                      autoPlay
                      className="w-full h-full object-contain"
                      onEnded={() => {
                        if (activeCutscene.targetSceneId) {
                          const targetScene = project.scenes.find(
                            (s) => s.id === activeCutscene.targetSceneId,
                          );
                          if (targetScene) {
                            setTransition({ active: true, type: "fade" });
                            setTimeout(() => {
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  currentSceneId: targetScene.id,
                                },
                              }));
                              setTransition({ active: false, type: "fade" });
                            }, 1000);
                          }
                        }
                        setActiveCutscene(null);
                      }}
                    />
                    <button
                      onClick={() => {
                        if (activeCutscene.targetSceneId) {
                          const targetScene = project.scenes.find(
                            (s) => s.id === activeCutscene.targetSceneId,
                          );
                          if (targetScene) {
                            setTransition({ active: true, type: "fade" });
                            setTimeout(() => {
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  currentSceneId: targetScene.id,
                                },
                              }));
                              setTransition({ active: false, type: "fade" });
                            }, 1000);
                          }
                        }
                        setActiveCutscene(null);
                      }}
                      className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition backdrop-blur flex justify-center items-center gap-1"
                    >
                      Skip <ArrowRight size={10} />
                    </button>
                  </div>
                )}

                {/* Companions Render */}
                {isPlaying && (project.companions || [])
                  .filter(c => !c.requiredFlagId || playerFlags.includes(c.requiredFlagId))
                  .map((comp, idx) => {
                    const bubbleText = activeCompanionBubbles[comp.id];
                    return (
                      <div
                        key={`comp-${comp.id}`}
                        className="absolute bottom-4 z-[500] drop-shadow-xl hover:scale-105 transition-transform cursor-pointer flex flex-col items-center justify-end"
                        style={{
                          left: `${4 + (idx * 16)}%`, // Stagger them on bottom left
                          height: "30%" // Responsive height
                        }}
                        onClick={() => {
                          if (comp.dialogueTreeId) {
                            setActiveDialogue({ treeId: comp.dialogueTreeId, nodeId: "" });
                          }
                        }}
                      >
                        {bubbleText && (
                          <div className="absolute bottom-full mb-4 max-w-[200px] w-max bg-white border-2 border-slate-800 rounded-2xl p-3 text-slate-900 text-sm font-medium shadow-lg animate-bounce drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                            {bubbleText}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-800 rotate-45" />
                          </div>
                        )}
                        <img 
                          src={project.assets.find(a => a.id === comp.assetId)?.src || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                          alt={comp.name} 
                          className="h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"
                        />
                      </div>
                    );
                  })
                }

                {/* Preview Dialogue Box */}
                {isPlaying &&
                  previewDialogue &&
                  (() => {
                    const dPos =
                      project.globalSettings.dialoguePosition || "bottom";
                    let posClass = "bottom-8 left-1/2 -translate-x-1/2";
                    if (dPos === "top")
                      posClass = "top-8 left-1/2 -translate-x-1/2";
                    if (dPos === "center")
                      posClass =
                        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
                    if (dPos === "below")
                      posClass = "top-full mt-4 !left-0 !w-full !translate-x-0 !max-w-none";

                    return (
                      <div
                        onClick={() => setPreviewDialogue(null)}
                        className={`absolute ${posClass} overflow-y-auto custom-scrollbar shadow-2xl backdrop-blur-sm pointer-events-auto cursor-pointer drop-shadow-2xl hover:scale-[1.02] transition-transform z-[9000]`}
                        style={{
                          backgroundColor: `${uiBg}ee`,
                          border: `2px solid ${uiPrimary}80`,
                          borderRadius: uiRadius,
                          fontFamily: uiFont,
                          color: "#ffffff",
                          width: dPos === "below" ? "100%" : `${project.globalSettings.dialogueWidthPercent ?? 91.666}%`,
                          maxWidth: dPos === "below" ? (project.globalSettings.stageWidth || 800) : (project.globalSettings.dialogueMaxWidthPx ?? 672),
                          maxHeight: `${project.globalSettings.dialogueMaxHeightPercent ?? 90}%`,
                        }}
                      >
                        <div className="p-4 text-lg text-center font-medium drop-shadow-md">
                          <TypewriterText
                            text={previewDialogue}
                            speed={project.globalSettings.typewriterSpeed ?? 15}
                          />
                          <div className="text-sm text-white/50 mt-2 animate-pulse">
                            (Click to dismiss)
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* HUD Overlay Preview */}
                {(isPlaying || editorMode === "ui_stage") && project.globalSettings.hudOverlay?.assetId && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-[8500]"
                    style={{
                      backgroundImage: `url('${project.assets.find(a => a.id === project.globalSettings.hudOverlay?.assetId)?.src}')`,
                      backgroundSize: project.globalSettings.hudOverlay.position === "stretch" ? "100% 100%" : (project.globalSettings.hudOverlay.position ? "contain" : "100% 100%"),
                      backgroundPosition: (project.globalSettings.hudOverlay.position && project.globalSettings.hudOverlay.position !== "stretch") ? project.globalSettings.hudOverlay.position.replace("-", " ") : "center",
                      backgroundRepeat: "no-repeat",
                      transform: `scale(${project.globalSettings.hudOverlay.scale ?? 1}) translate(${project.globalSettings.hudOverlay.offsetX || 0}px, ${project.globalSettings.hudOverlay.offsetY || 0}px)`,
                      mixBlendMode: (project.globalSettings.hudOverlay.blendMode || "normal") as any,
                      opacity: project.globalSettings.hudOverlay.opacity ?? 1,
                      pointerEvents: project.globalSettings.hudOverlay.pointerEvents === "auto" ? "auto" : "none"
                    }}
                  />
                )}

                {transition.active && (
                  <div className="absolute inset-0 z-[1500] bg-black pointer-events-none animate-[fadeTransition_1s_ease-in-out]" />
                )}

                {/* Active Dialogue Tree Box */}
                {isPlaying &&
                  activeDialogue &&
                  (() => {
                    const tree = project.dialogueTrees.find(
                      (t) => t.id === activeDialogue.treeId,
                    );
                    const node = tree?.nodes.find(
                      (n) => n.id === activeDialogue.nodeId,
                    );
                    if (!node) return null;

                    const dPos =
                      project.globalSettings.dialoguePosition || "bottom";
                    let posClass = "bottom-8 left-1/2 -translate-x-1/2";
                    if (dPos === "top")
                      posClass = "top-8 left-1/2 -translate-x-1/2";
                    if (dPos === "center")
                      posClass =
                        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
                    if (dPos === "below")
                      posClass = "top-full mt-4 !left-0 !w-full !translate-x-0 !max-w-none";

                    const speakerAsset = node.speakerAssetId
                      ? project.assets.find((a) => a.id === node.speakerAssetId)
                      : null;

                    return (
                      <div
                        className={`absolute ${posClass} shrink-0 text-neutral-100 z-[9000] shadow-2xl flex flex-col overflow-hidden backdrop-blur-md filter drop-shadow-2xl dialogue-box`}
                        style={{
                          backgroundColor: `${uiBg}ee`,
                          border: `2px solid ${uiPrimary}80`,
                          borderRadius: uiRadius,
                          fontFamily: uiFont,
                          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px ${uiPrimary}40`,
                          width: dPos === "below" ? "100%" : `${project.globalSettings.dialogueWidthPercent ?? 91.666}%`,
                          maxWidth: dPos === "below" ? (project.globalSettings.stageWidth || 800) : (project.globalSettings.dialogueMaxWidthPx ?? 672),
                          maxHeight: `${project.globalSettings.dialogueMaxHeightPercent ?? 90}%`,
                        }}
                      >
                        <div
                          className="px-6 py-3 border-b font-bold tracking-wide shadow-sm dialogue-title"
                          style={{
                            backgroundColor: `rgba(0,0,0,0.3)`,
                            borderBottomColor: `${uiPrimary}50`,
                            color: uiPrimary,
                          }}
                        >
                          {node.speaker || "Unknown"}
                        </div>
                        <div className="flex shrink-0 p-6 overflow-y-auto custom-scrollbar dialogue-content">
                          {speakerAsset &&
                            (!node.portraitPosition ||
                              node.portraitPosition === "left") && (
                              <div
                                className="w-24 h-24 shrink-0 mr-6 rounded-lg overflow-hidden border shadow-inner p-1 flex items-center justify-center dialogue-portrait"
                                style={{
                                  borderColor: `${uiPrimary}40`,
                                  backgroundColor: `rgba(0,0,0,0.4)`,
                                }}
                              >
                                <img
                                  src={speakerAsset.src || undefined}
                                  alt={node.speaker}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            )}
                          <div className="text-lg font-medium leading-relaxed flex-1 text-white drop-shadow-sm self-center overflow-y-auto max-h-full custom-scrollbar dialogue-text">
                            <TypewriterText
                              text={node.text}
                              speed={
                                project.globalSettings.typewriterSpeed ?? 15
                              }
                            />
                          </div>
                          {speakerAsset &&
                            node.portraitPosition === "right" && (
                              <div
                                className="w-24 h-24 shrink-0 ml-6 rounded-lg overflow-hidden border shadow-inner p-1 flex items-center justify-center dialogue-portrait"
                                style={{
                                  borderColor: `${uiPrimary}40`,
                                  backgroundColor: `rgba(0,0,0,0.4)`,
                                }}
                              >
                                <img
                                  src={speakerAsset.src || undefined}
                                  alt={node.speaker}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            )}
                        </div>
                        <div
                          className="flex flex-col border-t relative dialogue-choices"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.2)",
                            borderTopColor: `${uiPrimary}50`,
                          }}
                        >
                          {node.choices.length > 0 ? (
                            node.choices
                              .filter((choice) => {
                                if (choice.requiredGameFlag && !playerFlags.includes(choice.requiredGameFlag)) return false;
                                if (choice.requiredSkillId && choice.requiredSkillId !== "none" && (playerSkills[choice.requiredSkillId] || 0) < (choice.requiredSkillValue || 0)) return false;
                                return true;
                              })
                              .map((choice) => (
                                <button
                                  key={choice.id}
                                  onClick={() => {
                                    if (
                                      choice.setGameFlag &&
                                      !playerFlags.includes(choice.setGameFlag)
                                    ) {
                                      setPlayerFlags((prev) => [
                                        ...prev,
                                        choice.setGameFlag!,
                                      ]);
                                    }
                                    if (
                                      choice.startQuestId &&
                                      !activeQuests.includes(
                                        choice.startQuestId,
                                      ) &&
                                      !completedQuests.includes(
                                        choice.startQuestId,
                                      )
                                    ) {
                                      setActiveQuests((prev) => [
                                        ...prev,
                                        choice.startQuestId!,
                                      ]);
                                      const questName =
                                        project.quests?.find(
                                          (q) => q.id === choice.startQuestId,
                                        )?.name || "Quest";
                                      setPreviewDialogue(
                                        `Started Quest: ${questName}`,
                                      );
                                    }
                                    if (
                                      choice.completeQuestId &&
                                      activeQuests.includes(
                                        choice.completeQuestId,
                                      )
                                    ) {
                                      setActiveQuests((prev) =>
                                        prev.filter(
                                          (id) => id !== choice.completeQuestId,
                                        ),
                                      );
                                      setCompletedQuests((prev) => [
                                        ...prev,
                                        choice.completeQuestId!,
                                      ]);
                                      const questName =
                                        project.quests?.find(
                                          (q) =>
                                            q.id === choice.completeQuestId,
                                        )?.name || "Quest";
                                      setPreviewDialogue(
                                        `Completed Quest: ${questName}`,
                                      );
                                    }

                                    if (choice.giveItemId) {
                                      setPlayerInventory((prev) => [
                                        ...prev,
                                        choice.giveItemId!,
                                      ]);
                                      const uiName =
                                        project.inventoryItems?.find(
                                          (i) => i.id === choice.giveItemId,
                                        )?.name;
                                      setPreviewDialogue(
                                        `You received: ${uiName || "an item"}`,
                                      );
                                    }
                                    if (
                                      choice.consumeItemId &&
                                      playerInventory.includes(
                                        choice.consumeItemId,
                                      )
                                    ) {
                                      setPlayerInventory((prev) => {
                                        const next = [...prev];
                                        const idx = next.indexOf(
                                          choice.consumeItemId!,
                                        );
                                        if (idx !== -1) next.splice(idx, 1);
                                        return next;
                                      });
                                    }
                                    if (choice.playSoundAssetId) {
                                      const sound = project.assets.find(
                                        (a) => a.id === choice.playSoundAssetId,
                                      );
                                      if (sound) {
                                        const mediaFragment = sound.trimStart || sound.trimEnd ? `#t=${sound.trimStart || 0}${sound.trimEnd ? ',' + sound.trimEnd : ''}` : '';
                                        const audio = new Audio(sound.src + mediaFragment);
                                        audio.volume = sound.volume ?? 1;
                                        audio.play().catch((e) => console.error(e));
                                      }
                                    }

                                    if (choice.timeCost) {
                                      setGameTime((prev) => (prev + (choice.timeCost || 0)) % 24);
                                    }

                                    if (choice.reputationEffect && choice.reputationEffect.factionId) {
                                      const effect = choice.reputationEffect;
                                      setPlayerFactions((prev) => ({
                                        ...prev,
                                        [effect.factionId]: Math.max(-100, Math.min(100, (prev[effect.factionId] || 0) + effect.value))
                                      }));
                                    }

                                    if (choice.needsEffect) {
                                      const nextNeeds = { ...playerNeeds };
                                      for (const [key, val] of Object.entries(choice.needsEffect) as [string, number][]) {
                                        nextNeeds[key] = Math.max(0, Math.min(100, (nextNeeds[key] || 0) + val));
                                      }
                                      setPlayerNeeds(nextNeeds);
                                    }

                                    if (choice.changeSceneId) {
                                      const targetScene = project.scenes.find(
                                        (s) => s.id === choice.changeSceneId,
                                      );
                                      if (targetScene) {
                                        setTransition({
                                          active: true,
                                          type: "fade",
                                        });
                                        setTimeout(() => {
                                          setProject((p) => ({
                                            ...p,
                                            currentSceneId: targetScene.id,
                                          }));
                                        }, 500);
                                        setTimeout(() => {
                                          setTransition({
                                            active: false,
                                            type: "fade",
                                          });
                                        }, 1000);
                                      }
                                    }

                                    if (choice.nextNodeId) {
                                      setActiveDialogue({
                                        treeId: tree!.id,
                                        nodeId: choice.nextNodeId,
                                      });
                                    } else {
                                      setActiveDialogue(null);
                                    }
                                  }}
                                  className="px-6 py-4 text-left transition-colors border-b last:border-b-0 group dialogue-choice"
                                  style={{
                                    borderBottomColor: `${uiPrimary}30`,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${uiPrimary}20`;
                                    e.currentTarget.style.color = uiPrimary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                    e.currentTarget.style.color = "#e5e5e5";
                                  }}
                                >
                                  <span className="inline-block transition-transform group-hover:translate-x-2 font-medium">
                                    ▸ {choice.text}
                                  </span>
                                </button>
                              ))
                          ) : (
                            <button
                              onClick={() => setActiveDialogue(null)}
                              className="px-6 py-4 text-center transition-colors font-medium group dialogue-choice"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${uiPrimary}20`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              style={{ color: uiPrimary }}
                            >
                              <span className="group-hover:tracking-wider transition-all">
                                Continue...
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* Inventory UI for Gameplay and Theme Preview */}
                {(isPlaying ||
                  !["dialogue", "items", "scenes"].includes(editorMode)) && (
                  <>
                    {/* Needs Tracker */}
                    {project.globalSettings.enableNeeds && (!hideEditorHud || isPlaying) && (
                      <div
                        onClick={() => {
                          if (!isPlaying) {
                            setSelectedObjectId(null);
                            setSelectedMultiIds([]);
                            setRightSidebarTab("properties");
                            window.dispatchEvent(new CustomEvent("open-accordion", { detail: { title: "Gameplay Settings" } }));
                          }
                        }}
                        className={`absolute top-4 right-4 z-[2000] p-3 shadow-xl backdrop-blur-md flex flex-col gap-2 transition-all ${
                          !isPlaying 
                            ? "cursor-pointer hover:ring-2 hover:ring-emerald-400 group/needs select-none" 
                            : ""
                        }`}
                        style={{
                          backgroundColor: `${uiBg}cc`,
                          border: `1px solid ${uiPrimary}80`,
                          borderRadius: uiRadius,
                          fontFamily: uiFont,
                          width: "150px",
                        }}
                      >
                        <div
                          className="text-sm font-bold mb-1 opacity-80"
                          style={{ color: uiPrimary }}
                        >
                          NEEDS
                        </div>
                        {(project.globalSettings.customNeeds?.length
                          ? project.globalSettings.customNeeds
                          : [
                              "rest",
                              "hunger",
                              "connection",
                              "spiritual",
                              "novelty",
                            ]
                        ).map((need) => (
                          <div key={need} className="flex flex-col gap-1">
                            <div
                              className="flex justify-between text-sm uppercase font-bold"
                              style={{ color: "#e5e5e5" }}
                            >
                              <span>{need}</span>
                              <span>{Math.floor(playerNeeds[need])}%</span>
                            </div>
                            <div
                              className="h-1.5 w-full overflow-hidden"
                              style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderRadius: "2px",
                              }}
                            >
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${Math.max(0, Math.min(100, playerNeeds[need]))}%`,
                                  backgroundColor: uiPrimary,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {project.globalSettings.useDayNightCycle && (
                          <div
                            className="mt-2 pt-2 border-t flex justify-between items-center text-sm font-bold"
                            style={{
                              borderColor: `${uiPrimary}40`,
                              color: "#e5e5e5",
                            }}
                          >
                            <span style={{ color: uiPrimary }}>TIME</span>
                            <span>
                              {Math.floor(gameTime).toString().padStart(2, "0")}
                              :
                              {Math.floor((gameTime % 1) * 60)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                        )}
                        {!isPlaying && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-neutral-950 font-bold scale-0 group-hover/needs:scale-100 transition-all text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none flex items-center gap-1">
                            <span>✏️ Click to Edit</span>
                          </div>
                        )}
                      </div>
                    )}
 
                    {/* Skills Tracker */}
                    {project.globalSettings.enableTTRPGStats && (!hideEditorHud || isPlaying) && (
                      <div
                        onClick={() => {
                          if (!isPlaying) {
                            setSelectedObjectId(null);
                            setSelectedMultiIds([]);
                            setRightSidebarTab("properties");
                            window.dispatchEvent(new CustomEvent("open-accordion", { detail: { title: "Gameplay Settings" } }));
                          }
                        }}
                        className={`absolute top-4 z-[2000] p-3 shadow-xl backdrop-blur-md flex flex-col gap-2 transition-all ${
                          !isPlaying 
                            ? "cursor-pointer hover:ring-2 hover:ring-emerald-400 group/skills select-none" 
                            : ""
                        }`}
                        style={{
                          right: project.globalSettings.enableNeeds && (!hideEditorHud || isPlaying)
                            ? "180px"
                            : "16px",
                          backgroundColor: `${uiBg}cc`,
                          border: `1px solid ${uiPrimary}80`,
                          borderRadius: uiRadius,
                          fontFamily: uiFont,
                          width: "150px",
                        }}
                      >
                        <div
                          className="text-sm font-bold mb-1 opacity-80"
                          style={{ color: uiPrimary }}
                        >
                          SKILLS
                        </div>
                        {(project.globalSettings.customSkills?.length
                          ? project.globalSettings.customSkills
                          : ["naturalist", "occultist", "scribal"]
                        ).map((skill) => (
                          <div key={skill} className="flex flex-col gap-1">
                            <div
                              className="flex justify-between text-sm uppercase font-bold"
                              style={{ color: "#e5e5e5" }}
                            >
                              <span>{skill}</span>
                              <span>{playerSkills[skill] || 0}</span>
                            </div>
                            <div
                              className="h-1.5 w-full overflow-hidden"
                              style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderRadius: "2px",
                              }}
                            >
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${Math.min(100, (playerSkills[skill] || 0) * 5)}%`,
                                  backgroundColor: uiPrimary,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {!isPlaying && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-neutral-950 font-bold scale-0 group-hover/skills:scale-100 transition-all text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none flex items-center gap-1">
                            <span>✏️ Click to Edit</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* HUD Button Bar */}
                    {(!hideEditorHud || isPlaying) && (
                      <div className="absolute bottom-4 right-4 flex items-end gap-2 z-[2000]">
                        {project.globalSettings.enableSettingsHud &&
                          !project.globalSettings.hideDefaultSettingsBtn && (
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setIsSettingsOpen(!isSettingsOpen);
                                } else {
                                  setSelectedObjectId(null);
                                  setSelectedMultiIds([]);
                                  setRightSidebarTab("properties");
                                  window.dispatchEvent(new CustomEvent("open-accordion", { detail: { title: "HUD & Built-in Action Buttons" } }));
                                }
                              }}
                              className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                              style={{
                                backgroundColor: `${uiBg}ee`,
                                borderColor: !isPlaying ? undefined : uiPrimary,
                                borderRadius: uiRadius,
                                color: !isPlaying ? "#34d399" : uiPrimary,
                              }}
                            >
                              <Settings size={20} />
                              <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {isPlaying ? "Settings" : "✏️ HUD Settings Btn"}
                              </span>
                            </button>
                          )}
                        {project.globalSettings.enableRelationshipsHud &&
                          !project.globalSettings.hideDefaultRelationshipsBtn && (
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setIsRelationshipsOpen(!isRelationshipsOpen);
                                } else {
                                  setSelectedObjectId(null);
                                  setSelectedMultiIds([]);
                                  setRightSidebarTab("properties");
                                  window.dispatchEvent(new CustomEvent("open-accordion", { detail: { title: "HUD & Built-in Action Buttons" } }));
                                }
                              }}
                              className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                              style={{
                                backgroundColor: `${uiBg}ee`,
                                borderColor: !isPlaying ? undefined : uiPrimary,
                                borderRadius: uiRadius,
                                color: !isPlaying ? "#34d399" : uiPrimary,
                              }}
                            >
                              <Users size={20} />
                              <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {isPlaying ? "Relationships" : "✏️ HUD Relationships Btn"}
                              </span>
                            </button>
                          )}
                        {project.globalSettings.enableAlmanacHud &&
                          !project.globalSettings.hideDefaultAlmanacBtn && (
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setIsAlmanacOpen(!isAlmanacOpen);
                                } else {
                                  setSelectedObjectId(null);
                                  setSelectedMultiIds([]);
                                  setRightSidebarTab("properties");
                                  window.dispatchEvent(new CustomEvent("open-accordion", { detail: { title: "HUD & Built-in Action Buttons" } }));
                                }
                              }}
                              className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                              style={{
                                backgroundColor: `${uiBg}ee`,
                                borderColor: !isPlaying ? undefined : uiPrimary,
                                borderRadius: uiRadius,
                                color: !isPlaying ? "#34d399" : uiPrimary,
                              }}
                            >
                              <FileText size={20} />
                              <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {isPlaying ? "Almanac" : "✏️ HUD Almanac Btn"}
                              </span>
                            </button>
                          )}
                        {project.globalSettings.enableSkillsHud &&
                          !project.globalSettings.enableTTRPGStats &&
                          !project.globalSettings.hideDefaultSkillsBtn && (
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setIsSkillsOpen(!isSkillsOpen);
                                } else {
                                  setEditorMode("rpg_systems");
                                }
                              }}
                              className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                              style={{
                                backgroundColor: `${uiBg}ee`,
                                borderColor: !isPlaying ? undefined : uiPrimary,
                                borderRadius: uiRadius,
                                color: !isPlaying ? "#34d399" : uiPrimary,
                              }}
                            >
                              <Zap size={20} />
                              <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {isPlaying ? "Skills" : "✏️ Edit RPG Skills"}
                              </span>
                            </button>
                          )}
                        {!project.globalSettings.hideDefaultQuestLogBtn && (
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                setIsQuestLogOpen(!isQuestLogOpen);
                              } else {
                                setEditorMode("rpg_systems");
                              }
                            }}
                            className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                            style={{
                              backgroundColor: `${uiBg}ee`,
                              borderColor: !isPlaying ? undefined : uiPrimary,
                              borderRadius: uiRadius,
                              color: !isPlaying ? "#34d399" : uiPrimary,
                            }}
                          >
                            <Book size={20} />
                            <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              {isPlaying ? "Quests" : "✏️ Edit RPG Quests"}
                            </span>
                          </button>
                        )}
                        {!project.globalSettings.hideDefaultCraftingBtn && (
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                setIsCraftingOpen(!isCraftingOpen);
                              } else {
                                setEditorMode("items");
                                setItemsTab("crafting");
                              }
                            }}
                            className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-[1.05] active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                            style={{
                              backgroundColor: `${uiBg}ee`,
                              borderColor: !isPlaying ? undefined : uiPrimary,
                              borderRadius: uiRadius,
                              color: !isPlaying ? "#34d399" : uiPrimary,
                            }}
                          >
                            <Hammer size={20} />
                            <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              {isPlaying ? "Crafting" : "✏️ Edit Crafting Recipes"}
                            </span>
                          </button>
                        )}
                        {(project.globalSettings.enableMapHud ||
                          (project.maps && project.maps.length > 0)) &&
                          !project.globalSettings.hideDefaultMapBtn && (
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  if (project.maps && project.maps.length > 0) {
                                    setActiveFastTravelMapId(project.maps[0].id);
                                  }
                                  setIsMapOpen(!isMapOpen);
                                } else {
                                  setEditorMode("map_maker");
                                }
                              }}
                              className={`w-12 h-12 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                              style={{
                                backgroundColor: `${uiBg}ee`,
                                borderColor: !isPlaying ? undefined : uiPrimary,
                                borderRadius: uiRadius,
                                color: !isPlaying ? "#34d399" : uiPrimary,
                              }}
                            >
                              <MapIcon size={20} />
                              <span className="absolute -top-8 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {isPlaying ? "Map" : "✏️ Edit Wilderness Maps"}
                              </span>
                            </button>
                          )}
                        {!project.globalSettings.hideDefaultInventoryBtn && (
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                setIsInventoryOpen(!isInventoryOpen);
                              } else {
                                setEditorMode("items");
                                setItemsTab("items");
                              }
                            }}
                            className={`w-14 h-14 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-[1.05] active:scale-95 border-2 hover:brightness-110 relative group ${!isPlaying ? "border-emerald-500/60" : ""}`}
                            style={{
                              backgroundColor: `${uiBg}ee`,
                              borderColor: !isPlaying ? undefined : uiPrimary,
                              borderRadius: uiRadius,
                              color: !isPlaying ? "#34d399" : uiPrimary,
                            }}
                          >
                            <div className="relative">
                              <Backpack size={24} />
                              {playerInventory.length > 0 && (
                                <div
                                  className="absolute -top-2 -right-2 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2"
                                  style={{
                                    backgroundColor: uiPrimary,
                                    borderColor: uiBg,
                                  }}
                                >
                                  {playerInventory.length}
                                </div>
                              )}
                            </div>
                            <span className="absolute -top-10 bg-black/85 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              {isPlaying ? "Inventory" : "✏️ Edit Items & Inventory"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Map Modal */}
                    {isMapOpen && activeFastTravelMapId && (
                      <div
                        className="absolute inset-0 bg-black/80 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsMapOpen(false)}
                      >
                        <div
                          className="max-w-4xl w-full h-[80%] flex flex-col shadow-2xl overflow-hidden border-2"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            borderRadius: uiRadius,
                            fontFamily: uiFont,
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b shrink-0 flex-col sm:flex-row gap-4"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <MapPin size={24} />
                              Fast Travel Map
                            </h2>
                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                              {project.maps.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => setActiveFastTravelMapId(m.id)}
                                  className={`px-3 py-1.5 rounded font-bold whitespace-nowrap transition-colors border`}
                                  style={{
                                    backgroundColor:
                                      activeFastTravelMapId === m.id
                                        ? "rgba(128,128,128,0.2)"
                                        : "transparent",
                                    borderColor:
                                      activeFastTravelMapId === m.id
                                        ? uiPrimary
                                        : "transparent",
                                    color:
                                      activeFastTravelMapId === m.id
                                        ? uiPrimary
                                        : "#e5e5e5",
                                  }}
                                >
                                  {m.name}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setIsMapOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100 transition-opacity absolute top-4 right-4 sm:relative sm:top-0 sm:right-0"
                            >
                              <X size={24} />
                            </button>
                          </div>

                          <div className="flex-1 relative overflow-auto bg-black bg-opacity-50">
                            {(() => {
                              const mapData = project.maps.find(
                                (m) => m.id === activeFastTravelMapId,
                              );
                              if (!mapData) return null;

                              return (
                                <div
                                  className="relative inline-block w-full"
                                  style={{
                                    minWidth: "800px", // arbitrary min size to ensure panning works if they want
                                  }}
                                >
                                  {mapData.backgroundSrc && (
                                    <img
                                      src={mapData.backgroundSrc}
                                      alt="Map Background"
                                      className="block w-full h-auto min-h-[400px] pointer-events-none"
                                    />
                                  )}
                                  {mapData.nodes.map((node) => {
                                    const isUnlocked =
                                      node.unlockedByDefault ||
                                      (node.requiredFlagId &&
                                        (playerFlags || []).includes(
                                          node.requiredFlagId,
                                        ));
                                    if (!isUnlocked) return null; // Hide locked nodes for mystery
                                    return (
                                      <div
                                        key={node.id}
                                        onClick={() => {
                                          if (node.targetSceneId) {
                                            setProject((p) => ({
                                              ...p,
                                              currentSceneId:
                                                node.targetSceneId as string,
                                            }));
                                            setIsMapOpen(false);
                                          }
                                        }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform z-10 hover:z-20
                                            ${node.targetSceneId ? "cursor-pointer hover:scale-110" : "cursor-default opacity-80"}
                                          `}
                                        style={{
                                          left: `${node.x}%`,
                                          top: `${node.y}%`,
                                        }}
                                      >
                                        <div
                                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform border-2
                                              ${node.targetSceneId ? "hover:brightness-125" : ""}
                                           `}
                                          style={{
                                            backgroundColor: uiBg,
                                            borderColor: uiPrimary,
                                            color: "#e5e5e5",
                                          }}
                                        >
                                          {node.iconSrc ? (
                                            <img
                                              src={node.iconSrc || undefined}
                                              alt={node.name}
                                              className="w-8 h-8 object-contain drop-shadow"
                                            />
                                          ) : (
                                            <MapPin className="w-6 h-6" />
                                          )}
                                        </div>
                                        <div
                                          className={`mt-1 px-3 py-1 rounded shadow-lg text-xs font-bold whitespace-nowrap bg-black/80 backdrop-blur-sm border`}
                                          style={{
                                            color: uiPrimary,
                                            borderColor: `${uiPrimary}40`,
                                          }}
                                        >
                                          {node.name}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inventory Modal */}
                    {isInventoryOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsInventoryOpen(false)}
                      >
                        <div
                          className="max-w-3xl w-full max-h-[80%] flex flex-col shadow-2xl overflow-hidden border-2"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            borderRadius: uiRadius,
                            fontFamily: uiFont,
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Backpack size={24} />
                              Inventory
                            </h2>
                            <button
                              onClick={() => setIsInventoryOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div
                            className="flex-1 overflow-y-auto p-6 custom-scrollbar"
                            style={{ color: "#e5e5e5" }}
                          >
                            {playerInventory.length === 0 ? (
                              <div
                                className="text-center py-12 flex flex-col items-center gap-4"
                                style={{ color: `${uiPrimary}80` }}
                              >
                                <PackageX size={48} className="opacity-50" />
                                <p>Your inventory is empty.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-12">
                                {playerInventory.map((itemId, idx) => {
                                  const item = project.inventoryItems.find(
                                    (i) => i.id === itemId,
                                  );
                                  if (!item) return null;
                                  const iconAsset = item.iconAssetId
                                    ? project.assets.find(
                                        (a) => a.id === item.iconAssetId,
                                      )
                                    : null;
                                  const isSelected =
                                    selectedInventoryItemId === itemId;
                                  const hasSelection =
                                    selectedInventoryItemId !== null;

                                  return (
                                    <div
                                      key={`${itemId}-${idx}`}
                                      className={`border overflow-hidden flex flex-col group transition-all cursor-pointer relative ${isSelected ? "scale-105 shadow-2xl ring-4 z-10" : ""}`}
                                      style={{
                                        backgroundColor: isSelected
                                          ? "rgba(0,0,0,0.6)"
                                          : "rgba(0,0,0,0.2)",
                                        borderColor: isSelected
                                          ? uiPrimary
                                          : `${uiPrimary}40`,
                                        borderRadius: uiRadius,
                                        boxShadow: isSelected
                                          ? `0 0 20px ${uiPrimary}80`
                                          : "none",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected) {
                                          e.currentTarget.style.borderColor =
                                            uiPrimary;
                                          e.currentTarget.style.backgroundColor =
                                            "rgba(0,0,0,0.4)";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected) {
                                          e.currentTarget.style.borderColor = `${uiPrimary}40`;
                                          e.currentTarget.style.backgroundColor =
                                            "rgba(0,0,0,0.2)";
                                        }
                                      }}
                                      onClick={() => {
                                        if (
                                          selectedInventoryItemId === itemId
                                        ) {
                                          // Deselect or do default inspect
                                          setSelectedInventoryItemId(null);
                                          setIsInventoryOpen(false);
                                          setPreviewDialogue(
                                            item.description
                                              ? `(Item): ${item.description}`
                                              : `You look at: ${item.name}.`,
                                          );
                                        } else if (
                                          selectedInventoryItemId &&
                                          selectedInventoryItemId !== itemId
                                        ) {
                                          // Try to combine
                                          const combination = (
                                            project.craftingRecipes || []
                                          ).find(
                                            (r) =>
                                              (r.ingredient1Id ===
                                                selectedInventoryItemId &&
                                                r.ingredient2Id === itemId) ||
                                              (r.ingredient1Id === itemId &&
                                                r.ingredient2Id ===
                                                  selectedInventoryItemId),
                                          );

                                          if (combination) {
                                            setPlayerInventory((prev) => {
                                              const next = [...prev];
                                              const ing1Id =
                                                combination.ingredient1Id;
                                              const ing2Id =
                                                combination.ingredient2Id;

                                              // Handle consumptions based on standard matching
                                              if (
                                                combination.destroyIngredient1
                                              ) {
                                                const idx =
                                                  next.indexOf(ing1Id);
                                                if (idx !== -1)
                                                  next.splice(idx, 1);
                                              }
                                              if (
                                                combination.destroyIngredient2
                                              ) {
                                                const idx =
                                                  next.indexOf(ing2Id);
                                                if (idx !== -1)
                                                  next.splice(idx, 1);
                                              }
                                              if (combination.resultItemId) {
                                                next.push(
                                                  combination.resultItemId,
                                                );
                                              }
                                              return next;
                                            });

                                            setSelectedInventoryItemId(null);
                                            setPreviewDialogue(
                                              combination.successMessage ||
                                                "Items combined successfully!",
                                            );
                                          } else {
                                            // Failed combination
                                            setPreviewDialogue(
                                              `These objects do not combine.`,
                                            );
                                            setSelectedInventoryItemId(null); // Deselect
                                          }
                                        } else {
                                          // Select the item
                                          setSelectedInventoryItemId(itemId);
                                        }
                                      }}
                                    >
                                      {isSelected && (
                                        <div
                                          className="absolute top-1 left-1 text-sm font-bold px-1.5 py-0.5 rounded shadow-lg backdrop-blur-md animate-pulse"
                                          style={{
                                            backgroundColor: uiPrimary,
                                            color: uiBg,
                                          }}
                                        >
                                          SELECTED
                                        </div>
                                      )}
                                      {hasSelection && !isSelected && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                          <div className="text-white font-bold text-sm bg-black/80 px-2 py-1 rounded shadow-lg">
                                            Combine?
                                          </div>
                                        </div>
                                      )}

                                      <div
                                        className="aspect-square flex items-center justify-center p-4 relative"
                                        style={{
                                          backgroundColor: "rgba(0,0,0,0.3)",
                                        }}
                                      >
                                        {iconAsset ? (
                                          <img
                                            src={iconAsset.src || undefined}
                                            alt={item.name}
                                            className={`w-full h-full object-contain drop-shadow-lg transition-transform ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                                            draggable="false"
                                          />
                                        ) : (
                                          <Backpack
                                            size={48}
                                            style={{ color: `${uiPrimary}40` }}
                                            className="group-hover:opacity-80 transition-opacity"
                                          />
                                        )}
                                      </div>
                                      <div
                                        className="p-3 border-t flex-1 flex flex-col"
                                        style={{
                                          borderTopColor: `${uiPrimary}20`,
                                        }}
                                      >
                                        <h3
                                          className="font-bold text-sm mb-1 leading-tight flex-1"
                                          style={{ color: uiPrimary }}
                                        >
                                          {item.name}
                                        </h3>
                                        <p
                                          className="text-sm line-clamp-3 leading-snug mb-2"
                                          style={{ color: "#a1a1aa" }}
                                        >
                                          {item.description}
                                        </p>

                                        {isSelected && item.isUsable && (
                                          <button
                                            className="w-full py-1.5 mt-auto text-sm font-bold rounded shadow-lg hover:brightness-125 transition-all active:scale-95"
                                            style={{
                                              backgroundColor: uiPrimary,
                                              color: uiBg,
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (item.consumeOnUse) {
                                                setPlayerInventory((prev) => {
                                                  const next = [...prev];
                                                  const idx = next.indexOf(
                                                    item.id,
                                                  );
                                                  if (idx !== -1)
                                                    next.splice(idx, 1);
                                                  return next;
                                                });
                                              }
                                              setIsInventoryOpen(false);
                                              setSelectedInventoryItemId(null);

                                              if (item.useSoundAssetId) {
                                                const sound =
                                                  project.assets.find(
                                                    (a) =>
                                                      a.id ===
                                                      item.useSoundAssetId,
                                                  );
                                                if (sound) {
                                                  const mediaFragment = sound.trimStart || sound.trimEnd ? `#t=${sound.trimStart || 0}${sound.trimEnd ? ',' + sound.trimEnd : ''}` : '';
                                                  const audio = new Audio(sound.src + mediaFragment);
                                                  audio.volume = sound.volume ?? 1;
                                                  audio
                                                    .play()
                                                    .catch((e) =>
                                                      console.error(
                                                        "Could not play sound",
                                                        e,
                                                      ),
                                                    );
                                                }
                                              }

                                              if (item.statRestores) {
                                                setPlayerNeeds((prev) => {
                                                  const next = { ...prev };
                                                  item.statRestores!.forEach(
                                                    (restore) => {
                                                      if (
                                                        next[restore.stat] !==
                                                        undefined
                                                      ) {
                                                        next[restore.stat] =
                                                          Math.min(
                                                            100,
                                                            next[restore.stat] +
                                                              restore.amount,
                                                          );
                                                      } else {
                                                        next[restore.stat] =
                                                          restore.amount;
                                                      }
                                                    },
                                                  );
                                                  return next;
                                                });
                                              }

                                              setPreviewDialogue(
                                                item.useMessage ||
                                                  `You used ${item.name}.`,
                                              );
                                            }}
                                          >
                                            USE ITEM
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Skills Modal */}
                    {isSkillsOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsSkillsOpen(false)}
                      >
                        <div
                          className="max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                            minHeight: "400px",
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Zap size={24} /> Skills & Abilities
                            </h2>
                            <button
                              onClick={() => setIsSkillsOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div className="p-6 overflow-y-auto space-y-4">
                            {(project.globalSettings.customSkills?.length
                              ? project.globalSettings.customSkills
                              : ["naturalist", "occultist", "scribal"]
                            ).length === 0 ? (
                              <p
                                className="opacity-50 text-center italic"
                                style={{ color: uiSecondary }}
                              >
                                No skills defined.
                              </p>
                            ) : (
                              (project.globalSettings.customSkills?.length
                                ? project.globalSettings.customSkills
                                : ["naturalist", "occultist", "scribal"]
                              ).map((skill) => (
                                <div
                                  key={skill}
                                  className="bg-black/20 p-4 rounded border"
                                  style={{ borderColor: `${uiPrimary}20` }}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span
                                      className="font-bold uppercase tracking-wider"
                                      style={{ color: uiPrimary }}
                                    >
                                      {skill}
                                    </span>
                                    <span
                                      className="font-mono text-xl"
                                      style={{ color: uiSecondary }}
                                    >
                                      {playerSkills[skill] || 0}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div
                                      className="h-full transition-all"
                                      style={{
                                        width: `${Math.min(100, (playerSkills[skill] || 0) * 5)}%`,
                                        backgroundColor: uiPrimary,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Almanac Modal */}
                    {isAlmanacOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsAlmanacOpen(false)}
                      >
                        <div
                          className="max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                            minHeight: "400px",
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <FileText size={24} /> Almanac / Logs
                            </h2>
                            <button
                              onClick={() => setIsAlmanacOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div className="p-6 overflow-y-auto space-y-4">
                            {(() => {
                              const availableLore = (
                                project.loreEntries || []
                              ).filter(
                                (e) =>
                                  !e.requiredFlagId ||
                                  playerFlags.includes(e.requiredFlagId),
                              );
                              if (availableLore.length === 0) {
                                return (
                                  <p
                                    className="opacity-50 text-center italic"
                                    style={{ color: uiSecondary }}
                                  >
                                    No log entries available.
                                  </p>
                                );
                              }
                              return availableLore.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="bg-black/20 p-4 rounded border space-y-2"
                                  style={{ borderColor: `${uiPrimary}20` }}
                                >
                                  <h3
                                    className="font-bold text-lg"
                                    style={{ color: uiPrimary }}
                                  >
                                    {entry.title}
                                  </h3>
                                  <p
                                    className="text-sm whitespace-pre-wrap"
                                    style={{ color: uiSecondary }}
                                  >
                                    {entry.content}
                                  </p>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Relationships Modal */}
                    {isRelationshipsOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsRelationshipsOpen(false)}
                      >
                        <div
                          className="max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                            minHeight: "400px",
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Users size={24} /> Relationships & Factions
                            </h2>
                            <button
                              onClick={() => setIsRelationshipsOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div className="p-6 overflow-y-auto space-y-4">
                            {!project.factions ||
                            project.factions.length === 0 ? (
                              <p
                                className="opacity-50 text-center italic"
                                style={{ color: uiSecondary }}
                              >
                                No known factions.
                              </p>
                            ) : (
                              project.factions.map((faction) => {
                                const affinity =
                                  playerFactions[faction.id] ??
                                  faction.defaultAffinity;
                                const isHostile = affinity < -20;
                                const isFriendly = affinity > 20;

                                return (
                                  <div
                                    key={faction.id}
                                    className="bg-black/20 p-4 rounded border flex flex-col gap-2"
                                    style={{ borderColor: `${uiPrimary}20` }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span
                                        className="font-bold text-lg"
                                        style={{ color: uiPrimary }}
                                      >
                                        {faction.name}
                                      </span>
                                      <span
                                        className="font-mono text-sm px-2 py-1 rounded-sm"
                                        style={{
                                          backgroundColor: isHostile
                                            ? "rgba(239, 68, 68, 0.2)"
                                            : isFriendly
                                              ? "rgba(16, 185, 129, 0.2)"
                                              : "rgba(156, 163, 175, 0.2)",
                                          color: isHostile
                                            ? "#ef4444"
                                            : isFriendly
                                              ? "#10b981"
                                              : "#9ca3af",
                                        }}
                                      >
                                        {affinity > 0
                                          ? `+${affinity}`
                                          : affinity}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                                      <div
                                        className="h-full bg-red-500 transition-all"
                                        style={{
                                          width: `${Math.max(0, -affinity)}%`,
                                        }}
                                      />
                                      <div
                                        className="h-full bg-neutral-600 transition-all"
                                        style={{
                                          width: `${100 - Math.abs(affinity)}%`,
                                        }}
                                      />
                                      <div
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{
                                          width: `${Math.max(0, affinity)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings Modal */}
                    {isSettingsOpen && (
                      <div
                        className="absolute inset-0 bg-black/80 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsSettingsOpen(false)}
                      >
                        <div
                          className="max-w-md w-full flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Settings size={24} /> System Settings
                            </h2>
                            <button
                              onClick={() => setIsSettingsOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div className="p-6 flex flex-col gap-4">
                            <button
                              onClick={() => {
                                handleObjectClick({
                                  id: "save",
                                  interaction: "save_game",
                                } as SceneObject);
                                setIsSettingsOpen(false);
                              }}
                              className="w-full py-2 bg-neutral-800/50 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors"
                              style={{ color: uiPrimary }}
                            >
                              Save Game
                            </button>
                            <button
                              onClick={() => {
                                handleObjectClick({
                                  id: "load",
                                  interaction: "load_game",
                                } as SceneObject);
                                setIsSettingsOpen(false);
                              }}
                              className="w-full py-2 bg-neutral-800/50 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors"
                              style={{ color: uiPrimary }}
                            >
                              Load Game
                            </button>

                            <div className="h-px bg-neutral-800 my-2" />

                            <div className="flex flex-col gap-2">
                              <label
                                className="text-sm font-bold uppercase tracking-wider"
                                style={{ color: uiSecondary }}
                              >
                                UI Color Theme
                              </label>
                              <input
                                type="color"
                                value={uiPrimary}
                                onChange={(e) =>
                                  setPlayerUiColor(e.target.value)
                                }
                                className="w-full h-10 rounded cursor-pointer border-none bg-transparent"
                              />
                              {playerUiColor && (
                                <button
                                  onClick={() => setPlayerUiColor(null)}
                                  className="text-xs hover:underline text-left mt-1"
                                  style={{ color: uiSecondary }}
                                >
                                  Reset to default
                                </button>
                              )}
                            </div>

                            <div className="h-px bg-neutral-800 my-2" />

                            <button
                              className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded border border-red-900/50 transition-colors mt-2"
                              onClick={() => {
                                setIsSettingsOpen(false);
                                setIsPlaying(false);
                              }}
                            >
                              Exit Game
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Crafting Modal */}
                    {isCraftingOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsCraftingOpen(false)}
                      >
                        <div
                          className="max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Backpack size={24} />
                              Crafting Station
                            </h2>
                            <button
                              onClick={() => setIsCraftingOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div className="p-6">
                            <p className="text-white/70 mb-4 text-center">
                              Select two items from your inventory to forge a
                              new item.
                            </p>
                            <div className="flex justify-center items-center gap-4 mb-6">
                              <div
                                className="w-24 h-24 border-2 rounded-lg flex flex-col items-center justify-center gap-2 relative bg-black/30"
                                style={{ borderColor: `${uiPrimary}40` }}
                              >
                                {craftSlot1 ? (
                                  <>
                                    <img
                                      src={
                                        project.assets.find(
                                          (a) =>
                                            a.id ===
                                            project.inventoryItems.find(
                                              (i) => i.id === craftSlot1,
                                            )?.iconAssetId,
                                        )?.src || undefined
                                      }
                                      alt="Slot 1"
                                      className="w-10 h-10 object-contain"
                                    />
                                    <button
                                      onClick={() => setCraftSlot1(null)}
                                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white shadow"
                                    >
                                      <X size={12} />
                                    </button>
                                    <div className="text-sm w-full text-center truncate px-1">
                                      {
                                        project.inventoryItems.find(
                                          (i) => i.id === craftSlot1,
                                        )?.name
                                      }
                                    </div>
                                  </>
                                ) : (
                                  <select
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value=""
                                    onChange={(e) =>
                                      setCraftSlot1(e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Select Item...
                                    </option>
                                    {playerInventory.map((itemId, idx) => {
                                      const item = project.inventoryItems.find(
                                        (i) => i.id === itemId,
                                      );
                                      if (!item || itemId === craftSlot2)
                                        return null;
                                      return (
                                        <option
                                          key={`${itemId}-${idx}`}
                                          value={itemId}
                                        >
                                          {item.name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                                {!craftSlot1 && (
                                  <div className="text-sm text-white/50 text-center pointer-events-none">
                                    Click to
                                    <br />
                                    Select Item
                                  </div>
                                )}
                              </div>
                              <div
                                className="text-2xl opacity-50"
                                style={{ color: uiPrimary }}
                              >
                                +
                              </div>
                              <div
                                className="w-24 h-24 border-2 rounded-lg flex flex-col items-center justify-center gap-2 relative bg-black/30"
                                style={{ borderColor: `${uiPrimary}40` }}
                              >
                                {craftSlot2 ? (
                                  <>
                                    <img
                                      src={
                                        project.assets.find(
                                          (a) =>
                                            a.id ===
                                            project.inventoryItems.find(
                                              (i) => i.id === craftSlot2,
                                            )?.iconAssetId,
                                        )?.src || undefined
                                      }
                                      alt="Slot 2"
                                      className="w-10 h-10 object-contain"
                                    />
                                    <button
                                      onClick={() => setCraftSlot2(null)}
                                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white shadow"
                                    >
                                      <X size={12} />
                                    </button>
                                    <div className="text-sm w-full text-center truncate px-1">
                                      {
                                        project.inventoryItems.find(
                                          (i) => i.id === craftSlot2,
                                        )?.name
                                      }
                                    </div>
                                  </>
                                ) : (
                                  <select
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value=""
                                    onChange={(e) =>
                                      setCraftSlot2(e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Select Item...
                                    </option>
                                    {playerInventory.map((itemId, idx) => {
                                      const item = project.inventoryItems.find(
                                        (i) => i.id === itemId,
                                      );
                                      if (!item || itemId === craftSlot1 || itemId === craftSlot3)
                                        return null;
                                      return (
                                        <option
                                          key={`${itemId}-${idx}`}
                                          value={itemId}
                                        >
                                          {item.name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                                {!craftSlot2 && (
                                  <div className="text-sm text-white/50 text-center pointer-events-none">
                                    Click to
                                    <br />
                                    Select Item
                                  </div>
                                )}
                              </div>
                              <div
                                className="text-2xl opacity-50"
                                style={{ color: uiPrimary }}
                              >
                                +
                              </div>
                              <div
                                className="w-24 h-24 border-2 rounded-lg flex flex-col items-center justify-center gap-2 relative bg-black/30"
                                style={{ borderColor: `${uiPrimary}40` }}
                              >
                                {craftSlot3 ? (
                                  <>
                                    <img
                                      src={
                                        project.assets.find(
                                          (a) =>
                                            a.id ===
                                            project.inventoryItems.find(
                                              (i) => i.id === craftSlot3,
                                            )?.iconAssetId,
                                        )?.src || undefined
                                      }
                                      alt="Slot 3"
                                      className="w-10 h-10 object-contain"
                                    />
                                    <button
                                      onClick={() => setCraftSlot3(null)}
                                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white shadow"
                                    >
                                      <X size={12} />
                                    </button>
                                    <div className="text-sm w-full text-center truncate px-1">
                                      {
                                        project.inventoryItems.find(
                                          (i) => i.id === craftSlot3,
                                        )?.name
                                      }
                                    </div>
                                  </>
                                ) : (
                                  <select
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value=""
                                    onChange={(e) =>
                                      setCraftSlot3(e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Select Item...
                                    </option>
                                    {playerInventory.map((itemId, idx) => {
                                      const item = project.inventoryItems.find(
                                        (i) => i.id === itemId,
                                      );
                                      if (!item || itemId === craftSlot1 || itemId === craftSlot2)
                                        return null;
                                      return (
                                        <option
                                          key={`${itemId}-${idx}`}
                                          value={itemId}
                                        >
                                          {item.name}
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                                {!craftSlot3 && (
                                  <div className="text-sm text-white/50 text-center pointer-events-none">
                                    Click to
                                    <br />
                                    Select Item
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-center flex-col items-center gap-3">
                              <button
                                className="px-8 py-3 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
                                style={{
                                  backgroundColor: uiPrimary,
                                  color: uiBg,
                                }}
                                disabled={!craftSlot1 && !craftSlot2 && !craftSlot3}
                                onClick={() => {
                                  const combination = (
                                    project.craftingRecipes || []
                                  ).find((r) => {
                                      const slotted = [craftSlot1, craftSlot2, craftSlot3].filter(Boolean) as string[];
                                      const req = [r.ingredient1Id, r.ingredient2Id];
                                      if (r.ingredient3Id) req.push(r.ingredient3Id);
                                      if (slotted.length !== req.length) return false;
                                      const sortedSlotted = [...slotted].sort();
                                      const sortedReq = [...req].sort();
                                      return JSON.stringify(sortedSlotted) === JSON.stringify(sortedReq);
                                  });

                                  if (combination) {
                                    setPlayerInventory((prev) => {
                                      const next = [...prev];
                                      
                                      const processIngredient = (id: string, destroy: boolean) => {
                                        if (destroy) {
                                          const idx = next.indexOf(id);
                                          if (idx !== -1) next.splice(idx, 1);
                                        }
                                      };
                                      
                                      processIngredient(combination.ingredient1Id, combination.destroyIngredient1);
                                      processIngredient(combination.ingredient2Id, combination.destroyIngredient2);
                                      if (combination.ingredient3Id) {
                                        processIngredient(combination.ingredient3Id, combination.destroyIngredient3 || false);
                                      }

                                      if (combination.resultItemId) {
                                        next.push(combination.resultItemId);
                                      }
                                      return next;
                                    });
                                    setCraftSlot1(null);
                                    setCraftSlot2(null);
                                    setCraftSlot3(null);
                                    setPreviewDialogue(
                                      combination.successMessage ||
                                        "Crafting successful!",
                                    );
                                    setIsCraftingOpen(false);
                                  } else {
                                    setPreviewDialogue(
                                      "Nothing happens... These items can't be combined.",
                                    );
                                  }
                                }}
                              >
                                CRAFT
                              </button>
                              <button
                                onClick={() => {
                                  setIsCraftingOpen(false);
                                  setIsInventoryOpen(true);
                                }}
                                className="text-sm text-white/50 hover:text-white transition-colors underline"
                              >
                                Open Backpack Instead
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quest Log Modal */}
                    {isQuestLogOpen && (
                      <div
                        className="absolute inset-0 bg-black/60 z-[2001] flex items-center justify-center p-8 backdrop-blur-sm"
                        onClick={() => setIsQuestLogOpen(false)}
                      >
                        <div
                          className="max-w-3xl w-full max-h-[80%] flex flex-col shadow-2xl overflow-hidden border-2 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: `${uiBg}ee`,
                            borderColor: `${uiPrimary}80`,
                            fontFamily: uiFont,
                          }}
                        >
                          <div
                            className="flex justify-between items-center p-4 border-b"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderBottomColor: `${uiPrimary}50`,
                            }}
                          >
                            <h2
                              className="text-xl font-bold flex items-center gap-2"
                              style={{ color: uiPrimary }}
                            >
                              <Book size={24} />
                              Quest Log
                            </h2>
                            <button
                              onClick={() => setIsQuestLogOpen(false)}
                              style={{ color: uiPrimary }}
                              className="opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <X size={24} />
                            </button>
                          </div>
                          <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 shadow-inner"
                            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                          >
                            {(project.quests || []).filter(
                              (q) =>
                                activeQuests.includes(q.id) ||
                                completedQuests.includes(q.id),
                            ).length === 0 ? (
                              <div
                                className="text-center py-10 opacity-50 font-medium"
                                style={{ color: uiSecondary }}
                              >
                                Your journal is empty.
                              </div>
                            ) : (
                              (project.quests || [])
                                .filter(
                                  (q) =>
                                    activeQuests.includes(q.id) ||
                                    completedQuests.includes(q.id),
                                )
                                .map((quest) => {
                                  let completedObjs = 0;
                                  let totalObjs = (quest.objectives || [])
                                    .length;
                                  (quest.objectives || []).forEach((obj) => {
                                    if (
                                      obj.type === "custom_flag" &&
                                      playerFlags.includes(obj.targetId)
                                    )
                                      completedObjs++;
                                    if (
                                      obj.type === "collect_item" &&
                                      playerInventory.includes(obj.targetId)
                                    )
                                      completedObjs++;
                                    if (
                                      obj.type === "reach_scene" &&
                                      project.currentSceneId === obj.targetId
                                    )
                                      completedObjs++;
                                  });
                                  const isCompleted =
                                    totalObjs > 0 && completedObjs >= totalObjs;

                                  return (
                                    <div
                                      key={quest.id}
                                      className="p-4 rounded-lg border-2 shadow-sm"
                                      style={{
                                        backgroundColor: uiBg,
                                        borderColor: isCompleted
                                          ? uiPrimary
                                          : `${uiPrimary}40`,
                                      }}
                                    >
                                      <h3
                                        className="font-bold text-lg mb-1"
                                        style={{
                                          color: isCompleted
                                            ? uiPrimary
                                            : "#ffffff",
                                        }}
                                      >
                                        {quest.name} {isCompleted && "✓"}
                                      </h3>
                                      <p
                                        className="text-sm mb-4 opacity-80"
                                        style={{ color: uiSecondary }}
                                      >
                                        {quest.description}
                                      </p>
                                      {totalObjs > 0 && (
                                        <div className="space-y-2">
                                          <div
                                            className="text-sm font-bold uppercase tracking-wider mb-2"
                                            style={{ color: uiPrimary }}
                                          >
                                            Objectives
                                          </div>
                                          {quest.objectives.map((obj) => {
                                            let isObjDone = false;
                                            if (
                                              obj.type === "custom_flag" &&
                                              playerFlags.includes(obj.targetId)
                                            )
                                              isObjDone = true;
                                            if (
                                              obj.type === "collect_item" &&
                                              playerInventory.includes(
                                                obj.targetId,
                                              )
                                            )
                                              isObjDone = true;
                                            if (
                                              obj.type === "reach_scene" &&
                                              project.currentSceneId ===
                                                obj.targetId
                                            )
                                              isObjDone = true;
                                            return (
                                              <div
                                                key={obj.id}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                <div
                                                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                                  style={{
                                                    borderColor: uiPrimary,
                                                    backgroundColor: isObjDone
                                                      ? uiPrimary
                                                      : "transparent",
                                                  }}
                                                >
                                                  {isObjDone && (
                                                    <CheckCircle2
                                                      size={10}
                                                      color={uiBg}
                                                    />
                                                  )}
                                                </div>
                                                <span
                                                  style={{
                                                    textDecoration: isObjDone
                                                      ? "line-through"
                                                      : "none",
                                                    color: isObjDone
                                                      ? uiPrimary
                                                      : uiSecondary,
                                                    opacity: isObjDone
                                                      ? 0.8
                                                      : 1,
                                                  }}
                                                >
                                                  {obj.description}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showDeviceFrame && (
                  <DeviceFrameOverlay
                    calibration={deviceFrame!}
                    imageSrc={deviceFrameAsset!.src}
                    className="pointer-events-none z-[4000]"
                  />
                )}

                {/* Drag-to-resize handles for canvas (stage) boundary */}
                {!isPlaying && (
                  <>
                    {/* Right edge handle */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsResizingCanvas({
                          direction: "r",
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: currentScene.width || project.globalSettings.stageWidth || 800,
                          startHeight: currentScene.height || project.globalSettings.stageHeight || 600,
                        });
                      }}
                      className="absolute top-0 bottom-0 pointer-events-auto -right-2 w-4 z-[5000] cursor-col-resize group flex items-center justify-center select-none"
                      title="Drag to resize scene width"
                    >
                      <div className="h-12 w-1.5 rounded-full bg-neutral-700/80 group-hover:bg-emerald-500 hover:scale-x-125 transition-all border border-neutral-900 shadow-lg" />
                    </div>

                    {/* Bottom edge handle */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsResizingCanvas({
                          direction: "b",
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: currentScene.width || project.globalSettings.stageWidth || 800,
                          startHeight: currentScene.height || project.globalSettings.stageHeight || 600,
                        });
                      }}
                      className="absolute left-0 right-0 pointer-events-auto -bottom-2 h-4 z-[5000] cursor-row-resize group flex items-center justify-center select-none"
                      title="Drag to resize scene height"
                    >
                      <div className="w-12 h-1.5 rounded-full bg-neutral-700/80 group-hover:bg-emerald-500 hover:scale-y-125 transition-all border border-neutral-900 shadow-lg" />
                    </div>

                    {/* Bottom-right corner handle */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsResizingCanvas({
                          direction: "br",
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: currentScene.width || project.globalSettings.stageWidth || 800,
                          startHeight: currentScene.height || project.globalSettings.stageHeight || 600,
                        });
                      }}
                      className="absolute pointer-events-auto -bottom-3 -right-3 w-6 h-6 z-[5001] cursor-se-resize group flex items-center justify-center select-none bg-neutral-950 border border-neutral-700 hover:border-emerald-500 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      title="Drag to resize entire scene (Hold Shift for proportional resizing)"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" className="text-neutral-400 group-hover:text-emerald-400 transition-colors stroke-current stroke-2 fill-none">
                        <line x1="2" y1="8" x2="8" y2="2" />
                        <line x1="5" y1="8" x2="8" y2="5" />
                      </svg>
                    </div>

                    {/* Real-time Scale Badge Toast */}
                    {isResizingCanvas && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-950/95 border border-emerald-500 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-2xl flex items-center gap-2 pointer-events-none select-none z-[6000] whitespace-nowrap">
                        <span className="opacity-75">📐 Size:</span>
                        <span className="text-white">{(currentScene.width || project.globalSettings.stageWidth || 800)}px</span>
                        <span className="text-neutral-500 font-sans">×</span>
                        <span className="text-white">{(currentScene.height || project.globalSettings.stageHeight || 600)}px</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Global styles for animations injected by Tailwind or custom */}
              <style>{`
            @keyframes wiggle {
              0%, 100% { transform: rotate(-5deg); }
              50% { transform: rotate(5deg); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.05); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-5px); }
              40%, 80% { transform: translateX(5px); }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            @keyframes fadeTransition {
              0% { opacity: 0; }
              50% { opacity: 1; }
              100% { opacity: 0; }
            }
            
            /* Custom User CSS */
            ${isPlaying ? project.globalSettings.customCss || "" : ""}
          `}</style>

              {/* Mobile & Desktop Viewport Live-Scale HUD Controls */}
              {!isPlaying && (
                <div 
                  className="absolute bottom-4 right-4 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-2 rounded-xl shadow-2xl flex items-center gap-3 z-[4000] select-none transition-all hover:border-neutral-700/80 hover:shadow-indigo-500/5 group"
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Scale and Fit Viewport for Mobile Phones / Desktop"
                >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Viewport Scale</span>
                    <span className="text-[10px] font-mono font-semibold text-neutral-300">
                      {Math.round(stageZoom * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button 
                      onClick={() => setStageZoom(prev => Math.max(0.15, +(prev - 0.05).toFixed(2)))} 
                      className="w-6 h-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded flex items-center justify-center transition-colors border border-neutral-700 text-xs active:scale-95"
                      title="Zoom Out"
                    >
                      <ZoomOut size={12} />
                    </button>
                    <input 
                      type="range" 
                      min="0.15" 
                      max="1.5" 
                      step="0.05" 
                      value={stageZoom} 
                      onChange={(e) => setStageZoom(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                    <button 
                      onClick={() => setStageZoom(prev => Math.min(1.5, +(prev + 0.05).toFixed(2)))} 
                      className="w-6 h-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded flex items-center justify-center transition-colors border border-neutral-700 text-xs active:scale-95"
                      title="Zoom In"
                    >
                      <ZoomIn size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        const mainEl = document.querySelector('main');
                        if (mainEl) {
                          const parentW = mainEl.clientWidth - 32; // subtracting padding
                          const targetScene = project.scenes.find((s) => s.id === project.currentSceneId) || project.scenes[0];
                          const targetW = targetScene?.width || project.globalSettings.stageWidth || 800;
                          const ratio = Math.min(1.0, +(parentW / targetW).toFixed(2));
                          setStageZoom(Math.max(0.15, ratio));
                        }
                      }} 
                      className="px-1.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white hover:text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors active:scale-95"
                      title="Fit to Screen width"
                    >
                      <Maximize2 size={10} />
                      Fit
                    </button>
                    <button 
                      onClick={() => setStageZoom(1)} 
                      className="px-1.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium rounded transition-colors active:scale-95"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              )}
            </main>

            {/* Right Sidebar - Properties/Layers */}
            <aside
              className="flex-shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 relative"
              style={{ width: rightSidebarWidth }}
            >
              <div
                className="absolute top-0 bottom-0 -left-[3px] w-[6px] cursor-col-resize z-[100] hover:bg-emerald-500/50"
                onPointerDown={() =>
                  document.body.classList.add("resizing-right-sidebar")
                }
              />
              <div className="flex border-b border-neutral-800 bg-neutral-950">
                <button
                  onClick={() => setRightSidebarTab("properties")}
                  className={`flex-1 p-2 text-[11px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${rightSidebarTab === "properties" ? "text-indigo-400 border-b-2 border-indigo-500 bg-neutral-900" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                >
                  <Settings size={14} /> Options
                </button>
                <button
                  onClick={() => setRightSidebarTab("layers")}
                  className={`flex-1 p-2 text-[11px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${rightSidebarTab === "layers" ? "text-indigo-400 border-b-2 border-indigo-500 bg-neutral-900" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                >
                  <Layers size={14} /> Layers
                </button>
                <button
                  onClick={() => setRightSidebarTab("prefabs")}
                  className={`flex-1 p-2 text-[11px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${rightSidebarTab === "prefabs" ? "text-indigo-400 border-b-2 border-indigo-500 bg-neutral-900" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                >
                  <Box size={14} /> Stamps
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-y-auto p-2 space-y-2">
                {rightSidebarTab === "layers" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                        {editorMode === "ui_stage"
                          ? "UI Elements"
                          : "Visual Editor Objects"}
                      </div>
                      <span className="text-sm text-neutral-500">
                        {currentScene.objects.length}
                      </span>
                    </div>
                    {[...currentScene.objects]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((obj) => {
                        const asset = project.assets.find(
                          (a) => a.src === obj.src,
                        );
                        let icon = (
                          <Square size={14} className="text-neutral-500" />
                        );
                        if (obj.isHitbox)
                          icon = <Square size={14} className="text-red-400" />;
                        else if (obj.isScript)
                          icon = (
                            <FileCode size={14} className="text-blue-400" />
                          );
                        else if (obj.isText)
                          icon = <Type size={14} className="text-indigo-400" />;
                        else if (asset?.type === "audio")
                          icon = (
                            <Music size={14} className="text-emerald-400" />
                          );
                        else if (asset?.type === "video")
                          icon = <Play size={14} className="text-purple-400" />;
                        else if (asset?.type === "image")
                          icon = (
                            <ImageIcon size={14} className="text-neutral-400" />
                          );

                        return (
                          <div
                            key={obj.id}
                            onClick={() =>
                              !isPlaying && setSelectedObjectId(obj.id)
                            }
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("layerId", obj.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedLayerId =
                                e.dataTransfer.getData("layerId");
                              if (!draggedLayerId || draggedLayerId === obj.id)
                                return;

                              // We need to re-assign z-indices to cleanly insert the layer.
                              // Current array is reverse sorted (highest z-index first).
                              const sortedObjects = [
                                ...currentScene.objects,
                              ].sort((a, b) => b.zIndex - a.zIndex);
                              const fromIndex = sortedObjects.findIndex(
                                (o) => o.id === draggedLayerId,
                              );
                              const toIndex = sortedObjects.findIndex(
                                (o) => o.id === obj.id,
                              );
                              if (fromIndex === -1 || toIndex === -1) return;

                              // Reorder the array
                              const [movedItem] = sortedObjects.splice(
                                fromIndex,
                                1,
                              );
                              sortedObjects.splice(toIndex, 0, movedItem);

                              // Re-assign z-indices cleanly, starting from highest
                              const total = sortedObjects.length;
                              const isUI =
                                editorMode === "ui_stage" && !isPlaying;
                              const newProject = {
                                ...project,
                                [isUI ? "uiMenus" : "scenes"]: (
                                  project[isUI ? "uiMenus" : "scenes"] || []
                                ).map((s) =>
                                  s.id === currentScene.id
                                    ? {
                                        ...s,
                                        objects: s.objects.map((o) => {
                                          const newIndex =
                                            sortedObjects.findIndex(
                                              (so) => so.id === o.id,
                                            );
                                          return {
                                            ...o,
                                            zIndex: (total - newIndex) * 10,
                                          };
                                        }),
                                      }
                                    : s,
                                ),
                              };
                              pushHistory(newProject);
                            }}
                            className={`flex flex-col gap-2 p-2 rounded cursor-pointer border transition-colors ${selectedObject?.id === obj.id ? "bg-emerald-500/10 border-emerald-500/50" : "bg-neutral-800 border-neutral-700/50 hover:bg-neutral-700"}`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="shrink-0 cursor-pointer text-neutral-400 hover:text-neutral-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateObject(obj.id, {
                                    hidden: !obj.hidden,
                                  });
                                }}
                              >
                                {obj.hidden ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </div>
                              <div
                                className="shrink-0 cursor-pointer text-neutral-400 hover:text-neutral-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateObject(obj.id, { locked: !obj.locked });
                                }}
                              >
                                {obj.locked ? (
                                  <Lock size={14} className="text-red-400" />
                                ) : (
                                  <Unlock size={14} />
                                )}
                              </div>
                              <div className="shrink-0">{icon}</div>
                              <div className="flex-1 min-w-0 text-sm truncate">
                                {obj.name}
                              </div>
                              <div
                                className="shrink-0 cursor-pointer text-neutral-400 hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: "Delete this object?",
                                    onConfirm: () => {
                                      setProject(p => ({
                                        ...p,
                                        scenes: p.scenes.map(s => s.id === currentScene.id ? { ...s, objects: s.objects.filter(o => o.id !== obj.id) } : s)
                                      }));
                                      if(selectedObjectId === obj.id) setSelectedObjectId(null);
                                    }
                                  });
                                }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </div>
                            </div>

                            {selectedObject?.id === obj.id && (
                              <div className="flex justify-between items-center bg-neutral-900/50 p-1.5 rounded-lg border border-neutral-700/50 mt-1">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const maxZ = Math.max(
                                        ...currentScene.objects.map(
                                          (o) => o.zIndex,
                                        ),
                                      );
                                      updateObject(obj.id, {
                                        zIndex: maxZ + 1,
                                      });
                                    }}
                                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                                    title="Bring to Front"
                                  >
                                    <ArrowUpToLine size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateObject(obj.id, {
                                        zIndex: obj.zIndex + 1,
                                      });
                                    }}
                                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                                    title="Move Up"
                                  >
                                    <MoveUp size={14} />
                                  </button>
                                </div>

                                <div className="text-sm uppercase text-neutral-500 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                                  Layer {obj.zIndex}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateObject(obj.id, {
                                        zIndex: obj.zIndex - 1,
                                      });
                                    }}
                                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                                    title="Move Down"
                                  >
                                    <MoveDown size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const minZ = Math.min(
                                        ...currentScene.objects.map(
                                          (o) => o.zIndex,
                                        ),
                                      );
                                      updateObject(obj.id, {
                                        zIndex: minZ - 1,
                                      });
                                    }}
                                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                                    title="Send to Back"
                                  >
                                    <ArrowDownToLine size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {currentScene.objects.length === 0 && (
                      <div className="text-sm text-neutral-500 text-center py-4 bg-neutral-800/50 rounded border border-neutral-800/50">
                        No objects in scene yet.
                      </div>
                    )}
                  </div>
                )}

                {rightSidebarTab === "prefabs" && (
                  <div className="flex flex-col gap-6">
                    {/* User Custom Prefabs / Stamps */}
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                            My Stamps
                          </div>
                       </div>
                       {(project.prefabs && project.prefabs.length > 0) ? (
                         <div className="grid grid-cols-2 gap-2">
                           {project.prefabs.map((pObj, i) => (
                             <div
                               key={pObj.id || i}
                               draggable
                               onDragStart={(e) =>
                                 handleDragStartAsset(e, {
                                   type: "custom_prefab",
                                   prefabData: pObj
                                 })
                               }
                               className="relative h-16 p-2 border border-dashed border-indigo-500/50 bg-indigo-500/10 rounded-lg cursor-grab hover:bg-indigo-500/20 flex flex-col items-center justify-center gap-1 transition-colors group"
                             >
                               {pObj.isText ? (
                                  <Type size={16} className="text-indigo-400" />
                               ) : pObj.isHitbox ? (
                                  <Square size={16} className="text-red-400" />
                               ) : pObj.isScript ? (
                                  <FileCode size={16} className="text-blue-400" />
                               ) : (
                                  <ImageIcon size={16} className="text-indigo-400" />
                               )}
                               <span className="text-xs font-medium text-indigo-200 uppercase truncate w-full text-center">
                                 {pObj.name}
                               </span>
                               <button 
                                 className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setConfirmDialog({
                                     isOpen: true,
                                     message: "Delete this prefab?",
                                     onConfirm: () => {
                                       setProject(p => ({
                                         ...p,
                                         prefabs: (p.prefabs || []).filter(pp => pp.id !== pObj.id)
                                       }));
                                     }
                                   });
                                 }}
                               >
                                 <X size={10} />
                               </button>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-xs text-neutral-500 italic p-4 text-center bg-neutral-900 border border-neutral-800 rounded-lg">
                           Right click any object on the canvas and select "Save as Stamp" to add it here.
                         </div>
                       )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                          Smart Stamps
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStartAsset(e, {
                            type: "ui_element",
                            uiElementType: "panel",
                            name: "Block",
                          })
                        }
                        className="h-16 p-2 border border-dashed border-indigo-500/50 bg-indigo-500/10 rounded-lg cursor-grab hover:bg-indigo-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        <Square size={16} className="text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-200 uppercase">
                          Block
                        </span>
                      </div>
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStartAsset(e, {
                            type: "text",
                            name: "Text Label",
                          })
                        }
                        className="h-16 p-2 border border-dashed border-sky-500/50 bg-sky-500/10 rounded-lg cursor-grab hover:bg-sky-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        <Type size={16} className="text-sky-400" />
                        <span className="text-sm font-medium text-sky-200 uppercase">
                          Text
                        </span>
                      </div>
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStartAsset(e, {
                            type: "ui_element",
                            uiElementType: "button",
                            name: "UI Button",
                          })
                        }
                        className="h-16 p-2 border border-dashed border-orange-500/50 bg-orange-500/10 rounded-lg cursor-grab hover:bg-orange-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        <MousePointer2 size={16} className="text-orange-400" />
                        <span className="text-sm font-medium text-orange-200 uppercase">
                          Button
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {rightSidebarTab === "properties" &&
                  (!selectedObject ? (
                    <div className="space-y-2">
                      <Accordion title="Project / Canvas Settings" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <LabelWithHelp
                              label="Global Screen Width"
                              helpText="The default total width of your game screen in pixels."
                            />
                            <input
                              type="number"
                              value={project.globalSettings.stageWidth || 800}
                              onChange={(e) =>
                                setProject((p) => ({
                                  ...p,
                                  globalSettings: {
                                    ...p.globalSettings,
                                    stageWidth: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <LabelWithHelp
                              label="Global Screen Height"
                              helpText="The default total height of your game screen in pixels."
                            />
                            <input
                              type="number"
                              value={project.globalSettings.stageHeight || 600}
                              onChange={(e) =>
                                setProject((p) => ({
                                  ...p,
                                  globalSettings: {
                                    ...p.globalSettings,
                                    stageHeight: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800">
                          <div className="col-span-2">
                             <LabelWithHelp 
                               label={(editorMode === "ui_stage") ? "This Canvas Override Size" : "This Room Override Size"}
                               helpText="Override the size of this specific canvas only. Leave as 0 to use Global size."
                             />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Width"
                              value={currentScene?.width || ""}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                updateScene({ width: val });
                              }}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Height"
                              value={currentScene?.height || ""}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                updateScene({ height: val });
                              }}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                          <LabelWithHelp
                            label="Custom Global Cursor"
                            helpText="Replace the default mouse pointer for your entire game."
                          />
                          <div className="flex items-center gap-2 mt-1">
                            {project.globalSettings.customCursorAssetId ? (
                              <div className="relative w-10 h-10 bg-neutral-800 border border-neutral-700 rounded">
                                <img
                                  src={
                                    project.assets.find(
                                      (a) =>
                                        a.id ===
                                        project.globalSettings
                                          .customCursorAssetId,
                                    )?.src || undefined
                                  }
                                  className="w-full h-full object-contain p-1"
                                />
                                <button
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                  onClick={() =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        customCursorAssetId: undefined,
                                      },
                                    }))
                                  }
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setAssetPickerCb({
                                    onSelect: (id) => {
                                      pushHistory({
                                        ...project,
                                        globalSettings: {
                                          ...project.globalSettings,
                                          customCursorAssetId: id,
                                        },
                                      });
                                      setAssetPickerCb(null);
                                    },
                                    filterType: "image",
                                  })
                                }
                                className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm rounded hover:bg-neutral-700"
                              >
                                Select Image
                              </button>
                            )}
                          </div>
                        </div>
                      </Accordion>

                      <Accordion title="Visual Export Layout Arranger">
                        <div className="bg-neutral-950 p-2 rounded relative flex items-center justify-center border border-neutral-800 mt-2" style={{ resize: 'both', overflow: 'hidden', minHeight: '150px', height: '400px', minWidth: '150px' }}>
                          <div className={`relative flex w-full h-full text-[10px] items-center justify-center p-2 rounded bg-neutral-900 border border-neutral-700 ${project.globalSettings.dialoguePosition === 'below' ? 'flex-col' : 'flex-row'}`}>
                            
                            {/* Game Canvas */}
                            <div 
                              className="relative bg-black flex shrink-0 items-center justify-center border border-emerald-500 overflow-hidden"
                              style={{
                                aspectRatio: `${project.globalSettings.stageWidth || 800} / ${project.globalSettings.stageHeight || 600}`,
                                height: project.globalSettings.dialoguePosition === 'below' ? 'calc(100% - 60px)' : '100%',
                                maxHeight: '100%',
                                maxWidth: '100%'
                              }}
                            >
                                <span className="text-emerald-500 opacity-50 font-bold uppercase tracking-widest pointer-events-none">Game Canvas</span>

                                {/* HUD Icons Approximation */}
                                <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
                                  {!project.globalSettings.hideDefaultInventoryBtn && <div className="w-4 h-4 bg-purple-500/50 border border-purple-500 rounded flex items-center justify-center text-[6px]">Inv</div>}
                                  {(project.quests && project.quests.length > 0) && !project.globalSettings.hideDefaultQuestLogBtn && <div className="w-4 h-4 bg-purple-500/50 border border-purple-500 rounded flex items-center justify-center text-[6px]">Qsts</div>}
                                  {!project.globalSettings.hideDefaultMapBtn && <div className="w-4 h-4 bg-purple-500/50 border border-purple-500 rounded flex items-center justify-center text-[6px]">Map</div>}
                                </div>
                                
                                <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                                  {!project.globalSettings.hideDefaultSettingsBtn && <div className="w-4 h-4 bg-blue-500/50 border border-blue-500 rounded flex items-center justify-center text-[6px]">Set</div>}
                                  {!project.globalSettings.hideDefaultAlmanacBtn && <div className="w-4 h-4 bg-blue-500/50 border border-blue-500 rounded flex items-center justify-center text-[6px]">Alm</div>}
                                </div>

                                <div className="absolute top-8 right-2 flex flex-col gap-1 pointer-events-none">
                                  {project.globalSettings.enableNeeds && <div className="w-16 h-3 bg-red-500/30 border border-red-500 rounded text-[6px] flex items-center justify-center text-white">Needs</div>}
                                </div>
                                
                                <div className="absolute top-8 left-2 flex flex-col gap-1 pointer-events-none">
                                  {project.globalSettings.enableTTRPGStats && <div className="w-16 h-3 bg-yellow-500/30 border border-yellow-500 rounded text-[6px] flex items-center justify-center text-white">Stats</div>}
                                </div>

                                {/* HUD Overlay Preview */}
                                {project.globalSettings.hudOverlay?.assetId && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundImage: `url('${project.assets.find(a => a.id === project.globalSettings.hudOverlay?.assetId)?.src}')`,
                                      backgroundSize: project.globalSettings.hudOverlay.position === "stretch" ? "100% 100%" : (project.globalSettings.hudOverlay.position ? "contain" : "100% 100%"),
                                      backgroundPosition: (project.globalSettings.hudOverlay.position && project.globalSettings.hudOverlay.position !== "stretch") ? project.globalSettings.hudOverlay.position.replace("-", " ") : "center",
                                      backgroundRepeat: "no-repeat",
                                      transform: `scale(${project.globalSettings.hudOverlay.scale ?? 1}) translate(${project.globalSettings.hudOverlay.offsetX || 0}px, ${project.globalSettings.hudOverlay.offsetY || 0}px)`,
                                      mixBlendMode: (project.globalSettings.hudOverlay.blendMode || "normal") as any,
                                      opacity: project.globalSettings.hudOverlay.opacity ?? 1,
                                    }}
                                  >
                                    <div className="absolute inset-0 border-2 border-orange-500 border-dashed m-[10%]" />
                                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2">
                                      <span className="bg-orange-500/80 text-white px-1 font-bold text-[8px] rounded">HUD OVERLAY BOUNDARIES</span>
                                    </div>
                                  </div>
                                )}

                                {/* Dialogue overlay if absolute */}
                                {project.globalSettings.dialoguePosition !== 'below' && (
                                  <div 
                                    className={`absolute border border-cyan-500 bg-cyan-900/50 flex flex-col items-center justify-center text-cyan-200 cursor-pointer hover:bg-cyan-400/30 transition-colors
                                      ${project.globalSettings.dialoguePosition === 'top' ? 'top-2' : ''}
                                      ${project.globalSettings.dialoguePosition === 'center' ? 'top-1/2 -translate-y-1/2' : ''}
                                      ${project.globalSettings.dialoguePosition === 'bottom' || !project.globalSettings.dialoguePosition ? 'bottom-2' : ''}
                                    `}
                                    style={{ 
                                      width: `${project.globalSettings.dialogueWidthPercent ?? 91}%`, 
                                      height: '40px', 
                                      left: '50%',
                                      transform: project.globalSettings.dialoguePosition === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)',
                                      zIndex: 100 
                                    }}
                                    onClick={() => {
                                      const positions = ["bottom", "top", "center"];
                                      const current = project.globalSettings.dialoguePosition || "bottom";
                                      pushHistory({
                                        ...project,
                                        globalSettings: {
                                          ...project.globalSettings,
                                          dialoguePosition: positions[(positions.indexOf(current) + 1) % positions.length] as any
                                        }
                                      });
                                    }}
                                  >
                                    <span className="font-bold">Dialogue Box</span>
                                    <span className="text-[8px] opacity-80">(In-Canvas: {project.globalSettings.dialoguePosition || "bottom"}) - Click to Rotate</span>
                                  </div>
                                )}
                            </div>

                            {/* Dialogue below if below */}
                            {project.globalSettings.dialoguePosition === 'below' && (
                                <div 
                                  className="shrink-0 border border-cyan-500 bg-cyan-900/50 mt-2 flex flex-col items-center justify-center text-cyan-200 cursor-pointer hover:bg-cyan-400/30 transition-colors rounded-sm mx-auto"
                                  style={{ height: '40px', width: `${project.globalSettings.dialogueWidthPercent ?? 91}%`, maxWidth: `${project.globalSettings.dialogueMaxWidthPx ?? 672}px` }}
                                  onClick={() => {
                                      pushHistory({
                                        ...project,
                                        globalSettings: {
                                          ...project.globalSettings,
                                          dialoguePosition: 'bottom'
                                        }
                                      });
                                  }}
                                >
                                  <span className="font-bold">Dialogue Box (Below Canvas)</span>
                                  <span className="text-[8px] opacity-80">Click to attach inside canvas</span>
                                </div>
                            )}
                          </div>

                          <div className="absolute top-2 left-2 flex gap-1 z-10 pointer-events-auto">
                            <button
                              onClick={() => pushHistory({...project, globalSettings: {...project.globalSettings, dialoguePosition: 'below'}})}
                              className={`text-[9px] px-1.5 py-0.5 rounded border shadow ${project.globalSettings.dialoguePosition === 'below' ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700'} transition-all`}
                            >
                              Move Dialogue Below Canvas
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-2 leading-tight">
                          This preview approximates how your game will layout upon export. Click the Dialogue Box to change its attachment point! Check "Heads Up Display" settings to hide/show corner icons.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2 border-t border-neutral-800 pt-2">
                          <div>
                            <label className="text-xs text-neutral-400 block mb-1">
                              Box Width (%)
                            </label>
                            <input
                              type="number"
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                              value={project.globalSettings.dialogueWidthPercent ?? 91}
                              onChange={(e) => pushHistory({ ...project, globalSettings: { ...project.globalSettings, dialogueWidthPercent: Number(e.target.value) } })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-neutral-400 block mb-1">
                              Max Width (px)
                            </label>
                            <input
                              type="number"
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                              value={project.globalSettings.dialogueMaxWidthPx ?? 672}
                              onChange={(e) => pushHistory({ ...project, globalSettings: { ...project.globalSettings, dialogueMaxWidthPx: Number(e.target.value) } })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-neutral-400 block mb-1">
                              Max Height (%)
                            </label>
                            <input
                              type="number"
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                              value={project.globalSettings.dialogueMaxHeightPercent ?? 90}
                              onChange={(e) => pushHistory({ ...project, globalSettings: { ...project.globalSettings, dialogueMaxHeightPercent: Number(e.target.value) } })}
                            />
                          </div>
                        </div>
                      </Accordion>

                      <Accordion title="User Interface Theming">
                        <div>
                          <LabelWithHelp
                            label="Preset Theme"
                            helpText="Choose a pre-made look for your game's UI. This changes colors, fonts, and borders automatically."
                            className="mb-1"
                          />
                          <select
                            value={project.globalSettings.uiTheme || "default"}
                            onChange={(e) => {
                              const theme = e.target.value as any;
                              const presets: Record<string, any> = {
                                default: {
                                  primary: "#00ffff",
                                  bg: "#1a0033",
                                  radius: 0,
                                  font: '"VT323", monospace',
                                },
                                minimalist: {
                                  primary: "#000000",
                                  bg: "rgba(255,255,255,0.95)",
                                  radius: 0,
                                  font: "Helvetica, Arial, sans-serif",
                                },
                                barbie: {
                                  primary: "#ec4899",
                                  bg: "rgba(253, 230, 238, 0.9)",
                                  radius: 20,
                                  font: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                                },
                                terminal: {
                                  primary: "#4ade80",
                                  bg: "rgba(0, 0, 0, 0.95)",
                                  radius: 0,
                                  font: "monospace",
                                },
                                cyberpunk: {
                                  primary: "#eab308",
                                  bg: "rgba(20, 0, 20, 0.9)",
                                  radius: 4,
                                  font: '"Courier New", Courier, monospace',
                                },
                                fantasy: {
                                  primary: "#b45309",
                                  bg: "rgba(30, 20, 10, 0.9)",
                                  radius: 12,
                                  font: "Georgia, serif",
                                },
                                retro: {
                                  primary: "#ec4899",
                                  bg: "rgba(40, 40, 80, 0.9)",
                                  radius: 4,
                                  font: '"Press Start 2P", monospace',
                                },
                              };
                              const s = presets[theme];
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  uiTheme: theme,
                                  uiColorPrimary: s.primary,
                                  uiColorBackground: s.bg,
                                  uiBorderRadius: s.radius,
                                  uiFontFamily: s.font,
                                },
                              }));
                            }}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="default">Default Dark</option>
                            <option value="minimalist">Minimalist Light</option>
                            <option value="barbie">Barbie Core / Y2K</option>
                            <option value="terminal">Hacker Terminal</option>
                            <option value="cyberpunk">Cyberpunk Neon</option>
                            <option value="fantasy">Ancient / Fantasy</option>
                            <option value="retro">Retro 8-bit</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <LabelWithHelp
                              label="Accent Color"
                              className="mb-1 block"
                              helpText="The primary highlight color for buttons and progress bars."
                            />
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  project.globalSettings.uiColorPrimary ||
                                  "#10b981"
                                }
                                onChange={(e) =>
                                  setProject((p) => ({
                                    ...p,
                                    globalSettings: {
                                      ...p.globalSettings,
                                      uiColorPrimary: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-neutral-800 border-none rounded cursor-pointer w-6 h-6 p-0"
                              />
                            </div>
                          </div>
                          <div>
                            <LabelWithHelp
                              label="Background Color"
                              className="mb-1 block"
                              helpText="The main dark or light background color for UI panels."
                            />
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  project.globalSettings.uiColorBackground ||
                                  "#171717"
                                }
                                onChange={(e) =>
                                  setProject((p) => ({
                                    ...p,
                                    globalSettings: {
                                      ...p.globalSettings,
                                      uiColorBackground: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-neutral-800 border-none rounded cursor-pointer w-6 h-6 p-0"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <LabelWithHelp
                            label="UI Font Family"
                            className="mb-1 mt-2 block"
                            helpText="The font used for all UI text and dialogue."
                          />
                          <select
                            value={
                              project.globalSettings.uiFontFamily ||
                              "sans-serif"
                            }
                            onChange={(e) =>
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  uiFontFamily: e.target.value,
                                },
                              }))
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="sans-serif">System Sans</option>
                            <option value="serif">System Serif</option>
                            <option value="'Courier New', monospace">
                              Terminal (Courier)
                            </option>
                            <option value="Helvetica, Arial, sans-serif">
                              Helvetica / Arial
                            </option>
                            <option value="'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif">
                              Trebuchet MS
                            </option>
                            <option value="Verdana, Geneva, sans-serif">
                              Verdana
                            </option>
                            <option value="'Times New Roman', Times, serif">
                              Times New Roman
                            </option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="Garamond, serif">Garamond</option>
                            <option value="'Comic Sans MS', cursive">
                              Bubbly (Comic Sans)
                            </option>
                            <option value="'Brush Script MT', cursive">
                              Brush Script
                            </option>
                            <option value="'Press Start 2P', monospace">
                              Retro 8-bit
                            </option>
                            <option value="Papyrus, fantasy">
                              Ancient (Papyrus)
                            </option>
                          </select>
                        </div>
                      </Accordion>

                      <Accordion title="Heads Up Display (HUD)">
                        <div className="space-y-4 bg-neutral-950/50 p-2 rounded">
                          <div className="flex flex-col gap-2 border-b border-emerald-500/20 pb-3">
                            <div>
                              <span className="font-comic text-sm font-bold text-emerald-300">
                                Device Frame
                              </span>
                              <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">
                                Wrap the game in a CRT, television, computer, or
                                other frame. You only need to mark the blank
                                screen once.
                              </p>
                            </div>

                            {deviceFrame && deviceFrameAsset ? (
                              <div className="flex items-center gap-3 rounded border border-emerald-500/25 bg-emerald-500/5 p-2">
                                <img
                                  src={deviceFrameAsset.src}
                                  alt=""
                                  className="h-16 w-20 rounded border border-neutral-700 bg-black object-contain"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-bold text-white">
                                    {deviceFrameAsset.name}
                                  </div>
                                  <div className="mt-1 text-[10px] text-emerald-300">
                                    Screen marked and ready
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCalibratingFrameAssetId(
                                          deviceFrame.assetId,
                                        )
                                      }
                                      className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                                    >
                                      Mark Screen Again
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAssetPickerCb({
                                          onSelect: (id) => {
                                            setAssetPickerCb(null);
                                            setCalibratingFrameAssetId(id);
                                          },
                                          filterType: "image",
                                        })
                                      }
                                      className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[10px] font-bold text-neutral-300 hover:bg-neutral-700"
                                    >
                                      Choose Another
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        pushHistory({
                                          ...project,
                                          globalSettings: {
                                            ...project.globalSettings,
                                            deviceFrame: undefined,
                                          },
                                        })
                                      }
                                      className="rounded px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAssetPickerCb({
                                      onSelect: (id) => {
                                        setAssetPickerCb(null);
                                        setCalibratingFrameAssetId(id);
                                      },
                                      filterType: "image",
                                    })
                                  }
                                  className="rounded border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 font-comic text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                                >
                                  Choose Frame
                                </button>
                                <label className="cursor-pointer rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-300 hover:bg-neutral-700">
                                  Upload Frame
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const src = String(reader.result || "");
                                        const assetId = uuidv4();
                                        const newAsset: Asset = {
                                          id: assetId,
                                          src,
                                          name: file.name.replace(
                                            /\.[^.]+$/,
                                            "",
                                          ),
                                          type: "image",
                                          category: "device_frames",
                                          tags: ["device-frame", "ui"],
                                        };
                                        setProject((current) => ({
                                          ...current,
                                          assets: [newAsset, ...current.assets],
                                        }));
                                        setCalibratingFrameAssetId(assetId);
                                      };
                                      reader.readAsDataURL(file);
                                      event.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            )}

                            {deviceFrame && deviceFrameAsset && (
                              <div
                                className="relative mx-auto overflow-hidden rounded border border-neutral-700 bg-black"
                                style={{
                                  aspectRatio: `${deviceFrame.outerWidth} / ${deviceFrame.outerHeight}`,
                                  width: "min(100%, 280px)",
                                }}
                              >
                                <div
                                  className="absolute bg-neutral-900"
                                  style={{
                                    left: `${(deviceFrame.screen.x / deviceFrame.outerWidth) * 100}%`,
                                    top: `${(deviceFrame.screen.y / deviceFrame.outerHeight) * 100}%`,
                                    width: `${(deviceFrame.screen.width / deviceFrame.outerWidth) * 100}%`,
                                    height: `${(deviceFrame.screen.height / deviceFrame.outerHeight) * 100}%`,
                                  }}
                                >
                                  <span className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-emerald-300">
                                    GAME
                                  </span>
                                </div>
                                <DeviceFrameOverlay
                                  calibration={deviceFrame}
                                  imageSrc={deviceFrameAsset.src}
                                  className="pointer-events-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* HUD Overlay */}
                          <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                            <span className="text-xs font-bold text-neutral-500 uppercase">
                              Static Screen Overlay
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {project.globalSettings.hudOverlay?.assetId ? (
                                <div className="relative w-10 h-10 bg-neutral-800 border border-neutral-700 rounded">
                                  <img
                                    src={project.assets.find((a) => a.id === project.globalSettings.hudOverlay?.assetId)?.src}
                                    className="w-full h-full object-contain p-1"
                                  />
                                  <button
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                    onClick={() =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hudOverlay: { ...p.globalSettings.hudOverlay, assetId: undefined }
                                        },
                                      }))
                                    }
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setAssetPickerCb({
                                      onSelect: (id) => {
                                        pushHistory({
                                          ...project,
                                          globalSettings: {
                                            ...project.globalSettings,
                                            hudOverlay: { ...project.globalSettings.hudOverlay, assetId: id }
                                          },
                                        });
                                        setAssetPickerCb(null);
                                      },
                                      filterType: "image",
                                    })
                                  }
                                  className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm rounded hover:bg-neutral-700"
                                >
                                  Select Overlay Image
                                </button>
                              )}
                            </div>
                            {project.globalSettings.hudOverlay?.assetId && (
                              <div className="mt-2 space-y-2">
                                <label className="flex items-center justify-between gap-2 text-sm text-neutral-300">
                                  Opacity
                                  <input type="range" min="0" max="1" step="0.1" value={project.globalSettings.hudOverlay.opacity ?? 1} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, opacity: parseFloat(e.target.value) } } }))} />
                                </label>
                                <label className="flex items-center justify-between gap-2 text-sm text-neutral-300">
                                  Position
                                  <select className="bg-neutral-800 border-neutral-700 rounded text-sm px-1 py-0.5" value={project.globalSettings.hudOverlay.position || "stretch"} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, position: e.target.value as any } } }))}>
                                    <option value="stretch">Stretch to Screen</option>
                                    <option value="center">Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                  </select>
                                </label>
                                {project.globalSettings.hudOverlay.position !== "stretch" && (
                                  <>
                                    <label className="flex items-center justify-between gap-2 text-sm text-neutral-300">
                                      Scale Override
                                      <input type="number" step="0.1" className="bg-neutral-800 border-neutral-700 rounded px-2 w-20 text-sm" value={project.globalSettings.hudOverlay.scale ?? 1} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, scale: parseFloat(e.target.value) || 1 } } }))} />
                                    </label>
                                    <label className="flex items-center justify-between gap-2 text-sm text-neutral-300">
                                      Offset X / Y
                                      <div className="flex gap-1">
                                        <input type="number" className="bg-neutral-800 border-neutral-700 rounded px-2 w-16 text-sm" placeholder="X" value={project.globalSettings.hudOverlay.offsetX || 0} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, offsetX: parseInt(e.target.value) || 0 } } }))} />
                                        <input type="number" className="bg-neutral-800 border-neutral-700 rounded px-2 w-16 text-sm" placeholder="Y" value={project.globalSettings.hudOverlay.offsetY || 0} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, offsetY: parseInt(e.target.value) || 0 } } }))} />
                                      </div>
                                    </label>
                                  </>
                                )}
                                <label className="flex items-center justify-between gap-2 text-sm text-neutral-300">
                                  Blend Mode
                                  <select className="bg-neutral-800 border-neutral-700 rounded text-sm px-1 py-0.5" value={project.globalSettings.hudOverlay.blendMode || "normal"} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, blendMode: e.target.value } } }))}>
                                    <option value="normal">Normal</option>
                                    <option value="multiply">Multiply</option>
                                    <option value="screen">Screen</option>
                                    <option value="overlay">Overlay</option>
                                  </select>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300">
                                  <input type="checkbox" className="rounded bg-neutral-800 border-neutral-700 focus:ring-emerald-500 text-emerald-500" checked={project.globalSettings.hudOverlay.pointerEvents !== "none"} onChange={e => setProject(p => ({ ...p, globalSettings: { ...p.globalSettings, hudOverlay: { ...p.globalSettings.hudOverlay, pointerEvents: e.target.checked ? "auto" : "none" } } }))} />
                                  Blocks Clicks (Pointer Events)
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Inventory */}
                          <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Inventory
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings
                                      .hideDefaultInventoryBtn
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        hideDefaultInventoryBtn:
                                          e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Hide Built-in Button
                                </span>
                              </label>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Skills
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings.enableSkillsHud
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        enableSkillsHud: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Enable HUD Menu
                                </span>
                              </label>
                              {project.globalSettings.enableSkillsHud && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!project.globalSettings
                                        .hideDefaultSkillsBtn
                                    }
                                    onChange={(e) =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hideDefaultSkillsBtn:
                                            e.target.checked,
                                        },
                                      }))
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-neutral-400">
                                    Hide Built-in Button
                                  </span>
                                </label>
                              )}
                            </div>

                            {/* Almanac */}
                            <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Almanac
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings.enableAlmanacHud
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        enableAlmanacHud: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Enable HUD Menu
                                </span>
                              </label>
                              {project.globalSettings.enableAlmanacHud && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!project.globalSettings
                                        .hideDefaultAlmanacBtn
                                    }
                                    onChange={(e) =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hideDefaultAlmanacBtn:
                                            e.target.checked,
                                        },
                                      }))
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-neutral-400">
                                    Hide Built-in Button
                                  </span>
                                </label>
                              )}
                            </div>

                            {/* Map */}
                            <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Map
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings.enableMapHud
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        enableMapHud: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Enable HUD Menu
                                </span>
                              </label>
                              {project.globalSettings.enableMapHud && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!project.globalSettings.hideDefaultMapBtn
                                    }
                                    onChange={(e) =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hideDefaultMapBtn: e.target.checked,
                                        },
                                      }))
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-neutral-400">
                                    Hide Built-in Button
                                  </span>
                                </label>
                              )}
                            </div>

                            {/* Relationships */}
                            <div className="flex flex-col gap-1 border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Relationships
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings
                                      .enableRelationshipsHud
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        enableRelationshipsHud:
                                          e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Enable HUD Menu
                                </span>
                              </label>
                              {project.globalSettings
                                .enableRelationshipsHud && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!project.globalSettings
                                        .hideDefaultRelationshipsBtn
                                    }
                                    onChange={(e) =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hideDefaultRelationshipsBtn:
                                            e.target.checked,
                                        },
                                      }))
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-neutral-400">
                                    Hide Built-in Button
                                  </span>
                                </label>
                              )}
                            </div>

                            {/* Player Settings */}
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-neutral-500 uppercase">
                                Player Settings
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!project.globalSettings.enableSettingsHud
                                  }
                                  onChange={(e) =>
                                    setProject((p) => ({
                                      ...p,
                                      globalSettings: {
                                        ...p.globalSettings,
                                        enableSettingsHud: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-neutral-300">
                                  Enable HUD Menu
                                </span>
                              </label>
                              {project.globalSettings.enableSettingsHud && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!project.globalSettings
                                        .hideDefaultSettingsBtn
                                    }
                                    onChange={(e) =>
                                      setProject((p) => ({
                                        ...p,
                                        globalSettings: {
                                          ...p.globalSettings,
                                          hideDefaultSettingsBtn:
                                            e.target.checked,
                                        },
                                      }))
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-neutral-400">
                                    Hide Built-in Button
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                      </Accordion>

                      <Accordion title="Advanced Setup">
                        <div>
                          <LabelWithHelp
                            label="UI Border Radius (px)"
                            className="mb-1 block"
                            helpText="How rounded the corners of menus and buttons are."
                          />
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={project.globalSettings.uiBorderRadius ?? 8}
                            onChange={(e) =>
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  uiBorderRadius: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <LabelWithHelp
                            label="Advanced CSS Override"
                            className="mb-1 mt-2 block"
                            helpText="Custom CSS classes."
                          />
                          <textarea
                            value={project.globalSettings.customCss || ""}
                            onChange={(e) =>
                              setProject((p) => ({
                                ...p,
                                globalSettings: {
                                  ...p.globalSettings,
                                  customCss: e.target.value,
                                },
                              }))
                            }
                            className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded p-2 mt-1 text-sm font-mono text-neutral-300 focus:border-emerald-500 focus:outline-none custom-scrollbar whitespace-pre"
                            placeholder={`/* Your custom CSS classes run in Preview/Export */\n.dialogue-box {\n  ...\n}`}
                          />
                        </div>
                      </Accordion>

                      <Accordion title="Simulation & Overrides">
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                !!project.globalSettings.useDayNightCycle
                              }
                              onChange={(e) =>
                                setProject((p) => ({
                                  ...p,
                                  globalSettings: {
                                    ...p.globalSettings,
                                    useDayNightCycle: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-neutral-300">
                              Enable Day/Night Cycle
                            </span>
                          </label>
                          <p className="text-sm text-neutral-500 mt-1">
                            Applies global lighting filters based on in-game
                            time.
                          </p>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer mt-3">
                            <input
                              type="checkbox"
                              checked={!!project.globalSettings.enableNeeds}
                              onChange={(e) =>
                                setProject((p) => ({
                                  ...p,
                                  globalSettings: {
                                    ...p.globalSettings,
                                    enableNeeds: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-neutral-300">
                              Enable "Sim" Needs System
                            </span>
                          </label>
                          <p className="text-sm text-neutral-500 mt-1">
                            Shows a HUD tracking hunger, energy, etc.
                          </p>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer mt-3">
                            <input
                              type="checkbox"
                              checked={
                                !!project.globalSettings.enableTTRPGStats
                              }
                              onChange={(e) =>
                                setProject((p) => ({
                                  ...p,
                                  globalSettings: {
                                    ...p.globalSettings,
                                    enableTTRPGStats: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-neutral-300">
                              Enable Character Skills & Meters
                            </span>
                          </label>
                          <p className="text-sm text-neutral-500 mt-1">
                            Enables rolling dice for interactions based on
                            skills.
                          </p>
                        </div>
                      </Accordion>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-16">
                      <Accordion title="Identity & Setup" defaultOpen={true}>
                        <div className="space-y-4">
                          {/* Object Preview Visualizer Sandbox */}
                          {!selectedObject.isHitbox && !selectedObject.isText && !selectedObject.isScript && selectedObject.src && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden group">
                               {project.assets.find(a => a.src === selectedObject.src)?.type === 'video' ? (
                                 <video src={selectedObject.src} controls className="max-w-full max-h-32 object-contain rounded drop-shadow-md" />
                               ) : project.assets.find(a => a.src === selectedObject.src)?.type === 'audio' ? (
                                 <div className="flex flex-col items-center justify-center py-4 w-full relative">
                                   <Music size={32} className="text-emerald-500 mb-2" />
                                   <audio src={selectedObject.src} controls className="w-full h-8" />
                                 </div>
                               ) : (
                                 <img src={selectedObject.src} className="max-w-full max-h-32 object-contain rounded drop-shadow-lg" />
                               )}
                               <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setAssetPickerCb({
                                      filterType: undefined,
                                      onSelect: (id) => {
                                          const asset = project.assets.find(a => a.id === id);
                                          if (asset) updateObject(selectedObject.id, { src: asset.src, ...(selectedObject.isUiElement ? {} : {width: asset.type === 'video' ? 320 : 100, height: asset.type === 'video' ? 180 : 100}) });
                                      }
                                    })}
                                    className="bg-black/50 hover:bg-black/80 backdrop-blur text-white p-1.5 rounded-full outline-none transition-colors"
                                    title="Swap Asset"
                                  >
                                     <RefreshCw size={14} />
                                  </button>
                               </div>
                            </div>
                          )}

                          <div className="space-y-3">
                        <LabelWithHelp
                          label="Object Name"
                          helpText="A unique name to identify this object in the Layers panel."
                        />
                        <input
                          id="properties-name-input"
                          type="text"
                          value={selectedObject.name || ""}
                          onChange={(e) =>
                            updateObject(selectedObject.id, {
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
                          placeholder="e.g. Hero Character"
                        />
                      </div>

                      {!selectedObject.isUiElement &&
                        !selectedObject.isScript &&
                        selectedObject.interaction === "none" && (
                          <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                            <LabelWithHelp
                              label="Quick Setup"
                              helpText="Quickly configure this object's interaction behavior."
                              className="mb-2 block text-indigo-300"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    interaction: "dialogue",
                                    cursor: "pointer",
                                  })
                                }
                                className="bg-indigo-600/50 hover:bg-indigo-500/80 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1"
                              >
                                <MessageSquare size={12} /> Dialog Button
                              </button>
                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    interaction: "sound",
                                    cursor: "pointer",
                                  })
                                }
                                className="bg-emerald-600/50 hover:bg-emerald-500/80 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1"
                              >
                                <Music size={12} /> Sound Trigger
                              </button>
                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    interaction: "play_cutscene",
                                    cursor: "pointer",
                                  })
                                }
                                className="bg-orange-600/50 hover:bg-orange-500/80 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1"
                              >
                                <Play size={12} /> Video Player
                              </button>
                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    interaction: "scene_change",
                                    cursor: "pointer",
                                  })
                                }
                                className="bg-blue-600/50 hover:bg-blue-500/80 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1"
                              >
                                <LogIn size={12} /> Portal / Scene
                              </button>
                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    interaction: "give-item",
                                    cursor: "pointer",
                                  })
                                }
                                className="bg-amber-600/50 hover:bg-amber-500/80 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1 col-span-2"
                              >
                                <Package size={12} /> Give Item
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                      </Accordion>

                      {selectedObject.isUiElement && (
                        <Accordion title="UI Element Properties">
                          <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <LabelWithHelp
                                  label="Primary Color"
                                  helpText="The main color of this UI element (like the fill of a health bar, or outline of a panel)."
                                />
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={
                                      selectedObject.uiColorPrimary || "#10b981"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiColorPrimary: e.target.value,
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-transparent cursor-pointer p-0 border-none"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      selectedObject.uiColorPrimary || "#10b981"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiColorPrimary: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border-b border-neutral-700 rounded-none px-1 py-0.5 text-sm focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <LabelWithHelp
                                  label={
                                    selectedObject.uiElementType === "tooltip"
                                      ? "Background"
                                      : "Secondary Color"
                                  }
                                  helpText="The background or empty state color of this UI element."
                                />
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={
                                      selectedObject.uiColorSecondary ||
                                      "#171717"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiColorSecondary: e.target.value,
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-transparent cursor-pointer p-0 border-none"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      selectedObject.uiColorSecondary ||
                                      "#171717"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiColorSecondary: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border-b border-neutral-700 rounded-none px-1 py-0.5 text-sm focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {(selectedObject.uiElementType === "panel" ||
                              selectedObject.uiElementType === "progress" ||
                              selectedObject.uiElementType === "button") && (
                              <>
                                <div>
                                  <LabelWithHelp
                                    label="Border Style"
                                    helpText="The type of border drawn around the element."
                                  />
                                  <select
                                    value={
                                      selectedObject.uiBorderType || "solid"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiBorderType: e.target.value as any,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                  >
                                    <option value="none">None</option>
                                    <option value="solid">Solid Line</option>
                                    <option value="double">Double Line</option>
                                    <option value="bevel">Beveled (3D)</option>
                                    <option value="dashed">Dashed Line</option>
                                    <option value="dotted">Dotted Line</option>
                                    <option value="inset">
                                      Inset (Sunken)
                                    </option>
                                    <option value="outset">
                                      Outset (Raised)
                                    </option>
                                    <option value="groove">Groove</option>
                                    <option value="ridge">Ridge</option>
                                  </select>
                                </div>
                                <div>
                                  <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                    <LabelWithHelp
                                      label="Border Radius"
                                      helpText="How rounded the corners are. 0 is a sharp square."
                                    />
                                    <span>
                                      {selectedObject.uiBorderRadius || 0}px
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={selectedObject.uiBorderRadius || 0}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiBorderRadius: Number(e.target.value),
                                      })
                                    }
                                    className="w-full accent-emerald-500 h-1"
                                  />
                                </div>
                              </>
                            )}

                            {(selectedObject.uiElementType === "button" ||
                              selectedObject.uiElementType === "tooltip") && (
                              <div>
                                <LabelWithHelp
                                  label="Text Content"
                                  helpText="The words shown inside this button or tooltip."
                                />
                                <input
                                  type="text"
                                  value={selectedObject.textContent || ""}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      textContent: e.target.value,
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                />
                              </div>
                            )}

                            {selectedObject.uiElementType === "icon" && (
                              <div>
                                <LabelWithHelp
                                  label="Icon Type"
                                  helpText="Which icon image to display."
                                />
                                <select
                                  value={selectedObject.uiIconType || "check"}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      uiIconType: e.target.value as any,
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                >
                                  <option value="bag">Bag</option>
                                  <option value="sword">Sword</option>
                                  <option value="book">Book</option>
                                  <option value="gear">Gear</option>
                                  <option value="potion">Potion</option>
                                  <option value="key">Key</option>
                                  <option value="check">Checkmark</option>
                                  <option value="cancel">Cross (X)</option>
                                  <option value="arrow-left">Arrow Left</option>
                                  <option value="arrow-right">
                                    Arrow Right
                                  </option>
                                  <option value="arrow-up">Arrow Up</option>
                                </select>
                              </div>
                            )}

                            {selectedObject.uiElementType === "progress" && (
                              <div>
                                <LabelWithHelp
                                  label="Progress Value (0-100)"
                                  helpText="How full the bar is (e.g. for Health or Mana)."
                                />
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={selectedObject.uiValue || 0}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      uiValue: parseInt(e.target.value),
                                    })
                                  }
                                  className="w-full mt-1 accent-emerald-500"
                                />
                                <div className="text-right text-sm text-neutral-400">
                                  {selectedObject.uiValue || 0}%
                                </div>
                              </div>
                            )}

                            {selectedObject.uiElementType === "toggle" && (
                              <label className="flex items-center gap-2 cursor-pointer mt-2 bg-neutral-900 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedObject.uiChecked || false}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      uiChecked: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-medium">
                                  Checked Default State
                                </span>
                              </label>
                            )}

                            <div className="pt-4 border-t border-neutral-800 mt-4 space-y-3">
                              <LabelWithHelp
                                label="Make it Smart (Auto-Update)"
                                helpText="Make this UI element update automatically based on player health, inventory, etc."
                                className="text-sm font-bold uppercase text-neutral-400"
                              />

                              <div>
                                <label className="text-sm text-neutral-500 block mb-1">
                                  What should this show?
                                </label>
                                <select
                                  value={selectedObject.uiBindingType || "none"}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      uiBindingType: e.target.value as any,
                                      uiBindingId: "",
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm focus:border-emerald-500"
                                >
                                  <option value="none">
                                    Nothing (I'll set it manually)
                                  </option>
                                  {selectedObject.uiElementType ===
                                    "progress" && (
                                    <option value="need">
                                      Player Meter (e.g. Health/Energy)
                                    </option>
                                  )}
                                  {selectedObject.uiElementType === "button" ||
                                  selectedObject.uiElementType === "tooltip" ? (
                                    <option value="inventory_count">
                                      Amount of a specific item
                                    </option>
                                  ) : null}
                                  {selectedObject.uiElementType ===
                                    "toggle" && (
                                    <option value="flag">
                                      Is a Story Event done?
                                    </option>
                                  )}
                                </select>
                              </div>

                              {selectedObject.uiBindingType === "need" && (
                                <div>
                                  <label className="text-sm text-neutral-500 block mb-1">
                                    Which stat?
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedObject.uiBindingId || ""}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiBindingId: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm"
                                    placeholder="e.g. hunger, health"
                                  />
                                </div>
                              )}
                              {selectedObject.uiBindingType ===
                                "inventory_count" && (
                                <div>
                                  <label className="text-sm text-neutral-500 block mb-1">
                                    Which Item?
                                  </label>
                                  <select
                                    value={selectedObject.uiBindingId || ""}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiBindingId: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm"
                                  >
                                    <option value="">Select an Item...</option>
                                    {project.inventoryItems.map((i) => (
                                      <option key={i.id} value={i.id}>
                                        {i.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {selectedObject.uiBindingType === "flag" && (
                                <div>
                                  <label className="text-sm text-neutral-500 block mb-1">
                                    Which Story Event?
                                  </label>
                                  <select
                                    value={selectedObject.uiBindingId || ""}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        uiBindingId: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm"
                                  >
                                    <option value="">Select an Event...</option>
                                    {(project.gameFlags || []).map((f) => (
                                      <option key={f} value={f}>
                                        {f}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </Accordion>
                      )}

                      <Accordion title="Transform">
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                            <span>Transform</span>
                            {editorMode === "ui_stage" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x: 0,
                                      y: 0,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Top Left"
                                >
                                  ↖
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x:
                                        (currentScene?.width ||
                                          project.globalSettings.stageWidth ||
                                          800) /
                                          2 -
                                        selectedObject.width / 2,
                                      y: 0,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Top Center"
                                >
                                  ⬆
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x:
                                        (currentScene?.width ||
                                          project.globalSettings.stageWidth ||
                                          800) - selectedObject.width,
                                      y: 0,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Top Right"
                                >
                                  ↗
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x:
                                        (currentScene?.width ||
                                          project.globalSettings.stageWidth ||
                                          800) /
                                          2 -
                                        selectedObject.width / 2,
                                      y:
                                        (currentScene?.height ||
                                          project.globalSettings.stageHeight ||
                                          600) /
                                          2 -
                                        selectedObject.height / 2,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Center"
                                >
                                  ⏺
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x: 0,
                                      y:
                                        (currentScene?.height ||
                                          project.globalSettings.stageHeight ||
                                          600) - selectedObject.height,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Bottom Left"
                                >
                                  ↙
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x:
                                        (currentScene?.width ||
                                          project.globalSettings.stageWidth ||
                                          800) /
                                          2 -
                                        selectedObject.width / 2,
                                      y:
                                        (currentScene?.height ||
                                          project.globalSettings.stageHeight ||
                                          600) - selectedObject.height,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Bottom Center"
                                >
                                  ⬇
                                </button>
                                <button
                                  onClick={() =>
                                    updateObject(selectedObject.id, {
                                      x:
                                        (currentScene?.width ||
                                          project.globalSettings.stageWidth ||
                                          800) - selectedObject.width,
                                      y:
                                        (currentScene?.height ||
                                          project.globalSettings.stageHeight ||
                                          600) - selectedObject.height,
                                    })
                                  }
                                  className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                                  title="Bottom Right"
                                >
                                  ↘
                                </button>
                              </div>
                            )}
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="X"
                                helpText="Horizontal position on the screen. Left is 0."
                              />
                              <input
                                type="number"
                                value={Math.round(selectedObject.x)}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    x: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Y"
                                helpText="Vertical position on the screen. Top is 0."
                              />
                              <input
                                type="number"
                                value={Math.round(selectedObject.y)}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    y: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Width"
                                helpText="How wide the element is in pixels."
                              />
                              <input
                                type="number"
                                value={Math.round(selectedObject.width)}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    width: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Height"
                                helpText="How tall the element is in pixels."
                              />
                              <input
                                type="number"
                                value={Math.round(selectedObject.height)}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    height: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Rotation (°)"
                                helpText="Rotate the element around its center (0-360 degrees)."
                              />
                              <input
                                type="number"
                                value={Math.round(selectedObject.rotation || 0)}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    rotation: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2 pb-1">
                              <label className="flex items-center gap-1 text-sm text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!selectedObject.flipX}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      flipX: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Flip X
                              </label>
                              <label className="flex items-center gap-1 text-sm text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!selectedObject.flipY}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      flipY: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Flip Y
                              </label>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-neutral-800 flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!selectedObject.stretchToScreen}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      stretchToScreen: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Stretch to fill Screen
                              </label>
                              <select 
                                value={selectedObject.objectFit || "fill"}
                                onChange={(e) => updateObject(selectedObject.id, { objectFit: e.target.value as any })}
                                className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-xs"
                                disabled={!selectedObject.stretchToScreen}
                              >
                                <option value="fill">Fill Canvas</option>
                                <option value="contain">Scale (Contain)</option>
                                <option value="cover">Crop (Cover)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </Accordion>

                      {selectedObject.isText && !selectedObject.isUiElement && (
                        <Accordion title="Typography">
                          <div>
                            <LabelWithHelp
                              label="Content"
                              helpText="The text displayed on the screen. (You can also type plain text here to make signs or dialogue if not using nodes)."
                            />
                            <textarea
                              value={selectedObject.textContent || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  textContent: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none min-h-[60px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="Color"
                                helpText="The color of the text."
                              />
                              <div className="flex gap-2 items-center mt-1">
                                <input
                                  type="color"
                                  value={selectedObject.textColor || "#ffffff"}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      textColor: e.target.value,
                                    })
                                  }
                                  className="bg-neutral-800 border-none rounded cursor-pointer w-8 h-8 p-0"
                                />
                                <input
                                  type="text"
                                  value={selectedObject.textColor || "#ffffff"}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      textColor: e.target.value,
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Font Size (px)"
                                helpText="How large the text is."
                              />
                              <input
                                type="number"
                                min="8"
                                max="250"
                                value={selectedObject.textFontSize || 24}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textFontSize: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="Font Family"
                                helpText="The style of the text."
                              />
                              <select
                                value={
                                  selectedObject.textFontFamily || "sans-serif"
                                }
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textFontFamily: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              >
                                <option value="sans-serif">Sans Serif</option>
                                <option value="serif">Serif</option>
                                <option value="monospace">Monospace</option>
                                <option value="'Courier New', Courier, monospace">
                                  Courier New
                                </option>
                                <option value="Helvetica, Arial, sans-serif">
                                  Helvetica / Arial
                                </option>
                                <option value="'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif">
                                  Trebuchet MS
                                </option>
                                <option value="Verdana, Geneva, sans-serif">
                                  Verdana
                                </option>
                                <option value="'Times New Roman', Times, serif">
                                  Times New Roman
                                </option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="Garamond, serif">
                                  Garamond
                                </option>
                                <option value="'Comic Sans MS', 'Comic Sans', cursive">
                                  Comic Sans
                                </option>
                                <option value="'Brush Script MT', cursive">
                                  Brush Script
                                </option>
                                <option value="'Impact', sans-serif">
                                  Impact
                                </option>
                                <option value="system-ui">
                                  System Default
                                </option>
                              </select>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Font Weight"
                                helpText="How thick the text is."
                              />
                              <select
                                value={selectedObject.textWeight || "normal"}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textWeight: e.target.value as any,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                                <option value="100">Thin (100)</option>
                                <option value="300">Light (300)</option>
                                <option value="500">Medium (500)</option>
                                <option value="700">Bold (700)</option>
                                <option value="900">Black (900)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="Line Height"
                                helpText="Spacing between lines of text."
                              />
                              <input
                                type="number"
                                step="0.1"
                                min="0.5"
                                max="3"
                                value={selectedObject.textLineHeight || 1.2}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textLineHeight: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              />
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Letter Spacing (px)"
                                helpText="Spacing between letters."
                              />
                              <input
                                type="number"
                                step="0.5"
                                min="-10"
                                max="50"
                                value={selectedObject.textLetterSpacing || 0}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textLetterSpacing: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="Alignment"
                                helpText="Align text to the left, center, or right of the box."
                              />
                              <select
                                value={selectedObject.textAlign || "left"}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textAlign: e.target.value as any,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Text Shadow"
                                helpText="CSS string for text shadow."
                              />
                              <input
                                type="text"
                                value={selectedObject.textShadow || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textShadow: e.target.value,
                                  })
                                }
                                placeholder="2px 2px 4px #000"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <LabelWithHelp
                              label="Box Style"
                              helpText="Add a decorative background behind the text."
                            />
                            <select
                              value={selectedObject.textStyle || "plain"}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  textStyle: e.target.value as any,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                            >
                              <option value="plain">Plain Text</option>
                              <option value="narrative">
                                Narrative Box (Dark)
                              </option>
                              <option value="speech">
                                Speech Bubble (Light)
                              </option>
                              <option value="thought">Thought Bubble</option>
                              <option value="sign">Wooden Sign</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3 mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedObject.textOutline || false}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    textOutline: e.target.checked,
                                  })
                                }
                                className="bg-neutral-900 border-neutral-700 text-emerald-500 rounded focus:ring-emerald-500"
                              />
                              <span className="text-sm text-neutral-400 font-medium">
                                Text Outline Stroke
                              </span>
                            </label>

                            {selectedObject.textOutline && (
                              <div>
                                <label className="text-sm text-neutral-500 block mb-1">
                                  Outline Color
                                </label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={
                                      selectedObject.textOutlineColor ||
                                      "#000000"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        textOutlineColor: e.target.value,
                                      })
                                    }
                                    className="bg-neutral-800 border-none rounded cursor-pointer w-8 h-8 p-0"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      selectedObject.textOutlineColor ||
                                      "#000000"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        textOutlineColor: e.target.value,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Accordion>
                      )}

                      {/* Layering */}
                      <Accordion title="Visual Layers & Sorting">
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center gap-1">
                            <LabelWithHelp
                              label="Layer Order"
                              helpText="Determines which objects appear in front. Higher numbers are closer to the camera."
                            />
                            : {selectedObject.zIndex}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const minZ = Math.min(
                                  ...currentScene.objects.map((o) => o.zIndex),
                                );
                                updateObject(selectedObject.id, {
                                  zIndex: minZ - 1,
                                });
                              }}
                              className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                              title="Send to Back"
                            >
                              <ArrowDownToLine size={14} />
                            </button>
                            <button
                              onClick={() => moveZIndex(selectedObject.id, -1)}
                              className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                              title="Move Down"
                            >
                              <MoveDown size={14} />
                            </button>
                            <button
                              onClick={() => moveZIndex(selectedObject.id, 1)}
                              className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                              title="Move Up"
                            >
                              <MoveUp size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const maxZ = Math.max(
                                  ...currentScene.objects.map((o) => o.zIndex),
                                );
                                updateObject(selectedObject.id, {
                                  zIndex: maxZ + 1,
                                });
                              }}
                              className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                              title="Bring to Front"
                            >
                              <ArrowUpToLine size={14} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center">
                            <LabelWithHelp
                              label="Opacity"
                              helpText="How transparent the object is. 100% is fully visible, 0% is invisible."
                            />
                            <span className="text-sm text-neutral-500">
                              {Math.round(selectedObject.opacity * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={selectedObject.opacity}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                opacity: Number(e.target.value),
                              })
                            }
                            className="w-full accent-emerald-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={selectedObject.ignoreClicks || false}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                ignoreClicks: e.target.checked,
                              })
                            }
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                            id="ignoreClicksToggle"
                          />
                          <label
                            htmlFor="ignoreClicksToggle"
                            className="text-sm font-bold text-neutral-300 select-none cursor-pointer"
                          >
                            Ignore Clicks (Pass-through)
                          </label>
                        </div>
                        <div>
                          <div className="flex justify-between items-center">
                            <LabelWithHelp
                              label="Parallax"
                              helpText="Scroll speed. 1 is normal, <1 is background, >1 is foreground."
                            />
                            <span className="text-sm text-neutral-500">
                              {selectedObject.parallaxSpeed !== undefined
                                ? selectedObject.parallaxSpeed.toFixed(1)
                                : "1.0"}
                              x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={
                              selectedObject.parallaxSpeed !== undefined
                                ? selectedObject.parallaxSpeed
                                : 1
                            }
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                parallaxSpeed: Number(e.target.value),
                              })
                            }
                            className="w-full accent-emerald-500"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedObject.locked}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                locked: e.target.checked,
                              })
                            }
                            className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-neutral-800"
                          />
                          Lock Position
                        </label>
                        <div>
                          <LabelWithHelp
                            label="Custom CSS Classes"
                            helpText="Add any Tailwind classes here to customize the element (e.g. 'rounded-full border-4 border-red-500')."
                          />
                          <input
                            type="text"
                            value={selectedObject.customCssClasses || ""}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                customCssClasses: e.target.value,
                              })
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. animate-bounce hover:scale-110"
                          />
                        </div>
                      </Accordion>

                      {/* Appearance & Filters */}
                      {!selectedObject.isUiElement && (
                        <Accordion title="Rendering & Blend Modes">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-400">Tools</span>
                            {!selectedObject.isHitbox &&
                              !selectedObject.isText &&
                              !selectedObject.isScript && (
                                <button
                                  onClick={() =>
                                    setEditingAssetId(
                                      project.assets.find(
                                        (a) => a.src === selectedObject.src,
                                      )?.id || null,
                                    )
                                  }
                                  className="text-sm bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 flex items-center gap-1 font-bold"
                                  title="Open Image Editor to remove background, crop, or recolor"
                                >
                                  <Wand2 size={10} /> Edit Image
                                </button>
                              )}
                          </div>
                          <div>
                            <LabelWithHelp
                              label="Visual Blending"
                              helpText="How this layer mixes visually with layers behind it."
                            />
                            <select
                              value={selectedObject.blendMode || "normal"}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  blendMode: e.target.value as BlendMode,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                            >
                              <option value="normal">Normal</option>
                              <option value="multiply">Multiply</option>
                              <option value="screen">Screen</option>
                              <option value="overlay">Overlay</option>
                              <option value="darken">Darken</option>
                              <option value="lighten">Lighten</option>
                              <option value="color-dodge">Color Dodge</option>
                              <option value="color-burn">Color Burn</option>
                              <option value="hard-light">Hard Light</option>
                              <option value="soft-light">Soft Light</option>
                              <option value="difference">Difference</option>
                              <option value="exclusion">Exclusion</option>
                              <option value="hue">Hue</option>
                              <option value="saturation">Saturation</option>
                              <option value="color">Color</option>
                              <option value="luminosity">Luminosity</option>
                            </select>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Brightness</span>
                                <span>
                                  {Math.round(
                                    (selectedObject.filters?.brightness ?? 1) *
                                      100,
                                  )}
                                  %
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="3"
                                step="0.1"
                                value={selectedObject.filters?.brightness ?? 1}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      brightness: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Contrast</span>
                                <span>
                                  {Math.round(
                                    (selectedObject.filters?.contrast ?? 1) *
                                      100,
                                  )}
                                  %
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="3"
                                step="0.1"
                                value={selectedObject.filters?.contrast ?? 1}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      contrast: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Saturation</span>
                                <span>
                                  {Math.round(
                                    (selectedObject.filters?.saturate ?? 1) *
                                      100,
                                  )}
                                  %
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="3"
                                step="0.1"
                                value={selectedObject.filters?.saturate ?? 1}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      saturate: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Hue Shift</span>
                                <span>
                                  {selectedObject.filters?.hueRotate ?? 0}°
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="1"
                                value={selectedObject.filters?.hueRotate ?? 0}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      hueRotate: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Blur</span>
                                <span>
                                  {selectedObject.filters?.blur ?? 0}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="20"
                                step="0.5"
                                value={selectedObject.filters?.blur ?? 0}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      blur: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                              <label className="flex items-center gap-1 text-sm text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    (selectedObject.filters?.sepia ?? 0) > 0
                                  }
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      filters: {
                                        ...selectedObject.filters,
                                        sepia: e.target.checked ? 1 : 0,
                                      },
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Sepia
                              </label>
                              <label className="flex items-center gap-1 text-sm text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    (selectedObject.filters?.invert ?? 0) > 0
                                  }
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      filters: {
                                        ...selectedObject.filters,
                                        invert: e.target.checked ? 1 : 0,
                                      },
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Invert
                              </label>

                              <button
                                onClick={() =>
                                  updateObject(selectedObject.id, {
                                    filters: undefined,
                                  })
                                }
                                className="ml-auto text-sm text-red-400 hover:text-red-300 px-2 py-0.5 border border-red-500/30 rounded bg-red-500/10"
                                title="Reset Filters"
                              >
                                Reset
                              </button>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-sm text-neutral-500 mb-1">
                                <span>Grayscale</span>
                                <span>
                                  {Math.round(
                                    (selectedObject.filters?.grayscale ?? 0) *
                                      100,
                                  )}
                                  %
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={selectedObject.filters?.grayscale ?? 0}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    filters: {
                                      ...selectedObject.filters,
                                      grayscale: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full accent-emerald-500 h-1"
                              />
                            </div>
                          </div>
                        </Accordion>
                      )}

                      {/* Physics */}
                      {!selectedObject.isUiElement &&
                        !selectedObject.isText && (
                          <Accordion title="Colliders & Physics">
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white">
                              <input
                                type="checkbox"
                                checked={!!selectedObject.hasPhysics}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    hasPhysics: e.target.checked,
                                  })
                                }
                                className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
                              />
                              Enable Physics
                            </label>
                            {selectedObject.hasPhysics && (
                              <div className="space-y-3 mt-2 pl-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedObject.physicsStatic}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        physicsStatic: e.target.checked,
                                      })
                                    }
                                    className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  Is Static Object
                                </label>

                                <div>
                                  <div className="flex justify-between text-sm text-neutral-500 mb-1">
                                    <span>Bounciness</span>
                                    <span>
                                      {selectedObject.physicsBounciness ?? 0.6}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1.5"
                                    step="0.1"
                                    value={
                                      selectedObject.physicsBounciness ?? 0.6
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        physicsBounciness: parseFloat(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="w-full accent-emerald-500 h-1"
                                  />
                                </div>

                                <div>
                                  <div className="flex justify-between text-sm text-neutral-500 mb-1">
                                    <span>Friction</span>
                                    <span>
                                      {selectedObject.physicsFriction ?? 0.1}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={
                                      selectedObject.physicsFriction ?? 0.1
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        physicsFriction: parseFloat(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="w-full accent-emerald-500 h-1"
                                  />
                                </div>

                                <div>
                                  <div className="flex justify-between text-sm text-neutral-500 mb-1">
                                    <span>Density</span>
                                    <span>
                                      {selectedObject.physicsDensity ?? 0.05}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.01"
                                    max="1"
                                    step="0.01"
                                    value={
                                      selectedObject.physicsDensity ?? 0.05
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        physicsDensity: parseFloat(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="w-full accent-emerald-500 h-1"
                                  />
                                </div>

                                <p className="text-sm text-neutral-500 leading-snug pt-1">
                                  Drag objects around with the mouse while
                                  playing!
                                </p>
                              </div>
                            )}
                          </Accordion>
                        )}

                      {/* Interaction */}
                      <Accordion title="Behaviors & Events">
                        <div>
                          <LabelWithHelp
                            label="Cursor on Hover"
                            helpText="The mouse pointer style when hovering over this object."
                          />
                          <select
                            value={selectedObject.cursor}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                cursor: e.target.value as CursorType,
                              })
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                          >
                            <option value="default">Default</option>
                            <option value="pointer">Pointer (Hand)</option>
                            <option value="help">Help (Question)</option>
                            <option value="text">Conversation (Text)</option>
                            <option value="crosshair">Crosshair</option>
                            <option value="zoom-in">Eye (Look)</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mt-4 mb-2 bg-neutral-900 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedObject.isDraggable || false}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                isDraggable: e.target.checked,
                              })
                            }
                            className="bg-neutral-800 border-neutral-700 rounded w-4 h-4 text-emerald-500 focus:ring-emerald-500 text-sm cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                              Draggable in-game
                            </span>
                            <span className="text-xs text-neutral-400">
                              Player can drag this object during gameplay.
                            </span>
                          </div>
                        </label>

                        <div>
                          <LabelWithHelp
                            label="Animation"
                            helpText="A continuous visual effect applied to the object."
                          />
                          <select
                            value={selectedObject.animation}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                animation: e.target.value as AnimationType,
                              })
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 mb-2"
                          >
                            <option value="none">None</option>
                            <option value="wiggle">Wiggle</option>
                            <option value="pulse">Pulse</option>
                            <option value="glow">Glow</option>
                            <option value="float">Float</option>
                            <option value="spin">Spin</option>
                            <option value="shake">Shake</option>
                            <option value="bounce">Bounce</option>
                            <option value="fade">Fade</option>
                            <option value="slide-in">Slide In (Left)</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-down">Slide Down</option>
                            <option value="zoom">Zoom</option>
                          </select>

                          {selectedObject.animation !== "none" &&
                            selectedObject.animation !== "glow" && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm text-neutral-500 uppercase tracking-wider">
                                    Duration (s)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={
                                      selectedObject.animationDuration ||
                                      (selectedObject.animation === "pulse"
                                        ? 2
                                        : selectedObject.animation === "float"
                                          ? 3
                                          : 0.5)
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        animationDuration: parseFloat(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-500 uppercase tracking-wider">
                                    Easing
                                  </label>
                                  <select
                                    value={
                                      selectedObject.animationEasing ||
                                      "ease-in-out"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        animationEasing: e.target.value as any,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                  >
                                    <option value="linear">Linear</option>
                                    <option value="ease">Ease</option>
                                    <option value="ease-in">Ease In</option>
                                    <option value="ease-out">Ease Out</option>
                                    <option value="ease-in-out">
                                      Ease In-Out
                                    </option>
                                  </select>
                                </div>
                              </div>
                            )}
                        </div>

                        <div>
                          <LabelWithHelp
                            label="On Click SFX"
                            helpText="Optional sound to play whenever this object is clicked, regardless of its interaction type."
                          />
                          <select
                            value={selectedObject.audioSrc || ""}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                audioSrc: e.target.value,
                              })
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 mb-3 focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="">None</option>
                            {project.assets
                              .filter((a) => a.type === "audio")
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                          </select>

                          <LabelWithHelp
                            label="On Click Action"
                            helpText="What happens when the player clicks this object."
                          />
                          <select
                            value={selectedObject.interaction}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                interaction: e.target.value as InteractionType,
                              })
                            }
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                          >
                            <option value="none">None (No Action)</option>

                            <optgroup label="Story & Dialogues">
                              <option value="dialogue">Start Conversation (Dialogue Tree)</option>
                              <option value="set_flag">Trigger Story Event (Flags)</option>
                              <option value="skill_check">Skill Check (Attributes/Dice)</option>
                            </optgroup>

                            <optgroup label="Items & Inventory">
                              <option value="give-item">Give Item to Player</option>
                              <option value="collect">Collect Item (And Hide Object)</option>
                              <option value="open_crafting">Open Crafting Menu</option>
                            </optgroup>

                            <optgroup label="Navigation & Scenes (Maps)">
                              <option value="scene_change">Change Room / Teleport Map</option>
                              <option value="open_map">Open Fast Travel Map</option>
                            </optgroup>

                            <optgroup label="Quests & Lore">
                              <option value="start_quest">Start Quest</option>
                              <option value="complete_quest">Complete Quest (Force)</option>
                              <option value="open_quest_log">Open Quest Log</option>
                              <option value="open_almanac">Open Almanac / Lore</option>
                              <option value="open_relationships">Open Relationships Menu</option>
                            </optgroup>

                            <optgroup label="Overlays & Interface">
                              <option value="open_ui">Open Custom UI Canvas</option>
                              <option value="close_ui">Close UI Canvas</option>
                              <option value="toggle_inventory">Toggle Built-in Inventory</option>
                              <option value="open_skills">Open Skills Menu</option>
                              <option value="open_settings">Open Player Settings</option>
                            </optgroup>

                            <optgroup label="Media & Code">
                              <option value="play_cutscene">Play Fullscreen Video (Cutscene)</option>
                              <option value="sound">Play SFX / Audio</option>
                              <option value="run_script">Execute Custom Script</option>
                              <option value="link">Open Web URL</option>
                              <option value="modify_number">Modify Number Var (Progress/Text)</option>
                            </optgroup>

                            <optgroup label="System Controls">
                              <option value="save_game">Save Game State</option>
                              <option value="load_game">Load Game State</option>
                              <option value="restart_scene">Restart Current Region</option>
                              <option value="restart_game">Restart Full Game</option>
                              <option value="toggle_fullscreen">Toggle Fullscreen</option>
                              <option value="toggle_mute">Toggle Audio Mute</option>
                              <option value="exit_game">Close Game Execution</option>
                            </optgroup>
                          </select>

                          {selectedObject.interaction !== "none" && (
                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-neutral-800">
                              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={!!selectedObject.triggerOnEnter}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      triggerOnEnter: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span>
                                  Trigger on Mouse Enter (Hover / Map Trigger)
                                </span>
                              </label>
                              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={!!selectedObject.triggerOnce}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      triggerOnce: e.target.checked,
                                    })
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span>Fire only once per Play session</span>
                              </label>
                            </div>
                          )}
                        </div>

                        {selectedObject.interaction === "sound" && (
                          <div>
                            <label className="text-sm text-neutral-500">
                              Audio Asset
                            </label>
                            <select
                              value={selectedObject.interactionData || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  interactionData: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">Select an audio clip...</option>
                              {project.assets
                                .filter((a) => a.type === "audio")
                                .map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        {selectedObject.interaction === "play_cutscene" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-neutral-500">
                                Video Asset
                              </label>
                              <button
                                onClick={() => setAssetPickerCb({
                                  onSelect: (id) => updateObject(selectedObject.id, { interactionData: id }),
                                  filterType: "video"
                                })}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 rounded px-3 py-2 text-sm flex items-center justify-between transition-colors mt-1"
                              >
                                <span className="text-neutral-300 truncate pr-2">
                                  {selectedObject.interactionData
                                    ? project.assets.find((a) => a.id === selectedObject.interactionData)?.name || "Unknown Video"
                                    : "Select a video..."}
                                </span>
                                <Video size={16} className="text-neutral-500" />
                              </button>
                            </div>
                            <div>
                              <label className="text-sm text-neutral-500">
                                Jump to Scene after video (Optional)
                              </label>
                              <select
                                value={selectedObject.scriptAssetId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    scriptAssetId: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="">
                                  None / Stay on current scene
                                </option>
                                {(project.scenes || []).map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {(selectedObject.interaction === "start_quest" ||
                          selectedObject.interaction === "complete_quest") && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm text-neutral-500">
                                Select Quest
                              </label>
                              {selectedObject.interactionData && (
                                <button
                                  onClick={() => {
                                    setRpgTab("quests");
                                    setEditorMode("rpg_systems");
                                  }}
                                  className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-0.5 rounded"
                                >
                                  <MapIcon size={10} /> Edit Quest
                                </button>
                              )}
                            </div>
                            <select
                              value={selectedObject.interactionData || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  interactionData: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">Select a quest...</option>
                              {(project.quests || []).map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedObject.interaction === "set_flag" && (
                          <div>
                            <label className="text-sm text-neutral-500">
                              Select Story Event
                            </label>
                            <select
                              value={selectedObject.interactionData || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  interactionData: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">Select an event...</option>
                              {(project.gameFlags || []).map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedObject.interaction === "dialogue" && (
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center">
                                <label className="text-sm text-neutral-500">
                                  Link to Dialogue Tree
                                </label>
                                {selectedObject.dialogueTreeId && (
                                  <button
                                    onClick={() => setEditorMode("dialogue")}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded"
                                  >
                                    <MessageSquare size={10} /> Edit Tree
                                  </button>
                                )}
                              </div>
                              <select
                                value={selectedObject.dialogueTreeId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    dialogueTreeId: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              >
                                <option value="">
                                  No tree (use simple text)
                                </option>
                                {(project.dialogueTrees || []).map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {!selectedObject.dialogueTreeId && (
                              <div>
                                <label className="text-sm text-neutral-500">
                                  Simple Text Popup
                                </label>
                                <textarea
                                  value={selectedObject.interactionData || ""}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      interactionData: e.target.value,
                                    })
                                  }
                                  placeholder="Enter simple message... (Used if no Dialogue Tree is selected)"
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 min-h-[60px]"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-4 border-t border-neutral-800">
                          <h4 className="text-sm uppercase tracking-wider text-neutral-500 font-bold mb-3 flex items-center gap-2">
                            <Eye size={12} />
                            Visibility Conditions
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <LabelWithHelp
                                label="Show Only If Event Happened"
                                helpText="This object will be completely invisible until this story event occurs."
                              />
                              <select
                                value={selectedObject.showIfFlag || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    showIfFlag: e.target.value || undefined,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500"
                              >
                                <option value="">None / Always Show</option>
                                {(project.gameFlags || []).map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Hide If Event Happened"
                                helpText="This object will disappear permanently once this story event occurs."
                              />
                              <select
                                value={selectedObject.hideIfFlag || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    hideIfFlag: e.target.value || undefined,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500"
                              >
                                <option value="">None / Never Hide</option>
                                {(project.gameFlags || []).map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-800">
                          <h4 className="text-sm uppercase tracking-wider text-neutral-500 font-bold mb-3 flex items-center gap-2">
                            <Backpack size={12} />
                            Inventory Requirements
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <LabelWithHelp
                                  label="Required Item to Click"
                                  helpText="If set, the player must have this item in their inventory to interact with this object."
                                />
                                <div className="flex items-center gap-1">
                                  {selectedObject.requireItemId && (
                                      <button
                                        onClick={() => {
                                          setItemsTab("items");
                                          setEditorMode("items");
                                        }}
                                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded"
                                      >
                                        <Package size={10} /> Edit Item
                                      </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (!currentScene) return;
                                      const newItem = {
                                        id: uuidv4(),
                                        name: "New Required Item",
                                        description: "",
                                        iconAssetId: null,
                                        type: "key" as any,
                                      };
                                      const isUI = editorMode === "ui_stage";
                                      const newProject = {
                                        ...project,
                                        inventoryItems: [
                                          ...project.inventoryItems,
                                          newItem as any,
                                        ],
                                        [isUI ? "uiMenus" : "scenes"]: (isUI ? project.uiMenus : project.scenes).map((s: any) =>
                                          s.id === currentScene.id
                                            ? {
                                                ...s,
                                                objects: s.objects.map((o: any) =>
                                                  o.id === selectedObject.id
                                                    ? {
                                                        ...o,
                                                        requireItemId: newItem.id,
                                                      }
                                                    : o,
                                                ),
                                              }
                                            : s,
                                        ),
                                      };
                                      setProject(newProject);
                                      pushHistory(newProject);
                                      setItemsTab("items");
                                      setEditorMode("items");
                                    }}
                                    className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded"
                                  >
                                    <Plus size={10} /> Quick Create
                                  </button>
                                </div>
                              </div>
                              <select
                                value={selectedObject.requireItemId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    requireItemId: e.target.value || undefined,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="">
                                  None (Always Interactable)
                                </option>
                                {project.inventoryItems.map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name}
                                  </option>
                                ))}
                              </select>
                              {selectedObject.requireItemId && (
                                <label className="flex items-center gap-2 mt-2 text-sm text-neutral-400 cursor-pointer hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!selectedObject.consumeRequiredItem
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        consumeRequiredItem: e.target.checked,
                                      })
                                    }
                                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  Consume item on use?
                                </label>
                              )}
                            </div>

                            {(selectedObject.interaction === "give-item" ||
                              selectedObject.interaction === "collect") && (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm text-neutral-500">
                                      Item to Give
                                    </label>
                                    <div className="flex items-center gap-1">
                                      {selectedObject.giveItemId && (
                                        <button
                                          onClick={() => {
                                            setItemsTab("items");
                                            setEditorMode("items");
                                          }}
                                          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded"
                                        >
                                          <Package size={10} /> Edit Item Settings
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (!currentScene) return;
                                          const newItem = {
                                            id: uuidv4(),
                                            name:
                                              selectedObject.name || "New Item",
                                            description: "",
                                            iconAssetId: selectedObject.src
                                              ? project.assets.find(
                                                  (a) =>
                                                    a.src === selectedObject.src,
                                                )?.id || null
                                              : null,
                                          };
                                          const isUI = editorMode === "ui_stage";
                                          const newProject = {
                                            ...project,
                                            inventoryItems: [
                                              ...project.inventoryItems,
                                              newItem as any,
                                            ],
                                            [isUI ? "uiMenus" : "scenes"]: (isUI ? project.uiMenus : project.scenes).map((s: any) =>
                                              s.id === currentScene.id
                                                ? {
                                                    ...s,
                                                    objects: s.objects.map((o: any) =>
                                                      o.id === selectedObject.id
                                                        ? {
                                                            ...o,
                                                            giveItemId: newItem.id,
                                                          }
                                                        : o,
                                                    ),
                                                  }
                                                : s,
                                            ),
                                          };
                                          setProject(newProject);
                                          pushHistory(newProject);
                                          setItemsTab("items");
                                          setEditorMode("items");
                                        }}
                                        className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded"
                                      >
                                        <Plus size={10} /> Quick Create Item
                                      </button>
                                    </div>
                                  </div>
                                  <select
                                    value={selectedObject.giveItemId || ""}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        giveItemId: e.target.value,
                                      })
                                    }
                                    className={`w-full bg-neutral-800 border ${!selectedObject.giveItemId ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-neutral-700"} rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none`}
                                  >
                                    <option value="">Select an item...</option>
                                    {project.inventoryItems.map((i) => (
                                      <option key={i.id} value={i.id}>
                                        {i.name}
                                      </option>
                                    ))}
                                  </select>
                                  {!selectedObject.giveItemId && (
                                    <p className="text-sm text-amber-500 mt-1">
                                      ⚠️ You must select an item for it to
                                      appear in the inventory block.
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-500">
                                    Collection Message
                                  </label>
                                  <textarea
                                    value={selectedObject.interactionData || ""}
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        interactionData: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. You found a rusty key!"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 min-h-[60px]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedObject.interaction === "run_script" && (
                          <div>
                            <label className="text-sm text-neutral-500">
                              Script Asset
                            </label>
                            <button
                                onClick={() => setAssetPickerCb({
                                  onSelect: (id) => updateObject(selectedObject.id, { scriptAssetId: id }),
                                  filterType: "script"
                                })}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 rounded px-3 py-2 text-sm flex items-center justify-between transition-colors mt-1"
                              >
                                <span className="text-neutral-300 truncate pr-2">
                                  {selectedObject.scriptAssetId
                                    ? project.assets.find((a) => a.id === selectedObject.scriptAssetId)?.name || "Unknown Script"
                                    : "Select a script..."}
                                </span>
                                <FileCode size={16} className="text-neutral-500" />
                            </button>
                          </div>
                        )}

                        {["link", "skill_check"].includes(
                          selectedObject.interaction,
                        ) && (
                          <div>
                            <label className="text-sm text-neutral-500">
                              {selectedObject.interaction === "skill_check"
                                ? "Success Dialogue"
                                : "Action Data"}
                            </label>
                            <textarea
                              value={selectedObject.interactionData || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  interactionData: e.target.value,
                                })
                              }
                              placeholder={
                                selectedObject.interaction === "link"
                                  ? "https://..."
                                  : "Text shown on success..."
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 min-h-[60px]"
                            />
                          </div>
                        )}

                        {selectedObject.interaction === "scene_change" && (
                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-sm text-neutral-500">
                                Target Map / Scene
                              </label>
                              {selectedObject.interactionData && (
                                <button
                                  onClick={() => {
                                    setProject((p) => ({ ...p, currentSceneId: selectedObject.interactionData || "" }));
                                    setEditorMode("stage");
                                  }}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded"
                                >
                                  <ImageIcon size={10} /> Edit Scene
                                </button>
                              )}
                            </div>
                            <select
                              value={selectedObject.interactionData || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  interactionData: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">Select a scene...</option>
                              {project.scenes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}{" "}
                                  {s.id === project.currentSceneId
                                    ? "(Current)"
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(selectedObject.interaction === "open_ui" ||
                          selectedObject.interaction === "close_ui") && (
                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-sm text-neutral-500">
                                {selectedObject.interaction === "open_ui"
                                  ? "Target Custom UI Canvas"
                                  : "Canvas to Close (Optional)"}
                              </label>
                              {selectedObject.interaction === "open_ui" && selectedObject.targetUiId && (
                                <button
                                  onClick={() => {
                                    setProject((p) => ({ ...p, currentUiMenuId: selectedObject.targetUiId || "" }));
                                    setEditorMode("ui_stage");
                                  }}
                                  className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-bold tracking-wide uppercase bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-2 py-0.5 rounded"
                                >
                                  <LayoutTemplate size={10} /> Edit UI
                                </button>
                              )}
                            </div>
                            <select
                              value={selectedObject.targetUiId || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  targetUiId: e.target.value,
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">
                                {selectedObject.interaction === "open_ui"
                                  ? "Select a UI Canvas..."
                                  : "Currently Active Menu"}
                              </option>
                              {(project.uiMenus || []).map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedObject.interaction === "modify_number" && (
                          <div className="space-y-2">
                            <div>
                              <LabelWithHelp
                                label="Target Object"
                                helpText="The progress bar or text object to modify"
                              />
                              <select
                                value={selectedObject.targetUiId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    targetUiId: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="">Select an object...</option>
                                {currentScene?.objects
                                  .filter((o) => o.isUiElement || o.isText)
                                  .map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                {(project.uiMenus || []).flatMap((menu) =>
                                  menu.objects
                                    .filter((o) => o.isUiElement || o.isText)
                                    .map((o) => (
                                      <option key={o.id} value={o.id}>
                                        {menu.name} - {o.name}
                                      </option>
                                    )),
                                )}
                              </select>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Amount"
                                helpText="Positive to add, negative to subtract"
                              />
                              <input
                                type="number"
                                value={selectedObject.interactionData || 0}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    interactionData: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </Accordion>

                      {/* Relationships */}
                      {!selectedObject.isUiElement && (
                        <Accordion title="Grouping & Links">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <LabelWithHelp
                                label="Attach to Object"
                                helpText="Link this object to another so they move together as a group."
                              />
                              <select
                                value={selectedObject.parentObjectId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    parentObjectId: e.target.value,
                                  })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              >
                                <option value="">None (Independent)</option>
                                {currentScene.objects
                                  .filter((o) => o.id !== selectedObject.id)
                                  .map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name ||
                                        `Object (${o.id.substring(0, 4)})`}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <LabelWithHelp
                                label="Character Reputation ID"
                                helpText="Used to track relationship points with this character."
                              />
                              <input
                                type="text"
                                value={selectedObject.affinityId || ""}
                                onChange={(e) =>
                                  updateObject(selectedObject.id, {
                                    affinityId: e.target.value,
                                  })
                                }
                                placeholder="e.g. 'mayor_bob'"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                              />
                            </div>
                          </div>
                        </Accordion>
                      )}

                      {/* RPG / Sim Elements */}
                      {!selectedObject.isUiElement && (
                        <Accordion title="RPG Systems & Metadata">
                          <div>
                            <LabelWithHelp
                              label="Flavor Text (Hover)"
                              helpText="Text shown briefly when the player hovers over the object."
                            />
                            <input
                              type="text"
                              value={selectedObject.flavorText || ""}
                              onChange={(e) =>
                                updateObject(selectedObject.id, {
                                  flavorText: e.target.value,
                                })
                              }
                              placeholder="e.g. 'It smells like old moss...'"
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                            />
                          </div>

                          {project.globalSettings.enableTTRPGStats &&
                            selectedObject.interaction === "skill_check" && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <LabelWithHelp
                                    label="Required Skill"
                                    helpText="A skill check the player must pass to interact with this object."
                                  />
                                  <select
                                    value={
                                      selectedObject.requiredSkill || "none"
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        requiredSkill: e.target.value as any,
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                  >
                                    <option value="none">None</option>
                                    {(
                                      project.globalSettings?.customSkills || [
                                        "naturalist",
                                        "occultist",
                                        "scribal",
                                      ]
                                    ).map((skill) => (
                                      <option key={skill} value={skill}>
                                        {skill}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-500">
                                    Difficulty (DC)
                                  </label>
                                  <input
                                    type="number"
                                    value={
                                      selectedObject.skillCheckDifficulty || 10
                                    }
                                    onChange={(e) =>
                                      updateObject(selectedObject.id, {
                                        skillCheckDifficulty: Number(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                  />
                                </div>
                              </div>
                            )}

                          {project.globalSettings.enableNeeds && (
                            <div>
                              <LabelWithHelp
                                label="Needs Effect (JSON)"
                                helpText='JSON object modifying player needs (e.g., {"hunger": -10}).'
                              />
                              <textarea
                                value={
                                  selectedObject.needsEffect
                                    ? JSON.stringify(selectedObject.needsEffect)
                                    : ""
                                }
                                onChange={(e) => {
                                  try {
                                    const val = e.target.value
                                      ? JSON.parse(e.target.value)
                                      : undefined;
                                    updateObject(selectedObject.id, {
                                      needsEffect: val,
                                    });
                                  } catch (err) {} // Ignore invalid JSON while typing
                                }}
                                placeholder='{"rest": 10, "hunger": -5}'
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1 font-mono text-sm"
                              />
                            </div>
                          )}

                          {project.globalSettings.enableTTRPGStats && (
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800">
                              <div>
                                <LabelWithHelp
                                  label="Grant Skill XP"
                                  helpText="What skill does the player gain experience in when interacting?"
                                />
                                <select
                                  value={selectedObject.grantSkill || "none"}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      grantSkill: e.target.value as any,
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                >
                                  <option value="none">None</option>
                                  {(
                                    project.globalSettings?.customSkills || [
                                      "naturalist",
                                      "occultist",
                                      "scribal",
                                    ]
                                  ).map((skill) => (
                                    <option key={skill} value={skill}>
                                      {skill}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-sm text-neutral-500">
                                  Amount XP
                                </label>
                                <input
                                  type="number"
                                  value={selectedObject.grantSkillValue || 1}
                                  onChange={(e) =>
                                    updateObject(selectedObject.id, {
                                      grantSkillValue: Number(e.target.value),
                                    })
                                  }
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Accordion>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t border-neutral-800 flex gap-2">
                        <button
                          onClick={() => {
                            const newObj = {
                              ...selectedObject,
                              id: uuidv4(),
                              x: selectedObject.x + 20,
                              y: selectedObject.y + 20,
                              zIndex:
                                Math.max(
                                  ...currentScene.objects.map((o) => o.zIndex),
                                  0,
                                ) + 1,
                            };
                            updateScene({
                              objects: [...currentScene.objects, newObj],
                            });
                            setSelectedObjectId(newObj.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            updateScene({
                              objects: currentScene.objects.filter(
                                (o) => o.id !== selectedObject.id,
                              ),
                            });
                            setSelectedObjectId(null);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-sm transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </aside>
          </>
        )}

        {editorMode === "dialogue" && (
          <div className="flex-1 flex gap-6 p-6 bg-neutral-950 overflow-hidden relative">
            <div
              className="flex flex-col gap-4 border-r border-neutral-800 pr-6 relative flex-shrink-0"
              style={{ width: leftSidebarWidth }}
            >
              <div
                className="absolute top-0 bottom-0 -right-[3px] w-[6px] cursor-col-resize z-[100] hover:bg-emerald-500/50"
                onPointerDown={() =>
                  document.body.classList.add("resizing-left-sidebar")
                }
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newTree: DialogueTree = {
                      id: uuidv4(),
                      name: "New Conversation",
                      nodes: [],
                      startNodeId: null,
                    };
                    pushHistory({
                      ...project,
                      dialogueTrees: [...project.dialogueTrees, newTree],
                    });
                    setActiveTreeId(newTree.id);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 text-sm"
                >
                  <Plus size={16} /> New Conversation
                </button>
                <div className="flex gap-1 relative group">
                   <button className="flex items-center justify-center gap-2 px-3 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 text-sm">
                      IO
                   </button>
                   <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-neutral-900 border border-neutral-700 rounded shadow-xl z-[50] min-w-[200px]">
                      <div 
                        className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs"
                        onClick={() => downloadJSON({ type: 'dialogueTrees', version: '1.0', data: project.dialogueTrees }, 'dialogue_trees.json')}
                      >Export JSON</div>
                      <div 
                        className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs relative"
                      >
                         Import JSON
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                               const parsed = await loadJSON(file);
                               if (parsed.type === 'dialogueTrees') {
                                  pushHistory({ ...project, dialogueTrees: parsed.data });
                               } else if (parsed.type === 'dialogueTree') {
                                  pushHistory({ ...project, dialogueTrees: [...project.dialogueTrees, parsed.data] });
                               }
                            } catch (e) { alert("Failed to parse JSON"); }
                         }} />
                      </div>
                      <div className="border-t border-neutral-700 my-1"></div>
                      <div 
                        className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs text-yellow-400"
                        onClick={() => {
                           if (!activeTreeId && project.dialogueTrees.length === 0) return;
                           const targetTree = project.dialogueTrees.find(t => t.id === activeTreeId) || project.dialogueTrees[0];
                           const twee = exportToTwee(targetTree);
                           downloadText(twee, `${targetTree.name.replace(/[^a-z0-9]/gi, '_')}.twee`);
                        }}
                      >Export Active to Twine (Twee)</div>
                      <div 
                        className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs text-yellow-400 relative"
                      >
                         Import Twine (Twee)
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".twee,.txt" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                               const text = await loadText(file);
                               const newTree = importFromTwee(text);
                               pushHistory({ ...project, dialogueTrees: [...project.dialogueTrees, newTree] });
                               setActiveTreeId(newTree.id);
                            } catch (e) { alert("Failed to parse Twine"); }
                         }} />
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {(project.dialogueTrees || []).map((tree, idx) => {
                  const isActive = activeTreeId
                    ? activeTreeId === tree.id
                    : idx === 0;
                  return (
                    <div
                      key={tree.id}
                      onClick={() => setActiveTreeId(tree.id)}
                      className={`p-3 rounded cursor-pointer border ${isActive ? "bg-neutral-800 border-emerald-500" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"}`}
                    >
                      <div className="font-medium text-sm">{tree.name}</div>
                      <div className="text-sm text-neutral-500">
                        {(tree.nodes || []).length} nodes
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                  Dialogue Styling
                </h3>
                <div>
                  <label className="text-sm text-neutral-400 block mb-1">
                    Position
                  </label>
                  <select
                    value={project.globalSettings.dialoguePosition || "bottom"}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        globalSettings: {
                          ...p.globalSettings,
                          dialoguePosition: e.target.value as
                            | "top"
                            | "center"
                            | "bottom"
                            | "below",
                        },
                      }))
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-sm rounded px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                    <option value="below">Below Scene</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-400 block mb-1">
                    Text Speed (ms/char) 0=Instant
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="5"
                    value={project.globalSettings.typewriterSpeed ?? 15}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        globalSettings: {
                          ...p.globalSettings,
                          typewriterSpeed: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-sm rounded px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTreeId ||
              (project.dialogueTrees && project.dialogueTrees.length > 0) ? (
                (() => {
                  const currentTreeId =
                    activeTreeId ||
                    (project.dialogueTrees && project.dialogueTrees[0]
                      ? project.dialogueTrees[0].id
                      : null);
                  if (!currentTreeId) return null;
                  const tree = (project.dialogueTrees || []).find(
                    (t) => t.id === currentTreeId,
                  );
                  if (!tree) return null;
                  return (
                    <div className="max-w-3xl space-y-6 pb-20">
                      <input
                        type="text"
                        value={tree.name}
                        onChange={(e) => {
                          const newTrees = (project.dialogueTrees || []).map(
                            (t) =>
                              t.id === tree.id
                                ? { ...t, name: e.target.value }
                                : t,
                          );
                          pushHistory({ ...project, dialogueTrees: newTrees });
                        }}
                        className="bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-transparent focus:border-emerald-500 w-full pb-2"
                      />

                      <button
                        onClick={() => {
                          const newNode: DialogueNode = {
                            id: uuidv4(),
                            speaker: "Speaker",
                            text: "Hello...",
                            choices: [],
                          };
                          const newTrees = (project.dialogueTrees || []).map(
                            (t) =>
                              t.id === tree.id
                                ? {
                                    ...t,
                                    nodes: [...(t.nodes || []), newNode],
                                    startNodeId: t.startNodeId || newNode.id,
                                  }
                                : t,
                          );
                          pushHistory({ ...project, dialogueTrees: newTrees });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm"
                      >
                        <Plus size={16} /> Add Message
                      </button>

                      <div className="space-y-4">
                        {(tree.nodes || []).map((node) => (
                          <div
                            key={node.id}
                            className={`p-4 rounded-lg border ${tree.startNodeId === node.id ? "border-emerald-500/50 bg-emerald-500/5" : "border-neutral-800 bg-neutral-900"}`}
                          >
                            <div className="flex justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {tree.startNodeId === node.id && (
                                  <span className="text-sm uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                    Start Message
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={node.speaker}
                                  onChange={(e) => {
                                    const newTrees = (
                                      project.dialogueTrees || []
                                    ).map((t) =>
                                      t.id === tree.id
                                        ? {
                                            ...t,
                                            nodes: (t.nodes || []).map((n) =>
                                              n.id === node.id
                                                ? {
                                                    ...n,
                                                    speaker: e.target.value,
                                                  }
                                                : n,
                                            ),
                                          }
                                        : t,
                                    );
                                    pushHistory({
                                      ...project,
                                      dialogueTrees: newTrees,
                                    });
                                  }}
                                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm font-bold w-32"
                                  placeholder="Speaker"
                                />
                                <div className="flex gap-1 items-center border-l border-neutral-700 pl-3">
                                  {node.speakerAssetId &&
                                  (project.assets || []).find(
                                    (a) => a.id === node.speakerAssetId,
                                  ) ? (
                                    <div className="flex gap-2 items-center">
                                      <img
                                        src={
                                          (project.assets || []).find(
                                            (a) => a.id === node.speakerAssetId,
                                          )?.src || undefined
                                        }
                                        alt="Portrait"
                                        className="w-6 h-6 object-cover rounded bg-neutral-800"
                                      />
                                      <button
                                        onClick={() => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            speakerAssetId:
                                                              undefined,
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="text-red-400 hover:text-red-300 px-1 text-sm"
                                        title="Remove Portrait"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setAssetPickerCb({
                                          onSelect: (id) => {
                                            const newTrees = (
                                              project.dialogueTrees || []
                                            ).map((t) =>
                                              t.id === tree.id
                                                ? {
                                                    ...t,
                                                    nodes: (t.nodes || []).map(
                                                      (n) =>
                                                        n.id === node.id
                                                          ? {
                                                              ...n,
                                                              speakerAssetId:
                                                                id,
                                                            }
                                                          : n,
                                                    ),
                                                  }
                                                : t,
                                            );
                                            pushHistory({
                                              ...project,
                                              dialogueTrees: newTrees,
                                            });
                                            setAssetPickerCb(null);
                                          },
                                          filterType: "image",
                                        })
                                      }
                                      className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-300"
                                    >
                                      + Portrait
                                    </button>
                                  )}
                                  {node.speakerAssetId && (
                                    <select
                                      value={node.portraitPosition || "left"}
                                      onChange={(e) => {
                                        const newTrees = (
                                          project.dialogueTrees || []
                                        ).map((t) =>
                                          t.id === tree.id
                                            ? {
                                                ...t,
                                                nodes: (t.nodes || []).map(
                                                  (n) =>
                                                    n.id === node.id
                                                      ? {
                                                          ...n,
                                                          portraitPosition: e
                                                            .target.value as
                                                            | "left"
                                                            | "right",
                                                        }
                                                      : n,
                                                ),
                                              }
                                            : t,
                                        );
                                        pushHistory({
                                          ...project,
                                          dialogueTrees: newTrees,
                                        });
                                      }}
                                      className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm ml-1 focus:outline-none"
                                    >
                                      <option value="left">Left</option>
                                      <option value="right">Right</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {tree.startNodeId !== node.id && (
                                  <button
                                    onClick={() => {
                                      const newTrees = (
                                        project.dialogueTrees || []
                                      ).map((t) =>
                                        t.id === tree.id
                                          ? { ...t, startNodeId: node.id }
                                          : t,
                                      );
                                      pushHistory({
                                        ...project,
                                        dialogueTrees: newTrees,
                                      });
                                    }}
                                    className="text-sm text-neutral-400 hover:text-emerald-400"
                                  >
                                    Set as Start
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const newTrees = (
                                      project.dialogueTrees || []
                                    ).map((t) =>
                                      t.id === tree.id
                                        ? {
                                            ...t,
                                            nodes: (t.nodes || []).filter(
                                              (n) => n.id !== node.id,
                                            ),
                                          }
                                        : t,
                                    );
                                    pushHistory({
                                      ...project,
                                      dialogueTrees: newTrees,
                                    });
                                  }}
                                  className="text-sm text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <textarea
                              value={node.text}
                              onChange={(e) => {
                                const newTrees = (
                                  project.dialogueTrees || []
                                ).map((t) =>
                                  t.id === tree.id
                                    ? {
                                        ...t,
                                        nodes: (t.nodes || []).map((n) =>
                                          n.id === node.id
                                            ? { ...n, text: e.target.value }
                                            : n,
                                        ),
                                      }
                                    : t,
                                );
                                pushHistory({
                                  ...project,
                                  dialogueTrees: newTrees,
                                });
                              }}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm min-h-[80px] mb-3"
                              placeholder="Dialogue text..."
                            ></textarea>

                            <div className="space-y-2 pl-4 border-l-2 border-neutral-800">
                              {(node.choices || []).map((choice, cIdx) => (
                                <div
                                  key={choice.id}
                                  className="flex flex-col gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded relative"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={choice.text}
                                      onChange={(e) => {
                                        const newTrees = (
                                          project.dialogueTrees || []
                                        ).map((t) =>
                                          t.id === tree.id
                                            ? {
                                                ...t,
                                                nodes: (t.nodes || []).map(
                                                  (n) =>
                                                    n.id === node.id
                                                      ? {
                                                          ...n,
                                                          choices: (
                                                            n.choices || []
                                                          ).map((c, i) =>
                                                            i === cIdx
                                                              ? {
                                                                  ...c,
                                                                  text: e.target
                                                                    .value,
                                                                }
                                                              : c,
                                                          ),
                                                        }
                                                      : n,
                                                ),
                                              }
                                            : t,
                                        );
                                        pushHistory({
                                          ...project,
                                          dialogueTrees: newTrees,
                                        });
                                      }}
                                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm font-medium"
                                      placeholder="Choice text..."
                                    />

                                    <span className="text-neutral-500 text-sm">
                                      →
                                    </span>

                                    <select
                                      value={choice.nextNodeId || ""}
                                      onChange={(e) => {
                                        const newTrees = (
                                          project.dialogueTrees || []
                                        ).map((t) =>
                                          t.id === tree.id
                                            ? {
                                                ...t,
                                                nodes: (t.nodes || []).map(
                                                  (n) =>
                                                    n.id === node.id
                                                      ? {
                                                          ...n,
                                                          choices: (
                                                            n.choices || []
                                                          ).map((c, i) =>
                                                            i === cIdx
                                                              ? {
                                                                  ...c,
                                                                  nextNodeId:
                                                                    e.target
                                                                      .value ||
                                                                    null,
                                                                }
                                                              : c,
                                                          ),
                                                        }
                                                      : n,
                                                ),
                                              }
                                            : t,
                                        );
                                        pushHistory({
                                          ...project,
                                          dialogueTrees: newTrees,
                                        });
                                      }}
                                      className="w-48 bg-emerald-950/30 text-emerald-300 border border-emerald-900/50 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500"
                                    >
                                      <option
                                        value=""
                                        className="bg-neutral-900"
                                      >
                                        End Conversation
                                      </option>
                                      {(tree.nodes || []).map((n) => (
                                        <option
                                          key={n.id}
                                          value={n.id}
                                          className="bg-neutral-900"
                                        >
                                          {n.speaker}: {n.text.substring(0, 20)}
                                          ...
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => {
                                        const newTrees = (
                                          project.dialogueTrees || []
                                        ).map((t) =>
                                          t.id === tree.id
                                            ? {
                                                ...t,
                                                nodes: (t.nodes || []).map(
                                                  (n) =>
                                                    n.id === node.id
                                                      ? {
                                                          ...n,
                                                          choices: (
                                                            n.choices || []
                                                          ).filter(
                                                            (_, i) =>
                                                              i !== cIdx,
                                                          ),
                                                        }
                                                      : n,
                                                ),
                                              }
                                            : t,
                                        );
                                        pushHistory({
                                          ...project,
                                          dialogueTrees: newTrees,
                                        });
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1 bg-neutral-800 rounded"
                                      title="Remove Choice"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  {/* Story Events for Choice */}
                                  <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-neutral-500">
                                        Only Show If:
                                      </span>
                                      <select
                                        value={choice.requiredGameFlag || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    requiredGameFlag:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-neutral-400"
                                      >
                                        <option value="">(Always Show)</option>
                                        {(project.gameFlags || []).map((f) => (
                                          <option key={f} value={f}>
                                            {f}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-emerald-800">
                                        Trigger Event:
                                      </span>
                                      <select
                                        value={choice.setGameFlag || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    setGameFlag:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-emerald-300"
                                      >
                                        <option value="">(None)</option>
                                        {(project.gameFlags || []).map((f) => (
                                          <option key={f} value={f}>
                                            {f}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-emerald-800">
                                        Start Quest:
                                      </span>
                                      <select
                                        value={choice.startQuestId || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    startQuestId:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-emerald-300"
                                      >
                                        <option value="">(None)</option>
                                        {(project.quests || []).map((q) => (
                                          <option key={q.id} value={q.id}>
                                            {q.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-emerald-800">
                                        Complete Quest:
                                      </span>
                                      <select
                                        value={choice.completeQuestId || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    completeQuestId:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-emerald-300"
                                      >
                                        <option value="">(None)</option>
                                        {(project.quests || []).map((q) => (
                                          <option key={q.id} value={q.id}>
                                            {q.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 mt-2">
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-emerald-800">
                                        Give Item:
                                      </span>
                                      <select
                                        value={choice.giveItemId || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    giveItemId:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-emerald-300"
                                      >
                                        <option value="">(None)</option>
                                        {(project.inventoryItems || []).map(
                                          (i) => (
                                            <option key={i.id} value={i.id}>
                                              {i.name}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                      <span className="text-sm uppercase font-bold text-emerald-800">
                                        Change Room (Scene):
                                      </span>
                                      <select
                                        value={choice.changeSceneId || ""}
                                        onChange={(e) => {
                                          const newTrees = (
                                            project.dialogueTrees || []
                                          ).map((t) =>
                                            t.id === tree.id
                                              ? {
                                                  ...t,
                                                  nodes: (t.nodes || []).map(
                                                    (n) =>
                                                      n.id === node.id
                                                        ? {
                                                            ...n,
                                                            choices: (
                                                              n.choices || []
                                                            ).map((c, i) =>
                                                              i === cIdx
                                                                ? {
                                                                    ...c,
                                                                    changeSceneId:
                                                                      e.target
                                                                        .value ||
                                                                      undefined,
                                                                  }
                                                                : c,
                                                            ),
                                                          }
                                                        : n,
                                                  ),
                                                }
                                              : t,
                                          );
                                          pushHistory({
                                            ...project,
                                            dialogueTrees: newTrees,
                                          });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-sm text-emerald-300"
                                      >
                                        <option value="">(None)</option>
                                        {(project.scenes || []).map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newTrees = (
                                    project.dialogueTrees || []
                                  ).map((t) =>
                                    t.id === tree.id
                                      ? {
                                          ...t,
                                          nodes: (t.nodes || []).map((n) =>
                                            n.id === node.id
                                              ? {
                                                  ...n,
                                                  choices: [
                                                    ...(n.choices || []),
                                                    {
                                                      id: uuidv4(),
                                                      text: "New Choice",
                                                      nextNodeId: null,
                                                    },
                                                  ],
                                                }
                                              : n,
                                          ),
                                        }
                                      : t,
                                  );
                                  pushHistory({
                                    ...project,
                                    dialogueTrees: newTrees,
                                  });
                                }}
                                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-2"
                              >
                                <Plus size={12} /> Add Choice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500">
                  Select or create a dialogue tree.
                </div>
              )}
            </div>
          </div>
        )}

        {editorMode === "scenes" && (
          <div className="flex-1 flex flex-col p-6 bg-neutral-950 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Rooms & Areas Manager</h2>
              <button
                onClick={() => {
                  const newScene: Scene = {
                    id: uuidv4(),
                    name: `Scene ${project.scenes.length + 1}`,
                    width: project.scenes[0]?.width || 800,
                    height: project.scenes[0]?.height || 600,
                    backgroundColor: "#000000",
                    objects: [],
                  };
                  pushHistory({
                    ...project,
                    scenes: [...project.scenes, newScene],
                    currentSceneId: newScene.id,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
              >
                <Plus size={16} /> Create Scene
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20">
              {project.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={`bg-neutral-900 border rounded-lg p-5 flex flex-col gap-4 transition-colors ${project.currentSceneId === scene.id ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-700"
                        style={{ backgroundColor: scene.backgroundColor }}
                      ></div>
                      <input
                        type="text"
                        value={scene.name}
                        onChange={(e) => {
                          pushHistory({
                            ...project,
                            scenes: project.scenes.map((s) =>
                              s.id === scene.id
                                ? { ...s, name: e.target.value }
                                : s,
                            ),
                          });
                        }}
                        className="bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-emerald-500 text-lg font-bold text-white outline-none px-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newId = uuidv4();
                          const newScene = {
                            ...scene,
                            id: newId,
                            name: `${scene.name} (Copy)`,
                            objects: scene.objects.map((o) => ({
                              ...o,
                              id: uuidv4(),
                            })),
                          };
                          pushHistory({
                            ...project,
                            scenes: [...project.scenes, newScene],
                            currentSceneId: newId,
                          });
                        }}
                        className="text-neutral-400 hover:text-white p-1"
                        title="Duplicate Scene"
                      >
                        <Copy size={14} />
                      </button>
                      {project.scenes.length > 1 && (
                        <button
                          onClick={() => {
                            const newScenes = project.scenes.filter(
                              (s) => s.id !== scene.id,
                            );
                            const newCurrentId =
                              project.currentSceneId === scene.id
                                ? newScenes[0].id
                                : project.currentSceneId;
                            pushHistory({
                              ...project,
                              scenes: newScenes,
                              currentSceneId: newCurrentId,
                            });
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Scene"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-neutral-400 font-mono">
                    <div className="flex flex-col gap-1">
                      <LabelWithHelp
                        label="Width"
                        helpText="The total width of the scene in pixels."
                      />
                      <input
                        type="number"
                        value={scene.width}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            scenes: project.scenes.map((s) =>
                              s.id === scene.id
                                ? { ...s, width: Number(e.target.value) }
                                : s,
                            ),
                          })
                        }
                        className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <LabelWithHelp
                        label="Height"
                        helpText="The total height of the scene in pixels."
                      />
                      <input
                        type="number"
                        value={scene.height}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            scenes: project.scenes.map((s) =>
                              s.id === scene.id
                                ? { ...s, height: Number(e.target.value) }
                                : s,
                            ),
                          })
                        }
                        className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <LabelWithHelp
                        label="Background Color"
                        helpText="Solid background color behind everything."
                      />
                      <input
                        type="color"
                        value={scene.backgroundColor}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            scenes: project.scenes.map((s) =>
                              s.id === scene.id
                                ? { ...s, backgroundColor: e.target.value }
                                : s,
                            ),
                          })
                        }
                        className="w-16 h-7 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <LabelWithHelp
                      label="Background Music (BGM)"
                      helpText="The music track that plays on loop when the player enters this scene."
                      className="uppercase font-bold mb-1 block text-sm mt-2"
                    />
                    <button
                        onClick={() => setAssetPickerCb({
                          onSelect: (id) => {
                            pushHistory({
                              ...project,
                              scenes: (project.scenes || []).map((s) =>
                                s.id === scene.id ? { ...s, bgmAssetId: id } : s
                              ),
                            });
                          },
                          filterType: "audio"
                        })}
                        className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 rounded px-3 py-2 text-sm flex items-center justify-between transition-colors"
                      >
                        <span className="text-neutral-300 truncate pr-2">
                          {scene.bgmAssetId
                            ? project.assets.find((a) => a.id === scene.bgmAssetId)?.name || "Unknown Audio"
                            : "None"}
                        </span>
                        <Music size={16} className="text-neutral-500" />
                    </button>
                    {scene.bgmAssetId && (
                      <button 
                        onClick={() => {
                          pushHistory({
                            ...project,
                            scenes: (project.scenes || []).map((s) =>
                              s.id === scene.id ? { ...s, bgmAssetId: undefined } : s
                            ),
                          });
                        }}
                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                      >
                        Clear BGM
                      </button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-sm text-neutral-500">
                      {scene.objects.length} Objects
                    </span>
                    <button
                      onClick={() => {
                        setProject((p) => ({ ...p, currentSceneId: scene.id }));
                        setEditorMode("stage");
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm rounded transition-colors"
                    >
                      {project.currentSceneId === scene.id
                        ? "Viewing Stage"
                        : "Go to Stage →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {editorMode === "ui_maker" && (
          <div className="flex-1 flex flex-col p-6 bg-neutral-950 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Interfaces & Overlays</h2>
              <button
                onClick={() => {
                  const newMenu: Scene = {
                    id: uuidv4(),
                    name: `UI Menu ${(project.uiMenus || []).length + 1}`,
                    width: project.globalSettings.stageWidth || 800,
                    height: project.globalSettings.stageHeight || 600,
                    backgroundColor: "transparent",
                    objects: [],
                    blocksClicks: false,
                  };
                  pushHistory({
                    ...project,
                    uiMenus: [...(project.uiMenus || []), newMenu],
                    currentUiMenuId: newMenu.id,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
              >
                <Plus size={16} /> Create UI Menu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20">
              {(project.uiMenus || []).map((scene) => (
                <div
                  key={scene.id}
                  className={`bg-neutral-900 border rounded-lg p-5 flex flex-col gap-4 transition-colors ${project.currentUiMenuId === scene.id ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-neutral-800 hover:border-neutral-700"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-700"
                        style={{ backgroundColor: scene.backgroundColor }}
                      ></div>
                      <input
                        type="text"
                        value={scene.name}
                        onChange={(e) => {
                          pushHistory({
                            ...project,
                            uiMenus: (project.uiMenus || []).map((s) =>
                              s.id === scene.id
                                ? { ...s, name: e.target.value }
                                : s,
                            ),
                          });
                        }}
                        className="bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-emerald-500 text-lg font-bold text-white outline-none px-1 w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newId = uuidv4();
                          const newScene = {
                            ...scene,
                            id: newId,
                            name: `${scene.name} (Copy)`,
                            objects: scene.objects.map((o) => ({
                              ...o,
                              id: uuidv4(),
                            })),
                          };
                          pushHistory({
                            ...project,
                            uiMenus: [...(project.uiMenus || []), newScene],
                            currentUiMenuId: newId,
                          });
                        }}
                        className="text-neutral-400 hover:text-white p-1"
                        title="Duplicate UI Menu"
                      >
                        <Copy size={14} />
                      </button>
                      {(project.uiMenus || []).length > 0 && (
                        <button
                          onClick={() => {
                            const newMenus = (project.uiMenus || []).filter(
                              (s) => s.id !== scene.id,
                            );
                            const newCurrentId =
                              project.currentUiMenuId === scene.id
                                ? newMenus[0]?.id || null
                                : project.currentUiMenuId;
                            pushHistory({
                              ...project,
                              uiMenus: newMenus,
                              currentUiMenuId: newCurrentId,
                            });
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete UI Menu"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 text-sm text-neutral-400 font-mono">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 w-full">
                        <LabelWithHelp
                          label="Width"
                          helpText="Width of the UI space."
                        />
                        <input
                          type="number"
                          value={scene.width}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              uiMenus: (project.uiMenus || []).map((s) =>
                                s.id === scene.id
                                  ? { ...s, width: Number(e.target.value) }
                                  : s,
                              ),
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <LabelWithHelp
                          label="Height"
                          helpText="Height of the UI space."
                        />
                        <input
                          type="number"
                          value={scene.height}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              uiMenus: (project.uiMenus || []).map((s) =>
                                s.id === scene.id
                                  ? { ...s, height: Number(e.target.value) }
                                  : s,
                              ),
                            })
                          }
                          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full relative">
                      <LabelWithHelp
                        label="Background (Supports RGBA)"
                        helpText="The background color of the UI Menu panel. Use rgba() string for transparency."
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={scene.backgroundColor}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              uiMenus: (project.uiMenus || []).map((s) =>
                                s.id === scene.id
                                  ? { ...s, backgroundColor: e.target.value }
                                  : s,
                              ),
                            })
                          }
                          className="flex-1 w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1"
                          placeholder="transparent"
                        />
                        <button
                          onClick={() =>
                            pushHistory({
                              ...project,
                              uiMenus: (project.uiMenus || []).map((s) =>
                                s.id === scene.id
                                  ? { ...s, backgroundColor: "transparent" }
                                  : s,
                              ),
                            })
                          }
                          className="px-2 py-1 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded text-sm text-neutral-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={!!scene.isOpenByDefault}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            uiMenus: (project.uiMenus || []).map((s) =>
                              s.id === scene.id
                                ? { ...s, isOpenByDefault: e.target.checked }
                                : s,
                            ),
                          })
                        }
                        className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950"
                      />
                      <LabelWithHelp
                        label="Show By Default (HUD)"
                        helpText="Checked if this is a HUD or always-on interface that should be visible immediately!"
                      />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={!!scene.blocksClicks}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            uiMenus: (project.uiMenus || []).map((s) =>
                              s.id === scene.id
                                ? { ...s, blocksClicks: e.target.checked }
                                : s,
                            ),
                          })
                        }
                        className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950"
                      />
                      <LabelWithHelp
                        label="Block Clicks Below UI Canvas"
                        helpText="If checked, clicks inside this UI map's bounds will not pass through to the game scene below. Make the width/height match the stage if you want to block the entire screen!"
                      />
                    </label>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-sm text-neutral-500">
                      {scene.objects.length} Objects
                    </span>
                    <button
                      onClick={() => {
                        setProject((p) => ({
                          ...p,
                          currentUiMenuId: scene.id,
                        }));
                        setEditorMode("ui_stage");
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm rounded transition-colors"
                    >
                      {project.currentUiMenuId === scene.id
                        ? "Viewing UI Stage"
                        : "Edit UI →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {editorMode === "rpg_systems" && (
          <div className="flex-1 flex flex-col p-6 bg-neutral-950 overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Game Rules</h2>
                <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                  <button
                    onClick={() => setRpgTab("quests")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${rpgTab === "quests" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Quests
                  </button>
                  <button
                    onClick={() => setRpgTab("stats")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${rpgTab === "stats" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Skills & Needs
                  </button>
                  <button
                    onClick={() => setRpgTab("factions")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${rpgTab === "factions" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Factions
                  </button>
                  <button
                    onClick={() => setRpgTab("lore")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${rpgTab === "lore" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Almanac
                  </button>
                  <button
                    onClick={() => setRpgTab("companions")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${rpgTab === "companions" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Companions
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
              <div
                className="flex flex-col gap-4 border-r border-neutral-800 pr-6 overflow-y-auto custom-scrollbar relative flex-shrink-0"
                style={{ width: leftSidebarWidth }}
              >
                <div
                  className="absolute top-0 bottom-0 -right-[3px] w-[6px] cursor-col-resize z-[100] hover:bg-emerald-500/50"
                  onPointerDown={() =>
                    document.body.classList.add("resizing-left-sidebar")
                  }
                />

                {rpgTab === "quests" && (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">
                      Quests
                    </h2>
                    <button
                      onClick={() => {
                        const newQuest: Quest = {
                          id: uuidv4(),
                          name: "New Quest",
                          description: "",
                          objectives: [],
                          rewards: [],
                        };
                        pushHistory({
                          ...project,
                          quests: [...(project.quests || []), newQuest],
                        });
                        setActiveQuestId(newQuest.id);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors shadow-lg"
                    >
                      + New Quest
                    </button>

                    <div className="space-y-2">
                      {(project.quests || []).map((quest) => (
                        <div
                          key={quest.id}
                          onClick={() => setActiveQuestId(quest.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${activeQuestId === quest.id ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"}`}
                        >
                          <div className="font-bold">{quest.name}</div>
                          <div className="text-sm text-neutral-500 truncate mr-2">
                            {quest.description || "No description"}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-white">
                          Story Events
                        </h2>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newEventText}
                          onChange={(e) => setNewEventText(e.target.value)}
                          placeholder="e.g. Unlocked Door"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            const currentFlags = Array.isArray(
                              project.gameFlags,
                            )
                              ? project.gameFlags
                              : [];
                            if (
                              newEventText.trim() &&
                              !currentFlags.includes(newEventText.trim())
                            ) {
                              pushHistory({
                                ...project,
                                gameFlags: [
                                  ...currentFlags,
                                  newEventText.trim(),
                                ],
                              });
                              setNewEventText("");
                            }
                          }}
                          className="text-emerald-400 p-2 bg-neutral-900 border border-neutral-800 hover:bg-emerald-500/20 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(project.gameFlags)
                          ? project.gameFlags
                          : []
                        ).map((flag) => (
                          <div
                            key={flag}
                            className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded text-sm text-neutral-300"
                          >
                            <span>{flag}</span>
                            <button
                              onClick={() => {
                                const currentFlags = Array.isArray(
                                  project.gameFlags,
                                )
                                  ? project.gameFlags
                                  : [];
                                pushHistory({
                                  ...project,
                                  gameFlags: currentFlags.filter(
                                    (f) => f !== flag,
                                  ),
                                });
                              }}
                              className="text-red-400 hover:text-red-300 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {(Array.isArray(project.gameFlags)
                          ? project.gameFlags
                          : []
                        ).length === 0 && (
                          <div className="text-sm text-neutral-500 italic">
                            No story events created yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {rpgTab === "stats" && (
                  <>
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-emerald-400">
                          Custom Skills
                        </h2>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newSkillText}
                          onChange={(e) => setNewSkillText(e.target.value)}
                          placeholder="e.g. Archery"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            const customSkills =
                              project.globalSettings?.customSkills || [];
                            if (
                              newSkillText.trim() &&
                              !customSkills.includes(newSkillText.trim())
                            ) {
                              pushHistory({
                                ...project,
                                globalSettings: {
                                  ...project.globalSettings,
                                  customSkills: [
                                    ...customSkills,
                                    newSkillText.trim(),
                                  ],
                                },
                              });
                              setNewSkillText("");
                            }
                          }}
                          className="text-emerald-400 p-2 bg-neutral-900 border border-neutral-800 hover:bg-emerald-500/20 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(project.globalSettings?.customSkills || []).map(
                          (skill) => (
                            <div
                              key={skill}
                              className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded text-sm text-emerald-300"
                            >
                              <span>{skill}</span>
                              <button
                                onClick={() => {
                                  const customSkills =
                                    project.globalSettings?.customSkills || [];
                                  pushHistory({
                                    ...project,
                                    globalSettings: {
                                      ...project.globalSettings,
                                      customSkills: customSkills.filter(
                                        (s) => s !== skill,
                                      ),
                                    },
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 ml-1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ),
                        )}
                        {(project.globalSettings?.customSkills || []).length ===
                          0 && (
                          <div className="text-sm text-neutral-500 italic">
                            No custom skills created yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-pink-400">
                          Custom Meters
                        </h2>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newNeedText}
                          onChange={(e) => setNewNeedText(e.target.value)}
                          placeholder="e.g. Mana"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            const customNeeds =
                              project.globalSettings?.customNeeds || [];
                            if (
                              newNeedText.trim() &&
                              !customNeeds.includes(newNeedText.trim())
                            ) {
                              pushHistory({
                                ...project,
                                globalSettings: {
                                  ...project.globalSettings,
                                  customNeeds: [
                                    ...customNeeds,
                                    newNeedText.trim(),
                                  ],
                                },
                              });
                              setNewNeedText("");
                            }
                          }}
                          className="text-pink-400 p-2 bg-neutral-900 border border-neutral-800 hover:bg-pink-500/20 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(project.globalSettings?.customNeeds || []).map(
                          (need) => (
                            <div
                              key={need}
                              className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded text-sm text-pink-300"
                            >
                              <span>{need}</span>
                              <button
                                onClick={() => {
                                  const customNeeds =
                                    project.globalSettings?.customNeeds || [];
                                  pushHistory({
                                    ...project,
                                    globalSettings: {
                                      ...project.globalSettings,
                                      customNeeds: customNeeds.filter(
                                        (n) => n !== need,
                                      ),
                                    },
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 ml-1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ),
                        )}
                        {(project.globalSettings?.customNeeds || []).length ===
                          0 && (
                          <div className="text-sm text-neutral-500 italic">
                            No custom needs created yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {rpgTab === "factions" && (
                  <>
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-amber-500">
                          Factions
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          const newFaction: Faction = {
                            id: uuidv4(),
                            name: "New Faction",
                            description: "",
                            defaultAffinity: 0,
                          };
                          pushHistory({
                            ...project,
                            factions: [...(project.factions || []), newFaction],
                          });
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition-colors shadow-lg mb-4"
                      >
                        + Create Faction
                      </button>
                      <div className="space-y-2">
                        {(project.factions || []).map((faction) => (
                          <div
                            key={faction.id}
                            className="bg-neutral-900 border border-neutral-800 rounded p-3 group relative"
                          >
                            <input
                              type="text"
                              value={faction.name}
                              onChange={(e) => {
                                const updated = (project.factions || []).map(
                                  (f) =>
                                    f.id === faction.id
                                      ? { ...f, name: e.target.value }
                                      : f,
                                );
                                pushHistory({ ...project, factions: updated });
                              }}
                              className="bg-transparent font-bold text-white mb-1 w-full border-b border-transparent focus:border-amber-500 focus:outline-none"
                              placeholder="Faction Name"
                            />
                            <input
                              type="number"
                              value={faction.defaultAffinity}
                              onChange={(e) => {
                                const updated = (project.factions || []).map(
                                  (f) =>
                                    f.id === faction.id
                                      ? {
                                          ...f,
                                          defaultAffinity: Number(
                                            e.target.value,
                                          ),
                                        }
                                      : f,
                                );
                                pushHistory({ ...project, factions: updated });
                              }}
                              className="bg-transparent text-sm text-neutral-400 w-full mb-2"
                              placeholder="Default Affinity (0)"
                            />
                            <button
                              onClick={() => {
                                pushHistory({
                                  ...project,
                                  factions: (project.factions || []).filter(
                                    (f) => f.id !== faction.id,
                                  ),
                                });
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {rpgTab === "lore" && (
                  <>
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-blue-400">
                          Lore Entries
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          const newEntry: LoreEntry = {
                            id: uuidv4(),
                            title: "New Document",
                            content: "",
                          };
                          pushHistory({
                            ...project,
                            loreEntries: [
                              ...(project.loreEntries || []),
                              newEntry,
                            ],
                          });
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors shadow-lg mb-4"
                      >
                        + Create Entry
                      </button>
                      <div className="space-y-2">
                        {(project.loreEntries || []).map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-neutral-900 border border-neutral-800 rounded p-3 group relative"
                          >
                            <input
                              type="text"
                              value={entry.title}
                              onChange={(e) => {
                                const updated = (project.loreEntries || []).map(
                                  (e2) =>
                                    e2.id === entry.id
                                      ? { ...e2, title: e.target.value }
                                      : e2,
                                );
                                pushHistory({
                                  ...project,
                                  loreEntries: updated,
                                });
                              }}
                              className="bg-transparent font-bold text-blue-300 mb-1 w-full border-b border-transparent focus:border-blue-500 focus:outline-none"
                              placeholder="Entry Title"
                            />
                            <textarea
                              value={entry.content}
                              onChange={(e) => {
                                const updated = (project.loreEntries || []).map(
                                  (e2) =>
                                    e2.id === entry.id
                                      ? { ...e2, content: e.target.value }
                                      : e2,
                                );
                                pushHistory({
                                  ...project,
                                  loreEntries: updated,
                                });
                              }}
                              className="bg-black/50 text-xs text-neutral-300 w-full h-20 rounded p-1 custom-scrollbar focus:outline-none focus:border-blue-500"
                              placeholder="Lore content..."
                            />
                            <button
                              onClick={() => {
                                pushHistory({
                                  ...project,
                                  loreEntries: (
                                    project.loreEntries || []
                                  ).filter((e2) => e2.id !== entry.id),
                                });
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {rpgTab === "companions" && (
                  <>
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-amber-400">
                          Companions
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          const newComp: Companion = {
                            id: uuidv4(),
                            name: "New Companion",
                            assetId: null,
                            dialogueTreeId: null,
                            interjections: []
                          };
                          pushHistory({
                            ...project,
                            companions: [...(project.companions || []), newComp]
                          });
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition-colors shadow-lg mb-4"
                      >
                        + Create Companion
                      </button>
                      <div className="space-y-2">
                        {(project.companions || []).map(comp => (
                          <div
                            key={comp.id}
                            onClick={() => setActiveCompanionId(comp.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${activeCompanionId === comp.id ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"}`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>{comp.name}</span>
                              {comp.requiredFlagId && <span className="opacity-50 text-xs text-indigo-400">Requires Flag</span>}
                            </div>
                            <div className="text-xs text-neutral-500 truncate">
                              {comp.interjections && comp.interjections.length > 0 ? `${comp.interjections.length} dialogue lines` : "Silent"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rpgTab === "quests" &&
                  (activeQuestId &&
                  (project.quests || []).find((q) => q.id === activeQuestId) ? (
                    (() => {
                      const quest = (project.quests || []).find(
                        (q) => q.id === activeQuestId,
                      )!;
                      return (
                        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-4 w-full">
                              <div>
                                <LabelWithHelp
                                  label="Quest Name"
                                  className="font-bold mb-1 block uppercase tracking-wider"
                                  helpText="The primary title of the quest as seen by the player."
                                />
                                <input
                                  type="text"
                                  value={quest.name}
                                  onChange={(e) => {
                                    const updated = (project.quests || []).map(
                                      (q) =>
                                        q.id === quest.id
                                          ? { ...q, name: e.target.value }
                                          : q,
                                    );
                                    pushHistory({
                                      ...project,
                                      quests: updated,
                                    });
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 font-bold text-lg text-white"
                                />
                              </div>
                              <div>
                                <LabelWithHelp
                                  label="Description"
                                  className="font-bold mb-1 block uppercase tracking-wider"
                                  helpText="The story context or detailed instructions given to the player in their quest log."
                                />
                                <textarea
                                  value={quest.description}
                                  onChange={(e) => {
                                    const updated = (project.quests || []).map(
                                      (q) =>
                                        q.id === quest.id
                                          ? {
                                              ...q,
                                              description: e.target.value,
                                            }
                                          : q,
                                    );
                                    pushHistory({
                                      ...project,
                                      quests: updated,
                                    });
                                  }}
                                  className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-300 custom-scrollbar"
                                  placeholder="Quest details..."
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                pushHistory({
                                  ...project,
                                  quests: (project.quests || []).filter(
                                    (q) => q.id !== quest.id,
                                  ),
                                });
                                setActiveQuestId(null);
                              }}
                              className="p-2 text-red-500 hover:bg-neutral-800 rounded ml-4"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                                Objectives
                              </h3>
                              <button
                                onClick={() => {
                                  const newObjective: QuestObjective = {
                                    id: uuidv4(),
                                    type: "custom_flag",
                                    targetId: "",
                                    description: "",
                                  };
                                  const updated = (project.quests || []).map(
                                    (q) =>
                                      q.id === quest.id
                                        ? {
                                            ...q,
                                            objectives: [
                                              ...(q.objectives || []),
                                              newObjective,
                                            ],
                                          }
                                        : q,
                                  );
                                  pushHistory({ ...project, quests: updated });
                                }}
                                className="text-emerald-400 text-sm hover:text-emerald-300 font-bold flex items-center gap-1"
                              >
                                + Add Objective
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(quest.objectives || []).map((obj) => (
                                <div
                                  key={obj.id}
                                  className="p-4 border border-neutral-800 bg-neutral-950 rounded-lg relative group"
                                >
                                  <button
                                    onClick={() => {
                                      const updated = (
                                        project.quests || []
                                      ).map((q) =>
                                        q.id === quest.id
                                          ? {
                                              ...q,
                                              objectives: q.objectives.filter(
                                                (o) => o.id !== obj.id,
                                              ),
                                            }
                                          : q,
                                      );
                                      pushHistory({
                                        ...project,
                                        quests: updated,
                                      });
                                    }}
                                    className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <LabelWithHelp
                                        label="Type"
                                        className="uppercase block mb-1"
                                        helpText="The condition the player must meet to complete this objective."
                                      />
                                      <select
                                        value={obj.type}
                                        onChange={(e) => {
                                          const updated = (
                                            project.quests || []
                                          ).map((q) =>
                                            q.id === quest.id
                                              ? {
                                                  ...q,
                                                  objectives: q.objectives.map(
                                                    (o) =>
                                                      o.id === obj.id
                                                        ? {
                                                            ...o,
                                                            type: e.target
                                                              .value as any,
                                                          }
                                                        : o,
                                                  ),
                                                }
                                              : q,
                                          );
                                          pushHistory({
                                            ...project,
                                            quests: updated,
                                          });
                                        }}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded px-2 py-1"
                                      >
                                        <option value="custom_flag">
                                          Story Event Triggered
                                        </option>
                                        <option value="collect_item">
                                          Collect Item
                                        </option>
                                        <option value="reach_scene">
                                          Reach Scene
                                        </option>
                                      </select>
                                    </div>
                                    <div>
                                      <LabelWithHelp
                                        label="Target"
                                        className="uppercase block mb-1"
                                        helpText="Which specific item, scene, or event triggers completion."
                                      />
                                      {obj.type === "custom_flag" && (
                                        <select
                                          value={obj.targetId}
                                          onChange={(e) => {
                                            const updated = (
                                              project.quests || []
                                            ).map((q) =>
                                              q.id === quest.id
                                                ? {
                                                    ...q,
                                                    objectives:
                                                      q.objectives.map((o) =>
                                                        o.id === obj.id
                                                          ? {
                                                              ...o,
                                                              targetId:
                                                                e.target.value,
                                                            }
                                                          : o,
                                                      ),
                                                  }
                                                : q,
                                            );
                                            pushHistory({
                                              ...project,
                                              quests: updated,
                                            });
                                          }}
                                          className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded px-2 py-1"
                                        >
                                          <option value="">
                                            Select Event...
                                          </option>
                                          {(project.gameFlags || []).map(
                                            (f) => (
                                              <option key={f} value={f}>
                                                {f}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      )}
                                      {obj.type === "collect_item" && (
                                        <select
                                          value={obj.targetId}
                                          onChange={(e) => {
                                            const updated = (
                                              project.quests || []
                                            ).map((q) =>
                                              q.id === quest.id
                                                ? {
                                                    ...q,
                                                    objectives:
                                                      q.objectives.map((o) =>
                                                        o.id === obj.id
                                                          ? {
                                                              ...o,
                                                              targetId:
                                                                e.target.value,
                                                            }
                                                          : o,
                                                      ),
                                                  }
                                                : q,
                                            );
                                            pushHistory({
                                              ...project,
                                              quests: updated,
                                            });
                                          }}
                                          className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded px-2 py-1"
                                        >
                                          <option value="">
                                            Select Item...
                                          </option>
                                          {(project.inventoryItems || []).map(
                                            (i) => (
                                              <option key={i.id} value={i.id}>
                                                {i.name}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      )}
                                      {obj.type === "reach_scene" && (
                                        <select
                                          value={obj.targetId}
                                          onChange={(e) => {
                                            const updated = (
                                              project.quests || []
                                            ).map((q) =>
                                              q.id === quest.id
                                                ? {
                                                    ...q,
                                                    objectives:
                                                      q.objectives.map((o) =>
                                                        o.id === obj.id
                                                          ? {
                                                              ...o,
                                                              targetId:
                                                                e.target.value,
                                                            }
                                                          : o,
                                                      ),
                                                  }
                                                : q,
                                            );
                                            pushHistory({
                                              ...project,
                                              quests: updated,
                                            });
                                          }}
                                          className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded px-2 py-1"
                                        >
                                          <option value="">
                                            Select Scene...
                                          </option>
                                          {(project.scenes || []).map((s) => (
                                            <option key={s.id} value={s.id}>
                                              {s.name}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <LabelWithHelp
                                      label="Player-facing Description"
                                      className="uppercase block mb-1"
                                      helpText="What to display to the player as their objective (e.g. 'Find the hidden key')."
                                    />
                                    <input
                                      type="text"
                                      value={obj.description}
                                      onChange={(e) => {
                                        const updated = (
                                          project.quests || []
                                        ).map((q) =>
                                          q.id === quest.id
                                            ? {
                                                ...q,
                                                objectives: q.objectives.map(
                                                  (o) =>
                                                    o.id === obj.id
                                                      ? {
                                                          ...o,
                                                          description:
                                                            e.target.value,
                                                        }
                                                      : o,
                                                ),
                                              }
                                            : q,
                                        );
                                        pushHistory({
                                          ...project,
                                          quests: updated,
                                        });
                                      }}
                                      className="w-full bg-neutral-900 border border-neutral-800 text-sm rounded px-2 py-1"
                                      placeholder="e.g. Find the rusty key"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                      <Shield size={48} className="mb-4 opacity-50" />
                      <p className="text-lg">
                        Select a quest to edit its details
                      </p>
                    </div>
                  ))}

                {rpgTab === "stats" && (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                    <Zap size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">
                      Skill & Stat details panel (Under Construction)
                    </p>
                  </div>
                )}

                {rpgTab === "companions" &&
                  (activeCompanionId &&
                  (project.companions || []).find((c) => c.id === activeCompanionId) ? (
                    (() => {
                      const comp = (project.companions || []).find(
                        (c) => c.id === activeCompanionId,
                      )!;
                      return (
                        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-4 w-full">
                              <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">
                                  Companion Name
                                </label>
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => {
                                    const updated = (project.companions || []).map((c2) =>
                                      c2.id === comp.id ? { ...c2, name: e.target.value } : c2
                                    );
                                    pushHistory({ ...project, companions: updated });
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500 text-white font-bold"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                                    Asset (Sprite/Portrait)
                                  </label>
                                  <select
                                    value={comp.assetId || ""}
                                    onChange={(e) => {
                                      const updated = (project.companions || []).map((c2) =>
                                        c2.id === comp.id ? { ...c2, assetId: e.target.value || null } : c2
                                      );
                                      pushHistory({ ...project, companions: updated });
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500 text-white"
                                  >
                                    <option value="">None</option>
                                    {project.assets.filter(a => a.type === "image").map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                                    Click Action (Dialogue)
                                  </label>
                                  <select
                                    value={comp.dialogueTreeId || ""}
                                    onChange={(e) => {
                                      const updated = (project.companions || []).map((c2) =>
                                        c2.id === comp.id ? { ...c2, dialogueTreeId: e.target.value || null } : c2
                                      );
                                      pushHistory({ ...project, companions: updated });
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500 text-white"
                                  >
                                    <option value="">None</option>
                                    {project.dialogueTrees.map(d => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">
                                  Required Flag (Follows if true)
                                </label>
                                <select
                                  value={comp.requiredFlagId || ""}
                                  onChange={(e) => {
                                    const updated = (project.companions || []).map((c2) =>
                                      c2.id === comp.id ? { ...c2, requiredFlagId: e.target.value || undefined } : c2
                                    );
                                    pushHistory({ ...project, companions: updated });
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500 text-white"
                                >
                                  <option value="">Always Follows</option>
                                  {(project.gameFlags || []).map(f => (
                                    <option key={f} value={f}>{f}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="flex text-sm font-medium text-neutral-400 mb-1 items-center justify-between">
                                  <span>Interjections (Randomly spoken)</span>
                                  <button
                                    onClick={() => {
                                      const updated = (project.companions || []).map((c2) =>
                                        c2.id === comp.id ? { ...c2, interjections: [...(c2.interjections || []), "New line..."] } : c2
                                      );
                                      pushHistory({ ...project, companions: updated });
                                    }}
                                    className="text-amber-400 hover:text-amber-300 text-xs font-bold"
                                  >
                                    + Add Line
                                  </button>
                                </label>
                                <div className="space-y-2 mt-2">
                                  {(!comp.interjections || comp.interjections.length === 0) ? (
                                    <div className="text-sm text-neutral-600 italic">No interjection lines</div>
                                  ) : comp.interjections.map((line, lIdx) => (
                                    <div key={lIdx} className="flex gap-2">
                                      <input
                                        type="text"
                                        value={line}
                                        onChange={(e) => {
                                          const newLines = [...(comp.interjections || [])];
                                          newLines[lIdx] = e.target.value;
                                          const updated = (project.companions || []).map((c2) =>
                                            c2.id === comp.id ? { ...c2, interjections: newLines } : c2
                                          );
                                          pushHistory({ ...project, companions: updated });
                                        }}
                                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-sm text-white focus:border-amber-500"
                                      />
                                      <button
                                        onClick={() => {
                                          const newLines = [...(comp.interjections || [])];
                                          newLines.splice(lIdx, 1);
                                          const updated = (project.companions || []).map((c2) =>
                                            c2.id === comp.id ? { ...c2, interjections: newLines } : c2
                                          );
                                          pushHistory({ ...project, companions: updated });
                                        }}
                                        className="text-red-500 hover:text-red-400 px-2"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                pushHistory({
                                  ...project,
                                  companions: (project.companions || []).filter(c => c.id !== comp.id)
                                });
                                setActiveCompanionId(null);
                              }}
                              className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg ml-4"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                      <Users size={48} className="mb-4 opacity-50" />
                      <p className="text-lg">Select a companion to configure</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {editorMode === "items" && (
          <div className="flex-1 flex flex-col p-6 bg-neutral-950 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Item Database</h2>
                <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                  <button
                    onClick={() => setItemsTab("items")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${itemsTab === "items" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Items
                  </button>
                  <button
                    onClick={() => setItemsTab("crafting")}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${itemsTab === "crafting" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
                  >
                    Crafting Recipes
                  </button>
                </div>
              </div>

              {itemsTab === "items" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newItem: InventoryItem = {
                        id: uuidv4(),
                        name: "New Item",
                        description: "",
                        iconAssetId: null,
                      };
                      pushHistory({
                        ...project,
                        inventoryItems: [...project.inventoryItems, newItem],
                      });
                    }}
                    className="flex flex-1 items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                  >
                    <Plus size={16} /> Create Item
                  </button>
                  <div className="flex gap-1 relative group">
                     <button className="flex items-center justify-center gap-2 px-4 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 text-sm">
                        IO
                     </button>
                     <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-neutral-900 border border-neutral-700 rounded shadow-xl z-[50] min-w-[200px]">
                        <div 
                          className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs"
                          onClick={() => downloadJSON({ type: 'inventoryItems', version: '1.0', data: project.inventoryItems }, 'inventory_items.json')}
                        >Export JSON</div>
                        <div 
                          className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-xs relative"
                        >
                           Import JSON
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                 const parsed = await loadJSON(file);
                                 if (parsed.type === 'inventoryItems') {
                                    pushHistory({ ...project, inventoryItems: parsed.data });
                                 } else if (parsed.type === 'inventoryItem') {
                                    pushHistory({ ...project, inventoryItems: [...project.inventoryItems, parsed.data] });
                                 }
                              } catch (e) { alert("Failed to parse JSON"); }
                           }} />
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const newRecipe: CraftingRecipe = {
                      id: uuidv4(),
                      name: "New Recipe",
                      ingredient1Id: "",
                      ingredient2Id: "",
                      resultItemId: "",
                      destroyIngredient1: true,
                      destroyIngredient2: true,
                      successMessage: "Crafting successful!",
                    };
                    pushHistory({
                      ...project,
                      craftingRecipes: [
                        ...(project.craftingRecipes || []),
                        newRecipe,
                      ],
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 font-bold"
                >
                  <Plus size={16} /> Create Recipe
                </button>
              )}
            </div>

            {itemsTab === "items" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
                {project.inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-neutral-800 rounded border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                        {item.iconAssetId &&
                        project.assets.find(
                          (a) => a.id === item.iconAssetId,
                        ) ? (
                          <img
                            src={
                              project.assets.find(
                                (a) => a.id === item.iconAssetId,
                              )?.src || undefined
                            }
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Backpack size={24} className="text-neutral-600" />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          pushHistory({
                            ...project,
                            inventoryItems: project.inventoryItems.filter(
                              (i) => i.id !== item.id,
                            ),
                          });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <LabelWithHelp
                        label="Name"
                        helpText="The primary name of this item. E.g. 'Rusty Key'."
                        className="text-sm uppercase font-bold"
                      />
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          pushHistory({
                            ...project,
                            inventoryItems: project.inventoryItems.map((i) =>
                              i.id === item.id
                                ? { ...i, name: e.target.value }
                                : i,
                            ),
                          });
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1 mb-2"
                      />

                      <LabelWithHelp
                        label="RPG Category"
                        helpText="What kind of item is this?"
                        className="text-sm uppercase font-bold"
                      />
                      <select
                        value={item.category || "normal"}
                        onChange={(e) => {
                          pushHistory({
                            ...project,
                            inventoryItems: project.inventoryItems.map((i) =>
                              i.id === item.id
                                ? { ...i, category: e.target.value as any }
                                : i,
                            ),
                          });
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1"
                      >
                        <option value="normal">Normal Item</option>
                        <option value="consumable">
                          Consumable (Food/Potion)
                        </option>
                        <option value="ingredient">
                          Ingredient (Crafting)
                        </option>
                        <option value="quest">Quest Item</option>
                        <option value="crafting_station">
                          Crafting Station / Tool
                        </option>
                      </select>
                    </div>

                    <div>
                      <LabelWithHelp
                        label="Description"
                        helpText="The text shown to the player when they inspect this item in their inventory."
                        className="text-sm uppercase font-bold"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          pushHistory({
                            ...project,
                            inventoryItems: project.inventoryItems.map((i) =>
                              i.id === item.id
                                ? { ...i, description: e.target.value }
                                : i,
                            ),
                          });
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1 min-h-[60px]"
                      ></textarea>
                    </div>

                    <div>
                      <LabelWithHelp
                        label="Icon Asset"
                        helpText="The image displayed for this item in menus. Click to choose."
                        className="text-sm uppercase font-bold mb-1 block"
                      />
                      <button
                        onClick={() =>
                          setAssetPickerCb({
                            onSelect: (id) => {
                              pushHistory({
                                ...project,
                                inventoryItems: project.inventoryItems.map(
                                  (i) =>
                                    i.id === item.id
                                      ? { ...i, iconAssetId: id }
                                      : i,
                                ),
                              });
                              setAssetPickerCb(null);
                            },
                            filterType: "image",
                          })
                        }
                        className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 rounded px-3 py-2 text-sm flex items-center justify-between transition-colors"
                      >
                        <span className="text-neutral-300 truncate pr-2">
                          {item.iconAssetId &&
                          project.assets.find((a) => a.id === item.iconAssetId)
                            ? project.assets.find(
                                (a) => a.id === item.iconAssetId,
                              )!.name
                            : "No Icon Selected"}
                        </span>
                        <ImageIcon
                          size={16}
                          className="text-neutral-500 shrink-0"
                        />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                      <label className="flex items-center gap-2 text-sm text-neutral-300 font-medium">
                        <input
                          type="checkbox"
                          className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900"
                          checked={item.isUsable || false}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              inventoryItems: project.inventoryItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, isUsable: e.target.checked }
                                  : i,
                              ),
                            })
                          }
                        />
                        Is Usable?
                      </label>
                      {item.isUsable && (
                        <div className="mt-2 pl-4 border-l-2 border-neutral-800 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm text-neutral-400">
                            <input
                              type="checkbox"
                              className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900"
                              checked={item.consumeOnUse || false}
                              onChange={(e) =>
                                pushHistory({
                                  ...project,
                                  inventoryItems: project.inventoryItems.map(
                                    (i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            consumeOnUse: e.target.checked,
                                          }
                                        : i,
                                  ),
                                })
                              }
                            />
                            Consume On Use
                          </label>
                          <div>
                            <LabelWithHelp
                              label="Use Message"
                              helpText="Message shown when used."
                              className="text-sm uppercase font-bold"
                            />
                            <input
                              type="text"
                              value={item.useMessage || ""}
                              onChange={(e) =>
                                pushHistory({
                                  ...project,
                                  inventoryItems: project.inventoryItems.map(
                                    (i) =>
                                      i.id === item.id
                                        ? { ...i, useMessage: e.target.value }
                                        : i,
                                  ),
                                })
                              }
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <LabelWithHelp
                              label="Use Sound"
                              helpText="Sound to play."
                              className="text-sm uppercase font-bold text-neutral-500"
                            />
                            <button
                                onClick={() => setAssetPickerCb({
                                  onSelect: (id) => {
                                    pushHistory({
                                      ...project,
                                      inventoryItems: project.inventoryItems.map((i) =>
                                        i.id === item.id ? { ...i, useSoundAssetId: id } : i
                                      ),
                                    });
                                  },
                                  filterType: "audio"
                                })}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 rounded px-3 py-2 text-sm flex items-center justify-between transition-colors mt-1"
                              >
                                <span className="text-neutral-300 truncate pr-2">
                                  {item.useSoundAssetId
                                    ? project.assets.find((a) => a.id === item.useSoundAssetId)?.name || "Unknown Audio"
                                    : "None"}
                                </span>
                                <Music size={16} className="text-neutral-500" />
                            </button>
                            {item.useSoundAssetId && (
                              <button 
                                onClick={() => {
                                  pushHistory({
                                    ...project,
                                    inventoryItems: project.inventoryItems.map((i) =>
                                      i.id === item.id ? { ...i, useSoundAssetId: undefined } : i
                                    ),
                                  });
                                }}
                                className="text-xs text-red-400 hover:text-red-300 mt-1"
                              >
                                Clear Sound
                              </button>
                            )}
                          </div>
                          <div className="pt-2 border-t border-neutral-800">
                            <div className="flex justify-between items-center mb-1">
                              <LabelWithHelp
                                label="Stat Effects"
                                helpText="Does this restore health or hunger?"
                                className="text-sm uppercase font-bold text-neutral-500"
                              />
                              <button
                                onClick={() => {
                                  pushHistory({
                                    ...project,
                                    inventoryItems: project.inventoryItems.map(
                                      (i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              statRestores: [
                                                ...(i.statRestores || []),
                                                { stat: "hunger", amount: 10 },
                                              ],
                                            }
                                          : i,
                                    ),
                                  });
                                }}
                                className="text-sm text-emerald-400 font-bold"
                              >
                                + Add
                              </button>
                            </div>
                            {(item.statRestores || []).map((restore, rIdx) => (
                              <div
                                key={rIdx}
                                className="flex gap-2 items-center mb-1"
                              >
                                <input
                                  type="text"
                                  value={restore.stat}
                                  onChange={(e) => {
                                    const nr = [...(item.statRestores || [])];
                                    nr[rIdx].stat = e.target.value;
                                    pushHistory({
                                      ...project,
                                      inventoryItems:
                                        project.inventoryItems.map((i) =>
                                          i.id === item.id
                                            ? { ...i, statRestores: nr }
                                            : i,
                                        ),
                                    });
                                  }}
                                  className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded px-1 py-1 text-sm"
                                  placeholder="e.g. hunger (use Needs tool words)"
                                />
                                <span className="text-sm">+</span>
                                <input
                                  type="number"
                                  value={restore.amount}
                                  onChange={(e) => {
                                    const nr = [...(item.statRestores || [])];
                                    nr[rIdx].amount =
                                      parseInt(e.target.value) || 0;
                                    pushHistory({
                                      ...project,
                                      inventoryItems:
                                        project.inventoryItems.map((i) =>
                                          i.id === item.id
                                            ? { ...i, statRestores: nr }
                                            : i,
                                        ),
                                    });
                                  }}
                                  className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 py-1 text-sm"
                                />
                                <button
                                  onClick={() => {
                                    const nr = [...(item.statRestores || [])];
                                    nr.splice(rIdx, 1);
                                    pushHistory({
                                      ...project,
                                      inventoryItems:
                                        project.inventoryItems.map((i) =>
                                          i.id === item.id
                                            ? { ...i, statRestores: nr }
                                            : i,
                                        ),
                                    });
                                  }}
                                  className="text-red-500"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                      <div className="flex justify-between items-center mb-2">
                        <LabelWithHelp
                          label="Combinations"
                          helpText="Items that can be combined with this one."
                          className="text-sm uppercase font-bold"
                        />
                        <button
                          onClick={() => {
                            const newComb = {
                              withItemId: "",
                              resultItemId: null,
                              destroyTarget: true,
                              destroySelf: true,
                            };
                            pushHistory({
                              ...project,
                              inventoryItems: project.inventoryItems.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      combinations: [
                                        ...(i.combinations || []),
                                        newComb,
                                      ],
                                    }
                                  : i,
                              ),
                            });
                          }}
                          className="text-sm text-emerald-400 hover:text-emerald-300 font-bold"
                        >
                          + Add
                        </button>
                      </div>
                      {(item.combinations || []).map(
                        (comb: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className="bg-neutral-950 p-2 rounded mb-2 border border-neutral-800 text-sm flex flex-col gap-2 relative group"
                          >
                            <button
                              onClick={() => {
                                const newCombs = [...(item.combinations || [])];
                                newCombs.splice(cIdx, 1);
                                pushHistory({
                                  ...project,
                                  inventoryItems: project.inventoryItems.map(
                                    (i) =>
                                      i.id === item.id
                                        ? { ...i, combinations: newCombs }
                                        : i,
                                  ),
                                });
                              }}
                              className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100"
                            >
                              <X size={12} />
                            </button>

                            <div>
                              <label className="text-[9px] text-neutral-500 uppercase">
                                Combine With
                              </label>
                              <select
                                value={comb.withItemId}
                                onChange={(e) => {
                                  const newCombs = [
                                    ...(item.combinations || []),
                                  ];
                                  newCombs[cIdx].withItemId = e.target.value;
                                  pushHistory({
                                    ...project,
                                    inventoryItems: project.inventoryItems.map(
                                      (i) =>
                                        i.id === item.id
                                          ? { ...i, combinations: newCombs }
                                          : i,
                                    ),
                                  });
                                }}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-1 py-1 mt-0.5"
                              >
                                <option value="">Select Item...</option>
                                {project.inventoryItems
                                  .filter((i: any) => i.id !== item.id)
                                  .map((i: any) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-neutral-500 uppercase">
                                Result Item
                              </label>
                              <select
                                value={comb.resultItemId || ""}
                                onChange={(e) => {
                                  const newCombs = [
                                    ...(item.combinations || []),
                                  ];
                                  newCombs[cIdx].resultItemId =
                                    e.target.value || null;
                                  pushHistory({
                                    ...project,
                                    inventoryItems: project.inventoryItems.map(
                                      (i) =>
                                        i.id === item.id
                                          ? { ...i, combinations: newCombs }
                                          : i,
                                    ),
                                  });
                                }}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-1 py-1 mt-0.5"
                              >
                                <option value="">None (Just consumed)</option>
                                {project.inventoryItems.map((i: any) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-neutral-500 uppercase">
                                Success Message
                              </label>
                              <input
                                type="text"
                                value={comb.successMessage || ""}
                                onChange={(e) => {
                                  const newCombs = [
                                    ...(item.combinations || []),
                                  ];
                                  newCombs[cIdx].successMessage =
                                    e.target.value;
                                  pushHistory({
                                    ...project,
                                    inventoryItems: project.inventoryItems.map(
                                      (i) =>
                                        i.id === item.id
                                          ? { ...i, combinations: newCombs }
                                          : i,
                                    ),
                                  });
                                }}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-1 py-1 mt-0.5 text-sm"
                                placeholder="Items combined successfully!"
                              />
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950 h-3 w-3"
                                  checked={comb.destroySelf}
                                  onChange={(e) => {
                                    const newCombs = [
                                      ...(item.combinations || []),
                                    ];
                                    newCombs[cIdx].destroySelf =
                                      e.target.checked;
                                    pushHistory({
                                      ...project,
                                      inventoryItems:
                                        project.inventoryItems.map((i) =>
                                          i.id === item.id
                                            ? { ...i, combinations: newCombs }
                                            : i,
                                        ),
                                    });
                                  }}
                                />{" "}
                                Destroy This Item
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-950 h-3 w-3"
                                  checked={comb.destroyTarget}
                                  onChange={(e) => {
                                    const newCombs = [
                                      ...(item.combinations || []),
                                    ];
                                    newCombs[cIdx].destroyTarget =
                                      e.target.checked;
                                    pushHistory({
                                      ...project,
                                      inventoryItems:
                                        project.inventoryItems.map((i) =>
                                          i.id === item.id
                                            ? { ...i, combinations: newCombs }
                                            : i,
                                        ),
                                    });
                                  }}
                                />{" "}
                                Destroy Target Item
                              </label>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
                {project.inventoryItems.length === 0 && (
                  <div className="col-span-full text-center text-neutral-500 py-10">
                    No items created yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar pb-20">
                {(project.craftingRecipes || []).map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex gap-4 items-center"
                  >
                    <div className="flex-1 grid grid-cols-11 gap-2 items-center">
                      <div className="col-span-2 flex flex-col gap-1 text-sm text-neutral-400 font-medium">
                        <label>Ingr. 1</label>
                        <select
                          value={recipe.ingredient1Id}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              craftingRecipes: project.craftingRecipes.map(
                                (r) =>
                                  r.id === recipe.id
                                    ? { ...r, ingredient1Id: e.target.value }
                                    : r,
                              ),
                            })
                          }
                          className="bg-neutral-800 border border-neutral-700 rounded p-1.5 focus:border-indigo-500"
                        >
                          <option value="">Select Item...</option>
                          {project.inventoryItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 mt-1 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={recipe.destroyIngredient1}
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                craftingRecipes: project.craftingRecipes.map(
                                  (r) =>
                                    r.id === recipe.id
                                      ? {
                                          ...r,
                                          destroyIngredient1: e.target.checked,
                                        }
                                      : r,
                                ),
                              })
                            }
                            className="rounded bg-neutral-800 border-neutral-700 text-indigo-500"
                          />
                          Consume
                        </label>
                      </div>

                      <div className="col-span-1 flex justify-center text-neutral-600 font-bold text-2xl">
                        +
                      </div>

                      <div className="col-span-2 flex flex-col gap-1 text-sm text-neutral-400 font-medium">
                        <label>Ingr. 2</label>
                        <select
                          value={recipe.ingredient2Id}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              craftingRecipes: project.craftingRecipes.map(
                                (r) =>
                                  r.id === recipe.id
                                    ? { ...r, ingredient2Id: e.target.value }
                                    : r,
                              ),
                            })
                          }
                          className="bg-neutral-800 border border-neutral-700 rounded p-1.5 focus:border-indigo-500"
                        >
                          <option value="">Select Item...</option>
                          {project.inventoryItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 mt-1 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={recipe.destroyIngredient2}
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                craftingRecipes: project.craftingRecipes.map(
                                  (r) =>
                                    r.id === recipe.id
                                      ? {
                                          ...r,
                                          destroyIngredient2: e.target.checked,
                                        }
                                      : r,
                                ),
                              })
                            }
                            className="rounded bg-neutral-800 border-neutral-700 text-indigo-500"
                          />
                          Consume
                        </label>
                      </div>

                      <div className="col-span-1 flex justify-center text-neutral-600 font-bold text-2xl">
                        +
                      </div>

                      <div className="col-span-2 flex flex-col gap-1 text-sm text-neutral-400 font-medium">
                        <label>Ingr. 3</label>
                        <select
                          value={recipe.ingredient3Id || ""}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              craftingRecipes: project.craftingRecipes.map(
                                (r) =>
                                  r.id === recipe.id
                                    ? { ...r, ingredient3Id: e.target.value || undefined }
                                    : r,
                              ),
                            })
                          }
                          className="bg-neutral-800 border border-neutral-700 rounded p-1.5 focus:border-indigo-500 text-xs"
                        >
                          <option value="">(Optional)</option>
                          {project.inventoryItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 mt-1 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={recipe.destroyIngredient3 ?? true}
                            onChange={(e) =>
                              pushHistory({
                                ...project,
                                craftingRecipes: project.craftingRecipes.map(
                                  (r) =>
                                    r.id === recipe.id
                                      ? {
                                          ...r,
                                          destroyIngredient3: e.target.checked,
                                        }
                                      : r,
                                ),
                              })
                            }
                            className="rounded bg-neutral-800 border-neutral-700 text-indigo-500"
                          />
                          Consume
                        </label>
                      </div>

                      <div className="col-span-1 flex justify-center text-indigo-500 font-bold">
                        <Plus size={24} />
                      </div>

                      <div className="col-span-2 flex flex-col gap-1 text-sm text-neutral-400 font-medium">
                        <label>Result</label>
                        <select
                          value={recipe.resultItemId}
                          onChange={(e) =>
                            pushHistory({
                              ...project,
                              craftingRecipes: project.craftingRecipes.map(
                                (r) =>
                                  r.id === recipe.id
                                    ? { ...r, resultItemId: e.target.value }
                                    : r,
                              ),
                            })
                          }
                          className="bg-neutral-800 border border-neutral-700 rounded p-1.5 focus:border-emerald-500 text-emerald-400 font-bold"
                        >
                          <option value="">Result Item...</option>
                          {project.inventoryItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="w-[1px] h-full bg-neutral-800 self-stretch my-2" />

                    <div className="w-[200px] flex flex-col gap-1 text-sm text-neutral-400 font-medium shrink-0">
                      <label>Success Message</label>
                      <input
                        type="text"
                        value={recipe.successMessage}
                        onChange={(e) =>
                          pushHistory({
                            ...project,
                            craftingRecipes: project.craftingRecipes.map((r) =>
                              r.id === recipe.id
                                ? { ...r, successMessage: e.target.value }
                                : r,
                            ),
                          })
                        }
                        className="bg-neutral-800 border border-neutral-700 rounded p-1.5 focus:border-indigo-500"
                        placeholder="Crafting successful!"
                      />
                    </div>

                    <button
                      onClick={() =>
                        pushHistory({
                          ...project,
                          craftingRecipes: project.craftingRecipes.filter(
                            (r) => r.id !== recipe.id,
                          ),
                        })
                      }
                      className="p-2 ml-2 text-red-500 hover:bg-neutral-800 rounded transition-colors self-center shrink-0"
                      title="Delete Recipe"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {(project.craftingRecipes || []).length === 0 && (
                  <div className="col-span-full text-center text-neutral-500 py-10">
                    No crafting recipes created yet. Keep players crafting by
                    adding some recipes above.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {editorMode === "assets" && (
          <AssetLibraryManager
            project={project}
            updateProject={(updates) => pushHistory({ ...project, ...updates })}
          />
        )}

        {editorMode === "map_maker" && (
          <MapMaker
            project={project}
            updateProject={(updates) => pushHistory({ ...project, ...updates })}
          />
        )}
      </div>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Start a New Project</h2>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setConfirmTemplateId(null);
                }}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-neutral-400 mb-6">
              Choose a template to quickly set up your workspace.{" "}
              <span className="text-red-400 font-bold">
                Warning: This will overwrite your current project!
              </span>
            </p>

            <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
              {Object.entries(TEMPLATES).map(([key, templateFn]) => {
                const temp = templateFn();
                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (confirmTemplateId === key) {
                        setProject({ ...temp, assets: project.assets });
                        setHistory({ past: [], future: [] });
                        setIsTemplateModalOpen(false);
                        setConfirmTemplateId(null);
                      } else {
                        setConfirmTemplateId(key);
                      }
                    }}
                    className={`border p-4 rounded-lg cursor-pointer transition-colors group relative overflow-hidden ${
                      confirmTemplateId === key
                        ? "border-red-500 bg-red-500/10"
                        : "border-neutral-700 hover:border-emerald-500 bg-neutral-800"
                    }`}
                  >
                    {confirmTemplateId === key && (
                      <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm z-10 flex flex-col justify-center items-center">
                        <span className="text-white font-bold mb-2">
                          Overwrite Project?
                        </span>
                        <span className="bg-red-500 hover:bg-red-400 text-white text-sm px-3 py-1 rounded shadow-lg transition-colors">
                          Click again to confirm
                        </span>
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-emerald-400 mb-2">
                      {temp.name}
                    </h3>
                    <ul className="text-sm text-neutral-400 space-y-1 mb-4">
                      <li>• {temp.scenes.length} Scene(s)</li>
                      <li>• {temp.dialogueTrees.length} Conversation(s)</li>
                      <li>• {temp.inventoryItems.length} Item(s)</li>
                    </ul>
                    <div className="text-sm font-medium text-neutral-300 group-hover:text-emerald-400 transition-colors">
                      Start Building →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Object Context Menu */}
      {contextMenu &&
        (() => {
          const obj = contextMenu.objectId
            ? project.scenes
                .flatMap((s) => s.objects)
                .concat(project.uiMenus?.flatMap((m) => m.objects) || [])
                .find((o) => o.id === contextMenu.objectId)
            : null;

          if (contextMenu.objectId && !obj) return null;

          return (
            <div
              className="fixed z-[9999] bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg py-1 min-w-[160px] text-sm overflow-hidden"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onPointerDown={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {!obj ? (
                <>
                  <div className="px-3 py-1.5 text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 mb-1">
                    Scene Options
                  </div>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-400 font-bold"
                    onClick={() => {
                      // Find player object if it exists and move it here
                      const playerObj = currentScene.objects.find(
                        (o) =>
                          o.name?.toLowerCase().includes("player"),
                      );
                      if (playerObj) {
                        const rect = stageRef.current?.getBoundingClientRect();
                        if (rect) {
                          const x = contextMenu.x - rect.left;
                          const y = contextMenu.y - rect.top;
                          updateObject(playerObj.id, { x, y });
                        }
                      }
                      setContextMenu(null);
                      setIsPlaying(true);
                      setTriggeredObjects(new Set());
                      setPlayerInventory([]);
                      setCollectedObjects([]);
                      setPlayerFlags([]);
                      setActiveQuests(
                        project.quests
                          ?.filter((q) => q.autoStart)
                          .map((q) => q.id) || [],
                      );
                      setCompletedQuests([]);
                      setActiveUiMenus([]);
                      // Clear dialogue history or queue if present
                      setActiveDialogue(null);
                    }}
                  >
                    <Play size={14} /> Play from Here
                  </button>
                  <button
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${clipboard.length > 0 ? "hover:bg-neutral-800" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => {
                      if (clipboard.length === 0) return;
                      const rect = stageRef.current?.getBoundingClientRect();
                      const baseX = rect ? contextMenu.x - rect.left : 0;
                      const baseY = rect ? contextMenu.y - rect.top : 0;
                      // Move first pasted object to context menu x,y and others relative to it
                      const firstX = clipboard[0].x;
                      const firstY = clipboard[0].y;

                      const newObjs = clipboard.map((o) => ({
                        ...o,
                        id: uuidv4(),
                        x: baseX + (o.x - firstX),
                        y: baseY + (o.y - firstY),
                        locked: false,
                      }));

                      setProject((p) => ({
                        ...p,
                        scenes: p.scenes.map((s) => {
                          if (
                            editorMode === "stage" &&
                            s.id === currentScene.id
                          ) {
                            return {
                              ...s,
                              objects: [...s.objects, ...newObjs],
                            };
                          }
                          return s;
                        }),
                        uiMenus: p.uiMenus?.map((m) => {
                          if (
                            editorMode === "ui_stage" &&
                            m.id === currentScene.id
                          ) {
                            return {
                              ...m,
                              objects: [...m.objects, ...newObjs],
                            };
                          }
                          return m;
                        }),
                      }));
                      setContextMenu(null);
                    }}
                  >
                    <Package size={14} className="text-neutral-400" />
                    Paste {clipboard.length > 0 ? `(${clipboard.length})` : ""}
                  </button>
                  <div className="h-px bg-neutral-800 my-1 mx-2" />
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                    onClick={() => {
                      const rect = stageRef.current?.getBoundingClientRect();
                      const x = rect ? contextMenu.x - rect.left : 0;
                      const y = rect ? contextMenu.y - rect.top : 0;
                      const newObj: SceneObject = {
                        id: uuidv4(),
                        name: "New Text",
                        src: "",
                        cursor: "default",
                        x, y,
                        width: 100,
                        height: 50,
                        rotation: 0,
                        zIndex: Math.max(...currentScene.objects.map(o => o.zIndex), 0) + 1,
                        opacity: 1,
                        locked: false,
                        interaction: "none",
                        isText: true,
                        textContent: "Hello!",
                        textColor: "#ffffff",
                        textFontSize: 24,
                        textFontFamily: "sans-serif",
                        animation: "none",
                        blendMode: "normal",
                        parallaxSpeed: 1,
                        hasPhysics: false,
                      };
                      updateScene({ objects: [...currentScene.objects, newObj] });
                      setSelectedObjectId(newObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <Type size={14} /> Add Text here
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                    onClick={() => {
                      const rect = stageRef.current?.getBoundingClientRect();
                      const x = rect ? contextMenu.x - rect.left : 0;
                      const y = rect ? contextMenu.y - rect.top : 0;
                      const newObj: SceneObject = {
                        id: uuidv4(),
                        name: "Click Target",
                        src: "",
                        cursor: "default",
                        x, y,
                        width: 100,
                        height: 100,
                        rotation: 0,
                        zIndex: Math.max(...currentScene.objects.map(o => o.zIndex), 0) + 1,
                        opacity: 1,
                        locked: false,
                        interaction: "none",
                        isHitbox: true,
                        animation: "none",
                        blendMode: "normal",
                        parallaxSpeed: 1,
                        hasPhysics: false,
                      };
                      updateScene({ objects: [...currentScene.objects, newObj] });
                      setSelectedObjectId(newObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <MousePointer2 size={14} /> Add Invisible Click Target
                  </button>
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 mb-1">
                    {obj.name}
                  </div>

                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      if (
                        selectedMultiIds.length > 1 &&
                        selectedMultiIds.includes(obj.id)
                      ) {
                        const objs = currentScene.objects.filter((o) =>
                          selectedMultiIds.includes(o.id),
                        );
                        setClipboard(objs);
                      } else {
                        setClipboard([obj]);
                      }
                      setContextMenu(null);
                    }}
                  >
                    <Copy size={14} className="text-neutral-400" /> Copy
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-indigo-300 hover:text-indigo-200"
                    onClick={() => {
                       const prefabObj = { ...obj, id: uuidv4() };
                       setProject(p => ({
                          ...p,
                          prefabs: [...(p.prefabs || []), prefabObj]
                       }));
                       setContextMenu(null);
                    }}
                  >
                    <Box size={14} /> Save as Stamp
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      if (
                        selectedMultiIds.length > 1 &&
                        selectedMultiIds.includes(obj.id)
                      ) {
                        const objs = currentScene.objects.filter((o) =>
                          selectedMultiIds.includes(o.id),
                        );
                        setClipboard(objs);
                        const idsToDel = objs.map((o) => o.id);
                        setProject((p) => ({
                          ...p,
                          scenes: p.scenes.map((s) =>
                            s.id === currentScene.id
                              ? {
                                  ...s,
                                  objects: s.objects.filter(
                                    (o) => !idsToDel.includes(o.id),
                                  ),
                                }
                              : s,
                          ),
                          uiMenus: p.uiMenus?.map((m) =>
                            m.id === currentScene.id
                              ? {
                                  ...m,
                                  objects: m.objects.filter(
                                    (o) => !idsToDel.includes(o.id),
                                  ),
                                }
                              : m,
                          ),
                        }));
                      } else {
                        setClipboard([obj]);
                        setProject((p) => ({
                          ...p,
                          scenes: p.scenes.map((s) =>
                            s.id === currentScene.id
                              ? {
                                  ...s,
                                  objects: s.objects.filter(
                                    (o) => o.id !== obj.id,
                                  ),
                                }
                              : s,
                          ),
                          uiMenus: p.uiMenus?.map((m) =>
                            m.id === currentScene.id
                              ? {
                                  ...m,
                                  objects: m.objects.filter(
                                    (o) => o.id !== obj.id,
                                  ),
                                }
                              : m,
                          ),
                        }));
                      }
                      setContextMenu(null);
                    }}
                  >
                    <PackageX size={14} className="text-neutral-400" /> Cut
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateObject(obj.id, { locked: !obj.locked });
                      setContextMenu(null);
                    }}
                  >
                    {obj.locked ? (
                      <Unlock size={14} className="text-neutral-400" />
                    ) : (
                      <Lock size={14} className="text-neutral-400" />
                    )}
                    {obj.locked ? "Unlock" : "Lock"}
                  </button>

                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateObject(obj.id, {
                        hidden: !obj.hidden,
                      });
                      setContextMenu(null);
                    }}
                  >
                    {obj.hidden ? (
                      <Eye size={14} className="text-neutral-400" />
                    ) : (
                      <EyeOff size={14} className="text-neutral-400" />
                    )}
                    {obj.hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateObject(obj.id, { zIndex: obj.zIndex - 1 });
                      setContextMenu(null);
                    }}
                  >
                    <ArrowDown size={14} className="text-neutral-400" /> Send
                    Backward
                  </button>
                  <div className="h-px bg-neutral-800 my-1 font-bold text-neutral-400 mx-2" />
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-indigo-400"
                    onClick={() => {
                      // Quick Duplicate
                      const newObj = {
                        ...obj,
                        id: uuidv4(),
                        x: obj.x + 20,
                        y: obj.y + 20,
                        zIndex:
                          Math.max(
                            ...currentScene.objects.map((o) => o.zIndex),
                            0,
                          ) + 1,
                      };
                      updateScene({
                        objects: [...currentScene.objects, newObj],
                      });
                      setSelectedObjectId(newObj.id);
                      setContextMenu(null);
                    }}
                  >
                    <Copy size={14} /> Duplicate
                  </button>

                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateScene({
                        objects: currentScene.objects.filter(
                          (o) => o.id !== obj.id,
                        ),
                      });
                      setSelectedObjectId(null);
                      setContextMenu(null);
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <div className="h-px bg-neutral-800 my-1 mx-2" />
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateScene({
                        objects: currentScene.objects.map((o) =>
                          o.id === obj.id
                            ? { ...o, zIndex: Math.max(0, o.zIndex - 1) }
                            : o
                        ),
                      });
                    }}
                  >
                    <ArrowDown size={14} className="text-neutral-400" /> Send Backward
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      updateScene({
                        objects: currentScene.objects.map((o) =>
                          o.id === obj.id
                            ? { ...o, zIndex: o.zIndex + 1 }
                            : o
                        ),
                      });
                    }}
                  >
                    <ArrowUp size={14} className="text-neutral-400" /> Bring Forward
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2"
                    onClick={() => {
                      setSelectedObjectId(obj.id);
                      setContextMenu(null);
                      setTimeout(() => {
                        const input = document.getElementById("properties-name-input");
                        if (input) {
                          input.focus();
                          (input as HTMLInputElement).select();
                        }
                      }, 50);
                    }}
                  >
                    <Type size={14} className="text-neutral-400" /> Quick Rename
                  </button>
                </>
              )}
            </div>
          );
        })()}

      {/* AI Sprite Generator Modal */}
      {isAiModalOpen && (
        <AISpriteModal
          onClose={() => setIsAiModalOpen(false)}
          onSave={(base64Image, generatedName) => {
            const newAsset: Asset = {
              id: uuidv4(),
              type: "image",
              category: "ai_generated",
              src: base64Image,
              name: generatedName,
            };
            setProject((p) => ({ ...p, assets: [newAsset, ...p.assets] }));
            setIsAiModalOpen(false);
          }}
        />
      )}

      {/* Image Editor Modal */}
      {editingAssetId && (
        <ImageEditorModal
          asset={project.assets.find((a) => a.id === editingAssetId)!}
          onSave={(newSrc, isNew) => {
            const originalAsset = project.assets.find(
              (a) => a.id === editingAssetId,
            );

            if (isNew && originalAsset) {
              const newAsset: Asset = {
                ...originalAsset,
                id: uuidv4(),
                src: newSrc,
                name: `${originalAsset.name}_crop`,
              };
              setProject((p) => ({
                ...p,
                assets: [newAsset, ...p.assets],
              }));
            } else {
              setProject((p) => ({
                ...p,
                assets: p.assets.map((a) =>
                  a.id === editingAssetId ? { ...a, src: newSrc } : a,
                ),
                prefabs: (p.prefabs || []).map(o => o._assetId === editingAssetId ? { ...o, src: newSrc } : o),
                scenes: p.scenes.map(s => ({
                  ...s,
                  objects: s.objects.map(o => o._assetId === editingAssetId ? { ...o, src: newSrc } : o)
                })),
                uiMenus: p.uiMenus ? p.uiMenus.map(m => ({
                  ...m,
                  objects: m.objects.map(o => o._assetId === editingAssetId ? { ...o, src: newSrc } : o)
                })) : []
              }));
            }
            setEditingAssetId(null);
          }}
          onClose={() => setEditingAssetId(null)}
        />
      )}

      {calibratingFrameAssetId &&
        (() => {
          const frameAsset = project.assets.find(
            (asset) => asset.id === calibratingFrameAssetId,
          );
          if (!frameAsset) return null;
          return (
            <DeviceFrameCalibrator
              assetId={frameAsset.id}
              imageSrc={frameAsset.src}
              initialCalibration={
                project.globalSettings.deviceFrame?.assetId === frameAsset.id
                  ? (project.globalSettings
                      .deviceFrame as DeviceFrameCalibration)
                  : undefined
              }
              onCancel={() => setCalibratingFrameAssetId(null)}
              onSave={(calibration) => {
                pushHistory({
                  ...project,
                  globalSettings: {
                    ...project.globalSettings,
                    deviceFrame: calibration,
                  },
                });
                setCalibratingFrameAssetId(null);
              }}
            />
          );
        })()}

      {assetPickerCb && (
        <AssetPickerModal
          assets={
            assetPickerCb.onlyOnCanvas
              ? project.assets.filter((a) => usedAssetSrcs.has(a.src))
              : project.assets
          }
          canvasAssetIds={Array.from(
            new Set(
              project.assets
                .filter((a) => usedAssetSrcs.has(a.src))
                .map((a) => a.id),
            ),
          )}
          recentAssetIds={recentAssetIds}
          onSelect={(id) => {
            setRecentAssetIds((prev) =>
              [id, ...prev.filter((i) => i !== id)].slice(0, 20),
            );
            assetPickerCb.onSelect(id);
          }}
          onClose={() => setAssetPickerCb(null)}
          filterType={assetPickerCb.filterType}
          onToggleFavorite={(id) => {
            setProject((p) => ({
              ...p,
              assets: p.assets.map((a) =>
                a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
              ),
            }));
          }}
          onUpdateAsset={(id, updates) => {
             setProject((p) => ({
              ...p,
              assets: p.assets.map((a) =>
                a.id === id ? { ...a, ...updates } : a
              ),
            }));
          }}
        />
      )}

      {showAIAssistant && (
        <AIAssistant
          project={project}
          updateProject={(updates) => setProject((p) => ({ ...p, ...updates }))}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </div>
  );
};

export default App;
