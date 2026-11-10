import { describe, expect, it } from "vitest";

import { setsCsv } from "./exportData";
import { customId, defaultMapping, guessExercise, importEvents, matchExercise, parseCsv, parseDate, readImport } from "./importCsv";
import type { AppEvent } from "./types";

const NOW = new Date(2026, 10, 9, 20).getTime();

const STRONG = `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2026-11-02 18:05:00,"Push, heavy",1h 5m,Bench Press (Barbell),W,60,5,0,0,,,
2026-11-02 18:05:00,"Push, heavy",1h 5m,Bench Press (Barbell),1,100,5,0,0,,,8
2026-11-02 18:05:00,"Push, heavy",1h 5m,Bench Press (Barbell),2,100,5,0,0,,,
2026-11-02 18:05:00,"Push, heavy",1h 5m,Rest Timer,Rest Timer,0,0,0,90,,,
2026-11-02 18:05:00,"Push, heavy",1h 5m,Plank,1,0,0,0,60,,,
2026-11-02 18:05:00,"Push, heavy",1h 5m,Running,1,0,0,5,1800,,,
2026-11-02 18:05:00,"Push, heavy",1h 5m,Zottman Thing,1,12.5,10,0,0,,,
2026-11-04 07:30:00,Legs,45m,Squat (Barbell),1,140,5,0,0,,,
`;

