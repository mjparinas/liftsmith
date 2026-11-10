"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";

import { Icon } from "./icons";

// Press and hold to drag (polish pass, Melvin 2026-11-10): a row of a list (Today's plan, Coming up)
// lifts after a short hold and follows the finger; letting go drops it where the marker is. A quick
// swipe still scrolls, because the hold has to come first. Keyboard and switch users move a row with
// Alt + arrow up or down on it. Controls inside a row marked data-no-drag (the superset link) keep
// their own taps.

const HOLD_MS = 380;
const SLOP = 8;

export interface Drag {
  from: number;
  over: number;
  dy: number;
}

export function useReorder(onMove: (from: number, to: number) => void, range: { min: number; max: number }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  /** A row picked to move with buttons (held without dragging, or its move button tapped). */
  const [picked, setPicked] = useState<number | null>(null);
  const live = useRef<{ from: number; over: number; startY: number; rows: DOMRect[]; indexes: number[] } | null>(null);
  const hold = useRef<number | null>(null);
  const swallowClick = useRef(false);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);

  const cancelHold = () => {
    if (hold.current !== null) window.clearTimeout(hold.current);
    hold.current = null;
  };

  const start = (index: number, y: number, list: HTMLElement) => {
    const rows = [...list.querySelectorAll<HTMLElement>("[data-reorder]")];
    const indexes = rows.map((r) => Number(r.dataset.reorder));
    live.current = { from: index, over: index, startY: y, rows: rows.map((r) => r.getBoundingClientRect()), indexes };
    haptic("select");
    setDrag({ from: index, over: index, dy: 0 });
    const move = (e: globalThis.PointerEvent) => {
      const l = live.current;
      if (!l) return;
      // The row under the finger, by the middle of each row as it was when the drag began.
      let over = l.from;
      l.rows.forEach((r, i) => {
        const idx = l.indexes[i]!;
        if (idx < range.min || idx > range.max) return;
        const mid = r.top + r.height / 2;
        if (idx > l.from && e.clientY > mid) over = Math.max(over, idx);
        if (idx < l.from && e.clientY < mid) over = Math.min(over, idx);
      });
      if (over !== l.over) haptic("select");
      l.over = over;
      setDrag({ from: l.from, over, dy: e.clientY - l.startY });
    };
    const stopScroll = (e: TouchEvent) => e.preventDefault();
    const end = (e: globalThis.PointerEvent) => {
      const l = live.current;
      cleanup.current?.();
      if (l && l.over !== l.from) {
        haptic("tick");
        onMove(l.from, l.over);
        setPicked(null);
      } else if (l && Math.abs(e.clientY - l.startY) < SLOP * 2) {
        // Held without dragging: the row shows move up and down buttons instead (no dragging needed, WCAG 2.5.7).
        setPicked(l.from);
      }
      swallowClick.current = true;
      window.setTimeout(() => (swallowClick.current = false), 50);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("touchmove", stopScroll, { passive: false });
    cleanup.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("touchmove", stopScroll);
      live.current = null;
      cleanup.current = null;
      setDrag(null);
    };
  };

  /** Props for row `index`. `list` finds the list element the rows are in. */
  const row = (index: number) => {
    const movable = index >= range.min && index <= range.max && range.max > range.min;
    if (!movable) return { "data-reorder": index };
    return {
      "data-reorder": index,
      "aria-keyshortcuts": "Alt+ArrowUp Alt+ArrowDown",
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0 || (e.target as Element).closest("[data-no-drag]")) return;
        const list = e.currentTarget.parentElement;
        if (!list) return;
        const x0 = e.clientX;
        const y0 = e.clientY;
        cancelHold();
        hold.current = window.setTimeout(() => {
          hold.current = null;
          start(index, y0, list);
        }, HOLD_MS);
        const el = e.currentTarget;
        const early = (m: globalThis.PointerEvent) => {
          if (Math.abs(m.clientX - x0) > SLOP || Math.abs(m.clientY - y0) > SLOP) quit();
        };
        const quit = () => {
          cancelHold();
          el.removeEventListener("pointermove", early);
          window.removeEventListener("pointerup", quit);
          window.removeEventListener("pointercancel", quit);
        };
        el.addEventListener("pointermove", early);
        window.addEventListener("pointerup", quit);
        window.addEventListener("pointercancel", quit);
      },
      onClickCapture: (e: { preventDefault(): void; stopPropagation(): void }) => {
        if (!swallowClick.current) return;
        e.preventDefault();
        e.stopPropagation();
      },
      onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        const to = index + (e.key === "ArrowUp" ? -1 : 1);
        if (to < range.min || to > range.max) return;
        e.preventDefault();
        haptic("select");
        onMove(index, to);
      },
    };
  };

  /** Style for row `index` while a drag is on: the lifted row follows the finger, the drop spot gets a marker. */
  const style = (index: number): { className: string; css?: { transform: string; animation: string } } => {
    if (!drag) return { className: "" };
    if (index === drag.from)
      return {
        className: "relative z-20 scale-[1.02] bg-raised shadow-[var(--shadow)]",
        css: { transform: `translateY(${drag.dy}px)`, animation: "none" },
      };
    if (index === drag.over)
      return {
        className: drag.over > drag.from ? "shadow-[inset_0_-3px_0_var(--color-accent)]" : "shadow-[inset_0_3px_0_var(--color-accent)]",
      };
    return { className: "" };
  };

  /** Moves the picked row one place up or down, and keeps it picked. */
  const step = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < range.min || to > range.max) return;
    haptic("select");
    onMove(index, to);
    setPicked(to);
  };

  return { drag, row, style, picked, setPicked, step };
}

/** Move up, move down and done, for the picked row (the no-drag way to reorder). */
export function MoveButtons({
  name,
  canUp,
  canDown,
  onUp,
  onDown,
  onDone,
}: {
  name: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onDone: () => void;
}) {
  const cls = "press grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink disabled:opacity-40";
  return (
    <div className="flex shrink-0 items-center gap-1" data-no-drag role="group" aria-label={t("pol.move", { name })}>
      <button type="button" className={cls} disabled={!canUp} onClick={onUp} aria-label={t("pol.moveUp", { name })}>
        <Icon name="chevronUp" size={20} />
      </button>
      <button type="button" className={cls} disabled={!canDown} onClick={onDown} aria-label={t("pol.moveDown", { name })}>
        <Icon name="chevronDown" size={20} />
      </button>
      <button type="button" className={`${cls} text-accent`} onClick={onDone} aria-label={t("pol.moveDone")}>
        <Icon name="check" size={20} />
      </button>
    </div>
  );
}
