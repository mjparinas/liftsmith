import type { MessageKey } from "@/locales/en";

import type { Tier } from "./achievements";
import { weekOf, type Stats } from "./derive";
import { questsFor } from "./game";
import { t } from "./i18n";
import { hash, rng } from "./random";
import type { AppEvent, Profile, SetEvent } from "./types";

// Training seasons (Melvin, 2026-11-17: "games like diablo have this concept of a season … different badges,
// colour schemes, icons, that you can only unlock in there"; docs/decisions/seasons.md). A season is a stretch of
// 8 to 12 of the lifter's calendar weeks with its own track of 20 tiers. Season points come from training toward
// the lifter's OWN weekly goal, never past it, so a two-day lifter climbs as fast as a five-day one and nobody
// gains by overtraining. Each tier can bring a season-only reward (badges, an avatar, an accent, a theme with its
// app icon), which can only be earned while the season runs and stays owned afterwards. Pro members get a bonus
// row on top (Melvin picked "Free track plus Pro bonus" on 2026-11-17). Like every game rule, it's derived from
// the event log, never stored, so every device agrees after sync.
//
// The schedule (which season runs when, with which reward set) comes from the admin panel's Seasons tab through
// GET /api/seasons/, kept on the device (seasonList). Reward sets (kits) ship with the app, because the app icons
// are native files; a season can only use a kit this build knows.

const DAY = 86400_000;
const WEEK = 7 * DAY;

/** Tiers on the track, points per tier, and points per prestige star past the last tier. */
export const TIERS = 20;
export const TIER_POINTS = 400;
export const PRESTIGE_POINTS = 1000;
/** Points from training days in a week that meets the goal, whatever the goal is (shared out over the goal days). */
export const WEEK_DAY_POINTS = 600;
/** Meeting the weekly goal. */
export const GOAL_BONUS = 200;
/** Each weekly quest done. */
export const QUEST_POINTS = 50;
/** Each season challenge done. */
export const CHALLENGE_POINTS = 500;
/** The chance each new best during a season drops the season's rare item. */
export const DROP_ODDS = 1 / 6;
export const MIN_WEEKS = 8;
export const MAX_WEEKS = 12;

/** A season on the schedule: an id, the reward set, the first day (a Monday, "YYYY-MM-DD", local) and its length. */
export interface SeasonDef {
  id: string;
  kit: string;
  start: string;
  weeks: number;
}

/**
 * A built-in season the admin panel took off the schedule: `{ id, off: true }` in the server's list hides the
 * built-in season with that id. It has no kit, so builds from before 2026-11-19 drop it like any unknown season.
 */
export interface SeasonOff {
  id: string;
  off: true;
}
export type ScheduleRow = SeasonDef | SeasonOff;
const isOff = (s: unknown): s is SeasonOff => !!s && typeof s === "object" && (s as SeasonOff).off === true;

/**
 * The season challenges (500 points each). Every kit picks its own three, so no two seasons ask the same:
 * `goal-weeks` meet the goal in n% of the season's weeks; `prs` set n new bests; `new-ex` try n exercises never
 * done before; `streak` meet the goal n weeks in a row; `pr-lifts` new bests on n different exercises; `quests`
 * finish n weekly quests; `bookends` meet the goal in the first and the last week; `stretch` stretch on its own
 * for 10 minutes or more on n days. None asks for days past the weekly goal.
 */
export type ChallengeId = "goal-weeks" | "prs" | "new-ex" | "streak" | "pr-lifts" | "quests" | "bookends" | "stretch";
export interface ChallengeDef {
  id: ChallengeId;
  n: number;
}

export type RewardKind = "badge" | "item" | "theme";
export interface SeasonReward {
  tier: number;
  kind: RewardKind;
  /** A badge tier, a Locker item id (game.ts COSMETICS) or a theme id (themes.ts, with its app icon). */
  id: string;
  /** In the Pro bonus row. */
  pro?: boolean;
}

export interface Kit {
  id: string;
  /** The kit's colour token, for its tinted cards and badges, and its hex for the (always dark) share card. */
  hue: string;
  cardHex: string;
  rewards: SeasonReward[];
  /** The rare item a new best can drop during the season (a Locker item id). */
  drop: string;
  /** The season's own three challenges. */
  challenges: ChallengeDef[];
}

