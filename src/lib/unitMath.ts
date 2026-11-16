// Kilograms and pounds with no other imports, so the server pages and emails round a weight exactly like the app
// (number audit, Melvin 2026-11-15: a 100 kg set read 220.46 lb in the app and 220 lb in an email).

/** Kilograms in a pound (exact, by definition). */
export const LB = 0.45359237;

/** A set's weight in the lifter's unit, to at most two decimals: the number every screen, page and email shows. */
export const weightIn = (kg: number, unit: "kg" | "lb"): number => Math.round((unit === "kg" ? kg : kg / LB) * 100) / 100;
