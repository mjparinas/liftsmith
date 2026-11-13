import { describe, expect, it } from "vitest";

import { DAY, makeWorkout, NOW } from "@/test/factories";

import {
  cleanEvents,
  clientReport,
  codeFrom,
  flagText,
  inviteUrl,
  painFlags,
  planProgress,
  rehabInjuries,
  showCode,
  type Plan,
} from "./trainer";

describe("invite codes on the phone", () => {
  it("shows a code in two halves and reads it back from a typed code or a link", () => {
    expect(showCode("ABCD2345")).toBe("ABCD-2345");
    expect(codeFrom(" abcd-2345 ")).toBe("ABCD2345");
    expect(codeFrom(inviteUrl("ABCD2345"))).toBe("ABCD2345");
    expect(codeFrom("ABCD-234O")).toBe("");
    expect(codeFrom("hello")).toBe("");
  });
});

describe("a coach's report on a client", () => {
  const view = (events: unknown[], daysPerWeek: number | null = 3, plans: Plan[] = []) => ({ name: "Alex", daysPerWeek, events, plans });

  it("drops anything malformed from another person's phone", () => {
    const { events, names } = cleanEvents([
      null,
      { id: "a", at: 1, type: "set", sessionId: "s", exerciseId: "bench-press", weight: "heavy", reps: 5, targetReps: 5 },
      { id: "b", at: 1, type: "sessionEnd", sessionId: "s" },
      { id: "c", at: 1, type: "customExercise", exercise: { id: "custom-sled", name: "Sled drag" } },
      { id: "d", at: 1, type: "set", sessionId: "s", exerciseId: "bench-press", weight: 60, reps: 5, targetReps: 5 },
    ]);
    expect(events.map((e) => e.id)).toEqual(["d"]);
    expect(names.get("custom-sled")).toBe("Sled drag");
  });

  it("says when there are no workouts yet", () => {
    expect(clientReport(view([]), NOW).flags).toEqual([{ kind: "new" }]);
  });

  it("flags a client who has gone quiet", () => {
    const r = clientReport(view(makeWorkout("w1", NOW - 10 * DAY, [{}, {}])), NOW);
    expect(r.flags[0]).toEqual({ kind: "quiet", days: 9 });
    expect(flagText(r.flags[0]!, new Map()).title).toBe("No workout in 9 days");
  });

  it("flags missed reps three workouts running", () => {
    const missed = [
      { reps: 5, targetReps: 8 },
      { reps: 5, targetReps: 8 },
    ];
    const events = [1, 3, 5].flatMap((d) => makeWorkout(`w${d}`, NOW - d * DAY, missed));
    const r = clientReport(view(events, null), NOW);
    expect(r.flags).toContainEqual({ kind: "missing", pct: 0 });
    expect(r.sessions).toHaveLength(3);
  });

  it("says on track when nothing needs doing, and counts the weeks", () => {
    // Getting stronger every week, so nothing is stalled.
    const events = [0, 7, 14, 21].flatMap((d) => makeWorkout(`w${d}`, NOW - d * DAY - 3600_000, [{ weight: 80 - d }, { weight: 80 - d }]));
    const r = clientReport(view(events, 1), NOW);
    expect(r.weeks.map((w) => w.count)).toEqual([1, 1, 1, 1]);
    expect(r.flags.at(-1)).toEqual({ kind: "onTrack", done: 1, goal: 1 });
  });

  const plan = (at: number): Plan => ({
    id: "p1",
    coachId: "k",
    clientId: "c",
    name: "Push day",
    code: "r1~UHVzaA~bench-press.3~back-squat.3",
    at,
  });

  it("counts the workouts that follow an assigned routine since it was given", () => {
    const sessions = clientReport(
      view([
        ...makeWorkout("before", NOW - 9 * DAY, [{ exerciseId: "bench-press" }, { exerciseId: "back-squat" }]),
        ...makeWorkout("after", NOW - 2 * DAY, [{ exerciseId: "bench-press" }, { exerciseId: "back-squat" }]),
        ...makeWorkout("other", NOW - DAY, [{ exerciseId: "deadlift" }]),
      ]),
      NOW,
    ).sessions;
    expect(planProgress(plan(NOW - 5 * DAY), sessions)).toMatchObject({ done: 1, lastAt: NOW - 2 * DAY + 60_000 });
  });

  it("flags a routine given a week ago that hasn't been done", () => {
    const r = clientReport(view(makeWorkout("w", NOW - DAY, [{ exerciseId: "deadlift" }]), null, [plan(NOW - 8 * DAY)]), NOW);
    expect(r.flags).toContainEqual({ kind: "planUnused", name: "Push day" });
    expect(r.plans[0]).toMatchObject({ done: 0 });
  });
});

