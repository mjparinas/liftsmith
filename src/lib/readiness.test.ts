import { describe, expect, it } from "vitest";

import type { MessageKey } from "@/locales/en";
import { DAY, makeProfile, makeSessionEnd, makeSessionStart, makeSet, NOW } from "@/test/factories";

import { blockWeek } from "./block";
import { t } from "./i18n";
import { healthSignals, readiness, todayFeel } from "./readiness";
import type { AppEvent, FeedbackEvent, FeelEvent, SetEvent } from "./types";

// The daily call ("push", "as planned", "go easy") and every signal behind it. Each threshold is
// checked on both sides, so a nudged number or a flipped comparison fails a test (mutation run,
// 2026-11-13: readiness was the weakest engine file).

const H = 3600_000;
const profile = makeProfile();

/** A workout of `count` bench sets, a minute apart, whose last set was `daysAgo` days before NOW. */
function workout(id: string, daysAgo: number, over: Partial<SetEvent> = {}, count = 3): SetEvent[] {
  const end = NOW - daysAgo * DAY;
  return Array.from({ length: count }, (_, i) => makeSet({ sessionId: id, at: end - (count - 1 - i) * 60_000, ...over }));
}

const feel = (at: number, over: Partial<FeelEvent> = {}): FeelEvent => ({ type: "feel", id: `feel${at}`, at, energy: 0, ...over });
const rate = (sessionId: string, rating: -1 | 0 | 1, i = 0): FeedbackEvent => ({
  type: "feedback",
  id: `fb-${sessionId}-${i}`,
  at: NOW - DAY,
  sessionId,
  exerciseId: "bench-press",
  rating,
});

const points = (events: AppEvent[], key: MessageKey, external = {}) =>
  readiness(events, profile, NOW, external).signals.find((s) => s.text === t(key))?.points;

describe("healthSignals", () => {
  const one = (external: Parameters<typeof healthSignals>[0]) => healthSignals(external).map((s) => [s.points, s.text]);

  it("counts short sleep under 6 hours and good sleep from 8", () => {
    expect(one({ sleepHours: 5.9 })).toEqual([[-12, t("sig.shortSleep")]]);
    expect(one({ sleepHours: 6 })).toEqual([]);
    expect(one({ sleepHours: 7.9 })).toEqual([]);
    expect(one({ sleepHours: 8 })).toEqual([[5, t("sig.goodSleep")]]);
  });

  it("counts HRV more than 10% below its baseline, or more than 5% above", () => {
    expect(one({ hrvDelta: -0.11 })).toEqual([[-10, t("sig.hrvLow")]]);
    expect(one({ hrvDelta: -0.1 })).toEqual([]);
    expect(one({ hrvDelta: 0.05 })).toEqual([]);
    expect(one({ hrvDelta: 0.06 })).toEqual([[5, t("sig.hrvHigh")]]);
  });

  it("counts resting heart rate more than 5 bpm up and breathing 2 or more up", () => {
    expect(one({ restingHrDelta: 5 })).toEqual([]);
    expect(one({ restingHrDelta: 6 })).toEqual([[-8, t("sig.restingUp")]]);
    expect(one({ breathingDelta: 1.9 })).toEqual([]);
    expect(one({ breathingDelta: 2 })).toEqual([[-8, t("sig.breathingUp")]]);
  });

  it("says nothing without health data", () => {
    expect(healthSignals({})).toEqual([]);
  });
});

describe("todayFeel", () => {
  it("takes the newest check-in from today and ignores other days and other events", () => {
    const early = feel(NOW - 2 * H, { energy: -1 });
    const late = feel(NOW - H, { energy: 1 });
    const yesterday = feel(NOW - DAY, { energy: 0 });
    expect(todayFeel([late, early, yesterday, makeSet()], NOW)).toBe(late);
    expect(todayFeel([early, late], NOW)).toBe(late);
    expect(todayFeel([yesterday, makeSet()], NOW)).toBeUndefined();
  });

  it("takes the later of two check-ins at the same time", () => {
    const a = feel(NOW - H, { energy: -1 });
    const b = { ...feel(NOW - H, { energy: 1 }), id: "other" };
    expect(todayFeel([a, b], NOW)).toBe(b);
  });
});

