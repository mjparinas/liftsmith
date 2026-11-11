// Deeper guides for the most searched exercises: why to do it, common mistakes, sets and reps,
// variations and questions. Shown on /exercises/<id>/ under the setup and cues from the library.
// Text supports **bold** and [links](/path/) like the blog.
import { LOWER_GUIDES } from "./exerciseGuides/lower";
import { UPPER_GUIDES } from "./exerciseGuides/upper";

export type ExerciseGuide = {
  /** What the exercise is good for, in a sentence or two. */
  intro: string;
  /** [the mistake, the fix]. */
  mistakes: [string, string][];
  /** Sets and reps by goal, one line each. */
  sets: string[];
  /** [exercise id, when to pick it]. */
  variations: [string, string][];
  faq: [string, string][];
};

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = { ...LOWER_GUIDES, ...UPPER_GUIDES };
