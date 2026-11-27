// What the workout generator's page hands its client component (server only): one language's words, the equipment
// and its groups by name, and the example workout drawn at build time, which is also what search engines read.
import type { SiteLang } from "@/lib/siteLang";
import { EQUIPMENT_GROUPS } from "@/lib/types";
import { GEN_DEFAULTS, GEN_FOCUS, GEN_GOALS, GEN_KITS, GEN_LEVELS, GEN_MINUTES, kitEquipment } from "@/lib/webWorkout";
import { genView } from "@/lib/webWorkoutView";
import { equipmentGroupLabels, equipmentLabels, genWords } from "@/locales/site/fromApp";
import { genUi } from "@/locales/site/tools/gen";

import type { GeneratorProps } from "./WorkoutGenerator";

// Cardio machines don't change a strength workout (the engine leaves cardio out), so their chips aren't offered.
const GROUP_KEYS = ["free", "benches", "machines", "small"] as const;

export function generatorProps(lang: SiteLang): GeneratorProps {
  const ui = genUi(lang);
  const words = genWords(lang);
  const names = equipmentLabels(lang);
  const titles = equipmentGroupLabels(lang);
  return {
    ui,
    lang,
    initial: genView(GEN_DEFAULTS, lang, ui),
    focuses: GEN_FOCUS.map((f) => [f, words.focuses[f]]),
    goals: [...GEN_GOALS],
    levels: [...GEN_LEVELS],
    kits: GEN_KITS.map((k) => [k, kitEquipment(k)]),
    groups: GROUP_KEYS.map((k, i) => ({ title: titles[k], items: EQUIPMENT_GROUPS[i]!.items.map((e) => [e, names[e]]) })),
    minutes: { min: GEN_MINUTES.min, max: GEN_MINUTES.max, step: GEN_MINUTES.step },
  };
}
