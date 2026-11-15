// @vitest-environment jsdom
// The TDEE, macro, Wilks and DOTS calculators in another site language (2026-11-15): the inputs, the results and the
// activity levels all come out in the page's language, with nothing left in English.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LocalToolView } from "@/components/site/LocalToolView";
import { activityWords, TDEE_RESULT_KEYS, tdeeWords } from "@/locales/site/fromApp";

import { DotsCalculator } from "./DotsCalculator";
import { MacroCalculator } from "./MacroCalculator";
import { TdeeCalculator } from "./TdeeCalculator";
import { WilksCalculator } from "./WilksCalculator";

afterEach(cleanup);

describe("translated calculators", () => {
  it("TDEE: German inputs, results and activity levels", () => {
    render(<LocalToolView lang="de" slug="tdee-calculator" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("TDEE-Rechner");
    expect(screen.getByText("Geschlecht")).toBeTruthy();
    expect(screen.getByText("Erhaltung")).toBeTruthy();
    expect(screen.getAllByText(activityWords("de").moderate.label).length).toBeGreaterThan(0);
    expect(screen.queryByText("Maintenance")).toBeNull();
    expect(screen.queryByText("Sex")).toBeNull();
  });

  it("the results' lines exist in every language", () => {
    for (const lang of ["es", "fr", "de", "it", "ja"] as const) {
      const w = tdeeWords(lang);
      for (const k of TDEE_RESULT_KEYS) expect(w[k], `${lang} ${k}`).not.toBe(k);
    }
  });

  it("macros, Wilks and DOTS render their translated pages", () => {
    for (const [slug, text] of [
      ["macro-calculator", "Protéines"],
      ["wilks-calculator", "Développé couché"],
      ["dots-calculator", "Soulevé de terre"],
    ] as const) {
      render(<LocalToolView lang="fr" slug={slug} />);
      expect(screen.getAllByText(text, { exact: false }).length, slug).toBeGreaterThan(0);
      cleanup();
    }
  });

  it("English keeps its words", () => {
    render(<TdeeCalculator />);
    expect(screen.getByText("Maintenance")).toBeTruthy();
    cleanup();
    render(<MacroCalculator />);
    expect(screen.getByText("calories a day")).toBeTruthy();
    cleanup();
    render(<WilksCalculator />);
    expect(screen.getByText(/DOTS level: /)).toBeTruthy();
    cleanup();
    render(<DotsCalculator />);
    expect(screen.getByText(/DOTS · /)).toBeTruthy();
  });
});
