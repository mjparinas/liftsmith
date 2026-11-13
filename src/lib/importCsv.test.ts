import { describe, expect, it } from "vitest";

import { setsCsv } from "./exportData";
import {
  customId,
  defaultMapping,
  guessExercise,
  importEvents,
  importRoutines,
  matchCardio,
  matchExercise,
  parseCsv,
  parseDate,
  readImport,
  repeatedTitles,
} from "./importCsv";
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

const FITBOD = `Date,Exercise,Reps,Weight(kg),Duration(s),Distance(m),Incline,Resistance,isWarmup,Note,multiplier
2026-11-03 17:00:00 +0000,Barbell Bench Press,8,40,0,0,0,0,true,,1
2026-11-03 17:05:00 +0000,Barbell Bench Press,8,80,0,0,0,0,false,,1
2026-11-03 17:40:00 +0000,Plank,0,0,45,0,0,0,false,,1
2026-11-03 17:45:00 +0000,Running,0,0,600,1500,0,0,false,,1
2026-11-05 17:00:00 +0000,Barbell Back Squat,5,120,0,0,0,0,false,,1
`;

const STRONGLIFTS = `Workout #,Date,Workout,Duration,Exercise,Sets x Reps,Weight (lb),Set 1,Set 2,Set 3,Set 4,Set 5,Notes
1,2026-11-02 18:00,Workout A,45m,Squat,5x5,135,5,5,5,5,5,
1,2026-11-02 18:00,Workout A,45m,Bench Press,5x5,95,5,5,4,3,,
1,2026-11-02 18:00,Workout A,45m,Barbell Row,5x5,95,,,,,,
2,2026-11-04 18:00,Workout B,40m,Deadlift,1x5,185,185x5,,,,,
`;

const FITNOTES = `Date,Exercise,Category,Weight (kgs),Reps,Distance,Distance Unit,Time
2026-11-03,Flat Barbell Bench Press,Chest,80.0,8,,,
2026-11-03,Flat Barbell Bench Press,Chest,80.0,7,,,
2026-11-03,Treadmill,Cardio,,,2.5,km,0:15:00
2026-11-05,Barbell Squat,Legs,120.0,5,,,
2026-11-05,Plank,Abs,,,,,0:01:00
`;

