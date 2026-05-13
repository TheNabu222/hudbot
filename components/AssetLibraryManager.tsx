import React, { useState, useRef } from "react";
import { Plus, Trash2, Edit2, Play, Music, Video, Image as ImageIcon, Search } from "lucide-react";
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
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
    if (activeCategory !== "all" && a.category !== activeCategory) return false;
    if (searchTerm) return a.name.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full overflow-hidden">
      <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-neural-200">Asset Library</h2>
        <div className="flex gap-2">
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Add Asset
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
                 const newCat = prompt("Enter new category name:");
                 if (newCat) setActiveCategory(newCat);
               }}
               className="w-full text-left px-3 py-2 text-sm text-neutral-500 hover:text-emerald-400"
            >
               + New Category
            </button>
          </div>
        </div>

        {/* Main Asset Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex flex-col"
              >
                <div className="aspect-square flex items-center justify-center p-2 relative">
                  {asset.type === "image" ? (
                    <img src={asset.src} className="max-w-full max-h-full object-contain pointer-events-none" />
                  ) : asset.type === "audio" ? (
                    <div className="flex flex-col items-center justify-center pointer-events-none text-emerald-500">
                      <Music size={32} />
                    </div>
                  ) : asset.type === "video" ? (
                    <div className="flex flex-col items-center justify-center pointer-events-none text-purple-500">
                      <Video size={32} />
                    </div>
                  ) : (
                    <div className="text-neutral-500 tracking-wider font-bold">
                       {asset.type.toUpperCase()}
                    </div>
                  )}

                  {asset.type === "audio" && (
                    <button 
                       className="absolute inset-0 m-auto w-10 h-10 bg-emerald-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         const audio = new Audio(asset.src);
                         audio.play();
                       }}
                    >
                       <Play size={20} className="text-white ml-1" />
                    </button>
                  )}
                </div>
                <div className="bg-neutral-900 p-2 border-t border-neutral-800 flex flex-col flex-1">
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => {
                      updateProject({
                        assets: project.assets.map((a) => (a.id === asset.id ? { ...a, name: e.target.value } : a)),
                      });
                    }}
                    className="bg-transparent text-xs text-white font-medium outline-none border-b border-transparent focus:border-emerald-500 mb-1 w-full"
                  />
                  <select
                    value={asset.category || "root"}
                    onChange={(e) => {
                      updateProject({
                        assets: project.assets.map((a) => (a.id === asset.id ? { ...a, category: e.target.value } : a)),
                      });
                    }}
                    className="bg-neutral-800 text-[10px] text-neutral-400 p-0.5 rounded outline-none w-full mb-2"
                  >
                    <option value="root">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {/* Allow moving to activeCategory if it's new */}
                    {!categories.includes(activeCategory) && activeCategory !== "all" && (
                       <option value={activeCategory}>{activeCategory}</option>
                    )}
                  </select>
                  
                  <div className="mt-auto flex justify-end">
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${asset.name}?`)) {
                          updateProject({
                            assets: project.assets.filter((a) => a.id !== asset.id),
                          });
                        }
                      }}
                      className="p-1 hover:bg-red-500/20 text-neutral-500 hover:text-red-500 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredAssets.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
               <ImageIcon size={48} className="mb-4 opacity-20" />
               <p>No assets found in this category.</p>
               <button 
                 onClick={() => uploadInputRef.current?.click()}
                 className="mt-4 text-emerald-500 hover:underline"
               >
                 Upload some files
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
