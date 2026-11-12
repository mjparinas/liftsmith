import { TIER_LABEL, type Achievement, type Tier } from "./achievements";
import type { Pr, SessionSummary } from "./derive";
import { exercise, EXERCISE_BY_ID } from "./exercises";
import type { Game } from "./game";
import { date, t } from "./i18n";
import type { CardData } from "./shareImage";
import { SITE_URL } from "./site";
import { MUSCLE_LABEL, type Muscle, type Unit } from "./types";
import { fmtNum, fromKg } from "./units";

// What goes on each share card (Melvin, 2026-11-11: "opportunities to share workouts and/or milestones").
// Pure, so it's tested in node. Privacy is decided here, never in the drawing code:
// - heart rate, body weight, body fat, cycle data, gyms and places never appear on any card;
// - weights (kg or lb) appear only while the lifter leaves "Show weights" on;
// - the name appears only when they turn "Show my name" on (off by default).

export type ShareKind = "workout" | "pr" | "badge" | "level" | "trend" | "recap" | "challenge";

export interface ShareOptions {
  /** Show weights lifted (kg or lb). On by default. */
  weights: boolean;
  /** The lifter's name, or null to leave it off (the default). */
  name: string | null;
}

export interface Shareable {
  /** Stable within a screen, e.g. "pr-bench". */
  id: string;
  kind: ShareKind;
  /** Short label for the picker chip ("Workout", "Bench press PR"). */
  label: string;
  /** The exercise whose 3D figure is the card's art, if any. */
  figure?: string;
  /** File name without extension. */
  file: string;
  card(o: ShareOptions): CardData;
}

export interface ShareContext {
  unit: Unit;
  game: Pick<Game, "level" | "streak">;
  accent?: string;
}

/** Hex values of the tier colours for the (always dark) card, matching the dark tokens in globals.css. */
export const TIER_HEX: Record<Tier, string> = { bronze: "#c98a55", silver: "#c3ccd8", gold: "#f2c14e", platinum: "#9be7ff" };

const footer = (g: ShareContext["game"]) =>
  g.streak.weeks > 0
    ? t("done.footer", { level: g.level.level, title: g.level.title, count: g.streak.weeks })
    : t("done.level", { level: g.level.level, title: g.level.title });
