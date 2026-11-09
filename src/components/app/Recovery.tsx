"use client";
import { useNow } from "@/lib/useNow";
import { BodyMap } from "@/components/BodyMap";
import { blockWeek, weekStart } from "@/lib/block";
import { weeklySets } from "@/lib/generator";
import { bandOf, recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { Section } from "./ui";

export function Recovery() {
  const { events, profile } = useApp();
  const now = useNow();
  const rec = recovery(events, now);
  const wk = blockWeek(profile, now);
  const done = weeklySets(events, weekStart(profile, now));
  const list = [...MUSCLES].sort((a, b) => rec[a] - rec[b]);
  return (
    <div className="pb-24">
      <h1 className="pt-3 text-[28px] font-extrabold tracking-tight">Recovery</h1>
      <p className="mt-1 text-muted">Colours show how recovered each muscle is from your recent sets.</p>
      <div className="card mt-4 p-4">
        <BodyMap rec={rec} />
      </div>
      <Section title={`Muscles · this week vs ${wk.setsPerMuscle}-set goal`} icon="target">
        <ul className="card divide-y divide-line/70 overflow-hidden">
          {list.map((m) => {
            const b = bandOf(rec[m]);
            const pct = Math.min(100, (done[m] / wk.setsPerMuscle) * 100);
            return (
              <li key={m} className="flex items-center gap-3 px-4 py-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.colour, boxShadow: `0 0 8px ${b.colour}88` }} title={b.label} />
                <span className="w-28 shrink-0 font-medium">{MUSCLE_LABEL[m]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised" title={`${done[m]} of ${wk.setsPerMuscle} sets this week`}>
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-mint" : "bg-gradient-to-r from-accent to-accent-2"}`} style={{ width: `${pct}%`, transition: "width 600ms var(--ease-out-expo)" }} />
                </div>
                <span className="num w-20 shrink-0 text-right text-sm text-muted">{rec[m]}% · {Math.round(done[m])}/{wk.setsPerMuscle}</span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
