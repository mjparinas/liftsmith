import type { Stretch } from "./stretches";
import type { Exercise } from "./types";

// Common form mistakes (Melvin, 2026-11-15: offline form coaching beside the 3D figures). The faults are one shared
// library of about 95, each with three catalogue lines (src/locales/text/ff.ts): the mistake as a lifter would
// notice it, the fix, and a short why. Every exercise and stretch gets two or three of them, matched by movement
// pattern and then by the exercise's id (squats, jumps, presses on a bench, hangs...), so the same fault reads the
// same way everywhere and a new exercise is covered the day it's added. All on the device: no network, no video.
// Shown in the workout's How to sheet and on the exercise page under "Common mistakes", one at a time on the rest
// timer as a form check (Workout preferences, on unless turned off), on stretches and on the website's exercise pages.
// No text here, so the website can use it without the app's catalogues: the app reads the lines in FormFaults.tsx
// (`fault`), the website in src/locales/site/fromApp.ts (`faultWords`).

export const FAULTS = [
  // Squats
  "kneesIn",
  "heelsUp",
  "chestDrop",
  "buttWink",
  "shallow",
  "hipsFirst",
  "elbowsDrop",
  "bounce",
  "padLift",
  "lockHard",
  "barForward",
  // Jumps
  "stiffLanding",
  "landKneesIn",
  "tiredJumps",
  // Hinges
  "roundBack",
  "barDrift",
  "yank",
  "leanBack",
  "squatHinge",
  "tooLow",
  "squatSwing",
  "armLift",
  "archTop",
  "feetPlace",
  "overSwing",
  "earlyArms",
  // Lunges
  "frontKneeIn",
  "tightrope",
  "backFoot",
  "frontHeel",
  "bottomLeg",
  "sideHeel",
  "hipDrop",
  // Presses
  "elbowsFlare",
  "buttUp",
  "chestBounce",
  "shouldersRoll",
  "wristsBack",
  "halfReps",
  "hipsSag",
  "hipsPike",
  "headDrop",
  "flyPress",
  "flyDeep",
  "dipDeep",
  "shrugUp",
  "archPress",
  "aroundFace",
  "noLockout",
  "dipForward",
  "banana",
  "pikeHead",
  // Pulls
  "bodyEnglish",
  "rowShrug",
  "shortPull",
  "twistOpen",
  "faceLow",
  "kip",
  "halfPull",
  "chinReach",
  "pulldownLean",
  "deadShoulders",
  // Carries and holds
  "leanSide",
  "carryHunch",
  "rushSteps",
  "looseLock",
  "breath",
  // Core
  "backLift",
  "neckPull",
  "momentum",
  "armsOnly",
  "sideSag",
  "rolloutArch",
  "turnTorso",
  "hipsShift",
  "eyesOff",
  // Arms and shoulders
  "swing",
  "elbowsForward",
  "dropFast",
  "extFlare",
  "pushdownLean",
  "raiseShrug",
  "shrugRoll",
  "kickUp",
  "curlHips",
  "calfBounce",
  "calfShort",
  "rowTooHigh",
  "bladesSqueeze",
  "torsoRock",
  "kickArch",
  "nordicBend",
  "armBend",
  "elbowDrift",
  "gripDeath",
  // Cardio
  "tooFast",
  "overstride",
  "rowArmsFirst",
  "seatLow",
  "highHops",
  "flop",
  "armsOnlyRope",
  "upright",
  "rails",
  "slouch",
  // Stretches
  "strBounce",
  "strForce",
  "strRush",
  "strRound",
] as const;

export type FaultId = (typeof FAULTS)[number];

type Rule = readonly [RegExp, readonly FaultId[]];

const JUMPS: readonly FaultId[] = ["stiffLanding", "landKneesIn", "tiredJumps"];

