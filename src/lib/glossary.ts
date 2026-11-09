// Plain-language explanations for labels that aren't obvious (Melvin, 2026-11-09). Shown by the
// Info button (src/components/Info.tsx) next to the label, in the app and on the web dashboard.
// Keep each one short: what it means, then what it does for the lifter. Text lives here so it can
// be translated in one place later.

export const GLOSSARY = {
  deloadWeeks: {
    title: "Build weeks before a deload",
    body: [
      "Your training runs in blocks. During the build weeks the plan gets a little harder each week: more sets and fewer reps left in the tank.",
      "Then comes one deload week: lighter, about half the sets. It lets your joints and nerves catch up, so you come back stronger. Pick fewer build weeks if you're new or busy, more if you recover well.",
    ],
  },
  deload: {
    title: "Deload week",
    body: ["An easier week after a block of hard training: lighter weights and about half the sets. It isn't lost progress. It's when your body absorbs the work, so the next block starts stronger."],
  },
  rir: {
    title: "RIR: reps in reserve",
    body: [
      "How many more reps you could have done when you stop the set. RIR 2 means you finish the set feeling you had about two more good reps in you.",
      "The plan starts with more in the tank and moves closer to failure across the block.",
    ],
  },
  rpe: {
    title: "RPE: rate of perceived exertion",
    body: [
      "How hard a set felt on a 1 to 10 scale, where 10 is all you had. An 8 means you had about two more good reps in you, the same as 2 reps in reserve.",
      "Pick this scale or reps in reserve in Settings › Workout preferences. The plan works the same either way.",
    ],
  },
  blockWeek: {
    title: "Training block",
    body: ["Where you are in your block: which build week (or the deload), and how many reps to leave in the tank this week. You can change the block length in Settings."],
  },
  readiness: {
    title: "Readiness",
    body: [
      "A score from 0 to 100, with 50 as a normal day. It comes from how recovered your big muscles are, how recent workouts went (reps hit, how sets felt, rep speed and heart rate), and rest days.",
      "65 or more is a push day, 35 or less is an easy day. You can always overrule it.",
    ],
  },
  call: {
    title: "Today's call",
    body: ["Push: your first big lift goes one rep closer to failure. As planned: the normal plan. Go easy: a set fewer, a step lighter and one more rep in reserve. Your choice is saved."],
  },
  volume: {
    title: "Volume",
    body: ["Weight × reps, added up over every working set. It's a rough measure of how much total work you did. Warm-ups aren't counted."],
  },
  e1rm: {
    title: "Estimated one-rep max",
    body: ["The most you could probably lift once, worked out from a heavier set of a few reps (the Epley formula). It lets you compare a set of 5 with a set of 8, so you can see real strength trends without testing a true max."],
  },
  weeklySets: {
    title: "Sets per muscle this week",
    body: ["Hard sets that worked each muscle this week. Secondary muscles count as half a set. The green band, 10 to 20, is the range most research supports for growth. The plan aims at the muscles furthest below it."],
  },
  variety: {
    title: "Exercise variety",
    body: ["How often the plan keeps the same exercise for a muscle. More consistent is better for tracking progress on a lift. More variety keeps things fresh and spreads the stress."],
  },
  recovery: {
    title: "Recovery",
    body: ["Each set tires the muscles it works. That fatigue fades over 2 to 3 days. Fresh is 90% or more, Ready 70%, Recovering 40%, and Fatigued is below 40%. The plan avoids muscles that are still fatigued."],
  },
  superset: {
    title: "Superset",
    body: [
      "Two or more exercises done back to back: one set of the first, then straight to one set of the next, then the rest. It saves time, and works best for exercises that don't tire the same muscles, like a row with a press.",
      "Tap the link between two exercises to pair them, and again to split them.",
    ],
  },
  warmup: {
    title: "Warm-up sets",
    body: ["Lighter sets that build up to your working weight. They aren't counted in your stats or progress. Skip them if you're already warm."],
  },
  firstWeights: {
    title: "Why we ask",
    body: ["Only to suggest a safe first weight for each lift. We start on the light side and adjust after your first session. It stays on your phone."],
  },
} as const satisfies Record<string, { title: string; body: readonly string[] }>;

export type Term = keyof typeof GLOSSARY;
