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
];

export const IMPORT_BY_SLUG = new Map(IMPORT_SOURCES.map((s) => [s.slug, s]));
