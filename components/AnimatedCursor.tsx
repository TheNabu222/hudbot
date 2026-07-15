import React, { useEffect, useRef } from "react";

export const AnimatedCursor: React.FC<{
  src?: string;
  surfaceSelector?: string;
}> = ({ src, surfaceSelector }) => {
  const cursorRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const moveCursor = (event: PointerEvent) => {
      if (!cursorRef.current) return;
      const target = event.target;
      if (
        surfaceSelector &&
        (!(target instanceof Element) || !target.closest(surfaceSelector))
      ) {
        cursorRef.current.style.opacity = "0";
        return;
      }
      cursorRef.current.style.transform = `translate3d(${event.clientX - 4}px, ${event.clientY - 4}px, 0)`;
      cursorRef.current.style.opacity = "1";
    };
    const hideCursor = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideCursor);
    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
    };
  }, [surfaceSelector]);

  if (!src) return null;

  return (
    <img
      ref={cursorRef}
      src={src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[20000] h-10 w-10 -translate-x-1 -translate-y-1 object-contain opacity-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
    />
  );
};