const day = (ms: number) => date(ms, { weekday: "long", month: "long", day: "numeric" });
const w = (kg: number, unit: Unit) => `${fmtNum(fromKg(kg, unit))} ${unit}`;
const clock = (s: number) => {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, "0")}` : t("card.minutes", { count: m, n: fmtNum(m) });
};

/** The muscles a workout worked most (primary muscles, by how many of its exercises hit them). */
export function musclesWorked(exerciseIds: readonly string[], max = 4): Muscle[] {
  const n = new Map<Muscle, number>();
  for (const id of exerciseIds) for (const m of EXERCISE_BY_ID.get(id)?.primary ?? []) n.set(m, (n.get(m) ?? 0) + 1);
  return [...n.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([m]) => m);
}

/** The lift to draw: the first compound lift that has a demo, else the first exercise. */
export function figureFor(exerciseIds: readonly string[]): string | undefined {
  return exerciseIds.find((id) => EXERCISE_BY_ID.get(id)?.compound) ?? exerciseIds.find((id) => EXERCISE_BY_ID.has(id));
}

const prLine = (p: Pr, o: ShareOptions, unit: Unit) =>
  o.weights
    ? t("card.prLine", { name: exercise(p.exerciseId).name, weight: w(p.weight, unit), reps: p.reps })
    : t("card.prLineNoWeight", { name: exercise(p.exerciseId).name });

export function workoutShare(
  s: SessionSummary,
  prs: readonly Pr[],
  badges: readonly { a: Achievement; tier: Tier }[],
  ctx: ShareContext,
): Shareable {
  return {
    id: `workout-${s.sessionId}`,
    kind: "workout",
    label: t("card.pick.workout"),
    figure: figureFor(s.exercises),
    file: `liftsmith-${new Date(s.start).toISOString().slice(0, 10)}`,
    card: (o) => ({
      kicker: day(s.start),
      headline: prs.length ? t("done.prsShare", { count: prs.length }) : t("done.title"),
      tiles: [
        [t("done.time"), clock(s.seconds)],
        [t("done.sets"), fmtNum(s.sets)],
        ...(o.weights ? ([[t("done.volume"), w(s.volume, ctx.unit)]] as [string, string][]) : []),
      ],
      chips: musclesWorked(s.exercises).map((m) => MUSCLE_LABEL[m]),
      lines: [
        ...prs.slice(0, 3).map((p) => `🏆 ${prLine(p, o, ctx.unit)}`),
        ...badges.slice(0, 2).map((b) => `${b.a.icon} ${b.a.name} · ${TIER_LABEL[b.tier]}`),
      ].slice(0, 3),
      footer: footer(ctx.game),
      accent: ctx.accent,
      name: o.name,
    }),
  };
}

/** A personal best. `previous` is the best before it on the same lift, when there was one. */
export function prShare(p: Pr, previous: Pr | null, ctx: ShareContext): Shareable {
  const ex = exercise(p.exerciseId);
  return {
    id: `pr-${p.exerciseId}-${p.at}`,
    kind: "pr",
    label: t("card.pick.pr", { name: ex.name }),
    figure: p.exerciseId,
    file: `liftsmith-pr-${p.exerciseId}`,
    card: (o) => {
      const gain = previous ? p.e1rm - previous.e1rm : 0;
      return {
        kicker: `${t("card.kicker.pr")} · ${date(p.at, { month: "long", day: "numeric" })}`,
        headline: ex.name,
        big: o.weights
          ? { value: `${w(p.weight, ctx.unit)} × ${p.reps}`, label: t("card.e1rm", { weight: w(p.e1rm, ctx.unit) }) }
          : { value: t("card.reps", { count: p.reps, n: fmtNum(p.reps) }), label: t("card.newBest") },
        tiles: o.weights && previous && gain > 0 ? [[t("card.up"), `+${w(gain, ctx.unit)}`]] : [],
        lines: [],
        footer: footer(ctx.game),
        accent: ctx.accent,
        name: o.name,
      };
    },
  };
}

export function badgeShare(a: Achievement, tier: Tier, ctx: ShareContext): Shareable {
  return {
    id: `badge-${a.id}-${tier}`,
    kind: "badge",
    label: t("card.pick.badge", { name: a.name }),
    file: `liftsmith-badge-${a.id}`,
    card: (o) => ({
      kicker: t("card.kicker.badge"),
      headline: a.name,
      big: { value: TIER_LABEL[tier], label: a.detail },
      medal: { icon: a.icon, colour: TIER_HEX[tier] },
      tiles: [],
      lines: [],
      footer: footer(ctx.game),
      accent: ctx.accent,
      name: o.name,
    }),
  };
}

export function levelShare(g: Pick<Game, "level" | "streak" | "xp" | "badges">, workouts: number, ctx: ShareContext): Shareable {
  return {
    id: `level-${g.level.level}`,
    kind: "level",
    label: t("card.pick.level"),
    file: `liftsmith-level-${g.level.level}`,
    card: (o) => ({
      kicker: t("card.kicker.level"),
      headline: g.level.title,
      big: { value: t("progress.level", { level: g.level.level }), label: t("progress.xp", { xp: g.xp }) },
      medal: { icon: String(g.level.level), colour: "#a78bfa" },
      tiles: [
        [t("card.workouts"), fmtNum(workouts)],
        [t("card.streak"), fmtNum(g.streak.weeks)],
        [t("card.badges"), fmtNum(g.badges.earned)],
      ],
      lines: [],
      footer: footer(ctx.game),
      accent: ctx.accent,
      name: o.name,
    }),
  };
}

/** A lift going up: estimated one-rep max from `from` to `to` over `weeks`. */
export function trendShare(tr: { exerciseId: string; pct: number; weeks: number; from: number; to: number }, ctx: ShareContext): Shareable {
  const ex = exercise(tr.exerciseId);
  return {
    id: `trend-${tr.exerciseId}`,
    kind: "trend",
    label: t("card.pick.trend", { name: ex.name }),
    figure: tr.exerciseId,
    file: `liftsmith-progress-${tr.exerciseId}`,
    card: (o) => ({
      kicker: t("card.kicker.trend", { count: tr.weeks, n: fmtNum(tr.weeks) }),
      headline: ex.name,
      big: { value: `+${fmtNum(Math.round(tr.pct))}%`, label: t("card.trendLabel") },
      tiles: o.weights
        ? [
            [t("card.before"), w(tr.from, ctx.unit)],
            [t("card.now"), w(tr.to, ctx.unit)],
          ]
        : [],
      lines: [],
      footer: footer(ctx.game),
      accent: ctx.accent,
      name: o.name,
    }),
  };
}

/**
 * A finished friend challenge (Friends gap list 3, item 5). Only the lifter's own place and total go on it, never a
 * friend's name or score: they didn't choose to share. `total` is the total already in words ("42 sets").
 */
export function challengeShare(
  ch: { id: string; name: string; days: number },
  r: { place: number; of: number; won: boolean; tie: boolean },
  total: string,
  ctx: ShareContext,
): Shareable {
  const medal = r.place === 1 ? TIER_HEX.gold : r.place === 2 ? TIER_HEX.silver : r.place === 3 ? TIER_HEX.bronze : "#a78bfa";
  const weeks = Math.round(ch.days / 7);
  return {
    id: `challenge-${ch.id}`,
    kind: "challenge",
    label: t("card.pick.challenge"),
    file: `liftsmith-challenge-${ch.id}`,
    card: (o) => ({
      kicker: t("card.kicker.challenge"),
      headline: ch.name,
      big: {
        value: r.won ? t(r.tie ? "card.challenge.tied" : "card.challenge.won") : t("card.challenge.place", { place: fmtNum(r.place) }),
        label: t("card.challenge.of", { n: fmtNum(r.of) }),
      },
      medal: { icon: String(r.place), colour: medal },
      tiles: [
        [t("card.challenge.total"), total],
        [t("card.challenge.length"), t("card.challenge.weeks", { count: weeks, n: fmtNum(weeks) })],
      ],
      lines: [],
      footer: footer(ctx.game),
      accent: ctx.accent,
      name: o.name,
    }),
  };
}

/** The best before this one on the same lift (by estimated one-rep max), or null for a first best. */
export function previousBest(all: readonly Pr[], p: Pr): Pr | null {
  let best: Pr | null = null;
  for (const x of all) if (x.exerciseId === p.exerciseId && x.at < p.at && (!best || x.e1rm > best.e1rm)) best = x;
  return best;
}

/**
 * Text sent with the image, for apps that take a caption: what it shows, then the site's address on its own line, so a post on X,
 * Reddit or a group chat carries a link people can tap (the card itself only names the site; 2026-11-12, traffic plan).
 */
export function shareText(c: CardData): string {
  return `${[c.headline, c.big?.value, c.footer].filter(Boolean).join(" · ")}\n${SITE_URL}/`;
}

/** A past workout and each personal best set in it, for the share sheet on Progress › History. */
export function sessionShares(s: SessionSummary, allPrs: readonly Pr[], ctx: ShareContext): Shareable[] {
  const end = s.start + s.seconds * 1000 + 60_000;
  const prs = allPrs.filter((p) => p.at >= s.start && p.at <= end);
  return [workoutShare(s, prs, [], ctx), ...prs.map((p) => prShare(p, previousBest(allPrs, p), ctx))];
}
