import type { MessageKey } from "@/locales/en";

import { achievements, achievementXp, context, nearest, type Achievement } from "./achievements";
import { weekOf, type Stats } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { num, t, translated } from "./i18n";
import { epley, TIMED } from "./progression";
import { hash, rng } from "./random";
import type { AppEvent, Profile, SetEvent } from "./types";

// XP, levels, the training-week streak with freezes, weekly quests, leagues, crates and achievements.
// All derived from events and never stored, like Gradelings, so every device agrees.

export const XP = { set: 10, pr: 50, session: 40, fullSession: 30, crateDuplicate: 25 } as const;
const DAY = 86400_000;
const WEEK = 7 * DAY;

// ---------- Levels: 50 of them on a gentle curve, with a title every few levels.

const TITLES: [number, string][] = [
  [1, "rookie"],
  [4, "regular"],
  [8, "grinder"],
  [12, "iron"],
  [16, "steel"],
  [21, "titan"],
  [26, "legend"],
  [31, "mythic"],
];
export const MAX_LEVEL = 50;
export const levelAt = (n: number) => (n <= 1 ? 0 : Math.round((50 * Math.pow(n - 1, 1.8)) / 10) * 10);
/** The level's title in the current language. */
export const titleOf = (n: number) => t(`lvl.${TITLES.filter(([at]) => n >= at).at(-1)![1]}` as MessageKey);
/** Kept for older callers: the first level of each title. */
export const LEVELS = TITLES.map(([n, id]) => ({
  at: levelAt(n),
  get title() {
    return t(`lvl.${id}` as MessageKey);
  },
}));

export function levelOf(xp: number) {
  let n = 1;
  while (n < MAX_LEVEL && xp >= levelAt(n + 1)) n++;
  const nextAt = n < MAX_LEVEL ? levelAt(n + 1) : null;
  const nextTitle = n < MAX_LEVEL ? titleOf(n + 1) : null;
  return {
    level: n,
    title: titleOf(n),
    into: xp - levelAt(n),
    span: nextAt === null ? 1 : nextAt - levelAt(n),
    /** The next level's name: a new title when one starts there, otherwise "Level n". */
    next: nextTitle === null ? null : nextTitle !== titleOf(n) ? nextTitle : t("progress.level", { level: n + 1 }),
  };
}

/** XP from sets, sessions and PRs (the base every other bonus adds to). */
export function xpTotal(stats: Stats): number {
  return (
    stats.totalSets * XP.set +
    stats.prs.length * XP.pr +
    stats.sessions.length * XP.session +
    stats.sessions.filter((s) => s.sets >= 12).length * XP.fullSession
  );
}

export function sessionXp(stats: Stats, sessionId: string): number {
  const s = stats.sessions.find((x) => x.sessionId === sessionId);
  if (!s) return 0;
  return s.sets * XP.set + XP.session + s.prs * XP.pr + (s.sets >= 12 ? XP.fullSession : 0);
}

// ---------- Streak: weeks meeting the days-per-week goal, with freezes.

export const FREEZE_EVERY = 4;
export const MAX_FREEZES = 2;

export interface Streak {
  /** Weeks in a row meeting the goal (frozen weeks keep it alive but don't add to it). */
  weeks: number;
  /** Training days so far this week, and how many more meet the goal. */
  thisWeek: number;
  needed: number;
  /** Freezes held now (earned one per FREEZE_EVERY goal weeks, at most MAX_FREEZES). */
  freezes: number;
  /** Week starts of past weeks a freeze saved. */
  frozen: number[];
  /** Longest run ever. */
  best: number;
  /** Days left this week, today included. */
  daysLeft: number;
  /** The goal can no longer be met in the days left without training on back-to-back days. */
  atRisk: boolean;
  /** A freeze will be used if this week misses. */
  freezeReady: boolean;
}

function trainingDays(stats: Stats): Map<number, Set<string>> {
  const days = new Map<number, Set<string>>();
  for (const s of stats.sessions) {
    const w = weekOf(s.start);
    days.set(w, (days.get(w) ?? new Set()).add(new Date(s.start).toDateString()));
  }
  return days;
}

