import React, { useMemo, useState } from "react";
import { FolderOpen, Image as ImageIcon, Music, Search, Upload, Video, X } from "lucide-react";
import { Asset } from "../types";

interface AssetQuickDockProps {
  assets: Asset[];
  onClose: () => void;
  onOpenLibrary: () => void;
  onPlaceAsset: (asset: Asset) => void;
  onUploadFiles: (files: File[]) => void;
}

export const AssetQuickDock: React.FC<AssetQuickDockProps> = React.memo(({
  assets,
  onClose,
  onOpenLibrary,
  onPlaceAsset,
  onUploadFiles,
}) => {
  const [search, setSearch] = useState("");
  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets
      .filter((asset) => {
        if (!query) return true;
        return [asset.name, asset.description || "", ...(asset.tags || [])].some(
          (value) => value.toLowerCase().includes(query),
        );
      })
      .slice(0, 30);
  }, [assets, search]);

  return (
    <aside className="feature-asset-dock flex w-[320px] min-w-[280px] max-w-[34vw] flex-col border-l border-pink-400/40 bg-neutral-950 shadow-[-12px_0_30px_rgba(0,0,0,.28)]">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-3">
        <div>
          <div className="font-comic text-base font-bold text-white">Collected Assets</div>
          <div className="text-xs text-neutral-400">Available everywhere</div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white" aria-label="Hide collected assets">
          <X size={17} />
        </button>
      </div>

      <div className="space-y-2 border-b border-neutral-800 p-3">
        <div className="flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-pink-400/45 bg-pink-500/10 px-2 py-2 font-comic text-xs font-bold text-pink-200 hover:bg-pink-500/20">
            <Upload size={13} /> Add files
            <input
              type="file"
              multiple
              accept="image/*,audio/*,video/*,.gif,.svg"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (files.length) onUploadFiles(files);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" onClick={onOpenLibrary} className="flex flex-1 items-center justify-center gap-1 rounded border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-2 py-2 font-comic text-xs font-bold text-[#00ffcc] hover:bg-[#00ffcc]/20">
            <FolderOpen size={13} /> Full library
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search collected assets…"
            className="w-full rounded border border-neutral-700 bg-black py-2 pl-8 pr-3 text-sm text-white outline-none focus:border-[#00ffcc]"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
        {visibleAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onPlaceAsset(asset)}
            className="group overflow-hidden rounded border border-neutral-700 bg-neutral-900 text-left hover:border-[#00ffcc]/60"
            title={`Place ${asset.name} in the current room`}
          >
            <div className="flex h-24 items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,204,.08),rgba(255,79,200,.08))] p-2">
              {asset.type === "image" ? (
                <img src={asset.src} alt="" loading="lazy" className="h-full w-full object-contain" />
              ) : asset.type === "audio" ? (
                <Music size={28} className="text-[#00ffcc]" />
              ) : asset.type === "video" ? (
                <Video size={28} className="text-pink-300" />
              ) : (
                <ImageIcon size={28} className="text-neutral-400" />
              )}
            </div>
            <div className="p-2">
              <div className="truncate text-xs font-bold text-white">{asset.name}</div>
              <div className="mt-1 font-comic text-[11px] font-bold text-[#00ffcc]">+ Place in room</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
});

AssetQuickDock.displayName = "AssetQuickDock";
