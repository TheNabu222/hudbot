import React from "react";
import { FileCode, Image as ImageIcon, Music, Play, Video, Wand2 } from "lucide-react";
import type { Asset } from "../types";

export const getAssetActionLabel = (asset: Pick<Asset, "type"> | { type?: string }) => {
  if (asset.type === "audio") return "Add sound cue";
  if (asset.type === "video") return "Add video cue";
  if (asset.type === "script") return "Add script";
  return "Place in room";
};

interface AssetCardProps {
  asset: Asset;
  onPrimaryAction?: (asset: Asset) => void;
  onEditImage?: (assetId: string) => void;
  onUpdateAsset?: (assetId: string, updates: Partial<Asset>) => void;
  onDragStart?: (event: React.DragEvent, asset: Asset) => void;
  primaryLabel?: string;
  prefixPrimaryLabel?: string;
  className?: string;
  title?: string;
}

export function AssetCard({
  asset,
  onPrimaryAction,
  onEditImage,
  onUpdateAsset,
  onDragStart,
  primaryLabel,
  prefixPrimaryLabel = "",
  className = "",
  title,
}: AssetCardProps) {
  const resolvedPrimaryLabel = `${prefixPrimaryLabel}${primaryLabel || getAssetActionLabel(asset)}`;
  const previewAudio = () => {
    const mediaFragment =
      asset.trimStart || asset.trimEnd
        ? `#t=${asset.trimStart || 0}${asset.trimEnd ? `,${asset.trimEnd}` : ""}`
        : "";
    const audio = new Audio(asset.src + mediaFragment);
    audio.volume = Math.min(1, asset.volume ?? 1);
    audio.play().catch(() => undefined);
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(event) => onDragStart?.(event, asset)}
      className={`group flex gap-3 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 p-2 ${className}`}
      title={title || asset.name}
    >
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(0,255,204,.08),rgba(255,79,200,.08))] p-2">
        {asset.type === "image" ? (
          <img
            src={asset.src}
            alt={asset.name}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : asset.type === "audio" ? (
          <Music size={30} className="text-cyan-200" />
        ) : asset.type === "video" ? (
          <Video size={30} className="text-pink-200" />
        ) : asset.type === "script" ? (
          <FileCode size={30} className="text-yellow-200" />
        ) : (
          <ImageIcon size={30} className="text-neutral-400" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 inline-flex rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-neutral-300">
            {asset.type}
          </div>
          <div className="line-clamp-2 text-sm font-bold leading-tight text-white" title={asset.name}>
            {asset.name}
          </div>
        </div>
        <div className="mt-2">
          {onPrimaryAction && (
            <button
              type="button"
              onClick={() => onPrimaryAction(asset)}
              className="w-full rounded border border-cyan-300/40 bg-cyan-400/10 px-2 py-1.5 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20"
            >
              {resolvedPrimaryLabel}
            </button>
          )}
          {asset.type === "audio" && (
            <div className="mt-2 rounded border border-cyan-300/20 bg-black/25 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-cyan-200">
                  Audio controls
                </span>
                <button
                  type="button"
                  onClick={previewAudio}
                  className="inline-flex items-center gap-1 rounded border border-cyan-300/35 bg-cyan-400/10 px-2 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/20"
                >
                  <Play size={11} />
                  Preview
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  Start
                  <input
                    type="number"
                    step="0.1"
                    value={asset.trimStart || 0}
                    disabled={!onUpdateAsset}
                    onChange={(event) =>
                      onUpdateAsset?.(asset.id, {
                        trimStart: Math.max(0, parseFloat(event.target.value) || 0),
                      })
                    }
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-normal text-neutral-100 outline-none focus:border-cyan-300 disabled:opacity-50"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  End
                  <input
                    type="number"
                    step="0.1"
                    value={asset.trimEnd || ""}
                    disabled={!onUpdateAsset}
                    onChange={(event) =>
                      onUpdateAsset?.(asset.id, {
                        trimEnd: event.target.value
                          ? Math.max(0, parseFloat(event.target.value) || 0)
                          : undefined,
                      })
                    }
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-normal text-neutral-100 outline-none focus:border-cyan-300 disabled:opacity-50"
                    placeholder="none"
                  />
                </label>
              </div>
              <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Vol
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={Math.min(1, asset.volume ?? 1)}
                  disabled={!onUpdateAsset}
                  onChange={(event) =>
                    onUpdateAsset?.(asset.id, { volume: parseFloat(event.target.value) })
                  }
                  className="min-w-0 flex-1 accent-cyan-300 disabled:opacity-50"
                />
                <span className="w-9 text-right text-neutral-300">
                  {Math.round(Math.min(1, asset.volume ?? 1) * 100)}%
                </span>
              </label>
            </div>
          )}
          {asset.type === "image" && onEditImage && (
            <button
              type="button"
              onClick={() => onEditImage(asset.id)}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-emerald-300/35 bg-emerald-400/10 px-2 py-1.5 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20"
            >
              <Wand2 size={13} />
              Edit image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
