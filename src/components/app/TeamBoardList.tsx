"use client";

// A team session's board (TeamSession.tsx on the tablet, the live board sheet in SchoolTeams.tsx on the coach's other
// devices): the action line first, then everyone by sets done with the exercise they're on. Never a weight.
import { exerciseName } from "@/lib/game";
import { t } from "@/lib/i18n";

/** The board: action first, then everyone by sets done with the exercise they're on. Never a weight. */
export function BoardList({
  rows,
  nudge,
}: {
  rows: { id: string; name: string; done: number; total: number; on: string }[];
  nudge: string;
}) {
  return (
    <section className="card p-4">
      <p className="font-semibold">{nudge}</p>
      <ol className="mt-2 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{r.name || t("trn.noName")}</span>
              <span className="block truncate text-sm text-muted">
                {r.on ? t("team.ses.on", { exercise: exerciseName(r.on) }) : t("team.ses.finished")}
              </span>
            </span>
            <span className="num shrink-0 font-semibold" aria-hidden>
              {r.done}/{r.total}
            </span>
            <span className="sr-only">{t("team.ses.boardRow", { name: r.name, done: r.done, total: r.total })}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
