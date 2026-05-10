import React, { useState } from 'react';
import { Folder, Image as ImageIcon, Music, Search, X, Video } from 'lucide-react';
import { Asset } from '../types';

interface AssetPickerModalProps {
  assets: Asset[];
  onSelect: (assetId: string) => void;
  onClose: () => void;
  filterType?: 'image' | 'audio' | 'video';
  recentAssetIds?: string[];
  canvasAssetIds?: string[];
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ assets, onSelect, onClose, filterType, recentAssetIds = [], canvasAssetIds = [] }) => {
  const [activeBin, setActiveBin] = useState<string>('all');
  const [assetSearch, setAssetSearch] = useState('');

  const filteredAssets = assets.filter(a => {
    if (filterType && a.type !== filterType) return false;
    if (assetSearch) return a.name.toLowerCase().includes(assetSearch.toLowerCase());
    if (activeBin === 'all') return true;
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
                <button onClick={() => setActiveBin('canvas')} className={`hover:text-white whitespace-nowrap ${activeBin === 'canvas' ? 'text-emerald-400 font-medium' : ''}`}>In Canvas</button>
                <span className="text-neutral-600">|</span>
                <button onClick={() => setActiveBin('all')} className={`hover:text-white whitespace-nowrap ${activeBin === 'all' ? 'text-emerald-400 font-medium' : ''}`}>All</button>
                <span className="text-neutral-600">/</span>
                <button onClick={() => setActiveBin('')} className={`hover:text-white whitespace-nowrap ${activeBin === '' ? 'text-emerald-400 font-medium' : ''}`}>Root</button>
                {activeBin !== 'all' && activeBin !== 'recent' && activeBin !== 'canvas' && activeBin !== '' && activeBin.split('/').filter(Boolean).map((part, i, arr) => (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAssets.map(asset => (
                  <div 
                    key={asset.id}
                    onClick={() => onSelect(asset.id)}
                    className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg overflow-hidden group cursor-pointer hover:border-emerald-500 transition-colors flex flex-col"
                  >
                    <div className="h-24 bg-neutral-900 flex items-center justify-center p-2 relative">
                      {asset.type === 'audio' ? (
                        <Music size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      ) : (
                        <img src={asset.src} alt={asset.name} className="max-w-full max-h-full object-contain pointer-events-none group-hover:scale-105 transition-transform" loading="lazy" />
                      )}
                    </div>
                    <div className="p-2 border-t border-neutral-700/50">
                      <p className="text-xs text-neutral-300 truncate font-medium group-hover:text-emerald-400 transition-colors" title={asset.name}>{asset.name}</p>
                    </div>
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
