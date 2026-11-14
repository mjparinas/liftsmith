import { describe, expect, it } from "vitest";

import { makeProfile, makeWorkout } from "@/test/factories";

import { ACHIEVEMENTS, context, nightOwl } from "./achievements";
import { DANCE_TAPS } from "./demo/dance";
import { derive } from "./derive";
import { inUnits, jokeNumber, LOGO_TAP_GAP_MS, LOGO_TAPS, logoTaps, plateJoke } from "./eggs";
import { LB } from "./units";

const at = (h: number, m = 0) => new Date(2026, 10, 14, h, m).getTime();
const ctxOf = (events: ReturnType<typeof makeWorkout>) => context(events, derive(events, at(12)), makeProfile(), 0);

describe("night owl", () => {
  it("counts a workout that ends after midnight and before 4 am, local time", () => {
    // Starts at 23:50 the night before, ends at 00:02: it's the finish that counts.
    const late = makeWorkout("s1", at(0) - 10 * 60_000, [{}, {}, {}]);
    late[late.length - 1]!.at = at(0, 2);
    expect(nightOwl(ctxOf(late))).toBe(true);
    expect(nightOwl(ctxOf(makeWorkout("s2", at(3, 30), [{}])))).toBe(true);
  });

  it("doesn't count 4 am on, or the evening before", () => {
    expect(nightOwl(ctxOf(makeWorkout("s1", at(4), [{}])))).toBe(false);
    expect(nightOwl(ctxOf(makeWorkout("s2", at(22), [{}])))).toBe(false);
  });

  it("is a secret award that never overlaps Before the sun (a start from 4 to 6 am)", () => {
    const def = ACHIEVEMENTS.find((a) => a.id === "night-owl")!;
    expect(def.secret).toBe(true);
    const ctx = ctxOf(makeWorkout("s1", at(1), [{}]));
    expect(def.value(ctx)).toBe(1);
    expect(ACHIEVEMENTS.find((a) => a.id === "dawn")!.value(ctx)).toBe(0);
  });
});

describe("logo taps", () => {
  const run = (gaps: number[]) => {
    let taps: number[] = [];
    let t = 1000;
    let opened = 0;
    for (const g of [0, ...gaps]) {
      t += g;
      const r = logoTaps(taps, t);
      taps = r.taps;
      if (r.open) opened++;
    }
    return opened;
  };

  it("opens on the seventh quick tap, not before", () => {
    expect(run(Array(LOGO_TAPS - 2).fill(300))).toBe(0);
    expect(run(Array(LOGO_TAPS - 1).fill(300))).toBe(1);
  });

  it("starts again after a pause", () => {
    expect(run([300, 300, 300, LOGO_TAP_GAP_MS + 1, 300, 300])).toBe(0);
  });

  it("needs more taps than the figure's dance, on a different target", () => {
    expect(LOGO_TAPS).toBeGreaterThan(DANCE_TAPS);
  });
});

describe("lifetime in other units", () => {
  it("says how many elephants and friends the total comes to", () => {
    const u = Object.fromEntries(inUnits(60_000).map((x) => [x.id, x.n]));
    expect(u.elephant).toBe(10);
    expect(u.car).toBe(40);
    expect(u.bluewhale).toBe(0.4);
    expect(u.retriever).toBe(2000);
  });

  it("keeps one decimal under 10 and is never negative", () => {
    expect(inUnits(9_000).find((x) => x.id === "elephant")!.n).toBe(1.5);
    expect(inUnits(-5).every((x) => x.n === 0)).toBe(true);
    expect(inUnits(Number.NaN).every((x) => x.n === 0)).toBe(true);
  });
});

describe("plate math", () => {
  const adult = { birthYear: 1990 };
  const teen = { birthYear: 2010 };
  const now = at(12);

  it("spots exactly 420 or 1337 in kilograms or pounds", () => {
    expect(jokeNumber(420)).toBe("420");
    expect(jokeNumber(1337)).toBe("1337");
    expect(jokeNumber(420 * LB)).toBe("420");
    expect(jokeNumber(1337 * LB)).toBe("1337");
    expect(jokeNumber(420.5)).toBeNull();
    expect(jokeNumber(100)).toBeNull();
    expect(jokeNumber(0)).toBeNull();
  });

  it("never shows the 420 joke to someone under 18 or of unknown age", () => {
    expect(plateJoke(420, adult, [], now)).toBe("420");
    expect(plateJoke(420, teen, [], now)).toBeNull();
    expect(plateJoke(420, {}, [], now)).toBeNull();
    expect(plateJoke(1337, teen, [], now)).toBe("1337");
  });

  it("shows each joke once", () => {
    expect(plateJoke(420 * LB, adult, ["420"], now)).toBeNull();
    expect(plateJoke(1337, adult, ["420"], now)).toBe("1337");
  });
});
