"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { Info } from "@/components/Info";
import { SCREEN_TITLE, SECTION_LABEL, SHEET_TITLE } from "@/components/titles";
import { useBack } from "@/lib/back";
import type { Term } from "@/lib/glossary";
import { due, HAPTIC_GAP, HOLD_DELAY, MOVE_SLOP, repeatGap, repeatSize, SOUND_GAP } from "@/lib/holdRepeat";
import { parseNum, t } from "@/lib/i18n";
import { calm, haptic, sound } from "@/lib/juice";

import { Icon, type IconName } from "./icons";
import { Mascot, type Mood } from "./Mascot";

export function Button({
  children,
  onClick,
  kind = "primary",
  className = "",
  disabled,
  label,
  icon,
  submit,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "quiet" | "danger";
  className?: string;
  disabled?: boolean;
  label?: string;
  icon?: IconName;
  /** The form's submit button: Enter in a field presses it, and the form's onSubmit does the work (so leave onClick off). */
  submit?: boolean;
}) {
  const styles = {
    primary: "btn-primary font-semibold",
    ghost: "bg-raised text-ink border border-line hover:border-accent/40",
    quiet: "text-muted hover:text-ink",
    danger: "bg-bad/15 text-bad border border-bad/30",
  }[kind];
  return (
    <button
      type={submit ? "submit" : "button"}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        haptic("tick");
        onClick?.();
      }}
      className={`press inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 disabled:opacity-40 ${styles} ${className}`}
    >
      {icon && <Icon name={icon} size={20} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

/**
 * A pick chip. `hue` (a colour token) colour-codes it: a dot before it's picked, then its border,
 * fill and tick in that colour once picked (Today's "How do you feel?" chips).
 */
export function Chip({ children, active, onClick, hue }: { children: ReactNode; active?: boolean; onClick?: () => void; hue?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic("select");
        sound.tick();
        onClick?.();
      }}
      className={`press inline-flex items-center gap-1 rounded-full border px-3.5 py-2 text-sm ${active ? `font-medium text-ink ${hue ? "" : "border-accent/70 bg-accent/15 shadow-[0_0_0_3px_rgb(76_141_255/0.12)]"}` : "border-line bg-surface text-muted"}`}
      style={
        active && hue
          ? {
              borderColor: `color-mix(in srgb, ${hue} 75%, transparent)`,
              background: `color-mix(in srgb, ${hue} 22%, var(--color-surface))`,
              boxShadow: `0 0 0 3px color-mix(in srgb, ${hue} 14%, transparent)`,
            }
          : undefined
      }
    >
      {/* A tick as well as the colour, so the picked chip shows without relying on colour (WCAG 1.4.1). */}
      {active && (
        <span className={`-ml-1 inline-flex shrink-0 ${hue ? "" : "text-accent"}`} style={hue ? { color: hue } : undefined}>
          <Icon name="check" size={14} />
        </span>
      )}
      {!active && hue && <span aria-hidden className="-ml-0.5 mr-0.5 size-2 shrink-0 rounded-full" style={{ background: hue }} />}
      {children}
    </button>
  );
}

/**
 * What a bump does with one step: `size` is how many steps at once (1, then 2 and 5 on a long hold;
 * see `repeatSize`). Return `false` when nothing changed (a limit was reached): the hold stops and
 * there's no tick for a step that didn't happen.
 */
export type BumpStep = (dir: 1 | -1, size: 1 | 2 | 5) => boolean | void;

/**
 * Hold-to-repeat for a bump button, the one place every − / + gets it (timing in `holdRepeat.ts`). A
 * tap steps once on release; a press held still for a moment repeats, slow then faster, with the
 * haptic and tick thinned out at speed. A slide, a scroll (pointer cancel), leaving the button or
 * losing focus stops it cleanly. Enter or Space held from the keyboard repeats the same way; a
 * screen reader's click steps once.
 */