/** A kit's track: the same tiers for every kit, with that kit's own items and themes. */
function track(kit: string, pro: { theme: string }): SeasonReward[] {
  return [
    { tier: 2, kind: "item", id: `av-${kit}` },
    { tier: 5, kind: "badge", id: "bronze" },
    { tier: 7, kind: "item", id: `accent-${kit}` },
    { tier: 10, kind: "badge", id: "silver" },
    { tier: 12, kind: "theme", id: kit },
    { tier: 15, kind: "badge", id: "gold" },
    { tier: 20, kind: "badge", id: "platinum" },
    { tier: 6, kind: "item", id: `av-${kit}-pro`, pro: true },
    { tier: 14, kind: "item", id: `accent-${kit}-pro`, pro: true },
    { tier: 20, kind: "theme", id: pro.theme, pro: true },
  ];
}

/**
 * Reward sets this build knows, one per season, never reused (Melvin, 2026-11-19: "keep them unique, plan it out
 * until end of 2027"). Each has its own look (a free theme and app icon, a Pro theme and icon, two avatars, two
 * accents and a rare plate finish) and its own three challenges. Ember is season 1: a warm red and gold winter.
 */
export const KITS: Record<string, Kit> = {
  ember: {
    id: "ember",
    hue: "var(--color-ember)",
    cardHex: "#ff6a3d",
    drop: "plates-ember",
    rewards: [
      { tier: 2, kind: "item", id: "av-ember" },
      { tier: 5, kind: "badge", id: "bronze" },
      { tier: 7, kind: "item", id: "accent-ember" },
      { tier: 10, kind: "badge", id: "silver" },
      { tier: 12, kind: "theme", id: "ember" },
      { tier: 15, kind: "badge", id: "gold" },
      { tier: 20, kind: "badge", id: "platinum" },
      { tier: 6, kind: "item", id: "av-ember-pro", pro: true },
      { tier: 14, kind: "item", id: "accent-ember-pro", pro: true },
      { tier: 20, kind: "theme", id: "embergold", pro: true },
    ],
    challenges: [
      { id: "goal-weeks", n: 60 },
      { id: "prs", n: 5 },
      { id: "new-ex", n: 8 },
    ],
  },
  // Season 2, late winter: storm indigo, and lightning silver on the Pro row.
  tempest: {
    id: "tempest",
    hue: "var(--color-tempest)",
    cardHex: "#7c83ff",
    drop: "plates-tempest",
    rewards: track("tempest", { theme: "tempestsilver" }),
    challenges: [
      { id: "streak", n: 4 },
      { id: "pr-lifts", n: 4 },
      { id: "quests", n: 8 },
    ],
  },
  // Season 3, spring: blossom pink, and meadow green on the Pro row. Its challenges lean on trying and stretching.
  bloom: {
    id: "bloom",
    hue: "var(--color-bloom)",
    cardHex: "#ff7ae0",
    drop: "plates-bloom",
    rewards: track("bloom", { theme: "bloommeadow" }),
    challenges: [
      { id: "new-ex", n: 10 },
      { id: "stretch", n: 6 },
      { id: "bookends", n: 2 },
    ],
  },
  // Season 4, midsummer: bright sun yellow, and dusk coral on the Pro row.
  solstice: {
    id: "solstice",
    hue: "var(--color-solstice)",
    cardHex: "#ffe95c",
    drop: "plates-solstice",
    rewards: track("solstice", { theme: "solsticedusk" }),
    challenges: [
      { id: "goal-weeks", n: 70 },
      { id: "streak", n: 3 },
      { id: "pr-lifts", n: 5 },
    ],
  },
  // Season 5, autumn: maple-leaf red, and copper on the Pro row.
  maple: {
    id: "maple",
    hue: "var(--color-maple)",
    cardHex: "#ff4d4d",
    drop: "plates-maple",
    rewards: track("maple", { theme: "maplecopper" }),
    challenges: [
      { id: "bookends", n: 2 },
      { id: "prs", n: 4 },
      { id: "quests", n: 12 },
    ],
  },
  // Season 6, the holidays and New Year (to mid-January 2028): volcanic-glass violet, and ice on the Pro row.
  obsidian: {
    id: "obsidian",
    hue: "var(--color-obsidian)",
    cardHex: "#9d6bff",
    drop: "plates-obsidian",
    rewards: track("obsidian", { theme: "obsidianice" }),
    challenges: [
      { id: "streak", n: 5 },
      { id: "stretch", n: 5 },
      { id: "new-ex", n: 6 },
    ],
  },
};

