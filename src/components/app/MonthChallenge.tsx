"use client";

// The monthly challenge for everyone (Melvin, 2026-11-12, Friends gap list 2: item 7; docs/decisions/friends.md).
// Awards shows the lifter's own progress, what it takes to finish (the action), and the medals from months they
// finished; Friends › Board shows friends on the same challenge. Engine: src/lib/monthly.ts.
import { useEffect, useMemo, useState } from "react";

import { date, t } from "@/lib/i18n";
import { monthChallenge, monthHistory, thisMonth, type MonthMetric } from "@/lib/monthly";
import { social } from "@/lib/social";
import type { BoardRow } from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { Bar } from "./Achievements";
import { Avatar } from "./AvatarFace";
import { Icon } from "./icons";
import { go } from "./router";
import { Section } from "./ui";

const GOAL: Record<MonthMetric, MessageKey> = { workouts: "month.goal.workouts", sets: "month.goal.sets", minutes: "month.goal.minutes" };
const UNIT: Record<MonthMetric, MessageKey> = { workouts: "month.unit.workouts", sets: "month.unit.sets", minutes: "month.unit.minutes" };
const monthName = (at: number) => date(at, { month: "long" });
const amount = (metric: MonthMetric, n: number) => t(UNIT[metric], { count: n, n: fmtNum(n) });

/** The month's goal in words: "November: finish 12 workouts". */
export const monthGoal = (m: { metric: MonthMetric; goal: number; start: number }) =>
  t(GOAL[m.metric], { month: monthName(m.start), count: m.goal });

/** Awards: this month's challenge, what it takes to finish, and the medals so far. */
export function MonthCard() {
  const sessions = useApp((s) => s.stats.sessions);
  const now = useNow();
  const m = thisMonth(sessions, now);
  const medals = useMemo(() => monthHistory(sessions).filter((x) => x.done && x.key !== m.key), [sessions, m.key]);
  const left = Math.max(0, m.goal - m.value);
  // Spread what's left over the weeks left, so the line says what to do this week.
  const per = Math.ceil(left / Math.max(1, m.daysLeft / 7));
  return (
    <Section title={t("month.title")} icon="calendar" info="monthly">
      <div className="card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 font-semibold">{monthGoal(m)}</span>
          <span className="num shrink-0 text-sm text-muted">
            {fmtNum(Math.min(m.value, m.goal))}/{fmtNum(m.goal)}
          </span>
        </div>
        <div className="mt-2">
          <Bar
            value={m.value / m.goal}
            label={t("awards.progress", { name: monthGoal(m) })}
            colour={m.done ? "var(--color-good)" : undefined}
          />
        </div>
        <p className="mt-2 text-sm">
          {m.done
            ? t("month.done", { month: monthName(m.start) })
            : t("month.toGo", { left: amount(m.metric, left), per: amount(m.metric, per) })}
        </p>
        {!m.done && <p className="mt-1 text-xs text-muted">{t("month.left", { count: m.daysLeft })}</p>}
        {!!medals.length && (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("month.medals")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {medals.slice(-12).map((x) => (
                <li
                  key={x.key}
                  aria-label={t("month.medal", { month: date(x.start, { month: "long", year: "numeric" }) })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-3 py-1 text-xs"
                >
                  <Icon name="trophy" size={14} className="text-gold" />
                  <span aria-hidden>{date(x.start, { month: "short", year: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Section>
  );
}

/** Friends › Board: the lifter and the people they follow on this month's challenge, furthest first. */
export function MonthFriends() {
  const sessions = useApp((s) => s.stats.sessions);
  const now = useNow();
  const ch = monthChallenge(now);
  const mine = thisMonth(sessions, now).value;
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  useEffect(() => {
    let live = true;
    social<{ rows: BoardRow[] }>("board", { from: ch.start, to: ch.end })
      .then((r) => live && setRows(r.rows))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [ch.start, ch.end]);
  if (!rows || rows.length < 2) return null;
  // Your own line comes from this phone, which may hold workouts you didn't post.
  const ranked = rows
    .map((r) => ({ ...r, value: r.me ? Math.max(mine, r[ch.metric]) : r[ch.metric] }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return (
    <Section title={t("month.friends")} icon="calendar">
      <p className="mb-2 px-1 text-sm font-medium">{monthGoal(ch)}</p>
      <ol className="card divide-y divide-line" aria-label={t("month.friends")}>
        {ranked.map((r) => (
          <li key={r.handle} className={`flex items-center gap-3 px-4 py-2.5 ${r.me ? "bg-accent/10" : ""}`}>
            <button
              type="button"
              onClick={() => go("person", r.handle)}
              className="press flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
            >
              <Avatar name={r.name} avatar={r.avatar} size={32} />
              <span className="min-w-0 truncate font-medium">{r.me ? t("friends.board.you", { name: r.name }) : r.name}</span>
            </button>
            {r.value >= ch.goal ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-good">
                <Icon name="check" size={16} />
                {t("month.finished")}
              </span>
            ) : (
              <span className="num shrink-0 text-sm font-bold">
                {fmtNum(r.value)}/{fmtNum(ch.goal)}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 px-1 text-xs text-muted">{t("month.friendsHint")}</p>
    </Section>
  );
}