const HEVY = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_lbs","reps","distance_miles","duration_seconds","rpe"
"Pull day","5 Nov 2026, 17:00","5 Nov 2026, 18:10","","Lat Pulldown (Cable)","0","","0","warmup","70","10","","",""
"Pull day","5 Nov 2026, 17:00","5 Nov 2026, 18:10","","Lat Pulldown (Cable)","0","","1","normal","140","8","","",""
"Pull day","5 Nov 2026, 17:00","5 Nov 2026, 18:10","","Bicep Curl (Dumbbell)","0","","0","normal","30","12","","",""
"Pull day","5 Nov 2026, 17:00","5 Nov 2026, 18:10","","Face Pull (Cable)","","","0","normal","50","15","","",""
"Future","20 Dec 2026, 17:00","20 Dec 2026, 18:00","","Deadlift (Barbell)","","","0","normal","315","5","","",""
`;

describe("CSV parsing", () => {
  it("handles quotes, escaped quotes, CRLF, a BOM and semicolons", () => {
    expect(parseCsv('﻿a,b\r\n"x, ""y""",2\r\n')).toEqual([
      ["a", "b"],
      ['x, "y"', "2"],
    ]);
    expect(parseCsv("a;b;c\n1;2,5;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2,5", "3"],
    ]);
  });

  it("reads dates the apps write", () => {
    expect(parseDate("2026-11-02 18:05:00")).toBe(new Date(2026, 10, 2, 18, 5).getTime());
    expect(parseDate("2026-11-02", "07:30")).toBe(new Date(2026, 10, 2, 7, 30).getTime());
    expect(parseDate("5 Nov 2026, 17:00")).toBe(new Date(2026, 10, 5, 17).getTime());
    expect(parseDate("yesterday")).toBeNull();
  });
});

describe("reading exports", () => {
  it("reads Strong: workouts, warm-ups, timed sets, and skips rest timers and cardio", () => {
    const f = readImport(STRONG)!;
    expect(f.format).toBe("strong");
    expect(f.unit).toBeNull(); // older Strong files don't say; the lifter picks
    expect(f.workouts).toHaveLength(2);
    const push = f.workouts[0];
    expect(push).toMatchObject({ title: "Push, heavy", minutes: 65 });
    expect(push.sets.map((s) => [s.name, s.weight, s.reps, s.warmup])).toEqual([
      ["Bench Press (Barbell)", 60, 5, true],
      ["Bench Press (Barbell)", 100, 5, false],
      ["Bench Press (Barbell)", 100, 5, false],
      ["Plank", 0, 0, false],
      ["Zottman Thing", 12.5, 10, false],
    ]);
    expect(push.sets[3].seconds).toBe(60);
    expect(f.skipped).toBe(2);
    expect(readImport(STRONG.replace("Weight,", "Weight (kg),"))!.unit).toBe("kg");
  });

  it("reads Hevy with its unit, warm-ups and supersets", () => {
    const f = readImport(HEVY)!;
    expect(f.format).toBe("hevy");
    expect(f.unit).toBe("lb");
    expect(f.workouts[0]).toMatchObject({ title: "Pull day", minutes: 70 });
    expect(f.workouts[0].sets[0]).toMatchObject({ warmup: true, superset: "0" });
    expect(f.workouts[0].sets[3].superset).toBeUndefined();
  });

  it("reads Liftsmith's own export back", () => {
    const events: AppEvent[] = [
      {
        type: "set",
        id: "1",
        at: new Date(2026, 10, 3, 9).getTime(),
        sessionId: "abcdefgh-1",
        exerciseId: "bench-press",
        weight: 100,
        reps: 5,
        targetReps: 5,
        rir: 2,
      },
    ];
    const f = readImport(setsCsv(events, "lb"))!;
    expect(f.format).toBe("liftsmith");
    expect(f.workouts[0].sets[0]).toMatchObject({ name: "Barbell bench press", unit: "lb", reps: 5 });
    const out = importEvents(f, defaultMapping(f), "kg", "g", NOW);
    const set = out.events.find((e) => e.type === "set")!;
    expect(set.type === "set" && set.exerciseId).toBe("bench-press");
    expect(set.type === "set" && Math.round(set.weight)).toBe(100);
  });

  it("returns null for a file it doesn't know", () => {
    expect(readImport("name,score\nann,3")).toBeNull();
    expect(readImport("")).toBeNull();
  });
});

describe("matching names", () => {
  it.each([
    ["Bench Press (Barbell)", "bench-press"],
    ["Squat (Barbell)", "back-squat"],
    ["Incline Bench Press (Dumbbell)", "db-incline-press"],
    ["Lat Pulldown (Cable)", "lat-pulldown"],
    ["Triceps Pushdown (Cable - Straight Bar)", "cable-pushdown"],
    ["Skullcrusher (Barbell)", "skull-crusher"],
    ["Shoulder Press (Dumbbell)", "db-shoulder-press"],
    ["Romanian Deadlift (Barbell)", "romanian-deadlift"],
  ])("%s → %s", (name, id) => expect(matchExercise(name)?.id).toBe(id));

  it("doesn't match on equipment alone, or drop a word that makes it a different lift", () => {
    expect(matchExercise("Zottman Thing (Barbell)")).toBeNull();
    expect(matchExercise("Preacher Curl (Machine)")?.id).not.toBe("cable-curl");
  });

  it("guesses a muscle and load for an unknown exercise", () => {
    expect(guessExercise("Zottman Curl (Dumbbell)")).toMatchObject({ primary: "biceps", load: "dumbbell" });
    expect(guessExercise("Landmine Press (Barbell)")).toMatchObject({ primary: "chest", load: "barbell", compound: true });
  });
});

describe("import events", () => {
  it("writes manual sessions, warm-ups, own exercises, and converts the unit", () => {
    const f = readImport(STRONG)!;
    const mapping = defaultMapping(f);
    expect(mapping["Bench Press (Barbell)"]).toBe("bench-press");
    expect(mapping["Zottman Thing"]).toBe("custom");
    const out = importEvents(f, mapping, "lb", "g", NOW);
    expect(out.workouts).toBe(2);
    const start = out.events.find((e) => e.type === "sessionStart")!;
    expect(start).toMatchObject({ source: "manual", gymId: "g", minutes: 65 });
    expect(out.events.filter((e) => e.type === "warmup")).toHaveLength(1);
    const bench = out.events.find((e) => e.type === "set" && e.exerciseId === "bench-press")!;
    expect(bench.type === "set" && bench.weight).toBeCloseTo(45.359, 2);
    const custom = out.events.find((e) => e.type === "customExercise")!;
    expect(custom.type === "customExercise" && custom.exercise.id).toBe(customId("Zottman Thing"));
    expect(out.events.some((e) => e.type === "set" && e.exerciseId === customId("Zottman Thing"))).toBe(true);
    // Sets sit inside the workout, in order.
    const sets = out.events
      .filter((e) => e.type === "set" || e.type === "warmup")
      .slice(0, 3)
      .map((e) => e.at);
    expect([...sets].sort((a, b) => a - b)).toEqual(sets);
  });

  it("adds nothing the second time, and leaves out workouts in the future", () => {
    const f = readImport(HEVY)!;
    const first = importEvents(f, defaultMapping(f), "lb", "g", NOW);
    expect(first.workouts).toBe(1);
    const superset = first.events.filter((e) => e.type === "set" && e.superset).map((e) => e.type === "set" && e.superset);
    expect(new Set(superset).size).toBe(1);
    const again = importEvents(f, defaultMapping(f), "lb", "g", NOW, new Set(first.events.map((e) => e.id)));
    expect(again.events).toEqual([]);
  });
});
