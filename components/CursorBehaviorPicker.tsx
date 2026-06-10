import React from "react";
import {
  Grab,
  MessageCircle,
  MousePointer2,
  Move,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { CursorType, InteractionType } from "../types";

const choices: Array<{
  value: CursorType;
  label: string;
  hint: string;
  icon: React.ElementType;
}> = [
  { value: "pointer", label: "Open / Use", hint: "doors, buttons", icon: MousePointer2 },
  { value: "text", label: "Talk", hint: "NPCs, dialogue", icon: MessageCircle },
  { value: "zoom-in", label: "Inspect", hint: "look closer", icon: Search },
  { value: "grab", label: "Grab", hint: "pick up, drag", icon: Grab },
  { value: "move", label: "Move", hint: "reposition", icon: Move },
  { value: "nwse-resize", label: "Resize", hint: "stretchable", icon: Sparkles },
  { value: "not-allowed", label: "Locked", hint: "not available", icon: XCircle },
];

export const recommendedCursor = (
  interaction: InteractionType,
  isDraggable?: boolean,
): CursorType => {
  if (isDraggable) return "grab";
  if (interaction === "dialogue") return "text";
  if (interaction === "none") return "default";
  if (interaction === "collect" || interaction === "give-item") return "grab";
  if (interaction === "open_almanac") return "zoom-in";
  return "pointer";
};

export const CursorBehaviorPicker: React.FC<{
  value: CursorType;
  interaction: InteractionType;
  isDraggable?: boolean;
  onChange: (cursor: CursorType) => void;
}> = ({ value, interaction, isDraggable, onChange }) => {
  const recommended = recommendedCursor(interaction, isDraggable);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange(recommended)}
        className="flex w-full items-center justify-between rounded border border-[#00ffcc]/35 bg-[#00ffcc]/10 px-2.5 py-2 text-left hover:bg-[#00ffcc]/15"
      >
        <span>
          <span className="block font-comic text-[11px] font-bold text-[#00ffcc]">
            ✦ Choose for me
          </span>
          <span className="block text-[9px] text-neutral-500">
            Recommended for this response: {recommended.replace(/-/g, " ")}
          </span>
        </span>
      </button>
      <div className="grid grid-cols-2 gap-1.5">
        {choices.map((choice) => {
          const Icon = choice.icon;
          return (
            <button
              type="button"
              key={choice.value}
              onClick={() => onChange(choice.value)}
              className={`flex items-center gap-2 rounded border px-2 py-2 text-left ${
                value === choice.value
                  ? "border-pink-400 bg-pink-500/15 text-white"
                  : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-pink-500/40 hover:text-white"
              }`}
            >
              <Icon size={13} className="shrink-0 text-pink-400" />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold">{choice.label}</span>
                <span className="block truncate text-[8px] text-neutral-600">
                  {choice.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
