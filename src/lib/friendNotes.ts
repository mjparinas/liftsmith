"use client";

// Friend nudges in coach's notes (Melvin, 2026-11-12, Friends gap list 2: item 9; docs/decisions/friends.md). Three
// notes from what friends are doing, each with the numbers behind it and one thing to do, like every coach's note
// (AGENTS.md "Action over stats"): a friend challenge about to slip away, a friend pulling ahead this week while the
// lifter is short of their weekly goal, and a mutual friend who's gone quiet. Built on the phone from one server
// call (`nudges`), refreshed at most every 15 minutes while the app is open, never stored.
import { useEffect, useState } from "react";

import type { MessageKey } from "@/locales/en";

import { readAccount } from "./auth";
import { daysLeft } from "./challenge";
import { challengeResult } from "./challengeResult";
import { list as fmtList, t } from "./i18n";
import type { Insight } from "./insights";
import { boardNudge, weekStart } from "./invite";
import { social, socialOn, useSocial } from "./social";
import type { BoardMetric, FriendSignals } from "./socialTypes";
import type { Profile } from "./types";
import { fmtNum, fromKg } from "./units";

const DAY = 86_400_000;
/** At most this many friend notes at once, so they never crowd out notes about the lifter's own training. */
const MAX_NOTES = 2;

const CH_NAME: Record<BoardMetric, MessageKey> = {
  workouts: "friends.ch.name.workouts",
  sets: "friends.ch.name.sets",
  minutes: "friends.ch.name.minutes",
  volume: "friends.ch.name.volume",
};

function amount(metric: BoardMetric, v: number, unit: Profile["unit"]): string {
  if (metric === "volume") return `${fmtNum(Math.round(fromKg(v, unit)))} ${unit}`;
  const key: MessageKey = metric === "workouts" ? "month.unit.workouts" : metric === "sets" ? "month.unit.sets" : "month.unit.minutes";
  return t(key, { count: v, n: fmtNum(v) });
}

/**
 * The friend notes for now. `mine` is the lifter's own workouts this week from the phone (which may hold workouts
 * they didn't post).
 */
export function friendNotes(
  s: FriendSignals,
  { profile, now, mine }: { profile: Pick<Profile, "unit" | "daysPerWeek">; now: number; mine: number },
): Insight[] {
  const out: Insight[] = [];
  const unit = profile.unit;
  // An older server sends none of these.
  const { week = [], challenges = [], quiet = [], ended = [] } = s;
  const seeBoard: Insight["action"] = { kind: "go", route: "friends/board", label: t("social.note.seeBoard") };

  // A challenge that just ended (gap list 3, item 5): where the lifter finished, and a rematch or a share.
  for (const c of ended) {
    const r = challengeResult(c, now);
    if (!r) continue;
    const challenge = c.name || t(CH_NAME[c.metric]);
    const total = amount(c.metric, r.score, unit);
    out.push({
      id: `friend-result-${c.id}`,
      tone: r.won ? "good" : "info",
      title: t(r.tie ? "social.res.tie.title" : r.won ? "social.res.won.title" : "social.res.place.title", { challenge }),
      why: r.won
        ? t("social.res.won.why", { amount: total, n: fmtNum(r.of) })
        : r.winners.length
          ? t("social.res.place.why", { place: fmtNum(r.place), n: fmtNum(r.of), amount: total, names: fmtList(r.winners) })
          : t("social.res.none.why"),
      advice: t("social.res.advice"),
      action: { kind: "go", route: "friends/board", label: t("social.res.go") },
    });
  }

  // A running challenge about to slip away: someone just ahead, three days or fewer left.
  for (const c of challenges) {
    if (c.status !== "joined" || c.endsAt <= now) continue;
    const left = daysLeft(c, now);
    if (left > 3) continue;
    const rows = c.members
      .filter((m) => m.joined)
      .map((m) => ({
        handle: m.handle,
        name: m.name,
        avatar: m.avatar,
        me: m.me,
        workouts: 0,
        sets: 0,
        minutes: 0,
        volume: 0,
        prs: 0,
        [c.metric]: m.value,
      }));
    const nudge = boardNudge(rows, c.metric);
    if (nudge?.kind !== "chase") continue;
    const challenge = c.name || t(CH_NAME[c.metric]);
    out.push({
      id: `friend-chase-${c.id}-${nudge.gap}-${left}`,
      tone: "warn",
      title: t("social.note.chase.title", { name: nudge.name, challenge }),
      why: t("social.note.chase.why", { name: nudge.name, gap: amount(c.metric, nudge.gap, unit), count: left }),
      advice: t("social.note.chase.advice"),
      action: seeBoard,
    });
  }

  // A friend pulling ahead this week while the lifter is short of their weekly goal.
  if (mine < profile.daysPerWeek) {
    const ahead = week
      .filter((r) => !r.me && r.workouts >= mine + 2)
      .sort((a, b) => b.workouts - a.workouts || a.name.localeCompare(b.name))[0];
    if (ahead)
      out.push({
        id: `friend-pace-${ahead.handle}-${weekStart(now)}-${ahead.workouts}-${mine}`,
        tone: "info",
        title: t("social.note.pace.title", { name: ahead.name }),
        why: t("social.note.pace.why", {
          name: ahead.name,
          theirs: amount("workouts", ahead.workouts, unit),
          mine: amount("workouts", mine, unit),
        }),
        advice: t("social.note.pace.advice"),
        action: seeBoard,
      });
  }

  // A mutual friend who trained regularly and has gone quiet.
  const q = quiet[0];
  if (q) {
    const days = Math.floor((now - q.lastAt) / DAY);
    out.push({
      id: `friend-quiet-${q.handle}-${q.lastAt}`,
      tone: "info",
      title: t("social.note.quiet.title", { name: q.name }),
      why: t("social.note.quiet.why", { name: q.name, days: fmtNum(days), count: q.before }),
      advice: t("social.note.quiet.advice"),
      action: { kind: "go", route: `person/${q.handle}`, label: t("social.note.quiet.go") },
    });
  }
  return out.slice(0, MAX_NOTES);
}

const FRESH_MS = 15 * 60_000;
let cache: { at: number; key: string; data: FriendSignals } | null = null;

/** The friend signals for coach's notes, or null when the lifter isn't in Friends (or offline). */
export function useFriendSignals(now: number): FriendSignals | null {
  const joined = useSocial((s) => !!s.me?.profile);
  const account = readAccount()?.id ?? "";
  const key = `${account}|${weekStart(now)}`;
  const [data, setData] = useState<FriendSignals | null>(() => (cache?.key === key ? cache.data : null));
  const stale = !cache || cache.key !== key || now - cache.at > FRESH_MS;
  useEffect(() => {
    if (!joined || !account || !socialOn() || !stale) return;
    let live = true;
    social<FriendSignals>("nudges", { from: weekStart(Date.now()) })
      .then((r) => {
        cache = { at: Date.now(), key, data: r };
        if (live) setData(r);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [joined, account, key, stale]);
  return joined ? (cache?.key === key ? cache.data : data) : null;
}

/** For tests: forget the cached signals. */
export function resetFriendSignals() {
  cache = null;
}
