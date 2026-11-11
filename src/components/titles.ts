// One look for every title in the app and the web dashboard (Melvin, 2026-11-11: "ensure titles are styled
// nicely and uniformly"). The screen title is the Progress screen's: extra-bold, tight, 1.75rem. Section
// labels are small caps in the muted ink. Use ScreenHeader and Section (app, ui.tsx) or Panel (dashboard)
// rather than these strings where you can; reach for them only for a heading those don't cover.

/** A screen's one h1. */
export const SCREEN_TITLE = "text-[1.75rem] font-extrabold leading-tight tracking-tight";

/** A section label: small caps above a group of cards or settings. */
export const SECTION_LABEL = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

/** A sheet's or a dialog's title. */
export const SHEET_TITLE = "text-xl font-extrabold leading-tight tracking-tight";

/** A card's own heading, when a card has one. */
export const CARD_TITLE = "text-lg font-bold leading-snug tracking-tight";
