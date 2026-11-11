import { describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { backupJson, CSV_HEADER, setsCsv } from "./exportData";
import type { AppEvent } from "./types";

const at = new Date("2026-11-09T18:30:00").getTime();
const events: AppEvent[] = [
  { type: "sessionStart", id: "a", at, sessionId: "sess-123456789", gymId: "g", minutes: 45 },
  {
    type: "set",
    id: "b",
    at: at + 60_000,
    sessionId: "sess-123456789",
    exerciseId: "bench-press",
    weight: 100,
    reps: 5,
    targetReps: 5,
    rir: 2,
    durationSec: 20,
    restSec: 120,
    hrAvg: 130,
    hrMax: 150,
  },
  {
    type: "set",
    id: "c",
    at: at + 240_000,
    sessionId: "sess-123456789",
    exerciseId: "bench-press",
    weight: 100,
    reps: 4,
    targetReps: 5,
    rir: 2,
  },
  {
    type: "set",
    id: "d",
    at: at + 480_000,
    sessionId: "sess-123456789",
    exerciseId: "db-bench-press",
    weight: 30,
    reps: 10,
    targetReps: 10,
    rir: 2,
  },
  { type: "bodyweight", id: "e", at, kg: 80 },
];

describe("export", () => {
  it("writes every working set as a CSV row in the lifter's unit", () => {
    const lines = setsCsv(events, "lb").trim().split("\n");
    expect(lines[0]).toBe(CSV_HEADER.join(","));
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe("2026-11-09,18:31,sess-123,Barbell bench press,1,220.46,lb,,5,5,2,20,120,130,150,,");
    expect(lines[2].split(",")[4]).toBe("2");
    expect(lines[3]).toMatch(/Dumbbell bench press,1,66.14,lb,yes,10/);
  });

  it("quotes cells that need it", () => {
    const csv = setsCsv([{ ...(events[1] as Extract<AppEvent, { type: "set" }>), exerciseId: 'odd, "name"' }], "kg");
    expect(csv).toContain('"odd, ""name"""');
  });

  it("backs up profile, gyms and every event, including body weight", () => {
    const json = JSON.parse(backupJson(defaultProfile(at), [makeGym("commercial", "kg")], events, at));
    expect(json).toMatchObject({ app: "liftsmith", version: 1 });
    expect(json.events).toHaveLength(events.length);
    expect(json.gyms).toHaveLength(1);
    expect(json.events.some((e: AppEvent) => e.type === "bodyweight")).toBe(true);
  });
});
