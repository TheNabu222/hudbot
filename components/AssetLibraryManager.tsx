import React, { useState, useRef } from "react";
import { Plus, Trash2, Edit2, Play, Music, Video, Image as ImageIcon, Search, Star, CheckSquare } from "lucide-react";
import { Project, Asset } from "../types";
import { v4 as uuidv4 } from "uuid";

interface AssetLibraryManagerProps {
  project: Project;
  updateProject: (updates: Partial<Project>) => void;
}

export const AssetLibraryManager: React.FC<AssetLibraryManagerProps> = ({
  project,
  updateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    message: string;
    onSubmit: (value: string) => void;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAssets: Asset[] = [];
    const readPromises = Array.from(files).map(
      (file) =>
        new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              const fileType = file.type;
              let type: "image" | "audio" | "video" | "script" | "text" | "hitbox" | "ui_element" | "prefab" = "image";
              if (fileType.startsWith("audio/")) type = "audio";
              else if (fileType.startsWith("video/")) type = "video";

              newAssets.push({
                id: uuidv4(),
                type,
                name: file.name.replace(/\.[^/.]+$/, ""),
                src: result,
                category: activeCategory === "all" ? "root" : activeCategory,
              });
            }
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readPromises).then(() => {
      updateProject({ assets: [...project.assets, ...newAssets] });
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    });
  };

  const categories = Array.from(
    new Set(project.assets.map((a) => a.category).filter((c) => c && c !== "root"))
  );

  const filteredAssets = project.assets.filter((a) => {
    if (activeCategory === "favorites" && !a.isFavorite) return false;
    if (activeCategory !== "all" && activeCategory !== "favorites" && a.category !== activeCategory) return false;
    if (searchTerm) {
       if (a.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
       if (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase())) return true;
       if (a.tags && a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return true;
       return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full overflow-hidden">
      <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex gap-4 items-center justify-between">
        <h2 className="text-xl font-bold flex flex-col gap-1 text-white">
          <span>File Library</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            Upload, tag, and edit files here. Return to <strong>Compose</strong> and use <strong>Add Something</strong> to place them in your game.
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Add File
          </button>
          <input
            type="file"
            multiple
            accept="image/*,audio/*,video/*"
            ref={uploadInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Categories */}
        <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col">
          <div className="p-4 border-b border-neutral-800">
            <div className="relative">
              <Search className="absolute left-2 top-2 text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 rounded pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                activeCategory === "all" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:bg-neutral-800 focus:outline-none"
              }`}
            >
              All Assets ({project.assets.length})
            </button>
            <button
              onClick={() => setActiveCategory("favorites")}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium flex items-center justify-between ${
                activeCategory === "favorites" ? "bg-yellow-600/50 text-yellow-100" : "text-neutral-400 hover:bg-neutral-800 focus:outline-none"
              }`}
            >
              <div className="flex items-center gap-2">
                <Star size={14} className={activeCategory === "favorites" ? "text-yellow-300" : "text-neutral-500"} />
                Favorites
              </div>
              <span className="text-xs opacity-70">
                {project.assets.filter((a) => a.isFavorite).length}
              </span>
            </button>
            <div className="h-px bg-neutral-800 my-2 mx-2"></div>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                  activeCategory === c ? "bg-emerald-600 text-white" : "text-neutral-400 hover:bg-neutral-800 focus:outline-none"
                }`}
              >
                {c} ({project.assets.filter((a) => a.category === c).length})
              </button>
            ))}
            
            <button
               onClick={() => {
                 setPromptDialog({
                   isOpen: true,
                   message: "Enter new category name:",
                   onSubmit: (newCat) => {
                     if (newCat) setActiveCategory(newCat);
                   }
                 });
               }}
               className="w-full text-left px-3 py-2 text-sm text-neutral-500 hover:text-emerald-400"
            >
               + New Category
            </button>
          </div>
        </div>

        {/* Main Asset Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-neutral-900/50 relative">
          {selectedAssetIds.size > 0 && (
            <div className="sticky top-0 z-30 mb-6 bg-indigo-900/80 backdrop-blur-md border border-indigo-500/50 rounded-lg p-3 flex items-center justify-between shadow-xl">
               <div className="flex items-center gap-4">
                  <div className="bg-indigo-950 text-indigo-300 font-bold px-3 py-1 rounded text-sm">
                     {selectedAssetIds.size} Selected
                  </div>
                  
                  <div className="h-6 w-px bg-indigo-500/30"></div>
                  
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-indigo-200">Set Category:</span>
                      <select 
                         className="bg-indigo-950 border border-indigo-500/50 text-sm text-indigo-100 rounded px-2 py-1 outline-none"
                         onChange={(e) => {
                            if (!e.target.value) return;
                            const val = e.target.value;
                            updateProject({
                              assets: project.assets.map(a => selectedAssetIds.has(a.id) ? { ...a, category: val } : a)
                            });
                            e.target.value = "";
                         }}
                      >
                        <option value="">-- Categories --</option>
                        <option value="root">Root Form</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  
                  <div className="h-6 w-px bg-indigo-500/30"></div>
                  
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-indigo-200">Bulk Tags:</span>
                      <input 
                        id="bulk-tag-input"
                        type="text" 
                        placeholder="tag1, tag2..." 
                        className="bg-indigo-950 border border-indigo-500/50 text-sm text-indigo-100 rounded px-2 py-1 outline-none w-40" 
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              const newTags = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean);
                              if (newTags.length > 0) {
                                 updateProject({
                                    assets: project.assets.map(a => {
                                       if (selectedAssetIds.has(a.id)) {
                                          const currentTags = a.tags || [];
                                          const merged = Array.from(new Set([...currentTags, ...newTags]));
                                          return { ...a, tags: merged };
                                       }
                                       return a;
                                    })
                                 });
                                 e.currentTarget.value = "";
                              }
                           }
                        }}
                      />
                      <span className="text-xs text-indigo-400">press Enter</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedAssetIds(new Set())}
                    className="px-3 py-1.5 hover:bg-white/10 text-indigo-200 text-sm rounded transition-colors"
                  >
                     Clear Selection
                  </button>
                  <button 
                    onClick={() => {
                       setConfirmDialog({
                          isOpen: true,
                          message: `Delete ${selectedAssetIds.size} assets?`,
                          onConfirm: () => {
                             updateProject({
                                assets: project.assets.filter(a => !selectedAssetIds.has(a.id))
                             });
                             setSelectedAssetIds(new Set());
                          }
                       });
                    }}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-sm rounded transition-colors flex items-center gap-2"
                  >
                     <Trash2 size={14} /> Bulk Delete
                  </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`group relative bg-neutral-900 border rounded-xl overflow-hidden flex flex-col shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl ${
                  selectedAssetIds.has(asset.id) ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "border-neutral-800/80 hover:border-indigo-500/50"
                }`}
              >
                <div 
                   className="aspect-square flex items-center justify-center p-4 relative bg-black/40 cursor-pointer"
                   onClick={() => {
                      const newSet = new Set(selectedAssetIds);
                      if (newSet.has(asset.id)) newSet.delete(asset.id);
                      else newSet.add(asset.id);
                      setSelectedAssetIds(newSet);
                   }}
                >
                  <button 
                    className={`absolute top-2 left-2 p-1 rounded-md backdrop-blur-md z-20 transition-all ${
                       selectedAssetIds.has(asset.id) ? 'bg-indigo-500 text-white opacity-100' : 'bg-black/40 text-neutral-400 opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(e) => {
                       e.stopPropagation();
                       const newSet = new Set(selectedAssetIds);
                       if (newSet.has(asset.id)) newSet.delete(asset.id);
                       else newSet.add(asset.id);
                       setSelectedAssetIds(newSet);
                    }}
                  >
                     <CheckSquare size={16} />
                  </button>
                  {asset.type === "image" ? (
                    <img src={asset.src} className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md" />
                  ) : asset.type === "audio" ? (
                    <div className="flex flex-col items-center justify-center pointer-events-none text-indigo-400 w-full h-full relative">
                      <Music size={40} className="mb-2 opacity-80" />
                    </div>
                  ) : asset.type === "video" ? (
                    <video src={asset.src} controls className="max-w-full max-h-full object-contain drop-shadow-md" />
                  ) : (
                    <div className="text-neutral-500 tracking-widest font-black text-xl opacity-50">
                       {asset.type.toUpperCase()}
                    </div>
                  )}

                  {asset.type === "audio" && (
                    <button 
                       className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200 z-10"
                       onClick={() => {
                         const mediaFragment = asset.trimStart || asset.trimEnd ? `#t=${asset.trimStart || 0}${asset.trimEnd ? ',' + asset.trimEnd : ''}` : '';
                         const audio = new Audio(asset.src + mediaFragment);
                         audio.volume = Math.min(1, asset.volume ?? 1);
                         audio.play();
                       }}
                    >
                       <Play size={24} className="text-white ml-1 pl-0.5" />
                    </button>
                  )}
                  
                  <button 
                    className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-md z-20 
                                ${asset.isFavorite ? 'bg-yellow-500/80 text-yellow-100 opacity-100' : 'bg-black/40 text-neutral-400 opacity-0 group-hover:opacity-100'} 
                                transition-all cursor-pointer`}
                    onClick={(e) => {
                       e.stopPropagation();
                       updateProject({
                         assets: project.assets.map(a => a.id === asset.id ? { ...a, isFavorite: !a.isFavorite } : a)
                       });
                    }}
                  >
                     <Star size={16} className={asset.isFavorite ? "fill-yellow-100" : ""} />
                  </button>
                </div>
                <div className="bg-neutral-900 p-3 flex flex-col flex-1 border-t border-neutral-800 space-y-2">
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => {
                      updateProject({
                        assets: project.assets.map((a) => (a.id === asset.id ? { ...a, name: e.target.value } : a)),
                      });
                    }}
                    className="bg-neutral-950/50 border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm text-white font-semibold outline-none w-full transition-colors"
                    placeholder="Asset Name"
                  />
                  <textarea 
                     value={asset.description || ""}
                     onChange={(e) => {
                       updateProject({
                         assets: project.assets.map(a => a.id === asset.id ? { ...a, description: e.target.value } : a)
                       });
                     }}
                     className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 outline-none focus:border-indigo-500 flex-1 min-h-[3rem] resize-none"
                     placeholder="Notes/Description..."
                  />
                  <input 
                     value={(asset.tags || []).join(', ')}
                     onChange={(e) => {
                        const newTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        updateProject({
                          assets: project.assets.map(a => a.id === asset.id ? { ...a, tags: newTags } : a)
                        });
                     }}
                     className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-indigo-400 font-mono outline-none focus:border-indigo-500 w-full"
                     placeholder="tags, separated, by, commas"
                  />
                  
                  {(asset.type === 'audio' || asset.type === 'video') && (
                     <div className="flex flex-col gap-1 pt-2 border-t border-neutral-800 pb-1">
                        <div className="text-[10px] uppercase font-bold text-neutral-500">Trim & Volume</div>
                        <div className="flex gap-2">
                           <input type="number" step="0.1" value={asset.trimStart || 0} onChange={e => updateProject({ assets: project.assets.map(a => a.id === asset.id ? { ...a, trimStart: Math.max(0, parseFloat(e.target.value) || 0) } : a)})} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-indigo-500" placeholder="Start (s)" />
                           <input type="number" step="0.1" value={asset.trimEnd || ''} onChange={e => updateProject({ assets: project.assets.map(a => a.id === asset.id ? { ...a, trimEnd: e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : undefined } : a)})} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-indigo-500" placeholder="End (s)" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500">Vol</span>
                          <input type="range" min="0" max="1" step="0.05" value={Math.min(1, asset.volume ?? 1)} onChange={e => updateProject({ assets: project.assets.map(a => a.id === asset.id ? { ...a, volume: parseFloat(e.target.value) } : a)})} className="flex-1 accent-indigo-500 h-1 bg-neutral-800 rounded-full appearance-none outline-none" />
                          <span className="text-[10px] text-neutral-400 w-8 text-right">{Math.round(Math.min(1, asset.volume ?? 1) * 100)}%</span>
                        </div>
                     </div>
                  )}

                  <div className="flex justify-between items-center pt-2 mt-auto">
                    <select
                      value={asset.category || "root"}
                      onChange={(e) => {
                        updateProject({
                          assets: project.assets.map((a) => (a.id === asset.id ? { ...a, category: e.target.value } : a)),
                        });
                      }}
                      className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 p-1 rounded outline-none flex-1 mr-2 focus:border-indigo-500"
                    >
                      <option value="root">Root Form</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {!categories.includes(activeCategory) && activeCategory !== "all" && activeCategory !== "favorites" && (
                         <option value={activeCategory}>{activeCategory}</option>
                      )}
                    </select>
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: `Delete ${asset.name}?`,
                          onConfirm: () => {
                            updateProject({
                              assets: project.assets.filter((a) => a.id !== asset.id),
                            });
                          }
                        });
                      }}
                      className="p-1.5 hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 rounded-md transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredAssets.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-neutral-500">
               <div className="w-24 h-24 border-2 border-dashed border-neutral-700 rounded-full flex items-center justify-center mb-6 bg-neutral-950/50">
                 <ImageIcon size={32} className="opacity-40" />
               </div>
               <h3 className="text-xl font-bold text-neutral-300 mb-2">No files found</h3>
               <p className="text-sm opacity-70 max-w-sm text-center mb-6">Your file library is looking a little empty. Upload images, audio, or video files to get started.</p>
               <button 
                 onClick={() => uploadInputRef.current?.click()}
                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all hover:-translate-y-0.5"
               >
                 <Plus size={18} /> Upload Files
               </button>
             </div>
          )}
        </div>
      </div>
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
      {promptDialog?.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-xl border border-neutral-700 w-80">
            <h3 className="text-lg font-medium text-white mb-4">
              {promptDialog.message}
            </h3>
            <input
              autoFocus
              type="text"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-white mb-4 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  promptDialog.onSubmit(e.currentTarget.value);
                  setPromptDialog(null);
                } else if (e.key === "Escape") {
                  setPromptDialog(null);
                }
              }}
              id="library-prompt-input"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPromptDialog(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById(
                    "library-prompt-input",
                  ) as HTMLInputElement;
                  if (el) {
                    promptDialog.onSubmit(el.value);
                  }
                  setPromptDialog(null);
                }}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
