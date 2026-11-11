"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { clockTime, currentTag, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { angleOf, formatTime, hourAt, minuteAt, parseTime, slotOf, slotPoint, uses12h } from "@/lib/timeDial";

import { Button, Sheet } from "./ui";

/** Where the numbers sit, as a fraction of the face's radius: the outer ring, and the 24-hour face's inner ring. */
const OUTER = 0.8;
const INNER = 0.52;
/** A touch closer to the centre than this (fraction of the radius) is on the inner ring. */
const INNER_EDGE = 0.66;
const SLOTS = Array.from({ length: 12 }, (_, i) => i);

/** "AM" and "PM" (or "a.m.", "午前") in the current language, from Intl. */
function dayPeriods(): [string, string] {
  const f = new Intl.DateTimeFormat(currentTag(), { hour: "numeric", hour12: true });
  const part = (h: number) => f.formatToParts(new Date(2000, 0, 1, h)).find((p) => p.type === "dayPeriod")?.value ?? (h < 12 ? "AM" : "PM");
  return [part(9), part(21)];
}

/**
 * A time setting that opens a clock dial instead of the browser's own time box (Melvin, 2026-11-11: "make
 * it a popup like on android and let you set the hour and minutes on a click dial"). The row's one button
 * shows the time and opens a sheet: tap or drag round the face for the hour, and it moves on to the
 * minutes (in fives); the big readout switches between them, and AM / PM sit beside it where the region
 * uses them. Set time saves; ✕, a swipe down, Escape or back leave it as it was. Pure web code, so
 * Android, iOS and the web get the same dial.
 */
export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [h, m] = parseTime(value);
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <button
        type="button"
        className="press num min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-ink hover:border-accent/40"
        aria-label={`${label}: ${clockTime(h, m)}`}
        onClick={() => {
          haptic("tick");
          sound.pop();
          setOpen(true);
        }}
      >
        {clockTime(h, m)}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <DialBody
          start={[h, m]}
          onSet={(nh, nm) => {
            onChange(formatTime(nh, nm));
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function DialBody({ start, onSet }: { start: [number, number]; onSet: (h: number, m: number) => void }) {
  const [hour, setHour] = useState(start[0]);
  const [minute, setMinute] = useState(start[1]);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const twelve = uses12h();
  const pm = hour >= 12;
  const [am, pmLabel] = dayPeriods();
  const face = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const feel = () => {
    haptic("select");
    sound.tick();
  };
  const pickHour = (v: number) => {
    if (v !== hour) feel();
    setHour(v);
  };
  const pickMinute = (v: number) => {
    if (v !== minute) feel();
    setMinute(v);
  };

  /** A touch on the face picks the number nearest it; dragging keeps picking. */
  const pick = (e: ReactPointerEvent) => {
    const r = face.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const slot = slotOf(angleOf(dx, dy));
    if (mode === "minute") return pickMinute(minuteAt(slot));
    const inner = !twelve && Math.hypot(dx, dy) < (r.width / 2) * INNER_EDGE;
    pickHour(hourAt(slot, twelve, pm, inner));
  };

  // The hand points at the picked number; a minute that isn't a five (set elsewhere) still points true.
  const handAngle = mode === "hour" ? ((hour % 12) * Math.PI) / 6 : (minute * Math.PI) / 30;
  const handR = mode === "hour" && !twelve && hour >= 12 ? INNER : OUTER;
  const tip = { x: Math.sin(handAngle) * handR * 50, y: -Math.cos(handAngle) * handR * 50 };

  const hourLabel = (slot: number, inner: boolean) =>
    twelve ? String(slot || 12) : inner ? String(slot + 12) : slot ? String(slot) : "00";
  const shownHour = twelve ? String(hour % 12 || 12) : String(hour).padStart(2, "0");

  const ring = (inner: boolean) =>
    SLOTS.map((slot) => {
      const v = mode === "minute" ? minuteAt(slot) : hourAt(slot, twelve, pm, inner);
      const picked = mode === "minute" ? v === minute : v === hour;
      const p = slotPoint(slot, (inner ? INNER : OUTER) * 50);
      const text = mode === "minute" ? String(v).padStart(2, "0") : hourLabel(slot, inner);
      return (
        <button
          key={`${inner ? "i" : "o"}${slot}`}
          type="button"
          // Pointer touches are handled by the face (so a drag works); this is for keyboards and screen readers.
          onClick={(e) => {
            if (e.detail !== 0) return;
            if (mode === "minute") pickMinute(v);
            else {
              pickHour(v);
              setMode("minute");
            }
          }}
          aria-pressed={picked}
          aria-label={mode === "minute" ? t("cal.minuteN", { n: v }) : clockTime(v, 0)}
          className={`absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-semibold tabular-nums ${inner ? "w-[13%] text-xs" : "w-[15%] text-sm"} ${picked ? "text-[var(--btn-ink)]" : inner ? "text-muted" : "text-ink"}`}
          style={{ left: `${50 + p.x}%`, top: `${50 + p.y}%` }}
        >
          {text}
        </button>
      );
    });

  return (
    <div className="flex flex-col items-center gap-5 pb-2">
      <div className="flex items-center gap-3">
        <div className="display flex items-center text-5xl">
          <button
            type="button"
            aria-pressed={mode === "hour"}
            aria-label={`${t("cal.hour")}: ${shownHour}`}
            onClick={() => setMode("hour")}
            className={`press rounded-xl px-2 py-1 ${mode === "hour" ? "bg-accent/15 text-accent" : "text-ink"}`}
          >
            {shownHour}
          </button>
          <span className="text-muted" aria-hidden>
            :
          </span>
          <button
            type="button"
            aria-pressed={mode === "minute"}
            aria-label={`${t("cal.minutes")}: ${String(minute).padStart(2, "0")}`}
            onClick={() => setMode("minute")}
            className={`press rounded-xl px-2 py-1 ${mode === "minute" ? "bg-accent/15 text-accent" : "text-ink"}`}
          >
            {String(minute).padStart(2, "0")}
          </button>
        </div>
        {twelve && (
          <div className="flex flex-col gap-1" role="group" aria-label={`${am} / ${pmLabel}`}>
            {[am, pmLabel].map((label, i) => {
              const on = pm === (i === 1);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickHour((hour % 12) + (i === 1 ? 12 : 0))}
                  className={`press min-h-9 rounded-lg border px-3 text-sm font-semibold ${on ? "border-accent/70 bg-accent/15 text-ink" : "border-line text-muted"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={face}
        data-no-swipe
        role="group"
        aria-label={t(mode === "hour" ? "cal.hour" : "cal.minutes")}
        className="relative aspect-square w-full max-w-[17rem] touch-none select-none rounded-full bg-raised"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (dragging.current) pick(e);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          if (mode === "hour") setMode("minute");
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <svg viewBox="-50 -50 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <circle r="1.6" fill="var(--color-accent)" />
          <line x1="0" y1="0" x2={tip.x} y2={tip.y} stroke="var(--color-accent)" strokeWidth="0.8" />
          <circle cx={tip.x} cy={tip.y} r="7" fill="var(--color-accent)" />
        </svg>
        {ring(false)}
        {mode === "hour" && !twelve && ring(true)}
      </div>

      <Button className="w-full" onClick={() => onSet(hour, minute)}>
        {t("cal.setTime")}
      </Button>
    </div>
  );
}
