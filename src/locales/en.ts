// English, the source language. Keys are grouped by screen. Plurals use the platform's plural rules
// (Intl.PluralRules): give `one` and `other`, and the forms other languages need (few, many) in theirs.
// Placeholders are {name}; numbers passed in are formatted for the language.

export const en = {
  // App shell
  "tab.today": "Today",
  "tab.recovery": "Recovery",
  "tab.progress": "Progress",
  "tab.awards": "Awards",
  "tab.gyms": "Gyms",
  "nav.main": "Main",
  "nav.back.today": "Today",

  // Today
  "today.morning": "Good morning",
  "today.afternoon": "Good afternoon",
  "today.evening": "Good evening",
  "today.hello": "{greeting}, {name}",
  "today.start": "Start workout",

  // Workout
  "workout.setsDone": "{done}/{total} sets",
  "workout.end": "End",
  "workout.setOf": "Set {n} of {total}",
  "workout.warmupOf": "Warm-up {n} of {total}",
  "workout.logSet": "Log set",
  "workout.logWarmup": "Log warm-up",
  "workout.logNow": "Log set now",
  "workout.finish": "Finish workout",
  "workout.rest": "Rest",
  "workout.restLeft": "{time} of rest left",
  "workout.add30": "+30 s",
  "workout.skipRest": "Skip rest",
  "workout.skipWarmup": "Skip warm-up",
  "workout.nextUp": "Next up:",
  "workout.comingUp": "Coming up",
  "workout.howTo": "How to ›",
  "workout.howToLabel": "How to do it",
  // Coaching helpers on the workout screen (CoachExtras.tsx)
  "coach.why": "Why?",
  "coach.changePlan": "Change the plan",
  "coach.whyTitle": "Why this for {name}",
  "coach.gotIt": "Got it",
  "coach.fits": "Done. The rest of the workout now fits.",
  "coach.back": "Back to the workout",
  "coach.short": "Short on time",
  "coach.shortHint": "About {min} min left as planned. The big lifts stay; smaller exercises lose sets first.",
  "coach.minLeft": "{min} min left",
  "coach.alreadyShort": "It’s already a short finish from here.",
  "coach.taken": "{items} taken?",
  "coach.later": "Do {name} later",
  "coach.swapOther": "Or swap to something that needs other equipment:",
  "coach.swap": "Swap",
  "coach.saveSetup": "Save setup",
  "coach.setupTitle": "{name} at {gym}",
  "coach.setupHint": "Shown here next time, so you set it up right the first time.",
  "coach.save": "Save",
  "coach.placeholder": "e.g. 4",
  "workout.swap": "Swap exercise",
  "workout.adjust": "Adjust this set",
  "workout.weight": "weight",
  "workout.reps": "reps",
  "workout.seconds": "seconds",
  "workout.each": "{unit} each",
  "workout.sr.rest": "Rest, {time}",
  "workout.sr.tenLeft": "10 seconds of rest left",
  "workout.sr.over": "Rest over. Next: {load} for {reps}",
  "workout.more": "More {what}",
  "workout.less": "Less {what}",

  // Settings › Language
  "settings.language": "Language",
  "settings.language.system": "Match my phone",
  "settings.language.note": "Match my phone follows the language set for Liftsmith in your phone's settings. Numbers, dates and units follow your region. Some screens are still in English while translation is under way.",
} as const;

export type MessageKey = keyof typeof en;
