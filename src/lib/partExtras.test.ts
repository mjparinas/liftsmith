import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSessionEnd, makeSessionStart, makeSet, makeSets, makeTestGym, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import {
  CARDIO_FIRST_MIN,
  CARDIO_PICKS,
  cardioActivity,
  cardioChoices,
  cardioDefault,
  cardioItem,
  extraOffer,
  lastRehab,
  rehabDue,
  rehabGap,
  rehabInjuries,
  rehabItems,
  rehabRoutine,
  rehabWeek,
} from "./partExtras";
import { sessionsOf } from "./progression";
import { recovery } from "./recovery";
import { cleanParts } from "./routines";
import { decodeRoutine, encodeRoutine } from "./routineShare";
import type { AppEvent, InjuryEvent, Routine } from "./types";

// Workouts with parts, stage 5 (docs/decisions/sessions-with-parts.md): rehab beside the lifting and cardio after it.

const rehab: Routine = {
  id: "knee",
  name: "Knee rehab",
  items: [
    { exerciseId: "glute-bridge", sets: 3 },
    { exerciseId: "wall-sit", sets: 2 },
  ],
  rehab: true,
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW - 30 * DAY,
};
const hurt: InjuryEvent = { type: "injury", id: "inj", at: NOW - 20 * DAY, injuryId: "i1", part: "knee" };
const gym = makeTestGym();

describe("rehab beside the lifting", () => {
  it("finds the newest rehab routine with exercises", () => {
    const older = { ...rehab, id: "old", updatedAt: NOW - 90 * DAY };
    const plain = { ...rehab, id: "plain", rehab: undefined, updatedAt: NOW };
    expect(rehabRoutine({ routines: [older, plain, rehab] })?.id).toBe("knee");
    expect(rehabRoutine({ routines: [plain] })).toBeUndefined();
  });

  it("reads when it was last done, as a whole workout or as a part", () => {
    expect(lastRehab([], "knee")).toBeUndefined();
    const whole = makeSessionStart({ at: NOW - 5 * DAY, routine: "knee" });
    const part = makeSessionEnd({
      at: NOW - 2 * DAY,
      parts: [{ id: "rehab", kind: "rehab", start: NOW - 2 * DAY - 600_000, end: NOW - 2 * DAY, ref: "knee" }],
    });
    expect(lastRehab([whole], "knee")).toBe(NOW - 5 * DAY);
    expect(lastRehab([whole, part], "knee")).toBe(NOW - 2 * DAY - 600_000);
  });

  it("is due with an active injury when not done today or yesterday", () => {
    const doneAgo = (days: number): AppEvent[] => [hurt, makeSessionStart({ at: NOW - days * DAY, routine: "knee" })];
    expect(rehabDue([hurt], rehab, NOW)).toMatchObject({ due: true, week: 0, injured: true });
    expect(rehabDue([hurt], rehab, NOW).days).toBeUndefined();
    expect(rehabDue(doneAgo(0), rehab, NOW)).toMatchObject({ due: false, days: 0 });
    expect(rehabDue(doneAgo(1), rehab, NOW)).toMatchObject({ due: false, days: 1 });
    expect(rehabDue(doneAgo(2), rehab, NOW)).toMatchObject({ due: true, days: 2 });
    // Healed, or never hurt: offered, but not switched on.
    expect(rehabDue([], rehab, NOW).due).toBe(false);
  });

  it("follows the physio's times a week over the last seven days", () => {
    const done = (...daysAgo: number[]): AppEvent[] => [
      hurt,
      ...daysAgo.map((d) => makeSessionStart({ at: NOW - d * DAY, routine: "knee" })),
    ];
    const thrice = { ...rehab, perWeek: 3 };
    // Three in the last seven days: done for now, even two days after the last.
    expect(rehabDue(done(2, 4, 6), thrice, NOW)).toMatchObject({ due: false, week: 3, want: 3 });
    // The oldest falls out of the week: due again.
    expect(rehabDue(done(2, 4, 7), thrice, NOW)).toMatchObject({ due: true, week: 2 });
    // Up to three a week waits a day between; daily from four.
    expect(rehabDue(done(1), thrice, NOW).due).toBe(false);
    expect(rehabDue(done(1), { ...rehab, perWeek: 7 }, NOW)).toMatchObject({ due: true, week: 1 });
    expect(rehabDue(done(0), { ...rehab, perWeek: 7 }, NOW).due).toBe(false);
    // Twice on one day counts once.
    expect(rehabWeek([...done(1), makeSessionStart({ at: NOW - DAY + 60_000, routine: "knee" })], "knee", NOW)).toBe(1);
    expect(rehabGap(undefined)).toBe(2);
    expect(rehabGap(3)).toBe(2);
    expect(rehabGap(4)).toBe(1);
  });

  it("counts only injuries in the program's area", () => {
    const shoulder: InjuryEvent = { ...hurt, id: "inj2", injuryId: "i2", part: "shoulder" };
    const knee = { ...rehab, rehabPart: "knee" as const };
    expect(rehabInjuries([hurt, shoulder], knee, NOW).map((i) => i.part)).toEqual(["knee"]);
    // An older program without an area: every active injury, as before.
    expect(rehabInjuries([hurt, shoulder], rehab, NOW)).toHaveLength(2);
    // Only a shoulder injury: the knee program isn't due.
    expect(rehabDue([shoulder], knee, NOW)).toMatchObject({ due: false, injured: false });
    expect(rehabDue([shoulder], rehab, NOW).due).toBe(true);
  });

  it("keeps the physio's exercises and sets, and repeats what was done in the last rehab part", () => {
    const profile = makeProfile();
    const first = rehabItems(rehab, gym, [], profile, NOW);
    expect(first.map((i) => [i.exerciseId, i.sets, i.part])).toEqual([
      ["glute-bridge", 3, "rehab"],
      ["wall-sit", 2, "rehab"],
    ]);
    const last = makeSet({ exerciseId: "glute-bridge", weight: 0, reps: 15, targetReps: 12, partId: "rehab", at: NOW - DAY });
    const again = rehabItems(rehab, gym, [last], profile, NOW);
    expect(again[0]!.target.reps).toBe(12);
  });

  it("leaves out exercises the gym can't do", () => {
    const bands = { ...rehab, items: [{ exerciseId: "back-squat", sets: 3 }, ...rehab.items] };
    const bodyweight = makeTestGym("bodyweight");
    expect(rehabItems(bands, bodyweight, [], makeProfile(), NOW).map((i) => i.exerciseId)).not.toContain("back-squat");
  });

  it("isn't offered beside a workout that is that rehab already", () => {
    const profile = { routines: [rehab] };
    expect(extraOffer(profile, undefined, {}, gym, [hurt], NOW).rehab?.routine.id).toBe("knee");
    expect(extraOffer(profile, undefined, { rehab: true }, gym, [hurt], NOW).rehab).toBeUndefined();
    expect(extraOffer(profile, rehab, {}, gym, [hurt], NOW).rehab).toBeUndefined();
  });

  it("never moves progression or recovery for the main lifts", () => {
    const lifting = makeSets(3, { exerciseId: "glute-bridge", sessionId: "a", at: NOW - 3 * DAY });
    const inRehab = makeSets(3, { exerciseId: "glute-bridge", sessionId: "b", at: NOW - DAY, partId: "rehab" });
    expect(sessionsOf([...lifting, ...inRehab], "glute-bridge")).toHaveLength(1);
    const fresh = recovery([], NOW);
    expect(recovery(inRehab, NOW)).toEqual(fresh);
  });
});