/**
 * The built-in schedule, back to back through the end of 2027 (Melvin, 2026-11-19), every season ten weeks (the
 * length where meeting the goal about eight weeks in ten reaches tier 20; shorter ones can't), so the last one runs
 * over New Year to 16 January 2028. Every season starts and ends
 * on its own with no admin step and works offline. The admin Seasons tab can still move, resize, swap or take off
 * any that hasn't started; the server's list wins for an id it has.
 */
export const DEFAULT_SEASONS: readonly SeasonDef[] = [
  { id: "s1", kit: "ember", start: "2026-11-23", weeks: 10 },
  { id: "s2", kit: "tempest", start: "2027-02-01", weeks: 10 },
  { id: "s3", kit: "bloom", start: "2027-04-12", weeks: 10 },
  { id: "s4", kit: "solstice", start: "2027-06-21", weeks: 10 },
  { id: "s5", kit: "maple", start: "2027-08-30", weeks: 10 },
  { id: "s6", kit: "obsidian", start: "2027-11-08", weeks: 10 },
];
export const BUILT_IN = new Set(DEFAULT_SEASONS.map((s) => s.id));

/** Every Locker item and theme a kit can give, with where it comes from. */
export function kitOfReward(id: string): { kit: Kit; reward: SeasonReward | null } | null {
  for (const kit of Object.values(KITS)) {
    if (kit.drop === id) return { kit, reward: null };
    const reward = kit.rewards.find((r) => r.kind !== "badge" && r.id === id);
    if (reward) return { kit, reward };
  }
  return null;
}

// ---------- The schedule

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const localDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getTime();
};

/** Why a schedule can't be saved, or null. Shared by the admin panel and the server. */
export function scheduleProblem(list: unknown): string | null {
  if (!Array.isArray(list)) return "The schedule must be a list.";
  const seen = new Set<string>();
  const kits = new Set<string>();
  const rows: SeasonDef[] = [];
  for (const s of list as ScheduleRow[]) {
    if (!s || typeof s.id !== "string" || !/^[a-z0-9-]{1,24}$/.test(s.id)) return "Each season needs a short id (a-z, 0-9, -).";
    if (seen.has(s.id)) return `Season ${s.id} is listed twice.`;
    seen.add(s.id);
    if (isOff(s)) continue;
    rows.push(s);
    if (typeof s.kit !== "string" || !KITS[s.kit]) return `Season ${s.id} uses a reward set this app doesn't have.`;
    if (kits.has(s.kit)) return `Two seasons use the ${s.kit} reward set. Each set is used once.`;
    kits.add(s.kit);
    if (typeof s.start !== "string" || !DATE.test(s.start) || Number.isNaN(localDay(s.start))) return `Season ${s.id} needs a start date.`;
    if (new Date(localDay(s.start)).getDay() !== 1) return `Season ${s.id} must start on a Monday.`;
    if (!Number.isInteger(s.weeks) || s.weeks < MIN_WEEKS || s.weeks > MAX_WEEKS)
      return `Season ${s.id} must last ${MIN_WEEKS} to ${MAX_WEEKS} weeks.`;
  }
  const sorted = [...rows].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    if (localDay(sorted[i]!.start) < localDay(prev.start) + prev.weeks * WEEK - DAY / 2)
      return `Seasons ${prev.id} and ${sorted[i]!.id} overlap.`;
  }
  return null;
}

/**
 * Why a change to the schedule isn't allowed, or null: a season that has started can't move, change length or
 * reward set, or go, so nobody's tier or rewards change after the fact. `now` is the server's time.
 */
