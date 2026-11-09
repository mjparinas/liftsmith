"use client";
import { Info } from "@/components/Info";
import type { Term } from "@/lib/glossary";
import { haptic, sound } from "@/lib/juice";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { Mascot, type Mood } from "./Mascot";

export function Button({ children, onClick, kind = "primary", className = "", disabled, label, icon }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "quiet" | "danger"; className?: string; disabled?: boolean; label?: string; icon?: IconName }) {
  const styles = {
    primary: "btn-primary font-semibold",
    ghost: "bg-raised text-ink border border-line hover:border-accent/40",
    quiet: "text-muted hover:text-ink",
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
      className={`press inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 disabled:opacity-40 ${styles} ${className}`}
    >
      {icon && <Icon name={icon} size={20} strokeWidth={2.4} />}
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
        haptic("select");
        sound.tick();
        onClick?.();
      }}
      className={`press rounded-full border px-3.5 py-2 text-sm ${active ? "border-accent/70 bg-accent/15 font-medium text-ink shadow-[0_0_0_3px_rgb(76_141_255/0.12)]" : "border-line bg-surface text-muted"}`}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onDown, onUp, label, suffix }: { value: string; onDown: () => void; onUp: () => void; label: string; suffix?: string }) {
  // The number lifts for a moment when it changes.
  const [key, setKey] = useState(0);
  const step = (d: 1 | -1) => {
    haptic("select");
    sound.tick();
    setKey((k) => k + 1);
    if (d > 0) onUp();
    else onDown();
  };
  const btn = "press grid h-14 w-14 place-items-center rounded-full border border-line bg-raised text-ink active:border-accent/60 active:bg-accent/15";
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-6">
        <button type="button" className={btn} aria-label={`Less ${label}`} onClick={() => step(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden><path d="M5 12h14" /></svg>
        </button>
        <div className="min-w-[3.6ch] text-center">
          <div key={key} className={`display text-[56px] ${key ? "animate-nudge" : ""}`}>{value}</div>
        </div>
        <button type="button" className={btn} aria-label={`More ${label}`} onClick={() => step(1)}>
          <Icon name="plus" size={22} strokeWidth={2.6} />
        </button>
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{suffix ?? label}</div>
    </div>
  );
}

export function Section({ title, children, right, icon, info }: { title: string; children: ReactNode; right?: ReactNode; icon?: IconName; info?: Term }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-end justify-between px-1">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
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
  // Rendered on <body>, so a screen's own stacking (its rise animation) can't put it under the tab bar.
  return createPortal(
    <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-label={title} className="animate-rise safe-bottom max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A progress ring with a gradient stroke. `from`/`to` pick the gradient (defaults: brand blue to violet). */
export function Ring({ value, size = 220, stroke = 12, colour, from = "var(--grad-a)", to = "var(--grad-c)", track = "var(--color-line)", glow = true, children }: { value: number; size?: number; stroke?: number; colour?: string; from?: string; to?: string; track?: string; glow?: boolean; children?: ReactNode }) {
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
          style={{ transition: "stroke-dashoffset 250ms linear", filter: glow ? `drop-shadow(0 0 ${stroke / 2}px color-mix(in srgb, ${colour ?? from} 40%, transparent))` : undefined }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** A friendly empty state: an icon in a soft tinted disc, a title, a line of help and an optional action. */
export function EmptyState({ icon, title, body, action, tint = "var(--color-accent)", mascot }: { icon: IconName; title: string; body?: ReactNode; action?: ReactNode; tint?: string; mascot?: Mood }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {mascot ? (
        <Mascot mood={mascot} size={88} className="animate-spring-in" />
      ) : (
        <div className="animate-spring-in grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint, boxShadow: `0 0 0 1px color-mix(in srgb, ${tint} 30%, transparent), 0 10px 30px -12px ${tint}` }}>
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
export function StatTile({ label, value, icon, tint = "var(--color-accent)", className = "", info }: { label: string; value: ReactNode; icon?: IconName; tint?: string; className?: string; info?: Term }) {
  return (
    <div className={`card-tint p-4 ${className}`} style={{ "--tint": tint } as CSSProperties}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}{info && <Info term={info} />}</div>
        {icon && <span style={{ color: tint }}><Icon name={icon} size={16} /></span>}
      </div>
      <div className="display mt-2 text-[28px]">{value}</div>
    </div>
  );
}

/** The chain button between two exercises that pairs them as a superset, or splits them. */
export function LinkToggle({ on, first, second, onToggle }: { on: boolean; first: string; second: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("select");
        sound.tick();
        onToggle();
      }}
      aria-pressed={on}
      aria-label={on ? `Split ${second} from ${first}` : `Superset ${second} with ${first}`}
      className={`press grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${on ? "border-accent/50 bg-accent/15 text-accent" : "border-line text-faint hover:text-ink"}`}
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
export function Switch({ on, onChange, label, labelledBy, describedBy }: { on: boolean; onChange: (v: boolean) => void; label?: string; labelledBy?: string; describedBy?: string }) {
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
export function SwitchRow({ label, hint, on, onChange, info }: { label: string; hint?: ReactNode; on: boolean; onChange: (v: boolean) => void; info?: Term }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="card mt-3 flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-l`} className="flex items-center gap-1.5 font-medium">{label}{info && <Info term={info} />}</p>
        {hint && <p id={`${id}-d`} className="mt-0.5 text-xs text-muted">{hint}</p>}
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
    <div className="aurora safe-top mx-auto max-w-lg px-5" role="status" aria-label="Loading">
      <div className="flex items-center justify-between pt-3">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2"><Skeleton className="h-8 w-14 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /></div>
      </div>
      <Skeleton className="mt-3 h-8 w-56" />
      <div className="mt-4 flex gap-2"><Skeleton className="h-9 w-24 rounded-full" /><Skeleton className="h-9 w-20 rounded-full" /></div>
      <Skeleton className="mt-4 h-20 w-full rounded-[20px]" />
      <div className="card mt-4 flex items-center gap-4 p-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-40" /></div>
      </div>
      <Skeleton className="mt-7 h-3 w-28" />
      <div className="card mt-3 divide-y divide-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
