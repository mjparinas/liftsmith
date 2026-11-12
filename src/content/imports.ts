// "Switch from another app" pages (/import/<slug>/): how to bring a workout history into Liftsmith from
// another app's CSV export. Only apps the importer reads (importCsv.ts) get a page. The other app is named in
// text only, with the trademark line, and the steps on its side are described in general terms, because its
// menus can change.
export interface ImportSource {
  slug: string;
  /** The other app's name. */
  name: string;
  /** Where its export is, in general terms. */
  exportSteps: string[];
  /** What comes across, in plain words. */
  carries: string[];
  /** Notes particular to this app's file. */
  notes: string[];
}

export const IMPORT_SOURCES: ImportSource[] = [
  {
    slug: "strong",
    name: "Strong",
    exportSteps: [
      "Open Strong and go to its settings.",
      "Choose the option to export your data. Strong saves your workouts as a CSV file.",
      "Save the file somewhere you can reach from the phone or computer you'll use for Liftsmith, like your files app, email or a cloud drive.",
    ],
    carries: [
      "Every workout with its date, name and length",
      "Every set's weight and reps, and timed sets such as planks",
      "Warm-up sets (kept as warm-ups, so they don't count toward your stats)",
      "Drop sets, marked as drop sets",
    ],
    notes: [
      "Some older Strong exports don't say whether the weights are in kilograms or pounds. If yours doesn't, Liftsmith asks you once before importing.",
      "Cardio rows and empty sets are left out, and Liftsmith tells you how many.",
    ],
  },
  {
    slug: "hevy",
    name: "Hevy",
    exportSteps: [
      "Open Hevy and go to its settings.",
      "Find the option to export your workouts. Hevy saves them as a CSV file.",
      "Save the file somewhere you can reach from the phone or computer you'll use for Liftsmith, like your files app, email or a cloud drive.",
    ],
    carries: [
      "Every workout with its date, title and length",
      "Every set's weight and reps, and timed sets such as planks",
      "Warm-up sets (kept as warm-ups, so they don't count toward your stats)",
      "Drop sets and supersets",
    ],
    notes: [
      "Hevy's export says which unit the weights are in, so there's nothing to choose.",
      "Cardio rows and empty sets are left out, and Liftsmith tells you how many.",
    ],
  },
  {
    slug: "fitbod",
    name: "Fitbod",
    exportSteps: [
      "Open Fitbod and go to its settings or your profile.",
      "Choose the option to export your workout data. Fitbod saves your sets as a CSV file.",
      "Save the file somewhere you can reach from the phone or computer you'll use for Liftsmith, like your files app, email or a cloud drive.",
    ],
    carries: [
      "Every set's weight and reps, and timed sets such as planks",
      "Warm-up sets (kept as warm-ups, so they don't count toward your stats)",
      "Workouts rebuilt from the sets' times, with their dates and length",
    ],
    notes: [
      "Fitbod's file lists sets without naming the workouts, so sets less than three hours apart become one workout.",
      "Cardio rows and empty sets are left out, and Liftsmith tells you how many.",
    ],
  },
  {
    slug: "stronglifts",
    name: "StrongLifts",
    exportSteps: [
      "Open StrongLifts and go to its settings.",
      "Choose the option to export your workouts. StrongLifts saves them as a CSV file.",
      "Save the file somewhere you can reach from the phone or computer you'll use for Liftsmith, like your files app, email or a cloud drive.",
    ],
    carries: ["Every workout with its date, name and length", "Every set's reps and weight, including sets where you missed reps"],
    notes: [
      "Liftsmith reads the unit from the weight column. If the file doesn't say, Liftsmith asks you once before importing.",
      "Exercises you skipped (no reps in any set) are left out, and Liftsmith tells you how many.",
    ],
  },
  {
    slug: "jefit",
    name: "JEFIT",
    exportSteps: [
      "Open JEFIT on the web or in the app and find the option to export your data.",
      "JEFIT saves your history as a CSV file with a few sections; Liftsmith reads the exercise logs.",
      "Save the file somewhere you can reach from the phone or computer you'll use for Liftsmith, like your files app, email or a cloud drive.",
    ],
    carries: ["Every workout day with every set's weight and reps"],
    notes: [
      "JEFIT's file doesn't say whether the weights are in kilograms or pounds, so Liftsmith asks you once before importing.",
      "JEFIT logs a day rather than a start time, so each workout is filed under its date.",
    ],
  },
];

export const IMPORT_BY_SLUG = new Map(IMPORT_SOURCES.map((s) => [s.slug, s]));