describe("cardio after the lifting", () => {
  it("only offers known cardio exercises", () => {
    for (const id of CARDIO_PICKS) expect(EXERCISE_BY_ID.get(id)?.cardio, id).toBeTruthy();
  });

  it("offers what the gym can do, last time's first", () => {
    const choices = cardioChoices(gym, []);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.length).toBeLessThanOrEqual(6);
    const last = makeSet({ exerciseId: "rowing-machine", reps: 900, partId: "cardio" });
    expect(cardioChoices(gym, [last])[0]).toBe("rowing-machine");
    // A gym with nothing still has something to do.
    expect(cardioChoices(makeTestGym("bodyweight"), []).length).toBeGreaterThan(0);
  });

  it("starts from the routine's part, else last time's, else 15 minutes", () => {
    expect(cardioDefault(undefined, gym, [])?.minutes).toBe(CARDIO_FIRST_MIN);
    const last = makeSet({ exerciseId: "rowing-machine", reps: 1200, partId: "cardio" });
    expect(cardioDefault(undefined, gym, [last])).toEqual({ exerciseId: "rowing-machine", minutes: 20 });
    expect(cardioDefault({ exerciseId: "stationary-bike", minutes: 10 }, gym, [last])).toEqual({
      exerciseId: "stationary-bike",
      minutes: 10,
    });
  });

  it("is switched on only by a routine with a cardio part", () => {
    expect(extraOffer({}, undefined, {}, gym, [], NOW).cardioOn).toBe(false);
    const legs = { id: "legs", parts: [{ kind: "cardio" as const, exerciseId: "stationary-bike", minutes: 20 }] };
    expect(extraOffer({}, legs, {}, gym, [], NOW)).toMatchObject({
      cardioOn: true,
      cardio: { exerciseId: "stationary-bike", minutes: 20 },
    });
  });

  it("is one timed set marked as the cardio part", () => {
    const item = cardioItem({ exerciseId: "stationary-bike", minutes: 20 }, gym, [], makeProfile(), NOW);
    expect(item).toMatchObject({ exerciseId: "stationary-bike", sets: 1, part: "cardio" });
    expect(item?.target.reps).toBe(1200);
    expect(cardioItem({ exerciseId: "back-squat", minutes: 20 }, gym, [], makeProfile(), NOW)).toBeNull();
  });

  it("tells Health what the machine was", () => {
    expect(cardioActivity("rowing-machine")).toBe("row");
    expect(cardioActivity("stationary-bike")).toBe("bike");
    expect(cardioActivity("jump-rope")).toBe("other");
    expect(cardioActivity(undefined)).toBe("other");
  });
});

describe("a routine's cardio part", () => {
  it("is tidied: known cardio only, 1 to 120 minutes, between the warm-up and the cool-down", () => {
    expect(cleanParts([{ kind: "cool" }, { kind: "cardio", exerciseId: "back-squat", minutes: 500 }, { kind: "warm" }])).toEqual([
      { kind: "warm" },
      { kind: "cardio", minutes: 120 },
      { kind: "cool" },
    ]);
  });

  it("travels in a routine link that older apps still open", () => {
    const r = {
      name: "Legs",
      items: [{ exerciseId: "back-squat", sets: 3 }],
      parts: [{ kind: "warm" as const }, { kind: "cardio" as const, exerciseId: "rowing-machine", minutes: 15 }],
    };
    const code = encodeRoutine(r);
    expect(code).toContain("~c:rowing-machine:15");
    expect(decodeRoutine(code)?.parts).toEqual(r.parts);
    // An empty cardio part (the lifter's own pick on the day) travels too.
    expect(decodeRoutine(encodeRoutine({ ...r, parts: [{ kind: "cardio" }] }))?.parts).toEqual([{ kind: "cardio" }]);
    expect(decodeRoutine(code)?.items).toEqual(r.items);
  });
});
