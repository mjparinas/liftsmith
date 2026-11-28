import type { MessageKey } from "@/locales/en";

import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { parseTitle } from "./titles";

/** A profile title in the app's language ("Early bird", "Squat devotee"), or "" for none or one the app doesn't know. */
export function titleLine(code: unknown): string {
  const x = parseTitle(code);
  if (!x) return "";
  if (x.lift) return t(`mst.t.${x.id}` as MessageKey, { lift: EXERCISE_BY_ID.get(x.lift)?.name ?? x.lift });
  return t(`cos.${x.id}` as MessageKey);
}