// For each pattern, the first rule whose regex matches the exercise's id wins; otherwise the pattern's default.
const RULES: Record<Exclude<Exercise["pattern"], "isolation">, { rules: readonly Rule[]; fallback: readonly FaultId[] }> = {
  squat: {
    rules: [
      [/jump|hop|broad|wall-ball/, JUMPS],
      [/wall-sit/, ["kneesIn", "breath"]],
      [/deep-squat-hold/, ["buttWink", "heelsUp", "breath"]],
      [/leg-press|^(paused-)?hack-squat$|pendulum/, ["padLift", "kneesIn", "lockHard"]],
      [/overhead-squat/, ["barForward", "chestDrop", "kneesIn"]],
      [/thruster|to-press/, ["chestDrop", "kneesIn", "noLockout"]],
      [/^(smith-|paused-|box-)?front-squat$/, ["elbowsDrop", "chestDrop", "kneesIn"]],
      [/pistol|shrimp/, ["kneesIn", "heelsUp", "bounce"]],
      [/walk|pulse|to-row/, ["kneesIn", "chestDrop"]],
      [
        /^(back-squat|pause-squat|tempo-squat|pin-squat|half-squat|box-squat|one-and-a-half-squat|trap-bar-squat)$/,
        ["kneesIn", "hipsFirst", "buttWink"],
      ],
      [/smith/, ["kneesIn", "shallow", "bounce"]],
    ],
    fallback: ["kneesIn", "heelsUp", "chestDrop"],
  },
  hinge: {
    rules: [
      [/swing|figure-eight/, ["squatSwing", "armLift", "roundBack"]],
      [/clean|snatch|high-pull|jerk|devil/, ["earlyArms", "barDrift", "roundBack"]],
      [/slam|toss/, ["armsOnlyRope", "roundBack"]],
      [/single-leg-hip-thrust|single-leg-glute|single-leg-hamstring|marching/, ["archTop", "hipDrop"]],
      [/thrust|bridge|frog-pump/, ["archTop", "feetPlace"]],
      [/back-extension-hold/, ["overSwing", "breath"]],
      [/back-extension|reverse-hyper/, ["overSwing", "momentum"]],
      [/good-morning/, ["roundBack", "squatHinge"]],
      [/single-leg-rdl|kickstand/, ["roundBack", "hipDrop", "squatHinge"]],
      [/rdl|romanian|stiff-leg/, ["roundBack", "squatHinge", "tooLow"]],
      [/suitcase/, ["roundBack", "leanSide"]],
      [/pull-through/, ["squatHinge", "leanBack"]],
      [/hip-airplane/, ["hipDrop", "momentum"]],
      [/deadlift|rack-pull/, ["roundBack", "yank", "hipsFirst", "leanBack"]],
    ],
    fallback: ["roundBack", "squatHinge"],
  },
  lunge: {
    rules: [
      [/jumping|bound/, ["stiffLanding", "frontKneeIn", "tiredJumps"]],
      [/lateral-step-up/, ["bottomLeg", "frontKneeIn"]],
      [/lateral|cossack/, ["sideHeel", "chestDrop"]],
      [/step-down|skater|curtsy|balance/, ["frontKneeIn", "hipDrop"]],
      [/step-up/, ["bottomLeg", "frontKneeIn"]],
      [/overhead/, ["looseLock", "frontKneeIn", "tightrope"]],
      [/split-squat/, ["frontKneeIn", "frontHeel", "backFoot"]],
      [/reverse/, ["frontKneeIn", "tightrope", "backFoot"]],
    ],
    fallback: ["frontKneeIn", "tightrope", "frontHeel"],
  },
  hpush: {
    rules: [
      [/dip/, ["dipDeep", "shrugUp"]],
      [/bottom-hold/, ["hipsSag", "breath"]],
      [/planche/, ["wristsBack", "hipsSag"]],
      [/one-arm-push-up|archer|typewriter|rotation/, ["hipsSag", "twistOpen"]],
      [/push-up/, ["hipsSag", "elbowsFlare", "headDrop"]],
      [/chest-pass/, ["elbowsFlare", "halfReps"]],
      [/floor-press/, ["elbowsFlare", "wristsBack"]],
      [/machine|cable|landmine|band|squeeze|crush/, ["shouldersRoll", "halfReps", "dropFast"]],
      [/^db-|^kb-/, ["elbowsFlare", "shouldersRoll", "halfReps"]],
    ],
    fallback: ["elbowsFlare", "buttUp", "chestBounce"],
  },
  vpush: {
    rules: [
      [/support-hold/, ["shrugUp", "breath"]],
      [/pike/, ["pikeHead", "elbowsFlare"]],
      [/dip/, ["dipDeep", "shrugUp"]],
      [/handstand-push-up/, ["banana", "pikeHead"]],
      [/handstand|wall-walk/, ["banana", "breath"]],
      [/push-press|jerk/, ["dipForward", "noLockout", "archPress"]],
      [/bottoms-up|bent-press|see-saw/, ["archPress", "wristsBack"]],
      [/machine|seated|cable/, ["shrugUp", "halfReps"]],
      [/behind-neck/, ["archPress", "shrugUp"]],
      [/^(overhead-press|smith-standing-press)$/, ["archPress", "aroundFace", "noLockout"]],
    ],
    fallback: ["archPress", "noLockout"],
  },
  hpull: {
    rules: [
      [/face-pull/, ["faceLow", "bodyEnglish"]],
      [/pull-apart/, ["shrugUp", "dropFast"]],
      [/renegade/, ["twistOpen", "hipsSag"]],
      [/inverted|ring-row|ring-single|towel/, ["hipsSag", "shortPull", "rowShrug"]],
      [/one-arm|single-arm|split-stance|alternating/, ["twistOpen", "rowShrug", "shortPull"]],
      [/sled/, ["bodyEnglish", "roundBack"]],
      [
        /barbell-row|bent-over|pendlay|t-bar|landmine-row|gorilla|smith-row|dead-stop|^kb-row|^db-row|^band-row/,
        ["roundBack", "bodyEnglish", "rowShrug"],
      ],
    ],
    fallback: ["rowShrug", "shortPull", "bodyEnglish"],
  },
  vpull: {
    rules: [
      [/pulldown/, ["pulldownLean", "shortPull", "dropFast"]],
      [/scapular/, ["kip", "dropFast"]],
      [/flexed-arm/, ["chinReach", "breath"]],
      [/hang/, ["deadShoulders", "breath"]],
      [/front-lever/, ["hipsPike", "deadShoulders"]],
      [/skin-the-cat|muscle-up/, ["kip", "dropFast"]],
      [/negative/, ["dropFast", "halfPull"]],
    ],
    fallback: ["kip", "halfPull", "chinReach"],
  },
  carry: {
    rules: [
      [/bottoms-up-hold/, ["wristsBack", "breath"]],
      [/bottoms-up/, ["wristsBack", "rushSteps"]],
      [/overhead|waiter/, ["looseLock", "rushSteps"]],
      [/suitcase-hold/, ["leanSide", "breath"]],
      [/suitcase|crossbody|mixed/, ["leanSide", "rushSteps"]],
      [/dead-hang/, ["deadShoulders", "breath"]],
      [/pinch/, ["gripDeath", "carryHunch"]],
      [/hold/, ["carryHunch", "breath"]],
      [/rack|goblet|zercher|bear-hug/, ["carryHunch", "breath", "rushSteps"]],
    ],
    fallback: ["carryHunch", "rushSteps", "leanSide"],
  },
  core: {
    rules: [
      [/copenhagen|side-plank/, ["sideSag", "breath"]],
      [/pallof|anti-rotation/, ["turnTorso", "breath"]],
      [/get-up|arm-bar|windmill/, ["eyesOff", "looseLock"]],
      [/rollout|fallout|body-saw|ab-wheel/, ["rolloutArch", "breath"]],
      [/plank-to-pike|slider/, ["hipsSag", "momentum"]],
      [
        /plank-(shoulder-tap|reach|up-down|drag|pull-through|hip-twist|saw|leg-lift|knee)|spiderman-plank|bear-plank-shoulder/,
        ["hipsSag", "hipsShift"],
      ],
      [/bear-plank/, ["hipsShift", "breath"]],
      [/plank/, ["hipsSag", "hipsPike", "breath"]],
      [/mountain-climber/, ["hipsPike", "hipsSag"]],
      [/bird-dog-row/, ["hipsShift", "twistOpen"]],
      [/bird-dog/, ["hipsShift", "momentum"]],
      [/dip-bar/, ["momentum", "shrugUp"]],
      [/hanging|toes-to-bar|parallel-bar|ring-knee/, ["momentum", "deadShoulders"]],
      [/l-sit|frog-stand/, ["shrugUp", "breath"]],
      [/side-bend/, ["twistOpen", "momentum"]],
      [/dead-bug|hollow/, ["backLift", "breath"]],
      [
        /v-up|jackknife|v-sit|leg-raise|reverse-crunch|flutter|scissor|heel-tap|heel-slide|single-leg-lower|hip-lift|hip-flexor/,
        ["backLift", "momentum"],
      ],
      [/cable-crunch/, ["momentum", "dropFast"]],
      [/overhead-throw/, ["archPress", "momentum"]],
      [/sit-up-throw/, ["neckPull", "momentum"]],
      [/windshield/, ["momentum", "dropFast"]],
      [/twist|woodchop|chop|rotation|throw|toss|lift$|around-the-world/, ["armsOnly", "momentum"]],
      [/crunch|sit-up/, ["neckPull", "momentum"]],
      [/inchworm/, ["hipsSag", "momentum"]],
    ],
    fallback: ["momentum", "breath"],
  },
  cardio: {
    rules: [
      [/burpee-(broad|box|tuck)/, ["flop", "stiffLanding"]],
      [/kb-burpee|med-ball-burpee/, ["flop", "roundBack"]],
      [/burpee|sprawl|squat-thrust/, ["flop", "hipsSag"]],
      [/plank-to-squat/, ["hipsSag", "momentum"]],
      [/plank-jack|mountain-climber/, ["hipsPike", "hipsSag"]],
      [/battle-rope/, ["armsOnlyRope", "tooFast"]],
      [/jump-rope|double-unders|boxer/, ["highHops", "tooFast"]],
      [/rowing|rower/, ["rowArmsFirst", "roundBack", "tooFast"]],
      [/ski-erg/, ["armsOnlyRope", "tooFast"]],
      [/bike|cycling/, ["seatLow", "tooFast"]],
      [/sled-(push|sprint)/, ["upright", "tooFast"]],
      [/sled/, ["roundBack", "tooFast"]],
      [/duck-walk/, ["kneesIn", "chestDrop"]],
      [/crab/, ["hipsSag", "momentum"]],
      [/crawl|plank-walk/, ["hipsShift", "hipsPike"]],
      [/box-step-over/, ["bottomLeg", "tiredJumps"]],
      [/jack/, ["stiffLanding", "tiredJumps"]],
      [/jump|hop|bound|frog|in-and-out|pogo|180/, JUMPS],
      [/treadmill-walk|incline-walk|backward-treadmill|stair-climber|elliptical/, ["rails", "slouch"]],
      [/walk|hiking|rucking/, ["slouch", "overstride"]],
      [/run|sprint|jog|treadmill/, ["tooFast", "overstride"]],
    ],
    fallback: ["tooFast", "slouch"],
  },
};

