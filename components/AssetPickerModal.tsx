import React, { useState } from 'react';
import { Folder, Image as ImageIcon, Music, Search, X, Video, Star, Info } from 'lucide-react';
import { Asset } from '../types';

interface AssetPickerModalProps {
  assets: Asset[];
  onSelect: (assetId: string) => void;
  onClose: () => void;
  filterType?: 'image' | 'audio' | 'video' | 'script' | 'text' | 'ui_element' | 'hitbox';
  recentAssetIds?: string[];
  canvasAssetIds?: string[];
  onToggleFavorite?: (assetId: string) => void;
  onUpdateAsset?: (assetId: string, updates: Partial<Asset>) => void;
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ assets, onSelect, onClose, filterType, recentAssetIds = [], canvasAssetIds = [], onToggleFavorite, onUpdateAsset }) => {
  const [activeBin, setActiveBin] = useState<string>('all');
  const [assetSearch, setAssetSearch] = useState('');
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);

  const filteredAssets = assets.filter(a => {
    if (filterType && a.type !== filterType) return false;
    if (assetSearch) {
      if (a.name.toLowerCase().includes(assetSearch.toLowerCase())) return true;
      if (a.description && a.description.toLowerCase().includes(assetSearch.toLowerCase())) return true;
      if (a.tags && a.tags.some(t => t.toLowerCase().includes(assetSearch.toLowerCase()))) return true;
      return false;
    }
    if (activeBin === 'all') return true;
    if (activeBin === 'favorites') return a.isFavorite;
    if (activeBin === 'recent') return recentAssetIds.includes(a.id);
    if (activeBin === 'canvas') return canvasAssetIds.includes(a.id);
    const cat = a.category === 'root' ? '' : a.category;
    return cat === activeBin;
  });

  // Sort recent assets to maintain order
  if (activeBin === 'recent' && !assetSearch) {
    filteredAssets.sort((a, b) => {
      const idxA = recentAssetIds.indexOf(a.id);
      const idxB = recentAssetIds.indexOf(b.id);
      return idxA - idxB;
    });
  }

  const allCategories = Array.from(new Set<string>(assets.filter(a => !filterType || a.type === filterType).map(a => a.category || '')));
  const subfolders = new Set<string>();
  allCategories.forEach(cat => {
    if (activeBin === '') {
      if (cat && cat !== 'root') subfolders.add(cat.split('/')[0]);
    } else if (cat.startsWith(activeBin + '/')) {
      const remaining = cat.substring(activeBin.length + 1);
      if (remaining) subfolders.add(remaining.split('/')[0]);
    }
  });
  const folders = Array.from(subfolders).filter(Boolean).sort();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {filterType === 'image' ? <ImageIcon size={20} className="text-emerald-500"/> : filterType === 'audio' ? <Music size={20} className="text-indigo-500" /> : filterType === 'video' ? <Video size={20} className="text-blue-500"/> : <Folder size={20} className="text-neutral-500" />}
            Select Asset
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Area */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Search & Breadcrumbs */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={assetSearch}
                  onChange={e => setAssetSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex-1 flex items-center gap-1 text-sm text-neutral-400 overflow-x-auto pb-1 custom-scrollbar">
                <button onClick={() => setActiveBin('recent')} className={`hover:text-white whitespace-nowrap ${activeBin === 'recent' ? 'text-emerald-400 font-medium' : ''}`}>Recent</button>
                <span className="text-neutral-600">|</span>
                <button onClick={() => setActiveBin('favorites')} className={`hover:text-white whitespace-nowrap ${activeBin === 'favorites' ? 'text-emerald-400 font-medium' : ''}`}>Favorites</button>
                <span className="text-neutral-600">|</span>
                <button onClick={() => setActiveBin('canvas')} className={`hover:text-white whitespace-nowrap ${activeBin === 'canvas' ? 'text-emerald-400 font-medium' : ''}`}>In Canvas</button>
                <span className="text-neutral-600">|</span>
                <button onClick={() => setActiveBin('all')} className={`hover:text-white whitespace-nowrap ${activeBin === 'all' ? 'text-emerald-400 font-medium' : ''}`}>All</button>
                <span className="text-neutral-600">/</span>
                <button onClick={() => setActiveBin('')} className={`hover:text-white whitespace-nowrap ${activeBin === '' ? 'text-emerald-400 font-medium' : ''}`}>Root</button>
                {activeBin !== 'all' && activeBin !== 'recent' && activeBin !== 'favorites' && activeBin !== 'canvas' && activeBin !== '' && activeBin.split('/').filter(Boolean).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <span className="text-neutral-600">/</span>
                    <button 
                      onClick={() => setActiveBin(arr.slice(0, i + 1).join('/'))}
                      className={`hover:text-white whitespace-nowrap ${i === arr.length - 1 ? 'text-emerald-400 font-medium' : ''}`}
                    >
                      {part}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Folders */}
              {activeBin !== 'all' && activeBin !== 'recent' && activeBin !== 'canvas' && !assetSearch && folders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                  {folders.map(sub => (
                    <button 
                      key={sub}
                      onClick={() => setActiveBin(activeBin ? `${activeBin}/${sub}` : sub)}
                      className="bg-neutral-800 border border-neutral-700/50 rounded-lg p-3 flex items-center gap-3 hover:bg-neutral-700 transition-colors text-left"
                    >
                      <Folder size={18} className="text-emerald-400 shrink-0" />
                      <span className="text-sm text-neutral-200 truncate">{sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Assets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
                {filteredAssets.map(asset => (
                  <div 
                    key={asset.id}
                    className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg group hover:border-emerald-500 transition-colors flex flex-col hover:z-50 relative"
                  >
                    <div 
                      onClick={() => onSelect(asset.id)}
                      className="h-32 bg-neutral-900 flex items-center justify-center p-2 relative rounded-t-lg cursor-pointer overflow-hidden"
                    >
                      {asset.type === 'audio' ? (
                        <Music size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      ) : (
                        <img src={asset.src} alt={asset.name} className="max-w-full max-h-full object-contain pointer-events-none group-hover:scale-125 transition-transform relative z-10" loading="lazy" />
                      )}
                      {onToggleFavorite && (
                         <div 
                           className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-md z-20 
                                       ${asset.isFavorite ? 'bg-yellow-500/20 text-yellow-400 opacity-100' : 'bg-black/40 text-neutral-400 opacity-0 group-hover:opacity-100'} 
                                       hover:bg-yellow-500/40 hover:text-yellow-300 transition-all`}
                           onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.id); }}
                         >
                           <Star size={14} className={asset.isFavorite ? "fill-yellow-400" : ""} />
                         </div>
                      )}
                      {onUpdateAsset && (
                        <div 
                           className={`absolute top-2 left-2 p-1.5 rounded-md backdrop-blur-md z-20 bg-black/40 text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-neutral-700 hover:text-white transition-all`}
                           onClick={(e) => { e.stopPropagation(); setEditingInfoId(editingInfoId === asset.id ? null : asset.id); }}
                         >
                           <Info size={14} />
                         </div>
                      )}
                    </div>
                    {editingInfoId === asset.id ? (
                      <div className="p-3 border-t border-neutral-700/50 flex flex-col gap-2 bg-neutral-900 absolute top-full left-0 right-0 z-[100] rounded-b-lg shadow-xl shadow-black/50 border-x border-b border-emerald-500 max-h-64 overflow-y-auto">
                        <input 
                           type="text" 
                           value={asset.name} 
                           onChange={e => onUpdateAsset!(asset.id, { name: e.target.value })} 
                           className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-sm text-neutral-200 outline-none focus:border-emerald-500" 
                           placeholder="Asset Name"
                        />
                        <textarea 
                           className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 outline-none focus:border-emerald-500 flex-1 resize-none min-h-[4rem]" 
                           value={asset.description || ''}
                           onChange={e => onUpdateAsset!(asset.id, { description: e.target.value })}
                           placeholder="Description/notes..."
                        />
                        <input 
                           type="text" 
                           value={(asset.tags || []).join(', ')} 
                           onChange={e => onUpdateAsset!(asset.id, { tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                           className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500 outline-none" 
                           placeholder="tags, comma, separated"
                        />
                        {(asset.type === 'audio' || asset.type === 'video') && (
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-neutral-800">
                             <div className="text-[10px] uppercase font-bold text-neutral-500">Trim / Volume Edit</div>
                             <div className="flex gap-2">
                               <input type="number" step="0.1" value={asset.trimStart || 0} onChange={e => onUpdateAsset!(asset.id, { trimStart: Math.max(0, parseFloat(e.target.value) || 0)})} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-emerald-500" placeholder="Start (s)" title="Trim Start (seconds)" />
                               <input type="number" step="0.1" value={asset.trimEnd || ''} onChange={e => onUpdateAsset!(asset.id, { trimEnd: e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : undefined})} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-emerald-500" placeholder="End (s)" title="Trim End (seconds)" />
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-neutral-400">Vol:</span>
                               <input type="range" min="0" max="1" step="0.05" value={Math.min(1, asset.volume ?? 1)} onChange={e => onUpdateAsset!(asset.id, { volume: parseFloat(e.target.value) })} className="flex-1 accent-emerald-500 h-1 bg-neutral-800 rounded-full appearance-none outline-none" />
                               <span className="text-xs text-neutral-400 w-8 text-right">{Math.round(Math.min(1, asset.volume ?? 1) * 100)}%</span>
                             </div>
                          </div>
                        )}
                        <button onClick={() => setEditingInfoId(null)} className="w-full py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold rounded mt-1">Done</button>
                      </div>
                    ) : (
                      <div className="p-2 border-t border-neutral-700/50 cursor-pointer" onClick={() => onSelect(asset.id)}>
                        <p className="text-xs text-neutral-300 truncate font-medium group-hover:text-emerald-400 transition-colors" title={asset.name}>{asset.name}</p>
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex gap-1 overflow-hidden mt-1 mt-1">
                            {asset.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[9px] bg-neutral-900 text-emerald-400/80 px-1 rounded border border-emerald-500/20 whitespace-nowrap">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {filteredAssets.length === 0 && (
                  <div className="col-span-full py-12 text-center text-neutral-500">
                    No matching assets found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
