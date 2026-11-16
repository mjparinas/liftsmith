import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// Admin tests sign in with an emailed link alone; src/server/twoFactor.test.ts switches two-step back to required.
process.env.ADMIN_2FA ??= "optional";

// Friends keeps its last feed in memory (src/lib/socialCache.ts); each test starts without one.
const { beforeEach } = await import("vitest");
const { forgetFriends } = await import("@/lib/socialCache");
beforeEach(() => forgetFriends());

// The app loads one language at a time (src/lib/i18n.ts); tests switch languages on the spot, so every
// catalogue is there from the start.
const { addCatalogue } = await import("@/lib/i18n");
for (const [l, c] of Object.entries({
  es: (await import("@/locales/es")).es,
  fr: (await import("@/locales/fr")).fr,
  de: (await import("@/locales/de")).de,
  it: (await import("@/locales/it")).it,
  ja: (await import("@/locales/ja")).ja,
  pt: (await import("@/locales/pt")).pt,
  ko: (await import("@/locales/ko")).ko,
  pl: (await import("@/locales/pl")).pl,
  tr: (await import("@/locales/tr")).tr,
}))
  addCatalogue(l as "es", c);
