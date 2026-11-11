// Starting weights for the exercise pages on the website: the same share of body weight the app
// starts a first session from (`Exercise.start`, scaled by experience and sex in progression.ts),
// shown for two example lifters so a reader has a number to begin with.
import { LEVEL, sexFactor } from "./progression";
import type { Exercise } from "./types";

export type StartCell = { kg: number; lb: number } | "bar";
export type StartRow = { level: "new" | "intermediate"; women: StartCell; men: StartCell };

/** The two example lifters in the table. */
export const EXAMPLE = { women: 65, men: 80 } as const;

/** Whether an exercise gets a table: loaded lifts with a starting share, not carries or cardio. */
export function hasStartTable(e: Exercise): boolean {
  return e.load !== "bodyweight" && e.start > 0 && e.pattern !== "carry" && !e.cardio;
}

function cell(e: Exercise, kg: number): StartCell {
  const lb = Math.max(5, Math.round((kg * 2.20462) / 5) * 5);
  if (e.load === "barbell") {
    // A full Olympic bar is 20 kg; anything lighter is the empty bar or a lighter fixed or EZ bar.
    if (e.needs.includes("barbell") && kg < 20) return "bar";
    return { kg: Math.max(2.5, Math.round(kg / 2.5) * 2.5), lb };
  }
  if (e.load === "dumbbell" || e.load === "kettlebell") {
    // Dumbbells go up by 1 kg at the light end and about 2 kg after.
    const step = kg < 10 ? 1 : 2;
    return { kg: Math.max(1, Math.round(kg / step) * step), lb: Math.max(2, kg < 10 ? Math.round(kg * 2.20462) : lb) };
  }
  return { kg: Math.max(2.5, Math.round(kg / 2.5) * 2.5), lb };
}

/** A weight for about 10 reps, for a new lifter and one with some experience, at the example body weights. */
export function startTable(e: Exercise): StartRow[] {
  return (["new", "intermediate"] as const).map((level) => ({
    level,
    women: cell(e, e.start * EXAMPLE.women * LEVEL[level] * sexFactor(e, "female")),
    men: cell(e, e.start * EXAMPLE.men * LEVEL[level] * sexFactor(e, "male")),
  }));
}
