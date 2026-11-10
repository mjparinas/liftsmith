import { describe, expect, it } from "vitest";

import { localDay, quoteOfDay, QUOTES } from "./quotes";

describe("daily quotes", () => {
  it("has at least 365, all different, each with an author", () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(365);
    expect(new Set(QUOTES.map((q) => q.text.toLowerCase())).size).toBe(QUOTES.length);
    for (const q of QUOTES) {
      expect(q.text.trim().length, q.text).toBeGreaterThan(5);
      expect(q.by.trim().length, q.text).toBeGreaterThan(1);
      expect(q.text.length, q.text).toBeLessThanOrEqual(200);
    }
  });

  it("keeps known misattributions out", () => {
    const texts = QUOTES.map((q) => q.text);
    for (const bad of [
      "Be the change",
      "Insanity is doing the same thing",
      "Whether you think you can",
      "It does not matter how slowly you go",
    ]) {
      expect(
        texts.some((t) => t.startsWith(bad)),
        bad,
      ).toBe(false);
    }
    const habit = QUOTES.find((q) => q.text.startsWith("We are what we repeatedly do"));
    expect(habit?.by).toBe("Will Durant");
  });

  it("is the same all day and doesn't repeat within a year", () => {
    const morning = new Date(2026, 10, 9, 7).getTime();
    const night = new Date(2026, 10, 9, 23, 30).getTime();
    expect(quoteOfDay(morning)).toBe(quoteOfDay(night));
    const seen = new Set<string>();
    for (let d = 0; d < 365; d++) seen.add(quoteOfDay(morning + d * 86_400_000).text);
    expect(seen.size).toBe(365);
  });

  it("changes at local midnight", () => {
    expect(localDay(new Date(2026, 0, 2, 0, 1).getTime()) - localDay(new Date(2026, 0, 1, 23, 59).getTime())).toBe(1);
  });
});
