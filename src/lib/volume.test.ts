import { afterEach, describe, expect, it } from "vitest";

import { setLanguage } from "./i18n";
import { fmtVolume, LB } from "./units";

afterEach(() => setLanguage("system"));

describe("fmtVolume", () => {
  it("reads zero as a plain number, never 0k", () => {
    setLanguage("en");
    expect(fmtVolume(0, "kg")).toBe("0 kg");
    expect(fmtVolume(0, "lb")).toBe("0 lb");
  });

  it("shows small totals in full", () => {
    setLanguage("en");
    expect(fmtVolume(40, "kg")).toBe("40 kg");
    expect(fmtVolume(400 * LB, "lb")).toBe("400 lb");
    expect(fmtVolume(999.4, "kg")).toBe("999 kg");
  });

  it("switches to thousands once the rounded total reaches 1,000", () => {
    setLanguage("en");
    expect(fmtVolume(999.6, "kg")).toBe("1k kg");
    expect(fmtVolume(12_440, "kg")).toBe("12.4k kg");
    expect(fmtVolume(5_000 * LB, "lb")).toBe("5k lb");
  });

  it("never shows a negative total", () => {
    setLanguage("en");
    expect(fmtVolume(-5, "kg")).toBe("0 kg");
  });

  it.each(["es", "fr", "de", "it", "ja"] as const)("reads zero without a thousands suffix in %s", (lang) => {
    setLanguage(lang);
    for (const unit of ["kg", "lb"] as const) {
      const text = fmtVolume(0, unit);
      expect(text).toBe(`0 ${unit}`);
      expect(fmtVolume(12_440, unit)).not.toBe(text);
    }
  });
});
