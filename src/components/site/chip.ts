/** A chip button for the public calculators' choices (units, lifts, sex). */
export const chip = (on: boolean) =>
  `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;
