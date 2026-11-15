// Reporting a problem with a real gym's page (Melvin, 2026-11-15: "how do i report an unclaimed gym"; docs/decisions/gyms.md
// "Reporting a gym page"). Shared by the app, the website's report form and the server, so all three read the same list.

/** Why a gym's page is wrong, in the order they're offered. */
export const PLACE_REPORT_REASONS = ["wrong", "closed", "duplicate", "notGym", "other"] as const;
export type PlaceReportReason = (typeof PLACE_REPORT_REASONS)[number];

export const isPlaceReportReason = (x: unknown): x is PlaceReportReason => PLACE_REPORT_REASONS.some((r) => r === x);

export const PLACE_REPORT_LIMITS = {
  /** Characters in the optional note. */
  note: 500,
  /** Reports one person or address can send a day, across every gym. */
  perDay: 10,
} as const;

/** What staff can do with a reported gym page (Admin › Reports). */
export const PLACE_REPORT_ACTIONS = ["dismiss", "hide", "merge", "edit"] as const;
export type PlaceReportAction = (typeof PLACE_REPORT_ACTIONS)[number];
