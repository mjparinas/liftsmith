import { blockWeek } from "./block";
import { barFor } from "./loads";
import { smallestJump } from "./plates";
import { repRange, sessionsOf, TIMED } from "./progression";
import type { Call } from "./readiness";
import type { ItemWhy } from "./why";
import type { AppEvent, Exercise, Gym, Profile } from "./types";
import { fmtNum, fromKg } from "./units";
import { date, num, relative, t } from "./i18n";

// "Why this weight?" (Melvin picked it, 2026-11-09). Every suggested weight and rep count can be tapped
// to see the reasons behind it, in plain words, rebuilt from the same data progression.ts used: the last
// session's sets, the rule that applied, the block week's reps in reserve, today's call and how the
// plates round it. Nothing here changes the plan; it only explains it.

export interface Why {
  /** One short headline, e.g. "One more rep than last time". */
  title: string;
  /** Reasons, most important first. */
  lines: string[];
}

const SHARE = { new: 0.7, intermediate: 1, advanced: 1.25 } as const;

function day(ms: number, now: number): string {
  const d = Math.floor((now - ms) / 86400_000);
  if (d <= 0) return t("explain.earlierToday");
  if (d < 7) return relative(-d, "day");
  return t("explain.on", { date: date(ms, { month: "short", day: "numeric" }) });
}

export interface ExplainInput {
  ex: Exercise;
  /** The suggestion being explained (kg, reps, RIR and the short note under the numbers). */
  target: { weight: number; reps: number; rir: number; note: string };
  events: readonly AppEvent[];
  profile: Profile;
  gym: Gym;
  now: number;
  call?: Call;
  readiness?: number;
  /** Leave out sets from this session (the workout in progress). */
  sessionId?: string;
  /** why.ts's reasons for this plan item, so the sheet also says why this exercise and this many sets. */
  item?: ItemWhy;
}

export function explain({ ex, target, events, profile, gym, now, call = "normal", readiness, sessionId, item }: ExplainInput): Why {
  const unit = gym.unit;
  const w = (kg: number) => `${fmtNum(fromKg(kg, unit))} ${unit}`;
  const timed = TIMED.has(ex.id);
  const repWord = timed ? t("explain.seconds") : t("explain.reps");
  const count = (n: number) => t(timed ? "explain.secondsN" : "explain.repsN", { count: n });
  const [lo, hi] = repRange(ex, profile.goal);
  const wk = blockWeek(profile, now);
  const past = sessionsOf(events, ex.id).filter((s) => s[0].sessionId !== sessionId);
  const last = past[0];
  const lines: string[] = [];
  let title = target.note.split(" · ")[0];

  if (!last) {
    if (ex.load === "bodyweight") lines.push(t("explain.firstBw", { target: count(target.reps) }));
    else {
      lines.push(t("explain.firstLoad", { pct: Math.round(ex.start * SHARE[profile.experience] * 100), bw: w(profile.bodyweight), level: t(`explain.level.${profile.experience}`) }));
      lines.push(t("explain.firstLight"));
    }
    title = t("explain.firstTitle");
  } else {
    const sets = [...last].sort((a, b) => a.at - b.at);
    const done = sets.map((s) => (ex.load === "bodyweight" && !s.weight ? num(s.reps) : `${w(s.weight)} × ${num(s.reps)}`)).join(", ");
    const tgt = sets[0].targetReps;
    lines.push(t("explain.last", { when: day(sets[0].at, now), sets: done, target: count(tgt) }));
    const hitAll = sets.every((s) => s.reps >= s.targetReps);
    const bigMiss = sets.some((s) => s.reps <= s.targetReps - 2);
    const fb = [...events].reverse().find((e) => e.type === "feedback" && e.exerciseId === ex.id && e.sessionId === sets[0].sessionId);
    const rating = fb?.type === "feedback" ? fb.rating : 0;
    if (rating > 0) lines.push(t("explain.feltEasy"));
    if (rating < 0) lines.push(t("explain.feltHard"));
    if (wk.deload) lines.push(t("explain.deload"));
    else if (bigMiss && rating >= 0) lines.push(t("explain.bigMiss", { unit: repWord, lo }));
    else if (hitAll && tgt >= hi) lines.push(t("explain.top", { unit: repWord, lo, hi }));
    else if (hitAll && ex.load !== "bodyweight") lines.push(t(timed ? "explain.oneMoreTimed" : "explain.oneMoreRep", { hi, unit: repWord }));
    else if (hitAll) lines.push(t(timed ? "explain.oneMoreBwTimed" : "explain.oneMoreBw"));
    else lines.push(t("explain.same", { target: num(tgt) }));
  }

  // Why this exercise and this set count come from why.ts, the same words Today's plan shows.
  if (item?.pick) lines.unshift(t("explain.picked", { pick: item.pick }));
  if (item?.sets && !wk.deload && call !== "recover") lines.push(`${item.sets.charAt(0).toUpperCase()}${item.sets.slice(1)}.`);

  if (!wk.deload) lines.push(t("explain.rir", { week: wk.label, count: target.rir }));

  const scored = readiness !== undefined;
  if (call === "recover") lines.push(scored ? t("explain.easyScore", { score: readiness }) : t("explain.easy"));
  if (call === "push" && target.note.includes(t("note.push"))) lines.push(scored ? t("explain.pushScore", { score: readiness }) : t("explain.push"));
  if (target.note.includes(t("note.challenge"))) lines.push(t("explain.challenge"));

  if (ex.load === "barbell") {
    const jump = smallestJump(gym.plates);
    const bar = barFor(ex, gym);
    if (jump > 0) lines.push(t("explain.barbell", { bar: `${fmtNum(bar.weight)} ${unit}`, jump: `${fmtNum(jump)} ${unit}` }));
  } else if (ex.load === "dumbbell" && gym.dumbbells.length) lines.push(t("explain.dumbbell"));
  else if (ex.load === "machine") lines.push(t("explain.machine", { step: `${fmtNum(gym.machineStep || (unit === "kg" ? 2.5 : 5))} ${unit}` }));

  return { title, lines };
}
