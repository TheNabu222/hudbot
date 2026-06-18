import React from "react";
import { RotateCcw } from "lucide-react";

interface InterfaceSizeControlProps {
  label: string;
  description?: string;
  widthPercent: number;
  heightPercent: number;
  min?: number;
  max?: number;
  onChange: (size: { widthPercent: number; heightPercent: number }) => void;
  onReset?: () => void;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function InterfaceSizeControl({
  label,
  description,
  widthPercent,
  heightPercent,
  min = 10,
  max = 400,
  onChange,
  onReset,
}: InterfaceSizeControlProps) {
  const changeDimension = (
    dimension: "widthPercent" | "heightPercent",
    value: number,
  ) => {
    onChange({
      widthPercent,
      heightPercent,
      [dimension]: clamp(value || 100, min, max),
    });
  };

  return (
    <div className="interface-size-control rounded-[7px_18px_7px_18px] border border-white/10 bg-black/15 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-comic text-sm font-bold text-white">
            {label}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-neutral-700 p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label={`Reset ${label} size`}
            title="Reset width and height"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {(
          [
            ["widthPercent", "Width"],
            ["heightPercent", "Height"],
          ] as const
        ).map(([dimension, dimensionLabel]) => {
          const value =
            dimension === "widthPercent" ? widthPercent : heightPercent;
          return (
            <label
              key={dimension}
              className="text-xs font-bold text-neutral-300"
            >
              <span className="flex items-center justify-between">
                {dimensionLabel}
                <span className="font-mono text-[#00ffcc]">
                  {Math.round(value)}%
                </span>
              </span>
              <input
                type="number"
                min={min}
                max={max}
                step="1"
                value={Math.round(value)}
                onChange={(event) =>
                  changeDimension(dimension, Number(event.target.value))
                }
                className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-[#00ffcc]"
              />
              <input
                type="range"
                min={min}
                max={max}
                step="1"
                value={clamp(value, min, max)}
                onChange={(event) =>
                  changeDimension(dimension, Number(event.target.value))
                }
                className="mt-2 w-full accent-pink-500"
              />
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-bold leading-relaxed text-pink-300">
        Width and height are independent—stretch or squash freely.
      </p>
    </div>
  );
}
