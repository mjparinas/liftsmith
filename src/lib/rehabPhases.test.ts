// Rehab protocols (2026-11-17, docs/decisions/trainer-mode.md "Rehab protocols"): three phases per area, moved by one
// pain rule read from the ratings after each exercise and the day after a rehab workout.
import { describe, expect, it } from "vitest";

import { DAY, makeSessionStart, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import { english } from "./i18n";
import { phaseItems, PHASES, REHAB_PROGRAMS, rehabProgram } from "./rehab";
import {
  movePhase,
  nextDayDue,
  PAIN_EASY,
  PAIN_HIGH,
  PHASE_MIN_SESSIONS,
  phaseCheck,
  phaseTo,
  rehabSessions,
  routinePhase,
  sessionPhase,
} from "./rehabPhases";
import { decodeRoutine, encodeRoutine } from "./routineShare";
import type { AppEvent, PainEvent, Routine } from "./types";

const knee = rehabProgram("knee")!;
const INJ = "inj1";
const injury: AppEvent = { type: "injury", id: "i0", at: NOW - 60 * DAY, injuryId: INJ, part: "knee" };

let n = 0;
/** One rehab workout with the routine, a pain rating after it, and optionally one the next day. */
function session(daysAgo: number, after: number, opts: { before?: number; nextDay?: number; routine?: string } = {}): AppEvent[] {
  const sessionId = `s${++n}`;
  const at = NOW - daysAgo * DAY;
  const out: AppEvent[] = [makeSessionStart({ id: `ss${n}`, sessionId, at, routine: opts.routine ?? "r1" })];
  if (opts.before !== undefined)
    out.push({ type: "pain", id: `pb${n}`, at: at - 3600_000, injuryId: INJ, score: opts.before } satisfies PainEvent);
  out.push({ type: "pain", id: `pa${n}`, at: at + 1800_000, injuryId: INJ, score: after, sessionId, exerciseId: "wall-sit" });
  if (opts.nextDay !== undefined)
    out.push({ type: "pain", id: `pn${n}`, at: at + 20 * 3600_000, injuryId: INJ, score: opts.nextDay, nextDay: sessionId });
  return out;
}

const routine = (over: Partial<Routine> = {}): Routine => ({
  id: "r1",
  name: "Knee rehab, phase 1",
  items: knee.items,
  createdAt: 0,
  updatedAt: 0,
  rehab: true,
  rehabPart: "knee",
  rehabPlan: { id: "knee", phase: 1, since: 0 },
  ...over,
});

const check = (events: AppEvent[], phase = 1) =>
  phaseCheck(
    events,
    rehabSessions(events, "r1").filter((s) => s.start <= NOW),
    new Set([INJ]),
    phase,
  );

describe("protocols", () => {
  it("have three phases of exercises from the library that need nothing beyond a wall or the floor", () => {
    for (const p of REHAB_PROGRAMS) {
      expect(p.phases).toHaveLength(PHASES);
      expect(p.items).toBe(p.phases[0]);
      for (const items of p.phases) {
        expect(items.length).toBeGreaterThanOrEqual(4);
        for (const i of items) {
          expect(EXERCISE_BY_ID.get(i.exerciseId)?.needs, `${p.id}: ${i.exerciseId}`).toEqual([]);
          expect(i.sets).toBeGreaterThanOrEqual(1);
          expect(i.sets).toBeLessThanOrEqual(3);
        }
      }
      // Each phase is its own program, so the physio can tell which one a workout followed.
      expect(new Set(p.phases.map((ph) => ph.map((i) => i.exerciseId).join()))).toHaveProperty("size", PHASES);
      expect(english(`rhp.area.${p.id}`)).toBeTruthy();
    }
  });

  it("each workout matches one phase only", () => {
    for (const p of REHAB_PROGRAMS)
      p.phases.forEach((items, i) =>
        expect(
          sessionPhase(
            p.id,
            items.map((x) => x.exerciseId),
          ),
        ).toBe(i + 1),
      );
    expect(sessionPhase("knee", ["bench-press", "squat"])).toBeUndefined();
  });

  it("travel in the routine code with their phase, and older readers still get the area and times a week", () => {
    const code = encodeRoutine({
      name: "Knee rehab, phase 2",
      items: phaseItems(knee, 2),
      rehab: true,
      rehabPart: "knee",
      perWeek: 3,
      rehabPlan: { id: "knee", phase: 2, self: true, since: 123 },
    });
    expect(code).toContain("~h:knee:3:knee:2:a~rehab");
    expect(decodeRoutine(code)).toMatchObject({ rehabPart: "knee", perWeek: 3, rehabPlan: { id: "knee", phase: 2, self: true } });
    // `since` stays on the phone.
    expect(decodeRoutine(code)!.rehabPlan).not.toHaveProperty("since");
    // An older app split the segment and read only the part and times.
    const [, part, times] = code
      .split("~")
      .find((s) => s.startsWith("h:"))!
      .split(":");
    expect([part, times]).toEqual(["knee", "3"]);
    // A phase or protocol it doesn't know is dropped, the rest kept.
    expect(decodeRoutine(code.replace(":knee:2:a", ":knee:9"))).not.toHaveProperty("rehabPlan");
    expect(decodeRoutine(code.replace(":knee:2:a", ":elbow:1"))).toMatchObject({ rehabPart: "knee", perWeek: 3 });
  });
});

describe("the pain rule", () => {
  it("waits for enough sessions in the phase", () => {
    const events = [injury, ...[10, 8, 6].flatMap((d) => session(d, 1))];
    const c = check(events);
    expect(c).toMatchObject({ status: "early", sessions: 3, need: PHASE_MIN_SESSIONS });
    expect(phaseTo(c)).toBeUndefined();
  });

  it("is ready to move up after enough sessions with easy pain and no flare the next day", () => {
    const events = [injury, ...[14, 12, 10, 8, 6, 4].flatMap((d) => session(d, PAIN_EASY, { nextDay: 1 }))];
    const c = check(events);
    expect(c).toMatchObject({ status: "ready", recent: [2, 2, 2], flare: false });
    expect(phaseTo(c)).toBe(2);
  });

  it("holds while pain after a session is above easy", () => {
    const events = [injury, ...[14, 12, 10, 8, 6].flatMap((d) => session(d, 1)), ...session(4, PAIN_EASY + 1)];
    expect(check(events)).toMatchObject({ status: "hold", recent: [1, 1, 3] });
  });

  it("holds after a flare the next day in phase 1, and goes back a phase in a later one", () => {
    const events = [injury, ...[14, 12, 10, 8, 6].flatMap((d) => session(d, 1)), ...session(4, 1, { before: 1, nextDay: 3 })];
    expect(check(events, 1)).toMatchObject({ status: "hold", flare: true });
    const back = check(events, 2);
    expect(back.status).toBe("back");
    expect(phaseTo(back)).toBe(1);
  });

  it("goes back after high pain in 2 of the last 3, even before enough sessions", () => {
    const events = [injury, ...session(6, PAIN_HIGH), ...session(4, 1), ...session(2, PAIN_HIGH + 1)];
    expect(check(events, 3)).toMatchObject({ status: "back", sessions: 3 });
    // One high one isn't enough.
    expect(check([injury, ...session(6, 1), ...session(4, 1), ...session(2, PAIN_HIGH)], 3).status).toBe("early");
  });

  it("says the last phase is going well instead of moving up", () => {
    const events = [injury, ...[14, 12, 10, 8, 6, 4].flatMap((d) => session(d, 0))];
    const c = check(events, PHASES);
    expect(c.status).toBe("last");
    expect(phaseTo(c)).toBeUndefined();
  });

  it("asks for ratings when the sessions have too few", () => {
    const plain = [10, 9, 8, 7, 6].map((d, i) => makeSessionStart({ id: `x${i}`, sessionId: `x${i}`, at: NOW - d * DAY, routine: "r1" }));
    const events = [injury, ...plain, ...session(4, 0)];
    expect(check(events)).toMatchObject({ status: "unrated", sessions: 6 });
  });

  it("counts only this phase's sessions on the lifter's phone, and only while the injury is active", () => {
    const events = [injury, ...[14, 12, 10, 8, 6, 4].flatMap((d) => session(d, 0))];
    expect(routinePhase(events, routine(), NOW)?.status).toBe("ready");
    expect(routinePhase(events, routine({ rehabPlan: { id: "knee", phase: 2, since: NOW - 7 * DAY } }), NOW)).toMatchObject({
      status: "early",
      sessions: 2,
    });
    const healed: AppEvent = { type: "injuryHealed", id: "h", at: NOW - DAY, injuryId: INJ };
    expect(routinePhase([...events, healed], routine(), NOW)).toBeUndefined();
    expect(routinePhase(events, routine({ rehabPlan: undefined }), NOW)).toBeUndefined();
  });
});

describe("moving a phase", () => {
  it("swaps in that phase's exercises and name, counted from now", () => {
    const moved = movePhase(routine(), 2, "Knee rehab, phase 2", NOW);
    expect(moved).toMatchObject({
      id: "r1",
      name: "Knee rehab, phase 2",
      items: phaseItems(knee, 2),
      rehabPlan: { id: "knee", phase: 2, since: NOW },
      updatedAt: NOW,
    });
    expect(movePhase(routine(), 9, "x", NOW).rehabPlan!.phase).toBe(PHASES);
    const plain = routine({ rehabPlan: undefined });
    expect(movePhase(plain, 2, "x", NOW)).toBe(plain);
  });
});

describe("the day-after check", () => {
  // Midday on NOW's day, local time, so "yesterday" is a calendar day whatever the time zone.
  const today = new Date(NOW);
  today.setHours(12, 0, 0, 0);
  const noon = today.getTime();
  const yesterday = (h: number) => {
    const d = new Date(noon - DAY);
    d.setHours(h, 0, 0, 0);
    return d.getTime();
  };
  const at = (start: number, rated = true): AppEvent[] => [
    makeSessionStart({ id: "y", sessionId: "sy", at: start, routine: "r1" }),
    ...(rated ? [{ type: "pain", id: "py", at: start + 600_000, injuryId: INJ, score: 2, sessionId: "sy" } satisfies PainEvent] : []),
  ];

  it("asks the day after a rated rehab workout, once", () => {
    const events = [injury, ...at(yesterday(18))];
    expect(nextDayDue(events, routine(), noon)).toEqual({ sessionId: "sy", injuryIds: [INJ] });
    const rated: PainEvent = { type: "pain", id: "pn", at: noon, injuryId: INJ, score: 1, nextDay: "sy" };
    expect(nextDayDue([...events, rated], routine(), noon)).toBeUndefined();
  });

  it("doesn't ask the same day, two days later, or without a rating", () => {
    expect(nextDayDue([injury, ...at(noon - 3600_000)], routine(), noon)).toBeUndefined();
    expect(nextDayDue([injury, ...at(yesterday(18) - DAY)], routine(), noon)).toBeUndefined();
    expect(nextDayDue([injury, ...at(yesterday(18), false)], routine(), noon)).toBeUndefined();
  });
});