export function changeProblem(before: readonly SeasonDef[], after: readonly SeasonDef[], now: number): string | null {
  if (after.some(isOff)) return "Send the seasons themselves; a removed season is left out.";
  const shape = scheduleProblem(after);
  if (shape) return shape;
  // A day's grace either side of the start, for time zones.
  const started = (s: SeasonDef) => localDay(s.start) - DAY <= now;
  for (const old of before.filter(started)) {
    const next = after.find((s) => s.id === old.id);
    if (!next) return `Season ${old.id} has started, so it can't be removed.`;
    if (next.start !== old.start || next.weeks !== old.weeks || next.kit !== old.kit)
      return `Season ${old.id} has started, so it can't change.`;
  }
  for (const s of after.filter((s) => !before.some((b) => b.id === s.id))) {
    if (started(s)) return `A new season must start in the future (${s.id} starts ${s.start}).`;
  }
  return null;
}

/** The server's list merged over the built-in one: the server wins for an id it has, and `off` takes one away. */
export function mergeSchedule(server: readonly ScheduleRow[]): SeasonDef[] {
  const ids = new Set(server.map((s) => s.id));
  const kept = server.filter((s): s is SeasonDef => !isOff(s));
  return [...DEFAULT_SEASONS.filter((s) => !ids.has(s.id)), ...kept].sort((a, b) => a.start.localeCompare(b.start));
}

/** What to keep on the server for a schedule: the seasons, plus `off` for each built-in one left out. */
export function toSaved(next: readonly SeasonDef[]): ScheduleRow[] {
  const ids = new Set(next.map((s) => s.id));
  const off: SeasonOff[] = DEFAULT_SEASONS.filter((s) => !ids.has(s.id)).map((s) => ({ id: s.id, off: true }));
  return [...next.map((s) => ({ id: s.id, kit: s.kit, start: s.start, weeks: s.weeks })), ...off];
}

/** Rows a build can use: seasons whose kit it has, and `off` markers. */
const usable = (rows: readonly unknown[]) =>
  rows.filter((s): s is ScheduleRow => isOff(s) || (!!s && typeof (s as SeasonDef).kit === "string" && !!KITS[(s as SeasonDef).kit]));

const CACHE = "liftsmith.seasons";
let memo: SeasonDef[] | null = null;

/** The schedule this device knows: the last answer from the server, or the built-in one. */
export function seasonList(): SeasonDef[] {
  if (memo) return memo;
  let list: SeasonDef[] = [...DEFAULT_SEASONS];
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(CACHE) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    // A schedule this build can't read (a kit from a newer app) falls back to the seasons it can.
    if (Array.isArray(parsed)) {
      const known = usable(parsed);
      if (!scheduleProblem(known)) list = mergeSchedule(known);
    }
  } catch {
    // Private mode or junk: the built-in schedule.
  }
  memo = list;
  return list;
}

/** Keeps the server's schedule (remoteSeasons.ts). Returns whether it changed. */
export function rememberSchedule(list: readonly ScheduleRow[]): boolean {
  const known = usable(list);
  if (scheduleProblem(known)) return false;
  const next = mergeSchedule(known);
  const changed = JSON.stringify(next) !== JSON.stringify(seasonList());
  try {
    localStorage.setItem(CACHE, JSON.stringify(known));
  } catch {
    // Not kept: it's fetched again next time.
  }
  memo = next;
  return changed;
}

/** For tests. */
export function setScheduleForTest(list: readonly SeasonDef[] | null) {
  memo = list ? mergeSchedule(list) : null;
}

/** A season's days in the lifter's calendar weeks: from the start of the week holding its first day. */
export function seasonWindow(def: SeasonDef): { start: number; end: number } {
  const start = weekOf(localDay(def.start) + DAY / 2);
  let end = start;
  for (let i = 0; i < def.weeks; i++) end = weekOf(end + WEEK + DAY);
  return { start, end };
}

