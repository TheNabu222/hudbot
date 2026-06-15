import React, { useEffect, useRef, useState } from "react";
import { Check, MousePointer2, Plus, Trash2, X } from "lucide-react";
import {
  Asset,
  DeviceFrameControl,
  DialogueTree,
  InventoryItem,
  Quest,
  Scene,
} from "../types";
import { DeviceFrameCalibration } from "./DeviceFrameCalibrator";
import { ClickResponseEditor } from "./ClickResponseEditor";

interface ShellControlEditorProps {
  calibration: DeviceFrameCalibration;
  imageSrc: string;
  assets: Asset[];
  scenes: Scene[];
  dialogueTrees: DialogueTree[];
  inventoryItems: InventoryItem[];
  quests: Quest[];
  gameFlags: string[];
  uiMenus: Scene[];
  skillIds: string[];
  needIds: string[];
  relationshipIds: string[];
  onCancel: () => void;
  onSave: (controls: DeviceFrameControl[]) => void;
}

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const ShellControlEditor: React.FC<ShellControlEditorProps> = ({
  calibration,
  imageSrc,
  assets,
  scenes,
  dialogueTrees,
  inventoryItems,
  quests,
  gameFlags,
  uiMenus,
  skillIds,
  needIds,
  relationshipIds,
  onCancel,
  onSave,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [controls, setControls] = useState<DeviceFrameControl[]>(
    calibration.controls || [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    calibration.controls?.[0]?.id || null,
  );
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [draft, setDraft] = useState<DeviceFrameControl | null>(null);

  useEffect(() => {
    setControls(calibration.controls || []);
    setSelectedId(calibration.controls?.[0]?.id || null);
  }, [calibration]);

  const selected = controls.find((control) => control.id === selectedId);

  const pointFromEvent = (event: React.PointerEvent): Point | null => {
    const image = imageRef.current;
    if (!image) return null;
    const bounds = image.getBoundingClientRect();
    return {
      x: clamp(
        ((event.clientX - bounds.left) / bounds.width) *
          calibration.outerWidth,
        0,
        calibration.outerWidth,
      ),
      y: clamp(
        ((event.clientY - bounds.top) / bounds.height) *
          calibration.outerHeight,
        0,
        calibration.outerHeight,
      ),
    };
  };

  const beginDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).dataset.shellControl === "true") return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawStart(point);
    setDraft({
      id: crypto.randomUUID(),
      name: `Shell button ${controls.length + 1}`,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      cursor: "pointer",
      clickResponses: [],
    });
  };

  const continueDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawStart || !draft) return;
    const point = pointFromEvent(event);
    if (!point) return;
    setDraft({
      ...draft,
      x: Math.min(drawStart.x, point.x),
      y: Math.min(drawStart.y, point.y),
      width: Math.abs(point.x - drawStart.x),
      height: Math.abs(point.y - drawStart.y),
    });
  };

  const finishDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft) return;
    const point = pointFromEvent(event);
    const finalDraft =
      drawStart && point
        ? {
            ...draft,
            x: Math.min(drawStart.x, point.x),
            y: Math.min(drawStart.y, point.y),
            width: Math.abs(point.x - drawStart.x),
            height: Math.abs(point.y - drawStart.y),
          }
        : draft;
    if (finalDraft.width >= 8 && finalDraft.height >= 8) {
      setControls((current) => [...current, finalDraft]);
      setSelectedId(finalDraft.id);
    }
    setDrawStart(null);
    setDraft(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  };

  const updateSelected = (updates: Partial<DeviceFrameControl>) => {
    if (!selectedId) return;
    setControls((current) =>
      current.map((control) =>
        control.id === selectedId ? { ...control, ...updates } : control,
      ),
    );
  };

  const renderControl = (
    control: DeviceFrameControl,
    isDraft = false,
  ) => (
    <button
      key={control.id}
      type="button"
      data-shell-control="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedId(control.id);
      }}
      className={`absolute border-2 ${
        control.id === selectedId
          ? "border-pink-400 bg-pink-500/25"
          : "border-[#00ffcc] bg-[#00ffcc]/15"
      } ${isDraft ? "pointer-events-none border-dashed" : ""}`}
      style={{
        left: `${(control.x / calibration.outerWidth) * 100}%`,
        top: `${(control.y / calibration.outerHeight) * 100}%`,
        width: `${(control.width / calibration.outerWidth) * 100}%`,
        height: `${(control.height / calibration.outerHeight) * 100}%`,
      }}
    >
      <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-neutral-950/90 px-1.5 py-0.5 font-comic text-[10px] font-bold text-white">
        {control.name}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[12500] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden border border-pink-400/60 bg-neutral-950 shadow-[0_0_60px_rgba(255,0,153,0.2)]">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 font-comic text-base font-bold text-white">
              <MousePointer2 size={18} className="text-pink-400" />
              Make the Shell Buttons Work
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              Drag boxes over knobs, icons, buttons, or ornaments outside the
              game screen. Then tell each one what happens.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close shell control editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-auto bg-[radial-gradient(circle_at_center,rgba(255,0,153,0.12),transparent_58%)] p-6">
            <div
              className="relative mx-auto w-fit max-w-full cursor-crosshair select-none touch-none"
              onPointerDown={beginDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={finishDrawing}
              onPointerCancel={() => {
                setDrawStart(null);
                setDraft(null);
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Device shell controls"
                draggable={false}
                className="block max-h-[76vh] max-w-full object-contain"
              />
              <div
                className="pointer-events-none absolute border-2 border-dashed border-emerald-300/80 bg-emerald-400/10"
                style={{
                  left: `${(calibration.screen.x / calibration.outerWidth) * 100}%`,
                  top: `${(calibration.screen.y / calibration.outerHeight) * 100}%`,
                  width: `${(calibration.screen.width / calibration.outerWidth) * 100}%`,
                  height: `${(calibration.screen.height / calibration.outerHeight) * 100}%`,
                }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-neutral-950/80 px-2 py-1 font-pixel text-xs text-emerald-300">
                  GAME SCREEN
                </span>
              </div>
              {controls.map((control) => renderControl(control))}
              {draft && renderControl(draft, true)}
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4">
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-comic text-sm font-bold text-pink-300">
                    Selected shell control
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setControls((current) =>
                        current.filter((control) => control.id !== selected.id),
                      );
                      setSelectedId(null);
                    }}
                    className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                    aria-label="Delete shell control"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <label className="block text-[10px] font-bold text-neutral-400">
                  What do you call it?
                  <input
                    type="text"
                    value={selected.name}
                    onChange={(event) =>
                      updateSelected({ name: event.target.value })
                    }
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <ClickResponseEditor
                  responses={selected.clickResponses}
                  assets={assets}
                  scenes={scenes}
                  dialogueTrees={dialogueTrees}
                  inventoryItems={inventoryItems}
                  quests={quests}
                  gameFlags={gameFlags}
                  uiMenus={uiMenus}
                  skillIds={skillIds}
                  needIds={needIds}
                  relationshipIds={relationshipIds}
                  heading="What happens when clicked?"
                  description="Add one response or stack several in order."
                  startNumber={1}
                  onChange={(clickResponses) =>
                    updateSelected({ clickResponses })
                  }
                />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-neutral-500">
                <Plus size={28} className="mb-3 text-[#00ffcc]" />
                <p className="font-comic text-sm font-bold text-white">
                  Draw a button box
                </p>
                <p className="mt-1 max-w-56 text-xs">
                  Drag over any visible shell control, then add one or many
                  responses.
                </p>
              </div>
            )}
          </aside>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-900 px-4 py-3">
          <div className="text-xs text-neutral-400">
            {controls.length} working shell control
            {controls.length === 1 ? "" : "s"}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-300 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(controls)}
              className="flex items-center gap-1.5 rounded border border-pink-300 bg-pink-400 px-4 py-2 font-comic text-xs font-bold text-neutral-950 hover:bg-pink-300"
            >
              <Check size={15} />
              Save Shell Controls
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
