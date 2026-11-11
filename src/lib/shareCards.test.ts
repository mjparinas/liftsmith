import { describe, expect, it } from "vitest";

import type { Achievement } from "./achievements";
import type { Pr, SessionSummary } from "./derive";
import {
  badgeShare,
  figureFor,
  levelShare,
  musclesWorked,
  previousBest,
  prShare,
  sessionShares,
  trendShare,
  workoutShare,
  type ShareContext,
  type ShareOptions,
} from "./shareCards";
import { wrap, type CardData } from "./shareImage";

const ctx: ShareContext = {
  unit: "kg",
  game: { level: { level: 12, title: "Iron", into: 0, span: 1, next: null }, streak: { weeks: 8 } as ShareContext["game"]["streak"] },
};
const session: SessionSummary = {
  sessionId: "s1",
  start: Date.UTC(2026, 10, 10, 18),
  seconds: 3300,
  sets: 18,
  volume: 6420,
  exercises: ["back-squat", "bench-press", "barbell-row"],
  avgHr: 131,
  maxHr: 172,
  prs: 1,
};
const pr: Pr = { exerciseId: "bench-press", at: session.start + 600_000, e1rm: 116.7, weight: 100, reps: 5 };
const older: Pr = { exerciseId: "bench-press", at: session.start - 7 * 86_400_000, e1rm: 110, weight: 95, reps: 5 };

const text = (c: CardData) => JSON.stringify(c);
const all = (cards: CardData[]) => cards.map(text).join("\n");

describe("share cards", () => {
  const on: ShareOptions = { weights: true, name: null };
  const off: ShareOptions = { weights: false, name: null };
  const cards = (o: typeof on) => [
    workoutShare(session, [pr], [], ctx).card(o),
    prShare(pr, older, ctx).card(o),
    trendShare({ exerciseId: "back-squat", pct: 8.4, weeks: 6, from: 140, to: 151.8 }, ctx).card(o),
    levelShare({ level: ctx.game.level, streak: ctx.game.streak, xp: 4200, badges: { earned: 9, total: 130 } }, 40, ctx).card(o),
  ];

  it("shows weights only while the switch is on", () => {
    expect(all(cards(on))).toMatch(/kg/);
    expect(all(cards(off))).not.toMatch(/\bkg\b/);
    expect(all(cards(off))).not.toMatch(/6,?420|100 ×|116/);
  });

  it("never carries heart rate", () => {
    for (const o of [on, off]) expect(all(cards(o))).not.toMatch(/131|172|bpm|♥/);
  });

  it("shows the name only when it's passed in", () => {
    expect(all(cards(on))).not.toMatch(/Sam/);
    expect(cards({ weights: true, name: "Sam" }).every((c) => c.name === "Sam")).toBe(true);
  });

  it("puts the PR's numbers and the gain on the PR card", () => {
    const c = prShare(pr, older, ctx).card(on);
    expect(c.big?.value).toBe("100 kg × 5");
    expect(c.tiles[0]?.[1]).toBe("+6.7 kg");
    expect(prShare(pr, null, ctx).card(on).tiles).toEqual([]);
  });

  it("finds the best before a PR on the same lift", () => {
    expect(previousBest([older, pr, { ...older, exerciseId: "back-squat", e1rm: 200 }], pr)).toBe(older);
    expect(previousBest([pr], pr)).toBeNull();
  });

  it("picks the PRs inside a past workout", () => {
    const items = sessionShares(session, [older, pr], ctx);
    expect(items.map((i) => i.kind)).toEqual(["workout", "pr"]);
  });

  it("lists the muscles worked and a compound lift to draw", () => {
    expect(musclesWorked(session.exercises).length).toBeGreaterThan(0);
    expect(figureFor(["plank", "back-squat"])).toBe("back-squat");
  });

  it("puts a badge's medal in its tier colour", () => {
    const a = { id: "workouts", name: "Regular", detail: "Log 100 workouts", icon: "🏋️" } as Achievement;
    expect(badgeShare(a, "gold", ctx).card(on).medal).toEqual({ icon: "🏋️", colour: "#f2c14e" });
  });
});

describe("wrap", () => {
  const measure = (s: string) => s.length * 10;
  it("breaks on spaces and ends a cut line with an ellipsis", () => {
    expect(wrap(measure, "one two three", 80, 2)).toEqual(["one two", "three"]);
    expect(wrap(measure, "one two three four five six", 80, 2)).toEqual(["one two", "three…"]);
  });
  it("breaks text without spaces by character", () => {
    expect(wrap(measure, "あいうえおかきくけこ", 50, 3)).toEqual(["あいうえお", "かきくけこ"]);
  });
});