function useHoldRepeat(dir: 1 | -1, onStep: BumpStep) {
  // The latest handler, so each repeat steps from the value the last one set.
  const latest = useRef(onStep);
  useEffect(() => {
    latest.current = onStep;
  });
  const hold = useRef<{ timer: ReturnType<typeof setTimeout> | null; n: number; x: number; y: number; id: number } | null>(null);
  const fed = useRef<{ haptic: number | null; sound: number | null }>({ haptic: null, sound: null });

  /** One step with its feedback; false when the step changed nothing. */
  const step = (n: number) => {
    const size = repeatSize(Math.max(1, n));
    if (latest.current(dir, size) === false) return false;
    const now = Date.now();
    // A tap always ticks. While repeating, the tick and buzz are thinned out once it's fast, and a
    // change of step size gets its own tick so the lifter feels it.
    const gear = n > 1 && repeatSize(n) !== repeatSize(n - 1);
    if (n === 0 || gear || due(fed.current.haptic, now, HAPTIC_GAP)) {
      haptic(gear ? "tick" : "select");
      fed.current.haptic = now;
    }
    if (n === 0 || due(fed.current.sound, now, SOUND_GAP)) {
      sound.tick();
      fed.current.sound = now;
    }
    return true;
  };
  const stop = () => {
    if (hold.current?.timer) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  const begin = (x: number, y: number, id: number) => {
    stop();
    fed.current = { haptic: null, sound: null };
    const h = { timer: null as ReturnType<typeof setTimeout> | null, n: 0, x, y, id };
    const again = () => {
      h.n += 1;
      if (!step(h.n)) return stop();
      h.timer = setTimeout(again, repeatGap(h.n));
    };
    h.timer = setTimeout(again, HOLD_DELAY);
    hold.current = h;
  };
  /** Release: a press that never started repeating was a tap, so it steps once now. */
  const end = () => {
    const h = hold.current;
    stop();
    if (h && h.n === 0) step(0);
  };
  useEffect(() => stop, []);

  return {
    onPointerDown: (e: ReactPointerEvent) => {
      // The main button only, and one finger at a time.
      if (e.button !== 0 || (hold.current && hold.current.id !== e.pointerId)) return;
      begin(e.clientX, e.clientY, e.pointerId);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const h = hold.current;
      if (h && e.pointerId === h.id && Math.hypot(e.clientX - h.x, e.clientY - h.y) > MOVE_SLOP) stop();
    },
    onPointerUp: (e: ReactPointerEvent) => {
      if (hold.current?.id === e.pointerId) end();
    },
    // The page took the touch for a scroll, or the pointer left: no step, nothing left running.
    onPointerCancel: stop,
    onPointerLeave: stop,
    onBlur: stop,
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      // The hold handles it, so the browser's own click (and Enter's auto-repeat) doesn't step again.
      e.preventDefault();
      if (!e.repeat) begin(0, 0, -1);
    },
    onKeyUp: (e: ReactKeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (hold.current?.id === -1) end();
    },
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    // Pointer and key presses step above; a click with no press behind it (a screen reader, or
    // detail 0) steps once.
    onClick: (e: ReactMouseEvent) => {
      if (e.detail === 0 && !hold.current) step(0);
    },
  };
}

const BUMP_SIZE = { lg: "h-14 w-14", md: "h-12 w-12", sm: "h-11 w-11" } as const;

/**
 * The one − / + button: hold to repeat (`useHoldRepeat`). `label` names what it changes ("More
 * reps"), or `aria` gives the whole accessible name when the screen words it its own way.
 */