const JEFIT = `### MY PROFILE ###
_id,username
1,someone
### EXERCISE LOGS ###
_id,belongSys,mydate,ename,logs,record
1,1,2026-11-03,Barbell Bench Press,"60x10,80x8,80x7",80
2,1,2026-11-03,Dumbbell Curl,"12.5x12",12.5
3,1,2026-11-04,Pull Up,"",0
### WORKOUT SESSIONS ###
_id,mydate,starttime
1,2026-11-03,1762189200
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
    // A time with an offset is that moment (Fitbod writes UTC).
    expect(parseDate("2026-11-02 18:05:00 +0000")).toBe(Date.UTC(2026, 10, 2, 18, 5));
    expect(parseDate("2026-11-02T18:05:00-05:00")).toBe(Date.UTC(2026, 10, 2, 23, 5));
    expect(parseDate("2026-11-02T18:05:00.000Z")).toBe(Date.UTC(2026, 10, 2, 18, 5));
  });
});

describe("reading exports", () => {
  it("reads Strong: workouts, warm-ups, timed sets and cardio, and skips rest timers", () => {
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
      ["Running", 0, 0, false],
      ["Zottman Thing", 12.5, 10, false],
    ]);
    expect(push.sets[3].seconds).toBe(60);
    expect(push.sets[4]).toMatchObject({ seconds: 1800, distance: 5 });
    expect(f.skipped).toBe(1);
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

  it("reads Fitbod: sets grouped into workouts by time, warm-ups, and cardio in metres", () => {
    const f = readImport(FITBOD)!;
    expect(f.format).toBe("fitbod");
    expect(f.unit).toBe("kg");
    expect(f.workouts).toHaveLength(2);
    expect(f.workouts[0].start).toBe(Date.UTC(2026, 10, 3, 17));
    expect(f.workouts[0].minutes).toBe(47);
    expect(f.workouts[0].sets.map((s) => [s.name, s.weight, s.reps, s.warmup])).toEqual([
      ["Barbell Bench Press", 40, 8, true],
      ["Barbell Bench Press", 80, 8, false],
      ["Plank", 0, 0, false],
      ["Running", 0, 0, false],
    ]);
    expect(f.workouts[0].sets[2].seconds).toBe(45);
    expect(f.workouts[0].sets[3]).toMatchObject({ seconds: 600, distance: 1500, distUnit: "m" });
    expect(f.skipped).toBe(0);
  });

  it("reads StrongLifts: one set per filled Set column, a set's own weight, and empty rows skipped", () => {
    const f = readImport(STRONGLIFTS)!;
    expect(f.format).toBe("stronglifts");
    expect(f.unit).toBe("lb");
    expect(f.workouts).toHaveLength(2);
    expect(f.workouts[0]).toMatchObject({ title: "Workout A", minutes: 45 });
    expect(f.workouts[0].sets.filter((s) => s.name === "Squat")).toHaveLength(5);
    expect(f.workouts[0].sets.filter((s) => s.name === "Bench Press").map((s) => s.reps)).toEqual([5, 5, 4, 3]);
    expect(f.workouts[1].sets).toEqual([{ name: "Deadlift", weight: 185, reps: 5, warmup: false }]);
    expect(f.skipped).toBe(1);
  });

  it("reads JEFIT's exercise logs section and asks for the unit", () => {
    const f = readImport(JEFIT)!;
    expect(f.format).toBe("jefit");
    expect(f.unit).toBeNull();
    expect(f.workouts).toHaveLength(1);
    expect(f.workouts[0].sets.map((s) => [s.name, s.weight, s.reps])).toEqual([
      ["Barbell Bench Press", 60, 10],
      ["Barbell Bench Press", 80, 8],
      ["Barbell Bench Press", 80, 7],
      ["Dumbbell Curl", 12.5, 12],
    ]);
    expect(f.skipped).toBe(1);
    const out = importEvents(f, defaultMapping(f), "kg", "g", NOW);
    expect(out).toMatchObject({ workouts: 1, sets: 4 });
    expect(out.events.find((e) => e.type === "sessionStart")!.id).toMatch(/^imp-jefit-/);
  });

  it("reads FitNotes: a day is a workout, the unit from the header, cardio with its own distance unit", () => {
    const f = readImport(FITNOTES)!;
    expect(f.format).toBe("fitnotes");
    expect(f.unit).toBe("kg");
    expect(f.workouts).toHaveLength(2);
    expect(f.workouts[0].start).toBe(new Date(2026, 10, 3, 18).getTime());
    expect(f.workouts[0].sets[2]).toMatchObject({ name: "Treadmill", seconds: 900, distance: 2.5, distUnit: "km" });
    expect(f.workouts[1].sets[1]).toMatchObject({ name: "Plank", seconds: 60 });
    const mapping = defaultMapping(f);
    expect(mapping["Treadmill"]).toBe("treadmill-run");
    const out = importEvents(f, mapping, "kg", "g", NOW);
    expect(out).toMatchObject({ workouts: 2, sets: 5 });
    const run = out.events.find((e) => e.type === "set" && e.exerciseId === "treadmill-run");
    expect(run).toMatchObject({ reps: 900, distanceM: 2500, weight: 0 });
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

describe("cardio", () => {
  it.each([
    ["Running", "outdoor-run"],
    ["Running (Treadmill)", "treadmill-run"],
    ["Rowing (Machine)", "rowing-machine"],
    ["Cycling", "outdoor-cycling"],
    ["Cycling (Indoor)", "stationary-bike"],
    ["Walking", "brisk-walk"],
    ["Elliptical Trainer", "elliptical"],
  ])("%s → %s", (name, id) => expect(matchCardio(name)).toBe(id));

  it("logs cardio as time and metres, in miles when the file's weights are in pounds", () => {
    const f = readImport(STRONG)!;
    const mapping = defaultMapping(f);
    expect(mapping["Running"]).toBe("outdoor-run");
    const run = importEvents(f, mapping, "lb", "g", NOW).events.find((e) => e.type === "set" && e.exerciseId === "outdoor-run");
    expect(run).toMatchObject({ reps: 1800, distanceM: 8047 });
    // Strength names with reps stay strength exercises, even with a cardio word in them.
    expect(defaultMapping(readImport(HEVY)!)["Lat Pulldown (Cable)"]).toBe("lat-pulldown");
  });

  it("drops a distance with no time filed under an exercise that takes neither", () => {
    const f = readImport(FITNOTES)!;
    const out = importEvents(f, { ...defaultMapping(f), Treadmill: "bench-press" }, "kg", "g", NOW);
    expect(out.sets).toBe(5); // the time becomes its reps
    const noTime = readImport(FITNOTES.replace("2.5,km,0:15:00", "2.5,km,"))!;
    expect(importEvents(noTime, { ...defaultMapping(noTime), Treadmill: "bench-press" }, "kg", "g", NOW).sets).toBe(4);
  });
});

describe("routines from named workouts", () => {
  const TWICE = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Push day","2 Nov 2026, 17:00","2 Nov 2026, 18:00","","Bench Press (Barbell)","","","0","normal","80","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Bench Press (Barbell)","","","0","warmup","40","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Bench Press (Barbell)","","","1","normal","80","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Bench Press (Barbell)","","","2","normal","80","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Shoulder Press (Dumbbell)","","","0","normal","20","10","","",""
"Legs","6 Nov 2026, 17:00","6 Nov 2026, 18:00","","Squat (Barbell)","","","0","normal","100","5","","",""
"Morning Workout","3 Nov 2026, 07:00","3 Nov 2026, 08:00","","Squat (Barbell)","","","0","normal","100","5","","",""
"Morning Workout","4 Nov 2026, 07:00","4 Nov 2026, 08:00","","Squat (Barbell)","","","0","normal","100","5","","",""
`;

  it("makes one routine per name done twice, from its newest time, and none from plain names", () => {
    const f = readImport(TWICE)!;
    expect([...repeatedTitles(f, NOW).keys()]).toEqual(["push day"]);
    const out = importEvents(f, defaultMapping(f), "kg", "g", NOW);
    const routines = importRoutines(f, out.events, [], NOW);
    expect(routines).toHaveLength(1);
    expect(routines[0]).toMatchObject({
      name: "Push day",
      items: [
        { exerciseId: "bench-press", sets: 2 },
        { exerciseId: "db-shoulder-press", sets: 1 },
      ],
    });
    // Importing again leaves a routine already saved (and maybe edited) alone.
    expect(importRoutines(f, out.events, routines, NOW)).toEqual([]);
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
