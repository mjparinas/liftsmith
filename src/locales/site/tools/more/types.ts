import type { LocalTools } from "../types";

/** The four calculators that joined the translated tools on 2026-11-15: TDEE, macros, Wilks and DOTS. */
export type MoreTools = Pick<LocalTools, "tdee-calculator" | "macro-calculator" | "wilks-calculator" | "dots-calculator">;
