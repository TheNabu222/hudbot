import React, { useEffect, useRef, useState } from "react";
import { Check, MousePointer2, Plus, Trash2, X } from "lucide-react";
import {
  Asset,
  ClickResponse,
  DeviceFrameControl,
  DialogueTree,
  InventoryItem,
  LoreEntry,
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
  loreEntries: LoreEntry[];
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

type TransformHandle =
  | "move"
  | "north"
  | "south"
  | "east"
  | "west"
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

interface TransformState {
  id: string;
  handle: TransformHandle;
  pointerId: number;
  startPoint: Point;
  startControl: DeviceFrameControl;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const MIN_CONTROL_SIZE = 8;

const shellDestinations: Array<{
  interaction: ClickResponse["interaction"];
  label: string;
  detail: string;
}> = [
  { interaction: "open_map", label: "Map", detail: "Open the travel map" },
  {
    interaction: "toggle_inventory",
    label: "Inventory",
    detail: "Open or close the player's items",
  },
  {
    interaction: "toggle_needs_hud",
    label: "Needs HUD",
    detail: "Show or hide the small needs meters",
  },
  {
    interaction: "toggle_skills_hud",
    label: "Skills HUD",
    detail: "Show or hide the small skills meters",
  },
  {
    interaction: "open_quest_log",
    label: "Quests",
    detail: "Open the quest journal",
  },
  {
    interaction: "open_relationships",
    label: "Relationships",
    detail: "Open people and reputation",
  },
  { interaction: "open_skills", label: "Skills", detail: "Open player skills" },
  {
    interaction: "open_almanac",
    label: "Lore",
    detail: "Open the almanac",
  },
  {
    interaction: "open_crafting",
    label: "Crafting",
    detail: "Open recipes and crafting",
  },
  {
    interaction: "open_settings",
    label: "Settings",
    detail: "Open player settings",
  },
  {
    interaction: "save_game",
    label: "Save Game",
    detail: "Save the current game state",
  },
  {
    interaction: "load_game",
    label: "Load Game",
    detail: "Restore the last saved game",
  },
  {
    interaction: "advance_day",
    label: "Advance Day",
    detail: "Move to the next in-game day",
  },
  {
    interaction: "toggle_fullscreen",
    label: "Fullscreen",
    detail: "Toggle browser fullscreen",
  },
  {
    interaction: "toggle_mute",
    label: "Mute / Unmute",
    detail: "Toggle all game audio",
  },
  {
    interaction: "restart_game",
    label: "Restart Game",
    detail: "Wipe save and restart from the beginning",
  },
  {
    interaction: "restart_scene",
    label: "Restart Scene",
    detail: "Reset the current room only",
  },
  {
    interaction: "exit_game",
    label: "Exit Game",
    detail: "Leave play mode",
  },
];

export const ShellControlEditor: React.FC<ShellControlEditorProps> = ({
  calibration,
  imageSrc,
  assets,
  scenes,
  dialogueTrees,
  inventoryItems,
  quests,
  loreEntries,
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
  const [transform, setTransform] = useState<TransformState | null>(null);

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
    if (
      (event.target as HTMLElement).closest('[data-shell-control="true"]')
    ) {
      return;
    }
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
    if (transform) {
      const point = pointFromEvent(event);
      if (!point) return;
      const deltaX = point.x - transform.startPoint.x;
      const deltaY = point.y - transform.startPoint.y;
      const start = transform.startControl;
      let left = start.x;
      let top = start.y;
      let right = start.x + start.width;
      let bottom = start.y + start.height;

      if (transform.handle === "move") {
        left = clamp(start.x + deltaX, 0, calibration.outerWidth - start.width);
        top = clamp(start.y + deltaY, 0, calibration.outerHeight - start.height);
        right = left + start.width;
        bottom = top + start.height;
      } else {
        if (transform.handle.includes("west")) {
          left = clamp(
            start.x + deltaX,
            0,
            right - MIN_CONTROL_SIZE,
          );
        }
        if (transform.handle.includes("east")) {
          right = clamp(
            start.x + start.width + deltaX,
            left + MIN_CONTROL_SIZE,
            calibration.outerWidth,
          );
        }
        if (transform.handle.includes("north")) {
          top = clamp(
            start.y + deltaY,
            0,
            bottom - MIN_CONTROL_SIZE,
          );
        }
        if (transform.handle.includes("south")) {
          bottom = clamp(
            start.y + start.height + deltaY,
            top + MIN_CONTROL_SIZE,
            calibration.outerHeight,
          );
        }
      }

      setControls((current) =>
        current.map((control) =>
          control.id === transform.id
            ? {
                ...control,
                x: left,
                y: top,
                width: right - left,
                height: bottom - top,
              }
            : control,
        ),
      );
      return;
    }
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
    if (transform) {
      setTransform(null);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
      return;
    }
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

  const setPrimaryResponse = (response: ClickResponse) => {
    if (!selected) return;
    updateSelected({
      clickResponses: [response, ...selected.clickResponses.slice(1)],
    });
  };

  const beginTransform = (
    event: React.PointerEvent<HTMLElement>,
    control: DeviceFrameControl,
    handle: TransformHandle,
  ) => {
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(control.id);
    const canvas = imageRef.current?.parentElement;
    canvas?.setPointerCapture(event.pointerId);
    setTransform({
      id: control.id,
      handle,
      pointerId: event.pointerId,
      startPoint: point,
      startControl: { ...control },
    });
  };

  const updateSelectedNumber = (
    key: "x" | "y" | "width" | "height",
    rawValue: string,
  ) => {
    if (!selected) return;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    if (key === "x") {
      updateSelected({
        x: clamp(parsed, 0, calibration.outerWidth - selected.width),
      });
    } else if (key === "y") {
      updateSelected({
        y: clamp(parsed, 0, calibration.outerHeight - selected.height),
      });
    } else if (key === "width") {
      updateSelected({
        width: clamp(
          parsed,
          MIN_CONTROL_SIZE,
          calibration.outerWidth - selected.x,
        ),
      });
    } else {
      updateSelected({
        height: clamp(
          parsed,
          MIN_CONTROL_SIZE,
          calibration.outerHeight - selected.y,
        ),
      });
    }
  };

  const resizeHandles: Array<{
    handle: Exclude<TransformHandle, "move">;
    className: string;
    cursor: string;
  }> = [
    {
      handle: "north-west",
      className: "-left-1.5 -top-1.5",
      cursor: "cursor-nwse-resize",
    },
    {
      handle: "north",
      className: "left-1/2 -top-1.5 -translate-x-1/2",
      cursor: "cursor-ns-resize",
    },
    {
      handle: "north-east",
      className: "-right-1.5 -top-1.5",
      cursor: "cursor-nesw-resize",
    },
    {
      handle: "east",
      className: "-right-1.5 top-1/2 -translate-y-1/2",
      cursor: "cursor-ew-resize",
    },
    {
      handle: "south-east",
      className: "-bottom-1.5 -right-1.5",
      cursor: "cursor-nwse-resize",
    },
    {
      handle: "south",
      className: "-bottom-1.5 left-1/2 -translate-x-1/2",
      cursor: "cursor-ns-resize",
    },
    {
      handle: "south-west",
      className: "-bottom-1.5 -left-1.5",
      cursor: "cursor-nesw-resize",
    },
    {
      handle: "west",
      className: "-left-1.5 top-1/2 -translate-y-1/2",
      cursor: "cursor-ew-resize",
    },
  ];

  const renderControl = (
    control: DeviceFrameControl,
    isDraft = false,
  ) => {
    const isSelected = control.id === selectedId && !isDraft;
    return (
      <div
        key={control.id}
        data-shell-control="true"
        onPointerDown={(event) => {
          if (!isDraft) beginTransform(event, control, "move");
        }}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedId(control.id);
        }}
        className={`absolute border-2 ${
          isSelected
            ? "border-pink-400 bg-pink-500/25"
            : "border-[#00ffcc] bg-[#00ffcc]/15"
        } ${
          isDraft
            ? "pointer-events-none border-dashed"
            : "cursor-move touch-none"
        }`}
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
        {isSelected &&
          resizeHandles.map(({ handle, className, cursor }) => (
            <button
              key={handle}
              type="button"
              data-shell-control="true"
              aria-label={`Resize ${control.name} from ${handle.replace("-", " ")}`}
              onPointerDown={(event) => beginTransform(event, control, handle)}
              className={`absolute z-10 h-3 w-3 rounded-sm border border-neutral-950 bg-pink-300 shadow-[0_0_0_1px_white] ${className} ${cursor}`}
            />
          ))}
      </div>
    );
  };

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
                setTransform(null);
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
                <div className="rounded border border-neutral-700 bg-neutral-950/70 p-3">
                  <div className="font-comic text-xs font-bold text-[#00ffcc]">
                    Move and stretch
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    Drag the pink box to move it. Pull any edge or corner to
                    stretch or shrink it freely.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {(
                      [
                        ["x", "Left"],
                        ["y", "Top"],
                        ["width", "Width"],
                        ["height", "Height"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="text-[10px] font-bold text-neutral-400"
                      >
                        {label}
                        <input
                          type="number"
                          min={key === "width" || key === "height" ? 8 : 0}
                          step="1"
                          value={Math.round(selected[key])}
                          onChange={(event) =>
                            updateSelectedNumber(key, event.target.value)
                          }
                          className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-white"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded border border-pink-400/35 bg-pink-500/5 p-3">
                  <div className="font-comic text-sm font-bold text-white">
                    What should this button open?
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                    Pick the screen this shell icon represents. This is the normal setup for CRT and computer-frame buttons.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {shellDestinations.map((destination) => {
                      const isActive =
                        selected.clickResponses[0]?.interaction ===
                        destination.interaction;
                      return (
                        <button
                          key={destination.interaction}
                          type="button"
                          onClick={() =>
                            setPrimaryResponse({
                              id:
                                selected.clickResponses[0]?.id ||
                                crypto.randomUUID(),
                              interaction: destination.interaction,
                            })
                          }
                          className={`rounded border px-3 py-2 text-left transition-colors ${
                            isActive
                              ? "border-[#00ffcc] bg-[#00ffcc]/15 text-white"
                              : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-pink-400/60 hover:text-white"
                          }`}
                        >
                          <span className="block font-comic text-sm font-bold">
                            {destination.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-neutral-400">
                            {destination.detail}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 border-t border-neutral-700 pt-3">
                    <label className="block text-xs font-bold text-neutral-300">
                      Or open one of your custom interface screens
                      <select
                        value={
                          selected.clickResponses[0]?.interaction === "open_ui"
                            ? selected.clickResponses[0]?.targetUiId || ""
                            : ""
                        }
                        onChange={(event) => {
                          if (!event.target.value) return;
                          setPrimaryResponse({
                            id:
                              selected.clickResponses[0]?.id ||
                              crypto.randomUUID(),
                            interaction: "open_ui",
                            targetUiId: event.target.value,
                          });
                        }}
                        className="mt-1.5 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Choose a custom screen…</option>
                        {uiMenus.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <details className="rounded border border-neutral-700 bg-neutral-950/60">
                  <summary className="cursor-pointer px-3 py-2 font-comic text-xs font-bold text-neutral-300 hover:text-white">
                    Stack additional actions (sounds, conditions, scene change, dialogue…)
                  </summary>
                  <div className="border-t border-neutral-700 p-3">
                    <ClickResponseEditor
                      responses={selected.clickResponses}
                      assets={assets}
                      scenes={scenes}
                      dialogueTrees={dialogueTrees}
	                      inventoryItems={inventoryItems}
	                      quests={quests}
	                      loreEntries={loreEntries}
	                      gameFlags={gameFlags}
                      uiMenus={uiMenus}
                      skillIds={skillIds}
                      needIds={needIds}
                      relationshipIds={relationshipIds}
                      heading="Advanced button actions"
                      description="Optional: stack several actions in order or add conditions."
                      startNumber={1}
                      onChange={(clickResponses) =>
                        updateSelected({ clickResponses })
                      }
                    />
                  </div>
                </details>
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
