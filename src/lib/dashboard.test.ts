import { describe, expect, it } from "vitest";
import { dayKey, decodeShare, encodeShare, heat, liftBests, MANUAL_RIR, monthGrid, pastWorkoutEvents, sessionDetail, shareCard, trainingDays, weeklyTotals, yearGrid } from "./dashboard";
import { defaultProfile } from "./defaults";
import { derive } from "./derive";
import { can } from "./entitlements";
import type { AppEvent, SetEvent } from "./types";

// The web dashboard's views, past-workout logging and share links (Melvin, 2026-11-09: a Hevy-style
// website with stats, training days, sharing and achievements, plus logging on the web).

const NOW = new Date("2026-11-11T18:00:00").getTime();
const D = 86400_000;
let n = 0;
const ids = () => `id${n++}`;
const set = (at: number, sessionId: string, over: Partial<SetEvent> = {}): SetEvent => ({
  type: "set", id: `s${n++}`, at, sessionId, exerciseId: "back-squat", weight: 100, reps: 5, targetReps: 5, rir: 2, ...over,
});
const workout = (at: number, id: string, over: Partial<SetEvent> = {}, count = 3): AppEvent[] => [
  { type: "sessionStart", id: `st-${id}`, at: at - 60_000, sessionId: id, gymId: "g1", minutes: 45 },
  ...Array.from({ length: count }, (_, i) => set(at + i * 1000, id, over)),
  { type: "sessionEnd", id: `en-${id}`, at: at + 3_000_000, sessionId: id, seconds: 3000, avgHr: 130 },
];

