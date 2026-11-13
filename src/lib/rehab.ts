// Rehab programs for physios and rehab clinicians (physio support, Melvin 2026-11-13: "add physios support";
// docs/decisions/trainer-mode.md). Starting points a physio assigns in one tap and then adjusts: gentle, mostly
// bodyweight exercises for one area, 2 or 3 sets each, meant to be done a few times a week. They're not a
// treatment plan and the app never says what's right for an injury; the physio decides that. Each travels as
// a routine share code marked as rehab (routineShare.ts), so the client's injury mode keeps every exercise as
// written and asks about pain between sets.
import { t } from "./i18n";
import type { BodyPart, RoutineItem } from "./types";

export interface RehabProgram {
  id: "knee" | "lowBack" | "shoulder" | "ankle" | "hip" | "neck";
  /** The injury area it's built around (injury.ts body parts). */
  part: BodyPart;
  items: RoutineItem[];
  /** Times a week it's suggested at; the physio can change it before assigning. */
  perWeek: number;
}

const item = (exerciseId: string, sets: number): RoutineItem => ({ exerciseId, sets });

export const REHAB_PROGRAMS: readonly RehabProgram[] = [
  {
    id: "knee",
    part: "knee",
    perWeek: 3,
    items: [
      item("wall-sit", 3),
      item("glute-bridge", 3),
      item("side-lying-leg-raise", 2),
      item("split-squat-hold", 2),
      item("bw-calf-raise", 2),
    ],
  },
  {
    id: "lowBack",
    part: "lowerBack",
    perWeek: 3,
    items: [item("bird-dog", 3), item("dead-bug", 3), item("glute-bridge", 3), item("side-plank", 2), item("plank", 2)],
  },
  {
    id: "shoulder",
    part: "shoulder",
    perWeek: 3,
    items: [item("wall-slide", 2), item("prone-y-raise", 2), item("prone-t-raise", 2), item("prone-w-raise", 2), item("wall-push-up", 2)],
  },
  {
    id: "ankle",
    part: "ankle",
    perWeek: 3,
    items: [
      item("bw-calf-raise", 3),
      item("calf-raise-hold", 2),
      item("single-leg-calf-raise", 2),
      item("single-leg-rdl", 2),
      item("reverse-lunge", 2),
    ],
  },
  {
    id: "hip",
    part: "hip",
    perWeek: 3,
    items: [
      item("clamshell", 3),
      item("side-lying-leg-raise", 2),
      item("glute-bridge", 3),
      item("marching-glute-bridge", 2),
      item("split-squat-hold", 2),
    ],
  },
  {
    id: "neck",
    part: "neck",
    perWeek: 3,
    items: [item("wall-slide", 2), item("prone-y-raise", 2), item("prone-t-raise", 2), item("superman", 2), item("bird-dog", 2)],
  },
];

export const rehabName = (p: RehabProgram) => t(`trn.rehab.${p.id}`);
export const rehabBody = (p: RehabProgram) => t(`trn.rehab.${p.id}Body`);
