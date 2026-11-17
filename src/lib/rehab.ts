// Rehab programs for physios and rehab clinicians (physio support, Melvin 2026-11-13: "add physios support";
// docs/decisions/trainer-mode.md). Starting points a physio assigns in one tap and then adjusts: gentle, mostly
// bodyweight exercises for one area, 2 or 3 sets each, meant to be done a few times a week. They're not a
// treatment plan and the app never says what's right for an injury; the physio decides that. Each travels as
// a routine share code marked as rehab (routineShare.ts), so the client's injury mode keeps every exercise as
// written and asks about pain between sets.
import { t } from "./i18n";
import type { BodyPart, RehabProtocolId, RoutineItem } from "./types";

// Rehab protocols (2026-11-17, from the gap list: "Physio rehab protocols with pain tracking"): each program has three
// phases, from calming the area down to full use, and moves from one to the next by the pain rule in rehabPhases.ts.
// Phase 1 is the original program, so codes and routines saved before phases keep their exercises.

/** Phases in every protocol. */
export const PHASES = 3;

export interface RehabProgram {
  id: RehabProtocolId;
  /** The injury area it's built around (injury.ts body parts). */
  part: BodyPart;
  /** Phase 1, the gentle start (the same as `phases[0]`). */
  items: RoutineItem[];
  /** The three phases in order: calm and move, build strength, back to full use. */
  phases: readonly RoutineItem[][];
  /** Times a week it's suggested at; the physio can change it before assigning. */
  perWeek: number;
}

const item = (exerciseId: string, sets: number): RoutineItem => ({ exerciseId, sets });

const program = (id: RehabProtocolId, part: BodyPart, phases: RoutineItem[][]): RehabProgram => ({
  id,
  part,
  perWeek: 3,
  items: phases[0]!,
  phases,
});

export const REHAB_PROGRAMS: readonly RehabProgram[] = [
  program("knee", "knee", [
    [item("wall-sit", 3), item("glute-bridge", 3), item("side-lying-leg-raise", 2), item("split-squat-hold", 2), item("bw-calf-raise", 2)],
    [
      item("bodyweight-squat", 3),
      item("split-squat", 3),
      item("single-leg-glute-bridge", 3),
      item("single-leg-wall-sit", 2),
      item("single-leg-calf-raise", 2),
    ],
    [
      item("reverse-lunge", 3),
      item("assisted-pistol-squat", 2),
      item("single-leg-rdl", 3),
      item("lateral-lunge", 2),
      item("jump-squat", 2),
    ],
  ]),
  program("lowBack", "lowerBack", [
    [item("bird-dog", 3), item("dead-bug", 3), item("glute-bridge", 3), item("side-plank", 2), item("plank", 2)],
    [item("bird-dog-hold", 3), item("dead-bug-hold", 2), item("single-leg-glute-bridge", 3), item("side-plank", 3), item("superman", 2)],
    [
      item("bodyweight-squat", 3),
      item("single-leg-rdl", 3),
      item("side-plank-reach", 2),
      item("long-lever-plank", 2),
      item("reverse-lunge", 2),
    ],
  ]),
  program("shoulder", "shoulder", [
    [item("wall-slide", 2), item("prone-y-raise", 2), item("prone-t-raise", 2), item("prone-w-raise", 2), item("wall-push-up", 2)],
    [item("scap-push-up", 3), item("knee-push-up", 3), item("prone-y-raise", 3), item("reverse-snow-angel", 2), item("towel-row", 3)],
    [item("push-up", 3), item("plank-shoulder-tap", 2), item("pike-push-up", 2), item("prone-snow-angel", 2), item("towel-row", 3)],
  ]),
  program("ankle", "ankle", [
    [
      item("bw-calf-raise", 3),
      item("calf-raise-hold", 2),
      item("single-leg-calf-raise", 2),
      item("single-leg-rdl", 2),
      item("reverse-lunge", 2),
    ],
    [
      item("single-leg-calf-raise", 3),
      item("bent-knee-calf-raise", 3),
      item("tibialis-raise", 2),
      item("single-leg-rdl", 3),
      item("lateral-lunge", 2),
    ],
    [item("pogo-hops", 3), item("single-leg-hop", 2), item("lateral-bound", 2), item("single-leg-calf-raise", 3), item("forward-lunge", 2)],
  ]),
  program("hip", "hip", [
    [
      item("clamshell", 3),
      item("side-lying-leg-raise", 2),
      item("glute-bridge", 3),
      item("marching-glute-bridge", 2),
      item("split-squat-hold", 2),
    ],
    [
      item("single-leg-glute-bridge", 3),
      item("fire-hydrant", 2),
      item("hip-airplane", 2),
      item("split-squat", 3),
      item("side-plank-hip-drop", 2),
    ],
    [item("lateral-lunge", 3), item("single-leg-rdl", 3), item("cossack-squat", 2), item("reverse-lunge", 3), item("skater-squat", 2)],
  ]),
  program("neck", "neck", [
    [item("wall-slide", 2), item("prone-y-raise", 2), item("prone-t-raise", 2), item("superman", 2), item("bird-dog", 2)],
    [item("prone-cobra", 3), item("reverse-snow-angel", 2), item("prone-w-pull", 2), item("towel-row", 3), item("bird-dog-hold", 2)],
    [item("towel-row", 3), item("push-up", 2), item("prone-snow-angel", 2), item("plank", 2), item("superman-hold", 2)],
  ]),
];

export const rehabProgram = (id: string | undefined): RehabProgram | undefined => REHAB_PROGRAMS.find((p) => p.id === id);

/** A phase's exercises (1 to 3), or the first phase's for a number out of range. */
export const phaseItems = (p: RehabProgram, phase: number): RoutineItem[] => p.phases[Math.min(PHASES, Math.max(1, phase)) - 1] ?? p.items;

export const rehabName = (p: RehabProgram) => t(`trn.rehab.${p.id}`);
export const rehabBody = (p: RehabProgram) => t(`trn.rehab.${p.id}Body`);
/** The protocol's area name ("Knee rehab"). */
export const protocolName = (p: RehabProgram) => t(`rhp.area.${p.id}`);
/** "Knee rehab, phase 2", the name a phase's routine gets. */
export const phaseRoutineName = (p: RehabProgram, phase: number) => t("rhp.routineName", { name: protocolName(p), phase });
/** What a phase is for, in a few words ("Build strength"). */
const PHASE_KEYS = [
  ["rhp.phase1", "rhp.phase1Body"],
  ["rhp.phase2", "rhp.phase2Body"],
  ["rhp.phase3", "rhp.phase3Body"],
] as const;
const phaseKeys = (phase: number) => PHASE_KEYS[Math.min(PHASES, Math.max(1, Math.round(phase) || 1)) - 1] ?? PHASE_KEYS[0];
export const phaseTitle = (phase: number) => t(phaseKeys(phase)[0]);
export const phaseBody = (phase: number) => t(phaseKeys(phase)[1]);
