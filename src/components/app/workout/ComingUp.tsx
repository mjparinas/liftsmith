"use client";

import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { linkedToNext, supersetLabel } from "@/lib/superset";

import { loadText, repsText } from "../format";
import { muscleHue } from "../theme";
import { LinkToggle } from "../ui";

/** "Coming up" on the workout screen: the exercises after this one (tap to jump), with the superset links between them. */
export function ComingUp() {
  const s = useApp();
  const { active, profile } = s;
  if (!active) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t("workout.comingUp")}</h2>
      <ol className="card divide-y divide-line/70 overflow-hidden">
        {active.plan.items.slice(active.index + 1).map((it, i) => {
          const e = exercise(it.exerciseId);
          const at = active.index + 1 + i;
          const ss = supersetLabel(active.plan.items, at);
          return (
            <li key={it.exerciseId} className={`flex items-center gap-1 pr-2 ${ss ? "bg-accent/5" : ""}`}>
              <button
                type="button"
                onClick={() => s.goTo(at)}
                className="press flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-4 text-left"
              >
                <span className="flex min-w-0 flex-col">
                  {ss && <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-accent">{ss}</span>}
                  <span className="flex min-w-0 items-center gap-2.5 font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: muscleHue(it.focus) }} aria-hidden />
                    <span className="truncate">{e.name}</span>
                  </span>
                </span>
                <span className="num shrink-0 text-sm text-muted">
                  {it.scheme ?? `${it.sets} × ${repsText(e, it.target.reps)}`} · {loadText(e, it.target.weight, profile.unit)}
                </span>
              </button>
              <LinkToggle
                on={linkedToNext(active.plan.items, at - 1)}
                first={exercise(active.plan.items[at - 1].exerciseId).name}
                second={e.name}
                onToggle={() => s.toggleSuperset(at - 1)}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