describe("calendar", () => {
  it("keys days by local date", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe("2026-01-05");
  });

  it("totals workouts per day, including two on one day", () => {
    const ev = [...workout(NOW - 2 * D, "a"), ...workout(NOW - 2 * D + 7200_000, "b", {}, 2), ...workout(NOW, "c")];
    const days = trainingDays(derive(ev, NOW));
    expect(days.get(dayKey(NOW - 2 * D))).toMatchObject({ sessions: 2, sets: 5 });
    expect(days.get(dayKey(NOW))).toMatchObject({ sessions: 1, sets: 3 });
    expect(days.has(dayKey(NOW - D))).toBe(false);
  });

  it("lays out a year as Monday-first weeks ending this week", () => {
    const g = yearGrid(NOW);
    expect(g).toHaveLength(53);
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(new Date(g[0][0].ms).getDay()).toBe(1);
    const flat = g.flat();
    expect(new Set(flat.map((d) => d.key)).size).toBe(flat.length);
    expect(flat.find((d) => d.key === dayKey(NOW))?.future).toBe(false);
    expect(flat.filter((d) => d.future).every((d) => d.ms > NOW)).toBe(true);
    // Days step by the calendar, so daylight saving never repeats or skips one.
    for (let i = 1; i < flat.length; i++) expect(Math.round((flat[i].ms - flat[i - 1].ms) / D)).toBe(1);
  });

  it("lays out a month with blanks before the 1st", () => {
    const rows = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(rows[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(rows[0][6]?.key).toBe("2026-11-01");
    expect(rows.flat().filter(Boolean)).toHaveLength(30);
    expect(rows.every((r) => r.length === 7)).toBe(true);
  });

  it("grades heat by sets", () => {
    const t = (sets: number) => ({ sessions: 1, sets, volume: 0, seconds: 0, prs: 0 });
    expect([heat(undefined), heat(t(0)), heat(t(1)), heat(t(8)), heat(t(16)), heat(t(24))]).toEqual([0, 0, 1, 2, 3, 4]);
  });

  it("counts workouts per week, oldest first", () => {
    const ev = [...workout(NOW, "a"), ...workout(NOW - D, "b"), ...workout(NOW - 14 * D, "c")];
    const w = weeklyTotals(derive(ev, NOW), NOW, 4);
    expect(w.map((x) => x.sessions)).toEqual([0, 1, 0, 2]);
    expect(w.at(-1)!.sets).toBe(6);
  });
});

describe("lift bests and session detail", () => {
  it("finds the best estimated max, heaviest and most reps for each exercise", () => {
    const ev = [
      ...workout(NOW - 7 * D, "a", { weight: 100, reps: 5 }),
      ...workout(NOW, "b", { weight: 110, reps: 3 }),
      set(NOW + 9000, "b", { exerciseId: "pull-up", weight: 0, reps: 12 }),
    ];
    const [squat, pull] = liftBests(ev);
    expect(squat).toMatchObject({ exerciseId: "back-squat", sessions: 2, sets: 6, heaviest: 110, mostReps: 5 });
    expect(squat.e1rmSet).toMatchObject({ weight: 110, reps: 3 }); // 121 beats 116.7
    expect(squat.e1rm).toBe(121);
    expect(pull).toMatchObject({ exerciseId: "pull-up", heaviest: 0, mostReps: 12, e1rm: 0 });
  });

  it("groups a workout's sets by exercise in order", () => {
    const ev = [...workout(NOW, "a", {}, 2), set(NOW + 5000, "a", { exerciseId: "bench-press" }), set(NOW + 6000, "a", { exerciseId: "bench-press" })];
    const d = sessionDetail(ev, "a")!;
    expect(d.exercises.map((g) => [g.exerciseId, g.sets.length])).toEqual([["back-squat", 2], ["bench-press", 2]]);
    expect(d.manual).toBe(false);
    expect(sessionDetail(ev, "nope")).toBeNull();
  });
});

describe("logging a past workout", () => {
  const base = { start: NOW - 2 * D, minutes: 50, gymId: "g1", exercises: [{ exerciseId: "bench-press", sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }] }, { exerciseId: "pull-up", sets: [{ weight: 0, reps: 10 }] }] };

  it("writes the same events a live workout does, marked as logged by hand", () => {
    const r = pastWorkoutEvents(base, NOW, ids);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [start, ...rest] = r.events;
    const end = rest.pop()!;
    expect(start).toMatchObject({ type: "sessionStart", at: base.start, source: "manual", gymId: "g1", minutes: 50 });
    expect(end).toMatchObject({ type: "sessionEnd", at: base.start + 50 * 60_000, seconds: 3000 });
    expect(rest).toHaveLength(3);
    expect(rest.every((s) => s.type === "set" && s.sessionId === (start as { sessionId: string }).sessionId && s.rir === MANUAL_RIR && s.targetReps === s.reps)).toBe(true);
    const ats = rest.map((s) => s.at);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(ats[0]).toBeGreaterThan(base.start);
    expect(ats.at(-1)!).toBeLessThan(end.at);
    expect(new Set(r.events.map((e) => e.id)).size).toBe(r.events.length);
  });

  it("counts in stats and the calendar like any workout", () => {
    const r = pastWorkoutEvents(base, NOW, ids);
    if (!r.ok) throw new Error(r.error);
    const stats = derive(r.events, NOW);
    expect(stats.sessions).toHaveLength(1);
    expect(stats.sessions[0]).toMatchObject({ sets: 3, seconds: 3000 });
    expect(trainingDays(stats).get(dayKey(base.start))?.sets).toBe(3);
    expect(sessionDetail(r.events, stats.sessions[0].sessionId)?.manual).toBe(true);
  });

  it("never ends in the future", () => {
    const r = pastWorkoutEvents({ ...base, start: NOW - 10 * 60_000, minutes: 60 }, NOW, ids);
    if (!r.ok) throw new Error(r.error);
    expect(r.events.at(-1)!.at).toBe(NOW);
    expect(r.events.every((e) => e.at <= NOW)).toBe(true);
  });

  it.each([
    [{ start: NOW + 60_000 }, "already happened"],
    [{ start: new Date(1999, 5, 1).getTime() }, "too far back"],
    [{ minutes: 0 }, "Length"],
    [{ minutes: 2.5 }, "Length"],
    [{ exercises: [] }, "at least one set"],
    [{ exercises: [{ exerciseId: "made-up", sets: [{ weight: 1, reps: 1 }] }] }, "exercise"],
    [{ exercises: [{ exerciseId: "bench-press", sets: [{ weight: 50, reps: 0 }] }] }, "Reps"],
    [{ exercises: [{ exerciseId: "bench-press", sets: [{ weight: 50, reps: 2.5 }] }] }, "Reps"],
    [{ exercises: [{ exerciseId: "bench-press", sets: [{ weight: -1, reps: 5 }] }] }, "Weight"],
    [{ exercises: [{ exerciseId: "bench-press", sets: [{ weight: NaN, reps: 5 }] }] }, "Weight"],
  ])("refuses bad input %#", (over, msg) => {
    const r = pastWorkoutEvents({ ...base, ...over }, NOW, ids);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(msg);
  });
});

