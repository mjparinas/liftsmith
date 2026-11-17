import { describe, expect, it } from "vitest";

import { plateChart, plateQuestions } from "./plateChart";

describe("plate chart", () => {
  it("adds up the way lifters count plates", () => {
    const [one, two, three, , , , seven] = plateChart();
    expect(one!.lb).toBe(135);
    expect(two!.lbPlus25).toBe(275);
    expect(three!.lb).toBe(315);
    expect(seven!.lb).toBe(675);
    expect(one!.kg20).toBe(60);
    expect(one!.kg25).toBe(70);
  });

  it("answers with the chart's own numbers", () => {
    const text = plateQuestions()
      .map(([, a]) => a)
      .join(" ");
    expect(text).toContain("315 lb");
    expect(text).toContain("275 lb");
    expect(text).toContain("675 lb");
  });
});
