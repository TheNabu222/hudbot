import React, { useEffect, useRef, useState } from "react";
import { Check, Crosshair, RotateCcw, X } from "lucide-react";

export interface DeviceFrameCalibration {
  assetId: string;
  outerWidth: number;
  outerHeight: number;
  screen: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DeviceFrameOverlayProps {
  calibration: DeviceFrameCalibration;
  imageSrc: string;
  className?: string;
}

export const DeviceFrameOverlay: React.FC<DeviceFrameOverlayProps> = ({
  calibration,
  imageSrc,
  className = "",
}) => {
  const { outerWidth, outerHeight, screen } = calibration;
  const slices = [
    { x: 0, y: 0, width: outerWidth, height: screen.y },
    {
      x: 0,
      y: screen.y,
      width: screen.x,
      height: screen.height,
    },
    {
      x: screen.x + screen.width,
      y: screen.y,
      width: outerWidth - screen.x - screen.width,
      height: screen.height,
    },
    {
      x: 0,
      y: screen.y + screen.height,
      width: outerWidth,
      height: outerHeight - screen.y - screen.height,
    },
  ].filter((slice) => slice.width > 0 && slice.height > 0);

  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {slices.map((slice, index) => (
        <div
          key={index}
          className="absolute overflow-hidden"
          style={{
            left: `${(slice.x / outerWidth) * 100}%`,
            top: `${(slice.y / outerHeight) * 100}%`,
            width: `${(slice.width / outerWidth) * 100}%`,
            height: `${(slice.height / outerHeight) * 100}%`,
          }}
        >
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: `${(outerWidth / slice.width) * 100}%`,
              height: `${(outerHeight / slice.height) * 100}%`,
              left: `${(-slice.x / slice.width) * 100}%`,
              top: `${(-slice.y / slice.height) * 100}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

interface DeviceFrameCalibratorProps {
  assetId: string;
  imageSrc: string;
  initialCalibration?: DeviceFrameCalibration;
  onCancel: () => void;
  onSave: (calibration: DeviceFrameCalibration) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const DeviceFrameCalibrator: React.FC<
  DeviceFrameCalibratorProps
> = ({
  assetId,
  imageSrc,
  initialCalibration,
  onCancel,
  onSave,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({
    width: initialCalibration?.outerWidth || 0,
    height: initialCalibration?.outerHeight || 0,
  });
  const [screenRect, setScreenRect] = useState<Rect | null>(
    initialCalibration?.screen || null,
  );
  const [dragStart, setDragStart] = useState<Point | null>(null);

  useEffect(() => {
    setScreenRect(initialCalibration?.screen || null);
  }, [initialCalibration, assetId]);

  const pointFromEvent = (event: React.PointerEvent): Point | null => {
    const image = imageRef.current;
    if (!image || !imageSize.width || !imageSize.height) return null;
    const bounds = image.getBoundingClientRect();
    return {
      x: clamp(
        ((event.clientX - bounds.left) / bounds.width) * imageSize.width,
        0,
        imageSize.width,
      ),
      y: clamp(
        ((event.clientY - bounds.top) / bounds.height) * imageSize.height,
        0,
        imageSize.height,
      ),
    };
  };

  const beginMarking = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart(point);
    setScreenRect({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const continueMarking = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const point = pointFromEvent(event);
    if (!point) return;
    setScreenRect({
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    });
  };

  const finishMarking = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    continueMarking(event);
    setDragStart(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  };

  const hasUsableScreen =
    !!screenRect && screenRect.width >= 10 && screenRect.height >= 10;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="device-calibrator flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden border border-emerald-400/60 bg-neutral-950 shadow-[0_0_60px_rgba(0,255,204,0.18)]">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 font-comic text-base font-bold text-white">
              <Crosshair size={18} className="text-emerald-400" />
              Mark the Game Screen
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              Drag one box over the blank screen opening. You can redraw it as
              many times as you want.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close screen calibrator"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_center,rgba(37,92,255,0.12),transparent_55%)] p-5">
          <div
            className="relative mx-auto w-fit max-w-full cursor-crosshair select-none touch-none"
            onPointerDown={beginMarking}
            onPointerMove={continueMarking}
            onPointerUp={finishMarking}
            onPointerCancel={() => setDragStart(null)}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Device frame to calibrate"
              draggable={false}
              onLoad={(event) =>
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              className="block max-h-[68vh] max-w-full object-contain"
            />

            {screenRect && imageSize.width > 0 && imageSize.height > 0 && (
              <div
                className="pointer-events-none absolute border-2 border-emerald-300 bg-emerald-400/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.38),0_0_24px_rgba(0,255,204,0.9)]"
                style={{
                  left: `${(screenRect.x / imageSize.width) * 100}%`,
                  top: `${(screenRect.y / imageSize.height) * 100}%`,
                  width: `${(screenRect.width / imageSize.width) * 100}%`,
                  height: `${(screenRect.height / imageSize.height) * 100}%`,
                }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-neutral-950/90 px-2 py-1 font-pixel text-lg text-emerald-300">
                  GAME GOES HERE
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-900 px-4 py-3">
          <div className="text-xs text-neutral-400">
            {hasUsableScreen
              ? "Looks good. The frame will wrap around Play mode and exported games."
              : "Drag across the empty screen area to continue."}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScreenRect(null)}
              className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-300 hover:bg-neutral-700"
            >
              <RotateCcw size={14} />
              Redraw
            </button>
            <button
              type="button"
              disabled={!hasUsableScreen}
              onClick={() => {
                if (!screenRect || !hasUsableScreen) return;
                onSave({
                  assetId,
                  outerWidth: imageSize.width,
                  outerHeight: imageSize.height,
                  screen: {
                    x: Math.round(screenRect.x),
                    y: Math.round(screenRect.y),
                    width: Math.round(screenRect.width),
                    height: Math.round(screenRect.height),
                  },
                });
              }}
              className="flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-400 px-4 py-2 font-comic text-xs font-bold text-neutral-950 shadow-[0_0_14px_rgba(0,255,204,0.25)] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Check size={15} />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
