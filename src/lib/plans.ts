// What each plan includes, for the home page's pricing cards and /pricing/. Keep in step with the Free and Pro
// lists in docs/decisions/money.md and the gates in src/lib/entitlements.ts.

export const FREE_FEATURES = [
  "Workout logger with pre-filled sets",
  "Plate graphic for every barbell set",
  "Automatic rest timer",
  "Lock-screen notification and Live Activity",
  "Every fixed program, from classic 5×5 up",
  "Works offline, no account needed",
];

export const PRO_FEATURES = [
  "Everything in Free",
  "Adaptive workouts from your gym, time and history",
  "Automatic weights and reps, RIR blocks and deloads",
  "Daily readiness: push, as planned or go easy",
  "Recovery map",
  "Advanced stats: one-rep max trends, sets per muscle",
];

/** The pricing page's side-by-side table: one row per feature, with what each plan gets. */
export const PLAN_TABLE: { group: string; rows: { feature: string; free: boolean | string; pro: boolean | string }[] }[] = [
  {
    group: "In the gym",
    rows: [
      { feature: "Log sets in one tap, next set pre-filled", free: true, pro: true },
      { feature: "Plate graphic and plate math", free: true, pro: true },
      { feature: "Rest timer on the lock screen", free: true, pro: true },
      { feature: "Bluetooth heart rate", free: true, pro: true },
      { feature: "3D exercise demos", free: true, pro: true },
      { feature: "Camera rep counting", free: false, pro: true },
      { feature: "Change the plan mid-workout", free: false, pro: true },
    ],
  },
  {
    group: "Planning",
    rows: [
      { feature: "Fixed programs (5×5, 3×5, training max waves and more)", free: true, pro: true },
      { feature: "Your own routines", free: true, pro: true },
      { feature: "Workouts planned from your gym, time and recovery", free: false, pro: true },
      { feature: "Automatic weights and reps with RIR blocks and deloads", free: false, pro: true },
      { feature: "Push/pull/legs and upper/lower splits", free: false, pro: true },
      { feature: "Readiness from sleep, HRV and resting heart rate", free: false, pro: true },
    ],
  },
  {
    group: "Progress",
    rows: [
      { feature: "Coach's notes with a reason for every recommendation", free: true, pro: true },
      { feature: "Health twin from Health Connect or Apple Health", free: true, pro: true },
      { feature: "Recovery map", free: false, pro: true },
      { feature: "Advanced stats: one-rep max trends, sets per muscle", free: false, pro: true },
      { feature: "Plateau detective and goal-date planner", free: false, pro: true },
    ],
  },
  {
    group: "Everything else",
    rows: [
      { feature: "Sync across devices and the web dashboard", free: true, pro: true },
      { feature: "Backup file and CSV export", free: true, pro: true },
      { feature: "Ads", free: "Never", pro: "Never" },
      { feature: "Family sharing", free: false, pro: "Annual plan" },
    ],
  },
];