/** The kit's name in the app's language ("Ember"). */
export const kitName = (kit: string) => t(`ssn.kit.${kit}` as MessageKey);
/** "Season 1: Ember". */
export function seasonTitle(def: SeasonDef, list: readonly SeasonDef[] = seasonList()): string {
  return t("ssn.title", { n: list.findIndex((s) => s.id === def.id) + 1, name: kitName(def.kit) });
}

// ---------- Points

export interface WeekPoints {
  start: number;
  days: number;
  goal: number;
  /** Points from training days, the goal bonus (twice after a missed week) and quests, before the finale doubles them. */
  dayPoints: number;
  goalBonus: number;
  catchUp: boolean;
  quests: number;
  finale: boolean;
  total: number;
}

export interface Challenge {
  id: ChallengeId;
  goal: number;
  have: number;
  done: boolean;
}

export interface TierReward extends SeasonReward {
  owned: boolean;
}

export interface SeasonState {
  def: SeasonDef;
  kit: Kit;
  /** 1 for the first season on the schedule. */
  n: number;
  title: string;
  start: number;
  end: number;
  status: "upcoming" | "live" | "ended";
  /** The week now (0-based) while live. */
  week: number;
  daysLeft: number;
  points: number;
  tier: number;
  /** Points into the next tier and how many it takes (0 at the last tier, where prestige starts). */
  into: number;
  span: number;
  prestige: number;
  weeks: WeekPoints[];
  challenges: Challenge[];
  /** The rare drop came from a new best this season. */
  drop: boolean;
  /** Had Pro at some point during the season (a `pro` event in one of its months): the bonus row counts. */
  pro: boolean;
  rewards: TierReward[];
}

const trainingDays = (stats: Stats, from: number, to: number) => {
  const days = new Map<number, Set<string>>();
  for (const s of stats.sessions) {
    if (s.start < from || s.start >= to) continue;
    const w = weekOf(s.start);
    days.set(w, (days.get(w) ?? new Set()).add(new Date(s.start).toDateString()));
  }
  return days;
};

const monthOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Points earned in one week of a season. Exported for tests. */
export function weekPoints(
  days: number,
  goalDays: number,
  quests: number,
  missedBefore: boolean,
  finale: boolean,
): Omit<WeekPoints, "start"> {
  const goal = Math.max(1, goalDays);
  const counted = Math.min(goal, days);
  const dayPoints = Math.round((counted * WEEK_DAY_POINTS) / goal);
  const met = days >= goal;
  const catchUp = met && missedBefore;
  const goalBonus = met ? GOAL_BONUS * (catchUp ? 2 : 1) : 0;
  const q = quests * QUEST_POINTS;
  const base = dayPoints + goalBonus + q;
  return { days, goal, dayPoints, goalBonus, catchUp, quests: q, finale, total: finale ? base * 2 : base };
}

/** The tier, points into the next one and prestige stars for a points total. */
export function tierOf(points: number): { tier: number; into: number; span: number; prestige: number } {
  const top = TIERS * TIER_POINTS;
  if (points >= top)
    return {
      tier: TIERS,
      into: (points - top) % PRESTIGE_POINTS,
      span: PRESTIGE_POINTS,
      prestige: Math.floor((points - top) / PRESTIGE_POINTS),
    };
  return { tier: Math.floor(points / TIER_POINTS), into: points % TIER_POINTS, span: TIER_POINTS, prestige: 0 };
}

/** How many a challenge asks for in a season of `weeks` weeks (a share of the weeks, or capped by them). */
export function challengeGoal(c: ChallengeDef, weeks: number): number {
  if (c.id === "goal-weeks") return Math.ceil((weeks * c.n) / 100);
  if (c.id === "bookends") return 2;
  if (c.id === "streak") return Math.min(c.n, weeks);
  return c.n;
}

/** Whether a new best (by its exercise and time) drops the season's rare item, seeded so every device agrees. */
export const drops = (seasonId: string, exerciseId: string, at: number) => rng(hash(`drop:${seasonId}:${exerciseId}:${at}`))() < DROP_ODDS;

