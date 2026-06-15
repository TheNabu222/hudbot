import React from "react";
import { FolderOpen, X } from "lucide-react";
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
    <div className="asset-inspector-slot rounded border border-neutral-700 bg-neutral-950/70 p-2.5">
      <div className="mb-2">
        <div className="font-comic text-[11px] font-bold text-white">
          {label}
        </div>
        {description && (
          <p className="mt-0.5 text-[9px] leading-relaxed text-neutral-500">
            {description}
          </p>
        )}
      </div>

      <div className={`flex ${compact ? "items-center" : "items-stretch"} gap-2`}>
        <button
          type="button"
          onClick={onChoose}
          className={`asset-thumbnail group relative shrink-0 overflow-hidden rounded border border-neutral-700 hover:border-[#00ffcc]/70 ${
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
              className="h-full w-full object-contain p-1 transition-transform group-hover:scale-105"
            />
          ) : asset?.type === "video" && asset.src ? (
            <video
              src={asset.src}
              muted
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <FolderOpen
              size={compact ? 18 : 24}
              className="absolute inset-0 m-auto text-neutral-500 group-hover:text-[#00ffcc]"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold text-neutral-200">
            {asset?.name || emptyLabel}
          </div>
          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-600">
            {asset ? asset.type : "empty slot"}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onChoose}
              className="rounded border border-[#00ffcc]/35 bg-[#00ffcc]/10 px-2 py-1 text-[9px] font-bold text-[#00ffcc] hover:bg-[#00ffcc]/20"
            >
              {asset ? "Change" : chooseLabel}
            </button>
            {asset && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 rounded border border-red-500/25 px-2 py-1 text-[9px] font-bold text-red-400 hover:bg-red-500/10"
              >
                <X size={10} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
