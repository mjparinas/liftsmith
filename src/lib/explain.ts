import { blockWeek } from "./block";
import { barFor } from "./loads";
import { smallestJump } from "./plates";
import { repRange, sessionsOf, TIMED } from "./progression";
import type { Call } from "./readiness";
import type { ItemWhy } from "./why";
import type { AppEvent, Exercise, Gym, Profile } from "./types";
import { fmtNum, fromKg } from "./units";

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

const LEVEL_WORD = { new: "a new lifter", intermediate: "an intermediate lifter", advanced: "an advanced lifter" } as const;
const SHARE = { new: 0.7, intermediate: 1, advanced: 1.25 } as const;

function day(ms: number, now: number): string {
  const d = Math.floor((now - ms) / 86400_000);
  if (d <= 0) return "earlier today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return `on ${new Date(ms).toLocaleDateString("en", { month: "short", day: "numeric" })}`;
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
  const repWord = timed ? "seconds" : "reps";
  const [lo, hi] = repRange(ex, profile.goal);
  const wk = blockWeek(profile, now);
  const past = sessionsOf(events, ex.id).filter((s) => s[0].sessionId !== sessionId);
  const last = past[0];
  const lines: string[] = [];
  let title = target.note.split(" · ")[0];

  if (!last) {
    if (ex.load === "bodyweight") lines.push(`This is your first time, so start at ${target.reps} ${repWord} and find your level.`);
    else {
      lines.push(`This is your first time, so it starts from about ${Math.round(ex.start * SHARE[profile.experience] * 100)}% of your body weight (${w(profile.bodyweight)}), the usual start for ${LEVEL_WORD[profile.experience]}.`);
      lines.push("It's on the light side on purpose. If it feels easy, say so after the last set and next time goes up.");
    }
    title = "A cautious first try";
  } else {
    const sets = [...last].sort((a, b) => a.at - b.at);
    const list = sets.map((s) => (ex.load === "bodyweight" && !s.weight ? `${s.reps}` : `${w(s.weight)} × ${s.reps}`)).join(", ");
    const tgt = sets[0].targetReps;
    lines.push(`Last time (${day(sets[0].at, now)}): ${list}, aiming for ${tgt} ${repWord}.`);
    const hitAll = sets.every((s) => s.reps >= s.targetReps);
    const bigMiss = sets.some((s) => s.reps <= s.targetReps - 2);
    const fb = [...events].reverse().find((e) => e.type === "feedback" && e.exerciseId === ex.id && e.sessionId === sets[0].sessionId);
    const rating = fb?.type === "feedback" ? fb.rating : 0;
    if (rating > 0) lines.push("You said it felt too easy, so it moves up a step more.");
    if (rating < 0) lines.push("You said it felt too hard, so it backs off a step.");
    if (wk.deload) lines.push(`It's the deload week, so it's about 10% lighter with fewer sets to let you recover before the next block.`);
    else if (bigMiss && rating >= 0) lines.push(`A set fell 2 or more ${repWord} short, so the weight drops one step and the ${repWord} go back to ${lo}.`);
    else if (hitAll && tgt >= hi) lines.push(`You hit every set at the top of your ${lo}–${hi} range, so the weight goes up one step and the ${repWord} go back to ${lo}.`);
    else if (hitAll && ex.load !== "bodyweight") lines.push(`You hit every set, so you get one more ${timed ? "second block" : "rep"} at the same weight. At ${hi} ${repWord} the weight goes up.`);
    else if (hitAll) lines.push(`You hit every set, so it's one more ${timed ? "step" : "rep"} this time.`);
    else lines.push(`Not every set reached ${tgt}, so it stays the same until they all do.`);
  }

  // Why this exercise and this set count come from why.ts, the same words Today's plan shows.
  if (item?.pick) lines.unshift(`Picked today: ${item.pick}.`);
  if (item?.sets && !wk.deload && call !== "recover") lines.push(`${item.sets.charAt(0).toUpperCase()}${item.sets.slice(1)}.`);

  if (!wk.deload) lines.push(`${wk.label} of this block: leave about ${target.rir} ${target.rir === 1 ? "rep" : "reps"} in reserve. The reserve shrinks each week, then a deload resets it.`);

  if (call === "recover") lines.push(`Today is an easy day${readiness !== undefined ? ` (readiness ${readiness})` : ""}: one step lighter, one more rep in reserve and one set fewer.`);
  if (call === "push" && /Push day/.test(target.note)) lines.push(`Today is a push day${readiness !== undefined ? ` (readiness ${readiness})` : ""}, so the first big lift goes one rep closer to failure.`);
  if (/Challenge/.test(target.note)) lines.push("Challenge: on the last set, do as many good reps as you can and log what you got. It won't count as a miss.");

  if (ex.load === "barbell") {
    const jump = smallestJump(gym.plates);
    const bar = barFor(ex, gym);
    if (jump > 0) lines.push(`With your plates, this bar (${fmtNum(bar.weight)} ${unit}) moves in ${fmtNum(jump)} ${unit} steps, and every weight shown is one you can actually load.`);
  } else if (ex.load === "dumbbell" && gym.dumbbells.length) lines.push("Rounded to the nearest dumbbell this gym has.");
  else if (ex.load === "machine") lines.push(`Rounded to this gym's ${fmtNum(gym.machineStep || (unit === "kg" ? 2.5 : 5))} ${unit} pin steps.`);

  return { title, lines };
}