describe("readiness before the first workout", () => {
  it("starts at 50 with the first-workout note and moves only with the check-in", () => {
    expect(readiness([], profile, NOW)).toEqual({
      call: "normal",
      score: 50,
      signals: [{ points: 0, text: t("sig.firstWorkout") }],
      challenge: false,
    });
    const low = readiness([feel(NOW - H, { energy: -1, sore: true })], profile, NOW);
    expect(low.score).toBe(50 - 15 - 8);
    expect(low.signals.map((s) => s.text)).toEqual([t("sig.low"), t("sig.sore"), t("sig.firstWorkout")]);
    expect(readiness([feel(NOW - H, { energy: 1 })], profile, NOW).score).toBe(58);
    expect(readiness([feel(NOW - H, { unwell: true })], profile, NOW).call).toBe("recover");
  });
});

describe("readiness signals", () => {
  it("counts the gap since the last workout: rested from 2 days, a long gap from 10", () => {
    expect(points(workout("a", 1.9), "sig.rested")).toBeUndefined();
    expect(points(workout("a", 2), "sig.rested")).toBe(8);
    expect(points(workout("a", 9.9), "sig.rested")).toBe(8);
    expect(points(workout("a", 9.9), "sig.longGap")).toBeUndefined();
    expect(points(workout("a", 10), "sig.rested")).toBeUndefined();
    expect(points(workout("a", 10), "sig.longGap")).toBe(-5);
  });

  it("counts three workouts in under three days", () => {
    const two = [...workout("a", 2.5), ...workout("b", 1)];
    expect(points(two, "sig.threeInRow")).toBeUndefined();
    expect(points([...two, ...workout("c", 0.2)], "sig.threeInRow")).toBe(-10);
    // A workout exactly three days ago is outside the window.
    expect(points([...workout("a", 3), ...workout("b", 1), ...workout("c", 0.2)], "sig.threeInRow")).toBeUndefined();
  });

  it("counts target reps hit over the last two workouts once there are 4 graded sets", () => {
    const hit = (missed: number, total: number) => [
      ...workout("a", 4, {}, total - missed),
      ...workout("b", 3, { reps: 6, targetReps: 8 }, missed),
    ];
    expect(points(hit(0, 3), "sig.hitAll")).toBeUndefined(); // too few sets to judge
    expect(points(hit(0, 4), "sig.hitAll")).toBe(12);
    expect(points(hit(1, 20), "sig.hitAll")).toBe(12); // 95%
    expect(points(hit(1, 10), "sig.hitAll")).toBeUndefined(); // 90%
    expect(points(hit(3, 10), "sig.missed")).toBeUndefined(); // 70%
    expect(points(hit(4, 10), "sig.missed")).toBe(-12); // 60%
    // Only the last two workouts count.
    const lastTwo = [...workout("a", 4, {}, 2), ...workout("b", 3, {}, 2)];
    expect(points([...workout("old", 6, { reps: 2, targetReps: 8 }, 6), ...lastTwo], "sig.hitAll")).toBe(12);
  });

  it("leaves drop sets and challenge sets out of the hit rate", () => {
    const ev = [
      ...workout("a", 3, {}, 4),
      ...workout("a", 3, { reps: 1, targetReps: 8, tag: "drop" }, 4),
      ...workout("a", 3, { reps: 1, targetReps: 8, challenge: true }, 4),
    ];
    expect(points(ev, "sig.hitAll")).toBe(12);
  });

  it("counts how the last workout felt: two too-hard ratings, or two too-easy and none hard", () => {
    const ev = [...workout("old", 5), ...workout("last", 3)];
    expect(points([...ev, rate("last", -1)], "sig.feltHard")).toBeUndefined();
    expect(points([...ev, rate("last", -1), rate("last", -1, 1)], "sig.feltHard")).toBe(-10);
    expect(points([...ev, rate("last", 1)], "sig.feltEasy")).toBeUndefined();
    expect(points([...ev, rate("last", 1), rate("last", 1, 1)], "sig.feltEasy")).toBe(8);
    expect(points([...ev, rate("last", 1), rate("last", 1, 1), rate("last", -1, 2)], "sig.feltEasy")).toBeUndefined();
    expect(points([...ev, rate("last", 0), rate("last", 0, 1)], "sig.feltEasy")).toBeUndefined();
    // Ratings from an older workout don't count.
    expect(points([...ev, rate("old", -1), rate("old", -1, 1)], "sig.feltHard")).toBeUndefined();
  });

  /** Three earlier workouts at 3 s a rep (an even run of sets, so the median averages two), then the last one. */
  const paced = (lastSecPerRep: number) => [
    ...[6, 5, 4].flatMap((d, i) => [
      ...workout(`p${i}`, d, { durationSec: 20, reps: 8 }, 1),
      ...workout(`p${i}`, d - 0.01, { durationSec: 28, reps: 8 }, 1),
    ]),
    ...workout("last", 3, { durationSec: lastSecPerRep * 8, reps: 8 }),
  ];

  it("counts reps more than 15% slower, or more than 8% quicker, than the lifter's own pace", () => {
    expect(points(paced(3.6), "sig.slowReps")).toBe(-8);
    expect(points(paced(3.42), "sig.slowReps")).toBeUndefined();
    expect(points(paced(2.7), "sig.quickReps")).toBe(5);
    expect(points(paced(2.79), "sig.quickReps")).toBeUndefined();
  });

  it("needs three workouts of an exercise with timed reps before judging pace", () => {
    const short = [...workout("p", 5, { durationSec: 24, reps: 8 }), ...workout("last", 3, { durationSec: 40, reps: 8 })];
    expect(points(short, "sig.slowReps")).toBeUndefined();
    // Sets with no time or no reps don't count toward the pace.
    const untimed = [...workout("p0", 6), ...workout("p1", 5, { reps: 0, durationSec: 20 }), ...workout("last", 3, { durationSec: 40 })];
    expect(points(untimed, "sig.slowReps")).toBeUndefined();
  });

  /** Workouts with an average heart rate: the usual is the median of the earlier ones, newest first. */
  const hr = (latest: number, usual: number[]) => {
    const ends = [latest, ...usual].map((avgHr, i) =>
      makeSessionEnd({ sessionId: `h${i}`, at: NOW - (3 + i) * DAY, avgHr, seconds: 3000 }),
    );
    return [...workout("h0", 3), ...ends];
  };

  it("counts an average heart rate more than 8 above usual, or more than 6 below, once there are 4 workouts", () => {
    expect(points(hr(129, [120, 118, 122]), "sig.hrHigh")).toBe(-8);
    expect(points(hr(128, [120, 118, 122]), "sig.hrHigh")).toBeUndefined();
    expect(points(hr(113, [120, 118, 122]), "sig.hrLow")).toBe(4);
    expect(points(hr(114, [120, 118, 122]), "sig.hrLow")).toBeUndefined();
    expect(points(hr(150, [120, 118]), "sig.hrHigh")).toBeUndefined();
    // The usual is a median of the earlier workouts, so one odd reading doesn't move it.
    expect(points(hr(130, [120, 200, 118, 122]), "sig.hrHigh")).toBe(-8); // usual 121
    expect(points(hr(129, [120, 200, 118, 122]), "sig.hrHigh")).toBeUndefined();
  });

  it("adds health data and the check-in to the score", () => {
    const ev = workout("a", 3);
    const base = readiness(ev, profile, NOW).score;
    expect(readiness(ev, profile, NOW, { sleepHours: 5 }).score).toBe(base - 12);
    expect(readiness(ev, profile, NOW, { checkIn: -1 }).score).toBe(base - 15);
    expect(readiness([...ev, feel(NOW - H, { energy: 1 })], profile, NOW).score).toBe(base + 8);
    expect(readiness([...ev, feel(NOW - H, { energy: 1 })], profile, NOW, { checkIn: -1 }).score).toBe(base - 15);
  });

  it("counts the big muscles: recovered from 90%, still recovering under 60%", () => {
    const fresh = workout("a", 3);
    expect(points(fresh, "sig.bigRecovered")).toBe(10);
    const legDay = workout("a", 0.1, { exerciseId: "back-squat", weight: 140, reps: 8, targetReps: 8, rir: 0 }, 12);
    const back = workout("b", 0.15, { exerciseId: "barbell-row", weight: 100, reps: 8, targetReps: 8, rir: 0 }, 12);
    const chest = workout("c", 0.2, { exerciseId: "bench-press", weight: 100, reps: 8, targetReps: 8, rir: 0 }, 12);
    const r = readiness([...legDay, ...back, ...chest], profile, NOW);
    expect(r.signals.find((s) => s.text === t("sig.bigRecovering"))?.points).toBe(-15);
    expect(r.signals.find((s) => s.text === t("sig.bigRecovered"))).toBeUndefined();
  });
});

