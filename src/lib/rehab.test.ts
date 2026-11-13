import { describe, expect, it } from "vitest";

import { EXERCISE_BY_ID } from "./exercises";
import { english } from "./i18n";
import { REHAB_PROGRAMS } from "./rehab";
import { decodeRoutine, encodeRoutine } from "./routineShare";

describe("rehab programs for physios", () => {
  it("use only exercises in the library that need no equipment beyond a wall or the floor", () => {
    for (const p of REHAB_PROGRAMS) {
      expect(p.items.length).toBeGreaterThanOrEqual(4);
      for (const i of p.items) {
        const ex = EXERCISE_BY_ID.get(i.exerciseId);
        expect(ex, `${p.id}: ${i.exerciseId}`).toBeDefined();
        expect(ex!.needs, `${p.id}: ${i.exerciseId}`).toEqual([]);
        expect(i.sets).toBeGreaterThanOrEqual(1);
        expect(i.sets).toBeLessThanOrEqual(3);
      }
    }
  });

  it("each have a name and a line in English", () => {
    for (const p of REHAB_PROGRAMS) {
      expect(english(`trn.rehab.${p.id}`)).toBeTruthy();
      expect(english(`trn.rehab.${p.id}Body`)).toBeTruthy();
    }
  });

  it("travel as a routine code marked as rehab, which a plain routine code isn't", () => {
    const knee = REHAB_PROGRAMS[0]!;
    const code = encodeRoutine({ name: "Knee", items: knee.items, rehab: true });
    expect(code.endsWith("~rehab")).toBe(true);
    expect(decodeRoutine(code)).toEqual({ name: "Knee", items: knee.items, rehab: true });
    const plain = decodeRoutine(encodeRoutine({ name: "Knee", items: knee.items }));
    expect(plain).toEqual({ name: "Knee", items: knee.items });
  });
});