const ISOLATION: readonly Rule[] = [
  [/walkout|hamstring|slider-leg-curl/, ["hipsSag", "dropFast"]],
  [/side-lying-(leg|adduction)|prone-leg-lift/, ["torsoRock", "dropFast"]],
  [/leg-curl|^nordic|band-assisted-nordic/, ["curlHips", "dropFast"]],
  [/reverse-nordic/, ["nordicBend", "dropFast"]],
  [/leg-extension/, ["kickUp", "dropFast"]],
  [/sissy/, ["dropFast", "halfReps"]],
  [/pogo/, ["highHops", "tiredJumps"]],
  [/calf/, ["calfBounce", "calfShort"]],
  [/tibialis|wrist/, ["halfReps", "dropFast"]],
  [/biceps-hold/, ["elbowsForward", "breath"]],
  [/towel-hang/, ["deadShoulders", "breath"]],
  [/bodyweight-curl|ring-biceps/, ["hipsSag", "elbowsForward"]],
  [/preacher|spider|concentration|machine-curl|lying-cable-curl|incline-db-curl|incline-hammer/, ["halfReps", "dropFast"]],
  [/curl|21s/, ["swing", "elbowsForward", "dropFast"]],
  [/kickback|donkey/, ["kickArch", "dropFast"]], // glutes; the triceps kickbacks are caught first below
  [/pushdown/, ["pushdownLean", "extFlare"]],
  [/elbows-out/, ["halfReps", "dropFast"]],
  [/skull|extension|jm-press|tate/, ["extFlare", "dropFast"]],
  [/dip/, ["dipDeep", "shrugUp"]],
  [/upright-row/, ["rowTooHigh", "swing"]],
  [/shrug/, ["shrugRoll", "halfReps"]],
  [/face-pull/, ["faceLow", "bodyEnglish"]],
  [/rear-delt|reverse-pec|reverse-fly|snow-angel|pass-through|pull-apart/, ["bladesSqueeze", "swing"]],
  [/prone|wall-slide|incline-[yt]-raise|ring-y/, ["shrugUp", "dropFast"]],
  [/front-raise/, ["swing", "raiseShrug"]],
  [/raise|scaption/, ["raiseShrug", "swing"]],
  [/fly|pec-deck|crossover|press-around|chest-circle/, ["flyPress", "flyDeep"]],
  [/pullover|straight-arm/, ["armBend", "dropFast"]],
  [/rotation/, ["elbowDrift", "dropFast"]],
  [/halo/, ["archPress", "momentum"]],
  [/lateral-walk|monster/, ["torsoRock", "kneesIn"]],
  [/abduction|adduction|hydrant|clamshell|side-lying|leg-lift/, ["torsoRock", "dropFast"]],
  [/ball-squeeze/, ["breath", "halfReps"]],
];

