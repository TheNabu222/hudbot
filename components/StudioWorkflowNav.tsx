import React from "react";
import {
  Backpack,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Map as MapIcon,
  MessageSquare,
  Play,
  Shield,
  Sparkles,
  Square,
  StopCircle,
} from "lucide-react";

export type EditorMode =
  | "stage"
  | "dialogue"
  | "items"
  | "scenes"
  | "ui_maker"
  | "ui_stage"
  | "rpg_systems"
  | "map_maker"
  | "assets";

type WorkspacePhase = "collect" | "compose" | "behaviors" | "connect";

interface StudioWorkflowNavProps {
  editorMode: EditorMode;
  isPlaying: boolean;
  onModeChange: (mode: EditorMode) => void;
  onTogglePlay: () => void;
  onExport: () => void;
}

const phaseForMode: Record<EditorMode, WorkspacePhase> = {
  assets: "collect",
  stage: "compose",
  scenes: "compose",
  ui_maker: "compose",
  ui_stage: "compose",
  dialogue: "behaviors",
  items: "behaviors",
  rpg_systems: "behaviors",
  map_maker: "connect",
};

const phaseCopy: Record<WorkspacePhase, { eyebrow: string; detail: string }> = {
  collect: {
    eyebrow: "Feed the archive",
    detail: "Gather, tag, edit, and prepare the ingredients of your world.",
  },
  compose: {
    eyebrow: "Build the visible world",
    detail: "Arrange rooms, props, interfaces, and all the clickable little freaks.",
  },
  behaviors: {
    eyebrow: "Teach it how to react",
    detail: "Write conversations, items, quests, rules, relationships, and consequences.",
  },
  connect: {
    eyebrow: "Make the world navigable",
    detail: "Connect locations and reveal how the player moves through the game.",
  },
};

const subtools: Record<
  WorkspacePhase,
  Array<{
    mode: EditorMode;
    label: string;
    note: string;
    icon: React.ElementType;
  }>
> = {
  collect: [
    {
      mode: "assets",
      label: "Asset Library",
      note: "files, tags & edits",
      icon: FolderOpen,
    },
  ],
  compose: [
    {
      mode: "stage",
      label: "Scene Studio",
      note: "drag, dress & arrange",
      icon: ImageIcon,
    },
    {
      mode: "scenes",
      label: "Rooms",
      note: "manage locations",
      icon: Layers,
    },
    {
      mode: "ui_maker",
      label: "Menus & HUD",
      note: "player-facing UI",
      icon: LayoutTemplate,
    },
    {
      mode: "ui_stage",
      label: "UI Canvas",
      note: "edit active menu",
      icon: Square,
    },
  ],
  behaviors: [
    {
      mode: "dialogue",
      label: "Conversations",
      note: "words & branches",
      icon: MessageSquare,
    },
    {
      mode: "items",
      label: "Items & Crafting",
      note: "things with purpose",
      icon: Backpack,
    },
    {
      mode: "rpg_systems",
      label: "World Rules",
      note: "quests, lore & people",
      icon: Shield,
    },
  ],
  connect: [
    {
      mode: "map_maker",
      label: "World Map",
      note: "places & passage",
      icon: MapIcon,
    },
  ],
};

const phases: Array<{
  id: WorkspacePhase;
  number: string;
  label: string;
  defaultMode: EditorMode;
}> = [
  { id: "collect", number: "01", label: "Collect", defaultMode: "assets" },
  { id: "compose", number: "02", label: "Compose", defaultMode: "stage" },
  {
    id: "behaviors",
    number: "03",
    label: "Behaviors",
    defaultMode: "dialogue",
  },
  { id: "connect", number: "04", label: "Connect", defaultMode: "map_maker" },
];

export const StudioWorkflowNav: React.FC<StudioWorkflowNavProps> = ({
  editorMode,
  isPlaying,
  onModeChange,
  onTogglePlay,
  onExport,
}) => {
  const activePhase = phaseForMode[editorMode];
  const activeCopy = phaseCopy[activePhase];

  return (
    <nav className="studio-workflow" aria-label="Game creation workflow">
      <div className="studio-workflow__rail">
        <div className="studio-workflow__steps" role="tablist">
          {phases.map((phase) => {
            const isActive = activePhase === phase.id && !isPlaying;
            return (
              <button
                key={phase.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onModeChange(phase.defaultMode)}
                className={`studio-step ${isActive ? "is-active" : ""}`}
              >
                <span className="studio-step__number">{phase.number}</span>
                <span className="studio-step__label">{phase.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onTogglePlay}
            className={`studio-step studio-step--play ${isPlaying ? "is-active" : ""}`}
          >
            <span className="studio-step__number">05</span>
            {isPlaying ? <StopCircle size={16} /> : <Play size={16} />}
            <span className="studio-step__label">
              {isPlaying ? "Stop Test" : "Play"}
            </span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="studio-step studio-step--publish"
          >
            <span className="studio-step__number">06</span>
            <Download size={16} />
            <span className="studio-step__label">Publish</span>
          </button>
        </div>
      </div>

      <div className="studio-workflow__context">
        <div className="studio-workflow__copy">
          <span className="studio-workflow__eyebrow">
            <Sparkles size={13} />
            {isPlaying ? "The toy is alive" : activeCopy.eyebrow}
          </span>
          <span className="studio-workflow__detail">
            {isPlaying
              ? "Click around as a player. Stop the test whenever you want to keep building."
              : activeCopy.detail}
          </span>
        </div>

        {!isPlaying && (
          <div className="studio-subtools" aria-label="Current phase tools">
            {subtools[activePhase]
              .filter(
                (tool) =>
                  tool.mode !== "ui_stage" || editorMode === "ui_stage",
              )
              .map((tool) => {
              const Icon = tool.icon;
              const isActive = editorMode === tool.mode;
              return (
                <button
                  key={tool.mode}
                  type="button"
                  onClick={() => onModeChange(tool.mode)}
                  className={`studio-subtool ${isActive ? "is-active" : ""}`}
                  title={tool.note}
                >
                  <Icon size={15} />
                  <span>
                    <strong>{tool.label}</strong>
                    <small>{tool.note}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