/** One season worked out from the event log. */
export function seasonState(
  def: SeasonDef,
  events: readonly AppEvent[],
  stats: Stats,
  profile: Profile,
  now: number,
  list = seasonList(),
): SeasonState {
  const kit = KITS[def.kit]!;
  const { start, end } = seasonWindow(def);
  const status = now < start ? "upcoming" : now >= end ? "ended" : "live";
  const days = trainingDays(stats, start, end);
  const goal = Math.max(1, profile.daysPerWeek);
  const weeks: WeekPoints[] = [];
  let missed = false;
  let goalWeeks = 0;
  let run = 0;
  let longest = 0;
  let questsDone = 0;
  const met: boolean[] = [];
  for (let w = start, i = 0; w < end && w <= now; w = weekOf(w + WEEK + DAY), i++) {
    const n = days.get(w)?.size ?? 0;
    const quests = questsFor(events, profile, w).filter((q) => q.done).length;
    const p = weekPoints(n, goal, quests, missed, i === def.weeks - 1);
    weeks.push({ start: w, ...p });
    questsDone += quests;
    met.push(n >= goal);
    if (n >= goal) {
      goalWeeks++;
      longest = Math.max(longest, ++run);
    } else run = 0;
    // Only a finished week can be missed.
    const over = weekOf(w + WEEK + DAY) <= now;
    missed = over && n < goal;
  }
  const prs = stats.prs.filter((p) => p.at >= start && p.at < end);
  const sets = events.filter((e): e is SetEvent => e.type === "set");
  const before = new Set(sets.filter((s) => s.at < start).map((s) => s.exerciseId));
  const fresh = new Set(sets.filter((s) => s.at >= start && s.at < end && !before.has(s.exerciseId)).map((s) => s.exerciseId)).size;
  const have: Record<ChallengeId, number> = {
    "goal-weeks": goalWeeks,
    prs: prs.length,
    "new-ex": fresh,
    streak: longest,
    "pr-lifts": new Set(prs.map((p) => p.exerciseId)).size,
    quests: questsDone,
    bookends: (met[0] ? 1 : 0) + (met.length === def.weeks && met[def.weeks - 1] ? 1 : 0),
    stretch: stats.stretchDays.filter((d) => d >= start && d < end).length,
  };
  const challenges: Challenge[] = kit.challenges.map((c) => {
    const need = challengeGoal(c, def.weeks);
    return { id: c.id, goal: need, have: Math.min(need, have[c.id]), done: have[c.id] >= need };
  });
  const points = weeks.reduce((n, w) => n + w.total, 0) + challenges.filter((c) => c.done).length * CHALLENGE_POINTS;
  const level = tierOf(points);
  const months = new Set<string>();
  for (let m = start; m < end; m += 28 * DAY) months.add(monthOf(m));
  months.add(monthOf(end - 1));
  const pro = events.some((e) => e.type === "pro" && months.has(e.month));
  const drop = prs.some((p) => drops(def.id, p.exerciseId, p.at));
  const rewards = kit.rewards.map((r) => ({ ...r, owned: level.tier >= r.tier && (!r.pro || pro) }));
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return {
    def,
    kit,
    n: list.findIndex((s) => s.id === def.id) + 1,
    title: seasonTitle(def, list),
    start,
    end,
    status,
    week: status === "live" ? weeks.length - 1 : -1,
    daysLeft: status === "live" ? Math.max(1, Math.round((end - today.getTime()) / DAY)) : 0,
    points,
    ...level,
    weeks,
    challenges,
    drop,
    pro,
    rewards,
  };
}

/** The season to show: the one running, else the next one if it starts within two weeks, else the last one if it ended in the last two weeks. */
export function currentSeason(
  events: readonly AppEvent[],
  stats: Stats,
  profile: Profile,
  now: number,
  list = seasonList(),
): SeasonState | null {
  const live = list.find((d) => {
    const w = seasonWindow(d);
    return now >= w.start && now < w.end;
  });
  if (live) return seasonState(live, events, stats, profile, now, list);
  const next = list.find((d) => seasonWindow(d).start > now && seasonWindow(d).start - now <= 14 * DAY);
  if (next) return seasonState(next, events, stats, profile, now, list);
  const last = [...list].reverse().find((d) => seasonWindow(d).end <= now && now - seasonWindow(d).end <= 14 * DAY);
  return last ? seasonState(last, events, stats, profile, now, list) : null;
}

