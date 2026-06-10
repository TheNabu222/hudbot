import React, { useState } from "react";
import {
  ChevronLeft,
  Image as ImageIcon,
  Lock,
  MapPin,
  MousePointerClick,
  Plus,
  Route,
  Search,
  Sparkles,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { FastTravelMap, MapNode, Project } from "../types";

interface MapMakerProps {
  project: Project;
  updateProject: (updates: Partial<Project>) => void;
}

export function MapMaker({ project, updateProject }: MapMakerProps) {
  const [activeMapId, setActiveMapId] = useState<string | null>(
    project.maps?.[0]?.id || null,
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [assetPickerTarget, setAssetPickerTarget] = useState<
    "background" | "icon" | null
  >(null);
  const [assetSearch, setAssetSearch] = useState("");

  const maps = project.maps || [];
  const activeMap = maps.find((map) => map.id === activeMapId);
  const editingNode = activeMap?.nodes.find(
    (node) => node.id === editingNodeId,
  );
  const imageAssets = project.assets.filter((asset) => asset.type === "image");
  const visibleImageAssets = imageAssets.filter((asset) =>
    asset.name.toLowerCase().includes(assetSearch.toLowerCase()),
  );
  const backgroundAsset = imageAssets.find(
    (asset) => asset.src === activeMap?.backgroundSrc,
  );
  const iconAsset = imageAssets.find(
    (asset) => asset.src === editingNode?.iconSrc,
  );

  const addMap = () => {
    const newMap: FastTravelMap = {
      id: `map-${uuidv4().slice(0, 8)}`,
      name: `World Map ${maps.length + 1}`,
      backgroundSrc: null,
      nodes: [],
    };
    updateProject({ maps: [...maps, newMap] });
    setActiveMapId(newMap.id);
    setEditingNodeId(null);
  };

  const updateActiveMap = (updates: Partial<FastTravelMap>) => {
    if (!activeMapId) return;
    updateProject({
      maps: maps.map((map) =>
        map.id === activeMapId ? { ...map, ...updates } : map,
      ),
    });
  };

  const deleteMap = (id: string) => {
    const remainingMaps = maps.filter((map) => map.id !== id);
    updateProject({ maps: remainingMaps });
    if (activeMapId === id) {
      setActiveMapId(remainingMaps[0]?.id || null);
      setEditingNodeId(null);
    }
  };

  const addNode = (x: number, y: number) => {
    if (!activeMap) return;
    const newNode: MapNode = {
      id: `node-${uuidv4().slice(0, 8)}`,
      name: `Location ${activeMap.nodes.length + 1}`,
      x,
      y,
      targetSceneId: null,
      unlockedByDefault: true,
    };
    updateActiveMap({ nodes: [...activeMap.nodes, newNode] });
    setEditingNodeId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<MapNode>) => {
    if (!activeMap) return;
    updateActiveMap({
      nodes: activeMap.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node,
      ),
    });
  };

  const deleteNode = (id: string) => {
    if (!activeMap) return;
    updateActiveMap({
      nodes: activeMap.nodes.filter((node) => node.id !== id),
    });
    setEditingNodeId(null);
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#080711] text-xs text-neutral-200">
      <aside className="flex w-56 shrink-0 flex-col border-r border-cyan-400/15 bg-black/40">
        <div className="border-b border-cyan-400/15 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-comic text-sm font-bold text-white">
                World Maps
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-cyan-300/60">
                places & passages
              </p>
            </div>
            <button
              type="button"
              onClick={addMap}
              className="rounded border border-[#00ffcc]/40 bg-[#00ffcc]/10 p-1.5 text-[#00ffcc] hover:bg-[#00ffcc]/20"
              aria-label="Create map"
              title="Create map"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={addMap}
            className="flex w-full items-center justify-center gap-1.5 rounded-[4px_10px_4px_10px] border border-pink-500/40 bg-pink-500/10 px-3 py-2 font-comic text-[11px] font-bold text-pink-200 hover:bg-pink-500/20"
          >
            <Plus size={13} />
            New Map
          </button>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {maps.map((map) => {
            const isActive = activeMapId === map.id;
            return (
              <button
                type="button"
                key={map.id}
                onClick={() => {
                  setActiveMapId(map.id);
                  setEditingNodeId(null);
                }}
                className={`group flex w-full items-center gap-2 rounded border p-2 text-left transition ${
                  isActive
                    ? "border-[#00ffcc]/50 bg-[#00ffcc]/10 text-white shadow-[0_0_16px_rgba(0,255,204,0.08)]"
                    : "border-transparent text-neutral-400 hover:border-pink-500/25 hover:bg-pink-500/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${
                    isActive
                      ? "border-[#00ffcc]/30 bg-black/40 text-[#00ffcc]"
                      : "border-neutral-800 bg-neutral-950 text-pink-400"
                  }`}
                >
                  <Route size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{map.name}</span>
                  <span className="block text-[9px] text-neutral-500">
                    {map.nodes.length} location
                    {map.nodes.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteMap(map.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                      deleteMap(map.id);
                    }
                  }}
                  className="rounded p-1 text-neutral-600 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  aria-label={`Delete ${map.name}`}
                >
                  <Trash2 size={12} />
                </span>
              </button>
            );
          })}

          {maps.length === 0 && (
            <div className="px-3 py-8 text-center text-neutral-600">
              <Route className="mx-auto mb-2 opacity-40" size={24} />
              No maps yet.
            </div>
          )}
        </div>
      </aside>

      {activeMap ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center gap-4 border-b border-cyan-400/15 bg-[#0d0b1a]/95 px-4 py-2">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                Map name
              </label>
              <input
                type="text"
                value={activeMap.name}
                onChange={(event) =>
                  updateActiveMap({ name: event.target.value })
                }
                className="w-full max-w-sm rounded border border-neutral-700 bg-black/40 px-2.5 py-1.5 font-comic text-sm font-bold text-white outline-none focus:border-[#00ffcc]/70"
              />
            </div>

            <div className="min-w-64 max-w-md flex-1">
              <label className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                <ImageIcon size={10} />
                Map artwork
              </label>
              <button
                type="button"
                onClick={() => {
                  setAssetSearch("");
                  setAssetPickerTarget("background");
                }}
                className="flex w-full items-center justify-between gap-2 rounded border border-neutral-700 bg-black/40 px-2.5 py-1.5 text-left text-[11px] text-neutral-200 outline-none hover:border-pink-500/70"
              >
                <span className="truncate">
                  {backgroundAsset?.name || "No artwork — use planning grid"}
                </span>
                <ImageIcon size={12} className="shrink-0 text-pink-400" />
              </button>
            </div>

            <div className="hidden items-center gap-3 border-l border-neutral-800 pl-4 text-[10px] text-neutral-500 lg:flex">
              <span>
                <strong className="text-[#00ffcc]">
                  {activeMap.nodes.length}
                </strong>{" "}
                locations
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick size={11} className="text-pink-400" />
                Click map to add
              </span>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <main className="relative min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#17152a_0%,#0a0912_60%)] p-5">
              <div className="mx-auto flex min-h-full max-w-[1180px] items-center justify-center">
                <div className="w-full">
                  <div className="mb-2 flex items-end justify-between px-1">
                    <div>
                      <p className="font-comic text-xs font-bold text-white">
                        Map Board
                      </p>
                      <p className="text-[9px] text-neutral-500">
                        Place locations now; connect each one to a scene later.
                      </p>
                    </div>
                    <span className="rounded-full border border-neutral-800 bg-black/40 px-2 py-1 text-[9px] text-neutral-500">
                      Coordinates are handled for you ✦
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-[7px_18px_7px_18px] border border-[#00ffcc]/25 bg-black/30 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
                    <div
                      className={`relative aspect-[3/2] min-h-[420px] w-full cursor-crosshair overflow-hidden rounded border border-white/10 ${
                        activeMap.backgroundSrc
                          ? "bg-black"
                          : "bg-[#121328] bg-[radial-gradient(circle,rgba(0,255,204,0.16)_1px,transparent_1px)] [background-size:24px_24px]"
                      }`}
                      onClick={(event) => {
                        if (
                          event.target !== event.currentTarget &&
                          (event.target as HTMLElement).tagName !== "IMG"
                        ) {
                          return;
                        }
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        addNode(
                          ((event.clientX - rect.left) / rect.width) * 100,
                          ((event.clientY - rect.top) / rect.height) * 100,
                        );
                      }}
                    >
                      {activeMap.backgroundSrc && (
                        <img
                          src={activeMap.backgroundSrc}
                          alt={`${activeMap.name} background`}
                          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                        />
                      )}

                      {!activeMap.backgroundSrc &&
                        activeMap.nodes.length === 0 && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                            <div className="max-w-sm rounded-[6px_18px_6px_18px] border border-pink-500/30 bg-[#080711]/90 p-5 text-center shadow-2xl backdrop-blur">
                              <Sparkles
                                size={24}
                                className="mx-auto mb-2 text-pink-400"
                              />
                              <h3 className="font-comic text-base font-bold text-white">
                                Plot your little universe
                              </h3>
                              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                                Click anywhere to make the first location. No
                                coordinates, graph math, or cartography degree
                                required.
                              </p>
                              <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-wider text-[#00ffcc]">
                                <MousePointerClick size={12} />
                                Click to place
                              </div>
                            </div>
                          </div>
                        )}

                      {activeMap.nodes.map((node) => {
                        const isEditing = editingNodeId === node.id;
                        return (
                          <button
                            type="button"
                            key={node.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingNodeId(node.id);
                            }}
                            className={`group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
                              isEditing ? "z-20" : "z-10"
                            }`}
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                          >
                            <span
                              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-xl transition ${
                                isEditing
                                  ? "scale-110 border-[#00ffcc] bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_24px_rgba(0,255,204,0.28)]"
                                  : "border-pink-400/70 bg-[#120d1d]/95 text-pink-300 group-hover:scale-110 group-hover:border-pink-300"
                              }`}
                            >
                              {node.iconSrc ? (
                                <img
                                  src={node.iconSrc}
                                  alt=""
                                  className="h-8 w-8 object-contain drop-shadow"
                                />
                              ) : (
                                <MapPin size={23} />
                              )}
                            </span>
                            <span
                              className={`mt-1 max-w-36 truncate rounded border px-2 py-1 font-comic text-[10px] font-bold shadow-xl ${
                                isEditing
                                  ? "border-[#00ffcc]/60 bg-[#071411] text-white"
                                  : "border-pink-500/30 bg-[#080711]/95 text-pink-100"
                              }`}
                            >
                              {node.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <aside className="w-72 shrink-0 overflow-y-auto border-l border-cyan-400/15 bg-black/45">
              {editingNode ? (
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-comic text-sm font-bold text-white">
                        Edit Location
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-pink-300/70">
                        destination spell
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingNodeId(null)}
                      className="rounded border border-neutral-800 p-1.5 text-neutral-500 hover:text-white"
                      aria-label="Close location inspector"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-neutral-400">
                      Location name
                    </span>
                    <input
                      type="text"
                      value={editingNode.name}
                      onChange={(event) =>
                        updateNode(editingNode.id, {
                          name: event.target.value,
                        })
                      }
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-2 font-comic text-sm font-bold outline-none focus:border-[#00ffcc]/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-neutral-400">
                      Opens which scene?
                    </span>
                    <select
                      value={editingNode.targetSceneId || ""}
                      onChange={(event) =>
                        updateNode(editingNode.id, {
                          targetSceneId: event.target.value || null,
                        })
                      }
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-2 outline-none focus:border-[#00ffcc]/70"
                    >
                      <option value="">Choose a scene later</option>
                      {project.scenes.map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.name}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[9px] leading-relaxed text-neutral-600">
                      Clicking this location during play sends the player there.
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-neutral-400">
                      Location icon
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAssetSearch("");
                        setAssetPickerTarget("icon");
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-left outline-none hover:border-pink-500/70"
                    >
                      <span className="truncate">
                        {iconAsset?.name || "Default map pin"}
                      </span>
                      <MapPin size={13} className="shrink-0 text-pink-400" />
                    </button>
                  </label>

                  <div className="rounded border border-neutral-800 bg-neutral-950/70 p-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingNode.unlockedByDefault}
                        onChange={(event) =>
                          updateNode(editingNode.id, {
                            unlockedByDefault: event.target.checked,
                          })
                        }
                        className="rounded border-neutral-700 bg-neutral-900 text-[#00ffcc] focus:ring-[#00ffcc]"
                      />
                      {editingNode.unlockedByDefault ? (
                        <Unlock size={14} className="text-[#00ffcc]" />
                      ) : (
                        <Lock size={14} className="text-yellow-300" />
                      )}
                      <span className="font-bold">
                        Available from the start
                      </span>
                    </label>

                    {!editingNode.unlockedByDefault && (
                      <label className="mt-3 block border-t border-neutral-800 pt-3">
                        <span className="mb-1 block text-[10px] text-neutral-400">
                          Unlock after story flag
                        </span>
                        <select
                          value={editingNode.requiredFlagId || ""}
                          onChange={(event) =>
                            updateNode(editingNode.id, {
                              requiredFlagId:
                                event.target.value || undefined,
                            })
                          }
                          className="w-full rounded border border-neutral-700 bg-black px-2 py-1.5"
                        >
                          <option value="">No flag selected</option>
                          {project.gameFlags.map((flag) => (
                            <option key={flag} value={flag}>
                              {flag}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteNode(editingNode.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-bold text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 size={13} />
                    Delete Location
                  </button>
                </div>
              ) : (
                <div className="flex min-h-full flex-col justify-center p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#00ffcc]/25 bg-[#00ffcc]/5 text-[#00ffcc]">
                    <MapPin size={22} />
                  </div>
                  <p className="font-comic text-sm font-bold text-white">
                    Location Inspector
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                    Select a pin to name it, connect it to a scene, give it an
                    icon, or decide when the player unlocks it.
                  </p>
                  <div className="mt-4 rounded border border-pink-500/20 bg-pink-500/5 p-3 text-left text-[9px] leading-relaxed text-neutral-500">
                    <strong className="block text-pink-300">
                      Your easy workflow:
                    </strong>
                    1. Click the map.
                    <br />
                    2. Name the location.
                    <br />
                    3. Choose the scene it opens.
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      ) : (
        <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,#19152b_0%,#080711_65%)] p-8">
          <div className="max-w-md rounded-[8px_24px_8px_24px] border border-pink-500/25 bg-black/45 p-8 text-center shadow-2xl">
            <Route size={38} className="mx-auto mb-3 text-pink-400" />
            <h2 className="font-comic text-xl font-bold text-white">
              Make the world navigable
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
              A map is a visual menu of places. Drop pins, connect them to your
              scenes, and decide what the player can visit.
            </p>
            <button
              type="button"
              onClick={addMap}
              className="mt-5 inline-flex items-center gap-2 rounded-[4px_12px_4px_12px] border border-[#00ffcc]/50 bg-[#00ffcc]/10 px-4 py-2 font-comic font-bold text-[#00ffcc] hover:bg-[#00ffcc]/20"
            >
              <Plus size={15} />
              Create First Map
            </button>
          </div>
        </main>
      )}

      {assetPickerTarget && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          onMouseDown={() => setAssetPickerTarget(null)}
        >
          <div
            className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-[8px_24px_8px_24px] border border-[#00ffcc]/35 bg-[#090812] shadow-[0_24px_100px_rgba(0,0,0,0.7)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#00ffcc]/15 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-comic text-base font-bold text-white">
                  {assetPickerTarget === "background"
                    ? "Choose Map Artwork"
                    : "Choose Location Icon"}
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-pink-300/70">
                  search the image vault
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssetPickerTarget(null)}
                className="rounded border border-neutral-800 p-2 text-neutral-500 hover:text-white"
                aria-label="Close asset picker"
              >
                <X size={15} />
              </button>
            </div>

            <div className="border-b border-neutral-800 p-3">
              <label className="flex items-center gap-2 rounded border border-neutral-700 bg-black/50 px-3 py-2 focus-within:border-[#00ffcc]/60">
                <Search size={14} className="text-[#00ffcc]" />
                <input
                  autoFocus
                  type="search"
                  value={assetSearch}
                  onChange={(event) => setAssetSearch(event.target.value)}
                  placeholder="Search image assets…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                />
              </label>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4 md:grid-cols-5">
              <button
                type="button"
                onClick={() => {
                  if (assetPickerTarget === "background") {
                    updateActiveMap({ backgroundSrc: null });
                  } else if (editingNode) {
                    updateNode(editingNode.id, { iconSrc: null });
                  }
                  setAssetPickerTarget(null);
                }}
                className="flex aspect-square flex-col items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-950 p-2 text-center text-[10px] font-bold text-neutral-500 hover:border-pink-500/50 hover:text-white"
              >
                {assetPickerTarget === "background" ? (
                  <ImageIcon size={22} className="mb-2" />
                ) : (
                  <MapPin size={22} className="mb-2" />
                )}
                {assetPickerTarget === "background"
                  ? "Planning grid"
                  : "Default pin"}
              </button>

              {visibleImageAssets.map((asset) => (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => {
                    if (assetPickerTarget === "background") {
                      updateActiveMap({ backgroundSrc: asset.src });
                    } else if (editingNode) {
                      updateNode(editingNode.id, { iconSrc: asset.src });
                    }
                    setAssetPickerTarget(null);
                  }}
                  className="group overflow-hidden rounded border border-neutral-800 bg-neutral-950 text-left hover:border-[#00ffcc]/60"
                  title={asset.name}
                >
                  <div className="aspect-square bg-black/40 p-1">
                    <img
                      src={asset.src}
                      alt=""
                      className="h-full w-full object-contain transition group-hover:scale-105"
                    />
                  </div>
                  <p className="truncate border-t border-neutral-800 px-2 py-1.5 text-[9px] text-neutral-400 group-hover:text-white">
                    {asset.name}
                  </p>
                </button>
              ))}

              {visibleImageAssets.length === 0 && (
                <div className="col-span-full py-10 text-center text-neutral-600">
                  No matching images.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
