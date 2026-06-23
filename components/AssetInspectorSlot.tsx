import { FolderOpen, Music, X } from "lucide-react";
import { Asset } from "../types";

interface AssetInspectorSlotProps {
  label: string;
  description?: string;
  asset?: Asset | null;
  emptyLabel?: string;
  chooseLabel?: string;
  onChoose: () => void;
  onClear?: () => void;
  previewShape?: "square" | "wide";
  compact?: boolean;
}

export function AssetInspectorSlot({
  label,
  description,
  asset,
  emptyLabel = "Nothing chosen yet",
  chooseLabel = "Choose asset",
  onChoose,
  onClear,
  previewShape = "square",
  compact = false,
}: AssetInspectorSlotProps) {
  return (
    <div className="asset-inspector-slot rounded-[7px_18px_7px_18px] border border-[#00ffcc]/15 bg-neutral-950/75 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
      <div className="mb-2">
        <div className="font-comic text-sm font-bold text-white">
          {label}
        </div>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            {description}
          </p>
        )}
      </div>

      <div className={`flex ${compact ? "items-center" : "items-stretch"} gap-2`}>
        <button
          type="button"
          onClick={onChoose}
          className={`asset-thumbnail group relative shrink-0 overflow-hidden rounded-[5px_14px_5px_14px] border border-[#00ffcc]/20 bg-[linear-gradient(135deg,rgba(0,255,204,0.08),rgba(255,79,200,0.08)),#070812] hover:border-[#00ffcc]/70 ${
            previewShape === "wide"
              ? compact
                ? "h-12 w-20"
                : "aspect-video w-32"
              : compact
                ? "h-12 w-12"
                : "h-20 w-20"
          }`}
          aria-label={`${chooseLabel}: ${label}`}
        >
          {asset?.type === "image" && asset.src ? (
            <img
              src={asset.src}
              alt=""
              className="h-full w-full object-contain p-1.5 transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : asset?.type === "video" && asset.src ? (
            <video
              src={asset.src}
              muted
              className="h-full w-full object-contain p-1.5"
            />
          ) : asset?.type === "audio" ? (
            <Music
              size={compact ? 18 : 24}
              className="absolute inset-0 m-auto text-pink-300 group-hover:text-[#00ffcc]"
            />
          ) : (
            <FolderOpen
              size={compact ? 18 : 24}
              className="absolute inset-0 m-auto text-neutral-500 group-hover:text-[#00ffcc]"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-neutral-200">
            {asset?.name || emptyLabel}
          </div>
          <div className="mt-1 inline-flex rounded border border-neutral-700/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            {asset ? asset.type : "empty slot"}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onChoose}
              className="rounded border border-[#00ffcc]/35 bg-[#00ffcc]/10 px-2.5 py-1.5 text-xs font-bold text-[#00ffcc] hover:bg-[#00ffcc]/20"
            >
              {asset ? "Change" : chooseLabel}
            </button>
            {asset && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 rounded border border-red-500/25 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10"
              >
                <X size={12} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
