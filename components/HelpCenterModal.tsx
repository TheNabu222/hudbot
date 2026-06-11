import React, { useEffect, useMemo, useState } from "react";
import {
  Backpack,
  BookOpen,
  Boxes,
  Download,
  FolderOpen,
  Gamepad2,
  Image,
  Keyboard,
  Map,
  MessageSquare,
  MousePointerClick,
  Play,
  Search,
  Shield,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

interface HelpCenterModalProps {
  onClose: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  eyebrow: string;
  icon: React.ElementType;
  intro: string;
  items: Array<{
    title: string;
    detail: string;
    tip?: string;
  }>;
}

const helpSections: HelpSection[] = [
  {
    id: "quick-start",
    title: "Quick Start",
    eyebrow: "Make something move in five minutes",
    icon: Sparkles,
    intro:
      "Cavebot follows one creative loop: collect ingredients, compose a scene, give things behaviors, connect the world, test it, then publish.",
    items: [
      {
        title: "1. Collect files",
        detail:
          "Open Collect to upload and organize images, GIFs, audio, and video. Add names, descriptions, tags, favorites, and folders so assets remain findable.",
        tip: "You can also drag supported files directly from Finder onto the scene canvas.",
      },
      {
        title: "2. Build a room",
        detail:
          "Open Compose → Scene Studio. Choose Add Something, select an asset, then drag, resize, rotate, layer, duplicate, or lock it.",
      },
      {
        title: "3. Make it react",
        detail:
          "Select an object and use Options to add click responses, hover behavior, dialogue, sounds, flags, item rewards, scene changes, animations, or other consequences.",
      },
      {
        title: "4. Connect and test",
        detail:
          "Use Connect for maps and travel routes. Press Play to test the current game state as a player; press Stop Test to return to the same editing workspace.",
      },
      {
        title: "5. Back up and publish",
        detail:
          "Use Backup / Restore for project files and local checkpoint slots. Publish exports the current game as a playable standalone HTML file.",
      },
    ],
  },
  {
    id: "assets",
    title: "Assets & Media",
    eyebrow: "Your searchable box of ingredients",
    icon: FolderOpen,
    intro:
      "The asset library stores the reusable media used by scenes, interfaces, sounds, cutscenes, cursors, inventory, and other systems.",
    items: [
      {
        title: "Browse without loading everything",
        detail:
          "The asset popup supports All, Recent, Favorites, In Canvas, search, and folder browsing. Repository folders are loaded only when opened to keep large collections responsive.",
      },
      {
        title: "Edit metadata",
        detail:
          "Use the information button on an asset to rename it, describe it, add comma-separated tags, favorite it, or set audio/video trim and volume metadata.",
      },
      {
        title: "Crop and remove backgrounds",
        detail:
          "Choose Edit on any image card to crop, adjust brightness, contrast, saturation, hue, sepia, grayscale, invert, or blur, and remove a chosen background color with tolerance control.",
        tip: "Save as New Asset preserves the original. Overwrite updates objects already linked to that asset.",
      },
      {
        title: "Animated and audiovisual files",
        detail:
          "GIFs remain animated when used normally. Audio can become background music or object sound responses. Video can be placed in scenes or used for cutscenes.",
      },
      {
        title: "Finder drag and drop",
        detail:
          "Drag image, GIF, audio, or video files from Finder onto the stage. Cavebot imports the file, adds it to the project library, and places supported visual media into the scene.",
      },
    ],
  },
  {
    id: "compose",
    title: "Scenes & Canvas",
    eyebrow: "Dress the world like a haunted dollhouse",
    icon: Image,
    intro:
      "Scene Studio is the visual construction area. Rooms hold objects; Menus & HUD holds player-facing interface pieces.",
    items: [
      {
        title: "Place and select objects",
        detail:
          "Add assets, clickable areas, and text from the canvas controls. Click an object to inspect it. Shift-select or drag a selection box to work with multiple objects.",
      },
      {
        title: "Transform and arrange",
        detail:
          "Move, resize, rotate, flip, stretch, change opacity, alter layer order, lock, hide, duplicate, and delete objects. Image corner handles preserve proportions automatically; hold Alt only when you intentionally want to stretch freely.",
      },
      {
        title: "Resize the room without math",
        detail:
          "Choose Resize Room before changing the game boundary. Three amber handles then appear on the right, bottom, and corner, clearly separated from object handles. Choose Done Resizing Room when finished.",
        tip: "The live badge reports dimensions while you drag. Hold Shift at the corner to preserve the room’s proportions. Viewport Scale and Fit change only your editing view, not exported dimensions.",
      },
      {
        title: "Visual styling",
        detail:
          "Objects support filters, blend modes, parallax, animation presets, custom CSS classes, fit behavior, and responsive pin/stretch settings.",
      },
      {
        title: "Device and CRT frames",
        detail:
          "Calibrate irregular screen frames by identifying their inner playable window. The scene scales into that window while frame art and external hitboxes remain aligned.",
      },
      {
        title: "Reusable stamps",
        detail:
          "Use Stamps to save or place reusable prefabs instead of rebuilding recurring props, characters, controls, and interaction recipes.",
      },
    ],
  },
  {
    id: "behaviors",
    title: "Clicks & Behaviors",
    eyebrow: "Teach every little freak what to do",
    icon: MousePointerClick,
    intro:
      "Objects can perform multiple responses from one click. Behaviors may alter presentation, game state, inventory, dialogue, travel, sound, or progression.",
    items: [
      {
        title: "Multiple click responses",
        detail:
          "Choose the first response, then use Add response to build an ordered stack. One click can show dialogue, set a remembered fact, give an item, start a quest, travel, play media, and open an interface in sequence.",
      },
      {
        title: "When → If → Then rules",
        detail:
          "When the object is clicked, Cavebot checks the conditions attached to each response, then runs only the responses that qualify. The first response and every additional response can have their own rules.",
        tip: "Open Clicks, Cursors & Reactions. Under a response, choose Add condition. Conditions can check story flags, inventory, active or completed quests, skill levels, needs, relationships, and time.",
      },
      {
        title: "All conditions or any condition",
        detail:
          "Choose all conditions when every requirement must be true. Choose any condition when one matching requirement is enough. Responses with no conditions always run.",
      },
      {
        title: "Remember after running once",
        detail:
          "Enable the one-time option when a response should never repeat after it succeeds. Fired responses are included in player saves, so loading the game does not accidentally repeat them.",
      },
      {
        title: "Hover and cursor feedback",
        detail:
          "Assign hover text, flavor text, visual reactions, and custom cursor assets. Openable objects, NPCs, resize handles, and other targets can communicate their purpose before clicking.",
      },
      {
        title: "Dialogue",
        detail:
          "Conversations support portraits, typewriter text, branching choices, conditions, consequences, scene changes, flags, and game-state effects.",
      },
      {
        title: "Sound and music",
        detail:
          "Scenes can have background music. Objects can play sounds as responses. Asset metadata provides trim points and volume control without renaming source files.",
      },
      {
        title: "Advanced behavior",
        detail:
          "Optional controls include scripts, physics, enter triggers, animations, custom CSS, and RPG consequences. They can remain collapsed until needed.",
      },
    ],
  },
  {
    id: "systems",
    title: "Items & World Rules",
    eyebrow: "The RPG machinery under the glitter",
    icon: Shield,
    intro:
      "The Behaviors phase contains the systems that let a decorative scene become a persistent social RPG.",
    items: [
      {
        title: "Inventory and items",
        detail:
          "Create collectible, usable, consumable, ingredient, and quest items. Objects can give, require, remove, or react to selected inventory items.",
      },
      {
        title: "Crafting and combinations",
        detail:
          "Define recipes and item combinations, including crafting stations and resulting items.",
      },
      {
        title: "Quests and objectives",
        detail:
          "Create quests with descriptions, objectives, rewards, required flags, collected items, and reached locations. Runtime quest logs track progress.",
      },
      {
        title: "Flags, skills, needs, and reputation",
        detail:
          "Use flags as remembered facts. Skills, needs, stats, faction reputation, and relationship values can gate or change interactions.",
      },
      {
        title: "Lore, factions, and companions",
        detail:
          "Store world lore, define social groups, and configure companions with requirements and contextual interjections.",
      },
      {
        title: "Time and survival flavor",
        detail:
          "Optional day/night presentation and survival-style needs can change the runtime without forcing every project to use them.",
      },
    ],
  },
  {
    id: "connect",
    title: "Maps & Progression",
    eyebrow: "Turn rooms into a navigable world",
    icon: Map,
    intro:
      "Connect is where locations become a world rather than a pile of isolated scenes.",
    items: [
      {
        title: "Create maps",
        detail:
          "Make separate maps, choose a background, and place location nodes spatially on the map board.",
      },
      {
        title: "Link locations",
        detail:
          "Associate nodes with scenes and define the passages available to the player.",
      },
      {
        title: "Gate travel",
        detail:
          "Locations can be hidden or locked until a required flag or progression condition is met.",
      },
      {
        title: "Fast travel",
        detail:
          "Maps can appear during play as fast-travel interfaces that send the player to unlocked scenes.",
      },
    ],
  },
  {
    id: "play",
    title: "Playtesting",
    eyebrow: "Possess the toy and click everything",
    icon: Play,
    intro:
      "Play mode hides authoring chrome and runs the current project using temporary runtime state.",
    items: [
      {
        title: "Start and stop safely",
        detail:
          "Play can be launched from any workflow phase. Stop Test returns you to the workspace you were using before the test.",
      },
      {
        title: "Runtime state",
        detail:
          "Testing exercises flags, inventory, dialogue, quests, crafting, scene changes, music, sound effects, cursors, HUD menus, maps, cutscenes, and object visibility.",
      },
      {
        title: "Test alternate states",
        detail:
          "Simulation and override controls let you inspect content that depends on flags or other state without replaying the whole game.",
      },
      {
        title: "Saving",
        detail:
          "Exported games use browser storage for game saves. Project checkpoint slots in the editor are separate from player save data.",
      },
    ],
  },
  {
    id: "publish",
    title: "Backup & Publish",
    eyebrow: "Get the cursed artifact out of the machine",
    icon: Download,
    intro:
      "Project backups preserve editable source data. Publishing creates the player-facing game.",
    items: [
      {
        title: "Automatic local project save",
        detail:
          "The editor autosaves project data locally. The Saved indicator confirms the latest write.",
      },
      {
        title: "Checkpoint slots",
        detail:
          "Backup / Restore includes five local database slots for intentional milestones and experiments.",
      },
      {
        title: "Portable project backup",
        detail:
          "Download a project file before risky changes or moving computers. Upload it later to restore editable project data.",
      },
      {
        title: "Playable HTML",
        detail:
          "Publish currently produces one standalone Neocities-friendly HTML file containing the game runtime and project data.",
      },
      {
        title: "Current limitation",
        detail:
          "A modular multi-file game-directory exporter and direct Neocities deployment are planned, but are not implemented yet.",
      },
    ],
  },
  {
    id: "shortcuts",
    title: "Controls & Shortcuts",
    eyebrow: "Tiny efficiencies for obsessive arranging",
    icon: Keyboard,
    intro:
      "Most work is pointer-friendly, but a few common desktop conventions make editing faster.",
    items: [
      {
        title: "Undo and redo",
        detail: "Use Ctrl/Cmd + Z to undo and Ctrl/Cmd + Y to redo.",
      },
      {
        title: "Multi-select",
        detail:
          "Hold Shift while selecting objects, or drag a selection box across empty canvas space.",
      },
      {
        title: "Context menu",
        detail:
          "Right-click the canvas or an object for contextual editing actions.",
      },
      {
        title: "Proportional scene resize",
        detail:
          "Hold Shift while dragging the scene’s corner resize handle to preserve proportions.",
      },
      {
        title: "Close overlays",
        detail:
          "Escape closes the asset picker and the Help Center. Modal Cancel or X controls leave changes untouched.",
      },
    ],
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("quick-start");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return helpSections;
    return helpSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          [section.title, section.eyebrow, section.intro, item.title, item.detail, item.tip]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedQuery)),
        ),
      }))
      .filter(
        (section) =>
          section.items.length > 0 ||
          [section.title, section.eyebrow, section.intro].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
      );
  }, [query]);

  const activeSection =
    filteredSections.find((section) => section.id === activeSectionId) ||
    filteredSections[0];

  return (
    <div
      className="fixed inset-0 z-[20000] flex bg-[#030208]/95 p-3 backdrop-blur-md md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Cavebot Help Center"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-[10px_30px_10px_30px] border-2 border-[#ff4fc8]/65 bg-[#090713] shadow-[0_0_80px_rgba(255,79,200,0.2)]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[#00ffcc]/20 bg-black/35 md:flex">
          <div className="border-b border-[#00ffcc]/15 p-5">
            <div className="font-vt323 text-3xl tracking-wide text-[#00ffcc]">
              CAVEBOT FIELD GUIDE
            </div>
            <p className="mt-1 font-comic text-xs text-[#ff8bd8]">
              a manual for the magical 2001 game-making toy
            </p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3 custom-scrollbar">
            {helpSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveSectionId(section.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[4px_12px_4px_12px] px-3 py-2.5 text-left font-comic text-sm transition-colors ${
                    activeSectionId === section.id && !query
                      ? "border border-[#00ffcc]/45 bg-[#00ffcc]/10 text-[#00ffcc]"
                      : "border border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {section.title}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[#00ffcc]/15 p-4 font-mono text-[10px] leading-relaxed text-neutral-500">
            Core editing is local-first. Paid AI is optional, not required for
            ordinary building, testing, or export.
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-[#ff4fc8]/20 bg-black/30 p-4">
            <BookOpen size={21} className="shrink-0 text-[#ff8bd8]" />
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search features, controls, assets, quests, export…"
                className="w-full rounded-lg border border-neutral-700 bg-black/45 py-2 pl-9 pr-3 font-comic text-sm text-white outline-none focus:border-[#00ffcc]"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Help Center"
              className="rounded-lg border border-neutral-700 p-2 text-neutral-400 hover:border-[#ff4fc8] hover:text-[#ff8bd8]"
            >
              <X size={19} />
            </button>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-white/5 p-3 md:hidden custom-scrollbar">
            {helpSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveSectionId(section.id);
                }}
                className="whitespace-nowrap rounded-full border border-neutral-700 px-3 py-1.5 font-comic text-xs text-neutral-300"
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar md:p-8">
            {!activeSection ? (
              <div className="mx-auto max-w-lg py-20 text-center">
                <Wand2 size={34} className="mx-auto mb-4 text-[#ff4fc8]" />
                <h2 className="font-vt323 text-3xl text-white">
                  NO SPELL FOUND
                </h2>
                <p className="mt-2 font-comic text-sm text-neutral-400">
                  Try a broader word like “sound,” “items,” “canvas,” or
                  “publish.”
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl">
                <div className="mb-7">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00ffcc]">
                    {query ? `Search results for “${query}”` : activeSection.eyebrow}
                  </div>
                  <h2 className="mt-2 font-vt323 text-4xl text-white md:text-5xl">
                    {activeSection.title}
                  </h2>
                  <p className="mt-3 max-w-3xl font-comic text-sm leading-6 text-neutral-300">
                    {activeSection.intro}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {activeSection.items.map((item) => (
                    <article
                      key={`${activeSection.id}-${item.title}`}
                      className="rounded-[6px_18px_6px_18px] border border-[#ff4fc8]/20 bg-white/[0.035] p-5 shadow-[inset_0_0_25px_rgba(0,255,204,0.025)]"
                    >
                      <h3 className="font-comic text-base font-bold text-[#ff8bd8]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-300">
                        {item.detail}
                      </p>
                      {item.tip && (
                        <div className="mt-4 border-l-2 border-[#00ffcc] bg-[#00ffcc]/5 px-3 py-2 font-comic text-xs leading-5 text-[#9affe8]">
                          ✦ {item.tip}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                {query && filteredSections.length > 1 && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                      More matching chapters
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredSections
                        .filter((section) => section.id !== activeSection.id)
                        .map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSectionId(section.id)}
                            className="rounded-full border border-[#00ffcc]/25 bg-[#00ffcc]/5 px-3 py-1.5 font-comic text-xs text-[#00ffcc] hover:bg-[#00ffcc]/10"
                          >
                            {section.title} ({section.items.length})
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 bg-black/25 px-5 py-3 font-mono text-[10px] text-neutral-500">
            <span className="flex items-center gap-2">
              <Gamepad2 size={13} className="text-[#00ffcc]" />
              Build first. Reveal complexity only when needed.
            </span>
            <span className="flex items-center gap-2">
              <Boxes size={13} className="text-[#ff8bd8]" />
              {helpSections.length} chapters ·{" "}
              {helpSections.reduce((total, section) => total + section.items.length, 0)} topics
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};
