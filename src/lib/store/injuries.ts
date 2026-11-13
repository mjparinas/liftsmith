import { exercise } from "../exercises";
import { alternatives, injuredTarget, injuryPass, type PlanItem } from "../generator";
import { activeInjuries, effectFor } from "../injury";
import { target } from "../progression";
import type { BodyPart, InjuryRuleEvent } from "../types";
import { warmupFor } from "../warmup";
import { persistActive, setsDone, uid, type Ctx } from "./shared";
import { loadItem } from "./workout";

// Injury mode (injury.ts): logging, rules, pain ratings, graded return, healed. Each change replans
// Today and the rest of a running workout.
// One slice of the app's state (store.ts puts them together).

// An injury change replans Today, and the rest of a workout in progress: exercises not started yet
// that the injury now skips are swapped for one that avoids it (or dropped), lighter ones re-targeted.
function afterInjuryChange(c: Ctx) {
  const { set, get, gym } = c;
  const a = get().active;
  const g = gym();
  // A rehab routine from the lifter's physio stays as written mid-workout too (trainer-mode.md, physio support).
  if (a && g && !a.plan.rehab) {
    const { events, profile } = get();
    const hurt = activeInjuries(events);
    const now = Date.now();
    const items: PlanItem[] = a.plan.items.slice(0, a.index);
    for (const item of a.plan.items.slice(a.index)) {
      // The physio's rehab beside the lifting stays as written too, and cardio isn't for the injury to change.
      if (item.part || setsDone(events, a.sessionId, item.exerciseId) > 0) {
        items.push(item);
        continue;
      }
      let ex = exercise(item.exerciseId);
      if (item.setTargets) {
        // A program's sets: keep its scheme, lighten or swap them in place (once).
        if (item.injuryPct && effectFor(ex, hurt)?.action !== "skip") items.push(item);
        else items.push(...injuryPass({ ...a.plan, items: [item] }, events, profile, g, now).items);
        continue;
      }
      if (effectFor(ex, hurt)?.action === "skip") {
        const alt = alternatives(
          ex.id,
          g,
          [...items, ...a.plan.items].map((i) => i.exerciseId),
          hurt,
        )[0];
        if (!alt) continue;
        ex = alt;
      }
      const t = injuredTarget(ex, target(ex, events, profile, g, now), hurt, g);
      // Warm-ups follow the new exercise and load.
      const warmed = new Set(items.flatMap((i) => exercise(i.exerciseId).primary));
      const wu = warmupFor(ex, t.target.weight, g, warmed);
      items.push({
        ...item,
        exerciseId: ex.id,
        target: t.target,
        injuryPct: t.injuryPct,
        challenge: t.injuryPct ? undefined : item.challenge,
        warmup: wu.length ? wu : undefined,
      });
    }
    const next = loadItem(get().events, { ...a, plan: { ...a.plan, items } }, Math.min(a.index, items.length));
    set({ active: next });
    persistActive(next);
  }
  get().replan();
}

export interface InjuriesSlice {
  /** Injury mode: log a hurt body part (affected exercises are skipped), change what happens, mark healed. */
  logInjury(part: BodyPart): string;
  setInjuryRule(injuryId: string, rule: Pick<InjuryRuleEvent, "exerciseId" | "action" | "pct" | "ack">): void;
  healInjury(injuryId: string): void;
  /** A 0–10 pain rating, optionally tied to this workout and exercise. */
  ratePain(injuryId: string, score: number, ctx?: { sessionId?: string; exerciseId?: string }): void;
  /** Start a graded return (the lifter accepted the risks). */
  startReturn(injuryId: string): void;
}

export function injuriesSlice(c: Ctx): InjuriesSlice {
  const { commit } = c;
  return {
    logInjury(part) {
      const injuryId = uid();
      commit([{ type: "injury", id: uid(), at: Date.now(), injuryId, part }]);
      afterInjuryChange(c);
      return injuryId;
    },

    setInjuryRule(injuryId, rule) {
      commit([{ type: "injuryRule", id: uid(), at: Date.now(), injuryId, ...rule }]);
      afterInjuryChange(c);
    },

    ratePain(injuryId, score, ctx = {}) {
      commit([{ type: "pain", id: uid(), at: Date.now(), injuryId, score, ...ctx }]);
      afterInjuryChange(c);
    },

    startReturn(injuryId) {
      commit([{ type: "injuryReturn", id: uid(), at: Date.now(), injuryId, ack: true }]);
      afterInjuryChange(c);
    },

    healInjury(injuryId) {
      commit([{ type: "injuryHealed", id: uid(), at: Date.now(), injuryId }]);
      afterInjuryChange(c);
    },
  };
}