describe("share links", () => {
  const profile = { ...defaultProfile(NOW), name: "Sam", onboarded: true, bodyweight: 82 };
  const events: AppEvent[] = [...workout(NOW - 30 * D, "a", { exerciseId: "bench-press", weight: 60, reps: 5 }), ...workout(NOW - D, "b", { exerciseId: "bench-press", weight: 70, reps: 5 }), ...workout(NOW - 200 * D, "old")];
  const stats = derive(events, NOW);

  it("summarises without any health data", () => {
    const card = shareCard(events, stats, profile, NOW, { name: false });
    expect(card).toMatchObject({ v: 1, u: "kg", w: 3 });
    expect(card.n).toBeUndefined();
    expect(card.d).toEqual([1, 30]); // the 200-day-old workout is outside the 12 weeks
    expect(card.t).toContain("workouts.bronze");
    expect(card.l[0][0]).toBe("back-squat");
    const json = JSON.stringify(card);
    for (const leak of ["82", "130", "avgHr", "hr", "bodyweight", "g1", "cycle"]) expect(json).not.toContain(`"${leak}`);
  });

  it("includes the name only when asked", () => {
    expect(shareCard(events, stats, profile, NOW, { name: true }).n).toBe("Sam");
    expect(shareCard(events, stats, { ...profile, name: "  " }, NOW, { name: true }).n).toBeUndefined();
  });

  it("round-trips through a URL-safe link", () => {
    const card = shareCard(events, stats, { ...profile, name: "Zoë 💪" }, NOW, { name: true });
    const enc = encodeShare(card);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShare(enc)).toEqual(card);
    expect(decodeShare(`#${enc}`)).toEqual(card);
  });

  it.each([
    ["", "empty"],
    ["not base64!!", "garbage"],
    [encodeShare({ v: 2 } as never), "wrong version"],
  ])("rejects %s (%s)", (s) => {
    expect(decodeShare(s)).toBeNull();
  });

  it("rejects tampered fields", () => {
    const good = shareCard(events, stats, profile, NOW, { name: true });
    const bad = (over: object) => decodeShare(encodeShare({ ...good, ...over } as never));
    expect(bad({ u: "stone" })).toBeNull();
    expect(bad({ n: "x".repeat(41) })).toBeNull();
    expect(bad({ t: ["<script>"] })).toBeNull();
    expect(bad({ l: [["not-an-exercise", 100]] })).toBeNull();
    expect(bad({ l: [["bench-press", 99999]] })).toBeNull();
    expect(bad({ d: [100] })).toBeNull();
    expect(bad({ xp: -5 })).toBeNull();
    expect(bad({ w: 1.5 })).toBeNull();
    expect(decodeShare("x".repeat(4001))).toBeNull();
  });
});

describe("entitlements", () => {
  it("keeps advanced stats for Pro and the rest free", () => {
    expect(can("advancedStats", true)).toBe(true);
    expect(can("advancedStats", false)).toBe(false);
    expect(can("advancedStats")).toBe(true); // everyone has Pro until billing lands
  });
});
