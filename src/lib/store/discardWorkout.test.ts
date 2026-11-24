// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { derive } from "@/lib/derive";
import { crates, game, isPr, xpTotal } from "@/lib/game";
import { useApp } from "@/lib/store";
import { DAY, makeWorkout, NOW } from "@/test/factories";

// Discarding a workout must erase every mark it left: sets, PRs, XP, crates, effort ratings. Stats are
// derived from the event log, so wiping the session's events is enough when nothing else is stored.

describe("discarding a workout that hit a PR", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    // Prior finished workout so a heavier set later can be a PR (isPr needs history on the exercise).
    const prior = makeWorkout("older", NOW - DAY, [{ exerciseId: "back-squat", weight: 100, reps: 5 }]);
    useApp.setState({
      events: prior,
      stats: derive(prior, NOW),
      profile: {
        ...defaultProfile(NOW),
        onboarded: true,
        bodyweight: 80,
        activeGymId: id,
        unit: "kg",
        training: { warmups: false },
      },
      ready: true,
    });
    useApp.getState().saveRoutine({
      id: "rt-squat",
      name: "Squat day",
      items: [{ exerciseId: "back-squat", sets: 3 }],
      createdAt: NOW,
      updatedAt: NOW,
    });
    useApp.getState().pickRoutine("rt-squat");
    useApp.getState().replan();
  });

  it("removes the PR, XP, crate and effort rating; earlier history stays", () => {
    const before = useApp.getState();
    const beforeXp = xpTotal(before.stats);
    const beforePrs = before.stats.prs.length;
    const beforeSessions = before.stats.sessions.length;
    const beforeOwned = game(before.events, before.stats, before.profile, NOW).owned.size;

    useApp.getState().start();
    const a = useApp.getState().active!;
    expect(a.plan.items[0]?.exerciseId).toBe("back-squat");
    // Jump past any warm-up steps and set a weight that beats the prior best.
    useApp.setState({
      active: { ...useApp.getState().active!, warm: a.plan.items[0]?.warmup?.length ?? 0, weight: 120, reps: 5 },
    });
    useApp.getState().logSet(NOW);
    const logged = useApp.getState().events.filter((e) => e.type === "set" && e.sessionId === a.sessionId);
    expect(logged).toHaveLength(1);
    expect(isPr(useApp.getState().events, logged[0]!)).toBe(true);

    useApp.getState().rateEffort(logged[0]!.id, 1);
    expect(useApp.getState().events.some((e) => e.type === "effort" && e.setId === logged[0]!.id)).toBe(true);
    expect(useApp.getState().stats.prs.length).toBe(beforePrs + 1);
    expect(xpTotal(useApp.getState().stats)).toBeGreaterThan(beforeXp);
    expect(crates(useApp.getState().stats).some((c) => c.sessionId === a.sessionId)).toBe(true);

    useApp.getState().discard();

    const after = useApp.getState();
    expect(after.active).toBeNull();
    expect(after.events.some((e) => "sessionId" in e && e.sessionId === a.sessionId)).toBe(false);
    expect(after.events.some((e) => e.type === "effort" && e.setId === logged[0]!.id)).toBe(false);
    expect(after.stats.prs).toHaveLength(beforePrs);
    expect(after.stats.sessions).toHaveLength(beforeSessions);
    expect(xpTotal(after.stats)).toBe(beforeXp);
    expect(crates(after.stats).some((c) => c.sessionId === a.sessionId)).toBe(false);
    expect(game(after.events, after.stats, after.profile, NOW).owned.size).toBe(beforeOwned);
    // The earlier finished workout is untouched.
    expect(after.events.some((e) => e.type === "set" && e.sessionId === "older")).toBe(true);
  });
});