export function Bump({
  dir,
  label,
  aria,
  size,
  onStep,
}: {
  dir: 1 | -1;
  label?: string;
  aria?: string;
  size: keyof typeof BUMP_SIZE;
  onStep: BumpStep;
}) {
  const repeat = useHoldRepeat(dir, onStep);
  const icon = size === "sm" ? 16 : 22;
  return (
    <button
      type="button"
      // touch-manipulation lets a scroll that starts here still scroll (the hold then cancels);
      // no callout or selection on a long press.
      className={`press grid ${BUMP_SIZE[size]} shrink-0 touch-manipulation select-none place-items-center rounded-full border border-line bg-raised text-ink [-webkit-touch-callout:none] active:border-accent/60 active:bg-accent/15`}
      aria-label={aria ?? t(dir > 0 ? "workout.more" : "workout.less", { what: label ?? "" })}
      {...repeat}
    >
      {dir > 0 ? (
        <Icon name="plus" size={icon} strokeWidth={2.6} />
      ) : (
        <svg width={icon} height={icon} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
          <path d="M5 12h14" />
        </svg>
      )}
    </button>
  );
}

/**
 * A big number with − and + bump buttons (hold to repeat). `compact` is the one-handed dock's size;
 * `display` shows the number only, when the dock holds the buttons.
 */
export function Stepper({
  value,
  onDown,
  onUp,
  label,
  suffix,
  compact,
  display,
}: {
  value: string;
  onDown: () => void;
  onUp: () => void;
  label: string;
  suffix?: string;
  compact?: boolean;
  display?: boolean;
}) {
  // The number lifts for a moment when it changes.
  const [key, setKey] = useState(0);
  // The workout's own bumps already move by a plate or a rep, so a long hold speeds up but each
  // step stays one step.
  const step = (d: 1 | -1) => {
    setKey((k) => k + 1);
    if (d > 0) onUp();
    else onDown();
  };
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-1.5">
        <Bump dir={-1} label={label} size="md" onStep={step} />
        <div className="min-w-0 text-center leading-none">
          <div key={key} className={`display text-[1.75rem] ${key ? "animate-nudge" : ""}`}>
            {value}
          </div>
          <div className="mt-1 truncate text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">{suffix ?? label}</div>
        </div>
        <Bump dir={1} label={label} size="md" onStep={step} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-6">
        {!display && <Bump dir={-1} label={label} size="lg" onStep={step} />}
        <div className="min-w-[3.6ch] text-center">
          <div key={key} className={`display text-[3.5rem] ${key ? "animate-nudge" : ""}`}>
            {value}
          </div>
        </div>
        {!display && <Bump dir={1} label={label} size="lg" onStep={step} />}
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{suffix ?? label}</div>
    </div>
  );
}

/**
 * The top of a screen: an optional "‹ Back" link, an optional small kicker line, and the title, in the one
 * shared style (SCREEN_TITLE). Every screen's h1 goes through here, so titles line up the same everywhere.
 */
export function ScreenHeader({
  title,
  back,
  kicker,
  info,
  className = "",
}: {
  title: ReactNode;
  back?: { label: string; onClick: () => void };
  kicker?: ReactNode;
  info?: Term;
  className?: string;
}) {
  return (
    <header className={className}>
      {back ? (
        <button type="button" onClick={back.onClick} className="press -ml-2 min-h-11 px-2 text-muted">
          {back.label}
        </button>
      ) : (
        <div className="h-3" />
      )}
      {kicker && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{kicker}</p>}
      <h1 className={`flex items-center gap-1 ${SCREEN_TITLE}`}>
        {title}
        {info && <Info term={info} />}
      </h1>
    </header>
  );
}

export function Section({
  title,
  children,
  right,
  icon,
  info,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  icon?: IconName;
  info?: Term;
}) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-x-2 px-1">
        <h2 className={`flex items-center gap-1.5 ${SECTION_LABEL}`}>
          {icon && <Icon name={icon} size={14} className="text-accent" />}
          {title}
          {info && <Info term={info} />}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <SheetBody onClose={onClose} title={title}>
      {children}
    </SheetBody>
  );
}

/** How far (px) a sheet must be pulled down to close, or how fast (px/ms) a flick of at least `flick` px must be. */
const SWIPE_CLOSE = { distance: 96, speed: 0.6, flick: 40 };
/** Drags that start on these belong to the control under the finger (a 3D figure, a slider), not the sheet. */
const NO_SWIPE = "canvas, input[type=range], [data-no-swipe]";