function uniq(ids: readonly FaultId[]): FaultId[] {
  return [...new Set(ids)];
}

/** The common mistakes for an exercise, most important first: two or three. */
export function faultIdsFor(ex: Pick<Exercise, "id" | "pattern" | "primary">): FaultId[] {
  const id = ex.id;
  if (ex.pattern === "isolation") {
    // Triceps kickbacks are an arm move, not a glute one.
    if (/kickback/.test(id) && ex.primary.includes("triceps")) return ["swing", "dropFast"];
    const hit = ISOLATION.find(([re]) => re.test(id));
    return uniq(hit ? hit[1] : ["swing", "dropFast"]);
  }
  const { rules, fallback } = RULES[ex.pattern];
  const hit = rules.find(([re]) => re.test(id));
  return uniq(hit ? hit[1] : fallback).slice(0, 3);
}

/** Stretches: holds can be bounced or forced, drills rushed; reaching for the toes rounds the back. */
export function stretchFaultIds(s: Pick<Stretch, "kind" | "for" | "pulse">): FaultId[] {
  if (s.kind === "warm") return s.pulse ? ["tooFast", "breath"] : ["strRush", "strForce"];
  return s.for.includes("hamstrings") ? ["strRound", "strBounce", "strForce"] : ["strBounce", "strForce", "breath"];
}

/**
 * The rest timer's form check: one of the next exercise's mistakes, a different one after each set
 * (the first after the first set), so a lifter sees each of them once over three sets.
 */
export function formCheckId(ex: Pick<Exercise, "id" | "pattern" | "primary">, setsDone: number): FaultId {
  const ids = faultIdsFor(ex);
  return ids[Math.max(0, setsDone - 1) % ids.length]!;
}
