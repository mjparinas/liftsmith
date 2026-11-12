// The exercise guides in the site's other languages (Melvin, 2026-11-12: traffic plan step 4). Same shape and the same
// lifts as the English guides (EXERCISE_GUIDES): every mistake, set line, variation and question is there in each
// language, in the same order (exerciseGuides.test.ts). Links inside the text go to the English pages.
import { localPath } from "@/lib/siteLang";
import type { GuideLang } from "@/locales/site/exercise";

import type { ExerciseGuide } from "../exerciseGuides";
import { DE_GUIDES } from "./de";
import { ES_GUIDES } from "./es";
import { FR_GUIDES } from "./fr";
import { IT_GUIDES } from "./it";
import { JA_GUIDES } from "./ja";

export const GUIDE_LANGS: readonly GuideLang[] = ["es", "fr", "de", "it", "ja"];

export const LOCAL_GUIDES: Record<GuideLang, Record<string, ExerciseGuide>> = {
  es: ES_GUIDES,
  fr: FR_GUIDES,
  de: DE_GUIDES,
  it: IT_GUIDES,
  ja: JA_GUIDES,
};

export const localExercisePath = (lang: GuideLang, id: string) => localPath(lang, `/exercises/${id}/`);