describe("the call", () => {
  // Rested (+8), every target hit (+12) and the big muscles recovered (+10): 80 before health data.
  const ev = [...workout("a", 4, {}, 2), ...workout("b", 3, {}, 2)];
  const sore = feel(NOW - H, { sore: true });
  const low = feel(NOW - H, { energy: -1 });
  const call = (events: AppEvent[], external = {}) => readiness(events, profile, NOW, external);

  it("is push from 65 and as planned below it", () => {
    expect(call(ev).score).toBe(80);
    const at65 = call(ev, { sleepHours: 5, restingHrDelta: 6, hrvDelta: 0.06 }); // 80 − 12 − 8 + 5
    expect([at65.score, at65.call]).toEqual([65, "push"]);
    const at66 = call([...ev, sore], { breathingDelta: 2, hrvDelta: 0.06, sleepHours: 8, restingHrDelta: 6 }); // 80 − 8 − 8 + 5 + 5 − 8
    expect([at66.score, at66.call]).toEqual([66, "push"]);
    const at57 = call(ev, { sleepHours: 5, restingHrDelta: 6, breathingDelta: 2, hrvDelta: 0.06 }); // 57
    expect([at57.score, at57.call]).toEqual([57, "normal"]);
    const at61 = call([...ev, sore], { sleepHours: 8, restingHrDelta: 6, breathingDelta: 2 }); // 80 − 8 + 5 − 8 − 8
    expect([at61.score, at61.call]).toEqual([61, "normal"]);
  });

  it("is go easy at 35 and under, and as planned just above", () => {
    const at42 = call([...ev, low], { sleepHours: 5, restingHrDelta: 6, breathingDelta: 2, hrvDelta: 0.06 }); // 57 − 15 = 42
    expect([at42.score, at42.call]).toEqual([42, "normal"]);
    const at39 = call([...ev, low], { hrvDelta: -0.2, restingHrDelta: 6, breathingDelta: 2 }); // 80 − 10 − 8 − 8 − 15
    expect([at39.score, at39.call]).toEqual([39, "normal"]);
    const at31 = call([...ev, feel(NOW - H, { energy: -1, sore: true })], { hrvDelta: -0.2, restingHrDelta: 6, breathingDelta: 2 });
    expect([at31.score, at31.call]).toEqual([31, "recover"]);
    const at37 = call([...ev, low], { sleepHours: 5, restingHrDelta: 6, breathingDelta: 2 }); // 80 − 12 − 8 − 8 − 15 = 37
    expect([at37.score, at37.call]).toEqual([37, "normal"]);
    const at35 = call([...ev, low], { sleepHours: 5, hrvDelta: -0.2, restingHrDelta: 6 }); // 80 − 12 − 10 − 8 − 15 = 35
    expect([at35.score, at35.call]).toEqual([35, "recover"]);
  });

  it("never says push in a deload week, and always says go easy when unwell", () => {
    const build = Math.min(6, Math.max(3, profile.blockWeeks));
    const deload = { ...profile, blockStart: NOW - build * 7 * DAY - DAY };
    expect(blockWeek(deload, NOW).deload).toBe(true);
    expect(readiness(ev, profile, NOW).call).toBe("push");
    expect(readiness(ev, deload, NOW).call).toBe("normal");
    expect(readiness([...ev, feel(NOW - H, { energy: -1, sore: true })], deload, NOW, { sleepHours: 4, hrvDelta: -0.3 }).call).toBe(
      "recover",
    );
    expect(call([...ev, feel(NOW - H, { unwell: true, energy: 1 })], { sleepHours: 9 }).call).toBe("recover");
  });

  it("keeps the score between 0 and 100", () => {
    const worst = call([...ev, feel(NOW - H, { unwell: true, energy: -1, sore: true })], {
      sleepHours: 3,
      hrvDelta: -0.5,
      restingHrDelta: 20,
      breathingDelta: 5,
    }); // 80 − 12 − 10 − 8 − 8 − 25 − 15 − 8 = −6
    expect(worst.score).toBe(0);
    const best = call([...ev, feel(NOW - H, { energy: 1 })], { sleepHours: 9, hrvDelta: 0.2 }); // 80 + 8 + 5 + 5 = 98
    expect(best.score).toBe(98);
  });

  it("lists the biggest signals first", () => {
    const r = call([...ev, sore], { sleepHours: 5, hrvDelta: 0.06 });
    expect(r.signals.map((s) => s.points)).toEqual([12, -12, 10, 8, -8, 5]);
  });
});