/**
 * The open sheet: a modal dialog rendered on <body>, so a screen's own stacking (its rise animation)
 * can't put it under the tab bar. Focus moves into it when it opens and back to where it was when it
 * closes; Escape closes it, and Tab stays inside it (keyboard and switch access, WCAG 2.1.2, 2.4.3).
 * It closes four ways, so it's always clear how to get out (Melvin, 2026-11-09): the ✕ button in its
 * header, swiping it down (from the handle, or anywhere while it's scrolled to the top), tapping
 * outside, and Escape.
 */
function SheetBody({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  // The phone's back button closes the sheet before it leaves the screen (back.ts).
  useBack(true, () => closeRef.current());
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab" || !box.current) return;
      const f = [
        ...box.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (before?.isConnected) before.focus();
    };
  }, []);

  // Swipe down to close. Native touch listeners, because touchmove must be non-passive to stop the page
  // scrolling while the sheet follows the finger. A drag only starts downward, at the top of the sheet's
  // scroll, and not on a control that drags itself.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let start: { x: number; y: number; t: number } | null = null;
    let dragging = false;
    let dy = 0;
    const backdrop = el.parentElement;
    const set = (y: number, animate: boolean) => {
      // The rise-in animation fills "both", and a filling animation beats an inline transform, so the sheet
      // stayed put under the finger on phones. Drop it once the lifter drags; it has done its job by then.
      el.style.animation = "none";
      el.style.transition = animate ? "transform 220ms var(--ease-out-expo, ease-out)" : "none";
      el.style.transform = y ? `translateY(${y}px)` : "";
      // The dimmed backdrop lightens as the sheet goes down, so it reads as one thing leaving.
      if (backdrop) {
        backdrop.style.animation = "none";
        backdrop.style.transition = animate ? "opacity 220ms var(--ease-out-expo, ease-out)" : "none";
        backdrop.style.opacity = y ? String(Math.max(0.2, 1 - y / (el.offsetHeight || window.innerHeight))) : "";
      }
    };
    const down = (e: TouchEvent) => {
      const target = e.target as Element | null;
      const onHandle = !!target?.closest("[data-sheet-handle]");
      if (e.touches.length !== 1 || (!onHandle && (el.scrollTop > 0 || target?.closest(NO_SWIPE)))) {
        start = null;
        return;
      }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp || Date.now() };
      dragging = false;
      dy = 0;
    };
    const move = (e: TouchEvent) => {
      if (!start) return;
      const x = e.touches[0].clientX - start.x;
      const y = e.touches[0].clientY - start.y;
      if (!dragging) {
        if (Math.abs(y) < 8 && Math.abs(x) < 8) return;
        if (y <= 0 || Math.abs(x) > Math.abs(y)) {
          start = null;
          return;
        } // a scroll up or a sideways drag: leave it alone
        dragging = true;
      }
      if (e.cancelable) e.preventDefault();
      dy = Math.max(0, y);
      set(dy, false);
    };
    const up = (e: TouchEvent) => {
      if (!start || !dragging) {
        start = null;
        return;
      }
      const ms = Math.max(1, (e.timeStamp || Date.now()) - start.t);
      start = null;
      dragging = false;
      if (dy >= SWIPE_CLOSE.distance || (dy >= SWIPE_CLOSE.flick && dy / ms >= SWIPE_CLOSE.speed)) {
        set(el.offsetHeight || window.innerHeight, true);
        haptic("select");
        window.setTimeout(() => closeRef.current(), calm() ? 0 : 160);
      } else set(0, true);
    };
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", up);
    el.addEventListener("touchcancel", up);
    return () => {
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", up);
      el.removeEventListener("touchcancel", up);
    };
  }, []);

  return createPortal(
    // Tapping outside closes it too: a pointer convenience, since Escape and the sheet's own buttons cover the keyboard.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        data-testid="sheet"
        className="animate-rise safe-bottom max-h-[85dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border-t border-line bg-surface px-5 pb-5 pt-2 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          data-sheet-handle
          className="-mx-5 flex cursor-grab justify-center pb-2 pt-1"
          style={{ touchAction: "none" }}
          aria-hidden="true"
        >
          <div className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        <div className="mb-3 flex items-start gap-2">
          <h2 id={`${id}-t`} className={`min-w-0 flex-1 pt-2 ${SHEET_TITLE}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              haptic("tick");
              onClose();
            }}
            aria-label={t("map.close")}
            data-testid="sheet-close"
            className="press -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-raised text-muted"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A progress ring with a gradient stroke. `from`/`to` pick the gradient (defaults: brand blue to violet). */
export function Ring({
  value,
  size = 220,
  stroke = 12,
  colour,
  from = "var(--grad-a)",
  to = "var(--grad-c)",
  track = "var(--color-line)",
  glow = true,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  colour?: string;
  from?: string;
  to?: string;
  track?: string;
  glow?: boolean;
  children?: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: colour ?? from }} />
            <stop offset="1" style={{ stopColor: colour ?? to }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: track }} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{
            transition: "stroke-dashoffset 250ms linear",
            filter: glow ? `drop-shadow(0 0 ${stroke / 2}px color-mix(in srgb, ${colour ?? from} 40%, transparent))` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** A friendly empty state: an icon in a soft tinted disc, a title, a line of help and an optional action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  tint = "var(--color-accent)",
  mascot,
}: {
  icon: IconName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tint?: string;
  mascot?: Mood;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {mascot ? (
        <Mascot mood={mascot} size={88} className="animate-spring-in" />
      ) : (
        <div
          className="animate-spring-in grid h-14 w-14 place-items-center rounded-2xl"
          style={{
            background: `color-mix(in srgb, ${tint} 16%, transparent)`,
            color: tint,
            boxShadow: `0 0 0 1px color-mix(in srgb, ${tint} 30%, transparent), 0 10px 30px -12px ${tint}`,
          }}
        >
          <Icon name={icon} size={26} />
        </div>
      )}
      <p className="mt-3 font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-[30ch] text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A small icon in a tinted rounded square: the leading mark on list rows and stat tiles. */
export function Badge({ icon, tint = "var(--color-accent)", size = 36 }: { icon: IconName; tint?: string; size?: number }) {
  const style: CSSProperties = { width: size, height: size, background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint };
  return (
    <span className="grid shrink-0 place-items-center rounded-xl" style={style}>
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

/** A metric tile: label, big number, optional icon and hue. */
export function StatTile({
  label,
  value,
  icon,
  tint = "var(--color-accent)",
  className = "",
  info,
}: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  tint?: string;
  className?: string;
  info?: Term;
}) {
  return (
    <div className={`card-tint p-4 ${className}`} style={{ "--tint": tint } as CSSProperties}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
          {info && <Info term={info} />}
        </div>
        {icon && (
          <span style={{ color: tint }}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="display mt-2 text-[1.75rem]">{value}</div>
    </div>
  );
}

/** The chain button between two exercises that pairs them as a superset, or splits them. */
export function LinkToggle({
  on,
  first,
  second,
  onToggle,
  className = "",
}: {
  on: boolean;
  first: string;
  second: string;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      data-no-drag
      type="button"
      onClick={() => {
        haptic("select");
        sound.tick();
        onToggle();
      }}
      aria-pressed={on}
      aria-label={t(on ? "fmt.unlink" : "fmt.link", { second, first })}
      className={`press grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${on ? "border-accent bg-accent text-bg" : "border-line bg-surface text-muted hover:text-ink"} ${className}`}
    >
      <Icon name="link" size={18} />
    </button>
  );
}

/**
 * An on/off switch (juice pass, 2026-11-09). The knob springs across with a little overshoot and
 * stretches while pressed; turning it gives a medium haptic and a soft two-note sound. Preferred over
 * On/Off chips: one tap, one thumb, no reading.
 */
export function Switch({
  on,
  onChange,
  label,
  labelledBy,
  describedBy,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => {
        onChange(!on);
        haptic("toggle");
        sound.toggle(!on);
      }}
      className={`group relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 ${on ? "border-transparent" : "border-line bg-raised"}`}
      style={on ? { background: "linear-gradient(135deg, var(--grad-a), var(--grad-c))" } : undefined}
    >
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35)] transition-[transform,width] duration-[460ms] ease-[var(--ease-bounce)] group-active:w-7"
        style={{ transform: on ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}

/** A settings row: a label, an optional line of help and a switch on the right. */
export function SwitchRow({
  label,
  hint,
  on,
  onChange,
  info,
}: {
  label: string;
  hint?: ReactNode;
  on: boolean;
  onChange: (v: boolean) => void;
  info?: Term;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="card mt-3 flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-l`} className="flex items-center gap-1.5 font-medium">
          {label}
          {info && <Info term={info} />}
        </p>
        {hint && (
          <p id={`${id}-d`} className="mt-0.5 text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
      <Switch on={on} onChange={onChange} labelledBy={`${id}-l`} describedBy={hint ? `${id}-d` : undefined} />
    </div>
  );
}

/** A placeholder line or block that shimmers while content loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden />;
}

/** The app's loading screen, shaped like Today so the real screen lands where the eye already is. */
export function TodaySkeleton() {
  return (
    <div className="aurora safe-top mx-auto max-w-lg px-5" role="status" aria-label={t("nav.loading")}>
      <div className="flex items-center justify-between pt-3">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-3 h-8 w-56" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-20 w-full rounded-[20px]" />
      <div className="card mt-4 flex items-center gap-4 p-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <Skeleton className="mt-7 h-3 w-28" />
      <div className="card mt-3 divide-y divide-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A number with − and + bump buttons either side (hold to repeat), for anything a lifter would
 * otherwise type: body weight, age, bar weight, known lifts. Typing still works as a fallback.
 * `value` is the text in the box; an empty box bumps from `start`.
 */
export function BumpField({
  value,
  onChange,
  step,
  start,
  min = 0,
  max = 9999,
  label,
  id,
  placeholder,
  size = "md",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  step: number;
  start: number;
  min?: number;
  max?: number;
  label: string;
  id?: string;
  placeholder?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  const bump: BumpStep = (d, size) => {
    const n = parseNum(value);
    const empty = value.trim() === "" || !Number.isFinite(n);
    const from = empty ? start : n;
    // Snap to the step, so 81.3 bumped by 0.5 goes to 81.5, not 81.8. A long hold moves several steps.
    const next = Math.round((from + d * step * size) / step) * step;
    const out = String(Number(Math.min(max, Math.max(min, empty ? start : next)).toFixed(decimals)));
    // At the end of the range: nothing to do, so the hold stops.
    if (!empty && Number(out) === n) return false;
    onChange(out);
    return true;
  };
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Bump dir={-1} label={label} size="md" onStep={bump} />
      <input
        id={id}
        inputMode={decimals ? "decimal" : "numeric"}
        value={value}
        placeholder={placeholder}
        // A comma decimal (82,5 on a Spanish or French keyboard) is kept as a point.
        onChange={(e) => onChange(e.target.value.replace(",", ".").replace(decimals ? /[^\d.]/g : /\D/g, ""))}
        aria-label={id ? undefined : label}
        className={`num min-w-0 flex-1 rounded-2xl border border-line bg-surface px-2 text-center font-semibold ${size === "lg" ? "py-3 text-2xl" : "min-h-12 text-lg"}`}
      />
      <Bump dir={1} label={label} size="md" onStep={bump} />
    </div>
  );
}

/**
 * The small "Pro" tag on an entry point a free lifter can see but not use yet (AGENTS.md "Money": Pro
 * features are shown, never hidden). The control it sits on opens the paywall at that feature.
 */
export function ProTag({ className = "" }: { className?: string }) {
  return (
    <span className={`rounded-full bg-warn/15 px-1.5 py-0.5 text-xs font-semibold leading-none text-warn ${className}`}>
      {t("prog.pro")}
    </span>
  );
}
