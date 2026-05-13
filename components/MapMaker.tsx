import React, { useState } from "react";
import { Plus, Trash2, MapPin, Image as ImageIcon, CheckCircle2, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Project, FastTravelMap, MapNode } from "../types";

interface MapMakerProps {
  project: Project;
  updateProject: (updates: Partial<Project>) => void;
}

export function MapMaker({ project, updateProject }: MapMakerProps) {
  const [activeMapId, setActiveMapId] = useState<string | null>(project.maps?.[0]?.id || null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const maps = project.maps || [];
  const activeMap = maps.find((m) => m.id === activeMapId);

  const addMap = () => {
    const newMap: FastTravelMap = {
      id: "map-" + uuidv4().slice(0, 8),
      name: "New Map",
      backgroundSrc: null,
      nodes: [],
    };
    updateProject({ maps: [...maps, newMap] });
    setActiveMapId(newMap.id);
  };

  const updateActiveMap = (updates: Partial<FastTravelMap>) => {
    if (!activeMapId) return;
    updateProject({
      maps: maps.map((m) => (m.id === activeMapId ? { ...m, ...updates } : m)),
    });
  };

  const deleteMap = (id: string) => {
    const newMaps = maps.filter((m) => m.id !== id);
    updateProject({ maps: newMaps });
    if (activeMapId === id) {
      setActiveMapId(newMaps[0]?.id || null);
    }
  };

  const addNode = (x: number, y: number) => {
    if (!activeMap) return;
    const newNode: MapNode = {
      id: "node-" + uuidv4().slice(0, 8),
      name: "New Location",
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
      nodes: activeMap.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });
  };

  const deleteNode = (id: string) => {
    if (!activeMap) return;
    updateActiveMap({
      nodes: activeMap.nodes.filter((n) => n.id !== id),
    });
    if (editingNodeId === id) setEditingNodeId(null);
  };

  const editingNode = activeMap?.nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950 text-xs">
      {/* Maps Sidebar */}
      <div className="w-64 border-r border-neutral-800 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <h2 className="font-semibold text-neutral-200">Maps</h2>
          <button
            onClick={addMap}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {maps.map((map) => (
            <div
              key={map.id}
              onClick={() => {
                setActiveMapId(map.id);
                setEditingNodeId(null);
              }}
              className={`flex items-center justify-between p-2 rounded cursor-pointer group transition-colors ${activeMapId === map.id ? "bg-blue-600 text-white" : "hover:bg-neutral-800 text-neutral-300"}`}
            >
              <span className="truncate">{map.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMap(map.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {maps.length === 0 && (
            <div className="text-neutral-500 p-4 text-center">
              No maps created yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Map Editor area */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-900">
        {activeMap ? (
          <>
             {/* Map Header */}
             <div className="p-3 border-b border-neutral-800 flex gap-4 items-center bg-neutral-950">
                <input
                  type="text"
                  value={activeMap.name}
                  onChange={(e) => updateActiveMap({ name: e.target.value })}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white flex-1"
                />
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Background:</span>
                  <select
                    value={activeMap.backgroundSrc || ""}
                    onChange={(e) => updateActiveMap({ backgroundSrc: e.target.value || null })}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 flex-1 min-w-[200px]"
                  >
                    <option value="">-- No Background / Transparent --</option>
                    {project.assets.filter(a => a.type === "image").map(a => (
                      <option key={a.id} value={a.src}>{a.name}</option>
                    ))}
                  </select>
                </div>
             </div>

             {/* Map Canvas */}
             <div className="flex-1 flex overflow-hidden relative">
               <div className="flex-1 overflow-auto bg-neutral-800 relative select-none">
                 <div
                   className="relative"
                   style={{
                     width: "1200px",
                     height: "800px",
                     backgroundImage: activeMap.backgroundSrc ? `url(${activeMap.backgroundSrc})` : 'none',
                     backgroundSize: 'contain',
                     backgroundPosition: 'center',
                     backgroundRepeat: 'no-repeat',
                   }}
                   onClick={(e) => {
                     if (e.target !== e.currentTarget) return; // Only clicks on the map background
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = ((e.clientX - rect.left) / rect.width) * 100;
                     const y = ((e.clientY - rect.top) / rect.height) * 100;
                     addNode(x, y);
                   }}
                 >
                    {!activeMap.backgroundSrc && (
                       <div className="absolute inset-0 flex items-center justify-center text-neutral-600 pointer-events-none">
                          <p>Click anywhere to place a node</p>
                       </div>
                    )}

                    {/* Nodes */}
                    {activeMap.nodes.map(node => (
                      <div
                        key={node.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNodeId(node.id);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group
                          ${editingNodeId === node.id ? 'z-10' : 'z-0 hover:z-10'}
                        `}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      >
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform
                            ${editingNodeId === node.id ? 'ring-2 ring-blue-500 scale-110 bg-blue-600/90 text-white' : 'bg-neutral-900/90 text-neutral-400 group-hover:scale-110 group-hover:bg-neutral-700/90'}
                         `}>
                             {node.iconSrc ? (
                                <img src={node.iconSrc} alt={node.name} className="w-8 h-8 object-contain drop-shadow" />
                             ) : (
                                <MapPin className="w-6 h-6" />
                             )}
                         </div>
                         <div className={`mt-1 px-2 py-0.5 rounded shadow-lg text-[10px] font-bold whitespace-nowrap
                           ${editingNodeId === node.id ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-300'}
                         `}>
                           {node.name}
                         </div>
                      </div>
                    ))}
                 </div>
               </div>

               {/* Node Editor Sidebar */}
               {editingNode && (
                 <div className="w-72 bg-neutral-950 border-l border-neutral-800 p-4 overflow-y-auto flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-neutral-200">Edit Location</h3>
                      <button onClick={() => setEditingNodeId(null)} className="text-neutral-500 hover:text-white p-1">
                        <ChevronDown className="rotate-90" size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400">Name</label>
                      <input
                        type="text"
                        value={editingNode.name}
                        onChange={(e) => updateNode(editingNode.id, { name: e.target.value })}
                        className="bg-neutral-900 border border-neutral-700 rounded p-1.5"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400">Target Scene</label>
                      <select
                        value={editingNode.targetSceneId || ""}
                        onChange={(e) => updateNode(editingNode.id, { targetSceneId: e.target.value || null })}
                        className="bg-neutral-900 border border-neutral-700 rounded p-1.5"
                      >
                         <option value="">-- Select Scene --</option>
                         {project.scenes.map(s => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                         ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400">Icon Asset</label>
                      <select
                        value={editingNode.iconSrc || ""}
                        onChange={(e) => updateNode(editingNode.id, { iconSrc: e.target.value || null })}
                        className="bg-neutral-900 border border-neutral-700 rounded p-1.5"
                      >
                         <option value="">-- Default Map Pin --</option>
                         {project.assets.filter(a => a.type === "image").map(a => (
                           <option key={a.id} value={a.src}>{a.name}</option>
                         ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                       <input
                          type="checkbox"
                          checked={editingNode.unlockedByDefault}
                          onChange={(e) => updateNode(editingNode.id, { unlockedByDefault: e.target.checked })}
                          id="unlockedByDefault"
                          className="rounded bg-neutral-900 border-neutral-700"
                       />
                       <label htmlFor="unlockedByDefault" className="text-neutral-300">Unlocked By Default</label>
                    </div>

                    {!editingNode.unlockedByDefault && (
                       <div className="flex flex-col gap-1 mt-1 border-l-2 border-neutral-800 pl-3">
                          <label className="text-neutral-400">Required Flag to Travel</label>
                           <select
                              value={editingNode.requiredFlagId || ""}
                              onChange={(e) => updateNode(editingNode.id, { requiredFlagId: e.target.value || undefined })}
                              className="bg-neutral-900 border border-neutral-700 rounded p-1.5"
                            >
                              <option value="">-- No Flag Required --</option>
                              {project.gameFlags.map((flag) => (
                                <option key={flag} value={flag}>
                                  {flag}
                                </option>
                              ))}
                            </select>
                       </div>
                    )}

                    <div className="flex justify-between mt-8 pt-4 border-t border-neutral-800">
                      <button
                        onClick={() => deleteNode(editingNode.id)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded"
                      >
                        <Trash2 size={12} />
                        Delete Node
                      </button>
                    </div>
                 </div>
               )}
             </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8">
            <MapPin size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-neutral-300 mb-2">No Map Selected</h3>
            <p className="max-w-md text-center mb-6">Create a new map from the sidebar to set up fast travel locations for your game.</p>
            <button
               onClick={addMap}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
            >
               <Plus size={16} /> Create Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
