"use client";
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export function BadgeTooltip({
  children,
  label,
  description,
  criteria,
}: {
  children: React.ReactNode;
  label: string;
  description: string;
  criteria?: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = Math.min(r.left, window.innerWidth - 240);
    setPos({ x, y: r.bottom + 8 });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide} className="inline-flex cursor-default">
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 9999 }}
            className="pointer-events-none w-56 rounded-xl bg-white p-3 shadow-2xl ring-1 ring-black/8"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40">{label}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/80">{description}</p>
            {criteria && (
              <p className="mt-2 border-t border-black/6 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                {criteria}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
