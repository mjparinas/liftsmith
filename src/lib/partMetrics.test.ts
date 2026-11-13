import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSessionEnd, makeSessionStart, NOW } from "../test/factories";
import { insights } from "./insights";
import { coolHrHigh, hrOfParts, meanFullSpeed, rehabPainTrends, sessionPain } from "./partMetrics";
import { rehabInjuries } from "./trainer";
import type { AppEvent, HrSeriesEvent, PainEvent, SessionPart } from "./types";

const MIN = 60_000;
let n = 0;
const pain = (over: Partial<PainEvent>): PainEvent => ({ type: "pain", id: `p${++n}`, at: NOW, injuryId: "i1", score: 4, ...over });

/** A stream from `start`, one reading every 10 seconds, the bpm from `bpmAt(seconds)`. */
function stream(sessionId: string, start: number, seconds: number, bpmAt: (s: number) => number): HrSeriesEvent {
  const t: number[] = [];
  const bpm: number[] = [];
  for (let s = 0; s <= seconds; s += 10) {
    t.push(s);
    bpm.push(bpmAt(s));
  }
  return { type: "hrSeries", id: `hr-${sessionId}`, at: start + seconds * 1000, sessionId, start, t, bpm };
}

// 5 min warm-up, 30 min lifting, 5 min cool-down.
const parts = (start: number): SessionPart[] => [
  { id: "warm", kind: "warm", start, end: start + 5 * MIN },
  { id: "lift", kind: "lift", start: start + 5 * MIN, end: start + 35 * MIN },
  { id: "cool", kind: "cool", start: start + 35 * MIN, end: start + 40 * MIN },
];

describe("hrOfParts", () => {
  it("cuts the stream by each part's start and end", () => {
    const s = stream("s1", NOW, 40 * 60, (x) => (x < 300 ? 90 : x < 2100 ? 130 : 100));
    const hr = hrOfParts(s, parts(NOW));
    expect(hr.map((h) => [h.kind, h.peak, h.end])).toEqual([
      ["warm", 90, 90],
      ["lift", 130, 130],
      ["cool", 100, 100],
    ]);
    // A reading on a boundary starts the next part.
    expect(hr.map((h) => h.avg)).toEqual([90, 130, 100]);
  });

  it("leaves out a part with no readings in it", () => {
    const s = stream("s1", NOW, 5 * 60, () => 95);
    expect(hrOfParts(s, parts(NOW)).map((h) => h.kind)).toEqual(["warm", "lift"]);
  });
});

describe("sessionPain", () => {
  it("reads before from a rating in the 12 hours before Start, and after from the last in the workout", () => {
    const evs: AppEvent[] = [
      pain({ score: 5, at: NOW - 2 * 3600_000 }),
      pain({ score: 4, at: NOW + 10 * MIN, sessionId: "s1", exerciseId: "wall-sit" }),
      pain({ score: 2, at: NOW + 40 * MIN, sessionId: "s1" }),
    ];
    expect(sessionPain(evs, "s1", NOW)).toEqual([{ injuryId: "i1", before: 5, after: 2, at: NOW + 40 * MIN }]);
  });

  it("falls back to the first rating in the workout, and has no before with only one", () => {
    const two = [pain({ score: 6, at: NOW + MIN, sessionId: "s1" }), pain({ score: 3, at: NOW + 30 * MIN, sessionId: "s1" })];
    expect(sessionPain(two, "s1", NOW)[0]).toMatchObject({ before: 6, after: 3 });
    const one = [pain({ score: 3, at: NOW + 30 * MIN, sessionId: "s1" }), pain({ score: 7, at: NOW - 13 * 3600_000 })];
    expect(sessionPain(one, "s1", NOW)[0]).toEqual({ injuryId: "i1", after: 3, at: NOW + 30 * MIN });
  });
});

/** Rehab workouts on the given days ago, each rated `after` on Done. */
function rehabDays(days: [number, number][]): AppEvent[] {
  return [
    { type: "injury", id: "inj", at: NOW - 40 * DAY, injuryId: "i1", part: "knee" },
    ...days.flatMap(([ago, score], k) => {
      const at = NOW - ago * DAY;
      return [makeSessionStart({ sessionId: `r${k}`, at }), pain({ score, at: at + 30 * MIN, sessionId: `r${k}` })];
    }),
  ];
}

