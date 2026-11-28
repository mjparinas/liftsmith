"use client";

import { exercise, EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { mastered, masteryOf, type Mastery } from "@/lib/mastery";

import { Bar, useGame } from "./Achievements";
import { Icon } from "./icons";
import { MasteryStars } from "./MasteryStars";
import { go } from "./router";
import { Section } from "./ui";

// Lift mastery on screen (mastery.ts): the stars, the sets to the next one, and what stars unlock. Read-only, so it
// never adds a tap during a set.

/** How far to the next star, in words and a bar. */
function NextStar({ m }: { m: Mastery }) {
  if (m.next === null) return <p className="text-sm text-muted">{t("mst.maxed")}</p>;
  const left = m.next - m.sets;
  return (
    <div className="space-y-1.5">
      <Bar
        value={(m.sets - m.from) / (m.next - m.from)}
        label={t("mst.next", { count: left, star: m.stars + 1 })}
        colour="var(--color-gold)"
      />
      <p className="num text-xs text-faint">{t("mst.next", { count: left, star: m.stars + 1 })}</p>
    </div>
  );
}

/** The exercise page's mastery card: its stars, its sets, the next star and what stars unlock. */
export function MasteryCard({ exerciseId }: { exerciseId: string }) {
  const g = useGame();
  const m = masteryOf(g.mastery, exerciseId);
  return (
    <Section title={t("mst.section")} icon="star" info="mastery">
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <MasteryStars stars={m.stars} size={20} />
          <span className="num text-sm text-muted">{t("mst.sets", { count: m.sets })}</span>
        </div>
        <NextStar m={m} />
        <p className="text-xs text-faint">{t("mst.unlocks")}</p>
      </div>
    </Section>
  );
}

const TOP = 5;

/** Awards: the lifter's most mastered lifts, each opening its exercise page. */
export function MasteryList() {
  const g = useGame();
  const list = mastered(g.mastery).filter((m) => EXERCISE_BY_ID.has(m.exerciseId));
  return (
    <Section title={t("mst.section")} icon="star" info="mastery">
      {list.length ? (
        <ul className="card divide-y divide-line">
          {list.slice(0, TOP).map((m) => (
            <li key={m.exerciseId}>
              <button
                type="button"
                onClick={() => go("exercise", m.exerciseId)}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{exercise(m.exerciseId).name}</span>
                  <span className="num text-xs text-faint">
                    {m.next === null ? t("mst.sets", { count: m.sets }) : t("mst.next", { count: m.next - m.sets, star: m.stars + 1 })}
                  </span>
                </span>
                <MasteryStars stars={m.stars} />
                <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
              </button>
            </li>
          ))}
          {list.length > TOP && <li className="px-4 py-3 text-sm text-muted">{t("mst.more", { count: list.length - TOP })}</li>}
        </ul>
      ) : (
        <p className="card p-4 text-sm text-muted">{t("mst.awardsEmpty")}</p>
      )}
    </Section>
  );
}

/** Done: lifts whose stars went up in this workout. */
export function MasteryDone({ gained }: { gained: readonly Mastery[] }) {
  const list = gained.filter((m) => EXERCISE_BY_ID.has(m.exerciseId));
  if (!list.length) return null;
  return (
    <section className="mt-4 text-left" aria-label={t("mst.done")}>
      <ul className="card divide-y divide-line">
        {list.map((m) => (
          <li key={m.exerciseId} className="animate-rise flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gold">{t("mst.done")}</span>
              <span className="block truncate font-semibold">{exercise(m.exerciseId).name}</span>
              <span className="text-sm text-muted">
                {t("mst.doneLine", { star: m.stars })} · {t("mst.sets", { count: m.sets })}
              </span>
            </span>
            <MasteryStars stars={m.stars} size={18} />
          </li>
        ))}
      </ul>
    </section>
  );
}