/** Weeks in a row meeting the days-per-week goal. The current week counts once met; a missed past week uses a freeze if one is held. */
export function goalStreak(stats: Stats, profile: Pick<Profile, "daysPerWeek">, now: number): Streak {
  const days = trainingDays(stats);
  const goal = Math.max(1, profile.daysPerWeek);
  const thisWeekStart = weekOf(now);
  const met = (w: number) => (days.get(w)?.size ?? 0) >= goal;
  const weeks = [...days.keys()].filter((w) => w < thisWeekStart).sort((a, b) => a - b);
  let streak = 0;
  let run = 0;
  let freezes = 0;
  let best = 0;
  const frozen: number[] = [];
  if (weeks.length) {
    // Walk every week from the first workout to last week. weekOf(w + 8 days) steps across DST safely.
    for (let w = weeks[0]; w < thisWeekStart; w = weekOf(w + WEEK + DAY)) {
      if (met(w)) {
        streak++;
        run++;
        if (run % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
      } else if (streak > 0 && freezes > 0) {
        freezes--;
        frozen.push(w);
      } else {
        streak = 0;
        run = 0;
      }
      best = Math.max(best, streak);
    }
  }
  const thisWeek = days.get(thisWeekStart)?.size ?? 0;
  const metNow = thisWeek >= goal;
  const weeksNow = streak + (metNow ? 1 : 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const trainedToday = stats.sessions.some((s) => new Date(s.start).toDateString() === today.toDateString());
  const daysLeft = 7 - Math.round((today.getTime() - thisWeekStart) / DAY);
  const needed = Math.max(0, goal - thisWeek);
  // Days still free to train: today only counts if not trained yet.
  const free = daysLeft - (trainedToday ? 1 : 0);
  const atRisk = needed > 0 && streak > 0 && free < needed;
  return {
    weeks: weeksNow,
    thisWeek,
    needed,
    freezes,
    frozen,
    best: Math.max(best, weeksNow),
    daysLeft,
    atRisk,
    freezeReady: needed > 0 && freezes > 0 && streak > 0,
  };
}

// ---------- Weekly quests: three a week, picked from the week (not from history) so every device agrees.

export interface Quest {
  id: string;
  title: string;
  icon: string;
  goal: number;
  have: number;
  xp: number;
  done: boolean;
}

const q = (id: string, n = 1) => t(`quest.${id}` as MessageKey, { count: n, n: num(n) });
type QuestDef = {
  id: string;
  icon: string;
  xp: number;
  title(goal: number): string;
  goal(p: Profile): number;
  have(sets: SetEvent[], sessions: Session[], before: SetEvent[]): number;
};
type Session = { id: string; at: number; sets: SetEvent[] };

const QUESTS: QuestDef[] = [
  // Train the goal number of days, never more, so nobody is pushed to train sore.
  {
    id: "days",
    icon: "📆",
    xp: 150,
    title: (n) => q("days", n),
    goal: (p) => Math.max(1, p.daysPerWeek),
    have: (_s, ss) => new Set(ss.map((s) => new Date(s.at).toDateString())).size,
  },
  { id: "pr", icon: "🏆", xp: 120, title: () => q("pr"), goal: () => 1, have: (sets, _ss, before) => prsIn(sets, before) },
  {
    id: "new-ex",
    icon: "🧭",
    xp: 80,
    title: () => q("new-ex"),
    goal: () => 1,
    have: (sets, _ss, before) => {
      const old = new Set(before.map((s) => s.exerciseId));
      return new Set(sets.filter((s) => !old.has(s.exerciseId)).map((s) => s.exerciseId)).size;
    },
  },
  {
    id: "on-target",
    icon: "🎯",
    xp: 100,
    title: () => q("on-target"),
    goal: () => 1,
    have: (_s, ss) => ss.filter((s) => s.sets.length >= 6 && s.sets.every((x) => x.challenge || x.reps >= x.targetReps)).length,
  },
  {
    id: "sets",
    icon: "✅",
    xp: 100,
    title: (n) => q("sets", n),
    goal: (p) => Math.max(1, p.daysPerWeek) * 14,
    have: (sets) => sets.length,
  },
  {
    id: "legs",
    icon: "🦵",
    xp: 80,
    title: () => q("legs"),
    goal: () => 1,
    have: (_s, ss) =>
      ss.filter((s) =>
        s.sets.some((x) => EXERCISE_BY_ID.get(x.exerciseId)?.primary.some((m) => m === "quads" || m === "hamstrings" || m === "glutes")),
      ).length,
  },
  {
    id: "muscles",
    icon: "🫀",
    xp: 100,
    title: (n) => q("muscles", n),
    goal: (p) => Math.min(10, 4 + Math.max(1, p.daysPerWeek) * 2),
    have: (sets) => new Set(sets.flatMap((s) => EXERCISE_BY_ID.get(s.exerciseId)?.primary ?? [])).size,
  },
  {
    id: "reps",
    icon: "🔁",
    xp: 100,
    title: (n) => q("reps", n),
    goal: (p) => Math.max(1, p.daysPerWeek) * 120,
    have: (sets) => sets.reduce((t, s) => t + (TIMED.has(s.exerciseId) ? 0 : s.reps), 0),
  },
  {
    id: "rest",
    icon: "⏳",
    xp: 60,
    title: (n) => q("rest", n),
    goal: (p) => Math.max(1, p.daysPerWeek) * 8,
    have: (sets) => sets.filter((s) => (s.restSec ?? 0) >= 60).length,
  },
];

function prsIn(sets: SetEvent[], before: SetEvent[]): number {
  const bestBy = new Map<string, number>();
  for (const s of before) if (s.weight > 0) bestBy.set(s.exerciseId, Math.max(bestBy.get(s.exerciseId) ?? 0, epley(s.weight, s.reps)));
  let n = 0;
  for (const s of [...sets].sort((a, b) => a.at - b.at)) {
    if (s.weight <= 0) continue;
    const e = epley(s.weight, s.reps);
    const b = bestBy.get(s.exerciseId);
    if (b !== undefined && e > b + 0.01) n++;
    if (b === undefined || e > b) bestBy.set(s.exerciseId, e);
  }
  return n;
}

function setsOf(events: readonly AppEvent[]): SetEvent[] {
  const seen = new Set<string>();
  const out: SetEvent[] = [];
  for (const e of events)
    if (e.type === "set" && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
  return out.sort((a, b) => a.at - b.at);
}

function sessionsOf(sets: SetEvent[]): Session[] {
  const by = new Map<string, SetEvent[]>();
  for (const s of sets) by.set(s.sessionId, [...(by.get(s.sessionId) ?? []), s]);
  return [...by].map(([id, list]) => ({ id, at: list[0].at, sets: list }));
}

/** The three quests for the week starting on `monday`, with progress. */
export function questsFor(events: readonly AppEvent[], profile: Profile, monday: number): Quest[] {
  const all = setsOf(events);
  const end = weekOf(monday + WEEK + DAY);
  const sets = all.filter((s) => s.at >= monday && s.at < end);
  const before = all.filter((s) => s.at < monday);
  const sessions = sessionsOf(sets);
  const r = rng(hash(`quests:${new Date(monday).toDateString()}`));
  // "Train your days" is always one of the three; the other two rotate.
  const pool = QUESTS.slice(1);
  const picks = [QUESTS[0]];
  while (picks.length < 3) {
    const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
    picks.push(q);
  }
  return picks.map((q) => {
    const goal = q.goal(profile);
    const have = Math.min(goal, q.have(sets, sessions, before));
    return { id: q.id, title: q.title(goal), icon: q.icon, goal, have, xp: q.xp, done: have >= goal };
  });
}

// ---------- Leagues: a tier for each week, earned by weekly XP against your own tier's bar.
// Honest by design: no made-up rivals. Leaderboards with friends come with accounts and sync.

export const LEAGUES = ["Bronze", "Silver", "Gold", "Sapphire", "Ruby", "Emerald", "Diamond"] as const;
export type League = (typeof LEAGUES)[number];
/** A league's name in the current language (`LEAGUES` stays the stable id). */
export const LEAGUE_LABEL: Record<League, string> = translated(LEAGUES, (l) => `league.${l.toLowerCase()}` as MessageKey);
/** Weekly XP needed to move up from each league, and below which you drop a league. */
export const promoteAt = (i: number) => 300 + 150 * i;
export const demoteBelow = (i: number) => (i === 0 ? 0 : 100 + 50 * i);

export interface LeagueState {
  league: League;
  index: number;
  /** XP earned this week (sets, sessions, PRs and quests). */
  weekXp: number;
  promoteAt: number | null;
  demoteBelow: number;
  /** League history, oldest first: [monday, index]. */
  history: [number, number][];
}

export function weekXp(events: readonly AppEvent[], stats: Stats, profile: Profile, monday: number): number {
  const end = weekOf(monday + WEEK + DAY);
  let xp = 0;
  for (const s of stats.sessions) {
    if (s.start < monday || s.start >= end) continue;
    xp += s.sets * XP.set + XP.session + s.prs * XP.pr + (s.sets >= 12 ? XP.fullSession : 0);
  }
  for (const q of questsFor(events, profile, monday)) if (q.done) xp += q.xp;
  return xp;
}

export function league(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number, streak?: Streak): LeagueState {
  const thisWeekStart = weekOf(now);
  const first = stats.sessions.length ? weekOf(Math.min(...stats.sessions.map((s) => s.start))) : thisWeekStart;
  const frozen = new Set(streak?.frozen ?? goalStreak(stats, profile, now).frozen);
  let i = 0;
  const history: [number, number][] = [];
  for (let w = first; w < thisWeekStart; w = weekOf(w + WEEK + DAY)) {
    history.push([w, i]);
    const xp = weekXp(events, stats, profile, w);
    if (xp >= promoteAt(i) && i < LEAGUES.length - 1) i++;
    // A frozen week never drops you a league.
    else if (xp < demoteBelow(i) && !frozen.has(w)) i--;
  }
  history.push([thisWeekStart, i]);
  return {
    league: LEAGUES[i],
    index: i,
    weekXp: weekXp(events, stats, profile, thisWeekStart),
    promoteAt: i < LEAGUES.length - 1 ? promoteAt(i) : null,
    demoteBelow: demoteBelow(i),
    history,
  };
}

// ---------- Crates: one per finished workout, its prize picked from the session id so every device agrees.

export type Rarity = "common" | "rare" | "epic" | "legendary";
export interface Cosmetic {
  id: string;
  kind: "accent" | "sound" | "plates";
  name: string;
  rarity: Rarity;
  /** Colour for accents, a sound id for timer sounds, a finish for plates. */
  value: string;
}

const COSMETIC_ROWS: Omit<Cosmetic, "name">[] = [
  { id: "accent-blue", kind: "accent", rarity: "common", value: "#4c8dff" },
  { id: "accent-teal", kind: "accent", rarity: "common", value: "#2dd4bf" },
  { id: "accent-lime", kind: "accent", rarity: "common", value: "#a3e635" },
  { id: "accent-violet", kind: "accent", rarity: "rare", value: "#a78bfa" },
  { id: "accent-orange", kind: "accent", rarity: "rare", value: "#fb923c" },
  { id: "accent-pink", kind: "accent", rarity: "epic", value: "#f472b6" },
  { id: "accent-gold", kind: "accent", rarity: "legendary", value: "#f2c14e" },
  { id: "sound-classic", kind: "sound", rarity: "common", value: "classic" },
  { id: "sound-chime", kind: "sound", rarity: "common", value: "chime" },
  { id: "sound-arcade", kind: "sound", rarity: "rare", value: "arcade" },
  { id: "sound-gong", kind: "sound", rarity: "epic", value: "gong" },
  { id: "plates-classic", kind: "plates", rarity: "common", value: "classic" },
  { id: "plates-black", kind: "plates", rarity: "rare", value: "black" },
  { id: "plates-chrome", kind: "plates", rarity: "epic", value: "chrome" },
  { id: "plates-neon", kind: "plates", rarity: "legendary", value: "neon" },
];
/** Cosmetics with their names in the current language (getters, so a language change shows at once). */
export const COSMETICS: Cosmetic[] = COSMETIC_ROWS.map((c) => ({
  ...c,
  get name() {
    return t(`cos.${c.id}` as MessageKey);
  },
}));
export const STARTER = ["accent-blue", "sound-classic", "plates-classic"];
const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 28, epic: 10, legendary: 2 };
export const RARITY_LABEL: Record<Rarity, string> = translated(["common", "rare", "epic", "legendary"], (k) => `rarity.${k}`);

export function crateFor(sessionId: string): Cosmetic {
  const r = rng(hash(`crate:${sessionId}`))();
  const pool = COSMETICS.filter((c) => !STARTER.includes(c.id));
  const total = pool.reduce((t, c) => t + RARITY_WEIGHT[c.rarity], 0);
  let x = r * total;
  for (const c of pool) {
    x -= RARITY_WEIGHT[c.rarity];
    if (x < 0) return c;
  }
  return pool[pool.length - 1];
}

/** Crates from every finished workout, oldest first; a repeat prize turns into bonus XP. */
export function crates(stats: Stats): { sessionId: string; item: Cosmetic; duplicate: boolean }[] {
  const owned = new Set(STARTER);
  return [...stats.sessions].reverse().map((s) => {
    const item = crateFor(s.sessionId);
    const duplicate = owned.has(item.id);
    owned.add(item.id);
    return { sessionId: s.sessionId, item, duplicate };
  });
}

export function owned(stats: Stats): Set<string> {
  return new Set([...STARTER, ...crates(stats).map((c) => c.item.id)]);
}

// ---------- PR moments during a workout

/** Best estimated one-rep max for an exercise before a set, from earlier sets (any session). */
export function bestBefore(events: readonly AppEvent[], exerciseId: string, at: number, excludeId?: string): number | null {
  let b: number | null = null;
  for (const e of events) {
    if (e.type !== "set" || e.exerciseId !== exerciseId || e.id === excludeId || e.at > at || e.weight <= 0) continue;
    const v = epley(e.weight, e.reps);
    if (b === null || v > b) b = v;
  }
  return b;
}

/** Is this set a new best? Needs history for the exercise, so a first-ever session isn't a parade of PRs. */
export function isPr(events: readonly AppEvent[], set: SetEvent): boolean {
  if (set.weight <= 0 || TIMED.has(set.exerciseId)) return false;
  const prevSessions = events.some(
    (e) => e.type === "set" && e.exerciseId === set.exerciseId && e.sessionId !== set.sessionId && e.at < set.at,
  );
  if (!prevSessions) return false;
  const b = bestBefore(events, set.exerciseId, set.at, set.id);
  return b !== null && epley(set.weight, set.reps) > b + 0.01;
}

/** Reps at this weight that would beat the best, for an "almost there" hint; null without history. */
export function repsForPr(events: readonly AppEvent[], exerciseId: string, weightKg: number, now: number): number | null {
  if (weightKg <= 0 || TIMED.has(exerciseId)) return null;
  const b = bestBefore(events, exerciseId, now);
  if (b === null) return null;
  const r = Math.floor(30 * (b / weightKg - 1)) + 1;
  return r >= 1 && r <= 30 ? r : null;
}

// ---------- Everything at once

export interface Game {
  xp: number;
  level: ReturnType<typeof levelOf>;
  streak: Streak;
  quests: Quest[];
  league: LeagueState;
  achievements: Achievement[];
  /** Badges (tiers) earned and the total on offer. */
  badges: { earned: number; total: number };
  /** Closest goals, for "almost there" cards. */
  nearest: Achievement[];
  owned: Set<string>;
}

export function questXp(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number): number {
  if (!stats.sessions.length) return 0;
  const first = weekOf(Math.min(...stats.sessions.map((s) => s.start)));
  let xp = 0;
  for (let w = first; w <= weekOf(now); w = weekOf(w + WEEK + DAY)) for (const q of questsFor(events, profile, w)) if (q.done) xp += q.xp;
  return xp;
}

export function game(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number): Game {
  const streak = goalStreak(stats, profile, now);
  const list = achievements(context(events, stats, profile, streak.best));
  const dupXp = crates(stats).filter((c) => c.duplicate).length * XP.crateDuplicate;
  const xp = xpTotal(stats) + questXp(events, stats, profile, now) + achievementXp(list) + dupXp;
  const total = list.reduce((n, a) => n + a.levels, 0);
  return {
    xp,
    level: levelOf(xp),
    streak,
    quests: questsFor(events, profile, weekOf(now)),
    league: league(events, stats, profile, now, streak),
    achievements: list,
    badges: { earned: list.reduce((n, a) => n + a.level, 0), total },
    nearest: nearest(list),
    owned: owned(stats),
  };
}

// ---------- Older API, kept for callers and share links

export interface Trophy {
  id: string;
  name: string;
  detail: string;
  tier: "bronze" | "silver" | "gold";
  earned: boolean;
}

/** Achievements as the older trophy shape (one entry per achievement). */
export function trophies(events: readonly AppEvent[], stats: Stats, profile: Profile): Trophy[] {
  const best = goalStreak(stats, profile, Date.now()).best;
  return achievements(context(events, stats, profile, best))
    .filter((a) => !a.hidden)
    .map((a) => ({
      id: a.id,
      name: a.name,
      detail: a.detail,
      tier: a.tier === "platinum" || a.tier === "gold" ? "gold" : a.tier === "silver" ? "silver" : "bronze",
      earned: a.level > 0,
    }));
}

export function exerciseName(id: string): string {
  return EXERCISE_BY_ID.get(id)?.name ?? id;
}