describe("rehabPainTrends", () => {
  it("finds pain after workouts down two points or more over ten days or more", () => {
    const evs = rehabDays([
      [20, 6],
      [16, 5],
      [9, 4],
      [3, 3],
      [1, 3],
    ]);
    expect(rehabPainTrends(evs, NOW)).toEqual([{ injuryId: "i1", from: 6, to: 3, workouts: 5, days: 19, last: NOW - DAY + 30 * MIN }]);
  });

  it("stays quiet on small changes, short spans, few workouts and healed injuries", () => {
    expect(
      rehabPainTrends(
        rehabDays([
          [20, 5],
          [10, 4],
          [1, 4],
        ]),
        NOW,
      ),
    ).toEqual([]);
    expect(
      rehabPainTrends(
        rehabDays([
          [6, 7],
          [4, 5],
          [1, 2],
        ]),
        NOW,
      ),
    ).toEqual([]);
    expect(
      rehabPainTrends(
        rehabDays([
          [20, 7],
          [1, 2],
        ]),
        NOW,
      ),
    ).toEqual([]);
    const healed = [
      ...rehabDays([
        [20, 7],
        [12, 6],
        [1, 2],
      ]),
      { type: "injuryHealed" as const, id: "h", at: NOW, injuryId: "i1" },
    ];
    expect(rehabPainTrends(healed, NOW)).toEqual([]);
  });

  it("becomes a coach's note with the numbers and a step to take, good when down and a warning when up", () => {
    const down = insights({
      events: rehabDays([
        [20, 6],
        [12, 6],
        [2, 3],
        [1, 3],
      ]),
      profile: makeProfile(),
      now: NOW,
    });
    const note = down.find((x) => x.id.startsWith("rehab-pain-"))!;
    expect(note.tone).toBe("good");
    expect(note.title).toBe("Your knee pain is easing");
    expect(note.why).toBe("After workouts it went from 6/10 to 3/10, over 4 workouts in 19 days.");
    expect(note.action).toMatchObject({ kind: "go", route: "injuries" });
    const up = insights({
      events: rehabDays([
        [20, 2],
        [12, 2],
        [2, 5],
        [1, 5],
      ]),
      profile: makeProfile(),
      now: NOW,
    });
    expect(up.find((x) => x.id.startsWith("rehab-pain-"))).toMatchObject({ tone: "warn", title: "Your knee pain is rising" });
  });

  it("shows the coach pain before and after the client's latest rated workout", () => {
    const evs = [...rehabDays([[3, 4]]), pain({ score: 6, at: NOW - 3 * DAY - 3600_000 })];
    expect(rehabInjuries(evs, NOW)[0]!.lastWorkout).toEqual({ before: 6, after: 4, at: NOW - 3 * DAY + 30 * MIN });
    expect(rehabInjuries(rehabDays([[3, 4]]), NOW)[0]!.lastWorkout).toBeUndefined();
  });
});

/** A workout with a cool-down ending at `coolBpm`, lifting at 120. */
function cooled(id: string, at: number, coolBpm: number): AppEvent[] {
  return [
    makeSessionStart({ sessionId: id, at }),
    makeSessionEnd({ sessionId: id, at: at + 40 * MIN, seconds: 40 * 60, parts: parts(at) }),
    stream(id, at, 40 * 60, (x) => (x < 300 ? 95 : x < 2100 ? 120 : coolBpm)),
  ];
}

describe("coolHrHigh", () => {
  it("flags a heart rate that stays up through two of the last three cool-downs", () => {
    const evs = [...cooled("a", NOW - 5 * DAY, 125), ...cooled("b", NOW - 3 * DAY, 90), ...cooled("c", NOW - DAY, 122)];
    expect(coolHrHigh(evs, NOW)).toEqual({ high: 2, of: 3, end: 122, sessionId: "c" });
    const note = insights({ events: evs, profile: makeProfile(), now: NOW }).find((x) => x.id === "cool-hr-c")!;
    expect(note.why).toBe("It ended at 122 bpm in 2 of your last 3 cool-downs, no lower than while you lifted.");
  });

  it("stays quiet when the heart rate comes down, with one high cool-down, or without a stream", () => {
    expect(coolHrHigh([...cooled("a", NOW - 3 * DAY, 95), ...cooled("b", NOW - DAY, 98)], NOW)).toBeNull();
    expect(coolHrHigh([...cooled("a", NOW - 3 * DAY, 90), ...cooled("b", NOW - DAY, 125)], NOW)).toBeNull();
    const noStream = cooled("a", NOW - DAY, 125).filter((e) => e.type !== "hrSeries");
    expect(coolHrHigh([...noStream, ...cooled("b", NOW - 2 * DAY, 125)], NOW)).toBeNull();
  });
});

describe("meanFullSpeed", () => {
  it("averages full reps in m/s and ignores partial reps and unscaled speeds", () => {
    const rep = (kind: string, speed: number, speedIsMetres = true) => ({ kind, speed, speedIsMetres });
    expect(meanFullSpeed([rep("full", 0.6), rep("full", 0.5), rep("partial", 0.2), rep("full", 0.4)])).toBe(0.5);
    expect(meanFullSpeed([rep("full", 30, false)])).toBeUndefined();
    expect(meanFullSpeed([])).toBeUndefined();
  });
});
