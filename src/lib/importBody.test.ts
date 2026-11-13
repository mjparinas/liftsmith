import { describe, expect, it } from "vitest";

import { bodyCounts, bodyEvents, readBody } from "./importBody";
import { readImport } from "./importCsv";
import type { AppEvent } from "./types";

const NOW = new Date(2026, 10, 12, 20).getTime();

const HEVY = `"date","weight_kg","fat_percent","neck_cm","shoulder_cm","chest_cm","left_bicep_cm","right_bicep_cm","left_forearm_cm","right_forearm_cm","abdomen_cm","waist_cm","hips_cm","left_thigh_cm","right_thigh_cm","left_calf_cm","right_calf_cm"
"2026-11-01","82.4","18.5","","","","35","36","","","90","84","","","","",""
"2026-11-08","81.9","","","","","","","","","","","","","","",""
"2026-11-09","","17.9","","","","","","","","","","","","","",""
`;

const FITNOTES = `Date,Time,Measurement,Value,Unit,Comment
2026-11-02,07:10:00,Bodyweight,181.0,lbs,
2026-11-02,07:10:00,Body Fat,19.0,%,
2026-11-02,07:11:00,Waist,33.0,in,
`;

const SCALE = `Date,Weight,Body fat
2026-11-03,80.2,0.18
2026-11-04,80.0,
`;

describe("reading body exports", () => {
  it("reads Hevy's measurements: weight, body fat, sites in cm, left and right averaged", () => {
    const f = readBody(HEVY)!;
    expect(f).toMatchObject({ format: "hevy", unit: "kg" });
    expect(f.days[0]).toMatchObject({ day: "2026-11-01", weight: 82.4, bodyFat: 18.5, sites: { arm: 35.5, waist: 84 } });
    expect(bodyCounts(f)).toEqual({ weighIns: 2, measures: 2 });
  });

  it("reads FitNotes' long file with each row's unit", () => {
    const f = readBody(FITNOTES)!;
    expect(f).toMatchObject({ format: "fitnotes", unit: "lb" });
    expect(f.days[0]).toMatchObject({ weight: 181, unit: "lb", bodyFat: 19 });
    expect(f.days[0]!.sites.waist).toBeCloseTo(83.82);
  });

  it("reads a plain weigh-in log, asks for the unit, and turns a fraction into a percentage", () => {
    const f = readBody(SCALE)!;
    expect(f).toMatchObject({ format: "weights", unit: null });
    expect(f.days[0]!.bodyFat).toBeCloseTo(18);
  });

  it("leaves workout files and unknown files alone", () => {
    expect(readBody("Date,Exercise,Weight,Reps\n2026-11-01,Squat,100,5")).toBeNull();
    expect(readBody("name,score\nann,3")).toBeNull();
    // And the workout reader doesn't take a body file.
    expect(readImport(SCALE)).toBeNull();
  });
});

describe("body events", () => {
  it("writes weigh-ins and measurements, body fat alone on the last weight, and nothing twice", () => {
    const f = readBody(HEVY)!;
    const out = bodyEvents(f, "kg", [], NOW);
    expect(out).toMatchObject({ weighIns: 3, measures: 2 });
    const bw = out.events.filter((e) => e.type === "bodyweight");
    expect(bw.at(-1)).toMatchObject({ kg: 81.9, bodyFat: 17.9 });
    expect(bodyEvents(f, "kg", out.events, NOW).events).toEqual([]);
  });

  it("keeps a day's own weigh-in and converts pounds and inches", () => {
    const f = readBody(FITNOTES)!;
    const out = bodyEvents(f, "kg", [], NOW);
    expect(out.events.find((e) => e.type === "bodyweight")).toMatchObject({ kg: 82.1, bodyFat: 19 });
    expect(out.events.find((e) => e.type === "measure")).toMatchObject({ site: "waist", cm: 83.8 });
    const mine: AppEvent[] = [{ type: "bodyweight", id: "x", at: new Date(2026, 10, 2, 9).getTime(), kg: 80 }];
    expect(bodyEvents(f, "kg", mine, NOW).weighIns).toBe(0);
  });
});