describe("challenge days", () => {
  const ev = [...workout("a", 4, {}, 2), ...workout("b", 3, {}, 2)];
  // The same push day on 60 different dates: the daily roll offers a challenge on some, never on all.
  const days = Array.from({ length: 60 }, (_, i) => NOW + i * DAY);
  const shifted = (now: number, extra: AppEvent[] = []) =>
    readiness(
      [...ev, ...extra].map((e) => ({ ...e, at: e.at + (now - NOW) })),
      { ...profile, blockStart: now },
      now,
    );

  it("comes on about three push days in ten", () => {
    const offered = days.filter((d) => shifted(d).challenge).length;
    expect(days.every((d) => shifted(d).call === "push")).toBe(true);
    expect(offered).toBeGreaterThan(6);
    expect(offered).toBeLessThan(30);
  });

  it("never comes within a week of the last challenge, and comes back after it", () => {
    const offered = days.filter((d) => shifted(d).challenge);
    for (const d of offered.slice(0, 5)) {
      expect(shifted(d, [makeSessionStart({ sessionId: "ch", at: NOW - 6 * DAY, challenge: true })]).challenge).toBe(false);
      expect(shifted(d, [makeSessionStart({ sessionId: "ch", at: NOW - 7 * DAY - H, challenge: true })]).challenge).toBe(true);
      // A plain workout start doesn't count as a challenge.
      expect(shifted(d, [makeSessionStart({ sessionId: "ch", at: NOW - 2 * DAY })]).challenge).toBe(true);
    }
  });

  it("never comes on a day that isn't a push", () => {
    for (const d of days) {
      const r = readiness(
        ev.map((e) => ({ ...e, at: e.at + (d - NOW) })),
        { ...profile, blockStart: d },
        d,
        { sleepHours: 5, hrvDelta: -0.2 },
      );
      expect(r.call).not.toBe("push");
      expect(r.challenge).toBe(false);
    }
  });
});