export interface SeasonOwned {
  /** Locker items and themes from every season so far. */
  items: Set<string>;
  /** Season badges earned: the season and the tier. */
  badges: { season: SeasonDef; tier: Tier }[];
}

// Worked out once per event list, profile and hour (game() and the theme picker both ask).
const OWNED = new WeakMap<readonly AppEvent[], { key: string; value: SeasonOwned }>();

/** Everything seasons have given the lifter, from every season that has started. */
export function seasonOwned(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number, list = seasonList()): SeasonOwned {
  const key = `${Math.floor(now / 3600_000)}:${profile.daysPerWeek}:${list.map((s) => `${s.id}${s.start}${s.weeks}`).join()}`;
  const hit = OWNED.get(events);
  if (hit?.key === key) return hit.value;
  const items = new Set<string>();
  const badges: SeasonOwned["badges"] = [];
  for (const def of list) {
    if (seasonWindow(def).start > now) continue;
    const s = seasonState(def, events, stats, profile, now, list);
    for (const r of s.rewards) {
      if (!r.owned) continue;
      if (r.kind === "badge") badges.push({ season: def, tier: r.id as Tier });
      else items.add(r.id);
    }
    if (s.drop) items.add(s.kit.drop);
  }
  const value = { items, badges };
  OWNED.set(events, { key, value });
  return value;
}

/** Can this season reward still be earned now (its season is live or about to start)? */
export function stillOpen(id: string, now: number, list = seasonList()): boolean {
  const from = kitOfReward(id);
  if (!from) return false;
  const def = list.find((s) => s.kit === from.kit.id);
  return !!def && seasonWindow(def).end > now;
}

/** The season reward a tier brings, as a line ("Tier 12: Ember theme and app icon"). */
export function rewardLabel(r: SeasonReward, kit: Kit): string {
  if (r.kind === "badge") return t("ssn.reward.badge", { name: kitName(kit.id), tier: t(`tier.${r.id}` as MessageKey) });
  if (r.kind === "theme") return t("ssn.reward.theme", { name: t(`theme.${r.id}` as MessageKey) });
  const kind = r.id.startsWith("av-") ? "avatar" : "accent";
  return t(`ssn.reward.${kind}`, { name: t(`cos.${r.id}` as MessageKey) });
}

/** Seasons are on unless the lifter turned them off (Settings › Look and feel; Melvin, 2026-11-17). */
export const seasonsOn = (p: Pick<Profile, "delight">) => p.delight?.seasons !== false;

/** What one workout did for the season: the points, the tier before and after and the rewards it reached (Done). */
export interface SeasonGain {
  points: number;
  from: number;
  to: number;
  /** Tier rewards owned now that weren't before, in tier order. */
  rewards: TierReward[];
  /** This workout's new best dropped the season's rare item. */
  drop: boolean;
}

/** Compares the season without and with a workout. Null when the season isn't running or nothing moved. */
export function seasonGain(before: SeasonState, after: SeasonState): SeasonGain | null {
  if (after.status !== "live" || before.def.id !== after.def.id) return null;
  const points = Math.max(0, after.points - before.points);
  const had = new Set(before.rewards.filter((r) => r.owned).map((r) => `${r.tier}:${r.id}`));
  const rewards = after.rewards.filter((r) => r.owned && !had.has(`${r.tier}:${r.id}`)).sort((a, b) => a.tier - b.tier);
  const drop = after.drop && !before.drop;
  if (!points && !rewards.length && !drop) return null;
  return { points, from: before.tier, to: after.tier, rewards, drop };
}

/**
 * The season as the reminder planner needs it (messages.ts `season`): its title, length, first day, finale week,
 * end and the tier now. Only while it's running or about to start, and never when seasons are off.
 */
export function seasonReminder(
  s: SeasonState | null,
): { title: string; weeks: number; start: number; finale: number; end: number; tier: number } | null {
  if (!s || s.status === "ended") return null;
  const finale = weekOf(s.end - DAY / 2);
  return { title: s.title, weeks: s.def.weeks, start: s.start, finale, end: s.end, tier: s.tier };
}
