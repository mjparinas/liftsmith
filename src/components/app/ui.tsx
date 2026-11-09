"use client";
import { Info } from "@/components/Info";
import type { Term } from "@/lib/glossary";
import { haptic, sound } from "@/lib/juice";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

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
  return (
    <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-label={title} className="animate-rise safe-bottom max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
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
export function EmptyState({ icon, title, body, action, tint = "var(--color-accent)" }: { icon: IconName; title: string; body?: ReactNode; action?: ReactNode; tint?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint, boxShadow: `0 0 0 1px color-mix(in srgb, ${tint} 30%, transparent), 0 10px 30px -12px ${tint}` }}>
        <Icon name={icon} size={26} />
      </div>
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
