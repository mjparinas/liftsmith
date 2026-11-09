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
      <h1 className="pt-2 text-2xl font-bold">Recovery</h1>
      <p className="mt-1 text-muted">Colours show how recovered each muscle is from your recent sets.</p>
      <div className="card mt-4 p-4">
        <BodyMap rec={rec} />
      </div>
      <Section title={`Muscles · this week vs ${wk.setsPerMuscle}-set goal`}>
        <ul className="card divide-y divide-line">
          {list.map((m) => {
            const b = bandOf(rec[m]);
            const pct = Math.min(100, (done[m] / wk.setsPerMuscle) * 100);
            return (
              <li key={m} className="flex items-center gap-3 px-4 py-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.colour }} />
                <span className="w-28 shrink-0">{MUSCLE_LABEL[m]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised" title={`${done[m]} of ${wk.setsPerMuscle} sets this week`}>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
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
