// A workout generator link (www.getliftsmith.com/tools/workout-generator/?w=<code>) opening the app: the app runs
// the same engine on the code (webWorkout.ts) and opens the workout as a shared routine, named in the app's language
// with the same lines the website uses (gen.*), so Save or Start is one tap (docs/decisions/workout-generator.md).
// Without a code it opens Today, which is the app's own daily generator.
import type { MessageKey } from "@/locales/en";

import { t } from "./i18n";
import { encodeRoutine } from "./routineShare";
import { decodeGen, generateWeb, genRoutine } from "./webWorkout";

export function generatorHash(code: string | null): string {
  const o = decodeGen(code);
  if (!o) return "#/today";
  const { plan } = generateWeb(o);
  if (!plan.items.length) return "#/today";
  const name = t("gen.title", { focus: t(`gen.focus.${o.focus}` as MessageKey), minutes: o.minutes });
  return `#/routine/${encodeRoutine(genRoutine(plan, name))}`;
}