describe("physio support on a client's report", () => {
  const hurt = [
    { id: "i1", at: NOW - 20 * DAY, type: "injury", injuryId: "knee1", part: "knee" },
    { id: "p1", at: NOW - 10 * DAY, type: "pain", injuryId: "knee1", score: 2 },
    { id: "p2", at: NOW - 3 * DAY, type: "pain", injuryId: "knee1", score: 3, sessionId: "w", exerciseId: "wall-sit" },
    { id: "p3", at: NOW - DAY, type: "pain", injuryId: "knee1", score: 6, sessionId: "w2", exerciseId: "glute-bridge" },
  ];

  it("keeps well-formed injury and pain events, and drops odd ones", () => {
    const { events } = cleanEvents([
      ...hurt,
      { id: "x1", at: 1, type: "injury", injuryId: "a", part: "tail" },
      { id: "x2", at: 1, type: "pain", injuryId: "knee1", score: 11 },
      { id: "x3", at: 1, type: "pain", injuryId: "knee1", score: "bad" },
    ]);
    expect(events.map((e) => e.id)).toEqual(["i1", "p1", "p2", "p3"]);
  });

  it("shows each injury's trend and the latest rating on each exercise", () => {
    const [knee] = rehabInjuries(cleanEvents(hurt).events, NOW);
    expect(knee).toMatchObject({ part: "knee", latest: 6, change: 4, points: [2, 3, 6] });
    expect(knee!.byExercise).toEqual([
      { exerciseId: "glute-bridge", score: 6, at: NOW - DAY },
      { exerciseId: "wall-sit", score: 3, at: NOW - 3 * DAY },
    ]);
  });

  it("puts high pain first, and only when the client shares it", () => {
    const shared = clientReport({ name: "Alex", daysPerWeek: null, events: hurt, plans: [], pain: true }, NOW);
    expect(shared.flags[0]).toEqual({ kind: "painHigh", part: "knee", score: 6 });
    expect(flagText(shared.flags[0]!, new Map()).title).toBe("Knee: pain 6/10 this week");
    const notShared = clientReport({ name: "Alex", daysPerWeek: null, events: hurt, plans: [] }, NOW);
    expect(notShared.rehab).toBeNull();
    expect(notShared.flags.some((f) => f.kind === "painHigh")).toBe(false);
  });

  it("says when pain is rising or an injury is new", () => {
    const rising = rehabInjuries(cleanEvents([...hurt.slice(0, 3), { ...hurt[3]!, score: 4 }]).events, NOW);
    expect(painFlags(rising, NOW)).toEqual([{ kind: "painUp", part: "knee", from: 2, to: 4 }]);
    const fresh = rehabInjuries(cleanEvents([{ ...hurt[0]!, at: NOW - 2 * DAY }]).events, NOW);
    expect(painFlags(fresh, NOW)).toEqual([{ kind: "newInjury", part: "knee" }]);
  });

  it("measures adherence against times a week, and flags a routine done less than half as often as asked", () => {
    const rehab: Plan = {
      id: "p",
      coachId: "c",
      clientId: "x",
      name: "Knee",
      code: "r1~S25lZQ~wall-sit.3~glute-bridge.3",
      at: NOW - 14 * DAY,
      perWeek: 3,
    };
    const events = [
      ...makeWorkout("a", NOW - 10 * DAY, [{ exerciseId: "wall-sit" }, { exerciseId: "glute-bridge" }]),
      ...makeWorkout("b", NOW - 3 * DAY, [{ exerciseId: "wall-sit" }, { exerciseId: "glute-bridge" }]),
    ];
    const r = clientReport({ name: "Alex", daysPerWeek: null, events, plans: [rehab] }, NOW);
    expect(r.plans[0]!.adherence).toEqual({ done: 2, want: 6, pct: 33 });
    expect(r.flags).toContainEqual({ kind: "lowAdherence", name: "Knee", done: 2, want: 6 });
    // No target, or given less than a week ago: no adherence yet.
    expect(planProgress({ ...rehab, perWeek: undefined }, [], NOW).adherence).toBeUndefined();
    expect(planProgress({ ...rehab, at: NOW - 3 * DAY }, [], NOW).adherence).toBeUndefined();
  });
});

describe("food against a coach's targets", () => {
  const day = (ago: number) => {
    const d = new Date(NOW - ago * DAY);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const food = (kcal: number, protein?: number) => [1, 2, 3, 4].map((ago) => ({ day: day(ago), kcal, protein }));
  const view = (kcal: number, protein: number | undefined, targets: { kcal: number | null; protein: number | null } | null) => ({
    name: "Alex",
    daysPerWeek: null,
    events: makeWorkout("w1", NOW - DAY, [{}]),
    plans: [],
    body: { sex: null, heightCm: null, weights: [], measures: [], food: food(kcal, protein) },
    targets: targets && { coachId: "me", clientId: "c1", at: NOW, ...targets },
  });

  it("flags calories 10% off the target and protein under 85% of it", () => {
    const kinds = (v: ReturnType<typeof view>) => clientReport(v, NOW).flags.map((f) => f.kind);
    expect(kinds(view(1800, 100, { kcal: 2400, protein: 160 }))).toEqual(expect.arrayContaining(["kcalOff", "proteinShort"]));
    expect(kinds(view(2350, 150, { kcal: 2400, protein: 160 }))).not.toContain("kcalOff");
    expect(kinds(view(2350, 150, { kcal: 2400, protein: 160 }))).not.toContain("proteinShort");
    // No targets, nothing to judge against.
    expect(kinds(view(1200, 50, null))).not.toContain("kcalOff");
    const off = clientReport(view(1800, 100, { kcal: 2400, protein: null }), NOW).flags.find((f) => f.kind === "kcalOff")!;
    expect(flagText(off, new Map()).title).toContain("1800");
  });
});
