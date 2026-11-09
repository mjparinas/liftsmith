"use client";
import { insights, type Insight } from "@/lib/insights";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { dayKey } from "@/lib/random";
import { useApp } from "@/lib/store";
import { togglePriority } from "@/lib/training";
import { useNow } from "@/lib/useNow";
import { useMemo, useState, type CSSProperties } from "react";
import { useGame } from "./Achievements";
import { Icon } from "./icons";
import { go, type Route } from "./router";
import { Section } from "./ui";

// Coach's notes: the proactive insights from insights.ts, each with what we saw, what to do and a
// one-tap action. "Got it" hides a note on this device until the finding changes (its id changes).

const KEY = "liftsmith.insights.dismissed";
const TONE = {
  warn: { hue: "var(--color-warn)", icon: "flag" },
  info: { hue: "var(--color-accent)", icon: "info" },
  good: { hue: "var(--color-mint)", icon: "sparkle" },
} as const;

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useInsights(): Insight[] {
  const { events, profile } = useApp();
  const now = useNow(60_000);
  const g = useGame();
  const hour = Math.floor(now / 3_600_000);
  // Recomputed when the log changes or once an hour, not every tick.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => insights({ events, profile, now, streak: g.streak }), [events, profile, hour, g.streak.needed, g.streak.atRisk, g.streak.weeks]);
}

export function CoachNotes({ limit, title: given }: { limit?: number; title?: string }) {
  const title = given ?? t("notes.title");
  const all = useInsights();
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const shown = all.filter((i) => !dismissed.includes(i.id)).slice(0, limit);
  if (!shown.length) return null;
  const dismiss = (id: string) => {
    haptic("tick");
    const next = [...dismissed, id].slice(-100);
    setDismissed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };
  return (
    <Section title={title} icon="sparkle">
      <ul className="space-y-2.5" aria-label={title}>
        {shown.map((i) => (
          <InsightCard key={i.id} insight={i} onDismiss={() => dismiss(i.id)} />
        ))}
      </ul>
    </Section>
  );
}

function InsightCard({ insight: i, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const { setProfile, startDeload, fixPlateau, profile } = useApp();
  const [done, setDone] = useState(false);
  const tone = TONE[i.tone];
  const act = () => {
    const a = i.action;
    if (!a) return;
    haptic("tap");
    if (a.kind === "deload") startDeload();
    else if (a.kind === "priority") setProfile({ training: togglePriority(profile.training, a.muscle) });
    else if (a.kind === "plateau") fixPlateau(a.plateau, a.fix);
    else if (a.kind === "minutes") setProfile({ minutes: a.minutes, minutesDay: dayKey(Date.now()) });
    else if (a.kind === "go") return go(a.route as Route);
    setDone(true);
  };
  return (
    <li className="card-tint p-4" style={{ "--tint": tone.hue } as CSSProperties}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" style={{ color: tone.hue }} aria-hidden>
          <Icon name={tone.icon} size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{i.title}</h3>
          <p className="mt-1 text-sm text-muted">{i.why}</p>
          <p className="mt-1 text-sm text-ink/90">{i.advice}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {i.action && !done && (
              <button type="button" onClick={act} className="press min-h-11 rounded-xl px-3.5 text-sm font-semibold" style={{ background: `color-mix(in srgb, ${tone.hue} 20%, var(--color-surface))`, color: "var(--color-ink)" }}>
                {i.action.label}
              </button>
            )}
            {done && <span className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-mint"><Icon name="check" size={16} strokeWidth={2.6} />{t("notes.done")}</span>}
            <button type="button" onClick={onDismiss} className="press min-h-11 rounded-xl px-3 text-sm font-medium text-muted hover:text-ink">{t("coach.gotIt")}</button>
          </div>
        </div>
      </div>
    </li>
  );
}
