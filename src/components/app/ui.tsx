"use client";
import { Info } from "@/components/Info";
import type { Term } from "@/lib/glossary";
import { haptic } from "@/lib/juice";
import type { ReactNode } from "react";

export function Button({ children, onClick, kind = "primary", className = "", disabled, label }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "quiet" | "danger"; className?: string; disabled?: boolean; label?: string }) {
  const styles = {
    primary: "bg-accent text-accent-ink font-semibold",
    ghost: "bg-raised text-ink border border-line",
    quiet: "text-muted",
    danger: "bg-bad/15 text-bad border border-bad/30",
  }[kind];
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        haptic("tick");
        onClick?.();
      }}
      className={`press rounded-2xl px-5 py-3 disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic("tick");
        onClick?.();
      }}
      className={`press rounded-full border px-3.5 py-2 text-sm ${active ? "border-accent bg-accent/15 text-ink" : "border-line bg-surface text-muted"}`}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onDown, onUp, label, suffix }: { value: string; onDown: () => void; onUp: () => void; label: string; suffix?: string }) {
  const btn = "press grid h-14 w-14 place-items-center rounded-full bg-raised text-3xl text-ink border border-line";
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-6">
        <button type="button" className={btn} aria-label={`Less ${label}`} onClick={() => { haptic("tick"); onDown(); }}>−</button>
        <div className="min-w-[3.6ch] text-center">
          <div className="num text-[52px] font-bold leading-none tracking-tight">{value}</div>
        </div>
        <button type="button" className={btn} aria-label={`More ${label}`} onClick={() => { haptic("tick"); onUp(); }}>+</button>
      </div>
      <div className="mt-1.5 text-xs uppercase tracking-wider text-faint">{suffix ?? label}</div>
    </div>
  );
}

export function Section({ title, children, right, info }: { title: string; children: ReactNode; right?: ReactNode; info?: Term }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-end justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{title}{info && <Info term={info} />}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label={title} className="animate-rise safe-bottom max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Ring({ value, size = 220, stroke = 12, colour = "var(--color-accent)", children }: { value: number; size?: number; stroke?: number; colour?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colour} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} style={{ transition: "stroke-dashoffset 250ms linear" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
