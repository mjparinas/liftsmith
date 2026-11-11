// Titles and descriptions for the exercise pages: exercises with a guide say what the guide adds.
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";

import { MUSCLE_NAME } from "./seo";
import { hasStartTable } from "./startTable";
import type { Exercise } from "./types";

const muscles = (e: Exercise) => e.primary.map((m) => MUSCLE_NAME[m].toLowerCase()).join(" and ");

/** Title and description: exercises with a guide say what the guide adds. */
export function exerciseMeta(e: Exercise): { title: string; description: string } {
  if (!EXERCISE_GUIDES[e.id]) {
    return {
      title: `${e.name}: form, muscles worked and alternatives`,
      description: `How to do the ${e.name.toLowerCase()} with good form: setup, cues, a 3D demo, the muscles it works (${muscles(e)}), equipment and the best alternatives.`,
    };
  }
  return {
    title: `${e.name}: form, common mistakes, sets and reps`,
    description: `How to do the ${e.name.toLowerCase()}: setup and cues, common mistakes, sets and reps${hasStartTable(e) ? ", a starting weight" : ""}, the muscles it works and the best alternatives.`,
  };
}
